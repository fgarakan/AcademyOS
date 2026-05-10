'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { revalidatePath } from 'next/cache'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

export interface ApplyWrapUpDraftResult {
  ok: boolean
  error: string | null
}

export async function applyWrapUpDraftAction(
  proposedActionId: string
): Promise<ApplyWrapUpDraftResult> {
  try { await assertNotPreviewMode() } catch {
    return { ok: false, error: 'Writes are disabled in preview mode.' }
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!proposedActionId) return { ok: false, error: 'Missing proposed action ID.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, error: 'You do not have permission to apply session wrap-up drafts.' }
  }

  const rawDb = supabase as any

  // Fetch proposed_action — must be approved, correct module, and belong to this academy
  const { data: proposedAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, voice_command_id')
    .eq('id', proposedActionId)
    .single()

  if (!proposedAction) return { ok: false, error: 'Proposed action not found.' }
  if (proposedAction.academy_id !== academyId) return { ok: false, error: 'Access denied.' }
  if (proposedAction.target_module !== 'session_wrap_up_v1') {
    return { ok: false, error: 'This action cannot be applied through this interface.' }
  }
  if (proposedAction.status !== 'approved') {
    return { ok: false, error: 'Only approved drafts can be applied.' }
  }

  const sessionId = proposedAction.target_object_id as string | null
  if (!sessionId) return { ok: false, error: 'No session linked to this draft.' }

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status, academy_id, session_notes')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  const payload = proposedAction.proposed_payload as SessionActualDraftPayload

  // Build session_notes content from wrap-up payload
  const completedBlocks = payload.block_completion.filter(b => b.status === 'completed').length
  const skippedBlocks = payload.block_completion.filter(b => b.status === 'skipped').length
  const modifiedBlocks = payload.block_completion.filter(b => b.status === 'modified').length

  const blockSummaryLines = payload.block_completion.map(b =>
    `  - ${b.block_name}: ${b.status}${b.note ? ` (${b.note})` : ''}`
  ).join('\n')

  const noteParts: string[] = [
    `Session Wrap-Up — applied by director ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    `Blocks: ${completedBlocks} completed, ${modifiedBlocks} modified, ${skippedBlocks} skipped`,
  ]
  if (blockSummaryLines) noteParts.push(`Block detail:\n${blockSummaryLines}`)
  if (payload.changes_note) noteParts.push(`Changes from plan: ${payload.changes_note}`)
  if (payload.next_focus) noteParts.push(`Next focus: ${payload.next_focus}`)
  if (payload.group_note) noteParts.push(`Group note: ${payload.group_note}`)
  if (payload.raw_standouts_answer) noteParts.push(`Player Standouts: ${payload.raw_standouts_answer}`)
  if (payload.raw_attention_answer) noteParts.push(`Needs Attention: ${payload.raw_attention_answer}`)

  const sessionNotes = noteParts.join('\n')

  // Update session — write notes and mark completed if not already
  const sessionUpdate: Record<string, unknown> = {
    session_notes: sessionNotes,
    updated_at: new Date().toISOString(),
  }

  // Only advance status to completed — never go backwards
  const safeToComplete = session.status === 'planned' || session.status === 'in_progress'
  if (safeToComplete) {
    sessionUpdate.status = 'completed'
  }

  const { error: sessionUpdateError } = await rawDb
    .from('sessions')
    .update(sessionUpdate)
    .eq('id', sessionId)
    .eq('academy_id', academyId)

  if (sessionUpdateError) {
    return { ok: false, error: `Failed to update session: ${sessionUpdateError.message}` }
  }

  // Mark proposed_action as executed
  const { error: actionUpdateError } = await rawDb
    .from('proposed_actions')
    .update({ status: 'executed', updated_at: new Date().toISOString() })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  if (actionUpdateError) {
    return { ok: false, error: `Session updated but failed to mark draft as executed: ${actionUpdateError.message}` }
  }

  // Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'session_wrap_up.applied',
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
        source: 'session_wrap_up_v1',
      },
      source_type: 'ui',
      voice_command_id: proposedAction.voice_command_id ?? null,
    })

  revalidatePath('/director/review')
  revalidatePath(`/director/sessions/${sessionId}`)

  return { ok: true, error: null }
}
