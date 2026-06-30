const fs = require("node:fs");
const path = require("node:path");

const VALID_TASK_CLASSES = new Set([
  "answer",
  "editing",
  "summary",
  "planning",
  "artifact_generation",
  "verification",
  "local_execution",
  "diagnosis",
  "classification",
  "package_readiness"
]);

const VALID_TURN_JUDGMENTS = new Set([
  "answer",
  "artifact",
  "execute",
  "verify",
  "diagnose",
  "defer",
  "clarify"
]);

const VALID_JUDGMENT_TAGS = new Set([
  "memory_candidate",
  "automation_candidate"
]);

const VALID_RESULT_STATUSES = new Set([
  "succeeded",
  "partially_verified",
  "not_verified",
  "skipped",
  "failed",
  "blocked"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(message) {
  return normalizeWhitespace(message)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);
}

function firstSentence(message) {
  return splitSentences(message)[0] || normalizeWhitespace(message);
}

function lastSentence(message) {
  const parts = splitSentences(message);
  return parts[parts.length - 1] || normalizeWhitespace(message);
}

function includesAny(message, terms) {
  return terms.some((term) => message.includes(term));
}

function splitMessageUnits(message) {
  return String(message || "")
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line.replace(/^[-*•]\s*/, "")))
    .filter(Boolean);
}

function scoreAskLikeSegment(segment) {
  const normalized = normalizeWhitespace(segment).toLowerCase();
  let score = 0;

  if (includesAny(normalized, ["해줘", "봐줘", "정리", "설명", "검토", "진행", "만들", "고쳐", "수정", "분석", "요약", "확인", "검증", "진단"])) {
    score += 4;
  }
  if (includesAny(normalized, ["할까", "좋을까", "인가?", "맞나", "맞아", "어디까지", "무엇을"])) {
    score += 2;
  }
  if (includesAny(normalized, ["중요한 건", "즉", "그래서", "다만", "참고", "배경", "현재 상태", "작동 중인 것", "아직 완성 전인 것"])) {
    score -= 3;
  }
  return score;
}

function detectImmediateAsk(message) {
  const units = splitMessageUnits(message);
  if (units.length === 0) {
    return "";
  }

  let best = units[units.length - 1];
  let bestScore = scoreAskLikeSegment(best);

  for (const unit of units) {
    const score = scoreAskLikeSegment(unit);
    if (score > bestScore) {
      best = unit;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    return firstSentence(message);
  }
  return best;
}

function detectPrimaryClass(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();

  if (includesAny(normalized, ["문장", "rewrite", "고쳐줘", "수정", "다듬어"])) {
    return "editing";
  }
  if (includesAny(normalized, ["왜", "원인", "리스크", "문제", "gap", "diagnosis", "진단", "분석", "검토", "리뷰", "봐줘", "다시 봐", "살펴", "피드백", "의견", "판단", "점검"])) {
    return "diagnosis";
  }
  if (includesAny(normalized, ["검증", "확인", "작동", "되는지", "verify", "really working", "맞아?", "평가", "확인해", "체크"])) {
    return "verification";
  }
  if (includesAny(normalized, ["패키지", "온보딩", "설치", "배포", "teammate", "package"])) {
    return "package_readiness";
  }
  if (includesAny(normalized, ["계획", "로드맵", "순서", "구조", "전략", "청사진", "plan", "roadmap", "blueprint", "상의", "고민"])) {
    return "planning";
  }
  if (includesAny(normalized, ["체크리스트", "계약", "스키마", "가이드", "문서", "spec", "schema", "report", "표", "table", "코드"])) {
    return "artifact_generation";
  }
  if (includesAny(normalized, ["요약", "정리해", "짧게 붙여", "resume", "recap", "summary"])) {
    return "summary";
  }
  if (includesAny(normalized, ["구현", "실행", "테스트", "돌려", "run", "build", "patch", "fix", "install"])) {
    return "local_execution";
  }
  if (includesAny(normalized, ["분류", "어떤 요청", "classify", "classification"])) {
    return "classification";
  }
  return "answer";
}

function detectRiskLevel(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  if (
    includesAny(normalized, [
      "delete",
      "remove",
      "reset",
      "production",
      "billing",
      "결제",
      "보안",
      "security",
      "public",
      "external",
      "scheduler",
      "cron",
      "system prompt",
      "persistent"
    ])
  ) {
    return "high";
  }
  if (
    includesAny(normalized, [
      "install",
      "배포",
      "패키지",
      "runtime",
      "실행",
      "구현",
      "테스트",
      "validator",
      "wizard"
    ])
  ) {
    return "medium";
  }
  return "low";
}

function detectRequiresVerification(message, primaryClass) {
  if (primaryClass === "verification" || primaryClass === "local_execution" || primaryClass === "diagnosis") {
    return true;
  }
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, ["verify", "확인", "검증", "작동", "really", "맞아", "리뷰", "분석"]);
}

function detectRequiresUserConfirmation(message, riskLevel) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  if (riskLevel === "high") {
    return true;
  }
  return includesAny(normalized, ["delete", "remove", "destroy", "rm ", "reset", "public", "외부 전송"]);
}

function detectContinuitySensitive(primaryClass, message) {
  if (["editing", "summary", "verification", "planning", "package_readiness", "diagnosis"].includes(primaryClass)) {
    return true;
  }
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, ["다시", "이어", "계속", "resume", "again", "project", "runtime"]);
}

