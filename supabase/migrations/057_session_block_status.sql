-- Migration 057: Add actual_status column to session_blocks
--
-- PROPOSAL ONLY — not applied to live database.
-- See docs/session-block-status-persistence-plan.md for full context.
--
-- Purpose:
--   Coach block execution state (planned/in_progress/completed/skipped/modified)
--   currently lives only in React state and localStorage. This migration adds
--   a persistent status column so block progress survives navigation and
--   can be read by the Wrap-Up drawer and director session views.
--
-- RLS impact:
--   No new policies needed. Existing session_blocks RLS (migration 007) grants
--   staff SELECT and ALL via the session_id → sessions.academy_id chain.
--   The actual_status column is covered by those existing policies.
--
-- updated_at impact:
--   tr_session_blocks_updated_at trigger (migration 007) fires on UPDATE,
--   so actual_status changes will auto-update updated_at.
--
-- Rollback:
--   ALTER TABLE session_blocks DROP COLUMN actual_status;

ALTER TABLE session_blocks
  ADD COLUMN actual_status TEXT NOT NULL DEFAULT 'planned'
  CHECK (actual_status IN ('planned', 'in_progress', 'completed', 'skipped', 'modified'));

COMMENT ON COLUMN session_blocks.actual_status IS
  'Coach-recorded execution status for this block during a live session. '
  'planned = not yet started, in_progress = active, completed = done, '
  'skipped = intentionally skipped, modified = ran with changes.';
