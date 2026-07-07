#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = { root: ".", format: "json", output: null, stdout: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node capability-pack/tools/gpao-openclaw-tcell-live-reinforcement.mjs [--root <package-root>] [--format json|md] [--output <path>] [--stdout]

Verifies GPAO for OpenClaw T-cell Live Reinforcement Pass 001. Read-only.
`;
}

function exists(root, rel) {
  const candidates = [
    path.join(root, rel),
    rel.startsWith("plugin/beai-runtime/")
      ? path.join(root, "plugins", "beai-runtime", rel.slice("plugin/beai-runtime/".length))
      : "",
    rel.startsWith("capability-pack/")
      ? path.join(root, "gpao-for-openclaw", "capability-pack", rel.slice("capability-pack/".length))
      : ""
  ].filter(Boolean);
  return candidates.some((candidate) => fs.existsSync(candidate));
}

function read(root, rel) {
  const candidates = [
    path.join(root, rel),
    rel.startsWith("plugin/beai-runtime/")
      ? path.join(root, "plugins", "beai-runtime", rel.slice("plugin/beai-runtime/".length))
      : "",
    rel.startsWith("capability-pack/")
      ? path.join(root, "gpao-for-openclaw", "capability-pack", rel.slice("capability-pack/".length))
      : ""
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate, "utf8");
    } catch {
      // Try the next source-package or live OpenClaw layout candidate.
    }
  }
  return "";
}

function resolvePackageRoot(root) {
  const absolute = path.resolve(root);
  if (exists(absolute, "package.json") && exists(absolute, "capability-pack")) return absolute;
  if (exists(absolute, "plugins/beai-runtime") && exists(absolute, "gpao-for-openclaw/capability-pack")) return absolute;
  const parent = path.dirname(absolute);
  if (path.basename(absolute) === "capability-pack" && exists(parent, "package.json")) return parent;
  const grandParent = path.dirname(parent);
  if (
    path.basename(absolute) === "capability-pack" &&
    path.basename(parent) === "gpao-for-openclaw" &&
    exists(grandParent, "plugins/beai-runtime") &&
    exists(grandParent, "gpao-for-openclaw/capability-pack")
  ) return grandParent;
  return absolute;
}

function check(id, pass, evidence, nextAction) {
  return { id, status: pass ? "pass" : "review", pass, evidence, nextAction };
}

function section(id, label, checks) {
  const passed = checks.filter((item) => item.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    id,
    label,
    score,
    status: score >= 95 ? "ready" : score >= 80 ? "review" : "blocked",
    checks
  };
}

function buildReport(root) {
  root = resolvePackageRoot(root);
  const runtimeIndex = read(root, "plugin/beai-runtime/src/index.ts");
  const runtimeTest = read(root, "plugin/beai-runtime/src/context-mesh-enforcement.test.mjs");
  const parityDoc = read(root, "capability-pack/docs/GPAO-FOR-OPENCLAW-CODEX-PARITY-REINFORCEMENT-v0.1-ko.md");
  const packageVerify = read(root, "capability-pack/tools/beai-package-verify.mjs");
  const packageJson =
    read(root, "package.json") ||
    read(root, "capability-pack/capability-pack.json") ||
    read(root, "plugin/beai-runtime/openclaw.plugin.json");

  const sections = [
    section("runtime-packet", "T-cell runtime task packet", [
      check("packet-type", /type TCellTaskPacket|gpao_openclaw_tcell_task_packet/.test(runtimeIndex), "Runtime defines a T-cell task packet.", "Add TCellTaskPacket runtime type."),
      check("markov-blanket", /task_markov_blanket|Task Markov Blanket|active_target/.test(runtimeIndex + parityDoc), "Runtime packet carries a task Markov blanket.", "Add active target/evidence/authority/speed boundaries."),
      check("center-axis", /center_axis|inferTCellCenterAxis/.test(runtimeIndex), "Runtime infers a center axis before answer generation.", "Add center-axis inference for current turn."),
      check("target-candidates", /target_candidates|buildTCellTargetCandidates/.test(runtimeIndex + runtimeTest), "Runtime ranks competing active-target candidates before choosing an answer anchor.", "Add ranked active-target candidates."),
      check("semantic-role", /semantic_role|recent-telegram|context-evidence|active-flow/.test(runtimeIndex), "Runtime cells carry semantic roles.", "Add semantic role field to T-cell units."),
      check("color-state", /color_state|white|green|yellow|purple|red/.test(runtimeIndex), "Runtime cells carry color state for use/risk/state.", "Add T-cell color state."),
      check("depth-radius-contract", /depth_contract|radius_contract/.test(runtimeIndex + runtimeTest), "Runtime preserves answer depth and response radius even on fast path.", "Add T-cell depth/radius response contract.")
    ]),
    section("telegram-continuity", "Telegram active-flow priority", [
      check("recent-telegram-anchor", /recent_telegram_assistant_reply|tcell_recent_telegram_anchor/.test(runtimeIndex + runtimeTest), "Recent Telegram assistant replies become T-cell answer anchors.", "Make recent Telegram reply outrank older package memory."),
      check("mcp-regression", /korean-stats|korean-law-mcp|mcp-followup/.test(runtimeTest), "Korea business MCP follow-up regression is covered.", "Add MCP follow-up regression."),
      check("domain-agnostic-regression", /오로라-리서치-브리지|arbitrary-followup/.test(runtimeTest), "Regression is domain-agnostic, not hard-coded to one MCP example.", "Add arbitrary follow-up regression."),
      check("old-memory-demotion", /possible-stale|doesNotMatch[\s\S]*새 zip\/manifest 재생성/.test(runtimeIndex + runtimeTest), "Older package/runtime memory is demoted behind recent active flow.", "Demote stale package memory when recent reply exists.")
    ]),
    section("context-mesh-v03", "Context Mesh v0.3 adapter bridge", [
      check("source-kind", /source_kind/.test(runtimeIndex), "T-cell unit carries source_kind.", "Add source_kind to OpenClaw T-cell packet."),
      check("evidence-level", /evidence_level/.test(runtimeIndex), "T-cell unit carries evidence_level.", "Add evidence_level to OpenClaw T-cell packet."),
      check("allowed-use", /allowed_use/.test(runtimeIndex), "T-cell unit carries allowed_use.", "Add allowed_use to OpenClaw T-cell packet."),
      check("conflict-state", /conflict_state/.test(runtimeIndex), "T-cell unit carries conflict_state.", "Add conflict state to prevent stale anchors."),
      check("current-request-priority", /current user request outranks all memory|Current user request wins/.test(runtimeIndex), "Current user request remains top authority.", "Keep current request above memory.")
    ]),
    section("product-gate", "Package verification integration", [
      check("tool-exists", exists(root, "capability-pack/tools/gpao-openclaw-tcell-live-reinforcement.mjs"), "T-cell reinforcement verification tool exists.", "Add T-cell reinforcement tool."),
      check("verify-includes-tool", /gpao-openclaw-tcell-live-reinforcement/.test(packageVerify), "Package verify includes the T-cell reinforcement gate.", "Wire T-cell gate into package verify."),
      check("package-identity", /Growth Personal AI Operating System|GPAO for OpenClaw/.test(packageJson), "Package identity remains GPAO for OpenClaw.", "Preserve GPAO product identity.")
    ])
  ];

  const score = Math.round(sections.reduce((sum, item) => sum + item.score, 0) / sections.length);
  const blockers = sections.filter((item) => item.status === "blocked").map((item) => item.id);
  const reviewItems = sections.flatMap((item) => item.checks.filter((check) => !check.pass).map((check) => `${item.id}:${check.id} - ${check.nextAction}`));
  return {
    schema: "gpao.openclaw.tcell_live_reinforcement.v0_1",
    product: "GPAO for OpenClaw",
    pass: "T-cell Live Reinforcement Pass 001",
    generated_at: new Date().toISOString(),
    root,
    status: blockers.length > 0 ? "blocked" : score >= 95 && reviewItems.length === 0 ? "ready" : "review",
    score,
    sections,
    blockers,
    review_items: reviewItems,
    policy: "OpenClaw GPAO must use T-cell task packets as runtime decision units: current request first, recent Telegram active-flow second, Context Mesh evidence third, stale package/runtime memory only as bounded support."
  };
}

function renderMarkdown(report) {
  const lines = ["# GPAO for OpenClaw T-cell Live Reinforcement", "", `Status: ${report.status}`, `Score: ${report.score}/100`, ""];
  for (const section of report.sections) {
    lines.push(`## ${section.label}`, "", `Status: ${section.status}`, `Score: ${section.score}/100`, "");
    for (const item of section.checks) lines.push(`- ${item.status}: ${item.id} - ${item.evidence}`);
    lines.push("");
  }
  lines.push("## Policy", "", report.policy);
  return `${lines.join("\n")}\n`;
}

function writeOutput(report, options) {
  const text = options.format === "md" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
    fs.writeFileSync(options.output, text, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(text);
}

const options = parseArgs(process.argv.slice(2));
if (options.help) process.stdout.write(usage());
else if (!["json", "md"].includes(options.format)) {
  process.stderr.write("--format must be json or md\n");
  process.exitCode = 1;
} else {
  writeOutput(buildReport(options.root), options);
}
