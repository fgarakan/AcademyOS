'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface BatchActionResult {
  ok: boolean
  dismissed: number
  error: string | null
}

export async function batchDismissVoiceIntakeAction(
  ids: string[]
): Promise<BatchActionResult> {
  await assertNotPreviewMode()
  if (!ids.length) return { ok: false, dismissed: 0, error: 'No items selected.' }
  if (ids.length > 50) return { ok: false, dismissed: 0, error: 'Too many items selected (max 50).' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, dismissed: 0, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, dismissed: 0, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, dismissed: 0, error: 'Insufficient permissions.' }
  }

  const rawDb = supabase as any
  const { error, count } = await rawDb
    .from('proposed_actions')
    .update({ status: 'dismissed' })
    .eq('academy_id', profile.academy_id)
    .eq('target_module', 'voice_intake')
    .eq('status', 'pending_review')
    .in('id', ids)
    .select('id', { count: 'exact', head: true })

  if (error) return { ok: false, dismissed: 0, error: error.message }

  revalidatePath('/director/review')
  return { ok: true, dismissed: count ?? ids.length, error: null }
}

export async function batchDismissCapturesAction(
  ids: string[]
): Promise<BatchActionResult> {
  await assertNotPreviewMode()
  if (!ids.length) return { ok: false, dismissed: 0, error: 'No items selected.' }
  if (ids.length > 50) return { ok: false, dismissed: 0, error: 'Too many items selected (max 50).' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, dismissed: 0, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, dismissed: 0, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, dismissed: 0, error: 'Insufficient permissions.' }
  }

  const { error } = await supabase
    .from('voice_notes')
    .update({ processing_status: 'dismissed' })
    .eq('academy_id', profile.academy_id)
    .eq('processing_status', 'pending_review')
    .in('id', ids)

  if (error) return { ok: false, dismissed: 0, error: error.message }

  revalidatePath('/director/review')
  return { ok: true, dismissed: ids.length, error: null }
}
