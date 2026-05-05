-- Migration 056: Add missing RLS policies for session_block_exercises
--
-- session_block_exercises was created in migration 007 with RLS ENABLED
-- but no SELECT, INSERT, UPDATE, or DELETE policies were ever defined.
-- PostgreSQL denies all access when RLS is enabled and no policy matches,
-- causing silent read failures (empty arrays) and explicit RLS errors on INSERT.
--
-- Impact without this migration:
--   - generateSessionFromTemplateAction fails at step 9 (INSERT into
--     session_block_exercises), returning "new row violates row-level security
--     policy". Session and blocks are created but the action returns sessionId: null.
--   - Session detail pages join session_blocks → session_block_exercises but
--     receive an empty array (RLS filters silently on SELECT).
--   - Coach session execution page cannot read or update block exercises.
--
-- This mirrors the template_block_exercises gap fixed in migration 055,
-- scoped through the session_block_exercises.block_id → session_blocks →
-- sessions → academy_id chain.
--
-- Note: PostgreSQL does not support CREATE POLICY IF NOT EXISTS.
-- These policies did not exist before this migration so CREATE POLICY is safe.

CREATE POLICY "Staff see session block exercises"
  ON session_block_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM session_blocks sb
      JOIN sessions s ON s.id = sb.session_id
      WHERE sb.id = session_block_exercises.block_id
        AND s.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );

CREATE POLICY "Staff manage session block exercises"
  ON session_block_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM session_blocks sb
      JOIN sessions s ON s.id = sb.session_id
      WHERE sb.id = session_block_exercises.block_id
        AND s.academy_id = auth_academy_id()
        AND auth_is_staff()
    )
  );
