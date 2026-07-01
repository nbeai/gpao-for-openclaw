# Capability Routing

This document defines how BEAI Capability Pack skills and agent candidates hand work to each other.

The goal is not to create a complex orchestration system.

The goal is to avoid accidental role overlap and to keep each capability narrow.

## Routing Principles

- Prefer the narrowest capability that can handle the request.
- Do not escalate from skill to agent unless necessary.
- Do not escalate from manual skill to automation unless manual proof exists.
- Do not turn session continuity into durable memory.
- Do not turn onboarding suggestions into immediate automation.
- For BEAI Package work, keep `docs/BEAI-PACKAGE-DEVELOPMENT-PRINCIPLES-v0.1-ko.md` as the top-level product principle reference.
- For BEAI 5 implementation work, keep `docs/BEAI-5-FLOW-ENGINE-DEVELOPMENT-PLAN-v0.1-ko.md` as the development plan. Do not create a separate runtime; implement Flow State first inside the existing OpenClaw BEAI Runtime Layer, then align adapter, doctor, knowledge, response gates, and later Codex Harness language.
- Safety and security must not become avoidable user friction. Approval, verification, and recovery should make the user more comfortable delegating work, not make OpenClaw feel slow or obstructive.

## Primary Routes

### Starter Agent Alpha -> Session Handoff Skill

Use when:

- Starter designed a first workflow, but the work will continue in a later session.
- The user asks to continue setup later.
- The first workflow needs a compact next-session note.

Carry:

- selected first workflow
- risk level
- recommended form
- success criteria
- not-yet items
- next test phrase

Do not carry:

- full intake conversation
- unsafe discarded automation ideas
- speculative user profile

### Starter Agent Alpha -> Release Verifier Skill

Use when:

- Starter produces a package, shared workflow, template, or team-facing artifact.
- The user asks whether a proposed pack can be shared.

Carry:

- intended audience
- package/artifact path
- intended label
- known limitations
- evidence level

### Starter Agent Alpha -> Facility Console

Use when:

- OpenClaw is not installed.
- Telegram does not respond.
- gateway or model/API status is unclear.
- plugin loading fails.

Starter should not diagnose runtime infrastructure deeply.

It should hand off:

```text
이건 자동화 설계보다 먼저 설치/상태 확인이 필요한 문제입니다.
Facility Console에서 Gateway, Telegram, 모델/API 상태를 먼저 확인하는 게 맞습니다.
```

### Starter Agent Alpha -> BEAI Doctor

Use when:

- the user is already in a BEAI/OpenClaw workspace.
- the symptom is about BEAI skill visibility, plugin state, package readiness, Telegram delivery, Gateway response, sleep/wake behavior, or Knowledge Loop operation.
- the first workflow cannot be trusted until runtime health is checked.

Carry:

- user-facing symptom
- current surface, if known
- recent operation name, if known
- whether the request is read-only diagnosis or repair

Rule:

Starter Agent Alpha should not perform runtime diagnosis itself. It should hand BEAI-owned runtime reliability questions to `beai-doctor`.

### Session Handoff Skill -> Memory Curator Review Skill

Use when:

- A handoff contains items that look like durable memory.
- The user asks whether something should be remembered.
- A continuity note includes project rules, user preferences, or long-term constraints.

Memory Curator should decide whether each item is:

- session_continuity
- memory_candidate
- agreement_candidate
- discarded_context
- reject

Rule:

Session handoff is not long-term memory.

### Release Verifier Skill -> Memory Curator Review Skill

Use when:

- A release audit discovers repeated release rules.
- A packaging boundary becomes a future standard.
- A user says "이 기준은 앞으로도 유지하자."

Memory Curator should not save automatically.

It should propose agreement candidates and ask for confirmation.

### Release Verifier Skill -> Session Handoff Skill

Use when:

- Release verification is incomplete.
- A package has remaining P0/P1 items and the work will continue later.

Carry:

- current package label
- verified facts
- unresolved P0/P1 items
- next verification command or document check

