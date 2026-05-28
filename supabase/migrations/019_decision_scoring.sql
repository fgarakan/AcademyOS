-- ============================================================
-- ACADEMY OS — MIGRATION 019: DECISION SCORING SYSTEM
-- signal_priority_weights, decision_scores, player_constraints
--
-- Loop position:
--   ← player_development_signals (raw signal input)
--   ← player_load_aggregation (load/fatigue constraints)
--   ← player_phase_states (phase constraints)
--   → player_priorities (020) — scored signals become ranked priorities
--   → player_recommendations (021) — decision scores drive recommendations
--
-- Design: scored, not rules-based.
-- Each signal type has a configurable weight per academy.
-- The engine aggregates all active signals into a composite decision score.
-- Signals from different domains are combined, not siloed.
-- ============================================================

-- ============================================================
-- PLAYER CONSTRAINTS
-- Active limitations on a player (injury, load cap, medical hold).
-- Queried by score_player() to flag is_constrained on decision_scores.
-- ============================================================
CREATE TYPE constraint_type AS ENUM (
  'injury', 'medical_hold', 'max_sessions_limit',
  'intensity_cap', 'competition_hold', 'travel', 'other'
);

CREATE TABLE player_constraints (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  constraint_type       constraint_type NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  severity              TEXT NOT NULL DEFAULT 'moderate'
                        CHECK (severity IN ('minor', 'moderate', 'severe')),
  max_sessions_per_week INTEGER,
  max_intensity         INTEGER CHECK (max_intensity BETWEEN 1 AND 5),
  start_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date     DATE,
  actual_end_date       DATE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  cleared_by            UUID REFERENCES profiles(id),
  cleared_at            TIMESTAMPTZ,
  clearance_notes       TEXT,
  set_by                UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_constraints_player ON player_constraints(player_id, is_active);
CREATE INDEX idx_constraints_active ON player_constraints(academy_id, is_active);

CREATE TRIGGER tr_constraints_updated_at
  BEFORE UPDATE ON player_constraints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Emit signal when constraint is set or cleared
CREATE OR REPLACE FUNCTION tr_emit_constraint_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_active = false)) THEN
    PERFORM emit_signal(
      NEW.academy_id, NEW.player_id,
      'constraint_active', 'constraint_check',
      NEW.constraint_type::TEXT || ': ' || NEW.title,
      NEW.description, NULL,
      CASE NEW.severity WHEN 'severe' THEN 'high' WHEN 'moderate' THEN 'medium' ELSE 'low' END,
      1.000,
      jsonb_build_object('constraint_type', NEW.constraint_type, 'severity', NEW.severity),
      NULL, 'player_constraints', NEW.id,
      COALESCE(NEW.expected_end_date::TIMESTAMPTZ, NOW() + INTERVAL '90 days'), 0
    );
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    PERFORM emit_signal(
      NEW.academy_id, NEW.player_id,
      'constraint_resolved', 'constraint_check',
      'Constraint resolved: ' || NEW.title,
      NEW.clearance_notes, NULL, 'low', 1.000,
      jsonb_build_object('constraint_type', NEW.constraint_type),
      NULL, 'player_constraints', NEW.id,
      NOW() + INTERVAL '7 days', 0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_player_constraint_signal
  AFTER INSERT OR UPDATE ON player_constraints
  FOR EACH ROW EXECUTE FUNCTION tr_emit_constraint_signal();

ALTER TABLE player_constraints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see player constraints"   ON player_constraints FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage player constraints" ON player_constraints FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Players see own constraints"
  ON player_constraints FOR SELECT
  USING (EXISTS (SELECT 1 FROM players p WHERE p.id = player_constraints.player_id AND p.profile_id = auth.uid()));

-- ============================================================
-- SIGNAL PRIORITY WEIGHTS
-- Academy-configurable weight per signal type.
-- Weight range: 0.0 (ignored) – 2.0 (double weight).
-- Base weight = 1.0 for all types unless overridden.
-- Seeded with defaults in 024_seed_data.sql.
-- ============================================================
CREATE TABLE signal_priority_weights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  signal_type     signal_type NOT NULL,
  weight          NUMERIC(4,2) NOT NULL DEFAULT 1.00
                  CHECK (weight BETWEEN 0 AND 2),
  -- Severity multipliers (applied on top of weight)
  low_multiplier      NUMERIC(4,2) NOT NULL DEFAULT 0.50,
  medium_multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  high_multiplier     NUMERIC(4,2) NOT NULL DEFAULT 1.75,
  critical_multiplier NUMERIC(4,2) NOT NULL DEFAULT 3.00,
  -- Confidence floor: signals below this confidence are ignored
  min_confidence  NUMERIC(4,3) NOT NULL DEFAULT 0.600,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, signal_type)
);

CREATE INDEX idx_weights_academy ON signal_priority_weights(academy_id, is_active);

CREATE TRIGGER tr_weights_updated_at
  BEFORE UPDATE ON signal_priority_weights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DECISION SCORES
