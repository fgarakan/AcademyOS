-- ============================================================
-- ACADEMY OS — MIGRATION 034: DATA FLYWHEEL LAYER
-- Derives intelligence from accumulated usage data:
--   • Which signal types actually predict positive outcomes?
--   • Which exercises actually produce measurable improvement?
--   • How is the system being used, and are decisions getting better?
--
-- Loop integration:
--   ← recommendation_overrides (022) — outcome verdicts
--   ← decision_learning_logs (022) — score deltas
--   ← player_outcomes (016) — session performance
--   ← exercise_outcome_improvements (025) — expected vs actual
--   ← model_evaluation_runs (030) — overall model performance
--   → signal_priority_weights (019) — proposed weight adjustments
--   → director_configurations (033) — proposals go to director approval
--   → model_versions (030) — flywheel-adjusted snapshot
--
-- Design: the flywheel does NOT auto-apply weight changes.
-- It PROPOSES them. Directors review via director_configurations.
-- propose_weight_adjustments() writes a new director configuration
-- with suggested weights. Applying it is an explicit human action.
-- This preserves human oversight while closing the learning loop.
-- ============================================================

-- ============================================================
-- SIGNAL EFFECTIVENESS SCORES
-- Per signal_type: how reliably does this signal predict a
-- positive outcome 30 days after a recommendation it drove?
-- ============================================================
CREATE TABLE signal_effectiveness_scores (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id             UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  signal_type            signal_type NOT NULL,

  -- Sample size
  sample_count           INTEGER NOT NULL DEFAULT 0,
  -- Recommendations driven by this signal type that were evaluated

  -- Outcome rates
  positive_rate          NUMERIC(5,4) NOT NULL DEFAULT 0.500,
  -- % of driven recommendations with outcome_verdict = 'better'

  negative_rate          NUMERIC(5,4) NOT NULL DEFAULT 0.000,
  override_rate          NUMERIC(5,4) NOT NULL DEFAULT 0.000,
  -- % of recommendations of this type that were overridden

  avg_score_delta        NUMERIC(6,3),
  -- Average score_delta_30d for recommendations driven by this signal

  -- Composite effectiveness score (0–2.0 scale, matches weight range)
  -- 1.0 = neutral; < 1.0 = over-weighted; > 1.0 = under-weighted
  effectiveness_score    NUMERIC(4,3) NOT NULL DEFAULT 1.000,

  -- Suggested weight adjustment
  suggested_weight       NUMERIC(4,2),
  -- NULL = no change suggested

  computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(academy_id, signal_type)
);

CREATE INDEX idx_signal_effectiveness_academy ON signal_effectiveness_scores(academy_id, computed_at DESC);

-- ============================================================
-- EXERCISE EFFECTIVENESS SCORES
-- Per exercise: does it produce the improvement outcomes predict?
-- Compares exercise_outcome_improvements.expected_delta vs
-- actual score changes in player_progression after sessions
-- containing this exercise.
-- ============================================================
CREATE TABLE exercise_effectiveness_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  exercise_id       UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- Sample: how many session outcomes included this exercise
  session_count     INTEGER NOT NULL DEFAULT 0,

  -- Avg performance_rating when this exercise was in the session
  avg_perf_rating   NUMERIC(4,2),
  -- Avg coach engagement score
  avg_engagement    NUMERIC(4,2),

  -- Outcome quality (plan_achieved rate)
  plan_achieved_rate NUMERIC(5,4),

  -- Effectiveness vs. expected_delta from exercise_outcome_improvements
  expected_improvement NUMERIC(5,4),
  -- weighted avg of expected_delta across mapped dimensions

  -- Composite effectiveness score (0.0–2.0)
  effectiveness_score NUMERIC(4,3) NOT NULL DEFAULT 1.000,

  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(academy_id, exercise_id)
);

CREATE INDEX idx_exercise_effectiveness_academy ON exercise_effectiveness_scores(academy_id);

