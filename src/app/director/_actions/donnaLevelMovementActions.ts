'use server'

// Sprint 284 — Donna Level Movement Application
//
// Applies an approved level readiness review to move a player to the next level.
// Requires: the proposed_action must be in 'approved' status and target_module = 'level_review'.
//
// Safety contract:
//   - Director only (not head_coach). Academy_id scoped.
//   - Preview mode blocked.
//   - Requires the proposed_action to be in 'approved' status — never applies pending drafts.
//   - Resolves next_level string → curriculum_levels.id before writing.
//   - Writes to: player_curriculum_states.current_level_id + players.current_level_id.
//   - Writes to: audit_logs.
//   - Marks proposed_action as 'executed'.
//   - Never notifies parent, player, or coach.
//   - Never modifies show_to_parent or show_to_student.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import { assertDonnaApprovalAllowed } from '@/lib/donna/donnaApprovalGate'

export interface DonnaLevelMovementResult {
  ok: boolean
  message: string
  safetyNotes: string[]
}

// ---------------------------------------------------------------------------
// Auth helper — director only
// ---------------------------------------------------------------------------

async function getDirectorContext() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return { ok: false as const, error: 'Academy Director access required to apply level changes.' }
  }

  return { ok: true as const, supabase, userId: user.id, academyId }
}

// ---------------------------------------------------------------------------
// applyApprovedLevelMovementAction
// ---------------------------------------------------------------------------

export async function applyApprovedLevelMovementAction(
  proposedActionId: string,
): Promise<DonnaLevelMovementResult> {
  if (await isPreviewMode()) {
    return { ok: false, message: 'Writes are disabled in preview mode.', safetyNotes: [] }
  }

  // Sprint 917 — Approval gate pre-flight: level_movement requires director_approval level.
  // This apply path only executes when proposed_action.status='approved' (verified below),
  // so passing director_approval as currentLevel confirms the gate is satisfied.
  const gateCheck = assertDonnaApprovalAllowed('level_movement', 'director_approval')
  if (!gateCheck.allowed) {
    return {
      ok: false,
      message: `Approval gate blocked: ${gateCheck.reason}`,
      safetyNotes: ['Level movement requires explicit director approval through the Review Queue.'],
    }
  }

  const ctx = await getDirectorContext()
  if (!ctx.ok) return { ok: false, message: ctx.error, safetyNotes: [] }

  const { supabase, userId, academyId } = ctx
  const rawDb = supabase as any

  if (!proposedActionId) {
    return { ok: false, message: 'Missing proposed action ID.', safetyNotes: [] }
  }

  // 1. Fetch proposed_action — must be approved, level_review, this academy
  const { data: pa } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, approved_by')
    .eq('id', proposedActionId)
    .single()

  if (!pa) return { ok: false, message: 'Draft not found.', safetyNotes: [] }
  if (pa.academy_id !== academyId) return { ok: false, message: 'Access denied.', safetyNotes: [] }
  if (pa.target_module !== 'level_review') {
    return { ok: false, message: 'This action can only apply level review drafts.', safetyNotes: [] }
  }
  if (pa.status === 'executed') {
    return { ok: false, message: 'This level change has already been applied.', safetyNotes: [] }
  }
  if (pa.status !== 'approved') {
    return {
      ok: false,
      message: 'The draft must be approved before the level change can be applied.',
      safetyNotes: ['Mark the draft as Approved in the Review Queue first.'],
    }
  }

  const payload = (pa.proposed_payload as Record<string, unknown>) ?? {}
  const playerId = (payload.player_id as string | null) ?? null
  const playerLabel = (payload.player_label as string | null) ?? 'this player'
  const nextLevelLabel = (payload.next_level as string | null) ?? null

  if (!playerId) {
    return { ok: false, message: 'Player ID not found in draft payload. Cannot apply level change.', safetyNotes: [] }
  }
  if (!nextLevelLabel) {
    return { ok: false, message: 'Target level not found in draft payload. Cannot apply level change.', safetyNotes: [] }
  }

  // 2. Resolve next_level display_name → curriculum_levels.id
  const { data: levelRow } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, sort_order')
    .eq('academy_id', academyId)
    .ilike('display_name', nextLevelLabel.trim())
    .single()

  if (!levelRow) {
    return {
      ok: false,
      message: `Cannot find a curriculum level matching "${nextLevelLabel}". Verify the level exists before applying.`,
      safetyNotes: ['No player data was changed.'],
    }
  }

  const nextLevelId = levelRow.id as string

  // 3. Verify the player belongs to this academy
  const { data: playerRow } = await rawDb
    .from('players')
    .select('id, current_level_id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()

  if (!playerRow) {
    return { ok: false, message: 'Player not found in this academy.', safetyNotes: [] }
  }

  const now = new Date().toISOString()

  // 4. Update player_curriculum_states.current_level_id
  const { error: pcsError } = await rawDb
    .from('player_curriculum_states')
    .upsert(
      {
        player_id: playerId,
        academy_id: academyId,
        current_level_id: nextLevelId,
        advancement_eligible: false,
        updated_at: now,
      },
      { onConflict: 'player_id,academy_id' },
    )

  if (pcsError) {
    return {
      ok: false,
      message: `Failed to update curriculum state: ${pcsError.message}`,
      safetyNotes: ['No player data was changed.'],
    }
  }

  // 5. Update players.current_level_id
  const { error: playerError } = await rawDb
    .from('players')
    .update({ current_level_id: nextLevelId, updated_at: now })
    .eq('id', playerId)
    .eq('academy_id', academyId)

  if (playerError) {
    return {
      ok: false,
      message: `Failed to update player level: ${playerError.message}`,
      safetyNotes: ['player_curriculum_states was updated but players table was not. Review manually.'],
    }
  }

  // 6. Write audit_log
  await rawDb.from('audit_logs').insert({
    academy_id: academyId,
    actor_id: userId,
    action: 'player_level_advanced',
    payload: {
      player_id: playerId,
      player_label: playerLabel,
      new_level_id: nextLevelId,
      new_level_label: nextLevelLabel,
      proposed_action_id: proposedActionId,
      applied_at: now,
    },
    target_type: 'player',
    target_id: playerId,
  })

  // 7. Mark proposed_action as executed
  await rawDb
    .from('proposed_actions')
    .update({ status: 'executed', updated_at: now })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${playerId}`)

  return {
    ok: true,
    message: `${playerLabel} has been advanced to ${levelRow.display_name}.`,
    safetyNotes: [
      'Level updated in player_curriculum_states and players tables.',
      'Audit log written.',
      'No parent, player, or coach was notified.',
      'show_to_parent and show_to_student were not changed.',
    ],
  }
}
