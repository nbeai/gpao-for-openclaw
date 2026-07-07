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
  node capability-pack/tools/gpao-openclaw-codex-parity.mjs [--root <package-root>] [--format json|md] [--output <path>] [--stdout]

Checks whether GPAO for OpenClaw carries the Codex GPAO parity features that matter:
self-growth loop, new-session recovery, Context Mesh hard gate, upgrade proposals,
and lightweight organic live operation boundaries. Read-only.
`;
}

function exists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(root, rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function resolvePackageRoot(root) {
  const absolute = path.resolve(root);
  if (exists(absolute, "package.json") && exists(absolute, "capability-pack")) return absolute;
  const parent = path.dirname(absolute);
  if (path.basename(absolute) === "capability-pack" && exists(parent, "package.json")) return parent;
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
  const runtimeCore = read(root, "plugin/beai-runtime/src/runtime-core.ts");
  const runtimeTest = read(root, "plugin/beai-runtime/src/context-mesh-enforcement.test.mjs");
  const readme = read(root, "README.md") + "\n" + read(root, "README-FIRST.md");
  const packageVerify = read(root, "capability-pack/tools/beai-package-verify.mjs");
  const knowledgeDocs = [
    "capability-pack/docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md",
    "capability-pack/docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md",
    "capability-pack/docs/BEAI-CONVERSATION-FLOW-REVIEW-LOOP-v0.1-ko.md",
    "capability-pack/docs/BEAI-PACKAGE-ORGANIC-FLOW-AUDIT-v0.1-ko.md"
  ].map((rel) => read(root, rel)).join("\n");
  const telegramContract = read(root, "capability-pack/config/beai-telegram-delivery-contract.json");
  const helpers = [
    "installer/preflight.js",
    "installer/repair-plan.js",
    "installer/auto-repair.js",
    "installer/verify-installed.js",
    "installer/smoke-test.js"
  ];

  const sections = [
    section("self-growth", "Self-growth and upgrade loop parity", [
      check("knowledge-loop-review", /review|candidate|후보/i.test(knowledgeDocs), "Knowledge Loop remains review-first instead of raw memory write.", "Add review-first Knowledge Loop docs and gates."),
      check("organic-flow-audit", /organic-flow|성장|흐름|growth/i.test(packageVerify + knowledgeDocs), "Organic flow and growth checks are part of package verification.", "Add organic/growth gate to package verify."),
      check("upgrade-proposal-surface", /upgrade|self-upgrade|개선|보강|제안/i.test(readme + knowledgeDocs), "Upgrade proposal language exists in package/product docs.", "Add user-visible upgrade proposal flow."),
      check("no-durable-auto-promotion", /durable memory|자동 승인|not.*approve|review-first/i.test(readme + knowledgeDocs), "Growth capture is broad but authority promotion remains bounded.", "Separate capture from promotion.")
    ]),
    section("session-continuity", "New-session and omitted-follow-up continuity", [
      check("state-gate", /persisted_context_pack_state_gate|new_session_meaning_recovery_gate/i.test(runtimeIndex), "Runtime has state-gated recovery for new sessions.", "Add state-gated persisted context recovery."),
      check("ambiguous-followup", /persisted_context_pack_ambiguous_followup|ambiguous_followup_meaning_recovery_gate/i.test(runtimeIndex), "Runtime has ambiguous follow-up recovery.", "Add omitted-object follow-up recovery."),
      check("current-request-wins", /current user request wins/i.test(runtimeCore), "Overlay keeps current request above prior memory.", "Add current-request priority guard."),
      check("not-bare-yes-no", /bare yes\/no|bare yes|ask.*confirmation|authority/i.test(runtimeIndex + runtimeCore), "Ambiguous continuation should name recovered target instead of answering vaguely.", "Add ambiguous-action guard.")
    ]),
    section("context-mesh", "Context Mesh hard-gate productization", [
      check("turn-start-resolve", /mesh\"?, \"resolve|mesh", "resolve|context_mesh_turn_start_resolve/i.test(runtimeIndex), "Runtime calls Context Mesh turn-start resolve.", "Wire Context Mesh resolve into before_prompt_build."),
      check("every-turn-default", /contextMeshTurnStart:\s*"always"|defaultMode:\s*"always"|context_mesh_every_turn_preflight/i.test(runtimeIndex), "Context Mesh turn-start retrieval defaults to every-turn preflight, not keyword-only lookup.", "Make Context Mesh turn-start preflight the default mode."),
      check("body-loaded", /readContextMeshHitBody|context_mesh_body_loaded/i.test(runtimeIndex + runtimeTest), "Must-read bodies are loaded when available.", "Load must-read hit bodies, not just titles."),
      check("hard-gate-role", /context_mesh_must_read_hard_gate|context_mesh_hard_gate/i.test(runtimeIndex), "Context Mesh can demote direct answers into diagnosis when evidence must be compared.", "Add hard gate before direct answer."),
      check("meta-envelope-strip", /StripMetaEnvelope|stripMetaEnvelope|strippedTelegramEnvelope/i.test(runtimeIndex + runtimeTest), "Telegram metadata envelopes are stripped before intent matching.", "Strip Telegram metadata before Context Mesh resolution."),
      check("fast-path-budget", /CONTEXT_MESH_RESOLVE_TIMEOUT_MS\s*=\s*1200|timeoutMs <= 1500|context_mesh_fast_path/i.test(runtimeIndex + runtimeTest), "Context Mesh preflight has a short fast-path budget so OpenClaw does not feel slow.", "Add short timeout and regression test for Context Mesh preflight."),
      check("cache-and-fail-open", /contextMeshTurnStartCache|context_mesh_fast_cache_hit|failOpen,\s*true|source:\s*"fail-open"/i.test(runtimeIndex + runtimeTest), "Repeated turn-start lookups are cached briefly and retrieval failure is fail-open.", "Add cache/fail-open behavior for Context Mesh preflight."),
      check("loaded-evidence-no-extra-tool", /context_mesh_loaded_evidence_no_extra_tool_requirement|flowToolNeed,\s*"none"|no extra local tool requirement/i.test(runtimeIndex + runtimeTest), "Loaded Context Mesh evidence should not force extra local tool calls.", "Avoid forcing local tools when must-read evidence was already loaded.")
    ]),
    section("lightweight-operation", "Lightweight organic OpenClaw operation", [
      check("visible-progress-contract", /quick_first_status_max_seconds|long_running_visible_progress_max_seconds|messageId/i.test(telegramContract), "Telegram visible progress and messageId truth are explicit.", "Add visible progress/messageId contract."),
      check("no-live-side-effects", /no Gateway restart|no Telegram send|no cron|no durable memory|no OpenClaw core change/i.test(packageVerify), "Package verification stays read-only and light.", "Keep verify free of live side effects."),
      check("helper-integrity", helpers.every((rel) => exists(root, rel)), "Installer helper suite is present for doctor/preflight/smoke paths.", "Add installer helper suite."),
      check("package-gate-includes-parity", /gpao-openclaw-codex-parity/i.test(packageVerify), "Package verify includes this parity gate.", "Add parity gate to package verify.")
    ])
  ];

  const score = Math.round(sections.reduce((sum, item) => sum + item.score, 0) / sections.length);
  const blockers = sections.filter((item) => item.status === "blocked").map((item) => item.id);
  const reviewItems = sections.flatMap((item) => item.checks.filter((check) => !check.pass).map((check) => `${item.id}:${check.id} - ${check.nextAction}`));
  return {
    schema: "gpao.openclaw.codex_parity.v0_1",
    product: "GPAO for OpenClaw",
    generated_at: new Date().toISOString(),
    root,
    status: blockers.length > 0 ? "blocked" : score >= 95 && reviewItems.length === 0 ? "ready" : "review",
    score,
    sections,
    blockers,
    review_items: reviewItems,
    policy: "Parity means OpenClaw carries the same operational principles as GPAO for Codex while staying adapter-appropriate: broad capture, precise retrieval, current request priority, bounded authority, and lightweight live operation."
  };
}

function renderMarkdown(report) {
  const lines = ["# GPAO for OpenClaw Codex Parity", "", `Status: ${report.status}`, `Score: ${report.score}/100`, ""];
  for (const section of report.sections) {
    lines.push(`## ${section.label}`, "", `Status: ${section.status}`, `Score: ${section.score}/100`, "");
    for (const item of section.checks) lines.push(`- ${item.status}: ${item.id} - ${item.evidence}`);
    lines.push("");
  }
  lines.push("## Policy", "", report.policy);
  return lines.join("\n") + "\n";
}

function writeOutput(report, options) {
  const text = options.format === "md" ? renderMarkdown(report) : JSON.stringify(report, null, 2) + "\n";
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
