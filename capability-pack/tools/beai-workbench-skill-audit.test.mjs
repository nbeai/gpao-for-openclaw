#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const output = execFileSync("node", [
  "capability-pack/tools/beai-workbench-skill-audit.mjs",
  "--root",
  ".",
  "--format",
  "json",
  "--stdout"
], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 4
});

const report = JSON.parse(output);

assert.equal(report.schema, "beai.workbench_skill_audit.v0_1");
assert.equal(report.status, "ready");
assert.equal(report.contract.exists, true);
assert.equal(report.summary.studioCount, 5);
assert.equal(report.summary.ready, 5);
assert.equal(report.summary.issueCount, 0);

const expected = new Set([
  "beai-visual-design-studio",
  "beai-presentation-studio",
  "beai-document-craft-studio",
  "beai-research-evidence-studio",
  "beai-data-insight-lab"
]);

for (const studio of report.studios) {
  assert.equal(expected.has(studio.id), true, `unexpected studio ${studio.id}`);
  assert.ok(studio.frontmatter?.name, `${studio.id} missing frontmatter name`);
  assert.ok(studio.frontmatter?.description, `${studio.id} missing description`);
  assert.ok(studio.patternCount >= 5, `${studio.id} pattern count`);
  assert.ok(studio.qualityGates.length >= 1, `${studio.id} quality gate count`);
}

process.stdout.write("beai-workbench-skill-audit.test: pass\n");
