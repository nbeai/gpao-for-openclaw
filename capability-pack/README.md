# BEAI Capability Pack v0.2.0

BEAI Capability Pack is a separate planning package for BEAI-style skills and agents.

It is not BEAI Layer.

BEAI Layer keeps the runtime judgment order: current request, evidence, verification, memory candidates, session continuity, and user-facing surface.

BEAI Capability Pack defines callable professional behaviors that can sit beside BEAI Layer:

- review skills
- handoff skills
- memory review skills
- onboarding/starter agents

## Current Scope

This package contains planning-ready definitions for:

- Release Verifier Skill
- Session Handoff Skill
- Memory Curator Review Skill
- BEAI Starter Agent alpha
- BEAI Development Steward Skill
- BEAI Knowledge Loop Skill (live-applied daily automation)
- BEAI Knowledge Loop Skill is now applied with daily review report generation, external signal fetch, bounded memory append, Telegram run delivery, missed-run recovery, a persistent review lane, and a bounded Gateway/Telegram watchdog.
- BEAI Doctor Skill (packaged runtime diagnosis and trust boundary upgrade)
- Capability routing rules

## BEAI Knowledge Loop Direction

BEAI Knowledge Loop is the next package upgrade candidate.

It is not an owner-facing add-on. It upgrades BEAI Package itself from a capability bundle into a source-grounded work memory package:

```text
work/session records
-> first-pass notes
-> time index
-> second-pass knowledge notes
-> review-first memory candidates
-> retrieval with source grounding
```

The first version started manual-first at the skill level. The local OpenClaw workspace now has one daily applied cron for local review file generation, configured external signal fetch, one bounded daily memory append, Telegram run delivery, a two-hour missed-run recovery cron after the main morning window, one persistent review lane, and one bounded Gateway/Telegram watchdog. Gateway-level session-end hooks, Gateway `agents.list` promotion, and public release publishing are still not enabled.

## BEAI Doctor Runtime Trust Upgrade

BEAI Doctor already existed as a live workspace skill. This package now includes it as a formal package component instead of treating it as an external assumption.

Official package role:

```text
beai-doctor
-> diagnose BEAI-on-OpenClaw runtime reliability
-> separate OpenClaw core issues from BEAI-owned issues
-> check skill/plugin/package visibility and readiness
-> read Knowledge Loop operation evidence
-> read Trust Gate status
-> read Agent Trust Ledger entries
-> classify Connector Onboarding risk
-> explain safe repair boundaries to the user
```

This upgrade does not silently repair OpenClaw core, Gateway, Telegram, cron, hooks, agents, durable memory, or public release state. It packages the Doctor, gives it package-level evidence to read, and defines the status language needed before stronger repairs are considered.

The added package elements are:

- `skills/beai-doctor/SKILL.md`
- `tools/beai-doctor.js`
- `tools/install-wake-guard-launchagent.js`
- `docs/BEAI-DOCTOR-PACKAGE-INTEGRATION-v0.1-ko.md`
- `docs/BEAI-TRUST-GATE-v0.1-ko.md`
- `docs/BEAI-AGENT-TRUST-LEDGER-v0.1-ko.md`
- `docs/BEAI-CONNECTOR-ONBOARDING-v0.1-ko.md`
- `config/beai-trust-gate-statuses.json`
- `config/beai-connector-onboarding-checklist.json`
- `state/beai/agent-trust-ledger.json`
- `tools/beai-doctor-package-check.mjs`

Trust Gate states are package-level status vocabulary:

- `ready`
- `partial`
- `unverified`
- `blocked`
- `needs_approval`
- `hold`
- `unsafe`

BEAI Doctor uses these states to avoid saying "complete" when only "configured" or "registered" has been proven.

Current v0.1 candidate evidence:

