-- ============================================================
-- ACADEMY OS — MIGRATION 025: EXERCISE INTELLIGENCE LAYER
-- Enriches exercises with structured tags and signal/outcome mappings.
-- Enables recommendations to select specific exercises, not just categories.
--
-- Loop integration:
--   ← exercises (006) — enriches existing table with intelligence tags
--   ← player_priorities (020) — priorities carry suggested_exercise_tags
--   ← player_development_signals (014) — signal types map to exercises
--   → session_recommendations (021) — populated with specific exercise IDs
--   → player_outcomes (016) — exercise completion tracked per outcome
--   → learning system (022) — which exercises improved outcomes?
-- ============================================================

-- ============================================================
-- ENRICH EXERCISES TABLE WITH INTELLIGENCE TAGS
-- Added via ALTER to preserve existing rows and data.
-- ============================================================

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS movement_pattern TEXT
    CHECK (movement_pattern IN (
      'linear', 'lateral', 'rotational', 'multi_directional',
      'split_step', 'explosive', 'endurance', NULL
    )),
  ADD COLUMN IF NOT EXISTS skill_phase TEXT
    CHECK (skill_phase IN (
      'prep',
      'backswing',
      'transition',
      'contact',
      'finish',
      'tactical',
      'full_stroke',
      NULL
    )),
  ADD COLUMN IF NOT EXISTS load_type TEXT NOT NULL DEFAULT 'moderate_cns'
    CHECK (load_type IN (
      'low_cns',
      'moderate_cns',
      'high_cns'
    )),
  ADD COLUMN IF NOT EXISTS transfer_level TEXT NOT NULL DEFAULT 'drill'
    CHECK (transfer_level IN (
      'drill',
      'live',
      'match'
    )),
  ADD COLUMN IF NOT EXISTS typical_rpe INTEGER
    CHECK (typical_rpe BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS min_duration_min INTEGER,
  ADD COLUMN IF NOT EXISTS max_duration_min INTEGER;
  -- Fix existing rows
UPDATE exercises
SET load_type = 'moderate_cns'
WHERE load_type IS NULL OR load_type = 'moderate';
-- Update seeded exercises with intelligence tags (best-practice defaults)
UPDATE exercises SET
  movement_pattern = 'rotational', skill_phase = 'full_stroke',
  load_type = 'moderate_cns', transfer_level = 'drill', typical_rpe = 5
WHERE name = 'Cross-Court Forehand Rally';

UPDATE exercises SET
  movement_pattern = 'linear', skill_phase = 'contact',
  load_type = 'high_cns', transfer_level = 'live', typical_rpe = 6
WHERE name = 'Serve + 1 Pattern';

UPDATE exercises SET
  movement_pattern = 'multi_directional', skill_phase = NULL,
  load_type = 'high_cns', transfer_level = 'drill', typical_rpe = 7
WHERE name = 'Spider Drill';

UPDATE exercises SET
  movement_pattern = 'linear', skill_phase = 'transition',
  load_type = 'moderate_cns', transfer_level = 'live', typical_rpe = 5
WHERE name = 'Approach and Volley';

UPDATE exercises SET
  movement_pattern = 'rotational', skill_phase = 'full_stroke',
  load_type = 'moderate_cns', transfer_level = 'drill', typical_rpe = 5
WHERE name = 'Backhand Cross-Court';

UPDATE exercises SET
  movement_pattern = 'multi_directional', skill_phase = 'tactical',
  load_type = 'high_cns', transfer_level = 'match', typical_rpe = 8
WHERE name = 'Point Play Under Pressure';

UPDATE exercises SET
  movement_pattern = 'multi_directional', skill_phase = NULL,
  load_type = 'low_cns', transfer_level = 'drill', typical_rpe = 3
WHERE name = 'Dynamic Warm-Up';

UPDATE exercises SET
  movement_pattern = 'rotational', skill_phase = 'prep',
  load_type = 'low_cns', transfer_level = 'drill', typical_rpe = 3
WHERE name = 'Serve Mechanics Breakdown';

UPDATE exercises SET
  movement_pattern = 'lateral', skill_phase = NULL,
  load_type = 'moderate_cns', transfer_level = 'drill', typical_rpe = 5
WHERE name = 'Footwork Ladder';

UPDATE exercises SET
  movement_pattern = 'rotational', skill_phase = 'tactical',
  load_type = 'moderate_cns', transfer_level = 'live', typical_rpe = 5
WHERE name = 'Open vs. Closed Stance Decision';

UPDATE exercises SET
  movement_pattern = NULL, skill_phase = NULL,
  load_type = 'low_cns', transfer_level = 'drill', typical_rpe = 2
WHERE name = 'Recovery Yoga / Stretch';

UPDATE exercises SET
  movement_pattern = 'multi_directional', skill_phase = 'tactical',
  load_type = 'high_cns', transfer_level = 'match', typical_rpe = 9
WHERE name = 'Match Play (practice set)';

UPDATE exercises SET
  movement_pattern = 'linear', skill_phase = 'tactical',
  load_type = 'moderate_cns', transfer_level = 'live', typical_rpe = 5
WHERE name = 'Tactical Pattern Drill';

UPDATE exercises SET
  movement_pattern = 'rotational', skill_phase = 'contact',
  load_type = 'moderate_cns', transfer_level = 'drill', typical_rpe = 4
WHERE name = 'Baseline Consistency Challenge';

-- ============================================================
-- EXERCISE SIGNAL MAPPINGS
-- Which signal types does this exercise help resolve?
-- Used by get_exercises_for_signal() to find targeted exercises.
-- One exercise can resolve multiple signal types.
-- ============================================================
CREATE TABLE exercise_signal_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  signal_type     signal_type NOT NULL,
  relevance_score NUMERIC(4,2) NOT NULL DEFAULT 1.00
                  CHECK (relevance_score BETWEEN 0 AND 2),
  -- How this exercise addresses the signal
  mechanism       TEXT,
  -- e.g., "Cross-court rally builds consistency to address score_stagnation"
  UNIQUE(academy_id, exercise_id, signal_type)
);

