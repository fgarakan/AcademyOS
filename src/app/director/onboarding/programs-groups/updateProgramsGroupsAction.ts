'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateProgramsGroupsResult {
  ok: boolean
  error: string | null
}

const VALID_PROGRAM_STRUCTURES = [
  'single_program',
  'multiple_programs',
  'age_banded',
  'level_banded',
] as const

const VALID_GROUP_STRUCTURES = [
  'level_based',
  'age_and_level_based',
  'mixed_level',
  'flexible',
] as const

const VALID_NAMING_CONVENTIONS = [
  'ball_color_level',
  'age_level',
  'performance_track',
  'custom',
] as const

export async function updateProgramsGroupsAction(
  programStructure: string,
  groupStructure: string,
  namingConvention: string,
  notes: string,
): Promise<UpdateProgramsGroupsResult> {
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
    return { ok: false, error: 'Only academy directors can update programs and groups setup' }
  }

  if (!(VALID_PROGRAM_STRUCTURES as readonly string[]).includes(programStructure)) {
    return { ok: false, error: 'Invalid program structure' }
  }
  if (!(VALID_GROUP_STRUCTURES as readonly string[]).includes(groupStructure)) {
    return { ok: false, error: 'Invalid group structure' }
  }
  if (!(VALID_NAMING_CONVENTIONS as readonly string[]).includes(namingConvention)) {
    return { ok: false, error: 'Invalid naming convention' }
  }

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  const merged = {
    ...existing,
    programs_groups: {
      program_structure: programStructure,
      group_structure: groupStructure,
      naming_convention: namingConvention,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    },
    programs_groups_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'programs_groups',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save programs and groups setup' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/programs-groups')
  revalidatePath('/director')
  return { ok: true, error: null }
}
