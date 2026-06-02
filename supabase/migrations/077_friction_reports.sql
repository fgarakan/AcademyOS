-- ============================================================
-- ACADEMY OS — MIGRATION 077: FRICTION REPORTS
--
-- Lightweight UX friction capture for the V1 pilot and beyond.
-- Any authenticated academy member can submit a friction report.
-- Directors and head coaches can view all reports and resolve them.
-- Sprint: Mega Sprint 1101-1110 — Atomic Loops 10/10 Certification
-- ============================================================

CREATE TABLE IF NOT EXISTS friction_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  reporter_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_role    TEXT        NOT NULL,

  -- Location
  page_path        TEXT        NOT NULL,

  -- Friction classification
  friction_type    TEXT        NOT NULL
                   CHECK (friction_type IN (
                     'unclear_next_step', 'too_many_clicks', 'confusing_label',
                     'wrong_data', 'missing_action', 'donna_misunderstood',
                     'permission_blocked_unexpectedly', 'parent_player_language_unclear',
                     'mobile_issue', 'other'
                   )),
  severity         TEXT        NOT NULL DEFAULT 'medium'
                   CHECK (severity IN ('low', 'medium', 'high', 'blocker')),

  -- Content
  comment          TEXT,
  donna_context    TEXT,

  -- Status
  status           TEXT        NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'acknowledged', 'fixed', 'wont_fix', 'duplicate')),

  resolution_note  TEXT,
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID        REFERENCES profiles(id),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friction_academy
  ON friction_reports(academy_id, status);

CREATE INDEX IF NOT EXISTS idx_friction_reporter
  ON friction_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_friction_type
  ON friction_reports(friction_type);

CREATE INDEX IF NOT EXISTS idx_friction_severity
  ON friction_reports(severity, created_at DESC)
  WHERE status = 'open';

CREATE TRIGGER tr_friction_reports_updated_at
  BEFORE UPDATE ON friction_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE friction_reports ENABLE ROW LEVEL SECURITY;

-- Any active academy member can insert their own report
CREATE POLICY "Staff insert own friction reports"
  ON friction_reports FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND reporter_id = auth.uid()
    AND auth_is_staff()
  );

-- Directors and head coaches see all reports for their academy
CREATE POLICY "Directors see all friction reports"
  ON friction_reports FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Users can see their own reports
CREATE POLICY "Users see own friction reports"
  ON friction_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Directors and head coaches can update (resolve) reports
CREATE POLICY "Directors manage friction reports"
  ON friction_reports FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

COMMENT ON TABLE friction_reports IS
  'UX friction reports from any authenticated academy member. '
  'Used during the V1 pilot to capture real-user friction and guide sprint priorities. '
  'Directors resolve reports via the friction review queue.';
