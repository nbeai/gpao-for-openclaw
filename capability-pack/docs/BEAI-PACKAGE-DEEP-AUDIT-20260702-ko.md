# BEAI Package Deep Audit - 2026-07-02

## 범위

이 문서는 BEAI Package for OpenClaw의 전체 작동 흐름, 구성 프로그램별 완성도, 기능 정확성, 검증 상태, 배포 경계, Telegram 운영 신뢰성을 1차 정밀 감사한 기록이다.

이번 감사에서 수행한 것은 읽기, 빌드, dry-run, 상태 조회, 문서/manifest/도구 검토다.

이번 감사에서 하지 않은 것:

- OpenClaw core 변경
- Gateway restart
- Telegram 설정 변경
- cron, hook, agent 등록 또는 변경
- live runtime 재설치
- release zip 생성
- public publish
- durable memory write

## 현재 판정

BEAI Package는 `alpha / public staging`이라는 README의 상태 정의와 대체로 맞다.

현재 상태는 `controlled alpha review`로는 의미가 있지만, `stable installer`, `one-command production install`, `public-ready complete package`로 부르기에는 이르다.

가장 중요한 이유는 기능 코드가 전혀 없는 문제가 아니라, 상태 주장과 검증 증거의 경계가 아직 충분히 단단하지 않기 때문이다. BEAI Package의 핵심 가치가 "확인된 것, 추정, 미검증, 적용, 전송, 배포를 분리하는 것"이므로 이 부분은 제품 핵심 품질 문제로 봐야 한다.

## 구성 지도

### 1. Runtime Plugin

위치:

- `plugin/beai-runtime`

확인된 상태:

- package name: `@nbeai/beai-runtime`
- package version: `0.6.17`
- OpenClaw plugin id: `beai-runtime`
- OpenClaw plugin manifest version: `0.6.17`
- live OpenClaw plugin list에서 `BEAI Runtime` enabled 확인
- live source path는 `~/Developer/BEAI/beai-layer.nosync/plugin/beai-runtime/dist/index.js`

주요 역할:

- 현재 요청 추출
- evidence / assumptions / unknown 분리
- runtime overlay 생성
- memory candidate 및 project/session state 후보 분리
- Telegram delivery ledger 작성
- visible progress / quick first status / phase timing 계약 관찰
- 일부 response surface의 하드 개입 또는 observer-only 처리

감사 판단:

- 기본 구조는 작동한다.
- hook 개입면이 넓으므로 regression coverage를 더 구체적인 시나리오 테스트로 보강해야 한다.
- `before_agent_reply`는 install/resume 계열을 제외하면 Telegram direct에서 특히 보수적으로 유지해야 한다.
- `reply_payload_sending`은 여전히 payload text를 append 형태로 바꿀 수 있으므로, "replace는 아니지만 user-facing payload mutation"이라는 사실을 명확히 관리해야 한다.

### 2. Capability Pack

위치:

- `capability-pack`

확인된 상태:

- id: `beai-capability-pack`
- version: `0.2.0`
- status: `internal-team-upgrade-candidate`
- skill count: 7
- candidate module count: 5

주요 구성:

- BEAI Doctor
- BEAI Development Steward
- BEAI Release Verifier
- BEAI Knowledge Loop
- BEAI Korean Natural Writing
- Session Handoff
- Memory Curator Review
- Starter Agent 후보
- Trust Gate / Connector Onboarding / Telegram Delivery Contract

감사 판단:

- 제품 방향은 좋다.
- package default와 윤의 local live workspace evidence가 manifest/README 안에서 섞여 있다.
- cron UUID, force-run 상태, local zip 후보, live automation evidence는 public/default manifest가 아니라 별도 local evidence ledger로 분리하는 편이 안전하다.

### 3. Doctor

위치:

- `capability-pack/tools/beai-doctor.js`
- `capability-pack/skills/beai-doctor/SKILL.md`

확인된 상태:

- Node syntax check 통과
- package check에서 required file status `ready`
- Telegram delivery contract check `ready`
- live 운영 진단에서는 `approval_required` 이슈를 다수 감지

감사 판단:

- Doctor가 Gateway reachable과 Telegram healthy를 분리하는 방향은 맞다.
- 다만 `--help` 호출이 help만 출력하지 않고 실제 check를 실행했다. CLI UX와 안전성 면에서 고쳐야 한다.
- package cwd에서 실행하면 `BEAI Layer root: not found`가 나오는데, package audit mode와 live layer mode를 명확히 분리해야 한다.
- 최근 로그 기반 이슈 감지는 유용하지만 stale/false-positive 가능성이 있다. 각 issue에 evidence window와 freshness를 붙여야 한다.

### 4. Flow Regression Gate

위치:

- `capability-pack/tools/beai-flow-regression-gate.mjs`

확인된 상태:

- Node syntax check 통과
- `27/27 pass`
- repeated footer regression guard 포함
- Telegram hard surface observer-only guard 포함

감사 판단:

- 현재 gate는 중요한 안전핀이다.
- 하지만 대부분 정규식 기반 정적 검사라 실제 turn simulation을 증명하지는 않는다.
- BEAI Runtime의 핵심 사고는 "특정 문구가 코드에 존재하는가"보다 "입력/세션/Telegram surface 조합에서 실제로 어떻게 동작하는가"가 중요하므로 scenario fixture test가 필요하다.

### 5. Knowledge Loop

확인된 상태:

- package manifest와 README는 daily cron, missed-run recovery, external signal fetch, bounded memory append, Telegram delivery, persistent review lane, Gateway/Telegram watchdog 등의 live-applied evidence를 서술한다.

감사 판단:

- Auto-capture, not auto-approve 원칙은 좋다.
- 다만 package README와 manifest가 local live automation 상태를 많이 포함한다.
- 새 사용자에게는 "패키지 기본 포함 기능"과 "윤의 작업환경에서 이미 등록된 automation evidence"가 다르게 읽혀야 한다.

### 6. Korean Natural Writing

확인된 상태:

- docs와 skill이 package에 포함됨
- README / capability-pack manifest / doctor package check에서 required component로 다룸

감사 판단:

- BEAI Package가 상태를 과장하지 않기 위한 핵심 UX 장치로 의미가 있다.
- 다만 이 기준이 runtime의 실제 final output sanitizer와 얼마나 연결되는지는 더 검증해야 한다.

## 실행한 검증

### Runtime

명령:

```bash
cd plugin/beai-runtime
npm run build
npm test
npm audit --omit=dev --json
npm pack --dry-run --json
```

결과:

- `npm run build`: pass
- `npm test`: pass
- `node --check dist/index.js`: pass
- `node --check dist/runtime-core.js`: pass
- prod dependency audit: 0 vulnerabilities
- npm pack dry-run: pass
- npm pack dry-run output: `nbeai-beai-runtime-0.6.17.tgz`, 7 entries, package size 136337 bytes

### Capability Pack

명령:

```bash
cd capability-pack
node --check tools/beai-doctor.js
node --check tools/beai-doctor-package-check.mjs
node --check tools/beai-flow-regression-gate.mjs
node tools/beai-doctor-package-check.mjs
node tools/beai-flow-regression-gate.mjs --root . --format md --stdout
```

결과:

- Doctor syntax: pass
- Doctor package check syntax: pass
- Flow regression gate syntax: pass
- Doctor package check: `package_status: ready`
- Flow regression gate: `27/27 pass`

### OpenClaw / Live 상태 조회

명령:

```bash
openclaw plugins list
openclaw hooks
openclaw plugins doctor
openclaw channels status --channel telegram --probe
openclaw status --deep
```

결과:

- BEAI Runtime enabled, version `0.6.17`
- Hooks: `6/6 ready`
- `beai-runtime-progress-ack` hook ready
- `openclaw plugins doctor`: No plugin issues detected
- Telegram channel probe: enabled, configured, running, connected, `works`
- Gateway reachable
- OpenClaw update available: npm `2026.6.11`
- Tasks: 0 active / 0 queued / 0 running / 46 issues / audit clean / 179 tracked
- Sessions: 120 active

주의:

