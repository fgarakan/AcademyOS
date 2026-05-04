-- Migration 055: Add missing RLS policies for template_block_exercises
--
-- template_block_exercises was created in migration 006 with RLS ENABLED
-- but no SELECT, INSERT, UPDATE, or DELETE policies were ever defined.
-- PostgreSQL denies all access when RLS is enabled and no policy matches,
-- causing silent read/write failures for authenticated academy staff.
--
-- This migration adds the equivalent policies that already exist for
-- template_blocks, scoped to the user's academy via the block→template chain.

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

CREATE POLICY "Staff manage template block exercises"
  ON template_block_exercises FOR ALL
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
