-- ============================================================
-- ACADEMY OS — MIGRATION 061: CURRICULUM CONTENT TAXONOMY
-- Additive schema migration — extends curriculum_content_items
-- with domain, session block hint, role visibility flags, and
-- ball level. Expands the content_type CHECK constraint to cover
-- the full lesson-planning taxonomy.
--
-- What this migration changes:
--   curriculum_content_items — 6 new columns (all additive)
--   curriculum_content_items — content_type CHECK constraint expanded
--   curriculum_content_items — 7 new indexes
--
-- What this migration does NOT change:
--   No new tables created.
--   No existing rows modified or deleted.
--   No seed data inserted.
--   No junction tables (Sprint 129).
--   No Fitness OS tables touched (exercises, template_block_exercises).
--   No app code changed.
--   No database.types.ts changes (regenerate after live DB apply).
--   No parent/player portal exposure (flags are schema-only, default false).
--   No AI, no lesson plan generator, no proposed_actions.
--
-- Sprint: 128 — Curriculum Content Taxonomy Migration
-- ============================================================


-- ============================================================
-- STEP 1: ADD NEW COLUMNS
-- All columns are additive (ADD COLUMN IF NOT EXISTS).
-- Existing rows are unaffected: nullable columns default to NULL,
-- boolean flags default to false.
-- ============================================================

-- domain: the curriculum domain this content item belongs to.
-- Used to align content with lesson plan blocks and coach language.
-- NULL = not yet categorised (safe — no existing rows have a domain).
-- Domain values match curriculum_drills.domain and curriculum_coach_language.domain.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS domain TEXT
    CHECK (domain IN (
      'Technical',
      'Tactical',
      'Movement',
      'Competition',
      'Mentality',
      'Fitness',
      'Recovery',
      'Lifestyle',
      'Games',
      'Assessment'
    ));

COMMENT ON COLUMN curriculum_content_items.domain IS
  'Curriculum domain for lesson planning alignment. '
  'Matches domains used in curriculum_drills and curriculum_coach_language. '
  'NULL = not yet assigned. '
  'Values: Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, Lifestyle, Games, Assessment.';


-- session_block_hint: the suggested lesson plan block placement for this item.
-- Informational only — does not enforce or constrain template block assignment.
-- Matches the session_block values in curriculum_drills (Warm-Up, Focus, Train, Play, Game)
-- plus new block types needed for the full lesson planning model.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS session_block_hint TEXT
    CHECK (session_block_hint IN (
      'Warm-Up',
      'Focus',
      'Train',
      'Play',
      'Game',
      'Situational',
      'Match-Play',
      'Assessment',
      'Cool-Down'
    ));

COMMENT ON COLUMN curriculum_content_items.session_block_hint IS
  'Suggested lesson plan block placement for this content item. '
  'Informational only — does not restrict which block this can be assigned to. '
  'Matches curriculum_drills.session_block values plus Situational, Match-Play, Assessment, Cool-Down.';


-- is_player_visible: future flag to mark content safe for the player portal.
-- DEFAULT false — no content is automatically exposed to players.
-- IMPORTANT: The player portal must NOT query curriculum_content_items directly
-- until explicit role-gated queries and content review are in place.
-- This flag is schema infrastructure only. Sprint 128 does not build the exposure layer.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_player_visible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN curriculum_content_items.is_player_visible IS
  'Future use: marks this content item as safe to surface in the player portal. '
  'Default false — nothing is player-visible until explicitly reviewed and flagged. '
  'The player portal must NOT query this table until role-gated queries are built. '
  'Schema infrastructure only — no player exposure logic built in Sprint 128.';


-- is_parent_visible: future flag to mark content safe for the parent portal.
-- DEFAULT false — no content is automatically exposed to parents.
-- IMPORTANT: Same constraint as is_player_visible — parent portal must not
-- query this table directly until role-gated queries are built and reviewed.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_parent_visible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN curriculum_content_items.is_parent_visible IS
  'Future use: marks this content item as safe to surface in the parent portal. '
  'Default false — nothing is parent-visible until explicitly reviewed and flagged. '
  'Parent portal must NOT query this table until role-gated queries are built. '
  'Schema infrastructure only — no parent exposure logic built in Sprint 128.';


-- is_coach_only: marks content that is strictly coach/director-facing.
-- When true, is_player_visible and is_parent_visible must remain false.
-- Typical for: raw gate criteria text, internal assessment notes,
-- detailed failure mode descriptions, coach-only success criteria.
-- DEFAULT false — content is not restricted by default.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS is_coach_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN curriculum_content_items.is_coach_only IS
  'Marks this content item as strictly coach/director-facing. '
  'When true, is_player_visible and is_parent_visible must be false. '
  'Default false — items are not coach-only unless explicitly flagged. '
  'Used for: raw gate criteria, internal assessment descriptors, '
  'coach-only success criteria, failure mode descriptions.';


