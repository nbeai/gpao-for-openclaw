# Approval Gates

Use this when an action may change user state, live systems, distribution artifacts, or trust boundaries.

## Always Ask First

- Delete, reset, revert, force overwrite, or mass edit.
- Install, uninstall, relink, or replace existing user tooling.
- Change auth, tokens, allowlists, account pairing, or channel config.
- Restart gateway, service, daemon, launch agent, or production-like runtime.
- Register cron, heartbeat, watcher, monitor, or background task.
- Send messages outside the current conversation surface.
- Write long-term memory or promote memory candidates.
- Apply skill/agent proposals live when the environment requires approval.
- Create zip, installer, package, release candidate, public artifact, or team-share bundle.
- Change version labels across package/docs/runtime.

## Good Approval Language

Use short, concrete questions:

```text
이 작업은 gateway 재시작을 포함합니다. 지금 재시작해도 될까요?
```

```text
이 단계는 배포 zip을 생성합니다. 사용자가 명시 지시한 배포 파일 생성으로 진행할까요?
```

```text
기존 설정 파일을 수정해야 합니다. 먼저 백업을 만들고 해당 항목만 바꾸겠습니다. 진행할까요?
```

## If User Already Approved

If the user has already clearly approved the exact action:

- Do not ask again.
- Still state what will be touched.
- Stay inside the approved boundary.

## If Action Is Ambiguous

Narrow it:

```text
"설치"가 core 수정까지 포함될 수 있어 위험합니다. 여기서는 플러그인 파일 복사와 설정 등록까지만 진행하겠습니다.
```

## Never Hide

Do not silently:

- Expand scope.
- Create distribution artifacts.
- Register automation.
- Modify core policy.
- Write memory as fact.
- Turn a candidate into live behavior.
