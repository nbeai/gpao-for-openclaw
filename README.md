# GPAO for OpenClaw

> Product identity: GPAO for OpenClaw.
>
> This file is part of GPAO for OpenClaw. BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence are internal components of the GPAO for OpenClaw operating package.

Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.

GPAO for OpenClaw is the integrated personal AI operating package for OpenClaw. It packages BEAI Runtime, BEAI Capability Pack, Context Mesh, Knowledge Loop, verification tools, and release evidence as one GPAO operating layer.

If you received the ZIP and want to install or review it, start here:

- `README-FIRST.md`: fastest user path, manual ZIP path, verification, rollback, and status boundary
- `INSTALL.md`: install-focused command reference
- `GPAO-FOR-OPENCLAW-PACKAGE-MANIFEST.md`: package identity, component map, copyright, and authority boundary
- `installer/install-gpao-for-openclaw.mjs`: clean install path that backs up legacy BEAI package traces before installing GPAO
- `NOTICE.md`: copyright and redistribution boundary
- `plugin/beai-runtime/README.dist.md`: runtime-only package notes

If OpenClaw is the workspace where AI agents can use tools, skills, memory, plugins, hooks, and cron jobs, GPAO for OpenClaw adds the growth, judgment, context, verification, and upgrade boundaries around that workspace.

The legacy phrase "BEAI Package for OpenClaw" refers to the technical substrate that has now been integrated into GPAO for OpenClaw. BEAI Runtime and BEAI Capability Pack remain component names inside the GPAO package; they are not separate product identities in this distribution.

GPAO for OpenClaw is built as a personal AI operating package, not a loose tool bundle. It combines runtime judgment, context continuity, Knowledge Loop review, skill and OS-upgrade candidate flow, clean installation, rollback evidence, and package verification into one operating boundary.

## Package Shape

```text
OpenClaw Runtime
-> GPAO for OpenClaw Product Boundary
-> BEAI Runtime Component
-> Context Mesh Evidence / Retrieval Layer
-> Knowledge Loop Review / Learning Layer
-> BEAI Capability Programs
-> Skill Upgrade / GPAO Self-Upgrade Candidate Layer
-> BEAI Verification / Release Layer
-> BEAI Runtime Operations Layer
```

## Repository Contents

```text
plugin/beai-runtime/
  OpenClaw plugin source for the BEAI Runtime component inside GPAO for OpenClaw.

capability-pack/
  Skills, tools, routing rules, configs, examples, and package docs for GPAO for OpenClaw.
```

## Safety Position

GPAO for OpenClaw is designed to observe, classify, verify, and propose before it mutates high-risk state.

By default, it should not:

- edit OpenClaw core files
- restart Gateway automatically
- create cron jobs automatically
- promote agent registrations automatically
- write durable memory automatically
- send external messages automatically
- claim Telegram completion without messageId evidence
- surface watchdog, heartbeat, cron dry-run, or Knowledge Loop review-candidate signals as raw user tasks

## Clean Install

For users who previously installed BEAI Package-era files, use the clean installer from the unzipped package root:

```bash
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw"
node installer/install-gpao-for-openclaw.mjs --openclaw-home "$HOME/.openclaw" --apply
```

The first command is a dry-run. The second command moves known legacy BEAI paths into a timestamped backup and installs the GPAO runtime component and capability pack. It does not restart Gateway, send Telegram messages, create cron jobs, promote durable memory, or edit OpenClaw core files.

## Runtime Plugin

The runtime plugin lives in `plugin/beai-runtime`.

Its current component version is `0.6.22`.

ClawHub package name: `@nbeai/beai-runtime`.

The ClawHub package is the BEAI Runtime plugin install surface. The GPAO for OpenClaw ZIP is the integrated operating package distribution.

## Verification

From the unzipped repository root:

```bash
npm run verify
```

For runtime source checks:

```bash
cd plugin/beai-runtime
npm install
npm run build
npm test
npm audit --omit=dev
```

## Status

Current status: `production-ready local release package`.

This package is suitable for public source review and controlled installation when its verification report, archive checksum, and install receipt are present. Real external publication, Gateway restart, Telegram roundtrip, cron activation, or durable memory promotion remain separate authority events with their own evidence.
