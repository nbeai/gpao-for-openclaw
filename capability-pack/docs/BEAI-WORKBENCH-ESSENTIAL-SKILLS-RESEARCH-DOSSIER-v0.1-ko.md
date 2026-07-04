# BEAI Workbench Essential Skills Research Dossier v0.1

Status: research dossier candidate
Date: 2026-07-04
Scope: BEAI Package for OpenClaw v0.2.5 candidate planning

## 목적

이 문서는 BEAI Package가 다음 버전에서 보유해야 할 핵심 작업 스킬을 설계하기 위한 외부 사례 조사와 BEAI식 강화 기준을 정리한다.

대상 영역은 다음 다섯 가지다.

- Visual Design
- Presentation
- Document Craft
- Research Evidence
- Data Insight

핵심 판단은 다음이다.

```text
BEAI Workbench Essential Skills는 "좋은 프롬프트 묶음"이 아니라
사람이 AI에게 지식노동을 맡길 때
결과물의 품질, 근거, 미감, 파일 완성도, 책임 경계를 함께 보장하는
인간중심 작업 운영 자원이어야 한다.
```

## 조사 라운드 요약

### Round 1. Agent Skill 생태계와 공개 저장소

확인한 대표 사례:

- Anthropic Skills: https://github.com/anthropics/skills
- VoltAgent Awesome Agent Skills: https://github.com/VoltAgent/awesome-agent-skills
- Awesome Claude Skills: https://github.com/travisvn/awesome-claude-skills
- Fabric: https://github.com/danielmiessler/Fabric
- prompts.chat: https://github.com/f/prompts.chat

확인 시점 기준 대표 신호:

- `anthropics/skills`: Agent Skills 공식 공개 저장소이며, design/document/pptx/xlsx/pdf 같은 실제 산출물 중심 스킬을 포함한다.
- `VoltAgent/awesome-agent-skills`: 여러 에이전트 도구에서 쓰이는 1000개 이상의 스킬을 큐레이션하며, 스킬 생태계가 특정 도구 하나에 갇히지 않는다는 점을 보여준다.
- `danielmiessler/Fabric`: 250개 이상의 작은 task pattern을 제공하며, 거대한 만능 스킬보다 작은 반복 패턴이 실제 사용성을 높인다는 점을 보여준다.
- `f/prompts.chat`: 역할/작업 프롬프트의 대중적 수요는 강하지만, 검증 루프와 산출물 품질 게이트가 없으면 BEAI가 지향하는 신뢰 운영층에는 부족하다.

BEAI에 반영할 점:

- 스킬은 `사용 시점`, `입력`, `작업 절차`, `산출물`, `품질 게이트`, `승인 경계`를 가져야 한다.
- OpenClaw 전용 사용성은 유지하되, 구조는 범용 Agent Skill처럼 읽히고 이식 가능해야 한다.
- 큰 Studio Skill과 작은 Pattern Skill을 분리해야 한다.

### Round 2. 공식 Anthropic Skills에서 배울 점

확인한 스킬:

- `frontend-design`
- `canvas-design`
- `doc-coauthoring`
- `pptx`
- `pdf`
- `xlsx`
- `brand-guidelines`

공통 강점:

- description이 짧고 강하다. 언제 스킬을 써야 하는지 라우팅이 선명하다.
- 본문은 단순 조언이 아니라 작업 절차를 가진다.
- 파일 포맷별 도구 사용법과 검증 방법이 있다.
- 디자인 스킬은 미감, 타이포그래피, 팔레트, 독창성, 자기비판을 명시한다.
- PPTX/XLSX/PDF 스킬은 실제 파일 처리, 렌더링, 오류 확인, 재계산 등 산출물 검증을 요구한다.

BEAI에 반영할 점:

- Visual Design Studio는 "목적에 맞는 디자인"을 넘어서 "보기 좋은가", "브랜드다운가", "AI 기본값처럼 보이지 않는가"를 1차 품질 기준에 넣어야 한다.
- Presentation Studio는 모든 슬라이드에 시각 요소, 시각 모티프, 렌더링 QA, 버그 헌트 방식의 검토를 포함해야 한다.
- Document Craft Studio는 context dump, section scaffold, co-authoring, reader test를 포함해야 한다.
- Data Insight Lab은 formula integrity, recalculation, chart honesty, statistical boundary를 포함해야 한다.
- Research Evidence Studio는 source registry, claim/fact/inference split, counter-evidence를 포함해야 한다.

