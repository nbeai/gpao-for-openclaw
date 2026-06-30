# Failure Patterns And Research Notes

Use this when deciding why approval, verification, or release hygiene is necessary.

## Common AI-Assisted Development Failures

- Silent scope expansion: the agent builds more than requested.
- Unverified completion: files changed but behavior not proven.
- Version drift: source, live runtime, docs, and package disagree.
- Release clutter: packages include logs, state, node_modules, tests, or secrets.
- Automation overreach: cron/agents run before manual workflow is proven.
- Memory pollution: temporary context becomes durable truth.
- Recovery loop: the same generic diagnosis repeats instead of escalating.
- Runtime path breakage: plugin/hook errors block the user's main channel.
- Security blind spots: generated code is trusted without review.
- Maintainability erosion: repeated AI changes pass tests while structure degrades.
- User disorientation: the agent works silently so long that the user thinks the system is stuck.
- False release confidence: "installed" or "ready" is said before live roundtrip or rollback is checked.

## Research-Backed Notes

- Vibe coding is powerful for rapid creation but risky when users accept generated code without review. Concerns include accountability, maintainability, and security vulnerabilities. Source: https://en.wikipedia.org/wiki/Vibe_coding
- Security commentary recommends treating AI-generated code as untrusted, enforcing governance, human accountability, review, and automated security testing. Source: https://www.itpro.com/technology/artificial-intelligence/vibe-coding-security-risks-how-to-mitigate
- Agentic code review research finds human oversight remains important for quality, contextual feedback, and maintainability; AI suggestions can increase complexity when adopted. Source: https://arxiv.org/abs/2603.15911
- Behavior-driven testing research for AI coding agents shows real-world failure patterns can be turned into executable tests; simple success checks miss many anomalies. Source: https://arxiv.org/abs/2604.03362
- AI coding agents can miss observability/logging requirements, and natural-language instructions alone may not reliably enforce them; deterministic guardrails can be needed. Source: https://arxiv.org/abs/2604.09409
- Repository-level agent instructions such as AGENTS.md have been associated with lower runtime and token usage while keeping comparable task completion behavior. Source: https://arxiv.org/abs/2601.20404

## Practical Takeaway

The steward should not slow development for ceremony. It should prevent the high-cost failures:

- Changing the wrong layer.
- Trusting unverified output.
- Losing version truth.
- Shipping clutter or secrets.
- Automating before the user can trust the workflow.

When in doubt, improve orientation first:

- Tell the user what is happening.
- Narrow the next diagnostic action.
- Record what was actually verified.
- Leave unverified claims out of the completion language.
