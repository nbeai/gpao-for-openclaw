#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFile } = require("node:child_process");

const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.slice("--mode=".length) : "check";
const symptomArg = process.argv.find((arg) => arg.startsWith("--symptom="));
const symptom = symptomArg ? symptomArg.slice("--symptom=".length) : "";
const logFileArg = process.argv.find((arg) => arg.startsWith("--log-file="));
const logFile = logFileArg ? logFileArg.slice("--log-file=".length) : "";
const json = args.has("--json");
const deep = args.has("--deep");
const includeOpenClawDoctor = args.has("--include-openclaw-doctor");
const selfHeal = args.has("--self-heal");
const cooldownArg = process.argv.find((arg) => arg.startsWith("--cooldown-ms="));
const cooldownMs = cooldownArg ? Number(cooldownArg.slice("--cooldown-ms=".length)) : 20 * 60 * 1000;
const cwd = process.cwd();
const startedAt = Date.now();

function exists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    execFile(resolveCommand(command), commandArgs, {
      cwd,
      encoding: "utf8",
      timeout: options.timeout || 20000,
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          ok: false,
          output: `${stdout || ""}${stderr || ""}`.trim(),
          message: error.message
        });
        return;
      }
      resolve({ ok: true, output: String(stdout || "").trim() });
    });
  });
}

function resolveCommand(command) {
  if (command !== "openclaw") return command;
  const candidates = [
    process.env.OPENCLAW_CLI,
    path.join(os.homedir(), ".local", "bin", "openclaw"),
    "/opt/homebrew/bin/openclaw",
    "/usr/local/bin/openclaw",
    "/usr/bin/openclaw"
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (exists(candidate)) return candidate;
  }
  return command;
}

function findBeaiLayerRoot(start) {
  const candidates = [
    start,
    path.join(start, "beai-layer"),
    path.join(start, "..", "beai-layer")
  ];
  for (const candidate of candidates) {
    if (exists(path.join(candidate, "plugin", "beai-runtime")) && exists(path.join(candidate, "installer"))) {
      return path.resolve(candidate);
    }
  }
  return null;
}

function helperStatus(root) {
  if (!root) return [];
  return [
    "installer/preflight.js",
    "installer/repair-plan.js",
    "installer/auto-repair.js",
    "installer/verify-installed.js",
    "installer/smoke-test.js"
  ].map((rel) => {
    const file = path.join(root, rel);
    return {
      file: rel,
      exists: exists(file),
      executable: exists(file) ? Boolean(fs.statSync(file).mode & 0o111) : false
    };
  });
}

function skipped(name) {
  return { ok: true, output: "", skipped: true, name };
}

function readTextFileSafe(file) {
  if (!file) return "";
  try {
    return fs.readFileSync(file, "utf8").slice(0, 120000);
  } catch {
    return "";
  }
}

function readRecentLiveEvidenceSafe() {
  const candidates = [
    process.env.BEAI_LIVE_EVIDENCE_FILE,
    path.join(cwd, "state", "beai", "live-evidence.jsonl"),
    path.join(os.homedir(), ".openclaw", "workspace", "state", "beai", "live-evidence.jsonl")
  ].filter(Boolean);
  for (const file of candidates) {
    try {
      if (!exists(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      return text.split(/\r?\n/).filter(Boolean).slice(-200).join("\n");
    } catch {
      // Try the next likely workspace.
    }
  }
  return "";
}

function parseRelativeAgeMs(label, text) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}:\\s*(just now|never|unknown|n/a|([0-9]+)([smhd]) ago)`, "i");
  const match = String(text || "").match(pattern);
  if (!match) return null;
  if (/just now/i.test(match[1])) return 0;
  if (/never|unknown|n\/a/i.test(match[1])) return Number.POSITIVE_INFINITY;
  const value = Number(match[2]);
  const unit = String(match[3] || "").toLowerCase();
  if (!Number.isFinite(value)) return null;
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return null;
}

function classifyChannelProbe(output) {
  const text = String(output || "");
  const hasTelegram = /Telegram/i.test(text);
  const running = /running/i.test(text);
  const connected = /connected/i.test(text);
  const works = /\bworks\b/i.test(text);
  const disconnected = /disconnected|not\s+running|failed|error/i.test(text);
  const transportAgeMs = parseRelativeAgeMs("transport", text);
  const inboundAgeMs = parseRelativeAgeMs("in", text);
  const outboundAgeMs = parseRelativeAgeMs("out", text);
  const staleThresholdMs = 30 * 60 * 1000;
  const stale =
    disconnected ||
    transportAgeMs === Number.POSITIVE_INFINITY ||
    (typeof transportAgeMs === "number" && transportAgeMs > staleThresholdMs) ||
    (
      !works &&
      typeof inboundAgeMs === "number" &&
      typeof outboundAgeMs === "number" &&
      inboundAgeMs > staleThresholdMs &&
      outboundAgeMs > staleThresholdMs
    );
  return {
    hasTelegram,
    running,
    connected,
    works,
    disconnected,
    transportAgeMs,
    inboundAgeMs,
    outboundAgeMs,
    stale,
    healthy: hasTelegram && running && connected && works && !stale
  };
}

function isOpenClawCliPermissionLimited(text) {
  return /attempt to write a readonly database|ERR_SQLITE_ERROR|EPERM: operation not permitted/i.test(String(text || ""));
}

function isOpenClawCliUnavailable(text) {
  return /spawn openclaw ENOENT|openclaw ENOENT|command not found/i.test(String(text || ""));
}

function wakeGuardStatePath() {
  return process.env.BEAI_DOCTOR_WAKE_GUARD_STATE ||
    path.join(os.homedir(), ".openclaw", "reports", "beai-doctor", "wake-guard-state.json");
}

function readWakeGuardState() {
  const file = wakeGuardStatePath();
  try {
    if (!exists(file)) return { file };
    return { file, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    return { file, readError: error.message };
  }
}

function writeWakeGuardState(state) {
  const file = wakeGuardStatePath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ ...state, file: undefined }, null, 2)}\n`);
    return { ok: true, file };
  } catch (error) {
    return { ok: false, file, error: error.message };
  }
}

function shouldObserveCooldown(state, now, cooldown) {
  if (!state || !state.lastRestartAt) return false;
  const last = Date.parse(state.lastRestartAt);
  if (!Number.isFinite(last)) return false;
  return now - last < cooldown;
}

async function runWakeGuard() {
  const now = Date.now();
  const before = await run("openclaw", ["channels", "status", "--channel", "telegram", "--probe"], { timeout: 30000 });
  const beforeProbe = classifyChannelProbe(before.output);
  const state = readWakeGuardState();
  const cooldownActive = shouldObserveCooldown(state, now, cooldownMs);
  const report = {
    tool: "beai-doctor",
    mode: "wake-guard",
    selfHeal,
    cooldownMs,
    generatedAt: new Date(now).toISOString(),
    status: "not_started",
    gatewayTouched: false,
    gatewayRestarted: false,
    telegramSettingsChanged: false,
    before: {
      ok: before.ok,
      probe: beforeProbe,
      output: stripSecretish(before.output || before.message)
    },
    cooldown: {
      active: cooldownActive,
      stateFile: state.file,
      lastRestartAt: state.lastRestartAt || null
    },
    action: null,
    after: null
  };

  if (before.ok && beforeProbe.healthy) {
    report.status = "healthy";
    report.action = "none";
    report.stateWrite = writeWakeGuardState({
      lastRunAt: report.generatedAt,
      lastStatus: report.status,
      lastHealthyAt: report.generatedAt,
      lastRestartAt: state.lastRestartAt || null
    });
    return report;
  }

  if (!selfHeal) {
    report.status = "approval_required";
    report.action = "recommend_safe_gateway_restart_or_channel_reprobe";
    report.reason = before.ok
      ? "telegram_channel_probe_not_healthy"
      : "telegram_channel_probe_failed";
    report.stateWrite = writeWakeGuardState({
      lastRunAt: report.generatedAt,
      lastStatus: report.status,
      lastHealthyAt: state.lastHealthyAt || null,
      lastRestartAt: state.lastRestartAt || null
    });
    return report;
  }

  if (!before.ok && isOpenClawCliPermissionLimited(before.output || before.message)) {
    report.status = "blocked_cli_permission";
    report.action = "no_restart_cli_permission_limited";
    report.reason = "openclaw_cli_permission_limited";
    report.stateWrite = writeWakeGuardState({
      lastRunAt: report.generatedAt,
      lastStatus: report.status,
      lastHealthyAt: state.lastHealthyAt || null,
      lastRestartAt: state.lastRestartAt || null
    });
    return report;
  }

  if (!before.ok && isOpenClawCliUnavailable(before.output || before.message)) {
    report.status = "blocked_cli_unavailable";
    report.action = "no_restart_openclaw_cli_unavailable";
    report.reason = "openclaw_cli_unavailable";
    report.stateWrite = writeWakeGuardState({
      lastRunAt: report.generatedAt,
      lastStatus: report.status,
      lastHealthyAt: state.lastHealthyAt || null,
      lastRestartAt: state.lastRestartAt || null
    });
    return report;
  }

  if (cooldownActive) {
    report.status = "cooldown_hold";
    report.action = "no_restart_due_to_cooldown";
    report.stateWrite = writeWakeGuardState({
      lastRunAt: report.generatedAt,
      lastStatus: report.status,
      lastHealthyAt: state.lastHealthyAt || null,
      lastRestartAt: state.lastRestartAt || null
    });
    return report;
  }

  const restart = await run("openclaw", ["gateway", "restart", "--safe", "--wait", "30s", "--json"], { timeout: 90000 });
  report.gatewayTouched = true;
  report.gatewayRestarted = restart.ok;
  report.action = restart.ok ? "safe_gateway_restart" : "safe_gateway_restart_failed";
  report.restart = {
    ok: restart.ok,
    output: stripSecretish(restart.output || restart.message)
  };

  const after = await run("openclaw", ["channels", "status", "--channel", "telegram", "--probe"], { timeout: 45000 });
  const afterProbe = classifyChannelProbe(after.output);
  report.after = {
    ok: after.ok,
    probe: afterProbe,
    output: stripSecretish(after.output || after.message)
  };
  report.status = after.ok && afterProbe.healthy ? "recovered" : "recovery_unverified";
  report.stateWrite = writeWakeGuardState({
    lastRunAt: report.generatedAt,
    lastStatus: report.status,
    lastHealthyAt: report.status === "recovered" ? new Date().toISOString() : state.lastHealthyAt || null,
    lastRestartAt: restart.ok ? new Date().toISOString() : state.lastRestartAt || null
  });
  return report;
}

function readOpenClawConfigSafe() {
  const configPath = process.env.OPENCLAW_CONFIG || path.join(os.homedir(), ".openclaw", "openclaw.json");
  try {
    if (!exists(configPath)) return { exists: false, configPath };
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const plugins = parsed.plugins || {};
    const telegram = parsed.channels && parsed.channels.telegram ? parsed.channels.telegram : {};
    const loadPaths = plugins.load && Array.isArray(plugins.load.paths) ? plugins.load.paths : [];
    const beaiLoadPaths = loadPaths.filter((entry) => /beai-runtime|beai-layer/i.test(String(entry)));
    const allow = Array.isArray(plugins.allow) ? plugins.allow : undefined;
    return {
      exists: true,
      configPath,
      pluginsAllowEmpty: Array.isArray(allow) && allow.length === 0,
      pluginsAllowIncludesBeai: Array.isArray(allow) ? allow.includes("beai-runtime") : undefined,
      beaiLoadPaths,
      duplicateBeaiPaths: beaiLoadPaths.length > 1,
      telegramConfigured: Boolean(telegram.enabled),
      telegramSettings: {
        timeoutSeconds: typeof telegram.timeoutSeconds === "number" ? telegram.timeoutSeconds : null,
        pollingStallThresholdMs: typeof telegram.pollingStallThresholdMs === "number" ? telegram.pollingStallThresholdMs : null,
        historyLimit: typeof telegram.historyLimit === "number" ? telegram.historyLimit : null,
        dmHistoryLimit: typeof telegram.dmHistoryLimit === "number" ? telegram.dmHistoryLimit : null,
        retryAttempts: telegram.retry && typeof telegram.retry.attempts === "number" ? telegram.retry.attempts : null,
        retryMinDelayMs: telegram.retry && typeof telegram.retry.minDelayMs === "number" ? telegram.retry.minDelayMs : null,
        retryMaxDelayMs: telegram.retry && typeof telegram.retry.maxDelayMs === "number" ? telegram.retry.maxDelayMs : null
      }
    };
  } catch (error) {
    return { exists: false, configPath, readError: error.message };
  }
}

function countMatches(text, pattern) {
  const matches = String(text || "").match(pattern);
  return matches ? matches.length : 0;
}

function classifySymptom(text) {
  const source = String(text || "").toLowerCase();
  const tags = [];
  const add = (tag, patterns) => {
    if (patterns.some((pattern) => pattern.test(source))) tags.push(tag);
  };
  add("telegram_delivery", [/텔레그램/, /telegram/, /송수신/, /메시지/, /message/, /polling/, /getupdates/]);
  add("gateway_or_service", [/게이트웨이/, /gateway/, /daemon/, /service/, /재시작/, /restart/]);
  add("beai_runtime", [/비아이레이어/, /beai layer/, /beai runtime/, /runtime/, /플러그인/, /plugin/, /hook/]);
  add("repeated_response", [/반복/, /같은 답변/, /반사/, /repeat/, /same answer/, /approval/, /승인/, /보류/]);
  add("session_state", [/세션/, /session/, /\/new/, /새로운 대화/, /대화창/]);
  add("installer_or_package", [/설치/, /installer/, /package/, /zip/, /업데이트/, /upgrade/]);
  add("skills_workspace", [/스킬/, /skill/, /workspace/, /ready/, /missing requirements/]);
  return [...new Set(tags)];
}

