'use server'

// Sprint 1010 — DONNA Live Orchestrator Server Action V1
// Server action bridge between the DONNA panel UI and the Sprint 978/999+ LLM orchestrator.
//
// Safety invariants:
//   - academyId and role always come from server-side auth — never trusted from client input
//   - Director and Head Coach access only — other roles return an error
//   - userInput validated: non-empty, max 800 chars
//   - pathname validated: must start with / (internal route)
//   - playerId / sessionId: accepted from client only for route-context, never used to bypass RLS
//   - safetyAudit is internal — never returned to client
//   - contextSummary is internal — never returned to client
//   - Usage event written to DB after response (fire-and-forget, never blocks response)
//   - Any error returns a safe message — never exposes raw DB errors or stack traces

import { getSupabaseServer } from '@/lib/supabase/server'
import { orchestrate } from '@/lib/donna/llmOrchestration/orchestrator'
import type { OrchestratorOutput, ConversationTurn } from '@/lib/donna/llmOrchestration/types'
import { writeUsageEventToDb } from '@/lib/usage/usageTracker'
// Sprint 1075 — Academy profile context wiring
import {
  buildAcademyProfileFromLiveData,
  buildEmptyAcademyProfile,
  getAcademyProfileSummaryText,
} from '@/lib/donna/donnaAcademyProfileContext'
// Sprint 1082 — Academy context TTL cache (avoids repeated DB query per orchestrator call)
import { cachedFetch, CACHE_KEYS, CACHE_TTL_MS } from '@/lib/donna/donnaContextCache'
// Sprint 2261–2290 — DONNA Memory Activation
import type {
  PriorSessionContext,
  DecisionMemoryContext,
  EntityMemoryContext,
  AcademyMemoryContext,
} from '@/lib/donna/memory/donnaMemoryContextTypes'
// Sprint 2291–2320 — DONNA Workflow Guidance
import type { FormattedMission } from '@/lib/donna/workflow/donnaMissionFormatter'
// Mega Sprint 2411–2440 — Entity Intelligence V1: server-side entity detection
import { detectEntityIntent } from '@/lib/donna/entity/donnaEntityIntentRouter'
import { loadEntityContextFromPhrase } from '@/lib/donna/memory/donnaEntityIntelligence'
// Mega Sprint 2471–2500 — DONNA Conversational OS V1
import type { ConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'
import { updateConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'
import { resolveReferences } from '@/lib/donna/conversation/donnaReferenceResolver'
import { buildProactiveCOOSignal, buildProactiveCOOSection, shouldTriggerProactiveCOO } from '@/lib/donna/conversation/donnaProactiveCOODialogue'
// Mega Sprint 2561–2590 — Academy Intelligence Engine V1
import { detectBroadAcademyQuery } from '@/lib/donna/academy/academyIntelligenceEngine'
import type { AcademyIntelligencePacket } from '@/lib/donna/academy/academyIntelligenceEngine'
import { loadAcademyIntelligencePacket } from '@/lib/donna/academy/academyIntelligenceLoader'
import { answerAcademyDirectorQuestion } from '@/lib/donna/academy/academyDirectorQuestionsEngine'
// Mega Sprint 2621–2650 — DONNA Operating Layer V1
import { detectOperatingQuestion, answerOperatingQuestion } from '@/lib/donna/operating/directorOperatingQuestions'
import { buildOperatingLayerFromPacket } from '@/lib/donna/operating/donnaOperatingLayer'
// Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
import type { NextBestAction, ExecutionStateSnapshot } from '@/lib/donna/guided/nextBestAction'
import { detectExecutionIntent } from '@/lib/donna/guided/executionIntentDetector'
import type { ExecutionIntentType } from '@/lib/donna/guided/executionIntentDetector'
import { buildNextBestAction } from '@/lib/donna/guided/donnaNextBestActionEngine'
import {
  handleNextBestAction,
  handleTaskCompleted,
  handleExecutionHelp,
  handleExecutionHelpFallback,
  handleNavigateIntent,
  handleAllActionsComplete,
  getNextBestActionThinkingText,
} from '@/lib/donna/guided/donnaGuidedExecutionEngine'

// ── Input type ────────────────────────────────────────────────────────────────

/**
 * Input accepted from the client panel.
 * academyId and role are NOT accepted from client — they are resolved from auth.
 */
export interface DonnaOrchestratorInput {
  /** Director's typed or spoken message. Max 800 chars. */
  userInput: string
  /** Current page pathname (e.g. '/director', '/director/review'). Must start with /. */
  pathname: string
  /** Human-readable label for the current page (optional). */
  pageLabel?: string
  /** Director's first name for personalization (optional). */
  firstName?: string | null
  /** Number of pending review items (from panel state). */
  pendingReviews?: number
  /** Recent conversation turns — capped at 10 by the context packet builder. */
  conversationHistory?: ConversationTurn[]
  /**
   * Player ID from route context — only relevant when director is on a player page.
   * Accepted from client but only used to scope a safe DB read (not to bypass RLS).
   */
  playerId?: string | null
  /**
   * Session ID from route context — only relevant when director is on a session page.
   * Accepted from client but only used to scope a safe DB read (not to bypass RLS).
   */
  sessionId?: string | null
  /** Whether to use the LLM path. Defaults to true. */
  useLlm?: boolean
  // Sprint 2261–2290 — DONNA Memory Activation: four-tier memory context (loaded client-side at panel open)
  priorSessionContext?: PriorSessionContext | null
  decisionMemoryContext?: DecisionMemoryContext | null
  entityMemoryContext?: EntityMemoryContext | null
  academyMemoryContext?: AcademyMemoryContext | null
  /** True when this is the first DONNA panel open of the calendar day */
  isFirstSessionOfDay?: boolean
  // Sprint 2291–2320 — DONNA Workflow Guidance
  activeWorkflowGuidance?: FormattedMission | null
  // Mega Sprint 2471–2500 — DONNA Conversational OS V1
  /** Thread-level operating context: current entity, recommendation, topic, goal */
  conversationOperatingContext?: ConversationOperatingContext | null
  // Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
  /** Snapshot of client-side execution state — used to answer help and navigate intents. */
  executionState?: ExecutionStateSnapshot | null
  /** Signal IDs completed this session — excluded from next best action selection. */
  completedActionIds?: string[]
}

// ── Result type ───────────────────────────────────────────────────────────────

/**
 * Safe result returned to the client.
 * safetyAudit and contextSummary are NOT returned — they are internal.
 */
export interface DonnaOrchestratorResult {
  ok: boolean
  /** The primary orchestrator output. Present when ok: true. */
  output?: OrchestratorOutput
  /** Whether a blocked action was attempted during this turn. */
  hadBlockedAttempt: boolean
  /** Safe error message. Present when ok: false. */
  error?: string
  // Mega Sprint 2471–2500 — DONNA Conversational OS V1
  /** Updated conversation thread context — client stores and sends back next turn. */
  updatedConversationContext?: ConversationOperatingContext
  // Mega Sprint 2561–2590 — Academy Intelligence Engine V1
  /** Top entity from academy attention queue — seeds conversation thread after broad queries. */
  suggestedEntitySeed?: {
    entityLabel: string
    entityRoute: string
    entityType: 'player' | 'coach' | 'parent'
  }
  // Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
  /** Structured next best action — used to display execution mode card on client. */
  nextBestAction?: NextBestAction
  /** Which execution intent was detected — used for client-side navigation on 'navigate_to_action'. */
  executionIntent?: ExecutionIntentType
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getAuthorizedContext() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false as const, error: 'Director or Head Coach access required.' }
  }

  // Sprint 1075 — fetch safe academy identity fields for profile context.
  // Scoped to the authenticated user's academyId — never trusted from client input.
  // Sprint 1082 — wraps the DB query with a 5-min TTL cache (CACHE_KEYS.ACADEMY_PROFILE).
  // Avoids a repeated academies table hit on every God Mode orchestrator call.
  // Cache is per-academyId, invalidated on server restart (module-level Map).
  const academyId = profile.academy_id as string
  let academyProfileSummary = ''
  try {
    type AcademyRow = { name: string; slug: string; timezone: string; country: string | null; settings: Record<string, unknown> | null }
    const academy = await cachedFetch<AcademyRow>(
      academyId,
      CACHE_KEYS.ACADEMY_PROFILE,
      CACHE_TTL_MS.ACADEMY_PROFILE,
      async () => {
        const { data } = await supabase
          .from('academies')
          .select('name, slug, timezone, country, settings')
          .eq('id', academyId)
          .single()
        if (!data) return null
        return {
          name: (data as AcademyRow).name,
          slug: (data as AcademyRow).slug,
          timezone: (data as AcademyRow).timezone,
          country: (data as AcademyRow).country ?? null,
          settings: (data as AcademyRow).settings ?? null,
        }
      },
    )

    const academyProfile = academy
      ? buildAcademyProfileFromLiveData({
          academyId,
          academyName: academy.name ?? null,
          academySlug: academy.slug ?? null,
          timezone: academy.timezone ?? null,
          country: academy.country ?? null,
          rawAcademySettings: academy.settings ?? null,
        })
      : buildEmptyAcademyProfile(academyId)

    academyProfileSummary = getAcademyProfileSummaryText(academyProfile)
  } catch {
    // Non-fatal — proceed without academy profile context
    academyProfileSummary = buildEmptyAcademyProfile(academyId).missingDataFallback
  }

  return {
    ok: true as const,
    supabase,
    userId: user.id,
    academyId,
    role: role as 'academy_director' | 'head_coach',
    academyProfileSummary,
  }
}

