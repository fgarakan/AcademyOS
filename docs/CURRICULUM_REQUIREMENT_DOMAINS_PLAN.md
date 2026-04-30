# Curriculum Requirement Domains — Schema Plan

**Sprint:** 29
**Date:** 2026-04-30
**Mode:** Schema inspection + planning only. No migrations. No implementation.
**Author:** Claude Code (schema-planning session)

---

## 1. Current Schema Reality

### Tables confirmed and inspected

#### `curriculum_stages`
Global. No `academy_id`.
- `id`, `stage` (enum: `red_foundation | orange_development | green_performance | yellow_competitive | high_performance`), `display_name`, `sort_order`, `color_hex`, `age_range_min/max`, `utr_range_min/max`, `stage_goal`
- No per-track (Skill/Competition/Fitness) differentiation.

#### `curriculum_levels`
Global. No `academy_id`.
- `id`, `stage`, `level_number`, `display_name`, `sort_order`
- Advancement threshold fields: `advance_min_outcomes`, `advance_min_domains_complete`, `advance_min_assessment_score`, `min_assessment_score`, `min_utr`, `is_assessment_required`
- No development track column. No per-pathway requirement differentiation.

#### `skill_progressions`
Global. No `academy_id`.
- `id`, `level_id` (FK → `curriculum_levels`), `domain` (enum: `skill_domain_type`), `description`, `success_criteria[]`, `failure_patterns[]`, `signal_indicators[]`, `outcome_confirmations[]`, `domain_weight`, `mastery_outcome_threshold`
- 8 skill domains only: `preparation | downswing | contact | finish | transition | movement | decision_making | competition_behavior`
- **These are Skill path only.** No competition or fitness track progressions.

#### `progression_rules`
Global. No `academy_id`. One row per level (enforced by UNIQUE on `level_id`).
- `id`, `level_id`, `min_total_outcomes`, `min_domains_mastered`, `min_assessment_score`, `blocking_signal_types[]`, `min_weeks_at_level`, `requires_final_assessment`, `requires_director_approval`
- General level-up criteria — NOT per-track.
- No source/version tracking.
- No academy override mechanism.

#### `v_curriculum_level_requirements` (VIEW — NOT a table)
Joins `curriculum_levels + curriculum_stages + progression_rules`.
- Returns: `level_id`, `stage`, `stage_name`, `level_number`, `level_name`, `sort_order`, `min_total_outcomes`, `min_domains_mastered`, `min_assessment_score`, `blocking_signal_types`, `min_weeks_at_level`, `requires_final_assessment`, `requires_director_approval`
- Flat general criteria. No track breakdown.

#### `player_curriculum_states`
Has `academy_id` (multi-tenant boundary).
- `id`, `player_id`, `academy_id`, `current_level_id`, `enrolled_at`, `last_evaluated_at`, `advancement_eligible`, `advancement_blocked_by[]`, `notes`
- Single-level state per player per academy. No track-specific state.

#### `player_domain_progress`
Has `academy_id` (multi-tenant boundary).
- `id`, `player_id`, `academy_id`, `level_id`, `domain` (skill_domain_type), `status` (progression_status), `outcome_count`, `positive_outcome_count`, `last_outcome_at`, `mastered_at`, `regression_detected_at`
- **Tracks per-domain mastery for the Skill path only** (8 domains of `skill_domain_type`).
- Not linked to named requirement definitions.
- No evidence link.

#### `player_progression`
Has `academy_id`. One row per player (one-to-one with `players`).
- Flat aggregate: `technical_score`, `tactical_score`, `competition_score`, `movement_score`, `behavioral_score`, `overall_score`, baselines, `promotion_ready`, `promotion_flagged_at/by`, `strengths[]`, `weaknesses[]`, `focus_areas[]`, `tags[]`
- Useful for "current development context" display in Sprint 28.
- NOT a per-requirement progress tracker. Not linked to named requirements or to evidence rows.

#### `player_priorities`
Has `academy_id`. Per-player, per-category priority rows.
- `category` (priority_category enum: `technical_skill | tactical_skill | physical_fitness | competition_exposure | behavioral | load_management | reassessment | promotion_readiness`)
- Adjacent to tracks but not formally linked to curriculum requirements.

