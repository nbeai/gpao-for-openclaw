#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    format: "json",
    output: null,
    stdout: false,
    liveCheck: false,
    timeoutMs: 8000
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--live-check") options.liveCheck = true;
    else if (arg === "--timeout-ms") options.timeoutMs = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node tools/beai-external-reach-doctor.mjs [--root <repo-root|capability-pack-root>] [--format json|md] [--output <path>] [--stdout] [--live-check]

Audits BEAI External Reach Layer contract, channel boundaries, source registry fields, and optional read-only public channel reachability.
Default mode is static and deterministic. --live-check performs network reads only for public_web, github, youtube metadata, and rss.
It does not install dependencies, use accounts or cookies, mutate browser sessions, publish, send messages, write memory, register cron/agents/hooks, restart Gateway, or change OpenClaw core.
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

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function statusFromIssues(issues) {
  if (issues.some((issue) => issue.severity === "P0")) return "blocked";
  if (issues.length > 0) return "partial";
  return "ready";
}

function hasAll(list, required) {
  return required.every((item) => list.includes(item));
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "BEAI-External-Reach-Doctor/0.1 read-only"
      }
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      bytes: text.length,
      durationMs: Date.now() - startedAt,
      sample: text.slice(0, 160)
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      bytes: 0,
      durationMs: Date.now() - startedAt,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runLiveChecks(timeoutMs) {
  const targets = [
    {
      id: "public_web",
      url: "https://example.com/",
      expects: /Example Domain/
    },
    {
      id: "github",
      url: "https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/README_en.md",
      expects: /agent-reach|Agent-Reach/i
    },
    {
      id: "youtube",
      url: "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json",
      expects: /title|author_name/
    },
    {
      id: "rss",
      url: "https://github.com/Panniantong/agent-reach/releases.atom",
      expects: /<feed|<entry/i
    }
  ];
  const checks = [];
  for (const target of targets) {
    const result = await fetchText(target.url, timeoutMs);
    checks.push({
      id: target.id,
      url: target.url,
      channelStatus: result.ok && target.expects.test(result.sample) ? "available" : result.ok ? "limited" : "blocked",
      readOnly: true,
      ...result
    });
  }
  return checks;
}

function buildStaticReport(capabilityRoot) {
  const contractPath = path.join(capabilityRoot, "config/beai-external-reach-contract.json");
  const docPath = path.join(capabilityRoot, "docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md");
  const researchSkillPath = path.join(capabilityRoot, "skills/beai-research-evidence-studio/SKILL.md");
  const contract = readJson(contractPath);
  const docText = readText(docPath);
  const researchSkill = readText(researchSkillPath);
  const issues = [];
  if (!contract) issues.push({ severity: "P0", id: "contract_missing_or_invalid", detail: "config/beai-external-reach-contract.json" });
  if (!isFile(docPath)) issues.push({ severity: "P0", id: "doc_missing", detail: "docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md" });
  if (!isFile(researchSkillPath)) issues.push({ severity: "P0", id: "research_skill_missing", detail: "skills/beai-research-evidence-studio/SKILL.md" });

  const rules = contract?.rules || {};
  const channels = Array.isArray(contract?.channels) ? contract.channels : [];
  const statuses = Array.isArray(contract?.required_statuses) ? contract.required_statuses : [];
  const registryFields = Array.isArray(contract?.source_registry_fields) ? contract.source_registry_fields : [];
  const issueCodes = Array.isArray(contract?.doctor_issue_codes) ? contract.doctor_issue_codes : [];
  const requiredChannels = ["public_web", "github", "youtube", "rss", "x_twitter", "reddit", "social_meta"];
  const requiredStatuses = ["available", "limited", "needs_login", "blocked", "unsafe_without_approval", "not_checked"];
  const requiredRegistryFields = [
    "source_id",
    "channel",
    "url",
    "access_method",
    "backend",
    "backend_status",
    "fetched_at",
    "freshness",
    "requires_login",
    "approval_state",
    "evidence_strength",
    "claim_fact_inference_boundary",
    "limitations"
  ];
  const checks = {
    contract_exists: Boolean(contract),
    doc_exists: isFile(docPath),
    tool_declared: contract?.required_tool === "tools/beai-external-reach-doctor.mjs",
    doc_declared: contract?.required_doc === "docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md",
    read_only_by_default: rules.external_reach_is_read_only_by_default === true,
    public_channels_without_account: rules.public_channels_may_be_checked_without_account === true,
    login_channels_require_approval: rules.account_cookie_or_login_channels_require_separate_approval === true,
    source_registry_records_access_method: rules.source_registry_must_record_access_method === true,
    source_registry_records_fetched_at: rules.source_registry_must_record_fetched_at === true,
    source_registry_records_freshness: rules.source_registry_must_record_freshness === true,
    source_registry_records_backend_status: rules.source_registry_must_record_backend_status === true,
    claim_fact_inference_boundary: rules.research_outputs_must_separate_claim_fact_inference === true,
    fallback_limits_visible: rules.fallback_routing_must_not_hide_source_limits === true,
    completion_claim_boundary: rules.completion_claims_must_not_exceed_connector_evidence === true,
    live_checks_optional_read_only: rules.network_live_checks_are_optional_and_read_only === true,
    no_dependency_or_account_mutation: rules.doctor_must_not_install_dependencies_or_mutate_accounts === true,
    channel_set_complete: hasAll(channels.map((channel) => channel.id), requiredChannels),
    statuses_complete: hasAll(statuses, requiredStatuses),
    source_registry_fields_complete: hasAll(registryFields, requiredRegistryFields),
    social_channels_approval_gated: channels
      .filter((channel) => ["x_twitter", "reddit", "social_meta"].includes(channel.id))
      .every((channel) => channel.approvalRequired === true && ["needs_login", "limited", "unsafe_without_approval"].includes(channel.defaultStatus)),
    public_live_check_set: hasAll(contract?.public_live_check_channels || [], ["public_web", "github", "youtube", "rss"]),
    research_skill_mentions_external_reach: /External Reach|external reach|외부 접근|source registry/.test(researchSkill),
    doc_mentions_account_boundary: /로그인|쿠키|승인/.test(docText),
    doctor_issue_codes_complete: hasAll(issueCodes, [
      "beai-external-reach-contract-missing",
      "beai-external-reach-tool-missing",
      "beai-external-reach-doc-missing",
      "beai-external-reach-social-channel-overclaimed",
      "beai-external-reach-live-check-failed"
    ])
  };
  for (const [id, passed] of Object.entries(checks)) {
    if (!passed) issues.push({ severity: id.includes("doc_mentions") ? "P1" : "P0", id, detail: "static contract check failed" });
  }
  return {
    contract,
    checks,
    issues,
    channels: channels.map((channel) => ({
      id: channel.id,
      defaultStatus: channel.defaultStatus,
      approvalRequired: channel.approvalRequired,
      risk: channel.risk,
      accessMethod: channel.accessMethod
    }))
  };
}

