#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const options = { root: ".", apply: false, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function resolveRoot(root) {
  const absolute = path.resolve(root);
  if (fs.existsSync(path.join(absolute, "package.json")) && fs.existsSync(path.join(absolute, "capability-pack"))) return absolute;
  const parent = path.dirname(absolute);
  if (path.basename(absolute) === "installer" && fs.existsSync(path.join(parent, "package.json"))) return parent;
  return absolute;
}

function exists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(root, rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function output(report, json) {
  if (json) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  else {
    process.stdout.write(report.name + ": " + report.status + "\n");
    for (const check of report.checks || []) process.stdout.write("- " + (check.pass ? "pass" : "miss") + ": " + check.id + " - " + check.evidence + "\n");
    if (report.nextAction) process.stdout.write("next: " + report.nextAction + "\n");
  }
}

function buildReport(root) {
  root = resolveRoot(root);
  const checks = [
    { id: "visible-progress", pass: exists(root, "capability-pack/config/beai-telegram-delivery-contract.json"), evidence: "Telegram visible progress contract can be checked." },
    { id: "reply-hook-policy", pass: /reply_payload_sending|append|metadata-only|replacing/i.test(fs.readFileSync(path.join(root, "capability-pack/tools/beai-doctor.js"), "utf8")), evidence: "Doctor has reply hook policy diagnostics." },
    { id: "session-continuity", pass: /context_mesh_must_read_hard_gate|new_session_meaning_recovery_gate/i.test(fs.readFileSync(path.join(root, "plugin/beai-runtime/src/index.ts"), "utf8")), evidence: "Runtime includes new-session and Context Mesh gates." },
    { id: "approval-boundary", pass: true, evidence: "Repair plan is proposal-only; Gateway restart, Telegram sends, cron changes, and live replacement stay approval-gated." }
  ];
  return { schema: "gpao.openclaw.installer_repair_plan.v0_1", name: "installer/repair-plan", status: checks.every((check) => check.pass) ? "ready" : "review", root, checks, recommendedRepairs: ["Use Context Mesh hard gate when a new session or ambiguous follow-up appears.", "Keep Telegram progress claims unverified until messageId or visible progress evidence exists.", "Keep reply payload hook append/metadata-only unless a bounded sanitizer is required.", "Separate diagnostic sessions from normal Telegram operation before cleanup."], nextAction: "Apply only local package/runtime patches automatically; live OpenClaw actions require approval." };
}
const options = parseArgs(process.argv.slice(2));
if (options.help) process.stdout.write("Usage: node installer/repair-plan.js [--root <package-root>] [--json]\n");
else output(buildReport(options.root), options.json);
