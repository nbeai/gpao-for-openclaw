# BEAI ClawHub Prelaunch Content Backlog

Status: pre-launch content backlog
Owner: BEAI / Jongyoon Park (@aigis0927)
Scope: ClawHub account operation before `@nbeai/beai-runtime` becomes publicly publishable

## Purpose

Use the policy-blocked pre-launch window to build recognition before the package is downloadable.

The account should repeatedly connect BEAI with four ideas:

- review-first AI memory
- OpenClaw agent reliability
- Telegram delivery evidence
- runtime judgment for real work

## Content Rules

- Lead with user pain, then show BEAI's answer.
- Do not overclaim stable production readiness.
- Do not ask for money before recognition.
- Do not present BEAI as a generic productivity plugin.
- Always point back to serious OpenClaw work.

## Core One-Liners

```text
Generated is not delivered.
```

```text
AI memory should be review-first.
```

```text
Auto-capture, not auto-approve.
```

```text
OpenClaw agents need trust boundaries, not just more tools.
```

```text
Good AI work should leave a reviewable trail.
```

```text
An agent should know when it is ready, partial, unverified, blocked, or waiting for approval.
```

## Prelaunch Posts

### 1. Generated Is Not Delivered

```text
One thing I learned building BEAI Runtime for OpenClaw:

Generated is not delivered.

If an agent writes the final answer but Telegram never receives a messageId, the work is not visibly complete. BEAI keeps generated text, send candidates, and verified delivery as separate states.
```

### 2. AI Memory Should Not Approve Itself

```text
I do not want AI memory that silently decides what becomes permanent.

BEAI Knowledge Loop follows a stricter rule:

Auto-capture, not auto-approve.

Agents can capture useful work traces. Users should approve what becomes durable memory.
```

### 3. Why BEAI Is Not Just A Plugin

```text
BEAI Runtime is not trying to add one more command to OpenClaw.

It is trying to make agent work easier to trust:

- current request preserved
- evidence separated from assumptions
- memory candidates kept reviewable
- Telegram delivery verified before completion claims
```

### 4. The Real Problem Is Trust

```text
The hard part of agentic AI is not only tool access.

It is knowing:

- what the agent actually did
- what it only inferred
- what still needs verification
- what requires approval
- what the user actually received

That is the layer BEAI is building for OpenClaw.
```

### 5. Long Conversations Need Anti-Inertia

```text
Long AI conversations create answer inertia.

The agent starts answering the previous shape of the conversation instead of the current request.

BEAI Runtime treats current-turn preservation as a runtime quality issue, not a prompt style issue.
```

### 6. Safer Does Not Mean Slower

```text
Agent safety should not feel like procedural drag.

BEAI's goal is not to ask for approval every few seconds.

The goal is to separate low-risk review-only capture from high-risk actions like public posting, account changes, durable memory approval, and release claims.
```

### 7. Knowledge Loop Is Work Memory

```text
Knowledge Loop is not model training.

It is work memory:

search, capture, index, review, and retrieve the important traces of what happened while the agent worked.

That distinction matters.
```

### 8. Telegram Is A Trust Surface

```text
For many users, Telegram is the real interface to OpenClaw.

So delivery reliability is not a side feature.

If Telegram drops the final answer, the user experience is broken even if the local agent "finished."
```

### 9. Readiness Words Matter

```text
I do not want agents to say "done" when the real state is "configured", "partial", or "unverified."

BEAI uses readiness language like:

ready / partial / unverified / blocked / needs approval / hold / unsafe
```

### 10. The Package Is A Workbench

```text
BEAI Package is still alpha public staging.

That is intentional.

I would rather expose a reviewable workbench with clear boundaries than pretend an early agent reliability layer is production magic.
```

### 11. What I Want From OpenClaw Users

```text
When BEAI Runtime is available on ClawHub, I want edge cases.

Tell me where the agent:

- lost context
- over-claimed completion
- became too cautious
- captured a useful memory candidate
- made Telegram delivery clearer
```

### 12. Why This Is Worth Building

```text
AI agents are getting more capable.

That makes trust boundaries more important, not less.

BEAI is my attempt to make serious OpenClaw workflows more inspectable, recoverable, and comfortable to delegate.
```

## Launch-Day Short Posts

### Launch A

```text
BEAI Runtime is now on ClawHub.

It adds runtime judgment, review-first Knowledge Loop memory capture, and Telegram delivery trust for serious OpenClaw work.

Try it with a long-running workflow and tell me where the agent felt more reliable or still felt unclear.
```

### Launch B

```text
New on ClawHub: BEAI Runtime for OpenClaw.

The core rule:

Auto-capture, not auto-approve.

Agents can capture useful work traces. Users decide what becomes durable memory.
```

### Launch C

```text
BEAI Runtime separates generated answers from verified Telegram delivery.

If there is no messageId, the agent should not pretend the user saw the answer.

Generated is not delivered.
```

## Feedback Replies

Use these when someone reacts or tries the package:

```text
Thank you. The most useful feedback is the moment where the agent felt more trustworthy, or the exact point where it still felt unclear.
```

```text
If you can share one edge case, I am especially interested in memory capture, Telegram delivery, or completion-claim wording.
```

```text
That is exactly the class of case BEAI should learn from: not more automation first, but clearer trust boundaries first.
```

## Daily Operating Checklist

Before publish unlock:

- sharpen one card phrase
- prepare one short post or feedback prompt
- check whether the publish blocker changed
- keep Knowledge Loop as the strongest public hook
- keep Telegram delivery trust as the most concrete reliability story

After publish:

- check install visibility
- check card wording in the live surface
- watch downloads, reactions, and feedback
- answer feedback with edge-case requests
- turn repeated feedback into package issues or docs

## Do Not Say

Avoid:

```text
BEAI fixes all OpenClaw reliability.
```

Avoid:

```text
BEAI automatically remembers everything.
```

Avoid:

```text
BEAI makes Telegram failures impossible.
```

Use instead:

```text
BEAI makes agent work more reviewable, evidence-aware, and easier to trust.
```
