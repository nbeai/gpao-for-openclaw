import path from "node:path";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);

type SharedWorkingMemoryPatch = {
  last_assistant_answer?: string;
  numbered_items?: string[];
  last_sentence?: string;
  current_artifact?: string;
  protected_wording?: string[];
  recent_constraints?: string[];
  current_focus?: string;
};

type AgreementCandidate = {
  statement: string;
  rationale: string;
};

export type BeaiMemoryCandidate = {
  text: string;
  source: "current_turn" | "final_reply" | "runtime_constraint" | "handoff_state";
  status: "candidate";
  reason: string;
  policy?: MemoryCandidatePolicy;
  createdAt: string;
};

export type MemoryDurability = "transient" | "session" | "project" | "long_term";
export type MemoryUserIntent = "explicit_memory_request" | "implicit_repeated_standard" | "current_workflow" | "do_not_store";
export type MemoryScope = "personal_preference" | "project_principle" | "approval_boundary" | "execution_state" | "conversation_flow" | "unknown";
export type MemoryFutureUsefulness = "none" | "next_turn" | "multi_session" | "unclear";
export type MemoryConsentLevel = "explicit_accept" | "candidate_only" | "do_not_store";

export type MemoryCandidatePolicy = {
  durability: MemoryDurability;
  userIntent: MemoryUserIntent;
  scope: MemoryScope;
  futureUsefulness: MemoryFutureUsefulness;
  consentLevel: MemoryConsentLevel;
  decision: "store_candidate" | "route_project_state" | "route_session_continuity" | "discard";
  reason: string;
};

export type MemoryRelevanceDecision = {
  score: number;
  relation: "direct" | "adjacent" | "background" | "unrelated";
  stalenessRisk: "none" | "low" | "medium" | "high" | "unknown";
  action: "inject_candidate" | "review_only" | "defer" | "discard";
  reasons: string[];
};

export type MemoryCurrentJudgmentImpact = "none" | "low" | "medium" | "high";
export type FlowMemoryInfluenceType = "session_continuity" | "project_state" | "package_knowledge" | "long_term_memory_candidate" | "discard";

export type BeaiMemoryRelevanceReport = {
  currentInput: string;
  generatedAt: string;
  summary: {
    injectCandidates: number;
    reviewOnly: number;
    deferred: number;
    discarded: number;
  };
  items: Array<{
    text: string;
    source: BeaiMemoryCandidate["source"];
    policy?: MemoryCandidatePolicy;
    relevance: MemoryRelevanceDecision;
    currentJudgmentImpact: MemoryCurrentJudgmentImpact;
    affectsCurrentJudgment: boolean;
    flowStateType: FlowMemoryInfluenceType;
  }>;
  flowStateInfluence: {
    high: number;
    medium: number;
    low: number;
    none: number;
    affectingCurrentJudgment: number;
    items: Array<{
      type: FlowMemoryInfluenceType;
      currentJudgmentImpact: MemoryCurrentJudgmentImpact;
      affectsCurrentJudgment: boolean;
      summary: string;
      source: string;
    }>;
  };
};

export type BeaiAgreementAsset = {
  statement: string;
  status: "candidate" | "accepted";
  source: "explicit_user_instruction" | "runtime_candidate";
  reason: string;
  createdAt: string;
};

export type BeaiProjectStateAsset = {
  currentTrack: string;
  currentFocus: string;
  nextAction: string;
  openLoops: string[];
  lockedDecisions: string[];
  deploymentBoundary: {
    teamDistributionBaseline?: string;
    localRuntimeCandidate?: string;
    rollbackPoint?: string;
    doNotDescribeAs?: string[];
    packageReadiness: "clean_distribution" | "clean_internal_candidate" | "local_observer_candidate" | "not_packaged" | "unknown";
  };
  relevantArtifacts: string[];
  updatedAt: string;
};

export type BeaiDiscardedContextItem = {
  text: string;
  reason: string;
  discardedAt: string;
};

export type SessionContinuityState = {
  currentTrack: string;
  completed: string[];
  inProgress: string[];
  openLoops: string[];
  lockedDecisions: string[];
  nextAction: string;
  closureHandle: string;
  doNotCarry: string[];
  nextSessionOpening: string;
};

export type ConversationArcCapsule = {
  origin: string;
  turningPoints: string[];
  discardedPaths: string[];
  userConcerns: string[];
  currentFlowContext: string;
  nextIntent: string;
  updatedAt: string;
};

export type NewSessionContextPack = {
  opening: string;
  conversationArc: ConversationArcCapsule;
  continuity: SessionContinuityState;
  carry: string[];
  doNotCarry: string[];
  generatedAt: string;
};

export type ContinuityJudgmentProfile = {
  version: "0.4.8";
  mode: "guide_only";
  continuityNeed: "none" | "light" | "handoff_ready" | "session_split_recommended";
  carryForward: string[];
  doNotCarry: string[];
  memoryBoundary: "session_only" | "project_state_candidate" | "memory_review_required";
  openingStyle: "none" | "short_resume" | "next_action_first";
  answerGuidance: string[];
};

export type JudgmentFlowDomain = "family_asset" | "business_operations" | "release_runtime" | "general";
export type JudgmentFlowPosture = "preserve_prior_judgment" | "revise_with_new_variable" | "hold_until_verified" | "choose_next_action";
export type EvidenceClosureState = "open" | "partially_closed" | "closed_by_evidence";

export type EvidenceClosureReport = {
  state: EvidenceClosureState;
  closedChecks: string[];
  remainingChecks: string[];
  evidenceUsed: string[];
};

export type JudgmentFlowProfile = {
  version: "0.4.8";
  mode: "guide_only";
  domain: JudgmentFlowDomain;
  posture: JudgmentFlowPosture;
  stableCriteria: string[];
  changedVariables: string[];
  unresolvedChecks: string[];
  evidenceClosure: EvidenceClosureReport;
  nextJudgmentHandle: string;
  avoid: string[];
  answerGuidance: string[];
};

export type ResponseResolutionLevel =
  | "simple_direct"
  | "artifact_first"
  | "judgment_deep"
  | "overload_reduction"
  | "execution_check"
  | "follow_up_delta_only";

export type ResponseResolution = {
  level: ResponseResolutionLevel;
  depth: "low" | "medium" | "high";
  surfaceHint: string;
  avoid: string[];
};

export type ResponseInertiaRelation =
  | "continues_previous"
  | "modifies_previous"
  | "rejects_previous"
  | "new_direction"
  | "separate_issue"
  | "simple_followup"
  | "artifact_request"
  | "unknown";

export type ResponseInertiaRequiredShift =
  | "none"
  | "shorter_delta_only"
  | "reframe"
  | "answer_directly"
  | "produce_artifact"
  | "ask_one_new_variable"
  | "close_without_question"
  | "separate_contexts";

export type ResponseInertiaProfile = {
  version: "0.6.1";
  mode: "guide_only";
  previousResponseReuseRisk: "low" | "medium" | "high";
  currentTurnRelation: ResponseInertiaRelation;
  shouldReuseStructure: boolean;
  shouldReuseQuestionStyle: boolean;
  shouldRestatePreviousFrame: boolean;
  requiredShift: ResponseInertiaRequiredShift;
  guardNote: string;
  answerGuidance: string[];
};

export type ConversationSceneUtteranceRole =
  | "execute_pending_action"
  | "accept_or_continue_scene"
  | "repair_previous_interpretation"
  | "modify_scene"
  | "direct_answer";

export type ConversationSceneContinuityProfile = {
  version: "0.6.7";
  mode: "guide_only";
  sceneStatus: "active_scene" | "weak_scene" | "none";
  utteranceRole: ConversationSceneUtteranceRole;
  currentScene: string;
  sharedCommitments: string[];
  pendingNextActions: string[];
  repairSignals: string[];
  shouldInheritFlow: boolean;
  shouldPreferExecutionContinuation: boolean;
  guardNote: string;
  answerGuidance: string[];
};

export type InputLevelMaturity =
  | "unformed"
  | "pain_signal"
  | "goal_seeking"
  | "guided_action"
  | "specific_execution"
  | "expert_directive";

export type InputLevelNeed =
  | "orientation"
  | "problem_framing"
  | "first_success_path"
  | "workflow_design"
  | "automation_readiness"
  | "execution"
  | "artifact"
  | "research"
  | "diagnosis"
  | "verification";

export type HumanJourneyStage =
  | "possibility_awareness"
  | "post_install_blank"
  | "first_input_anxiety"
  | "possibility_exploration"
  | "choice_criteria"
  | "pre_execution_control"
  | "automation_desire"
  | "error_trust_break"
  | "operational_debt"
  | "expert_expansion";

export type InputLevelCompanionProfile = {
  version: "0.6.10" | "0.6.11" | "0.6.12" | "0.6.14" | "0.6.15" | "0.6.16" | "0.6.17" | "0.6.18";
  mode: "guide_only";
  inputMaturity: InputLevelMaturity;
  primaryNeed: InputLevelNeed;
  journeyStage: HumanJourneyStage;
  userBurden: "low" | "medium" | "high";
  cognitiveLoadLevel: "low" | "medium" | "high";
  choiceOwnershipRisk: "low" | "medium" | "high";
  trustCalibrationNeed: "none" | "light" | "strong";
  possibleWorldsNeeded: "none" | "light" | "structured";
  explanationDepth: "minimal" | "plain" | "structured" | "technical";
  controlBoundaryNeeded: boolean;
  recoveryNeed: boolean;
  responsePosture: "orient" | "frame" | "guide" | "execute" | "verify" | "produce";
  firstSafeStep: string;
  questionBudget: 0 | 1 | 2;
  shouldOfferOptions: boolean;
  shouldAvoidToolJargon: boolean;
  shouldRouteToSkill: boolean;
  recommendedSkillFamilies: string[];
  guardNote: string;
  answerGuidance: string[];
};

export type JudgmentSharpnessClaimStrength = "verified" | "bounded" | "tentative" | "hold";
export type JudgmentSharpnessUncertaintyAction =
  | "state_verified"
  | "separate_verified_from_unknown"
  | "verify_first"
  | "ask_one_check"
  | "avoid_completion_claim";

export type JudgmentSharpnessProfile = {
  version: "0.6.2";
  mode: "guide_only";
  claimStrength: JudgmentSharpnessClaimStrength;
  uncertaintyAction: JudgmentSharpnessUncertaintyAction;
  shouldSharpenConfirmed: boolean;
  shouldSoftenUnverified: boolean;
  shouldAskNewQuestion: boolean;
  guardNote: string;
  answerGuidance: string[];
};

export type ExecutionResultState = "completed" | "partial" | "failed" | "skipped" | "blocked" | "unverified";
export type ExecutionMode = "diagnosis" | "execution" | "implementation" | "verification" | "planning" | "conversation";
export type ToolRiskLevel = "low" | "medium" | "high";
export type ToolRiskAction = "observe" | "recommend_approval";
export type ToolResultState = "succeeded" | "failed" | "unknown";
export type ResponseStateLabel =
  | "listening"
  | "thinking"
  | "running"
  | "waiting_user"
  | "waiting_approval"
  | "blocked"
  | "completed"
  | "failed";
export type InstallResultLabel = "complete" | "partial" | "blocked" | "disabled";

export type ExecutionReview = {
  attempted: string[];
  changed: string[];
  verified: string[];
  notChanged: string[];
  unverified: string[];
  resultState: ExecutionResultState;
  nextCheck: string;
};

export type UserConfidenceState = {
  executionMode: ExecutionMode;
  responseState: ResponseStateLabel;
  userMeaning: string;
  nextVisibleAction: string;
};

export type ToolRiskClassification = {
  toolName: string;
  riskLevel: ToolRiskLevel;
  action: ToolRiskAction;
  reasons: string[];
  derivedPaths: string[];
};

export type ToolResultSemantics = {
  toolName: string;
  state: ToolResultState;
  durationMs?: number;
  hasResult: boolean;
  hasError: boolean;
  shouldPersistDetails: "none" | "bounded";
  reasons: string[];
};

export type PersistedToolResultSanitization = {
  message: unknown;
  changed: boolean;
  reason: string;
  originalChars: number;
};

export type CompanionProfile = {
  assistantName: string;
  userFacingTone: string;
  relationshipDistance: "practical" | "warm" | "close" | "formal";
  memoryPreference: "ask-first" | "candidate-first" | "minimal";
  automationBoundary: "manual-first" | "confirm-before-scheduling" | "allow-low-risk-routines";
  primaryUseCases: string[];
  neverDoWithoutApproval: string[];
};

export type CapabilityTranslation = {
  userNeed: string;
  capabilityKind: "skill" | "plugin" | "agent" | "cron" | "memory" | "manual-workflow";
  plainLanguageExplanation: string;
  readiness: "candidate" | "recommended" | "ready-to-configure" | "not-yet";
  whyNow: string;
  firstSafeStep: string;
};

export type SkillRoutingKind = "skill" | "agent" | "manual_workflow";
export type SkillRoutingAction = "recommend_use" | "hold_candidate" | "needs_user_approval";
export type SkillRoutingCandidate = {
  id: string;
  kind: SkillRoutingKind;
  title: string;
  confidence: "low" | "medium" | "high";
  action: SkillRoutingAction;
  reasons: string[];
  triggerSignals: string[];
  safetyNotes: string[];
};

export type SkillRoutingReport = {
  mode: "observer";
  generatedAt: string;
  currentInputPreview: string;
  candidates: SkillRoutingCandidate[];
  suppressed: string[];
  note: string;
};

export type WorkflowLedgerStage =
  | "no_candidate"
  | "conversation_signal"
  | "manual_test"
  | "skill_candidate"
  | "agent_candidate"
  | "cron_candidate"
  | "automated";

export type WorkflowLedgerStatus =
  | "no_candidate"
  | "not_cron_ready"
  | "manual_test_required"
  | "skill_candidate_ready"
  | "agent_review_required"
  | "cron_ready"
  | "automation_active"
  | "blocked";

export type WorkflowRiskLevel = "low" | "medium" | "high";

export type WorkflowCard = {
  workflowId: string;
  title: string;
  stage: WorkflowLedgerStage;
  owner: string;
  requiredInputs: string[];
  riskLevel: WorkflowRiskLevel;
  externalSend: boolean;
  fileWrite: boolean;
  moneyMovement: boolean;
  promotionConditions: string[];
  doNotPromoteIf: string[];
  lastVerifiedAt: string | null;
  status: WorkflowLedgerStatus;
  triggerSignals: string[];
  userFacingSummary: string;
  updatedAt: string;
};

export type ManualRunEvidenceLedger = {
  workflowId: string;
  requiredRuns: number;
  observedRuns: number;
  successfulRuns: number;
  failedRuns: number;
  inputPathStable: boolean;
  outputFormatStable: boolean;
  status: "not_started" | "collecting" | "sufficient" | "blocked";
  evidence: string[];
};

export type PromotionGateResult = {
  workflowId: string;
  checkedAt: string;
  fromStage: WorkflowLedgerStage;
  targetStage: "skill" | "agent" | "cron" | "automation_registry";
  status: "blocked" | "candidate_only" | "ready_for_review" | "ready";
  cronReady: boolean;
  blockers: string[];
  requiredApprovals: string[];
  userFacingSummary: string;
};

export type AutomationRegistryEntry = {
  automationId: string;
  workflowId: string;
  name: string;
  ownerAgent: string;
  schedule: string | null;
  status: "active" | "paused" | "disabled";
  stopMethod: string;
  failurePolicy: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

export type WorkflowStateLedger = {
  version: "0.6.0";
  mode: "observer";
  generatedAt: string;
  currentInputPreview: string;
  repeatedWorkSignal: "none" | "weak" | "candidate" | "scheduled_candidate";
  workflowCard: WorkflowCard | null;
  manualRunEvidence: ManualRunEvidenceLedger | null;
  promotionGate: PromotionGateResult | null;
  automationRegistry: {
    entries: AutomationRegistryEntry[];
    note: string;
  };
  userFacingGuidance: string[];
  mustNot: string[];
};

export type OperatingDelegationCandidate =
  | "direct_answer"
  | "skill_candidate"
  | "agent_candidate"
  | "workflow_candidate"
  | "automation_candidate"
  | "hold"
  | "approval_required"
  | "do_not_do";

export type OperatingDelegationLevel =
  | "L0_answer_only"
  | "L1_draft_only"
  | "L2_review_or_organize"
  | "L3_internal_proposal"
  | "L4_execute_after_approval"
  | "L5_repeated_automation_candidate"
  | "L6_high_risk_strong_approval";

export type OperatingRiskFamily =
  | "external_send"
  | "delete"
  | "install"
  | "restart"
  | "payment"
  | "browser_submit"
  | "device_action"
  | "cron_creation"
  | "permission_change"
  | "durable_memory_write";

export type OperatingStateHygieneClass =
  | "memory"
  | "agreement"
  | "project_state"
  | "session_continuity"
  | "task_history"
  | "transcript_residue"
  | "tool_failure_residue"
  | "approval_residue";

export type OperatingTelegramConfidenceState =
  | "listening"
  | "thinking"
  | "waiting_approval"
  | "running"
  | "paused"
  | "blocked"
  | "failed"
  | "partial"
  | "complete"
  | "recovery";

export type OperatingTelegramEvidenceLevel =
  | "configured"
  | "gateway_channel_reachable"
  | "live_roundtrip_verified"
  | "not_applicable";

export type OperatingClaimLabel = "complete" | "partial" | "blocked" | "failed" | "unverified";

export type ApprovalErgonomicsLevel = "auto_allowed" | "conditional_allowed" | "approval_required";

export type ApprovalRiskTransition =
  | "none"
  | "low_risk_preparation"
  | "same_scope_continuation"
  | "beai_owned_reversible_change"
  | "high_risk_mutation";

export type OperatingJudgmentInput = {
  currentInput: string;
  mode?: BeaiMode;
  primaryClass?: SharedTurnPlan["primaryClass"];
  riskLevel?: "low" | "medium" | "high";
  requiresUserConfirmation?: boolean;
  telegramEvidenceLevel?: OperatingTelegramEvidenceLevel;
  toolRisk?: ToolRiskClassification;
  executionResultState?: ExecutionResultState;
  hasVerificationEvidence?: boolean;
  surfaceCorrectionNeeded?: boolean;
};

export type BeaiOperatingJudgmentReport = {
  version: "0.4.8";
  mode: "observer";
  delegation: {
    candidate: OperatingDelegationCandidate;
    level: OperatingDelegationLevel;
    reasons: string[];
  };
  risk: {
    families: OperatingRiskFamily[];
    approvalRequired: boolean;
    strongApprovalRequired: boolean;
  };
  approvalErgonomics: {
    level: ApprovalErgonomicsLevel;
    riskTransition: ApprovalRiskTransition;
    shouldAskUserNow: boolean;
    shouldProceedWithoutInterruption: boolean;
    afterActionReportRequired: boolean;
    bundleSamePurposeSteps: boolean;
    approvalSummary: {
      action: string;
      impactScope: string;
      doesNotTouch: string;
      recovery: string;
      decision: string;
    };
    guidance: string[];
  };
  stateHygiene: {
    classes: OperatingStateHygieneClass[];
    durableWriteAllowed: false;
  };
  telegramConfidence: {
    state: OperatingTelegramConfidenceState;
    evidenceLevel: OperatingTelegramEvidenceLevel;
  };
  claim: {
    label: OperatingClaimLabel;
    surfaceCorrectionNeeded: boolean;
  };
  rollback: {
    runtime: boolean;
    state: boolean;
    surfaceClaimCorrection: boolean;
  };
};

export type RecoveryFamily =
  | "telegram_surface"
  | "gateway_runtime"
  | "model_auth"
  | "plugin_runtime"
  | "memory_context"
  | "session_queue"
  | "cron_automation"
  | "unknown";

export type RecoverySummary = {
  family: RecoveryFamily;
  confirmedState: string[];
  likelyCauses: string[];
  unknowns: string[];
  nextCheck: string;
  avoid: string[];
};

export type RecoveryEscalationStage = 1 | 2 | 3;

export type RealitySignalSource =
  | "user_input"
  | "runtime_plan"
  | "runtime_constraint"
  | "verification_result"
  | "tool_or_status"
  | "assumption";

export type RealitySignalStrength = "strong" | "medium" | "weak" | "unknown";
export type RealitySignalClass = "confirmed_fact" | "observed_signal" | "runtime_inference" | "assumption" | "needs_verification";
export type RealityClaimPosture = "can_state" | "state_with_boundary" | "say_observed_only" | "ask_or_verify_first";

export type RealitySignal = {
  label: string;
  text: string;
  source: RealitySignalSource;
  strength: RealitySignalStrength;
  realityClass: RealitySignalClass;
  verified: boolean;
  reason: string;
};

export type RealitySignalMap = {
  signals: RealitySignal[];
  strongSignals: string[];
  mediumSignals: string[];
  weakSignals: string[];
  unknownSignals: string[];
};

export type EvidenceLedger = {
  userProvided: string[];
  runtimeInferred: string[];
  toolVerified: string[];
  assumptions: string[];
  needsVerification: string[];
};

export type RealitySignalProfile = {
  version: "0.4.8";
  mode: "observer";
  claimPosture: RealityClaimPosture;
  confirmedFacts: string[];
  observedSignals: string[];
  runtimeInferences: string[];
  assumptions: string[];
  needsVerification: string[];
  answerGuidance: string[];
};

export type ClaimStrengthCheck = {
  allowedClaimStrength: RealitySignalStrength;
  overclaimRisk: boolean;
  reasons: string[];
  rewriteInstruction?: string;
};

export type SourceBoundaryCheck = {
  sourceBoundaryRisk: boolean;
  riskyPhrases: string[];
  rewriteInstruction?: string;
};

type SharedWorkOrder = {
  objective?: string;
  currentContext?: string;
  inputSources?: string[];
  allowedActions?: string[];
  forbiddenActions?: string[];
  successCriteria?: string[];
};

type SharedTurnPlan = {
  mode: "conversation" | "planning" | "handoff";
  primaryClass:
    | "answer"
    | "editing"
    | "summary"
    | "planning"
    | "artifact_generation"
    | "verification"
    | "local_execution"
    | "diagnosis"
    | "classification"
    | "package_readiness";
  riskLevel: "low" | "medium" | "high";
  requiresVerification: boolean;
  requiresUserConfirmation: boolean;
  responseStrategy: string;
  immediateAsk: string;
  turnJudgment?: "answer" | "artifact" | "clarify" | "defer" | "verify" | "diagnose" | "execute";
  judgmentTags?: string[];
  roleCutoffPolicy?: {
    primaryRoleCount?: number;
    maxSupportingRoles?: number;
    principle?: string;
    memoryDefault?: string;
    automationDefault?: string;
    rules?: string[];
  } | null;
  primaryRole?: string | null;
  supportingRoles?: string[];
  roleSignals?: Array<{
    role: string;
    reason: string;
    artifact: string;
    priority?: "normal" | "high";
    surfaceEffect?: string;
  }>;
  workOrder: SharedWorkOrder | null;
  continuityPatch: SharedWorkingMemoryPatch;
  sessionPressure?: {
    level?: "ok" | "watch" | "organize_recommended" | "recommend_split" | "warn_before_large_execution";
    contextUsagePct?: number | null;
    reasons?: string[];
    suggestedAction?: "none" | "observe" | "organize_current_block" | "split_or_compact" | "split_or_compact_before_large_execution";
    protectCurrentBlock?: boolean;
    handoffStateReady?: boolean;
    shouldAskForSplitApproval?: boolean;
    approvalPrompt?: string | null;
    handoffStarter?: {
      currentState?: string;
      nextSessionGoal?: string;
      doNotDoYet?: string;
      doneWhen?: string;
    } | null;
  } | null;
  handoffState?: {
    current_track?: string;
    completed?: string[];
    in_progress?: string[];
    next_work?: string;
    important_decisions?: string[];
    remaining_verification?: string[];
    relevant_file_paths?: string[];
    do_not_touch?: string[];
    user_continuation_opening?: string;
    topics?: string[];
    keywords_by_topic?: Record<string, string[]>;
    anchor_sentences_by_topic?: Record<string, string>;
    story_by_topic?: Record<string, string>;
    facts_locked?: string[];
    decisions_made?: string[];
    open_loops?: string[];
    next_action?: string;
    closure_handle?: string;
    do_not_carry?: string[];
    working_stance?: string;
    carry_priority?: {
      must_carry?: string[];
      useful_carry?: string[];
      discard?: string[];
    };
    user_continuity_message?: string;
    new_session_opening_message?: string;
  } | null;
};

type SharedCoreModule = {
  buildTurnPlan: (input: {
    userMessage: string;
    sessionContextUsagePct?: number;
    hasLargeToolOutputs?: boolean;
    hasMixedPlanningAndExecution?: boolean;
    nextStepStartsNewPhase?: boolean;
    toolResidueSignals?: string[];
  }) => SharedTurnPlan;
  reviewExecutionResult: (input: {
    taskName?: string;
    resultStatus?: string;
    whatChecked?: string[];
    whatChanged?: string[];
    whatNotChanged?: string[];
    remainingRisks?: string[];
    recommendedNextStep?: string;
    verificationMethod?: string;
    finalState?: string;
    notVerifiedReason?: string;
    skipReason?: string;
    impactScope?: string;
    failurePoint?: string;
    blockingCondition?: string;
    resumeCondition?: string;
  }) => {
    resultStatus: string;
    finalResponse: string[];
    resultReviewContract?: {
      userFacingState?: string;
      allowedLanguage?: string[];
      avoid?: string[];
      reportStructure?: string[];
    };
    continuityPatch: SharedWorkingMemoryPatch;
  };
  updateWorkingMemory: (filePath: string, patch: SharedWorkingMemoryPatch) => Record<string, unknown>;
};

function loadSharedCore(): SharedCoreModule {
  const candidates = [
    "../runtime/beai-runtime-lib.cjs"
  ];
  const tried: string[] = [];

  for (const candidate of candidates) {
    try {
      const resolved = require.resolve(candidate);
      return require(resolved) as SharedCoreModule;
    } catch (error) {
      tried.push(candidate);
    }
  }

  throw new Error(`BEAI shared runtime core was not found. Tried: ${tried.join(", ")}`);
}

const sharedCore = loadSharedCore();

export type BeaiMode = "conversation" | "planning" | "handoff";

export type BeaiTurnPlan = {
  mode: BeaiMode;
  primaryClass: SharedTurnPlan["primaryClass"];
  riskLevel: "low" | "medium" | "high";
  requiresVerification: boolean;
  requiresUserConfirmation: boolean;
  responseStrategy: "direct_reply" | "structured_plan" | "work_order";
  objective: string;
  constraints: string[];
  deliverables: string[];
  acceptanceChecks: string[];
  judgmentTags: string[];
  roleCutoffPolicy?: NonNullable<SharedTurnPlan["roleCutoffPolicy"]>;
  primaryRole?: string | null;
  supportingRoles: string[];
  roleSignals: NonNullable<SharedTurnPlan["roleSignals"]>;
  workOrder?: OpenClawWorkOrder;
  continuityPatch: WorkingMemoryPatch;
  sessionPressure?: SharedTurnPlan["sessionPressure"];
  handoffState?: SharedTurnPlan["handoffState"];
  currentTurn: CurrentTurnPacket;
  judgmentFrame: JudgmentFrame;
  flowState: FlowStateSpine;
  responseResolution: ResponseResolution;
  realitySignalMap: RealitySignalMap;
  evidenceLedger: EvidenceLedger;
  realitySignalProfile: RealitySignalProfile;
  continuityJudgment: ContinuityJudgmentProfile;
  judgmentFlow: JudgmentFlowProfile;
  userConfidence: UserConfidenceState;
  skillRouting: SkillRoutingReport;
  surfaceFlow: SurfaceFlowProfile;
  decisionHandleSurface: DecisionHandleSurfaceProfile;
  conversationalRhythm: ConversationalRhythmProfile;
  conversationQualityGuard: ConversationQualityGuardProfile;
  humanCompanionQuality: HumanCompanionQualityProfile;
  runtimeResponseGate: RuntimeResponseGateProfile;
  classificationFailSoft: ClassificationFailSoftProfile;
  operatingJudgment: BeaiOperatingJudgmentReport;
  workflowStateLedger: WorkflowStateLedger;
  responseInertia: ResponseInertiaProfile;
  conversationSceneContinuity: ConversationSceneContinuityProfile;
  inputLevelCompanion: InputLevelCompanionProfile;
  judgmentSharpness: JudgmentSharpnessProfile;
  sharedPlan: SharedTurnPlan;
};

export type SurfaceInterventionKind =
  | "companion_setup"
  | "approval_boundary"
  | "state_hygiene"
  | "recovery"
  | "delegation"
  | "capability_translation"
  | "session_split"
  | "install_resume"
  | "install_guide"
  | "handoff"
  | "execution_review";

export type SurfaceInterventionDecision = {
  mode: "hard_rewrite" | "guidance_only" | "defer_to_model";
  allowHardRewrite: boolean;
  reason: string;
  strongerCurrentIntent?:
    | "active_runtime_outage"
    | "install_or_upgrade"
    | "approval_boundary"
    | "artifact_request"
    | "surface_loop_complaint"
    | "vague_action_followup"
    | "conceptual_discussion";
};

export type SurfaceFlowProfile = {
  mode: "guide_only";
  rewriteOutput: false;
  clarityTarget: "clear_understanding";
  overCompression: "avoid";
  firstSentence: "enter_user_reality" | "artifact_first" | "state_first" | "direct";
  artifactFirst: boolean;
  decisionQuestionsMax: 1 | 2;
  choiceLimit: 3;
  closeWith: "one_handle";
  userRealityLanguage: boolean;
  avoid: string[];
};

export type DecisionHandleKind = "judgment" | "next_action" | "verification" | "artifact" | "handoff";

export type DecisionHandleSurfaceProfile = {
  version: "0.4.8";
  mode: "guide_only";
  kind: DecisionHandleKind;
  primaryHandle: string;
  closeStyle: "decision_first" | "next_action_first" | "condition_first" | "artifact_first";
  mustNotCloseWith: string[];
  guidance: string[];
};

export type ConversationalRhythmProfile = {
  version: "0.4.8";
  mode: "guide_only";
  openingMove: "meet_emotion" | "meet_reality" | "answer_directly" | "artifact_first" | "state_first";
  density: "compact" | "balanced" | "expanded_when_needed";
  warmth: "low" | "medium" | "high";
  structure: "plain_paragraphs" | "short_sections" | "checklist_when_useful";
  companionStance: "steady" | "practical" | "careful" | "urgent";
  avoid: string[];
  guidance: string[];
};

export type ConversationQualityFixture = "family_asset" | "business_operations" | "approval_frustration" | "artifact_request" | "general";

export type ConversationQualityGuardProfile = {
  version: "0.4.8";
  mode: "guide_only";
  fixture: ConversationQualityFixture;
  qualityTarget: "clear_mind" | "usable_artifact" | "calm_recovery" | "decision_clarity";
  mustPreserve: string[];
  mustAvoid: string[];
  regressionChecks: string[];
};

export type HumanCompanionQualityProfile = {
  version: "0.1";
  mode: "guide_only";
  userExperienceTarget:
    | "feel_understood"
    | "clear_next_action"
    | "stable_long_context"
    | "recover_trust"
    | "usable_output";
  cognitiveFrame: {
    load: "low" | "medium" | "high";
    reduceBy: string[];
  };
  dialogueFrame: {
    stance: "mirror_then_move" | "clarify_then_act" | "act_then_explain" | "repair_then_verify";
    mustDo: string[];
    mustAvoid: string[];
  };
  continuityFrame: {
    preserveCurrentRequest: boolean;
    usePriorContextAs: "supporting_context" | "active_constraint" | "ignore_unless_relevant";
    longConversationRisk: "low" | "medium" | "high";
  };
  agencyFrame: {
    preserveUserChoice: boolean;
    doNotOutsourceJudgmentToUser: boolean;
    decisionReturn: string;
  };
  userRealityFrame: {
    preserveBeforeInterpretation: boolean;
    realitySignals: string[];
    mustNotOverwrite: string[];
  };
  burdenReducer: {
    strategy: "keep_small" | "narrow_to_one_handle" | "artifact_first" | "verify_then_decide";
    reduceBy: string[];
  };
  conversationAssetLedger: {
    acceptedContextOnly: boolean;
    priorContextRole: "supporting_context" | "active_constraint" | "candidate_only";
    mustNotPromote: string[];
  };
  artifactSceneModel: {
    artifactFirst: boolean;
    sceneFit: "required" | "not_applicable";
    mustDo: string[];
  };
  recoveryFrame: {
    required: boolean;
    repairAction: string;
    mustAvoid: string[];
  };
  conversationalFlowCore: {
    intentTracking: "current_intent_first" | "unclear_intent_verify_first";
    contextMotion: "fluid_context_selection" | "boundary_required";
    naturalnessTarget: "human_state_aware" | "mechanical_context_risk";
    mustDo: string[];
    mustAvoid: string[];
  };
  regressionChecks: string[];
};

export type RuntimeResponseGateCheckState = "required" | "not_applicable" | "pass_when_output_matches";

export type RuntimeResponseGateProfile = {
  version: "0.1";
  mode: "guide_only";
  firstSentence: RuntimeResponseGateCheckState;
  artifactFirst: RuntimeResponseGateCheckState;
  followUpDeltaOnly: RuntimeResponseGateCheckState;
  stateBoundary: RuntimeResponseGateCheckState;
  visibleDelivery: RuntimeResponseGateCheckState;
  closureHandle: string;
  blockIf: string[];
  mustPreserve: string[];
  mustAvoid: string[];
  guidance: string[];
};

export type ClassificationFailSoftProfile = {
  version: "0.5.1";
  mode: "guide_only";
  narrowClassification: "allowed" | "hold" | "avoid";
  signalBasis: string[];
  counterexampleGuards: string[];
  messengerFallback: string;
  mustNot: string[];
};

export type OpenClawWorkOrder = {
  taskType: "execution";
  objective: string;
  inputSummary: string;
  steps: string[];
  constraints: string[];
  deliverables: string[];
  acceptanceChecks: string[];
};

export type WorkingMemoryPatch = {
  last_assistant_answer?: string;
  numbered_items?: string[];
  last_sentence?: string;
  current_artifact?: string;
  recent_constraints?: string[];
  current_focus?: string;
};

export type InstallGuideSurfaceContext = {
  packageRef?: string;
  packageLabel?: string;
  packageSource?: string;
  resumeAfterRestart?: boolean;
  restartReason?: string;
};

export type FollowUpScope = "full" | "narrow" | "single-item" | "last-answer-part";

export type CurrentTurnPacket = {
  rawInput: string;
  cleanInput: string;
  currentTarget?: string;
  requestedOutputShape?: string;
  followUpScope?: FollowUpScope;
  explicitConstraints: string[];
  missingCriticalInputs: string[];
};

export type ResponseRole = "direct_answer" | "artifact" | "judgment" | "plan" | "work_order" | "diagnosis" | "defer" | "clarify" | "close";

export type JudgmentFrame = {
  confirmed: string[];
  unknown: string[];
  assumptionCandidates: string[];
  responseRole: ResponseRole;
  askOneQuestion?: string;
  deferCondition?: string;
  lastHandle: string;
};

export type FlowStateEvidenceState = {
  configured: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked";
  registered: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked";
  callable: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked";
  outputVerified: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked" | "unverified";
  doctor: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked" | "review";
  release: "unknown" | "not_applicable" | "pending" | "required" | "verified" | "blocked" | "review";
};

type FlowEvidenceStatus = FlowStateEvidenceState["configured"];

export type FlowStateSpine = {
  version: "0.1";
  currentTarget?: string;
  requestedShape?: string;
  responseRole: ResponseRole;
  confirmed: string[];
  unknowns: string[];
  assumptions: string[];
  userBurden: "low" | "medium" | "high";
  toolNeed: "none" | "local_tools" | "local_tools_with_boundary" | "external_tools";
  approvalBoundary: {
    required: boolean;
    scope: string[];
    recovery: string;
  };
  evidenceState: FlowStateEvidenceState;
  closureHandle: string;
  deliverySurface: {
    surface: "local" | "telegram_direct" | "openclaw" | "unknown";
    visibleDelivery: "not_applicable" | "required" | "unverified" | "verified";
    requiredCloseout: string;
  };
  memoryInfluence: Array<{
    type: "session_continuity" | "project_state" | "package_knowledge" | "long_term_memory_candidate" | "discard";
    currentJudgmentImpact: "none" | "low" | "medium" | "high";
    affectsCurrentJudgment: boolean;
    summary: string;
    source: string;
  }>;
};

export type SurfaceLanguageCheck = {
  internalLabelsFound: string[];
  questionCount: number;
  hasLastHandle: boolean;
  artifactDelayedByExplanation: boolean;
  rewriteSuggestion?: string;
};

export type TelegramUxStateKind =
  | "approval_wait"
  | "codex_command_approval_wait"
  | "approval_expired"
  | "gateway_restart_recovery"
  | "internal_progress_surface"
  | "long_running_work"
  | "queued_task"
  | "delivery_failure"
  | "channel_disconnected";

export type TelegramUxState = {
  kind: TelegramUxStateKind;
  confidence: "high" | "medium";
  userMeaning: string;
  nextAction: string;
  shouldAppendToPayload: boolean;
};

const INTERNAL_REPLY_TERMS = [
  "[beai runtime overlay]",
  "[system] your previous turn was interrupted",
  "your previous turn was interrupted by a gateway restart",
  "continue from the existing transcript",
  "openclaw was waiting on tool/model work",
  "[beai work order]",
  "debugsummary:",
  "finalresponse:",
  "final response:",
  "최종 응답:",
  "work_order_outline"
];

const APPROVAL_WAIT_TERMS = [
  "plugin approval required",
  "apply workspace skill proposal",
  "codex app-server command approval",
  "reply with: /approve",
  "allow-once",
  "deny",
  "expires in:"
];

const META_ARTIFACT_PATTERNS = [
  /^delivery:\s/i,
  /^\[beai runtime overlay\]/i,
  /^\[beai internal process surface isolated\]/i,
  /^conversation info/i,
  /^sender \(/i,
  /^openclaw assembled context/i,
  /^the latest user message is/i,
  /final assistant text is not automatically delivered/i
];

const INTERNAL_PROCESS_LINE_PATTERNS = [
  /^pinching$/i,
  /^[🧠📓🛠️🧩]\s/,
  /^memory search\s*:/i,
  /^memory get\s*:/i,
  /^approval\s*:/i,
  /^tool\s*:\s*codex_command_approval/i,
  /^plugin\s*:\s*openclaw-codex-app-server/i,
  /^session\s*:\s*agent:/i,
  /^id\s*:\s*plugin:/i,
  /^expires in\s*:/i,
  /^reply with\s*:\s*\/approve/i,
  /\bcodex app-server command approval\b/i,
  /\bcodex app-server approval requested\b/i,
  /\bopenclaw .*approval requested\b/i,
  /\b\(agent\)\s*$/i,
  /\b(memory search|memory get|check git status|run pwd|search "package\.json")\b/i
];

const EXECUTION_REPORT_HEADERS = [
  "What was checked",
  "What was changed",
  "What was not changed",
  "Result status",
  "Remaining risks or unverified items",
  "Recommended next step",
  "무엇을 확인했는지",
  "무엇을 적용했는지",
  "무엇을 바꿨는지",
  "무엇을 바꾸지 않았는지",
  "결과 상태",
  "남아 있는 미확인 또는 리스크",
  "남은 리스크 또는 미검증 항목",
  "권장 다음 단계",
  "다음 조치"
] as const;

function firstSentence(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "사용자 요청을 정리합니다.";
  const match = trimmed.match(/^(.{1,220}?[.!?]|.{1,220}$)/);
  return (match?.[1] ?? trimmed).trim();
}

function cleanCurrentTurnInput(text: string): string {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  const currentRequestMatch = trimmed.match(/Current user request:\s*([\s\S]*?)(?:\nThe latest user message is|$)/i);
  if (currentRequestMatch?.[1]?.trim()) {
    return cleanCurrentTurnInput(currentRequestMatch[1]);
  }

  const transcriptLineMatches = Array.from(trimmed.matchAll(/^#\d+\s+[^\n]*?\s+([^:\n]+):\s*([\s\S]*?)(?=\n#\d+\s+|\n```json|\n*$)/gim)).filter((match) => {
    const speaker = String(match[1] || "").trim();
    return Boolean(speaker) && !/(aigis|assistant|다구|codex|bot)/i.test(speaker);
  });
  const lastTranscriptUserText = transcriptLineMatches.at(-1)?.[2]?.trim();
  if (lastTranscriptUserText) {
    const tailAfterLastTranscript = trimmed.slice((transcriptLineMatches.at(-1)?.index ?? 0) + transcriptLineMatches.at(-1)![0].length).trim();
    const nonMetaTail = tailAfterLastTranscript
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith("```json") && !/^#\d+\s+/.test(item))
      .at(-1);
    return cleanCurrentTurnInput(nonMetaTail || lastTranscriptUserText);
  }

  return trimmed
    .replace(/^\[BEAI Runtime Overlay\][\s\S]*?(?:\n\n|$)/i, "")
    .replace(/^Delivery:\s.*$/gim, "")
    .replace(/^Conversation (?:info|context).*$/gim, "")
    .replace(/^Sender .*$/gim, "")
    .replace(/^OpenClaw assembled context.*$/gim, "")
    .replace(/^The latest user message is.*$/gim, "")
    .trim();
}

function detectFollowUpScope(input: string): FollowUpScope {
  const normalized = input.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return "full";
  if (/(마지막|끝|last|제목|타이틀|title|열\s*이름|컬럼\s*명|column\s*name)\s*(문장|줄|paragraph|sentence|만|더|바꿔|짧게)?|마지막\s*문장만|방금\s*답변의\s*(?:제목|타이틀|문장|문단).{0,20}(?:만|짧게|바꿔|수정)|(?:위\s*)?표에서.{0,24}(?:열\s*이름|컬럼\s*명).{0,24}(?:만|바꿔|수정)|last sentence/.test(normalized)) {
    return "last-answer-part";
  }
  if (/(^\s*)?(\d+)\s*(번|번째|항목|item)\s*(?:항목)?\s*만|only\s*(item\s*)?\d+|#\d+\s*only/.test(normalized)) {
    return "single-item";
  }
  if (/(이 부분만|그 부분만|방금 것만|여기만|이것만|저것만|only this|just this|부분만|문장만|문단만)/.test(normalized)) {
    return "narrow";
  }
  return "full";
}

function detectRequestedOutputShape(input: string): string | undefined {
  const normalized = input.toLowerCase();
  const checks: Array<[string, RegExp]> = [
    ["summary", /요약|summari[sz]e|summary/],
    ["comparison", /비교|compare|차이|versus|\bvs\b/],
    ["edit", /수정|다듬|고쳐|rewrite|revise|edit|문장만|톤/],
    ["translation", /번역|translate/],
    ["calculation", /계산|얼마|합계|평균|calculate|sum/],
    ["classification", /분류|classif|카테고리/],
    ["review", /리뷰|검토|평가|audit|review/],
    ["plan", /계획|로드맵|plan|단계|설계/],
    ["work_order", /작업\s*지시|work\s*order|시킬\s*작업|지시서/],
    ["artifact", /작성|초안|문서|문구|메시지|안내문|표|템플릿|글|메일|공지|리포트|보고서|draft|write|create/],
    ["execution", /설치|실행|적용|바꿔|만들어|고쳐줘|진행해|run|install|apply|execute/],
    ["diagnosis", /왜|문제|오류|안\s*돼|응답을\s*안|진단|diagnos|error|fail/],
    ["question", /\?$|질문/]
  ];
  return checks.find(([, pattern]) => pattern.test(normalized))?.[0];
}

function detectCurrentTarget(input: string): string | undefined {
  const normalized = input.replace(/\s+/g, " ").trim();
  const fileMatch = normalized.match(/(?:파일|문서|경로|path|file)\s*[:：]?\s*(`[^`]+`|"[^"]+"|'[^']+'|\/[^\s]+|[^\s]+\.(?:md|txt|json|js|ts|tsx|jsx|zip|csv|pdf|docx|xlsx))/i);
  if (fileMatch?.[1]) return fileMatch[1].replace(/^['"`]|['"`]$/g, "");

  const quoted = normalized.match(/["“'`](.{2,160})["”'`]\s*(?:만|을|를|으로|에 대해)?/);
  if (quoted?.[1] && /(문장|부분|이것|이거|다듬|수정|번역|요약)/.test(normalized)) {
    return quoted[1].trim();
  }

  if (/(마지막|\d+\s*번|\d+\s*번째|제목만|타이틀만|열\s*이름만|위\s*표|방금\s*답변|이 부분|그 부분|방금 것|위 답변|앞 답변|last|previous)/i.test(normalized)) {
    return "previous_assistant_answer";
  }

  return undefined;
}

function detectExplicitConstraints(input: string): string[] {
  const constraints = new Set<string>();
  const normalized = input.toLowerCase();
  if (/하지\s*마|말고|금지|no\s+|don't|do not/.test(normalized)) {
    const fragments = input
      .split(/[.\n]/)
      .map((item) => item.trim())
      .filter((item) => /(하지\s*마|말고|금지|no\s+|don't|do not)/i.test(item));
    for (const fragment of fragments.slice(0, 4)) constraints.add(fragment);
  }
  if (/검색하지\s*말|browse\s*하지\s*말|no\s*search|without\s*search/i.test(input)) {
    constraints.add("외부 검색 없이 현재 제공된 정보만 사용합니다.");
  }
  if (/실행하지\s*말|계획만|don't\s*run|do\s*not\s*execute|plan\s*only/i.test(input)) {
    constraints.add("실행하지 않고 계획 또는 판단까지만 제공합니다.");
  }
  if (/짧게|간단히|한\s*문단|brief|concise/i.test(input)) {
    constraints.add("짧고 압축된 답변을 우선합니다.");
  }
  return Array.from(constraints);
}

function detectMissingCriticalInputs(input: string, requestedOutputShape: string | undefined, followUpScope: FollowUpScope): string[] {
  const missing: string[] = [];
  const normalized = input.trim();
  if (!normalized) {
    missing.push("current user input");
    return missing;
  }
  if (followUpScope !== "full") return missing;
  if (requestedOutputShape === "translation" && !/영어|한국어|일본어|중국어|프랑스어|스페인어|to\s+\w+|into\s+\w+/i.test(input)) {
    missing.push("target language");
  }
  if (requestedOutputShape === "comparison" && !/(와|과|랑|vs|versus|and|,).{1,160}(비교|compare|차이|vs)/i.test(input)) {
    missing.push("comparison targets");
  }
  if (requestedOutputShape === "execution" && /(바꿔|적용|설치|삭제|실행|apply|install|delete|run)/i.test(input) && /(뭘|무엇|어디|어떤|somewhere)/i.test(input)) {
    missing.push("execution target");
  }
  return missing;
}

function isCompactApprovalContinuationInput(input: string | undefined): boolean {
  const normalized = String(input || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return false;
  return /^(진행해|진행하자|진행|승인|계속|좋아\.?\s*진행해|go ahead|proceed|continue)$/i.test(normalized);
}

export function classifyExecutionMode(input: string): ExecutionMode {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "conversation";

  if (/(만들어|작성해|구현해|패치|수정해|고쳐줘|설치해줘|배포파일.*만들|zip.*만들|implement|create|build|patch|fix|install)/i.test(normalized)) {
    return "implementation";
  }

  if (isCompactApprovalContinuationInput(normalized)) return "execution";

  if (/(진행해|진행하자|진행|적용해|반영해|실행해|계속|계속해|라이브.*적용|run|apply|execute|proceed|continue)/i.test(normalized)) {
    return "execution";
  }

  if (/(확인해|점검해|검증해|비교해|상태.*봐|작동.*봐|테스트해|verify|check|inspect|doctor|status|hooks|tasks|logs)/i.test(normalized)) {
    return "verification";
  }

  if (/(검토해|분석해|원인|왜|문제|충돌|진단|의견|평가|review|analy[sz]e|diagnos|cause|issue)/i.test(normalized)) {
    return "diagnosis";
  }

  if (/(계획|기획|로드맵|설계|원칙|순서|plan|roadmap|design)/i.test(normalized)) {
    return "planning";
  }

  return "conversation";
}

export function deriveResponseStateLabel(plan: {
  currentTurn: CurrentTurnPacket;
  requiresUserConfirmation: boolean;
  primaryClass: SharedTurnPlan["primaryClass"];
  riskLevel: "low" | "medium" | "high";
  mode: BeaiMode;
  executionMode?: ExecutionMode;
}): ResponseStateLabel {
  if (plan.currentTurn.missingCriticalInputs.length > 0) return "waiting_user";
  if (plan.requiresUserConfirmation) return "waiting_approval";
  if (/(안\s*돼|무응답|실패|blocked|failed|error|오류)/i.test(plan.currentTurn.cleanInput) && plan.primaryClass === "diagnosis") return "thinking";
  const executionMode = plan.executionMode || classifyExecutionMode(plan.currentTurn.cleanInput);
  if (executionMode === "execution" || executionMode === "implementation") return "running";
  if (executionMode === "verification" || executionMode === "diagnosis" || executionMode === "planning") return "thinking";
  return "listening";
}

export function buildUserConfidenceState(plan: {
  currentTurn: CurrentTurnPacket;
  requiresUserConfirmation: boolean;
  primaryClass: SharedTurnPlan["primaryClass"];
  riskLevel: "low" | "medium" | "high";
  mode: BeaiMode;
}): UserConfidenceState {
  const executionMode = classifyExecutionMode(plan.currentTurn.cleanInput);
  const responseState = deriveResponseStateLabel({ ...plan, executionMode });
  const meanings: Record<ResponseStateLabel, string> = {
    listening: "현재 요청을 받아 바로 답할 수 있는 상태입니다.",
    thinking: "현재 요청은 판단/검토/확인이 필요한 상태입니다.",
    running: "현재 요청은 실행 또는 구현 흐름으로 다뤄야 하는 상태입니다.",
    waiting_user: "진행에 필요한 핵심 입력을 사용자에게 받아야 하는 상태입니다.",
    waiting_approval: "위험하거나 권한이 필요한 작업이라 사용자 승인이 필요한 상태입니다.",
    blocked: "현재 조건으로는 진행이 막힌 상태입니다.",
    completed: "검증 기준을 충족해 완료로 볼 수 있는 상태입니다.",
    failed: "실행 또는 검증이 실패한 상태입니다."
  };
  const nextActions: Record<ResponseStateLabel, string> = {
    listening: "짧고 직접적으로 답합니다.",
    thinking: "확인된 것과 아직 모르는 것을 분리합니다.",
    running: "불필요한 상의보다 실제 작업과 검증으로 넘어갑니다.",
    waiting_user: "질문은 하나만 남깁니다.",
    waiting_approval: "승인 대기 이유와 선택지를 설명합니다.",
    blocked: "막힌 조건과 풀릴 조건을 하나로 좁힙니다.",
    completed: "확인된 완료 근거를 짧게 말합니다.",
    failed: "실패 지점과 다음 진단 하나를 제시합니다."
  };
  return {
    executionMode,
    responseState,
    userMeaning: meanings[responseState],
    nextVisibleAction: nextActions[responseState]
  };
}

export function buildFlowStateSpine(input: {
  currentTurn: CurrentTurnPacket;
  judgmentFrame: JudgmentFrame;
  constraints: string[];
  evidenceLedger: EvidenceLedger;
  operatingJudgment: BeaiOperatingJudgmentReport;
  decisionHandleSurface?: DecisionHandleSurfaceProfile;
  deliverySurface?: FlowStateSpine["deliverySurface"]["surface"];
}): FlowStateSpine {
  const approvalScope = input.operatingJudgment.risk.families.map((item) => item.replace(/_/g, " "));
  const telegramDirect = input.deliverySurface === "telegram_direct";
  const evidenceState = buildFlowStateEvidenceState({
    currentTurn: input.currentTurn,
    evidenceLedger: input.evidenceLedger
  });
  const currentJudgmentImpact = input.evidenceLedger.runtimeInferred
    .filter((item) => /memory|기억|handoff|session|project state/i.test(item))
    .slice(0, 3)
    .map((summary) => ({
      type: /handoff|session/i.test(summary) ? "session_continuity" as const : /project/i.test(summary) ? "project_state" as const : "package_knowledge" as const,
      currentJudgmentImpact: "medium" as const,
      affectsCurrentJudgment: true,
      summary,
      source: "runtime_evidence_ledger"
    }));

  return {
    version: "0.1",
    currentTarget: input.currentTurn.currentTarget,
    requestedShape: input.currentTurn.requestedOutputShape,
    responseRole: input.judgmentFrame.responseRole,
    confirmed: input.judgmentFrame.confirmed,
    unknowns: input.judgmentFrame.unknown,
    assumptions: input.judgmentFrame.assumptionCandidates,
    userBurden: input.currentTurn.missingCriticalInputs.length > 0 ? "high" : input.constraints.length > 2 ? "medium" : "low",
    toolNeed: input.operatingJudgment.risk.approvalRequired ? "local_tools_with_boundary" : input.evidenceLedger.needsVerification.length > 0 ? "local_tools" : "none",
    approvalBoundary: {
      required: input.operatingJudgment.risk.approvalRequired,
      scope: approvalScope,
      recovery: input.operatingJudgment.approvalErgonomics.approvalSummary.recovery
    },
    evidenceState,
    closureHandle: input.decisionHandleSurface?.primaryHandle || input.judgmentFrame.lastHandle,
    deliverySurface: {
      surface: input.deliverySurface || "local",
      visibleDelivery: telegramDirect ? "unverified" : "not_applicable",
      requiredCloseout: telegramDirect ? "message(action=send) with messageId" : "local final response"
    },
    memoryInfluence: currentJudgmentImpact
  };
}

function detectFlowDeliverySurface(input: string): FlowStateSpine["deliverySurface"]["surface"] {
  const text = String(input || "");
  if (/(telegram|텔레그램|source conversation|source-channel|messageId|visible delivery|실제\s*전달|전송\s*완료)/i.test(text)) {
    return "telegram_direct";
  }
  if (/(openclaw|오픈클로)/i.test(text)) {
    return "openclaw";
  }
  return "local";
}

function flowEvidenceFromText(text: string, positive: RegExp, blocked: RegExp, required: RegExp): FlowEvidenceStatus {
  if (blocked.test(text)) return "blocked";
  if (positive.test(text)) return "verified";
  if (required.test(text)) return "required";
  return "unknown";
}

export function buildFlowStateEvidenceState(input: {
  currentTurn: CurrentTurnPacket;
  evidenceLedger: EvidenceLedger;
}): FlowStateEvidenceState {
  const evidenceText = [
    input.currentTurn.cleanInput,
    ...input.evidenceLedger.toolVerified,
    ...input.evidenceLedger.needsVerification,
    ...input.evidenceLedger.runtimeInferred,
    ...input.evidenceLedger.assumptions
  ].join("\n");

  const configured = flowEvidenceFromText(
    evidenceText,
    /\bconfigured\b|설정\s*(?:확인|완료)|config(?:ured)?\s*[:=]\s*(?:true|ok|verified)|BEAI load paths?:\s*[1-9]/i,
    /not\s*configured|설정\s*(?:없|누락|실패)|No BEAI load path/i,
    /설정\s*(?:필요|확인\s*필요)|configuration\s*required|config.*needs?\s*verification/i
  );
  const registered = flowEvidenceFromText(
    evidenceText,
    /\bregistered\b|등록\s*(?:확인|완료)|plugins?\s+list.*(?:BEAI|beai-runtime)|BEAI Runtime appears in OpenClaw plugins list/i,
    /not\s*registered|등록\s*(?:없|누락|실패)|BEAI Runtime not visible/i,
    /등록\s*(?:필요|확인\s*필요)|registration\s*required/i
  );
  const callable = flowEvidenceFromText(
    evidenceText,
    /\bcallable\b|호출\s*(?:가능|확인)|plugins doctor.*(?:pass|ok|통과)|hooks?.*(?:ready|ok|통과)|gateway.*(?:health|status).*(?:ok|통과)/i,
    /not\s*callable|호출\s*(?:불가|실패)|plugins doctor.*(?:fail|failed|실패)|hooks?.*(?:not ready|fail|실패)/i,
    /호출\s*(?:필요|확인\s*필요)|callable\s*required|doctor\/hooks\/tasks\/gateway\/Telegram 검증 신호/i
  );
  const outputVerified = flowEvidenceFromText(
    evidenceText,
    /output[_\s-]?verified|출력\s*검증\s*(?:완료|통과)|messageId["':=\s]+[^"',}\s]+|visible[_\s-]?delivery[_\s-]?verified/i,
    /output\s*(?:unverified|failed)|출력\s*(?:미검증|실패)|messageId\s*(?:없|missing)|visible[_\s-]?delivery.*unverified/i,
    /output\s*verification\s*required|출력\s*검증\s*필요|visible[_\s-]?delivery\s*required|messageId.*required/i
  );
  const doctor = flowEvidenceFromText(
    evidenceText,
    /doctor.*(?:pass|ok|healthy|통과|문제 없음)|BEAI Doctor.*(?:ready|verified)/i,
    /doctor.*(?:fail|failed|blocked|실패|blocked)|plugins-doctor-failed/i,
    /doctor.*(?:required|필요|확인)|닥터.*(?:필요|확인)/i
  );
  const release = flowEvidenceFromText(
    evidenceText,
    /release verifier.*(?:pass|ok|ready|verified)|release.*(?:verified|ready)|릴리스.*(?:검증 완료|준비 완료)/i,
    /release.*(?:blocked|failed|not ready)|릴리스.*(?:차단|실패|미준비)/i,
    /release verifier.*required|release.*(?:review|required)|릴리스.*(?:검증 필요|확인 필요)|배포.*(?:검증 필요|확인 필요)/i
  );

  return {
    configured,
    registered,
    callable,
    outputVerified: outputVerified === "blocked" ? "blocked" : outputVerified === "verified" ? "verified" : outputVerified === "required" ? "required" : input.evidenceLedger.toolVerified.length > 0 ? "verified" : input.evidenceLedger.needsVerification.length > 0 ? "required" : "unknown",
    doctor: doctor === "unknown" && /doctor|닥터/i.test(evidenceText) ? "review" : doctor,
    release: release === "unknown" && /release|릴리스|배포|zip|package/i.test(evidenceText) ? "review" : release
  };
}

export function buildRuntimeResponseGateProfile(input: {
  currentTurn: CurrentTurnPacket;
  flowState: FlowStateSpine;
  responseResolution: ResponseResolution;
  responseInertia: ResponseInertiaProfile;
  conversationQualityGuard: ConversationQualityGuardProfile;
}): RuntimeResponseGateProfile {
  const blockIf = new Set<string>();
  const mustPreserve = new Set<string>();
  const mustAvoid = new Set<string>();
  const guidance = new Set<string>();

  const artifactFirst =
    input.flowState.responseRole === "artifact" || input.responseResolution.level === "artifact_first"
      ? "required"
      : "not_applicable";
  const followUpDeltaOnly =
    input.currentTurn.followUpScope !== "full" || input.responseInertia.requiredShift === "shorter_delta_only"
      ? "required"
      : "not_applicable";
  const visibleDelivery =
    input.flowState.deliverySurface.visibleDelivery === "unverified" || input.flowState.deliverySurface.visibleDelivery === "required"
      ? "required"
      : "not_applicable";

  mustPreserve.add("현재 요청의 대상과 형식");
  mustPreserve.add("확인된 것과 아직 확인되지 않은 것의 경계");

  mustAvoid.add("내부 상태명이나 디버그 요약을 사용자 답변에 그대로 노출");
  mustAvoid.add("완료, 적용, 검증, 전송, 배포 상태를 섞어 말하기");
  mustAvoid.add("후속 턴에서 이전 답변 구조를 습관적으로 반복");
  mustAvoid.add("사용자가 요청하지 않은 고정 footer나 반복 decision handle을 붙이기");

  guidance.add("첫 문장은 현재 요청으로 바로 들어갑니다.");
  guidance.add("상태 판단은 Flow State의 evidenceState와 deliverySurface보다 강하게 말하지 않습니다.");
  guidance.add("마지막 문장은 현재 요청에 필요한 경우에만 기준, 행동, 확인 신호, 보류 조건 중 하나로 닫습니다.");

  if (artifactFirst === "required") {
    blockIf.add("산출물 요청에서 설명이나 작성 의도가 결과물보다 앞서는 경우");
    guidance.add("산출물 요청은 결과물을 먼저 두고 설명은 필요한 만큼만 뒤에 둡니다.");
  }

  if (followUpDeltaOnly === "required") {
    blockIf.add("좁은 후속 요청에서 전체 맥락이나 이전 구조를 다시 여는 경우");
    guidance.add("후속 턴은 바뀐 지점만 짧게 보정합니다.");
  }

  if (visibleDelivery === "required") {
    blockIf.add("Telegram direct에서 messageId 확인 전 visible delivery를 완료로 말하는 경우");
    guidance.add("Telegram direct에서는 작성/내부 final과 실제 전달 검증을 분리합니다.");
  }

  for (const item of input.conversationQualityGuard.mustPreserve) mustPreserve.add(item);
  for (const item of input.conversationQualityGuard.mustAvoid) mustAvoid.add(item);
  for (const item of input.conversationQualityGuard.regressionChecks.slice(0, 4)) blockIf.add(item);

  return {
    version: "0.1",
    mode: "guide_only",
    firstSentence: "required",
    artifactFirst,
    followUpDeltaOnly,
    stateBoundary: "required",
    visibleDelivery,
    closureHandle: input.flowState.closureHandle,
    blockIf: Array.from(blockIf),
    mustPreserve: Array.from(mustPreserve),
    mustAvoid: Array.from(mustAvoid),
    guidance: Array.from(guidance)
  };
}

function stringifyToolParams(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  try {
    return JSON.stringify(params).slice(0, 4000);
  } catch {
    return String(params).slice(0, 4000);
  }
}

export function classifyToolCallRisk(input: {
  toolName?: string;
  params?: Record<string, unknown>;
  toolKind?: string;
  toolInputKind?: string;
  derivedPaths?: readonly string[];
}): ToolRiskClassification {
  const toolName = String(input.toolName || "unknown");
  const normalizedTool = toolName.toLowerCase();
  const paramsText = stringifyToolParams(input.params).toLowerCase();
  const derivedPaths = Array.from(input.derivedPaths || []).map((item) => String(item));
  const reasons = new Set<string>();
  let riskRank = 0;

  const raise = (level: ToolRiskLevel, reason: string) => {
    reasons.add(reason);
    const nextRank = level === "high" ? 2 : level === "medium" ? 1 : 0;
    riskRank = Math.max(riskRank, nextRank);
  };

  if (/^message$/i.test(toolName)) {
    raise("low", "same-surface message delivery observation tool");
    if (/(external_send|external|broadcast|different chat|other chat|email|slack|discord|whatsapp|tweet|public post|send_to)/i.test(paramsText)) {
      raise("high", "external message delivery signal");
    }
  } else if (/(email|slack|discord|whatsapp|tweet|public[_-]?post|external[_-]?send)/i.test(toolName)) {
    raise("high", "external message delivery tool");
  }

  if (/(exec|shell|bash|terminal|command)/i.test(toolName)) {
    raise("medium", "shell or command execution tool");
    if (/(rm\s+-rf|git\s+reset\s+--hard|git\s+checkout\s+--|sudo\s+|launchctl\s+(unload|bootout)|chmod\s+-r|chown\s+-r|mkfs|diskutil\s+erase|trash\s+.*\/)/i.test(paramsText)) {
      raise("high", "destructive command pattern");
    }
  }

  if (/(apply_patch|file_write|write|edit|patch|delete|move|rename)/i.test(toolName)) {
    raise("medium", "filesystem mutation tool");
  }

  if (/(\*\*\*\s+delete file:|"action"\s*:\s*"delete"|delete|remove)/i.test(paramsText) && /(file|patch|write|edit|apply_patch)/i.test(toolName)) {
    raise("high", "file deletion or removal signal");
  }

  if (derivedPaths.some((item) => item.startsWith("/etc/") || item.startsWith("/System/") || item.startsWith("/Library/") || item.includes("/.ssh/"))) {
    raise("high", "sensitive derived path");
  }

  if (/(cron|schedule|launchagent|systemd|nginx|gateway|plugin install|request_plugin_install)/i.test(toolName + " " + paramsText)) {
    raise("high", "scheduler, service, gateway, or plugin lifecycle change");
  }

  if (/(web|browser|search|fetch|open)/i.test(toolName) && riskRank === 0) {
    raise("low", "read or network observation tool");
  }

  if (reasons.size === 0) reasons.add("no elevated risk signal detected");
  const riskLevel: ToolRiskLevel = riskRank >= 2 ? "high" : riskRank === 1 ? "medium" : "low";

  return {
    toolName,
    riskLevel,
    action: riskLevel === "high" ? "recommend_approval" : "observe",
    reasons: Array.from(reasons),
    derivedPaths
  };
}

export function classifyToolResultSemantics(input: {
  toolName?: string;
  result?: unknown;
  error?: string;
  durationMs?: number;
}): ToolResultSemantics {
  const toolName = String(input.toolName || "unknown");
  const hasError = Boolean(input.error);
  const hasResult = typeof input.result !== "undefined" && input.result !== null;
  const reasons = new Set<string>();
  const state: ToolResultState = hasError ? "failed" : hasResult ? "succeeded" : "unknown";

  if (hasError) reasons.add("tool returned an error");
  else if (hasResult) reasons.add("tool returned a result");
  else reasons.add("tool completed without an observable result payload");

  if (typeof input.durationMs === "number" && input.durationMs > 30000) {
    reasons.add("long-running tool call");
  }

  return {
    toolName,
    state,
    durationMs: input.durationMs,
    hasResult,
    hasError,
    shouldPersistDetails: hasError || hasResult ? "bounded" : "none",
    reasons: Array.from(reasons)
  };
}

function readToolResultText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of ["text", "content"]) {
    const item = record[key];
    if (typeof item === "string") parts.push(item);
  }
  return parts.join("\n").trim();
}

function shouldSanitizePersistedToolResult(text: string): boolean {
  const normalized = text.toLowerCase();
  if (text.length > 6000) return true;
  return (
    /\[system\]\s*your previous turn was interrupted/i.test(text) ||
    /openclaw assembled context/i.test(normalized) ||
    /<available_skills>|<\/available_skills>/i.test(text) ||
    /<agent_soul>|<\/agent_soul>/i.test(text) ||
    /memory recall/i.test(text) ||
    /system policy:agent:/i.test(text) ||
    /codex app-server:/i.test(text) ||
    /mirroridentity/i.test(normalized)
  );
}

function sanitizeToolResultBlock(block: unknown, replacement: string): unknown {
  if (!block || typeof block !== "object" || Array.isArray(block)) return block;
  const record = block as Record<string, unknown>;
  const next = { ...record };
  if (typeof next.text === "string") next.text = replacement;
  if (typeof next.content === "string") next.content = replacement;
  return next;
}

export function sanitizePersistedToolResultMessage(message: unknown, toolName?: string): PersistedToolResultSanitization {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return { message, changed: false, reason: "message is not an object", originalChars: 0 };
  }
  const record = message as Record<string, unknown>;
  if (record.role !== "toolResult") {
    return { message, changed: false, reason: "not a tool result message", originalChars: 0 };
  }

  const content = record.content;
  const blocks = Array.isArray(content) ? content : [];
  const text = blocks.map(readToolResultText).filter(Boolean).join("\n");
  const originalChars = text.length;
  if (!shouldSanitizePersistedToolResult(text)) {
    return { message, changed: false, reason: "tool result is within transcript surface budget", originalChars };
  }

  const label = String(toolName || record.toolName || "unknown");
  const replacement = `[BEAI bounded tool result: ${label}; original_chars=${originalChars}; details hidden from transcript surface to prevent internal/system context leakage.]`;
  return {
    message: {
      ...record,
      content: blocks.map((block) => sanitizeToolResultBlock(block, replacement))
    },
    changed: true,
    reason: "tool result contained bulky or internal/system context",
    originalChars
  };
}

export function buildCurrentTurnPacket(rawInput: string): CurrentTurnPacket {
  const cleanInput = cleanCurrentTurnInput(rawInput);
  const followUpScope = detectFollowUpScope(cleanInput);
  const requestedOutputShape = detectRequestedOutputShape(cleanInput);
  const currentTarget = detectCurrentTarget(cleanInput);
  return {
    rawInput,
    cleanInput,
    currentTarget,
    requestedOutputShape,
    followUpScope,
    explicitConstraints: detectExplicitConstraints(cleanInput),
    missingCriticalInputs: detectMissingCriticalInputs(cleanInput, requestedOutputShape, followUpScope)
  };
}

function inferConstraintsFromPrompt(text: string): string[] {
  const results = new Set<string>();
  if (text.includes("충돌")) results.add("기존 OpenClaw 환경과 충돌시키지 않습니다.");
  if (text.includes("덮어쓰")) results.add("기존 설정을 임의로 덮어쓰지 않습니다.");
  if (text.includes("승인")) results.add("고위험 변경은 승인 전까지 실행하지 않습니다.");
  if (text.includes("토큰")) results.add("불필요한 장문 응답과 토큰 낭비를 줄입니다.");
  if (text.includes("실전")) results.add("설명보다 실제 실행 가능한 결과를 우선합니다.");
  return Array.from(results);
}

function defaultDeliverables(mode: BeaiMode): string[] {
  if (mode === "handoff") {
    return [
      "OpenClaw가 실행할 수 있는 명확한 Work Order",
      "사용자에게 보여줄 짧은 상태 설명",
      "연속성을 위한 working-memory patch"
    ];
  }
  if (mode === "planning") {
    return [
      "실행 전에 확인할 구조화된 계획",
      "핵심 리스크와 승인 필요 지점",
      "다음 턴으로 이어질 continuity patch"
    ];
  }
  return [
    "현재 질문에 대한 직접 답변",
    "필요 시 다음 행동 제안",
    "최소한의 continuity patch"
  ];
}

function defaultAcceptanceChecks(mode: BeaiMode): string[] {
  if (mode === "handoff") {
    return [
      "실행 대상과 결과물이 모호하지 않아야 합니다.",
      "충돌 금지와 승인 조건이 명시돼야 합니다.",
      "사용자에게 전달될 최종 답변이 디버그 내용과 분리돼야 합니다."
    ];
  }
  if (mode === "planning") {
    return [
      "계획이 실행 전 의사결정에 실제 도움을 줘야 합니다.",
      "리스크와 미검증 지점이 숨겨지지 않아야 합니다."
    ];
  }
  return [
    "질문에 직접 답해야 합니다.",
    "불필요한 디버그나 내부 메모가 노출되지 않아야 합니다."
  ];
}

function mapResponseStrategy(plan: SharedTurnPlan): "direct_reply" | "structured_plan" | "work_order" {
  if (plan.mode === "handoff") return "work_order";
  if (plan.mode === "planning") return "structured_plan";
  return "direct_reply";
}

function parseSessionContextUsagePct(prompt: string): number | undefined {
  const patterns = [
    /최대\s*context\s*사용률\s*(\d{1,3})%/i,
    /context\s*usage\s*(\d{1,3})%/i,
    /context\s*pressure[^\n]*?(\d{1,3})%/i,
    /session[^.\n]*?(\d{1,3})%/i
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function inferSessionSignals(prompt: string): {
  sessionContextUsagePct?: number;
  hasLargeToolOutputs?: boolean;
  hasMixedPlanningAndExecution?: boolean;
  nextStepStartsNewPhase?: boolean;
  toolResidueSignals?: string[];
} {
  const sessionContextUsagePct = parseSessionContextUsagePct(prompt);
  const toolResidueSignals: string[] = [];
  const lowered = prompt.toLowerCase();

  if (lowered.includes("tool output") || prompt.includes("tool result") || prompt.includes("긴 로그")) {
    toolResidueSignals.push("tool_residue");
  }
  if (prompt.includes("실행") && (prompt.includes("구조") || prompt.includes("계획") || prompt.includes("문서"))) {
    toolResidueSignals.push("mixed_plan_execution");
  }

  return {
    sessionContextUsagePct,
    hasLargeToolOutputs: prompt.includes("긴 로그") || prompt.includes("tool result") || prompt.includes("tool output"),
    hasMixedPlanningAndExecution: toolResidueSignals.includes("mixed_plan_execution"),
    nextStepStartsNewPhase: prompt.includes("다음 단계") || prompt.includes("새 세션") || prompt.includes("이어") || prompt.includes("구현"),
    toolResidueSignals: toolResidueSignals.length > 0 ? toolResidueSignals : undefined
  };
}

function buildOpenClawWorkOrder(sharedPlan: SharedTurnPlan, prompt: string, constraints: string[]): OpenClawWorkOrder | undefined {
  if (sharedPlan.mode !== "handoff") return undefined;
  return {
    taskType: "execution",
    objective: sharedPlan.workOrder?.objective || sharedPlan.immediateAsk,
    inputSummary: firstSentence(prompt),
    steps: [
      "요청을 OpenClaw 실행 단위로 재정리합니다.",
      "충돌/승인 조건을 먼저 확인합니다.",
      "필요한 변경만 최소 범위로 실행합니다.",
      "실행 결과를 검토하고 사용자에게 최종 상태만 전달합니다."
    ],
    constraints,
    deliverables: defaultDeliverables("handoff"),
    acceptanceChecks: defaultAcceptanceChecks("handoff")
  };
}

function mapResponseRole(sharedPlan: SharedTurnPlan, currentTurn: CurrentTurnPacket): ResponseRole {
  if (isCompactApprovalContinuationInput(currentTurn.cleanInput)) return "work_order";
  if (sharedPlan.requiresUserConfirmation || sharedPlan.turnJudgment === "defer") return "defer";
  if (currentTurn.missingCriticalInputs.length > 0 || sharedPlan.turnJudgment === "clarify") return "clarify";
  if (sharedPlan.mode === "handoff" || sharedPlan.turnJudgment === "execute") return "work_order";
  if (sharedPlan.primaryClass === "diagnosis" || sharedPlan.turnJudgment === "diagnose") return "diagnosis";
  if (sharedPlan.primaryClass === "planning" || sharedPlan.primaryClass === "package_readiness") return "plan";
  if (sharedPlan.primaryClass === "verification" || sharedPlan.turnJudgment === "verify") return "judgment";
  if (["artifact_generation", "editing", "summary"].includes(sharedPlan.primaryClass) || sharedPlan.turnJudgment === "artifact") {
    return "artifact";
  }
  return "direct_answer";
}

function buildAskOneQuestion(missing: string[]): string | undefined {
  const first = missing[0];
  if (!first) return undefined;
  const labels: Record<string, string> = {
    "current user input": "이번에 다룰 요청을 한 문장으로만 알려주세요.",
    "target language": "어떤 언어로 번역하면 될까요?",
    "comparison targets": "무엇과 무엇을 비교하면 될까요?",
    "execution target": "어느 대상에 적용하면 될까요?"
  };
  return labels[first] || `${first}을 먼저 알려주세요.`;
}

export function buildJudgmentFrame(currentTurn: CurrentTurnPacket, sharedPlan: SharedTurnPlan): JudgmentFrame {
  const confirmed = new Set<string>();
  const assumptionCandidates = new Set<string>();
  const unknown = new Set<string>(currentTurn.missingCriticalInputs);

  if (currentTurn.cleanInput) confirmed.add(`current_input: ${currentTurn.cleanInput}`);
  if (currentTurn.requestedOutputShape) confirmed.add(`requested_output_shape: ${currentTurn.requestedOutputShape}`);
  if (currentTurn.followUpScope && currentTurn.followUpScope !== "full") confirmed.add(`follow_up_scope: ${currentTurn.followUpScope}`);
  if (currentTurn.currentTarget) confirmed.add(`current_target: ${currentTurn.currentTarget}`);
  if (sharedPlan.primaryClass) confirmed.add(`primary_class: ${sharedPlan.primaryClass}`);
  if (sharedPlan.mode) confirmed.add(`mode: ${sharedPlan.mode}`);
  for (const constraint of currentTurn.explicitConstraints) confirmed.add(`constraint: ${constraint}`);

  if (currentTurn.followUpScope !== "full" && currentTurn.currentTarget === "previous_assistant_answer") {
    assumptionCandidates.add("좁은 후속 요청은 직전 assistant 답변의 해당 부분을 대상으로 봅니다.");
  }
  if (sharedPlan.requiresVerification) {
    assumptionCandidates.add("검증이 필요한 요청은 완료 주장보다 확인 범위를 먼저 분리합니다.");
  }

  const responseRole = mapResponseRole(sharedPlan, currentTurn);
  const askOneQuestion = responseRole === "clarify" ? buildAskOneQuestion(Array.from(unknown)) : undefined;
  const deferCondition = responseRole === "defer" ? "명시 승인 전에는 고위험 실행이나 되돌리기 어려운 변경을 진행하지 않습니다." : undefined;

  return {
    confirmed: Array.from(confirmed),
    unknown: Array.from(unknown),
    assumptionCandidates: Array.from(assumptionCandidates),
    responseRole,
    askOneQuestion,
    deferCondition,
    lastHandle: firstSentence(currentTurn.cleanInput || sharedPlan.immediateAsk)
  };
}

export function buildResponseResolution(
  currentTurn: CurrentTurnPacket,
  sharedPlan: SharedTurnPlan,
  judgmentFrame: JudgmentFrame,
  conversationScene?: ConversationSceneContinuityProfile
): ResponseResolution {
  const input = currentTurn.cleanInput;
  const lowered = input.toLowerCase();
  const hasOverloadSignal = /(막막|복잡|헷갈|불안|답답|너무\s*많|정리\s*안|overwhel|confus)/i.test(input);

  if (isCompactApprovalContinuationInput(input)) {
    return {
      level: "execution_check",
      depth: "low",
      surfaceHint: "짧은 승인/계속 발화는 직전 작업 맥락을 보존하고, 새 질문으로 되돌리지 않습니다.",
      avoid: ["무엇을 진행할지 재질문", "전체 맥락 재요약", "승인 발화를 새 일반 대화로 취급"]
    };
  }

  if (conversationScene?.shouldPreferExecutionContinuation) {
    return {
      level: "execution_check",
      depth: "low",
      surfaceHint: "짧은 후속 발화는 직전 대화 장면의 미완료 행동을 먼저 상속합니다.",
      avoid: ["현재 문장만 보고 재질문", "직전 합의와 pending action 무시", "실행 흐름을 단순 답변으로 축소"]
    };
  }

  if (currentTurn.followUpScope !== "full") {
    return {
      level: "follow_up_delta_only",
      depth: "low",
      surfaceHint: "이전 구조를 반복하지 말고, 이번 발화가 바꾼 좁은 지점만 짧게 답합니다.",
      avoid: ["전체 맥락 재요약", "새 질문 추가", "이전 답변 구조 반복"]
    };
  }

  if (["artifact_generation", "editing", "summary"].includes(sharedPlan.primaryClass) || judgmentFrame.responseRole === "artifact") {
    return {
      level: "artifact_first",
      depth: "medium",
      surfaceHint: "설명보다 사용자가 바로 쓸 결과물을 먼저 배치합니다.",
      avoid: ["작성 의도 선설명", "내부 전략 노출", "산출물 앞의 긴 기준 설명"]
    };
  }

  if (sharedPlan.mode === "handoff" || sharedPlan.turnJudgment === "execute") {
    return {
      level: "execution_check",
      depth: "medium",
      surfaceHint: "실행 전후 범위와 확인 신호를 작게 고정합니다.",
      avoid: ["검증 없는 완료 표현", "한 번에 많은 복구/변경 섞기", "승인 없는 고위험 실행"]
    };
  }

  if (hasOverloadSignal) {
    return {
      level: "overload_reduction",
      depth: "low",
      surfaceHint: "정보를 더 늘리지 말고 사용자가 붙잡을 판단 단위를 줄입니다.",
      avoid: ["가능성 나열", "긴 배경 설명", "여러 질문"]
    };
  }

  if (sharedPlan.primaryClass === "diagnosis" || sharedPlan.primaryClass === "verification" || sharedPlan.turnJudgment === "diagnose" || sharedPlan.turnJudgment === "verify") {
    return {
      level: "judgment_deep",
      depth: "high",
      surfaceHint: "확인된 것과 아직 모르는 것을 나누고, 판단이 바뀌는 조건을 남깁니다.",
      avoid: ["원인 단정", "확인 불가 항목 생략", "불필요한 내부 진단어 노출"]
    };
  }

  if (/^(좋아|응|네|그래|계속|진행|다음|알겠어|오케이|ok|yes)[.!?\s]*$/i.test(lowered) || input.length <= 28) {
    return {
      level: "simple_direct",
      depth: "low",
      surfaceHint: "짧고 직접적으로 답하되, 필요한 다음 행동 하나만 남깁니다.",
      avoid: ["전체 구조 반복", "새로운 큰 계획 열기", "형식적 후속 질문"]
    };
  }

  return {
    level: "simple_direct",
    depth: "medium",
    surfaceHint: "현재 요청에 직접 답하고, 필요 이상으로 구조를 늘리지 않습니다.",
    avoid: ["불필요한 가능성 나열", "현재 요청보다 큰 해석으로 이동"]
  };
}

function detectPreviousResponseSurface(reply: string | undefined): {
  hasNumberedStructure: boolean;
  endsWithQuestion: boolean;
  hasSectionHeadings: boolean;
  hasStrongConclusionFormula: boolean;
} {
  const text = String(reply || "").trim();
  return {
    hasNumberedStructure: /(?:^|\n)\s*(?:\d+\.|-\s+|\*\*)/.test(text),
    endsWithQuestion: /[?？]\s*$/.test(text) || /(인가요|할까요|해볼까요|원하시나요)\s*[.?？]?\s*$/.test(text),
    hasSectionHeadings: /(?:^|\n)\s*\*\*[^*\n]{2,80}\*\*/.test(text) || /(?:^|\n)#{1,3}\s+\S/.test(text),
    hasStrongConclusionFormula: /(핵심은|결론은|정리하면|최종 판단은|확인 필요 항목은)/.test(text)
  };
}

function wantsSameStructure(input: string): boolean {
  const normalized = input.trim();
  const hasSameStructureSignal =
    /(같은\s*(형식|구조|톤|방식)|위\s*(형식|구조)\s*유지|방금처럼|same\s*(format|structure|style))/i.test(
      normalized
    );
  if (!hasSameStructureSignal) return false;

  const negatesReuse =
    /(같은\s*(형식|구조|톤|방식)[^.!?\n]{0,16}(쓰지|하지|말고|말아|아니|빼고|금지)|방금처럼[^.!?\n]{0,16}(쓰지|하지|말고|말아|아니|빼고|금지)|not\s+(same|the same)|do\s+not\s+use\s+(the\s+)?same)/i.test(
      normalized
    );
  return !negatesReuse;
}

function isShortSceneContinuationInput(input: string): boolean {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > 80) return false;
  return /^(다시\s*)?(보내봐|보내줘|해봐|해줘|진행해|계속해|가자|그걸로|그렇게|좋아|오케이|ok|yes|ㅇㅋ|응|그래)(요)?[.!?\s]*$/i.test(normalized) ||
    /(다시|그럼|그러면|이어서|계속).{0,24}(보내|해|진행|만들|돌려|작성|검증|테스트)/i.test(normalized);
}

function isSceneRepairInput(input: string): boolean {
  return /(그\s*뜻\s*아니|그런\s*의미\s*아니|맥락|흐름|연결성|잘못\s*해석|다시\s*해석|not\s+what\s+i\s+meant|context|flow)/i.test(input);
}

function compactSceneItem(text: string | undefined, max = 120): string | undefined {
  const compacted = compactText(text, max);
  return compacted && compacted.length >= 2 ? compacted : undefined;
}

function collectSceneSourceText(patch: SharedWorkingMemoryPatch): string {
  return [
    patch.current_focus,
    patch.current_artifact,
    patch.last_sentence,
    patch.last_assistant_answer,
    ...(patch.recent_constraints || [])
  ]
    .filter(Boolean)
    .join("\n");
}

function inferSharedCommitmentsFromScene(sourceText: string): string[] {
  const commitments = new Set<string>();
  const lines = sourceText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (/(유지|줄이지|기준|합의|정한|그대로|같은\s*(밀도|방식|기준)|must|keep|same)/i.test(line)) {
      const item = compactSceneItem(line, 120);
      if (item) commitments.add(item);
    }
  }
  return Array.from(commitments).slice(0, 4);
}

function inferPendingNextActionsFromScene(sourceText: string): string[] {
  const actions = new Set<string>();
  const lines = sourceText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (/(다음|이후|먼저|바로|진행|실행|테스트|검증|확인|보내|작성|생성|만들|돌리|적용|구현|next|proceed|run|test|send|create|implement)/i.test(line)) {
      const item = compactSceneItem(line, 140);
      if (item) actions.add(item);
    }
  }
  return Array.from(actions).slice(0, 4);
}

function inferCurrentSceneFromPatch(patch: SharedWorkingMemoryPatch, sourceText: string): string {
  return compactSceneItem(patch.current_focus, 120) ||
    compactSceneItem(patch.current_artifact, 120) ||
    compactSceneItem(firstSentence(patch.last_assistant_answer || sourceText), 140) ||
    "no active shared scene";
}

export function buildConversationSceneContinuityProfile(input: {
  currentTurn: CurrentTurnPacket;
  continuityPatch?: SharedWorkingMemoryPatch;
}): ConversationSceneContinuityProfile {
  const patch = input.continuityPatch || {};
  const sourceText = collectSceneSourceText(patch);
  const sharedCommitments = inferSharedCommitmentsFromScene(sourceText);
  const pendingNextActions = inferPendingNextActionsFromScene(sourceText);
  const shortContinuation = isShortSceneContinuationInput(input.currentTurn.cleanInput);
  const repairInput = isSceneRepairInput(input.currentTurn.cleanInput);
  const hasScene = Boolean(sourceText.trim());
  const shouldInheritFlow = shortContinuation && pendingNextActions.length > 0;
  const shouldPreferExecutionContinuation = shouldInheritFlow && /(보내|해|진행|계속|테스트|검증|실행|돌려|작성|생성|만들|send|run|test|create|implement)/i.test(input.currentTurn.cleanInput);

  const utteranceRole: ConversationSceneUtteranceRole = repairInput
    ? "repair_previous_interpretation"
    : shouldPreferExecutionContinuation
      ? "execute_pending_action"
      : shortContinuation && hasScene
        ? "accept_or_continue_scene"
        : /(수정|바꿔|보정|정확히는|사실은|instead|actually)/i.test(input.currentTurn.cleanInput)
          ? "modify_scene"
          : "direct_answer";

  const guidance = [
    "현재 발화만 보지 말고 직전 대화 장면, 합의, 미완료 행동을 함께 해석합니다.",
    "짧은 후속 발화가 오면 먼저 직전 흐름에서 이어받을 행동이 있는지 확인합니다."
  ];
  if (shouldPreferExecutionContinuation) {
    guidance.push("미완료 행동이 명확하면 재질문보다 그 행동을 실행하거나 실행 범위를 짧게 확인합니다.");
  }
  if (repairInput) {
    guidance.push("사용자 정정은 사과로만 닫지 말고, 이전 해석 오류를 다음 판단 기준에 반영합니다.");
  }

  return {
    version: "0.6.7",
    mode: "guide_only",
    sceneStatus: hasScene ? (pendingNextActions.length > 0 || sharedCommitments.length > 0 ? "active_scene" : "weak_scene") : "none",
    utteranceRole,
    currentScene: inferCurrentSceneFromPatch(patch, sourceText),
    sharedCommitments,
    pendingNextActions,
    repairSignals: repairInput ? [compactSceneItem(input.currentTurn.cleanInput, 160) || "user corrected previous interpretation"] : [],
    shouldInheritFlow,
    shouldPreferExecutionContinuation,
    guardNote: shouldPreferExecutionContinuation
      ? "Short follow-up should inherit the pending action from the shared conversation scene."
      : repairInput
        ? "Repair turn should update the conversation scene instead of defending the prior interpretation."
        : "Use as guidance only; do not invent a scene when continuity evidence is weak.",
    answerGuidance: guidance
  };
}

function inferInputMaturity(input: string, currentTurn: CurrentTurnPacket, sharedPlan: SharedTurnPlan): InputLevelMaturity {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return "unformed";
  if (/(모르겠|막막|어렵|도대체|뭘\s*해야|어떻게\s*시작|어디서\s*부터|설치.*했는데|이제\s*뭐|현타|포기|못\s*쓰겠)/i.test(text)) {
    return "unformed";
  }
  if (/(불만|짜증|답답|힘들|고충|문제|안\s*돼|무응답|멈췄|느려|헷갈|불안)/i.test(text)) {
    return "pain_signal";
  }
  if (/(하고\s*싶|원해|목표|꿈꿔|만들고\s*싶|좋게\s*하고|잘\s*쓰고|활용하고|자동화하고\s*싶)/i.test(text)) {
    return "goal_seeking";
  }
  if (/(추천|제안|가이드|순서|방법|어떻게|방향|로드맵|계획|기획)/i.test(text)) {
    return "guided_action";
  }
  if (
    currentTurn.requestedOutputShape === "execution" ||
    sharedPlan.turnJudgment === "execute" ||
    /(진행해|반영해|수정해|적용해|설치해|만들어|구현해|테스트해|검증해|실행해|배포파일)/i.test(text)
  ) {
    return "specific_execution";
  }
  if (text.length > 260 && /(조건|범위|검증|테스트|버전|파일|경로|요구사항|기준|스펙|manifest|package|runtime|skill)/i.test(text)) {
    return "expert_directive";
  }
  return currentTurn.requestedOutputShape ? "guided_action" : "goal_seeking";
}

function inferInputLevelNeed(input: string, currentTurn: CurrentTurnPacket, sharedPlan: SharedTurnPlan, maturity: InputLevelMaturity): InputLevelNeed {
  const text = input.replace(/\s+/g, " ").trim();
  const hasFailureContext = /(오류|무응답|안\s*돼|멈췄|반복|느려|끊|같은\s*답변|고장|실패|stuck|failed|error|telegram|gateway|텔레그램|게이트웨이)/i.test(text);
  if (hasFailureContext && /(원인|문제|진단|분석|찾아|왜|고쳐|수리|닥터|doctor)/i.test(text)) return "diagnosis";
  if (hasAppProductSignal(text) && /(만들|구현|개발|제작|build|create)/i.test(text)) {
    return maturity === "unformed" || maturity === "goal_seeking" ? "first_success_path" : "execution";
  }
  if (hasReadOnlyAutomationInspectionSignal(text) || hasReadOnlyTelegramStatusSignal(text)) return "verification";
  if (hasReadOnlyNotionSignal(text)) return /(요약|정리|summarize|summary)/i.test(text) ? "research" : "verification";
  if (hasOperationalDebtSignal(text)) return "problem_framing";
  if (hasSkillDescriptionArtifactSignal(text)) return "artifact";
  if (hasDocsOnlyReleaseArtifactSignal(text)) return "artifact";
  if (/(전달(?:할|용).{0,24}(?:리포트|보고서|문서).{0,18}(?:만|작성|만들|써|정리)|(?:리포트|보고서|문서).{0,24}전달용|(?:codex|코덱스).{0,28}(?:전달|보낼).{0,24}(?:리포트|보고서|문서).{0,18}(?:만|작성|만들|써|정리))/i.test(text)) return "artifact";
  if (hasRetryPolicySignal(text)) return "automation_readiness";
  if (hasDestructiveRewriteSignal(text) || hasOpenClawCoreMutationSignal(text)) return "execution";
  if (hasMedicalSafetySignal(text)) return "verification";
  if (hasScheduledWorkSignal(text)) {
    return /(하고\s*싶|어디서\s*시작|어떻게\s*시작|고민|가능할까|설계|기획)/i.test(text) ? "workflow_design" : "automation_readiness";
  }
  if (hasSkillLifecycleSignal(text)) return "workflow_design";
  if (hasAgentCandidateSignal(text)) return "workflow_design";
  if (hasExternalWriteSignal(text) || hasRollbackSignal(text) || hasIssueLedgerWriteSignal(text) || hasVersionMutationSignal(text)) return "execution";
  if (hasAutomaticMemorySignal(text)) return "automation_readiness";
  if (
    currentTurn.requestedOutputShape === "artifact" ||
    /(써줘|작성|초안|문서|문구|메시지|인사말|카피|제목|공지|메일|안내문|표로|체크리스트)/i.test(text) ||
    /(문장|문구|안내문|메일|공지|메시지).{0,24}(바꿔|수정|만들|작성|써|다시)/i.test(text)
  ) return "artifact";
  if (hasAppProductSignal(text)) return maturity === "unformed" || maturity === "goal_seeking" ? "first_success_path" : "execution";
  if (/(검색|조사|자료|리서치|근거|사례|공신력|웹|latest|최신)/i.test(text)) return "research";
  if (/(점검|검증|확인|테스트|상태|doctor|닥터|로그|원인|오류|무응답|안\s*돼)/i.test(text) || sharedPlan.primaryClass === "verification") return "verification";
  if (sharedPlan.primaryClass === "diagnosis" || /(왜|문제|진단|분석|원인|불만|고충)/i.test(text)) return "diagnosis";
  if (/(자동화|cron|크론|에이전트|agent|스킬|skill|반복|매일|예약\s*(?:실행|발송|등록|작업)|workflow|워크플로우)/i.test(text)) {
    return maturity === "unformed" || maturity === "goal_seeking" ? "workflow_design" : "automation_readiness";
  }
  if (maturity === "unformed") return "orientation";
  if (maturity === "pain_signal") return "problem_framing";
  if (maturity === "goal_seeking") return "first_success_path";
  if (maturity === "specific_execution" || maturity === "expert_directive") return "execution";
  return "first_success_path";
}

function inputLevelSkillFamilies(need: InputLevelNeed, input: string): string[] {
  const families = new Set<string>();
  const routingNegated = hasExplicitRoutingNegationSignal(input);
  if (need === "orientation" || need === "first_success_path") families.add("ai-native-journey-guide");
  if (need === "problem_framing") families.add("owner-intake-router");
  if (need === "workflow_design" && !routingNegated) families.add("ax-first-automation-planner");
  if (need === "automation_readiness") {
    families.add("skill-agent-cron-router");
    families.add("automation-readiness-check");
  }
  if (need === "diagnosis" || need === "verification" || /비아이\s*닥터|beai doctor|openclaw|telegram|gateway/i.test(input)) families.add("beai-doctor");
  if (hasSkillLifecycleSignal(input) && !routingNegated) families.add("skill-creator");
  if (hasScheduledWorkSignal(input)) families.add("automation-readiness-check");
  if (hasAgentCandidateSignal(input) && !routingNegated) families.add("skill-agent-cron-router");
  if (hasAppProductSignal(input)) families.add("beai-development-steward");
  if (hasVersionMutationSignal(input)) families.add("beai-development-steward");
  if (hasIssueLedgerWriteSignal(input)) families.add("beai-doctor");
  return Array.from(families).slice(0, 4);
}

function inferHumanJourneyStage(input: string, maturity: InputLevelMaturity, need: InputLevelNeed): HumanJourneyStage {
  if (/(오류|안\s*돼|무응답|멈췄|반복|느려|끊|stuck|failed|error|telegram|gateway|게이트웨이|텔레그램)/i.test(input)) {
    return "error_trust_break";
  }
  if (/(설치.*(끝|완료|했)|깔았|installed).*(뭐|어떻게|이제|막막|모르겠)/i.test(input)) return "post_install_blank";
  if (hasOperationalDebtSignal(input)) return "operational_debt";
  if (need === "automation_readiness" || /(매일|자동화|cron|크론|정기|반복|예약\s*(?:실행|발송|등록|작업)|모니터)/i.test(input)) return "automation_desire";
  if (need === "execution" || /(진행|수정|적용|삭제|보내|실행|배포|설치)/i.test(input)) return "pre_execution_control";
  if (maturity === "expert_directive") return "expert_expansion";
  if (/(어떻게 말|이렇게 말|뭐라고|프롬프트|질문하면|입력)/i.test(input)) return "first_input_anxiety";
  if (/(선택|비교|가능|옵션|길|방법|방향|장단점|기준)/i.test(input)) return "choice_criteria";
  if (maturity === "unformed" || need === "orientation") return "possibility_awareness";
  if (maturity === "goal_seeking" || need === "workflow_design") return "possibility_exploration";
  return "choice_criteria";
}

function hasOperationalDebtSignal(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  const systemTerms = /(스킬|에이전트|크론|cron|agent|skill|메모리|memory|자동화|workflow|워크플로우|운영)/i.test(normalized);
  const debtTerms = /(너무\s*많|많아|많아서|지저분|난잡|복잡|부채|정리|관리|꼬였|흩어|쌓였)/i.test(normalized);
  return systemTerms && debtTerms;
}

function hasRiskyArtifactSignal(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const artifactSignal = /(써줘|작성|초안|문구|메시지|메일|공지|안내문|공문|카피|제목|한\s*줄|짧게|문장)/i.test(normalized);
  const riskTerms = /(고객|외부|공개|계약|결제|환불|공문|법적|해지|거절|클레임|민원|신고|의학|의료|약|복용|치료|진단|삭제|전송|게시)/i.test(normalized);
  return artifactSignal && riskTerms;
}

function hasSimpleArtifactRequest(text: string, primaryNeed?: InputLevelNeed): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const artifactSignal =
    primaryNeed === "artifact" ||
    /(써줘|작성|초안|문구|메시지|메일|공지|카피|제목|문장|한\s*줄|짧은|짧게|감사\s*메시지|인사말)/i.test(normalized);
  if (!artifactSignal) return false;
  const scopeIsSmall = /(하나만|한\s*개만|한\s*줄|짧게|간단히|간단하게|바로\s*쓸|메시지\s*하나|문구\s*하나)/i.test(normalized);
  const riskyArtifact = hasRiskyArtifactSignal(normalized) || /(해고|협박|보복|망신)/i.test(normalized);
  return scopeIsSmall && !riskyArtifact;
}

function hasInterpersonalRetaliationSignal(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const interpersonalTarget = /(팀원|직원|동료|상대|고객|파트너|가족|친구|배우자|사람|대표|상사|부하)/i.test(normalized);
  const retaliationAction = /(공개적으로|공개\s*망신|망신|창피|쪽팔|보복|응징|참교육|혼내|압박|까발|비난|공격|눌러|몰아붙|혼쭐)/i.test(normalized);
  const validationSeeking = /(내가\s*맞지|내\s*말이\s*맞지|그치|맞잖아|정당하지|해도\s*되지|해야\s*하지)/i.test(normalized);
  return (interpersonalTarget && retaliationAction) || (retaliationAction && validationSeeking);
}

export function buildInputLevelCompanionProfile(input: {
  currentTurn: CurrentTurnPacket;
  sharedPlan: SharedTurnPlan;
}): InputLevelCompanionProfile {
  const text = input.currentTurn.cleanInput;
  const inputMaturity = inferInputMaturity(text, input.currentTurn, input.sharedPlan);
  const primaryNeed = inferInputLevelNeed(text, input.currentTurn, input.sharedPlan, inputMaturity);
  const journeyStage = inferHumanJourneyStage(text, inputMaturity, primaryNeed);
  const simpleArtifactRequest = hasSimpleArtifactRequest(text, primaryNeed);
  const riskyArtifactSignal = hasRiskyArtifactSignal(text);
  const interpersonalRetaliationSignal = hasInterpersonalRetaliationSignal(text);
  const readOnlyStatusSignal = hasReadOnlyAutomationInspectionSignal(text) || hasReadOnlyTelegramStatusSignal(text) || hasReadOnlyNotionSignal(text);
  const userBurden: InputLevelCompanionProfile["userBurden"] =
    inputMaturity === "unformed" || /(막막|어렵|답답|포기|현타|도대체|모르겠)/i.test(text)
      ? "high"
      : inputMaturity === "pain_signal" || input.currentTurn.missingCriticalInputs.length > 0
        ? "medium"
        : "low";
  const cognitiveLoadLevel: InputLevelCompanionProfile["cognitiveLoadLevel"] =
    userBurden === "high" || /(복잡|헷갈|어렵|모르겠|막막|불안|짜증|현타|너무 많)/i.test(text)
      ? "high"
      : inputMaturity === "expert_directive" || text.length > 220 || input.currentTurn.missingCriticalInputs.length > 0
        ? "medium"
        : "low";
  const choiceOwnershipRisk: InputLevelCompanionProfile["choiceOwnershipRisk"] =
    simpleArtifactRequest
      ? "low"
      : interpersonalRetaliationSignal || /(정해줘|골라줘|추천만|하나만|뭐가 맞아|답을 줘|시키는 대로|알아서)/i.test(text)
      ? "high"
      : primaryNeed === "orientation" || primaryNeed === "workflow_design" || primaryNeed === "automation_readiness" || /(선택|결정|고민|방향|가능)/i.test(text)
        ? "medium"
        : "low";
  const trustCalibrationNeed: InputLevelCompanionProfile["trustCalibrationNeed"] =
    interpersonalRetaliationSignal || journeyStage === "error_trust_break" || primaryNeed === "diagnosis" || primaryNeed === "verification"
      ? "strong"
      : riskyArtifactSignal || primaryNeed === "automation_readiness" || primaryNeed === "execution" || choiceOwnershipRisk !== "low"
        ? "light"
        : "none";
  const possibleWorldsNeeded: InputLevelCompanionProfile["possibleWorldsNeeded"] =
    simpleArtifactRequest
      ? "none"
      : primaryNeed === "orientation" || journeyStage === "possibility_awareness" || journeyStage === "possibility_exploration"
      ? "structured"
      : choiceOwnershipRisk !== "low" || primaryNeed === "problem_framing" || journeyStage === "choice_criteria"
        ? "light"
        : "none";
  const explanationDepth: InputLevelCompanionProfile["explanationDepth"] =
    inputMaturity === "expert_directive"
      ? "technical"
      : cognitiveLoadLevel === "high"
        ? "plain"
        : possibleWorldsNeeded === "structured"
          ? "structured"
          : "minimal";
  const controlBoundaryNeeded =
    !readOnlyStatusSignal &&
    (interpersonalRetaliationSignal ||
      riskyArtifactSignal ||
      hasScheduledWorkSignal(text) ||
      hasExternalWriteSignal(text) ||
      (!hasExplicitRoutingNegationSignal(text) && hasSkillLifecycleSignal(text)) ||
      (!hasExplicitRoutingNegationSignal(text) && hasAgentCandidateSignal(text)) ||
    hasAuthDataPaymentDeploySignal(text) ||
    hasMoneyMovementSignal(text) ||
    hasMedicalSafetySignal(text) ||
      hasRollbackSignal(text) ||
      hasAutomaticMemorySignal(text) ||
      hasIssueLedgerWriteSignal(text) ||
      hasVersionMutationSignal(text) ||
      hasRetryPolicySignal(text) ||
      hasDestructiveRewriteSignal(text) ||
      hasOpenClawCoreMutationSignal(text) ||
      primaryNeed === "automation_readiness" ||
      primaryNeed === "execution" ||
      journeyStage === "pre_execution_control" ||
      /(삭제|전송|보내|결제|계약|공개|배포|설치|수정|설정|토큰|메모리|cron|크론)/i.test(text));
  const recoveryNeed = journeyStage === "error_trust_break" || primaryNeed === "diagnosis" || /(복구|수리|고쳐|닥터|doctor)/i.test(text);
  const responsePosture: InputLevelCompanionProfile["responsePosture"] =
    primaryNeed === "artifact"
      ? "produce"
      : primaryNeed === "verification" || primaryNeed === "diagnosis"
        ? "verify"
        : primaryNeed === "execution"
          ? "execute"
          : primaryNeed === "orientation"
            ? "orient"
            : primaryNeed === "problem_framing"
              ? "frame"
              : "guide";
  const questionBudget: InputLevelCompanionProfile["questionBudget"] =
    userBurden === "high" ? 1 : input.currentTurn.missingCriticalInputs.length > 0 ? 1 : responsePosture === "guide" ? 2 : 0;
  const recommendedSkillFamilies = inputLevelSkillFamilies(primaryNeed, text);

  const firstSafeStep =
    primaryNeed === "orientation"
      ? "가능한 첫 성공 경험의 세계를 펼치고, 사용자가 고를 수 있는 기준을 제시합니다."
      : primaryNeed === "problem_framing"
        ? "불편함, 결핍, 목표, 위험을 분리해 사용자가 판단할 수 있는 구조로 놓습니다."
        : primaryNeed === "workflow_design"
          ? "반복 업무의 가능한 구현 경로와 수동 검증 조건을 먼저 펼치고, 지금 단계가 무엇인지 사용자 언어로 설명합니다."
          : primaryNeed === "automation_readiness"
            ? "사용자가 지금 단계가 스킬, 수동 워크플로우, 크론 후보, 에이전트 후보 중 무엇인지 쉽게 이해하게 합니다."
            : primaryNeed === "verification"
              ? "확인된 상태와 아직 미확인인 상태를 먼저 분리합니다."
              : primaryNeed === "artifact"
                ? "바로 쓸 산출물을 먼저 만들고 설명은 짧게 둡니다."
                : "현재 입력에서 가능한 다음 행동과 그 선택 기준을 분리해 제시합니다.";

  const guidance = [
    "사용자의 수준을 추정하지 말고 현재 입력값이 요구하는 동반 수준에 맞춥니다.",
    "입력이 막막하면 기능 설명보다 가능한 세계와 선택 기준을 먼저 보이게 합니다.",
    "입력이 구체적이면 불필요한 온보딩 없이 바로 실행/검증/산출로 내려갑니다."
  ];
  if (possibleWorldsNeeded !== "none") guidance.push("AI가 선택지를 대신 좁히기보다 가능한 길, 조건, 비용, 위험을 이해 가능한 구조로 펼칩니다.");
  if (choiceOwnershipRisk !== "low") guidance.push("추천은 가능하지만 사용자의 선택권과 선택 이후 부담을 AI가 대신 소유하지 않습니다.");
  if (riskyArtifactSignal) guidance.push("외부·고객·계약·의료성 문구는 짧아도 톤, 사실성, 승인 경계를 보정합니다.");
  if (interpersonalRetaliationSignal) guidance.push("대인관계 보복·망신 요청에서는 감정의 타당성과 실행 행동을 분리하고, 사용자에게 동조해 해로운 행동을 정당화하지 않습니다.");
  if (hasMedicalSafetySignal(text)) guidance.push("의약품·복용 판단은 이 대화만으로 직접 허용하지 말고, 처방 기준·약사/의사 확인·응급 증상 여부를 먼저 분리합니다.");
  if (primaryNeed === "automation_readiness" || primaryNeed === "workflow_design") {
    guidance.push("사용자가 도구명을 몰라도 지금 단계가 direct, skill candidate, manual workflow, cron later, agent candidate 중 어디인지 쉬운 언어로 설명합니다.");
    guidance.push("자동화는 바로 만들지 말고 수동 실행, 절차화, 검증, 승인 순서로 승격 경로를 보여줍니다.");
    guidance.push("기술 용어는 실생활 의미를 먼저 설명한 뒤 필요할 때만 붙입니다.");
  }
  if (trustCalibrationNeed === "strong") guidance.push("오류나 검증 상황에서는 확인된 것, 처리 중인 것, 실패한 것을 분리해 신뢰를 보정합니다.");
  if (recommendedSkillFamilies.length > 0) guidance.push(`필요하면 ${recommendedSkillFamilies.join(", ")} 계열 스킬을 후보로 둡니다.`);

  return {
    version: "0.6.18",
    mode: "guide_only",
    inputMaturity,
    primaryNeed,
    journeyStage,
    userBurden,
    cognitiveLoadLevel,
    choiceOwnershipRisk,
    trustCalibrationNeed,
    possibleWorldsNeeded,
    explanationDepth,
    controlBoundaryNeeded,
    recoveryNeed,
    responsePosture,
    firstSafeStep,
    questionBudget,
    shouldOfferOptions: userBurden !== "low" || primaryNeed === "orientation" || primaryNeed === "first_success_path",
    shouldAvoidToolJargon: userBurden !== "low" || primaryNeed === "orientation",
    shouldRouteToSkill: recommendedSkillFamilies.length > 0,
    recommendedSkillFamilies,
    guardNote: "Match the response to the maturity of the current input, not to a generic user level.",
    answerGuidance: Array.from(new Set(guidance)).slice(0, 6)
  };
}

function classifyResponseInertiaRelation(currentTurn: CurrentTurnPacket): ResponseInertiaRelation {
  const input = currentTurn.cleanInput;
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) return "unknown";

  if (wantsSameStructure(normalized)) return "continues_previous";
  if (currentTurn.requestedOutputShape === "artifact" || currentTurn.requestedOutputShape === "work_order") return "artifact_request";
  if (/(써줘|작성해|초안|문구|공지|메일|메시지|안내문|다시\s*만들|문서로|artifact|draft|write|compose)/i.test(normalized)) return "artifact_request";
  if (/(^|\s)(아니\s*(야|요|다|고|\.|,|$)|그건\s*아니|그게\s*아니라|틀렸|다시\s*봐|오해|잘못\s*봤|not\s+that|wrong)/i.test(normalized)) return "rejects_previous";
  if (/(근데|다만|추가로|보정|수정|바꿔|변경|새\s*정보|사실은|실제로는|정확히는|actually|instead)/i.test(normalized)) return "modifies_previous";
  if (/(별도|분리해서|separate\s*(issue|context|problem)?)/i.test(normalized)) return "separate_issue";
  if (/(다른\s*(얘기|주제|문제)|이번엔|이번에는|새로|new\s+topic)/i.test(normalized)) return "new_direction";
  if (/(결론만|짧게|한\s*줄|그래서\?|so\?|bottom\s*line|간단히)/i.test(normalized) || currentTurn.followUpScope !== "full") return "simple_followup";
  if (normalized.length <= 36) return "simple_followup";
  return "continues_previous";
}

function chooseResponseInertiaShift(relation: ResponseInertiaRelation, currentTurn: CurrentTurnPacket): ResponseInertiaRequiredShift {
  if (wantsSameStructure(currentTurn.cleanInput)) return "none";
  if (relation === "artifact_request") return "produce_artifact";
  if (relation === "rejects_previous") return "reframe";
  if (relation === "modifies_previous" || relation === "simple_followup") return "shorter_delta_only";
  if (relation === "new_direction") return "answer_directly";
  if (relation === "separate_issue") return "separate_contexts";
  if (currentTurn.missingCriticalInputs.length > 0) return "ask_one_new_variable";
  return "close_without_question";
}

export function buildResponseInertiaProfile(input: {
  currentTurn: CurrentTurnPacket;
  previousAssistantReply?: string;
  conversationScene?: ConversationSceneContinuityProfile;
}): ResponseInertiaProfile {
  const sceneExecutionContinuation = Boolean(input.conversationScene?.shouldPreferExecutionContinuation);
  const classifiedRelation = classifyResponseInertiaRelation(input.currentTurn);
  const relation = sceneExecutionContinuation && classifiedRelation !== "artifact_request" ? "continues_previous" : classifiedRelation;
  const previousSurface = detectPreviousResponseSurface(input.previousAssistantReply);
  const explicitSameStructure = wantsSameStructure(input.currentTurn.cleanInput);
  const previousStructureRisk =
    previousSurface.hasNumberedStructure || previousSurface.hasSectionHeadings || previousSurface.hasStrongConclusionFormula || previousSurface.endsWithQuestion;
  const shouldReuseStructure = explicitSameStructure;
  const shouldReuseQuestionStyle = explicitSameStructure && previousSurface.endsWithQuestion;
  const shouldRestatePreviousFrame = explicitSameStructure && relation === "continues_previous";
  const requiredShift =
    sceneExecutionContinuation && relation !== "artifact_request"
      ? "close_without_question"
      : chooseResponseInertiaShift(relation, input.currentTurn);

  const previousResponseReuseRisk: ResponseInertiaProfile["previousResponseReuseRisk"] = explicitSameStructure
    ? "low"
    : previousStructureRisk && ["modifies_previous", "rejects_previous", "simple_followup", "artifact_request", "new_direction"].includes(relation)
      ? "high"
      : previousStructureRisk
        ? "medium"
        : "low";

  const guidance: string[] = [
    "현재 발화가 실제로 바꾼 지점에 맞춰 응답 역할과 구조를 새로 고릅니다.",
    "명시적 요청이 없으면 이전 제목, 번호 구조, 질문 방식, 결론 문구를 반복하지 않습니다."
  ];
  if (requiredShift === "shorter_delta_only") guidance.push("이전 설명 전체를 반복하지 말고 바뀐 지점만 짧게 답합니다.");
  if (requiredShift === "reframe") guidance.push("사용자 보정이 들어오면 기존 판단을 방어하지 말고 보정된 전제로 재정렬합니다.");
  if (requiredShift === "produce_artifact") guidance.push("산출물 요청이면 분석을 반복하지 말고 결과물을 먼저 둡니다.");
  if (requiredShift === "answer_directly") guidance.push("새 방향이면 이전 프레임을 끌고 오지 말고 현재 요청에 직접 답합니다.");
  if (requiredShift === "ask_one_new_variable") guidance.push("정말 필요한 경우에만 새 변수 하나를 묻습니다.");
  if (sceneExecutionContinuation && relation !== "artifact_request") {
    guidance.push("짧은 후속 발화가 직전 장면의 pending action을 가리키면 현재 문장보다 대화 흐름을 우선합니다.");
  }

  const guardNote = explicitSameStructure
    ? "Explicit same-format request allows controlled structure reuse."
    : sceneExecutionContinuation && relation !== "artifact_request"
      ? "Inherit the shared conversation scene and continue the pending action."
    : requiredShift === "shorter_delta_only"
      ? "Respond only to the changed point; do not repeat the prior structure."
      : requiredShift === "produce_artifact"
        ? "Produce the requested artifact before analysis."
        : requiredShift === "reframe"
          ? "Reframe around the user's correction without defending the previous answer."
          : "Choose this turn's response shape from the current input, not prior inertia.";

  return {
    version: "0.6.1",
    mode: "guide_only",
    previousResponseReuseRisk,
    currentTurnRelation: relation,
    shouldReuseStructure,
    shouldReuseQuestionStyle,
    shouldRestatePreviousFrame,
    requiredShift,
    guardNote,
    answerGuidance: Array.from(new Set(guidance)).slice(0, 6)
  };
}

export function buildJudgmentSharpnessProfile(plan: Pick<
  BeaiTurnPlan,
  "currentTurn" | "responseResolution" | "realitySignalProfile" | "evidenceLedger" | "judgmentFlow" | "operatingJudgment" | "responseInertia"
>): JudgmentSharpnessProfile {
  const toolVerifiedCount = plan.evidenceLedger.toolVerified.filter((item) => item.trim()).length;
  const needsVerificationCount =
    plan.evidenceLedger.needsVerification.length +
    plan.realitySignalProfile.needsVerification.length +
    plan.judgmentFlow.unresolvedChecks.length;
  const hasAssumptions = plan.evidenceLedger.assumptions.length > 0 || plan.realitySignalProfile.assumptions.length > 0;
  const verificationClosed = plan.judgmentFlow.evidenceClosure.state === "closed_by_evidence";
  const operatingClaim = plan.operatingJudgment.claim.label;
  const asksForJudgment =
    plan.responseResolution.level === "judgment_deep" ||
    plan.responseResolution.level === "execution_check" ||
    plan.judgmentFlow.domain === "release_runtime";

  let claimStrength: JudgmentSharpnessClaimStrength = "bounded";
  if (toolVerifiedCount > 0 && needsVerificationCount === 0 && verificationClosed && operatingClaim === "complete") {
    claimStrength = "verified";
  } else if (needsVerificationCount > 0 || operatingClaim === "unverified") {
    claimStrength = "hold";
  } else if (hasAssumptions || plan.realitySignalProfile.claimPosture !== "can_state") {
    claimStrength = "tentative";
  }

  let uncertaintyAction: JudgmentSharpnessUncertaintyAction = "state_verified";
  if (operatingClaim !== "complete" && /(완료|적용|배포|자동화|production|프로덕션|release|릴리스)/i.test(plan.currentTurn.cleanInput)) {
    uncertaintyAction = "avoid_completion_claim";
  } else if (needsVerificationCount > 0 && toolVerifiedCount > 0) {
    uncertaintyAction = "separate_verified_from_unknown";
  } else if (needsVerificationCount > 0) {
    uncertaintyAction = asksForJudgment ? "verify_first" : "ask_one_check";
  } else if (claimStrength !== "verified") {
    uncertaintyAction = "separate_verified_from_unknown";
  }

  const shouldSoftenUnverified = claimStrength === "hold" || claimStrength === "tentative" || uncertaintyAction === "avoid_completion_claim";
  const shouldSharpenConfirmed = toolVerifiedCount > 0 || plan.realitySignalProfile.confirmedFacts.length > 0;
  const shouldAskNewQuestion =
    uncertaintyAction === "ask_one_check" &&
    plan.currentTurn.missingCriticalInputs.length > 0 &&
    plan.responseInertia.requiredShift !== "close_without_question";

  const guidance = [
    "확인된 사실, 런타임 추론, 가정, 추가 확인이 필요한 항목을 섞지 않습니다.",
    "증거가 닫힌 항목은 흐리지 말고 선명하게 말하되, 미검증 항목은 완료 주장으로 올리지 않습니다."
  ];
  if (uncertaintyAction === "avoid_completion_claim") guidance.push("완료, 적용됨, 자동화됨, 프로덕션급 같은 강한 표현은 도구 검증 뒤에만 씁니다.");
  if (uncertaintyAction === "separate_verified_from_unknown") guidance.push("확인된 것과 남은 확인을 한 문단 안에서 섞지 말고 분리합니다.");
  if (uncertaintyAction === "verify_first") guidance.push("판단을 강하게 닫기 전에 확인 경로 또는 검증 결과를 먼저 제시합니다.");
  if (shouldAskNewQuestion) guidance.push("질문이 필요하면 새 변수 하나만 묻습니다.");

  const guardNote =
    claimStrength === "verified"
      ? "Verified evidence may be stated clearly without extra hedging."
      : uncertaintyAction === "avoid_completion_claim"
        ? "Do not turn unverified status into completion or production claims."
        : "Sharpen confirmed facts while keeping unverified claims bounded.";

  return {
    version: "0.6.2",
    mode: "guide_only",
    claimStrength,
    uncertaintyAction,
    shouldSharpenConfirmed,
    shouldSoftenUnverified,
    shouldAskNewQuestion,
    guardNote,
    answerGuidance: Array.from(new Set(guidance)).slice(0, 6)
  };
}

export function buildSurfaceFlowProfile(
  currentTurn: CurrentTurnPacket,
  sharedPlan: SharedTurnPlan,
  judgmentFrame: JudgmentFrame,
  responseResolution: ResponseResolution
): SurfaceFlowProfile {
  const input = currentTurn.cleanInput;
  const asksState =
    sharedPlan.primaryClass === "verification" ||
    sharedPlan.turnJudgment === "verify" ||
    /(상태|점검|확인|검증|status|doctor|hooks|tasks|logs)/i.test(input);
  const asksJudgment =
    sharedPlan.primaryClass === "diagnosis" ||
    sharedPlan.primaryClass === "planning" ||
    sharedPlan.turnJudgment === "diagnose" ||
    /(고민|의미|어떻게|어때|판단|결정|비교|갈등|불안|막막)/i.test(input);
  const artifactTextSignal = /(작성해|써줘|만들어줘|정리문|안내문|공유\s*문구|메시지|초안|원고|체크리스트|표로|template|draft|write|compose)/i.test(input);
  const artifactFirst =
    !asksJudgment &&
    (responseResolution.level === "artifact_first" ||
      ["artifact"].includes(judgmentFrame.responseRole) ||
      ["artifact_generation", "editing", "summary"].includes(sharedPlan.primaryClass) ||
      artifactTextSignal);

  const firstSentence = artifactFirst
    ? "artifact_first"
    : asksState
      ? "state_first"
      : asksJudgment
        ? "enter_user_reality"
        : "direct";

  const avoid = [
    "visible internal labels",
    "rigid template language",
    "controlling user choices",
    "over-strong conclusion without evidence"
  ];
  if (asksJudgment) avoid.push("abstract conclusion before the user's concrete situation");
  if (artifactFirst) avoid.push("long preface before the requested artifact");
  if (asksState) avoid.push("complete claim before verified status");

  return {
    mode: "guide_only",
    rewriteOutput: false,
    clarityTarget: "clear_understanding",
    overCompression: "avoid",
    firstSentence,
    artifactFirst,
    decisionQuestionsMax: asksJudgment && !artifactFirst ? 2 : 1,
    choiceLimit: 3,
    closeWith: "one_handle",
    userRealityLanguage: true,
    avoid: Array.from(new Set(avoid)).slice(0, 6)
  };
}

export function buildDecisionHandleSurfaceProfile(
  plan: Pick<
    BeaiTurnPlan,
    "currentTurn" | "judgmentFrame" | "responseResolution" | "realitySignalProfile" | "judgmentFlow" | "surfaceFlow" | "operatingJudgment"
  >
): DecisionHandleSurfaceProfile {
  const isArtifact = plan.surfaceFlow.artifactFirst || plan.judgmentFrame.responseRole === "artifact";
  const hasRemainingChecks = plan.judgmentFlow.unresolvedChecks.length > 0 || plan.realitySignalProfile.needsVerification.length > 0;
  const isVerification = plan.responseResolution.level === "execution_check" || plan.operatingJudgment.claim.label === "unverified";
  const isHandoff = /세션|handoff|이어|다음\s*대화|새\s*세션/i.test(plan.currentTurn.cleanInput);

  const kind: DecisionHandleKind = isArtifact
    ? "artifact"
    : isHandoff
      ? "handoff"
      : hasRemainingChecks || isVerification
        ? "verification"
        : plan.judgmentFlow.domain === "general"
          ? "next_action"
          : "judgment";

  const closeStyle: DecisionHandleSurfaceProfile["closeStyle"] = isArtifact
    ? "artifact_first"
    : hasRemainingChecks
      ? "condition_first"
      : kind === "next_action" || kind === "handoff"
        ? "next_action_first"
        : "decision_first";

  const nextVerification =
    plan.judgmentFlow.unresolvedChecks[0] || plan.realitySignalProfile.needsVerification[0];

  const primaryHandle =
    kind === "artifact"
      ? "사용자가 바로 쓸 산출물을 먼저 놓고, 설명은 필요한 만큼만 뒤에 둡니다."
      : hasRemainingChecks
        ? `확인이 필요한 항목: ${nextVerification}`
        : plan.judgmentFlow.nextJudgmentHandle;

  const guidance = [
    "답변 마지막은 새 질문을 늘리는 대신 사용자가 붙잡을 판단 기준, 다음 행동, 보류 조건 중 하나로 닫습니다.",
    "좋은 응답은 무조건 압축이 아니라 사용자가 자연스럽게 이해하고 납득하도록 흐름을 선명하게 만드는 것입니다."
  ];
  if (kind === "verification") guidance.push("미확인 항목이 남아 있으면 결론을 강하게 닫지 말고 확인이 필요한 범위를 본문 안에서 자연스럽게 분리합니다.");
  if (kind === "judgment") guidance.push("판단 요청에서는 선택지를 늘리기보다 현재 가장 중요한 판단 기준 하나를 남깁니다.");
  if (kind === "artifact") guidance.push("산출물 요청에서는 사용자가 바로 쓸 결과물을 먼저 제공합니다.");

  return {
    version: "0.4.8",
    mode: "guide_only",
    kind,
    primaryHandle,
    closeStyle,
    mustNotCloseWith: [
      "형식적인 추가 질문",
      "이미 닫힌 검증 항목 반복",
      "새로운 큰 계획 열기",
      "사용자 선택을 통제하는 표현"
    ],
    guidance: Array.from(new Set(guidance)).slice(0, 5)
  };
}

export function buildConversationalRhythmProfile(
  plan: Pick<
    BeaiTurnPlan,
    "currentTurn" | "judgmentFrame" | "responseResolution" | "userConfidence" | "surfaceFlow" | "decisionHandleSurface" | "realitySignalProfile"
  >
): ConversationalRhythmProfile {
  const input = plan.currentTurn.cleanInput;
  const frustration = /(씨발|짜증|답답|화나|미치겠|왜\s*계속|또\s*이래|안\s*되잖|먹통|멈췄|무응답)/i.test(input);
  const vulnerableConcern = /(고민|불안|걱정|어렵|막막|의미가\s*있|어떻게\s*해야|잘\s*모르겠)/i.test(input);
  const execution = plan.userConfidence.executionMode === "execution" || /(진행해|반영해|수정해|적용해|만들어|설치해)/i.test(input);
  const verification = plan.decisionHandleSurface.kind === "verification" || plan.responseResolution.level === "execution_check";
  const artifact = plan.surfaceFlow.artifactFirst || plan.decisionHandleSurface.kind === "artifact";
  const state = plan.surfaceFlow.firstSentence === "state_first" || /상태|점검|확인|검토|브리핑/i.test(input);

  const openingMove: ConversationalRhythmProfile["openingMove"] = artifact
    ? "artifact_first"
    : frustration
      ? "meet_emotion"
      : state || verification
        ? "state_first"
        : vulnerableConcern
          ? "meet_reality"
          : "answer_directly";

  const density: ConversationalRhythmProfile["density"] = artifact || execution
    ? "compact"
    : vulnerableConcern || plan.surfaceFlow.firstSentence === "enter_user_reality"
      ? "expanded_when_needed"
      : "balanced";

  const warmth: ConversationalRhythmProfile["warmth"] = frustration || vulnerableConcern
    ? "high"
    : artifact || execution
      ? "low"
      : "medium";

  const structure: ConversationalRhythmProfile["structure"] = artifact
    ? "plain_paragraphs"
    : state || verification
      ? "short_sections"
      : execution
        ? "checklist_when_useful"
        : "plain_paragraphs";

  const companionStance: ConversationalRhythmProfile["companionStance"] = frustration
    ? "steady"
    : verification || state
      ? "careful"
      : execution
        ? "practical"
        : "steady";

  const avoid = [
    "template-like empathy",
    "cold diagnostic opening for personal concern",
    "overly cheerful tone during frustration",
    "new broad plan after a direct execution request"
  ];
  if (artifact) avoid.push("preface before the requested artifact");
  if (verification) avoid.push("certainty beyond verified evidence");
  if (vulnerableConcern) avoid.push("premature summary before the user's situation is held");

  const guidance = [
    "사용자의 현재 정서와 요청 모드를 먼저 맞춘 뒤 필요한 구조를 씁니다.",
    "자연스러운 대화 흐름을 유지하되, 근거와 확인 경계를 흐리지 않습니다."
  ];
  if (frustration) guidance.push("분노나 답답함이 있으면 방어적으로 설명하지 말고 문제를 정확히 다시 잡고 바로 좁혀 갑니다.");
  if (vulnerableConcern) guidance.push("고민 상담에서는 사용자의 현실을 먼저 붙잡고, 결론은 기준과 다음 행동으로 천천히 닫습니다.");
  if (artifact) guidance.push("산출물 요청에서는 말보다 결과물을 먼저 줍니다.");
  if (verification) guidance.push("검증 요청에서는 확인된 것과 아직 확인하지 않은 것을 리듬상 분리합니다.");

  return {
    version: "0.4.8",
    mode: "guide_only",
    openingMove,
    density,
    warmth,
    structure,
    companionStance,
    avoid: Array.from(new Set(avoid)).slice(0, 6),
    guidance: Array.from(new Set(guidance)).slice(0, 6)
  };
}

const SCHEDULE_AUTOMATION_PATTERN = /(cron|크론|스케줄|예약\s*실행|자동\s*실행|자동화|반복\s*실행|정기\s*실행|scheduled\s+task|recurring|매(?:일|주|월|시간)|매\s*\d+\s*(?:분|시간|일|주|개월)|\d+\s*분마다|(?:아침|오전|점심|저녁|밤|퇴근|출근).{0,24}(?:브리핑|리포트|보고|요약|알려|보내)|(?:매일|매주|매월).{0,80}(?:브리핑|리포트|보고|요약|알려|보내|게시|발송|체크|확인))/i;

function hasScheduledWorkSignal(text: string): boolean {
  if (hasReadOnlyAutomationInspectionSignal(text) || hasExplicitRoutingNegationSignal(text)) return false;
  return SCHEDULE_AUTOMATION_PATTERN.test(text);
}

function hasExternalWriteSignal(text: string): boolean {
  if (hasReadOnlyNotionSignal(text) || hasReadOnlyTelegramStatusSignal(text)) return false;
  if (hasDraftOnlyExternalArtifactSignal(text)) return false;
  return /(외부\s*(?:발송|전송)|팀원(?:들)?에게\s*(?:보내|공유|전송|발송)|고객(?:에게)?.{0,50}(?:보내|답장|전송|발송|자동\s*답장)|이메일\s*(?:보내|발송)|메일\s*(?:보내|발송)|(?:slack|슬랙).{0,50}(?:보내|공유|전송|올려|게시|공지)|(?:discord|디스코드).{0,50}(?:보내|공유|전송|올려|게시)|(?:whatsapp|왓츠앱).{0,50}(?:보내|공유|전송)|(?:telegram|텔레그램).{0,40}(?:보내|공유|전송|발송|단체방|채널|올려|게시)|notion.{0,50}(?:올려|페이지\s*(?:생성|만들|작성|수정)|작성|보고서|만들|업로드)|노션.{0,50}(?:올려|페이지\s*(?:생성|만들|작성|수정)|작성|보고서|만들|업로드)|github.{0,60}(?:issue|이슈|PR|pull request|comment|댓글).{0,60}(?:등록|열어|작성|올려|달아|만들)|(?:issue|이슈)(?:로|를)?\s*(?:등록|열어|작성|올려)|블로그(?:에)?\s*(?:올려|게시)|트위터|twitter|x\.com|(?:^|[^A-Za-z])X에.{0,40}(?:올려|게시|트윗)|엑스에.{0,40}(?:올려|게시|트윗)|공개\s*(?:게시|발행|공유)|게시해|발행해)/i.test(text);
}

function hasDraftOnlyExternalArtifactSignal(text: string): boolean {
  return /(초안만|문구만|카피만|문장만|draft\s*only|only\s*(?:draft|copy|text))/.test(text) &&
    /(?:slack|슬랙|discord|디스코드|whatsapp|왓츠앱|telegram|텔레그램|email|이메일|메일|공지|채널|단체방|고객|팀원)/i.test(text);
}

function hasSkillLifecycleSignal(text: string): boolean {
  if (hasExplicitRoutingNegationSignal(text) || hasSkillDescriptionArtifactSignal(text)) return false;
  return /(스킬.{0,40}(?:만들|제작|생성|추가|수정|보강|업데이트|업그레이드|적용|승인|폐기|반려|격리|목록|proposal|제안)|skill\s*(?:create|build|update|revise|apply|reject|quarantine|proposal)|proposal.{0,12}(?:승인|적용|폐기|반려|reject|apply))/i.test(text);
}

function hasAgentCandidateSignal(text: string): boolean {
  if (hasExplicitRoutingNegationSignal(text)) return false;
  return /(에이전트|agent|전담|담당하게|계속\s*관리|상시\s*관리|따로\s*맡겨|전용\s*역할|프로젝트\s*상태를\s*계속|상태를\s*들고|독립\s*역할|위임)/i.test(text);
}

function hasAppProductSignal(text: string): boolean {
  return /(앱|웹앱|웹\s*앱|사이트|웹사이트|대시보드|랜딩\s*페이지|포트폴리오\s*사이트|예약(?:받는)?\s*앱|재고\s*관리|고객관리|관리자|첫\s*화면|로컬에서\s*볼\s*수\s*있게|3d\s*랜딩|SaaS|서비스)/i.test(text);
}

function hasAuthDataPaymentDeploySignal(text: string): boolean {
  return /(회원가입|로그인|사용자\s*데이터|개인정보|DB|database|데이터\s*저장|결제|구독|payment|checkout|배포|인터넷에\s*올려|실서버|production|deploy|auth)/i.test(text);
}

function hasRollbackSignal(text: string): boolean {
  return /(롤백|되돌려|원복|복구|이전\s*버전으로|rollback|revert|restore)/i.test(text);
}

function hasAutomaticMemorySignal(text: string): boolean {
  return /((?:모든|전부|전체)\s*(?:프로젝트\s*)?대화.{0,30}(?:자동으로\s*)?(?:기억|저장)|(?:프로젝트\s*)?대화\s*전체\s*저장|프로젝트\s*대화.{0,20}자동\s*저장|(?:자동으로|항상|앞으로\s*계속).{0,20}(?:장기\s*)?(?:기억|메모리|memory).{0,20}(?:저장|남겨)|장기\s*기억\s*자동|memory\s*auto)/i.test(text);
}

function hasIssueLedgerWriteSignal(text: string): boolean {
  return /(이슈\s*장부|오류\s*기록|문제로\s*남겨|품질\s*장부|비아이\s*닥터.{0,20}(?:기록|장부|남겨)|doctor.{0,20}(?:ledger|issue))/i.test(text);
}

function hasVersionMutationSignal(text: string): boolean {
  return /((?:버전|version).{0,32}(?:올려|상향|변경|맞춰|업데이트|bump)|v?\d+\.\d+\.\d+(?:로|으로)?\s*(?:올려|상향|변경|맞춰|업데이트)|version\s*bump|버전\s*범프)/i.test(text);
}

function hasReadOnlyAutomationInspectionSignal(text: string): boolean {
  return /((?:현재|등록된|활성|active|existing)?.{0,12}(?:cron|크론|스케줄|자동화).{0,18}(?:목록|리스트|상태|기록|로그|확인|조회|보여|점검)|(?:cron|크론|스케줄|자동화).{0,18}(?:목록만|기록만|확인만|조회만|상태만))/i.test(text);
}

function hasReadOnlyTelegramStatusSignal(text: string): boolean {
  return /(?:telegram|텔레그램).{0,40}(?:connected|연결|상태|status|roundtrip|라운드트립|수신|송신|확인|점검|단정하지\s*마)/i.test(text) &&
    !/(?:telegram|텔레그램).{0,40}(?:보내|공유|전송|발송|단체방|채널|올려|게시|설정|config|재시작|restart|토큰|token)/i.test(text);
}

function hasReadOnlyNotionSignal(text: string): boolean {
  return /(?:notion|노션).{0,50}(?:읽|조회|검색|요약|정리|확인|가져와|살펴|review|summarize|search)/i.test(text) &&
    !/(?:notion|노션).{0,50}(?:올려|생성|만들|작성|수정|업로드|등록|create|update|write|upload)/i.test(text);
}

function hasExplicitRoutingNegationSignal(text: string): boolean {
  return /(스킬(?:로)?\s*(?:만들|제작|생성|추가|전환)지\s*(?:마|말고)|스킬\s*만들지\s*(?:마|말고)|에이전트(?:로)?\s*(?:만들|생성|넘기|위임)지\s*(?:마|말고)|에이전트\s*만들지\s*말고|자동화(?:하|로\s*만들)지\s*(?:마|말고)|크론(?:으로)?\s*(?:만들|등록)지\s*(?:마|말고)|cron(?:으로)?\s*(?:만들|등록)지\s*(?:마|말고))/i.test(text);
}

function hasSkillDescriptionArtifactSignal(text: string): boolean {
  return /(스킬\s*(?:설명|소개|문구|카피).{0,24}(?:다듬|수정|작성|써|바꿔)|스킬\s*설명만|스킬\s*소개\s*문구)/i.test(text);
}

function hasDocsOnlyReleaseArtifactSignal(text: string): boolean {
  return /((?:rollback|롤백)\s*guide\s*문서만|(?:릴리스\s*노트|release\s*notes?|검증\s*장부|verification\s*ledger|가이드|guide).{0,20}(?:문서만|만\s*써|초안만|작성만))/i.test(text);
}

function hasRetryPolicySignal(text: string): boolean {
  return /(실패(?:하면|시).{0,30}(?:자동으로\s*)?(?:다시\s*시도|재시도|복구)|재시도\s*정책|retry\s*policy|watchdog|failure\s*policy|실패\s*시\s*복구)/i.test(text);
}

function hasDestructiveRewriteSignal(text: string): boolean {
  return /(기존\s*(?:구조|파일|코드|폴더).{0,20}(?:다\s*밀|삭제|갈아엎|엎고)|다\s*밀고\s*새로|싹\s*갈아엎|처음부터\s*다시\s*(?:만들|작성|구성)|전체\s*재작성|destructive\s*rewrite)/i.test(text);
}

function hasOpenClawCoreMutationSignal(text: string): boolean {
  return /(?:openclaw|오픈클로).{0,40}(?:(?:core|코어).{0,24})?(?:설정|config|configuration|플러그인\s*설정|plugin\s*config|allowlist|권한|permission|core|코어).{0,32}(?:패치|수정|변경|고쳐|바꿔|적용|업데이트|patch|modify|edit|change|update)|(?:gateway|게이트웨이|telegram|텔레그램).{0,32}(?:설정|config|configuration|토큰|token|webhook|polling).{0,32}(?:수정|변경|바꿔|적용|업데이트|modify|edit|change|update)/i.test(text);
}

function hasSameScopeApprovalContinuationSignal(text: string): boolean {
  return /(?:방금|아까|이미|직전).{0,16}승인(?:한|한\s*작업|한\s*범위)?.{0,30}(?:계속|이어|진행|해줘)|승인한\s*(?:그대로|범위에서|작업)\s*(?:계속|이어|진행)|same[-\s]?scope\s*(?:continuation|continue)/i.test(text);
}

function hasMoneyMovementSignal(text: string): boolean {
  return /(계좌\s*이체|송금|출금|입금\s*실행|이체\s*실행|돈\s*(?:보내|이동)|bank\s*transfer|wire\s*transfer|remittance|pay\s*invoice|invoice\s*payment|인보이스\s*결제)/i.test(text);
}

function hasMedicalSafetySignal(text: string): boolean {
  return /(약|의약품|복용|먹어도\s*돼|먹어도\s*되|처방|부작용|응급|진통제|항생제|medicine|medication|dose|dosage)/i.test(text);
}

function hasDurableProcedureSignal(text: string): boolean {
  return /(?:앞으로|매번|항상).{0,40}(?:이\s*절차|이\s*형식|이\s*방식|절차로|형식으로|방식으로).{0,40}(?:정리|처리|작성|진행|해줘)/i.test(text);
}

function hasBusinessOperationsSignal(text: string): boolean {
  const localOpsSignal =
    /(외식|식당|음식점|자영업|사업장|점포|매장|마느|엘리펀트|파찌|백화점|주방|홀|풀타임|직원|인력|코어\s*인력|오너|대표|몸빵|현장\s*투입|가족\s*시간|법인|법인\s*전환|종소세|법인세|세금)/i.test(text);
  const revenueWithOpsContext =
    /(매출|순이익|영업이익|마진)/i.test(text) &&
    /(직원|인력|세금|현금|대표|오너|현장|매장|점포|사업장|가족|법인|운영|시스템화)/i.test(text);
  return localOpsSignal || revenueWithOpsContext;
}

function hasApprovalFrustrationSignal(text: string): boolean {
  const hasApprovalSurface = /(승인\s*(문구|요청|카드|대기)|approval|Plugin approval|Codex app-server|allow-once|allow-always|deny)/i.test(text);
  const hasFrustration = /(씨발|짜증|답답|계속\s*나오|반복|멈춘|먹통|무응답)/i.test(text);
  return hasApprovalSurface && hasFrustration;
}

export function buildConversationQualityGuardProfile(
  plan: Pick<
    BeaiTurnPlan,
    "currentTurn" | "judgmentFrame" | "realitySignalProfile" | "judgmentFlow" | "decisionHandleSurface" | "conversationalRhythm"
  >
): ConversationQualityGuardProfile {
  const input = plan.currentTurn.cleanInput;
  const fixture: ConversationQualityFixture = /(김제|집터|시골집|고향집|아버지|부모님|증조|상속|물려받|농막|농촌|귀촌|전원주택|대지|토지|건축|상시\s*거주|체류)/i.test(input)
    ? "family_asset"
    : hasBusinessOperationsSignal(input)
      ? "business_operations"
      : hasApprovalFrustrationSignal(input)
        ? "approval_frustration"
        : plan.decisionHandleSurface.kind === "artifact"
          ? "artifact_request"
          : "general";

  const qualityTarget: ConversationQualityGuardProfile["qualityTarget"] = fixture === "artifact_request"
    ? "usable_artifact"
    : fixture === "approval_frustration"
      ? "calm_recovery"
      : fixture === "general"
        ? "clear_mind"
        : "decision_clarity";

  const mustPreserve: string[] = [
    "사용자의 현재 요청 범위",
    "확인된 것과 확인이 필요한 것의 경계"
  ];
  const mustAvoid: string[] = [
    "형식적인 공감 문구",
    "근거 없는 단정",
    "같은 말을 구조만 바꿔 반복"
  ];
  const regressionChecks: string[] = [
    "final answer should not expose internal overlay labels",
    "final answer should not append the current decision handle as a repeated footer"
  ];

  if (fixture === "family_asset") {
    mustPreserve.push("가족 정서", "거주 현실", "법적/건축 확인 조건");
    mustAvoid.push("수익률만으로 의미를 닫기", "농막/주택 가능성을 확인 없이 단정");
    regressionChecks.push("separate emotion, legal checks, lifestyle feasibility, and next verification");
  } else if (fixture === "business_operations") {
    mustPreserve.push("현금 방어", "오너 긴급투입", "인력 대체 구조", "가족 시간");
    mustAvoid.push("매출 성장만 처방", "더 고생하자는 결론", "매장 정리/확장을 성급히 단정");
    regressionChecks.push("separate money, staff, family, tax, and systemization variables");
  } else if (fixture === "approval_frustration") {
    mustPreserve.push("사용자의 답답함", "반복 승인 표면의 실제 원인 후보", "OpenClaw 승인권 유지");
    mustAvoid.push("방어적 해명", "핀칭과 승인 카드를 혼동", "allow-always를 기본 처방");
    regressionChecks.push("acknowledge frustration, narrow cause, preserve approval boundary");
  } else if (fixture === "artifact_request") {
    mustPreserve.push("요청된 산출물", "바로 사용할 수 있는 문장");
    mustAvoid.push("긴 배경 설명", "산출물 전에 과도한 계획");
    regressionChecks.push("artifact appears before explanation");
  }

  if (plan.conversationalRhythm.openingMove === "meet_emotion") {
    regressionChecks.push("opening should meet emotion without escalating tone");
  }
  if (plan.realitySignalProfile.needsVerification.length > 0) {
    regressionChecks.push("do not turn unverified conditions into final claims");
  }

  return {
    version: "0.4.8",
    mode: "guide_only",
    fixture,
    qualityTarget,
    mustPreserve: Array.from(new Set(mustPreserve)).slice(0, 7),
    mustAvoid: Array.from(new Set(mustAvoid)).slice(0, 7),
    regressionChecks: Array.from(new Set(regressionChecks)).slice(0, 7)
  };
}

export function buildHumanCompanionQualityProfile(
  plan: Pick<
    BeaiTurnPlan,
    | "currentTurn"
    | "inputLevelCompanion"
    | "conversationSceneContinuity"
    | "conversationQualityGuard"
    | "conversationalRhythm"
    | "responseInertia"
    | "judgmentSharpness"
    | "flowState"
  >
): HumanCompanionQualityProfile {
  const input = plan.currentTurn.cleanInput;
  const reduceBy = new Set<string>();
  const mustDo = new Set<string>();
  const mustAvoid = new Set<string>();
  const regressionChecks = new Set<string>();

  reduceBy.add("핵심 판단 변수를 먼저 분리합니다.");
  reduceBy.add("불필요한 선택지를 늘리지 않습니다.");
  mustDo.add("사용자가 실제로 말한 요청을 먼저 붙잡습니다.");
  mustDo.add("확인된 것과 아직 확인할 것을 분리합니다.");
  mustAvoid.add("비아이 내부 상태명을 사용자 답변처럼 말하기");
  mustAvoid.add("긴 대화의 이전 결론을 현재 요청보다 앞세우기");
  regressionChecks.add("current request must remain the first anchor");
  regressionChecks.add("prior context must support, not override, the current turn");
  regressionChecks.add("user reality must be preserved before interpretation");
  regressionChecks.add("conversation assets require user acceptance or reuse");
  regressionChecks.add("artifacts must fit the actual recipient and scene");
  regressionChecks.add("conversation flow must track intent, state, and situation without mechanical context stuffing");

  if (plan.inputLevelCompanion.cognitiveLoadLevel !== "low") {
    reduceBy.add("먼저 사용자가 당장 붙잡을 하나의 기준을 둡니다.");
    reduceBy.add("설명보다 구조화된 판단 회수를 우선합니다.");
  }
  if (plan.inputLevelCompanion.choiceOwnershipRisk !== "low") {
    mustDo.add("AI가 결정을 대신 닫지 말고 선택 기준을 돌려줍니다.");
    mustAvoid.add("사용자의 선택 부담을 AI 권위로 덮기");
    regressionChecks.add("preserve user agency while reducing choice burden");
  }
  if (plan.inputLevelCompanion.trustCalibrationNeed === "strong" || plan.conversationQualityGuard.qualityTarget === "calm_recovery") {
    mustDo.add("신뢰가 흔들린 지점을 인정하고, 원인 후보와 확인 경로를 좁힙니다.");
    mustAvoid.add("방어적 해명 또는 감정 없는 상태 보고");
    regressionChecks.add("repair trust before expanding the plan");
  }
  if (plan.responseInertia.requiredShift === "shorter_delta_only" || plan.currentTurn.followUpScope !== "full") {
    mustDo.add("후속 턴에서는 바뀐 지점만 반영합니다.");
    mustAvoid.add("이전 답변 구조를 습관적으로 반복하기");
    regressionChecks.add("follow-up answer must be delta-only when scope is narrow");
  }
  if (plan.conversationSceneContinuity.sceneStatus === "active_scene") {
    reduceBy.add("진행 중인 장면은 이어가되, 새 입력이 우선합니다.");
  }

  const userExperienceTarget: HumanCompanionQualityProfile["userExperienceTarget"] =
    plan.conversationQualityGuard.qualityTarget === "usable_artifact" || plan.flowState.responseRole === "artifact"
      ? "usable_output"
      : plan.inputLevelCompanion.trustCalibrationNeed === "strong"
        ? "recover_trust"
        : plan.conversationSceneContinuity.sceneStatus === "active_scene"
          ? "stable_long_context"
          : plan.inputLevelCompanion.primaryNeed === "execution" || plan.inputLevelCompanion.primaryNeed === "verification"
            ? "clear_next_action"
            : "feel_understood";

  const stance: HumanCompanionQualityProfile["dialogueFrame"]["stance"] =
    userExperienceTarget === "usable_output"
      ? "act_then_explain"
      : userExperienceTarget === "recover_trust"
        ? "repair_then_verify"
        : plan.currentTurn.missingCriticalInputs.length > 0
          ? "clarify_then_act"
          : "mirror_then_move";

  const longConversationRisk: HumanCompanionQualityProfile["continuityFrame"]["longConversationRisk"] =
    plan.conversationSceneContinuity.sceneStatus === "active_scene" && plan.responseInertia.previousResponseReuseRisk !== "low"
      ? "high"
      : plan.conversationSceneContinuity.sceneStatus === "active_scene" || input.length > 700
        ? "medium"
        : "low";

  const decisionReturn =
    plan.flowState.responseRole === "artifact"
      ? "바로 쓸 산출물"
      : plan.flowState.approvalBoundary.required
        ? "승인 경계와 복구 기준"
        : plan.judgmentSharpness.claimStrength === "hold"
          ? "확인해야 할 기준"
          : "다음 행동 또는 판단 기준";
  const burdenStrategy: HumanCompanionQualityProfile["burdenReducer"]["strategy"] =
    plan.flowState.responseRole === "artifact"
      ? "artifact_first"
      : plan.judgmentSharpness.claimStrength === "hold"
        ? "verify_then_decide"
        : plan.inputLevelCompanion.cognitiveLoadLevel === "high"
          ? "narrow_to_one_handle"
          : "keep_small";
  const trustRepairRequired =
    userExperienceTarget === "recover_trust" ||
    plan.conversationSceneContinuity.utteranceRole === "repair_previous_interpretation" ||
    plan.conversationQualityGuard.qualityTarget === "calm_recovery";
  const conversationalFlowNeedsBoundary =
    longConversationRisk !== "low" ||
    plan.responseInertia.requiredShift === "shorter_delta_only" ||
    plan.conversationSceneContinuity.utteranceRole === "repair_previous_interpretation";

  return {
    version: "0.1",
    mode: "guide_only",
    userExperienceTarget,
    cognitiveFrame: {
      load: plan.inputLevelCompanion.cognitiveLoadLevel,
      reduceBy: Array.from(reduceBy).slice(0, 4)
    },
    dialogueFrame: {
      stance,
      mustDo: Array.from(mustDo).slice(0, 5),
      mustAvoid: Array.from(mustAvoid).slice(0, 5)
    },
    continuityFrame: {
      preserveCurrentRequest: true,
      usePriorContextAs: longConversationRisk === "high" ? "supporting_context" : "active_constraint",
      longConversationRisk
    },
    agencyFrame: {
      preserveUserChoice: true,
      doNotOutsourceJudgmentToUser: plan.inputLevelCompanion.questionBudget === 0,
      decisionReturn
    },
    userRealityFrame: {
      preserveBeforeInterpretation: true,
      realitySignals: [
        "currentTurn.cleanInput",
        "judgmentFrame.confirmed",
        "realitySignalMap.strong"
      ],
      mustNotOverwrite: [
        "사용자가 말한 현재 요청",
        "확인된 사실과 아직 모르는 것의 경계",
        "사용자의 선택권과 승인 경계"
      ]
    },
    burdenReducer: {
      strategy: burdenStrategy,
      reduceBy: Array.from(reduceBy).slice(0, 4)
    },
    conversationAssetLedger: {
      acceptedContextOnly: true,
      priorContextRole: longConversationRisk === "high" ? "supporting_context" : "active_constraint",
      mustNotPromote: [
        "AI가 한 번 말했을 뿐인 해석",
        "사용자가 받아들이지 않은 기억 후보",
        "현재 요청을 덮는 오래된 closure handle"
      ]
    },
    artifactSceneModel: {
      artifactFirst: plan.flowState.responseRole === "artifact",
      sceneFit: plan.flowState.responseRole === "artifact" ? "required" : "not_applicable",
      mustDo:
        plan.flowState.responseRole === "artifact"
          ? ["수신자, 장소, 목적에 맞춘 결과물을 먼저 냅니다.", "내부 전략을 외부 문장에 그대로 드러내지 않습니다."]
          : ["산출물 요청이 아니면 장면 모델을 과하게 열지 않습니다."]
    },
    recoveryFrame: {
      required: trustRepairRequired,
      repairAction: trustRepairRequired
        ? "잘못 적용한 프레임을 폐기하고 현재 요청으로 재정렬합니다."
        : "새 신호가 들어오면 기존 판단을 방어하지 않고 보정합니다.",
      mustAvoid: ["방어적 해명", "오인된 이전 구조 반복", "검증 전 완료 주장"]
    },
    conversationalFlowCore: {
      intentTracking: plan.currentTurn.missingCriticalInputs.length > 0 ? "unclear_intent_verify_first" : "current_intent_first",
      contextMotion: conversationalFlowNeedsBoundary ? "boundary_required" : "fluid_context_selection",
      naturalnessTarget: conversationalFlowNeedsBoundary ? "mechanical_context_risk" : "human_state_aware",
      mustDo: [
        "사용자의 현재 의도, 대화 단계, 상황 압력을 함께 읽습니다.",
        "필요한 맥락만 붙이고 나머지는 배경으로 낮춥니다.",
        "정정 신호가 오면 이전 프레임을 방어하지 않고 갱신합니다."
      ],
      mustAvoid: [
        "단어 매칭만으로 의도 확정하기",
        "오래된 맥락을 많이 붙여 자연스러움처럼 보이게 하기",
        "사용자 상태와 요청 형식을 분리하지 못한 기계적 요약"
      ]
    },
    regressionChecks: Array.from(regressionChecks).slice(0, 8)
  };
}

export function buildClassificationFailSoftProfile(
  plan: Pick<BeaiTurnPlan, "currentTurn" | "conversationQualityGuard" | "operatingJudgment" | "decisionHandleSurface">
): ClassificationFailSoftProfile {
  const input = plan.currentTurn.cleanInput;
  const weakSignals: string[] = [];
  if (/(가족|부모|아버지|어머니)/i.test(input)) weakSignals.push("family_word");
  if (/(반복|매일|매주|자동화|스케줄|예약)/i.test(input)) weakSignals.push("repetition_or_schedule_word");
  if (/(승인|approval|approve|deny|allow-once|allow-always)/i.test(input)) weakSignals.push("approval_word");
  if (/(매출|가격|수익|고객\s*이탈|전환율)/i.test(input)) weakSignals.push("revenue_or_growth_word");

  const signalBasis: string[] = [];
  const counterexampleGuards = [
    "가족이라는 단어만으로 가족 자산/부동산 판단으로 좁히지 않습니다.",
    "반복이라는 단어만으로 cron/자동화 생성 후보로 좁히지 않습니다.",
    "승인이라는 단어만으로 OpenClaw approval 문제로 좁히지 않습니다.",
    "매출이라는 단어만으로 외식업/다매장 운영 케이스로 좁히지 않습니다."
  ];
  const mustNot = [
    "약한 단어 하나로 도메인을 확정하지 않기",
    "모호한 요청을 실행/자동화/기억 승격으로 밀지 않기",
    "Messenger 표면에서 내부 분류명을 사용자 결론처럼 말하지 않기"
  ];

  let narrowClassification: ClassificationFailSoftProfile["narrowClassification"] = "hold";
  if (plan.conversationQualityGuard.fixture !== "general" && plan.conversationQualityGuard.fixture !== "artifact_request") {
    narrowClassification = "allowed";
    signalBasis.push(`conversation fixture: ${plan.conversationQualityGuard.fixture}`);
  }
  if (plan.operatingJudgment.delegation.level === "L5_repeated_automation_candidate") {
    narrowClassification = "allowed";
    signalBasis.push("scheduled/repeated automation signal with approval boundary");
  }
  if (plan.operatingJudgment.risk.strongApprovalRequired) {
    narrowClassification = "allowed";
    signalBasis.push("strong approval risk boundary");
  }
  if (plan.decisionHandleSurface.kind === "artifact" && weakSignals.length === 0) {
    narrowClassification = "allowed";
    signalBasis.push("explicit artifact request");
  }

  if (signalBasis.length === 0 && weakSignals.length > 0) {
    narrowClassification = "avoid";
    signalBasis.push(`weak signals only: ${weakSignals.slice(0, 4).join(", ")}`);
  }
  if (signalBasis.length === 0) {
    signalBasis.push("no narrow classification signal detected");
  }

  const messengerFallback = narrowClassification === "allowed"
    ? "현재 문장 기준으로는 좁은 후보로 볼 수 있지만, 실행·자동화·기억 승격은 별도 확인 전까지 하지 않습니다."
    : narrowClassification === "avoid"
      ? "지금 단어만으로는 특정 도메인이나 실행 후보로 확정하지 않고, 일반 판단으로 낮춰 보겠습니다."
      : "아직 분류를 확정하지 않고, 사용자의 목적과 필요한 다음 확인을 먼저 좁히겠습니다.";

  return {
    version: "0.5.1",
    mode: "guide_only",
    narrowClassification,
    signalBasis: signalBasis.slice(0, 5),
    counterexampleGuards,
    messengerFallback,
    mustNot
  };
}

function addRealitySignal(signals: RealitySignal[], signal: RealitySignal | undefined): void {
  if (!signal?.text?.trim()) return;
  const key = `${signal.label}:${signal.text}:${signal.source}`;
  if (signals.some((existing) => `${existing.label}:${existing.text}:${existing.source}` === key)) return;
  signals.push(signal);
}

function hasStatusEvidence(text: string): boolean {
  return /(OK|ready|running|passed|통과|정상|확인(?:했|됨)|검증(?:했|됨)|성공|완료\s*확인)/i.test(text);
}

function hasFailureEvidence(text: string): boolean {
  return /(failed|error|blocked|unavailable|실패|오류|막힘|무응답|응답\s*안|안\s*돼)/i.test(text);
}

export function buildRealitySignalMap(
  currentTurn: CurrentTurnPacket,
  sharedPlan: SharedTurnPlan,
  constraints: string[],
  judgmentFrame: JudgmentFrame
): RealitySignalMap {
  const signals: RealitySignal[] = [];

  addRealitySignal(signals, {
    label: "current_input",
    text: currentTurn.cleanInput,
    source: "user_input",
    strength: currentTurn.cleanInput ? "strong" : "unknown",
    realityClass: currentTurn.cleanInput ? "confirmed_fact" : "needs_verification",
    verified: Boolean(currentTurn.cleanInput),
    reason: "사용자가 이번 턴에 직접 제공한 입력입니다."
  });

  if (currentTurn.requestedOutputShape) {
    addRealitySignal(signals, {
      label: "requested_output_shape",
      text: currentTurn.requestedOutputShape,
      source: "runtime_plan",
      strength: "medium",
      realityClass: "runtime_inference",
      verified: false,
      reason: "현재 입력에서 추론한 요청 형식입니다."
    });
  }

  if (currentTurn.currentTarget) {
    addRealitySignal(signals, {
      label: "current_target",
      text: currentTurn.currentTarget,
      source: "runtime_plan",
      strength: currentTurn.currentTarget === "previous_assistant_answer" ? "medium" : "strong",
      realityClass: "runtime_inference",
      verified: currentTurn.currentTarget !== "previous_assistant_answer",
      reason: "현재 턴에서 다룰 대상으로 잡은 항목입니다."
    });
  }

  for (const constraint of constraints.slice(0, 6)) {
    addRealitySignal(signals, {
      label: "constraint",
      text: constraint,
      source: currentTurn.explicitConstraints.includes(constraint) ? "user_input" : "runtime_constraint",
      strength: currentTurn.explicitConstraints.includes(constraint) ? "strong" : "medium",
      realityClass: currentTurn.explicitConstraints.includes(constraint) ? "confirmed_fact" : "runtime_inference",
      verified: currentTurn.explicitConstraints.includes(constraint),
      reason: "답변과 실행 범위를 제한하는 신호입니다."
    });
  }

  for (const assumption of judgmentFrame.assumptionCandidates.slice(0, 4)) {
    addRealitySignal(signals, {
      label: "assumption_candidate",
      text: assumption,
      source: "assumption",
      strength: "weak",
      realityClass: "assumption",
      verified: false,
      reason: "확정 사실이 아니라 응답 품질을 위한 임시 가정입니다."
    });
  }

  if (hasStatusEvidence(currentTurn.cleanInput)) {
    addRealitySignal(signals, {
      label: "reported_status_evidence",
      text: firstSentence(currentTurn.cleanInput),
      source: "tool_or_status",
      strength: "medium",
      realityClass: "observed_signal",
      verified: false,
      reason: "상태 신호처럼 보이지만 현재 턴에서는 사용자 보고 또는 붙여넣은 출력으로만 다룹니다."
    });
  }

  if (hasFailureEvidence(currentTurn.cleanInput)) {
    addRealitySignal(signals, {
      label: "reported_failure_evidence",
      text: firstSentence(currentTurn.cleanInput),
      source: "tool_or_status",
      strength: "medium",
      realityClass: "observed_signal",
      verified: false,
      reason: "실패 신호가 있지만 실제 원인은 별도 확인 전까지 확정하지 않습니다."
    });
  }

  if (sharedPlan.requiresVerification || currentTurn.requestedOutputShape === "diagnosis") {
    addRealitySignal(signals, {
      label: "verification_needed",
      text: "검증 또는 진단이 필요한 요청입니다.",
      source: "verification_result",
      strength: "unknown",
      realityClass: "needs_verification",
      verified: false,
      reason: "완료나 원인을 단정하려면 추가 확인이 필요합니다."
    });
  }

  return {
    signals,
    strongSignals: signals.filter((signal) => signal.strength === "strong").map((signal) => signal.text),
    mediumSignals: signals.filter((signal) => signal.strength === "medium").map((signal) => signal.text),
    weakSignals: signals.filter((signal) => signal.strength === "weak").map((signal) => signal.text),
    unknownSignals: signals.filter((signal) => signal.strength === "unknown").map((signal) => signal.text)
  };
}

export function buildEvidenceLedger(signalMap: RealitySignalMap): EvidenceLedger {
  return {
    userProvided: signalMap.signals
      .filter((signal) => signal.source === "user_input")
      .map((signal) => signal.text),
    runtimeInferred: signalMap.signals
      .filter((signal) => signal.source === "runtime_plan" || signal.source === "runtime_constraint")
      .map((signal) => signal.text),
    toolVerified: signalMap.signals
      .filter((signal) => signal.verified && (signal.source === "tool_or_status" || signal.source === "verification_result"))
      .map((signal) => signal.text),
    assumptions: signalMap.signals
      .filter((signal) => signal.source === "assumption")
      .map((signal) => signal.text),
    needsVerification: signalMap.signals
      .filter((signal) => !signal.verified && (signal.strength === "unknown" || signal.source === "tool_or_status"))
      .map((signal) => signal.text)
  };
}

export function buildRealitySignalProfile(signalMap: RealitySignalMap, ledger: EvidenceLedger): RealitySignalProfile {
  const confirmedFacts = signalMap.signals
    .filter((signal) => signal.realityClass === "confirmed_fact")
    .map((signal) => signal.text);
  const observedSignals = signalMap.signals
    .filter((signal) => signal.realityClass === "observed_signal")
    .map((signal) => signal.text);
  const runtimeInferences = signalMap.signals
    .filter((signal) => signal.realityClass === "runtime_inference")
    .map((signal) => signal.text);
  const assumptions = signalMap.signals
    .filter((signal) => signal.realityClass === "assumption")
    .map((signal) => signal.text);
  const needsVerification = Array.from(
    new Set([
      ...ledger.needsVerification,
      ...signalMap.signals
        .filter((signal) => signal.realityClass === "needs_verification")
        .map((signal) => signal.text)
    ])
  );

  let claimPosture: RealityClaimPosture = "can_state";
  if (needsVerification.length > 0 && observedSignals.length > 0) claimPosture = "say_observed_only";
  else if (needsVerification.length > 0) claimPosture = "ask_or_verify_first";
  else if (runtimeInferences.length > 0 || assumptions.length > 0) claimPosture = "state_with_boundary";

  const answerGuidance = [
    "확정 사실, 관찰 신호, 런타임 추론, 임시 가정, 확인 필요를 섞지 않습니다.",
    "사용자가 제공한 현실은 존중하되, 사용자 보고만으로 원인이나 완료를 확정하지 않습니다."
  ];
  if (claimPosture === "say_observed_only") {
    answerGuidance.push("관찰된 증상과 가능한 범위까지만 말하고, 원인은 확인 경로와 함께 제시합니다.");
  } else if (claimPosture === "ask_or_verify_first") {
    answerGuidance.push("답변을 닫기 전에 무엇을 확인해야 하는지 한 가지로 좁힙니다.");
  } else if (claimPosture === "state_with_boundary") {
    answerGuidance.push("추론은 추론으로 표시하고, 판단이 바뀌는 조건을 남깁니다.");
  }

  return {
    version: "0.4.8",
    mode: "observer",
    claimPosture,
    confirmedFacts: Array.from(new Set(confirmedFacts)).slice(0, 8),
    observedSignals: Array.from(new Set(observedSignals)).slice(0, 8),
    runtimeInferences: Array.from(new Set(runtimeInferences)).slice(0, 8),
    assumptions: Array.from(new Set(assumptions)).slice(0, 8),
    needsVerification: Array.from(new Set(needsVerification)).slice(0, 8),
    answerGuidance: Array.from(new Set(answerGuidance)).slice(0, 5)
  };
}

function strongestSignalStrength(signalMap: RealitySignalMap): RealitySignalStrength {
  if (signalMap.strongSignals.length > 0) return "strong";
  if (signalMap.mediumSignals.length > 0) return "medium";
  if (signalMap.weakSignals.length > 0) return "weak";
  return "unknown";
}

export function checkClaimStrength(
  text: string,
  plan?: Pick<BeaiTurnPlan, "realitySignalMap" | "evidenceLedger" | "requiresVerification" | "operatingJudgment">
): ClaimStrengthCheck {
  const allowedClaimStrength = plan ? strongestSignalStrength(plan.realitySignalMap) : "unknown";
  const reasons: string[] = [];
  const hasStrongCompletionClaim =
    /(완료(?:했습니다|됐습니다|되었습니다|로 볼 수 있습니다)|해결(?:했습니다|됐습니다)|확실(?:합니다|히)|반드시|원인은\s*.+입니다)/i.test(text) ||
    /(설치\s*완료|정상\s*작동|작동\s*정상|완료\s*확인|확인(?:했습니다|됐습니다|되었습니다)|검증(?:했습니다|됐습니다|되었습니다)|통과(?:했습니다|됐습니다|되었습니다))/i.test(text);
  const lacksToolVerification = !plan || plan.evidenceLedger.toolVerified.length === 0;
  const needsVerification = Boolean(plan?.requiresVerification || plan?.evidenceLedger.needsVerification.length);
  const claimLabel = plan?.operatingJudgment?.claim.label;
  const operatingAllowsComplete = claimLabel === "complete";

  if (hasStrongCompletionClaim && (!operatingAllowsComplete || lacksToolVerification || needsVerification)) {
    reasons.push("검증 근거가 부족한 상태에서 완료/해결/원인 단정 표현이 감지됐습니다.");
    if (claimLabel && claimLabel !== "complete") {
      reasons.push(`v0.4 operating claim label is ${claimLabel}, so the surface claim must stay below complete.`);
    }
  }

  return {
    allowedClaimStrength,
    overclaimRisk: reasons.length > 0,
    reasons,
    rewriteInstruction:
      reasons.length > 0
        ? "완료/해결/원인 단정 대신 확인된 범위와 아직 확인되지 않은 범위를 분리합니다."
        : undefined
  };
}

export function checkSourceBoundary(text: string, plan?: Pick<BeaiTurnPlan, "evidenceLedger">): SourceBoundaryCheck {
  const riskyPhrases: string[] = [];
  const claimsUserProvidedMaterial = /(사용자(?:가)?\s*(?:제공(?:한)?|붙여(?:준)?|가져온)\s*(?:자료|문서|파일|링크)|당신이\s*(?:제공(?:한)?|붙여준|가져온)\s*(?:자료|문서|파일|링크))/i.test(text);
  const hasUserProvidedMaterial = Boolean(plan?.evidenceLedger.userProvided.some((item) => /(파일|문서|링크|자료|첨부|붙여)/i.test(item)));
  if (claimsUserProvidedMaterial && !hasUserProvidedMaterial) {
    riskyPhrases.push("사용자가 제공한 자료");
  }

  return {
    sourceBoundaryRisk: riskyPhrases.length > 0,
    riskyPhrases,
    rewriteInstruction:
      riskyPhrases.length > 0
        ? "사용자가 제공한 자료라고 단정하지 말고, 현재 확인 가능한 입력 또는 별도 확인이 필요한 자료로 표현합니다."
        : undefined
  };
}

function softenOverclaimingLanguage(text: string, plan?: BeaiTurnPlan): string {
  const claimCheck = checkClaimStrength(text, plan);
  const sourceCheck = checkSourceBoundary(text, plan);
  let rewritten = text;

  if (claimCheck.overclaimRisk) {
    rewritten = rewritten
      .replace(/설치\s*완료했습니다/g, "설치 작업을 진행했습니다")
      .replace(/설치\s*완료됐습니다/g, "설치 작업이 진행된 상태입니다")
      .replace(/설치\s*완료되었습니다/g, "설치 작업이 진행된 상태입니다")
      .replace(/완료했습니다/g, "진행했습니다")
      .replace(/완료됐습니다/g, "진행된 상태입니다")
      .replace(/완료되었습니다/g, "진행된 상태입니다")
      .replace(/완료\s*확인/g, "진행 상태 확인")
      .replace(/해결했습니다/g, "확인 범위를 좁혔습니다")
      .replace(/해결됐습니다/g, "확인 범위가 좁혀진 상태입니다")
      .replace(/정상\s*작동합니다/g, "작동 신호가 있는 상태입니다")
      .replace(/정상\s*작동 중입니다/g, "작동 신호가 있는 상태입니다")
      .replace(/작동\s*정상입니다/g, "작동 신호가 있는 상태입니다")
      .replace(/확인했습니다/g, "확인 범위를 좁혔습니다")
      .replace(/확인됐습니다/g, "확인 범위가 좁혀진 상태입니다")
      .replace(/확인되었습니다/g, "확인 범위가 좁혀진 상태입니다")
      .replace(/검증했습니다/g, "검증을 진행했습니다")
      .replace(/검증됐습니다/g, "검증된 신호가 있습니다")
      .replace(/검증되었습니다/g, "검증된 신호가 있습니다")
      .replace(/통과했습니다/g, "통과 신호가 있습니다")
      .replace(/통과됐습니다/g, "통과 신호가 있습니다")
      .replace(/통과되었습니다/g, "통과 신호가 있습니다")
      .replace(/확실합니다/g, "현재 확인된 범위에서는 그렇게 볼 수 있습니다");
    if (!/확인(?:된|한)|아직|다음 확인|검증/.test(rewritten)) {
      const nextCheck = plan?.evidenceLedger.needsVerification[0] || "실제 결과";
      rewritten = `${rewritten.trim()}\n\n아직 확인이 필요한 부분은 ${nextCheck}입니다.`;
    }
  }

  if (sourceCheck.sourceBoundaryRisk) {
    rewritten = rewritten.replace(/사용자(?:가)?\s*(?:제공(?:한)?|붙여(?:준)?|가져온)\s*(?:자료|문서|파일|링크)/g, "현재 확인 가능한 입력");
    rewritten = rewritten.replace(/당신이\s*(?:제공(?:한)?|붙여준|가져온)\s*(?:자료|문서|파일|링크)/g, "현재 확인 가능한 입력");
  }

  return rewritten;
}

function hasInterpersonalSycophancyRisk(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const harmfulAction = /(공개적으로|공개\s*망신|망신|창피|쪽팔|보복|응징|참교육|혼내|압박|까발|비난|공격|눌러야|몰아붙|혼쭐)/i.test(normalized);
  if (!harmfulAction) return false;
  const overAgreement = /(맞습니다|맞아요|당연히|무조건|확실히|상대가\s*틀렸|그렇게\s*해야|해도\s*됩니다|정당합니다|눌러야\s*합니다|망신(?:을)?\s*줘야)/i.test(normalized);
  return overAgreement;
}

function softenInterpersonalSycophancyLanguage(text: string): string {
  if (!hasInterpersonalSycophancyRisk(text)) return text;
  let rewritten = text
    .replace(/^(네,\s*)?맞습니다[.!]?/i, "그렇게 단정하긴 이릅니다.")
    .replace(/^(네,\s*)?맞아요[.!]?/i, "그렇게 단정하긴 이릅니다.")
    .replace(/당연히\s*/gi, "")
    .replace(/무조건\s*/gi, "")
    .replace(/공개적으로\s*망신(?:을)?\s*줘야\s*합니다/gi, "공개적으로 망신 주는 방식은 피해야 합니다")
    .replace(/공개적으로\s*눌러야\s*합니다/gi, "공개적으로 압박하는 방식은 피해야 합니다")
    .replace(/보복해야\s*합니다/gi, "보복으로 대응하는 방식은 피해야 합니다");
  if (!/(감정|행동|분리|비공개|기록|사실)/.test(rewritten)) {
    rewritten = `${rewritten.trim()}\n\n대인관계 문제에서는 감정의 타당성과 실제 행동을 분리해야 합니다. 공개 망신이나 보복보다 사실 확인, 비공개 피드백, 재발 방지 기준으로 옮기는 편이 안전합니다.`;
  }
  return rewritten;
}

function hasHighStakesSurfaceContext(plan?: BeaiTurnPlan): boolean {
  if (!plan) return false;
  const input = plan.currentTurn.cleanInput;
  return (
    plan.inputLevelCompanion.trustCalibrationNeed === "strong" ||
    plan.inputLevelCompanion.controlBoundaryNeeded ||
    /(고객|외부|공개|전송|보내|게시|트위터|twitter|notion|노션|계약|결제|환불|공문|법적|해지|메모리|memory|기억|저장|자동\s*저장|배포|zip|설치|정상|doctor|gateway|telegram|의학|의료|약|복용|치료|진단|cron|크론|예약|자동\s*발송|앱|웹앱|사이트|완성|스킬|에이전트)/i.test(input)
  );
}

function softenUnverifiedActionAndHighStakesClaims(text: string, plan?: BeaiTurnPlan): string {
  if (!hasHighStakesSurfaceContext(plan)) return text;
  let rewritten = text;
  const before = rewritten;

  rewritten = rewritten
    .replace(/자동\s*저장을\s*(?:켰습니다|활성화했습니다|설정했습니다)/g, "자동 저장을 켰다고 단정할 수 없습니다")
    .replace(/메모리\s*저장을\s*(?:켰습니다|활성화했습니다|설정했습니다)/g, "메모리 저장을 켰다고 단정할 수 없습니다")
    .replace(/메모리에\s*저장했습니다/g, "메모리에 저장됐다고 단정할 수 없습니다")
    .replace(/기억(?:으로)?\s*저장했습니다/g, "기억으로 저장됐다고 단정할 수 없습니다")
    .replace(/(?:notion|노션)에\s*페이지(?:를)?\s*(?:만들었습니다|생성했습니다|올렸습니다)/gi, "노션 페이지가 생성됐다고 단정할 수 없습니다")
    .replace(/노션\s*페이지(?:를)?\s*(?:만들었습니다|생성했습니다|올렸습니다)/g, "노션 페이지가 생성됐다고 단정할 수 없습니다")
    .replace(/(?:cron|크론)(?:을)?\s*(?:등록했습니다|만들었습니다|예약했습니다)/gi, "cron 후보로 볼 수 있지만 자동 실행 등록은 확인이 필요합니다")
    .replace(/등록했습니다\.\s*내일부터\s*자동\s*발송됩니다\.?/g, "자동 발송이 등록됐다고 단정할 수 없습니다. cron 후보로 두고 수동 검증과 승인 후 진행해야 합니다.")
    .replace(/예약했습니다/g, "예약했다고 단정할 수 없습니다")
    .replace(/등록했습니다/g, "등록했다고 단정할 수 없습니다")
    .replace(/내일부터\s*보내겠습니다/g, "내일부터 보낸다고 단정할 수 없습니다")
    .replace(/매일\s*실행됩니다/g, "매일 실행된다고 단정할 수 없습니다")
    .replace(/자동\s*발송됩니다/g, "자동 발송된다고 단정할 수 없습니다")
    .replace(/앱이\s*완성됐습니다/g, "앱이 완성됐다고 단정할 수 없습니다")
    .replace(/앱이\s*완성되었습니다/g, "앱이 완성됐다고 단정할 수 없습니다")
    .replace(/웹앱\s*완성/g, "웹앱 완성 여부는 실행 검증이 필요합니다")
    .replace(/화면\s*확인\s*완료/g, "화면 확인 여부는 실제 렌더링 검증이 필요합니다")
    .replace(/(?:전부|모두)\s*정상입니다/g, "현재 확인된 범위에서는 정상 신호가 있습니다")
    .replace(/문제\s*없습니다/g, "현재 확인된 범위에서는 뚜렷한 문제 신호가 보이지 않습니다")
    .replace(/문제없이\s*설치됩니다/g, "설치 가능성은 있지만 실제 사용자 환경 검증이 필요합니다")
    .replace(/문제없이\s*작동합니다/g, "작동 가능성은 있지만 실제 동작 검증이 필요합니다")
    .replace(/(?:보냈습니다|전송했습니다|발송했습니다)/g, "전송했다고 단정할 수 없습니다")
    .replace(/(?:게시했습니다|올렸습니다|공개했습니다)/g, "게시했다고 단정할 수 없습니다")
    .replace(/삭제했습니다/g, "삭제했다고 단정할 수 없습니다")
    .replace(/적용했습니다/g, "적용 작업을 진행한 것으로만 표현해야 합니다")
    .replace(/네,\s*먹어도\s*됩니다\.?/gi, "복용 여부는 이 대화만으로 단정하면 안 되며 전문가나 처방 기준 확인이 필요합니다.")
    .replace(/먹어도\s*됩니다\.?/gi, "복용 여부는 전문가나 처방 기준 확인 전에는 단정하면 안 됩니다.")
    .replace(/가능합니다\.?/g, "가능할 수 있지만 조건 확인이 필요합니다.");

  const changed = rewritten !== before;
  if (changed && !/(확인|검증|전문가|승인|실제|조건)/.test(rewritten)) {
    rewritten = `${rewritten.trim()}\n\n실제 전송·게시·저장·적용 여부는 확인이나 사용자 승인 없이는 단정하지 않습니다.`;
  }
  return rewritten;
}

function softenChoiceDominationLanguage(text: string, plan?: BeaiTurnPlan): string {
  if (!plan || plan.inputLevelCompanion.choiceOwnershipRisk === "low") return text;
  if (!/(무조건|정답은|볼\s*필요\s*없|그냥\s+.+로\s+가|하나만\s*보면|선택지는\s*없)/i.test(text)) return text;
  let rewritten = text
    .replace(/무조건\s*/gi, "현재 기준만 놓고 보면 ")
    .replace(/정답은\s*/gi, "현재 우선 후보는 ")
    .replace(/개인용은\s*볼\s*필요\s*없습니다\.?/gi, "개인용은 조건이 맞을 때 다시 비교할 수 있습니다.")
    .replace(/볼\s*필요\s*없습니다\.?/gi, "지금은 우선순위가 낮지만 조건이 바뀌면 다시 볼 수 있습니다.")
    .replace(/그냥\s+(.+?)로\s+가세요\.?/gi, "현재 근거만 보면 $1 쪽이 우선입니다.")
    .replace(/하나만\s*보면\s*됩니다\.?/gi, "우선 후보를 하나로 둘 수는 있지만, 결정 기준은 남겨야 합니다.");
  if (!/(기준|조건|비교|선택권|우선)/.test(rewritten)) {
    rewritten = `${rewritten.trim()}\n\n결정은 사용자의 목적, 감당 가능한 비용, 검증 신호를 놓고 선택해야 합니다.`;
  }
  return rewritten;
}

type SkillRoutingInput = {
  currentInput: string;
  mode: BeaiMode;
  primaryClass: SharedTurnPlan["primaryClass"];
  riskLevel: "low" | "medium" | "high";
  requiresUserConfirmation: boolean;
  roleSignals: NonNullable<SharedTurnPlan["roleSignals"]>;
};

function pushSkillCandidate(
  candidates: SkillRoutingCandidate[],
  candidate: SkillRoutingCandidate
): void {
  if (candidates.some((item) => item.id === candidate.id)) return;
  candidates.push(candidate);
}

function confidenceFromScore(score: number): SkillRoutingCandidate["confidence"] {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function inferSkillRoutingAction(input: SkillRoutingInput, score: number): SkillRoutingAction {
  if (input.requiresUserConfirmation || input.riskLevel === "high") return "needs_user_approval";
  if (score >= 70 && input.mode !== "conversation") return "recommend_use";
  return "hold_candidate";
}

function normalizeSkillRoutingText(value: string): string {
  let text = value || "";
  const userUtteranceMatch = text.match(/사용자\s*발화\s*:\s*([\s\S]+)/i);
  if (userUtteranceMatch?.[1]?.trim()) {
    text = userUtteranceMatch[1];
  }

  return text
    .split(/\r?\n/)
    .filter((line) => {
      const normalized = line.trim();
      if (!normalized) return false;
      if (/^스킬\s*라이브\s*테스트/i.test(normalized)) return false;
      if (/아래\s*사용자\s*발화/i.test(normalized)) return false;
      if (/마지막에\s*사용(?:한|된)\s*스킬/i.test(normalized)) return false;
      if (/사용(?:한|된)\s*스킬(?:과|을)?/i.test(normalized)) return false;
      if (/판단\s*기준(?:을|과)?\s*짧게\s*표시/i.test(normalized)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

function isMetaOnlySkillSignal(text: string): boolean {
  const stripped = text
    .replace(/스킬\s*라이브\s*테스트/gi, "")
    .replace(/사용(?:한|된)\s*스킬/gi, "")
    .replace(/판단\s*기준/gi, "")
    .replace(/아래\s*사용자\s*발화/gi, "")
    .trim();
  return stripped.length === 0;
}

function hasExplicitSkillCreationSignal(text: string): boolean {
  return /(스킬\s*(?:만들|제작|생성|수정|보강|업그레이드|후보|패키지|팩|설계|검토)|skill\s*(?:create|build|author|pack|candidate|proposal|workshop)|routing\s*plane|라우팅\s*(?:후보|설계|검토)|workflow\s*(?:candidate|proposal))/i.test(text);
}

function hasWorkflowCandidateSignal(text: string): boolean {
  return /(반복(?:되는)?\s*(?:작업|업무|일)|절차화|워크플로(?:우)?\s*(?:후보|설계|정리)|workflow\s*(?:candidate|design|plan)|수동\s*실행|manual\s*(?:test|workflow))/i.test(text);
}

function uniqueOperatingRiskFamilies(values: OperatingRiskFamily[]): OperatingRiskFamily[] {
  return Array.from(new Set(values));
}

function includesOperatingSignal(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function classifyOperatingRiskFamilies(input: OperatingJudgmentInput): OperatingRiskFamily[] {
  const text = String(input.currentInput || "").toLowerCase();
  const families: OperatingRiskFamily[] = [];
  const readOnlyAutomation = hasReadOnlyAutomationInspectionSignal(text);
  const readOnlyTelegram = hasReadOnlyTelegramStatusSignal(text);
  const readOnlyNotion = hasReadOnlyNotionSignal(text);
  const lowRiskPreparation = hasLowRiskPreparationSignal(text);
  const installInspectionOnly =
    lowRiskPreparation &&
    /(zip|압축|패키지|package|manifest|매니페스트|checksum|체크섬|forbidden|dry[-\s]?run|드라이런)/i.test(text) &&
    !/(실제\s*설치|설치해줘|설치해|깔아줘|적용해줘|교체해줘|업그레이드해줘|apply\s*install|install\s*now)/i.test(text);

  if (!readOnlyTelegram && !readOnlyNotion && !hasDraftOnlyExternalArtifactSignal(text) && (hasExternalWriteSignal(text) || includesOperatingSignal(text, /(외부\s*발송|외부\s*전송|external[_\s-]?send|send\s+to|email|이메일|메일\s*보내|(?:slack|슬랙).{0,50}(?:보내|공유|전송|올려|게시|공지)|(?:discord|디스코드).{0,50}(?:보내|공유|전송|올려|게시)|(?:whatsapp|왓츠앱).{0,50}(?:보내|공유|전송)|(?:telegram|텔레그램).{0,40}(?:보내|공유|전송|발송|단체방|채널|올려|게시)|tweet|twitter|트위터|(?:^|[^a-z])x에.{0,40}(?:올려|게시|트윗)|엑스에.{0,40}(?:올려|게시|트윗)|public\s*post|공개\s*게시|블로그\s*올려|팀원(?:들)?에게\s*(?:보내|공유|전송|발송)|고객(?:에게)?.{0,50}(?:보내|답장|전송|발송|자동\s*답장)|notion.{0,50}(?:올려|페이지\s*(?:생성|만들|작성|수정)|작성|보고서|만들|업로드)|노션.{0,50}(?:올려|페이지\s*(?:생성|만들|작성|수정)|작성|보고서|만들|업로드)|github(?:에)?\s*(?:issue|이슈|pr|comment|댓글).{0,30}(?:등록|열어|작성|올려|달아|만들)|(?:issue|이슈)\s*(?:등록|열어|작성|올려))/i))) {
    families.push("external_send");
  }
  if (hasDestructiveRewriteSignal(text) || includesOperatingSignal(text, /(삭제|지워|delete|remove|rm\s+-rf|git\s+reset\s+--hard|destructive)/i)) {
    families.push("delete");
  }
  if (!installInspectionOnly && includesOperatingSignal(text, /(설치|install|plugin\s+install|패키지\s*적용|라이브\s*적용)/i)) {
    families.push("install");
  }
  if (includesOperatingSignal(text, /(재시작|restart|gateway\s+restart|launchctl|service\s+restart)/i)) {
    families.push("restart");
  }
  if (hasMoneyMovementSignal(text) || includesOperatingSignal(text, /(결제|payment|purchase|checkout|주문|pay\b)/i)) {
    families.push("payment");
  }
  if (includesOperatingSignal(text, /(submit|제출|폼\s*제출|예약\s*확정|confirm\s+reservation|order\s+button|주문\s*버튼|구매\s*버튼|checkout\s*button|cart\s*submit|place\s*order)/i)) {
    families.push("browser_submit");
  }
  if (includesOperatingSignal(text, /(device|camera|screen|마이크|카메라|스크린|화면|기기\s*설정|폰\s*제어|phone\s+control)/i)) {
    families.push("device_action");
  }
  if (!readOnlyAutomation && (includesOperatingSignal(text, SCHEDULE_AUTOMATION_PATTERN) || hasRetryPolicySignal(text))) {
    families.push("cron_creation");
  }
  if (hasOpenClawCoreMutationSignal(text) || includesOperatingSignal(text, /(권한|permission|allowlist|승인\s*정책|policy|credential|자격|token|토큰|회원가입|로그인|사용자\s*데이터|개인정보|DB|database|auth|배포|deploy|실서버|인터넷에\s*올려)/i)) {
    families.push("permission_change");
  }
  if (hasAutomaticMemorySignal(text) || includesOperatingSignal(text, /(장기\s*기억|durable\s*memory|memory\s*write|기억으로\s*저장|accepted\s*memory|메모리\s*승격|모든\s*대화.{0,30}(?:기억|저장)|자동으로.{0,20}(?:기억|메모리|memory)|전부\s*저장|항상\s*기억|이슈\s*장부|오류\s*기록|품질\s*장부)/i)) {
    families.push("durable_memory_write");
  }
  if (includesOperatingSignal(text, /((?:버전|version).{0,32}(?:올려|상향|변경|맞춰|업데이트|bump)|v?\d+\.\d+\.\d+(?:로|으로)?\s*(?:올려|상향|변경|맞춰|업데이트)|version\s*bump|버전\s*범프)/i)) {
    families.push("permission_change");
  }

  if (input.toolRisk?.riskLevel === "high") {
    for (const reason of input.toolRisk.reasons) {
      if (/external|message delivery/i.test(reason)) families.push("external_send");
      if (/destructive|deletion|removal/i.test(reason)) families.push("delete");
      if (/scheduler|service|gateway|plugin lifecycle/i.test(reason)) families.push("restart");
      if (/sensitive derived path/i.test(reason)) families.push("permission_change");
    }
  }

  return uniqueOperatingRiskFamilies(families);
}

export function classifyOperatingStateHygieneClasses(input: OperatingJudgmentInput): OperatingStateHygieneClass[] {
  const text = String(input.currentInput || "").toLowerCase();
  const classes: OperatingStateHygieneClass[] = [];
  const push = (item: OperatingStateHygieneClass) => {
    if (!classes.includes(item)) classes.push(item);
  };

  if (/(memory|메모리|기억|장기\s*기억|기억\s*후보)/i.test(text)) push("memory");
  if (/(agreement|합의|원칙|기준|accepted\s*rule|결정\s*기준)/i.test(text)) push("agreement");
  if (/(project\s*state|프로젝트\s*상태|현재\s*기준|rollback|baseline|버전\s*기준)/i.test(text)) push("project_state");
  if (/(session|세션|continuity|이어|handoff|압축|compaction)/i.test(text)) push("session_continuity");
  if (/(task|queued|running|historical\s*issue|작업\s*상태|태스크)/i.test(text)) push("task_history");
  if (/(transcript|대화창|표면|오염|residue|내부\s*문구|system\s*(message|request)|시스템\s*(요청|문구|메시지))/i.test(text)) push("transcript_residue");
  if (/(tool\s*failure|도구\s*실패|command\s*failed|error|오류|실패)/i.test(text)) push("tool_failure_residue");
  if (!hasSameScopeApprovalContinuationSignal(text) && /(approval|승인|allow-once|deny|plugin approval|codex_command_approval)/i.test(text)) push("approval_residue");

  return classes;
}

export function classifyOperatingDelegationCandidate(input: OperatingJudgmentInput): {
  candidate: OperatingDelegationCandidate;
  reasons: string[];
} {
  const text = String(input.currentInput || "");
  const normalized = text.toLowerCase();
  const riskFamilies = classifyOperatingRiskFamilies(input);
  const reasons: string[] = [];

  if (hasReadOnlyAutomationInspectionSignal(text) || hasReadOnlyTelegramStatusSignal(text) || hasReadOnlyNotionSignal(text)) {
    return { candidate: "direct_answer", reasons: ["read-only inspection stays out of mutation routing"] };
  }
  if (hasSkillDescriptionArtifactSignal(text)) {
    return { candidate: "direct_answer", reasons: ["skill description editing is an artifact request, not skill lifecycle routing"] };
  }
  if (hasExplicitRoutingNegationSignal(text)) {
    return { candidate: "direct_answer", reasons: ["explicitly negated skill/agent/automation creation"] };
  }
  if (/(하지\s*마|하지말|do\s*not\s*do|금지|보류|멈춰|stop)/i.test(text)) {
    return { candidate: "do_not_do", reasons: ["input contains explicit hold or do-not-do signal"] };
  }
  if (/(proposal.{0,12}(?:승인|적용|폐기|반려|reject|apply)|제안.{0,12}(?:승인|적용|폐기|반려)|스킬.{0,16}(?:적용|승인|폐기|반려|격리)|롤백|되돌려|원복|복구|이전\s*버전으로)/i.test(text) || hasVersionMutationSignal(text)) {
    return { candidate: "approval_required", reasons: ["lifecycle mutation or rollback requires explicit user review"] };
  }
  if (input.requiresUserConfirmation || input.riskLevel === "high" || riskFamilies.length > 0 || hasRetryPolicySignal(text) || hasDestructiveRewriteSignal(text) || hasOpenClawCoreMutationSignal(text)) {
    reasons.push("risk or approval boundary detected");
    return { candidate: "approval_required", reasons };
  }
  if (hasScheduledWorkSignal(text)) {
    return { candidate: "automation_candidate", reasons: ["input asks about repeated or scheduled automation"] };
  }
  if (hasAgentCandidateSignal(text)) {
    return { candidate: "agent_candidate", reasons: ["input asks about separate responsibility or persistent agent context"] };
  }
  if (hasSkillLifecycleSignal(text)) {
    return { candidate: "skill_candidate", reasons: ["input asks for skill creation/update/lifecycle handling"] };
  }
  if (hasDurableProcedureSignal(text) || /(workflow|워크플로|절차화|프로세스화|pipeline|파이프라인)/i.test(normalized)) {
    return { candidate: "workflow_candidate", reasons: ["input asks for a repeatable workflow shape"] };
  }
  if (/(agent|에이전트|전담|독립\s*역할|맡겨|위임|delegate)/i.test(normalized)) {
    return { candidate: "agent_candidate", reasons: ["input asks about delegation to an agent-like role"] };
  }
  if (/(skill|스킬|능력팩|capability|반복\s*절차|검증\s*절차)/i.test(normalized)) {
    return { candidate: "skill_candidate", reasons: ["input asks for a reusable skill or capability"] };
  }
  if (/(애매|모호|불명확|모르겠|unclear|not\s*sure)/i.test(normalized)) {
    return { candidate: "hold", reasons: ["input is not clear enough to delegate"] };
  }
  return { candidate: "direct_answer", reasons: ["no delegation or elevated risk signal detected"] };
}

export function classifyOperatingDelegationLevel(input: OperatingJudgmentInput): OperatingDelegationLevel {
  const candidate = classifyOperatingDelegationCandidate(input).candidate;
  const riskFamilies = classifyOperatingRiskFamilies(input);
  const strongRisk = riskFamilies.some((family) =>
    ["external_send", "delete", "payment", "browser_submit", "device_action", "permission_change", "durable_memory_write"].includes(family)
  );
  if (candidate === "do_not_do" || strongRisk) return "L6_high_risk_strong_approval";
  if (candidate === "automation_candidate" || riskFamilies.includes("cron_creation")) return "L5_repeated_automation_candidate";
  if (candidate === "approval_required") return "L4_execute_after_approval";
  if (candidate === "workflow_candidate" || candidate === "agent_candidate") return "L3_internal_proposal";
  if (candidate === "skill_candidate") return "L2_review_or_organize";
  if (/(초안|draft|문안|제안문)/i.test(input.currentInput)) return "L1_draft_only";
  return "L0_answer_only";
}

function hasLowRiskPreparationSignal(text: string): boolean {
  return /(상태\s*점검|점검|진단|doctor|check|verify|검증|dry[-\s]?run|드라이런|읽|확인|로그|목록|list|조회|테스트|test|zip.{0,20}검사|설치\s*zip.{0,20}확인|checksum|체크섬|manifest|매니페스트|후보|계획|plan|보고서|report|문서\s*정리|범위\s*식별|BEAI-owned\s*범위|비아이.{0,12}범위)/i.test(
    text
  );
}

function hasBeaiOwnedScopeSignal(text: string): boolean {
  return /(BEAI[-\s]?owned|비아이\s*소유|비아이레이어만|BEAI\s*Layer\s*only|beai-runtime|BEAI\s*Runtime|비아이\s*런타임|비아이\s*닥터|beai\s*doctor|비아이.{0,12}캐시|beai.{0,12}cache|quarantine|격리|백업|rollback|롤백)/i.test(
    text
  );
}

function hasActualMutationSignal(text: string): boolean {
  return /(삭제|영구\s*제거|제거|지워|덮어쓰기|overwrite|write|수정|변경|바꿔|바꾸|change|교체|설치|install|적용|등록|생성|업데이트|update|upgrade|재시작|restart|발송|보내|게시|올려|결제|cron|크론|agent|에이전트|권한|permission|memory|메모리)/i.test(
    text
  );
}

function hasHighRiskExecutionSurfaceRequest(text: string): boolean {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!hasActualMutationSignal(normalized)) return false;
  if (hasExplicitRoutingNegationSignal(normalized)) return false;
  if (/(어떻게|뭐야|무엇|설명|개념|가능|할\s*수|될지|판단|검토|후보|계획|초안|dry[-\s]?run|드라이런|확인만|조회만|상태만|목록만)/i.test(normalized)) {
    return false;
  }
  return /(해줘|해|바꿔|수정해|변경해|지워|삭제|설치|적용|등록|생성|올려|보내|발송|실행|눌러|submit|restart|재시작|켜줘|꺼줘|만들어)/i.test(
    normalized
  );
}

function isStrongApprovalRiskFamily(family: OperatingRiskFamily): boolean {
  return ["external_send", "delete", "payment", "browser_submit", "device_action", "permission_change", "durable_memory_write"].includes(family);
}

function inferApprovalActionSummary(text: string, risks: OperatingRiskFamily[]): string {
  if (risks.includes("external_send")) return "외부 채널로 메시지나 콘텐츠를 보내기";
  if (risks.includes("delete")) return "파일 또는 기존 설치 항목 삭제/제거";
  if (risks.includes("payment")) return "결제, 송금, 주문 같은 비용 발생 가능 작업";
  if (risks.includes("browser_submit")) return "브라우저 제출/확정 버튼 실행";
  if (risks.includes("cron_creation")) return "cron 또는 반복 자동 실행 등록";
  if (risks.includes("permission_change")) return "설정, 권한, 버전, OpenClaw 관련 변경";
  if (risks.includes("durable_memory_write")) return "장기 기억 또는 사용자 데이터 저장";
  if (risks.includes("install")) return "BEAI Layer 설치 또는 교체";
  if (risks.includes("restart")) return "서비스 또는 Gateway 재시작";
  if (hasLowRiskPreparationSignal(text)) return "읽기/점검/dry-run/후보안 작성";
  return "요청한 작업 범위 처리";
}

function inferApprovalImpactScope(text: string, risks: OperatingRiskFamily[], level: ApprovalErgonomicsLevel): string {
  if (level === "auto_allowed") return "읽기 전용 점검, dry-run, 후보안 또는 보고서 범위";
  if (hasBeaiOwnedScopeSignal(text)) return "BEAI Layer 소유 파일 또는 BEAI Runtime 설치 범위";
  if (risks.includes("external_send")) return "외부 채널, 고객/팀원 메시지, 공개 게시 범위";
  if (risks.includes("permission_change")) return "OpenClaw 설정, 권한, 버전, 배포 또는 런타임 설정 범위";
  if (risks.includes("durable_memory_write")) return "사용자 memory, 장기 기억, 프로젝트 상태 파일 범위";
  if (risks.includes("cron_creation")) return "OpenClaw cron/automation 등록 상태";
  return "변경 대상 파일, 설정, 실행 상태";
}

function inferApprovalDoesNotTouch(text: string, risks: OperatingRiskFamily[], level: ApprovalErgonomicsLevel): string {
  if (level === "auto_allowed") return "파일 변경, 외부 발송, cron/agent 등록, 설정 변경";
  if (hasBeaiOwnedScopeSignal(text) && !risks.includes("permission_change") && !risks.includes("restart")) {
    return "OpenClaw core, 사용자 memory, Telegram/Gateway 설정, cron, agent";
  }
  return "승인 범위 밖의 OpenClaw core, 사용자 memory, Telegram/Gateway, cron/agent";
}

function inferApprovalRecovery(text: string, level: ApprovalErgonomicsLevel): string {
  if (level === "auto_allowed") return "변경이 없으므로 복구 대상 없음";
  if (hasBeaiOwnedScopeSignal(text)) return "백업 또는 quarantine 폴더에서 되돌림";
  return "실행 전 백업/롤백 가능성을 확인해야 함";
}

export function buildApprovalErgonomicsProfile(input: OperatingJudgmentInput, report: Pick<BeaiOperatingJudgmentReport, "risk" | "delegation">): BeaiOperatingJudgmentReport["approvalErgonomics"] {
  const text = String(input.currentInput || "");
  const risks = report.risk.families;
  const lowRiskPreparation = hasLowRiskPreparationSignal(text);
  const sameScopeContinuation = hasSameScopeApprovalContinuationSignal(text);
  const beaiOwnedScope = hasBeaiOwnedScopeSignal(text);
  const actualMutation = hasActualMutationSignal(text);
  const hasStrongRisk = report.risk.strongApprovalRequired || risks.some(isStrongApprovalRiskFamily);
  const hasRisk = report.risk.approvalRequired || risks.length > 0;

  let level: ApprovalErgonomicsLevel = "auto_allowed";
  let riskTransition: ApprovalRiskTransition = sameScopeContinuation ? "same_scope_continuation" : lowRiskPreparation ? "low_risk_preparation" : "none";

  if (sameScopeContinuation && !hasRisk) {
    level = "auto_allowed";
    riskTransition = "same_scope_continuation";
  } else if (hasStrongRisk || (hasRisk && actualMutation)) {
    level = "approval_required";
    riskTransition = "high_risk_mutation";
  } else if (beaiOwnedScope && actualMutation) {
    level = "conditional_allowed";
    riskTransition = "beai_owned_reversible_change";
  } else if (hasRisk) {
    level = "approval_required";
    riskTransition = "high_risk_mutation";
  }

  const shouldAskUserNow = level === "approval_required";
  const shouldProceedWithoutInterruption = level !== "approval_required";
  const afterActionReportRequired = level !== "approval_required" || (beaiOwnedScope && actualMutation);
  const action = inferApprovalActionSummary(text, risks);

  return {
    level,
    riskTransition,
    shouldAskUserNow,
    shouldProceedWithoutInterruption,
    afterActionReportRequired,
    bundleSamePurposeSteps: true,
    approvalSummary: {
      action,
      impactScope: inferApprovalImpactScope(text, risks, level),
      doesNotTouch: inferApprovalDoesNotTouch(text, risks, level),
      recovery: inferApprovalRecovery(text, level),
      decision: shouldAskUserNow ? "승인 필요" : level === "conditional_allowed" ? "조건 충족 시 자동 진행 후 보고" : "승인 없이 진행 후 필요 시 보고"
    },
    guidance:
      level === "approval_required"
        ? [
            "실제 손실, 노출, 비용, 복구 어려운 변경이 생기는 위험 전환점에서만 멈춥니다.",
            "승인 요청은 하려는 일, 영향 범위, 제외 범위, 복구 방법, 진행 여부만 짧게 보여줍니다.",
            "같은 목적과 같은 영향 범위의 세부 단계는 하나의 승인 묶음으로 다룹니다."
          ]
        : level === "conditional_allowed"
          ? [
              "BEAI-owned 범위가 확인되고 백업/롤백 경로가 있으면 세부 단계마다 멈추지 않습니다.",
              "OpenClaw core, Telegram/Gateway, memory, cron, agent 범위가 섞이면 승인 필요로 올립니다.",
              "작업 후에는 무엇을 처리했고 어떻게 되돌릴 수 있는지 짧게 보고합니다."
            ]
          : [
              "읽기, 점검, 로그 확인, dry-run, checksum, 후보안 작성은 기본적으로 멈추지 않습니다.",
              "실제 변경 전환점이 생기면 그때 승인 필요로 올립니다.",
              "저위험 준비 작업은 사후 보고 또는 결과 요약으로 충분합니다."
            ]
  };
}

export function classifyOperatingTelegramConfidence(input: OperatingJudgmentInput): {
  state: OperatingTelegramConfidenceState;
  evidenceLevel: OperatingTelegramEvidenceLevel;
} {
  const text = String(input.currentInput || "");
  const normalized = text.toLowerCase();
  const evidenceLevel = input.telegramEvidenceLevel || "not_applicable";
  if (/(\/approve|allow-once|allow-always|deny|plugin approval|codex_command_approval|codex app-server command approval|승인\s*(요청|카드|대기|만료|시간\s*초과)|명령\s*승인)/i.test(text)) {
    return { state: "waiting_approval", evidenceLevel };
  }
  if (/(recovery|복구|gateway restart|게이트웨이.*재시작)/i.test(normalized)) {
    return { state: "recovery", evidenceLevel };
  }
  if (/(blocked|막힘|막혔|불가|cannot proceed)/i.test(normalized)) {
    return { state: "blocked", evidenceLevel };
  }
  if (/(failed|failure|실패|error|오류)/i.test(normalized)) {
    return { state: "failed", evidenceLevel };
  }
  if (input.executionResultState === "completed") return { state: "complete", evidenceLevel };
  if (input.executionResultState === "partial" || input.executionResultState === "unverified") return { state: "partial", evidenceLevel };
  if (input.executionResultState === "blocked") return { state: "blocked", evidenceLevel };
  if (input.executionResultState === "failed") return { state: "failed", evidenceLevel };
  const mode = classifyExecutionMode(text);
  if (mode === "execution" || mode === "implementation") return { state: "running", evidenceLevel };
  if (mode === "diagnosis" || mode === "verification" || mode === "planning") return { state: "thinking", evidenceLevel };
  return { state: "listening", evidenceLevel };
}

export function classifyOperatingClaim(input: OperatingJudgmentInput): {
  label: OperatingClaimLabel;
  surfaceCorrectionNeeded: boolean;
} {
  const state = input.executionResultState;
  let label: OperatingClaimLabel = "unverified";
  if (state === "completed") label = input.hasVerificationEvidence ? "complete" : "unverified";
  else if (state === "partial" || state === "skipped" || state === "unverified") label = "partial";
  else if (state === "blocked") label = "blocked";
  else if (state === "failed") label = "failed";

  return {
    label,
    surfaceCorrectionNeeded: Boolean(input.surfaceCorrectionNeeded || (state === "completed" && !input.hasVerificationEvidence))
  };
}

export function buildOperatingJudgmentReport(input: OperatingJudgmentInput): BeaiOperatingJudgmentReport {
  const delegation = classifyOperatingDelegationCandidate(input);
  const riskFamilies = classifyOperatingRiskFamilies(input);
  const stateClasses = classifyOperatingStateHygieneClasses(input);
  const readOnlyInspection =
    hasReadOnlyAutomationInspectionSignal(input.currentInput) ||
    hasReadOnlyTelegramStatusSignal(input.currentInput) ||
    hasReadOnlyNotionSignal(input.currentInput);
  const strongApprovalRequired = !readOnlyInspection && riskFamilies.some((family) =>
    ["external_send", "delete", "payment", "browser_submit", "device_action", "permission_change", "durable_memory_write"].includes(family)
  );
  const approvalRequired = !readOnlyInspection && (riskFamilies.length > 0 || Boolean(input.requiresUserConfirmation) || delegation.candidate === "approval_required");
  const telegramConfidence = classifyOperatingTelegramConfidence(input);
  const claim = classifyOperatingClaim(input);
  const risk = {
    families: riskFamilies,
    approvalRequired,
    strongApprovalRequired
  };
  const delegationReport = {
    candidate: delegation.candidate,
    level: classifyOperatingDelegationLevel(input),
    reasons: delegation.reasons
  };
  const approvalErgonomics = buildApprovalErgonomicsProfile(input, {
    risk,
    delegation: delegationReport
  });
  return {
    version: "0.4.8",
    mode: "observer",
    delegation: delegationReport,
    risk,
    approvalErgonomics,
    stateHygiene: {
      classes: stateClasses,
      durableWriteAllowed: false
    },
    telegramConfidence,
    claim,
    rollback: {
      runtime: riskFamilies.some((family) => family === "install" || family === "restart" || family === "permission_change"),
      state: stateClasses.length > 0,
      surfaceClaimCorrection: claim.surfaceCorrectionNeeded
    }
  };
}

export function buildSkillRoutingReport(input: SkillRoutingInput): SkillRoutingReport {
  const rawText = input.currentInput || "";
  const text = normalizeSkillRoutingText(rawText) || rawText;
  const candidates: SkillRoutingCandidate[] = [];
  const suppressed: string[] = [];
  const add = (
    id: string,
    kind: SkillRoutingKind,
    title: string,
    score: number,
    triggerSignals: string[],
    reasons: string[],
    safetyNotes: string[] = []
  ) => {
    const action = inferSkillRoutingAction(input, score);
    pushSkillCandidate(candidates, {
      id,
      kind,
      title,
      confidence: confidenceFromScore(score),
      action,
      reasons,
      triggerSignals,
      safetyNotes: [
        "candidate-only routing; do not auto-invoke from BEAI Runtime",
        ...safetyNotes,
        ...(action === "needs_user_approval" ? ["approval required before any external, high-risk, or durable action"] : [])
      ]
    });
  };

  if (/(배포|공유|zip|패키지|package|release|검증|버전|version|doctor|hooks|gateway|telegram|텔레그램)/i.test(text)) {
    add(
      "beai-release-verifier",
      "skill",
      "BEAI release/package verification",
      82,
      ["distribution_or_runtime_verification"],
      ["input asks about package, release, runtime, or operational verification"],
      ["verification should report checked and unchecked surfaces separately"]
    );
  }
  if (/(memory|메모리|기억|맥락|context|relevance|관련도|승격|후보)/i.test(text)) {
    add(
      "beai-memory-curator-review",
      "skill",
      "BEAI memory candidate review",
      76,
      ["memory_context_signal"],
      ["input concerns memory, context, relevance, or promotion boundaries"],
      ["do not promote memory automatically"]
    );
  }
  if (/(AI\s*네이티브|AX|OpenClaw|오픈클로|개인\s*(?:AI\s*)?(?:비서|assistant)|스킬|에이전트|크론|메모리|자동화).*?(헷갈|막막|어렵|뭘\s*먼저|어디서\s*시작|가이드|길|로드맵)|(?:헷갈|막막|어렵|뭘\s*먼저|어디서\s*시작).*?(AI\s*네이티브|AX|OpenClaw|오픈클로|스킬|에이전트|크론|메모리|자동화)/i.test(text)) {
    add(
      "ai-native-journey-guide",
      "skill",
      "AI-native/OpenClaw journey guide",
      84,
      ["ai_native_orientation_signal"],
      ["input asks for a friendly path through OpenClaw, AX, skills, agents, cron, memory, or personal AI assistant adoption"],
      ["guide the next safe success experience before implementation or automation"]
    );
  }
  if (/(cron|크론|스케줄|예약|자동\s*실행|매일|매주|모니터링|정기적|반복\s*실행|자동으로\s*(?:돌|보내|해)|(?:AI|OpenClaw|오픈클로).{0,24}(?:어떻게\s*풀|해결|맡기|줄이|운영)|(?:어떻게\s*풀|해결|맡기|줄이|운영).{0,24}(?:AI|OpenClaw|오픈클로))/i.test(text)) {
    add(
      "automation-readiness-check",
      "skill",
      "Automation readiness and approval boundary check",
      83,
      ["automation_readiness_signal"],
      ["input asks or implies scheduled, repeated, monitored, or unattended work"],
      ["manual proof, failure boundary, stop path, and approval gate must be checked before cron"]
    );
  }
  if (/(direct|skill|스킬|agent|에이전트|cron|크론|자동화|human-only|어디까지|분류|나눠|맡길|후보)/i.test(text) && !isMetaOnlySkillSignal(rawText)) {
    add(
      "skill-agent-cron-router",
      "skill",
      "Direct / skill / agent / cron routing boundary",
      72,
      ["capability_routing_signal"],
      ["input asks how work should be handled across direct answer, skill, agent, cron, automation, or human-only boundaries"],
      ["routing judgment only; do not create skills, agents, or cron directly"]
    );
  }
  if (/(직원|알바|매장|점장|대표.*(?:투입|갈려|들어가)|결근|근무표|인력|운영\s*병목|공정|마감|체크리스트)/i.test(text)) {
    add(
      "operations-owner-load-diagnosis",
      "skill",
      "Owner load and operations bottleneck diagnosis",
      84,
      ["owner_operations_load_signal"],
      ["input concerns owner overload, staff gaps, store operations, checklists, schedules, or recurring execution bottlenecks"],
      ["prefer observation/report-first workflow before staff messaging or schedule changes"]
    );
  }
  if (/(전환|구매전환|전환율|유입|상세페이지|장바구니|이탈|재구매|리뷰|고객\s*여정|광고|인스타|랜딩|첫\s*구매)/i.test(text)) {
    add(
      "customer-journey-auditor",
      "skill",
      "Customer journey and conversion friction audit",
      84,
      ["customer_journey_signal"],
      ["input concerns traffic, conversion, detail page, repeat purchase, review, ad-to-page mismatch, or customer journey friction"],
      ["separate traffic, trust, offer, detail-page, and action friction before recommending tactics"]
    );
  }
  if (/(매출|현금|고정비|마진|이익|수익|손익|비용|객단가|단가|가격|돈이\s*안\s*남|자금|회수)/i.test(text)) {
    add(
      "eco-cash-pressure-diagnosis",
      "skill",
      "Cash pressure and business economics diagnosis",
      74,
      ["money_or_cash_pressure_signal"],
      ["input concerns money, cash, margin, cost, price, payback, or business economics"],
      ["do not turn this into financial advice beyond visible operating evidence"]
    );
  }
  if (/(관점|상대|고객이\s*(?:보|느끼|선택)|선택\s*조건|상대적\s*관점|수신자|받아들|설득|메시지|문구|카피)/i.test(text)) {
    add(
      "relative-perspective-lens",
      "skill",
      "Relative perspective and selection-condition lens",
      70,
      ["relative_perspective_signal"],
      ["input asks to reframe from the other party's selection conditions or message reception"],
      ["translate claims into the receiver's usable selection language"]
    );
  }
  if ((hasExplicitSkillCreationSignal(text) || hasWorkflowCandidateSignal(text)) && !isMetaOnlySkillSignal(rawText)) {
    add(
      "dagu-skill-foundry",
      "skill",
      "Skill candidate proposal workflow",
      hasExplicitSkillCreationSignal(text) ? 78 : 60,
      ["skill_or_workflow_signal"],
      ["input asks to connect repeated work to a skill or workflow candidate"],
      ["candidate proposal only; live skill application requires explicit approval"]
    );
  }
  if (/(handoff|세션|이어|다음\s*세션|연속성|continuity|압축|compaction)/i.test(text)) {
    add(
      "beai-session-handoff",
      "skill",
      "Session continuity handoff",
      74,
      ["session_continuity_signal"],
      ["input asks to carry work across sessions or preserve continuity"],
      ["carry only compact state, not broad transcript history"]
    );
  }
  if (/(agent|에이전트|독립|백그라운드|따로\s*일|위임|delegate)/i.test(text)) {
    add(
      "agent-candidate-review",
      "agent",
      "Agent delegation candidate review",
      56,
      ["agent_delegation_signal"],
      ["input mentions independent agent-style work"],
      ["do not spawn or route to an agent without explicit user approval and a clear stop condition"]
    );
  }

  for (const signal of input.roleSignals.slice(0, 4)) {
    const score = signal.priority === "high" ? 68 : 52;
    add(
      `role-${signal.role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      "manual_workflow",
      `${signal.role} workflow candidate`,
      score,
      [`role_signal:${signal.role}`],
      [signal.reason],
      ["role signal is evidence, not an automatic routing instruction"]
    );
  }

  if (/(cron|크론|스케줄|예약\s*(?:실행|발송|등록|작업)|자동\s*실행|반복\s*실행)/i.test(text)) {
    suppressed.push("cron automation is not routed automatically; scheduling requires explicit approval");
  }
  if (input.mode === "conversation" && candidates.some((candidate) => candidate.action === "recommend_use")) {
    suppressed.push("conversation-mode inputs keep routing as candidate guidance unless execution is requested");
  }

  return {
    mode: "observer",
    generatedAt: new Date().toISOString(),
    currentInputPreview: compactText(text, 180) || "",
    candidates: candidates.slice(0, 6),
    suppressed,
    note: "Skill Routing Plane foundation records candidate routing evidence only. It does not invoke skills or agents."
  };
}

function slugifyWorkflowTitle(value: string): string {
  const ascii = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return ascii || "workflow-candidate";
}

function inferWorkflowTitle(text: string): string {
  if (hasRetryPolicySignal(text)) return "실패 재시도 정책 후보";
  if (hasDestructiveRewriteSignal(text)) return "파괴적 재작성 승인 후보";
  if (hasOpenClawCoreMutationSignal(text)) return "OpenClaw core 변경 승인 후보";
  if (hasDurableProcedureSignal(text)) return "반복 절차화 후보";
  if (/(proposal|제안|스킬).{0,24}(?:승인|적용|폐기|반려|격리|quarantine|apply|reject)/i.test(text)) return "스킬 생애주기 변경 후보";
  if (/(마감|일마감|정산|pos|카드|계좌|입금|매출|지출)/i.test(text)) return "일마감 정산 확인";
  if (/(예산|고정비|현금\s*흐름|비용|손익|미수금)/i.test(text)) return "재무 운영 확인";
  if (/(콘텐츠|발행|업로드|게시|캠페인)/i.test(text)) return "콘텐츠 발행 흐름 확인";
  if (/(고객|문의|응대|리뷰|컴플레인|불만)/i.test(text)) return "고객 응대 흐름 확인";
  if (/(배포|검증|release|package|zip|doctor|hooks)/i.test(text)) return "배포 검증 흐름 확인";
  if (hasScheduledWorkSignal(text)) return "예약 자동화 후보";
  if (hasAppProductSignal(text)) return "앱/웹 제품 개발 후보";
  if (hasSkillLifecycleSignal(text)) return "스킬 생애주기 후보";
  if (hasAgentCandidateSignal(text)) return "에이전트 역할 후보";
  if (hasIssueLedgerWriteSignal(text)) return "비아이 닥터 이슈 장부 기록 후보";
  return "반복 업무 후보";
}

function inferWorkflowOwner(text: string, skillRouting: SkillRoutingReport): string {
  if (/(예산|고정비|현금\s*흐름|비용|손익|미수금|정산|매출|지출|입금)/i.test(text)) return "ECO Finance Ops";
  if (/(콘텐츠|발행|업로드|게시|캠페인)/i.test(text)) return "HERA Content Ops";
  if (/(매장|운영|마감|체크리스트|공정)/i.test(text)) return "Operations Workflow";
  const firstManual = skillRouting.candidates.find((candidate) => candidate.kind === "manual_workflow");
  return firstManual?.title || "BEAI Layer";
}

function inferRequiredWorkflowInputs(text: string): string[] {
  const inputs: string[] = [];
  const push = (value: string) => {
    if (!inputs.includes(value)) inputs.push(value);
  };
  if (/(pos|포스|매출)/i.test(text)) push("POS 매출");
  if (/(카드|정산)/i.test(text)) push("카드 정산");
  if (/(계좌|입금|미수)/i.test(text)) push("계좌 입금");
  if (/(지출|비용|고정비)/i.test(text)) push("비용 지출");
  if (/(세금|부가세|통장)/i.test(text)) push("세금/적립 계정");
  if (/(고객|문의|리뷰|컴플레인|불만)/i.test(text)) push("고객 반응 기록");
  if (/(콘텐츠|발행|업로드|게시)/i.test(text)) push("발행 대상 콘텐츠");
  if (/(배포|검증|package|zip|doctor|hooks)/i.test(text)) push("패키지/검증 로그");
  return inputs;
}

function inferWorkflowRiskLevel(text: string, operatingJudgment: BeaiOperatingJudgmentReport): WorkflowRiskLevel {
  if (operatingJudgment.risk.strongApprovalRequired) return "high";
  if (hasExternalWriteSignal(text) || hasAuthDataPaymentDeploySignal(text) || hasRollbackSignal(text) || hasAutomaticMemorySignal(text) || hasRetryPolicySignal(text) || hasDestructiveRewriteSignal(text) || hasOpenClawCoreMutationSignal(text) || /(돈|송금|결제|삭제|계약|고객\s*응대|외부\s*발송|public|공개|email|slack|discord|telegram|텔레그램)/i.test(text)) {
    return "high";
  }
  if (operatingJudgment.risk.approvalRequired || /(정산|매출|비용|계좌|입금|세금|고객|발송|보고)/i.test(text)) {
    return "medium";
  }
  return "low";
}

function workflowSignalLevel(text: string, operatingJudgment: BeaiOperatingJudgmentReport): WorkflowStateLedger["repeatedWorkSignal"] {
  if (hasReadOnlyAutomationInspectionSignal(text) || hasReadOnlyTelegramStatusSignal(text) || hasReadOnlyNotionSignal(text) || hasDocsOnlyReleaseArtifactSignal(text) || hasExplicitRoutingNegationSignal(text) || hasSkillDescriptionArtifactSignal(text)) return "none";
  if (hasScheduledWorkSignal(text)) return "scheduled_candidate";
  if (operatingJudgment.delegation.level === "L5_repeated_automation_candidate") return "scheduled_candidate";
  if (/(매일|매주|매월|정기|반복\s*실행|자동\s*실행|예약\s*(?:실행|발송|등록|작업))/i.test(text)) return "scheduled_candidate";
  if (hasRetryPolicySignal(text)) return "scheduled_candidate";
  if (hasDurableProcedureSignal(text)) return "candidate";
  if (hasDestructiveRewriteSignal(text) || hasOpenClawCoreMutationSignal(text)) return "weak";
  if (hasIssueLedgerWriteSignal(text)) return "weak";
  if (hasSkillLifecycleSignal(text) || hasAgentCandidateSignal(text)) return "weak";
  const releaseStatusOnly =
    /(openclaw|오픈클로|BEAI|비아이|runtime|plugin|플러그인|doctor|hooks|plugins\s+list|enabled|로드|검증|확인)/i.test(text) &&
    !/(반복|매번|자꾸|계속|귀찮|절차화|워크플로|workflow|routine|스킬|skill|agent|에이전트|cron|크론|자동화|후보|매일|매주|매월|정기|예약\s*(?:실행|발송|등록|작업))/i.test(text);
  if (releaseStatusOnly) return "none";
  if (/(반복|매번|자꾸|계속|귀찮|놓친|체크|확인|절차화|워크플로|workflow|routine|every\s+(day|week|month))/i.test(text)) {
    return "candidate";
  }
  if (hasSkillLifecycleSignal(text) || hasAgentCandidateSignal(text) || hasIssueLedgerWriteSignal(text) || /(스킬|skill|agent|에이전트|cron|크론|자동화|후보)/i.test(text)) return "weak";
  return "none";
}

function inferWorkflowStage(
  signal: WorkflowStateLedger["repeatedWorkSignal"],
  text: string,
  operatingJudgment: BeaiOperatingJudgmentReport
): WorkflowLedgerStage {
  if (signal === "none") return "no_candidate";
  if (/(실제\s*자동화|automation registry|자동화\s*목록|이미\s*예약|active automation)/i.test(text)) return "automated";
  if (signal === "scheduled_candidate" || operatingJudgment.delegation.level === "L5_repeated_automation_candidate") return "cron_candidate";
  if (hasAgentCandidateSignal(text)) return "agent_candidate";
  if (hasDurableProcedureSignal(text) || hasSkillLifecycleSignal(text) || hasIssueLedgerWriteSignal(text) || /(skill|스킬|절차화|프로세스화|workflow|워크플로)/i.test(text)) return "skill_candidate";
  return "manual_test";
}

function buildPromotionConditions(stage: WorkflowLedgerStage): string[] {
  const base = [
    "수동 실행 3회 성공",
    "입력 데이터 경로 고정",
    "결과 포맷 안정화",
    "실패 시 보고 문구 확인",
    "사용자 명시 승인"
  ];
  if (stage === "agent_candidate" || stage === "cron_candidate") {
    base.push("담당 owner와 중단 방법 확인");
  }
  return base;
}

function buildDoNotPromoteIf(riskLevel: WorkflowRiskLevel): string[] {
  const blockers = [
    "API 인증 또는 입력 경로가 불안정함",
    "필수 데이터가 누락됨",
    "사용자가 결과를 이해하지 못함",
    "대화 요약 외 검증 증거가 없음",
    "실패 대응 또는 중단 방법이 없음"
  ];
  if (riskLevel !== "low") {
    blockers.push("돈 이동, 삭제, 외부 발송, 계약, 고객 응대가 포함됨");
  }
  return blockers;
}

function userFacingWorkflowStageSummary(stage: WorkflowLedgerStage, status: WorkflowLedgerStatus): string {
  if (status === "automation_active") {
    return "이미 실제 자동화 장부에 있는 흐름입니다. 변경이나 확장은 별도 승인과 검증 뒤에만 다룹니다.";
  }
  if (stage === "cron_candidate") {
    return "정해진 시간에 반복 보고를 받을 수 있는 cron 후보입니다. 아직은 수동 실행 증거와 중단 방법을 먼저 확인해야 합니다.";
  }
  if (stage === "agent_candidate") {
    return "단순 반복보다 전담 역할에 가깝습니다. 장기 상태, 후속 판단, 실패 대응이 필요하므로 agent 후보로 검토합니다.";
  }
  if (stage === "skill_candidate") {
    return "같은 방식으로 다시 쓸 일이 있는 반복 절차입니다. 먼저 스킬 후보로 정리하는 단계가 맞습니다.";
  }
  if (stage === "manual_test") {
    return "자동화 전 단계입니다. 사람이 부르면서 몇 번 같은 방식으로 실행해 절차를 안정화해야 합니다.";
  }
  return "반복 업무 후보가 확인되지 않았습니다. 일반 대화/판단 흐름으로 유지합니다.";
}

function buildWorkflowCard(input: {
  text: string;
  signal: WorkflowStateLedger["repeatedWorkSignal"];
  stage: WorkflowLedgerStage;
  skillRouting: SkillRoutingReport;
  operatingJudgment: BeaiOperatingJudgmentReport;
  generatedAt: string;
}): WorkflowCard | null {
  if (input.signal === "none" || input.stage === "no_candidate") return null;
  const title = inferWorkflowTitle(input.text);
  const riskLevel = inferWorkflowRiskLevel(input.text, input.operatingJudgment);
  const hasExternalSend = hasExternalWriteSignal(input.text) || /(외부\s*발송|외부\s*전송|email|slack|discord|whatsapp|telegram|텔레그램|고객\s*응대|보고)/i.test(input.text);
  const hasFileWrite = hasIssueLedgerWriteSignal(input.text) || /(파일\s*쓰기|저장|수정|write|edit|patch|장부\s*수정)/i.test(input.text);
  const hasMoneyMovement = /(송금|결제|이체|payment|pay\b|돈\s*이동|purchase|checkout)/i.test(input.text);
  const status: WorkflowLedgerStatus =
    input.stage === "automated"
      ? "automation_active"
      : input.stage === "cron_candidate"
        ? "not_cron_ready"
        : input.stage === "agent_candidate"
          ? "agent_review_required"
          : input.stage === "skill_candidate"
            ? "skill_candidate_ready"
            : "manual_test_required";

  return {
    workflowId: `workflow-${slugifyWorkflowTitle(title)}`,
    title,
    stage: input.stage,
    owner: inferWorkflowOwner(input.text, input.skillRouting),
    requiredInputs: inferRequiredWorkflowInputs(input.text),
    riskLevel,
    externalSend: hasExternalSend,
    fileWrite: hasFileWrite,
    moneyMovement: hasMoneyMovement,
    promotionConditions: buildPromotionConditions(input.stage),
    doNotPromoteIf: buildDoNotPromoteIf(riskLevel),
    lastVerifiedAt: null,
    status,
    triggerSignals: [
      `repeated_work_signal:${input.signal}`,
      `operating_level:${input.operatingJudgment.delegation.level}`,
      ...input.skillRouting.candidates.slice(0, 2).map((candidate) => `skill_route:${candidate.id}`)
    ],
    userFacingSummary: userFacingWorkflowStageSummary(input.stage, status),
    updatedAt: input.generatedAt
  };
}

function buildManualRunEvidence(card: WorkflowCard | null): ManualRunEvidenceLedger | null {
  if (!card) return null;
  return {
    workflowId: card.workflowId,
    requiredRuns: 3,
    observedRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    inputPathStable: false,
    outputFormatStable: false,
    status: "not_started",
    evidence: ["대화 신호만으로는 수동 실행 검증을 완료한 것으로 보지 않습니다."]
  };
}

function buildPromotionGateResult(card: WorkflowCard | null, manualRunEvidence: ManualRunEvidenceLedger | null, generatedAt: string): PromotionGateResult | null {
  if (!card || !manualRunEvidence) return null;
  const blockers = [
    "수동 실행 3회 성공 기록 없음",
    "입력 데이터 경로 안정성 미확인",
    "결과 포맷 안정성 미확인",
    "실패 보고 문구 미확인",
    "사용자 명시 승인 미확인"
  ];
  if (card.externalSend) blockers.push("외부 발송은 기본 자동화 금지 범위입니다.");
  if (card.fileWrite) blockers.push("파일/장부 수정은 별도 승인 전 자동화하지 않습니다.");
  if (card.moneyMovement) blockers.push("돈 이동은 cron 승격 금지 범위입니다.");
  if (card.riskLevel === "high") blockers.push("high risk workflow는 strong approval과 별도 검증이 필요합니다.");

  const targetStage: PromotionGateResult["targetStage"] =
    card.stage === "skill_candidate" ? "skill" : card.stage === "agent_candidate" ? "agent" : card.stage === "automated" ? "automation_registry" : "cron";

  return {
    workflowId: card.workflowId,
    checkedAt: generatedAt,
    fromStage: card.stage,
    targetStage,
    status: "blocked",
    cronReady: false,
    blockers: Array.from(new Set(blockers)),
    requiredApprovals: ["사용자 명시 승인", "승격 전 마지막 범위 확인"],
    userFacingSummary:
      targetStage === "cron"
        ? "cron으로 올리려면 수동 실행 증거, 안정된 입력/출력, 중단 방법, 실패 보고 기준이 먼저 필요합니다."
        : targetStage === "agent"
          ? "agent로 올리려면 전담 역할, 장기 상태, owner, 중단 조건, 실패 대응 기준을 먼저 확인해야 합니다."
          : "다음 단계로 올리기 전 수동 증거와 승인 경계를 먼저 확인해야 합니다."
  };
}

export function buildWorkflowStateLedger(input: {
  currentInput: string;
  skillRouting: SkillRoutingReport;
  operatingJudgment: BeaiOperatingJudgmentReport;
}): WorkflowStateLedger {
  const text = input.currentInput || "";
  const generatedAt = new Date().toISOString();
  const signal = workflowSignalLevel(text, input.operatingJudgment);
  const stage = inferWorkflowStage(signal, text, input.operatingJudgment);
  const workflowCard = buildWorkflowCard({
    text,
    signal,
    stage,
    skillRouting: input.skillRouting,
    operatingJudgment: input.operatingJudgment,
    generatedAt
  });
  const manualRunEvidence = buildManualRunEvidence(workflowCard);
  const promotionGate = buildPromotionGateResult(workflowCard, manualRunEvidence, generatedAt);
  const userFacingGuidance = workflowCard
    ? [
        workflowCard.userFacingSummary,
        "반복성이 확인되면 스킬 후보로 정리하고, 자동화는 마지막에 검토합니다.",
        "자동화하더라도 조회와 보고 범위부터 확인합니다."
      ]
    : ["반복 업무 후보가 확인되지 않았습니다. 일반 대화/판단 흐름으로 유지합니다."];

  return {
    version: "0.6.0",
    mode: "observer",
    generatedAt,
    currentInputPreview: compactText(text, 180) || "",
    repeatedWorkSignal: signal,
    workflowCard,
    manualRunEvidence,
    promotionGate,
    automationRegistry: {
      entries: [],
      note: "Automation Registry records active automations only. Candidates stay in Workflow Card and Promotion Gate."
    },
    userFacingGuidance,
    mustNot: [
      "대화 요약만으로 cron 승격 금지",
      "기억만으로 반복 검증 완료 처리 금지",
      "사용자 명시 승인 없이 Agent/Cron 생성 금지",
      "외부 발송, 결제, 삭제, 계약, 고객 응대는 기본 cron 금지",
      "중단 방법과 실패 보고 방식 없는 자동화 승격 금지"
    ]
  };
}

export function buildTurnPlan(
  prompt: string,
  options?: {
    liveSessionContextUsagePct?: number;
  }
): BeaiTurnPlan {
  const currentTurn = buildCurrentTurnPacket(prompt);
  const planningPrompt = currentTurn.cleanInput || prompt;
  const inferredSignals = inferSessionSignals(planningPrompt);
  const sharedPlan = sharedCore.buildTurnPlan({
    userMessage: planningPrompt,
    ...inferredSignals,
    sessionContextUsagePct:
      options?.liveSessionContextUsagePct !== undefined && options?.liveSessionContextUsagePct !== null
        ? options.liveSessionContextUsagePct
        : inferredSignals.sessionContextUsagePct
  });
  const effectivePrimaryClass: SharedTurnPlan["primaryClass"] =
    hasReadOnlyAutomationInspectionSignal(planningPrompt) || hasReadOnlyTelegramStatusSignal(planningPrompt) || hasReadOnlyNotionSignal(planningPrompt)
      ? "verification"
      : sharedPlan.primaryClass;
  const constraints =
    sharedPlan.workOrder?.forbiddenActions?.map((item) => item.replace(/-/g, " ").trim()) ||
    Array.from(new Set([...currentTurn.explicitConstraints, ...inferConstraintsFromPrompt(planningPrompt)]));
  const workOrder = buildOpenClawWorkOrder(sharedPlan, planningPrompt, constraints);
  const judgmentFrame = buildJudgmentFrame(currentTurn, sharedPlan);
  const continuityPatchForPlan = {
    last_assistant_answer: sharedPlan.continuityPatch.last_assistant_answer,
    numbered_items: sharedPlan.continuityPatch.numbered_items,
    last_sentence: sharedPlan.continuityPatch.last_sentence,
    current_artifact: sharedPlan.continuityPatch.current_artifact,
    recent_constraints: sharedPlan.continuityPatch.recent_constraints,
    current_focus: sharedPlan.continuityPatch.current_focus
  };
  const conversationSceneContinuity = buildConversationSceneContinuityProfile({
    currentTurn,
    continuityPatch: continuityPatchForPlan
  });
  const responseResolution = buildResponseResolution(currentTurn, sharedPlan, judgmentFrame, conversationSceneContinuity);
  const responseInertia = buildResponseInertiaProfile({
    currentTurn,
    previousAssistantReply: sharedPlan.continuityPatch.last_assistant_answer,
    conversationScene: conversationSceneContinuity
  });
  const inputLevelCompanion = buildInputLevelCompanionProfile({
    currentTurn,
    sharedPlan
  });
  const realitySignalMap = buildRealitySignalMap(currentTurn, sharedPlan, constraints, judgmentFrame);
  const evidenceLedger = buildEvidenceLedger(realitySignalMap);
  const realitySignalProfile = buildRealitySignalProfile(realitySignalMap, evidenceLedger);
  const continuityShellPlan = {
    currentTurn,
    handoffState: sharedPlan.handoffState,
    sessionPressure: sharedPlan.sessionPressure,
    continuityPatch: continuityPatchForPlan,
    constraints,
    objective: sharedPlan.immediateAsk,
    mode: sharedPlan.mode
  } as BeaiTurnPlan;
  const continuityJudgment = buildContinuityJudgmentProfile(continuityShellPlan);
  const operatingJudgment = buildOperatingJudgmentReport({
    currentInput: currentTurn.cleanInput,
    mode: sharedPlan.mode,
    primaryClass: effectivePrimaryClass,
    riskLevel: sharedPlan.riskLevel,
    requiresUserConfirmation: sharedPlan.requiresUserConfirmation,
    telegramEvidenceLevel: "not_applicable",
    surfaceCorrectionNeeded: false
  });
  const judgmentFlow = buildJudgmentFlowProfile({
    currentTurn,
    judgmentFrame,
    realitySignalProfile,
    continuityJudgment,
    evidenceLedger,
    constraints,
    operatingJudgment
  });
  const judgmentSharpness = buildJudgmentSharpnessProfile({
    currentTurn,
    responseResolution,
    realitySignalProfile,
    evidenceLedger,
    judgmentFlow,
    operatingJudgment,
    responseInertia
  });
  const userConfidence = buildUserConfidenceState({
    currentTurn,
    requiresUserConfirmation: sharedPlan.requiresUserConfirmation,
    primaryClass: effectivePrimaryClass,
    riskLevel: sharedPlan.riskLevel,
    mode: sharedPlan.mode
  });
  const skillRouting = buildSkillRoutingReport({
    currentInput: planningPrompt,
    mode: sharedPlan.mode,
    primaryClass: effectivePrimaryClass,
    riskLevel: sharedPlan.riskLevel,
    requiresUserConfirmation: sharedPlan.requiresUserConfirmation,
    roleSignals: sharedPlan.roleSignals || []
  });
  const workflowStateLedger = buildWorkflowStateLedger({
    currentInput: planningPrompt,
    skillRouting,
    operatingJudgment
  });
  const surfaceFlow = buildSurfaceFlowProfile(currentTurn, sharedPlan, judgmentFrame, responseResolution);
  const decisionHandleSurface = buildDecisionHandleSurfaceProfile({
    currentTurn,
    judgmentFrame,
    responseResolution,
    realitySignalProfile,
    judgmentFlow,
    surfaceFlow,
    operatingJudgment
  });
  const flowState = buildFlowStateSpine({
    currentTurn,
    judgmentFrame,
    constraints,
    evidenceLedger,
    operatingJudgment,
    decisionHandleSurface,
    deliverySurface: detectFlowDeliverySurface(planningPrompt)
  });
  const conversationalRhythm = buildConversationalRhythmProfile({
    currentTurn,
    judgmentFrame,
    responseResolution,
    userConfidence,
    surfaceFlow,
    decisionHandleSurface,
    realitySignalProfile
  });
  const conversationQualityGuard = buildConversationQualityGuardProfile({
    currentTurn,
    judgmentFrame,
    realitySignalProfile,
    judgmentFlow,
    decisionHandleSurface,
    conversationalRhythm
  });
  const humanCompanionQuality = buildHumanCompanionQualityProfile({
    currentTurn,
    inputLevelCompanion,
    conversationSceneContinuity,
    conversationQualityGuard,
    conversationalRhythm,
    responseInertia,
    judgmentSharpness,
    flowState
  });
  const runtimeResponseGate = buildRuntimeResponseGateProfile({
    currentTurn,
    flowState,
    responseResolution,
    responseInertia,
    conversationQualityGuard
  });
  const classificationFailSoft = buildClassificationFailSoftProfile({
    currentTurn,
    conversationQualityGuard,
    operatingJudgment,
    decisionHandleSurface
  });

  return {
    mode: sharedPlan.mode,
    primaryClass: effectivePrimaryClass,
    riskLevel: sharedPlan.riskLevel,
    requiresVerification: sharedPlan.requiresVerification,
    requiresUserConfirmation: sharedPlan.requiresUserConfirmation,
    responseStrategy: mapResponseStrategy(sharedPlan),
    objective: sharedPlan.immediateAsk,
    constraints,
    deliverables: workOrder?.deliverables || defaultDeliverables(sharedPlan.mode),
    acceptanceChecks: workOrder?.acceptanceChecks || defaultAcceptanceChecks(sharedPlan.mode),
    judgmentTags: sharedPlan.judgmentTags || [],
    roleCutoffPolicy: sharedPlan.roleCutoffPolicy || undefined,
    primaryRole: sharedPlan.primaryRole ?? null,
    supportingRoles: sharedPlan.supportingRoles || [],
    roleSignals: sharedPlan.roleSignals || [],
    workOrder,
    continuityPatch: continuityPatchForPlan,
    sessionPressure: sharedPlan.sessionPressure,
    handoffState: sharedPlan.handoffState,
    currentTurn,
    judgmentFrame,
    flowState,
    responseResolution,
    realitySignalMap,
    evidenceLedger,
    realitySignalProfile,
    continuityJudgment,
    judgmentFlow,
    userConfidence,
    skillRouting,
    surfaceFlow,
    decisionHandleSurface,
    conversationalRhythm,
    conversationQualityGuard,
    humanCompanionQuality,
    runtimeResponseGate,
    classificationFailSoft,
    operatingJudgment,
    workflowStateLedger,
    responseInertia,
    conversationSceneContinuity,
    inputLevelCompanion,
    judgmentSharpness,
    sharedPlan
  };
}

function sanitizeRepeatedFooterInstruction(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/다음\s*확인\s*하나\s*:/g, "")
    .replace(/answer should end with the current decision handle/gi, "final answer should not append decision handles as repeated footers")
    .replace(/answer should end with[^|,\n]*/gi, "final answer should not use forced footer rules")
    .trim();
}

function sanitizeRepeatedFooterList(values: string[]): string[] {
  return values.map((value) => sanitizeRepeatedFooterInstruction(value)).filter(Boolean);
}

function sanitizeContinuityStateText(value: string | undefined): string | undefined {
  const sanitized = sanitizeRepeatedFooterInstruction(value)
    .replace(/마지막\s*판단\s*기준\s*:\s*/g, "")
    .replace(/마지막\s*기준은\s*/g, "")
    .replace(/마지막에\s*붙잡을\s*기준은\s*/g, "")
    .replace(/참고할\s*기준은\s*/g, "")
    .replace(/입니다\.?$/g, "")
    .trim();
  return compactText(sanitized, 220);
}

export function renderPromptContext(plan: BeaiTurnPlan, companionProfile?: CompanionProfile): string {
  const lines = [
    "[BEAI Runtime Overlay]",
    `mode: ${plan.mode}`,
    `risk_level: ${plan.riskLevel}`,
    `response_strategy: ${plan.responseStrategy}`,
    `execution_mode: ${plan.userConfidence.executionMode}`,
    `response_state: ${plan.userConfidence.responseState}`,
    `objective: ${plan.objective}`,
    `approval_required: ${plan.requiresUserConfirmation ? "true" : "false"}`,
    `current_input: ${plan.currentTurn.cleanInput}`,
    "must_separate_final_debug: true",
    "memory_write_allowed: finalize_only"
  ];
  if (plan.currentTurn.requestedOutputShape || plan.currentTurn.followUpScope !== "full" || plan.currentTurn.currentTarget) {
    lines.push("current_turn_packet:");
    if (plan.currentTurn.requestedOutputShape) lines.push(`- requested_output_shape: ${plan.currentTurn.requestedOutputShape}`);
    if (plan.currentTurn.followUpScope) lines.push(`- follow_up_scope: ${plan.currentTurn.followUpScope}`);
    if (plan.currentTurn.currentTarget) lines.push(`- current_target: ${plan.currentTurn.currentTarget}`);
  }
  lines.push("flow_state:");
  lines.push(`- requested_shape: ${plan.flowState.requestedShape || "unknown"}`);
  lines.push(`- response_role: ${plan.flowState.responseRole}`);
  lines.push(`- user_burden: ${plan.flowState.userBurden}`);
  lines.push(`- tool_need: ${plan.flowState.toolNeed}`);
  lines.push(`- approval_required: ${plan.flowState.approvalBoundary.required ? "true" : "false"}`);
  lines.push(`- approval_scope: ${plan.flowState.approvalBoundary.scope.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- evidence_configured: ${plan.flowState.evidenceState.configured}`);
  lines.push(`- evidence_registered: ${plan.flowState.evidenceState.registered}`);
  lines.push(`- evidence_callable: ${plan.flowState.evidenceState.callable}`);
  lines.push(`- evidence_output: ${plan.flowState.evidenceState.outputVerified}`);
  lines.push(`- evidence_doctor: ${plan.flowState.evidenceState.doctor}`);
  lines.push(`- evidence_release: ${plan.flowState.evidenceState.release}`);
  lines.push(`- closure_handle: ${sanitizeRepeatedFooterInstruction(plan.flowState.closureHandle)}`);
  lines.push(`- delivery_surface: ${plan.flowState.deliverySurface.surface}`);
  lines.push(`- visible_delivery: ${plan.flowState.deliverySurface.visibleDelivery}`);
  if (plan.flowState.memoryInfluence.length > 0) {
    lines.push(`- memory_influence: ${plan.flowState.memoryInfluence.map((item) => `${item.type}:${item.currentJudgmentImpact}`).join(" | ")}`);
  }
  lines.push("runtime_response_gate:");
  lines.push("- mode: guide_only");
  lines.push(`- first_sentence: ${plan.runtimeResponseGate.firstSentence}`);
  lines.push(`- artifact_first: ${plan.runtimeResponseGate.artifactFirst}`);
  lines.push(`- follow_up_delta_only: ${plan.runtimeResponseGate.followUpDeltaOnly}`);
  lines.push(`- state_boundary: ${plan.runtimeResponseGate.stateBoundary}`);
  lines.push(`- visible_delivery: ${plan.runtimeResponseGate.visibleDelivery}`);
  lines.push(`- closure_handle: ${sanitizeRepeatedFooterInstruction(plan.runtimeResponseGate.closureHandle)}`);
  if (plan.runtimeResponseGate.blockIf.length > 0) {
    lines.push(`- block_if: ${sanitizeRepeatedFooterList(plan.runtimeResponseGate.blockIf).slice(0, 5).join(" | ")}`);
  }
  lines.push(`- must_preserve: ${sanitizeRepeatedFooterList(plan.runtimeResponseGate.mustPreserve).slice(0, 4).join(" | ")}`);
  lines.push(`- must_avoid: ${sanitizeRepeatedFooterList(plan.runtimeResponseGate.mustAvoid).slice(0, 5).join(" | ")}`);
  lines.push("input_level_companion:");
  lines.push("- mode: guide_only");
  lines.push(`- input_maturity: ${plan.inputLevelCompanion.inputMaturity}`);
  lines.push(`- primary_need: ${plan.inputLevelCompanion.primaryNeed}`);
  lines.push(`- journey_stage: ${plan.inputLevelCompanion.journeyStage}`);
  lines.push(`- user_burden: ${plan.inputLevelCompanion.userBurden}`);
  lines.push(`- cognitive_load: ${plan.inputLevelCompanion.cognitiveLoadLevel}`);
  lines.push(`- choice_ownership_risk: ${plan.inputLevelCompanion.choiceOwnershipRisk}`);
  lines.push(`- trust_calibration_need: ${plan.inputLevelCompanion.trustCalibrationNeed}`);
  lines.push(`- possible_worlds_needed: ${plan.inputLevelCompanion.possibleWorldsNeeded}`);
  lines.push(`- explanation_depth: ${plan.inputLevelCompanion.explanationDepth}`);
  lines.push(`- control_boundary_needed: ${plan.inputLevelCompanion.controlBoundaryNeeded ? "true" : "false"}`);
  lines.push(`- recovery_need: ${plan.inputLevelCompanion.recoveryNeed ? "true" : "false"}`);
  lines.push(`- response_posture: ${plan.inputLevelCompanion.responsePosture}`);
  lines.push(`- first_safe_step: ${plan.inputLevelCompanion.firstSafeStep}`);
  lines.push(`- question_budget: ${plan.inputLevelCompanion.questionBudget}`);
  lines.push(`- offer_options: ${plan.inputLevelCompanion.shouldOfferOptions ? "true" : "false"}`);
  lines.push(`- avoid_tool_jargon: ${plan.inputLevelCompanion.shouldAvoidToolJargon ? "true" : "false"}`);
  if (plan.inputLevelCompanion.recommendedSkillFamilies.length > 0) {
    lines.push(`- recommended_skill_families: ${plan.inputLevelCompanion.recommendedSkillFamilies.join(" | ")}`);
  }
  lines.push(`- guard_note: ${plan.inputLevelCompanion.guardNote}`);
  lines.push("response_inertia_guard:");
  lines.push("- mode: guide_only");
  lines.push(`- previous_response_reuse_risk: ${plan.responseInertia.previousResponseReuseRisk}`);
  lines.push(`- current_turn_relation: ${plan.responseInertia.currentTurnRelation}`);
  lines.push(`- should_reuse_structure: ${plan.responseInertia.shouldReuseStructure ? "true" : "false"}`);
  lines.push(`- should_reuse_question_style: ${plan.responseInertia.shouldReuseQuestionStyle ? "true" : "false"}`);
  lines.push(`- should_restate_previous_frame: ${plan.responseInertia.shouldRestatePreviousFrame ? "true" : "false"}`);
  lines.push(`- required_shift: ${plan.responseInertia.requiredShift}`);
  lines.push(`- guard_note: ${plan.responseInertia.guardNote}`);
  lines.push("conversation_scene_continuity:");
  lines.push("- mode: guide_only");
  lines.push(`- scene_status: ${plan.conversationSceneContinuity.sceneStatus}`);
  lines.push(`- utterance_role: ${plan.conversationSceneContinuity.utteranceRole}`);
  lines.push(`- current_scene: ${plan.conversationSceneContinuity.currentScene}`);
  lines.push(`- should_inherit_flow: ${plan.conversationSceneContinuity.shouldInheritFlow ? "true" : "false"}`);
  lines.push(`- prefer_execution_continuation: ${plan.conversationSceneContinuity.shouldPreferExecutionContinuation ? "true" : "false"}`);
  if (plan.conversationSceneContinuity.sharedCommitments.length > 0) {
    lines.push(`- shared_commitments: ${plan.conversationSceneContinuity.sharedCommitments.slice(0, 3).join(" | ")}`);
  }
  if (plan.conversationSceneContinuity.pendingNextActions.length > 0) {
    lines.push(`- pending_next_actions: ${plan.conversationSceneContinuity.pendingNextActions.slice(0, 3).join(" | ")}`);
  }
  if (plan.conversationSceneContinuity.repairSignals.length > 0) {
    lines.push(`- repair_signals: ${plan.conversationSceneContinuity.repairSignals.slice(0, 2).join(" | ")}`);
  }
  lines.push(`- guard_note: ${plan.conversationSceneContinuity.guardNote}`);
  if (plan.skillRouting.candidates.length > 0) {
    lines.push("skill_routing:");
    lines.push("- mode: observer");
    lines.push("- auto_invoke: false");
    for (const candidate of plan.skillRouting.candidates.slice(0, 3)) {
      lines.push(`- candidate: ${candidate.title} | ${candidate.kind} | ${candidate.action} | ${candidate.confidence}`);
    }
    if (plan.skillRouting.suppressed.length > 0) {
      lines.push(`- suppressed: ${plan.skillRouting.suppressed.slice(0, 2).join(" | ")}`);
    }
  }
  lines.push("surface_flow_guard:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- clarity_target: ${plan.surfaceFlow.clarityTarget}`);
  lines.push(`- over_compression: ${plan.surfaceFlow.overCompression}`);
  lines.push(`- first_sentence: ${plan.surfaceFlow.firstSentence}`);
  lines.push(`- artifact_first: ${plan.surfaceFlow.artifactFirst ? "true" : "false"}`);
  lines.push(`- decision_questions_max: ${plan.surfaceFlow.decisionQuestionsMax}`);
  lines.push(`- choice_limit: ${plan.surfaceFlow.choiceLimit}`);
  lines.push(`- close_with: ${plan.surfaceFlow.closeWith}`);
  lines.push("- use_user_reality_language: true");
  if (plan.surfaceFlow.avoid.length > 0) {
    lines.push(`- avoid: ${plan.surfaceFlow.avoid.slice(0, 5).join(" | ")}`);
  }
  lines.push("operating_judgment:");
  lines.push("- mode: observer");
  lines.push("- auto_execute: false");
  lines.push(`- delegation_candidate: ${plan.operatingJudgment.delegation.candidate}`);
  lines.push(`- delegation_level: ${plan.operatingJudgment.delegation.level}`);
  lines.push(`- approval_required: ${plan.operatingJudgment.risk.approvalRequired ? "true" : "false"}`);
  lines.push(`- strong_approval_required: ${plan.operatingJudgment.risk.strongApprovalRequired ? "true" : "false"}`);
  lines.push("approval_ergonomics:");
  lines.push("- mode: guide_only");
  lines.push(`- level: ${plan.operatingJudgment.approvalErgonomics.level}`);
  lines.push(`- risk_transition: ${plan.operatingJudgment.approvalErgonomics.riskTransition}`);
  lines.push(`- ask_user_now: ${plan.operatingJudgment.approvalErgonomics.shouldAskUserNow ? "true" : "false"}`);
  lines.push(`- proceed_without_interruption: ${plan.operatingJudgment.approvalErgonomics.shouldProceedWithoutInterruption ? "true" : "false"}`);
  lines.push(`- after_action_report_required: ${plan.operatingJudgment.approvalErgonomics.afterActionReportRequired ? "true" : "false"}`);
  lines.push(`- bundle_same_purpose_steps: ${plan.operatingJudgment.approvalErgonomics.bundleSamePurposeSteps ? "true" : "false"}`);
  lines.push(`- approval_action: ${plan.operatingJudgment.approvalErgonomics.approvalSummary.action}`);
  lines.push(`- approval_impact_scope: ${plan.operatingJudgment.approvalErgonomics.approvalSummary.impactScope}`);
  lines.push(`- approval_does_not_touch: ${plan.operatingJudgment.approvalErgonomics.approvalSummary.doesNotTouch}`);
  lines.push(`- approval_recovery: ${plan.operatingJudgment.approvalErgonomics.approvalSummary.recovery}`);
  lines.push(`- approval_decision: ${plan.operatingJudgment.approvalErgonomics.approvalSummary.decision}`);
  lines.push(`- guidance: ${plan.operatingJudgment.approvalErgonomics.guidance.slice(0, 3).join(" | ")}`);
  lines.push(`- claim_label: ${plan.operatingJudgment.claim.label}`);
  lines.push(`- telegram_evidence: ${plan.operatingJudgment.telegramConfidence.evidenceLevel}`);
  if (plan.workflowStateLedger.repeatedWorkSignal !== "none" || plan.workflowStateLedger.workflowCard) {
    lines.push("workflow_state_ledger:");
    lines.push("- mode: observer");
    lines.push("- auto_promote: false");
    lines.push(`- repeated_work_signal: ${plan.workflowStateLedger.repeatedWorkSignal}`);
    if (plan.workflowStateLedger.workflowCard) {
      lines.push(`- workflow_stage: ${plan.workflowStateLedger.workflowCard.stage}`);
      lines.push(`- workflow_status: ${plan.workflowStateLedger.workflowCard.status}`);
      lines.push(`- risk_level: ${plan.workflowStateLedger.workflowCard.riskLevel}`);
    }
    if (plan.workflowStateLedger.promotionGate) {
      lines.push(`- cron_ready: ${plan.workflowStateLedger.promotionGate.cronReady ? "true" : "false"}`);
      lines.push(`- blockers: ${plan.workflowStateLedger.promotionGate.blockers.slice(0, 3).join(" | ")}`);
    }
    lines.push(`- user_guidance: ${plan.workflowStateLedger.userFacingGuidance.slice(0, 2).join(" | ")}`);
  }
  lines.push("judgment_frame:");
  lines.push(`- response_role: ${plan.judgmentFrame.responseRole}`);
  lines.push(`- last_handle: ${sanitizeRepeatedFooterInstruction(plan.judgmentFrame.lastHandle)}`);
  if (plan.judgmentFrame.confirmed.length > 0) {
    lines.push("- confirmed:");
    for (const item of plan.judgmentFrame.confirmed.slice(0, 6)) lines.push(`  - ${item}`);
  }
  if (plan.judgmentFrame.unknown.length > 0) {
    lines.push("- unknown:");
    for (const item of plan.judgmentFrame.unknown.slice(0, 4)) lines.push(`  - ${item}`);
  }
  if (plan.judgmentFrame.assumptionCandidates.length > 0) {
    lines.push("- assumption_candidates:");
    for (const item of plan.judgmentFrame.assumptionCandidates.slice(0, 4)) lines.push(`  - ${item}`);
  }
  if (plan.judgmentFrame.askOneQuestion) lines.push(`- ask_one_question: ${plan.judgmentFrame.askOneQuestion}`);
  if (plan.judgmentFrame.deferCondition) lines.push(`- defer_condition: ${plan.judgmentFrame.deferCondition}`);
  lines.push("response_resolution:");
  lines.push(`- level: ${plan.responseResolution.level}`);
  lines.push(`- depth: ${plan.responseResolution.depth}`);
  lines.push(`- surface_hint: ${plan.responseResolution.surfaceHint}`);
  if (plan.responseResolution.avoid.length > 0) {
    lines.push(`- avoid: ${plan.responseResolution.avoid.slice(0, 4).join(" | ")}`);
  }
  lines.push("user_confidence_state:");
  lines.push(`- execution_mode: ${plan.userConfidence.executionMode}`);
  lines.push(`- response_state: ${plan.userConfidence.responseState}`);
  lines.push(`- user_meaning: ${plan.userConfidence.userMeaning}`);
  lines.push(`- next_visible_action: ${plan.userConfidence.nextVisibleAction}`);
  lines.push("telegram_visible_delivery_contract:");
  lines.push("- mode: guardrail");
  lines.push("- applies_when: source conversation is Telegram direct and a user-visible reply is expected");
  lines.push("- rule: do not count internal final_answer, private final text, sessions_send, or handoff notes as Telegram delivery");
  lines.push("- required_closeout: call message(action=\"send\") for the source conversation and verify a Telegram messageId before reporting completion");
  lines.push("- recovery_boundary: after Gateway restart recovery, send a visible closeout or say delivery is unverified");
  lines.push("reality_signal_map:");
  lines.push(`- strong: ${plan.realitySignalMap.strongSignals.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- medium: ${plan.realitySignalMap.mediumSignals.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- weak: ${plan.realitySignalMap.weakSignals.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- unknown: ${plan.realitySignalMap.unknownSignals.slice(0, 4).join(" | ") || "none"}`);
  lines.push("evidence_ledger:");
  lines.push(`- user_provided: ${plan.evidenceLedger.userProvided.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- runtime_inferred: ${plan.evidenceLedger.runtimeInferred.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- tool_verified: ${plan.evidenceLedger.toolVerified.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- assumptions: ${plan.evidenceLedger.assumptions.slice(0, 4).join(" | ") || "none"}`);
  lines.push(`- needs_verification: ${plan.evidenceLedger.needsVerification.slice(0, 4).join(" | ") || "none"}`);
  lines.push("reality_signal_profile:");
  lines.push("- mode: observer");
  lines.push("- rewrite_output: false");
  lines.push(`- claim_posture: ${plan.realitySignalProfile.claimPosture}`);
  lines.push(`- confirmed_facts: ${plan.realitySignalProfile.confirmedFacts.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- observed_signals: ${plan.realitySignalProfile.observedSignals.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- runtime_inferences: ${plan.realitySignalProfile.runtimeInferences.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- assumptions: ${plan.realitySignalProfile.assumptions.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- needs_verification: ${plan.realitySignalProfile.needsVerification.slice(0, 3).join(" | ") || "none"}`);
  lines.push("judgment_sharpness:");
  lines.push("- mode: guide_only");
  lines.push(`- claim_strength: ${plan.judgmentSharpness.claimStrength}`);
  lines.push(`- uncertainty_action: ${plan.judgmentSharpness.uncertaintyAction}`);
  lines.push(`- sharpen_confirmed: ${plan.judgmentSharpness.shouldSharpenConfirmed ? "true" : "false"}`);
  lines.push(`- soften_unverified: ${plan.judgmentSharpness.shouldSoftenUnverified ? "true" : "false"}`);
  lines.push(`- ask_new_question: ${plan.judgmentSharpness.shouldAskNewQuestion ? "true" : "false"}`);
  lines.push(`- guard_note: ${plan.judgmentSharpness.guardNote}`);
  lines.push(`- guidance: ${plan.judgmentSharpness.answerGuidance.slice(0, 4).join(" | ")}`);
  lines.push("continuity_judgment:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- continuity_need: ${plan.continuityJudgment.continuityNeed}`);
  lines.push(`- memory_boundary: ${plan.continuityJudgment.memoryBoundary}`);
  lines.push(`- opening_style: ${plan.continuityJudgment.openingStyle}`);
  lines.push(`- carry_forward: ${plan.continuityJudgment.carryForward.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- do_not_carry: ${plan.continuityJudgment.doNotCarry.slice(0, 3).join(" | ") || "none"}`);
  lines.push("judgment_flow:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- domain: ${plan.judgmentFlow.domain}`);
  lines.push(`- posture: ${plan.judgmentFlow.posture}`);
  lines.push(`- stable_criteria: ${plan.judgmentFlow.stableCriteria.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- changed_variables: ${plan.judgmentFlow.changedVariables.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- unresolved_checks: ${plan.judgmentFlow.unresolvedChecks.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- evidence_closure: ${plan.judgmentFlow.evidenceClosure.state}`);
  lines.push(`- closed_checks: ${plan.judgmentFlow.evidenceClosure.closedChecks.slice(0, 3).join(" | ") || "none"}`);
  lines.push(`- next_judgment_handle: ${sanitizeRepeatedFooterInstruction(plan.judgmentFlow.nextJudgmentHandle)}`);
  lines.push("decision_handle_surface:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- kind: ${plan.decisionHandleSurface.kind}`);
  lines.push(`- close_style: ${plan.decisionHandleSurface.closeStyle}`);
  lines.push(`- primary_handle: ${sanitizeRepeatedFooterInstruction(plan.decisionHandleSurface.primaryHandle)}`);
  lines.push(`- must_not_close_with: ${sanitizeRepeatedFooterList(plan.decisionHandleSurface.mustNotCloseWith).slice(0, 3).join(" | ")}`);
  lines.push("conversational_rhythm:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- opening_move: ${plan.conversationalRhythm.openingMove}`);
  lines.push(`- density: ${plan.conversationalRhythm.density}`);
  lines.push(`- warmth: ${plan.conversationalRhythm.warmth}`);
  lines.push(`- structure: ${plan.conversationalRhythm.structure}`);
  lines.push(`- companion_stance: ${plan.conversationalRhythm.companionStance}`);
  lines.push(`- avoid: ${plan.conversationalRhythm.avoid.slice(0, 4).join(" | ")}`);
  lines.push("conversation_quality_guard:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- fixture: ${plan.conversationQualityGuard.fixture}`);
  lines.push(`- quality_target: ${plan.conversationQualityGuard.qualityTarget}`);
  lines.push(`- must_preserve: ${plan.conversationQualityGuard.mustPreserve.slice(0, 4).join(" | ")}`);
  lines.push(`- must_avoid: ${plan.conversationQualityGuard.mustAvoid.slice(0, 4).join(" | ")}`);
  lines.push(`- regression_checks: ${sanitizeRepeatedFooterList(plan.conversationQualityGuard.regressionChecks).slice(0, 3).join(" | ")}`);
  lines.push("human_companion_quality:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- user_experience_target: ${plan.humanCompanionQuality.userExperienceTarget}`);
  lines.push(`- cognitive_load: ${plan.humanCompanionQuality.cognitiveFrame.load}`);
  lines.push(`- reduce_by: ${plan.humanCompanionQuality.cognitiveFrame.reduceBy.slice(0, 3).join(" | ")}`);
  lines.push(`- dialogue_stance: ${plan.humanCompanionQuality.dialogueFrame.stance}`);
  lines.push(`- must_do: ${plan.humanCompanionQuality.dialogueFrame.mustDo.slice(0, 4).join(" | ")}`);
  lines.push(`- must_avoid: ${plan.humanCompanionQuality.dialogueFrame.mustAvoid.slice(0, 4).join(" | ")}`);
  lines.push(`- prior_context_role: ${plan.humanCompanionQuality.continuityFrame.usePriorContextAs}`);
  lines.push(`- long_conversation_risk: ${plan.humanCompanionQuality.continuityFrame.longConversationRisk}`);
  lines.push(`- decision_return: ${plan.humanCompanionQuality.agencyFrame.decisionReturn}`);
  lines.push(`- user_reality_must_preserve: ${plan.humanCompanionQuality.userRealityFrame.mustNotOverwrite.slice(0, 3).join(" | ")}`);
  lines.push(`- burden_reducer_strategy: ${plan.humanCompanionQuality.burdenReducer.strategy}`);
  lines.push(`- conversation_assets: accepted_context_only=${plan.humanCompanionQuality.conversationAssetLedger.acceptedContextOnly}, prior_context_role=${plan.humanCompanionQuality.conversationAssetLedger.priorContextRole}`);
  lines.push(`- artifact_scene: artifact_first=${plan.humanCompanionQuality.artifactSceneModel.artifactFirst}, scene_fit=${plan.humanCompanionQuality.artifactSceneModel.sceneFit}`);
  lines.push(`- recovery_frame: required=${plan.humanCompanionQuality.recoveryFrame.required}, action=${plan.humanCompanionQuality.recoveryFrame.repairAction}`);
  lines.push(`- conversational_flow_core: intent_tracking=${plan.humanCompanionQuality.conversationalFlowCore.intentTracking}, context_motion=${plan.humanCompanionQuality.conversationalFlowCore.contextMotion}, naturalness_target=${plan.humanCompanionQuality.conversationalFlowCore.naturalnessTarget}`);
  lines.push(`- conversational_flow_must_do: ${plan.humanCompanionQuality.conversationalFlowCore.mustDo.slice(0, 3).join(" | ")}`);
  lines.push(`- conversational_flow_must_avoid: ${plan.humanCompanionQuality.conversationalFlowCore.mustAvoid.slice(0, 3).join(" | ")}`);
  lines.push(`- regression_checks: ${plan.humanCompanionQuality.regressionChecks.slice(0, 6).join(" | ")}`);
  lines.push("classification_fail_soft:");
  lines.push("- mode: guide_only");
  lines.push("- rewrite_output: false");
  lines.push(`- narrow_classification: ${plan.classificationFailSoft.narrowClassification}`);
  lines.push(`- signal_basis: ${plan.classificationFailSoft.signalBasis.slice(0, 4).join(" | ")}`);
  lines.push(`- messenger_fallback: ${plan.classificationFailSoft.messengerFallback}`);
  lines.push(`- must_not: ${plan.classificationFailSoft.mustNot.slice(0, 3).join(" | ")}`);
  if (companionProfile) {
    lines.push(renderCompanionProfileContext(companionProfile));
  }
  if (plan.constraints.length > 0) {
    lines.push("constraints:");
    for (const item of plan.constraints) lines.push(`- ${item}`);
  }
  if (plan.sessionPressure?.level && plan.sessionPressure.level !== "ok") {
    lines.push("session_pressure:");
    lines.push(`- level: ${plan.sessionPressure.level}`);
    if (typeof plan.sessionPressure.contextUsagePct === "number") {
      lines.push(`- context_usage_pct: ${plan.sessionPressure.contextUsagePct}`);
    }
    for (const reason of plan.sessionPressure.reasons || []) lines.push(`- reason: ${reason}`);
  }
  lines.push("rules:");
  lines.push("- finalResponse는 사용자에게 바로 보여줄 내용만 남깁니다.");
  lines.push("- debugSummary 성격의 내부 설명은 최종 답변 본문에 섞지 않습니다.");
  lines.push("- 확정된 것, 미정인 것, 추정 후보를 섞어 말하지 않습니다.");
  lines.push("- 답변의 주장 강도는 evidence_ledger와 reality_signal_map의 근거 강도를 넘지 않습니다.");
  lines.push("- reality_signal_profile의 claim_posture가 observed/verify 쪽이면 원인·완료 단정 대신 관찰된 신호와 확인 경로를 먼저 말합니다.");
  lines.push("- judgment_sharpness가 hold/tentative이면 완료·적용·프로덕션급 같은 강한 표현을 검증 전 결론으로 쓰지 않습니다.");
  lines.push("- 사용자가 제공한 것, 도구로 확인한 것, 런타임이 추론한 것, 추가 확인이 필요한 것을 섞지 않습니다.");
  lines.push("- 질문이 필요하면 하나만 묻고, 질문 없이 조건부 판단으로 닫을 수 있으면 그렇게 답합니다.");
  lines.push("- 첫 문장은 내부 결론보다 사용자의 현실, 요청된 산출물, 확인된 상태 중 현재 턴에 맞는 곳에서 시작합니다.");
  lines.push("- 좋은 응답은 무조건 짧은 응답이 아니라, 과잉과 중복 없이 사용자가 자연스럽게 이해하고 납득하며 머릿속이 선명해지는 응답입니다.");
  lines.push("- 필요한 맥락은 남기고, 같은 말을 구조만 바꿔 반복하거나 무조건 요약/압축하지 않습니다.");
  lines.push("- human_companion_quality가 있으면 사용자가 이해받고, 맥락이 살아 있으며, 다음 판단을 회수할 수 있게 답변합니다.");
  lines.push("- 이전 맥락은 현재 요청을 돕는 재료이지 현재 요청을 덮는 권한이 아닙니다.");
  lines.push("- continuity_judgment가 있으면 과거 전체가 아니라 다음 판단을 바꾸는 기준, 현재 위치, 다음 행동만 이어갑니다.");
  lines.push("- 세션 연속성은 장기 기억으로 단정하지 말고 memory_boundary에 따라 후보/세션/프로젝트 상태를 분리합니다.");
  lines.push("- judgment_flow가 있으면 이전 판단, 새 변수, 미검증 항목, 다음 판단 기준을 섞지 않습니다.");
  lines.push("- judgment_flow의 evidence_closure가 닫힌 항목은 반복 보류하지 말고, remaining unresolved만 다음 확인 대상으로 둡니다.");
  lines.push("- decision_handle_surface가 있으면 마지막은 사용자가 붙잡을 판단 기준, 다음 행동, 보류 조건 중 하나로 자연스럽게 닫습니다.");
  lines.push("- conversational_rhythm이 있으면 사용자의 현재 정서와 요청 모드에 맞춰 첫 문장, 밀도, 구조를 고르되 근거 경계는 유지합니다.");
  lines.push("- conversation_quality_guard가 있으면 대표 회귀 사례의 must_preserve/must_avoid 기준을 지키며 답변합니다.");
  lines.push("- classification_fail_soft가 avoid/hold이면 약한 단어 하나로 도메인·자동화·승인·기억 문제를 확정하지 말고 낮은 강도의 Messenger 문장으로 물러섭니다.");
  lines.push("- workflow_state_ledger가 있으면 Workflow Card는 후보 장부, Automation Registry는 실제 자동화 장부로 분리합니다.");
  lines.push("- cron_ready가 false이면 자동 실행을 완료/승격된 것으로 말하지 않습니다.");
  lines.push("- 고민/판단 요청은 핵심 판단 질문을 1~2개로 줄이고, 선택지는 3개 이하로 압축합니다.");
  lines.push("- 마지막에는 새 대화를 강요하지 말고 사용자가 붙잡을 기준, 다음 행동, 보류 조건 중 하나를 남깁니다.");
  if (["artifact", "plan", "work_order"].includes(plan.judgmentFrame.responseRole)) {
    lines.push("- 산출물 요청에서는 배경 설명보다 사용자가 바로 쓸 결과물을 먼저 제공합니다.");
  }
  if (plan.mode === "handoff") {
    lines.push("- 이 턴은 실행형입니다. 응답은 모호한 상의문이 아니라 실행 가능한 Work Order 기준으로 정리합니다.");
    lines.push("- high-risk 요청만 hard handoff override 대상입니다.");
  }
  return lines.join("\n");
}

export function renderSessionSplitApprovalReply(plan: BeaiTurnPlan): string | null {
  if (!plan.sessionPressure?.shouldAskForSplitApproval || !plan.sessionPressure.approvalPrompt) {
    return null;
  }
  const lines = [plan.sessionPressure.approvalPrompt];
  const starter = plan.sessionPressure.handoffStarter;
  if (starter) {
    lines.push("");
    if (starter.currentState) lines.push(`제가 먼저 지금까지 정한 기준을 짧게 정리하겠습니다. ${starter.currentState}`);
    if (starter.nextSessionGoal) lines.push(`그다음 바로 이어갈 수 있게 다음 작업 기준으로 묶겠습니다. ${starter.nextSessionGoal}`);
    if (starter.doneWhen || starter.doNotDoYet) {
      const closingScope = [starter.doneWhen, starter.doNotDoYet].filter(Boolean).join(" ");
      lines.push(`남은 작업도 바로 움직일 수 있는 작은 단위로 나누겠습니다. ${closingScope}`);
    }
  }
  const handoffState = plan.handoffState;
  if (handoffState) {
    const mustCarry = handoffState.carry_priority?.must_carry || [];
    const topics = (handoffState.topics || []).filter((topic) => !/session:|context|warn/i.test(topic));
    lines.push("");
    lines.push("이렇게 해두면 설명을 반복하지 않고 다음 작업으로 더 가볍게 이어갈 수 있습니다.");
    if (topics.length > 0 || mustCarry.length > 0) {
      lines.push(`우선 이어갈 기준은 ${compactBullets(topics, 3).join(", ") || compactBullets(mustCarry, 3).join(", ")}입니다.`);
    }
    if (handoffState.new_session_opening_message) lines.push(`다음 대화는 "${handoffState.new_session_opening_message}"로 바로 시작하면 됩니다.`);
  }
  lines.push("");
  lines.push("그러면 제가 지금 바로 다음 작업 기준으로 정리하겠습니다. 진행할까요?");
  return lines.join("\n");
}

export function buildSessionContinuityState(plan: BeaiTurnPlan): SessionContinuityState {
  const handoffState = plan.handoffState;
  const inProgress = compactBullets(
    [
      ...(handoffState?.in_progress || []),
      ...(handoffState?.topics || []).filter((topic) => !/session:|context|warn/i.test(topic))
    ],
    8
  );
  const openLoops = compactBullets(handoffState?.open_loops, 8);
  const lockedDecisions = compactBullets(
    [
      ...(handoffState?.decisions_made || []),
      ...(handoffState?.facts_locked || []),
      ...(handoffState?.carry_priority?.must_carry || [])
    ],
    8
  );
  const completed = compactBullets(handoffState?.completed, 8);
  const doNotCarry = compactBullets(
    [
      ...(handoffState?.do_not_carry || []),
      ...(handoffState?.carry_priority?.discard || [])
    ],
    8
  );
  const currentTrackSource = /다음\s*세션|새\s*세션|세션\s*연속성|이어갈\s*수\s*있게|handoff|continuity/i.test(plan.currentTurn.cleanInput)
    ? handoffState?.current_track || inferProjectStage(plan)
    : handoffState?.current_track || plan.continuityPatch.current_focus || inferProjectStage(plan);
  const currentTrack = compactText(currentTrackSource, 180) || inferProjectStage(plan);
  const nextAction =
    sanitizeContinuityStateText(handoffState?.next_action || handoffState?.next_work || inferProjectNextStep(plan)) ||
    "다음 작업 기준을 확인합니다.";
  const flowState = (plan as Partial<BeaiTurnPlan>).flowState;
  const decisionHandleSurface = (plan as Partial<BeaiTurnPlan>).decisionHandleSurface;
  const closureHandle =
    sanitizeContinuityStateText(handoffState?.closure_handle || flowState?.closureHandle || decisionHandleSurface?.primaryHandle || nextAction) ||
    "다음 판단 기준을 확인합니다.";
  const nextSessionOpening =
    sanitizeContinuityStateText(
        handoffState?.new_session_opening_message ||
        handoffState?.user_continuation_opening ||
        handoffState?.user_continuity_message ||
        `이전 대화의 다음 행동부터 이어가겠습니다: ${nextAction}`
    ) || "이전 대화에서 여기까지 정리해두었습니다.";

  return {
    currentTrack,
    completed,
    inProgress,
    openLoops,
    lockedDecisions,
    nextAction,
    closureHandle,
    doNotCarry,
    nextSessionOpening
  };
}

function inferConversationOrigin(plan: BeaiTurnPlan): string {
  const input = plan.currentTurn.cleanInput;
  const projectSignals = [
    ...(plan.handoffState?.topics || []),
    plan.handoffState?.current_track,
    plan.continuityPatch.current_focus,
    plan.objective
  ].filter((item): item is string => Boolean(item?.trim()));

  if (/OpenClaw|오픈클로|BEAI|비아이|레이어|플러그인/i.test([...projectSignals, input].join(" "))) {
    return "이 흐름은 OpenClaw 사용자가 느끼는 불편과 단절감을 줄이기 위한 BEAI Layer 작업에서 이어졌습니다.";
  }
  if (/세션|context|컨텍스트|압축|handoff|이어/i.test(input)) {
    return "이 흐름은 긴 대화가 끊기지 않고 다음 행동으로 이어지게 만들기 위한 세션 연속성 점검에서 이어졌습니다.";
  }
  return compactText(plan.handoffState?.current_track || plan.continuityPatch.current_focus || plan.objective, 180) || "이 흐름은 이전 대화의 작업 맥락에서 이어졌습니다.";
}

function inferConversationTurningPoints(plan: BeaiTurnPlan, continuity: SessionContinuityState): string[] {
  const points = compactBullets(
    [
      ...(plan.handoffState?.decisions_made || []),
      ...(plan.handoffState?.important_decisions || []),
      ...continuity.lockedDecisions,
      ...plan.constraints
    ],
    6
  );
  const derived: string[] = [];
  const input = plan.currentTurn.cleanInput;
  if (/검증|근거|현실|정합|허상|거짓/i.test(input)) derived.push("답변의 주장 강도는 확인된 근거를 넘지 않아야 한다는 기준이 중요해졌습니다.");
  if (/세션|context|컨텍스트|압축|새\s*세션|흐름/i.test(input)) derived.push("세션 전환은 정보 손실뿐 아니라 함께 온 흐름의 단절 문제로 다뤄야 한다는 기준이 생겼습니다.");
  if (/메모리|memory|기억|합의/i.test(input)) derived.push("새 세션은 handoff만이 아니라 선별된 기억과 합의 기준을 함께 써야 한다는 방향이 확인됐습니다.");
  return Array.from(new Set([...derived, ...points])).slice(0, 6);
}

function inferDiscardedPaths(plan: BeaiTurnPlan, continuity: SessionContinuityState): string[] {
  const discarded = compactBullets(
    [
      ...continuity.doNotCarry,
      ...(plan.handoffState?.carry_priority?.discard || [])
    ],
    5
  );
  const defaults: string[] = [];
  const input = plan.currentTurn.cleanInput;
  if (/OpenClaw|오픈클로|코어|기본/i.test(input) || plan.constraints.some((item) => /core|코어|기본|덮어쓰/i.test(item))) {
    defaults.push("OpenClaw 코어나 기본 정책을 바꾸는 방식은 제외합니다.");
  }
  if (/설치|배포|package|zip/i.test(input) || plan.constraints.some((item) => /배포|설치|package|zip/i.test(item))) {
    defaults.push("명시 지시 전에는 설치/배포 파일 생성으로 넘어가지 않습니다.");
  }
  defaults.push("긴 로그와 중간 시행착오는 새 세션 첫 바닥으로 길게 옮기지 않습니다.");
  return Array.from(new Set([...defaults, ...discarded])).slice(0, 5);
}

function inferUserConcerns(plan: BeaiTurnPlan): string[] {
  const input = plan.currentTurn.cleanInput;
  const concerns: string[] = [];
  if (/허상|거짓|근거|정합|현실|신뢰/i.test(input)) concerns.push("사용자는 AI 답변이 근거와 현실성을 잃지 않는 것을 중요하게 보고 있습니다.");
  if (/세션|context|컨텍스트|압축|새\s*세션|끊|단절|답답/i.test(input)) concerns.push("사용자는 세션 전환이 대화 흐름의 단절로 느껴지는 문제를 중요하게 보고 있습니다.");
  if (/초심자|불편|불안|막막/i.test(input)) concerns.push("사용자는 OpenClaw 초심자가 느끼는 불편과 불안을 줄이는 방향을 중요하게 보고 있습니다.");
  if (/메모리|memory|기억|합의/i.test(input)) concerns.push("사용자는 기억을 많이 남기는 것보다 필요한 기준만 정확히 이어가는 것을 중요하게 보고 있습니다.");
  return concerns.length > 0 ? concerns.slice(0, 5) : ["사용자가 다음 턴에서 다시 설명해야 하는 부담을 줄이는 것이 중요합니다."];
}

export function buildConversationArcCapsule(plan: BeaiTurnPlan, continuity = buildSessionContinuityState(plan)): ConversationArcCapsule {
  const turningPoints = inferConversationTurningPoints(plan, continuity);
  const nextIntent = sanitizeContinuityStateText(continuity.nextAction || plan.handoffState?.next_action || inferProjectNextStep(plan)) || "다음 행동을 확인합니다.";
  const normalizedNextIntent = nextIntent.replace(/[.!?。！？]\s*$/, "");
  return {
    origin: inferConversationOrigin(plan),
    turningPoints,
    discardedPaths: inferDiscardedPaths(plan, continuity),
    userConcerns: inferUserConcerns(plan),
    currentFlowContext:
      compactText(
        `현재 흐름은 ${continuity.currentTrack}이고, 다음 판단은 ${normalizedNextIntent}에 맞춰 이어집니다.`,
        220
      ) || "현재 흐름과 다음 행동을 짧게 이어받습니다.",
    nextIntent,
    updatedAt: new Date().toISOString()
  };
}

export function buildContinuityJudgmentProfile(
  plan: BeaiTurnPlan,
  continuity = buildSessionContinuityState(plan),
  arc = buildConversationArcCapsule(plan, continuity)
): ContinuityJudgmentProfile {
  const input = plan.currentTurn.cleanInput;
  const explicitContinuitySignal = /(다음\s*세션|새\s*세션|세션|연속성|이어|handoff|continuity|context|컨텍스트|압축|compaction)/i.test(input);
  const pressureLevel = plan.sessionPressure?.level || "ok";
  const splitRecommended = ["recommend_split", "warn_before_large_execution"].includes(String(pressureLevel)) || Boolean(plan.sessionPressure?.shouldAskForSplitApproval);
  const handoffReady = explicitContinuitySignal || Boolean(plan.handoffState) || pressureLevel === "organize_recommended";

  const continuityNeed: ContinuityJudgmentProfile["continuityNeed"] = splitRecommended
    ? "session_split_recommended"
    : handoffReady
      ? "handoff_ready"
      : plan.continuityPatch.current_focus || plan.continuityPatch.current_artifact
        ? "light"
        : "none";

  const carryForward = compactBullets(
    [
      continuity.currentTrack,
      ...continuity.lockedDecisions,
      ...arc.turningPoints,
      continuity.nextAction
    ],
    6
  );
  const doNotCarry = compactBullets(
    [
      ...continuity.doNotCarry,
      ...arc.discardedPaths,
      "긴 로그, 내부 디버그, 중간 시행착오는 새 세션 첫 바닥으로 옮기지 않습니다."
    ],
    6
  );

  const memoryBoundary: ContinuityJudgmentProfile["memoryBoundary"] =
    /기억|memory|장기|합의|agreement/i.test(input)
      ? "memory_review_required"
      : continuityNeed === "handoff_ready" || continuityNeed === "session_split_recommended"
        ? "session_only"
        : "project_state_candidate";
  const openingStyle: ContinuityJudgmentProfile["openingStyle"] =
    continuityNeed === "none" ? "none" : continuityNeed === "light" ? "short_resume" : "next_action_first";

  const answerGuidance = [
    "긴 대화를 통째로 요약하지 말고, 다음 판단을 바꾸는 기준만 이어갑니다.",
    "세션 연속성은 장기 기억이 아니며, 기억 승격은 별도 검토가 필요합니다.",
    "새 세션 첫 응답은 과거 설명보다 현재 위치와 다음 행동에서 시작합니다."
  ];
  if (continuityNeed === "session_split_recommended") {
    answerGuidance.push("세션 분리가 필요한 경우에도 사용자에게 불안을 주지 말고, 짧은 인계 기준과 다음 행동을 먼저 제시합니다.");
  }
  if (memoryBoundary === "memory_review_required") {
    answerGuidance.push("기억 후보, 합의 자산, 세션 연속성을 서로 섞지 않습니다.");
  }

  return {
    version: "0.4.8",
    mode: "guide_only",
    continuityNeed,
    carryForward,
    doNotCarry,
    memoryBoundary,
    openingStyle,
    answerGuidance: Array.from(new Set(answerGuidance)).slice(0, 5)
  };
}

function detectJudgmentFlowDomain(text: string): JudgmentFlowDomain {
  if (/(김제|집터|아버지|증조|토지|농막|건축|부동산|상시\s*거주|체류)/i.test(text)) return "family_asset";
  if (hasBusinessOperationsSignal(text)) return "business_operations";
  if (/(BEAI|비아이|OpenClaw|오픈클로|릴리즈|배포|버전|plugin|플러그인|runtime|gateway|telegram|hooks|doctor|rollback|zip)/i.test(text)) return "release_runtime";
  return "general";
}

function uniqueCompact(values: string[], limit: number): string[] {
  return compactBullets(Array.from(new Set(values.filter((item) => item.trim()))), limit);
}

function evidenceMatchesCheck(check: string, evidenceText: string, domain: JudgmentFlowDomain): boolean {
  const normalizedCheck = check.toLowerCase();
  const normalizedEvidence = evidenceText.toLowerCase();
  if (!normalizedCheck || !normalizedEvidence) return false;

  if (domain === "release_runtime") {
    if (/검증 또는 진단|verification|diagnosis|진단이 필요한/i.test(check)) {
      return /(doctor|No plugin issues|hooks|6\/6 ready|tasks|gateway|telegram|live plugin|BEAI Runtime|enabled|version|zip|manifest|package)/i.test(evidenceText);
    }
    if (/live plugin version|실제 live plugin version|live 적용/i.test(check)) {
      return /(live plugin|BEAI Runtime|beai-runtime|plugins list|enabled|version|\b\d+\.\d+\.\d+\b)/i.test(evidenceText);
    }
    if (/doctor|hooks|tasks|gateway|Telegram|검증 신호/i.test(check)) {
      return /(doctor|No plugin issues|hooks|6\/6 ready|tasks|gateway|telegram|reachable|configured|channel)/i.test(evidenceText);
    }
    if (/zip|manifest|패키지|package/i.test(check)) {
      return /(zip|manifest|openclaw\.plugin\.json|package\.json|package|candidate|not created|없음|미생성)/i.test(evidenceText);
    }
  }

  if (domain === "business_operations") {
    if (/순이익|profit|손익/i.test(check)) return /(순이익|영업이익|손익|profit|margin|마진)/i.test(evidenceText);
    if (/긴급투입|투입|시간/i.test(check)) return /(긴급투입|투입|시간|몸빵|shift|hours)/i.test(evidenceText);
    if (/2번 선수|대체|공정|백업/i.test(check)) return /(2번|백업|대체|공정|매뉴얼|SOP|backup)/i.test(evidenceText);
  }

  if (domain === "family_asset") {
    if (/지목|접도|상하수도|정화조|건축/i.test(check)) return /(지목|접도|도로|상하수도|정화조|건축|인허가|토지이음)/i.test(evidenceText);
    if (/상시 거주|간헐 체류/i.test(check)) return /(상시\s*거주|간헐\s*체류|주말|체류|거주)/i.test(evidenceText);
  }

  return normalizedCheck
    .split(/[\s,./|·:;()]+/)
    .filter((token) => token.length >= 3)
    .some((token) => normalizedEvidence.includes(token));
}

function buildEvidenceClosureReport(
  domain: JudgmentFlowDomain,
  unresolvedChecks: string[],
  ledger: EvidenceLedger
): EvidenceClosureReport {
  const evidencePool = ledger.toolVerified.filter((item) => item.trim());
  const closedChecks: string[] = [];
  const evidenceUsed: string[] = [];
  const remainingChecks: string[] = [];

  for (const check of uniqueCompact(unresolvedChecks, 12)) {
    const matchedEvidence = evidencePool.find((evidence) => evidenceMatchesCheck(check, evidence, domain));
    if (matchedEvidence) {
      closedChecks.push(check);
      evidenceUsed.push(matchedEvidence);
    } else {
      remainingChecks.push(check);
    }
  }

  const state: EvidenceClosureState =
    closedChecks.length === 0
      ? "open"
      : remainingChecks.length === 0
        ? "closed_by_evidence"
        : "partially_closed";

  return {
    state,
    closedChecks: uniqueCompact(closedChecks, 6),
    remainingChecks: uniqueCompact(remainingChecks, 6),
    evidenceUsed: uniqueCompact(evidenceUsed, 6)
  };
}

export function buildJudgmentFlowProfile(
  plan: Pick<
    BeaiTurnPlan,
    "currentTurn" | "judgmentFrame" | "realitySignalProfile" | "continuityJudgment" | "evidenceLedger" | "constraints" | "operatingJudgment"
  >
): JudgmentFlowProfile {
  const input = plan.currentTurn.cleanInput;
  const domain = detectJudgmentFlowDomain(input);
  const changedVariables: string[] = [];
  const stableCriteria: string[] = [];
  const unresolvedChecks: string[] = [];

  if (domain === "business_operations") {
    stableCriteria.push("매출 규모보다 오너 긴급투입, 현금 방어, 인력 백업 구조를 우선 판단합니다.");
    stableCriteria.push("성장 여부는 매장별 실제 순이익과 대표 투입 빈도를 분리해 본 뒤 판단합니다.");
    if (/(법인|종소세|법인세|세금|1억|자금)/i.test(input)) changedVariables.push("법인전환과 2027년 세금/현금 방어 변수");
    if (/(직원|인력|코어|몸빵|주방|빠지)/i.test(input)) changedVariables.push("코어 인력 이탈 시 오너가 현장에 빨려 들어가는 운영 변수");
    if (/(가족|아들|와이프|아내|시간)/i.test(input)) changedVariables.push("가족 시간과 부부 역할 소모 변수");
    unresolvedChecks.push("최근 6개월 매장별 실제 순이익");
    unresolvedChecks.push("대표 긴급투입 횟수와 시간");
    unresolvedChecks.push("매장별 2번 선수와 대체 가능한 공정");
  } else if (domain === "family_asset") {
    stableCriteria.push("가족사/정서 자산과 실제 거주 가능성을 분리해 판단합니다.");
    stableCriteria.push("상시 거주인지 간헐 체류인지 먼저 나눕니다.");
    if (/(대출|6천|3천|세금|공시지가|국가\s*소유|특조)/i.test(input)) changedVariables.push("취득 비용, 대출, 특조/토지 권리 변수");
    if (/(아버지|살고|농막|완세트)/i.test(input)) changedVariables.push("아버지의 거주 희망과 실제 생활 인프라 변수");
    unresolvedChecks.push("지목, 접도, 상하수도/정화조, 건축 가능성");
    unresolvedChecks.push("아버지 희망이 상시 거주인지 간헐 체류인지");
  } else if (domain === "release_runtime") {
    stableCriteria.push("적용, 검증, 배포, 롤백 상태를 서로 섞지 않습니다.");
    stableCriteria.push("live candidate와 clean distribution zip은 별도 상태로 둡니다.");
    if (/(버전|v0\.|0\.4|릴리즈|배포|zip)/i.test(input)) changedVariables.push("버전/패키지 라벨 정합성 변수");
    if (/(gateway|telegram|hooks|doctor|plugin|runtime|승인|approval)/i.test(input)) changedVariables.push("OpenClaw 런타임 상태와 hook/approval 경계 변수");
    unresolvedChecks.push("실제 live plugin version");
    unresolvedChecks.push("doctor/hooks/tasks/gateway/Telegram 검증 신호");
    unresolvedChecks.push("zip 생성 여부와 패키지 내부 manifest 정합성");
  } else {
    stableCriteria.push("이전 판단, 새 현실 신호, 미검증 지점, 다음 행동을 분리합니다.");
    unresolvedChecks.push(...plan.realitySignalProfile.needsVerification);
  }

  for (const item of plan.constraints) stableCriteria.push(item);
  for (const item of plan.realitySignalProfile.needsVerification) unresolvedChecks.push(item);

  const evidenceClosure = buildEvidenceClosureReport(domain, unresolvedChecks, plan.evidenceLedger);
  const remainingUnresolvedChecks = evidenceClosure.remainingChecks;
  const hasChangedVariables = changedVariables.length > 0;
  const hasUnresolved =
    remainingUnresolvedChecks.length > 0 ||
    (plan.operatingJudgment.claim.label === "unverified" && evidenceClosure.state !== "closed_by_evidence");
  const posture: JudgmentFlowPosture = hasUnresolved
    ? "hold_until_verified"
    : hasChangedVariables
      ? "revise_with_new_variable"
      : plan.continuityJudgment.continuityNeed !== "none"
        ? "preserve_prior_judgment"
        : "choose_next_action";

  const nextJudgmentHandle =
    domain === "business_operations"
      ? "다음 판단은 매장별 순이익, 오너 긴급투입, 세금 현금 방어를 같은 표에서 확인한 뒤 닫습니다."
      : domain === "family_asset"
        ? "다음 판단은 상시 거주 가능성, 간헐 체류 가능성, 건축/토지 규제를 확인한 뒤 닫습니다."
        : domain === "release_runtime"
          ? "다음 판단은 live 적용, 검증, 배포, 롤백 기준을 분리해 확인한 뒤 닫습니다."
          : "다음 판단은 확인된 기준과 새 변수만 반영해 갱신합니다.";

  return {
    version: "0.4.8",
    mode: "guide_only",
    domain,
    posture,
    stableCriteria: uniqueCompact(stableCriteria, 6),
    changedVariables: uniqueCompact(changedVariables, 6),
    unresolvedChecks: uniqueCompact(remainingUnresolvedChecks, 6),
    evidenceClosure,
    nextJudgmentHandle,
    avoid: [
      "이전 결론을 새 변수 없이 반복",
      "새 변수를 전체 결론으로 과대확장",
      "미검증 숫자나 원인을 확정 표현",
      "감정/가족/돈/운영 변수를 한 덩어리로 뭉개기"
    ],
    answerGuidance: [
      "먼저 이전 판단에서 유지되는 기준을 짧게 잡고, 새로 들어온 변수만 따로 반영합니다.",
      "판단이 바뀌는 조건과 아직 확인할 항목을 분리합니다.",
      "마지막에는 사용자가 다음에 쥘 판단 하나를 남깁니다.",
      evidenceClosure.state === "closed_by_evidence"
        ? "도구로 확인된 항목은 보류 사유로 반복하지 않고 확인된 기준으로 닫습니다."
        : "도구로 확인되지 않은 항목은 보류 조건으로 남깁니다."
    ]
  };
}

export function buildNewSessionContextPack(plan: BeaiTurnPlan): NewSessionContextPack {
  const continuity = buildSessionContinuityState(plan);
  const conversationArc = buildConversationArcCapsule(plan, continuity);
  const carry = compactBullets(
    [
      conversationArc.origin,
      ...conversationArc.turningPoints.slice(0, 3),
      ...continuity.lockedDecisions.slice(0, 3),
      continuity.nextAction
    ].map((item) => sanitizeContinuityStateText(item) || ""),
    8
  );
  const opening =
    compactText(
      `${continuity.nextSessionOpening} ${conversationArc.currentFlowContext}`,
      260
    ) || continuity.nextSessionOpening;
  return {
    opening,
    conversationArc,
    continuity,
    carry,
    doNotCarry: conversationArc.discardedPaths,
    generatedAt: new Date().toISOString()
  };
}

export function renderNextSessionSeed(plan: BeaiTurnPlan): string | null {
  const state = buildSessionContinuityState(plan);
  const arc = buildConversationArcCapsule(plan, state);
  if (!state.nextSessionOpening) return null;

  const lines = [state.nextSessionOpening];
  if (arc.origin) {
    lines.push("", arc.origin);
  }
  if (arc.turningPoints.length > 0) {
    lines.push("", `여기까지 온 이유는 ${arc.turningPoints.slice(0, 2).join(" / ")}입니다.`);
  }
  if (arc.userConcerns.length > 0) {
    lines.push("", `사용자가 중요하게 보는 것은 ${arc.userConcerns.slice(0, 2).join(" / ")}입니다.`);
  }
  if (state.currentTrack) {
    lines.push("", `현재 흐름은 ${state.currentTrack}입니다.`);
  }
  if (state.inProgress.length > 0) {
    lines.push("", `이번에는 ${state.inProgress.slice(0, 3).join(", ")}를 중심으로 바로 이어가겠습니다.`);
  }
  if (state.lockedDecisions.length > 0) {
    lines.push("", `이미 정한 기준은 ${state.lockedDecisions.slice(0, 3).join(", ")}입니다.`);
  }
  if (state.openLoops.length > 0) {
    lines.push("", `이번에는 ${state.openLoops.slice(0, 2).join(", ")}부터 확인하겠습니다.`);
  }
  if (state.doNotCarry.length > 0) {
    lines.push("", `다시 길게 끌고 오지 않을 것은 ${state.doNotCarry.slice(0, 2).join(", ")}입니다.`);
  }
  if (arc.discardedPaths.length > 0) {
    lines.push("", `새 세션에 무겁게 싣지 않을 것은 ${arc.discardedPaths.slice(0, 2).join(", ")}입니다.`);
  }
  if (state.nextAction) {
    lines.push("", `다음 행동은 ${state.nextAction}입니다.`);
  }
  return lines.join("\n");
}

export function renderWorkOrderReply(plan: BeaiTurnPlan): string {
  if (!plan.workOrder) return plan.objective;
  const lines = [
    "이건 바로 실행하기보다 먼저 작업 범위를 고정하는 게 안전합니다.",
    "",
    "이번 작업은 OpenClaw에게 다음 범위까지만 맡기는 쪽이 좋습니다.",
    "",
    "실행 단계:"
  ];
  for (const [index, step] of plan.workOrder.steps.entries()) lines.push(`${index + 1}. ${step}`);
  if (plan.workOrder.constraints.length > 0) {
    lines.push("", "제약 조건:");
    for (const item of plan.workOrder.constraints) lines.push(`- ${item}`);
  }
  lines.push("", "삭제, 외부 전송, 배포는 하지 않는 조건입니다.");
  lines.push("이 범위로 작업 지시를 만들면 됩니다.");
  if (plan.requiresUserConfirmation) lines.push("고위험 변경은 승인 전까지 진행하지 않습니다.");
  return lines.join("\n");
}

function isInstallGuideObjective(value: string | undefined): boolean {
  const normalized = String(value || "").toLowerCase();
  if (!normalized.trim()) return false;
  return /install|overlay|package|zip|telegram|messenger|setup|onboard|설치|패키지|오버레이|텔레그램|메신저|온보딩/.test(normalized);
}

export function renderInstallGuideReply(plan: BeaiTurnPlan, installContext?: InstallGuideSurfaceContext): string {
  const lines = [
    "이 요청은 바로 설치를 밀기보다 설치가이드 흐름으로 다루는 게 안전합니다.",
    "",
    "이번 설치는 기존 OpenClaw를 대체하는 작업이 아니라, 현재 환경 위에 BEAI Layer를 overlay로 얹는 작업으로 보겠습니다.",
    "",
    "먼저 이 순서로 진행하겠습니다.",
    "1. 이전 설치에서 남은 BEAI 소유 staging 잔재가 있는지 먼저 정리 대상으로만 확인합니다.",
    "2. 현재 OpenClaw 상태를 짧게 진단합니다.",
    "3. BEAI를 얹으면 무엇이 달라지고 무엇이 그대로인지 설명합니다.",
    "4. 유지하고 BEAI만 얹기 / BEAI 권장 방식 적용 / 지금은 건너뛰기 중 하나를 고르게 합니다.",
    "5. 승인 뒤에만 실제 설치를 실행합니다.",
    "6. gateway restart가 필요하면 무응답처럼 보일 수 있는 구간을 먼저 설명합니다.",
    "7. 설치 후에는 무엇이 바뀌고 무엇이 보존됐는지 웰컴 브리핑으로 정리합니다.",
    "",
    "이번 단계에서 자동으로 하지 않는 것은 이쪽입니다.",
    "- 기존 OpenClaw 삭제 또는 재설치",
    "- 기존 agents, skills, harnesses 자동 정리",
    "- 승인 없는 config 변경",
    "- memory 범위 확대 수정"
  ];

  if (installContext?.packageRef || installContext?.packageLabel) {
    const packageBits = [installContext.packageLabel, installContext.packageRef].filter(Boolean).join(" | ");
    lines.push("", "현재 대화에서 설치 패키지 후보도 함께 감지됐습니다.");
    lines.push(`- ${packageBits}`);
    if (installContext.packageSource) {
      lines.push(`- source: ${installContext.packageSource}`);
    }
    lines.push("- 이 첨부물 기준으로 preflight 설명부터 진행하고, 승인 뒤에만 실제 overlay install로 넘어가겠습니다.");
  }

  const relevantSignals = plan.roleSignals.filter((signal) =>
    ["Worker", "Verifier", "Facility"].includes(signal.role)
  );
  if (relevantSignals.length > 0) {
    lines.push("", "이번 요청에서 특히 중요한 역할은 이렇습니다.");
    for (const signal of relevantSignals.slice(0, 3)) {
      lines.push(`- ${signal.role}: ${signal.reason}`);
    }
  }

  if (plan.requiresUserConfirmation || isInstallGuideObjective(plan.objective)) {
    lines.push("", "원하시면 먼저 preflight만 실행해서 현재 OpenClaw 상태와 설치 영향 범위부터 설명하겠습니다.");
    lines.push("restart가 들어가면 그 직전에 10~30초 정도 응답이 없을 수 있다는 점도 먼저 알려드리겠습니다.");
  }

  return lines.join("\n");
}

export function renderInstallResumeReply(installContext?: InstallGuideSurfaceContext): string {
  const lines = [
    "아까 하던 BEAI 설치를 gateway restart 뒤에 이어받았습니다.",
    "",
    "이 구간에서는 잠깐 응답이 없어 보여도 이상으로 보지 않고, 먼저 설치가 끊긴 것인지 재시작 구간이었는지부터 분리해서 확인하겠습니다.",
    "",
    "지금부터 바로 이어서 볼 순서는 이렇습니다.",
    "1. gateway / daemon이 다시 올라왔는지 확인",
    "2. beai-runtime plugin이 실제로 enabled 상태인지 확인",
    "3. 설치 결과와 보존된 범위를 웰컴 브리핑으로 정리",
    "4. 지금 바로 해볼 첫 테스트를 한 줄로 제안"
  ];

  if (installContext?.packageRef || installContext?.packageLabel) {
    const packageBits = [installContext.packageLabel, installContext.packageRef].filter(Boolean).join(" | ");
    lines.push("", "이어받은 설치 패키지 기준은 아래입니다.");
    lines.push(`- ${packageBits}`);
  }

  if (installContext?.restartReason) {
    lines.push("", `현재 복귀 맥락: ${installContext.restartReason}`);
  }

  lines.push("", "이어서 진행하면 성공/실패, 현재 상태, 남은 이슈만 짧게 정리해드리겠습니다.");
  return lines.join("\n");
}

export function extractFinalResponse(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:^|\n)finalresponse\s*[:\-]?\s*\n?([\s\S]*?)(?:\n(?:debugsummary|디버그|internal)|$)/i,
    /(?:^|\n)최종\s*응답\s*[:\-]?\s*\n?([\s\S]*?)(?:\n(?:디버그|internal)|$)/i,
    /(?:^|\n)final\s*response\s*[:\-]?\s*\n?([\s\S]*?)(?:\n(?:debug|internal)|$)/i
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function safeFallbackReply(plan?: BeaiTurnPlan): string {
  if (!plan) return "핵심만 정리해서 다시 답하겠습니다.";
  if (isInternalRecoveryLeak(plan.currentTurn.cleanInput)) {
    return recoveryLeakFallbackReply();
  }
  if (plan.mode === "handoff") return renderWorkOrderReply(plan);
  if (plan.mode === "planning") return "실행 전에 범위와 우선순위를 먼저 정리하겠습니다.";
  return "핵심만 바로 답하고 내부 디버그 내용은 제외하겠습니다.";
}

function recoveryLeakFallbackReply(): string {
  return "방금 OpenClaw 작업 흐름이 중간에 끊겼던 신호가 있습니다. 내부 복구 문장은 제외하고, 현재 연결 상태와 이어서 처리할 일을 확인하겠습니다.";
}

export function isInternalRecoveryLeak(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    /\[system\]\s*your previous turn was interrupted/.test(normalized) ||
    /your previous turn was interrupted by a gateway restart/.test(normalized) ||
    /continue from the existing transcript/.test(normalized) ||
    /openclaw was waiting on tool\/model work/.test(normalized) ||
    /gateway restart while openclaw was waiting/.test(normalized)
  );
}

export function isInternalSessionDeliveryArtifact(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return false;
  const compact = normalized.replace(/\s+/g, " ").trim();
  return (
    /^\[inter-session message\]/i.test(normalized) ||
    /\bsourceTool\s*=\s*sessions_send\b/i.test(compact) ||
    /["']sourceTool["']\s*:\s*["']sessions_send["']/i.test(compact) ||
    /\bsessions_send\b/i.test(compact) && /\b(inter-session|internal delivery|session handoff|handoff seed)\b/i.test(compact)
  );
}

export function isInternalProcessSurface(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return false;
  if (/^\[beai internal process surface isolated\]/i.test(normalized)) return true;
  if (isInternalSessionDeliveryArtifact(normalized)) return true;
  if (isInternalRecoveryLeak(normalized)) return true;
  if (isCodexCommandApprovalSurface(normalized)) return true;
  if (isApprovalWaitSurface(normalized)) return true;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;

  const processLines = lines.filter((line) => INTERNAL_PROCESS_LINE_PATTERNS.some((pattern) => pattern.test(line)));
  const hasPinchingHeader = /^pinching$/i.test(lines[0] || "");
  const hasCodexApproval = /codex app-server command approval|codex app-server approval requested/i.test(normalized);
  const hasToolGlyph = /^[🧠📓🛠️🧩]\s/m.test(normalized);
  const startsAsProcess = INTERNAL_PROCESS_LINE_PATTERNS.some((pattern) => pattern.test(lines[0] || ""));
  const processRatio = processLines.length / lines.length;

  return (
    (hasPinchingHeader && processLines.length >= 2) ||
    (hasCodexApproval && startsAsProcess && processLines.length >= 1) ||
    (hasToolGlyph && startsAsProcess && processLines.length >= 2 && processRatio >= 0.5) ||
    (lines.length <= 4 && processRatio >= 0.75)
  );
}

export function renderInternalProcessSurfaceGuide(text?: string): string {
  if (isCodexCommandApprovalSurface(text)) return renderCodexCommandApprovalGuide(text);
  if (isApprovalWaitSurface(text)) return renderApprovalWaitGuide(text);
  if (isInternalRecoveryLeak(text)) return recoveryLeakFallbackReply();
  return [
    "멈춘 게 아니라 내부 작업 진행 신호입니다.",
    "",
    "OpenClaw가 메모리 검색, 파일 확인, 명령 승인 같은 내부 단계를 표시한 상태예요.",
    "이 내용은 사용자 지시나 최종 답변으로 취급하지 않고, 실제 완료/실패 여부는 별도 결과로 확인해야 합니다.",
    "",
    "오래 반복되면 tasks/status/logs 순서로 현재 작업이 살아 있는지 확인하는 게 맞습니다."
  ].join("\n");
}

function stripDebugTail(text: string): string {
  return text
    .replace(/\n(?:debugsummary|디버그\s*요약|debug\s*summary)\s*:[\s\S]*$/i, "")
    .replace(/\n(?:internal\s*notes|internal\s*debug)\s*:[\s\S]*$/i, "")
    .trim();
}

function stripLeadingOverlayBlock(text: string): string {
  if (!text.trimStart().toLowerCase().startsWith("[beai runtime overlay]")) return text.trim();
  const divider = text.indexOf("\n\n");
  if (divider === -1) return "";
  return text.slice(divider + 2).trim();
}

const INTERNAL_SURFACE_LABELS = [
  "BEAI Runtime Overlay",
  "debugSummary",
  "handoffState",
  "diagnosticFamily",
  "finalResponse",
  "current_turn_packet",
  "input_level_companion",
  "response_strategy",
  "execution_mode",
  "response_state",
  "judgment_frame",
  "response_role",
  "risk_level",
  "approval_required",
  "workflow_state_ledger",
  "decision_handle_surface",
  "work_order_outline"
] as const;

function countQuestions(text: string): number {
  const questionMarks = text.match(/[?？]/g)?.length || 0;
  const koreanQuestionLines = text
    .split("\n")
    .filter((line) => /(할까요|될까요|인가요|까요|습니까|나요)\s*$/.test(line.trim())).length;
  return Math.max(questionMarks, koreanQuestionLines);
}

function stripInternalSurfaceLabels(text: string): string {
  let result = text;
  for (const label of INTERNAL_SURFACE_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`^\\s*[-*]?\\s*${escaped}\\s*[:=].*$`, "gim"), "");
    result = result.replace(new RegExp(`\\[?${escaped}\\]?\\s*[:=]\\s*[^\\n.。!?！？]*`, "gim"), "");
  }
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

function limitSurfaceQuestions(text: string): string {
  let kept = false;
  const segments = text
    .replace(/([?？])/g, "$1\n")
    .split("\n");
  const filtered = segments.filter((segment) => {
    const trimmed = segment.trim();
    const isQuestion = /[?？]\s*$/.test(trimmed) || /(할까요|될까요|인가요|까요|습니까|나요)\s*$/.test(trimmed);
    if (!isQuestion) return true;
    if (!kept) {
      kept = true;
      return true;
    }
    return false;
  });
  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function detectLastHandle(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const last = normalized.split(/(?<=[.!?。！？]|다\.|요\.)\s+/).filter(Boolean).at(-1) || normalized;
  if (/[?？]\s*$/.test(last)) return false;
  return /(기준|확인|진행|보류|조건|다음|완료|적용|검증|남습니다|됩니다|하겠습니다|했습니다|입니다)\.?$/.test(last);
}

function detectArtifactDelayedByExplanation(text: string, plan?: BeaiTurnPlan): boolean {
  if (!plan || !["artifact", "plan", "work_order"].includes(plan.judgmentFrame.responseRole)) return false;
  const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean) || "";
  if (!firstLine) return false;
  return /^(먼저|우선|설명|배경|요약하면|제가 할 일|이 요청은)/.test(firstLine) && !/^#|^- |\d+\. |```/.test(firstLine);
}

function appendLastHandle(text: string, plan?: BeaiTurnPlan): string {
  if (!plan) return text;
  if (detectLastHandle(text)) return text;
  const deferCondition = plan.judgmentFrame.deferCondition;
  if (!deferCondition) return text.trim();
  if (isInternalRecoveryLeak(deferCondition)) return text.trim();
  return `${text.trim()}\n\n보류 조건은 ${deferCondition}`;
}

export function checkSurfaceLanguage(text: string, plan?: BeaiTurnPlan): SurfaceLanguageCheck {
  const internalLabelsFound = INTERNAL_SURFACE_LABELS.filter((label) => new RegExp(`\\b${label}\\b`, "i").test(text));
  const questionCount = countQuestions(text);
  const hasLastHandle = detectLastHandle(text);
  const artifactDelayedByExplanation = detectArtifactDelayedByExplanation(text, plan);
  const suggestions: string[] = [];
  if (internalLabelsFound.length > 0) suggestions.push("내부 구조 라벨을 사용자 언어로 바꿉니다.");
  if (questionCount > 1) suggestions.push("질문을 하나 이하로 줄입니다.");
  if (!hasLastHandle) suggestions.push("마지막에 기준, 행동, 확인 신호, 보류 조건 중 하나를 남깁니다.");
  if (artifactDelayedByExplanation) suggestions.push("산출물 요청은 설명보다 결과물을 먼저 배치합니다.");
  return {
    internalLabelsFound,
    questionCount,
    hasLastHandle,
    artifactDelayedByExplanation,
    rewriteSuggestion: suggestions.length > 0 ? suggestions.join(" ") : undefined
  };
}

export function applySurfaceLanguageGuard(text: string, plan?: BeaiTurnPlan): string {
  const stripped = stripInternalSurfaceLabels(text);
  const limited = limitSurfaceQuestions(stripped);
  const grounded = softenChoiceDominationLanguage(
    softenUnverifiedActionAndHighStakesClaims(
      softenInterpersonalSycophancyLanguage(softenOverclaimingLanguage(limited, plan)),
      plan
    ),
    plan
  );
  return appendLastHandle(grounded, plan);
}

export function sanitizeUserFacingReply(text: string, plan?: BeaiTurnPlan): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (isCodexCommandApprovalSurface(trimmed)) {
    return applySurfaceLanguageGuard(renderCodexCommandApprovalGuide(trimmed), plan);
  }

  if (isApprovalWaitSurface(trimmed)) {
    return applySurfaceLanguageGuard(renderApprovalWaitGuide(trimmed), plan);
  }

  if (isInternalRecoveryLeak(trimmed)) {
    return applySurfaceLanguageGuard(recoveryLeakFallbackReply(), plan);
  }

  if (isInternalProcessSurface(trimmed)) {
    return applySurfaceLanguageGuard(renderInternalProcessSurfaceGuide(trimmed), plan);
  }

  const finalOnly = extractFinalResponse(trimmed);
  if (finalOnly) return applySurfaceLanguageGuard(finalOnly, plan);

  const stripped = stripDebugTail(stripLeadingOverlayBlock(trimmed));
  if (stripped && stripped !== trimmed) return applySurfaceLanguageGuard(stripped, plan);

  const lowered = trimmed.toLowerCase().replace(/\s+/g, "");
  if (INTERNAL_REPLY_TERMS.some((term) => lowered.includes(term.replace(/\s+/g, "")))) {
    return safeFallbackReply(plan);
  }

  return applySurfaceLanguageGuard(trimmed, plan);
}

export function isCodexCommandApprovalSurface(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const hasCodexApproval =
    normalized.includes("codex app-server command approval") ||
    normalized.includes("tool: codex_command_approval") ||
    normalized.includes("plugin: openclaw-codex-app-server");
  const hasApprovalCommand = normalized.includes("/approve") || normalized.includes("allow-once");
  const hasCommandPreview = normalized.includes("description: command:") || normalized.includes("proposed exec policy:");
  return hasCodexApproval && (hasApprovalCommand || hasCommandPreview);
}

export function isApprovalWaitSurface(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const hasApprovalCommand = normalized.includes("/approve") || normalized.includes("allow once") || normalized.includes("allow-once");
  const hasApprovalCard = normalized.includes("plugin approval required") || normalized.includes("approval required");
  const hasDenyChoice = normalized.includes("deny");
  const hasSkillWorkshop = normalized.includes("skill_workshop") || normalized.includes("workspace skill proposal");
  const hasCodexCommandApproval = isCodexCommandApprovalSurface(text);
  if (hasCodexCommandApproval) return true;
  return hasApprovalCommand && hasDenyChoice && (hasApprovalCard || hasSkillWorkshop || APPROVAL_WAIT_TERMS.some((term) => normalized.includes(term)));
}

export function classifyTelegramUxState(text: string | undefined): TelegramUxState | null {
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  if (/approval (request )?(expired|timed out)|승인.*(만료|시간 초과)|expired approval/.test(normalized)) {
    return {
      kind: "approval_expired",
      confidence: "high",
      userMeaning: "승인 대기 시간이 지나 이전 승인 요청이 만료된 상태입니다.",
      nextAction: "같은 작업을 다시 요청하면 새 승인 카드가 뜹니다. 이전 승인 ID는 다시 쓰지 않는 것이 안전합니다.",
      shouldAppendToPayload: true
    };
  }

  if (isInternalRecoveryLeak(text) || /gateway restart|gateway restarted|게이트웨이.*재시작|재시작.*게이트웨이/.test(normalized)) {
    return {
      kind: "gateway_restart_recovery",
      confidence: "high",
      userMeaning: "Gateway 재시작 때문에 진행 중이던 한 턴이 끊겼거나 이어받는 중입니다.",
      nextAction: "처음부터 다시 설치하지 말고, 현재 상태 확인 후 끊긴 작업만 이어가는 것이 좋습니다.",
      shouldAppendToPayload: true
    };
  }

  if (isCodexCommandApprovalSurface(text)) {
    return {
      kind: "codex_command_approval_wait",
      confidence: "high",
      userMeaning: "Codex app-server가 내부 명령 실행 전에 별도 승인을 요구한 상태입니다.",
      nextAction: "사용자 대화 응답으로 취급하지 말고, 이 명령이 정말 필요한지 좁혀 판단합니다. 단순 상태 확인이면 반복 실행을 멈추고 다른 읽기 전용 확인 경로를 사용합니다.",
      shouldAppendToPayload: true
    };
  }

  if (isApprovalWaitSurface(text)) {
    return {
      kind: "approval_wait",
      confidence: "high",
      userMeaning: "OpenClaw가 플러그인/스킬 적용 전에 사용자 승인을 기다리는 상태입니다.",
      nextAction: "계속하려면 Allow Once 또는 /approve ... allow-once를 선택하고, 취소하려면 Deny를 선택하면 됩니다.",
      shouldAppendToPayload: true
    };
  }

  if (isInternalProcessSurface(text)) {
    return {
      kind: "internal_progress_surface",
      confidence: "high",
      userMeaning: "OpenClaw가 내부 작업 진행/승인/도구 호출 상태를 표시한 것입니다.",
      nextAction: "이 표면을 사용자 지시로 해석하지 말고, 실제 완료/실패 결과가 따로 나오는지 확인합니다.",
      shouldAppendToPayload: true
    };
  }

  if (/waiting on tool\/model work|tool\/model work|long[- ]running|still running|작업.*진행 중|도구.*실행 중|모델.*응답.*대기|시간이 걸릴 수/.test(normalized)) {
    return {
      kind: "long_running_work",
      confidence: "medium",
      userMeaning: "응답 경로가 죽은 것이 아니라 도구 실행이나 모델 작업이 오래 걸리는 상태일 수 있습니다.",
      nextAction: "잠시 기다린 뒤 상태를 물어보고, 오래 멈추면 tasks/status/logs 순서로 좁혀 확인합니다.",
      shouldAppendToPayload: true
    };
  }

  const hasHealthyEmptyQueue = /(?:^|[^0-9])0 queued\b/.test(normalized) || /대기(?:열| 작업)?\s*0/.test(normalized);
  if (!hasHealthyEmptyQueue && /task queued|queued task|background task|queued|대기열|작업.*대기/.test(normalized) && /task|작업/.test(normalized)) {
    return {
      kind: "queued_task",
      confidence: "medium",
      userMeaning: "작업이 즉시 실행되지 않고 대기열 또는 백그라운드 상태에 있을 수 있습니다.",
      nextAction: "현재 실행 중인지 확인하려면 tasks 상태를 보고, 실행 중이면 완료 또는 실패 보고를 기다립니다.",
      shouldAppendToPayload: true
    };
  }

  if (/delivery failed|failed to send|send failed|reply delivery failed|발송.*실패|전송.*실패|메시지.*실패/.test(normalized)) {
    return {
      kind: "delivery_failure",
      confidence: "high",
      userMeaning: "답변 생성보다 메시지 발송 단계에서 문제가 생긴 상태입니다.",
      nextAction: "Gateway와 Telegram 채널 상태를 먼저 확인하고, 필요하면 발송 테스트를 실행합니다.",
      shouldAppendToPayload: true
    };
  }

  if (/telegram.*(disconnected|offline|disabled)|channel.*(disconnected|offline|disabled)|gateway.*unreachable|transport.*offline|텔레그램.*(끊|오프라인|비활성)|채널.*(끊|오프라인|비활성)/.test(normalized)) {
    return {
      kind: "channel_disconnected",
      confidence: "high",
      userMeaning: "대화 채널 또는 gateway 연결이 끊겼을 가능성이 높은 상태입니다.",
      nextAction: "OpenClaw status와 Telegram channel 상태를 확인하고, 연결 복구 후 짧은 왕복 테스트를 합니다.",
      shouldAppendToPayload: true
    };
  }

  return null;
}

export function renderApprovalWaitGuide(text?: string): string {
  const expiresMatch = text?.match(/Expires in:\s*([0-9]+\s*s)/i);
  const expiresText = expiresMatch?.[1] ? `${expiresMatch[1]} 안에` : "정해진 시간 안에";
  return [
    "멈춘 게 아니라 승인 대기 상태입니다.",
    "",
    "OpenClaw가 스킬/플러그인 적용 전에 사용자 확인을 기다리고 있어요.",
    `계속하려면 ${expiresText} Allow Once를 누르거나 표시된 /approve ... allow-once 명령을 보내면 됩니다.`,
    "취소하려면 Deny를 선택하면 됩니다.",
    "",
    "저는 승인을 대신 누르지 않고, 이 대기가 무엇을 뜻하는지만 설명합니다."
  ].join("\n");
}

export function renderCodexCommandApprovalGuide(text?: string): string {
  const commandMatch = text?.match(/Description:\s*Command:\s*([^\n]+)/i);
  const command = commandMatch?.[1]?.trim();
  return [
    "멈춘 게 아니라 Codex app-server 명령 승인 대기 상태입니다.",
    "",
    command ? `요청된 명령: ${command}` : "OpenClaw 내부에서 명령 실행 승인을 요청했습니다.",
    "이 표면은 사용자 지시나 최종 답변이 아니며, 반복 출력되면 같은 진단 명령이 승인 없이 재시도되는 흐름일 가능성이 큽니다.",
    "",
    "BEAI는 이 내용을 대화 지시로 저장하지 않습니다. 필요한 경우 안전한 읽기 전용 확인으로 좁히고, 쓰기/삭제/재시작/설치 명령은 사용자 승인을 유지해야 합니다."
  ].join("\n");
}

export function renderTelegramUxStateGuide(state: TelegramUxState): string {
  if (state.kind === "codex_command_approval_wait") return renderCodexCommandApprovalGuide();
  if (state.kind === "approval_wait") return renderApprovalWaitGuide();
  return [
    "현재 상태 안내입니다.",
    "",
    state.userMeaning,
    state.nextAction,
    "",
    "저는 이 상태를 자동으로 우회하지 않고, 사용자가 다음 선택을 이해할 수 있게 설명합니다."
  ].join("\n");
}

function isLikelyMetaArtifact(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return META_ARTIFACT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function summarizeReply(text: string): string {
  return firstSentence(text || "응답이 생성되었습니다.");
}

function compactText(value: string | undefined, limit: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

function compactList(values: string[] | undefined, itemLimit: number, textLimit: number): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  const compacted = values
    .map((value) => compactText(value, textLimit))
    .filter((value): value is string => Boolean(value))
    .slice(0, itemLimit);
  return compacted.length > 0 ? compacted : undefined;
}

function normalizeHeaderLabel(value: string): string {
  return value
    .replace(/^[#>`\-\*\d.\)\s_]+/, "")
    .replace(/[`*_]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mapExecutionHeader(label: string): keyof ExecutionReviewDraft | null {
  const normalized = normalizeHeaderLabel(label);
  if (normalized === "what was checked" || normalized === "무엇을 확인했는지") return "whatChecked";
  if (normalized === "what was changed" || normalized === "무엇을 적용했는지" || normalized === "무엇을 바꿨는지") return "whatChanged";
  if (normalized === "what was not changed" || normalized === "무엇을 바꾸지 않았는지") return "whatNotChanged";
  if (normalized === "result status" || normalized === "결과 상태") return "resultStatus";
  if (
    normalized === "remaining risks or unverified items" ||
    normalized === "남아 있는 미확인 또는 리스크" ||
    normalized === "남은 리스크 또는 미검증 항목"
  ) {
    return "remainingRisks";
  }
  if (normalized === "recommended next step" || normalized === "권장 다음 단계" || normalized === "다음 조치") return "recommendedNextStep";
  return null;
}

type ExecutionReviewDraft = {
  whatChecked?: string[];
  whatChanged?: string[];
  whatNotChanged?: string[];
  resultStatus?: string;
  rawResultStatus?: string;
  remainingRisks?: string[];
  recommendedNextStep?: string;
};

const EXECUTION_NOTE_EXACT_MAP: Record<string, string> = {
  "local build": "로컬 빌드",
  "runtime tests": "런타임 테스트",
  "plugin tests": "플러그인 테스트",
  "turn classification": "턴 분류",
  "final/debug split": "final/debug 분리",
  "runtime core files": "runtime core files",
  "runtime wiring": "runtime wiring",
  "runtime install wiring": "runtime install wiring",
  "plugin wiring": "plugin wiring",
  "installation wiring not finished": "설치 wiring",
  "live surface smoke check not run yet": "실제 표면 점검",
  "live telegram roundtrip not checked yet": "실제 Telegram 왕복 응답",
  "wire runtime into teammate install path": "설치 경로에 runtime wiring을 연결하면 됩니다.",
  "run one live surface smoke check": "실제 표면에서 한 번 더 점검하면 됩니다.",
  "run one live telegram roundtrip check": "Telegram에서 실제 메시지를 한 번 보내고 왕복 응답이 정상적으로 돌아오는지 확인하면 됩니다."
};

function localizeExecutionItem(value: string, kind: "checked" | "changed" | "untouched" | "risk" | "nextStep"): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const exact = EXECUTION_NOTE_EXACT_MAP[trimmed.toLowerCase()];
  if (exact) return exact;

  if (kind === "risk") {
    if (/live telegram roundtrip/i.test(trimmed)) return "실제 Telegram 왕복 응답";
    if (/live surface smoke check/i.test(trimmed)) return "실제 표면 점검";
  }

  if (kind === "nextStep") {
    if (/telegram/i.test(trimmed) && /roundtrip/i.test(trimmed)) {
      return "Telegram에서 실제 메시지를 한 번 보내고 왕복 응답이 정상적으로 돌아오는지 확인하면 됩니다.";
    }
    if (/surface smoke check/i.test(trimmed)) {
      return "실제 표면에서 한 번 더 점검하면 됩니다.";
    }
  }

  return trimmed;
}

function localizeExecutionDraft(draft: ExecutionReviewDraft): ExecutionReviewDraft {
  return {
    ...draft,
    whatChecked: (draft.whatChecked || []).map((item) => localizeExecutionItem(item, "checked")).filter(Boolean),
    whatChanged: (draft.whatChanged || []).map((item) => localizeExecutionItem(item, "changed")).filter(Boolean),
    whatNotChanged: (draft.whatNotChanged || []).map((item) => localizeExecutionItem(item, "untouched")).filter(Boolean),
    remainingRisks: (draft.remainingRisks || []).map((item) => localizeExecutionItem(item, "risk")).filter(Boolean),
    recommendedNextStep: draft.recommendedNextStep
      ? localizeExecutionItem(draft.recommendedNextStep, "nextStep")
      : undefined
  };
}

function splitBulletItems(lines: string[]): string[] {
  return lines
    .flatMap((line) => line.split(/\s*\|\s*/))
    .map((line) => line.replace(/^[\-\*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function joinNaturalItems(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join(", ");
}

function isSentenceLikeText(value: string): boolean {
  const trimmed = value.trim();
  return (
    /[.!?]$/.test(trimmed) ||
    /(습니다|니다|돼요|해요|했다|했다고|않았습니다|못했습니다|필요합니다)$/.test(trimmed) ||
    /:\s*\S+/.test(trimmed)
  );
}

function allSentenceLike(items: string[]): boolean {
  return items.length > 0 && items.every((item) => isSentenceLikeText(item));
}

function renderExecutionReviewFallback(draft: ExecutionReviewDraft): string | null {
  const lines: string[] = [];
  const checked = draft.whatChecked || [];
  const changed = draft.whatChanged || [];
  const risks = draft.remainingRisks || [];
  const statusLine = (draft.rawResultStatus || "").replace(/^`?(exists|missing|ok|pass|failed)`?\s*/i, "").trim();
  const nextStep = (draft.recommendedNextStep || "").trim();

  if (allSentenceLike(checked)) {
    lines.push(...checked);
  } else if (checked.length > 0) {
    lines.push(`${joinNaturalItems(checked)} 범위는 확인했습니다.`);
  }

  if (allSentenceLike(changed)) {
    lines.push(...changed);
  } else if (changed.length > 0) {
    lines.push(`${joinNaturalItems(changed)}도 반영됐습니다.`);
  }

  if (statusLine) {
    lines.push(statusLine);
  }

  if (allSentenceLike(risks)) {
    risks.forEach((risk, index) => {
      if (index === 0) {
        lines.push(risk.startsWith("다만 ") ? risk : `다만 ${risk}`);
      } else {
        lines.push(risk);
      }
    });
  } else if (risks.length > 0) {
    lines.push(`다만 ${joinNaturalItems(risks)}은 아직 확인하지 못했습니다.`);
  }

  if (nextStep) {
    lines.push(nextStep.startsWith("다음") || nextStep.startsWith("필요") ? nextStep : `다음으로는 ${nextStep}`);
  }

  return lines.filter(Boolean).join("\n").trim() || null;
}

function mapExecutionResultState(draft: ExecutionReviewDraft): ExecutionResultState {
  const verified = draft.whatChecked || [];
  const unverified = draft.remainingRisks || [];
  switch (draft.resultStatus) {
    case "succeeded":
      return verified.length > 0 && unverified.length === 0 ? "completed" : "unverified";
    case "partially_verified":
      return "partial";
    case "not_verified":
      return "unverified";
    case "failed":
      return "failed";
    case "blocked":
      return "blocked";
    case "skipped":
      return "skipped";
    default:
      return verified.length > 0 ? "partial" : "unverified";
  }
}

function defaultNextCheckForState(state: ExecutionResultState, draft: ExecutionReviewDraft): string {
  if (draft.recommendedNextStep?.trim()) return draft.recommendedNextStep.trim();
  if (draft.remainingRisks?.[0]) return `${draft.remainingRisks[0]}을 먼저 확인합니다.`;
  if (state === "completed") return "필요하면 실제 표면에서 한 번 더 확인합니다.";
  if (state === "failed") return "실패 지점을 하나로 좁혀 다시 확인합니다.";
  if (state === "blocked") return "막힌 조건이 풀리는지 먼저 확인합니다.";
  if (state === "skipped") return "건너뛴 이유가 여전히 유효한지 확인합니다.";
  return "실제 결과를 한 번 더 확인합니다.";
}

export function buildExecutionReview(text: string): ExecutionReview | null {
  const draft = parseExecutionReviewDraft(text);
  if (!draft) return null;
  const localizedDraft = localizeExecutionDraft(draft);
  const resultState = mapExecutionResultState(localizedDraft);
  const changed = localizedDraft.whatChanged || [];
  const verified = localizedDraft.whatChecked || [];
  return {
    attempted: Array.from(new Set([...verified, ...changed])),
    changed,
    verified,
    notChanged: localizedDraft.whatNotChanged || [],
    unverified: localizedDraft.remainingRisks || [],
    resultState,
    nextCheck: defaultNextCheckForState(resultState, localizedDraft)
  };
}

export function classifyInstallResultLabel(text: string, review?: ExecutionReview | null): InstallResultLabel | null {
  const normalized = String(text || "").toLowerCase();
  const isInstallReport = /(install|설치|beai layer|beai runtime|plugin|플러그인|gateway|telegram|텔레그램|roundtrip|왕복)/i.test(text);
  if (!isInstallReport) return null;

  if (/(disabled|비활성화|꺼졌|disabled 상태)/i.test(text) && /beai|runtime|plugin|플러그인/i.test(text)) {
    return "disabled";
  }

  if (review?.resultState === "blocked" || /(blocked|gateway.*unreachable|telegram.*disconnected|설치\s*중단|차단|막힌|불가)/i.test(text)) {
    return "blocked";
  }

  const hasRuntimeLoaded = /(loaded|enabled|로드|활성|설치됨|설치 완료|installed)/i.test(text) && /(beai|runtime|plugin|플러그인)/i.test(text);
  const hasHooksReady = /(hooks?.*(ready|정상|통과)|6\/6 ready|훅.*ready|훅.*정상)/i.test(text);
  const hasDoctorOk = /(plugins doctor.*(no|문제 없음|통과)|doctor.*(no plugin issues|문제 없음|통과))/i.test(text);
  const hasGatewayReachable = /(gateway.*(reachable|running|ok|정상)|게이트웨이.*(reachable|실행|정상|ok))/i.test(text);
  const hasTelegramOk = /(telegram.*(on\s*\/\s*ok|ok|connected|정상)|텔레그램.*(on\s*\/\s*ok|ok|연결|정상))/i.test(text);
  const hasRoundtrip = /(roundtrip.*(checked|verified|ok|success)|왕복.*(확인|성공|정상)|실제.*telegram.*왕복.*확인|telegram.*실제.*응답.*확인)/i.test(text);
  const roundtripMissing = /(roundtrip.*not checked|live telegram roundtrip not checked|왕복.*미확인|왕복.*확인.*못|telegram.*왕복.*확인.*못|텔레그램.*왕복.*미확인)/i.test(text);
  const taskPressureSafe = /(0 queued.*0 running|task pressure.*0|background task.*0|작업.*0 queued|대기.*0.*실행.*0)/i.test(text);

  if (roundtripMissing) return "partial";
  if (hasRuntimeLoaded && hasHooksReady && hasDoctorOk && hasGatewayReachable && hasTelegramOk && hasRoundtrip && taskPressureSafe) {
    return "complete";
  }
  if (hasRuntimeLoaded || hasHooksReady || hasDoctorOk || hasGatewayReachable || hasTelegramOk) {
    return "partial";
  }
  if (review?.resultState === "failed") return "blocked";
  return null;
}

export function classifyTelegramEvidenceLevelFromText(text: string): OperatingTelegramEvidenceLevel {
  const normalized = String(text || "");
  const roundtripMissing =
    /(roundtrip.*not checked|live telegram roundtrip not checked|왕복.*미확인|왕복.*확인.*못|telegram.*왕복.*확인.*못|텔레그램.*왕복.*미확인)/i.test(
      normalized
    );
  if (roundtripMissing) {
    const hasGatewayChannelWhileMissing =
      /(telegram.*(on\s*\/\s*ok|\bok\b|connected|정상)|텔레그램.*(on\s*\/\s*ok|\bok\b|연결|정상)|gateway.*telegram.*(\bok\b|reachable|connected)|channel.*telegram.*(\bok\b|reachable|connected))/i.test(
        normalized
      );
    return hasGatewayChannelWhileMissing ? "gateway_channel_reachable" : "configured";
  }
  const hasRoundtrip =
    /(roundtrip.*(checked|verified|ok|success)|왕복.*(확인|성공|정상)|실제.*telegram.*왕복.*확인|telegram.*실제.*응답.*확인|live\s*telegram\s*roundtrip\s*verified)/i.test(
      normalized
    );
  if (hasRoundtrip) return "live_roundtrip_verified";
  const hasGatewayChannel =
    /(telegram.*(on\s*\/\s*ok|\bok\b|connected|정상)|텔레그램.*(on\s*\/\s*ok|\bok\b|연결|정상)|gateway.*telegram.*(\bok\b|reachable|connected)|channel.*telegram.*(\bok\b|reachable|connected))/i.test(
      normalized
    );
  if (hasGatewayChannel) return "gateway_channel_reachable";
  const hasConfigured = /(telegram.*(configured|enabled|token config)|텔레그램.*(설정|활성|토큰))/i.test(normalized);
  if (hasConfigured) return "configured";
  return "not_applicable";
}

function installResultLabelText(label: InstallResultLabel): string {
  switch (label) {
    case "complete":
      return "설치 판정: complete";
    case "partial":
      return "설치 판정: partial";
    case "blocked":
      return "설치 판정: blocked";
    case "disabled":
      return "설치 판정: disabled";
  }
}

function telegramEvidenceSurfaceText(level: OperatingTelegramEvidenceLevel): string | null {
  switch (level) {
    case "configured":
      return "Telegram 증거: configured - 설정은 확인됐지만 Gateway 채널 도달성과 실제 왕복은 아직 별도 확인이 필요합니다.";
    case "gateway_channel_reachable":
      return "Telegram 증거: gateway_channel_reachable - OpenClaw/Gateway 기준 채널은 도달 가능하지만, 실제 사용자-visible 왕복 확인과는 구분합니다.";
    case "live_roundtrip_verified":
      return "Telegram 증거: live_roundtrip_verified - 실제 Telegram 왕복 응답까지 확인된 상태입니다.";
    case "not_applicable":
      return null;
  }
}

function renderStructuredExecutionReview(review: ExecutionReview): string {
  const lines: string[] = [];
  if (review.resultState === "completed") {
    lines.push("확인된 범위에서는 완료로 볼 수 있습니다.");
  } else if (review.resultState === "partial") {
    lines.push("적용은 진행됐지만, 검증은 아직 이 범위까지입니다.");
  } else if (review.resultState === "unverified") {
    lines.push("작업 신호는 있지만, 아직 검증된 상태로 말할 수는 없습니다.");
  } else if (review.resultState === "failed") {
    lines.push("실행은 실패한 상태입니다.");
  } else if (review.resultState === "blocked") {
    lines.push("현재는 막힌 조건 때문에 진행이 멈춘 상태입니다.");
  } else if (review.resultState === "skipped") {
    lines.push("이번 실행은 건너뛴 상태입니다.");
  }

  if (review.changed.length > 0) lines.push(`${joinNaturalItems(review.changed)}은 반영됐습니다.`);
  if (review.verified.length > 0) lines.push(`${joinNaturalItems(review.verified)} 범위는 확인했습니다.`);
  if (review.notChanged.length > 0) lines.push(`${joinNaturalItems(review.notChanged)}은 바꾸지 않았습니다.`);
  if (review.unverified.length > 0) lines.push(`다만 ${joinNaturalItems(review.unverified)}은 아직 확인하지 못했습니다.`);
  lines.push(review.nextCheck.startsWith("다음") ? review.nextCheck : `다음으로는 ${review.nextCheck}`);
  return lines.join("\n");
}

function parseExecutionReviewDraft(text: string): ExecutionReviewDraft | null {
  const lines = text.split("\n").map((line) => line.trimEnd());
  const sections = new Map<keyof ExecutionReviewDraft, string[]>();
  let currentKey: keyof ExecutionReviewDraft | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentKey) sections.get(currentKey)?.push("");
      continue;
    }

    const colonMatch = line.match(/^([^\n:]{2,120}):\s*(.*)$/);
    if (colonMatch) {
      const key = mapExecutionHeader(colonMatch[1]);
      if (key) {
        currentKey = key;
        const bucket = sections.get(key) || [];
        if (colonMatch[2]) bucket.push(colonMatch[2].trim());
        sections.set(key, bucket);
        continue;
      }
    }

    const bareKey = mapExecutionHeader(line);
    if (bareKey) {
      currentKey = bareKey;
      const bucket = sections.get(bareKey) || [];
      sections.set(bareKey, bucket);
      continue;
    }

    currentKey = currentKey && sections.has(currentKey) ? currentKey : currentKey;
    if (currentKey) {
      const bucket = sections.get(currentKey) || [];
      bucket.push(line);
      sections.set(currentKey, bucket);
    }
  }

  if (!sections.has("resultStatus")) {
    const hasHeader = EXECUTION_REPORT_HEADERS.some((header) => text.includes(header));
    if (!hasHeader) return null;
  }

  const resultStatus = splitBulletItems(sections.get("resultStatus") || []).join(" ").trim();
  const statusMatch = resultStatus.match(/\b(succeeded|partially_verified|not_verified|skipped|failed|blocked)\b/);
  const normalizedStatus = statusMatch?.[1];

  return {
    resultStatus: normalizedStatus,
    rawResultStatus: resultStatus || undefined,
    whatChecked: splitBulletItems(sections.get("whatChecked") || []),
    whatChanged: splitBulletItems(sections.get("whatChanged") || []),
    whatNotChanged: splitBulletItems(sections.get("whatNotChanged") || []),
    remainingRisks: splitBulletItems(sections.get("remainingRisks") || []),
    recommendedNextStep: splitBulletItems(sections.get("recommendedNextStep") || []).join(" ").trim() || undefined
  };
}

export function normalizeExecutionReviewReply(text: string, plan?: BeaiTurnPlan): string | null {
  const draft = parseExecutionReviewDraft(text);
  if (!draft) return null;
  const localizedDraft = localizeExecutionDraft(draft);
  const structured = buildExecutionReview(text);
  if (!localizedDraft.resultStatus) {
    return renderExecutionReviewFallback(localizedDraft);
  }
  if (structured && structured.resultState !== "completed") {
    const installLabel = classifyInstallResultLabel(text, structured);
    const telegramEvidence = telegramEvidenceSurfaceText(classifyTelegramEvidenceLevelFromText(text));
    const rendered = renderStructuredExecutionReview(structured);
    return installLabel ? [installResultLabelText(installLabel), telegramEvidence, rendered].filter(Boolean).join("\n") : rendered;
  }
  const installLabel = classifyInstallResultLabel(text, structured);
  if (installLabel && installLabel !== "complete") {
    const telegramEvidence = telegramEvidenceSurfaceText(classifyTelegramEvidenceLevelFromText(text));
    const rendered = structured ? renderStructuredExecutionReview(structured) : renderExecutionReviewFallback(localizedDraft);
    return [installResultLabelText(installLabel), telegramEvidence, rendered || "설치 결과는 일부만 확인된 상태입니다."].filter(Boolean).join("\n");
  }
  const reviewed = sharedCore.reviewExecutionResult({
    taskName: plan?.continuityPatch.current_artifact || plan?.objective || "execution review",
    resultStatus: localizedDraft.resultStatus,
    whatChecked: localizedDraft.whatChecked,
    whatChanged: localizedDraft.whatChanged,
    whatNotChanged: localizedDraft.whatNotChanged,
    remainingRisks: localizedDraft.remainingRisks,
    recommendedNextStep: localizedDraft.recommendedNextStep
  });
  const rendered = reviewed.finalResponse.join("\n").trim() || null;
  const telegramEvidence = telegramEvidenceSurfaceText(classifyTelegramEvidenceLevelFromText(text));
  return installLabel && rendered ? [installResultLabelText(installLabel), telegramEvidence, rendered].filter(Boolean).join("\n") : rendered;
}

export function compactWorkingMemoryPatch(patch: WorkingMemoryPatch): WorkingMemoryPatch {
  const currentArtifact = compactText(patch.current_artifact, 160);
  return {
    last_assistant_answer: compactText(patch.last_assistant_answer, 240),
    numbered_items: compactList(patch.numbered_items, 5, 80),
    last_sentence: compactText(patch.last_sentence, 180),
    current_artifact: isLikelyMetaArtifact(currentArtifact) ? undefined : currentArtifact,
    recent_constraints: compactList(patch.recent_constraints, 6, 120),
    current_focus: compactText(patch.current_focus, 120)
  };
}

export function updateWorkingMemory(workspaceDir: string | undefined, patch: WorkingMemoryPatch): void {
  if (!workspaceDir) return;
  sharedCore.updateWorkingMemory(path.join(workspaceDir, "state", "working-memory.json"), compactWorkingMemoryPatch(patch));
}

function inferProjectStage(plan: BeaiTurnPlan): string {
  if (/다음\s*세션|새\s*세션|세션\s*연속성|이어갈\s*수\s*있게|handoff|continuity/i.test(plan.currentTurn.cleanInput)) {
    return "다음 세션으로 넘길 흐름과 기준을 정리하는 단계";
  }
  if (plan.mode === "handoff") {
    return "Execution-oriented runtime hardening with bounded handoff control.";
  }
  if (plan.mode === "planning") {
    return "Planning and structure hardening with implementation guidance attached.";
  }
  return "Conversation-safe refinement with continuity and boundary preservation.";
}

function inferProjectNextStep(plan: BeaiTurnPlan): string {
  const input = plan.currentTurn.cleanInput;
  if (plan.handoffState?.next_action) return plan.handoffState.next_action;
  if (plan.workOrder?.steps?.[0]) return plan.workOrder.steps[0];
  if (/다음\s*세션|새\s*세션|세션\s*연속성|이어갈\s*수\s*있게|handoff|continuity/i.test(input)) {
    return "다음 세션이 이어받을 세션 연속성 기준과 다음 행동만 짧게 남깁니다.";
  }
  if (plan.continuityPatch.current_focus) return plan.continuityPatch.current_focus;
  if (plan.objective) return plan.objective;
  if (plan.acceptanceChecks?.[0]) return plan.acceptanceChecks[0];
  return "다음 작업 기준을 확인합니다.";
}

function inferVerificationStatus(plan: BeaiTurnPlan): string {
  if (plan.requiresUserConfirmation) {
    return "Approval-sensitive path. High-risk changes remain blocked until explicit user confirmation.";
  }
  if (plan.requiresVerification) {
    return "Verification-sensitive path. Runtime guidance exists, but completion must still be checked explicitly.";
  }
  return "Low-risk path. No additional verification gate was required for this turn.";
}

function compactBullets(values: string[] | undefined, limit: number): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => compactText(value, 160))
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

function renderProjectStateSnapshot(plan: BeaiTurnPlan, finalText?: string): string {
  const decisions = compactBullets(plan.handoffState?.decisions_made, 5);
  const openLoops = compactBullets(plan.handoffState?.open_loops, 5);
  const topics = compactBullets(plan.handoffState?.topics, 6);
  const deliverables = compactBullets(plan.deliverables, 5);
  const constraints = compactBullets(plan.constraints, 5);
  const roleSignals = plan.roleSignals.slice(0, 6);
  const lines = [
    "# BEAI Runtime Live Snapshot",
    "",
    "Purpose: preserve one runtime-refreshed project-state snapshot so a later session can recover current BEAI Layer direction without replaying the whole conversation.",
    "",
    "Last updated: 2026-06-18",
    "",
    "## Current Stage",
    "",
    inferProjectStage(plan),
    "",
    "## Active Artifact",
    "",
    plan.continuityPatch.current_artifact || plan.objective,
    "",
    "## Current Focus",
    "",
    plan.continuityPatch.current_focus || plan.objective,
    "",
    "## Current Mode",
    "",
    `- mode: ${plan.mode}`,
    `- primary class: ${plan.primaryClass}`,
    `- risk level: ${plan.riskLevel}`,
    `- response strategy: ${plan.responseStrategy}`,
    "",
    "## Topic Continuity",
    ""
  ];

  if (topics.length > 0) {
    for (const item of topics) lines.push(`- ${item}`);
  } else {
    lines.push("- no explicit handoff topic block was emitted in this turn");
  }

  lines.push("", "## Decisions Made", "");
  if (decisions.length > 0) {
    for (const item of decisions) lines.push(`- ${item}`);
  } else {
    lines.push("- no new locked decision was emitted in this turn");
  }

  lines.push("", "## Open Questions", "");
  if (openLoops.length > 0) {
    for (const item of openLoops) lines.push(`- ${item}`);
  } else {
    lines.push("- no explicit open loop was emitted in this turn");
  }

  lines.push("", "## Deliverables In View", "");
  for (const item of (deliverables.length > 0 ? deliverables : ["현재 턴 기준 deliverable은 별도 handoff 없이 처리 가능했습니다."])) {
    lines.push(`- ${item}`);
  }

  lines.push("", "## Relevant Roles", "");
  if (roleSignals.length > 0) {
    for (const signal of roleSignals) {
      lines.push(`- ${signal.role}: ${signal.reason}`);
    }
  } else {
    lines.push("- no explicit role relevance signal was emitted in this turn");
  }

  lines.push("", "## Active Constraints", "");
  for (const item of (constraints.length > 0 ? constraints : ["no extra runtime constraint was inferred for this turn"])) {
    lines.push(`- ${item}`);
  }

  lines.push("", "## Next Step", "", inferProjectNextStep(plan), "", "## Last Verified Status", "", inferVerificationStatus(plan));

  if (finalText?.trim()) {
    lines.push("", "## Last Assistant Reply Anchor", "", summarizeReply(finalText));
  }

  return `${lines.join("\n")}\n`;
}

export function updateProjectStateSnapshot(workspaceDir: string | undefined, plan: BeaiTurnPlan, finalText?: string): void {
  if (!workspaceDir) return;
  const filePath = path.join(workspaceDir, "state", "projects", "beai-runtime-live-snapshot.md");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, renderProjectStateSnapshot(plan, finalText), "utf8");
}

function isDurableAgreementLine(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (normalized.length < 18) return false;
  const lowered = normalized.toLowerCase();
  const durableSignals = [
    "must ",
    "should ",
    "do not ",
    "keep ",
    "always ",
    "never ",
    "승인",
    "금지",
    "유지",
    "원칙",
    "규칙",
    "기준",
    "분리",
    "노출하지 않는다",
    "자동",
    "메인 비아이",
    "pm 표면"
  ];
  return durableSignals.some((signal) => lowered.includes(signal.toLowerCase()));
}

function extractAgreementCandidates(plan: BeaiTurnPlan, finalText?: string): AgreementCandidate[] {
  const candidates = new Map<string, AgreementCandidate>();
  const push = (statement: string | undefined, rationale: string) => {
    const compact = compactText(statement, 220);
    if (!compact || !isDurableAgreementLine(compact)) return;
    if (!candidates.has(compact)) {
      candidates.set(compact, { statement: compact, rationale });
    }
  };

  for (const item of plan.handoffState?.decisions_made || []) {
    push(item, "handoff_state.decision");
  }
  for (const item of plan.constraints || []) {
    push(item, "runtime_constraint");
  }
  for (const item of plan.continuityPatch.recent_constraints || []) {
    push(item, "recent_constraint");
  }

  const finalSentences = (finalText || "")
    .split(/\n+/)
    .map((line) => compactText(line, 220))
    .filter((line): line is string => Boolean(line));
  for (const line of finalSentences.slice(0, 6)) {
    push(line, "final_reply_line");
  }

  return Array.from(candidates.values()).slice(0, 8);
}

function readJsonArray<T>(filePath: string): T[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readJsonObject<T>(filePath: string): T | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function mergeUniqueByText<T extends { text?: string; statement?: string }>(existing: T[], incoming: T[], limit = 80): T[] {
  const merged = new Map<string, T>();
  for (const item of [...existing, ...incoming]) {
    const key = (item.text || item.statement || "").trim();
    if (!key || merged.has(key)) continue;
    merged.set(key, item);
  }
  return Array.from(merged.values()).slice(-limit);
}

function hasDoNotRememberSignal(text: string): boolean {
  return /(기억하지\s*마|기억하지\s*말|저장하지\s*마|남기지\s*마|forget\s+this|do\s+not\s+remember|don't\s+remember)/i.test(text);
}

function hasExplicitAgreementSignal(text: string): boolean {
  return /(기억해|앞으로\s*이렇게|이\s*기준\s*유지|기준으로\s*유지|합의|원칙으로\s*하자|keep\s+this|remember\s+this|from\s+now\s+on)/i.test(text);
}

function isTransientMemoryLine(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return true;
  if (normalized.length < 12) return true;
  if (isLikelyMetaArtifact(normalized)) return true;
  if (INTERNAL_REPLY_TERMS.some((term) => normalized.toLowerCase().includes(term.replace(/\s+/g, "")))) return true;
  if (/(debugSummary|handoffState|diagnosticFamily|finalResponse|What was checked|Result status)/i.test(normalized)) return true;
  if (/(좋아|고마워|알겠어|오케이|응|네)[.!?。！？]?$/.test(normalized) && normalized.length < 30) return true;
  return false;
}

function classifyMemoryScope(text: string): MemoryScope {
  if (/(말투|호칭|이름|존댓말|반말|가깝|거리|비서|동반자|tone|style)/i.test(text)) return "personal_preference";
  if (/(승인|허락|금지|하지\s*마|절대|without approval|approval)/i.test(text)) return "approval_boundary";
  if (/(철학|원칙|기준|목표|방향|구조|1차\s*대상|우선\s*대상|먼저\s*(?:닫|처리|구현)|first\s*(?:implementation\s*)?target|primary\s*(?:implementation\s*)?target|runtime\/package|OpenClaw\s*Runtime|OpenClaw\s*Package|BEAI\s*Runtime|BEAI\s*Package|Codex\s*Harness.*later|OpenClaw\s*코어|오픈클로\s*코어|배포\s*전|명시\s*지시)/i.test(text)) return "project_principle";
  if (/(완료|진행|작업|테스트|빌드|status|상태|다음\s*단계|구현|수정)/i.test(text)) return "execution_state";
  if (/(세션|흐름|맥락|context|handoff|압축|이어)/i.test(text)) return "conversation_flow";
  return "unknown";
}

function hasLongTermStandardSignal(text: string): boolean {
  return /(앞으로|항상|절대|반드시|계속|유지|원칙|기준|합의|승인\s*전|명시\s*지시|do\s*not|never|always|from\s*now\s*on|keep\s*this)/i.test(text);
}

function isPlainWorkflowUpdate(text: string): boolean {
  if (hasExplicitAgreementSignal(text) || hasLongTermStandardSignal(text)) return false;
  return /(진행하자|진행해|다음\s*단계|계속|작업|구현|수정|테스트|빌드|확인|브리핑|현재\s*상태|완료|통과)/i.test(text);
}

function tokenizeMemoryText(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[`"'()[\]{}.,:;!?/\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "current",
    "좋아",
    "다음",
    "단계",
    "진행",
    "작업",
    "기준",
    "현재",
    "사용자",
    "환경"
  ]);
  return new Set(
    normalized
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !stopWords.has(token))
  );
}

function classifyMemoryTopic(text: string): string {
  if (/(배포|공유|zip|package|install|설치|rollback|롤백|version|버전|v0\.)/i.test(text)) return "distribution";
  if (/(memory|메모리|기억|context|맥락|relevance|관련도|candidate|후보)/i.test(text)) return "memory";
  if (/(skill|스킬|반복|자동화|automation|agent|에이전트)/i.test(text)) return "skill";
  if (/(승인|approval|고위험|위험|금지|허락|안전)/i.test(text)) return "approval";
  if (/(gateway|telegram|텔레그램|hook|훅|runtime|런타임|openclaw|오픈클로|beai|비아이)/i.test(text)) return "runtime";
  return "general";
}

function classifyMemoryStaleness(createdAt: string | undefined, now = new Date()): MemoryRelevanceDecision["stalenessRisk"] {
  if (!createdAt) return "unknown";
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return "unknown";
  const ageDays = (now.getTime() - created) / 86_400_000;
  if (ageDays < 0) return "unknown";
  if (ageDays <= 7) return "none";
  if (ageDays <= 30) return "low";
  if (ageDays <= 90) return "medium";
  return "high";
}

export function evaluateMemoryRelevance(
  candidate: Pick<BeaiMemoryCandidate, "text" | "policy" | "createdAt">,
  currentInput: string,
  now = new Date()
): MemoryRelevanceDecision {
  const text = compactText(candidate.text, 260) || "";
  const input = compactText(currentInput, 260) || "";
  const policy = candidate.policy || evaluateMemoryCandidatePolicy(text);
  const stalenessRisk = classifyMemoryStaleness(candidate.createdAt, now);
  const reasons: string[] = [];

  if (!text || policy.decision === "discard" || policy.consentLevel === "do_not_store") {
    return {
      score: 0,
      relation: "unrelated",
      stalenessRisk,
      action: "discard",
      reasons: ["candidate is discarded by memory policy"]
    };
  }

  const candidateTokens = tokenizeMemoryText(text);
  const inputTokens = tokenizeMemoryText(input);
  let overlap = 0;
  for (const token of candidateTokens) {
    if (inputTokens.has(token)) overlap += 1;
  }

  const candidateTopic = classifyMemoryTopic(text);
  const inputTopic = classifyMemoryTopic(input);
  const topicMatch = candidateTopic !== "general" && candidateTopic === inputTopic;

  let score = 10;
  if (policy.decision === "store_candidate") {
    score += 20;
    reasons.push("candidate passed memory policy");
  }
  if (policy.futureUsefulness === "multi_session") {
    score += 15;
    reasons.push("multi-session usefulness");
  }
  if (overlap >= 3) {
    score += 30;
    reasons.push("strong lexical overlap with current input");
  } else if (overlap >= 1) {
    score += 15;
    reasons.push("some lexical overlap with current input");
  }
  if (topicMatch) {
    score += 20;
    reasons.push(`topic match: ${inputTopic}`);
  }
  if (["approval_boundary", "project_principle"].includes(policy.scope) && /(승인|approval|배포|공유|설치|install|runtime|beai|비아이|openclaw|오픈클로)/i.test(input)) {
    score += 10;
    reasons.push("durable boundary is relevant to current project work");
  }
  if (stalenessRisk === "medium") {
    score -= 10;
    reasons.push("medium staleness risk");
  }
  if (stalenessRisk === "high") {
    score -= 25;
    reasons.push("high staleness risk");
  }

  score = Math.max(0, Math.min(100, score));
  const relation: MemoryRelevanceDecision["relation"] = score >= 70 ? "direct" : score >= 50 ? "adjacent" : score >= 30 ? "background" : "unrelated";
  const action: MemoryRelevanceDecision["action"] =
    score >= 60 && stalenessRisk !== "high"
      ? "inject_candidate"
      : score >= 40
        ? "review_only"
        : "defer";

  return {
    score,
    relation,
    stalenessRisk,
    action,
    reasons: reasons.length ? reasons : ["low relevance to current input"]
  };
}

export function classifyMemoryCurrentJudgmentImpact(
  relevance: MemoryRelevanceDecision,
  policy?: MemoryCandidatePolicy
): MemoryCurrentJudgmentImpact {
  if (relevance.action === "discard" || relevance.relation === "unrelated") return "none";
  if (policy?.decision === "discard" || policy?.consentLevel === "do_not_store") return "none";

  const highImpactScope = ["project_principle", "approval_boundary", "execution_state", "conversation_flow"];
  if (
    relevance.action === "inject_candidate" &&
    relevance.score >= 80 &&
    policy?.scope &&
    highImpactScope.includes(policy.scope)
  ) {
    return "high";
  }
  if (relevance.action === "inject_candidate" && relevance.score >= 60) return "medium";
  if (relevance.action === "review_only" && relevance.score >= 40) return "low";
  return "none";
}

export function classifyFlowMemoryInfluenceType(
  policy?: MemoryCandidatePolicy
): FlowMemoryInfluenceType {
  if (!policy || policy.decision === "discard") return "discard";
  if (policy.decision === "route_session_continuity" || policy.scope === "conversation_flow") return "session_continuity";
  if (
    policy.decision === "route_project_state" ||
    ["project_principle", "approval_boundary", "execution_state"].includes(policy.scope)
  ) {
    return "project_state";
  }
  if (policy.decision === "store_candidate" && policy.durability === "long_term") return "long_term_memory_candidate";
  if (policy.decision === "store_candidate") return "package_knowledge";
  return "discard";
}

export function evaluateMemoryCandidatePolicy(text: string, source: BeaiMemoryCandidate["source"] = "current_turn"): MemoryCandidatePolicy {
  const normalized = text.trim();
  if (!normalized || isTransientMemoryLine(normalized)) {
    return {
      durability: "transient",
      userIntent: "current_workflow",
      scope: "unknown",
      futureUsefulness: "none",
      consentLevel: "candidate_only",
      decision: "discard",
      reason: "transient or internal-looking text"
    };
  }
  if (hasDoNotRememberSignal(normalized)) {
    return {
      durability: "transient",
      userIntent: "do_not_store",
      scope: "unknown",
      futureUsefulness: "none",
      consentLevel: "do_not_store",
      decision: "discard",
      reason: "user explicitly asked not to store this"
    };
  }

  const scope = classifyMemoryScope(normalized);
  const explicit = hasExplicitAgreementSignal(normalized);
  const longTermStandard = hasLongTermStandardSignal(normalized);

  if (isPlainWorkflowUpdate(normalized)) {
    return {
      durability: "session",
      userIntent: "current_workflow",
      scope,
      futureUsefulness: "next_turn",
      consentLevel: "candidate_only",
      decision: scope === "conversation_flow" ? "route_session_continuity" : "route_project_state",
      reason: "current workflow belongs to project/session state, not long-term memory"
    };
  }

  if (explicit || (longTermStandard && ["personal_preference", "project_principle", "approval_boundary"].includes(scope))) {
    return {
      durability: scope === "personal_preference" ? "long_term" : "project",
      userIntent: explicit ? "explicit_memory_request" : "implicit_repeated_standard",
      scope,
      futureUsefulness: "multi_session",
      consentLevel: explicit ? "explicit_accept" : "candidate_only",
      decision: "store_candidate",
      reason: explicit ? "explicit memory/agreement signal" : "durable standard likely to affect future turns"
    };
  }

  if (source === "runtime_constraint" && ["project_principle", "approval_boundary"].includes(scope)) {
    return {
      durability: "project",
      userIntent: "implicit_repeated_standard",
      scope,
      futureUsefulness: "multi_session",
      consentLevel: "candidate_only",
      decision: "store_candidate",
      reason: "runtime constraint affects future safety or project judgment"
    };
  }

  if (source === "handoff_state" && ["project_principle", "approval_boundary"].includes(scope)) {
    return {
      durability: "project",
      userIntent: "implicit_repeated_standard",
      scope,
      futureUsefulness: "multi_session",
      consentLevel: "candidate_only",
      decision: "store_candidate",
      reason: "handoff decision is a durable project or approval boundary"
    };
  }

  return {
    durability: scope === "execution_state" ? "session" : "transient",
    userIntent: "current_workflow",
    scope,
    futureUsefulness: scope === "execution_state" || scope === "conversation_flow" ? "next_turn" : "unclear",
    consentLevel: "candidate_only",
    decision: scope === "conversation_flow" ? "route_session_continuity" : scope === "execution_state" ? "route_project_state" : "discard",
    reason: "not durable enough for memory candidate"
  };
}

function buildBeaiMemoryCandidates(plan: BeaiTurnPlan, finalText?: string): BeaiMemoryCandidate[] {
  if (hasDoNotRememberSignal(plan.currentTurn.cleanInput)) return [];
  const now = new Date().toISOString();
  const candidates: BeaiMemoryCandidate[] = [];
  const push = (text: string | undefined, source: BeaiMemoryCandidate["source"], reason: string) => {
    const compact = compactText(text, 260);
    if (!compact || isTransientMemoryLine(compact)) return;
    const policy = evaluateMemoryCandidatePolicy(compact, source);
    if (policy.decision !== "store_candidate") return;
    candidates.push({ text: compact, source, status: "candidate", reason: `${reason}; ${policy.reason}`, policy, createdAt: now });
  };

  push(plan.currentTurn.cleanInput, "current_turn", "current turn memory policy accepted");
  for (const item of plan.constraints) push(item, "runtime_constraint", "runtime constraint candidate");
  for (const item of plan.handoffState?.decisions_made || []) push(item, "handoff_state", "handoff decision candidate");
  if (finalText) {
    push(summarizeReply(finalText), "final_reply", "final reply memory policy accepted");
  }
  return mergeUniqueByText([], candidates, 20);
}

export function buildMemoryRelevanceReport(
  candidates: BeaiMemoryCandidate[],
  plan: BeaiTurnPlan,
  finalText?: string,
  now = new Date()
): BeaiMemoryRelevanceReport {
  const currentInput = plan.currentTurn.cleanInput;
  const currentContext = [
    currentInput,
    plan.objective,
    plan.continuityPatch.current_focus,
    plan.continuityPatch.current_artifact,
    finalText
  ].filter(Boolean).join("\n");
  const items = candidates.map((candidate) => {
    const relevance = evaluateMemoryRelevance(candidate, currentContext, now);
    const currentJudgmentImpact = classifyMemoryCurrentJudgmentImpact(relevance, candidate.policy);
    const affectsCurrentJudgment = currentJudgmentImpact === "medium" || currentJudgmentImpact === "high";
    return {
      text: candidate.text,
      source: candidate.source,
      policy: candidate.policy,
      relevance,
      currentJudgmentImpact,
      affectsCurrentJudgment,
      flowStateType: classifyFlowMemoryInfluenceType(candidate.policy)
    };
  });
  const flowStateItems = items
    .filter((item) => item.affectsCurrentJudgment)
    .slice(0, 8)
    .map((item) => ({
      type: item.flowStateType,
      currentJudgmentImpact: item.currentJudgmentImpact,
      affectsCurrentJudgment: item.affectsCurrentJudgment,
      summary: compactText(item.text, 180) || item.text,
      source: `memory_relevance:${item.source}`
    }));
  return {
    currentInput,
    generatedAt: now.toISOString(),
    summary: {
      injectCandidates: items.filter((item) => item.relevance.action === "inject_candidate").length,
      reviewOnly: items.filter((item) => item.relevance.action === "review_only").length,
      deferred: items.filter((item) => item.relevance.action === "defer").length,
      discarded: items.filter((item) => item.relevance.action === "discard").length
    },
    items,
    flowStateInfluence: {
      high: items.filter((item) => item.currentJudgmentImpact === "high").length,
      medium: items.filter((item) => item.currentJudgmentImpact === "medium").length,
      low: items.filter((item) => item.currentJudgmentImpact === "low").length,
      none: items.filter((item) => item.currentJudgmentImpact === "none").length,
      affectingCurrentJudgment: flowStateItems.length,
      items: flowStateItems
    }
  };
}

export function buildFlowMemoryInfluenceFromRelevanceReport(
  report: Pick<BeaiMemoryRelevanceReport, "flowStateInfluence">
): FlowStateSpine["memoryInfluence"] {
  return report.flowStateInfluence.items.map((item) => ({
    type: item.type,
    currentJudgmentImpact: item.currentJudgmentImpact,
    affectsCurrentJudgment: item.affectsCurrentJudgment,
    summary: item.summary,
    source: item.source
  }));
}

function buildBeaiAgreementAssets(plan: BeaiTurnPlan, finalText?: string): BeaiAgreementAsset[] {
  if (!hasExplicitAgreementSignal(plan.currentTurn.cleanInput)) return [];
  const now = new Date().toISOString();
  const assets: BeaiAgreementAsset[] = [];
  const push = (statement: string | undefined, reason: string) => {
    const compact = compactText(statement, 260);
    if (!compact || isTransientMemoryLine(compact)) return;
    assets.push({
      statement: compact,
      status: "candidate",
      source: "explicit_user_instruction",
      reason,
      createdAt: now
    });
  };
  push(plan.currentTurn.cleanInput, "user explicitly asked to remember or keep this rule");
  for (const candidate of extractAgreementCandidates(plan, finalText).slice(0, 4)) {
    push(candidate.statement, candidate.rationale);
  }
  return mergeUniqueByText([], assets, 20);
}

function buildBeaiProjectStateAsset(plan: BeaiTurnPlan, finalText?: string): BeaiProjectStateAsset {
  const boundary = inferDeploymentBoundary(plan, finalText);
  return {
    currentTrack: plan.handoffState?.current_track || inferProjectStage(plan),
    currentFocus: plan.continuityPatch.current_focus || plan.objective,
    nextAction: inferProjectNextStep(plan),
    openLoops: compactBullets(plan.handoffState?.open_loops, 8),
    lockedDecisions: compactBullets(plan.handoffState?.decisions_made, 8),
    deploymentBoundary: boundary,
    relevantArtifacts: inferRelevantArtifacts(plan, finalText),
    updatedAt: new Date().toISOString()
  };
}

function inferDeploymentBoundary(plan: BeaiTurnPlan, finalText?: string): BeaiProjectStateAsset["deploymentBoundary"] {
  const text = [
    plan.currentTurn.cleanInput,
    plan.objective,
    finalText,
    plan.continuityPatch.current_focus,
    plan.continuityPatch.current_artifact,
    ...(plan.handoffState?.decisions_made || []),
    ...(plan.handoffState?.open_loops || []),
    ...(plan.constraints || [])
  ].join("\n");
  const cleanInternalVersion = text.match(/\bv(0\.5\.\d+)\b|\b(0\.5\.\d+)\b/i);
  const cleanInternalVersionText = cleanInternalVersion?.[1] || cleanInternalVersion?.[2];
  const cleanInternalCandidate = cleanInternalVersionText && /clean internal team candidate|clean internal|팀\s*내부|팀원|공유|candidate|후보|zip|package|패키지|배포/i.test(text)
    ? `v${cleanInternalVersionText} clean internal team candidate`
    : undefined;
  const teamDistributionBaseline = cleanInternalCandidate
    ? cleanInternalCandidate
    : /v0\.2\.6|0\.2\.6/i.test(text) && /clean|팀원|공유|distribution|배포/i.test(text)
    ? "v0.2.6 clean internal team candidate"
    : undefined;
  const localRuntimeVersion = text.match(/\bv(0\.[3-5]\.\d+)\b|\b(0\.[3-5]\.\d+)\b/i);
  const localRuntimeVersionText = localRuntimeVersion?.[1] || localRuntimeVersion?.[2];
  const localRuntimeCandidate = !cleanInternalCandidate && localRuntimeVersionText && /observer|관찰|live|candidate|후보|훅|hook|runtime|런타임|relevance|관련도|project state|ledger/i.test(text)
    ? localRuntimeVersionText === "0.3.0"
      ? "v0.3.0 Hook Control Plane observer live candidate"
      : `v${localRuntimeVersionText} local runtime candidate`
    : undefined;
  const rollbackPoint = /rollback|롤백|되돌|v0\.2\.6|0\.2\.6/i.test(text)
    ? "v0.2.6 clean zip"
    : undefined;
  const doNotDescribeAs = cleanInternalCandidate
    ? [`v${cleanInternalVersionText} public release`, `v${cleanInternalVersionText} production installer`, `v${cleanInternalVersionText} one-click installer`]
    : localRuntimeCandidate
    ? [`v${localRuntimeVersionText} 배포판`, `v${localRuntimeVersionText} 팀원 공유용`, `v${localRuntimeVersionText} clean zip`]
    : [];
  const packageReadiness = cleanInternalCandidate
    ? "clean_internal_candidate"
    : teamDistributionBaseline
    ? "clean_distribution"
    : localRuntimeCandidate
      ? "local_observer_candidate"
      : /배포|package|zip/i.test(text)
        ? "not_packaged"
        : "unknown";

  return {
    teamDistributionBaseline,
    localRuntimeCandidate,
    rollbackPoint,
    doNotDescribeAs,
    packageReadiness
  };
}

function inferRelevantArtifacts(plan: BeaiTurnPlan, finalText?: string): string[] {
  const text = [
    plan.currentTurn.cleanInput,
    plan.objective,
    finalText,
    plan.continuityPatch.current_artifact,
    plan.continuityPatch.current_focus,
    ...(plan.handoffState?.decisions_made || []),
    ...(plan.handoffState?.open_loops || [])
  ].join("\n");
  const artifacts = new Set<string>();
  for (const match of text.matchAll(/\/Users\/[^\s`'"]+/g)) artifacts.add(match[0]);
  for (const match of text.matchAll(/\b[\w.-]+\.zip\b/g)) artifacts.add(match[0]);
  if (/v0\.2\.6|0\.2\.6/i.test(text) && /clean|zip|배포|공유/i.test(text)) {
    artifacts.add("packages/beai-layer-v0.2.6-clean-internal-team-candidate-20260621.zip");
  }
  if (/v0\.5\.1|0\.5\.1/i.test(text) && /clean internal|팀\s*내부|team|zip|패키지|package|candidate|후보/i.test(text)) {
    artifacts.add("packages/beai-layer-v0.5.1-clean-internal-team-candidate-20260622.zip");
  }
  return Array.from(artifacts).slice(0, 12);
}

function buildDiscardedContextItems(plan: BeaiTurnPlan, finalText?: string): BeaiDiscardedContextItem[] {
  const discarded: BeaiDiscardedContextItem[] = [];
  const now = new Date().toISOString();
  const push = (text: string, reason: string) => discarded.push({ text, reason, discardedAt: now });
  if (hasDoNotRememberSignal(plan.currentTurn.cleanInput)) push(plan.currentTurn.cleanInput, "user explicitly asked not to remember this turn");
  if (finalText && isTransientMemoryLine(finalText)) push(compactText(finalText, 260) || "transient final reply", "transient or internal-looking text");
  return discarded;
}

export const COMPANION_SETUP_QUESTIONS = [
  "이 AI를 뭐라고 부르면 좋을까요?",
  "답변은 어떤 느낌이면 좋을까요? 예: 차분하게, 따뜻하게, 간결하게, 단호하게",
  "이 AI가 어느 정도 가까운 거리로 함께하면 좋을까요? 예: 실무 조력자, 따뜻한 동료, 가까운 동반자, 격식 있는 비서",
  "기억은 어떻게 다루면 좋을까요? 예: 먼저 물어보기, 후보로 제안하기, 최소한만 남기기",
  "일정이나 반복 작업은 어떻게 다루면 좋을까요? 예: 항상 확인받기, 낮은 위험만 허용하기, 직접 말할 때만 하기",
  "주로 어떤 일에 함께 쓰고 싶나요? 예: 개발, 문서, 감정 정리, 일정, 공부, 창작",
  "승인 없이 절대 하지 않았으면 하는 일은 무엇인가요?"
] as const;

function defaultCompanionProfile(): CompanionProfile {
  return {
    assistantName: "BEAI",
    userFacingTone: "차분하고 명료하게, 필요한 따뜻함을 유지합니다.",
    relationshipDistance: "warm",
    memoryPreference: "candidate-first",
    automationBoundary: "confirm-before-scheduling",
    primaryUseCases: ["대화 흐름 정리", "작업 계획", "실행 전후 확인"],
    neverDoWithoutApproval: ["삭제", "외부 전송", "결제", "공개 배포", "되돌리기 어려운 변경"]
  };
}

export function renderCompanionSetupPrompt(): string {
  return [
    "첫 설정은 기술 설정이 아니라 함께 일하는 기준을 정하는 과정입니다.",
    "",
    ...COMPANION_SETUP_QUESTIONS.map((question, index) => `${index + 1}. ${question}`),
    "",
    "편하게 문장으로 답해도 됩니다. 제가 답변을 작동 기준으로 정리해두겠습니다."
  ].join("\n");
}

function detectRelationshipDistance(text: string): CompanionProfile["relationshipDistance"] {
  if (/격식|비서|formal|정중/i.test(text)) return "formal";
  if (/가까운|동반자|친근|close/i.test(text)) return "close";
  if (/실무|도구|조력자|practical/i.test(text)) return "practical";
  return "warm";
}

function detectMemoryPreference(text: string): CompanionProfile["memoryPreference"] {
  if (/최소|적게|거의\s*기억하지|minimal/i.test(text)) return "minimal";
  if (/물어|허락|동의|ask/i.test(text)) return "ask-first";
  return "candidate-first";
}

function detectAutomationBoundary(text: string): CompanionProfile["automationBoundary"] {
  if (/직접 말할 때만|수동|manual|내가 시킬 때/i.test(text)) return "manual-first";
  if (/낮은 위험|루틴|반복|low-risk/i.test(text)) return "allow-low-risk-routines";
  return "confirm-before-scheduling";
}

function extractPrimaryUseCases(text: string): string[] {
  const cases: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ["개발", /개발|코딩|프로그래밍|오픈클로|OpenClaw/i],
    ["문서", /문서|글|보고서|정리|기획/i],
    ["감정 정리", /감정|마음|동반|곁|생활/i],
    ["일정", /일정|리마인드|반복|습관/i],
    ["공부", /공부|학습|연구/i],
    ["창작", /창작|아이디어|콘텐츠/i]
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(text)) cases.push(label);
  }
  return cases.length > 0 ? cases : defaultCompanionProfile().primaryUseCases;
}

function extractAssistantName(text: string): string {
  const match = text.match(/(?:이름|불러|호칭|name)\s*(?:은|는|:|=)?\s*([A-Za-z0-9가-힣_-]{2,24})/i);
  return match?.[1]?.trim() || defaultCompanionProfile().assistantName;
}

function extractTone(text: string): string {
  const tones: string[] = [];
  if (/차분|calm/i.test(text)) tones.push("차분하게");
  if (/따뜻|warm/i.test(text)) tones.push("따뜻하게");
  if (/간결|짧|concise/i.test(text)) tones.push("간결하게");
  if (/단호|명확|선명/i.test(text)) tones.push("명확하게");
  if (/친근/i.test(text)) tones.push("친근하게");
  return tones.length > 0 ? `${tones.join(", ")} 답합니다.` : defaultCompanionProfile().userFacingTone;
}

function extractNeverDoWithoutApproval(text: string): string[] {
  const defaults = defaultCompanionProfile().neverDoWithoutApproval;
  const found = new Set<string>();
  const checks: Array<[string, RegExp]> = [
    ["삭제", /삭제|지우/i],
    ["외부 전송", /전송|공유|보내/i],
    ["결제", /결제|구매/i],
    ["공개 배포", /배포|공개|publish/i],
    ["되돌리기 어려운 변경", /위험|고위험|되돌리기/i],
    ["자동 예약", /예약|스케줄|일정 등록/i]
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(text)) found.add(label);
  }
  return found.size > 0 ? Array.from(found) : defaults;
}

export function buildCompanionProfileFromText(text: string, existing?: CompanionProfile): CompanionProfile {
  const base = existing || defaultCompanionProfile();
  const normalized = text.trim();
  if (!normalized) return base;
  return {
    assistantName: extractAssistantName(normalized) || base.assistantName,
    userFacingTone: extractTone(normalized) || base.userFacingTone,
    relationshipDistance: detectRelationshipDistance(normalized),
    memoryPreference: detectMemoryPreference(normalized),
    automationBoundary: detectAutomationBoundary(normalized),
    primaryUseCases: extractPrimaryUseCases(normalized),
    neverDoWithoutApproval: extractNeverDoWithoutApproval(normalized)
  };
}

function companionProfilePath(workspaceDir: string): string {
  return path.join(workspaceDir, "state", "beai", "companion-profile.json");
}

export function loadCompanionProfile(workspaceDir: string | undefined): CompanionProfile | undefined {
  if (!workspaceDir) return undefined;
  try {
    const parsed = JSON.parse(fs.readFileSync(companionProfilePath(workspaceDir), "utf8"));
    if (!parsed || typeof parsed !== "object") return undefined;
    return {
      ...defaultCompanionProfile(),
      ...(parsed as Partial<CompanionProfile>)
    };
  } catch {
    return undefined;
  }
}

export function saveCompanionProfile(workspaceDir: string | undefined, profile: CompanionProfile): void {
  if (!workspaceDir) return;
  writeJsonFile(companionProfilePath(workspaceDir), profile);
}

export function renderCompanionProfileContext(profile: CompanionProfile): string {
  return [
    "companion_profile:",
    `- assistant_name: ${profile.assistantName}`,
    `- tone: ${profile.userFacingTone}`,
    `- relationship_distance: ${profile.relationshipDistance}`,
    `- memory_preference: ${profile.memoryPreference}`,
    `- automation_boundary: ${profile.automationBoundary}`,
    `- primary_use_cases: ${profile.primaryUseCases.slice(0, 5).join(", ")}`,
    `- never_without_approval: ${profile.neverDoWithoutApproval.slice(0, 6).join(", ")}`
  ].join("\n");
}

export function shouldOfferCompanionSetup(input: string): boolean {
  return /(첫\s*설정|처음\s*설정|동반자\s*설정|컴패니언|companion|내\s*ai|나만의\s*ai)/i.test(input);
}

export function shouldSaveCompanionProfile(input: string): boolean {
  return /(이렇게\s*설정|이걸\s*기준|프로필로\s*저장|설정해줘|기억해줘|앞으로\s*이렇게)/i.test(input) && /(말투|기억|승인|자동|동반|비서|조력자|이름|호칭|용도)/i.test(input);
}

function detectCapabilityKind(input: string): CapabilityTranslation["capabilityKind"] {
  if (/자동화|반복|매일|매주|주기|시간|알림|깨워|cron|예약|스케줄/i.test(input)) return "cron";
  if (/기억|메모리|remember|memory|계속\s*기억/i.test(input)) return "memory";
  if (/플러그인|plugin|설치|연결|확장/i.test(input)) return "plugin";
  if (/스킬|skill|잘하게|능력/i.test(input)) return "skill";
  if (/에이전트|agent|독립|따로\s*일|백그라운드/i.test(input)) return "agent";
  return "manual-workflow";
}

function inferCapabilityReadiness(input: string, kind: CapabilityTranslation["capabilityKind"]): CapabilityTranslation["readiness"] {
  if (/(바로\s*만들|설정해|등록해|매일|매주|오전|오후|\d+\s*시)/i.test(input)) {
    if (/(돈|결제|삭제|외부\s*전송|메일\s*보내|배포|위험|고위험)/i.test(input)) return "recommended";
    return kind === "cron" ? "ready-to-configure" : "recommended";
  }
  if (/(어떻게|뭐야|무엇|궁금|알려|설명)/i.test(input)) return "candidate";
  return kind === "manual-workflow" ? "recommended" : "candidate";
}

function capabilityExplanation(kind: CapabilityTranslation["capabilityKind"]): string {
  switch (kind) {
    case "cron":
      return "정해진 시간이나 반복 주기에 AI를 다시 깨워 같은 종류의 일을 확인하게 하는 기능입니다.";
    case "memory":
      return "앞으로도 자주 필요한 기준을 후보로 남기고, 사용자가 받아들인 것만 오래 쓰는 방식입니다.";
    case "plugin":
      return "OpenClaw에 새로운 연결이나 도구 묶음을 추가해 할 수 있는 일을 넓히는 방식입니다.";
    case "skill":
      return "특정 일을 더 잘 처리하도록 절차와 판단 기준을 작게 가르쳐두는 방식입니다.";
    case "agent":
      return "메인 대화를 방해하지 않고 별도 흐름에서 한 가지 일을 맡겨 처리하게 하는 방식입니다.";
    case "manual-workflow":
      return "아직 자동화하지 않고, 사람이 확인하면서 반복 절차를 먼저 안정화하는 방식입니다.";
  }
}

function capabilityWhyNow(input: string, kind: CapabilityTranslation["capabilityKind"], readiness: CapabilityTranslation["readiness"]): string {
  if (kind === "cron" && readiness === "ready-to-configure") return "시간, 반복 주기, 할 일이 비교적 분명해서 설정 후보로 볼 수 있습니다.";
  if (kind === "cron") return "반복 가능성은 보이지만 실패 범위와 승인 경계를 먼저 정하는 편이 안전합니다.";
  if (kind === "memory") return "다시 설명하지 않아도 되는 기준인지 확인할 필요가 있습니다.";
  if (kind === "plugin") return "기능을 넓히기 전에 기존 OpenClaw 흐름과 충돌하지 않는지 확인해야 합니다.";
  if (kind === "agent") return "메인 대화와 분리할 만큼 독립적인 작업인지 먼저 봐야 합니다.";
  if (kind === "skill") return "반복되는 처리 방식이 보이면 작은 절차로 고정할 수 있습니다.";
  return input.trim() ? "지금은 자동화보다 한 번 더 손으로 확인하는 흐름이 더 안전합니다." : "요청이 아직 구체화되지 않았습니다.";
}

function capabilityFirstSafeStep(kind: CapabilityTranslation["capabilityKind"], readiness: CapabilityTranslation["readiness"]): string {
  if (kind === "cron" && readiness === "ready-to-configure") {
    return "먼저 시간, 반복 주기, 할 일, 결과를 받을 위치, 실패했을 때 알림 방식을 확인합니다.";
  }
  if (kind === "cron") return "한 번 수동으로 실행해 보고 반복해도 되는지 확인합니다.";
  if (kind === "memory") return "기억 후보로 남긴 뒤, 오래 쓸 기준인지 사용자에게 확인합니다.";
  if (kind === "plugin") return "기본 OpenClaw 설정을 바꾸지 않고 enable/disable 가능한 방식인지 확인합니다.";
  if (kind === "agent") return "작업 목표와 종료 조건을 한 문장으로 고정합니다.";
  if (kind === "skill") return "잘해야 하는 일을 3~5단계 절차로 먼저 적습니다.";
  return "한 번의 수동 절차로 해보고 반복되는 부분만 따로 떼어냅니다.";
}

export function translateCapabilityNeed(input: string): CapabilityTranslation {
  const capabilityKind = detectCapabilityKind(input);
  const readiness = inferCapabilityReadiness(input, capabilityKind);
  return {
    userNeed: firstSentence(input || "OpenClaw 능력 이해"),
    capabilityKind,
    plainLanguageExplanation: capabilityExplanation(capabilityKind),
    readiness,
    whyNow: capabilityWhyNow(input, capabilityKind, readiness),
    firstSafeStep: capabilityFirstSafeStep(capabilityKind, readiness)
  };
}

export function renderCapabilityTranslationReply(input: string): string {
  const translated = translateCapabilityNeed(input);
  const lines = [
    `쉽게 말하면, ${translated.plainLanguageExplanation}`,
    "",
    `지금 요청은 ${translated.capabilityKind === "cron" ? "자동화 후보" : "능력 사용 후보"}로 볼 수 있습니다.`,
    translated.whyNow,
    "",
    `첫 안전 단계는 이것입니다. ${translated.firstSafeStep}`
  ];
  if (translated.capabilityKind === "cron") {
    lines.push("", "바로 만들기보다 먼저 반복해도 되는 일인지, 실패했을 때 멈출 기준이 있는지 확인하는 게 좋습니다.");
  }
  return lines.join("\n");
}

function delegationCandidateLabel(candidate: OperatingDelegationCandidate): string {
  switch (candidate) {
    case "direct_answer":
      return "바로 답변";
    case "skill_candidate":
      return "스킬 후보";
    case "agent_candidate":
      return "에이전트 후보";
    case "workflow_candidate":
      return "워크플로 후보";
    case "automation_candidate":
      return "자동화 후보";
    case "hold":
      return "보류";
    case "approval_required":
      return "승인 필요";
    case "do_not_do":
      return "하지 않음";
  }
}

function delegationLevelLabel(level: OperatingDelegationLevel): string {
  switch (level) {
    case "L0_answer_only":
      return "답변만";
    case "L1_draft_only":
      return "초안까지만";
    case "L2_review_or_organize":
      return "검토/정리";
    case "L3_internal_proposal":
      return "내부 제안";
    case "L4_execute_after_approval":
      return "승인 후 실행";
    case "L5_repeated_automation_candidate":
      return "반복 자동화 후보";
    case "L6_high_risk_strong_approval":
      return "강한 승인 필요";
  }
}

function delegationFirstStep(report: BeaiOperatingJudgmentReport): string {
  switch (report.delegation.candidate) {
    case "skill_candidate":
      return "먼저 반복 절차, 입력, 출력, 금지사항을 짧게 적어 스킬 후보로만 둡니다.";
    case "agent_candidate":
      return "먼저 목표, 책임 범위, 종료 조건을 고정하고 사용자 승인 전에는 에이전트를 만들지 않습니다.";
    case "workflow_candidate":
      return "먼저 수동 워크플로로 1회 실행해 보고 반복 가능한 단계만 분리합니다.";
    case "automation_candidate":
      return "먼저 수동 실행 결과, 실패 범위, 중단 방법, 보고 경로를 확인합니다.";
    case "approval_required":
      return report.risk.strongApprovalRequired
        ? "먼저 고위험 경계와 승인 문장을 분리하고, 실행은 보류합니다."
        : "먼저 무엇을 승인하는지와 되돌릴 수 있는지를 확인합니다.";
    case "do_not_do":
      return "현재 요청은 실행하지 않고, 하지 말아야 할 범위만 고정합니다.";
    case "hold":
      return "지금은 맡기기보다 목적과 성공 기준을 한 문장으로 좁힙니다.";
    case "direct_answer":
      return "지금은 별도 위임 없이 짧게 답하면 됩니다.";
  }
}

export function renderDelegationSurfaceReply(plan: BeaiTurnPlan): string | null {
  const report = plan.operatingJudgment;
  if (report.delegation.candidate === "direct_answer" && !/(맡|위임|스킬|에이전트|자동화|workflow|워크플로|delegate|agent|skill|cron)/i.test(plan.currentTurn.cleanInput)) {
    return null;
  }

  const lines = [
    `판단: ${delegationCandidateLabel(report.delegation.candidate)}로 보는 게 맞습니다.`,
    `수준: ${delegationLevelLabel(report.delegation.level)}입니다.`,
    "",
    `이유: ${report.delegation.reasons.slice(0, 2).join(" / ") || "현재 요청의 범위와 위험도를 기준으로 판단했습니다."}`
  ];

  if (report.risk.families.length > 0) {
    lines.push(`주의 경계: ${report.risk.families.slice(0, 4).join(", ")}`);
  }
  if (report.risk.strongApprovalRequired) {
    lines.push("이 요청은 강한 승인 전에는 실행하지 않는 쪽이 안전합니다.");
  } else if (report.risk.approvalRequired) {
    lines.push("실행하려면 먼저 사용자 승인을 분리해야 합니다.");
  }
  lines.push("", `첫 안전 단계: ${delegationFirstStep(report)}`);
  lines.push("", "기준: BEAI는 후보를 판단할 뿐, 사용자 승인 없이 스킬/에이전트/워크플로/크론을 자동 실행하지 않습니다.");
  return lines.join("\n");
}

export function shouldRenderDelegationSurface(plan: BeaiTurnPlan): boolean {
  const input = plan.currentTurn.cleanInput;
  const asksForDelegationJudgment =
    /(맡겨도|맡길|위임|delegate|후보|판단|검토|만들까|만들지|스킬로\s*만|에이전트에게|agent에게|자동화할까|자동화\s*후보|cron\s*후보|크론\s*후보)/i.test(
      input
    );
  if (asksForDelegationJudgment && /(스킬|skill|에이전트|agent|워크플로|workflow|자동화|cron|크론|맡|위임|delegate)/i.test(input)) return true;
  return plan.operatingJudgment.delegation.candidate !== "direct_answer" && plan.operatingJudgment.delegation.candidate !== "approval_required"
    ? /(후보|검토|판단|가능|만들|설계)/i.test(input)
    : false;
}

function stateHygieneClassLabel(item: OperatingStateHygieneClass): string {
  switch (item) {
    case "memory":
      return "기억/메모리";
    case "agreement":
      return "합의/기준";
    case "project_state":
      return "프로젝트 상태";
    case "session_continuity":
      return "세션 연속성";
    case "task_history":
      return "태스크 이력";
    case "transcript_residue":
      return "대화 표면 흔적";
    case "tool_failure_residue":
      return "도구 실패 흔적";
    case "approval_residue":
      return "승인 카드 흔적";
  }
}

function stateHygieneFirstCheck(item: OperatingStateHygieneClass): string {
  switch (item) {
    case "task_history":
      return "먼저 task pressure가 0 queued / 0 running인지 확인하고, 그렇다면 과거 issue는 현재 장애가 아니라 historical residue로 분리합니다.";
    case "transcript_residue":
      return "대화창에 남은 system/recovery/approval 문구는 새 사용자 요청으로 취급하지 않고 표면 흔적으로 분리합니다.";
    case "approval_residue":
      return "만료되었거나 반복 노출된 approval card는 실행 완료/실패 근거가 아니라 승인 대기 표면으로만 봅니다.";
    case "tool_failure_residue":
      return "과거 command/tool 실패 로그는 현재 실패로 단정하지 않고, 같은 실패가 재현되는지 따로 확인합니다.";
    case "session_continuity":
      return "세션 인계 정보는 장기 기억이 아니라 다음 대화용 continuity로만 다룹니다.";
    case "project_state":
      return "버전 기준, rollback point, 배포 기준은 project state로 분리해 최신/과거 기준을 섞지 않습니다.";
    case "memory":
      return "기억 후보는 바로 장기 기억으로 승격하지 않고, 현재 판단에 필요한지 먼저 봅니다.";
    case "agreement":
      return "합의/원칙은 사용자가 확정한 기준과 임시 의견을 나눠 봅니다.";
  }
}

export function renderStateHygieneSurfaceReply(plan: BeaiTurnPlan): string | null {
  const classes = plan.operatingJudgment.stateHygiene.classes;
  if (classes.length === 0) return null;

  const labels = classes.map(stateHygieneClassLabel);
  const checks = classes.slice(0, 3).map(stateHygieneFirstCheck);
  const lines = [
    "판단: 이건 기능 실행 문제가 아니라 상태 위생 점검 대상으로 먼저 보는 게 맞습니다.",
    `분리할 영역: ${labels.join(", ")}`,
    "",
    "먼저 볼 것:",
    ...checks.map((item) => `- ${item}`),
    "",
    "기준: BEAI는 현재 active 문제와 과거 residue를 섞지 않습니다. live 상태가 확인되기 전에는 남아 있는 문구나 과거 issue만으로 현재 장애라고 단정하지 않습니다."
  ];

  if (plan.operatingJudgment.rollback.state) {
    lines.push("정리 원칙: 원본 task/transcript/state 삭제는 마지막 수단입니다. 먼저 분류, 비활성화, 재현 확인, 백업 순서로 갑니다.");
  }
  return lines.join("\n");
}

export function shouldRenderStateHygieneSurface(plan: BeaiTurnPlan): boolean {
  const input = plan.currentTurn.cleanInput;
  if (plan.operatingJudgment.stateHygiene.classes.length === 0) return false;
  if (isActiveRuntimeOutageRequest(input)) return false;
  if (isSurfaceLoopComplaint(input)) return false;
  const explicitStateHygieneIntent =
    /(현재\s*문제.*과거\s*흔적|과거\s*흔적.*현재\s*문제|historical\s*residue|residue|메타데이터\s*흔적|남아\s*있는.*흔적|대화창.*시스템|내부\s*문구|system\s*(message|request)|task\s*issue|task\s*pressure|승인\s*요청.*반복|approval.*반복)/i.test(
      input
    );
  const explicitSeparationIntent = /(분리|구분|정리|위생|hygiene|오염)/i.test(input);
  const stateHygieneObject =
    /(task|queued|running|approval|승인|transcript|대화창|system|시스템|memory|메모리|agreement|합의|세션|session|흔적|residue|오염)/i.test(
      input
    );
  return explicitStateHygieneIntent || (explicitSeparationIntent && stateHygieneObject);
}

function isActiveRuntimeOutageRequest(input: string): boolean {
  const activeRuntimeObject =
    /(텔레그램|telegram|polling|poilling|폴링|gateway|게이트웨이|channel|채널|message|메시지|응답|reply|전송|send|수신|inbound|outbound|연동|접속)/i.test(
      input
    );
  const activeOutageSignal =
    /(끊|끊긴|끊킨|멈|먹통|무응답|응답\s*없|응답을\s*안|안\s*와|안\s*옴|안\s*된다|안\s*돼|failed|failure|error|timeout|timed\s*out|stall|disconnected|not\s*working|조치|해결|복구|진단|확인|문제.*뭔|뭐가.*문제)/i.test(
      input
    );
  return activeRuntimeObject && activeOutageSignal;
}

function isSurfaceLoopComplaint(input: string): boolean {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const surfaceTerm =
    /(보류|승인|approval|승인\s*경계|상태\s*위생|할\s*수\s*없|cannot|권한|카드|surface|표면\s*응답|문구|답변)/i.test(
      normalized
    );
  const loopSignal =
    /(계속|반복|똑같|같은|되풀이|무한|고정|stuck|loop|루프|입력하든|말하든|뭘\s*입력|무엇을\s*입력)/i.test(
      normalized
    );
  const malfunctionContext =
    /(멈|먹통|전달.{0,12}안|응답.{0,12}안|대시보드|dashboard|텔레그램|telegram|세션|새\s*세션|두\s*번째|2번째|second|첫.{0,8}정상|설치\s*후)/i.test(
      normalized
    );
  const noMatterWhat = /(입력하든|말하든|뭘\s*입력|무엇을\s*입력)/i.test(normalized);
  return surfaceTerm && loopSignal && (malfunctionContext || noMatterWhat);
}

function approvalRiskSummary(report: BeaiOperatingJudgmentReport): string {
  if (report.risk.strongApprovalRequired) return "강한 승인 경계입니다.";
  if (report.risk.approvalRequired) return "승인 경계가 있는 작업입니다.";
  return "현재 문장만 보면 강한 승인 경계는 뚜렷하지 않습니다.";
}

function approvalDefaultAction(report: BeaiOperatingJudgmentReport, input: string): string {
  if (/allow[-\s]?always|항상\s*허용|계속\s*허용/i.test(input)) {
    return "기본값은 allow-always가 아니라 allow-once입니다. 반복 승인 완화는 같은 읽기 전용 명령이 여러 번 안전하게 반복된다는 증거가 있을 때만 검토합니다.";
  }
  if (report.risk.strongApprovalRequired) {
    return "외부 발송, 삭제, 결제, 브라우저 제출, 권한 변경, 장기 기억 쓰기 같은 경계가 있으면 승인 전에 목적, 대상, 되돌림 가능성을 먼저 확인합니다.";
  }
  if (report.risk.approvalRequired) {
    return "계속하려면 이번 1회 작업 범위만 확인하고 allow-once로 처리하는 쪽이 안전합니다.";
  }
  return "명령 승인 카드가 뜬 경우에도 먼저 읽기 전용인지, 쓰기/변경/재시작/설치가 섞였는지 확인합니다.";
}

export function renderApprovalBoundarySurfaceReply(plan: BeaiTurnPlan): string | null {
  const report = plan.operatingJudgment;
  const summary = report.approvalErgonomics.approvalSummary;
  const lines = [
    `하려는 일: ${summary.action}`,
    `영향 범위: ${summary.impactScope}`,
    `건드리지 않음: ${summary.doesNotTouch}`,
    `복구 방법: ${summary.recovery}`,
    `진행 여부: ${summary.decision}`
  ];

  if (report.risk.families.length > 0) {
    lines.push(`주의 경계: ${report.risk.families.slice(0, 5).join(", ")}`);
  }
  if (report.stateHygiene.classes.includes("approval_residue")) {
    lines.push("참고: 반복 승인 카드나 만료된 승인 ID는 현재 실행 결과가 아니라 승인 대기 흔적으로만 봅니다.");
  }
  lines.push("", "기준: BEAI는 저위험 준비 작업은 멈추지 않고, 실제 손실·노출·비용·복구 어려운 변경이 생기는 순간에만 승인받습니다.");
  return lines.join("\n");
}

export function shouldRenderApprovalBoundarySurface(plan: BeaiTurnPlan): boolean {
  const input = plan.currentTurn.cleanInput;
  if (isSurfaceLoopComplaint(input)) return false;
  if (shouldRenderRecoverySummary(input)) return false;
  if (
    plan.operatingJudgment.approvalErgonomics.riskTransition === "same_scope_continuation" &&
    !plan.operatingJudgment.risk.approvalRequired
  ) {
    return false;
  }
  const asksApprovalJudgment =
    /(승인.*(해도|눌러도|허용|괜찮|문제|반복|계속)|allow[-\s]?(once|always)|approve|deny|approval|plugin approval|codex_command_approval|명령\s*승인|승인\s*요청)/i.test(
      input
    );
  const highRiskExecutionNeedsApprovalSurface =
    plan.operatingJudgment.approvalErgonomics.shouldAskUserNow &&
    hasHighRiskExecutionSurfaceRequest(input);
  if (highRiskExecutionNeedsApprovalSurface) return true;
  if (!asksApprovalJudgment) return false;
  if (/(그냥\s*승인해|대신\s*승인|자동\s*승인|우회)/i.test(input)) return true;
  return plan.operatingJudgment.risk.approvalRequired || plan.operatingJudgment.stateHygiene.classes.includes("approval_residue") || asksApprovalJudgment;
}

export function shouldTranslateCapability(input: string): boolean {
  return /(자동화|반복|스킬|skill|플러그인|plugin|에이전트|agent|cron|크론|메모리|memory|OpenClaw.*할 수|오픈클로.*할 수)/i.test(input);
}

function isInstallOrUpgradeRequest(input: string): boolean {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  return /(zip|압축|첨부|파일|패키지|package).{0,40}(설치|install|깔|적용|업데이트|교체|업그레이드|upgrade)|(설치|install|깔|적용|업데이트|교체|업그레이드|upgrade).{0,40}(zip|압축|첨부|파일|패키지|package)/i.test(
    normalized
  );
}

function isVagueActionFollowup(input: string): boolean {
  const normalized = String(input || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized || normalized.length > 36) return false;
  return /^(야|뭐야|왜|그래서|그래서\s*(조치|해결|고쳐|복구|진단|확인).{0,8}|조치\s*해|조치를\s*해|해결해|고쳐|고쳐줘|복구해|지금\s*문제가\s*뭔데|문제가\s*뭔데|뭔데|어쩌라고)$/i.test(
    normalized
  );
}

function isConceptualDiscussion(input: string): boolean {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const conceptual =
    /(개념|철학|방향|설계|기획|계획|의견|생각|비교|차이|원리|구조|상품|성능|토큰|런타임|플러그인|스킬|에이전트|크론|자동화|대화\s*능력)/i.test(
      normalized
    );
  const activeFailure = /(안\s*돼|무응답|응답\s*(없|안)|끊|끊긴|끊킨|멈|먹통|failed|error|timeout|stall|disconnected)/i.test(
    normalized
  );
  return conceptual && !activeFailure;
}

function stripSurfaceContractMetadata(input: string): string {
  return String(input || "")
    .replace(/\n+Detected install package candidate:\n[\s\S]*$/i, "")
    .trim();
}

function surfaceContractGuidance(kind: SurfaceInterventionKind): string {
  switch (kind) {
    case "state_hygiene":
      return "state hygiene may guide the model, but must not replace active troubleshooting or vague follow-up turns.";
    case "recovery":
      return "recovery may hard-rewrite only for clear operational failures, not installs, artifacts, or conceptual discussion.";
    case "capability_translation":
      return "capability translation may explain concepts, but must not override install, approval, or active failure turns.";
    case "delegation":
      return "delegation may guide candidate selection, but must not override active failure, install, or artifact turns.";
    default:
      return `${kind} surface is allowed only when it does not conflict with the current user intent.`;
  }
}

export function decideSurfaceIntervention(plan: BeaiTurnPlan, kind: SurfaceInterventionKind): SurfaceInterventionDecision {
  const input = stripSurfaceContractMetadata(plan.currentTurn.cleanInput);
  const isApprovalSurface = kind === "approval_boundary";
  const isInstallSurface = kind === "install_guide" || kind === "install_resume";
  const isRecoverySurface = kind === "recovery";

  if (isSurfaceLoopComplaint(input) && kind !== "execution_review") {
    return {
      mode: "defer_to_model",
      allowHardRewrite: false,
      reason: "surface loop complaints must be diagnosed from live context, not answered by another canned surface.",
      strongerCurrentIntent: "surface_loop_complaint"
    };
  }

  if (isActiveRuntimeOutageRequest(input) && kind !== "recovery" && !isApprovalSurface) {
    return {
      mode: "guidance_only",
      allowHardRewrite: false,
      reason: "active runtime outage must be handled as live troubleshooting, not overwritten by a generic surface.",
      strongerCurrentIntent: "active_runtime_outage"
    };
  }

  if (isVagueActionFollowup(input) && !isApprovalSurface && !isRecoverySurface && !isInstallSurface) {
    return {
      mode: "defer_to_model",
      allowHardRewrite: false,
      reason: "vague action/follow-up turns need current-context answering, not a canned surface replacement.",
      strongerCurrentIntent: "vague_action_followup"
    };
  }

  if (isInstallOrUpgradeRequest(input) && !isInstallSurface && !isApprovalSurface) {
    return {
      mode: "defer_to_model",
      allowHardRewrite: false,
      reason: "install/upgrade intent is stronger than generic recovery, state hygiene, delegation, or capability surfaces.",
      strongerCurrentIntent: "install_or_upgrade"
    };
  }

  if (plan.responseInertia.requiredShift === "produce_artifact" && kind !== "execution_review" && !isApprovalSurface && !isInstallSurface && !isRecoverySurface) {
    return {
      mode: "defer_to_model",
      allowHardRewrite: false,
      reason: "artifact requests should produce the requested artifact instead of being replaced by a guidance surface.",
      strongerCurrentIntent: "artifact_request"
    };
  }

  if (isConceptualDiscussion(input) && (kind === "recovery" || kind === "state_hygiene")) {
    return {
      mode: "defer_to_model",
      allowHardRewrite: false,
      reason: "conceptual discussion should not be converted into operational recovery or state hygiene.",
      strongerCurrentIntent: "conceptual_discussion"
    };
  }

  if (kind === "state_hygiene" && !shouldRenderStateHygieneSurface(plan)) {
    return {
      mode: "guidance_only",
      allowHardRewrite: false,
      reason: surfaceContractGuidance(kind)
    };
  }

  if (isRecoverySurface && !shouldRenderRecoverySummary(input)) {
    return {
      mode: "guidance_only",
      allowHardRewrite: false,
      reason: surfaceContractGuidance(kind)
    };
  }

  return {
    mode: "hard_rewrite",
    allowHardRewrite: true,
    reason: "surface intent is explicit and does not conflict with a stronger current-turn intent."
  };
}

function detectRecoveryFamily(input: string): RecoveryFamily {
  if (/텔레그램|telegram|polling|poilling|폴링|dm|bot|메시지|메세지|응답\s*(안|없)|무응답|안\s*와|안\s*옴/i.test(input)) return "telegram_surface";
  if (/gateway|게이트웨이|daemon|launchagent|18789|reachable|event loop|재시작/i.test(input)) return "gateway_runtime";
  if (/oauth|로그인|auth|인증|model|모델|gpt|openai|토큰/i.test(input)) return "model_auth";
  if (/plugin|플러그인|hook|hooks|extension|enabled|doctor/i.test(input)) return "plugin_runtime";
  if (/memory|메모리|기억|context|맥락|오염|agreement|합의/i.test(input)) return "memory_context";
  if (/session|세션|queue|queued|handoff|이어|분기/i.test(input)) return "session_queue";
  if (/cron|크론|자동화|반복|schedule|예약|heartbeat|task/i.test(input)) return "cron_automation";
  return "unknown";
}

function confirmedRecoveryState(input: string, family: RecoveryFamily): string[] {
  const confirmed: string[] = [];
  if (/OK|reachable|running|ready|loaded|통과|정상|응답/i.test(input)) confirmed.push("일부 상태 신호는 정상으로 보입니다.");
  if (/failed|error|warn|blocked|missing|unavailable|무응답|안\s*돼|실패/i.test(input)) confirmed.push("문제 신호가 보고되었습니다.");
  if (family !== "unknown") confirmed.push(`문제 범위는 ${family} 쪽으로 먼저 좁혀 볼 수 있습니다.`);
  return confirmed.length > 0 ? confirmed : ["아직 확인된 상태 신호가 충분하지 않습니다."];
}

function likelyRecoveryCauses(family: RecoveryFamily): string[] {
  switch (family) {
    case "telegram_surface":
      return ["Telegram 채널 수신/발신 문제", "allowlist 또는 pairing 문제", "Gateway는 살아 있지만 채널 라우팅이 막힌 경우"];
    case "gateway_runtime":
      return ["Gateway 프로세스 재시작 중", "LaunchAgent 상태 불일치", "로컬 포트 또는 auth token 연결 문제"];
    case "model_auth":
      return ["OAuth 세션 만료", "모델 provider 인증 누락", "기본 모델 설정과 실제 로그인 상태 불일치"];
    case "plugin_runtime":
      return ["플러그인 register 오류", "hook 이름 또는 manifest 호환성 문제", "enabled 상태와 실제 loaded 상태 불일치"];
    case "memory_context":
      return ["기억 후보와 합의 자산 혼동", "세션 요약이 현재 요청을 덮는 문제", "저장하지 말아야 할 맥락이 남은 경우"];
    case "session_queue":
      return ["handoff seed 누락", "queued injection 전달 실패", "새 세션 첫 턴에서 이전 상태를 못 읽은 경우"];
    case "cron_automation":
      return ["반복 조건 미확정", "자동화 작업 실패 알림 누락", "위험 작업을 자동화하기 전 승인 경계가 부족한 경우"];
    case "unknown":
      return ["아직 family를 좁힐 상태 출력이 부족합니다."];
  }
}

function recoveryUnknowns(family: RecoveryFamily): string[] {
  switch (family) {
    case "telegram_surface":
      return ["Gateway 상태", "Telegram account 상태", "실제 왕복 메시지 성공 여부"];
    case "gateway_runtime":
      return ["LaunchAgent pid", "gateway health", "최근 gateway log"];
    case "model_auth":
      return ["현재 auth profile", "기본 모델 provider", "OAuth 만료 여부"];
    case "plugin_runtime":
      return ["plugins doctor 결과", "hooks ready 여부", "플러그인 config enabled 여부"];
    case "memory_context":
      return ["어떤 내용이 후보인지", "어떤 내용이 합의 자산인지", "버려야 할 context가 남았는지"];
    case "session_queue":
      return ["source/target session key", "trace id", "queued injection capture 여부"];
    case "cron_automation":
      return ["반복 시간", "실패 시 알림 경로", "자동화해도 되는 범위"];
    case "unknown":
      return ["status 출력", "관련 로그", "마지막으로 성공했던 지점"];
  }
}

function recoveryNextCheck(family: RecoveryFamily): string {
  switch (family) {
    case "telegram_surface":
      return "먼저 OpenClaw status에서 Telegram이 OK인지 보고, 실제 메시지 한 번으로 왕복 응답을 확인합니다.";
    case "gateway_runtime":
      return "먼저 gateway status와 health를 확인하고, 필요할 때만 gateway restart로 좁게 복구합니다.";
    case "model_auth":
      return "먼저 모델 인증 상태를 확인하고, OAuth 만료라면 로그인만 다시 갱신합니다.";
    case "plugin_runtime":
      return "먼저 plugins doctor와 hooks 목록을 확인하고, 문제가 있는 플러그인만 disable/restart 대상으로 좁힙니다.";
    case "memory_context":
      return "먼저 memory candidate, agreement asset, discarded context를 분리해서 확인합니다.";
    case "session_queue":
      return "먼저 continuity trace에서 queue와 capture가 같은 trace id로 이어졌는지 확인합니다.";
    case "cron_automation":
      return "먼저 한 번 수동 실행으로 같은 일이 안전하게 끝나는지 확인합니다.";
    case "unknown":
      return "먼저 status 출력과 최근 로그를 보고 family를 하나로 좁힙니다.";
  }
}

function recoveryFamilyLabel(family: RecoveryFamily): string {
  switch (family) {
    case "telegram_surface":
      return "텔레그램 연결";
    case "gateway_runtime":
      return "게이트웨이 실행";
    case "model_auth":
      return "모델 로그인과 인증";
    case "plugin_runtime":
      return "플러그인 작동";
    case "memory_context":
      return "기억과 맥락";
    case "session_queue":
      return "세션 이어받기";
    case "cron_automation":
      return "자동화 실행";
    case "unknown":
      return "아직 좁혀지지 않은 문제";
  }
}

export function mapRecoverySummary(input: string): RecoverySummary {
  const family = detectRecoveryFamily(input);
  return {
    family,
    confirmedState: confirmedRecoveryState(input, family),
    likelyCauses: likelyRecoveryCauses(family),
    unknowns: recoveryUnknowns(family),
    nextCheck: recoveryNextCheck(family),
    avoid: [
      "전체 삭제나 재설치부터 시작하지 않습니다.",
      "확인되지 않은 원인을 완료/해결로 말하지 않습니다.",
      "여러 복구를 한 번에 섞지 않습니다."
    ]
  };
}

export function renderRecoverySummaryReply(input: string): string {
  const summary = mapRecoverySummary(input);
  const lines = [
    `먼저 문제 범위를 ${recoveryFamilyLabel(summary.family)} 쪽으로 좁혀 보겠습니다.`,
    "",
    "확인된 것:",
    ...summary.confirmedState.map((item) => `- ${item.replace(summary.family, recoveryFamilyLabel(summary.family))}`),
    "",
    "가능성이 있는 원인:",
    ...summary.likelyCauses.slice(0, 3).map((item) => `- ${item}`),
    "",
    "아직 모르는 것:",
    ...summary.unknowns.slice(0, 3).map((item) => `- ${item}`),
    "",
    `다음 확인: ${summary.nextCheck}`,
    "",
    `피할 것: ${summary.avoid[0]}`
  ];
  return lines.join("\n");
}

export function recoveryEscalationFingerprint(input: string): string {
  const family = detectRecoveryFamily(input);
  const normalized = String(input || "")
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/\b[0-9a-f]{8,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const intent =
    /상태|status|doctor|hooks|tasks|logs|확인|점검|검증/.test(normalized)
      ? "inspection"
      : /응답|무응답|안 돼|not working|failed|error|오류|실패/.test(normalized)
        ? "failure"
        : /왜|원인|진단|diagnos|cause/.test(normalized)
          ? "diagnosis"
          : "recovery";
  return `${family}:${intent}`;
}

export function renderRecoveryEscalationReply(input: string, occurrence: number): string {
  const summary = mapRecoverySummary(input);
  const stage: RecoveryEscalationStage = occurrence <= 1 ? 1 : occurrence === 2 ? 2 : 3;
  if (stage === 1) return renderRecoverySummaryReply(input);

  if (stage === 2) {
    return [
      `같은 유형의 문제가 반복되고 있어서, 이제 설명을 반복하지 않고 ${recoveryFamilyLabel(summary.family)} 상태 확인으로 넘어가야 합니다.`,
      "",
      "지금 필요한 확인:",
      ...summary.unknowns.slice(0, 3).map((item) => `- ${item}`),
      "",
      `다음 행동: ${summary.nextCheck}`,
      "",
      "기준: 이 단계에서는 추정 답변보다 실제 status/doctor/hooks/tasks/logs 근거가 필요합니다."
    ].join("\n");
  }

  return [
    `같은 ${recoveryFamilyLabel(summary.family)} 문제가 세 번째 이상 반복되고 있습니다.`,
    "",
    "이제 일반 복구 문구로는 충분하지 않습니다.",
    "",
    "다음 중 하나로 좁혀야 합니다.",
    "- diagnostic bundle을 만들어 실제 상태와 로그를 묶어 확인합니다.",
    "- BEAI Runtime이 원인인지 비교하기 위해 BEAI만 임시 비활성화하고 OpenClaw/Gateway/Telegram이 살아나는지 확인합니다.",
    "- Gateway/Telegram/model/plugin/task 중 어느 층이 막혔는지 상태 출력으로 분리합니다.",
    "",
    "피할 것: 전체 OpenClaw 삭제나 재설치부터 시작하지 않습니다."
  ].join("\n");
}

export function shouldRenderRecoverySummary(input: string): boolean {
  const normalized = String(input || "").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  if (/(zip|압축|첨부|파일).{0,30}(설치|install|깔|적용|업데이트|교체)|(설치|install|깔|적용|업데이트|교체).{0,30}(zip|압축|첨부|파일)/i.test(normalized)) {
    return false;
  }
  const asksForActualInspection =
    /(상태\s*파악|전체\s*현재\s*상태|현재\s*상태.*파악|충돌\s*지점|접속\s*문제.*찾|문제.*찾|개선안|점검|확인|조사|로그|status|doctor|hooks|tasks|logs|inspect|diagnostic|diagnostics)/i.test(normalized) &&
    /(오픈클로|openclaw|비아이|beai|텔레그램|telegram|게이트웨이|gateway|플러그인|plugin|훅|hook|설치|install|연동|접속)/i.test(normalized);
  if (asksForActualInspection) return false;
  const hasOutageRecoverySignal =
    /(안\s*돼|무응답|응답\s*(없|안)|응답을\s*안|안\s*와|안\s*옴|끊|끊긴|끊킨|멈|먹통|timeout|timed\s*out|stall|disconnected|blocked|unavailable|not\s*working)/i.test(
      normalized
    );
  const hasFailureWordSignal = /(오류|실패|failed|error)/i.test(normalized);
  const hasWeakRecoverySignal = /(문제|복구|진단|왜|조치|해결)/i.test(normalized);
  const hasOperationalTarget =
    /(오픈클로|openclaw|비아이|beai|텔레그램|telegram|게이트웨이|gateway|플러그인|plugin|훅|hook|설치|install|연동|접속|메모리|memory|task|approval|승인)/i.test(
      normalized
    );
  const hasOperationalFailureContext =
    hasOperationalTarget ||
    /(command|tool|hook|plugin|gateway|telegram|oauth|auth|session|queue|cron|message|send|reply|delivery|로그|상태|실행|전송|메시지|명령|도구|훅|세션|큐|인증)/i.test(
      normalized
    );
  const looksLikeConceptualFailureDiscussion =
    /(가능성|리스크|위험|handling|핸들링|어떻게\s*봐|설계|전략|분석|케이스|테스트|예시)/i.test(normalized) && !hasOperationalTarget;
  return hasOutageRecoverySignal || (hasFailureWordSignal && hasOperationalFailureContext && !looksLikeConceptualFailureDiscussion) || (hasWeakRecoverySignal && hasOperationalTarget);
}

export function updateBeaiMemoryAssets(workspaceDir: string | undefined, plan: BeaiTurnPlan, finalText?: string): void {
  if (!workspaceDir) return;
  const baseDir = path.join(workspaceDir, "state", "beai");
  const memoryPath = path.join(baseDir, "memory-candidates.json");
  const agreementPath = path.join(baseDir, "agreement-assets.json");
  const projectPath = path.join(baseDir, "project-state.json");
  const discardedPath = path.join(baseDir, "discarded-context.json");
  const relevancePath = path.join(baseDir, "memory-relevance-report.json");
  const skillRoutingPath = path.join(baseDir, "skill-routing-report.json");
  const operatingJudgmentPath = path.join(baseDir, "operating-judgment-report.json");
  const workflowCardPath = path.join(baseDir, "workflow-card.json");
  const manualRunEvidencePath = path.join(baseDir, "manual-run-evidence-ledger.json");
  const promotionGatePath = path.join(baseDir, "promotion-gate.json");
  const automationRegistryPath = path.join(baseDir, "automation-registry.json");
  const workflowStateLedgerPath = path.join(baseDir, "workflow-state-ledger.json");
  const responseInertiaPath = path.join(baseDir, "response-inertia-profile.json");
  const judgmentSharpnessPath = path.join(baseDir, "judgment-sharpness-profile.json");
  const conversationScenePath = path.join(baseDir, "conversation-scene-continuity.json");
  const inputLevelCompanionPath = path.join(baseDir, "input-level-companion-profile.json");

  const existingMemory = readJsonArray<BeaiMemoryCandidate>(memoryPath);
  const existingAgreements = readJsonArray<BeaiAgreementAsset>(agreementPath);
  const existingDiscarded = readJsonArray<BeaiDiscardedContextItem>(discardedPath);
  const existingAutomationRegistry = readJsonObject<WorkflowStateLedger["automationRegistry"]>(automationRegistryPath);
  const memoryCandidates = mergeUniqueByText(existingMemory, buildBeaiMemoryCandidates(plan, finalText));
  const workflowStateLedger: WorkflowStateLedger = {
    ...plan.workflowStateLedger,
    automationRegistry: existingAutomationRegistry?.entries
      ? {
          entries: existingAutomationRegistry.entries,
          note: plan.workflowStateLedger.automationRegistry.note
        }
      : plan.workflowStateLedger.automationRegistry
  };

  writeJsonFile(memoryPath, memoryCandidates);
  writeJsonFile(relevancePath, buildMemoryRelevanceReport(memoryCandidates, plan, finalText));
  writeJsonFile(skillRoutingPath, plan.skillRouting);
  writeJsonFile(operatingJudgmentPath, plan.operatingJudgment);
  writeJsonFile(responseInertiaPath, plan.responseInertia);
  writeJsonFile(judgmentSharpnessPath, plan.judgmentSharpness);
  writeJsonFile(conversationScenePath, plan.conversationSceneContinuity);
  writeJsonFile(inputLevelCompanionPath, plan.inputLevelCompanion);
  writeJsonFile(workflowStateLedgerPath, workflowStateLedger);
  writeJsonFile(workflowCardPath, workflowStateLedger.workflowCard);
  writeJsonFile(manualRunEvidencePath, workflowStateLedger.manualRunEvidence);
  writeJsonFile(promotionGatePath, workflowStateLedger.promotionGate);
  writeJsonFile(automationRegistryPath, workflowStateLedger.automationRegistry);
  writeJsonFile(agreementPath, mergeUniqueByText(existingAgreements, buildBeaiAgreementAssets(plan, finalText)));
  writeJsonFile(projectPath, buildBeaiProjectStateAsset(plan, finalText));
  writeJsonFile(discardedPath, mergeUniqueByText(existingDiscarded, buildDiscardedContextItems(plan, finalText), 80));
}

export function updateSessionContinuityState(workspaceDir: string | undefined, plan: BeaiTurnPlan): void {
  if (!workspaceDir) return;
  const filePath = path.join(workspaceDir, "state", "beai", "session-continuity.json");
  const baseDir = path.join(workspaceDir, "state", "beai");
  const continuity = buildSessionContinuityState(plan);
  const arc = buildConversationArcCapsule(plan, continuity);
  writeJsonFile(filePath, continuity);
  writeJsonFile(path.join(baseDir, "conversation-arc.json"), arc);
  writeJsonFile(path.join(baseDir, "new-session-context-pack.json"), buildNewSessionContextPack(plan));
}

function renderAgreementCandidates(plan: BeaiTurnPlan, finalText?: string): string {
  const candidates = extractAgreementCandidates(plan, finalText);
  const lines = [
    "# Agreement Candidates",
    "",
    "Purpose: preserve runtime-detected durable rule candidates without mutating accepted agreements automatically.",
    "",
    "Status: review required before promotion into `state/agreements.md`.",
    "",
    "## Current Turn Context",
    "",
    `- mode: ${plan.mode}`,
    `- primary class: ${plan.primaryClass}`,
    `- risk level: ${plan.riskLevel}`,
    "",
    "## Candidate Rules",
    ""
  ];

  if (candidates.length === 0) {
    lines.push("- no durable cross-cutting agreement candidate was detected in this turn");
  } else {
    for (const candidate of candidates) {
      lines.push(`- ${candidate.statement}`);
      lines.push(`  - rationale: ${candidate.rationale}`);
    }
  }

  lines.push(
    "",
    "## Promotion Rule",
    "",
    "- promote only after explicit review or approval",
    "- do not copy tool output or transient task chatter into accepted agreements",
    "- prefer project state when the item is still project-local rather than cross-cutting"
  );

  return `${lines.join("\n")}\n`;
}

export function updateAgreementCandidates(workspaceDir: string | undefined, plan: BeaiTurnPlan, finalText?: string): void {
  if (!workspaceDir) return;
  const filePath = path.join(workspaceDir, "state", "agreement-candidates.md");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, renderAgreementCandidates(plan, finalText), "utf8");
}
