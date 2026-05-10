'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateCurriculumStarterResult {
  ok: boolean
  error: string | null
}

export async function updateCurriculumStarterAction(
  starterOption: string,
  notes: string,
): Promise<UpdateCurriculumStarterResult> {
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

  const VALID_OPTIONS = [
    'academy_os_starter',
    'customize_starter',
    'upload_existing_later',
    'blank_structure',
  ]
  if (!VALID_OPTIONS.includes(starterOption)) {
    return { ok: false, error: 'Invalid curriculum starter option' }
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
    curriculum_setup: {
      starter_option: starterOption,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    },
    curriculum_setup_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'curriculum_setup',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save curriculum setup' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/curriculum')
  revalidatePath('/director')
  return { ok: true, error: null }
}
