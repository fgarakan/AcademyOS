-- ============================================================
-- ACADEMY OS — MIGRATION 080: DONNA PLACEMENT RECOMMENDATIONS
--
-- Stores DONNA's structured post-assessment placement recommendation
-- and the director's final decision (accept / override / trial / defer).
--
-- Architecture:
--   completeAssessmentEventAction()
--     → donnaPlacementRecommendationAction()
--         → donna_placement_recommendations INSERT (pending_director_review)
--         → proposed_actions INSERT (pending_review) → review queue
--
--   Director reviews in queue:
--     → placementDecisionAction(accept | override | trial | defer)
--         → donna_placement_recommendations UPDATE
--         → audit_logs WRITE (always, especially for overrides)
--
-- No placement is official until director approves.
-- Override requires a typed reason (audit logged separately).
--
-- Sprint: DONNA Post-Assessment Placement Recommendation Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS donna_placement_recommendations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID        NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assessment_id         UUID        REFERENCES assessments(id),

  -- ── Input snapshot (at time of recommendation) ────────────────────────────
  -- Scores captured from the triggering assessment
  input_technical_score     NUMERIC(4,2),
  input_tactical_score      NUMERIC(4,2),
  input_movement_score      NUMERIC(4,2),
  input_competition_score   NUMERIC(4,2),
  input_behavioral_score    NUMERIC(4,2),
  input_overall_avg         NUMERIC(4,2),   -- computed from the 5 scores

  -- Player context at recommendation time
  input_player_age_years    INTEGER,
  input_current_level_id    UUID,
  input_current_level_name  TEXT,
  input_current_stage       TEXT,
  input_gates_met           INTEGER,
  input_gates_total         INTEGER,

  -- ── DONNA recommendation output ───────────────────────────────────────────
  recommended_stage         TEXT,     -- curriculum_stage key
  recommended_level_id      UUID,     -- curriculum_levels.id (null if not found)
  recommended_level_name    TEXT,
  recommended_group_id      UUID,     -- groups.id (null if not matched)
  recommended_group_name    TEXT,

  -- Confidence (0–100)
  confidence_score          INTEGER   NOT NULL DEFAULT 0
                            CHECK (confidence_score BETWEEN 0 AND 100),
  -- 'high' ≥ 80, 'medium' 60–79, 'low' < 60
  confidence_tier           TEXT      NOT NULL DEFAULT 'low'
                            CHECK (confidence_tier IN ('high', 'medium', 'low')),

  -- Supporting data (arrays and JSONB)
  top_reasons               TEXT[]    NOT NULL DEFAULT '{}',
  limiting_factors          TEXT[]    NOT NULL DEFAULT '{}',
  risk_notes                TEXT[]    NOT NULL DEFAULT '{}',

  -- Alternative placements JSONB array:
  -- [{ stage, levelName, levelId, groupName, groupId, rationale, trialRecommended }]
  alternative_placements    JSONB     NOT NULL DEFAULT '[]',

  -- DONNA's full explanation text (for director review and DONNA answers)
  donna_explanation         TEXT,

  -- Evidence sources used
  evidence_used             TEXT[]    NOT NULL DEFAULT '{}',

  -- What to check after 4–6 weeks
  check_after_4_to_6_weeks  TEXT[]    NOT NULL DEFAULT '{}',

  -- Reassessment timing
  recommended_reassessment_weeks  INTEGER,

  -- Back-link to the proposed_action created for the review queue
  proposed_action_id        UUID,

  -- ── Director decision ─────────────────────────────────────────────────────
  -- 'accepted'  — director accepted DONNA recommendation
  -- 'overridden' — director chose different level/group (requires override_reason)
  -- 'trial'     — director chose a trial placement (different from DONNA rec)
  -- 'deferred'  — director deferred the decision
  decision                  TEXT
                            CHECK (decision IN ('accepted', 'overridden', 'trial', 'deferred')),
  decided_by                UUID        REFERENCES profiles(id),
  decided_at                TIMESTAMPTZ,

  -- Override / trial details (required when decision = 'overridden' or 'trial')
  override_reason           TEXT
                            CHECK (override_reason IN (
                              'athletic_upside',
                              'maturity',
                              'competitive_toughness',
                              'coach_observation',
                              'family_schedule',
                              'sibling_placement',
                              'group_availability',
                              'social_fit',
                              'trial_placement',
                              'director_judgment',
                              'other'
                            )),
  director_note             TEXT,

  -- Final placement chosen by director (may differ from recommendation)
  final_level_id            UUID,
  final_level_name          TEXT,
  final_group_id            UUID,
  final_group_name          TEXT,

  -- ── Outcome tracking ──────────────────────────────────────────────────────
  -- Linked to the next assessment after the review period
  outcome_assessment_id     UUID        REFERENCES assessments(id),
  outcome_notes             TEXT,
  outcome_recorded_at       TIMESTAMPTZ,

  -- ── Status lifecycle ──────────────────────────────────────────────────────
  -- pending_director_review → accepted | overridden | trial | deferred | outcome_recorded
  status                    TEXT        NOT NULL DEFAULT 'pending_director_review'
                            CHECK (status IN (
                              'pending_director_review',
                              'accepted',
                              'overridden',
                              'trial',
                              'deferred',
                              'outcome_recorded'
                            )),

  -- ── Metadata ──────────────────────────────────────────────────────────────
  generated_by              UUID        REFERENCES profiles(id),
  generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dpr_player_status
  ON donna_placement_recommendations(player_id, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dpr_academy_pending
  ON donna_placement_recommendations(academy_id, status)
  WHERE status = 'pending_director_review';

CREATE INDEX IF NOT EXISTS idx_dpr_assessment
  ON donna_placement_recommendations(assessment_id)
  WHERE assessment_id IS NOT NULL;

CREATE TRIGGER tr_donna_placement_recommendations_updated_at
  BEFORE UPDATE ON donna_placement_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE donna_placement_recommendations ENABLE ROW LEVEL SECURITY;

-- Directors and head coaches see all recommendations in their academy
CREATE POLICY "Directors see all DONNA placement recommendations"
  ON donna_placement_recommendations FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Directors and head coaches can create recommendations
CREATE POLICY "Directors create DONNA placement recommendations"
  ON donna_placement_recommendations FOR INSERT
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

-- Directors and head coaches can update (decision, outcome)
CREATE POLICY "Directors update DONNA placement recommendations"
  ON donna_placement_recommendations FOR UPDATE
  USING (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  )
  WITH CHECK (
    academy_id = auth_academy_id()
    AND auth_is_director_or_head()
  );

COMMENT ON TABLE donna_placement_recommendations IS
  'DONNA post-assessment placement recommendations. '
  'Generated automatically after assessment completion. '
  'Director has final authority on all placements — no placement is official '
  'until director accepts or overrides. Override requires a typed reason (audit logged).';

COMMENT ON COLUMN donna_placement_recommendations.confidence_score IS
  '0–100. ≥80 = high (all signals align), 60–79 = medium, <60 = low (partial data or conflicting signals).';

COMMENT ON COLUMN donna_placement_recommendations.alternative_placements IS
  'JSONB array of alternative placement options. '
  'Each element: { stage, levelName, levelId, groupName, groupId, rationale, trialRecommended }.';

COMMENT ON COLUMN donna_placement_recommendations.override_reason IS
  'Required when decision = overridden or trial. '
  'Typed enum matching the director override reason options presented in the UI.';
