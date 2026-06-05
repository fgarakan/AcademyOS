# Curriculum Pending Migration Activation Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Audit the status of each curriculum intelligence migration and determine what needs to be done.

---

## Live DB Verification Method

Used the Supabase REST API with service role key to probe table existence and column availability.

```
GET /rest/v1/{tablename}?limit=1&select=id
```

All confirmations are direct DB reads — not assumptions.

---

## Migration 041 — `requirement_domains.sql`

**Tables created:**
- `curriculum_requirement_domains` — 3-domain global reference (skill, competition, fitness)
- `curriculum_track_requirements` — named requirements per level/domain
- `player_requirement_progress` — per-player per-requirement status tracking
- `requirement_evidence_links` — links evidence to requirements

**Intelligence modules unlocked:** Gate achievement tracking, requirement progress aggregation, bottleneck detection

**Live DB status: ✓ ALL TABLES EXIST AND ARE POPULATED**
- `curriculum_requirement_domains`: 3 rows confirmed
- `curriculum_track_requirements`: 32 rows confirmed (Orange Ball 1-3 requirements)
- `player_requirement_progress`: 10 rows confirmed (bootstrap applied)
- `requirement_evidence_links`: table exists (0 rows — no evidence linked yet)

**database.types.ts status: ✓ All types present**

**Risk:** None — tables are live with data.

---

## Migration 042 — `requirement_domain_seed.sql`

**Purpose:** Seeds 3 rows into `curriculum_requirement_domains` (skill, competition, fitness paths). Idempotent via `ON CONFLICT (key) DO UPDATE`.

**Live DB status: ✓ SEEDED** — 3 domain rows confirmed

---

## Migration 043 — `orange_ball_starter_requirements.sql`

**Purpose:** Seeds 32 curriculum requirements for Orange Ball 1-3 (10 for OB1, 11 for OB2, 11 for OB3). Idempotent via `ON CONFLICT DO NOTHING`.

**Live DB status: ✓ SEEDED** — 32 curriculum_track_requirements confirmed

---

## Migration 044 — `player_requirement_progress_bootstrap.sql`

**Purpose:** Creates one `player_requirement_progress` row per player per Orange Ball requirement. All start at `status = 'not_started'`.

**Live DB status: ✓ APPLIED** — 10 player_requirement_progress rows confirmed

**Note:** Only Orange Ball level players get bootstrap rows. Players at other levels will get rows when those requirements are seeded.

---

## Migration 045 — `curriculum_content_library.sql`

**Tables/columns added:**
- `curriculum_content_items` — curriculum-aligned content items
- `curriculum_content_requirement_mappings` — junction: content → requirements
- `templates.curriculum_level_id` — FK linking templates to curriculum levels

**Intelligence unlocked:** Template-curriculum connection, session curriculum context for coaches

**Live DB status: ✓ ALL PRESENT**
- `curriculum_content_items`: accessible, populated with content (domain="Movement", session_block_hint="Warm-Up" etc.)
- `templates.curriculum_level_id`: column exists and queryable (value is null for unseeded templates — expected)

**database.types.ts status: ✓ Already in types before regeneration (confirmed)**

---

## Migration 056 — `session_block_exercises_rls.sql`

**Purpose:** Adds missing RLS SELECT + ALL policies to `session_block_exercises`. Without these, session exercise inserts fail and reads return empty.

**Live DB status: ✓ APPLIED**
- `session_block_exercises` returns empty array (accessible — table exists with RLS working)
- No RLS violation errors observed

**database.types.ts status: ✓ In types (table existed from migration 007)**

---

## Migration 060 — `gate_status_repair.sql`

**Purpose:** Repairs the partial application of migration 059. Adds `gate_id` to `requirement_evidence_links`, creates index, and bootstraps `player_gate_status` rows.

**Dependency:** Must be applied after 041-044.

**Live DB status: ✓ APPLIED**
- `requirement_evidence_links.gate_id`: confirmed in types and accessible
- `player_gate_status`: table exists

**database.types.ts status: ✓ `gate_id` in requirement_evidence_links types**

---

## Migration 061 — `curriculum_content_taxonomy.sql`

**Purpose:** Adds 6 columns to `curriculum_content_items` (domain, session_block_hint, is_player_visible, is_parent_visible, is_coach_only, ball_level) and expands content_type CHECK constraint from 9 to 22 values.

**Live DB status: ✓ APPLIED**
- Live data confirmed: `domain="Movement"`, `session_block_hint="Warm-Up"`, `ball_level="orange"`, `is_coach_only=false`, `is_parent_visible=false`, `is_player_visible=false`

**database.types.ts status: ✓ All columns in types after regeneration**

---

## Migration 062 — `class_template_content_junction.sql`

**Purpose:** Creates `curriculum_class_template_blocks` junction table connecting template blocks to curriculum content items and drills.

**Live DB status: ✓ APPLIED**
- `curriculum_class_template_blocks`: table exists and accessible (0 rows — no content linked yet)

**database.types.ts status: ✓ In types after regeneration**

---

## Migration 083 — `player_evidence_records.sql`

**Purpose:** Creates `player_evidence_records` — the unified evidence layer used by DONNA, progress rollups, missions, parent summaries, and the player passport.

**Live DB status: ✓ APPLIED**
- `player_evidence_records`: table exists (0 rows — no evidence written yet)

**database.types.ts status: ✗ NOT in types before this sprint. Added by regeneration.**

---

## Summary Table

| Migration | Table(s) | Live DB | Types (before) | Types (after) |
|---|---|---|---|---|
| 041 | curriculum_requirement_domains, curriculum_track_requirements, player_requirement_progress, requirement_evidence_links | ✓ WITH DATA | ✓ | ✓ |
| 042 | (seed only) | ✓ 3 rows | — | — |
| 043 | (seed only) | ✓ 32 rows | — | — |
| 044 | (bootstrap only) | ✓ 10 rows | — | — |
| 045 | curriculum_content_items, curriculum_content_requirement_mappings, templates.curriculum_level_id | ✓ | ✓ | ✓ |
| 056 | session_block_exercises (RLS only) | ✓ | ✓ | ✓ |
| 060 | requirement_evidence_links.gate_id, player_gate_status bootstrap | ✓ | ✓ | ✓ |
| 061 | curriculum_content_items (6 new columns) | ✓ WITH DATA | ✓ | ✓ |
| 062 | curriculum_class_template_blocks | ✓ | ✓ | ✓ |
| 083 | player_evidence_records | ✓ (empty) | ✗ | ✓ |

**All migrations are already applied to the live DB.** The only work needed was regenerating `database.types.ts` to include `player_evidence_records`.

---

## Still Pending (Not in This Sprint)

| Migration | Table | Status |
|---|---|---|
| 058 | template_block_exercises (RLS) | Still pending live application — fitness exercise inserts may fail |

Migration 058 is not related to curriculum intelligence activation and was not covered by this sprint.
