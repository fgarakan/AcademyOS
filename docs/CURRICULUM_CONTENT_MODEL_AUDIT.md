# Curriculum Content Model Audit V1

**Sprint:** 51
**Date:** 2026-05-01
**Mode:** Audit + planning only. No schema mutations. No UI changes.

---

## Purpose

Audit existing curriculum, exercise, template, session, requirement, and mapping structures to determine what exists and what is missing for a curriculum-aware content engine.

---

## What Exists

### Curriculum Spine (migrations 036–038)

| Table | Key Columns | Purpose |
|---|---|---|
| `curriculum_stages` | stage, display_name, sort_order, color_hex, age_range, utr_range, stage_goal | 5 stages (Red Foundation → High Performance) |
| `curriculum_levels` | id, stage, level_number (1–3), display_name, sort_order, min_assessment_score, min_utr, advance_min_outcomes, advance_min_domains_complete | 15 levels across 5 stages |
| `skill_domains` | id, domain, display_name, short_desc, sort_order | 8 domains (preparation, downswing, contact, finish, transition, movement, decision_making, competition_behavior) |
| `skill_progressions` | level_id, domain, description, success_criteria[], failure_patterns[], signal_indicators[], outcome_confirmations[], domain_weight | Per-level per-domain coaching metadata |
| `progression_rules` | level_id, min_total_outcomes, min_domains_mastered, min_assessment_score, min_weeks_at_level | Advancement gate rules |
| `parent_level_descriptions` | level_id, what_we_focus_on, what_success_looks_like, how_you_can_help, typical_session_structure | Parent-facing content per level |
| `player_curriculum_states` | player_id, academy_id, current_level_id, advancement_eligible, advancement_blocked_by | Per-player curriculum position |
| `player_domain_progress` | player_id, academy_id, level_id, domain, status, outcome_count, mastered_at | Per-player per-domain progress |
| `player_curriculum_history` | player_id, from_level_id, to_level_id, advanced_by, advanced_at | Level advancement log |

**Views:**
- `v_curriculum_overview` — director summary of all players by level
- `v_player_curriculum_detail` — player profile curriculum section with domain progress
- `v_curriculum_level_requirements` — advancement rules by level

### Requirements Layer (migrations 041–043)

| Table | Key Columns | Purpose |
|---|---|---|
| `curriculum_requirement_domains` | id, key (skill/competition/fitness), label, display_order | Three pathway buckets |
| `curriculum_track_requirements` | id, academy_id (nullable), curriculum_level_id, requirement_domain_id, title, description, requirement_type, measurement_method, target_value, unit, pass_condition, evidence_policy, is_required, display_order, is_parent_visible_default, is_player_visible_default, source_type, version, is_active | Named requirements per level and pathway |
| `player_requirement_progress` | id, academy_id, player_id, curriculum_level_id, requirement_id, status, progress_value, evidence_count, last_evidence_at, coach_confirmed_by, director_confirmed_by, confirmed_at, is_parent_visible, is_player_visible | Per-player requirement tracking |
| `requirement_evidence_links` | id, academy_id, player_id, requirement_id, player_requirement_progress_id, evidence_type, evidence_id, evidence_summary, confidence, weight, created_by, is_parent_safe | Polymorphic evidence links |

**Seeded requirements:** 32 rows for Orange 1 (10), Orange 2 (11), Orange 3 (11) via migration 043.

**Note:** These tables are NOT in `database.types.ts` (generated before migrations 041+). Code accesses them via `rawDb = supabase as any`.

### Exercise / Content System (migration 006)

| Table | Key Columns | Purpose |
|---|---|---|
| `exercises` | id, academy_id, name, description, category (exercise_category enum), subcategory, coaching_points, tags[], track (development_track), level_range (JSON), equipment[], duration_min, min_duration_min, max_duration_min, movement_pattern, skill_phase, transfer_level, typical_rpe, is_active, video_url | Academy-scoped exercise library |

### Template / Session System (migration 006–007)

| Table | Key Columns | Purpose |
|---|---|---|
| `templates` | id, academy_id, name, description, level_id, track (development_track), group_id, tags[], total_duration_min, is_active, is_default | Session template library |
| `template_blocks` | id, template_id, name, type (block_type enum), duration_min, intensity, notes, order_index | Named blocks within a template |
| `template_block_exercises` | id, block_id, exercise_id, duration_min, notes, order_index | Exercises assigned to template blocks |
| `sessions` | id, academy_id, ... | Scheduled/completed sessions |
| `session_blocks` | id, session_id, template_block_id, name, type, duration_min, intensity, notes, order_index, is_override | Session blocks (linked to template blocks) |
| `session_block_exercises` | id, block_id, exercise_id, duration_min, notes, order_index, completed | Session-level exercise execution |

