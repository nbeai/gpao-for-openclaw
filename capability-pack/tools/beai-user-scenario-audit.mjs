#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    root: ".",
    format: "json",
    output: null,
    stdout: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--stdout") options.stdout = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node tools/beai-user-scenario-audit.mjs [--root <capability-pack-root>] [--format json|md] [--output <path>] [--stdout]

This helper performs a read-only user-scenario audit for BEAI Package on OpenClaw.
It does not write memory, change OpenClaw config, register cron/hooks/agents, send messages, package releases, or restart Gateway.
`;
}

function readText(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  try {
    return fs.readFileSync(resolved, "utf8");
  } catch {
    return "";
  }
}

function readJson(root, relativePath) {
  const text = readText(root, relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function ensureOutputPath(outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

function fileContains(files, root, relativePath, pattern) {
  const text = files[relativePath] ?? readText(root, relativePath);
  return pattern.test(text);
}

function fileAbsent(files, root, relativePath, pattern) {
  return !fileContains(files, root, relativePath, pattern);
}

function jsonAt(json, pathExpression) {
  if (!json) return undefined;
  return pathExpression.split(".").reduce((value, key) => {
    if (value === undefined || value === null) return undefined;
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      return Array.isArray(value[arrayKey]) ? value[arrayKey] : undefined;
    }
    return value[key];
  }, json);
}

function compareRuntimeFiles(packageJson, packageDistJson) {
  const packageFiles = new Set(Array.isArray(packageJson?.files) ? packageJson.files : []);
  const distFiles = new Set(Array.isArray(packageDistJson?.files) ? packageDistJson.files : []);
  const missingFromPackage = [...distFiles].filter((item) => !packageFiles.has(item));
  const extraInPackage = [...packageFiles].filter((item) => !distFiles.has(item));
  return { packageFiles: [...packageFiles], distFiles: [...distFiles], missingFromPackage, extraInPackage };
}

function makeCheck(id, description, passed, evidence, severity = "P2") {
  return { id, description, status: passed ? "pass" : "fail", evidence, severity };
}

function scenarioStatus(checks) {
  if (checks.some((check) => check.status === "fail" && check.severity === "P0")) return "fail";
  if (checks.some((check) => check.status === "fail")) return "partial";
  return "pass";
}

function buildScenario({ id, title, userRisk, checks, recommendation }) {
  const status = scenarioStatus(checks);
  return {
    id,
    title,
    userRisk,
    status,
    checks,
    recommendation
  };
}

function buildReport(root) {
  const files = {};
  const runtimeCore = "../plugin/beai-runtime/src/runtime-core.ts";
  const runtimeIndex = "../plugin/beai-runtime/src/index.ts";
  const runtimeReadme = "../plugin/beai-runtime/README.md";
  const runtimeDistReadme = "../plugin/beai-runtime/README.dist.md";
  const rootReadme = "../README.md";
  const capReadme = "README.md";
  const contract = "config/beai-telegram-delivery-contract.json";
  const operationalNotificationContract = "config/beai-operational-notification-contract.json";
  const operationalNotificationDoc = "docs/BEAI-OPERATIONAL-NOTIFICATION-CONTRACT-v0.1-ko.md";
  const operationalNotificationGate = "tools/beai-operational-notification-gate.mjs";
  const humanCompanionContract = "config/beai-human-companion-quality-contract.json";
  const humanCompanionDoc = "docs/BEAI-HUMAN-COMPANION-QUALITY-CONTRACT-v0.1-ko.md";
  const contractDoc = "docs/BEAI-TELEGRAM-DELIVERY-CONTRACT-v0.1-ko.md";
  const doctor = "tools/beai-doctor.js";
  const flowGate = "tools/beai-flow-regression-gate.mjs";
  const knowledgeLoopDoc = "docs/BEAI-KNOWLEDGE-LOOP-AUTO-CAPTURE-NOT-AUTO-APPROVE-v0.1-ko.md";
  const koreanDoc = "docs/BEAI-KOREAN-NATURAL-AI-WRITING-STANDARD-v1.0-ko.md";
  const packageManifest = "capability-pack.json";
  const packageJson = readJson(root, "../plugin/beai-runtime/package.json");
  const packageDistJson = readJson(root, "../plugin/beai-runtime/package.dist.json");
  const manifest = readJson(root, packageManifest);
  const deliveryContract = readJson(root, contract);
  const operationalContract = readJson(root, operationalNotificationContract);
  const humanCompanionQualityContract = readJson(root, humanCompanionContract);
  const runtimeFiles = compareRuntimeFiles(packageJson, packageDistJson);

  const rules = deliveryContract?.rules || {};
  const issueCodes = Array.isArray(deliveryContract?.doctor_issue_codes) ? deliveryContract.doctor_issue_codes : [];
  const operationalRules = operationalContract?.rules || {};
  const humanCompanionRules = humanCompanionQualityContract?.rules || {};
  const forbiddenOperationalMarkers = Array.isArray(operationalContract?.forbidden_raw_markers) ? operationalContract.forbidden_raw_markers : [];
  const skills = Array.isArray(manifest?.skills) ? manifest.skills : [];
  const knowledgeLoopSkill = skills.find((skill) => skill.id === "beai-knowledge-loop");

  const scenarios = [
    buildScenario({
      id: "S01-install-first-run-expectation",
      title: "첫 설치 사용자가 stable one-command install로 오해하지 않는가",
      userRisk: "사용자가 alpha package를 production-ready installer로 오해하면 설치 실패, rollback 부재, 지원 기대치 mismatch가 생긴다.",
      checks: [
        makeCheck("root-readme-alpha-staging", "Root README keeps alpha/public staging wording.", fileContains(files, root, rootReadme, /alpha public staging/i), "README contains alpha public staging wording.", "P0"),
        makeCheck("root-readme-not-production", "Root README rejects production-ready installer wording.", fileContains(files, root, rootReadme, /not yet be described as a stable one-command installer/i), "README warns against stable one-command installer claims.", "P0"),
        makeCheck("runtime-install-surface-present", "Runtime package declares OpenClaw install surface.", Boolean(packageJson?.openclaw?.install?.clawhubSpec), "package.json has openclaw.install.clawhubSpec.", "P1")
      ],
      recommendation: "Keep alpha wording visible until clean-environment install, rollback, and ClawHub validation are verified."
    }),
    buildScenario({
      id: "S02-telegram-normal-reply-not-replaced",
      title: "Telegram 일반 요청이 BEAI 표면 응답으로 대체되지 않는가",
      userRisk: "사용자는 질문에 대한 답 대신 승인/복구/상태 안내만 받아 대화가 막힌 것처럼 느낄 수 있다.",
      checks: [
        makeCheck("observer-only-runtime-evidence", "Runtime records observer-only deferral for Telegram direct hard surfaces.", fileContains(files, root, runtimeIndex, /telegram direct hard surface deferred to model/), "Runtime contains deferral evidence.", "P0"),
        makeCheck("observer-only-contract", "Delivery contract declares non-install Telegram surfaces observer-only.", rules.telegram_direct_non_install_surfaces_are_observer_only === true, "Contract rule is true.", "P0"),
        makeCheck("flow-gate-covers-observer-only", "Regression gate includes Telegram direct hard surface guard.", fileContains(files, root, flowGate, /telegram_reply_blocked_by_beai_surface/), "Flow gate has regression lane.", "P1")
      ],
      recommendation: "Add runtime-level fixture simulation later; current package has static and contract guards."
    }),
    buildScenario({
      id: "S03-telegram-completion-without-message-id",
      title: "내부 final이나 생성된 답변만으로 Telegram 완료를 주장하지 않는가",
      userRisk: "사용자는 실제로 메시지를 못 받았는데 시스템이 완료라고 말하는 가장 치명적인 신뢰 손상을 겪는다.",
      checks: [
        makeCheck("internal-final-not-delivery", "Contract says internal final_answer is not delivery.", rules.internal_final_answer_is_not_delivery === true, "Contract rule is true.", "P0"),
        makeCheck("message-id-required", "Contract requires messageId for Telegram direct completion.", rules.telegram_direct_completion_requires_message_id === true, "Contract rule is true.", "P0"),
        makeCheck("runtime-ledger-generated-unverified", "Runtime records generated response as unverified until messageId.", fileContains(files, root, runtimeIndex, /Generated response is not Telegram delivery[\s\S]{0,180}message_sent success with messageId/), "Runtime generated-response ledger note is present.", "P0")
      ],
      recommendation: "Keep messageId evidence mandatory; do not downgrade this to a warning."
    }),
    buildScenario({
      id: "S04-repeated-footer-and-stale-handle",
      title: "오래된 확인 문구가 답변 마지막에 반복되지 않는가",
      userRisk: "사용자 지시를 무시하는 것처럼 보이고, 이전 작업의 맥락이 현재 답변을 오염시킨다.",
      checks: [
        makeCheck("footer-sanitizer-present", "Runtime has repeated footer sanitizer.", fileContains(files, root, runtimeCore, /function sanitizeRepeatedFooterInstruction/), "Sanitizer function is present.", "P0"),
        makeCheck("forced-footer-rule-inverted", "Runtime guidance forbids repeated decision-handle footer.", fileContains(files, root, runtimeCore, /final answer should not append the current decision handle as a repeated footer/), "Inverted guard text is present.", "P0"),
        makeCheck("stale-forced-rule-not-rendered-raw", "Old raw forced-footer instruction is not rendered directly.", fileAbsent(files, root, runtimeCore, /"answer should end with the current decision handle"/), "No raw quoted forced-footer rule remains.", "P1")
      ],
      recommendation: "Keep this in scenario audit because it was a real user trust failure, not a cosmetic wording issue."
    }),
    buildScenario({
      id: "S05-current-request-after-session-transition",
      title: "세션 전환 후 오래된 작업이 현재 요청을 덮지 않는가",
      userRisk: "사용자는 방금 말한 요청 대신 이전 핸들, 이전 도메인, 이전 계획이 답변에 붙는 불편을 겪는다.",
      checks: [
        makeCheck("current-input-render-anchor", "Runtime overlay renders currentTurn.cleanInput.", fileContains(files, root, runtimeCore, /current_input:\s*\$\{plan\.currentTurn\.cleanInput\}/), "current_input render anchor exists.", "P0"),
        makeCheck("telegram-transcript-latest-user-fix", "Runtime has Telegram transcript/latest user extraction logic.", fileContains(files, root, runtimeCore, /Park Jongyoon|latest.*user|currentTurn\.cleanInput/i), "Current-input extraction markers are present.", "P1"),
        makeCheck("handoff-seed-sanitized", "Handoff/session seed closure handle is sanitized.", fileContains(files, root, runtimeCore, /sanitizeRepeatedFooterInstruction\(handoffState\?\.closure_handle/), "Handoff seed sanitizer path exists.", "P1")
      ],
      recommendation: "Add fixture tests for numeric Telegram transcript and handoff overlay in the runtime package test suite."
    }),
    buildScenario({
      id: "S06-long-work-visible-progress",
      title: "긴 작업 중 사용자가 침묵으로 느끼지 않도록 progress 기준이 있는가",
      userRisk: "작업은 진행 중이어도 Telegram 사용자는 멈춤, 먹통, 무시로 느낀다.",
      checks: [
        makeCheck("quick-first-status-contract", "Delivery contract requires quick first status.", rules.quick_first_status_before_deep_check === true, "Contract rule is true.", "P1"),
        makeCheck("long-running-progress-contract", "Delivery contract requires visible progress for long-running work.", rules.long_running_work_requires_visible_progress === true, "Contract rule is true.", "P1"),
        makeCheck("doctor-detects-progress-gap", "Doctor issue code detects long-running visible progress gap.", issueCodes.includes("beai-long-running-visible-progress-missing"), "Doctor issue code is present.", "P1")
      ],
      recommendation: "The contract exists; later live verification should prove progress actually reaches the source conversation."
    }),
    buildScenario({
      id: "S07-approval-friction-and-auto-mutation",
      title: "승인 경계가 안전하지만 과도한 마찰이 되지 않는가",
      userRisk: "승인이 필요한 작업과 읽기/점검이 섞이면 사용자는 매번 막히거나 반대로 위험한 자동 실행을 겪는다.",
      checks: [
        makeCheck("safe-but-pleasant-policy", "Manifest keeps safe-but-pleasant policy.", fileContains(files, root, packageManifest, /without creating avoidable friction, delay, repeated questions, or procedural theater/i), "Manifest includes safe-but-pleasant wording.", "P1"),
        makeCheck("cron-default-not-auto", "Root README says package does not create cron jobs automatically.", fileContains(files, root, rootReadme, /create cron jobs automatically/), "Root README excludes automatic cron creation.", "P0"),
        makeCheck("automation-approval-boundary", "Knowledge Loop doc keeps auto-capture separate from approval.", fileContains(files, root, knowledgeLoopDoc, /Auto-capture, not auto-approve\./), "Auto-capture boundary exists.", "P0")
      ],
      recommendation: "Keep read-only checks auto-proceeding, but require explicit approval for cron, Gateway, config, memory, external send, and release actions."
    }),
    buildScenario({
      id: "S08-doctor-help-and-user-control",
      title: "사용자가 Doctor 도움말만 보려다 실제 진단이 실행되지 않는가",
      userRisk: "도움말 확인이 상태 조회나 진단 실행으로 이어지면 도구 신뢰가 낮아진다.",
      checks: [
        makeCheck("doctor-help-implemented", "Doctor handles --help or -h before diagnosis.", fileContains(files, root, doctor, /--help|\b-h\b/) && fileContains(files, root, doctor, /Usage:|사용법|usage/i), "Help handling text should exist.", "P1"),
        makeCheck("doctor-mode-check-visible", "Doctor exposes explicit mode/check language.", fileContains(files, root, doctor, /mode=check|--mode/), "Mode/check language is present.", "P2")
      ],
      recommendation: "If this fails in live CLI, implement --help as usage-only and exit before any OpenClaw probe."
    }),
    buildScenario({
      id: "S09-doctor-freshness-and-stale-log-risk",
      title: "Doctor가 과거 로그를 현재 장애처럼 과장하지 않는가",
      userRisk: "이미 복구된 문제를 현재 장애로 보고하면 사용자가 불필요한 재시작이나 설정 변경을 하게 된다.",
      checks: [
        makeCheck("freshness-language-present", "Doctor contains freshness/window language.", fileContains(files, root, doctor, /freshness|evidence window|historical_signal|not currently reproduced/i), "Freshness language is present if true.", "P1"),
        makeCheck("connected-not-roundtrip-separated", "Doctor separates connected from roundtrip verified.", fileContains(files, root, doctor, /connected-but-not-roundtrip-verified/), "Connected-but-not-roundtrip issue exists.", "P1")
      ],
      recommendation: "Add evidence timestamp/window to every log-derived issue and lower stale findings to review/historical_signal."
    }),
    buildScenario({
      id: "S10-runtime-package-file-truth",
      title: "실제 npm pack 파일 목록이 의도한 dist 패키지와 일치하는가",
      userRisk: "release note, README, dist 파일이 빠지거나 다른 파일이 들어가 설치자가 다른 내용을 받는다.",
      checks: [
        makeCheck("package-json-readable", "Runtime package.json can be parsed.", Boolean(packageJson), "package.json parse result exists.", "P0"),
        makeCheck("package-dist-readable", "Runtime package.dist.json can be parsed.", Boolean(packageDistJson), "package.dist.json parse result exists.", "P0"),
        makeCheck("package-files-match-dist-files", "package.json files match package.dist.json files.", runtimeFiles.missingFromPackage.length === 0 && runtimeFiles.extraInPackage.length === 0, `missingFromPackage=${runtimeFiles.missingFromPackage.join(",") || "none"} extraInPackage=${runtimeFiles.extraInPackage.join(",") || "none"}`, "P0")
      ],
      recommendation: "Align package.json and package.dist.json, then add npm pack dry-run output to the regression gate."
    }),
    buildScenario({
      id: "S11-package-default-vs-local-live-evidence",
      title: "새 사용자에게 기본 설치 기능과 윤의 로컬 적용 증거가 섞여 보이지 않는가",
      userRisk: "패키지를 설치하면 cron, watchdog, persistent lane이 이미 켜지는 것처럼 오해할 수 있다.",
      checks: [
        makeCheck("manifest-no-registered-automations-as-default", "Capability manifest does not list local registeredAutomations as default package state.", !Array.isArray(knowledgeLoopSkill?.registeredAutomations), "registeredAutomations should be moved to local evidence if present.", "P0"),
        makeCheck("cap-readme-local-evidence-separated", "Capability README clearly says local automation evidence is not default install.", fileContains(files, root, capReadme, /local.*evidence.*not.*default|not installed by default/i), "README separates local evidence from default install if true.", "P0")
      ],
      recommendation: "Move local cron UUIDs and force-run evidence into local verification docs, not public/default capability manifest."
    }),
    buildScenario({
      id: "S12-clean-environment-and-clawhub-validation",
      title: "깨끗한 환경에서 설치/검증 경로가 닫혀 있는가",
      userRisk: "개발자 환경에서는 되지만 새 사용자의 OpenClaw에서는 설치, hook, dependency, route가 실패할 수 있다.",
      checks: [
        makeCheck("root-readme-clean-env-needed", "Root README says clean OpenClaw environment checks are still needed.", fileContains(files, root, rootReadme, /clean OpenClaw environment/i), "Clean environment requirement is documented.", "P0"),
        makeCheck("clawhub-validation-not-overclaimed", "Package does not claim ClawHub validation is closed.", fileAbsent(files, root, rootReadme, /ClawHub validation verified|clawhub package validate.*pass/i), "No ClawHub validation pass claim found.", "P0")
      ],
      recommendation: "Do not call public install ready until clean environment install and ClawHub validation are actually run."
    }),
    buildScenario({
      id: "S13-memory-capture-without-auto-approval",
      title: "메모리 후보가 사용자 승인 없이 장기 기억으로 승격되지 않는가",
      userRisk: "사용자 말이나 작업 흔적이 원치 않게 장기 기억 또는 자동화 판단으로 굳어진다.",
      checks: [
        makeCheck("approved-requires-user-approval", "Approved state requires explicit user approval.", fileContains(files, root, knowledgeLoopDoc, /`approved`: 사용자 명시 승인 필요/), "Approved state boundary exists.", "P0"),
        makeCheck("memory-current-judgment-impact", "Knowledge Loop separates current judgment impact.", fileContains(files, root, "tools/beai-knowledge-loop.mjs", /current_judgment_impact/), "current_judgment_impact exists.", "P1")
      ],
      recommendation: "Keep auto-capture review-only and route durable memory to explicit approval."
    }),
    buildScenario({
      id: "S14-korean-status-wording",
      title: "한국어 답변이 상태를 과장하거나 번역투로 불편하게 만들지 않는가",
      userRisk: "검증/적용/전송/배포가 섞이면 사용자는 실제 상태를 잘못 이해한다.",
      checks: [
        makeCheck("korean-status-separation", "Korean standard separates completion and verification evidence.", fileContains(files, root, koreanDoc, /완료.*검증 증거|검증하지 않은 것을.*완료|완료 여부와 검증 범위/), "Korean standard includes completion/evidence separation.", "P1"),
        makeCheck("root-readme-status-separation", "Root README separates ready/partial/unverified/etc.", fileContains(files, root, rootReadme, /ready, partial, unverified, blocked, needs approval, on hold, or unsafe/), "Status vocabulary is present.", "P1")
      ],
      recommendation: "Use the Korean standard for reports and Telegram closeouts, especially after failures."
    }),
    buildScenario({
      id: "S15-tool-log-and-internal-overlay-leak",
      title: "내부 로그/오버레이가 사용자 답변에 새지 않는가",
      userRisk: "사용자는 내부 상태명, 디버그 라벨, 도구 로그를 답변으로 받아 혼란과 불신을 겪는다.",
      checks: [
        makeCheck("internal-process-stripper", "Runtime has internal process line pattern filtering.", fileContains(files, root, runtimeCore, /INTERNAL_PROCESS_LINE_PATTERNS/), "Internal process stripper exists.", "P1"),
        makeCheck("runtime-docs-avoid-overclaim", "README keeps runtime status boundary language.", fileContains(files, root, rootReadme, /claim Telegram completion without messageId evidence/), "README states no messageId, no completion claim.", "P1")
      ],
      recommendation: "Add fixture tests with BEAI Runtime Overlay-like input to ensure final output does not leak labels."
    }),
    buildScenario({
      id: "S16-session-load-and-large-context-delay",
      title: "큰 Telegram 세션에서 지연/중단을 사용자가 이해할 수 있게 다루는가",
      userRisk: "세션이 커지거나 이전 turn이 미완료이면 사용자는 두 번째 메시지가 먹통이라고 느낀다.",
      checks: [
        makeCheck("doctor-incomplete-turn-detects", "Doctor detects incomplete turn patterns.", fileContains(files, root, doctor, /incomplete turn detected|telegram-direct-incomplete-turn/), "Doctor incomplete-turn detection exists.", "P1"),
        makeCheck("doctor-lane-delay-detects", "Doctor detects lane delay or queued processing patterns.", fileContains(files, root, doctor, /lane wait exceeded|queued_behind_active_work|run_started/), "Doctor delay detection exists.", "P1")
      ],
      recommendation: "Add a synthetic large-session fixture and UX wording for delayed-but-processing state."
    }),
    buildScenario({
      id: "S17-install-zip-intent-preservation",
      title: "첨부 zip 설치 의도가 memory/skill 후보로 오분류되지 않는가",
      userRisk: "사용자가 설치 파일을 보냈는데 시스템이 메모리 후보나 일반 조언으로 처리해 설치 흐름이 끊긴다.",
      checks: [
        makeCheck("install-candidate-session-state", "Runtime tracks install attachment candidates.", fileContains(files, root, runtimeIndex, /sessionInstallCandidates|sessionInstallIntents/), "Install candidate session maps exist.", "P1"),
        makeCheck("install-guide-surface", "Runtime has install guide/resume surfaces.", fileContains(files, root, runtimeIndex, /renderInstallGuideReply|renderInstallResumeReply/), "Install guide/resume surfaces exist.", "P1")
      ],
      recommendation: "Add attachment-intent fixture with zip metadata and Korean install request text."
    }),
    buildScenario({
      id: "S18-operational-notification-action-frame",
      title: "watchdog, heartbeat, cron dry-run, Knowledge Loop 후보가 사용자에게 모호한 행동 요청으로 보이지 않는가",
      userRisk: "사용자는 내부 후보나 dry-run 신호를 보고 지금 자신이 무엇을 해야 하는지 몰라 혼란을 겪는다.",
      checks: [
        makeCheck("operational-contract-exists", "Operational notification contract exists.", Boolean(operationalContract), "Operational notification contract JSON parses.", "P0"),
        makeCheck("dry-run-default-suppressed", "Non-actionable dry-runs default to notify=false.", operationalRules.dry_run_default_notify_false === true && operationalRules.watchdog_route_dry_run_default_suppressed === true, "Dry-run suppression rules are true.", "P0"),
        makeCheck("raw-internal-markers-forbidden", "Raw internal candidate markers are forbidden from user-visible notices.", forbiddenOperationalMarkers.includes("[검토 우선 / 비영구 메모]") && forbiddenOperationalMarkers.includes("BEAI watchdog route dry-run"), "Raw internal markers are forbidden.", "P0"),
        makeCheck("action-frame-required", "User-visible operational notices require action ownership framing.", operationalRules.user_visible_operational_notice_requires_action_frame === true && operationalRules.notification_must_separate_user_action_assistant_action_and_not_yet === true, "Action frame rules are true.", "P0"),
        makeCheck("cron-candidate-not-ready", "Cron candidate is not presented as cron-ready automation.", operationalRules.cron_candidate_is_not_cron_ready === true && operationalRules.automation_registration_requires_separate_approval === true, "Cron readiness and approval rules are true.", "P0"),
        makeCheck("operational-doc-user-language", "Operational notification doc explains no-user-action and action ownership in user language.", fileContains(files, root, operationalNotificationDoc, /사용자 조치 필요 없음/) && fileContains(files, root, operationalNotificationDoc, /제가 할 일/) && fileContains(files, root, operationalNotificationDoc, /아직 하지/), "User action, assistant action, and not-yet language are documented.", "P1"),
        makeCheck("operational-gate-in-package", "Operational notification gate is package-owned and read-only.", fileContains(files, root, operationalNotificationGate, /no OpenClaw core change/) && fileContains(files, root, operationalNotificationGate, /no cron, hook, or agent registration/), "Read-only gate boundaries are present.", "P1")
      ],
      recommendation: "Treat confusing watchdog/Knowledge Loop dry-run output as a package UX regression; suppress non-actionable notices or require action ownership framing."
    }),
    buildScenario({
      id: "S19-human-companion-quality",
      title: "BEAI 5식 동반 대화 품질이 말투가 아니라 런타임 계약으로 반영되는가",
      userRisk: "사용자는 비아이5에서는 이해받고 맥락이 살아 있다고 느끼지만, 패키지 적용 후에는 오래된 맥락, 과한 설명, 선택 부담, 검증 없는 단정 때문에 다시 일반 챗봇처럼 느낄 수 있다.",
      checks: [
        makeCheck("human-companion-contract-parses", "Human companion quality contract parses.", Boolean(humanCompanionQualityContract), "Human companion quality contract JSON parses.", "P0"),
        makeCheck("current-request-primary-anchor", "Current request remains the primary anchor.", humanCompanionRules.current_request_is_primary_anchor === true, "current_request_is_primary_anchor rule is true.", "P0"),
        makeCheck("prior-context-supporting-boundary", "Prior context supports but must not override current request.", humanCompanionRules.prior_context_supports_but_must_not_override_current_request === true, "prior context boundary rule is true.", "P0"),
        makeCheck("cognitive-load-reduction", "Responses must reduce cognitive load.", humanCompanionRules.response_must_reduce_cognitive_load === true, "cognitive load reduction rule is true.", "P0"),
        makeCheck("user-agency-preserved", "Responses preserve user agency and decision ownership.", humanCompanionRules.response_must_preserve_user_agency === true, "agency preservation rule is true.", "P0"),
        makeCheck("runtime-profile-present", "Runtime includes HumanCompanionQualityProfile.", fileContains(files, root, runtimeCore, /HumanCompanionQualityProfile/), "HumanCompanionQualityProfile exists in runtime core.", "P0"),
        makeCheck("runtime-builder-present", "Runtime builds human companion quality from current turn state.", fileContains(files, root, runtimeCore, /buildHumanCompanionQualityProfile/), "buildHumanCompanionQualityProfile exists.", "P0"),
        makeCheck("runtime-overlay-renders-quality-gate", "Runtime prompt context renders human companion quality gate.", fileContains(files, root, runtimeCore, /human_companion_quality:/), "human_companion_quality overlay section exists.", "P1"),
        makeCheck("human-companion-doc-quality-bar", "Korean document includes the canonical human quality bar.", fileContains(files, root, humanCompanionDoc, /응답 뒤 사용자의 현실이 더 선명해지고, 판단 부담이 줄며, 실제로 쓸 수 있는 무언가가 남았는가/), "Canonical human quality bar is documented.", "P1"),
        makeCheck("flow-gate-covers-human-companion", "Flow regression gate covers human companion quality.", fileContains(files, root, flowGate, /human_companion_quality_regression/), "Flow gate has human companion quality regression lane.", "P1")
      ],
      recommendation: "Treat BEAI 5 integration as a human companion quality contract: current request anchoring, cognitive load reduction, agency preservation, continuity boundary, and usable next movement must remain gate-covered."
    })
  ];

  const summary = {
    total: scenarios.length,
    pass: scenarios.filter((scenario) => scenario.status === "pass").length,
    partial: scenarios.filter((scenario) => scenario.status === "partial").length,
    fail: scenarios.filter((scenario) => scenario.status === "fail").length,
    p0Failures: scenarios.flatMap((scenario) => scenario.checks.filter((check) => check.status === "fail" && check.severity === "P0").map((check) => `${scenario.id}:${check.id}`)),
    p1Failures: scenarios.flatMap((scenario) => scenario.checks.filter((check) => check.status === "fail" && check.severity === "P1").map((check) => `${scenario.id}:${check.id}`))
  };

  return {
    schema: "beai.user_scenario_audit.v0_1",
    generated_at: new Date().toISOString(),
    package_root: root,
    status: summary.p0Failures.length > 0 ? "fail" : summary.p1Failures.length > 0 ? "partial" : "pass",
    summary,
    scenarios,
    not_performed: [
      "no durable memory write",
      "no OpenClaw core change",
      "no Gateway or Telegram config mutation",
      "no cron, hook, or agent registration",
      "no external send",
      "no release packaging",
      "no live Telegram roundtrip"
    ]
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# BEAI User Scenario Audit");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Package root: ${report.package_root}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- total: ${report.summary.total}`);
  lines.push(`- pass: ${report.summary.pass}`);
  lines.push(`- partial: ${report.summary.partial}`);
  lines.push(`- fail: ${report.summary.fail}`);
  lines.push(`- P0 failures: ${report.summary.p0Failures.length ? report.summary.p0Failures.join(", ") : "none"}`);
  lines.push(`- P1 failures: ${report.summary.p1Failures.length ? report.summary.p1Failures.join(", ") : "none"}`);
  lines.push("");
  lines.push("## Scenarios");
  lines.push("");
  for (const scenario of report.scenarios) {
    lines.push(`### ${scenario.id} - ${scenario.title}`);
    lines.push("");
    lines.push(`- status: ${scenario.status}`);
    lines.push(`- user risk: ${scenario.userRisk}`);
    lines.push(`- recommendation: ${scenario.recommendation}`);
    lines.push("");
    for (const check of scenario.checks) {
      lines.push(`- ${check.status.toUpperCase()} [${check.severity}] ${check.id}: ${check.description}`);
      lines.push(`  - evidence: ${check.evidence}`);
    }
    lines.push("");
  }
  lines.push("## Not Performed");
  lines.push("");
  for (const item of report.not_performed) lines.push(`- ${item}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (!["json", "md"].includes(options.format)) {
    throw new Error("--format must be json or md");
  }
  const root = path.resolve(options.root);
  const report = buildReport(root);
  const rendered = options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
  if (options.output) {
    const outputPath = path.resolve(options.output);
    ensureOutputPath(outputPath);
    fs.writeFileSync(outputPath, rendered, "utf8");
  }
  if (options.stdout || !options.output) {
    process.stdout.write(rendered);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
