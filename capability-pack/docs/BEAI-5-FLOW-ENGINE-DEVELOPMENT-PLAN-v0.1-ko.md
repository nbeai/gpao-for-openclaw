# BEAI 5 Flow Engine 개발 계획서 v0.2

Status: phase-7 package regression gates implemented
Date: 2026-07-01
Scope: BEAI Package for OpenClaw, BEAI Runtime Layer, OpenClaw Adapter, Skills, Doctor, Knowledge Loop, Telegram delivery
Secondary alignment target: BEAI Harness for Codex

## 1. 판단의 출발점

지금까지의 대화에서 확정된 핵심은 다음이다.

BEAI 5는 말투나 응답 스타일이 아니라 흐름이다.

흐름은 사용자의 의도, 상황, 처지, 대화 맥락, 판단 부담, 실행 조건, 검증, 보류, 종결이 끊기지 않도록 이어주는 작동 구조다.

BEAI Package의 목표는 AI의 능력을 늘리는 것이 아니라, 모델, 런타임, 도구, 기억, 자동화, 검증, 확장 장치가 가진 모든 능력이 사용자를 위해 쓰이게 만드는 것이다.

최종 품질 기준은 다음 문장으로 고정한다.

```text
응답 뒤 사용자의 현실이 더 선명해지고, 판단 부담이 줄며, 실제로 쓸 수 있는 무언가가 남았는가.
```

이 기준은 철학 문장이 아니라 런타임, 스킬, 자동화, 검증, 릴리스 상태를 판단하는 운영 기준이다.

## 2. 현재 패키지 전체 상태

현재 BEAI Package는 이미 여러 축을 갖고 있다.

### 2.1 BEAI Package for OpenClaw

역할:

- OpenClaw 위에서 BEAI의 신뢰 운영층 역할을 한다.
- 안전, 보안, 검증, 승인, 복구를 사용자가 답답하지 않게 제공해야 한다.
- `capability-pack/docs/BEAI-PACKAGE-DEVELOPMENT-PRINCIPLES-v0.1-ko.md`가 상위 원칙 문서다.

현재 상태:

- 개발 원칙 문서는 생겼다.
- `capability-pack.json`, `README.md`, `routing.md`에 원칙 참조가 들어갔다.
- 관련 Skill Workshop update proposal은 일부 pending 상태로 남아 있다.

핵심 부족:

- 원칙이 실제 BEAI Runtime Layer의 상태 모델과 응답 경로에 아직 충분히 내려가지 않았다.

### 2.2 BEAI Runtime Layer

역할:

- OpenClaw 대화 흐름 중 사용자의 입력, 런타임 제약, 응답 방향, 메모리 후보, handoff, Telegram delivery contract를 다룬다.
- 현재 `plugin/beai-runtime/src/runtime-core.ts`에 이미 많은 판단 프로파일이 존재한다.

현재 상태:

- `ResponseResolution`
- `ResponseInertiaProfile`
- `ConversationSceneContinuityProfile`
- `JudgmentFlowProfile`
- `ContinuityJudgmentProfile`
- `MemoryCandidatePolicy`
- `EvidenceClosureReport`
- Telegram visible delivery 관련 상태
- session handoff / recovery / approval surface 관련 상태

핵심 부족:

- BEAI 5의 “흐름”이 여러 프로파일로 흩어져 있고, 하나의 작은 공통 spine으로 정리되어 있지 않다.
- 사용자의 현재 대상, 요청 형식, 확정/미정/추정, 승인 경계, 마지막에 남길 하나가 하나의 상태 계약으로 묶이지 않는다.
- 런타임 overlay가 풍부하지만, 개발자가 새 기능을 붙일 때 어느 상태를 먼저 봐야 하는지 선명하지 않다.

### 2.3 BEAI Harness for Codex

역할:

- Codex 작업을 route, plan, verify, doctor, complete, closeout, final-check로 검증 가능한 개발 흐름에 태운다.
- OpenClaw Adapter가 필요할 때 참고하거나 호출할 수 있는 외부 하네스 후보가 된다.

현재 상태:

- `src/core/workflow-router.js`가 요청 라우팅과 위험 경계를 판단한다.
- `src/core/guided-product.js`가 사용자 요청을 시나리오/계획으로 바꾼다.
- `src/core/response-coach.js`와 `src/core/response-finalizer.js`가 응답 품질과 완료 주장 위험을 본다.
- `.beai-harness/state.json`과 `src/core/workspace.js`가 작업 상태를 저장한다.
- OpenClaw Adapter candidate는 local smoke와 OpenClaw session smoke를 통과한 상태다.

