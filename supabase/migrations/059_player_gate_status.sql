-- ============================================================
-- ACADEMY OS — MIGRATION 059: PLAYER GATE STATUS FOUNDATION
-- Sprint 103 — Gate Evidence Foundation Schema
--
-- Creates the per-player per-gate progress tracking table and
-- extends requirement_evidence_links with a nullable gate_id
-- so future evidence rows can be linked to specific gates.
--
-- Tables created:
--   player_gate_status            — one row per (player, gate)
--
-- Columns added (ADD COLUMN IF NOT EXISTS):
--   requirement_evidence_links.gate_id  — nullable FK to curriculum_gates
--
-- Bootstrap:
--   Inserts not_started rows into player_gate_status for every
--   active player who has a current_level_id set in
--   player_curriculum_states, covering all active outgoing gates
--   (where curriculum_gates.from_level_id = current_level_id).
--
-- Dependencies:
--   curriculum_gates              — created in migration 052
--   player_curriculum_states      — created in migration 036
--   requirement_evidence_links    — created in migration 041
--   update_updated_at_column()    — defined in migration 036
--   auth_academy_id()             — defined in migration 003
--   auth_is_staff()               — defined in migration 003
--   auth_is_director_or_head()    — defined in migration 003
--
-- No existing tables dropped or modified destructively.
-- No existing policies removed.
-- Idempotent bootstrap via ON CONFLICT DO NOTHING.
-- ============================================================


-- ============================================================
-- TABLE: player_gate_status
--
-- One row per (player, gate). Tracks the player's evidence
-- collection and confirmation state for a specific gate criterion.
--
-- gate_criterion_snapshot stores the gate criterion text at the
-- time the row is first created. This freezes the historical
-- record: if the global curriculum_gates.criterion is later
-- updated or the director overrides it for their academy, past
-- gate status rows remain accurate to what was in effect when
-- evidence was collected.
--
-- status lifecycle:
--   not_started          → no evidence has been submitted
--   observing            → at least one piece of evidence submitted,
--                          threshold not yet reached
--   evidence_threshold_met → evidence_count has reached the gate
--                          threshold; awaiting director confirmation
--   confirmed            → director/head has confirmed gate met;
--                          this is a prerequisite for level advancement
--   waived               → director has explicitly waived this gate
--                          (e.g. player demonstrated in prior level,
--                          injury accommodation, etc.)
--   blocked              → gate cannot be progressed (injury, suspension,
--                          or another gate is a prerequisite)
--
-- No automatic status transitions occur in this migration.
-- Status transitions are controlled by server actions (Sprint 104+).
-- ============================================================

CREATE TABLE player_gate_status (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id               UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  gate_id                  UUID        NOT NULL REFERENCES curriculum_gates(id) ON DELETE CASCADE,

  -- Snapshot of gate criterion at time of row creation.
  -- Preserved even if the global gate criterion changes later.
  gate_criterion_snapshot  TEXT        NOT NULL,

  status                   TEXT        NOT NULL DEFAULT 'not_started'
                           CHECK (status IN (
                             'not_started',
                             'observing',
                             'evidence_threshold_met',
                             'confirmed',
                             'waived',
                             'blocked'
                           )),

  evidence_count           INTEGER     NOT NULL DEFAULT 0,
  last_evidence_at         TIMESTAMPTZ,

  -- Confirmation: set by director or head coach only (Sprint 107+)
  confirmed_by             UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at             TIMESTAMPTZ,

  -- Waiver: explicit director decision to skip this gate
  waived_by                UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  waived_at                TIMESTAMPTZ,
  waiver_reason            TEXT,

  notes                    TEXT,

  -- Visibility flags: false until explicitly enabled by director.
  -- Players and parents do not see gate status in V1.
  -- Sprint 111+ will enable player-safe gate summary views.
  is_player_visible        BOOLEAN     NOT NULL DEFAULT false,
  is_parent_visible        BOOLEAN     NOT NULL DEFAULT false,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One status row per player per gate — enforced at DB level.
  UNIQUE (player_id, gate_id)
);


-- ============================================================
-- INDEXES: player_gate_status
-- ============================================================

CREATE INDEX idx_player_gate_status_academy
  ON player_gate_status(academy_id);

CREATE INDEX idx_player_gate_status_player
  ON player_gate_status(player_id);

CREATE INDEX idx_player_gate_status_gate
  ON player_gate_status(gate_id);

CREATE INDEX idx_player_gate_status_status
  ON player_gate_status(status);

CREATE INDEX idx_player_gate_status_academy_player
  ON player_gate_status(academy_id, player_id);

CREATE INDEX idx_player_gate_status_academy_player_status
  ON player_gate_status(academy_id, player_id, status);


-- ============================================================
-- TRIGGER: updated_at
-- Uses update_updated_at_column() defined in migration 036.
-- ============================================================

CREATE TRIGGER trg_player_gate_status_updated_at
  BEFORE UPDATE ON player_gate_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- RLS: player_gate_status
-- Follows the same pattern as player_requirement_progress
-- (migration 041): staff see + staff manage.
-- Directors/heads are a subset of staff and receive full access
-- through the manage policy.
-- Player/parent access is deferred to Sprint 111+.
-- ============================================================

ALTER TABLE player_gate_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see player gate status"
  ON player_gate_status FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage player gate status"
  ON player_gate_status FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());


-- ============================================================
-- EXTEND: requirement_evidence_links
-- Add nullable gate_id column to allow evidence rows to be
-- tagged with the curriculum gate they support.
--
-- Existing rows have gate_id = NULL (requirement-only evidence).
-- New gate evidence rows will set gate_id to the target gate.
--
-- Note: requirement_id remains NOT NULL on this table (migration 041).
-- Gate-only evidence rows (no matching track requirement) require
-- a solution to be determined in Sprint 104 before server actions
-- are rewritten. For now, gate_id is additive — it does not break
-- any existing evidence storage paths.
--
-- ADD COLUMN IF NOT EXISTS — idempotent, safe to re-run.
-- ============================================================

ALTER TABLE requirement_evidence_links
  ADD COLUMN IF NOT EXISTS gate_id UUID
    REFERENCES curriculum_gates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_req_evidence_gate_id
  ON requirement_evidence_links(gate_id)
  WHERE gate_id IS NOT NULL;


-- ============================================================
-- BOOTSTRAP: player_gate_status for existing active players
--
-- For each player who has an active curriculum state record
-- (player_curriculum_states), insert not_started gate status
-- rows for all active outgoing gates from their current level.
--
-- Gate selection:
--   curriculum_gates.from_level_id = player_curriculum_states.current_level_id
--   curriculum_gates.is_active = true
--
-- gate_criterion_snapshot is set from curriculum_gates.criterion
-- at bootstrap time. This is the correct historical freeze point.
--
-- Idempotent: ON CONFLICT (player_id, gate_id) DO NOTHING
-- Safe to re-run if migration is partially applied.
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
