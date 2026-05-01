-- ============================================================
-- ACADEMY OS — MIGRATION 048: ACADEMY CURRICULUM CLONE
-- Creates tables for academy-specific curriculum versioning
-- and structured override tracking.
--
-- Tables created:
--   academy_curriculum_versions   — per-academy curriculum version pointer
--   academy_curriculum_overrides  — structured override records
--
-- Sprint: 62 — Academy Curriculum Clone Schema V1
-- ============================================================


-- ============================================================
-- TABLE: academy_curriculum_versions
-- One active version per academy. Lightweight reference to
-- global curriculum (no physical row duplication).
-- ============================================================

CREATE TABLE IF NOT EXISTS academy_curriculum_versions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  base_curriculum_version_id UUID     NULL,
  name                    TEXT        NOT NULL,
  description             TEXT,
  status                  TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'active', 'archived')),
  version_number          INTEGER     NOT NULL DEFAULT 1,
  cloned_from_global_at   TIMESTAMPTZ,
  activated_at            TIMESTAMPTZ,
  created_by              UUID        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acv_academy_id
  ON academy_curriculum_versions(academy_id);

CREATE INDEX IF NOT EXISTS idx_acv_status
  ON academy_curriculum_versions(academy_id, status);


-- ============================================================
-- TABLE: academy_curriculum_overrides
-- Structured deltas from the global curriculum for a given
-- academy version. Each row is one intentional customization.
-- ============================================================

CREATE TABLE IF NOT EXISTS academy_curriculum_overrides (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  curriculum_version_id   UUID        NOT NULL REFERENCES academy_curriculum_versions(id) ON DELETE CASCADE,
  target_type             TEXT        NOT NULL
                          CHECK (target_type IN (
                            'level', 'requirement', 'content_item', 'mapping', 'template_rule'
                          )),
  target_id               UUID,
  override_type           TEXT        NOT NULL
                          CHECK (override_type IN (
                            'add', 'update', 'remove', 'replace', 'emphasis_shift'
                          )),
  scope                   TEXT        NOT NULL DEFAULT 'academy'
                          CHECK (scope IN ('academy', 'level', 'group', 'program', 'session')),
  pathway                 TEXT
                          CHECK (pathway IS NULL OR pathway IN (
                            'skill', 'competition', 'fitness', 'mixed'
                          )),
  original_snapshot       JSONB,
  proposed_change         JSONB       NOT NULL DEFAULT '{}',
  applied_change          JSONB,
  override_reason         TEXT,
  source                  TEXT        NOT NULL DEFAULT 'voice'
                          CHECK (source IN ('voice', 'typed', 'ui')),
  raw_input               TEXT,
  status                  TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN (
                            'draft', 'pending_review', 'approved', 'applied',
                            'rejected', 'rolled_back'
                          )),
  created_by              UUID        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_by             UUID        REFERENCES profiles(id),
  approved_at             TIMESTAMPTZ,
  applied_by              UUID        REFERENCES profiles(id),
  applied_at              TIMESTAMPTZ,
  rollback_of_override_id UUID        REFERENCES academy_curriculum_overrides(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aco_academy_id
  ON academy_curriculum_overrides(academy_id);

CREATE INDEX IF NOT EXISTS idx_aco_curriculum_version_id
  ON academy_curriculum_overrides(curriculum_version_id);

CREATE INDEX IF NOT EXISTS idx_aco_target_type
  ON academy_curriculum_overrides(academy_id, target_type);

CREATE INDEX IF NOT EXISTS idx_aco_target_id
  ON academy_curriculum_overrides(target_id)
  WHERE target_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aco_status
  ON academy_curriculum_overrides(academy_id, status);

CREATE INDEX IF NOT EXISTS idx_aco_created_at
  ON academy_curriculum_overrides(academy_id, created_at DESC);


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER trg_academy_curriculum_versions_updated_at
  BEFORE UPDATE ON academy_curriculum_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_academy_curriculum_overrides_updated_at
  BEFORE UPDATE ON academy_curriculum_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE academy_curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_curriculum_overrides ENABLE ROW LEVEL SECURITY;

-- academy_curriculum_versions: staff in same academy can read; director/head_coach can insert/update

CREATE POLICY "Academy staff read curriculum versions"
  ON academy_curriculum_versions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage curriculum versions"
  ON academy_curriculum_versions FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- academy_curriculum_overrides: staff read; director/head_coach insert/update

CREATE POLICY "Academy staff read curriculum overrides"
  ON academy_curriculum_overrides FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage curriculum overrides"
  ON academy_curriculum_overrides FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
