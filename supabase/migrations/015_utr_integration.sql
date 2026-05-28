-- ============================================================
-- ACADEMY OS — MIGRATION 015: UTR INTEGRATION
-- Exact table names per architecture spec:
--   player_utr_profiles, player_utr_history, player_utr_matches, player_utr_insights
--
-- Integration points:
--   → assessments (cross-validate UTR vs. assessment score)
--   → player_development_signals (UTR feeds signals)
--   → player_recommendations (UTR informs competition path decisions)
--   → sessions (match volume drives session recommendations)
-- ============================================================

-- ============================================================
-- PLAYER UTR PROFILES
-- One row per player. Tracks current UTR and UTR ID.
-- Updated via process_utr_update() whenever a new rating arrives.
-- ============================================================
CREATE TABLE player_utr_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE UNIQUE,

  utr_singles       NUMERIC(4,2) CHECK (utr_singles BETWEEN 0 AND 16),
  utr_doubles       NUMERIC(4,2) CHECK (utr_doubles BETWEEN 0 AND 16),
  utr_status        TEXT CHECK (utr_status IN ('rated', 'provisional', 'unrated')),
  utr_player_id     TEXT,   -- UTR's canonical player identifier

  matches_played_ytd    INTEGER DEFAULT 0,
  matches_played_90d    INTEGER DEFAULT 0,
  wins_90d              INTEGER DEFAULT 0,
  losses_90d            INTEGER DEFAULT 0,
  win_rate_90d          NUMERIC(4,3) GENERATED ALWAYS AS (
    CASE WHEN COALESCE(matches_played_90d, 0) = 0 THEN NULL
    ELSE ROUND(wins_90d::NUMERIC / matches_played_90d, 3) END
  ) STORED,

  last_match_date       DATE,
  last_synced_at        TIMESTAMPTZ,
  sync_source           TEXT DEFAULT 'manual',  -- 'manual' | 'api_sync' | 'tournament_import'

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utr_profiles_academy ON player_utr_profiles(academy_id);

CREATE TRIGGER tr_utr_profiles_updated_at
  BEFORE UPDATE ON player_utr_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PLAYER UTR HISTORY
-- Time-series of UTR ratings. One row per snapshot.
-- Replaces utr_ratings — same concept, exact name per spec.
-- ============================================================
CREATE TABLE player_utr_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  utr_value       NUMERIC(4,2) NOT NULL CHECK (utr_value BETWEEN 0 AND 16),
  utr_type        TEXT NOT NULL DEFAULT 'singles' CHECK (utr_type IN ('singles', 'doubles')),
  utr_status      TEXT CHECK (utr_status IN ('rated', 'provisional', 'unrated')),

  delta_from_previous NUMERIC(5,2),  -- computed when inserted

  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual', 'api_sync', 'tournament_result'))
);

CREATE INDEX idx_utr_history_player  ON player_utr_history(player_id, captured_at DESC);
CREATE INDEX idx_utr_history_academy ON player_utr_history(academy_id, captured_at DESC);

-- Auto-compute delta on insert
CREATE OR REPLACE FUNCTION tr_compute_utr_delta()
RETURNS TRIGGER AS $$
DECLARE v_prev NUMERIC(4,2);
BEGIN
  SELECT utr_value INTO v_prev
  FROM player_utr_history
  WHERE player_id = NEW.player_id AND utr_type = NEW.utr_type
  AND id != NEW.id
  ORDER BY captured_at DESC LIMIT 1;

  NEW.delta_from_previous := NEW.utr_value - v_prev;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_utr_history_delta
  BEFORE INSERT ON player_utr_history
  FOR EACH ROW EXECUTE FUNCTION tr_compute_utr_delta();

-- ============================================================
-- PLAYER UTR MATCHES
-- Individual match results for match-volume signal.
-- ============================================================
CREATE TABLE player_utr_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  match_date      DATE NOT NULL,
  opponent_name   TEXT,
  opponent_utr    NUMERIC(4,2),
  result          TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  score           TEXT,
  tournament_name TEXT,
  surface         TEXT CHECK (surface IN ('hard', 'clay', 'grass', 'carpet', NULL)),
  utr_impact      NUMERIC(5,2),   -- estimated rating change

  -- Link to competition_schedule if pre-planned
  -- TODO: Add FK to competition_schedule once table exists
  competition_id UUID,

  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utr_matches_player ON player_utr_matches(player_id, match_date DESC);