// ── Input validation ──────────────────────────────────────────────────────────

function validateInput(input: DonnaOrchestratorInput): string | null {
  if (!input.userInput || typeof input.userInput !== 'string') {
    return 'User input is required.'
  }
  if (input.userInput.trim().length === 0) {
    return 'User input cannot be empty.'
  }
  if (input.userInput.length > 800) {
    return 'User input exceeds maximum length.'
  }
  if (!input.pathname || typeof input.pathname !== 'string' || !input.pathname.startsWith('/')) {
    return 'Invalid pathname.'
  }
  return null
}

// ── Server action ─────────────────────────────────────────────────────────────

/**
 * Run a DONNA orchestration turn from the director panel.
 * Resolves auth server-side, validates input, calls orchestrate(), writes usage to DB.
 * Returns a safe result — never exposes safetyAudit, contextSummary, or raw errors.
 */
export async function runDonnaOrchestratorAction(
  input: DonnaOrchestratorInput,
): Promise<DonnaOrchestratorResult> {
  // 1. Validate input
  const validationError = validateInput(input)
  if (validationError) {
    return { ok: false, hadBlockedAttempt: false, error: validationError }
  }

  // 2. Auth — academyId and role always from server-side auth
  const auth = await getAuthorizedContext()
  if (!auth.ok) {
    return { ok: false, hadBlockedAttempt: false, error: auth.error }
  }

  const { supabase, academyId, role, academyProfileSummary } = auth

  // 3a. Mega Sprint 2411–2440 — Entity Intelligence V1
  // If client didn't provide entity context (no route-level player/session), attempt server-side
  // entity detection from userInput. Cheap regex check first; DB queries only when entity matched.
  let resolvedEntityMemoryContext = input.entityMemoryContext ?? null
  if (!resolvedEntityMemoryContext && !input.playerId) {
    try {
      const entityIntent = detectEntityIntent(input.userInput)
      if (entityIntent?.entityPhrase) {
        resolvedEntityMemoryContext = await loadEntityContextFromPhrase(
          supabase,
          academyId,
          entityIntent.entityPhrase,
        )
      }
    } catch {
      // Non-fatal — proceed without entity context
    }
  }

  // 3b. Mega Sprint 2471–2500 — DONNA Conversational OS V1
  // Step 1: Resolve anaphoric references in userInput before building context packet.
  //   "What level is he?" → "What level is Alex Rivera?" (using thread entity context)
  // Step 2: Compute proactive COO signal when entity is in context.
  // Step 3: Update conversation thread context for round-trip to client.

  const existingConvCtx = input.conversationOperatingContext ?? null

  // Resolve references: pronoun substitution before LLM sees the input
  const { resolvedText: resolvedUserInput } = resolveReferences(input.userInput, existingConvCtx)

  // Compute proactive COO section (non-fatal)
  let proactiveCOOSection: string | undefined
  try {
    if (shouldTriggerProactiveCOO(input.userInput, existingConvCtx)) {
      const signal = buildProactiveCOOSignal(resolvedEntityMemoryContext, existingConvCtx)
      const section = buildProactiveCOOSection(signal, resolvedEntityMemoryContext?.entityLabel ?? existingConvCtx?.currentEntityLabel ?? null)
      if (section) proactiveCOOSection = section
    }
  } catch {
    // Non-fatal
  }

  // Update conversation thread context (will be returned to client after turn)
  const updatedConversationContext = updateConversationOperatingContext(existingConvCtx, {
    userInput:           resolvedUserInput,
    entityMemoryContext: resolvedEntityMemoryContext,
  })

  // 3c. Mega Sprint 2561–2590 — Academy Intelligence Engine V1
  // 3d. Mega Sprint 2621–2650 — Operating Layer V1: operating question fast path
  // 3e. Mega Sprint 2681–2740 — Guided Execution OS V1+V2: execution intent fast path
  // When the director asks a broad academy question (no entity in context), load
  // the live AcademyIntelligencePacket and attempt a deterministic answer.
  // If deterministic answer found → return immediately (no LLM call).
  // Otherwise → inject packet into orchestrate call for LLM enrichment.
  let academyIntelligencePacket: AcademyIntelligencePacket | null = null
  let suggestedEntitySeed: DonnaOrchestratorResult['suggestedEntitySeed'] | undefined

  // 3e: Execution intents — checked FIRST (before operating questions and broad queries).
  // Catches: done/finished/handled, help/stuck, take me there/open it, continue/next/what else.
  const executionIntentType = detectExecutionIntent(input.userInput)
  if (executionIntentType) {
    try {
      academyIntelligencePacket = await loadAcademyIntelligencePacket(supabase, academyId)
    } catch {
      // Non-fatal — proceed with reduced context
    }

    const completedActionIds = input.completedActionIds ?? []
    const executionState     = input.executionState ?? null

    let nextBestAction: NextBestAction | null = null
    if (academyIntelligencePacket) {
      const { signals, health, guidance } = buildOperatingLayerFromPacket(academyIntelligencePacket)
      nextBestAction = buildNextBestAction(guidance, signals, health, completedActionIds)

      let guidedResponse

      if (executionIntentType === 'task_completed') {
        // "Done.", "Finished.", "Handled.", etc.
        // Mark current action complete, re-rank, return next action.
        const completedTitle    = executionState?.activeActionTitle ?? null
        const completionCriteria = executionState?.completionCriteria ?? null

        // Exclude the just-completed action when selecting next
        const nextCompletedIds = executionState?.activeActionId
          ? [...completedActionIds, executionState.activeActionId]
          : completedActionIds
        const nextAction = buildNextBestAction(guidance, signals, health, nextCompletedIds)

        guidedResponse = handleTaskCompleted(completedTitle, completionCriteria, nextAction)
        nextBestAction = nextAction

      } else if (executionIntentType === 'execution_help') {
        // "Help.", "I'm stuck.", "Walk me through it."
        if (nextBestAction) {
          guidedResponse = handleExecutionHelp(nextBestAction, null)
        } else {
          guidedResponse = handleExecutionHelpFallback()
        }

      } else if (executionIntentType === 'navigate_to_action') {
        // "Take me there.", "Open it.", "Go there."
        guidedResponse = handleNavigateIntent(nextBestAction, {
          activeActionId:    executionState?.activeActionId ?? null,
          activeActionTitle: executionState?.activeActionTitle ?? null,
          activeEntityId:    null,
          activeEntityType:  null,
          activeRoute:       executionState?.activeRoute ?? null,
          startedAt:         null,
          completionCriteria: executionState?.completionCriteria ?? null,
          executionStatus:   'active',
          lastInstruction:   executionState?.activeActionTitle ?? null,
          helpCount:         0,
          domain:            executionState?.domain ?? null,
        })

      } else {
        // 'next_best_action' — "What next?", "Continue.", "What else?", etc.
        const isContinuation = /^(continue|keep\s+going|what\s+else|anything\s+else|next)[.!?]?$/i.test(input.userInput.trim())
        guidedResponse = nextBestAction
          ? handleNextBestAction(nextBestAction, isContinuation)
          : { text: 'No further high-priority actions at this time. Ask "How is the academy?" for a health check.', navigationHint: null, thinkingText: null }
      }

      void writeUsageEventToDb(supabase, {
        eventType: 'donna_intelligence_call', academyId, userId: auth.userId,
        blocked: false,
        requestId: `execution_intent:${executionIntentType}`,
        inputTokens: 0, outputTokens: 0, latencyMs: 0,
      })

      return {
        ok: true,
        output: {
          type:                 'answer',
          text:                 guidedResponse.text,
          safetyLevel:          'safe',
          requiresConfirmation: false,
          confidence:           'high',
          source:               'deterministic',
          ...(guidedResponse.navigationHint ? { suggestedRoute: guidedResponse.navigationHint } : {}),
        },
        hadBlockedAttempt:     false,
        updatedConversationContext,
        ...(nextBestAction ? { nextBestAction } : {}),
        executionIntent: executionIntentType,
      }
    } else {
      // Packet unavailable — fall through to help or generic response
      if (executionIntentType === 'execution_help') {
        const resp = handleExecutionHelpFallback()
        void writeUsageEventToDb(supabase, {
          eventType: 'donna_intelligence_call', academyId, userId: auth.userId,
          blocked: false, requestId: 'execution_intent:help_fallback',
          inputTokens: 0, outputTokens: 0, latencyMs: 0,
        })
        return {
          ok: true,
          output: {
            type: 'answer', text: resp.text, safetyLevel: 'safe',
            requiresConfirmation: false, confidence: 'medium', source: 'deterministic',
          },
          hadBlockedAttempt: false,
          updatedConversationContext,
          executionIntent: executionIntentType,
        }
      }
      // For other execution intents without a packet, fall through to LLM
    }
  }

  // 3d: Check operating questions first (more specific, fewer LLM fallbacks)
  const operatingQuestionType = detectOperatingQuestion(input.userInput)
  if (operatingQuestionType && !resolvedEntityMemoryContext) {
    try {
      academyIntelligencePacket = academyIntelligencePacket ?? await loadAcademyIntelligencePacket(supabase, academyId)
    } catch {
      // Non-fatal
    }
    if (academyIntelligencePacket) {
      const { signals, health, guidance } = buildOperatingLayerFromPacket(academyIntelligencePacket)
      const operatingAnswer = answerOperatingQuestion(operatingQuestionType, guidance, signals, health)
      void writeUsageEventToDb(supabase, {
        eventType: 'donna_intelligence_call', academyId, userId: auth.userId,
        blocked: false,
        requestId: `operating_question:${operatingQuestionType}`,
        inputTokens: 0, outputTokens: 0, latencyMs: 0,
      })
      return {
        ok: true,
        output: {
          type: 'answer',
          text: operatingAnswer.responseText,
          safetyLevel: 'safe',
          requiresConfirmation: false,
          confidence: operatingAnswer.confidence,
          source: 'deterministic',
          ...(operatingAnswer.navigationHint ? { suggestedRoute: operatingAnswer.navigationHint } : {}),
        },
        hadBlockedAttempt: false,
        updatedConversationContext,
      }
    }
  }

  const broadQuestionType = detectBroadAcademyQuery(input.userInput)
  if (broadQuestionType && !resolvedEntityMemoryContext) {
    try {
      academyIntelligencePacket = await loadAcademyIntelligencePacket(supabase, academyId)
    } catch {
      // Non-fatal — proceed without academy intelligence
    }

    if (academyIntelligencePacket) {
      // Build suggested entity seed from top attention item
      const topItem = academyIntelligencePacket.attentionQueue[0]
      if (topItem) {
        suggestedEntitySeed = {
          entityLabel: topItem.playerName,
          entityRoute: topItem.playerRoute,
          entityType:  'player',
        }
      }

      // Try deterministic answer — if high confidence, skip LLM entirely
      const deterministicAnswer = answerAcademyDirectorQuestion(broadQuestionType, academyIntelligencePacket)
      if (deterministicAnswer.confidence === 'high') {
        void writeUsageEventToDb(supabase, {
          eventType:    'donna_intelligence_call',
          academyId,
          userId:       auth.userId,
          blocked:      false,
          requestId:    `academy_director_question:${broadQuestionType}`,
          inputTokens:  0,
          outputTokens: 0,
          latencyMs:    0,
        })
        return {
          ok:                       true,
          output:                   {
            type:                   'answer',
            text:                   deterministicAnswer.responseText,
            safetyLevel:            'safe',
            requiresConfirmation:   false,
            confidence:             'high',
            source:                 'deterministic',
            ...(deterministicAnswer.navigationHint ? { suggestedRoute: deterministicAnswer.navigationHint } : {}),
          },
          hadBlockedAttempt:        false,
          updatedConversationContext,
          suggestedEntitySeed,
        }
      }
    }
  }

  // 3. Run orchestrator
  let response
  try {
    response = await orchestrate({
      role,
      pathname: input.pathname,
      userInput: resolvedUserInput.trim(),
      academyId,
      pageLabel: input.pageLabel,
      firstName: input.firstName,
      pendingReviews: input.pendingReviews ?? 0,
      conversationHistory: input.conversationHistory,
      // Sprint 1075 — academy profile summary injected server-side, never from client
      academyProfileSummary: academyProfileSummary || undefined,
      // playerId and sessionId: route context only — scoped DB reads, not LLM-trusted
      ...(input.playerId ? { playerId: input.playerId } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      useLlm: input.useLlm ?? true,
      // Sprint 2261–2290 — Memory tiers loaded client-side at panel open, passed through here
      // Mega Sprint 2411–2440 — entityMemoryContext may be server-resolved (see step 3a above)
      ...(input.priorSessionContext != null ? { priorSessionContext: input.priorSessionContext } : {}),
      ...(input.decisionMemoryContext != null ? { decisionMemoryContext: input.decisionMemoryContext } : {}),
      ...(resolvedEntityMemoryContext != null ? { entityMemoryContext: resolvedEntityMemoryContext } : {}),
      ...(input.academyMemoryContext != null ? { academyMemoryContext: input.academyMemoryContext } : {}),
      isFirstSessionOfDay: input.isFirstSessionOfDay ?? false,
      // Sprint 2291–2320 — Active workflow guidance for LLM context injection
      ...(input.activeWorkflowGuidance != null ? { activeWorkflowGuidance: input.activeWorkflowGuidance } : {}),
      // Mega Sprint 2471–2500 — Conversational OS V1
      ...(updatedConversationContext ? { conversationOperatingContext: updatedConversationContext } : {}),
      ...(proactiveCOOSection ? { proactiveCOOSection } : {}),
      // Mega Sprint 2561–2590 — Academy Intelligence Engine V1
      ...(academyIntelligencePacket ? { academyIntelligencePacket } : {}),
    })
  } catch (err) {
    return {
      ok: false,
      hadBlockedAttempt: false,
      error: 'DONNA is temporarily unavailable. Please try again.',
    }
  }

  // 4. Write usage event to DB (fire-and-forget — never blocks response)
  // Sprint 1080 — token/cost observability: pass token counts + latency when available.
  void writeUsageEventToDb(supabase, {
    eventType: 'donna_intelligence_call',
    academyId,
    userId: auth.userId,
    blocked: response.hadBlockedAttempt,
    requestId: `${response.primaryOutput.type}:${response.primaryOutput.source}`,
    provider: 'anthropic',
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    latencyMs: response.latencyMs,
  })

  // 5. Return safe result — safetyAudit and contextSummary are NOT returned
  // Mega Sprint 2471–2500 — return updated conversation context for client round-trip
  // Mega Sprint 2561–2590 — return suggestedEntitySeed for broad query thread seeding
  return {
    ok: true,
    output: response.primaryOutput,
    hadBlockedAttempt: response.hadBlockedAttempt,
    updatedConversationContext,
    ...(suggestedEntitySeed ? { suggestedEntitySeed } : {}),
  }
}
