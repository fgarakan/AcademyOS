-- ============================================================
-- ACADEMY OS — MIGRATION 032: COMPETITIVE BENCHMARK LAYER
-- Compares each player against: same UTR range, academy level
-- targets, age-group norms, and configurable external benchmarks.
-- Generates "above / below expectation" signals when gaps exist.
--
-- Loop integration:
--   ← player_utr_profiles (015) — UTR range comparison
--   ← player_progression (004) — score vs. level target
--   ← academy_levels (002) — level-based expected scores
--   ← player_phase_states (017) — phase-adjusted expectations
--   ← cohort_stats (031) — cohort averages as soft benchmarks
--   → player_development_signals (014) — emits benchmark signals
--   → recommendation_reasoning (026) — benchmark context in UI
--   → coaching_messages (029) — "vs expectation" framing
--
-- Design: benchmarks are layered.
--   1. Level benchmarks: minimum expected scores per academy level
--   2. UTR-range benchmarks: expected score range for a UTR band
--   3. Age-group benchmarks: developmental norms by age
--   4. Custom external benchmarks (director-defined targets)
-- A player can be above/below across multiple benchmark types.
-- ============================================================

-- New signal types for benchmark comparison results
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'benchmark_below_expectation';
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'benchmark_above_expectation';

-- ============================================================
-- BENCHMARK DEFINITIONS
-- Each row defines an expected performance range for a given
-- segment (level, UTR band, age group, or custom target).
-- ============================================================
CREATE TYPE benchmark_type AS ENUM (
  'level_target',       -- expected score for this academy level
  'utr_range',          -- expected overall_score for this UTR band
  'age_group_norm',     -- developmental norm by age
  'external_target'     -- custom director-defined target
);

CREATE TABLE benchmark_definitions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  benchmark_type    benchmark_type NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,

  -- Segment criteria (interpreted by compute_player_benchmarks)
  criteria          JSONB NOT NULL DEFAULT '{}',
  -- level_target:    {"level_number": 3}
  -- utr_range:       {"utr_min": 3.0, "utr_max": 4.0}
  -- age_group_norm:  {"age_min": 14, "age_max": 16}
  -- external_target: {"track": "competition"}

  -- Expected score range (overall_score scale, 0–10)
  expected_score_min  NUMERIC(4,2),
  expected_score_max  NUMERIC(4,2),

  -- Expected UTR range (if applicable)
  expected_utr_min    NUMERIC(4,2),
  expected_utr_max    NUMERIC(4,2),

  -- How far below expected triggers a 'below_expectation' signal
  -- (as a fraction of the expected score range)
  below_gap_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.800,
  -- Player score < expected_score_min * below_gap_threshold → signal

  -- How far above expected triggers 'above_expectation'
  above_gap_threshold NUMERIC(4,3) NOT NULL DEFAULT 1.200,

  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_benchmark_defs_academy ON benchmark_definitions(academy_id, benchmark_type, is_active);

-- ============================================================
-- PLAYER BENCHMARK RESULTS
-- Per-player comparison against each applicable benchmark.
-- Refreshed by compute_player_benchmarks() (per player) or
-- run_academy_benchmarks() (batch nightly).
-- ============================================================
CREATE TABLE player_benchmark_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id           UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id            UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  benchmark_id         UUID NOT NULL REFERENCES benchmark_definitions(id) ON DELETE CASCADE,

  -- Player values at time of comparison
  player_overall_score NUMERIC(4,2),
  player_utr_rating    NUMERIC(4,2),

  -- Benchmark expected values
  expected_score_min   NUMERIC(4,2),
  expected_score_max   NUMERIC(4,2),
  expected_utr_min     NUMERIC(4,2),
  expected_utr_max     NUMERIC(4,2),

  -- Outcome
  score_gap            NUMERIC(5,2),
  -- positive = above expected_score_max
  -- negative = below expected_score_min

  utr_gap              NUMERIC(5,2),
  -- positive = above expected_utr_max
  -- negative = below expected_utr_min

  verdict              TEXT NOT NULL DEFAULT 'on_track'
                       CHECK (verdict IN ('above_expectation','on_track','below_expectation')),

  signal_emitted       BOOLEAN NOT NULL DEFAULT false,
  signal_id            UUID REFERENCES player_development_signals(id) ON DELETE SET NULL,

  computed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(player_id, benchmark_id)
);

CREATE INDEX idx_benchmark_results_player  ON player_benchmark_results(player_id, computed_at DESC);
CREATE INDEX idx_benchmark_results_academy ON player_benchmark_results(academy_id, verdict);