#### `assessments`
Has `academy_id`, `player_id`. Track scores: `technical_score`, `tactical_score`, `competition_score`, `movement_score`, `behavioral_score`.
- Valid evidence source for future requirement-evidence linking.
- No FK to any curriculum requirement row.

#### `coach_observations`
Has `academy_id`, `player_id`.
- `content`, `observation_type` (string), `is_private`, `tags[]`, `session_id`
- Unstructured evidence. `tags[]` is a text array — no FK to curriculum requirements.
- No requirement link.

#### `session_attendance`
No `academy_id` on this table (limitation from Sprint 15).
- `player_id`, `session_id`, `status` (present/absent/late/excused)
- Valid evidence for attendance-based requirements.
- No requirement link.

#### `player_outcomes`
Has `academy_id`, `player_id`, `session_id`.
- Per-session per-player observation fields per domain (technical, tactical, movement, competition, behavioral).
- Valid evidence source.
- No requirement link.

#### `development_track` enum
`skill | competition | fitness | combined`
- Exists in `database.types.ts`.
- Used on `academy_levels.track` and `academy_calendar.applies_to_tracks`.
- **NOT present on any curriculum definition table** (`curriculum_levels`, `progression_rules`, `skill_progressions`).
- This is the existing hook for Skill/Competition/Fitness track concepts — but it has not been wired into the curriculum requirements layer yet.

#### App homework / external evidence
No such tables exist anywhere in the migration history (001–040). There is no `app_homework`, `external_evidence`, or `player_homework` table.

---

### What Sprint 28 can display now

- Current curriculum level name and stage name (from `v_player_curriculum_detail`)
- Advancement eligibility boolean (from `player_curriculum_states`)
- Next target level derived from `curriculum_levels` by `sort_order + 1`
- General advancement criteria from `v_curriculum_level_requirements`:
  - min_assessment_score
  - min_domains_mastered
  - min_total_outcomes
  - min_weeks_at_level
  - requires_director_approval
  - requires_final_assessment
  - blocking_signal_types
- Development scores from `player_progression`: technical, tactical, competition, movement

### What Sprint 28 cannot display

- Per-track (Skill / Competition / Fitness) requirement rows
- Named requirements with descriptions, measurement methods, or pass conditions
- Player progress status against a named requirement
- Evidence count tied to a specific requirement
- Academy-level override of any requirement
- Parent-safe or player-safe version of requirements

---

## 2. Missing Gap

The following schema layer is completely absent from the current database:

### 2A. No requirement domain classification table
There is no table that formally defines "Skill Path", "Competition Path", "Fitness Path" as queryable entities. The `development_track` enum exists in the database but is not connected to curriculum requirement definitions.

### 2B. No per-pathway named requirement rows
`progression_rules` has one row per level with aggregate thresholds. There is no table that defines individual named requirements (e.g., "Complete 5 matches in a competitive environment", "Demonstrate consistent first serve rate > 60%") broken out by track.

### 2C. No player progress tracking per named requirement
`player_domain_progress` tracks mastery for the 8 skill domains. There is no table that tracks a player's `not_started | in_progress | evidence_needed | met | waived | blocked` status against a specific named requirement.

### 2D. No requirement-to-evidence linkage
Coach observations, session outcomes, attendance records, and assessment scores are floating evidence. None of them have a FK or reference pointing to a specific curriculum requirement row. There is no linking table.

### 2E. No academy override mechanism
`progression_rules` is global (no `academy_id`). An academy cannot currently set a different minimum match count or override a global skill requirement for their player base.

### 2F. No visibility rules for parent/player portal
No field in any curriculum-related table controls whether a specific requirement is visible to a parent or a player. The existing `player_domain_progress` RLS allows players to read their own domain progress — but this is binary (all or nothing), not requirement-level visibility.

### 2G. No versioning on requirement definitions
If a global requirement is updated (e.g., the minimum match count changes), historical player progress rows have no way to reference which version of the requirement they were evaluated against. No `version` or `source_type` tracking exists.

### 2H. No fitness path requirement definitions
`skill_progressions` covers 8 skill domains. There is no equivalent table defining competition-readiness checkpoints or fitness standards (e.g., sprint times, serve speed, match endurance targets).

---

## 3. Recommended Schema Direction

The following tables are recommended as the minimum schema bridge. Each proposed name is deliberately distinct from existing objects.