CREATE INDEX idx_utr_matches_dates  ON player_utr_matches(academy_id, match_date DESC);

-- ============================================================
-- PLAYER UTR INSIGHTS
-- Derived analytical insights from UTR data.
-- Each insight corresponds to a player_development_signal.
-- ============================================================
CREATE TABLE player_utr_insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  insight_type      TEXT NOT NULL CHECK (insight_type IN (
    'stagnation',           -- no meaningful UTR change
    'regression',           -- UTR dropped
    'improvement',          -- UTR increased
    'underperformance',     -- UTR below assessment-predicted level
    'overperformance',      -- UTR above assessment-predicted level
    'low_match_volume',     -- not enough competitive matches
    'high_win_rate',        -- performing well vs. competition field
    'low_win_rate',         -- struggling in competition
    'surface_gap'           -- strong on one surface, weak on another
  )),

  period_days       INTEGER,       -- lookback window for this insight
  utr_at_period_start NUMERIC(4,2),
  utr_current       NUMERIC(4,2),
  delta             NUMERIC(5,2),

  insight_text      TEXT NOT NULL,  -- human-readable summary
  data              JSONB,

  -- Link to the signal this insight generated
  signal_id         UUID REFERENCES player_development_signals(id),

  is_active         BOOLEAN NOT NULL DEFAULT true,
  calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utr_insights_player ON player_utr_insights(player_id, is_active, calculated_at DESC);

