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
