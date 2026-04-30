# Changelog

---

## 2026-04-30 — Sprint 35: Player Requirement Progress Read-Only UI

**Mode:** Read-only UI only. No mutations. No confirmation workflow. No evidence linking.

**Files changed:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — created
- `src/app/director/players/[playerId]/page.tsx` — query + component integration

**What was built:**
- New `PlayerRequirementProgressReadOnly` component added to the Notes tab of the director player profile.
- Queries `v_player_requirement_progress_detail` filtered by `academy_id` + `player_id`, ordered by `domain_display_order` then `requirement_display_order`.
- Groups requirement rows into three domain sections: Skill Path, Competition Path, Fitness Path.
- Each requirement card shows: title, description, status badge, required/optional badge, evidence count, requirement type, last evidence date (if any), and internal-only visibility indicator.
- Status labels: Not Started, In Progress, Evidence Needed, Met, Waived, Blocked.
- Domain section headers show per-status counts (met / in progress / not started).
- Current level context displayed when rows exist.
- Read-only disclaimer at section top.
- Empty state when no rows exist, differentiated for Orange Ball vs. other levels.
- Empty state when no curriculum assigned.

**Security:**
- Uses authenticated Supabase server client (no service role).
- Resolves `academy_id` from authenticated profile.
- Queries scoped strictly to `academy_id = current academy` and `player_id = current player`.
- RLS on `player_requirement_progress` and `curriculum_track_requirements` enforces academy scoping at DB level.

**Data fetch strategy:**
- Server-side query in `page.tsx` using existing `rawDb` cast pattern (avoids TS2589).
- Local `RequirementProgressRow` interface defined in the component file — used because `v_player_requirement_progress_detail` is not yet in `database.types.ts`.
- `isOrangeBallPlayer` derived from `curriculumSummary?.stage === 'orange_development'`.

**Type handling:**
- `v_player_requirement_progress_detail` is NOT in `database.types.ts`.
- Local TypeScript interface `RequirementProgressRow` used instead.
- `database.types.ts` was NOT manually edited.
- After applying migrations 041–044 to live DB, run `supabase gen types typescript` to regenerate types and remove the local interface.

**What was NOT built (by design):**
- No status update controls, no "mark met" button, no checkboxes.
- No evidence linking controls.
- No parent/player portal views.
- No level-up recommendation or promotion button.
- No AI summary.
- No scoring logic.
- No confirmation workflow.
- No new migrations.
- No new packages.

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Type regeneration note:**
`database.types.ts` does not yet include `v_player_requirement_progress_detail`, `player_requirement_progress`, `requirement_evidence_links`, `curriculum_requirement_domains`, or `curriculum_track_requirements`. These were added in migration 041. After applying migrations 041–044 to the live database, regenerate types with:
```
supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```
Once types are regenerated, the local `RequirementProgressRow` interface in `PlayerRequirementProgressReadOnly.tsx` can be replaced with the generated `Tables<'v_player_requirement_progress_detail'>` type.

---

## 2026-04-30 — Sprint 34: Player Requirement Progress Bootstrap V1

**Mode:** Migration only. No UI. No scoring. No evidence linking. No player data changes.

**Migration file created:** `supabase/migrations/044_player_requirement_progress_bootstrap.sql`

**Purpose:**
Initialises empty `player_requirement_progress` rows for all players whose current curriculum state (`player_curriculum_states.current_level_id`) is assigned to one of the three Orange Ball levels seeded in Sprint 33.

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1)
- Orange 2 — Direction (`orange_development`, level_number=2)
- Orange 3 — Construction (`orange_development`, level_number=3)

**Bootstrap logic:**
One row is inserted per (player, requirement) by joining:
- `player_curriculum_states` → identifies each player's current level
- `curriculum_levels` → filters to `stage = 'orange_development'` and `level_number IN (1, 2, 3)`
- `curriculum_track_requirements` → selects only active global defaults (`academy_id IS NULL`, `source_type = 'global_default'`, `version = 1`, `is_active = true`)

**Rows created per player (based on Sprint 33 seed):**
| Orange Ball Level | Requirements per player |
|---|---|
| Orange 1 — Rally | 10 |
| Orange 2 — Direction | 11 |
| Orange 3 — Construction | 11 |

**Default values for every inserted row:**
- `status = 'not_started'`
- `progress_value = NULL`
- `evidence_count = 0`
- `last_evidence_at = NULL`
- `coach_confirmed_by = NULL`
- `director_confirmed_by = NULL`
- `confirmed_at = NULL`
- `notes = NULL`
- `is_parent_visible = false`
- `is_player_visible = false`

**Idempotency strategy:**
`ON CONFLICT (player_id, requirement_id) DO NOTHING`
Targets the UNIQUE constraint on `player_requirement_progress(player_id, requirement_id)` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Tables intentionally untouched (Sprint 34 scope):**
- `requirement_evidence_links` — no evidence links created
- `player_curriculum_states` — not altered; only read as the population source
- `players` — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**No new tables, views, functions, types, or indexes created.**

**Type regeneration status:** Migration does not add new tables or columns. `database.types.ts` shape is unchanged from Sprint 30. After applying to live DB, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- All column names cross-checked against migration 041 (`player_requirement_progress`) and migration 036 (`player_curriculum_states`, `curriculum_levels`) ✓
- `stage = 'orange_development'` matches the `curriculum_stage` enum defined in migration 036 ✓
- `source_type = 'global_default'` satisfies CHECK constraint in migration 041 ✓
- `status = 'not_started'` satisfies CHECK constraint in migration 041 ✓
- `ON CONFLICT (player_id, requirement_id)` matches UNIQUE constraint in migration 041 ✓
- No player data created, inferred, or modified ✓
- No scoring logic ✓
- No evidence links ✓
- No parent/player visibility enabled ✓

**Manual verification queries (run after migration is applied):**

```sql
-- 1. Confirm Orange Ball levels exist
SELECT display_name, level_number, sort_order
FROM curriculum_levels
WHERE stage = 'orange_development'
ORDER BY sort_order;

-- 2. Confirm Orange Ball requirement definitions
SELECT cl.display_name, COUNT(*) AS requirement_count
FROM curriculum_track_requirements ctr
JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
WHERE cl.stage = 'orange_development'
  AND cl.level_number IN (1,2,3)
  AND ctr.academy_id IS NULL
  AND ctr.source_type = 'global_default'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 3. Confirm player progress rows exist only for Orange curriculum players
SELECT cl.display_name, COUNT(*) AS progress_rows
FROM player_requirement_progress prp
JOIN curriculum_levels cl ON cl.id = prp.curriculum_level_id
WHERE cl.stage = 'orange_development'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 4. Confirm all new rows default correctly
SELECT status, evidence_count, is_parent_visible, is_player_visible, COUNT(*)
FROM player_requirement_progress
GROUP BY status, evidence_count, is_parent_visible, is_player_visible;
-- Expected: status=not_started, evidence_count=0, is_parent_visible=false, is_player_visible=false

-- 5. Confirm no evidence links created
SELECT COUNT(*) FROM requirement_evidence_links;

-- 6. Confirm no player level changes (compare before/after)
SELECT player_id, current_level_id FROM player_curriculum_states;
```

---

## 2026-04-30 — Sprint 33: Orange Ball Starter Requirement Seed Migration

**Mode:** Seed migration only. No UI. No player data changes. No player progress bootstrap.

**Migration file created:** `supabase/migrations/043_orange_ball_starter_requirements.sql`

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1, sort_order=4)
- Orange 2 — Direction (`orange_development`, level_number=2, sort_order=5)
- Orange 3 — Construction (`orange_development`, level_number=3, sort_order=6)

**Rows seeded into `curriculum_track_requirements` (32 total):**

| Level | Skill | Competition | Fitness | Total |
|---|---|---|---|---|
| Orange 1 — Rally | 4 | 3 | 3 | 10 |
| Orange 2 — Direction | 5 | 3 | 3 | 11 |
| Orange 3 — Construction | 4 | 4 | 3 | 11 |
| **Total** | **13** | **10** | **9** | **32** |

**Row field conventions for all 32 rows:**
- `academy_id = NULL` — global default, not academy-specific
- `source_type = 'global_default'`
- `version = 1`
- `is_active = true`
- `evidence_policy = 'coach_confirmed'` — no automatic progression
- `is_parent_visible_default = false`
- `is_player_visible_default = false`

**requirement_type breakdown:**
- `'qualitative'` — 28 rows (all observation-based requirements)
- `'attendance'` — 4 rows: Effort and readiness (O1 Fit), Session-length effort (O2 Fit), Internal match play participation (O3 Comp), Full session stamina (O3 Fit)

**Attendance-type rows with numeric targets:**
| Title | target_value | unit |
|---|---|---|
| Effort and readiness (O1) | 8 | sessions |
| Session-length effort (O2) | 8 | sessions |
| Internal match play participation (O3) | 2 | matches |
| Full session stamina (O3) | 8 | sessions |

**is_required=false rows (8 of 32):**
- Orange 1: Basic directional intent (Skill), Effort and readiness (Fitness)
- Orange 2: Rally under directional constraint (Skill), Serve reliability in game context (Competition), Session-length effort (Fitness)
- Orange 3: Shot transition — defence to offence (Skill), Opponent weakness awareness (Competition), Between-point recovery routine (Fitness)

**Idempotency strategy:**
`ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version) WHERE academy_id IS NULL DO NOTHING`
Targets the partial unique index `idx_curriculum_track_req_global_unique` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Guard clauses:** Migration raises `RAISE EXCEPTION` if any Orange Ball level or domain lookup returns NULL, preventing silent partial seeding.

**Tables intentionally untouched (Sprint 33 scope):**
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- `player` tables — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**Type regeneration status:** Migration not yet applied to live DB. `database.types.ts` not updated — this migration adds no new tables or columns; type shape is unchanged from Sprint 30. After applying, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- `requirement_type` values (`'qualitative'`, `'attendance'`) satisfy CHECK constraint in migration 041 ✓
- `evidence_policy` value (`'coach_confirmed'`) satisfies CHECK constraint in migration 041 ✓
- `source_type` value (`'global_default'`) satisfies CHECK constraint in migration 041 ✓
- ON CONFLICT predicate matches `idx_curriculum_track_req_global_unique` partial index exactly ✓
- `academy_id = NULL` on all rows — no academy-scoped data created ✓
- Single-quote escaping verified for apostrophe characters in pass_condition and description fields ✓
- Row count verified: 10 + 11 + 11 = 32 ✓

**Manual verification steps (after applying migration):**
1. Confirm requirement domains exist:
   `SELECT key, label FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm Orange Ball levels exist:
   `SELECT display_name, level_number, sort_order FROM curriculum_levels WHERE display_name ILIKE '%Orange%' ORDER BY sort_order;`
3. Confirm seeded requirement count:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NULL AND source_type = 'global_default' AND version = 1;`
   — Expected: 32
4. Confirm Orange Ball rows by level/domain:
   ```sql
   SELECT cl.display_name, crd.key, COUNT(*)
   FROM curriculum_track_requirements ctr
   JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
   JOIN curriculum_requirement_domains crd ON crd.id = ctr.requirement_domain_id
   WHERE cl.display_name ILIKE '%Orange%'
   GROUP BY cl.display_name, crd.key
   ORDER BY cl.display_name, crd.key;
   ```
   — Expected: Orange 1 (competition=3, fitness=3, skill=4), Orange 2 (competition=3, fitness=3, skill=5), Orange 3 (competition=4, fitness=3, skill=4)
5. Confirm no player progress rows were created:
   `SELECT COUNT(*) FROM player_requirement_progress;`
   — Expected: 0 (or unchanged from pre-migration count)
6. Confirm no evidence links were created:
   `SELECT COUNT(*) FROM requirement_evidence_links;`
   — Expected: 0 (or unchanged)
