# Director KPI Dashboard

> Sprint 473 — KPI Dashboard Builder V1
> See also: `src/lib/director/kpiDashboard.ts`, `src/lib/kpi/kpiTypes.ts`, `docs/ACADEMY_KPI_MODEL.md`

---

## Purpose

Connects the 12 `src/lib/kpi/` computation engines to a director-facing dashboard view model. Organises KPI rows into sections and provides overall health summary.

---

## KPI sections

| Section | KPI IDs |
|---|---|
| Attendance & Engagement | 1, 2, 3, 9 |
| Coach Operations | 4, 5 |
| Development Health | 6, 7, 10 |
| Retention & Growth | 8, 11, 12 |

---

## Status mapping

`KpiResult.status` from the computation layer maps to `KpiDashboardStatus`:

| Engine status | Dashboard status |
|---|---|
| live | healthy |
| partial | warning |
| demo | warning |
| insufficient_data | no_data |

---

## Main functions

- `buildKpiDashboard(results, previousValues?)` — full dashboard view model
- `buildKpiDashboardRow(result, previousValue?)` — single KPI row with trend
- `getTopKpiConcerns(dashboard, limit)` — worst KPIs for DONNA briefing
- `formatKpiSummaryLine(row)` — DONNA-readable one-liner

---

## Two KPI systems

This module (Sprint 473) uses `src/lib/kpi/KpiResult` from the computation engines.
The academy-level view model in `src/lib/kpis/academyKpiModel.ts` (Sprint 466) uses `KpiValue`.
These are complementary: computation engines produce KpiResult; academyKpiModel provides metadata + status thresholds.

---

## Wiring targets

- `/director` dashboard KPI grid
- DONNA briefing `getTopKpiConcerns` for daily brief
- Director attention queue (curriculum gap, session coverage signals)
