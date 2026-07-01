# BEAI Runtime v0.6.17 릴리스 노트

Status: clean internal team candidate

## 변경 요약

- Telegram direct 응답에서 "내부 답변 생성"과 "사용자에게 실제 전송 완료"를 분리합니다.
- `state/beai/telegram-delivery-ledger.jsonl`에 generated, send_attempted, delivered, failed 상태를 기록합니다.
- Telegram messageId가 확인되기 전에는 delivered나 visible closeout 완료로 보지 않습니다.
- Gateway 재시작 후에는 messageId 없는 generated/send_attempted 항목을 pending scan 대상으로 봅니다.
- 재전송 판단에는 `chat_id + source_message_id/runId + content_hash` 기반 idempotency key를 사용합니다.

## 검증 기준

- `npm run build`
- `npm test`
- `node tools/beai-flow-regression-gate.mjs` from `capability-pack/`
- `node tools/beai-doctor-package-check.mjs` from `capability-pack/`
- Live sync 이후 `openclaw plugins doctor`, `openclaw hooks`, Telegram visible closeout messageId 확인

## 범위 밖

- OpenClaw core 변경 없음
- Telegram provider 설정 변경 없음
- Gateway 설정 변경 없음
- cron, hook, agent 신규 등록 없음
- 자동 재전송 루프 생성 없음
- durable memory write 없음