async function buildReport(options) {
  const capabilityRoot = resolveCapabilityRoot(options.root);
  const staticReport = buildStaticReport(capabilityRoot);
  const liveChecks = options.liveCheck ? await runLiveChecks(options.timeoutMs) : [];
  const liveIssues = liveChecks
    .filter((check) => !["available", "limited"].includes(check.channelStatus))
    .map((check) => ({ severity: "P1", id: "live_check_failed", detail: check.id }));
  const issues = [...staticReport.issues, ...liveIssues];
  const status = statusFromIssues(issues);
  return {
    schema: "beai.external_reach_doctor.v0_1",
    generated_at: new Date().toISOString(),
    package_root: capabilityRoot,
    status,
    mode: options.liveCheck ? "read_only_live_check" : "read_only_static",
    contract: {
      path: "config/beai-external-reach-contract.json",
      exists: Boolean(staticReport.contract),
      version: staticReport.contract?.version ?? null,
      status: staticReport.contract?.status ?? null
    },
    summary: {
      channels: staticReport.channels.length,
      approvalGatedChannels: staticReport.channels.filter((channel) => channel.approvalRequired).length,
      publicLiveCheckChannels: staticReport.contract?.public_live_check_channels?.length ?? 0,
      issueCount: issues.length,
      p0Issues: issues.filter((issue) => issue.severity === "P0").length,
      p1Issues: issues.filter((issue) => issue.severity === "P1").length
    },
    checks: staticReport.checks,
    channels: staticReport.channels,
    live_checks: liveChecks,
    issues,
    nextSafeAction: status === "ready"
      ? "Keep External Reach as read-only source-candidate evidence; run --live-check only when public network reachability evidence is needed."
      : "Fix missing contract, doc, Research Studio linkage, source registry fields, or approval-gated channel boundaries before claiming External Reach readiness.",
    not_performed: [
      "no dependency installation",
      "no account login",
      "no browser cookie use",
      "no session cookie read",
      "no API key use",
      "no external post or send",
      "no release archive creation",
      "no publish",
      "no install",
      "no OpenClaw core change",
      "no Gateway restart",
      "no cron, hook, or agent mutation",
      "no durable memory write"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI External Reach Doctor");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- channels: ${report.summary.channels}`);
  lines.push(`- approval gated channels: ${report.summary.approvalGatedChannels}`);
  lines.push(`- public live check channels: ${report.summary.publicLiveCheckChannels}`);
  lines.push(`- issues: ${report.summary.issueCount}`);
  lines.push("");
  lines.push("## Channels");
  lines.push("");
  for (const channel of report.channels) {
    lines.push(`- ${channel.id}: ${channel.defaultStatus}, approvalRequired=${channel.approvalRequired}, risk=${channel.risk}`);
  }
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const [key, value] of Object.entries(report.checks)) {
    lines.push(`- ${value ? "OK" : "MISSING"}: ${key}`);
  }
  if (report.live_checks.length) {
    lines.push("");
    lines.push("## Live Checks");
    lines.push("");
    for (const check of report.live_checks) {
      lines.push(`- ${check.channelStatus.toUpperCase()}: ${check.id} (http=${check.status || "n/a"})`);
    }
  }
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) lines.push("- none");
  for (const issue of report.issues) lines.push(`- ${issue.severity} ${issue.id}: ${issue.detail}`);
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (!["json", "md"].includes(options.format)) throw new Error("--format must be json or md");
  const report = await buildReport(options);
  const rendered = options.format === "json"
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) process.stdout.write(rendered);
  if (report.status === "blocked") process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
