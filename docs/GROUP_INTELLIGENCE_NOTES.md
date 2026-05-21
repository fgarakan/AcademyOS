# Group Intelligence

> Sprint 477 — Group Intelligence V1
> See also: `src/lib/director/groupIntelligence.ts`, `src/lib/director/groupManagementQueries.ts`

---

## Purpose

Group Intelligence aggregates attendance, development, and capacity signals per group into a risk-ranked report for the director. It answers: "Which groups need my attention right now?"

---

## Signal types

| Signal | Source | Status thresholds |
|---|---|---|
| Attendance | `GroupAttendanceSignal` | ≥80% healthy, ≥65% at_risk, <65% critical |
| Development | `GroupDevelopmentSignal` | >2 at-risk players critical; <50% assessed at_risk |
| Capacity | `GroupSummary.maxPlayers` | >100% critical, ≥90% at_risk |

---

## Risk scoring

Each signal contributes to a numeric `riskScore`:
- critical: +100
- at_risk: +30
- no_data: +5
- healthy: +0

Groups are ranked by `riskScore` descending.

---

## Main functions

- `buildGroupIntelligenceSignal(group, attendanceSignal, developmentSignal)` — signal for one group
- `buildGroupIntelligenceReport(groups, attendanceSignals, developmentSignals)` — full academy report
- `rankGroupsByRisk(signals)` — sort by risk score

---

## Wiring targets

- Director dashboard group summary cards
- DONNA daily briefing — at-risk group mentions
- Director attention queue — `over_capacity_group` source items
- `/director/groups` overview page

---

## Data source notes

- Attendance signals come from session_attendance queries (Sprint 421 KPI engines)
- Development signals come from player signal queries (`v_player_signal_dashboard`)
- Capacity is computed from `group_memberships.is_current=true` counts (already in `GroupSummary`)
