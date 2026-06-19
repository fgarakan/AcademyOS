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

    // Run strategic AI brain
    return await processStrategicAIConversation(
      { ...input, userMessage: msg },
      academyId,
      academyDNAContext,
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[donnaStrategicConversationAction] Unhandled error:', message)
    return errorResult('Something went wrong. Try rephrasing your question.', input.userMessage ?? '')
  }
}
