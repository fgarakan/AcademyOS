-- ============================================================
-- ACADEMY OS — MIGRATION 017: TIME INTELLIGENCE
-- player_time_series, player_phase_states, academy calendar.
--
-- Loop position: feeds player_load_aggregation (018)
-- and constrains player_recommendations (020).
--
-- player_time_series: generic time-series for any numeric metric.
-- player_phase_states: training | pre_competition | competition | recovery
-- academy_calendar: season-level events affecting all players.
-- competition_schedule: individual player competition plan.
-- ============================================================

-- ============================================================
-- PLAYER TIME SERIES
-- Generic append-only metric store. One row per (player, metric, date).
-- Populated by assessments, sessions, UTR updates, and load calculations.
-- Query pattern: give me the last 12 values of 'overall_score' for player X.
-- ============================================================
CREATE TYPE time_series_metric AS ENUM (
  -- Assessment-derived
  'overall_score',
  'technical_score',
  'tactical_score',
  'movement_score',
  'competition_score',
  'behavioral_score',
  -- UTR-derived
  'utr_singles',
  'utr_doubles',
  'match_win_rate_90d',
  'matches_played_90d',
  -- Load-derived
  'weekly_sessions',
  'weekly_duration_min',
  'avg_intensity',
  'fatigue_risk_score',
  -- Signal-derived
  'active_signal_count',
  'high_severity_signal_count'
);

CREATE TABLE player_time_series (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  metric          time_series_metric NOT NULL,
  recorded_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  value           NUMERIC(10,4) NOT NULL,

  source_type     TEXT NOT NULL DEFAULT 'system'
                  CHECK (source_type IN ('assessment', 'utr', 'load', 'signal', 'manual', 'system')),
  source_id       UUID,   -- ID of the originating record

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, metric, recorded_date)
);

CREATE INDEX idx_time_series_player_metric ON player_time_series(player_id, metric, recorded_date DESC);
CREATE INDEX idx_time_series_academy       ON player_time_series(academy_id, metric, recorded_date DESC);

-- ============================================================
-- RECORD_TIME_SERIES_POINT()
-- Upserts a time series data point.
-- Uses UNIQUE constraint — calling twice on the same date overwrites.
-- ============================================================
CREATE OR REPLACE FUNCTION record_time_series_point(
  p_academy_id  UUID,
  p_player_id   UUID,
  p_metric      time_series_metric,
  p_value       NUMERIC,
  p_date        DATE DEFAULT CURRENT_DATE,
  p_source_type TEXT DEFAULT 'system',
  p_source_id   UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO player_time_series (academy_id, player_id, metric, recorded_date, value, source_type, source_id)
  VALUES (p_academy_id, p_player_id, p_metric, p_date, p_value, p_source_type, p_source_id)
  ON CONFLICT (player_id, metric, recorded_date) DO UPDATE
  SET value = EXCLUDED.value, created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-record assessment scores into time series
CREATE OR REPLACE FUNCTION tr_assessment_to_time_series()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'overall_score',      NEW.overall_score,      NEW.assessed_date, 'assessment', NEW.id);
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'technical_score',    NEW.technical_score,    NEW.assessed_date, 'assessment', NEW.id);
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'tactical_score',     NEW.tactical_score,     NEW.assessed_date, 'assessment', NEW.id);
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'movement_score',     NEW.movement_score,     NEW.assessed_date, 'assessment', NEW.id);
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'competition_score',  NEW.competition_score,  NEW.assessed_date, 'assessment', NEW.id);
  PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'behavioral_score',   NEW.behavioral_score,   NEW.assessed_date, 'assessment', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assessment_time_series
  AFTER INSERT ON assessments
  FOR EACH ROW EXECUTE FUNCTION tr_assessment_to_time_series();

