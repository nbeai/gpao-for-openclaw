# BEAI Capability Pack v0.2.6 Release Notes

## 요약

v0.2.6은 BEAI Capability Pack에 Goal-Fit Audit, Package Module Map, Conversation Flow Review Loop를 연결한 릴리스다.

이번 버전의 목적은 하나다.

> BEAI Package가 "말귀, 흐름, 세션 연속성" 목표를 실제로 계속 점검하고, 대화 흐름 문제가 발견될 때 개선 후보에서 fixture, scenario, contract, Control Center 보강으로 이어질 수 있게 만든다.

## 추가된 것

- BEAI Package Goal-Fit Audit
  - `docs/BEAI-PACKAGE-GOAL-FIT-AUDIT-20260705-ko.md`
  - 말귀, 흐름, 세션 연속성 목표에 대해 구조, 기능, 검증, 보강 지점을 정밀 감사한다.
- BEAI Package Module Map
  - `config/beai-package-module-map.json`
  - `docs/BEAI-PACKAGE-MODULE-MAP-v0.1-ko.md`
  - `tools/beai-package-map-check.mjs`
  - 10개 도메인, 36개 모듈로 패키지 기능을 지도화한다.
- BEAI Conversation Flow Review Loop
  - `config/beai-conversation-flow-review-loop.json`
  - `docs/BEAI-CONVERSATION-FLOW-REVIEW-LOOP-v0.1-ko.md`
  - `tools/beai-conversation-flow-review-check.mjs`
  - 실제 대화 흐름 문제를 review-only 개선 후보로 남기고 반복 신호만 fixture, scenario, contract, Control Center 보강 후보로 올린다.

## 패키지 연결

- `capability-pack.json`에 Goal-Fit Audit, Package Module Map, Conversation Flow Review Loop 정책과 후보 모듈을 등록했다.
- `README.md`에 Conversation Flow Review Loop 방향을 추가했다.
- `beai-package-verify.mjs`가 Package Map Check와 Conversation Flow Review Check를 함께 실행한다.
- `beai-control-center.mjs`가 Package Map과 Conversation Flow Review Loop 상태를 read-only로 표시한다.

## 검증 결과

로컬 검증 기준:

- JSON parse: pass
- Conversation Flow Review Check: pass
- Package Map Check: pass
- Module Map: 10 domains / 36 modules / missing 0
- `npm test`: pass
- `npm run verify`: pass
- `git diff --check`: pass
- Control Center: status `review`, runtime source/live `0.6.20` aligned, Conversation Flow Review status `manual_first_review_only`

## 경계

v0.2.6은 다음을 하지 않는다.

- OpenClaw core 변경
- Gateway 재시작
- Gateway hook/config 변경
- cron/hook/agent 활성화
- durable memory promotion
- 외부 발송 또는 공개 게시
- 모든 세션 자동 감시
- 모든 메시지 점수화
- live runtime mutation

## 현재 릴리스 라벨

`internal-team-release-candidate`

이 버전은 clean zip, sha256, GitHub release asset으로 공유할 수 있는 패키지 후보로 닫을 수 있다. 다만 Conversation Flow Review Loop는 아직 manual-first / review-only 단계이며, 자동 세션 감시나 agent/cron 승격으로 부르면 안 된다.
