# BEAI Package Module Map v0.1

## 목적

이 문서는 비아이패키지를 계속 향상시키기 위한 기능 지도입니다.

비아이패키지는 하나의 단일 프로그램이 아니라 OpenClaw 위에 장착되는 기능형 운영 패키지입니다. 따라서 설명, 점검, 문제 해결, 개선 계획을 하려면 "좋은 철학"만으로는 부족합니다. 각 기능이 어디에 있고, 무엇을 담당하며, 어떤 기능과 연결되고, 무엇으로 검증되는지 볼 수 있는 지도가 필요합니다.

이 맵은 세 가지 용도로 씁니다.

- 사람에게 비아이패키지를 정확히 설명하기
- 각 부품의 상태와 품질을 따로 점검하기
- 서로 연결된 부품 사이에서 문제 원인과 발전 지점을 찾기

구조화된 원본은 `config/beai-package-module-map.json`입니다. 이 문서는 사람이 읽기 위한 설명본입니다.

## 사용 원칙

- 기능 지도는 홍보 문구가 아니라 패키지 운영 기준입니다.
- 철학과 원칙은 중요하지만, 이 문서는 실제 개발된 기능 단위를 중심으로 봅니다.
- 각 모듈은 담당 영역, 사용자 가치, 주요 파일, 의존 관계, 검증 방법, 개선 축을 가져야 합니다.
- 새 기능을 추가할 때는 기능만 추가하지 않고 맵, 검증, 문서, 연결 관계를 함께 갱신합니다.
- 맵은 읽기 전용 기준입니다. 설치, 배포, 게이트웨이 재시작, 텔레그램 발송, cron/agent 활성화, 메모리 쓰기를 직접 수행하지 않습니다.

## 전체 구조

현재 설명 기준은 다음과 같습니다.

- 상위 기능군: 10개
- 하위 기능 모듈: 25개 이상
- 검사 도구: `tools/beai-package-map-check.mjs`
- 패키지 검증 연결: `tools/beai-package-verify.mjs`
- 상태 표시 연결: `tools/beai-control-center.mjs`

## 1. Runtime Layer

런타임 계층은 비아이패키지가 OpenClaw 안에서 실제로 작동하게 하는 부분입니다.

대표 모듈:

- `beai-runtime-plugin`

담당:

- OpenClaw 플러그인으로 비아이 런타임을 로드
- 응답 게이트, 상태 언어, 승인 경계, 실행 전후 판단을 런타임에 반영
- 패키지 정책과 사용자 대화 사이의 작동 경계를 연결

주요 확인:

- 런타임 소스 버전과 live 버전이 맞는가
- 플러그인 manifest가 현재 버전을 가리키는가
- runtime build와 syntax test가 통과하는가

## 2. Control and State Center

컨트롤·상태 계층은 패키지 전체를 조감하는 부분입니다.

대표 모듈:

- `beai-control-center`
- `state-ledgers`

담당:

- source/runtime/live/package/release 상태 표시
- workflow, promotion, automation, memory, verification 장부 확인
- 다음 안전 행동과 보류 신호 표시
- "자동 실행 장부"와 "후보 장부" 분리

주요 확인:

- Control Center가 read-only로 작동하는가
- 상태 장부가 누락되지 않았는가
- blocked 상태가 실제 실패인지, 승인 보류인지 구분되는가

## 3. Doctor and Repair Planning

진단·복구 계획 계층은 문제가 생겼을 때 원인, 범위, 복구 가능성, 검증 기준을 분리하는 부분입니다.

대표 모듈:

- `beai-doctor`
- `wake-guard-installer`

담당:

- BEAI-on-OpenClaw 상태 진단
- Telegram/Gateway/runtime/skill/package 경계 분리
- 진단, 완화, 복구, 검증, 예방 표현 분리
- 노트북 sleep/wake 이후 회복 경로 보조

주요 확인:

- 닥터가 OpenClaw core 문제와 BEAI-owned 문제를 섞지 않는가
- 복구를 주장하기 전에 같은 조건 재검증 증거가 있는가
- helper가 승인 없이 live service를 바꾸지 않는가

## 4. Verification Gates

검증 계층은 비아이패키지가 스스로의 주장을 증거로 확인하게 만드는 부분입니다.

대표 모듈:

- `beai-package-verify`
- `beai-package-map-check`
- `beai-flow-regression-gate`
- `beai-user-scenario-audit`
- `beai-organic-flow-audit`
- `beai-package-truth-check`

담당:

- 패키지 전체 검증 실행
- 기능 지도의 파일/의존성/검증 커버리지 확인
- 사용자 시나리오와 흐름 회귀 점검
- 유기적 연결성 확인
- stale claim과 과장된 릴리스 주장 방지

주요 확인:

- 기능이 추가되면 검증 도구도 따라오는가
- 문서의 주장과 실제 manifest/runtime/release 상태가 맞는가
- 사용자에게 "완료"라고 말해도 되는 증거가 있는가

