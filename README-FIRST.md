# BEAI Package for OpenClaw - Start Here

Use this file first when you receive the BEAI Package for OpenClaw ZIP.

This package has two install surfaces:

- `plugin/beai-runtime/`: the OpenClaw runtime plugin.
- `capability-pack/`: skills, tools, docs, and verification gates for BEAI operating quality.

If you only want the OpenClaw plugin, start with the runtime plugin path below. If you want to review the whole package, keep the full ZIP and follow the verification path.

## 1 Minute Path

When the ClawHub release is visible:

```bash
openclaw plugins install clawhub:@nbeai/beai-runtime
openclaw plugins enable beai-runtime
openclaw plugins doctor
openclaw hooks check
```

Expected result:

- `beai-runtime` is installed and enabled.
- `openclaw plugins doctor` has no BEAI Runtime load error.
- `openclaw hooks check` shows hook eligibility without blocking issues.

If the ClawHub package is not visible yet, use the manual ZIP path.

## Manual ZIP Path

Unzip the package and install the runtime plugin from the local folder:

```bash
unzip beai-package-for-openclaw-v0.2.0-runtime-v0.6.17-*.zip
cd beai-package-for-openclaw
openclaw plugins install --link "$PWD/plugin/beai-runtime"
openclaw plugins enable beai-runtime
openclaw plugins doctor
openclaw hooks check
```

`--link` is best for local review because the installed plugin points to the unpacked folder. For a copied install, omit `--link`.

## Required Hook Permission

BEAI Runtime needs conversation-access hook permission through the OpenClaw plugin entry:

```json
{
  "plugins": {
    "entries": {
      "beai-runtime": {
        "enabled": true,
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

This is an OpenClaw plugin entry setting. It is not a BEAI plugin configuration value.

After changing plugin config, restart the relevant OpenClaw/Gateway process through your normal operating procedure, then run:

```bash
openclaw plugins doctor
openclaw hooks check
```

## Verify The Full Package

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

For capability-pack checks:

```bash
cd capability-pack
node tools/beai-doctor-package-check.mjs
node tools/beai-flow-regression-gate.mjs --root . --format md --output docs/03-verification/generated/beai-flow-regression-gate.md --stdout
node tools/beai-user-scenario-audit.mjs --root . --format md --output docs/03-verification/generated/beai-user-scenario-audit.md --stdout
node tools/beai-organic-flow-audit.mjs --root . --format md --output docs/03-verification/generated/beai-organic-flow-audit.md --stdout
```

## Rollback

Disable first:

```bash
openclaw plugins disable beai-runtime
openclaw plugins doctor
openclaw hooks check
```

Then remove only if you intentionally want to uninstall it:

```bash
openclaw plugins uninstall beai-runtime
```

If you changed OpenClaw plugin config manually, restore that config from your own backup or version control.

## What This Package Does Not Do Automatically

The package does not automatically:

- edit OpenClaw core files
- restart Gateway
- send Telegram messages
- create cron jobs
- promote agents or skills
- approve durable memory
- publish to ClawHub or GitHub Releases

Those actions remain separate operating decisions.

## Status

Current distribution status: `public staging release candidate`.

This ZIP is intended for review, controlled installation, and verification. It is not a stable one-command production support promise until the ClawHub/public release path is completed and clean-environment verification evidence is attached.
