'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateAcademySettingsResult {
  ok: boolean
  error: string | null
}

export async function updateAcademySettingsAction(
  name: string,
  country: string,
  timezone: string,
  logoUrl: string,
  website: string,
  description: string,
): Promise<UpdateAcademySettingsResult> {
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
    return { ok: false, error: 'Only academy directors can update academy settings' }
  }

  const trimmedName = name.trim()
  if (!trimmedName) return { ok: false, error: 'Academy name is required' }

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
    logo_url: logoUrl.trim() || null,
    website: website.trim() || null,
    description: description.trim() || null,
    academy_identity_completed: true,
    academy_identity_updated_at: new Date().toISOString(),
  }

  const { error } = await rawDb
    .from('academies')
    .update({
      name: trimmedName,
      country: country.trim() || null,
      timezone: timezone.trim() || 'UTC',
      settings: merged,
    })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save settings' }

  revalidatePath('/director')
  revalidatePath('/director/settings')
  return { ok: true, error: null }
}
