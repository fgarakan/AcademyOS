'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateDirectorInterviewResult {
  ok: boolean
  error: string | null
}

export async function updateDirectorInterviewAction(
  philosophy: string,
  playerFocus: string,
  developmentPriorities: string,
  competitionApproach: string,
  parentCommunicationStyle: string,
  coachOperatingStyle: string,
  ninetyDaySuccess: string,
): Promise<UpdateDirectorInterviewResult> {
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
    return { ok: false, error: 'Only academy directors can update the director interview' }
  }

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
    director_interview: {
      philosophy: philosophy.trim(),
      player_focus: playerFocus.trim(),
      development_priorities: developmentPriorities.trim(),
      competition_approach: competitionApproach.trim(),
      parent_communication_style: parentCommunicationStyle.trim(),
      coach_operating_style: coachOperatingStyle.trim(),
      ninety_day_success: ninetyDaySuccess.trim(),
      updated_at: new Date().toISOString(),
    },
    director_interview_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'director_interview',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save director interview' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/interview')
  revalidatePath('/director')
  return { ok: true, error: null }
}
