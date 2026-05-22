# Sprint 620 — DONNA KPI Fluency Audit

**Date:** 2026-05-22
**Sprint:** 620
**KPI Fluency Score: 2 / 10**

---

## Audit Summary

`kpiExplainer.ts` (Sprint 466) contains complete explanation templates for 12 KPIs — headline, what changed, why it matters, evidence, recommended next action, and confidence level. None of these are wired to any director page. The `/director/kpi` page scores 1 in the coverage registry and contains no DONNA entry point. A director asking "Why is attendance low?" from the KPI dashboard gets no DONNA response.

The KPI model defined in `academyKpiModel.ts` covers 12 metrics. The KPI dashboard only surfaces 2 of them (attendance, time-in-level) via custom per-player calculation — not the unified KPI model.

**DONNA's KPI fluency today: zero. Every KPI question goes unanswered.**

---

## KPI Source Inventory

| KPI ID | Label | Source | Dashboard? | DONNA can explain? | DONNA can say "why changed"? |
|---|---|---|---|---|---|
| `attendance_rate` | Attendance Rate | `computeRecentAbsences()` in `attendanceKpiEngine.ts` | Partial (per-player on /director/kpi) | No — not wired | No |
| `recap_completion_rate` | Recap Completion | Inferred from proposed_actions wrap-up coverage | No dashboard | No | No |
| `player_priority_coverage` | Player Priority Coverage | Not computed — schema partial | No dashboard | No | No |
| `parent_summary_freshness` | Parent Summary Freshness | Not computed — no timestamp on summaries | No dashboard | No | No |
| `curriculum_coverage` | Curriculum Coverage | Blocked — schema gap per directorDonnaContext.ts line 339 | No dashboard | No | No |
| `template_usage_rate` | Template Usage Rate | Not computed | No dashboard | No | No |
| `coach_followthrough_rate` | Coach Follow-Through | Not computed | No dashboard | No | No |
| `player_progress_velocity` | Player Progress Velocity | `computeTimeInLevel()` in `developmentVelocityKpiEngine.ts` | Partial (per-player on /director/kpi) | No | No |
| `level_readiness_queue_size` | Level Readiness Queue | Not computed at academy level | No dashboard | No | No |
| `mission_completion_rate` | Mission Completion | Not computed | No dashboard | No | No |
| `badge_progress_rate` | Badge Progress | Not computed | No dashboard | No | No |
| `mental_performance_coverage` | Mental Performance Coverage | Not computed | No dashboard | No | No |

**Of 12 KPIs: 2 are partially surfaced on the KPI dashboard. 0 have DONNA explanation entry points. 0 support "why did this change?" attribution.**

---

## DONNA KPI Capability Gap Analysis

### Can DONNA explain what a KPI means?

**Today:** No. `kpiExplainer.ts` has 12 complete explanation templates (`headline`, `whyItMatters`, `recommendedNextAction`). None are accessible from any page.

**What is needed:** A `DonnaKpiExplainerChip` component on `/director/kpi` that calls `explainKpi(kpiValue)` and renders the explanation inline. No new backend required — pure client + existing library.

**Sprint estimate:** 1 sprint (621).

---

### Can DONNA summarize KPI trends for the academy?

**Today:** No. `summarize_kpi` is `implemented_not_wired` in the action registry. `groupKpiSummaryAction.ts` exists as a server action. It is not connected to `/director/kpi` or the DONNA hub.

**What is needed:** Wire `groupKpiSummaryAction.ts` to a summary panel on `/director/kpi` and expose via the DONNA hub prompt "Summarize this week's KPIs."

**Sprint estimate:** 1 sprint (621).

---

### Can DONNA answer "why did this KPI change?"

**Today:** No. No trend attribution logic exists anywhere in the codebase. `kpiExplainer.ts` computes a `whatChanged` field but this is template-based (e.g., "Attendance rate is 78%, down 4.3% from last week"), not a root-cause analysis.