CREATE INDEX idx_signal_mappings_signal   ON exercise_signal_mappings(academy_id, signal_type);
CREATE INDEX idx_signal_mappings_exercise ON exercise_signal_mappings(exercise_id);

-- ============================================================
-- EXERCISE OUTCOME IMPROVEMENTS
-- Which player_outcomes dimensions does this exercise improve?
-- Used to close the loop: exercise → outcome → learning signal.
-- ============================================================
CREATE TABLE exercise_outcome_improvements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id       UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  exercise_id      UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  -- Which dimension this exercise develops
  dimension        TEXT NOT NULL CHECK (dimension IN (
    'technical', 'tactical', 'movement', 'competition', 'behavioral'
  )),
  -- Specific sub-skill within the dimension
  sub_skill        TEXT,
  -- Expected improvement per 10 sessions (in score points, 0–10 scale)
  expected_delta   NUMERIC(4,3),
  -- Minimum sessions needed to see measurable improvement
  min_sessions     INTEGER DEFAULT 5,
  -- Transfer level required to achieve the improvement
  required_transfer_level TEXT CHECK (required_transfer_level IN ('drill', 'live', 'match', NULL)),
  UNIQUE(academy_id, exercise_id, dimension, sub_skill)
);

CREATE INDEX idx_outcome_improvements_exercise  ON exercise_outcome_improvements(exercise_id);
CREATE INDEX idx_outcome_improvements_dimension ON exercise_outcome_improvements(academy_id, dimension);

-- ============================================================
-- SEED: Exercise → Signal mappings for the demo academy
-- ============================================================
INSERT INTO exercise_signal_mappings (academy_id, exercise_id, signal_type, relevance_score, mechanism)
SELECT
  '00000000-0000-0000-0000-000000000001',
  e.id,
  m.signal_type::signal_type,
  m.relevance,
  m.mechanism
