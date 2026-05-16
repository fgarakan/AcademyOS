# DONNA KPI Intelligence Map

**Sprint:** 420 — Academy COO KPI Data Model Audit V1  
**Date:** 2026-05-16  
**Purpose:** Maps each KPI to DONNA's current query and interpretation capability. Defines which KPIs DONNA can answer today, which she can partially answer, and which are deferred. Drives the Block 2 sprint build sequence.

---

## Tier 1 — Live: DONNA Can Answer Now

These KPIs are computable from existing DB data without any schema changes.

| KPI | DONNA Query Pattern | Confidence |
|---|---|---|
| **13 · Time in Current Level** | `NOW() - player_curriculum_states.enrolled_at` per player | High |
| **23 · Development Bottleneck by Level** | `COUNT(players) WHERE advancement_eligible = false AND enrolled_at < 90d ago GROUP BY current_level_id` | High |

**DONNA behavior for Tier 1:**
- Answers in real-time when director asks "How long has [player] been at their level?" or "Which level has the most players stuck?"
- Can include in daily brief and player progress summary automatically
- No data disclaimer needed

---

## Tier 2 — Demo-Only: DONNA Can Answer with Honest Data Disclaimers

These KPIs are architecturally sound and have complete schema. Answers depend on demo data density. DONNA must clearly state when values are based on limited data.

| KPI | Primary Table Join | Demo Risk |
|---|---|---|
| **1 · Attendance Rate by Player** | `session_attendance` + `sessions` | Medium — requires consistent attendance marking |
| **2 · Missed-Session Streak** | `session_attendance` + `sessions` ordered by date | Medium — requires absent rows to be recorded |
| **3 · Players with 2+ Absences in 30d** | `session_attendance` GROUP BY player | Medium |
| **4 · Coach Recap Completion Rate** | `sessions` + `voice_notes` | Low — recaps may exist; no type distinction |
| **7 · Player Retention by Group** | `group_memberships.joined_at/left_at` | Medium — requires membership history |
| **9 · Time from Missed Attendance to Follow-Up** | `session_attendance` + `proposed_actions` by timing | Low — approximation only |
| **10 · Level-Readiness Delay from Missed Sessions** | `player_curriculum_states` + `session_attendance` | Medium |
| **12 · Player Development Velocity** | `player_curriculum_history.advanced_at` | Low for new academies — no advancement history yet |
| **14 · Evidence Coverage Score** | `player_gate_status` + `curriculum_gates` | High risk — migrations 041–060 may not be applied |
| **15 · Player Attention Risk Score** | Composite: `session_attendance` + `coach_observations` + `player_development_signals` | Medium |
| **16 · Group Health Score** | Composite of KPIs 1, 4, 15 scoped to group | Medium |
| **19 · Coach Observation Quality Score** | `coach_observations` grouped by coach | Medium — tag usage is coach-dependent |
| **21 · Parent Trust Coverage** | `parent_updates` created in 60d per player | Low — uses draft creation as proxy, not delivery |
| **22 · Level Readiness Accuracy** | `player_curriculum_states` + `player_curriculum_history` | Medium — approximation only |
| **25 · Session Development Yield** | `session_attendance` + `coach_observations` per session | Medium |

**DONNA behavior for Tier 2:**
- Answers with a data-density caveat: "Based on X sessions recorded this month…"
- Always shows the raw count alongside the percentage (e.g., "8 of 10 sessions" not just "80%")
- When data is insufficient for a meaningful answer, says: "Not enough data to compute this reliably yet."
- Never fabricates data or uses static/hardcoded values

---

## Tier 3 — Data-Insufficient: DONNA Defers with Explanation

These KPIs cannot be computed honestly. DONNA explains what is missing and what the path to resolution is.

