# BEAI Package for OpenClaw 3차 Harness 감사

작성일: 2026-07-02
범위: BEAI Package for OpenClaw 현재 작업트리
감사 방식: BEAI Harness route / preflight / brief / plan / scenario / scenario test-plan / scenario run / verify / ops-check / closeout 적용

## 감사 목적

1차 감사는 패키지 구조와 배포 진실성을 봤고, 2차 감사는 사용자 시나리오 관점의 불편과 오류 가능성을 봤다.

3차 감사는 BEAI Harness 기준으로 패키지 전체를 다시 본다. 핵심 질문은 다음이다.

- 기능이 실제로 작동하는가
- 정밀함과 정교함이 사용자 신뢰를 보호하는가
- 문서, manifest, runtime, tools, package dry-run 결과가 서로 맞는가
- Telegram / Gateway / visible delivery / session continuity 경계가 정확한가
- 성능과 효율 면에서 불필요한 마찰, 과도한 ceremony, 무거운 세션 누적 위험이 있는가
- 이후 전체 수정/보강 전에 어떤 항목을 먼저 고쳐야 하는가

## Harness 적용 결과

생성된 Harness 증거:

- `.beai-harness/route.md`
- `.beai-harness/brief.md`
- `.beai-harness/plan.md`
- `.beai-harness/scenario.json`
- `.beai-harness/scenario-test-plan.md`
- `.beai-harness/scenario-run.md`
- `.beai-harness/ops-check.md`
- `.beai-harness/closeout.md`

Harness 판정:

- route: `scenario-guided lifecycle`
- plan: strict flow 필요
- scenario: `Guided First Workflow`
- scenario run: `blocked`
- verify: `blocked`
- ops-check: `ready`
- closeout: `blocked`

중요한 해석:

- BEAI Harness 자체는 이 패키지를 "완료"로 닫지 못하게 막았다.
- 이유는 패키지 루트에 Harness가 인식할 통합 verification command와 developer-owned scenario test layer가 없기 때문이다.
- 개별 검증 명령은 여러 개 통과했지만, 패키지 전체를 대표하는 단일 검증 표면이 아직 없다.

## 이번에 실행한 검증

Runtime:

- `npm run build` 통과
- `npm test` 통과
- `npm audit --omit=dev --json` 기준 prod vulnerability 0건

Package / dry-run:

- `npm pack --dry-run --json` 실행
- 실제 포함 파일 7개 확인
- 포함 파일:
  - `README.dist.md`
  - `README.md`
  - `dist/index.js`
  - `dist/runtime-core.js`
  - `openclaw.plugin.json`
  - `package.json`
  - `runtime/beai-runtime-lib.cjs`
- release note `RELEASE-NOTES-v0.6.17-ko.md`는 실제 pack 결과에 포함되지 않음

Flow regression:

- `beai-flow-regression-gate`: 27/27 pass
- lane:
  - self-check 3/3
  - engineering-quality 2/2
  - field-readiness 15/15
  - perceived-quality 3/3
  - release-checklist 4/4

User scenario audit:

- total 17
- pass 14
- partial 1
- fail 2
- P0 failures 3개
- P1 failures 1개

Doctor package check:

- package_status: `ready`
- required_file_status: `ready`
- telegram_delivery_contract_status: `ready`

Ops-check:

- status: `ready`
- external action boundary detected
- real sends, payments, bookings, webhooks는 approval boundary 필요
- production launch surface는 없음

## 기능/정합성 판정

### 통과한 축

Runtime build와 syntax:

- TypeScript build와 dist syntax check는 통과했다.
- runtime source와 dist가 현재 빌드 가능한 상태다.

Telegram visible delivery 경계:

- 내부 final answer를 Telegram delivery로 보지 않는 계약이 있다.
- Telegram direct 완료는 message tool과 messageId 확인을 요구한다.
- generated response는 messageId 전까지 unverified로 남기는 계약이 있다.

반복 footer / stale handle 방지:

- runtime에 repeated footer sanitizer가 있다.
- decision handle을 footer처럼 반복하지 말라는 guard가 있다.
- stale closure handle이 handoff/session seed 경로에서 다시 살아나는 위험을 낮췄다.

BEAI surface가 Telegram 답변을 가로채는 문제:

- Telegram direct non-install hard surface는 observer-only로 남기는 계약과 runtime 흔적이 있다.
- Flow regression gate도 해당 회귀를 검사한다.

Memory / Knowledge Loop 경계:

- auto-capture와 auto-approve가 분리되어 있다.
- approved 상태는 explicit user approval이 필요하다는 문서 기준이 있다.

Korean response quality:

- 검증/적용/전송/배포 상태를 섞지 말라는 한국어 기준 문서가 있다.
- tool/process log overexposure를 줄이는 runtime pattern도 있다.

### 실패 또는 차단된 축

P0: 실제 npm pack 결과와 dist 의도 불일치

- `package.dist.json.files`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 있다.
- `package.json.files`에는 없다.
- 실제 `npm pack --dry-run`에서도 release note가 빠졌다.
- 반대로 `README.dist.md`는 실제 pack 결과에 포함된다.
- 이 상태에서는 "패키지에 무엇이 들어가는가"를 문서나 dist 의도만 보고 확정하면 안 된다.

P0: package default와 local live evidence 혼재

- capability manifest와 README에 새 사용자 기본 설치 상태와 윤의 로컬 live automation evidence가 섞여 보일 위험이 있다.
- cron/watchdog/persistent lane/force-run 류 증거는 public/default package manifest가 아니라 local verification ledger로 분리해야 한다.

P0 후보: Doctor `--help` usage-only 실패

- `node capability-pack/tools/beai-doctor.js --help`를 실행했을 때 도움말만 출력하지 않았다.
- 실제 진단이 실행되어 `approval_required` 결과가 나왔다.
- 2차 감사에서는 P1로 잡혔지만, 3차 재현 기준으로는 사용자 통제권 문제라 P0 후보로 올린다.
- 도움말 조회는 어떤 진단, 로그 스캔, 상태 판정도 하지 않고 usage 출력 후 종료해야 한다.

Harness completion blocker:

- Harness는 패키지 루트에서 verification command를 감지하지 못했다.
- scenario success / empty / failure-recovery test files도 감지하지 못했다.
- 개별 도구 검증은 있지만, 전체 패키지 품질을 한 번에 검증하는 대표 명령이 없다.

Live reload 미검증:

- live/package 파일 반영은 확인된 바 있지만, Gateway reload/restart는 이번 감사에서 하지 않았다.
- 따라서 실행 중인 프로세스가 최신 runtime을 물었는지는 별도 검증 대상이다.

Live Telegram roundtrip 미검증:

- 이번 3차 감사는 local/read-only/dry-run 중심이다.
- 실제 Telegram 왕복 전송, messageId 확인, 긴 작업 progress 도착성은 실행하지 않았다.

## 성능과 효율 관점

좋아진 점:

- Flow regression gate는 27개 정적 회귀를 빠르게 확인한다.
- Doctor package check는 package-level 준비도를 빠르게 요약한다.
- User scenario audit는 사용자 불편 가능성을 구조화한다.
- visible delivery contract는 완료 과장과 Telegram silent failure를 줄이는 데 직접적이다.

효율 문제:

- 검증 명령이 분산되어 있다. build/test/audit/flow gate/doctor check/scenario audit/npm pack dry-run/Harness verify를 각각 알아야 한다.
- 패키지 루트에 대표 `verify` 명령이 없어 Harness가 프로젝트 완성도를 낮게 평가한다.
- Doctor `--help`가 진단을 실행하면 도움말 확인도 느리고 부담스러운 동작이 된다.
- 일반 운영 Telegram 세션에서 긴 진단을 계속하면 세션 크기와 응답 지연 리스크가 커진다.

