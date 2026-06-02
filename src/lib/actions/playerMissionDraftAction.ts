'use server'

// Mega Sprint 1101-1110 — Player Mission Assignment Actions V1
//
// Three exported server actions:
//   playerMissionDraftAction  — create a mission (director direct or coach/DONNA draft)
//   approveMissionAction      — director approves pending_review → active
//   skipMissionAction         — director/head_coach skips pending_review or active
//
// Table: player_mission_assignments (migration 076, not in generated types)
// Use rawDb = supabase as any for all writes to this table.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import { writeMissionAssignedEvidence, writeMissionCompletedEvidence } from '@/lib/evidence/playerEvidenceWriter'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

type MissionStatus = 'draft' | 'pending_review' | 'active' | 'completed' | 'skipped' | 'archived'
type MissionSourceType = 'director' | 'coach' | 'donna' | 'voice'

// ── Create / Draft action ─────────────────────────────────────────────────────

export interface PlayerMissionDraftInput {
  playerId: string
  missionLabel: string
  missionDescription?: string
  curriculumStageKey?: string
  curriculumLevelKey?: string
  curriculumSourceLabel?: string
  /** Omit to use role-based default: directors → 'active', others → 'draft' */
  status?: MissionStatus
  sourceType?: MissionSourceType
  periodLabel?: string
  startsAt?: string
  endsAt?: string
  displayOrder?: number
  proposedActionId?: string
}

export interface PlayerMissionDraftResult {
  ok: boolean
  error: string | null
  outcome?: 'assigned_direct' | 'draft_saved' | 'submitted' | 'duplicate'
  assignmentId?: string | null
  /** true when migration 076 has not been applied to the live DB */
  isSchemaMissing?: boolean
}

function inferSourceType(role: UserRole, supplied?: MissionSourceType): MissionSourceType {
  if (supplied) return supplied
  if (role === 'academy_director') return 'director'
  return 'coach'
}

function validateStatusForRole(
  role: UserRole,
  requested: MissionStatus,
): { valid: boolean; reason?: string } {
  if (role === 'academy_director') return { valid: true }
  if (role === 'head_coach' || role === 'coach') {
    if (requested === 'draft' || requested === 'pending_review') return { valid: true }
    return { valid: false, reason: `Coaches can only create missions with status 'draft' or 'pending_review'. '${requested}' requires director approval.` }
  }
  return { valid: false, reason: 'Your role is not permitted to create mission assignments.' }
}

