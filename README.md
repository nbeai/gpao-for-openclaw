# BEAI Package for OpenClaw

BEAI Package for OpenClaw is a runtime judgment, reliability, and workflow package for OpenClaw.

It helps OpenClaw users separate:

- user intent
- evidence and assumptions
- memory candidates
- skill routing
- automation readiness
- Telegram visible delivery
- runtime operations health
- package verification and release boundaries

This repository is an alpha public staging repository. It is not an OpenClaw core fork, and it does not claim production-ready public release status.

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
- public documentation and examples

Excluded:

- private workspace state
- generated local evidence logs
- personal memory files
- packaged internal zip files
- local cron stores
- local Telegram identifiers
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

## Runtime Plugin

The runtime plugin lives in:

```text
plugin/beai-runtime
```

Its current public staging version is `0.6.17`.

The v0.6.17 runtime includes Telegram speed-reliability rules:

- quick first-status contract before deep work
- phase timing telemetry
- long-running visible progress gap detection
- message_sent + messageId delivery closure
- reply_payload_sending treated as a candidate, not completion

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

For the capability pack:

```bash
cd capability-pack
node --check tools/beai-doctor.js
node --check tools/beai-doctor-package-check.mjs
node tools/beai-doctor-package-check.mjs
```

## Public Release Status

Current status: `alpha / public staging`.

This repository is suitable for review, documentation, and controlled manual testing.

It should not yet be presented as a one-command production install.
