# Academy Health Intelligence Readiness Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Audit what exists today for each academy intelligence area. For each metric, document whether the data, UI, and DONNA explanation exist — and where it belongs in the UX.

---

## Metric Areas

1. Enrollment Distribution
2. Progression Analytics
3. Retention / Churn
4. Coach Impact
5. Curriculum Health
6. Academy Optimization
7. AcademyOS Value Report

---

## 1. Enrollment Distribution

**What does this mean?**
How many players are at each curriculum level (Red/Orange/Green/Yellow/HP). Whether distribution is healthy or skewed. Whether groups are balanced in capacity.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Yes — `player_curriculum_states` table, `v_group_summary` view |
| UI | Partial — `/director` dashboard shows `playersWithLevel` and `playersWithoutLevel` counts; no level distribution chart |
| DONNA can explain it | Partial — DONNA COO brief references `curriculumDraftCount` and `curricGapCount` but not per-level enrollment counts |
| Belongs on | `/director/kpi` — Academy Health page |
| Priority level | Medium — useful for director planning, not urgent operational data |

**Gap:** No UI showing distribution across levels (how many players per level). Only total counts. A director cannot see "8 players in Orange Ball, 3 in Green Ball, 12 in Red Ball" without querying the DB directly.

**What DONNA should say:** "Your academy has 23 active players across 3 levels. Red Ball is your most populated stage with 12 players. Green Ball has only 3 — consider whether those players are ready to advance."

---

## 2. Progression Analytics

**What does this mean?**
How quickly players are moving through curriculum levels. Who is stuck, who is advancing, average time-at-level.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Yes — `player_curriculum_states.enrolled_at`, `advancement_eligible`, `stalled_player_count` derived on dashboard |
| UI | Partial — `/director` dashboard has `stalledPlayerCount` and `advancementReadyCount` as KPI tiles via `DirectorTodayKpiSection`; `/director/kpi` has `computeTimeInLevel` via `developmentVelocityKpiEngine` |
| DONNA can explain it | Partial — `kpiExplainer.ts` has templates for advancement KPI; DONNA COO brief surfaces `advancementEligibleCount` and `playerProgressStallCount` |
| Belongs on | `/director/kpi` + Player profile (per-player) |
| Priority level | High — progression is the core value delivery of the academy |

**Gap:** No visual trend chart showing class-level progression velocity over time. No cohort view (players who joined 6 months ago: how many advanced?). Development velocity KPI exists but is exposed at the level of individual players, not cohort trends.

**What DONNA should say:** "6 players are ready for level advancement. 4 players have been at their current level for more than 6 months without advancement. That's a signal worth investigating — do you want me to walk you through each one?"

---

## 3. Retention / Churn

**What does this mean?**
Which players are at risk of leaving, who has gone inactive, whether the academy is growing or shrinking.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Partial — `player_status` has `on_hold`, `inactive` states; attendance data in `session_attendance`; no dedicated churn model |
| UI | Partial — `/director/signals` shows attendance concern signals; `/director/players` shows status badges |
| DONNA can explain it | Partial — `attentionQueue` includes players with `on_hold` status; no churn prediction or trend analysis |
| Belongs on | `/director/kpi` + `/director/today` (alert when risk signals are high) |
| Priority level | HIGH — retention is the financial health metric for an academy |

**Gap:** No retention trend. No "at-risk" churn model. The `on_hold` status exists but there's no analysis of why players go on hold or whether it correlates with cancellation. No "players who haven't attended in X weeks" automated signal beyond the manual attendance concern check in signals page.

**What DONNA should say:** "2 players have been absent for 3+ consecutive sessions. Their families haven't communicated. This is a churn risk signal — would you like to draft a check-in message to send to their parents?"

---

## 4. Coach Impact

**What does this mean?**
Whether individual coaches are contributing positively to player development. Wrap-up completion rates, observation quality, session preparation.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Yes — `voice_notes` (linked to sessions/coaches), `session_attendance`, `proposed_actions` for wrap-ups |
| UI | Partial — `computeRecapCompletionRate` in `coachExecutionKpiEngine.ts` is computed on the dashboard; no per-coach breakdown on `/director/coaches` |
| DONNA can explain it | Partial — DONNA COO brief references `missingWrapUps`; no per-coach analysis |
| Belongs on | `/director/coaches/[coachId]` + `/director/kpi` |
| Priority level | High — coach quality directly drives player development |

**Gap:** The coach list has no performance signals. The `coachKpiSummary.ts` module exists in `src/lib/coach/` but is not wired to any director-facing page. A director who wants to compare coach performance has no way to do so through the UI.

**What DONNA should say:** "Coach Sarah completed 90% of her wrap-ups this month. Coach James completed 40%. That's a meaningful gap — James has 4 sessions without wrap-ups from last week."

---

## 5. Curriculum Health

