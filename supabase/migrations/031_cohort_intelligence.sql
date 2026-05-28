-- ============================================================
-- ACADEMY OS — MIGRATION 031: COHORT INTELLIGENCE LAYER
-- Groups players with similar profiles to surface patterns,
-- compare performance, and improve recommendations based on
-- what worked for similar players.
--
-- Loop integration:
--   ← player_utr_profiles (015) — UTR band cohort assignment
--   ← player_progression (004) — score-based cohort stats
--   ← player_phase_states (017) — phase cohorts
--   ← player_outcomes (016) — cohort success rates
--   ← decision_learning_logs (022) — cohort learning patterns
--   → player_development_signals (014) — emits cohort_below/above signals
--   → recommendation_reasoning (026) — cohort context in reasoning
--   → coaching_messages (029) — "players like you" context
--
-- Design: cohorts are defined academically (UTR band, level,
-- age group, phase). Each player can belong to multiple cohorts.
-- Cohort stats are computed in batch (nightly) not per-run.
-- Per-player, run_full_engine calls assign_player_to_cohorts()
-- to ensure membership is current.
-- ============================================================

-- New signal types for cohort comparisons
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'cohort_below_average';
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'cohort_above_average';

-- ============================================================
-- PLAYER COHORTS
-- Cohort definitions. Each is a named grouping with criteria.
-- academy_id = NULL means a global system cohort.
-- ============================================================
CREATE TYPE cohort_type AS ENUM (
  'utr_band',      -- grouped by UTR rating range
  'age_group',     -- grouped by date_of_birth range
  'level_band',    -- grouped by academy_level number range
  'phase',         -- grouped by current training phase
  'track',         -- grouped by development track
  'custom'         -- director-defined
);

CREATE TABLE player_cohorts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  cohort_type       cohort_type NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,

  -- Criteria (type-specific; interpreted by assign_player_to_cohorts)
  criteria          JSONB NOT NULL DEFAULT '{}',
  -- utr_band:   {"utr_min": 3.0, "utr_max": 4.0}
  -- age_group:  {"age_min": 14, "age_max": 16}
  -- level_band: {"level_min": 3, "level_max": 4}
  -- phase:      {"phase": "training"}
  -- track:      {"track": "competition"}

  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_academy ON player_cohorts(academy_id, cohort_type, is_active);

-- ============================================================
-- COHORT MEMBERSHIPS
-- Which players currently belong to each cohort.
-- Refreshed by assign_player_to_cohorts().
-- ============================================================
CREATE TABLE cohort_memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  cohort_id     UUID NOT NULL REFERENCES player_cohorts(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cohort_id, player_id)
);

CREATE INDEX idx_cohort_memberships_player ON cohort_memberships(player_id);
CREATE INDEX idx_cohort_memberships_cohort ON cohort_memberships(cohort_id);