-- ============================================================
-- SEED: Benchmark definitions for demo academy
-- Aligned with the 6 academy levels seeded in 024_seed_data.sql
-- ============================================================
INSERT INTO benchmark_definitions (academy_id, benchmark_type, name, description, criteria, expected_score_min, expected_score_max, below_gap_threshold)
VALUES
  -- Level targets: expected overall_score range per level
  ('00000000-0000-0000-0000-000000000001','level_target','Level 1 — Beginner',        'Entry-level player expectations',           '{"level_number":1}', 2.0, 4.0, 0.75),
  ('00000000-0000-0000-0000-000000000001','level_target','Level 2 — Foundational',    'Basic technique established',                '{"level_number":2}', 3.5, 5.5, 0.75),
  ('00000000-0000-0000-0000-000000000001','level_target','Level 3 — Intermediate',    'Consistent baseline and tactical awareness', '{"level_number":3}', 5.0, 6.5, 0.80),
  ('00000000-0000-0000-0000-000000000001','level_target','Level 4 — Developing',      'Match-competitive technique',                '{"level_number":4}', 6.0, 7.5, 0.80),
  ('00000000-0000-0000-0000-000000000001','level_target','Level 5 — Advanced',        'High-level technical and tactical game',     '{"level_number":5}', 7.0, 8.5, 0.85),
  ('00000000-0000-0000-0000-000000000001','level_target','Level 6 — Elite',           'Performance athlete standard',               '{"level_number":6}', 7.5, 9.5, 0.85),

  -- UTR-range benchmarks: expected overall_score for each UTR band
  ('00000000-0000-0000-0000-000000000001','utr_range','UTR 2–3 Score Expectation',   'Players at UTR 2–3 should be at L2–L3',     '{"utr_min":2.0,"utr_max":3.0}', 3.5, 5.5, 0.80),
  ('00000000-0000-0000-0000-000000000001','utr_range','UTR 3–4 Score Expectation',   'Players at UTR 3–4 should be at L3–L4',     '{"utr_min":3.0,"utr_max":4.0}', 5.0, 7.0, 0.80),
  ('00000000-0000-0000-0000-000000000001','utr_range','UTR 4–5 Score Expectation',   'Players at UTR 4–5 should be at L4–L5',     '{"utr_min":4.0,"utr_max":5.0}', 6.5, 8.0, 0.85),
  ('00000000-0000-0000-0000-000000000001','utr_range','UTR 5+ Score Expectation',    'Elite UTR players should be at L5–L6',      '{"utr_min":5.0,"utr_max":99.0}',7.0, 9.5, 0.85),

  -- Age-group developmental norms
  ('00000000-0000-0000-0000-000000000001','age_group_norm','U14 Developmental Norm','Age-appropriate progress for under-14',     '{"age_min":10,"age_max":13}', 3.0, 6.0, 0.70),
  ('00000000-0000-0000-0000-000000000001','age_group_norm','14–16 Developmental Norm','Age-appropriate progress for 14–16',      '{"age_min":14,"age_max":15}', 4.5, 7.0, 0.75),
  ('00000000-0000-0000-0000-000000000001','age_group_norm','16–18 Developmental Norm','Age-appropriate progress for 16–18',      '{"age_min":16,"age_max":17}', 5.5, 8.0, 0.80)

ON CONFLICT DO NOTHING;

