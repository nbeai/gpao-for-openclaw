#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function checkPaths(root, paths) {
  return paths.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    return {
      path: relativePath,
      exists: fileExists(absolutePath)
    };
  });
}

function statusFor(checks) {
  return checks.every((item) => item.exists) ? "ready" : "partial";
}

function flowStatus(ok, partial = false) {
  if (ok) return "verified";
  return partial ? "required" : "blocked";
}

function buildFlowSummary(report) {
  const configuredOk = report.manifest_has_beai_doctor && report.manifest_has_doctor_trust_module;
  const registeredOk = report.manifest_has_beai_doctor;
  const callableOk = report.required_file_status === "ready";
  const outputVerifiedOk = report.package_status === "ready";
  const evidenceState = {
    configured: flowStatus(configuredOk, true),
    registered: flowStatus(registeredOk, true),
    callable: flowStatus(callableOk, true),
    outputVerified: outputVerifiedOk ? "verified" : "unverified",
    doctor: report.telegram_delivery_contract_status === "ready" ? "verified" : "review",
    release: "review"
  };
  return {
    source: "beai-doctor-package-check",
    status_language: "flow_state_evidence_v0_1",
    evidenceState,
    releaseBoundary: "release_verifier_required",
    userMeaning: outputVerifiedOk
      ? "Doctor package integration is ready as a package-level candidate; release wording still requires Release Verifier."
      : "Doctor package integration is not fully output-verified; keep release wording in review state."
  };
}

function checkTelegramDeliveryContract(root) {
  const configPath = path.join(root, "config/beai-telegram-delivery-contract.json");
  if (!fileExists(configPath)) {
    return {
      status: "partial",
      checks: {
        config_exists: false
      }
    };
  }
  const contract = readJson(configPath);
  const rules = contract.rules || {};
  const issueCodes = Array.isArray(contract.doctor_issue_codes) ? contract.doctor_issue_codes : [];
  const checks = {
    config_exists: true,
    internal_final_answer_is_not_delivery: rules.internal_final_answer_is_not_delivery === true,
    telegram_direct_completion_requires_message_tool: rules.telegram_direct_completion_requires_message_tool === true,
    telegram_direct_completion_requires_message_id: rules.telegram_direct_completion_requires_message_id === true,
    reply_payload_sending_is_candidate_only: rules.reply_payload_sending_is_candidate_only === true,
    message_sent_hook_closes_delivery_with_message_id: rules.message_sent_hook_closes_delivery_with_message_id === true,
    gateway_restart_recovery_requires_visible_closeout: rules.gateway_restart_recovery_requires_visible_closeout === true,
    generated_response_requires_delivery_ledger: rules.generated_response_requires_delivery_ledger === true,
    generated_without_message_id_remains_unverified: rules.generated_without_message_id_remains_unverified === true,
    gateway_restart_recovery_requires_pending_delivery_scan: rules.gateway_restart_recovery_requires_pending_delivery_scan === true,
    recovery_resend_requires_idempotency_key: rules.recovery_resend_requires_idempotency_key === true,
    quick_first_status_before_deep_check: rules.quick_first_status_before_deep_check === true,
    phase_timing_telemetry_required: rules.phase_timing_telemetry_required === true,
    long_running_work_requires_visible_progress: rules.long_running_work_requires_visible_progress === true,
    doctor_detects_missing_contract: issueCodes.includes("beai-visible-delivery-contract-missing"),
    doctor_detects_candidate_not_verified: issueCodes.includes("beai-visible-delivery-candidate-not-verified"),
    doctor_detects_message_sent_unverified: issueCodes.includes("beai-visible-delivery-message-sent-unverified"),
    doctor_detects_generated_response_delivery_unverified: issueCodes.includes("beai-generated-response-delivery-unverified"),
    doctor_detects_restart_pending_delivery_scan_missing: issueCodes.includes("beai-gateway-restart-pending-delivery-scan-missing"),
    doctor_detects_quick_first_status_gap: issueCodes.includes("beai-quick-first-status-missing"),
    doctor_detects_phase_timing_missing: issueCodes.includes("beai-phase-timing-telemetry-missing"),
    doctor_detects_long_running_progress_gap: issueCodes.includes("beai-long-running-visible-progress-missing"),
    telegram_direct_non_install_surfaces_are_observer_only: rules.telegram_direct_non_install_surfaces_are_observer_only === true,
    doctor_detects_telegram_direct_hard_surface_risk: issueCodes.includes("beai-telegram-direct-hard-surface-risk")
  };
  return {
    status: Object.values(checks).every(Boolean) ? "ready" : "partial",
    checks
  };
}

