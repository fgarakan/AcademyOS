-- ============================================================
-- ACADEMY OS — MIGRATION 016: PLAYER OUTCOMES + PROGRESS SNAPSHOTS
-- Exact table names per architecture spec:
--   player_outcomes, player_progress_snapshots
--
-- Integration:
--   → sessions (each outcome tied to a session)
--   → assessments (snapshots triggered by assessments)
--   → player_development_signals (outcomes feed signals)
--   → learning system (outcomes close the recommendation loop)
-- ============================================================

-- ============================================================
-- PLAYER OUTCOMES
-- What actually happened for a player in a session.
-- The core feedback mechanism. Closes: Session → Outcome → Signal
-- ============================================================
CREATE TABLE player_outcomes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  recorded_by     UUID NOT NULL REFERENCES profiles(id),

  -- Quick rating (1–5)
  performance_rating  INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
  energy_level        INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  engagement_level    INTEGER CHECK (engagement_level BETWEEN 1 AND 5),
  perceived_load      INTEGER CHECK (perceived_load BETWEEN 1 AND 5),

  -- Dimension observations
  technical_obs   TEXT,
  tactical_obs    TEXT,
  movement_obs    TEXT,
  competition_obs TEXT,
  behavioral_obs  TEXT,

  -- Structured outcome tags
  highlights      TEXT[],   -- positive skill moments
  concerns        TEXT[],   -- flags for follow-up
  focus_areas_observed TEXT[],  -- which focus areas were actually worked on

  -- Session goal achievement (was the session plan achieved for this player?)
  plan_achieved   BOOLEAN,
  plan_deviation_notes TEXT,

  -- Link to any recommendation this session was fulfilling
  recommendation_id UUID,   -- FK added in 021 after recommendations table exists

  -- Signal emission tracking
  signals_emitted BOOLEAN NOT NULL DEFAULT false,
  signals_emitted_at TIMESTAMPTZ,

  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_outcomes_player    ON player_outcomes(player_id, created_at DESC);
CREATE INDEX idx_outcomes_session   ON player_outcomes(session_id);
CREATE INDEX idx_outcomes_unprocessed ON player_outcomes(academy_id) WHERE signals_emitted = false;

-- ============================================================
-- PLAYER PROGRESS SNAPSHOTS
-- Periodic full snapshot of player state.
-- Triggered: on assessment, on placement, on coach request.
-- Used by time-series charts and the learning system to evaluate
-- whether recommendations actually improved outcomes.
-- ============================================================
CREATE TABLE player_progress_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN (
    'assessment',      -- triggered by a completed assessment
    'placement',       -- triggered by finalize_player_placement()
    'monthly_auto',    -- scheduled monthly snapshot
    'manual',          -- coach-requested
    'recommendation_evaluation'  -- triggered when evaluating a past recommendation
  )),

  -- Assessment scores (current at snapshot time)
  technical_score    NUMERIC(4,2),
  tactical_score     NUMERIC(4,2),
  movement_score     NUMERIC(4,2),
  competition_score  NUMERIC(4,2),
  behavioral_score   NUMERIC(4,2),
  overall_score      NUMERIC(4,2),

  -- UTR at snapshot time
  utr_singles        NUMERIC(4,2),
  utr_doubles        NUMERIC(4,2),
  utr_match_count_90d INTEGER,

  -- Group and level at snapshot time
  group_id           UUID REFERENCES groups(id),
  group_name         TEXT,
  level_id           UUID REFERENCES academy_levels(id),
  level_number       INTEGER,
  track              development_track,

  -- Load at snapshot time
  weekly_sessions_avg      NUMERIC(4,2),
  weekly_duration_avg_min  NUMERIC(6,2),
  avg_intensity            NUMERIC(4,2),

  -- Active signals count by severity
  active_signals_high      INTEGER DEFAULT 0,
  active_signals_medium    INTEGER DEFAULT 0,
  active_signals_low       INTEGER DEFAULT 0,

  -- Source references
  assessment_id      UUID REFERENCES assessments(id),
  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_player ON player_progress_snapshots(player_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_trigger ON player_progress_snapshots(academy_id, trigger_type, snapshot_date DESC);

-- ============================================================
-- TAKE_PROGRESS_SNAPSHOT()
-- Builds a full progress snapshot for a player at the current moment.
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

-- Automatically take a snapshot when an assessment is completed
CREATE OR REPLACE FUNCTION tr_snapshot_on_assessment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM take_progress_snapshot(
    NEW.player_id, NEW.academy_id,
    'assessment', NEW.id, NEW.assessed_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assessment_snapshot
  AFTER INSERT ON assessments
  FOR EACH ROW EXECUTE FUNCTION tr_snapshot_on_assessment();

-- ============================================================
-- PROCESS_PLAYER_OUTCOMES()
-- Emits signals for notable outcomes.
-- ============================================================
CREATE OR REPLACE FUNCTION process_player_outcomes(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_session  sessions%ROWTYPE;
  v_outcome  player_outcomes%ROWTYPE;
  v_count    INTEGER := 0;
BEGIN
  SELECT * INTO v_session FROM sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found: %', p_session_id; END IF;

  FOR v_outcome IN
    SELECT * FROM player_outcomes
    WHERE session_id = p_session_id AND signals_emitted = false
  LOOP
    IF COALESCE(v_outcome.performance_rating, 3) <= 2 THEN
      PERFORM emit_signal(
        v_session.academy_id, v_outcome.player_id,
        'session_outcome_negative', 'session_outcome',
        'Low session performance (' || v_outcome.performance_rating || '/5)',
        v_outcome.notes, NULL, 'medium', 0.800,
        jsonb_build_object('session_id', p_session_id, 'rating', v_outcome.performance_rating),
        NULL, 'player_outcomes', v_outcome.id, NOW() + INTERVAL '14 days', 0
      );
      v_count := v_count + 1;
    END IF;

    IF COALESCE(v_outcome.performance_rating, 3) >= 5 THEN
      PERFORM emit_signal(
        v_session.academy_id, v_outcome.player_id,
        'session_outcome_positive', 'session_outcome',
        'Excellent session performance (5/5)',
        v_outcome.notes, NULL, 'low', 0.800,
        jsonb_build_object('session_id', p_session_id, 'highlights', v_outcome.highlights),
        NULL, 'player_outcomes', v_outcome.id, NOW() + INTERVAL '30 days', 0
      );
      v_count := v_count + 1;
    END IF;

    UPDATE player_outcomes SET
      signals_emitted    = true,
      signals_emitted_at = NOW()
    WHERE id = v_outcome.id;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'session_id', p_session_id, 'signals_emitted', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_outcomes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see player outcomes"    ON player_outcomes FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Coaches manage outcomes"      ON player_outcomes FOR ALL  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff see progress snapshots" ON player_progress_snapshots FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Players see own snapshots"
  ON player_progress_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM players p WHERE p.id = player_progress_snapshots.player_id AND p.profile_id = auth.uid()));
