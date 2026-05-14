'use server'

// Sprint 279 — Donna Intelligence Draft Review Actions
// Updates proposed_actions.status for the three Donna intelligence draft types:
//   parent_communication, level_review, curriculum_adjustment.
//
// Safety contract:
//   - Only updates proposed_actions.status + reviewer tracking fields.
//   - Never touches proposed_payload, player profiles, curriculum, sessions, or any other table.
//   - Never sends communication, moves player levels, or changes curriculum.
//   - Director or head_coach only. Academy_id scoped. Preview mode blocked.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

const ALLOWED_TARGET_MODULES = new Set([
  'parent_communication',
  'level_review',
  'curriculum_adjustment',
  'coach_communication',
])

type DraftDecision = 'approved' | 'rejected' | 'clarification_needed'

export interface DonnaIntelligenceDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateDonnaIntelligenceDraftDecisionAction(
  proposedActionId: string,
  targetModule: string,
  decision: DraftDecision,
): Promise<DonnaIntelligenceDraftDecisionResult> {
  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Validate inputs
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  if (!ALLOWED_TARGET_MODULES.has(targetModule)) {
    return { ok: false, error: 'This draft type cannot be reviewed through this interface.' }
  }
  const allowedDecisions: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowedDecisions.includes(decision)) {
    return { ok: false, error: 'Invalid decision value.' }
  }

  // 3. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'Director or Head Coach access required.' }
  }

  // 5. Fetch proposed_action — verify it belongs to this academy, target_module is allowed, still pending
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Draft not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (!ALLOWED_TARGET_MODULES.has(proposedAction.target_module)) {
    return { ok: false, error: 'This draft type cannot be reviewed through this interface.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

  // 6. Build update payload — status + reviewer tracking fields only.
  //    proposed_payload is never touched. No other table is written.
  const now = new Date().toISOString()
  let updatePayload: Record<string, unknown>

  if (decision === 'approved') {
    updatePayload = {
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
    }
  } else if (decision === 'rejected') {
    updatePayload = {
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: now,
    }
  } else {
    // clarification_needed — no approved_by/rejected_by
    updatePayload = {
      status: 'clarification_needed',
    }
  }

  const { error: updateError } = await rawDb
    .from('proposed_actions')
    .update(updatePayload)
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to record decision: ${updateError.message}` }
  }

  revalidatePath('/director/review')

  return { ok: true, error: null }
}