function checkOperationalNotificationContract(root) {
  const configPath = path.join(root, "config/beai-operational-notification-contract.json");
  if (!fileExists(configPath)) {
    return {
      status: "partial",
      checks: {
        config_exists: false
      }
    };
  }
  const contract = readJson(configPath);
  const rules = contract.rules || {};
  const issueCodes = Array.isArray(contract.doctor_issue_codes) ? contract.doctor_issue_codes : [];
  const forbiddenRawMarkers = Array.isArray(contract.forbidden_raw_markers) ? contract.forbidden_raw_markers : [];
  const checks = {
    config_exists: true,
    dry_run_default_notify_false: rules.dry_run_default_notify_false === true,
    watchdog_route_dry_run_default_suppressed: rules.watchdog_route_dry_run_default_suppressed === true,
    internal_review_candidates_are_not_user_tasks: rules.internal_review_candidates_are_not_user_tasks === true,
    internal_candidate_markers_must_not_be_sent_raw: rules.internal_candidate_markers_must_not_be_sent_raw === true,
    user_visible_operational_notice_requires_action_frame: rules.user_visible_operational_notice_requires_action_frame === true,
    user_visible_no_action_notice_must_say_no_user_action: rules.user_visible_no_action_notice_must_say_no_user_action === true,
    cron_candidate_is_not_cron_ready: rules.cron_candidate_is_not_cron_ready === true,
    automation_registration_requires_separate_approval: rules.automation_registration_requires_separate_approval === true,
    forbidden_raw_marker_review_first: forbiddenRawMarkers.includes("[검토 우선 / 비영구 메모]"),
    forbidden_raw_marker_watchdog_dry_run: forbiddenRawMarkers.includes("BEAI watchdog route dry-run"),
    doctor_detects_raw_internal_candidate: issueCodes.includes("beai-operational-notice-raw-internal-candidate"),
    doctor_detects_dry_run_over_notified: issueCodes.includes("beai-operational-notice-dry-run-over-notified"),
    doctor_detects_action_frame_missing: issueCodes.includes("beai-operational-notice-action-frame-missing"),
    doctor_detects_cron_readiness_overclaimed: issueCodes.includes("beai-operational-notice-cron-readiness-overclaimed")
  };
  return {
    status: Object.values(checks).every(Boolean) ? "ready" : "partial",
    checks
  };
}

