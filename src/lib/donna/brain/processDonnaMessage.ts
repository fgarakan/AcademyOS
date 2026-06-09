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
import { resolveEntityWithContext } from '@/lib/donna/entity/donnaEntityContextResolver'
import type { AcademyEntityContext, ResolvedEntityV2 } from '@/lib/donna/entity/donnaEntityResolver'
import {
  buildDisambiguationQuestion,
  resolveDisambiguationAnswer,
  formatChoicesForDisplay,
} from '@/lib/donna/entity/donnaDisambiguationEngine'
import type { DisambiguationQuestion } from '@/lib/donna/entity/donnaDisambiguationEngine'
import { isRelationshipQuery, resolveRelationshipQuery } from '@/lib/donna/entity/donnaRelationshipGraph'
import { detectEntityIntent } from '@/lib/donna/entity/donnaEntityIntentRouter'
import {
  buildEntityNavigationResponse,
  buildEntityConfirmMessage,
} from '@/lib/donna/entity/donnaEntityNavigation'
import { detectRelationshipIntelligenceIntent } from '@/lib/donna/relationship/donnaRelationshipIntentDetector'
import {
  buildRelationshipContext,
  getCoGroupResult,
  getPlayerContext,
} from '@/lib/donna/relationship/donnaRelationshipIntelligence'
import {
  buildRelationshipIntelligenceAnswer,
  buildCoGroupMembersAnswer,
  buildPlayerContextAnswer,
} from '@/lib/donna/relationship/donnaRelationshipAnswerBuilder'
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
import { retrieveKnowledgeContext, formatKnowledgeForResponse } from './donnaKnowledgeContextAdapter'

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
  /** V2 entity context for inline entity resolution (optional — null = skip V2 path) */
  entityContext?: AcademyEntityContext | null
  /** Pending disambiguation question from previous turn (optional) */
  pendingDisambiguation?: DisambiguationQuestion | null
}

// ── Action contract ───────────────────────────────────────────────────────────

export type DonnaMessageAction =
  | 'respond'                  // Brain has a direct response → show it + optionally speak
  | 'navigate'                 // Navigate to a specific route
  | 'start_workflow'           // Start a guided completion workflow (form-filling)
  | 'start_goal_session'       // Start a goal completion session (task-level guided mode)
  | 'route_guided_answer'      // Active guided workflow → existing handleGuidedCompletionAnswer
  | 'route_goal_session'       // Active goal session → handle goal session command
  | 'route_coo_control'        // COO control command → existing handleCOOControlCommand
  | 'fetch_attention'          // Trigger handleFetchAttention
  | 'fetch_brief'              // Trigger handleFetchDailyBrief
  | 'open_review'              // Trigger handleOpenReviewQueue
  | 'fetch_coo_intelligence'   // COO-specific question → runDonnaCOOIntelligenceAction
  | 'route_coo_prompt'         // Complex COO question → existing handleDonnaCooPrompt chain
  | 'god_mode'                 // Route to LLM God Mode

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
  /** V2 resolved entity (entity intelligence path) */
  resolvedEntityV2: ResolvedEntityV2 | null
  /** Disambiguation question to show director when entity matches multiple candidates */
  disambiguationQuestion: DisambiguationQuestion | null
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

// Mega Sprint 1325–1354 — Academy overview phrase detector
// Catches D3 "How is everything looking?" and related status questions.
// Runs between isAttentionPhrase (step 7) and isCOOIntelligencePhrase (step 7.5).
// Routes to fetch_coo_intelligence — same action as step 7.5 — to return the
// full structured health report rather than a generic intent-classified response.
function isAcademyOverviewPhrase(lower: string): boolean {
  if (lower.includes('how is everything looking')) return true
  if (lower.includes('how are things looking'))    return true
  if (lower.includes('how is the academy'))        return true
  if (lower.includes('how are we doing'))          return true
  if (lower.includes('give me a status'))          return true
  if (lower.includes('give me an overview'))       return true
  if (lower.includes('academy overview'))          return true
  if (lower.includes('academy status'))            return true
  if (lower.includes('overall health'))            return true
  if (lower.includes('status update') && !lower.includes('parent')) return true
  if (lower.includes('how is everything') && lower.length < 40)     return true
  return false
}

