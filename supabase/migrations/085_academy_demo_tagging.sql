-- ============================================================
-- ACADEMY OS — MIGRATION 085: ACADEMY DEMO TAGGING
--
-- Adds demo-data tagging to the academies table ONLY. The demo harness isolates an
-- entire demo academy under one row; every child record references academy_id with
-- ON DELETE CASCADE, so deleting the tagged academy removes the whole demo dataset and
-- can never touch a real academy's data. Tagging the parent row (not every table) keeps
-- this a one-column, zero-risk change instead of a schema-wide migration.
--
-- Reset is gated on BOTH columns: is_demo_data = true AND seed_batch_id = '<batch>'.
--
-- Sprint: Mega Sprint 4291–4320 — Demo Academy God Mode Test Harness V1
-- ============================================================

ALTER TABLE academies
  ADD COLUMN IF NOT EXISTS is_demo_data  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_batch_id TEXT;

-- Fast, safe lookup for seed/reset; partial index keeps it tiny (demo rows only).
CREATE INDEX IF NOT EXISTS idx_academies_demo_batch
  ON academies(seed_batch_id)
  WHERE is_demo_data = true;

COMMENT ON COLUMN academies.is_demo_data  IS 'True only for harness-seeded demo academies. Reset deletes ONLY these.';
COMMENT ON COLUMN academies.seed_batch_id IS 'Seed pack identifier, e.g. demo_academy_godmode_v1. Scopes reset.';
