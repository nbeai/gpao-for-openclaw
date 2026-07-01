import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import {
  applySurfaceLanguageGuard,
  buildCompanionProfileFromText,
  buildTurnPlan,
  classifyToolCallRisk,
  classifyToolResultSemantics,
  classifyTelegramUxState,
  compactWorkingMemoryPatch,
  decideSurfaceIntervention,
  loadCompanionProfile,
  normalizeExecutionReviewReply,
  renderCompanionSetupPrompt,
  renderApprovalWaitGuide,
  renderTelegramUxStateGuide,
  renderCapabilityTranslationReply,
  recoveryEscalationFingerprint,
  renderRecoveryEscalationReply,
  renderRecoverySummaryReply,
  renderPromptContext,
  renderNextSessionSeed,
  renderInstallGuideReply,
  renderInstallResumeReply,
  renderDelegationSurfaceReply,
  renderStateHygieneSurfaceReply,
  renderApprovalBoundarySurfaceReply,
  renderInternalProcessSurfaceGuide,
  renderSessionSplitApprovalReply,
  renderWorkOrderReply,
  saveCompanionProfile,
  sanitizePersistedToolResultMessage,
  sanitizeUserFacingReply,
  isApprovalWaitSurface,
  isInternalSessionDeliveryArtifact,
  isInternalProcessSurface,
  shouldOfferCompanionSetup,
  shouldSaveCompanionProfile,
  shouldTranslateCapability,
  shouldRenderDelegationSurface,
  shouldRenderStateHygieneSurface,
  shouldRenderApprovalBoundarySurface,
  shouldRenderRecoverySummary,
  summarizeReply,
  updateAgreementCandidates,
  updateBeaiMemoryAssets,
  updateProjectStateSnapshot,
  updateSessionContinuityState,
  updateWorkingMemory,
  type BeaiTurnPlan
} from "./runtime-core.js";

type PluginConfig = {
  enabled?: boolean;
  hardHandoffOverride?: boolean;
  toolRiskObserver?: boolean;
};

const runPlans = new Map<string, BeaiTurnPlan>();
const sessionPlans = new Map<string, BeaiTurnPlan>();
const runHandoffSeeds = new Map<string, CarriedHandoffSeed>();
const sessionHandoffSeeds = new Map<string, CarriedHandoffSeed>();
const sessionInstallCandidates = new Map<string, InstallAttachmentCandidate>();
const sessionInstallIntents = new Map<string, InstallAttachmentCandidate>();
const sessionLiveContextUsagePct = new Map<string, number>();
const recentInboundProgressAckAt = new Map<string, number>();
const sessionRecoveryCounts = new Map<string, number>();
const activeVisibleProgressContracts = new Map<string, VisibleProgressContract>();
const activeQuickFirstStatusContracts = new Map<string, QuickFirstStatusContract>();
const activePhaseTimingContracts = new Map<string, PhaseTimingContract>();
let lastVerifiedTelegramDeliveryAt = 0;
let latestWorkspaceDir: string | undefined;

const BEAI_STATE_ROOT_ENV = "BEAI_RUNTIME_STATE_ROOT";
const OPENCLAW_WORKSPACE_ENV = "OPENCLAW_WORKSPACE_DIR";

type HookMessage =
  | string
  | {
      role?: string;
      content?: unknown;
      text?: string;
    };

type ReplyPayloadLike = {
  text?: string;
  [key: string]: unknown;
};

type AgentMessageLike = {
  role?: string;
  text?: string;
  content?: unknown;
};

type TextBlockLike = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

type QueuedInjectionLike = {
  text?: string;
  metadata?: unknown;
  idempotencyKey?: string;
};

type CarriedHandoffSeed = {
  text: string;
  handoffState?: BeaiTurnPlan["handoffState"];
  traceId?: string;
  sourceSessionKey?: string;
  targetSessionKey?: string;
  reason?: string;
  injectionIdempotencyKey?: string;
  installResume?: {
    packageRef?: string;
    packageLabel?: string;
    packageSource?: string;
    restartReason?: string;
  };
};

type InstallAttachmentCandidate = {
  packageRef: string;
  packageLabel?: string;
  packageSource?: string;
  messageId?: string;
  sessionKey?: string;
  capturedAt: string;
};

type LiveContextUsageSample = {
  percent: number;
  inputTokens?: number;
  contextWindow?: number;
  source?: "reported_percent" | "input_tokens_over_budget" | "total_tokens_over_budget";
};

type ContinuityTraceEvent = {
  event: "session_end_queued" | "agent_turn_prepare_captured" | "persisted_context_pack_fallback_applied";
  timestamp: string;
  sessionKey?: string | null;
  runId?: string | null;
  traceId?: string | null;
  nextSessionKey?: string | null;
  sourceSessionKey?: string | null;
  targetSessionKey?: string | null;
  injectionIdempotencyKey?: string | null;
  reason?: string | null;
  hasStructuredHandoffState: boolean;
  openingMessage?: string | null;
  preview?: string | null;
};

type LiveEvidenceLevel =
  | "hook_observed"
  | "runtime_plan_created"
  | "surface_rewritten"
  | "asset_written"
  | "queued_for_next_session"
  | "status_sampled"
  | "delivery_contract_observed"
  | "quick_first_status_contract_observed"
  | "visible_progress_contract_observed"
  | "visible_delivery_verified";

type LiveEvidenceEvent = {
  timestamp: string;
  hook: string;
  action: string;
  evidenceLevel: LiveEvidenceLevel;
  runId?: string | null;
  sessionKey?: string | null;
  inboundChannel?: string | null;
  outboundChannel?: string | null;
  deliverySessionKey?: string | null;
  messageId?: string | null;
  deliverySuccess?: boolean | null;
  sourceTool?: string | null;
  userVisible?: boolean | null;
  internalHandoff?: boolean | null;
  loopRiskClassification?: string | null;
  mode?: string | null;
  primaryClass?: string | null;
  riskLevel?: string | null;
  responseRole?: string | null;
  confirmed?: string[];
  unknown?: string[];
  assumptions?: string[];
  needsVerification?: string[];
  preview?: string | null;
  note?: string | null;
};

type VisibleProgressContract = {
  key: string;
  startedAt: number;
  lastGapEvidenceAt: number;
  runId?: string | null;
  sessionKey?: string | null;
  inputPreview?: string | null;
};

type QuickFirstStatusContract = {
  key: string;
  startedAt: number;
  missingEvidenceAt: number;
  runId?: string | null;
  sessionKey?: string | null;
  inputPreview?: string | null;
};

type PhaseTimingContract = {
  key: string;
  startedAt: number;
  lastStageAt: number;
  stages: Record<string, number>;
  runId?: string | null;
  sessionKey?: string | null;
};

function toPluginJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function compactPreview(text: string | undefined, limit = 160): string | null {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

function isTestRuntime(): boolean {
  return Boolean(process.env.VITEST || process.env.VITEST_WORKER_ID || process.env.NODE_ENV === "test");
}

function normalizeWorkspaceDir(workspaceDir: string | undefined): string | undefined {
  const trimmed = workspaceDir?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveStateWorkspaceDir(workspaceDir?: string): string | undefined {
  const explicitWorkspace = normalizeWorkspaceDir(workspaceDir);
  if (explicitWorkspace) {
    latestWorkspaceDir = explicitWorkspace;
    return explicitWorkspace;
  }

  const envWorkspace = normalizeWorkspaceDir(process.env[BEAI_STATE_ROOT_ENV] || process.env[OPENCLAW_WORKSPACE_ENV]);
  if (envWorkspace) {
    latestWorkspaceDir = envWorkspace;
    return envWorkspace;
  }

  const latest = normalizeWorkspaceDir(latestWorkspaceDir);
  if (latest) return latest;

  const defaultWorkspace = path.join(os.homedir(), ".openclaw", "workspace");
  if (!isTestRuntime() && fs.existsSync(defaultWorkspace)) {
    latestWorkspaceDir = defaultWorkspace;
    return defaultWorkspace;
  }

  return undefined;
}

function appendContinuityTrace(workspaceDir: string | undefined, event: ContinuityTraceEvent): void {
  try {
    const stateWorkspaceDir = resolveStateWorkspaceDir(workspaceDir);
    if (!stateWorkspaceDir) return;
    const filePath = path.join(stateWorkspaceDir, "state", "continuity", "next-session-transfer-trace.jsonl");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
  } catch {
    // Continuity trace persistence must never break the gateway reply path.
  }
}

function liveEvidencePath(workspaceDir: string): string {
  return path.join(workspaceDir, "state", "beai", "live-evidence.jsonl");
}

function summarizeEvidence(plan: BeaiTurnPlan | undefined): Pick<LiveEvidenceEvent, "mode" | "primaryClass" | "riskLevel" | "responseRole" | "confirmed" | "unknown" | "assumptions" | "needsVerification"> {
  if (!plan) return {};
  return {
    mode: plan.mode,
    primaryClass: plan.primaryClass,
    riskLevel: plan.riskLevel,
    responseRole: plan.judgmentFrame.responseRole,
    confirmed: [
      ...plan.judgmentFrame.confirmed.slice(0, 5),
      `input_level: ${plan.inputLevelCompanion.inputMaturity}/${plan.inputLevelCompanion.primaryNeed}/${plan.inputLevelCompanion.responsePosture}`,
      `response_inertia: ${plan.responseInertia.currentTurnRelation}/${plan.responseInertia.requiredShift}`,
      `judgment_sharpness: ${plan.judgmentSharpness.version}/${plan.judgmentSharpness.uncertaintyAction}`
    ],
    unknown: plan.judgmentFrame.unknown.slice(0, 4),
    assumptions: plan.evidenceLedger.assumptions.slice(0, 4),
    needsVerification: plan.evidenceLedger.needsVerification.slice(0, 4)
  };
}

function appendLiveEvidence(workspaceDir: string | undefined, event: Omit<LiveEvidenceEvent, "timestamp">): void {
  try {
    const stateWorkspaceDir = resolveStateWorkspaceDir(workspaceDir);
    if (!stateWorkspaceDir) return;
    const filePath = liveEvidencePath(stateWorkspaceDir);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(
      filePath,
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event
      })}\n`,
      "utf8"
    );
  } catch {
    // Evidence persistence is useful, but BEAI must fail soft before it can affect OpenClaw/Gateway.
  }
}

function visibleProgressThresholdMs(): number {
  const raw = Number(process.env.BEAI_VISIBLE_PROGRESS_STALE_MS);
  if (Number.isFinite(raw) && raw >= 1000) return raw;
  return 2 * 60 * 1000;
}

function quickFirstStatusThresholdMs(): number {
  const raw = Number(process.env.BEAI_QUICK_FIRST_STATUS_STALE_MS);
  if (Number.isFinite(raw) && raw >= 1000) return raw;
  return 30 * 1000;
}

function visibleProgressContractKey(runId?: string | null, sessionKey?: string | null): string | undefined {
  if (runId) return `run:${runId}`;
  if (sessionKey) return `session:${sessionKey}`;
  return undefined;
}

function shouldTrackVisibleProgress(plan: BeaiTurnPlan | undefined, sessionKey?: string | null): boolean {
  if (!plan) return false;
  const isExecution =
    plan.currentTurn.requestedOutputShape === "execution" ||
    plan.userConfidence.executionMode === "execution" ||
    plan.inputLevelCompanion.primaryNeed === "execution" ||
    plan.judgmentFrame.responseRole === "work_order";
  if (!isExecution) return false;
  const sessionText = String(sessionKey || "");
  const telegramContext =
    /:telegram(?::[^:]+)?:direct:/i.test(sessionText) ||
    /telegram|텔레그램|visible|messageId|source conversation|source-channel/i.test(plan.currentTurn.cleanInput);
  return telegramContext;
}

function shouldTrackQuickFirstStatus(plan: BeaiTurnPlan | undefined, sessionKey?: string | null): boolean {
  if (!shouldTrackVisibleProgress(plan, sessionKey)) return false;
  return Boolean(
    plan?.userConfidence.responseState === "running" ||
    plan?.judgmentFrame.responseRole === "work_order" ||
    plan?.currentTurn.requestedOutputShape === "execution"
  );
}

function trackPhaseTimingContract(
  workspaceDir: string | undefined,
  plan: BeaiTurnPlan | undefined,
  ids: { runId?: string | null; sessionKey?: string | null },
  stage: string
): void {
  const key = visibleProgressContractKey(ids.runId, ids.sessionKey);
  if (!key) return;
  const now = Date.now();
  let contract = activePhaseTimingContracts.get(key);
  if (!contract) {
    contract = {
      key,
      startedAt: now,
      lastStageAt: now,
      stages: {},
      runId: ids.runId ?? null,
      sessionKey: ids.sessionKey ?? null
    };
    activePhaseTimingContracts.set(key, contract);
  }
  const previousStageAt = contract.lastStageAt || contract.startedAt;
  contract.stages[stage] = now;
  contract.lastStageAt = now;
  appendLiveEvidence(workspaceDir, {
    hook: stage,
    action: "runtime phase timing sampled",
    evidenceLevel: "status_sampled",
    runId: ids.runId ?? contract.runId ?? null,
    sessionKey: ids.sessionKey ?? contract.sessionKey ?? null,
    ...summarizeEvidence(plan),
    confirmed: [
      `phase: ${stage}`,
      `elapsed_ms_from_turn_start: ${now - contract.startedAt}`,
      `elapsed_ms_since_previous_phase: ${now - previousStageAt}`
    ],
    note: "BEAI speed contract: runtime records phase timing so slow turns can be separated into planning, tool, model/finalize, and Telegram delivery segments."
  });
}

function trackVisibleProgressContract(
  plan: BeaiTurnPlan | undefined,
  ids: { runId?: string | null; sessionKey?: string | null }
): void {
  if (!shouldTrackVisibleProgress(plan, ids.sessionKey)) return;
  const key = visibleProgressContractKey(ids.runId, ids.sessionKey);
  if (!key || activeVisibleProgressContracts.has(key)) return;
  activeVisibleProgressContracts.set(key, {
    key,
    startedAt: Date.now(),
    lastGapEvidenceAt: 0,
    runId: ids.runId ?? null,
    sessionKey: ids.sessionKey ?? null,
    inputPreview: compactPreview(plan?.currentTurn.cleanInput)
  });
}

function trackQuickFirstStatusContract(
  workspaceDir: string | undefined,
  plan: BeaiTurnPlan | undefined,
  ids: { runId?: string | null; sessionKey?: string | null }
): void {
  if (!shouldTrackQuickFirstStatus(plan, ids.sessionKey)) return;
  const key = visibleProgressContractKey(ids.runId, ids.sessionKey);
  if (!key || activeQuickFirstStatusContracts.has(key)) return;
  const contract = {
    key,
    startedAt: Date.now(),
    missingEvidenceAt: 0,
    runId: ids.runId ?? null,
    sessionKey: ids.sessionKey ?? null,
    inputPreview: compactPreview(plan?.currentTurn.cleanInput)
  };
  activeQuickFirstStatusContracts.set(key, contract);
  appendLiveEvidence(workspaceDir, {
    hook: "before_prompt_build",
    action: "telegram quick first status contract opened",
    evidenceLevel: "quick_first_status_contract_observed",
    runId: ids.runId ?? null,
    sessionKey: ids.sessionKey ?? null,
    outboundChannel: "telegram",
    userVisible: false,
    ...summarizeEvidence(plan),
    confirmed: [
      `quick_first_status_threshold_ms: ${quickFirstStatusThresholdMs()}`
    ],
    preview: contract.inputPreview,
    note: "BEAI speed contract: Telegram-driven execution should send a quick visible first status before deep checks or long tool work make the chat feel silent."
  });
}

function clearVisibleProgressContract(runId?: string | null, sessionKey?: string | null): void {
  const keys = [
    visibleProgressContractKey(runId, undefined),
    visibleProgressContractKey(undefined, sessionKey)
  ].filter((value): value is string => Boolean(value));
  for (const key of keys) activeVisibleProgressContracts.delete(key);
}

function clearQuickFirstStatusContract(runId?: string | null, sessionKey?: string | null): void {
  const keys = [
    visibleProgressContractKey(runId, undefined),
    visibleProgressContractKey(undefined, sessionKey)
  ].filter((value): value is string => Boolean(value));
  for (const key of keys) activeQuickFirstStatusContracts.delete(key);
}

function clearPhaseTimingContract(runId?: string | null, sessionKey?: string | null): void {
  const keys = [
    visibleProgressContractKey(runId, undefined),
    visibleProgressContractKey(undefined, sessionKey)
  ].filter((value): value is string => Boolean(value));
  for (const key of keys) activePhaseTimingContracts.delete(key);
}

function recordQuickFirstStatusGapIfNeeded(
  workspaceDir: string | undefined,
  ids: { runId?: string | null; sessionKey?: string | null },
  plan: BeaiTurnPlan | undefined,
  hook: string
): void {
  const key = visibleProgressContractKey(ids.runId, ids.sessionKey);
  const contract = key ? activeQuickFirstStatusContracts.get(key) : undefined;
  if (!contract) return;
  const now = Date.now();
  const thresholdMs = quickFirstStatusThresholdMs();
  const elapsedMs = now - contract.startedAt;
  if (elapsedMs < thresholdMs) return;
  if (contract.missingEvidenceAt && now - contract.missingEvidenceAt < thresholdMs) return;
  contract.missingEvidenceAt = now;
  appendLiveEvidence(workspaceDir, {
    hook,
    action: "telegram quick first status missing before deep work",
    evidenceLevel: "quick_first_status_contract_observed",
    runId: ids.runId ?? contract.runId ?? null,
    sessionKey: ids.sessionKey ?? contract.sessionKey ?? null,
    outboundChannel: "telegram",
    userVisible: false,
    ...summarizeEvidence(plan),
    confirmed: [
      `elapsed_ms_without_quick_first_status: ${elapsedMs}`,
      `threshold_ms: ${thresholdMs}`
    ],
    unknown: [
      "This does not prove Telegram transport failure.",
      "It proves the quick first-status contract stayed open too long before a user-visible update."
    ],
    preview: contract.inputPreview,
    note: "BEAI speed contract: quick first status must be separated from slower deep checks so users do not experience a silent Telegram turn."
  });
}

function recordVisibleProgressGapIfNeeded(
  workspaceDir: string | undefined,
  ids: { runId?: string | null; sessionKey?: string | null },
  plan: BeaiTurnPlan | undefined,
  hook: string
): void {
  const key = visibleProgressContractKey(ids.runId, ids.sessionKey);
  const contract = key ? activeVisibleProgressContracts.get(key) : undefined;
  if (!contract) return;
  const now = Date.now();
  const thresholdMs = visibleProgressThresholdMs();
  const elapsedMs = now - contract.startedAt;
  const sinceLastVerifiedMs = lastVerifiedTelegramDeliveryAt ? now - lastVerifiedTelegramDeliveryAt : null;
  const hasRecentVerifiedDelivery = typeof sinceLastVerifiedMs === "number" && sinceLastVerifiedMs <= thresholdMs;
  if (elapsedMs < thresholdMs || hasRecentVerifiedDelivery) return;
  if (contract.lastGapEvidenceAt && now - contract.lastGapEvidenceAt < thresholdMs) return;
  contract.lastGapEvidenceAt = now;
  appendLiveEvidence(workspaceDir, {
    hook,
    action: "telegram long-running visible progress gap observed",
    evidenceLevel: "visible_progress_contract_observed",
    runId: ids.runId ?? contract.runId ?? null,
    sessionKey: ids.sessionKey ?? contract.sessionKey ?? null,
    outboundChannel: "telegram",
    userVisible: false,
    ...summarizeEvidence(plan),
    confirmed: [
      `elapsed_ms_without_visible_progress: ${elapsedMs}`,
      `threshold_ms: ${thresholdMs}`
    ],
    unknown: [
      "This does not prove Telegram transport failure.",
      "It proves the user-visible progress contract stayed open too long for a Telegram-driven execution."
    ],
    preview: contract.inputPreview,
    note: "BEAI visible progress contract: long-running Telegram-driven work needs periodic source-channel progress, not only final messageId closeout."
  });
}

function nextRecoveryOccurrence(sessionKey: string | undefined, input: string): number {
  const scope = sessionKey ? `session:${sessionKey}` : "global";
  const key = `${scope}:${recoveryEscalationFingerprint(input)}`;
  const next = (sessionRecoveryCounts.get(key) || 0) + 1;
  sessionRecoveryCounts.set(key, next);
  return next;
}

function readConfig(raw: unknown): Required<PluginConfig> {
  if (!raw || typeof raw !== "object") {
    return { enabled: true, hardHandoffOverride: true, toolRiskObserver: false };
  }
  const config = raw as PluginConfig;
  return {
    enabled: config.enabled !== false,
    hardHandoffOverride: config.hardHandoffOverride !== false,
    toolRiskObserver: config.toolRiskObserver === true
  };
}

function logHookEvent(
  logger: { debug?: (msg: string, meta?: Record<string, unknown>) => void; info?: (msg: string, meta?: Record<string, unknown>) => void } | undefined,
  level: "debug" | "info",
  message: string,
  meta: Record<string, unknown>
): void {
  const fn = logger?.[level];
  if (typeof fn === "function") {
    fn(message, meta);
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const block = item as { type?: string; text?: string; content?: string };
      if (typeof block.text === "string") return block.text.trim();
      if (typeof block.content === "string" && (block.type === "text" || !block.type)) return block.content.trim();
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function stripMetaEnvelope(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const currentRequestMatch = trimmed.match(/Current user request:\s*([\s\S]*?)(?:\n(?:The latest user message is|$))/i);
  if (currentRequestMatch?.[1]?.trim()) {
    return currentRequestMatch[1].trim();
  }

  const overlayStripped = trimmed
    .replace(/^\[BEAI Runtime Overlay\][\s\S]*?(?:\n\n|$)/i, "")
    .replace(/^Delivery:\s.*$/gim, "")
    .replace(/^Conversation (?:info|context).*$/gim, "")
    .replace(/^Sender .*$/gim, "")
    .trim();

  return overlayStripped || trimmed;
}

function extractCurrentUserInput(event: { prompt?: string; messages?: unknown[] }): string {
  const messages = (Array.isArray(event.messages) ? event.messages : []) as HookMessage[];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message === "string") continue;
    if (message.role !== "user") continue;
    const text = typeof message.text === "string" && message.text.trim() ? message.text.trim() : extractTextFromContent(message.content);
    if (text) {
      const stripped = stripMetaEnvelope(text);
      if (!isInternalProcessSurface(stripped)) return stripped;
    }
  }

  const prompt = event.prompt?.trim() || "";
  const currentRequestMatch = prompt.match(/Current user request:\s*([\s\S]*?)$/i);
  if (currentRequestMatch?.[1]?.trim()) {
    const stripped = stripMetaEnvelope(currentRequestMatch[1]);
    return isInternalProcessSurface(stripped) ? "" : stripped;
  }
  const strippedPrompt = stripMetaEnvelope(prompt);
  return isInternalProcessSurface(strippedPrompt) ? "" : strippedPrompt;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function stringifyField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function findNestedString(value: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 3) return undefined;
  const record = asRecord(value);
  if (!record) return undefined;
  for (const key of keys) {
    const direct = stringifyField(record[key]);
    if (direct) return direct;
  }
  for (const nested of Object.values(record)) {
    if (!nested || typeof nested !== "object") continue;
    const found = findNestedString(nested, keys, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function detectDeliveryChannel(event: unknown, ctx: unknown, text: string | undefined, direction: "inbound" | "outbound"): string | null {
  const haystack = [
    findNestedString(event, direction === "outbound" ? ["channel", "outboundChannel", "transport", "kind"] : ["channel", "inboundChannel", "transport", "kind"]),
    findNestedString(ctx, direction === "outbound" ? ["channel", "outboundChannel", "transport", "kind"] : ["channel", "inboundChannel", "transport", "kind"]),
    findNestedString(event, ["sessionKey"]),
    findNestedString(ctx, ["sessionKey"]),
    text
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\btelegram\b|tg:|telegram:/.test(haystack)) return "telegram";
  if (/\bdashboard\b|\bweb\b|\bconsole\b/.test(haystack)) return "dashboard";
  if (/\bcodex\b/.test(haystack)) return "codex";
  return null;
}

function classifyDeliveryPath(event: unknown, ctx: unknown, payloadText?: string): Pick<
  LiveEvidenceEvent,
  "inboundChannel" | "outboundChannel" | "deliverySessionKey" | "sourceTool" | "userVisible" | "internalHandoff" | "loopRiskClassification"
> {
  const sourceTool = findNestedString(event, ["sourceTool", "toolName", "tool"]) || findNestedString(ctx, ["sourceTool", "toolName", "tool"]) || null;
  const sessionKey = findNestedString(event, ["sessionKey"]) || findNestedString(ctx, ["sessionKey"]) || null;
  const metadataType = findNestedString(event, ["type"]) || findNestedString(ctx, ["type"]);
  const internalHandoff = Boolean(
    sourceTool === "sessions_send" ||
      metadataType === "beai_handoff_seed" ||
      isInternalSessionDeliveryArtifact(payloadText)
  );
  const inboundChannel = detectDeliveryChannel(event, ctx, payloadText, "inbound");
  const outboundChannel = detectDeliveryChannel(event, ctx, payloadText, "outbound");
  let loopRiskClassification: string | null = null;
  if (sourceTool === "sessions_send" && sessionKey === "current") {
    loopRiskClassification = "sessions_send_current_session_loop_risk";
  } else if (internalHandoff && outboundChannel === "telegram") {
    loopRiskClassification = "internal_handoff_visible_telegram_delivery_risk";
  } else if (internalHandoff) {
    loopRiskClassification = "internal_handoff_reinterpretation_risk";
  }
  return {
    inboundChannel,
    outboundChannel,
    deliverySessionKey: sessionKey,
    sourceTool,
    userVisible: internalHandoff ? false : outboundChannel ? true : null,
    internalHandoff,
    loopRiskClassification
  };
}

function isTelegramDeliveryPath(delivery: Pick<LiveEvidenceEvent, "outboundChannel" | "inboundChannel">): boolean {
  return delivery.outboundChannel === "telegram" || delivery.inboundChannel === "telegram";
}

function isTelegramVisibleDeliveryCandidate(
  delivery: Pick<LiveEvidenceEvent, "outboundChannel" | "inboundChannel" | "userVisible" | "internalHandoff">,
  payloadText?: string
): boolean {
  if (!isTelegramDeliveryPath(delivery)) return false;
  if (delivery.internalHandoff || delivery.userVisible === false) return false;
  const normalized = String(payloadText || "").trim();
  if (!normalized) return false;
  return !isInternalSessionDeliveryArtifact(normalized);
}

function classifySentDeliveryPath(event: unknown, ctx: unknown, content?: string): Pick<
  LiveEvidenceEvent,
  "inboundChannel" | "outboundChannel" | "deliverySessionKey" | "sourceTool" | "userVisible" | "internalHandoff" | "loopRiskClassification"
> {
  const delivery = classifyDeliveryPath(event, ctx, content);
  const eventRecord = asRecord(event);
  const to = stringifyField(eventRecord?.to);
  const sessionKey = delivery.deliverySessionKey || findNestedString(event, ["sessionKey"]) || findNestedString(ctx, ["sessionKey"]) || null;
  const toLooksTelegram = typeof to === "string" && /\btelegram\b|^tg:|^telegram:|telegram:direct/i.test(to);
  const sessionLooksTelegram = typeof sessionKey === "string" && /:telegram(?::[^:]+)?:direct:/.test(sessionKey);
  const outboundChannel = delivery.outboundChannel || (toLooksTelegram || sessionLooksTelegram ? "telegram" : null);
  const inboundChannel = delivery.inboundChannel || (sessionLooksTelegram ? "telegram" : null);
  return {
    ...delivery,
    inboundChannel,
    outboundChannel,
    deliverySessionKey: sessionKey,
    userVisible: delivery.internalHandoff ? false : outboundChannel ? true : delivery.userVisible
  };
}

function looksLikeInstallGuideInput(text: string | undefined): boolean {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) return false;
  return hasExplicitInstallGuideIntent(normalized);
}

function hasExplicitInstallGuideIntent(text: string | undefined): boolean {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) return false;
  const failureContext = /(안\s*(?:돼|됨|되|된다)|못\s*(?:해|함|한다|하고)|실패|오류|에러|문제|작동\s*안|끊|무응답|stuck|hang|failed|failure|error|not\s+working|does\s+not\s+work)/i.test(normalized);
  const installAction = /(설치\s*(?:해줘|하자|진행|적용|업그레이드|점검|검증|도와|방법|가이드|흐름|워크플로|처리)|install(?:\s+it|\s+this|\s+the|\s+attached|\s+zip|\s+package)?|upgrade|apply|setup|onboard)/i.test(normalized);
  const packageObject = /(첨부|파일|zip|패키지|package|installer|설치파일|배포파일|plugin\s+package|runtime\s+package)/i.test(normalized);
  const overlaySetupQuestion = /(비아이|beai|overlay|오버레이|runtime|plugin|플러그인).{0,40}(설치\s*(?:방법|가이드|절차)|setup|onboard)/i.test(normalized);
  if (failureContext && !packageObject) return false;
  return (installAction && (packageObject || !failureContext)) || overlaySetupQuestion;
}

function looksLikeApprovalContinuation(text: string | undefined): boolean {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;
  return /^(진행해|진행하자|진행|승인|계속|설치해줘|설치 진행|좋아\.?\s*진행해|go ahead|proceed|continue|install it)$/i.test(normalized);
}

function resolveInboundTrackingKey(event: {
  sessionKey?: string;
  conversationId?: string;
  parentConversationId?: string;
  threadId?: string | number;
  from?: string;
}): string | undefined {
  if (event.sessionKey) return `session:${event.sessionKey}`;
  if (event.conversationId) return `conversation:${event.conversationId}`;
  if (event.parentConversationId) return `parent:${event.parentConversationId}`;
  if (event.threadId !== undefined && event.threadId !== null) return `thread:${String(event.threadId)}`;
  if (event.from) return `from:${event.from}`;
  return undefined;
}

function collectStringValues(value: unknown, results: string[], depth = 0): void {
  if (depth > 6 || results.length >= 80) return;
  if (typeof value === "string") {
    results.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, results, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const entry of Object.values(value)) collectStringValues(entry, results, depth + 1);
}

function extractZipMediaRefs(value: unknown): InstallAttachmentCandidate[] {
  const strings: string[] = [];
  collectStringValues(value, strings);
  const unique = new Map<string, InstallAttachmentCandidate>();
  const zipLabels = strings
    .flatMap((raw) => raw.trim().match(/[A-Za-z0-9._-]+\.zip\b/gi) || [])
    .filter(Boolean);

  for (const raw of strings) {
    const text = raw.trim();
    if (!text) continue;
    const mediaMatches = text.match(/media:\/\/inbound\/[^\s"'`)>]+/gi) || [];
    const zipLabelMatches = text.match(/[A-Za-z0-9._-]+\.zip\b/gi) || [];

    for (const ref of mediaMatches) {
      const existing = unique.get(ref) || {
        packageRef: ref,
        capturedAt: new Date().toISOString()
      };
      const firstZipLabel = zipLabelMatches[0] || zipLabels[0];
      if (firstZipLabel && !existing.packageLabel) existing.packageLabel = firstZipLabel;
      unique.set(ref, existing);
    }
  }

  return Array.from(unique.values());
}

