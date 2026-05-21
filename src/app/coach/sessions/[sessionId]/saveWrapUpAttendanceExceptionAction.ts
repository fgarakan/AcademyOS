'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'
import { createRequestId } from '@/lib/observability/requestTrace'
import { createActionLogger } from '@/lib/observability/logger'
import { createDuplicateSubmissionMessage } from '@/lib/idempotency/actionGuards'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type UnrosteredAttendeeNote = 'trial' | 'sibling' | 'makeup' | 'unknown' | 'other'

export interface WrapUpUnrosteredEntry {
  name: string
  note: UnrosteredAttendeeNote
}

export interface SaveWrapUpAttendanceExceptionResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

const NOTE_REASONS: Record<UnrosteredAttendeeNote, string> = {
  trial: 'Trial class',
  sibling: 'Sibling of a rostered player',
  makeup: 'Makeup class from another group',
  unknown: 'Reason unknown — coach to follow up',
  other: 'Other — see coach notes',
}

// ─────────────────────────────────────────────────────────────
// Action
// Creates an attendance_exception proposed_actions row from
// structured coach wrap-up input.
//
// Safety guarantees:
//   - Never writes to session_attendance
//   - Never creates or modifies player profiles
//   - Never touches group_memberships
//   - Never triggers billing, enrollment, or parent comms
//   - Unrostered attendees stay in proposed_actions until director approves + applies
// ─────────────────────────────────────────────────────────────

export async function saveWrapUpAttendanceExceptionAction(
  sessionId: string,
  sessionName: string,
  unrosteredEntries: WrapUpUnrosteredEntry[],
  attendanceAnswerText: string,
): Promise<SaveWrapUpAttendanceExceptionResult> {
  const requestId = createRequestId('attendance-exc')
  const log = createActionLogger({ action: 'saveWrapUpAttendanceExceptionAction', requestId })

  await assertNotPreviewMode()

  if (!sessionId) return { ok: false, error: 'Session ID required.', draftId: null }
  if (!unrosteredEntries || unrosteredEntries.length === 0) {
    return { ok: false, error: 'No unexpected attendees to submit.', draftId: null }
  }
  if (unrosteredEntries.length > 10) {
    return { ok: false, error: 'Too many entries (max 10 per submission).', draftId: null }
  }
  for (const entry of unrosteredEntries) {
    const name = entry.name?.trim() ?? ''
    if (!name) return { ok: false, error: 'All attendee names must be filled in.', draftId: null }
    if (name.length > 100) return { ok: false, error: 'Attendee name too long (max 100 characters).', draftId: null }
  }

  const supabase = await getSupabaseServer()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    log.warn('auth_failed', { sessionId })
    return { ok: false, error: 'Not authenticated.', draftId: null }
  }

  // Resolve academy_id — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', draftId: null }
  const academyId = profile.academy_id

  // Verify role — coach, head_coach, or director can submit
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (!role || !['academy_director', 'head_coach', 'coach'].includes(role)) {
    return { ok: false, error: 'You do not have permission to submit attendance exceptions.', draftId: null }
  }

  // Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.', draftId: null }

  log.info('start', { sessionId, userId: user.id, academyId, entryCount: unrosteredEntries.length })

  // Duplicate guard: reject if this user submitted an attendance exception for this session
  // in the last 15 s. Prevents double-click without requiring a DB unique constraint.
  // Recommended future constraint: unique(session_id, proposed_by_id, target_module, status)
  // filtered to 'pending_review' — see docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md.
  const rawDb = supabase as any
  const windowStart = new Date(Date.now() - 15_000).toISOString()
  const { data: recentException } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', user.id)
    .eq('target_module', 'attendance_exception')
    .eq('target_object_id', sessionId)
    .gte('created_at', windowStart)
    .limit(1)
  if (recentException && recentException.length > 0) {
    log.warn('duplicate_submission', { sessionId, userId: user.id })
    return { ok: false, error: createDuplicateSubmissionMessage('attendance exception'), draftId: null }
  }

  // Build raw_input text for director card display
  const nameList = unrosteredEntries.map(e => `${e.name.trim()} (${NOTE_REASONS[e.note]})`).join(', ')
  const rawInput = attendanceAnswerText.trim()
    || `Unexpected attendees at ${sessionName || session.name || 'session'}: ${nameList}`

  // Build payload — matches attendance_exception_v1 shape expected by director review
  // Rostered attendance is omitted (handled separately by saveAttendanceAction)
  const payload = {
    draft_type: 'attendance_exception_v1',
    source: 'coach_wrap_up',
    raw_input: rawInput,
    session_id: sessionId,
    group_id: session.group_id,
    rostered_attendance: [],
    unrostered_attendees: unrosteredEntries.map(e => ({
      name: e.name.trim(),
      reason: NOTE_REASONS[e.note],
    })),
    warnings: [
      'Draft only. No official attendance has been changed.',
      'Unrostered attendees require director review before any roster, billing, or parent communication changes.',
      'Rostered player attendance was captured separately via the coach attendance tool.',
    ],
  }

  // issuer_role for voice_commands
  const issuerRole: 'academy_director' | 'head_coach' | 'coach' =
    role === 'academy_director' ? 'academy_director'
    : role === 'head_coach' ? 'head_coach'
    : 'coach'

  // Create voice_commands record (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: rawInput,
      transcript: rawInput,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    log.error('voice_command_failed', { sessionId, message: vcError?.message ?? 'unknown' })
    return { ok: false, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}`, draftId: null }
  }

  // Create proposed_actions row — status pending_review, no mutation until director applies
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Attendance Exception — ${sessionName || session.name || 'Session'}`,
      target_module: 'attendance_exception',
      target_object_id: sessionId,
      target_object_type: 'session',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No attendance was recorded.',
        'Unrostered attendees require separate director decision.',
        'No player profiles, billing, or parent communications were modified.',
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
