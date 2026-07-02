# BEAI ClawHub Influence Operating Plan

Status: pre-launch operating guide
Owner: BEAI / Jongyoon Park (@aigis0927)
Scope: ClawHub account positioning, BEAI Package launch narrative, OpenClaw user feedback loop

## 1. Operating Goal

BEAI Package should not be positioned first as a paid product.

The first goal is influence:

```text
Make OpenClaw users recognize Jongyoon Park / BEAI as the builder
who is pushing AI work quality, memory, reliability, and delivery trust
forward inside the OpenClaw ecosystem.
```

Downloads, feedback, followers, collaboration, sponsorship, consulting, or paid extensions can come later. The first win is category recognition.

## 2. Position To Own

Do not present BEAI as "one more plugin."

Present it as:

```text
The trust operating layer for serious OpenClaw work.
```

Shorter variants:

- AI work memory and reliability for OpenClaw
- Review-first Knowledge Loop for OpenClaw agents
- Runtime judgment and Telegram delivery trust for OpenClaw
- A practical trust layer for AI agents that actually do work

## 3. What Should Make Users Care

OpenClaw users should feel that BEAI solves pain they already know:

- They keep re-explaining context to AI.
- Good decisions disappear after a long session.
- Agents sometimes claim completion before delivery is proven.
- Telegram replies can be generated but not visibly delivered.
- Automation is powerful, but it is hard to know what is safe to automate.
- Memory is useful, but automatic memory approval is dangerous.
- Long-running work needs progress, evidence, and recovery boundaries.

BEAI Package should speak to these pains in user language before naming internal architecture.

## 4. Hero Components

### Knowledge Loop

Primary message:

```text
AI does not approve its own memory. It captures useful work traces for review.
```

Product sentence:

```text
Knowledge Loop helps OpenClaw agents search, draft, index, and review work knowledge without silently promoting it into durable memory.
```

Memorable rule:

```text
Auto-capture, not auto-approve.
```

### BEAI 5 Flow

Primary message:

```text
BEAI treats "understanding the user" as a runtime quality problem, not just a prompt-writing problem.
```

Explain it as:

- keep the current request intact
- avoid answer inertia from old turns
- separate confirmed facts from assumptions
- keep memory influence visible
- keep approval and delivery boundaries clear

### Telegram / Gateway Reliability

Primary message:

```text
Generated is not delivered. Telegram completion needs visible delivery evidence.
```

Explain it as:

- messageId matters
- internal final text is not Telegram delivery
- long-running Telegram work needs progress status
- restart or transport uncertainty must be reported as uncertainty

### Doctor / Regression / Release Gate

Primary message:

```text
BEAI does not just add behavior. It checks whether the behavior is safe to claim.
```

Explain it as:

- package doctor checks readiness
- flow regression checks conversation quality risks
- release wording stays separate from stable-production claims
- readiness language uses ready, partial, unverified, blocked, needs approval, hold, unsafe

## 5. ClawHub Card Direction

Card title:

```text
BEAI Runtime
```

Short description:

```text
Runtime judgment, Knowledge Loop memory capture, and Telegram delivery trust for serious OpenClaw work.
```

Alternative short description:

```text
Make OpenClaw agents better at context, memory candidates, approval boundaries, and visible delivery.
```

Suggested tags:

- ai-memory
- agent-reliability
- telegram
- knowledge-loop
- workflow-trust
- openclaw-runtime
- review-first

First paragraph:

```text
BEAI Runtime is an OpenClaw plugin that helps agents keep the current request intact, separate evidence from assumptions, capture review-first knowledge candidates, and avoid claiming Telegram delivery before a real messageId is observed.
```

Second paragraph:

```text
It is built for users who want AI agents to do real work without losing context, over-claiming completion, silently approving memory, or hiding delivery uncertainty.
```

## 6. Launch Messaging Sequence

### Before ClawHub publish unlock

Use the account to build expectation around the category:

- "Why generated is not delivered in Telegram-based AI work"
- "Why AI memory should be review-first"
- "Why agent automation needs a promotion gate"
- "Why OpenClaw plugins should prove readiness before claiming completion"
- "What I learned building BEAI Runtime for OpenClaw"

### Launch day

Core message:

```text
BEAI Runtime is now on ClawHub: a trust operating layer for OpenClaw agents that need better current-turn judgment, review-first memory capture, and Telegram delivery evidence.
```

Primary call to action:

```text
Install it, try a long-running Telegram/OpenClaw workflow, and tell me where the agent felt more reliable or still felt unclear.
```

### After launch

Keep the loop alive:

- ask for failure cases
- ask for confusing memory moments
- ask for Telegram delivery edge cases
- publish short lessons from fixes
- turn feedback into named improvements

## 7. Feedback Prompts

Use these after publish:

- Where did BEAI make the agent feel more reliable?
- Did Knowledge Loop reduce repeated explanation?
- Did Telegram delivery evidence change your trust in completion reports?
- What still felt too cautious or too noisy?
- What OpenClaw workflow should BEAI support next?

## 8. Boundaries

Do not overclaim:

- Do not call this production-stable unless clean external validation proves it.
- Do not imply automatic memory approval.
- Do not imply Telegram failures are fully solved.
- Do not imply BEAI modifies OpenClaw core.
- Do not imply public posting, customer contact, money, legal, account changes, cron, or durable memory promotion can happen without approval.

Preferred wording:

```text
BEAI makes reliability visible and reviewable.
```

Avoid:

```text
BEAI fixes all agent reliability.
```

## 9. Account Operating Rhythm

The ClawHub account should be managed like a serious builder account:

- keep the package card sharp
- keep the value language concrete
- keep the strongest component visible, especially Knowledge Loop
- keep a running list of feedback prompts
- keep pre-launch momentum active even while publish is policy-blocked
- compress reports to the user instead of spamming every small action

Daily report should summarize:

- current ClawHub publish status
- wording or positioning improved
- new feedback angle prepared
- blocker or policy countdown
- next user-visible launch asset

## 10. Source Anchor

Use this attribution consistently:

```text
Created by BEAI.
Copyright (c) 2026 박종윤 / Jongyoon Park (@aigis0927).
GitHub: https://github.com/nbeai
```