-- One row per player per engine run.
-- Represents the engine's current view of a player's situation.
-- Refreshed when: new signals arrive, load changes, phase changes.
-- ============================================================
CREATE TABLE decision_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Composite score (0–100)
  composite_score         NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- Per-domain sub-scores (0–100)
  skill_domain_score      NUMERIC(6,2) DEFAULT 0,
  competition_domain_score NUMERIC(6,2) DEFAULT 0,
  fitness_domain_score    NUMERIC(6,2) DEFAULT 0,
  behavioral_domain_score NUMERIC(6,2) DEFAULT 0,

  -- Urgency classification
  urgency                 TEXT NOT NULL DEFAULT 'routine'
                          CHECK (urgency IN ('immediate', 'urgent', 'high', 'routine', 'monitor')),

  -- Signal breakdown that contributed to this score
  contributing_signal_ids UUID[] NOT NULL DEFAULT '{}',
  signal_count            INTEGER NOT NULL DEFAULT 0,
  high_severity_count     INTEGER NOT NULL DEFAULT 0,

  -- Constraint flags from 018
  is_constrained          BOOLEAN NOT NULL DEFAULT false,
  constraint_notes        TEXT[],

  -- Phase at time of scoring
  phase_at_score          player_phase NOT NULL DEFAULT 'training',

  -- Recommended focus (top priority action)
  primary_action          TEXT,
  secondary_action        TEXT,

  -- Score freshness
  scored_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signals_hash            TEXT,   -- MD5 of signal IDs — detect when rescore is needed

  UNIQUE(player_id)  -- one active score per player, refreshed in-place
);

CREATE INDEX idx_decision_scores_academy  ON decision_scores(academy_id, composite_score DESC);
CREATE INDEX idx_decision_scores_urgency  ON decision_scores(academy_id, urgency, scored_at DESC);

-- ============================================================
-- SCORE_PLAYER()
-- Core decision engine function.
-- Aggregates all active signals for a player into a composite score.
-- Returns the decision_scores row id.
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
  v_constrained BOOLEAN := false;
  v_constraint_notes TEXT[] := '{}';
  v_hash       TEXT;
  v_id         UUID;
BEGIN
  v_phase := get_player_phase(p_player_id);

  SELECT * INTO v_load FROM player_load_aggregation WHERE player_id = p_player_id;

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
    -- Get weight for this signal type
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
      -- Route to domain
      IF v_sig.domain = 'skill' OR v_sig.signal_type IN (
        'score_regression','score_stagnation','score_improvement','dimension_gap','promotion_ready','assessment_completed'
      ) THEN
        v_skill := v_skill + v_point;
      ELSIF v_sig.domain = 'competition' OR v_sig.signal_type IN (
        'utr_regression','utr_stagnation','utr_underperformance','low_match_volume','utr_improvement','utr_overperformance','high_match_volume'
      ) THEN
        v_comp := v_comp + v_point;
      ELSIF v_sig.signal_type IN (
        'load_overload_detected','overtraining_risk','constraint_active'
      ) THEN
        v_fitness := v_fitness + v_point;
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

  -- Composite: weighted domain sum, normalized to 0–100
  v_composite := LEAST(100, (v_skill + v_comp + v_fitness + v_behavioral));
  -- Domain normalization: cap each at 40 so no single domain dominates composite
  v_skill      := LEAST(40, v_skill);
  v_comp       := LEAST(40, v_comp);
  v_fitness    := LEAST(40, v_fitness);
  v_behavioral := LEAST(40, v_behavioral);

  -- Urgency classification
  v_urgency := CASE
    WHEN v_high_count >= 2 OR v_composite >= 80 THEN 'immediate'
    WHEN v_high_count >= 1 OR v_composite >= 55 THEN 'urgent'
    WHEN v_composite >= 35                      THEN 'high'
    WHEN v_sig_count > 0                        THEN 'routine'
    ELSE                                             'monitor'
  END;

  -- Primary action hint (highest-scoring domain)
  v_primary := CASE GREATEST(v_skill, v_comp, v_fitness, v_behavioral)
    WHEN v_skill      THEN 'schedule_skill_session'
    WHEN v_comp       THEN 'increase_competition'
    WHEN v_fitness    THEN 'reduce_load'
    ELSE                   'schedule_reassessment'
  END;

  -- Hash for change detection
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
-- SCORE_ACADEMY_PLAYERS()
-- Batch re-scores all active players in an academy.
-- Run nightly or after bulk signal emissions.
-- ============================================================
CREATE OR REPLACE FUNCTION score_academy_players(p_academy_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_player_id UUID;
  v_count     INTEGER := 0;
BEGIN
  FOR v_player_id IN
    SELECT id FROM players
    WHERE academy_id = p_academy_id AND is_active = true AND status = 'active'
  LOOP
    PERFORM score_player(v_player_id, p_academy_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: re-score player when a new signal is emitted
CREATE OR REPLACE FUNCTION tr_rescore_on_signal()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM score_player(NEW.player_id, NEW.academy_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_signal_triggers_rescore
  AFTER INSERT ON player_development_signals
  FOR EACH ROW EXECUTE FUNCTION tr_rescore_on_signal();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE signal_priority_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_scores         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see signal weights"    ON signal_priority_weights FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage weights"    ON signal_priority_weights FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "Staff see decision scores"   ON decision_scores FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages decision scores" ON decision_scores FOR ALL USING (academy_id = auth_academy_id());
