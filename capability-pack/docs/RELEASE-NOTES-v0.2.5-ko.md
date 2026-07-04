# BEAI Capability Pack v0.2.5 Release Notes

## 요약

v0.2.5는 BEAI Capability Pack에 Workbench Essential Skills와 External Reach Layer를 source-candidate 수준으로 추가한 릴리스 후보다.

이번 버전의 목적은 두 가지다.

- 디자인, 발표자료, 문서, 리서치, 데이터 분석을 BEAI의 핵심 작업 스튜디오로 묶는다.
- 외부 웹/GitHub/YouTube/RSS/X/Reddit/Meta 계열 접근을 "인터넷 만능 접근"이 아니라 검증 가능한 source registry와 승인 경계로 관리한다.

## 추가된 것

- Workbench Essential Skills 계약
  - `config/beai-workbench-essential-skills-contract.json`
  - `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-RESEARCH-DOSSIER-v0.1-ko.md`
  - `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-DEVELOPMENT-PLAN-v0.1-ko.md`
  - `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-CONTRACT-v0.1-ko.md`
- 5대 Studio 스킬
  - `skills/beai-visual-design-studio/SKILL.md`
  - `skills/beai-presentation-studio/SKILL.md`
  - `skills/beai-document-craft-studio/SKILL.md`
  - `skills/beai-research-evidence-studio/SKILL.md`
  - `skills/beai-data-insight-lab/SKILL.md`
- Workbench read-only audit
  - `tools/beai-workbench-skill-audit.mjs`
  - `tools/beai-workbench-skill-audit.test.mjs`
- External Reach Layer 계약과 문서
  - `config/beai-external-reach-contract.json`
  - `docs/BEAI-EXTERNAL-REACH-LAYER-v0.1-ko.md`
- External Reach read-only doctor
  - `tools/beai-external-reach-doctor.mjs`
  - `tools/beai-external-reach-doctor.test.mjs`

## 패키지 연결

- `capability-pack.json`에 Workbench와 External Reach를 source-candidate module로 등록했다.
- Research Evidence Studio에 External Reach registry, fallback/direct access 구분, account/cookie approval boundary를 추가했다.
- `beai-package-verify.mjs`가 Workbench audit과 External Reach doctor를 함께 실행한다.
- `beai-doctor-package-check.mjs`가 Workbench와 External Reach 계약을 package-ready 조건으로 확인한다.
- `beai-control-center.mjs`가 Workbench와 External Reach 상태를 read-only 상태판에 표시한다.
- `beai-user-scenario-audit.mjs`에 Workbench/External Reach 사용자 위험 시나리오를 추가했다.

## 검증 결과

로컬 검증 기준:

- `npm test`: pass
- `npm run verify`: pass
- Workbench skill audit: ready
- External Reach static doctor: ready
- User scenario audit: 29/29 pass
- Doctor package check: package_status ready
- Runtime build/test/audit: pass

선택 live check:

- public web: read-only response 확인
- GitHub raw source: read-only response 확인
- YouTube public metadata: read-only response 확인
- RSS/Atom: read-only response 확인

## 경계

v0.2.5는 다음을 하지 않는다.

- OpenClaw core 변경
- Gateway 재시작
- Gateway hook/config 변경
- cron/hook/agent 활성화
- durable memory promotion
- 외부 발송 또는 공개 게시
- X/Twitter, Reddit, Instagram, Facebook 계정 로그인이나 쿠키 사용
- paid API key 사용

## 현재 릴리스 라벨

`internal-team-release-candidate`

이 버전은 clean zip, GitHub 반영, live/runtime 상태 확인을 거쳐 controlled manual review 대상으로 삼을 수 있다. stable one-command production support로 부르려면 별도 clean-environment install evidence와 public release/ClawHub 경로 검증이 필요하다.
