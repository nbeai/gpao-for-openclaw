# Release Hygiene

Use this before any internal or public package is created or shared.

## Release Truth

Always distinguish:

- Source version.
- Live runtime version.
- Packaged artifact version.
- Latest clean shareable package.
- Experimental local candidate.

Never call a live experiment a team distribution package.

## Required Package Checks

- Package name and version match docs and manifest.
- Root README or install guide states exact status.
- Rollback/disable guide exists for live plugins.
- Known issues are documented.
- No unrelated development docs unless intended.
- No source/tests if package is dist-only.
- No `node_modules`, `.git`, `.DS_Store`, cache, logs, state, credentials, tokens, env files.
- Zip integrity passes.
- Internal package/manifest versions match.
- Dist files syntax-check if runnable.

## Release Labels

Use precise labels:

- `local experiment`
- `live observer candidate`
- `internal team candidate`
- `clean internal team candidate`
- `public release candidate`
- `do not distribute`

## Version Discipline

When changing a version:

- Update package metadata.
- Update plugin/manifest metadata.
- Update current-facing docs.
- Update release notes.
- Update install messages.
- Leave historical release notes unchanged unless clearly marked as amended history.

## Distribution Creation Rule

Create installer/package/zip only when the user explicitly asks for it.

If asked to prepare "right before packaging", do not create the package.

## Final Release Report

Include:

```text
Artifact:
Version:
SHA-256:
File count:
Included:
Excluded:
Verified:
Unverified:
Known issues:
Rollback:
Share label:
```
