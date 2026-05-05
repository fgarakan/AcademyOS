'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

async function assertDirectorOrHeadCoach(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) return null
  return user
}

export interface LinkGuardianInput {
  playerId: string
  academyId: string
  firstName: string
  lastName: string
  email: string
  relationship: string
}

export interface LinkGuardianResult {
  ok: boolean
  error?: string
  guardianId?: string
}

export async function linkGuardianToPlayerAction(
  input: LinkGuardianInput,
): Promise<LinkGuardianResult> {
  const { playerId, academyId, firstName, lastName, email, relationship } = input

  if (!firstName.trim() || !lastName.trim()) {
    return { ok: false, error: 'First and last name are required.' }
  }

  const supabase = await getSupabaseServer()
  const user = await assertDirectorOrHeadCoach(supabase, academyId)
  if (!user) return { ok: false, error: 'Insufficient permissions.' }

  const rawDb = supabase as any

  // Verify player belongs to this academy
  const { data: playerRow } = await rawDb
    .from('players')
    .select('id, academy_id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!playerRow) return { ok: false, error: 'Player not found in this academy.' }

  // Find existing guardian in this academy with matching email (if email provided)
  let guardianId: string | null = null
  if (email.trim()) {
    const { data: existingGuardian } = await rawDb
      .from('guardians')
      .select('id')
      .eq('academy_id', academyId)
      .eq('email', email.trim().toLowerCase())
      .limit(1)
    if (existingGuardian?.[0]) {
      guardianId = existingGuardian[0].id
    }
  }

  // Create guardian if not found
  if (!guardianId) {
    const { data: newGuardian, error: createErr } = await rawDb
      .from('guardians')
      .insert({
        academy_id: academyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase() || null,
        relationship: relationship.trim() || 'parent',
        is_primary: false,
      })
      .select('id')
      .single()

    if (createErr || !newGuardian) {
      return { ok: false, error: createErr?.message ?? 'Failed to create guardian record.' }
    }
    guardianId = newGuardian.id
  }

  // Check for existing link
  const { data: existingLink } = await rawDb
    .from('player_guardians')
    .select('player_id')
    .eq('player_id', playerId)
    .eq('guardian_id', guardianId)
    .limit(1)
  if (existingLink?.[0]) {
    return { ok: false, error: 'This guardian is already linked to this player.' }
  }

  // Create player_guardians link
  const { error: linkErr } = await rawDb
    .from('player_guardians')
    .insert({ player_id: playerId, guardian_id: guardianId as string })

  if (linkErr) return { ok: false, error: linkErr.message ?? 'Failed to link guardian.' }

  revalidatePath(`/director/players/${playerId}`)
  return { ok: true, guardianId: guardianId ?? undefined }
}

export async function unlinkGuardianFromPlayerAction(
  playerId: string,
  guardianId: string,
  academyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseServer()
  const user = await assertDirectorOrHeadCoach(supabase, academyId)
  if (!user) return { ok: false, error: 'Insufficient permissions.' }

  const rawDb = supabase as any

  // Verify guardian belongs to this academy before unlinking
  const { data: guardian } = await rawDb
    .from('guardians')
    .select('id, academy_id')
    .eq('id', guardianId)
    .eq('academy_id', academyId)
    .single()
  if (!guardian) return { ok: false, error: 'Guardian not found in this academy.' }

  const { error } = await rawDb
    .from('player_guardians')
    .delete()
    .eq('player_id', playerId)
    .eq('guardian_id', guardianId)

  if (error) return { ok: false, error: error.message ?? 'Failed to unlink guardian.' }

  revalidatePath(`/director/players/${playerId}`)
  return { ok: true }
}
