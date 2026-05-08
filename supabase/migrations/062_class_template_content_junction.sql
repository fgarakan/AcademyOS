-- ============================================================
-- ACADEMY OS — MIGRATION 062: CLASS TEMPLATE CURRICULUM CONTENT JUNCTION
-- Creates curriculum_class_template_blocks — the bridge between class
-- template blocks and curriculum content items / drills.
--
-- WHY:
--   Class templates currently show fitness exercises via
--   template_block_exercises → exercises. That path is for Fitness OS.
--   Class templates need a separate curriculum content pipeline:
--   curriculum_class_template_blocks → curriculum_content_items | curriculum_drills
--
-- What this migration creates:
--   curriculum_class_template_blocks  — junction table
--   RLS policies (staff read, director/head manage)
--   5 indexes
--   updated_at trigger
--
-- What this migration does NOT touch:
--   template_block_exercises
--   exercises
--   Fitness OS
--   app code
--   database.types.ts (regenerate after live apply)
--
-- Constraint: exactly one of content_item_id or drill_id must be set.
-- Uniqueness: (block_id, order_index) — no two rows share the same
--   position within a block.
--
-- Sprint: 129 — Class Template Content Junction Table
-- ============================================================


-- ============================================================
-- STEP 1: CREATE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_class_template_blocks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  block_id          UUID NOT NULL REFERENCES template_blocks(id) ON DELETE CASCADE,
  content_item_id   UUID REFERENCES curriculum_content_items(id) ON DELETE CASCADE,
  drill_id          UUID REFERENCES curriculum_drills(id) ON DELETE CASCADE,
  order_index       INTEGER NOT NULL,
  notes             TEXT,
  duration_min      INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Exactly one of content_item_id or drill_id must be present
  CONSTRAINT curriculum_cctb_exactly_one_source CHECK (
    (content_item_id IS NOT NULL AND drill_id IS NULL)
    OR
    (content_item_id IS NULL AND drill_id IS NOT NULL)
  ),

  -- No two rows occupy the same position within a block
  CONSTRAINT curriculum_cctb_block_order_unique UNIQUE (block_id, order_index)
);


-- ============================================================
-- STEP 2: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_curriculum_cctb_template_id
  ON curriculum_class_template_blocks(template_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_cctb_block_id
  ON curriculum_class_template_blocks(block_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_cctb_content_item_id
  ON curriculum_class_template_blocks(content_item_id)
  WHERE content_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_cctb_drill_id
  ON curriculum_class_template_blocks(drill_id)
  WHERE drill_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_cctb_template_block
  ON curriculum_class_template_blocks(template_id, block_id);


-- ============================================================
-- STEP 3: UPDATED_AT TRIGGER
-- Reuse the standard pattern used throughout the schema.
-- ============================================================
CREATE OR REPLACE FUNCTION trg_curriculum_cctb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_curriculum_cctb_updated_at ON curriculum_class_template_blocks;
CREATE TRIGGER set_curriculum_cctb_updated_at
  BEFORE UPDATE ON curriculum_class_template_blocks
  FOR EACH ROW EXECUTE FUNCTION trg_curriculum_cctb_updated_at();


-- ============================================================
-- STEP 4: ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE curriculum_class_template_blocks ENABLE ROW LEVEL SECURITY;

-- Staff (director, head_coach, coach) in the same academy can read
CREATE POLICY "Staff see curriculum class template blocks"
  ON curriculum_class_template_blocks
  FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM templates WHERE academy_id = auth_academy_id()
    )
    AND auth_is_staff()
  );

-- Directors and head coaches in the same academy can manage (insert/update/delete)
CREATE POLICY "Directors manage curriculum class template blocks"
  ON curriculum_class_template_blocks
  FOR ALL
  USING (
    template_id IN (
      SELECT id FROM templates WHERE academy_id = auth_academy_id()
    )
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM templates WHERE academy_id = auth_academy_id()
    )
    AND auth_is_director_or_head()
  );


-- ============================================================
-- STEP 5: COMMENTS
-- ============================================================
COMMENT ON TABLE curriculum_class_template_blocks IS
  'Links class template blocks to curriculum content items or drills. '
  'This is the curriculum content pipeline for class templates — '
  'separate from the fitness pipeline (template_block_exercises → exercises). '
  'Exactly one of content_item_id or drill_id must be non-null per row.';

COMMENT ON COLUMN curriculum_class_template_blocks.content_item_id IS
  'Reference to curriculum_content_items. Mutually exclusive with drill_id.';

COMMENT ON COLUMN curriculum_class_template_blocks.drill_id IS
  'Reference to curriculum_drills. Mutually exclusive with content_item_id.';

COMMENT ON COLUMN curriculum_class_template_blocks.order_index IS
  'Position within the block. Combined with block_id forms a unique constraint.';
