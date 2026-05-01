-- ============================================================
-- ACADEMY OS — MIGRATION 045: CURRICULUM CONTENT LIBRARY
-- Creates the curriculum content item and requirement mapping
-- tables that power the curriculum-aware template engine.
--
-- Tables created:
--   curriculum_content_items            — drills, games, skills, assessments
--   curriculum_content_requirement_mappings — content → requirement links
--
-- Table amended:
--   templates — adds nullable curriculum_level_id FK
--
-- Sprint: 53 — Curriculum Content Tables / Seed Structure V1
-- ============================================================


-- ============================================================
-- TABLE: curriculum_content_items
-- Stores curriculum-aligned content: drills, games, skills,
-- assessments, warmups, cooldowns.
--
--   academy_id IS NULL  → global default (platform-defined)
--   academy_id NOT NULL → academy-specific content
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_content_items (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              UUID        REFERENCES academies(id) ON DELETE CASCADE,
  source_type             TEXT        NOT NULL DEFAULT 'global_default'
                          CHECK (source_type IN (
                            'global_default', 'academy_custom', 'imported', 'copied'
                          )),
  content_type            TEXT        NOT NULL
                          CHECK (content_type IN (
                            'drill', 'game', 'skill', 'assessment',
                            'warmup', 'cooldown', 'fitness', 'tactical', 'competition'
                          )),
  pathway                 TEXT        NOT NULL DEFAULT 'skill'
                          CHECK (pathway IN ('skill', 'competition', 'fitness', 'mixed')),
  level_id                UUID        REFERENCES curriculum_levels(id) ON DELETE SET NULL,
  title                   TEXT        NOT NULL,
  description             TEXT,
  player_count_min        INTEGER,
  player_count_max        INTEGER,
  duration_min            INTEGER,
  duration_max            INTEGER,
  court_setup             TEXT,
  equipment               TEXT[],
  intensity               INTEGER     CHECK (intensity BETWEEN 1 AND 10),
  difficulty              INTEGER     CHECK (difficulty BETWEEN 1 AND 5),
  tags                    TEXT[],
  success_criteria        TEXT[],
  progressions            TEXT[],
  regressions             TEXT[],
  coach_cues              TEXT[],
  constraints             TEXT[],
  is_assessment_moment    BOOLEAN     NOT NULL DEFAULT false,
  parent_safe_name        TEXT,
  parent_safe_description TEXT,
  version                 INTEGER     NOT NULL DEFAULT 1,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  created_by              UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent re-runs safe: unique title per level + type for global defaults
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_content_items_global_unique
  ON curriculum_content_items (level_id, content_type, title, version)
  WHERE academy_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_level
  ON curriculum_content_items (level_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_type
  ON curriculum_content_items (content_type, pathway);

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_academy
  ON curriculum_content_items (academy_id)
  WHERE academy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_content_items_active
  ON curriculum_content_items (is_active)
  WHERE is_active = true;

ALTER TABLE curriculum_content_items ENABLE ROW LEVEL SECURITY;

-- Global content readable by all authenticated users
CREATE POLICY "Authenticated read global curriculum content"
  ON curriculum_content_items FOR SELECT
  USING (auth.uid() IS NOT NULL AND academy_id IS NULL);

-- Academy staff can read academy-specific content
CREATE POLICY "Academy staff read academy curriculum content"
  ON curriculum_content_items FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

-- Directors and head coaches manage academy-specific content
CREATE POLICY "Directors manage academy curriculum content"
  ON curriculum_content_items FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE TRIGGER trg_curriculum_content_items_updated_at
  BEFORE UPDATE ON curriculum_content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: curriculum_content_requirement_mappings
-- Maps curriculum content items to the curriculum track
-- requirements they develop, assess, or reinforce.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_content_requirement_mappings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID        NOT NULL REFERENCES curriculum_content_items(id) ON DELETE CASCADE,
  requirement_id  UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  mapping_type    TEXT        NOT NULL DEFAULT 'develops'
                  CHECK (mapping_type IN ('develops', 'assesses', 'reinforces')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_content_req_mappings_content
  ON curriculum_content_requirement_mappings (content_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_content_req_mappings_req
  ON curriculum_content_requirement_mappings (requirement_id);

ALTER TABLE curriculum_content_requirement_mappings ENABLE ROW LEVEL SECURITY;

-- Mappings are non-sensitive — all authenticated users can read
CREATE POLICY "Authenticated read curriculum content mappings"
  ON curriculum_content_requirement_mappings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Directors and head coaches can manage mappings
CREATE POLICY "Directors manage curriculum content mappings"
  ON curriculum_content_requirement_mappings FOR ALL
  USING (
    auth_is_director_or_head() AND (
      SELECT auth_academy_id() = cci.academy_id OR cci.academy_id IS NULL
      FROM curriculum_content_items cci
      WHERE cci.id = content_id
    )
  );


-- ============================================================
-- ALTER TABLE templates
-- Add nullable curriculum_level_id so directors can tag which
-- curriculum level a template is designed for. Used by the
-- curriculum-aware population action (Sprint 56).
-- ============================================================

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS curriculum_level_id UUID REFERENCES curriculum_levels(id);

CREATE INDEX IF NOT EXISTS idx_templates_curriculum_level
  ON templates (curriculum_level_id)
  WHERE curriculum_level_id IS NOT NULL;
