'use server'

// Mega Sprint 1085–1114 — DONNA Player Creation Completion V1
// Mega Sprint 1475–1504 — DONNA Player Relationship Resolution V1
//   Extended to resolve assigned_coach, assigned_group, recommended_level text into
//   DB UUIDs and save primary_coach_id, current_group_id, current_level_id on the player.
//   Returns disambiguationRequired when multiple entities match a text label.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import {
  loadCoachesSummary,
  loadGroupsSummary,
  loadCurriculumLevelsSummary,
} from '@/lib/donna/extendedContextLoaders'
import {
  resolvePlayerAssignments,
  type PlayerAssignmentInput,
} from '@/lib/donna/playerCreation/donnaPlayerAssignmentResolver'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

export interface DisambiguationField {
  field:     'primary_coach' | 'group' | 'curriculum_level'
  inputText: string
  options:   Array<{ id: string; displayName: string; confidence: number }>
}

export interface CreatePlayerDonnaResult {
  ok:                       boolean
  playerId:                 string | null
  redirectTo:               string | null
  error:                    string | null
  disambiguationRequired?:  DisambiguationField[]
}

export async function createPlayerDonnaAction(params: {
  firstName:    string
  lastName:     string
  dateOfBirth:  string
  notes:        string | null
  planId:       string
  // Relationship text labels from DONNA workflow (optional — not set on standard path)
  assignedCoachText?:    string | null
  assignedGroupText?:    string | null
  recommendedLevelText?: string | null
  // Override IDs (set by client after director resolves disambiguation)
  primaryCoachIdOverride?:  string | null
  currentGroupIdOverride?:  string | null
  currentLevelIdOverride?:  string | null
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

  // ── Relationship resolution ───────────────────────────────────────────────────
  let primaryCoachId:  string | null = params.primaryCoachIdOverride  ?? null
  let currentGroupId:  string | null = params.currentGroupIdOverride  ?? null
  let currentLevelId:  string | null = params.currentLevelIdOverride  ?? null
  let resolutionMeta: Record<string, unknown> = {}

  const hasAnyRelationshipText =
    params.assignedCoachText || params.assignedGroupText || params.recommendedLevelText

  const needsResolution = hasAnyRelationshipText &&
    (primaryCoachId === null || currentGroupId === null || currentLevelId === null)

  if (needsResolution) {
    const [coachesResult, groupsResult, levelsResult] = await Promise.all([
      loadCoachesSummary(supabase, profile.academy_id),
      loadGroupsSummary(supabase, profile.academy_id),
      loadCurriculumLevelsSummary(supabase),
    ])

    const assignmentInput: PlayerAssignmentInput = {
      assignedCoachText:    params.primaryCoachIdOverride  ? null : (params.assignedCoachText    ?? null),
      assignedGroupText:    params.currentGroupIdOverride  ? null : (params.assignedGroupText    ?? null),
      recommendedLevelText: params.currentLevelIdOverride  ? null : (params.recommendedLevelText ?? null),
    }

    const resolution = resolvePlayerAssignments(assignmentInput, {
      coaches:          coachesResult.summaries,
      groups:           groupsResult.summaries,
      curriculumLevels: levelsResult.summaries,
    })

    if (resolution.ambiguousFields.length > 0) {
      return {
        ok:    false,
        playerId:  null,
        redirectTo: null,
        error: null,
        disambiguationRequired: resolution.ambiguousFields.map(f => ({
          field:     f.field,
          inputText: f.inputText,
          options:   f.candidates,
        })),
      }
    }

    if (primaryCoachId === null) primaryCoachId = resolution.primaryCoachId
    if (currentGroupId === null) currentGroupId = resolution.currentGroupId
    if (currentLevelId === null) currentLevelId = resolution.currentLevelId

    resolutionMeta = {
      coach_resolved_label:  resolution.displayLabels.primaryCoach,
      group_resolved_label:  resolution.displayLabels.currentGroup,
      level_resolved_label:  resolution.displayLabels.currentLevel,
      unresolved_fields:     resolution.unresolvedFields,
      resolution_warnings:   resolution.warnings,
    }
  }

  // ── Insert player ─────────────────────────────────────────────────────────────
  const fullName = `${firstName} ${lastName}`
  const today    = new Date().toISOString().slice(0, 10)

  const { data: inserted, error: insertError } = await supabase
    .from('players')
    .insert({
      academy_id:        profile.academy_id,
      first_name:        firstName,
      last_name:         lastName,
      full_name:         fullName,
      date_of_birth:     dob,
      join_date:         today,
      notes:             params.notes ?? null,
      status:            'pending_placement',
      is_active:         true,
      created_by:        user.id,
      primary_coach_id:  primaryCoachId,
      current_group_id:  currentGroupId,
      current_level_id:  currentLevelId,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return { ok: false, playerId: null, redirectTo: null, error: insertError?.message ?? 'Failed to create player' }
  }

  await writeAuditLog({
    db:          supabase,
    academyId:   profile.academy_id,
    actorId:     user.id,
    actorRole:   membership.role as UserRole,
    action:      'player_created',
    targetType:  'players',
    targetId:    inserted.id,
    targetLabel: fullName,
    payload: {
      first_name:         firstName,
      last_name:          lastName,
      date_of_birth:      dob,
      status:             'pending_placement',
      source:             'donna_workflow',
      plan_id:            params.planId,
      primary_coach_id:   primaryCoachId,
      current_group_id:   currentGroupId,
      current_level_id:   currentLevelId,
      assigned_coach_text:     params.assignedCoachText    ?? null,
      assigned_group_text:     params.assignedGroupText    ?? null,
      recommended_level_text:  params.recommendedLevelText ?? null,
      ...resolutionMeta,
    },
    sourceType: 'ui',
  })

  return {
    ok:         true,
    playerId:   inserted.id,
    redirectTo: `/director/players/${inserted.id}/onboard`,
    error:      null,
  }
}
