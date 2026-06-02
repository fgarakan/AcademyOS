'use server'

// Mega Sprint 1096-1100 — Coach Invitation Loop V1
//
// Flow:
//   Director/head_coach → invite by email → look up existing profile
//   → create academy_memberships row → write audit log
//   → coach can log in and land in coach portal with academy context.
//
// V1 model: links an EXISTING Supabase Auth account by email to this academy.
// If the coach has not yet created an account, the action returns a clear
// "no account found" message so the director can share the registration link.
// No email provider is required. No Supabase Admin API is used.
//
// Safety:
//   - academyId always resolved server-side from authenticated profile.
//   - Inviter must be academy_director or head_coach.
//   - Duplicate active memberships rejected.
//   - Cross-academy writes impossible (academyId is never trusted from client).
//   - All outcomes write an audit_log entry.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ALLOWED_COACH_ROLES: UserRole[] = ['head_coach', 'coach']
const INVITER_ROLES: UserRole[] = ['academy_director', 'head_coach']

export interface InviteCoachInput {
  /** Email of the coach to invite. */
  email: string
  /** Role to assign: coach or head_coach. */
  role: 'coach' | 'head_coach'
}

export interface InviteCoachResult {
  ok: boolean
  error: string | null
  /**
   * 'linked'        — profile found, membership created.
   * 'already_member'— profile found, already an active member with this role.
   * 'no_account'    — no profile found for this email; coach must register first.
   */
  outcome?: 'linked' | 'already_member' | 'no_account'
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

  // 2. Resolve academy_id server-side — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  // 3. Verify inviter role — director or head_coach only
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

  // 4. Validate requested role — only coach or head_coach allowed via this action
  if (!ALLOWED_COACH_ROLES.includes(input.role as UserRole)) {
    return { ok: false, error: 'Invalid role. Must be coach or head_coach.' }
  }

  // 5. Sanitize email
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'A valid email address is required' }
  }

  // 6. Look up an existing profile by email
  //    profiles.email is the auth email. Only finds users who have signed up.
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('id, display_name, email, academy_id')
    .eq('email', email)
    .maybeSingle()

  if (!coachProfile) {
    // No account found — return clear message; never fake a link
    return {
      ok: false,
      error: `No account found for ${email}. Ask the coach to create an account at the login page first, then run this action again.`,
      outcome: 'no_account',
    }
  }

  const coachProfileId = coachProfile.id

  // 7. Check for existing active membership in this academy
  const { data: existing } = await supabase
    .from('academy_memberships')
    .select('id, role, is_active')
    .eq('academy_id', academyId)
    .eq('profile_id', coachProfileId)
    .maybeSingle()

  if (existing?.is_active) {
    return {
      ok: true,
      error: null,
      outcome: 'already_member',
      coachProfileId,
    }
  }

  // 8. Create or reactivate membership
  const rawDb = supabase as any

  if (existing && !existing.is_active) {
    // Reactivate an existing inactive membership and update role
    const { error: updateError } = await rawDb
      .from('academy_memberships')
      .update({
        role: input.role,
        is_active: true,
        granted_by: user.id,
      })
      .eq('id', existing.id)
    if (updateError) {
      return { ok: false, error: updateError.message ?? 'Failed to reactivate membership' }
    }
  } else {
    // New membership
    const { error: insertError } = await supabase
      .from('academy_memberships')
      .insert({
        academy_id: academyId,
        profile_id: coachProfileId,
        role: input.role as UserRole,
        is_active: true,
        granted_by: user.id,
      })
    if (insertError) {
      return { ok: false, error: insertError.message ?? 'Failed to create membership' }
    }
  }

  // 9. Write audit log — non-blocking
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
      coach_profile_id: coachProfileId,
      assigned_role: input.role,
      action_taken: existing ? 'reactivated' : 'created',
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/coaches')
  revalidatePath('/director')

  return { ok: true, error: null, outcome: 'linked', coachProfileId }
}
