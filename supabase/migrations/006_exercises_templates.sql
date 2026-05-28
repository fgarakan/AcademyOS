-- ============================================================
-- ACADEMY OS — MIGRATION 006: EXERCISES AND TEMPLATES
-- Exercise library and session blueprint (template) system.
-- KEY RULE: template_blocks.order_index is the DEFAULT order.
--           Sessions copy blocks and may reorder them independently.
--           Reordering a session never modifies its template.
-- ============================================================

-- ============================================================
-- EXERCISE CATEGORY ENUM
-- ============================================================
CREATE TYPE exercise_category AS ENUM (
  'technical', 'tactical', 'movement', 'fitness',
  'competition', 'mental', 'warm_up', 'cool_down'
);

-- ============================================================
-- EXERCISE LIBRARY
-- Shared across all templates in an academy.
-- ============================================================
CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        exercise_category NOT NULL,
  subcategory     TEXT,
  description     TEXT,
  instructions    TEXT,
  coaching_points TEXT,
  duration_min    INTEGER CHECK (duration_min > 0),
  equipment       TEXT[],
  tags            TEXT[],
  level_range     JSONB,  -- {"min": 1, "max": 6}
  track           development_track,  -- NULL = applicable to all tracks
  video_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_academy  ON exercises(academy_id, category);
CREATE INDEX idx_exercises_tags     ON exercises USING gin(tags);
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);

CREATE TRIGGER tr_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- BLOCK TYPE ENUM
-- Used in both template_blocks and session_blocks.
-- ============================================================
CREATE TYPE block_type AS ENUM (
  'warm_up', 'technical', 'tactical', 'movement',
  'fitness', 'competition', 'mental', 'cool_down', 'free'
);

-- ============================================================
-- TEMPLATES
-- Reusable blueprints. Not changed when sessions run.
-- ============================================================
CREATE TABLE templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  group_id            UUID REFERENCES groups(id),
  track               development_track,
  level_id            UUID REFERENCES academy_levels(id),
  total_duration_min  INTEGER,
  tags                TEXT[],
  is_active           BOOLEAN NOT NULL DEFAULT true,
  is_default          BOOLEAN NOT NULL DEFAULT false,
  created_by          UUID REFERENCES profiles(id),
  voice_command_id    UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_academy ON templates(academy_id, group_id);

CREATE TRIGGER tr_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TEMPLATE BLOCKS
-- Ordered segments within a template.
-- order_index = immutable default order. Sessions copy this at creation.
-- ============================================================
CREATE TABLE template_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type        block_type NOT NULL,
  name        TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  intensity   INTEGER CHECK (intensity BETWEEN 1 AND 5),
  order_index INTEGER NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_blocks_template ON template_blocks(template_id, order_index);

-- ============================================================
-- TEMPLATE BLOCK EXERCISES
-- Exercises assigned within template blocks (also the default for sessions).
-- ============================================================
CREATE TABLE template_block_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES template_blocks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  duration_min INTEGER,
  notes       TEXT
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE exercises              ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_block_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see exercises"
  ON exercises FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage exercises"
  ON exercises FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see templates"
  ON templates FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage templates"
  ON templates FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see template blocks"
  ON template_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
      AND t.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );

CREATE POLICY "Staff manage template blocks"
  ON template_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_blocks.template_id
      AND t.academy_id = auth_academy_id()
      AND auth_is_staff()
    )
  );
