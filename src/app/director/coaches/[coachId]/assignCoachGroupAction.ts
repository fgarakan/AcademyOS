'use server'

// Mega Sprint 634–663 — DONNA Atomic Loop Completion V1
// Coach Group Assignment action — Loop 5 fix.
// Inserts or deactivates coach_group_assignments rows.
// Director/head_coach only. Writes audit_logs on every change.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ALLOWED_ROLES: UserRole[] = ['academy_director', 'head_coach']

export interface AssignCoachGroupInput {
  coachId: string
  groupId: string
  action: 'add' | 'remove'
}

export interface AssignCoachGroupResult {
  ok: boolean
  error: string | null
}

export async function assignCoachGroupAction(
  input: AssignCoachGroupInput,
): Promise<AssignCoachGroupResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // 2. Resolve academy_id server-side — never trust client input
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!callerProfile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = callerProfile.academy_id

  // 3. Role gate — director or head_coach only
  const { data: callerMembership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const callerRole = callerMembership?.role as UserRole | undefined
  if (!callerRole || !ALLOWED_ROLES.includes(callerRole)) {
    return { ok: false, error: 'Only directors and head coaches can manage group assignments' }
  }

  // 4. Validate input
  if (!input.coachId || !input.groupId) {
    return { ok: false, error: 'Missing coach or group ID' }
  }

  // 5. Verify coach belongs to this academy
  const { data: coachMembership } = await rawDb
    .from('academy_memberships')
    .select('role, is_active')
    .eq('academy_id', academyId)
    .eq('profile_id', input.coachId)
    .eq('is_active', true)
    .maybeSingle()

  if (!coachMembership) {
    return { ok: false, error: 'Coach not found in this academy' }
  }

  // 6. Verify group belongs to this academy
  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', input.groupId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!group) return { ok: false, error: 'Group not found in this academy' }

  // 7. Get coach display name for audit log
  const { data: coachProfile } = await rawDb
    .from('profiles')
    .select('full_name, first_name')
    .eq('id', input.coachId)
    .maybeSingle()
  const coachName: string =
    coachProfile?.full_name
      ? String(coachProfile.full_name)
      : coachProfile?.first_name
      ? String(coachProfile.first_name)
      : 'Coach'

  if (input.action === 'add') {
    // Check for existing assignment
    const { data: existing } = await rawDb
      .from('coach_group_assignments')
      .select('id, is_active')
      .eq('academy_id', academyId)
      .eq('coach_id', input.coachId)
      .eq('group_id', input.groupId)
      .maybeSingle()

    if (existing?.is_active) {
      return { ok: true, error: null } // Idempotent — already assigned
    }

    const now = new Date().toISOString()

    if (existing && !existing.is_active) {
      // Reactivate existing row
      const { error } = await rawDb
        .from('coach_group_assignments')
        .update({ is_active: true, assigned_at: now })
        .eq('id', existing.id)
      if (error) return { ok: false, error: error.message ?? 'Failed to reactivate assignment' }
    } else {
      // Insert new row
      const { error } = await supabase
        .from('coach_group_assignments')
        .insert({
          academy_id: academyId,
          coach_id: input.coachId,
          group_id: input.groupId,
          role: 'primary',
          is_active: true,
          assigned_at: now,
        })
      if (error) return { ok: false, error: error.message ?? 'Failed to create assignment' }
    }

    await writeAuditLog({
      db: supabase,
      academyId,
      actorId: user.id,
      actorRole: callerRole,
      action: 'coach_group_assigned',
      targetType: 'coach_group_assignments',
      targetId: input.coachId,
      targetLabel: `${coachName} → ${group.name}`,
      payload: {
        coach_id: input.coachId,
        coach_name: coachName,
        group_id: input.groupId,
        group_name: group.name,
        action: 'add',
      },
      sourceType: 'ui',
    })
  } else {
    // Remove — deactivate the row
    const { error } = await rawDb
      .from('coach_group_assignments')
      .update({ is_active: false })
      .eq('academy_id', academyId)
      .eq('coach_id', input.coachId)
      .eq('group_id', input.groupId)
      .eq('is_active', true)

    if (error) return { ok: false, error: error.message ?? 'Failed to remove assignment' }

    await writeAuditLog({
      db: supabase,
      academyId,
      actorId: user.id,
      actorRole: callerRole,
      action: 'coach_group_removed',
      targetType: 'coach_group_assignments',
      targetId: input.coachId,
      targetLabel: `${coachName} removed from ${group.name}`,
      payload: {
        coach_id: input.coachId,
        coach_name: coachName,
        group_id: input.groupId,
        group_name: group.name,
        action: 'remove',
      },
      sourceType: 'ui',
    })
  }

  revalidatePath(`/director/coaches/${input.coachId}`)
  revalidatePath('/director/coaches')
  revalidatePath('/director')

  return { ok: true, error: null }
}
