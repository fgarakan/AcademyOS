-- ============================================================
-- ACADEMY OS — MIGRATION 072: DONNA RECOMMENDATION FEEDBACK
-- Tracks DONNA recommendations and whether directors act on them.
-- Enables quality feedback loop without automated learning model.
--
-- Design:
--   - donna_recommendations: one row per recommendation surfaced to director
--   - donna_recommendation_feedback: director's response (accepted/rejected/etc.)
--   - No sensitive parent/player raw text in feedback fields
--   - All academy-scoped via RLS
--   - No automated learning — feedback is for human review/analysis only
--
-- Sprint: 914.11 — DONNA Recommendation Feedback Loop V1
-- ============================================================

-- ── donna_recommendations ─────────────────────────────────────────────────────
-- Records each recommendation DONNA surfaces (from director brief, review queue, etc.)

CREATE TABLE donna_recommendations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id           UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id           UUID REFERENCES donna_conversation_sessions(id) ON DELETE SET NULL,
  event_id             UUID REFERENCES donna_events(id) ON DELETE SET NULL,

  -- What signal drove this recommendation
  source_signal        TEXT NOT NULL,  -- e.g. 'missing_wrap_ups', 'pending_reviews', 'high_risk_player'
  recommendation_type  TEXT NOT NULL,  -- e.g. 'operating_priority', 'review_queue', 'onboarding_guide'
  recommendation_text  TEXT NOT NULL,  -- The safe text surfaced to director (no raw notes/IDs)
  confidence           TEXT CHECK (confidence IN ('high', 'medium', 'low', 'partial')),

  -- Lifecycle
  status               TEXT NOT NULL DEFAULT 'surfaced'
                       CHECK (status IN ('surfaced', 'acted_on', 'dismissed', 'expired')),

  created_by           UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donna_recs_academy   ON donna_recommendations(academy_id, created_at DESC);
CREATE INDEX idx_donna_recs_session   ON donna_recommendations(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_donna_recs_type      ON donna_recommendations(recommendation_type, created_at DESC);
CREATE INDEX idx_donna_recs_signal    ON donna_recommendations(source_signal);

CREATE TRIGGER tr_donna_recommendations_updated_at
  BEFORE UPDATE ON donna_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── donna_recommendation_feedback ─────────────────────────────────────────────
-- Director's response to a recommendation — one-to-one with donna_recommendations.

CREATE TABLE donna_recommendation_feedback (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id    UUID NOT NULL REFERENCES donna_recommendations(id) ON DELETE CASCADE,
  academy_id           UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id           UUID REFERENCES donna_conversation_sessions(id) ON DELETE SET NULL,

  -- Feedback outcome
  feedback_status      TEXT NOT NULL
                       CHECK (feedback_status IN ('accepted', 'rejected', 'modified', 'ignored', 'deferred')),
  feedback_reason      TEXT,           -- Optional director note — no raw PII
  modified_text        TEXT,           -- If director changed the recommendation text

  -- Link to the action that resulted (if any)
  final_action_event_id UUID REFERENCES donna_events(id) ON DELETE SET NULL,

  recorded_by          UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donna_rec_feedback_rec   ON donna_recommendation_feedback(recommendation_id);
CREATE INDEX idx_donna_rec_feedback_acad  ON donna_recommendation_feedback(academy_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE donna_recommendations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE donna_recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- donna_recommendations
CREATE POLICY "Staff insert donna recommendations"
  ON donna_recommendations FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors see all donna recommendations"
  ON donna_recommendations FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see own donna recommendations"
  ON donna_recommendations FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Staff update own donna recommendations"
  ON donna_recommendations FOR UPDATE
  USING (created_by = auth.uid() AND academy_id = auth_academy_id());

-- donna_recommendation_feedback
CREATE POLICY "Staff insert feedback"
  ON donna_recommendation_feedback FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors see all feedback"
  ON donna_recommendation_feedback FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see own feedback"
  ON donna_recommendation_feedback FOR SELECT
  USING (recorded_by = auth.uid());
