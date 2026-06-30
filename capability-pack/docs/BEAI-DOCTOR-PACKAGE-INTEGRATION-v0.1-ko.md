# BEAI Doctor Package Integration v0.1

## Position

BEAI Doctor is the runtime diagnosis program for BEAI Capability Pack on OpenClaw.

It is not a replacement for OpenClaw Doctor. OpenClaw Doctor checks OpenClaw core health. BEAI Doctor checks whether BEAI-owned runtime behavior is visible, callable, verified, and safe enough for the user to rely on.

## Official Name

- skill id: `beai-doctor`
- display name: `BEAI Doctor`
- Korean name: `비아이 닥터`
- package role: runtime diagnosis and trust boundary skill

## Scope

BEAI Doctor checks:

- BEAI Runtime plugin visibility, version, and load state
- BEAI skill and package readiness
- Telegram and Gateway symptoms after BEAI installation or operation
- hook, plugin, skill, and package boundaries
- Knowledge Loop cron and recovery status
- bounded memory append marker state
- external connector report state
- Telegram delivery evidence
- Gateway/Telegram watchdog evidence
- live/package/zip consistency
- Trust Gate status output
- Agent Trust Ledger entries
- Connector Onboarding risk findings

## Reliability Stages

BEAI Doctor should not collapse all states into "working" or "broken".

It separates:

- `configured`: a setting or file exists
- `registered`: OpenClaw can see the thing
- `route_visible`: the route can be discovered
- `permission_allowed`: the operation is permitted
- `callable`: the operation can be called
- `call_succeeded`: the call returned without runtime failure
- `output_verified`: the result was checked and matches the intended behavior

## User-Facing States

BEAI Doctor reports in user language:

- `healthy`: working and verified
- `auto_repairable`: safe local repair is possible
- `approval_required`: repair would touch protected state
- `blocked`: cannot continue without external state, permission, or user action
- `unverified`: present but not proven by output evidence

## Protected Boundaries

BEAI Doctor must not silently:

- restart Gateway
- change Telegram/channel settings
- edit OpenClaw core config
- edit hooks, agents, cron, or plugin config
- write durable memory
- send external messages
- publish a release package
- promote a skill or agent to live runtime

Those actions require a separate approval and a recoverable plan.

## Package Integration Rule

The package now treats BEAI Doctor as a formal skill component, not a loose workspace-only dependency.

The package contains:

- `skills/beai-doctor/SKILL.md`
- `tools/beai-doctor.js`
- `tools/install-wake-guard-launchagent.js`
- this integration document
- Trust Gate status configuration
- Agent Trust Ledger seed
- Connector Onboarding checklist
- package check helper

## Completion Criteria

This integration is complete only when:

- `capability-pack.json` lists `beai-doctor` as a skill
- copied skill files exist in the package
- Trust Gate statuses are defined
- Agent Trust Ledger has a package-readable seed
- Connector Onboarding checklist exists
- package check helper runs successfully
- generated package check report marks required files as present
- the new internal zip candidate and checksum are generated

