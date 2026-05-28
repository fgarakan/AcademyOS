-- ============================================================
-- ACADEMY OS — MIGRATION 027: PLAYER BEHAVIORAL MODEL
-- player_behavior_profiles: individual learning and response traits
-- that modify how the decision engine weights recommendations.
--
-- Loop integration:
--   ← player_development_signals (014) — behavioral signals feed profile
--   ← player_load_aggregation (018) — fatigue response calibration
--   ← player_outcomes (016) — session outcomes refine behavioral profile
--   ↔ decision_scores (019) — behavioral factor applied in score_player()
--   → recommendation_reasoning (026) — behavioral_adjustments JSONB populated
--   → coaching_messages (029) — tone and approach determined by profile
--
-- Design: profiles are seeded with defaults on player creation and
-- refined over time via evaluate_behavior_profile(). The behavioral
-- adjustment factor softens or amplifies the composite score without
-- changing the signal weights — it is a per-player sensitivity layer.
-- ============================================================

-- ============================================================
-- PLAYER BEHAVIOR PROFILES
-- One row per player. Reflects how this player responds to training
-- load, competition pressure, volume, and coaching style.
-- ============================================================
CREATE TABLE player_behavior_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE UNIQUE,

  -- Fatigue sensitivity: how quickly this player degrades under load
  -- 0.0 = highly resilient, 1.0 = very sensitive
  fatigue_sensitivity   NUMERIC(4,3) NOT NULL DEFAULT 0.500
                        CHECK (fatigue_sensitivity BETWEEN 0 AND 1),

  -- Volume response: how this player responds to training volume
  volume_response       TEXT NOT NULL DEFAULT 'moderate'
                        CHECK (volume_response IN ('high_volume', 'moderate', 'low_volume')),

  -- Competition response: performance motivation source
  competition_response  TEXT NOT NULL DEFAULT 'neutral'
                        CHECK (competition_response IN ('match_motivated', 'training_motivated', 'neutral')),

  -- Preferred coaching/learning modality
  learning_preference   TEXT NOT NULL DEFAULT 'drill_heavy'
                        CHECK (learning_preference IN (
                          'drill_heavy', 'game_based', 'video_analysis', 'verbal_cues'
                        )),

  -- Pressure tolerance: performance under stress (0=cracks, 1=thrives)
  pressure_tolerance    NUMERIC(4,3) NOT NULL DEFAULT 0.500
                        CHECK (pressure_tolerance BETWEEN 0 AND 1),

  -- Recovery rate: how fast this player returns to baseline after load
  recovery_rate         TEXT NOT NULL DEFAULT 'moderate'
                        CHECK (recovery_rate IN ('fast', 'moderate', 'slow')),

  -- Load adjustment factor applied to recommendations
  -- Computed from fatigue_sensitivity + recovery_rate. Range: 0.60–1.20.
  -- < 1.0 = reduce load, > 1.0 = can handle more
  load_adjustment_factor NUMERIC(4,3) NOT NULL DEFAULT 1.000
                         CHECK (load_adjustment_factor BETWEEN 0.5 AND 1.5),

  -- Competition readiness modifier: boosts competition-domain priority
  -- for match-motivated players, lowers for training-motivated
  competition_modifier  NUMERIC(4,3) NOT NULL DEFAULT 1.000
                        CHECK (competition_modifier BETWEEN 0.5 AND 1.5),

  -- Data confidence: how many sessions/outcomes has this been calibrated on
  calibration_count     INTEGER NOT NULL DEFAULT 0,
  last_calibrated_at    TIMESTAMPTZ,

  -- Free-text coach notes on behavioral patterns
  coach_observations    TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_behavior_profiles_player  ON player_behavior_profiles(player_id);
CREATE INDEX idx_behavior_profiles_academy ON player_behavior_profiles(academy_id);

