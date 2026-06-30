# BEAI Knowledge Loop CLI v0.1

Status: local dry-run prototype, not packaged
Created: 2026-06-30

## 목적

`tools/beai-knowledge-loop.mjs`는 BEAI Knowledge Loop의 첫 로컬 CLI prototype입니다.

이 도구는 source record JSON을 읽어 review-first dry-run 산출물을 만듭니다.

하지 않는 것:

- durable memory write
- cron/hook/agent 등록
- 외부 플랫폼 연결
- 외부 메시지 발송
- release zip 생성
- live OpenClaw 설정 변경

## 사용 예시

```bash
node tools/beai-knowledge-loop.mjs distill \
  --source examples/knowledge-loop-source-record-case3a.json \
  --output docs/03-verification/generated/knowledge-loop-case3a.json
```

외부 신호 fixture:

```bash
node tools/beai-knowledge-loop.mjs distill \
  --source examples/knowledge-loop-source-record-external-signal.json \
  --output docs/03-verification/generated/knowledge-loop-external-signal.json
```

Markdown 출력:

```bash
node tools/beai-knowledge-loop.mjs distill \
  --source examples/knowledge-loop-source-record-case3a.json \
  --format md \
  --stdout
```

Retrieval index 생성:

```bash
node tools/beai-knowledge-loop.mjs index \
  --input-dir docs/03-verification/generated \
  --output docs/03-verification/generated/knowledge-loop-retrieval-index.json
```

Companion brief 생성:

```bash
node tools/beai-knowledge-loop.mjs brief \
  --source docs/03-verification/generated/knowledge-loop-case3a.json \
  --output docs/03-verification/generated/knowledge-loop-case3a-companion-brief.json
```

Markdown companion brief:

```bash
node tools/beai-knowledge-loop.mjs brief \
  --source docs/03-verification/generated/knowledge-loop-external-signal.json \
  --format md \
  --stdout
```

## 현재 입력 형식

입력은 JSON source record입니다.

중요 필드:

- `id`
- `title`
- `project`
- `created_at`
- `source_type`
- `source_reference`
- `summary`
- `user_language_aliases`
- `query_examples`
- `korean_terms`
- `observed_facts`
- `user_decisions`
- `assistant_judgments`
- `inferred_patterns`
- `traps`
- `external_signals`
- `knowledge_candidates`
- `knowledge_assets`
- `execution_assets`
- `product_candidates`
- `development_candidates`
- `evidence`
- `next_actions`

## 출력 원칙

출력은 다음을 항상 포함합니다.

- source record
- first-pass note
- time index entry
- output classes
- scored candidates
- review status
- safety flags
- next safe action

`brief` 출력은 사용자가 바로 볼 수 있도록 다음을 포함합니다.

- reality signals
- key decisions
- definition changes
- risks and traps
- evidence
- knowledge candidates
- review needed
- next action candidates
- not yet scope
- user-language retrieval
- next action
- boundaries

`index` 출력은 source record 산출물과 generated helper 파일을 분리합니다.

- `record_count`: 검색 대상 source record 산출물 수
- `skipped_count`: 손상되었거나 알 수 없는 JSON 수
- `non_record_count`: companion brief, retrieval index 같은 보조 JSON 수

모든 안전 플래그는 v0.1에서 false입니다.

```text
memory_write_allowed: false
cron_or_hook_allowed: false
external_send_allowed: false
release_packaging_allowed: false
```

## 다음 단계

이 CLI는 아직 AI 증류기가 아닙니다.

먼저 구조와 경계를 검증하고, 이후 안정되면 다음을 검토합니다.

1. source record fixture 확대
2. Markdown note 저장 규칙 추가
3. retrieval index 생성
4. companion brief 출력 검증
5. pending skill proposal 적용 검토
6. package candidate 통합
