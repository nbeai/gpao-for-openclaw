import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  __beaiRuntimeTestBuildContextMeshResolveRequest,
  __beaiRuntimeTestContextMeshTurnStartPolicy,
  __beaiRuntimeTestRenderTurnStartContext,
  __beaiRuntimeTestStripMetaEnvelope
} from "../dist/index.js";

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "beai-runtime-context-mesh-"));
const vaultDir = path.join(cwd, "beai-vault", "inbox");
fs.mkdirSync(vaultDir, { recursive: true });
fs.writeFileSync(
  path.join(vaultDir, "gpao-package-decision.md"),
  [
    "# GPAO Package decision",
    "",
    "The user's package target is GPAO Operating Package, not BEAI Harness archive.",
    "BEAI Package is the runtime component inside GPAO.",
    "If the user asks an ambiguous package question after a new session, recover this target before answering."
  ].join("\n")
);

const result = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "그럼 이제 만들어도 되는 상태야?",
  sessionKey: "agent:main:telegram:default:direct:test",
  sessionBoundaryLikely: true,
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins; no durable memory promotion",
    answeringRule: "read must-read hits before answering",
    nextAction: "recover package target before direct answer",
    hits: [
      {
        selectionTier: "must-read",
        title: "GPAO package decision",
        path: "inbox/gpao-package-decision.md",
        excerpt: "GPAO Operating Package target"
      }
    ]
  }
});

const strippedTelegramEnvelope = __beaiRuntimeTestStripMetaEnvelope(
  [
    "```json",
    "{\"chatId\":123,\"messageId\":6125,\"sender\":{\"name\":\"Park Jongyoon\"},\"sessionKey\":\"agent:main:telegram:default:direct:test\"}",
    "```",
    "",
    "```json",
    "{\"delivery\":\"telegram\",\"conversation\":{\"id\":\"default\"},\"messageId\":6126}",
    "```",
    "",
    "그럼 이제 만들어도 되는 상태야?"
  ].join("\n")
);
const strippedCliEnvelope = __beaiRuntimeTestStripMetaEnvelope(
  [
    "```json",
    "{\"label\":\"cli\",\"id\":\"cli\"}",
    "```",
    "",
    "그럼 이제 만들어도 되는 상태야?"
  ].join("\n")
);

assert.ok(result.carriedHandoff, "Context Mesh handoff should exist");
assert.equal(result.carriedHandoff?.reason, "context_mesh_turn_start_resolve");
assert.equal(result.responseRole, "diagnosis");
assert.ok(result.judgmentTags.includes("context_mesh_must_read_hard_gate"));
assert.ok(result.judgmentTags.includes("context_mesh_body_loaded"));
assert.ok(result.judgmentTags.includes("gpao_openclaw_tcell_task_packet"));
assert.ok(result.judgmentTags.includes("tcell_task_markov_blanket"));
assert.match(result.promptContext, /handoff_state:/);
assert.match(result.promptContext, /must_compare_before_answer:/);
assert.match(result.promptContext, /GPAO_OPENCLAW_TCELL_TASK_PACKET/);
assert.match(result.promptContext, /GPAO Operating Package/);
assert.equal(result.tcellPacket?.kind, "gpao_openclaw_tcell_task_packet");
assert.equal(result.tcellPacket?.task_markov_blanket.authority_boundary.includes("Current user request wins"), true);
assert.match(result.guardedOverapprovalSample, /검증|확인|근거|상태|세션|맥락/);
const strongerContinuation = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "좋아. 그럼 계속 진행해.",
  sessionKey: "agent:main:telegram:default:direct:new-session",
  sessionBoundaryLikely: true,
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins; prior context is comparison evidence",
    answeringRule: "recover target and pending action before direct answer",
    nextAction: "continue GPAO package upgrade only after naming the recovered target",
    hits: [
      {
        selectionTier: "must-read",
        title: "GPAO package decision",
        path: "inbox/gpao-package-decision.md",
        excerpt: "GPAO Operating Package target"
      }
    ]
  }
});

