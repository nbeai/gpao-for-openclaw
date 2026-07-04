# BEAI Capability Pack v0.2.5

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

- BEAI Package development principles and goals
- Release Verifier Skill
- Session Handoff Skill
- Memory Curator Review Skill
- BEAI Starter Agent alpha
- BEAI Development Steward Skill
- BEAI Knowledge Loop Skill (live-applied daily automation)
- BEAI Knowledge Loop Skill is now applied with daily review report generation, external signal fetch, bounded memory append, Telegram run delivery, missed-run recovery, a persistent review lane, and a bounded Gateway/Telegram watchdog.
- BEAI Doctor Skill (packaged runtime diagnosis and trust boundary upgrade)
- BEAI Korean Natural Writing Skill (v1.0 Korean response, docs, release, app-copy, presentation, and public-copy standard)
- BEAI Operational Notification Contract (watchdog, heartbeat, cron dry-run, and Knowledge Loop candidate user-action framing)
- BEAI Human Companion Quality Contract (current-request anchoring, cognitive load reduction, user agency, long-context stability, and trust recovery)
- BEAI Organic Flow Audit (runtime, hooks, skills, tools, evidence, Korean wording, and release-boundary cohesion)
- BEAI Action Semantics and Recovery Claim Contract (diagnose/report/mitigate/repair/verify/prevent separation and recovery claim evidence gate)
- BEAI Friction-Aware Gate Contract (fast by default, quiet checks where possible, approval only at risk transitions, and verification before completion claims)
- BEAI Control Center Contract (read-only source/live/package/release/workflow/automation/memory/verification status surface)
- BEAI Workbench Essential Skills (Visual Design, Presentation, Document Craft, Research Evidence, and Data Insight source-candidate studios)
- BEAI External Reach Layer (read-only public web/GitHub/YouTube/RSS connector contract with approval-gated social/account boundaries)
- Capability routing rules

## BEAI Korean Natural Writing Direction

BEAI Korean output should not try to "sound human" as a trick.

It should help the user understand the current state, evidence, uncertainty, and next action in natural Korean.

The package now includes a v1.0 Korean language standard and a narrow execution skill:

- `docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md`
- `skills/beai-korean-natural-writing-skill.md`

Use this skill when writing or reviewing Korean:

- Telegram/OpenClaw replies
- development progress reports
- README/release/verification documents
- ClawHub card and launch copy
- Knowledge Loop review cards
- Doctor/Trust Gate explanations
- customer notices, apologies, emails, SNS posts, app copy, error messages, and presentation scripts

Core rule:

```text
Natural Korean is not decoration.
It is status clarity, evidence clarity, and action clarity in Korean.
```

The runtime-facing minimum rule is:

```text
한국어 응답은 결론과 현재 상태로 시작한다.
의미, 숫자, 날짜, 고유명사, 검증 결과를 자연화 과정에서 바꾸지 않는다.
확인/추정/미확인을 분리한다.
완료, 적용, 검증, 전송, 배포를 섞지 않는다.
자동 칭찬, 번역투, 추상 명사, 과장된 완료 표현을 피한다.
매체에 맞게 채팅, 문서, 발표, SNS, 앱 화면, 오류 메시지의 호흡을 바꾼다.
```

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

The first version started manual-first at the skill level. Local evidence is not default package behavior: 윤's OpenClaw workspace has separate proof for daily review automation, Telegram delivery, recovery, a persistent review lane, and a bounded Gateway/Telegram watchdog, but those live registrations are tracked separately in `docs/03-verification/local/BEAI-KNOWLEDGE-LOOP-LOCAL-LIVE-EVIDENCE-20260702.md` and are not installed by default.

Knowledge Loop automation follows the package principle `Auto-capture, not auto-approve`: local search, draft capture, indexing, review queue creation, and evaluation can run with strong automation when they remain review-only, but approved state, durable memory promotion, external execution, release wording, customer contact, account changes, money, tax, legal, or public posting require explicit approval. See `docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md`.

