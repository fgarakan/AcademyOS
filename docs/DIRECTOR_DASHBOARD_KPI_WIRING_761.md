# Sprint 761 — Director Dashboard KPI Wiring V1

**Date:** 2026-05-24
**Sprint:** 761
**Status:** Complete

---

## Summary

Wired the formal KPI health framework (`src/lib/kpis/academyKpiModel.ts`) into the director home page (`/director`) as a new `DirectorKpiHealthSection` component, rendered below the existing 8-card `AcademyKpiCardsSection`.

The new section renders all 12 academy KPIs grouped into 4 health domains with honest data provenance labels and proper health-status color coding (healthy / warning / critical / no_data).

---

## Source KPI module used

**Primary:** `src/lib/kpis/academyKpiModel.ts`

| Export used | Purpose |
|---|---|
| `ACADEMY_KPI_META` | KPI labels, descriptions, thresholds, unit, polarity |
| `computeKpiStatus()` | Determines healthy/warning/critical from value + thresholds |
| `formatKpiValue()` | Formats numbers as `%`, count, or ratio |
| `buildKpiValue()` | Builds typed `KpiValue` from id + raw number |
| `getOverallAcademyHealth()` | Derives overall status from all available KpiValues |

**Secondary (inspected, not wired):** `src/lib/director/kpiDashboard.ts`

`kpiDashboard.ts` requires `KpiResult[]` with **numeric KPI IDs** produced by the KPI engines (attendanceKpiEngine, coachExecutionKpiEngine, etc.). Those engines accept pre-fetched DB data and produce honest four-tier labels (live/partial/demo/insufficient_data). Wiring them to the director page requires additional DB queries per engine — deferred to Sprint 762.

---

## Director dashboard component wired

**Component created:** `src/app/director/_components/DirectorKpiHealthSection.tsx`

**Route modified:** `src/app/director/page.tsx`

The `DirectorKpiHealthSection` is rendered between the 8-card overview grid (`AcademyKpiCardsSection`) and the health chart/live activity row.

---

## KPI groups and cards displayed

### Attendance & Engagement
| KPI | Status | Data source |
|---|---|---|
| Attendance Rate | `no_data` | Requires session_attendance rollup |
| Level Readiness Queue | **live** | `player_curriculum_states.advancement_eligible` — director page query |
| Progress Velocity | `no_data` | Requires 60 days of evidence progression |

### Coach Operations
| KPI | Status | Data source |
|---|---|---|
| Recap Completion | `no_data` | Requires completed-session vs. recapped-session ratio |
| Coach Follow-Through | `no_data` | Requires priority `addressed_at` tracking |

### Development Health
| KPI | Status | Data source |
|---|---|---|
| Curriculum Coverage | **partial (proxy)** | `playersWithLevel / activePlayers * 100` — directionally correct; true coverage requires evidence records |
| Player Priority Coverage | `no_data` | Requires player priorities rollup query |
| Mental Performance Coverage | `no_data` | Requires mental performance pathway tagging |

### Retention & Growth
| KPI | Status | Data source |
|---|---|---|
| Parent Summary Freshness | `no_data` | Requires parent summary update timestamps |
| Template Usage Rate | `no_data` | Requires sessions-with-template ratio |
| Badge Progress Rate | `no_data` | Badge system not yet wired to live data |

---

## Data status summary

| Provenance | Count | KPIs |
|---|---|---|
| **live** | 1 | `level_readiness_queue_size` |
| **partial (proxy)** | 1 | `curriculum_coverage` |
| **no_data** | 10 | All others — waiting for KPI engine wiring |

No fake or fabricated precision is shown. KPIs without computable values display "Collecting data" and direct the director to `/director/kpi` for per-player signals that are already live.

---

## Fallback behavior

- KPIs with `no_data` status show a calm "Collecting data" italic label instead of a number
- The overall health badge shows "Ready for live data" when no KpiValues have data
- When at least one KPI has data, the overall health badge reflects actual health status
- A footer explains the three data provenance states (live / proxy / collecting data)
- A "Full analysis →" link leads to `/director/kpi` (per-player KPI table, already built)

---

## Files intentionally not staged

| File | Reason |
|---|---|
| `docs/SPRINT_398_MANUAL_SQL_EXECUTION_PACKET.md` | Pre-existing modified file, unrelated to Sprint 761 |
| `src/app/api/director/interview/realtime-session/route.ts` | Pre-existing modified file, unrelated to Sprint 761 |
| `src/components/assistant/DonnaAssistantButton.tsx` | Contains uncommitted Sprint 761-labeled DONNA changes (operator step advancement) — unrelated to KPI wiring; must be committed in a dedicated DONNA sprint |

---

## Remaining dashboard wiring gaps

| Module | Gap | Next sprint |
|---|---|---|
| `kpiDashboard.ts` | Requires `KpiResult[]` from KPI engines — engines need DB data | Sprint 762 |
| `attendanceKpiEngine.ts` | `attendance_rate`, `missed-session streak`, `absences-30d` | Sprint 762 |
| `coachExecutionKpiEngine.ts` | `recap_completion_rate`, observation quality | Sprint 762 |
| `curriculumCoverageKpiEngine.ts` | True curriculum evidence coverage % | Sprint 762 |
| `attentionQueue/` | `/director` hero section wiring | Future sprint |
| `groupIntelligence.ts` | `/director/groups` | Future sprint |

---

## Recommended Sprint 762

**Sprint 762 — Director Dashboard KPI Engine Live Wiring V1**

Goal: Wire the KPI engines (attendanceKpiEngine, coachExecutionKpiEngine, curriculumCoverageKpiEngine) into the director page or a dedicated server action. Produce `KpiResult[]` with honest four-tier status labels. Feed into `buildKpiDashboard()` from `kpiDashboard.ts`. Replace the `no_data` placeholder cards in `DirectorKpiHealthSection` with live engine output.

Pre-requisites:
- Session attendance records exist in `session_attendance`
- Voice notes exist for recap completion calculation
- Academy has at least one active player with curriculum state

No new DB queries are needed that aren't already safe to run — the KPI engines are pure functions that accept pre-fetched data.
