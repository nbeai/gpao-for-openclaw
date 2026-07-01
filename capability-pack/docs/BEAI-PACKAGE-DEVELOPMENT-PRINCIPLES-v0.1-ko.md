# BEAI Package for OpenClaw 개발 원칙과 목표 v0.1

Status: canonical package principle
Date: 2026-07-01
Scope: BEAI Package for OpenClaw, BEAI Capability Pack, BEAI-on-OpenClaw runtime/skill/doctor/knowledge/release work

## 핵심 목표

BEAI Package for OpenClaw는 OpenClaw 사용자가 AI에게 일을 맡길 때 더 안전하고, 더 선명하고, 더 쾌적하게 일할 수 있도록 만드는 신뢰 운영층이다.

이 패키지는 단순히 기능을 많이 더하는 것이 아니라, 사용자가 AI와 함께 일하는 과정에서 생기는 다음 문제를 줄이는 것을 목표로 한다.

- 사용자가 정확히 말하지 못해도 의도와 상황을 복원하지 못하는 문제
- 자동화가 실행은 됐지만 완료, 보류, 실패, 인계, 복구 상태가 흐려지는 문제
- 안전과 보안을 이유로 사용자가 답답함, 불편함, 느림을 체감하는 문제
- 기억, 판단, 검증, 승인, 배포 상태가 섞여 제품 신뢰가 흐려지는 문제
- OpenClaw의 강력한 실행 환경이 사용자에게 복잡함과 난해함으로 느껴지는 문제

핵심 문장:

```text
BEAI Package는 "AI가 무엇을 할 수 있는가"보다
"어디까지 맡길 수 있고, 어디서 멈추며, 누가 확인하고,
어떻게 되돌릴 수 있는가"를 먼저 보장하는
OpenClaw의 신뢰 운영층이다.
```

## 개발 원칙

1. BEAI Package는 OpenClaw 사용자 중심 관점을 최우선으로 한다.

   일반 사용자부터 고급 사용자까지, 누구나 보안과 안전의 기본기를 단단하게 지키는 가운데 메신저부터 OpenClaw 본체 전체에 이르는 작동 흐름을 안정적이고 쾌적하게 사용할 수 있도록 만든다.

2. BEAI Package는 사용자가 AI에게 일을 맡기는 순간, 실행력보다 먼저 경계, 검증, 복구, 승인 가능성을 보장한다.

   단, 이 신뢰 장치는 사용자의 속도와 몰입을 방해하지 않는 방식으로 작동해야 한다.

3. BEAI Package는 안전하되 쾌적해야 한다.

   보안과 승인, 검증과 복구는 사용자를 붙잡고 느리게 만드는 장벽이 아니라, 사용자가 안심하고 빠르게 움직일 수 있게 돕는 보이지 않는 레일이어야 한다. 안전을 이유로 불필요한 확인, 반복 질문, 느린 흐름, 과도한 경고를 만들지 않는다.

4. 사용자의 표현이 불완전하거나 거칠어도, 의도와 상황과 제약을 복원해 문제 해결에 필요한 다음 행동으로 정리한다.

   사용자가 정확히 말해야만 작동하는 패키지가 아니라, 사용자가 자연스럽게 말해도 목적 달성으로 이어지는 패키지를 지향한다.

5. 모든 개발은 단일 기능과 전체 시스템 양쪽에서 과잉, 중복, 비효율을 줄이는 방향으로 진행한다.

   기능을 많이 붙이는 것이 아니라, 필요한 기능이 정확한 위치에서 정확한 책임을 갖도록 설계한다.

6. BEAI Package는 토큰, 시간, 비용, 사용자 주의력을 모두 운영 자원으로 보고 낭비하지 않는다.

   빠르되 성급하지 않고, 정밀하되 무겁지 않게 설계한다.

7. BEAI Package는 고도화될수록 더 가벼워져야 한다.

   기능이 많아지고 성능이 올라가도 사용자가 느끼는 복잡도, 대기 시간, 판단 부담은 줄어들어야 한다.

8. BEAI5 시스템프롬프트에 담긴 철학, 정체성, 기능, 작동 원리를 본질의 뼈대로 삼는다.

   새로운 기능과 자동화는 이 뼈대와 충돌하지 않아야 하며, 필요할 때는 원칙을 더 선명하게 드러내는 방향으로 확장한다.

9. BEAI Package는 낮은 수준의 일반 사용자도 무리 없이 AI-native가 되고 AX를 실현할 수 있도록 돕는다.

   전문 지식이 부족한 사용자를 탓하지 않고, 사용자가 실제 행동으로 옮길 수 있는 구조와 언어를 제공한다.

10. OpenClaw 사용자가 복잡함, 어려움, 난해함의 고통을 겪게 하지 않는다.

    내부 구조는 정교하게 만들되, 외부 경험은 단순하고 선명하게 유지한다.