> **Naming note:** The view `v_curriculum_level_requirements` already exists. The new table must NOT be named `curriculum_level_requirements` to avoid a naming collision that would confuse migrations and queries. The table name `curriculum_track_requirements` is recommended instead.

---

### Table A: `curriculum_requirement_domains`

**Purpose:** Define requirement categories — Skill Path, Competition Path, Fitness Path — as queryable first-class rows. Seeded once globally.

```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
key          TEXT NOT NULL UNIQUE         -- 'skill' | 'competition' | 'fitness'
label        TEXT NOT NULL                -- 'Skill Path'
description  TEXT                         -- short description for UI display
display_order INT NOT NULL DEFAULT 0
is_active    BOOLEAN NOT NULL DEFAULT true
created_at   TIMESTAMPTZ DEFAULT now()
```

**Notes:**
- `key` values should align with `development_track` enum values (`skill`, `competition`, `fitness`). Do not include `combined` as a requirement domain.
- No `academy_id` — global reference data.
- Seed: 3 rows (skill, competition, fitness).

---

### Table B: `curriculum_track_requirements`

**Purpose:** Define named requirements for a specific curriculum level and pathway domain. Each row is one observable, evaluable requirement.

```sql
id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()
academy_id                UUID REFERENCES academies(id)     -- NULL = global default
curriculum_level_id       UUID NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE
requirement_domain_id     UUID NOT NULL REFERENCES curriculum_requirement_domains(id)
title                     TEXT NOT NULL
description               TEXT
requirement_type          TEXT NOT NULL                     -- 'count' | 'threshold' | 'boolean' | 'duration'
measurement_method        TEXT                              -- human-readable: "session outcomes", "match results", "assessment score"
target_value              NUMERIC(8,2)                      -- nullable; used for count/threshold types
unit                      TEXT                              -- 'outcomes' | 'matches' | 'weeks' | 'score' | '%'
pass_condition            TEXT NOT NULL DEFAULT 'gte'       -- 'gte' | 'eq' | 'manual' | 'confirmed'
evidence_policy           TEXT NOT NULL DEFAULT 'supporting'-- 'automatic' | 'supporting' | 'manual_only'
is_required               BOOLEAN NOT NULL DEFAULT true     -- if false, this is "nice to have"
display_order             INT NOT NULL DEFAULT 0
is_parent_visible_default BOOLEAN NOT NULL DEFAULT false
is_player_visible_default BOOLEAN NOT NULL DEFAULT false
source_type               TEXT NOT NULL DEFAULT 'global_default' -- 'global_default' | 'academy_override' | 'program_override'
source_id                 UUID                              -- nullable; references the global row being overridden
version                   INT NOT NULL DEFAULT 1
is_active                 BOOLEAN NOT NULL DEFAULT true
created_at                TIMESTAMPTZ DEFAULT now()
updated_at                TIMESTAMPTZ DEFAULT now()

UNIQUE (academy_id, curriculum_level_id, requirement_domain_id, title)
```

**Notes:**
- Global requirements have `academy_id = NULL`.
- Academy overrides have `academy_id = <uuid>` and `source_id` pointing to the global row.
- `evidence_policy`: `automatic` means system can auto-mark met from linked evidence; `supporting` means evidence counts toward but coach must confirm; `manual_only` requires coach/director explicit confirmation.
- `pass_condition`: `gte` = target_value threshold met; `eq` = exact match; `manual` = coach must mark it; `confirmed` = director must confirm.
- `version` is incremented when a global requirement is modified; historical player progress rows reference the requirement row's ID (not version), so queries must handle deactivated rows by checking `is_active`.
- This table DOES NOT replace `progression_rules` — that table remains for the aggregate curriculum advancement check. This table defines per-requirement rows within each track.

---

### Table C: `player_requirement_progress`

**Purpose:** Track each player's progress toward a specific named curriculum requirement. One row per player per requirement (at their current level).

