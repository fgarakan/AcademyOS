// Sprint 559 — Player Profile COO Context Integration V1
// Types and builder for player-level COO context shown on player profile.
// Pure TypeScript — no DB calls, no execution.

import type { DONNAConfidence } from './donnaCOOAnswerEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceRiskLevel = 'none' | 'low' | 'moderate' | 'high'
export type ParentUpdateRecency = 'recent' | 'overdue' | 'no_updates' | 'unknown'
export type ReadinessBlocker =
  | 'missing_observations'
  | 'low_attendance'
  | 'pending_director_review'
  | 'parent_concern_unresolved'
  | 'curriculum_not_started'

export interface PlayerCOOContext {
  playerId: string
  attendanceRisk: {
    level: AttendanceRiskLevel
    recentAbsences: number
    absencePeriodDays: number
    confidence: DONNAConfidence
  }
  parentUpdateRecency: {
    status: ParentUpdateRecency
    daysSinceLastUpdate: number | null
    pendingDrafts: number
    confidence: DONNAConfidence
  }
  recentObservations: {
    count: number
    hasPositive: boolean
    hasConcern: boolean
    mostRecentDaysAgo: number | null
    confidence: DONNAConfidence
  }
  readinessBlockers: ReadinessBlocker[]
  nextBestAction: {
    title: string
    reason: string
    actionRoute: string | null
  } | null
}

// ── Risk level helpers ────────────────────────────────────────────────────────

export function getAttendanceRiskLabel(level: AttendanceRiskLevel): string {
  switch (level) {
    case 'none':     return 'No concern'
    case 'low':      return 'Mild concern'
    case 'moderate': return 'Moderate risk'
    case 'high':     return 'High risk'
  }
}

export function getAttendanceRiskColor(level: AttendanceRiskLevel): string {
  switch (level) {
    case 'none':     return 'text-status-green'
    case 'low':      return 'text-status-orange'
    case 'moderate': return 'text-status-orange'
    case 'high':     return 'text-status-red'
  }
}

export function getParentUpdateLabel(status: ParentUpdateRecency): string {
  switch (status) {
    case 'recent':     return 'Up to date'
    case 'overdue':    return 'Overdue'
    case 'no_updates': return 'No updates sent'
    case 'unknown':    return 'Unknown'
  }
}

export function getReadinessBlockerLabel(blocker: ReadinessBlocker): string {
  switch (blocker) {
    case 'missing_observations':       return 'Missing coach observations'
    case 'low_attendance':             return 'Low attendance'
    case 'pending_director_review':    return 'Pending director review'
    case 'parent_concern_unresolved':  return 'Unresolved parent concern'
    case 'curriculum_not_started':     return 'Curriculum not started'
  }
}

// ── Static demo builder (for preview-only use) ────────────────────────────────

export function buildDemoPlayerCOOContext(
  playerId: string,
  overrides?: Partial<PlayerCOOContext>,
): PlayerCOOContext {
  const base: PlayerCOOContext = {
    playerId,
    attendanceRisk: {
      level: 'none',
      recentAbsences: 0,
      absencePeriodDays: 30,
      confidence: 'partial',
    },
    parentUpdateRecency: {
      status: 'unknown',
      daysSinceLastUpdate: null,
      pendingDrafts: 0,
      confidence: 'insufficient',
    },
    recentObservations: {
      count: 0,
      hasPositive: false,
      hasConcern: false,
      mostRecentDaysAgo: null,
      confidence: 'insufficient',
    },
    readinessBlockers: ['missing_observations'],
    nextBestAction: null,
  }
  return { ...base, ...overrides }
}
