// Sprint 1016 — Academy Health Signal Context V1
// Aggregates academy health signals into a DONNA-ready context package.
// Combines KPI availability, curriculum signals, group health, coach support.
// Read-only. No DB writes. No migrations required. Fails safely.

import type { DB } from '@/lib/types/db'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { deriveOverallStatus } from '@/lib/donna/cooDataStatus'
import { getLiveHealthKPIs, getDeferredHealthKPIs } from '@/lib/donna/academyHealthSourceMap'

// ── Output types ──────────────────────────────────────────────────────────────

export type HealthSignalStatus = 'healthy' | 'at_risk' | 'warning' | 'no_data'

export interface AcademyHealthSignal {
  id: string
  label: string
  value: string | number | null
  status: HealthSignalStatus
  source: string
  sourceStatus: COOFieldStatus
  riskNote: string | null
}

export interface AcademyKPIAvailabilitySummary {
  liveCount: number
  deferredCount: number
  liveLabels: string[]
  deferredLabels: string[]
}

export interface AcademyHealthContextPackage {
  // Overall health
  overallStatus: HealthSignalStatus
  overallLabel: string
  // Signals
  signals: AcademyHealthSignal[]
  // KPI availability
  kpiAvailability: AcademyKPIAvailabilitySummary
  // Top concerns (tagged curriculum signals)
  topCurriculumConcerns: Array<{ tag: string; count: number }>
  // Coach health
  coachesNeedingSupport: number
  // Group health
  groupsAtRisk: number
  totalActiveGroups: number
  // Summary text
  summaryText: string
  // Meta
  confidence: DONNAConfidence
  isLive: boolean
}

// ── Demo fallback ─────────────────────────────────────────────────────────────

