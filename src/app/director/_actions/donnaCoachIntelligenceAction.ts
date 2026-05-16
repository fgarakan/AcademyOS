'use server'

// DONNA Coach Intelligence Action — Sprint 450 (foundation) + Sprint 451 (steps 6-9)
//
// Per-coach intelligence summary for director use.
// Mirrors the per-player pattern in donnaDirectorIntelligenceActions.ts
// but scoped to a single coach profile.
//
// Steps 1-5 (Sprint 450):
//   1. Auth guard (director / head_coach only) + academy_id resolution
//   2. Coach profile — name from profiles, role from academy_memberships
//   3. Sessions coached in last 30d — from sessions where coach_id = coachProfileId
//   4. Session completion rate — completed vs total (30d)
//   5. Recap coverage — KPI 4 via computeRecapCompletionRate
//
// Steps 6-9 (Sprint 451):
//   6. Observations logged by this coach in last 30d (coach_observations.coach_id)
//   7. Pending review items proposed by this coach (proposed_actions.proposed_by_id)
//   8. Group names for coached sessions (groups.id)
//   9. Structured data gap summary
//
// Read-only. No mutations. No proposed_actions writes.
// All queries scoped to academy_id.

import { getSupabaseServer } from '@/lib/supabase/server'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'
import {
  computeRecapCompletionRate,
  formatCoachExecutionForDonna,
  type RecapCheckRow,
} from '@/lib/kpi/coachExecutionKpiEngine'

// ---------------------------------------------------------------------------
// Auth + academy_id helper (director / head_coach only)
// ---------------------------------------------------------------------------

async function getAuthorizedContext() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }

  const rawDb = supabase as any
  const { data: membership } = await rawDb
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false as const, error: 'Director or Head Coach access required.' }
  }

  return {
    ok: true as const,
    supabase,
    rawDb,
    userId: user.id,
    academyId: profile.academy_id as string,
    role: role as 'academy_director' | 'head_coach',
  }
}

// ---------------------------------------------------------------------------
// fetchCoachIntelligenceAction
//
// Input: coachProfileId — the profiles.id of the coach to summarize.
// Returns a plain-text summary in message, structured for the DONNA panel.
// ---------------------------------------------------------------------------

