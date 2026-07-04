# BEAI Conversation Flow Review Loop v0.1

작성일: 2026-07-05
대상: BEAI Package for OpenClaw
상태: manual-first / review-only 설계 후보

## 1. 목적

BEAI Package의 핵심 목표는 단순히 기능을 많이 넣는 것이 아니다.

핵심 목표는 다음에 가깝다.

> 사용자의 말을 지금 맥락에서 정확히 알아듣고, 대화 흐름을 해치지 않으며, 세션이 바뀌어도 목적과 판단 기준을 잃지 않는 AI.

이 목표는 정적 테스트만으로 닫히지 않는다. 실제 대화에서 다음 같은 문제가 계속 드러날 수 있기 때문이다.

- 현재 요청보다 오래된 맥락을 더 세게 잡는 경우
- 사용자의 짧은 후속 지시를 놓치는 경우
- 정정 신호가 왔는데 기존 해석을 방어하는 경우
- 완료, 검증, 적용, 전송, 배포 상태를 섞는 경우
- 필요한 답보다 절차, 설명, 선택지를 먼저 늘리는 경우
- 세션 전환 후 왜 이 일을 하고 있었는지 잃는 경우

Conversation Flow Review Loop는 이런 순간을 "실패했다고 단정"하거나 "바로 자동 수정"하는 장치가 아니다.

실제 대화에서 흐름이 어긋난 지점을 개선 후보로 남기고, 반복되는 신호만 패키지 보강으로 연결하는 품질 루프다.

## 2. 기본 원칙

이 루프는 대화 감시자가 아니다.

대화 흐름을 조용히 관찰하되, 사용자에게 불필요한 평가표나 내부 진단을 보여주지 않는다. 모든 메시지를 점수화하지도 않는다.

포착 대상은 의미 있는 흐름 문제다.

- 사용자가 불편을 표시한 순간
- 사용자가 의도, 범위, 상태, 말투, 형식을 정정한 순간
- 세션 전환이나 압축 뒤 목적과 다음 행동이 흐려진 순간
- 긴 작업 뒤 전달, 검증, 적용 상태가 불명확해진 순간
- 같은 유형의 정정이 반복된 순간

## 3. 현재 단계

현재 단계는 자동화가 아니다.

정확한 단계는 다음과 같다.

```text
manual-first / review-only quality loop
```

의미:

- 사람이 부르거나 명확한 흐름 문제가 생겼을 때만 리뷰한다.
- 리뷰 결과는 개선 후보로 남긴다.
- 후보는 바로 live runtime, cron, agent, memory, release로 승격하지 않는다.
- 반복성과 개선 위치가 확인될 때만 fixture, scenario, contract, Control Center 신호로 전환한다.

## 4. 문제 유형

v0.1에서 다루는 주요 문제 유형은 다음이다.

| 유형 | 의미 | 주 보강 위치 |
| --- | --- | --- |
| current_request_drift | 현재 요청이 아니라 오래된 요청이나 더 큰 맥락에 답함 | runtime fixture, Human Companion Quality |
| context_takeover | 과거 맥락, 기억, handoff가 현재 요청을 덮음 | session handoff, continuity judgment |
| intent_misread | 질문, 실행, 승인, 정정, 중지 신호를 잘못 읽음 | runtime fixture, flow regression |
| status_overclaim | 시도, 작성, 적용, 검증, 전송, 배포, 복구를 섞음 | Action Semantics, Telegram Delivery |
| ceremony_overload | 사용자는 움직임을 원하는데 절차, 설명, 선택지를 과하게 늘림 | Friction-Aware Gate |
| silence_gap | 긴 작업 중 사용자가 현재 상태를 알 수 없음 | Telegram live evidence, progress rule |
| correction_loop | 사용자가 같은 방향으로 계속 고쳐줘야 함 | Knowledge Loop, scenario follow-up |
| handoff_loss | 세션 전환 뒤 목적, 기준, 다음 행동을 잃음 | Session Handoff, Control Center |
| internal_label_leak | 내부 상태명, 디버그, closure handle이 사용자 답변에 드러남 | runtime fixture, Korean standard |

## 5. 후보 기록 단위

대화 흐름 문제가 보이면 바로 "고쳤다"고 말하지 않는다.

