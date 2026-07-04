#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const capabilityRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(capabilityRoot, "..");
const toolPath = path.join(capabilityRoot, "tools/beai-control-center.mjs");

function runControlCenter(root) {
  const stdout = execFileSync("node", [toolPath, "--root", root, "--format", "json", "--stdout"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4
  });
  return JSON.parse(stdout);
}

const reportFromRepo = runControlCenter(repoRoot);
assert.equal(reportFromRepo.schema, "beai.control_center.v0_1");
assert.equal(reportFromRepo.mode, "read_only");
assert.equal(reportFromRepo.boundaries.noExternalSend, true);
assert.equal(reportFromRepo.boundaries.noGatewayRestart, true);
assert.equal(reportFromRepo.boundaries.noCronOrAgentMutation, true);
assert.equal(reportFromRepo.boundaries.noMemoryWrite, true);
assert.equal(reportFromRepo.boundaries.noReleasePublish, true);
assert.ok(reportFromRepo.package.capabilityPackVersion);
assert.ok(reportFromRepo.package.runtimeSourceVersion);
assert.ok(reportFromRepo.package.runtimeLiveVersion);
assert.ok(["aligned", "source_ahead_or_different", "unknown"].includes(reportFromRepo.package.liveBoundary));
assert.ok(["zip_candidate_present", "zip_not_current_for_source_candidate"].includes(reportFromRepo.package.releaseBoundary));
assert.ok(Array.isArray(reportFromRepo.components.skills));
assert.ok(Array.isArray(reportFromRepo.components.candidateModules));
assert.ok(Array.isArray(reportFromRepo.state.ledgers));
assert.equal(reportFromRepo.state.activeAutomations, 0);
assert.ok(reportFromRepo.state.ledgers.some((ledger) => ledger.kind === "automation_registry"));
assert.ok(reportFromRepo.state.ledgers.some((ledger) => ledger.kind === "promotion_gate"));
assert.ok(reportFromRepo.verification.packageVerify);
assert.equal(reportFromRepo.externalReach.status, "source_candidate");
assert.equal(reportFromRepo.externalReach.channels.total, 7);
assert.ok(reportFromRepo.externalReach.channels.publicReadOnly.includes("public_web"));
assert.ok(reportFromRepo.externalReach.channels.approvalGated.includes("x_twitter"));
assert.ok(reportFromRepo.nextSafeAction);
assert.ok(reportFromRepo.not_performed.includes("no Gateway restart"));
assert.ok(reportFromRepo.not_performed.includes("no Telegram send"));
assert.ok(reportFromRepo.not_performed.includes("no durable memory write"));

const reportFromCapabilityRoot = runControlCenter(capabilityRoot);
assert.equal(reportFromCapabilityRoot.roots.capabilityRoot, capabilityRoot);
assert.equal(reportFromCapabilityRoot.roots.repoRoot, repoRoot);
assert.equal(reportFromCapabilityRoot.schema, reportFromRepo.schema);

process.stdout.write("beai-control-center.test: pass\n");
