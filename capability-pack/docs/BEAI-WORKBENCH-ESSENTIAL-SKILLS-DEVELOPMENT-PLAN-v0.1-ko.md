# BEAI Workbench Essential Skills Development Plan v0.1

Status: development plan candidate
Date: 2026-07-04
Target candidate: BEAI Package v0.2.5 / Workbench Essential Skills v0.1
Depends on: `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-RESEARCH-DOSSIER-v0.1-ko.md`

## 목표

BEAI Workbench Essential Skills는 BEAI Package가 보유해야 할 핵심 작업 자원이다.

목표는 다음 다섯 작업 영역을 사람 중심의 고품질 작업 스튜디오로 만드는 것이다.

- Visual Design
- Presentation
- Document Craft
- Research Evidence
- Data Insight

이 개발은 단순히 스킬 파일 5개를 추가하는 작업이 아니다.

```text
BEAI Workbench Essential Skills는
사람이 AI에게 지식노동을 맡길 때
좋은 결과물, 근거, 미감, 파일 완성도, 검증 상태, 책임 경계를
한 흐름으로 다루는 작업 운영층이다.
```

## 현재 상태

확인된 것:

- BEAI Package v0.2.4 / Runtime v0.6.20은 live aligned 상태로 운용된 기록이 있다.
- `BEAI-WORKBENCH-ESSENTIAL-SKILLS-RESEARCH-DOSSIER-v0.1-ko.md` 후보가 작성됐다.
- Research Dossier는 외부 skill/product 사례를 기준으로 5대 Studio, Pattern layer, Output Quality Gate, Control Center visibility 필요성을 정리한다.

아직 하지 않은 것:

- capability-pack manifest에 `essentialSkills` 섹션을 추가하지 않았다.
- 5대 Studio SKILL.md 파일을 만들지 않았다.
- Workbench 계약 JSON을 만들지 않았다.
- read-only audit 도구를 만들지 않았다.
- user scenario audit에 Workbench 시나리오를 추가하지 않았다.
- runtime/live/Gateway/GitHub release/cron/agent 변경은 하지 않았다.

## 설계 원칙

### 1. Human-centered delegation

BEAI는 사람이 판단권을 잃지 않고 AI에게 일을 맡길 수 있게 해야 한다.

스킬은 사용자의 의도를 복원하고 작업을 전개하되, 다음 상태를 반드시 분리한다.

- 초안
- 구조화됨
- 산출물 생성됨
- 렌더링 확인됨
- 근거 확인됨
- 계산 확인됨
- 시각 품질 확인됨
- 제출/공유 후보
- 승인 필요

### 2. Pleasant trust

검증은 사용자를 계속 멈춰 세우는 절차가 아니라, 사용자가 안심하고 빠르게 움직일 수 있게 하는 레일이어야 한다.

기본 흐름:

- 초안/분석/후보 생성은 빠르게 진행
- 파일 생성 후에는 조용히 검증
- 외부 발송, 공개 게시, 자동화 승격, durable memory 승격은 별도 승인
- 완료 주장은 증거가 닫힌 뒤에만 사용

### 3. Taste plus evidence

디자인은 미감이 필요하고, 리서치와 분석은 근거가 필요하다.

BEAI Workbench의 차별점은 다음 두 축을 동시에 갖는 것이다.

- Taste: 보기 좋은가, 읽히는가, 브랜드다운가, 촌스럽지 않은가
- Evidence: 출처가 있는가, 계산이 맞는가, 렌더링됐는가, 한계가 표시됐는가

### 4. Studio plus patterns

각 영역은 큰 Studio Skill과 작은 Pattern Library로 나눈다.

예:

- Studio: `beai-visual-design-studio`
- Pattern: `extract_brand_tokens`, `critique_visual_layout`, `second_pass_visual_polish`

이 구조는 외부 사례에서 확인한 Fabric식 micro-pattern 장점과 Anthropic Skills식 artifact-native 장점을 함께 흡수한다.

### 5. Artifact-native execution

스킬은 텍스트 조언으로 끝나면 안 된다.

각 영역은 실제 산출물의 형식과 검증 조건을 알아야 한다.

- Design: 이미지, 웹 화면, 랜딩 구조, 카드뉴스, 썸네일
- Presentation: PPTX, slide image render, speaker notes
- Document: Markdown, DOCX, PDF, report structure
- Research: source registry, citation pack, evidence matrix
- Data: CSV, XLSX, formula/recalc, charts

## 산출물 구조

### Phase 0. Planning baseline

목표:

- Research Dossier를 기반으로 개발 범위와 완료 조건을 고정한다.

산출물:

- `docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-DEVELOPMENT-PLAN-v0.1-ko.md`

