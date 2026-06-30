# BEAI Knowledge Loop v0.1 Upgrade Note

Status: draft upgrade candidate, not released
Created: 2026-06-30

## 목적

BEAI Package for OpenClaw에 BEAI Knowledge Loop를 핵심 업그레이드 후보로 추가합니다.

이번 단계는 구현 완료나 배포가 아니라, 수동 v0.1 기준을 고정하는 단계입니다.

정확한 제품 정의:

```text
AI와 함께 일한 기록이 사용자의 실행 자산으로 축적되는 BEAI Package의 지식 엔진
```

사장/Owner 적용은 downstream use case이며, core package 정의가 아닙니다.

상세 개발 플랜:

- `../docs/02-roadmap/BEAI-KNOWLEDGE-LOOP-RESEARCH-ARCHITECTURE-PLAN-20260630.md`
- `../../docs/02-roadmap/BEAI-KNOWLEDGE-LOOP-RESEARCH-ARCHITECTURE-PLAN-20260630.md`

## 추가 후보

- `beai-knowledge-loop`

역할:

- 작업 기록을 1차 세션 노트로 증류
- 여러 기록을 2차 지식 노트로 묶기
- 결정, 패턴, 함정, 패키지 후보, 개발 후보 분리
- 근거 reference 유지
- memory promotion을 review-first로 제한

## 현재 통합 상태

이번 후보는 BEAI Capability Pack 안에서 다음 파일로 연결됩니다.

- `README.md`: Knowledge Loop를 BEAI Package 상위 업그레이드 후보로 설명
- `routing.md`: Development Steward, Memory Curator Review, Release Verifier와의 handoff 경계 정의
- `capability-pack.json`: candidate module, manual-only 제외 범위, CLI/검증 산출물 참조
- `tools/beai-knowledge-loop.mjs`: 수동 source record dry-run과 retrieval index prototype
- `examples/knowledge-loop-source-record-case3a.json`: 지식자산 경계 fixture
- `examples/knowledge-loop-source-record-external-signal.json`: 외부 현실 신호 fixture
- `docs/03-verification/generated/knowledge-loop-retrieval-index.json`: generated output 기반 retrieval index v0.1
- `docs/BEAI-KNOWLEDGE-LOOP-COMPANION-UX-v0.1-ko.md`: 사용자가 볼 review card 기준
- `docs/03-verification/generated/*-companion-brief.{json,md}`: companion brief 첫 검증 산출물

현재 상태는 package integration candidate입니다. live skill apply, cron/hook, gateway 변경, release zip 생성은 포함하지 않습니다.

## 적용 방식

권장 적용:

```text
기존 BEAI Capability Pack v0.2.0: 유지
beai-knowledge-loop: pending proposal 또는 draft candidate로 추가
live skill 적용: 별도 승인 후
cron/hook/agent 자동화: 금지
durable memory write: 금지
```

## 함께 업데이트할 문서

- `README.md`
- `routing.md`
- `capability-pack.json`
- `docs/BEAI-KNOWLEDGE-LOOP-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-CLI-v0.1-ko.md`
- `docs/BEAI-KNOWLEDGE-LOOP-COMPANION-UX-v0.1-ko.md`
- `docs/UPGRADE-BEAI-KNOWLEDGE-LOOP-v0.1-ko.md`
- `skills/beai-knowledge-loop-skill.md`
- `tools/beai-knowledge-loop.mjs`

## 성공 기준

- Knowledge Loop가 BEAI Package의 핵심 루프 후보로 설명된다.
- owner-facing product가 core package boundary를 흐리지 않는다.
- manual v0.1 실행 기준이 있다.
- source reference, review status, next safe action이 필수 출력으로 고정된다.
- 자동화와 장기기억 승격은 명시적으로 제외된다.
- 최소 1회 manual dry-run evidence가 남는다.
- retrieval index prototype이 generated dry-run outputs를 읽어 source-grounded lookup 후보를 만든다.
- companion brief가 reality signals, knowledge candidates, review needed, next action, boundaries를 보여준다.

## 실패 기준

- 훅, cron, memory write가 이미 켜진 것처럼 표현한다.
- package release 또는 ready 상태를 주장한다.
- 사장용 downstream product를 core package 목적처럼 설명한다.
- 근거 없는 회상이나 요약을 지식으로 승격한다.

## Manual Dry Run Evidence

- `docs/03-verification/BEAI-KNOWLEDGE-LOOP-MANUAL-DRY-RUN-20260630.md`
