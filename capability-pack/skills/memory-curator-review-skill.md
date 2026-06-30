---
name: "beai-memory-curator-review"
description: "Use when the user asks what should be remembered, says 기억해도 될지 검토해줘, memory candidate, 장기 기억, 세션 연속성, MEMORY.md, memory promote, or when a project state, user principle, agreement, preference, or handoff might be wrongly saved as durable memory. Review only; classify candidate / agreement / session continuity / discard / needs confirmation. Do not write memory or promote anything directly."
---

# BEAI Memory Curator Review Skill

## Identity
Memory Curator Review Skill is a memory contamination checkpoint.

It is not a memory-saving skill.

It reviews whether a candidate should remain a candidate, become an agreement asset, stay as session continuity, be discarded, or be proposed for long-term memory.

## Trigger Signals

Korean:

- "이건 기억해도 될지 검토해줘"
- "기억으로 확정하지 말고 후보로만 봐줘"
- "메모리 오염 위험이 있는지 확인해줘"
- "세션 연속성인지 장기 기억인지 나눠줘"
- "저장하지 말고 memory candidate만 검토해줘"

English:

- "review this memory candidate"
- "do not save this yet"
- "separate memory from session continuity"
- "check for memory pollution"
- "classify this as candidate, agreement, discard, or continuity"

## Purpose
Prevent memory pollution before anything is promoted to durable memory.

## Core Definition
```text
Memory Curator Review Skill
= 기억 후보를 저장하는 기능이 아니라,
  후보 / 합의 자산 / 세션 상태 / 폐기 맥락을 분리하고
  장기 기억으로 올려도 되는지 검토하는 review-first 절차
```

## When To Use
Use this skill when memory candidates accumulated, the user asks what should be remembered, a session is ending, a project reached a decision point, the user says not to confirm something as memory yet, or memory pollution risk appears.

Also use it when a handoff, release decision, user preference, profile detail, or project rule might be incorrectly promoted to durable memory.

## Inputs
- Candidate text
- Source context
- User instruction about memory
- Current session continuity
- Agreement candidates
- Discarded context
- Do-not-store signals

## Review Criteria
1. Did the user explicitly ask to keep it?
2. Will it actually improve future judgment quality?
3. Is it free of assumptions, debug residue, or tool artifacts?
4. Is session continuity enough, instead of long-term memory?
5. Can the user later inspect, edit, reject, or defer it?

## Classifications
- `reject`: should not be kept
- `discarded_context`: useful only as something not to carry
- `session_continuity`: useful only for the next session
- `memory_candidate`: possible, but needs user confirmation
- `agreement_candidate`: a possible shared working standard
- `long_term_memory_proposal`: only if the user clearly asked or confirmed

## Procedure
1. Read the candidate narrowly.
2. Identify the source: user said, assistant inferred, tool output, debug/runtime artifact, or copied external text.
3. Check do-not-store signals: "기억하지 마", "저장하지 마", "임시로", "아직 확정 아님", hypothetical language.
4. Apply review criteria.
5. Classify the item.
6. Ask for confirmation only if needed.
7. Never write durable memory directly.

## Output Format
```text
기억 검토 결과:

장기 기억으로 올려도 되는 후보:
- ...

세션 연속성으로 충분한 것:
- ...

합의 자산 후보:
- ...

버리거나 넘기지 않을 것:
- ...

확인이 필요한 것:
- ...

권장:
- 지금은 자동 저장하지 않고, 사용자 확인 후 승격합니다.
```

## Good / Bad Example

Good:

```text
기억 검토 결과:

장기 기억으로 올려도 되는 후보:
- 없음

세션 연속성으로 충분한 것:
- 이번 작업은 Capability Pack v0.1.1의 routing 정리 단계입니다.

합의 자산 후보:
- Skill-first로 시작하고, 검증된 것만 Agent로 승격한다.

버리거나 넘기지 않을 것:
- 임시 검토 문장, 디버그 출력, 중간 의견 반복

권장:
- 자동 저장하지 말고, 합의 자산 후보만 사용자 확인 후 승격합니다.
```

Bad:

```text
사용자는 항상 Skill-first 개발을 선호한다고 기억하겠습니다.
```

Why bad:

- It overgeneralizes a project-specific decision into a durable user preference without confirmation.

## Do Not
- Do not silently save memory.
- Do not promote assumptions.
- Do not promote debug artifacts.
- Do not treat session handoff as long-term memory.
- Do not treat user brainstorming as agreement.
- Do not store sensitive information without explicit user approval.
- Do not modify BEAI Layer core.

## Promotion Rule
Keep as a review skill first.

Promote to Memory Curator Agent only if repeated use proves the need for separate memory review state and explicit user-facing memory review workflow.
