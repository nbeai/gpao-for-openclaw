# BEAI Knowledge Loop Local Live Evidence

작성일: 2026-07-02
범위: 윤의 로컬 OpenClaw workspace evidence

이 문서는 package default manifest가 아니다.

아래 항목은 윤의 로컬 환경에서 관찰되거나 검증된 live evidence이며, 새 사용자가 BEAI Capability Pack을 설치할 때 자동으로 생성되거나 활성화되는 기본 기능으로 해석하면 안 된다.

## Local Evidence

- daily applied cron
  - id: local workspace evidence, not distributed
  - name: `beai-knowledge-loop-daily-applied-*`
  - schedule: `10 9 * * *`
  - timezone: `Asia/Seoul`
  - observed status: `enabled-force-run-ok`

- persistent review lane cron
  - id: local workspace evidence, not distributed
  - name: `beai-knowledge-loop-agent-review-*`
  - schedule: `20 9 * * *`
  - timezone: `Asia/Seoul`
  - observed status: `enabled-force-run-ok`

- bounded Gateway/Telegram watchdog cron
  - id: local workspace evidence, not distributed
  - name: `beai-telegram-gateway-watchdog-*`
  - schedule: `every 30 minutes`
  - observed status: `enabled-force-run-ok-no-restart-needed`

- missed-run recovery cron
  - id: local workspace evidence, not distributed
  - name: `beai-knowledge-loop-missed-run-recovery-*`
  - schedule: `10 11-23/2 * * *`
  - timezone: `Asia/Seoul`
  - observed status: `enabled-force-run-ok-no-action-when-marker-exists`

## Boundary

- package default: skill, docs, tools, policy, verification helpers
- local evidence: 윤의 workspace에서 따로 적용/검증된 cron, persistent lane, watchdog, Telegram delivery evidence
- not default: cron registration, watchdog registration, persistent review lane, Gateway restart, Telegram live send, durable memory promotion, public release publishing
