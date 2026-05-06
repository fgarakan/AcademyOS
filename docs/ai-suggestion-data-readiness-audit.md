# AI Suggestion Data Readiness Audit

**Status:** Audit — no code changes.
**Date:** 2026-05-06
**Sprint:** 99

This document audits what historical data currently exists in Academy OS and
what is missing or insufficient for future AI lesson planning and suggestion features.

---

## Audit summary

| Data domain | Status | Gap level |
|---|---|---|
| Template structure | ✓ Exists | Low — no version history |
| Session planned data | ✓ Exists | Medium — missing source version label |
| Session actuals (block-level) | Partial | High — wrap-up only, no normalized table |
| Session actuals (exercise-level) | Partial | Medium — in `session_block_exercises` |
| Coach notes | ✓ Exists | Medium — unstructured text blobs |
| Attendance | ✓ Exists | Medium — per-session, no trend aggregation |
| Player observations | ✓ Exists | Medium — needs structured tagging |
| Player assessments | ✓ Exists | Low — well structured |
| Curriculum context | ✓ Exists | Low — well structured |
| Exercise library | ✓ Exists | Low — 83 exercises |
| AI suggestion readiness | Partial | High — requires normalized actuals |

---

## Template data

**What exists:**
- `templates` table with name, description, tags, duration
- `template_blocks` — block type, name, duration, order
- `template_block_exercises` — exercise assignments per block (RLS fixed Sprint 89)
- `exercises` — 83 exercises with category, subcategory, duration

**What is missing:**
- `template_versions` table — no history of changes (Sprint 98 plan created)
- No block-level performance correlation (which blocks are consistently skipped?)
- No exercise difficulty ratings
- No exercise outcome correlation

**AI readiness:** Medium. Enough structure to suggest block type sequences. Cannot yet reason about "this exercise works better for this group."

---

## Session planned data

**What exists:**
- `sessions` table with date, status, coach, template_id, group_id
- `session_blocks` — planned blocks at generation time
- `session_block_exercises` — planned exercises at generation time (RLS pending migration 056)
- `sessions.session_notes` — curriculum context prefix added by `generateSessionFromTemplateAction`

**What is missing:**
- `sessions.source_template_version` — which version of the template was used (Sprint 98 plan)
- No timestamp for when the session was generated (only `created_at`)
- No planned load calculation (sum of exercise durations per block type)

**AI readiness:** Medium. AI can compare plan vs actual if actuals normalized. Currently actuals live in text blobs.

---

## Session actuals data

**What exists:**
- `sessions.session_notes` — free-text wrap-up summary written by `applyWrapUpDraftAction`
- `session_block_exercises.completed` + `.notes` — exercise-level completed + `[Skipped]`/`[Modified]` notes (Sprint 94)
- `proposed_actions` with `target_module = 'session_wrap_up_v1'` — structured wrap-up payload
- `PlannedVsActualDiffPanel` reads from `proposed_actions` wrap-up payload

**What is missing:**
- `session_actuals` normalized table (Sprint 96 plan) — the critical gap
- `session_actual_blocks` — block-level actual status in normalized form
- `session_actual_exercises` — exercise-level actual status in normalized form
- Block status (planned/in_progress/completed/skipped/modified) lives in localStorage only — NOT persisted to DB (known limitation Sprint 48)
- No aggregate: "what percentage of warm-up blocks are being skipped?"

**AI readiness:** Low. The wrap-up payload has some structure, but querying patterns across sessions requires normalized tables. A `SELECT WHERE exercise_id = X AND actual_status = 'skipped'` query is not possible today.

**Blocker:** Migrations 059–063 (Sprint 96 plan). STOP condition required before proceeding.

---

## Coach notes

**What exists:**
- `voice_notes` table — raw text input from coach recap (Quick Note + WrapUp Q1)
- `proposed_actions` with `target_module = 'session_recap_structuring'` — structured coach drafts
- `session_block_exercises.notes` — per-exercise session notes

**What is missing:**
- Structured tagging on coach notes (e.g. "struggling with", "excelling at", "behavior concern")
- Player-specific notes that survive session archival
- No aggregate: "what does Coach Brian observe most often about Group 8U?"

**AI readiness:** Low. Coach notes are high-signal but unstructured. An NLP layer would be needed to extract entities and sentiments. Pattern queries require structured tags.

---

## Attendance

**What exists:**
- `session_attendance` table — per-player, per-session, status (present/absent/late/excused)
- `session_attendance.marked_by` + `marked_at`
- Attendance badge visible to director in session detail

**What is missing:**
- Attendance trends per player (rolling absence rate)
- Group attendance patterns (consistently low for certain times/days)
- `session_actual_attendance` normalized snapshot (Sprint 96 plan)
- No correlation: "players with >20% absence have lower skill progression"

