'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export async function setCurriculumLevelAction(
  templateId: string,
  curriculumLevelId: string | null,
): Promise<{ error: string | null }> {
  try { await assertNotPreviewMode() } catch { return { error: 'Writes are disabled in preview mode.' } }

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (!templateId) return { error: 'Template ID required.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { error: 'You do not have permission to update this template.' }
  }

  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { error: 'Template not found or access denied.' }

  if (curriculumLevelId) {
    const { data: level } = await rawDb
      .from('curriculum_levels')
      .select('id')
      .eq('id', curriculumLevelId)
      .single()
    if (!level) return { error: 'Selected curriculum level does not exist.' }
  }

  const { error: updateError } = await rawDb
    .from('templates')
    .update({ curriculum_level_id: curriculumLevelId })
    .eq('id', templateId)
    .eq('academy_id', academyId)

  if (updateError) return { error: `Failed to update curriculum level: ${updateError.message}` }

  revalidatePath(`/director/class-templates/${templateId}`)
  revalidatePath('/director/class-templates')
  return { error: null }
}
