---
name: beai-doctor
description: Use when the user says "비아이 닥터", "BEAI Doctor", "beai doctor", asks to diagnose or repair BEAI Layer/OpenClaw after installation, or reports degraded Telegram/Gateway/plugin/skill/runtime behavior; perform diagnosis, low-risk repair, approval-gated repair planning, and post-repair verification. Do not use for ordinary business advice, general AX orientation, or unrelated computer cleanup.
---

# BEAI Doctor

## Role

Keep BEAI Layer and OpenClaw usable after installation by diagnosing real runtime state, repairing low-risk issues, separating approval-required changes, and verifying the system after repair.

This is not a conversation-only skill. Use the bundled script when the environment allows it.

Primary user trigger:

- `비아이 닥터`
- `BEAI Doctor`
- `beai doctor`

## Use When

- The user says BEAI Layer or OpenClaw became slow, stuck, repetitive, disconnected, or unreliable.
- Telegram sends or receives poorly after BEAI installation.
- Telegram receives the first message but the second message is delayed, queued, or feels silent.
- Telegram polling stalls after boot, network change, sleep/wake, or unstable internet.
- Gateway appears healthy but Telegram stays silent after the computer wakes or returns online.
- OpenClaw works in Dashboard but Telegram feels dead, delayed, or only recovers after Gateway restart.
- The user wants laptop wake recovery so Telegram works after the computer has been closed for a day or two.
- The dashboard shows `message.received`, `queued`, or `run_started` but the user has not yet seen a Telegram reply.
- Gateway restart, plugin loading, hook readiness, skill readiness, task pressure, or session behavior needs diagnosis.
- A user asks for repair, recovery, health check, post-install check, or "오류 없이 쾌적하게" use.
- Installer, runtime, smoke test, or repair standard needs to be applied after installation.

## Do Not Use When

- The user only needs AI-native orientation. Use `ai-native-journey-guide`.
- The user wants to design a new automation. Use `automation-readiness-check` or `ax-first-automation-planner`.
- The user wants general computer/file cleanup. Use `workspace-clarity-steward`.
- The issue requires OpenClaw core source modification. Report it as out of BEAI Doctor repair scope.

## Core Distinction

BEAI Doctor is not a replacement for OpenClaw Doctor.

OpenClaw Doctor owns OpenClaw's core health:

- OpenClaw install integrity
- core config schema and migrations
- daemon/service policy
- gateway daemon health
- channel provider primitives
- auth, device pairing, security, sandbox, disk, and workspace basics

BEAI Doctor owns BEAI-on-OpenClaw operating reliability:

- BEAI Runtime plugin visibility, version, load state, hooks, and overlay symptoms
- BEAI installer/helper/package integrity
- BEAI skill pack readiness and routing health
- post-install Telegram/Gateway symptoms as experienced by BEAI users
- repeated response, approval-loop, partial-complete, message delivery, and session hygiene symptoms
- repair planning that preserves OpenClaw core ownership
- Telegram channel usability as experienced by the user, including channel status, transport freshness, inbound/outbound recency, and roundtrip evidence

When OpenClaw Doctor finds a core issue, BEAI Doctor should report it as an upstream/core finding and avoid pretending it is a BEAI repair. When BEAI Doctor finds a BEAI runtime/package/skill issue, it should not ask OpenClaw Doctor to solve the BEAI layer.

The two tools may use some of the same probes, but they must not compete for authority.

Separate every issue into one of four states:

- `healthy`: no repair needed
- `auto_repairable`: low-risk local correction can be done now
- `approval_required`: repair is possible but affects live service, config, runtime, channels, or package state
- `blocked`: external state, missing credential, unknown OpenClaw failure, or user approval is required before progress

Never collapse `approval_required` into `auto_repairable`.

## Operational Reliability Model

Do not collapse "exists" into "usable."

For BEAI Runtime, OpenClaw tools, MCP endpoints, skills, plugins, agents, cron, Telegram/channel paths, and installer helpers, separate these stages:

- `configured`: config/env/manifest/package contains the item
- `registered`: OpenClaw/runtime lists or registers the item
- `route visible`: source path, endpoint, session target, skill route, or channel target is visible
- `permission allowed`: token, allowlist, device scope, approval, sandbox, or hook policy allows use
- `callable`: dry-run/read-only probe can reach the item
- `call succeeded`: an actual call ran successfully
- `output verified`: result reached the intended user-facing destination and was checked

If only `configured` or `registered` is true, say "설정/등록은 보이지만 실제 사용 가능 여부는 아직 검증되지 않았습니다."

If `call succeeded` is true but `output verified` is false, do not say complete. Say "호출은 성공했지만 사용자에게 필요한 결과 도착은 아직 확인되지 않았습니다."

BEAI Doctor reports this as `operationalReliability`.

For Telegram, do not treat `Gateway reachable`, `gateway RPC healthy`, or `running/connected` alone as full health. In laptop or non-always-on use, sleep/wake and network return can leave Gateway healthy while Telegram polling or channel transport is stale.

The stronger Telegram channel standard is:

- Gateway RPC reachable
- Telegram channel enabled/configured/running/connected
- recent transport activity
- recent inbound or outbound activity when the user is actively using Telegram
- no repeated polling stall or getUpdates timeout pattern
- actual roundtrip evidence when the user reports Telegram silence

If Gateway is healthy but Telegram activity is stale, classify it as channel transport recovery, not as full Gateway failure and not as BEAI Runtime failure by default.

## Route Boundary Checks

When diagnosing tool/MCP/Telegram/plugin issues, separate route boundaries:

- internal-only route
- external route
- load balancer/proxy route
- local loopback route
- Telegram numeric chat id canonical route
- Telegram `@username` label/alias route
- MCP endpoint visibility
- tool route visible vs tool callable

For example, if an MCP server exists internally but the external endpoint returns 404, classify it as route visibility/callability mismatch, not as "tool missing."

For Telegram direct, numeric chat id is canonical; `@username` is label metadata unless OpenClaw explicitly proves it is callable.

## Failure Closure

Every failed or partial repair must close with a user-facing state:

- `failed`: execution failed
- `partial`: only part completed
- `cancelled`: cancelled
- `cleanup_pending`: cleanup still needed
- `cleanup_complete`: cleanup complete
- `retry_allowed`: retry is safe
- `retry_blocked`: retry should not happen until repair/approval
- `approval_required`: user approval needed
- `blocked`: external state or missing permission blocks progress

Do not end with only "failed." State what changed, what did not change, whether cleanup is complete, and whether retry is allowed.

## Workflow

1. Preserve the user's symptom in plain language.
2. Run diagnosis when possible:
   - `node tools/beai-doctor.js --mode=check --symptom="사용자 증상"`
   - If the user provides a report/log file, add `--log-file="/path/to/report-or-log.txt"`.
   - Use `--deep` only when Telegram/Gateway/session/log instability is suspected.
   - Use `--include-openclaw-doctor` only when core OpenClaw health, install policy, config, auth, or daemon integrity may be involved.
