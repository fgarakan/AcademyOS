# Curriculum Content Schema Plan V1

**Sprint:** 52
**Date:** 2026-05-01
**Mode:** Planning + design doc. No schema mutation in this sprint.

---

## Purpose

Define the database schema and content model for curriculum-aware drills, games, skills, assessments, and their mappings to curriculum requirements and template blocks.

---

## Content Object: `curriculum_content_items`

Each row represents a single curriculum-aligned content unit — a drill, game, skill, assessment task, warmup activity, or cooldown activity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | gen_random_uuid() |
| `academy_id` | UUID nullable → academies | NULL = global default; NOT NULL = academy-specific |
| `source_type` | TEXT CHECK | global_default / academy_custom / imported / copied |
| `content_type` | TEXT CHECK | drill / game / skill / assessment / warmup / cooldown / fitness / tactical / competition |
| `pathway` | TEXT CHECK | skill / competition / fitness / mixed |
| `level_id` | UUID → curriculum_levels | FK to the level this content is primarily for |
| `title` | TEXT NOT NULL | Short descriptive name |
| `description` | TEXT | Full description of what the content involves |
| `player_count_min` | INTEGER | Minimum players needed |
| `player_count_max` | INTEGER | Maximum players (NULL = unlimited) |
| `duration_min` | INTEGER | Minimum session duration in minutes |
| `duration_max` | INTEGER | Maximum session duration |
| `court_setup` | TEXT | Court configuration description |
| `equipment` | TEXT[] | List of equipment needed |
| `intensity` | INTEGER CHECK (1-10) | Physical intensity rating |
| `difficulty` | INTEGER CHECK (1-5) | Technical difficulty for this level |
| `tags` | TEXT[] | Freeform searchable tags |
| `success_criteria` | TEXT[] | What success looks like (coach observable) |
| `progressions` | TEXT[] | How to make harder if player is ready |
| `regressions` | TEXT[] | How to make easier if player is struggling |
| `coach_cues` | TEXT[] | Key coaching cues to communicate during activity |
| `constraints` | TEXT[] | Game constraints / rules modifications for tactical development |
| `is_assessment_moment` | BOOLEAN DEFAULT false | Can this item generate evidence for requirements? |
| `parent_safe_name` | TEXT | Parent/player-facing name (avoids jargon) |
| `parent_safe_description` | TEXT | Parent/player-facing description |
| `version` | INTEGER DEFAULT 1 | Content versioning |
| `is_active` | BOOLEAN DEFAULT true | Soft delete / visibility control |
| `created_by` | UUID → profiles | Who created this item |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Last update time (trigger-managed) |

### Unique Constraint

Partial unique index for global content:
```sql
UNIQUE (level_id, content_type, title, version) WHERE academy_id IS NULL
```

---

## Mapping Object: `curriculum_content_requirement_mappings`

Maps a content item to one or more `curriculum_track_requirements` rows.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `content_id` | UUID → curriculum_content_items | ON DELETE CASCADE |
| `requirement_id` | UUID → curriculum_track_requirements | ON DELETE CASCADE |
| `mapping_type` | TEXT CHECK | develops / assesses / reinforces |
| `created_at` | TIMESTAMPTZ | |

Constraint: `UNIQUE (content_id, requirement_id)`

### Mapping Types

- `develops` — the activity builds the skill/competency the requirement measures
- `assesses` — the activity is a formal check/observation that directly generates evidence
- `reinforces` — the activity touches the requirement but is not the primary vehicle

---

## Template Amendment: `templates.curriculum_level_id`

Add a nullable FK column to the existing `templates` table:

```sql
ALTER TABLE templates ADD COLUMN IF NOT EXISTS
  curriculum_level_id UUID REFERENCES curriculum_levels(id);
```

This allows a director to tag a template with the curriculum level it is designed for. Sprint 56's population action reads this field to select appropriate content.

---

## Content Type → Block Type Mapping (in code, not DB)

| Block Type (`block_type` enum) | Appropriate Content Types |
|---|---|
| `warm_up` | warmup, fitness, drill |
| `technical` | drill, skill |
| `tactical` | drill, game, tactical |
| `movement` | drill, fitness, warmup |
| `fitness` | fitness, drill |
| `competition` | game, competition, assessment |
| `mental` | game, drill |
| `cool_down` | cooldown, drill |
| `free` | all types |

---

## Pathway → Content Focus

| Template Track (`development_track` enum) | Preferred Pathways |
|---|---|
| `skill` | skill, mixed |
| `competition` | competition, mixed |
| `fitness` | fitness, mixed |
| NULL (all tracks) | skill, competition, fitness |

---

## RLS Strategy

### `curriculum_content_items`

- Global content (academy_id IS NULL): readable by all authenticated users
- Academy content (academy_id IS NOT NULL): readable by academy staff, writable by directors/head coaches
- Follows the same pattern as `curriculum_track_requirements`

### `curriculum_content_requirement_mappings`

- Readable by all authenticated users (mappings are not sensitive)
- Writable by directors/head coaches
- CASCADE delete keeps mappings clean if content is deleted

---

## Indexes

```sql
CREATE INDEX idx_curriculum_content_items_level ON curriculum_content_items(level_id);
CREATE INDEX idx_curriculum_content_items_type ON curriculum_content_items(content_type, pathway);
CREATE INDEX idx_curriculum_content_items_academy ON curriculum_content_items(academy_id) WHERE academy_id IS NOT NULL;
CREATE INDEX idx_curriculum_content_items_active ON curriculum_content_items(is_active) WHERE is_active = true;
CREATE INDEX idx_curriculum_content_req_mappings_content ON curriculum_content_requirement_mappings(content_id);
CREATE INDEX idx_curriculum_content_req_mappings_req ON curriculum_content_requirement_mappings(requirement_id);
```

---

## Implementation Plan (Sprints 53–60)

| Sprint | Action | Migration |
|---|---|---|
| 53 | Create tables + alter templates | 045_curriculum_content_library.sql |
| 54 | Seed Orange Ball content pack | 046_orange_ball_content_pack.sql |
| 55 | Seed content→requirement mappings | (part of 046, separate DO block) |
| 56 | Curriculum-aware population action | No migration |
| 57 | Director level selector UI | No migration (uses curriculum_level_id added in 045) |
| 58 | Session generation preserves curriculum context | No migration |
| 59 | Coach session curriculum context panel | No migration |
| 60 | QA + demo docs | No migration |

---

## Known Limitations (Accepted for V1)

1. **No exercise-level FK**: `template_block_exercises` links to `exercises`, not `curriculum_content_items`. Population action writes to `template_blocks.notes` rather than adding exercise rows. Documented in CURRICULUM_TEMPLATE_POPULATION_LIMITATIONS.md.

2. **Single level per content item**: A content item can only have one `level_id`. Multi-level content (e.g., a drill appropriate for Orange 1 and Orange 2) requires two rows. This is acceptable for V1.

3. **No coach workspace yet**: Sprint 59 adds curriculum context to the director session view. The coach workspace is not built yet (Step 8 in CURRENT_BUILD_TARGET.md).

4. **TypeScript types**: New columns not in `database.types.ts` are accessed via `rawDb = supabase as any`. This is the established pattern for all migrations 041+.
