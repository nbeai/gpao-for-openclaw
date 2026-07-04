---
name: beai-research-evidence-studio
description: "Use for source-grounded research, evidence packs, claim checks, market scans, paper review, and decision briefs."
---

# BEAI Research Evidence Studio

## Role

Build a trustworthy evidence base for decisions. This skill is not search-result summarization; it separates facts, claims, inferences, recency, uncertainty, and counter-evidence.

## When To Use

Use when the user asks for:

- research, source-grounded answer, market scan, competitor scan, policy check, or paper review
- evidence pack or citation-backed decision brief
- claim check
- current or changing information
- comparison that affects money, time, reputation, or product direction

## Inputs

- research question
- decision context
- recency requirements
- preferred source types
- geography or language constraints
- known assumptions or claims to test

## Workflow

1. Restate the decision the research should support.
2. Build a source registry with source type and date.
3. If external channels are needed, classify them through the BEAI External Reach Layer before access.
4. Separate claim, fact, inference, and opinion.
5. Check recency for unstable facts.
6. Look for counter-evidence or alternative interpretations.
7. Grade evidence strength.
8. Produce a decision source pack and unresolved checks.

## Pattern Library

- `build_source_registry`: list source, date, type, link, and relevance.
- `separate_claim_fact_inference`: prevent summary from becoming certainty.
- `check_recency`: verify unstable facts before using them.
- `find_counter_evidence`: search for contradiction or limitation.
- `grade_evidence_strength`: label strong, medium, weak, or unverified.
- `create_decision_source_pack`: package evidence for a user decision.
- `map_source_disagreement`: show where credible sources disagree and why.
- `quote_or_paraphrase_safely`: keep citation use brief, attributed, and non-misleading.
- `handoff_research_assumptions`: list assumptions another reviewer must confirm before use.
- `classify_external_reach_channel`: map public web, GitHub, YouTube, RSS, X/Twitter, Reddit, and Meta-family sources to available, limited, needs_login, blocked, unsafe_without_approval, or not_checked.
- `record_external_source_access`: record channel, access method, backend, backend status, fetched_at, freshness, login requirement, approval state, evidence strength, and limitations.
- `separate_fallback_from_direct_access`: if a fallback source is used, do not claim the original channel was directly verified.
- `gate_account_or_cookie_sources`: keep X/Twitter, Reddit, Instagram, Facebook, browser-cookie, paid API, or account-dependent access behind explicit approval.

## Output Contract

Return:

- decision question
- source registry
- evidence summary
- counter-evidence
- claim/fact/inference separation
- external reach registry when external channels were used
- unresolved checks
- confidence boundary
- state label: source pack, reviewed, or unresolved
- handoff brief with assumptions, source gaps, and decision risks

## Quality Gate

Check:

- primary or authoritative sources were preferred when available
- dates are visible for unstable facts
- claims are not stronger than evidence
- counter-evidence was considered
- source links are included when used
- external channel access method, backend status, and approval state are visible when relevant
- login, cookie, account, rate-limit, transcript, or fallback limitations are not hidden

## Handoff State

Use `handoff_ready` only when the source registry, evidence strength, counter-evidence, assumptions, and unresolved checks are visible.

If sources are thin, stale, or disagree materially, report `unresolved` or `evidence_checked_with_limits`.

For External Reach work, include whether the source was directly checked, checked through a fallback, blocked, or not checked. A fallback source can support a limited inference, but it cannot prove direct access to the original channel.

## Approval Boundary

Allowed without extra approval:

- research
- source pack
- comparison
- draft decision brief

Requires separate approval:

- external publication
- financial/legal/medical/tax action
- public claims in user's name
- durable memory promotion
- account login, browser cookie use, session cookie reads, paid API keys, or private/customer data access
- X/Twitter, Reddit, Instagram, Facebook, or other account-dependent channel access beyond public metadata

## What Not To Claim

Do not say verified, latest, best, safest, legal, profitable, or proven without matching source evidence.

## User-Facing Summary Style

Lead with the decision implication, then evidence strength and remaining checks.
