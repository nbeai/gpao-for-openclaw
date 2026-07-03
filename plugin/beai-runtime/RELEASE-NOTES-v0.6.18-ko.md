# BEAI Runtime v0.6.18 릴리스 노트

Status: internal team release candidate

ClawHub package: `@nbeai/beai-runtime`

## 변경 요약

- v0.6.17의 Telegram Delivery Ledger와 speed-reliability 계약을 유지합니다.
- 사용자에게 보이는 operational notification에서 watchdog, heartbeat, cron dry-run, Knowledge Loop review-candidate 신호가 원시 내부 후보처럼 노출되지 않도록 패키지 게이트를 추가합니다.
- Human Companion Quality Contract를 런타임 품질 기준으로 연결해 현재 요청, 인지 부담, 선택권, 장기 맥락, 신뢰 회복, 다음 행동의 경계를 더 안정적으로 분리합니다.
- Organic Flow Audit를 추가해 runtime, hook, skill, tool, evidence, Korean wording, release boundary가 따로 노는지 검증합니다.
- `npm run verify`가 build, syntax test, production audit, doctor package check, flow regression gate, user scenario audit, operational notification gate, organic flow audit, package truth check를 한 번에 확인합니다.

## 검증 기준

- `npm run verify`
- `cd plugin/beai-runtime && npm run build && npm test`
- `npm audit --omit=dev`
- stale claim scan: pass
- package truth check: pass

## 범위 밖

- OpenClaw core 변경 없음
- Telegram provider 설정 변경 없음
- Gateway 설정 변경 없음
- cron, hook, agent 신규 등록 없음
- 자동 재전송 루프 생성 없음
- durable memory write 없음
- ClawHub/NPM 실제 게시 없음
