#!/usr/bin/env node

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    runtime: "plugin/beai-runtime",
    format: "json",
    output: null,
    stdout: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--runtime") options.runtime = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node capability-pack/tools/beai-package-truth-check.mjs [--root <package-root>] [--runtime <runtime-dir>] [--format json|md] [--output <path>] [--stdout]

Compares runtime package.json, package.dist.json, and npm pack --dry-run --json output.
It does not create a release package, publish, install, restart Gateway, mutate OpenClaw config, or send messages.
`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: options.cwd,
      encoding: "utf8",
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024 * 4
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        message: error ? error.message : ""
      });
    });
  });
}

function normalizedFiles(value) {
  return Array.isArray(value) ? [...value].sort() : [];
}

function compareLists(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return {
    missing: right.filter((item) => !leftSet.has(item)),
    extra: left.filter((item) => !rightSet.has(item))
  };
}

function normalizePackedPath(entry) {
  return String(entry || "").replace(/^package\//, "");
}

async function buildReport(root, runtimeRel) {
  const runtimeRoot = path.resolve(root, runtimeRel);
  const packageJson = readJson(path.join(runtimeRoot, "package.json"));
  const packageDistJson = readJson(path.join(runtimeRoot, "package.dist.json"));
  const packageFiles = normalizedFiles(packageJson.files);
  const distFiles = normalizedFiles(packageDistJson.files);
  const manifestComparison = compareLists(packageFiles, distFiles);
  const pack = await run("npm", ["pack", "--dry-run", "--json"], { cwd: runtimeRoot, timeout: 60000 });
  let packEntries = [];
  let packParseOk = false;
  if (pack.ok) {
    try {
      const parsed = JSON.parse(pack.stdout);
      const first = Array.isArray(parsed) ? parsed[0] : parsed;
      packEntries = Array.isArray(first?.files)
        ? first.files.map((item) => normalizePackedPath(item.path)).sort()
        : [];
      packParseOk = true;
    } catch {
      packParseOk = false;
    }
  }
  const intendedPackFiles = [...new Set([
    "package.json",
    ...packageFiles
  ])].sort();
  const packComparison = compareLists(packEntries, intendedPackFiles);
  const requiredChecks = {
    package_json_parse: Boolean(packageJson.name && packageJson.version),
    package_dist_json_parse: Boolean(packageDistJson.name && packageDistJson.version),
    package_files_match_dist_files: manifestComparison.missing.length === 0 && manifestComparison.extra.length === 0,
    npm_pack_dry_run_ok: pack.ok && packParseOk,
    npm_pack_matches_intent: pack.ok && packParseOk && packComparison.missing.length === 0 && packComparison.extra.length === 0,
    release_notes_included: packEntries.includes(`RELEASE-NOTES-v${packageJson?.version}-ko.md`),
    readme_dist_intentionally_included: packageFiles.includes("README.dist.md") && distFiles.includes("README.dist.md") && packEntries.includes("README.dist.md")
  };
  return {
    schema: "beai.package_truth_check.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    runtime_root: runtimeRoot,
    status: Object.values(requiredChecks).every(Boolean) ? "pass" : "fail",
    package_name: packageJson.name,
    package_version: packageJson.version,
    checks: requiredChecks,
    package_files: packageFiles,
    package_dist_files: distFiles,
    package_vs_dist: manifestComparison,
    npm_pack: {
      ok: pack.ok,
      parse_ok: packParseOk,
      entries: packEntries,
      stderr: pack.stderr.trim(),
      error: pack.message
    },
    intended_pack_files: intendedPackFiles,
    pack_vs_intent: packComparison,
    not_performed: [
      "no release archive creation",
      "no publish",
      "no install",
      "no OpenClaw core change",
      "no Gateway restart",
      "no Telegram send",
      "no cron, hook, or agent mutation"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# GPAO for OpenClaw Package Truth Check");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Runtime root: ${report.runtime_root}`);
  lines.push(`Package: ${report.package_name}@${report.package_version}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const [key, value] of Object.entries(report.checks)) {
    lines.push(`- ${value ? "PASS" : "FAIL"}: ${key}`);
  }
  lines.push("");
  lines.push("## package.json vs package.dist.json");
  lines.push("");
  lines.push(`- missing from package.json: ${report.package_vs_dist.missing.join(", ") || "none"}`);
  lines.push(`- extra in package.json: ${report.package_vs_dist.extra.join(", ") || "none"}`);
  lines.push("");
  lines.push("## npm pack vs intent");
  lines.push("");
  lines.push(`- missing from npm pack: ${report.pack_vs_intent.missing.join(", ") || "none"}`);
  lines.push(`- extra in npm pack: ${report.pack_vs_intent.extra.join(", ") || "none"}`);
  lines.push("");
  lines.push("## Not Performed");
  lines.push("");
  for (const item of report.not_performed) lines.push(`- ${item}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (!["json", "md"].includes(options.format)) throw new Error("--format must be json or md");
  const root = path.resolve(options.root);
  const report = await buildReport(root, options.runtime);
  const rendered = options.format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