-- ============================================================
-- PROCESS_UTR_UPDATE()
-- Called after inserting a player_utr_history row.
-- Updates profile, computes insights, emits signals.
-- ============================================================
CREATE OR REPLACE FUNCTION process_utr_update(p_history_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_hist          player_utr_history%ROWTYPE;
  v_profile       player_utr_profiles%ROWTYPE;
  v_assess_score  NUMERIC(4,2);
  v_match_count   INTEGER;
  v_wins          INTEGER;
  v_sig_id        UUID;
  v_insight_id    UUID;
  v_signals       INTEGER := 0;
BEGIN
  SELECT * INTO v_hist FROM player_utr_history WHERE id = p_history_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'UTR history record not found: %', p_history_id; END IF;

  -- Update profile
  INSERT INTO player_utr_profiles (academy_id, player_id, utr_singles, utr_status, last_synced_at, sync_source)
  VALUES (v_hist.academy_id, v_hist.player_id, v_hist.utr_value, v_hist.utr_status, NOW(), v_hist.source)
  ON CONFLICT (player_id) DO UPDATE SET
    utr_singles    = CASE WHEN v_hist.utr_type = 'singles' THEN EXCLUDED.utr_singles ELSE player_utr_profiles.utr_singles END,
    utr_doubles    = CASE WHEN v_hist.utr_type = 'doubles' THEN EXCLUDED.utr_singles ELSE player_utr_profiles.utr_doubles END,
    utr_status     = EXCLUDED.utr_status,
    last_synced_at = NOW(),
    updated_at     = NOW();

  -- Get assessment score for cross-domain validation
  SELECT overall_score INTO v_assess_score FROM assessments
  WHERE player_id = v_hist.player_id ORDER BY assessed_date DESC LIMIT 1;

  -- Get recent match volume
  SELECT COUNT(*), COUNT(*) FILTER (WHERE result = 'win')
  INTO v_match_count, v_wins
  FROM player_utr_matches
  WHERE player_id = v_hist.player_id AND match_date > CURRENT_DATE - 90;

  -- Update profile match stats
  UPDATE player_utr_profiles SET
    matches_played_90d = v_match_count,
    wins_90d           = v_wins,
    losses_90d         = v_match_count - v_wins
  WHERE player_id = v_hist.player_id;

  -- Emit and record insights based on delta
  IF v_hist.delta_from_previous IS NOT NULL THEN

    IF v_hist.delta_from_previous >= 0.10 THEN
      v_sig_id := emit_signal(
        v_hist.academy_id, v_hist.player_id, 'utr_improvement', 'utr',
        'UTR improvement: +' || v_hist.delta_from_previous,
        NULL, 'competition', 'medium', 0.950,
        jsonb_build_object('delta', v_hist.delta_from_previous, 'new_utr', v_hist.utr_value),
        NULL, 'player_utr_history', p_history_id,
        NOW() + INTERVAL '60 days', 0
      );
      INSERT INTO player_utr_insights (academy_id, player_id, insight_type, utr_current, delta, insight_text, data, signal_id)
      VALUES (v_hist.academy_id, v_hist.player_id, 'improvement', v_hist.utr_value, v_hist.delta_from_previous,
        'UTR improved by ' || v_hist.delta_from_previous || ' to ' || v_hist.utr_value,
        jsonb_build_object('delta', v_hist.delta_from_previous), v_sig_id);
      v_signals := v_signals + 1;
    END IF;

    IF v_hist.delta_from_previous <= -0.15 THEN
      v_sig_id := emit_signal(
        v_hist.academy_id, v_hist.player_id, 'utr_regression', 'utr',
        'UTR regression: ' || v_hist.delta_from_previous,
        NULL, 'competition', 'high', 0.950,
        jsonb_build_object('delta', v_hist.delta_from_previous, 'new_utr', v_hist.utr_value),
        'schedule_reassessment', 'player_utr_history', p_history_id,
        NOW() + INTERVAL '30 days', 0
      );
      v_signals := v_signals + 1;
    END IF;

    IF ABS(COALESCE(v_hist.delta_from_previous, 0)) < 0.05 THEN
      -- Only emit stagnation if it's been 90+ days without a prior update
      v_sig_id := emit_signal(
        v_hist.academy_id, v_hist.player_id, 'utr_stagnation', 'utr',
        'UTR stagnant at ' || v_hist.utr_value,
        'No meaningful UTR movement detected',
        'competition', 'medium', 0.850,
        jsonb_build_object('utr', v_hist.utr_value),
        'increase_competition', 'player_utr_history', p_history_id,
        NOW() + INTERVAL '45 days', 72
      );
      v_signals := v_signals + 1;
    END IF;
  END IF;

  -- Low match volume
  IF v_match_count < 4 THEN
    v_sig_id := emit_signal(
      v_hist.academy_id, v_hist.player_id, 'low_match_volume', 'utr',
      'Low match volume: ' || v_match_count || ' matches in 90 days',
      'Target: 4+ per quarter',
      'competition', 'medium', 0.900,
      jsonb_build_object('match_count', v_match_count, 'threshold', 4),
      'increase_competition', 'player_utr_history', p_history_id,
      NOW() + INTERVAL '30 days', 168
    );
    v_signals := v_signals + 1;
  END IF;

  -- Underperformance vs. assessment
  IF v_assess_score IS NOT NULL AND v_hist.utr_value < (v_assess_score * 0.8) THEN
    v_sig_id := emit_signal(
      v_hist.academy_id, v_hist.player_id, 'utr_underperformance', 'utr',
      'UTR below expected for skill level',
      'UTR ' || v_hist.utr_value || ' vs. expected min ' || ROUND(v_assess_score * 0.8, 2),
      'competition', 'medium', 0.750,
      jsonb_build_object('utr', v_hist.utr_value, 'assessment_score', v_assess_score),
      'increase_competition', 'player_utr_history', p_history_id,
      NOW() + INTERVAL '60 days', 168
    );
    v_signals := v_signals + 1;
  END IF;

  RETURN jsonb_build_object('success', true, 'history_id', p_history_id, 'signals_emitted', v_signals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_utr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_utr_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_utr_matches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_utr_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see UTR profiles"   ON player_utr_profiles FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage UTR profiles" ON player_utr_profiles FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see UTR history"    ON player_utr_history FOR SELECT  USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage UTR history" ON player_utr_history FOR ALL     USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see UTR matches"    ON player_utr_matches FOR SELECT  USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Staff manage UTR matches" ON player_utr_matches FOR ALL     USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see UTR insights"   ON player_utr_insights FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own UTR data"
  ON player_utr_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM players p WHERE p.id = player_utr_profiles.player_id AND p.profile_id = auth.uid()));
