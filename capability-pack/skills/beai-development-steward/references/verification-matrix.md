# Verification Matrix

Use this to choose evidence by change type.

## Common Checks

| Change type | Minimum verification |
| --- | --- |
| Documentation only | Link/path check, version wording check |
| TypeScript/JavaScript | `npm test`, `npm run build`, `node --check` for dist when relevant |
| Python | unit tests or targeted script run, syntax check |
| UI/frontend | build, local server, browser screenshot/interaction check |
| Plugin/runtime hook | build, tests, plugin doctor/list/inspect, hook readiness |
| Messaging channel | status/deep status, live inbound/outbound roundtrip |
| Installer/package | clean file list, version match, integrity test, secret scan |
| Cron/automation | dry run/manual run, stop path, failure reporting |
| Memory/session | candidate vs durable memory check, continuity test |

## Evidence Language

Use:

- `verified`: directly checked and passed.
- `partially_verified`: core checks passed, live/user scenario not fully checked.
- `unverified`: not checked.
- `blocked`: cannot verify because of missing access, tool failure, or user approval.

Avoid:

- "완료" when only files changed.
- "정상" when only config exists.
- "적용됨" when only proposal exists.
- "기억됨" when only candidate was written.

## Regression Verification

For every bug fix:

1. State original failure.
2. State prevention mechanism.
3. Test the exact failure path if possible.
4. Add a test if the behavior is deterministic.
5. Mark live proof separately from unit proof.

## User-Facing Verification

For user experience fixes, include at least one realistic scenario:

- What user does.
- What AI/system should show.
- What should not happen.
- How failure is reported.

## Performance Verification

If the change touches runtime hot paths:

- Confirm no unbounded scans.
- Confirm no heavy LLM call in hot path.
- Confirm bounded append or small classification only.
- Use benchmark only when needed; otherwise describe limits honestly.