async function commandChecks() {
  const checks = {};
  checks.status = deep ? await run("openclaw", ["status", "--deep"], { timeout: 30000 }) : skipped("status");
  checks.openclawDoctor = includeOpenClawDoctor ? await run("openclaw", ["doctor", "--non-interactive"], { timeout: 45000 }) : skipped("openclawDoctor");
  checks.pluginsList = await run("openclaw", ["plugins", "list"]);
  checks.pluginInspectBeai = await run("openclaw", ["plugins", "inspect", "beai-runtime"], { timeout: 30000 });
  checks.pluginsDoctor = await run("openclaw", ["plugins", "doctor"]);
  checks.hooks = await run("openclaw", ["hooks"]);
  checks.tasks = deep ? await run("openclaw", ["tasks"]) : skipped("tasks");
  checks.skillsList = await run("openclaw", ["skills", "list"], { timeout: 30000 });
  checks.gatewayStatus = await run("openclaw", ["gateway", "status"], { timeout: 30000 });
  checks.gatewayHealth = await run("openclaw", ["gateway", "health"], { timeout: 30000 });
  checks.channelsStatus = await run("openclaw", ["channels", "status"], { timeout: 30000 });
  checks.gatewayStability = deep ? await run("openclaw", ["gateway", "stability"], { timeout: 30000 }) : skipped("gatewayStability");
  checks.devicesList = deep ? await run("openclaw", ["devices", "list"], { timeout: 30000 }) : skipped("devicesList");
  checks.sessionsActive = deep ? await run("openclaw", ["sessions", "--active", "120", "--limit", "30", "--json"], { timeout: 20000 }) : skipped("sessionsActive");
  checks.recentLogs = deep ? await run("openclaw", ["logs", "--limit", "80", "--plain", "--timeout", "8000"], { timeout: 12000 }) : skipped("recentLogs");
  checks.beaiLiveEvidence = { ok: true, output: readRecentLiveEvidenceSafe() };
  return checks;
}

