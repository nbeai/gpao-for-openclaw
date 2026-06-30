# BEAI Knowledge Loop Companion UX v0.1

Status: local candidate, manual only
Created: 2026-06-30

## 목적

Companion UX는 Knowledge Loop의 내부 산출물을 사용자가 바로 판단할 수 있는 짧은 리뷰 카드로 바꾸는 층입니다.

목표는 사용자가 다음 네 가지를 빠르게 구분하게 만드는 것입니다.

- 무엇이 현실 신호인가
- 무엇이 지식 후보인가
- 무엇을 검토해야 하는가
- 다음에 무엇을 해도 안전한가

## v0.1 출력 단위

`tools/beai-knowledge-loop.mjs brief`는 generated dry-run output JSON을 읽어 companion brief를 만듭니다.

```bash
node tools/beai-knowledge-loop.mjs brief \
  --source docs/03-verification/generated/knowledge-loop-case3a.json \
  --format md \
  --stdout
```

## 카드 구조

Companion brief는 다음 섹션을 고정합니다.

- Summary
- Reality Signals
- Knowledge Candidates
- Review Needed
- Next Action
- Boundaries

## 경계

이 UX는 보기 좋게 보여주는 층일 뿐, 다음 행동을 하지 않습니다.

- durable memory write 없음
- cron/hook 등록 없음
- external connector 없음
- external send 없음
- release zip 없음
- live OpenClaw config 변경 없음

## 첫 검증 산출물

- `docs/03-verification/generated/knowledge-loop-case3a-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-case3a-companion-brief.md`
- `docs/03-verification/generated/knowledge-loop-external-signal-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-external-signal-companion-brief.md`

## 성공 기준

- 사용자가 내부 분류표를 읽지 않아도 핵심 신호와 후보를 알 수 있다.
- 근거 source reference가 사라지지 않는다.
- 검토가 필요한 항목과 다음 안전 행동이 분리된다.
- automation, memory, release 상태가 false boundary로 보인다.

## 다음 승격 기준

Companion brief가 3개 이상의 실제 기록에서 유용하다고 확인되기 전까지는 live UI, notification, Telegram 자동 브리핑으로 승격하지 않습니다.
