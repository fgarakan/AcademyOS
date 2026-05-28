-- ============================================================
-- ACADEMY OS — MIGRATION 026: RECOMMENDATION EXPLANATION LAYER
-- recommendation_reasoning: stored, queryable reasoning chain
-- for every player_recommendation the engine generates.
--
-- Loop integration:
--   ← decision_scores (019) — scoring inputs captured
--   ← signal_priority_weights (019) — weights applied captured
--   ← player_constraints (019) — constraints captured
--   ← player_phase_states (017) — phase context captured
--   ← player_load_aggregation (018) — load context captured
--   ↔ player_recommendations (021) — 1:1 with each recommendation
--   → UI — explanation_text renders in review queue
--   → learning system (022) — reasoning stored alongside override record
--
-- Purpose: directors must be able to see WHY the engine recommended
-- something before approving or overriding. Black-box decisions
-- erode trust and reduce approval rates.
-- ============================================================

CREATE TABLE recommendation_reasoning (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  recommendation_id     UUID NOT NULL REFERENCES player_recommendations(id) ON DELETE CASCADE UNIQUE,
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Signal evidence
  source_signal_ids     UUID[] NOT NULL DEFAULT '{}',
  signal_summary        JSONB NOT NULL DEFAULT '[]',
  -- Array of: {"signal_id": "...", "type": "utr_regression", "severity": "high",
  --             "confidence": 0.95, "weight_applied": 1.60, "weighted_score": 14.8,
  --             "title": "UTR regression: -0.2"}

  -- Scoring breakdown
  weights_applied       JSONB NOT NULL DEFAULT '{}',
  -- {"utr_regression": 1.60, "reassessment_overdue": 1.40, ...}

  domain_scores         JSONB NOT NULL DEFAULT '{}',
  -- {"skill": 18.5, "competition": 32.1, "fitness": 0, "behavioral": 0}

  composite_score       NUMERIC(6,2),

  -- Constraint and phase context
  constraints_applied   JSONB NOT NULL DEFAULT '[]',
  -- [{"type": "intensity_cap", "max_intensity": 3, "effect": "capped_intensity_recommendation"}]

  phase_context         JSONB NOT NULL DEFAULT '{}',
  -- {"phase": "training", "max_sessions_allowed": 7, "high_intensity_ok": true}

  load_context          JSONB NOT NULL DEFAULT '{}',
  -- {"fatigue_risk": 0.3, "sessions_7d": 4, "avg_intensity_7d": 3.2, "trend": "stable"}

  behavioral_adjustments JSONB NOT NULL DEFAULT '{}',
  -- {"fatigue_sensitivity": 0.7, "volume_response": "moderate", "load_adjustment_factor": 0.85}
  -- populated by 027_player_behavioral_model

  -- Human-readable explanation
  explanation_text      TEXT NOT NULL,
  -- Short: "UTR has regressed 0.2 points over 85 days. Reassessment is overdue. Fatigue is low.
  --         Recommended: schedule technical review session targeting competition readiness."

  explanation_bullets   TEXT[] NOT NULL DEFAULT '{}',
  -- Each bullet = one key reason, for the UI card

  confidence_explanation TEXT,
  -- Why confidence was set to X: "High: 2 high-severity signals, low fatigue, no constraints"

  -- Prediction at time of generation (populated by 028 if run first)
  predicted_score_impact  NUMERIC(4,3),
  -- Expected improvement in overall_score if recommendation is followed

  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reasoning_recommendation ON recommendation_reasoning(recommendation_id);
CREATE INDEX idx_reasoning_player         ON recommendation_reasoning(player_id, generated_at DESC);

-- ============================================================
-- BUILD_RECOMMENDATION_REASONING()
-- Builds and stores the reasoning record for a recommendation.
-- Called at the end of generate_player_recommendations().
-- ============================================================
CREATE OR REPLACE FUNCTION build_recommendation_reasoning(
  p_recommendation_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rec         player_recommendations%ROWTYPE;
  v_score       decision_scores%ROWTYPE;
  v_priority    player_priorities%ROWTYPE;
  v_load        player_load_aggregation%ROWTYPE;
  v_phase       player_phase;
  v_phase_defaults phase_load_defaults%ROWTYPE;
  v_signal      player_development_signals%ROWTYPE;
  v_signal_summary JSONB := '[]'::JSONB;
  v_weights     JSONB := '{}'::JSONB;
  v_constraints JSONB := '[]'::JSONB;
  v_constraint  player_constraints%ROWTYPE;
  v_bullets     TEXT[] := '{}';
  v_explanation TEXT;
  v_conf_text   TEXT;
  v_id          UUID;

  -- Weight lookup
  v_weight_row  signal_priority_weights%ROWTYPE;
  v_weighted_score NUMERIC;
BEGIN
  SELECT * INTO v_rec      FROM player_recommendations WHERE id = p_recommendation_id;
  SELECT * INTO v_score    FROM decision_scores        WHERE player_id = v_rec.player_id;
  SELECT * INTO v_priority FROM player_priorities      WHERE id = v_rec.priority_id;
  SELECT * INTO v_load     FROM player_load_aggregation WHERE player_id = v_rec.player_id;
  v_phase := get_player_phase(v_rec.player_id);
  SELECT * INTO v_phase_defaults FROM phase_load_defaults WHERE phase = v_phase;

  -- Build signal summary with weights
  FOR v_signal IN
    SELECT * FROM player_development_signals
    WHERE id = ANY(COALESCE(v_score.contributing_signal_ids, '{}'))
    AND is_active = true
    ORDER BY emitted_at DESC
    LIMIT 10
  LOOP
    SELECT * INTO v_weight_row
    FROM signal_priority_weights
    WHERE academy_id = v_rec.academy_id
    AND signal_type = v_signal.signal_type
    AND is_active = true;

    v_weighted_score := COALESCE(v_weight_row.weight, 1.0)
      * CASE v_signal.severity
          WHEN 'critical' THEN COALESCE(v_weight_row.critical_multiplier, 3.0)
          WHEN 'high'     THEN COALESCE(v_weight_row.high_multiplier, 1.75)
          WHEN 'medium'   THEN COALESCE(v_weight_row.medium_multiplier, 1.0)
          ELSE                 COALESCE(v_weight_row.low_multiplier, 0.5)
        END
      * v_signal.confidence * 10;

    v_signal_summary := v_signal_summary || jsonb_build_object(
      'signal_id',      v_signal.id,
      'type',           v_signal.signal_type,
      'severity',       v_signal.severity,
      'confidence',     v_signal.confidence,
      'weight_applied', COALESCE(v_weight_row.weight, 1.0),
      'weighted_score', ROUND(v_weighted_score, 2),
      'title',          v_signal.title
    );

    v_weights := v_weights || jsonb_build_object(v_signal.signal_type::TEXT, COALESCE(v_weight_row.weight, 1.0));
  END LOOP;

  -- Build constraint context
  FOR v_constraint IN
    SELECT * FROM player_constraints
    WHERE player_id = v_rec.player_id
    AND is_active = true
    AND (expected_end_date IS NULL OR expected_end_date >= CURRENT_DATE)
  LOOP
    v_constraints := v_constraints || jsonb_build_object(
      'type',         v_constraint.constraint_type,
      'severity',     v_constraint.severity,
      'title',        v_constraint.title,
      'max_intensity',v_constraint.max_intensity,
      'max_sessions', v_constraint.max_sessions_per_week,
      'effect',       CASE
        WHEN v_constraint.max_intensity IS NOT NULL THEN 'intensity_capped_at_' || v_constraint.max_intensity
        WHEN v_constraint.max_sessions_per_week IS NOT NULL THEN 'sessions_limited_to_' || v_constraint.max_sessions_per_week || '_per_week'
        ELSE 'monitoring_required'
      END
    );
    v_bullets := array_append(v_bullets, 'Active constraint: ' || v_constraint.title || ' (' || v_constraint.severity || ')');
  END LOOP;

  -- Build explanation bullets
  IF v_score.high_severity_count >= 2 THEN
    v_bullets := array_append(v_bullets, v_score.high_severity_count || ' high-severity signals active — immediate attention required');
  END IF;

  IF jsonb_array_length(v_signal_summary) > 0 THEN
    v_bullets := array_append(v_bullets,
      'Primary driver: ' || (v_signal_summary->0->>'title')
    );
  END IF;

  IF v_load.fatigue_risk_label IN ('high', 'critical') THEN
    v_bullets := array_append(v_bullets,
      'High fatigue risk (' || v_load.fatigue_risk_label || ') — intensity constrained'
    );
  END IF;

  v_bullets := array_append(v_bullets,
    'Current phase: ' || v_phase::TEXT ||
    ' (max ' || COALESCE(v_phase_defaults.max_sessions_per_week::TEXT, '?') || ' sessions/week)'
  );

  IF v_priority.relevant_dimension IS NOT NULL AND v_priority.current_score IS NOT NULL THEN
    v_bullets := array_append(v_bullets,
      v_priority.relevant_dimension || ' score: ' || v_priority.current_score
    );
  END IF;

  -- Build explanation text
  v_explanation := CASE v_rec.recommendation_type
    WHEN 'schedule_session'    THEN 'Skill development sessions recommended: '
    WHEN 'increase_competition' THEN 'Increased competitive exposure recommended: '
    WHEN 'reduce_load'         THEN 'Load reduction required: '
    WHEN 'schedule_reassessment' THEN 'Formal assessment needed: '
    WHEN 'move_group'          THEN 'Group transition recommended: '
    ELSE 'Action recommended: '
  END || v_rec.title || '. ';

  v_explanation := v_explanation ||
    'Decision score: ' || ROUND(COALESCE(v_score.composite_score, 0), 1) ||
    '/100 (' || v_rec.urgency || '). ' ||
    'Signals: ' || COALESCE(v_score.signal_count, 0) || ' active (' ||
    COALESCE(v_score.high_severity_count, 0) || ' high). ' ||
    'Phase: ' || v_phase::TEXT || '.';

  -- Confidence explanation
  v_conf_text := CASE
    WHEN v_rec.confidence_score >= 0.90 THEN 'Very high confidence: strong signal convergence, low constraints'
    WHEN v_rec.confidence_score >= 0.75 THEN 'High confidence: multiple corroborating signals'
    WHEN v_rec.confidence_score >= 0.60 THEN 'Moderate confidence: primary signal clear, secondary signals pending'
    ELSE 'Lower confidence: limited data — consider manual review'
  END;

  INSERT INTO recommendation_reasoning (
    academy_id, recommendation_id, player_id,
    source_signal_ids, signal_summary, weights_applied,
    domain_scores, composite_score,
    constraints_applied,
    phase_context, load_context,
    explanation_text, explanation_bullets, confidence_explanation
  ) VALUES (
    v_rec.academy_id, p_recommendation_id, v_rec.player_id,
    COALESCE(v_score.contributing_signal_ids, '{}'),
    v_signal_summary,
    v_weights,
    jsonb_build_object(
      'skill',       v_score.skill_domain_score,
      'competition', v_score.competition_domain_score,
      'fitness',     v_score.fitness_domain_score,
      'behavioral',  v_score.behavioral_domain_score
    ),
    v_score.composite_score,
    v_constraints,
    jsonb_build_object(
      'phase',                    v_phase,
      'max_sessions_per_week',    v_phase_defaults.max_sessions_per_week,
      'max_intensity',            v_phase_defaults.max_intensity,
      'high_intensity_pct_max',   v_phase_defaults.high_intensity_pct_max,
      'competition_ok',           v_phase_defaults.competition_ok
    ),
    jsonb_build_object(
      'fatigue_risk_score',   COALESCE(v_load.fatigue_risk_score, 0),
      'fatigue_risk_label',   v_load.fatigue_risk_label,
      'sessions_7d',          COALESCE(v_load.sessions_7d, 0),
      'avg_intensity_7d',     v_load.avg_intensity_7d,
      'load_trend',           v_load.load_trend_7d
    ),
    v_explanation,
    v_bullets,
    v_conf_text
  )
  ON CONFLICT (recommendation_id) DO UPDATE SET
    source_signal_ids    = EXCLUDED.source_signal_ids,
    signal_summary       = EXCLUDED.signal_summary,
    weights_applied      = EXCLUDED.weights_applied,
    domain_scores        = EXCLUDED.domain_scores,
    composite_score      = EXCLUDED.composite_score,
    constraints_applied  = EXCLUDED.constraints_applied,
    phase_context        = EXCLUDED.phase_context,
    load_context         = EXCLUDED.load_context,
    explanation_text     = EXCLUDED.explanation_text,
    explanation_bullets  = EXCLUDED.explanation_bullets,
    confidence_explanation = EXCLUDED.confidence_explanation,
    generated_at         = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update run_full_engine() to build reasoning and populate exercises
-- after generating recommendations.
-- ============================================================
CREATE OR REPLACE FUNCTION run_full_engine(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_score_id         UUID;
  v_priority_count   INTEGER;
  v_rec_result       JSONB;
  v_rec              player_recommendations%ROWTYPE;
  v_srec             session_recommendations%ROWTYPE;
  v_reasoning_count  INTEGER := 0;
  v_exercise_count   INTEGER := 0;
  v_rec_ids          UUID[] := '{}';
BEGIN
  -- 1. Score the player
  v_score_id := score_player(p_player_id, p_academy_id);

  -- 2. Generate priorities from signals
  v_priority_count := generate_player_priorities(p_player_id, p_academy_id);

  -- 3. Generate recommendations from priorities
  v_rec_result := generate_player_recommendations(p_player_id, p_academy_id);

  -- 4. For each new recommendation: build reasoning + populate exercises
  FOR v_rec IN
    SELECT * FROM player_recommendations
    WHERE player_id = p_player_id
    AND status = 'pending_review'
    AND generated_at > NOW() - INTERVAL '1 minute'
  LOOP
    PERFORM build_recommendation_reasoning(v_rec.id);
    v_reasoning_count := v_reasoning_count + 1;
    v_rec_ids := array_append(v_rec_ids, v_rec.id);

    FOR v_srec IN
      SELECT * FROM session_recommendations WHERE recommendation_id = v_rec.id
    LOOP
      v_exercise_count := v_exercise_count + COALESCE(
        populate_session_rec_exercises(v_srec.id), 0
      );
    END LOOP;
  END LOOP;

  -- 5. Log the decision cycle
  PERFORM log_decision_cycle(p_player_id, p_academy_id, v_score_id, v_rec_ids);

  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_player_id,
    'score_id', v_score_id,
    'priorities_generated', v_priority_count,
    'recommendations', v_rec_result,
    'reasoning_built', v_reasoning_count,
    'exercises_populated', v_exercise_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE recommendation_reasoning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see reasoning"      ON recommendation_reasoning FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages reasoning" ON recommendation_reasoning FOR ALL   USING (academy_id = auth_academy_id());