7. Confirm no academy-specific rows were created:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NOT NULL;`
   — Expected: 0 (or unchanged)

**Files changed:**
- `supabase/migrations/043_orange_ball_starter_requirements.sql` — created (240 lines)
- `docs/CHANGELOG.md` — this entry

**git add command (do not commit until approved):**
```
git add supabase/migrations/043_orange_ball_starter_requirements.sql docs/CHANGELOG.md
```

---

## 2026-04-30 — Sprint 32: Starter Requirement Seed Pack Planning

**Mode:** Planning and documentation only. No migration. No seed SQL. No UI. No player data changes.

**Planning document created:** `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md`

**Schema inspection confirmed:**
- `curriculum_levels` contains 15 rows across 5 stages
- Orange Ball levels confirmed: `Orange 1 — Rally`, `Orange 2 — Direction`, `Orange 3 — Construction`
- `curriculum_requirement_domains` contains 3 seeded rows: `skill`, `competition`, `fitness`
- `curriculum_track_requirements` schema confirmed with all required columns: `requirement_type`, `measurement_method`, `target_value`, `unit`, `pass_condition`, `evidence_policy`, `is_required`, `display_order`, `is_parent_visible_default`, `is_player_visible_default`, `source_type`, `version`, `is_active`
- `player_requirement_progress` and `requirement_evidence_links` exist with correct shape

**Scope decision:** Option A — Orange Ball 1–3 only (approximately 27–45 requirement rows across 3 levels × 3 domains).

**Starter requirement language drafted for:**
- Orange 1 — Rally: 4 Skill, 3 Competition, 3 Fitness requirements (10 total)
- Orange 2 — Direction: 5 Skill, 3 Competition, 3 Fitness requirements (11 total)
- Orange 3 — Construction: 4 Skill, 4 Competition, 3 Fitness requirements (11 total)

**Key design decisions:**
- All starter rows: `source_type = 'global_default'`, `academy_id = NULL`, `version = 1`, `is_active = true`
- All starter rows: `evidence_policy = 'coach_confirmed'` — no automatic promotion
- All starter rows: `is_parent_visible_default = false`, `is_player_visible_default = false`
- `requirement_type` leans `'qualitative'`; attendance-based requirements use `'attendance'`
- Human approval required before Sprint 33 seeds these rows

**Tables intentionally untouched (Sprint 32 scope):**
- `curriculum_track_requirements` — no rows seeded; language plan only
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All supabase migrations — unchanged

**Recommended next sprints:**
- Sprint 33 — Orange Ball Starter Requirement Seed Migration (pending human approval)
- Sprint 34 — Player Requirement Progress Bootstrap V1
- Sprint 35 — Player Requirement Progress Read-Only UI
- Sprint 36 — Evidence-to-Requirement Link Drafts V1
- Sprint 37 — Requirement Confirmation Workflow V1

**TypeScript check:** Skipped — no source files changed.

**Migration created:** None.

**Files changed:**
- `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md` — created
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 31: Requirement Domain Seed Pack V1

**Mode:** Seed migration only. No UI. No player data changes. No track requirement content.

**Migration file created:** `supabase/migrations/042_requirement_domain_seed.sql`

**Rows seeded into `curriculum_requirement_domains` (3):**

| key | label | display_order | is_active |
|---|---|---|---|
| `skill` | Skill Path | 10 | true |
| `competition` | Competition Path | 20 | true |
| `fitness` | Fitness Path | 30 | true |

**Idempotency strategy:** `ON CONFLICT (key) DO UPDATE SET` — reruns update label, description, display_order, is_active, updated_at. Safe to apply multiple times.

**Tables seeded:** `curriculum_requirement_domains` only.

**Tables intentionally untouched (Sprint 31 scope):**
- `curriculum_track_requirements` — no requirement rows seeded; no level-specific content built
- `player_requirement_progress` — no player rows created
- `requirement_evidence_links` — no evidence rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All app server actions — unchanged

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated (seed-only migration adds no new columns or tables; type shape is unchanged from Sprint 30). Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying both migrations 041 and 042.

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually — `ON CONFLICT (key)` targets the `UNIQUE` constraint defined in migration 041 ✓
- CHECK constraint (`key IN ('skill', 'competition', 'fitness')`) satisfied by all three rows ✓
- `display_order` values (10, 20, 30) are non-overlapping integers ✓
- `is_active = true` for all three rows ✓
- No RLS bypass required — migration runs as database owner ✓

**Manual verification steps (after applying migration):**
1. `SELECT key, label, display_order, is_active FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm exactly 3 rows: `skill / competition / fitness`
3. Confirm labels: `Skill Path / Competition Path / Fitness Path`
4. Confirm display_order: `10 / 20 / 30`
5. Confirm `is_active = true` for all three
6. `SELECT COUNT(*) FROM curriculum_track_requirements;` — should be 0
7. `SELECT COUNT(*) FROM player_requirement_progress;` — should be 0
8. `SELECT COUNT(*) FROM requirement_evidence_links;` — should be 0