### Round 3. 제품형 도구에서 배울 점

확인한 대표 사례:

- Canva Magic Design / Brand Kit: https://www.canva.com/magic-design/ , https://www.canva.com/pro/brand-kit/
- Figma AI / Figma Make: https://www.figma.com/ai/ , https://www.figma.com/make/
- NotebookLM: https://notebooklm.google/
- Elicit: https://elicit.com/
- Consensus: https://consensus.app/search/
- Gamma: https://gamma.app/
- Beautiful.ai: https://www.beautiful.ai/

공통 강점:

- 브랜드 일관성을 도구 차원에서 보장한다.
- 산출물이 편집 가능한 상태로 남는다.
- 여러 방향을 비교하고 반복 개선할 수 있다.
- 리서치 도구는 출처 기반 응답과 문헌 발견/검토 흐름을 분리한다.
- 발표/시각 문서 도구는 텍스트보다 레이아웃, 흐름, 시각적 인상을 중시한다.

BEAI에 반영할 점:

- BEAI는 단순 생성보다 `사용자가 이어서 고칠 수 있는 산출물`을 우선해야 한다.
- 디자인 결과물은 이미지 프롬프트로 끝나면 약하다. 브랜드 토큰, 레이아웃 방향, 시각 QA, 수정 포인트가 함께 나와야 한다.
- 리서치는 답변보다 근거 바닥을 먼저 만들어야 한다.
- 발표와 문서는 텍스트 요약이 아니라 독자/청중의 판단과 행동을 돕는 구조여야 한다.

### Round 4. Community-adopted skill libraries and handoff patterns

추가 확인한 대표 사례:

- VoltAgent Awesome Agent Skills: https://github.com/VoltAgent/awesome-agent-skills
- Orchestra Research AI Research Skills: https://github.com/orchestra-research/AI-research-SKILLs
- Awesome R Stats Skills: https://github.com/christopherkenny/awesome-rstats-skills
- PM Skills: https://github.com/product-on-purpose/pm-skills
- Awesome Claude Design: https://github.com/rohitg00/awesome-claude-design
- Awesome GitHub Copilot Skills: https://awesome-copilot.github.com/skills/

확인한 신호:

- 사랑받는 스킬 생태계는 "많은 스킬"보다 `검증된 사용 사례`, `분명한 호출 조건`, `반복 가능한 workflow`, `다음 사람이 이어받을 수 있는 handoff`를 중시한다.
- 연구/통계 계열은 단일 답변보다 lifecycle, reproducibility, sensitivity, source/assumption boundary를 강조한다.
- 디자인 계열은 aesthetic family, remix recipe, before/after evidence, reproducible prompt, visual screenshot 같은 "눈으로 확인 가능한 증거"를 중시한다.
- PM/업무 계열은 skill finder, workflow guide, overlapping skill comparison처럼 사용자가 어떤 스킬을 골라야 하는지 돕는 routing layer가 강하다.
- Copilot/GitHub 계열 skill catalog는 코드 투어처럼 실제 파일·위치·단계가 연결된 walkthrough를 산출물로 삼아, 결과를 조직 내 다른 사람이 이어받기 쉽게 만든다.

BEAI에 추가 반영할 점:

- 각 Studio는 `Pattern Library`를 6개 내외에서 9개 이상으로 확장하되, 단순 명령어가 아니라 실제 업무 실패를 막는 micro-pattern이어야 한다.
- 모든 Studio는 `Handoff State`를 가져야 한다. 사람, 다른 도구, 다음 세션이 이어받을 수 없는 결과는 아직 client-ready가 아니다.
- Visual Design은 `avoid_ai_default_fingerprint`, `build_editable_asset_brief`, `handoff_visual_decisions`를 가져야 한다.
- Presentation은 `build_slide_asset_plan`, `create_presenter_handoff`, `audit_slide_transition_logic`를 가져야 한다.
- Document는 `create_review_packet`, `track_open_questions`, `handoff_document_decisions`를 가져야 한다.
- Research는 `map_source_disagreement`, `quote_or_paraphrase_safely`, `handoff_research_assumptions`를 가져야 한다.
- Data Insight는 `build_reproducibility_notes`, `stress_test_interpretation`, `handoff_analysis_assumptions`를 가져야 한다.

