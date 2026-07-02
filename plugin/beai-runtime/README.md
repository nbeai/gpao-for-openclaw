# BEAI Runtime

OpenClaw runtime plugin for BEAI Layer v0.6.17.

BEAI Runtime helps OpenClaw preserve the current user request, separate evidence from assumptions, keep memory candidates scoped, and carry session continuity without dumping old conversations.

It must run as an OpenClaw plugin. It must not modify OpenClaw core files.

## Build

This section applies to the source development workspace only.

The v0.6.17 public staging runtime candidate folder is a dist-only runtime package. It does not include `src/`, tests, or `tsconfig.json`, so do not run `npm run build` or `npm test` inside that candidate folder.

```bash
npm install
npm run build
npm test
```

## Install For Local Development

```bash
openclaw plugins install --link /absolute/path/to/beai-layer/plugin/beai-runtime
openclaw plugins enable beai-runtime
```

## Install From ClawHub

When the ClawHub release is visible for installation:

```bash
openclaw plugins install clawhub:@nbeai/beai-runtime
openclaw plugins enable beai-runtime
```

The package name is `@nbeai/beai-runtime`. This is the BEAI Runtime plugin install surface, not the full capability-pack ZIP distribution.

The live OpenClaw config must allow BEAI Runtime to use conversation-access hooks:

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

`hooks.allowConversationAccess` is an OpenClaw plugin entry hook-permission setting. It is not a BEAI pluginConfig value. After setting it, verify with:

```bash
openclaw plugins doctor
openclaw hooks
```

Restart the gateway after changing plugin config.

## What it does now

- Builds a `CurrentTurnPacket` from the latest real user request.
- Separates confirmed signals, unknowns, assumptions, and verification needs.
- Adds a Reality Signal Engine observer that separates confirmed facts, observed signals, runtime inferences, assumptions, and verification needs.
- Adds a Continuity Judgment observer that carries only next-judgment criteria, current position, and next action across long conversations.
- Carries forward the v0.4.8 Judgment Flow Stabilizer, Evidence Closure, Decision Handle Surface, Conversational Rhythm Guard, and Conversation Quality Guard as part of the v0.5.1 runtime baseline.
- Adds v0.5.1 Classification Fail-soft so weak words such as family, repetition, approval, or revenue do not narrow the conversation unless context signals support it.
- Adds v0.5.1 Messenger Reflection Guard so raw user utterances are not appended back as sticky `기준은 이것입니다:` criteria.
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
- Adds v0.6.17 Telegram Speed Reliability so Telegram-driven execution opens a quick first-status contract, records runtime phase timing, and keeps the v0.6.16 delivery/progress closure rules.
- Guards user-facing replies from internal labels and over-strong completion claims.
- Translates OpenClaw capabilities into plain user language.
- Prioritizes recovery/diagnosis when capability words appear inside failure reports.
- Keeps `before_tool_call` unregistered by default; tool-risk observation is explicit opt-in.
- Separates Codex app-server command approvals from normal approval waits.
- Isolates leaked gateway restart recovery text instead of treating it as a user request.
- Writes BEAI-owned state assets under `state/beai/`.
- Writes live hook evidence to `state/beai/live-evidence.jsonl`.
- Preserves session continuity through `session-continuity.json`, `conversation-arc.json`, and `new-session-context-pack.json`.
- Writes a compact v0.4 observer-only operating judgment report to `operating-judgment-report.json`.
- Classifies delegation, risk boundary, state hygiene, Telegram confidence, claim label, and rollback implication without invoking skills, agents, workflows, cron, or tool blocking.
- Renders delegation questions as candidate-only guidance instead of automatically invoking skills, agents, workflows, or cron.
- Separates state hygiene issues such as task history, transcript residue, tool-failure residue, and approval residue from active runtime failures.
- Explains approval boundaries with `allow-once` as the safe default and does not recommend approval bypass or automatic approval.

## Runtime State Files

BEAI Runtime owns only these state files:

```text
state/beai/live-evidence.jsonl
state/beai/session-continuity.json
state/beai/conversation-arc.json
state/beai/new-session-context-pack.json
state/beai/memory-candidates.json
state/beai/agreement-assets.json
state/beai/project-state.json
state/beai/discarded-context.json
state/beai/operating-judgment-report.json
state/beai/workflow-state-ledger.json
state/beai/workflow-card.json
state/beai/manual-run-evidence-ledger.json
state/beai/promotion-gate.json
state/beai/automation-registry.json
state/beai/response-inertia-profile.json
state/beai/judgment-sharpness-profile.json
state/beai/conversation-scene-continuity.json
state/beai/input-level-companion-profile.json
state/beai/companion-profile.json
state/beai/telegram-delivery-ledger.jsonl
```

Memory candidates are not accepted memories. Agreement assets are not promoted automatically.
Workflow cards are not active automations. Automation Registry is reserved for verified automations only.

## Verification

For the source development workspace, run:

```bash
npm run build
npm test
openclaw plugins doctor
openclaw hooks
openclaw status --deep
```

Current pre-package baseline:

- Build: pass
- Runtime syntax test: pass
- Audit: 0 vulnerabilities with `npm audit --omit=dev`
- OpenClaw plugin doctor: pass
- OpenClaw hooks: 6/6 ready
- Gateway evidence: gateway reachable
- Telegram evidence: configured / gateway-channel reachable
- Telegram live roundtrip: not verified in the 2026-07-02 package audits
- Task pressure: 0 queued / 0 running / 3 historical issues

Current package audit baseline from 2026-07-02:

- runtime build: pass
- runtime syntax test: pass
- production dependency audit: 0 vulnerabilities
- flow regression gate: 27/27 pass
- doctor package check: `package_status=ready`
- user scenario audit: pass after package hardening
- organic flow audit: pass
- package verify: pass after representative package verify command and developer-owned fixtures were added

For the local live candidate folder, verification means OpenClaw loads `dist/index.js`, the hook permission is present, `openclaw plugins doctor` passes, and `openclaw hooks` reports the expected hooks as ready. The v0.6.17 public staging runtime candidate package is generated separately under `packages/`.

Final local-live verification ledger for the previous v0.6.13 candidate:

```text
docs/10-distribution/VERIFICATION-LEDGER-v0.6.13-ko.md
```

v0.6.17 is a speed-reliability patch on top of v0.6.16. It keeps reply hook boundary guards intact, preserves post-send evidence split so BEAI Runtime does not treat internal final text or `reply_payload_sending` as Telegram completion, records visible progress gaps for long-running Telegram-driven execution work, opens a quick first-status contract before deep work, and records runtime phase timing for planning/tool/finalize/delivery separation. It does not create skills, agents, cron jobs, apps, external writes, memory writes, message resends, progress heartbeat sends, or issue-ledger records by itself.

Session handoff and workspace hygiene notes:

```text
docs/03-product-plan/BEAI-layer-v0.4.0-session-handoff.md
docs/03-product-plan/BEAI-layer-v0.4.0-git-workspace-hygiene.md
```
