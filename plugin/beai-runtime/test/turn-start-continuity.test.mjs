import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { __beaiRuntimeTestRenderTurnStartContext } from "../dist/index.js";

function writeContextPack() {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "beai-runtime-continuity-"));
  const stateDir = path.join(workspaceDir, "state", "beai");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "new-session-context-pack.json"),
    JSON.stringify(
      {
        opening:
          "이전 흐름은 GPAO Operating Package와 OpenClaw 새 세션 맥락 복구 테스트를 이어가는 작업입니다.",
        carry: [
          "배포파일은 오래된 BEAI Harness archive가 아니라 GPAO Operating Package / GPAO for OpenClaw 후보입니다.",
          "새 세션 첫 턴에서는 현재 사용자 요청을 우선하되 직전 pending action과 비교해야 합니다."
        ],
        doNotCarry: ["검증 없이 live 적용 완료라고 말하지 않습니다."],
        continuity: {
          currentTrack: "GPAO package and OpenClaw context continuity",
          nextAction: "Gateway 재시작 전 로컬 runtime continuity gate를 검증합니다.",
          inProgress: ["OpenClaw BEAI Runtime turn-start meaning recovery"],
          openLoops: ["live plugin apply and Telegram /new roundtrip remain unverified"],
          lockedDecisions: [
            "GPAO is the product, Context Mesh is the memory layer, BEAI Package is the runtime base."
          ],
          doNotCarry: ["Do not treat old BEAI Harness public archive as the current GPAO package target."],
          nextSessionOpening:
            "새 세션에서는 GPAO Operating Package 작업 맥락을 먼저 후보로 비교합니다."
        },
        conversationArc: {
          currentFlowContext: "GPAO package discussion",
          nextIntent: "test new-session continuity recovery"
        }
      },
      null,
      2
    )
  );
  return workspaceDir;
}

test("new-session first turn injects persisted GPAO package context as comparison material", () => {
  const workspaceDir = writeContextPack();
  const result = __beaiRuntimeTestRenderTurnStartContext({
    workspaceDir,
    currentInput: "그럼 이제 어떤 테스트를 해보면 되지?",
    sessionKey: "new-session-1",
    sessionBoundaryLikely: true,
    disableContextMesh: true
  });

  assert.equal(result.carriedHandoff?.reason, "persisted_context_pack_state_gate");
  assert.ok(result.judgmentTags.includes("new_session_meaning_recovery_gate"));
  assert.match(result.promptContext, /handoff_state:/);
  assert.match(result.promptContext, /current user request wins/);
  assert.match(result.promptContext, /ambiguous_action_guard: .*do not answer with a bare yes\/no/);
  assert.match(result.promptContext, /current_override_guard: .*follow that correction/);
  assert.match(result.promptContext, /GPAO Operating Package/);
  assert.match(result.promptContext, /must_not_carry: .*old BEAI Harness public archive/);
});

test("short ambiguous follow-up can recover prior context without a hardcoded phrase", () => {
  const workspaceDir = writeContextPack();
  const result = __beaiRuntimeTestRenderTurnStartContext({
    workspaceDir,
    currentInput: "좋아. 그걸로 진행해.",
    sessionKey: "ambiguous-followup-1",
    disableContextMesh: true
  });

  assert.equal(result.carriedHandoff?.reason, "persisted_context_pack_ambiguous_followup");
  assert.ok(result.judgmentTags.includes("ambiguous_followup_meaning_recovery_gate"));
  assert.match(result.promptContext, /GPAO Operating Package/);
});

test("current explicit correction is not overridden by persisted continuity", () => {
  const workspaceDir = writeContextPack();
  const result = __beaiRuntimeTestRenderTurnStartContext({
    workspaceDir,
    currentInput: "방금 네 답변의 근본 원인을 분석해. 이전 패키지 맥락으로 답하지 마.",
    sessionKey: "explicit-current-request-1",
    sessionBoundaryLikely: true,
    disableContextMesh: true
  });

  assert.equal(result.carriedHandoff, undefined);
  assert.doesNotMatch(result.promptContext, /handoff_state:/);
  assert.doesNotMatch(result.promptContext, /GPAO Operating Package/);
});

test("Context Mesh turn-start result is injected as bounded comparison context", () => {
  const workspaceDir = writeContextPack();
  const result = __beaiRuntimeTestRenderTurnStartContext({
    workspaceDir,
    currentInput: "지파오 패키지 새 세션 맥락 이어서 점검해줘.",
    sessionKey: "context-mesh-1",
    disableContextMesh: false,
    contextMeshResult: {
      status: "ready",
      mustReadBeforeAnswer: true,
      answeringRule: "Read must-read hits before answering from model memory.",
      authorityBoundary:
        "This command only resolves local context. It does not promote durable memory, send externally, deploy, delete, or activate automation.",
      nextAction: "Use must-read and should-read local hits as answer anchors.",
      hits: [
        {
          selectionTier: "must-read",
          title: "OpenClaw BEAI Runtime turn-start memory/context resolve failure diagnosis",
          path: "inbox/openclaw-turn-start-diagnosis.md",
          excerpt: "Missing path is pre-answer injection, not storage."
        },
        {
          selectionTier: "should-read",
          title: "GPAO package intent binding",
          path: "inbox/gpao-package-intent.md",
          excerpt: "배포파일 should mean GPAO Operating Package in this flow."
        }
      ]
    }
  });

  assert.match(result.carriedHandoff?.reason || "", /context_mesh_turn_start_resolve/);
  assert.match(result.promptContext, /Context Mesh turn-start resolve/);
  assert.match(result.promptContext, /ambiguous_action_guard: .*separate verified readiness from unknowns/);
  assert.match(result.promptContext, /OpenClaw BEAI Runtime turn-start memory/);
  assert.match(result.promptContext, /GPAO package intent binding/);
  assert.match(result.promptContext, /does not promote durable memory/);
});

test("ambiguous permission follow-up stays in judgment mode instead of execution mode", () => {
  const workspaceDir = writeContextPack();
  const result = __beaiRuntimeTestRenderTurnStartContext({
    workspaceDir,
    currentInput: "새 세션인데 그거 이제 만들어도 돼?",
    sessionKey: "ambiguous-permission-1",
    disableContextMesh: false,
    contextMeshResult: {
      status: "ready",
      mustReadBeforeAnswer: true,
      answeringRule: "Read must-read hits before answering from model memory.",
      authorityBoundary:
        "This command only resolves local context. It does not promote durable memory, send externally, deploy, delete, or activate automation.",
      nextAction: "Use must-read and should-read local hits as answer anchors.",
      hits: [
        {
          selectionTier: "must-read",
          title: "GPAO package intent binding",
          path: "inbox/gpao-package-intent.md",
          excerpt: "배포파일 should mean GPAO Operating Package in this flow."
        }
      ]
    }
  });

  assert.match(result.promptContext, /requested_output_shape: question/);
  assert.match(result.promptContext, /execution_mode: planning/);
  assert.doesNotMatch(result.promptContext, /requested_output_shape: execution/);
  assert.match(result.promptContext, /ambiguous_action_guard: .*do not answer with a bare yes\/no/);
  assert.doesNotMatch(result.guardedOverapprovalSample, /^네,/);
  assert.match(result.guardedOverapprovalSample, /바로 승인으로 닫으면 안 됩니다/);
});
