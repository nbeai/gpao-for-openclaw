# BEAI Package Organic Flow Audit v0.1

작성일: 2026-07-02
대상: BEAI Package for OpenClaw
상태: package-internal production operating-flow gate

## 목적

이 문서는 BEAI Package가 단순히 많은 기능을 가진 묶음이 아니라, 하나의 작동 흐름으로 사용자에게 전달되는지 확인하는 기준이다.

검증 대상은 다음과 같다.

- 런타임 판단이 현재 요청을 중심으로 작동하는가
- 훅이 OpenClaw/Gateway/Telegram 흐름을 막지 않고 fail-soft로 작동하는가
- 스킬, 도구, 문서, manifest가 서로 같은 제품 상태를 말하는가
- Telegram visible delivery가 messageId 증거 없이 완료로 닫히지 않는가
- 운영 알림, Knowledge Loop, cron dry-run, watchdog 후보가 사용자에게 내부 신호로 노출되지 않는가
- 사용자-facing 한국어가 검증/적용/전송/배포 상태를 섞지 않는가
- package-internal pass와 live 적용/release/public publish 경계가 분리되는가

## 유기적 작동 비유

이 감사는 패키지를 다음 구조로 본다.

- Brain: runtime-core, Flow State spine, Human Companion Quality
- Nervous system: OpenClaw hooks, current request anchor, fail-soft routing
- Muscle: package tools, Doctor, scenario audit, regression gate, Knowledge Loop helpers
- Bloodstream: generated evidence, delivery ledger, package verification output
- Immune system: Trust Gate, operational notification guard, status overclaim prevention
- Skeleton: manifest, README, docs, package truth, release boundary
- Skin: user-facing Korean wording and action clarity

중요한 기준은 “있다”가 아니라 “서로 연결되어 같은 방향으로 작동한다”이다.

## 통과 기준

`tools/beai-organic-flow-audit.mjs`가 다음을 모두 확인해야 한다.

- runtime flow spine과 response gate가 존재한다.
- Human Companion Quality가 문서가 아니라 runtime prompt context에 연결되어 있다.
- hook failure가 OpenClaw, Gateway, Telegram reply flow를 막지 않도록 fail-soft 경로가 있다.
- current input이 오래된 closure handle이나 이전 작업보다 우선한다.
- package-owned verification tools가 빠짐없이 존재한다.
- core package skills가 capability manifest에 등록되어 있다.
- generated evidence와 Doctor flow evidence가 구조화되어 남는다.
- Telegram completion은 messageId evidence 없이는 닫히지 않는다.
- operational notification은 raw internal marker를 사용자에게 보내지 않는다.
- status claim은 evidence level을 넘지 않는다.
- root verify는 read-only이며 live mutation을 하지 않는다.
- closeout은 package-internal pass와 live/release/public publish를 분리한다.

## 하지 않는 것

이 감사는 다음을 하지 않는다.

- OpenClaw core 수정
- Gateway restart/reload
- Telegram send 또는 provider config 변경
- cron/hook/agent 등록
- durable memory write
- release zip 생성
- public publish
- live runtime reinstall

## 해석 기준

- `pass`: 패키지 내부에서 유기적 작동 흐름을 설명하고 검증할 기준이 닫혔다.
- `partial`: 일부 비핵심 연결이 빠졌으며 release wording은 보류해야 한다.
- `fail`: runtime, delivery, current request, status claim, package truth 같은 핵심 연결이 끊겨 package-ready 표현을 쓰면 안 된다.

이 감사가 pass여도 live 적용, Gateway reload, Telegram roundtrip, release zip, public publish는 별도 단계다.
