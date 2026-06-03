'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface QuickAssessmentInput {
  playerId: string
  technical: number | null   // 1–4
  tactical: number | null
  movement: number | null
  competition: number | null
  behavioral: number | null
  note: string | null
}

export interface QuickAssessmentResult {
  ok: boolean
  assessmentId: string | null
  error: string | null
}

const RATING_TO_SCORE: Record<number, number> = { 1: 2.5, 2: 5.0, 3: 7.5, 4: 10.0 }

function toScore(rating: number | null): number | null {
  if (rating === null) return null
  return RATING_TO_SCORE[rating] ?? null
}

export async function quickAssessmentAction(
  input: QuickAssessmentInput
): Promise<QuickAssessmentResult> {
  await assertNotPreviewMode()

  if (!input.playerId) return { ok: false, assessmentId: null, error: 'Missing player ID.' }

  const hasSomeRating =
    input.technical !== null || input.tactical !== null ||
    input.movement !== null || input.competition !== null || input.behavioral !== null

  if (!hasSomeRating) {
    return { ok: false, assessmentId: null, error: 'Rate at least one domain before saving.' }
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, assessmentId: null, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, assessmentId: null, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, assessmentId: null, error: 'Director or Head Coach required.' }
  }

  // Verify player belongs to this academy
  const { data: playerCheck } = await supabase
    .from('players')
    .select('id')
    .eq('id', input.playerId)
    .eq('academy_id', profile.academy_id)
    .maybeSingle()

  if (!playerCheck) {
    return { ok: false, assessmentId: null, error: 'Player not found in your academy.' }
  }

  const rawDb = supabase as any
  const today = new Date().toISOString().split('T')[0]

  const { data: inserted, error } = await rawDb
    .from('assessments')
    .insert({
      academy_id: profile.academy_id,
      player_id: input.playerId,
      assessed_by: user.id,
      assessed_date: today,
      type: 'ad_hoc',
      is_baseline: false,
      promotion_ready: false,
      technical_score: toScore(input.technical),
      tactical_score: toScore(input.tactical),
      movement_score: toScore(input.movement),
      competition_score: toScore(input.competition),
      behavioral_score: toScore(input.behavioral),
      notes: input.note?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, assessmentId: null, error: error.message }

  revalidatePath(`/director/players/${input.playerId}`)
  return { ok: true, assessmentId: inserted?.id ?? null, error: null }
}
