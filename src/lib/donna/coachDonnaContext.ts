// Sprint 1013 — Coach Context Aggregator V1
// Aggregates coach-scoped DONNA context from live sources.
// Scoped to the calling coach's own sessions and actions only.
// Read-only. No DB writes. No migrations required. Fails safely with demo fallback.

import type { DB } from '@/lib/types/db'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { deriveOverallStatus } from '@/lib/donna/cooDataStatus'

// ── Output types ──────────────────────────────────────────────────────────────

export interface CoachSessionSummary {
  sessionId: string
  sessionName: string
  scheduledDate: string
  playerCount: number
  blockCount: number
  wrapUpSubmitted: boolean
  templateName: string | null
}

export interface CoachRecommendedAction {
  id: string
  label: string
  reason: string
  href: string
  category: 'session' | 'wrap_up' | 'observation' | 'review'
}

export interface CoachSourceLabel {
  field: string
  status: COOFieldStatus
  label: string
}

export interface CoachDonnaContext {
  // Counts
  todaySessions: number
  totalPlayersToday: number
  missingWrapUps: number
  pendingSubmissions: number
  observationDraftsToday: number
  // Active session
  activeSessionId: string | null
  activeSessionName: string | null
  // Lists
  sessionSummaries: CoachSessionSummary[]
  contextItems: string[]
  recommendedActions: CoachRecommendedAction[]
  // Meta
  sourceLabels: CoachSourceLabel[]
  confidence: DONNAConfidence
  isLive: boolean
}

// ── Demo fallback ─────────────────────────────────────────────────────────────