- Telegram probe success는 현재 transport/readiness를 보여준다.
- 이것만으로 모든 사용자-visible reply roundtrip이 검증됐다고 말하면 안 된다.
- 이번 감사는 별도 테스트 메시지 발송이나 Gateway restart를 하지 않았다.

### 실행하지 못한 검증

명령:

```bash
clawhub package validate
```

결과:

- `clawhub: command not found`

판정:

- ClawHub validate는 이번 환경에서 미검증이다.
- public ClawHub release readiness를 닫을 수 없다.

## 주요 발견

### P0 - 배포 주장과 실제 package dry-run 파일 목록 불일치

증거:

- `plugin/beai-runtime/package.json`의 `files`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 없다.
- `plugin/beai-runtime/package.dist.json`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 있다.
- `npm pack --dry-run --json` 결과에는 release note가 포함되지 않았다.
- dry-run 결과에는 `README.dist.md`가 포함되었다.

의미:

- 현재 `package.json` 기준 npm/ClawHub 패키지는 의도한 dist package와 다르게 만들어질 수 있다.
- release note를 포함한다고 문서에 쓰면서 실제 패키지에는 빠지는 상태가 될 수 있다.

권장 조치:

- `package.json`과 `package.dist.json`의 files 정책을 하나로 정리한다.
- `README.dist.md`가 들어가야 한다면 의도적으로 명시한다.
- release note가 들어가야 한다면 `package.json.files`에도 포함한다.
- `npm pack --dry-run --json` 결과를 regression gate에 넣는다.

### P0 - 문서 상태 주장 stale

증거:

- `plugin/beai-runtime/README.dist.md`는 `beai-flow-regression-gate: 20/20 pass`라고 말한다.
- 현재 실행 결과는 `27/27 pass`다.
- 같은 문서에 `openclaw@2026.6.9` 기준 audit note가 남아 있다.
- 현재 runtime package dependency와 OpenClaw plugin metadata는 `2026.6.10` 기준이다.
- `plugin/beai-runtime/README.md`는 `Tests: 197 passed`, `Telegram live roundtrip: verified after gateway restart`라고 말한다.
- 최근 검증 문맥은 live roundtrip과 Gateway reload를 별도 상태로 남겨야 하는 흐름이다.

의미:

- BEAI Package가 스스로 중요하게 여기는 상태 분리 원칙을 문서가 일부 위반한다.
- 사용자가 문서만 보고 검증이 닫힌 것으로 오해할 수 있다.

권장 조치:

- runtime README와 README.dist의 verification block을 현재 검증 결과와 동일하게 갱신한다.
- live roundtrip은 실제 messageId evidence가 있는 특정 날짜/파일과 연결하거나 `unverified in this audit`로 낮춘다.
- gate count는 수동 숫자 대신 generated verification output을 참조하게 한다.

### P0 - Capability Pack manifest가 package default와 local live evidence를 섞음

증거:

- `capability-pack/capability-pack.json`은 Knowledge Loop `registeredAutomations`에 실제 cron UUID와 `enabled-force-run-ok` 상태를 담고 있다.
- README도 daily cron, missed-run recovery, Telegram run delivery, persistent lane, watchdog이 local workspace에 적용됐다고 상세히 말한다.

의미:

- 새 사용자/공개 패키지 입장에서는 이것이 기본 설치 상태인지, 윤의 local workspace evidence인지 혼동될 수 있다.
- BEAI Package가 "무엇을 설치하는가"와 "윤의 환경에서 무엇이 이미 검증됐는가"를 분리해야 한다.

권장 조치:

- package manifest에는 packaged capability만 남긴다.
- local live evidence는 `docs/03-verification/local/` 또는 별도 evidence ledger로 분리한다.
- public README에는 "local evidence is not installed by default"를 명시한다.

### P1 - Package-local test가 너무 약함

증거:

- `npm test`는 `node --check dist/index.js && node --check dist/runtime-core.js`만 수행한다.
- 이전 live runtime Vitest evidence는 있었지만 package repo의 기본 test script에는 deterministic scenario test가 없다.
- flow regression gate는 대부분 static regex check다.

의미:

- repeated footer, Telegram direct hard surface, install intent preservation 같은 핵심 실패는 정규식 존재만으로 충분히 증명되지 않는다.