3. Identify affected layer:
   - OpenClaw gateway/service
   - Telegram/channel transport
   - BEAI Runtime/plugin/hooks
   - skills/workspace
   - tasks/approvals/session state
   - recent Gateway/Telegram/log instability patterns
   - retained lost tasks, stale install metadata, and Gateway security warnings
   - installer/package integrity
   - Telegram direct reply vs internal session handoff confusion
   - `sessions.resolve ... No session found: current`
   - `incomplete turn detected`
   - `lane wait exceeded`
   - `stalled session`, `active_work_without_progress`, `activeWorkKind=model_call`, `abort_embedded_run`
   - numeric Telegram chat id and `@username` direct session split:
     - `agent:main:telegram:direct:<numeric>`
     - `agent:main:telegram:direct:@username`
     - `Telegram recipient @... could not be resolved`
     - `getChat failed (400: Bad Request: chat not found)`
   - `sourceTool=sessions_send` or `[Inter-session message]`
   - Gateway token mismatch
   - `provider: openclaw`, `model: gateway-injected`, `usage: 0`
   - `reply_payload_sending` payload rewrite
   - `telegram ux state guide added`
   - `gateway_restart_recovery` or `internal_progress_surface`
   - `before_agent_reply install guide override`
   - Telegram direct second-turn stale recovery surfaces:
     - `before_agent_reply`
     - `recovery summary surface returned`
     - `recovery escalation surface returned`
     - `beai-recovery-summary`
   - `beai-recovery-escalation`
   - `agent:main:telegram:direct`
   - boot/network recovery Telegram transport signals:
     - `Polling stall detected`
     - `no completed getUpdates`
     - `fetch failed`
     - `connect ENETUNREACH`
     - `deleteWebhook failed`
   - Gateway healthy but Telegram channel stale:
     - `openclaw channels status`
     - `running`
     - `connected`
     - `in:<old> ago`
     - `out:<old> ago`
     - `transport:<old> ago`
     - `mode:polling`
   - overly aggressive polling watchdog settings:
     - `timeoutSeconds`
     - `pollingStallThresholdMs`
     - stall threshold too close to long polling timeout
   - processing-but-not-failed delivery state:
     - `message.received`
     - `queued`
     - `queued_behind_active_work`
     - `run_started`
     - missing or delayed `delivery.completed`
     - later `telegram outbound send ok`
   - large or overloaded Telegram direct sessions:
     - `long-running session`
     - large token count such as 80k+ tokens
     - diagnostic logs/tools accumulated in the normal Telegram direct session
     - `activeWorkKind=model_call`
   - zip attachment plus install/check intent being downgraded into memory candidate or skill-use candidate
   - runtime loaded version, OpenClaw recorded version, install sourcePath, package version mismatch
   - `operator.write` scope missing during approved Telegram send verification
   - `plugins.allow is empty`
   - duplicate BEAI runtime load paths
   - repeated canned surface signatures
   - actual model output bypass indicators
4. Summarize production incidents, not only raw findings:
   - repeated response loop
   - Telegram second-turn drop
   - plugin load hygiene
   - operational reliability stage mismatch
   - failure/cleanup closure state
   - Telegram operational delay vs true send failure
5. Run repair planning:
   - `node tools/beai-doctor.js --mode=repair-plan --symptom="사용자 증상"`
   - Add `--deep` when the first report is healthy but the user still reports transport, session, or repeated-response symptoms.
6. Auto-repair only low-risk items:
   - `node tools/beai-doctor.js --mode=auto-repair`
7. Ask approval before live or persistent changes.
8. Verify after any repair:
   - `node tools/beai-doctor.js --mode=verify`
9. Report `healthy`, `repaired`, `partially_repaired`, `approval_required`, or `blocked`.

## Wake Recovery Guard

For non-always-on laptop use, BEAI Doctor can run a lightweight wake guard before the user experiences Telegram silence.

Read-only check:

```bash
node tools/beai-doctor.js --mode=wake-guard --json
```

Self-heal check:

```bash
node tools/beai-doctor.js --mode=wake-guard --self-heal --cooldown-ms=1200000 --json
```

Install as a macOS user LaunchAgent:

```bash
node tools/install-wake-guard-launchagent.js --interval-seconds=300 --cooldown-ms=1200000
```

Check the LaunchAgent:

```bash
node tools/install-wake-guard-launchagent.js --status
```

Remove the LaunchAgent:

```bash
node tools/install-wake-guard-launchagent.js --uninstall
```

Wake guard behavior:

- Runs `openclaw channels status --channel telegram --probe`.
- Treats Gateway health and Telegram usability as separate.
- If Telegram is healthy, does nothing.
- If Telegram transport is stale or channel probe fails, and `--self-heal` is not set, returns approval/recovery guidance.
- If `--self-heal` is set and cooldown is not active, runs `openclaw gateway restart --safe --wait 30s --json`.
- Re-probes Telegram after restart.
- Writes cooldown state to `~/.openclaw/reports/beai-doctor/wake-guard-state.json`.
- When installed as a LaunchAgent, runs at login/load and every 5 minutes while the Mac is awake.
- This is intended for laptop users who close the lid, change networks, or return online after a long idle period.

Safety:

- It does not edit Telegram config.
- It does not change tokens.
- It does not delete sessions, memory, cron, agents, or transcripts.
- It does not use forced restart.
- It uses OpenClaw `--safe` restart so active work can drain when OpenClaw supports it.
- It applies cooldown to avoid restart loops.
- It does not restart Gateway when OpenClaw CLI cannot be read because of local permission/sandbox limits.

## Auto-Repair Allowed