function stripSecretish(text) {
  return String(text || "")
    .replace(/(token|password|secret|api[_-]?key|botToken)(["':=\s]+)[^\s"',}]+/gi, "$1$2[REDACTED]")
    .slice(0, 1200);
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function parseLiveEvidenceEvents(text) {
  return String(text || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((event) => typeof event.timestamp === "string");
}

function detectVisibleProgressGap(liveEvidenceText, thresholdMs = 2 * 60 * 1000) {
  const events = parseLiveEvidenceEvents(liveEvidenceText)
    .map((event) => ({ ...event, time: Date.parse(event.timestamp) }))
    .filter((event) => Number.isFinite(event.time))
    .sort((a, b) => a.time - b.time);
  let activityWindowStart = null;
  let activityCount = 0;
  let longestGapMs = 0;
  for (const event of events) {
    const sessionKey = String(event.sessionKey || "");
    if (sessionKey.includes(":cron:")) continue;
    const visibleVerified =
      event.evidenceLevel === "visible_delivery_verified" ||
      event.action === "telegram visible delivery verified";
    if (visibleVerified) {
      if (activityWindowStart && activityCount >= 2) {
        longestGapMs = Math.max(longestGapMs, event.time - activityWindowStart);
      }
      activityWindowStart = null;
      activityCount = 0;
      continue;
    }
    const relevantActivity =
      event.evidenceLevel === "visible_progress_contract_observed" ||
      event.hook === "after_tool_call" ||
      event.hook === "before_agent_finalize" ||
      event.hook === "before_prompt_build";
    if (!relevantActivity) continue;
    if (!activityWindowStart) activityWindowStart = event.time;
    activityCount += 1;
    if (event.evidenceLevel === "visible_progress_contract_observed") {
      longestGapMs = Math.max(longestGapMs, thresholdMs + 1);
    }
  }
  return {
    detected: longestGapMs > thresholdMs,
    longestGapMs,
    thresholdMs
  };
}

function detectQuickFirstStatusGap(liveEvidenceText, thresholdMs = 30 * 1000) {
  const events = parseLiveEvidenceEvents(liveEvidenceText)
    .map((event) => ({ ...event, time: Date.parse(event.timestamp) }))
    .filter((event) => Number.isFinite(event.time))
    .sort((a, b) => a.time - b.time);
  const opened = new Map();
  const missing = [];
  for (const event of events) {
    const key = event.runId ? `run:${event.runId}` : event.sessionKey ? `session:${event.sessionKey}` : null;
    if (!key) continue;
    const action = String(event.action || "");
    const evidenceLevel = String(event.evidenceLevel || "");
    if (evidenceLevel === "quick_first_status_contract_observed" && /opened/i.test(action)) {
      opened.set(key, event);
      continue;
    }
    if (evidenceLevel === "visible_delivery_verified") {
      opened.delete(key);
      continue;
    }
    if (evidenceLevel === "quick_first_status_contract_observed" && /missing/i.test(action)) {
      const confirmed = Array.isArray(event.confirmed) ? event.confirmed.join("\n") : "";
      const elapsedMatch = confirmed.match(/elapsed_ms_without_quick_first_status:\s*(\d+)/i);
      const elapsedMs = elapsedMatch ? Number(elapsedMatch[1]) : thresholdMs + 1;
      missing.push({ event, elapsedMs });
    }
  }
  const longestGapMs = missing.reduce((max, item) => Math.max(max, item.elapsedMs), 0);
  return {
    detected: missing.length > 0 || longestGapMs > thresholdMs,
    openedCount: opened.size,
    missingCount: missing.length,
    longestGapMs,
    thresholdMs
  };
}

function detectPhaseTimingTelemetry(liveEvidenceText) {
  const events = parseLiveEvidenceEvents(liveEvidenceText);
  const phaseEvents = events.filter((event) =>
    event.action === "runtime phase timing sampled" ||
    (Array.isArray(event.confirmed) && event.confirmed.some((line) => /phase:/i.test(String(line))))
  );
  const phases = new Set();
  let maxElapsedMs = 0;
  for (const event of phaseEvents) {
    const confirmed = Array.isArray(event.confirmed) ? event.confirmed : [];
    for (const line of confirmed) {
      const phaseMatch = String(line).match(/phase:\s*([^\n]+)/i);
      if (phaseMatch) phases.add(phaseMatch[1].trim());
      const elapsedMatch = String(line).match(/elapsed_ms_from_turn_start:\s*(\d+)/i);
      if (elapsedMatch) maxElapsedMs = Math.max(maxElapsedMs, Number(elapsedMatch[1]));
    }
  }
  return {
    observed: phaseEvents.length > 0,
    eventCount: phaseEvents.length,
    phases: Array.from(phases),
    maxElapsedMs
  };
}

function collectDiagnosticText(checks, supplementalText = "") {
  return [
    checks.status.output || "",
    checks.gatewayStatus.output || "",
    checks.gatewayHealth.output || "",
    checks.channelsStatus.output || "",
    checks.gatewayStability.output || "",
    checks.devicesList.output || "",
    checks.sessionsActive.output || "",
    checks.recentLogs.output || "",
    checks.beaiLiveEvidence.output || "",
    checks.pluginsList.output || "",
    checks.pluginInspectBeai.output || "",
    checks.pluginsDoctor.output || "",
    checks.hooks.output || "",
    supplementalText
  ].join("\n");
}

function issue(severity, code, detail, owner, layer, recommendedAction) {
  return {
    severity,
    code,
    owner,
    layer,
    detail,
    recommendedAction,
    approvalExplanation: approvalExplanationFor(code, owner, layer)
  };
}

function approvalExplanationFor(code, owner, layer) {
  const explanations = {
    "telegram-direct-routing-confusion": {
      title: "텔레그램 답변 경로가 섞였을 가능성이 있습니다",
      plain: "사용자에게 보여야 할 답변과 OpenClaw 내부 세션 전달 메시지가 섞이면, 텔레그램에는 답이 안 오고 대시보드나 내부 세션에서 혼자 대화가 이어지는 것처럼 보일 수 있습니다.",
      approvalNeeded: "세션/워크스페이스 지침이나 전달 경로를 고치려면 실제 대화 흐름에 영향을 줄 수 있어서 사용자 승인이 필요합니다."
    },
    "beai-visible-delivery-contract-missing": {
      title: "비아이패키지 완료 보고가 텔레그램 visible 전송으로 닫히지 않은 흔적입니다",
      plain: "Codex 내부 final_answer나 private final text는 OpenClaw 내부 완료일 뿐, 사용자가 보는 Telegram 메시지가 아닙니다. Telegram direct 대화에서는 message(action=send) 결과와 messageId가 있어야 실제 전달로 볼 수 있습니다.",
      approvalNeeded: "이 문제는 BEAI 응답 운영 계약 보강 대상입니다. OpenClaw Gateway 재시작보다 먼저 visible send 계약, messageId 확인, 완료 보고 경계를 점검해야 합니다."
    },
    "beai-visible-delivery-candidate-not-verified": {
      title: "텔레그램 전송 후보는 보였지만 messageId 검증이 아직 없습니다",
      plain: "reply_payload_sending은 메시지가 전송 직전까지 갔다는 신호입니다. 하지만 실제 Telegram 전송 결과는 message_sent와 messageId까지 확인되어야 합니다.",
      approvalNeeded: "이 상태에서는 완료라고 닫지 말고, OpenClaw message_sent hook 또는 승인된 왕복 테스트로 실제 도착 증거를 확인해야 합니다."
    },
    "beai-visible-delivery-message-sent-unverified": {
      title: "전송 후 hook은 보였지만 Telegram messageId가 없습니다",
      plain: "message_sent가 호출되어도 success=false이거나 messageId가 없으면 사용자에게 도착한 완료 보고로 확정할 수 없습니다.",
      approvalNeeded: "전송 실패 원인이 BEAI payload인지 OpenClaw Telegram provider인지 분리해야 하며, 테스트 발송이나 provider 재시작은 사용자 승인 후 진행해야 합니다."
    },
    "beai-long-running-visible-progress-missing": {
      title: "긴 작업 중 텔레그램 진행 보고가 너무 오래 비었습니다",
      plain: "Telegram direct에서 사용자는 마지막 완료 보고만이 아니라 진행 중 신호도 기대합니다. 내부 도구 작업이 계속되는데 source conversation에 진행 업데이트가 없으면 사용자는 텔레그램이 멈춘 것으로 느낍니다.",
      approvalNeeded: "자동 발송이나 주기적 heartbeat 등록은 외부 메시지/자동화 경계이므로 승인형 설계가 필요합니다. 우선 BEAI Runtime과 Doctor는 이 상태를 정상/완료로 닫지 않게 막아야 합니다."
    },
    "beai-quick-first-status-missing": {
      title: "작업 시작 후 첫 진행 신호가 너무 늦었습니다",
      plain: "Telegram direct에서 긴 점검이나 수정이 시작되면 사용자는 먼저 '작업이 시작됐고 어디까지 볼지'를 알아야 합니다. 첫 상태 보고가 늦으면 실제 작업이 진행 중이어도 먹통처럼 느껴집니다.",
      approvalNeeded: "자동 메시지 발송은 외부 전송 경계이므로 승인형 설계가 필요합니다. 우선 BEAI Runtime과 Doctor는 첫 상태 보고 공백을 정상으로 통과시키지 않게 기록해야 합니다."
    },
    "beai-phase-timing-telemetry-missing": {
      title: "응답 지연 구간을 나눠 볼 계측 증거가 없습니다",
      plain: "느린 턴을 하나로 보면 OpenClaw, BEAI Runtime, 도구 실행, 모델 호출, Telegram 전송 중 어디가 느린지 구분할 수 없습니다.",
      approvalNeeded: "수리 전에는 먼저 구간별 시간 증거를 남겨야 합니다. 계측 없이 Gateway 재시작이나 설정 변경으로 바로 넘어가면 원인 분리가 어렵습니다."
    },
    "telegram-direct-sessions-current-failed": {
      title: "텔레그램 세션을 current로 찾지 못한 흔적이 있습니다",
      plain: "OpenClaw가 지금 답해야 할 텔레그램 대화 세션을 정확히 잡지 못하면, 두 번째 메시지부터 대화가 이어지지 않거나 엉뚱한 내부 흐름으로 빠질 수 있습니다.",
      approvalNeeded: "세션 상태 정리나 재연결은 대화 기록과 진행 중 작업에 영향을 줄 수 있어 승인 후 진행해야 합니다."
    },
    "telegram-direct-lane-wait-exceeded": {
      title: "텔레그램 응답 대기 줄이 막혔던 흔적이 있습니다",
      plain: "메시지는 들어왔지만 처리 차선이 오래 기다리다 실패한 상태입니다. 사용자는 텔레그램이 멈춘 것처럼 느낄 수 있습니다.",
      approvalNeeded: "Gateway나 provider 재시작은 현재 작업을 끊을 수 있어 바로 실행하지 않고 승인 후 진행합니다."
    },
    "telegram-direct-incomplete-turn": {
      title: "이전 응답 턴이 끝나지 않은 흔적이 있습니다",
      plain: "이전 답변 처리가 완전히 닫히지 않으면 다음 사용자 메시지가 정상 대화로 이어지지 않을 수 있습니다.",
      approvalNeeded: "세션 정리나 작업 상태 정리는 현재 대화 흐름에 영향을 줄 수 있으므로 승인 후 처리해야 합니다."
    },
    "telegram-direct-alias-routing-failure": {
      title: "같은 텔레그램 사용자가 숫자 ID 세션과 @username 세션으로 갈라진 흔적이 있습니다",
      plain: "사용자는 하나의 텔레그램 대화창이라고 느끼지만, OpenClaw 내부에서는 숫자 chat id 세션과 @username 세션을 서로 다른 대화로 볼 수 있습니다. @username으로 답변을 보내면 Telegram API가 chat을 찾지 못해 답변이 사라진 것처럼 보일 수 있습니다.",
      approvalNeeded: "세션 canonicalization이나 alias 세션 정리는 대화 기록과 전송 경로에 영향을 주므로 백업과 사용자 승인 후 진행해야 합니다."
    },
    "telegram-direct-stuck-model-call": {
      title: "텔레그램 direct 세션의 모델 호출이 오래 멈춘 흔적이 있습니다",
      plain: "이전 모델 호출이 processing 상태로 오래 남으면 새 텔레그램 메시지가 들어와도 같은 lane에서 기다리거나 incomplete turn으로 꼬일 수 있습니다.",
      approvalNeeded: "stuck run 정리, 세션 복구, provider/Gateway 재시작은 진행 중 작업을 끊을 수 있어 사용자 승인 후 진행해야 합니다."
    },
    "gateway-token-mismatch": {
      title: "Gateway 토큰이 서로 맞지 않았던 흔적이 있습니다",
      plain: "Gateway 설정 토큰과 대시보드/기기 쪽 저장 토큰이 다르면, OpenClaw는 떠 있어도 UI나 채널이 정상 연결되지 않을 수 있습니다.",
      approvalNeeded: "토큰 변경은 인증과 보안에 직접 영향을 주므로 사용자가 이해하고 승인해야 합니다."
    },
    "runtime-version-metadata-stale": {
      title: "BEAI 실제 버전과 기록된 버전이 다릅니다",
      plain: "실행 중인 BEAI는 새 버전인데 OpenClaw 내부 기록은 예전 버전이면, 설치는 되어도 운영자가 현재 상태를 잘못 판단할 수 있습니다.",
      approvalNeeded: "설치 기록 정리는 OpenClaw 상태 DB나 메타데이터를 건드릴 수 있어 승인 후 진행해야 합니다."
    },
    "telegram-polling-instability": {
      title: "텔레그램 polling이 멈췄다가 복구된 흔적이 있습니다",
      plain: "텔레그램 서버와 OpenClaw가 메시지를 오래 기다리는 과정에서 멈춤이 발생하면, 메시지가 늦거나 누락된 것처럼 보일 수 있습니다.",
      approvalNeeded: "provider나 Gateway 재시작은 현재 대화를 끊을 수 있으므로 승인 후 진행합니다."
    },
    "gateway-ok-telegram-transport-stale": {
      title: "Gateway는 살아 있지만 Telegram 통로가 멈췄을 가능성이 있습니다",
      plain: "Gateway RPC가 정상이어도 Telegram polling이나 transport activity가 오래 멈추면 사용자는 텔레그램에서 먹통으로 느낍니다. 이 상태는 Gateway 정상 여부만 봐서는 잡히지 않습니다.",
      approvalNeeded: "Telegram provider 재시작이나 Gateway 재시작은 진행 중 대화를 끊을 수 있으므로, 먼저 상태를 설명하고 승인 후 진행해야 합니다."
    },
    "telegram-channel-status-unavailable": {
      title: "Telegram 채널 상태를 직접 확인하지 못했습니다",
      plain: "Gateway 상태만으로는 텔레그램 실사용 가능성을 확정할 수 없습니다. channel status 확인이 실패하면 running, connected, transport activity를 직접 확인하지 못한 상태입니다.",
      approvalNeeded: "추가 로그 확인이나 live roundtrip 테스트가 필요할 수 있고, 테스트 발송이나 재시작은 승인 후 진행해야 합니다."
    },
    "telegram-channel-connected-but-not-roundtrip-verified": {
      title: "Telegram은 연결로 보이지만 실제 왕복은 아직 확인되지 않았습니다",
      plain: "running=true, connected=true는 좋은 신호지만, 사용자가 실제로 메시지를 보내고 답을 받았다는 증거와는 다릅니다. 특히 노트북 sleep/wake 이후에는 연결 표시와 실제 왕복 가능성이 어긋날 수 있습니다.",
      approvalNeeded: "실제 왕복 테스트 메시지나 provider 재시작은 사용자 채널에 영향을 줄 수 있으므로 승인 후 진행해야 합니다."
    },
    "telegram-polling-threshold-too-low": {
      title: "텔레그램 polling 멈춤 감지 기준이 너무 예민합니다",
      plain: "Telegram long polling은 정상적으로도 30초 안팎을 기다릴 수 있습니다. 멈춤 감지 기준이 timeout과 너무 가까우면 정상 대기도 장애로 오인되어 재시작이나 지연 체감이 반복될 수 있습니다.",
      approvalNeeded: "pollingStallThresholdMs 같은 채널 설정 변경은 Telegram provider 동작에 영향을 주므로 승인 후 적용해야 합니다."
    },
    "telegram-boot-network-recovery-window": {
      title: "부팅 직후 네트워크 복귀 구간에서 Telegram polling이 불안정했던 흔적입니다",
      plain: "컴퓨터가 켜진 직후에는 Wi-Fi, DNS, TLS, Telegram Bot API 연결이 완전히 안정화되기 전일 수 있습니다. 이때 fetch failed나 ENETUNREACH가 보이면 BEAI 응답 문제가 아니라 네트워크 복귀 타이밍 문제일 수 있습니다.",
      approvalNeeded: "대부분은 관찰과 재확인으로 충분하지만, provider 재시작이나 설정 보정은 현재 채널 흐름에 영향을 줄 수 있어 승인 후 진행해야 합니다."
    },
    "telegram-delivery-pending-not-failed": {
      title: "텔레그램 메시지는 처리 중이고 아직 실패로 볼 수 없습니다",
      plain: "message.received, queued, run_started가 보이면 OpenClaw가 메시지를 받은 것입니다. delivery.completed가 늦게 찍히는 동안 사용자는 멈춘 것처럼 느낄 수 있지만, 이 단계는 전송 실패가 아니라 처리 지연일 수 있습니다.",
      approvalNeeded: "실제 실패인지 확인하려면 live roundtrip이나 특정 시간대 로그 확인이 필요할 수 있고, 테스트 메시지 발송은 사용자 승인 후 진행해야 합니다."
    },
    "telegram-direct-session-bloat-risk": {
      title: "텔레그램 direct 세션이 너무 커져 응답이 느려질 수 있습니다",
      plain: "진단 로그와 도구 호출이 같은 텔레그램 세션에 계속 쌓이면 한 턴 처리 시간이 길어지고, 두 번째 메시지가 같은 lane에서 기다리게 됩니다. 이 경우 사용자는 무응답처럼 느낄 수 있습니다.",
      approvalNeeded: "세션 전환, compact, archive, quarantine은 대화 연속성과 기록에 영향을 줄 수 있어 백업과 승인 후 진행해야 합니다."
    },
    "telegram-diagnostic-in-operational-session-risk": {
      title: "운영 대화창에서 진단을 계속해 세션이 무거워질 위험이 있습니다",
      plain: "사용자가 평소 쓰는 Telegram direct 세션 안에서 로그 점검과 도구 호출을 계속하면 같은 세션과 lane이 커져 실제 대화 응답이 느려질 수 있습니다.",
      approvalNeeded: "진단용 세션 분리나 세션 위생 조치는 사용자의 작업 흐름을 바꿀 수 있으므로 설명 후 진행해야 합니다."
    },
    "beai-continuity-residue-risk": {
      title: "비활성화된 BEAI continuity/working-memory 잔여물이 영향을 줄 수 있습니다",
      plain: "이전에 쓰던 continuity나 working-memory 파일이 남아 있으면 비활성화 후에도 세션 프롬프트나 판단에 과하게 영향을 줄 수 있습니다.",
      approvalNeeded: "파일 격리나 만료 처리는 작업공간 상태를 바꾸므로 삭제 없이 백업/격리 계획을 설명하고 승인 후 진행해야 합니다."
    },
    "reported-telegram-delivery-needs-deep-check": {
      title: "텔레그램 문제 제보가 있어 더 깊은 점검이 필요합니다",
      plain: "빠른 점검만으로는 원인이 BEAI인지, OpenClaw 채널인지, 일시적 네트워크인지 구분되지 않습니다.",
      approvalNeeded: "깊은 점검은 읽기 전용이면 승인 없이 가능하지만, 실제 테스트 메시지 발송이나 재시작은 승인이 필요합니다."
    },
    "reported-telegram-delivery-not-reproduced-in-deep-check": {
      title: "현재 점검 창에서는 텔레그램 장애가 재현되지 않았습니다",
      plain: "지금 읽은 로그와 상태에서는 직접 장애 증거가 없지만, 사용자가 겪은 현상은 간헐적일 수 있습니다.",
      approvalNeeded: "정확히 확인하려면 사용자가 승인한 테스트 메시지 왕복이나 특정 시간대 로그 추적이 필요합니다."
    },
    "reported-repeated-response-needs-deep-check": {
      title: "반복 답변 증상은 세션/응답 표면을 더 봐야 합니다",
      plain: "같은 보류 답변이 반복되는 문제는 모델 답변 문제가 아니라 세션 상태, 내부 전달, 승인 대기 상태가 꼬인 문제일 수 있습니다.",
      approvalNeeded: "세션이나 상태를 정리하는 조치는 대화 기록에 영향을 줄 수 있어 승인 후 진행해야 합니다."
    },
    "reported-repeated-response-not-reproduced-in-deep-check": {
      title: "현재 점검 창에서는 반복 답변이 직접 재현되지 않았습니다",
      plain: "지금 읽은 범위에서는 반복 답변의 직접 증거가 없지만, 특정 세션이나 특정 시점에서는 발생했을 수 있습니다.",
      approvalNeeded: "정확한 확인에는 해당 세션 로그 범위 지정이나 통제된 재현 테스트가 필요합니다."
    },
    "beai-gateway-injected-response-loop": {
      title: "실제 모델 답변이 BEAI 안내문으로 덮였을 가능성이 있습니다",
      plain: "세션에 provider=openclaw, model=gateway-injected, usage=0 같은 기록이 반복되면 실제 모델이 답한 것이 아니라 Gateway나 BEAI hook이 만든 안내문이 최종 답변으로 들어갔을 수 있습니다.",
      approvalNeeded: "응답 전송 hook을 끄거나 원문 대체 방식에서 append/metadata-only로 바꾸는 조치는 실제 답변 경로를 바꾸므로 승인 후 진행해야 합니다."
    },
    "beai-reply-payload-rewrite-hook-active": {
      title: "BEAI 응답 재작성 hook이 최종 답변에 개입한 흔적이 있습니다",
      plain: "reply_payload_sending 단계에서 Telegram UX 안내문을 추가하거나 원래 답변을 바꾸면, 사용자가 어떤 말을 해도 같은 상태 안내를 받는 것처럼 보일 수 있습니다.",
      approvalNeeded: "hook 정책 변경은 모든 답변 전송에 영향을 줄 수 있어서 자동으로 바꾸면 안 됩니다."
    },
    "beai-ux-state-guide-replace-risk": {
      title: "복구 상태 안내문이 원래 답변을 대체했을 위험이 있습니다",
      plain: "gateway_restart_recovery나 internal_progress_surface 같은 내부 상태가 최종 답변으로 직접 렌더링되면, 사용자는 문제 해결 답변 대신 반복 안내문만 보게 됩니다.",
      approvalNeeded: "replace 방식을 append 또는 metadata-only로 바꾸는 것은 BEAI Runtime 동작 정책 변경이므로 승인 후 검증해야 합니다."
    },
    "beai-before-agent-reply-override-active": {
      title: "모델 답변 전 단계에서 설치/상태 안내가 끼어든 흔적이 있습니다",
      plain: "before_agent_reply 단계에서 install guide override가 작동하면 사용자의 실제 질문보다 설치/복구 안내가 우선될 수 있습니다.",
      approvalNeeded: "이 hook을 조정하면 정상 설치 안내까지 영향을 받을 수 있으므로 승인 후 좁게 수정해야 합니다."
    },
    "beai-telegram-direct-recovery-surface-stale-plan": {
      title: "텔레그램 direct 두 번째 턴을 BEAI 복구 안내가 가로챈 흔적이 있습니다",
      plain: "텔레그램 메시지는 Gateway까지 들어왔지만, BEAI Runtime이 이전 턴의 복구 계획을 새 턴처럼 사용해 실제 모델 답변 경로로 넘기지 않았을 수 있습니다. 이 경우 사용자는 두 번째 메시지부터 무응답처럼 느끼거나 같은 복구 안내만 보게 됩니다.",
      approvalNeeded: "BEAI Runtime의 before_agent_reply hook 정책을 바꾸거나 런타임을 재설치하는 조치는 실제 답변 경로에 영향을 주므로 사용자에게 설명하고 승인받은 뒤 진행해야 합니다."
    },
    "beai-install-intent-lost": {
      title: "첨부 설치/점검 요청이 실제 설치 흐름으로 이어지지 않은 흔적이 있습니다",
      plain: "사용자가 zip 파일을 보내며 설치나 점검을 요청했는데, 시스템이 이를 기억 후보나 스킬 사용 후보처럼 처리하면 실제 설치·검증이 진행되지 않습니다.",
      approvalNeeded: "설치 흐름 보정이나 런타임 교체는 파일 복사, 플러그인 로드, 검증 절차에 영향을 주므로 사용자 승인 후 진행해야 합니다."
    },
    "operator-write-scope-missing": {
      title: "로컬 CLI 기기에 메시지 전송 권한이 부족했던 흔적이 있습니다",
      plain: "운영자가 텔레그램 테스트 메시지를 보내려 해도 local CLI device에 operator.write 권한이 없으면 테스트 자체가 pending approval로 막힐 수 있습니다.",
      approvalNeeded: "기기 scope 변경은 권한 보안에 직접 영향을 주므로 사용자가 이해하고 승인해야 합니다."
    },
    "beai-canned-response-loop-signature": {
      title: "같은 안내문이 반복된 직접 흔적이 있습니다",
      plain: "같은 상태 안내문이나 승인/보류 안내가 여러 번 반복되면, 사용자의 새 입력이 실제 요청으로 처리되지 않고 같은 표면 응답으로 되돌아갔을 가능성이 큽니다.",
      approvalNeeded: "반복 표면을 막으려면 세션 상태나 BEAI 응답 hook 정책을 조정해야 할 수 있어 승인 후 진행해야 합니다."
    },
    "beai-duplicate-runtime-load-risk": {
      title: "BEAI Runtime이 둘 이상 로드될 위험이 있습니다",
      plain: "예전 BEAI Runtime과 새 Runtime이 서로 다른 경로에 남아 있으면, 고친 코드가 아니라 예전 hook이 계속 답변에 개입할 수 있습니다.",
      approvalNeeded: "플러그인 경로 정리는 실제 로드되는 런타임을 바꾸므로 사용자 승인과 백업 후 진행해야 합니다."
    },
    "plugins-allow-empty-autoload-risk": {
      title: "비공식 플러그인이 자동 로드될 수 있는 설정입니다",
      plain: "plugins.allow가 비어 있으면 발견된 non-bundled 플러그인이 자동으로 로드될 수 있어, 원치 않는 hook이 계속 살아 있을 가능성이 생깁니다.",
      approvalNeeded: "plugins.allow 설정 변경은 어떤 플러그인이 로드되는지 바꾸므로 승인 후 적용해야 합니다."
    }
  };
  return explanations[code] || {
    title: `${owner}/${layer} 조치에는 확인이 필요합니다`,
    plain: "이 문제는 시스템 상태나 사용 중인 대화 흐름에 영향을 줄 수 있어 자동으로 고치면 안 됩니다.",
    approvalNeeded: "무엇을 바꾸는지, 되돌릴 수 있는지, 검증 방법이 무엇인지 설명한 뒤 사용자 승인을 받아야 합니다."
  };
}

function classify(checks, helpers, symptomTags, supplementalText = "", openclawConfig = {}) {
  const issues = [];
  const pluginText = checks.pluginsList.output || "";
  const pluginInspectText = checks.pluginInspectBeai.output || "";
  const openclawDoctorText = checks.openclawDoctor.output || "";
  const hookText = checks.hooks.output || "";
  const taskText = checks.tasks.output || "";
  const skillsText = checks.skillsList.output || "";
  const gatewayText = `${checks.gatewayStatus.output || ""}\n${checks.gatewayHealth.output || ""}\n${checks.gatewayStability.output || ""}`;
  const channelText = checks.channelsStatus.output || "";
  const deviceText = checks.devicesList.output || "";
  const sessionText = checks.sessionsActive.output || "";
  const logText = checks.recentLogs.output || "";
  const combinedText = collectDiagnosticText(checks, supplementalText);

  if (!checks.openclawDoctor.skipped && !checks.openclawDoctor.ok) {
    issues.push(issue(
      "approval_required",
      "openclaw-doctor-failed",
      stripSecretish(openclawDoctorText || checks.openclawDoctor.message),
      "openclaw",
      "core-doctor",
      "Treat as OpenClaw-owned. Do not repair through BEAI Doctor unless the failing detail is BEAI-specific."
    ));
  }
  if (!checks.openclawDoctor.skipped && includesAny(openclawDoctorText, [/failed/i, /error/i, /unhealthy/i, /repair/i])) {
    issues.push(issue(
      "approval_required",
      "openclaw-doctor-core-finding",
      stripSecretish(openclawDoctorText),
      "openclaw",
      "core-doctor",
      "Delegate core/config/service repair to OpenClaw Doctor flow with explicit approval."
    ));
  }
  if (!checks.status.ok) issues.push(issue("approval_required", "openclaw-status-failed", checks.status.message || checks.status.output, "openclaw", "status", "Run OpenClaw status/doctor flow before BEAI repair."));
  if (!checks.pluginsList.ok) {
    issues.push(issue("approval_required", "plugins-list-failed", checks.pluginsList.output || checks.pluginsList.message, "openclaw", "plugins", "Plugin subsystem must be available before BEAI Runtime repair."));
  }
  if (checks.pluginsList.ok && /beai-runtime/i.test(pluginText) && !checks.pluginInspectBeai.ok) {
    issues.push(issue("approval_required", "beai-runtime-inspect-failed", stripSecretish(checks.pluginInspectBeai.output || checks.pluginInspectBeai.message), "beai", "runtime-plugin", "Inspect/reinstall BEAI Runtime only with approval."));
  }
  if (!checks.pluginsDoctor.ok) issues.push(issue("approval_required", "plugins-doctor-failed", checks.pluginsDoctor.output, "openclaw", "plugins", "OpenClaw plugin doctor failed; review plugin subsystem before BEAI repair."));
  const beaiRuntimeInspectLoaded = checks.pluginInspectBeai.ok && /Status:\s*loaded/i.test(pluginInspectText);
  if (checks.pluginsList.ok && !/beai-runtime/i.test(pluginText) && !beaiRuntimeInspectLoaded) {
    issues.push(issue("approval_required", "beai-runtime-not-visible", "BEAI Runtime was not found in plugin list.", "beai", "runtime-plugin", "Install or re-enable BEAI Runtime with approval."));
  }
  if (checks.pluginsList.ok && /beai-runtime/i.test(pluginText) && !/(enabled|loaded|ready)/i.test(pluginText) && !beaiRuntimeInspectLoaded) {
    issues.push(issue("approval_required", "beai-runtime-not-ready", "BEAI Runtime appears present but not clearly ready.", "beai", "runtime-plugin", "Reload/reinstall BEAI Runtime only after approval and verification plan."));
  }
  if (checks.pluginInspectBeai.ok) {
    const loadedVersion = (pluginInspectText.match(/^Version:\s*(.+)$/im) || [])[1]?.trim();
    const recordedVersion = (pluginInspectText.match(/^Recorded version:\s*(.+)$/im) || [])[1]?.trim();
    if (loadedVersion && recordedVersion && loadedVersion !== recordedVersion) {
      issues.push(issue(
        "approval_required",
        "runtime-version-metadata-stale",
        `BEAI Runtime loaded version is ${loadedVersion}, but install metadata recorded version is ${recordedVersion}. This is not usually a live runtime failure, but should be cleaned in an approved metadata repair.`,
        "beai",
        "install-metadata",
        "Clean BEAI install metadata only after approval; do not touch OpenClaw core."
      ));
    }
  }
  if (openclawConfig.duplicateBeaiPaths) {
    issues.push(issue(
      "approval_required",
      "beai-duplicate-runtime-load-risk",
      `BEAI-related plugin load paths: ${(openclawConfig.beaiLoadPaths || []).join(", ")}`,
      "beai",
      "plugin-load-path",
      "Back up and reduce BEAI runtime load paths to one explicit runtime path after approval."
    ));
  }
  if (!checks.hooks.ok || /0\/|missing|failed|error/i.test(hookText)) {
    issues.push(issue("approval_required", "hooks-not-ready", hookText.slice(0, 500), "mixed", "hooks", "Separate OpenClaw hook subsystem failure from BEAI hook definition mismatch."));
  }
  if (/queued|running/i.test(taskText) && !/0\s+queued|queued:\s*0/i.test(taskText)) {
    issues.push(issue("approval_required", "task-pressure-present", "OpenClaw may have active queued/running work.", "openclaw", "tasks", "Do not restart services until active task pressure is understood."));
  }
  if (!checks.skillsList.ok) {
    issues.push(issue("approval_required", "skills-list-failed", stripSecretish(checks.skillsList.output || checks.skillsList.message), "openclaw", "skills", "Skill subsystem unavailable; review OpenClaw skill state."));
  } else if (/missing requirements|missing/i.test(skillsText)) {
    issues.push(issue("approval_required", "skills-missing-requirements", stripSecretish((skillsText.match(/Skills\s+\([^)]+\)/i) || ["Some skills may have missing requirements."])[0]), "openclaw", "skills", "Report missing optional requirements separately from BEAI Runtime health."));
  }
  if (!checks.gatewayStatus.ok) {
    issues.push(issue("approval_required", "gateway-status-failed", stripSecretish(checks.gatewayStatus.output || checks.gatewayStatus.message), "openclaw", "gateway", "Gateway repair/restart requires explicit approval."));
  }
  if (!checks.gatewayHealth.ok) {
    issues.push(issue("approval_required", "gateway-health-failed", stripSecretish(checks.gatewayHealth.output || checks.gatewayHealth.message), "openclaw", "gateway", "Gateway repair/restart requires explicit approval."));
  }
  if (!checks.channelsStatus.ok) {
    issues.push(issue(
      "approval_required",
      "telegram-channel-status-unavailable",
      stripSecretish(checks.channelsStatus.output || checks.channelsStatus.message),
      "openclaw",
      "telegram-channel",
      "Run channel status/log probes before treating Gateway RPC health as enough."
    ));
  }
  if (!checks.gatewayStability.skipped && !checks.gatewayStability.ok) {
    issues.push(issue("approval_required", "gateway-stability-failed", stripSecretish(checks.gatewayStability.output || checks.gatewayStability.message), "openclaw", "gateway", "Review gateway stability before BEAI layer changes."));
  }
  if (includesAny(gatewayText, [/disconnected/i, /unhealthy/i, /not\s+running/i, /failed/i, /error/i])) {
    issues.push(issue("approval_required", "gateway-unhealthy-signal", stripSecretish(gatewayText), "openclaw", "gateway", "Gateway health issue is OpenClaw-owned; BEAI Doctor may plan but not silently repair."));
  }
  if (
    checks.gatewayStatus.ok &&
    checks.gatewayHealth.ok &&
    checks.channelsStatus.ok &&
    includesAny(channelText, [/Telegram/i, /mode:\s*polling/i]) &&
    (
      includesAny(channelText, [/not\s+running/i, /disconnected/i, /transport:\s*(?:never|unknown|n\/a)/i]) ||
      includesAny(channelText, [/in:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /out:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /transport:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /transport:\s*(?:[2-9]|[1-9]\d)h ago/i])
    )
  ) {
    issues.push(issue(
      "approval_required",
      "gateway-ok-telegram-transport-stale",
      stripSecretish(channelText),
      "openclaw",
      "telegram-channel",
      "Treat as channel transport recovery. Do not conclude healthy from Gateway RPC alone; re-check activity, then use approved provider/Gateway restart only if needed."
    ));
  }
  if (
    !issues.some((entry) => entry.code === "gateway-ok-telegram-transport-stale") &&
    includesAny(combinedText, [/Gateway RPC 정상/i, /Gateway reachable/i, /gateway.*healthy/i]) &&
    includesAny(combinedText, [/Telegram/i, /running[=:\s]+true/i, /connected[=:\s]+true/i, /enabled, configured, running, connected/i]) &&
    includesAny(combinedText, [/transport:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /in:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /out:\s*(?:[3-9]\d|[1-9]\d{2,})m ago/i, /transport:\s*(?:[2-9]|[1-9]\d)h ago/i])
  ) {
    issues.push(issue(
      "approval_required",
      "gateway-ok-telegram-transport-stale",
      "Report text says Gateway is reachable/healthy while Telegram channel activity is stale.",
      "openclaw",
      "telegram-channel",
      "Treat as channel transport recovery. Do not conclude healthy from Gateway RPC alone; re-check activity, then use approved provider/Gateway restart only if needed."
    ));
  }
  if (
    checks.channelsStatus.ok &&
    includesAny(channelText, [/Telegram/i, /running/i, /connected/i]) &&
    !includesAny(channelText, [/in:\s*(?:just now|\d+[sm] ago)/i]) &&
    !includesAny(channelText, [/out:\s*(?:just now|\d+[sm] ago)/i])
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-channel-connected-but-not-roundtrip-verified",
      stripSecretish(channelText),
      "openclaw",
      "telegram-channel",
      "Report connected-but-not-roundtrip-verified. Use recent inbound/outbound timestamps or an approved live roundtrip before saying Telegram is fully healthy."
    ));
  }
  if (includesAny(combinedText, [/polling stall detected/i, /getUpdates timed out/i, /health-monitor:\s*restarting/i])) {
    issues.push(issue("approval_required", "telegram-polling-instability", "Recent logs suggest Telegram long-polling timeout/stall or health-monitor recovery. Recommended repair may include Telegram channel verification and an approved Gateway/provider restart, not automatic restart.", "openclaw", "telegram-transport", "Provider/Gateway restart and live test send require approval."));
  }
  const telegramSettings = openclawConfig.telegramSettings || {};
  if (
    typeof telegramSettings.timeoutSeconds === "number" &&
    typeof telegramSettings.pollingStallThresholdMs === "number" &&
    telegramSettings.pollingStallThresholdMs <= Math.max(60000, telegramSettings.timeoutSeconds * 2000)
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-polling-threshold-too-low",
      `Telegram timeoutSeconds=${telegramSettings.timeoutSeconds}, pollingStallThresholdMs=${telegramSettings.pollingStallThresholdMs}. Stall threshold should usually be at least 2x timeout and preferably 75000ms or more for unstable networks.`,
      "openclaw",
      "telegram-transport-config",
      "Recommend polling threshold adjustment only with approval; do not edit channel config silently."
    ));
  }
  if (
    !issues.some((entry) => entry.code === "telegram-polling-threshold-too-low") &&
    includesAny(combinedText, [/pollingStallThresholdMs[^0-9]{0,20}30000/i, /polling stall detected[\s\S]{0,120}30\.\d+s/i, /active getUpdates stuck for 30\.\d+s/i]) &&
    includesAny(combinedText, [/timeoutSeconds[^0-9]{0,20}30/i, /long polling/i, /getUpdates/i])
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-polling-threshold-too-low",
      "Report text suggests pollingStallThresholdMs was around 30000ms while Telegram long polling timeout was around 30s.",
      "openclaw",
      "telegram-transport-config",
      "Recommend polling threshold adjustment only with approval; do not edit channel config silently."
    ));
  }
  if (includesAny(combinedText, [/ENETUNREACH/i, /fetch failed/i, /deleteWebhook failed/i, /no completed getUpdates/i])) {
    issues.push(issue(
      "approval_required",
      "telegram-boot-network-recovery-window",
      "Recent logs or report text suggest Telegram Bot API connectivity failed during a boot/network recovery window.",
      "openclaw",
      "telegram-transport",
      "Treat as transport recovery first. Verify stable inbound/outbound before runtime or session repair."
    ));
  }
  if (
    includesAny(combinedText, [/message\.received/i, /\bqueued\b/i, /run_started/i]) &&
    (
      includesAny(combinedText, [/delivery\.completed.*아직.*없/i, /아직\s+delivery\.completed/i, /no\s+delivery\.completed/i, /delivery\.completed가\s+아직/i]) ||
      !includesAny(combinedText, [/message\.delivery\.completed/i, /delivery\.completed/i, /telegram outbound send ok/i])
    )
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-delivery-pending-not-failed",
      "Message was received/queued/run_started but final delivery completion was not yet confirmed in the observed window.",
      "openclaw",
      "telegram-delivery-state",
      "Do not classify as send failure yet. Compare timestamps or run an approved live roundtrip if needed."
    ));
  }
  if (
    includesAny(combinedText, [/long-running session/i, /queued_behind_active_work/i, /activeWorkKind=model_call/i, /active work/i]) ||
    includesAny(combinedText, [/\b(?:[8-9]\d|[1-9]\d{2,})k\s*tokens?\b/i, /\b(?:8[0-9]000|9[0-9]000|[1-9][0-9]{5,})\s*tokens?\b/i])
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-direct-session-bloat-risk",
      "Recent logs or report text suggest the Telegram direct session is large or queued behind active model work.",
      "openclaw",
      "session-lane",
      "Recommend session size review, compact/new-session handoff, or diagnostic-session separation only after approval."
    ));
  }
  if (
    includesAny(combinedText, [/진단.*로그/i, /로그.*진단/i, /도구 호출/i, /diagnostic.*session/i, /operating session/i]) &&
    includesAny(combinedText, [/Telegram direct/i, /텔레그램.*세션/i, /같은 lane/i, /transcript/i])
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-diagnostic-in-operational-session-risk",
      "Report text suggests diagnostic log/tool work is being accumulated inside the normal Telegram operating session.",
      "openclaw",
      "session-hygiene",
      "Recommend separating operational chat from diagnostic sessions before cleanup or session transition."
    ));
  }
  if (includesAny(combinedText, [/continuity\/working-memory/i, /working-memory/i, /BEAI continuity/i, /잔여 파일/i, /quarantine/i])) {
    issues.push(issue(
      "approval_required",
      "beai-continuity-residue-risk",
      "Report text suggests stale BEAI continuity or working-memory residue may affect prompts after deactivation.",
      "beai",
      "continuity-state",
      "Review and quarantine stale continuity state only with backup and approval."
    ));
  }
  if (includesAny(combinedText, [/sessions\.resolve[\s\S]{0,200}No session found:\s*current/i, /No session found:\s*current/i])) {
    issues.push(issue("approval_required", "telegram-direct-sessions-current-failed", "Recent logs suggest a Telegram/direct flow tried to resolve sessionKey=current but no matching session was found.", "openclaw", "session-routing", "Review session routing and direct chat continuity before any cleanup or restart."));
  }
  if (includesAny(combinedText, [/lane wait exceeded/i, /lane=session:agent:main:telegram:direct/i])) {
    issues.push(issue("approval_required", "telegram-direct-lane-wait-exceeded", "Recent logs suggest the Telegram direct lane exceeded its wait limit.", "openclaw", "telegram-lane", "Use targeted log review and avoid Gateway restart until active work pressure is known."));
  }
  if (includesAny(combinedText, [/incomplete turn detected/i])) {
    issues.push(issue("approval_required", "telegram-direct-incomplete-turn", "Recent logs suggest an incomplete turn in the Telegram/direct conversation flow.", "mixed", "session-state", "Review the affected session state; do not delete transcripts automatically."));
  }
  if (
    includesAny(combinedText, [/agent:main:telegram:direct:\d+/i]) &&
    includesAny(combinedText, [/agent:main:telegram:direct:@[A-Za-z0-9_]+/i, /Telegram recipient @[A-Za-z0-9_]+ could not be resolved/i, /getChat failed.*chat not found/i, /Bad Request:\s*chat not found/i])
  ) {
    issues.push(issue(
      "approval_required",
      "telegram-direct-alias-routing-failure",
      "Recent logs or report text suggest the same Telegram user was split into numeric chat-id and @username direct sessions, and @username outbound resolution failed.",
      "openclaw",
      "telegram-session-routing",
      "Canonicalize Telegram direct sessions to numeric chat id, keep username as label metadata only, and clean stale alias sessions after backup and approval."
    ));
  }
  if (includesAny(combinedText, [/stalled session/i, /active_work_without_progress/i, /activeWorkKind=model_call/i, /lastProgressAge=\d+s/i, /abort_embedded_run/i, /stuck session recovery/i])) {
    issues.push(issue(
      "approval_required",
      "telegram-direct-stuck-model-call",
      "Recent logs or report text suggest a Telegram direct model call stayed processing without progress and was recovered as a stuck embedded run.",
      "openclaw",
      "session-lane",
      "Review active work pressure and affected session lane; abort/restart/cleanup only after approval."
    ));
  }
  if (includesAny(combinedText, [/\[Inter-session message\]/i, /sourceTool=sessions_send/i, /sessions_send/i])) {
    issues.push(issue("approval_required", "telegram-direct-routing-confusion", "Recent logs or session text suggest internal session handoff may be mixed with user-visible Telegram reply flow.", "beai", "delivery-contract", "Apply Telegram direct delivery safety contract only with approval if workspace instructions or runtime policy must change."));
  }
  if (
    includesAny(combinedText, [/final_answer/i, /private final/i, /internal final/i, /Final assistant text is not automatically delivered/i, /Codex internal/i, /내부 final/i]) &&
    includesAny(combinedText, [/Telegram/i, /telegram/i, /텔레그램/i, /source-channel/i, /visible send/i]) &&
    includesAny(combinedText, [/messageId\s*(?:없|missing|not found|없음)/i, /no\s+messageId/i, /no\s+message\(action=send\)/i, /message\(action=send\).*없/i, /visible send.*(?:없|missing|not)/i, /Telegram으로.*(?:나가지|발송되지|안 나)/i])
  ) {
    issues.push(issue(
      "approval_required",
      "beai-visible-delivery-contract-missing",
      "Report/log text suggests a Telegram direct completion was emitted as internal final_answer/private final without message(action=send) and Telegram messageId evidence.",
      "beai",
      "delivery-contract",
      "Patch BEAI runtime/Doctor delivery contract first: require visible send and messageId evidence before completion claims; treat OpenClaw restart as a secondary factor unless transport send failed."
    ));
  }
  if (
    includesAny(combinedText, [/telegram visible delivery candidate observed/i, /outbound telegram payload reached reply_payload_sending/i]) &&
    !includesAny(combinedText, [/telegram visible delivery verified/i, /visible_delivery_verified/i, /message_sent[\s\S]{0,200}messageId/i])
  ) {
    issues.push(issue(
      "approval_required",
      "beai-visible-delivery-candidate-not-verified",
      "BEAI live evidence shows a Telegram visible delivery candidate at reply_payload_sending, but no later message_sent/messageId verification in the observed evidence window.",
      "beai",
      "delivery-contract",
      "Keep completion state unverified until message_sent with messageId or an approved Telegram roundtrip is observed."
    ));
  }
  if (
    includesAny(combinedText, [/telegram visible delivery unverified/i, /message_sent hook observed without verified messageId/i, /messageId=missing/i]) &&
    !includesAny(combinedText, [/telegram visible delivery verified/i, /visible_delivery_verified/i])
  ) {
    issues.push(issue(
      "approval_required",
      "beai-visible-delivery-message-sent-unverified",
      "BEAI live evidence shows message_sent was observed, but success/messageId evidence did not close the delivery contract.",
      "mixed",
      "delivery-contract",
      "Separate BEAI payload/routing from OpenClaw Telegram provider delivery. Do not claim user-visible completion until messageId evidence exists."
    ));
  }
  const visibleProgressGap = detectVisibleProgressGap(checks.beaiLiveEvidence.output || "");
  const quickFirstStatusGap = detectQuickFirstStatusGap(checks.beaiLiveEvidence.output || "");
  const phaseTimingTelemetry = detectPhaseTimingTelemetry(checks.beaiLiveEvidence.output || "");
  if (
    includesAny(combinedText, [/telegram long-running visible progress gap observed/i, /visible_progress_contract_observed/i]) ||
    visibleProgressGap.detected ||
    (
      includesAny(combinedText, [/long-running.*visible progress/i, /진행.*보고.*비|visible update.*missing/i]) &&
      includesAny(combinedText, [/Telegram|telegram|텔레그램/i])
    )
  ) {
    issues.push(issue(
      "approval_required",
      "beai-long-running-visible-progress-missing",
      visibleProgressGap.detected
        ? `BEAI live evidence shows runtime/tool activity continued without a verified Telegram-visible progress update for about ${Math.round(visibleProgressGap.longestGapMs / 1000)}s (threshold ${Math.round(visibleProgressGap.thresholdMs / 1000)}s).`
        : "BEAI live evidence or report text suggests long-running Telegram-driven work had no periodic source-channel visible progress update.",
      "beai",
      "visible-progress-contract",
      "Keep the work state in-progress/unverified until a source-channel progress update or closeout messageId is observed. Design any automatic heartbeat sender as approval-gated external messaging."
    ));
  }
  if (
    includesAny(combinedText, [/telegram quick first status missing/i, /quick_first_status_contract_observed[\s\S]{0,300}missing/i]) ||
    quickFirstStatusGap.detected
  ) {
    issues.push(issue(
      "approval_required",
      "beai-quick-first-status-missing",
      quickFirstStatusGap.detected
        ? `BEAI live evidence shows a Telegram execution turn waited about ${Math.round(quickFirstStatusGap.longestGapMs / 1000)}s without a first visible status update (threshold ${Math.round(quickFirstStatusGap.thresholdMs / 1000)}s).`
        : "BEAI live evidence or report text suggests Telegram-driven work did not send a quick first visible status before deeper checks.",
      "beai",
      "speed-contract",
      "Keep the work in-progress/unverified and separate first visible status from slower deep checks. Any automatic first-status sender is an approval-gated external message feature."
    ));
  }
  if (
    includesAny(symptom, [/느려|느림|속도|지연|응답.*오래|멈춰|먹통|slow|latency|performance/i]) &&
    !phaseTimingTelemetry.observed
  ) {
    issues.push(issue(
      "approval_required",
      "beai-phase-timing-telemetry-missing",
      "The symptom is speed/latency related, but BEAI live evidence does not yet include runtime phase timing samples for separating prompt planning, tool execution, finalize, and Telegram delivery.",
      "beai",
      "speed-telemetry",
      "Record phase timing before deciding whether the owner is BEAI Runtime, OpenClaw runtime, model/tool execution, or Telegram delivery."
    ));
  }
  if (includesAny(combinedText, [/token_mismatch/i, /token mismatch/i, /auth token mismatch/i])) {
    issues.push(issue("approval_required", "gateway-token-mismatch", "Recent logs suggest Gateway token mismatch between service/UI/device auth state.", "openclaw", "gateway-auth", "Follow OpenClaw token rotation and UI/device synchronization procedure with approval."));
  }
  if (includesAny(combinedText, [/\blost tasks retained\b/i, /\bretained lost tasks\b/i])) {
    issues.push(issue("approval_required", "lost-tasks-retained", "OpenClaw reports retained lost tasks. This is usually task residue, not an immediate BEAI runtime failure, but it should be reviewed before cleanup.", "openclaw", "tasks", "Review before cleanup; do not delete transcripts/tasks automatically."));
  }
  if (includesAny(combinedText, [/reverse proxy headers are not trusted/i, /gateway\.trustedProxies is empty/i])) {
    issues.push(issue("approval_required", "gateway-security-warning-trusted-proxy", "OpenClaw reports a reverse proxy trusted-header warning. Keep local-only or configure trusted proxies with explicit approval.", "openclaw", "security", "OpenClaw security config change requires approval."));
  }
  if (includesAny(combinedText, [/message tool.*not allowed/i, /tool.*message.*denied/i, /cannot.*send.*message/i])) {
    issues.push(issue("approval_required", "message-tool-send-blocked", "Recent logs suggest outbound message tool permission or delivery failure. Review tool/channel permission before claiming Telegram repair.", "mixed", "message-tool", "Separate OpenClaw channel permission from BEAI response behavior."));
  }
  if (includesAny(combinedText, [/operator\.write/i, /pending scope upgrade/i, /scope upgrade request/i, /local CLI device/i])) {
    issues.push(issue("approval_required", "operator-write-scope-missing", "Recent logs or report text suggest the local CLI device lacked operator.write scope for message send verification.", "openclaw", "device-scope", "Add operator.write only through the OpenClaw device approval flow; do not silently expand device scope."));
  }
  if (includesAny(combinedText, [/hook registration missing name/i, /hook.*missing/i])) {
    issues.push(issue("approval_required", "beai-hook-registration-issue", "Recent logs suggest BEAI/OpenClaw hook registration mismatch.", "beai", "runtime-hooks", "Patch/reinstall BEAI Runtime only after approval."));
  }
  if (includesAny(combinedText, [/approval_required/i, /approval required/i, /승인/i]) && includesAny(combinedText, [/반복|same answer|same response|보류|cannot proceed/i])) {
    issues.push(issue("approval_required", "approval-or-surface-loop-suspected", "Recent logs may indicate repeated approval/surface-loop behavior. Review session state and BEAI surface guard before restarting services.", "beai", "response-surface", "Inspect BEAI response guard/session state; do not fix by deleting transcripts."));
  }
  if (includesAny(combinedText, [/provider:\s*openclaw/i, /model:\s*gateway-injected/i, /usage:\s*0/i, /gateway-injected/i])) {
    issues.push(issue("approval_required", "beai-gateway-injected-response-loop", "Recent logs or report text suggest final replies may be gateway-injected responses instead of real model outputs.", "beai", "reply-payload-rewrite", "Inspect BEAI reply rewrite hooks and prevent gateway-injected content from replacing real model replies."));
  }
  if (
    includesAny(combinedText, [/BEAI Doctor zip/i, /beai-doctor.*zip/i, /zip.*설치/i, /첨부.*설치/i, /install.*zip/i]) &&
    includesAny(combinedText, [/기억 후보/i, /memory candidate/i, /능력 사용 후보/i, /skill-use candidate/i, /설치\/점검 미수행/i, /install\/check.*not/i])
  ) {
    issues.push(issue(
      "approval_required",
      "beai-install-intent-lost",
      "Recent logs or report text suggest a zip attachment plus install/check request was handled as memory/skill candidate guidance instead of an install workflow.",
      "beai",
      "install-intent-routing",
      "Patch/reinstall BEAI Runtime so install/check zip requests are preserved before memory, skill-candidate, delegation, state hygiene, or recovery surfaces."
    ));
  }
  if (
    countMatches(combinedText, /현재 상태 안내입니다/g) >= 2 ||
    countMatches(combinedText, /멈춘 게 아니라 승인 대기 상태입니다/g) >= 2 ||
    (countMatches(combinedText, /approval_required/gi) >= 2 && includesAny(combinedText, [/same response|same answer|반복|뭘 입력하든|어떤 메시지/i]))
  ) {
    issues.push(issue("approval_required", "beai-canned-response-loop-signature", "Repeated canned status/approval surface text appears more than once in logs or supplied report.", "beai", "response-surface", "Inspect session state and BEAI response hooks; prevent canned state surfaces from replacing the model answer."));
  }
  if (includesAny(combinedText, [/hook:\s*reply_payload_sending/i, /reply_payload_sending/i, /beai hook:\s*reply_payload_sending/i, /rewriteReplyPayloadForTelegramUxState/i])) {
    issues.push(issue("approval_required", "beai-reply-payload-rewrite-hook-active", "Recent logs or report text suggest BEAI reply_payload_sending hook is active in the final reply path.", "beai", "runtime-hook", "Review whether this hook replaces payloads; prefer append or metadata-only behavior."));
  }
  if (includesAny(combinedText, [/telegram ux state guide added/i, /uxState:\s*gateway_restart_recovery/i, /gateway_restart_recovery/i, /internal_progress_surface/i, /renderTelegramUxStateGuide/i, /classifyTelegramUxState/i, /현재 상태 안내입니다/i])) {
    issues.push(issue("approval_required", "beai-ux-state-guide-replace-risk", "Recent logs or report text suggest BEAI UX state guide may replace normal user-facing replies.", "beai", "ux-state-guide", "Disable replace-mode UX guide behavior or convert it to append/metadata-only after approval."));
  }
  if (includesAny(combinedText, [/before_agent_reply\s+install guide override/i, /beai hook:\s*before_agent_reply/i, /install guide override/i])) {
    issues.push(issue("approval_required", "beai-before-agent-reply-override-active", "Recent logs or report text suggest before_agent_reply install/status guide override may preempt normal answers.", "beai", "runtime-hook", "Review override priority so user intent and real model replies are not displaced."));
  }
  if (
    includesAny(combinedText, [/:telegram:direct:/i, /telegram:direct/i, /agent:main:telegram:direct/i]) &&
    includesAny(combinedText, [/before_agent_reply/i]) &&
    includesAny(combinedText, [/recovery summary surface returned/i, /recovery escalation surface returned/i, /beai-recovery-summary/i, /beai-recovery-escalation/i]) &&
    includesAny(combinedText, [/stale/i, /previous message/i, /previous-turn/i, /previous turn/i, /이전 메시지/i, /이전 턴/i, /second[- ]turn/i, /두 번째/i, /normal user transcript/i, /not appended/i, /handled:\s*true/i])
  ) {
    issues.push(issue(
      "approval_required",
      "beai-telegram-direct-recovery-surface-stale-plan",
      "Recent logs or report text match the Telegram direct second-turn failure where BEAI before_agent_reply returned a recovery surface from a stale session plan instead of letting the model/delivery path continue.",
      "beai",
      "runtime-hook",
      "Patch/reinstall BEAI Runtime so Telegram direct recovery surfaces are observer-only and never return handled:true from stale session plans."
    ));
  }
  if (includesAny(combinedText, [/plugins\.allow is empty/i, /discovered non-bundled plugins may auto-load/i])) {
    issues.push(issue("approval_required", "plugins-allow-empty-autoload-risk", "Recent logs or report text suggest plugins.allow is empty and non-bundled plugins may auto-load.", "openclaw", "plugin-policy", "Set an explicit plugins.allow list only after approval and plugin inventory verification."));
  }
  if (openclawConfig.pluginsAllowEmpty) {
    issues.push(issue("approval_required", "plugins-allow-empty-autoload-risk", "OpenClaw config has plugins.allow as an empty list, so non-bundled plugins may auto-load depending on OpenClaw policy.", "openclaw", "plugin-policy", "Set an explicit plugins.allow list only after approval and plugin inventory verification."));
  }
  const hasSpecificRepeatedRootCause = issues.some((entry) => [
    "approval-or-surface-loop-suspected",
    "beai-gateway-injected-response-loop",
    "beai-reply-payload-rewrite-hook-active",
    "beai-ux-state-guide-replace-risk",
    "beai-before-agent-reply-override-active"
  ].includes(entry.code));
  if (symptomTags.includes("repeated_response") && !hasSpecificRepeatedRootCause) {
    if (deep) {
      issues.push(issue(
        "approval_required",
        "reported-repeated-response-not-reproduced-in-deep-check",
        "The user reports repeated/approval-like responses, but deep read-only checks did not find a direct repeated-response proof in the current probe window.",
        "beai",
        "response-surface",
        "Next step is targeted session/log window review or a controlled reproduction; do not restart Gateway as first action."
      ));
    } else {
      issues.push(issue(
        "approval_required",
        "reported-repeated-response-needs-deep-check",
        "The user reports repeated/approval-like responses, but fast checks did not prove the source. Run --deep and inspect recent logs/session state before repair.",
        "beai",
        "response-surface",
        "Use deep read-only diagnosis; do not restart Gateway as first action."
      ));
    }
  }
  const hasSpecificTelegramRootCause = issues.some((entry) => [
    "telegram-polling-instability",
    "gateway-ok-telegram-transport-stale",
    "telegram-channel-status-unavailable",
    "telegram-channel-connected-but-not-roundtrip-verified",
    "telegram-polling-threshold-too-low",
    "telegram-boot-network-recovery-window",
    "telegram-delivery-pending-not-failed",
    "telegram-direct-session-bloat-risk",
    "telegram-direct-lane-wait-exceeded",
    "telegram-direct-stuck-model-call",
    "telegram-direct-alias-routing-failure",
    "beai-visible-delivery-contract-missing",
    "beai-visible-delivery-candidate-not-verified",
    "beai-visible-delivery-message-sent-unverified",
    "beai-long-running-visible-progress-missing"
  ].includes(entry.code));
  if (symptomTags.includes("telegram_delivery") && !hasSpecificTelegramRootCause) {
    if (deep) {
      issues.push(issue(
        "approval_required",
        "reported-telegram-delivery-not-reproduced-in-deep-check",
        "The user reports Telegram delivery trouble, but deep read-only checks did not prove a current Telegram transport fault in the probe window.",
        "openclaw",
        "telegram-transport",
        "Next step is controlled inbound/outbound timestamp comparison or user-approved Telegram test send; do not restart Gateway as first action."
      ));
    } else {
      issues.push(issue(
        "approval_required",
        "reported-telegram-delivery-needs-deep-check",
        "The user reports Telegram delivery trouble, but fast checks did not prove a transport fault. Run --deep and verify inbound/outbound timestamps before repair.",
        "openclaw",
        "telegram-transport",
        "Use deep read-only diagnosis before any provider/Gateway restart."
      ));
    }
  }
  for (const helper of helpers) {
    if (!helper.exists) issues.push(issue("blocked", "missing-helper", helper.file, "beai", "installer-helper", "Cannot repair missing helper without package source."));
    else if (!helper.executable) issues.push(issue("auto_repairable", "helper-not-executable", helper.file, "beai", "installer-helper", "Safe to chmod existing helper executable bit."));
  }
  return issues;
}

