'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { revalidatePath } from 'next/cache'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'
// Sprint 1092 — observation draft type for linked player observations
import type { CoachObservationDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction'

export interface ApplyWrapUpDraftResult {
  ok: boolean
  error: string | null
  /** Sprint 1092 — number of player observations persisted to coach_observations alongside this wrap-up. */
  observationsCreated?: number
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

  // Sprint 1092 — auto-apply linked player observation drafts for this session.
  //
  // When a director applies a session wrap-up, any coach_observation_draft_v1
  // proposed_actions linked to the same session are also applied: structured
  // coach_observations rows are written and those drafts are marked executed.
  //
  // This closes the loop without requiring the director to separately approve
  // and apply each individual observation draft after the wrap-up is applied.
  //
  // Safety invariants:
  //   - Only processes pending_review or approved drafts (never already-executed)
  //   - Only processes drafts with a valid player_id (never session-level free text)
  //   - Only processes drafts for this academy and this session_id
  //   - is_private: true always (never parent/player visible)
  //   - Best-effort: observation errors do not fail the whole wrap-up apply
  //   - Idempotency: status check + proposed_action_id tracked in ai_entities
  //   - Individual observation approval path still works independently

  let observationsCreated = 0
  try {
    const { data: observationDrafts } = await rawDb
      .from('proposed_actions')
      .select('id, proposed_by_id, proposed_payload, voice_command_id, status')
      .eq('academy_id', academyId)
      .eq('target_module', 'coach_observation_draft_v1')
      .in('status', ['pending_review', 'approved'])

    if (observationDrafts && (observationDrafts as Record<string, unknown>[]).length > 0) {
      const sessionLinked = (observationDrafts as Record<string, unknown>[]).filter(draft => {
        const p = draft['proposed_payload'] as CoachObservationDraftPayload | null
        return p?.session_id === sessionId && p?.player_id
      })

      for (const draft of sessionLinked) {
        const p = draft['proposed_payload'] as CoachObservationDraftPayload
        if (!p?.player_id || !p?.note) continue

        // Insert structured observation into coach_observations
        const { data: created, error: obsError } = await supabase
          .from('coach_observations')
          .insert({
            academy_id: academyId,
            coach_id: String(draft['proposed_by_id'] ?? user.id),
            player_id: p.player_id,
            session_id: sessionId,
            content: p.note,
            observation_type: p.observation_type ?? 'general',
            is_private: true,
            voice_command_id: (draft['voice_command_id'] as string | null) ?? null,
            ai_entities: {
              source: 'coach_wrap_up',
              proposed_action_id: String(draft['id']),
              applied_via: 'session_wrap_up_apply',
            },
          })
          .select('id')
          .single()

        if (obsError || !created) continue // best-effort — log but don't fail the wrap-up apply

        observationsCreated++

        // Mark observation draft as executed
        await rawDb
          .from('proposed_actions')
          .update({ status: 'executed', updated_at: new Date().toISOString() })
          .eq('id', String(draft['id']))
          .eq('academy_id', academyId)

        // Revalidate the affected player profile so coach_observations appear immediately
        revalidatePath(`/director/players/${p.player_id}`)
      }
    }
  } catch {
    // Non-fatal — session_notes was already written; observation persistence is best-effort
  }

  return { ok: true, error: null, observationsCreated }
}
