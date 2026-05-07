'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

const TERMINAL_STATUSES = ['confirmed', 'waived'] as const
const ALLOWED_NEW_STATUSES = ['confirmed', 'waived'] as const
type GateNewStatus = 'confirmed' | 'waived'

export interface ConfirmGateStatusResult {
  ok: boolean
  error: string | null
}

// ─────────────────────────────────────────────────────────────
// confirmGateStatusAction
//
// Allows academy_director and head_coach to manually confirm or
// waive a gate criterion in player_gate_status.
//
// GUARDRAILS:
//  - Only transitions to 'confirmed' or 'waived'
//  - Terminal statuses (confirmed, waived) cannot be overwritten
//  - Does NOT move the player to a new curriculum level
//  - Does NOT update player profile fields or priorities
//  - Does NOT expose anything to parent/player portals
//  - Does NOT call any AI API
//  - Writes audit_log entry for every state change
//
// playerId and gateId are bound from the server component.
// newStatus and waiverReason come from the client component.
// ─────────────────────────────────────────────────────────────

export async function confirmGateStatusAction(
  playerId: string,
  gateId: string,
  newStatus: GateNewStatus,
  waiverReason?: string,
): Promise<ConfirmGateStatusResult> {
  const fail = (error: string): ConfirmGateStatusResult => ({ ok: false, error })

  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // 2. Validate inputs
  if (!playerId) return fail('Missing player ID.')
  if (!gateId)   return fail('Missing gate ID.')
  if (!(ALLOWED_NEW_STATUSES as readonly string[]).includes(newStatus)) {
    return fail('Invalid status value.')
  }
  if (waiverReason !== undefined && waiverReason.length > 1000) {
    return fail('Waiver reason must be 1000 characters or fewer.')
  }

  // 3. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 4. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to confirm gate status.')
  }

  // 5. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  // 6. Fetch existing gate status row
  //    rawDb cast: player_gate_status is not yet in database.types.ts
  //    (pending type regeneration after live DB migration is confirmed)
  const rawDb = supabase as any
  const { data: existingRow } = await rawDb
    .from('player_gate_status')
    .select('id, status, evidence_count')
    .eq('player_id', playerId)
    .eq('gate_id', gateId)
    .eq('academy_id', academyId)
    .maybeSingle()

  const oldStatus = (existingRow?.status as string) ?? 'not_started'

  // Guard: terminal statuses cannot be overwritten
  if ((TERMINAL_STATUSES as readonly string[]).includes(oldStatus)) {
    return fail(`Gate is already ${oldStatus} and cannot be changed.`)
  }

  // 7. Build upsert payload — never touches evidence_count, last_evidence_at,
  //    is_player_visible, or is_parent_visible
  const now = new Date().toISOString()
  const upsertPayload: Record<string, unknown> = {
    player_id:  playerId,
    gate_id:    gateId,
    academy_id: academyId,
    status:     newStatus,
  }

  if (newStatus === 'confirmed') {
    upsertPayload.confirmed_by = user.id
    upsertPayload.confirmed_at = now
  } else {
    upsertPayload.waived_by  = user.id
    upsertPayload.waived_at  = now
    upsertPayload.waiver_reason = waiverReason?.trim() || null
  }

  // 8. Upsert the gate status row (creates if no evidence recorded yet)
  const { error: upsertError } = await rawDb
    .from('player_gate_status')
    .upsert(upsertPayload, { onConflict: 'player_id,gate_id' })

  if (upsertError) {
    return fail(`Failed to update gate status: ${upsertError.message}`)
  }

  // 9. Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id:  academyId,
      actor_id:    user.id,
      action:      'gate_status.director_decision',
      target_type: 'player_gate_status',
      target_id:   gateId,
      payload: {
        player_id:            playerId,
        gate_id:              gateId,
        old_status:           oldStatus,
        new_status:           newStatus,
        waiver_reason_present: newStatus === 'waived' && !!waiverReason?.trim(),
        evidence_count:       existingRow?.evidence_count ?? 0,
        role,
        actor_id:             user.id,
      },
      source_type: 'ui',
    })

  revalidatePath(`/director/players/${playerId}`)
  return { ok: true, error: null }
}