function parseSessionContextUsagePct(message) {
  const normalized = normalizeWhitespace(message);
  const patterns = [
    /최대\s*context\s*사용률\s*(\d{1,3})%/i,
    /main\s*session\s*context\s*(\d{1,3})%/i,
    /context\s*usage\s*(\d{1,3})%/i,
    /context\s*(\d{1,3})%/i
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function inferSessionSignals(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  const sessionContextUsagePct = parseSessionContextUsagePct(message);
  return {
    sessionContextUsagePct,
    nextStepStartsNewPhase: includesAny(normalized, [
      "다음 단계",
      "새 큰 실행 작업",
      "new execution phase",
      "next phase",
      "next step"
    ]),
    hasMixedPlanningAndExecution: includesAny(normalized, [
      "기준은 이미 정리",
      "정리됐고",
      "다음 단계는 더 큰 실행",
      "planning and execution",
      "생각 정리",
      "작업 수행"
    ]),
    hasLargeToolOutputs: includesAny(normalized, [
      "긴 로그",
      "tool output",
      "raw report",
      "긴 출력"
    ]),
    splitApprovalDeclined: includesAny(normalized, [
      "나누지 말고 계속",
      "split 하지 말고 계속",
      "세션 나누지 말고 계속",
      "compact 하지 말고 계속",
      "그냥 계속 진행",
      "이번엔 그냥 진행",
      "continue without split",
      "do not split",
      "don't split",
      "skip split"
    ])
  };
}

function detectMode(primaryClass, message, riskLevel) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  const executionIntent = includesAny(normalized, [
    "구현",
    "실행",
    "진행",
    "테스트",
    "고쳐",
    "패치",
    "build",
    "run",
    "execute",
    "install",
    "apply"
  ]);
  const planningIntent = includesAny(normalized, ["계획", "로드맵", "순서", "구조", "전략", "청사진", "정리"]);
  const pureVerificationIntent = includesAny(normalized, [
    "작동하는지",
    "되는지",
    "확인해",
    "검증해",
    "체크해",
    "상태 확인"
  ]);

  if (primaryClass === "local_execution") {
    return "handoff";
  }
  if (primaryClass === "verification" && executionIntent) {
    if (pureVerificationIntent && !includesAny(normalized, ["실제로 실행", "다시 실행", "돌려", "run", "재현", "고쳐"])) {
      return "conversation";
    }
    return "handoff";
  }
  if (primaryClass === "artifact_generation" && executionIntent) {
    return "handoff";
  }
  if (primaryClass === "package_readiness" && executionIntent) {
    if (planningIntent) {
      return "planning";
    }
    return "handoff";
  }
  if (primaryClass === "planning" && executionIntent) {
    if (planningIntent) {
      return "planning";
    }
    return "handoff";
  }
  if (primaryClass === "planning" || primaryClass === "artifact_generation" || primaryClass === "package_readiness") {
    return "planning";
  }
  if (riskLevel === "high" && executionIntent) {
    return "handoff";
  }
  return "conversation";
}

function detectNeedsClarification(message, immediateAsk, primaryClass) {
  const normalized = normalizeWhitespace(immediateAsk || message).toLowerCase();
  if (!normalized) {
    return true;
  }
  if (primaryClass === "planning" || primaryClass === "summary" || primaryClass === "diagnosis") {
    return false;
  }
  if (normalized.length <= 8 && includesAny(normalized, ["진행해", "해줘", "봐줘", "해봐", "고쳐줘"])) {
    return true;
  }
  if (includesAny(normalized, ["이거", "저거", "그거", "이것", "저것"]) && !includesAny(normalized, ["파일", "문서", "runtime", "plugin", "테스트", "세션", "텔레그램"])) {
    return true;
  }
  return false;
}

function inferTurnJudgment({ mode, riskLevel, requiresUserConfirmation, requiresVerification, primaryClass, immediateAsk, userMessage }) {
  if (detectNeedsClarification(userMessage, immediateAsk, primaryClass)) {
    return "clarify";
  }
  if (requiresUserConfirmation || (riskLevel === "high" && mode === "handoff")) {
    return "defer";
  }
  if (primaryClass === "diagnosis") {
    return "diagnose";
  }
  if (mode === "handoff") {
    return "execute";
  }
  if (primaryClass === "planning" || primaryClass === "package_readiness") {
    return "artifact";
  }
  if (primaryClass === "verification" || requiresVerification) {
    return "verify";
  }
  if (primaryClass === "artifact_generation" || primaryClass === "editing") {
    return "artifact";
  }
  return "answer";
}

function inferJudgmentTags(message) {
  const tags = [];
  if (detectMemoryCandidate(message)) {
    tags.push("memory_candidate");
  }
  if (detectSpecializedWorkCandidate(message)) {
    tags.push("automation_candidate");
  }
  return tags.filter((tag) => VALID_JUDGMENT_TAGS.has(tag));
}

function detectBackgroundSignals(message, immediateAsk) {
  const full = compactList(splitMessageUnits(message), 12);
  const request = normalizeWhitespace(immediateAsk);
  return full.filter((unit) => unit && unit !== request).slice(0, 4);
}

function inferBroaderPurpose(primaryClass, input) {
  if (input.projectName) {
    switch (primaryClass) {
      case "package_readiness":
        return "package readiness and teammate install safety";
      case "planning":
        return "active project planning";
      case "verification":
        return "runtime truth checking";
      case "local_execution":
        return "runtime implementation";
      case "artifact_generation":
        return "execution-ready artifact creation";
      default:
        return "active project continuity";
    }
  }
  return "current-turn resolution";
}

function inferResponseStrategy(mode, primaryClass, requiresVerification, turnJudgment) {
  if (turnJudgment === "clarify") {
    return "clarify";
  }
  if (turnJudgment === "defer") {
    return "clarify";
  }
  if (turnJudgment === "execute" || mode === "handoff") {
    return "work_order";
  }
  if (turnJudgment === "diagnose" || turnJudgment === "verify") {
    return "review";
  }
  if (turnJudgment === "artifact") {
    return "artifact";
  }
  if (primaryClass === "editing") {
    return "narrow_edit";
  }
  if (primaryClass === "artifact_generation") {
    return "artifact";
  }
  if (primaryClass === "classification" && !requiresVerification) {
    return "direct_answer";
  }
  return "direct_answer";
}

function inferPmResponsePattern(turnJudgment) {
  switch (turnJudgment) {
    case "answer":
      return {
        openingMove: "direct_resolution",
        userFacingTone: "짧고 선명하게 바로 답변",
        workOrderEntry: "none"
      };
    case "artifact":
      return {
        openingMove: "artifact_first",
        userFacingTone: "설명보다 산출물 우선",
        workOrderEntry: "only_if_scope_expands"
      };
    case "execute":
      return {
        openingMove: "bounded_execution_entry",
        userFacingTone: "실행 전 범위와 검증 기준을 먼저 고정",
        workOrderEntry: "required"
      };
    case "verify":
      return {
        openingMove: "verification_first",
        userFacingTone: "확인한 것과 못한 것을 분리",
        workOrderEntry: "none"
      };
    case "diagnose":
      return {
        openingMove: "diagnostic_split",
        userFacingTone: "상태, 추정 원인, 미확인 구간, 다음 확인을 분리",
        workOrderEntry: "none"
      };
    case "defer":
      return {
        openingMove: "boundary_hold",
        userFacingTone: "지금 닫지 않는 이유와 닫히는 조건 제시",
        workOrderEntry: "approval_or_scope_first"
      };
    case "clarify":
      return {
        openingMove: "single_missing_variable",
        userFacingTone: "질문 하나로 핵심 변수만 확인",
        workOrderEntry: "blocked_until_clarified"
      };
    default:
      return {
        openingMove: "direct_resolution",
        userFacingTone: "짧고 선명하게 바로 답변",
        workOrderEntry: "none"
      };
  }
}

function shouldCreateWorkOrder(plan) {
  return plan.turnJudgment === "execute";
}

function inferUserFacingState(turnJudgment) {
  switch (turnJudgment) {
    case "answer":
      return "resolved";
    case "artifact":
      return "artifact_ready";
    case "execute":
      return "execution_scoped";
    case "verify":
      return "verification_pending_result";
    case "diagnose":
      return "diagnostic_reading";
    case "defer":
      return "safely_held";
    case "clarify":
      return "awaiting_one_key_answer";
    default:
      return "in_progress";
  }
}

function inferPmLanguageContract(turnJudgment) {
  switch (turnJudgment) {
    case "verify":
      return {
        mustInclude: ["확인된 것", "아직 확인되지 않은 것"],
        avoid: ["검증 전 완료 단정"],
        closeWith: "남은 확인 또는 현재 판정"
      };
    case "diagnose":
      return {
        mustInclude: ["현재 상태", "가능성 높은 원인", "아직 확인되지 않은 부분", "다음 확인"],
        avoid: ["원인 단정", "미확인 구간 생략"],
        closeWith: "가장 유효한 다음 점검 한 가지"
      };
    case "defer":
      return {
        mustInclude: ["지금 닫지 않는 이유", "닫히는 조건"],
        avoid: ["막연한 회피"],
        closeWith: "승인 또는 범위 확인 기준"
      };
    case "clarify":
      return {
        mustInclude: ["한 가지 질문"],
        avoid: ["여러 질문 동시 제시"],
        closeWith: "답변을 받으면 바로 이어질 다음 행동"
      };
    default:
      return {
        mustInclude: [],
        avoid: [],
        closeWith: "현재 요청의 직접 처리"
      };
  }
}

function inferCostDiscipline(plan, input) {
  const hasPressure = ["watch", "recommend_split", "warn_before_large_execution"].includes(plan.sessionPressure?.level);
  const hasToolResidue = Boolean(input.hasLargeToolOutputs);
  const mixedWork = Boolean(input.hasMixedPlanningAndExecution);
  const highFailureCost =
    plan.requiresUserConfirmation ||
    plan.requiresVerification ||
    ["defer", "verify"].includes(plan.turnJudgment) ||
    plan.riskLevel === "high";

  let route = "standard";
  if (plan.turnJudgment === "artifact" || (plan.turnJudgment === "answer" && plan.riskLevel === "low")) {
    route = "lite";
  }
  if (highFailureCost || (plan.turnJudgment === "diagnose" && plan.diagnosticFamily === "general_operational")) {
    route = "strong";
  }
  if (plan.turnJudgment === "diagnose" && ["telegram_surface", "gateway_runtime", "queue_delivery", "model_cost_path"].includes(plan.diagnosticFamily || "")) {
    route = highFailureCost ? "strong" : "standard";
  }

  const toolUse = hasToolResidue || hasPressure ? "tighten" : "normal";
  const readingDepth = mixedWork || hasPressure ? "narrow_first" : "fit_to_task";
  const memoryPosture = hasPressure ? "prefer_working_summary" : "normal";

  return {
    route,
    toolUse,
    readingDepth,
    memoryPosture,
    why: compactList([
      route === "lite" ? "bounded_low_risk_turn" : "",
      route === "strong" ? "failure_cost_outweighs_extra_model_cost" : "",
      hasPressure ? `session_pressure_${plan.sessionPressure.level}` : "",
      hasToolResidue ? "tool_heavy_residue_present" : "",
      mixedWork ? "planning_and_execution_mixed" : ""
    ], 4)
  };
}

function inferRoleCutoffPolicy(plan) {
  const base = {
    primaryRoleCount: 1,
    maxSupportingRoles: 2,
    principle: "관련 있는 역할을 모두 반영하지 않고, 이번 응답의 사용자-facing 품질을 실제로 바꾸는 최소 역할만 유지한다.",
    memoryDefault: "명시 요청이 없는 한 후보 신호 또는 보조 역할로만 남긴다.",
    automationDefault: "명시 요청이 없는 한 후보 신호 또는 보조 역할로만 남긴다.",
    rules: []
  };

  switch (plan.turnJudgment) {
    case "execute":
      return {
        ...base,
        maxSupportingRoles: 1,
        rules: [
          "Worker를 주 관점으로 두고 실행 범위와 완료 기준을 먼저 고정한다.",
          "Verifier는 기본 보조 역할로만 붙이고 표면 노출은 최소화한다.",
          "기억이나 자동화 역할은 명시 요청이 없으면 앞으로 나오지 않는다."
        ]
      };
    case "verify":
      return {
        ...base,
        maxSupportingRoles: 1,
        rules: [
          "Verifier를 주 관점으로 두고 확인됨, 미확인, 현재 판정을 분리한다.",
          "다른 역할은 검증 결과 표현을 바꿀 때만 보조로 남긴다.",
          "자동화나 기억 역할은 검증 턴을 덮지 않게 잘라낸다."
        ]
      };
    case "diagnose":
      return {
        ...base,
        maxSupportingRoles: 1,
        rules: [
          "기본 주 관점은 Facility이며, Telegram 채널 문제가 명확할 때만 Telegram Ops가 주 관점이 된다.",
          "원인 단정보다 상태, 원인 후보, 다음 확인을 더 선명하게 만드는 역할만 남긴다.",
          "메신저가 완전히 죽은 경우의 1차 복구 표면은 Facility Console이며 chat-surface runtime 판단이 아니다."
        ]
      };
    case "defer":
      return {
        ...base,
        maxSupportingRoles: 1,
        rules: [
          "왜 지금 닫지 않는지와 무엇이 갖춰지면 닫히는지를 선명하게 만드는 역할만 남긴다.",
          "보류 턴은 회피처럼 보이지 않게 최소 역할 조합으로 유지한다.",
          "기억이나 자동화 역할은 보류 판단을 무겁게 만들면 잘라낸다."
        ]
      };
    case "clarify":
      return {
        ...base,
        maxSupportingRoles: 0,
        rules: [
          "질문 하나만 남기는 것이 우선이며 다른 역할은 거의 모두 잘라낸다.",
          "응답을 실제로 바꾸지 않는 역할은 관련이 있어도 이번 턴에서는 반영하지 않는다.",
          "기억, 자동화, 진단 관점은 답을 받은 다음 턴으로 미룬다."
        ]
      };
    default:
      return {
        ...base,
        rules: [
          "응답을 실제로 바꾸는 역할만 남기고 나머지는 내부 후보로만 둔다."
        ]
      };
  }
}

function detectEnvironmentConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "환경",
    "gateway",
    "session",
    "plugin",
    "model",
    "surface",
    "hook",
    "wiring",
    "설치가 안",
    "불안정",
    "장애",
    "health",
    "state",
    "진단",
    "오류",
    "고장"
  ]);
}

function detectGatewayRuntimeConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "gateway",
    "plugin",
    "hook",
    "wiring",
    "runtime",
    "environment",
    "openclaw health",
    "런타임",
    "플러그인",
    "환경",
    "배선",
    "헬스"
  ]);
}

function detectTelegramConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "telegram",
    "텔레그램",
    "polling",
    "webhook",
    "bot",
    "gateway send",
    "message delivery",
    "전송",
    "수신",
    "채널"
  ]);
}

function detectQueueConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "queue",
    "enqueue",
    "dequeue",
    "delivery",
    "deliver",
    "transport",
    "job",
    "worker queue",
    "전달",
    "전송 지연",
    "큐",
    "대기열",
    "적재",
    "작업열"
  ]);
}

function detectSessionConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "session",
    "continuity",
    "handoff",
    "nextsessionkey",
    "rollover",
    "restart state",
    "세션",
    "연속성",
    "이어받",
    "handoff state",
    "새 세션"
  ]);
}

function detectModelCostConcern(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "token",
    "cost",
    "context pressure",
    "model path",
    "reasoning depth",
    "tool overuse",
    "expensive",
    "cheap path",
    "토큰",
    "비용",
    "컨텍스트 압력",
    "모델",
    "추론",
    "과사용"
  ]);
}

function inferDiagnosticFamily(input, plan) {
  if (plan.turnJudgment !== "diagnose") {
    return null;
  }

  const message = plan.immediateAsk || input.userMessage || "";

  if (detectTelegramConcern(message)) {
    return "telegram_surface";
  }
  if (detectQueueConcern(message)) {
    return "queue_delivery";
  }
  if (detectGatewayRuntimeConcern(message)) {
    return "gateway_runtime";
  }
  if (detectSessionConcern(message)) {
    return "session_continuity";
  }
  if (detectModelCostConcern(message)) {
    return "model_cost_path";
  }
  if (["watch", "recommend_split", "warn_before_large_execution"].includes(plan.sessionPressure?.level)) {
    return "model_cost_path";
  }
  return "general_operational";
}

function detectMemoryCandidate(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "앞으로도",
    "계속 유지",
    "합의",
    "rule",
    "agreement",
    "기준",
    "원칙",
    "기억",
    "remember",
    "preference",
    "선호"
  ]);
}

function detectExplicitMemoryRequest(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "기억해",
    "기억해줘",
    "기억으로 남겨",
    "메모리에 남겨",
    "기억해 두",
    "remember this",
    "save this preference"
  ]);
}

function detectSpecializedWorkCandidate(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "반복",
    "repeated",
    "repeat",
    "자주",
    "매번",
    "pattern",
    "specialized",
    "전용 에이전트",
    "work-agent",
    "자동화 후보"
  ]);
}

function detectExplicitAutomationRequest(message) {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return includesAny(normalized, [
    "자동화해줘",
    "자동화 만들어",
    "에이전트 만들어",
    "전용 에이전트 만들어",
    "워크플로우로 만들어",
    "make it automatic",
    "build automation"
  ]);
}

function compactList(values, limit = 4) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .slice(0, limit);
}

function compactMapValues(mapLike, itemLimit = 6) {
  if (!isObject(mapLike)) return {};
  return Object.fromEntries(
    Object.entries(mapLike)
      .map(([key, value]) => [normalizeWhitespace(key), compactList(value, itemLimit)])
      .filter(([key, value]) => key && Array.isArray(value) && value.length > 0)
  );
}

function compactStringMap(mapLike) {
  if (!isObject(mapLike)) return {};
  return Object.fromEntries(
    Object.entries(mapLike)
      .map(([key, value]) => [normalizeWhitespace(key), normalizeWhitespace(value)])
      .filter(([key, value]) => key && value)
  );
}

function stripTerminalPunctuation(value) {
  return normalizeWhitespace(value || "").replace(/[.!?\s]+$/g, "");
}

function buildOpeningContinuation(value) {
  const normalized = stripTerminalPunctuation(value);
  if (!normalized) return "이번에는 다음 작업부터 바로 이어가겠습니다.";
  if (/(합니다|했다|한다|하겠습니다|됩니다|되었다|된다)$/u.test(normalized)) {
    return `이번에는 ${normalized}.`;
  }
  return `이번에는 ${normalized}부터 바로 이어가겠습니다.`;
}

function inferTopicNames(input) {
  const explicit = compactList(input.handoffTopics, 7);
  if (explicit.length > 0) return explicit;

  const inferred = [];
  if (input.activeArtifact) inferred.push(input.activeArtifact);
  if (input.projectName) inferred.push(input.projectName);
  const ask = firstSentence(input.userMessage);
  if (ask) inferred.push(ask);
  return compactList(inferred, 3);
}