**AI readiness:** Medium. Raw data exists. Aggregate views are missing. The `v_academy_overview` or similar view could provide rolling absence rate with a migration.

---

## Player observations

**What exists:**
- `player_development_signals` — structured signals with domain, signal_type, magnitude
- `player_development_summary` — aggregated summary (current_strengths, things_to_work_on)
- `player_priorities` — active coaching priorities
- `player_individual_development_plans` — IDP with coach-facing and parent-facing sections

**What is missing:**
- Session-linked observations (observation created during session X, linked to session_actuals)
- Time-stamped observation timeline (was Sprint 239 output)
- Observation source tracking (was this from voice, manual, assessment?)
- No cross-player pattern: "3 players in Group Red show the same forehand breakdown"

**AI readiness:** Medium-high. Development signals are well-structured. The gap is session linkage and cross-player pattern queries.

---

## Player assessments

**What exists:**
- `assessments` table — 5-dimension assessment: technique, physicality, competition, mental, intelligence
- `finalize_player_placement()` RPC — assessment → curriculum level assignment
- `src/lib/backend/assessments.ts` — `getAssessmentHistory()` function

**What is missing:**
- Periodic re-assessment schedule (no recurrence model)
- Assessment trend per dimension over time
- Assessment-to-session correlation (which sessions preceded significant improvements?)

**AI readiness:** High for initial placement. Low for progress measurement — no trend model yet.

---

## What gaps prevent AI lesson planning today

1. **No normalized session actuals** — AI cannot query "what percentage of agility exercises are skipped for Group Red" without `session_actual_exercises` table (migration 059–063 required).

2. **No template version history** — AI cannot say "Template X used to have 5 exercises, now has 8 — did outcomes improve?" (migration 064 required).

3. **Block status not persisted** — Coach block status lives in localStorage. AI cannot ask "how often is the Cool Down block marked as skipped?" without persisting to DB (migration: add `status` column to `session_blocks`).

4. **Coach notes unstructured** — AI cannot extract patterns from text blobs without an NLP/embedding layer. The `proposed_actions` structured wrap-up is closer but still text-heavy.

5. **No attendance trend view** — Rolling absence rate per player not queryable today.

6. **No session-to-assessment correlation** — Cannot ask "did adding an extra fitness block improve strength scores?"

---

## Top 10 data fields needed next

| Priority | Field | Table | How to get |
|---|---|---|---|
| 1 | `session_actual_exercises.actual_status` | New table | Migration 061 |
| 2 | `session_actual_blocks.actual_status` | New table | Migration 060 |
| 3 | `session_blocks.status` | Existing table | Migration: add column + persist from CoachSessionExecutionClient |
| 4 | `template_versions.version_label` | New table | Migration 064 |
| 5 | `sessions.source_template_version` | Existing table | Migration 066 |
| 6 | `player_development_signals.session_id` | Existing table | Migration: add FK column |
| 7 | `session_attendance` rolling 30-day rate view | View | Migration: add DB view |
| 8 | `template_block_exercises.difficulty_rating` | Existing table | Migration: add column |
| 9 | `session_actual_exercises.coach_note` | New table | Migration 061 |
| 10 | `player_development_signals.source_type` | Existing table | Already has `signal_type`; add `source = voice/assessment/manual` |

---

## Safe AI suggestion guardrails

Any AI suggestion produced by the system must:

1. **Never auto-apply** — All suggestions go through `proposed_actions` with `status = 'pending_review'`. Director approves before anything executes.
2. **Never mutate curriculum** — AI can suggest curriculum level changes; only `finalize_player_placement()` can execute them after director approval.
3. **Never mutate templates directly** — AI suggestions for templates create a new draft version for director review, never overwrite the live template.
4. **Never expose coach notes to parents/players** — All AI summaries for parent/player consumption must be filtered through `parentSafeResponseRules.ts`.
5. **Always cite data source** — AI suggestion payload must include which data points drove the recommendation (e.g., "based on 5 sessions, 3 of which had Speed block skipped").
6. **Confidence gate** — Suggestions with confidence below 0.6 should be downgraded to "observation" rather than "suggestion".
7. **Never suggest on insufficient data** — Minimum 3 completed sessions required before block-level suggestions. Minimum 5 for exercise-level suggestions.
8. **Director override always wins** — Any director-applied override must be preserved and respected in future AI suggestions (the override guardrail model in `voiceRoleGuardrails.ts` pattern applies).

---

## Recommended next 3 actions

1. **STOP and get approval** for migrations 059–063 (session actuals) — this is the highest-leverage data unlock.
2. **Persist block status to DB** — Add `status` column to `session_blocks` via migration (1 migration, high value).
3. **Add `source_template_version` to sessions** — 1 column, enables version-to-outcome correlation.

Subsequent sprints should layer AI suggestion generation only after at least items 1 and 2 are complete.
