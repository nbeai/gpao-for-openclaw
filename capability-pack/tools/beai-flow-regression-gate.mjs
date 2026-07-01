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
  node tools/beai-flow-regression-gate.mjs [--root <capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

This helper performs read-only package-wide Flow State regression checks.
It does not write memory, change OpenClaw config, register cron/hooks/agents, send messages, package releases, or restart Gateway.
`;
}

function readText(root, relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function has(text, pattern) {
  return pattern.test(text);
}

function checkContains(files, root, check) {
  const text = files[check.file] ?? readText(root, check.file);
  const ok = has(text, check.pattern);
  return {
    id: check.id,
    lane: check.lane,
    regression: check.regression,
    status: ok ? "pass" : "fail",
    file: check.file,
    description: check.description,
    evidence: ok ? check.passEvidence : check.failEvidence
  };
}

function checkAbsent(files, root, check) {
  const text = files[check.file] ?? readText(root, check.file);
  const ok = !has(text, check.pattern);
  return {
    id: check.id,
    lane: check.lane,
    regression: check.regression,
    status: ok ? "pass" : "fail",
    file: check.file,
    description: check.description,
    evidence: ok ? check.passEvidence : check.failEvidence
  };
}

const CHECKS = [
  {
    id: "self-check-flow-spine-present",
    lane: "self-check",
    regression: "state_confusion",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /export function buildFlowStateSpine/,
    description: "Flow State spine exists inside the OpenClaw BEAI Runtime layer.",
    passEvidence: "buildFlowStateSpine is present.",
    failEvidence: "Flow State spine builder is missing."
  },
  {
    id: "self-check-response-gate-present",
    lane: "self-check",
    regression: "artifact_delay",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /export function buildRuntimeResponseGateProfile/,
    description: "Runtime response gate exists before final output.",
    passEvidence: "buildRuntimeResponseGateProfile is present.",
    failEvidence: "Runtime response gate is missing."
  },
  {
    id: "self-check-evidence-language-present",
    lane: "self-check",
    regression: "completion_overclaim",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /export function buildFlowStateEvidenceState/,
    description: "Flow evidence state translation exists.",
    passEvidence: "buildFlowStateEvidenceState is present.",
    failEvidence: "Flow evidence state builder is missing."
  },
  {
    id: "engineering-no-standalone-flow-engine",
    lane: "engineering-quality",
    regression: "state_confusion",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /class\s+FlowEngine|new\s+FlowEngine/,
    mode: "absent",
    description: "Flow State remains a spine in the existing runtime, not a separate engine.",
    passEvidence: "No standalone FlowEngine class is present.",
    failEvidence: "Standalone FlowEngine pattern detected."
  },
  {
    id: "engineering-openclaw-runtime-first-policy",
    lane: "engineering-quality",
    regression: "current_request_drift",
    file: "capability-pack.json",
    pattern: /first implementation target is the OpenClaw BEAI Runtime Layer and Package/i,
    description: "Manifest keeps OpenClaw Runtime as the first implementation target.",
    passEvidence: "flowEnginePolicy keeps OpenClaw Runtime first.",
    failEvidence: "flowEnginePolicy no longer states OpenClaw Runtime first."
  },
  {
    id: "field-readiness-current-input-preserved",
    lane: "field-readiness",
    regression: "current_request_drift",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /current_input:\s*\$\{plan\.currentTurn\.cleanInput\}/,
    description: "Runtime overlay preserves the current input.",
    passEvidence: "current_input is rendered from currentTurn.cleanInput.",
    failEvidence: "Current input render anchor is missing."
  },
  {
    id: "field-readiness-closure-handle-preserved",
    lane: "field-readiness",
    regression: "state_confusion",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /closure_handle:\s*\$\{plan\.flowState\.closureHandle\}/,
    description: "Closure handle remains visible across runtime planning.",
    passEvidence: "closure_handle is rendered from flowState.",
    failEvidence: "closure_handle render anchor is missing."
  },
  {
    id: "field-readiness-visible-delivery-boundary",
    lane: "field-readiness",
    regression: "completion_overclaim",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /visible_delivery:\s*\$\{plan\.flowState\.deliverySurface\.visibleDelivery\}/,
    description: "Visible delivery state is separated from internal completion.",
    passEvidence: "visible_delivery is rendered from deliverySurface.",
    failEvidence: "visible delivery boundary is missing."
  },
  {
    id: "field-readiness-generated-response-ledger-required",
    lane: "field-readiness",
    regression: "completion_overclaim",
    file: "config/beai-telegram-delivery-contract.json",
    pattern: /"generated_response_requires_delivery_ledger":\s*true/,
    description: "Generated Telegram responses require a delivery ledger before completion claims.",
    passEvidence: "Delivery contract requires a generated response ledger.",
    failEvidence: "Delivery contract does not require a generated response ledger."
  },
  {
    id: "field-readiness-runtime-delivery-ledger-present",
    lane: "field-readiness",
    regression: "completion_overclaim",
    file: "../plugin/beai-runtime/src/index.ts",
    pattern: /telegram-delivery-ledger\.jsonl/,
    description: "Runtime records Telegram generated/send result states in a delivery ledger.",
    passEvidence: "Runtime delivery ledger path is present.",
    failEvidence: "Runtime delivery ledger path is missing."
  },
  {
    id: "field-readiness-generated-without-message-id-unverified",
    lane: "field-readiness",
    regression: "completion_overclaim",
    file: "config/beai-telegram-delivery-contract.json",
    pattern: /"generated_without_message_id_remains_unverified":\s*true/,
    description: "Generated or attempted Telegram output without messageId remains unverified.",
    passEvidence: "Delivery contract keeps generated output without messageId unverified.",
    failEvidence: "Delivery contract may allow generated output without messageId to close as delivered."
  },
  {
    id: "field-readiness-restart-pending-delivery-scan",
    lane: "field-readiness",
    regression: "restart_recovery_drop",
    file: "config/beai-telegram-delivery-contract.json",
    pattern: /"gateway_restart_recovery_requires_pending_delivery_scan":\s*true/,
    description: "Gateway restart recovery must scan generated/send_attempted responses without messageId.",
    passEvidence: "Delivery contract requires restart pending-delivery scan.",
    failEvidence: "Delivery contract does not require restart pending-delivery scan."
  },
  {
    id: "field-readiness-recovery-resend-idempotency",
    lane: "field-readiness",
    regression: "restart_recovery_drop",
    file: "docs/BEAI-TELEGRAM-DELIVERY-CONTRACT-v0.1-ko.md",
    pattern: /chat_id \+ source_message_id \+ content_hash/,
    description: "Recovery resend uses a stable idempotency key to avoid duplicate Telegram sends.",
    passEvidence: "Delivery contract documents the recovery resend idempotency key.",
    failEvidence: "Delivery contract does not document a recovery resend idempotency key."
  },
  {
    id: "perceived-quality-artifact-first-gate",
    lane: "perceived-quality",
    regression: "artifact_delay",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /artifactFirst/,
    description: "Artifact requests can be gated against explanation-first output.",
    passEvidence: "artifactFirst gate exists.",
    failEvidence: "artifactFirst gate is missing."
  },
  {
    id: "perceived-quality-safe-but-pleasant-policy",
    lane: "perceived-quality",
    regression: "safety_friction",
    file: "capability-pack.json",
    pattern: /without creating avoidable friction, delay, repeated questions, or procedural theater/i,
    description: "Safety policy also protects speed and comfort.",
    passEvidence: "Manifest includes safe-but-pleasant wording.",
    failEvidence: "Safe-but-pleasant policy wording is missing."
  },
  {
    id: "release-checklist-flow-evidence-output",
    lane: "release-checklist",
    regression: "completion_overclaim",
    file: "skills/release-verifier-skill.md",
    pattern: /Flow State Evidence:/,
    description: "Release verifier output includes Flow State Evidence.",
    passEvidence: "Release Verifier includes Flow State Evidence section.",
    failEvidence: "Release Verifier output lacks Flow State Evidence."
  },
  {
    id: "release-checklist-doctor-flow-summary",
    lane: "release-checklist",
    regression: "state_confusion",
    file: "tools/beai-doctor.js",
    pattern: /flowSummary/,
    description: "BEAI Doctor emits a Flow State summary.",
    passEvidence: "Doctor flowSummary is present.",
    failEvidence: "Doctor flowSummary is missing."
  },
  {
    id: "release-checklist-package-check-flow-evidence",
    lane: "release-checklist",
    regression: "state_confusion",
    file: "tools/beai-doctor-package-check.mjs",
    pattern: /flow_state_evidence/,
    description: "Package check emits Flow State evidence.",
    passEvidence: "Package check flow_state_evidence is present.",
    failEvidence: "Package check flow_state_evidence is missing."
  },
  {
    id: "memory-overexposure-current-judgment-impact",
    lane: "field-readiness",
    regression: "memory_overexposure",
    file: "tools/beai-knowledge-loop.mjs",
    pattern: /current_judgment_impact/,
    description: "Knowledge Loop separates memory candidates from current judgment impact.",
    passEvidence: "current_judgment_impact is present.",
    failEvidence: "current_judgment_impact is missing."
  },
  {
    id: "tool-log-overexposure-stripper",
    lane: "perceived-quality",
    regression: "tool_log_overexposure",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /INTERNAL_PROCESS_LINE_PATTERNS/,
    description: "Runtime keeps an internal process/tool-log stripping pattern list.",
    passEvidence: "INTERNAL_PROCESS_LINE_PATTERNS is present.",
    failEvidence: "Internal process line filtering is missing."
  }
];

function buildReport(root) {
  const files = {};
  for (const check of CHECKS) files[check.file] = readText(root, check.file);
  const checks = CHECKS.map((check) => check.mode === "absent"
    ? checkAbsent(files, root, check)
    : checkContains(files, root, check));
  const failed = checks.filter((check) => check.status !== "pass");
  const laneSummary = {};
  for (const check of checks) {
    laneSummary[check.lane] ||= { pass: 0, fail: 0 };
    laneSummary[check.lane][check.status] += 1;
  }
  const regressionSummary = {};
  for (const check of checks) {
    regressionSummary[check.regression] ||= { pass: 0, fail: 0 };
    regressionSummary[check.regression][check.status] += 1;
  }
  return {
    schema: "beai.flow_regression_gate.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    status: failed.length === 0 ? "pass" : "fail",
    summary: {
      total: checks.length,
      pass: checks.length - failed.length,
      fail: failed.length
    },
    lane_summary: laneSummary,
    regression_summary: regressionSummary,
    checks,
    not_performed: [
      "no durable memory write",
      "no OpenClaw core change",
      "no Gateway or Telegram config mutation",
      "no cron, hook, or agent registration",
      "no external send",
      "no release packaging"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Flow Regression Gate");
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
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const check of report.checks) {
    lines.push(`- ${check.status.toUpperCase()}: ${check.id}`);
    lines.push(`  - lane: ${check.lane}`);
    lines.push(`  - regression: ${check.regression}`);
    lines.push(`  - file: ${check.file}`);
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
  if (!["json", "md"].includes(options.format)) {
    throw new Error("--format must be json or md");
  }
  const root = path.resolve(options.root);
  const report = buildReport(root);
  const rendered = options.format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderMarkdown(report);
  if (options.stdout || !options.output) {
    process.stdout.write(rendered);
    return;
  }
  const outputPath = path.resolve(options.output);
  ensureOutputPath(outputPath);
  fs.writeFileSync(outputPath, rendered, "utf8");
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