```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
academy_id            UUID NOT NULL REFERENCES academies(id)
player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE
curriculum_level_id   UUID NOT NULL REFERENCES curriculum_levels(id)
requirement_id        UUID NOT NULL REFERENCES curriculum_track_requirements(id)
status                TEXT NOT NULL DEFAULT 'not_started'
                      -- 'not_started' | 'in_progress' | 'evidence_needed' | 'met' | 'waived' | 'blocked'
progress_value        NUMERIC(8,2)                          -- current measured value (if numeric type)
evidence_count        INT NOT NULL DEFAULT 0                -- cached count of linked evidence rows
last_evidence_at      TIMESTAMPTZ
coach_confirmed_by    UUID REFERENCES profiles(id)
director_confirmed_by UUID REFERENCES profiles(id)
confirmed_at          TIMESTAMPTZ
notes                 TEXT
is_parent_visible     BOOLEAN NOT NULL DEFAULT false
is_player_visible     BOOLEAN NOT NULL DEFAULT false
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()

UNIQUE (academy_id, player_id, requirement_id)
```

**Notes:**
- `status = 'met'` requires either evidence threshold reached + policy allows auto, or coach/director confirmation.
- `status = 'waived'` requires director action only.
- `is_parent_visible` and `is_player_visible` can override the requirement's defaults per player.
- When a player advances to a new level, new rows are created for the new level's requirements.
- Old rows (from previous levels) are preserved for the portable player record.

---

### Table D: `requirement_evidence_links`

**Purpose:** Link a specific piece of evidence to a specific requirement progress row.

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
academy_id        UUID NOT NULL REFERENCES academies(id)
player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE
requirement_id    UUID NOT NULL REFERENCES curriculum_track_requirements(id)
evidence_type     TEXT NOT NULL
                  -- 'coach_observation' | 'assessment' | 'attendance' | 'session_outcome'
                  -- | 'match_result' | 'app_homework'
evidence_id       UUID NOT NULL               -- FK to the source row (polymorphic by evidence_type)
evidence_summary  TEXT                        -- human-readable snapshot at time of link
confidence        NUMERIC(4,3)               -- 0.0–1.0 optional weight
created_by        UUID NOT NULL REFERENCES profiles(id)
created_at        TIMESTAMPTZ DEFAULT now()
is_parent_safe    BOOLEAN NOT NULL DEFAULT false

UNIQUE (requirement_id, evidence_type, evidence_id)   -- same piece of evidence linked once per requirement
```

**Notes:**
- Polymorphic evidence_id: when `evidence_type = 'coach_observation'`, `evidence_id` points to `coach_observations.id`. When `evidence_type = 'assessment'`, points to `assessments.id`. Etc.
- This is a soft polymorphic FK — no enforced FK constraint per type (standard practice in multi-source evidence systems). Application layer enforces validity.
- `is_parent_safe = false` for coach_observations where `is_private = true`.
- `confidence` can later feed into a scoring model (not Sprint 29 scope).
- No FK to `player_requirement_progress` directly — the link is via `requirement_id + player_id`. This allows a single evidence row to support multiple requirements without duplicating the link record.

---

### Table E (Optional): Skip — use `academy_id` nullable on `curriculum_track_requirements`

The separate `academy_requirement_overrides` table is **not recommended** for Sprint 30. The nullable `academy_id` pattern on `curriculum_track_requirements` is sufficient and simpler:
- `academy_id = NULL` → global default
- `academy_id = <uuid>` → academy-specific override or addition
- `source_id = <global_row_uuid>` → documents which global row this overrides

A separate overrides table would add a third join layer without benefit at this stage. Revisit if academies need to override non-requirement fields (e.g., visibility settings, labeling).

---

## 4. Relationship Map

```
curriculum_levels
  └─ curriculum_track_requirements (via curriculum_level_id)
       ├─ curriculum_requirement_domains (via requirement_domain_id)
       └─ player_requirement_progress (via requirement_id)
            └─ requirement_evidence_links (via requirement_id + player_id)
                 ├─ coach_observations (evidence_type='coach_observation')
                 ├─ assessments (evidence_type='assessment')
                 ├─ session_attendance (evidence_type='attendance')
                 └─ player_outcomes (evidence_type='session_outcome')

player_curriculum_states
  └─ player_requirement_progress (via curriculum_level_id + player_id)
       └─ player profile progression display (Skill / Competition / Fitness tabs)
            └─ future parent/player dashboard (filtered by is_parent_visible / is_player_visible)
