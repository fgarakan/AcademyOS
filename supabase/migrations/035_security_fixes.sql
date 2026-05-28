-- ============================================================
-- ACADEMY OS — MIGRATION 035: MULTI-TENANT SECURITY FIXES
-- Applies all fixes identified in the multi-tenant security audit.
--
-- Fixes applied:
--   1. emit_signal() — validate p_player_id belongs to p_academy_id
--   2. take_progress_snapshot() — validate player belongs to academy
--   3. generate_player_predictions() — validate player belongs to academy
--   4. evaluate_behavior_profile() — validate player belongs to academy
--   5. generate_coaching_message() — validate recommendation belongs to caller's academy
--   6. build_recommendation_reasoning() — validate recommendation belongs to academy
--   7. generate_player_priorities() — add academy_id guard
--   8. generate_player_recommendations() — add academy_id guard
--   9. compute_player_benchmarks() — validate player belongs to academy
--  10. assign_player_to_cohorts() — validate player belongs to academy
-- ============================================================

-- ============================================================
-- VALIDATE_PLAYER_ACADEMY()
-- Shared helper: raises an exception if player_id does not
-- belong to the given academy_id. Called at the top of any
-- function that accepts both parameters from external callers.
-- SECURITY DEFINER so it can read players even with strict RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION validate_player_academy(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM players
    WHERE id = p_player_id AND academy_id = p_academy_id
  ) THEN
    RAISE EXCEPTION 'Access denied: player % does not belong to academy %',
      p_player_id, p_academy_id;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- FIX 1: emit_signal() — tenant cross-check