현재 상태에서 확인된 막힘:

- 새 BEAI 5 원칙 문서가 실제 구현보다 앞서 있어 product-quality gate가 review 상태를 낸다.
- 다만 이 문서의 1차 수정 대상은 Codex Harness가 아니라 OpenClaw용 BEAI Runtime/Package다.
- Codex Harness는 같은 Flow State 원칙을 나중에 맞출 공통 생태계 대상이며, 첫 스프린트의 필수 수정 대상이 아니다.

### 2.4 Knowledge Loop

역할:

- AI와 함께 일한 기록을 사용자의 실행 자산으로 바꾸는 검증 루프다.
- 단순 기억 저장이 아니라 source-grounded package knowledge 후보를 만들고, 승격/기각/보류를 다룬다.

현재 상태:

- daily automation, external connector, memory append dedup, persistent review lane, gateway watchdog이 있다.
- Memory는 “사장용”이 아니라 “사용자의 실행 자산”으로 정정되었다.

핵심 부족:

- Knowledge Loop 결과가 현재 턴 판단에 어떤 영향을 줬는지 런타임이 명시적으로 갖고 있지 않다.
- 장기 기억, 세션 맥락, 프로젝트 상태, package knowledge 후보가 사용자-facing 응답에서 섞일 위험이 있다.

### 2.5 Skills / Doctor / Release Verifier

역할:

- 각 전문 스킬이 개발, 릴리스, 진단, 기억, 자동화, 작업 인계의 좁은 책임을 맡는다.

현재 상태:

- Development Principles를 참조해야 할 스킬 업데이트 proposal이 존재한다.
- BEAI Doctor는 configured, registered, route visible, permission allowed, callable, call succeeded, output verified를 분리하는 운영 신뢰 모델을 갖고 있다.
- Release Verifier도 같은 operational reliability gate를 사용한다.

핵심 부족:

- BEAI 5 Flow Engine 기준이 모든 스킬에서 같은 방식으로 번역되어 있지 않다.
- 안전/보안/검증이 쾌적함을 해치면 실패라는 기준이 스킬별 출력과 실행 판단에 더 강하게 들어가야 한다.

## 3. 결론

Flow Engine은 별도 런타임으로 만들면 안 된다.

이미 BEAI Runtime Layer와 BEAI Harness Runtime이 존재한다. 따라서 새 엔진을 추가하면 중복, 느림, 상태 불일치가 생긴다.

올바른 방향은 다음이다.

```text
새 런타임 추가가 아니라,
먼저 OpenClaw BEAI Runtime Layer 안에
Flow State spine을 심고,
그 다음 Codex Harness와 공통 언어를 맞춘다.
```

Flow State spine은 독립 실행층이 아니라 공통 상태 계약이다.

## 4. 목표 아키텍처

### 4.1 Flow State Spine

모든 주요 요청은 내부적으로 다음 최소 상태를 가진다.

```text
currentTarget
requestedShape
responseRole
confirmed
unknowns
assumptions
userBurden
toolNeed
approvalBoundary
evidenceState
closureHandle
deliverySurface
memoryInfluence
```

이 상태는 사용자에게 그대로 보이지 않는다.

사용자에게는 다음처럼 번역되어야 한다.

- 지금 확인된 것
- 아직 정하지 않을 것
- 제가 먼저 할 일
- 사용자가 지금 하지 않아도 되는 일
- 마지막에 붙잡을 기준 또는 다음 행동

### 4.2 런타임 적용 위치

BEAI Runtime Layer:

- `runtime-core.ts` 안의 기존 profile들을 Flow State Spine에 연결한다.
- `buildTurnPlan`이 Flow State를 생성하거나 참조하게 한다.
- surface guard, inertia guard, judgment flow, memory candidate, Telegram delivery contract가 같은 상태를 기준으로 움직이게 한다.

BEAI Harness for Codex:

- OpenClaw Runtime 1차 통합 뒤 같은 Flow State 언어를 맞춘다.
- `route`, `plan`, `verify`, `closeout`, `final-check` 구조는 참고 대상이지만 첫 구현 대상은 아니다.
- 필요할 경우 OpenClaw Adapter를 통해 얇게 호출하거나 번역한다.

