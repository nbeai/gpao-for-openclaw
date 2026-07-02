# BEAI Operational Notification Contract v0.1

## 목적

BEAI Package는 운영 감시, heartbeat, cron dry-run, watchdog, Knowledge Loop 후보를 다룰 때 사용자가 "내가 지금 뭘 해야 하지?"라고 느끼지 않게 해야 한다.

운영 신호는 내부 판단 재료일 수 있지만, 그 자체가 사용자 행동 요청은 아니다. 사용자에게 보낼 때는 행동 주체와 아직 하지 않을 일을 분리해야 한다.

## 핵심 원칙

- dry-run은 기본적으로 사용자 알림이 아니다.
- watchdog route dry-run은 실패나 사용자 조치가 없으면 `notify=false`로 닫는다.
- Knowledge Loop의 review-first 후보는 사용자 작업 지시가 아니다.
- `[검토 우선 / 비영구 메모]`, `watchdog route dry run`, `cron_candidate`, `not_cron_ready` 같은 내부 표지는 원문 그대로 사용자-visible 메시지로 보내지 않는다.
- 사용자에게 보여야 하는 운영 알림은 반드시 다음 중 하나를 포함한다.
  - 사용자 조치 필요 없음
  - 윤이 할 일
  - 제가 할 일
  - 아직 하지 말 일
- cron 후보는 cron 준비 완료가 아니다. 자동 실행 등록은 별도 승인과 stop path, 실패 보고, 반복 수동 실행 증거가 있어야 한다.

## 사용자-visible 알림 형식

운영 알림이 사용자에게 보여야 한다면 다음 세 덩어리를 짧게 분리한다.

```text
사용자 조치: ...
제가 할 일: ...
아직 하지 않을 것: ...
```

사용자가 할 일이 없으면 첫 줄에서 바로 말한다.

```text
사용자 조치 필요 없음입니다.
```

## 억제해야 하는 예

아래 문장은 내부 후보일 뿐이므로 그대로 보내면 안 된다.

```text
[검토 우선 / 비영구 메모] 짧은 Knowledge Loop 감시 결과입니다.
명확한 후보가 하나 있습니다...
```

```text
System: BEAI watchdog route dry-run
```

문제가 없고 사용자 조치가 없다면 알림을 보내지 않는다. 문제가 있거나 사용자에게 알려야 한다면 행동 프레임으로 바꿔 보낸다.

## 허용되는 예

```text
사용자 조치 필요 없음입니다.
제가 할 일은 다음 실행 전에 패키지 검증 기준을 다시 확인하는 것입니다.
아직 하지 않을 것은 Gateway 재시작, cron 등록, Telegram live send입니다.
```

```text
윤이 할 일은 live 검증 승인 여부를 정하는 것입니다.
제가 할 일은 승인 뒤 Gateway reload와 Telegram 왕복 증거를 확인하는 것입니다.
아직 하지 말 일은 release zip 생성과 public publish입니다.
```

## Doctor / 검증 기준

BEAI Doctor와 package verify는 다음을 실패로 봐야 한다.

- 내부 후보 표지가 사용자-visible 문장에 그대로 남아 있다.
- dry-run이 조치 필요 없음인데 사용자 알림으로 올라갔다.
- 운영 알림에 사용자 조치, assistant 조치, 보류/제외 경계가 없다.
- cron 후보를 cron 준비 완료나 자동화 완료처럼 말했다.

이 계약은 OpenClaw core, Gateway, Telegram 설정, cron 등록, agent 등록, public publish를 직접 바꾸지 않는다. 패키지의 사용자-facing 운영 알림 기준과 회귀 검증 기준을 고정한다.
