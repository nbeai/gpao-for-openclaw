# BEAI Runtime v0.6.20

Dist-only runtime package for the BEAI Package for OpenClaw v0.2.4 public staging release candidate.

This package is meant to be loaded by OpenClaw as a plugin.

It is not a source development package.

Do not run build or test commands inside this local live candidate package. Source build and tests were performed in the development workspace before this folder was refreshed.

## Runtime Entry

```text
dist/index.js
```

## Included Runtime Core

This package includes the shared BEAI runtime core required by `dist/runtime-core.js`:

```text
runtime/beai-runtime-lib.cjs
```

The package must not depend on a separate BEAI development workspace at install time.

## OpenClaw Plugin Manifest

```text
openclaw.plugin.json
```

## Included Guide

```text
RELEASE-NOTES-v0.6.20-ko.md
```

This candidate includes only the runtime files needed by OpenClaw and the v0.6.20 release note.

The final verification ledger remains in the development workspace:

```text
capability-pack/docs/03-verification/generated/beai-doctor-package-check.md
```

## Required OpenClaw Hook Permission

BEAI Runtime needs conversation-access hook permission through the OpenClaw plugin entry:

```json
{
  "plugins": {
    "entries": {
      "beai-runtime": {
        "enabled": true,
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

`hooks.allowConversationAccess` is an OpenClaw plugin entry permission. It is not a BEAI pluginConfig value.

After installation, verify with:

```text
openclaw plugins doctor
openclaw hooks
```

## What It Does

- Preserves the latest real user request.
- Separates confirmed facts, assumptions, and unknowns.
- Separates confirmed facts, observed signals, runtime inferences, assumptions, and verification needs through the Reality Signal Engine observer.
- Carries only next-judgment criteria, current position, and next action through the Continuity Judgment observer.
- Carries forward the v0.4.8 Judgment Flow Stabilizer, Evidence Closure, Decision Handle Surface, Conversational Rhythm Guard, and Conversation Quality Guard as part of the v0.5.1 runtime baseline.
- Keeps v0.5.1 Classification Fail-soft so weak words such as family, repetition, approval, or revenue do not narrow the conversation unless context signals support it.
- Keeps v0.5.1 Messenger Reflection Guard so raw user utterances are not appended back as sticky `기준은 이것입니다:` criteria.
- Adds v0.6.0 Workflow State Ledger so repeated work can be tracked as a workflow candidate without treating it as active automation.
- Separates Workflow Card, Manual-run Evidence Ledger, Promotion Gate, and Automation Registry.
- Keeps cron readiness false by default until manual-run evidence, input stability, failure policy, stop method, and explicit user approval are all checked.
- Adds v0.6.1 Response Inertia Guard so long conversations do not reuse the previous answer's structure, question style, or conclusion frame unless the user explicitly asks for the same format.
- Creates `response-inertia-profile.json` with the current turn relation, reuse risk, and required response shift.
- Adds v0.6.2 Judgment Sharpness so confirmed evidence is stated clearly while unverified completion, automation, release, and production-grade claims stay bounded.
- Creates `judgment-sharpness-profile.json` with claim strength, uncertainty action, and completion-claim guidance.
- Adds v0.6.3 Surface Intervention Contract so state hygiene, recovery, delegation, capability translation, install, approval, and execution-review surfaces cannot hard-rewrite the user-facing reply unless the current user intent is explicit and no stronger current-turn intent is present.
- Keeps active runtime outages, install/upgrade requests, artifact requests, vague frustration/action follow-ups, and conceptual discussion from being overwritten by generic canned surfaces.
- Adds v0.6.7 Conversation Scene Continuity so short follow-up commands can inherit the shared conversation scene, commitments, and pending next action instead of being handled as isolated current-turn text.
- Adds v0.6.8 Input-Level Companioning so unclear first-use, pain-signal, goal-seeking, guided-action, concrete execution, and expert-directive inputs receive different response posture without judging the user's ability level.
- Recommends relevant skill families such as AI-native journey guidance, owner intake, AX workflow design, automation readiness, and BEAI Doctor as guide-only candidates without invoking them automatically.
- Adds v0.6.9 Human-Centered Companioning signals for journey stage, cognitive load, choice-ownership risk, trust calibration, possible-world explanation, control boundaries, and recovery needs.
- Adds v0.6.10 Scenario Regression Hardening so unverified external/public/memory/release/medical claims are softened, high choice-ownership turns do not allow over-decisive wording, short customer-facing artifacts stay bounded, follow-up artifact requests beat scene inertia, internal runtime labels are removed more broadly, and operational debt is routed away from new automation.
- Adds v0.6.11 Workflow Routing Hardening so scheduled work defaults to `cron_candidate` / `not_cron_ready`, external writes force approval boundaries, skill/agent lifecycle requests route as candidates, vague app requests become product/development translation rather than automation, and rollback/memory/issue-ledger writes preserve persistent-state boundaries.
- Adds v0.6.12 Operating Contract Closure so read-only status/list checks do not become mutation work, explicit "do not create skill/agent/automation" wording suppresses candidate routing, retry/watchdog/destructive/core/memory requests get approval boundaries, and Notion/Telegram read-write behavior is separated.
- Adds v0.6.13 Reply Hook Boundary Guard so `before_agent_reply` hard rewrites require a run-bound plan and cannot consume pre-model user input observed as `runId:null` or session-sourced hook calls.
- Adds v0.6.17 Telegram Delivery Ledger so generated Telegram replies, send attempts, delivery confirmations, messageId absence, restart pending-scan requirements, and resend idempotency are tracked separately from internal final-answer generation.
- Adds v0.6.19 action-semantics hardening so diagnosis, report, mitigation, repair, verification, and prevention stay separated from user-visible completion claims.
- Adds v0.6.20 Friction-Aware Gate so drafts, thinking, read-only checks, and candidate work stay fast by default; quiet checks avoid interrupting the user; real risk transitions require approval; and post-action verification prevents completion overclaim.
- Requires recovery claims to carry failure-path observation, cause, changed path, and same-condition re-verification evidence.
- Guards user-facing replies from internal labels and over-strong completion claims.
- Separates memory candidates, agreement assets, project state, and discarded context.
- Carries session continuity through BEAI-owned state files.
- Records live hook evidence under `state/beai/live-evidence.jsonl`.
- Helps narrow recovery families such as Telegram, gateway, model auth, plugin, memory, session, and automation problems.
- Records project state, memory relevance, skill-routing observer reports, and a v0.4 operating judgment report without promoting memories or invoking skills automatically.
- Renders delegation questions as candidate-only guidance instead of automatically invoking skills, agents, workflows, or cron.
- Separates state hygiene issues such as task history, transcript residue, tool-failure residue, and approval residue from active runtime failures.
- Explains approval boundaries with `allow-once` as the safe default and does not recommend approval bypass or automatic approval.
- Registers synchronous transcript-write hooks synchronously, so approval-message bursts do not create BEAI hook Promise warnings.
- Treats same-surface `message` replies as low-risk observations while keeping explicit external sends high-risk.
- Keeps `before_tool_call` unregistered by default because registering that hook can promote Codex app-server command approval policy.
- Separates Codex app-server command approval cards from normal approval waits.
- Isolates leaked gateway restart recovery text instead of treating it as a new user request.

## BEAI-Owned Runtime State

BEAI Runtime writes only BEAI-owned state files under:

```text
state/beai/
```

Examples:

```text
live-evidence.jsonl
telegram-delivery-ledger.jsonl
session-continuity.json
conversation-arc.json
new-session-context-pack.json
memory-candidates.json
agreement-assets.json
project-state.json
workflow-state-ledger.json
workflow-card.json
manual-run-evidence-ledger.json
promotion-gate.json
automation-registry.json
response-inertia-profile.json
judgment-sharpness-profile.json
discarded-context.json
companion-profile.json
operating-judgment-report.json
```

Memory candidates are not accepted memories. Agreement assets are not promoted automatically.

## Package Status

```text
BEAI Runtime v0.6.20
Public Staging Release Candidate
```

This is a runtime release candidate for OpenClaw users who understand plugin installation, verification, and rollback.

It is not a stable production support promise or a fully deterministic one-click installer until the ClawHub/public release path and clean-environment verification are complete.

## Development Workspace Evidence

The source workspace was checked before packaging:

```text
npm run build: pass
npm test: pass
node --check dist/index.js: pass
node --check dist/runtime-core.js: pass
node --check runtime/beai-runtime-lib.cjs: pass
npm audit --omit=dev: 0 vulnerabilities
openclaw plugins doctor: pass
openclaw hooks: 6/6 ready
beai-flow-regression-gate: 27/27 pass
beai-doctor-package-check: package_status ready
beai-user-scenario-audit: pass after package hardening
beai-organic-flow-audit: pass
OpenClaw live plugin: verify after live sync
Gateway evidence: verify after live sync
Telegram evidence: verify after live sync
Telegram live roundtrip: verify after live sync
```

## Package Integrity Evidence

This local live candidate folder was checked after refresh:

```text
candidate node --check dist/index.js: pass
candidate node --check dist/runtime-core.js: pass
candidate node --check runtime/beai-runtime-lib.cjs: pass
candidate dist/runtime-core.js import: pass
source dist and candidate dist: identical
```

## Target Environment Verification Required

The target OpenClaw environment must still verify:

```text
openclaw plugins doctor
openclaw hooks
Telegram live roundtrip if Telegram status is claimed
```

Known local environment residue at verification time:

```text
OpenClaw task history still showed 3 historical issues from interrupted/recovery runs.
Those were not queued or running tasks, and should not be interpreted as current BEAI runtime pressure.
```

Dependency audit note:

```text
npm audit --omit=dev: 0 vulnerabilities after the development workspace moved to openclaw@2026.6.10.
The remaining npm audit finding is dev-only esbuild via Vitest/Vite and is not included in this dist-only package.
```
