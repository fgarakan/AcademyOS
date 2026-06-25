-- ============================================================
-- ACADEMY OS — MIGRATION 084: DONNA EXECUTIVE LEARNING
--
-- Durable, cross-session learning the Executive Context Engine retrieves before
-- every reasoning request, so DONNA reuses what she has learned about how an academy
-- operates instead of re-sending full context.
--
-- This is the persistent home for the Learning Ledger entries produced by the
-- Durable Executive Learning bridge (donnaExecutiveLearning.ts). It is NOT a second
-- memory system: donna_working_memory remains session-scoped working state; this
-- table holds long-lived academy/director learning (approved or awaiting review).
--
-- Reasoning stays model-agnostic: OpenAI only reasons over the retrieved learning;
-- it never reads or writes this table. Capture + retrieval are server-side.
--
-- Sprint: Mega Sprint 4231–4260 — Executive Learning Context Wiring V1
-- ============================================================

CREATE TABLE IF NOT EXISTS donna_executive_learning (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id         UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  -- Content (aligned with the Learning Ledger LearningEntry, compressed)
  learning_type      TEXT        NOT NULL,            -- ExecutiveLearningType
  topic_domain       TEXT        NOT NULL,            -- LearningTopicDomain
  topic              TEXT        NOT NULL,
  summary            TEXT        NOT NULL,            -- the one-line durable learning
  evidence           TEXT,
  concepts           TEXT[]      NOT NULL DEFAULT '{}',
  tags               TEXT[]      NOT NULL DEFAULT '{}',
  importance         NUMERIC     NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  confidence         NUMERIC     NOT NULL DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),

  -- Approval lifecycle (high-impact learning awaits the Director)
  status             TEXT        NOT NULL DEFAULT 'captured'
                       CHECK (status IN ('captured','reviewing','approved','rejected','promoted','archived')),
  review_required    BOOLEAN     NOT NULL DEFAULT false,
  high_impact        BOOLEAN     NOT NULL DEFAULT false,
  approved_by        TEXT,
  approved_at        TIMESTAMPTZ,

  -- Provenance + hygiene
  source_type        TEXT        NOT NULL DEFAULT 'system_observation',
  source_session_id  TEXT,
  expires_at         TIMESTAMPTZ,                     -- NULL = never expires (academy truth)

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donna_exec_learning_academy ON donna_executive_learning(academy_id);
CREATE INDEX IF NOT EXISTS idx_donna_exec_learning_status  ON donna_executive_learning(academy_id, status);
CREATE INDEX IF NOT EXISTS idx_donna_exec_learning_type    ON donna_executive_learning(academy_id, learning_type);
CREATE INDEX IF NOT EXISTS idx_donna_exec_learning_expires ON donna_executive_learning(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- RLS — academy-scoped, following the established donna_* pattern.
-- Helpers: auth_academy_id(), auth_is_director_or_head(), auth_is_staff()
-- Staff of the academy may READ learning (so role-scoped portals can reuse it);
-- only directors/head coaches may WRITE (capture / approve / prune).
-- ============================================================

ALTER TABLE donna_executive_learning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read academy executive learning"
  ON donna_executive_learning
  FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors insert academy executive learning"
  ON donna_executive_learning
  FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors update academy executive learning"
  ON donna_executive_learning
  FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Directors delete academy executive learning"
  ON donna_executive_learning
  FOR DELETE
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
