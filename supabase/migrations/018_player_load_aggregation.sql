-- ============================================================
-- ACADEMY OS — MIGRATION 018: PLAYER LOAD AGGREGATION
-- player_load_aggregation: 7-day and 28-day rolling windows.
-- Fatigue risk score computed from load + phase + signals.
--
-- Loop position:
--   ← sessions (raw load inputs)
--   ← player_phase_states (phase constraints)
--   → player_development_signals (overload/fatigue signals)
--   → player_time_series (fatigue_risk_score recorded)
--   → decision engine (constrains recommendations)
-- ============================================================

-- ============================================================
-- PLAYER LOAD AGGREGATION
-- Pre-computed rolling windows. Updated after each session completion.
-- Keeps the decision engine from having to join and aggregate at query time.
-- ============================================================
CREATE TABLE player_load_aggregation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Rolling 7-day window
  window_7d_start       DATE NOT NULL,
  sessions_7d           INTEGER NOT NULL DEFAULT 0,
  duration_7d_min       INTEGER NOT NULL DEFAULT 0,
  avg_intensity_7d      NUMERIC(4,2),
  avg_perceived_load_7d NUMERIC(4,2),
  high_intensity_blocks_7d INTEGER DEFAULT 0,
  absences_7d           INTEGER DEFAULT 0,

  -- Rolling 28-day window
  window_28d_start      DATE NOT NULL,
  sessions_28d          INTEGER NOT NULL DEFAULT 0,
  duration_28d_min      INTEGER NOT NULL DEFAULT 0,
  avg_intensity_28d     NUMERIC(4,2),
  avg_perceived_load_28d NUMERIC(4,2),
  competition_sessions_28d INTEGER DEFAULT 0,
  skill_sessions_28d    INTEGER DEFAULT 0,
  fitness_sessions_28d  INTEGER DEFAULT 0,

  -- Fatigue risk score: 0.0 (fully fresh) – 1.0 (critical overload risk)
  -- Computed from: load trend, intensity, phase, missed sessions ratio
  fatigue_risk_score    NUMERIC(4,3) DEFAULT 0.000
                        CHECK (fatigue_risk_score BETWEEN 0 AND 1),
  fatigue_risk_label    TEXT         DEFAULT 'low'
                        CHECK (fatigue_risk_label IN ('low', 'moderate', 'high', 'critical')),

  -- Trend: is load increasing, stable, or decreasing vs. prior 7d?
  load_trend_7d         TEXT DEFAULT 'stable'
                        CHECK (load_trend_7d IN ('increasing', 'stable', 'decreasing')),

  -- Flag: overload detected (all domain intensities ≥ 4)
  overload_flag         BOOLEAN NOT NULL DEFAULT false,

  calculated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id)  -- one active row per player, updated in-place
);

CREATE INDEX idx_load_aggregation_academy ON player_load_aggregation(academy_id, fatigue_risk_label);

