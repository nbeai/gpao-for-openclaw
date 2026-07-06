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
  node tools/beai-package-map-check.mjs [--root <repo-root|capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

Checks the GPAO for OpenClaw component map. It reads files only and does not install, publish, restart Gateway, send messages, mutate cron/agents/hooks, write memory, or change OpenClaw core.
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

function resolvePackagePath(repoRoot, relativePath) {
  const direct = path.join(repoRoot, relativePath);
  if (isFile(direct)) return direct;
  const withoutCapabilityPrefix = relativePath.replace(/^capability-pack\//, "");
  const capability = path.join(repoRoot, "capability-pack", withoutCapabilityPrefix);
  if (isFile(capability)) return capability;
  const knownExternalStateRoot = "/Users/jyp/Developer/BEAI/beai-capability-pack";
  const externalState = path.join(knownExternalStateRoot, relativePath);
  if (isFile(externalState)) return externalState;
  return direct;
}

function flattenModules(map) {
  const modules = [];
  for (const domain of map?.domains || []) {
    for (const module of domain.modules || []) {
      modules.push({
        ...module,
        owner_domain: domain.id,
        owner_domain_label: domain.label
      });
    }
  }
  return modules;
}

function buildReport(options) {
  const capabilityRoot = resolveCapabilityRoot(options.root);
  const repoRoot = resolveRepoRoot(capabilityRoot);
  const mapPath = path.join(capabilityRoot, "config/beai-package-module-map.json");
  const docPath = path.join(capabilityRoot, "docs/BEAI-PACKAGE-MODULE-MAP-v0.1-ko.md");
  const map = readJson(mapPath);
  const manifest = readJson(path.join(capabilityRoot, "capability-pack.json"));
  const modules = flattenModules(map);
  const moduleIds = new Set(modules.flatMap((module) => [module.id, ...(module.aliases || [])]));
  const issues = [];

  if (!map) issues.push({ severity: "p0", id: "map-json-missing-or-invalid", detail: "config/beai-package-module-map.json is missing or invalid JSON" });
  if (!isFile(docPath)) issues.push({ severity: "p1", id: "map-doc-missing", detail: "docs/BEAI-PACKAGE-MODULE-MAP-v0.1-ko.md is missing" });
  if (map?.schema !== "beai.package_module_map.v0_1") issues.push({ severity: "p0", id: "schema-mismatch", detail: `unexpected schema: ${map?.schema || "missing"}` });
  if (!Array.isArray(map?.domains) || map.domains.length < 8) issues.push({ severity: "p1", id: "domain-count-low", detail: "module map should include broad package domains" });
  if (modules.length < 25) issues.push({ severity: "p1", id: "module-count-low", detail: `module count is ${modules.length}; expected at least 25` });

  for (const module of modules) {
    for (const field of ["id", "label", "type", "status", "user_value", "primary_files", "depends_on", "verified_by", "improvement_axes"]) {
      if (module[field] === undefined || module[field] === null || (Array.isArray(module[field]) && module[field].length === 0) || module[field] === "") {
        issues.push({ severity: "p1", id: "module-field-missing", module: module.id || module.label, detail: `${field} is missing` });
      }
    }
    for (const file of module.primary_files || []) {
      if (!resolvePackagePath(repoRoot, file) || !isFile(resolvePackagePath(repoRoot, file))) {
        issues.push({ severity: "p1", id: "module-file-missing", module: module.id, detail: file });
      }
    }
    for (const dependency of module.depends_on || []) {
      const externalAllowed = [
        "all-package-modules",
        "runtime-core",
        "verification-reports",
        "memory-candidates-ledger"
      ];
      if (!moduleIds.has(dependency) && !externalAllowed.includes(dependency)) {
        issues.push({ severity: "p2", id: "dependency-not-in-map", module: module.id, detail: dependency });
      }
    }
  }

  const manifestSkills = new Set((manifest?.skills || []).map((item) => item.id));
  const manifestCandidateModules = new Set((manifest?.candidateModules || []).map((item) => item.id));
  const mappedModules = new Set(modules.flatMap((module) => [module.id, ...(module.aliases || [])]));
  const missingManifestSkills = [...manifestSkills].filter((id) => !mappedModules.has(id));
  const missingCandidateModules = [...manifestCandidateModules].filter((id) => !mappedModules.has(id));

  for (const id of missingManifestSkills) {
    issues.push({ severity: "p2", id: "manifest-skill-not-explicitly-mapped", detail: id });
  }
  for (const id of missingCandidateModules) {
    issues.push({ severity: "p2", id: "candidate-module-not-explicitly-mapped", detail: id });
  }

  const p0Issues = issues.filter((issue) => issue.severity === "p0");
  const p1Issues = issues.filter((issue) => issue.severity === "p1");
  const domainSummaries = (map?.domains || []).map((domain) => ({
    id: domain.id,
    label: domain.label,
    moduleCount: Array.isArray(domain.modules) ? domain.modules.length : 0
  }));

  return {
    schema: "beai.package_map_check.v0_1",
    generated_at: new Date().toISOString(),
    status: p0Issues.length === 0 && p1Issues.length === 0 ? "pass" : "fail",
    package_root: repoRoot,
    map: {
      path: path.relative(capabilityRoot, mapPath),
      exists: isFile(mapPath),
      schema: map?.schema ?? null,
      domains: Array.isArray(map?.domains) ? map.domains.length : 0,
      modules: modules.length,
      doc: {
        path: path.relative(capabilityRoot, docPath),
        exists: isFile(docPath)
      }
    },
    domainSummaries,
    coverage: {
      manifestSkills: manifestSkills.size,
      manifestCandidateModules: manifestCandidateModules.size,
      missingManifestSkills,
      missingCandidateModules
    },
    issueCount: issues.length,
    p0Issues: p0Issues.length,
    p1Issues: p1Issues.length,
    issues,
    not_performed: [
      "no install",
      "no publish",
      "no Gateway restart",
      "no Telegram send",
      "no cron, hook, or agent mutation",
      "no durable memory write",
      "no OpenClaw core change"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# GPAO for OpenClaw Package Map Check");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Map");
  lines.push("");
  lines.push(`- schema: ${report.map.schema || "missing"}`);
  lines.push(`- domains: ${report.map.domains}`);
  lines.push(`- modules: ${report.map.modules}`);
  lines.push(`- doc: ${report.map.doc.exists ? "present" : "missing"} (${report.map.doc.path})`);
  lines.push("");
  lines.push("## Domains");
  lines.push("");
  for (const domain of report.domainSummaries) {
    lines.push(`- ${domain.id}: ${domain.moduleCount}`);
  }
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) lines.push("- none");
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity}: ${issue.id}${issue.module ? ` (${issue.module})` : ""} - ${issue.detail}`);
  }
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
