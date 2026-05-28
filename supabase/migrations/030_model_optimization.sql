-- ============================================================
-- ACADEMY OS — MIGRATION 030: MODEL OPTIMIZATION LAYER
-- academy_threshold_configs: runtime-configurable engine parameters
-- model_versions: immutable parameter snapshots for comparison
-- model_evaluation_runs: performance metrics per version / period
--
-- Loop integration:
--   ← signal_priority_weights (019) — snapshotted into versions
--   ← recommendation_overrides (022) — outcome data for evaluation
--   ← decision_learning_logs (022) — cycle data for evaluation
--   ← recommendation_reasoning (026) — predicted_score_impact for accuracy
--   → score_player() (027) — reads dynamic thresholds from configs
--   → director_control (033) — configure thresholds, snapshot versions
--   → data_flywheel (034) — effectiveness feeds into version comparison
--
-- Design: thresholds that were previously hardcoded in score_player()
-- (urgency bands, confidence floors) are moved into
-- academy_threshold_configs so directors can tune them without
-- a code deploy. Snapshots capture a full parameter set so you can
-- reproduce, compare, and roll back any configuration.
-- ============================================================

-- ============================================================
-- ACADEMY THRESHOLD CONFIGS
-- Key-value store for all runtime-tunable engine parameters.
-- One row per (academy, config_key). Reads by get_threshold().
-- ============================================================
CREATE TABLE academy_threshold_configs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  config_key    TEXT NOT NULL,
  config_value  NUMERIC NOT NULL,
  description   TEXT,
  default_value NUMERIC NOT NULL,
  min_value     NUMERIC,
  max_value     NUMERIC,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  updated_by    UUID REFERENCES profiles(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, config_key)
);

CREATE INDEX idx_threshold_configs_academy ON academy_threshold_configs(academy_id, is_active);

CREATE TRIGGER tr_threshold_configs_updated_at
  BEFORE UPDATE ON academy_threshold_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── GET_THRESHOLD() ──────────────────────────────────────────
