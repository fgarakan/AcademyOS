'use server'

// Mega Sprint 1096-1100 — Coach Invitation Loop V1
// Mega Sprint 1101-1110 — Phase 4 edge-case hardening
//
// Flow:
//   Director/head_coach → invite by email → look up existing profile
//   → create academy_memberships row → write audit log
//
// Edge cases handled in V2:
//   - Email length cap (RFC 5321: max 254 chars)
//   - Cannot assign academy_director role via this flow
//   - Self-invite rejected
//   - Inactive target profile rejected
//   - Same email + different role → update role on existing active membership

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ALLOWED_COACH_ROLES: UserRole[] = ['head_coach', 'coach']
const INVITER_ROLES: UserRole[] = ['academy_director', 'head_coach']
const EMAIL_MAX_LENGTH = 254

export interface InviteCoachInput {
  email: string
  role: 'coach' | 'head_coach'
}

export interface InviteCoachResult {
  ok: boolean
  error: string | null
  outcome?: 'linked' | 'already_member' | 'role_updated' | 'no_account'
  coachProfileId?: string | null
}

export async function inviteCoachAction(
  input: InviteCoachInput,
): Promise<InviteCoachResult> {
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

  // 3. Verify inviter role
  const { data: inviterMembership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const inviterRole = inviterMembership?.role as UserRole | undefined
  if (!inviterRole || !INVITER_ROLES.includes(inviterRole)) {
    return { ok: false, error: 'Only academy directors or head coaches can invite coaches' }
  }

  // 4. Reject academy_director role via this flow
  if (input.role === ('academy_director' as UserRole)) {
    return { ok: false, error: 'Academy directors cannot be assigned via the coach invite flow.' }
  }
  if (!ALLOWED_COACH_ROLES.includes(input.role as UserRole)) {
    return { ok: false, error: 'Invalid role. Must be coach or head_coach.' }
  }

  // 5. Sanitize and validate email
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'A valid email address is required' }
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return { ok: false, error: `Email exceeds the maximum allowed length of ${EMAIL_MAX_LENGTH} characters.` }
  }

  // 6. Self-invite check
  const { data: selfProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (selfProfile?.email?.toLowerCase() === email) {
    return { ok: false, error: 'You cannot invite yourself. Use account settings to update your own role.' }
  }

  // 7. Look up existing profile by email
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('id, display_name, email, is_active')
    .eq('email', email)
    .maybeSingle()

  if (!coachProfile) {
    return {
      ok: false,
      error: `No account found for ${email}. Ask the coach to create an account at the login page first, then run this action again.`,
      outcome: 'no_account',
    }
  }

  // 8. Inactive profile check
  if (coachProfile.is_active === false) {
    return {
      ok: false,
      error: `The account for ${email} is currently inactive. The coach must reactivate their account before being added to this academy.`,
    }
  }

  const coachProfileId = coachProfile.id

  // 9. Check for existing membership
  const { data: existing } = await supabase
    .from('academy_memberships')
    .select('id, role, is_active')
    .eq('academy_id', academyId)
    .eq('profile_id', coachProfileId)
    .maybeSingle()

  const rawDb = supabase as any

  if (existing?.is_active) {
    if (existing.role === input.role) {
      return { ok: true, error: null, outcome: 'already_member', coachProfileId }
    }

    // Different role — update
    const { error: roleUpdateError } = await rawDb
      .from('academy_memberships')
      .update({ role: input.role, granted_by: user.id })
      .eq('id', existing.id)

    if (roleUpdateError) {
      return { ok: false, error: roleUpdateError.message ?? 'Failed to update membership role' }
    }

    await writeAuditLog({
      db: supabase,
      academyId,
      actorId: user.id,
      actorRole: inviterRole,
      action: 'coach_role_updated',
      targetType: 'academy_memberships',
      targetId: coachProfileId,
      targetLabel: coachProfile.display_name ?? email,
      payload: { coach_email: email, previous_role: existing.role, new_role: input.role },
      sourceType: 'ui',
    })

    revalidatePath('/director/coaches')
    revalidatePath('/director')
    return { ok: true, error: null, outcome: 'role_updated', coachProfileId }
  }

  // 10. Create or reactivate membership
  if (existing && !existing.is_active) {
    const { error: updateError } = await rawDb
      .from('academy_memberships')
      .update({ role: input.role, is_active: true, granted_by: user.id })
      .eq('id', existing.id)
    if (updateError) return { ok: false, error: updateError.message ?? 'Failed to reactivate membership' }
  } else {
    const { error: insertError } = await supabase
      .from('academy_memberships')
      .insert({
        academy_id: academyId,
        profile_id: coachProfileId,
        role:       input.role as UserRole,
        is_active:  true,
        granted_by: user.id,
      })
    if (insertError) return { ok: false, error: insertError.message ?? 'Failed to create membership' }
  }

  // 11. Audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: inviterRole,
    action: 'coach_invited',
    targetType: 'academy_memberships',
    targetId: coachProfileId,
    targetLabel: coachProfile.display_name ?? email,
    payload: {
      coach_email: email,
      assigned_role: input.role,
      action_taken: existing ? 'reactivated' : 'created',
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/coaches')
  revalidatePath('/director')

  return { ok: true, error: null, outcome: 'linked', coachProfileId }
}