function buildDemoContext(): CoachDonnaContext {
  return {
    todaySessions: 2,
    totalPlayersToday: 12,
    missingWrapUps: 1,
    pendingSubmissions: 2,
    observationDraftsToday: 0,
    activeSessionId: null,
    activeSessionName: 'Demo: Level 2 Morning',
    sessionSummaries: [
      {
        sessionId: 'demo-1',
        sessionName: 'Demo: Level 2 Morning',
        scheduledDate: new Date().toISOString().slice(0, 10),
        playerCount: 8,
        blockCount: 4,
        wrapUpSubmitted: false,
        templateName: 'Level 2 — Baseline Consistency',
      },
      {
        sessionId: 'demo-2',
        sessionName: 'Demo: Level 3 Afternoon',
        scheduledDate: new Date().toISOString().slice(0, 10),
        playerCount: 4,
        blockCount: 5,
        wrapUpSubmitted: true,
        templateName: 'Level 3 — Match Play',
      },
    ],
    contextItems: [
      '2 sessions today — 1 wrap-up pending',
      '12 players on court',
      '2 items waiting for director review',
    ],
    recommendedActions: [
      {
        id: 'submit_wrapup',
        label: 'Submit wrap-up for Level 2 Morning',
        reason: 'Wrap-up not yet submitted for this session',
        href: '/coach/sessions/demo-1/wrap-up',
        category: 'wrap_up',
      },
    ],
    sourceLabels: [
      { field: 'Sessions today', status: 'insufficient_data', label: 'Demo data' },
      { field: 'Pending submissions', status: 'insufficient_data', label: 'Demo data' },
    ],
    confidence: 'insufficient',
    isLive: false,
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export async function loadCoachDonnaContext(
  db: DB,
  academyId: string,
  coachUserId: string,
): Promise<CoachDonnaContext> {
  const today = new Date().toISOString().slice(0, 10)

  const fieldStatuses: Record<string, COOFieldStatus> = {}

  // ── 1. Today's sessions for this coach ────────────────────────────────────

  let sessionRows: { id: string; name: string | null; scheduled_date: string }[] = []

  try {
    const { data } = await db
      .from('sessions')
      .select('id, name, scheduled_date')
      .eq('academy_id', academyId)
      .eq('coach_id', coachUserId)
      .eq('scheduled_date', today)
      .order('scheduled_date', { ascending: true })

    sessionRows = data ?? []
    fieldStatuses.sessions = sessionRows.length > 0 ? 'live' : 'insufficient_data'
  } catch {
    fieldStatuses.sessions = 'insufficient_data'
  }

  const todaySessions = sessionRows.length
  const sessionIds = sessionRows.map(s => s.id)

  // ── 2. Player counts per session ──────────────────────────────────────────

  const playerCountMap = new Map<string, number>()

  try {
    if (sessionIds.length > 0) {
      const { data: attendanceRows } = await db
        .from('session_attendance')
        .select('session_id')
        .in('session_id', sessionIds)

      for (const row of attendanceRows ?? []) {
        playerCountMap.set(row.session_id, (playerCountMap.get(row.session_id) ?? 0) + 1)
      }
    }
  } catch {
    // non-blocking
  }

  const totalPlayersToday = sessionIds.reduce(
    (sum, id) => sum + (playerCountMap.get(id) ?? 0),
    0,
  )

  // ── 3. Block counts per session ───────────────────────────────────────────

  const blockCountMap = new Map<string, number>()

  try {
    if (sessionIds.length > 0) {
      const { data: blockRows } = await db
        .from('session_blocks')
        .select('session_id')
        .in('session_id', sessionIds)

      for (const row of blockRows ?? []) {
        blockCountMap.set(row.session_id, (blockCountMap.get(row.session_id) ?? 0) + 1)
      }
    }
  } catch {
    // non-blocking
  }

  // ── 4. Template names for today's sessions ────────────────────────────────

  const templateNameMap = new Map<string, string>()

  try {
    if (sessionIds.length > 0) {
      const { data: sessionDetails } = await db
        .from('sessions')
        .select('id, template_id')
        .in('id', sessionIds)

      const templateIds = (sessionDetails ?? [])
        .map(s => s.template_id)
        .filter((id): id is string => id !== null && id !== undefined)

      if (templateIds.length > 0) {
        const { data: templates } = await db
          .from('templates')
          .select('id, name')
          .in('id', templateIds)

        const tMap = new Map<string, string>()
        for (const t of templates ?? []) {
          tMap.set(t.id, t.name)
        }

        for (const s of sessionDetails ?? []) {
          if (s.template_id) {
            templateNameMap.set(s.id, tMap.get(s.template_id) ?? '')
          }
        }
      }
    }
  } catch {
    // non-blocking
  }

  // ── 5. Wrap-up submission status for today's sessions ─────────────────────

  const wrappedSessionIds = new Set<string>()

  try {
    if (sessionIds.length > 0) {
      const { data: wrapRows } = await db
        .from('proposed_actions')
        .select('target_object_id')
        .eq('academy_id', academyId)
        .eq('proposed_by_id', coachUserId)
        .eq('target_module', 'session_wrap_up_v1')
        .in('status', ['pending_review', 'approved'])
        .in('target_object_id', sessionIds)

      for (const row of wrapRows ?? []) {
        if (row.target_object_id) wrappedSessionIds.add(row.target_object_id)
      }
    }
    fieldStatuses.wrapUps = 'live'
  } catch {
    fieldStatuses.wrapUps = 'insufficient_data'
  }

  const missingWrapUps = sessionIds.filter(id => !wrappedSessionIds.has(id)).length

  // ── 6. Coach's pending submissions (all types, last 7 days) ───────────────

  let pendingSubmissions = 0

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('proposed_by_id', coachUserId)
      .in('status', ['pending_review', 'approved'])
      .gte('created_at', sevenDaysAgo)

    pendingSubmissions = count ?? 0
    fieldStatuses.pendingSubmissions = 'live'
  } catch {
    fieldStatuses.pendingSubmissions = 'insufficient_data'
  }

  // ── 7. Observation drafts submitted today ─────────────────────────────────

  let observationDraftsToday = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('proposed_by_id', coachUserId)
      .eq('target_module', 'player_observation')
      .eq('status', 'pending_review')
      .gte('created_at', `${today}T00:00:00`)

    observationDraftsToday = count ?? 0
  } catch {
    // non-blocking
  }

  // ── 8. Build session summaries ────────────────────────────────────────────

  const sessionSummaries: CoachSessionSummary[] = sessionRows.map(s => ({
    sessionId: s.id,
    sessionName: s.name ?? 'Session',
    scheduledDate: s.scheduled_date,
    playerCount: playerCountMap.get(s.id) ?? 0,
    blockCount: blockCountMap.get(s.id) ?? 0,
    wrapUpSubmitted: wrappedSessionIds.has(s.id),
    templateName: templateNameMap.get(s.id) ?? null,
  }))

  // First session without wrap-up = active session hint
  const firstUnwrapped = sessionSummaries.find(s => !s.wrapUpSubmitted)
  const activeSessionId = firstUnwrapped?.sessionId ?? null
  const activeSessionName = firstUnwrapped?.sessionName ?? null

  // ── 9. Context items ───────────────────────────────────────────────────────

  const contextItems: string[] = []

  if (todaySessions > 0) {
    contextItems.push(`${todaySessions} session${todaySessions !== 1 ? 's' : ''} today — ${totalPlayersToday} player${totalPlayersToday !== 1 ? 's' : ''} on court`)
  }
  if (missingWrapUps > 0) {
    contextItems.push(`${missingWrapUps} wrap-up${missingWrapUps !== 1 ? 's' : ''} still pending`)
  }
  if (pendingSubmissions > 0) {
    contextItems.push(`${pendingSubmissions} submission${pendingSubmissions !== 1 ? 's' : ''} waiting for director review`)
  }
  if (observationDraftsToday > 0) {
    contextItems.push(`${observationDraftsToday} observation draft${observationDraftsToday !== 1 ? 's' : ''} submitted today`)
  }

  // ── 10. Recommended actions ────────────────────────────────────────────────

  const recommendedActions: CoachRecommendedAction[] = []

  if (missingWrapUps > 0 && activeSessionId) {
    recommendedActions.push({
      id: 'submit_wrapup',
      label: `Submit wrap-up — ${activeSessionName ?? 'session'}`,
      reason: 'Wrap-up not yet submitted',
      href: `/coach/sessions/${activeSessionId}/wrap-up`,
      category: 'wrap_up',
    })
  }

  if (todaySessions > 0 && activeSessionId) {
    recommendedActions.push({
      id: 'execute_session',
      label: `Run session — ${activeSessionName ?? 'active session'}`,
      reason: 'Session plan ready to execute',
      href: `/coach/sessions/${activeSessionId}/execute`,
      category: 'session',
    })
  }

  if (observationDraftsToday === 0 && totalPlayersToday > 0) {
    recommendedActions.push({
      id: 'capture_observation',
      label: 'Capture a player observation',
      reason: 'No observations recorded yet today',
      href: '/coach/note',
      category: 'observation',
    })
  }

  // ── 11. Source labels ──────────────────────────────────────────────────────

  const statusLabel = (s: COOFieldStatus) =>
    s === 'live' ? 'Live' : s === 'partial' ? 'Partial' : s === 'blocked_by_schema' ? 'Schema gap' : 'No data'

  const sourceLabels: CoachSourceLabel[] = [
    { field: 'Sessions today', status: fieldStatuses.sessions as COOFieldStatus, label: statusLabel(fieldStatuses.sessions as COOFieldStatus) },
    { field: 'Wrap-up coverage', status: fieldStatuses.wrapUps as COOFieldStatus, label: statusLabel(fieldStatuses.wrapUps as COOFieldStatus) },
    { field: 'Pending submissions', status: fieldStatuses.pendingSubmissions as COOFieldStatus, label: statusLabel(fieldStatuses.pendingSubmissions as COOFieldStatus) },
  ]

  // ── 12. Confidence ─────────────────────────────────────────────────────────

  const allStatuses = Object.values(fieldStatuses) as COOFieldStatus[]
  const overallStatus = deriveOverallStatus(allStatuses)
  const confidence: DONNAConfidence =
    overallStatus === 'live' ? 'high' : overallStatus === 'partial' ? 'partial' : 'insufficient'

  const isLive = fieldStatuses.sessions === 'live' || fieldStatuses.wrapUps === 'live'

  if (!isLive) return buildDemoContext()

  return {
    todaySessions,
    totalPlayersToday,
    missingWrapUps,
    pendingSubmissions,
    observationDraftsToday,
    activeSessionId,
    activeSessionName,
    sessionSummaries,
    contextItems,
    recommendedActions,
    sourceLabels,
    confidence,
    isLive,
  }
}
