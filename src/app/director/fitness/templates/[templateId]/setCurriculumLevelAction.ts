'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export async function setCurriculumLevelAction(
  templateId: string,
  curriculumLevelId: string | null,
): Promise<{ error: string | null }> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (!templateId) return { error: 'Template ID required.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify role — director or head_coach only
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

  // 4. Verify template belongs to this academy
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { error: 'Template not found or access denied.' }

  // 5. Validate curriculumLevelId if provided (must be a real curriculum_levels row)
  if (curriculumLevelId) {
    const { data: level } = await rawDb
      .from('curriculum_levels')
      .select('id')
      .eq('id', curriculumLevelId)
      .single()
    if (!level) return { error: 'Selected curriculum level does not exist.' }
  }

  // 6. Update curriculum_level_id — NULL clears the selection
  const { error: updateError } = await rawDb
    .from('templates')
    .update({ curriculum_level_id: curriculumLevelId })
    .eq('id', templateId)
    .eq('academy_id', academyId)

  if (updateError) return { error: `Failed to update curriculum level: ${updateError.message}` }

  revalidatePath(`/director/fitness/templates/${templateId}`)
  return { error: null }
}
