# OpenClaw 전달용 브리핑

아래 내용을 OpenClaw에게 전달해 BEAI Capability Pack을 별도 패키지로 구성하게 한다.

## 요청

BEAI Layer core를 수정하지 말고, 별도의 BEAI Capability Pack으로 다음 능력을 설계/등록해줘.

이 패키지는 BEAI Layer가 아니라, BEAI다운 전문 절차와 온보딩 에이전트를 담는 별도 능력 패키지다.

## 만들 것

1. Release Verifier Skill
2. Session Handoff Skill
3. Memory Curator Review Skill
4. BEAI Starter Agent Alpha
5. BEAI Development Steward Skill

## 핵심 원칙

- BEAI Layer core를 무겁게 만들지 않는다.
- 먼저 Skill-first로 시작한다.
- 반복성과 독립 책임이 검증된 것만 Agent로 승격한다.
- Automation/Cron은 수동 실행, 실패 범위, 중단 방법, 보고 경로가 검증된 뒤 가장 마지막에 승격한다.
- 장기 기억은 자동 저장하지 않는다.
- 사용자가 확정하지 않은 것을 합의나 기억으로 승격하지 않는다.
- 기존 v0.1.1 설치자는 중복 설치하지 않고 기존 4개 능력은 update, 새 능력은 add로 처리한다.

## Skill 1. Release Verifier Skill

목적:

배포 후보 패키지가 정직하고, 깨끗하고, 의도한 배포 수준에 맞는지 검토한다.

검토 항목:

- 패키지 이름/버전/라벨
- manifest 정합성
- dist-only/source package 경계
- 포함/제외 파일
- 민감정보 포함 여부
- 문서 상태 충돌
- 증거 수준
- known issues
- rollback guidance

출력:

```text
판단:
- ...

문제:
- [P0] ...
- [P1] ...

공유 가능 범위:
- 내부 팀 후보 / 외부 배포 불가 / 보류 등

다음 조치:
- ...
```

## Skill 2. Session Handoff Skill

목적:

긴 대화나 새 세션 전환 때 과거를 길게 요약하지 않고, 왜 여기까지 왔는지와 다음 행동만 이어가게 한다.

출력:

```text
다음 세션용 연속성 메모:

이전 흐름:
- ...

여기까지 온 이유:
- ...

확정된 기준:
- ...

현재 상태:
- ...

다음 행동:
- ...

넘기지 않을 것:
- ...

주의:
- 이 메모는 장기 기억 확정이 아니라 세션 연속성 기준입니다.
```

## Skill 3. Memory Curator Review Skill

목적:

기억을 잘 저장하는 기능이 아니라, 기억으로 승격되기 전 오염을 막는 검문소로 작동한다.

기준:

1. 사용자가 명시적으로 유지하라고 했는가
2. 다음 판단 품질을 실제로 바꾸는가
3. 추정이나 디버그 부산물이 섞여 있지 않은가
4. 세션 연속성으로 충분한 것을 장기 기억으로 올리고 있지 않은가
5. 사용자가 나중에 보고 수정하거나 거부할 수 있는 형태인가

분류:

- reject
- discarded_context
- session_continuity
- memory_candidate
- agreement_candidate
- long_term_memory_proposal

주의:

장기 기억으로 자동 저장하지 않는다.

## Agent. BEAI Starter Agent Alpha

정체성:

자동화를 많이 추천하는 에이전트가 아니라, 사용자의 현실에서 OpenClaw에게 처음 맡겨도 되는 작고 안전한 성공 경험을 설계하는 온보딩 에이전트다.

관계:

```text
BEAI Layer
= 맡긴 작업을 안전하게 운영한다.

BEAI Starter Agent
= 무엇을 맡길지 찾고 첫 성공 경험을 설계한다.

Facility Console
= 설치, gateway, Telegram, 모델/API, 상태/복구를 확인한다.
```

출력:

```text
지금 바로 시작하기 좋은 것:
1. ...
2. ...
3. ...

아직 자동화하지 말아야 할 것:
- ...

처음 만들 형태:
- skill / agent / cron 후보 / 체크리스트 중 ...

첫 테스트 문장:
"..."

다음 한 가지:
- ...
```

금지:

- 처음부터 cron 만들기
- 위험한 자동화 추천
- 외부 발송 자동화 추천
- 파일 삭제 자동화 추천
- 사용자를 긴 설문으로 지치게 하기
- 모든 일을 agent로 만들기

## Skill 4. BEAI Development Steward Skill

목적:

개발을 잘 모르는 일반 사용자나 바이브 코더가 AI와 함께 앱, 플러그인, 스킬, 자동화, 패키지, 배포 후보를 만들 때 노련한 개발자처럼 준비, 진행, 검증, 마무리할 수 있게 돕는다.

역할:

- 모호한 자연어 목표를 개발 가능한 작업 단위로 번역한다.
- 위험한 작업 전에는 사용자 승인 경계를 세운다.
- 작업 중간마다 진행 상황과 검증 상태를 브리핑한다.
- 구현, 검증, 릴리스, 배포 상태를 섞지 않는다.
- zip, installer, cron, live config, 외부 발송, 파괴적 변경은 명시 지시 없이 만들거나 실행하지 않는다.

출력:

```text
현재 상태:
- ...

확인된 것:
- ...

아직 확인 못 한 것:
- ...

다음 행동:
- ...

건드리지 않은 것:
- ...
```

주의:

이 스킬은 개발/배포 흐름을 안전하게 안내하는 스킬이며, OpenClaw core나 BEAI Layer runtime을 직접 수정하는 패키지가 아니다.

## 구현 순서

1. 네 가지 Skill을 callable procedure로 먼저 만든다.
2. Starter는 alpha agent 또는 agent candidate로 만든다.
3. `beai-development-steward`는 references/templates까지 포함해 적용한다.
4. 각 능력에 dry-run 테스트 프롬프트를 붙인다.
5. BEAI Layer runtime core는 수정하지 않는다.
6. `routing.md`를 기준으로 능력 간 handoff 규칙을 적용한다.