assert.equal(strongerContinuation.responseRole, "diagnosis");
assert.ok(strongerContinuation.judgmentTags.includes("context_mesh_must_read_hard_gate"));
assert.match(strongerContinuation.promptContext, /do not answer with a bare yes\/no/);
assert.match(strongerContinuation.promptContext, /GPAO Operating Package/);
assert.equal(strippedTelegramEnvelope, "그럼 이제 만들어도 되는 상태야?");
assert.equal(strippedCliEnvelope, "그럼 이제 만들어도 되는 상태야?");

const naturalNewSessionRecommendation = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "너는 어떤 방식을 추천하는데?",
  sessionKey: "agent:main:telegram:default:direct:natural-new-session",
  sessionBoundaryLikely: true,
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins; Context Mesh is evidence, not hidden authority",
    answeringRule: "recover the immediately prior package drift decision before recommending a method",
    nextAction: "recommend rebuilding the zip and manifest from the live patched install when package/live hashes drift",
    hits: [
      {
        selectionTier: "must-read",
        title: "OpenClaw GPAO package live install drift decision",
        path: "inbox/gpao-package-decision.md",
        excerpt: "live install has a fail-open patch; recreate zip/manifest rather than answer generically"
      }
    ]
  }
});

assert.equal(naturalNewSessionRecommendation.responseRole, "diagnosis");
assert.ok(naturalNewSessionRecommendation.judgmentTags.includes("context_mesh_must_read_hard_gate"));
assert.ok(naturalNewSessionRecommendation.judgmentTags.includes("context_mesh_loaded_evidence_no_extra_tool_requirement"));
assert.equal(naturalNewSessionRecommendation.flowToolNeed, "none");
assert.match(naturalNewSessionRecommendation.promptContext, /recover the immediately prior package drift decision/);
assert.match(naturalNewSessionRecommendation.promptContext, /recommend rebuilding the zip and manifest/);
assert.match(naturalNewSessionRecommendation.promptContext, /OpenClaw GPAO package live install drift decision/);

const alwaysModeRunsForPlainQuestion = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "오늘은 무엇부터 하면 좋지?",
  sessionKey: "agent:main:telegram:default:direct:plain-question",
  contextMeshTurnStart: "always",
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins",
    answeringRule: "use local project priorities before generic productivity advice",
    nextAction: "choose the highest-priority GPAO surface before opening new work",
    hits: [
      {
        selectionTier: "must-read",
        title: "GPAO project priorities",
        path: "inbox/gpao-package-decision.md",
        excerpt: "Context Mesh should anchor ordinary first-turn project questions too"
      }
    ]
  }
});

assert.ok(alwaysModeRunsForPlainQuestion.carriedHandoff, "Always mode should allow ordinary first-turn questions to be anchored by Context Mesh evidence");
assert.match(alwaysModeRunsForPlainQuestion.promptContext, /use local project priorities before generic productivity advice/);

const augmentedResolveRequest = __beaiRuntimeTestBuildContextMeshResolveRequest("너는 어떤 방식을 추천하는데?", {
  sessionBoundaryLikely: true,
  contextMeshTurnStart: "always",
  activeFlowHint: [
    "current_flow: OpenClaw GPAO package live install drift decision",
    "pending_next_action: choose between rebuilding the zip/manifest and documenting the live patch",
    "locked_decision: current live install has a progressAckHook fail-open patch"
  ].join("\n")
});

assert.match(augmentedResolveRequest, /Current user request:/);
assert.match(augmentedResolveRequest, /너는 어떤 방식을 추천하는데/);
assert.match(augmentedResolveRequest, /Recent active flow hints/);
assert.match(augmentedResolveRequest, /rebuilding the zip\/manifest/);