### Release Verifier Skill -> BEAI Doctor

Use when:

- release readiness depends on live skill visibility, package manifest consistency, zip/checksum state, cron evidence, Telegram delivery evidence, or Doctor findings.
- a package claims something is applied, registered, callable, or verified and that claim needs runtime-facing evidence.

Carry:

- package label
- manifest path
- artifact path
- claimed live state
- required evidence
- current unresolved checks

Rule:

Release Verifier decides release wording. BEAI Doctor checks runtime/package health signals that release wording depends on.

### Development Steward Skill -> Release Verifier Skill

Use when:

- a development session produces a package, installer, release candidate, zip, or team-facing artifact.
- version, manifest, docs, or release state needs final verification.
- the user asks whether a technical artifact can be shared.

Carry:

- current source version
- current live/runtime state
- package or candidate folder path
- verification results
- unverified items
- release stance

### Development Steward Skill -> Session Handoff Skill

Use when:

- a development session is long and must continue later.
- context is close to full.
- the user asks for continuity without durable memory promotion.

Carry:

- current objective
- changed files/artifacts
- verified evidence
- unverified or blocked items
- next safe action

### Development Steward Skill -> Memory Curator Review Skill

Use when:

- a project rule, release rule, user preference, or development principle appears reusable.
- the user says "앞으로 이 기준 유지하자."
- a session note risks becoming durable memory without review.

Do not carry:

- temporary debugging details
- raw command output
- assistant guesses
- frustrated transient wording

### Development Steward Skill -> BEAI Knowledge Loop Skill

Use when:

- a development session produces decisions, patterns, traps, package candidates, or development candidates that should become reviewable project knowledge.
- BEAI Package or BEAI Harness work needs a source-grounded record before later implementation or release checks.
- the user asks to make BEAI Package compound knowledge from work records.

Carry:

- source record or source reference
- project/package lane
- observed facts
- implementation or verification evidence
- known uncertainty
- next safe action

Do not carry:

- raw private transcripts unless the user explicitly asks to use them
- debug residue
- unsupported completion claims
- automatic memory promotion

### Development Steward Skill -> BEAI Package Development Principles

Use when:

- BEAI Package development goals, scope, user experience, security boundary, runtime behavior, automation, memory, release wording, or package identity are being decided.
- a change risks becoming safe-but-slow, secure-but-frustrating, or feature-rich-but-heavy.
- the user gives a product principle or package-level goal that should shape future BEAI Package development.

Carry:

- the current package goal
- the user-facing friction being reduced
- the trust boundary being preserved
- the expected user comfort or speed improvement
- evidence needed before completion or release wording

Rule:

The principle document is not a release proof. It is the product judgment source. Release Verifier still decides package readiness wording, and BEAI Doctor still owns runtime diagnosis language.

### Development Steward Skill -> BEAI Doctor

Use when:

- development work touches BEAI package readiness, runtime diagnosis, Trust Gate state, Knowledge Loop operations, Connector Onboarding, or Agent Trust Ledger evidence.
- a development change requires proof that live, package, and zip states are not being confused.
- the user asks whether an existing BEAI runtime component already exists.

Carry:

- files changed or proposed
- package/component name
- current evidence
- unverified live state
- protected boundaries

Rule:

Development Steward may implement package files, but BEAI Doctor owns the diagnosis language for runtime health and package/live consistency.

### BEAI Knowledge Loop Skill -> Memory Curator Review Skill

Use when:

- a knowledge note contains memory-like candidates.
- a pattern, project rule, or agreement may deserve long-term recall.
- session continuity risks being mistaken for durable memory.

Rule:

Knowledge Loop creates reviewable knowledge candidates. It does not write durable memory.

### BEAI Knowledge Loop Skill -> Release Verifier Skill

Use when:

- a knowledge note makes package, install, zip, manifest, distribution, or release-readiness claims.
- a package candidate is being promoted beyond draft or internal review.

