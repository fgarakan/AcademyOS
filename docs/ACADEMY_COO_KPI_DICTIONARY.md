# Academy COO KPI Dictionary

**Sprint:** 420 — Academy COO KPI Data Model Audit V1  
**Date:** 2026-05-16  
**Purpose:** Canonical reference for all KPIs DONNA uses to manage the academy as a COO. Each entry defines what the KPI measures, how to compute it, what data is required, whether the data exists today, and what DONNA does with it.

---

## Sufficiency Labels

| Label | Meaning |
|---|---|
| `live` | All required data exists in DB. Can be computed today from real records. |
| `demo-only` | Required tables exist but may have sparse or no seed data in the demo academy. Computable logic is correct; result may be 0 or null. |
| `data-insufficient` | Critical data is missing from the schema. Cannot be honestly computed until schema gap is resolved. |

---

## Categories

- **Attendance & Engagement** — session presence, streaks, absences
- **Coach Operations** — recap completion, observation quality, plan alignment
- **Parent & Communication** — update frequency, response, trust
- **Player Development** — velocity, level time, evidence, bottlenecks
- **Retention & Health** — group retention, dropout, attention risk
- **Curriculum & Session Quality** — coverage, yield, plan completion

---

## KPI 1 — Attendance Rate by Player

**Category:** Attendance & Engagement  
**Definition:** Percentage of scheduled sessions a player attended in a given rolling window (default: 30 days).  
**Formula:** `(attended_sessions / total_scheduled_sessions) × 100` where `session_attendance.status = 'present'`  
**Required data:** `session_attendance.player_id`, `session_attendance.status`, `session_attendance.marked_at`, `sessions.scheduled_date`, `sessions.academy_id`  
**Source tables:** `session_attendance`, `sessions`  
**Missing data:** None. `session_attendance` exists with `status` and `marked_at`. Need to confirm which status values map to "attended" — likely `'present'` or `'attended'`.  
**Data sufficiency:** `demo-only` — schema is complete; demo data density determines usefulness.  
**DONNA interpretation:** "Alex attended 8 of 10 scheduled sessions in the last 30 days (80%). That's within the healthy range for group training. No follow-up needed."  
**Safe next action:** Flag players below 70% for DONNA to surface in the Review Queue as an attendance concern draft.  
**Status:** `demo-only`

---

## KPI 2 — Missed-Session Streak

**Category:** Attendance & Engagement  
**Definition:** Number of consecutive sessions a player has missed (no `session_attendance` record with `status = 'present'`).  
**Formula:** Count of most-recent consecutive sessions where the player has no present record or has a `status != 'present'` record.  
**Required data:** `session_attendance.player_id`, `session_attendance.status`, `sessions.scheduled_date` (ordered), `sessions.group_id`, `players.current_group_id`  
**Source tables:** `session_attendance`, `sessions`, `players`  
**Missing data:** No per-session roster — the list of players expected at each session must be derived from `players.current_group_id = sessions.group_id`. If a player is absent with no `session_attendance` row, they cannot be distinguished from a player who had no obligation. Requires `session_attendance` row to exist (even as `status = 'absent'`) for reliable streak counting.  
**Data sufficiency:** `demo-only` — logic is correct if attendance is marked; if rows are only written on present, absent rows must be inferred from group roster.  
**DONNA interpretation:** "Tyler has missed 3 consecutive sessions. This triggers a follow-up flag. DONNA suggests a check-in note for the director to review."  
**Safe next action:** Streak ≥ 2 → DONNA creates an attendance-exception draft for director review.  
**Status:** `demo-only`

---

## KPI 3 — Players with 2+ Absences in 30 Days

**Category:** Attendance & Engagement  
**Definition:** Count of active players who have 2 or more recorded absences (status ≠ 'present') within a 30-day window.  
**Formula:** `COUNT(DISTINCT player_id) WHERE status != 'present' AND marked_at >= NOW() - INTERVAL '30 days' GROUP BY player_id HAVING COUNT(*) >= 2`  
**Required data:** `session_attendance.player_id`, `session_attendance.status`, `session_attendance.marked_at`, `players.academy_id`, `players.is_active`  
**Source tables:** `session_attendance`, `players`  
**Missing data:** Same caveat as KPI 2 — absences must be explicitly recorded, not inferred.  
**Data sufficiency:** `demo-only`  
**DONNA interpretation:** "3 players have 2 or more absences in the last 30 days: Tyler M., Emma R., and Sam K. DONNA recommends a follow-up for each."  
**Safe next action:** DONNA surfaces these players in the director's attention queue with a proposed parent communication draft (pending director approval).  
**Status:** `demo-only`