const activeFlowWinsOverBroadContextMesh = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "너는 어떤 방식을 추천하는데?",
  sessionKey: "agent:main:telegram:default:direct:active-flow-wins",
  sessionBoundaryLikely: true,
  activeFlowHint: [
    "runtime_memory: - OpenClaw GPAO 패키지 판단 기준: live 설치본과 zip/manifest 정합성이 어긋난 상태에서 선택지가 (1) 현재 live 설치본 기준으로 새 zip/manifest 재생성, (2) 기존 zip에 release note만 추가라면, live 설치본이 의도된 실제 런타임이고 검증 가능할 때는 1번을 기본 추천한다.",
    "current_flow: Context Mesh turn-start resolve"
  ].join("\n"),
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins",
    answeringRule: "use broad project context before generic advice",
    nextAction: "use general Context Mesh background",
    hits: [
      {
        selectionTier: "must-read",
        title: "Broad Context Mesh design background",
        path: "inbox/gpao-package-decision.md",
        excerpt: "general context mesh architecture"
      }
    ]
  }
});

assert.ok(activeFlowWinsOverBroadContextMesh.judgmentTags.includes("active_flow_runtime_state_gate"));
assert.match(activeFlowWinsOverBroadContextMesh.carriedHandoff?.text || "", /현재 live 설치본 기준으로 새 zip\/manifest 재생성/);
assert.match(activeFlowWinsOverBroadContextMesh.promptContext, /OpenClaw GPAO active-flow recovery/);
assert.match(activeFlowWinsOverBroadContextMesh.promptContext, /Broad Context Mesh design background/);

const mcpTelegramFollowupWinsOverOldPackageFlow = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "그럼 내가 보여준것 보다 더 많이 설치 할 수 있는거야?",
  sessionKey: "agent:main:telegram:default:direct:mcp-followup",
  sessionBoundaryLikely: true,
  activeFlowHint: [
    "recent_telegram_assistant_reply: 연결 완료한 MCP • korean-stats → KOSIS 공식 통계: OpenClaw MCP 등록, doctor 통과, probe 통과, 도구 14개 확인 • archhub → 건축HUB/건축물대장·인허가: 등록, doctor 통과, probe 통과, 도구 12개 확인 • korean-patent → KIPRIS 특허·상표·디자인: 등록, doctor 통과, probe 통과, 도구 7개 확인",
    "recent_telegram_assistant_reply: 아직 바로 연결하지 않은 것 • korean-law-mcp: 법제처 OC 키 필요 • korean-dart-mcp: OpenDART API 키 필요 • kordoc: 로컬 문서 샌드박스 테스트 필요 • schoolinfo-mcp: 교육 도메인팩 후보",
    "runtime_memory: - OpenClaw GPAO 패키지 판단 기준: live 설치본과 zip/manifest 정합성이 어긋난 상태에서는 새 zip/manifest 재생성을 기본 추천한다."
  ].join("\n"),
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins",
    answeringRule: "use local evidence before generic install advice",
    nextAction: "recover the recent Telegram MCP installation target",
    hits: [
      {
        selectionTier: "must-read",
        title: "Broad OpenClaw package background",
        path: "inbox/gpao-package-decision.md",
        excerpt: "package release context"
      }
    ]
  }
});

