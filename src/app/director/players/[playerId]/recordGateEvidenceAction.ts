'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

// player_gate_status and curriculum_gates were added in migrations 059/052 and are not
// yet reflected in database.types.ts (types regenerated after live DB repair is applied).
// rawDb is used for those two tables only. audit_logs is in types but follows rawDb for
// consistency with the same pattern in requirementProgressConfirmationAction.ts.

export async function recordGateEvidenceAction(
  playerId: string,
  academyId: string,
  gateId: string,
  gateCriterion: string,
  evidenceText: string,
): Promise<{ error?: string }> {
  if (!evidenceText.trim()) return { error: 'Evidence text is required.' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const rawDb = supabase as any

  // 1. Check for an existing player_gate_status row for this (player, gate).
  const { data: existingRows, error: fetchError } = await rawDb
    .from('player_gate_status')
    .select('id, status, evidence_count')
    .eq('player_id', playerId)
    .eq('gate_id', gateId)
    .eq('academy_id', academyId)
    .limit(1)

  if (fetchError) {
    return { error: fetchError.message ?? 'Failed to read gate status' }
  }

  const existingRow = existingRows?.[0] ?? null
  let newCount: number

  if (existingRow) {
    // Gate is closed — do not accept further evidence.
    if (existingRow.status === 'confirmed' || existingRow.status === 'waived') {
      return { error: 'Gate is already confirmed or waived — evidence cannot be added.' }
    }

    newCount = (existingRow.evidence_count ?? 0) + 1

    // only transition not_started → observing; leave all other statuses unchanged
    const newStatus = existingRow.status === 'not_started' ? 'observing' : existingRow.status

    const { error: updateError } = await rawDb
      .from('player_gate_status')
      .update({
        evidence_count:  newCount,
        last_evidence_at: new Date().toISOString(),
        status:           newStatus,
      })
      .eq('id', existingRow.id)
      .eq('academy_id', academyId)

    if (updateError) {
      return { error: updateError.message ?? 'Failed to update gate status' }
    }

  } else {
    // No bootstrap row for this player-gate pair — create one on first evidence submission.
    // Fetch the gate's criterion text to freeze as gate_criterion_snapshot.
    const { data: gateRows } = await rawDb
      .from('curriculum_gates')
      .select('criterion')
      .eq('id', gateId)
      .limit(1)

    // Fall back to the caller-supplied gateCriterion if the gate row is unexpectedly absent.
    const criterionSnapshot: string = gateRows?.[0]?.criterion ?? gateCriterion

    newCount = 1

    const { error: insertError } = await rawDb
      .from('player_gate_status')
      .insert({
        academy_id:              academyId,
        player_id:               playerId,
        gate_id:                 gateId,
        gate_criterion_snapshot: criterionSnapshot,
        status:                  'observing',
        evidence_count:          1,
        last_evidence_at:        new Date().toISOString(),
        is_player_visible:       false,
        is_parent_visible:       false,
      })

    if (insertError) {
      return { error: insertError.message ?? 'Failed to create gate status row' }
    }
  }

  // 2. Audit log — records actor, gate, and evidence count after write.
  // Evidence text is stored in the payload for staff-only audit purposes only.
  // is_parent_visible / is_player_visible remain false; audit_logs is never surfaced to portals.
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id:   academyId,
      actor_id:     user.id,
      action:       'gate_status.evidence_recorded',
      target_type:  'player_gate_status',
      target_id:    gateId,
      source_type:  'ui',
      payload: {
        player_id:            playerId,
        gate_id:              gateId,
        gate_criterion:       gateCriterion.slice(0, 120),
        evidence_text:        evidenceText.trim(),
        evidence_count_after: newCount,
      },
    })

  revalidatePath(`/director/players/${playerId}`)
  return {}
}
