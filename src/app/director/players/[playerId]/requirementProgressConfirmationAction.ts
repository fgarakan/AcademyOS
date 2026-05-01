'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

const ALLOWED_STATUSES = [
  'not_started',
  'in_progress',
  'evidence_needed',
  'met',
  'waived',
  'blocked',
] as const

type RequirementStatus = typeof ALLOWED_STATUSES[number]

export interface ConfirmRequirementProgressResult {
  ok: boolean
  error: string | null
}

// ─────────────────────────────────────────────────────────────
// confirmRequirementProgressStatusAction
//
// Allows academy_director and head_coach to manually set the
// status of a player_requirement_progress row.
//
// GUARDRAILS:
//  - Does NOT automatically infer status from evidence_count
//  - Does NOT mark requirements met without explicit staff choice
//  - Does NOT move the player to a new curriculum level
//  - Does NOT update player profile fields or priorities
//  - Does NOT expose anything to parent/player portals
//  - Does NOT call any AI API
//
// playerId is bound from the server component before passing to client.
// progressId, newStatus, and note come from the client component.
// ─────────────────────────────────────────────────────────────

export async function confirmRequirementProgressStatusAction(
  playerId: string,
  progressId: string,
  newStatus: string,
  note?: string
): Promise<ConfirmRequirementProgressResult> {
  const fail = (error: string): ConfirmRequirementProgressResult => ({ ok: false, error })

  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // 2. Validate inputs
  if (!playerId)    return fail('Missing player ID.')
  if (!progressId)  return fail('Missing progress ID.')
  if (!(ALLOWED_STATUSES as readonly string[]).includes(newStatus)) {
    return fail('Invalid status value.')
  }
  if (note !== undefined && note.length > 1000) {
    return fail('Note must be 1000 characters or fewer.')
  }

  const typedStatus = newStatus as RequirementStatus

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
    return fail('You do not have permission to confirm requirement progress.')
  }

  // 5. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  // 6. Fetch progress row — verify it belongs to this academy and player
  //    rawDb cast: player_requirement_progress schema is not yet in database.types.ts
  //    (requires type regeneration after migrations 041–044 are confirmed applied to live DB)
  const rawDb = supabase as any
  const { data: progressRow } = await rawDb
    .from('player_requirement_progress')
    .select('id, academy_id, player_id, status, evidence_count')
    .eq('id', progressId)
    .single()

  if (!progressRow)                             return fail('Requirement progress row not found.')
  if (progressRow.academy_id !== academyId)     return fail('Access denied.')
  if (progressRow.player_id  !== playerId)      return fail('Player mismatch.')

  const oldStatus     = progressRow.status as string
  const evidenceCount = progressRow.evidence_count as number

  // 7. Build update payload
  //    Only touches status, notes, and confirmer fields.
  //    Never touches evidence_count, last_evidence_at, is_parent_visible, is_player_visible.
  const now = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: typedStatus,
  }

  // Include notes only if provided — preserve existing notes otherwise
  if (note !== undefined) {
    updatePayload.notes = note.trim() || null
  }

  // Confirmer fields logic
  if (typedStatus === 'met') {
    updatePayload.confirmed_at = now
    if (role === 'academy_director') {
      updatePayload.director_confirmed_by = user.id
    } else if (role === 'head_coach') {
      updatePayload.coach_confirmed_by = user.id
    }
  } else if (oldStatus === 'met') {
    // Moving away from met — clear all confirmed fields
    updatePayload.confirmed_at           = null
    updatePayload.director_confirmed_by  = null
    updatePayload.coach_confirmed_by     = null
  }
  // If neither old nor new status is 'met', leave confirmed fields unchanged

  // 8. Update the progress row
  const { error: updateError } = await rawDb
    .from('player_requirement_progress')
    .update(updatePayload)
    .eq('id', progressId)
    .eq('academy_id', academyId)

  if (updateError) {
    return fail(`Failed to update requirement status: ${updateError.message}`)
  }

  // 9. Write audit log — records who confirmed, from what status, and what evidence existed
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id:  academyId,
      actor_id:    user.id,
      action:      'requirement_progress.status_confirmed',
      target_type: 'player_requirement_progress',
      target_id:   progressId,
      payload: {
        player_id:     playerId,
        old_status:    oldStatus,
        new_status:    typedStatus,
        note_present:  note !== undefined && note.trim().length > 0,
        evidence_count: evidenceCount,
        role,
        confirmed_by:  user.id,
      },
      source_type: 'ui',
    })

  return { ok: true, error: null }
}