OpenClaw Adapter:

- Flow State를 직접 소유하지 않는다.
- BEAI Harness가 만든 판단과 상태를 OpenClaw 사용자가 이해하는 언어로 번역한다.
- adapter support claim은 계속 evidence-gated로 둔다.

Knowledge Loop:

- 새 기억을 곧바로 대화에 주입하지 않는다.
- 현재 판단을 바꾸는 기억만 `memoryInfluence` 후보로 올린다.
- package knowledge 후보와 사용자 장기 기억을 분리한다.

## 5. 개발 계획

### Phase 0. OpenClaw BEAI Runtime 상태 조사와 기준 고정

목표:

- OpenClaw BEAI Package 안에서 사용자 요청, 판단, 승인 경계, 메모리, Telegram 전달 상태가 어디서 만들어지는지 확인하고 1차 구현 범위를 고정한다.

작업:

1. `plugin/beai-runtime/src/runtime-core.ts`의 `buildTurnPlan`, `CurrentTurnPacket`, `JudgmentFrame`, response profile, delivery contract 생성 지점을 확인한다.
2. 기존 Runtime Layer를 유지하고, 새 독립 엔진을 만들지 않는다는 기준을 문서와 manifest에 고정한다.
3. Codex Harness 관련 작업은 공통 언어 정렬 또는 참고 대상으로만 라벨링한다.
4. 현재 상태를 “OpenClaw Runtime 우선 구현, Harness 정렬 후순위”로 둔다.

완료 기준:

- “문서만 있고 구현이 없는 상태”를 완료로 말하지 않는다.
- 첫 구현 단위가 OpenClaw BEAI Runtime 안의 Flow State Spine임이 명확해진다.

### Phase 1. OpenClaw Runtime용 Flow State Spine 최소 모델

목표:

- 기존 OpenClaw BEAI Runtime 안에 최소 상태 계약을 만든다.

BEAI Runtime Layer 작업:

1. `runtime-core.ts`에 `FlowStateSpine` 타입을 추가한다.
2. `BeaiTurnPlan`에 `flowState` 필드를 추가한다.
3. `buildFlowStateSpine` 정규화 함수를 둔다.
4. `currentTarget`, `requestedShape`, `responseRole`, `confirmed`, `unknowns`, `assumptions`, `userBurden`, `toolNeed`, `approvalBoundary`, `evidenceState`, `closureHandle`, `deliverySurface`, `memoryInfluence`를 최소 상태로 정의한다.
5. 기존 overlay와 response profile을 깨지 않고 파생 상태로 연결한다.

후순위 Harness 정렬:

- OpenClaw Runtime 통합 뒤 필요하면 Codex Harness의 `src/core/flow-state.js`와 같은 공통 언어를 맞춘다.
- 이 단계에서 Harness 파일은 1차 수정 대상이 아니다.

주의:

- 이 단계에서는 runtime behavior를 크게 바꾸지 않는다.
- 먼저 상태를 계산하고 테스트에서 보이게 하는 데 집중한다.

완료 기준:

- 산출물 요청, 검증 요청, 후속 턴, 외부 승인 경계 요청에서 Flow State가 안정적으로 생성된다.
- 기존 test suite가 깨지지 않는다.

### Phase 2. OpenClaw 응답 흐름 연결

목표:

- 사용자의 요청이 처음 들어올 때부터 OpenClaw Runtime 안에서 Flow State가 생성되고 overlay에 반영되게 한다.

작업:

1. `buildTurnPlan`에서 `CurrentTurnPacket`, `JudgmentFrame`, `EvidenceLedger`, `OperatingJudgment`를 모아 Flow State를 생성한다.
2. `renderPromptContext`는 내부 상태명을 과하게 노출하지 않고 필요한 운영 신호만 전달한다.
3. 사용자-facing 응답은 내부 상태명이 아니라 다음 언어로 번역되게 한다.
   - 요청 형식
   - AI가 할 일
   - 사용자 승인 경계
   - 검증 깊이
   - 마지막에 남길 하나

완료 기준:

- 계획 문서가 절차 설명이 아니라 사용자가 맡긴 일의 흐름을 보여준다.
- 짧은 실행/후속 요청이 과잉 절차로 빨려 들어가지 않는다.

