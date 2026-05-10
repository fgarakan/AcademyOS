'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateLevelGatesResult {
  ok: boolean
  error: string | null
}

const VALID_APPROVAL_MODELS = [
  'coach_recommend_director_approve',
  'director_only',
  'coach_and_director',
] as const

const VALID_EVIDENCE_OPTIONS = [
  'skill_assessment',
  'coach_observations',
  'session_performance',
  'match_competition_behavior',
  'attendance_consistency',
  'fitness_readiness',
  'home_practice_or_app_work',
] as const

const VALID_PORTAL_VISIBILITY = [
  'show_simple_requirements',
  'show_progress_only',
  'internal_only',
] as const

export async function updateLevelGatesAction(
  approvalModel: string,
  evidenceRequired: string[],
  portalVisibility: string,
  notes: string,
): Promise<UpdateLevelGatesResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return { ok: false, error: 'Only academy directors can update level gate rules' }
  }

  if (!(VALID_APPROVAL_MODELS as readonly string[]).includes(approvalModel)) {
    return { ok: false, error: 'Invalid approval model' }
  }
  if (!(VALID_PORTAL_VISIBILITY as readonly string[]).includes(portalVisibility)) {
    return { ok: false, error: 'Invalid portal visibility option' }
  }
  const validEvidence = VALID_EVIDENCE_OPTIONS as readonly string[]
  const sanitizedEvidence = evidenceRequired.filter(e => validEvidence.includes(e))

  const rawDb = supabase as any

  // Fetch current settings to merge — never overwrite the full object
  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  const merged = {
    ...existing,
    level_gates: {
      approval_model: approvalModel,
      evidence_required: sanitizedEvidence,
      portal_visibility: portalVisibility,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    },
    level_gates_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'level_gates',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save level gate rules' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/level-gates')
  revalidatePath('/director')
  return { ok: true, error: null }
}