-- ============================================================
-- SYSTEM USAGE METRICS
-- Daily snapshot of system activity. Used to track health,
-- adoption, and whether the engine is being used well.
-- ============================================================
CREATE TABLE system_usage_metrics (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  metric_date               DATE NOT NULL,

  -- Engine activity
  engine_runs_total         INTEGER NOT NULL DEFAULT 0,
  players_scored            INTEGER NOT NULL DEFAULT 0,
  signals_emitted           INTEGER NOT NULL DEFAULT 0,
  signals_resolved          INTEGER NOT NULL DEFAULT 0,
  recommendations_generated INTEGER NOT NULL DEFAULT 0,
  recommendations_approved  INTEGER NOT NULL DEFAULT 0,
  recommendations_overridden INTEGER NOT NULL DEFAULT 0,
  recommendations_expired   INTEGER NOT NULL DEFAULT 0,

  -- Coaching output
  coaching_messages_generated INTEGER NOT NULL DEFAULT 0,
  coaching_messages_sent      INTEGER NOT NULL DEFAULT 0,

  -- Model quality
  override_rate_7d          NUMERIC(5,4),
  -- Rolling 7-day override rate at time of snapshot
  approval_rate_7d          NUMERIC(5,4),
  active_model_version_id   UUID REFERENCES model_versions(id) ON DELETE SET NULL,

  -- Player engagement
  active_player_count       INTEGER NOT NULL DEFAULT 0,
  players_with_signals      INTEGER NOT NULL DEFAULT 0,
  players_with_recs         INTEGER NOT NULL DEFAULT 0,

  recorded_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(academy_id, metric_date)
);

CREATE INDEX idx_usage_metrics_academy ON system_usage_metrics(academy_id, metric_date DESC);

-- ============================================================
-- FLYWHEEL INSIGHTS
-- Narrative observations generated by run_flywheel().
-- Stored for the director dashboard — not signals.
-- ============================================================
CREATE TABLE flywheel_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  insight_type  TEXT NOT NULL CHECK (insight_type IN (
    'weight_recommendation',
    'exercise_effectiveness',
    'model_drift',
    'usage_pattern',
    'signal_overuse',
    'signal_underuse'
  )),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  severity      TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','action_required')),
  is_actioned   BOOLEAN NOT NULL DEFAULT false,
  actioned_at   TIMESTAMPTZ,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flywheel_insights_academy ON flywheel_insights(academy_id, generated_at DESC);
CREATE INDEX idx_flywheel_insights_unread  ON flywheel_insights(academy_id, is_actioned) WHERE is_actioned = false;

