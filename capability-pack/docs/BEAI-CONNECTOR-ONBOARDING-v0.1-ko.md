# BEAI Connector Onboarding v0.1

## Position

Connector Onboarding is the safe entry path for tools that are not already registered in OpenClaw or BEAI.

The rule is:

```text
Do not connect first. Classify first.
```

## First Classification

Before connecting a new tool, BEAI should check:

- Is this already available as an OpenClaw tool, plugin, MCP server, or skill?
- Is the task one-time or repeated?
- Is read-only enough?
- Does it need write, delete, send, publish, payment, or config permission?
- Does it contain customer, health, tax, payment, credential, or private data?
- Is manual export/upload safer?
- Is a small read-only test possible?
- Is rollback possible?

## Connection Outcomes

- `already_available`
- `plugin_install_candidate`
- `mcp_candidate`
- `new_plugin_needed`
- `manual_upload_recommended`
- `read_only_test_first`
- `blocked_or_not_recommended`
- `needs_user_approval`

## BEAI Doctor Role

BEAI Doctor should expose Connector Onboarding findings in plain language:

- what the tool can touch
- why it is risky or safe
- which permission is needed
- whether a read-only test exists
- whether automatic connection is too early

## Protected Boundary

Connector Onboarding does not install, approve, or connect a tool by itself.

It creates a diagnosis and recommended next safe action.