-- Reads a single threshold value, falling back to default_value
-- if the config row is missing or inactive.
-- Declared STABLE so it can be inlined by the query planner.
-- ── ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_threshold(
  p_academy_id   UUID,
  p_key          TEXT,
  p_default      NUMERIC DEFAULT NULL
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    (SELECT config_value FROM academy_threshold_configs
     WHERE academy_id = p_academy_id AND config_key = p_key AND is_active = true),
    p_default
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── GET_ACADEMY_THRESHOLDS() ─────────────────────────────────
-- Returns all active thresholds as JSONB in one query.
-- Called once per engine run, not once per threshold.
-- ── ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_academy_thresholds(p_academy_id UUID)
RETURNS JSONB AS $$
  SELECT COALESCE(
    jsonb_object_agg(config_key, config_value),
    '{}'::JSONB
  )
  FROM academy_threshold_configs
  WHERE academy_id = p_academy_id AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── SEED: Default threshold configs for all academies ────────
-- Insert defaults for demo academy; new academies should copy these.
-- Directors tune from these baselines.
-- ── ─────────────────────────────────────────────────────────
INSERT INTO academy_threshold_configs
  (academy_id, config_key, config_value, default_value, min_value, max_value, description)
VALUES
  -- Urgency composite score thresholds
  ('00000000-0000-0000-0000-000000000001','urgency_immediate_score',80, 80, 50,100,'Composite score ≥ this → immediate urgency'),
  ('00000000-0000-0000-0000-000000000001','urgency_urgent_score',   55, 55, 30, 80,'Composite score ≥ this → urgent'),
  ('00000000-0000-0000-0000-000000000001','urgency_high_score',     35, 35, 10, 60,'Composite score ≥ this → high'),
  -- Urgency high-severity signal count thresholds
  ('00000000-0000-0000-0000-000000000001','urgency_immediate_high_severity',2,2,1,5,'# high-severity signals → immediate urgency'),
  ('00000000-0000-0000-0000-000000000001','urgency_urgent_high_severity',   1,1,1,4,'# high-severity signals → urgent'),
  -- Signal confidence
  ('00000000-0000-0000-0000-000000000001','min_signal_confidence',        0.600,0.600,0.300,0.950,'Signals below this confidence are ignored'),
  -- Fatigue / load thresholds
  ('00000000-0000-0000-0000-000000000001','fatigue_high_threshold',       0.500,0.500,0.200,0.900,'Fatigue risk score ≥ this = high'),
  ('00000000-0000-0000-0000-000000000001','fatigue_critical_threshold',   0.700,0.700,0.400,1.000,'Fatigue risk score ≥ this = critical'),
  ('00000000-0000-0000-0000-000000000001','overtraining_emit_threshold',  0.700,0.700,0.400,1.000,'Emit overtraining_risk signal above this fatigue'),
  -- Recommendation config
  ('00000000-0000-0000-0000-000000000001','recommendation_expiry_hours',  168,168, 24,720,'Hours until pending recommendation expires'),
  ('00000000-0000-0000-0000-000000000001','max_active_priorities',          5,  5,  2, 10,'Max priorities generated per player per run'),
  ('00000000-0000-0000-0000-000000000001','max_active_recommendations',     3,  3,  1,  8,'Max pending recommendations per player'),
  -- Prediction
  ('00000000-0000-0000-0000-000000000001','prediction_horizon_days',       30, 30, 7,180,'Default prediction lookahead window'),
  -- Behavioral model
  ('00000000-0000-0000-0000-000000000001','behavioral_calibration_min_outcomes',10,10,5,50,'Min outcomes before calibrating behavioral profile'),
  -- Learning / flywheel
  ('00000000-0000-0000-0000-000000000001','override_evaluation_window_days',30, 30,14, 90,'Days after override to evaluate outcome')
ON CONFLICT (academy_id, config_key) DO NOTHING;

-- ============================================================
-- MODEL VERSIONS
-- Immutable snapshot of all configurable parameters at a point
-- in time. Allows comparison, rollback, and audit.
-- ============================================================
CREATE TABLE model_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  version_number        INTEGER NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,

  -- Full parameter snapshot: weights + thresholds at this point in time
  parameter_snapshot    JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "signal_weights": [...],     -- array of signal_priority_weights rows
  --   "thresholds": {...},         -- key → value map from academy_threshold_configs
  --   "snapshotted_at": "..."
  -- }

  -- Performance metrics (populated by evaluate_model_performance)
  performance_score     NUMERIC(6,2),
  override_rate         NUMERIC(5,4),
  approval_rate         NUMERIC(5,4),
  positive_outcome_rate NUMERIC(5,4),
  performance_grade     TEXT CHECK (performance_grade IN ('A','B','C','D','F')),

  is_active             BOOLEAN NOT NULL DEFAULT false,
  activated_at          TIMESTAMPTZ,
  deactivated_at        TIMESTAMPTZ,
  promoted_by           UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(academy_id, version_number)
);

CREATE INDEX idx_model_versions_academy ON model_versions(academy_id, is_active);
CREATE INDEX idx_model_versions_created ON model_versions(academy_id, created_at DESC);

-- ============================================================
-- MODEL EVALUATION RUNS
-- Performance metrics computed for a given time window.
-- Can be associated with a model version (what was active then)
-- or run as a standalone period comparison.
-- ============================================================
CREATE TABLE model_evaluation_runs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  model_version_id          UUID REFERENCES model_versions(id) ON DELETE SET NULL,

  evaluation_period_start   TIMESTAMPTZ NOT NULL,
  evaluation_period_end     TIMESTAMPTZ NOT NULL,

  -- Recommendation volume
  total_recommendations     INTEGER NOT NULL DEFAULT 0,
  approved_count            INTEGER NOT NULL DEFAULT 0,
  overridden_count          INTEGER NOT NULL DEFAULT 0,
  expired_count             INTEGER NOT NULL DEFAULT 0,

  -- Decision quality rates
  override_rate             NUMERIC(5,4),
  approval_rate             NUMERIC(5,4),

  -- Outcome quality (from override evaluations + learning logs)
  avg_score_delta_30d       NUMERIC(6,3),
  positive_outcome_count    INTEGER NOT NULL DEFAULT 0,
  negative_outcome_count    INTEGER NOT NULL DEFAULT 0,
  inconclusive_count        INTEGER NOT NULL DEFAULT 0,
  positive_outcome_rate     NUMERIC(5,4),

  -- Prediction accuracy: |predicted_score_impact - actual_score_delta|
  avg_prediction_error      NUMERIC(6,3),

  -- Composite performance score (0-100) and letter grade
  performance_score         NUMERIC(6,2),
  performance_grade         TEXT CHECK (performance_grade IN ('A','B','C','D','F')),

  evaluated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eval_runs_academy ON model_evaluation_runs(academy_id, evaluated_at DESC);
