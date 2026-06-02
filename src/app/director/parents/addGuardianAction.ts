'use server'

// Mega Sprint 1096-1100 — Guardian/Parent Creation Loop V1
// Mega Sprint 1101-1110 — Phase 4 edge-case hardening
//
// Edge cases added:
//   - Max 10 children per guardian (checked before creating player_guardians link)
//   - Inactive linked profile → set profile_id=null, profileLinked=false
//   - linkedChildren field added to result

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

const MAX_CHILDREN_PER_GUARDIAN = 10

export interface AddGuardianInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  relationship?: string
  playerId: string
  isPrimary?: boolean
}

export interface AddGuardianResult {
  ok: boolean
  error: string | null
  guardianId?: string | null
  outcome?: 'created_and_linked' | 'duplicate'
  profileLinked?: boolean
  /** Number of children this guardian is now linked to after the operation. */
  linkedChildren?: number
}

export async function addGuardianAction(
  input: AddGuardianInput,
): Promise<AddGuardianResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // 2. Resolve academy_id server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  // 3. Verify role
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const actorRole = membership?.role as UserRole | undefined
  if (actorRole !== 'academy_director' && actorRole !== 'head_coach') {
    return { ok: false, error: 'Only academy directors or head coaches can add guardians' }
  }

  // 4. Validate inputs
  const firstName = input.firstName?.trim()
  const lastName = input.lastName?.trim()
  if (!firstName) return { ok: false, error: 'First name is required' }
  if (!lastName) return { ok: false, error: 'Last name is required' }
  if (!input.playerId) return { ok: false, error: 'Player ID is required' }

  const email = input.email?.trim().toLowerCase() || null
  const phone = input.phone?.trim() || null
  const relationship = input.relationship?.trim() || 'parent'

  // 5. Verify player belongs to this academy and is active
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .single()

  if (!player) {
    return { ok: false, error: 'Player not found in this academy or is not active' }
  }

  const rawDb = supabase as any

  // 6. Check for existing guardian with same email in this academy
  if (email) {
    const { data: existingGuardian } = await rawDb
      .from('guardians')
      .select('id')
      .eq('academy_id', academyId)
      .eq('email', email)
      .maybeSingle()

    if (existingGuardian) {
      const { data: existingLink } = await rawDb
        .from('player_guardians')
        .select('guardian_id')
        .eq('guardian_id', existingGuardian.id)
        .eq('player_id', input.playerId)
        .maybeSingle()

      if (existingLink) {
        const { count: childCount } = await rawDb
          .from('player_guardians')
          .select('*', { count: 'exact', head: true })
          .eq('guardian_id', existingGuardian.id)

        return {
          ok: true,
          error: null,
          guardianId: existingGuardian.id,
          outcome: 'duplicate',
          linkedChildren: (childCount as number | null) ?? undefined,
        }
      }

      // Guardian exists — enforce max children cap before adding link
      const { count: currentChildCount } = await rawDb
        .from('player_guardians')
        .select('*', { count: 'exact', head: true })
        .eq('guardian_id', existingGuardian.id)

      const currentCount = (currentChildCount as number | null) ?? 0
      if (currentCount >= MAX_CHILDREN_PER_GUARDIAN) {
        return {
          ok: false,
          error: `This guardian is already linked to ${MAX_CHILDREN_PER_GUARDIAN} players (the maximum). Remove an existing link before adding another.`,
          guardianId: existingGuardian.id,
        }
      }

      const { error: linkError } = await rawDb
        .from('player_guardians')
        .insert({ guardian_id: existingGuardian.id, player_id: input.playerId })

      if (linkError) {
        return { ok: false, error: linkError.message ?? 'Failed to link guardian to player' }
      }

      await writeAuditLog({
        db: supabase,
        academyId,
        actorId: user.id,
        actorRole,
        action: 'guardian_player_link_added',
        targetType: 'player_guardians',
        targetId: input.playerId,
        targetLabel: player.full_name ?? `${player.first_name} ${player.last_name}`,
        payload: { guardian_id: existingGuardian.id, player_id: input.playerId },
        sourceType: 'ui',
      })

      revalidatePath('/director/parents')
      revalidatePath(`/director/players/${input.playerId}`)

      return {
        ok: true,
        error: null,
        guardianId: existingGuardian.id,
        outcome: 'created_and_linked',
        linkedChildren: currentCount + 1,
      }
    }
  }

  // 7. Look up profile by email for auto-link
  //    If profile is found but is_active=false, do not link — guardian created without profile_id
  let linkedProfileId: string | null = null
  let profileWasInactive = false
  if (email) {
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (matchedProfile) {
      if (matchedProfile.is_active === false) {
        profileWasInactive = true
        linkedProfileId = null
      } else {
        linkedProfileId = matchedProfile.id
      }
    }
  }

  // 8. Create guardian record
  const { data: newGuardian, error: guardianError } = await rawDb
    .from('guardians')
    .insert({
      academy_id:  academyId,
      first_name:  firstName,
      last_name:   lastName,
      email,
      phone,
      relationship,
      is_primary:  input.isPrimary ?? true,
      profile_id:  linkedProfileId,
    })
    .select('id')
    .single()

  if (guardianError || !newGuardian) {
    return { ok: false, error: guardianError?.message ?? 'Failed to create guardian' }
  }

  const guardianId = newGuardian.id as string

  // 9. Create player_guardians link
  const { error: linkError } = await rawDb
    .from('player_guardians')
    .insert({ guardian_id: guardianId, player_id: input.playerId })

  if (linkError) {
    return {
      ok: false,
      error: `Guardian created (${guardianId}) but player link failed: ${linkError.message}`,
      guardianId,
    }
  }

  // 10. Create academy_memberships(parent) if profile found and active
  let profileLinked = false
  if (linkedProfileId) {
    const { data: existingMembership } = await supabase
      .from('academy_memberships')
      .select('id, is_active')
      .eq('academy_id', academyId)
      .eq('profile_id', linkedProfileId)
      .maybeSingle()

    if (!existingMembership) {
      await supabase
        .from('academy_memberships')
        .insert({
          academy_id: academyId,
          profile_id: linkedProfileId,
          role:       'parent' as UserRole,
          is_active:  true,
          granted_by: user.id,
        })
      profileLinked = true
    } else if (!existingMembership.is_active) {
      const { error: reactivateError } = await rawDb
        .from('academy_memberships')
        .update({ is_active: true, role: 'parent' as UserRole, granted_by: user.id })
        .eq('id', existingMembership.id)
      profileLinked = !reactivateError
    } else {
      profileLinked = true
    }
  }

  // 11. Write audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole,
    action: 'guardian_created',
    targetType: 'guardians',
    targetId: guardianId,
    targetLabel: `${firstName} ${lastName}`,
    payload: {
      guardian_id:         guardianId,
      player_id:           input.playerId,
      player_name:         player.full_name ?? `${player.first_name} ${player.last_name}`,
      email:               email ?? null,
      relationship,
      profile_linked:      profileLinked,
      profile_was_inactive: profileWasInactive,
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/parents')
  revalidatePath(`/director/players/${input.playerId}`)

  return {
    ok: true,
    error: null,
    guardianId,
    outcome: 'created_and_linked',
    profileLinked,
    linkedChildren: 1,
  }
}