export async function playerMissionDraftAction(
  input: PlayerMissionDraftInput,
): Promise<PlayerMissionDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!callerProfile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = callerProfile.academy_id

  const { data: callerMembership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const callerRole = callerMembership?.role as UserRole | undefined
  if (!callerRole) return { ok: false, error: 'No active membership found for this academy' }

  const missionLabel = input.missionLabel?.trim()
  if (!missionLabel) return { ok: false, error: 'Mission label is required' }
  if (!input.playerId) return { ok: false, error: 'Player ID is required' }

  const defaultStatus: MissionStatus = callerRole === 'academy_director' ? 'active' : 'draft'
  const targetStatus: MissionStatus = input.status ?? defaultStatus

  const statusCheck = validateStatusForRole(callerRole, targetStatus)
  if (!statusCheck.valid) return { ok: false, error: statusCheck.reason ?? 'Status not permitted for your role' }

  const rawDb = supabase as any

  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('id', input.playerId)
    .eq('academy_id', academyId)
    .single()

  if (!player) return { ok: false, error: 'Player not found in this academy' }

  // Duplicate guard for active missions
  if (targetStatus === 'active') {
    const dupQuery = rawDb
      .from('player_mission_assignments')
      .select('id')
      .eq('academy_id', academyId)
      .eq('player_id', input.playerId)
      .eq('mission_label', missionLabel)
      .eq('status', 'active')

    if (input.periodLabel) {
      dupQuery.eq('period_label', input.periodLabel)
    } else {
      dupQuery.is('period_label', null)
    }

    const { data: dupRow } = await dupQuery.maybeSingle()
    if (dupRow) {
      return { ok: true, error: null, outcome: 'duplicate', assignmentId: dupRow.id as string }
    }
  }

  const sourceType = inferSourceType(callerRole, input.sourceType)

  let assignmentId: string | null = null
  try {
    const { data: newRow, error: insertError } = await rawDb
      .from('player_mission_assignments')
      .insert({
        academy_id:              academyId,
        player_id:               input.playerId,
        mission_label:           missionLabel,
        mission_description:     input.missionDescription?.trim() || null,
        curriculum_stage_key:    input.curriculumStageKey?.trim() || null,
        curriculum_level_key:    input.curriculumLevelKey?.trim() || null,
        curriculum_source_label: input.curriculumSourceLabel?.trim() || null,
        source_type:             sourceType,
        assigned_by:             user.id,
        status:                  targetStatus,
        period_label:            input.periodLabel?.trim() || null,
        starts_at:               input.startsAt || null,
        ends_at:                 input.endsAt || null,
        display_order:           input.displayOrder ?? 0,
        proposed_action_id:      input.proposedActionId || null,
      })
      .select('id')
      .single()

    if (insertError) {
      if (
        insertError.code === '42P01' ||
        (typeof insertError.message === 'string' && insertError.message.includes('does not exist'))
      ) {
        return { ok: false, error: 'Migration 076 has not been applied. Apply player_mission_assignments migration before using this action.', isSchemaMissing: true }
      }
      return { ok: false, error: insertError.message ?? 'Failed to create mission assignment' }
    }

    assignmentId = (newRow as { id: string }).id
  } catch {
    return { ok: false, error: 'Unexpected error creating mission assignment' }
  }

  const playerName = player.full_name ?? `${player.first_name} ${player.last_name}`
  const auditAction = targetStatus === 'active' ? 'mission_assigned_direct'
    : targetStatus === 'pending_review' ? 'mission_draft_submitted'
    : 'mission_draft_saved'

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: callerRole,
    action: auditAction,
    targetType: 'player_mission_assignments',
    targetId: assignmentId,
    targetLabel: `${playerName} — ${missionLabel}`,
    payload: { player_id: input.playerId, mission_label: missionLabel, status: targetStatus, source_type: sourceType },
    sourceType: 'ui',
  })

  revalidatePath(`/director/players/${input.playerId}`)
  if (targetStatus === 'pending_review') revalidatePath('/director/review')

  const outcome: PlayerMissionDraftResult['outcome'] =
    targetStatus === 'active' ? 'assigned_direct'
    : targetStatus === 'pending_review' ? 'submitted'
    : 'draft_saved'

  return { ok: true, error: null, outcome, assignmentId }
}

// ── Approve action ────────────────────────────────────────────────────────────

export interface ApproveMissionResult { ok: boolean; error: string | null }

export async function approveMissionAction(
  assignmentId: string,
  reviewNotes?: string,
): Promise<ApproveMissionResult> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: m } = await supabase.from('academy_memberships').select('role').eq('academy_id', academyId).eq('profile_id', user.id).eq('is_active', true).single()
  const role = m?.role as UserRole | undefined
  if (role !== 'academy_director') return { ok: false, error: 'Only academy directors can approve mission assignments' }

  const rawDb = supabase as any
  const { data: assignment } = await rawDb.from('player_mission_assignments').select('id, status, player_id, mission_label').eq('id', assignmentId).eq('academy_id', academyId).maybeSingle()
  if (!assignment) return { ok: false, error: 'Mission assignment not found' }
  if (assignment.status !== 'pending_review') return { ok: false, error: `Mission is in status '${assignment.status as string}' — only pending_review assignments can be approved.` }

  const { error: updateError } = await rawDb.from('player_mission_assignments').update({ status: 'active', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_notes: reviewNotes?.trim() || null }).eq('id', assignmentId)
  if (updateError) return { ok: false, error: updateError.message ?? 'Failed to approve mission' }

  await writeAuditLog({ db: supabase, academyId, actorId: user.id, actorRole: role, action: 'mission_approved', targetType: 'player_mission_assignments', targetId: assignmentId, targetLabel: assignment.mission_label as string, payload: { player_id: assignment.player_id as string, review_notes: reviewNotes ?? null }, sourceType: 'ui' })

  // Write to player_evidence_records (non-blocking)
  try {
    await writeMissionAssignedEvidence(supabase, {
      academyId,
      playerId:      assignment.player_id as string,
      missionId:     assignmentId,
      missionLabel:  assignment.mission_label as string,
      curriculumLevelId: null,
      priorityKey:   null,
      priorityLabel: null,
      createdBy:     user.id,
    })
  } catch { /* evidence write failure is non-blocking */ }

  revalidatePath(`/director/players/${assignment.player_id as string}`)
  revalidatePath('/director/review')
  return { ok: true, error: null }
}

// ── Skip action ───────────────────────────────────────────────────────────────

export interface SkipMissionResult { ok: boolean; error: string | null }

export async function skipMissionAction(
  assignmentId: string,
  reason?: string,
): Promise<SkipMissionResult> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: m } = await supabase.from('academy_memberships').select('role').eq('academy_id', academyId).eq('profile_id', user.id).eq('is_active', true).single()
  const role = m?.role as UserRole | undefined
  if (role !== 'academy_director' && role !== 'head_coach') return { ok: false, error: 'Only directors and head coaches can skip mission assignments' }

  const rawDb = supabase as any
  const { data: assignment } = await rawDb.from('player_mission_assignments').select('id, status, player_id, mission_label').eq('id', assignmentId).eq('academy_id', academyId).maybeSingle()
  if (!assignment) return { ok: false, error: 'Mission assignment not found' }
  if (!['pending_review', 'active'].includes(assignment.status as string)) return { ok: false, error: `Cannot skip a mission in status '${assignment.status as string}'.` }

  const { error: updateError } = await rawDb.from('player_mission_assignments').update({ status: 'skipped', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_notes: reason?.trim() || null }).eq('id', assignmentId)
  if (updateError) return { ok: false, error: updateError.message ?? 'Failed to skip mission' }

  await writeAuditLog({ db: supabase, academyId, actorId: user.id, actorRole: role, action: 'mission_skipped', targetType: 'player_mission_assignments', targetId: assignmentId, targetLabel: assignment.mission_label as string, payload: { player_id: assignment.player_id as string, reason: reason ?? null }, sourceType: 'ui' })
  revalidatePath(`/director/players/${assignment.player_id as string}`)
  revalidatePath('/director/review')
  return { ok: true, error: null }
}

// ── Complete mission action ────────────────────────────────────────────────────

export interface CompleteMissionResult { ok: boolean; error: string | null }

export async function completeMissionAction(
  assignmentId: string,
  completionNote?: string,
): Promise<CompleteMissionResult> {
  await assertNotPreviewMode()
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('academy_id').eq('id', user.id).single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: m } = await supabase.from('academy_memberships').select('role').eq('academy_id', academyId).eq('profile_id', user.id).eq('is_active', true).single()
  const role = m?.role as UserRole | undefined
  if (role !== 'academy_director' && role !== 'head_coach' && role !== 'coach') {
    return { ok: false, error: 'Coach, Director, or Head Coach required' }
  }

  const rawDb = supabase as any
  const { data: assignment } = await rawDb
    .from('player_mission_assignments')
    .select('id, status, player_id, mission_label')
    .eq('id', assignmentId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!assignment) return { ok: false, error: 'Mission assignment not found' }
  if (assignment.status !== 'active') {
    return { ok: false, error: `Cannot complete a mission in status '${assignment.status as string}'.` }
  }

  const { error: updateError } = await rawDb
    .from('player_mission_assignments')
    .update({
      status:          'completed',
      completion_note: completionNote?.trim() || null,
      completed_at:    new Date().toISOString(),
    })
    .eq('id', assignmentId)

  if (updateError) return { ok: false, error: updateError.message ?? 'Failed to complete mission' }

  await writeAuditLog({
    db: supabase, academyId, actorId: user.id, actorRole: role,
    action: 'mission_completed', targetType: 'player_mission_assignments',
    targetId: assignmentId, targetLabel: assignment.mission_label as string,
    payload: { player_id: assignment.player_id as string, completion_note: completionNote ?? null },
    sourceType: 'ui',
  })

  // Write to player_evidence_records (non-blocking)
  try {
    await writeMissionCompletedEvidence(supabase, {
      academyId,
      playerId:       assignment.player_id as string,
      missionId:      assignmentId,
      missionLabel:   assignment.mission_label as string,
      completionNote: completionNote?.trim() || null,
      createdBy:      user.id,
    })
  } catch { /* evidence write failure is non-blocking */ }

  revalidatePath(`/director/players/${assignment.player_id as string}`)
  return { ok: true, error: null }
}