완료 기준:

- 5대 Studio scope가 명확하다.
- 구현 파일 목록이 명확하다.
- 검증 게이트와 제외 범위가 명확하다.

### Phase 1. Workbench Contract

목표:

- 5대 Studio와 공통 품질 게이트를 package contract로 정의한다.

추가/수정 파일 후보:

- `capability-pack/config/beai-workbench-essential-skills-contract.json`
- `capability-pack/docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-CONTRACT-v0.1-ko.md`
- `capability-pack/capability-pack.json`

계약에 들어갈 항목:

- `version`
- `status`
- `studios`
- `patterns`
- `qualityGates`
- `artifactTypes`
- `stateLabels`
- `approvalBoundaries`
- `forbiddenClaims`

`studios` 기본 구조:

```json
{
  "id": "beai-visual-design-studio",
  "label": "BEAI Visual Design Studio",
  "status": "candidate",
  "domain": "visual-design",
  "triggers": [],
  "patterns": [],
  "qualityGates": [],
  "approvalBoundaries": []
}
```

완료 기준:

- 5대 Studio가 모두 contract에 존재한다.
- 각 Studio가 trigger, patterns, outputs, quality gates, approval boundaries를 가진다.
- status label이 Output Quality Gate와 일치한다.

### Phase 2. Studio Skill Drafts

목표:

- 5대 Studio의 실행형 SKILL.md 초안을 만든다.

추가 파일 후보:

- `capability-pack/skills/beai-visual-design-studio/SKILL.md`
- `capability-pack/skills/beai-presentation-studio/SKILL.md`
- `capability-pack/skills/beai-document-craft-studio/SKILL.md`
- `capability-pack/skills/beai-research-evidence-studio/SKILL.md`
- `capability-pack/skills/beai-data-insight-lab/SKILL.md`

각 SKILL.md 표준 구조:

```markdown
---
name: beai-...
description: ...
---

# Role
# When To Use
# Inputs
# Workflow
# Pattern Library
# Output Contract
# Quality Gate
# Approval Boundary
# What Not To Claim
# User-Facing Summary Style
```

description 기준:

- 짧고 라우팅 친화적으로 작성한다.
- 분야명만 쓰지 않고 실제 사용 상황을 포함한다.
- 예: "Use when the user asks for visually polished design direction, brand-consistent layouts, image prompts, landing/card/banner design, or visual QA."

완료 기준:

- 각 스킬 description이 160자 안팎으로 선명하다.
- 각 스킬에 최소 5개 pattern이 있다.
- 각 스킬에 output contract와 quality gate가 있다.
- 각 스킬에 forbidden completion claims가 있다.

### Phase 3. Pattern Library

목표:

- Studio별 반복 작업 패턴을 명명하고 재사용 가능하게 만든다.

초기 Pattern 후보:

Visual Design:

- `extract_brand_tokens`
- `create_visual_direction`
- `create_moodboard_brief`
- `critique_visual_layout`
- `pair_typography`
- `build_palette_system`
- `second_pass_visual_polish`

Presentation:

- `find_deck_thesis`
- `build_slide_narrative`
- `create_visual_motif`
- `audit_text_only_slides`
- `render_slide_qa`
- `tighten_speaker_notes`

Document Craft:

- `capture_context_dump`
- `build_reader_profile`
- `create_document_scaffold`
- `draft_section_with_options`
- `run_reader_test`
- `format_submission_version`

Research Evidence:

- `build_source_registry`
- `separate_claim_fact_inference`
- `check_recency`
- `find_counter_evidence`
- `grade_evidence_strength`
- `create_decision_source_pack`

Data Insight:

- `profile_dataset`
- `create_cleaning_log`
- `audit_formula_integrity`
- `choose_honest_chart`
- `separate_correlation_from_causation`
- `summarize_decision_implication`

구현 방식:

- v0.2.5에서는 pattern을 별도 실행 파일로 분리하지 않는다.
- 먼저 각 SKILL.md 내부의 `Pattern Library` 섹션으로 둔다.
- 반복 사용이 검증되면 추후 separate pattern files 또는 agent candidates로 승격한다.

완료 기준:

- 각 pattern은 input, action, output, quality note를 가진다.
- 자동화나 agent 승격을 주장하지 않는다.

### Phase 4. Read-only Audit Tool

목표:

- Workbench Essential Skills의 파일 존재와 구조 품질을 검사하는 read-only 도구를 만든다.

추가 파일 후보:

- `capability-pack/tools/beai-workbench-skill-audit.mjs`
- 필요 시 `capability-pack/tools/beai-workbench-skill-audit.test.mjs`

검사 항목:

- contract JSON 존재 여부
- 5대 Studio SKILL.md 존재 여부
- 각 SKILL.md frontmatter 존재 여부
- description 존재 여부
- `When To Use` 섹션 존재 여부
- `Workflow` 섹션 존재 여부
- `Pattern Library` 섹션 존재 여부
- `Output Contract` 섹션 존재 여부
- `Quality Gate` 섹션 존재 여부
- `Approval Boundary` 섹션 존재 여부
- `What Not To Claim` 섹션 존재 여부

출력 형식:

```json
{
  "status": "ready|partial|blocked",
  "version": "0.1",
  "studios": [],
  "missing": [],
  "warnings": [],
  "nextSafeAction": ""
}
```

완료 기준:

- 누락 파일이 있으면 `partial` 또는 `blocked`로 표시한다.
- 모든 필수 파일과 섹션이 있으면 `ready`로 표시한다.
- 도구는 read-only이며 파일을 수정하지 않는다.

### Phase 5. Package Verify and Doctor Integration

목표:

- 기존 package verify와 doctor package check가 Workbench 후보 상태를 볼 수 있게 한다.

수정 파일 후보:

- `capability-pack/tools/beai-package-verify.mjs`
- `capability-pack/tools/beai-doctor-package-check.mjs`
- `capability-pack/tools/beai-control-center.mjs`

추가할 상태:

- `workbenchSkillsStatus`
- `essentialSkillsPresent`
- `essentialSkillsContractPresent`
- `workbenchSkillAuditStatus`

Control Center 후보 표시:

```text
workbench:
  source: candidate
  studios: 5/5 present
  audit: ready
  live: not applicable
```

완료 기준:

- package verify가 Workbench 파일 누락을 감지한다.
- doctor package check가 Workbench 계약과 audit 도구를 확인한다.
- Control Center가 source/package 상태만 표시하고 live 적용처럼 말하지 않는다.

### Phase 6. Scenario Audit

목표:

- 실제 사용자가 맡길 만한 작업 흐름으로 5대 Studio가 작동하는지 검증한다.

수정 파일 후보:

- `capability-pack/tools/beai-user-scenario-audit.mjs`
- 필요 시 `capability-pack/docs/BEAI-WORKBENCH-ESSENTIAL-SKILLS-SCENARIOS-v0.1-ko.md`

초기 시나리오:

1. Visual Design: 브랜드 톤이 약한 랜딩페이지 시각 방향 요청
2. Presentation: 텍스트 초안을 발표자료 구조로 바꾸는 요청
3. Document Craft: 제안서 초안 구조화와 reader test 요청
4. Research Evidence: 특정 주제의 최신 근거 조사 요청
5. Data Insight: CSV/XLSX 데이터 분석과 차트 해석 요청

각 시나리오 검증 기준:

- 올바른 Studio가 선택되는가
- output state가 과장되지 않는가
- approval boundary가 정확한가
- 품질 게이트가 산출물 유형에 맞는가
- 사용자 선택 부담을 불필요하게 늘리지 않는가

완료 기준:

- 모든 신규 시나리오가 pass한다.
- 실패 시 어떤 section/contract를 고쳐야 하는지 드러난다.

### Phase 7. Documentation and Release Candidate

목표:

- v0.2.5 후보 문서와 릴리스 경계를 정리한다.

추가/수정 파일 후보:

- `capability-pack/README.md`
- `capability-pack/routing.md`
- `capability-pack/docs/UPGRADE-v0.2.5-ko.md`
- `plugin/beai-runtime/RELEASE-NOTES-v0.6.21-ko.md` 또는 runtime 변경이 없다면 생략

중요한 판단:

- Workbench Essential Skills가 capability-pack 문서/스킬/검증 도구만 추가한다면 runtime version bump는 필수가 아닐 수 있다.
- runtime prompt/context에 Workbench 상태를 노출하면 runtime bump 대상이다.
- Control Center 출력 구조를 바꾸면 package verify와 scenario audit 검증이 필요하다.

완료 기준:

- 사용자에게 "source candidate", "package verified", "released", "live applied"를 섞어 말하지 않는다.
- zip/release/live 적용은 별도 승인 전 하지 않는다.

## 검증 계획

기본 검증:

```bash
npm test
npm run verify
node capability-pack/tools/beai-doctor-package-check.mjs
node capability-pack/tools/beai-package-verify.mjs
node capability-pack/tools/beai-flow-regression-gate.mjs
node capability-pack/tools/beai-user-scenario-audit.mjs
node capability-pack/tools/beai-organic-flow-audit.mjs
```

Workbench 전용 검증:

```bash
node capability-pack/tools/beai-workbench-skill-audit.mjs
```

검증 통과 기준:

- 기존 테스트가 회귀하지 않는다.
- Workbench audit가 ready 또는 명시적 partial을 반환한다.
- user scenario audit에 신규 시나리오가 포함된다.
- Doctor/package verify가 Workbench 후보 상태를 감지한다.
- Control Center가 Workbench 상태를 과장 없이 표시한다.

## 승인 경계

승인 없이 가능한 작업:

- 문서 작성
- 계약 JSON 후보 작성
- SKILL.md 후보 작성
- read-only audit 도구 작성
- local test / verify 실행
- package source candidate 상태 보고

별도 승인 필요한 작업:

- GitHub commit/push
- GitHub release/tag 생성
- clean zip 생성 및 배포 asset 확정
- live runtime 적용
- Gateway restart
- cron/hook/agent 활성화
- durable memory promotion
- 외부 발송/공개 게시

## 리스크와 방지책

### 리스크 1. 스킬이 너무 커져서 느려짐

방지책:

- Studio는 방향과 품질 기준을 담당한다.
- 작은 반복 작업은 Pattern으로 나눈다.
- description은 짧게 유지한다.

### 리스크 2. 디자인 스킬이 이미지 프롬프트로 축소됨

방지책:

- Visual Design Studio에 브랜드 토큰, 타이포, 팔레트, 레이아웃 QA, second-pass polish를 필수화한다.

### 리스크 3. 리서치가 검색 요약으로 끝남

방지책:

- Research Evidence Studio에 source registry, claim/fact/inference split, counter-evidence를 필수화한다.

### 리스크 4. 데이터 분석이 과신됨

방지책:

- Data Insight Lab에 statistical boundary, correlation/causation separation, chart honesty를 필수화한다.

### 리스크 5. 완료 표현이 과장됨

방지책:

- Output Quality Gate에 state label을 고정한다.
- `What Not To Claim` 섹션을 모든 스킬에 넣는다.

## 첫 구현 단위

가장 작은 의미 있는 구현 단위는 다음이다.

1. Contract JSON
2. 5대 Studio SKILL.md 초안
3. Workbench audit 도구
4. Doctor/package verify 연결
5. User scenario audit 5개 추가

이 단위가 끝나면 다음을 말할 수 있다.

```text
BEAI Workbench Essential Skills v0.1 source candidate가 구성됐고,
5대 Studio의 파일/계약/품질 게이트/read-only audit/사용자 시나리오가
로컬 검증 기준으로 확인됐다.
```

이 단위가 끝나기 전에는 다음을 말하지 않는다.

- Workbench가 live 적용됐다.
- 자동화됐다.
- agent로 승격됐다.
- 모든 산출물 생성이 실제 파일 생성까지 보장된다.
- 디자인/문서/리서치/분석 결과가 항상 제출 가능하다.

## 권장 개발 순서

1. `beai-workbench-essential-skills-contract.json` 작성
2. 5대 Studio SKILL.md 작성
3. `beai-workbench-skill-audit.mjs` 작성
4. audit test 작성
5. package verify / doctor package check 연결
6. Control Center read-only status 연결
7. user scenario audit 5개 추가
8. docs/README/routing 업데이트
9. 전체 검증 실행
10. v0.2.5 source candidate 보고

## 완료 정의

v0.2.5 source candidate 완료 조건:

- 5대 Studio 스킬 파일 존재
- Workbench contract 존재
- manifest에 essentialSkills 후보 섹션 존재
- Workbench audit ready
- package verify pass
- doctor package check ready
- flow regression pass
- user scenario audit pass
- organic flow audit pass
- git diff가 의도한 파일 범위에 한정

release candidate 완료 조건:

- source candidate 검증 완료
- clean zip 생성
- SHA256 기록
- release verifier pass
- GitHub release 여부는 별도 승인 뒤 결정

live applied 완료 조건:

- live 적용 승인
- live runtime 또는 capability pack 적용 절차 수행
- Gateway 필요 시 재시작
- Control Center로 live/source/package 경계 확인
- Telegram visible delivery 필요 시 messageId 확인

## 현재 권장 판단

다음 작업은 바로 release가 아니라 v0.2.5 source candidate 구현이다.

가장 좋은 첫 번째 실행은 다음이다.

```text
Contract JSON + 5대 Studio SKILL.md + read-only audit를 먼저 만들고,
그 뒤 package verify, doctor, Control Center, scenario audit에 연결한다.
```

이 순서가 BEAI답다.

- 빠르게 유용한 스킬 후보를 만든다.
- 하지만 완료/검증/live 적용을 섞지 않는다.
- 사용자가 실제로 맡기고 싶은 작업의 품질 기준을 먼저 세운다.
- 자동화나 agent 승격은 나중에 증거가 생긴 뒤 다룬다.