```

### Evidence flow for coach observations

```
voice_notes (raw transcript)
  └─ coach_observations (structured, is_private=true by default)
       └─ requirement_evidence_links (created by coach/director action)
            └─ player_requirement_progress.evidence_count incremented
                 └─ status possibly updated (if evidence_policy='automatic')
                      └─ director-approved level movement (via evaluate_player_curriculum_advancement)
```

---

## 5. Product Rules

1. **Requirements do not auto-promote players.** No new table or view can trigger `finalize_player_placement()` or advance `player_curriculum_states.current_level_id`. Level movement remains exclusively in `evaluate_player_curriculum_advancement()` + director approval.

2. **Evidence supports but does not auto-confirm.** Linking a `coach_observation` to a requirement increments `evidence_count` but does not mark the requirement `met` unless `evidence_policy = 'automatic'` (reserved for clearly objective criteria like attendance counts).

3. **Coach observations are internal by default.** A `coach_observation` with `is_private=true` linked via `requirement_evidence_links` must have `is_parent_safe=false` on the link row. Parent/player cannot see the observation content — only a safe summary if the requirement itself is visible.

4. **Parent/player visibility is explicit, not default.** `is_parent_visible_default=false` on all initial requirement seeds. The director must explicitly enable visibility per requirement or per player.

5. **Academy overrides do not overwrite global defaults.** When an academy creates an override row (with `academy_id` set), the global row (`academy_id=NULL`) is preserved. The query layer must prefer the academy-specific row when present.

6. **Versioning preserves historical progress.** When a requirement definition is materially changed, a new row is created (`is_active=true`) and the old row is deactivated (`is_active=false`). `player_requirement_progress` rows reference the requirement_id — deactivated requirement rows remain readable. A progress row linked to a deactivated requirement is marked `status='waived'` unless the director explicitly migrates it.

7. **Director approval required for level movement.** This rule is already enforced by `progression_rules.requires_director_approval` and the existing `evaluate_player_curriculum_advancement()` function. The new requirement layer adds supporting data to that decision — it does not bypass it.

---

## 6. UI Implications

The current `PlayerProgressionRequirements.tsx` (Sprint 28) shows:

```
[Current Level]          [Next Target]
Advancement Criteria (flat list from progression_rules)
Current Development Scores (4 tiles from player_progression)
```

After the new schema is built, the section should evolve to:

```
[Current Level]          [Next Target]
Advancement Status chip (eligible / not eligible)

SKILL PATH
  ├── [Requirement 1]  status chip  evidence count
  ├── [Requirement 2]  status chip  evidence count
  └── [Requirement N]  ...

COMPETITION PATH
  ├── [Requirement 1]  status chip  evidence count
  └── [Requirement N]  ...

FITNESS PATH
  ├── [Requirement 1]  status chip  evidence count
  └── [Requirement N]  ...

