#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function seoulDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function seoulTimestamp() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date()).replace(" ", "T");
}

function readReportSummary(reportPath) {
  if (!fs.existsSync(reportPath)) return "report file missing";
  const report = fs.readFileSync(reportPath, "utf8");
  const lines = report
    .split(/\r?\n/)
    .filter((line) => /^- (record_count|skipped_count|non_record_count|memory_write_allowed|cron_or_hook_allowed|external_send_allowed|release_packaging_allowed|retrieval_server_started|no durable memory write|no external connector call|no external send|no release package|no Gateway restart)/.test(line))
    .slice(0, 14);
  return lines.length ? lines.join("; ") : "report generated; no compact summary lines found";
}

function main() {
  const reportPath = argValue("--report", "docs/03-verification/generated/knowledge-loop-report-only-review.md");
  const memoryDir = argValue("--memory-dir", "./memory");
  const date = argValue("--date", seoulDate());
  const marker = `<!-- beai-knowledge-loop-auto:${date} -->`;
  const memoryPath = path.join(memoryDir, `${date}.md`);

  fs.mkdirSync(memoryDir, { recursive: true });
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, `# ${date}\n\n`, "utf8");
  }

  const existing = fs.readFileSync(memoryPath, "utf8");
  if (existing.includes(marker)) {
    console.log(JSON.stringify({ memory_path: memoryPath, appended: false, reason: "already-appended-for-date" }, null, 2));
    return;
  }

  const summary = readReportSummary(reportPath);
  const entry = [
    marker,
    `- BEAI Knowledge Loop automated daily report ran at ${seoulTimestamp()} Asia/Seoul. Report: \`${path.resolve(reportPath)}\`. Summary: ${summary}.`,
    ""
  ].join("\n");

  fs.appendFileSync(memoryPath, entry, "utf8");
  console.log(JSON.stringify({ memory_path: memoryPath, appended: true }, null, 2));
}

main();