| KPI | Blocker | Resolution Sprint |
|---|---|---|
| **5 · Parent Update Frequency** | No send infrastructure; `sent_at` always null | Block 3+ (messaging provider) |
| **6 · Parent Response Rate** | No send infrastructure; no response tracking table | Block 3+ |
| **8 · Dropout Rate by Level** | No `deactivated_at` timestamp on `players` | Requires migration — stop and confirm |
| **11 · Private Lesson Conversion** | No FK from `private_lesson_requests` to `session_attendance` | Requires migration — stop and confirm |
| **17 · Curriculum Coverage by Group** | Migration 062 pending; class→curriculum drill linkage not seeded | Apply migration 062 + Sprint 129–131 |
| **18 · Session Plan Completion Rate** | `session_blocks.actual_status` not persisted to DB (Sprint 48) | Resolve Sprint 48 localStorage gap |
| **20 · Coach Plan Alignment Score** | Same as KPI 18 | Same as KPI 18 |
| **24 · Curriculum Effectiveness Score** | `curriculum_levels` lacks `expected_duration_days` | Requires migration — stop and confirm |

**DONNA behavior for Tier 3:**
- States clearly: "I can't compute [KPI name] yet — [one-sentence reason]."
- Offers the closest available proxy if one exists (e.g., for KPI 5: "I can show how many parent update *drafts* have been created, though none have been sent yet.")
- Does not guess, round up, or use placeholder values

---

## DONNA Intent → KPI Mapping

When a director asks DONNA a question, these KPIs are triggered:

| Director Prompt | KPIs Used | Tier |
|---|---|---|
| "How is [player] developing?" | 13, 12, 14, 15, 10 | 1, 2 |
| "Which players need my attention?" | 15, 2, 3 | 2 |
| "How is my [group] doing?" | 16, 1, 4, 25 | 2 |
| "Is [player] ready to advance?" | 13, 14, 22, 10 | 1, 2 |
| "Where are players stuck in the curriculum?" | 23, 12 | 1, 2 |
| "How is Coach [name] performing?" | 4, 19, 20, 25 | 2, 3 |
| "Are parents getting enough updates?" | 21, 5, 6 | 2, 3 |
| "Who is at risk of leaving?" | 15, 7, 8, 2, 3 | 2, 3 |
| "How many players have been absent recently?" | 1, 2, 3 | 2 |
| "Give me my daily brief" | 2, 3, 15, 23, 21 | 1, 2 |

---

## Block 2 Sprint Build Sequence

### Priority Group A — Unblock Tier 2 (no migration required)

| Sprint | Goal |
|---|---|
| 421 | Attendance KPI Engine — compute KPIs 1, 2, 3, 9 from `session_attendance` and surface in DONNA |
| 422 | Coach Operations KPI Engine — compute KPIs 4, 19, 25 from `voice_notes` and `coach_observations` |
| 423 | Development KPI Engine — compute KPIs 12, 13, 22, 23 from `player_curriculum_states` and history |
| 424 | Risk & Retention Engine — compute KPIs 7, 10, 15, 16 as composite scores |
| 425 | Parent Trust KPI — compute KPI 21 from `parent_updates` drafts (proxy) |
| 426 | DONNA KPI Dashboard V1 — director-facing KPI panel with Tier 1 + Tier 2 scores |

### Priority Group B — Resolve Schema Gaps (requires migration confirmation)

> Stop and ask Farshad before any of these sprints.

| Sprint | Goal | Migration needed |
|---|---|---|
| 427 | Dropout Rate Fix — add `deactivated_at` to `players` | Yes — KPI 8 |
| 428 | Private Lesson Conversion — add `triggered_by_session_id` to `private_lesson_requests` | Yes — KPI 11 |
| 429 | Curriculum Effectiveness Fix — add `expected_duration_days` to `curriculum_levels` | Yes — KPI 24 |
| 430 | Block Status Persistence — persist `session_blocks.actual_status` to DB | Yes — KPIs 18, 20 |

### Priority Group C — Infrastructure (Block 3+)

| Sprint | Goal |
|---|---|
| 431+ | Parent Communication Send Infrastructure — KPIs 5, 6 |
| 432+ | Apply pending migrations (041–062) to live DB — KPI 14, 17 |

---

## DONNA Safety Rules for KPI Responses