---

## KPI 4 — Coach Recap Completion Rate

**Category:** Coach Operations  
**Definition:** Percentage of completed sessions that have at least one associated voice_note or session_notes entry (proxy for recap completion).  
**Formula:** `(sessions_with_recap / sessions_with_status = 'completed') × 100` where a "recap" is `voice_notes.session_id IS NOT NULL` OR `sessions.session_notes IS NOT NULL`  
**Required data:** `sessions.id`, `sessions.status`, `sessions.academy_id`, `voice_notes.session_id`  
**Source tables:** `sessions`, `voice_notes`  
**Missing data:** `voice_notes` does not have a `type` field — quick notes and full wrap-up recaps both go to this table. There is no way to distinguish a full structured recap from a one-liner quick note without parsing `raw_input`. This makes "full recap" vs "any note" indistinguishable at the DB level.  
**Data sufficiency:** `demo-only` — proxy metric only; true recap quality requires parsing `raw_input` or adding a `recap_type` column.  
**DONNA interpretation:** "8 of 10 completed sessions this week have a recap note (80%). 2 sessions from Coach Brian have no recap. DONNA can draft a reminder."  
**Safe next action:** Sessions > 48 hours completed with no voice_note or session_notes → DONNA flags for director.  
**Status:** `demo-only`

---

## KPI 5 — Parent Update Frequency

**Category:** Parent & Communication  
**Definition:** Average number of parent updates sent per player per 30-day period, across all active players.  
**Formula:** `COUNT(parent_updates WHERE status = 'sent' AND sent_at >= NOW() - INTERVAL '30 days') / COUNT(active players)`  
**Required data:** `parent_updates.player_id`, `parent_updates.status`, `parent_updates.sent_at`, `parent_updates.academy_id`, `players.is_active`  
**Source tables:** `parent_updates`, `players`  
**Missing data:** No messaging infrastructure exists yet — `parent_updates` records are draft-only. `sent_at` is nullable and will be null for all records until the send pipeline is built. Frequency will be 0 until a send mechanism exists.  
**Data sufficiency:** `data-insufficient` — `parent_updates.status = 'sent'` and `sent_at` will always be null/empty until a messaging provider is integrated. Director-approved drafts exist but are never actually sent.  
**DONNA interpretation:** "No parent updates have been sent yet through this system — all drafts remain internal. DONNA can help the director generate update drafts for review."  
**Safe next action:** DONNA can count drafts created (even if unsent) as a proxy: "5 parent update drafts have been created but not yet delivered."  
**Status:** `data-insufficient`

---

## KPI 6 — Parent Response Rate

**Category:** Parent & Communication  
**Definition:** Percentage of sent parent updates that receive a tracked parent acknowledgement or response within 7 days.  
**Formula:** `(updates_with_parent_response / total_sent_updates) × 100`  
**Required data:** A `parent_response_at` or `acknowledged_at` column on `parent_updates`, OR a separate response tracking table.  
**Source tables:** `parent_updates` (lacks response tracking), no alternative table exists.  
**Missing data:** `parent_updates` has no `response_received_at`, `acknowledged_at`, or `read_at` column. No inbound parent communication table exists. No messaging provider is wired.  
**Data sufficiency:** `data-insufficient` — two blockers: (1) no send infrastructure, (2) no response tracking column or table.  
**DONNA interpretation:** "Parent response rate cannot be tracked yet — this system doesn't currently capture inbound parent responses. DONNA will track this once a communication channel is wired."  
**Safe next action:** None possible until send + response infrastructure exists. Deferred to Block 3+.  
**Status:** `data-insufficient`

---

## KPI 7 — Player Retention by Group

