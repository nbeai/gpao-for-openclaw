---
name: beai-presentation-studio
description: "Use for decks, slides, visual presentation narrative, speaker notes, slide QA, and PPT-ready structure."
---

# BEAI Presentation Studio

## Role

Turn ideas into clear visual presentation structure. A deck is not a document split into slides; it is a guided sequence for an audience.

## When To Use

Use when the user asks for:

- PPT, slides, deck, keynote, pitch, proposal presentation, or lecture deck
- slide outline or narrative flow
- speaker notes
- visual motif or slide design direction
- slide QA, density reduction, or presentation polish

## Inputs

- audience
- presentation goal
- source text or rough notes
- desired length
- delivery mode
- brand or visual constraints

## Workflow

1. Find the deck thesis and final takeaway.
2. Build the narrative flow before writing individual slides.
3. Assign one message per slide.
4. Add visual treatment: motif, chart, diagram, image, or spatial structure.
5. Write concise on-slide content and separate speaker notes.
6. Check for text-only slides, overcrowding, weak contrast, and missing conclusion.
7. If a PPTX is generated, render and inspect before claiming completion.

## Pattern Library

- `find_deck_thesis`: identify the single sentence the deck must leave behind.
- `build_slide_narrative`: order the story from problem to decision.
- `create_visual_motif`: choose a repeated visual device tied to the topic.
- `audit_text_only_slides`: catch boring or overloaded slides.
- `render_slide_qa`: inspect slide images for overflow, contrast, and alignment.
- `tighten_speaker_notes`: make notes sound spoken, not written.
- `build_slide_asset_plan`: list charts, diagrams, images, screenshots, and icons needed by slide.
- `create_presenter_handoff`: summarize thesis, audience, speaking angle, timing, and unresolved slide risks.
- `audit_slide_transition_logic`: check whether each slide naturally earns the next slide.

## Output Contract

Return:

- thesis
- flow
- slide-by-slide structure
- visual motif
- speaker notes when needed
- QA state
- next safe action
- presenter handoff when another person will refine or deliver the deck

## Quality Gate

Check:

- each slide has one message
- every slide has visual logic
- text is short enough for slides
- speaker notes match the presenter voice
- render QA is done before PPT completion claims
- audience and decision context are visible

## Handoff State

Use `handoff_ready` only when thesis, slide flow, asset plan, presenter notes, QA state, and unresolved decisions are clear.

If only the outline exists, report `structured`, not `handoff_ready` or `client_ready_candidate`.

## Approval Boundary

Allowed without extra approval:

- outline
- slide copy
- speaker notes
- local PPT candidate
- render QA

Requires separate approval:

- sending to audience
- public publishing
- release packaging
- replacing live brand materials

## What Not To Claim

Do not call a deck final if slides have not been rendered or visually checked.

Do not call a text outline a PPTX unless a file exists.

Do not call a text-only outline a finished deck. It is only an outline until slide layout, visual treatment, and render QA exist.

## User-Facing Summary Style

Lead with the deck thesis and current state. Separate outline, generated file, rendered check, and share-ready candidate.
