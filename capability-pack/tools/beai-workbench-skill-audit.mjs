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
  node tools/beai-workbench-skill-audit.mjs [--root <repo-root|capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

Audits BEAI Workbench Essential Skills source-candidate structure.
It is read-only: no release, install, Gateway restart, Telegram send, cron/agent mutation, memory write, or OpenClaw core change.
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

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
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

function frontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const raw = text.slice(4, end).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return data;
}

function hasSection(text, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^##\\s+${escaped}\\s*$`, "m").test(text);
}

function statusFromIssues(issues) {
  if (issues.some((issue) => issue.severity === "P0")) return "blocked";
  if (issues.length > 0) return "partial";
  return "ready";
}

function auditStudio(capabilityRoot, contract, studio) {
  const issues = [];
  const skillPath = path.join(capabilityRoot, studio.source);
  const text = readText(skillPath);
  const fm = frontmatter(text);
  if (!text) {
    issues.push({ severity: "P0", id: "skill_missing", detail: studio.source });
  }
  if (!fm?.name) {
    issues.push({ severity: "P0", id: "frontmatter_name_missing", detail: studio.id });
  }
  if (!fm?.description) {
    issues.push({ severity: "P0", id: "frontmatter_description_missing", detail: studio.id });
  }
  if (fm?.description && fm.description.length > 180) {
    issues.push({ severity: "P1", id: "frontmatter_description_too_long", detail: `${studio.id}: ${fm.description.length}` });
  }
  for (const section of contract.required_skill_sections || []) {
    if (text && !hasSection(text, section)) {
      issues.push({ severity: "P0", id: "section_missing", detail: `${studio.id}: ${section}` });
    }
  }
  if (!Array.isArray(studio.patterns) || studio.patterns.length < 5) {
    issues.push({ severity: "P0", id: "patterns_insufficient", detail: studio.id });
  }
  if (!Array.isArray(studio.outputs) || studio.outputs.length < 3) {
    issues.push({ severity: "P1", id: "outputs_insufficient", detail: studio.id });
  }
  if (!Array.isArray(studio.qualityGates) || studio.qualityGates.length === 0) {
    issues.push({ severity: "P0", id: "quality_gate_missing", detail: studio.id });
  }
  const requiredBodyMarkers = [
    "Approval Boundary",
    "What Not To Claim",
    "state",
    "handoff"
  ];
  for (const marker of requiredBodyMarkers) {
    if (text && !text.includes(marker)) {
      issues.push({ severity: "P1", id: "body_marker_missing", detail: `${studio.id}: ${marker}` });
    }
  }
  return {
    id: studio.id,
    label: studio.label,
    source: studio.source,
    status: statusFromIssues(issues),
    frontmatter: fm,
    patternCount: Array.isArray(studio.patterns) ? studio.patterns.length : 0,
    outputCount: Array.isArray(studio.outputs) ? studio.outputs.length : 0,
    qualityGates: studio.qualityGates || [],
    issues
  };
}

function buildReport(inputRoot) {
  const capabilityRoot = resolveCapabilityRoot(inputRoot);
  const contractPath = path.join(capabilityRoot, "config/beai-workbench-essential-skills-contract.json");
  const contract = readJson(contractPath);
  const issues = [];
  if (!contract) {
    issues.push({ severity: "P0", id: "contract_missing_or_invalid", detail: "config/beai-workbench-essential-skills-contract.json" });
  }
  const requiredDocs = contract?.required_docs || [];
  const docStatus = requiredDocs.map((relativePath) => ({
    path: relativePath,
    exists: isFile(path.join(capabilityRoot, relativePath))
  }));
  for (const item of docStatus) {
    if (!item.exists) issues.push({ severity: "P0", id: "required_doc_missing", detail: item.path });
  }
  const studios = Array.isArray(contract?.studios)
    ? contract.studios.map((studio) => auditStudio(capabilityRoot, contract, studio))
    : [];
  if (studios.length !== 5) {
    issues.push({ severity: "P0", id: "studio_count_mismatch", detail: `expected 5, found ${studios.length}` });
  }
  for (const studio of studios) {
    issues.push(...studio.issues.map((issue) => ({ ...issue, studio: studio.id })));
  }
  const rules = contract?.rules || {};
  const requiredRules = [
    "workbench_skills_are_human_centered_delegation",
    "studio_skills_must_preserve_user_agency",
    "quality_gates_must_be_artifact_specific",
    "visual_design_must_include_aesthetic_quality",
    "research_must_separate_claim_fact_inference",
    "data_analysis_must_expose_statistical_boundaries",
    "patterns_are_not_agents_or_cron_by_default",
    "studio_skills_must_include_handoff_state",
    "external_send_publish_memory_agent_cron_require_separate_approval",
    "completion_claims_must_not_exceed_evidence"
  ];
  for (const rule of requiredRules) {
    if (rules[rule] !== true) issues.push({ severity: "P0", id: "required_rule_missing", detail: rule });
  }
  const status = statusFromIssues(issues);
  return {
    schema: "beai.workbench_skill_audit.v0_1",
    generated_at: new Date().toISOString(),
    package_root: capabilityRoot,
    status,
    contract: {
      path: "config/beai-workbench-essential-skills-contract.json",
      exists: Boolean(contract),
      version: contract?.version ?? null,
      status: contract?.status ?? null
    },
    docs: docStatus,
    studios,
    summary: {
      studioCount: studios.length,
      ready: studios.filter((studio) => studio.status === "ready").length,
      partial: studios.filter((studio) => studio.status === "partial").length,
      blocked: studios.filter((studio) => studio.status === "blocked").length,
      issueCount: issues.length,
      p0Issues: issues.filter((issue) => issue.severity === "P0").length,
      p1Issues: issues.filter((issue) => issue.severity === "P1").length
    },
    issues,
    nextSafeAction: status === "ready"
      ? "Connect Workbench audit status to package verify, doctor package check, Control Center, and scenario audit."
      : "Fix missing Workbench contract, skill files, sections, rules, or quality gates before claiming source candidate readiness.",
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
  lines.push("# BEAI Workbench Skill Audit");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- studios: ${report.summary.studioCount}`);
  lines.push(`- ready: ${report.summary.ready}`);
  lines.push(`- partial: ${report.summary.partial}`);
  lines.push(`- blocked: ${report.summary.blocked}`);
  lines.push(`- issues: ${report.summary.issueCount}`);
  lines.push("");
  lines.push("## Studios");
  lines.push("");
  for (const studio of report.studios) {
    lines.push(`- ${studio.status.toUpperCase()}: ${studio.id}`);
    lines.push(`  - source: ${studio.source}`);
    lines.push(`  - patterns: ${studio.patternCount}`);
    lines.push(`  - quality gates: ${studio.qualityGates.join(", ") || "none"}`);
  }
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) lines.push("- none");
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity} ${issue.id}: ${issue.detail}`);
  }
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
  const report = buildReport(options.root);
  const rendered = options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status === "blocked") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
