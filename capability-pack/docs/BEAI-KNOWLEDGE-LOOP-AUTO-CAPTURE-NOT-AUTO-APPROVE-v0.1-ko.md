# Auto-Capture, Not Auto-Approve

Status: package automation principle
Date: 2026-07-01
Scope: BEAI Knowledge Loop, BEAI Package for OpenClaw, Codex/OpenClaw knowledge tools

## 핵심 원칙

```text
Auto-capture, not auto-approve.
자동 기록은 허용한다. 자동 승인은 금지한다.
```

BEAI Knowledge Loop는 사용자가 AI와 함께 일한 흔적을 조용히 남기고, 다시 찾고, 리뷰 후보로 정리하는 데 강한 자동화를 사용할 수 있다.

하지만 후보를 회사 지식, durable memory, 외부 실행, 배포, 고객 접촉, 돈, 계정, 법률 판단으로 확정하는 것은 자동화하지 않는다.

## 완전 자동 허용 영역

다음 작업은 로컬 review-only 기록과 검색을 위한 자동화로 다룰 수 있다.

- `knowledge.search`
- `knowledge.get_brief`
- `knowledge.capture_draft`
- `knowledge.index`
- `knowledge.review_queue`
- `knowledge.evaluate`

이 영역의 목적은 작업 전 검색, 작업 중 참고, 작업 후 초안 기록, 리뷰 대기열 정리, 중복 또는 오래된 후보 감지다.

이 작업은 외부로 보내지 않고, durable memory로 승격하지 않으며, 승인 상태를 확정하지 않는 한 사용자 흐름을 방해하지 않는 것이 더 중요하다.

## 조건부 자동 허용 영역

다음 작업은 상태 변경의 의미에 따라 다르게 다룬다.

- `knowledge.promote_plan`
- `knowledge.set_review_state`

`promote_plan`은 실제 승격이 아니라 승격 계획이므로 자동 생성할 수 있다. 단, 계획은 항상 review-first 후보로 남아야 한다.

`set_review_state`는 상태값별로 다르게 제한한다.

- `needs-review`: 자동 가능
- `stale`: 자동 제안 가능
- `superseded`: 자동 제안 가능
- `approved`: 사용자 명시 승인 필요
- `rejected`: 사용자 승인 권장

## 풀오토 금지 영역

다음 작업은 Knowledge Loop 만족도가 높아도 자동화하지 않는다.

- 고객에게 보내기
- 공개 게시
- 결제, 계약, 법률, 세무 판단
- 계정 연결 또는 권한 확대
- 배포, 릴리즈, production-ready 선언
- OpenClaw/Codex 설정을 실제로 바꾸는 자동화
- durable memory 승격
- 승인 없는 cron, hook, 상시 백그라운드 자동 실행

이 영역은 AI 직원이 메모하는 영역이 아니라 사용자의 결재 영역이다.

## 제품 문장

BEAI Knowledge Loop는 "AI가 알아서 기억하는 시스템"이 아니다.

정확한 제품 문장은 다음과 같다.

```text
AI가 일한 흔적을 남기고, 사람이 승인하는 시스템.
```

## OpenClaw 적용 기준

OpenClaw live 자동화는 이 원칙을 따른다.

- 자동 capture는 가능하다.
- 자동 search/index/evaluate는 가능하다.
- 자동 review queue 정리는 가능하다.
- 자동 durable memory 승격은 금지한다.
- 자동 approval은 금지한다.
- 외부 전송, 공개 게시, 배포, 고객 접촉, 돈, 계정, 법률은 사용자 승인 전까지 금지한다.

## 검증 기준

Knowledge Loop 자동화가 올바르게 구현된 상태는 다음 조건을 만족한다.

- 사용자는 매번 기록 허용 창에 붙잡히지 않는다.
- 기록은 source-grounded draft 또는 review candidate로 남는다.
- approved 상태는 사용자의 명시 승인을 요구한다.
- durable memory write는 별도 Memory Curator Review 경계를 지난다.
- 외부 실행과 배포는 Release Verifier 또는 해당 승인 경계를 지난다.
- 실패하거나 애매한 경우에는 자동 승격 대신 review queue에 남긴다.

## 한 줄 기준

풀오토로 해도 되는 것:

```text
AI야, 일하면서 업무일지 초안은 알아서 남겨.
```

풀오토로 하면 안 되는 것:

```text
AI야, 네가 맞다고 생각하면 회사 기준으로 확정하고 밖에 보내.
```
