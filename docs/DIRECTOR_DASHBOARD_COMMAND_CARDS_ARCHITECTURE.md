# Director Dashboard Command Cards — Architecture

**Sprint:** 146
**Date:** 2026-05-01

---

## Current Dashboard State

**File:** `src/app/director/page.tsx`

### Current structure:
- **Top row (4 MetricCards):** Total Players, Active, Pending Placement, Needs Attention
- **Middle (2-col grid):** Priority Queue + Pending Placement player lists
- **Bottom:** Academy Modules (3 live: Players/Curriculum/Sessions + 3 coming soon)

### Gaps:
- No command card for Sessions count
- No private lesson requests concept
- No Academy Alerts section or card
- No bottom quick-action tiles (current "Academy Modules" grid serves a different purpose)
- Top cards are informational metrics, not clickable command actions
- Active Coaches card is absent (was in spec, but never built)

---

## Current Available Data

| Data | Source | Availability |
|---|---|---|
| Active players count | `v_player_summary` filtered by `player_status = 'active'` | ✓ Available |
| Overall score / score delta | `v_player_summary.overall_score`, `.score_delta` | ✓ Available |
| Player focus areas | `v_player_summary.focus_areas` | ✓ Available (array) |
| Priority queue items | `v_academy_priority_queue` | ✓ Available |
| Sessions count | `sessions` table filtered by date range | ✓ Available |
| Session status | `sessions.status` enum | ✓ Available |
| Session attendance | `session_attendance` table | ✓ Available |
| Reassessment due | `v_reassessment_pipeline` | ✓ Available |
| Coach observations | `coach_observations` table | ✓ Available (player-linked) |
| UTR data | `utr_records` (separate table, `utr_current` field) | Conditionally available |
| Private lesson requests | Not built yet | ✗ Migration needed |
| Academy Alerts | Derived from existing data | ✓ Can be built deterministically |

---

## Top Command Card Plan

| Card | Metric | Route | Data source |
|---|---|---|---|
| Active Players | Count of `player_status = 'active'` | `/director/players/active` | `v_player_summary` |
| Academy Improvement | Avg `score_delta` or % improving | `/director/improvement` | `v_player_summary.score_delta` |
| Sessions | Sessions this week count | `/director/sessions/overview` | `sessions` table |
| Private Lesson Requests | Count with status = 'new' | `/director/private-lessons` | `private_lesson_requests` (new) |
| Academy Alerts | Deterministic count of attention items | `/director/alerts` | Multiple tables |

---

## Active Players Drilldown Plan

**Route:** `/director/players/active`

**Data:**
- `v_player_summary` filtered to `player_status = 'active'`
- Fields: `full_name`, `level_label`, `group_name`, `coach_name`, `focus_areas`, `overall_score`, `score_delta`, `player_id`

**UI:**
- Summary cards: total active, with current priority, missing development summary, needing review
- Player table: name, level, group, coach, focus areas, score delta signal
- Click → `/director/players/[playerId]` (existing profile page)

**Positive development language:**
- "Doing Well" for improving players (positive score_delta)
- "Working On" for focus_areas
- "Current Focus" from focus_areas[0]

---

## Academy Improvement Drilldown Plan

**Route:** `/director/improvement`

**Data:**
- `v_player_summary.score_delta` — score change since last assessment
- `v_player_summary.overall_score` — current composite score
- UTR if available (checked via `utr_records` table existence)
- If no meaningful data: honest message with structure showing the capability

**UI:**
- Summary cards: avg improvement, improving count, flat count, attention count
- Player table: name, group, coach, current score, delta, trend signal
- UTR note if applicable

---

## Sessions Drilldown Plan

**Route:** `/director/sessions/overview`

**Data:**
- `sessions` table filtered to this week (7 days)
- `session_attendance` count per session
- `profiles` for coach names
- `groups` for group names

**Sessions table has:** `status`, `session_notes`, `scheduled_date`, `scheduled_time`, `duration_min`
- No `coach_recap` field exists. Session notes field (`session_notes`) serves as recap.

---

## Private Lesson Requests Plan

**Migration:** `supabase/migrations/050_private_lesson_requests.sql`

**Table:** `private_lesson_requests`
- `id`, `academy_id`, `player_id`, `parent_profile_id`, `requested_coach_id`, `requested_by_user_id`
- `preferred_days`, `preferred_times`, `goal`, `notes`
- `status`: new | reviewing | assigned | scheduled | declined | completed
- `director_notes`

**RLS:**
- Directors and head coaches: SELECT/INSERT/UPDATE
- Parent write: deferred (parent portal identity safety unclear until parent-player relationship verified)

**Director Queue route:** `/director/private-lessons`
**Parent preview:** Disabled form card in `/parent`

---

## Academy Alerts Plan

**Route:** `/director/alerts`

**Deterministic alerts** (no AI):

| Alert Type | Source | Threshold |
|---|---|---|
| Missing development summary | `v_player_summary.focus_areas IS NULL` | Any active player |
| Missing current priority | `v_academy_priority_queue.open_priority_count = 0` | Any active player |
| Sessions missing notes/recap | `sessions.session_notes IS NULL AND status = 'completed'` | Any completed session |
| Private lesson requests waiting | `private_lesson_requests.status = 'new'` | Any pending |
| Reassessment due | `v_reassessment_pipeline.urgency IN ('overdue', 'due_soon')` | Any player |
| Players needing attention | `player_status IN ('on_hold', 'reassessment_due')` | Any player |

---

## Bottom Quick-Action Tiles Plan

| Tile | Route | Description |
|---|---|---|
| Onboarding Flow | `/director/players/import` | Add/import players and complete placement |
| Class Templates | `/director/class-templates` | Build academy class/session templates |
| Voice Note AI | `/director/review` (or `/coach/voice`) | Capture coach notes and structure them |
| Academy Intelligence | `/director/alerts` | Review alerts, trends, and recommendations |

---

## Schema Gaps

1. **No `private_lesson_requests` table** → Create via migration 050.
2. **No `coach_recap` field on sessions** → Use `session_notes` as recap proxy.
3. **UTR data** → `utr_records` table may not have data; show conditional note.
4. **Parent-player link** → `academy_memberships` links profiles to academies but parent-to-specific-player FK is not clear from schema review. Defer parent submission to future sprint.

---

## Data Limitations

- `score_delta` may be null for players without two assessments.
- `focus_areas` may be null for recently added players.
- UTR data may not exist for most academies.
- Session attendance count requires a join that may be expensive — aggregate at page load.

---

## Recommended Implementation Order

1. Sprint 147: Dashboard command cards (uses existing data + safe fallbacks)
2. Sprint 148: Active Players drilldown (existing v_player_summary)
3. Sprint 149: Academy Improvement drilldown (existing score_delta)
4. Sprint 150: Sessions overview (existing sessions table)
5. Sprint 151: Private lesson requests migration
6. Sprint 152: Private lessons director queue
7. Sprint 153: Parent portal preview (disabled form)
8. Sprint 154: Academy Alerts command center
9. Sprint 155: Language QA + docs

---

## Guardrails

- No automatic player level movement.
- No automatic communications.
- No parent data exposed unsafely.
- No calendar events or billing records.
- All mutations go through approved server actions with academy_id scoping.
- Private lesson request parent submission deferred until parent-player relationship is clear.
