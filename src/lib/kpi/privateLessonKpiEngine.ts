// Private Lesson Conversion and Makeup KPI Engine — Sprint 430
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
//
// KPIs implemented:
//   KPI 11 — Private Lesson Conversion     (insufficient_data — gap G2)
//   Makeup  — Makeup Session Signal        (insufficient_data — no makeup type field)
//
// KPI 11 is insufficient_data: there is no FK from private_lesson_requests to
//   session_attendance. Cannot determine whether a lesson request resulted in
//   an attended session. Blocked by data model gap G2.
//
// Makeup: session_attendance has no session_type or makeup_flag column. There is
//   no way to distinguish a makeup session from a regular session in another group.
//   Cannot be computed without a schema change.

import { type KpiResult } from './kpiTypes'

// ---------------------------------------------------------------------------
// KPI 11 stub — Private Lesson Conversion
//
// Status: insufficient_data
// Cannot be computed without private_lesson_requests.triggered_by_session_id (gap G2).
// ---------------------------------------------------------------------------

export function computePrivateLessonConversionStub(): KpiResult {
  return {
    kpiId: 11,
    name: 'Private Lesson Conversion',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Private lesson conversion cannot be computed — there is no link from lesson requests to attended sessions. The private_lesson_requests table lacks a triggered_by_session_id foreign key.',
    caveat:
      'Blocked by data model gap G2: private_lesson_requests.triggered_by_session_id (FK to session_attendance) is missing. Requires a migration — stop and confirm with Farshad before adding.',
  }
}

// ---------------------------------------------------------------------------
// Makeup Session Signal stub
//
// Status: insufficient_data
// Cannot be computed: session_attendance has no session_type or makeup_flag column.
// There is no way to detect makeup attendance vs. regular attendance in a different group.
// ---------------------------------------------------------------------------

export function computeMakeupSessionStub(): KpiResult {
  return {
    kpiId: 11,
    name: 'Makeup Session Signal',
    status: 'insufficient_data',
    value: null,
    displayText:
      'Makeup attendance cannot be tracked — session_attendance has no session_type or makeup_flag column. A makeup session is indistinguishable from regular attendance in a different group.',
    caveat:
      'Blocked by schema gap: session_attendance lacks a session_type or makeup_flag field. Requires a migration — stop and confirm with Farshad before adding.',
  }
}

// ---------------------------------------------------------------------------
// formatPrivateLessonForDonna
//
// Returns empty array — both KPIs are insufficient_data and should not appear
// in DONNA's player summary.
// ---------------------------------------------------------------------------

export function formatPrivateLessonForDonna(): string[] {
  return []
}
