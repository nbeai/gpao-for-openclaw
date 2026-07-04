# Install BEAI Package for OpenClaw

This guide is for OpenClaw users installing or reviewing BEAI Package for OpenClaw.

## Choose Your Path

Use ClawHub when available:

```bash
openclaw plugins install clawhub:@nbeai/beai-runtime
openclaw plugins enable beai-runtime
```

Use the ZIP when you received a release candidate file:

```bash
unzip beai-package-for-openclaw-v0.2.6-runtime-v0.6.20-*.zip
cd beai-package-for-openclaw
openclaw plugins install --link "$PWD/plugin/beai-runtime"
openclaw plugins enable beai-runtime
```

Use source review when you want to inspect or test the package before installing:

```bash
npm run verify
cd plugin/beai-runtime
npm install
npm run build
npm test
```

## Post-Install Checks

Always run:

```bash
openclaw plugins doctor
openclaw hooks check
```

If Telegram delivery quality is being claimed, also verify a real Telegram roundtrip and confirm an actual `messageId`. Internal final text, generated reply text, and `reply_payload_sending` are not delivery proof.

## Expected Installed Plugin

```text
id: beai-runtime
name: BEAI Runtime
version: 0.6.20
package: @nbeai/beai-runtime
```

## Common Outcomes

Fresh OpenClaw:

- Install the runtime plugin.
- Enable it.
- Add conversation-access hook permission if needed.
- Run doctor and hooks checks.

Existing OpenClaw:

- Check current plugin state first with `openclaw plugins list`.
- Install or update BEAI Runtime.
- Re-run doctor and hooks checks.
- Do not change Gateway, cron, Telegram, or account settings unless that is the explicit operating task.

Previous BEAI Layer user:

- Confirm the installed runtime version is `0.6.20`.
- Confirm local state files are BEAI-owned under `state/beai/`.
- Treat memory candidates, workflow cards, and automation registry entries as separate states.

## Rollback

```bash
openclaw plugins disable beai-runtime
openclaw plugins doctor
openclaw hooks check
```

If you need full removal:

```bash
openclaw plugins uninstall beai-runtime
```

Review any manually changed OpenClaw config before deleting or replacing it.

## Support Boundary

This package improves runtime judgment, evidence boundaries, Knowledge Loop review-first capture, Telegram delivery trust, and package verification discipline.

It does not turn unverified output into a completed send, completed deployment, approved memory, active cron job, or public release claim.
