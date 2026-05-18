// Sprint 1012 — Director Context Aggregator V1
// Aggregates all director-visible DONNA context from live sources.
// Read-only. No DB writes. No migrations required. Fails safely with demo fallback.

import type { DB } from '@/lib/types/db'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { deriveOverallStatus } from '@/lib/donna/cooDataStatus'

// ── Output types ──────────────────────────────────────────────────────────────

export type AttentionRisk = 'high' | 'medium' | 'low'

export interface DirectorAttentionItem {
  playerId: string | null
  playerName: string | null
  reason: string
  risk: AttentionRisk
  source: 'observation' | 'attendance' | 'wrap_up' | 'manual'
}

export interface DirectorAcademyRisk {
  signal: string
  detail: string
  urgency: 'high' | 'medium' | 'low'
  actionHref?: string
}

export interface DirectorRecommendedAction {
  id: string
  label: string
  reason: string
  href: string
  category: 'review' | 'approve' | 'investigate' | 'communicate'
}

export interface DirectorSourceLabel {
  field: string
  status: COOFieldStatus
  label: string
}

export interface DirectorDonnaContext {
  // Counts
  pendingReviews: number
  missingWrapUps: number
  templateDrafts: number
  attendanceExceptions: number
  evidenceDrafts: number
  todaySessions: number
  // Lists
  attentionItems: DirectorAttentionItem[]
  curriculumGaps: string[]
  academyRisks: DirectorAcademyRisk[]
  recommendedActions: DirectorRecommendedAction[]
  // Meta
  sourceLabels: DirectorSourceLabel[]
  confidence: DONNAConfidence
  isLive: boolean
}

// ── Demo fallback ─────────────────────────────────────────────────────────────

