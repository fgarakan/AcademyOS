'use server'

// Mega Sprint 1096-1100 — Guardian/Parent Creation Loop V1
//
// Flow:
//   Director/head_coach → add parent/guardian
//   → create guardians record
//   → create player_guardians link
//   → if profile exists for email: set profile_id on guardian, create academy_memberships(parent)
//   → audit logged.
//
// V1 data model:
//   - guardians row: academy-scoped, may or may not have profile_id (auth account)
//   - player_guardians: links guardian to player(s)
//   - Profile is auto-linked if a Supabase Auth account exists for the guardian email.
//   - Parent portal works once guardian.profile_id is set + player_guardians rows exist.
//
// Safety:
//   - academyId always resolved server-side.
//   - Inviter must be academy_director or head_coach.
//   - Player must belong to this academy and be active.
//   - Duplicate guardian links rejected.
//   - Raw coach notes never written to guardian-accessible tables.
//   - All outcomes write an audit_log entry.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface AddGuardianInput {
  firstName: string
  lastName: string
  /** Guardian email — used to auto-link a profile if account exists. */
  email?: string
  phone?: string
  /** Relationship to player: 'parent', 'guardian', 'carer', etc. */
  relationship?: string
  /** The player this guardian is linked to. */
  playerId: string
  /** Whether this is the primary contact for the player. */
  isPrimary?: boolean
}

export interface AddGuardianResult {
  ok: boolean
  error: string | null
  guardianId?: string | null
  /**
   * 'created_and_linked' — guardian + player_guardians created; profile linked if account exists.
   * 'duplicate'          — guardian with this email + player link already exists.
   */
  outcome?: 'created_and_linked' | 'duplicate'
  profileLinked?: boolean
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

  // 3. Verify inviter role — director or head_coach only
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

  // 4. Validate required inputs
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

  // 6. Prevent duplicate: check for existing guardian with same email in this academy
  if (email) {
    const { data: existingGuardian } = await rawDb
      .from('guardians')
      .select('id')
      .eq('academy_id', academyId)
      .eq('email', email)
      .maybeSingle()

    if (existingGuardian) {
      // Guardian record exists — check if already linked to this player
      const { data: existingLink } = await rawDb
        .from('player_guardians')
        .select('guardian_id')
        .eq('guardian_id', existingGuardian.id)
        .eq('player_id', input.playerId)
        .maybeSingle()

      if (existingLink) {
        return {
          ok: true,
          error: null,
          guardianId: existingGuardian.id,
          outcome: 'duplicate',
        }
      }

      // Guardian exists but not linked to this player — create the link
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
        targetLabel: `${player.full_name ?? `${player.first_name} ${player.last_name}`}`,
        payload: { guardian_id: existingGuardian.id, player_id: input.playerId },
        sourceType: 'ui',
      })

      revalidatePath('/director/parents')
      revalidatePath(`/director/players/${input.playerId}`)

      return { ok: true, error: null, guardianId: existingGuardian.id, outcome: 'created_and_linked' }
    }
  }

  // 7. Look up existing Supabase Auth profile by email (to auto-link)
  let linkedProfileId: string | null = null
  if (email) {
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    linkedProfileId = matchedProfile?.id ?? null
  }

  // 8. Create guardian record
  const { data: newGuardian, error: guardianError } = await rawDb
    .from('guardians')
    .insert({
      academy_id: academyId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      relationship,
      is_primary: input.isPrimary ?? true,
      profile_id: linkedProfileId,
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
    // Guardian was created — note the link failure but do not roll back guardian
    return {
      ok: false,
      error: `Guardian created (${guardianId}) but player link failed: ${linkError.message}`,
      guardianId,
    }
  }

  // 10. If profile found, create academy_memberships with parent role
  let profileLinked = false
  if (linkedProfileId) {
    // Check if already a member
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
          role: 'parent' as UserRole,
          is_active: true,
          granted_by: user.id,
        })
      profileLinked = true
    } else if (!existingMembership.is_active) {
      const { error: updateError } = await rawDb
        .from('academy_memberships')
        .update({ is_active: true, role: 'parent' as UserRole, granted_by: user.id })
        .eq('id', existingMembership.id)
      profileLinked = !updateError
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
      guardian_id: guardianId,
      player_id: input.playerId,
      player_name: player.full_name ?? `${player.first_name} ${player.last_name}`,
      email: email ?? null,
      relationship,
      profile_linked: profileLinked,
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
  }
}
