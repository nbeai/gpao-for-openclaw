# Development Lifecycle

Use this when the work has more than one file, phase, risk, or release decision.

## 1. Intake

Capture:

- User goal.
- Target user.
- Current pain/friction/anxiety.
- Desired experience.
- Product shape if the user is making an app/service.
- First useful workflow.
- Hard constraints.
- Known risks.
- Explicit non-goals.

Output:

```text
Goal:
User value:
Product shape:
First useful workflow:
This version includes:
This version excludes:
Risk boundary:
Evidence needed:
Release stance:
```

## 2. Context Study

Read the system before changing it:

- File tree and ownership boundaries.
- Existing tests.
- Existing config and package metadata.
- Extension points.
- Live/runtime state, if relevant.
- Prior docs only when they help and do not pollute the new scope.

If current facts are unstable, research with sources before deciding.

Search results should produce one of three outcomes:

- `decision`: strong enough to guide implementation.
- `risk`: must be guarded or tested.
- `open_question`: not enough evidence; do not build assumptions into code.

## 3. Design Decision

Choose the smallest suitable layer:

| Need | Prefer |
| --- | --- |
| Repeated user-invoked procedure | Skill |
| Cross-cutting runtime interpretation | Plugin/hook |
| Independent role/context | Agent |
| Repeated scheduled work | Cron/automation |
| Health, restart, diagnostics | External watchdog/facility |
| User education/shareable procedure | Documentation/package |

Do not use automation where a skill is enough. Do not use a core change where a plugin is enough.

For non-developer app/service work, choose the simplest product architecture that can prove the core workflow:

- Static site if there is no user input/state.
- Local web app if the user needs interaction but not deployment yet.
- Single-user data store before multi-user accounts.
- Mock/sample data before external API integration.
- Manual workflow before cron/agent automation.

## 4. Plan

Create a short plan with:

- Step names.
- Current status.
- Validation after each risky step.
- Approval gates.

Avoid plans that say only "implement feature" without validation.

For non-developers, include one visible milestone:

- "You will be able to open this URL and try the main workflow."
- "You will be able to upload/paste data and see the result."
- "You will be able to review a generated draft before anything is sent."

## 5. Implement

Rules:

- Edit narrowly.
- Preserve unrelated user changes.
- Keep runtime hot paths light.
- Add tests around behavior and failure mode.
- Prefer fail-soft over breaking the user's primary workflow.
- Record evidence if the project has an evidence trail.

For vibe-coding users, translate implementation choices into user consequences:

- "This changes the live app."
- "This only changes documentation."
- "This creates a candidate, not a live behavior."
- "This is reversible."
- "This needs a rollback path."

## 6. Verify

Use the verification matrix. At minimum:

- Syntax/build check.
- Relevant tests.
- Manual smoke test when user-facing.
- Regression check for the original failure.
- Docs/version check if package-facing.

Never translate "tool ran" into "user outcome achieved" without checking the outcome.

## 7. Package Or Release

Only if explicitly requested.

Check:

- Clean artifact contents.
- Version consistency.
- Install guide.
- Rollback path.
- Known issues.
- Secret scan.
- No state/log/cache/node_modules unless intentionally included.

## 8. Retrospective

Close with:

- What improved.
- What evidence supports it.
- What remains risky.
- What should be next.
