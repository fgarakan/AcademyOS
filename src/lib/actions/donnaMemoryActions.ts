'use server'

// Sprint 2261–2290 — DONNA Memory Activation V1
// Two server actions called at panel open:
//   1. loadDonnaMemoryContextAction — loads all four memory tiers
//   2. finalizeStaleSessionAction   — finalizes any stale session (fire-and-forget)
//
// Security: academyId + userId always resolved from authenticated session,
// never trusted from client payload.

import { getSupabaseServer } from '@/lib/supabase/server'
import { loadAllMemoryTiers } from '@/lib/donna/memory/donnaMemoryContextLoader'
import { finalizeStaleSession } from '@/lib/donna/memory/donnaCrossSessionMemory'
import type { MemoryContextPacket } from '@/lib/donna/memory/donnaMemoryContextTypes'
import { EMPTY_MEMORY_PACKET } from '@/lib/donna/memory/donnaMemoryContextTypes'

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