권장 조치:

- package-local scenario fixtures를 추가한다.
- 최소 fixtures:
  - Telegram direct normal request must not be replaced by BEAI surface
  - stale recovery plan must not override current input
  - repeated footer phrase must be sanitized in every rendered field
  - install zip intent must be preserved as install flow
  - internal final without messageId must remain unverified
  - reply_payload_sending must remain candidate-only

### P1 - Doctor CLI `--help`가 실제 check를 실행함

증거:

- `node tools/beai-doctor.js --help` 실행 시 usage/help 대신 실제 diagnosis가 실행되고 output을 냈다.

의미:

- 사용자가 도움말만 보려다 live/read-only 상태 조회를 실행할 수 있다.
- Doctor가 안전 경계를 강조하는 도구라면 CLI UX도 그 기준을 따라야 한다.

권장 조치:

- `--help` / `-h`는 usage만 출력하고 종료한다.
- `--mode=check`, `--mode=wake-guard`, `--deep`, `--json` 등 지원 모드를 명시한다.
- package mode와 live mode를 분리한다.

### P1 - Doctor 이슈 freshness가 부족함

증거:

- Doctor는 최근 로그 기반으로 `message-tool-send-blocked`, `beai-reply-payload-rewrite-hook-active`, `beai-hook-registration-issue` 등을 감지했다.
- 같은 감사에서 `message(action=send)`는 정상 동작한 것으로 보이며, `openclaw plugins doctor`, `openclaw hooks`, `openclaw channels status --probe`는 통과했다.

의미:

- Doctor가 stale log를 현재 장애처럼 강하게 말할 수 있다.
- 유용한 의심 신호와 현재 장애를 분리해야 한다.

권장 조치:

- issue마다 evidence source, timestamp, freshness window를 붙인다.
- stale issue는 `historical_signal` 또는 `review`로 낮춘다.
- 현재 probe와 충돌하는 issue는 "not currently reproduced"로 표기한다.

### P1 - Telegram UX payload append는 제품적으로 더 엄격히 관리 필요

증거:

- `reply_payload_sending`에서 `rewriteReplyPayloadForTelegramUxState()`가 payload text에 guide를 append할 수 있다.
- code note는 "without replacing original payload"라고 말하지만, 실제 user-facing payload text는 바뀐다.

의미:

- replace가 아니어도 Telegram 사용자에게는 답변 변경으로 보인다.
- 이전 사고가 "runtime surface가 실제 답변을 덮는 문제"였기 때문에 append도 정책적으로 좁게 유지해야 한다.

권장 조치:

- append 허용 조건을 더 좁힌다.
- 원문 답변 앞부분이 유지됐는지 regression test로 확인한다.
- approval wait/internal progress guide는 중복 append와 over-help를 막는 테스트를 둔다.

### P1 - Runtime source가 너무 커져 유지보수 위험 증가

증거:

- `plugin/beai-runtime/src/runtime-core.ts`: 8284 lines
- `plugin/beai-runtime/src/index.ts`: 2733 lines
- `tools/beai-doctor.js`: 1982 lines

의미:

- 기능은 계속 들어가지만 사고 지점별 책임 경계가 흐려질 수 있다.
- runtime hot path, state rendering, Telegram delivery, memory/session 판단이 한 파일 안에서 함께 커지고 있다.

권장 조치:

- 당장 대규모 refactor는 하지 않는다.
- 먼저 test coverage를 만든 뒤 다음 단위로 분리한다:
  - current input extraction
  - footer/surface sanitizer
  - Telegram delivery ledger
  - approval/risk profile
  - memory/session continuity
  - package/release judgment

### P2 - ClawHub validation tool availability가 검증되지 않음

증거:

- `clawhub package validate`: command not found

의미:

- public ClawHub install readiness는 이번 감사에서 닫을 수 없다.

권장 조치:

- ClawHub validation을 OpenClaw CLI 내 실제 명령으로 통일하거나, README의 명령을 현재 설치 가능한 도구 기준으로 바꾼다.

### P2 - OpenClaw host update available

증거:

- `openclaw status --deep`: update available `2026.6.11`
- runtime package dependency/build metadata: `2026.6.10`

의미:

- 지금 당장 장애 증거는 아니다.
- 하지만 public package compatibility matrix에는 `2026.6.10`과 `2026.6.11`의 차이를 확인해야 한다.

권장 조치:

- update 전후 호환성 검증을 별도 matrix로 둔다.
- update 자체는 사용자 승인 없이는 하지 않는다.

## 우선 수정/보강 계획

### 바로 패치 가능한 것

1. `package.json.files`와 `package.dist.json.files` 정합성 수정
2. runtime README / README.dist stale verification block 수정
3. capability README / manifest의 local live evidence와 package default 분리
4. Doctor `--help` 구현
5. Doctor issue freshness field 추가
6. npm pack dry-run 결과 검사 추가

### 테스트 먼저 필요한 것

1. Telegram direct non-install surface observer-only scenario
2. stale footer sanitizer scenario
3. stale recovery plan not overriding current input scenario
4. reply_payload_sending append preservation scenario
5. generated/send_attempted/delivered/messageId ledger scenario
6. install zip intent preservation scenario

### 승인 없이는 하지 않을 것

1. Gateway restart
2. Telegram provider/config 변경
3. cron/watchdog 추가 또는 변경
4. OpenClaw core 변경
5. public publish
6. release zip 생성
7. live plugin reinstall/relink

## 감사 결론

BEAI Package는 방향과 핵심 안전장치는 이미 의미 있는 수준까지 올라와 있다. 특히 Runtime 0.6.17, Telegram delivery contract, Doctor, Flow Regression Gate는 실제 문제를 제품 기준으로 끌어올리는 역할을 한다.

하지만 지금 단계의 가장 큰 약점은 "작동하지 않는다"가 아니라 "무엇이 실제로 검증됐는지, 무엇이 로컬 증거인지, 무엇이 배포물에 포함되는지, 무엇이 public install 상태인지"가 아직 문서와 manifest에서 흔들린다는 점이다.

따라서 다음 개발 축은 새 기능 추가보다 `상태 주장 정밀화 + package dry-run 정합성 + scenario regression`이 우선이다. 이 축을 먼저 닫아야 BEAI Package가 자기 철학인 "확인된 것과 미확인을 섞지 않는다"를 제품 자체에서도 지킬 수 있다.

## 2차 사용자 시나리오 감사 추가 기록

윤의 후속 요청에 따라 사용자 입장에서 BEAI Package가 적용된 OpenClaw 사용 중 겪을 수 있는 오류 가능성과 불편 가능성을 다시 점검했다.

추가한 도구:

- `capability-pack/tools/beai-user-scenario-audit.mjs`

생성한 리포트:

- `capability-pack/docs/BEAI-PACKAGE-USER-SCENARIO-AUDIT-20260702-ko.md`
- `capability-pack/docs/03-verification/generated/beai-user-scenario-audit.json`
- `capability-pack/docs/03-verification/generated/beai-user-scenario-audit.md`

실행 결과:

- total: 17
- pass: 14
- partial: 1
- fail: 2
- overall status: `fail`

새 감사에서 통과한 사용자 위험:

- Telegram 일반 요청이 BEAI before_agent_reply 표면 응답으로 대체되는 문제
- 내부 final이나 generated response만으로 Telegram 완료를 주장하는 문제
- 반복 footer / stale decision handle 문제
- 긴 작업 중 visible progress 기준 부재 문제
- memory auto-capture가 auto-approve로 승격되는 문제
- 내부 tool/process log overexposure 위험의 기본 guard

새 감사에서 실패한 사용자 위험:

- P0: `plugin/beai-runtime/package.json.files`와 `package.dist.json.files`가 다르다. `RELEASE-NOTES-v0.6.17-ko.md`가 dist 의도에는 있지만 package.json 기준 pack 파일 목록에는 빠져 있다.
- P0: `capability-pack/capability-pack.json`과 `capability-pack/README.md`가 package default와 윤의 local live automation evidence를 섞고 있다.
- P1: `beai-doctor.js --help`가 usage-only로 닫히는지 보장되지 않는다.