CREATE TRIGGER tr_behavior_profiles_updated_at
  BEFORE UPDATE ON player_behavior_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: Auto-create default behavior profile on player INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION tr_create_default_behavior_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_behavior_profiles (academy_id, player_id)
  VALUES (NEW.academy_id, NEW.id)
  ON CONFLICT (player_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_player_creates_behavior_profile
  AFTER INSERT ON players
  FOR EACH ROW EXECUTE FUNCTION tr_create_default_behavior_profile();

-- ============================================================
-- SEED: Create profiles for existing demo players
-- ============================================================
INSERT INTO player_behavior_profiles (academy_id, player_id, fatigue_sensitivity, volume_response, competition_response, learning_preference, pressure_tolerance, recovery_rate, load_adjustment_factor, competition_modifier)
SELECT
  p.academy_id,
  p.id,
  CASE p.first_name
    WHEN 'Alex'    THEN 0.400  -- resilient
    WHEN 'Sofia'   THEN 0.650  -- moderately sensitive
    WHEN 'Jordan'  THEN 0.500  -- average
    WHEN 'Marcus'  THEN 0.700  -- sensitive (high fatigue context)
    ELSE 0.500
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 'high_volume'
    WHEN 'Sofia'   THEN 'moderate'
    WHEN 'Jordan'  THEN 'moderate'
    WHEN 'Marcus'  THEN 'low_volume'
    ELSE 'moderate'
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 'match_motivated'
    WHEN 'Sofia'   THEN 'training_motivated'
    WHEN 'Jordan'  THEN 'neutral'
    WHEN 'Marcus'  THEN 'match_motivated'
    ELSE 'neutral'
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 'game_based'
    WHEN 'Sofia'   THEN 'drill_heavy'
    WHEN 'Jordan'  THEN 'verbal_cues'
    WHEN 'Marcus'  THEN 'video_analysis'
    ELSE 'drill_heavy'
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 0.800
    WHEN 'Sofia'   THEN 0.500
    WHEN 'Jordan'  THEN 0.600
    WHEN 'Marcus'  THEN 0.400  -- low pressure tolerance matches active signals
    ELSE 0.500
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 'fast'
    WHEN 'Sofia'   THEN 'moderate'
    WHEN 'Jordan'  THEN 'moderate'
    WHEN 'Marcus'  THEN 'slow'
    ELSE 'moderate'
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 1.150  -- can handle more
    WHEN 'Sofia'   THEN 0.950
    WHEN 'Jordan'  THEN 1.000
    WHEN 'Marcus'  THEN 0.750  -- load-reduced
    ELSE 1.000
  END,
  CASE p.first_name
    WHEN 'Alex'    THEN 1.200  -- match-motivated: boost competition priority
    WHEN 'Sofia'   THEN 0.800  -- training-motivated: de-emphasize competition priority
    WHEN 'Jordan'  THEN 1.000
    WHEN 'Marcus'  THEN 1.100
    ELSE 1.000
  END
FROM players p
WHERE p.academy_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (player_id) DO NOTHING;

-- ============================================================
-- COMPUTE_LOAD_ADJUSTMENT_FACTOR()
-- Recomputes load_adjustment_factor from fatigue_sensitivity +
-- recovery_rate. Called by evaluate_behavior_profile().
-- ============================================================
CREATE OR REPLACE FUNCTION compute_load_adjustment_factor(
  p_fatigue_sensitivity NUMERIC,
  p_recovery_rate       TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_recovery_score NUMERIC;
  v_factor NUMERIC;
BEGIN
  v_recovery_score := CASE p_recovery_rate
    WHEN 'fast'     THEN 0.2
    WHEN 'moderate' THEN 0.0
    WHEN 'slow'     THEN -0.2
    ELSE 0.0
  END;

  -- Base: 1.0. High fatigue sensitivity reduces load; fast recovery increases it.
  v_factor := 1.0
    - (p_fatigue_sensitivity - 0.5) * 0.4  -- range: -0.2 to +0.2
    + v_recovery_score;                     -- range: -0.2 to +0.2

  RETURN GREATEST(0.6, LEAST(1.4, ROUND(v_factor, 3)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- EVALUATE_BEHAVIOR_PROFILE()
-- Calibrates behavioral profile from actual session outcomes.
-- Compares expected vs. actual performance under different
-- load levels. Called weekly or after significant outcome batches.
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
  SELECT * INTO v_profile FROM player_behavior_profiles WHERE player_id = p_player_id;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_load FROM player_load_aggregation WHERE player_id = p_player_id;

  -- Measure performance delta between high-load and low-load periods
  SELECT
    AVG(CASE WHEN o.perceived_load >= 4 THEN o.performance_rating END),
    AVG(CASE WHEN o.perceived_load <= 2 THEN o.performance_rating END),
    COUNT(*)
  INTO v_avg_perf_high, v_avg_perf_low, v_outcome_count
  FROM player_outcomes o
  WHERE o.player_id = p_player_id
  AND o.recorded_at >= NOW() - INTERVAL '90 days';

  -- Need at least 10 outcomes to calibrate
  IF v_outcome_count < 10 THEN RETURN false; END IF;

  -- Adjust fatigue sensitivity based on performance delta under load
  IF v_avg_perf_high IS NOT NULL AND v_avg_perf_low IS NOT NULL THEN
    DECLARE
      v_perf_drop NUMERIC := v_avg_perf_low - v_avg_perf_high;
    BEGIN
      IF v_perf_drop > 1.5 THEN
        -- Significant drop under high load: more sensitive
        v_new_sensitivity := LEAST(1.0, v_profile.fatigue_sensitivity + 0.10);
      ELSIF v_perf_drop < 0.3 THEN
        -- Minimal drop: more resilient
        v_new_sensitivity := GREATEST(0.0, v_profile.fatigue_sensitivity - 0.05);
      ELSE
        v_new_sensitivity := v_profile.fatigue_sensitivity;
      END IF;
    END;
  ELSE
    v_new_sensitivity := v_profile.fatigue_sensitivity;
  END IF;

  -- Recovery rate from actual load trend behavior
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
-- Update SCORE_PLAYER() to apply behavioral adjustment factor.
-- Behavioral profile modifies the composite score, not domain
-- sub-scores, to preserve the signal reasoning chain.
-- ============================================================
CREATE OR REPLACE FUNCTION score_player(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_sig        RECORD;
  v_weight     RECORD;
  v_skill      NUMERIC := 0;
  v_comp       NUMERIC := 0;
  v_fitness    NUMERIC := 0;
  v_behavioral NUMERIC := 0;
  v_composite  NUMERIC := 0;
  v_signal_ids UUID[] := '{}';
  v_sig_count  INTEGER := 0;
  v_high_count INTEGER := 0;
  v_urgency    TEXT;
  v_primary    TEXT;
  v_secondary  TEXT;
  v_phase      player_phase;
  v_load       player_load_aggregation%ROWTYPE;
  v_behavior   player_behavior_profiles%ROWTYPE;
  v_constrained BOOLEAN := false;
  v_constraint_notes TEXT[] := '{}';
  v_hash       TEXT;
  v_id         UUID;
BEGIN
  v_phase := get_player_phase(p_player_id);

  SELECT * INTO v_load     FROM player_load_aggregation   WHERE player_id = p_player_id;
  SELECT * INTO v_behavior FROM player_behavior_profiles  WHERE player_id = p_player_id;

  -- Check active constraints
  IF EXISTS (
    SELECT 1 FROM player_constraints
    WHERE player_id = p_player_id AND is_active = true
    AND (expected_end_date IS NULL OR expected_end_date >= CURRENT_DATE)
  ) THEN
    v_constrained := true;
    SELECT array_agg(title) INTO v_constraint_notes
    FROM player_constraints
    WHERE player_id = p_player_id AND is_active = true;
  END IF;

  -- Accumulate signal scores
  FOR v_sig IN
    SELECT s.*
    FROM player_development_signals s
    WHERE s.player_id = p_player_id
    AND s.is_active = true
    AND s.confidence >= COALESCE(
      (SELECT min_confidence FROM signal_priority_weights
       WHERE academy_id = p_academy_id AND signal_type = s.signal_type AND is_active = true),
      0.600
    )
    ORDER BY s.emitted_at DESC
  LOOP
    SELECT * INTO v_weight
    FROM signal_priority_weights
    WHERE academy_id = p_academy_id AND signal_type = v_sig.signal_type AND is_active = true;

    DECLARE
      v_base_weight    NUMERIC := COALESCE(v_weight.weight, 1.0);
      v_sev_mult       NUMERIC := CASE v_sig.severity
                                    WHEN 'critical' THEN COALESCE(v_weight.critical_multiplier, 3.0)
                                    WHEN 'high'     THEN COALESCE(v_weight.high_multiplier, 1.75)
                                    WHEN 'medium'   THEN COALESCE(v_weight.medium_multiplier, 1.0)
                                    ELSE                 COALESCE(v_weight.low_multiplier, 0.5)
                                  END;
      v_point          NUMERIC := v_base_weight * v_sev_mult * v_sig.confidence * 10;
    BEGIN
      IF v_sig.domain = 'skill' OR v_sig.signal_type IN (
        'score_regression','score_stagnation','score_improvement','dimension_gap','promotion_ready','assessment_completed'
      ) THEN
        v_skill := v_skill + v_point;
      ELSIF v_sig.domain = 'competition' OR v_sig.signal_type IN (
        'utr_regression','utr_stagnation','utr_underperformance','low_match_volume','utr_improvement','utr_overperformance','high_match_volume'
      ) THEN
        -- Apply competition modifier from behavioral profile
        v_comp := v_comp + (v_point * COALESCE(v_behavior.competition_modifier, 1.0));
      ELSIF v_sig.signal_type IN (
        'load_overload_detected','overtraining_risk','constraint_active'
      ) THEN
        -- Apply fatigue sensitivity: sensitive players get higher fitness scores (more urgent)
        v_fitness := v_fitness + (v_point * (1.0 + COALESCE(v_behavior.fatigue_sensitivity, 0.5) * 0.4));
      ELSE
        v_behavioral := v_behavioral + v_point;
      END IF;
    END;

    v_signal_ids := array_append(v_signal_ids, v_sig.id);
    v_sig_count := v_sig_count + 1;
    IF v_sig.severity IN ('high', 'critical') THEN
      v_high_count := v_high_count + 1;
    END IF;
  END LOOP;

  -- Domain normalization: cap each at 40
  v_skill      := LEAST(40, v_skill);
  v_comp       := LEAST(40, v_comp);
  v_fitness    := LEAST(40, v_fitness);
  v_behavioral := LEAST(40, v_behavioral);

  -- Composite: apply load adjustment factor from behavioral profile
  v_composite := LEAST(100,
    (v_skill + v_comp + v_fitness + v_behavioral)
    * COALESCE(v_behavior.load_adjustment_factor, 1.0)
  );

  v_urgency := CASE
    WHEN v_high_count >= 2 OR v_composite >= 80 THEN 'immediate'
    WHEN v_high_count >= 1 OR v_composite >= 55 THEN 'urgent'
    WHEN v_composite >= 35                      THEN 'high'
    WHEN v_sig_count > 0                        THEN 'routine'
    ELSE                                             'monitor'
  END;

  v_primary := CASE GREATEST(v_skill, v_comp, v_fitness, v_behavioral)
    WHEN v_skill      THEN 'schedule_skill_session'
    WHEN v_comp       THEN 'increase_competition'
    WHEN v_fitness    THEN 'reduce_load'
    ELSE                   'schedule_reassessment'
  END;

  v_hash := md5(array_to_string(v_signal_ids, ','));

  INSERT INTO decision_scores (
    academy_id, player_id, composite_score,
    skill_domain_score, competition_domain_score, fitness_domain_score, behavioral_domain_score,
    urgency, contributing_signal_ids, signal_count, high_severity_count,
    is_constrained, constraint_notes, phase_at_score,
    primary_action, scored_at, signals_hash
  )
  VALUES (
    p_academy_id, p_player_id, v_composite,
    v_skill, v_comp, v_fitness, v_behavioral,
    v_urgency, v_signal_ids, v_sig_count, v_high_count,
    v_constrained, v_constraint_notes, v_phase,
    v_primary, NOW(), v_hash
  )
  ON CONFLICT (player_id) DO UPDATE SET
    composite_score          = EXCLUDED.composite_score,
    skill_domain_score       = EXCLUDED.skill_domain_score,
    competition_domain_score = EXCLUDED.competition_domain_score,
    fitness_domain_score     = EXCLUDED.fitness_domain_score,
    behavioral_domain_score  = EXCLUDED.behavioral_domain_score,
    urgency                  = EXCLUDED.urgency,
    contributing_signal_ids  = EXCLUDED.contributing_signal_ids,
    signal_count             = EXCLUDED.signal_count,
    high_severity_count      = EXCLUDED.high_severity_count,
    is_constrained           = EXCLUDED.is_constrained,
    constraint_notes         = EXCLUDED.constraint_notes,
    phase_at_score           = EXCLUDED.phase_at_score,
    primary_action           = EXCLUDED.primary_action,
    scored_at                = NOW(),
    signals_hash             = EXCLUDED.signals_hash
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update BUILD_RECOMMENDATION_REASONING() to populate
-- behavioral_adjustments field (was placeholder in 026).
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
  v_behavior    player_behavior_profiles%ROWTYPE;
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
  v_behavioral_adjustments JSONB;
  v_id          UUID;
  v_weight_row  signal_priority_weights%ROWTYPE;
  v_weighted_score NUMERIC;
BEGIN
  SELECT * INTO v_rec      FROM player_recommendations WHERE id = p_recommendation_id;
  SELECT * INTO v_score    FROM decision_scores        WHERE player_id = v_rec.player_id;
  SELECT * INTO v_priority FROM player_priorities      WHERE id = v_rec.priority_id;
  SELECT * INTO v_load     FROM player_load_aggregation WHERE player_id = v_rec.player_id;
  SELECT * INTO v_behavior FROM player_behavior_profiles WHERE player_id = v_rec.player_id;
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

  -- Behavioral adjustments (now fully populated)
  v_behavioral_adjustments := jsonb_build_object(
    'fatigue_sensitivity',    COALESCE(v_behavior.fatigue_sensitivity, 0.5),
    'volume_response',        COALESCE(v_behavior.volume_response, 'moderate'),
    'competition_response',   COALESCE(v_behavior.competition_response, 'neutral'),
    'learning_preference',    COALESCE(v_behavior.learning_preference, 'drill_heavy'),
    'pressure_tolerance',     COALESCE(v_behavior.pressure_tolerance, 0.5),
    'recovery_rate',          COALESCE(v_behavior.recovery_rate, 'moderate'),
    'load_adjustment_factor', COALESCE(v_behavior.load_adjustment_factor, 1.0),
    'competition_modifier',   COALESCE(v_behavior.competition_modifier, 1.0),
    'calibration_count',      COALESCE(v_behavior.calibration_count, 0)
  );

  -- Build explanation bullets
  IF v_score.high_severity_count >= 2 THEN
    v_bullets := array_append(v_bullets, v_score.high_severity_count || ' high-severity signals active — immediate attention required');
  END IF;

  IF jsonb_array_length(v_signal_summary) > 0 THEN
    v_bullets := array_append(v_bullets, 'Primary driver: ' || (v_signal_summary->0->>'title'));
  END IF;

  IF v_load.fatigue_risk_label IN ('high', 'critical') THEN
    v_bullets := array_append(v_bullets,
      'High fatigue risk (' || v_load.fatigue_risk_label || ') — intensity constrained'
    );
  END IF;

  IF COALESCE(v_behavior.load_adjustment_factor, 1.0) < 0.85 THEN
    v_bullets := array_append(v_bullets,
      'Behavioral profile: load-sensitive player — volume reduced by ' ||
      ROUND((1.0 - v_behavior.load_adjustment_factor) * 100) || '%'
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
    WHEN 'schedule_session'     THEN 'Skill development sessions recommended: '
    WHEN 'increase_competition' THEN 'Increased competitive exposure recommended: '
    WHEN 'reduce_load'          THEN 'Load reduction required: '
    WHEN 'schedule_reassessment' THEN 'Formal assessment needed: '
    WHEN 'move_group'           THEN 'Group transition recommended: '
    ELSE 'Action recommended: '
  END || v_rec.title || '. ';

  v_explanation := v_explanation ||
    'Decision score: ' || ROUND(COALESCE(v_score.composite_score, 0), 1) ||
    '/100 (' || v_rec.urgency || '). ' ||
    'Signals: ' || COALESCE(v_score.signal_count, 0) || ' active (' ||
    COALESCE(v_score.high_severity_count, 0) || ' high). ' ||
    'Phase: ' || v_phase::TEXT || '. ' ||
    'Load factor: ' || ROUND(COALESCE(v_behavior.load_adjustment_factor, 1.0), 2) || '.';

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
    behavioral_adjustments,
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
      'phase',                  v_phase,
      'max_sessions_per_week',  v_phase_defaults.max_sessions_per_week,
      'max_intensity',          v_phase_defaults.max_intensity,
      'high_intensity_pct_max', v_phase_defaults.high_intensity_pct_max,
      'competition_ok',         v_phase_defaults.competition_ok
    ),
    jsonb_build_object(
      'fatigue_risk_score', COALESCE(v_load.fatigue_risk_score, 0),
      'fatigue_risk_label', v_load.fatigue_risk_label,
      'sessions_7d',        COALESCE(v_load.sessions_7d, 0),
      'avg_intensity_7d',   v_load.avg_intensity_7d,
      'load_trend',         v_load.load_trend_7d
    ),
    v_behavioral_adjustments,
    v_explanation,
    v_bullets,
    v_conf_text
  )
  ON CONFLICT (recommendation_id) DO UPDATE SET
    source_signal_ids      = EXCLUDED.source_signal_ids,
    signal_summary         = EXCLUDED.signal_summary,
    weights_applied        = EXCLUDED.weights_applied,
    domain_scores          = EXCLUDED.domain_scores,
    composite_score        = EXCLUDED.composite_score,
    constraints_applied    = EXCLUDED.constraints_applied,
    phase_context          = EXCLUDED.phase_context,
    load_context           = EXCLUDED.load_context,
    behavioral_adjustments = EXCLUDED.behavioral_adjustments,
    explanation_text       = EXCLUDED.explanation_text,
    explanation_bullets    = EXCLUDED.explanation_bullets,
    confidence_explanation = EXCLUDED.confidence_explanation,
    generated_at           = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_behavior_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see behavior profiles"      ON player_behavior_profiles FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage behavior profiles" ON player_behavior_profiles FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "System manages behavior profiles"   ON player_behavior_profiles FOR ALL   USING (academy_id = auth_academy_id());
