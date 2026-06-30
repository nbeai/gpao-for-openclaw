# BEAI Runtime v0.6.13 릴리스 노트

상태: clean internal team candidate bugfix

## 핵심 변경

- `before_agent_reply` hard rewrite를 run-bound 호출로 제한했습니다.
- `ctx.runId`가 없거나 `resolvedPlan.source`가 `session`인 경우 BEAI Runtime이 `handled: true`를 반환하지 않도록 했습니다.
- Telegram/direct pre-model 사용자 입력이 assistant reply surface처럼 sanitize되어 정상 user turn을 막는 문제를 방지합니다.

## 수정 파일

- `src/index.ts`
  - `canHardHandleBeforeAgentReply()` 추가
  - `before_agent_reply` hard rewrite 반환 경로에 guard 적용
- `src/index.test.ts`
  - Telegram direct 문제 문장 회귀 테스트 추가
  - dashboard lane mid-message question 회귀 테스트 추가
- `dist/index.js`
  - 빌드 산출물 반영

## 검증 기준

```bash
npm test
npm run build
node --check dist/index.js
node --check dist/runtime-core.js
node --check runtime/beai-runtime-lib.cjs
```

기대 결과:

- 전체 테스트 통과
- 빌드 통과
- 문제 문장이 `runId` 없이 `before_agent_reply`로 들어와도 `handled:true`가 나오지 않음

## 운영 확인

OpenClaw live 환경 반영 후 같은 문제 문장을 Telegram/direct 경로로 테스트합니다.

확인 신호:

- 정상 `runId` 생성
- `before_prompt_build` 발생
- `before_agent_reply sanitized reply` + `runId:null` 재발 없음

## 범위

이 릴리스는 BEAI Runtime bugfix입니다.

포함하지 않음:

- OpenClaw core hook 계약 변경
- Gateway/Telegram provider 설정 변경
- cron/agent/skill 자동 생성
- memory 자동 승격
- 공개 릴리스 선언
