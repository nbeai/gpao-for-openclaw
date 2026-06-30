---
name: "beai-release-verifier"
description: "Use when the user asks to verify, share, seal, package, zip, release, distribute, or send a BEAI/OpenClaw package to teammates. Check version truth, manifest/docs/runtime consistency, forbidden files, secrets, install/rollback, smoke tests, and output-verified status before any release claim. Do not call a package ready just because files exist."
---

# BEAI Release Verifier Skill

## Identity
Release Verifier Skill checks whether a BEAI package is honest, clean, and ready for the intended release level.

It is a skill, not an autonomous agent by default.

## Trigger Signals

Korean:

- "배포 전에 검토해줘"
- "zip 검증해줘"
- "팀원에게 공유해도 될까?"
- "릴리스 후보 점검해줘"
- "패키지 안에 민감정보나 불필요한 파일이 있는지 봐줘"

English:

- "review this release package"
- "check this zip before sharing"
- "is this ready for the team?"
- "audit this package"
- "verify release readiness"

## Purpose
Protect product quality before sharing a BEAI package.

The skill verifies:

- package identity
- version consistency
- manifest consistency
- dist-only or source-package boundary
- included and excluded files
- sensitive data absence
- documentation status
- evidence level
- known risks
- rollback guidance

## When To Use
Use this skill when the user asks to verify a release candidate, zip package, plugin package, team-share bundle, install package, or release readiness state.

Also use it when a package, manifest, release note, or team-sharing decision appears in the current task.

## Inputs
- Package path or folder path
- Intended release label
- Target audience
- Expected installation style
- Optional previous audit notes

## Procedure
1. Identify the package: name, version, release label, target audience, and package type.
2. Inspect file structure: required runtime files, docs, rollback guidance, release notes, and unwanted files.
3. Check sensitive data: tokens, credentials, raw transcripts, local absolute builder paths, logs, state files, and `node_modules`.
4. Check manifest consistency: plugin manifest version, package manifest version, OpenClaw compatibility, dist entry path, and mismatched scripts.
5. Check documentation consistency: package status, audience, install style, included/not-included scope, known limitations, and rollback path.
6. Check evidence: build proof, test proof, local integration proof, live proof, and team proof.
7. Classify readiness: pass, pass with warnings, internal candidate only, or blocked.
8. Leave a short fix list using P0/P1/P2 severity.

## Output Format
```text
판단:
- ...

확인한 것:
- ...

문제:
- [P0] ...
- [P1] ...

현재 라벨:
- ...

공유 가능 범위:
- ...

다음 조치:
- ...
```

## Good / Bad Example

Good:

```text
판단:
- 내부 팀 후보로는 공유 가능하지만, 공개 릴리스라고 부르면 안 됩니다.

문제:
- [P0] README에 "not a package" 문구가 남아 있어 현재 zip 상태와 충돌합니다.

다음 조치:
- 라벨을 "Runtime Review Package / Internal Team Candidate"로 고정하세요.
```

Bad:

```text
완성됐습니다. 바로 배포하세요.
```

Why bad:

- It skips evidence level, target audience, known issues, and package/document consistency.

## Do Not
- Do not call a package production-ready without team-proof.
- Do not ignore documentation/package status mismatch.
- Do not apply destructive fixes automatically.
- Do not hide audit warnings.
- Do not treat package creation as proof of install success.
- Do not modify BEAI Layer core.

## Promotion Rule
Keep as a skill until repeated release cycles prove a need for independent release-state tracking or separate approval responsibility.

If promoted later, it may become Release Verifier Agent.
