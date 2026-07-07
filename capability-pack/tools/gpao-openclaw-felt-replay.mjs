#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = { root: ".", format: "json", output: null, stdout: false };
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
  node capability-pack/tools/gpao-openclaw-felt-replay.mjs [--root <package-root>] [--format json|md] [--output <path>] [--stdout]

Runs a read-only user-felt replay for GPAO for OpenClaw Telegram/direct operation.
`;
}

function readText(root, relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function readJson(root, relativePath) {
  try {
    return JSON.parse(readText(root, relativePath));
  } catch {
    return null;
  }
}

function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function resolvePackageRoot(root) {
  const absolute = path.resolve(root);
  if (fileExists(absolute, "package.json") && fileExists(absolute, "capability-pack")) return absolute;
  const parent = path.dirname(absolute);
  if (path.basename(absolute) === "capability-pack" && fileExists(parent, "package.json")) return parent;
  return absolute;
}

function scenario(id, label, pass, userFeeling, evidence, nextAction) {
  return {
    id,
    label,
    status: pass ? "pass" : "review",
    userFeeling,
    evidence,
    nextAction
  };
}

function buildReport(root) {
  root = resolvePackageRoot(root);
  const readme = readText(root, "README.md");
  const runtimeIndex = readText(root, "plugin/beai-runtime/src/index.ts");
  const runtimeCore = readText(root, "plugin/beai-runtime/src/runtime-core.ts");
  const telegramContract = readJson(root, "capability-pack/config/beai-telegram-delivery-contract.json");
  const notificationContract = readText(root, "capability-pack/docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md");
  const userAudit = readText(root, "capability-pack/tools/beai-user-scenario-audit.mjs");
  const doctor = readText(root, "capability-pack/tools/beai-doctor.js");
  const scenarios = [
    scenario(
      "new-session-intent-recovery",
      "New-session intent recovery",
      /persisted_context_pack|handoff_state|new_session_meaning_recovery_gate/i.test(runtimeIndex + runtimeCore),
      "The user can say an omitted follow-up after a session boundary and still feel the prior GPAO/OpenClaw target is recovered.",
      "Runtime contains persisted context / handoff state recovery markers.",
      "Add or repair turn-start context broker before claiming new-session recovery."
    ),
    scenario(
      "telegram-visible-progress",
      "Telegram visible progress",
      telegramContract?.rules?.quick_first_status_max_seconds === 30 &&
        telegramContract?.rules?.long_running_visible_progress_max_seconds === 120 &&
        /30s|30초|120s|120초/i.test(notificationContract),
      "The user sees progress quickly enough during long Telegram direct work.",
      "Contract requires first visible status <=30s and long-running update <=120s.",
      "Wire progress contract into live Telegram scenario proof."
    ),
    scenario(
      "delivery-truth",
      "Telegram delivery truth",
      telegramContract?.rules?.internal_final_answer_is_not_delivery === true &&
        telegramContract?.rules?.telegram_direct_completion_requires_message_id === true,
      "The user can trust that completion means a real Telegram delivery when delivery is claimed.",
      "Delivery contract separates generated answer from Telegram messageId.",
      "Keep messageId mandatory for direct-delivery completion claims."
    ),
    scenario(
      "release-language-clarity",
      "Release language clarity",
      /production-ready local release package/i.test(readme) &&
        /ClawHub|public release|live OpenClaw replacement/i.test(readme),
      "The user understands what is production-ready locally and what remains a public/live gate.",
      "README uses local release package wording and separates public/live boundaries.",
      "Unify remaining docs if any internal-candidate wording leaks into public-facing files."
    ),
    scenario(
      "helpful-repair-plan",
      "Helpful repair plan",
      /hook registration/i.test(doctor) &&
        /approval|승인|repair plan/i.test(doctor),
      "The user sees a concrete repair plan instead of a hidden hook-registration suspicion.",
      "Doctor surfaces hook registration as approval-gated repair work.",
      "Make the repair plan executable after user approval."
    ),
    scenario(
      "first-install-confidence",
      "First-install confidence",
      /production-ready local release package/i.test(userAudit) &&
        /stable one-command public installer/i.test(userAudit),
      "The first installer is not misled into expecting ClawHub/public one-command behavior from the local package.",
      "User-scenario audit separates local release from public installer claims.",
      "Keep fresh-unzip verification in package verify."
    )
  ];
  const passCount = scenarios.filter((item) => item.status === "pass").length;
  const score = Math.round((passCount / scenarios.length) * 100);
  return {
    schema: "gpao.openclaw.felt_replay.v0_1",
    product: "GPAO for OpenClaw",
    status: score >= 85 ? "ready" : "review",
    generated_at: new Date().toISOString(),
    root,
    score,
    scenarios,
    acceptance: {
      contextFeelsRemembered: scenarios.find((item) => item.id === "new-session-intent-recovery")?.status === "pass",
      progressFeelsAlive: scenarios.find((item) => item.id === "telegram-visible-progress")?.status === "pass",
      deliveryFeelsTrustworthy: scenarios.find((item) => item.id === "delivery-truth")?.status === "pass",
      releaseLanguageFeelsClear: scenarios.find((item) => item.id === "release-language-clarity")?.status === "pass",
      repairFeelsActionable: scenarios.find((item) => item.id === "helpful-repair-plan")?.status === "pass"
    },
    review_items: scenarios.filter((item) => item.status !== "pass").map((item) => `${item.id}: ${item.nextAction}`),
    policy: "Felt replay is local pre-field evidence. It does not replace live Telegram messageId proof, ClawHub validation, public release validation, or real user feedback."
  };
}

function renderMarkdown(report) {
  const lines = [
    "# GPAO for OpenClaw Felt Replay",
    "",
    `Status: ${report.status}`,
    `Score: ${report.score}/100`,
    "",
    "## Scenarios",
    ""
  ];
  for (const item of report.scenarios) {
    lines.push(`- ${item.status}: ${item.label}`);
    lines.push(`  - feeling: ${item.userFeeling}`);
    lines.push(`  - evidence: ${item.evidence}`);
  }
  lines.push("", "## Policy", "", report.policy);
  return `${lines.join("\n")}\n`;
}

function writeOutput(report, options) {
  const text = options.format === "md" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
    fs.writeFileSync(options.output, text, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(text);
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write(usage());
} else {
  writeOutput(buildReport(path.resolve(options.root)), options);
}
