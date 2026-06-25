'use server'

// Mega Sprint 3001–3030 — DONNA Strategic AI Augmentation V1
// Strategic Conversation Server Action
//
// Server action bridge between DonnaAssistantButton and the async strategic AI brain.
// Runs server-side so OPENAI_API_KEY is securely available.
//
// Safety contract:
//   - Director and head_coach only — other roles receive a safe error result
//   - academyId is always from server-side auth — never trusted from client input
//   - userMessage validated: non-empty, max 500 chars
//   - Academy DNA context fetched server-side (name + DNA model label only — no sensitive data)
//   - All errors return a safe DonnaMessageResult with action: 'respond'
//   - Stack traces never exposed to client
//   - All strategic learning entries are approval-gated (never auto-promoted)

import { getSupabaseServer } from '@/lib/supabase/server'
import { processStrategicAIConversation } from '@/lib/donna/brain/donnaLiveAIConversationBrain'
import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import { createDebugLog } from '@/lib/donna/brain/donnaBrainDebugLog'
import { applyExecutiveRefinement } from '@/lib/donna/brain/donnaExecutiveCommunicationLayer'
import { enforceCompletionContract } from '@/lib/donna/completion/donnaCompletionConvergence'
import { enforceExecutivePresence } from '@/lib/donna/conversation/donnaExecutivePresenceContract'
import { loadDirectorDonnaContext, type DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
// Mega Sprint 3931–3960 — DONNA Unified Reasoning Engine. Strategic reasoning is a
// CLIENT of the one Executive Operating Layer, not a second reasoning pipeline. The
// strategic brain above runs as the certified fail-open fallback; in primary mode the
// executive layer owns the reasoned answer (same proven wiring as the live action).
import { resolveExecutiveMode } from '@/lib/donna/executive/executiveShadowMode'
import { runExecutiveLive } from '@/lib/donna/executive/executiveLiveBridge'
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
    limitations: 'Strategic AI conversation error',
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

export async function donnaStrategicConversationAction(
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
      return errorResult('Strategic AI is only available to directors and head coaches.')
    }

    // Input validation
    const msg = input.userMessage?.trim() ?? ''
    if (!msg) return errorResult('Empty message received.')
    if (msg.length > 500) return errorResult('Message too long. Please rephrase your question.')

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

    // Run strategic AI brain (RealitySnapshot → router → brain → canonical gateway)
    const result = await processStrategicAIConversation(
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
    // only: consumes the existing operating-partner reality bundle, never reasons
    // new facts, and is additive/relevance-gated/fail-safe.
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

    // ── Unified reasoning: converge onto the ONE Executive Operating Layer ──────
    // (Mega Sprint 3931–3960). Strategic reasoning no longer terminates in its own
    // pipeline — it routes through the same runExecutiveLive() the live action uses,
    // so reasoning, context assembly, the OpenAI gateway, and validation are shared.
    // The strategic brain result above is the certified fail-open fallback. Modes:
    //   off → strategic legacy only; primary → executive owns the reasoned answer.
    const execMode = resolveExecutiveMode()
    const classification = classifyRequest(msg)
    const pageTrace = buildPageContextDevTrace(input.route, input.livePageState ?? null)
    if (execMode === 'off') {
      logReasoningTrace({
        entryPoint: 'strategic_action',
        classification,
        routingDecision: 'strategic_legacy (executive dormant)',
        contextSources: 0,
        openaiInvoked: false,
        validatorDisposition: 'n/a',
        executionMode: classification.class,
        finalResponseSource: 'legacy',
        fallbackReason: 'DONNA_EXECUTIVE_REASONING=off',
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
      })
      return legacyResult
    }
    try {
      const live = await runExecutiveLive(
        { ...input, userMessage: msg },
        membership.role,
        { academyId, name: (academy?.name as string) ?? null, modelLabel: dnaModelId },
        legacyResult,
        execMode,
        directorCtx,
      )
      logReasoningTrace({
        entryPoint: 'strategic_action',
        classification,
        routingDecision: live.diagnostics.executivePathUsed ? 'executive_layer' : 'legacy_fallback',
        contextSources: live.diagnostics.contextSources,
        openaiInvoked: live.diagnostics.openaiRealCall,
        validatorDisposition: live.diagnostics.responseDisposition,
        executionMode: classification.class,
        finalResponseSource: live.diagnostics.executivePathUsed ? 'executive' : 'legacy',
        fallbackReason: live.diagnostics.fallbackUsed ? `validator=${live.diagnostics.responseDisposition}` : null,
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
        contextSourcesSkipped: live.diagnostics.contextSourcesSkipped,
        packetSizeChars: live.diagnostics.packetSizeChars,
        latencyMs: live.diagnostics.latencyMs,
      })
      return live.result
    } catch (bridgeErr) {
      console.error('[donnaStrategicConversationAction] executive bridge error (returning legacy):',
        bridgeErr instanceof Error ? bridgeErr.message : String(bridgeErr))
      logReasoningTrace({
        entryPoint: 'strategic_action',
        classification,
        routingDecision: 'legacy_fallback (bridge error)',
        contextSources: 0,
        openaiInvoked: false,
        validatorDisposition: 'crashed',
        executionMode: classification.class,
        finalResponseSource: 'legacy',
        fallbackReason: bridgeErr instanceof Error ? bridgeErr.message : String(bridgeErr),
        pageDetected: pageTrace.pageDetected,
        uiContextCollected: pageTrace.uiContextCollected,
      })
      return legacyResult
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[donnaStrategicConversationAction] Unhandled error:', message)
    return errorResult('Something went wrong. Try rephrasing your question.', input.userMessage ?? '')
  }
}