function inferTopicKeywords(topicNames, keywordMap) {
  const result = {};
  for (const topicName of topicNames) {
    if (keywordMap[topicName]?.length > 0) {
      result[topicName] = keywordMap[topicName];
      continue;
    }
    result[topicName] = compactList(topicName.split(/[,:/|-]/), 5);
  }
  return result;
}

function inferTopicStories(topicNames, storyMap, input) {
  const result = {};
  for (const topicName of topicNames) {
    if (storyMap[topicName]) {
      result[topicName] = storyMap[topicName];
      continue;
    }
    result[topicName] = `${topicName} 주제는 현재 세션에서 이어진 핵심 작업이며, 다음 세션에서도 같은 판단 기준으로 재개해야 한다.`;
  }
  if (topicNames.length === 0) {
    result.general = `${firstSentence(input.userMessage)}를 중심으로 다음 세션 재개 기준을 유지해야 한다.`;
  }
  return result;
}

function inferCarryPriority(topicNames, input) {
  const mustCarry = compactList(input.mustCarryTopics || topicNames.slice(0, 3), 5);
  const usefulCarry = compactList(input.usefulCarryTopics || topicNames.slice(3), 5);
  const discard = compactList(input.discardTopics || input.doNotCarry, 5);
  return {
    must_carry: mustCarry,
    useful_carry: usefulCarry,
    discard
  };
}