-- ============================================================
-- COMPUTE_SIGNAL_EFFECTIVENESS()
-- For each signal_type, compute how often it drove a
-- recommendation that resulted in a positive outcome.
-- ============================================================
CREATE OR REPLACE FUNCTION compute_signal_effectiveness(p_academy_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_sig_type     signal_type;
  v_sample       INTEGER;
  v_positive     INTEGER;
  v_negative     INTEGER;
  v_overrides    INTEGER;
  v_avg_delta    NUMERIC;
  v_pos_rate     NUMERIC;
  v_neg_rate     NUMERIC;
  v_ovr_rate     NUMERIC;
  v_eff_score    NUMERIC;
  v_suggested_wt NUMERIC;
  v_current_wt   NUMERIC;
  v_count        INTEGER := 0;
BEGIN
  FOR v_sig_type IN
    SELECT DISTINCT signal_type FROM signal_priority_weights WHERE academy_id = p_academy_id
  LOOP
    -- Recommendations driven by this signal type (via reasoning)
    SELECT
      COUNT(DISTINCT pr.id),
      COUNT(DISTINCT pr.id) FILTER (WHERE ro.outcome_verdict = 'better'),
      COUNT(DISTINCT pr.id) FILTER (WHERE ro.outcome_verdict = 'worse'),
      COUNT(DISTINCT pr.id) FILTER (WHERE pr.status IN ('overridden','rejected')),
      AVG(dll.score_delta_30d)
    INTO v_sample, v_positive, v_negative, v_overrides, v_avg_delta
    FROM player_recommendations pr
    JOIN recommendation_reasoning rr ON rr.recommendation_id = pr.id
    LEFT JOIN recommendation_overrides ro ON ro.recommendation_id = pr.id AND ro.outcome_evaluated = true
    LEFT JOIN decision_learning_logs dll ON dll.player_id = pr.player_id
      AND dll.cycle_date = pr.generated_at::DATE AND dll.outcome_evaluated = true
    WHERE pr.academy_id = p_academy_id
    -- Signal drove this recommendation: check if signal_type appears in reasoning
    AND rr.signal_summary @> jsonb_build_array(jsonb_build_object('type', v_sig_type::TEXT))
    AND pr.generated_at >= NOW() - INTERVAL '90 days';

    IF COALESCE(v_sample, 0) < 3 THEN CONTINUE; END IF;

    v_pos_rate := COALESCE(v_positive::NUMERIC / NULLIF(v_sample, 0), 0.5);
    v_neg_rate := COALESCE(v_negative::NUMERIC / NULLIF(v_sample, 0), 0);
    v_ovr_rate := COALESCE(v_overrides::NUMERIC / NULLIF(v_sample, 0), 0);

    -- Effectiveness: positive_rate drives score, override_rate penalises
    -- Scale: 0.5 (never useful) → 1.5 (very useful)
    v_eff_score := ROUND(LEAST(1.8, GREATEST(0.4,
      0.5 + (v_pos_rate * 1.0) - (v_neg_rate * 0.5) - (v_ovr_rate * 0.3)
    )), 3);

    -- Suggest weight = current_weight * (eff_score / 1.0), clamped to 0.2–2.0
    SELECT weight INTO v_current_wt
    FROM signal_priority_weights
    WHERE academy_id = p_academy_id AND signal_type = v_sig_type AND is_active = true;

    v_suggested_wt := CASE
      WHEN ABS(v_eff_score - 1.0) < 0.10 THEN NULL  -- no change needed
      ELSE ROUND(LEAST(2.0, GREATEST(0.2, COALESCE(v_current_wt, 1.0) * v_eff_score)), 2)
    END;

    INSERT INTO signal_effectiveness_scores (
      academy_id, signal_type,
      sample_count, positive_rate, negative_rate, override_rate,
      avg_score_delta, effectiveness_score, suggested_weight
    ) VALUES (
      p_academy_id, v_sig_type,
      v_sample, v_pos_rate, v_neg_rate, v_ovr_rate,
      v_avg_delta, v_eff_score, v_suggested_wt
    )
    ON CONFLICT (academy_id, signal_type) DO UPDATE SET
      sample_count        = EXCLUDED.sample_count,
      positive_rate       = EXCLUDED.positive_rate,
      negative_rate       = EXCLUDED.negative_rate,
      override_rate       = EXCLUDED.override_rate,
      avg_score_delta     = EXCLUDED.avg_score_delta,
      effectiveness_score = EXCLUDED.effectiveness_score,
      suggested_weight    = EXCLUDED.suggested_weight,
      computed_at         = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMPUTE_EXERCISE_EFFECTIVENESS()
-- For each exercise, compare actual session outcomes against
-- the expected_delta from exercise_outcome_improvements.
-- ============================================================
CREATE OR REPLACE FUNCTION compute_exercise_effectiveness(p_academy_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_ex      RECORD;
  v_sessions INTEGER;
  v_avg_perf NUMERIC;
  v_avg_eng  NUMERIC;
  v_plan_rate NUMERIC;
  v_expected  NUMERIC;
  v_eff_score NUMERIC;
  v_count     INTEGER := 0;
BEGIN
  FOR v_ex IN
    SELECT DISTINCT e.id, e.name
    FROM exercises e
    WHERE e.academy_id = p_academy_id AND e.is_active = true
  LOOP
    SELECT
      COUNT(DISTINCT sbe.session_block_id),
      AVG(po.performance_rating),
      AVG(po.engagement_level),
      COALESCE(AVG(CASE WHEN po.plan_achieved THEN 1.0 ELSE 0.0 END), 0.5)
    INTO v_sessions, v_avg_perf, v_avg_eng, v_plan_rate
    FROM session_block_exercises sbe
    JOIN session_blocks sb ON sb.id = sbe.session_block_id
    JOIN sessions s ON s.id = sb.session_id AND s.status = 'completed'
    LEFT JOIN player_outcomes po ON po.session_id = s.id
    WHERE sbe.exercise_id = v_ex.id
    AND s.academy_id = p_academy_id
    AND s.scheduled_date >= CURRENT_DATE - 90;

    IF COALESCE(v_sessions, 0) < 3 THEN CONTINUE; END IF;

    -- Expected improvement (average across mapped outcome dimensions)
    SELECT COALESCE(AVG(expected_delta), 0.05)
    INTO v_expected
    FROM exercise_outcome_improvements
    WHERE academy_id = p_academy_id AND exercise_id = v_ex.id;

    -- Effectiveness: plan_achieved_rate + avg_perf on 10-scale normalised
    v_eff_score := ROUND(LEAST(2.0, GREATEST(0.2,
      (v_plan_rate * 0.5) + (COALESCE(v_avg_perf, 5) / 10.0 * 0.5)
    )), 3);

    INSERT INTO exercise_effectiveness_scores (
      academy_id, exercise_id,
      session_count, avg_perf_rating, avg_engagement,
      plan_achieved_rate, expected_improvement, effectiveness_score
    ) VALUES (
      p_academy_id, v_ex.id,
      v_sessions, v_avg_perf, v_avg_eng,
      v_plan_rate, v_expected, v_eff_score
    )
    ON CONFLICT (academy_id, exercise_id) DO UPDATE SET
      session_count       = EXCLUDED.session_count,
      avg_perf_rating     = EXCLUDED.avg_perf_rating,
      avg_engagement      = EXCLUDED.avg_engagement,
      plan_achieved_rate  = EXCLUDED.plan_achieved_rate,
      expected_improvement = EXCLUDED.expected_improvement,
      effectiveness_score = EXCLUDED.effectiveness_score,
      computed_at         = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECORD_USAGE_METRICS()
-- Snapshots today's system activity metrics.
-- Called by run_flywheel() nightly.
-- ============================================================
CREATE OR REPLACE FUNCTION record_usage_metrics(p_academy_id UUID)
RETURNS UUID AS $$
DECLARE
  v_engines    INTEGER; v_scored    INTEGER; v_emitted   INTEGER;
  v_resolved   INTEGER; v_gen_recs  INTEGER; v_approved  INTEGER;
  v_overridden INTEGER; v_expired   INTEGER;
  v_msg_gen    INTEGER; v_msg_sent  INTEGER;
  v_ovr_rate   NUMERIC; v_app_rate  NUMERIC;
  v_active_pl  INTEGER; v_w_signals INTEGER; v_w_recs    INTEGER;
  v_version_id UUID;
  v_id         UUID;
BEGIN
  -- Decision cycle count today (proxy for engine_runs)
  SELECT COUNT(*) INTO v_engines
  FROM decision_learning_logs dll
  JOIN players p ON p.id = dll.player_id AND p.academy_id = p_academy_id
  WHERE dll.cycle_date = CURRENT_DATE;

  -- Signal activity
  SELECT
    COUNT(*) FILTER (WHERE emitted_at::DATE = CURRENT_DATE),
    COUNT(*) FILTER (WHERE resolved_at::DATE = CURRENT_DATE)
  INTO v_emitted, v_resolved
  FROM player_development_signals
  WHERE academy_id = p_academy_id;

  -- Recommendation activity today
  SELECT
    COUNT(*) FILTER (WHERE generated_at::DATE = CURRENT_DATE),
    COUNT(*) FILTER (WHERE reviewed_at::DATE = CURRENT_DATE AND status = 'approved'),
    COUNT(*) FILTER (WHERE overridden_at::DATE = CURRENT_DATE),
    COUNT(*) FILTER (WHERE status = 'expired' AND updated_at::DATE = CURRENT_DATE)
  INTO v_gen_recs, v_approved, v_overridden, v_expired
  FROM player_recommendations
  WHERE academy_id = p_academy_id;

  -- Coaching messages
  SELECT
    COUNT(*) FILTER (WHERE created_at::DATE = CURRENT_DATE),
    COUNT(*) FILTER (WHERE sent_at::DATE = CURRENT_DATE)
  INTO v_msg_gen, v_msg_sent
  FROM coaching_messages
  WHERE academy_id = p_academy_id;

  -- 7-day rates
  SELECT
    ROUND(COUNT(*) FILTER (WHERE status IN ('overridden','rejected'))::NUMERIC / NULLIF(COUNT(*), 0), 4),
    ROUND(COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / NULLIF(COUNT(*), 0), 4)
  INTO v_ovr_rate, v_app_rate
  FROM player_recommendations
  WHERE academy_id = p_academy_id
  AND generated_at >= NOW() - INTERVAL '7 days';

  -- Player engagement
  SELECT
    COUNT(*) FILTER (WHERE is_active = true AND status = 'active'),
    COUNT(DISTINCT pds.player_id),
    COUNT(DISTINCT pr2.player_id)
  INTO v_active_pl, v_w_signals, v_w_recs
  FROM players p
  LEFT JOIN player_development_signals pds ON pds.player_id = p.id
    AND pds.is_active = true AND p.academy_id = p_academy_id
  LEFT JOIN player_recommendations pr2 ON pr2.player_id = p.id
    AND pr2.status = 'pending_review' AND pr2.academy_id = p_academy_id
  WHERE p.academy_id = p_academy_id;

  SELECT id INTO v_version_id FROM model_versions
  WHERE academy_id = p_academy_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;

  INSERT INTO system_usage_metrics (
    academy_id, metric_date,
    engine_runs_total, players_scored,
    signals_emitted, signals_resolved,
    recommendations_generated, recommendations_approved,
    recommendations_overridden, recommendations_expired,
    coaching_messages_generated, coaching_messages_sent,
    override_rate_7d, approval_rate_7d,
    active_model_version_id,
    active_player_count, players_with_signals, players_with_recs
  ) VALUES (
    p_academy_id, CURRENT_DATE,
    v_engines, COALESCE(v_engines, 0),
    COALESCE(v_emitted, 0), COALESCE(v_resolved, 0),
    COALESCE(v_gen_recs, 0), COALESCE(v_approved, 0),
    COALESCE(v_overridden, 0), COALESCE(v_expired, 0),
    COALESCE(v_msg_gen, 0), COALESCE(v_msg_sent, 0),
    v_ovr_rate, v_app_rate,
    v_version_id,
    COALESCE(v_active_pl, 0), COALESCE(v_w_signals, 0), COALESCE(v_w_recs, 0)
  )
  ON CONFLICT (academy_id, metric_date) DO UPDATE SET
    engine_runs_total           = EXCLUDED.engine_runs_total,
    players_scored              = EXCLUDED.players_scored,
    signals_emitted             = EXCLUDED.signals_emitted,
    signals_resolved            = EXCLUDED.signals_resolved,
    recommendations_generated   = EXCLUDED.recommendations_generated,
    recommendations_approved    = EXCLUDED.recommendations_approved,
    recommendations_overridden  = EXCLUDED.recommendations_overridden,
    recommendations_expired     = EXCLUDED.recommendations_expired,
    coaching_messages_generated = EXCLUDED.coaching_messages_generated,
    coaching_messages_sent      = EXCLUDED.coaching_messages_sent,
    override_rate_7d            = EXCLUDED.override_rate_7d,
    approval_rate_7d            = EXCLUDED.approval_rate_7d,
    active_model_version_id     = EXCLUDED.active_model_version_id,
    active_player_count         = EXCLUDED.active_player_count,
    players_with_signals        = EXCLUDED.players_with_signals,
    players_with_recs           = EXCLUDED.players_with_recs,
    recorded_at                 = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROPOSE_WEIGHT_ADJUSTMENTS()
-- Creates a new director_configuration with suggested weights
-- based on signal effectiveness scores.
-- Returns JSONB summary of what changed. Does NOT auto-apply.
-- ============================================================
CREATE OR REPLACE FUNCTION propose_weight_adjustments(p_academy_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_eff         signal_effectiveness_scores%ROWTYPE;
  v_proposals   JSONB := '[]'::JSONB;
  v_count       INTEGER := 0;
  v_config_id   UUID;
  v_config_snap JSONB;
  v_weights     JSONB;
  v_thresh      JSONB;
BEGIN
  -- Only propose if enough data (3+ signals with suggestions)
  SELECT COUNT(*) INTO v_count
  FROM signal_effectiveness_scores
  WHERE academy_id = p_academy_id
  AND suggested_weight IS NOT NULL
  AND sample_count >= 5;

  IF v_count < 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'Insufficient data: need ≥3 signal types with ≥5 samples each',
      'proposal_count', 0
    );
  END IF;

  -- Build proposed weights: start from current weights, override with suggestions
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'signal_type',           spw.signal_type,
      'weight',                COALESCE(ses.suggested_weight, spw.weight),
      'low_multiplier',        spw.low_multiplier,
      'medium_multiplier',     spw.medium_multiplier,
      'high_multiplier',       spw.high_multiplier,
      'critical_multiplier',   spw.critical_multiplier,
      'min_confidence',        spw.min_confidence,
      'is_active',             spw.is_active
    ) ORDER BY spw.signal_type::TEXT
  ), '[]'::JSONB)
  INTO v_weights
  FROM signal_priority_weights spw
  LEFT JOIN signal_effectiveness_scores ses
    ON ses.academy_id = spw.academy_id AND ses.signal_type = spw.signal_type
  WHERE spw.academy_id = p_academy_id;

  -- Collect human-readable proposals
  FOR v_eff IN
    SELECT * FROM signal_effectiveness_scores
    WHERE academy_id = p_academy_id AND suggested_weight IS NOT NULL
  LOOP
    DECLARE
      v_current NUMERIC;
    BEGIN
      SELECT weight INTO v_current
      FROM signal_priority_weights
      WHERE academy_id = p_academy_id AND signal_type = v_eff.signal_type;

      v_proposals := v_proposals || jsonb_build_object(
        'signal_type',       v_eff.signal_type,
        'current_weight',    v_current,
        'suggested_weight',  v_eff.suggested_weight,
        'effectiveness',     v_eff.effectiveness_score,
        'positive_rate',     v_eff.positive_rate,
        'sample_count',      v_eff.sample_count,
        'reason', CASE
          WHEN v_eff.effectiveness_score > 1.1 THEN 'Signal has high positive outcome rate — weight increase recommended'
          WHEN v_eff.effectiveness_score < 0.9 THEN 'Signal has low positive outcome rate or high override rate — weight reduction recommended'
          ELSE 'Minor adjustment'
        END
      );
    END;
  END LOOP;

  v_thresh := get_academy_thresholds(p_academy_id);

  -- Save as a new director_configuration (awaiting activation)
  INSERT INTO director_configurations (
    academy_id, name, description,
    configuration_snapshot
  ) VALUES (
    p_academy_id,
    'Flywheel Proposal — ' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
    'Auto-generated weight adjustment proposal from data flywheel. Review and activate if appropriate.',
    jsonb_build_object(
      'signal_weights', v_weights,
      'thresholds',     v_thresh,
      'proposals',      v_proposals,
      'generated_at',   NOW()
    )
  )
  RETURNING id INTO v_config_id;

  -- Generate flywheel insight
  INSERT INTO flywheel_insights (
    academy_id, insight_type, title, body, data, severity
  ) VALUES (
    p_academy_id,
    'weight_recommendation',
    'Weight adjustment proposal ready',
    'The flywheel has analysed ' || v_count || ' signal types with sufficient outcome data and generated weight adjustment proposals. Review in Director Control → Configurations.',
    jsonb_build_object(
      'config_id', v_config_id,
      'proposal_count', jsonb_array_length(v_proposals),
      'proposals', v_proposals
    ),
    'action_required'
  );

  RETURN jsonb_build_object(
    'success', true,
    'config_id', v_config_id,
    'proposal_count', jsonb_array_length(v_proposals),
    'proposals', v_proposals
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RUN_FLYWHEEL()
-- Orchestrates the weekly data flywheel pipeline:
-- 1. Compute signal effectiveness from outcomes
-- 2. Compute exercise effectiveness from sessions
-- 3. Record today's usage metrics
-- 4. Propose weight adjustments (if enough data)
-- 5. Evaluate model performance (last 30 days)
-- ============================================================
CREATE OR REPLACE FUNCTION run_flywheel(p_academy_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_sig_count  INTEGER;
  v_ex_count   INTEGER;
  v_usage_id   UUID;
  v_proposal   JSONB;
  v_eval_id    UUID;
  v_version_id UUID;
BEGIN
  v_sig_count := compute_signal_effectiveness(p_academy_id);
  v_ex_count  := compute_exercise_effectiveness(p_academy_id);
  v_usage_id  := record_usage_metrics(p_academy_id);
  v_proposal  := propose_weight_adjustments(p_academy_id);

  -- Evaluate model performance over last 30 days
  SELECT id INTO v_version_id FROM model_versions
  WHERE academy_id = p_academy_id AND is_active = true
  ORDER BY created_at DESC LIMIT 1;

  v_eval_id := evaluate_model_performance(
    p_academy_id,
    NOW() - INTERVAL '30 days',
    NOW(),
    v_version_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'signal_types_evaluated', v_sig_count,
    'exercises_evaluated', v_ex_count,
    'usage_metrics_id', v_usage_id,
    'proposal', v_proposal,
    'evaluation_id', v_eval_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Final RUN_FULL_ENGINE() — complete 10-layer version
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
  v_message_count    INTEGER := 0;
  v_cohort_count     INTEGER := 0;
  v_rec_ids          UUID[] := '{}';
BEGIN
  -- 1. Score (thresholds from academy_threshold_configs, behavioral model)
  v_score_id := score_player(p_player_id, p_academy_id);

  -- 2. Priorities
  v_priority_count := generate_player_priorities(p_player_id, p_academy_id);

  -- 3. Recommendations
  v_rec_result := generate_player_recommendations(p_player_id, p_academy_id);

  -- 4. Reasoning + exercises
  FOR v_rec IN
    SELECT * FROM player_recommendations
    WHERE player_id = p_player_id
    AND   academy_id = p_academy_id
    AND   status = 'pending_review'
    AND   generated_at > NOW() - INTERVAL '1 minute'
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

  -- 5. Predictions
  v_prediction_id := generate_player_predictions(p_player_id, p_academy_id, 30);

  -- 6. Coaching messages
  FOR v_rec IN
    SELECT * FROM player_recommendations
    WHERE player_id = p_player_id
    AND   academy_id = p_academy_id
    AND   status = 'pending_review'
    AND   generated_at > NOW() - INTERVAL '1 minute'
  LOOP
    PERFORM generate_coaching_message(v_rec.id);
    v_message_count := v_message_count + 1;
  END LOOP;

  -- 7. Cohort assignment (per-player; stats recomputed in nightly batch)
  v_cohort_count := assign_player_to_cohorts(p_player_id, p_academy_id);

  -- 8. Benchmark comparison (per-player; signals emitted if off-target)
  PERFORM compute_player_benchmarks(p_player_id, p_academy_id);

  -- 9. Log decision cycle
  PERFORM log_decision_cycle(p_player_id, p_academy_id, v_score_id, v_rec_ids);

  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_player_id,
    'score_id', v_score_id,
    'priorities_generated', v_priority_count,
    'recommendations', v_rec_result,
    'reasoning_built', v_reasoning_count,
    'exercises_populated', v_exercise_count,
    'prediction_id', v_prediction_id,
    'messages_generated', v_message_count,
    'cohorts_assigned', v_cohort_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View: v_flywheel_dashboard — director overview
-- ============================================================
CREATE OR REPLACE VIEW v_flywheel_dashboard AS
SELECT
  ses.academy_id,
  ses.signal_type,
  spw.weight AS current_weight,
  ses.effectiveness_score,
  ses.suggested_weight,
  ses.positive_rate,
  ses.override_rate,
  ses.sample_count,
  ses.avg_score_delta,
  ses.computed_at
FROM signal_effectiveness_scores ses
JOIN signal_priority_weights spw
  ON spw.academy_id = ses.academy_id AND spw.signal_type = ses.signal_type
ORDER BY ABS(ses.effectiveness_score - 1.0) DESC;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE signal_effectiveness_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_effectiveness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_usage_metrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE flywheel_insights             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see signal effectiveness"    ON signal_effectiveness_scores  FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages signal eff"         ON signal_effectiveness_scores  FOR ALL   USING (academy_id = auth_academy_id());

CREATE POLICY "Staff see exercise effectiveness"  ON exercise_effectiveness_scores FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages exercise eff"       ON exercise_effectiveness_scores FOR ALL   USING (academy_id = auth_academy_id());

CREATE POLICY "Staff see usage metrics"           ON system_usage_metrics FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages usage metrics"      ON system_usage_metrics FOR ALL   USING (academy_id = auth_academy_id());

CREATE POLICY "Directors see flywheel insights"   ON flywheel_insights FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "System manages flywheel insights"  ON flywheel_insights FOR ALL   USING (academy_id = auth_academy_id());