function buildDemoPackage(): AcademyHealthContextPackage {
  const liveKPIs = getLiveHealthKPIs()
  const deferredKPIs = getDeferredHealthKPIs()

  return {
    overallStatus: 'warning',
    overallLabel: 'Demo data — connect live academy for real signals',
    signals: [
      { id: 'sessions_today', label: 'Sessions today', value: 5, status: 'healthy', source: 'sessions', sourceStatus: 'insufficient_data', riskNote: null },
      { id: 'pending_reviews', label: 'Pending reviews', value: 3, status: 'warning', source: 'proposed_actions', sourceStatus: 'insufficient_data', riskNote: 'Director action needed' },
      { id: 'missing_wrapups', label: 'Missing wrap-ups', value: 2, status: 'warning', source: 'proposed_actions', sourceStatus: 'insufficient_data', riskNote: 'Coaches need to complete wrap-ups' },
    ],
    kpiAvailability: {
      liveCount: liveKPIs.length,
      deferredCount: deferredKPIs.length,
      liveLabels: liveKPIs.map(k => k.label),
      deferredLabels: deferredKPIs.map(k => k.label),
    },
    topCurriculumConcerns: [
      { tag: 'forehand', count: 4 },
      { tag: 'serve', count: 3 },
    ],
    coachesNeedingSupport: 1,
    groupsAtRisk: 1,
    totalActiveGroups: 4,
    summaryText: 'Demo data — 5 sessions, 3 pending reviews, 2 missing wrap-ups. Live academy data not available.',
    confidence: 'insufficient',
    isLive: false,
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export async function loadAcademyHealthContext(
  db: DB,
  academyId: string,
): Promise<AcademyHealthContextPackage> {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const fieldStatuses: Record<string, COOFieldStatus> = {}
  const signals: AcademyHealthSignal[] = []

  // ── 1. Today's session count ───────────────────────────────────────────────

  let sessionCount = 0

  try {
    const { count } = await db
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('scheduled_date', today)

    sessionCount = count ?? 0
    fieldStatuses.sessions = 'live'

    signals.push({
      id: 'sessions_today',
      label: 'Sessions today',
      value: sessionCount,
      status: sessionCount > 0 ? 'healthy' : 'no_data',
      source: 'sessions table',
      sourceStatus: 'live',
      riskNote: null,
    })
  } catch {
    fieldStatuses.sessions = 'insufficient_data'
  }

  // ── 2. Pending reviews ─────────────────────────────────────────────────────

  let pendingReviews = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    pendingReviews = count ?? 0
    fieldStatuses.reviewQueue = 'live'

    signals.push({
      id: 'pending_reviews',
      label: 'Pending reviews',
      value: pendingReviews,
      status: pendingReviews === 0 ? 'healthy' : pendingReviews >= 10 ? 'at_risk' : 'warning',
      source: 'proposed_actions table',
      sourceStatus: 'live',
      riskNote: pendingReviews > 0 ? 'Director action needed' : null,
    })
  } catch {
    fieldStatuses.reviewQueue = 'insufficient_data'
  }

  // ── 3. Coach support signals ───────────────────────────────────────────────

  let coachesNeedingSupport = 0

  try {
    const thirtyDaysAgoDate = thirtyDaysAgo.slice(0, 10)

    const { data: memberships } = await db
      .from('academy_memberships')
      .select('profile_id')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .in('role', ['head_coach', 'coach'])

    const coachIds = (memberships ?? []).map(m => m.profile_id)

    if (coachIds.length > 0) {
      const { data: coachSessions } = await db
        .from('sessions')
        .select('id, coach_id')
        .eq('academy_id', academyId)
        .gte('scheduled_date', thirtyDaysAgoDate)
        .in('coach_id', coachIds)

      const sessionsByCoach = new Map<string, number>()
      for (const s of coachSessions ?? []) {
        sessionsByCoach.set(s.coach_id, (sessionsByCoach.get(s.coach_id) ?? 0) + 1)
      }

      const { data: wrapUps } = await db
        .from('proposed_actions')
        .select('proposed_by_id')
        .eq('academy_id', academyId)
        .eq('target_module', 'session_wrap_up_v1')
        .in('status', ['pending_review', 'approved'])
        .in('proposed_by_id', coachIds)
        .gte('created_at', thirtyDaysAgo)

      const wrapUpsByCoach = new Map<string, number>()
      for (const w of wrapUps ?? []) {
        wrapUpsByCoach.set(w.proposed_by_id, (wrapUpsByCoach.get(w.proposed_by_id) ?? 0) + 1)
      }

      for (const coachId of coachIds) {
        const sessions = sessionsByCoach.get(coachId) ?? 0
        const wraps = wrapUpsByCoach.get(coachId) ?? 0
        if (sessions > 0 && wraps === 0) coachesNeedingSupport++
      }
    }

    fieldStatuses.coachSupport = coachIds.length > 0 ? 'live' : 'insufficient_data'

    if (coachesNeedingSupport > 0) {
      signals.push({
        id: 'coaches_needing_support',
        label: 'Coaches with no recent wrap-ups',
        value: coachesNeedingSupport,
        status: coachesNeedingSupport >= 2 ? 'at_risk' : 'warning',
        source: 'sessions + proposed_actions',
        sourceStatus: 'live',
        riskNote: 'Missing wrap-ups block player record updates',
      })
    }
  } catch {
    fieldStatuses.coachSupport = 'insufficient_data'
  }

  // ── 4. Group health (active groups with players) ───────────────────────────

  let totalActiveGroups = 0
  let groupsAtRisk = 0

  try {
    const { data: groups } = await db
      .from('groups')
      .select('id, name')
      .eq('academy_id', academyId)
      .eq('is_active', true)

    totalActiveGroups = (groups ?? []).length

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    for (const group of groups ?? []) {
      const { count: recentSessions } = await db
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('group_id', group.id)
        .gte('scheduled_date', sevenDaysAgo)

      if ((recentSessions ?? 0) === 0) groupsAtRisk++
    }

    fieldStatuses.groupHealth = totalActiveGroups > 0 ? 'live' : 'insufficient_data'

    if (groupsAtRisk > 0) {
      signals.push({
        id: 'groups_no_recent_sessions',
        label: 'Groups with no sessions in 7 days',
        value: groupsAtRisk,
        status: groupsAtRisk >= 2 ? 'at_risk' : 'warning',
        source: 'groups + sessions',
        sourceStatus: 'live',
        riskNote: 'Groups may be inactive or unscheduled',
      })
    }
  } catch {
    fieldStatuses.groupHealth = 'insufficient_data'
  }

  // ── 5. Curriculum concerns (tagged observations) ───────────────────────────

  const topCurriculumConcerns: Array<{ tag: string; count: number }> = []

  try {
    const { data: taggedObs } = await db
      .from('coach_observations')
      .select('tags')
      .eq('academy_id', academyId)
      .eq('observation_type', 'concern')
      .not('tags', 'is', null)
      .gte('created_at', thirtyDaysAgo)

    const tagCount = new Map<string, number>()
    for (const obs of taggedObs ?? []) {
      for (const tag of obs.tags ?? []) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
      }
    }

    const sorted = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))

    topCurriculumConcerns.push(...sorted)

    fieldStatuses.curriculum = taggedObs && taggedObs.length > 0 ? 'partial' : 'insufficient_data'

    if (topCurriculumConcerns.length > 0) {
      signals.push({
        id: 'curriculum_concerns',
        label: 'Top curriculum concern',
        value: topCurriculumConcerns[0]?.tag ?? null,
        status: 'warning',
        source: 'coach_observations (tagged)',
        sourceStatus: 'partial',
        riskNote: 'Based on tagged concern observations — full curriculum gate data pending migration',
      })
    }
  } catch {
    fieldStatuses.curriculum = 'insufficient_data'
  }

  // ── 6. KPI availability summary ───────────────────────────────────────────

  const liveKPIs = getLiveHealthKPIs()
  const deferredKPIs = getDeferredHealthKPIs()
  const kpiAvailability: AcademyKPIAvailabilitySummary = {
    liveCount: liveKPIs.length,
    deferredCount: deferredKPIs.length,
    liveLabels: liveKPIs.map(k => k.label),
    deferredLabels: deferredKPIs.map(k => k.label),
  }

  // ── 7. Overall status ──────────────────────────────────────────────────────

  const allStatuses = Object.values(fieldStatuses) as COOFieldStatus[]
  const derivedStatus = deriveOverallStatus(allStatuses)

  const atRiskSignals = signals.filter(s => s.status === 'at_risk').length
  const warnSignals = signals.filter(s => s.status === 'warning').length

  const overallStatus: HealthSignalStatus =
    atRiskSignals > 0 ? 'at_risk' : warnSignals > 0 ? 'warning' : signals.length > 0 ? 'healthy' : 'no_data'

  const overallLabel =
    overallStatus === 'at_risk'
      ? `${atRiskSignals} at-risk signal${atRiskSignals !== 1 ? 's' : ''} — immediate attention needed`
      : overallStatus === 'warning'
      ? `${warnSignals} signal${warnSignals !== 1 ? 's' : ''} to monitor`
      : overallStatus === 'healthy'
      ? 'All signals normal'
      : 'No health signals available'

  // ── 8. Summary text ────────────────────────────────────────────────────────

  const parts: string[] = []
  if (sessionCount > 0) parts.push(`${sessionCount} session${sessionCount !== 1 ? 's' : ''} today`)
  if (pendingReviews > 0) parts.push(`${pendingReviews} pending review${pendingReviews !== 1 ? 's' : ''}`)
  if (coachesNeedingSupport > 0) parts.push(`${coachesNeedingSupport} coach${coachesNeedingSupport !== 1 ? 'es' : ''} with no wrap-ups`)
  if (groupsAtRisk > 0) parts.push(`${groupsAtRisk} group${groupsAtRisk !== 1 ? 's' : ''} with no recent sessions`)
  if (topCurriculumConcerns.length > 0) parts.push(`Top concern: ${topCurriculumConcerns[0].tag}`)

  const summaryText = parts.length > 0 ? parts.join('. ') + '.' : 'No signals available.'

  // ── 9. Confidence ──────────────────────────────────────────────────────────

  const confidence: DONNAConfidence =
    derivedStatus === 'live' ? 'high' : derivedStatus === 'partial' ? 'partial' : 'insufficient'

  const isLive = fieldStatuses.sessions === 'live' || fieldStatuses.reviewQueue === 'live'

  if (!isLive) return buildDemoPackage()

  return {
    overallStatus,
    overallLabel,
    signals,
    kpiAvailability,
    topCurriculumConcerns,
    coachesNeedingSupport,
    groupsAtRisk,
    totalActiveGroups,
    summaryText,
    confidence,
    isLive,
  }
}