11. 모든 자동화와 agent 실행은 완료, 보류, 실패, 사람 인계, 되돌림 필요 상태를 구분한다.

    "했다"는 주장보다 "어떤 상태로 끝났고 무엇을 확인했는가"를 우선한다.

12. BEAI Package의 memory는 단순 저장소가 아니라 검증 루프다.

    기억 후보는 근거 확인, 승격, 기각, 재검토, 철회 가능성을 가져야 하며, 중요한 판단은 출처와 변경 이력을 남긴다.

13. 모델 선택은 성능 순위가 아니라 역할 분담으로 다룬다.

    반복 실행 모델, 검토 모델, 최종 승인자를 분리하고 비용, 정확도, 위험도에 따라 적절한 층을 선택한다.

14. 외부 도구와 private data 연결은 노출면을 최소화한다.

    가능한 한 검사 가능한 client, outbound bridge, 명시적 승인, 좁은 destination 설정을 기본값으로 삼는다.

15. BEAI Package는 자동화 횟수가 아니라 해결 품질을 KPI로 삼는다.

    핵심 상태는 해결됨, 보류됨, 사람에게 인계됨, 되돌림됨으로 분리해 평가한다.

16. 실패 가능성은 숨기지 않고 설계에 포함한다.

    실행 전에는 중단 조건을, 실행 중에는 관찰 가능한 상태를, 실행 후에는 검증 결과와 복구 경로를 남긴다.

17. 고급 기능일수록 사용자는 더 적은 선택과 더 명확한 결과를 보아야 한다.

    BEAI Package의 발전은 기능 목록이 길어지는 것이 아니라, 사용자의 판단과 실행이 더 쉬워지는 것으로 증명되어야 한다.

## 적용 기준

BEAI Package 관련 개발, skill, doctor, knowledge loop, release, automation, memory, gateway/channel-facing 작업은 이 문서를 기본 기준으로 참조한다.

특히 다음 판단에서는 이 원칙을 먼저 확인한다.

- 새 기능을 추가할지, 기존 기능을 정리할지 판단할 때
- 안전/보안 경계를 어디까지 사용자에게 노출할지 판단할 때
- 자동화, cron, agent, memory promotion을 검토할 때
- package, zip, release, install candidate의 완료 표현을 정할 때
- Telegram, Gateway, runtime, skill 상태를 사용자에게 설명할 때
- Knowledge Loop가 work record를 package knowledge로 승격할지 판단할 때
- Knowledge Loop 자동 기록과 자동 승인의 경계를 판단할 때

## 좋은 구현의 기준

좋은 BEAI Package 구현은 다음 네 가지를 동시에 만족해야 한다.

1. 안전하다.
   - 승인 경계, private boundary, 중단 조건, 복구 경로가 있다.

2. 정확하다.
   - 확인된 것, 추정한 것, 미검증인 것, 보류한 것을 섞지 않는다.

3. 쾌적하다.
   - 사용자가 불필요한 질문, 반복 확인, 긴 대기, 과한 경고에 지치지 않는다.

4. 가볍다.
   - 기능이 늘어도 토큰, 시간, 비용, 선택 부담, 런타임 부담이 함께 늘어나지 않는다.

## 금지되는 방향

- 안전을 이유로 사용자를 계속 멈춰 세우는 설계
- 보안을 이유로 모든 흐름을 느리게 만드는 설계
- 검증되지 않은 완료, 적용, 배포, production-ready 주장
- memory 후보를 근거 없이 장기 기억으로 승격하는 흐름
- Knowledge Loop draft capture를 approved 지식이나 durable memory로 자동 승격하는 흐름
- cron, agent, hook, gateway restart, external send를 편의상 자동화하는 흐름
- OpenClaw core와 BEAI-owned layer 책임을 섞는 설명
- 기능 추가가 사용자 이해와 쾌적함을 해치는 구조

## 관련 skill 참조 기준

이 문서는 다음 skill과 capability가 BEAI Package 관련 판단을 할 때 참조해야 하는 상위 원칙이다.

- `beai-development-steward`
- `beai-release-verifier`
- `beai-doctor`
- `beai-knowledge-loop`
- `beai-memory-curator-review`
- `automation-readiness-check`
- `skill-agent-cron-router`
- `beai-workspace-sync-guard`
- `beai-openclaw-harness-quality-lens`

각 skill은 이 문서를 그대로 반복하지 말고, 자기 역할에 맞는 판단으로 번역한다.

- Development Steward: 개발 범위, 구현 레이어, 사용자 쾌적성, 승인 경계
- Release Verifier: release wording, evidence boundary, package hygiene
- BEAI Doctor: 실제 사용자 증상, runtime reliability, 안전하지만 답답하지 않은 repair UX
- Knowledge Loop: memory as verification loop, source-grounded package knowledge
- Memory Curator: durable memory contamination 방지
- Automation Readiness / Router: skill, agent, cron, human approval boundary
- Workspace Sync Guard: live/source/package/verification 정합성
- Harness Quality Lens: 복잡한 runtime state를 단순하고 검증 가능한 사용자 경험으로 변환