Related Active Priorities (links from player_priorities)
```

**Status chip values:** Not Started / In Progress / Evidence Needed / Met / Waived / Blocked

**Evidence count:** integer badge showing how many linked evidence rows exist per requirement.

**Parent-safe version (future portal):** Same structure, filtered to `is_player_visible=true` / `is_parent_visible=true` rows, with evidence shown as counts only (no raw observation text). Player-facing language: "mission" metaphor. Parent-facing language: plain, informational.

**Sprint 28 component does not need to change now.** It already displays a placeholder note: "Per-track level requirements across Skill, Competition, and Fitness will be connected in a future curriculum sprint."

---

## 7. Migration Plan — Do Not Create

**Recommended future migration sequence:**

### Migration A: Domain and requirement definition tables
- Create `curriculum_requirement_domains`
- Create `curriculum_track_requirements`
- Add RLS to both
- Add `updated_at` trigger to `curriculum_track_requirements`
- **Does NOT seed requirements yet.**

### Migration B: Player requirement progress table
- Create `player_requirement_progress`
- Add RLS
- Add `updated_at` trigger
- Add indexes: `(academy_id, player_id)`, `(requirement_id)`, `(academy_id, player_id, curriculum_level_id)`

### Migration C: Evidence link table
- Create `requirement_evidence_links`
- Add RLS
- Add indexes: `(requirement_id, player_id)`, `(evidence_type, evidence_id)`

### Migration D: Views for player progression dashboard
- Create `v_player_track_requirement_progress` — joins `curriculum_track_requirements + curriculum_requirement_domains + player_requirement_progress`
- Returns: level_id, player_id, domain_key, domain_label, requirement title, status, progress_value, evidence_count, is_parent_visible, is_player_visible
- Replace `v_curriculum_level_requirements` view or extend it with per-track count columns

### Migration E: RLS policies
- `curriculum_requirement_domains`: authenticated read; director/head write
- `curriculum_track_requirements`: authenticated read for global rows (`academy_id IS NULL`); academy-scoped read for academy rows; director/head write scoped by academy_id
- `player_requirement_progress`: staff read scoped by `academy_id`; player reads own rows (filtered by `is_player_visible`); parent reads own child's rows (filtered by `is_parent_visible`)
- `requirement_evidence_links`: staff read scoped by `academy_id`; parent/player access only through the progress view (no direct access)

### Migration F: Seed starter curriculum requirements
- Seed 3 rows in `curriculum_requirement_domains` (skill, competition, fitness)
- Seed starter requirements for Red 1 through Orange 3 (bottom half of curriculum) first
- Example Skill requirements: "Complete N positive skill outcomes for [domain]", "Demonstrate consistent technique in 3 consecutive sessions"
- Example Competition requirements: "Participate in N internal challenge matches", "Demonstrate sportsmanship criteria in competitive play"
- Example Fitness requirements: "Meet session attendance standard for N weeks", "Complete agility assessment at target level"
- All seeds: `is_parent_visible_default=false`, `is_player_visible_default=false`, `evidence_policy='supporting'`

---

## 8. RLS / Multi-Tenant Requirements

### Global requirement definitions (`curriculum_track_requirements` where `academy_id IS NULL`)
- Readable by any authenticated staff member across all academies.
- Writable only by platform owner or platform admin (future) or academy director (for their own academy rows only).
- Academy-specific rows (`academy_id IS NOT NULL`) scoped by `academy_id = auth_academy_id()`.

### Player requirement progress (`player_requirement_progress`)
- Staff (director, head_coach, coach) can read all rows within their academy: `academy_id = auth_academy_id() AND auth_is_staff()`
- Player can read own rows where `is_player_visible = true`: `player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()) AND is_player_visible = true`
- Parent can read their child's rows where `is_parent_visible = true` (requires `player_guardians` join): scoped similarly with `is_parent_visible = true`
- No write access for players or parents.
- Director/head can write: confirm, waive, update notes.

### Evidence links (`requirement_evidence_links`)
- Staff: read all within `academy_id = auth_academy_id()`
- Players/parents: no direct table access. Data surfaced through the view with safe fields only (`evidence_count`, sanitized summary).

### Cross-academy isolation
- All player-scoped tables must include `academy_id` and enforce `academy_id = auth_academy_id()` in RLS.
- `curriculum_track_requirements` with `academy_id IS NULL` are global reference rows — readable by all authenticated users, but no per-academy data bleeds through since they contain no player data.

### Consultant / multi-academy roles (future)
- Not in scope for Sprint 30. Defer until after the platform preview system can be extended with multi-academy read grants.
- When implemented: a consultant with multi-academy access needs an expanded `auth_academy_id()` function or a join through a `consultant_academy_access` table.

---

## 9. Future Sprints

### Sprint 30 — Requirement Domain Tables Migration
**Goal:** Apply Migration A + B (Tables, RLS, indexes). No seed data yet. No UI changes.
**Deliverable:** `curriculum_requirement_domains` and `curriculum_track_requirements` and `player_requirement_progress` tables exist in the database with RLS enabled. TypeScript types regenerated.

### Sprint 31 — Starter Requirement Seed Pack V1
**Goal:** Apply Migration F. Seed 3 domains and starter requirements for levels Red 1 through Orange 3.
**Deliverable:** Directors can query real requirement rows. PlayerProgressionRequirements component can be updated to show grouped requirement titles without breaking.

### Sprint 32 — Player Requirement Progress Read-Only View
**Goal:** Apply Migration C (evidence links table) + Migration D (view).
Build the `v_player_track_requirement_progress` view.
Update `PlayerProgressionRequirements.tsx` to display per-track sections (Skill / Competition / Fitness) with requirement titles and status chips.
**Deliverable:** Player profile shows real per-track requirement rows, grouped by domain. Status is `not_started` for all (no progress data yet). Evidence count shows 0.

### Sprint 33 — Evidence-to-Requirement Linking Drafts V1
**Goal:** Allow directors/coaches to link a `coach_observation` to a requirement via a server action.
- New UI action: from the coach observation feed, a "Link to Requirement" dropdown (lists active requirements for the player's current level).
- Creates a `requirement_evidence_links` row.
- Increments `player_requirement_progress.evidence_count`.
- Does NOT auto-update `status`.
**Deliverable:** Evidence count updates on the requirement view after linking.

### Sprint 34 — Requirement Progress Confirmation V1
**Goal:** Allow directors to manually mark a requirement as `met` or `waived`.
- New server action: `confirmRequirementAction(requirementProgressId, status: 'met' | 'waived', notes)`.
- Validation: only `academy_director` or `head_coach` can confirm.
- Records `coach_confirmed_by` or `director_confirmed_by` and `confirmed_at`.
- Writes to `audit_logs`.
- No automatic level promotion.
**Deliverable:** Director can mark requirements complete. Status chips update on player profile.

---

## 10. Final Recommendation

**Implement Migration A (domain + requirement tables) in Sprint 30.**

Reasoning:
1. The schema gap is real and confirmed — no per-track requirement rows exist anywhere in 40 migrations.
2. The proposed tables are additive — they do not touch any existing table, view, or RLS policy.
3. The existing `progression_rules` and `v_curriculum_level_requirements` are preserved and continue to function for the current advancement evaluation logic.
4. The naming collision risk (`v_curriculum_level_requirements` view vs proposed table name) is resolved by using `curriculum_track_requirements` as the table name.
5. Starting with Migration A and B (no evidence links, no views, no seed data) is the minimum safe step — it establishes the schema shape so that Sprint 31 seeding and Sprint 32 UI can proceed without additional structural changes.
6. Do NOT delay schema work to continue UI. The UI is correctly blocked on this schema; the placeholder note in Sprint 28 accurately communicates the gap. Proceed with the migrations.

**Do not defer to a different UI track.** The curriculum spine is the central player record object. The director-facing player operating spine (Phase 1 current target) is incomplete without this layer. Every sprint that adds UI to the player profile needs per-track requirements to be real schema-backed data, not placeholders.

---

## Appendix: Schema Inspection Checklist

| Table / View | Exists | Has academy_id | Has track/domain | Evidence link | Notes |
|---|---|---|---|---|---|
| `curriculum_stages` | ✓ | ✗ | ✗ | — | Global reference |
| `curriculum_levels` | ✓ | ✗ | ✗ | — | Global reference |
| `curriculum_stages` | ✓ | ✗ | ✗ | — | Global reference |
| `skill_progressions` | ✓ | ✗ | Skill only (8 skill domains) | — | No competition/fitness equivalent |
| `progression_rules` | ✓ | ✗ | ✗ | — | General level criteria only |
| `v_curriculum_level_requirements` | ✓ (VIEW) | ✗ | ✗ | — | Flat view, no track breakdown |
| `player_curriculum_states` | ✓ | ✓ | ✗ | — | Single-level state per player |
| `player_domain_progress` | ✓ | ✓ | Skill only | ✗ | 8 skill_domain_type domains only |
| `player_progression` | ✓ | ✓ | Scores only | ✗ | Flat aggregate, not per-requirement |
| `player_priorities` | ✓ | ✓ | Category (not track) | ✗ | Adjacent but not curriculum-linked |
| `assessments` | ✓ | ✓ | Score dimensions | ✗ | Valid future evidence source |
| `coach_observations` | ✓ | ✓ | ✗ | ✗ | Valid future evidence source |
| `session_attendance` | ✓ | ✗ | ✗ | ✗ | No academy_id — limitation noted |
| `player_outcomes` | ✓ | ✓ | Obs dimensions | ✗ | Valid future evidence source |
| `curriculum_requirement_domains` | ✗ | — | — | — | **MISSING — Sprint 30** |
| `curriculum_track_requirements` | ✗ | — | — | — | **MISSING — Sprint 30** |
| `player_requirement_progress` | ✗ | — | — | — | **MISSING — Sprint 30** |
| `requirement_evidence_links` | ✗ | — | — | — | **MISSING — Sprint 33** |
| App homework / external evidence | ✗ | — | — | — | Does not exist anywhere |
