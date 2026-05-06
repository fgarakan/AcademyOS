'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function resolveDirectorContext() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rawDb = supabase as any
  const { data: membership } = await rawDb
    .from('academy_memberships')
    .select('academy_id, role')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) throw new Error('No active academy membership')
  if (!['academy_director', 'head_coach'].includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  return { rawDb, academyId: membership.academy_id as string }
}

export async function linkPlayerPortalAction(
  playerId: string,
  email: string,
): Promise<{ ok: boolean; error?: string; profileId?: string }> {
  try {
    const { rawDb, academyId } = await resolveDirectorContext()

    // Verify player belongs to this academy
    const { data: playerRow } = await rawDb
      .from('players')
      .select('id, academy_id')
      .eq('id', playerId)
      .eq('academy_id', academyId)
      .single()

    if (!playerRow) return { ok: false, error: 'Player not found in this academy.' }

    // Find profile by email within this academy
    const { data: profiles } = await rawDb
      .from('profiles')
      .select('id, display_name, email')
      .eq('academy_id', academyId)
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (!profiles || profiles.length === 0) {
      return { ok: false, error: 'No user account found with that email in this academy. The player must sign up first.' }
    }

    const profile = profiles[0]

    // Set players.profile_id — controls player portal access
    const { error } = await rawDb
      .from('players')
      .update({ profile_id: profile.id, updated_at: new Date().toISOString() })
      .eq('id', playerId)
      .eq('academy_id', academyId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/director/players/${playerId}`)
    return { ok: true, profileId: profile.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function unlinkPlayerPortalAction(
  playerId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { rawDb, academyId } = await resolveDirectorContext()

    const { error } = await rawDb
      .from('players')
      .update({ profile_id: null, updated_at: new Date().toISOString() })
      .eq('id', playerId)
      .eq('academy_id', academyId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/director/players/${playerId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