이 2차 감사 기준으로 다음 수정 순서는 더 선명해졌다.

1. runtime package files 정합화
2. local live evidence와 default package manifest 분리
3. README / README.dist verification claim 갱신
4. Doctor `--help` usage-only 처리
5. scenario audit을 release verifier / flow gate에 연결
6. runtime turn simulation fixture 추가

## 3차 BEAI Harness 감사 추가 기록

윤의 후속 요청에 따라 BEAI Harness를 적용해 기능, 성능, 정밀함, 정교함, 정합성, 작동성, 효율까지 다시 점검했다.

추가 생성한 Harness 증거:

- `.beai-harness/route.md`
- `.beai-harness/brief.md`
- `.beai-harness/plan.md`
- `.beai-harness/scenario.json`
- `.beai-harness/scenario-test-plan.md`
- `.beai-harness/scenario-run.md`
- `.beai-harness/ops-check.md`
- `.beai-harness/closeout.md`

추가 리포트:

- `capability-pack/docs/BEAI-PACKAGE-HARNESS-AUDIT-20260702-ko.md`
- `capability-pack/docs/03-verification/generated/beai-flow-regression-gate-third-audit.json`
- `capability-pack/docs/03-verification/generated/beai-user-scenario-audit-third-audit.json`
- `capability-pack/docs/03-verification/generated/beai-doctor-package-check-third-audit.json`
- `capability-pack/docs/03-verification/generated/beai-doctor-package-check-third-audit.md`

3차 검증 결과:

- runtime build: pass
- runtime syntax test: pass
- prod dependency audit: vulnerabilities 0
- flow regression gate: 27/27 pass
- user scenario audit: total 17, pass 14, partial 1, fail 2
- doctor package check: package_status `ready`
- ops-check: `ready`
- Harness verify / scenario run / closeout: `blocked`

Harness가 완료 언어를 막은 이유:

- 패키지 루트에 대표 verification command가 없다.
- developer-owned scenario test layer가 없다.
- first-success / empty-state / failure-recovery가 Harness가 인식할 테스트로 연결되어 있지 않다.

3차에서 새로 강해진 판단:

- Doctor `--help`는 실제로 usage-only가 아니었다. 도움말만 출력하지 않고 진단이 실행되어 `approval_required` 결과를 냈다. 2차 감사의 P1보다 더 강하게, 사용자 통제권 관점의 P0 후보로 다룬다.
- `npm pack --dry-run` 기준 release note가 실제 패키지에 포함되지 않고 `README.dist.md`는 포함된다. package truth check를 자동화해야 한다.
- BEAI Harness 기준으로는 개별 장치가 통과해도 전체 패키지 검증 명령과 scenario tests가 없으면 완료 주장으로 닫으면 안 된다.

3차 이후 수정 우선순위:

1. package truth: package.json, package.dist.json, npm pack dry-run 정합화
2. default/local evidence 분리: capability manifest와 README 정리
3. Doctor UX: `--help` usage-only 처리
4. 대표 검증 명령: root-level read-only verify command 추가
5. scenario fixtures: runtime/Telegram/session/installer intent 회귀 테스트 추가

## 2026-07-02 수정/보강 후 상태

전체 감사 이후 package-internal repair/hardening을 진행했다.

수정 후 증거:

- `docs/BEAI-PACKAGE-REPAIR-CLOSEOUT-20260702-ko.md`
- `docs/03-verification/generated/beai-package-verify.json`
- `docs/03-verification/generated/beai-package-truth-check.json`
- `docs/03-verification/generated/beai-user-scenario-audit-after-p0.json`
- `docs/03-verification/generated/beai-flow-regression-gate-after-p0.json`

수정 후 판정:

- package files 정합성: pass
- npm pack truth check: pass
- Doctor `--help` usage-only: pass
- user scenario audit: 17/17 pass
- flow regression gate: 27/27 pass
- representative package verify: pass
- stale claim scan: pass

여전히 별도 승인 전에는 하지 않은 것:

- Gateway restart/reload
- live runtime reinstall/relink
- Telegram live roundtrip
- release zip 생성
- public publish
