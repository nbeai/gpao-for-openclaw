# BEAI Control Center v0.1

## 목적

BEAI Control Center v0.1은 BEAI Package의 모든 구성요소를 한 번에 조망하는 보기 전용 관제판이다.

이 버전은 실행 버튼을 만들지 않는다. 목적은 자동 제어가 아니라, 현재 무엇이 소스 후보이고, 무엇이 live에 적용됐고, 무엇이 zip으로 묶였고, 무엇이 검증 증거를 가진 상태인지 분리해서 보여주는 것이다.

## 첫 버전 범위

- capability pack manifest 상태
- runtime source version
- live runtime version
- 최신 release archive와 sha256 존재 여부
- workflow, promotion, automation, memory, agent trust ledger 상태
- package verify, doctor package check, flow regression, user scenario audit, organic flow audit, package truth check 산출물
- 승인 경계와 다음 안전 행동

## 하지 않는 것

- release zip 생성
- GitHub release 또는 public publish
- live runtime 재설치
- Gateway 재시작
- Telegram, email, Slack 등 외부 발송
- cron, hook, agent 등록 또는 변경
- durable memory promotion
- OpenClaw core 변경

## 상태 언어

Control Center는 상태를 섞지 않는다.

- `source candidate`: 로컬 소스에 반영된 후보
- `verified`: 로컬 검증 산출물이 있는 상태
- `zip candidate`: 배포 archive가 존재하는 상태
- `live applied`: live runtime과 source version이 맞는 상태
- `active automation`: automation registry에 실제 등록된 상태
- `candidate`: workflow card 또는 promotion gate에 남아 있는 검토 대상

## UX 원칙

Control Center는 사용자를 더 자주 멈추게 하는 장치가 아니다.

기본값은 빠르게 상태를 보여주는 것이다. 단, live 적용, release zip, public publish, cron/agent activation, durable memory promotion, external send처럼 책임이 넘어가는 순간에는 승인 경계를 선명하게 보여준다.

## 실행

```bash
node capability-pack/tools/beai-control-center.mjs --root . --format md --stdout
```

JSON이 필요하면 다음처럼 실행한다.

```bash
node capability-pack/tools/beai-control-center.mjs --root . --format json --stdout
```

이 명령은 기본적으로 stdout에만 보고한다. `--output`을 지정한 경우에만 파일을 쓴다.
