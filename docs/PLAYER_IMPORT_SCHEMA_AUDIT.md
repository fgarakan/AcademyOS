# Player Import Schema Audit

**Sprint:** 101
**Date:** 2026-05-01

---

## Purpose

Audit the existing player, group, curriculum, development, and priority schema to determine the safest, most reliable path for bulk player import.

---

## Tables Relevant to Import

### players (`004_players.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `academy_id` | UUID | Yes | Resolved from authenticated director |
| `first_name` | TEXT | Yes | Import required |
| `last_name` | TEXT | Yes | Import required |
| `full_name` | GENERATED | — | Auto-computed, never insert |
| `date_of_birth` | DATE | **Yes** | NOT NULL — see note below |
| `gender` | TEXT | No | skip in V1 import |
| `status` | player_status enum | No | Defaults to `pending_placement`; import sets `active` |
| `is_active` | BOOLEAN | No | Defaults to `true` |
| `current_group_id` | UUID FK → groups | No | Updated via group_memberships pattern |
| `current_level_id` | UUID FK → academy_levels | No | Old level system — do NOT populate from curriculum_level import |
| `primary_coach_id` | UUID FK → profiles | No | Optional; requires coach name → profile lookup |
| `join_date` | DATE | No | Defaults to today |
| `created_by` | UUID FK → profiles | No | Import sets to importing director's user.id |
| `notes` | TEXT | No | Not imported (not coach notes) |

**date_of_birth note:** This column is `NOT NULL` with no default. The import handles this as follows:
- If `birth_year` is provided: use `{birth_year}-07-01` (mid-year estimate)
- If `birth_year` is not provided: use `1900-01-01` (sentinel for "unknown") + warning in report

**status note:** Players arriving via import are existing academy players, not new placements. The import sets `status = 'active'` directly. This bypasses the `finalize_player_placement()` RPC which is designed for new student onboarding — a documented deviation.

---

### groups (`002_core_identity.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `academy_id` | UUID | Yes | |
| `name` | TEXT | Yes | Match by name in import |
| `is_active` | BOOLEAN | No | Defaults true |

Group assignment in import: look up group by exact `name` within academy. If not found → skip + warning.

---

### group_memberships (`004_players.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `academy_id` | UUID | Yes | |
| `player_id` | UUID | Yes | |
| `group_id` | UUID | Yes | |
| `is_current` | BOOLEAN | No | Defaults true |
| `joined_at` | TIMESTAMPTZ | No | Defaults NOW() |

Pattern: insert row; for updates, first set existing `is_current=false` before inserting new.

---

### player_curriculum_states (`036_curriculum_spine.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `player_id` | UUID | Yes | |
| `academy_id` | UUID | Yes | |
| `current_level_id` | UUID FK → curriculum_levels | Yes | Look up from `curriculum_level` column by display_name |
| `advancement_eligible` | BOOLEAN | No | Defaults false |
| UNIQUE constraint | `(player_id, academy_id)` | — | Use UPSERT pattern |

**Important:** This references `curriculum_levels` (not `academy_levels`). Match by `display_name` in import.

---

### player_development_summary (`039_player_development_summary.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `player_id` | UUID | Yes | |
| `academy_id` | UUID | Yes | |
| `created_by` | UUID | Yes | Use importing director's user.id |
| `current_strengths` | TEXT[] | No | Defaults `{}` |
| `things_to_work_on` | TEXT[] | No | Defaults `{}` |
| `development_focus` | TEXT | No | Derived from `need_1` if present |
| `coach_summary` | TEXT | No | Maps to `coach_notes` in import |
| `show_to_student` | BOOLEAN | No | Defaults false — keep false |
| `show_to_parent` | BOOLEAN | No | Defaults false — keep false |
| UNIQUE constraint | `(player_id)` | — | Use UPSERT pattern |

---

### player_priorities (`020_player_priorities.sql`)

| Column | Type | Required | Notes |
|---|---|---|---|
| `player_id` | UUID | Yes | |
| `academy_id` | UUID | Yes | |
| `category` | priority_category enum | **Yes** | Required — default to `technical_skill` for imports |
| `title` | TEXT | Yes | Maps to `current_priority` in import |
| `priority_rank` | INTEGER | No | Defaults 1 |
| `is_active` | BOOLEAN | No | Defaults true |
| `status` | TEXT | No | Defaults `open` |
| `source_signal_ids` | UUID[] | No | Defaults `{}` |

---

## Fields Safe to Import Now

