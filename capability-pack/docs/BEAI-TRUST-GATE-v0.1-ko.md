# BEAI Trust Gate v0.1

## Position

BEAI Trust Gate is the status language and decision boundary used by BEAI Runtime Layer, BEAI Doctor, and package verification.

It answers one question:

```text
Can the user trust this result and move to the next step?
```

## Core States

- `ready`: execution and verification are both closed
- `partial`: some required parts are complete, but at least one required part remains
- `unverified`: something ran or exists, but output evidence is not enough yet
- `blocked`: the work cannot continue because of environment, permission, missing data, or protected boundary
- `needs_approval`: continuing would touch external send, deletion, config, cron, hooks, Gateway, public release, or durable memory
- `hold`: not enough clarity or safety to execute now
- `unsafe`: the proposed action should not be executed in the current form

## User Language

BEAI-facing status should be translated before user reporting:

- `ready` -> 완료됨
- `partial` -> 일부만 완료됨
- `unverified` -> 아직 확인 전
- `blocked` -> 막혀 있음
- `needs_approval` -> 사람 확인 필요
- `hold` -> 지금은 보류가 맞음
- `unsafe` -> 자동 실행하면 위험함

## Required Evidence

Each Trust Gate decision should include:

- source or trigger
- involved skill/tool/program
- operation class
- required evidence
- observed evidence
- status
- next safe action
- not performed

## Operation Classes

- `answer_only`
- `read_only_check`
- `local_report`
- `memory_candidate`
- `bounded_memory_write`
- `external_fetch`
- `external_send`
- `file_write`
- `config_change`
- `cron_change`
- `hook_change`
- `gateway_restart`
- `release_packaging`
- `public_release`

## Package Rule

Trust Gate is not a separate large application in v0.1.

For v0.1 it is:

- a status schema
- a config file
- a Doctor-readable report convention
- a package verification criterion

Later it can become a runtime module or plugin hook.

