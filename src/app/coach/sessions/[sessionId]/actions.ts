'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface ExerciseUpdate {
  id: string
  completed: boolean
  notes: string | null
}

export interface SaveExecutionInput {
  sessionId: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  sessionNotes: string | null
  exerciseUpdates: ExerciseUpdate[]
}

export interface SaveExecutionResult {
  ok: boolean
  error: string | null
}

export interface AttendanceUpdate {
  playerId: string
  status: 'present' | 'absent' | 'late' | 'excused'
}

export interface SaveAttendanceInput {
  sessionId: string
  attendanceUpdates: AttendanceUpdate[]
}

export interface SaveAttendanceResult {
  ok: boolean
  error: string | null
}

export async function saveSessionExecutionAction(
  input: SaveExecutionInput
): Promise<SaveExecutionResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id, academy_id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  // 4. Verify coach access:
  //    Preferred: session.coach_id matches the authenticated user
  //    Fallback: user is a coach/head_coach/director role in this academy
  const isAssignedCoach = session.coach_id === user.id
  if (!isAssignedCoach) {
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .in('role', ['coach', 'head_coach', 'academy_director'])
      .single()
    if (!membership) return { ok: false, error: 'Not authorized to update this session.' }
  }

  // 5. Update session status and notes (session-layer only — never touches templates)
  const { error: sessionUpdateError } = await supabase
    .from('sessions')
    .update({
      status: input.status,
      session_notes: input.sessionNotes,
    })
    .eq('id', session.id)
    .eq('academy_id', academyId)

  if (sessionUpdateError) {
    return { ok: false, error: `Failed to update session: ${sessionUpdateError.message}` }
  }

  // 6. Verify submitted exercise IDs belong to this session's blocks
  //    Fetch all session block IDs for this session first
  const { data: sessionBlocks } = await supabase
    .from('session_blocks')
    .select('id')
    .eq('session_id', session.id)

  const validBlockIds = new Set((sessionBlocks ?? []).map(b => b.id))

  if (input.exerciseUpdates.length > 0) {
    // Fetch all exercises for blocks in this session to verify ownership
    const { data: validExercises } = await supabase
      .from('session_block_exercises')
      .select('id, block_id')
      .in('block_id', Array.from(validBlockIds))

    const validExerciseIds = new Set((validExercises ?? []).map(e => e.id))

    // Reject any submitted exercise ID that doesn't belong to this session
    for (const update of input.exerciseUpdates) {
      if (!validExerciseIds.has(update.id)) {
        return { ok: false, error: 'Invalid exercise ID submitted.' }
      }
    }

    // 7. Update session_block_exercises sequentially (per AI_BACKEND_RULES #5)
    //    Only updates session-layer records — never touches template_block_exercises
    for (const update of input.exerciseUpdates) {
      const { error: exError } = await supabase
        .from('session_block_exercises')
        .update({
          completed: update.completed,
          notes: update.notes,
        })
        .eq('id', update.id)

      if (exError) {
        return { ok: false, error: `Failed to update exercise: ${exError.message}` }
      }
    }
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Session Recap
// ─────────────────────────────────────────────────────────────

export interface SaveSessionRecapInput {
  sessionId: string
  recapText: string
}

export interface SaveSessionRecapResult {
  ok: boolean
  error: string | null
  voiceNoteId?: string | null
}

export async function saveSessionRecapAction(
  input: SaveSessionRecapInput
): Promise<SaveSessionRecapResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  // 4. Verify coach access
  const isAssignedCoach = session.coach_id === user.id
  if (!isAssignedCoach) {
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .in('role', ['coach', 'head_coach', 'academy_director'])
      .single()
    if (!membership) return { ok: false, error: 'Not authorized to save a recap for this session.' }
  }

  // 5. Validate recap text
  const recapText = input.recapText.trim()
  if (!recapText) return { ok: false, error: 'Recap text cannot be empty.' }
  if (recapText.length > 5000) return { ok: false, error: 'Recap text is too long (max 5,000 characters).' }

  // 6. Insert voice_notes record
  //    player_id omitted (null) — session-level recap, not player-specific
  //    processing_status: 'pending' — raw input awaiting structuring
  //    transcript: same as raw_input for V1 typed input
  const { data: voiceNoteRow, error: insertError } = await supabase
    .from('voice_notes')
    .insert({
      academy_id: academyId,
      author_id: user.id,
      session_id: input.sessionId,
      raw_input: recapText,
      transcript: recapText,
      processing_status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    return { ok: false, error: `Failed to save recap: ${insertError.message}` }
  }

  return { ok: true, error: null, voiceNoteId: voiceNoteRow?.id ?? null }
}

export async function saveAttendanceAction(
  input: SaveAttendanceInput
): Promise<SaveAttendanceResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify session belongs to this academy and fetch group_id
  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id, group_id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  // 4. Verify coach access
  const isAssignedCoach = session.coach_id === user.id
  if (!isAssignedCoach) {
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .in('role', ['coach', 'head_coach', 'academy_director'])
      .single()
    if (!membership) return { ok: false, error: 'Not authorized to update this session.' }
  }

  // 5. Require group_id — no roster means no valid player set to verify against
  if (!session.group_id) {
    return { ok: false, error: 'No group is assigned to this session. Attendance cannot be saved without a player roster.' }
  }

  // 6. Fetch valid player IDs from current group membership (server-side — never trust client)
  const { data: memberships } = await supabase
    .from('group_memberships')
    .select('player_id')
    .eq('group_id', session.group_id)
    .eq('is_current', true)
    .eq('academy_id', academyId)

  const validPlayerIds = new Set((memberships ?? []).map(m => m.player_id))

  // 7. Reject any submitted player ID not in the valid roster
  for (const update of input.attendanceUpdates) {
    if (!validPlayerIds.has(update.playerId)) {
      return { ok: false, error: 'Invalid player ID submitted.' }
    }
  }

  // 8. Validate statuses server-side (DB also enforces via CHECK constraint)
  const validStatuses = new Set(['present', 'absent', 'late', 'excused'])
  for (const update of input.attendanceUpdates) {
    if (!validStatuses.has(update.status)) {
      return { ok: false, error: `Invalid attendance status: ${update.status}` }
    }
  }

  // 9. Upsert attendance records sequentially (per AI_BACKEND_RULES #5)
  //    UNIQUE(session_id, player_id) ensures safe upsert — updates existing, inserts new.
  //    Never touches templates, player profiles, or development priorities.
  const now = new Date().toISOString()
  for (const update of input.attendanceUpdates) {
    const { error: upsertError } = await supabase
      .from('session_attendance')
      .upsert(
        {
          session_id: input.sessionId,
          player_id: update.playerId,
          status: update.status,
          marked_by: user.id,
          marked_at: now,
        },
        { onConflict: 'session_id,player_id' }
      )

    if (upsertError) {
      return { ok: false, error: `Failed to save attendance: ${upsertError.message}` }
    }
  }

  return { ok: true, error: null }
}