function extractInstallAttachmentCandidate(event: {
  content?: string;
  metadata?: Record<string, unknown>;
  messageId?: string;
  sessionKey?: string;
  conversationId?: string;
  parentConversationId?: string;
  threadId?: string | number;
  from?: string;
}): InstallAttachmentCandidate | undefined {
  const candidates = [
    ...extractZipMediaRefs(event.metadata),
    ...extractZipMediaRefs(event.content)
  ];
  if (candidates.length === 0) return undefined;
  const key = resolveInboundTrackingKey(event);
  const first = candidates[0];
  return {
    ...first,
    sessionKey: key,
    messageId: event.messageId,
    packageSource: event.messageId ? `message:${event.messageId}` : first.packageSource,
    capturedAt: new Date().toISOString()
  };
}

function resolveInstallCandidateForTurn(ctx: {
  sessionKey?: string;
  conversationId?: string;
  parentConversationId?: string;
  threadId?: string | number;
  from?: string;
}): InstallAttachmentCandidate | undefined {
  const keys = [
    resolveInboundTrackingKey(ctx),
    ctx.sessionKey ? `session:${ctx.sessionKey}` : undefined,
    ctx.conversationId ? `conversation:${ctx.conversationId}` : undefined,
    ctx.parentConversationId ? `parent:${ctx.parentConversationId}` : undefined,
    ctx.threadId !== undefined && ctx.threadId !== null ? `thread:${String(ctx.threadId)}` : undefined,
    ctx.from ? `from:${ctx.from}` : undefined
  ].filter((value): value is string => Boolean(value));

  for (const key of keys) {
    if (sessionInstallIntents.has(key)) return sessionInstallIntents.get(key);
    if (sessionInstallCandidates.has(key)) return sessionInstallCandidates.get(key);
  }
  return undefined;
}

function attachInstallCandidateToInput(currentInput: string, candidate: InstallAttachmentCandidate | undefined): string {
  if (!candidate?.packageRef) return currentInput;
  const candidateBlock = [
    "Detected install package candidate:",
    `- ref: ${candidate.packageRef}`,
    candidate.packageLabel ? `- label: ${candidate.packageLabel}` : "",
    candidate.packageSource ? `- source: ${candidate.packageSource}` : "",
    "Use this package as the current overlay install target unless the user changes it."
  ]
    .filter(Boolean)
    .join("\n");

  if (!currentInput) return candidateBlock;
  if (currentInput.includes(candidate.packageRef)) return currentInput;
  return `${currentInput}\n\n${candidateBlock}`;
}

function roundUsagePercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function readFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function findNumberByKeys(value: unknown, targetKeys: string[], depth = 0): number | undefined {
  if (depth > 6 || !value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumberByKeys(item, targetKeys, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const normalizedTargets = new Set(targetKeys.map(normalizeKey));
  for (const [key, entry] of Object.entries(record)) {
    if (normalizedTargets.has(normalizeKey(key))) {
      const number = readFiniteNumber(entry);
      if (number !== undefined) return number;
    }
  }
  for (const entry of Object.values(record)) {
    const found = findNumberByKeys(entry, targetKeys, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function extractLiveContextUsageSample(event: unknown): LiveContextUsageSample | undefined {
  const reportedPercent = findNumberByKeys(event, [
    "contextUsagePct",
    "context_usage_pct",
    "contextPressurePct",
    "context_pressure_pct",
    "usagePercent",
    "usage_percent"
  ]);
  if (reportedPercent !== undefined && reportedPercent >= 0) {
    return {
      percent: roundUsagePercent(reportedPercent),
      source: "reported_percent"
    };
  }

  const rawBudget = findNumberByKeys(event, [
    "contextTokenBudget",
    "context_token_budget",
    "contextWindow",
    "context_window",
    "modelContextWindow",
    "model_context_window",
    "maxContextTokens",
    "max_context_tokens",
    "contextLength",
    "context_length",
    "contextLimit",
    "context_limit"
  ]);
  const rawInputTokens = findNumberByKeys(event, [
    "input",
    "inputTokens",
    "input_tokens",
    "promptTokens",
    "prompt_tokens",
    "requestTokens",
    "request_tokens"
  ]);
  const rawTotalTokens = findNumberByKeys(event, [
    "total",
    "totalTokens",
    "total_tokens"
  ]);

  const budget =
    typeof rawBudget === "number" && Number.isFinite(rawBudget) && rawBudget > 0
      ? rawBudget
      : undefined;
  const inputTokens =
    typeof rawInputTokens === "number" && Number.isFinite(rawInputTokens) && rawInputTokens >= 0
      ? rawInputTokens
      : undefined;
  const totalTokens =
    typeof rawTotalTokens === "number" && Number.isFinite(rawTotalTokens) && rawTotalTokens >= 0
      ? rawTotalTokens
      : undefined;

  if (!budget) return undefined;
  if (inputTokens !== undefined) {
    return {
      percent: roundUsagePercent((inputTokens / budget) * 100),
      inputTokens,
      contextWindow: budget,
      source: "input_tokens_over_budget"
    };
  }
  if (totalTokens !== undefined) {
    return {
      percent: roundUsagePercent((totalTokens / budget) * 100),
      inputTokens: totalTokens,
      contextWindow: budget,
      source: "total_tokens_over_budget"
    };
  }

  return undefined;
}

function extractQueuedHandoffSeed(queuedInjections: unknown[]): CarriedHandoffSeed | undefined {
  for (const item of queuedInjections) {
    const entry = asRecord(item) as QueuedInjectionLike | undefined;
    if (!entry?.text?.trim()) continue;
    const metadata = asRecord(entry.metadata);
    const isBeaiSeed = metadata?.type === "beai_handoff_seed" || entry.idempotencyKey?.startsWith("beai-handoff-seed:");
    if (!isBeaiSeed) continue;
    const handoffState = asRecord(metadata?.handoffState) as BeaiTurnPlan["handoffState"];
    const installResumeRecord = asRecord(metadata?.installResume);
    return {
      text: entry.text.trim(),
      handoffState,
      traceId: typeof metadata?.traceId === "string" && metadata.traceId.trim() ? metadata.traceId.trim() : undefined,
      sourceSessionKey:
        typeof metadata?.sourceSessionKey === "string" && metadata.sourceSessionKey.trim()
          ? metadata.sourceSessionKey.trim()
          : undefined,
      targetSessionKey:
        typeof metadata?.targetSessionKey === "string" && metadata.targetSessionKey.trim()
          ? metadata.targetSessionKey.trim()
          : undefined,
      reason: typeof metadata?.reason === "string" && metadata.reason.trim() ? metadata.reason.trim() : undefined,
      injectionIdempotencyKey:
        typeof entry.idempotencyKey === "string" && entry.idempotencyKey.trim()
          ? entry.idempotencyKey.trim()
          : undefined,
      installResume: installResumeRecord
        ? {
            packageRef:
              typeof installResumeRecord.packageRef === "string" && installResumeRecord.packageRef.trim()
                ? installResumeRecord.packageRef.trim()
                : undefined,
            packageLabel:
              typeof installResumeRecord.packageLabel === "string" && installResumeRecord.packageLabel.trim()
                ? installResumeRecord.packageLabel.trim()
                : undefined,
            packageSource:
              typeof installResumeRecord.packageSource === "string" && installResumeRecord.packageSource.trim()
                ? installResumeRecord.packageSource.trim()
                : undefined,
            restartReason:
              typeof installResumeRecord.restartReason === "string" && installResumeRecord.restartReason.trim()
                ? installResumeRecord.restartReason.trim()
                : undefined
          }
        : undefined
    };
  }
  return undefined;
}

function resolveCarriedHandoffForTurn(ctx: { runId?: string; sessionKey?: string }): CarriedHandoffSeed | undefined {
  if (ctx.runId && runHandoffSeeds.has(ctx.runId)) return runHandoffSeeds.get(ctx.runId);
  if (ctx.sessionKey && sessionHandoffSeeds.has(ctx.sessionKey)) return sessionHandoffSeeds.get(ctx.sessionKey);
  return undefined;
}

function isExplicitContinuityResumeRequest(input: string | undefined): boolean {
  return /(이전\s*흐름|이전\s*대화|이어받|이어\s*받|어디까지|왜\s*여기까지|새\s*세션|다음\s*세션|세션\s*연속성|handoff|continuity|resume)/i.test(
    String(input || "")
  );
}

function readPersistedNewSessionContextPack(workspaceDir: string | undefined): Record<string, unknown> | undefined {
  if (!workspaceDir) return undefined;
  const filePath = path.join(workspaceDir, "state", "beai", "new-session-context-pack.json");
  try {
    const stat = fs.statSync(filePath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (!Number.isFinite(ageMs) || ageMs > 1000 * 60 * 60 * 24) return undefined;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return asRecord(parsed);
  } catch {
    return undefined;
  }
}

function compactStringArray(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function buildPersistedHandoffFallback(
  workspaceDir: string | undefined,
  currentInput: string,
  sessionKey: string | undefined
): CarriedHandoffSeed | undefined {
  if (!isExplicitContinuityResumeRequest(currentInput)) return undefined;
  const pack = readPersistedNewSessionContextPack(workspaceDir);
  if (!pack) return undefined;
  const continuity = asRecord(pack.continuity);
  const arc = asRecord(pack.conversationArc);
  const opening =
    typeof pack.opening === "string" && pack.opening.trim()
      ? pack.opening.trim()
      : typeof continuity?.nextSessionOpening === "string" && continuity.nextSessionOpening.trim()
        ? continuity.nextSessionOpening.trim()
        : "";
  if (!opening) return undefined;
  const carry = compactStringArray(pack.carry, 6);
  const doNotCarry = compactStringArray(pack.doNotCarry, 6);
  const closureHandle =
    typeof continuity?.closureHandle === "string" && continuity.closureHandle.trim()
      ? continuity.closureHandle.trim()
      : typeof arc?.currentFlowContext === "string" && arc.currentFlowContext.trim()
        ? arc.currentFlowContext.trim()
        : "이전 세션의 마지막 판단 기준을 확인합니다.";
  const traceId = `beai-handoff-fallback:${sessionKey || "unknown"}:${Date.now()}`;
  const handoffState: BeaiTurnPlan["handoffState"] = {
    current_track:
      typeof continuity?.currentTrack === "string" && continuity.currentTrack.trim()
        ? continuity.currentTrack.trim()
        : typeof arc?.currentFlowContext === "string" && arc.currentFlowContext.trim()
          ? arc.currentFlowContext.trim()
          : "persisted session continuity",
    next_action:
      typeof continuity?.nextAction === "string" && continuity.nextAction.trim()
        ? continuity.nextAction.trim()
        : typeof arc?.nextIntent === "string" && arc.nextIntent.trim()
          ? arc.nextIntent.trim()
          : "이전 세션의 다음 행동을 확인합니다.",
    completed: compactStringArray(continuity?.completed, 8),
    in_progress: compactStringArray(continuity?.inProgress, 8),
    open_loops: compactStringArray(continuity?.openLoops, 8),
    decisions_made: compactStringArray(continuity?.lockedDecisions, 8),
    facts_locked: compactStringArray(continuity?.lockedDecisions, 8),
    closure_handle: closureHandle,
    do_not_carry: compactStringArray(continuity?.doNotCarry, 8),
    topics: compactStringArray(continuity?.inProgress, 8),
    new_session_opening_message: opening,
    carry_priority: {
      must_carry: carry,
      discard: doNotCarry
    }
  };
  const textParts = [opening, ...carry.slice(0, 4).map((item) => `이어갈 기준: ${item}`)];
  textParts.push(`마지막 판단 기준: ${closureHandle}`);
  if (doNotCarry.length > 0) textParts.push(`넘기지 않을 것: ${doNotCarry.slice(0, 3).join(", ")}`);
  return {
    text: textParts.join("\n\n"),
    handoffState,
    traceId,
    targetSessionKey: sessionKey,
    reason: "persisted_context_pack_fallback",
    injectionIdempotencyKey: `beai-handoff-fallback:${sessionKey || "unknown"}`
  };
}

function mergePlanningInput(currentInput: string, carriedHandoff: CarriedHandoffSeed | undefined): string {
  if (!carriedHandoff?.text) return currentInput;
  if (!currentInput) return carriedHandoff.text;
  return `${carriedHandoff.text}\n\nCurrent user request:\n${currentInput}`;
}

function applyCarriedHandoff(plan: BeaiTurnPlan, carriedHandoff: CarriedHandoffSeed | undefined): BeaiTurnPlan {
  const handoffState = carriedHandoff?.handoffState;
  if (!handoffState) return plan;
  const judgmentTags = plan.judgmentTags.includes("handoff_resume")
    ? plan.judgmentTags
    : [...plan.judgmentTags, "handoff_resume"];
  return {
    ...plan,
    judgmentTags,
    handoffState,
    continuityPatch: {
      ...plan.continuityPatch,
      current_focus: plan.continuityPatch.current_focus || handoffState.next_action || handoffState.current_track
    }
  };
}

type ResolvedTurnPlan = {
  plan: BeaiTurnPlan;
  source: "run" | "session";
};

function resolvePlanForTurnDetailed(ctx: { runId?: string; sessionKey?: string }): ResolvedTurnPlan | undefined {
  if (ctx.runId && runPlans.has(ctx.runId)) return { plan: runPlans.get(ctx.runId) as BeaiTurnPlan, source: "run" };
  if (ctx.sessionKey && sessionPlans.has(ctx.sessionKey)) return { plan: sessionPlans.get(ctx.sessionKey) as BeaiTurnPlan, source: "session" };
  return undefined;
}

function resolvePlanForTurn(ctx: { runId?: string; sessionKey?: string }): BeaiTurnPlan | undefined {
  return resolvePlanForTurnDetailed(ctx)?.plan;
}

function canHardHandleBeforeAgentReply(ctx: { runId?: string }, resolvedPlan: ResolvedTurnPlan | undefined): boolean {
  return Boolean(ctx.runId) && resolvedPlan?.source === "run";
}

function isTelegramDirectSession(ctx: { sessionKey?: string } | undefined): boolean {
  const sessionKey = typeof ctx?.sessionKey === "string" ? ctx.sessionKey : "";
  return /:telegram(?::[^:]+)?:direct:/.test(sessionKey);
}

function normalizeExecutionSurfaceText(text: string | undefined, plan: BeaiTurnPlan | undefined): string | undefined {
  const source = text?.trim();
  if (!source) return undefined;
  return normalizeExecutionReviewReply(source, plan) || source;
}

function isInstallGuideTurn(plan: BeaiTurnPlan | undefined): boolean {
  if (!plan) return false;
  const normalized = `${plan.objective || ""}\n${plan.currentTurn.cleanInput || ""}`.toLowerCase();
  if (!normalized.trim()) return false;
  return hasExplicitInstallGuideIntent(normalized);
}

function shouldSurfaceInstallGuide(plan: BeaiTurnPlan | undefined, installCandidate: InstallAttachmentCandidate | undefined): boolean {
  if (isInstallGuideTurn(plan)) return true;
  if (!plan || !installCandidate) return false;
  const input = `${plan.currentTurn.cleanInput}\n${plan.objective}`.toLowerCase();
  return looksLikeInstallGuideInput(input) || looksLikeApprovalContinuation(input) || Boolean(installCandidate.packageRef);
}

function isInstallResumeTurn(carriedHandoff: CarriedHandoffSeed | undefined): boolean {
  return Boolean(carriedHandoff?.installResume);
}

function buildInstallResumeSeed(
  plan: BeaiTurnPlan,
  installCandidate: InstallAttachmentCandidate | undefined,
  reason: string | undefined
): CarriedHandoffSeed | undefined {
  if (!isInstallGuideTurn(plan) && !installCandidate) return undefined;

  const lines = [
    "아까 하던 BEAI 설치를 gateway restart 뒤에 이어받겠습니다.",
    "이번에는 gateway / daemon 복구 확인, beai-runtime enabled 확인, 설치 결과 브리핑까지 바로 이어서 보겠습니다."
  ];
  if (installCandidate?.packageRef || installCandidate?.packageLabel) {
    const packageBits = [installCandidate.packageLabel, installCandidate.packageRef].filter(Boolean).join(" | ");
    lines.push(`설치 기준 패키지: ${packageBits}`);
  }

  const trimmedReason = typeof reason === "string" && reason.trim() ? reason.trim() : "gateway restart";
  return {
    text: lines.join("\n\n"),
    handoffState: {
      ...(plan.handoffState || {}),
      current_track: plan.handoffState?.current_track || "BEAI overlay install resume",
      open_loops: Array.from(new Set([...(plan.handoffState?.open_loops || []), "gateway / daemon 재확인", "설치 결과 브리핑 전달"])),
      next_action: "gateway / daemon 복구와 beai-runtime 활성화 상태를 먼저 다시 확인합니다.",
      closure_handle: plan.flowState.closureHandle,
      user_continuity_message:
        "재시작 직후에는 잠깐 응답이 없어 보여도 이상으로 단정하지 않고, 먼저 runtime 복구 여부와 plugin 활성화 상태부터 확인합니다.",
      new_session_opening_message: "아까 하던 설치 검증을 gateway restart 뒤에 이어서 진행하겠습니다."
    },
    reason: trimmedReason,
    installResume: {
      packageRef: installCandidate?.packageRef,
      packageLabel: installCandidate?.packageLabel,
      packageSource: installCandidate?.packageSource,
      restartReason: trimmedReason
    }
  };
}

function maybeQueueInboundProgressAck(event: {
  sessionKey?: string;
  context?: Record<string, unknown>;
  messages: string[];
}): string | undefined {
  const rawContent = typeof event.context?.content === "string" ? event.context.content : "";
  const currentInput = stripMetaEnvelope(rawContent);
  if (!looksLikeApprovalContinuation(currentInput) || currentInput.length > 24) return undefined;
  const sessionKey = event.sessionKey || "";
  const now = Date.now();
  const lastAckAt = recentInboundProgressAckAt.get(sessionKey) ?? 0;
  if (sessionKey && now - lastAckAt < 15_000) return undefined;
  const progressText = "요청을 받았고 실행 진입 여부를 확인 중입니다. 현재 상태를 먼저 점검한 뒤 바로 이어가겠습니다.";
  event.messages.push(progressText);
  if (sessionKey) recentInboundProgressAckAt.set(sessionKey, now);
  return progressText;
}

function rewriteReplyPayloadForExecutionReview(
  payload: ReplyPayloadLike,
  plan: BeaiTurnPlan | undefined
): ReplyPayloadLike | undefined {
  const rewrittenText = normalizeExecutionSurfaceText(payload.text, plan);
  if (!rewrittenText || rewrittenText === payload.text?.trim()) return undefined;
  return {
    ...payload,
    text: rewrittenText
  };
}

function rewriteReplyPayloadForTelegramUxState(
  payload: ReplyPayloadLike,
  delivery: Pick<LiveEvidenceEvent, "inboundChannel" | "outboundChannel">
): ReplyPayloadLike | undefined {
  if (!isTelegramDeliveryPath(delivery)) return undefined;
  const state = classifyTelegramUxState(payload.text);
  if (!state?.shouldAppendToPayload) return undefined;
  const guide =
    state.kind === "approval_wait"
      ? renderApprovalWaitGuide(payload.text)
      : state.kind === "internal_progress_surface"
        ? renderInternalProcessSurfaceGuide(payload.text)
        : renderTelegramUxStateGuide(state);
  if (payload.text?.includes("멈춘 게 아니라 승인 대기 상태입니다.") || payload.text?.includes("현재 상태 안내입니다.")) return undefined;
  return {
    ...payload,
    text: `${payload.text?.trim()}\n\n${guide}`
  };
}

function rewriteAssistantMessageForExecutionReview(
  message: AgentMessageLike,
  plan: BeaiTurnPlan | undefined
): AgentMessageLike | undefined {
  if (message.role !== "assistant") return undefined;

  if (typeof message.text === "string") {
    const rewrittenText = normalizeExecutionSurfaceText(message.text, plan);
    if (rewrittenText && rewrittenText !== message.text.trim()) {
      return {
        ...message,
        text: rewrittenText
      };
    }
  }

  if (typeof message.content === "string") {
    const rewrittenContent = normalizeExecutionSurfaceText(message.content, plan);
    if (rewrittenContent && rewrittenContent !== message.content.trim()) {
      return {
        ...message,
        content: rewrittenContent
      };
    }
  }

  if (Array.isArray(message.content)) {
    let changed = false;
    const rewrittenContent = message.content.map((block) => {
      if (!block || typeof block !== "object") return block;
      const textBlock = block as TextBlockLike;
      if (textBlock.type !== "text" || typeof textBlock.text !== "string") return block;
      const rewrittenText = normalizeExecutionSurfaceText(textBlock.text, plan);
      if (!rewrittenText || rewrittenText === textBlock.text.trim()) return block;
      changed = true;
      return {
        ...textBlock,
        text: rewrittenText
      };
    });
    if (changed) {
      return {
        ...message,
        content: rewrittenContent
      };
    }
  }

  return undefined;
}

function readAgentMessageText(message: AgentMessageLike): string {
  const parts: string[] = [];
  if (typeof message.text === "string") parts.push(message.text);
  if (typeof message.content === "string") parts.push(message.content);
  if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (!block || typeof block !== "object") continue;
      const textBlock = block as TextBlockLike;
      if (typeof textBlock.text === "string") parts.push(textBlock.text);
      else if (typeof textBlock.content === "string") parts.push(textBlock.content);
    }
  }
  return parts.join("\n").trim();
}

function rewriteInternalProcessTranscriptMessage(message: AgentMessageLike): AgentMessageLike | undefined {
  const source = readAgentMessageText(message);
  if (!isInternalProcessSurface(source)) return undefined;
  const replacement =
    message.role === "user"
      ? "[BEAI internal process surface isolated]\nOpenClaw internal progress/recovery text was not treated as a user request."
      : renderInternalProcessSurfaceGuide(source);

  if (typeof message.text === "string") {
    return { ...message, text: replacement };
  }
  if (typeof message.content === "string") {
    return { ...message, content: replacement };
  }
  if (Array.isArray(message.content)) {
    let replaced = false;
    const content = message.content.map((block) => {
      if (!block || typeof block !== "object") return block;
      const textBlock = block as TextBlockLike;
      const hasText = typeof textBlock.text === "string" || typeof textBlock.content === "string";
      if (!hasText || replaced) return block;
      replaced = true;
      return {
        ...textBlock,
        ...(typeof textBlock.text === "string" ? { text: replacement } : {}),
        ...(typeof textBlock.content === "string" ? { content: replacement } : {})
      };
    });
    return { ...message, content };
  }
  return { ...message, text: replacement };
}

export default definePluginEntry({
  id: "beai-runtime",
  name: "BEAI Runtime",
  description: "Runtime overlay that classifies turns, injects BEAI guidance, and hardens handoff replies.",
  register(api) {
    const getConfig = () => {
      try {
        return readConfig(api.runtime.config?.current?.()?.plugins?.entries?.["beai-runtime"] ?? api.pluginConfig);
      } catch {
        return { enabled: false, hardHandoffOverride: true, toolRiskObserver: false };
      }
    };
    const safeOn = (hookName: string, handler: (event: any, ctx: any) => unknown | Promise<unknown>): void => {
      (api.on as any)(hookName, async (event: any, ctx: any) => {
        try {
          return await handler(event, ctx);
        } catch (error) {
          const message = describeError(error);
          logHookEvent(api.logger, "info", "beai hook fail-soft", {
            hook: hookName,
            runId: event?.runId ?? null,
            sessionKey: event?.sessionKey ?? ctx?.sessionKey ?? null,
            error: message
          });
          appendLiveEvidence(resolveStateWorkspaceDir(ctx?.workspaceDir), {
            hook: hookName,
            action: "hook failed soft and BEAI output was skipped",
            evidenceLevel: "hook_observed",
            runId: event?.runId ?? null,
            sessionKey: event?.sessionKey ?? ctx?.sessionKey ?? null,
            confirmed: ["BEAI hook error was contained"],
            unknown: ["underlying OpenClaw/Gateway health is not verified by this hook"],
            preview: compactPreview(message),
            note: "BEAI hook errors must not block OpenClaw, Telegram, or Gateway reply flow."
          });
          return;
        }
      });
    };

    const safeOnSync = (hookName: string, handler: (event: any, ctx: any) => unknown): void => {
      (api.on as any)(hookName, (event: any, ctx: any) => {
        try {
          return handler(event, ctx);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logHookEvent(api.logger, "info", "beai hook fail-soft", {
            hook: hookName,
            error: message
          });
          appendLiveEvidence(resolveStateWorkspaceDir(ctx?.workspaceDir), {
            hook: hookName,
            action: "hook failed soft and BEAI output was skipped",
            evidenceLevel: "hook_observed",
            runId: ctx?.runId ?? null,
            sessionKey: ctx?.sessionKey ?? null,
            confirmed: ["BEAI hook error was contained"],
            unknown: ["underlying OpenClaw/Gateway health is not verified by this hook"],
            note: "Synchronous BEAI hook errors must not block OpenClaw persistence flow."
          });
          return;
        }
      });
    };

    api.registerCommand({
      name: "beai-runtime",
      description: "Show BEAI runtime hook status for the current host.",
      acceptsArgs: true,
      handler: async () => ({
        text: [
          "BEAI Runtime",
          `enabled: ${getConfig().enabled ? "true" : "false"}`,
          `hardHandoffOverride: ${getConfig().hardHandoffOverride ? "true" : "false"}`,
          `toolRiskObserver: ${getConfig().toolRiskObserver ? "true" : "false"}`,
          `cachedRunPlans: ${runPlans.size}`,
          resolveStateWorkspaceDir()
            ? `stateWorkspace: ${resolveStateWorkspaceDir()}`
            : "stateWorkspace: not resolved yet",
          resolveStateWorkspaceDir()
            ? `liveEvidence: ${liveEvidencePath(resolveStateWorkspaceDir() as string)}`
            : "liveEvidence: workspace not seen yet"
        ].join("\n")
      })
    });

    if (getConfig().toolRiskObserver) {
      safeOn("before_tool_call", async (event, ctx) => {
        const config = getConfig();
        if (!config.enabled || !config.toolRiskObserver) return;
        const classification = classifyToolCallRisk({
          toolName: event.toolName,
          params: event.params,
          toolKind: event.toolKind,
          toolInputKind: event.toolInputKind,
          derivedPaths: event.derivedPaths
        });
        logHookEvent(api.logger, classification.riskLevel === "high" ? "info" : "debug", "beai hook: before_tool_call classified risk", {
          runId: event.runId ?? ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          toolName: classification.toolName,
          riskLevel: classification.riskLevel,
          action: classification.action,
          reasons: classification.reasons,
          derivedPaths: classification.derivedPaths
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_tool_call",
          action: `tool risk classified: ${classification.riskLevel}`,
          evidenceLevel: "hook_observed",
          runId: event.runId ?? ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          confirmed: [`tool: ${classification.toolName}`, `risk: ${classification.riskLevel}`],
          assumptions: classification.reasons,
          needsVerification: classification.action === "recommend_approval" ? ["user approval policy is not enforced by BEAI observer mode"] : undefined,
          note: "Tool risk observer is opt-in because registering before_tool_call can promote Codex app-server approval policy and surface command approval cards."
        });
        return;
      });
    }

    safeOn("after_tool_call", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const semantics = classifyToolResultSemantics({
        toolName: event.toolName,
        result: event.result,
        error: event.error,
        durationMs: event.durationMs
      });
      logHookEvent(api.logger, semantics.state === "failed" ? "info" : "debug", "beai hook: after_tool_call classified result", {
        runId: event.runId ?? ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        toolName: semantics.toolName,
        state: semantics.state,
        durationMs: semantics.durationMs,
        shouldPersistDetails: semantics.shouldPersistDetails
      });
      appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
        hook: "after_tool_call",
        action: `tool result classified: ${semantics.state}`,
        evidenceLevel: "hook_observed",
        runId: event.runId ?? ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        confirmed: [`tool: ${semantics.toolName}`, `result_state: ${semantics.state}`],
        assumptions: semantics.reasons,
        note: "BEAI observer mode records result semantics without changing tool output."
      });
      const turnPlan = resolvePlanForTurn({ runId: event.runId ?? ctx.runId, sessionKey: ctx.sessionKey });
      trackPhaseTimingContract(
        resolveStateWorkspaceDir(ctx.workspaceDir),
        turnPlan,
        { runId: event.runId ?? ctx.runId, sessionKey: ctx.sessionKey },
        "after_tool_call"
      );
      recordQuickFirstStatusGapIfNeeded(
        resolveStateWorkspaceDir(ctx.workspaceDir),
        { runId: event.runId ?? ctx.runId, sessionKey: ctx.sessionKey },
        turnPlan,
        "after_tool_call"
      );
      recordVisibleProgressGapIfNeeded(
        resolveStateWorkspaceDir(ctx.workspaceDir),
        { runId: event.runId ?? ctx.runId, sessionKey: ctx.sessionKey },
        turnPlan,
        "after_tool_call"
      );
      return;
    });

    safeOnSync("tool_result_persist", (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const semantics = classifyToolResultSemantics({
        toolName: event.toolName,
        result: event.message
      });
      const sanitization = sanitizePersistedToolResultMessage(event.message, event.toolName);
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "tool_result_persist",
        action: sanitization.changed ? "tool result transcript surface bounded" : "tool result persistence observed",
        evidenceLevel: sanitization.changed ? "surface_rewritten" : "hook_observed",
        runId: null,
        sessionKey: ctx.sessionKey ?? null,
        confirmed: [`tool: ${semantics.toolName}`, `persistence: ${semantics.shouldPersistDetails}`],
        assumptions: [...semantics.reasons, sanitization.reason],
        preview: sanitization.changed ? `original_chars: ${sanitization.originalChars}` : undefined,
        note: sanitization.changed
          ? "Persisted tool result was bounded to prevent internal/system context leakage in transcript surfaces."
          : "Tool result persistence observed without rewrite."
      });
      if (sanitization.changed) return { message: sanitization.message as typeof event.message };
      return;
    });

    safeOn("before_prompt_build", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const stateWorkspaceDir = resolveStateWorkspaceDir(ctx.workspaceDir);
      const currentInput = extractCurrentUserInput(event);
      const carriedHandoff =
        resolveCarriedHandoffForTurn(ctx) ||
        buildPersistedHandoffFallback(stateWorkspaceDir, currentInput, ctx.sessionKey);
      const installCandidate = resolveInstallCandidateForTurn(ctx);
      const shouldAttachInstallCandidate =
        Boolean(installCandidate) &&
        (looksLikeInstallGuideInput(currentInput) || (looksLikeApprovalContinuation(currentInput) && Boolean(installCandidate)));
      const planningInput = shouldAttachInstallCandidate
        ? attachInstallCandidateToInput(currentInput, installCandidate)
        : currentInput;
      const planInput = mergePlanningInput(planningInput, carriedHandoff);
      const liveContextUsagePct = ctx.sessionKey ? sessionLiveContextUsagePct.get(ctx.sessionKey) : undefined;
      const plan = applyCarriedHandoff(
        buildTurnPlan(planInput, {
          liveSessionContextUsagePct: liveContextUsagePct
        }),
        carriedHandoff
      );
      if (installCandidate && ctx.sessionKey && (looksLikeInstallGuideInput(currentInput) || looksLikeApprovalContinuation(currentInput))) {
        sessionInstallIntents.set(`session:${ctx.sessionKey}`, installCandidate);
      }
      if (ctx.runId) runPlans.set(ctx.runId, plan);
      if (ctx.sessionKey) sessionPlans.set(ctx.sessionKey, plan);
      trackVisibleProgressContract(plan, { runId: ctx.runId ?? null, sessionKey: ctx.sessionKey ?? null });
      trackQuickFirstStatusContract(stateWorkspaceDir, plan, { runId: ctx.runId ?? null, sessionKey: ctx.sessionKey ?? null });
      trackPhaseTimingContract(stateWorkspaceDir, plan, { runId: ctx.runId ?? null, sessionKey: ctx.sessionKey ?? null }, "before_prompt_build");
      if (ctx.runId && ctx.sessionKey && carriedHandoff) sessionHandoffSeeds.delete(ctx.sessionKey);
      if (carriedHandoff?.reason === "persisted_context_pack_fallback") {
        appendContinuityTrace(stateWorkspaceDir, {
          event: "persisted_context_pack_fallback_applied",
          timestamp: new Date().toISOString(),
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          traceId: carriedHandoff.traceId ?? null,
          targetSessionKey: ctx.sessionKey ?? null,
          injectionIdempotencyKey: carriedHandoff.injectionIdempotencyKey ?? null,
          reason: carriedHandoff.reason,
          hasStructuredHandoffState: Boolean(carriedHandoff.handoffState),
          openingMessage: carriedHandoff.handoffState?.new_session_opening_message ?? null,
          preview: compactPreview(carriedHandoff.text)
        });
      }
      logHookEvent(api.logger, "debug", "beai hook: before_prompt_build planned", {
        runId: ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        mode: plan.mode,
        primaryClass: plan.primaryClass,
        riskLevel: plan.riskLevel,
        responseStrategy: plan.responseStrategy,
        carriedHandoff: Boolean(carriedHandoff?.text),
        installCandidate: installCandidate?.packageRef ?? null,
        liveContextUsagePct: liveContextUsagePct ?? null,
        planningInputPreview: planInput.slice(0, 120)
      });
      appendLiveEvidence(stateWorkspaceDir, {
        hook: "before_prompt_build",
        action: "runtime plan created and overlay prepared",
        evidenceLevel: "runtime_plan_created",
        runId: ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        ...summarizeEvidence(plan),
        preview: compactPreview(plan.currentTurn.cleanInput),
        note: "This confirms BEAI runtime planning and overlay preparation, not final answer quality."
      });
      const companionProfile = loadCompanionProfile(stateWorkspaceDir);
      return { prependContext: renderPromptContext(plan, companionProfile) };
    });

    safeOn("llm_output", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      if (!ctx.sessionKey) return;
      const sample = extractLiveContextUsageSample(event);
      if (!sample) return;
      sessionLiveContextUsagePct.set(ctx.sessionKey, sample.percent);
      logHookEvent(api.logger, "debug", "beai hook: llm_output captured live context usage", {
        sessionKey: ctx.sessionKey,
        runId: event.runId ?? null,
        percent: sample.percent,
        inputTokens: sample.inputTokens ?? null,
        contextWindow: sample.contextWindow ?? null,
        source: sample.source ?? null
      });
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "llm_output",
        action: "live context usage sampled",
        evidenceLevel: "status_sampled",
        runId: event.runId ?? null,
        sessionKey: ctx.sessionKey,
        confirmed: [`context_usage_pct: ${sample.percent}`],
        unknown: [],
        preview: null,
        note: `This records context pressure only, not response correctness. source=${sample.source ?? "unknown"}`
      });
    });

    safeOn("inbound_claim", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const candidate = extractInstallAttachmentCandidate({
        content: event.content,
        metadata: event.metadata,
        messageId: event.messageId,
        sessionKey: event.sessionKey ?? ctx.sessionKey,
        conversationId: event.conversationId,
        parentConversationId: event.parentConversationId,
        threadId: event.threadId,
        from: event.channel
      });
      if (!candidate?.sessionKey) return;
      sessionInstallCandidates.set(candidate.sessionKey, candidate);
      logHookEvent(api.logger, "info", "beai hook: inbound_claim captured install package candidate", {
        sessionKey: candidate.sessionKey,
        packageRef: candidate.packageRef,
        messageId: candidate.messageId ?? null
      });
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "inbound_claim",
        action: "install package candidate captured",
        evidenceLevel: "hook_observed",
        sessionKey: candidate.sessionKey,
        confirmed: ["inbound attachment candidate detected"],
        unknown: ["package contents not verified by this hook"],
        preview: compactPreview(candidate.packageLabel || candidate.packageRef)
      });
      return;
    });

    safeOn("message_received", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const candidate = extractInstallAttachmentCandidate({
        content: event.content,
        metadata: event.metadata,
        messageId: event.messageId,
        sessionKey: event.sessionKey ?? ctx.sessionKey,
        threadId: event.threadId,
        from: event.from
      });
      if (!candidate?.sessionKey) return;
      sessionInstallCandidates.set(candidate.sessionKey, candidate);
      logHookEvent(api.logger, "info", "beai hook: message_received captured install package candidate", {
        sessionKey: candidate.sessionKey,
        packageRef: candidate.packageRef,
        messageId: candidate.messageId ?? null
      });
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "message_received",
        action: "install package candidate captured",
        evidenceLevel: "hook_observed",
        sessionKey: candidate.sessionKey,
        confirmed: ["message attachment candidate detected"],
        unknown: ["package contents not verified by this hook"],
        preview: compactPreview(candidate.packageLabel || candidate.packageRef)
      });
    });

    safeOn("agent_turn_prepare", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const stateWorkspaceDir = resolveStateWorkspaceDir(ctx.workspaceDir);
      const carriedHandoff = extractQueuedHandoffSeed(Array.isArray(event.queuedInjections) ? event.queuedInjections : []);
      if (!carriedHandoff) return;
      if (ctx.runId) runHandoffSeeds.set(ctx.runId, carriedHandoff);
      if (ctx.sessionKey) sessionHandoffSeeds.set(ctx.sessionKey, carriedHandoff);
      appendContinuityTrace(stateWorkspaceDir, {
        event: "agent_turn_prepare_captured",
        timestamp: new Date().toISOString(),
        runId: ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        traceId: carriedHandoff.traceId ?? null,
        sourceSessionKey: carriedHandoff.sourceSessionKey ?? null,
        targetSessionKey: carriedHandoff.targetSessionKey ?? ctx.sessionKey ?? null,
        injectionIdempotencyKey: carriedHandoff.injectionIdempotencyKey ?? null,
        reason: carriedHandoff.reason ?? null,
        hasStructuredHandoffState: Boolean(carriedHandoff.handoffState),
        openingMessage: carriedHandoff.handoffState?.new_session_opening_message ?? null,
        preview: compactPreview(carriedHandoff.text)
      });
      logHookEvent(api.logger, "debug", "beai hook: agent_turn_prepare captured handoff seed", {
        runId: ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        hasStructuredHandoffState: Boolean(carriedHandoff.handoffState)
      });
      appendLiveEvidence(stateWorkspaceDir, {
        hook: "agent_turn_prepare",
        action: "queued handoff seed captured",
        evidenceLevel: "hook_observed",
        runId: ctx.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        confirmed: [Boolean(carriedHandoff.handoffState) ? "structured handoff state present" : "handoff text present"],
        unknown: ["next turn answer quality not yet verified"],
        preview: compactPreview(carriedHandoff.text)
      });
      return;
    });

    safeOn("before_agent_reply", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const resolvedPlan = resolvePlanForTurnDetailed(ctx);
      const plan = resolvedPlan?.plan;
      const allowHardReplyIntervention = canHardHandleBeforeAgentReply(ctx, resolvedPlan);
      const carriedHandoff = resolveCarriedHandoffForTurn(ctx);
      if (!plan) return;
      const installCandidate = resolveInstallCandidateForTurn(ctx);
      if (allowHardReplyIntervention && shouldOfferCompanionSetup(plan.currentTurn.cleanInput) && decideSurfaceIntervention(plan, "companion_setup").allowHardRewrite) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "companion setup surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(plan.currentTurn.cleanInput)
        });
        return {
          handled: true,
          reason: "beai-companion-setup",
          reply: { text: renderCompanionSetupPrompt() }
        };
      }
      if (allowHardReplyIntervention && isInstallResumeTurn(carriedHandoff) && config.hardHandoffOverride && decideSurfaceIntervention(plan, "install_resume").allowHardRewrite) {
        const installResume = carriedHandoff?.installResume;
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply install resume override", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel,
          installCandidate: installResume?.packageRef ?? null
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "install resume surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: ["install resume seed present"],
          unknown: ["package contents not verified by this hook"],
          preview: compactPreview(installResume?.packageLabel || installResume?.packageRef),
          note: "Install/check intent is preserved before approval, state hygiene, recovery, delegation, memory, or skill-candidate surfaces."
        });
        return {
          handled: true,
          reason: "beai-install-resume-runtime",
          reply: {
            text: renderInstallResumeReply(installResume
              ? {
                  packageRef: installResume.packageRef,
                  packageLabel: installResume.packageLabel,
                  packageSource: installResume.packageSource,
                  resumeAfterRestart: true,
                  restartReason: installResume.restartReason
                }
              : undefined)
          }
        };
      }
      if (allowHardReplyIntervention && shouldSurfaceInstallGuide(plan, installCandidate) && config.hardHandoffOverride && decideSurfaceIntervention(plan, "install_guide").allowHardRewrite) {
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply install guide override", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel,
          installCandidate: installCandidate?.packageRef ?? null
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "install guide surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: ["install guide intent detected"],
          unknown: ["package contents not verified by this hook"],
          preview: compactPreview(installCandidate?.packageLabel || installCandidate?.packageRef || plan.currentTurn.cleanInput),
          note: "Install/check intent is preserved before approval, state hygiene, recovery, delegation, memory, or skill-candidate surfaces."
        });
        return {
          handled: true,
          reason: "beai-install-guide-runtime",
          reply: {
            text: renderInstallGuideReply(plan, installCandidate
              ? {
                  packageRef: installCandidate.packageRef,
                  packageLabel: installCandidate.packageLabel,
                  packageSource: installCandidate.packageSource
                }
              : undefined)
          }
        };
      }
      if (allowHardReplyIntervention && shouldRenderApprovalBoundarySurface(plan) && decideSurfaceIntervention(plan, "approval_boundary").allowHardRewrite) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "approval boundary surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: [
            ...(summarizeEvidence(plan).confirmed || []),
            `approval_required: ${plan.operatingJudgment.risk.approvalRequired}`,
            `strong_approval_required: ${plan.operatingJudgment.risk.strongApprovalRequired}`
          ],
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: "This explains approval boundaries without auto-approval, approval policy changes, or tool execution."
        });
        return {
          handled: true,
          reason: "beai-approval-boundary-surface",
          reply: { text: renderApprovalBoundarySurfaceReply(plan) || "" }
        };
      }
      if (allowHardReplyIntervention && shouldRenderStateHygieneSurface(plan) && decideSurfaceIntervention(plan, "state_hygiene").allowHardRewrite) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "state hygiene surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: [
            ...(summarizeEvidence(plan).confirmed || []),
            `state_hygiene: ${plan.operatingJudgment.stateHygiene.classes.join(", ") || "none"}`
          ],
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: "This separates active state from historical residue; it does not delete task, transcript, memory, or state files."
        });
        return {
          handled: true,
          reason: "beai-state-hygiene-surface",
          reply: { text: renderStateHygieneSurfaceReply(plan) || "" }
        };
      }
      if (isTelegramDirectSession(ctx) && shouldRenderRecoverySummary(plan.currentTurn.cleanInput)) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "telegram direct recovery surface deferred to model",
          evidenceLevel: "hook_observed",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: `Telegram direct delivery path must not be hard-handled by BEAI recovery surfaces. plan_source=${resolvedPlan?.source ?? "unknown"}`
        });
        return;
      }
      if (allowHardReplyIntervention && shouldRenderRecoverySummary(plan.currentTurn.cleanInput) && decideSurfaceIntervention(plan, "recovery").allowHardRewrite) {
        const occurrence = nextRecoveryOccurrence(ctx.sessionKey, plan.currentTurn.cleanInput);
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: occurrence > 1 ? "recovery escalation surface returned" : "recovery summary surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: `This confirms recovery classification surface, not live external recovery. occurrence=${occurrence}`
        });
        return {
          handled: true,
          reason: occurrence > 1 ? "beai-recovery-escalation" : "beai-recovery-summary",
          reply: { text: renderRecoveryEscalationReply(plan.currentTurn.cleanInput, occurrence) }
        };
      }
      if (allowHardReplyIntervention && shouldRenderDelegationSurface(plan) && decideSurfaceIntervention(plan, "delegation").allowHardRewrite) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "delegation surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: [
            ...(summarizeEvidence(plan).confirmed || []),
            `delegation_candidate: ${plan.operatingJudgment.delegation.candidate}`,
            `delegation_level: ${plan.operatingJudgment.delegation.level}`
          ],
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: "This confirms delegation candidate explanation, not automatic skill, agent, workflow, or cron execution."
        });
        return {
          handled: true,
          reason: "beai-delegation-surface",
          reply: { text: renderDelegationSurfaceReply(plan) || "" }
        };
      }
      if (allowHardReplyIntervention && shouldTranslateCapability(plan.currentTurn.cleanInput) && decideSurfaceIntervention(plan, "capability_translation").allowHardRewrite) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "capability translation surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(plan.currentTurn.cleanInput),
          note: "This confirms capability translation interception, not actual capability creation."
        });
        return {
          handled: true,
          reason: "beai-capability-translation",
          reply: { text: renderCapabilityTranslationReply(plan.currentTurn.cleanInput) }
        };
      }
      const sessionSplitReply = renderSessionSplitApprovalReply(plan);
      if (allowHardReplyIntervention && sessionSplitReply && decideSurfaceIntervention(plan, "session_split").allowHardRewrite) {
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply session split approval", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel,
          sessionPressure: plan.sessionPressure?.level ?? null
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "session split approval surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          confirmed: [...(summarizeEvidence(plan).confirmed || []), `session_pressure: ${plan.sessionPressure?.level ?? "unknown"}`],
          preview: compactPreview(sessionSplitReply)
        });
        return {
          handled: true,
          reason: "beai-session-split-approval",
          reply: { text: sessionSplitReply }
        };
      }
      if (allowHardReplyIntervention && plan.mode === "handoff" && config.hardHandoffOverride && (plan.riskLevel === "high" || plan.requiresUserConfirmation) && decideSurfaceIntervention(plan, "handoff").allowHardRewrite) {
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply handoff override", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "work order surface returned",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(plan.objective)
        });
        return {
          handled: true,
          reason: "beai-handoff-runtime",
          reply: { text: renderWorkOrderReply(plan) }
        };
      }
      const normalizedReply = normalizeExecutionSurfaceText(event.cleanedBody, plan);
      if (allowHardReplyIntervention && normalizedReply && normalizedReply !== event.cleanedBody.trim() && decideSurfaceIntervention(plan, "execution_review").allowHardRewrite) {
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply normalized execution review", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "execution review normalized",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(normalizedReply),
          note: "This confirms response normalization, not external result completion."
        });
        return {
          handled: true,
          reason: "beai-execution-review-reply",
          reply: { text: applySurfaceLanguageGuard(normalizedReply, plan) }
        };
      }
      const sanitized = sanitizeUserFacingReply(event.cleanedBody, plan);
      if (allowHardReplyIntervention && sanitized && sanitized !== event.cleanedBody.trim()) {
        logHookEvent(api.logger, "info", "beai hook: before_agent_reply sanitized reply", {
          runId: ctx.runId ?? null,
          mode: plan.mode,
          primaryClass: plan.primaryClass,
          riskLevel: plan.riskLevel
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "before_agent_reply",
          action: "user-facing reply sanitized",
          evidenceLevel: "surface_rewritten",
          runId: ctx.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(sanitized),
          note: "This confirms surface cleanup, not factual verification of the answer."
        });
        return {
          handled: true,
          reason: "beai-user-sanitized",
          reply: { text: sanitized }
        };
      }
      return;
    });

    safeOn("reply_payload_sending", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const plan = resolvePlanForTurn({ runId: event.runId, sessionKey: event.sessionKey ?? ctx.sessionKey });
      const delivery = classifyDeliveryPath(event, ctx, event.payload?.text);
      if (isTelegramDeliveryPath(delivery)) {
        const visibleCandidate = isTelegramVisibleDeliveryCandidate(delivery, event.payload?.text);
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "reply_payload_sending",
          action: visibleCandidate ? "telegram visible delivery candidate observed" : "telegram visible delivery contract risk observed",
          evidenceLevel: "delivery_contract_observed",
          runId: event.runId ?? null,
          sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
          ...delivery,
          ...summarizeEvidence(plan),
          confirmed: visibleCandidate
            ? ["outbound telegram payload reached reply_payload_sending", "payload is not an internal handoff artifact"]
            : ["telegram delivery path observed without visible-delivery proof"],
          unknown: ["Telegram provider messageId is verified after message send, not by this BEAI hook"],
          preview: compactPreview(event.payload?.text),
          note: visibleCandidate
            ? "BEAI delivery contract observation: this is a Telegram-visible candidate only; completion still requires the source-channel send result/messageId."
            : "BEAI delivery contract risk: internal final_answer, handoff, sessions_send, or empty payload must not be counted as Telegram-visible completion."
        });
      }
      const uxStatePayload = rewriteReplyPayloadForTelegramUxState(event.payload, delivery);
      if (uxStatePayload) {
        const uxState = classifyTelegramUxState(event.payload?.text);
        logHookEvent(api.logger, "info", "beai hook: reply_payload_sending added Telegram UX state guide", {
          runId: event.runId ?? null,
          sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
          kind: event.kind,
          uxState: uxState?.kind ?? null,
          outboundChannel: delivery.outboundChannel,
          loopRiskClassification: delivery.loopRiskClassification
        });
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "reply_payload_sending",
          action: "telegram ux state guide added",
          evidenceLevel: "surface_rewritten",
          runId: event.runId ?? null,
          sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
          ...delivery,
          ...summarizeEvidence(plan),
          confirmed: uxState ? [`telegram_ux_state: ${uxState.kind}`] : undefined,
          preview: compactPreview(typeof uxStatePayload.text === "string" ? uxStatePayload.text : undefined),
          note: "This confirms Telegram UX state guidance without replacing the original payload, auto-approval, or gateway control."
        });
        return { payload: uxStatePayload };
      }
      if (delivery.loopRiskClassification) {
        appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
          hook: "reply_payload_sending",
          action: "delivery loop risk observed",
          evidenceLevel: "hook_observed",
          runId: event.runId ?? null,
          sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
          ...delivery,
          ...summarizeEvidence(plan),
          preview: compactPreview(event.payload?.text),
          note: "This records delivery-path risk only; BEAI does not route or resend the message."
        });
      }
      const rewrittenPayload = rewriteReplyPayloadForExecutionReview(event.payload, plan);
      if (!rewrittenPayload) return;
      logHookEvent(api.logger, "info", "beai hook: reply_payload_sending normalized execution review", {
        runId: event.runId ?? null,
        sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
        kind: event.kind
      });
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "reply_payload_sending",
        action: "execution review payload normalized",
        evidenceLevel: "surface_rewritten",
        runId: event.runId ?? null,
        sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
        ...delivery,
        ...summarizeEvidence(plan),
        preview: compactPreview(typeof rewrittenPayload.text === "string" ? rewrittenPayload.text : undefined),
        note: "This confirms outbound payload normalization."
      });
      return { payload: rewrittenPayload };
    });

    safeOn("message_sent", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const delivery = classifySentDeliveryPath(event, ctx, event.content);
      if (!isTelegramDeliveryPath(delivery)) return;
      const messageId = typeof event.messageId === "string" && event.messageId.trim() ? event.messageId.trim() : null;
      const success = event.success === true;
      if (success && messageId) {
        lastVerifiedTelegramDeliveryAt = Date.now();
        clearVisibleProgressContract(event.runId ?? ctx.runId, event.sessionKey ?? ctx.sessionKey);
        clearQuickFirstStatusContract(event.runId ?? ctx.runId, event.sessionKey ?? ctx.sessionKey);
      }
      trackPhaseTimingContract(
        resolveStateWorkspaceDir(ctx.workspaceDir),
        resolvePlanForTurn({ runId: event.runId ?? ctx.runId, sessionKey: event.sessionKey ?? ctx.sessionKey }),
        { runId: event.runId ?? ctx.runId, sessionKey: event.sessionKey ?? ctx.sessionKey },
        "message_sent"
      );
      appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
        hook: "message_sent",
        action: success && messageId ? "telegram visible delivery verified" : "telegram visible delivery unverified",
        evidenceLevel: success && messageId ? "visible_delivery_verified" : "delivery_contract_observed",
        runId: event.runId ?? ctx.runId ?? null,
        sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
        messageId,
        deliverySuccess: success,
        ...delivery,
        ...summarizeEvidence(resolvePlanForTurn({ runId: event.runId ?? ctx.runId, sessionKey: event.sessionKey ?? ctx.sessionKey })),
        confirmed: success && messageId
          ? ["Telegram message_sent hook observed", `messageId: ${messageId}`]
          : ["Telegram message_sent hook observed without verified messageId"],
        unknown: success && messageId
          ? ["User read/acceptance is not implied by delivery"]
          : ["Telegram provider delivery may have failed or omitted messageId"],
        preview: compactPreview(event.content),
        note: success && messageId
          ? "BEAI delivery contract closure: Telegram visible delivery reached message_sent with messageId evidence."
          : `BEAI delivery contract remains open: message_sent success=${success}, messageId=${messageId ?? "missing"}.`
      });
    });

    safeOnSync("before_message_write", (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const plan = resolvePlanForTurn({ sessionKey: event.sessionKey ?? ctx.sessionKey });
      const internalProcessMessage = rewriteInternalProcessTranscriptMessage(event.message);
      if (internalProcessMessage) {
        appendLiveEvidence(resolveStateWorkspaceDir(), {
          hook: "before_message_write",
          action: "internal process transcript surface isolated",
          evidenceLevel: "surface_rewritten",
          sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(readAgentMessageText(event.message)),
          note: "Internal progress/recovery surfaces are not persisted as user instructions."
        });
        return { message: internalProcessMessage as typeof event.message };
      }
      const rewrittenMessage = rewriteAssistantMessageForExecutionReview(event.message, plan);
      if (!rewrittenMessage) return;
      appendLiveEvidence(resolveStateWorkspaceDir(), {
        hook: "before_message_write",
        action: "assistant transcript message normalized",
        evidenceLevel: "surface_rewritten",
        sessionKey: event.sessionKey ?? ctx.sessionKey ?? null,
        ...summarizeEvidence(plan),
        preview: compactPreview(typeof (rewrittenMessage as AgentMessageLike).text === "string" ? (rewrittenMessage as AgentMessageLike).text : undefined),
        note: "This confirms transcript persistence rewrite."
      });
      return { message: rewrittenMessage as typeof event.message };
    });

    safeOn("before_agent_finalize", async (event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      const stateWorkspaceDir = resolveStateWorkspaceDir(ctx.workspaceDir);
      const plan = resolvePlanForTurn({ runId: event.runId, sessionKey: ctx.sessionKey });
      const rawFinalText = event.lastAssistantMessage?.trim() || "";
      const normalizedExecutionReview = normalizeExecutionReviewReply(rawFinalText, plan);
      recordVisibleProgressGapIfNeeded(
        stateWorkspaceDir,
        { runId: event.runId ?? null, sessionKey: ctx.sessionKey ?? null },
        plan,
        "before_agent_finalize"
      );
      trackPhaseTimingContract(
        stateWorkspaceDir,
        plan,
        { runId: event.runId ?? null, sessionKey: ctx.sessionKey ?? null },
        "before_agent_finalize"
      );
      recordQuickFirstStatusGapIfNeeded(
        stateWorkspaceDir,
        { runId: event.runId ?? null, sessionKey: ctx.sessionKey ?? null },
        plan,
        "before_agent_finalize"
      );
      if (normalizedExecutionReview && normalizedExecutionReview !== rawFinalText) {
        appendLiveEvidence(stateWorkspaceDir, {
          hook: "before_agent_finalize",
          action: "final answer revision requested for execution review",
          evidenceLevel: "surface_rewritten",
          runId: event.runId ?? null,
          sessionKey: ctx.sessionKey ?? null,
          ...summarizeEvidence(plan),
          preview: compactPreview(normalizedExecutionReview),
          note: "This confirms a final-answer rewrite request, not completion of the underlying task."
        });
        return {
          action: "revise",
          reason: "beai-execution-review-finalize-rewrite",
          retry: {
            instruction: [
              "기존 최종 답변은 내부 execution review 원문 형식입니다.",
              "사용자에게 보여줄 최종 답변을 아래 텍스트 그대로 다시 출력하세요.",
              "새 사실을 추가하지 말고, 제목이나 라벨을 붙이지 말고, 아래 본문만 출력하세요.",
              "",
              normalizedExecutionReview
            ].join("\n"),
            idempotencyKey: `beai-execution-review-finalize-rewrite:${event.runId ?? ctx.sessionKey ?? "unknown"}`,
            maxAttempts: 1
          }
        };
      }
      const finalText = normalizedExecutionReview || rawFinalText;
      const memoryPatch = compactWorkingMemoryPatch({
        ...plan?.continuityPatch,
        last_assistant_answer: summarizeReply(finalText),
        last_sentence: finalText ? `최종 응답 요약: ${summarizeReply(finalText)}` : plan?.continuityPatch.last_sentence,
        current_artifact: plan?.continuityPatch.current_artifact,
        recent_constraints: plan?.continuityPatch.recent_constraints,
        current_focus: plan?.continuityPatch.current_focus
      });
      updateWorkingMemory(stateWorkspaceDir, memoryPatch);
      if (plan) {
        updateProjectStateSnapshot(stateWorkspaceDir, plan, finalText);
        updateAgreementCandidates(stateWorkspaceDir, plan, finalText);
        updateBeaiMemoryAssets(stateWorkspaceDir, plan, finalText);
        updateSessionContinuityState(stateWorkspaceDir, plan);
        if (shouldSaveCompanionProfile(plan.currentTurn.cleanInput)) {
          saveCompanionProfile(
            stateWorkspaceDir,
            buildCompanionProfileFromText(plan.currentTurn.cleanInput, loadCompanionProfile(stateWorkspaceDir))
          );
        }
      }
      logHookEvent(api.logger, "debug", "beai hook: before_agent_finalize updated memory", {
        runId: event.runId ?? null,
        hasFinalText: Boolean(finalText),
        memoryKeys: Object.keys(memoryPatch).filter((key) => {
          const value = memoryPatch[key as keyof typeof memoryPatch];
          return Array.isArray(value) ? value.length > 0 : Boolean(value);
        })
      });
      appendLiveEvidence(stateWorkspaceDir, {
        hook: "before_agent_finalize",
        action: "memory and BEAI state assets updated",
        evidenceLevel: "asset_written",
        runId: event.runId ?? null,
        sessionKey: ctx.sessionKey ?? null,
        ...summarizeEvidence(plan),
        confirmed: Object.keys(memoryPatch)
          .filter((key) => {
            const value = memoryPatch[key as keyof typeof memoryPatch];
            return Array.isArray(value) ? value.length > 0 : Boolean(value);
          })
          .map((key) => `working_memory_patch: ${key}`),
        unknown: ["user acceptance of memory candidates is not implied"],
        preview: compactPreview(finalText),
        note: "This records BEAI-owned asset writes; agreement candidates are not automatically accepted."
      });
      if (event.runId) {
        runPlans.delete(event.runId);
        runHandoffSeeds.delete(event.runId);
      }
      clearVisibleProgressContract(event.runId ?? null, ctx.sessionKey ?? null);
      clearQuickFirstStatusContract(event.runId ?? null, ctx.sessionKey ?? null);
      clearPhaseTimingContract(event.runId ?? null, ctx.sessionKey ?? null);
      if (ctx.sessionKey && !plan?.sessionPressure?.shouldAskForSplitApproval) {
        // Keep install candidate during the session, but clear explicit intent after a finalized turn.
        sessionInstallIntents.delete(`session:${ctx.sessionKey}`);
      }
      return { action: "continue" };
    });

    safeOn("after_compaction", async (_event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      if (!ctx.sessionKey) return;
      sessionLiveContextUsagePct.delete(ctx.sessionKey);
      logHookEvent(api.logger, "debug", "beai hook: after_compaction cleared live context usage cache", {
        sessionKey: ctx.sessionKey
      });
      appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
        hook: "after_compaction",
        action: "live context usage cache cleared",
        evidenceLevel: "hook_observed",
        sessionKey: ctx.sessionKey,
        confirmed: ["session context cache cleared"],
        unknown: ["post-compaction answer quality not verified by this hook"]
      });
    });

    safeOn("before_reset", async (_event, ctx) => {
      const config = getConfig();
      if (!config.enabled) return;
      if (!ctx.sessionKey) return;
      sessionLiveContextUsagePct.delete(ctx.sessionKey);
      recentInboundProgressAckAt.delete(ctx.sessionKey);
      sessionInstallCandidates.delete(`session:${ctx.sessionKey}`);
      sessionInstallIntents.delete(`session:${ctx.sessionKey}`);
      logHookEvent(api.logger, "debug", "beai hook: before_reset cleared session runtime state", {
        sessionKey: ctx.sessionKey
      });
      appendLiveEvidence(resolveStateWorkspaceDir(ctx.workspaceDir), {
        hook: "before_reset",
        action: "session runtime state cleared",
        evidenceLevel: "hook_observed",
        sessionKey: ctx.sessionKey,
        confirmed: ["session runtime maps cleared"],
        unknown: ["external OpenClaw state not modified by this evidence event"]
      });
    });

    safeOn("session_end", async (event) => {
      if (!event.sessionKey) return;
      const plan = sessionPlans.get(event.sessionKey);
      const installIntent = sessionInstallIntents.get(`session:${event.sessionKey}`) || sessionInstallCandidates.get(`session:${event.sessionKey}`);
      sessionLiveContextUsagePct.delete(event.sessionKey);
      recentInboundProgressAckAt.delete(event.sessionKey);
      sessionInstallCandidates.delete(`session:${event.sessionKey}`);
      sessionInstallIntents.delete(`session:${event.sessionKey}`);
      if (!event.nextSessionKey || !plan) {
        sessionPlans.delete(event.sessionKey);
        return;
      }
      const installResumeSeed = buildInstallResumeSeed(plan, installIntent, event.reason);
      const genericSeedText = renderNextSessionSeed(plan);
      const seedText = installResumeSeed?.text || genericSeedText;
      const seedHandoffState = installResumeSeed?.handoffState || plan.handoffState;
      if (!seedText) {
        sessionPlans.delete(event.sessionKey);
        return;
      }
      const injectionIdempotencyKey = `beai-handoff-seed:${event.sessionKey}:${event.nextSessionKey}`;
      const traceId = `beai-handoff:${event.sessionKey}:${event.nextSessionKey}`;
      const injectionMetadata = toPluginJsonValue({
        type: "beai_handoff_seed",
        traceId,
        sourceSessionKey: event.sessionKey,
        targetSessionKey: event.nextSessionKey,
        reason: event.reason ?? "unknown",
        handoffState: toPluginJsonValue(seedHandoffState ?? null)
      }) as Record<string, unknown>;
      if (installResumeSeed?.installResume) {
        injectionMetadata.installResume = toPluginJsonValue(installResumeSeed.installResume);
      }
      await api.session.workflow.enqueueNextTurnInjection({
        sessionKey: event.nextSessionKey,
        text: seedText,
        placement: "prepend_context",
        idempotencyKey: injectionIdempotencyKey,
        ttlMs: 1000 * 60 * 30,
        metadata: toPluginJsonValue(injectionMetadata) as any
      });
      const stateWorkspaceDir = resolveStateWorkspaceDir();
      appendContinuityTrace(stateWorkspaceDir, {
        event: "session_end_queued",
        timestamp: new Date().toISOString(),
        sessionKey: event.sessionKey,
        traceId,
        nextSessionKey: event.nextSessionKey,
        sourceSessionKey: event.sessionKey,
        targetSessionKey: event.nextSessionKey,
        injectionIdempotencyKey,
        reason: event.reason ?? "unknown",
        hasStructuredHandoffState: Boolean(seedHandoffState),
        openingMessage: seedHandoffState?.new_session_opening_message ?? null,
        preview: compactPreview(seedText)
      });
      updateSessionContinuityState(stateWorkspaceDir, plan);
      sessionPlans.delete(event.sessionKey);
      logHookEvent(api.logger, "info", "beai hook: session_end queued next-session seed", {
        sessionKey: event.sessionKey,
        nextSessionKey: event.nextSessionKey,
        reason: event.reason ?? null
      });
      appendLiveEvidence(stateWorkspaceDir, {
        hook: "session_end",
        action: "next-session seed queued",
        evidenceLevel: "queued_for_next_session",
        sessionKey: event.sessionKey,
        deliverySessionKey: event.nextSessionKey,
        sourceTool: "beai_handoff_seed",
        userVisible: false,
        internalHandoff: true,
        loopRiskClassification: event.nextSessionKey === event.sessionKey ? "same_session_handoff_loop_risk" : null,
        ...summarizeEvidence(plan),
        confirmed: [`next_session_key: ${event.nextSessionKey}`, "handoff seed queued"],
        unknown: ["target session first answer not verified by this hook"],
        preview: compactPreview(seedText)
      });
    });

    if (typeof api.registerHook === "function") {
      api.registerHook(
        "message:received",
        async (event) => {
          const config = getConfig();
          if (!config.enabled) return;
          const progressText = maybeQueueInboundProgressAck(event as { sessionKey?: string; context?: Record<string, unknown>; messages: string[] });
          if (!progressText) return;
          logHookEvent(api.logger, "info", "beai hook: internal message_received queued progress ack", {
            sessionKey: event.sessionKey ?? null,
            preview: compactPreview(progressText)
          });
        },
        {
          name: "beai-runtime-progress-ack",
          description: "Queue a short visible acknowledgment for compact approval continuations."
        }
      );
    }
  }
});
