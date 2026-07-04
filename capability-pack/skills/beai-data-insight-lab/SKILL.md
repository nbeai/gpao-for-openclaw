---
name: beai-data-insight-lab
description: "Use for CSV/XLSX analysis, spreadsheet checks, statistics, charts, data cleaning, and decision insight."
---

# BEAI Data Insight Lab

## Role

Turn data into decision insight without hiding uncertainty. This skill prioritizes reproducibility, honest charts, statistical boundaries, and clear action implications.

## When To Use

Use when the user asks for:

- CSV, XLSX, spreadsheet, table, dashboard, chart, metric, statistics, or data analysis
- business numbers, survey results, customer feedback, operational metrics, or financial model review
- chart selection or interpretation
- formula or calculation check

## Inputs

- data file or table
- business question
- metric definitions
- time range
- known data issues
- desired output format

## Workflow

1. Profile the dataset: columns, rows, types, missingness, units, and time range.
2. Create a cleaning log before changing data.
3. Separate raw values, formulas, derived metrics, and assumptions.
4. Choose charts that do not exaggerate the finding.
5. Separate correlation from causation.
6. State statistical limits and data quality risks.
7. Summarize decision implication and next check.

## Pattern Library

- `profile_dataset`: inspect structure, types, missing values, and units.
- `create_cleaning_log`: record every cleaning or transformation.
- `audit_formula_integrity`: check formulas, hardcodes, recalculation, and errors.
- `choose_honest_chart`: select a chart that fits the question and data.
- `separate_correlation_from_causation`: prevent overinterpretation.
- `summarize_decision_implication`: turn analysis into bounded action insight.
- `build_reproducibility_notes`: record source, filters, formulas, transforms, and rerun steps.
- `stress_test_interpretation`: check whether outliers, segments, or time windows change the story.
- `handoff_analysis_assumptions`: list assumptions another analyst must verify before use.

## Output Contract

Return:

- data profile
- cleaning log
- metric definitions
- analysis summary
- chart recommendation
- statistical boundary
- decision implication
- state label
- handoff brief with reproducibility notes, assumptions, and next checks

## Quality Gate

Check:

- data shape is known
- missing values and outliers are visible
- formulas or calculations are reproducible
- charts do not overstate findings
- statistical limits are stated
- decision implication is separated from raw analysis

## Handoff State

Use `handoff_ready` only when data profile, cleaning log, metric definitions, reproducibility notes, assumptions, and statistical boundary are visible.

If raw data, formulas, or cleaning steps cannot be inspected, report `analysis_limited`, not `handoff_ready`.

## Approval Boundary

Allowed without extra approval:

- local analysis
- chart recommendation
- spreadsheet candidate
- formula audit

Requires separate approval:

- external send
- finance/tax/legal action
- overwriting original data
- public release or durable memory promotion

## What Not To Claim

Do not call an analysis final if the data source, cleaning steps, formulas, or statistical limits are unknown.

Do not imply causation from correlation.

## User-Facing Summary Style

State the decision implication first, then the data confidence and what would change the conclusion.