**What does this mean?**
Whether the curriculum is complete, well-structured, and being taught. Gap analysis, domain balance, content type coverage.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Yes — `curriculum_levels`, `curriculum_drills`, `curriculum_content_items`, coverage model in `src/lib/curriculum/coverageModel.ts` |
| UI | Yes — `CurriculumHealthPanel` on `/director/curriculum` page; health dots per stage |
| DONNA can explain it | Yes — `DonnaCurriculumContextPanel` on curriculum page; `curricGapCount` on dashboard |
| Belongs on | `/director/curriculum` (primary) + `/director/kpi` (summary) |
| Priority level | Medium — critical for long-term quality, not usually daily-urgent |

**What works well:** Curriculum health panel exists and shows domain balance and stage gaps. This is one of the more complete health intelligence areas.

**Gap:** The curriculum health report shows data but doesn't give a clear "What should I add this week?" recommendation. DONNA is present but doesn't proactively say "Add fitness content to Orange Level 2 — it affects 8 active players."

**What DONNA should say:** "Curriculum health is 76%. 2 levels are missing content that active players need this week. The highest-impact addition would be fitness content for Orange 2 — would you like to create a draft?"

---

## 6. Academy Optimization

**What does this mean?**
Whether the academy is using its capacity efficiently. Group fill rates, session frequency, coach utilization.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Yes — `v_group_summary` (group capacity), sessions (session count), coaches (active coaches) |
| UI | Partial — `overCapacityGroups` and `noCoverageGroupCount` derived on dashboard; no group capacity visualization |
| DONNA can explain it | Partial — `buildAttentionQueue` includes over-capacity groups; no utilization dashboard |
| Belongs on | `/director/kpi` + `/director/today` |
| Priority level | Medium — operational efficiency, not daily-urgent |

**Gap:** No group utilization view. A director cannot see "Group A is at 120% capacity, Group B is at 60%" without inference from the attention queue. No session frequency analysis (are groups getting enough court time?).

**What DONNA should say:** "2 groups are over capacity. Orange Level 2 has 14 players but capacity is 12. Green Ball has 3 players — consider whether this group is viable or should merge with another."

---

## 7. AcademyOS Value Report

**What does this mean?**
Evidence that AcademyOS is making the academy better: improvements in player progression, coach wrap-up rates, director decision time, parent satisfaction.

**Exists now?**

| Component | Status |
|---|---|
| Data source | Partial — before/after data would require time-series tracking |
| UI | No — no value report page exists |
| DONNA can explain it | No — no value reporting model |
| Belongs on | `/director/kpi` or a dedicated `/director/reports` page |
| Priority level | Low for V1 — important for retention of the AcademyOS subscription |

**Gap:** No time-series tracking of key metrics. No "AcademyOS impact" narrative. This is a future sprint — the data model needs to support before/after comparisons first.

---

## Consolidated Status Table

| Intelligence Area | Data Exists | UI Exists | DONNA Explains | Where It Belongs | Priority |
|---|---|---|---|---|---|
| Enrollment Distribution | Yes | Partial | Partial | `/director/kpi` | Medium |
| Progression Analytics | Yes | Partial | Partial | `/director/kpi` + player profile | High |
| Retention / Churn | Partial | Partial | Partial | `/director/kpi` + dashboard alerts | HIGH |
| Coach Impact | Yes | Partial | Partial | `/director/coaches/[id]` + `/director/kpi` | High |
| Curriculum Health | Yes | Yes | Yes | `/director/curriculum` (exists) | Medium |
| Academy Optimization | Partial | Partial | Partial | `/director/kpi` | Medium |
| AcademyOS Value Report | No | No | No | `/director/reports` (future) | Low |

---

## Where Each Metric Should Surface

### On `/director` Dashboard (above fold, headline numbers only)
- Players needing attention (churn risk signal)
- Players ready to advance (progression signal)
- Pending approvals (operational signal)

### On `/director/today` (daily operational view)
- Sessions today + status
- Players at risk today (attendance misses)

### On `/director/kpi` (deep analytics, director-initiated)
- Full enrollment distribution by level
- Progression velocity trends
- Coach wrap-up completion by coach
- Group capacity utilization
- AcademyOS value report (future)

### On `/director/curriculum`
- Curriculum health (exists)
- Gap analysis per level

### On `/director/coaches/[coachId]`
- Per-coach performance (wrap-ups, sessions, observations)
- DONNA brief on coach impact

### On Player Profile `/director/players/[playerId]`
- Per-player progression velocity
- Time-at-level vs average

---

## DONNA Intelligence Gaps for Academy Health

These are the DONNA explanations that should exist but don't yet:

1. **Churn prediction:** "These 3 players have missed 3+ consecutive sessions. Churn risk is high."
2. **Coach comparison:** "Coach Sarah completes 90% of wrap-ups. Coach James completes 40%."
3. **Enrollment distribution:** "Red Ball is your most populated level with 12 players. Green Ball has only 3."
4. **Level advancement readiness:** "6 players are ready to advance. Based on past patterns, I'd expect 4 of them to advance this month."
5. **Session coverage gaps:** "Orange Ball Level 2 had no sessions last week. 8 players are behind on curriculum exposure."
6. **Curriculum content gap priority:** "Adding fitness content to Orange Level 2 affects the most players — 8 active players are missing this exposure."
