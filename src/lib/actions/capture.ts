'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export async function saveGeneralCaptureAction(
  academyId: string,
  content: string
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = content?.trim()
  if (!trimmed) throw new Error('Capture content is required')

  const { error } = await supabase
    .from('voice_notes')
    .insert({
      academy_id: academyId,
      author_id: user.id,
      player_id: null,
      session_id: null,
      raw_input: trimmed,
      transcript: trimmed,
      audio_path: null,
      processing_status: 'pending_review',
    })

  if (error) throw error

  revalidatePath('/director/review')
}

export async function routeGeneralCaptureToPlayerAction(
  captureId: string,
  academyId: string,
  playerId: string
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify director or head_coach membership in this academy
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    throw new Error('Director or head coach role required')
  }

  // Fetch capture — must be unrouted and owned by this academy
  const { data: capture } = await supabase
    .from('voice_notes')
    .select('id, raw_input, transcript')
    .eq('id', captureId)
    .eq('academy_id', academyId)
    .is('player_id', null)
    .eq('processing_status', 'pending_review')
    .single()

  if (!capture) throw new Error('Capture not found or already routed')

  // Verify player belongs to this academy and is active
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .single()

  if (!player) throw new Error('Player not found in this academy')

  // Create internal coach_observation — is_private: true, never parent/player-facing
  const content = (capture.transcript ?? capture.raw_input).trim()

  const { data: observation, error: obsError } = await supabase
    .from('coach_observations')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      coach_id: user.id,
      observation_type: 'general',
      content,
      is_private: true,
    })
    .select('id')
    .single()

  if (obsError) throw obsError
  if (!observation) throw new Error('Failed to create observation')

  // Link voice_note to the player and mark as routed
  const { error: updateError } = await supabase
    .from('voice_notes')
    .update({
      player_id: playerId,
      processing_status: 'routed',
      parsed_observation_id: observation.id,
    })
    .eq('id', captureId)
    .eq('academy_id', academyId)

  if (updateError) throw updateError

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${playerId}`)
}

export async function dismissGeneralCaptureAction(
  captureId: string,
  academyId: string
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('voice_notes')
    .update({ processing_status: 'dismissed' })
    .eq('id', captureId)
    .eq('academy_id', academyId)

  if (error) throw error

  revalidatePath('/director/review')
}