**Files changed:**
- `supabase/migrations/042_requirement_domain_seed.sql` — created (44 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 30: Requirement Domain Tables Migration

**Mode:** Schema migration only. No seed data. No UI. No app behavior changes.

**Migration file created:** `supabase/migrations/041_requirement_domains.sql`

**Tables created (4):**

- `curriculum_requirement_domains` — Global reference table. Defines the three pathway domain buckets (skill, competition, fitness). `key` column has CHECK constraint. No `academy_id`. 3 rows will be seeded in Sprint 31.
- `curriculum_track_requirements` — Named requirements per curriculum level and pathway domain. Supports global defaults (`academy_id IS NULL`) and academy-specific overrides/additions (`academy_id IS NOT NULL`). Partial unique indexes used to handle NULL uniqueness correctly.
- `player_requirement_progress` — Per-player per-requirement status tracking. `UNIQUE(player_id, requirement_id)`. Preserves history across level advances.
- `requirement_evidence_links` — Polymorphic evidence-to-requirement links. `evidence_id` is a soft FK (application-enforced). Immutable once created (no `updated_at`).

**View created (1):**

- `v_player_requirement_progress_detail` — Read-only join of all four tables. Exposes `requirement_domain_key`, `requirement_domain_label`, `level_display_name`, `level_number`, `status`, `evidence_count`, and display order fields for the player profile curriculum UI. RLS enforced on underlying tables.

**RLS summary:**

| Table | Read | Write |
|---|---|---|
| `curriculum_requirement_domains` | All authenticated | Directors/heads only (`auth_is_director_or_head()`) |
| `curriculum_track_requirements` | All authenticated (global rows) + own academy rows | Directors/heads for own academy rows only; global rows not writable from app |
| `player_requirement_progress` | Academy staff (`auth_is_staff()`) | Academy staff only |
| `requirement_evidence_links` | Academy staff | Academy staff only |

**Parent/player access deferred to Sprint 32.**

**updated_at triggers:**
- `trg_curriculum_req_domains_updated_at` — uses `update_updated_at_column()` (defined in migration 036)
- `trg_curriculum_track_req_updated_at` — same function
- `trg_player_req_progress_updated_at` — same function
- `requirement_evidence_links` — no trigger; evidence links are immutable once created

**Unique constraint approach for `curriculum_track_requirements`:**
Standard `UNIQUE (academy_id, ...)` cannot enforce uniqueness for global rows because `NULL != NULL` in PostgreSQL. Two partial unique indexes are used instead:
- `idx_curriculum_track_req_global_unique` — unique on `(curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NULL`
- `idx_curriculum_track_req_academy_unique` — unique on `(academy_id, curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NOT NULL`

**No seed data.** Domain rows (skill, competition, fitness) deferred to Sprint 31.

**No UI changes.** `progression_rules` and `v_curriculum_level_requirements` are untouched.

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated. Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying migration.

**TypeScript check:** Clean (`npx tsc --noEmit` — no source files changed; no errors).

**Files changed:**
- `supabase/migrations/041_requirement_domains.sql` — created (320 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 29: Curriculum Requirement Domains Schema Plan

**Mode:** Schema inspection + planning only. No migrations. No implementation.

**Schema inspected:**
- `curriculum_stages`, `curriculum_levels`, `skill_progressions`, `skill_domains` — global, no academy_id, no per-track breakdown
- `progression_rules` — general level-up criteria, no academy override, no source/version tracking
- `v_curriculum_level_requirements` — VIEW (not a table), flat criteria, no track differentiation
- `player_curriculum_states` — academy_id present, single-level state, no per-track state
- `player_domain_progress` — tracks mastery for 8 Skill path domains only, no competition/fitness equivalent
- `player_progression` — flat aggregate scores (technical/tactical/competition/movement), not per-requirement
- `player_priorities` — category enum adjacent to tracks but not curriculum-linked
- `assessments`, `coach_observations`, `session_attendance`, `player_outcomes` — valid future evidence sources, no FK to any curriculum requirement
- `development_track` enum (`skill | competition | fitness | combined`) confirmed to exist but NOT wired into curriculum tables
- App homework / external evidence tables — confirmed absent from all 40 migrations

**Gap confirmed:**
- No per-pathway (Skill / Competition / Fitness) requirement rows
- No named requirement table (only aggregate thresholds in `progression_rules`)
- No player progress tracking per named requirement
- No requirement-to-evidence linkage
- No academy override mechanism for requirements
- No parent/player visibility flags on requirements
- No versioning on requirement definitions

**Plan created:** `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md`

**Proposed new tables:**
- `curriculum_requirement_domains` — 3 pathway domains (skill, competition, fitness)
- `curriculum_track_requirements` — named requirements per level per domain, with academy override support
- `player_requirement_progress` — per-player per-requirement status tracking
- `requirement_evidence_links` — links coach observations, assessments, attendance, outcomes to requirements

**Recommended migration sequence:** Sprint 30 (domain + requirement tables) → Sprint 31 (seed data) → Sprint 32 (progress view + UI) → Sprint 33 (evidence linking) → Sprint 34 (confirmation workflow)

**No migrations created. No implementation. No source files changed.**

**TypeScript check skipped** — no source files changed; check not required per sprint rules.

**Files changed:**
- `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md` — created (planning document)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 28: Player Progression Requirements Read-Only V1

**Schema fields confirmed:**
- `players.current_level_id` → references `academy_levels` (academy-specific levels)
- `player_curriculum_states.current_level_id` → references `curriculum_levels` (global curriculum spine)
- `v_player_curriculum_detail` (already fetched as `domainRows`) has `current_level_id`, `current_level_name`, `stage`, `stage_name`, `advancement_eligible` — no extra query needed for current level display
- `v_curriculum_level_requirements` view: has `level_id`, `sort_order`, `level_number`, `stage_name`, `min_assessment_score`, `min_domains_mastered`, `min_total_outcomes`, `min_weeks_at_level`, `requires_director_approval`, `requires_final_assessment`, `blocking_signal_types` — authenticated read confirmed
- `curriculum_levels`: global, authenticated read, used for next-level derivation by `sort_order`
- `progression_rules`: authenticated read, LEFT JOINed into `v_curriculum_level_requirements` — NULLs expected if rules not yet seeded for a level
- `player_progression` (joined in `getPlayerById`): has `technical_score`, `tactical_score`, `competition_score`, `movement_score` — used as current development score context
- `development_track` enum (`skill | competition | fitness | combined`) does NOT appear on `v_curriculum_level_requirements` — per-track requirements are NOT in schema; grouping by Skill/Competition/Fitness not supported yet

**Schema decision:**
Requirements exist as GENERAL level criteria (not per-track). Skill/Competition/Fitness grouping is schema-absent. Component shows general advancement criteria with a note that per-track breakdown comes in a future curriculum sprint. Track scores from `player_progression` displayed as context.

**Files created:**
- `src/app/director/players/[playerId]/PlayerProgressionRequirements.tsx` — read-only component; shows current curriculum level, next target level (if derivable), general advancement criteria, current development scores; no controls; no mutations

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — added `PlayerProgressionRequirements` import; added 2 sequential rawDb queries (v_curriculum_level_requirements + curriculum_levels); added `progressionScores` from already-fetched player_progression; renders `PlayerProgressionRequirements` in Notes tab above `PlayerActivePriorities`
- `docs/CHANGELOG.md` — this entry

**Data queries added (page.tsx):**
1. `rawDb.from('v_curriculum_level_requirements').select(...).eq('level_id', curriculumSummary.current_level_id).limit(1)` — gets advancement criteria + sort_order
2. `rawDb.from('curriculum_levels').select(...).gt('sort_order', ...).order('sort_order').limit(1)` — derives next curriculum level
- Both queries are conditional on `curriculumSummary?.current_level_id` being non-null
- `progressionScores = (player as any).player_progression?.[0]` — no new DB query (already joined)

**Display behavior:**
- Section appears in Notes tab, above Active Priorities
- If no curriculum state: "No curriculum level has been assigned to this player yet."
- Current level: shows `current_level_name` + `stage_name` from `domainRows[0]`
- Next target: shows next `curriculum_levels` row by sort_order, or "Next target level has not been configured yet."
- Advancement eligibility: lime banner if eligible, muted banner if not
- Advancement criteria: table rows for each non-null requirement, or "not configured yet" message
- Blocking signals: orange pills if any `blocking_signal_types` set
- Track scores: 2×2 or 4-column grid of technical/tactical/competition/movement scores (hidden if all null)
- Disclaimer: "Read-only development guidance. This does not move the player up, change priorities, or publish anything to parents."

**Security checks:**
- Uses authenticated Supabase server client (no service role)
- `academy_id` resolved from server-side profile (existing pattern)
- Player verified in existing code (`getPlayerById` throws → `notFound()`)
- `curriculum_levels` and `v_curriculum_level_requirements` queries use player's `current_level_id`, not cross-academy data
- No player, priority, observation, or proposed_action mutations

**What was not built:**
- No parent portal progression view
- No player portal progression view
- No level-up scoring or automatic promotion recommendation
- No level update button or move-up workflow
- No per-track (Skill/Competition/Fitness) requirement rows — schema does not support yet
- No migrations

**Validation:**
- `npx tsc --noEmit` — passes, zero errors

---

## 2026-04-30 — Sprint 27: Approved Priority Recommendation Application Guardrails

**Schema fields confirmed:**
- `proposed_actions.status` enum includes `approved` and `executed` — both confirmed present
- `proposed_actions.target_object_type` — string, confirmed `player` for priority recommendation drafts
- `proposed_actions.voice_command_id` — NOT NULL, passed through to audit_logs
- `player_priorities` required insert fields: `academy_id`, `player_id`, `title`, `category` (priority_category enum)
- `player_priorities.is_active` — boolean, default true; the player profile page filters by this field only
- `player_priorities` has no provenance fields (`source_proposed_action_id`, `generated_by`) — provenance recorded in `audit_logs.payload`
- `player_priorities` RLS: `"Staff manage priorities" FOR ALL` — covers INSERT for authenticated staff
- `audit_logs` INSERT confirmed working (same pattern as sprint 21 recap action)
- No database-level uniqueness constraint on `player_priorities` title — duplicate check is application-level

**Files created:**
- `src/app/director/review/ApplyPriorityRecommendationControls.tsx` — client component; "Create Active Priority" button; guardrail copy; calls `applyApprovedPriorityRecommendationAction`; success/error states; `router.refresh()` on success

**Files modified:**
- `src/app/director/review/actions.ts` — added `applyApprovedPriorityRecommendationAction`; full security chain (auth → academy_id → membership → proposed_action verify → payload validate → player verify → duplicate check → insert player_priorities → audit_log → mark executed); no service role; no RLS bypass
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — dynamic status label (pending vs approved); different banner color for approved; conditionally renders `ApplyPriorityRecommendationControls` for approved drafts, `PriorityDraftDecisionControls` for pending
- `src/app/director/review/page.tsx` — priority draft query changed from `eq('status', 'pending_review')` to `in('status', ['pending_review', 'approved'])`; pending/approved splits computed; "Approved — Ready to Apply" section added for priority drafts; `PageHeader` updated with `priorityApprovedCount`; total ready-to-apply badge in page header now includes both session recap and priority approved counts

**Files read only:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`, `priorityRecommendationAction.ts`, `page.tsx`
- `supabase/migrations/020_player_priorities.sql`
- `src/lib/supabase/database.types.ts`
- `docs/CHANGELOG.md`, `docs/AI_BACKEND_RULES.md`, `docs/CURRENT_BUILD_TARGET.md`, `docs/LOCKED_MODULES.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/MODULE_BUILD_PROCESS.md`

**Apply behavior:**
- Button appears only on approved priority recommendation drafts
- Clicking "Create Active Priority" calls `applyApprovedPriorityRecommendationAction(proposedActionId)`
- Inserts one `player_priorities` row: `is_active=true`, `status='active'`, title/description/category/priority_level/urgency from `proposed_payload.recommended_priority`, `priority_rank=max_existing+1`
- Writes `audit_logs` row with full provenance (proposed_action_id, player_id, applied_by, source)
- Updates `proposed_actions.status = 'executed'` only after successful insert
- `router.refresh()` causes the applied draft to disappear from the queue (executed status excluded from query)
- Active priority appears on `/director/players/[playerId]` Active Priorities section

**Duplicate handling:**
- Fetches active player priorities before insert
- Normalizes title (lowercase trim) and checks for exact match
- Returns: "An active priority with a similar title already exists for this player. No duplicate was created."
- No insert attempted if duplicate found

**Security checks:**
- `assertNotPreviewMode`
- Auth user required
- `academy_id` resolved from server-side profile — never from client
- Active academy membership verified — `academy_director` or `head_coach` only
- `proposed_action.academy_id` verified against authenticated `academy_id`
- `status === 'approved'` required
- `target_module === 'priority_recommendation'` required
- `target_object_type === 'player'` required
- `draft_type === 'priority_recommendation_v1'` required
- Title non-empty, ≤ 200 chars
- Description ≤ 1000 chars
- Category validated against full `priority_category` enum list
- Player membership in academy verified by separate query

**What was NOT built:**
- No batch apply
- No auto-apply after approval
- No priority editing, completion, or deletion
- No parent/player-facing priority view
- No level-up logic
- No progression score
- No duplicate resolution UI
- No drag-and-drop rank reordering
- No notification or communication drafts
- No migrations
- No package installs
- No AI API

**TypeScript:** clean

---

## 2026-04-30 — Sprint 26: Priority Recommendation Review Queue V1

**Schema fields confirmed:**
- `proposed_actions.target_module` — string, used to filter `priority_recommendation`
- `proposed_actions.status` — `proposed_action_status` enum includes `pending_review`, `approved`, `rejected`, `clarification_needed`
- `proposed_actions.target_object_id` — player UUID for priority recommendation drafts
- `proposed_actions.proposed_by_id` — UUID ref to `profiles.id`
- `players.first_name`, `players.last_name`, `players.full_name` — name fields for player lookup
- `profiles.display_name` — proposer display name

**Files created:**
- `src/app/director/review/PriorityDraftDecisionControls.tsx` — client component; approve/reject/clarification controls; calls `updatePriorityRecommendationDecisionAction`; governance copy: "Approval marks this recommendation as ready for a future priority-creation step. It does not create an active priority yet."
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — card component; shows player name, created date, proposer, recommended priority title, category, priority level, urgency, evidence tags, observation count, overlap warning, draft-only banner, View Player Profile link

**Files modified:**
- `src/app/director/review/actions.ts` — added `updatePriorityRecommendationDecisionAction`; guards `target_module === 'priority_recommendation'`; same security chain as existing session recap action; never touches `player_priorities`
- `src/app/director/review/page.tsx` — added priority recommendation section: queries `proposed_actions` by `target_module = priority_recommendation` + `status = pending_review`; batch-fetches player names and proposer names; renders `PriorityRecommendationDraftCard` per draft; session recap section unchanged; added `Target` icon to `PageHeader` pending count

**Files read only:**
- `src/app/director/review/StructuredDraftCard.tsx`, `DraftDecisionControls.tsx`, `ApplyApprovedDraftControls.tsx`
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`, `priorityRecommendationAction.ts`
- `src/lib/supabase/database.types.ts`

**What was NOT built:**
- No `player_priorities` insert/update
- No apply/activate button for priority recommendations
- No active priority creation
- No parent/player-facing view
- No migrations
- No package installs

**TypeScript:** clean

---

## 2026-04-30 — Sprint 25: Priority Recommendation Drafts from Evidence V1

**Schema fields confirmed:**

**`proposed_actions`:**
- `voice_command_id: string` — NOT NULL in Insert → voice_commands relay row required ✓
- `action_type`: `Enums['action_type']` — `'other'` is valid ✓
- `status`: `Enums['proposed_action_status']` — `'pending_review'` is valid ✓
- `target_module: string` — free text, `'priority_recommendation'` is safe ✓
- `target_object_type: string | null` — free text, `'player'` is safe ✓
- `target_object_id: string | null` — holds player UUID ✓
- `proposed_payload: Json` — stores full recommendation payload ✓
- `action_label: string` — required, set to `"Priority Recommendation Draft"` ✓

**`voice_commands` (relay row):**
- Required FK (proposed_actions.voice_command_id is NOT NULL) → relay row created as in Sprint 18 ✓
- `input_method: 'typed' | 'audio' | 'api'` → `'typed'` used ✓
- `issuer_role`: `user_role` enum — `academy_director` and `head_coach` both valid ✓

**`player_priorities.category`:** `priority_category` enum: `technical_skill | tactical_skill | physical_fitness | competition_exposure | behavioral | load_management | reassessment | promotion_readiness` — matches sprint tag mapping exactly ✓

**`priority_category` enum vs tag mapping:** Confirmed identical. Tag→category map built from sprint spec. Tiebreaker order: technical_skill > behavioral > tactical_skill > physical_fitness > competition_exposure > load_management > reassessment > promotion_readiness.

**Recommendation logic (deterministic, no AI):**
- Tags from all coach_observations (limit 50) are counted across the whole observation set
- Tag → category vote map applied using sprint's keyword mapping
- Highest category by vote count wins; tiebreaker by priority order
- If no tag votes: observation types used as fallback via second map
- Top 2 tags → recommended title via category-specific phrase template
- Active priority overlap: checked by scanning active priority titles for shared top tags
- Overlap warning stored in payload when found
- All logic in-process; no external API; no AI

**`proposed_payload` shape:** `draft_type: 'priority_recommendation_v1'`, `source: 'player_evidence_summary'`, `recommended_priority: { title, description, category, priority_level: 'medium', urgency: 'normal', suggested_status: 'recommended', requires_review: true }`, `evidence: { observation_count, top_tags, top_observation_types, from_recap_count, session_linked_count, most_recent_observation_at }`, `active_priority_overlap_warning`, `warnings: ['Draft only...', 'Requires director approval...']`

**Files created:**
- `src/app/director/players/[playerId]/priorityRecommendationAction.ts` — server action `createPriorityRecommendationDraftAction(playerId)`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy_director/head_coach membership → player ownership (verified against academy_id) → fetch coach_observations (rawDb, limit 50) → guard: no observations → error early → fetch active player_priorities (rawDb) → generate deterministic recommendation → build payload → create voice_commands relay row → insert proposed_actions (target_module='priority_recommendation', target_object_type='player', status='pending_review', action_type='other'). Never writes player_priorities, player profile fields, coach_observations, attendance, or parent views.
- `src/app/director/players/[playerId]/PriorityRecommendationDraftButton.tsx` — `'use client'` component. "Create Priority Recommendation Draft" button with Sparkles icon. `useTransition` for pending state. "Creates a draft recommendation from internal evidence. It does not update active priorities." copy. Green success message / red error message after action completes.
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx` — read-only display of existing priority recommendation drafts for this player. Shows: "Draft Only · Not Applied" badge, status label (Pending Review / Approved / Needs Clarification), recommended title, category badge, evidence tags, overlap warning (AlertTriangle icon), created date. Returns null when no drafts. No approve/apply controls.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — 3 additions: (1) imports for 3 new files; (2) query for existing recommendation drafts (proposed_actions where target_module='priority_recommendation' + target_object_id=playerId + status in [pending_review, approved, clarification_needed], limit 5); (3) bound action `createDraftAction = createPriorityRecommendationDraftAction.bind(null, params.playerId)`; (4) in notesSlot: `<PriorityRecommendationDrafts>` and `<PriorityRecommendationDraftButton>` inserted between Evidence Summary and Internal Coach Observations feed.
- `docs/CHANGELOG.md` — this entry

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Player verified as belonging to academy before any processing
- No observations → early error return (button disabled by error message)
- `rawDb` cast only for JSONB-heavy queries (coach_observations, player_priorities, proposed_actions fetch)
- Typed client for voice_commands and proposed_actions inserts
- No service role; no RLS bypass
- `proposed_actions` insert always includes `.eq('academy_id', academyId)` scoping

**Not built (intentional scope boundary):**
- No direct player_priorities insert/update
- No priority editing, completion, or deletion
- No approve/apply recommendation button
- No parent/player-facing priority view
- No review queue integration (priority recommendation drafts do not appear in /director/review — that queue filters target_module='session_recap_structuring' only)
- No level-up logic
- No progression score
- No profile mutation
- No parent-safe message generation
- No AI API integration
- No migrations
- No package installs

**Validation:** `npx tsc --noEmit` — no errors.

**Manual verification steps:**
1. Ensure a player has coach_observations rows with tags.
2. Open /director/players/[playerId] → Notes tab.
3. Confirm "Priority Recommendation" card is visible with "Create Priority Recommendation Draft" button.
4. Confirm copy reads: "Creates a draft recommendation from internal evidence. It does not update active priorities."
5. Click "Create Priority Recommendation Draft".
6. Confirm green success message: "Priority recommendation draft created for review."
7. Refresh page — confirm "Priority Recommendation Drafts" card appears with the new draft.
8. Confirm draft shows: "Draft Only · Not Applied" badge, "Pending Review" status, recommended title, category badge, evidence tags.
9. In Supabase: confirm proposed_actions row exists with target_module='priority_recommendation', target_object_type='player', target_object_id=player.id, status='pending_review', proposed_payload.draft_type='priority_recommendation_v1'.
10. Confirm player_priorities was NOT modified.
11. Confirm player profile fields were NOT modified.
12. Confirm coach_observations were NOT modified.
13. Confirm parent/player views were NOT modified.
14. Open /director/review — confirm NO priority recommendation draft appears there (review queue filters session_recap_structuring only).
15. If player has no observations, confirm button shows error: "No coach observations found..."

---

## 2026-04-30 — Sprint 24: Player Active Priorities Read-Only V1

**Schema fields confirmed — `player_priorities`:**
- `id`, `academy_id`, `player_id` ✓
- `title` (string) — priority text ✓
- `description` (string | null) — notes ✓
- `category` (`priority_category` enum: technical_skill, tactical_skill, physical_fitness, competition_exposure, behavioral, load_management, reassessment, promotion_readiness) ✓
- `status` (string) — plain string ✓
- `is_active` (boolean) — active filter ✓
- `priority_level` (string) — high / medium / low ✓
- `priority_rank` (number) — display order ✓
- `urgency` (string) ✓
- `generated_at`, `updated_at` (string) — dates ✓

**Query strategy:**
- Scoped by `academy_id` + `player_id`, filtered `is_active = true`, ordered by `priority_rank ASC`
- `rawDb` cast (same pattern as enriched observations) to avoid TS2589

**Files changed:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx` — new read-only component
- `src/app/director/players/[playerId]/page.tsx` — import + query + inserted above evidence summary in Notes tab
- `docs/CHANGELOG.md`

**Implementation:**
- Active Priorities section in the Notes tab above Development Evidence Summary
- Priority cards: title, category badge, priority_level, urgency badge, status badge, description, generated_at / updated_at
- Ordered by `priority_rank`
- Empty state: "No active priorities have been set for this player yet. Future sprints will allow director-approved priorities to be created from evidence."
- Disclaimer: "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet."

**Security:**
- Authenticated server client only — no service role
- `academy_id` resolved from authenticated profile
- Priorities queried only where `academy_id` + `player_id` match — no cross-academy exposure
- Read-only — no add/edit/delete/complete controls

**Not built (intentional scope boundary):**
- No priority creation, editing, completion, or deletion
- No AI-generated priority recommendations
- No automatic priority updates from observations
- No parent/player-facing priority display
- No level-up logic
- No migrations

**Validation:** `npx tsc --noEmit` — no errors.

---

## 2026-04-30 — Sprint 23: Player Profile Evidence Summary V1

**Schema fields confirmed:**

**coach_observations** — all fields already confirmed in Sprint 22; reused for summary:
- `observation_type`: string — grouped and counted to produce top types ✓
- `tags`: string[] | null — flattened and counted across all observations for top themes ✓
- `is_private`: boolean — counted for "Internal" metric ✓
- `ai_entities`: JSONB — `ai_entities.source === 'session_recap_draft'` counted for "From Recap" metric ✓
- `created_at`: string — first item (newest-first sort) used for "Most recent observation" ✓
- `sessions` join present — non-null sessions counted for "Session-linked" metric ✓

**What can be summarized without AI:**
- Observations by type ✓
- Tags by frequency ✓
- Internal count, From Recap count, Session-linked count ✓
- Last observation date ✓
- Recap ratio text note ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationEvidenceSummary.tsx` — new component; deterministic evidence summary
- `src/app/director/players/[playerId]/page.tsx` — import + inserted summary above observations feed
- `docs/CHANGELOG.md`

**Implementation:**
- Zero additional DB queries — reuses `enrichedObservations` already fetched in `page.tsx`
- Metric grid: Total, Internal, From Recap, Session-linked
- Most recent observation date shown
- Top observation types (up to 3) with counts
- Top tags/themes (up to 5) with counts
- Deterministic recap-ratio note ("Most recent evidence comes from structured coach recaps" if ≥50% from recap)
- Disclaimer: "Internal evidence summary. This does not change player level, priorities, or parent-facing communication."
- Empty state: "No evidence summary yet. Applied coach observations will create the first evidence signals."

**Security:**
- Read-only — no mutations
- No additional queries; uses same `academy_id + player_id` scoped data
- No parent/player visibility

**What was NOT built:**
- No parent-facing or player-facing summaries
- No level-up / progression logic
- No automatic priorities
- No AI summarization
- No chart library
- No profile field mutations
- No observation approval workflow
- No migrations

**TypeScript:** `npx tsc --noEmit` — zero errors

**Validation (manual):**
1. Navigate to `/director/players/[playerId]` → Notes tab
2. Confirm Evidence Summary card appears above Internal Coach Observations
3. Confirm total, Internal, From Recap, Session-linked counts are visible
4. Confirm top observation types and top tags appear if observations exist
5. Confirm disclaimer copy is present
6. Confirm empty state shows when no observations exist
7. Confirm no player profile fields, priorities, or parent/player views changed

---

## 2026-04-30 — Sprint 22: Coach Observations Player Profile Feed V1

**Schema fields confirmed:**

**coach_observations**
- `id`, `academy_id`, `player_id`, `coach_id`, `session_id` ✓
- `content`, `observation_type`, `tags`, `is_private` ✓
- `ai_entities: JSONB` — includes `{ source: 'session_recap_draft', ... }` for recap-originated rows ✓
- `voice_command_id`, `created_at`, `updated_at` ✓
- Can query by `academy_id + player_id` ✓; RLS: `academy_id = auth_academy_id() AND auth_is_staff()` ✓

**profiles** — `display_name` available via `coach_observations_coach_id_fkey` join ✓

**sessions** — `name`, `scheduled_date` available via `coach_observations_session_id_fkey` join ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — new component; enriched read-only feed
- `src/app/director/players/[playerId]/page.tsx` — replaced `getCoachObservations` + `CoachObservationTimeline` with enriched inline query + `CoachObservationsFeed`
- `docs/CHANGELOG.md`

**Implementation:**
- Enriched query uses `rawDb = supabase as any` (TS2589 avoidance for multi-join select)
- Query scoped to `academy_id + player_id`; RLS provides belt-and-suspenders academy isolation
- Join: `profiles!coach_observations_coach_id_fkey(display_name)` for coach name
- Join: `sessions!coach_observations_session_id_fkey(name, scheduled_date)` for session context
- Sorted newest-first, limit 20
- "Internal" badge when `is_private = true`
- "From Recap" badge when `ai_entities.source = 'session_recap_draft'`
- Tags displayed as chips
- Coach name + session name/date shown as provenance
- "Internal development evidence. Not parent-facing yet." label on section
- Empty state: "No coach observations have been applied to this player yet. Approved session recap drafts will appear here after they are applied."

**What was NOT built:**
- No parent-facing or player-facing feed
- No level-up / progression logic
- No profile mutation
- No priority update
- No observation editing, deletion, or approval
- No AI summarization
- No batch actions
- No migrations
- No package installs

**TypeScript check:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-04-30 — Sprint 21: Approved Draft Application Plan + Guardrails

**Schema fields confirmed before coding:**

**proposed_actions**
- `status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` — `executed` and `failed` both valid ✓
- `approved_by: string | null`, `approved_at: string | null` — set by Sprint 20 ✓
- `proposed_payload: Json` — never modified by this action ✓
- NO `executed_by`/`executed_at` directly on `proposed_actions` — those live in `action_execution_logs` ✓

**action_execution_logs**
- Has `executed_by`, `executed_at`, `status` (`success|partial|failed`), `execution_result`, `objects_created`, `error_message` ✓
- **No INSERT RLS policy** — cannot write from application code without service role ✗ → writes go to `audit_logs` instead

**coach_observations**
- `academy_id: string` (required) ✓
- `player_id: string` (required, NOT NULL) ✓
- `coach_id: string` (required, NOT NULL) — uses `session.coach_id` ✓
- `session_id: string | null` ✓
- `content: string` (required) ✓
- `is_private: boolean` — default `false`; application sets `true` ✓
- `observation_type: string` — strict CHECK constraint: `general | technical | tactical | movement | competition | behavioral | injury_concern | positive_highlight` — application uses `'general'` ✓
- `tags: string[] | null` — application passes `possible_focus` keywords ✓
- `voice_command_id: UUID | null` — no FK constraint; application passes proposed_action's voice_command_id ✓
- `ai_entities: JSONB | null` — application stores `{ source, proposed_action_id, requires_review: true }` for provenance ✓

**sessions**
- `coach_id: string` (NOT NULL) — always available ✓

**audit_logs**
- INSERT RLS policy: `CHECK (academy_id = auth_academy_id())` — writeable from app code ✓

**Key structural constraint:**
`PlayerObservationDraft` has `player_name` but NOT `player_id`. Player IDs come from `detected_players[].player_id` (matched by name). Only observations where `player_name === detected_player.name` are applied; others are skipped.

---

**Application Plan:**

| Payload section | Disposition | Target table | Risk | Confirmation |
|---|---|---|---|---|
| `detected_players` | Supporting data only (for player_id resolution) | — | Low | Already approved |
| `attendance_mentions` | Defer | None | High | Requires attendance-specific confirmation |
| `session_actual_draft` | Defer | None | Medium | No session_actuals table exists yet |
| `player_observation_drafts` | **Apply now** (confirmed player_id only) | `coach_observations` | Low | Director approval sufficient |
| `director_summary_draft` | Defer | None | Medium | No single official target table |
| `parent_safe_draft_candidates` | Never auto-apply | None | High | Requires parent-safe approval + delivery pipeline |
| `warnings` | Informational only | — | — | — |

---

**Files created:**
- `src/app/director/review/ApplyApprovedDraftControls.tsx` — `'use client'` component. Scope guardrail copy (required per spec): "Apply only creates internal coach observations from approved player observation drafts. It does not update attendance, parent messages, player priorities, player levels, or profiles." Apply button (lime, `PlayCircle` icon). Success message with observation count. Error display with rollback note. `useTransition` for pending state.

**Files modified:**
- `src/app/director/review/actions.ts` — added `ApplyApprovedDraftResult` interface and `applyApprovedStructuredDraftAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → active director/head_coach membership → fetch proposed_action (rawDb) → verify academy_id + status=approved + target_module=session_recap_structuring → verify draft_type=session_recap_structuring_v1 → fetch session (verify academy_id, get coach_id) → build name→player_id map from detected_players → match observation drafts to player_ids (skip unmatched, skip sentinel text) → batch verify player_ids against academy → sequential inserts into coach_observations (is_private=true, observation_type='general', tags=possible_focus, ai_entities with source provenance) → write audit_logs → update proposed_actions.status='executed' only after all inserts succeed. Never touches attendance, parent messages, player priorities, player profiles, or templates.
- `src/app/director/review/StructuredDraftCard.tsx` — imported `ApplyApprovedDraftControls`; dynamic status label in header (`approved — ready to apply` vs `pending review`); conditionally renders `ApplyApprovedDraftControls` when `draft.status === 'approved'`, `DraftDecisionControls` otherwise.
- `src/app/director/review/page.tsx` — expanded query to `.in('status', ['pending_review', 'approved'])`; splits enriched drafts into `pendingDrafts` + `approvedDrafts`; renders "Approved — Ready to Apply" section above pending section; `PageHeader` now shows both pending count (orange) and approved count (lime); empty state only applies to pending section.
- `docs/CHANGELOG.md` — this entry

**Application write sequence (only on full success):**
1. Insert `coach_observations` rows sequentially (one per qualifying observation)
2. Insert into `audit_logs` (action: `session_recap.observations.applied`)
3. Update `proposed_actions.status = 'executed'`
If any observation insert fails: stop, do not write audit_logs, do not mark executed, return error.

**Why action_execution_logs was NOT used:**
Migration 009 creates `action_execution_logs` with only a SELECT policy for directors. There is no INSERT policy. Writes from application code would be blocked by RLS. The `execute_approved_action()` SECURITY DEFINER function writes to it, but we are not calling that RPC (it handles voice action_types, not session_recap_structuring). `audit_logs` has a working INSERT policy and is used instead.

**Observation fields applied:**
- `content` ← `obs.observation`
- `observation_type` ← `'general'` (only safe value within CHECK constraint for recap-originated notes)
- `is_private` ← `true` (staff-only internal observation)
- `tags` ← `obs.possible_focus` (keyword array from structuring)
- `session_id` ← `proposedAction.target_object_id` (the source session)
- `coach_id` ← `session.coach_id` (the coach who ran the session)
- `voice_command_id` ← `proposedAction.voice_command_id` (source voice command)
- `ai_entities` ← `{ source: 'session_recap_draft', proposed_action_id, requires_review: true }`

**What was NOT built:**
- attendance_mentions → session_attendance (high risk, needs separate confirmation flow)
- session_actual_draft → sessions or session_actuals (no session_actuals table exists)
- director_summary_draft → any table (no clear target)
- parent_safe_draft_candidates → parent_messages or parent_updates (requires parent-safe approval + delivery)
- player priority updates from draft
- player level/progression updates
- batch apply
- auto-apply after approval
- edit observations before applying
- AI API integration

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'approved'`.
2. Open `/director/review`.
3. Confirm "Approved — Ready to Apply" section appears above pending section.
4. Confirm header shows both "N pending" (orange) and "N ready to apply" (lime) badges.
5. Confirm approved draft card shows "approved — ready to apply" status label.
6. Confirm guardrail copy is visible: "Apply only creates internal coach observations…"
7. Click "Apply Approved Draft".
8. Confirm green success message with observation count.
9. Confirm approved section disappears from page (status became `executed`).
10. In Supabase: confirm `coach_observations` rows were created with `is_private = true`, `observation_type = 'general'`, correct `session_id`, `coach_id`, `player_id`.
11. Confirm `ai_entities` on each observation contains `source: 'session_recap_draft'` and `proposed_action_id`.
12. Confirm `proposed_actions.status = 'executed'` for the applied draft.
13. Confirm `audit_logs` row exists with `action = 'session_recap.observations.applied'`.
14. Confirm `session_attendance` was NOT modified.
15. Confirm player profiles were NOT modified.
16. Confirm player priorities were NOT modified.
17. Confirm `parent_updates` was NOT modified.
18. Confirm templates were NOT modified.

---

## 2026-04-30 — Sprint 20: Structured Draft Decision Controls V1

**Schema fields confirmed before coding:**
- `proposed_actions.status` — `Enums['proposed_action_status']` — `approved`, `rejected`, `clarification_needed` all valid ✓
- `proposed_actions.approved_by: string | null` — used for `approved` decision (no `reviewed_by_id` field; schema separates approved_by and rejected_by) ✓
- `proposed_actions.approved_at: string | null` — used for `approved` decision ✓
- `proposed_actions.rejected_by: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejected_at: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejection_reason: string | null` — used for `rejected` decision notes ✓
- `proposed_actions.reviewer_notes: string | null` — used for all decisions (note: field is `reviewer_notes`, not `review_notes`; no `reviewed_at` column exists) ✓
- `proposed_actions.proposed_payload` — never modified by this action ✓
- No `reviewed_by_id` or `reviewed_at` columns exist; `approved_by`/`rejected_by` are the reviewer tracking fields ✓
- No migrations needed ✓

**Files created:**
- `src/app/director/review/actions.ts` — server action `updateStructuredDraftDecisionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy membership (academy_director or head_coach only) → fetch proposed_action by ID → verify academy_id match → verify target_module = session_recap_structuring → verify status = pending_review → validate decision value → validate reviewer_notes max 1000 chars → update proposed_actions (status + reviewer tracking fields only). Never modifies proposed_payload, player profiles, attendance, parent messages, coach_observations, player priorities, or any table other than proposed_actions.
- `src/app/director/review/DraftDecisionControls.tsx` — `'use client'` component. Three decision buttons: Approve for Application (green), Needs Clarification (orange), Reject Draft (red). Optional decision note textarea (max 1000 chars, char counter appears at 800+). Governance banner: "Approving does not apply changes yet. It only marks this draft as ready for a future application step." On success: green confirmation banner + `router.refresh()` to remove card from pending queue. Error display if action fails. `useTransition` for pending state; buttons disabled while pending.

**Files modified:**
- `src/app/director/review/StructuredDraftCard.tsx` — imported `DraftDecisionControls`; added `<DraftDecisionControls proposedActionId={draft.id} />` at the bottom of CardContent, after the parent-safe candidate count.
- `docs/CHANGELOG.md` — this entry

**Decision → DB write strategy:**
| Decision | Columns written |
|---|---|
| `approved` | `status='approved'`, `approved_by=user.id`, `approved_at=now()`, `reviewer_notes` (if provided) |
| `rejected` | `status='rejected'`, `rejected_by=user.id`, `rejected_at=now()`, `rejection_reason` (if provided), `reviewer_notes` (if provided) |
| `clarification_needed` | `status='clarification_needed'`, `reviewer_notes` (if provided) |

No other columns touched. `proposed_payload` never modified. Only `proposed_actions` written.

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Proposed action verified to exist and belong to same academy
- `target_module` verified = `session_recap_structuring`
- `status` verified = `pending_review` before allowing decision (idempotency guard)
- `decision` value validated against allowed enum
- `reviewer_notes` validated max 1000 chars
- No service role; no RLS bypass
- Double `.eq('academy_id', academyId)` on the update call

**After decision:**
- Card disappears from `/director/review` on next render (query filters `status = pending_review`)
- `router.refresh()` triggers server re-render immediately
- Empty state appears if no pending drafts remain

**What was NOT built:**
- Apply approved drafts to player profiles
- Apply approved drafts to attendance
- Create parent messages
- Create coach_observations from draft
- Update player priorities from draft
- Director intelligence feed writes
- Batch approve / batch reject
- Edit draft content
- Clarification workflow messaging
- Rejected draft history page
- Parent-safe message creation or sending
- Notifications
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure at least one `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'pending_review'`.
2. Open `/director/review`.
3. Confirm each draft card shows decision controls: Approve for Application, Needs Clarification, Reject Draft.
4. Confirm governance banner is visible: "Approving does not apply changes yet…"
5. Add a decision note in the textarea.
6. Click "Needs Clarification" on one draft.
7. Confirm green "Decision recorded. Refreshing queue…" appears.
8. Confirm the card disappears from the queue after refresh.
9. In Supabase: confirm `proposed_actions.status = 'clarification_needed'` and `reviewer_notes` saved.
10. Click "Approve for Application" on another draft.
11. Confirm card disappears. In Supabase: confirm `status = 'approved'`, `approved_by = user.id`, `approved_at` set.
12. Confirm `proposed_payload` was NOT modified.
13. Confirm no player profile, attendance, coach_observation, parent message, or player priority rows changed.
14. Confirm no template rows changed.
15. If all cards reviewed, confirm empty state appears.

---

## 2026-04-30 — Sprint 19: Structured Draft Review Queue V1

**Schema fields confirmed before coding:**
- `proposed_actions.id` — `string` ✓
- `proposed_actions.academy_id` — `string` ✓
- `proposed_actions.status` — `Enums['proposed_action_status']` — `'pending_review'` is a valid value ✓
- `proposed_actions.target_module` — `string` — filterable to `'session_recap_structuring'` ✓
- `proposed_actions.target_object_id` — `string | null` — holds session UUID ✓
- `proposed_actions.target_object_type` — `string | null` — `'session'` (informational only) ✓
- `proposed_actions.proposed_payload` — `Json` — holds `StructuredDraftPayload`; `draft_type` checked after fetch ✓
- `proposed_actions.created_at` — `string` ✓
- `proposed_actions.proposed_by_id` — `string` — FK to profiles ✓
- `proposed_actions.voice_command_id` — `string` (NOT NULL FK — Sprint 18 creates voice_commands row) ✓
- `sessions.id`, `sessions.name`, `sessions.scheduled_date` — confirmed ✓
- `profiles.id`, `profiles.display_name` — confirmed (no `full_name` on profiles) ✓
- `academy_memberships.profile_id`, `academy_memberships.role` (`user_role` enum), `academy_memberships.is_active` — confirmed ✓
- `user_role` enum: `academy_director | head_coach | coach | player | parent` ✓
- `proposed_action_status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` ✓
- No migrations needed — all required tables and columns exist ✓

**Files created:**
- `src/app/director/review/page.tsx` — Server Component. Security chain: auth → academy_id from profile → active membership check (academy_director or head_coach) → query proposed_actions by academy_id + status=pending_review + target_module=session_recap_structuring → post-fetch filter to draft_type=session_recap_structuring_v1 → batch-fetch session names/dates → batch-fetch proposer display_names → render StructuredDraftCard list. Empty state if no pending drafts. Never mutates any table.
- `src/app/director/review/StructuredDraftCard.tsx` — Server Component card. Exports `EnrichedDraftItem` interface and `StructuredDraftCard` component. Displays: draft label, session name/date, proposer name, created timestamp, safety banner, 4-count summary grid (detected players / attendance mentions / observation drafts / parent-safe drafts), director summary preview (3-line clamp), detected player chips, attendance mention rows with status colors, player observation previews (2-line clamp), parent-safe candidate count with note, link to source session detail.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — added `ClipboardList` import and `Review Queue` → `/director/review` nav item between Sessions and Competition in primary nav.
- `docs/CHANGELOG.md` — this entry

**Review queue behavior:**
1. Director opens `/director/review`
2. Auth and academy_director/head_coach membership verified server-side
3. All proposed_actions with status=pending_review and target_module=session_recap_structuring for this academy are fetched
4. Each card shows: session context (name, date), proposer name, created timestamp, draft count summary, director summary preview, detected players, attendance mentions, observation drafts preview, parent-safe draft count
5. "View Session" link on each card navigates to `/director/sessions/[sessionId]` for full session detail
6. Empty state message if no pending drafts exist yet
7. Sidebar nav shows "Review Queue" link with ClipboardList icon between Sessions and Competition

**Database read strategy:**
- Sequential queries per AI_BACKEND_RULES.md rule 5
- `rawDb = supabase as any` for proposed_actions query (avoids TS2589 — same pattern as session detail page)
- proposed_actions scoped to academy_id + status + target_module in DB query
- draft_type filter applied in memory after fetch (JSON field — not DB-filterable)
- Session info batch-fetched by target_object_id IN clause
- Proposer names batch-fetched by proposed_by_id IN clause
- All session/profile reads verified against academy_id (sessions: .eq('academy_id', academyId))

**Security checks:**
- Auth required (no user → early return)
- academy_id resolved from authenticated profile — never trusted from client
- academy_director or head_coach active membership verified before any data is shown
- proposed_actions query always includes .eq('academy_id', academyId) — no cross-academy reads
- sessions batch-fetch also filtered by .eq('academy_id', academyId)
- No service role; no RLS bypass

**What was not built:**
- Approve/apply draft button
- Reject/dismiss draft
- Edit draft
- Player profile updates from draft
- Attendance mutation from draft
- Parent-safe message creation or sending
- Coach observation creation
- Player priority updates
- Director intelligence feed writes
- Batch actions on multiple drafts
- Draft notifications or badges in real-time
- Analytics on draft processing rates
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure Sprint 18 has created at least one proposed_actions row with status=pending_review.
2. Open `/director/review`.
3. Confirm pending structured drafts appear as cards.
4. Confirm each card shows session name, session date, proposer name, 4-count grid, director summary preview, and safety banner.
5. Click "View Session" link — confirm navigates to `/director/sessions/[sessionId]`.
6. Confirm `/director/sessions/[sessionId]` still shows its own structured draft view (unchanged).
7. Confirm no player profiles changed.
8. Confirm no attendance changed.
9. Confirm no parent messages were created.
10. Confirm no proposed_actions status changed (still pending_review).
11. Confirm "Review Queue" link appears in sidebar nav between Sessions and Competition.
12. Confirm empty state message appears if no pending drafts exist.

---

## 2026-04-30 — Sprint 17: Coach Session Recap MVP

**Schema fields confirmed before coding:**
- `voice_notes` table (migration 010) — confirmed suitable for session-level recap:
  - `session_id UUID REFERENCES sessions(id)` — nullable, links recap to session ✓
  - `author_id UUID REFERENCES profiles(id)` — coach who wrote it ✓
  - `academy_id UUID NOT NULL` — multi-tenant boundary ✓
  - `raw_input TEXT NOT NULL` — stores typed recap text ✓
  - `transcript TEXT` — same as raw_input for V1 typed input ✓
  - `player_id UUID` — nullable; NULL = session-level (not player-specific) ✓
  - `processing_status TEXT DEFAULT 'pending'` — `'pending'` = raw, awaiting AI structuring ✓
  - `audio_path TEXT` — NULL for V1; field exists for V2 voice integration ✓
  - `parsed_observation_id UUID` — NULL until AI structures the recap (next sprint) ✓
  - RLS: `auth_is_staff()` covers coaches, head_coaches, directors ✓
- `coach_observations` — NOT used: `player_id NOT NULL` makes it unsuitable for session-level recaps (requires a specific player); used for per-player observations post-AI-parsing
- `sessions.session_notes` — NOT used: already used for execution notes during the session; different semantic
- No migration needed — `voice_notes` already exists and supports session_id + player_id=NULL pattern

**Files created:**
- `src/app/coach/sessions/[sessionId]/SessionRecapPanel.tsx` — `'use client'` component. Shows lightweight session context (session name, exercises completed count, attendance summary). Textarea with placeholder example. Character count (0/5,000). Voice-ready copy: "Voice capture will be added later. For now, type the recap the same way you would say it after class." Save Recap button (disabled when empty, useTransition for pending state). Success message on save: "Recap saved. Next sprint will structure this into attendance context, session actuals, player observations, and director updates for review." Error display with AlertCircle icon.
- `src/app/director/sessions/[sessionId]/SessionRecapSummary.tsx` — Server-renderable display component. Accepts `RecapEntry[]`. Empty state: "No coach recap recorded yet." Warning banner: "Raw coach recap — not yet AI-structured or parent-safe." Renders each recap with timestamp and whitespace-preserved text. Most recent first (sorted by caller).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/actions.ts` — Added `SaveSessionRecapInput`, `SaveSessionRecapResult` interfaces and `saveSessionRecapAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership verified (academy_id match) → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → validate recap text (non-empty, max 5,000 chars) → insert voice_notes row (player_id=null, processing_status='pending', transcript=raw_input). Never updates templates, player profiles, player priorities, parent messages, or proposed_actions.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added step 6: fetch most recent session-level voice_note (player_id IS NULL, ordered by created_at DESC, limit 1, maybeSingle) to pre-populate recap textarea. Compute context: totalExercises, completedCount (from DB state), attendanceSummary ("N/M present" or null). Render `<SessionRecapPanel>` after the execution blocks section (always visible regardless of whether session has blocks).
- `src/app/director/sessions/[sessionId]/page.tsx` — Added step 9: fetch voice_notes for this session (player_id IS NULL, ordered by created_at DESC, limit 5). Added "COACH RECAP" section at the bottom of the page (after ROSTER & ATTENDANCE) with `<SessionRecapSummary>`. Read-only for director.
- `docs/CHANGELOG.md` — this entry

**Coach recap behavior:**
1. Open `/coach/sessions/[sessionId]`
2. Scroll to SESSION RECAP section (below execution blocks and attendance)
3. Session context shows: session name, exercises completed, attendance summary
4. Textarea pre-populated with most recent saved recap (empty on first visit)
5. Type recap text → Save Recap → success message with AI-structuring future hint
6. Refresh → textarea pre-populated with most recently saved recap

**Director recap visibility:**
1. Open `/director/sessions/[sessionId]`
2. Scroll to COACH RECAP section (below ROSTER & ATTENDANCE)
3. If coach has saved recaps: orange warning banner + recap text with timestamps (most recent first)
4. If no recap yet: "No coach recap recorded yet." empty state

**Database write strategy:**
- Each "Save Recap" inserts a NEW row in `voice_notes` (natural history of recap iterations)
- On page load: most recent recap pre-populates the textarea (fetch by session_id + player_id IS NULL + ORDER BY created_at DESC LIMIT 1)
- Director shows up to 5 most recent recaps
- Only table written: `voice_notes`
- Columns set: `academy_id`, `author_id`, `session_id`, `raw_input`, `transcript` (same as raw_input), `processing_status: 'pending'`
- `player_id` omitted (null) — session-level, not player-specific
- `audio_path` omitted (null) — V1 typed only
- `parsed_observation_id` omitted (null) — set later by AI structuring sprint

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session verified against academy_id before write
- Coach access: session.coach_id === user.id OR active membership in [coach, head_coach, academy_director]
- Recap text validated server-side: non-empty, max 5,000 characters
- No RLS bypass; no service role

**What was not built:**
- AI extraction or structuring of recap text
- Player-specific parsed observations from recap
- Parent-safe summaries
- Director intelligence feed updates
- Player profile or player priority updates
- Automatic group recommendations
- Coach incentive/score dashboard
- Voice transcription integration (ElevenLabs, Whisper, browser recording)
- File/audio upload
- Author name display on director recap view (deferred — would require profiles join)

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/coach/sessions/[sessionId]`.
3. Scroll to SESSION RECAP section at the bottom.
4. Confirm voice-ready copy is visible.
5. Type: "Sarah was absent. Maria was present. We skipped the speed block and spent extra time on forehand grip and preparation. Maria improved when cued to set the racket earlier."
6. Click Save Recap — confirm green success message with next-sprint note.
7. Refresh page — confirm recap text persists in textarea.
8. Open `/director/sessions/[sessionId]`.
9. Scroll to COACH RECAP section — confirm raw recap appears with orange warning banner and timestamp.
10. Confirm no player profile, parent message, template, player priority, or proposed_action rows were created.

---

## 2026-04-30 — Sprint 16: Session Group Assignment V1

**Schema fields confirmed before coding:**
- `sessions.group_id` — `string | null`, present in Row/Insert/Update ✓ — supports update
- `sessions.academy_id` — `string` ✓
- `groups.id`, `groups.name`, `groups.academy_id`, `groups.is_active: boolean` ✓ — filterable by academy_id and is_active
- `group_memberships.group_id`, `group_memberships.player_id`, `group_memberships.is_current`, `group_memberships.academy_id` ✓ — membership counts readable
- `academy_memberships.role` — enum `academy_director | head_coach | coach | player | parent` ✓
- No migrations needed — all required fields existed from Sprint 15

**Files created:**
- `src/app/director/sessions/[sessionId]/actions.ts` — `assignGroupToSessionAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → academy_director/head_coach membership required → session ownership verified → group verified (same academy, is_active=true) → update sessions.group_id only. Never touches templates, group_memberships, players, attendance, or player profiles.
- `src/app/director/sessions/[sessionId]/GroupAssignmentPanel.tsx` — `'use client'` component. Shows current group if assigned, dropdown of active groups with member counts, Save Group Assignment button. Disabled until a different group is selected. Success/error inline feedback. Empty state if no active groups.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `GroupAssignmentPanel` import; added sequential queries for active groups (by academy_id + is_active) and their member counts (batch, single query); inserted GROUP ASSIGNMENT section (SectionHeader + Card + GroupAssignmentPanel) between session meta and blocks; updated empty-state copy for no-group roster to reference the assignment panel above.
- `src/app/director/sessions/page.tsx` — added `group_id` to session select; added batch group name fetch (step 5); updated session card to show group name or "No group" label.
- `docs/CHANGELOG.md` — this entry

**Director group assignment behavior:**
1. Open `/director/sessions/[sessionId]`
2. GROUP ASSIGNMENT section appears with dropdown of active groups (each shows member count)
3. If already assigned, current group name shown above dropdown
4. Select a group → Save Group Assignment button activates
5. On save: success message "Group assigned. Refresh to see the updated roster."
6. After refresh: ROSTER & ATTENDANCE section populates from group_memberships

**Database write strategy:**
- Single `UPDATE sessions SET group_id = ? WHERE id = ? AND academy_id = ?`
- Only column updated: `sessions.group_id`
- No other tables written

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Caller must be `academy_director` or `head_coach` in this academy (active membership)
- Session verified against academy_id before write
- Group verified against same academy_id and is_active=true before write
- No RLS bypass; no service role

**What was not built:**
- Group builder / group creation UI
- Group scheduling
- Manual player-to-session assignment (no group)
- Attendance analytics
- Player profile updates from attendance
- Voice group assignment
- Automatic group recommendations
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — GROUP ASSIGNMENT section appears.
3. Confirm current group state shown (or blank if unassigned).
4. Select an active group from dropdown.
5. Click Save Group Assignment — success message appears.
6. Refresh page — group assignment persisted; ROSTER & ATTENDANCE shows players if group has current members.
7. Open `/coach/sessions/[sessionId]` — Attendance card shows group roster.
8. Mark attendance and save — confirm no templates, player profiles, or group membership rows changed.
9. Check `/director/sessions` list — group name (or "No group") shown on each session card.

---

## 2026-04-30 — Sprint 15: Session Attendance + Player Roster V1

**Schema findings confirmed before coding:**
- `session_attendance` ✓ — `id, session_id, player_id, status TEXT CHECK ('present','absent','late','excused'), notes, marked_by, marked_at`, `UNIQUE(session_id, player_id)`, RLS via sessions.academy_id join
- `sessions.group_id` ✓ — nullable; currently null for template-generated sessions
- `group_memberships` ✓ — `player_id, group_id, is_current (bool), academy_id`
- `groups` ✓ — `id, name, academy_id, is_active`
- `players` ✓ — `id, full_name, first_name, last_name, academy_id`
- No TS enum for attendance status — string union `'present' | 'absent' | 'late' | 'excused'` used
- No migrations needed

**Roster source logic:**
- `session.group_id` set → roster from `group_memberships WHERE group_id=X AND is_current=true AND academy_id=X` → joined with `players`
- `session.group_id` null → empty roster with explanation (template-generated sessions do not assign a group yet)

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `group_id` to session select; sequential roster fetch (groups → group_memberships → players → session_attendance); read-only Roster & Attendance section: group name, present/absent/late/excused/unrecorded counts, per-player AttendancePill; empty states for no group_id or no members
- `src/app/coach/sessions/[sessionId]/page.tsx` — added `group_id` to session select; exported `RosterPlayer` interface; sequential roster fetch (group_memberships → players → session_attendance); roster + existing attendance passed to CoachSessionExecutionClient; imported saveAttendanceAction
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — added `roster: RosterPlayer[]` and `saveAttendanceAction` props; attendance state (`attendanceMap` keyed by player_id, initialized from currentStatus); `isAttendancePending` / `attendanceResult` states; `markAttendance()` handler; `handleSaveAttendance()` handler (filters unset players, calls saveAttendanceAction); Attendance card rendered above execution blocks with per-player P/A/L/E buttons, result feedback; `attendanceActiveClass()` helper
- `src/app/coach/sessions/[sessionId]/actions.ts` — added `AttendanceUpdate`, `SaveAttendanceInput`, `SaveAttendanceResult` interfaces; added `saveAttendanceAction` function
- `docs/CHANGELOG.md` — this entry

**Security chain (saveAttendanceAction):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- `session.group_id` fetched from DB (never from client input)
- Valid player IDs fetched from `group_memberships` (is_current=true, matching group_id + academy_id)
- All submitted player IDs verified against valid set before any write
- Statuses server-validated against `('present','absent','late','excused')` (DB CHECK also enforces)
- Sequential upserts (per AI_BACKEND_RULES #5) — `UNIQUE(session_id, player_id)` ensures safe insert/update
- Only `session_attendance` updated — templates, player profiles, development priorities never touched

**What was not built (deferred):**
- Player-to-session manual assignment without a group (requires group_id or dedicated session_players table)
- Group builder / group scheduling
- Player profile development updates from attendance
- Voice recap, AI note structuring
- Parent messages
- Attendance analytics dashboard
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — Roster & Attendance section appears at bottom. If session has no group, shows "No group assigned" empty state.
3. If session has group_id: group name, present/absent/late/excused counts, and per-player pills render.
4. Open `/coach/sessions/[sessionId]` — Attendance card appears above exercise blocks with P/A/L/E buttons per player (or empty state if no group).
5. Mark one player Present, one Absent, one Late — click Save Attendance. Confirm green success banner.
6. Refresh page — attendance persists. Director view reflects changes.
7. Confirm no template table rows changed (check templates, template_blocks, template_block_exercises).
8. Confirm no player development profile updates were made.

---

## 2026-04-30 — Sprint 14: Director Session Viewer + Coach Session Execution V1

**Schema findings confirmed before coding:**
- `sessions`: status enum `planned | in_progress | completed | cancelled` ✓, `session_notes` ✓
- `session_blocks`: no completion/status field — block-level partial/skipped deferred, UI copy added
- `session_block_exercises`: `completed` (boolean) ✓, `notes` ✓

**Files created:**
- `src/app/director/sessions/page.tsx` — Director sessions list. Fetches sessions for academy (newest first). Sequential batch queries: profiles for coach display names, templates for template names, session_blocks for block counts. Cards link to detail page. Empty state if no sessions.
- `src/app/director/sessions/[sessionId]/page.tsx` — Read-only director session detail. Shows: session name/date/time/duration, coach, status, source template, session notes, progress (completed exercises / total), ordered session blocks with ordered exercises, completion dots, exercise notes. rawDb cast for nested select (session_block_exercises → exercises). Cross-academy guard: session verified against academy_id. Planned-snapshot notice banner.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Coach session execution server page. Fetches session (academy_id verified), template name, ordered blocks, ordered exercises with names (rawDb cast). Passes data to CoachSessionExecutionClient.
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Client component. Exercise checkboxes (completed toggle), per-exercise notes textareas, session status selector (4 statuses), session notes textarea, Save Execution button with useTransition. Progress counter (N / total). Inline block-level deferral notice. Success/error result display.
- `src/app/coach/sessions/[sessionId]/actions.ts` — Server action `saveSessionExecutionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership via academy_id → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → session status+notes update → session_blocks fetch to build valid block ID set → session_block_exercises fetch to build valid exercise ID set → reject any submitted exercise ID not in set → sequential per-exercise updates (completed, notes). Never touches template tables.

**Files modified:**
- `src/app/coach/sessions/page.tsx` — Added `Link` import and `formatDate`; sessions in Today section now link to `/coach/sessions/[id]`; added Upcoming section (sessions after today, ordered ascending, limit 10); extracted `SessionRow` component.
- `docs/CHANGELOG.md` — this entry

**Security chain (coach actions):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- Exercise IDs validated against this session's blocks before any update
- Sequential updates — no Promise.all
- Only session-layer tables updated: `sessions`, `session_block_exercises`
- `template_blocks`, `template_block_exercises`, `templates` never touched

**What was not built (deferred):**
- Block-level partial/skipped status (not in schema — UI copy added)
- Attendance, player roster, group scheduling
- Voice recap, AI note structuring
- Parent messages
- Exercise swapping / session override reordering
- Session generation from curriculum spine
- Director write on session detail

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Generate a session from a fitness template if none exist.
2. Open `/director/sessions` — session appears in list with date, coach, template name, block count.
3. Click session → `/director/sessions/[sessionId]` — blocks and exercises display in order; completion dots shown; planned-snapshot notice visible.
4. Open `/coach/sessions` — today's session appears with → link; upcoming section shows future sessions.
5. Click session → `/coach/sessions/[sessionId]` — blocks and exercises with checkboxes; session status buttons; notes textareas; Save Execution button.
6. Check one exercise, add a note, change status to in_progress, click Save Execution.
7. Refresh page — confirm changes persisted.
8. Open `/director/sessions/[sessionId]` — confirm execution changes reflected (dot filled, note shown).
9. Open the source fitness template → confirm template blocks unchanged.

---

Records completed build milestones in chronological order.
Update this file at the end of every completed module.

---

## 2026-04-30 — Sprint 13: Generate Session from Template

Added "Generate Session" to the fitness template detail page. Directors can now turn an official fitness template into a planned session snapshot. The master template is never mutated.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Server action `generateSessionFromTemplateAction`. Security chain: assertNotPreviewMode → auth → academy_id → template ownership → coach membership validation → template blocks fetch → reject if no blocks → template exercises fetch → insert session row (status=planned, template_id preserved) → insert session_blocks sequentially (template_block_id preserved for source tracking, is_override=false) → collect inserted block IDs → insert session_block_exercises sequentially. Returns `{ sessionId, error }`. Never touches templates/template_blocks/template_block_exercises.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Client component. States: closed → form → generating → success/error. Form fields: session name (defaults from template name), session date (required), coach select (academy head_coach/coach profiles; falls back to director with label if none), optional notes. Success state shows generated session ID and explains that `/director/sessions` detail view is a future sprint. Error state shows inline message with AlertCircle icon.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Fetches active coaches (two sequential queries: `academy_memberships` filtered by role in [coach, head_coach] → `profiles` for display_name); adds `display_name` to initial profile select; renders `<GenerateSessionPanel>` between `<PageHeader>` and `<TemplateMeta>`.
- `docs/CHANGELOG.md` — this entry

**Snapshot strategy:**
- `sessions.template_id` → source template reference preserved
- `session_blocks.template_block_id` → source template block reference preserved
- Block order, exercise order, durations, names all copied at generation time
- Future template edits do not affect already-generated sessions (snapshot is independent)

**Security constraints:**
- `assertNotPreviewMode()` guard on server action
- Auth required; academy_id resolved from authenticated profile
- Template ownership verified via `academy_id` match before any read
- Coach validated as active academy member (director's own profile passes this check)
- Blocks must exist before generation is allowed
- Sequential inserts — no Promise.all (per AI_BACKEND_RULES #5)
- No service role; no RLS bypass; no template table mutations

**Not built (deferred):**
- `/director/sessions` route and session detail view
- Coach execution / live session runner
- Attendance, player roster, group scheduling
- Session overrides / coach-layer changes
- Voice recap, AI note structuring, parent messages
- Session completion recording

**TypeScript:** clean (`npx tsc --noEmit` — no output)

---

## 2026-04-30 — Sprint 12: Fitness Template Builder Save Verification + Edit Hardening

Hardened the Sprint 11 Fitness Template Builder. No new product features — reliability and security fixes only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Six hardening additions:
  (1) Reject empty/missing IDs before any DB query.
  (2) Reject duplicate block IDs in submitted payload.
  (3) Reject duplicate exercise IDs in submitted payload.
  (4) Reject negative duration values at server level (client also validates, now double-checked).
  (5) Fix exercise block_id verification — now fetches `id, block_id` from DB and verifies each submitted exercise's `block_id` matches the actual DB record. Previous check only verified the exercise existed in *any* submitted block; a wrong submitted `block_id` would pass verification but cause the DB update to silently match no rows (silent data loss).
  (6) Add server-side `order_index` normalization — sort blocks and exercises (per block) by submitted `order_index`, then reassign as clean 0-based sequential integers. Ensures no gaps, no duplicates, no negative values written to DB regardless of client input. Critical for future voice command compatibility.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — Three hardening additions:
  (1) `saveSuccess` state — shows "Template saved" with check icon after successful save, auto-clears after 3 seconds.
  (2) Master template warning — edit mode now shows: "Director edits update the official template. Coach changes during live sessions will be handled as session overrides and will not affect this master template." This is architecturally important to distinguish master-template writes from future coach session overrides.
  (3) `confirmedBlocks` and `editBlocks` initialized with `deepCopyBlocks` (lazy initializer) so they never share object references with `initialBlocks` props from the server.

**Constraints confirmed:**
- No migrations
- No npm install
- No service role
- No RLS bypass
- No new product features (no drag/drop, create, delete, publish, voice, session generation)
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

---

## 2026-04-30 — Sprint 11: Fitness Template Builder V1 (Director Edit Mode)

Added director-only edit mode to the fitness template detail page. Directors can now reorder blocks, reorder exercises within blocks, and edit durations — all from the existing read-only viewer at `/director/fitness/templates/[templateId]`.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Server action `saveTemplateEditsAction` with 5-step security chain (auth → academy_id → template ownership → block ID validation → exercise ID validation). Defines `TemplateOperation` type union aligned with future voice command pathway (`reorder_block`, `reorder_exercise`, `update_block_duration`, `update_exercise_duration`). Sequential per-row updates with double-lock `.eq('id') + .eq('template_id'/'block_id')`.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — `'use client'` component managing read/edit mode toggle. Up/down chevron buttons for block and exercise reordering (no drag/drop — no library installed). Editable `<input type="number">` for `block.duration_min` (required) and `exercise.duration_min` (nullable). Save/Cancel controls with `useTransition` for pending state. Array position → `order_index` on save.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Builds `EditableBlock[]` shape from fetched data; renders `<TemplateEditor>` instead of static block cards; removed "Read-only" lock badge (mode indicator now lives in TemplateEditor).

**Constraints confirmed:**
- No migrations created
- No packages installed
- No service role used
- No RLS bypass
- No create/delete/publish/duplicate
- No voice UI
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

## 2026-04-29 — Coach Workspace Navigation V1

Added safe, demo-ready shell pages for the three missing coach nav routes. Bottom nav is now fully navigable.

**Files created:**
- `src/app/coach/players/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders assigned players only (filtered via `coach_group_assignments`); initials avatar + `full_name` + `group_name · level_label` + `player_status` badge; `EmptyState` fallback; no edit actions; no links to player profiles
- `src/app/coach/sessions/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders today's sessions with name, `scheduled_time`, and status badge; `EmptyState` fallback; coming-soon footer (Session plans · Attendance · Group check-in)
- `src/app/coach/voice/page.tsx` — sync static Server Component; no Supabase imports; hero card + three disabled coming-soon tiles (Record Voice Note, Structure into Observation, Review Before Saving) + coach-review safety note; no `voice_notes` queried

**No files modified** beyond this changelog.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No backend helper changes (`coachWorkspace.ts` untouched)
- No layout changes (`coach/layout.tsx` untouched)
- No BottomTabBar changes
- No player or parent portal changes
- No service role / `getSupabaseAdmin` used
- No write actions added
- No `voice_notes` queried
- No AI drafts queried
- No fake data — real queries with `EmptyState` fallbacks; voice page is fully static
- `player_status` used (not `status`) — verified against `v_player_summary` in `database.types.ts`
- PreviewBanner inherited automatically from `coach/layout.tsx` on all three new routes
- BottomTabBar highlights correctly: Players/Sessions/Voice use `startsWith`, Home uses `exact: true`

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → `/platform`
3. Click "Preview as Coach" on any academy card → `/coach` loads with PreviewBanner
4. Click "Players" tab → `/coach/players` loads; Players tab highlighted; player list or empty state; no 404
5. Click "Sessions" tab → `/coach/sessions` loads; Sessions tab highlighted; today's sessions or empty state; no 404
6. Click "Voice" tab → `/coach/voice` loads; Voice tab highlighted; hero card + 3 tiles + safety note; no 404
7. Click "Home" tab → `/coach` loads; only Home tab highlighted (exact match)
8. Click "Exit Preview" → `/platform`
9. No runtime errors on any route

---

## 2026-04-29 — Platform Preview Mode Infrastructure (Phase 1B)

Enables platform users (platform_owner / platform_admin) to enter a read-only preview of any academy's portal UI, scoped to a chosen role. Writes are blocked in preview. Normal academy users are completely unaffected.

**Files created:**
- `src/lib/utils/previewMode.ts` — `PreviewRole` type, `PreviewContext` interface, `PREVIEW_COOKIE` constant; `parsePreviewCookie()` (pure, safe for Edge/middleware); `getPreviewContext()`, `isPreviewMode()`, `assertNotPreviewMode()` (Server Component / Server Action use only, via dynamic `import('next/headers')` to avoid Edge Runtime issues)
- `src/lib/actions/platform.ts` — `enterPreviewModeAction(academyId, role)`: authenticates user, verifies platform_roles row, validates role, reads academy name, sets httpOnly `ao_preview` cookie (sameSite strict, 8-hour maxAge, secure in production), redirects to correct portal; `exitPreviewModeAction()`: deletes cookie, redirects to /platform
- `src/components/platform/PreviewBanner.tsx` — async Server Component; reads preview context via `getPreviewContext()`; renders lime-accented banner with role, academy name, "Writes are disabled in preview." note, and Exit Preview form button; returns null when not in preview

**Files modified:**
- `src/middleware.ts` — platform user routing refactored: /platform still always accessible; root `/` still redirects to /platform; portal routes (director/coach/player/parent) now require a valid `ao_preview` cookie with matching role — no matching cookie → redirect to /platform; non-platform users are completely unaffected (their path is structurally separated and unchanged)
- `src/app/platform/page.tsx` — each academy card now has a "Preview Portal" section with 4 buttons (Director / Coach / Player / Parent); each button binds `enterPreviewModeAction` with the academy ID and role; "Preview Mode" removed from coming-soon module cards
- `src/app/director/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/coach/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/player/layout.tsx` — removed `'use client'` (layout has no hooks; BottomTabBar carries its own `'use client'`); `<PreviewBanner />` added above `{children}`
- `src/app/parent/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/lib/actions/notes.ts` — `await assertNotPreviewMode()` added as first line of `addObservationAction`, `updateDevelopmentSummaryAction`, `addVoiceNoteAction`; `generateNoteDraftAction` is NOT guarded (no DB write)
- `src/lib/actions/curriculum.ts` — `await assertNotPreviewMode()` added as first line of `assignCurriculumAction`, `evaluateAdvancementAction`
- `src/components/nav/PlatformNav.tsx` — "Preview Mode" removed from `COMING_SOON_ITEMS` (preview is now live in academy cards)

**Constraints confirmed:**
- No migrations created
- No schema changes
- No service role / `getSupabaseAdmin()` used
- `ao_preview` cookie only benefits platform users (middleware ignores it for non-platform users)
- Writes blocked in preview: `assertNotPreviewMode()` guards all 5 mutating server actions
- Normal director/coach/player/parent users are completely unchanged
- No coach/player/parent shell improvements built
- No fake data created
- No academy_memberships created or modified
- No database roles changed
- No RLS bypassed
- Cross-academy live data preview deferred (RLS still uses profiles.academy_id)

**Preview mode scope (Phase 1B):**
Preview shows the portal shell and any data the authenticated platform user's own Supabase session can read via normal RLS. It does not bypass RLS or show cross-academy private data. Full cross-academy data preview is deferred to a future approved RLS migration.

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → land on /platform
2. On an academy card, click "Director" → `ao_preview` cookie set → redirected to /director with PreviewBanner visible
3. Attempt "Assign Curriculum" or "Add Observation" → should throw "Writes are disabled in preview mode."
4. Click "Exit Preview" → cookie deleted → redirected to /platform
5. Repeat with Coach / Player / Parent roles — each shows correct PreviewBanner
6. Log in as a normal academy_director → /platform should redirect to /director; `ao_preview` cookie (if present) has no effect
7. As platform user with no preview cookie, manually visit /director → redirected to /platform

---

## 2026-04-29 — Multi-Tenant Access Foundation Phase 1A: Platform Role + Shell

Established the minimum safe platform-owner foundation. Angles / platform owner can now log in, be routed to `/platform`, and view all academy tenants read-only.

**Files created:**
- `supabase/migrations/040_platform_roles.sql` — `platform_roles` table (user_id → platform_owner | platform_admin); RLS: users see own active row only; additive SELECT policy on `academies` so platform users can list all tenants via anon key (no service role needed)
- `src/lib/backend/platform.ts` — two backend helpers: `getPlatformRole(db, userId)`, `getAllAcademies(db)`; rawDb cast for platform_roles (not yet in database.types.ts)
- `src/components/nav/PlatformNav.tsx` — fixed sidebar for /platform routes; shows "Angles Platform" brand + role badge; primary nav (Tenants); coming-soon items (Tenant Management, Consultant Access, Preview Mode, Billing, Global Templates); sign-out button
- `src/app/platform/layout.tsx` — Server Component; verifies platform role (redirects to /login if not found); renders PlatformNav + main content
- `src/app/platform/page.tsx` — Server Component; shows Platform Command Center header with role badge; academy tenant cards (name, slug, country, timezone, is_active badge, created date); coming-soon module cards; no player data, no private data

**Files modified:**
- `src/middleware.ts` — checks platform_roles BEFORE academy_memberships; /platform routes allow only platform users (others redirected to their academy home); root `/` redirects platform users to /platform; non-platform routes with no matching academy role redirect platform users back to /platform (e.g. a platform_owner also with academy_director membership can still access /director)
- `src/app/login/LoginForm.tsx` — checks platform_roles after successful auth; platform users immediately routed to /platform before academy membership check runs
- `docs/CHANGELOG.md` — this entry

**Constraints confirmed:**
- No preview mode built
- No consultant access built
- No write guards added (deferred to Phase 1B)
- No service role / `getSupabaseAdmin()` used in /platform routes — anon key + RLS only
- No player data, coach notes, voice notes, AI drafts, or private observations shown
- No modifications to profiles.academy_id, academy_memberships, database.types.ts, or any locked modules
- No schema changes beyond migration 040
- Existing /director, /coach, /player, /parent routing unchanged

**To activate:**
1. Apply migration 040 in Supabase Dashboard (SQL Editor)
2. Manually INSERT a row into `platform_roles` for the platform owner's auth.users UUID
3. Run `supabase gen types typescript` to update database.types.ts after migration

TypeScript: clean.

---

## 2026-04-28 — Guardrail and source-of-truth layer

Created the permanent Claude Code guardrail system before further feature work.

**Files created:**
- `CLAUDE.md` — root-level Claude session instructions, design system reference, architecture red lines
- `docs/AI_BACKEND_RULES.md` — backend safety rules (10 rules, backend file status table)
- `docs/CURRENT_BUILD_TARGET.md` — current build phase and step-by-step build order
- `docs/LOCKED_MODULES.md` — locked / in-progress / not-built module registry
- `docs/KNOWN_LIMITATIONS.md` — documented gaps, missing features, stale docs warnings
- `docs/MODULE_BUILD_PROCESS.md` — 8-step process for every future build task
- `docs/CHANGELOG.md` — this file

**No app functionality changed.**
**No backend files changed.**
**No frontend files changed.**

---

## 2026-04-27 — Backend stable, TypeScript clean

All backend files in `src/lib/backend/` compile without TypeScript errors.

Covered:
- `director.ts` — player profile data, recommendation overrides
- `players.ts` — player list, signals, priorities, recommendations, progress snapshots
- `curriculum.ts` — domain progress, assignment RPC, advancement evaluation RPC
- `assessments.ts` — create assessment, placement recommendations, finalize placement
- `sessions.ts` — session CRUD, session recommendations, attendance, outcomes
- `dashboard.ts` — priority queue, group summaries, reassessment pipeline
- `intelligence.ts` — behavior profiles, predictions, coaching messages
- `utr.ts` — UTR recording, history, insights
- `voice.ts` — voice command submission, proposed action approval/rejection/execution

TypeScript: clean.

---

## 2026-04-27 — Initial role-based app shell

Framework, auth, and layout shells committed.

- Next.js 14 App Router initialized
- Supabase Auth with email+password
- Middleware role routing: director → `/director`, coach → `/coach`, player → `/player`, parent → `/parent`
- Director sidebar layout (`SidebarNav`)
- Coach/Player/Parent bottom tab layout (`BottomTabBar`)
- Login page (`/login`) fully functional
- Signout API route (`/api/auth/signout`)
- Tailwind design system configured (dark base, lime accent)
- UI component library created: Card, MetricCard, ActionCard, StatusBadge, LevelBadge, ProgressBar, Avatar, EmptyState, LoadingSkeleton, SectionHeader, Modal, Tabs, Table, SearchFilterBar, DomainRing

---

## 2026-04-27 — Player Profile v0

First real feature page built at `/director/players/[playerId]`.

What works:
- Player header: name, initials avatar, level badge, advancement status, last evaluated date
- Curriculum grid: 8-domain skill progress (status, mastery %, blocked-by list)
- Player info sidebar: status, join date, DOB, notes
- Coach Focus sidebar: advancement evaluation button, domain summary counts, blocked-by list
- Assign curriculum Server Action
- Evaluate advancement Server Action
- Loading skeleton (`loading.tsx`)
- Empty state when no curriculum is assigned

Data: all real Supabase queries (no mock data).

Known gaps logged in `docs/KNOWN_LIMITATIONS.md`:
- No tab structure yet
- 3-column fixed layout not mobile-safe
- Back link points to stub dashboard (will fix after Players List is built)

TypeScript: clean.

---

## 2026-04-28 — Players List

Built the player directory at `/director/players` (Step 1 of Phase 1).

**Files created:**
- `src/app/director/players/page.tsx` — Server Component; fetches academy_id from profiles, calls `getPlayerSummaries()`, renders page header and client component
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Client Component; search by name, filter by status (All / Active / Reassessment Due / On Hold / Pending), player rows with Avatar, StatusBadge, LevelBadge, last assessed date, next due date with overdue indicator, promotion-ready chip
- `src/app/director/players/loading.tsx` — Next.js skeleton; 8 SkeletonRows inside a Card

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Player Profile responsive layout (Step 2)

Fixed the broken 3-column fixed layout at `/director/players/[playerId]`.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced `grid-cols-[260px_1fr_260px]` with responsive `grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px]`; added `lg:col-span-2 xl:col-span-1` to Coach Focus column so it spans full width at `lg` and returns to a single column at `xl`; added `p-6` to page wrapper
- `src/components/player/PlayerProfileHeader.tsx` — fixed back link from `/director` → `/director/players`, label from `Dashboard` → `All Players`

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Director layout sidebar offset fix

Fixed content rendering underneath the fixed sidebar on all `/director` routes.

**Files modified:**
- `src/app/director/layout.tsx` — added `ml-60` to `<main>` so content is offset 240px right, matching the fixed sidebar width. Single global fix; no per-page hacks needed.

**No backend files changed.**
**No locked files changed.**
**No player profile data logic changed.**
TypeScript: clean.

---

## 2026-04-28 — Director Dashboard V1

Built the command center at `/director` (Step 5 of Phase 1, built ahead of Steps 3–4 by explicit request).

**Files modified:**
- `src/app/director/page.tsx` — replaced 6-line stub with full Server Component dashboard

**Data fetched (sequential per AI_BACKEND_RULES):**
- `profiles` → `academy_id`
- `academies` → `name` (for header)
- `getPlayerSummaries()` → all 4 snapshot metrics + pending placement list
- `getAcademyPriorityQueue({ limit: 5 })` → priority panel

**Sections built:**
- Header: academy name label + "Command Center" H1 + today's date
- Snapshot metrics: Total Players / Active / Pending Placement / Needs Attention (all real data)
- Priority Queue card: top 5 priority items with urgency badge + primary action; empty state if none
- Pending Placement card: up to 5 pending players with status badge; empty state if none
- Module cards: Players (live, links to `/director/players`) + 5× Coming Soon (Curriculum, Sessions, Intelligence, Reports, Configuration)

**No backend files changed.**
**No locked files changed.**
**No fake numbers — all metrics derived from real Supabase queries.**
TypeScript: clean.

---

## 2026-04-29 — Player Profile tab structure (Step 3)

Added 5-tab workspace to the Player Profile at `/director/players/[playerId]`.

**Files created:**
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — minimal Client Component; accepts 5 `ReactNode` slots; renders `Tabs` with `scrollable` TabsList and one `TabsContent` per tab

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — refactored layout from 3-column grid into 5 named slot variables passed to `PlayerProfileTabs`

**Tab breakdown:**
1. Overview — Player Info card + Coach Focus summary (domain counts, advancement status); no action button
2. Skill Path — EvaluateAdvancementButton + advancement eligible/blocked-by logic + CurriculumProgressGrid or PlayerCurriculumEmptyState
3. Competition — premium `EmptyState` placeholder; no fake data
4. Fitness / Load — premium `EmptyState` placeholder; no fake data
5. Notes — premium `EmptyState` placeholder; no fake data; prepares for Coach Notes + Voice Notes

**Architecture notes:**
- `page.tsx` remains a Server Component; all data fetching unchanged
- Server actions (`assignAction`, `evaluateAction`) remain bound in the Server Component and passed to child Client Components via slot content — no function references cross the Server → `PlayerProfileTabs` boundary
- Icons (`Trophy`, `Activity`, `MessageSquare`) are imported and rendered in `page.tsx` (Server Component) as part of slot JSX; no icon function references passed as props
- `TabsList scrollable` prop handles horizontal tab overflow on narrow viewports

**No backend files changed.**
**No Supabase files changed.**
**No locked modules changed.**
**No fake data added.**
TypeScript: clean.

---

## 2026-04-29 — Coach Notes Foundation (Phase 1)

Built the real Notes tab for coach-facing player development notes.

**Files created:**
- `supabase/migrations/039_player_development_summary.sql` — new `player_development_summary` table; full RLS (staff read/write, players/parents gated behind show_to_student/show_to_parent flags which default false)
- `src/lib/backend/notes.ts` — four backend helpers: `getCoachObservations`, `createCoachObservation`, `getPlayerDevelopmentSummary`, `upsertPlayerDevelopmentSummary`; uses `rawDb = db as any` for the new table (types will resolve after migration + `supabase gen types`)
- `src/lib/actions/notes.ts` — two server actions: `addObservationAction`, `updateDevelopmentSummaryAction`; authenticated, validated, revalidates player profile path
- `src/components/player/CoachObservationTimeline.tsx` — renders coach_observations for a player in reverse-chronological order; Internal badge when is_private; empty state
- `src/components/player/DevelopmentSummarySection.tsx` — read-only display of development summary; shows strengths, priorities, development focus, coach summary, student-facing preview with visibility labels
- `src/components/player/AddObservationForm.tsx` — client form; observation_type dropdown (all 8 existing values), content textarea, is_private toggle (defaults true/internal)
- `src/components/player/EditDevelopmentSummaryForm.tsx` — client form; newline-separated strengths/work-ons converted to arrays; visibility toggles rendered but disabled (future sprint gate)

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced Notes tab placeholder with real UI; sequential data fetching for observations and development summary; bound server actions for forms

**Constraints confirmed:**
- No voice features built
- No AI structuring built
- No fake or hardcoded notes
- Coach-only notes not exposed to player or parent routes (RLS + show_to_student/show_to_parent default false)
- coach_observations schema untouched
- voice_notes schema untouched
- parent_updates schema untouched
- No locked modules modified

**Migration note:** Migration `039` must be applied and `supabase gen types typescript` run before deploying. The `player_development_summary` backend helpers use `rawDb = db as any` until types are regenerated.

TypeScript: clean.

---

## 2026-04-29 — Voice Note Capture MVP (transcript-first)

Added transcript-first voice note capture to the Notes tab.

**Files created:**
- `src/components/player/AddVoiceNoteForm.tsx` — client form; textarea for transcript (with device dictation microcopy), observation_type dropdown, is_private toggle (default true); follows AddObservationForm pattern with useTransition

**Files modified:**
- `src/lib/backend/notes.ts` — added `createVoiceNoteWithObservation()`: three sequential queries — insert voice_notes (processing_status=pending), insert coach_observations, update voice_notes.parsed_observation_id + processing_status=parsed
- `src/lib/actions/notes.ts` — added `addVoiceNoteAction()`: authenticates user, validates transcript and observation_type, calls createVoiceNoteWithObservation, revalidatePath
- `src/app/director/players/[playerId]/page.tsx` — imported AddVoiceNoteForm and addVoiceNoteAction; bound server action; added AddVoiceNoteForm below AddObservationForm in notesSlot

**Architecture constraints confirmed:**
- No migration created — voice_notes already existed in migration 010 and database.types.ts
- No schema changes — voice_notes, coach_observations, player_development_summary untouched
- No browser recording, audio upload, Supabase Storage, transcription, or AI structuring
- No voice command execution or proposed_actions pipeline
- Voice notes are staff-only (existing RLS); resulting observations default is_private=true
- No player or parent exposure

**Data flow:** transcript → voice_notes row (processing_status=parsed) → coach_observations row via parsed_observation_id → appears in CoachObservationTimeline immediately

TypeScript: clean.

---

## 2026-04-29 — AI Note Structuring MVP

Added coach-reviewed AI draft generation for player development summaries.

**Files created:**
- `src/lib/ai/structureCoachNote.ts` — Anthropic SDK call; `AIDraftResult` type; system prompt enforcing tennis coaching tone; JSON validation; safe error on missing API key
- `src/components/player/AIDraftPanel.tsx` — client component; note textarea; "Draft with AI" button with loading state; editable draft fields (strengths, work-ons, focus, coach summary, student summary); confidence badge; warnings display; overwrite warning with explicit confirmation gate when existing summary has content; "Apply Draft to Summary" form submission

**Files modified:**
- `src/lib/actions/notes.ts` — added `generateNoteDraftAction()` server action; authenticated; returns `GenerateDraftResult` (ok+draft or error string); does not write to database
- `src/app/director/players/[playerId]/page.tsx` — imported `AIDraftPanel`, `generateNoteDraftAction`; inserted `AIDraftPanel` in Notes tab between `DevelopmentSummarySection` and `EditDevelopmentSummaryForm`
- `package.json` / `package-lock.json` — added `@anthropic-ai/sdk`

**Constraints confirmed:**
- No migration created
- No schema changes (player_development_summary, coach_observations, voice_notes untouched)
- No AI output auto-saved — coach must click "Apply Draft to Summary"
- show_to_student and show_to_parent hardcoded false in apply form
- source set to 'ai_draft' on apply
- API key never exposed to client — call is server-side only
- Overwrite protection: if existing summary has content, a warning block appears and coach must click confirm before the apply form is shown
- Player and parent routes not modified
- No fake or hardcoded AI responses

TypeScript: clean.

---

## 2026-04-29 — Coach / Player / Parent Shell V1

Premium shell pages for all three non-director portals. Shell-only — no data queries, no private data exposure, no fake data.

**Files modified:**
- `src/app/coach/page.tsx` — Coach Hub shell: header with current date, Today's Sessions card (EmptyState + coming-soon footer), My Players + Recent Notes in sm:grid-cols-2 with "Soon" badges, 4 disabled Quick Action tiles (opacity-50 / cursor-not-allowed), On the Roadmap pills
- `src/app/player/page.tsx` — Player Home shell: "YOUR JOURNEY" header, motivating tagline, Today's Mission (lime accent), My Skills, Wins & Streaks, Messages cards (all EmptyState), Coming Soon pill row
- `src/app/parent/page.tsx` — Parent Home shell: "FAMILY PORTAL" header, Child's Progress (lime accent), Latest Coach Update, Session Consistency, Support at Home (static safe copy — no data), Messages & Updates cards

**Constraints confirmed:**
- No new files created
- No migrations
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform action changes
- No server action changes
- No backend helper changes
- No layout changes
- No BottomTabBar changes
- No Supabase queries — all three pages are plain sync Server Components
- No async added to any page
- No private coach notes, AI drafts, voice transcripts, or internal summaries exposed to player or parent
- No fake data — all cards use EmptyState or safe static copy
- PreviewBanner continues rendering from layouts (untouched)

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → /platform loads
2. Click "Preview as Coach" on any academy card
   → /coach loads with PreviewBanner visible
   → Coach Hub header + today's date visible
   → Today's Sessions, My Players, Recent Notes, Quick Actions, Roadmap all visible
   → Bottom nav: Home / Players / Sessions / Voice — all render
   → No runtime errors
3. Click "Exit Preview" → /platform
4. Click "Preview as Player" on any academy card
   → /player loads with PreviewBanner visible
   → Player Home header + tagline visible
   → Today's Mission, My Skills, Wins & Streaks, Messages cards visible
   → Coming Soon pills visible
   → Bottom nav: Home / Progress / Wins / Messages — all render
   → No coach observations, notes, AI drafts, or voice transcripts visible
   → No runtime errors
5. Click "Exit Preview" → /platform
6. Click "Preview as Parent" on any academy card
   → /parent loads with PreviewBanner visible
   → Parent Home header visible
   → Child's Progress, Latest Coach Update, Session Consistency, Support at Home, Messages & Updates visible
   → No gamified player language, no coach observations, no internal notes
   → No runtime errors
7. Click "Exit Preview" → /platform

---

## 2026-04-29 — Coach Workspace Real Data V1

Replaced the static Coach Hub shell with real Supabase data. No fake data, no new schema, no service role usage.

**Files created:**
- `src/lib/backend/coachWorkspace.ts` — `getCoachWorkspaceSummary(db, userId)`: sequential RLS-respecting queries; fetches coach profile → active group assignments → assigned groups (v_group_summary) → assigned players (v_player_summary filtered by group IDs) → recent coach_observations (by coach, not voice_notes) → player name resolution → today's sessions. Returns typed `CoachWorkspaceSummary` with graceful empty fallback.

**Files modified:**
- `src/app/coach/page.tsx` — converted from static shell to async Server Component; calls `getCoachWorkspaceSummary`; Today's Sessions renders real session rows with status badge; My Players renders up to 5 assigned players with initials avatar and group/level detail; Recent Notes renders up to 5 recent coach_observations with type label, Internal badge, and truncated content; all sections fall back to `EmptyState` when no data.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No player page, parent page, or layout changes
- No BottomTabBar changes
- No service role / getSupabaseAdmin used
- No write actions added
- No voice_notes queried
- No AI drafts queried
- No fake data
- RLS not broadened
- Unassigned players not shown — players filtered only through coach's assigned group IDs via coach_group_assignments

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → /platform
3. Click "Preview as Coach" on an academy card
   → /coach loads with PreviewBanner visible
   → Today's Sessions: real sessions or empty state
   → My Players: real assigned players or empty state
   → Recent Notes: real coach_observations or empty state
4. Click "Exit Preview" → /platform

---

## Next build target

**Player Profile tab content** — fill Step 4 tabs with real backend data

See `docs/CURRENT_BUILD_TARGET.md` Step 4 for full specification.