## 사랑받는 스킬의 패턴

### 1. Trigger clarity

좋은 스킬은 언제 써야 하는지가 분명하다.

BEAI 기준:

- 사용자가 파일, 산출물, 업무 장면을 자연어로 말해도 적절한 Studio/Pattern이 자동으로 떠올라야 한다.
- description은 짧고 라우팅 친화적이어야 한다.

### 2. Artifact-native behavior

좋은 스킬은 텍스트 설명만 하지 않고 실제 산출물의 형식을 이해한다.

BEAI 기준:

- DOCX/PDF/PPTX/XLSX/이미지/웹 화면은 각각 별도 품질 기준을 가진다.
- 파일 생성, 수정, 렌더링, 열림 확인, 오류 검사를 분리해서 말해야 한다.

### 3. Embedded craft knowledge

사랑받는 스킬은 현업자의 손맛이 들어 있다.

BEAI 기준:

- 디자인은 미감, 시각 리듬, 여백, 타이포그래피, 색감, 브랜드 톤을 다룬다.
- 문서는 독자, 목적, 제출 형식, 읽는 순서를 다룬다.
- 분석은 데이터 품질, 계산 재현성, 해석 한계를 다룬다.
- 리서치는 출처, 최신성, 반대 근거, 주장의 강도를 다룬다.

### 4. Verification loop

좋은 스킬은 결과를 만든 뒤 반드시 확인한다.

BEAI 기준:

- 디자인: screenshot/render QA
- PPT: slide image QA, text overflow, contrast, layout consistency
- DOC/PDF: rendering, page break, table extraction, form/OCR boundary
- XLSX: formula errors, recalculation, hardcoded value policy
- Research: source validity, recency, counter-evidence
- Data: cleaning log, chart honesty, statistical boundary

### 5. Human agency

BEAI의 차별점은 여기서 나온다.

좋은 산출물을 만들되, 사용자가 판단권을 잃으면 안 된다.

BEAI 기준:

- 결과물은 `완성`, `초안`, `검토 필요`, `근거 부족`, `승인 필요`를 분리한다.
- 사용자를 계속 멈춰 세우지 않지만, 책임이 넘어가는 지점은 선명하게 멈춘다.
- 설명은 전문가용 내부어보다 사용자가 바로 판단할 수 있는 언어로 한다.

## BEAI Workbench Essential Skills v0.1 제안 구조

### 1. BEAI Visual Design Studio

역할:

- 디자인 산출물의 미적 완성도와 브랜드 일관성을 책임진다.

범위:

- 랜딩/상세페이지 방향
- 카드뉴스, 포스터, 썸네일, 배너
- 브랜드 무드보드
- UI 시각 방향
- 이미지 생성 프롬프트와 시안 리뷰
- 시각 품질 감사

필수 패턴:

- `extract_brand_tokens`
- `create_visual_direction`
- `create_moodboard_brief`
- `critique_visual_layout`
- `pair_typography`
- `build_palette_system`
- `second_pass_visual_polish`

품질 기준:

- 보기 좋은가
- 브랜드다운가
- 촌스럽지 않은가
- 첫 화면에서 무엇인지 보이는가
- 글자가 읽히는가
- 여백과 정렬이 안정적인가
- 모바일/데스크톱에서 깨지지 않는가
- 수정 가능한 산출물인가

### 2. BEAI Presentation Studio

역할:

- 발표자료를 텍스트 요약이 아니라 시각적 설득 구조로 만든다.

범위:

- 강의안
- 제안서 발표자료
- 투자/영업/내부 보고 deck
- 발표 스크립트와 speaker notes

필수 패턴:

- `find_deck_thesis`
- `build_slide_narrative`
- `create_visual_motif`
- `audit_text_only_slides`
- `render_slide_qa`
- `tighten_speaker_notes`

품질 기준:

- 한 장당 메시지가 선명한가
- 청중이 누구인지 반영됐는가
- 모든 슬라이드에 시각 요소가 있는가
- 텍스트가 과밀하지 않은가
- 렌더링 후 겹침과 잘림이 없는가
- 흐름이 결론으로 자연스럽게 이어지는가

### 3. BEAI Document Craft Studio

역할:

- 문서를 글 덩어리가 아니라 제출/공유/검토 가능한 업무 산출물로 만든다.

범위:

- 제안서
- 보고서
- 사업계획서
- 매뉴얼
- 회의록
- 정책 문서
- PDF/Word 문서 구조화

필수 패턴:

- `capture_context_dump`
- `build_reader_profile`
- `create_document_scaffold`
- `draft_section_with_options`
- `run_reader_test`
- `format_submission_version`

품질 기준:

- 독자와 목적이 분명한가
- 결론과 근거가 분리됐는가
- 목차와 흐름이 자연스러운가
- 표/그림/요약 박스가 필요한 곳에 있는가
- 제출용과 내부 검토용이 구분되는가
- 렌더링 또는 포맷 검증이 가능한가

### 4. BEAI Research Evidence Studio

역할:

- 검색 결과 요약이 아니라 판단 가능한 근거 바닥을 만든다.

범위:

- 시장/경쟁사 조사
- 논문/기술 리서치
- 정책/규정/제품 비교
- ClawHub/BEAI 제품 전략 조사

필수 패턴:

- `build_source_registry`
- `separate_claim_fact_inference`
- `check_recency`
- `find_counter_evidence`
- `grade_evidence_strength`
- `create_decision_source_pack`

품질 기준:

- 출처가 실제로 확인됐는가
- 최신성이 필요한 항목을 확인했는가
- 주장, 사실, 추론이 분리됐는가
- 반대 근거를 봤는가
- 사용자가 바로 판단할 수 있는 요약인가

### 5. BEAI Data Insight Lab

역할:

- 데이터와 통계를 그럴듯하게 설명하는 것이 아니라, 재현 가능한 판단 도구로 만든다.

범위:

- CSV/XLSX 분석
- 매출/비용/운영 지표
- 설문/고객 피드백
- 통계 요약
- 차트와 대시보드 초안

필수 패턴:

- `profile_dataset`
- `create_cleaning_log`
- `audit_formula_integrity`
- `choose_honest_chart`
- `separate_correlation_from_causation`
- `summarize_decision_implication`

품질 기준:

- 데이터 구조와 결측치를 확인했는가
- 계산이 재현 가능한가
- 공식 오류가 없는가
- 차트가 과장하지 않는가
- 통계적 한계를 표시했는가
- 의사결정용 요약과 분석자용 부록을 분리했는가

## 공통 Output Quality Gate

모든 Workbench Skill은 다음 상태 라벨을 사용한다.

- `draft`: 초안
- `structured`: 구조화됨
- `artifact_generated`: 산출물 생성됨
- `render_checked`: 렌더링 확인됨
- `evidence_checked`: 근거 확인됨
- `formula_checked`: 수식/계산 확인됨
- `visual_checked`: 시각 품질 확인됨
- `reader_checked`: 독자 관점 확인됨
- `client_ready_candidate`: 제출/공유 후보
- `approval_required`: 외부 발송, 공개 게시, 장기 기억, 자동화 등 사용자 승인 필요

금지 표현:

- 렌더링 전 `완성`
- 출처 확인 전 `검증됨`
- 공식 재계산 전 `분석 완료`
- 사용자 승인 전 `발송/게시 완료`
- 시각 QA 전 `디자인 완성`

## BEAI 차별화 기준

외부 스킬과 BEAI의 차이는 다음이어야 한다.

### 1. Human-centered delegation

BEAI는 AI가 대신 판단하는 도구가 아니라, 사람이 판단권을 잃지 않고 더 높은 품질의 일을 맡길 수 있게 돕는 도구다.

### 2. Pleasant trust

