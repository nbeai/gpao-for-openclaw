#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const output = execFileSync("node", [
  "capability-pack/tools/beai-external-reach-doctor.mjs",
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

assert.equal(report.schema, "beai.external_reach_doctor.v0_1");
assert.equal(report.status, "ready");
assert.equal(report.mode, "read_only_static");
assert.equal(report.contract.exists, true);
assert.equal(report.summary.channels, 7);
assert.equal(report.summary.approvalGatedChannels, 3);
assert.equal(report.summary.p0Issues, 0);
assert.equal(report.summary.issueCount, 0);

const channelStatus = new Map(report.channels.map((channel) => [channel.id, channel]));
assert.equal(channelStatus.get("public_web")?.defaultStatus, "available");
assert.equal(channelStatus.get("github")?.defaultStatus, "available");
assert.equal(channelStatus.get("youtube")?.defaultStatus, "limited");
assert.equal(channelStatus.get("rss")?.defaultStatus, "available");
assert.equal(channelStatus.get("x_twitter")?.approvalRequired, true);
assert.equal(channelStatus.get("reddit")?.approvalRequired, true);
assert.equal(channelStatus.get("social_meta")?.defaultStatus, "unsafe_without_approval");

assert.equal(report.checks.source_registry_fields_complete, true);
assert.equal(report.checks.social_channels_approval_gated, true);
assert.equal(report.checks.research_skill_mentions_external_reach, true);
assert.equal(report.not_performed.includes("no account login"), true);
assert.equal(report.not_performed.includes("no browser cookie use"), true);
assert.equal(report.not_performed.includes("no Gateway restart"), true);

process.stdout.write("beai-external-reach-doctor.test: pass\n");
