-- ============================================================
-- ACADEMY OS — MIGRATION 014: PLAYER DEVELOPMENT SIGNAL LAYER
-- THE MOAT. The central nervous system of the recommendation engine.
--
-- Every observation, assessment delta, UTR change, session outcome,
-- and coach override produces a signal here. The decision engine
-- reads this table to generate ranked recommendations.
--
-- Design principles:
--   - Signals are immutable once created (append-only)
--   - Multiple signals can fire for the same player simultaneously
--   - Signals have severity + confidence, not just boolean flags
--   - Signals auto-expire (configurable per type)
--   - Cross-domain signals (e.g., UTR stagnation + behavioral dip) are
--     resolved by the decision engine, not here
-- ============================================================

-- ============================================================
-- SIGNAL TYPE ENUM
-- All signal types that can be emitted.
-- ============================================================
CREATE TYPE signal_type AS ENUM (
  -- Assessment-derived
  'assessment_completed',
  'score_improvement',           -- overall or dimension delta > threshold
  'score_regression',            -- overall or dimension delta < -threshold
  'score_stagnation',            -- no meaningful change over N assessments
  'dimension_gap',               -- one dimension significantly below others
  'dimension_breakout',          -- one dimension significantly above others
  'promotion_ready',             -- all criteria met for level promotion
  'promotion_flagged',           -- manual flag by coach

  -- UTR-derived (populated by 015_utr_integration.sql)
  'utr_improvement',
  'utr_regression',
  'utr_stagnation',
  'utr_underperformance',        -- UTR below expected given assessment scores
  'utr_overperformance',         -- UTR above expected given assessment scores
  'low_match_volume',            -- player not competing enough
  'high_match_volume',           -- player competing more than load allows

  -- Session outcome-derived (populated by 016_player_outcomes.sql)
  'session_outcome_positive',
  'session_outcome_negative',
  'attendance_pattern_concern',  -- persistent absences or lates
  'load_overload_detected',      -- session load flags triggered

  -- Coach-derived
  'coach_priority_flagged',      -- coach manually emits a development priority
  'coach_concern_flagged',       -- coach marks player as needing attention
  'injury_concern',

  -- Time/calendar-derived (populated by 017_time_intelligence.sql)
  'competition_season_start',
  'competition_season_end',
  'peak_competition_period',
  'preparation_phase_start',
  'overtraining_risk',           -- load + time intel combination

  -- Constraint-derived (populated by 018_constraint_intelligence.sql)
  'constraint_active',           -- player has an active constraint (injury, max sessions)
  'constraint_resolved',

  -- System
  'reassessment_overdue',
  'reassessment_approaching'
);

-- ============================================================
-- SIGNAL SOURCE ENUM
-- What generated this signal.
-- ============================================================
CREATE TYPE signal_source AS ENUM (
  'assessment',
  'utr',
  'session_outcome',
  'coach_note',
  'coach_manual',
  'calendar',
  'constraint_check',
  'system_cron'
);

-- ============================================================
-- PLAYER DEVELOPMENT SIGNALS
-- Append-only. One row per signal emission.
-- ============================================================
CREATE TABLE player_development_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Signal classification
  signal_type     signal_type NOT NULL,
  source          signal_source NOT NULL,
  domain          development_track,  -- which track this signal primarily affects (NULL = all)

  -- Signal strength
  severity        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence      NUMERIC(4,3) NOT NULL DEFAULT 1.000
                  CHECK (confidence BETWEEN 0 AND 1),

  -- Signal data
  title           TEXT NOT NULL,   -- human-readable: "UTR stagnation for 60+ days"
  description     TEXT,
  data            JSONB,           -- supporting metrics: {"delta": -0.4, "period_days": 60, ...}
  -- Recommended action hint (for the decision engine)
  recommended_action TEXT,         -- 'schedule_reassessment' | 'increase_competition' | etc.

  -- Source traceability
  source_object_type TEXT,         -- 'assessment' | 'session' | 'utr_rating' | etc.
  source_object_id   UUID,

  -- Lifecycle
  is_active       BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,     -- NULL = manual expiry only
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES profiles(id),
  resolution_note TEXT,

  -- Whether the decision engine has processed this signal
  processed_by_engine    BOOLEAN NOT NULL DEFAULT false,
  engine_processed_at    TIMESTAMPTZ,

  emitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_player        ON player_development_signals(player_id, is_active, emitted_at DESC);
CREATE INDEX idx_signals_academy_type  ON player_development_signals(academy_id, signal_type, is_active);
CREATE INDEX idx_signals_unprocessed   ON player_development_signals(academy_id, is_active)
  WHERE processed_by_engine = false;
CREATE INDEX idx_signals_active        ON player_development_signals(expires_at)
  WHERE is_active = true AND expires_at IS NOT NULL;

