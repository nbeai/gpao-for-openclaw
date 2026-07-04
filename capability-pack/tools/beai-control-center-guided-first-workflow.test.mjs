#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const capabilityRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(capabilityRoot, "..");
const toolPath = path.join(capabilityRoot, "tools/beai-control-center.mjs");

function run(args) {
  const stdout = execFileSync("node", [toolPath, ...args, "--format", "json", "--stdout"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4
  });
  return JSON.parse(stdout);
}

function test(name, fn) {
  fn();
  process.stdout.write(`${name}: pass\n`);
}

test("Guided First Workflow first success path - BEAI Control Center shows source/live/package state", () => {
  const report = run(["--root", repoRoot]);
  assert.equal(report.schema, "beai.control_center.v0_1");
  assert.equal(report.mode, "read_only");
  assert.equal(report.roots.repoRoot, repoRoot);
  assert.equal(report.roots.capabilityRoot, capabilityRoot);
  assert.ok(report.package.capabilityPackVersion);
  assert.ok(report.package.runtimeSourceVersion);
  assert.ok(report.package.runtimeLiveVersion);
  assert.ok(report.package.latestArchive === null || report.package.latestArchive.name.endsWith(".zip"));
  assert.ok(report.nextSafeAction.includes("Verify") || report.nextSafeAction.includes("Run") || report.nextSafeAction.includes("Keep"));
});

test("Guided First Workflow empty state - missing ledgers stay visible without becoming active automation", () => {
  const missingStateRoot = path.join(os.tmpdir(), "beai-control-center-empty-state-does-not-exist");
  const report = run(["--root", repoRoot, "--state-root", missingStateRoot]);
  assert.equal(report.mode, "read_only");
  assert.equal(report.state.activeAutomations, 0);
  assert.ok(report.state.missing.includes("automation_registry"));
  assert.ok(report.state.missing.includes("promotion_gate"));
  assert.ok(report.issues.some((issue) => issue.includes("missing")));
});

test("Guided First Workflow failure recovery - approval boundaries remain visible when live and source differ", () => {
  const report = run(["--root", repoRoot]);
  assert.ok(report.boundaries.approvalNeededFor.includes("live runtime reinstall or Gateway restart"));
  assert.ok(report.boundaries.approvalNeededFor.includes("release zip creation or public release"));
  assert.ok(report.boundaries.approvalNeededFor.includes("cron, hook, or agent activation"));
  assert.ok(report.not_performed.includes("no install"));
  assert.ok(report.not_performed.includes("no Gateway restart"));
  assert.ok(report.not_performed.includes("no cron, hook, or agent mutation"));
});

test("Non-developer scenario - BEAI Control Center reduces judgment burden without becoming an action console", () => {
  const report = run(["--root", repoRoot]);
  const userMeaning = [
    report.package.liveBoundary,
    report.package.releaseBoundary,
    report.state.ledgers.map((ledger) => ledger.kind).join(","),
    report.nextSafeAction,
    report.boundaries.approvalNeededFor.join(",")
  ].join(" ");
  assert.match(userMeaning, /source_ahead_or_different|aligned|unknown/);
  assert.match(userMeaning, /zip_candidate_present|zip_not_current_for_source_candidate/);
  assert.match(userMeaning, /workflow_card/);
  assert.match(userMeaning, /automation_registry/);
  assert.match(userMeaning, /release zip creation or public release/);
  assert.equal(report.boundaries.noReleasePublish, true);
  assert.equal(report.boundaries.noCronOrAgentMutation, true);
});