**Category:** Retention & Health  
**Definition:** Percentage of players who were in a group 90 days ago and are still in the same group (or any active group) today.  
**Formula:** `(players_still_active_in_group / players_in_group_90_days_ago) × 100`  
**Required data:** `group_memberships.player_id`, `group_memberships.group_id`, `group_memberships.joined_at`, `group_memberships.left_at`, `group_memberships.is_current`, `players.is_active`  
**Source tables:** `group_memberships`, `players`, `groups`  
**Missing data:** `group_memberships` has `joined_at` and `left_at` — this is sufficient for retention computation. Gap: `left_at` is nullable (NULL = still active). Dropout reason is in `reason` (free text).  
**Data sufficiency:** `demo-only` — schema is complete. Demo data population determines usefulness.  
**DONNA interpretation:** "The Under-12 Development group has retained 9 of 10 players over the last 90 days (90%). One player left in March."  
**Safe next action:** Groups below 80% retention → DONNA surfaces in Group Health summary.  
**Status:** `demo-only`

---

## KPI 8 — Dropout Rate by Level

**Category:** Retention & Health  
**Definition:** Percentage of players who became inactive while assigned to a given curriculum level, within a rolling 6-month window.  
**Formula:** `(players_became_inactive_at_level / total_players_who_were_at_level) × 100`  
**Required data:** `players.status`, `players.is_active`, `players.current_level_id`, `player_curriculum_states.current_level_id`, `players.updated_at`  
**Source tables:** `players`, `player_curriculum_states`  
**Missing data:** `players` has `is_active` (boolean) and `status` enum, but no `inactive_at` timestamp. There is no `deactivated_at` column. The exact date a player dropped out cannot be determined from the schema — only that they are currently inactive. `updated_at` is a proxy but not reliable.  
**Data sufficiency:** `data-insufficient` — cannot reliably calculate dropout rate without a `deactivated_at` timestamp on `players`. Rate can be approximated (imprecisely) from `updated_at` but this is unreliable.  
**DONNA interpretation:** "Dropout rate by level cannot be precisely computed — there is no record of when players became inactive. DONNA can show how many inactive players are at each level, but cannot show a rate over time."  
**Safe next action:** Show count of `is_active = false` players by level as a proxy. Mark as approximate.  
**Status:** `data-insufficient`

---

## KPI 9 — Time from Missed Attendance to Follow-Up

**Category:** Attendance & Engagement  
**Definition:** Average hours between the session date of a missed attendance and the date a follow-up action (proposed_action or parent_update draft) was created for that player.  
**Formula:** `AVG(proposed_action.created_at - session.scheduled_date) WHERE session_attendance.status != 'present'`  
**Required data:** `session_attendance.player_id`, `session_attendance.session_id`, `sessions.scheduled_date`, `proposed_actions.created_at`, `proposed_actions.target_object_id` (player_id), `proposed_actions.target_module`  
**Source tables:** `session_attendance`, `sessions`, `proposed_actions`, `parent_updates`  
**Missing data:** `proposed_actions` does not have a direct FK to `session_attendance`. The link between "missed session" and "follow-up draft" must be inferred from `target_object_id` matching a player_id and timing. This is an approximation.  
**Data sufficiency:** `demo-only` — computable as a rough timing proxy. Exact attribution requires a `trigger_session_id` FK on `proposed_actions`.  
**DONNA interpretation:** "On average, follow-up actions for missed sessions are created within 2.3 days. The goal is under 24 hours."  
**Safe next action:** DONNA flags when no follow-up exists for a player who missed a session more than 48 hours ago.  
**Status:** `demo-only`

---

## KPI 10 — Level-Readiness Delay Caused by Missed Sessions

**Category:** Player Development  
**Definition:** For players whose advancement is blocked (`advancement_eligible = false`), how many missed sessions in the last 60 days may have contributed to the delay.  
**Formula:** `COUNT(missed_sessions in last 60 days) WHERE player_curriculum_states.advancement_eligible = false`  
**Required data:** `player_curriculum_states.advancement_eligible`, `player_curriculum_states.player_id`, `session_attendance.status`, `sessions.scheduled_date`  
**Source tables:** `player_curriculum_states`, `session_attendance`, `sessions`  
**Missing data:** Causality is inferred — the schema cannot prove sessions caused the delay (advancement may be blocked by gate evidence, not attendance). The correlation is real but not causal at the DB level.  
**Data sufficiency:** `demo-only` — computable as a correlation metric. Honest labeling as "correlation, not causation" is required in the UI.  
**DONNA interpretation:** "Tyler is not advancement-eligible and has missed 4 of the last 8 sessions. Attendance gaps may be contributing to the development delay."  
**Safe next action:** DONNA surfaces in level-readiness review for that player.  
**Status:** `demo-only`

