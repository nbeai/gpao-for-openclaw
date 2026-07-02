#!/usr/bin/env node

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    outputDir: "capability-pack/docs/03-verification/generated",
    format: "json",
    output: null,
    stdout: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--output-dir") options.outputDir = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node capability-pack/tools/beai-package-verify.mjs [--root <package-root>] [--output-dir <dir>] [--format json|md] [--output <path>] [--stdout]

Runs package-owned verification only. It does not create release zips, publish, install, restart Gateway, send Telegram messages, mutate cron/agents/hooks, write memory, or change OpenClaw core.
`;
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function run(command, args, options = {}) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: options.cwd,
      encoding: "utf8",
      timeout: options.timeout || 120000,
      maxBuffer: 1024 * 1024 * 8
    }, (error, stdout, stderr) => {
      resolve({
        id: options.id,
        command: [command, ...args].join(" "),
        cwd: options.cwd,
        ok: !error,
        exitCode: error && typeof error.code === "number" ? error.code : 0,
        durationMs: Date.now() - startedAt,
        stdout: String(stdout || "").slice(-12000),
        stderr: String(stderr || "").slice(-12000),
        error: error ? error.message : ""
      });
    });
  });
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function scanStaleClaims(root) {
  const targets = [
    "README.md",
    "capability-pack/README.md",
    "capability-pack/capability-pack.json",
    "plugin/beai-runtime/README.md",
    "plugin/beai-runtime/README.dist.md",
    "plugin/beai-runtime/package.json",
    "plugin/beai-runtime/package.dist.json"
  ];
  const patterns = [
    { id: "old-flow-count", pattern: /20\/20 pass/i },
    { id: "old-test-count", pattern: /197 passed/i },
    { id: "old-openclaw-version", pattern: /openclaw@2026\.6\.9/i },
    { id: "overclaimed-telegram-roundtrip", pattern: /Telegram live roundtrip:\s*verified after gateway restart/i },
    { id: "default-manifest-registered-automations", pattern: /"registeredAutomations"\s*:/i }
  ];
  const findings = [];
  for (const target of targets) {
    const text = readText(path.join(root, target));
    for (const item of patterns) {
      if (item.pattern.test(text)) findings.push({ file: target, id: item.id });
    }
  }
  return {
    status: findings.length === 0 ? "pass" : "fail",
    findings,
    scanned: targets
  };
}

async function buildReport(root, outputDir) {
  const generatedDir = path.resolve(root, outputDir);
  fs.mkdirSync(generatedDir, { recursive: true });

  const runtimeRoot = path.join(root, "plugin/beai-runtime");
  const capabilityRoot = path.join(root, "capability-pack");
  const commands = [
    () => run("npm", ["run", "build"], { id: "runtime-build", cwd: runtimeRoot, timeout: 120000 }),
    () => run("npm", ["test"], { id: "runtime-syntax-test", cwd: runtimeRoot, timeout: 120000 }),
    () => run("npm", ["audit", "--omit=dev"], { id: "runtime-prod-audit", cwd: runtimeRoot, timeout: 120000 }),
    () => run("node", ["capability-pack/tools/beai-doctor.js", "--help"], { id: "doctor-help-usage-only", cwd: root, timeout: 30000 }),
    () => run("node", ["tools/beai-doctor-package-check.mjs", "--root", ".", "--json-output", path.join(generatedDir, "beai-doctor-package-check-verify.json"), "--markdown-output", path.join(generatedDir, "beai-doctor-package-check-verify.md")], { id: "doctor-package-check", cwd: capabilityRoot, timeout: 60000 }),
    () => run("node", ["tools/beai-flow-regression-gate.mjs", "--root", ".", "--format", "json", "--output", path.join(generatedDir, "beai-flow-regression-gate-verify.json")], { id: "flow-regression-gate", cwd: capabilityRoot, timeout: 60000 }),
    () => run("node", ["tools/beai-user-scenario-audit.mjs", "--root", ".", "--format", "json", "--output", path.join(generatedDir, "beai-user-scenario-audit-verify.json")], { id: "user-scenario-audit", cwd: capabilityRoot, timeout: 60000 }),
    () => run("node", ["tools/beai-operational-notification-gate.mjs", "--root", ".", "--format", "json", "--output", path.join(generatedDir, "beai-operational-notification-gate-verify.json")], { id: "operational-notification-gate", cwd: capabilityRoot, timeout: 60000 }),
    () => run("node", ["tools/beai-organic-flow-audit.mjs", "--root", ".", "--format", "json", "--output", path.join(generatedDir, "beai-organic-flow-audit-verify.json")], { id: "organic-flow-audit", cwd: capabilityRoot, timeout: 60000 }),
    () => run("node", ["capability-pack/tools/beai-package-truth-check.mjs", "--root", ".", "--format", "json", "--output", path.join(generatedDir, "beai-package-truth-check-verify.json")], { id: "package-truth-check", cwd: root, timeout: 120000 })
  ];

  const results = [];
  for (const command of commands) results.push(await command());
  const staleClaimScan = scanStaleClaims(root);
  const failed = results.filter((result) => !result.ok).map((result) => result.id);
  if (staleClaimScan.status !== "pass") failed.push("stale-claim-scan");
  return {
    schema: "beai.package_verify.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    status: failed.length === 0 ? "pass" : "fail",
    failed,
    checks: results.map((result) => ({
      id: result.id,
      status: result.ok ? "pass" : "fail",
      command: result.command,
      cwd: result.cwd,
      durationMs: result.durationMs,
      exitCode: result.exitCode,
      stdout_tail: result.stdout,
      stderr_tail: result.stderr,
      error: result.error
    })),
    stale_claim_scan: staleClaimScan,
    generated_outputs: [
      "beai-doctor-package-check-verify.json",
      "beai-doctor-package-check-verify.md",
      "beai-flow-regression-gate-verify.json",
      "beai-user-scenario-audit-verify.json",
      "beai-operational-notification-gate-verify.json",
      "beai-organic-flow-audit-verify.json",
      "beai-package-truth-check-verify.json"
    ].map((file) => path.join(generatedDir, file)),
    not_performed: [
      "no release zip creation",
      "no publish",
      "no install",
      "no Gateway restart",
      "no Telegram send",
      "no cron, hook, or agent mutation",
      "no durable memory write",
      "no OpenClaw core change"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Package Verify");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const check of report.checks) {
    lines.push(`- ${check.status.toUpperCase()}: ${check.id}`);
    lines.push(`  - command: ${check.command}`);
    lines.push(`  - durationMs: ${check.durationMs}`);
  }
  lines.push("");
  lines.push("## Stale Claim Scan");
  lines.push("");
  lines.push(`- status: ${report.stale_claim_scan.status}`);
  for (const finding of report.stale_claim_scan.findings) {
    lines.push(`- ${finding.id}: ${finding.file}`);
  }
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
  const report = await buildReport(root, options.outputDir);
  const rendered = options.format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderMarkdown(report);
  const defaultOutput = path.join(root, options.outputDir, options.format === "json" ? "beai-package-verify.json" : "beai-package-verify.md");
  const outputPath = path.resolve(options.output || defaultOutput);
  ensureOutputPath(outputPath);
  fs.writeFileSync(outputPath, rendered, "utf8");
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