Rule:

Knowledge Loop can produce package upgrade candidates, but Release Verifier decides readiness wording.

### BEAI Knowledge Loop Skill -> Development Steward Skill

Use when:

- a knowledge candidate should become implementation work.
- the next step touches package files, install paths, verification, or release boundaries.

Carry:

- candidate title
- source reference
- intended package boundary
- acceptance criteria
- non-goals
- approval boundary

### BEAI Knowledge Loop Skill -> Companion UX

Use when:

- a generated knowledge-loop output should be shown to a user in a short reviewable form.
- the user needs to see signals, candidates, review needs, next action, and safety boundaries without reading the full internal classification.
- a knowledge candidate is not ready for memory, automation, connector, or release action but should remain understandable.

Carry:

- title
- source reference
- summary
- reality signals
- knowledge candidates
- review-needed items
- next safe action
- boundary flags

Rule:

Companion UX displays review cards. It does not approve memory, start automation, send external messages, or claim release readiness.

### BEAI Knowledge Loop Skill -> BEAI Doctor

Use when:

- daily cron, missed-run recovery, external connector, memory marker, Telegram delivery, persistent review lane, or watchdog state needs diagnosis.
- Knowledge Loop output exists but its operational status is still unverified.
- the user asks if the automation is safe or working after laptop sleep/offline windows.

Carry:

- automation id or name
- report path
- connector report path
- memory marker state
- delivery evidence
- latest error or skipped reason

Rule:

Knowledge Loop creates reports and knowledge candidates. BEAI Doctor classifies the operating state as ready, partial, unverified, blocked, or approval-required.

### BEAI Doctor -> Release Verifier Skill

Use when:

- Doctor finds that a package, manifest, zip, checksum, or public release claim needs formal release wording.
- live/package/zip consistency affects whether something can be distributed.

Carry:

- Doctor finding
- affected files
- manifest/live/zip mismatch, if any
- generated check report

### BEAI Doctor -> Memory Curator Review Skill

Use when:

- a repeated runtime rule, repair boundary, or user preference looks like a durable BEAI operating principle.
- a Doctor finding should become an agreement candidate rather than raw memory.

Rule:

Doctor findings are not durable memory by default.

### BEAI Doctor -> Connector Onboarding

Use when:

- the user asks to use a tool that is not registered.
- a plugin, MCP server, API, local file export, or manual upload path must be chosen.
- a new connector would require credentials, customer data, write/delete/send, cron, or payment permissions.

Carry:

- requested tool
- intended operation
- sensitivity
- read-only possibility
- existing plugin/MCP/API evidence
- approval boundary

Rule:

Connector Onboarding classifies the connection path. It does not install or connect tools by itself.

### Development Steward Skill -> Starter Agent Alpha

Use when:

- a non-developer user has a vague app/service/workflow idea and first needs to decide what to build.
- the request is before implementation and mostly about "what should I make first?"

Rule:

Starter helps choose the safe first success experience. Development Steward takes over once the work becomes an implementation, verification, or release process.

## Anti-Routes

Do not route:

- Memory Curator Review -> automatic durable memory write
- Starter Agent Alpha -> cron creation
- Session Handoff -> long summary
- Release Verifier -> destructive cleanup without explicit approval
- BEAI Knowledge Loop -> cron, hook, agent, or durable memory activation without explicit approval
- BEAI Doctor -> Gateway restart, Telegram/channel mutation, hook registration, cron mutation, durable memory write, or external send without explicit approval
- Connector Onboarding -> plugin install, MCP connection, API credential use, or write/delete/send action without explicit approval
- Facility problems -> Starter automation planning
- Development Steward -> package/zip creation without explicit user instruction
- Development Steward -> live system restart without explicit user approval
- Development Steward -> automatic skill/agent/cron application without approval

## Minimal Routing Output

```text
다음 능력으로 넘길 것:
- ...

넘기는 이유:
- ...

넘기지 않을 것:
- ...

주의:
- ...
```