-- ============================================================
-- COMPUTE_PLAYER_LOAD()
-- Recalculates load aggregation for one player.
-- Should be called after any session completion or outcome record.
-- ============================================================
CREATE OR REPLACE FUNCTION compute_player_load(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_7d        RECORD;
  v_28d       RECORD;
  v_phase     player_phase;
  v_fatigue   NUMERIC(4,3);
  v_label     TEXT;
  v_trend     TEXT;
  v_prev_dur  INTEGER;
BEGIN
  -- 7-day window
  SELECT
    COUNT(DISTINCT s.id)                                                    AS sessions,
    COALESCE(SUM(s.duration_min), 0)                                        AS duration_min,
    ROUND(AVG(sb.intensity), 2)                                             AS avg_intensity,
    ROUND(AVG(po.perceived_load), 2)                                        AS avg_perc_load,
    COUNT(sb.id) FILTER (WHERE sb.intensity >= 4)                           AS high_blocks,
    COUNT(sa.id) FILTER (WHERE sa.status = 'absent')                        AS absences
  INTO v_7d
  FROM session_attendance sa
  JOIN sessions s     ON s.id = sa.session_id AND s.status = 'completed'
  LEFT JOIN session_blocks sb ON sb.session_id = s.id
  LEFT JOIN player_outcomes po ON po.session_id = s.id AND po.player_id = p_player_id
  WHERE sa.player_id = p_player_id
  AND s.scheduled_date >= CURRENT_DATE - 7;

  -- 28-day window
  SELECT
    COUNT(DISTINCT s.id)                                                      AS sessions,
    COALESCE(SUM(s.duration_min), 0)                                          AS duration_min,
    ROUND(AVG(sb.intensity), 2)                                               AS avg_intensity,
    ROUND(AVG(po.perceived_load), 2)                                          AS avg_perc_load,
    COUNT(DISTINCT s.id) FILTER (WHERE g.track = 'competition')               AS comp_sessions,
    COUNT(DISTINCT s.id) FILTER (WHERE g.track = 'skill')                     AS skill_sessions,
    COUNT(DISTINCT s.id) FILTER (WHERE g.track = 'fitness')                   AS fitness_sessions
  INTO v_28d
  FROM session_attendance sa
  JOIN sessions s     ON s.id = sa.session_id AND s.status = 'completed'
  LEFT JOIN groups g  ON g.id = s.group_id
  LEFT JOIN session_blocks sb ON sb.session_id = s.id
  LEFT JOIN player_outcomes po ON po.session_id = s.id AND po.player_id = p_player_id
  WHERE sa.player_id = p_player_id
  AND s.scheduled_date >= CURRENT_DATE - 28;

  -- Get prior 7d duration for trend calculation
  SELECT COALESCE(SUM(s.duration_min), 0) INTO v_prev_dur
  FROM session_attendance sa
  JOIN sessions s ON s.id = sa.session_id AND s.status = 'completed'
  WHERE sa.player_id = p_player_id
  AND s.scheduled_date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE - 8;

  v_trend := CASE
    WHEN v_7d.duration_min > v_prev_dur * 1.15 THEN 'increasing'
    WHEN v_7d.duration_min < v_prev_dur * 0.85 THEN 'decreasing'
    ELSE 'stable'
  END;

  v_phase := get_player_phase(p_player_id);

  -- Fatigue risk model:
  -- Base: avg_intensity_7d / 5 * 0.4 + sessions_7d / 7 * 0.3 + trend_factor * 0.2 + phase_factor * 0.1
  v_fatigue := LEAST(1.0, GREATEST(0.0,
    COALESCE(v_7d.avg_intensity, 0) / 5.0 * 0.40
    + LEAST(v_7d.sessions, 7)::NUMERIC / 7.0 * 0.30
    + CASE v_trend WHEN 'increasing' THEN 0.20 WHEN 'stable' THEN 0.10 ELSE 0.0 END
    + CASE v_phase
        WHEN 'competition'     THEN 0.10  -- already stressed
        WHEN 'recovery'        THEN -0.10 -- expected to have lower load
        ELSE 0.0
      END
  ));

  v_label := CASE
    WHEN v_fatigue >= 0.75 THEN 'critical'
    WHEN v_fatigue >= 0.55 THEN 'high'
    WHEN v_fatigue >= 0.35 THEN 'moderate'
    ELSE 'low'
  END;

  INSERT INTO player_load_aggregation (
    academy_id, player_id,
    window_7d_start, sessions_7d, duration_7d_min, avg_intensity_7d, avg_perceived_load_7d,
    high_intensity_blocks_7d, absences_7d,
    window_28d_start, sessions_28d, duration_28d_min, avg_intensity_28d, avg_perceived_load_28d,
    competition_sessions_28d, skill_sessions_28d, fitness_sessions_28d,
    fatigue_risk_score, fatigue_risk_label, load_trend_7d,
    overload_flag, calculated_at
  )
  VALUES (
    p_academy_id, p_player_id,
    CURRENT_DATE - 7, v_7d.sessions, v_7d.duration_min, v_7d.avg_intensity, v_7d.avg_perc_load,
    v_7d.high_blocks, v_7d.absences,
    CURRENT_DATE - 28, v_28d.sessions, v_28d.duration_min, v_28d.avg_intensity, v_28d.avg_perc_load,
    v_28d.comp_sessions, v_28d.skill_sessions, v_28d.fitness_sessions,
    v_fatigue, v_label, v_trend,
    (COALESCE(v_7d.avg_intensity, 0) >= 4 AND v_7d.sessions >= 5),
    NOW()
  )
  ON CONFLICT (player_id) DO UPDATE SET
    window_7d_start        = CURRENT_DATE - 7,
    sessions_7d            = EXCLUDED.sessions_7d,
    duration_7d_min        = EXCLUDED.duration_7d_min,
    avg_intensity_7d       = EXCLUDED.avg_intensity_7d,
    avg_perceived_load_7d  = EXCLUDED.avg_perceived_load_7d,
    high_intensity_blocks_7d = EXCLUDED.high_intensity_blocks_7d,
    absences_7d            = EXCLUDED.absences_7d,
    window_28d_start       = CURRENT_DATE - 28,
    sessions_28d           = EXCLUDED.sessions_28d,
    duration_28d_min       = EXCLUDED.duration_28d_min,
    avg_intensity_28d      = EXCLUDED.avg_intensity_28d,
    competition_sessions_28d = EXCLUDED.competition_sessions_28d,
    skill_sessions_28d     = EXCLUDED.skill_sessions_28d,
    fitness_sessions_28d   = EXCLUDED.fitness_sessions_28d,
    fatigue_risk_score     = EXCLUDED.fatigue_risk_score,
    fatigue_risk_label     = EXCLUDED.fatigue_risk_label,
    load_trend_7d          = EXCLUDED.load_trend_7d,
    overload_flag          = EXCLUDED.overload_flag,
    calculated_at          = NOW();

  -- Record in time series
  PERFORM record_time_series_point(p_academy_id, p_player_id, 'fatigue_risk_score', v_fatigue, CURRENT_DATE, 'load', NULL);
  PERFORM record_time_series_point(p_academy_id, p_player_id, 'weekly_sessions',    v_7d.sessions,     CURRENT_DATE, 'load', NULL);
  PERFORM record_time_series_point(p_academy_id, p_player_id, 'weekly_duration_min', v_7d.duration_min, CURRENT_DATE, 'load', NULL);
  PERFORM record_time_series_point(p_academy_id, p_player_id, 'avg_intensity',       v_7d.avg_intensity, CURRENT_DATE, 'load', NULL);

  -- Emit signals for high/critical fatigue
  IF v_label IN ('high', 'critical') THEN
    PERFORM emit_signal(
      p_academy_id, p_player_id,
      'overtraining_risk', 'constraint_check',
      'Fatigue risk: ' || v_label || ' (' || ROUND(v_fatigue * 100) || '%)',
      'Sessions 7d: ' || v_7d.sessions || ', Avg intensity: ' || COALESCE(v_7d.avg_intensity::TEXT, 'n/a'),
      NULL,
      CASE v_label WHEN 'critical' THEN 'critical' ELSE 'high' END,
      0.800,
      jsonb_build_object(
        'fatigue_score', v_fatigue, 'label', v_label,
        'sessions_7d', v_7d.sessions, 'avg_intensity_7d', v_7d.avg_intensity
      ),
      NULL, 'player_load_aggregation', NULL,
      NOW() + INTERVAL '7 days', 72
    );
  END IF;

  RETURN v_fatigue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: recompute load when a session is marked completed
CREATE OR REPLACE FUNCTION tr_recompute_load_on_session_complete()
RETURNS TRIGGER AS $$
DECLARE v_player_id UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    FOR v_player_id IN
      SELECT DISTINCT player_id FROM session_attendance WHERE session_id = NEW.id
    LOOP
      PERFORM compute_player_load(v_player_id, NEW.academy_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_session_complete_load
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION tr_recompute_load_on_session_complete();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_load_aggregation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see load aggregation"
  ON player_load_aggregation FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "System manages load aggregation"
  ON player_load_aggregation FOR ALL
  USING (academy_id = auth_academy_id());
