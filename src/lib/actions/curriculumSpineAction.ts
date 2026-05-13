'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { CurriculumSetupState } from '@/lib/curriculum/curriculumSetupTypes'
import { isRequiredSetupComplete } from '@/lib/curriculum/curriculumSetupTypes'

export interface SaveCurriculumSpineResult {
  ok: boolean
  error: string | null
}

export async function saveCurriculumSpineAction(
  patch: Partial<CurriculumSetupState>,
): Promise<SaveCurriculumSpineResult> {
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
    return { ok: false, error: 'Only academy directors can update curriculum setup' }
  }

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}
  const existingV2 = (existing.curriculum_setup_v2 as Record<string, unknown>) ?? {}

  const updatedV2 = {
    ...existingV2,
    ...patch,
    updated_at: new Date().toISOString(),
  }

  const isComplete = isRequiredSetupComplete(updatedV2 as CurriculumSetupState)

  const merged: Record<string, unknown> = {
    ...existing,
    curriculum_setup_v2: updatedV2,
  }

  // Keep the legacy onboarding hub completion key in sync
  if (isComplete) {
    merged.curriculum_setup_completed = true
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save curriculum setup' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/curriculum')
  revalidatePath('/director/curriculum/builder')
  return { ok: true, error: null }
}