// Mega Sprint 784–813 — COO intelligence phrase detector
// Catches specific COO-dimension questions that are NOT already handled by:
//   - detectTodayGuidanceQuestion (today guidance)
//   - matchesDailyBriefIntent (daily brief)
//   - isReviewQueuePhrase (review queue / decisions waiting)
//   - isAttentionPhrase (what needs attention)
//   - isAcademyOverviewPhrase (academy health / status overview)
function isCOOIntelligencePhrase(lower: string): boolean {
  // Program health
  if (lower.includes('over capacity') || lower.includes('under capacity')) return true
  if (lower.includes('group capacity') || lower.includes('group enrollment')) return true
  if (lower.includes('enrollment problem') || lower.includes('enrollment vs') || lower.includes('enrollment or')) return true
  if ((lower.includes('why is') || lower.includes('why are')) && (lower.includes('group') || lower.includes('light') || lower.includes('growing') || lower.includes('shrinking'))) return true
  if (lower.includes('group light') || lower.includes('group growing') || lower.includes('group shrinking')) return true

  // Player intelligence
  if (lower.includes('ready to move') || lower.includes('ready to advance') || lower.includes('who is ready')) return true
  if (lower.includes('who is stalled') || lower.includes('stalled player') || lower.includes('players stalled')) return true
  if (lower.includes('who is accelerating') || lower.includes('accelerating player') || lower.includes('players accelerating')) return true
  if (lower.includes('attendance risk') || lower.includes('who has attendance')) return true
  if (lower.includes('player intelligence') || lower.includes('player risk')) return true

  // Coach intelligence
  if (lower.includes('coach') && lower.includes('support')) return true
  if (lower.includes('coach') && (lower.includes('following up') || lower.includes('follow up'))) return true
  if (lower.includes('coach') && lower.includes('missing')) return true
  if (lower.includes('coach') && lower.includes('driving progression')) return true
  if (lower.includes('coach') && lower.includes('ownership')) return true
  if (lower.includes('coach') && lower.includes('reliable')) return true
  if (lower.includes('coach intelligence')) return true
  if (lower.includes('unclear coach')) return true

  // Parent confidence
  if (lower.includes('parent') && (lower.includes('update') || lower.includes('gap') || lower.includes('at risk') || lower.includes('clarity') || lower.includes('check-in') || lower.includes('check in'))) return true
  if (lower.includes('parent confidence') || lower.includes('family') || lower.includes('families')) return true
  if (lower.includes('communication gap')) return true

  // Director decision (non-overlapping with today guidance / review queue)
  if (lower.includes('biggest risk') || lower.includes('biggest academy risk')) return true
  if (lower.includes('biggest opportunity')) return true
  if (lower.includes('what would you do') || lower.includes('as coo')) return true
  if (lower.includes('coo recommendation') || lower.includes('coo intelligence')) return true

  return false
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
    lower.includes('what needs approval') ||
    lower.includes('decisions are waiting') ||
    lower.includes('pending decisions') ||
    lower.includes('needs a decision') ||
    lower.includes('what decisions')
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
    resolvedEntityV2: partial.resolvedEntityV2 ?? null,
    disambiguationQuestion: partial.disambiguationQuestion ?? null,
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

  // ── Step 0.5: Pending disambiguation resolution ──────────────────────────────
  // When the director was asked "which one did you mean?" in a previous turn,
  // their reply ("the player", "1", "Jake Barrios") should resolve the pending
  // question before any other brain step touches the message.
  logStep(debugLog, 'check_disambiguation')
  const pendingDisambiguation = input.pendingDisambiguation ?? null
  if (pendingDisambiguation !== null) {
    const disambigResolved = resolveDisambiguationAnswer(userMessage, pendingDisambiguation)
    if (disambigResolved !== null && disambigResolved.route) {
      const navResponse = buildEntityNavigationResponse(
        disambigResolved,
        { kind: 'navigate', entityPhrase: userMessage, rawText: userMessage },
      )
      finalizeLog(debugLog, 'check_disambiguation', 'navigate')
      emitDebugLog(debugLog)
      return makeResult('navigate', {
        response:          navResponse.message,
        spokenResponse:    navResponse.spokenMessage,
        navigateTo:        navResponse.navigateTo,
        resolvedEntityV2:  disambigResolved,
        confidence:        0.92,
      }, debugLog)
    }
    if (disambigResolved !== null) {
      // Resolved but no route — respond with entity summary
      const msg = `I found ${disambigResolved.displayName}. Unfortunately I don't have a direct navigation link for this item yet.`
      finalizeLog(debugLog, 'check_disambiguation', 'respond')
      emitDebugLog(debugLog)
      return makeResult('respond', {
        response:         msg,
        spokenResponse:   msg,
        resolvedEntityV2: disambigResolved,
        confidence:       0.85,
      }, debugLog)
    }
    // Director's reply didn't match any choice — re-ask the same question
    const reaskMsg = `I didn't quite catch that. Which one did you mean?\n\n${formatChoicesForDisplay(pendingDisambiguation)}`
    finalizeLog(debugLog, 'check_disambiguation', 'respond')
    emitDebugLog(debugLog)
    return makeResult('respond', {
      response:               reaskMsg,
      spokenResponse:         'Which one did you mean? Please say the number.',
      disambiguationQuestion: pendingDisambiguation,
      confidence:             0.50,
    }, debugLog)
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

  // ── Step 7.1: Academy overview — "How is everything looking?" ───────────────
  // Catches D3 status/health overview questions not handled by attention or brief.
  // Routes to fetch_coo_intelligence to return full structured health data.
  if (isAcademyOverviewPhrase(lower)) {
    finalizeLog(debugLog, 'check_academy_overview', 'fetch_coo_intelligence')
    emitDebugLog(debugLog)
    return makeResult('fetch_coo_intelligence', { confidence: 0.93 }, debugLog)
  }

  // ── Step 7.5: COO intelligence — specific dimension questions ────────────────
  // Catches group capacity, player readiness/stall, coach support, parent gaps,
  // and COO recommendation questions BEFORE the LLM fallback path.
  // Runs after attention/brief/review-queue checks to avoid overlap with those handlers.
  if (isCOOIntelligencePhrase(lower)) {
    finalizeLog(debugLog, 'check_coo_intelligence', 'fetch_coo_intelligence')
    emitDebugLog(debugLog)
    return makeResult('fetch_coo_intelligence', { confidence: 0.92 }, debugLog)
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

  // ── Step 10.4: Relationship intelligence ────────────────────────────────────
  // Handles complex/aggregate/demonstrative/multi-hop relationship queries.
  // "who else is in that group?", "which players share the same bottleneck?",
  // "academy health", "why does Jake need attention?"
  // Runs before entity intelligence so demonstrative references ("that group")
  // can use the last resolved entity from goal memory.
  const entityContext = input.entityContext ?? null
  logStep(debugLog, 'check_relationship_intelligence')
  if (entityContext !== null) {
    const relIntent = detectRelationshipIntelligenceIntent(messageToProcess)
    if (relIntent !== null) {
      const rCtx = buildRelationshipContext(entityContext)
      let message: string
      let spokenMessage: string

      // Special-case: co_group and group_health require the last known entity
      if (relIntent.kind === 'co_group_members' || relIntent.kind === 'group_health') {
        // Resolve subject: named subject in query → or last relevant entity from memory
        const subjectName = relIntent.subjectPhrase ?? goalMemory?.lastRelevantEntity ?? null
        if (subjectName) {
          const lower  = subjectName.toLowerCase()
          const player = rCtx.players.find(p => p.playerName.toLowerCase().includes(lower))
          if (player) {
            const coGroup = getCoGroupResult(player.playerId, rCtx)
            const answer  = buildCoGroupMembersAnswer(coGroup)
            finalizeLog(debugLog, 'check_relationship_intelligence', 'respond')
            emitDebugLog(debugLog)
            return makeResult('respond', {
              response:       answer,
              spokenResponse: answer.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\n+/g, '. '),
              confidence:     0.88,
            }, debugLog)
          }
        }
        // Fall through if subject can't be identified
      } else if (relIntent.kind === 'player_full_context' && !relIntent.subjectPhrase && goalMemory?.lastRelevantEntity) {
        // "full context" without naming a player → use last entity from memory
        const lower  = goalMemory.lastRelevantEntity.toLowerCase()
        const player = rCtx.players.find(p => p.playerName.toLowerCase().includes(lower))
        if (player) {
          const ctx    = getPlayerContext(player.playerId, rCtx)
          message       = ctx ? buildPlayerContextAnswer(ctx) : `I found ${player.playerName} but couldn't build their full context.`
          spokenMessage = message.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\n+/g, '. ')
          finalizeLog(debugLog, 'check_relationship_intelligence', 'respond')
          emitDebugLog(debugLog)
          return makeResult('respond', {
            response:       message,
            spokenResponse: spokenMessage,
            confidence:     0.88,
          }, debugLog)
        }
      } else {
        const built = buildRelationshipIntelligenceAnswer(relIntent.kind, relIntent.subjectPhrase, rCtx)
        message       = built.message
        spokenMessage = built.spokenMessage
        if (message) {
          finalizeLog(debugLog, 'check_relationship_intelligence', 'respond')
          emitDebugLog(debugLog)
          return makeResult('respond', {
            response:       message,
            spokenResponse: spokenMessage,
            confidence:     0.85,
          }, debugLog)
        }
      }
    }
  }

  // ── Step 10.5: Entity intelligence (V2) ─────────────────────────────────────
  // Intercepts entity navigation intents ("show me Jake", "open OB2", etc.)
  // using the V2 resolver + page-aware boosting. Falls through silently when
  // entityContext is not loaded or no entity intent is detected.
  logStep(debugLog, 'check_entity_intent')
  if (entityContext !== null) {
    // Check relationship query first (pronouns + "Jake's parent", "who coaches X")
    const isRelQuery = isRelationshipQuery(messageToProcess)
    const entityIntent = isRelQuery ? null : detectEntityIntent(messageToProcess)

    if (isRelQuery || entityIntent !== null) {
      // Build a minimal last-entity ref from goal memory for pronoun resolution
      const lastEntityForRel: ResolvedEntityV2 | undefined =
        goalMemory?.lastRelevantEntity
          ? {
              kind:            'player',
              id:              null,
              displayName:     goalMemory.lastRelevantEntity,
              route:           null,
              confidence:      0.70,
              confidenceLevel: 'high',
              reasoning:       'Restored from goal memory',
            }
          : undefined

      if (isRelQuery) {
        // ── Relationship query path ──────────────────────────────────────────
        const relResult = resolveRelationshipQuery(messageToProcess, entityContext, lastEntityForRel)
        if (relResult !== null) {
          if (relResult.confidence >= CONFIDENCE_ACT_THRESHOLD && relResult.resolved !== null) {
            if (relResult.resolved.route) {
              finalizeLog(debugLog, 'check_entity_intent', 'navigate')
              emitDebugLog(debugLog)
              return makeResult('navigate', {
                response:         relResult.message,
                spokenResponse:   relResult.message,
                navigateTo:       relResult.resolved.route,
                resolvedEntityV2: relResult.resolved,
                confidence:       relResult.confidence,
              }, debugLog)
            }
            finalizeLog(debugLog, 'check_entity_intent', 'respond')
            emitDebugLog(debugLog)
            return makeResult('respond', {
              response:         relResult.message,
              spokenResponse:   relResult.message,
              resolvedEntityV2: relResult.resolved,
              confidence:       relResult.confidence,
            }, debugLog)
          }
          if (relResult.message) {
            finalizeLog(debugLog, 'check_entity_intent', 'respond')
            emitDebugLog(debugLog)
            return makeResult('respond', {
              response:       relResult.message,
              spokenResponse: relResult.message,
              confidence:     relResult.confidence,
            }, debugLog)
          }
        }
      } else if (entityIntent !== null) {
        // ── Entity navigation / query path ──────────────────────────────────
        const resolveResult = resolveEntityWithContext(
          entityIntent.entityPhrase,
          entityContext,
          route,
          {},
        )

        if (resolveResult.needsDisambiguation && resolveResult.candidates.length > 0) {
          const disambigQ = buildDisambiguationQuestion(resolveResult.candidates, entityIntent.entityPhrase)
          finalizeLog(debugLog, 'check_entity_intent', 'respond')
          emitDebugLog(debugLog)
          return makeResult('respond', {
            response:               disambigQ.questionText,
            spokenResponse:         'I found a few matches. Which one did you mean?',
            disambiguationQuestion: disambigQ,
            confidence:             0.50,
          }, debugLog)
        }

        if (resolveResult.entity !== null) {
          const entity = resolveResult.entity

          if (entity.confidence >= CONFIDENCE_ACT_THRESHOLD) {
            const navResponse = buildEntityNavigationResponse(entity, entityIntent)
            if (navResponse.shouldNavigate) {
              finalizeLog(debugLog, 'check_entity_intent', 'navigate')
              emitDebugLog(debugLog)
              return makeResult('navigate', {
                response:         navResponse.message,
                spokenResponse:   navResponse.spokenMessage,
                navigateTo:       navResponse.navigateTo,
                resolvedEntityV2: entity,
                confidence:       entity.confidence,
              }, debugLog)
            }
            finalizeLog(debugLog, 'check_entity_intent', 'respond')
            emitDebugLog(debugLog)
            return makeResult('respond', {
              response:         navResponse.message,
              spokenResponse:   navResponse.spokenMessage,
              resolvedEntityV2: entity,
              confidence:       entity.confidence,
            }, debugLog)
          }

          if (entity.confidence >= 0.50) {
            // Medium confidence — offer to navigate, ask for confirmation
            const confirmMsg = buildEntityConfirmMessage(entity)
            finalizeLog(debugLog, 'check_entity_intent', 'respond')
            emitDebugLog(debugLog)
            return makeResult('respond', {
              response:         confirmMsg,
              spokenResponse:   confirmMsg,
              resolvedEntityV2: entity,
              confidence:       entity.confidence,
            }, debugLog)
          }
          // Below 0.50 — fall through to existing routing
        }
        // noEntityFound — fall through to existing routing
      }
    }
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

  // ── Step 12.5: Brain knowledge context ──────────────────────────────────────
  // Queries the certified DONNA Global Brain (21 initial entries via donnaBrainRuntime).
  // Only fires when the brain has a high-confidence match for the message.
  // Vocabulary definitions, decision rule thresholds, and philosophy principles
  // are answered here — before falling through to goal/intent routing.
  // Does NOT block context pack answers (Step 12 runs first).
  logStep(debugLog, 'check_brain_context')
  const brainCtx = retrieveKnowledgeContext({
    query:        messageToProcess,
    role,
    currentRoute: route,
  })
  const brainFormatted = formatKnowledgeForResponse(brainCtx)
  if (brainFormatted) {
    const followUp = buildFollowUpForGoal(goalResult, null)
    const formatted = buildChatGptLikeResponse({
      answer: brainFormatted,
      followUpQuestion: followUp,
      role,
    })
    finalizeLog(debugLog, 'check_brain_context', 'respond')
    emitDebugLog(debugLog)
    return makeResult('respond', {
      response:          applyRolePolicy(formatted.display, role),
      spokenResponse:    formatted.spoken,
      intent:            intentResult.intent,
      entity:            entityResult,
      goal:              goalResult,
      confidence:        0.80,
      followUpQuestion:  followUp,
    }, debugLog)
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
