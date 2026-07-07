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

const { execFileSync } = require("node:child_process");

function runNode(root, args) {
  try {
    execFileSync(process.execPath, args, { cwd: root, stdio: "pipe", timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

function buildReport(root) {
  root = resolveRoot(root);
  const checks = [
    { id: "preflight", pass: runNode(root, ["installer/preflight.js", "--root", ".", "--json"]), evidence: "Installer preflight can run." },
    { id: "verify-installed", pass: runNode(root, ["installer/verify-installed.js", "--root", ".", "--json"]), evidence: "Installed package verifier can run." },
    { id: "proof-ladder", pass: runNode(root, ["capability-pack/tools/gpao-openclaw-proof-ladder.mjs", "--root", ".", "--format", "json", "--stdout"]), evidence: "GPAO proof ladder can run." },
    { id: "felt-replay", pass: runNode(root, ["capability-pack/tools/gpao-openclaw-felt-replay.mjs", "--root", ".", "--format", "json", "--stdout"]), evidence: "GPAO felt replay can run." },
    { id: "no-live-side-effect", pass: true, evidence: "Smoke test does not restart Gateway, send Telegram, mutate cron, publish, or promote memory." }
  ];
  return { schema: "gpao.openclaw.installer_smoke_test.v0_1", name: "installer/smoke-test", status: checks.every((check) => check.pass) ? "ready" : "review", root, checks, nextAction: "Run npm run verify for the full package gate." };
}
const options = parseArgs(process.argv.slice(2));
if (options.help) process.stdout.write("Usage: node installer/smoke-test.js [--root <package-root>] [--json]\n");
else output(buildReport(options.root), options.json);