먼저 후보 기록으로 남긴다.

필수 기록 항목:

- 발생 시각
- 대화 표면: Telegram, OpenClaw, Codex 등
- 세션 범위: 같은 세션, 압축 뒤, 새 세션 등
- 사용자의 현재 요청
- 기대됐던 흐름
- 실제 어긋난 흐름
- 문제 유형
- 근거 발췌 또는 포인터
- 사용자에게 준 부담
- 고칠 후보 위치
- 제안하는 보강
- 자동화/승격 경계
- 현재 상태: review candidate, fixture candidate, scenario candidate 등

## 6. 개선 전환 기준

후보가 하나 생겼다고 바로 패키지를 바꾸지 않는다.

전환 기준:

1. 단발 후보
   - 문서 또는 리뷰 후보로만 남긴다.

2. 같은 유형이 반복됨
   - runtime fixture 또는 user scenario 후보로 올린다.

3. 같은 문제로 사용자가 실제 부담을 느꼈음
   - P0/P1 보강 후보로 올린다.

4. 검증 기준으로 표현 가능함
   - flow regression gate, user scenario audit, package verify, Control Center 중 하나에 연결한다.

5. 자동 개입이 필요해 보임
   - 최소 3회 이상 수동 리뷰 성공, 입력 경로 안정성, 결과 포맷, 중단 경로, 실패 보고 기준이 확인된 뒤에만 cron/agent 후보로 본다.

## 7. Control Center와의 관계

Control Center는 이 루프를 실행하는 지휘관이 아니다.

Control Center가 해야 할 일은 read-only로 현재 상태를 보여주는 것이다.

표시할 수 있는 상태:

- Conversation Flow Review Loop 설정 존재 여부
- issue type 수
- 후보 기록 필수 필드 수
- 현재 단계: manual-first / review-only
- 자동화 미승격 경계
- generated verification report 존재 여부

표시하지 말아야 할 것:

- 사용자 대화 원문 전체
- 사적인 대화 내용
- 장기 기억으로 확정되지 않은 임시 판단
- 자동 감시가 켜졌다는 표현
- agent 또는 cron이 활성화됐다는 표현

## 8. Package Verify와의 관계

Package Verify는 이 루프가 패키지 안에서 안전하게 구성되어 있는지 확인한다.

확인할 것:

- 설정 JSON이 존재하고 schema가 맞는가
- 문서가 존재하는가
- 문제 유형이 충분히 정의되어 있는가
- 후보 기록 필드가 충분한가
- 자동화/승격 금지 경계가 들어 있는가
- manifest candidate module에 등록되어 있는가
- module map에서 누락되지 않았는가

확인하지 않는 것:

- 실제 모든 Telegram 대화가 개선됐는지
- live runtime에 적용됐는지
- cron, agent, hook이 켜졌는지
- GitHub release가 만들어졌는지

## 9. 하지 않을 것

v0.1에서는 다음을 하지 않는다.

- 모든 세션 자동 감시
- 모든 메시지 점수화
- 사용자에게 내부 리뷰 결과 자동 노출
- durable memory 자동 승격
- cron, hook, agent 등록
- Gateway restart
- live runtime mutation
- 외부 발송
- release zip 생성
- GitHub release

## 10. 다음 보강 순서

권장 순서:

1. 이 문서와 설정을 패키지에 추가한다.
2. read-only checker를 만들어 Package Verify에 연결한다.
3. Control Center에 review-only 상태만 노출한다.
4. 실제 대화 흐름 문제가 발생할 때 후보 기록 예시를 2~3개 모은다.
5. 반복 유형을 runtime fixture나 user scenario audit으로 옮긴다.
6. 최소 3회 이상 수동 리뷰가 안정적으로 성공한 뒤에만 반자동화 가능성을 다시 판단한다.

## 11. 현재 결론

Conversation Flow Review Loop는 BEAI Package의 다음 단계로 적합하다.

다만 지금은 "자동 감시 시스템"이 아니라 "말귀 품질 개선 후보를 모으는 수동 리뷰 루프"로 시작해야 한다.

이 방식이 BEAI 목표와 가장 잘 맞는다. 대화는 무겁게 만들지 않고, 실제로 어긋난 흐름만 패키지 개선 자산으로 바꿀 수 있기 때문이다.
