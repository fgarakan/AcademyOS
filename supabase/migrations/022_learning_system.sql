-- ============================================================
-- ACADEMY OS — MIGRATION 022: LEARNING SYSTEM
-- recommendation_overrides, decision_learning_logs
--
-- Loop position (the closed loop):
--   ← player_recommendations (021) — what was recommended
--   ← player_outcomes (016)        — what actually happened
--   ← player_progress_snapshots (016) — long-term change
--   → signal_priority_weights (019) — adjust future weighting
--   → decision_learning_logs        — record accuracy of predictions
--
-- The learning system tracks every time a human overrides a
-- recommendation. After 30–90 days, it checks whether the
-- outcome for the player improved, degraded, or stayed flat.
-- That feedback is logged and can inform manual weight adjustments
-- to signal_priority_weights.
-- ============================================================

-- ============================================================
-- RECOMMENDATION OVERRIDES
-- When a director/coach changes or rejects a recommendation,
-- this table records what was recommended, what was done instead,
-- and (later) what the outcome was.
-- ============================================================
CREATE TABLE recommendation_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- What the engine recommended
  recommendation_id UUID NOT NULL REFERENCES player_recommendations(id),
  original_rec_type TEXT NOT NULL,
  original_title    TEXT NOT NULL,
  original_urgency  TEXT,
  original_confidence NUMERIC(4,3),

  -- What the human decided instead
  override_type    TEXT NOT NULL CHECK (override_type IN (
    'rejected',       -- chose to do nothing
    'modified',       -- changed the recommendation
    'replaced',       -- used a completely different action
    'deferred'        -- pushed to future cycle
  )),
  override_action  TEXT,    -- what was actually done
  override_reason  TEXT,    -- why (required for rejected/replaced)
  overridden_by    UUID NOT NULL REFERENCES profiles(id),
  overridden_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Outcome evaluation (populated after evaluation_window_days)
  evaluation_window_days INTEGER NOT NULL DEFAULT 30,
  -- TODO: compute evaluate_after in application logic or trigger
evaluate_after DATE,

  outcome_evaluated      BOOLEAN NOT NULL DEFAULT false,
  outcome_evaluated_at   TIMESTAMPTZ,

  -- Did the override produce a better result?
  outcome_verdict        TEXT CHECK (outcome_verdict IN (
    'better',       -- player improved more than engine prediction
    'neutral',      -- no meaningful difference
    'worse',        -- player improved less or regressed
    'inconclusive'  -- not enough data to determine
  )),
  outcome_notes          TEXT,
  outcome_score_delta    NUMERIC(5,2),   -- actual score change after override
  engine_predicted_delta NUMERIC(5,2),  -- what the engine expected if rec was followed

  -- Signal for weight adjustment
  suggested_weight_adjustment NUMERIC(4,2),  -- +/- to apply to the signal weight
  weight_adjustment_applied   BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_overrides_player   ON recommendation_overrides(player_id, overridden_at DESC);
CREATE INDEX idx_overrides_evaluate ON recommendation_overrides(evaluate_after)
  WHERE outcome_evaluated = false;
CREATE INDEX idx_overrides_academy  ON recommendation_overrides(academy_id, outcome_verdict);

-- ============================================================
-- DECISION LEARNING LOGS
-- Append-only log of every engine run that resulted in an action.
-- Used to build a training dataset over time.
-- Each row = one engine cycle for one player.
-- ============================================================
CREATE TABLE decision_learning_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Engine state at time of this cycle
  cycle_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  decision_score_id UUID REFERENCES decision_scores(id),
  composite_score   NUMERIC(6,2),
  urgency           TEXT,
  phase_at_cycle    player_phase,

  -- Signals that drove this cycle
  active_signal_ids     UUID[],
  active_signal_count   INTEGER,
  high_severity_count   INTEGER,

  -- What was recommended
  recommendation_ids    UUID[],
  recommendation_count  INTEGER,

  -- What was accepted vs overridden
  accepted_count        INTEGER DEFAULT 0,
  overridden_count      INTEGER DEFAULT 0,
  rejected_count        INTEGER DEFAULT 0,

  -- Outcome (populated at evaluation time)
  outcome_snapshot_id   UUID REFERENCES player_progress_snapshots(id),
  score_at_cycle        NUMERIC(4,2),   -- overall score when this cycle ran
  score_30d_after       NUMERIC(4,2),   -- score 30 days later
  score_delta_30d       NUMERIC(5,2) GENERATED ALWAYS AS (score_30d_after - score_at_cycle) STORED,

  outcome_evaluated     BOOLEAN NOT NULL DEFAULT false,
  outcome_evaluated_at  TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_logs_player  ON decision_learning_logs(player_id, cycle_date DESC);
-- TODO: restore index after evaluate_after is implemented properly
-- CREATE INDEX idx_learning_logs_eval
-- ON decision_learning_logs(evaluate_after_date)
-- WHERE outcome_evaluated = false;

-- Add evaluate_after_date as a real column (not generated, since we want it nullable)
ALTER TABLE decision_learning_logs
  ADD COLUMN evaluate_after_date DATE GENERATED ALWAYS AS (cycle_date + 30) STORED;

