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

  return {
    ok: true as const,
    supabase,
    userId: user.id,
    academyId: profile.academy_id as string,
    role: role as 'academy_director' | 'head_coach',
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

  const { supabase, academyId, role } = auth

  // 3. Run orchestrator
  let response
  try {
    response = await orchestrate({
      role,
      pathname: input.pathname,
      userInput: input.userInput.trim(),
      academyId,
      pageLabel: input.pageLabel,
      firstName: input.firstName,
      pendingReviews: input.pendingReviews ?? 0,
      conversationHistory: input.conversationHistory,
      // playerId and sessionId: route context only — scoped DB reads, not LLM-trusted
      ...(input.playerId ? { playerId: input.playerId } : {}),
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      useLlm: input.useLlm ?? true,
    })
  } catch (err) {
    return {
      ok: false,
      hadBlockedAttempt: false,
      error: 'DONNA is temporarily unavailable. Please try again.',
    }
  }

  // 4. Write usage event to DB (fire-and-forget — never blocks response)
  void writeUsageEventToDb(supabase, {
    eventType: 'donna_intelligence_call',
    academyId,
    userId: auth.userId,
    blocked: response.hadBlockedAttempt,
    requestId: `${response.primaryOutput.type}:${response.primaryOutput.source}`,
    provider: 'anthropic',
  })

  // 5. Return safe result — safetyAudit and contextSummary are NOT returned
  return {
    ok: true,
    output: response.primaryOutput,
    hadBlockedAttempt: response.hadBlockedAttempt,
  }
}
