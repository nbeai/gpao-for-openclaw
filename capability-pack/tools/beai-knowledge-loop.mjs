#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "beai.knowledge_loop.manual_v0_1";

const OUTPUT_CLASSES = [
  "observed_fact",
  "user_decision",
  "assistant_judgment",
  "inferred_pattern",
  "trap",
  "external_signal",
  "knowledge_candidate",
  "knowledge_asset",
  "execution_asset",
  "product_candidate",
  "development_candidate",
  "evidence",
  "next_action",
  "rejected_scope"
];

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of asArray(values)) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function usage() {
  return `Usage:
  node tools/beai-knowledge-loop.mjs distill --source <record.json> [--output <file>] [--format json|md] [--stdout]
  node tools/beai-knowledge-loop.mjs index --input-dir <generated-dir> [--output <file>] [--format json|md] [--stdout]
  node tools/beai-knowledge-loop.mjs brief --source <generated-output.json> [--output <file>] [--format json|md] [--stdout]
  node tools/beai-knowledge-loop.mjs --help

Input is a JSON source record. This tool is manual-only and never writes memory, cron, hooks, connectors, or release artifacts.
`;
}

function parseArgs(argv) {
  const options = {
    command: null,
    source: null,
    inputDir: null,
    output: null,
    format: "json",
    stdout: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (index === 0 && !arg.startsWith("--")) options.command = arg;
    else if (arg === "--source") options.source = argv[++index];
    else if (arg === "--input-dir") options.inputDir = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfValid(filePath) {
  try {
    return readJson(filePath);
  } catch {
    return null;
  }
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeTextItem(item, fallbackClass, defaultSourceReference = null) {
  if (typeof item === "string") {
    return {
      class: fallbackClass,
      text: item,
      source_reference: defaultSourceReference,
      review_status: "needs-review"
    };
  }

  return {
    class: item.class || fallbackClass,
    text: item.text || item.summary || item.title || "",
    source_reference: item.source_reference || item.source || defaultSourceReference,
    review_status: item.review_status || "needs-review",
    confidence: item.confidence || "unscored",
    scores: item.scores || null
  };
}

function normalizeClassItems(record) {
  const defaultSourceReference = record.source_reference || record.source_ref || record.message_id || null;
  const classMap = {
    observed_fact: asArray(record.observed_facts).map((item) => normalizeTextItem(item, "observed_fact", defaultSourceReference)),
    user_decision: asArray(record.user_decisions).map((item) => normalizeTextItem(item, "user_decision", defaultSourceReference)),
    assistant_judgment: asArray(record.assistant_judgments).map((item) => normalizeTextItem(item, "assistant_judgment", defaultSourceReference)),
    inferred_pattern: asArray(record.inferred_patterns).map((item) => normalizeTextItem(item, "inferred_pattern", defaultSourceReference)),
    trap: asArray(record.traps).map((item) => normalizeTextItem(item, "trap", defaultSourceReference)),
    external_signal: asArray(record.external_signals).map((item) => normalizeTextItem(item, "external_signal", defaultSourceReference)),
    knowledge_candidate: asArray(record.knowledge_candidates).map((item) => normalizeTextItem(item, "knowledge_candidate", defaultSourceReference)),
    knowledge_asset: asArray(record.knowledge_assets).map((item) => normalizeTextItem(item, "knowledge_asset", defaultSourceReference)),
    execution_asset: asArray(record.execution_assets).map((item) => normalizeTextItem(item, "execution_asset", defaultSourceReference)),
    product_candidate: asArray(record.product_candidates).map((item) => normalizeTextItem(item, "product_candidate", defaultSourceReference)),
    development_candidate: asArray(record.development_candidates).map((item) => normalizeTextItem(item, "development_candidate", defaultSourceReference)),
    evidence: asArray(record.evidence).map((item) => normalizeTextItem(item, "evidence", defaultSourceReference)),
    next_action: asArray(record.next_actions).map((item) => normalizeTextItem(item, "next_action", defaultSourceReference)),
    rejected_scope: asArray(record.rejected_scope).map((item) => normalizeTextItem(item, "rejected_scope", defaultSourceReference))
  };

  return Object.fromEntries(OUTPUT_CLASSES.map((key) => [key, classMap[key] || []]));
}

function scoreCandidate(item) {
  const scores = item.scores || {};
  const normalized = {
    relevance: Number.isInteger(scores.relevance) ? scores.relevance : 1,
    reuse: Number.isInteger(scores.reuse) ? scores.reuse : 1,
    evidence: Number.isInteger(scores.evidence) ? scores.evidence : (item.source_reference ? 2 : 0),
    action_path: Number.isInteger(scores.action_path) ? scores.action_path : 1,
    boundary_safety: Number.isInteger(scores.boundary_safety) ? scores.boundary_safety : 1
  };
  const total = Object.values(normalized).reduce((sum, score) => sum + Math.max(0, Math.min(2, score)), 0);

  let promotion = "source-material-or-hold";
  if (item.class === "execution_asset" && total >= 9 && normalized.action_path === 2 && item.review_status !== "unreviewed") {
    promotion = "execution-asset-candidate";
  } else if (["knowledge_candidate", "knowledge_asset"].includes(item.class) && total >= 8 && normalized.evidence === 2 && normalized.boundary_safety === 2) {
    promotion = "knowledge-asset-candidate";
  } else if (total >= 7 && normalized.evidence > 0 && normalized.boundary_safety > 0) {
    promotion = "knowledge-candidate";
  }

  return {
    scores: normalized,
    total,
    promotion
  };
}

function inferInputFamily(record) {
  const sourceType = record.source_type || "";
  if (/external|platform|customer|market|channel|signal/i.test(sourceType)) return "external_source_item";
  if (asArray(record.external_signals).length > 0) return "mixed_internal_and_external";
  return "internal_work_record";
}

function buildOutput(record, sourcePath) {
  const classes = normalizeClassItems(record);
  const candidatePool = [
    ...classes.knowledge_candidate,
    ...classes.knowledge_asset,
    ...classes.execution_asset,
    ...classes.product_candidate,
    ...classes.development_candidate,
    ...classes.external_signal
  ];

  const scoredCandidates = candidatePool.map((item) => ({
    ...item,
    candidate_score: scoreCandidate(item)
  }));

  const sourceReference = record.source_reference || record.source_ref || record.message_id || sourcePath;
  const title = record.title || "Untitled Knowledge Loop Source Record";
  const project = record.project || "BEAI Package for OpenClaw";
  const createdAt = record.created_at || new Date().toISOString();

  return {
    schema: SCHEMA,
    generated_at: new Date().toISOString(),
    mode: "manual-v0.1-dry-run",
    status: "review-ready-not-automated",
    source_record: {
      id: record.id || path.basename(sourcePath || "inline-source"),
      title,
      project,
      created_at: createdAt,
      source_type: record.source_type || "manual_note",
      input_family: inferInputFamily(record),
      source_reference: sourceReference,
      source_path: sourcePath || null,
      privacy_level: record.privacy_level || "unspecified",
      excerpt_policy: record.excerpt_policy || "summarize-with-source-reference"
    },
    user_language: {
      aliases: uniqueStrings(record.user_language_aliases || record.aliases),
      query_examples: uniqueStrings(record.query_examples || record.user_questions),
      korean_terms: uniqueStrings(record.korean_terms)
    },
    first_pass_note: {
      summary: record.summary || record.content || record.text || "",
      source_reference: sourceReference,
      review_status: "needs-human-review"
    },
    time_index_entry: {
      date: createdAt.slice(0, 10),
      project,
      title,
      source_reference: sourceReference
    },
    output_classes: classes,
    scored_candidates: scoredCandidates,
    review_status: {
      memory_status: record.memory_status || "review-required-no-durable-write",
      package_status: record.package_status || "draft-candidate-or-not-applicable",
      release_state: record.release_state || "not-a-release-action",
      automation_status: "not-activated",
      external_action_status: "not-allowed-without-approval"
    },
    safety: {
      memory_write_allowed: false,
      cron_or_hook_allowed: false,
      external_send_allowed: false,
      release_packaging_allowed: false,
      requires_human_review: true
    },
    next_safe_action: record.next_safe_action || "Review the classified candidates before any memory, automation, connector, or release action."
  };
}

function renderList(items) {
  if (!items || items.length === 0) return "- none";
  return items.map((item) => `- ${item.text || ""}${item.source_reference ? ` (source: ${item.source_reference})` : ""}`).join("\n");
}

function renderMarkdown(output) {
  const lines = [];
  lines.push(`# ${output.source_record.title}`);
  lines.push("");
  lines.push(`Schema: ${output.schema}`);
  lines.push(`Mode: ${output.mode}`);
  lines.push(`Status: ${output.status}`);
  lines.push(`Source: ${output.source_record.source_reference}`);
  lines.push("");
  lines.push("## First-Pass Note");
  lines.push("");
  lines.push(output.first_pass_note.summary || "No summary provided.");
  lines.push("");

  for (const key of OUTPUT_CLASSES) {
    lines.push(`## ${key}`);
    lines.push("");
    lines.push(renderList(output.output_classes[key]));
    lines.push("");
  }

  lines.push("## Scored Candidates");
  lines.push("");
  if (output.scored_candidates.length === 0) {
    lines.push("- none");
  } else {
    for (const candidate of output.scored_candidates) {
      lines.push(`- ${candidate.class}: ${candidate.text}`);
      lines.push(`  - total: ${candidate.candidate_score.total}`);
      lines.push(`  - promotion: ${candidate.candidate_score.promotion}`);
    }
  }
  lines.push("");
  lines.push("## Review Status");
  lines.push("");
  for (const [key, value] of Object.entries(output.review_status)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  lines.push("## Safety");
  lines.push("");
  for (const [key, value] of Object.entries(output.safety)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  lines.push("## Next Safe Action");
  lines.push("");
  lines.push(output.next_safe_action);
  lines.push("");
  return lines.join("\n");
}

function listJsonFiles(inputDir) {
  return fs.readdirSync(inputDir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => path.join(inputDir, entry))
    .sort();
}

function collectTexts(output) {
  const texts = [];
  texts.push(output.source_record?.title || "");
  texts.push(output.first_pass_note?.summary || "");
  texts.push(...asArray(output.user_language?.aliases));
  texts.push(...asArray(output.user_language?.query_examples));
  texts.push(...asArray(output.user_language?.korean_terms));
  for (const items of Object.values(output.output_classes || {})) {
    for (const item of items || []) texts.push(item.text || "");
  }
  return texts.filter(Boolean);
}

function extractTerms(texts) {
  const stop = new Set([
    "and", "the", "for", "with", "that", "this", "from", "into", "before",
    "after", "should", "user", "beai", "knowledge", "loop"
  ]);
  const counts = new Map();
  for (const text of texts) {
    for (const token of text.toLowerCase().match(/[a-z0-9가-힣_-]{3,}/g) || []) {
      if (stop.has(token)) continue;
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([term, count]) => ({ term, count }));
}

function buildRetrievalIndex(inputDir) {
  const files = listJsonFiles(inputDir);
  const records = [];
  const skipped = [];
  const nonRecords = [];

  for (const filePath of files) {
    const output = readJsonIfValid(filePath);
    if (!output || output.schema !== SCHEMA) {
      const schema = output?.schema || null;
      if (schema === "beai.knowledge_loop.companion_brief.v0_1" || schema === "beai.knowledge_loop.retrieval_index.v0_1") {
        nonRecords.push({ path: filePath, schema, reason: "generated-helper-not-source-record" });
        continue;
      }
      skipped.push({ path: filePath, reason: "not-knowledge-loop-output" });
      continue;
    }

    const texts = collectTexts(output);
    const classCounts = Object.fromEntries(
      OUTPUT_CLASSES.map((key) => [key, (output.output_classes?.[key] || []).length])
    );
    records.push({
      id: output.source_record?.id || path.basename(filePath, ".json"),
      title: output.source_record?.title || "Untitled",
      project: output.source_record?.project || null,
      source_reference: output.source_record?.source_reference || null,
      input_family: output.source_record?.input_family || null,
      path: filePath,
      generated_at: output.generated_at || null,
      mode: output.mode || null,
      status: output.status || null,
      class_counts: classCounts,
      terms: extractTerms(texts),
      user_language: output.user_language || {
        aliases: [],
        query_examples: [],
        korean_terms: []
      },
      review_status: output.review_status || {},
      safety: output.safety || {}
    });
  }

  return {
    schema: "beai.knowledge_loop.retrieval_index.v0_1",
    generated_at: new Date().toISOString(),
    mode: "manual-v0.1-local-index",
    input_dir: inputDir,
    record_count: records.length,
    skipped_count: skipped.length,
    non_record_count: nonRecords.length,
    records,
    skipped,
    non_records: nonRecords,
    safety: {
      memory_write_allowed: false,
      cron_or_hook_allowed: false,
      external_send_allowed: false,
      release_packaging_allowed: false,
      retrieval_server_started: false
    }
  };
}

function renderIndexMarkdown(index) {
  const lines = [];
  lines.push("# BEAI Knowledge Loop Retrieval Index");
  lines.push("");
  lines.push(`Schema: ${index.schema}`);
  lines.push(`Mode: ${index.mode}`);
  lines.push(`Record count: ${index.record_count}`);
  lines.push(`Skipped count: ${index.skipped_count}`);
  lines.push(`Non-record helper count: ${index.non_record_count || 0}`);
  lines.push("");
  for (const record of index.records) {
    lines.push(`## ${record.title}`);
    lines.push("");
    lines.push(`- id: ${record.id}`);
    lines.push(`- source: ${record.source_reference}`);
    lines.push(`- input_family: ${record.input_family}`);
    lines.push(`- status: ${record.status}`);
    lines.push(`- path: ${record.path}`);
    lines.push(`- terms: ${record.terms.map((item) => item.term).join(", ")}`);
    const aliases = asArray(record.user_language?.aliases);
    const queries = asArray(record.user_language?.query_examples);
    const koreanTerms = asArray(record.user_language?.korean_terms);
    if (aliases.length > 0) lines.push(`- aliases: ${aliases.join(", ")}`);
    if (queries.length > 0) lines.push(`- query_examples: ${queries.join(" / ")}`);
    if (koreanTerms.length > 0) lines.push(`- korean_terms: ${koreanTerms.join(", ")}`);
    lines.push("");
  }
  lines.push("## Safety");
  lines.push("");
  for (const [key, value] of Object.entries(index.safety)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  return lines.join("\n");
}

function topItems(items, limit = 3) {
  return asArray(items)
    .filter((item) => item && item.text)
    .slice(0, limit)
    .map((item) => ({
      text: item.text,
      source_reference: item.source_reference || null,
      review_status: item.review_status || "needs-review"
    }));
}

function buildCompanionBrief(output) {
  if (!output || output.schema !== SCHEMA) {
    throw new Error("brief --source must point to a BEAI Knowledge Loop dry-run output JSON file");
  }

  const classes = output.output_classes || {};
  const reviewStatus = output.review_status || {};
  const safety = output.safety || {};
  const signalItems = [
    ...asArray(classes.external_signal),
    ...asArray(classes.observed_fact)
  ];
  const candidateItems = [
    ...asArray(classes.knowledge_candidate),
    ...asArray(classes.knowledge_asset),
    ...asArray(classes.execution_asset),
    ...asArray(classes.development_candidate),
    ...asArray(classes.product_candidate)
  ];
  const reviewItems = candidateItems.filter((item) => /review|confirm|candidate|unreviewed/i.test(item.review_status || ""));

  return {
    schema: "beai.knowledge_loop.companion_brief.v0_1",
    generated_at: new Date().toISOString(),
    mode: "manual-v0.1-companion-brief",
    title: output.source_record?.title || "Untitled Knowledge Loop Brief",
    source_reference: output.source_record?.source_reference || null,
    input_family: output.source_record?.input_family || null,
    user_visible_summary: output.first_pass_note?.summary || "",
    reality_signals: topItems(signalItems),
    key_decisions: topItems(classes.user_decision, 5),
    definition_changes: topItems([
      ...asArray(classes.user_decision),
      ...asArray(classes.knowledge_candidate),
      ...asArray(classes.execution_asset)
    ].filter((item) => /definition|정의|not the owner|user's execution asset|사용자|owner/i.test(item.text || "")), 5),
    risks_and_traps: topItems(classes.trap, 5),
    evidence: topItems(classes.evidence, 5),
    knowledge_candidates: topItems(candidateItems),
    review_needed: topItems(reviewItems),
    next_action_candidates: topItems(classes.next_action, 5),
    not_yet_scope: topItems(classes.rejected_scope, 5),
    next_action: output.next_safe_action || "Review before any memory, automation, connector, or release action.",
    user_language: output.user_language || {
      aliases: [],
      query_examples: [],
      korean_terms: []
    },
    boundaries: {
      memory_status: reviewStatus.memory_status || "review-required-no-durable-write",
      package_status: reviewStatus.package_status || "draft-candidate-or-not-applicable",
      automation_status: reviewStatus.automation_status || "not-activated",
      memory_write_allowed: safety.memory_write_allowed === true,
      cron_or_hook_allowed: safety.cron_or_hook_allowed === true,
      external_send_allowed: safety.external_send_allowed === true,
      release_packaging_allowed: safety.release_packaging_allowed === true
    }
  };
}

function renderCompanionBriefMarkdown(brief) {
  const lines = [];
  lines.push(`# ${brief.title}`);
  lines.push("");
  lines.push(`Source: ${brief.source_reference || "none"}`);
  lines.push(`Mode: ${brief.mode}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(brief.user_visible_summary || "No summary provided.");
  lines.push("");
  lines.push("## Reality Signals");
  lines.push("");
  lines.push(renderList(brief.reality_signals));
  lines.push("");
  lines.push("## Key Decisions");
  lines.push("");
  lines.push(renderList(brief.key_decisions));
  lines.push("");
  lines.push("## Definition Changes");
  lines.push("");
  lines.push(renderList(brief.definition_changes));
  lines.push("");
  lines.push("## Risks And Traps");
  lines.push("");
  lines.push(renderList(brief.risks_and_traps));
  lines.push("");
  lines.push("## Evidence");
  lines.push("");
  lines.push(renderList(brief.evidence));
  lines.push("");
  lines.push("## Knowledge Candidates");
  lines.push("");
  lines.push(renderList(brief.knowledge_candidates));
  lines.push("");
  lines.push("## Review Needed");
  lines.push("");
  lines.push(renderList(brief.review_needed));
  lines.push("");
  lines.push("## Next Action Candidates");
  lines.push("");
  lines.push(renderList(brief.next_action_candidates));
  lines.push("");
  lines.push("## Not Yet Scope");
  lines.push("");
  lines.push(renderList(brief.not_yet_scope));
  lines.push("");
  lines.push("## User-Language Retrieval");
  lines.push("");
  lines.push(`- aliases: ${asArray(brief.user_language?.aliases).join(", ") || "none"}`);
  lines.push(`- query_examples: ${asArray(brief.user_language?.query_examples).join(" / ") || "none"}`);
  lines.push(`- korean_terms: ${asArray(brief.user_language?.korean_terms).join(", ") || "none"}`);
  lines.push("");
  lines.push("## Next Action");
  lines.push("");
  lines.push(brief.next_action);
  lines.push("");
  lines.push("## Boundaries");
  lines.push("");
  for (const [key, value] of Object.entries(brief.boundaries)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  return lines.join("\n");
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.command) {
    process.stdout.write(usage());
    return;
  }

  if (!["distill", "index", "brief"].includes(options.command)) {
    throw new Error(`Unknown command: ${options.command}`);
  }
  if (["distill", "brief"].includes(options.command) && !options.source) {
    throw new Error("--source is required");
  }
  if (options.command === "index" && !options.inputDir) {
    throw new Error("--input-dir is required");
  }
  if (!["json", "md"].includes(options.format)) {
    throw new Error("--format must be json or md");
  }

  let output;
  if (options.command === "distill") {
    output = buildOutput(readJson(path.resolve(options.source)), path.resolve(options.source));
  } else if (options.command === "index") {
    output = buildRetrievalIndex(path.resolve(options.inputDir));
  } else {
    output = buildCompanionBrief(readJson(path.resolve(options.source)));
  }
  const rendered = options.format === "json"
    ? `${JSON.stringify(output, null, 2)}\n`
    : options.command === "distill"
      ? renderMarkdown(output)
      : options.command === "index" ? renderIndexMarkdown(output) : renderCompanionBriefMarkdown(output);

  if (options.stdout || !options.output) {
    process.stdout.write(rendered);
    return;
  }

  const outputPath = path.resolve(options.output);
  ensureOutputPath(outputPath);
  fs.writeFileSync(outputPath, rendered, "utf8");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

export {
  buildOutput,
  buildRetrievalIndex,
  buildCompanionBrief,
  parseArgs,
  renderCompanionBriefMarkdown,
  renderIndexMarkdown,
  renderMarkdown,
  scoreCandidate
};