**What is needed:** A per-KPI trend attribution engine that can:
1. Identify the time window of the change
2. Cross-reference which groups, coaches, or players drove the change
3. Surface the most plausible cause (new absences, missing wrap-ups, low template usage)

**Sprint estimate:** 2–3 sprints (complex). This requires new data joins per KPI.

---

### Can DONNA identify which players/groups are affected by a KPI signal?

**Today:** Partial. `directorDonnaContext.attentionItems` surfaces players with concern observations and absences. But DONNA cannot link a KPI drop to specific groups or coaches — it can only show individual player flags.

**What is needed:** Per-KPI breakdown by group and coach. E.g., "Attendance dropped 8% because Group Orange 2 had 3 absences last week; coach recaps are only 60% in Group Red 1."

**Sprint estimate:** 2 sprints.

---

### Can DONNA recommend a next action based on a KPI?

**Today:** Partial. `kpiExplainer.ts` has `recommendedNextAction` + `nextActionHref` per KPI status. Not wired to any page.

**What is needed:** Wire recommendation to a DONNA chip on the KPI page. Already coded — needs UI entry point only.

**Sprint estimate:** Part of Sprint 621 KPI wiring.

---

### Can DONNA draft a follow-up action from a KPI signal?

**Today:** No. There is no path from "KPI is critical" → DONNA drafts a response (e.g., "draft parent update for attendance issue" or "draft coach brief about missed recaps").

**What is needed:** KPI-triggered action suggestions in DONNA that pre-fill a draft action based on the KPI status and affected players/coaches.

**Sprint estimate:** 2–3 sprints.

---

### Is each KPI safe to expose to director only?

| KPI | Safe for director only? | Parent/player risk? |
|---|---|---|
| attendance_rate | Yes — aggregate metric | No |
| recap_completion_rate | Yes — coach-facing | No |
| player_priority_coverage | Yes | No |
| parent_summary_freshness | Yes | No |
| curriculum_coverage | Yes | No |
| template_usage_rate | Yes | No |
| coach_followthrough_rate | Yes | No |
| player_progress_velocity | Yes | No |
| level_readiness_queue_size | Yes | No |
| mission_completion_rate | Yes | No |
| badge_progress_rate | Yes — aggregate | No |
| mental_performance_coverage | Yes | No |

All 12 KPIs are director-only metrics. None carry parent/player visibility risk in their aggregate form. Individual player data used to compute them would be director-only — not exposed in the aggregate KPI value.

---

## KPI Dashboard Current State (/director/kpi)

The current KPI dashboard (Sprint 432) is a per-player signal table, not an academy-level KPI dashboard. It:
- Shows each active player's absences (30-day) and time-in-level
- Flags players with 2+ absences or 180+ days in level
- Shows advancement eligibility flag
- Has zero DONNA entry points

This is useful signal data but is not the same as the 12-KPI academy health model. The academy-level KPI model (`academyKpiModel.ts` with `computeKpis()`) is not wired to the KPI dashboard page.

**The `/director/kpi` page needs to be rebuilt around `academyKpiModel.ts` + `kpiExplainer.ts` + DONNA integration in a future sprint.**

---

## Priority Recommendations

| Gap | Priority | Sprint |
|---|---|---|
| Wire kpiExplainer.ts to /director/kpi via DonnaKpiExplainerChip | P0 | 621 |
| Wire summarize_kpi (groupKpiSummaryAction.ts) to /director/kpi and /director/donna | P1 | 621 |
| Add "why did this change?" trend attribution for attendance_rate | P1 | 621 |
| Rebuild /director/kpi around academyKpiModel.ts (12 KPIs) | P1 | 622 |
| Per-KPI breakdown by group and coach | P2 | 628 |
| KPI-triggered DONNA draft actions | P2 | 629 |
| Add trend attribution for remaining 11 KPIs | P2 | 628–630 |
| Build recap_completion_rate computation | P2 | 627 |
| Build player_priority_coverage computation | P2 | 627 |
| Build template_usage_rate computation | P3 | future |