FROM exercises e
CROSS JOIN LATERAL (
  VALUES
    ('Cross-Court Forehand Rally',  'score_stagnation',    1.5, 'Consistency reps address stagnating technical score'),
    ('Cross-Court Forehand Rally',  'score_regression',    1.3, 'Rebuilds baseline forehand consistency'),
    ('Cross-Court Forehand Rally',  'dimension_gap',       1.2, 'Targeted technical work on forehand dimension'),
    ('Backhand Cross-Court',        'score_stagnation',    1.5, 'Consistency reps address backhand technical stagnation'),
    ('Backhand Cross-Court',        'score_regression',    1.3, 'Rebuilds baseline backhand consistency'),
    ('Serve + 1 Pattern',           'utr_underperformance',1.4, 'Pattern play converts serve advantage to point wins'),
    ('Serve + 1 Pattern',           'low_match_volume',    1.2, 'High-transfer live practice simulates match conditions'),
    ('Point Play Under Pressure',   'utr_stagnation',      1.6, 'Pressure scenarios directly address UTR plateau'),
    ('Point Play Under Pressure',   'utr_regression',      1.5, 'Competition simulation improves match outcomes'),
    ('Point Play Under Pressure',   'low_match_volume',    1.8, 'High transfer: match-realistic exposure'),
    ('Match Play (practice set)',   'low_match_volume',    2.0, 'Direct competitive exposure — highest transfer'),
    ('Match Play (practice set)',   'utr_underperformance',1.7, 'Full match context builds UTR-relevant performance'),
    ('Tactical Pattern Drill',      'utr_underperformance',1.3, 'Pattern clarity reduces decision errors under pressure'),
    ('Tactical Pattern Drill',      'score_stagnation',    1.2, 'Tactical dimension improvement addresses stagnation'),
    ('Spider Drill',                'load_overload_detected',0.5,'Light movement drill — low CNS for overload periods'),
    ('Dynamic Warm-Up',             'constraint_active',   1.0, 'Safe activation during constraint/recovery periods'),
    ('Recovery Yoga / Stretch',     'overtraining_risk',   1.8, 'Direct load reduction for fatigue management'),
    ('Recovery Yoga / Stretch',     'load_overload_detected',1.9,'Recovery work addresses overload signal'),
    ('Footwork Ladder',             'dimension_gap',       1.1, 'Movement dimension improvement via footwork training'),
    ('Baseline Consistency Challenge','score_stagnation',  1.4, 'Goal-based consistency drill breaks plateaus'),
    ('Open vs. Closed Stance Decision','score_regression', 1.2, 'Decision clarity rebuilds tactical confidence')
) AS m(exercise_name, signal_type, relevance, mechanism)
WHERE e.name = m.exercise_name
AND e.academy_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (academy_id, exercise_id, signal_type) DO NOTHING;

-- ============================================================
-- SEED: Exercise → Outcome dimension improvements
-- ============================================================
INSERT INTO exercise_outcome_improvements (academy_id, exercise_id, dimension, sub_skill, expected_delta, min_sessions, required_transfer_level)
SELECT
  '00000000-0000-0000-0000-000000000001',
  e.id,
  m.dimension,
  m.sub_skill,
  m.expected_delta,
  m.min_sessions,
  m.required_transfer_level
FROM exercises e
CROSS JOIN LATERAL (
  VALUES
    ('Cross-Court Forehand Rally',  'technical',   'forehand',       0.080, 8,  'drill'),
    ('Backhand Cross-Court',        'technical',   'backhand',       0.080, 8,  'drill'),
    ('Serve + 1 Pattern',           'tactical',    'patterns',       0.060, 6,  'live'),
    ('Serve Mechanics Breakdown',   'technical',   'serve',          0.090, 10, 'drill'),
    ('Approach and Volley',         'technical',   'net_play',       0.070, 6,  'live'),
    ('Point Play Under Pressure',   'competition', 'pressure_handling',0.100,8, 'match'),
    ('Match Play (practice set)',   'competition', 'match_tactics',  0.120, 5,  'match'),
    ('Spider Drill',                'movement',    'court_coverage', 0.060, 8,  'drill'),
    ('Footwork Ladder',             'movement',    'agility',        0.050, 8,  'drill'),
    ('Tactical Pattern Drill',      'tactical',    'patterns',       0.070, 6,  'live'),
    ('Open vs. Closed Stance Decision','tactical', 'decision_making',0.060, 6,  'live'),
    ('Baseline Consistency Challenge','technical', 'consistency',    0.070, 6,  'drill'),
    ('Dynamic Warm-Up',             'movement',    'speed',          0.020, 10, 'drill'),
    ('Recovery Yoga / Stretch',     'behavioral',  'attitude',       0.030, 5,  'drill')
) AS m(exercise_name, dimension, sub_skill, expected_delta, min_sessions, required_transfer_level)
WHERE e.name = m.exercise_name
AND e.academy_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (academy_id, exercise_id, dimension, sub_skill) DO NOTHING;

