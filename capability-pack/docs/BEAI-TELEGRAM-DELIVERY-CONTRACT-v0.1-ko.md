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
- 긴 작업에서는 최종 완료 보고만으로 부족하다. 일정 시간 이상 작업이 이어지면 source conversation에 진행 상태가 보여야 하며, 없으면 사용자는 Telegram이 멈춘 것으로 느낀다.

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
- 내부 진행/복구 표면을 실제 사용자-visible 완료 보고로 착각했다.
- 내부 도구 작업은 계속되는데 Telegram visible progress update가 장시간 없다.

## Doctor 기준

BEAI Doctor는 다음 신호를 보면 `beai-visible-delivery-contract-missing`으로 분류한다.

- `final_answer`, `private final`, `internal final` 흔적
- Telegram direct 또는 source-channel visible send 맥락
- `message(action=send)` 또는 Telegram `messageId` 부재
- `telegram visible delivery candidate observed` 이후 `telegram visible delivery verified` 부재
- `message_sent` 이후 `messageId` 부재
- `visible_progress_contract_observed` 또는 `telegram long-running visible progress gap observed`

이 경우 첫 조치는 Gateway 재시작이 아니라 visible delivery contract 보강과 closeout evidence 확인이다.
긴 작업의 경우에는 closeout evidence와 별도로 progress checkpoint evidence도 확인해야 한다.
