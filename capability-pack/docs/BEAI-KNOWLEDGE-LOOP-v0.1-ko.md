# BEAI Knowledge Loop v0.1

Status: draft candidate, manual only
Created: 2026-06-30
Package target: BEAI Package for OpenClaw

## 핵심 판단

BEAI Knowledge Loop는 사장용 확장 상품이 아니라 BEAI Package 자체를 한 단계 올리는 핵심 루프 후보입니다.

기존 BEAI Package가 runtime, memory, skill, companion 구성 묶음이었다면, Knowledge Loop가 붙은 패키지는 사용 기록을 근거 있는 지식으로 증류하고 다시 꺼내 쓰는 시스템이 됩니다.

정확한 제품 정의:

```text
AI와 함께 일한 기록이 사용자의 실행 자산으로 축적되는 BEAI Package의 지식 엔진
```

사장/Owner는 이 정의의 하위 적용 사례이며, core package boundary를 정의하지 않습니다.

상세 개발 플랜:

- `../../docs/02-roadmap/BEAI-KNOWLEDGE-LOOP-RESEARCH-ARCHITECTURE-PLAN-20260630.md`
- `../../docs/02-roadmap/BEAI-KNOWLEDGE-ASSET-CHARTER-20260630.md`
- `../../docs/02-roadmap/BEAI-EXTERNAL-SIGNAL-INTAKE-20260630.md`

## 패키지 안에서의 위치

- BEAI Layer / Runtime: 작업, 세션, 실행, 검증 기록을 포착하는 바닥
- BEAI Memory Layer: 무엇을 장기 지식 후보로 둘지, 무엇을 버릴지, 무엇을 검토할지 관리
- BEAI Basic Skill Pack: 요약, 증류, 분류, 색인, 조회를 수행
- BEAI Harness / Companion for OpenClaw: 사용자가 이해할 수 있는 말로 상태, 근거, 다음 행동을 보여줌
- BEAI Knowledge Loop: 위 네 층을 묶어 지식이 누적되게 만드는 상위 흐름

## v0.1 범위

포함:

- 수동 입력 기반 작업 기록 처리
- 내부 작업 기록과 외부 현실 신호의 구분
- 1차 세션 노트 생성
- 날짜/프로젝트 기반 색인
- 2차 지식 노트 생성
- observed facts / decisions / inferred patterns / traps / candidates 분리
- source material / reality signal / knowledge candidate / knowledge asset / execution asset 분리
- source reference 보존
- memory review 상태 표시
- release/package readiness 과장 방지

제외:

- 세션 종료 자동 훅
- cron 자동 실행
- 자동 durable memory write
- 자동 Obsidian vault 재구조화
- live OpenClaw gateway 변경
- release zip 생성 또는 배포 준비 완료 주장

## 수동 실행 흐름

1. Source record를 정한다.
2. Source reference를 붙인다.
3. 1차 세션 노트를 만든다.
4. 날짜/프로젝트 색인 항목을 만든다.
5. 2차 지식 노트를 만든다.
6. 항목을 observed fact, decision, inferred pattern, trap, package candidate, development candidate로 나눈다.
7. memory status를 no-memory, session-continuity, memory-candidate, agreement-candidate, needs-user-confirmation 중 하나로 둔다.
8. memory-like 항목은 Memory Curator Review로 넘긴다.
9. package/release-ready 표현은 Release Verifier로 넘긴 뒤에만 쓴다.

## 첫 성공 기준

- 하나의 작업 기록을 넣을 수 있다.
- 1차 세션 노트와 2차 지식 노트가 나온다.
- 주요 주장에 source reference가 붙는다.
- 사실, 판단, 추론, 후보가 섞이지 않는다.
- durable memory로 자동 승격되지 않는다.
- cron/hook/automation이 켜졌다고 말하지 않는다.

## 패키지 업그레이드 효과

이 모듈이 들어가면 BEAI Package는 단순 기능 묶음에서 다음 상태로 올라갑니다.

```text
installable capability bundle
-> source-grounded work memory package
-> compounding BEAI knowledge system
```

즉, 패키지는 한 번 설치하고 끝나는 도구가 아니라, 쓸수록 사용자의 작업 근거와 판단 자산이 쌓이는 구조가 됩니다.

## 진행 상태

- Research & Architecture Plan 기준 문서 작성됨
- Manual Evaluation Set 작성됨
- 실제 BEAI 작업 기록 기반 manual dry-run 수행됨
- pending skill proposal 상태의 `beai-knowledge-loop` 수정됨
- CLI v0.1 prototype 작성됨
- external signal fixture와 retrieval index prototype 작성됨
- Capability Pack 통합 후보로 README, routing, manifest, upgrade note에 연결됨
- Companion brief prototype 작성됨
- final manual v0.1 verification report 작성됨

다음 단계는 추가 실제 기록 1건으로 사용자 유용성을 확인하는 것입니다. hook/cron/agent 승격은 아직 검토 대상이 아니며, 별도 승인으로만 다룹니다.

## 현재 검증 기록

- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-DRY-RUN-20260630.md`
- `docs/03-verification/generated/knowledge-loop-case3a.json`
- `docs/03-verification/generated/knowledge-loop-external-signal.json`
- `docs/03-verification/generated/knowledge-loop-beai-knowledge-loop-v0.1-dev-session.json`
- `docs/03-verification/generated/knowledge-loop-retrieval-index.json`
- `docs/03-verification/generated/knowledge-loop-case3a-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-external-signal-companion-brief.json`
- `docs/03-verification/generated/knowledge-loop-beai-knowledge-loop-v0.1-dev-session-companion-brief.json`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-v0.1-FINAL-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-REAL-RECORD-CHECK-20260630.md`
- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-SCENARIO-USEFULNESS-TEST-20260630.md`

이 기록은 manual dry-run evidence이며, 자동화나 배포 검증이 아닙니다.

## Capability Pack 통합 후보

현재 Knowledge Loop는 BEAI Capability Pack 안에서 package integration candidate로 연결되어 있습니다.

- `README.md`: 패키지 상위 업그레이드 후보로 설명
- `routing.md`: Memory Curator Review, Release Verifier, Development Steward와의 경계 정의
- `capability-pack.json`: candidate module과 excluded live actions 명시
- `tools/beai-knowledge-loop.mjs`: local dry-run CLI prototype
- `docs/BEAI-KNOWLEDGE-LOOP-CLI-v0.1-ko.md`: CLI와 retrieval index 사용법
- `docs/BEAI-KNOWLEDGE-LOOP-COMPANION-UX-v0.1-ko.md`: 사용자-facing companion brief 기준

이 상태는 "패키지에 넣을 수 있는 후보 구조가 정합하게 연결됨"을 뜻합니다. "출시 준비 완료"나 "자동 실행 가능"을 뜻하지 않습니다.