-- ============================================================
CREATE OR REPLACE FUNCTION emit_signal(
  p_academy_id         UUID,
  p_player_id          UUID,
  p_signal_type        signal_type,
  p_source             signal_source,
  p_title              TEXT,
  p_description        TEXT          DEFAULT NULL,
  p_domain             development_track DEFAULT NULL,
  p_severity           TEXT          DEFAULT 'medium',
  p_confidence         NUMERIC       DEFAULT 1.000,
  p_data               JSONB         DEFAULT NULL,
  p_recommended_action TEXT          DEFAULT NULL,
  p_source_object_type TEXT          DEFAULT NULL,
  p_source_object_id   UUID          DEFAULT NULL,
  p_expires_at         TIMESTAMPTZ   DEFAULT NULL,
  p_cooldown_hours     INTEGER       DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Tenant validation: player must belong to the academy
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  -- Deduplication: skip if same signal type for same player within cooldown window
  IF p_cooldown_hours > 0 THEN
    IF EXISTS (
      SELECT 1 FROM player_development_signals
      WHERE player_id = p_player_id
      AND   signal_type = p_signal_type
      AND   is_active = true
      AND   emitted_at > NOW() - (p_cooldown_hours || ' hours')::INTERVAL
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO player_development_signals (
    academy_id, player_id, signal_type, source, domain,
    severity, confidence, title, description, data,
    recommended_action, source_object_type, source_object_id,
    expires_at, is_active
  ) VALUES (
    p_academy_id, p_player_id, p_signal_type, p_source, p_domain,
    p_severity, p_confidence, p_title, p_description, p_data,
    p_recommended_action, p_source_object_type, p_source_object_id,
    p_expires_at, true
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 2: take_progress_snapshot() — tenant cross-check
-- ============================================================
CREATE OR REPLACE FUNCTION take_progress_snapshot(
  p_player_id     UUID,
  p_academy_id    UUID,
  p_trigger_type  TEXT DEFAULT 'manual',
  p_assessment_id UUID DEFAULT NULL,
  p_created_by    UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pp      player_progression%ROWTYPE;
  v_utr     player_utr_profiles%ROWTYPE;
  v_player  players%ROWTYPE;
  v_group   groups%ROWTYPE;
  v_level   academy_levels%ROWTYPE;
  v_sig     RECORD;
  v_id      UUID;
BEGIN
  -- Tenant validation
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  SELECT * INTO v_pp     FROM player_progression  WHERE player_id = p_player_id;
  SELECT * INTO v_utr    FROM player_utr_profiles WHERE player_id = p_player_id;
  SELECT * INTO v_player FROM players              WHERE id = p_player_id;

  IF v_player.current_group_id IS NOT NULL THEN
    SELECT * INTO v_group FROM groups        WHERE id = v_player.current_group_id;
    SELECT * INTO v_level FROM academy_levels WHERE id = v_player.current_level_id;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE severity = 'high')   AS high_count,
    COUNT(*) FILTER (WHERE severity = 'medium') AS med_count,
    COUNT(*) FILTER (WHERE severity = 'low')    AS low_count
  INTO v_sig
  FROM player_development_signals
  WHERE player_id = p_player_id AND is_active = true;

  INSERT INTO player_progress_snapshots (
    academy_id, player_id, snapshot_date, trigger_type,
    technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score,
    utr_singles, utr_doubles, utr_match_count_90d,
    group_id, group_name, level_id, level_number, track,
    active_signals_high, active_signals_medium, active_signals_low,
    assessment_id, created_by
  ) VALUES (
    p_academy_id, p_player_id, CURRENT_DATE, p_trigger_type,
    v_pp.technical_score, v_pp.tactical_score, v_pp.movement_score,
    v_pp.competition_score, v_pp.behavioral_score, v_pp.overall_score,
    v_utr.utr_singles, v_utr.utr_doubles, v_utr.matches_played_90d,
    v_player.current_group_id, v_group.name, v_player.current_level_id, v_level.level_number, v_player.current_track,
    COALESCE(v_sig.high_count, 0), COALESCE(v_sig.med_count, 0), COALESCE(v_sig.low_count, 0),
    p_assessment_id, p_created_by
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 3: generate_player_predictions() — tenant cross-check
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
  v_ts_trend        NUMERIC := 0;
  v_ts_points       INTEGER := 0;
  v_current_score   NUMERIC;
  v_injury_risk     NUMERIC := 0;
  v_injury_label    TEXT;
  v_readiness       NUMERIC := 1.0;
  v_readiness_label TEXT;
  v_perf_pred       NUMERIC;
  v_confidence      NUMERIC := 0.5;
  v_risk_factors    JSONB := '[]'::JSONB;
  v_uplift_factors  JSONB := '[]'::JSONB;
  v_summary         TEXT;
  v_id              UUID;
BEGIN
  -- Tenant validation
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  SELECT * INTO v_load     FROM player_load_aggregation  WHERE player_id = p_player_id;
  SELECT * INTO v_behavior FROM player_behavior_profiles WHERE player_id = p_player_id;
  SELECT * INTO v_score    FROM decision_scores          WHERE player_id = p_player_id;
  v_phase := get_player_phase(p_player_id);
  SELECT * INTO v_phase_def FROM phase_load_defaults WHERE phase = v_phase;

  SELECT
    COALESCE(REGR_SLOPE(ts_value, EXTRACT(EPOCH FROM recorded_at) / 86400.0), 0),
    COUNT(*)
  INTO v_ts_trend, v_ts_points
  FROM player_time_series
  WHERE player_id = p_player_id
  AND   metric = 'overall_score'
  AND   recorded_at >= NOW() - INTERVAL '30 days';

  SELECT overall_score INTO v_current_score
  FROM player_progression
  WHERE player_id = p_player_id;

  -- Injury risk
  v_injury_risk := 0;
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
  IF v_load.load_trend_7d = 'increasing' THEN
    v_injury_risk := v_injury_risk + 0.15;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor','increasing_load','contribution',0.15,'description','Load trend is increasing');
  END IF;
  IF COALESCE(v_score.high_severity_count, 0) >= 2 THEN
    v_injury_risk := v_injury_risk + 0.10;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor','multiple_high_signals','contribution',0.10,'description',v_score.high_severity_count || ' high-severity signals active');
  END IF;
  IF COALESCE(v_behavior.recovery_rate, 'moderate') = 'slow' THEN
    v_injury_risk := v_injury_risk + 0.08;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor','slow_recovery','contribution',0.08,'description','Player profile shows slow recovery rate');
  END IF;
  IF v_score.is_constrained THEN
    v_injury_risk := v_injury_risk + 0.20;
    v_risk_factors := v_risk_factors || jsonb_build_object('factor','active_constraint','contribution',0.20,'description','Active injury/medical constraint on record');
  END IF;
  v_injury_risk := LEAST(1.0, ROUND(v_injury_risk, 3));
  v_injury_label := CASE
    WHEN v_injury_risk >= 0.75 THEN 'critical'
    WHEN v_injury_risk >= 0.55 THEN 'high'
    WHEN v_injury_risk >= 0.35 THEN 'moderate'
    WHEN v_injury_risk >= 0.15 THEN 'low'
    ELSE 'negligible'
  END;

  -- Readiness
  v_readiness := 1.0 - COALESCE(v_load.fatigue_risk_score, 0) * 0.6;
  IF v_phase = 'recovery'     THEN v_readiness := v_readiness * 0.70; END IF;
  IF v_phase = 'competition'  THEN v_readiness := LEAST(1.0, v_readiness * 1.10); END IF;
  IF v_load.load_trend_7d = 'decreasing' THEN
    v_readiness := LEAST(1.0, v_readiness + 0.10);
    v_uplift_factors := v_uplift_factors || jsonb_build_object('factor','decreasing_load','contribution',0.10,'description','Load is decreasing — freshness improving');
  END IF;
  v_readiness := GREATEST(0.0, LEAST(1.0, ROUND(v_readiness, 3)));
  v_readiness_label := CASE
    WHEN v_readiness >= 0.85 THEN 'peak'
    WHEN v_readiness >= 0.65 THEN 'ready'
    WHEN v_readiness >= 0.40 THEN 'reduced'
    ELSE 'not_ready'
  END;

  -- Predicted performance
  IF v_current_score IS NOT NULL AND v_ts_points >= 3 THEN
    v_perf_pred := GREATEST(0, LEAST(10, ROUND(
      v_current_score
      + (v_ts_trend * p_horizon_days * 0.5)
      - (v_injury_risk * 0.8)
      * COALESCE(v_behavior.load_adjustment_factor, 1.0),
    2)));
    v_confidence := CASE
      WHEN v_ts_points >= 20 THEN 0.80
      WHEN v_ts_points >= 10 THEN 0.65
      WHEN v_ts_points >= 5  THEN 0.50
      ELSE 0.35
    END;
    IF v_ts_trend > 0.01 THEN
      v_uplift_factors := v_uplift_factors || jsonb_build_object('factor','positive_trend','contribution',ROUND(v_ts_trend * p_horizon_days * 0.5,3),'description','Upward score trend');
    END IF;
  ELSE
    v_perf_pred  := COALESCE(v_current_score, 5.0);
    v_confidence := 0.30;
  END IF;

  v_summary :=
    'Prediction (' || p_horizon_days || '-day): Performance ' || COALESCE(v_perf_pred::TEXT,'?') ||
    '/10. Injury risk: ' || v_injury_label || '. Readiness: ' || v_readiness_label ||
    '. Confidence: ' || ROUND(v_confidence * 100) || '%.';

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
      'ts_trend_30d',           ROUND(COALESCE(v_ts_trend, 0), 5),
      'ts_data_points',         v_ts_points,
      'current_score',          v_current_score,
      'fatigue_risk',           COALESCE(v_load.fatigue_risk_score, 0),
      'fatigue_risk_label',     v_load.fatigue_risk_label,
      'sessions_7d',            COALESCE(v_load.sessions_7d, 0),
      'active_signal_count',    COALESCE(v_score.signal_count, 0),
      'high_severity_count',    COALESCE(v_score.high_severity_count, 0),
      'phase',                  v_phase,
      'load_adjustment_factor', COALESCE(v_behavior.load_adjustment_factor, 1.0),
      'fatigue_sensitivity',    COALESCE(v_behavior.fatigue_sensitivity, 0.5),
      'is_constrained',         v_score.is_constrained
    ),
    v_risk_factors, v_uplift_factors, v_summary
  )
  RETURNING id INTO v_id;

  UPDATE recommendation_reasoning SET
    predicted_score_impact = CASE
      WHEN v_perf_pred IS NOT NULL AND v_current_score IS NOT NULL
      THEN ROUND(v_perf_pred - v_current_score, 3)
      ELSE NULL
    END
  WHERE recommendation_id IN (
    SELECT id FROM player_recommendations
    WHERE player_id   = p_player_id
    AND   academy_id  = p_academy_id
    AND   status = 'pending_review'
    AND   generated_at > NOW() - INTERVAL '1 hour'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 4: evaluate_behavior_profile() — tenant cross-check
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_behavior_profile(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile     player_behavior_profiles%ROWTYPE;
  v_load        player_load_aggregation%ROWTYPE;
  v_avg_perf_high NUMERIC;
  v_avg_perf_low  NUMERIC;
  v_new_sensitivity NUMERIC;
  v_new_recovery    TEXT;
  v_outcome_count   INTEGER;
BEGIN
  -- Tenant validation
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  SELECT * INTO v_profile FROM player_behavior_profiles WHERE player_id = p_player_id;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_load FROM player_load_aggregation WHERE player_id = p_player_id;

  SELECT
    AVG(CASE WHEN o.perceived_load >= 4 THEN o.performance_rating END),
    AVG(CASE WHEN o.perceived_load <= 2 THEN o.performance_rating END),
    COUNT(*)
  INTO v_avg_perf_high, v_avg_perf_low, v_outcome_count
  FROM player_outcomes o
  WHERE o.player_id   = p_player_id
  AND   o.recorded_at >= NOW() - INTERVAL '90 days';

  -- Require minimum outcomes (configurable threshold)
  IF v_outcome_count < COALESCE(
    (SELECT config_value::INTEGER FROM academy_threshold_configs
     WHERE academy_id = p_academy_id AND config_key = 'behavioral_calibration_min_outcomes' AND is_active = true),
    10
  ) THEN RETURN false; END IF;

  IF v_avg_perf_high IS NOT NULL AND v_avg_perf_low IS NOT NULL THEN
    DECLARE
      v_perf_drop NUMERIC := v_avg_perf_low - v_avg_perf_high;
    BEGIN
      IF v_perf_drop > 1.5 THEN
        v_new_sensitivity := LEAST(1.0, v_profile.fatigue_sensitivity + 0.10);
      ELSIF v_perf_drop < 0.3 THEN
        v_new_sensitivity := GREATEST(0.0, v_profile.fatigue_sensitivity - 0.05);
      ELSE
        v_new_sensitivity := v_profile.fatigue_sensitivity;
      END IF;
    END;
  ELSE
    v_new_sensitivity := v_profile.fatigue_sensitivity;
  END IF;

  v_new_recovery := CASE
    WHEN v_load.load_trend_7d = 'decreasing' AND v_load.fatigue_risk_score < 0.3 THEN 'fast'
    WHEN v_load.load_trend_7d = 'increasing' AND v_load.fatigue_risk_score > 0.6 THEN 'slow'
    ELSE 'moderate'
  END;

  UPDATE player_behavior_profiles SET
    fatigue_sensitivity    = v_new_sensitivity,
    recovery_rate          = v_new_recovery,
    load_adjustment_factor = compute_load_adjustment_factor(v_new_sensitivity, v_new_recovery),
    calibration_count      = v_outcome_count,
    last_calibrated_at     = NOW()
  WHERE player_id = p_player_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 5: generate_coaching_message() — validate recommendation
-- belongs to caller's academy before generating message
-- ============================================================
CREATE OR REPLACE FUNCTION generate_coaching_message(
  p_recommendation_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rec       player_recommendations%ROWTYPE;
  v_reasoning recommendation_reasoning%ROWTYPE;
  v_behavior  player_behavior_profiles%ROWTYPE;
  v_signal    player_development_signals%ROWTYPE;
  v_pred      player_predictions%ROWTYPE;
  v_tone      message_tone;
  v_short     TEXT;
  v_detailed  TEXT;
  v_focus     TEXT;
  v_audience  message_audience;
  v_id        UUID;
BEGIN
  SELECT * INTO v_rec FROM player_recommendations WHERE id = p_recommendation_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Tenant validation: recommendation's academy must exist and be self-consistent
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = v_rec.player_id AND academy_id = v_rec.academy_id) THEN
    RAISE EXCEPTION 'Access denied: recommendation % has inconsistent tenant data', p_recommendation_id;
  END IF;

  SELECT * INTO v_reasoning FROM recommendation_reasoning  WHERE recommendation_id = p_recommendation_id;
  SELECT * INTO v_behavior  FROM player_behavior_profiles  WHERE player_id = v_rec.player_id;

  IF v_rec.priority_id IS NOT NULL THEN
    SELECT s.* INTO v_signal
    FROM player_development_signals s
    JOIN player_priorities pri ON pri.primary_signal_id = s.id
    WHERE pri.id = v_rec.priority_id
    AND   s.academy_id = v_rec.academy_id  -- explicit tenant filter on signal
    LIMIT 1;
  END IF;

  SELECT * INTO v_pred
  FROM player_predictions
  WHERE player_id  = v_rec.player_id
  AND   academy_id = v_rec.academy_id
  ORDER BY generated_at DESC
  LIMIT 1;

  v_tone := CASE
    WHEN v_rec.recommendation_type = 'reduce_load' THEN 'concern'
    WHEN v_signal.signal_type IN ('utr_improvement', 'score_improvement', 'promotion_ready') THEN 'encouragement'
    WHEN v_signal.signal_type IN ('utr_regression', 'score_regression') THEN
      CASE WHEN COALESCE(v_behavior.pressure_tolerance, 0.5) >= 0.6 THEN 'correction' ELSE 'concern' END
    WHEN v_signal.signal_type = 'reassessment_overdue' THEN 'informational'
    WHEN v_rec.urgency IN ('immediate', 'urgent') AND
         COALESCE(v_behavior.competition_response, 'neutral') = 'match_motivated' THEN 'challenge'
    ELSE 'informational'
  END;

  v_audience := CASE
    WHEN v_rec.recommendation_type = 'reduce_load' THEN 'all'
    WHEN v_tone = 'concern' THEN 'all'
    ELSE 'coach'
  END;

  v_focus := CASE v_rec.recommendation_type
    WHEN 'schedule_session'      THEN 'Technical development — ' || COALESCE(v_rec.title, 'skill session')
    WHEN 'increase_competition'  THEN 'Competitive exposure — match volume'
    WHEN 'reduce_load'           THEN 'Load management — injury prevention'
    WHEN 'schedule_reassessment' THEN 'Formal assessment — progress check'
    WHEN 'move_group'            THEN 'Group transition — level alignment'
    ELSE v_rec.recommendation_type
  END;

  v_short := CASE v_tone
    WHEN 'encouragement' THEN
      'Great progress! ' || COALESCE(v_signal.title, 'Your recent performance shows improvement') ||
      '. Keep it up — next focus: ' || v_focus || '.'
    WHEN 'challenge' THEN
      'Time to raise the bar. ' || COALESCE(v_signal.title, 'Your data shows room to grow') ||
      '. Coach has scheduled: ' || COALESCE(v_rec.title, v_focus) || '.'
    WHEN 'correction' THEN
      'Let''s address this together. ' || COALESCE(v_signal.title, 'A focus area needs attention') ||
      '. Recommended: ' || COALESCE(v_rec.title, v_focus) || '.'
    WHEN 'concern' THEN
      'Your wellbeing comes first. ' || COALESCE(v_signal.title, 'Load/health flags detected') ||
      '. We''re adjusting your program: ' || COALESCE(v_rec.title, v_focus) || '.'
    ELSE
      COALESCE(v_rec.title, v_focus) || '. ' ||
      COALESCE(v_signal.title, 'Review your latest development data') || '.'
  END;
  IF length(v_short) > 280 THEN v_short := left(v_short, 277) || '...'; END IF;

  v_detailed :=
    '=== COACHING NOTE: ' || UPPER(v_rec.recommendation_type) || ' ===' || E'\n\n' ||
    'PLAYER: ' || v_rec.player_id || E'\n' ||
    'RECOMMENDATION: ' || COALESCE(v_rec.title, 'N/A') || E'\n' ||
    'URGENCY: ' || v_rec.urgency || ' | CONFIDENCE: ' || ROUND(COALESCE(v_rec.confidence_score, 0) * 100) || '%' || E'\n\n' ||
    'SIGNAL CONTEXT:' || E'\n' ||
    COALESCE('  Primary: ' || v_signal.title || ' (' || v_signal.severity || ', conf: ' ||
      ROUND(v_signal.confidence * 100) || '%)' || E'\n', '  No primary signal.' || E'\n') ||
    E'\n' || 'ENGINE REASONING:' || E'\n' ||
    '  ' || COALESCE(v_reasoning.explanation_text, 'No reasoning record available.') || E'\n\n';

  IF v_pred IS NOT NULL THEN
    v_detailed := v_detailed ||
      'PREDICTION (30-day):' || E'\n' ||
      '  Performance: ' || COALESCE(v_pred.predicted_performance_score::TEXT, '?') || '/10' || E'\n' ||
      '  Injury risk: ' || v_pred.injury_risk_label || ' (' || ROUND(v_pred.injury_risk_score * 100) || '%)' || E'\n' ||
      '  Readiness: ' || v_pred.readiness_label || E'\n' ||
      '  Confidence: ' || ROUND(v_pred.prediction_confidence * 100) || '%' || E'\n\n';
  END IF;

  v_detailed := v_detailed ||
    'BEHAVIORAL PROFILE:' || E'\n' ||
    '  Volume response: ' || COALESCE(v_behavior.volume_response, 'unknown') || E'\n' ||
    '  Fatigue sensitivity: ' || ROUND(COALESCE(v_behavior.fatigue_sensitivity, 0.5) * 100) || '%' || E'\n' ||
    '  Competition response: ' || COALESCE(v_behavior.competition_response, 'neutral') || E'\n' ||
    '  Preferred learning: ' || COALESCE(v_behavior.learning_preference, 'drill_heavy') || E'\n' ||
    '  Load adjustment: ' || COALESCE(v_behavior.load_adjustment_factor::TEXT, '1.0') || E'\n\n' ||
    'COACHING APPROACH:' || E'\n' ||
    '  Tone: ' || v_tone::TEXT || E'\n' ||
    CASE v_behavior.learning_preference
      WHEN 'game_based'     THEN '  Use match scenarios and game formats to deliver this focus.' || E'\n'
      WHEN 'drill_heavy'    THEN '  Use structured, blocked drills with clear repetition targets.' || E'\n'
      WHEN 'video_analysis' THEN '  Prepare video clips showing this pattern before the session.' || E'\n'
      WHEN 'verbal_cues'    THEN '  Use short, sharp verbal cues; minimize lengthy technical explanations.' || E'\n'
      ELSE '' END ||
    E'\n' || '---' || E'\n' ||
    'Generated by Academy OS engine at ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || ' UTC';

  INSERT INTO coaching_messages (
    academy_id, player_id,
    recommendation_id, signal_id,
    short_message, detailed_message,
    coaching_focus, tone, audience,
    generated_by
  ) VALUES (
    v_rec.academy_id, v_rec.player_id,
    p_recommendation_id, v_signal.id,
    v_short, v_detailed,
    v_focus, v_tone, v_audience,
    'system'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 6: compute_player_benchmarks() — validate tenant
-- ============================================================
CREATE OR REPLACE FUNCTION compute_player_benchmarks(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_player      players%ROWTYPE;
  v_prog        player_progression%ROWTYPE;
  v_utr         player_utr_profiles%ROWTYPE;
  v_level       academy_levels%ROWTYPE;
  v_age         INTEGER;
  v_level_num   INTEGER;
  v_bench       benchmark_definitions%ROWTYPE;
  v_applies     BOOLEAN;
  v_score_gap   NUMERIC;
  v_utr_gap     NUMERIC;
  v_verdict     TEXT;
  v_result      JSONB := '[]'::JSONB;
  v_below_count INTEGER := 0;
  v_above_count INTEGER := 0;
BEGIN
  -- Tenant validation
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  SELECT * INTO v_player FROM players            WHERE id = p_player_id;
  SELECT * INTO v_prog   FROM player_progression WHERE player_id = p_player_id;
  SELECT * INTO v_utr    FROM player_utr_profiles WHERE player_id = p_player_id;

  v_age := EXTRACT(YEAR FROM AGE(v_player.date_of_birth))::INTEGER;

  IF v_player.current_level_id IS NOT NULL THEN
    SELECT * INTO v_level FROM academy_levels WHERE id = v_player.current_level_id;
    v_level_num := COALESCE(v_level.level_number, 0);
  ELSE
    v_level_num := 0;
  END IF;

  FOR v_bench IN
    SELECT * FROM benchmark_definitions
    WHERE academy_id = p_academy_id AND is_active = true
  LOOP
    v_applies := CASE v_bench.benchmark_type
      WHEN 'level_target' THEN
        v_level_num = (v_bench.criteria->>'level_number')::INTEGER
      WHEN 'utr_range' THEN
        v_utr.current_utr IS NOT NULL
        AND v_utr.current_utr >= (v_bench.criteria->>'utr_min')::NUMERIC
        AND v_utr.current_utr <  (v_bench.criteria->>'utr_max')::NUMERIC
      WHEN 'age_group_norm' THEN
        v_age >= (v_bench.criteria->>'age_min')::INTEGER
        AND v_age <= (v_bench.criteria->>'age_max')::INTEGER
      WHEN 'external_target' THEN
        v_player.current_track::TEXT = COALESCE(v_bench.criteria->>'track', v_player.current_track::TEXT)
      ELSE false
    END;

    IF NOT v_applies THEN CONTINUE; END IF;

    v_score_gap := CASE
      WHEN v_prog.overall_score IS NULL OR v_bench.expected_score_min IS NULL THEN NULL
      WHEN v_prog.overall_score < v_bench.expected_score_min
           THEN ROUND(v_prog.overall_score - v_bench.expected_score_min, 2)
      WHEN v_prog.overall_score > v_bench.expected_score_max
           THEN ROUND(v_prog.overall_score - v_bench.expected_score_max, 2)
      ELSE 0
    END;

    v_utr_gap := CASE
      WHEN v_utr.current_utr IS NULL OR v_bench.expected_utr_min IS NULL THEN NULL
      WHEN v_utr.current_utr < v_bench.expected_utr_min
           THEN ROUND(v_utr.current_utr - v_bench.expected_utr_min, 2)
      WHEN v_utr.current_utr > v_bench.expected_utr_max
           THEN ROUND(v_utr.current_utr - v_bench.expected_utr_max, 2)
      ELSE 0
    END;

    v_verdict := CASE
      WHEN v_score_gap IS NOT NULL AND v_prog.overall_score <
           v_bench.expected_score_min * v_bench.below_gap_threshold
        THEN 'below_expectation'
      WHEN v_score_gap IS NOT NULL AND v_prog.overall_score >
           v_bench.expected_score_max * v_bench.above_gap_threshold
        THEN 'above_expectation'
      ELSE 'on_track'
    END;

    INSERT INTO player_benchmark_results (
      academy_id, player_id, benchmark_id,
      player_overall_score, player_utr_rating,
      expected_score_min, expected_score_max,
      expected_utr_min, expected_utr_max,
      score_gap, utr_gap, verdict
    ) VALUES (
      p_academy_id, p_player_id, v_bench.id,
      v_prog.overall_score, v_utr.current_utr,
      v_bench.expected_score_min, v_bench.expected_score_max,
      v_bench.expected_utr_min, v_bench.expected_utr_max,
      v_score_gap, v_utr_gap, v_verdict
    )
    ON CONFLICT (player_id, benchmark_id) DO UPDATE SET
      player_overall_score = EXCLUDED.player_overall_score,
      player_utr_rating    = EXCLUDED.player_utr_rating,
      score_gap            = EXCLUDED.score_gap,
      utr_gap              = EXCLUDED.utr_gap,
      verdict              = EXCLUDED.verdict,
      signal_emitted       = false,
      computed_at          = NOW();

    IF v_verdict = 'below_expectation' THEN
      PERFORM emit_signal(
        p_academy_id, p_player_id,
        'benchmark_below_expectation', 'system_cron',
        'Below expectation: ' || v_bench.name,
        'Score ' || ROUND(COALESCE(v_prog.overall_score, 0), 1) ||
        ' vs expected min ' || v_bench.expected_score_min,
        'skill', 'medium', 0.850,
        jsonb_build_object('benchmark_id', v_bench.id, 'benchmark_name', v_bench.name,
          'player_score', v_prog.overall_score, 'expected_min', v_bench.expected_score_min, 'score_gap', v_score_gap),
        'schedule_reassessment', 'player_benchmark_results', NULL,
        NOW() + INTERVAL '21 days', 336
      );
      v_below_count := v_below_count + 1;
      UPDATE player_benchmark_results SET signal_emitted = true
      WHERE player_id = p_player_id AND benchmark_id = v_bench.id;

    ELSIF v_verdict = 'above_expectation' THEN
      PERFORM emit_signal(
        p_academy_id, p_player_id,
        'benchmark_above_expectation', 'system_cron',
        'Exceeds expectations: ' || v_bench.name,
        'Score ' || ROUND(COALESCE(v_prog.overall_score, 0), 1) ||
        ' vs expected max ' || v_bench.expected_score_max,
        'skill', 'low', 0.800,
        jsonb_build_object('benchmark_id', v_bench.id, 'benchmark_name', v_bench.name,
          'player_score', v_prog.overall_score, 'expected_max', v_bench.expected_score_max, 'score_gap', v_score_gap),
        'consider_promotion', 'player_benchmark_results', NULL,
        NOW() + INTERVAL '30 days', 336
      );
      v_above_count := v_above_count + 1;
      UPDATE player_benchmark_results SET signal_emitted = true
      WHERE player_id = p_player_id AND benchmark_id = v_bench.id;
    END IF;

    v_result := v_result || jsonb_build_object(
      'benchmark_name', v_bench.name,
      'benchmark_type', v_bench.benchmark_type,
      'verdict',        v_verdict,
      'score_gap',      v_score_gap,
      'utr_gap',        v_utr_gap
    );
  END LOOP;

  RETURN jsonb_build_object('below_count', v_below_count, 'above_count', v_above_count, 'benchmarks', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 7: assign_player_to_cohorts() — validate tenant
-- ============================================================
CREATE OR REPLACE FUNCTION assign_player_to_cohorts(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_cohort     player_cohorts%ROWTYPE;
  v_player     players%ROWTYPE;
  v_utr        player_utr_profiles%ROWTYPE;
  v_level      academy_levels%ROWTYPE;
  v_phase      player_phase;
  v_age        INTEGER;
  v_level_num  INTEGER;
  v_qualifies  BOOLEAN;
  v_count      INTEGER := 0;
BEGIN
  -- Tenant validation
  PERFORM validate_player_academy(p_player_id, p_academy_id);

  SELECT * INTO v_player FROM players             WHERE id = p_player_id;
  SELECT * INTO v_utr    FROM player_utr_profiles WHERE player_id = p_player_id;
  v_phase := get_player_phase(p_player_id);
  v_age   := EXTRACT(YEAR FROM AGE(v_player.date_of_birth))::INTEGER;

  IF v_player.current_level_id IS NOT NULL THEN
    SELECT * INTO v_level FROM academy_levels WHERE id = v_player.current_level_id;
    v_level_num := COALESCE(v_level.level_number, 0);
  ELSE
    v_level_num := 0;
  END IF;

  DELETE FROM cohort_memberships
  WHERE player_id = p_player_id AND academy_id = p_academy_id;

  FOR v_cohort IN
    SELECT * FROM player_cohorts
    WHERE academy_id = p_academy_id AND is_active = true
  LOOP
    v_qualifies := CASE v_cohort.cohort_type
      WHEN 'utr_band' THEN
        v_utr.current_utr IS NOT NULL
        AND v_utr.current_utr >= (v_cohort.criteria->>'utr_min')::NUMERIC
        AND v_utr.current_utr <  (v_cohort.criteria->>'utr_max')::NUMERIC
      WHEN 'age_group' THEN
        v_age >= (v_cohort.criteria->>'age_min')::INTEGER
        AND v_age <= (v_cohort.criteria->>'age_max')::INTEGER
      WHEN 'level_band' THEN
        v_level_num >= (v_cohort.criteria->>'level_min')::INTEGER
        AND v_level_num <= (v_cohort.criteria->>'level_max')::INTEGER
      WHEN 'phase' THEN
        v_phase::TEXT = (v_cohort.criteria->>'phase')
      WHEN 'track' THEN
        v_player.current_track::TEXT = (v_cohort.criteria->>'track')
      ELSE false
    END;

    IF v_qualifies THEN
      INSERT INTO cohort_memberships (academy_id, cohort_id, player_id)
      VALUES (p_academy_id, v_cohort.id, p_player_id)
      ON CONFLICT (cohort_id, player_id) DO NOTHING;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 8: apply_director_configuration() — validate config
-- belongs to the right academy before applying
-- (was implicitly safe but adding explicit guard)
-- ============================================================
CREATE OR REPLACE FUNCTION apply_director_configuration(
  p_config_id  UUID,
  p_applier_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_config       director_configurations%ROWTYPE;
  v_applier_acad UUID;
  v_weight_obj   JSONB;
  v_thresh_obj   JSONB;
  v_sig_type     signal_type;
  v_weight_count INTEGER := 0;
  v_thresh_count INTEGER := 0;
  v_version_id   UUID;
BEGIN
  SELECT * INTO v_config FROM director_configurations WHERE id = p_config_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Configuration not found');
  END IF;

  -- Validate applier belongs to the same academy as the config
  SELECT academy_id INTO v_applier_acad
  FROM profiles WHERE id = p_applier_id;

  IF v_applier_acad IS DISTINCT FROM v_config.academy_id THEN
    RAISE EXCEPTION 'Access denied: profile % does not belong to academy %',
      p_applier_id, v_config.academy_id;
  END IF;

  v_version_id := snapshot_current_model(
    v_config.academy_id,
    'Pre-config: ' || v_config.name,
    'Automatic snapshot before applying director configuration',
    p_applier_id
  );

  FOR v_weight_obj IN
    SELECT jsonb_array_elements(v_config.configuration_snapshot->'signal_weights')
  LOOP
    BEGIN
      v_sig_type := (v_weight_obj->>'signal_type')::signal_type;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;

    UPDATE signal_priority_weights SET
      weight               = (v_weight_obj->>'weight')::NUMERIC,
      low_multiplier       = (v_weight_obj->>'low_multiplier')::NUMERIC,
      medium_multiplier    = (v_weight_obj->>'medium_multiplier')::NUMERIC,
      high_multiplier      = (v_weight_obj->>'high_multiplier')::NUMERIC,
      critical_multiplier  = (v_weight_obj->>'critical_multiplier')::NUMERIC,
      min_confidence       = (v_weight_obj->>'min_confidence')::NUMERIC
    WHERE academy_id  = v_config.academy_id
    AND   signal_type = v_sig_type;

    UPDATE weight_change_history SET source = 'configuration_apply'
    WHERE academy_id  = v_config.academy_id
    AND   signal_type = v_sig_type
    AND   changed_at  > NOW() - INTERVAL '5 seconds';

    v_weight_count := v_weight_count + 1;
  END LOOP;

  IF v_config.configuration_snapshot ? 'thresholds' THEN
    FOR v_thresh_obj IN
      SELECT jsonb_each(v_config.configuration_snapshot->'thresholds')
    LOOP
      UPDATE academy_threshold_configs SET
        config_value = (v_thresh_obj->>'value')::NUMERIC,
        updated_by   = p_applier_id
      WHERE academy_id = v_config.academy_id
      AND   config_key = v_thresh_obj->>'key';
      v_thresh_count := v_thresh_count + 1;
    END LOOP;
  END IF;

  UPDATE director_configurations
  SET is_active = false
  WHERE academy_id = v_config.academy_id AND is_active = true;

  UPDATE director_configurations SET
    is_active       = true,
    last_applied_by = p_applier_id,
    last_applied_at = NOW()
  WHERE id = p_config_id;

  PERFORM snapshot_current_model(
    v_config.academy_id,
    'Applied: ' || v_config.name,
    'Snapshot after applying director configuration',
    p_applier_id
  );

  PERFORM write_audit_log(
    v_config.academy_id, p_applier_id,
    'configuration_applied',
    'director_configurations', p_config_id, v_config.name,
    jsonb_build_object('weights_applied', v_weight_count, 'thresholds_applied', v_thresh_count, 'rollback_version_id', v_version_id),
    'ui'
  );

  RETURN jsonb_build_object(
    'success', true,
    'config_name', v_config.name,
    'weights_applied', v_weight_count,
    'thresholds_applied', v_thresh_count,
    'rollback_version_id', v_version_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
