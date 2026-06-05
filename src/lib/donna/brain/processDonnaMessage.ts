// Sprint 1911–1960 — DONNA Unified Conversation Brain V1
//
// processDonnaMessage() is the PRIMARY DONNA decision layer.
//
// It is NOT a fallback. It runs for all general conversational input
// after the specific active-state matchers (active draft, onboarding,
// attendance slot-filling) have been given their chance.
//
// Brain orchestration sequence:
//   1. Check active guided workflow         → route_guided_answer
//   2. Check COO control phrase             → route_coo_control
//   3. Check continuity phrase              → respond (goal memory)
//   4. Check today guidance question        → respond (ranked priorities)
//   5. Check daily brief intent             → fetch_brief
//   6. Check review queue intent            → open_review
//   7. Check attention intent               → fetch_attention
//   8. Classify intent                      → intent engine
//   9. Resolve entity                       → entity resolver
//  10. Resolve goal                         → goal engine
//  11. Check context pack                   → respond (page-specific)
//  12. Build reasoning block                → why/why now/why first
//  13. Build ChatGPT-like response          → respond
//  14. Low confidence fallback              → route_coo_prompt / god_mode
//
// Returns DonnaMessageResult — the execution layer (DonnaAssistantButton)
// reads the action contract and calls the right React functions.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Uses existing engines — does not duplicate their logic.
//   - Approval guardrails are never bypassed.
//   - Every response follows: Answer → Reason → Next → Follow-up.

import { classifyIntent } from '@/lib/donna/intent/donnaIntentEngine'
import type { DirectorIntent } from '@/lib/donna/intent/donnaIntentEngine'
import { resolveEntities } from '@/lib/donna/entities/donnaEntityResolver'
import type { EntityResolutionResult } from '@/lib/donna/entities/donnaEntityResolver'
import { resolveIntentToGoal, buildGoalInferenceMessage } from '@/lib/donna/goals/donnaGoalEngine'
import type { GoalResult } from '@/lib/donna/goals/donnaGoalEngine'
import { buildContinuityResponse, isContinuityPhrase } from '@/lib/donna/memory/donnaGoalMemory'
import type { DonnaGoalMemoryState } from '@/lib/donna/memory/donnaGoalMemory'
import { detectDirectorControl } from '@/lib/donna/guidance/donnaAutonomousGuidanceEngine'
import type { DirectorControlIntent } from '@/lib/donna/guidance/donnaAutonomousGuidanceEngine'
import { detectTodayGuidanceQuestion } from '@/lib/donna/guidance/donnaTodayGuidanceLoop'
import type { COOOrchestrationState } from '@/lib/donna/guidance/donnaCOOOrchestrationMemory'
import { getWorkflow } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'
import type { GuidedWorkflowId } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'
import type { GoalCompletionSession } from '@/lib/donna/workflows/donnaGoalCompletionModel'
import { resolveGoalSessionCommand, detectGoalWorkflowIntent } from '@/lib/donna/workflows/donnaWorkflowRegistry'
import type { GoalSessionCommand } from '@/lib/donna/workflows/donnaWorkflowRegistry'
import { getDonnaContextPackForRoute, lookupAnswerInContextPack } from '@/lib/donna/donnaContextPackRegistry'
import { matchesDailyBriefIntent } from '@/lib/donna/donnaIntentClassifier'
import { CONFIDENCE_ACT_THRESHOLD } from '@/lib/donna/intent/confidenceScoring'
import { buildChatGptLikeResponse, applyRolePolicy } from './donnaRoleResponsePolicy'
import type { DonnaResponseRole } from './donnaRoleResponsePolicy'
import { buildReasoningBlock } from '@/lib/donna/reasoning/donnaReasoningEngine'
import { resolveAmbiguousReference } from '@/lib/donna/reasoning/donnaAmbiguityResolutionEngine'
import { buildFollowUpForGoal, improveResponseQuality } from '@/lib/donna/reasoning/donnaConversationQualityEngine'
import {
  createDebugLog,
  logStep,
  finalizeLog,
  emitDebugLog,
} from './donnaBrainDebugLog'
import type { BrainDecisionLog } from './donnaBrainDebugLog'

// ── Input type ────────────────────────────────────────────────────────────────

