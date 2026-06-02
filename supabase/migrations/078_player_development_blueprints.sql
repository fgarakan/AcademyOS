-- ============================================================
-- ACADEMY OS — MIGRATION 078: PLAYER DEVELOPMENT BLUEPRINTS
--
-- The Development Blueprint is the complete development plan generated
-- immediately after a player is placed. It captures the assessment snapshot,
-- 4-pathway priorities, 30-day plan, initial missions, coach brief, and
-- parent-safe summary — all from a single source of truth.
--
-- Architecture:
--   finalize_player_placement() → generateBlueprintAction() → INSERT blueprint
--
-- One active blueprint per player at any time.
-- When a new assessment triggers a new blueprint, the previous is archived.
--
-- Sprint: Player Development Blueprint System — Sprint 1112
-- ============================================================

CREATE TABLE IF NOT EXISTS player_development_blueprints (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                  UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                   UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- ── Source references ─────────────────────────────────────────────────────
  -- FK to assessments (nullable — blueprint can be created without a scored assessment)
  assessment_id               UUID        REFERENCES assessments(id),
  -- Back-reference to placement_recommendations (no FK — event-log design)
  placement_recommendation_id UUID,

  -- ── Curriculum context snapshot ───────────────────────────────────────────
  -- Stored as snapshot so blueprint survives curriculum restructuring
  curriculum_level_id         UUID        REFERENCES curriculum_levels(id),
  curriculum_level_name       TEXT,
  curriculum_stage_key        TEXT,         -- e.g. 'red_foundation'

  -- ── Assessment score snapshot ────────────────────────────────────────────
  technical_score             NUMERIC(4,2),
  tactical_score              NUMERIC(4,2),
  movement_score              NUMERIC(4,2),
  competition_score           NUMERIC(4,2),
  behavioral_score            NUMERIC(4,2),
  overall_score               NUMERIC(4,2),

  -- ── Strengths and gaps ───────────────────────────────────────────────────
  strengths                   TEXT[]      NOT NULL DEFAULT '{}',
  gaps                        TEXT[]      NOT NULL DEFAULT '{}',

  -- ── Generated priorities (JSONB arrays of priority objects) ──────────────
  -- Each element: { rank: number, label: string, description: string, why: string }
  skill_priorities            JSONB       NOT NULL DEFAULT '[]',
  competition_priorities      JSONB       NOT NULL DEFAULT '[]',
  fitness_priorities          JSONB       NOT NULL DEFAULT '[]',
  mental_priorities           JSONB       NOT NULL DEFAULT '[]',

  -- ── First 30-day plan ────────────────────────────────────────────────────
  -- { skill: string, competition: string, fitness: string, mental: string, rationale: string }
  thirty_day_plan             JSONB       NOT NULL DEFAULT '{}',

  -- ── Coach materials ──────────────────────────────────────────────────────
  coach_brief                 TEXT,
  coach_focus_areas           TEXT[]      NOT NULL DEFAULT '{}',

  -- ── Parent-safe summary ──────────────────────────────────────────────────
  -- Never contains raw assessment scores or internal coaching language
  parent_summary              TEXT,
  parent_development_focus    TEXT,
  parent_next_steps           TEXT[]      NOT NULL DEFAULT '{}',
  parent_thirty_day_preview   TEXT,

  -- ── DONNA coaching brief ─────────────────────────────────────────────────
  donna_brief                 TEXT,

  -- ── Status lifecycle ─────────────────────────────────────────────────────
  -- active      — current blueprint for this player
  -- superseded  — replaced by a newer blueprint after reassessment
  -- archived    — manually archived by director
  status                      TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'superseded', 'archived')),

  -- Blueprint evolution — links to the new blueprint that replaced this one
  superseded_by               UUID        REFERENCES player_development_blueprints(id),
  superseded_at               TIMESTAMPTZ,

  -- ── Audit fields ─────────────────────────────────────────────────────────
  generated_by                UUID        REFERENCES profiles(id),
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdb_player_active
  ON player_development_blueprints(player_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pdb_academy
  ON player_development_blueprints(academy_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pdb_assessment
  ON player_development_blueprints(assessment_id)
  WHERE assessment_id IS NOT NULL;

-- updated_at trigger
CREATE TRIGGER tr_player_development_blueprints_updated_at
  BEFORE UPDATE ON player_development_blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE player_development_blueprints ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches see all blueprints in their academy
CREATE POLICY "Directors see all blueprints"
  ON player_development_blueprints FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches see active blueprints (for players they work with — scoped at app layer)
CREATE POLICY "Coaches see active blueprints"
  ON player_development_blueprints FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND status = 'active'
  );

-- Players see their own active blueprint
CREATE POLICY "Players see own active blueprint"
  ON player_development_blueprints FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND status = 'active'
    AND player_id = (
      SELECT id FROM players
      WHERE profile_id = auth.uid()
        AND academy_id = auth_academy_id()
      LIMIT 1
    )
  );

-- Directors can create blueprints
CREATE POLICY "Directors create blueprints"
  ON player_development_blueprints FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Directors can update blueprints (archive, supersede)
CREATE POLICY "Directors update blueprints"
  ON player_development_blueprints FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

COMMENT ON TABLE player_development_blueprints IS
  'Complete development plan generated immediately after player placement. '
  'Contains 4-pathway priorities, 30-day plan, initial missions context, '
  'coach brief, and parent-safe summary. One active blueprint per player. '
  'New assessments trigger blueprint supersession, preserving history.';

COMMENT ON COLUMN player_development_blueprints.skill_priorities IS
  'Array of priority objects: { rank, label, description, why }. Max 3 items.';

COMMENT ON COLUMN player_development_blueprints.thirty_day_plan IS
  'Object: { skill, competition, fitness, mental, rationale }. One focus per pathway.';

COMMENT ON COLUMN player_development_blueprints.status IS
  'active: current blueprint. superseded: replaced by newer blueprint. archived: manually removed.';
