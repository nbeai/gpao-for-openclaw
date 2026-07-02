# BEAI Package Repair and Hardening Plan

작성일: 2026-07-02
대상: BEAI Package for OpenClaw repository root
상태: 감사 결과 기반 수정/보강 실행 계획

## 1. 목표

1차 전체 감사, 2차 사용자 시나리오 감사, 3차 BEAI Harness 감사를 기준으로 BEAI 패키지를 "작동은 대체로 확인된 후보"에서 "패키징, 문서, 사용자 통제권, 시나리오 회귀까지 닫힌 후보"로 올린다.

이번 계획의 목표는 public release가 아니다. 먼저 패키지 내부 정합성과 검증 경로를 닫고, 이후 별도 승인 아래 live 적용과 배포 후보 생성을 분리한다.

## 2. 현재 기준선

확인된 통과 항목:

- runtime build 통과
- runtime syntax test 통과
- production dependency audit 취약점 0
- flow regression gate 27/27 pass
- doctor package check `package_status: ready`
- 핵심 런타임 회귀: 반복 footer, stale handle, Telegram hard surface, internal final delivery 혼동, messageId 없는 완료 주장 방어 항목 통과

남은 차단 항목:

- user scenario audit: 17개 중 pass 14 / partial 1 / fail 2
- BEAI Harness verify/scenario/closeout: root-level verification command와 developer-owned scenario fixture 부족으로 blocked
- npm pack 실제 결과와 dist 의도 불일치
- package default 상태와 윤의 local live evidence 혼재
- `beai-doctor.js --help`가 도움말만 보여주지 않고 실제 진단 실행

## 3. 범위

이번 수정 범위:

- `beai-package-for-openclaw` 내부 패키징, 문서, 검증 도구, 시나리오 테스트, Doctor UX
- BEAI Runtime package source/dist의 패키지 정합성
- capability pack manifest/README/release note의 사실성 정리
- generated verification evidence의 재생성

이번 계획에서 제외:

- OpenClaw core 수정
- Gateway restart/reload
- Telegram provider 설정 변경
- cron/agent 등록 또는 변경
- release zip 생성
- public publish
- live runtime reinstall/relink

## 4. 우선순위별 수정 항목

### P0-A. 패키징 진실성 정리

문제:

- `plugin/beai-runtime/package.dist.json`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 포함 의도로 보이지만, 실제 `package.json.files`에는 빠져 있다.
- `npm pack --dry-run` 결과에는 release note가 빠지고 `README.dist.md`가 포함된다.

수정:

- `plugin/beai-runtime/package.json`과 `package.dist.json`의 `files` 목록을 하나의 의도에 맞춘다.
- `README.dist.md` 포함 여부를 명시적 정책으로 정한다.
- release note 포함 여부를 실제 pack 결과로 검증한다.
- `npm pack --dry-run --json` 결과를 비교하는 package truth check를 추가한다.

완료 기준:

- `npm pack --dry-run --json` 결과와 dist 의도가 일치한다.
- 누락/초과 파일이 있으면 검증 실패로 떨어진다.

### P0-B. package default와 local live evidence 분리

문제:

- capability manifest/README가 새 사용자 기본 설치 상태와 윤의 로컬 cron/watchdog/persistent lane/live evidence를 섞어 보여줄 위험이 있다.

수정:

- `capability-pack.json`과 기본 README에는 새 사용자가 받는 기본 패키지 기능만 남긴다.
- 윤의 로컬 live evidence는 `docs/03-verification/` 아래 별도 local evidence ledger로 분리한다.
- 문서 표현을 `configured`, `registered`, `callable`, `call succeeded`, `output verified` 단계로 구분한다.

완료 기준:

- public/default 문서만 읽어도 로컬 전용 cron/watchdog/live 상태를 기본 제공 기능으로 오해하지 않는다.
- local evidence는 별도 문서에서만 추적된다.

### P0-C. Doctor 도움말과 사용자 통제권 보강

문제:

- `node capability-pack/tools/beai-doctor.js --help`가 usage-only가 아니라 실제 진단으로 진입해 `approval_required`를 낸다.

수정:

- `--help`와 `-h`는 도움말 출력 후 즉시 종료한다.
- 도움말 경로에서는 파일 검사, 로그 검사, approval 판단, external probe를 실행하지 않는다.
- regression gate 또는 package verify에 `doctor --help` 시나리오를 추가한다.

완료 기준:

- `beai-doctor.js --help`가 exit 0, usage-only, side-effect 없음으로 끝난다.
- `--check package` 동작은 기존 package_status 판단을 유지한다.

### P0-D. 대표 검증 명령 추가

문제:

- BEAI Harness가 패키지 전체를 닫을 root-level verification command를 찾지 못했다.

수정:

- 루트 또는 capability-pack에 대표 검증 명령을 추가한다.
- 검증 항목은 runtime build/syntax, prod audit, doctor package check, flow regression gate, user scenario audit, npm pack truth check, stale-doc scan을 포함한다.
- JSON/Markdown 결과를 `capability-pack/docs/03-verification/generated/`에 남긴다.

완료 기준:

- 한 명령으로 현재 패키지 후보 상태를 재현할 수 있다.
- Harness verify/scenario/closeout이 "검증 명령 없음" 때문에 blocked 되지 않는다.

### P1-E. 사용자 시나리오 실패 항목 수리

문제:

- user scenario audit가 17개 중 2 fail, 1 partial 상태다.

수정:

- 실패 원인을 P0-A, P0-B, P0-C와 연결해 먼저 제거한다.
- 남는 partial/fail은 별도 runtime fixture 또는 문서 정합성 테스트로 승격한다.
- `--output`과 `--stdout` 병행 시 파일 출력이 보장되는 정책을 flow/user scenario 도구에 맞춘다.

완료 기준:

- user scenario audit가 pass 되거나, 남은 항목이 명시적 deferred 사유와 승인 경계로 분리된다.

### P1-F. 런타임 시나리오 fixture 보강

보강할 fixture:

- 반복 footer/stale handle 재발 방지
- Telegram transcript에서 최신 실제 사용자 요청 추출
- Telegram direct hard surface에서 internal final을 delivery로 착각하지 않기
- messageId 없는 완료 주장 방지
- long work visible progress 경계
- memory auto-capture가 approval/automation으로 승격되지 않는지 확인
- install zip intent와 package manifest 정합성

완료 기준:

- 회귀가 문서 주장만이 아니라 실행 가능한 fixture로 남는다.

### P1-G. 문서 stale claim 정리

문제:

- 일부 문서에 예전 `20/20 pass`, `197 passed`, `openclaw@2026.6.9`, evidence가 약한 Telegram live roundtrip claim이 남아 있다.

수정:

- README, README.dist, capability README, manifest, release note에서 stale claim을 제거하거나 최신 검증 결과로 교체한다.
- live reload, Telegram visible delivery, release zip, publish는 미검증이면 미검증으로 적는다.

완료 기준:

- 문서가 실제 evidence ledger보다 강한 주장을 하지 않는다.

### P2-H. live validation과 release candidate 분리

수정 후에도 별도 승인 전에는 하지 않는 것:

- Gateway restart/reload
- live plugin reinstall/relink
- Telegram live test send
- release zip 생성
- public publish

승인 후 live validation 항목:

- 실제 live plugin version 확인
- hooks/tasks/gateway 상태 확인
- Telegram visible delivery는 messageId 기준으로만 완료 판정
- live와 package runtime checksum 재확인

release candidate 조건:

- package verify pass
- user scenario audit pass 또는 deferred 명확화
- doctor package check ready
- npm pack truth check pass
- stale-doc scan pass
- clean install 또는 dry-run evidence 확보

## 5. 실행 순서

1. 현재 상태 고정
   - `git status`와 감사 산출물 목록을 기록한다.
   - 기존 사용자 변경과 이번 수정 범위를 분리한다.

2. P0 수정
   - pack files 정합성
   - local/default evidence 분리
   - Doctor `--help` usage-only
   - 대표 verify 명령 추가

3. P1 보강
   - user scenario audit 실패 항목 수리
   - runtime fixture 추가
   - flow/user scenario output 정책 통일
   - stale claim 정리

4. 검증 재실행
   - runtime build
   - syntax test
   - prod dependency audit
   - doctor package check
   - flow regression gate
   - user scenario audit
   - package truth check
   - representative verify command
   - Harness verify/scenario/closeout

5. 결과 문서화
   - generated evidence 재생성
   - 1/2/3차 감사 문서에 "수정 후 상태"를 append
   - 남은 항목은 P0/P1/P2와 approval-gated로 분리

6. 승인 필요 단계 대기
   - live 적용, Gateway reload, Telegram live validation, release zip, public publish는 별도 승인 후 진행한다.

## 6. 최종 완료 판정

수정/보강 작업은 다음 조건을 만족할 때 닫는다.

- 패키지 기본 문서가 로컬 전용 증거를 기본 기능처럼 말하지 않는다.
- `npm pack --dry-run --json` 결과와 의도 파일 목록이 일치한다.
- `beai-doctor.js --help`는 usage-only로 종료한다.
- 대표 verify 명령 하나로 패키지 상태를 재현할 수 있다.
- user scenario audit가 pass 되거나, 남은 항목이 명확한 deferred로 분리된다.
- Harness verify/scenario/closeout이 missing command/tests 때문에 blocked 되지 않는다.
- live/release/public 상태를 검증 전 완료로 말하지 않는다.

## 7. 실행 후 상태

2026-07-02 package-internal repair/hardening 실행 결과는 `BEAI-PACKAGE-REPAIR-CLOSEOUT-20260702-ko.md`에 닫았다.

닫힌 항목:

- package files 정합성
- npm pack truth check
- Doctor `--help` usage-only
- package default와 local live evidence 분리
- user scenario audit 17/17 pass
- flow regression gate 27/27 pass
- 대표 package verify pass
- stale claim scan pass

남긴 항목:

- live runtime reinstall/relink
- Gateway restart/reload
- Telegram live roundtrip
- release zip 생성
- public publish

위 항목은 이번 패키지 내부 수정 범위가 아니라 별도 승인 후 진행할 live/release 검증 단계다.