assert.ok(mcpTelegramFollowupWinsOverOldPackageFlow.judgmentTags.includes("active_flow_runtime_state_gate"));
assert.ok(mcpTelegramFollowupWinsOverOldPackageFlow.judgmentTags.includes("gpao_openclaw_tcell_task_packet"));
assert.ok(mcpTelegramFollowupWinsOverOldPackageFlow.judgmentTags.includes("tcell_recent_telegram_anchor"));
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /korean-stats/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /korean-law-mcp/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.promptContext, /recent_telegram_assistant_reply/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.promptContext, /GPAO_OPENCLAW_TCELL_TASK_PACKET/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /target_candidates:/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /depth_contract:/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /radius_contract:/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /korean-stats/);
assert.match(mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.text || "", /korean-law-mcp/);
assert.equal(mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.center_axis, "Korea business MCP connection and management");
assert.equal(mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.task_markov_blanket.active_target, "Korea business MCP connection and management");
assert.ok(
  Array.isArray(mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.target_candidates),
  "T-cell packet should expose ranked target candidates"
);
assert.ok(
  (mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.target_candidates.length || 0) >= 2,
  "T-cell packet should keep competing target candidates instead of collapsing to one guess"
);
assert.equal(
  mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.target_candidates[0]?.source_role,
  "current-request",
  "Current user request remains the top target candidate authority"
);
assert.ok(
  mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.target_candidates.some((candidate) => candidate.source_role === "recent-telegram"),
  "Recent Telegram topic should remain a ranked target candidate"
);
assert.match(
  mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.task_markov_blanket.depth_contract || "",
  /current flow, core judgment/
);
assert.match(
  mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.task_markov_blanket.radius_contract || "",
  /bare yes\/no|generic encouragement/
);
assert.equal(
  mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.cells.find((cell) => cell.semantic_role === "recent-telegram")?.allowed_use,
  "answer-anchor"
);
assert.ok(
  (mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.cells.find((cell) => cell.semantic_role === "recent-telegram")?.answer_anchor_priority || 0) >
    (mcpTelegramFollowupWinsOverOldPackageFlow.tcellPacket?.cells.find((cell) => cell.semantic_role === "active-flow")?.answer_anchor_priority || 0)
);
assert.doesNotMatch(
  mcpTelegramFollowupWinsOverOldPackageFlow.carriedHandoff?.handoffState?.next_action || "",
  /새 zip\/manifest 재생성/
);

const arbitraryRecentTelegramTopicWinsWithoutDomainKeywords = __beaiRuntimeTestRenderTurnStartContext({
  workspaceDir: cwd,
  currentInput: "그럼 내가 보여준것보다 더 많이 붙일 수 있는거야?",
  sessionKey: "agent:main:telegram:default:direct:arbitrary-followup",
  sessionBoundaryLikely: true,
  activeFlowHint: [
    "recent_telegram_assistant_reply: 방금 확인한 오로라-리서치-브리지 3개는 연결 가능하고, 아직 붙이지 않은 루미나-노트-싱크와 헤론-데이터-렌즈는 권한 확인 뒤에 붙이는 게 맞습니다.",
    "runtime_memory: - OpenClaw GPAO 패키지 판단 기준: live 설치본과 zip/manifest 정합성이 어긋난 상태에서는 새 zip/manifest 재생성을 기본 추천한다."
  ].join("\n"),
  contextMeshResult: {
    status: "ready",
    mustReadBeforeAnswer: true,
    authorityBoundary: "current user request wins",
    answeringRule: "compare recent same-session answer before old active-flow state",
    nextAction: "recover the recent same-session subject",
    hits: [
      {
        selectionTier: "must-read",
        title: "Broad OpenClaw package background",
        path: "inbox/gpao-package-decision.md",
        excerpt: "package release context"
      }
    ]
  }
});

assert.ok(arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.judgmentTags.includes("active_flow_runtime_state_gate"));
assert.ok(arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.judgmentTags.includes("tcell_recent_telegram_anchor"));
assert.match(arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.carriedHandoff?.text || "", /오로라-리서치-브리지/);
assert.match(arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.carriedHandoff?.text || "", /루미나-노트-싱크/);
assert.doesNotMatch(
  arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.carriedHandoff?.handoffState?.next_action || "",
  /새 zip\/manifest 재생성/
);
assert.equal(
  arbitraryRecentTelegramTopicWinsWithoutDomainKeywords.tcellPacket?.cells.find((cell) => cell.semantic_role === "recent-telegram")?.source_kind,
  "telegram-ledger"
);

const turnStartPolicy = __beaiRuntimeTestContextMeshTurnStartPolicy();
assert.equal(turnStartPolicy.defaultMode, "always");
assert.ok(turnStartPolicy.timeoutMs <= 1500, "Context Mesh turn-start resolve should stay within a fast-path budget");
assert.ok(turnStartPolicy.cacheTtlMs >= 10000, "Context Mesh turn-start resolve should cache repeated turns briefly");
assert.equal(turnStartPolicy.failOpen, true, "Context Mesh retrieval failure should not block OpenClaw response flow");
