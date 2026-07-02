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
    pattern: /closure_handle:\s*\$\{sanitizeRepeatedFooterInstruction\(plan\.flowState\.closureHandle\)\}/,
    description: "Closure handle remains visible after repeated-footer sanitization.",
    passEvidence: "closure_handle is rendered from sanitized flowState.",
    failEvidence: "sanitized closure_handle render anchor is missing."
  },
  {
    id: "field-readiness-no-forced-footer-rule",
    lane: "field-readiness",
    regression: "repeated_footer_instruction",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /final answer should not append the current decision handle as a repeated footer/,
    description: "Runtime must not instruct answers to end with decision handles.",
    passEvidence: "forced decision-handle footer rule is inverted.",
    failEvidence: "forced decision-handle footer guard is missing."
  },
  {
    id: "field-readiness-stale-footer-sanitizer",
    lane: "field-readiness",
    regression: "repeated_footer_instruction",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /sanitizeRepeatedFooterInstruction/,
    description: "Stale closure handles are sanitized before prompt rendering.",
    passEvidence: "stale repeated-footer sanitizer exists.",
    failEvidence: "stale repeated-footer sanitizer is missing."
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
    id: "field-readiness-telegram-direct-hard-surface-observer-only",
    lane: "field-readiness",
    regression: "telegram_reply_blocked_by_beai_surface",
    file: "../plugin/beai-runtime/src/index.ts",
    pattern: /telegram direct hard surface deferred to model/,
    description: "Telegram direct non-install BEAI surfaces defer to the model instead of replacing the reply.",
    passEvidence: "Runtime records observer-only deferral for Telegram direct hard surfaces.",
    failEvidence: "Runtime may hard-rewrite Telegram direct replies with BEAI surfaces."
  },
  {
    id: "field-readiness-telegram-direct-hard-surface-contract",
    lane: "field-readiness",
    regression: "telegram_reply_blocked_by_beai_surface",
    file: "config/beai-telegram-delivery-contract.json",
    pattern: /"telegram_direct_non_install_surfaces_are_observer_only":\s*true/,
    description: "Delivery contract requires Telegram direct non-install surfaces to stay observer-only.",
    passEvidence: "Delivery contract declares observer-only Telegram direct non-install surfaces.",
    failEvidence: "Delivery contract does not protect Telegram direct from hard BEAI surfaces."
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
    id: "human-companion-quality-profile-present",
    lane: "perceived-quality",
    regression: "human_companion_quality_regression",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /export type HumanCompanionQualityProfile/,
    description: "Runtime has a Human Companion Quality profile, not only generic tone guidance.",
    passEvidence: "HumanCompanionQualityProfile is present.",
    failEvidence: "Human Companion Quality profile is missing."
  },
  {
    id: "human-companion-quality-builder-present",
    lane: "perceived-quality",
    regression: "human_companion_quality_regression",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /export function buildHumanCompanionQualityProfile/,
    description: "Runtime builds human companion quality from turn state.",
    passEvidence: "buildHumanCompanionQualityProfile is present.",
    failEvidence: "Human Companion Quality builder is missing."
  },
  {
    id: "human-companion-quality-current-request-anchor",
    lane: "perceived-quality",
    regression: "current_request_drift",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /current request must remain the first anchor/,
    description: "Human companion quality explicitly protects the latest user request as first anchor.",
    passEvidence: "Current request anchor regression check is present.",
    failEvidence: "Current request anchor protection is missing."
  },
  {
    id: "human-companion-quality-prior-context-boundary",
    lane: "perceived-quality",
    regression: "stale_context_takeover",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /prior context must support, not override, the current turn/,
    description: "Long conversation context is bounded as supporting context, not authority over current input.",
    passEvidence: "Prior-context boundary regression check is present.",
    failEvidence: "Prior-context boundary is missing."
  },
  {
    id: "human-companion-quality-overlay-rendered",
    lane: "perceived-quality",
    regression: "human_companion_quality_regression",
    file: "../plugin/beai-runtime/src/runtime-core.ts",
    pattern: /human_companion_quality:/,
    description: "Prompt context renders the human companion quality gate.",
    passEvidence: "human_companion_quality render section is present.",
    failEvidence: "Human companion quality is not rendered into prompt context."
  },
  {
    id: "human-companion-contract-present",
    lane: "release-checklist",
    regression: "human_companion_quality_regression",
    file: "config/beai-human-companion-quality-contract.json",
    pattern: /"current_request_is_primary_anchor":\s*true/,
    description: "Package includes a machine-readable human companion quality contract.",
    passEvidence: "Human companion contract anchors the current request.",
    failEvidence: "Human companion quality contract is missing."
  },
  {
    id: "human-companion-doc-present",
    lane: "release-checklist",
    regression: "human_companion_quality_regression",
    file: "docs/BEAI-HUMAN-COMPANION-QUALITY-CONTRACT-v0.1-ko.md",
    pattern: /응답 뒤 사용자의 현실이 더 선명해지고, 판단 부담이 줄며, 실제로 쓸 수 있는 무언가가 남았는가/,
    description: "Package documents the human companion quality bar in Korean.",
    passEvidence: "Human companion quality document includes the canonical quality bar.",
    failEvidence: "Human companion quality document is missing or weakened."
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
    id: "knowledge-loop-auto-capture-not-auto-approve-doc",
    lane: "field-readiness",
    regression: "memory_overexposure",
    file: "docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md",
    pattern: /Auto-capture, not auto-approve\./,
    description: "Knowledge Loop automation is anchored on auto-capture, not auto-approve.",
    passEvidence: "Auto-capture principle document is present.",
    failEvidence: "Auto-capture principle document is missing or weakened."
  },
  {
    id: "knowledge-loop-approved-requires-user-approval",
    lane: "field-readiness",
    regression: "memory_overexposure",
    file: "docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md",
    pattern: /`approved`: 사용자 명시 승인 필요/,
    description: "Approved state remains user-approved, not automatically promoted.",
    passEvidence: "Approved state requires explicit user approval.",
    failEvidence: "Approved state approval boundary is missing."
  },
  {
    id: "knowledge-loop-manifest-lists-auto-capture-boundary",
    lane: "release-checklist",
    regression: "completion_overclaim",
    file: "capability-pack.json",
    pattern: /auto-capture-not-auto-approve automation boundary/,
    description: "Manifest lists the Knowledge Loop auto-capture boundary.",
    passEvidence: "Manifest includes the auto-capture boundary scope.",
    failEvidence: "Manifest does not list the auto-capture boundary scope."
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
  },
  {
    id: "operational-notification-contract-present",
    lane: "perceived-quality",
    regression: "operational_notification_confusion",
    file: "config/beai-operational-notification-contract.json",
    pattern: /"dry_run_default_notify_false":\s*true/,
    description: "Operational dry-runs default to non-notifying unless user attention is needed.",
    passEvidence: "Operational notification contract suppresses non-actionable dry-runs.",
    failEvidence: "Operational notification dry-run suppression is missing."
  },
  {
    id: "operational-notification-raw-candidate-markers-forbidden",
    lane: "perceived-quality",
    regression: "operational_notification_confusion",
    file: "config/beai-operational-notification-contract.json",
    pattern: /"\[검토 우선 \/ 비영구 메모\]"[\s\S]*"BEAI watchdog route dry-run"/,
    description: "Raw internal review and watchdog dry-run markers are forbidden in visible user notices.",
    passEvidence: "Forbidden raw operational markers are declared.",
    failEvidence: "Forbidden raw operational markers are missing."
  },
  {
    id: "operational-notification-action-frame-required",
    lane: "perceived-quality",
    regression: "operational_notification_confusion",
    file: "config/beai-operational-notification-contract.json",
    pattern: /"user_visible_operational_notice_requires_action_frame":\s*true/,
    description: "User-visible operational notices require an action ownership frame.",
    passEvidence: "Action frame requirement is present.",
    failEvidence: "Action frame requirement is missing."
  },
  {
    id: "operational-notification-gate-linked",
    lane: "release-checklist",
    regression: "operational_notification_confusion",
    file: "tools/beai-package-verify.mjs",
    pattern: /beai-operational-notification-gate\.mjs/,
    description: "Package verify runs the operational notification gate.",
    passEvidence: "Operational notification gate is included in package verify.",
    failEvidence: "Package verify does not run operational notification gate."
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
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) {
    process.stdout.write(rendered);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
