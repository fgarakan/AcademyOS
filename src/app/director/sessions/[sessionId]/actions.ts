'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface AssignGroupInput {
  sessionId: string
  groupId: string
}

export interface AssignGroupResult {
  ok: boolean
  error: string | null
}

export async function assignGroupToSessionAction(
  input: AssignGroupInput
): Promise<AssignGroupResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Resolve academy_id from authenticated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify user has director-level role in this academy
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()
  if (!membership) return { ok: false, error: 'Not authorized to assign groups to sessions.' }

  // 4. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, academy_id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  // 5. Verify selected group belongs to this academy and is active
  const { data: group } = await supabase
    .from('groups')
    .select('id, is_active, academy_id')
    .eq('id', input.groupId)
    .eq('academy_id', academyId)
    .single()
  if (!group) return { ok: false, error: 'Group not found or does not belong to this academy.' }
  if (!group.is_active) return { ok: false, error: 'Selected group is not active.' }

  // 6. Update only sessions.group_id — no template, player, membership, or attendance mutations
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ group_id: input.groupId })
    .eq('id', session.id)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to assign group: ${updateError.message}` }
  }

  return { ok: true, error: null }
}

// ─────────────────────────────────────────────────────────────
// Session Status Update (director/head_coach only)
// ─────────────────────────────────────────────────────────────

export interface UpdateSessionStatusInput {
  sessionId: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
}

export interface UpdateSessionStatusResult {
  ok: boolean
  error: string | null
}

export async function updateSessionStatusAction(
  input: UpdateSessionStatusInput
): Promise<UpdateSessionStatusResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .in('role', ['academy_director', 'head_coach'])
    .single()
  if (!membership) return { ok: false, error: 'Not authorized to update session status.' }

  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: input.status })
    .eq('id', session.id)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: `Failed to update status: ${updateError.message}` }
  }

  return { ok: true, error: null }
}
