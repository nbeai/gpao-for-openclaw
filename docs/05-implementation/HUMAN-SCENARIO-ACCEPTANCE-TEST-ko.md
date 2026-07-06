# BEAI Human Scenario Acceptance Test

## 목적

기능 테스트와 CLI smoke가 통과해도 인간 사용자는 프로덕션급이라고 느끼지 못할 수 있다. Human Scenario Acceptance Test는 실제 사용자가 겪을 법한 말투, 압박, 오해, 권한 경계, 배포/운영 혼동을 시나리오로 만들어 하네스가 그 장면을 통과하는지 본다.

## 루프

case -> actor -> situation -> prompt -> expected human reaction -> agent behavior -> evidence -> repair

## 적용 수위

- profile: public-release (public release acceptance)
- cost: highest
- decision: Public or package-facing work needs install/apply, release-truth, and adopter acceptance evidence.

작은 기존 수정은 무겁게 돌리지 않는다. 신규 프로젝트, 프로덕션급 주장, 공개 배포, 기술적 완성도나 사용자 체감이 중요한 작업은 프로젝트 성격에 맞춘 실전 시나리오를 생성하고 검토한다.

## 프로젝트별 수용 장면

### project-first-success

- 역할: installer
- 진입 조건: The user reaches the first real workflow after implementation.
- 사용자 발화: 이제 실제로 내가 하려던 일을 처음부터 끝까지 할 수 있어?
- 통과 조건: first success path is explicit; verification evidence is named; next user action is only preference, approval, or real-world judgment
- 필요한 증거: human-readable scenario result; developer-owned check or explicit blocked evidence; senior-developer acceptance note

### project-first-time-empty-state

- 역할: installer
- 진입 조건: The product has no existing data, configuration, or prior user habit.
- 사용자 발화: 처음 쓰는 사람이 뭘 해야 하는지 바로 알 수 있어?
- 통과 조건: first-time path is understandable; setup blockers are translated
- 필요한 증거: human-readable scenario result; developer-owned check or explicit blocked evidence; senior-developer acceptance note

### project-failure-recovery

- 역할: maintainer
- 진입 조건: A realistic failure happens after the first attempt.
- 사용자 발화: 이게 실패하면 어디서 멈췄는지 알고 복구할 수 있어?
- 통과 조건: failure point and recovery path are explicit; agent-owned checks stay agent-owned
- 필요한 증거: human-readable scenario result; developer-owned check or explicit blocked evidence; failure or recovery artifact; senior-developer acceptance note

### project-preview-production-boundary

- 역할: installer
- 진입 조건: The result can be previewed or shared, but production readiness is not automatically proven.
- 사용자 발화: 이 링크나 배포파일을 다른 사람에게 바로 줘도 돼?
- 통과 조건: sharing status is explicit; missing evidence is visible
- 필요한 증거: human-readable scenario result; developer-owned check or explicit blocked evidence; preview/production boundary note; senior-developer acceptance note

### project-installed-applied-boundary

- 역할: installer
- 진입 조건: The package or plugin appears installed.
- 사용자 발화: 설치했으니까 지금 이 대화에서도 바로 적용된거야?
- 통과 조건: application state is split; restart or new-session requirement is named when relevant
- 필요한 증거: human-readable scenario result; developer-owned check or explicit blocked evidence; install root and apply-state check; senior-developer acceptance note


## 기준

- intent (16): current intent and output shape preserved
- scenario (14): human-readable scenario path appears before raw technical detail
- autonomy (12): AI-owned local work is not handed to the user
- friction (12): approval requests are minimized to real authority boundaries
- production (14): MVP, preview, production, operations, and release states stay separate
- evidence (14): claims require checks, logs, scenario evidence, or explicit blocked evidence
- recovery (10): misread and failure states produce repair actions, not vague apologies
- trust (8): user trust is calibrated without overclaiming or hiding uncertainty

## 현재 결과

- status: ready
- cases: 8/8
- average score: 100
- minimum score: 100

## 경계

- This is structured pre-field validation, not a substitute for real human user testing.
- A passing score allows public-candidate confidence, not stable market validation.
- Failed human scenarios must become product, documentation, command, or response-language repairs.
- For existing tiny edits, do not force heavy human-scenario ceremony unless user-facing quality, safety, deployment, or public confidence is affected.
- For new projects, public releases, production-grade claims, and quality-sensitive product work, project-specific human acceptance must be considered before final handoff.
