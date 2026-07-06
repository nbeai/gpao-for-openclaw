import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { __beaiRuntimeTestRenderTurnStartContext, __beaiRuntimeTestStripMetaEnvelope } from "../dist/index.js";

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
assert.match(result.promptContext, /handoff_state:/);
assert.match(result.promptContext, /must_compare_before_answer:/);
assert.match(result.promptContext, /GPAO Operating Package/);
assert.match(result.guardedOverapprovalSample, /검증|확인|근거|상태|세션|맥락/);
assert.equal(strippedTelegramEnvelope, "그럼 이제 만들어도 되는 상태야?");
assert.equal(strippedCliEnvelope, "그럼 이제 만들어도 되는 상태야?");
