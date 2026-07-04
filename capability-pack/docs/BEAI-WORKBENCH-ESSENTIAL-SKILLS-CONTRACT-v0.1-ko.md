# BEAI Workbench Essential Skills Contract v0.1

Status: source candidate contract
Date: 2026-07-04
Config: `config/beai-workbench-essential-skills-contract.json`

## 목적

BEAI Workbench Essential Skills는 디자인, 발표자료, 문서, 리서치, 데이터 분석을 단순 프롬프트가 아니라 작업 운영 자원으로 다룬다.

이 계약은 각 Studio Skill이 반드시 가져야 할 구조와 품질 기준, 승인 경계, 완료 표현 제한을 고정한다.

## 핵심 원칙

- 사람의 판단권을 보존한다.
- 초안, 구조화, 산출물 생성, 검증, 승인 필요 상태를 분리한다.
- 디자인은 미감과 시각 품질을 1차 기준에 포함한다.
- 리서치는 주장, 사실, 추론, 반대 근거를 분리한다.
- 데이터 분석은 계산 재현성, 차트 정직성, 통계 해석 한계를 표시한다.
- 모든 Studio는 다음 사람이 이어받을 수 있는 handoff 상태를 제공한다.
- Pattern은 기본적으로 agent나 cron이 아니다.
- 외부 발송, 공개 게시, release, live 적용, Gateway 재시작, cron/hook/agent, durable memory는 별도 승인 전 하지 않는다.

## 5대 Studio

### BEAI Visual Design Studio

목적: 미적 완성도, 브랜드 일관성, 시각 QA를 가진 디자인 방향과 리뷰를 만든다.

핵심 품질 기준:

- 보기 좋은가
- 브랜드다운가
- 촌스럽지 않은가
- 읽히는가
- 여백과 정렬이 안정적인가
- 수정 가능한가

### BEAI Presentation Studio

목적: 발표자료를 텍스트 요약이 아니라 청중을 움직이는 시각적 설득 구조로 만든다.

핵심 품질 기준:

- 한 장당 메시지가 선명한가
- 모든 슬라이드에 시각 요소가 있는가
- 흐름이 결론으로 이어지는가
- speaker notes가 실제 발표용인가
- 렌더링 후 겹침과 잘림이 없는가

### BEAI Document Craft Studio

목적: 보고서, 제안서, 매뉴얼, 회의록을 독자가 읽고 판단할 수 있는 문서로 만든다.

핵심 품질 기준:

- 독자와 목적이 분명한가
- 결론과 근거가 분리됐는가
- 목차와 흐름이 자연스러운가
- 제출용과 내부 검토용이 구분되는가
- reader test가 가능한가

### BEAI Research Evidence Studio

목적: 검색 요약이 아니라 판단 가능한 근거 바닥을 만든다.

핵심 품질 기준:

- 출처가 실제로 확인됐는가
- 최신성이 필요한 항목을 확인했는가
- 주장, 사실, 추론이 분리됐는가
- 반대 근거를 봤는가
- 근거 강도를 표시했는가

### BEAI Data Insight Lab

목적: 데이터와 통계를 그럴듯한 설명이 아니라 재현 가능한 판단 도구로 만든다.

핵심 품질 기준:

- 데이터 구조와 결측치를 확인했는가
- 계산이 재현 가능한가
- 공식 오류가 없는가
- 차트가 과장하지 않는가
- 통계적 한계를 표시했는가

## 필수 SKILL.md 섹션

각 Studio Skill은 다음 섹션을 가져야 한다.

- Role
- When To Use
- Inputs
- Workflow
- Pattern Library
- Output Contract
- Quality Gate
- Handoff State
- Approval Boundary
- What Not To Claim
- User-Facing Summary Style

## 상태 라벨

- `draft`
- `structured`
- `artifact_generated`
- `render_checked`
- `evidence_checked`
- `formula_checked`
- `visual_checked`
- `reader_checked`
- `handoff_ready`
- `client_ready_candidate`
- `approval_required`

## 금지되는 완료 표현

증거 없이 다음 표현을 쓰지 않는다.

- 완성했습니다
- 검증됐습니다
- 제출 가능합니다
- live 적용됐습니다
- 자동화됐습니다
- agent로 승격됐습니다
- published
- released
- production-ready

## 검증

`tools/beai-workbench-skill-audit.mjs`가 이 계약을 read-only로 검사한다.

검사 대상:

- 계약 JSON 존재
- 5대 Studio Skill 존재
- 필수 섹션 존재
- quality gate 존재
- handoff state 존재
- approval boundary 존재
- forbidden claim boundary 존재

이 도구는 파일을 수정하지 않고 상태만 보고한다.
