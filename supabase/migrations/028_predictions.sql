-- ============================================================
-- ACADEMY OS — MIGRATION 028: PREDICTION LAYER
-- player_predictions: forward-looking scores computed from
-- time_series trends, load aggregation, active signals,
-- and behavioral profile.
--
-- Loop integration:
--   ← player_time_series (017) — trend inputs
--   ← player_load_aggregation (018) — injury/fatigue risk
--   ← player_development_signals (014) — signal severity profile
--   ← player_behavior_profiles (027) — behavioral multipliers
--   ← player_phase_states (017) — phase context
--   → player_recommendations (021) — prediction_score_impact populated
--   → recommendation_reasoning (026) — predicted_score_impact linked
--   → coaching_messages (029) — prediction context used in message tone
--
-- Predictions are point-in-time snapshots. Old predictions are
-- preserved; only the most recent is used by the engine.
-- ============================================================

CREATE TABLE player_predictions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id                 UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- How far ahead this prediction looks (days)
  prediction_horizon_days   INTEGER NOT NULL DEFAULT 30,

  -- Predicted overall score (0–10 scale, matches assessment overall_score)
  predicted_performance_score NUMERIC(4,2)
                            CHECK (predicted_performance_score BETWEEN 0 AND 10),

  -- Injury/overtraining risk (0.0–1.0)
  -- 0.0 = negligible risk, 1.0 = very high risk
  injury_risk_score         NUMERIC(4,3) NOT NULL DEFAULT 0.000
                            CHECK (injury_risk_score BETWEEN 0 AND 1),
  injury_risk_label         TEXT NOT NULL DEFAULT 'low'
                            CHECK (injury_risk_label IN ('negligible', 'low', 'moderate', 'high', 'critical')),

  -- Training readiness (0.0–1.0)
  -- Readiness to absorb a high-intensity session today
  readiness_score           NUMERIC(4,3) NOT NULL DEFAULT 1.000
                            CHECK (readiness_score BETWEEN 0 AND 1),
  readiness_label           TEXT NOT NULL DEFAULT 'ready'
                            CHECK (readiness_label IN ('not_ready', 'reduced', 'ready', 'peak')),

  -- Confidence in this prediction (0.0–1.0)
  -- Lower when data is sparse or signals are conflicting
  prediction_confidence     NUMERIC(4,3) NOT NULL DEFAULT 0.500
                            CHECK (prediction_confidence BETWEEN 0 AND 1),

  -- Raw inputs used — stored for transparency and learning system
  model_inputs              JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "ts_trend_30d": 0.3,        -- avg slope from time_series last 30 days
  --   "ts_data_points": 12,       -- how many time_series points informed this
  --   "current_score": 7.2,       -- assessment overall_score at prediction time
  --   "fatigue_risk": 0.4,        -- from player_load_aggregation
  --   "sessions_7d": 5,
  --   "active_signal_count": 3,
  --   "high_severity_count": 1,
  --   "phase": "training",
  --   "load_adjustment_factor": 0.95,
  --   "fatigue_sensitivity": 0.6
  -- }

  -- Breakdown of what's driving the prediction
  risk_factors              JSONB NOT NULL DEFAULT '[]',
  -- [{"factor": "high_fatigue", "contribution": 0.30, "description": "..."}]

  uplift_factors            JSONB NOT NULL DEFAULT '[]',
  -- [{"factor": "positive_trend", "contribution": 0.20, "description": "..."}]

  -- Human-readable summary
  prediction_summary        TEXT,

  generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_player   ON player_predictions(player_id, generated_at DESC);
CREATE INDEX idx_predictions_academy  ON player_predictions(academy_id, generated_at DESC);
CREATE INDEX idx_predictions_horizon  ON player_predictions(player_id, prediction_horizon_days, generated_at DESC);

