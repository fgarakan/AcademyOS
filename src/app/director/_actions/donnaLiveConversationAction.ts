'use server'

// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 8 — Live Conversation Server Action
//
// Server action bridge between DonnaAssistantButton and the async live AI brain.
// Runs server-side so OPENAI_API_KEY is securely available.
//
// Safety contract:
//   - Director and head_coach only — other roles receive an error result
//   - academyId is always from server-side auth — never trusted from client input
//   - userMessage validated: non-empty, max 500 chars
//   - Academy DNA context is fetched server-side (name + DNA model label only — no sensitive data)
//   - All errors return a safe DonnaMessageResult with action: 'respond'
//   - Stack traces never exposed to client

import { getSupabaseServer } from '@/lib/supabase/server'
import { processLiveAIConversation } from '@/lib/donna/brain/donnaLiveAIConversationBrain'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'
import { applyExecutiveRefinement } from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import { enforceCompletionContract } from '@/lib/donna/completion/donnaCompletionConvergence'
import { enforceExecutivePresence } from '@/lib/donna/conversation/donnaExecutivePresenceContract'
import { loadDirectorDonnaContext, type DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
// Mega Sprint 3691–3720 — Executive Operating Layer live wiring (flag-gated, fail-open)
import { resolveExecutiveMode } from '@/lib/donna/executive/executiveShadowMode'
import { runExecutiveLive } from '@/lib/donna/executive/executiveLiveBridge'
// Mega Sprint 4231–4260 — Durable learning retrieved into the packet + captured back.
import { loadDurableLearning, saveDurableLearning } from '@/lib/donna/executive/donnaExecutiveLearningStore'
import {
  retrieveRelevantLearning,
  learningToMemoryRecords,
  learnFromOperatingSession,
} from '@/lib/donna/executive/donnaExecutiveLearning'
// Mega Sprint 4261–4290 — proactive Executive Intelligence (answers "what should I do?").
import {
  buildExecutiveBriefing,
  isProactiveExecutiveQuestion,
  recommendationsToDecisions,
  formatExecutiveIntelligenceDiagnostics,
} from '@/lib/donna/executive/donnaExecutiveIntelligence'
// Mega Sprint 3901–3930 — DONNA Reasoning Constitution: classify + developer logging.
import { classifyRequest } from '@/lib/donna/constitution/donnaRoutingConstitution'
import { logReasoningTrace } from '@/lib/donna/constitution/donnaRoutingLog'
// Mega Sprint 3991–4020 — Unified Executive Context Engine developer trace.
import { buildPageContextDevTrace } from '@/lib/donna/executive/pageContextPacketSource'

const ALLOWED_ROLES = ['academy_director', 'head_coach'] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

// ── Safe error result ─────────────────────────────────────────────────────────

function errorResult(message: string, inputMessage = ''): DonnaMessageResult {
  return {
    action: 'respond',
    response: message,
    spokenResponse: message,
    intent: null,
    entity: null,
    goal: null,
    confidence: 0,
    nextAction: null,
    followUpQuestion: null,
    shouldSpeak: false,
    navigateTo: null,
    startWorkflowId: null,
    cooControl: null,
    goalSessionCommand: null,
    startGoalType: null,
    requiresApproval: false,
    limitations: 'Live AI conversation error',
    resolvedEntityV2: null,
    unifiedAnswer: null,
    disambiguationQuestion: null,
    updatedNavigatorState: null,
    strategicContext: null,
    pageIntelligence: null,
    realitySnapshot: null,
    debugLog: createDebugLog(inputMessage, 'director', '/director'),
  }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function donnaLiveConversationAction(
  input: DonnaMessageInput,
): Promise<DonnaMessageResult> {
  try {
    // Auth
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResult('Authentication required.')

    // Role check
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role, academy_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .single()

    if (!membership || !ALLOWED_ROLES.includes(membership.role as AllowedRole)) {
      return errorResult('Live AI conversation is only available to directors and head coaches.')
    }

    // Input validation
    const msg = input.userMessage?.trim() ?? ''
    if (!msg) return errorResult('Empty message received.')
    if (msg.length > 500) return errorResult('Message too long for AI assist. Please rephrase.')

    const academyId: string = membership.academy_id

    // Fetch non-sensitive academy DNA context (name + DNA model label only)
    // Never sends player data, session notes, or assessment scores to OpenAI.
    const rawDb = supabase as any
    const { data: academy } = await rawDb
      .from('academies')
      .select('name, settings')
      .eq('id', academyId)
      .single()

    const dnaModelId: string | null = (academy?.settings as Record<string, unknown>)?.academy_dna_model_id as string ?? null
    const academyDNAContext: string | null = academy?.name
      ? `${academy.name as string}${dnaModelId ? ` — DNA: ${dnaModelId}` : ''}`
      : null

    // Run live AI brain (RealitySnapshot → router → brain → canonical gateway)
    const result = await processLiveAIConversation(
      { ...input, userMessage: msg },
      academyId,
      academyDNAContext,
    )

    // ONE DONNA Completion Contract (Mega Sprint 3391–3420) — the canonical
    // behavioral interface. Every response must satisfy the contract (one goal,
    // one state, one next action; never dangling) BEFORE the Executive layer.
    // Fact-preserving + fail-safe: never alters facts, recommendations, approval,
    // or the action; only guarantees the conversation is never left hanging.
    const grounded = enforceCompletionContract(result, { route: input.route, lastUserAction: msg })

    // ONE DONNA Executive Presence (Mega Sprint 3481–3510) — by default, surface
    // the COO intelligence that already exists (opinion · tradeoff · memory ·
    // proactive) on every relevant turn, BEFORE the Executive layer. Convergence
    // only: it consumes the existing operating-partner reality bundle, never
    // reasons new facts, and is additive/relevance-gated/fail-safe.
    let directorCtx: DirectorDonnaContext | null = null
    try {
      directorCtx = await loadDirectorDonnaContext(supabase, academyId)
    } catch {
      directorCtx = null // fail-safe — presence simply no-ops without context
    }
    const present = enforceExecutivePresence(grounded, {
      directorCtx,
      navigatorState: input.conversationNavigatorState ?? null,
      conversationHistory: input.conversationHistory ?? null,
      userMessage: msg,
    })

    // Final presentation layer (Part 3) — executive-tone refinement only.
    // Fail-open: returns the result unchanged if refinement is unavailable.
    // Never alters facts, recommendations, or permissions.
    const role = membership.role === 'head_coach' ? 'coach' : 'director'
    const legacyResult = await applyExecutiveRefinement(present, role)

    // ── Executive Operating Layer wiring (Mega Sprint 3691–3720) ──────────────
    // Flag-gated via the existing DONNA_EXECUTIVE_REASONING flag. The legacy
    // result above is always computed first, so it is available as the certified
    // fail-open fallback. Modes:
    //   off     → legacy only (production default; zero behavior change)
    //   shadow  → run executive in parallel, record diagnostics, return legacy
    //   primary → return executive when it validates, else legacy
    // Never throws to the user: any failure inside the bridge returns legacy.
    const execMode = resolveExecutiveMode()
    // Constitution (Mega Sprint 3901–3930) — classify the request so the routing
    // decision is developer-visible (Objective 6). Classification only; does not
    // change the proven execMode routing below.
    const classification = classifyRequest(msg)
    // Unified Executive Context Engine (Mega Sprint 3991–4020) — page-awareness trace.
    // Developer-only: proves which screen DONNA grounded the turn in.
    const pageTrace = buildPageContextDevTrace(input.route, input.livePageState ?? null)
    if (execMode === 'off') {
      logReasoningTrace({
        entryPoint: 'live_action',
        classification,
        routingDecision: 'legacy_engines (executive dormant)',
        contextSources: 0,
        openaiInvoked: false,
        validatorDisposition: 'n/a',
        executionMode: classification.class,
        finalResponseSource: 'legacy',
        executiveAttempted: false,
        fallbackReason: 'DONNA_EXECUTIVE_REASONING=off',
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
      })
      return legacyResult
    }
    // ── Durable Executive Learning retrieval (Mega Sprint 4231–4260) ───────────
    // Before reasoning, load this academy's durable learning and retrieve only the
    // records relevant to the request, compressed, for the packet's relevant_memory
    // slot. Fail-open: any issue → no learning, identical behavior to before. When
    // learning is available we narrow the replayed transcript window — DONNA reuses
    // what she has learned instead of re-sending a long history (token reduction).
    const durableLearning = await loadDurableLearning(supabase, academyId)
    const retrievedLearning = retrieveRelevantLearning({ request: msg, store: durableLearning, max: 6 })
    const durableMemories = learningToMemoryRecords(retrievedLearning)
    const execInput = durableMemories.length
      ? { ...input, userMessage: msg, conversationHistory: (input.conversationHistory ?? []).slice(-3) }
      : { ...input, userMessage: msg }

    // ── Proactive Executive Intelligence (Mega Sprint 4261–4290) ───────────────
    // When the Director asks a "what matters?" question, review the academy's real
    // signals + durable learning, rank the top priorities, and ground the executive
    // turn in them (via the packet's existing outstandingDecisions slot) so DONNA
    // answers from intelligence, not generic chat. Pure + fail-open (no signals → none).
    let extraDecisions: ReturnType<typeof recommendationsToDecisions> = []
    if (isProactiveExecutiveQuestion(msg)) {
      const briefing = buildExecutiveBriefing(input.livePageState ?? {}, durableLearning)
      if (briefing.hasState) {
        extraDecisions = recommendationsToDecisions(briefing.recommendations)
        // eslint-disable-next-line no-console
        console.info(formatExecutiveIntelligenceDiagnostics(briefing.diagnostics))
      }
    }

    try {
      const live = await runExecutiveLive(
        execInput,
        membership.role,
        { academyId, name: (academy?.name as string) ?? null, modelLabel: dnaModelId },
        legacyResult,
        execMode,
        // Mega Sprint 3841–3870 — feed the already-loaded live academy truth into
        // the Executive Context Packet (real signals, not role+permissions alone).
        directorCtx,
        // Mega Sprint 4231–4260 — relevant durable learning folded into relevant_memory.
        durableMemories,
        // Mega Sprint 4261–4290 — proactive priorities grounding the turn.
        extraDecisions,
      )

      // Capture durable learning from this turn's operating session and persist it
      // (deduped against what is already known). Fail-open; never blocks the answer.
      if (live.turn && execMode === 'primary') {
        try {
          const learned = learnFromOperatingSession({
            session: live.turn.session,
            dialogue: live.turn.dialogueState,
            workflow: live.turn.workflowState,
            ctx: { academyId, role: 'director', sessionId: input.route ?? 'live' },
            existing: durableLearning,
            now: Date.now(),
          })
          if (learned.hygiene.toStore.length) {
            await saveDurableLearning(supabase, academyId, learned.hygiene.toStore)
          }
        } catch { /* capture is best-effort */ }
      }
      logReasoningTrace({
        entryPoint: 'live_action',
        classification,
        routingDecision: live.diagnostics.executivePathUsed ? 'executive_layer' : 'legacy_fallback',
        contextSources: live.diagnostics.contextSources,
        openaiInvoked: live.diagnostics.openaiRealCall,
        validatorDisposition: live.diagnostics.responseDisposition,
        executionMode: classification.class,
        finalResponseSource: live.diagnostics.executivePathUsed ? 'executive' : 'legacy',
        executiveAttempted: live.diagnostics.executiveAttempted,
        // No silent fallback (Mega Sprint 4141–4170) — when legacy answers, the
        // reason is always stated; the full executive-chain state stays visible.
        fallbackReason: live.diagnostics.fallbackReason,
        dialogueStage: live.diagnostics.dialogueStage ?? null,
        sessionActiveObjective: live.diagnostics.sessionActiveObjective ?? null,
        workflowStep: live.diagnostics.workflowStep ?? null,
        workflowBlocker: live.diagnostics.workflowBlocker ?? null,
        learningReused: live.diagnostics.learningReused ?? 0,
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
        contextSourcesSkipped: live.diagnostics.contextSourcesSkipped,
        packetSizeChars: live.diagnostics.packetSizeChars,
        latencyMs: live.diagnostics.latencyMs,
      })
      return live.result
    } catch (bridgeErr) {
      console.error('[donnaLiveConversationAction] executive bridge error (returning legacy):',
        bridgeErr instanceof Error ? bridgeErr.message : String(bridgeErr))
      logReasoningTrace({
        entryPoint: 'live_action',
        classification,
        routingDecision: 'legacy_fallback (bridge error)',
        contextSources: 0,
        openaiInvoked: false,
        validatorDisposition: 'crashed',
        executionMode: classification.class,
        finalResponseSource: 'legacy',
        executiveAttempted: true,
        fallbackReason: bridgeErr instanceof Error ? bridgeErr.message : String(bridgeErr),
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
      })
      return legacyResult
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[donnaLiveConversationAction] Unhandled error:', message)
    return errorResult('Something went wrong. Try rephrasing your question.', input.userMessage ?? '')
  }
}