## 5. Knowledge Loop

지식 루프 계층은 작업 기록과 외부 신호를 장기 자산으로 바꾸되, 자동 승격하지 않도록 막는 부분입니다.

대표 모듈:

- `beai-knowledge-loop`

담당:

- 작업 기록 수집
- 외부 신호 분류
- 기억 후보 생성
- report-only 출력
- bounded memory append
- 자동 승인 없는 검토 흐름 유지

주요 확인:

- 후보와 확정 기억이 분리되는가
- 자동화 후보가 곧바로 cron/agent로 승격되지 않는가
- 출처 기반 기록으로 남는가

## 6. Workbench Studios

워크벤치 스튜디오 계층은 실제 사용자가 체감하는 생산성 작업을 담당합니다.

대표 모듈:

- `beai-workbench-essential-skills`
- `beai-visual-design-studio`
- `beai-presentation-studio`
- `beai-document-craft-studio`
- `beai-research-evidence-studio`
- `beai-data-insight-lab`

담당:

- 디자인 품질과 시각 QA
- 발표자료 구성과 렌더/시각 검토
- 독자 중심 문서 작성
- 출처 기반 리서치
- 데이터 분석, 통계, 차트, 해석 한계

주요 확인:

- 각 Studio가 독립 품질 기준을 갖는가
- Research Evidence Studio가 External Reach와 연결되는가
- Workbench Skill Audit이 5개 Studio를 모두 확인하는가

## 7. External Reach

외부 자료 연결 계층은 리서치가 실제 근거를 다루게 하는 부분입니다.

대표 모듈:

- `beai-external-reach-layer`

담당:

- public web, GitHub, YouTube, RSS read-only 채널 정의
- X/Twitter, Reddit, Meta 계열 approval-gated 채널 분리
- source registry, freshness, access method, login/cookie risk 기록
- External Reach Doctor로 채널 상태 확인

주요 확인:

- 공개 채널과 계정/쿠키 채널이 분리되는가
- 소셜 계열을 자동 접근 대상으로 과장하지 않는가
- Research Evidence Studio와 근거 흐름이 연결되는가

## 8. Operating Skills

운영 스킬 계층은 비아이패키지를 계속 개발하고 설명하고 이어받기 위한 재사용 행동입니다.

대표 모듈:

- `beai-development-steward`
- `beai-release-verifier`
- `beai-session-handoff`
- `beai-memory-curator-review`
- `beai-korean-natural-writing`

담당:

- 개발 스튜어드십
- 릴리스 검증
- 세션 인계
- 기억 후보 검토
- 한국어 사용자-facing 품질

주요 확인:

- 스킬이 실제 파일로 패키지에 포함되어 있는가
- live-applied, source-candidate, packaged-candidate 상태가 섞이지 않는가
- 사용자에게 보이는 문장이 상태를 과장하지 않는가

## 9. Contracts and Policies

계약·정책 계층은 비아이 철학을 런타임과 검증 가능한 기준으로 바꾸는 부분입니다.

대표 모듈:

- `human-companion-quality-contract`
- `action-semantics-contract`
- `friction-aware-gate-contract`
- `telegram-delivery-contract`
- `operational-notification-contract`

담당:

- 사용자 이해와 신뢰 회복
- 보고/완화/복구/검증/예방 분리
- 필요한 순간에만 승인 요구
- Telegram 전달 증거 기준
- 운영 알림 소음 방지

주요 확인:

- 계약이 문서와 config 양쪽에 있는가
- runtime 또는 검증 게이트에 연결되어 있는가
- 실제 사용자 경험을 무겁게 만들지 않고 안전선을 지키는가

## 10. Distribution and Release

배포·릴리스 계층은 비아이패키지를 설치 가능하고 검증 가능한 산출물로 묶는 부분입니다.

대표 모듈:

- `package-manifest`
- `release-package-system`

담당:

- capability pack manifest
- 버전 상태
- release notes
- clean zip
- sha256
- GitHub release asset
- package verify output

주요 확인:

- manifest, runtime, release notes, zip 이름의 버전이 일치하는가
- sha256이 있는가
- release 후보와 live 적용 상태를 섞지 않는가

## 개선에 쓰는 방법

앞으로 비아이패키지를 개선할 때는 이 순서로 봅니다.

1. 어느 기능군의 문제인가
2. 어떤 하위 모듈이 관련되는가
3. 그 모듈의 주요 파일은 어디인가
4. 어떤 모듈과 의존 관계가 있는가
5. 현재 검증 도구가 그 문제를 잡을 수 있는가
6. 검증 도구가 없다면 새 기능보다 검증 기준을 먼저 추가해야 하는가
7. 사용자가 체감하는 가치가 올라가는가

이 맵의 핵심은 기능을 많이 나열하는 것이 아닙니다. 비아이패키지를 계속 발전시킬 때 "어디를 봐야 하는지", "무엇과 연결되어 있는지", "무엇으로 확인해야 하는지"를 잃지 않게 만드는 것입니다.