- `tools/beai-knowledge-loop.mjs` can turn source record JSON into review-first dry-run output.
- `examples/knowledge-loop-source-record-case3a.json` covers knowledge asset boundary classification.
- `examples/knowledge-loop-source-record-external-signal.json` covers external reality signal intake.
- `examples/knowledge-loop-source-record-beai-knowledge-loop-v0.1-dev-session.json` covers a real BEAI development-session record.
- `examples/knowledge-loop-source-record-scenario-reinforcement.json` covers the real scenario reinforcement session.
- `examples/knowledge-loop-source-record-telegram-response-persistence.json` covers the real Telegram/OpenClaw response persistence issue.
- `docs/03-verification/generated/knowledge-loop-retrieval-index.json` is a local retrieval index prototype built from generated dry-run outputs.
- `docs/03-verification/generated/*-companion-brief.{json,md}` turns generated outputs into user-facing review cards.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-v0.1-FINAL-CHECK-20260630.md` records the final manual v0.1 verification.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REAL-RECORD-CHECK-20260630.md` records the first real-record validation.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-SCENARIO-USEFULNESS-TEST-20260630.md` records the first scenario usefulness test, the follow-up reinforcement, and the remaining product boundary.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPEAT-REAL-RECORD-TRIAL-20260630.md` records the repeated real-record trial across five records.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-PROMOTION-READINESS-PREFLIGHT-20260630.md` records the earlier preflight state before the later applied automation steps.

Current scenario reinforcement evidence:

- Korean user-language retrieval simulation passed 7 / 7 expected-record checks.
- Companion briefs now expose key decisions, definition changes, risks/traps, evidence, next action candidates, not-yet scope, and user-language retrieval hints.
- Retrieval index now separates generated helper JSON as `non_record_count` instead of counting it as skipped source output.
- Repeat real-record trial now passes 11 / 11 Korean scenario checks across five records, with `record_count` 5, `skipped_count` 0, and `non_record_count` 6.

This evidence proves package fit for a manual candidate. It does not prove release readiness or live automation readiness.

Current promotion and registration result:

- Manual skill candidate review passed and `beai-knowledge-loop` was applied as a manual live skill.
- Daily cron, missed-run recovery, external signal fetch, bounded daily memory append, Telegram delivery, local internal package generation, persistent review lane, and Gateway/Telegram watchdog now have applied evidence. Gateway hooks config, Gateway `agents.list` promotion, and public release publishing remain out of scope or blocked by protected config paths.

Manual skill apply evidence:

- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-SKILL-APPLY-CHECK-20260630.md` records the Skill Workshop apply and post-apply verification.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-PROMOTION-GATES-20260630.md` defines the gates that must pass before cron/hook/agent, durable memory automation, external connector, release packaging, or gateway restart automation.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-RUN-LEDGER-20260630.md` starts the post-live-skill-apply manual run ledger.
- The post-live-skill-apply manual run ledger now has 3 successful manual runs; this satisfies the count threshold for cron/hook/agent consideration.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-CRON-HOOK-AGENT-READINESS-20260630.md` records the earlier report-only cron readiness step.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPORT-ONLY-CRON-DRY-RUN-SPEC-20260630.md` records the earlier report-only cron spec before the daily applied cron expansion.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPORT-ONLY-CRON-REGISTRATION-CHECK-20260630.md` records the actual OpenClaw cron job id, schedule, delivery mode, and force-run verification.
- The daily cron now delivers the finished run summary to the user's Telegram direct conversation and has Telegram failure alerts enabled.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-DAILY-APPLIED-AUTOMATION-CHECK-20260630.md` records the applied cron, external connector, bounded memory append, and delivery state.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-FULL-REGISTRATION-CHECK-20260630.md` records the final registration state for the daily cron, persistent review lane, Gateway/Telegram watchdog, and Gateway-protected exclusions.
- `tools/beai-knowledge-loop-external-connector.mjs` fetches configured external signal sources into local reports.
- `tools/beai-knowledge-loop-memory-append.mjs` appends one bounded daily entry to the workspace daily memory file.
- `tools/beai-knowledge-loop-report-only.mjs` creates a local markdown report from the retrieval index; the daily applied cron then separately runs external fetch and bounded memory append.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-LOCAL-RELEASE-PACKAGE-CHECK-20260630.md` records the local internal zip package and checksum verification.
- `packages/beai-capability-pack-v0.2.0-knowledge-loop-20260630.zip` is a local internal package candidate, not a public release.
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REMAINING-AUTOMATION-EXECUTION-CHECK-20260630.md` records the remaining automation execution state.

## Upgrade From v0.1.1

If BEAI Capability Pack v0.1.1 is already installed, do not create duplicate skills.

Update these existing skills in place:

- `beai-release-verifier`
- `beai-session-handoff`
- `beai-memory-curator-review`
- `beai-starter-agent-alpha`

Add this new v0.2.0 skill:

- `beai-development-steward`
- `beai-doctor`

Do not modify BEAI Layer runtime core, OpenClaw gateway settings, broad automation settings, or durable memory settings while applying this pack.

## Core Rule

Start skill-first.

Promote to agent only when repeated use proves that the role needs independent state, separate responsibility, or permission separation.

Promote to automation only after manual execution, failure boundaries, stop paths, and report channels are verified.

## Not Included

This package does not create OpenClaw core changes, installer files, Gateway-level hooks, Gateway `agents.list` promotion, or public release publishing. The local workspace currently has one registered daily cron for review-file generation, external signal fetch, bounded daily memory append, Telegram run-summary delivery, Telegram failure alerts, one missed-run recovery cron, one persistent review lane, one bounded Gateway/Telegram watchdog, and one local internal zip package candidate.

BEAI Knowledge Loop v0.1 also does not create session-end hooks, automatic Obsidian restructuring, external delivery, or live durable memory promotion.

BEAI Doctor Runtime Trust Upgrade also does not create live Gateway changes, live hook registration, live cron mutation, live agent promotion, durable memory writes, external sends, or public release publishing. Its package check helper is local and read-only.

## Files

- `skills/release-verifier-skill.md`
- `skills/session-handoff-skill.md`
- `skills/memory-curator-review-skill.md`
- `skills/beai-development-steward/SKILL.md`
- `skills/beai-development-steward/references/*.md`
- `skills/beai-development-steward/templates/*.md`
- `skills/beai-knowledge-loop-skill.md`
- `skills/beai-doctor/SKILL.md`
- `tools/beai-doctor.js`
- `tools/install-wake-guard-launchagent.js`
- `agents/beai-starter-agent-alpha.md`
- `routing.md`
- `examples/dry-run-prompts.md`
- `OPENCLAW-HANDOFF-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-CLI-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-COMPANION-UX-v0.1-ko.md`
- `docs/UPGRADE-BEAI-KNOWLEDGE-LOOP-v0.1-ko.md`
- `docs/BEAI-DOCTOR-PACKAGE-INTEGRATION-v0.1-ko.md`
- `docs/BEAI-TRUST-GATE-v0.1-ko.md`
- `docs/BEAI-AGENT-TRUST-LEDGER-v0.1-ko.md`
- `docs/BEAI-CONNECTOR-ONBOARDING-v0.1-ko.md`
- `docs/03-verification/generated/knowledge-loop-case3a.json`
- `docs/03-verification/generated/knowledge-loop-external-signal.json`
- `docs/03-verification/generated/knowledge-loop-beai-knowledge-loop-v0.1-dev-session.json`
- `docs/03-verification/generated/knowledge-loop-scenario-reinforcement.json`
- `docs/03-verification/generated/knowledge-loop-telegram-response-persistence.json`
- `docs/03-verification/generated/knowledge-loop-retrieval-index.json`
- `docs/03-verification/generated/knowledge-loop-case3a-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-external-signal-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-beai-knowledge-loop-v0.1-dev-session-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-scenario-reinforcement-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-telegram-response-persistence-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-report-only-review.md`
- `docs/03-verification/generated/knowledge-loop-external-connector-report.md`
- `docs/03-verification/generated/knowledge-loop-external-connector-report.json`
- `docs/03-verification/generated/beai-doctor-package-check.md`
- `docs/03-verification/generated/beai-doctor-package-check.json`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-v0.1-FINAL-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REAL-RECORD-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-SCENARIO-USEFULNESS-TEST-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPEAT-REAL-RECORD-TRIAL-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-PROMOTION-READINESS-PREFLIGHT-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-SKILL-APPLY-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-PROMOTION-GATES-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-RUN-LEDGER-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-CRON-HOOK-AGENT-READINESS-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPORT-ONLY-CRON-DRY-RUN-SPEC-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REPORT-ONLY-CRON-REGISTRATION-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-LOCAL-RELEASE-PACKAGE-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REMAINING-AUTOMATION-EXECUTION-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-DAILY-APPLIED-AUTOMATION-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-FULL-REGISTRATION-CHECK-20260630.md`
- `docs/03-verification/BEAI-DOCTOR-PACKAGE-INTEGRATION-CHECK-20260630.md`
- `docs/03-verification/BEAI-DOCTOR-LIVE-RUNTIME-CHECK-20260630.md`
- `docs/UPGRADE-v0.2.0-ko.md`
- `docs/RELEASE-NOTES-v0.2.0-ko.md`
- `tools/beai-knowledge-loop.mjs`
- `tools/beai-knowledge-loop-report-only.mjs`
- `tools/beai-knowledge-loop-external-connector.mjs`
- `tools/beai-knowledge-loop-memory-append.mjs`
- `tools/beai-doctor-package-check.mjs`
- `config/beai-knowledge-loop-external-sources.json`
- `config/beai-trust-gate-statuses.json`
- `config/beai-connector-onboarding-checklist.json`
- `state/beai/agent-trust-ledger.json`
- `packages/beai-capability-pack-v0.2.0-knowledge-loop-20260630.zip`
- `packages/beai-capability-pack-v0.2.0-knowledge-loop-20260630.zip.sha256`
- `packages/beai-capability-pack-v0.2.0-doctor-trust-20260630.zip`
- `packages/beai-capability-pack-v0.2.0-doctor-trust-20260630.zip.sha256`