**Key finding:** `templates` already has `level_id` (FK to `curriculum_levels`) and `track` (development_track enum) — curriculum targeting is partially modeled at the template level.

### Existing Enums

From `database.types.ts`:
- `block_type` — the enum used for template_blocks.type and session_blocks.type
- `exercise_category` — the enum for exercises.category
- `development_track` — skill / competition / fitness (used on exercises and templates)
- `curriculum_stage` — red_foundation, orange_development, green_performance, yellow_competitive, high_performance

### Population Logic (Sprint 46)

`populateFitnessTemplateBlocksAction` exists in `src/app/director/fitness/templates/[templateId]/actions.ts`. It:
- Matches blocks to exercises by category (using `BLOCK_TO_EXERCISE_CATEGORY` mapping)
- Fills blocks up to duration budget
- Skips already-populated blocks
- Uses exercises from the academy's exercise library

---

## What Is Missing

### 1. No drill/game/skill/assessment content home

The `exercises` table represents **fitness-oriented exercises** (warm_up, technical, tactical, movement, fitness, competition, mental, cool_down). It does not have fields for:
- Content type: `drill` vs `game` vs `skill` vs `assessment_task` vs `warmup_activity` vs `cooldown_activity`
- Success criteria (structured, per-content)
- Progressions / regressions (structured, per-content)
- Coach cues (structured list)
- Constraints (game constraints for tactical development)
- Player count min/max
- Court setup
- Difficulty rating independent of intensity
- Parent/player-safe name/description
- Whether this is an assessment moment
- Explicit link to curriculum_level_id (exercises use JSON level_range, not FK)

### 2. No content-to-requirement mapping

There is no table mapping content items (drills, games) to `curriculum_track_requirements`. The system cannot answer: "which drills help develop Orange 1 Rally Consistency requirement?"

### 3. No content-to-level mapping (structured)

`exercises.level_range` is JSON — not a FK to `curriculum_levels`. Cannot efficiently query "all content appropriate for Orange 2".

### 4. No content-to-block-type mapping

`template_block_exercises` links exercises to blocks, but there is no table that says: "this drill is appropriate for a `technical` block or a `tactical` block".

### 5. No curriculum-aware template population

`populateFitnessTemplateBlocksAction` matches exercises by **category** only — it is not curriculum-aware. It does not consider:
- Which level the template is for
- Which requirements the session is targeting
- What pathway (skill/competition/fitness) the block is part of
- What progression stage the player is in

### 6. No coach session curriculum context

The coach session page (`src/app/director/sessions/[sessionId]/page.tsx`) has no curriculum context — no level, no focus, no requirements, no cues.

### 7. Templates do not expose curriculum focus in UI

Although `templates` has `level_id` and `track`, the template builder UI has no selector for curriculum level or requirement focus.

### 8. Generated sessions do not preserve curriculum metadata

`GenerateSessionPanel` creates sessions from templates but does not carry curriculum context into session_blocks.notes or any structured field.

---

## Can the Exercise Library Temporarily Act as Content Library?

**Partially — with limitations:**

| Capability | exercises table |
|---|---|
| Store drill/game/skill names + descriptions | Yes (name, description) |
| Store coaching points | Yes (coaching_points) |
| Filter by track (skill/competition/fitness) | Yes (track enum) |
| Filter by category (technical, tactical, etc.) | Yes (category enum) |
| Link to curriculum level | No (JSON only, not FK) |
| Link to requirements | No |
| Store success criteria | No |
| Store progressions/regressions | No |
| Store constraints | No |
| Store player count / court setup | No |
| Parent/player-safe description | No |

**Decision:** The exercise library can hold Orange Ball content as a stopgap for Sprints 54–56 (using existing fields), but a dedicated `curriculum_content_items` table is needed for the full vision. Sprint 53 creates that table.

---

## Whether New Tables Are Needed

**Yes — two new tables are recommended:**

1. `curriculum_content_items` — Structured curriculum content (drills, games, skills, assessments) with coaching metadata, level targeting, pathway, and parent/player-safe fields.

2. `curriculum_content_requirement_mappings` — Maps a content item to one or more `curriculum_track_requirements` rows, supporting "this drill develops this requirement".

**Optional (deferrable):**
- `curriculum_content_block_type_mappings` — can be inferred from `content_type` → `block_type` mapping table in code rather than DB.
- `curriculum_content_level_mappings` — level_id can be a direct FK on `curriculum_content_items`; multi-level items can have multiple rows.

---

## Recommended Minimal Schema Additions (Sprint 53)

### Table: `curriculum_content_items`