- Create missing local report directories under the current package/workspace.
- Fix executable bit on BEAI installer helper scripts when they already exist.
- Produce repair reports.
- Re-run read-only doctor/status commands.
- Recommend clearing stale UI/session state without deleting transcripts.
- Re-run BEAI installer verification in read-only mode when the installer exists.
- Read a user-provided report/log file with `--log-file` for classification.

## Approval Required

Ask before:

- Restarting Gateway or OpenClaw services.
- Restarting Telegram/channel providers.
- Replacing or reinstalling BEAI Runtime.
- Cleaning stale BEAI install metadata such as recorded-version mismatch.
- Cleaning retained lost tasks.
- Changing reverse proxy or trusted proxy security settings.
- Editing `openclaw.json`, channel config, tokens, secrets, plugins, hooks, agents, cron, skills, memory, or transcripts.
- Running rollback.
- Killing processes.
- Sending Telegram test messages from the user's identity.
- Moving or deleting files.
- Running OpenClaw Doctor repair modes or any command that changes OpenClaw core/config/service state.

When asking approval, explain it in user language:

- What the symptom means in plain Korean.
- What will be changed.
- Why it cannot be done silently.
- What can go wrong if done carelessly.
- How success will be verified afterward.

Do not say only "approval required." The user must understand the reason well enough to decide.

## Boundaries

- Do not modify OpenClaw core.
- Do not modify Telegram settings silently.
- Do not create cron, agent, memory, or external sends.
- Do not delete sessions/transcripts/logs to "fix" behavior.
- Do not expose tokens or secret values.
- Do not claim repair unless post-repair verification passed.
- Do not promise to fix every OpenClaw/core/network/provider defect automatically. Classify what is repairable, approval-gated, or outside BEAI Doctor scope.
- Do not use OpenClaw Doctor output as a reason to perform BEAI repair unless the failing layer is actually BEAI-owned.

## Output Guidance

Use compact Korean:

- 지금 보이는 문제
- 확인한 계층
- OpenClaw Doctor로 넘길 것
- 자동 수리한 것
- 승인 필요한 것
- 승인 필요한 이유
- 아직 막힌 것
- 다음 확인 하나

If nothing is broken, say so plainly and name the evidence.

When the user is frustrated, do not output generic policy language. Say what is happening, what was checked, what can be repaired safely, and what requires approval.

For approval-required items, translate internal codes:

- `telegram-direct-routing-confusion`: 텔레그램 답변과 내부 세션 전달이 섞였을 가능성
- `telegram-direct-sessions-current-failed`: 현재 텔레그램 세션을 찾지 못한 흔적
- `telegram-direct-lane-wait-exceeded`: 텔레그램 응답 대기 줄이 막힌 흔적
- `telegram-direct-incomplete-turn`: 이전 응답 처리가 끝나지 않은 흔적
- `telegram-direct-alias-routing-failure`: 같은 텔레그램 사용자가 숫자 ID 세션과 @username 세션으로 갈라진 흔적
- `telegram-direct-stuck-model-call`: 텔레그램 direct 세션의 모델 호출이 오래 멈춘 흔적
- `telegram-polling-threshold-too-low`: 텔레그램 polling 멈춤 감지 기준이 timeout에 비해 너무 예민한 상태
- `telegram-boot-network-recovery-window`: 부팅/네트워크 복귀 직후 Telegram 연결이 불안정했던 흔적
- `telegram-delivery-pending-not-failed`: 메시지는 처리 중이며 아직 전송 실패로 볼 수 없는 상태
- `telegram-direct-session-bloat-risk`: Telegram direct 세션이 너무 커져 응답 지연을 만들 수 있는 상태
- `telegram-diagnostic-in-operational-session-risk`: 평소 운영 대화창에서 진단 로그/도구 호출이 쌓이는 상태
- `beai-continuity-residue-risk`: 비활성화된 BEAI continuity/working-memory 잔여물이 영향을 줄 수 있는 상태
- `gateway-token-mismatch`: Gateway 인증 토큰 불일치
- `runtime-version-metadata-stale`: BEAI 실제 버전과 OpenClaw 기록 버전 불일치
- `beai-gateway-injected-response-loop`: 실제 모델 답변이 Gateway/BEAI 삽입 안내문으로 대체됐을 가능성
- `beai-reply-payload-rewrite-hook-active`: BEAI reply payload hook이 최종 답변에 개입한 흔적
- `beai-ux-state-guide-replace-risk`: 복구 상태 안내문이 원래 답변을 대체했을 위험
- `beai-before-agent-reply-override-active`: 모델 답변 전 단계에서 설치/상태 안내가 끼어든 흔적
- `beai-telegram-direct-recovery-surface-stale-plan`: 텔레그램 direct 두 번째 턴을 BEAI 복구 안내가 가로챈 흔적
- `beai-install-intent-lost`: 첨부 설치/점검 요청이 실제 설치 흐름으로 이어지지 않은 흔적
- `operator-write-scope-missing`: 로컬 CLI 기기에 메시지 전송 권한이 부족했던 흔적
- `plugins-allow-empty-autoload-risk`: 비공식 플러그인 자동 로드 가능성
- `beai-canned-response-loop-signature`: 같은 안내문이 반복된 직접 흔적
- `beai-duplicate-runtime-load-risk`: BEAI Runtime 중복 로드 위험

