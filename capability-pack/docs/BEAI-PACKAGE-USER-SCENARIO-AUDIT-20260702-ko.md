# BEAI Package User Scenario Audit - 2026-07-02

## 범위

이 문서는 BEAI Package가 적용된 OpenClaw를 실제 사용자가 쓸 때 겪을 수 있는 오류 가능성과 불편 가능성을 사용자 시나리오 기준으로 다시 점검한 2차 감사 기록이다.

1차 감사는 패키지 구조, 문서, manifest, runtime, Doctor, regression gate, live 상태 조회를 중심으로 봤다.

2차 감사는 다음 질문으로 다시 봤다.

- 처음 설치한 사용자가 상태를 오해하지 않는가?
- Telegram direct 사용자가 답변 누락, 내부 final 착각, 긴 작업 침묵, 반복 footer, stale context를 겪지 않는가?
- Doctor와 Knowledge Loop가 안전하지만 지나치게 불편하지 않은가?
- 패키지 문서와 manifest가 기본 설치 상태와 로컬 검증 증거를 섞지 않는가?
- clean environment / ClawHub / release readiness를 검증 없이 닫지 않는가?

이번 감사에서 수행한 것은 read-only 시나리오 테스트, 문서/manifest/runtime 정적 검사, generated report 작성이다.

이번 감사에서 하지 않은 것:

- OpenClaw core 변경
- Gateway restart
- Telegram 설정 변경
- cron, hook, agent 등록 또는 변경
- live Telegram roundtrip 발송
- release zip 생성
- public publish

## 새로 추가한 시나리오 감사 도구

추가 파일:

- `capability-pack/tools/beai-user-scenario-audit.mjs`

생성 리포트:

- `capability-pack/docs/03-verification/generated/beai-user-scenario-audit.json`
- `capability-pack/docs/03-verification/generated/beai-user-scenario-audit.md`

실행 명령:

```bash
cd capability-pack
node --check tools/beai-user-scenario-audit.mjs
node tools/beai-user-scenario-audit.mjs --root . --format json --output docs/03-verification/generated/beai-user-scenario-audit.json
node tools/beai-user-scenario-audit.mjs --root . --format md --output docs/03-verification/generated/beai-user-scenario-audit.md --stdout
```

이 도구는 다음을 하지 않는다.

- durable memory write
- OpenClaw core change
- Gateway or Telegram config mutation
- cron, hook, or agent registration
- external send
- release packaging
- live Telegram roundtrip

## 시나리오 테스트 결과

실행 결과:

- total: 17
- pass: 14
- partial: 1
- fail: 2
- overall status: `fail`

P0 failures:

- `S10-runtime-package-file-truth:package-files-match-dist-files`
- `S11-package-default-vs-local-live-evidence:manifest-no-registered-automations-as-default`
- `S11-package-default-vs-local-live-evidence:cap-readme-local-evidence-separated`

P1 failure:

- `S08-doctor-help-and-user-control:doctor-help-implemented`

## 통과한 핵심 사용자 위험

### Telegram 일반 요청이 BEAI 표면 응답으로 대체되는 문제

상태: pass

확인된 것:

- Runtime에 `telegram direct hard surface deferred to model` 경로가 있다.
- Delivery contract에 `telegram_direct_non_install_surfaces_are_observer_only`가 true로 들어 있다.
- Flow regression gate가 `telegram_reply_blocked_by_beai_surface` 회귀를 본다.

남은 한계:

- 현재 시나리오 감사는 정적/계약 기반이다.
- 실제 turn simulation fixture는 별도 보강이 필요하다.

### 내부 final 또는 생성된 답변만으로 Telegram 완료를 주장하는 문제

상태: pass

확인된 것:

- Contract가 `internal_final_answer_is_not_delivery`를 true로 둔다.
- Contract가 Telegram direct completion에 messageId를 요구한다.
- Runtime이 generated response를 messageId 전까지 unverified로 기록한다.

판정:

- 이 경계는 현재 패키지에서 가장 중요한 신뢰 안전장치이며 유지해야 한다.

### 반복 footer / stale handle 문제

상태: pass

확인된 것:

- Runtime에 `sanitizeRepeatedFooterInstruction`이 있다.
- 기존 "decision handle로 끝내라" 계열 지시가 "반복 footer로 붙이지 말라" 쪽으로 뒤집혀 있다.
- closure handle, runtime response gate, judgment handle, handoff seed 렌더링 경로에 sanitizer가 적용되어 있다.

판정:

- 이 문제는 실제 사용자 신뢰 사고였으므로 앞으로도 별도 시나리오로 계속 고정해야 한다.

### 긴 작업 중 침묵으로 보이는 문제

상태: pass

확인된 것:

- Contract가 quick first status를 요구한다.
- Contract가 long-running visible progress를 요구한다.
- Doctor issue code가 progress gap을 감지한다.

남은 한계:

- 실제 source conversation으로 progress message가 도달하는지는 live roundtrip 없이는 닫을 수 없다.

### memory auto-approve 문제

상태: pass

확인된 것:

- Knowledge Loop 문서가 `Auto-capture, not auto-approve`를 기준으로 둔다.
- `approved` 상태는 사용자 명시 승인을 요구한다.
- Knowledge Loop가 `current_judgment_impact`를 분리한다.

## 실패한 핵심 사용자 위험

### P0 - 실제 runtime package 파일 목록이 dist 의도와 다름

상태: fail

증거:

- `plugin/beai-runtime/package.dist.json`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 포함되어 있다.
- `plugin/beai-runtime/package.json`의 `files`에는 `RELEASE-NOTES-v0.6.17-ko.md`가 없다.
- 시나리오 감사 결과:

```text
missingFromPackage=RELEASE-NOTES-v0.6.17-ko.md
extraInPackage=none
```

사용자 영향:

- 설치자 또는 검토자가 runtime v0.6.17의 변경 내용을 패키지 안에서 확인하지 못할 수 있다.
- 문서가 말하는 배포 의도와 실제 npm pack 결과가 달라질 수 있다.

권장 조치:

- `package.json.files`와 `package.dist.json.files`를 정합화한다.
- `npm pack --dry-run --json` 결과를 regression gate 또는 release verifier에 포함한다.

### P0 - package default와 local live evidence가 섞임

상태: fail

증거:

- `capability-pack/capability-pack.json`의 Knowledge Loop 항목에 `registeredAutomations`가 들어 있다.
- 여기에는 실제 cron UUID, schedule, `enabled-force-run-ok` 같은 로컬 운영 증거가 포함되어 있다.
- `capability-pack/README.md`도 daily cron, missed-run recovery, Telegram delivery, persistent lane, watchdog 적용 상태를 패키지 기본 설명처럼 읽히게 쓴다.

사용자 영향:

- 새 사용자는 패키지를 설치하면 cron/watchdog/persistent lane이 자동으로 켜진다고 오해할 수 있다.
- 반대로 실제로는 자동화가 켜지지 않았는데 기대만 생겨 "설치했는데 왜 안 되지?"라고 느낄 수 있다.

권장 조치:

- public/default manifest에서는 packaged capability만 설명한다.
- 윤의 local live evidence는 별도 local evidence ledger나 `docs/03-verification/local/` 문서로 분리한다.
- README에는 "local evidence is not installed by default" 문장을 명시한다.

### P1 - Doctor `--help`가 도움말 전용인지 불명확

상태: partial

증거:

- `beai-doctor.js`에는 mode/check 경로는 있지만 `--help`/`-h`를 usage-only로 먼저 처리하는 경로가 보이지 않는다.
- 1차 감사에서도 `node tools/beai-doctor.js --help` 호출이 실제 diagnosis를 실행하는 것으로 관찰됐다.

사용자 영향:

- 도움말만 보려던 사용자가 의도치 않게 live/read-only 진단을 실행할 수 있다.
- BEAI Doctor가 "확인한 것과 실행한 것의 경계"를 강조하는 도구라는 점과 UX가 어긋난다.

권장 조치:

- `--help` / `-h`는 usage만 출력하고 즉시 종료한다.
- 지원 모드와 부작용 없음/있음 경계를 usage에 표시한다.

## 시나리오별 보강 필요 항목

### 실제 turn simulation fixture가 필요한 항목

- Telegram direct normal request must not be replaced by BEAI surface
- stale recovery plan must not override current input
- repeated footer phrase must be sanitized in rendered fields
- install zip intent must be preserved as install flow
- BEAI Runtime Overlay-like internal labels must not leak into final output
- large Telegram session / active model call delay must produce visible and honest state

### release/package verifier로 넘길 항목

- npm pack dry-run file list
- package.json vs package.dist.json files consistency
- runtime README / README.dist stale verification claim
- ClawHub validate availability
- clean-environment install proof
- rollback proof

### Doctor로 넘길 항목

- `--help` usage-only behavior
- stale log issue freshness window
- connected-but-not-roundtrip verified wording
- delayed-but-processing Telegram UX wording

## 현재 감사 판정

BEAI Package는 사용자 신뢰를 깨는 핵심 위험 일부를 이미 잘 막고 있다.

특히 다음은 통과 상태다.

- Telegram internal final != visible delivery
- generated response without messageId remains unverified
- Telegram direct non-install hard surfaces are observer-only
- repeated footer sanitizer
- long-running visible progress contract
- memory auto-capture not auto-approve

하지만 사용자 입장에서 패키지를 설치하거나 검토할 때 가장 크게 오해할 수 있는 두 가지는 아직 열려 있다.

1. 실제 배포 파일 목록이 의도와 다르다.
2. public/default package 설명과 윤의 local live evidence가 섞여 있다.

따라서 다음 수정 우선순위는 기능 추가가 아니라 `패키지 진실성`이다.

수정 순서:

1. runtime package files 정합화
2. local live evidence와 default package manifest 분리
3. README / README.dist verification claim 갱신
4. Doctor `--help` usage-only 처리
5. scenario audit을 release verifier / flow gate에 연결
6. runtime turn simulation fixture 추가