권장 효율 개선:

- 루트에 read-only 대표 검증 명령 추가
- scenario audit을 대표 검증 명령에 포함
- npm pack dry-run file list 검사를 자동화
- Doctor help를 즉시 종료로 수정
- 긴 진단은 일반 Telegram 운영 세션과 분리하는 정책 문서화

## 수정 우선순위

P0:

1. `plugin/beai-runtime/package.json.files`와 `package.dist.json.files` 정합화
2. 실제 `npm pack --dry-run` 결과를 검사하는 package truth check 추가
3. capability manifest / README에서 local live evidence와 package default 분리
4. Doctor `--help`를 usage-only로 수정
5. 패키지 루트 대표 검증 명령 추가

P1:

1. runtime-level fixture test 추가
   - stale footer
   - Telegram transcript current request extraction
   - generated/send_attempted/delivered/messageId ledger
   - Telegram direct hard surface observer-only
   - zip attachment install intent preservation
2. Doctor stale log freshness window 강화
3. 긴 작업 visible progress 도착성 검증을 package/local/live 단계로 분리
4. clean OpenClaw environment install 검증 계획 추가

P2:

1. 한국어 기준 문서와 runtime response coach 간 연결 강화
2. ClawHub copy와 release README 간 문구 정합성 점검
3. generated verification docs 목록을 package README에서 더 쉽게 찾게 정리

## 이번 감사에서 하지 않은 것

- OpenClaw core 변경 안 함
- Gateway restart 안 함
- Telegram provider/config 변경 안 함
- cron/agent 등록 안 함
- release zip 생성 안 함
- public publish 안 함
- live Telegram roundtrip 안 함
- 사용자 memory write 안 함

## 3차 결론

BEAI Package는 핵심 안전장치의 방향은 맞다. 특히 Telegram visible delivery, stale footer, current input preservation, auto-capture/not-auto-approve, observer-only surface guard는 사용자 신뢰를 보호하는 쪽으로 이미 설계되어 있다.

하지만 BEAI Harness 기준으로는 아직 "전체 패키지 완성"이라고 부를 수 없다. 개별 검증은 통과했지만, 대표 검증 명령과 developer-owned scenario test layer가 없고, 실제 npm pack 결과와 dist 의도가 어긋나며, Doctor help가 usage-only로 닫히지 않는다.

따라서 다음 수정/보강 작업은 새 기능 확장보다 `package truth`, `default/local evidence 분리`, `Doctor UX`, `대표 verify command`, `runtime scenario fixtures` 순서로 진행해야 한다.

사용한 스킬: beai-harness (비아이 하네스), beai-development-steward (개발 스튜어드), beai-doctor (비아이 닥터), beai-release-verifier (배포 검증관)
판단 기준: Harness 검증 게이트 · 사용자 시나리오 · 패키지 정합성 · Telegram 전달 경계 · 배포 진실성

## 수정/보강 후 Harness 관점 상태

2026-07-02 package-internal repair/hardening 이후 Harness가 막혔던 package verification surface가 추가되었다.

새 증거:

- `docs/BEAI-PACKAGE-REPAIR-CLOSEOUT-20260702-ko.md`
- `docs/03-verification/generated/beai-package-verify.json`
- `docs/03-verification/generated/beai-package-truth-check.json`
- `docs/03-verification/generated/beai-user-scenario-audit-after-p0.json`
- `docs/03-verification/generated/beai-flow-regression-gate-after-p0.json`

수정 후 상태:

- 대표 package verify: pass
- package truth check: pass
- user scenario audit: 17/17 pass
- flow regression gate: 27/27 pass
- Doctor help usage-only: pass
- stale claim scan: pass

남은 Harness 경계:

- live runtime reinstall/relink, Gateway restart/reload, Telegram visible roundtrip, release zip, public publish는 이번 패키지 내부 수정 범위 밖이다.
- 해당 항목들은 별도 승인과 live/release 검증으로만 닫는다.
