#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return stripHtml(match[1]);
}

async function fetchSource(source) {
  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "BEAI-Knowledge-Loop/0.1 report-only connector"
      }
    });
    const text = await response.text();
    return {
      id: source.id,
      label: source.label,
      url: source.url,
      category: source.category,
      ok: response.ok,
      status: response.status,
      title: titleFromHtml(text),
      fetched_at: startedAt,
      bytes_sampled: Math.min(Buffer.byteLength(text), 120000),
      error: null
    };
  } catch (error) {
    return {
      id: source.id,
      label: source.label,
      url: source.url,
      category: source.category,
      ok: false,
      status: null,
      title: "",
      fetched_at: startedAt,
      bytes_sampled: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function renderMarkdown(results) {
  const okCount = results.filter((result) => result.ok).length;
  const lines = [
    "# BEAI Knowledge Loop External Connector Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- sources: ${results.length}`,
    `- ok: ${okCount}`,
    `- failed: ${results.length - okCount}`,
    "",
    "## Sources",
    ""
  ];

  for (const result of results) {
    lines.push(`### ${result.label}`);
    lines.push("");
    lines.push(`- id: ${result.id}`);
    lines.push(`- category: ${result.category}`);
    lines.push(`- url: ${result.url}`);
    lines.push(`- ok: ${result.ok}`);
    lines.push(`- status: ${result.status ?? "n/a"}`);
    lines.push(`- title: ${result.title || "n/a"}`);
    lines.push(`- error: ${result.error || "none"}`);
    lines.push("");
  }

  lines.push("## Not Performed");
  lines.push("");
  lines.push("- no external send");
  lines.push("- no durable memory write");
  lines.push("- no connector action beyond source fetch");
  lines.push("- no release package");
  lines.push("- no Gateway restart");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const sourcesPath = argValue("--sources", "config/beai-knowledge-loop-external-sources.json");
  const outputPath = argValue("--output", "docs/03-verification/generated/knowledge-loop-external-connector-report.md");
  const jsonOutputPath = outputPath.replace(/\.md$/i, ".json");

  const config = JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
  const sources = Array.isArray(config.sources) ? config.sources : [];
  const results = [];

  for (const source of sources) {
    results.push(await fetchSource(source));
  }

  ensureDir(outputPath);
  fs.writeFileSync(outputPath, renderMarkdown(results), "utf8");
  fs.writeFileSync(jsonOutputPath, `${JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    output: outputPath,
    json_output: jsonOutputPath,
    sources: results.length,
    ok: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