| Import Column | Target Table | Target Column | Notes |
|---|---|---|---|
| `first_name` | players | first_name | Required |
| `last_name` | players | last_name | Required |
| `display_name` | — | — | No display_name column in players; skip |
| `birth_year` | players | date_of_birth | Converted to `{year}-07-01` |
| `status` | players | status | Defaults to `active` |
| `primary_coach` | players | primary_coach_id | Lookup by profile display_name; skip if not found |
| `current_group` | group_memberships | group_id | Lookup by group name; skip if not found |
| `curriculum_level` | player_curriculum_states | current_level_id | Lookup by display_name; skip if not found |
| `strength_1/2/3` | player_development_summary | current_strengths | Merged into TEXT[] |
| `need_1/2/3` | player_development_summary | things_to_work_on | Merged into TEXT[] |
| `need_1` (first) | player_development_summary | development_focus | Use first need as focus |
| `current_priority` | player_priorities | title | category defaults to `technical_skill` |
| `coach_notes` | player_development_summary | coach_summary | Plain text |
| `ball_level` | — | — | Not a column in players; use as hint for curriculum_level lookup only |

---

## Fields to Defer

| Import Column | Reason |
|---|---|
| Parent email / phone | Sprint says do not import parent info |
| Billing / subscription | Out of scope for V1 import |
| Medical / injury notes | Sensitive — defer indefinitely |
| Gender / handedness / nationality | Optional player details — can be added to player profile manually |
| Assessment scores / UTR | Comes from the assessment system, not bulk import |
| Performance metrics | Comes from the intelligence system |

---

## Duplicate Detection Approach

Conservative two-pass check:
1. **Within upload**: flag if two rows share the same `first_name + last_name` (case-insensitive)
2. **Against DB**: query existing players in academy — flag if exact `first_name + last_name` matches an existing player

On exact duplicate:
- If player exists AND import provides new values (strengths, needs, priority) → offer to UPDATE development data only
- If player exists AND import has same name but different curriculum/group → skip and warn (require manual review)
- If player doesn't exist → create

---

## Group Assignment Approach

1. Query all active groups for this academy
2. Build a case-insensitive name → ID map
3. For each import row: look up `current_group` → if found, create `group_memberships` row
4. If not found: skip group assignment for that player, add warning

---

## Curriculum Level Assignment Approach

1. Query `curriculum_levels` by `display_name` for the academy
2. For each import row: look up `curriculum_level` → if found, upsert `player_curriculum_states`
3. If not found: skip, add warning
4. Also check academy-specific overrides if the academy has a custom version

---

## Priority Storage Approach

- Map `current_priority` → `player_priorities.title`
- Default `category = 'technical_skill'` (most import priorities are skill-based)
- Set `priority_rank = 1`, `is_active = true`, `status = 'open'`
- Only create if `current_priority` is non-empty

---

## Audit Trail Approach

On commit:
- Write one `audit_logs` row per completed batch with:
  - `action = 'player_import_commit'`
  - `target_type = 'player_import'`
  - `payload = { created_count, updated_count, skipped_count, ... }` (counts only, no private data)
  - `actor_id = user.id`

---

## Risks and Guardrails

| Risk | Mitigation |
|---|---|
| `date_of_birth NOT NULL` | Use `{birth_year}-07-01` or `1900-01-01` sentinel; always warn |
| Status bypass of placement engine | Director-authorized import; documented; audit log records it |
| Group name collisions across academies | All queries scoped with `academy_id` |
| Curriculum level name mismatch | Dry-run reports mismatches before commit |
| Overwriting existing data | Exact duplicate → update only development data; ambiguous → skip |
| `show_to_student/parent` | Always false on import; must be explicitly set by director later |
| `priority_category` wrong type | Default `technical_skill`; easy to correct per player later |
| `display_name` column doesn't exist | Skip — players use `full_name` (GENERATED) |

---

## Recommended Sprint 102–110 Path

| Sprint | Deliverable |
|---|---|
| 102 | CSV template + column documentation |
| 103 | Parser + dry-run validation utility (pure TS, no DB) |
| 104 | Dry-run server action (DB lookups, no mutation) |
| 105 | Import UI — paste + dry-run report |
| 106 | Commit server action (guarded mutations) |
| 107 | Commit UI — confirmation + result report |
| 108 | Development Profile Intake — bulk strengths/needs editor |
| 109 | Onboarding Review — who's ready, who's missing what |
| 110 | QA doc + Brian data prep demo |