### Phase 3. Runtime 응답 게이트 강화

목표:

- BEAI 5의 체감 품질 기준을 OpenClaw Runtime overlay와 guard로 내린다.

작업:

1. Runtime guard에 다음 검사 기준을 반영한다.
   - 첫 문장이 현재 요청으로 들어가는가
   - 산출물 요청에서 산출물이 지연되는가
   - 후속 턴에서 이전 구조를 반복하는가
   - 사용자의 판단 부담이 줄었는가
   - 마지막에 붙잡을 하나가 있는가
2. final surface guidance에 다음 차단 기준을 반영한다.
   - 내부 구조어 노출
   - 완료/적용/배포/검증 상태 혼동
   - 질문 남발
   - 미검증 최신/외부 정보 단정
   - Telegram direct에서 visible delivery 미검증 상태
3. 한국어 회귀 입력을 추가한다.

완료 기준:

- 좋은 답변의 기준이 “checked/changed/verified”만이 아니라 “선명함, 부담 감소, 쓸 수 있는 하나”까지 확장된다.

### Phase 4. Runtime Layer 통합

목표:

- OpenClaw에서 실제 대화 중 흐름이 끊기지 않게 한다.

작업:

1. `buildTurnPlan` 내부에서 Flow State를 생성한다.
2. 기존 runtime overlay의 다음 항목을 Flow State에서 파생하도록 정리한다.
   - requested_output_shape
   - response_role
   - confirmed / unknown / assumptions
   - next_visible_action
   - approval boundary
   - final delivery contract
3. 후속 턴 압축 로직을 강화한다.
4. recovery, handoff, session split에서도 Flow State의 `closureHandle`을 유지한다.

완료 기준:

- 대화가 길어져도 현재 요청의 대상과 형식이 유지된다.
- 후속 턴에서 전체 구조를 다시 설명하는 빈도가 줄어든다.
- Telegram direct에서 최종 응답과 실제 visible delivery를 혼동하지 않는다.

### Phase 5. Memory / Knowledge Loop 연결

목표:

- 기억이 흐름을 돕되 답변을 무겁게 만들지 않게 한다.

작업:

1. Knowledge Loop output에 `currentJudgmentImpact` 필드 추가
2. memory 후보를 다음으로 분리
   - session continuity
   - project state
   - package knowledge
   - long-term memory candidate
   - discard
3. Flow State에 `memoryInfluence` 요약만 연결
4. response-finalizer가 “사용자가 제공한 것”과 “기억/도구로 확인한 것”의 표현 혼동을 잡게 한다.

완료 기준:

- 기억을 많이 꺼내지 않아도 답변 정확도가 올라간다.
- 현재 판단을 바꾸지 않는 기억은 출력되지 않는다.

### Phase 6. OpenClaw Adapter / Doctor / Release Verifier 연결

목표:

- OpenClaw Runtime에서 만들어진 Flow State 기준을 Adapter, Doctor, Release Verifier까지 같은 언어로 확장한다.

작업:

1. OpenClaw Adapter wrapper 결과에 `flowSummary` 추가
2. BEAI Doctor 진단 결과를 Flow State의 evidenceState로 연결
3. Release Verifier가 configured/registered/callable/output verified를 Flow State와 같은 상태 언어로 번역
4. adapter support claim gate를 유지

완료 기준:

- OpenClaw 사용자는 “지금 이 작업이 어느 상태인지”를 같은 언어로 본다.
- adapter candidate, smoke-tested, supported가 섞이지 않는다.

### Phase 7. Package-wide Regression Gates

목표:

- 앞으로 기능이 늘어도 BEAI 5 흐름이 깨지지 않게 한다.

작업:

1. `beai self-check`에 Flow Engine 항목 추가
2. `engineering-quality`에 상태 중복/과잉 레이어 검사 추가
3. `field-readiness`에 사용자 흐름 단절 케이스 추가
4. `perceived-quality`에 안전하지만 답답한 응답 케이스 추가
5. release checklist에 Flow Engine regression 추가

완료 기준:

- 새 기능이 추가될 때마다 다음 회귀를 잡는다.
  - 과잉 질문
  - 안전 명분의 불편
  - 상태 혼동
  - 완료 과장
  - 현재 요청 이탈
  - 기억 과다 노출
  - 도구 로그 과다 출력

## 6. 구현 우선순위

1순위:

- Flow State Spine 최소 모델
- OpenClaw Runtime `buildTurnPlan` 연결
- 테스트 추가

2순위:

- Runtime 응답 게이트 강화
- 한국어 후속 턴 fixture
- 산출물 요청 fixture

3순위:

- Telegram visible delivery와 closureHandle 연결
- 상태/전송/검증 wording 분리

4순위:

- Knowledge Loop의 currentJudgmentImpact
- memoryInfluence 연결

5순위:

- OpenClaw Adapter flowSummary
- Doctor / Release Verifier 상태 언어 통합

6순위:

- Codex Harness와 공통 Flow State 언어 정렬
- package-wide regression gates
- release/readiness/self-check 반영

## 7. 첫 개발 스프린트

첫 스프린트는 크게 벌리지 않는다.

목표:

```text
기존 런타임을 깨지 않고 Flow State Spine을 만든다.
```

작업 범위:

- OpenClaw BEAI Runtime
  - `plugin/beai-runtime/src/runtime-core.ts`
  - `plugin/beai-runtime/src/index.ts`
  - `plugin/beai-runtime/dist/runtime-core.js`
  - `plugin/beai-runtime/dist/index.js`
- Capability Pack planning references
  - `capability-pack/docs/BEAI-5-FLOW-ENGINE-DEVELOPMENT-PLAN-v0.1-ko.md`
  - `capability-pack/README.md`
  - `capability-pack/routing.md`
  - `capability-pack/capability-pack.json`

제외:

- OpenClaw core 수정
- Codex Harness Runtime 직접 수정
- Telegram/Gateway 설정 변경
- Knowledge Loop automation 변경
- release package 재생성

검증:

- `npm run build` in `plugin/beai-runtime`
- `npm test` in `plugin/beai-runtime`
- runtime overlay sample 확인
- capability-pack manifest JSON parse 확인

첫 스프린트 성공 기준:

- Flow State가 생성된다.
- 기존 runtime overlay 출력이 깨지지 않는다.
- 짧은 direct/execution path가 유지된다.
- 산출물 요청과 검증 요청의 requestedShape가 구분된다.
- 완료 주장은 여전히 evidence gate 뒤에만 허용된다.

## 8. 가장 중요한 설계 판단

지금 가장 중요한 판단은 이것이다.

```text
Flow Engine은 새 시스템이 아니라 기존 BEAI Runtime을 먼저 정렬하고, 이후 Harness와 공유 언어를 맞추는 상태 spine이다.
```

따라서 개발자는 새로운 큰 프레임워크를 만들면 안 된다.

작게 만들고, 기존 함수들이 참조하게 하고, 테스트로 흐름이 맞는지 확인해야 한다.

## 9. 현재 단계 라벨

현재 라벨:

```text
package-regression-gates-implemented / implementation-pass-complete
```

아직 말하면 안 되는 것:

- Flow Engine 구현 완료
- OpenClaw 공식 지원 완료
- BEAI Package vNext 준비 완료
- 전체 runtime 통합 완료
- release package 재생성 완료

말할 수 있는 것:

- BEAI 5 Flow Engine 방향은 문서와 계획으로 고정되었다.
- 현재 OpenClaw BEAI Package에는 이를 받아낼 기존 Runtime Layer가 있다.
- OpenClaw Runtime Layer에 Flow State Spine 최소 모델과 `buildTurnPlan` 연결이 들어갔다.
- Runtime 응답 게이트가 Flow State 기준으로 추가되었다.
- recovery / handoff / session split에서 `closureHandle`이 이어지도록 연결되었다.
- Memory / Knowledge Loop의 `currentJudgmentImpact`가 Flow State `memoryInfluence` 언어로 연결되었다.
- Doctor / Package Check / Release Verifier가 Flow State evidence language를 사용하도록 연결되었다.
- Package-wide Flow Regression Gate가 추가되었고 self-check, engineering-quality, field-readiness, perceived-quality, release checklist 회귀를 확인한다.

## 10. 다음 행동

다음 행동은 구현이 아니라 검증과 정리다.

```text
최종 build/test/regression suite를 통과시킨 뒤 commit 또는 release packaging 여부를 별도 판단한다.
```

release package 재생성, OpenClaw core 수정, Gateway/Telegram 설정 변경, Codex Harness 정렬은 이 구현 패스에 포함하지 않는다.