function hasIssue(issues, code) {
  return issues.some((entry) => entry.code === code);
}

function buildIncidentAnalysis(issues, symptomTags, checks, supplementalText, openclawConfig) {
  const repeatedEvidence = [
    "beai-canned-response-loop-signature",
    "beai-gateway-injected-response-loop",
    "beai-reply-payload-rewrite-hook-active",
    "beai-ux-state-guide-replace-risk",
    "beai-before-agent-reply-override-active",
    "beai-telegram-direct-recovery-surface-stale-plan",
    "approval-or-surface-loop-suspected"
  ].filter((code) => hasIssue(issues, code));
  const telegramEvidence = [
    "beai-visible-delivery-contract-missing",
    "telegram-direct-sessions-current-failed",
    "telegram-direct-lane-wait-exceeded",
    "telegram-direct-incomplete-turn",
    "telegram-direct-alias-routing-failure",
    "telegram-direct-stuck-model-call",
    "telegram-direct-routing-confusion",
    "beai-telegram-direct-recovery-surface-stale-plan",
    "beai-visible-delivery-candidate-not-verified",
    "beai-visible-delivery-message-sent-unverified",
    "beai-long-running-visible-progress-missing",
    "telegram-polling-instability",
    "gateway-ok-telegram-transport-stale",
    "telegram-channel-status-unavailable",
    "telegram-channel-connected-but-not-roundtrip-verified",
    "telegram-polling-threshold-too-low",
    "telegram-boot-network-recovery-window",
    "telegram-delivery-pending-not-failed",
    "telegram-direct-session-bloat-risk",
    "telegram-diagnostic-in-operational-session-risk",
    "gateway-token-mismatch"
  ].filter((code) => hasIssue(issues, code));
  const telegramOperationalDelayEvidence = [
    "telegram-polling-instability",
    "gateway-ok-telegram-transport-stale",
    "telegram-channel-status-unavailable",
    "telegram-channel-connected-but-not-roundtrip-verified",
    "telegram-polling-threshold-too-low",
    "telegram-boot-network-recovery-window",
    "telegram-delivery-pending-not-failed",
    "telegram-direct-session-bloat-risk",
    "telegram-diagnostic-in-operational-session-risk",
    "telegram-direct-lane-wait-exceeded",
    "telegram-direct-stuck-model-call",
    "beai-long-running-visible-progress-missing"
  ].filter((code) => hasIssue(issues, code));
  const routingEvidence = [
    "beai-visible-delivery-contract-missing",
    "beai-visible-delivery-candidate-not-verified",
    "beai-visible-delivery-message-sent-unverified",
    "beai-long-running-visible-progress-missing",
    "telegram-direct-alias-routing-failure",
    "telegram-direct-routing-confusion",
    "telegram-direct-sessions-current-failed"
  ].filter((code) => hasIssue(issues, code));
  const installEvidence = [
    "beai-install-intent-lost",
    "runtime-version-metadata-stale",
    "operator-write-scope-missing"
  ].filter((code) => hasIssue(issues, code));
  const pluginLoadEvidence = [
    "plugins-allow-empty-autoload-risk",
    "beai-duplicate-runtime-load-risk",
    "runtime-version-metadata-stale"
  ].filter((code) => hasIssue(issues, code));
  const combinedText = collectDiagnosticText(checks, supplementalText);
  const realModelBypassEvidence = includesAny(combinedText, [/provider:\s*openclaw/i, /model:\s*gateway-injected/i, /usage:\s*0/i]);
  const directLoopTextEvidence = countMatches(combinedText, /현재 상태 안내입니다/g) >= 2 || countMatches(combinedText, /gateway-injected/gi) >= 2;
  const repeatedStatus =
    repeatedEvidence.length >= 2 || realModelBypassEvidence || directLoopTextEvidence
      ? "likely"
      : repeatedEvidence.length === 1
        ? "suspected"
      : symptomTags.includes("repeated_response")
        ? "suspected"
        : "not_observed";
  const telegramStatus =
    telegramEvidence.length >= 2
      ? "likely"
      : telegramEvidence.length === 1 || symptomTags.includes("telegram_delivery")
        ? "suspected"
        : "not_observed";
  return {
    repeatedResponseLoop: {
      status: repeatedStatus,
      confidence:
        repeatedStatus === "likely" ? "high" :
        repeatedStatus === "suspected" ? "medium" :
        "low",
      evidenceCodes: repeatedEvidence,
      likelyLayer: repeatedEvidence.includes("beai-telegram-direct-recovery-surface-stale-plan")
        ? "BEAI Runtime before_agent_reply stale-plan guard"
        : repeatedEvidence.some((code) => code.startsWith("beai-")) ? "BEAI Runtime reply hooks / response surface" : "session or approval surface",
      userMeaning:
        repeatedEvidence.includes("beai-telegram-direct-recovery-surface-stale-plan")
          ? "사용자의 두 번째 턴이 실제 모델 답변으로 이어지기 전에 BEAI 복구 표면이 끼어든 증거가 있습니다. 같은 문구 반복이 직접 보이지 않아도 답변 경로 가로채기 위험으로 봅니다."
          :
        repeatedStatus === "likely"
          ? "사용자가 뭘 입력해도 같은 답이 나온 문제는 실제 모델 답변보다 상태 안내/응답 hook이 앞선 사건으로 볼 가능성이 큽니다."
          : repeatedStatus === "suspected"
            ? "사용자 증상은 반복 응답이지만 현재 읽은 증거만으로는 어느 hook/세션이 원인인지 더 좁혀야 합니다."
            : "현재 읽은 범위에서는 반복 응답 사건 증거가 직접 보이지 않습니다.",
      repairPath: [
        "gateway-injected / usage:0 / canned surface 반복 여부를 먼저 확인",
        "BEAI reply hook이 replace가 아니라 append/metadata-only인지 확인",
        "중복 BEAI Runtime 또는 plugins.allow empty로 예전 hook이 로드되는지 확인",
        "수정이 필요하면 BEAI Runtime 교체 또는 plugin allowlist 정리는 사용자 승인 후 진행",
        "수리 후 실제 모델 응답(provider/model/usage)과 Telegram 일반 대화 1~2턴으로 확인"
      ]
    },
    telegramSecondTurnDrop: {
      status: telegramStatus,
      confidence:
        telegramStatus === "likely" ? "high" :
        telegramStatus === "suspected" ? "medium" :
        "low",
      evidenceCodes: telegramEvidence,
      likelyLayer: telegramEvidence.includes("beai-telegram-direct-recovery-surface-stale-plan")
        ? "BEAI Runtime before_agent_reply / Telegram direct delivery contract"
        : telegramEvidence.includes("beai-visible-delivery-contract-missing")
          ? "BEAI Package visible delivery contract"
        : telegramEvidence.includes("telegram-direct-alias-routing-failure")
          ? "OpenClaw Telegram direct session canonicalization"
        : telegramEvidence.includes("telegram-direct-stuck-model-call")
          ? "OpenClaw session lane / stuck model call recovery"
        : telegramEvidence.some((code) => code.includes("sessions") || code.includes("lane") || code.includes("incomplete")) ? "OpenClaw session/channel lane" : "Telegram/Gateway transport",
      userMeaning:
        telegramEvidence.includes("telegram-direct-alias-routing-failure")
          ? "같은 텔레그램 사용자가 숫자 ID 세션과 @username 세션으로 갈라져 답변 target이 실패했을 가능성이 큽니다."
          :
        telegramEvidence.includes("beai-visible-delivery-contract-missing")
          ? "작업 완료 보고가 내부 final_answer로만 닫히고 Telegram messageId가 없어, 사용자는 텔레그램 먹통처럼 느꼈을 가능성이 큽니다."
          :
        telegramEvidence.includes("telegram-direct-stuck-model-call")
          ? "이전 모델 호출이 오래 processing 상태로 남아 다음 텔레그램 메시지가 정상 흐름으로 이어지지 않았을 가능성이 큽니다."
          :
        telegramStatus === "likely"
          ? "첫 메시지는 되는데 두 번째부터 막히는 문제는 세션 current 해석, lane 대기, incomplete turn 쪽을 먼저 봐야 합니다."
          : telegramStatus === "suspected"
            ? "텔레그램 문제 제보는 있지만 현재 증거만으로는 transport인지 session lane인지 더 좁혀야 합니다."
            : "현재 읽은 범위에서는 텔레그램 두 번째 턴 누락 증거가 직접 보이지 않습니다.",
      repairPath: [
        "세션 current resolve 실패, lane wait exceeded, incomplete turn 흔적 확인",
        "numeric chat id와 @username direct session이 동시에 존재하는지 확인",
        "stuck model_call / active_work_without_progress / abort_embedded_run 흔적 확인",
        "작업 압력 queued/running 여부 확인",
        "BEAI stale recovery surface 증거가 있으면 Gateway 재시작보다 Runtime hook guard 교체를 먼저 검토",
        "Gateway 재시작은 첫 조치로 하지 않음",
        "필요 시 사용자 승인 후 provider/Gateway 재시작 또는 세션 위생 조치",
        "수리 후 새 세션 강제 테스트 대신 사용자의 자연 대화에서 두 번째 턴 응답 여부 확인"
      ]
    },
    telegramOperationalDelay: {
      status:
        telegramOperationalDelayEvidence.length >= 2 ? "likely" :
        telegramOperationalDelayEvidence.length === 1 ? "suspected" :
        "not_observed",
      confidence:
        telegramOperationalDelayEvidence.length >= 2 ? "high" :
        telegramOperationalDelayEvidence.length === 1 ? "medium" :
        "low",
      evidenceCodes: telegramOperationalDelayEvidence,
      likelyLayer:
        telegramOperationalDelayEvidence.includes("telegram-direct-session-bloat-risk") ||
        telegramOperationalDelayEvidence.includes("telegram-diagnostic-in-operational-session-risk")
          ? "OpenClaw Telegram direct session/lane load"
          : telegramOperationalDelayEvidence.includes("gateway-ok-telegram-transport-stale") ||
            telegramOperationalDelayEvidence.includes("telegram-channel-status-unavailable") ||
            telegramOperationalDelayEvidence.includes("telegram-channel-connected-but-not-roundtrip-verified")
            ? "OpenClaw Telegram channel transport / roundtrip evidence"
          : telegramOperationalDelayEvidence.includes("telegram-polling-threshold-too-low") ||
            telegramOperationalDelayEvidence.includes("telegram-boot-network-recovery-window")
            ? "OpenClaw Telegram transport/watchdog"
            : telegramOperationalDelayEvidence.includes("telegram-delivery-pending-not-failed")
              ? "Telegram delivery state interpretation"
              : "not_observed",
      userMeaning:
        telegramOperationalDelayEvidence.includes("telegram-delivery-pending-not-failed")
          ? "메시지는 OpenClaw에 들어와 처리 중이었고, 관찰 시점에 최종 발송 완료만 아직 확인되지 않았을 가능성이 있습니다. 이 경우는 전송 실패와 구분해야 합니다."
          : telegramOperationalDelayEvidence.includes("gateway-ok-telegram-transport-stale")
            ? "Gateway는 살아 있어도 Telegram transport activity가 오래 멈추면 사용자는 텔레그램에서 먹통으로 느낍니다. 이제 BEAI Doctor는 Gateway 정상만으로 healthy를 닫지 않습니다."
          : telegramOperationalDelayEvidence.includes("telegram-channel-connected-but-not-roundtrip-verified")
            ? "Telegram running/connected 표시가 있어도 실제 inbound/outbound 왕복 증거가 없으면 완전 정상으로 보지 않습니다."
          : telegramOperationalDelayEvidence.includes("telegram-direct-session-bloat-risk")
            ? "Telegram direct 세션이나 같은 lane의 작업이 커져 응답이 늦어졌을 가능성이 있습니다. 사용자는 두 번째 메시지부터 멈춘 것처럼 느낄 수 있습니다."
            : telegramOperationalDelayEvidence.includes("telegram-boot-network-recovery-window")
              ? "부팅/네트워크 복귀 직후 Telegram Bot API 연결이 잠시 불안정했던 흔적입니다. BEAI 응답 바꿔치기와는 다른 계층입니다."
              : telegramOperationalDelayEvidence.length
                ? "Telegram 운영 지연 증거가 있으므로 transport, session lane, delivery state를 분리해서 봐야 합니다."
                : "현재 읽은 범위에서는 Telegram 운영 지연 증거가 직접 보이지 않습니다.",
      repairPath: [
        "message.received / queued / run_started / delivery.completed 타임라인을 먼저 분리",
        "delivery.completed가 늦은 경우 실패가 아니라 처리 지연으로 안내",
        "timeoutSeconds와 pollingStallThresholdMs 비율 확인",
        "Telegram direct 세션 크기와 long-running active work 확인",
        "운영 세션에서 진단 로그/도구 호출을 계속 쌓지 않도록 진단 세션 분리 권고",
        "세션 compact/new-session handoff, config edit, provider/Gateway restart는 승인 후 진행"
      ]
    },
    telegramRoutingContract: {
      status: routingEvidence.length ? "attention_required" : "clean_or_not_observed",
      confidence:
        routingEvidence.includes("telegram-direct-alias-routing-failure") ? "high" :
        routingEvidence.length ? "medium" :
        "low",
      evidenceCodes: routingEvidence,
      likelyLayer:
        routingEvidence.includes("telegram-direct-alias-routing-failure")
          ? "OpenClaw Telegram direct canonical session key"
          : routingEvidence.includes("beai-visible-delivery-contract-missing")
            ? "BEAI Package visible delivery closeout contract"
          : routingEvidence.includes("telegram-direct-routing-confusion")
            ? "BEAI/OpenClaw delivery contract"
            : "OpenClaw session resolution",
      userMeaning:
        routingEvidence.includes("telegram-direct-alias-routing-failure")
          ? "텔레그램 한 대화창이 OpenClaw 내부에서 숫자 ID 세션과 @username 세션으로 나뉘면 답변이 다른 곳으로 가거나 실패할 수 있습니다."
          : routingEvidence.includes("beai-visible-delivery-contract-missing")
            ? "내부 완료 응답과 Telegram 사용자-visible 메시지를 같은 것으로 보면 실제 메시지가 안 간 상태를 완료로 오판할 수 있습니다."
          : routingEvidence.length
            ? "Telegram direct reply와 내부 세션 전달 경로가 섞일 수 있어 canonical target을 확인해야 합니다."
            : "현재 읽은 범위에서는 direct session alias 분기 증거가 직접 보이지 않습니다.",
      repairPath: [
        "direct session key는 numeric chat id를 canonical로 사용",
        "username은 session key가 아니라 label metadata로만 유지",
        "@username outbound 실패 흔적이 있으면 alias session cleanup 후보로 분리",
        "sessions.json 또는 session store 변경은 백업과 승인 후 진행",
        "수리 후 outbound target이 telegram:<numericChatId>인지 확인"
      ]
    },
    installIntentIntegrity: {
      status: installEvidence.length ? "attention_required" : "clean_or_not_observed",
      evidenceCodes: installEvidence,
      userMeaning:
        installEvidence.includes("beai-install-intent-lost")
          ? "첨부 zip 설치/점검 요청이 실제 설치 흐름으로 보존되지 않고 다른 후보 표면으로 밀린 흔적이 있습니다."
          : installEvidence.includes("runtime-version-metadata-stale")
            ? "실제 런타임 버전과 OpenClaw 기록 버전이 달라 운영자가 상태를 잘못 판단할 수 있습니다."
            : installEvidence.includes("operator-write-scope-missing")
              ? "설치 후 텔레그램 전송 검증을 하려 해도 local CLI 권한이 부족해 테스트가 막힐 수 있습니다."
              : "현재 읽은 범위에서는 설치 intent 무결성 문제가 직접 보이지 않습니다.",
      repairPath: [
        "zip attachment + 설치/점검 요청은 memory/skill candidate보다 install workflow로 우선 보존",
        "loaded version, recorded version, sourcePath, package version을 모두 비교",
        "metadata stale 수정은 approval_required로 백업 후 진행",
        "operator.write scope 확장은 OpenClaw device approval flow를 통해서만 진행"
      ]
    },
    pluginLoadHygiene: {
      status: pluginLoadEvidence.length ? "attention_required" : "clean_or_not_observed",
      evidenceCodes: pluginLoadEvidence,
      configSeen: {
        openclawConfigExists: Boolean(openclawConfig.exists),
        pluginsAllowEmpty: Boolean(openclawConfig.pluginsAllowEmpty),
        duplicateBeaiPaths: Boolean(openclawConfig.duplicateBeaiPaths),
        beaiLoadPathCount: (openclawConfig.beaiLoadPaths || []).length
      },
      repairPath: [
        "BEAI Runtime load path를 하나로 줄이는지 확인",
        "plugins.allow가 비어 있으면 신뢰 플러그인 목록을 승인 후 고정",
        "실제 loaded version과 recorded version 차이는 설치 메타데이터 정리 후보로 분리",
        "이 조치들은 config/metadata에 닿을 수 있으므로 자동 수리하지 않음"
      ]
    }
  };
}

