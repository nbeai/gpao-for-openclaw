# BEAI Runtime v0.6.15 릴리스 노트

## 요약

v0.6.15는 Telegram direct 완료 보고가 내부 `final_answer`나 전송 직전 payload 후보에서 멈추지 않도록, `message_sent` hook과 Telegram `messageId`를 별도 도착 검증 증거로 기록하는 안정화 패치입니다.

## 변경 사항

- `reply_payload_sending`은 Telegram visible delivery 후보로만 기록합니다.
- `message_sent` hook에서 `success=true`와 `messageId`가 함께 보일 때만 `visible_delivery_verified` evidence를 남깁니다.
- `message_sent`가 보였지만 `messageId`가 없으면 delivery contract를 열린 상태로 기록합니다.
- BEAI는 메시지를 자동 재전송하지 않고, OpenClaw 전송 경로의 후보/검증 증거만 분리합니다.

## 검증 기준

- 내부 final text는 Telegram delivery가 아닙니다.
- `reply_payload_sending`은 완료 증거가 아닙니다.
- Telegram direct 완료 보고는 `message_sent`와 `messageId` evidence가 있어야 닫힙니다.

## 안전 경계

- OpenClaw core를 수정하지 않습니다.
- Telegram 설정을 바꾸지 않습니다.
- Gateway를 재시작하지 않습니다.
- 메시지를 중복 발송하지 않습니다.
- cron, agent, memory, 외부 계정을 변경하지 않습니다.
