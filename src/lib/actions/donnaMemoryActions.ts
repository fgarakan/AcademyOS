'use server'

// Sprint 2261–2290 — DONNA Memory Activation V1
// Sprint 2291–2320 — DONNA Workflow Guidance V1 (+ workflow state save/load/clear)
//
// Server actions:
//   1. loadDonnaMemoryContextAction — loads all four memory tiers
//   2. finalizeStaleSessionAction   — finalizes any stale session
//   3. saveWorkflowStateAction      — persists active workflow state to donna_working_memory
//   4. loadWorkflowStateAction      — loads latest workflow state from donna_working_memory
//   5. clearWorkflowStateAction     — removes active workflow state from donna_working_memory
//
// Security: academyId + userId always resolved from authenticated session,
// never trusted from client payload.

import { getSupabaseServer } from '@/lib/supabase/server'
import { loadAllMemoryTiers } from '@/lib/donna/memory/donnaMemoryContextLoader'
import { finalizeStaleSession } from '@/lib/donna/memory/donnaCrossSessionMemory'
import type { MemoryContextPacket } from '@/lib/donna/memory/donnaMemoryContextTypes'
import { EMPTY_MEMORY_PACKET } from '@/lib/donna/memory/donnaMemoryContextTypes'
import type { DonnaWorkflowState } from '@/lib/donna/workflow/donnaWorkflowState'

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Resolve user + academy ────────────────────────────────────────────────────

async function resolveUserAndAcademy(supabase: any): Promise<
  | { ok: true; userId: string; academyId: string }
  | { ok: false; error: string }
> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return { ok: false, error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('academy_id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!membership?.academy_id) return { ok: false, error: 'No active academy membership' }

  return { ok: true, userId: user.id, academyId: membership.academy_id as string }
}

// ── loadDonnaMemoryContextAction ──────────────────────────────────────────────

export interface LoadMemoryContextInput {
  playerId?: string | null
  isFirstSessionOfDay: boolean
}

/**
 * Loads all applicable DONNA memory tiers for the current director session.
 * Called once at panel open; result cached client-side in a ref.
 * Non-fatal: returns EMPTY_MEMORY_PACKET on any auth or DB failure.
 */
export async function loadDonnaMemoryContextAction(
  input: LoadMemoryContextInput,
): Promise<ActionResult<MemoryContextPacket>> {
  try {
    const supabase = await getSupabaseServer()
    const resolved = await resolveUserAndAcademy(supabase)
    if (!resolved.ok) return { ok: true, data: EMPTY_MEMORY_PACKET }

    const packet = await loadAllMemoryTiers(supabase as any, {
      userId:             resolved.userId,
      academyId:          resolved.academyId,
      playerId:           input.playerId ?? null,
      isFirstSessionOfDay: input.isFirstSessionOfDay,
    })

    return { ok: true, data: packet }
  } catch {
    return { ok: true, data: EMPTY_MEMORY_PACKET }
  }
}

// ── finalizeStaleSessionAction ────────────────────────────────────────────────

/**
 * Checks for a stale active DONNA session and finalizes it by generating
 * a session summary stored in donna_conversation_sessions.metadata.
 * Fire-and-forget safe — the client does not need to await the result.
 */
export async function finalizeStaleSessionAction(): Promise<
  ActionResult<{ finalized: boolean; sessionId: string | null }>
> {
  try {
    const supabase = await getSupabaseServer()
    const resolved = await resolveUserAndAcademy(supabase)
    if (!resolved.ok) return { ok: true, data: { finalized: false, sessionId: null } }

    const result = await finalizeStaleSession(
      supabase as any,
      resolved.userId,
      resolved.academyId,
    )

    return { ok: true, data: result }
  } catch {
    return { ok: true, data: { finalized: false, sessionId: null } }
  }
}

// ── Workflow state: memory key constant ───────────────────────────────────────

const WORKFLOW_MEMORY_KEY = 'active_workflow_state'
const WORKFLOW_EXPIRES_DAYS = 7

// ── saveWorkflowStateAction ───────────────────────────────────────────────────

/**
 * Persists the Director's active workflow state to donna_working_memory.
 * Strategy: delete any existing row for this user + key, then insert fresh row
 * anchored to the most recent active DONNA session.
 * Non-fatal: any DB error returns ok:false but never throws.
 */
export async function saveWorkflowStateAction(
  state: DonnaWorkflowState,
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const supabase = await getSupabaseServer()
    const resolved = await resolveUserAndAcademy(supabase)
    if (!resolved.ok) return { ok: false, error: resolved.error }

    const rawDb = supabase as any
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + WORKFLOW_EXPIRES_DAYS * 86_400_000).toISOString()

    // Find the most recent donna_conversation_session for this user (any status)
    // We need a valid session_id FK to satisfy the donna_working_memory constraint.
    const { data: sessionRow } = await rawDb
      .from('donna_conversation_sessions')
      .select('id')
      .eq('user_id', resolved.userId)
      .eq('academy_id', resolved.academyId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (!sessionRow?.id) {
      // No session exists yet — workflow state will be in-memory only for this session.
      return { ok: false, error: 'No DONNA session found — workflow state not persisted.' }
    }

    const sessionId = sessionRow.id as string

    // Delete any existing row for this user + key (may span different session_ids)
    await rawDb
      .from('donna_working_memory')
      .delete()
      .eq('user_id', resolved.userId)
      .eq('memory_key', WORKFLOW_MEMORY_KEY)

    // Insert fresh row
    const { error } = await rawDb
      .from('donna_working_memory')
      .insert({
        session_id:   sessionId,
        academy_id:   resolved.academyId,
        user_id:      resolved.userId,
        memory_key:   WORKFLOW_MEMORY_KEY,
        memory_value: state as unknown as Record<string, unknown>,
        scope:        'user',
        expires_at:   expiresAt,
        updated_at:   now,
      })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { saved: true } }
  } catch {
    return { ok: false, error: 'Unexpected error saving workflow state.' }
  }
}

