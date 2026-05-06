'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createCoachObservation, upsertPlayerDevelopmentSummary, createVoiceNoteWithObservation } from '@/lib/backend/notes'
import { structureCoachNote } from '@/lib/ai/structureCoachNote'
import type { AIDraftResult } from '@/lib/ai/structureCoachNote'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export async function addObservationAction(
  playerId: string,
  academyId: string,
  formData: FormData
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const content = (formData.get('content') as string | null)?.trim()
  const observation_type = formData.get('observation_type') as string | null
  const is_private = formData.get('is_private') === 'true'

  if (!content) throw new Error('Observation content is required')
  if (!observation_type) throw new Error('Observation type is required')

  await createCoachObservation(supabase, {
    academy_id: academyId,
    player_id: playerId,
    coach_id: user.id,
    observation_type,
    content,
    is_private,
  })

  revalidatePath(`/director/players/${playerId}`)
}

export async function updateDevelopmentSummaryAction(
  playerId: string,
  academyId: string,
  formData: FormData
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const strengthsRaw = formData.get('current_strengths') as string | null
  const workOnRaw = formData.get('things_to_work_on') as string | null
  const development_focus = (formData.get('development_focus') as string | null)?.trim() || null
  const coach_summary = (formData.get('coach_summary') as string | null)?.trim() || null
  const student_friendly_summary =
    (formData.get('student_friendly_summary') as string | null)?.trim() || null
  const show_to_student = formData.get('show_to_student') === 'true'
  const show_to_parent = formData.get('show_to_parent') === 'true'

  const current_strengths = strengthsRaw
    ? strengthsRaw.split('\n').map(s => s.trim()).filter(Boolean)
    : []
  const things_to_work_on = workOnRaw
    ? workOnRaw.split('\n').map(s => s.trim()).filter(Boolean)
    : []

  await upsertPlayerDevelopmentSummary(supabase, {
    academy_id: academyId,
    player_id: playerId,
    created_by: user.id,
    updated_by: user.id,
    current_strengths,
    things_to_work_on,
    development_focus,
    coach_summary,
    student_friendly_summary,
    show_to_student,
    show_to_parent,
    source: 'manual',
  })

  revalidatePath(`/director/players/${playerId}`)
}

export type GenerateDraftResult =
  | { ok: true; draft: AIDraftResult }
  | { ok: false; error: string }

export async function generateNoteDraftAction(
  noteText: string
): Promise<GenerateDraftResult> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const trimmed = noteText?.trim()
  if (!trimmed) return { ok: false, error: 'Note text is required.' }

  // Verify caller holds an active staff membership before sending note to external AI.
  // academy_director, head_coach, and coach are the only roles permitted.
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach', 'coach'])
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: 'AI note structuring is only available to academy staff.' }
  }

  try {
    const draft = await structureCoachNote(trimmed)
    return { ok: true, draft }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'AI structuring failed. Please try again.',
    }
  }
}

const VALID_OBSERVATION_TYPES = [
  'general', 'technical', 'tactical', 'movement',
  'competition', 'behavioral', 'injury_concern', 'positive_highlight',
]

export async function addVoiceNoteAction(
  playerId: string,
  academyId: string,
  formData: FormData
): Promise<void> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const transcript = (formData.get('transcript') as string | null)?.trim()
  if (!transcript) throw new Error('Transcript content is required')

  const rawType = formData.get('observation_type') as string | null
  const observation_type = rawType && VALID_OBSERVATION_TYPES.includes(rawType) ? rawType : 'general'
  const is_private = formData.get('is_private') === 'true'

  await createVoiceNoteWithObservation(supabase, {
    academy_id: academyId,
    player_id: playerId,
    author_id: user.id,
    transcript,
    observation_type,
    is_private,
  })

  revalidatePath(`/director/players/${playerId}`)
}
