// Curriculum Coverage KPI Engine — Sprint 425
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object data from the calling server action.
//
// KPIs implemented:
//   KPI 25 — Session Development Yield       (demo — directly computable per player)
//   KPI 17 — Curriculum Coverage by Group    (insufficient_data — migration 062 pending)
//   KPI 18 — Session Plan Completion Rate    (insufficient_data — Sprint 48 localStorage gap)
//   KPI 20 — Coach Plan Alignment Score      (insufficient_data — same as KPI 18)
//
// KPIs 17, 18, 20 are blocked by infrastructure gaps and return honest
// insufficient_data results. KPI 25 is directly computable from session_attendance
// and coach_observations. It is the only curriculum-adjacent KPI that can be
// surfaced per-player in the DONNA player progress summary.

import { type KpiResult, type KpiStatus } from './kpiTypes'
import { formatRateDisplay } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface YieldInput {
  playerId: string
  // Session IDs the player attended in the window (from session_attendance, status = present/attended/late)
  attendedSessionIds: string[]
  // Session IDs where a coach observation was recorded for this player in the window
  observedSessionIds: string[]
  windowDays?: number
}

// ---------------------------------------------------------------------------
// Blocked KPI stubs — KPIs 17, 18, 20
//
// These cannot be computed without infrastructure changes. They are returned
// as KpiResult with status = 'insufficient_data' so DONNA can explain the gap.
// ---------------------------------------------------------------------------

export function computeCurriculumCoverageStub(): KpiResult {
  return {
    kpiId: 17,
    name: 'Curriculum Coverage by Group',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Curriculum coverage by group cannot be computed — the class template to curriculum drill linkage is not yet seeded. Migration 062 must be applied to the live database, and curriculum content must be seeded through Sprints 129–131.',
    caveat:
      'Blocked by: (1) migration 062 pending live DB, (2) class template → curriculum drill content not yet linked.',
  }
}

export function computeSessionPlanCompletionStub(): KpiResult {
  return {
    kpiId: 18,
    name: 'Session Plan Completion Rate',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Session plan completion rate cannot be reliably computed — session block status updates are stored in localStorage by coaches and are not yet persisted to the database (Sprint 48 gap).',
    caveat:
      'Blocked by: session_blocks.actual_status written from localStorage only, not persisted to DB. The DB column exists but reflects default/planned status for most sessions.',
  }
}

export function computeCoachPlanAlignmentStub(): KpiResult {
  return {
    kpiId: 20,
    name: 'Coach Plan Alignment Score',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Coach plan alignment cannot be computed — blocked by the same session block status persistence gap as Session Plan Completion Rate (Sprint 48).',
    caveat: 'Blocked by: session_blocks.actual_status not reliably persisted to DB.',
  }
}

// ---------------------------------------------------------------------------
// KPI 25 — Session Development Yield
//
// Status: demo
// Of sessions the player attended in the window, what percentage had at least
// one coach observation recorded for that player?
//
// Low yield → coaches are attending sessions but not logging observations.
// High yield → coaching coverage is active and recorded.
// ---------------------------------------------------------------------------

export function computeSessionYield(input: YieldInput): KpiResult {
  const { attendedSessionIds, observedSessionIds, windowDays = 30 } = input
  const status: KpiStatus = 'demo'

  if (attendedSessionIds.length === 0) {
    return {
      kpiId: 25,
      name: 'Session Development Yield',
      status,
      value: null,
      displayText: `No attended sessions recorded in the last ${windowDays} days — yield not computable.`,
      caveat: 'Yield requires at least one attendance record with present/attended/late status.',
    }
  }

  const observedSet = new Set(observedSessionIds)
  const attendedWithObservation = attendedSessionIds.filter(id => observedSet.has(id)).length
  const total = attendedSessionIds.length
  const pct = Math.round((attendedWithObservation / total) * 100)

  const displayText = formatRateDisplay(
    attendedWithObservation,
    total,
    'attended sessions with a coach observation',
    `last ${windowDays} days`,
  )

  return {
    kpiId: 25,
    name: 'Session Development Yield',
    status,
    value: pct,
    denominator: total,
    displayText,
    caveat:
      'Demo — counts sessions where at least one coach_observations row exists for this player. No minimum observation quality required.',
  }
}

// ---------------------------------------------------------------------------
// formatSessionYieldForDonna
//
// Converts KPI 25 result to DONNA output lines.
// KPIs 17, 18, 20 stubs are not surfaced in the per-player summary —
// they are group/session-level KPIs deferred to a group summary action.
// ---------------------------------------------------------------------------

export function formatSessionYieldForDonna(result: KpiResult): string[] {
  const statusTag =
    result.status === 'live'
      ? '[live]'
      : result.status === 'partial'
      ? '[partial]'
      : result.status === 'demo'
      ? '[demo]'
      : '[insufficient data]'

  const lines: string[] = [
    '',
    `SESSION YIELD ${statusTag}: ${result.displayText}`,
  ]

  if (result.caveat && result.status !== 'live') {
    lines.push(`  ↳ ${result.caveat}`)
  }

  return lines
}
