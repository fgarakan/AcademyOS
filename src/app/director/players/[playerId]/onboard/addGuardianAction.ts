'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface AddGuardianInput {
  playerId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  relationship: string
}

export interface AddGuardianResult {
  ok: boolean
  guardianId: string | null
  error: string | null
}

export async function addGuardianAction(
  input: AddGuardianInput,
): Promise<AddGuardianResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, guardianId: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, guardianId: null, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, guardianId: null, error: 'Not authorised' }
  }

  // Verify player belongs to this academy
  const { data: playerCheck } = await supabase
    .from('players')
    .select('id')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .maybeSingle()
  if (!playerCheck) return { ok: false, guardianId: null, error: 'Player not found in this academy' }

  // Insert guardian
  const { data: guardian, error: guardianError } = await supabase
    .from('guardians')
    .insert({
      academy_id: academyId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      relationship: input.relationship || 'parent',
      is_primary: true,
    })
    .select('id')
    .single()

  if (guardianError || !guardian) {
    return { ok: false, guardianId: null, error: guardianError?.message ?? 'Failed to add guardian' }
  }

  // Link to player
  const { error: linkError } = await supabase
    .from('player_guardians')
    .insert({ guardian_id: guardian.id, player_id: input.playerId })

  if (linkError) {
    return { ok: false, guardianId: null, error: linkError.message ?? 'Failed to link guardian to player' }
  }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: membership.role as UserRole,
    action: 'guardian_added',
    targetType: 'guardians',
    targetId: guardian.id,
    targetLabel: `${input.firstName} ${input.lastName}`,
    payload: {
      player_id: input.playerId,
      guardian_id: guardian.id,
      relationship: input.relationship,
      has_email: !!input.email,
      has_phone: !!input.phone,
    },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${input.playerId}/onboard`)
  revalidatePath(`/director/players/${input.playerId}`)

  return { ok: true, guardianId: guardian.id, error: null }
}