CREATE INDEX idx_eval_runs_version ON model_evaluation_runs(model_version_id);

-- ============================================================
-- SNAPSHOT_CURRENT_MODEL()
-- Captures all current signal weights + thresholds into a new
-- model_version row. Marks it as the active version and
-- deactivates any previous active version.
-- ============================================================
CREATE OR REPLACE FUNCTION snapshot_current_model(
  p_academy_id  UUID,
  p_name        TEXT,
  p_description TEXT DEFAULT NULL,
  p_promoted_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_next_version  INTEGER;
  v_weights_snap  JSONB;
  v_thresh_snap   JSONB;
  v_snapshot      JSONB;
  v_id            UUID;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM model_versions WHERE academy_id = p_academy_id;

  -- Snapshot signal weights
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'signal_type',           signal_type,
      'weight',                weight,
      'low_multiplier',        low_multiplier,
      'medium_multiplier',     medium_multiplier,
      'high_multiplier',       high_multiplier,
      'critical_multiplier',   critical_multiplier,
      'min_confidence',        min_confidence,
      'is_active',             is_active
    )
    ORDER BY signal_type::TEXT
  ), '[]'::JSONB)
  INTO v_weights_snap
  FROM signal_priority_weights
  WHERE academy_id = p_academy_id;

  -- Snapshot thresholds
  v_thresh_snap := get_academy_thresholds(p_academy_id);

  v_snapshot := jsonb_build_object(
    'signal_weights',  v_weights_snap,
    'thresholds',      v_thresh_snap,
    'snapshotted_at',  NOW()
  );

  -- Deactivate previous active version
  UPDATE model_versions
  SET is_active = false, deactivated_at = NOW()
  WHERE academy_id = p_academy_id AND is_active = true;

  INSERT INTO model_versions (
    academy_id, version_number, name, description,
    parameter_snapshot, is_active, activated_at, promoted_by
  ) VALUES (
    p_academy_id, v_next_version, p_name, p_description,
    v_snapshot, true, NOW(), p_promoted_by
  )
  RETURNING id INTO v_id;

  PERFORM write_audit_log(
    p_academy_id, p_promoted_by,
    'model_version_created',
    'model_versions', v_id,
    'v' || v_next_version || ': ' || p_name,
    jsonb_build_object('version_number', v_next_version, 'signal_weight_count', jsonb_array_length(v_weights_snap)),
    'system'
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EVALUATE_MODEL_PERFORMANCE()
-- Computes performance metrics for a given time window.
-- Optionally associates results with a model version.
-- Updates the version's summary metrics if version_id supplied.
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_model_performance(
  p_academy_id    UUID,
  p_period_start  TIMESTAMPTZ,
  p_period_end    TIMESTAMPTZ,
  p_version_id    UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_total        INTEGER := 0;
  v_approved     INTEGER := 0;
  v_overridden   INTEGER := 0;
  v_expired      INTEGER := 0;
  v_positive     INTEGER := 0;
  v_negative     INTEGER := 0;
  v_inconclusive INTEGER := 0;
  v_avg_delta    NUMERIC;
  v_avg_pred_err NUMERIC;
  v_override_rate NUMERIC;
  v_approval_rate NUMERIC;
  v_positive_rate NUMERIC;
  v_perf_score   NUMERIC;
  v_grade        TEXT;
  v_id           UUID;
BEGIN
  -- Recommendation volume + status breakdown
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status IN ('overridden','rejected')),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO v_total, v_approved, v_overridden, v_expired
  FROM player_recommendations
  WHERE academy_id = p_academy_id
  AND generated_at BETWEEN p_period_start AND p_period_end;

  -- Override outcome verdicts (evaluated overrides in this window)
  SELECT
    COUNT(*) FILTER (WHERE outcome_verdict = 'better'),
    COUNT(*) FILTER (WHERE outcome_verdict = 'worse'),
    COUNT(*) FILTER (WHERE outcome_verdict IN ('neutral','inconclusive'))
  INTO v_positive, v_negative, v_inconclusive
  FROM recommendation_overrides
  WHERE academy_id = p_academy_id
  AND outcome_evaluated = true
  AND evaluate_after BETWEEN p_period_start AND p_period_end;

  -- Average score delta and prediction accuracy from learning logs
  SELECT
    COALESCE(AVG(dll.score_delta_30d), 0),
    COALESCE(AVG(ABS(COALESCE(rr.predicted_score_impact, 0) - COALESCE(dll.score_delta_30d, 0))), 0)
  INTO v_avg_delta, v_avg_pred_err
  FROM decision_learning_logs dll
  JOIN players pl ON pl.id = dll.player_id AND pl.academy_id = p_academy_id
  LEFT JOIN player_recommendations pr ON pr.player_id = dll.player_id
    AND pr.generated_at BETWEEN p_period_start AND p_period_end
  LEFT JOIN recommendation_reasoning rr ON rr.recommendation_id = pr.id
  WHERE dll.cycle_date BETWEEN p_period_start::DATE AND p_period_end::DATE
  AND dll.outcome_evaluated = true;

  -- Rate calculations (guard against divide-by-zero)
  v_override_rate := CASE WHEN v_total > 0 THEN ROUND(v_overridden::NUMERIC / v_total, 4) ELSE 0 END;
  v_approval_rate := CASE WHEN v_total > 0 THEN ROUND(v_approved::NUMERIC / v_total, 4) ELSE 0 END;
  v_positive_rate := CASE WHEN (v_positive + v_negative) > 0
    THEN ROUND(v_positive::NUMERIC / (v_positive + v_negative), 4)
    ELSE 0.5 END;

  -- Composite performance score (0–100)
  -- Approval rate (35%) + positive outcome rate (40%) + low override rate (25%)
  v_perf_score := ROUND(LEAST(100,
    (v_approval_rate * 35) +
    (v_positive_rate * 40) +
    ((1.0 - LEAST(1.0, v_override_rate)) * 25)
  ), 2);

  v_grade := CASE
    WHEN v_perf_score >= 85 THEN 'A'
    WHEN v_perf_score >= 70 THEN 'B'
    WHEN v_perf_score >= 55 THEN 'C'
    WHEN v_perf_score >= 40 THEN 'D'
    ELSE 'F'
  END;

  -- Back-fill version summary metrics
  IF p_version_id IS NOT NULL THEN
    UPDATE model_versions SET
      performance_score     = v_perf_score,
      override_rate         = v_override_rate,
      approval_rate         = v_approval_rate,
      positive_outcome_rate = v_positive_rate,
      performance_grade     = v_grade
    WHERE id = p_version_id;
  END IF;

  INSERT INTO model_evaluation_runs (
    academy_id, model_version_id,
    evaluation_period_start, evaluation_period_end,
    total_recommendations, approved_count, overridden_count, expired_count,
    override_rate, approval_rate,
    avg_score_delta_30d,
    positive_outcome_count, negative_outcome_count, inconclusive_count,
    positive_outcome_rate, avg_prediction_error,
    performance_score, performance_grade
  ) VALUES (
    p_academy_id, p_version_id,
    p_period_start, p_period_end,
    v_total, v_approved, v_overridden, v_expired,
    v_override_rate, v_approval_rate,
    v_avg_delta,
    v_positive, v_negative, v_inconclusive,
    v_positive_rate, v_avg_pred_err,
    v_perf_score, v_grade
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update SCORE_PLAYER() to use dynamic thresholds.
-- Reads all thresholds once via get_academy_thresholds() so
-- only one extra query is added per engine run.
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
  v_phase      player_phase;
  v_load       player_load_aggregation%ROWTYPE;
  v_behavior   player_behavior_profiles%ROWTYPE;
  v_constrained BOOLEAN := false;
  v_constraint_notes TEXT[] := '{}';
  v_hash       TEXT;
  v_id         UUID;
  -- Dynamic thresholds (read once, used throughout)
  v_thresholds JSONB;
  v_t_immediate_score    NUMERIC;
  v_t_urgent_score       NUMERIC;
  v_t_high_score         NUMERIC;
  v_t_imm_sev            INTEGER;
  v_t_urg_sev            INTEGER;
  v_t_min_conf           NUMERIC;
BEGIN
  v_phase := get_player_phase(p_player_id);
  SELECT * INTO v_load     FROM player_load_aggregation   WHERE player_id = p_player_id;
  SELECT * INTO v_behavior FROM player_behavior_profiles  WHERE player_id = p_player_id;

  -- Load all thresholds in one query
  v_thresholds          := get_academy_thresholds(p_academy_id);
  v_t_immediate_score   := COALESCE((v_thresholds->>'urgency_immediate_score')::NUMERIC,   80);
  v_t_urgent_score      := COALESCE((v_thresholds->>'urgency_urgent_score')::NUMERIC,      55);
  v_t_high_score        := COALESCE((v_thresholds->>'urgency_high_score')::NUMERIC,        35);
  v_t_imm_sev           := COALESCE((v_thresholds->>'urgency_immediate_high_severity')::INTEGER, 2);
  v_t_urg_sev           := COALESCE((v_thresholds->>'urgency_urgent_high_severity')::INTEGER,    1);
  v_t_min_conf          := COALESCE((v_thresholds->>'min_signal_confidence')::NUMERIC,     0.600);

  -- Active constraints
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
      v_t_min_conf
    )
    ORDER BY s.emitted_at DESC
  LOOP
    SELECT * INTO v_weight
    FROM signal_priority_weights
    WHERE academy_id = p_academy_id AND signal_type = v_sig.signal_type AND is_active = true;

    DECLARE
      v_base_weight NUMERIC := COALESCE(v_weight.weight, 1.0);
      v_sev_mult    NUMERIC := CASE v_sig.severity
                                 WHEN 'critical' THEN COALESCE(v_weight.critical_multiplier, 3.0)
                                 WHEN 'high'     THEN COALESCE(v_weight.high_multiplier, 1.75)
                                 WHEN 'medium'   THEN COALESCE(v_weight.medium_multiplier, 1.0)
                                 ELSE                 COALESCE(v_weight.low_multiplier, 0.5)
                               END;
      v_point       NUMERIC := v_base_weight * v_sev_mult * v_sig.confidence * 10;
    BEGIN
      IF v_sig.domain = 'skill' OR v_sig.signal_type IN (
        'score_regression','score_stagnation','score_improvement','dimension_gap','promotion_ready','assessment_completed'
      ) THEN
        v_skill := v_skill + v_point;
      ELSIF v_sig.domain = 'competition' OR v_sig.signal_type IN (
        'utr_regression','utr_stagnation','utr_underperformance','low_match_volume','utr_improvement','utr_overperformance','high_match_volume'
      ) THEN
        v_comp := v_comp + (v_point * COALESCE(v_behavior.competition_modifier, 1.0));
      ELSIF v_sig.signal_type IN (
        'load_overload_detected','overtraining_risk','constraint_active'
      ) THEN
        v_fitness := v_fitness + (v_point * (1.0 + COALESCE(v_behavior.fatigue_sensitivity, 0.5) * 0.4));
      ELSE
        v_behavioral := v_behavioral + v_point;
      END IF;
    END;

    v_signal_ids := array_append(v_signal_ids, v_sig.id);
    v_sig_count  := v_sig_count + 1;
    IF v_sig.severity IN ('high','critical') THEN v_high_count := v_high_count + 1; END IF;
  END LOOP;

  -- Domain normalization: cap each at 40
  v_skill      := LEAST(40, v_skill);
  v_comp       := LEAST(40, v_comp);
  v_fitness    := LEAST(40, v_fitness);
  v_behavioral := LEAST(40, v_behavioral);

  -- Composite with behavioral load factor
  v_composite := LEAST(100,
    (v_skill + v_comp + v_fitness + v_behavioral)
    * COALESCE(v_behavior.load_adjustment_factor, 1.0)
  );

  -- Urgency using dynamic thresholds
  v_urgency := CASE
    WHEN v_high_count >= v_t_imm_sev OR v_composite >= v_t_immediate_score THEN 'immediate'
    WHEN v_high_count >= v_t_urg_sev OR v_composite >= v_t_urgent_score    THEN 'urgent'
    WHEN v_composite >= v_t_high_score                                      THEN 'high'
    WHEN v_sig_count > 0                                                    THEN 'routine'
    ELSE 'monitor'
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
  ) VALUES (
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
-- Seed: create the initial model version for the demo academy
-- ============================================================
SELECT snapshot_current_model(
  '00000000-0000-0000-0000-000000000001',
  'v1 — Initial Configuration',
  'Baseline parameter set seeded from migration 030'
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE academy_threshold_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_evaluation_runs     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see threshold configs"      ON academy_threshold_configs FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage threshold configs" ON academy_threshold_configs FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

CREATE POLICY "Staff see model versions"         ON model_versions FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages model versions"    ON model_versions FOR ALL   USING (academy_id = auth_academy_id());

CREATE POLICY "Staff see evaluation runs"        ON model_evaluation_runs FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages evaluation runs"   ON model_evaluation_runs FOR ALL   USING (academy_id = auth_academy_id());
