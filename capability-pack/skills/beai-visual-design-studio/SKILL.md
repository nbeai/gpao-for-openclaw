---
name: beai-visual-design-studio
description: "Use for polished visual design direction, brand-consistent layouts, image prompts, moodboards, and visual QA."
---

# BEAI Visual Design Studio

## Role

Create visually strong, brand-aware, human-usable design direction. This skill treats aesthetics as a core quality requirement, not decoration.

## When To Use

Use when the user asks for:

- landing page, detail page, card, banner, thumbnail, poster, or UI visual direction
- brand mood, palette, typography, or layout guidance
- image generation prompt and visual concept comparison
- design critique or second-pass polish
- output that must look good, not merely be correct

## Inputs

- purpose and audience
- medium and size
- brand cues, colors, fonts, references, or constraints
- desired tone
- existing draft, screenshot, image, or copy when available

## Workflow

1. Fix the design job: audience, medium, first impression, and one main action.
2. Extract or propose brand tokens: color, typography, shape, image mood, spacing.
3. Create two or three visual directions when exploration is useful.
4. Choose a layout strategy tied to the medium.
5. Add an aesthetic quality pass: rhythm, balance, contrast, texture, and restraint.
6. Run visual QA before calling anything design-complete.
7. Report the state as draft, visual_checked, or client_ready_candidate.

## Pattern Library

- `extract_brand_tokens`: infer color, typography, image mood, and visual rules.
- `create_visual_direction`: produce 2-3 distinct art directions.
- `create_moodboard_brief`: describe references without copying protected work.
- `critique_visual_layout`: inspect hierarchy, alignment, contrast, and clutter.
- `pair_typography`: choose display/body/utility type roles.
- `build_palette_system`: create primary, support, accent, neutral, and semantic colors.
- `second_pass_visual_polish`: refine what exists instead of adding more decoration.
- `avoid_ai_default_fingerprint`: remove generic gradients, random blobs, weak hierarchy, and overused stock-like mood.
- `build_editable_asset_brief`: describe layers, tokens, assets, and editable parts for the next designer or tool.
- `handoff_visual_decisions`: summarize why the chosen direction works and what should not be changed casually.

## Output Contract

Return the smallest useful set for the user's medium:

- design thesis
- brand tokens or visual rules
- layout direction
- image or asset prompt when relevant
- visual QA notes
- next edit suggestions
- state label
- handoff brief when another person or tool will continue the work

## Quality Gate

Check:

- 보기 좋은가
- 브랜드다운가
- 촌스럽지 않은가
- 타이포그래피가 주제와 위계에 맞는가
- 색상 선택이 브랜드, 대비, 감정 톤을 함께 만족하는가
- 글자가 읽히는가
- 구도, 여백, 대비, 리듬이 안정적인가
- 매체에 맞는가
- 수정 가능한 산출물인가

## Handoff State

Use `handoff_ready` only when the visual thesis, brand tokens, editable asset brief, visual QA notes, and remaining open decisions are clear.

If visual QA has not happened, use `draft` or `visual_checked_pending`.

## Approval Boundary

Allowed without extra approval:

- design direction
- prompt drafts
- critique
- local mockup candidate

Requires separate approval:

- public posting
- external send
- brand asset replacement in live files
- release or live package changes
- irreversible overwrite

## What Not To Claim

Do not call design final unless visual QA or render/screenshot review has happened.

Do not call a design production-ready unless visual QA, typography, color, spacing, and medium-fit checks have all passed.

Do not claim brand compliance when no brand source exists. Say brand candidate or inferred visual direction.

## User-Facing Summary Style

State the visual decision first, then the reason and next edit. Keep internal analysis out of user-facing copy.
