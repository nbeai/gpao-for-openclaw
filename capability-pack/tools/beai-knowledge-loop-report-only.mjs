#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    index: "docs/03-verification/generated/knowledge-loop-retrieval-index.json",
    output: "docs/03-verification/generated/knowledge-loop-report-only-review.md"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--index") options.index = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--help" || arg === "-h") options.help = true;
  }

  return options;
}

function usage() {
  return `Usage:
  node tools/beai-knowledge-loop-report-only.mjs [--index <index.json>] [--output <report.md>]

This report-only helper reads a local retrieval index and writes a local markdown review report.
It does not write durable memory, register cron/hooks/agents, call external connectors, send messages, package releases, or restart Gateway.
`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderReport(index, indexPath) {
  const records = asArray(index.records);
  const lines = [];
  lines.push("# BEAI Knowledge Loop Report-Only Review");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Index: ${path.resolve(indexPath)}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- record_count: ${index.record_count}`);
  lines.push(`- skipped_count: ${index.skipped_count}`);
  lines.push(`- non_record_count: ${index.non_record_count || 0}`);
  lines.push(`- mode: ${index.mode || "unknown"}`);
  lines.push("");
  lines.push("## Safety");
  lines.push("");
  const safety = index.safety || {};
  for (const key of [
    "memory_write_allowed",
    "cron_or_hook_allowed",
    "external_send_allowed",
    "release_packaging_allowed",
    "retrieval_server_started"
  ]) {
    lines.push(`- ${key}: ${safety[key] === true}`);
  }
  lines.push("");
  lines.push("## Records Needing Human Review");
  lines.push("");
  if (records.length === 0) {
    lines.push("- none");
  } else {
    for (const record of records) {
      const reviewStatus = record.review_status || {};
      lines.push(`- ${record.id}: ${record.title}`);
      lines.push(`  - input_family: ${record.input_family || "unknown"}`);
      lines.push(`  - status: ${record.status || "unknown"}`);
      lines.push(`  - memory_status: ${reviewStatus.memory_status || "unknown"}`);
      lines.push(`  - package_status: ${reviewStatus.package_status || "unknown"}`);
      lines.push(`  - terms: ${asArray(record.terms).slice(0, 8).map((item) => item.term).join(", ") || "none"}`);
      if (record.current_judgment_impact) {
        lines.push(`  - current_judgment_impact: high ${record.current_judgment_impact.high || 0}, medium ${record.current_judgment_impact.medium || 0}, low ${record.current_judgment_impact.low || 0}`);
      }
    }
  }
  lines.push("");
  lines.push("## Next Manual Action");
  lines.push("");
  lines.push("- Review records marked as candidates before any memory, connector, automation, or release action.");
  lines.push("- Keep this report local unless a separate report destination is approved.");
  lines.push("");
  lines.push("## Not Performed");
  lines.push("");
  lines.push("- no durable memory write");
  lines.push("- no cron mutation by this helper");
  lines.push("- no hook registration");
  lines.push("- no agent creation");
  lines.push("- no external connector call");
  lines.push("- no external send");
  lines.push("- no release package");
  lines.push("- no Gateway restart");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const indexPath = path.resolve(options.index);
  const outputPath = path.resolve(options.output);
  const index = readJson(indexPath);
  const report = renderReport(index, indexPath);

  ensureOutputPath(outputPath);
  fs.writeFileSync(outputPath, report, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

main();
