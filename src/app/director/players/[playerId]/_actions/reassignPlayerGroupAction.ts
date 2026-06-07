'use server'

// Mega Sprint 634–663 — DONNA Atomic Loop Completion V1
// Active player group reassignment — Loop 4 fix.
// Moves an already-active player from their current group to a new group.
// Director/head_coach only. Closes the existing group_memberships row
// and opens a new one. Writes audit_logs.
//
// Only valid for players with status = 'active'.
// For new (pending_placement) players, use the onboarding stepper instead.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ALLOWED_ROLES: UserRole[] = ['academy_director', 'head_coach']

export interface ReassignPlayerGroupInput {
  playerId: string
  newGroupId: string
  reason?: string
}

export interface ReassignPlayerGroupResult {
  ok: boolean
  error: string | null
  newGroupName: string | null
}

export async function reassignPlayerGroupAction(
  input: ReassignPlayerGroupInput,
): Promise<ReassignPlayerGroupResult> {
  const fail = (error: string): ReassignPlayerGroupResult =>
    ({ ok: false, error, newGroupName: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated')

  // 2. Resolve academy_id server-side
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!callerProfile?.academy_id) return fail('Academy context unavailable')
  const academyId = callerProfile.academy_id

  // 3. Role gate
  const { data: callerMembership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const callerRole = callerMembership?.role as UserRole | undefined
  if (!callerRole || !ALLOWED_ROLES.includes(callerRole)) {
    return fail('Only directors and head coaches can reassign players')
  }

  // 4. Verify player belongs to this academy and is active
  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name, status')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .single()

  if (!player) return fail('Player not found or access denied')
  if (player.status !== 'active') {
    return fail('Group reassignment is only valid for active players. Use the onboarding flow for new players.')
  }

  const playerName =
    player.full_name ??
    `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim()

  // 5. Verify new group belongs to this academy
  const { data: newGroup } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', input.newGroupId)
    .eq('academy_id', academyId)
    .single()

  if (!newGroup) return fail('Target group not found in this academy')

  // 6. Find current group membership (is_current = true)
  const { data: currentMembership } = await rawDb
    .from('group_memberships')
    .select('id, group_id')
    .eq('academy_id', academyId)
    .eq('player_id', input.playerId)
    .eq('is_current', true)
    .maybeSingle()

  // Prevent reassigning to the same group
  if (currentMembership?.group_id === input.newGroupId) {
    return fail('Player is already in this group')
  }

  const now = new Date().toISOString()
  const reason = input.reason?.trim() || 'Director reassignment'

  // 7. Close existing membership
  if (currentMembership) {
    const { error: closeError } = await rawDb
      .from('group_memberships')
      .update({
        is_current: false,
        left_at: now,
        moved_by: user.id,
        reason,
      })
      .eq('id', currentMembership.id)

    if (closeError) return fail(`Failed to close existing membership: ${closeError.message}`)
  }

  // 8. Open new membership
  const { error: insertError } = await supabase
    .from('group_memberships')
    .insert({
      academy_id: academyId,
      player_id: input.playerId,
      group_id: input.newGroupId,
      is_current: true,
      joined_at: now,
      moved_by: user.id,
      reason,
    })

  if (insertError) {
    return fail(`Failed to create new membership: ${insertError.message}`)
  }

  // 9. Audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: callerRole,
    action: 'player_group_reassigned',
    targetType: 'group_memberships',
    targetId: input.playerId,
    targetLabel: playerName,
    payload: {
      player_id: input.playerId,
      player_name: playerName,
      from_group_id: currentMembership?.group_id ?? null,
      to_group_id: input.newGroupId,
      to_group_name: newGroup.name,
      reason,
    },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${input.playerId}`)
  revalidatePath('/director/players')
  revalidatePath('/director')

  return { ok: true, error: null, newGroupName: newGroup.name }
}