-- ============================================================
-- LOG_DECISION_CYCLE()
-- Records the current engine cycle into decision_learning_logs.
-- Called by run_full_engine().
-- ============================================================
CREATE OR REPLACE FUNCTION log_decision_cycle(
  p_player_id         UUID,
  p_academy_id        UUID,
  p_decision_score_id UUID,
  p_recommendation_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_score   decision_scores%ROWTYPE;
  v_pp      player_progression%ROWTYPE;
  v_id      UUID;
BEGIN
  SELECT * INTO v_score FROM decision_scores WHERE id = p_decision_score_id;
  SELECT * INTO v_pp    FROM player_progression WHERE player_id = p_player_id;

  INSERT INTO decision_learning_logs (
    academy_id, player_id, cycle_date,
    decision_score_id, composite_score, urgency, phase_at_cycle,
    active_signal_ids, active_signal_count, high_severity_count,
    recommendation_ids, recommendation_count,
    score_at_cycle
  ) VALUES (
    p_academy_id, p_player_id, CURRENT_DATE,
    p_decision_score_id, v_score.composite_score, v_score.urgency, v_score.phase_at_score,
    v_score.contributing_signal_ids, v_score.signal_count, v_score.high_severity_count,
    p_recommendation_ids, COALESCE(array_length(p_recommendation_ids, 1), 0),
    v_pp.overall_score
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECORD_RECOMMENDATION_OVERRIDE()
-- Called when a director rejects or modifies a recommendation.
-- ============================================================
CREATE OR REPLACE FUNCTION record_recommendation_override(
  p_recommendation_id UUID,
  p_override_type     TEXT,
  p_override_action   TEXT,
  p_override_reason   TEXT,
  p_overridden_by     UUID,
  p_eval_window_days  INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_rec player_recommendations%ROWTYPE;
  v_id  UUID;
BEGIN
  SELECT * INTO v_rec FROM player_recommendations WHERE id = p_recommendation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recommendation not found: %', p_recommendation_id; END IF;

  INSERT INTO recommendation_overrides (
    academy_id, player_id,
    recommendation_id, original_rec_type, original_title,
    original_urgency, original_confidence,
    override_type, override_action, override_reason,
    overridden_by, evaluation_window_days
  ) VALUES (
    v_rec.academy_id, v_rec.player_id,
    p_recommendation_id, v_rec.recommendation_type, v_rec.title,
    v_rec.urgency, v_rec.confidence_score,
    p_override_type, p_override_action, p_override_reason,
    p_overridden_by, p_eval_window_days
  ) RETURNING id INTO v_id;

  -- Update recommendation status
  UPDATE player_recommendations SET
    status         = p_override_type::recommendation_status,
    override_notes = p_override_reason,
    overridden_by  = p_overridden_by,
    overridden_at  = NOW(),
    updated_at     = NOW()
  WHERE id = p_recommendation_id;

  -- Audit log
  PERFORM write_audit_log(
    v_rec.academy_id, p_overridden_by,
    'recommendation.overridden', 'player_recommendation', p_recommendation_id,
    v_rec.title,
    jsonb_build_object('override_type', p_override_type, 'reason', p_override_reason),
    'ui', NULL
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- EVALUATE_OVERRIDES()
-- Nightly batch job. For each override past its evaluate_after date,
-- compares actual outcome vs. engine expectation.
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_overrides()
RETURNS INTEGER AS $$
DECLARE
  v_override recommendation_overrides%ROWTYPE;
  v_score_before NUMERIC(4,2);
  v_score_after  NUMERIC(4,2);
  v_delta        NUMERIC(5,2);
  v_verdict      TEXT;
  v_count        INTEGER := 0;
BEGIN
  FOR v_override IN
    SELECT * FROM recommendation_overrides
    WHERE outcome_evaluated = false
    AND evaluate_after <= CURRENT_DATE
  LOOP
    -- Get score at time of override
    SELECT pp.overall_score INTO v_score_before
    FROM player_progress_snapshots ps
    JOIN player_progression pp ON pp.player_id = ps.player_id
    WHERE ps.player_id = v_override.player_id
    AND ps.snapshot_date <= v_override.overridden_at::DATE
    ORDER BY ps.snapshot_date DESC LIMIT 1;

    -- Get most recent score
    SELECT overall_score INTO v_score_after
    FROM player_progression WHERE player_id = v_override.player_id;

    IF v_score_before IS NOT NULL AND v_score_after IS NOT NULL THEN
      v_delta := v_score_after - v_score_before;
      v_verdict := CASE
        WHEN v_delta >= 0.5  THEN 'better'
        WHEN v_delta <= -0.5 THEN 'worse'
        WHEN ABS(v_delta) < 0.5 THEN 'neutral'
        ELSE 'inconclusive'
      END;
    ELSE
      v_verdict := 'inconclusive';
      v_delta   := NULL;
    END IF;

    UPDATE recommendation_overrides SET
      outcome_evaluated    = true,
      outcome_evaluated_at = NOW(),
      outcome_verdict      = v_verdict,
      outcome_score_delta  = v_delta
    WHERE id = v_override.id;

    -- Log the outcome
    INSERT INTO decision_learning_logs (
      academy_id, player_id, cycle_date,
      score_at_cycle, score_30d_after, outcome_evaluated, outcome_evaluated_at
    ) VALUES (
      v_override.academy_id, v_override.player_id, v_override.overridden_at::DATE,
      v_score_before, v_score_after, true, NOW()
    ) ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE recommendation_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_learning_logs   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors see overrides"  ON recommendation_overrides FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "System manages overrides" ON recommendation_overrides FOR ALL  USING (academy_id = auth_academy_id());

CREATE POLICY "Directors see learning logs"  ON decision_learning_logs FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "System manages learning logs" ON decision_learning_logs FOR ALL  USING (academy_id = auth_academy_id());
