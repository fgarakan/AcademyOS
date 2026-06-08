'use server'

// Mega Sprint 1085–1114 — DONNA Player Creation Completion V1
//
// Server action for the DONNA-guided player creation flow.
// Returns structured result (ok + playerId) instead of redirecting,
// so the client can show a DONNA completion summary before navigating.
//
// Called only when the director confirms a WorkflowDraftPayload via the
// DONNA review banner. Not called by the standard NewPlayerForm submit path.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface CreatePlayerDonnaResult {
  ok: boolean
  playerId: string | null
  redirectTo: string | null
  error: string | null
}

export async function createPlayerDonnaAction(params: {
  firstName: string
  lastName: string
  dateOfBirth: string
  notes: string | null
  planId: string
}): Promise<CreatePlayerDonnaResult> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, playerId: null, redirectTo: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, playerId: null, redirectTo: null, error: 'Academy context unavailable' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director' && membership?.role !== 'head_coach') {
    return { ok: false, playerId: null, redirectTo: null, error: 'Not authorised' }
  }

  const firstName = params.firstName.trim()
  const lastName  = params.lastName.trim()
  const dob       = params.dateOfBirth.trim()

  if (!firstName) return { ok: false, playerId: null, redirectTo: null, error: 'First name is required' }
  if (!lastName)  return { ok: false, playerId: null, redirectTo: null, error: 'Last name is required' }
  if (!dob)       return { ok: false, playerId: null, redirectTo: null, error: 'Date of birth is required' }

  const fullName = `${firstName} ${lastName}`
  const today    = new Date().toISOString().slice(0, 10)

  const { data: inserted, error: insertError } = await supabase
    .from('players')
    .insert({
      academy_id:    profile.academy_id,
      first_name:    firstName,
      last_name:     lastName,
      full_name:     fullName,
      date_of_birth: dob,
      join_date:     today,
      notes:         params.notes ?? null,
      status:        'pending_placement',
      is_active:     true,
      created_by:    user.id,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { ok: false, playerId: null, redirectTo: null, error: insertError?.message ?? 'Failed to create player' }
  }

  await writeAuditLog({
    db:           supabase,
    academyId:    profile.academy_id,
    actorId:      user.id,
    actorRole:    membership.role as UserRole,
    action:       'player_created',
    targetType:   'players',
    targetId:     inserted.id,
    targetLabel:  fullName,
    payload: {
      first_name:    firstName,
      last_name:     lastName,
      date_of_birth: dob,
      status:        'pending_placement',
      source:        'donna_workflow',
      plan_id:       params.planId,
    },
    sourceType:   'ui',
  })

  return {
    ok:         true,
    playerId:   inserted.id,
    redirectTo: `/director/players/${inserted.id}/onboard`,
    error:      null,
  }
}
