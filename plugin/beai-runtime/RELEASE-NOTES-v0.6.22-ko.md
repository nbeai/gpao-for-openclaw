# BEAI Runtime v0.6.22 릴리스 노트

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

## 핵심 변경

- Context Mesh turn-start resolve 결과가 must-read인 경우 제목/경로/excerpt만 주입하지 않고, 로컬 후보 문서 본문 일부를 실제로 로드합니다.
- 로드된 근거를 `BEAI_CONTEXT_MESH_ENFORCEMENT` hard gate 블록으로 답변 전 프롬프트에 넣습니다.
- 애매한 새 세션/후속 발화에서 direct answer로 바로 닫지 말고, must-read 근거와 현재 사용자 요청의 대상 매칭을 먼저 하도록 지시합니다.
- Telegram/세션 메타데이터 JSON이 현재 사용자 입력으로 섞이는 경우 실제 사용자 텍스트를 우선 추출하도록 보강했습니다.

## 검증 기준

- `npm run build`
- `npm test`
- Context Mesh must-read body-loaded regression
- live 적용 후 OpenClaw Gateway restart 및 Telegram `/new` 라운드트립 확인

## 경계

- 이 변경은 기억을 자동 durable promotion하지 않습니다.
- 외부 발송, 배포, 자동화 등록, live skill 적용, 운영 규칙 mutation은 별도 승인/검증 경계를 유지합니다.
