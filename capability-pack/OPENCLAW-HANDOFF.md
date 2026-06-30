# OpenClaw Handoff Brief

Use this brief when asking OpenClaw to create or register these BEAI capabilities.

## Goal

Create a separate BEAI capability package, not a BEAI Layer core change.

The initial capabilities are:

1. Release Verifier Skill
2. Session Handoff Skill
3. Memory Curator Review Skill
4. BEAI Starter Agent alpha
5. Capability routing rules

## Boundary

- Do not modify OpenClaw core.
- Do not modify BEAI Layer runtime core for this step.
- Do not create cron/automation yet.
- Do not write durable memory automatically.
- Do not create agents for the first three capabilities unless repeated use proves they need agent status.

## Recommended Implementation Order

1. Register three skills as callable procedures.
2. Register BEAI Starter as an alpha agent or agent candidate.
3. Add tests or dry-run prompts for each capability.
4. Keep all outputs user-facing, concise, and evidence-aware.

## Files To Read First

- `README.md`
- `PRINCIPLES.md`
- `skills/release-verifier-skill.md`
- `skills/session-handoff-skill.md`
- `skills/memory-curator-review-skill.md`
- `agents/beai-starter-agent-alpha.md`
- `routing.md`
