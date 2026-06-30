---
name: "beai-session-handoff"
description: "Use when the user asks to hand off, continue in a new session, prepare next-session notes, compact context, avoid long recap, or preserve only current goal / decisions / open loops / next action. Use for 세션 인계, 다음 대화, 컨텍스트 압축, handoff. Do not save as long-term memory or summarize the whole transcript."
---

# BEAI Session Handoff Skill

## Identity
Session Handoff Skill prepares the next conversation without dumping the past conversation.

It is a skill, not an autonomous agent by default.

## Trigger Signals

Korean:

- "다음 세션으로 넘길 준비해줘"
- "새 대화에서 이어받게 정리해줘"
- "기억으로 확정하지 말고 세션 연속성으로만 남겨줘"
- "요약하지 말고 다음 행동만 남겨줘"
- "컨텍스트가 꽉 찼다고 가정하고 handoff 해줘"

English:

- "prepare a next-session handoff"
- "make a compact continuity note"
- "do not save this as memory"
- "summarize only why we are here and the next action"
- "handoff this session without dumping history"

## Purpose
Reduce the user's anxiety when a context window is full, a session is compressed, or a new session begins.

The skill preserves why the work reached its current point and what should happen next. It does not create a long summary.

## When To Use
Use this skill when the user asks to prepare for a new session, preserve continuity, avoid long summaries, or explicitly says to treat content as session continuity rather than memory.

Also use it when the current task is about context compression, `/new`, session continuity, or avoiding long recaps.

## Inputs
- Current conversation goal
- Confirmed decisions
- Current open loops
- Constraints and do-not-touch boundaries
- Current artifact/package/file state
- Next action

## Procedure
1. Separate carry types: confirmed decision, current work state, open question, risk/constraint, do-not-carry context.
2. Preserve why here: why the current direction was chosen, what problem it solves, and what should not be re-litigated unless the user asks.
3. Keep only next-action relevant context: no full conversation history, repeated debate, emotional labeling, or debug traces.
4. Mark memory boundary: session continuity, not accepted long-term memory, not durable user profile.
5. Produce a compact handoff.

## Output Format
```text
다음 세션용 연속성 메모:

이전 흐름:
- ...

여기까지 온 이유:
- ...

확정된 기준:
- ...

현재 상태:
- ...

다음 행동:
- ...

넘기지 않을 것:
- ...

주의:
- 이 메모는 장기 기억 확정이 아니라 세션 연속성 기준입니다.
```

## Good / Bad Example

Good:

```text
다음 세션용 연속성 메모:

이전 흐름:
- BEAI Capability Pack은 BEAI Layer와 분리된 별도 능력 패키지로 정리 중입니다.

여기까지 온 이유:
- Layer core를 무겁게 하지 않고 필요한 전문 절차만 Skill-first로 분리하기 위해서입니다.

다음 행동:
- routing.md를 기준으로 Skill 간 handoff 규칙을 검토합니다.

넘기지 않을 것:
- 전체 대화 전문, 반복 논쟁, 임시 감정 표현, 디버그 출력

주의:
- 이 메모는 장기 기억 확정이 아니라 세션 연속성 기준입니다.
```

Bad:

```text
오늘 우리는 아주 많은 이야기를 했습니다. 처음에는 BEAI Layer 설치를 했고, 그다음에는...
```

Why bad:

- It becomes a long recap and does not preserve only the next-action-relevant continuity.

## Quality Bar
The handoff should be short enough to paste into a new session and should make continuation obvious without forcing a long recap.

## Do Not
- Do not summarize the whole conversation.
- Do not save as durable memory.
- Do not infer user emotions as facts.
- Do not turn temporary debate into settled agreement.
- Do not include private logs or debug content.
- Do not modify BEAI Layer core.

## Promotion Rule
Keep as a skill unless OpenClaw needs a dedicated session continuity agent with independent state management.
