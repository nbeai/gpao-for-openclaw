#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const capabilityRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(capabilityRoot, "..");
const toolPath = path.join(capabilityRoot, "tools/gpao-openclaw-tcell-live-reinforcement.mjs");

const stdout = execFileSync("node", [toolPath, "--root", repoRoot, "--format", "json", "--stdout"], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 4
});

const report = JSON.parse(stdout);
assert.equal(report.schema, "gpao.openclaw.tcell_live_reinforcement.v0_1");
assert.equal(report.product, "GPAO for OpenClaw");
assert.equal(report.pass, "T-cell Live Reinforcement Pass 001");
assert.equal(report.status, "ready");
assert.equal(report.score, 100);
assert.equal(report.blockers.length, 0);
assert.equal(report.review_items.length, 0);
assert.ok(report.sections.some((section) => section.id === "runtime-packet"));
assert.ok(report.sections.some((section) => section.id === "telegram-continuity"));
assert.ok(report.sections.some((section) => section.id === "context-mesh-v03"));
assert.ok(report.sections.some((section) => section.id === "product-gate"));

process.stdout.write("gpao-openclaw-tcell-live-reinforcement.test: pass\n");