---

## KPI 11 — Private Lesson / Makeup Conversion from Missed Development Blocks

**Category:** Attendance & Engagement  
**Definition:** Of players who have missed 2+ sessions in 30 days, what percentage have a private lesson request created within the same window.  
**Formula:** `(players_with_plr AND 2+ absences) / (players_with_2+ absences) × 100`  
**Required data:** `private_lesson_requests.player_id`, `private_lesson_requests.created_at`, `private_lesson_requests.status`, `session_attendance.status`, `session_attendance.marked_at`  
**Source tables:** `private_lesson_requests`, `session_attendance`, `players`  
**Missing data:** `private_lesson_requests` has no FK to `session_attendance` — there is no schema link between a specific missed session and a private lesson request. The KPI can only be computed as a timing correlation, not as true conversion tracking.  
**Data sufficiency:** `data-insufficient` — requires a `triggered_by_session_id` or similar FK on `private_lesson_requests` to attribute the request to a specific missed development block. Without this, the KPI is a coincidence counter.  
**DONNA interpretation:** "This KPI requires a direct link between missed sessions and private lesson requests. DONNA will note players who have both simultaneously but cannot confirm causation."  
**Safe next action:** DONNA shows players with 2+ absences AND active private lesson requests as a flag, without claiming conversion.  
**Status:** `data-insufficient`

---

## KPI 12 — Player Development Velocity

**Category:** Player Development  
**Definition:** Average time (in days) a player takes to advance from one curriculum level to the next, computed across all recorded advancements.  
**Formula:** `AVG(advanced_at - previous_advanced_at) per player` using `player_curriculum_history` ordered by `advanced_at`  
**Required data:** `player_curriculum_history.player_id`, `player_curriculum_history.advanced_at`, `player_curriculum_history.from_level_id`, `player_curriculum_history.to_level_id`, `player_curriculum_states.enrolled_at`  
**Source tables:** `player_curriculum_history`, `player_curriculum_states`  
**Missing data:** None structural. Gap: `player_curriculum_history` will be empty for players who have not yet advanced. For new academies, velocity = null (no history). `player_curriculum_states.enrolled_at` provides the "time at current level" for players who haven't advanced yet.  
**Data sufficiency:** `demo-only` — schema complete; useful once players have advancement history.  
**DONNA interpretation:** "Players in the Orange 1 group advance to Orange 2 in an average of 14 weeks. Tyler has been at Orange 1 for 22 weeks — 57% longer than average."  
**Safe next action:** Players significantly above average velocity → DONNA flags for level-readiness review.  
**Status:** `demo-only`

---

## KPI 13 — Time in Current Level

**Category:** Player Development  
**Definition:** Number of days a player has been enrolled at their current curriculum level, from `enrolled_at` to today.  
**Formula:** `NOW() - player_curriculum_states.enrolled_at` (in days)  
**Required data:** `player_curriculum_states.player_id`, `player_curriculum_states.enrolled_at`, `player_curriculum_states.current_level_id`  
**Source tables:** `player_curriculum_states`  
**Missing data:** None. `enrolled_at` exists with a default of `now()`.  
**Data sufficiency:** `live` — fully computable from existing data.  
**DONNA interpretation:** "Marcus has been at Orange Ball Starter for 6 weeks. Typical range is 8–12 weeks. He's on track."  
**Safe next action:** Players above 120% of expected level duration → DONNA surfaces for level-readiness review.  
**Status:** `live`

---

## KPI 14 — Evidence Coverage Score

