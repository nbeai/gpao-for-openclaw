# GPAO for OpenClaw Codex Parity Reinforcement

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

## Purpose

This reinforcement makes GPAO for OpenClaw closer to GPAO for Codex where it matters to the user:

- self-growth does not stop at storage; it creates reviewable upgrade proposals and evidence gates.
- new-session or omitted-object turns must recover the likely target before answering.
- Context Mesh is resolved at every OpenClaw prompt build by default, then becomes a hard pre-answer comparison gate when must-read local evidence exists.
- Context Mesh turn-start retrieval must stay lightweight: every-turn preflight, short timeout, brief in-process cache, fail-open behavior, and no extra local tool requirement when must-read evidence is already loaded. Context continuity must improve without making OpenClaw feel slow.
- OpenClaw active-flow runtime state is treated as a concrete target anchor for omitted-object new-session questions. Broad Context Mesh background can support the answer, but it must not override the live workflow target.
- OpenClaw prompt build now constructs a T-cell task packet before answer generation. The packet names the center axis, active target, semantic role, source kind, color state, evidence level, allowed use, conflict state, and answer-anchor priority for the current turn.
- Recent Telegram assistant replies become high-priority T-cells. This prevents a fresh `/new` follow-up from falling back to older package/runtime memories when the user is clearly continuing the immediately previous Telegram topic.
- Context Mesh v0.3 ideas are adapted to OpenClaw as a lightweight live bridge: current request first, recent active-flow second, must-read Context Mesh evidence third, stale package/runtime memory only as bounded support.
- package verification stays lightweight and read-only, but it checks the same product promises every time.
- Telegram/Gateway/live operations remain smooth by separating package checks from live sends, restarts, cron mutation, and durable memory promotion.

## Runtime Rules

1. Current user request always wins.
2. Previous context is comparison evidence, not a forced answer.
3. If a new session or ambiguous follow-up says "continue", "proceed", or "what test now", the runtime must name the recovered target before giving execution advice.
4. OpenClaw prompt build must run Context Mesh turn-start resolve by default, not only when explicit GPAO keywords appear.
5. If Context Mesh returns must-read hits, the model must compare loaded evidence before direct answer.
6. Context Mesh preflight must use a fast-path budget, cache repeated lookups briefly, and fail open if the retrieval layer is unavailable.
7. Loaded Context Mesh evidence is enough for the pre-answer comparison gate; it must not force another memory/search tool call unless the current user request independently needs a tool.
8. If the user asks an omitted-target question after a session boundary, GPAO Runtime must recover the concrete active-flow target before generic advice.
9. If loaded evidence is absent or target matching fails, the system should ask a recovery question or report the retrieval gap instead of guessing.
10. Internal final answers, private handoffs, and reply hook candidates are not Telegram delivery proof.
11. Before answering, the runtime should identify which T-cell/T-sphere the current utterance attaches to.
12. Recent Telegram answer T-cells outrank older package/runtime memory T-cells for omitted-target follow-ups.
13. T-cell color is a state signal, not authority. Direct evidence and current user request priority still decide answer use.

## Verification

The gpao-openclaw-codex-parity gate checks:

- self-growth and upgrade loop parity
- new-session and omitted-follow-up continuity
- Context Mesh hard-gate productization
- Context Mesh every-turn fast-path, cache, and fail-open behavior
- lightweight organic OpenClaw operation
- T-cell Live Reinforcement Pass 001

The `gpao-openclaw-tcell-live-reinforcement` gate checks:

- T-cell runtime task packet
- Task Markov Blanket
- center-axis inference
- semantic role/source kind/evidence level/allowed use/conflict state fields
- recent Telegram answer priority over stale runtime/package memory
- MCP follow-up and arbitrary-domain follow-up replay
- package verification integration

It is included in npm test and npm run verify.
