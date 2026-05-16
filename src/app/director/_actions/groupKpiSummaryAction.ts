'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  computeGroupHealth,
  computeGroupRetention,
  type GroupHealthInput,
  type GroupRetentionInput,
  type GroupMembershipRow,
} from '@/lib/kpi/groupHealthKpiEngine'
import type { KpiResult } from '@/lib/kpi/kpiTypes'

// ---------------------------------------------------------------------------
// fetchGroupKpiSummaryAction — Sprint 435
//
// Fetches group-level data and computes KPI 7 (retention) and KPI 16 (health).
// Read-only. No mutations. Returns structured KPI results.
//
// Inputs computed from DB:
//   - averageAttendanceRatePct: from session_attendance for group sessions (30d)
//   - observationCoveragePct: players with ≥1 observation in last 14d
//   - recapCompletionRatePct: null — requires voice_notes.recap_type (gap G8)
//   - sessionFrequencyRatio: null — requires scheduled session count
//   - noHighSeveritySignalPct: from player_development_signals
//
// This action is not yet wired into any UI route — awaiting a group summary
// screen (Sprint 435+ UI build). The engine and action are ready.
// ---------------------------------------------------------------------------

export interface GroupKpiSummaryResult {
  ok: boolean
  groupId: string
  groupName: string
  groupHealthResult: KpiResult
  groupRetentionResult: KpiResult
  totalPlayerCount: number
  error?: string
}

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

  return {
    ok: true as const,
    supabase,
    rawDb: supabase as any,
    academyId: profile.academy_id as string,
  }
}

export async function fetchGroupKpiSummaryAction(
  groupId: string,
): Promise<GroupKpiSummaryResult> {
  const ctx = await getAuthorizedContext()
  if (!ctx.ok) {
    return {
      ok: false,
      groupId,
      groupName: '',
      groupHealthResult: { kpiId: 16, name: 'Group Health Score', status: 'insufficient_data', value: null, displayText: ctx.error },
      groupRetentionResult: { kpiId: 7, name: 'Player Retention by Group', status: 'insufficient_data', value: null, displayText: ctx.error },
      totalPlayerCount: 0,
      error: ctx.error,
    }
  }

  const { rawDb, academyId } = ctx

  // Fetch group name
  const { data: groupRaw } = await rawDb
    .from('groups')
    .select('id, name')
    .eq('id', groupId)
    .eq('academy_id', academyId)
    .maybeSingle()

  const groupName: string = groupRaw?.name ? String(groupRaw.name) : 'Group'

  // Fetch group memberships for KPI 7
  const { data: membershipsRaw } = await rawDb
    .from('group_memberships')
    .select('player_id, joined_at, left_at, is_current')
    .eq('group_id', groupId)
    .eq('academy_id', academyId)

  const memberships: GroupMembershipRow[] = ((membershipsRaw ?? []) as Array<Record<string, unknown>>).map(m => ({
    player_id: String(m.player_id ?? ''),
    joined_at: String(m.joined_at ?? ''),
    left_at: m.left_at ? String(m.left_at) : null,
    is_current: m.is_current === true,
  }))

  const currentPlayerIds = memberships
    .filter(m => m.left_at === null || m.is_current === true)
    .map(m => m.player_id)

  const totalPlayerCount = currentPlayerIds.length

  // 30-day window
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  // Fetch sessions for this group in last 30 days
  const { data: sessionsRaw } = await rawDb
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('group_id', groupId)
    .gte('scheduled_date', thirtyDaysAgoStr)

  const groupSessionIds: string[] = ((sessionsRaw ?? []) as Array<{ id: string }>).map(s => String(s.id))

  // Compute average attendance rate (30d) from group sessions + player attendance
  let averageAttendanceRatePct: number | null = null
  if (groupSessionIds.length > 0 && currentPlayerIds.length > 0) {
    const { data: attendanceRaw } = await rawDb
      .from('session_attendance')
      .select('player_id, status')
      .in('session_id', groupSessionIds)
      .in('player_id', currentPlayerIds)

    const attendanceRows = (attendanceRaw ?? []) as Array<{ player_id: string; status: string }>
    const ATTENDED = new Set(['present', 'attended', 'late'])
    const totalExpected = groupSessionIds.length * currentPlayerIds.length
    const attended = attendanceRows.filter(r => ATTENDED.has((r.status ?? '').toLowerCase())).length
    if (totalExpected > 0) {
      averageAttendanceRatePct = Math.round((attended / totalExpected) * 100)
    }
  }

  // Compute observation coverage (14d) — players with ≥1 observation in last 14 days
  let observationCoveragePct: number | null = null
  if (currentPlayerIds.length > 0) {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString()

    const { data: obsRaw } = await rawDb
      .from('coach_observations')
      .select('player_id')
      .eq('academy_id', academyId)
      .in('player_id', currentPlayerIds)
      .gte('created_at', fourteenDaysAgoStr)

    const observedPlayerIds = new Set(
      ((obsRaw ?? []) as Array<{ player_id: string }>).map(o => String(o.player_id)),
    )
    observationCoveragePct = currentPlayerIds.length > 0
      ? Math.round((observedPlayerIds.size / currentPlayerIds.length) * 100)
      : null
  }

  // Count at-risk players from active high-severity signals
  let atRiskPlayerCount = 0
  if (currentPlayerIds.length > 0) {
    const { data: signalsRaw } = await rawDb
      .from('player_development_signals')
      .select('player_id')
      .eq('academy_id', academyId)
      .in('player_id', currentPlayerIds)
      .eq('is_active', true)
      .eq('severity', 'high')

    const atRiskPlayerIds = new Set(
      ((signalsRaw ?? []) as Array<{ player_id: string }>).map(s => String(s.player_id)),
    )
    atRiskPlayerCount = atRiskPlayerIds.size
  }

  // Compute no-high-severity signal percentage
  const noHighSeveritySignalPct = totalPlayerCount > 0
    ? Math.round(((totalPlayerCount - atRiskPlayerCount) / totalPlayerCount) * 100)
    : null

  // Build KPI 16 (Group Health)
  const groupHealthInput: GroupHealthInput = {
    groupId,
    groupName,
    averageAttendanceRatePct,
    observationCoveragePct,
    recapCompletionRatePct: null,     // gap G8 — no voice_notes.recap_type
    sessionFrequencyRatio: null,      // no scheduled session count in schema
    noHighSeveritySignalPct,
    atRiskPlayerCount,
    totalPlayerCount,
    windowDays: 30,
  }
  const groupHealthResult = computeGroupHealth(groupHealthInput)

  // Build KPI 7 (Group Retention)
  const groupRetentionInput: GroupRetentionInput = {
    groupId,
    groupName,
    memberships,
    windowDays: 90,
  }
  const groupRetentionResult = computeGroupRetention(groupRetentionInput)

  return {
    ok: true,
    groupId,
    groupName,
    groupHealthResult,
    groupRetentionResult,
    totalPlayerCount,
  }
}