-- ============================================================
-- GET_EXERCISES_FOR_SIGNAL()
-- Returns ranked exercises that address a specific signal type.
-- Phase-aware: filters by load_type based on current player phase.
-- ============================================================
CREATE OR REPLACE FUNCTION get_exercises_for_signal(
  p_academy_id UUID,
  p_player_id  UUID,
  p_signal_type signal_type,
  p_limit       INTEGER DEFAULT 5
)
RETURNS TABLE (
  exercise_id      UUID,
  exercise_name    TEXT,
  category         exercise_category,
  load_type        TEXT,
  transfer_level   TEXT,
  relevance_score  NUMERIC,
  mechanism        TEXT,
  duration_min     INTEGER
) AS $$
DECLARE
  v_phase player_phase;
  v_max_load TEXT;
BEGIN
  v_phase := get_player_phase(p_player_id);

  -- Phase-based load ceiling
  v_max_load := CASE v_phase
    WHEN 'recovery'        THEN 'low_cns'
    WHEN 'competition'     THEN 'moderate_cns'
    WHEN 'pre_competition' THEN 'moderate_cns'
    ELSE                        'high_cns'  -- training: all loads allowed
  END;

  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.category,
    e.load_type,
    e.transfer_level,
    esm.relevance_score,
    esm.mechanism,
    e.duration_min
  FROM exercise_signal_mappings esm
  JOIN exercises e ON e.id = esm.exercise_id
  WHERE esm.academy_id = p_academy_id
  AND esm.signal_type = p_signal_type
  AND e.is_active = true
  -- Phase gate: don't recommend high-CNS exercises in recovery
  AND CASE v_max_load
    WHEN 'low_cns'      THEN e.load_type = 'low_cns'
    WHEN 'moderate_cns' THEN e.load_type IN ('low_cns', 'moderate_cns')
    ELSE                     true
  END
  ORDER BY esm.relevance_score DESC, e.transfer_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- POPULATE_SESSION_RECOMMENDATION_EXERCISES()
-- After a session_recommendation is created, fills in specific
-- exercise IDs based on signal mappings.
-- Called by generate_player_recommendations().
-- ============================================================
CREATE OR REPLACE FUNCTION populate_session_rec_exercises(
  p_session_rec_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rec        session_recommendations%ROWTYPE;
  v_priority   player_priorities%ROWTYPE;
  v_sig        player_development_signals%ROWTYPE;
  v_exercises  UUID[] := '{}';
  v_exercise   RECORD;
  v_count      INTEGER := 0;
BEGIN
  SELECT * INTO v_rec FROM session_recommendations WHERE id = p_session_rec_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT * INTO v_priority FROM player_priorities WHERE id = v_rec.priority_id;

  -- Gather exercises from each source signal
  FOR v_sig IN
    SELECT * FROM player_development_signals
    WHERE id = ANY(COALESCE(v_rec.signal_ids, '{}'))
    AND is_active = true
  LOOP
    FOR v_exercise IN
      SELECT * FROM get_exercises_for_signal(
        v_rec.academy_id, v_rec.player_id, v_sig.signal_type, 3
      )
    LOOP
      v_exercises := array_append(v_exercises, v_exercise.exercise_id);
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  -- Deduplicate
  v_exercises := ARRAY(SELECT DISTINCT unnest(v_exercises) LIMIT 8);

  -- Update session recommendation with specific exercise IDs
  UPDATE session_recommendations SET
    focus_exercise_ids = v_exercises,
    updated_at = NOW()
  WHERE id = p_session_rec_id;

  RETURN array_length(v_exercises, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE exercise_signal_mappings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_outcome_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see signal mappings"     ON exercise_signal_mappings     FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage mappings"     ON exercise_signal_mappings     FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
CREATE POLICY "Staff see outcome improvements" ON exercise_outcome_improvements FOR SELECT USING (academy_id = auth_academy_id() AND auth_is_staff());
CREATE POLICY "Directors manage improvements" ON exercise_outcome_improvements FOR ALL   USING (academy_id = auth_academy_id() AND auth_is_director_or_head());