-- ============================================================
-- COHORT STATS
-- Aggregated metrics per cohort, refreshed nightly.
-- Used for comparison in get_cohort_comparison().
-- ============================================================
CREATE TABLE cohort_stats (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                 UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  cohort_id                  UUID NOT NULL REFERENCES player_cohorts(id) ON DELETE CASCADE UNIQUE,

  member_count               INTEGER NOT NULL DEFAULT 0,
  active_member_count        INTEGER NOT NULL DEFAULT 0,

  -- Score averages
  avg_overall_score          NUMERIC(5,2),
  p25_overall_score          NUMERIC(5,2),  -- 25th percentile
  p75_overall_score          NUMERIC(5,2),  -- 75th percentile
  avg_technical_score        NUMERIC(5,2),
  avg_tactical_score         NUMERIC(5,2),
  avg_movement_score         NUMERIC(5,2),
  avg_competition_score      NUMERIC(5,2),

  -- UTR averages
  avg_utr_rating             NUMERIC(5,2),
  p25_utr_rating             NUMERIC(5,2),
  p75_utr_rating             NUMERIC(5,2),

  -- Activity averages
  avg_sessions_7d            NUMERIC(4,1),
  avg_fatigue_risk           NUMERIC(4,3),

  -- Recommendation quality for this cohort
  recommendation_success_rate NUMERIC(5,4),
  -- % of completed recommendations where outcome_verdict = 'better'

  -- Most common signal types in last 90 days for this cohort
  common_signal_types        TEXT[],
  -- Top priority categories across cohort
  common_priority_categories TEXT[],

  computed_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohort_stats_academy ON cohort_stats(academy_id);

-- ============================================================
-- SEED: Cohort definitions for demo academy
-- ============================================================
INSERT INTO player_cohorts (academy_id, cohort_type, name, description, criteria)
VALUES
  -- UTR bands
  ('00000000-0000-0000-0000-000000000001','utr_band','UTR 0–2',   'Developing beginners, UTR below 2.0',        '{"utr_min":0.0, "utr_max":2.0}'),
  ('00000000-0000-0000-0000-000000000001','utr_band','UTR 2–3',   'Foundational players, UTR 2.0–3.0',          '{"utr_min":2.0, "utr_max":3.0}'),
  ('00000000-0000-0000-0000-000000000001','utr_band','UTR 3–4',   'Developing intermediate, UTR 3.0–4.0',       '{"utr_min":3.0, "utr_max":4.0}'),
  ('00000000-0000-0000-0000-000000000001','utr_band','UTR 4–5',   'Competitive intermediate, UTR 4.0–5.0',      '{"utr_min":4.0, "utr_max":5.0}'),
  ('00000000-0000-0000-0000-000000000001','utr_band','UTR 5+',    'Advanced / elite players, UTR 5.0+',         '{"utr_min":5.0, "utr_max":99.0}'),
  -- Age groups
  ('00000000-0000-0000-0000-000000000001','age_group','U12',      'Under 12',                                   '{"age_min":0,  "age_max":11}'),
  ('00000000-0000-0000-0000-000000000001','age_group','12–14',    'Age 12–14',                                  '{"age_min":12, "age_max":13}'),
  ('00000000-0000-0000-0000-000000000001','age_group','14–16',    'Age 14–16',                                  '{"age_min":14, "age_max":15}'),
  ('00000000-0000-0000-0000-000000000001','age_group','16–18',    'Age 16–18',                                  '{"age_min":16, "age_max":17}'),
  ('00000000-0000-0000-0000-000000000001','age_group','18+',      'Adult players 18+',                          '{"age_min":18, "age_max":99}'),
  -- Level bands
  ('00000000-0000-0000-0000-000000000001','level_band','Beginner',    'Academy levels 1–2',                     '{"level_min":1, "level_max":2}'),
  ('00000000-0000-0000-0000-000000000001','level_band','Intermediate', 'Academy levels 3–4',                    '{"level_min":3, "level_max":4}'),
  ('00000000-0000-0000-0000-000000000001','level_band','Advanced',    'Academy levels 5–6',                     '{"level_min":5, "level_max":6}'),
  ('00000000-0000-0000-0000-000000000001','level_band','Elite',       'Academy levels 7+',                      '{"level_min":7, "level_max":99}'),
  -- Phase cohorts
  ('00000000-0000-0000-0000-000000000001','phase','In Training Phase',        'Currently in training phase',    '{"phase":"training"}'),
  ('00000000-0000-0000-0000-000000000001','phase','In Competition Phase',     'Currently competing',             '{"phase":"competition"}'),
  ('00000000-0000-0000-0000-000000000001','phase','In Recovery Phase',        'Currently recovering',            '{"phase":"recovery"}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ASSIGN_PLAYER_TO_COHORTS()
-- Determines which cohorts a player currently belongs to and
-- updates cohort_memberships accordingly.
-- Returns the number of cohorts assigned.
-- ============================================================
CREATE OR REPLACE FUNCTION assign_player_to_cohorts(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_cohort     player_cohorts%ROWTYPE;
  v_player     players%ROWTYPE;
  v_utr        player_utr_profiles%ROWTYPE;
  v_prog       player_progression%ROWTYPE;
  v_level      academy_levels%ROWTYPE;
  v_phase      player_phase;
  v_age        INTEGER;
  v_level_num  INTEGER;
  v_qualifies  BOOLEAN;
  v_count      INTEGER := 0;
BEGIN
  SELECT * INTO v_player FROM players       WHERE id = p_player_id;
  SELECT * INTO v_utr    FROM player_utr_profiles WHERE player_id = p_player_id;
  SELECT * INTO v_prog   FROM player_progression  WHERE player_id = p_player_id;
  v_phase    := get_player_phase(p_player_id);
  v_age      := EXTRACT(YEAR FROM AGE(v_player.date_of_birth))::INTEGER;

  -- Get level number
  IF v_player.current_level_id IS NOT NULL THEN
    SELECT * INTO v_level FROM academy_levels WHERE id = v_player.current_level_id;
    v_level_num := COALESCE(v_level.level_number, 0);
  ELSE
    v_level_num := 0;
  END IF;

  -- Remove stale memberships for this player
  DELETE FROM cohort_memberships
  WHERE player_id = p_player_id AND academy_id = p_academy_id;

  FOR v_cohort IN
    SELECT * FROM player_cohorts
    WHERE academy_id = p_academy_id AND is_active = true
  LOOP
    v_qualifies := false;

    v_qualifies := CASE v_cohort.cohort_type
      WHEN 'utr_band' THEN
        v_utr.current_utr IS NOT NULL
        AND v_utr.current_utr >= (v_cohort.criteria->>'utr_min')::NUMERIC
        AND v_utr.current_utr <  (v_cohort.criteria->>'utr_max')::NUMERIC
      WHEN 'age_group' THEN
        v_age >= (v_cohort.criteria->>'age_min')::INTEGER
        AND v_age <= (v_cohort.criteria->>'age_max')::INTEGER
      WHEN 'level_band' THEN
        v_level_num >= (v_cohort.criteria->>'level_min')::INTEGER
        AND v_level_num <= (v_cohort.criteria->>'level_max')::INTEGER
      WHEN 'phase' THEN
        v_phase::TEXT = (v_cohort.criteria->>'phase')
      WHEN 'track' THEN
        v_player.current_track::TEXT = (v_cohort.criteria->>'track')
      ELSE false
    END;

    IF v_qualifies THEN
      INSERT INTO cohort_memberships (academy_id, cohort_id, player_id)
      VALUES (p_academy_id, v_cohort.id, p_player_id)
      ON CONFLICT (cohort_id, player_id) DO NOTHING;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- COMPUTE_COHORT_STATS()
-- Aggregates metrics for all active members of a cohort.
-- Called by run_cohort_intelligence() nightly.
-- ============================================================
CREATE OR REPLACE FUNCTION compute_cohort_stats(p_cohort_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_cohort      player_cohorts%ROWTYPE;
  v_member_count INTEGER;
  v_active_count INTEGER;
  v_avg_score   NUMERIC; v_p25_score NUMERIC; v_p75_score NUMERIC;
  v_avg_tech    NUMERIC; v_avg_tact  NUMERIC; v_avg_move  NUMERIC; v_avg_comp NUMERIC;
  v_avg_utr     NUMERIC; v_p25_utr   NUMERIC; v_p75_utr   NUMERIC;
  v_avg_ses     NUMERIC; v_avg_fat   NUMERIC;
  v_rec_success NUMERIC;
  v_common_sigs TEXT[];
  v_common_cats TEXT[];
BEGIN
  SELECT * INTO v_cohort FROM player_cohorts WHERE id = p_cohort_id;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Member counts
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE p.is_active = true AND p.status = 'active')
  INTO v_member_count, v_active_count
  FROM cohort_memberships cm
  JOIN players p ON p.id = cm.player_id
  WHERE cm.cohort_id = p_cohort_id;

  IF v_member_count = 0 THEN RETURN false; END IF;

  -- Score percentiles
  SELECT
    AVG(pp.overall_score),
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY pp.overall_score),
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pp.overall_score),
    AVG(pp.technical_score),
    AVG(pp.tactical_score),
    AVG(pp.movement_score),
    AVG(pp.competition_score)
  INTO v_avg_score, v_p25_score, v_p75_score, v_avg_tech, v_avg_tact, v_avg_move, v_avg_comp
  FROM cohort_memberships cm
  JOIN player_progression pp ON pp.player_id = cm.player_id
  WHERE cm.cohort_id = p_cohort_id;

  -- UTR percentiles
  SELECT
    AVG(utr.current_utr),
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY utr.current_utr),
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY utr.current_utr)
  INTO v_avg_utr, v_p25_utr, v_p75_utr
  FROM cohort_memberships cm
  JOIN player_utr_profiles utr ON utr.player_id = cm.player_id
  WHERE cm.cohort_id = p_cohort_id;

  -- Load averages
  SELECT AVG(la.sessions_7d), AVG(la.fatigue_risk_score)
  INTO v_avg_ses, v_avg_fat
  FROM cohort_memberships cm
  JOIN player_load_aggregation la ON la.player_id = cm.player_id
  WHERE cm.cohort_id = p_cohort_id;

  -- Recommendation success rate
  SELECT COALESCE(
    AVG(CASE WHEN ro.outcome_verdict = 'better' THEN 1.0 ELSE 0.0 END),
    0.5
  )
  INTO v_rec_success
  FROM cohort_memberships cm
  JOIN recommendation_overrides ro ON ro.player_id = cm.player_id
  WHERE cm.cohort_id = p_cohort_id
  AND ro.outcome_evaluated = true;

  -- Most common signal types (top 5 in last 90 days)
  SELECT array_agg(signal_type ORDER BY cnt DESC)
  INTO v_common_sigs
  FROM (
    SELECT s.signal_type::TEXT, COUNT(*) AS cnt
    FROM cohort_memberships cm
    JOIN player_development_signals s ON s.player_id = cm.player_id
    WHERE cm.cohort_id = p_cohort_id
    AND s.is_active = true
    AND s.emitted_at >= NOW() - INTERVAL '90 days'
    GROUP BY s.signal_type
    ORDER BY cnt DESC
    LIMIT 5
  ) t;

  -- Most common priority categories (top 3)
  SELECT array_agg(category ORDER BY cnt DESC)
  INTO v_common_cats
  FROM (
    SELECT pri.category::TEXT, COUNT(*) AS cnt
    FROM cohort_memberships cm
    JOIN player_priorities pri ON pri.player_id = cm.player_id
    WHERE cm.cohort_id = p_cohort_id AND pri.is_active = true
    GROUP BY pri.category
    ORDER BY cnt DESC
    LIMIT 3
  ) t;

  INSERT INTO cohort_stats (
    academy_id, cohort_id,
    member_count, active_member_count,
    avg_overall_score, p25_overall_score, p75_overall_score,
    avg_technical_score, avg_tactical_score, avg_movement_score, avg_competition_score,
    avg_utr_rating, p25_utr_rating, p75_utr_rating,
    avg_sessions_7d, avg_fatigue_risk,
    recommendation_success_rate,
    common_signal_types, common_priority_categories,
    computed_at
  ) VALUES (
    v_cohort.academy_id, p_cohort_id,
    v_member_count, v_active_count,
    v_avg_score, v_p25_score, v_p75_score,
    v_avg_tech, v_avg_tact, v_avg_move, v_avg_comp,
    v_avg_utr, v_p25_utr, v_p75_utr,
    v_avg_ses, v_avg_fat,
    v_rec_success,
    v_common_sigs, v_common_cats,
    NOW()
  )
  ON CONFLICT (cohort_id) DO UPDATE SET
    member_count                = EXCLUDED.member_count,
    active_member_count         = EXCLUDED.active_member_count,
    avg_overall_score           = EXCLUDED.avg_overall_score,
    p25_overall_score           = EXCLUDED.p25_overall_score,
    p75_overall_score           = EXCLUDED.p75_overall_score,
    avg_technical_score         = EXCLUDED.avg_technical_score,
    avg_tactical_score          = EXCLUDED.avg_tactical_score,
    avg_movement_score          = EXCLUDED.avg_movement_score,
    avg_competition_score       = EXCLUDED.avg_competition_score,
    avg_utr_rating              = EXCLUDED.avg_utr_rating,
    p25_utr_rating              = EXCLUDED.p25_utr_rating,
    p75_utr_rating              = EXCLUDED.p75_utr_rating,
    avg_sessions_7d             = EXCLUDED.avg_sessions_7d,
    avg_fatigue_risk            = EXCLUDED.avg_fatigue_risk,
    recommendation_success_rate = EXCLUDED.recommendation_success_rate,
    common_signal_types         = EXCLUDED.common_signal_types,
    common_priority_categories  = EXCLUDED.common_priority_categories,
    computed_at                 = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GET_COHORT_COMPARISON()