function checkHumanCompanionQualityContract(root) {
  const configPath = path.join(root, "config/beai-human-companion-quality-contract.json");
  if (!fileExists(configPath)) {
    return {
      status: "partial",
      checks: {
        config_exists: false
      }
    };
  }
  const contract = readJson(configPath);
  const rules = contract.rules || {};
  const requiredRuntimeSymbols = Array.isArray(contract.required_runtime_symbols) ? contract.required_runtime_symbols : [];
  const requiredGateCoverage = Array.isArray(contract.required_gate_coverage) ? contract.required_gate_coverage : [];
  const checks = {
    config_exists: true,
    current_request_is_primary_anchor: rules.current_request_is_primary_anchor === true,
    prior_context_supports_but_must_not_override_current_request: rules.prior_context_supports_but_must_not_override_current_request === true,
    response_must_reduce_cognitive_load: rules.response_must_reduce_cognitive_load === true,
    response_must_preserve_user_agency: rules.response_must_preserve_user_agency === true,
    response_must_return_decision_or_action_handle: rules.response_must_return_decision_or_action_handle === true,
    long_conversation_requires_continuity_boundary: rules.long_conversation_requires_continuity_boundary === true,
    repair_turn_requires_trust_recovery_before_expansion: rules.repair_turn_requires_trust_recovery_before_expansion === true,
    artifact_request_requires_usable_output_before_explanation: rules.artifact_request_requires_usable_output_before_explanation === true,
    uncertainty_must_be_separated_from_verified_state: rules.uncertainty_must_be_separated_from_verified_state === true,
    status_claim_must_not_exceed_evidence: rules.status_claim_must_not_exceed_evidence === true,
    runtime_symbol_profile: requiredRuntimeSymbols.includes("HumanCompanionQualityProfile"),
    runtime_symbol_builder: requiredRuntimeSymbols.includes("buildHumanCompanionQualityProfile"),
    runtime_symbol_turn_plan: requiredRuntimeSymbols.includes("humanCompanionQuality"),
    gate_flow_regression: requiredGateCoverage.includes("beai-flow-regression-gate"),
    gate_user_scenario: requiredGateCoverage.includes("beai-user-scenario-audit"),
    gate_doctor_package_check: requiredGateCoverage.includes("beai-doctor-package-check"),
    gate_package_verify: requiredGateCoverage.includes("beai-package-verify")
  };
  return {
    status: Object.values(checks).every(Boolean) ? "ready" : "partial",
    checks
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Doctor Package Check");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- manifest_has_beai_doctor: ${report.manifest_has_beai_doctor}`);
  lines.push(`- manifest_has_doctor_trust_module: ${report.manifest_has_doctor_trust_module}`);
  lines.push(`- required_file_status: ${report.required_file_status}`);
  lines.push(`- telegram_delivery_contract_status: ${report.telegram_delivery_contract_status}`);
  lines.push(`- operational_notification_contract_status: ${report.operational_notification_contract_status}`);
  lines.push(`- human_companion_quality_contract_status: ${report.human_companion_quality_contract_status}`);
  lines.push(`- trust_gate_status_count: ${report.trust_gate_status_count}`);
  lines.push(`- ledger_entry_count: ${report.ledger_entry_count}`);
  lines.push(`- package_status: ${report.package_status}`);
  lines.push(`- flow_output_verified: ${report.flow_summary?.evidenceState?.outputVerified || "unknown"}`);
  lines.push(`- flow_release: ${report.flow_summary?.evidenceState?.release || "unknown"}`);
  lines.push("");
  lines.push("## Required Files");
  lines.push("");
  for (const item of report.required_files) {
    lines.push(`- ${item.exists ? "OK" : "MISSING"}: ${item.path}`);
  }
  lines.push("");
  lines.push("## Telegram Delivery Contract");
  lines.push("");
  for (const [key, value] of Object.entries(report.telegram_delivery_contract_checks || {})) {
    lines.push(`- ${value ? "OK" : "MISSING"}: ${key}`);
  }
  lines.push("");
  lines.push("## Operational Notification Contract");
  lines.push("");
  for (const [key, value] of Object.entries(report.operational_notification_contract_checks || {})) {
    lines.push(`- ${value ? "OK" : "MISSING"}: ${key}`);
  }
  lines.push("");
  lines.push("## Human Companion Quality Contract");
  lines.push("");
  for (const [key, value] of Object.entries(report.human_companion_quality_contract_checks || {})) {
    lines.push(`- ${value ? "OK" : "MISSING"}: ${key}`);
  }
  lines.push("");
  lines.push("## Not Performed");
  lines.push("");
  lines.push("- no live OpenClaw config change");
  lines.push("- no Gateway restart");
  lines.push("- no cron or hook mutation");
  lines.push("- no durable memory write");
  lines.push("- no external send");
  lines.push("- no public release publishing");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const root = path.resolve(argValue("--root", "."));
  const jsonOutput = path.resolve(argValue("--json-output", "docs/03-verification/generated/beai-doctor-package-check.json"));
  const markdownOutput = path.resolve(argValue("--markdown-output", "docs/03-verification/generated/beai-doctor-package-check.md"));

  const manifest = readJson(path.join(root, "capability-pack.json"));
  const trustGate = readJson(path.join(root, "config/beai-trust-gate-statuses.json"));
  const ledger = readJson(path.join(root, "state/beai/agent-trust-ledger.json"));

  const requiredFiles = checkPaths(root, [
    "skills/beai-doctor/SKILL.md",
    "tools/beai-doctor.js",
    "tools/install-wake-guard-launchagent.js",
    "docs/BEAI-DOCTOR-PACKAGE-INTEGRATION-v0.1-ko.md",
    "docs/BEAI-TRUST-GATE-v0.1-ko.md",
    "docs/BEAI-AGENT-TRUST-LEDGER-v0.1-ko.md",
    "docs/BEAI-CONNECTOR-ONBOARDING-v0.1-ko.md",
    "docs/BEAI-TELEGRAM-DELIVERY-CONTRACT-v0.1-ko.md",
    "docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md",
    "docs/BEAI-HUMAN-COMPANION-QUALITY-CONTRACT-v0.1-ko.md",
    "docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md",
    "docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md",
    "skills/beai-korean-natural-writing-skill.md",
    "config/beai-trust-gate-statuses.json",
    "config/beai-connector-onboarding-checklist.json",
    "config/beai-telegram-delivery-contract.json",
    "config/beai-operational-notification-contract.json",
    "config/beai-human-companion-quality-contract.json",
    "state/beai/agent-trust-ledger.json",
    "tools/beai-doctor-package-check.mjs",
    "tools/beai-operational-notification-gate.mjs",
    "tools/beai-organic-flow-audit.mjs",
    "docs/BEAI-PACKAGE-ORGANIC-FLOW-AUDIT-v0.1-ko.md"
  ]);

  const manifestHasDoctor = Array.isArray(manifest.skills)
    && manifest.skills.some((skill) => skill.id === "beai-doctor");
  const manifestHasDoctorTrustModule = Array.isArray(manifest.candidateModules)
    && manifest.candidateModules.some((module) => module.id === "beai-doctor-runtime-trust-upgrade");
  const telegramDeliveryContract = checkTelegramDeliveryContract(root);
  const operationalNotificationContract = checkOperationalNotificationContract(root);
  const humanCompanionQualityContract = checkHumanCompanionQualityContract(root);

  const requiredFileStatus = statusFor(requiredFiles);
  const packageStatus = manifestHasDoctor && manifestHasDoctorTrustModule && requiredFileStatus === "ready" && telegramDeliveryContract.status === "ready" && operationalNotificationContract.status === "ready" && humanCompanionQualityContract.status === "ready"
    ? "ready"
    : "partial";

  const report = {
    schema: "beai.doctor_package_check.v0.1",
    generated_at: new Date().toISOString(),
    package_root: root,
    manifest_has_beai_doctor: manifestHasDoctor,
    manifest_has_doctor_trust_module: manifestHasDoctorTrustModule,
    required_file_status: requiredFileStatus,
    telegram_delivery_contract_status: telegramDeliveryContract.status,
    telegram_delivery_contract_checks: telegramDeliveryContract.checks,
    operational_notification_contract_status: operationalNotificationContract.status,
    operational_notification_contract_checks: operationalNotificationContract.checks,
    human_companion_quality_contract_status: humanCompanionQualityContract.status,
    human_companion_quality_contract_checks: humanCompanionQualityContract.checks,
    trust_gate_status_count: Array.isArray(trustGate.statuses) ? trustGate.statuses.length : 0,
    ledger_entry_count: Array.isArray(ledger.entries) ? ledger.entries.length : 0,
    package_status: packageStatus,
    required_files: requiredFiles,
    not_performed: [
      "live OpenClaw config change",
      "Gateway restart",
      "cron or hook mutation",
      "durable memory write",
      "external send",
      "public release publishing"
    ]
  };
  report.flow_summary = buildFlowSummary(report);
  report.flow_state_evidence = report.flow_summary.evidenceState;

  ensureDir(jsonOutput);
  fs.writeFileSync(jsonOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  ensureDir(markdownOutput);
  fs.writeFileSync(markdownOutput, renderMarkdown(report), "utf8");

  process.stdout.write(`${JSON.stringify({
    json_output: jsonOutput,
    markdown_output: markdownOutput,
    package_status: packageStatus,
    required_file_status: requiredFileStatus
  }, null, 2)}\n`);
}

main();
