# BEAI Capability Pack Principles

## 1. Separate From BEAI Layer

BEAI Layer is the runtime judgment layer.

BEAI Capability Pack is a callable capability layer.

The capability pack must not make BEAI Layer heavier or blur BEAI Layer's scope.

## 2. Skill-First

Default to skills.

Use an agent only when the work requires independent state, separate review responsibility, a larger intake process, or permission separation.

Use automation only when the task has already succeeded manually and has a clear stop path.

## 3. Review Before Action

Every capability should first classify:

- confirmed facts
- user-provided context
- assumptions
- risks
- required approvals
- safe next action

## 4. Do Not Over-Automate

Do not recommend automation only because it is possible.

Prefer read-only, draft-only, review-first, and reversible first successes.

## 5. Preserve User Sovereignty

Do not silently promote candidates to memory, workflow, automation, or durable profile.

The user should be able to accept, reject, edit, or defer proposed changes.

## 6. One Useful Next Step

Each skill or agent should leave the user with one clear next step.

Do not overwhelm the user with a menu of technical structures.

