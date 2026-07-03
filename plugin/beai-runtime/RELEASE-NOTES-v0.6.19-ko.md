# BEAI Runtime v0.6.19 릴리스 노트

Status: public release candidate

ClawHub package: `@nbeai/beai-runtime`

## 변경 요약

- v0.6.18의 Telegram Delivery Ledger, speed-reliability 계약, operational notification gate, Human Companion Quality Contract, Organic Flow Audit를 유지합니다.
- Action Semantics Profile을 런타임 오버레이에 추가해 `diagnose`, `report`, `mitigate`, `repair`, `verify`, `prevent`를 서로 다른 상태로 분리합니다.
- Recovery Claim Gate를 추가해 "복구했습니다", "해결했습니다", "고쳤습니다", `fixed`, `resolved`, `recovered` 같은 표현은 실패 경로 관찰, 원인 특정, 실패 경로 변경, 같은 조건 재검증 증거가 있을 때만 쓰도록 합니다.
- "이게 복구야?", "상태 보고잖아", "오류면 복구해야지" 같은 사용자 정정 신호를 Action Semantics correction escalator로 분리했습니다.
- 사용자 시나리오 감사에 `S20-action-semantics-and-recovery-claim`을 추가했습니다.
- Flow regression gate에 `semantic_action_mismatch` lane을 추가했습니다.
- Knowledge Loop source record에 실제 복구/보고 혼동 장면을 source-grounded 후보로 남겼습니다.

## 검증 기준

- `npm run verify`
- `cd plugin/beai-runtime && npm run build && npm test`
- `npm audit --omit=dev`
- `beai-user-scenario-audit`: 20/20 pass
- `beai-flow-regression-gate`: 55/55 pass
- stale claim scan: pass
- package truth check: pass

## 범위 밖

- OpenClaw core 변경 없음
- Telegram provider 설정 변경 없음
- Gateway 설정 변경 없음
- cron, hook, agent 신규 등록 없음
- 자동 재전송 루프 생성 없음
- durable memory write 없음