export async function fetchCoachIntelligenceAction(
  coachProfileId: string,
): Promise<DonnaApprovalExecutionResult> {
  if (!coachProfileId || !coachProfileId.trim()) {
    return { ok: false, status: 'blocked', message: 'Coach profile ID is required.' }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) return { ok: false, status: 'blocked', message: ctx.error }

  const { rawDb, academyId } = ctx

  // Step 1 — Coach profile: name from profiles
  const { data: coachProfile } = await rawDb
    .from('profiles')
    .select('id, full_name, first_name')
    .eq('id', coachProfileId)
    .maybeSingle()

  const coachName: string =
    coachProfile?.full_name
      ? String(coachProfile.full_name)
      : coachProfile?.first_name
      ? String(coachProfile.first_name)
      : 'Unknown Coach'

  // Step 2 — Coach role from academy_memberships (scoped to academy_id)
  const { data: coachMembership } = await rawDb
    .from('academy_memberships')
    .select('role, is_active, joined_at')
    .eq('profile_id', coachProfileId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle()

  const coachRole: string = coachMembership?.role ? String(coachMembership.role) : 'coach'
  const coachActive: boolean = coachMembership?.is_active === true

  if (!coachActive) {
    return {
      ok: false,
      status: 'blocked',
      message: `Coach "${coachName}" is not an active member of this academy.`,
    }
  }

  // Step 3 — Sessions coached in last 30d (scoped to academy_id)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id, status, scheduled_date, group_id')
    .eq('academy_id', academyId)
    .eq('coach_id', coachProfileId)
    .gte('scheduled_date', thirtyDaysAgoStr)

  const sessions = ((sessionsRaw ?? []) as Array<{
    id: string
    status: string
    scheduled_date: string
    group_id: string | null
  }>).map(s => ({
    id: String(s.id),
    status: String(s.status ?? ''),
    scheduled_date: String(s.scheduled_date ?? ''),
    group_id: s.group_id ? String(s.group_id) : null,
  }))

  const sessionIds = sessions.map(s => s.id)

  // Step 4 — Session completion rate (30d)
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s =>
    s.status === 'completed' || s.status === 'done',
  ).length
  const plannedSessions = sessions.filter(s => s.status === 'planned').length
  const completionRate: number | null =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : null

  // Step 5 — Recap coverage (KPI 4) using voice_notes for coached sessions
  let recapLines: string[] = []
  if (sessionIds.length > 0) {
    const { data: voiceNoteSessionIds } = await rawDb
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', sessionIds)
      .not('session_id', 'is', null)

    const recapSessionSet = new Set<string>(
      ((voiceNoteSessionIds ?? []) as Array<{ session_id: string | null }>)
        .map(r => r.session_id)
        .filter((id): id is string => id !== null),
    )

    const recapCheckRows: RecapCheckRow[] = sessionIds.map(id => ({
      session_id: id,
      has_note: recapSessionSet.has(id),
    }))

    const recapResult = computeRecapCompletionRate(recapCheckRows, 30)
    recapLines = formatCoachExecutionForDonna([recapResult])
  }

  // Step 6 — Observations logged by this coach in last 30d
  const { data: observationsRaw } = await rawDb
    .from('coach_observations')
    .select('id, player_id, observation_type, created_at')
    .eq('academy_id', academyId)
    .eq('coach_id', coachProfileId)
    .gte('created_at', thirtyDaysAgoStr)

  const coachObservations = (observationsRaw ?? []) as Array<{
    id: string
    player_id: string
    observation_type: string
    created_at: string
  }>
  const observationCount = coachObservations.length
  const distinctPlayersObserved = new Set(coachObservations.map(o => String(o.player_id))).size

  // Step 7 — Pending proposed_actions by this coach (proposed_by_id)
  const { data: pendingActionsRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_label, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', coachProfileId)
    .eq('status', 'pending_review')

  const pendingActions = (pendingActionsRaw ?? []) as Array<{
    id: string
    action_label: string
    target_module: string
    created_at: string
  }>
  const pendingCount = pendingActions.length

  // Step 8 — Group names for coached sessions
  const groupIdSet = new Set<string>()
  for (const s of sessions) {
    if (s.group_id !== null) groupIdSet.add(s.group_id)
  }
  const groupIds = Array.from(groupIdSet)
  const groupNameMap = new Map<string, string>()
  if (groupIds.length > 0) {
    const { data: groupsRaw } = await rawDb
      .from('groups')
      .select('id, name')
      .eq('academy_id', academyId)
      .in('id', groupIds)

    for (const g of (groupsRaw ?? []) as Array<{ id: string; name: string }>) {
      groupNameMap.set(String(g.id), String(g.name ?? 'Unnamed Group'))
    }
  }

  const groupLabels = groupIds
    .map(id => groupNameMap.get(id) ?? 'Unnamed Group')
    .slice(0, 5)

  // Step 9 — Data gap summary
  const dataGaps: string[] = []
  if (totalSessions === 0) {
    dataGaps.push('No sessions assigned to this coach in the last 30 days — verify coach assignment on sessions.')
  }
  if (observationCount === 0 && totalSessions > 0) {
    dataGaps.push('No observations logged by this coach in the last 30 days — coach should log observations after sessions.')
  }
  if (completionRate !== null && completionRate < 50) {
    dataGaps.push(`Session completion rate is low (${completionRate}%) — check if sessions were cancelled or rescheduled.`)
  }

  // ---------------------------------------------------------------------------
  // Build summary lines
  // ---------------------------------------------------------------------------

  const roleLabel =
    coachRole === 'head_coach'
      ? 'Head Coach'
      : coachRole === 'academy_director'
      ? 'Director'
      : 'Coach'

  const sessionCompletionLine =
    completionRate !== null
      ? `${completedSessions} of ${totalSessions} sessions completed (${completionRate}%) in last 30 days.${plannedSessions > 0 ? ` ${plannedSessions} still planned.` : ''}`
      : 'No sessions found for this coach in the last 30 days.'

  const groupLine =
    groupLabels.length > 0
      ? `Groups coached: ${groupLabels.join(', ')}${groupIds.length > 5 ? ` (+${groupIds.length - 5} more)` : ''}.`
      : 'No group sessions found in last 30 days.'

  const observationLine =
    observationCount > 0
      ? `${observationCount} observation${observationCount !== 1 ? 's' : ''} logged across ${distinctPlayersObserved} player${distinctPlayersObserved !== 1 ? 's' : ''} in last 30 days.`
      : 'No observations logged in last 30 days.'

  const pendingLine =
    pendingCount > 0
      ? `${pendingCount} pending review item${pendingCount !== 1 ? 's' : ''} waiting for director approval.`
      : 'No pending review items from this coach.'

  const summaryLines: string[] = [
    `Coach: ${coachName}`,
    `Role: ${roleLabel}`,
    `${groupLine}`,
    '',
    'SESSIONS (LAST 30 DAYS):',
    `• ${sessionCompletionLine}`,
    ...recapLines,
    '',
    'OBSERVATIONS (LAST 30 DAYS):',
    `• ${observationLine}`,
    '',
    'PENDING REVIEW:',
    `• ${pendingLine}`,
    ...(dataGaps.length > 0 ? ['', 'DATA GAPS:'] : []),
    ...dataGaps.map(g => `⚠ ${g}`),
  ]

  return {
    ok: true,
    status: 'saved',
    message: summaryLines.join('\n'),
    safetyNotes: [
      'Read-only summary — no data was written or changed.',
      'Review required before sharing with coaches, players, or parents.',
      'No coach role, profile, or proposed action was modified.',
    ],
  }
}
