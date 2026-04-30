'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export type DraftDecision = 'approved' | 'rejected' | 'clarification_needed'

export interface UpdateDraftDecisionResult {
  ok: boolean
  error: string | null
}

export async function updateStructuredDraftDecisionAction(
  proposedActionId: string,
  decision: DraftDecision,
  reviewNotes?: string
): Promise<UpdateDraftDecisionResult> {
  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Validate input
  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }
  const allowedDecisions: DraftDecision[] = ['approved', 'rejected', 'clarification_needed']
  if (!allowedDecisions.includes(decision)) return { ok: false, error: 'Invalid decision value.' }
  if (reviewNotes && reviewNotes.length > 1000) {
    return { ok: false, error: 'Review note must be 1000 characters or fewer.' }
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
    return { ok: false, error: 'You do not have permission to review structured drafts.' }
  }

  // 5. Fetch proposed_action — verify belongs to this academy and is reviewable
  const rawDb = supabase as any
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'session_recap_structuring') {
    return { ok: false, error: 'This action cannot be reviewed through this interface.' }
  }
  if (proposedAction.status !== 'pending_review') {
    return { ok: false, error: 'This draft has already been reviewed.' }
  }

  // 6. Build update payload — only updates status + reviewer tracking fields
  //    Never touches proposed_payload, player profiles, attendance, or any other table
  const now = new Date().toISOString()
  let updatePayload: Record<string, unknown>

  if (decision === 'approved') {
    updatePayload = {
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
    }
  } else if (decision === 'rejected') {
    updatePayload = {
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: now,
      ...(reviewNotes ? { rejection_reason: reviewNotes, reviewer_notes: reviewNotes } : {}),
    }
  } else {
    // clarification_needed — no approved_by/rejected_by; reviewer_notes carries the context
    updatePayload = {
      status: 'clarification_needed',
      ...(reviewNotes ? { reviewer_notes: reviewNotes } : {}),
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

  return { ok: true, error: null }
}
