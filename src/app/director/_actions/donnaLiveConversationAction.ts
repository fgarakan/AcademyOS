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

    // Final presentation layer (Part 3) — executive-tone refinement only.
    // Fail-open: returns the grounded result unchanged if refinement is
    // unavailable. Never alters facts, recommendations, or permissions.
    const role = membership.role === 'head_coach' ? 'coach' : 'director'
    return await applyExecutiveRefinement(result, role)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[donnaLiveConversationAction] Unhandled error:', message)
    return errorResult('Something went wrong. Try rephrasing your question.', input.userMessage ?? '')
  }
}