```sql
CREATE TABLE curriculum_content_items (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID        REFERENCES academies(id) ON DELETE CASCADE,  -- NULL = global default
  source_type               TEXT        NOT NULL DEFAULT 'global_default'
                            CHECK (source_type IN ('global_default', 'academy_custom', 'imported', 'copied')),
  content_type              TEXT        NOT NULL
                            CHECK (content_type IN (
                              'drill', 'game', 'skill', 'assessment',
                              'warmup', 'cooldown', 'fitness', 'tactical', 'competition'
                            )),
  pathway                   TEXT        NOT NULL DEFAULT 'skill'
                            CHECK (pathway IN ('skill', 'competition', 'fitness', 'mixed')),
  level_id                  UUID        REFERENCES curriculum_levels(id),
  title                     TEXT        NOT NULL,
  description               TEXT,
  player_count_min          INTEGER,
  player_count_max          INTEGER,
  duration_min              INTEGER,
  duration_max              INTEGER,
  court_setup               TEXT,
  equipment                 TEXT[],
  intensity                 INTEGER     CHECK (intensity BETWEEN 1 AND 10),
  difficulty                INTEGER     CHECK (difficulty BETWEEN 1 AND 5),
  tags                      TEXT[],
  success_criteria          TEXT[],
  progressions              TEXT[],
  regressions               TEXT[],
  coach_cues                TEXT[],
  constraints               TEXT[],
  is_assessment_moment      BOOLEAN     NOT NULL DEFAULT false,
  parent_safe_name          TEXT,
  parent_safe_description   TEXT,
  version                   INTEGER     NOT NULL DEFAULT 1,
  is_active                 BOOLEAN     NOT NULL DEFAULT true,
  created_by                UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table: `curriculum_content_requirement_mappings`

```sql
CREATE TABLE curriculum_content_requirement_mappings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID        NOT NULL REFERENCES curriculum_content_items(id) ON DELETE CASCADE,
  requirement_id  UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  mapping_type    TEXT        NOT NULL DEFAULT 'develops'
                  CHECK (mapping_type IN ('develops', 'assesses', 'reinforces')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, requirement_id)
);
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| New tables not in database.types.ts — TypeScript access requires rawDb cast | Low | Established pattern, used for all migrations 041+ |
| Content seeded without real level IDs (IDs are UUIDs) | Medium | Always resolve level IDs by (stage, level_number) at seed time, never hardcode UUIDs |
| Content-to-requirement mapping becomes stale if requirements change | Low | ON DELETE CASCADE on requirement_id |
| Template block population overwrites existing content | Low | Always check existing exercises before inserting; skip-if-exists logic already implemented |
| Coach workspace not yet built — Sprint 59 curriculum context has no route | Low | Add context to existing session detail page under `/director/sessions/[sessionId]` instead |
| Fitness exercise library vs curriculum content library duplication | Medium | Document clearly: exercises = fitness/physical training; curriculum_content_items = curriculum-aligned drills/games/skills. Different purposes. |

---

## Recommended Sprint 52–60 Implementation Path

| Sprint | Focus | Output |
|---|---|---|
| 52 | Content schema definition doc | `docs/CURRICULUM_CONTENT_SCHEMA_PLAN.md` |
| 53 | Create `curriculum_content_items` + `curriculum_content_requirement_mappings` tables | Migration 045 |
| 54 | Seed Orange 1/2/3 content pack | Migration 046, `docs/ORANGE_BALL_CURRICULUM_CONTENT_PACK.md` |
| 55 | Map Orange Ball content to Orange 1/2/3 requirements | Seed in migration 046 or 047 |
| 56 | Curriculum-aware template block population action | `src/lib/actions/curriculumContentPopulation.ts`, button on template detail |
| 57 | Director template builder curriculum focus selector | UI selector on template detail using existing `templates.level_id` |
| 58 | Generated session preserves curriculum context | Extend `generate-session-actions.ts` to carry notes/cues into session_blocks |
| 59 | Coach session curriculum context panel | Read-only panel on session detail page |
| 60 | QA + demo readiness | `docs/CURRICULUM_CONTENT_ENGINE_QA.md`, `docs/BRIAN_CURRICULUM_DEMO_SCRIPT.md` |

---

## Conclusion

The curriculum spine (levels, stages, domains, progressions) and requirements layer (track requirements, player progress, evidence) are solid. The exercise library partially serves as a content library but lacks critical curriculum-content fields. Two new tables (`curriculum_content_items` and `curriculum_content_requirement_mappings`) are the minimal addition needed to support curriculum-aware content delivery. All new tables will follow the existing pattern: `rawDb = supabase as any` for access until `database.types.ts` is regenerated.
