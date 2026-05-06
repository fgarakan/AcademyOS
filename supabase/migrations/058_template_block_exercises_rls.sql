-- Migration 058: Idempotent RLS policies for template_block_exercises
--
-- Context:
--   template_block_exercises was created in migration 006 with
--   ALTER TABLE template_block_exercises ENABLE ROW LEVEL SECURITY
--   but no policies were defined. PostgreSQL denies all access when RLS
--   is active and no policy matches, causing the director's "Populate Blocks
--   with Exercises" action to fail with:
--   "new row violates row-level security policy for table template_block_exercises"
--
--   Migration 055 wrote the correct policies but was never applied to the live
--   database before migrations 056–057 were committed. Migration 058 supersedes
--   055 with DROP POLICY IF EXISTS guards so it can be applied safely regardless
--   of the current policy state on the live instance.
--
-- Access scope:
--   template_block_exercises.block_id
--     → template_blocks.id (must exist in auth user's academy)
--     → template_blocks.template_id → templates.id
--     → templates.academy_id = auth_academy_id()
--   AND auth_is_staff()
--
-- To apply manually:
--   Supabase → SQL Editor → paste this file → Run

-- ─────────────────────────────────────────────────────────────
-- Clean up any policies from migration 055 or prior attempts
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff see template block exercises"    ON template_block_exercises;
DROP POLICY IF EXISTS "Staff manage template block exercises" ON template_block_exercises;

-- In case 058 was partially applied before:
DROP POLICY IF EXISTS "Staff insert template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff update template block exercises" ON template_block_exercises;
DROP POLICY IF EXISTS "Staff delete template block exercises" ON template_block_exercises;

-- ─────────────────────────────────────────────────────────────
-- Ensure RLS is active (safe to repeat)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE template_block_exercises ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- Helper subquery (inlined — no function call overhead)
-- ─────────────────────────────────────────────────────────────

-- SELECT: staff in same academy can read exercises within their templates
CREATE POLICY "Staff see template block exercises"
  ON template_block_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

-- INSERT: staff may add exercises only to blocks in their own academy's templates
CREATE POLICY "Staff insert template block exercises"
  ON template_block_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

-- UPDATE: staff may edit exercises in their own academy's templates
CREATE POLICY "Staff update template block exercises"
  ON template_block_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

-- DELETE: staff may remove exercises from their own academy's template blocks
CREATE POLICY "Staff delete template block exercises"
  ON template_block_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM template_blocks tb
      JOIN templates t ON t.id = tb.template_id
      WHERE tb.id = template_block_exercises.block_id
        AND t.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );
