// Sprint 512 — Command Brief Live Data Wiring V1
// Sprint 514 — uses shared COOFieldStatus from cooDataStatus
// Server-side loader: sequential RLS-safe read-only queries.
// Returns DonnaCommandBriefData + per-field data status.
// No mutations. No writes. No migrations required.

import type { DB } from '@/lib/types/db'
import type {
  DonnaCommandBriefData,
  CommandBriefAttentionFlag,
  CommandBriefSessionSummary,
} from '@/components/assistant/DonnaCommandBriefIntegration'
import { buildDonnaCommandBriefPrompt } from '@/lib/donna/commandBriefPrompt'
import { deriveOverallStatus } from '@/lib/donna/cooDataStatus'

// ── Status types (re-exported for backward compatibility) ─────────────────────
export type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

export interface CommandBriefFieldStatus {
  sessions: COOFieldStatus
  attendance: COOFieldStatus
  wrapUpCoverage: COOFieldStatus
  attentionFlags: COOFieldStatus
  reviewQueue: COOFieldStatus
}

export interface CommandBriefLiveResult {
  data: DonnaCommandBriefData
  fieldStatus: CommandBriefFieldStatus
  overallStatus: 'live' | 'partial' | 'insufficient_data'
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadCommandBriefLive(
  db: DB,
  academyId: string,
): Promise<CommandBriefLiveResult> {
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // 1 — today's sessions (need ids, name, group_id, coach_id)
  const { data: todaySessions } = await db
    .from('sessions')
    .select('id, name, group_id, coach_id')
    .eq('academy_id', academyId)
    .eq('scheduled_date', today)

  const sessions = todaySessions ?? []
  const sessionIds = sessions.map(s => s.id)

  // 2 — pending review count
  const { count: pendingCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')

  // 3 — approved awaiting execution
  const { count: approvedCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'approved')

  // 4 — players attending today (session_attendance.status = 'present')
  let attendingCount = 0
  if (sessionIds.length > 0) {
    const { count } = await db
      .from('session_attendance')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('status', 'present')
    attendingCount = count ?? 0
  }

  // 5 — wrap-up coverage: voice_notes with session_id in today's sessions
  const wrapUpSessionIds = new Set<string>()
  if (sessionIds.length > 0) {
    const { data: vnRows } = await db
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', sessionIds)
    for (const vn of vnRows ?? []) {
      if (vn.session_id) wrapUpSessionIds.add(vn.session_id)
    }
  }

  // 6 — coach display names
  const coachIds = Array.from(new Set(sessions.map(s => s.coach_id)))
  const coachMap = new Map<string, string>()
  if (coachIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, display_name')
      .in('id', coachIds)
    for (const p of profiles ?? []) {
      coachMap.set(p.id, p.display_name ?? p.id.slice(0, 8))
    }
  }

  // 7 — group names
  const groupIds = Array.from(
    new Set(sessions.map(s => s.group_id).filter(Boolean) as string[]),
  )
  const groupMap = new Map<string, string>()
  if (groupIds.length > 0) {
    const { data: groups } = await db
      .from('groups')
      .select('id, name')
      .in('id', groupIds)
    for (const g of groups ?? []) {
      groupMap.set(g.id, g.name)
    }
  }

  // 8 — recent concern observations (last 7 days, max 5)
  const { data: concernObs } = await db
    .from('coach_observations')
    .select('id, player_id, content, observation_type')
    .eq('academy_id', academyId)
    .eq('observation_type', 'concern')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(5)

  // 9 — player names for attention flags
  const flagPlayerIds = Array.from(
    new Set((concernObs ?? []).map(o => o.player_id)),
  )
  const playerNameMap = new Map<string, string>()
  if (flagPlayerIds.length > 0) {
    const { data: players } = await db
      .from('players')
      .select('id, first_name, last_name')
      .in('id', flagPlayerIds)
    for (const p of players ?? []) {
      playerNameMap.set(
        p.id,
        `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Player',
      )
    }
  }

  // ── Build outputs ─────────────────────────────────────────────────────────

  const wrapUpsSubmitted = wrapUpSessionIds.size
  const wrapUpsOutstanding = Math.max(0, sessions.length - wrapUpsSubmitted)

  const attentionFlags: CommandBriefAttentionFlag[] = (concernObs ?? []).map(o => ({
    type: 'observation' as const,
    playerName: playerNameMap.get(o.player_id) ?? null,
    summary: o.content.length > 90 ? `${o.content.slice(0, 87)}…` : o.content,
    urgency: 'medium' as const,
  }))

  const sessionSummaries: CommandBriefSessionSummary[] = sessions.map(s => ({
    sessionId: s.id,
    groupName: s.group_id
      ? (groupMap.get(s.group_id) ?? s.name ?? 'Session')
      : (s.name ?? 'Session'),
    coachName: coachMap.get(s.coach_id) ?? null,
    wrapUpSubmitted: wrapUpSessionIds.has(s.id),
    wrapUpPendingItems: 0,
  }))

  const data: DonnaCommandBriefData = {
    date: dateLabel,
    totalSessionsToday: sessions.length,
    totalPlayersAttending: attendingCount,
    wrapUpsSubmitted,
    wrapUpsOutstanding,
    itemsPendingDirectorReview: pendingCount ?? 0,
    itemsApprovedAwaitingExecution: approvedCount ?? 0,
    attentionFlags,
    sessions: sessionSummaries,
    donnaPrompt: buildDonnaCommandBriefPrompt({
      itemsPendingDirectorReview: pendingCount ?? 0,
      attentionFlags,
      wrapUpsOutstanding,
    }),
  }

  const fieldStatus: CommandBriefFieldStatus = {
    sessions: sessions.length > 0 ? 'live' : 'insufficient_data',
    attendance: attendingCount > 0 ? 'live' : 'partial',
    wrapUpCoverage: sessions.length > 0 ? 'partial' : 'insufficient_data',
    attentionFlags: (concernObs ?? []).length > 0 ? 'live' : 'partial',
    reviewQueue: 'live',
  }

  const overallStatus = deriveOverallStatus(Object.values(fieldStatus))

  return { data, fieldStatus, overallStatus }
}
