'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface SaveSessionVoiceNoteResult {
  ok: boolean
  error: string | null
  voiceNoteId: string | null
}

export async function saveSessionVoiceNoteAction(
  sessionId: string,
  rawInput: string
): Promise<SaveSessionVoiceNoteResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', voiceNoteId: null }

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', voiceNoteId: null }
  const academyId = profile.academy_id

  // 3. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.', voiceNoteId: null }

  // 4. Verify user has coach-level or director-level role in this academy
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach', 'coach'])
    .single()
  if (!membership) return { ok: false, error: 'Not authorized to save session recaps.', voiceNoteId: null }

  // 5. Insert voice_note for the session
  //    player_id is null — this is a session-level recap, not a player note
  //    processing_status 'pending' — marks it for optional structuring via StructureRecapButton
  const { data: voiceNote, error: insertError } = await supabase
    .from('voice_notes')
    .insert({
      academy_id: academyId,
      author_id: user.id,
      session_id: sessionId,
      player_id: null,
      raw_input: rawInput.trim(),
      transcript: rawInput.trim(),
      processing_status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !voiceNote) {
    return {
      ok: false,
      error: `Failed to save recap: ${insertError?.message ?? 'unknown'}`,
      voiceNoteId: null,
    }
  }

  return { ok: true, error: null, voiceNoteId: voiceNote.id }
}