export interface DonnaMessageInput {
  userMessage: string
  role: DonnaResponseRole
  route: string
  /** Whether the guided workflow is currently active (non-null = active) */
  activeGuidedWorkflowId: GuidedWorkflowId | null
  /** Active goal completion session (null = no active goal session) */
  activeGoalSession?: GoalCompletionSession | null
  /** Current COO orchestration state (null = no active priorities) */
  cooState: COOOrchestrationState | null
  /** Goal memory state from sessionStorage */
  goalMemory: DonnaGoalMemoryState | null
  /** Director first name for personalization */
  firstName?: string | null
  /** Count of pending review queue items */
  pendingReviews?: number
  /** Recent conversation turns for context */
  conversationHistory?: Array<{ role: 'user' | 'donna'; content: string }>
}

// ── Action contract ───────────────────────────────────────────────────────────

export type DonnaMessageAction =
  | 'respond'              // Brain has a direct response → show it + optionally speak
  | 'navigate'             // Navigate to a specific route
  | 'start_workflow'       // Start a guided completion workflow (form-filling)
  | 'start_goal_session'   // Start a goal completion session (task-level guided mode)
  | 'route_guided_answer'  // Active guided workflow → existing handleGuidedCompletionAnswer
  | 'route_goal_session'   // Active goal session → handle goal session command
  | 'route_coo_control'    // COO control command → existing handleCOOControlCommand
  | 'fetch_attention'      // Trigger handleFetchAttention
  | 'fetch_brief'          // Trigger handleFetchDailyBrief
  | 'open_review'          // Trigger handleOpenReviewQueue
  | 'route_coo_prompt'     // Complex COO question → existing handleDonnaCooPrompt chain
  | 'god_mode'             // Route to LLM God Mode

// ── Result type ───────────────────────────────────────────────────────────────

export interface DonnaNextAction {
  label: string
  route?: string
  workflowId?: GuidedWorkflowId | null
}

export interface DonnaMessageResult {
  action: DonnaMessageAction
  /** Full markdown-formatted response for display */
  response: string
  /** TTS-safe version — markdown stripped, truncated for speech */
  spokenResponse: string
  /** Intent detected by the brain */
  intent: DirectorIntent | null
  /** Entity resolved from the message */
  entity: EntityResolutionResult | null
  /** Goal resolved from intent + entity */
  goal: GoalResult | null
  /** Overall brain confidence 0–1 */
  confidence: number
  /** Recommended next action for the director */
  nextAction: DonnaNextAction | null
  /** Follow-up question DONNA wants to ask */
  followUpQuestion: string | null
  /** True when DONNA should speak the response */
  shouldSpeak: boolean
  /** Route to navigate to (for 'navigate' action) */
  navigateTo: string | null
  /** Workflow to start (for 'start_workflow' action) */
  startWorkflowId: GuidedWorkflowId | null
  /** COO control command detected (for 'route_coo_control' action) */
  cooControl: DirectorControlIntent | null
  /** Goal session command resolved from short phrases ("yes", "skip", "approve", etc.) */
  goalSessionCommand: GoalSessionCommand
  /** Goal type to start (for 'start_goal_session' action) */
  startGoalType: string | null
  /** Whether this response involves an approval-gated action */
  requiresApproval: boolean
  /** Known limitations or caveats in the response */
  limitations: string | null
  /** Dev-only decision log */
  debugLog: BrainDecisionLog
}

// ── Phrase detectors (inlined to avoid React component dependency) ─────────────

function isAttentionPhrase(lower: string): boolean {
  return (
    lower.includes('what needs attention') ||
    lower.includes('anything urgent') ||
    lower.includes('what should i do first') ||
    lower.includes('what is urgent') ||
    lower.includes("what's urgent") ||
    lower.includes('urgent items') ||
    lower.includes('needs attention') ||
    lower.includes('any urgent') ||
    lower.includes('priority items')
  )
}

function isReviewQueuePhrase(lower: string): boolean {
  return (
    lower.includes('show review queue') ||
    lower.includes('open review queue') ||
    lower.includes('review queue') ||
    lower.includes('needs my review') ||
    lower.includes('needs approval') ||
    lower.includes('pending approval') ||
    lower.includes('pending review') ||
    lower.includes('what needs approval')
  )
}

// ── Quick result builders ─────────────────────────────────────────────────────

