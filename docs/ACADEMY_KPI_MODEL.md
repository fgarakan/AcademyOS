# Academy KPI Model

> Sprint 465 — Academy Health KPI Model V1
> See also: `src/lib/kpis/academyKpiModel.ts`, `src/lib/donna/kpiExplanations/kpiExplainer.ts`

---

## KPIs

| ID | Label | Unit | Availability | Healthy Threshold |
|---|---|---|---|---|
| attendance_rate | Attendance Rate | % | Live | ≥ 85% |
| recap_completion_rate | Recap Completion | % | Live | ≥ 90% |
| player_priority_coverage | Priority Coverage | % | Live | ≥ 80% |
| parent_summary_freshness | Parent Summary Freshness | % | Live | ≥ 70% |
| curriculum_coverage | Curriculum Coverage | % | Live | ≥ 60% |
| template_usage_rate | Template Usage | % | Live | ≥ 70% |
| coach_followthrough_rate | Coach Follow-Through | % | Partial | ≥ 75% |
| player_progress_velocity | Progress Velocity | ratio | Partial | ≥ 2 req/mo |
| level_readiness_queue_size | Level Readiness Queue | count | Live | ≤ 0 |
| mission_completion_rate | Mission Completion | % | Unavailable* | ≥ 60% |
| badge_progress_rate | Badge Progress | % | Unavailable* | ≥ 50% |
| mental_performance_coverage | Mental Perf. Coverage | % | Partial | ≥ 50% |

\* Pending badge/mission table implementation (Sprints 492–496)

---

## Status tiers

| Status | Meaning |
|---|---|
| healthy | At or above healthy threshold |
| warning | Between warning and healthy thresholds |
| critical | Below warning threshold |
| no_data | No data available to calculate |

---

## Overall academy health

`getOverallAcademyHealth(values)`:
- critical if any KPI is critical
- warning if any KPI is warning
- healthy if all are healthy
- no_data otherwise

---

## Key functions

- `computeKpiStatus(id, value)` — returns healthy/warning/critical/no_data
- `formatKpiValue(id, value)` — formats value with unit (% or count or ratio)
- `buildKpiValue(id, value, trend?)` — builds full KpiValue object
- `getAvailableKpis()` — returns IDs with availability !== 'unavailable'
- `getOverallAcademyHealth(values)` — returns overall status

---

## Wiring required

KPI values must be computed from live DB queries. This module defines contracts and thresholds.

Pending wiring targets:
- `src/app/director/kpi/page.tsx` — KPI dashboard page
- `src/lib/director/directorDashboardQueries.ts` — extend to compute all available KPIs
- `src/lib/donna/briefings/directorBriefing.ts` — use KPI status in briefing sections