-- Returns a structured JSONB comparison of a player's metrics
-- against their cohort averages. Used by the UI and reasoning.
-- ============================================================
CREATE OR REPLACE FUNCTION get_cohort_comparison(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_prog     player_progression%ROWTYPE;
  v_utr      player_utr_profiles%ROWTYPE;
  v_result   JSONB := '[]'::JSONB;
  v_cohort   RECORD;
  v_stats    cohort_stats%ROWTYPE;
  v_score_pct NUMERIC;
  v_utr_pct   NUMERIC;
BEGIN
  SELECT * INTO v_prog FROM player_progression  WHERE player_id = p_player_id;
  SELECT * INTO v_utr  FROM player_utr_profiles WHERE player_id = p_player_id;

  FOR v_cohort IN
    SELECT cm.cohort_id, pc.name, pc.cohort_type
    FROM cohort_memberships cm
    JOIN player_cohorts pc ON pc.id = cm.cohort_id
    WHERE cm.player_id = p_player_id AND cm.academy_id = p_academy_id
  LOOP
    SELECT * INTO v_stats FROM cohort_stats WHERE cohort_id = v_cohort.cohort_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    -- Rough percentile from IQR
    v_score_pct := CASE
      WHEN v_stats.p25_overall_score IS NULL THEN NULL
      WHEN v_prog.overall_score >= v_stats.p75_overall_score THEN 75
      WHEN v_prog.overall_score <= v_stats.p25_overall_score THEN 25
      ELSE 50
    END;

    v_utr_pct := CASE
      WHEN v_stats.p25_utr_rating IS NULL OR v_utr.current_utr IS NULL THEN NULL
      WHEN v_utr.current_utr >= v_stats.p75_utr_rating THEN 75
      WHEN v_utr.current_utr <= v_stats.p25_utr_rating THEN 25
      ELSE 50
    END;

    v_result := v_result || jsonb_build_object(
      'cohort_id',              v_cohort.cohort_id,
      'cohort_name',            v_cohort.name,
      'cohort_type',            v_cohort.cohort_type,
      'member_count',           v_stats.member_count,
      'player_overall_score',   v_prog.overall_score,
      'cohort_avg_score',       v_stats.avg_overall_score,
      'cohort_p25_score',       v_stats.p25_overall_score,
      'cohort_p75_score',       v_stats.p75_overall_score,
      'score_percentile_band',  v_score_pct,
      'player_utr',             v_utr.current_utr,
      'cohort_avg_utr',         v_stats.avg_utr_rating,
      'utr_percentile_band',    v_utr_pct,
      'common_focus_areas',     v_stats.common_priority_categories,
      'rec_success_rate',       v_stats.recommendation_success_rate
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- RUN_COHORT_INTELLIGENCE()
-- Batch function: assigns all players to cohorts, recomputes
-- cohort stats, emits cohort_below/above signals.
-- Run nightly.
-- ============================================================
CREATE OR REPLACE FUNCTION run_cohort_intelligence(p_academy_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_player_id    UUID;
  v_cohort_id    UUID;
  v_cohort       player_cohorts%ROWTYPE;
  v_stats        cohort_stats%ROWTYPE;
  v_prog         player_progression%ROWTYPE;
  v_assign_count INTEGER := 0;
  v_signal_count INTEGER := 0;
  v_threshold    NUMERIC := 1.0;  -- score gap to trigger signal
BEGIN
  -- Step 1: Re-assign all active players to cohorts
  FOR v_player_id IN
    SELECT id FROM players
    WHERE academy_id = p_academy_id AND is_active = true AND status = 'active'
  LOOP
    v_assign_count := v_assign_count + assign_player_to_cohorts(v_player_id, p_academy_id);
  END LOOP;

  -- Step 2: Recompute cohort stats
  FOR v_cohort_id IN
    SELECT id FROM player_cohorts
    WHERE academy_id = p_academy_id AND is_active = true
  LOOP
    PERFORM compute_cohort_stats(v_cohort_id);
  END LOOP;

  -- Step 3: Emit cohort signals for players significantly off-average
  FOR v_cohort IN
    SELECT * FROM player_cohorts
    WHERE academy_id = p_academy_id
    AND cohort_type IN ('utr_band','level_band')  -- score-meaningful cohorts only
    AND is_active = true
  LOOP
    SELECT * INTO v_stats FROM cohort_stats WHERE cohort_id = v_cohort.id;
    IF NOT FOUND OR v_stats.avg_overall_score IS NULL THEN CONTINUE; END IF;

    FOR v_player_id IN
      SELECT cm.player_id FROM cohort_memberships cm
      WHERE cm.cohort_id = v_cohort.id
    LOOP
      SELECT * INTO v_prog FROM player_progression WHERE player_id = v_player_id;
      IF v_prog.overall_score IS NULL THEN CONTINUE; END IF;

      IF v_prog.overall_score < v_stats.avg_overall_score - v_threshold THEN
        PERFORM emit_signal(
          p_academy_id, v_player_id,
          'cohort_below_average', 'system_cron',
          'Below ' || v_cohort.name || ' average',
          'Score ' || ROUND(v_prog.overall_score,1) || ' vs cohort avg ' || ROUND(v_stats.avg_overall_score,1),
          'skill', 'medium', 0.800,
          jsonb_build_object('cohort_id', v_cohort.id, 'cohort_avg', v_stats.avg_overall_score, 'player_score', v_prog.overall_score),
          'schedule_skill_session', 'cohort_stats', v_cohort.id,
          NOW() + INTERVAL '14 days', 168
        );
        v_signal_count := v_signal_count + 1;
      ELSIF v_prog.overall_score > v_stats.avg_overall_score + v_threshold THEN
        PERFORM emit_signal(
          p_academy_id, v_player_id,
          'cohort_above_average', 'system_cron',
          'Above ' || v_cohort.name || ' average',
          'Score ' || ROUND(v_prog.overall_score,1) || ' vs cohort avg ' || ROUND(v_stats.avg_overall_score,1),
          'skill', 'low', 0.800,
          jsonb_build_object('cohort_id', v_cohort.id, 'cohort_avg', v_stats.avg_overall_score, 'player_score', v_prog.overall_score),
          'consider_promotion', 'cohort_stats', v_cohort.id,
          NOW() + INTERVAL '30 days', 336
        );
        v_signal_count := v_signal_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'cohorts_processed', (SELECT COUNT(*) FROM player_cohorts WHERE academy_id = p_academy_id AND is_active = true),
    'memberships_assigned', v_assign_count,
    'signals_emitted', v_signal_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View: v_cohort_overview — per-cohort summary for directors
-- ============================================================
CREATE OR REPLACE VIEW v_cohort_overview AS
SELECT
  pc.id AS cohort_id,
  pc.academy_id,
  pc.cohort_type,
  pc.name,
  pc.criteria,
  cs.member_count,
  cs.active_member_count,
  cs.avg_overall_score,
  cs.p25_overall_score,
  cs.p75_overall_score,
  cs.avg_utr_rating,
  cs.recommendation_success_rate,
  cs.common_signal_types,
  cs.common_priority_categories,
  cs.computed_at
FROM player_cohorts pc
LEFT JOIN cohort_stats cs ON cs.cohort_id = pc.id
WHERE pc.is_active = true
ORDER BY pc.cohort_type, pc.name;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_cohorts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_stats        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see cohorts"         ON player_cohorts     FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage cohorts"  ON player_cohorts     FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "Staff see memberships"     ON cohort_memberships FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages memberships" ON cohort_memberships FOR ALL  USING (academy_id = auth_academy_id());
CREATE POLICY "Staff see cohort stats"    ON cohort_stats       FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages cohort stats" ON cohort_stats     FOR ALL   USING (academy_id = auth_academy_id());