function buildDemoContext(): DirectorDonnaContext {
  return {
    pendingReviews: 3,
    missingWrapUps: 2,
    templateDrafts: 1,
    attendanceExceptions: 2,
    evidenceDrafts: 4,
    todaySessions: 5,
    attentionItems: [
      {
        playerId: null,
        playerName: 'Demo Player A',
        reason: '3 concern observations in last 30 days',
        risk: 'high',
        source: 'observation',
      },
      {
        playerId: null,
        playerName: 'Demo Player B',
        reason: '2 absences in last 7 days',
        risk: 'medium',
        source: 'attendance',
      },
    ],
    curriculumGaps: [
      'Level 2 — forehand consistency (3 players stalled)',
      'Level 3 — serve mechanics (bottleneck, 2 sessions flagged)',
    ],
    academyRisks: [
      {
        signal: 'Wrap-up gap',
        detail: '2 coaches have not submitted wrap-ups for today',
        urgency: 'medium',
        actionHref: '/director/review',
      },
      {
        signal: 'Pending reviews',
        detail: '3 items awaiting director decision',
        urgency: 'high',
        actionHref: '/director/review',
      },
    ],
    recommendedActions: [
      {
        id: 'review_pending',
        label: 'Review pending items',
        reason: '3 items need director decision',
        href: '/director/review',
        category: 'review',
      },
      {
        id: 'chase_wrapups',
        label: 'Follow up on missing wrap-ups',
        reason: '2 coaches still outstanding',
        href: '/director/sessions',
        category: 'investigate',
      },
    ],
    sourceLabels: [
      { field: 'Review queue', status: 'insufficient_data', label: 'Demo data' },
      { field: 'Sessions', status: 'insufficient_data', label: 'Demo data' },
      { field: 'Attention flags', status: 'insufficient_data', label: 'Demo data' },
    ],
    confidence: 'insufficient',
    isLive: false,
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export async function loadDirectorDonnaContext(
  db: DB,
  academyId: string,
): Promise<DirectorDonnaContext> {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const fieldStatuses: Record<string, COOFieldStatus> = {}

  // ── 1. Today's sessions ───────────────────────────────────────────────────

  let todaySessions = 0
  let sessionIds: string[] = []

  try {
    const { data: sessRows } = await db
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .eq('scheduled_date', today)

    sessionIds = (sessRows ?? []).map(s => s.id)
    todaySessions = sessionIds.length
    fieldStatuses.sessions = todaySessions > 0 ? 'live' : 'insufficient_data'
  } catch {
    fieldStatuses.sessions = 'insufficient_data'
  }

  // ── 2. Pending reviews ────────────────────────────────────────────────────

  let pendingReviews = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    pendingReviews = count ?? 0
    fieldStatuses.reviewQueue = 'live'
  } catch {
    fieldStatuses.reviewQueue = 'insufficient_data'
  }

  // ── 3. Missing wrap-ups (sessions today without a wrap-up proposed action) ─

  let missingWrapUps = 0

  try {
    if (sessionIds.length > 0) {
      const { data: wrapUpRows } = await db
        .from('proposed_actions')
        .select('target_object_id')
        .eq('academy_id', academyId)
        .eq('target_module', 'session_wrap_up_v1')
        .in('status', ['pending_review', 'approved'])
        .in('target_object_id', sessionIds)

      const wrappedSessionIds = new Set<string>()
      for (const row of wrapUpRows ?? []) {
        if (row.target_object_id) wrappedSessionIds.add(row.target_object_id)
      }

      missingWrapUps = sessionIds.filter(id => !wrappedSessionIds.has(id)).length
    }
    fieldStatuses.wrapUps = 'live'
  } catch {
    fieldStatuses.wrapUps = 'insufficient_data'
  }

  // ── 4. Attendance exceptions ───────────────────────────────────────────────

  let attendanceExceptions = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('target_module', 'attendance')
      .eq('status', 'pending_review')

    attendanceExceptions = count ?? 0
    fieldStatuses.attendance = 'live'
  } catch {
    fieldStatuses.attendance = 'insufficient_data'
  }

  // ── 5. Evidence and template drafts ───────────────────────────────────────

  let evidenceDrafts = 0
  let templateDrafts = 0

  try {
    const { data: draftRows } = await db
      .from('proposed_actions')
      .select('target_module')
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    for (const row of draftRows ?? []) {
      const tm = row.target_module ?? ''
      if (tm.includes('curriculum_evidence') || tm.includes('evidence')) evidenceDrafts++
      if (tm.includes('template')) templateDrafts++
    }

    fieldStatuses.drafts = 'live'
  } catch {
    fieldStatuses.drafts = 'insufficient_data'
  }

  // ── 6. Attention items (concern observations + absences) ───────────────────

  const attentionItems: DirectorAttentionItem[] = []
  const concernsByPlayer = new Map<string, number>()
  const absencesByPlayer = new Map<string, number>()

  try {
    const { data: concernObs } = await db
      .from('coach_observations')
      .select('player_id')
      .eq('academy_id', academyId)
      .eq('observation_type', 'concern')
      .gte('created_at', thirtyDaysAgo)

    for (const obs of concernObs ?? []) {
      concernsByPlayer.set(obs.player_id, (concernsByPlayer.get(obs.player_id) ?? 0) + 1)
    }

    const { data: recentSessionRows } = await db
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .gte('scheduled_date', sevenDaysAgoDate)

    const recentIds = (recentSessionRows ?? []).map(s => s.id)

    if (recentIds.length > 0) {
      const { data: absenceRows } = await db
        .from('session_attendance')
        .select('player_id')
        .in('session_id', recentIds)
        .neq('status', 'present')

      for (const row of absenceRows ?? []) {
        absencesByPlayer.set(row.player_id, (absencesByPlayer.get(row.player_id) ?? 0) + 1)
      }
    }

    const concernIds = Array.from(concernsByPlayer.keys())
    const absenceIds = Array.from(absencesByPlayer.keys())
    const flaggedIds = Array.from(new Set([...concernIds, ...absenceIds]))

    if (flaggedIds.length > 0) {
      const { data: playerRows } = await db
        .from('players')
        .select('id, first_name, last_name')
        .in('id', flaggedIds)

      const nameMap = new Map<string, string>()
      for (const p of playerRows ?? []) {
        nameMap.set(p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Player')
      }

      for (const pid of flaggedIds) {
        const concerns = concernsByPlayer.get(pid) ?? 0
        const absences = absencesByPlayer.get(pid) ?? 0
        const risk: AttentionRisk =
          concerns > 2 || absences > 3 ? 'high' : concerns > 0 || absences > 1 ? 'medium' : 'low'

        if (concerns > 0) {
          attentionItems.push({
            playerId: pid,
            playerName: nameMap.get(pid) ?? null,
            reason: `${concerns} concern observation${concerns !== 1 ? 's' : ''} in last 30 days`,
            risk,
            source: 'observation',
          })
        } else {
          attentionItems.push({
            playerId: pid,
            playerName: nameMap.get(pid) ?? null,
            reason: `${absences} absence${absences !== 1 ? 's' : ''} in last 7 days`,
            risk,
            source: 'attendance',
          })
        }
      }

      const RISK_ORDER: Record<AttentionRisk, number> = { high: 0, medium: 1, low: 2 }
      attentionItems.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])
    }

    fieldStatuses.attentionItems = attentionItems.length > 0 ? 'live' : 'insufficient_data'
  } catch {
    fieldStatuses.attentionItems = 'insufficient_data'
  }

  // ── 7. Curriculum gaps (blocked — schema gap) ─────────────────────────────

  const curriculumGaps: string[] = []
  fieldStatuses.curriculum = 'blocked_by_schema'

  // ── 8. Academy risks ───────────────────────────────────────────────────────

  const academyRisks: DirectorAcademyRisk[] = []

  if (pendingReviews > 0) {
    academyRisks.push({
      signal: 'Pending reviews',
      detail: `${pendingReviews} item${pendingReviews !== 1 ? 's' : ''} awaiting director decision`,
      urgency: pendingReviews >= 5 ? 'high' : 'medium',
      actionHref: '/director/review',
    })
  }

  if (missingWrapUps > 0) {
    academyRisks.push({
      signal: 'Missing wrap-ups',
      detail: `${missingWrapUps} session${missingWrapUps !== 1 ? 's' : ''} without a coach wrap-up`,
      urgency: missingWrapUps >= 3 ? 'high' : 'medium',
      actionHref: '/director/sessions',
    })
  }

  if (attendanceExceptions > 0) {
    academyRisks.push({
      signal: 'Attendance exceptions',
      detail: `${attendanceExceptions} exception${attendanceExceptions !== 1 ? 's' : ''} need confirmation`,
      urgency: attendanceExceptions >= 3 ? 'high' : 'low',
      actionHref: '/director/review',
    })
  }

  const highRiskPlayers = attentionItems.filter(a => a.risk === 'high').length
  if (highRiskPlayers > 0) {
    academyRisks.push({
      signal: 'Player attention needed',
      detail: `${highRiskPlayers} player${highRiskPlayers !== 1 ? 's' : ''} flagged as high risk`,
      urgency: 'high',
      actionHref: '/director/players',
    })
  }

  const URGENCY_ORDER = { high: 0, medium: 1, low: 2 }
  academyRisks.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])

  // ── 9. Recommended actions ─────────────────────────────────────────────────

  const recommendedActions: DirectorRecommendedAction[] = []

  if (pendingReviews > 0) {
    recommendedActions.push({
      id: 'review_pending',
      label: `Review ${pendingReviews} pending item${pendingReviews !== 1 ? 's' : ''}`,
      reason: 'Coaches and players are waiting on director decisions',
      href: '/director/review',
      category: 'review',
    })
  }

  if (missingWrapUps > 0) {
    recommendedActions.push({
      id: 'chase_wrapups',
      label: `Follow up on ${missingWrapUps} missing wrap-up${missingWrapUps !== 1 ? 's' : ''}`,
      reason: 'Sessions without wrap-ups cannot feed player records',
      href: '/director/sessions',
      category: 'investigate',
    })
  }

  if (highRiskPlayers > 0) {
    recommendedActions.push({
      id: 'check_at_risk',
      label: `Check ${highRiskPlayers} at-risk player${highRiskPlayers !== 1 ? 's' : ''}`,
      reason: 'High-risk flags require director awareness',
      href: '/director/players',
      category: 'investigate',
    })
  }

  if (evidenceDrafts > 0) {
    recommendedActions.push({
      id: 'approve_evidence',
      label: `Review ${evidenceDrafts} evidence draft${evidenceDrafts !== 1 ? 's' : ''}`,
      reason: 'Curriculum evidence links need director approval',
      href: '/director/review',
      category: 'approve',
    })
  }

  // ── 10. Source labels ──────────────────────────────────────────────────────

  const statusLabel = (s: COOFieldStatus) =>
    s === 'live' ? 'Live' : s === 'partial' ? 'Partial' : s === 'blocked_by_schema' ? 'Schema gap' : 'No data'

  const sourceLabels: DirectorSourceLabel[] = [
    { field: 'Sessions today', status: fieldStatuses.sessions as COOFieldStatus, label: statusLabel(fieldStatuses.sessions as COOFieldStatus) },
    { field: 'Review queue', status: fieldStatuses.reviewQueue as COOFieldStatus, label: statusLabel(fieldStatuses.reviewQueue as COOFieldStatus) },
    { field: 'Wrap-up coverage', status: fieldStatuses.wrapUps as COOFieldStatus, label: statusLabel(fieldStatuses.wrapUps as COOFieldStatus) },
    { field: 'Attendance exceptions', status: fieldStatuses.attendance as COOFieldStatus, label: statusLabel(fieldStatuses.attendance as COOFieldStatus) },
    { field: 'Attention flags', status: fieldStatuses.attentionItems as COOFieldStatus, label: statusLabel(fieldStatuses.attentionItems as COOFieldStatus) },
    { field: 'Curriculum gaps', status: 'blocked_by_schema', label: 'Migration pending' },
  ]

  // ── 11. Confidence and isLive ──────────────────────────────────────────────

  const allStatuses = Object.values(fieldStatuses) as COOFieldStatus[]
  const overallStatus = deriveOverallStatus(allStatuses)
  const confidence: DONNAConfidence =
    overallStatus === 'live' ? 'high' : overallStatus === 'partial' ? 'partial' : 'insufficient'

  const isLive =
    fieldStatuses.reviewQueue === 'live' || fieldStatuses.sessions === 'live'

  if (!isLive) return buildDemoContext()

  return {
    pendingReviews,
    missingWrapUps,
    templateDrafts,
    attendanceExceptions,
    evidenceDrafts,
    todaySessions,
    attentionItems,
    curriculumGaps,
    academyRisks,
    recommendedActions,
    sourceLabels,
    confidence,
    isLive,
  }
}