// ── loadWorkflowStateAction ───────────────────────────────────────────────────

/**
 * Loads the Director's most recent active workflow state from donna_working_memory.
 * Queries by user_id + memory_key (not session_id) for cross-session persistence.
 * Returns null when no unexpired workflow state exists.
 */
export async function loadWorkflowStateAction(): Promise<
  ActionResult<{ state: DonnaWorkflowState | null }>
> {
  try {
    const supabase = await getSupabaseServer()
    const resolved = await resolveUserAndAcademy(supabase)
    if (!resolved.ok) return { ok: true, data: { state: null } }

    const rawDb = supabase as any
    const now = new Date().toISOString()

    const { data: row } = await rawDb
      .from('donna_working_memory')
      .select('memory_value, expires_at')
      .eq('user_id', resolved.userId)
      .eq('memory_key', WORKFLOW_MEMORY_KEY)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!row?.memory_value) return { ok: true, data: { state: null } }

    const state = row.memory_value as DonnaWorkflowState
    // Only surface active/paused states
    if (state.status === 'cancelled' || state.status === 'completed') {
      return { ok: true, data: { state: null } }
    }

    return { ok: true, data: { state } }
  } catch {
    return { ok: true, data: { state: null } }
  }
}

// ── clearWorkflowStateAction ──────────────────────────────────────────────────

/**
 * Removes all active workflow state rows for this user.
 * Called when a workflow is completed or cancelled.
 */
export async function clearWorkflowStateAction(): Promise<
  ActionResult<{ cleared: boolean }>
> {
  try {
    const supabase = await getSupabaseServer()
    const resolved = await resolveUserAndAcademy(supabase)
    if (!resolved.ok) return { ok: false, error: resolved.error }

    const rawDb = supabase as any

    await rawDb
      .from('donna_working_memory')
      .delete()
      .eq('user_id', resolved.userId)
      .eq('memory_key', WORKFLOW_MEMORY_KEY)

    return { ok: true, data: { cleared: true } }
  } catch {
    return { ok: false, error: 'Unexpected error clearing workflow state.' }
  }
}
