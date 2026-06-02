-- ============================================================
-- ACADEMY OS — MIGRATION 079: ASSESSMENT EVENTS
--
-- Wraps the existing assessments table with a workflow state machine.
-- An assessment_event tracks the full lifecycle:
--   draft → scheduled → in_progress → completed → reviewed → archived
--
-- This enables:
--   - Scheduled reassessments with pre-loaded blueprint context
--   - Director/coach/DONNA-requested assessment triggers
--   - Comparison between old and new assessment on completion
--   - Blueprint update recommendation after review
--
-- Relationship to assessments table:
--   When completed, assessment_event.assessment_id links to the
--   actual scored assessments row that was created.
--
-- Sprint: Mega Sprint 1113-1120 — Player Development Center
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id           UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Assessment configuration
  assessment_type     TEXT        NOT NULL DEFAULT 'monthly_development_check'
                      CHECK (assessment_type IN (
                        'onboarding_placement',
                        'monthly_development_check',
                        'quarterly_progress_review',
                        'level_readiness_review',
                        'competition_readiness_review',
                        'fitness_review',
                        'mental_performance_review',
                        'director_requested',
                        'coach_requested',
                        'donna_recommended'
                      )),

  -- Assessment depth
  assessment_mode     TEXT        NOT NULL DEFAULT 'standard'
                      CHECK (assessment_mode IN ('quick', 'standard', 'deep')),

  -- Trigger context
  trigger_source      TEXT        NOT NULL DEFAULT 'director'
                      CHECK (trigger_source IN ('director', 'coach', 'donna', 'system', 'parent_request')),

  requested_by        UUID        REFERENCES profiles(id),
  assessor_id         UUID        REFERENCES profiles(id),

  -- Timeline
  scheduled_for       DATE,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID        REFERENCES profiles(id),

  -- Status lifecycle
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'reviewed', 'archived')),

  -- Link to scored assessment (set when completed)
  assessment_id       UUID        REFERENCES assessments(id),

  -- Comparison context — links to the previous assessment for comparison
  previous_assessment_id  UUID    REFERENCES assessments(id),
  previous_blueprint_id   UUID,   -- player_development_blueprints.id (no FK — not in types)

  -- Notes
  notes               TEXT,
  review_notes        TEXT,

  -- Blueprint update recommendation generated on review
  -- 'keep' | 'update_priorities' | 'archive_and_regenerate' | 'trigger_level_review' | 'no_change'
  blueprint_recommendation    TEXT,
  blueprint_update_applied_at TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_player_status
  ON assessment_events(player_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ae_academy_status
  ON assessment_events(academy_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ae_scheduled
  ON assessment_events(academy_id, scheduled_for)
  WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

CREATE TRIGGER tr_assessment_events_updated_at
  BEFORE UPDATE ON assessment_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE assessment_events ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches see all assessment events in their academy
CREATE POLICY "Directors see all assessment events"
  ON assessment_events FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches see events they are the assessor for
CREATE POLICY "Coaches see own assessment events"
  ON assessment_events FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND assessor_id = auth.uid()
  );

-- Directors and head coaches can create assessment events
CREATE POLICY "Directors create assessment events"
  ON assessment_events FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Directors and head coaches can update assessment events
CREATE POLICY "Directors update assessment events"
  ON assessment_events FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Coaches can update events they are the assessor for (in_progress → completed)
CREATE POLICY "Coaches update own assessment events"
  ON assessment_events FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_staff()
    AND assessor_id = auth.uid()
    AND status IN ('in_progress')
  );

COMMENT ON TABLE assessment_events IS
  'Assessment event workflow table. Wraps assessments with scheduling, '
  'trigger tracking, comparison context, and blueprint update recommendations. '
  'assessment_id is populated when status transitions to completed.';

COMMENT ON COLUMN assessment_events.assessment_type IS
  'Classification of why this assessment was requested.';

COMMENT ON COLUMN assessment_events.assessment_mode IS
  'Depth: quick (10 min), standard (20-30 min), deep (45-60 min full evaluation).';

COMMENT ON COLUMN assessment_events.blueprint_recommendation IS
  'Recommendation generated by blueprintUpdateRecommendationEngine after comparison.';