-- ============================================================
-- EMIT_SIGNAL()
-- Standard interface for emitting a signal. Called by all source layers.
-- Deduplicates: will not emit a duplicate of the same type within cooldown_hours.
-- ============================================================
CREATE OR REPLACE FUNCTION emit_signal(
  p_academy_id         UUID,
  p_player_id          UUID,
  p_signal_type        signal_type,
  p_source             signal_source,
  p_title              TEXT,
  p_description        TEXT         DEFAULT NULL,
  p_domain             development_track DEFAULT NULL,
  p_severity           TEXT         DEFAULT 'medium',
  p_confidence         NUMERIC      DEFAULT 1.000,
  p_data               JSONB        DEFAULT NULL,
  p_recommended_action TEXT         DEFAULT NULL,
  p_source_object_type TEXT         DEFAULT NULL,
  p_source_object_id   UUID         DEFAULT NULL,
  p_expires_at         TIMESTAMPTZ  DEFAULT NULL,
  p_cooldown_hours     INTEGER      DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Deduplication: skip if same signal type for same player within cooldown window
  IF p_cooldown_hours > 0 THEN
    IF EXISTS (
      SELECT 1 FROM player_development_signals
      WHERE player_id = p_player_id
      AND signal_type = p_signal_type
      AND is_active = true
      AND emitted_at > NOW() - (p_cooldown_hours || ' hours')::INTERVAL
    ) THEN
      RETURN NULL;  -- duplicate suppressed
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
-- RESOLVE_SIGNAL()
-- Marks a signal as resolved. Called when the recommended action is taken.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_signal(
  p_signal_id     UUID,
  p_resolved_by   UUID,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE player_development_signals SET
    is_active       = false,
    resolved_at     = NOW(),
    resolved_by     = p_resolved_by,
    resolution_note = p_resolution_note
  WHERE id = p_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Auto-expire signals past their expires_at
-- Called by flag_overdue_reassessments() nightly schedule
-- ============================================================
CREATE OR REPLACE FUNCTION expire_stale_signals()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE player_development_signals SET
    is_active   = false,
    resolved_at = NOW(),
    resolution_note = 'auto_expired'
  WHERE is_active = true
  AND expires_at IS NOT NULL
  AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: emit reassessment signals when player status changes
-- ============================================================
CREATE OR REPLACE FUNCTION tr_emit_reassessment_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'reassessment_due' AND OLD.status != 'reassessment_due' THEN
    PERFORM emit_signal(
      NEW.academy_id,
      NEW.id,
      'reassessment_overdue',
      'system_cron',
      'Reassessment overdue: ' || NEW.full_name,
      'Next assessment was due ' || NEW.next_assessment_due::TEXT,
      NULL,
      'medium',
      1.000,
      jsonb_build_object('due_date', NEW.next_assessment_due, 'days_overdue', CURRENT_DATE - NEW.next_assessment_due),
      'schedule_reassessment',
      'player',
      NEW.id,
      NULL,
      24
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_player_reassessment_signal
  AFTER UPDATE ON players
  FOR EACH ROW
  WHEN (NEW.status = 'reassessment_due' AND OLD.status IS DISTINCT FROM 'reassessment_due')
  EXECUTE FUNCTION tr_emit_reassessment_signal();

-- ============================================================
-- TRIGGER: emit score signals after assessment
-- ============================================================
CREATE OR REPLACE FUNCTION tr_emit_assessment_signals()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_score  NUMERIC(4,2);
  v_delta       NUMERIC(4,2);
BEGIN
  -- Get the previous assessment overall score
  SELECT overall_score INTO v_prev_score
  FROM assessments
  WHERE player_id = NEW.player_id
  AND id != NEW.id
  ORDER BY assessed_date DESC
  LIMIT 1;

  IF v_prev_score IS NOT NULL AND NEW.overall_score IS NOT NULL THEN
    v_delta := NEW.overall_score - v_prev_score;

    IF v_delta >= 0.5 THEN
      PERFORM emit_signal(
        NEW.academy_id, NEW.player_id, 'score_improvement', 'assessment',
        'Score improvement: +' || v_delta,
        NULL, NULL, 'medium', 0.900,
        jsonb_build_object('delta', v_delta, 'from_score', v_prev_score, 'to_score', NEW.overall_score),
        NULL, 'assessment', NEW.id, NOW() + INTERVAL '90 days', 0
      );
    ELSIF v_delta <= -0.5 THEN
      PERFORM emit_signal(
        NEW.academy_id, NEW.player_id, 'score_regression', 'assessment',
        'Score regression: ' || v_delta,
        NULL, NULL, 'high', 0.900,
        jsonb_build_object('delta', v_delta, 'from_score', v_prev_score, 'to_score', NEW.overall_score),
        'schedule_reassessment', 'assessment', NEW.id, NOW() + INTERVAL '30 days', 0
      );
    END IF;
  END IF;

  IF NEW.promotion_ready = true THEN
    PERFORM emit_signal(
      NEW.academy_id, NEW.player_id, 'promotion_ready', 'assessment',
      'Promotion ready: ' || NEW.player_id,
      NEW.promotion_notes, NULL, 'high', 0.850,
      jsonb_build_object('assessment_id', NEW.id),
      'move_player_group', 'assessment', NEW.id, NOW() + INTERVAL '60 days', 0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assessment_emit_signals
  AFTER INSERT ON assessments
  FOR EACH ROW EXECUTE FUNCTION tr_emit_assessment_signals();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_development_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see signals"
  ON player_development_signals FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "System inserts signals"
  ON player_development_signals FOR INSERT
  WITH CHECK (academy_id = auth_academy_id());

CREATE POLICY "Staff resolve signals"
  ON player_development_signals FOR UPDATE
  USING (academy_id = auth_academy_id() AND auth_is_staff());