function buildHandoffStateObject(input, plan) {
  if (!plan.sessionPressure?.shouldAskForSplitApproval) {
    return null;
  }

  const topics = inferTopicNames(input);
  const keywordsByTopic = inferTopicKeywords(topics, compactMapValues(input.keywordsByTopic));
  const anchorSentencesByTopic = compactStringMap(input.anchorSentencesByTopic);
  const storyByTopic = inferTopicStories(topics, compactStringMap(input.storyByTopic), input);
  const factsLocked = compactList(input.factsLocked, 6);
  const decisionsMade = compactList(input.decisionsMade, 6);
  const openLoops = compactList(input.openLoops, 6);
  const nextAction = normalizeWhitespace(input.nextAction || input.sessionHandoffNextGoal || "첫 실행 단위");
  const doNotCarry = compactList(
    input.doNotCarry || [input.sessionHandoffDoNotDoYet || "이전 긴 로그와 원시 tool output"],
    6
  );
  const workingStance = normalizeWhitespace(
    input.workingStance ||
      "설명보다 실제 실행 가능한 결과를 우선하고, 확정/미확정/보류를 분리한 상태로 이어간다."
  );
  const carryPriority = inferCarryPriority(topics, input);
  const continuityMessage = normalizeWhitespace(
    input.userContinuityMessage ||
      "지금까지 정한 내용을 잃지 않게 핵심 기준과 다음 작업만 남겨, 다음 대화에서 설명을 반복하지 않고 이어가게 한다."
  );
  const normalizedNextAction = stripTerminalPunctuation(nextAction) || "다음 작업";
  const openingMessage = normalizeWhitespace(
    input.newSessionOpeningMessage ||
      `이전 대화에서 여기까지 정리해두었습니다. ${buildOpeningContinuation(normalizedNextAction)}`
  );
  const currentTrack = normalizeWhitespace(input.currentTrack || "");
  const completed = compactList(input.completedItems || input.completedWork, 6);
  const inProgress = compactList(input.inProgressItems || input.inProgressWork, 6);
  const nextWork = normalizeWhitespace(input.nextWork || nextAction);
  const importantDecisions = compactList(input.importantDecisions || decisionsMade, 6);
  const remainingVerification = compactList(input.remainingVerification, 6);
  const relevantFilePaths = compactList(input.relevantFilePaths || input.targetPaths, 8);
  const doNotTouch = compactList(input.doNotTouch, 6);
  const userContinuationOpening = normalizeWhitespace(input.userContinuationOpening || openingMessage);

  return {
    current_track: currentTrack || undefined,
    completed: completed || [],
    in_progress: inProgress || [],
    next_work: nextWork,
    important_decisions: importantDecisions || [],
    remaining_verification: remainingVerification || [],
    relevant_file_paths: relevantFilePaths || [],
    do_not_touch: doNotTouch || [],
    user_continuation_opening: userContinuationOpening,
    topics,
    keywords_by_topic: keywordsByTopic,
    anchor_sentences_by_topic: anchorSentencesByTopic,
    story_by_topic: storyByTopic,
    facts_locked: factsLocked,
    decisions_made: decisionsMade,
    open_loops: openLoops,
    next_action: nextAction,
    do_not_carry: doNotCarry,
    working_stance: workingStance,
    carry_priority: carryPriority,
    user_continuity_message: continuityMessage,
    new_session_opening_message: openingMessage
  };
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function detectSessionPressure(input, plan) {
  const usagePct = toNumber(input.sessionContextUsagePct);
  const toolResidue = compactList(input.toolResidueSignals, 6);
  const reasons = [];
  const splitApprovalDeclined = input.splitApprovalDeclined === true;

  if (usagePct !== null) {
    if (usagePct >= 85) {
      reasons.push("context_above_85");
    } else if (usagePct >= 75) {
      reasons.push("context_75_to_85");
    } else if (usagePct >= 65) {
      reasons.push("context_65_to_75");
    } else if (usagePct >= 50) {
      reasons.push("context_50_to_65");
    }
  }

  if (toolResidue.length > 0) {
    reasons.push(...toolResidue);
  }
  if (input.hasLargeToolOutputs) {
    reasons.push("large_tool_outputs");
  }
  if (input.hasMixedPlanningAndExecution) {
    reasons.push("mixed_plan_execution");
  }
  if (input.hasHeavyMemoryInjection) {
    reasons.push("memory_injection_heavy");
  }
  if (input.nextStepStartsNewPhase) {
    reasons.push("new_execution_phase");
  }

  let level = "ok";
  if (usagePct !== null && usagePct >= 85) {
    level = "warn_before_large_execution";
  } else if (usagePct !== null && usagePct >= 75) {
    level = "recommend_split";
  } else if (usagePct !== null && usagePct >= 65) {
    level = "organize_recommended";
  } else if (usagePct !== null && usagePct >= 50) {
    level = "watch";
  }
  if (
    level === "ok" &&
    (reasons.includes("large_tool_outputs") ||
      reasons.includes("mixed_plan_execution") ||
      reasons.includes("memory_injection_heavy") ||
      reasons.includes("new_execution_phase"))
  ) {
    level = "watch";
  }

  const shouldAskForSplitApproval = ["recommend_split", "warn_before_large_execution"].includes(level) && !splitApprovalDeclined;
  const suggestedAction =
    level === "warn_before_large_execution"
      ? "split_or_compact_before_large_execution"
      : level === "recommend_split"
        ? "split_or_compact"
        : level === "organize_recommended"
          ? "organize_current_block"
          : level === "watch"
            ? "observe"
            : "none";
  const approvalPrompt =
    !shouldAskForSplitApproval
      ? null
      : level === "warn_before_large_execution"
      ? "큰 문제는 없습니다. 다만 지금 상태로 바로 큰 작업을 이어가면 중간 기준이 섞일 수 있습니다.\n\n그래서 지금까지 정한 내용을 짧은 다음 작업 기준으로 정리해두고 이어가는 편이 더 안전합니다."
      : level === "recommend_split"
        ? "큰 문제는 없습니다. 다만 대화가 길어져서 이 상태로 큰 작업을 이어가면 중간 기준이 섞일 수 있습니다.\n\n그래서 지금까지 정한 내용을 짧은 다음 작업 기준으로 정리해두고 이어가는 편이 더 안정적입니다."
        : null;
  const handoffStarter = shouldAskForSplitApproval
    ? {
        currentState: input.sessionHandoffCurrentState || "현재 세션에서 필요한 판단과 기준선은 이미 정리된 상태다.",
        nextSessionGoal: input.sessionHandoffNextGoal || "다음 세션에서는 새 실행 단계만 이어간다.",
        doNotDoYet: input.sessionHandoffDoNotDoYet || "이전 긴 로그와 원시 tool output은 다시 싣지 않는다.",
        doneWhen: input.sessionHandoffDoneWhen || "다음 세션 목표가 닫히는 즉시 결과만 요약하고 종료한다."
      }
    : null;

  return {
    level,
    contextUsagePct: usagePct,
    reasons: Array.from(new Set(reasons)).slice(0, 8),
    suggestedAction,
    protectCurrentBlock: true,
    handoffStateReady: Boolean(handoffStarter),
    shouldAskForSplitApproval,
    approvalPrompt,
    handoffStarter
  };
}

function buildWorkOrder(input, plan) {
  const targetPaths = compactList(input.targetPaths);
  const inputSources = compactList(
    Array.isArray(input.inputSources) && input.inputSources.length > 0
      ? input.inputSources
      : ["current user turn"]
  );
  const expectedTouchedFiles = targetPaths.length > 0 ? targetPaths : compactList([input.activeArtifact]);

  const allowedActions = ["read relevant files", "write scoped runtime changes", "run bounded local validation"];
  const forbiddenActions = [
    "destructive deletion without approval",
    "public or external actions",
    "pretending verification without evidence"
  ];

  return {
    version: "beai-work-order.v0.1",
    taskName: input.activeArtifact || firstSentence(input.userMessage),
    objective: input.userMessage,
    currentContext: `Mode=${plan.mode}; class=${plan.primaryClass}; risk=${plan.riskLevel}`,
    targetPaths,
    inputSources,
    allowedActions,
    forbiddenActions,
    approvalRequired: {
      value: plan.requiresUserConfirmation,
      reason: plan.requiresUserConfirmation ? "high-risk or destructive possibility detected" : "bounded local runtime work"
    },
    expectedTouchedFiles,
    successCriteria: inferSuccessCriteria(plan),
    stopConditions: [
      "scope becomes unclear",
      "destructive action becomes necessary",
      "environment assumptions fail",
      "verification cannot be run honestly"
    ],
    verificationMethod: inferVerificationMethod(plan),
    reportFormat: [
      "What was checked",
      "What was changed",
      "What was not changed",
      "Result status",
      "Remaining risks or unverified items",
      "Recommended next step"
    ]
  };
}

function inferRoleSignals(input, plan) {
  const signals = [];
  const push = (role, reason, artifact, priority = "normal", surfaceEffect = "") => {
    signals.push({
      role,
      reason,
      artifact,
      priority,
      surfaceEffect
    });
  };

  if (plan.turnJudgment === "execute") {
    push(
      "Worker",
      "execution should stay bounded by scope, stop conditions, and expected touched files",
      "Work Order",
      "high",
      "PM enters through scoped execution rather than direct action"
    );
  }

  if (plan.turnJudgment === "verify") {
    push(
      "Verifier",
      "the turn itself is a state-check request, so confirmed and unconfirmed results must be separated",
      "explicit checked vs unchecked report",
      "high",
      "PM reports what is confirmed, what is still unconfirmed, and the current verdict"
    );
  } else if (plan.turnJudgment === "execute" || plan.requiresVerification) {
    push(
      "Verifier",
      "completion truth should stay separate from execution claims",
      "verification step or explicit unverified status",
      "high",
      "PM avoids saying done until checks are named"
    );
  }

  if (plan.judgmentTags.includes("memory_candidate")) {
    push(
      "Memory Curator",
      "this turn contains a potentially durable rule, preference, or agreement",
      "memory candidate note or proposed patch",
      "normal",
      "PM keeps it as a candidate instead of silently writing durable memory"
    );
  }

  if (plan.turnJudgment === "diagnose" && detectTelegramConcern(input.userMessage)) {
    push(
      "Telegram Ops",
      "Telegram-side delivery or channel diagnosis should stay separate from general system issues",
      "Telegram-focused diagnostic summary",
      "high",
      "PM isolates channel-specific symptoms before broad system guesses"
    );
  } else if (plan.turnJudgment === "diagnose" || detectEnvironmentConcern(input.userMessage) || ["watch", "recommend_split"].includes(plan.sessionPressure?.level)) {
    push(
      "Facility",
      "operational state or context pressure should be diagnosed separately from ordinary conversation",
      "read-only diagnostic summary",
      plan.turnJudgment === "diagnose" ? "high" : "normal",
      "PM separates current state, likely causes, unknown area, and next check"
    );
  }

  if (plan.judgmentTags.includes("automation_candidate")) {
    push(
      "specialized work-agent candidate",
      "the request suggests repeated work that may deserve automation or an extension role after manual baseline and risk review",
      "candidate note, not default team change"
      ,
      "normal",
      "PM treats automation as a candidacy discussion, not an immediate silent upgrade"
    );
  }

  return signals;
}

function rolePriorityScore(priority) {
  switch (priority) {
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function preferredRoleOrderForTurn(plan) {
  switch (plan.turnJudgment) {
    case "execute":
      return ["Worker", "Verifier", "Memory Curator", "Facility", "Telegram Ops", "specialized work-agent candidate"];
    case "verify":
      return ["Verifier", "Facility", "Telegram Ops", "Memory Curator", "Worker", "specialized work-agent candidate"];
    case "diagnose":
      return detectTelegramConcern(plan.immediateAsk || "")
        ? ["Telegram Ops", "Facility", "Verifier", "Memory Curator", "Worker", "specialized work-agent candidate"]
        : ["Facility", "Telegram Ops", "Verifier", "Memory Curator", "Worker", "specialized work-agent candidate"];
    case "defer":
      return ["Verifier", "Worker", "Facility", "Memory Curator", "Telegram Ops", "specialized work-agent candidate"];
    case "clarify":
      return ["Memory Curator", "Facility", "Verifier", "Worker", "Telegram Ops", "specialized work-agent candidate"];
    default:
      return ["Verifier", "Memory Curator", "Facility", "Worker", "Telegram Ops", "specialized work-agent candidate"];
  }
}

function canBePrimaryRole(role, plan) {
  if (role === "Memory Curator") {
    return detectExplicitMemoryRequest(plan.immediateAsk || "");
  }
  if (role === "specialized work-agent candidate") {
    return detectExplicitAutomationRequest(plan.immediateAsk || "");
  }
  if (role === "Telegram Ops") {
    return plan.turnJudgment === "diagnose" && detectTelegramConcern(plan.immediateAsk || "");
  }
  return true;
}

function finalizeRoleSignals(signals, plan) {
  const cutoffPolicy = inferRoleCutoffPolicy(plan);
  const order = preferredRoleOrderForTurn(plan);
  const orderIndex = new Map(order.map((role, index) => [role, index]));

  const sorted = [...signals].sort((left, right) => {
    const priorityDelta = rolePriorityScore(right.priority) - rolePriorityScore(left.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return (orderIndex.get(left.role) ?? 99) - (orderIndex.get(right.role) ?? 99);
  });

  const primarySignal = sorted.find((signal) => canBePrimaryRole(signal.role, plan)) || null;
  const primaryRole = primarySignal?.role || null;
  const supportingRoles = sorted
    .filter((signal) => signal.role !== primaryRole)
    .map((signal) => signal.role)
    .filter((role, index, arr) => arr.indexOf(role) === index)
    .slice(0, cutoffPolicy.maxSupportingRoles);

  const trimmed = sorted.filter((signal) => {
    if (signal.role === primaryRole) return true;
    if (supportingRoles.includes(signal.role)) return true;
    return false;
  });

  return {
    primaryRole,
    supportingRoles,
    roleSignals: trimmed,
    roleCutoffPolicy: cutoffPolicy
  };
}

function inferSuccessCriteria(plan) {
  if (plan.mode === "handoff") {
    return [
      "Work Order scope is concrete",
      "stop conditions are explicit",
      "verification method is named",
      "final/debug split remains possible after execution"
    ];
  }
  if (plan.mode === "planning") {
    return ["usable plan or artifact is produced", "scope is explicit", "next step is clear"];
  }
  return ["current-turn answer is direct", "response stays within scope"];
}

function inferVerificationMethod(plan) {
  if (plan.primaryClass === "local_execution" || plan.primaryClass === "verification") {
    return ["run local checks", "report explicit status", "preserve remaining gaps"];
  }
  return ["manual review against current request"];
}

function buildFinalResponseOutline(input, plan) {
  if (plan.turnJudgment === "answer") {
    return [
      "현재 요청에 바로 답합니다."
    ];
  }
  if (plan.turnJudgment === "artifact") {
    return [
      "설명보다 먼저 바로 쓸 수 있는 산출물 형태로 정리하겠습니다."
    ];
  }
  if (plan.turnJudgment === "clarify") {
    return [
      "지금은 빠진 핵심 변수 하나만 먼저 여쭙겠습니다.",
      "답을 받으면 바로 이어서 처리하겠습니다."
    ];
  }
  if (plan.turnJudgment === "defer") {
    return [
      "지금 바로 닫으면 위험해서, 먼저 왜 멈추는지와 어떤 기준이 갖춰지면 닫히는지를 분리하겠습니다."
    ];
  }
  if (plan.turnJudgment === "verify") {
    return [
      "먼저 무엇이 확인됐고 무엇은 아직 확인되지 않았는지 분리해서 보겠습니다."
    ];
  }
  if (plan.turnJudgment === "diagnose") {
    return [
      "먼저 현재 상태와 가능성 높은 원인, 아직 미확인인 부분을 나눠 보겠습니다.",
      "그다음 다음 확인 한 가지를 남기겠습니다."
    ];
  }
  if (plan.turnJudgment === "execute" || plan.mode === "handoff") {
    return [
      "이 요청은 바로 실행보다 먼저 Work Order로 고정하는 편이 안전합니다.",
      "실행 전 범위, 검증 기준, 중단 조건을 먼저 명확히 잡겠습니다."
    ];
  }
  if (plan.mode === "planning") {
    return [
      "현재 요청의 구조와 우선순위를 먼저 정리합니다.",
      "그 다음 실행 가능한 다음 단계만 남기겠습니다."
    ];
  }
  return ["현재 턴의 직접 요청부터 답합니다."];
}

function buildDebugSummary(input, plan) {
  return compactList([
    plan.immediateAsk ? `immediateAsk=${plan.immediateAsk}` : "",
    `primaryClass=${plan.primaryClass}`,
    `turnJudgment=${plan.turnJudgment}`,
    `mode=${plan.mode}`,
    `riskLevel=${plan.riskLevel}`,
    `requiresVerification=${plan.requiresVerification}`,
    input.activeArtifact ? `activeArtifact=${input.activeArtifact}` : ""
  ], 6);
}

function buildContinuityPatch(input, plan) {
  const responseSummary =
    plan.mode === "handoff"
      ? "현재 요청을 실행 전 Work Order와 검증 기준으로 먼저 고정했다."
      : plan.mode === "planning"
        ? "현재 요청을 구조와 다음 단계 중심으로 정리했다."
        : "현재 턴의 직접 요청에 바로 답하는 방향으로 고정했다.";

  return {
    last_assistant_answer: responseSummary,
    numbered_items:
      plan.mode === "handoff"
        ? ["turn classification", "work order generation", "verification posture"]
        : plan.mode === "planning"
          ? ["immediate ask", "broader purpose", "next step"]
          : [],
    last_sentence: buildFinalResponseOutline(input, plan).slice(-1)[0] || responseSummary,
    current_artifact: input.activeArtifact || input.projectName || firstSentence(input.userMessage),
    protected_wording: compactList(input.protectedWording),
    recent_constraints: compactList(input.recentConstraints, 6),
    current_focus: input.currentFocus || `${plan.mode} runtime handling`
  };
}

function buildTurnPlan(input) {
  const inferredSessionSignals = inferSessionSignals(input.userMessage);
  const enrichedInput = {
    ...input,
    sessionContextUsagePct:
      input.sessionContextUsagePct !== undefined && input.sessionContextUsagePct !== null
        ? input.sessionContextUsagePct
        : inferredSessionSignals.sessionContextUsagePct,
    hasLargeToolOutputs:
      input.hasLargeToolOutputs !== undefined ? input.hasLargeToolOutputs : inferredSessionSignals.hasLargeToolOutputs,
    hasMixedPlanningAndExecution:
      input.hasMixedPlanningAndExecution !== undefined
        ? input.hasMixedPlanningAndExecution
        : inferredSessionSignals.hasMixedPlanningAndExecution,
    nextStepStartsNewPhase:
      input.nextStepStartsNewPhase !== undefined
        ? input.nextStepStartsNewPhase
        : inferredSessionSignals.nextStepStartsNewPhase,
    splitApprovalDeclined:
      input.splitApprovalDeclined !== undefined
        ? input.splitApprovalDeclined
        : inferredSessionSignals.splitApprovalDeclined
  };
  const immediateAsk = detectImmediateAsk(input.userMessage);
  const primaryClass = detectPrimaryClass(immediateAsk || input.userMessage);
  if (!VALID_TASK_CLASSES.has(primaryClass)) {
    throw new Error(`Unexpected primary class: ${primaryClass}`);
  }
  const riskLevel = detectRiskLevel(immediateAsk || input.userMessage);
  const requiresVerification = detectRequiresVerification(immediateAsk || input.userMessage, primaryClass);
  const requiresUserConfirmation = detectRequiresUserConfirmation(immediateAsk || input.userMessage, riskLevel);
  const mode = detectMode(primaryClass, immediateAsk || input.userMessage, riskLevel);
  const turnJudgment = inferTurnJudgment({
    mode,
    riskLevel,
    requiresUserConfirmation,
    requiresVerification,
    primaryClass,
    immediateAsk,
    userMessage: input.userMessage
  });
  if (!VALID_TURN_JUDGMENTS.has(turnJudgment)) {
    throw new Error(`Unexpected turn judgment: ${turnJudgment}`);
  }
  const judgmentTags = inferJudgmentTags(input.userMessage);
  const plan = {
    version: "beai-turn-plan.v0.1",
    mode,
    immediateAsk,
    broaderPurpose: inferBroaderPurpose(primaryClass, enrichedInput),
    primaryClass,
    turnJudgment,
    judgmentTags,
    riskLevel,
    requiresVerification,
    requiresUserConfirmation,
    continuitySensitive: detectContinuitySensitive(primaryClass, input.userMessage),
    activeArtifact: enrichedInput.activeArtifact || null,
    responseStrategy: inferResponseStrategy(mode, primaryClass, requiresVerification, turnJudgment),
    pmResponsePattern: inferPmResponsePattern(turnJudgment),
    userFacingState: inferUserFacingState(turnJudgment),
    pmLanguageContract: inferPmLanguageContract(turnJudgment),
    diagnosticFamily: null,
    costDiscipline: null,
    roleCutoffPolicy: null,
    backgroundSignals: detectBackgroundSignals(input.userMessage, immediateAsk),
    roleSignals: [],
    workOrder: null,
    sessionPressure: null,
    handoffState: null
  };

  plan.sessionPressure = detectSessionPressure(enrichedInput, plan);
  plan.diagnosticFamily = inferDiagnosticFamily(enrichedInput, plan);
  plan.costDiscipline = inferCostDiscipline(plan, enrichedInput);
  plan.handoffState = buildHandoffStateObject(enrichedInput, plan);
  const finalizedRoles = finalizeRoleSignals(inferRoleSignals(enrichedInput, plan), plan);
  plan.primaryRole = finalizedRoles.primaryRole;
  plan.supportingRoles = finalizedRoles.supportingRoles;
  plan.roleSignals = finalizedRoles.roleSignals;
  plan.roleCutoffPolicy = finalizedRoles.roleCutoffPolicy;

  if (shouldCreateWorkOrder(plan)) {
    plan.workOrder = buildWorkOrder(enrichedInput, plan);
  }

  plan.finalResponseOutline = buildFinalResponseOutline(enrichedInput, plan);
  plan.debugSummary = buildDebugSummary(enrichedInput, plan);
  plan.continuityPatch = buildContinuityPatch(enrichedInput, plan);
  return plan;
}

function mapStatusLabel(status) {
  switch (status) {
    case "succeeded":
      return "적용했고, 검증까지 완료되었습니다.";
    case "partially_verified":
      return "적용했습니다. 검증은 아직 이 범위까지입니다.";
    case "not_verified":
      return "적용했지만, 아직 검증된 상태로 닫을 수는 없습니다.";
    case "skipped":
      return "이번에는 적용하지 않았습니다.";
    case "failed":
      return "시도했지만 이 지점에서 실패했습니다.";
    case "blocked":
      return "시도했지만 이 지점에서 막혀 멈췄습니다.";
    default:
      return "현재 상태를 보수적으로 다시 확인해야 합니다.";
  }
}

function inferResultReviewContract(status) {
  switch (status) {
    case "succeeded":
      return {
        userFacingState: "verified_done",
        mustInclude: ["무엇을 적용했는지", "무엇을 확인했는지"],
        allowedLanguage: ["완료", "검증 완료", "정상 작동 확인"],
        avoid: ["막연한 완료 표현", "근거 없는 과장", "확인 없는 해결 표현"],
        closeWith: "검증 완료 기준",
        reportStructure: [
          "완료된 것",
          "검증 방법",
          "최종 상태"
        ]
      };
    case "partially_verified":
      return {
        userFacingState: "partially_verified",
        mustInclude: ["적용된 것", "검증된 범위", "남아 있는 미검증 구간"],
        allowedLanguage: ["부분 확인", "일부 검증", "미확인 구간 있음"],
        avoid: ["완료 단정", "검증 누락 숨김", "정상화 완료"],
        closeWith: "남은 확인 한 가지",
        reportStructure: [
          "적용된 것",
          "확인된 범위",
          "미확인 구간"
        ]
      };
    case "not_verified":
      return {
        userFacingState: "unverified_change",
        mustInclude: ["적용된 것", "아직 검증하지 못한 이유 또는 범위"],
        allowedLanguage: ["미검증", "적용만 됨", "확인 전"],
        avoid: ["확인된 것처럼 말하기", "완료", "해결"],
        closeWith: "검증 필요 상태",
        reportStructure: [
          "적용 또는 시도된 것",
          "아직 확인하지 못한 이유",
          "다음 확인 방법"
        ]
      };
    case "skipped":
      return {
        userFacingState: "not_applied",
        mustInclude: ["적용하지 않은 이유"],
        allowedLanguage: ["실행하지 않음", "이번 범위에서는 보류"],
        avoid: ["실행된 것처럼 보이게 하는 표현", "반영 완료"],
        closeWith: "현재 보류 상태",
        reportStructure: [
          "실행하지 않은 이유",
          "영향 여부",
          "다음 조건"
        ]
      };
    case "failed":
      return {
        userFacingState: "failed_with_boundary",
        mustInclude: ["어디까지 시도했는지", "어디서 실패했는지"],
        allowedLanguage: ["실패", "적용 안 됨", "이 지점에서 실패"],
        avoid: ["모호한 실패 표현", "완료 직전"],
        closeWith: "다음 복구 또는 재시도 기준",
        reportStructure: [
          "시도한 것",
          "실패 지점",
          "손대지 않은 것",
          "다음 조치"
        ]
      };
    case "blocked":
      return {
        userFacingState: "blocked_waiting_condition",
        mustInclude: ["무엇 때문에 막혔는지", "무엇이 갖춰지면 다시 진행되는지"],
        allowedLanguage: ["진행 불가", "조건 필요", "현재는 막힘"],
        avoid: ["막연한 중단 표현", "거의 완료"],
        closeWith: "필요 조건",
        reportStructure: [
          "막힌 조건",
          "필요한 입력/권한/환경",
          "재개 조건"
        ]
      };
    default:
      return {
        userFacingState: "review_needed",
        mustInclude: ["현재 결과 상태"],
        allowedLanguage: ["보수적 재확인 필요"],
        avoid: [],
        closeWith: "보수적 재확인",
        reportStructure: ["현재 결과 상태", "보수적 재확인"]
      };
  }
}

function firstNonEmpty(items) {
  for (const item of items) {
    if (normalizeWhitespace(item)) {
      return normalizeWhitespace(item);
    }
  }
  return "";
}

function joinList(items) {
  const values = compactList(items, 5);
  return values.length > 0 ? values.join(", ") : "";
}

function isSentenceLike(value) {
  const normalized = normalizeWhitespace(value);
  return /[.!?]$/.test(normalized) || /(합니다|했습니다|못했습니다|필요합니다|됩니다|있습니다|없습니다)$/.test(normalized);
}

function describeCheckedRange(checked) {
  const joined = joinList(checked);
  return joined ? `${joined} 범위는 확인했습니다.` : "";
}

function describeChangedRange(changed, suffix = "반영됐습니다.") {
  const joined = joinList(changed);
  return joined ? `${joined}${suffix.startsWith(" ") ? suffix : ` ${suffix}`}`.replace(" 반영됐습니다.", "도 반영됐습니다.").replace(" 적용했습니다.", "까지 적용했습니다.") : "";
}

function describeRemainingRisk(risks) {
  if (risks.length === 0) return "";
  if (risks.length === 1) {
    const item = normalizeWhitespace(risks[0]);
    if (!item) return "";
    if (isSentenceLike(item)) return item.startsWith("다만 ") ? item : `다만 ${item}`;
    return `다만 ${item}은 아직 확인하지 못했습니다.`;
  }
  return `다만 ${joinList(risks)} 구간은 아직 확인하지 못했습니다.`;
}

function describeNotVerifiedReason(risks) {
  if (risks.length === 0) return "";
  if (risks.length === 1) {
    const item = normalizeWhitespace(risks[0]);
    if (!item) return "";
    if (isSentenceLike(item)) return item;
    return `아직 ${item}은 확인하지 못했습니다.`;
  }
  return `${joinList(risks)} 구간 때문에 아직 확인을 마치지 못했습니다.`;
}

function describeNextStep(nextStep, prefix = "다음 확인은") {
  const normalized = normalizeWhitespace(nextStep);
  if (!normalized) return "";
  if (isSentenceLike(normalized)) return normalized;
  return `${prefix} ${normalized}`;
}

function buildStatusAwareFinalResponse(status, input, changed, checked, untouched, risks) {
  const verificationMethod = firstNonEmpty([
    input.verificationMethod,
    checked.length > 0 ? `${joinList(checked)}를 확인했습니다.` : ""
  ]);
  const finalState = firstNonEmpty([
    input.finalState,
    risks.length === 0 ? "현재 기준에서 추가 미검증 항목은 드러나지 않았습니다." : `최종 상태 기준에서는 ${joinList(risks)}가 남아 있습니다.`
  ]);
  const notVerifiedReason = firstNonEmpty([
    input.notVerifiedReason,
    describeNotVerifiedReason(risks)
  ]);
  const skipReason = firstNonEmpty([
    input.skipReason,
    risks.length > 0 ? `${joinList(risks)} 때문에 이번에는 실행하지 않았습니다.` : ""
  ]);
  const impactScope = firstNonEmpty([
    input.impactScope,
    untouched.length > 0 ? `${joinList(untouched)} 범위는 이번에 건드리지 않았습니다.` : "현재 범위에서 추가 영향은 확인되지 않았습니다."
  ]);
  const failurePoint = firstNonEmpty([
    input.failurePoint,
    risks.length > 0 ? `${joinList(risks)} 지점에서 멈췄습니다.` : ""
  ]);
  const blockingCondition = firstNonEmpty([
    input.blockingCondition,
    risks.length > 0 ? `${joinList(risks)} 때문에 현재 진행이 막혀 있습니다.` : ""
  ]);
  const nextStep = firstNonEmpty([
    input.recommendedNextStep,
    input.resumeCondition,
    "다음 확인이 더 필요합니다."
  ]);

  switch (status) {
    case "succeeded":
      return [
        mapStatusLabel(status),
        changed.length > 0 ? `${joinList(changed)}까지 적용했습니다.` : "",
        verificationMethod,
        finalState
      ].filter(Boolean);
    case "partially_verified":
      return [
        mapStatusLabel(status),
        changed.length > 0 ? describeChangedRange(changed) : "",
        checked.length > 0 ? describeCheckedRange(checked) : "",
        describeRemainingRisk(risks),
        nextStep ? `다음으로는 ${nextStep}` : ""
      ].filter(Boolean);
    case "not_verified":
      return [
        mapStatusLabel(status),
        changed.length > 0 ? `${joinList(changed)}까지는 적용 또는 시도했습니다.` : "",
        notVerifiedReason,
        describeNextStep(nextStep, "다음 확인은")
      ].filter(Boolean);
    case "skipped":
      return [
        mapStatusLabel(status),
        skipReason,
        impactScope,
        nextStep ? `필요해지면 다음 조건은 ${nextStep}` : ""
      ].filter(Boolean);
    case "failed":
      return [
        mapStatusLabel(status),
        changed.length > 0 ? `${joinList(changed)}까지 시도했습니다.` : "",
        failurePoint,
        untouched.length > 0 ? `${joinList(untouched)} 범위는 아직 건드리지 않았습니다.` : "",
        nextStep ? `다음 조치는 ${nextStep}` : ""
      ].filter(Boolean);
    case "blocked":
      return [
        mapStatusLabel(status),
        blockingCondition,
        impactScope,
        nextStep ? `다시 진행하려면 ${nextStep}` : ""
      ].filter(Boolean);
    default:
      return [
        mapStatusLabel(status),
        changed.length > 0 ? `현재 파악된 변경은 ${changed.join(", ")}입니다.` : "",
        risks.length > 0 ? `보수적 재확인이 필요한 지점은 ${risks.join(", ")}입니다.` : ""
      ].filter(Boolean);
  }
}

function reviewExecutionResult(input) {
  const rawStatus = normalizeWhitespace(input.resultStatus || "not_verified");
  const status = VALID_RESULT_STATUSES.has(rawStatus) ? rawStatus : "not_verified";
  const checked = compactList(input.whatChecked, 5);
  const changed = compactList(input.whatChanged, 5);
  const untouched = compactList(input.whatNotChanged, 5);
  const risks = compactList(input.remainingRisks, 5);
  const contract = inferResultReviewContract(status);
  const finalResponse = buildStatusAwareFinalResponse(status, input, changed, checked, untouched, risks);

  const debugSummary = [
    `taskName=${normalizeWhitespace(input.taskName || "unnamed task")}`,
    `status=${status}`,
    checked.length > 0 ? `checked=${checked.join("; ")}` : "",
    changed.length > 0 ? `changed=${changed.join("; ")}` : "",
    untouched.length > 0 ? `notChanged=${untouched.join("; ")}` : "",
    risks.length > 0 ? `risks=${risks.join("; ")}` : "",
    contract.reportStructure?.length > 0 ? `reportStructure=${contract.reportStructure.join(" > ")}` : "",
    input.recommendedNextStep ? `next=${normalizeWhitespace(input.recommendedNextStep)}` : ""
  ].filter(Boolean);

  return {
    version: "beai-review-result.v0.1",
    resultStatus: status,
    resultReviewContract: contract,
    finalResponse,
    debugSummary,
    continuityPatch: {
      last_assistant_answer: finalResponse[0],
      numbered_items: checked,
      last_sentence: finalResponse[finalResponse.length - 1] || finalResponse[0],
      current_artifact: normalizeWhitespace(input.taskName || "execution review"),
      protected_wording: [],
      recent_constraints: risks,
      current_focus: normalizeWhitespace(input.recommendedNextStep || "execution review")
    }
  };
}

function mergeWorkingMemory(existing, patch) {
  const hasCurrentArtifact = Object.prototype.hasOwnProperty.call(patch, "current_artifact");
  return {
    last_assistant_answer: patch.last_assistant_answer || existing.last_assistant_answer || "",
    numbered_items: Array.isArray(patch.numbered_items) ? patch.numbered_items : Array.isArray(existing.numbered_items) ? existing.numbered_items : [],
    last_sentence: patch.last_sentence || existing.last_sentence || "",
    current_artifact: hasCurrentArtifact ? patch.current_artifact || "" : existing.current_artifact || "",
    protected_wording: Array.isArray(patch.protected_wording) ? patch.protected_wording : Array.isArray(existing.protected_wording) ? existing.protected_wording : [],
    recent_constraints: Array.isArray(patch.recent_constraints) ? patch.recent_constraints : Array.isArray(existing.recent_constraints) ? existing.recent_constraints : [],
    current_focus: patch.current_focus || existing.current_focus || ""
  };
}

function updateWorkingMemory(filePath, patch) {
  const resolved = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const existing = fs.existsSync(resolved) ? readJson(resolved) : {};
  const merged = mergeWorkingMemory(existing, patch);
  writeJson(resolved, merged);
  return merged;
}

function parseMarkdownBulletSection(markdown, sectionTitle) {
  const lines = String(markdown || "").split("\n");
  const header = `## ${sectionTitle}`;
  const startIndex = lines.findIndex((line) => normalizeWhitespace(line) === header);
  if (startIndex === -1) {
    return [];
  }

  const items = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      break;
    }
    if (line.startsWith("- ")) {
      items.push(line.slice(2).trim());
    }
  }
  return items.filter(Boolean);
}

function extractAgreementCandidates(markdown) {
  return parseMarkdownBulletSection(markdown, "Candidate Rules").filter(
    (item) => !item.startsWith("no durable cross-cutting agreement candidate")
  );
}

function extractAcceptedAgreements(markdown) {
  return parseMarkdownBulletSection(markdown, "Accepted Agreements");
}

function replaceAcceptedAgreementsSection(markdown, acceptedItems) {
  const lines = String(markdown || "").split("\n");
  const header = "## Accepted Agreements";
  const startIndex = lines.findIndex((line) => normalizeWhitespace(line) === header);

  const bulletLines = acceptedItems.map((item) => `- ${item}`);

  if (startIndex === -1) {
    const prefix = markdown.endsWith("\n") ? markdown : `${markdown}\n`;
    return `${prefix}\n${header}\n\n${bulletLines.join("\n")}\n`;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim().startsWith("## ")) {
      endIndex = index;
      break;
    }
  }

  const before = lines.slice(0, startIndex + 1);
  const after = lines.slice(endIndex);
  const rebuilt = [...before, "", ...bulletLines];
  if (after.length > 0 && rebuilt[rebuilt.length - 1] !== "") {
    rebuilt.push("");
  }
  return `${[...rebuilt, ...after].join("\n").replace(/\n+$/, "\n")}`;
}

function promoteAgreementCandidates(agreementsPath, candidatesPath, options = {}) {
  const resolvedAgreements = path.resolve(process.cwd(), agreementsPath);
  const resolvedCandidates = path.resolve(process.cwd(), candidatesPath);
  const agreementsMarkdown = readText(resolvedAgreements);
  const candidatesMarkdown = readText(resolvedCandidates);

  const acceptedItems = extractAcceptedAgreements(agreementsMarkdown);
  const candidateItems = extractAgreementCandidates(candidatesMarkdown);
  const approvedStatements = compactList(options.approvedStatements, 100);
  const approveAll = options.approveAll === true;

  if (!approveAll && approvedStatements.length === 0) {
    throw new Error("Missing approved statements. Use --approve-all or --approve.");
  }

  const requestedByNormalized = new Map(approvedStatements.map((item) => [normalizeWhitespace(item), item]));
  const selected = approveAll
    ? candidateItems
    : candidateItems.filter((item) => requestedByNormalized.has(normalizeWhitespace(item)));

  const missingRequested = approveAll
    ? []
    : approvedStatements.filter(
        (item) => !candidateItems.some((candidate) => normalizeWhitespace(candidate) === normalizeWhitespace(item))
      );

  if (!approveAll && selected.length === 0) {
    throw new Error("No approved statements matched current agreement candidates.");
  }

  const existingSet = new Set(acceptedItems.map((item) => normalizeWhitespace(item)));
  const promoted = [];
  const skippedExisting = [];

  for (const item of selected) {
    const normalized = normalizeWhitespace(item);
    if (existingSet.has(normalized)) {
      skippedExisting.push(item);
      continue;
    }
    promoted.push(item);
    existingSet.add(normalized);
  }

  if (promoted.length > 0) {
    const nextMarkdown = replaceAcceptedAgreementsSection(agreementsMarkdown, [...acceptedItems, ...promoted]);
    fs.writeFileSync(resolvedAgreements, nextMarkdown, "utf8");
  }

  return {
    candidatesDetected: candidateItems,
    approvedStatements,
    promoted,
    skippedExisting,
    missingRequested,
    updated: promoted.length > 0
  };
}

module.exports = {
  buildTurnPlan,
  reviewExecutionResult,
  updateWorkingMemory,
  extractAgreementCandidates,
  extractAcceptedAgreements,
  promoteAgreementCandidates,
  detectPrimaryClass,
  detectMode,
  detectRiskLevel,
  readJson,
  readText
};
