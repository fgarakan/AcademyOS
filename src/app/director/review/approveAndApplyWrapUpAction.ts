'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { revalidatePath } from 'next/cache'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

export interface ApproveAndApplyWrapUpResult {
  ok: boolean
  error: string | null
}

// Combined approve + apply action for session_wrap_up_v1 drafts.
// Equivalent to: updateWrapUpDraftDecisionAction(id, 'approved') → applyWrapUpDraftAction(id),
// but done in one server round-trip so the director does not need to refresh and click twice.
//
// Safety invariants:
//   - Only works for status = 'pending_review' AND target_module = 'session_wrap_up_v1'
//   - Does not touch any table other than proposed_actions, sessions, and audit_logs
//   - No parent records touched
//   - No player level movement
//   - No curriculum mutation
//   - No external communication
export async function approveAndApplyWrapUpAction(
  proposedActionId: string,
): Promise<ApproveAndApplyWrapUpResult> {
  try { await assertNotPreviewMode() } catch {
    return { ok: false, error: 'Writes are disabled in preview mode.' }
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }

  // Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // Role guard — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'You do not have permission to approve or apply session wrap-up drafts.' }
  }

  const rawDb = supabase as any

  // Fetch proposed_action — verify academy, module, and status
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!action) return { ok: false, error: 'Proposed action not found.' }
  if (action.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (action.target_module !== 'session_wrap_up_v1') {
    return { ok: false, error: 'Approve & Apply is only available for session wrap-up drafts.' }
  }
  if (action.status !== 'pending_review') {
    return { ok: false, error: 'Only pending drafts can be approved and applied in one step.' }
  }

  const sessionId = action.target_object_id as string | null
  if (!sessionId) return { ok: false, error: 'No session linked to this draft.' }

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status, academy_id, session_notes')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  const payload = action.proposed_payload as SessionActualDraftPayload

  // Build session_notes content from wrap-up payload (same logic as applyWrapUpDraftAction)
  const completedBlocks = payload.block_completion.filter(b => b.status === 'completed').length
  const skippedBlocks = payload.block_completion.filter(b => b.status === 'skipped').length
  const modifiedBlocks = payload.block_completion.filter(b => b.status === 'modified').length

  const blockSummaryLines = payload.block_completion.map(b =>
    `  - ${b.block_name}: ${b.status}${b.note ? ` (${b.note})` : ''}`
  ).join('\n')

  const now = new Date()
  const appliedDateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const noteParts: string[] = [
    `Session Wrap-Up — approved and applied by director ${appliedDateLabel}`,
    `Blocks: ${completedBlocks} completed, ${modifiedBlocks} modified, ${skippedBlocks} skipped`,
  ]
  if (blockSummaryLines) noteParts.push(`Block detail:\n${blockSummaryLines}`)
  if (payload.changes_note) noteParts.push(`Changes from plan: ${payload.changes_note}`)
  if (payload.next_focus) noteParts.push(`Next focus: ${payload.next_focus}`)
  if (payload.group_note) noteParts.push(`Group note: ${payload.group_note}`)
  if (payload.raw_standouts_answer) noteParts.push(`Player Standouts: ${payload.raw_standouts_answer}`)
  if (payload.raw_attention_answer) noteParts.push(`Needs Attention: ${payload.raw_attention_answer}`)
  const sessionNotes = noteParts.join('\n')

  const nowIso = now.toISOString()

  // Step 1: Update session — write notes + advance status if safe
  const sessionUpdate: Record<string, unknown> = {
    session_notes: sessionNotes,
    updated_at: nowIso,
  }
  const safeToComplete = session.status === 'planned' || session.status === 'in_progress'
  if (safeToComplete) sessionUpdate.status = 'completed'

  const { error: sessionUpdateError } = await rawDb
    .from('sessions')
    .update(sessionUpdate)
    .eq('id', sessionId)
    .eq('academy_id', academyId)

  if (sessionUpdateError) {
    return { ok: false, error: `Failed to update session: ${sessionUpdateError.message}` }
  }

  // Step 2: Mark proposed_action as executed (approved + applied in one go)
  const { error: actionUpdateError } = await rawDb
    .from('proposed_actions')
    .update({
      status: 'executed',
      approved_by: user.id,
      approved_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (actionUpdateError) {
    return { ok: false, error: `Session updated but failed to mark draft as executed: ${actionUpdateError.message}` }
  }

  // Step 3: Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'session_wrap_up.approved_and_applied',
      target_type: 'session',
      target_id: sessionId,
      target_label: session.name ?? sessionId,
      payload: {
        proposed_action_id: proposedActionId,
        session_id: sessionId,
        blocks_completed: completedBlocks,
        blocks_modified: modifiedBlocks,
        blocks_skipped: skippedBlocks,
        status_advanced: safeToComplete,
        applied_by: user.id,
        source: 'approve_and_apply_combined',
      },
      source_type: 'ui',
      voice_command_id: action.voice_command_id ?? null,
    })

  revalidatePath('/director/review')
  revalidatePath(`/director/sessions/${sessionId}`)

  return { ok: true, error: null }
}
