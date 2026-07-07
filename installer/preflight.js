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
    { id: "gpao-product-root", pass: exists(root, "GPAO-FOR-OPENCLAW-PACKAGE-MANIFEST.md"), evidence: "GPAO package manifest is present." },
    { id: "runtime-component", pass: exists(root, "plugin/beai-runtime/dist/index.js") && exists(root, "plugin/beai-runtime/dist/runtime-core.js"), evidence: "Runtime dist files are present." },
    { id: "capability-pack", pass: exists(root, "capability-pack/capability-pack.json"), evidence: "Capability Pack is present." },
    { id: "context-mesh-contract", pass: /Context Mesh/i.test(fs.readFileSync(path.join(root, "README.md"), "utf8")), evidence: "Context Mesh is named in the package surface." },
    { id: "knowledge-loop-contract", pass: exists(root, "capability-pack/docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md"), evidence: "Knowledge Loop docs are present." },
    { id: "no-live-side-effect", pass: true, evidence: "Preflight is read-only; it does not install, restart Gateway, send Telegram, mutate cron, or promote memory." }
  ];
  return { schema: "gpao.openclaw.installer_preflight.v0_1", name: "installer/preflight", status: checks.every((check) => check.pass) ? "ready" : "review", root, checks, nextAction: "Run verify-installed or smoke-test after package extraction/install proof is needed." };
}
const options = parseArgs(process.argv.slice(2));
if (options.help) process.stdout.write("Usage: node installer/preflight.js [--root <package-root>] [--json]\n");
else output(buildReport(options.root), options.json);
