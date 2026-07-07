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
  node capability-pack/tools/gpao-openclaw-proof-ladder.mjs [--root <package-root>] [--format json|md] [--output <path>] [--stdout]

Separates GPAO for OpenClaw package, install, Gateway, Telegram, and behavior proof. It is read-only and does not install, restart Gateway, send Telegram messages, publish, register cron/agents/hooks, or mutate memory.
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

function listFiles(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function hasExtractedArchiveIdentity(root) {
  const manifestText = readText(root, "GPAO-FOR-OPENCLAW-PACKAGE-MANIFEST.md");
  const readmeFirst = readText(root, "README-FIRST.md");
  const installDoc = readText(root, "INSTALL.md");
  const hasReleaseLanguage = /production-ready local release package/i.test(manifestText) ||
    /production-ready local release archive/i.test(manifestText) ||
    /production-ready local release package/i.test(readmeFirst);
  const hasInstallPath = /npm run verify/i.test(readmeFirst) &&
    /install-gpao-for-openclaw/i.test(installDoc);
  const hasCorePayload = fileExists(root, "plugin/beai-runtime/dist/index.js") &&
    fileExists(root, "plugin/beai-runtime/dist/runtime-core.js") &&
    fileExists(root, "capability-pack/capability-pack.json") &&
    fileExists(root, "capability-pack/tools/beai-package-verify.mjs");
  return hasReleaseLanguage && hasInstallPath && hasCorePayload;
}

function stage(id, status, evidence, nextAction) {
  return { id, status, evidence, nextAction };
}

function statusOf(pass, review = false) {
  if (pass) return "pass";
  return review ? "review" : "blocked";
}

function buildReport(root) {
  root = resolvePackageRoot(root);
  const packageJson = readJson(root, "package.json");
  const runtimePackage = readJson(root, "plugin/beai-runtime/package.json");
  const pluginManifest = readJson(root, "plugin/beai-runtime/openclaw.plugin.json");
  const packageDir = path.join(root, "packages");
  const zip = listFiles(packageDir).find((file) => /^gpao-for-openclaw-v0\.1\.0-runtime-v0\.6\.22-.*\.zip$/.test(file));
  const sha = zip ? `${zip}.sha256` : "";
  const manifest = listFiles(packageDir).find((file) => /^gpao-for-openclaw-v0\.1\.0-runtime-v0\.6\.22-.*\.manifest\.json$/.test(file));
  const extractedArchiveIdentityReady = hasExtractedArchiveIdentity(root);
  const readme = readText(root, "README.md");
  const telegramContract = readJson(root, "capability-pack/config/beai-telegram-delivery-contract.json");
  const operationalDoc = readText(root, "capability-pack/docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md");
  const doctor = readText(root, "capability-pack/tools/beai-doctor.js");
  const installer = readText(root, "installer/install-gpao-for-openclaw.mjs");
  const sourceReady = packageJson?.name === "gpao-for-openclaw" &&
    packageJson?.product === "GPAO for OpenClaw" &&
    runtimePackage?.version === "0.6.22" &&
    pluginManifest?.version === "0.6.22";
  const archiveReady = Boolean((zip && sha && manifest && fileExists(root, `packages/${sha}`)) || extractedArchiveIdentityReady);
  const archiveEvidence = zip
    ? `Release archive exists: ${zip}`
    : "Extracted release archive identity verified from manifest, install docs, runtime dist, and capability-pack payload.";
  const installReady = /backup/i.test(installer) && /install-receipt/i.test(installer) && /dry/i.test(installer);
  const gatewayReady = /Gateway restart/i.test(readme) || /gateway/i.test(readme);
  const telegramProgressReady = telegramContract?.rules?.quick_first_status_max_seconds === 30 &&
    telegramContract?.rules?.long_running_visible_progress_max_seconds === 120 &&
    /30s|30초|120s|120초/i.test(operationalDoc);
  const behaviorContractReady = /hook registration/i.test(doctor) &&
    /repair plan/i.test(doctor) &&
    /production-ready local release package/i.test(readme);
  const stages = [
    stage("package-built", statusOf(sourceReady), "Source package, runtime package, and OpenClaw plugin manifest identify GPAO for OpenClaw v0.1.1 / runtime v0.6.22.", "Align package.json, runtime package, and OpenClaw plugin manifest."),
    stage("archive-verified", statusOf(archiveReady), archiveEvidence, "Run npm run archive from the source repository, or verify the extracted release archive identity from the unpacked package."),
    stage("installer-ready", statusOf(installReady), "Backup-first dry-run/apply installer with install receipt is present.", "Repair installer backup, dry-run, apply, and receipt behavior."),
    stage("gateway-restart-boundary", statusOf(gatewayReady, true), "Gateway restart is documented as a separate live authority boundary.", "Document Gateway restart and live replacement as separate proof."),
    stage("telegram-visible-progress", statusOf(telegramProgressReady), "Telegram visible progress contract requires first status <=30s and long-running update <=120s.", "Add or repair Telegram progress timing contract."),
    stage("behavior-contract-confirmed", statusOf(behaviorContractReady, true), "Doctor repair plan and production-ready local release language are present as package-owned behavior contracts.", "Run live Telegram long-task scenario before claiming live behavior-confirmed."),
  ];
  const blockers = stages.filter((item) => item.status === "blocked").map((item) => `${item.id}: ${item.nextAction}`);
  const reviewItems = stages.filter((item) => item.status === "review").map((item) => `${item.id}: ${item.nextAction}`);
  return {
    schema: "gpao.openclaw.proof_ladder.v0_1",
    product: "GPAO for OpenClaw",
    status: blockers.length ? "blocked" : reviewItems.length ? "review" : "ready",
    generated_at: new Date().toISOString(),
    root,
    current_stage: [...stages].reverse().find((item) => item.status === "pass")?.id || "not-ready",
    stages,
    blockers,
    review_items: reviewItems,
    policy: "Do not collapse package-built, archive-verified, installer-ready, Gateway-restarted, Telegram-visible, behavior-contract-confirmed, and live behavior-confirmed into one vague ready claim.",
    not_performed: [
      "no live OpenClaw replacement",
      "no Gateway restart",
      "no Telegram message send",
      "no live Telegram behavior-confirmed claim",
      "no ClawHub/public publish",
      "no cron or agent registration",
      "no durable memory promotion"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [
    "# GPAO for OpenClaw Proof Ladder",
    "",
    `Status: ${report.status}`,
    `Current stage: ${report.current_stage}`,
    "",
    "## Stages",
    ""
  ];
  for (const item of report.stages) {
    lines.push(`- ${item.status}: ${item.id}`);
    lines.push(`  - evidence: ${item.evidence}`);
    lines.push(`  - next: ${item.nextAction}`);
  }
  lines.push("", "## Review Items", "");
  if (report.review_items.length === 0) lines.push("- none");
  for (const item of report.review_items) lines.push(`- ${item}`);
  lines.push("", "## Boundaries", "");
  for (const item of report.not_performed) lines.push(`- ${item}`);
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
  const root = path.resolve(options.root);
  writeOutput(buildReport(root), options);
}
