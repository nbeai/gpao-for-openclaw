# BEAI Capability Pack v0.2.0 Upgrade Guide

## 대상

이 문서는 BEAI Capability Pack v0.1.0 또는 v0.1.1을 이미 설치한 OpenClaw 사용자에게 v0.2.0을 적용하기 위한 안내입니다.

## 핵심 원칙

기존 설치자는 중복 설치하지 않습니다.

```text
기존 4개 능력: update
새 능력 1개: add
BEAI Layer core: touch 금지
gateway/cron/memory 설정: touch 금지
```

## 업데이트할 기존 능력

- `beai-release-verifier`
- `beai-session-handoff`
- `beai-memory-curator-review`
- `beai-starter-agent-alpha`

## 새로 추가할 능력

- `beai-development-steward`

이 스킬은 다음 파일 전체를 함께 포함해야 합니다.

```text
skills/beai-development-steward/SKILL.md
skills/beai-development-steward/references/*.md
skills/beai-development-steward/templates/*.md
skills/beai-development-steward/agents/openai.yaml
```

## OpenClaw에게 전달할 설치 문장

```text
첨부한 BEAI Capability Pack v0.2.0을 먼저 읽어줘.

이미 v0.1.1이 설치되어 있다면 기존 BEAI 스킬 4개는 중복 생성하지 말고 update하고,
새로 추가된 beai-development-steward만 add해줘.

BEAI Layer runtime core, OpenClaw gateway, cron/automation, 장기 기억 설정은 건드리지 마.

적용 전에는 포함 파일과 민감정보, 중복 skill 여부를 확인하고,
적용 후에는 어떤 skill이 ready가 되었는지와 건드리지 않은 항목을 보고해줘.
```

## 성공 기준

- 기존 4개 BEAI 능력이 여전히 ready
- `beai-development-steward`가 ready
- duplicate skill slug 없음
- BEAI Layer core 수정 없음
- gateway/cron/memory 설정 변경 없음
- 장기 기억 자동 저장 없음

## 실패 시

전체 OpenClaw를 삭제하지 않습니다.

문제가 생기면 BEAI Capability Pack 적용분만 되돌리거나, 실패한 신규 skill만 제거/재적용합니다.
