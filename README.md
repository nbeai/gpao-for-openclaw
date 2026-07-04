# BEAI Package for OpenClaw

BEAI Package for OpenClaw is a runtime judgment, reliability, and workflow package for OpenClaw.

If you received the ZIP and want to install or review it, start here:

- `README-FIRST.md`: fastest user path, manual ZIP path, verification, rollback, and status boundary
- `INSTALL.md`: install-focused command reference
- `plugin/beai-runtime/README.dist.md`: runtime-only package notes

If OpenClaw is the workspace where AI agents can use tools, skills, memory, plugins, hooks, and cron jobs, BEAI Package adds the judgment boundaries around that workspace. It helps users understand what is ready, partial, unverified, blocked, needs approval, on hold, or unsafe before an agent mutates files, writes memory, sends messages, schedules automation, or claims completion.

It helps OpenClaw users separate:

- user intent
- evidence and assumptions
- memory candidates
- skill routing
- automation readiness
- Telegram visible delivery
- operational notification action clarity
- runtime operations health
- control-center visibility for source/live/package/release/workflow state
- package verification and release boundaries

This repository is an alpha public staging release-candidate repository. It is not an OpenClaw core fork, and it does not claim stable production support status until the public ClawHub/release path is completed and clean-environment evidence is attached.

In practical terms, this means BEAI Package is currently best read as:

- a public reference implementation for BEAI runtime judgment on OpenClaw
- a reviewable source package for BEAI Runtime and BEAI Capability Pack components
- a manual-verification release candidate for users who understand OpenClaw plugins, skills, hooks, and local runtime operations

It should not yet be described as a stable one-command installer or support promise.

## Package Shape

BEAI Package for OpenClaw is not one single script. It is a layered package:

```text
OpenClaw Runtime
-> BEAI Runtime Layer
-> BEAI Memory Layer
-> BEAI Capability Programs
-> BEAI Knowledge Loop
-> BEAI Verification / Release Layer
-> BEAI Runtime Operations Layer
```

## Key Terms

- `Layer`: a judgment layer or operating boundary.
- `Plugin`: an OpenClaw-loadable package unit.
- `Runtime`: the execution engine inside a plugin.
- `Hook`: an observation point in the OpenClaw execution flow.
- `Router`: the decision path that chooses which capability should handle a request.
- `Skill`: a reusable manual-first work procedure.
- `Harness`: a planning and verification frame for development/release work.
- `Cron`: a verified scheduled automation.
- `Doctor`: a diagnosis program for runtime/package/operations health.
- `Trust Gate`: shared status language for closing results as ready, partial, unverified, blocked, needs_approval, hold, or unsafe.

## Repository Contents

```text
plugin/beai-runtime/
  OpenClaw plugin source for the BEAI Runtime Layer.

capability-pack/
  Skills, tools, routing rules, configs, examples, and package docs.
```

## Current Alpha Scope

Included:

- BEAI Runtime plugin source
- BEAI Capability Pack source
- BEAI Doctor
- BEAI Knowledge Loop tools
- Trust Gate statuses
- Connector Onboarding checklist
- Telegram delivery contract
- Korean Natural AI Writing Standard v1.0
- Friction-Aware Gate contract
- BEAI Control Center read-only status command
- BEAI Workbench Essential Skills source-candidate studios
- BEAI External Reach Layer read-only connector contract and doctor
- public documentation and examples

Excluded:

- private workspace state
- generated local evidence logs
- personal memory files
- packaged internal zip files
- local cron stores
- local Telegram identifiers
- account logins, browser cookies, or paid API keys for social-channel access
- Gateway config mutation
- public release publishing automation

## Safety Position

This package is designed to observe and classify before it mutates.

By default, it should not:

- edit OpenClaw core files
- restart Gateway automatically
- create cron jobs automatically
- promote agent registrations automatically
- write durable memory automatically
- send external messages automatically
- claim Telegram completion without messageId evidence
- surface watchdog, heartbeat, cron dry-run, or Knowledge Loop review-candidate signals as raw user tasks

## Runtime Plugin

The runtime plugin lives in:

```text
plugin/beai-runtime
```

Its current public staging version is `0.6.20`.

ClawHub package name:

```text
@nbeai/beai-runtime
```

When the ClawHub release is visible for installation, OpenClaw users can install the runtime plugin with:

```bash
openclaw plugins install clawhub:@nbeai/beai-runtime
openclaw plugins enable beai-runtime
```

The GitHub ZIP release remains the full BEAI Package distribution candidate. The ClawHub package is the OpenClaw runtime plugin install surface.

The v0.6.20 runtime includes Telegram reliability, organic-flow, action-semantics, and friction-aware approval rules:

- quick first-status contract before deep work
- phase timing telemetry
- long-running visible progress gap detection
- message_sent + messageId delivery closure
- reply_payload_sending treated as a candidate, not completion
- operational-notification gating so dry-run/watchdog/heartbeat candidates do not become noisy user tasks
- organic flow and human companion quality checks so current intent, context, and evidence boundaries stay aligned
- action semantics gating so diagnosis, report, mitigation, repair, verification, and prevention are not described as the same state
- recovery claim evidence rules so "fixed/recovered/resolved" wording requires failure-path observation, cause, path change, and same-condition re-verification
- friction-aware gating so drafts, thinking, read-only checks, and candidate work stay fast by default, quiet checks avoid interrupting the user, approvals appear only at real risk transitions, and post-action verification prevents completion overclaim

## BEAI Control Center

BEAI Control Center v0.1 is a read-only status surface for the package. It gathers source version, live runtime version, latest package archive, workflow/promotion/automation/memory ledgers, verification reports, approval boundaries, and the next safe action in one report.

```bash
cd capability-pack
node tools/beai-control-center.mjs --root . --format md --stdout
```

This command does not create release zips, publish, install, restart Gateway, send messages, mutate cron/agents/hooks, write memory, or change OpenClaw core.

## ClawHub Positioning

BEAI Runtime should be introduced to OpenClaw users as a trust operating layer, not as "one more plugin."

The intended public position is:

```text
Runtime judgment, Knowledge Loop memory capture, and Telegram delivery trust for serious OpenClaw work.
```

The strongest launch hook is Knowledge Loop:

```text
Auto-capture, not auto-approve.
```

BEAI can help agents capture useful work traces and memory candidates, but it must not silently approve durable memory, external sends, public posts, account changes, money/legal actions, cron automation, or release claims.

ClawHub launch and account-operation copy lives in:

- `capability-pack/docs/BEAI-CLAWHUB-INFLUENCE-OPERATING-PLAN-v0.1-ko.md`
- `capability-pack/docs/BEAI-CLAWHUB-CARD-COPY-v0.1.md`
- `capability-pack/docs/BEAI-CLAWHUB-PRELAUNCH-CONTENT-BACKLOG-v0.1-ko.md`

Korean public copy, Korean user-facing replies, app copy, error messages, release wording, and presentation scripts should follow:

- `capability-pack/docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md`
- `capability-pack/skills/beai-korean-natural-writing-skill.md`

The Korean standard keeps BEAI wording from becoming stiff, translated, overconfident, or misleading. It preserves meaning first, then improves Korean order, medium fit, sentence length, uncertainty boundaries, and action clarity. It also keeps status language honest: implemented, verified, applied, sent, packaged, and published are separate states.

## Capability Pack

The capability pack lives in:

```text
capability-pack
```

It includes:

- `beai-doctor`
- `beai-development-steward`
- `beai-session-handoff`
- `beai-memory-curator-review`
- `beai-release-verifier`
- `beai-knowledge-loop`
- `beai-korean-natural-writing`
- `beai-starter-agent-alpha` as an agent candidate

## Verification

This repository should be treated as alpha until these checks are run in a clean OpenClaw environment:

```bash
cd plugin/beai-runtime
npm install
npm run build
npm test
openclaw plugins doctor
openclaw hooks
```

Expected:

- the plugin installs dependencies without blocking install errors
- the runtime builds without TypeScript errors
- tests pass
- `openclaw plugins doctor` recognizes `beai-runtime` without plugin load issues
- `openclaw hooks` shows the expected hook surface as ready

For the capability pack:

```bash
cd capability-pack
node --check tools/beai-doctor.js
node --check tools/beai-doctor-package-check.mjs
node --check tools/beai-user-scenario-audit.mjs
node --check tools/beai-workbench-skill-audit.mjs
node --check tools/beai-external-reach-doctor.mjs
node tools/beai-doctor-package-check.mjs
node tools/beai-flow-regression-gate.mjs --root . --format md --output docs/03-verification/generated/beai-flow-regression-gate.md --stdout
node tools/beai-user-scenario-audit.mjs --root . --format md --output docs/03-verification/generated/beai-user-scenario-audit.md --stdout
node tools/beai-workbench-skill-audit.mjs --root . --format md --output docs/03-verification/generated/beai-workbench-skill-audit.md --stdout
node tools/beai-external-reach-doctor.mjs --root . --format md --output docs/03-verification/generated/beai-external-reach-doctor.md --stdout
```

Expected:

- tool files pass Node syntax checks
- the package check completes without missing required files
- BEAI Doctor reports the capability pack as package-ready for controlled alpha review
- BEAI 5 Flow regression checks pass before making user-experience or release-readiness claims
- BEAI user-scenario audit separates pass, partial, and fail states before user-experience claims
- Workbench Essential Skills source-candidate audit reports 5/5 studios ready
- External Reach static doctor reports public channels, source registry fields, and approval-gated social/account boundaries ready

## Public Release Status

Current status: `public staging release candidate`.

This repository is suitable for review, documentation, and controlled manual testing.

It should not yet be presented as a stable one-command production support promise.

Before a pre-release tag such as `v0.7.0-alpha.1`, this repository should also have clean-environment verification evidence, a rollback note, and release wording that keeps alpha review separate from stable distribution.