1. **Never present Tier 3 KPIs as computable.** If data is insufficient, say so explicitly.
2. **Always include raw counts alongside percentages.** "8 of 10" is better than "80%".
3. **Never use hardcoded or seeded data as if it were live academy data.**
4. **Add a data-density note** when a KPI is based on fewer than 5 data points: "Based on 3 sessions — not yet statistically meaningful."
5. **Do not move players or make recommendations based solely on a KPI score.** KPI scores inform DONNA's draft generation; director approves all actions.
6. **Composite scores (15, 16, 19) must show component breakdown** so directors can inspect the inputs.
7. **Time-bounded KPIs** (30-day, 90-day windows) must state the window clearly: "in the last 30 days."

---

## Data Model Gap Register

> These gaps were identified during the Sprint 420 audit. Each gap blocks one or more KPIs. They require explicit migration approval before any sprint touches the schema.

| Gap ID | Missing Element | Blocked KPIs | Priority |
|---|---|---|---|
| G1 | `players.deactivated_at` — nullable timestamp when player became inactive | 8 | High |
| G2 | `private_lesson_requests.triggered_by_session_id` — FK to `session_attendance` | 11 | Medium |
| G3 | `curriculum_levels.expected_duration_days` — integer target weeks/days at level | 24 | Medium |
| G4 | `session_blocks.actual_status` persisted to DB (Sprint 48 localStorage gap) | 18, 20 | High |
| G5 | `parent_updates.send_infrastructure` — no messaging provider wired | 5, 6 | Low (Block 3+) |
| G6 | `parent_responses` table or `parent_updates.acknowledged_at` column | 6 | Low (Block 3+) |
| G7 | Migration 062 applied to live DB (`curriculum_class_template_blocks`) | 17 | Medium |
| G8 | `voice_notes.recap_type` — distinguish full wrap-up from quick note | 4 | Low |

---

## Revision History

| Sprint | Change |
|---|---|
| 430 | Private Lesson Conversion KPI Engine built — KPI 11 stub (insufficient_data, gap G2 — no triggered_by_session_id FK) and makeup session stub (insufficient_data — no session_type column). Not wired — both insufficient_data. |
| 429 | Retention KPI Engine built — KPI 8 stub (insufficient_data, gap G1 — no deactivated_at). Per-player dropout risk signal (partial) built and wired into DONNA player summary. |
| 428 | Group Health KPI Engine built — KPI 16 (demo, composite) and KPI 7 (demo, retention) implemented. Not wired yet — awaiting group summary action (Sprint 435+). |
| 427 | Parent Trust KPI Engine built — KPI 21 (partial, draft coverage) wired into DONNA summary. KPIs 5/6 implemented as `insufficient_data` stubs (no send/response infrastructure). |
| 426 | Coach Execution KPI Engine built — KPI 19 (demo, observation quality) wired into DONNA player summary. KPI 4 (partial, recap completion) engine built, ready for group/session summary wiring. |
| 425 | Curriculum Coverage KPI Engine built — KPI 25 (demo, session yield) wired into DONNA summary. KPIs 17/18/20 implemented as `insufficient_data` stubs (migration 062 + Sprint 48 gaps). |
| 424 | Evidence Coverage KPI Engine built — KPI 14 (demo, gate evidence coverage) and KPI 22 (partial, readiness confidence) added to DONNA summary. Returns `insufficient_data` when gates not seeded for level. |
| 423 | Development Velocity KPI Engine built — KPI 13 (live, time in level) and KPI 12 (demo, advancement velocity) added to DONNA player progress summary. Stalled-player flag at >120 days without eligibility. |
| 422 | Player Development Health (KPI 15) engine built — composite Healthy/Watch/At Risk/Insufficient Data label added to DONNA player progress summary. Status: `partial`. |
| 421 | Attendance KPI Engine built — KPIs 1, 2, 3, 9 computed from `session_attendance` and surfaced in DONNA. Four-tier status system introduced. |
| 420 | Initial audit — 25 KPIs defined, 2 live / 16 demo-only / 7 data-insufficient, 8 gaps registered |
