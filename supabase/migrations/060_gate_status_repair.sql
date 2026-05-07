-- ============================================================
-- ACADEMY OS — MIGRATION 060: GATE STATUS REPAIR
-- Sprint 103 Repair — Gate Status Migration Dependency Repair
--
-- Context:
--   Migration 059 partially applied on the live database.
--   The migration failed at the ALTER TABLE statement because
--   requirement_evidence_links (created by migration 041) was
--   absent from the live database.
--
--   What 059 committed before the failure:
--     ✓ CREATE TABLE player_gate_status
--     ✓ 6 indexes on player_gate_status
--     ✓ Trigger trg_player_gate_status_updated_at
--     ✓ ALTER TABLE player_gate_status ENABLE ROW LEVEL SECURITY
--     ✓ CREATE POLICY "Staff see player gate status"
--     ✓ CREATE POLICY "Staff manage player gate status"
--
--   What 059 did NOT execute (stopped at the ALTER TABLE line):
--     ✗ ALTER TABLE requirement_evidence_links ADD COLUMN gate_id
--     ✗ CREATE INDEX idx_req_evidence_gate_id
--     ✗ Bootstrap INSERT INTO player_gate_status
--
-- This migration completes only those three missing steps.
-- It does not touch player_gate_status structure or policies.
--
-- Prerequisites — apply in this exact order before this file:
--   041_requirement_domains.sql        (creates requirement_evidence_links)
--   042_requirement_domain_seed.sql    (seeds curriculum_requirement_domains)
--   043_orange_ball_starter_requirements.sql
--   044_player_requirement_progress_bootstrap.sql
--   [then this file]
--
-- Do NOT re-run 059 if player_gate_status already exists.
-- Running 059 again will fail on CREATE TABLE player_gate_status
-- (relation already exists). Use this file instead.
--
-- Idempotency:
--   ADD COLUMN IF NOT EXISTS  — safe to re-run
--   CREATE INDEX IF NOT EXISTS — safe to re-run
--   INSERT ... ON CONFLICT (player_id, gate_id) DO NOTHING — safe to re-run
--
-- No tables dropped.
-- No existing policies dropped or replaced.
-- No parent/player RLS added.
-- No automatic player level advancement.
-- No assessment behavior changed.
-- No curriculum_gates rows modified.
-- ============================================================


-- ============================================================
-- STEP 1: Add gate_id column to requirement_evidence_links
--
-- ADD COLUMN IF NOT EXISTS is idempotent — safe to re-run
-- even if this migration was previously partially applied.
--
-- gate_id is nullable: existing evidence rows have gate_id = NULL
-- (requirement-only evidence). New gate evidence rows will
-- populate gate_id when they also carry a requirement_id.
--
-- Note: requirement_id remains NOT NULL on this table (migration 041).
-- Gate-only evidence rows require a Sprint 104 design decision
-- before server actions are rewritten. See docs/gate-evidence-foundation.md.
-- ============================================================

ALTER TABLE requirement_evidence_links
  ADD COLUMN IF NOT EXISTS gate_id UUID
    REFERENCES curriculum_gates(id) ON DELETE SET NULL;


-- ============================================================
-- STEP 2: Index on requirement_evidence_links.gate_id
--
-- Partial index — only indexes rows where gate_id IS NOT NULL,
-- which avoids indexing the large set of requirement-only rows.
-- CREATE INDEX IF NOT EXISTS — idempotent.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_req_evidence_gate_id
  ON requirement_evidence_links(gate_id)
  WHERE gate_id IS NOT NULL;


-- ============================================================
-- STEP 3: Bootstrap player_gate_status rows
--
-- Seeds not_started rows for every active player who has a
-- player_curriculum_states record, covering all active outgoing
-- gates at their current level.
--
-- Identical logic to the bootstrap block in migration 059.
-- ON CONFLICT (player_id, gate_id) DO NOTHING — idempotent.
-- Safe to re-run: duplicate rows are silently skipped.
--
-- gate_criterion_snapshot is frozen at bootstrap time from
-- curriculum_gates.criterion. This preserves the historical
-- record if the global criterion is later updated.
-- ============================================================

INSERT INTO player_gate_status (
  academy_id,
  player_id,
  gate_id,
  gate_criterion_snapshot,
  status,
  evidence_count,
  is_player_visible,
  is_parent_visible
)
SELECT
  pcs.academy_id,
  pcs.player_id,
  cg.id                   AS gate_id,
  cg.criterion            AS gate_criterion_snapshot,
  'not_started'           AS status,
  0                       AS evidence_count,
  false                   AS is_player_visible,
  false                   AS is_parent_visible
FROM player_curriculum_states pcs
JOIN curriculum_gates cg
  ON cg.from_level_id = pcs.current_level_id
WHERE cg.is_active = true
ON CONFLICT (player_id, gate_id) DO NOTHING;
