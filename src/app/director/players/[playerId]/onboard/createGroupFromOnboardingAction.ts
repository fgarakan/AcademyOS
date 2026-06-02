'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface CreateGroupResult {
  ok: boolean
  group: { id: string; name: string; track: string | null } | null
  error: string | null
}

export async function createGroupFromOnboardingAction(
  name: string,
): Promise<CreateGroupResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, group: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, group: null, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, group: null, error: 'Not authorised' }
  }

  const trimmedName = name.trim()
  if (!trimmedName) return { ok: false, group: null, error: 'Group name is required' }

  const { data: inserted, error: insertError } = await supabase
    .from('groups')
    .insert({ academy_id: academyId, name: trimmedName, is_active: true })
    .select('id, name, track')
    .single()

  if (insertError || !inserted) {
    return { ok: false, group: null, error: insertError?.message ?? 'Failed to create group' }
  }

  revalidatePath('/director/players')
  revalidatePath('/director/groups')

  return {
    ok: true,
    group: { id: inserted.id, name: inserted.name, track: inserted.track as string | null },
    error: null,
  }
}
