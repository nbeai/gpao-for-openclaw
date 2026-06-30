# BEAI Agent Trust Ledger v0.1

## Position

BEAI Agent Trust Ledger is the operating record that lets BEAI Doctor answer:

```text
What actually ran, what was verified, and where should the system stop?
```

It is not a memory file. It is not a release note. It is an operations ledger.

## What It Records

- cron jobs
- recovery jobs
- persistent review lanes
- watchdog jobs
- external connector runs
- Telegram delivery checks
- bounded memory append checks
- package check helper runs
- protected actions that were blocked or intentionally not performed

## Status Vocabulary

- `registered`
- `enabled`
- `force_run_ok`
- `output_verified`
- `skipped_by_marker`
- `blocked_by_protected_boundary`
- `not_enabled`
- `unverified`

## Ledger Entry Shape

Each entry should include:

- id
- name
- kind
- schedule or trigger
- owner
- status
- trust_gate_state
- evidence
- protected_boundaries
- last_verified_at
- next_check

## Current Package Boundary

The seed ledger in this package is a local package artifact. It does not query live OpenClaw state by itself.

BEAI Doctor may read it and compare it with live state later.

