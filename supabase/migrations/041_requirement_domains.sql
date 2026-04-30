-- ============================================================
-- ACADEMY OS — MIGRATION 041: REQUIREMENT DOMAIN TABLES
-- Establishes the data foundation for per-pathway (Skill /
-- Competition / Fitness) curriculum requirements and player
-- progress tracking.
--
-- Tables created:
--   curriculum_requirement_domains  — global pathway domain buckets
--   curriculum_track_requirements   — named requirements per level/domain
--   player_requirement_progress     — per-player per-requirement status
--   requirement_evidence_links      — evidence rows linked to requirements
--
-- View created:
--   v_player_requirement_progress_detail
--
-- No seed data in this migration.
-- Sprint 31 will seed the three domain rows and starter requirements.
--
-- No UI changes. No application behavior changes.
-- These tables extend (not replace) the existing curriculum spine:
--   progression_rules and v_curriculum_level_requirements remain unchanged.
-- ============================================================


-- ============================================================
-- TABLE: curriculum_requirement_domains
-- Global reference data — no academy_id.
-- Defines the three pathway domain buckets that requirements
-- are grouped under: skill, competition, fitness.
-- key values align with the existing development_track enum.
-- ============================================================

CREATE TABLE curriculum_requirement_domains (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT        NOT NULL UNIQUE CHECK (key IN ('skill', 'competition', 'fitness')),
  label         TEXT        NOT NULL,
  description   TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculum_req_domains_active
  ON curriculum_requirement_domains(is_active, display_order);

ALTER TABLE curriculum_requirement_domains ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_curriculum_req_domains_updated_at
  BEFORE UPDATE ON curriculum_requirement_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: curriculum_track_requirements
-- Named requirements per curriculum level and pathway domain.
--   academy_id IS NULL  → global default (platform-defined)
--   academy_id IS NOT NULL → academy-specific addition or override
--
-- Unique constraint note:
--   A standard UNIQUE on (academy_id, ...) cannot enforce uniqueness
--   for global rows because NULL != NULL in PostgreSQL. Partial unique
--   indexes are used instead (one for global, one for academy rows).
-- ============================================================

CREATE TABLE curriculum_track_requirements (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID        REFERENCES academies(id) ON DELETE CASCADE,
  curriculum_level_id       UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  requirement_domain_id     UUID        NOT NULL REFERENCES curriculum_requirement_domains(id) ON DELETE RESTRICT,
  title                     TEXT        NOT NULL,
  description               TEXT,
  requirement_type          TEXT        NOT NULL DEFAULT 'qualitative'
                            CHECK (requirement_type IN (
                              'qualitative', 'quantitative', 'attendance',
                              'assessment', 'evidence_count', 'coach_confirmed'
                            )),
  measurement_method        TEXT,
  target_value              NUMERIC,
  unit                      TEXT,
  pass_condition            TEXT,
  evidence_policy           TEXT        NOT NULL DEFAULT 'coach_confirmed'
                            CHECK (evidence_policy IN (
                              'coach_confirmed', 'director_confirmed', 'assessment_required',
                              'evidence_count_required', 'manual_review'
                            )),
  is_required               BOOLEAN     NOT NULL DEFAULT true,
  display_order             INTEGER     NOT NULL DEFAULT 0,
  is_parent_visible_default BOOLEAN     NOT NULL DEFAULT false,
  is_player_visible_default BOOLEAN     NOT NULL DEFAULT false,
  source_type               TEXT        NOT NULL DEFAULT 'global_default'
                            CHECK (source_type IN (
                              'global_default', 'academy_override',
                              'program_override', 'session_override'
                            )),
  source_id                 UUID,
  version                   INTEGER     NOT NULL DEFAULT 1,
  is_active                 BOOLEAN     NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique indexes: avoids NULL-equality issues on academy_id.
-- Global rows: one title per (level, domain, version) where academy_id IS NULL.
CREATE UNIQUE INDEX idx_curriculum_track_req_global_unique
  ON curriculum_track_requirements (curriculum_level_id, requirement_domain_id, title, version)
  WHERE academy_id IS NULL;

-- Academy rows: one title per (academy, level, domain, version) where academy_id IS NOT NULL.
CREATE UNIQUE INDEX idx_curriculum_track_req_academy_unique
  ON curriculum_track_requirements (academy_id, curriculum_level_id, requirement_domain_id, title, version)
  WHERE academy_id IS NOT NULL;

CREATE INDEX idx_curriculum_track_req_level    ON curriculum_track_requirements(curriculum_level_id);
CREATE INDEX idx_curriculum_track_req_domain   ON curriculum_track_requirements(requirement_domain_id);
CREATE INDEX idx_curriculum_track_req_academy  ON curriculum_track_requirements(academy_id);
CREATE INDEX idx_curriculum_track_req_active   ON curriculum_track_requirements(is_active, display_order);

ALTER TABLE curriculum_track_requirements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_curriculum_track_req_updated_at
  BEFORE UPDATE ON curriculum_track_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: player_requirement_progress
-- Per-player per-requirement progress tracking.
-- One row per (player_id, requirement_id) — enforced by UNIQUE.
-- Old level rows are preserved when a player advances;
-- new rows are created for the new level's requirements.
-- ============================================================

CREATE TABLE player_requirement_progress (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  curriculum_level_id   UUID        NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  requirement_id        UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'not_started'
                        CHECK (status IN (
                          'not_started', 'in_progress', 'evidence_needed',
                          'met', 'waived', 'blocked'
                        )),
  progress_value        NUMERIC,
  evidence_count        INTEGER     NOT NULL DEFAULT 0,
  last_evidence_at      TIMESTAMPTZ,
  coach_confirmed_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  director_confirmed_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at          TIMESTAMPTZ,
  notes                 TEXT,
  is_parent_visible     BOOLEAN     NOT NULL DEFAULT false,
  is_player_visible     BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, requirement_id)
);

CREATE INDEX idx_player_req_progress_academy  ON player_requirement_progress(academy_id);
CREATE INDEX idx_player_req_progress_player   ON player_requirement_progress(player_id);
CREATE INDEX idx_player_req_progress_level    ON player_requirement_progress(curriculum_level_id);
CREATE INDEX idx_player_req_progress_req      ON player_requirement_progress(requirement_id);
CREATE INDEX idx_player_req_progress_status   ON player_requirement_progress(status);

ALTER TABLE player_requirement_progress ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_player_req_progress_updated_at
  BEFORE UPDATE ON player_requirement_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: requirement_evidence_links
-- Polymorphic link from a piece of evidence to a requirement.
-- evidence_id points to the source row in the evidence table
-- identified by evidence_type (soft FK — not enforced at DB level;
-- application layer is responsible for referential validity).
-- Rows in this table are immutable once created (no updated_at).
-- ============================================================

CREATE TABLE requirement_evidence_links (
  id                             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                     UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                      UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  requirement_id                 UUID        NOT NULL REFERENCES curriculum_track_requirements(id) ON DELETE CASCADE,
  player_requirement_progress_id UUID        REFERENCES player_requirement_progress(id) ON DELETE SET NULL,
  evidence_type                  TEXT        NOT NULL
                                 CHECK (evidence_type IN (
                                   'coach_observation', 'assessment', 'attendance',
                                   'session_result', 'app_homework', 'match_result',
                                   'player_priority', 'manual_note'
                                 )),
  evidence_id                    UUID        NOT NULL,
  evidence_summary               TEXT,
  confidence                     NUMERIC     CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  weight                         NUMERIC     CHECK (weight IS NULL OR weight >= 0),
  created_by                     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_parent_safe                 BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_req_evidence_academy    ON requirement_evidence_links(academy_id);
CREATE INDEX idx_req_evidence_player     ON requirement_evidence_links(player_id);
CREATE INDEX idx_req_evidence_req        ON requirement_evidence_links(requirement_id);
CREATE INDEX idx_req_evidence_progress   ON requirement_evidence_links(player_requirement_progress_id);
CREATE INDEX idx_req_evidence_type       ON requirement_evidence_links(evidence_type);
CREATE INDEX idx_req_evidence_id         ON requirement_evidence_links(evidence_id);
CREATE INDEX idx_req_evidence_created_at ON requirement_evidence_links(created_at);

ALTER TABLE requirement_evidence_links ENABLE ROW LEVEL SECURITY;

-- No updated_at column or trigger — evidence links are immutable once created.


-- ============================================================
-- VIEW: v_player_requirement_progress_detail
-- Read-only join supporting future player profile requirement UI.
-- RLS is enforced on the underlying tables at query time.
-- ============================================================

CREATE VIEW v_player_requirement_progress_detail AS
SELECT
  prp.id                    AS progress_id,
  prp.academy_id,
  prp.player_id,
  prp.curriculum_level_id,
  prp.requirement_id,
  ctr.title                 AS requirement_title,
  ctr.description           AS requirement_description,
  ctr.requirement_type,
  crd.key                   AS requirement_domain_key,
  crd.label                 AS requirement_domain_label,
  cl.display_name           AS level_display_name,
  cl.level_number,
  prp.status,
  prp.progress_value,
  prp.evidence_count,
  prp.last_evidence_at,
  ctr.is_required,
  prp.is_parent_visible,
  prp.is_player_visible,
  crd.display_order         AS domain_display_order,
  ctr.display_order         AS requirement_display_order
FROM  player_requirement_progress  prp
JOIN  curriculum_track_requirements  ctr ON ctr.id  = prp.requirement_id
JOIN  curriculum_requirement_domains crd ON crd.id  = ctr.requirement_domain_id
JOIN  curriculum_levels              cl  ON cl.id   = prp.curriculum_level_id;


-- ============================================================
-- RLS POLICIES: curriculum_requirement_domains
-- Global reference table — all authenticated users can read.
-- Writes are director/head only (same pattern as curriculum_stages,
-- curriculum_levels in migration 036).
-- ============================================================

CREATE POLICY "Authenticated read requirement domains"
  ON curriculum_requirement_domains FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage requirement domains"
  ON curriculum_requirement_domains FOR ALL
  USING (auth_is_director_or_head());


-- ============================================================
-- RLS POLICIES: curriculum_track_requirements
-- Global rows (academy_id IS NULL): any authenticated user can read.
-- Academy rows (academy_id IS NOT NULL): scoped to user's academy.
-- Writes are restricted to directors/heads for their own academy rows.
-- Global rows cannot be written from app layer (no policy covers it).
-- ============================================================

CREATE POLICY "Authenticated read global and own academy requirements"
  ON curriculum_track_requirements FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      academy_id IS NULL
      OR academy_id = auth_academy_id()
    )
  );

CREATE POLICY "Directors manage academy requirements"
  ON curriculum_track_requirements FOR ALL
  USING (
    academy_id IS NOT NULL
    AND academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );


-- ============================================================
-- RLS POLICIES: player_requirement_progress
-- Academy staff can read and manage within their academy.
-- Player and parent access deferred to Sprint 32+.
-- ============================================================

CREATE POLICY "Staff see player requirement progress"
  ON player_requirement_progress FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage player requirement progress"
  ON player_requirement_progress FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());


-- ============================================================
-- RLS POLICIES: requirement_evidence_links
-- Academy staff can read and manage within their academy.
-- Player and parent access deferred to Sprint 32+.
-- ============================================================

CREATE POLICY "Staff see requirement evidence links"
  ON requirement_evidence_links FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage requirement evidence links"
  ON requirement_evidence_links FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());