## ClawHub Influence Direction

The ClawHub launch should build influence before monetization.

BEAI Package should be positioned as the trust operating layer for serious OpenClaw work:

- review-first Knowledge Loop memory capture
- current-request and evidence-aware runtime judgment
- Telegram visible-delivery trust
- Doctor, regression, and release-readiness gates

Public copy should lead with user pain and visible value, not internal architecture. The account-level goal is to make OpenClaw users recognize BEAI / Jongyoon Park as the builder pushing AI work memory, reliability, and delivery trust forward in the OpenClaw ecosystem.

Launch and card-copy assets:

- `docs/BEAI-CLAWHUB-INFLUENCE-OPERATING-PLAN-v0.1-ko.md`
- `docs/BEAI-CLAWHUB-CARD-COPY-v0.1.md`
- `docs/BEAI-CLAWHUB-PRELAUNCH-CONTENT-BACKLOG-v0.1-ko.md`

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

## Operational Notification Direction

Operational signals are not automatically user tasks.

Watchdog route dry-runs, heartbeat recovery checks, cron candidates, and Knowledge Loop review candidates may be useful internal signals, but they should not reach users as raw internal notices. If there is no user action, the package contract keeps the notification quiet or says clearly that no user action is needed. If a user-visible operational notice is necessary, it must separate:

- user action or no-user-action
- assistant action
- not-yet or approval boundary

Package references:

- `docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md`
- `config/beai-operational-notification-contract.json`
- `tools/beai-operational-notification-gate.mjs`

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

Current local promotion and registration evidence:

- Manual skill candidate review passed and `beai-knowledge-loop` was applied as a manual live skill in 윤's local workspace.
- Daily cron, missed-run recovery, external signal fetch, bounded daily memory append, Telegram delivery, local internal package generation, persistent review lane, and Gateway/Telegram watchdog have local evidence only. They are not package defaults and are tracked in `docs/03-verification/local/BEAI-KNOWLEDGE-LOOP-LOCAL-LIVE-EVIDENCE-20260702.md`. Gateway hooks config, Gateway `agents.list` promotion, and public release publishing remain out of scope or blocked by protected config paths.

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

## Development Principles

All BEAI Package development should reference:

- `docs/BEAI-PACKAGE-DEVELOPMENT-PRINCIPLES-v0.1-ko.md`
- `docs/BEAI-5-FLOW-ENGINE-DEVELOPMENT-PLAN-v0.1-ko.md`

Core operating sentence:

```text
BEAI Package는 "AI가 무엇을 할 수 있는가"보다
"어디까지 맡길 수 있고, 어디서 멈추며, 누가 확인하고,
어떻게 되돌릴 수 있는가"를 먼저 보장하는
OpenClaw의 신뢰 운영층이다.
```

The package must be safe and pleasant to use. Security, approval, verification, and recovery should behave as rails that help users move with confidence, not as repeated friction, slow confirmations, or procedural theater.

BEAI 5 Flow Engine is the current implementation direction. It should not become a separate runtime. Its first implementation target is the OpenClaw BEAI Runtime Layer and Package. After that stabilizes, BEAI Harness for Codex can be aligned to the same Flow State language as a secondary ecosystem target.

Current Flow verification command:

```bash
node tools/beai-flow-regression-gate.mjs --root . --format md --output docs/03-verification/generated/beai-flow-regression-gate.md --stdout
node tools/beai-user-scenario-audit.mjs --root . --format md --output docs/03-verification/generated/beai-user-scenario-audit.md --stdout
node tools/beai-operational-notification-gate.mjs --root . --format md --output docs/03-verification/generated/beai-operational-notification-gate.md --stdout
node tools/beai-control-center.mjs --root . --format md --output docs/03-verification/generated/beai-control-center.md --stdout
```

Expected:

- `status: pass`
- self-check, engineering-quality, field-readiness, perceived-quality, and release-checklist lanes all pass
- no live OpenClaw config, Gateway, cron, hook, durable memory, external send, or release publishing mutation occurs during the check

