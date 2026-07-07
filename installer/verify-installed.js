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
  const packageJson = readJson(root, "package.json") || {};
  const runtimeJson = readJson(root, "plugin/beai-runtime/package.json") || {};
  const pluginText = exists(root, "plugin/beai-runtime/openclaw.plugin.json") ? fs.readFileSync(path.join(root, "plugin/beai-runtime/openclaw.plugin.json"), "utf8") : "";
  const checks = [
    { id: "product-name", pass: packageJson.name === "gpao-for-openclaw", evidence: "package name: " + (packageJson.name || "missing") },
    { id: "runtime-version", pass: runtimeJson.version === "0.6.22", evidence: "runtime version: " + (runtimeJson.version || "missing") },
    { id: "plugin-identity", pass: /GPAO Runtime|GPAO for OpenClaw|BEAI Runtime component/i.test(pluginText), evidence: "OpenClaw plugin manifest carries GPAO identity." },
    { id: "runtime-dist", pass: exists(root, "plugin/beai-runtime/dist/index.js") && exists(root, "plugin/beai-runtime/dist/runtime-core.js"), evidence: "Runtime dist files are installed in package." },
    { id: "receipt-boundary", pass: true, evidence: "This verifier reads local package state only; live OpenClaw replacement remains separately proven." }
  ];
  return { schema: "gpao.openclaw.verify_installed.v0_1", name: "installer/verify-installed", status: checks.every((check) => check.pass) ? "ready" : "review", root, checks, nextAction: "Use proof ladder and live hash comparison before claiming loaded OpenClaw replacement." };
}
const options = parseArgs(process.argv.slice(2));
if (options.help) process.stdout.write("Usage: node installer/verify-installed.js [--root <package-root>] [--json]\n");
else output(buildReport(options.root), options.json);