function buildOperationalReliability(issues, checks, helpers, openclawConfig) {
  const hasCode = (code) => hasIssue(issues, code);
  const pluginListText = checks.pluginsList.output || "";
  const pluginInspectText = checks.pluginInspectBeai.output || "";
  const gatewayText = `${checks.gatewayStatus.output || ""}\n${checks.gatewayHealth.output || ""}`;
  const telegramText = `${checks.status.output || ""}\n${checks.gatewayStatus.output || ""}\n${checks.gatewayHealth.output || ""}\n${checks.channelsStatus.output || ""}`;
  const liveEvidenceText = checks.beaiLiveEvidence.output || "";
  const verifiedTelegramMessageId =
    includesAny(liveEvidenceText, [/telegram visible delivery verified/i, /visible_delivery_verified/i]) &&
    includesAny(liveEvidenceText, [/messageId["':=\s]+[^"',}\s]+/i, /messageId:\s*[^,\s]+/i]);
  const requiredHelpersReady = helpers.every((helper) => helper.exists);
  const beaiConfigured = Boolean((openclawConfig.beaiLoadPaths || []).length);
  const beaiRegistered =
    checks.pluginsList.ok &&
    (/BEAI Runtime/i.test(pluginListText) || /beai-\s*runtime/i.test(pluginListText) || /beai-runtime/i.test(pluginListText));
  const routeVisible =
    checks.pluginInspectBeai.ok &&
    (/Source:\s*.+beai-runtime\/dist\/index\.js/i.test(pluginInspectText) || /Source path:\s*.+beai-runtime/i.test(pluginInspectText));
  const permissionAllowed =
    checks.hooks.ok &&
    !hasCode("operator-write-scope-missing") &&
    !hasCode("gateway-token-mismatch");
  const callable =
    checks.pluginsDoctor.ok &&
    checks.hooks.ok &&
    checks.gatewayStatus.ok &&
    checks.gatewayHealth.ok &&
    checks.channelsStatus.ok &&
    !hasCode("beai-runtime-inspect-failed") &&
    !hasCode("hooks-not-ready");
  const callSucceeded =
    callable &&
    /Status:\s*loaded/i.test(pluginInspectText) &&
    /Version:\s*\d+\.\d+\.\d+/i.test(pluginInspectText);
  const outputVerified =
    callSucceeded &&
    /Telegram\s*:?\s*(?:ON|OK|default|configured|running|connected)/i.test(telegramText) &&
    !hasCode("beai-gateway-injected-response-loop") &&
    !hasCode("beai-canned-response-loop-signature") &&
    !hasCode("beai-install-intent-lost") &&
    !hasCode("telegram-delivery-pending-not-failed") &&
    !hasCode("telegram-direct-session-bloat-risk") &&
    !hasCode("telegram-polling-instability") &&
    !hasCode("gateway-ok-telegram-transport-stale") &&
    !hasCode("telegram-channel-status-unavailable") &&
    !hasCode("telegram-channel-connected-but-not-roundtrip-verified") &&
    !hasCode("telegram-boot-network-recovery-window") &&
    !hasCode("beai-visible-delivery-contract-missing") &&
    !hasCode("beai-visible-delivery-candidate-not-verified") &&
    !hasCode("beai-visible-delivery-message-sent-unverified") &&
    !hasCode("beai-quick-first-status-missing") &&
    !hasCode("beai-phase-timing-telemetry-missing") &&
    !hasCode("beai-long-running-visible-progress-missing") &&
    (
      verifiedTelegramMessageId ||
      !includesAny(liveEvidenceText, [/telegram visible delivery candidate observed/i, /telegram visible delivery unverified/i, /delivery_contract_observed/i, /visible_progress_contract_observed/i])
    );
  const makeStage = (stage, ok, evidence, unchecked = false) => ({
    stage,
    ok: Boolean(ok),
    status: unchecked ? "not_checked" : ok ? "ok" : "fail",
    evidence
  });
  const stageChecks = [
    makeStage("configured", beaiConfigured, beaiConfigured ? `BEAI load paths: ${(openclawConfig.beaiLoadPaths || []).length}` : "No BEAI load path found in OpenClaw config"),
    makeStage("registered", beaiRegistered, beaiRegistered ? "BEAI Runtime appears in OpenClaw plugins list" : "BEAI Runtime not visible in plugins list"),
    makeStage("route_visible", routeVisible, routeVisible ? "plugin inspect shows BEAI Runtime source route" : "plugin source route not confirmed"),
    makeStage("permission_allowed", permissionAllowed, permissionAllowed ? "hooks ready and no operator/token permission blocker detected" : "permission/token/hook blocker detected or hooks not ready"),
    makeStage("callable", callable, callable ? "plugins doctor, hooks, gateway status, and gateway health are callable" : "one or more callable probes failed"),
    makeStage("call_succeeded", callSucceeded, callSucceeded ? "BEAI Runtime inspect reports loaded with version" : "loaded runtime call not confirmed"),
    makeStage("output_verified", outputVerified, outputVerified ? "Telegram/channel surface is configured and any observed Telegram completion has messageId evidence" : "final user-visible output remains unverified, missing messageId evidence, or risk was detected")
  ];
  const firstFailedStage = stageChecks.find((stage) => !stage.ok)?.stage || null;
  const cleanupStatus = issues.some((entry) => [
    "lost-tasks-retained",
    "telegram-direct-incomplete-turn",
    "telegram-direct-stuck-model-call",
    "telegram-direct-session-bloat-risk",
    "telegram-diagnostic-in-operational-session-risk",
    "beai-continuity-residue-risk"
  ].includes(entry.code)) ? "cleanup_pending" : "cleanup_complete";
  const retryStatus =
    hasCode("beai-gateway-injected-response-loop") ||
    hasCode("beai-canned-response-loop-signature") ||
    hasCode("telegram-direct-stuck-model-call") ||
    hasCode("telegram-delivery-pending-not-failed")
      ? "retry_blocked"
      : "retry_allowed";
  const approvalStatus = issues.some((entry) => entry.severity === "approval_required") ? "approval_required" : "not_required";
  const blockedStatus = issues.some((entry) => entry.severity === "blocked") ? "blocked" : null;
  const verificationStatus =
    blockedStatus ||
    (firstFailedStage ? "partial" : "output_verified");
  return {
    standard: "BEAI Operational Reliability Standard",
    stageModel: [
      "configured",
      "registered",
      "route_visible",
      "permission_allowed",
      "callable",
      "call_succeeded",
      "output_verified"
    ],
    stageChecks,
    firstFailedStage,
    verificationStatus,
    failureClosure: {
      status: verificationStatus,
      cleanup: cleanupStatus,
      retry: retryStatus,
      approval: approvalStatus
    },
    routeBoundaries: {
      internalOnly: "not_deeply_checked",
      externalRoute: deep ? "checked_by_status_or_logs" : "not_checked_fast_mode",
      loadBalancerOrProxy: hasCode("gateway-security-warning-trusted-proxy") ? "attention_required" : "not_observed",
      telegramDirectCanonical: hasCode("telegram-direct-alias-routing-failure") ? "attention_required" : "clean_or_not_observed",
      telegramDeliveryState: hasCode("telegram-delivery-pending-not-failed") ? "pending_not_failed" : "clean_or_not_observed",
      telegramSessionLoad: hasCode("telegram-direct-session-bloat-risk") ? "attention_required" : "clean_or_not_observed",
      telegramPollingWatchdog: hasCode("telegram-polling-threshold-too-low") ? "attention_required" : "clean_or_not_observed",
      telegramTransportFreshness: hasCode("gateway-ok-telegram-transport-stale") ? "attention_required" : hasCode("telegram-channel-status-unavailable") ? "not_verified" : "clean_or_not_observed",
      telegramRoundtripEvidence: hasCode("telegram-channel-connected-but-not-roundtrip-verified") ? "connected_but_not_roundtrip_verified" : "clean_or_not_observed",
      mcpEndpointVisibility: "not_checked_by_beai_doctor"
    },
    documentCodeConfigManifest: {
      status: "release_verifier_required",
      note: "BEAI Doctor reports live operation state. Release package consistency must be checked by BEAI Release Verifier."
    },
    dependencyDrift: {
      status: /Update\s+available/i.test(checks.status.output || "") ? "update_available" : "not_observed",
      note: "Dependency drift is report-only unless it affects runtime, security, or channel reliability."
    },
    helperIntegrity: {
      requiredHelpersReady,
      missingHelpers: helpers.filter((helper) => !helper.exists).map((helper) => helper.file),
      nonExecutableHelpers: helpers.filter((helper) => helper.exists && !helper.executable).map((helper) => helper.file)
    }
  };
}

function mapDoctorStageToFlowStateEvidence(stageChecks, verificationStatus) {
  const stageByName = new Map((stageChecks || []).map((stage) => [stage.stage, stage]));
  const toState = (stageName) => {
    const stage = stageByName.get(stageName);
    if (!stage) return "unknown";
    if (stage.status === "not_checked") return "unknown";
    return stage.ok ? "verified" : "blocked";
  };
  const outputStage = stageByName.get("output_verified");
  return {
    configured: toState("configured"),
    registered: toState("registered"),
    callable: toState("callable"),
    outputVerified: outputStage?.ok ? "verified" : outputStage ? "unverified" : "unknown",
    doctor: verificationStatus === "blocked" ? "blocked" : verificationStatus === "output_verified" ? "verified" : "review",
    release: "review"
  };
}

function buildDoctorFlowSummary(operationalReliability) {
  const evidenceState = mapDoctorStageToFlowStateEvidence(
    operationalReliability.stageChecks,
    operationalReliability.verificationStatus
  );
  return {
    source: "beai-doctor",
    status_language: "flow_state_evidence_v0_1",
    evidenceState,
    firstFailedStage: operationalReliability.firstFailedStage,
    verificationStatus: operationalReliability.verificationStatus,
    releaseBoundary: operationalReliability.documentCodeConfigManifest?.status || "release_verifier_required",
    userMeaning: operationalReliability.firstFailedStage
      ? `BEAI Doctor has not verified ${operationalReliability.firstFailedStage}; do not claim full output verification.`
      : "BEAI Doctor evidence reaches output_verified; release readiness still requires Release Verifier."
  };
}

function buildSpeedReliability(checks) {
  const liveEvidenceText = checks.beaiLiveEvidence.output || "";
  const quickFirstStatus = detectQuickFirstStatusGap(liveEvidenceText);
  const phaseTiming = detectPhaseTimingTelemetry(liveEvidenceText);
  const visibleProgress = detectVisibleProgressGap(liveEvidenceText);
  return {
    standard: "BEAI Speed Reliability Standard",
    quickFirstStatus: {
      status: quickFirstStatus.detected ? "gap_observed" : quickFirstStatus.openedCount ? "contract_open" : "not_observed",
      thresholdMs: quickFirstStatus.thresholdMs,
      openedCount: quickFirstStatus.openedCount,
      missingCount: quickFirstStatus.missingCount,
      longestGapMs: quickFirstStatus.longestGapMs,
      userMeaning: quickFirstStatus.detected
        ? "작업 시작 후 첫 진행 신호가 늦어 사용자가 멈춤처럼 느낄 수 있습니다."
        : "최근 evidence에서 첫 진행 신호 공백 문제는 확인되지 않았습니다."
    },
    phaseTiming: {
      status: phaseTiming.observed ? "observed" : "not_observed",
      eventCount: phaseTiming.eventCount,
      phases: phaseTiming.phases,
      maxElapsedMs: phaseTiming.maxElapsedMs,
      userMeaning: phaseTiming.observed
        ? "응답 지연을 planning/tool/finalize/delivery 구간으로 나눠 볼 evidence가 있습니다."
        : "응답 지연 원인을 구간별로 나눠 볼 timing evidence가 아직 없습니다."
    },
    visibleProgress: {
      status: visibleProgress.detected ? "gap_observed" : "not_observed",
      thresholdMs: visibleProgress.thresholdMs,
      longestGapMs: visibleProgress.longestGapMs,
      userMeaning: visibleProgress.detected
        ? "긴 작업 중 Telegram visible progress 공백이 감지되었습니다."
        : "최근 evidence에서 긴 작업 진행 공백 문제는 확인되지 않았습니다."
    }
  };
}

function autoRepair(root, issues) {
  const actions = [];
  const reportDir = process.env.BEAI_DOCTOR_REPORT_DIR || path.join(os.tmpdir(), "beai-doctor-report");
  fs.mkdirSync(reportDir, { recursive: true });
  actions.push({ code: "report-dir-created", target: reportDir });
  for (const issue of issues) {
    if (issue.code === "helper-not-executable" && root) {
      const file = path.join(root, issue.detail);
      if (exists(file)) {
        fs.chmodSync(file, fs.statSync(file).mode | 0o755);
        actions.push({ code: "chmod-helper", target: issue.detail });
      }
    }
  }
  return actions;
}

function buildApprovalRequests(issues) {
  return issues
    .filter((entry) => entry.severity === "approval_required")
    .map((entry) => ({
      code: entry.code,
      owner: entry.owner,
      layer: entry.layer,
      title: entry.approvalExplanation.title,
      whatThisMeans: entry.approvalExplanation.plain,
      whyApprovalIsNeeded: entry.approvalExplanation.approvalNeeded,
      recommendedAction: entry.recommendedAction
    }));
}

async function buildReport(apply = false) {
  const root = findBeaiLayerRoot(cwd);
  const helpers = helperStatus(root);
  const checks = await commandChecks();
  const symptomTags = classifySymptom(symptom);
  const supplementalText = [symptom, readTextFileSafe(logFile)].filter(Boolean).join("\n");
  const openclawConfig = readOpenClawConfigSafe();
  const issues = classify(checks, helpers, symptomTags, supplementalText, openclawConfig);
  const autoRepairable = issues.filter((issue) => issue.severity === "auto_repairable");
  const approvalRequired = issues.filter((issue) => issue.severity === "approval_required");
  const blocked = issues.filter((issue) => issue.severity === "blocked");
  const actions = apply ? autoRepair(root, autoRepairable) : [];
  const approvalRequests = buildApprovalRequests(issues);
  const byOwner = {
    beai: issues.filter((issue) => issue.owner === "beai").map((issue) => issue.code),
    openclaw: issues.filter((issue) => issue.owner === "openclaw").map((issue) => issue.code),
    mixed: issues.filter((issue) => issue.owner === "mixed").map((issue) => issue.code)
  };
  const operationalReliability = buildOperationalReliability(issues, checks, helpers, openclawConfig);
  const flowSummary = buildDoctorFlowSummary(operationalReliability);
  return {
    tool: "beai-doctor",
    mode,
    deep,
    includeOpenClawDoctor,
    symptom,
    symptomTags,
    logFile: logFile || null,
    supplementalLogLoaded: Boolean(supplementalText),
    cwd,
    beaiLayerRoot: root,
    status:
      blocked.length ? "blocked" :
      approvalRequired.length ? "approval_required" :
      autoRepairable.length && !apply ? "auto_repair_available" :
      autoRepairable.length && apply ? "repaired_low_risk" :
      "healthy",
    ownership: {
      beaiDoctorOwns: ["BEAI Runtime/plugin/hooks", "BEAI installer/package helpers", "BEAI skill pack readiness", "BEAI response-surface/session hygiene interpretation"],
      openclawDoctorOwns: ["OpenClaw core/config/migrations", "daemon/service policy", "auth/device pairing/security", "gateway/channel primitives", "workspace basics"],
      currentIssueOwners: byOwner
    },
    helpers,
    issues,
    approvalRequests,
    actions,
    checks: {
      status: checks.status.skipped ? "skipped" : checks.status.ok,
      openclawDoctor: checks.openclawDoctor.skipped ? "skipped" : checks.openclawDoctor.ok,
      pluginsList: checks.pluginsList.ok,
      pluginInspectBeai: checks.pluginInspectBeai.ok,
      pluginsDoctor: checks.pluginsDoctor.ok,
      hooks: checks.hooks.ok,
      tasks: checks.tasks.skipped ? "skipped" : checks.tasks.ok,
      skillsList: checks.skillsList.ok,
      gatewayStatus: checks.gatewayStatus.ok,
      gatewayHealth: checks.gatewayHealth.ok,
      channelsStatus: checks.channelsStatus.ok,
      gatewayStability: checks.gatewayStability.skipped ? "skipped" : checks.gatewayStability.ok,
      devicesList: checks.devicesList.skipped ? "skipped" : checks.devicesList.ok,
      sessionsActive: checks.sessionsActive.skipped ? "skipped" : checks.sessionsActive.ok,
      recentLogs: checks.recentLogs.skipped ? "skipped" : checks.recentLogs.ok
    },
    operationalReliability,
    flowStateEvidence: flowSummary.evidenceState,
    flowSummary,
    speedReliability: buildSpeedReliability(checks),
    incidentAnalysis: buildIncidentAnalysis(issues, symptomTags, checks, supplementalText, openclawConfig),
    openclawConfigSummary: {
      exists: Boolean(openclawConfig.exists),
      pluginsAllowEmpty: Boolean(openclawConfig.pluginsAllowEmpty),
      duplicateBeaiPaths: Boolean(openclawConfig.duplicateBeaiPaths),
      beaiLoadPathCount: (openclawConfig.beaiLoadPaths || []).length,
      telegramConfigured: Boolean(openclawConfig.telegramConfigured),
      telegramSettings: openclawConfig.telegramSettings || {}
    },
    repairPolicy: {
      gatewayTouched: false,
      gatewayRestarted: false,
      telegramSettingsChanged: false,
      defaultMode: "fast-read-only",
      deepMode: "use --deep for logs, sessions, devices, and stability diagnostics",
      openclawDoctorMode: "use --include-openclaw-doctor only for core/config/service integrity findings; BEAI Doctor does not run OpenClaw repair automatically",
      autoRepairScope: ["report-dir", "installer-helper-executable-bit"],
      approvalRequiredFor: ["gateway-restart", "provider-restart", "config-edit", "runtime-reinstall", "telegram-test-send", "session-delete", "process-kill"]
    },
    elapsedMs: Date.now() - startedAt
  };
}

async function main() {
  let report;
  if (mode === "wake-guard") {
    report = await runWakeGuard();
  } else if (mode === "check" || mode === "repair-plan" || mode === "verify") {
    report = await buildReport(false);
  } else if (mode === "auto-repair") {
    report = await buildReport(true);
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(2);
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    if (report.mode === "wake-guard") {
      console.log(`BEAI Doctor Wake Guard: ${report.status}`);
      console.log(`Self-heal: ${report.selfHeal ? "on" : "off"}`);
      console.log(`Gateway restarted: ${report.gatewayRestarted ? "yes" : "no"}`);
      console.log(`Action: ${report.action || "none"}`);
      console.log(`Before probe healthy: ${report.before && report.before.probe ? report.before.probe.healthy : "unknown"}`);
      if (report.after) console.log(`After probe healthy: ${report.after.probe ? report.after.probe.healthy : "unknown"}`);
      return;
    }
    console.log(`BEAI Doctor: ${report.status}`);
    console.log(`BEAI Layer root: ${report.beaiLayerRoot || "not found"}`);
    if (report.symptomTags.length) console.log(`Symptom tags: ${report.symptomTags.join(", ")}`);
    console.log(`Issue owners: BEAI=${report.ownership.currentIssueOwners.beai.length}, OpenClaw=${report.ownership.currentIssueOwners.openclaw.length}, Mixed=${report.ownership.currentIssueOwners.mixed.length}`);
    console.log(`Repeated response incident: ${report.incidentAnalysis.repeatedResponseLoop.status} (${report.incidentAnalysis.repeatedResponseLoop.confidence})`);
    console.log(`Telegram second-turn incident: ${report.incidentAnalysis.telegramSecondTurnDrop.status} (${report.incidentAnalysis.telegramSecondTurnDrop.confidence})`);
    console.log(`Telegram operational delay: ${report.incidentAnalysis.telegramOperationalDelay.status} (${report.incidentAnalysis.telegramOperationalDelay.confidence})`);
    console.log(`Plugin load hygiene: ${report.incidentAnalysis.pluginLoadHygiene.status}`);
    for (const issue of report.issues) {
      console.log(`- ${issue.severity}: ${issue.code} [${issue.owner}/${issue.layer}] ${issue.detail || ""}`);
    }
    if (report.approvalRequests.length) {
      console.log("Approval explanations:");
      for (const request of report.approvalRequests) {
        console.log(`* ${request.title}`);
        console.log(`  - 의미: ${request.whatThisMeans}`);
        console.log(`  - 승인 필요 이유: ${request.whyApprovalIsNeeded}`);
      }
    }
    for (const action of report.actions) {
      console.log(`+ ${action.code}: ${action.target}`);
    }
  }

  if (report.status === "blocked") process.exitCode = 2;
}

main().catch((error) => {
  console.error(`BEAI Doctor failed: ${error.message}`);
  process.exitCode = 1;
});