**Category:** Player Development  
**Definition:** For a player, the proportion of required curriculum gates that have at least one evidence observation recorded, relative to the total gates at their level.  
**Formula:** `(gates_with_evidence / total_gates_at_level) × 100`  
**Required data:** `player_gate_status.player_id`, `player_gate_status.evidence_count`, `curriculum_gates.id` (for the player's current level)  
**Source tables:** `player_gate_status`, `curriculum_gates`, `player_curriculum_states`  
**Missing data:** `player_gate_status` may not be populated (Sprint 59 partial application — see KNOWN_LIMITATIONS). `curriculum_gates` requires migrations 041–044 to be applied to live DB. Until then, gate data may be empty.  
**Data sufficiency:** `demo-only` — schema exists; live DB may lack gate data pending migration application.  
**DONNA interpretation:** "Tyler has evidence recorded for 3 of 6 required gates at Orange 1 (50%). Three gates still need observation before he can advance."  
**Safe next action:** Players below 60% evidence coverage at a level they've held for > 8 weeks → DONNA flags for coach observation prompt.  
**Status:** `demo-only`

---

## KPI 15 — Player Attention Risk Score

**Category:** Retention & Health  
**Definition:** A composite risk score (0–100) for each player based on: recent attendance rate, missed-session streak, absence of recent observations, absence of recent parent updates, and active high-severity signals. Higher = more at risk.  
**Formula:** Weighted composite:  
- Attendance rate < 70% in 30d: +30 pts  
- Missed-session streak ≥ 2: +20 pts  
- No coach observation in 14 days: +20 pts  
- No parent update draft in 30 days: +15 pts  
- Active high-severity signal: +15 pts  
**Required data:** `session_attendance`, `coach_observations.created_at`, `parent_updates.created_at`, `player_development_signals.severity`, `player_development_signals.is_active`  
**Source tables:** `session_attendance`, `coach_observations`, `parent_updates`, `player_development_signals`  
**Missing data:** No single computed score table exists — must be derived at query time. `player_priorities` exists but uses a different scoring model. `player_development_signals.severity` exists (string, not normalized to a scale).  
**Data sufficiency:** `demo-only` — all inputs exist in schema; score must be computed at the application layer (no DB-stored composite). Demo data density determines usefulness.  
**DONNA interpretation:** "Tyler has an attention risk score of 75/100 — high. Triggers: 3 missed sessions, no observations in 12 days, one active high-severity signal."  
**Safe next action:** Score ≥ 60 → DONNA surfaces in director's priority queue automatically.  
**Status:** `demo-only`

---

## KPI 16 — Group Health Score

**Category:** Retention & Health  
**Definition:** A composite health score (0–100) for each active group, based on: average player attendance rate, number of at-risk players (attention risk ≥ 60), recap completion rate, recent coaching observations per player, and session count in last 30 days.  
**Formula:** Weighted composite (inverse of risk):  
- Average group attendance rate (max 30 pts)  
- % of players with ≥ 1 observation in 14 days (max 25 pts)  
- Recap completion rate (max 20 pts)  
- Session frequency vs. schedule (max 15 pts)  
- % of players without active high-severity signals (max 10 pts)  
**Required data:** All KPIs 1, 4, and 15 inputs, scoped to `groups.id`  
**Source tables:** `groups`, `sessions`, `session_attendance`, `coach_observations`, `voice_notes`, `player_development_signals`  
**Missing data:** No stored group health score — derived metric. Requires KPIs 1, 4, 15 to be live before this is meaningful.  
**Data sufficiency:** `demo-only` — computable from existing schema; fully dependent on other KPIs being populated.  
**DONNA interpretation:** "The Orange 1 group has a health score of 72/100 — moderate. Main drag: 2 high-risk players and 60% recap completion rate this month."  
**Safe next action:** Groups below 60 health score → DONNA includes in director's weekly brief.  
**Status:** `demo-only`

---

## KPI 17 — Curriculum Coverage by Group

**Category:** Curriculum & Session Quality  
**Definition:** Percentage of curriculum drills/content items at a group's assigned level that have been included in at least one session template used by that group.  
**Formula:** `(distinct_curriculum_drills_in_template_blocks / total_drills_at_level) × 100` via `curriculum_class_template_blocks` join  
**Required data:** `curriculum_class_template_blocks.template_block_id`, `curriculum_drills.level_min_id`, `templates.group_id`, `sessions.group_id`, `sessions.template_id`  
**Source tables:** `curriculum_class_template_blocks`, `curriculum_drills`, `templates`, `sessions`  
**Missing data:** `curriculum_class_template_blocks` requires migration 062 to be applied to the live DB (see KNOWN_LIMITATIONS). Until applied, queries on this table return "relation does not exist". Also: class templates currently link to fitness exercises, not curriculum drills (Sprint 127 gap).  
**Data sufficiency:** `data-insufficient` — migration 062 pending live DB; class-template-to-curriculum-drill linkage not yet seeded (Sprint 129–131 pending).  
**DONNA interpretation:** "Curriculum coverage by group cannot be computed yet — the class template curriculum link is not yet active. This unlocks when migration 062 is applied and curriculum content is seeded."  
**Safe next action:** None until migration 062 is applied. Deferred to Block 3+.  
**Status:** `data-insufficient`

---

## KPI 18 — Session Plan Completion Rate

**Category:** Curriculum & Session Quality  
**Definition:** Percentage of session blocks that were marked as completed (vs. skipped or modified) across all sessions with block data, in a rolling 30-day window.  
**Formula:** `(session_blocks WHERE actual_status = 'done' / total_session_blocks) × 100`  
**Required data:** `session_blocks.session_id`, `session_blocks.actual_status`, `sessions.scheduled_date`, `sessions.academy_id`  
**Source tables:** `session_blocks`  
**Missing data:** Critical gap from Sprint 48 (KNOWN_LIMITATIONS): `session_blocks.actual_status` is written from **localStorage only** — it is never persisted to the database. The field exists in the DB schema but is always its default value for sessions where the coach used the in-session runner. The DB `actual_status` column reflects only blocks explicitly saved via server action, not the coach's tap-through status updates.  
**Data sufficiency:** `data-insufficient` — field exists in schema but is not reliably populated from production coach flows. Will read as default/planned for most sessions.  
**DONNA interpretation:** "Session plan completion rate cannot be reliably computed — block status updates are stored locally by coaches and not yet persisted to the database."  
**Safe next action:** None until the localStorage-to-DB persistence gap (Sprint 48) is resolved. Deferred.  
**Status:** `data-insufficient`

---

## KPI 19 — Coach Observation Quality Score

**Category:** Coach Operations  
**Definition:** A composite quality score for coach observations: recency (how recent), frequency (obs per session), coverage (players observed per session), and specificity (tagged observations vs. untagged).  
**Formula:** Weighted composite per coach:  
- % of sessions with ≥ 1 observation per player: 30 pts  
- % of observations with `tags` array populated: 25 pts  
- % of observations with `ai_parsed = true`: 20 pts (indicates structured content)  
- Average observations per player per session: 25 pts  
**Required data:** `coach_observations.coach_id`, `coach_observations.tags`, `coach_observations.ai_parsed`, `coach_observations.session_id`, `coach_observations.player_id`, `sessions.coach_id`  
**Source tables:** `coach_observations`, `sessions`  
**Missing data:** No stored quality score — derived at query time. `ai_parsed = true` is a proxy for structure, not true quality. `tags` array population depends on coach discipline.  
**Data sufficiency:** `demo-only` — schema is complete. Score is computed at application layer. Meaningful only with sufficient observation volume.  
**DONNA interpretation:** "Coach Brian's observation quality score is 62/100 — moderate. Strength: high observation frequency. Gap: only 30% of observations are tagged."  
**Safe next action:** Coaches below 50 quality score → DONNA suggests adding tags or structured observation prompts.  
**Status:** `demo-only`

---

## KPI 20 — Coach Plan Alignment Score

**Category:** Coach Operations  
**Definition:** Percentage of sessions where the actual blocks delivered match the planned template blocks (no overrides, no skips).  
**Formula:** `(session_blocks WHERE is_override = false AND actual_status = 'done') / total_session_blocks × 100`  
**Required data:** `session_blocks.is_override`, `session_blocks.actual_status`, `session_blocks.template_block_id`, `sessions.template_id`  
**Source tables:** `session_blocks`, `sessions`  
**Missing data:** Same as KPI 18 — `actual_status` is not reliably persisted to DB (Sprint 48 localStorage gap). `is_override = true` rows indicate overridden blocks but `actual_status` for plan compliance cannot be trusted.  
**Data sufficiency:** `data-insufficient` — blocked by the same localStorage persistence gap as KPI 18.  
**DONNA interpretation:** "Coach plan alignment cannot be reliably computed — block status is stored locally, not in the database."  
**Safe next action:** Deferred until Sprint 48 gap is resolved.  
**Status:** `data-insufficient`

---

## KPI 21 — Parent Trust Coverage

**Category:** Parent & Communication  
**Definition:** Percentage of active players who have received at least one parent update draft (of any status) in the last 60 days.  
**Formula:** `(players_with_parent_update_draft_in_60d / total_active_players) × 100`  
**Required data:** `parent_updates.player_id`, `parent_updates.created_at`, `parent_updates.academy_id`, `players.is_active`  
**Source tables:** `parent_updates`, `players`  
**Missing data:** Uses draft creation date as proxy (not sent date, since sending is not yet wired). This measures "coverage of intent" — the director has drafted something for this player — not actual delivery.  
**Data sufficiency:** `demo-only` — schema complete. Honest framing required: this measures draft creation, not delivery.  
**DONNA interpretation:** "18 of 24 active players have a parent update draft created in the last 60 days (75%). 6 players have no recent update — DONNA can help draft those now."  
**Safe next action:** Players with no draft in 60 days → DONNA prompts director to generate a summary.  
**Status:** `demo-only`

---

## KPI 22 — Level Readiness Accuracy

**Category:** Player Development  
**Definition:** Of players who were marked `advancement_eligible = true`, what percentage were actually advanced within 14 days.  
**Formula:** `(players_advanced_within_14d_of_eligible_flag / players_flagged_as_eligible) × 100`  
**Required data:** `player_curriculum_states.advancement_eligible`, `player_curriculum_states.last_evaluated_at`, `player_curriculum_history.advanced_at`, `player_curriculum_history.player_id`  
**Source tables:** `player_curriculum_states`, `player_curriculum_history`  
**Missing data:** No timestamp for when `advancement_eligible` was set to `true` — only `last_evaluated_at`. The exact moment of eligibility change is not recorded. Approximation via `last_evaluated_at` is possible but imprecise.  
**Data sufficiency:** `demo-only` — computable as approximation. Schema lacks an `eligible_since_at` timestamp for precision.  
**DONNA interpretation:** "7 of 9 players flagged as advancement-eligible were advanced within 14 days (78%). 2 players remain eligible but have not advanced — DONNA will surface these for review."  
**Safe next action:** Eligible players not advanced in > 14 days → DONNA surfaces in director's weekly brief.  
**Status:** `demo-only`

---

## KPI 23 — Development Bottleneck by Level

**Category:** Player Development  
**Definition:** The average number of active players stuck at each curriculum level (advancement_eligible = false for > 90 days), grouped by level.  
**Formula:** `COUNT(players WHERE advancement_eligible = false AND enrolled_at < NOW() - INTERVAL '90 days') GROUP BY current_level_id`  
**Required data:** `player_curriculum_states.current_level_id`, `player_curriculum_states.advancement_eligible`, `player_curriculum_states.enrolled_at`, `player_curriculum_states.academy_id`  
**Source tables:** `player_curriculum_states`  
**Missing data:** None. All fields exist. Note: `advancement_eligible` must be evaluated regularly by the evaluation engine for this to reflect current state.  
**Data sufficiency:** `live` — fully computable if `player_curriculum_states` is populated and `advancement_eligible` is current.  
**DONNA interpretation:** "Orange 1 has 4 players stuck (not eligible for advancement) for more than 90 days. This is the highest bottleneck level in the academy."  
**Safe next action:** DONNA surfaces the top bottleneck level in the weekly brief with a drill or gate recommendation.  
**Status:** `live`

---

## KPI 24 — Curriculum Effectiveness Score

**Category:** Curriculum & Session Quality  
**Definition:** For a curriculum level, the average advancement velocity of players who advanced through it in the last 6 months, compared to the expected/target duration.  
**Formula:** `AVG(days_to_advance_through_level) / target_days × 100` where lower % = faster advancement = higher effectiveness  
**Required data:** `player_curriculum_history.from_level_id`, `player_curriculum_history.advanced_at`, `player_curriculum_states.enrolled_at`, curriculum level expected duration (not currently in schema).  
**Source tables:** `player_curriculum_history`, `player_curriculum_states`, `curriculum_levels`  
**Missing data:** `curriculum_levels` does not have an `expected_duration_days` or `target_weeks` column. There is no normative duration defined in the schema. Without a target, the ratio cannot be computed.  
**Data sufficiency:** `data-insufficient` — requires an `expected_duration_days` field on `curriculum_levels`. Can compute average time but cannot produce an effectiveness percentage without the target.  
**DONNA interpretation:** "Curriculum effectiveness cannot be scored yet — no target duration is defined for curriculum levels. DONNA can show average time at each level, but cannot compare to target."  
**Safe next action:** Show average advancement time by level as a standalone metric (live computable). Flag this as a partial input to the effectiveness score.  
**Status:** `data-insufficient`

---

## KPI 25 — Session Development Yield

**Category:** Curriculum & Session Quality  
**Definition:** Of players who attended a session, what percentage have at least one coach observation recorded for that session.  
**Formula:** `(players_with_observation_for_session / players_present_at_session) × 100` per session  
**Required data:** `session_attendance.session_id`, `session_attendance.player_id`, `session_attendance.status = 'present'`, `coach_observations.session_id`, `coach_observations.player_id`  
**Source tables:** `session_attendance`, `coach_observations`  
**Missing data:** None structural. Both tables have `session_id` and `player_id` FKs. Gap: coach observations are not required per session, so yield may legitimately be 0 for sessions where coaches chose not to record per-player observations.  
**Data sufficiency:** `demo-only` — schema is complete and live-computable. Demo data density determines usefulness.  
**DONNA interpretation:** "This session had 8 attendees. Coach observations were recorded for 5 of them (63%). 3 players had no observation this session."  
**Safe next action:** Sessions below 50% yield → DONNA reminds coach to add observations for uncovered players.  
**Status:** `demo-only`

---

## Summary Table

| # | KPI Name | Category | Status |
|---|---|---|---|
| 1 | Attendance Rate by Player | Attendance & Engagement | `demo-only` |
| 2 | Missed-Session Streak | Attendance & Engagement | `demo-only` |
| 3 | Players with 2+ Absences in 30 Days | Attendance & Engagement | `demo-only` |
| 4 | Coach Recap Completion Rate | Coach Operations | `demo-only` |
| 5 | Parent Update Frequency | Parent & Communication | `data-insufficient` |
| 6 | Parent Response Rate | Parent & Communication | `data-insufficient` |
| 7 | Player Retention by Group | Retention & Health | `demo-only` |
| 8 | Dropout Rate by Level | Retention & Health | `data-insufficient` |
| 9 | Time from Missed Attendance to Follow-Up | Attendance & Engagement | `demo-only` |
| 10 | Level-Readiness Delay Caused by Missed Sessions | Player Development | `demo-only` |
| 11 | Private Lesson / Makeup Conversion | Attendance & Engagement | `data-insufficient` |
| 12 | Player Development Velocity | Player Development | `demo-only` |
| 13 | Time in Current Level | Player Development | `live` |
| 14 | Evidence Coverage Score | Player Development | `demo-only` |
| 15 | Player Attention Risk Score | Retention & Health | `demo-only` |
| 16 | Group Health Score | Retention & Health | `demo-only` |
| 17 | Curriculum Coverage by Group | Curriculum & Session Quality | `data-insufficient` |
| 18 | Session Plan Completion Rate | Curriculum & Session Quality | `data-insufficient` |
| 19 | Coach Observation Quality Score | Coach Operations | `demo-only` |
| 20 | Coach Plan Alignment Score | Coach Operations | `data-insufficient` |
| 21 | Parent Trust Coverage | Parent & Communication | `demo-only` |
| 22 | Level Readiness Accuracy | Player Development | `demo-only` |
| 23 | Development Bottleneck by Level | Player Development | `live` |
| 24 | Curriculum Effectiveness Score | Curriculum & Session Quality | `data-insufficient` |
| 25 | Session Development Yield | Curriculum & Session Quality | `demo-only` |

**Totals: 2 live · 16 demo-only · 7 data-insufficient**

---

## Data Gaps Summary

| Gap | Affected KPIs | Resolution |
|---|---|---|
| `session_blocks.actual_status` not persisted to DB (Sprint 48 localStorage gap) | 18, 20 | Resolve Sprint 48 — add `status` persistence to DB via server action |
| No parent send infrastructure | 5, 6 | Block 3+ — requires messaging provider integration |
| No parent response/acknowledgement tracking | 6 | Requires `parent_responses` table or `acknowledged_at` column |
| `players` has no `deactivated_at` timestamp | 8 | Add `deactivated_at` nullable column to `players` (migration) |
| `private_lesson_requests` not linked to `session_attendance` | 11 | Add `triggered_by_session_id` FK (migration) |
| Migration 062 not applied — `curriculum_class_template_blocks` | 17 | Apply migration 062 to live DB |
| `curriculum_levels` lacks `expected_duration_days` | 24 | Add column to `curriculum_levels` (migration) |
| `player_gate_status` may not be populated | 14 | Apply migrations 041–060 to live DB |
