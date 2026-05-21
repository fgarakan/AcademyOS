'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { createRequestId } from '@/lib/observability/requestTrace'
import { createActionLogger } from '@/lib/observability/logger'
import { createDuplicateSubmissionMessage } from '@/lib/idempotency/actionGuards'

// ─────────────────────────────────────────────────────────────
// Payload types
// ─────────────────────────────────────────────────────────────

export interface BlockCompletionDraft {
  block_id: string
  block_name: string
  status: 'completed' | 'skipped' | 'modified'
  note: string
}

export interface SessionActualDraftPayload {
  draft_type: 'session_actual_v1'
  session_id: string
  session_name: string
  block_completion: BlockCompletionDraft[]
  changes_note: string
  next_focus: string
  group_note: string
  raw_attendance_answer: string
  raw_standouts_answer: string
  raw_attention_answer: string
  warnings: string[]
}

export interface SaveWrapUpDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export async function saveWrapUpDraftAction(
  sessionId: string,
  sessionName: string,
  blockCompletion: BlockCompletionDraft[],
  answers: {
    attendance: string
    changes: string
    standouts: string
    attention: string
    nextFocus: string
    groupNote: string
  },
): Promise<SaveWrapUpDraftResult> {
  const requestId = createRequestId('wrap-up-draft')
  const log = createActionLogger({ action: 'saveWrapUpDraftAction', requestId })

  try { await assertNotPreviewMode() } catch {
    return { ok: false, error: 'Writes are disabled in preview mode.', draftId: null }
  }

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    log.warn('auth_failed', { sessionId })
    return { ok: false, error: 'Not authenticated.', draftId: null }
  }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', draftId: null }
  const academyId = profile.academy_id

  // 3. Verify role
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (!role || !['academy_director', 'head_coach', 'coach'].includes(role)) {
    return { ok: false, error: 'Not authorized to create session actual drafts.', draftId: null }
  }

  // 4. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.', draftId: null }

  log.info('start', { sessionId, userId: user.id, academyId, blockCount: blockCompletion.length })

  // Duplicate guard: reject if this user submitted a wrap-up draft for this session in the last 30 s.
  // Prevents double-click / double-submit without requiring a DB unique constraint.
  // True idempotency via a unique constraint is tracked in docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md.
  const windowStart = new Date(Date.now() - 30_000).toISOString()
  const { data: recentDraft } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', user.id)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('target_object_id', sessionId)
    .gte('created_at', windowStart)
    .limit(1)
  if (recentDraft && recentDraft.length > 0) {
    log.warn('duplicate_submission', { sessionId, userId: user.id })
    return { ok: false, error: createDuplicateSubmissionMessage('session wrap-up draft'), draftId: null }
  }

  // 5. Build payload
  const payload: SessionActualDraftPayload = {
    draft_type: 'session_actual_v1',
    session_id: sessionId,
    session_name: sessionName,
    block_completion: blockCompletion,
    changes_note: answers.changes,
    next_focus: answers.nextFocus,
    group_note: answers.groupNote,
    raw_attendance_answer: answers.attendance,
    raw_standouts_answer: answers.standouts,
    raw_attention_answer: answers.attention,
    warnings: [
      'Draft only. No session records have been officially updated.',
      'Block completion reflects coach self-report — not automatically applied to session_blocks.',
    ],
  }

  // 6. Create voice_commands record (required FK for proposed_actions)
  const issuerRole = role === 'academy_director' ? 'academy_director'
    : role === 'head_coach' ? 'head_coach'
    : 'coach'

  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      input_method: 'typed',
      raw_input: `[Wrap-Up] ${sessionName}`,
      transcript: `[Wrap-Up] ${sessionName}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    log.error('voice_command_failed', { sessionId, message: vcError?.message ?? 'unknown' })
    return { ok: false, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}`, draftId: null }
  }

  // 7. Store draft as proposed_actions row
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Session Actual Draft — ${sessionName}`,
      target_module: 'session_wrap_up_v1',
      target_object_id: sessionId,
      target_object_type: 'session',
      proposed_payload: payload,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. Session records not changed.',
        'Block completion is self-reported — requires director review.',
        'No template, player profile, or parent communication was modified.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    log.error('proposed_action_failed', { sessionId, message: paError?.message ?? 'unknown' })
    return { ok: false, error: `Failed to save draft: ${paError?.message ?? 'unknown'}`, draftId: null }
  }

  log.info('success', { sessionId, draftId: proposedAction.id })
  return { ok: true, error: null, draftId: proposedAction.id as string }
}
