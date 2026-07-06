# Install GPAO for OpenClaw

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

This guide is for OpenClaw users installing or reviewing GPAO for OpenClaw.

## Choose Your Path

Use ClawHub when available for the runtime-only plugin surface:

```bash
openclaw plugins install clawhub:@nbeai/beai-runtime
openclaw plugins enable beai-runtime
```

Use the GPAO ZIP when you received the integrated package file:

```bash
unzip gpao-for-openclaw-v0.1.0-runtime-v0.6.22-*.zip
cd gpao-for-openclaw
openclaw plugins install --link "$PWD/plugin/beai-runtime"
openclaw plugins enable beai-runtime
```

## Clean Install From GPAO ZIP

For existing BEAI Package users, prefer the clean installer. It backs up known legacy BEAI package paths before installing GPAO for OpenClaw.

Dry-run first:

```bash
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw"
```

Apply:

```bash
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw" --apply
```

The installer moves legacy paths such as `plugins/beai-runtime`, `plugins/@nbeai/beai-runtime`, `.beai-package`, and `.beai-layer` into `backups/gpao-migration-<timestamp>/`, then installs the GPAO runtime component and capability pack. It writes `.gpao-for-openclaw/install-receipt.json`.

## Expected Installed Plugin

```text
id: beai-runtime
name: GPAO Runtime (BEAI Runtime Component)
version: 0.6.22
package: @nbeai/beai-runtime
product: GPAO for OpenClaw
```

## Support Boundary

GPAO for OpenClaw improves runtime judgment, evidence boundaries, Context Mesh continuity, Knowledge Loop review-first capture, Telegram delivery trust, and package verification discipline.

It does not turn unverified output into a completed send, completed deployment, approved memory, active cron job, or public release claim.