-- ============================================================
-- COMPUTE_PLAYER_BENCHMARKS()
-- Compares a single player against all applicable benchmarks.
-- Emits signals when player is significantly above or below.
-- Returns a summary JSONB for reasoning/UI use.
-- ============================================================
CREATE OR REPLACE FUNCTION compute_player_benchmarks(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_player      players%ROWTYPE;
  v_prog        player_progression%ROWTYPE;
  v_utr         player_utr_profiles%ROWTYPE;
  v_level       academy_levels%ROWTYPE;
  v_age         INTEGER;
  v_level_num   INTEGER;
  v_bench       benchmark_definitions%ROWTYPE;
  v_applies     BOOLEAN;
  v_score_gap   NUMERIC;
  v_utr_gap     NUMERIC;
  v_verdict     TEXT;
  v_result      JSONB := '[]'::JSONB;
  v_below_count INTEGER := 0;
  v_above_count INTEGER := 0;
BEGIN
  SELECT * INTO v_player FROM players           WHERE id = p_player_id;
  SELECT * INTO v_prog   FROM player_progression WHERE player_id = p_player_id;
  SELECT * INTO v_utr    FROM player_utr_profiles WHERE player_id = p_player_id;

  v_age := EXTRACT(YEAR FROM AGE(v_player.date_of_birth))::INTEGER;

  IF v_player.current_level_id IS NOT NULL THEN
    SELECT * INTO v_level FROM academy_levels WHERE id = v_player.current_level_id;
    v_level_num := COALESCE(v_level.level_number, 0);
  ELSE
    v_level_num := 0;
  END IF;

  FOR v_bench IN
    SELECT * FROM benchmark_definitions
    WHERE academy_id = p_academy_id AND is_active = true
  LOOP
    -- Determine if this benchmark applies to this player
    v_applies := CASE v_bench.benchmark_type
      WHEN 'level_target' THEN
        v_level_num = (v_bench.criteria->>'level_number')::INTEGER
      WHEN 'utr_range' THEN
        v_utr.current_utr IS NOT NULL
        AND v_utr.current_utr >= (v_bench.criteria->>'utr_min')::NUMERIC
        AND v_utr.current_utr <  (v_bench.criteria->>'utr_max')::NUMERIC
      WHEN 'age_group_norm' THEN
        v_age >= (v_bench.criteria->>'age_min')::INTEGER
        AND v_age <= (v_bench.criteria->>'age_max')::INTEGER
      WHEN 'external_target' THEN
        v_player.current_track::TEXT = COALESCE(v_bench.criteria->>'track', v_player.current_track::TEXT)
      ELSE false
    END;

    IF NOT v_applies THEN CONTINUE; END IF;

    -- Compute gaps (negative = below expected, positive = above)
    v_score_gap := CASE
      WHEN v_prog.overall_score IS NULL OR v_bench.expected_score_min IS NULL THEN NULL
      WHEN v_prog.overall_score < v_bench.expected_score_min
           THEN ROUND(v_prog.overall_score - v_bench.expected_score_min, 2)
      WHEN v_prog.overall_score > v_bench.expected_score_max
           THEN ROUND(v_prog.overall_score - v_bench.expected_score_max, 2)
      ELSE 0
    END;

    v_utr_gap := CASE
      WHEN v_utr.current_utr IS NULL OR v_bench.expected_utr_min IS NULL THEN NULL
      WHEN v_utr.current_utr < v_bench.expected_utr_min
           THEN ROUND(v_utr.current_utr - v_bench.expected_utr_min, 2)
      WHEN v_utr.current_utr > v_bench.expected_utr_max
           THEN ROUND(v_utr.current_utr - v_bench.expected_utr_max, 2)
      ELSE 0
    END;

    -- Determine verdict
    v_verdict := CASE
      WHEN v_score_gap IS NOT NULL AND v_prog.overall_score <
           v_bench.expected_score_min * v_bench.below_gap_threshold
        THEN 'below_expectation'
      WHEN v_score_gap IS NOT NULL AND v_prog.overall_score >
           v_bench.expected_score_max * v_bench.above_gap_threshold
        THEN 'above_expectation'
      ELSE 'on_track'
    END;

    -- Upsert benchmark result
    INSERT INTO player_benchmark_results (
      academy_id, player_id, benchmark_id,
      player_overall_score, player_utr_rating,
      expected_score_min, expected_score_max,
      expected_utr_min, expected_utr_max,
      score_gap, utr_gap, verdict
    ) VALUES (
      p_academy_id, p_player_id, v_bench.id,
      v_prog.overall_score, v_utr.current_utr,
      v_bench.expected_score_min, v_bench.expected_score_max,
      v_bench.expected_utr_min, v_bench.expected_utr_max,
      v_score_gap, v_utr_gap, v_verdict
    )
    ON CONFLICT (player_id, benchmark_id) DO UPDATE SET
      player_overall_score = EXCLUDED.player_overall_score,
      player_utr_rating    = EXCLUDED.player_utr_rating,
      score_gap            = EXCLUDED.score_gap,
      utr_gap              = EXCLUDED.utr_gap,
      verdict              = EXCLUDED.verdict,
      signal_emitted       = false,  -- reset; re-emit below if needed
      computed_at          = NOW();

    -- Emit signal for significant deviations
    IF v_verdict = 'below_expectation' THEN
      PERFORM emit_signal(
        p_academy_id, p_player_id,
        'benchmark_below_expectation', 'system_cron',
        'Below expectation: ' || v_bench.name,
        'Score ' || ROUND(COALESCE(v_prog.overall_score, 0),1) ||
        ' vs expected min ' || v_bench.expected_score_min,
        'skill', 'medium', 0.850,
        jsonb_build_object(
          'benchmark_id', v_bench.id,
          'benchmark_name', v_bench.name,
          'player_score', v_prog.overall_score,
          'expected_min', v_bench.expected_score_min,
          'score_gap', v_score_gap
        ),
        'schedule_reassessment', 'player_benchmark_results', NULL,
        NOW() + INTERVAL '21 days', 336
      );
      v_below_count := v_below_count + 1;

      UPDATE player_benchmark_results SET signal_emitted = true
      WHERE player_id = p_player_id AND benchmark_id = v_bench.id;

    ELSIF v_verdict = 'above_expectation' THEN
      PERFORM emit_signal(
        p_academy_id, p_player_id,
        'benchmark_above_expectation', 'system_cron',
        'Exceeds expectations: ' || v_bench.name,
        'Score ' || ROUND(COALESCE(v_prog.overall_score, 0),1) ||
        ' vs expected max ' || v_bench.expected_score_max,
        'skill', 'low', 0.800,
        jsonb_build_object(
          'benchmark_id', v_bench.id,
          'benchmark_name', v_bench.name,
          'player_score', v_prog.overall_score,
          'expected_max', v_bench.expected_score_max,
          'score_gap', v_score_gap
        ),
        'consider_promotion', 'player_benchmark_results', NULL,
        NOW() + INTERVAL '30 days', 336
      );
      v_above_count := v_above_count + 1;

      UPDATE player_benchmark_results SET signal_emitted = true
      WHERE player_id = p_player_id AND benchmark_id = v_bench.id;
    END IF;

    v_result := v_result || jsonb_build_object(
      'benchmark_name', v_bench.name,
      'benchmark_type', v_bench.benchmark_type,
      'verdict',        v_verdict,
      'score_gap',      v_score_gap,
      'utr_gap',        v_utr_gap,
      'expected_range', jsonb_build_object(
        'score_min', v_bench.expected_score_min,
        'score_max', v_bench.expected_score_max
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'below_count',  v_below_count,
    'above_count',  v_above_count,
    'benchmarks',   v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RUN_ACADEMY_BENCHMARKS()
-- Batch: runs compute_player_benchmarks for all active players.
-- ============================================================
CREATE OR REPLACE FUNCTION run_academy_benchmarks(p_academy_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_player_id    UUID;
  v_total        INTEGER := 0;
  v_below_total  INTEGER := 0;
  v_above_total  INTEGER := 0;
  v_result       JSONB;
BEGIN
  FOR v_player_id IN
    SELECT id FROM players
    WHERE academy_id = p_academy_id AND is_active = true AND status = 'active'
  LOOP
    v_result := compute_player_benchmarks(v_player_id, p_academy_id);
    v_below_total := v_below_total + COALESCE((v_result->>'below_count')::INTEGER, 0);
    v_above_total := v_above_total + COALESCE((v_result->>'above_count')::INTEGER, 0);
    v_total := v_total + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'players_evaluated', v_total,
    'below_expectation_signals', v_below_total,
    'above_expectation_signals', v_above_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View: v_player_benchmark_dashboard
-- All player benchmark results with context for the UI.
-- ============================================================
CREATE OR REPLACE VIEW v_player_benchmark_dashboard AS
SELECT
  pbr.player_id,
  pbr.academy_id,
  pl.first_name,
  pl.last_name,
  bd.name             AS benchmark_name,
  bd.benchmark_type,
  pbr.player_overall_score,
  pbr.player_utr_rating,
  pbr.expected_score_min,
  pbr.expected_score_max,
  pbr.score_gap,
  pbr.utr_gap,
  pbr.verdict,
  pbr.computed_at
FROM player_benchmark_results pbr
JOIN players pl              ON pl.id  = pbr.player_id
JOIN benchmark_definitions bd ON bd.id = pbr.benchmark_id
WHERE pbr.verdict != 'on_track'
ORDER BY
  CASE pbr.verdict WHEN 'below_expectation' THEN 1 ELSE 2 END,
  ABS(COALESCE(pbr.score_gap, 0)) DESC;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE benchmark_definitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_benchmark_results  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see benchmarks"          ON benchmark_definitions    FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage benchmarks"   ON benchmark_definitions    FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "Staff see benchmark results"   ON player_benchmark_results FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "System manages benchmark results" ON player_benchmark_results FOR ALL USING (academy_id = auth_academy_id());