Current user-scenario audit command:

```bash
node tools/beai-user-scenario-audit.mjs --root . --format md --output docs/03-verification/generated/beai-user-scenario-audit.md --stdout
```

Expected before user-experience or release-readiness claims:

- Telegram delivery, repeated footer, memory approval, and progress scenarios are checked as user-facing risks
- watchdog, heartbeat, cron dry-run, and Knowledge Loop candidate notices are checked so raw internal candidates do not become confusing user messages
- pass, partial, and fail states are preserved instead of collapsed into a single ready claim
- no live Telegram roundtrip, Gateway restart, cron mutation, external send, or release packaging occurs during this read-only check

Current Control Center command:

```bash
node tools/beai-control-center.mjs --root . --format md --stdout
```

Expected:

- source, live, package, release, workflow, automation, memory, and verification states are visible in one read-only report
- Workbench Essential Skills and External Reach Layer source-candidate status are visible without being overclaimed as live automation
- workflow candidates are not reported as active automations
- release zip, live runtime reinstall, Gateway restart, cron/agent activation, memory promotion, external send, and public publishing remain separate approval boundaries

## Not Included

This package does not create OpenClaw core changes, installer files, Gateway-level hooks, Gateway `agents.list` promotion, cron/watchdog registrations, persistent review lanes, live Telegram delivery, local zip candidates, or public release publishing by default. Local workspace evidence for those items is separated into `docs/03-verification/local/BEAI-KNOWLEDGE-LOOP-LOCAL-LIVE-EVIDENCE-20260702.md`.

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
- `skills/beai-korean-natural-writing-skill.md`
- `docs/BEAI-PACKAGE-DEVELOPMENT-PRINCIPLES-v0.1-ko.md`
- `docs/BEAI-5-FLOW-ENGINE-DEVELOPMENT-PLAN-v0.1-ko.md`
- `docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md`
- `docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md`
- `tools/beai-doctor.js`
- `tools/install-wake-guard-launchagent.js`
- `agents/beai-starter-agent-alpha.md`
- `routing.md`
- `examples/dry-run-prompts.md`
- `OPENCLAW-HANDOFF-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-CLI-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-COMPANION-UX-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md`
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
- `tools/beai-operational-notification-gate.mjs`
- `tools/beai-control-center.mjs`
- `tools/beai-workbench-skill-audit.mjs`
- `tools/beai-external-reach-doctor.mjs`
- `config/beai-knowledge-loop-external-sources.json`
- `config/beai-trust-gate-statuses.json`
- `config/beai-connector-onboarding-checklist.json`
- `config/beai-operational-notification-contract.json`
- `config/beai-workbench-essential-skills-contract.json`
- `config/beai-external-reach-contract.json`
- `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-RESEARCH-DOSSIER-v0.1-ko.md`
- `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-DEVELOPMENT-PLAN-v0.1-ko.md`
- `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-CONTRACT-v0.1-ko.md`
- `docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md`
- `docs/RELEASE-NOTES-v0.2.5-ko.md`
- `skills/beai-visual-design-studio/SKILL.md`
- `skills/beai-presentation-studio/SKILL.md`
- `skills/beai-document-craft-studio/SKILL.md`
- `skills/beai-research-evidence-studio/SKILL.md`
- `skills/beai-data-insight-lab/SKILL.md`
- `state/beai/agent-trust-ledger.json`
- `packages/beai-capability-pack-v0.2.0-knowledge-loop-20260630.zip`
- `packages/beai-capability-pack-v0.2.0-knowledge-loop-20260630.zip.sha256`
- `packages/beai-package-for-openclaw-v0.2.0-runtime-v0.6.17-20260701-2244.zip`
- `packages/beai-package-for-openclaw-v0.2.0-runtime-v0.6.17-20260701-2244.zip.sha256`
- `packages/beai-capability-pack-v0.2.0-doctor-trust-20260630.zip`
- `packages/beai-capability-pack-v0.2.0-doctor-trust-20260630.zip.sha256`
