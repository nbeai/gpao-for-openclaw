# GPAO for OpenClaw 패키지 정체성 v0.1

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

## 핵심 선언

GPAO는 Growth Personal AI Operating System의 약자입니다.

한국어 의미는 성장형 개인 AI 운영체제입니다.

이 저장소의 최상위 제품명과 배포 단위는 GPAO for OpenClaw입니다.

기존 BEAI Package for OpenClaw라는 이름은 이 패키지의 역사적/기술적 기반을 가리키는 말로 남길 수 있지만, 현재 통합 제품을 설명할 때는 GPAO for OpenClaw를 우선 사용합니다.

## 구성 관계

```text
GPAO for OpenClaw
-> GPAO = Growth Personal AI Operating System
-> BEAI Runtime
-> BEAI Capability Pack
-> Context Mesh
-> Knowledge Loop
-> Skill Upgrade Candidates
-> GPAO Self-Upgrade Candidates
-> Verification / Release Evidence
```

## 작동 원칙

- 기억과 맥락은 후보로 넓게 받아낸다.
- 사용자의 활동, 상태, 지식, 스킬, 도구, 자동화, 검증 흐름을 함께 성장시키는 개인 AI 운영체제를 목표로 한다.
- 보안, 금융, 법률, 외부 전송, 공개 배포, durable memory, live skill/rule, cron/daemon, 파괴적 변경은 승인 또는 별도 검증 경계를 둔다.
- 읽기, 분류, 후보화, 검증, 리뷰보드, 리포트, 패키지 내부 점검은 가능한 자동화한다.
- 완료/적용/검증/전송/배포/공개는 항상 분리해서 말한다.

## 컨트롤 플레인 증거

GPAO for OpenClaw는 세 가지 패키지 수준 컨트롤 플레인 점검을 포함합니다.

- `gpao-openclaw-proof-ladder`: package-built, archive-verified, installer-ready, Gateway boundary, Telegram visible progress, behavior-contract proof를 분리합니다.
- `gpao-openclaw-felt-replay`: 새 세션 연속성, visible progress, delivery truth, release language clarity, repair planning, first-install confidence를 사용자 체감 관점에서 재생합니다.
- `gpao-openclaw-adapter-matrix`: package source, runtime plugin, Gateway/live boundary, Telegram Direct, context broker, Knowledge Loop, release channel 표면을 별도로 점수화합니다.

이 점검들은 GPAO 패키지에 속한 내부 검증 도구입니다. live replacement, Gateway restart, Telegram send, ClawHub/public publish, cron registration, durable memory promotion을 수행하지 않습니다.

## 문서 정책

과거 문서에 남아 있는 BEAI Package 명칭은 당시 개발 단계의 히스토리로 보존할 수 있습니다. 현재 설치, 패키징, 배포, 보안, 라이선스, 검증, 사용자 안내 문서는 GPAO for OpenClaw 정체성을 우선합니다.