## Production Incident Summaries

BEAI Doctor must not stop at individual log findings. For real users, group the findings into incident summaries:

- `repeatedResponseLoop`
  - Check `gateway-injected`, `usage: 0`, `reply_payload_sending`, `before_agent_reply`, `현재 상태 안내입니다`, repeated approval/hold surfaces, and BEAI hook rewrite signals.
  - Explain whether the likely layer is BEAI Runtime reply hooks, session state, or approval surface.
  - Recommend hook policy/runtime replacement/plugin allowlist/session hygiene only with approval when needed.
- `telegramSecondTurnDrop`
  - Check `sessions.resolve current`, `lane wait exceeded`, `incomplete turn detected`, stuck model calls, numeric-id/username alias split, Telegram polling stall, token mismatch, internal session handoff, and stale BEAI recovery surfaces in `before_agent_reply`.
  - Explain whether the likely layer is OpenClaw session/channel lane, Telegram direct canonicalization, Telegram transport, mixed BEAI delivery contract, or BEAI Runtime stale-plan guard.
  - Do not restart Gateway as first action.
- `telegramOperationalDelay`
  - Check boot/network recovery, Telegram long polling timeout, polling stall threshold, message received/queued/run_started timeline, missing or delayed delivery.completed, session token growth, and queued_behind_active_work.
  - Explain whether the user is seeing a true send failure or a processing delay.
  - If `received -> queued -> run_started` exists, do not call it delivery failure until timeout or error evidence exists.
  - Recommend separating diagnostic sessions from ordinary Telegram operating chats when logs/tools are making the direct session too large.
  - Do not force a new user session as the default user burden. Prefer internal diagnosis, compact handoff proposal, or approval-based session hygiene.
- `telegramRoutingContract`
  - Check whether one Telegram user has both numeric chat-id and `@username` direct sessions.
  - Treat numeric chat id as the canonical key and username as label metadata.
  - Do not delete or merge session entries without backup and approval.
- `installIntentIntegrity`
  - Check whether a zip attachment plus install/check request was preserved as install workflow.
  - Check loaded runtime version, recorded version, sourcePath, and package version together.
  - Check whether operator.write scope blocked approved Telegram send verification.
  - Do not expand device scopes or edit install metadata without approval.
- `pluginLoadHygiene`
  - Check `plugins.allow`, duplicate BEAI paths, stale recorded version, and old runtime autoload risk.
  - Treat config/metadata cleanup as approval-required.

## Korean User-Facing Names

- Applied skill display: `beai-doctor (비아이 닥터)`
- Applied basis examples:
  - `BEAI 런타임 점검 · OpenClaw 상태 분리 · 승인형 수리 계획`
  - `텔레그램 송수신 진단 · 게이트웨이 상태 확인 · 세션 위생 점검`
  - `설치 후 검증 · 플러그인/훅 확인 · 저위험 자동 수리`

## Related Skills

- Use `beai-development-steward` for development, package, release, or installer work.
- Use `beai-release-verifier` when verifying a release artifact specifically.
- Use `workspace-clarity-steward` for general computer/workspace cleanup.
- Use `ai-native-journey-guide` when the user needs orientation rather than repair.

<!-- Copyright (c) 2026 BEAI Project. See ../../NOTICE.md and ../../LICENSE-ko.md. -->
