#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    format: "json",
    output: null,
    stdout: false,
    help: false
  };
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
  node tools/gpao-openclaw-adapter-matrix.mjs [--root <package-root>] [--format json|md] [--output <path>] [--stdout]

Scores GPAO for OpenClaw package, runtime, Gateway, Telegram, context broker,
Knowledge Loop, and release-channel surfaces without installing, restarting,
sending messages, publishing, registering automation, or promoting memory.
`;
}

function readText(root, relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function resolvePackageRoot(root) {
  const absolute = path.resolve(root);
  if (exists(absolute, "package.json") && exists(absolute, "capability-pack")) return absolute;
  const parent = path.dirname(absolute);
  if (path.basename(absolute) === "capability-pack" && exists(parent, "package.json")) return parent;
  return absolute;
}

function hasAll(text, patterns) {
  return patterns.every((pattern) => pattern.test(text));
}

function surface(id, label, targetScore, checks, boundary) {
  const passed = checks.filter((check) => check.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    id,
    label,
    targetScore,
    score,
    status: score >= targetScore ? "pass" : score >= Math.max(60, targetScore - 20) ? "review" : "blocked",
    checks,
    boundary
  };
}

function buildMatrix(root) {
  root = resolvePackageRoot(root);
  const readme = readText(root, "README.md");
  const readmeFirst = readText(root, "README-FIRST.md");
  const manifest = readText(root, "GPAO-FOR-OPENCLAW-PACKAGE-MANIFEST.md");
  const packageJson = readText(root, "package.json");
  const runtimePackage = readText(root, "plugin/beai-runtime/package.json");
  const runtimeDistPackage = readText(root, "plugin/beai-runtime/package.dist.json");
  const runtimeIndex = readText(root, "plugin/beai-runtime/src/index.ts");
  const runtimeCore = readText(root, "plugin/beai-runtime/src/runtime-core.ts");
  const telegramContract = readText(root, "capability-pack/config/beai-telegram-delivery-contract.json");
  const operationalDoc = readText(root, "capability-pack/docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md");
  const knowledgeLoopDoc = readText(root, "capability-pack/docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md");
  const knowledgeLoopAutoDoc = readText(root, "capability-pack/docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md");
  const doctor = readText(root, "capability-pack/tools/beai-doctor.js");
  const packageVerify = readText(root, "capability-pack/tools/beai-package-verify.mjs");
  const installer = readText(root, "installer/install-gpao-for-openclaw.mjs");

  const packageZipPresent = exists(root, "packages") && fs.readdirSync(path.join(root, "packages"), { withFileTypes: true })
    .some((entry) => entry.isFile() && /^gpao-for-openclaw-v.*\.zip$/.test(entry.name));

  const surfaces = [
    surface("package-source", "GPAO package source identity", 95, [
      { id: "product-name", pass: /GPAO for OpenClaw/.test(readme), evidence: "README carries GPAO product identity." },
      { id: "beai-as-component", pass: /BEAI Runtime.*component|internal components/i.test(readme), evidence: "BEAI is framed as an internal component." },
      { id: "copyright", pass: /Copyright \(c\) 2026 Park Jongyoon/.test(readmeFirst), evidence: "Copyright is present in first-read path." },
      { id: "manifest", pass: /GPAO for OpenClaw/.test(manifest), evidence: "Package manifest exists and names GPAO." }
    ], "This surface proves package identity, not live installation."),
    surface("runtime-plugin", "BEAI Runtime plugin component", 95, [
      { id: "runtime-package", pass: /beai-runtime/.test(runtimePackage), evidence: "Runtime package manifest exists." },
      { id: "dist-package", pass: /beai-runtime/.test(runtimeDistPackage), evidence: "Distribution runtime package manifest exists." },
      { id: "handoff-state", pass: /handoff_state/.test(runtimeCore), evidence: "Runtime can render handoff-state overlay." },
      { id: "context-pack-reasons", pass: /persisted_context_pack/.test(runtimeIndex), evidence: "Runtime source includes persisted context pack reasons." }
    ], "This surface proves package source behavior, not the currently loaded OpenClaw plugin."),
    surface("gateway-live", "Gateway and live replacement boundary", 80, [
      { id: "not-auto-restart", pass: /restart Gateway|Gateway restart/i.test(readme), evidence: "Gateway restart is explicitly separated." },
      { id: "doctor-repair-plan", pass: /hook registration|repair plan|approval/i.test(doctor), evidence: "Doctor contains hook-registration repair path." },
      { id: "installer-no-core-edit", pass: /OpenClaw core|restart|Telegram|cron|durable memory/i.test(installer), evidence: "Installer boundaries are explicit." },
      { id: "live-proof-separated", pass: /live OpenClaw.*separate|live OpenClaw has\s*\n?been replaced/i.test(readme), evidence: "Live replacement is not overclaimed." }
    ], "This surface is intentionally review-biased until live replacement and restart are actually performed."),
    surface("telegram-direct", "Telegram Direct visible progress and truth", 90, [
      { id: "first-status-30", pass: /quick_first_status_max_seconds/.test(telegramContract) && /30/.test(telegramContract), evidence: "First visible status target is configured." },
      { id: "long-update-120", pass: /long_running_visible_progress_max_seconds/.test(telegramContract) && /120/.test(telegramContract), evidence: "Long-running update target is configured." },
      { id: "message-id-truth", pass: /messageId|message_id/i.test(telegramContract), evidence: "Visible delivery requires message id evidence." },
      { id: "operational-doc", pass: /30/.test(operationalDoc) && /120/.test(operationalDoc), evidence: "Operational doc repeats visible progress contract." }
    ], "This surface proves the contract, not a live Telegram roundtrip."),
    surface("context-broker", "Turn-start context broker and session recovery", 90, [
      { id: "new-session-gate", pass: /new_session_meaning_recovery_gate/.test(runtimeIndex), evidence: "New-session meaning recovery gate exists." },
      { id: "ambiguous-followup-gate", pass: /ambiguous_followup_meaning_recovery_gate/.test(runtimeIndex), evidence: "Ambiguous follow-up recovery gate exists." },
      { id: "current-request-wins", pass: /current user request wins|current request/i.test(runtimeCore), evidence: "Runtime overlay preserves current request priority." },
      { id: "context-not-force", pass: /candidate|compare/i.test(runtimeCore), evidence: "Recovered context is treated as bounded comparison evidence." }
    ], "This surface proves packaged runtime logic, not model compliance in every future turn."),
    surface("knowledge-loop", "Knowledge Loop and growth review boundary", 85, [
      { id: "knowledge-loop-doc", pass: /Knowledge Loop/.test(knowledgeLoopDoc), evidence: "Knowledge Loop doc exists." },
      { id: "capture-not-approve", pass: /auto.*capture|automatic capture/i.test(knowledgeLoopAutoDoc) && /not.*approve|승인/i.test(knowledgeLoopAutoDoc), evidence: "Auto capture and approval boundary are documented." },
      { id: "review-first", pass: /review|candidate|후보/i.test(knowledgeLoopDoc + knowledgeLoopAutoDoc), evidence: "Knowledge changes are review/candidate based." },
      { id: "package-verify-includes-growth", pass: /organic-flow|conversation-flow|workbench-skill/i.test(packageVerify), evidence: "Verification includes growth and flow gates." }
    ], "This surface proves package-owned learning controls, not durable memory promotion."),
    surface("release-channel", "Release channel and first-install evidence", 90, [
      { id: "zip-present", pass: packageZipPresent, evidence: "GPAO release archive exists under packages/." },
      { id: "fresh-unzip-verify", pass: /fresh unzip|fresh-unzip|runtime dependencies/.test(readme + readmeFirst + packageVerify), evidence: "Fresh unzip verification is documented and automated." },
      { id: "public-boundary", pass: /ClawHub|public release/i.test(readme + readmeFirst), evidence: "ClawHub/public release is separated from local package readiness." },
      { id: "not-overclaiming", pass: /stable one-command public installer/i.test(readmeFirst + readme), evidence: "Stable public installer claim is explicitly gated." }
    ], "This surface proves local release package readiness, not public release completion.")
  ];

  const blockers = surfaces.filter((item) => item.status === "blocked").map((item) => item.id);
  const reviews = surfaces.filter((item) => item.status === "review").map((item) => item.id);
  const averageScore = Math.round(surfaces.reduce((sum, item) => sum + item.score, 0) / surfaces.length);
  const status = blockers.length > 0 ? "blocked" : averageScore >= 90 ? "ready" : "review";

  return {
    schema: "gpao.openclaw.adapter_matrix.v0_1",
    product: "GPAO for OpenClaw",
    generated_at: new Date().toISOString(),
    root,
    status,
    averageScore,
    surfaces,
    blockers,
    review_items: reviews,
    policy: "The matrix scores package-owned surfaces separately. It must not merge local package readiness with live OpenClaw replacement, Gateway restart, Telegram messageId proof, ClawHub validation, or public release."
  };
}

function renderMarkdown(report) {
  const lines = [
    "# GPAO for OpenClaw Adapter Matrix",
    "",
    `Status: ${report.status}`,
    `Average score: ${report.averageScore}/100`,
    "",
    "## Surfaces",
    ""
  ];
  for (const item of report.surfaces) {
    lines.push(`- ${item.status}: ${item.label} (${item.score}/${item.targetScore})`);
    lines.push(`  - boundary: ${item.boundary}`);
    for (const check of item.checks) {
      lines.push(`  - ${check.pass ? "pass" : "miss"}: ${check.id}`);
    }
  }
  lines.push("", "## Policy", "", report.policy);
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
if (options.help) {
  process.stdout.write(usage());
} else if (!["json", "md"].includes(options.format)) {
  process.stderr.write("--format must be json or md\n");
  process.exitCode = 1;
} else {
  writeOutput(buildMatrix(path.resolve(options.root)), options);
}