-- Auto-record UTR into time series
CREATE OR REPLACE FUNCTION tr_utr_to_time_series()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.utr_type = 'singles' THEN
    PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'utr_singles', NEW.utr_value, NEW.captured_at::DATE, 'utr', NEW.id);
  ELSE
    PERFORM record_time_series_point(NEW.academy_id, NEW.player_id, 'utr_doubles', NEW.utr_value, NEW.captured_at::DATE, 'utr', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_utr_history_time_series
  AFTER INSERT ON player_utr_history
  FOR EACH ROW EXECUTE FUNCTION tr_utr_to_time_series();

-- ============================================================
-- PLAYER PHASE STATES
-- training | pre_competition | competition | recovery
-- The active phase constrains what the decision engine recommends:
--   training:         maximize skill and fitness load
--   pre_competition:  maintain load, sharpen tactics
--   competition:      minimal new load, match-day prep only
--   recovery:         light load only; no high-intensity sessions
-- ============================================================
CREATE TYPE player_phase AS ENUM (
  'training',         -- base-building; skill + fitness focus
  'pre_competition',  -- 2–4 week lead-in; tactical sharpening
  'competition',      -- active tournament window
  'recovery'          -- post-tournament or post-injury rest
);

CREATE TABLE player_phase_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  phase           player_phase NOT NULL DEFAULT 'training',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,           -- NULL = open-ended; set when phase changes

  -- Phase constraints (override defaults)
  max_sessions_per_week   INTEGER,       -- NULL = phase default applies
  max_intensity           INTEGER CHECK (max_intensity BETWEEN 1 AND 5),
  competition_ok          BOOLEAN NOT NULL DEFAULT true,
  high_intensity_ok       BOOLEAN NOT NULL DEFAULT true,

  reason          TEXT,           -- why this phase was set
  set_by          UUID REFERENCES profiles(id),
  is_current      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One active phase per player at a time
CREATE UNIQUE INDEX idx_player_current_phase ON player_phase_states(player_id) WHERE is_current = true;
CREATE INDEX idx_phase_states_player ON player_phase_states(player_id, start_date DESC);

-- ============================================================
-- SET_PLAYER_PHASE()
-- Changes the active phase for a player.
-- Closes the previous phase and emits a calendar signal.
-- ============================================================
CREATE OR REPLACE FUNCTION set_player_phase(
  p_player_id UUID,
  p_academy_id UUID,
  p_phase     player_phase,
  p_end_date  DATE DEFAULT NULL,
  p_reason    TEXT DEFAULT NULL,
  p_set_by    UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  -- Close existing current phase
  UPDATE player_phase_states SET
    is_current = false,
    end_date   = CURRENT_DATE
  WHERE player_id = p_player_id AND is_current = true;

  INSERT INTO player_phase_states (academy_id, player_id, phase, start_date, end_date, reason, set_by, is_current)
  VALUES (p_academy_id, p_player_id, p_phase, CURRENT_DATE, p_end_date, p_reason, p_set_by, true)
  RETURNING id INTO v_id;

  -- Emit signal for the decision engine
  PERFORM emit_signal(
    p_academy_id, p_player_id,
    CASE p_phase
      WHEN 'competition'     THEN 'competition_season_start'::signal_type
      WHEN 'pre_competition' THEN 'preparation_phase_start'::signal_type
      WHEN 'recovery'        THEN 'preparation_phase_start'::signal_type
      ELSE                        'preparation_phase_start'::signal_type
    END,
    'calendar',
    'Phase changed to: ' || p_phase::TEXT,
    p_reason, NULL, 'low', 1.000,
    jsonb_build_object('phase', p_phase, 'start_date', CURRENT_DATE),
    NULL, 'player_phase_states', v_id,
    NOW() + INTERVAL '90 days', 0
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GET_PLAYER_PHASE()
-- Returns the current phase. Falls back to 'training' if none set.
-- ============================================================
CREATE OR REPLACE FUNCTION get_player_phase(p_player_id UUID)
RETURNS player_phase AS $$
  SELECT COALESCE(
    (SELECT phase FROM player_phase_states WHERE player_id = p_player_id AND is_current = true LIMIT 1),
    'training'::player_phase
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- PHASE DEFAULT CONSTRAINTS
-- What intensity/load is acceptable per phase.
-- Used by decision engine when no explicit override is set.
-- ============================================================
CREATE TABLE phase_load_defaults (
  phase                     player_phase PRIMARY KEY,
  max_sessions_per_week     INTEGER NOT NULL,
  max_intensity             INTEGER NOT NULL,
  competition_ok            BOOLEAN NOT NULL,
  high_intensity_pct_max    NUMERIC(4,2),  -- max % of blocks that can be intensity ≥ 4
  description               TEXT
);

INSERT INTO phase_load_defaults (phase, max_sessions_per_week, max_intensity, competition_ok, high_intensity_pct_max, description) VALUES
  ('training',        7, 5, true,  0.60, 'Full load. Maximize skill and fitness development.'),
  ('pre_competition', 6, 4, true,  0.40, 'Maintain fitness. Sharpen tactics. Reduce novelty.'),
  ('competition',     4, 3, true,  0.20, 'Match-day readiness only. Minimal new load.'),
  ('recovery',        3, 2, false, 0.10, 'Active recovery only. No competition. No high intensity.');

-- ============================================================
-- ACADEMY CALENDAR
-- Season-level events. Informs phase state suggestions.
-- ============================================================
CREATE TYPE calendar_event_type AS ENUM (
  'season_start', 'season_end',
  'competition_window_start', 'competition_window_end',
  'preparation_block_start', 'recovery_block_start',
  'academy_closure', 'assessment_window', 'team_event', 'other'
);

CREATE TABLE academy_calendar (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  event_type          calendar_event_type NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE,
  applies_to_groups   UUID[],
  applies_to_tracks   development_track[],
  description         TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_academy ON academy_calendar(academy_id, start_date);

-- ============================================================
-- COMPETITION SCHEDULE
-- Individual player tournament plan.
-- ============================================================
CREATE TABLE competition_schedule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  surface         TEXT CHECK (surface IN ('hard', 'clay', 'grass', 'carpet', NULL)),
  location        TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned', 'entered', 'completed', 'withdrawn')),
  result          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competition_player ON competition_schedule(player_id, start_date DESC);
CREATE INDEX idx_competition_dates  ON competition_schedule(academy_id, start_date);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_time_series   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_phase_states  ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_load_defaults  ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_calendar     ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see time series"    ON player_time_series FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff see phase states"   ON player_phase_states FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage phase states" ON player_phase_states FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "All see phase defaults"   ON phase_load_defaults FOR SELECT USING (true);
CREATE POLICY "Academy members see calendar" ON academy_calendar FOR SELECT USING (academy_id = auth_academy_id());
CREATE POLICY "Directors manage calendar"    ON academy_calendar FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "Staff see competition schedule"    ON competition_schedule FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage competition schedule" ON competition_schedule FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Players see own competition schedule"
  ON competition_schedule FOR SELECT
  USING (EXISTS (SELECT 1 FROM players p WHERE p.id = competition_schedule.player_id AND p.profile_id = auth.uid()));
