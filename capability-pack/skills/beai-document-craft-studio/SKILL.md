---
name: beai-document-craft-studio
description: "Use for proposals, reports, manuals, meeting notes, decision docs, document structure, and reader testing."
---

# BEAI Document Craft Studio

## Role

Make documents usable for real readers. The skill turns context into structured documents with clear purpose, evidence, reader fit, and submission boundaries.

## When To Use

Use when the user asks for:

- proposal, report, manual, meeting notes, plan, policy, PRD, RFC, or decision doc
- document structure or rewrite
- reader-oriented review
- internal draft vs submission candidate separation
- PDF/DOCX-ready structure

## Inputs

- document type
- audience
- desired impact
- source notes or context dump
- required format or template
- deadline or constraints

## Workflow

1. Identify document purpose, audience, and desired reader action.
2. Capture context without forcing the user to organize everything first.
3. Build a reader profile and structure.
4. Draft section by section.
5. Separate conclusion, evidence, assumptions, and open questions.
6. Run a reader test from fresh context.
7. Mark the result as draft, structured, reader_checked, or client_ready_candidate.

## Pattern Library

- `capture_context_dump`: absorb messy source context.
- `build_reader_profile`: define reader, need, prior knowledge, and decision.
- `create_document_scaffold`: create sections before prose.
- `draft_section_with_options`: offer candidate points for each section.
- `run_reader_test`: check whether a fresh reader can understand and act.
- `format_submission_version`: distinguish internal draft from submission candidate.
- `create_review_packet`: collect summary, decisions needed, risks, and comments for reviewer handoff.
- `track_open_questions`: keep unanswered assumptions separate from draft content.
- `handoff_document_decisions`: explain structure choices and what should be reviewed first.

## Output Contract

Return:

- document purpose
- reader profile
- structure
- drafted or revised sections
- evidence/open-question boundary
- reader test result
- state label
- review packet or handoff brief when someone else will revise or approve

## Quality Gate

Check:

- reader and purpose are clear
- conclusion and evidence are separated
- structure matches the document type
- tables, summaries, and appendices are used only when useful
- submission-ready language is not claimed before format/render checks

## Handoff State

Use `handoff_ready` only when the reader profile, document structure, open questions, review packet, and approval boundary are visible.

If the document has not passed reader test, report `structured` or `reader_checked_pending`.

## Approval Boundary

Allowed without extra approval:

- draft
- structure
- local document candidate
- reader test

Requires separate approval:

- external send
- public posting
- contract/legal/tax filing use
- overwriting official document sources

## What Not To Claim

Do not call a document submitted, approved, legally safe, or final without the relevant evidence and user approval.

## User-Facing Summary Style

Start with the document's current state and reader impact. Keep edit instructions concrete.
