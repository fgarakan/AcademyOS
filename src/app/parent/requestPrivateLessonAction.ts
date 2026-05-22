'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface RequestPrivateLessonInput {
  playerId: string
  playerName: string
  preferredDay: string
  preferredTime: string
  focusArea: string
  additionalNotes: string
}

export interface RequestPrivateLessonResult {
  ok: boolean
  error: string | null
}

export async function requestPrivateLessonAction(
  input: RequestPrivateLessonInput
): Promise<RequestPrivateLessonResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // Validate inputs — parent-facing request, reject blank fields
  const playerId = input.playerId.trim()
  const playerName = input.playerName.trim()
  const preferredDay = input.preferredDay.trim()
  const focusArea = input.focusArea.trim()

  if (!playerId) return { ok: false, error: 'Player ID is required.' }
  if (!playerName) return { ok: false, error: 'Player name is required.' }
  if (!preferredDay) return { ok: false, error: 'Preferred day is required.' }
  if (!focusArea) return { ok: false, error: 'Please describe what to focus on.' }
  if (focusArea.length > 500) return { ok: false, error: 'Focus area is too long (max 500 characters).' }
  if (input.additionalNotes.length > 1000) return { ok: false, error: 'Notes are too long (max 1000 characters).' }

  // Verify this player is linked to the guardian — prevents cross-child request injection
  const rawDb = supabase as any
  const { data: guardian } = await rawDb
    .from('guardians')
    .select('id')
    .eq('profile_id', user.id)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!guardian) return { ok: false, error: 'Guardian account not found.' }

  const { data: pgLink } = await rawDb
    .from('player_guardians')
    .select('player_id')
    .eq('guardian_id', guardian.id)
    .eq('player_id', playerId)
    .maybeSingle()

  if (!pgLink) return { ok: false, error: 'Player not linked to your account.' }

  // Submit as proposed_action — never directly schedule or mutate session data
  const payload = {
    draft_type: 'parent_lesson_request_v1',
    player_id: playerId,
    player_name: playerName,
    preferred_day: preferredDay,
    preferred_time: input.preferredTime.trim() || null,
    focus_area: focusArea,
    additional_notes: input.additionalNotes.trim() || null,
    requested_at: new Date().toISOString(),
  }

  const { error: insertError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      target_module: 'parent_lesson_request',
      target_object_id: playerId,
      status: 'pending_review',
      proposed_payload: payload,
      risk_level: 'low',
    })

  if (insertError) {
    return { ok: false, error: `Failed to submit request: ${insertError.message}` }
  }

  return { ok: true, error: null }
}
