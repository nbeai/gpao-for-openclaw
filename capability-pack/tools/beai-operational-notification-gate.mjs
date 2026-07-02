#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    format: "json",
    output: null,
    stdout: false
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
  node tools/beai-operational-notification-gate.mjs [--root <capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

Checks the BEAI operational notification contract without sending messages, registering cron, restarting Gateway, writing memory, or changing OpenClaw core.
`;
}

function readText(root, relativePath) {
  try {
    return fs.readFileSync(path.resolve(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function readJson(root, relativePath) {
  const text = readText(root, relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function includesAny(text, items) {
  return items.some((item) => text.includes(item));
}

function hasAnyLabel(text, labels) {
  return labels.some((label) => text.includes(label));
}

function evaluateNotification(contract, candidate) {
  const forbiddenRawMarkers = asArray(contract?.forbidden_raw_markers);
  const frame = contract?.visible_action_frame || {};
  const text = String(candidate.notificationText || candidate.input || "");
  const findings = [];

  if (candidate.notify === false) {
    return {
      id: candidate.id,
      status: "pass",
      reason: "notify=false suppresses non-actionable operational signal",
      findings
    };
  }

  if (includesAny(text, forbiddenRawMarkers)) {
    findings.push("raw internal marker reached visible text");
  }

  const userActionPresent = hasAnyLabel(text, asArray(frame.allowed_user_action_labels))
    || hasAnyLabel(text, asArray(frame.no_user_action_phrases));
  const assistantActionPresent = hasAnyLabel(text, asArray(frame.allowed_assistant_action_labels));
  const notYetPresent = hasAnyLabel(text, asArray(frame.allowed_not_yet_labels));

  if (!userActionPresent) findings.push("user action or no-user-action statement missing");
  if (!assistantActionPresent) findings.push("assistant action statement missing");
  if (!notYetPresent) findings.push("not-yet boundary missing");

  return {
    id: candidate.id,
    status: findings.length === 0 ? "pass" : "fail",
    reason: findings.length === 0 ? "visible operational notice has an action frame" : "visible operational notice is ambiguous",
    findings
  };
}

function makeCheck(id, passed, evidence, severity = "P1") {
  return { id, status: passed ? "pass" : "fail", evidence, severity };
}

function buildReport(root) {
  const contractPath = "config/beai-operational-notification-contract.json";
  const docPath = "docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md";
  const manifestPath = "capability-pack.json";
  const flowGatePath = "tools/beai-flow-regression-gate.mjs";
  const scenarioAuditPath = "tools/beai-user-scenario-audit.mjs";
  const packageVerifyPath = "tools/beai-package-verify.mjs";
  const contract = readJson(root, contractPath);
  const docText = readText(root, docPath);
  const manifestText = readText(root, manifestPath);
  const flowGateText = readText(root, flowGatePath);
  const scenarioAuditText = readText(root, scenarioAuditPath);
  const packageVerifyText = readText(root, packageVerifyPath);
  const rules = contract?.rules || {};
  const forbidden = asArray(contract?.forbidden_raw_markers);
  const examples = contract?.notification_examples || {};
  const exampleCandidates = [
    { id: "suppressed-dry-run", ...(examples.suppressed_dry_run || {}) },
    { id: "allowed-no-action-notice", ...(examples.allowed_no_action_notice || {}) },
    { id: "allowed-action-notice", ...(examples.allowed_action_notice || {}) }
  ];
  const exampleChecks = exampleCandidates.map((candidate) => evaluateNotification(contract, candidate));
  const checks = [
    makeCheck("contract-exists", Boolean(contract), `${contractPath} parse ${contract ? "ok" : "failed"}`, "P0"),
    makeCheck("doc-exists", docText.includes("BEAI Operational Notification Contract"), `${docPath} contains contract title`, "P0"),
    makeCheck("dry-run-default-notify-false", rules.dry_run_default_notify_false === true, "dry-run default notify=false rule", "P0"),
    makeCheck("watchdog-dry-run-suppressed", rules.watchdog_route_dry_run_default_suppressed === true, "watchdog route dry-run suppression rule", "P0"),
    makeCheck("raw-markers-forbidden", rules.internal_candidate_markers_must_not_be_sent_raw === true && forbidden.includes("[검토 우선 / 비영구 메모]") && forbidden.includes("BEAI watchdog route dry-run"), "raw internal markers are forbidden", "P0"),
    makeCheck("action-frame-required", rules.user_visible_operational_notice_requires_action_frame === true, "visible notices require action frame", "P0"),
    makeCheck("cron-candidate-not-ready", rules.cron_candidate_is_not_cron_ready === true, "cron_candidate is not cron_ready", "P0"),
    makeCheck("manifest-policy-linked", /operationalNotificationPolicy/.test(manifestText), "capability manifest links operational notification policy", "P1"),
    makeCheck("flow-gate-linked", /operational-notification/.test(flowGateText), "flow regression gate covers operational notification", "P1"),
    makeCheck("scenario-audit-linked", /S18-operational-notification-action-frame/.test(scenarioAuditText), "user scenario audit covers operational notification", "P1"),
    makeCheck("package-verify-runs-gate", /beai-operational-notification-gate/.test(packageVerifyText), "package verify runs operational notification gate", "P1"),
    ...exampleChecks.map((check) => makeCheck(`example-${check.id}`, check.status === "pass", check.findings.length ? check.findings.join("; ") : check.reason, check.id === "suppressed-dry-run" ? "P0" : "P1"))
  ];
  const failed = checks.filter((check) => check.status !== "pass");
  return {
    schema: "beai.operational_notification_gate.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    status: failed.some((check) => check.severity === "P0") ? "fail" : failed.length ? "partial" : "pass",
    summary: {
      total: checks.length,
      pass: checks.length - failed.length,
      fail: failed.length,
      p0_failures: failed.filter((check) => check.severity === "P0").map((check) => check.id),
      p1_failures: failed.filter((check) => check.severity === "P1").map((check) => check.id)
    },
    checks,
    not_performed: [
      "no durable memory write",
      "no OpenClaw core change",
      "no Gateway or Telegram config mutation",
      "no cron, hook, or agent registration",
      "no external send",
      "no release packaging",
      "no live Telegram roundtrip"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Operational Notification Gate");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- total: ${report.summary.total}`);
  lines.push(`- pass: ${report.summary.pass}`);
  lines.push(`- fail: ${report.summary.fail}`);
  lines.push(`- P0 failures: ${report.summary.p0_failures.length ? report.summary.p0_failures.join(", ") : "none"}`);
  lines.push(`- P1 failures: ${report.summary.p1_failures.length ? report.summary.p1_failures.join(", ") : "none"}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const check of report.checks) {
    lines.push(`- ${check.status.toUpperCase()} [${check.severity}] ${check.id}`);
    lines.push(`  - evidence: ${check.evidence}`);
  }
  lines.push("");
  lines.push("## Not Performed");
  lines.push("");
  for (const item of report.not_performed) lines.push(`- ${item}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (!["json", "md"].includes(options.format)) throw new Error("--format must be json or md");
  const root = path.resolve(options.root);
  const report = buildReport(root);
  const rendered = options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status !== "pass") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