검증은 사용자를 멈추는 장벽이 아니라 사용자가 빠르게 믿고 넘어가도록 돕는 레일이어야 한다.

### 3. Taste plus evidence

디자인은 근거만으로 부족하고, 리서치는 미감만으로 부족하다.

BEAI Workbench는 다음 두 축을 동시에 가져야 한다.

- taste: 보기 좋은가, 읽히는가, 브랜드다운가, 촌스럽지 않은가
- evidence: 근거가 있는가, 계산이 맞는가, 출처가 확인됐는가, 한계를 표시했는가

### 4. Studio plus patterns

큰 작업 영역은 Studio가 담당하고, 반복 가능한 작은 노하우는 Pattern이 담당한다.

예:

- Studio: BEAI Visual Design Studio
- Pattern: `pair_typography`, `critique_visual_layout`, `second_pass_visual_polish`

### 5. Control Center visibility

사용자가 지금 상태를 한눈에 볼 수 있어야 한다.

예:

```text
skill selected -> pattern selected -> artifact generated -> QA checked -> client-ready candidate
```

## v0.2.5 후보 작업 순서

### Phase 1. Research Dossier and Contract

- 이 문서를 기준으로 5대 Studio 계약 초안 작성
- `config/beai-workbench-essential-skills-contract.json` 후보 작성
- capability pack manifest에 `essentialSkills` 후보 섹션 추가

### Phase 2. Skill Drafts

- `skills/beai-visual-design-studio/SKILL.md`
- `skills/beai-presentation-studio/SKILL.md`
- `skills/beai-document-craft-studio/SKILL.md`
- `skills/beai-research-evidence-studio/SKILL.md`
- `skills/beai-data-insight-lab/SKILL.md`

각 스킬은 반드시 다음 구조를 가진다.

- Trigger
- Inputs
- Workflow
- Pattern library
- Outputs
- Quality gate
- Approval boundary
- What not to claim

### Phase 3. Read-only Audit

- `tools/beai-workbench-skill-audit.mjs` 후보 작성
- 필수 파일 존재 확인
- 각 스킬의 Trigger/Workflow/Quality Gate/Approval Boundary 존재 확인
- Control Center에 domain status 표시 후보 연결

### Phase 4. Scenario Audit

최소 5개 시나리오를 추가한다.

- 디자인 시안 요청
- PPT 생성 요청
- 제출용 문서 작성 요청
- 출처 기반 리서치 요청
- XLSX/CSV 분석 요청

### Phase 5. Packaging Boundary

- v0.2.5 후보로만 유지
- live 적용, GitHub release, public publish는 별도 승인 전 하지 않음
- agent/cron 자동화 승격은 3회 이상 수동 실행과 실패 경계 확인 전 하지 않음

## 현재 결론

BEAI Workbench Essential Skills는 BEAI Package의 핵심 자원으로 설계할 가치가 있다.

다만 이 작업은 단순 스킬 추가가 아니라 다음 세 가지를 함께 만드는 일이다.

1. 고품질 작업 노하우
2. 산출물별 검증 루프
3. 인간중심 책임 경계

따라서 v0.2.5 후보의 첫 산출물은 바로 구현된 runtime 기능이 아니라, 이 Research Dossier를 바탕으로 한 5대 Studio Skill 계약과 read-only audit이어야 한다.

## 참고한 공개 사례

- Anthropic Skills: https://github.com/anthropics/skills
- Anthropic Agent Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- VoltAgent Awesome Agent Skills: https://github.com/VoltAgent/awesome-agent-skills
- Awesome Claude Skills: https://github.com/travisvn/awesome-claude-skills
- Fabric: https://github.com/danielmiessler/Fabric
- prompts.chat: https://github.com/f/prompts.chat
- Canva Magic Design: https://www.canva.com/magic-design/
- Canva Brand Kit: https://www.canva.com/pro/brand-kit/
- Figma AI: https://www.figma.com/ai/
- Figma Make: https://www.figma.com/make/
- NotebookLM: https://notebooklm.google/
- Elicit: https://elicit.com/
- Consensus: https://consensus.app/search/
- Gamma: https://gamma.app/
- Beautiful.ai: https://www.beautiful.ai/
