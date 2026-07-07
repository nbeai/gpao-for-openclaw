# GPAO for OpenClaw - Start Here

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

Use this file first when you receive the GPAO for OpenClaw ZIP.

GPAO means Growth Personal AI Operating System. GPAO for OpenClaw is the OpenClaw distribution surface of that system: a runtime, context, knowledge, verification, and upgrade-loop package that helps OpenClaw operate as a growth-oriented personal AI OS.

This package has two install surfaces:

- `plugin/beai-runtime/`: the OpenClaw runtime plugin component inside GPAO for OpenClaw.
- `capability-pack/`: skills, tools, docs, Knowledge Loop, Context Mesh-facing documents, and verification gates for GPAO operating quality.

## Manual ZIP Path

```bash
unzip gpao-for-openclaw-v0.1.1-runtime-v0.6.22-*.zip
cd gpao-for-openclaw
openclaw plugins install --link "$PWD/plugin/beai-runtime"
openclaw plugins enable beai-runtime
openclaw plugins doctor
openclaw hooks check
```

## Clean Install For Existing BEAI Package Users

If this OpenClaw home already has BEAI Package-era files, run the GPAO clean installer instead of manually overwriting files:

```bash
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw"
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw" --apply
```

The dry-run shows what will be backed up. The apply run moves old BEAI traces into `backups/gpao-migration-<timestamp>/`, installs GPAO for OpenClaw, and writes an install receipt.

## Verify The Full GPAO Package

```bash
npm run verify
```

`npm run verify` prepares runtime dependencies and then runs the full package
verification gate. To inspect the runtime component manually, use:

```bash
cd plugin/beai-runtime
npm install
npm run build
npm test
npm audit --omit=dev
```

The full gate also writes GPAO control-plane evidence for the OpenClaw package:

- proof ladder
- felt replay
- adapter matrix

These reports keep local package readiness separate from live OpenClaw
replacement, Gateway restart, Telegram messageId proof, and public release.

## What This Package Does Not Do Automatically

- edit OpenClaw core files
- restart Gateway
- send Telegram messages
- create cron jobs
- promote agents or skills
- approve durable memory
- publish to ClawHub or GitHub Releases

## Status

Current distribution status: `production-ready local release package`.

This is not a ClawHub/public release claim, live OpenClaw replacement claim, or
stable one-command public installer claim. Those remain separate gates until
clean OpenClaw environment install, rollback, ClawHub validation, and Telegram
visible progress evidence are verified.
