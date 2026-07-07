# BEAI Telegram Delivery Contract v0.1

## 목적

비아이패키지는 OpenClaw 위에서 사용자가 Telegram을 실제 작업 창으로 느끼도록 도와야 한다.
따라서 작업 완료 보고는 내부 완료 상태가 아니라 사용자가 보는 Telegram 메시지로 닫혀야 한다.

## 핵심 원칙

- Codex 내부 `final_answer`는 Telegram 전달이 아니다.
- private final text는 Telegram 전달이 아니다.
- `sessions_send`와 handoff note는 사용자-visible Telegram 전달이 아니다.
- Telegram direct 대화에서 완료 보고가 필요하면 source conversation에 `message(action="send")`를 호출해야 한다.
- `reply_payload_sending`은 전송 직전 후보일 뿐 완료 증거가 아니다.
- 완료로 닫기 전 `message_sent` 성공과 Telegram `messageId` 또는 동등한 visible delivery evidence를 확인해야 한다.
- Gateway restart recovery 뒤에는 특히 visible closeout을 별도로 확인해야 한다.
- 응답이 생성됐지만 Telegram `messageId`가 없으면 `delivered`가 아니라 `unverified`로 남긴다.
- Gateway 재시작 뒤에는 최근 `generated` 또는 `send_attempted` 상태인데 `messageId`가 없는 응답을 스캔해야 한다.
- 재전송이 필요하면 `chat_id + source_message_id + content_hash`를 중복 방지 키로 사용해야 한다.
- 긴 작업에서는 최종 완료 보고만으로 부족하다. 일정 시간 이상 작업이 이어지면 source conversation에 진행 상태가 보여야 하며, 없으면 사용자는 Telegram이 멈춘 것으로 느낀다.
- Telegram direct 실행 작업에서는 첫 상태 보고가 30초 이내에 보여야 한다.
- 긴 작업이 계속되는 동안 source conversation 진행 업데이트는 최대 120초 이내 간격으로 보여야 한다.
- 진행 업데이트에는 `진행 중`, `검증 중`, `막힌 지점`, `다음 행동` 중 현재 상태에 맞는 항목이 들어가야 한다.
- hook registration 의심 신호가 보이면 숨기지 않고 BEAI Doctor의 승인형 repair plan으로 올린다.
- Telegram direct에서는 설치/재개 흐름을 제외한 BEAI `before_agent_reply` 표면 응답이 실제 모델 답변을 대체하지 않는다. 승인 경계, 상태 위생, 복구, 위임, 세션 분리, handoff 표면은 관찰 증거만 남기고 기본 답변 경로로 넘긴다.

## 책임 분리

OpenClaw 책임에 가까운 경우:

- Telegram provider가 disconnected 상태다.
- channel status에서 inbound/outbound/transport activity가 멈췄다.
- Telegram Bot API 전송 자체가 실패했다.
- session key나 lane이 OpenClaw 내부에서 깨졌다.

비아이패키지 책임에 가까운 경우:

- Telegram transport는 정상인데 완료 보고가 내부 `final_answer`로만 닫혔다.
- `message(action="send")` 호출 증거가 없다.
- `reply_payload_sending` 후보만 있고 `message_sent` 확인이 없다.
- `message_sent`는 보였지만 `messageId`가 없다.
- Telegram `messageId`가 없다.
- 응답 본문은 생성됐지만 전송 장부에 `delivered` 증거가 없다.
- Gateway 재시작 이후 미확인 응답 스캔 또는 재전송 idempotency evidence가 없다.
- 내부 진행/복구 표면을 실제 사용자-visible 완료 보고로 착각했다.
- 내부 도구 작업은 계속되는데 Telegram visible progress update가 장시간 없다.
- 첫 상태 보고가 30초를 넘겼거나, 긴 작업 진행 업데이트가 120초를 넘겼다.
- hook registration 의심 신호가 있는데 repair plan 없이 정상/완료로 닫았다.
- Telegram direct에서 BEAI 표면 응답이 설치/재개가 아닌 실제 답변을 대체했다.

## Gateway restart 복구 장부

Gateway 재시작, 네트워크 복귀, provider 재연결처럼 전송 경계가 흔들리는 작업에서는 다음 상태를 분리한다.

- `generated`: 사용자에게 보낼 응답이 만들어졌지만 아직 전송 시도 증거가 없다.
- `send_attempted`: Telegram 전송을 시도했지만 `messageId`가 아직 없다.
- `delivered`: source conversation에 대한 Telegram `messageId` 또는 동등한 visible delivery evidence가 있다.
- `failed`: Telegram send가 명시적으로 실패했다.
- `unknown`: 재시작이나 transport 중단으로 최종 상태가 닫히지 않았다.

복구 스캔은 최근 N분 안의 `generated`, `send_attempted`, `unknown` 항목 중 `messageId`가 없는 응답만 대상으로 한다.
같은 응답을 두 번 보내지 않기 위해 `chat_id + source_message_id + content_hash`를 idempotency key로 둔다.
이 장부가 없으면 BEAI Runtime은 자동 복구가 아니라 `visible delivery unverified`로만 말해야 한다.

## Doctor 기준

BEAI Doctor는 다음 신호를 보면 `beai-visible-delivery-contract-missing`으로 분류한다.

- `final_answer`, `private final`, `internal final` 흔적
- Telegram direct 또는 source-channel visible send 맥락
- `message(action=send)` 또는 Telegram `messageId` 부재
- `telegram visible delivery candidate observed` 이후 `telegram visible delivery verified` 부재
- `message_sent` 이후 `messageId` 부재
- `generated response` 또는 `send_attempted` 이후 `messageId` 부재
- Gateway restart recovery 뒤 `pending delivery scan` 부재
- `visible_progress_contract_observed` 또는 `telegram long-running visible progress gap observed`
- Telegram direct에서 `approval boundary surface returned`, `state hygiene surface returned`, `delegation surface returned`, `session split approval surface returned`, `work order surface returned` 같은 비설치 표면이 hard rewrite로 반환된 흔적

이 경우 첫 조치는 Gateway 재시작이 아니라 visible delivery contract 보강과 closeout evidence 확인이다.
긴 작업의 경우에는 closeout evidence와 별도로 progress checkpoint evidence도 확인해야 한다.
첫 상태 보고 30초, 장기 작업 진행 업데이트 120초 기준을 넘긴 경우에는 정상 완료가 아니라 progress contract gap으로 기록한다.
