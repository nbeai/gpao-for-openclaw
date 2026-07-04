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
  node tools/beai-conversation-flow-review-check.mjs [--root <repo-root|capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

Checks the BEAI Conversation Flow Review Loop package wiring. It is read-only and does not monitor conversations, write memory, register cron/agents/hooks, mutate live runtime, restart Gateway, send messages, create release zips, or publish.
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

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function flattenModules(map) {
  const modules = [];
  for (const domain of map?.domains || []) {
    for (const module of domain.modules || []) {
      modules.push({
        ...module,
        owner_domain: domain.id
      });
    }
  }
  return modules;
}

function buildReport(options) {
  const capabilityRoot = resolveCapabilityRoot(options.root);
  const repoRoot = resolveRepoRoot(capabilityRoot);
  const configPath = path.join(capabilityRoot, "config/beai-conversation-flow-review-loop.json");
  const docPath = path.join(capabilityRoot, "docs/BEAI-CONVERSATION-FLOW-REVIEW-LOOP-v0.1-ko.md");
  const manifestPath = path.join(capabilityRoot, "capability-pack.json");
  const moduleMapPath = path.join(capabilityRoot, "config/beai-package-module-map.json");
  const config = readJson(configPath);
  const manifest = readJson(manifestPath);
  const moduleMap = readJson(moduleMapPath);
  const modules = flattenModules(moduleMap);
  const moduleIds = new Set(modules.flatMap((module) => [module.id, ...(module.aliases || [])]));
  const manifestCandidatePresent = Array.isArray(manifest?.candidateModules)
    ? manifest.candidateModules.some((item) => item.id === "beai-conversation-flow-review-loop")
    : false;
  const moduleMapPresent = moduleIds.has("beai-conversation-flow-review-loop");
  const generatedReportPath = path.join(capabilityRoot, "docs/03-verification/generated/beai-conversation-flow-review-check-verify.json");
  const issues = [];

  if (!config) issues.push({ severity: "p0", id: "config-missing-or-invalid", detail: "config/beai-conversation-flow-review-loop.json is missing or invalid JSON" });
  if (!isFile(docPath)) issues.push({ severity: "p0", id: "doc-missing", detail: "docs/BEAI-CONVERSATION-FLOW-REVIEW-LOOP-v0.1-ko.md is missing" });
  if (config?.schema !== "beai.conversation_flow_review_loop.v0_1") {
    issues.push({ severity: "p0", id: "schema-mismatch", detail: `unexpected schema: ${config?.schema || "missing"}` });
  }
  if (config?.status !== "manual_first_review_only") {
    issues.push({ severity: "p1", id: "status-not-review-only", detail: `unexpected status: ${config?.status || "missing"}` });
  }
  if (!Array.isArray(config?.activation_points) || config.activation_points.length < 4) {
    issues.push({ severity: "p1", id: "activation-points-low", detail: "expected at least 4 activation points" });
  }
  if (!Array.isArray(config?.issue_types) || config.issue_types.length < 8) {
    issues.push({ severity: "p1", id: "issue-types-low", detail: "expected at least 8 conversation flow issue types" });
  }
  if (!Array.isArray(config?.candidate_record_required_fields) || config.candidate_record_required_fields.length < 10) {
    issues.push({ severity: "p1", id: "candidate-fields-low", detail: "expected at least 10 candidate record fields" });
  }
  if ((config?.promotion_rules?.minimum_successful_manual_reviews_before_automation_candidate ?? 0) < 3) {
    issues.push({ severity: "p1", id: "automation-evidence-threshold-low", detail: "automation candidate threshold must require at least 3 successful manual reviews" });
  }
  const boundaries = config?.read_only_boundaries || {};
  for (const key of ["no_external_send", "no_gateway_restart", "no_cron_or_agent_mutation", "no_memory_write", "no_live_runtime_mutation", "no_release_publish"]) {
    if (boundaries[key] !== true) {
      issues.push({ severity: "p0", id: "read-only-boundary-missing", detail: key });
    }
  }
  if (!manifestCandidatePresent) {
    issues.push({ severity: "p1", id: "manifest-candidate-missing", detail: "candidateModules must include beai-conversation-flow-review-loop" });
  }
  if (!moduleMapPresent) {
    issues.push({ severity: "p1", id: "module-map-entry-missing", detail: "Module Map must include beai-conversation-flow-review-loop" });
  }

  const p0Issues = issues.filter((issue) => issue.severity === "p0");
  const p1Issues = issues.filter((issue) => issue.severity === "p1");
  return {
    schema: "beai.conversation_flow_review_check.v0_1",
    generated_at: new Date().toISOString(),
    status: p0Issues.length === 0 && p1Issues.length === 0 ? "pass" : "fail",
    package_root: repoRoot,
    loop: {
      status: config?.status ?? "missing",
      config: {
        path: path.relative(capabilityRoot, configPath),
        exists: isFile(configPath),
        schema: config?.schema ?? null
      },
      doc: {
        path: path.relative(capabilityRoot, docPath),
        exists: isFile(docPath)
      },
      activation_points: Array.isArray(config?.activation_points) ? config.activation_points.length : 0,
      issue_types: Array.isArray(config?.issue_types) ? config.issue_types.length : 0,
      candidate_record_required_fields: Array.isArray(config?.candidate_record_required_fields) ? config.candidate_record_required_fields.length : 0,
      minimum_successful_manual_reviews_before_automation_candidate: config?.promotion_rules?.minimum_successful_manual_reviews_before_automation_candidate ?? null,
      manifestCandidatePresent,
      moduleMapPresent,
      generatedReportPath: path.relative(capabilityRoot, generatedReportPath)
    },
    issueCount: issues.length,
    p0Issues: p0Issues.length,
    p1Issues: p1Issues.length,
    issues,
    not_performed: [
      "no conversation monitoring",
      "no message scoring",
      "no external send",
      "no Gateway restart",
      "no cron, hook, or agent mutation",
      "no durable memory write",
      "no live runtime mutation",
      "no release archive creation",
      "no publish"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI Conversation Flow Review Check");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Loop");
  lines.push("");
  lines.push(`- loop status: ${report.loop.status}`);
  lines.push(`- config: ${report.loop.config.exists ? "present" : "missing"} (${report.loop.config.path})`);
  lines.push(`- doc: ${report.loop.doc.exists ? "present" : "missing"} (${report.loop.doc.path})`);
  lines.push(`- activation points: ${report.loop.activation_points}`);
  lines.push(`- issue types: ${report.loop.issue_types}`);
  lines.push(`- candidate record fields: ${report.loop.candidate_record_required_fields}`);
  lines.push(`- manual reviews before automation candidate: ${report.loop.minimum_successful_manual_reviews_before_automation_candidate}`);
  lines.push(`- manifest candidate: ${report.loop.manifestCandidatePresent ? "present" : "missing"}`);
  lines.push(`- module map entry: ${report.loop.moduleMapPresent ? "present" : "missing"}`);
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) lines.push("- none");
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity}: ${issue.id} - ${issue.detail}`);
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
  if (report.status !== "pass") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