function makeResult(
  action: DonnaMessageAction,
  partial: Partial<Omit<DonnaMessageResult, 'action' | 'debugLog'>>,
  debugLog: BrainDecisionLog,
): DonnaMessageResult {
  return {
    action,
    response: partial.response ?? '',
    spokenResponse: partial.spokenResponse ?? partial.response ?? '',
    intent: partial.intent ?? null,
    entity: partial.entity ?? null,
    goal: partial.goal ?? null,
    confidence: partial.confidence ?? 1.0,
    nextAction: partial.nextAction ?? null,
    followUpQuestion: partial.followUpQuestion ?? null,
    shouldSpeak: partial.shouldSpeak ?? (action === 'respond'),
    navigateTo: partial.navigateTo ?? null,
    startWorkflowId: partial.startWorkflowId ?? null,
    cooControl: partial.cooControl ?? null,
    goalSessionCommand: partial.goalSessionCommand ?? null,
    startGoalType: partial.startGoalType ?? null,
    requiresApproval: partial.requiresApproval ?? false,
    limitations: partial.limitations ?? null,
    debugLog,
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

/**
 * Primary DONNA decision layer.
 *
 * Called from DonnaAssistantButton after the active-state matchers (active draft,
 * onboarding, attendance, controller, UI dispatch, guided completion, COO control,
 * multi-step, template) have been checked. This function handles all general
 * conversational input.
 */
export function processDonnaMessage(input: DonnaMessageInput): DonnaMessageResult {
  const { userMessage, role, route, activeGuidedWorkflowId, cooState, goalMemory } = input
  const activeGoalSession = input.activeGoalSession ?? null
  const lower = userMessage.toLowerCase().trim()

  const debugLog = createDebugLog(userMessage, role, route)

  // ── Step 0a: Active goal session — route session commands first ──────────────
  // When a goal session is active, interpret short phrases ("yes", "skip",
  // "approve", "show evidence", "stop") as workflow commands rather than
  // new questions. Navigation continuity: session state is preserved across pages.
  logStep(debugLog, 'check_goal_session')
  if (activeGoalSession !== null &&
      (activeGoalSession.status === 'active' ||
       activeGoalSession.status === 'waiting_for_user' ||
       activeGoalSession.status === 'waiting_for_approval')) {
    const command = resolveGoalSessionCommand(userMessage)
    // Any recognized command routes to the goal session handler
    if (command !== null) {
      finalizeLog(debugLog, 'check_goal_session', 'route_goal_session')
      emitDebugLog(debugLog)
      return makeResult('route_goal_session', {
        confidence: 1.0,
        goalSessionCommand: command,
      }, debugLog)
    }
    // Non-command input while session active → still route to session
    // so the session handler can decide (e.g. treat as a question about current step)
    finalizeLog(debugLog, 'check_goal_session', 'route_goal_session')
    emitDebugLog(debugLog)
    return makeResult('route_goal_session', {
      confidence: 0.9,
      goalSessionCommand: null,
    }, debugLog)
  }

  // ── Step 0b: Goal workflow intent detection ──────────────────────────────────
  // Detect whether the director's message triggers one of the 8 goal workflows.
  // Runs before the form-filling guided workflow check so goal-level tasks
  // take precedence over form-filling workflows.
  logStep(debugLog, 'check_goal_workflow_intent')
  if (activeGoalSession === null && activeGuidedWorkflowId === null) {
    const goalWorkflow = detectGoalWorkflowIntent(userMessage)
    if (goalWorkflow) {
      finalizeLog(debugLog, 'check_goal_workflow_intent', 'start_goal_session')
      emitDebugLog(debugLog)
      return makeResult('start_goal_session', {
        confidence: 0.92,
        startGoalType: goalWorkflow.id,
        response: goalWorkflow.openingMessage,
        spokenResponse: goalWorkflow.openingMessage,
        followUpQuestion: `Would you like me to walk you through **${goalWorkflow.label}** now?`,
        navigateTo: goalWorkflow.fallbackRoute,
      }, debugLog)
    }
  }

  // ── Step 1: Active guided workflow (form-filling) ────────────────────────────
  logStep(debugLog, 'check_guided_workflow')
  if (activeGuidedWorkflowId !== null) {
    finalizeLog(debugLog, 'check_guided_workflow', 'route_guided_answer')
    emitDebugLog(debugLog)
    return makeResult('route_guided_answer', { confidence: 1.0 }, debugLog)
  }

  // ── Step 2: COO control command ──────────────────────────────────────────────
  logStep(debugLog, 'check_coo_control')
  if (cooState !== null && !cooState.isPaused) {
    const control = detectDirectorControl(userMessage)
    if (control !== 'none') {
      finalizeLog(debugLog, 'check_coo_control', 'route_coo_control')
      emitDebugLog(debugLog)
      return makeResult('route_coo_control', { cooControl: control, confidence: 0.95 }, debugLog)
    }
  }

  // ── Step 3: Continuity phrase ────────────────────────────────────────────────
  logStep(debugLog, 'check_continuity')
  if (isContinuityPhrase(userMessage)) {
    const continuity = buildContinuityResponse(userMessage)
    if (continuity) {
      const formatted = buildChatGptLikeResponse({
        answer: continuity.message,
        followUpQuestion: null,
        role,
      })
      finalizeLog(debugLog, 'check_continuity', 'respond')
      emitDebugLog(debugLog)
      return makeResult('respond', {
        response: applyRolePolicy(formatted.display, role),
        spokenResponse: formatted.spoken,
        navigateTo: continuity.route ?? null,
        confidence: 0.90,
      }, debugLog)
    }
  }

  // ── Step 4: Today guidance question ─────────────────────────────────────────
  // Handled inside handleDonnaCooPrompt (Sprint 1881 wiring).
  // Brain routes here to preserve that path.
  logStep(debugLog, 'check_today_guidance')
  if (detectTodayGuidanceQuestion(userMessage)) {
    // route_coo_prompt routes through handleDonnaCooPrompt which has the
    // Sprint 1881 today-guidance intercept at the top.
    finalizeLog(debugLog, 'check_today_guidance', 'route_coo_prompt')
    emitDebugLog(debugLog)
    return makeResult('route_coo_prompt', { confidence: 0.95 }, debugLog)
  }

  // ── Step 5: Daily brief intent ───────────────────────────────────────────────
  logStep(debugLog, 'check_daily_brief')
  if (matchesDailyBriefIntent(userMessage)) {
    finalizeLog(debugLog, 'check_daily_brief', 'fetch_brief')
    emitDebugLog(debugLog)
    return makeResult('fetch_brief', { confidence: 0.95 }, debugLog)
  }

  // ── Step 6: Review queue intent ──────────────────────────────────────────────
  if (isReviewQueuePhrase(lower)) {
    finalizeLog(debugLog, 'check_review_queue', 'open_review')
    emitDebugLog(debugLog)
    return makeResult('open_review', { confidence: 0.95 }, debugLog)
  }

  // ── Step 7: Attention intent ─────────────────────────────────────────────────
  if (isAttentionPhrase(lower)) {
    finalizeLog(debugLog, 'check_attention', 'fetch_attention')
    emitDebugLog(debugLog)
    return makeResult('fetch_attention', { confidence: 0.90 }, debugLog)
  }

  // ── Step 8: Ambiguity resolution ─────────────────────────────────────────────
  // Resolve "Sarah", "that one", "let's continue", "show me another" using context
  const resolved = resolveAmbiguousReference(userMessage, {
    lastEntityLabel: goalMemory?.lastRelevantEntity ?? null,
    lastGoalLabel: null,
    conversationHistory: input.conversationHistory ?? [],
  })
  const messageToProcess = resolved.resolved ?? userMessage

  // ── Step 9: Intent classification ───────────────────────────────────────────
  logStep(debugLog, 'run_intent')
  const intentResult = classifyIntent(messageToProcess, route)
  debugLog.intentDetected = intentResult.intent
  debugLog.confidence = intentResult.confidence

  // ── Step 10: Entity resolution ───────────────────────────────────────────────
  logStep(debugLog, 'run_entity')
  const entityResult = resolveEntities(messageToProcess)
  if (entityResult.primary) {
    debugLog.entityDetected = entityResult.primary.normalizedLabel
  }

  // ── Step 11: Goal resolution ─────────────────────────────────────────────────
  logStep(debugLog, 'run_goal')
  const goalResult = resolveIntentToGoal(intentResult, entityResult)
  debugLog.goalDetected = goalResult.goal

  // ── Step 12: Context pack ────────────────────────────────────────────────────
  logStep(debugLog, 'check_context_pack')
  const contextPack = getDonnaContextPackForRoute(route)
  if (contextPack) {
    const packAnswer = lookupAnswerInContextPack(contextPack, messageToProcess)
    if (packAnswer) {
      const followUp = buildFollowUpForGoal(goalResult, null)
      const formatted = buildChatGptLikeResponse({
        answer: packAnswer.response,
        followUpQuestion: followUp,
        role,
      })
      finalizeLog(debugLog, 'check_context_pack', 'respond')
      emitDebugLog(debugLog)
      return makeResult('respond', {
        response: applyRolePolicy(formatted.display, role),
        spokenResponse: formatted.spoken,
        intent: intentResult.intent,
        entity: entityResult,
        goal: goalResult,
        confidence: 0.85,
        followUpQuestion: followUp,
      }, debugLog)
    }
  }

  // ── Step 13: High-confidence goal → guided workflow ──────────────────────────
  if (goalResult.confidence >= CONFIDENCE_ACT_THRESHOLD && goalResult.workflowCandidate) {
    const workflow = getWorkflow(goalResult.workflowCandidate)
    if (workflow) {
      // Build the inference message explaining what goal was detected
      const inferenceMsg = buildGoalInferenceMessage(goalResult)
      const reasoning = buildReasoningBlock({
        intent: intentResult.intent,
        goal: goalResult.goal,
        entityLabel: entityResult.primary?.normalizedLabel ?? null,
        pendingReviews: input.pendingReviews ?? 0,
      })
      const followUp = 'Would you like me to walk you through it step by step?'
      const formatted = buildChatGptLikeResponse({
        answer: inferenceMsg,
        reason: reasoning?.why ?? null,
        nextBestAction: `I can guide you through: ${workflow.label}`,
        followUpQuestion: followUp,
        role,
      })
      const improved = improveResponseQuality(formatted.display, input.conversationHistory ?? [])
      finalizeLog(debugLog, 'build_reasoning', 'start_workflow')
      emitDebugLog(debugLog)
      return makeResult('start_workflow', {
        response: applyRolePolicy(improved.display, role),
        spokenResponse: improved.spoken,
        intent: intentResult.intent,
        entity: entityResult,
        goal: goalResult,
        confidence: goalResult.confidence,
        nextAction: { label: workflow.label, workflowId: goalResult.workflowCandidate },
        followUpQuestion: followUp,
        startWorkflowId: goalResult.workflowCandidate,
      }, debugLog)
    }
  }

  // ── Step 14: Medium-confidence goal → navigate + respond ─────────────────────
  if (goalResult.confidence >= 0.55 && goalResult.recommendedRoute) {
    const inferenceMsg = buildGoalInferenceMessage(goalResult)
    const reasoning = buildReasoningBlock({
      intent: intentResult.intent,
      goal: goalResult.goal,
      entityLabel: entityResult.primary?.normalizedLabel ?? null,
      pendingReviews: input.pendingReviews ?? 0,
    })
    const followUp = buildFollowUpForGoal(goalResult, entityResult.primary?.normalizedLabel ?? null)
    const formatted = buildChatGptLikeResponse({
      answer: inferenceMsg,
      reason: reasoning?.why ?? null,
      nextBestAction: goalResult.goalDescription,
      followUpQuestion: followUp,
      role,
    })
    const improved = improveResponseQuality(formatted.display, input.conversationHistory ?? [])
    logStep(debugLog, 'build_response')
    finalizeLog(debugLog, 'build_response', 'respond')
    emitDebugLog(debugLog)
    return makeResult('respond', {
      response: applyRolePolicy(improved.display, role),
      spokenResponse: improved.spoken,
      intent: intentResult.intent,
      entity: entityResult,
      goal: goalResult,
      confidence: goalResult.confidence,
      nextAction: { label: goalResult.goalDescription, route: goalResult.recommendedRoute },
      followUpQuestion: followUp,
      navigateTo: null, // respond, don't auto-navigate
    }, debugLog)
  }

  // ── Step 15: Low confidence — clarification needed ──────────────────────────
  if (goalResult.clarificationNeeded && goalResult.clarificationQuestion) {
    const formatted = buildChatGptLikeResponse({
      answer: goalResult.clarificationQuestion,
      role,
    })
    logStep(debugLog, 'build_response')
    finalizeLog(debugLog, 'build_response', 'respond')
    emitDebugLog(debugLog)
    return makeResult('respond', {
      response: applyRolePolicy(formatted.display, role),
      spokenResponse: formatted.spoken,
      intent: intentResult.intent,
      entity: entityResult,
      goal: goalResult,
      confidence: goalResult.confidence,
    }, debugLog)
  }

  // ── Step 16: Route to existing COO prompt chain (complex/unknown questions) ───
  // handleDonnaCooPrompt handles: action registry, routeDonnaPrompt, KPI answers,
  // focus-today, dashboard priority, roster intelligence, and many more.
  // God Mode is the final fallback when handleDonnaCooPrompt + detectAndHandleCommand
  // both return false.
  logStep(debugLog, 'route_coo_prompt')
  finalizeLog(debugLog, 'route_coo_prompt', 'route_coo_prompt')
  emitDebugLog(debugLog)
  return makeResult('route_coo_prompt', {
    intent: intentResult.intent,
    entity: entityResult,
    goal: goalResult,
    confidence: goalResult.confidence,
  }, debugLog)
}
