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
  node tools/beai-organic-flow-audit.mjs [--root <repo-root|capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

Audits whether BEAI Package runtime, skills, hooks, tools, evidence, and release boundaries are connected as one production operating system.
This is read-only: no memory writes, OpenClaw core changes, Gateway restart, Telegram send, cron/hook/agent registration, release packaging, or publish.
`;
}

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function resolveCapabilityRoot(inputRoot) {
  const root = path.resolve(inputRoot || ".");
  if (isFile(path.join(root, "capability-pack.json"))) return root;
  const nested = path.join(root, "capability-pack");
  if (isFile(path.join(nested, "capability-pack.json"))) return nested;
  const scriptRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  if (isFile(path.join(scriptRoot, "capability-pack.json"))) return scriptRoot;
  return root;
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

function contains(root, relativePath, pattern) {
  return pattern.test(readText(root, relativePath));
}

function jsonHasArrayItem(json, arrayPath, predicate) {
  const array = arrayPath.split(".").reduce((value, key) => value?.[key], json);
  return Array.isArray(array) && array.some(predicate);
}

function check(id, organ, description, passed, evidence, severity = "P1") {
  return {
    id,
    organ,
    description,
    status: passed ? "pass" : "fail",
    severity,
    evidence
  };
}

function buildReport(root) {
  const manifest = readJson(root, "capability-pack.json");
  const telegramContract = readJson(root, "config/beai-telegram-delivery-contract.json");
  const operationalContract = readJson(root, "config/beai-operational-notification-contract.json");
  const humanContract = readJson(root, "config/beai-human-companion-quality-contract.json");

  const telegramRules = telegramContract?.rules || {};
  const operationalRules = operationalContract?.rules || {};
  const humanRules = humanContract?.rules || {};

  const checks = [
    check(
      "brain-runtime-flow-state-spine",
      "brain",
      "Runtime has the central Flow State spine and response gate.",
      contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /export function buildFlowStateSpine/)
        && contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /export function buildRuntimeResponseGateProfile/),
      "Flow State spine and runtime response gate are present.",
      "P0"
    ),
    check(
      "brain-human-companion-quality",
      "brain",
      "Human companion quality is computed in runtime, not left as style guidance.",
      contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /HumanCompanionQualityProfile/)
        && contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /buildHumanCompanionQualityProfile/)
        && contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /human_companion_quality:/),
      "HumanCompanionQualityProfile, builder, and rendered prompt section are present.",
      "P0"
    ),
    check(
      "nervous-system-hook-fail-soft",
      "nervous_system",
      "Runtime hooks fail soft instead of blocking OpenClaw, Gateway, or Telegram reply flow.",
      contains(root, "../plugin/beai-runtime/src/index.ts", /safeOn\s*=\s*\(hookName/)
        && contains(root, "../plugin/beai-runtime/src/index.ts", /hook failed soft and BEAI output was skipped/)
        && contains(root, "../plugin/beai-runtime/src/index.ts", /must not block OpenClaw, Telegram, or Gateway reply flow/),
      "safeOn/safeOnSync failure containment and no-blocking note are present.",
      "P0"
    ),
    check(
      "nervous-system-current-request-not-overridden",
      "nervous_system",
      "Current user request remains the first routing anchor after long context or session transition.",
      contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /current_input:\s*\$\{plan\.currentTurn\.cleanInput\}/)
        && humanRules.current_request_is_primary_anchor === true
        && humanRules.prior_context_supports_but_must_not_override_current_request === true,
      "Runtime renders current input and human companion contract protects prior-context boundary.",
      "P0"
    ),
    check(
      "muscle-tools-are-package-owned",
      "muscle",
      "Package-owned tools cover verify, Doctor check, scenario audit, flow gate, truth check, operational notification, and organic flow audit.",
      [
        "tools/beai-package-verify.mjs",
        "tools/beai-doctor-package-check.mjs",
        "tools/beai-user-scenario-audit.mjs",
        "tools/beai-flow-regression-gate.mjs",
        "tools/beai-package-truth-check.mjs",
        "tools/beai-operational-notification-gate.mjs",
        "tools/beai-organic-flow-audit.mjs"
      ].every((file) => fs.existsSync(path.resolve(root, file))),
      "All package-owned verification muscles exist.",
      "P0"
    ),
    check(
      "muscle-skills-are-routed-through-manifest",
      "muscle",
      "Packaged skills are declared in the capability manifest with clear package scope.",
      ["beai-development-steward", "beai-doctor", "beai-knowledge-loop", "beai-korean-natural-writing", "beai-release-verifier", "beai-session-handoff", "beai-memory-curator-review"]
        .every((id) => jsonHasArrayItem(manifest, "skills", (skill) => skill.id === id)),
      "Core BEAI package skills are listed in capability-pack.json.",
      "P0"
    ),
    check(
      "blood-evidence-generated-and-structured",
      "bloodstream",
      "Verification evidence is written as structured generated artifacts.",
      contains(root, "tools/beai-package-verify.mjs", /generated_outputs/)
        && contains(root, "tools/beai-doctor-package-check.mjs", /flow_state_evidence/)
        && fs.existsSync(path.resolve(root, "docs/03-verification/generated")),
      "Package verify generated_outputs, Doctor flow_state_evidence, and generated evidence directory are present.",
      "P0"
    ),
    check(
      "blood-telegram-delivery-closes-only-with-message-id",
      "bloodstream",
      "Telegram visible delivery is not treated as complete without messageId evidence.",
      telegramRules.internal_final_answer_is_not_delivery === true
        && telegramRules.telegram_direct_completion_requires_message_id === true
        && telegramRules.generated_without_message_id_remains_unverified === true,
      "Telegram delivery contract separates internal final text, generated output, and messageId-verified delivery.",
      "P0"
    ),
    check(
      "immune-operational-notice-suppresses-raw-internals",
      "immune_system",
      "Operational notices suppress raw internal candidates and require user-action framing.",
      operationalRules.dry_run_default_notify_false === true
        && operationalRules.internal_candidate_markers_must_not_be_sent_raw === true
        && operationalRules.user_visible_operational_notice_requires_action_frame === true,
      "Operational notification contract prevents raw internal candidate leaks.",
      "P0"
    ),
    check(
      "immune-status-claims-do-not-exceed-evidence",
      "immune_system",
      "Runtime and docs prevent complete/verified/applied/sent/packaged/published status from being mixed.",
      humanRules.status_claim_must_not_exceed_evidence === true
        && contains(root, "docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md", /완료 여부와 검증 범위|검증하지 않은 것을.*완료|완료.*검증 증거/)
        && contains(root, "../plugin/beai-runtime/src/runtime-core.ts", /final answer should not append the current decision handle as a repeated footer/),
      "Human contract, Korean standard, and runtime footer guard protect evidence-bounded status language.",
      "P0"
    ),
    check(
      "metabolism-fast-verify-and-deep-boundary",
      "metabolism",
      "Root verify provides a bounded read-only production check without live mutation.",
      contains(root, "../package.json", /"verify":\s*"node capability-pack\/tools\/beai-package-verify\.mjs --root \."/)
        && contains(root, "tools/beai-package-verify.mjs", /no Gateway restart/)
        && contains(root, "tools/beai-package-verify.mjs", /no Telegram send/)
        && contains(root, "tools/beai-package-verify.mjs", /no cron, hook, or agent mutation/),
      "Root verify is available and explicitly excludes live mutation.",
      "P1"
    ),
    check(
      "skeleton-manifest-docs-and-runtime-agree",
      "skeleton",
      "Manifest connects development principles, Flow Engine, human companion quality, operational notification, Telegram delivery, and Knowledge Loop boundaries.",
      /developmentPrinciples/.test(JSON.stringify(manifest || {}))
        && /flowEnginePolicy/.test(JSON.stringify(manifest || {}))
        && /humanCompanionQualityPolicy/.test(JSON.stringify(manifest || {}))
        && /operationalNotificationPolicy/.test(JSON.stringify(manifest || {}))
        && /telegramDeliveryPolicy/.test(JSON.stringify(manifest || {}))
        && /beai-knowledge-loop/.test(JSON.stringify(manifest || {})),
      "Capability manifest contains the major policy links and module references.",
      "P1"
    ),
    check(
      "skin-user-facing-copy-stays-natural-and-actionable",
      "skin",
      "Korean user-facing layer has a package-local language standard and skill.",
      fs.existsSync(path.resolve(root, "docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md"))
        && fs.existsSync(path.resolve(root, "skills/beai-korean-natural-writing-skill.md"))
        && jsonHasArrayItem(manifest, "skills", (skill) => skill.id === "beai-korean-natural-writing"),
      "Korean natural writing document, skill, and manifest entry are present.",
      "P1"
    ),
    check(
      "boundary-release-is-not-claimed-by-package-internal-pass",
      "boundary",
      "Package-internal pass does not claim public release, live runtime reload, or live Telegram roundtrip.",
      contains(root, "docs/BEAI-PACKAGE-REPAIR-CLOSEOUT-20260702-ko.md", /public release 완료가 아니다/)
        && contains(root, "docs/BEAI-PACKAGE-REPAIR-CLOSEOUT-20260702-ko.md", /live 적용, Gateway reload, Telegram visible roundtrip, release zip 생성, public publish는 별도 승인/)
        && contains(root, "tools/beai-package-verify.mjs", /no release zip creation/),
      "Closeout and package verify keep package-internal evidence separate from live/release evidence.",
      "P0"
    )
  ];

  const failed = checks.filter((item) => item.status === "fail");
  const organSummary = checks.reduce((summary, item) => {
    summary[item.organ] ||= { total: 0, pass: 0, fail: 0 };
    summary[item.organ].total += 1;
    summary[item.organ][item.status] += 1;
    return summary;
  }, {});

  return {
    schema: "beai.organic_flow_audit.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    status: failed.some((item) => item.severity === "P0") ? "fail" : failed.length ? "partial" : "pass",
    summary: {
      total: checks.length,
      pass: checks.length - failed.length,
      fail: failed.length,
      p0_failures: failed.filter((item) => item.severity === "P0").map((item) => item.id),
      p1_failures: failed.filter((item) => item.severity === "P1").map((item) => item.id)
    },
    organ_summary: organSummary,
    checks,
    not_performed: [
      "no durable memory write",
      "no OpenClaw core change",
      "no Gateway restart or reload",
      "no Telegram send or provider config change",
      "no cron, hook, or agent registration",
      "no release zip creation",
      "no public publish",
      "no live runtime reinstall"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Organic Flow Audit");
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
  lines.push("## Organ Summary");
  lines.push("");
  for (const [organ, summary] of Object.entries(report.organ_summary)) {
    lines.push(`- ${organ}: ${summary.pass}/${summary.total} pass`);
  }
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const item of report.checks) {
    lines.push(`- ${item.status.toUpperCase()} [${item.severity}] ${item.id}`);
    lines.push(`  - organ: ${item.organ}`);
    lines.push(`  - description: ${item.description}`);
    lines.push(`  - evidence: ${item.evidence}`);
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
  const root = resolveCapabilityRoot(options.root);
  const report = buildReport(root);
  const rendered = options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status === "fail") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
