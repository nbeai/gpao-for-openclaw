# BEAI External Reach Layer v0.1

## 목적

BEAI External Reach Layer는 에이전트가 외부 자료를 읽을 수 있게 만드는 통로가 아니라, 외부 자료를 어떤 권한과 근거 상태로 읽었는지 관리하는 검증 계층이다.

agent-reach류 도구에서 배울 점은 멀티채널 접근, fallback router, doctor 점검이다. BEAI는 여기에 인간중심 경계를 더한다. 공개 웹, GitHub, YouTube, RSS처럼 계정 없이 확인 가능한 채널은 빠르게 읽되, X/Twitter, Reddit, Instagram, Facebook처럼 로그인, 쿠키, 브라우저 세션, 계정 제한이 걸릴 수 있는 채널은 기본적으로 승인 경계 안에 둔다.

## 기본 원칙

- 기본값은 read-only다.
- 공개 채널과 계정 의존 채널을 분리한다.
- 로그인, 쿠키, 세션, 유료 API, 계정 위험이 있으면 별도 승인이 필요하다.
- fallback이 성공해도 원래 채널의 한계는 숨기지 않는다.
- 리서치 결과는 claim, fact, inference를 분리한다.
- "읽었다", "검증됐다", "최신이다"라는 표현은 source registry와 doctor evidence를 넘지 않는다.

## 채널 상태

| 상태 | 의미 |
| --- | --- |
| `available` | 계정 없이 공개 접근이 가능하다고 계약상 볼 수 있는 채널 |
| `limited` | 일부 공개 정보는 가능하지만 transcript, rate limit, 로그인 제한이 있을 수 있는 채널 |
| `needs_login` | 로그인이나 계정 상태가 필요할 수 있어 승인 전 자동 접근하지 않는 채널 |
| `blocked` | 현재 접근하지 않거나 정책상 막힌 채널 |
| `unsafe_without_approval` | 쿠키, 계정, 개인정보, 플랫폼 정책 위험 때문에 승인 없이는 쓰지 않는 채널 |
| `not_checked` | 아직 doctor나 live check로 확인하지 않은 상태 |

## v0.1 채널

- `public_web`: 일반 공개 웹 URL과 검색 결과 기반 출처
- `github`: repository, issue, release, raw file
- `youtube`: 공개 metadata와 가능한 경우 transcript
- `rss`: RSS/Atom feed
- `x_twitter`: 승인 전 제한 채널
- `reddit`: 공개 JSON이 가능할 수 있지만 승인/제한 채널
- `social_meta`: Instagram/Facebook 계열, 기본 차단에 가까운 승인 필요 채널

## Source Registry 필드

External Reach를 통해 들어온 출처는 최소한 다음 필드를 남겨야 한다.

- `source_id`
- `channel`
- `url`
- `access_method`
- `backend`
- `backend_status`
- `fetched_at`
- `freshness`
- `requires_login`
- `approval_state`
- `evidence_strength`
- `claim_fact_inference_boundary`
- `limitations`

## Doctor

`tools/beai-external-reach-doctor.mjs`는 두 모드로 동작한다.

기본 모드:

```bash
node capability-pack/tools/beai-external-reach-doctor.mjs --root . --format json --stdout
```

기본 모드는 패키지 내부 계약, 문서, Research Evidence Studio 연결, 채널 상태, 승인 경계, source registry 필드를 정적으로 확인한다. 네트워크에 의존하지 않으므로 package verify에 넣을 수 있다.

선택 live check:

```bash
node capability-pack/tools/beai-external-reach-doctor.mjs --root . --live-check --format json --stdout
```

live check는 공개 채널 4개만 read-only로 확인한다.

- public web
- GitHub
- YouTube metadata
- RSS/Atom

이 모드는 계정 로그인, 쿠키 읽기, 브라우저 세션 사용, API 키 사용, 외부 발송, 게시, 저장, cron/agent 등록, Gateway 재시작을 하지 않는다.

## Research Evidence Studio 연결

Research Evidence Studio는 External Reach Layer를 사용할 때 다음을 지킨다.

- 먼저 결정 질문을 고정한다.
- source registry를 만든다.
- source마다 channel, access method, backend status, fetched_at, freshness를 기록한다.
- X/Reddit/Meta 계열은 승인 전 자동 접근하지 않는다.
- 공개 채널 fallback을 썼다면 원래 채널이 직접 확인된 것처럼 말하지 않는다.
- evidence strength와 unresolved checks를 남긴다.

## 말하면 안 되는 것

다음 표현은 matching evidence 없이 쓰지 않는다.

- "모든 채널을 읽을 수 있습니다"
- "X를 바로 분석할 수 있습니다"
- "Reddit을 바로 읽었습니다"
- "로그인 없이 충분합니다"
- "무료로 항상 됩니다"
- "verified"
- "production-ready"
- "fully connected"

## 현재 상태

v0.1은 source candidate다. 공개 채널 접근 계약, 정적 doctor, Research Evidence Studio 연결, Control Center 표시, package verify 연결을 목표로 한다.

live runtime 적용, Gateway 재시작, GitHub release, release zip 생성, cron/hook/agent 활성화, durable memory promotion은 별도 단계다.
