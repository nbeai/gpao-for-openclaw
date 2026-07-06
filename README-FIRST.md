# GPAO for OpenClaw - Start Here

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

Use this file first when you receive the GPAO for OpenClaw ZIP.

This package has two install surfaces:

- `plugin/beai-runtime/`: the OpenClaw runtime plugin component inside GPAO for OpenClaw.
- `capability-pack/`: skills, tools, docs, Knowledge Loop, Context Mesh-facing documents, and verification gates for GPAO operating quality.

## Manual ZIP Path

```bash
unzip gpao-for-openclaw-v0.1.0-runtime-v0.6.22-*.zip
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
cd plugin/beai-runtime
npm install
npm run build
npm test
npm audit --omit=dev
```

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