-- ============================================================
-- GENERATE_PLAYER_PREDICTIONS()
-- Computes all three prediction scores from available data.
-- Designed to run after score_player() so signals are current.
-- Returns the prediction row id.
-- ============================================================
CREATE OR REPLACE FUNCTION generate_player_predictions(
  p_player_id             UUID,
  p_academy_id            UUID,
  p_horizon_days          INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_load       player_load_aggregation%ROWTYPE;
  v_behavior   player_behavior_profiles%ROWTYPE;
  v_score      decision_scores%ROWTYPE;
  v_phase      player_phase;
  v_phase_def  phase_load_defaults%ROWTYPE;

  -- Time series trend
  v_ts_trend        NUMERIC := 0;
  v_ts_points       INTEGER := 0;
  v_current_score   NUMERIC;

  -- Computed outputs
  v_injury_risk     NUMERIC := 0;
  v_injury_label    TEXT;
  v_readiness       NUMERIC := 1.0;
  v_readiness_label TEXT;
  v_perf_pred       NUMERIC;
  v_confidence      NUMERIC := 0.5;

  -- Narrative
  v_risk_factors    JSONB := '[]'::JSONB;
  v_uplift_factors  JSONB := '[]'::JSONB;
  v_summary         TEXT;
  v_id              UUID;
BEGIN
  SELECT * INTO v_load     FROM player_load_aggregation  WHERE player_id = p_player_id;
  SELECT * INTO v_behavior FROM player_behavior_profiles WHERE player_id = p_player_id;
  SELECT * INTO v_score    FROM decision_scores          WHERE player_id = p_player_id;
  v_phase := get_player_phase(p_player_id);
  SELECT * INTO v_phase_def FROM phase_load_defaults WHERE phase = v_phase;

  -- Get 30-day time series slope for overall_score
  SELECT
    COALESCE(
      REGR_SLOPE(ts_value, EXTRACT(EPOCH FROM recorded_at) / 86400.0),
      0
    ),
    COUNT(*)
  INTO v_ts_trend, v_ts_points
  FROM player_time_series
  WHERE player_id = p_player_id
  AND metric = 'overall_score'
  AND recorded_at >= NOW() - INTERVAL '30 days';

  -- Get current score from most recent assessment
  SELECT overall_score INTO v_current_score
  FROM player_progression
  WHERE player_id = p_player_id;

  -- ── INJURY RISK SCORE ──────────────────────────────────────
  -- Combines: fatigue_risk, fatigue_sensitivity, load_trend,
  -- active constraint signals, high_severity count

  v_injury_risk := 0;

  -- Fatigue contribution (weighted by behavioral sensitivity)
  IF v_load.fatigue_risk_score IS NOT NULL THEN
    v_injury_risk := v_injury_risk
      + (v_load.fatigue_risk_score * 0.40)
      * (1 + COALESCE(v_behavior.fatigue_sensitivity, 0.5) * 0.4);
    IF v_load.fatigue_risk_score > 0.5 THEN
      v_risk_factors := v_risk_factors || jsonb_build_object(
        'factor', 'high_fatigue',
        'contribution', ROUND(v_load.fatigue_risk_score * 0.40, 3),
        'description', 'Fatigue risk is ' || v_load.fatigue_risk_label || ' — elevated injury probability'
      );
    END IF;
  END IF;

  -- Load trend contribution
  IF v_load.load_trend_7d = 'increasing' THEN
    v_injury_risk := v_injury_risk + 0.15;
    v_risk_factors := v_risk_factors || jsonb_build_object(
      'factor', 'increasing_load',
      'contribution', 0.15,
      'description', 'Load trend is increasing — cumulative stress building'
    );
  END IF;

  -- High severity signal contribution
  IF COALESCE(v_score.high_severity_count, 0) >= 2 THEN
    v_injury_risk := v_injury_risk + 0.10;
    v_risk_factors := v_risk_factors || jsonb_build_object(
      'factor', 'multiple_high_signals',
      'contribution', 0.10,
      'description', v_score.high_severity_count || ' high-severity signals active'
    );
  END IF;

  -- Slow recovery amplifies risk
  IF COALESCE(v_behavior.recovery_rate, 'moderate') = 'slow' THEN
    v_injury_risk := v_injury_risk + 0.08;
    v_risk_factors := v_risk_factors || jsonb_build_object(
      'factor', 'slow_recovery',
      'contribution', 0.08,
      'description', 'Player profile shows slow recovery rate'
    );
  END IF;

  -- Active constraint already signals risk
  IF v_score.is_constrained THEN
    v_injury_risk := v_injury_risk + 0.20;
    v_risk_factors := v_risk_factors || jsonb_build_object(
      'factor', 'active_constraint',
      'contribution', 0.20,
      'description', 'Active injury/medical constraint on record'
    );
  END IF;

  v_injury_risk := LEAST(1.0, ROUND(v_injury_risk, 3));

  v_injury_label := CASE
    WHEN v_injury_risk >= 0.75 THEN 'critical'
    WHEN v_injury_risk >= 0.55 THEN 'high'
    WHEN v_injury_risk >= 0.35 THEN 'moderate'
    WHEN v_injury_risk >= 0.15 THEN 'low'
    ELSE 'negligible'
  END;

  -- ── READINESS SCORE ───────────────────────────────────────
  -- Inverse of fatigue risk, modified by phase and recovery rate

  v_readiness := 1.0 - COALESCE(v_load.fatigue_risk_score, 0) * 0.6;

  -- Phase adjustment: recovery phase reduces readiness ceiling
  IF v_phase = 'recovery' THEN
    v_readiness := v_readiness * 0.70;
  ELSIF v_phase = 'competition' THEN
    -- Competition phase: tapering keeps readiness high
    v_readiness := LEAST(1.0, v_readiness * 1.10);
  END IF;

  -- Decreasing load trend improves readiness
  IF v_load.load_trend_7d = 'decreasing' THEN
    v_readiness := LEAST(1.0, v_readiness + 0.10);
    v_uplift_factors := v_uplift_factors || jsonb_build_object(
      'factor', 'decreasing_load',
      'contribution', 0.10,
      'description', 'Load is decreasing — freshness improving'
    );
  END IF;

  v_readiness := GREATEST(0.0, LEAST(1.0, ROUND(v_readiness, 3)));

  v_readiness_label := CASE
    WHEN v_readiness >= 0.85 THEN 'peak'
    WHEN v_readiness >= 0.65 THEN 'ready'
    WHEN v_readiness >= 0.40 THEN 'reduced'
    ELSE 'not_ready'
  END;

  -- ── PREDICTED PERFORMANCE SCORE ───────────────────────────
  -- Projects current score forward using trend × horizon
  -- Modified by: load adjustment, injury risk penalty

  IF v_current_score IS NOT NULL AND v_ts_points >= 3 THEN
    -- Trend in score-points per day × horizon
    v_perf_pred := v_current_score
      + (v_ts_trend * p_horizon_days * 0.5)  -- dampened: trend rarely holds perfectly
      - (v_injury_risk * 0.8)                -- injury risk depresses predicted gain
      * COALESCE(v_behavior.load_adjustment_factor, 1.0);

    v_perf_pred := GREATEST(0, LEAST(10, ROUND(v_perf_pred, 2)));

    -- Confidence: more data = higher confidence
    v_confidence := CASE
      WHEN v_ts_points >= 20 THEN 0.80
      WHEN v_ts_points >= 10 THEN 0.65
      WHEN v_ts_points >= 5  THEN 0.50
      ELSE 0.35
    END;

    -- Positive trend uplift factor
    IF v_ts_trend > 0.01 THEN
      v_uplift_factors := v_uplift_factors || jsonb_build_object(
        'factor', 'positive_trend',
        'contribution', ROUND(v_ts_trend * p_horizon_days * 0.5, 3),
        'description', 'Upward score trend: +' || ROUND(v_ts_trend * 30, 2) || ' pts/30d'
      );
    END IF;
  ELSE
    -- Insufficient trend data — use current score with lower confidence
    v_perf_pred := COALESCE(v_current_score, 5.0);
    v_confidence := 0.30;
  END IF;

  -- Build summary text
  v_summary :=
    'Prediction (' || p_horizon_days || '-day horizon): ' ||
    'Performance ' || COALESCE(v_perf_pred::TEXT, 'unknown') || '/10. ' ||
    'Injury risk: ' || v_injury_label || ' (' || ROUND(v_injury_risk * 100) || '%). ' ||
    'Readiness: ' || v_readiness_label || ' (' || ROUND(v_readiness * 100) || '%). ' ||
    'Confidence: ' || ROUND(v_confidence * 100) || '%.';

  INSERT INTO player_predictions (
    academy_id, player_id, prediction_horizon_days,
    predicted_performance_score,
    injury_risk_score, injury_risk_label,
    readiness_score, readiness_label,
    prediction_confidence,
    model_inputs, risk_factors, uplift_factors,
    prediction_summary
  ) VALUES (
    p_academy_id, p_player_id, p_horizon_days,
    v_perf_pred,
    v_injury_risk, v_injury_label,
    v_readiness, v_readiness_label,
    v_confidence,
    jsonb_build_object(
      'ts_trend_30d',          ROUND(COALESCE(v_ts_trend, 0), 5),
      'ts_data_points',        v_ts_points,
      'current_score',         v_current_score,
      'fatigue_risk',          COALESCE(v_load.fatigue_risk_score, 0),
      'fatigue_risk_label',    v_load.fatigue_risk_label,
      'sessions_7d',           COALESCE(v_load.sessions_7d, 0),
      'active_signal_count',   COALESCE(v_score.signal_count, 0),
      'high_severity_count',   COALESCE(v_score.high_severity_count, 0),
      'phase',                 v_phase,
      'load_adjustment_factor',COALESCE(v_behavior.load_adjustment_factor, 1.0),
      'fatigue_sensitivity',   COALESCE(v_behavior.fatigue_sensitivity, 0.5),
      'is_constrained',        v_score.is_constrained
    ),
    v_risk_factors,
    v_uplift_factors,
    v_summary
  )
  RETURNING id INTO v_id;

  -- Back-populate predicted_score_impact on recent pending recommendations
  -- (impact = expected gain over current score)
  UPDATE recommendation_reasoning SET
    predicted_score_impact = CASE
      WHEN v_perf_pred IS NOT NULL AND v_current_score IS NOT NULL
      THEN ROUND(v_perf_pred - v_current_score, 3)
      ELSE NULL
    END
  WHERE recommendation_id IN (
    SELECT id FROM player_recommendations
    WHERE player_id = p_player_id
    AND status = 'pending_review'
    AND generated_at > NOW() - INTERVAL '1 hour'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update RUN_FULL_ENGINE() to include predictions.
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
  v_prediction_id    UUID;
  v_rec_ids          UUID[] := '{}';
BEGIN
  -- 1. Score the player (behavioral model integrated in score_player())
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

  -- 5. Generate predictions (uses scored data and behavioral profile)
  v_prediction_id := generate_player_predictions(p_player_id, p_academy_id, 30);

  -- 6. Log the decision cycle
  PERFORM log_decision_cycle(p_player_id, p_academy_id, v_score_id, v_rec_ids);

  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_player_id,
    'score_id', v_score_id,
    'priorities_generated', v_priority_count,
    'recommendations', v_rec_result,
    'reasoning_built', v_reasoning_count,
    'exercises_populated', v_exercise_count,
    'prediction_id', v_prediction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View: v_player_predictions_latest
-- One row per player with their most recent prediction.
-- ============================================================
CREATE OR REPLACE VIEW v_player_predictions_latest AS
SELECT DISTINCT ON (pp.player_id)
  pp.*,
  pl.first_name,
  pl.last_name
FROM player_predictions pp
JOIN players pl ON pl.id = pp.player_id
ORDER BY pp.player_id, pp.generated_at DESC;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see predictions"   ON player_predictions FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System writes predictions" ON player_predictions FOR ALL   USING (academy_id = auth_academy_id());
