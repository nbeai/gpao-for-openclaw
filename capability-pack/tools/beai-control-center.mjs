#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    liveRuntime: "/Users/jyp/Developer/BEAI/beai-layer.nosync/plugin/beai-runtime",
    stateRoot: null,
    format: "json",
    output: null,
    stdout: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--live-runtime") options.liveRuntime = argv[++index];
    else if (arg === "--state-root") options.stateRoot = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node tools/beai-control-center.mjs [--root <repo-root|capability-pack-root>] [--live-runtime <dir>] [--state-root <dir>] [--format json|md] [--output <path>] [--stdout]

Builds a read-only BEAI Control Center status report. It reads package, runtime, state ledger, verification, and release-candidate signals.
It does not create release zips, publish, install, restart Gateway, send messages, mutate cron/agents/hooks, write memory, or change OpenClaw core.
`;
}

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function isDir(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
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

function resolveRepoRoot(capabilityRoot) {
  const parent = path.dirname(capabilityRoot);
  if (isFile(path.join(parent, "package.json")) && isDir(path.join(parent, "plugin"))) return parent;
  return capabilityRoot;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeStat(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      size: stat.size,
      mtime: stat.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      isFile: false,
      isDirectory: false,
      size: 0,
      mtime: null
    };
  }
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function listPackageArchives(repoRoot) {
  const packageDir = path.join(repoRoot, "packages");
  if (!isDir(packageDir)) return [];
  return fs.readdirSync(packageDir)
    .filter((name) => name.endsWith(".zip"))
    .map((name) => {
      const filePath = path.join(packageDir, name);
      return {
        name,
        path: filePath,
        hasSha256: isFile(`${filePath}.sha256`),
        ...safeStat(filePath)
      };
    })
    .sort((left, right) => String(right.mtime).localeCompare(String(left.mtime)));
}

function latestGeneratedReport(capabilityRoot, name) {
  const filePath = path.join(capabilityRoot, "docs/03-verification/generated", name);
  const json = readJson(filePath);
  const stat = safeStat(filePath);
  return {
    path: path.relative(capabilityRoot, filePath),
    exists: stat.exists,
    mtime: stat.mtime,
    status: json?.status ?? json?.package_status ?? "missing",
    summary: json?.summary ?? null,
    failed: Array.isArray(json?.failed) ? json.failed : [],
    schema: json?.schema ?? null
  };
}

function ledgerSummary(filePath, kind) {
  const json = readJson(filePath);
  const stat = safeStat(filePath);
  if (!json) {
    return {
      kind,
      path: filePath,
      exists: stat.exists,
      status: "missing",
      count: 0,
      signal: null,
      mtime: stat.mtime
    };
  }
  const entries = Array.isArray(json.entries) ? json.entries : null;
  const count = entries ? entries.length : Array.isArray(json) ? json.length : 1;
  return {
    kind,
    path: filePath,
    exists: true,
    status: json.status ?? json.stage ?? (entries ? "listed" : "present"),
    count,
    signal: json.userFacingSummary ?? json.note ?? json.workflowId ?? null,
    mtime: stat.mtime
  };
}

function buildWorkbenchStatus(capabilityRoot, manifest) {
  const contractPath = "config/beai-workbench-essential-skills-contract.json";
  const contract = readJson(path.join(capabilityRoot, contractPath));
  const studios = Array.isArray(contract?.studios) ? contract.studios : [];
  const studioFiles = studios.map((studio) => ({
    id: studio.id,
    name: studio.name,
    path: studio.source,
    exists: isFile(path.join(capabilityRoot, studio.source))
  }));
  const manifestEssential = manifest?.essentialSkills ?? null;
  const candidateModulePresent = Array.isArray(manifest?.candidateModules)
    ? manifest.candidateModules.some((item) => item.id === "beai-workbench-essential-skills")
    : false;
  const generatedAudit = latestGeneratedReport(capabilityRoot, "beai-workbench-skill-audit-verify.json");
  const ready = Boolean(contract)
    && studios.length === 5
    && studioFiles.every((studio) => studio.exists)
    && Boolean(manifestEssential)
    && candidateModulePresent;
  return {
    status: ready ? "source_candidate" : "partial",
    contract: {
      path: contractPath,
      exists: Boolean(contract),
      schema: contract?.schema ?? null
    },
    manifestEssentialSkills: Boolean(manifestEssential),
    candidateModulePresent,
    defaultBoundary: manifestEssential?.defaultBoundary ?? contract?.boundaries?.default_status ?? "unknown",
    studios: {
      total: studios.length,
      present: studioFiles.filter((studio) => studio.exists).length,
      files: studioFiles
    },
    audit: generatedAudit
  };
}

function buildExternalReachStatus(capabilityRoot, manifest) {
  const contractPath = "config/beai-external-reach-contract.json";
  const contract = readJson(path.join(capabilityRoot, contractPath));
  const channels = Array.isArray(contract?.channels) ? contract.channels : [];
  const publicChannels = channels.filter((channel) => channel.approvalRequired === false);
  const approvalGatedChannels = channels.filter((channel) => channel.approvalRequired === true);
  const manifestExternalReach = manifest?.externalReach ?? null;
  const candidateModulePresent = Array.isArray(manifest?.candidateModules)
    ? manifest.candidateModules.some((item) => item.id === "beai-external-reach-layer")
    : false;
  const generatedDoctor = latestGeneratedReport(capabilityRoot, "beai-external-reach-doctor-verify.json");
  const ready = Boolean(contract)
    && channels.length >= 7
    && Boolean(manifestExternalReach)
    && candidateModulePresent
    && isFile(path.join(capabilityRoot, "tools/beai-external-reach-doctor.mjs"))
    && isFile(path.join(capabilityRoot, "docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md"));
  return {
    status: ready ? "source_candidate" : "partial",
    contract: {
      path: contractPath,
      exists: Boolean(contract),
      schema: contract?.schema ?? null
    },
    manifestExternalReach: Boolean(manifestExternalReach),
    candidateModulePresent,
    defaultBoundary: manifestExternalReach?.defaultBoundary ?? "unknown",
    channels: {
      total: channels.length,
      publicReadOnly: publicChannels.map((channel) => channel.id),
      approvalGated: approvalGatedChannels.map((channel) => channel.id),
      statuses: channels.map((channel) => ({
        id: channel.id,
        defaultStatus: channel.defaultStatus,
        approvalRequired: channel.approvalRequired,
        risk: channel.risk
      }))
    },
    doctor: generatedDoctor
  };
}

function buildPackageMapStatus(capabilityRoot, manifest) {
  const mapPath = "config/beai-package-module-map.json";
  const docPath = "docs/BEAI-PACKAGE-MODULE-MAP-v0.1-ko.md";
  const map = readJson(path.join(capabilityRoot, mapPath));
  const domains = Array.isArray(map?.domains) ? map.domains : [];
  const modules = domains.flatMap((domain) => Array.isArray(domain.modules) ? domain.modules : []);
  const generatedCheck = latestGeneratedReport(capabilityRoot, "beai-package-map-check-verify.json");
  const manifestCandidatePresent = Array.isArray(manifest?.candidateModules)
    ? manifest.candidateModules.some((item) => item.id === "beai-package-module-map")
    : false;
  const ready = Boolean(map)
    && map.schema === "beai.package_module_map.v0_1"
    && domains.length >= 10
    && modules.length >= 30
    && isFile(path.join(capabilityRoot, docPath))
    && isFile(path.join(capabilityRoot, "tools/beai-package-map-check.mjs"));
  return {
    status: ready ? "ready" : "partial",
    map: {
      path: mapPath,
      exists: Boolean(map),
      schema: map?.schema ?? null,
      domains: domains.length,
      modules: modules.length
    },
    doc: {
      path: docPath,
      exists: isFile(path.join(capabilityRoot, docPath))
    },
    manifestCandidatePresent,
    check: generatedCheck
  };
}

function buildConversationFlowReviewStatus(capabilityRoot, manifest) {
  const configPath = "config/beai-conversation-flow-review-loop.json";
  const docPath = "docs/BEAI-CONVERSATION-FLOW-REVIEW-LOOP-v0.1-ko.md";
  const toolPath = "tools/beai-conversation-flow-review-check.mjs";
  const config = readJson(path.join(capabilityRoot, configPath));
  const issueTypes = Array.isArray(config?.issue_types) ? config.issue_types : [];
  const candidateFields = Array.isArray(config?.candidate_record_required_fields) ? config.candidate_record_required_fields : [];
  const manifestCandidatePresent = Array.isArray(manifest?.candidateModules)
    ? manifest.candidateModules.some((item) => item.id === "beai-conversation-flow-review-loop")
    : false;
  const generatedCheck = latestGeneratedReport(capabilityRoot, "beai-conversation-flow-review-check-verify.json");
  const ready = Boolean(config)
    && config.schema === "beai.conversation_flow_review_loop.v0_1"
    && config.status === "manual_first_review_only"
    && issueTypes.length >= 8
    && candidateFields.length >= 10
    && manifestCandidatePresent
    && isFile(path.join(capabilityRoot, docPath))
    && isFile(path.join(capabilityRoot, toolPath));
  return {
    status: ready ? "manual_first_review_only" : "partial",
    config: {
      path: configPath,
      exists: Boolean(config),
      schema: config?.schema ?? null
    },
    doc: {
      path: docPath,
      exists: isFile(path.join(capabilityRoot, docPath))
    },
    tool: {
      path: toolPath,
      exists: isFile(path.join(capabilityRoot, toolPath))
    },
    manifestCandidatePresent,
    issueTypes: issueTypes.length,
    candidateRecordRequiredFields: candidateFields.length,
    minimumManualReviewsBeforeAutomationCandidate: config?.promotion_rules?.minimum_successful_manual_reviews_before_automation_candidate ?? null,
    defaultBoundary: "review-only; not automated, not live-applied, not memory-promoted, not released",
    check: generatedCheck
  };
}

function buildStateLedgers(capabilityRoot, stateRootOption) {
  const fallbackRoot = path.join(capabilityRoot, "state/beai");
  const knownExternalRoot = "/Users/jyp/Developer/BEAI/beai-capability-pack/state/beai";
  const stateRoot = stateRootOption
    ? path.resolve(stateRootOption)
    : isDir(knownExternalRoot)
      ? knownExternalRoot
      : fallbackRoot;
  const ledgers = [
    ["workflow_card", "workflow-card.json"],
    ["workflow_state", "workflow-state-ledger.json"],
    ["manual_run_evidence", "manual-run-evidence-ledger.json"],
    ["promotion_gate", "promotion-gate.json"],
    ["automation_registry", "automation-registry.json"],
    ["memory_candidates", "memory-candidates.json"],
    ["agent_trust", "agent-trust-ledger.json"]
  ].map(([kind, file]) => ledgerSummary(path.join(stateRoot, file), kind));
  return {
    stateRoot,
    ledgers,
    activeAutomations: ledgers.find((item) => item.kind === "automation_registry")?.count ?? 0,
    blockers: ledgers.filter((item) => item.status === "blocked").map((item) => item.kind),
    missing: ledgers.filter((item) => !item.exists).map((item) => item.kind)
  };
}

function compareVersions(sourceRuntime, liveRuntime) {
  if (!sourceRuntime?.version || !liveRuntime?.version) return "unknown";
  if (sourceRuntime.version === liveRuntime.version) return "aligned";
  return "source_ahead_or_different";
}

function buildReport(options) {
  const capabilityRoot = resolveCapabilityRoot(options.root);
  const repoRoot = resolveRepoRoot(capabilityRoot);
  const packageJson = readJson(path.join(repoRoot, "package.json"));
  const manifest = readJson(path.join(capabilityRoot, "capability-pack.json"));
  const sourceRuntime = readJson(path.join(repoRoot, "plugin/beai-runtime/package.json"));
  const sourceOpenclawPlugin = readJson(path.join(repoRoot, "plugin/beai-runtime/openclaw.plugin.json"));
  const liveRuntimeRoot = path.resolve(options.liveRuntime);
  const liveRuntime = readJson(path.join(liveRuntimeRoot, "package.json"));
  const liveOpenclawPlugin = readJson(path.join(liveRuntimeRoot, "openclaw.plugin.json"));
  const archives = listPackageArchives(repoRoot);
  const state = buildStateLedgers(capabilityRoot, options.stateRoot);
  const workbench = buildWorkbenchStatus(capabilityRoot, manifest);
  const externalReach = buildExternalReachStatus(capabilityRoot, manifest);
  const packageMap = buildPackageMapStatus(capabilityRoot, manifest);
  const conversationFlowReview = buildConversationFlowReviewStatus(capabilityRoot, manifest);
  const verification = {
    packageVerify: latestGeneratedReport(capabilityRoot, "beai-package-verify.json"),
    doctorPackageCheck: latestGeneratedReport(capabilityRoot, "beai-doctor-package-check-verify.json"),
    flowRegression: latestGeneratedReport(capabilityRoot, "beai-flow-regression-gate-verify.json"),
    userScenarioAudit: latestGeneratedReport(capabilityRoot, "beai-user-scenario-audit-verify.json"),
    organicFlowAudit: latestGeneratedReport(capabilityRoot, "beai-organic-flow-audit-verify.json"),
    packageTruthCheck: latestGeneratedReport(capabilityRoot, "beai-package-truth-check-verify.json"),
    packageMapCheck: latestGeneratedReport(capabilityRoot, "beai-package-map-check-verify.json"),
    conversationFlowReviewCheck: latestGeneratedReport(capabilityRoot, "beai-conversation-flow-review-check-verify.json"),
    externalReachDoctor: latestGeneratedReport(capabilityRoot, "beai-external-reach-doctor-verify.json")
  };
  const verificationValues = Object.values(verification);
  const failedVerification = verificationValues.filter((item) => item.exists && !["pass", "ready"].includes(item.status));
  const missingVerification = verificationValues.filter((item) => !item.exists).map((item) => item.path);
  const latestArchive = archives[0] ?? null;
  const productVersion = packageJson?.version ?? "unknown";
  const capabilityPackVersion = manifest?.version ?? "unknown";
  const runtimeVersion = sourceRuntime?.version ?? "unknown";
  const liveVersion = liveRuntime?.version ?? liveOpenclawPlugin?.version ?? "unknown";
  const latestArchiveName = latestArchive?.name ?? "none";
  const releaseBoundary = latestArchiveName.includes(`v${productVersion}`) && latestArchiveName.includes(`v${runtimeVersion}`)
    ? "zip_candidate_present"
    : "zip_not_current_for_source_candidate";
  const liveBoundary = compareVersions(sourceRuntime, liveRuntime);
  const status = failedVerification.length === 0 ? "review" : "attention";
  return {
    schema: "beai.control_center.v0_1",
    generated_at: new Date().toISOString(),
    status,
    mode: "read_only",
    roots: {
      repoRoot,
      capabilityRoot,
      sourceRuntimeRoot: path.join(repoRoot, "plugin/beai-runtime"),
      liveRuntimeRoot,
      stateRoot: state.stateRoot
    },
    package: {
      productVersion,
      capabilityPackVersion,
      capabilityPackStatus: manifest?.status ?? "unknown",
      runtimeSourceVersion: runtimeVersion,
      runtimeSourcePluginVersion: sourceOpenclawPlugin?.version ?? "unknown",
      runtimeLiveVersion: liveVersion,
      runtimeLivePluginVersion: liveOpenclawPlugin?.version ?? "unknown",
      liveBoundary,
      releaseBoundary,
      latestArchive: latestArchive
        ? {
            name: latestArchive.name,
            mtime: latestArchive.mtime,
            hasSha256: latestArchive.hasSha256
          }
        : null
    },
    components: {
      corePolicyCount: Object.keys(manifest?.corePolicy || {}).length,
      skills: Array.isArray(manifest?.skills) ? manifest.skills.map((skill) => ({
        id: skill.id,
        status: skill.status ?? "unknown"
      })) : [],
      candidateModules: Array.isArray(manifest?.candidateModules) ? manifest.candidateModules.map((item) => ({
        id: item.id,
        status: item.status ?? "unknown"
      })) : []
    },
    packageMap,
    conversationFlowReview,
    workbench,
    externalReach,
    state,
    verification,
    boundaries: {
      noExternalSend: true,
      noGatewayRestart: true,
      noCronOrAgentMutation: true,
      noMemoryWrite: true,
      noReleasePublish: true,
      approvalNeededFor: [
        "live runtime reinstall or Gateway restart",
        "release zip creation or public release",
        "cron, hook, or agent activation",
        "durable memory promotion",
        "external send or public post"
      ]
    },
    nextSafeAction: releaseBoundary === "zip_not_current_for_source_candidate"
      ? "Run package verification, then create a clean zip only after explicit release boundary approval."
      : liveBoundary === "source_ahead_or_different"
        ? "Verify live/install boundary before claiming the source candidate is live-applied."
        : "Keep monitoring package, verification, workflow, automation, delivery, and memory status from this read-only report.",
    issues: [
      ...failedVerification.map((item) => `${item.path}: ${item.status}`),
      ...missingVerification.map((item) => `${item}: missing`),
      ...(packageMap.status === "ready" ? [] : ["package module map: partial"]),
      ...(conversationFlowReview.status === "manual_first_review_only" ? [] : ["conversation flow review loop: partial"]),
      ...(workbench.status === "source_candidate" ? [] : ["workbench essential skills: partial"]),
      ...(externalReach.status === "source_candidate" ? [] : ["external reach layer: partial"]),
      ...(state.missing.length ? [`missing state ledgers: ${state.missing.join(", ")}`] : []),
      ...(state.blockers.length ? [`blocked state ledgers: ${state.blockers.join(", ")}`] : [])
    ],
    not_performed: [
      "no release archive creation",
      "no publish",
      "no install",
      "no OpenClaw core change",
      "no Gateway restart",
      "no Telegram send",
      "no cron, hook, or agent mutation",
      "no durable memory write"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Control Center v0.1");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push("");
  lines.push("## Package Boundary");
  lines.push("");
  lines.push(`- capability pack source: ${report.package.capabilityPackVersion} (${report.package.capabilityPackStatus})`);
  lines.push(`- runtime source: ${report.package.runtimeSourceVersion}`);
  lines.push(`- runtime live: ${report.package.runtimeLiveVersion}`);
  lines.push(`- live boundary: ${report.package.liveBoundary}`);
  lines.push(`- release boundary: ${report.package.releaseBoundary}`);
  lines.push(`- latest archive: ${report.package.latestArchive?.name || "none"}`);
  lines.push("");
  lines.push("## Components");
  lines.push("");
  lines.push(`- core policies: ${report.components.corePolicyCount}`);
  lines.push(`- skills: ${report.components.skills.length}`);
  lines.push(`- candidate modules: ${report.components.candidateModules.length}`);
  lines.push("");
  lines.push("## State Ledgers");
  lines.push("");
  lines.push(`- state root: ${report.state.stateRoot}`);
  for (const ledger of report.state.ledgers) {
    lines.push(`- ${ledger.exists ? "PRESENT" : "MISSING"}: ${ledger.kind} (${ledger.status}, count=${ledger.count})`);
  }
  lines.push("");
  lines.push("## Package Module Map");
  lines.push("");
  lines.push(`- status: ${report.packageMap.status}`);
  lines.push(`- map: ${report.packageMap.map.exists ? "present" : "missing"} (${report.packageMap.map.path})`);
  lines.push(`- domains: ${report.packageMap.map.domains}`);
  lines.push(`- modules: ${report.packageMap.map.modules}`);
  lines.push(`- doc: ${report.packageMap.doc.exists ? "present" : "missing"} (${report.packageMap.doc.path})`);
  lines.push(`- check: ${report.packageMap.check.exists ? report.packageMap.check.status : "missing"} (${report.packageMap.check.path})`);
  lines.push("");
  lines.push("## Conversation Flow Review Loop");
  lines.push("");
  lines.push(`- status: ${report.conversationFlowReview.status}`);
  lines.push(`- config: ${report.conversationFlowReview.config.exists ? "present" : "missing"} (${report.conversationFlowReview.config.path})`);
  lines.push(`- doc: ${report.conversationFlowReview.doc.exists ? "present" : "missing"} (${report.conversationFlowReview.doc.path})`);
  lines.push(`- tool: ${report.conversationFlowReview.tool.exists ? "present" : "missing"} (${report.conversationFlowReview.tool.path})`);
  lines.push(`- issue types: ${report.conversationFlowReview.issueTypes}`);
  lines.push(`- candidate record fields: ${report.conversationFlowReview.candidateRecordRequiredFields}`);
  lines.push(`- manual reviews before automation candidate: ${report.conversationFlowReview.minimumManualReviewsBeforeAutomationCandidate}`);
  lines.push(`- default boundary: ${report.conversationFlowReview.defaultBoundary}`);
  lines.push(`- check: ${report.conversationFlowReview.check.exists ? report.conversationFlowReview.check.status : "missing"} (${report.conversationFlowReview.check.path})`);
  lines.push("");
  lines.push("## Workbench Essential Skills");
  lines.push("");
  lines.push(`- status: ${report.workbench.status}`);
  lines.push(`- contract: ${report.workbench.contract.exists ? "present" : "missing"} (${report.workbench.contract.path})`);
  lines.push(`- manifest essentialSkills: ${report.workbench.manifestEssentialSkills ? "present" : "missing"}`);
  lines.push(`- candidate module: ${report.workbench.candidateModulePresent ? "present" : "missing"}`);
  lines.push(`- studios: ${report.workbench.studios.present}/${report.workbench.studios.total}`);
  lines.push(`- default boundary: ${report.workbench.defaultBoundary}`);
  lines.push(`- audit: ${report.workbench.audit.exists ? report.workbench.audit.status : "missing"} (${report.workbench.audit.path})`);
  lines.push("");
  lines.push("## External Reach Layer");
  lines.push("");
  lines.push(`- status: ${report.externalReach.status}`);
  lines.push(`- contract: ${report.externalReach.contract.exists ? "present" : "missing"} (${report.externalReach.contract.path})`);
  lines.push(`- manifest externalReach: ${report.externalReach.manifestExternalReach ? "present" : "missing"}`);
  lines.push(`- candidate module: ${report.externalReach.candidateModulePresent ? "present" : "missing"}`);
  lines.push(`- channels: ${report.externalReach.channels.total}`);
  lines.push(`- public read-only: ${report.externalReach.channels.publicReadOnly.join(", ") || "none"}`);
  lines.push(`- approval-gated: ${report.externalReach.channels.approvalGated.join(", ") || "none"}`);
  lines.push(`- default boundary: ${report.externalReach.defaultBoundary}`);
  lines.push(`- doctor: ${report.externalReach.doctor.exists ? report.externalReach.doctor.status : "missing"} (${report.externalReach.doctor.path})`);
  lines.push("");
  lines.push("## Verification");
  lines.push("");
  for (const [key, item] of Object.entries(report.verification)) {
    lines.push(`- ${item.exists ? item.status.toUpperCase() : "MISSING"}: ${key} (${item.path})`);
  }
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) lines.push("- none");
  for (const issue of report.issues) lines.push(`- ${issue}`);
  lines.push("");
  lines.push("## Next Safe Action");
  lines.push("");
  lines.push(report.nextSafeAction);
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
  const report = buildReport(options);
  const rendered = options.format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