-- ball_level: the ball colour / equipment level this content is designed for.
-- Aligns with ITF/USTA Progressive Tennis stages.
-- NULL = level-agnostic, or inferred from curriculum_level_id context.
ALTER TABLE curriculum_content_items
  ADD COLUMN IF NOT EXISTS ball_level TEXT
    CHECK (ball_level IN (
      'red',
      'orange',
      'green',
      'yellow',
      'any'
    ));

COMMENT ON COLUMN curriculum_content_items.ball_level IS
  'Ball colour / equipment level this content is designed for. '
  'NULL = level-agnostic or inferred from curriculum_level_id. '
  'red = Red Ball (mini court, < 36"), '
  'orange = Orange Ball (3/4 court), '
  'green = Green Dot (full court, compressed ball), '
  'yellow = standard yellow ball (full court, full compression), '
  'any = applicable at all ball levels.';


-- ============================================================
-- STEP 2: EXPAND content_type CHECK CONSTRAINT
-- The inline CHECK on content_type created in migration 045 was
-- assigned an auto-generated name by PostgreSQL. We must find
-- and drop it before adding the expanded version.
--
-- Approach: use a DO block to dynamically locate and drop any
-- CHECK constraint on curriculum_content_items that references
-- content_type, then add the new named constraint outside the block.
-- Safe to re-run: the new ADD CONSTRAINT is idempotent if the
-- old constraint has already been dropped.
-- ============================================================

DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.curriculum_content_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%content_type%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE curriculum_content_items DROP CONSTRAINT %I',
      v_constraint_name
    );
    RAISE NOTICE 'Sprint 128: dropped existing content_type CHECK constraint "%".',
      v_constraint_name;
  ELSE
    RAISE NOTICE 'Sprint 128: no existing content_type CHECK constraint found — skipping drop.';
  END IF;
END $$;

-- Add the expanded content_type constraint with the full approved value list.
-- Includes all original values from migration 045 (preserved exactly) plus
-- the new taxonomy values required for lesson planning.
ALTER TABLE curriculum_content_items
  ADD CONSTRAINT curriculum_content_items_content_type_check
  CHECK (content_type IN (
    -- ── Original values from migration 045 (preserved) ──────
    'drill',
    'game',
    'skill',
    'assessment',
    'warmup',
    'cooldown',
    'fitness',
    'tactical',
    'competition',
    -- ── New taxonomy values (Sprint 128) ────────────────────
    'tactical_game',        -- competitive game with explicit tactical constraint
    'situational',          -- specific match situation (serve+1, approach, etc.)
    'match_play_theme',     -- full-point play with a stated coaching theme
    'mental_skill',         -- mental/emotional routine, cue, or theme
    'competition_behavior', -- specific behaviour in match context
    'coach_cue',            -- a specific coaching phrase (short text, coach-only)
    'success_criteria',     -- observable success definition (broader)
    'success_criteria_item',-- single observable criterion line
    'progression',          -- how to make a drill/game harder
    'regression',           -- how to make a drill/game easier
    'player_mission',       -- what the player is working on (safe language)
    'parent_guidance',      -- how a parent can support at home (safe language)
    'level_gate_support'    -- content that directly supports passing a gate criterion
  ));


-- ============================================================
-- STEP 3: INDEXES
-- idx_curriculum_content_items_level already exists (migration 045).
-- idx_curriculum_content_items_type already exists (migration 045)
--   as (content_type, pathway) — kept; new standalone index is separate.
-- All new indexes use CREATE INDEX IF NOT EXISTS.
-- ============================================================

-- Standalone content_type index for simple type-only lookups.
-- The existing idx_curriculum_content_items_type covers (content_type, pathway)
-- and is retained. This additional index helps queries filtering by type alone.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_content_type
  ON curriculum_content_items(content_type);

-- Domain index — primary driver for lesson plan block selection.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_domain
  ON curriculum_content_items(domain)
  WHERE domain IS NOT NULL;

-- Session block hint index — used to filter content by lesson section.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_session_block_hint
  ON curriculum_content_items(session_block_hint)
  WHERE session_block_hint IS NOT NULL;

-- Ball level index — used to filter content by equipment stage.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_ball_level
  ON curriculum_content_items(ball_level)
  WHERE ball_level IS NOT NULL;

-- Sparse player visibility index — only rows where true are indexed.
-- Very few rows will be player-visible in practice; partial index is efficient.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_player_visible
  ON curriculum_content_items(is_player_visible)
  WHERE is_player_visible = true;

-- Sparse parent visibility index — same rationale as player visible.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_parent_visible
  ON curriculum_content_items(is_parent_visible)
  WHERE is_parent_visible = true;

-- Composite lesson-plan query index: level + domain + content_type.
-- Powers the "give me active Technical drills for Orange 1" query pattern
-- that the lesson plan generator will use.
CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_lesson_plan
  ON curriculum_content_items(level_id, domain, content_type)
  WHERE is_active = true;

-- ============================================================
-- DONE
-- No tables dropped. No rows modified. No data seeded.
-- Apply to live Supabase, then regenerate database.types.ts.
-- ============================================================
