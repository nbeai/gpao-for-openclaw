---
name: "beai-knowledge-loop"
description: "Use when work/session records should be manually distilled into sourced BEAI package knowledge without automatic memory promotion."
---

# BEAI Knowledge Loop Skill

## Identity

BEAI Knowledge Loop is a review-first knowledge production loop for BEAI Package.

It turns work records into reusable, source-grounded knowledge while keeping automatic hooks, cron, and durable memory promotion out of scope until manual runs are stable.

## Core Definition

```text
BEAI Knowledge Loop
= capture work evidence
  -> first-pass session note
  -> time index
  -> second-pass knowledge note
  -> explicit review
  -> retrieval with source grounding
```

## When To Use

Use this skill when:

- a BEAI/OpenClaw/Codex work session needs to become reusable project knowledge
- the user asks to extract decisions, patterns, traps, package candidates, or development candidates from work records
- a session summary might otherwise be wrongly promoted to durable memory
- BEAI Package docs or planning need evidence-grounded recall from prior work
- a manual knowledge-loop dry run is needed before any automation is proposed

## Do Not Use For

- live cron or session-end hook activation
- automatic durable memory writes
- automatic Obsidian vault restructuring
- release or zip readiness claims
- replacing the Memory Curator Review Skill
- replacing the Release Verifier Skill

## Inputs

- source record: session transcript, work note, report, verification log, or user-provided text
- source reference: file path, date, message id, report id, or explicit citation
- target lane: package, harness, memory, skill, release, product, or content
- current package boundary and non-goals

## Output Sections

Every output should separate:

1. Observed facts
2. Decisions
3. Inferred patterns
4. Traps or failure risks
5. Package upgrade candidates
6. Development candidates
7. Evidence references
8. Review status
9. Next safe action

## Manual v0.1 Procedure

1. Confirm the source record and source reference.
2. Create a first-pass note that summarizes the work in plain language.
3. Add a time/index entry with date, project, source reference, and short title.
4. Create a second-pass knowledge note across one or more first-pass notes.
5. Classify each item as observed fact, decision, inferred pattern, trap, package candidate, development candidate, or content candidate.
6. Mark memory status as one of: no-memory, session-continuity, memory-candidate, agreement-candidate, or needs-user-confirmation.
7. Preserve evidence references beside claims.
8. Hand memory-like items to Memory Curator Review before durable promotion.
9. Hand package or release claims to Release Verifier before readiness language.
10. Report what changed, what was verified, what remains unverified, and the next safe action.

## Approval Boundaries

Allowed without extra approval:

- reading local source records
- creating draft notes or docs
- running dry-run extraction
- classifying candidates
- writing review-only planning artifacts when requested

Requires explicit approval:

- writing durable memory
- registering cron, hooks, or agents
- changing live OpenClaw gateway/runtime config
- creating or publishing release packages
- sending external messages or publishing notes
- deleting or restructuring vault data

## Quality Bar

A Knowledge Loop output is acceptable only if:

- facts and inferences are separated
- each major claim has a source reference
- memory promotion is review-first
- package readiness is not overstated
- automation is not implied before manual proof
- the next action is small and reversible

## Routing

Route to Memory Curator Review when:

- an item may become durable memory
- a project rule or user preference appears reusable
- session continuity could contaminate long-term memory

Route to Release Verifier when:

- a package, zip, manifest, install path, or distribution label is discussed
- a candidate is being called ready, verified, or shareable

Route to Development Steward when:

- the loop result requires implementation, packaging, verification, or release planning

Route to Companion UX when:

- the result should be shown to the user as a concise review card
- internal classifications should be reduced to signals, candidates, review needs, next action, and boundary flags
- the output is still review-first and not ready for automation, memory promotion, connector action, or release wording

## First Success Test

Given one source work record, the skill can produce:

- one first-pass note
- one second-pass knowledge note
- one source reference
- at least one separated decision, pattern, trap, or candidate
- a review status that does not auto-promote memory

## Completion Language

Allowed:

- "manual v0.1 draft created"
- "knowledge candidates extracted"
- "source-grounded note prepared"
- "automation not activated"

Not allowed without evidence:

- "fully automated"
- "durable memory updated"
- "package released"
- "production-ready"
- "cron/hook active"

## Promotion Rule

Keep as a manual skill first.

Promote to agent only after repeated manual runs prove that it needs independent state, a separate review queue, or dedicated permission boundaries.

Promote to automation only after manual quality is stable, failure paths are documented, and the user explicitly approves cron or hook activation.
