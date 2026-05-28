-- ============================================================
-- ACADEMY OS — MIGRATION 020: PLAYER PRIORITIES
-- player_priorities: ranked, actionable development priorities.
--
-- Loop position:
--   ← player_development_signals (source of truth)
--   ← decision_scores (rank ordering)
--   ← player_phase_states (phase filters what's relevant)
--   → player_recommendations (021) — priorities drive recommendations
--   → sessions (priorities inform session focus areas)
--   → exercises (priorities filter which exercises to suggest)
--
-- A priority is: a specific, actionable development focus
-- derived from one or more active signals.
-- Unlike signals (raw observations), priorities are ranked,
-- deduplicated, and surfaced to coaches as "what to work on next."
-- ============================================================

CREATE TYPE priority_category AS ENUM (
  'technical_skill',    -- specific stroke or technique gap
  'tactical_skill',     -- pattern or decision-making gap
  'physical_fitness',   -- fitness or movement deficiency
  'competition_exposure', -- needs more match play
  'behavioral',         -- attitude, coachability, mental game
  'load_management',    -- fatigue or overtraining concern
  'reassessment',       -- needs formal evaluation
  'promotion_readiness' -- candidate for group/level move
);

CREATE TABLE player_priorities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Priority classification
  category        priority_category NOT NULL,
  title           TEXT NOT NULL,      -- "Improve backhand consistency"
  description     TEXT,

  -- Ranking
  priority_rank   INTEGER NOT NULL DEFAULT 1,  -- 1 = highest priority
  priority_level  TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
  urgency         TEXT NOT NULL DEFAULT 'routine'
                  CHECK (urgency IN ('immediate', 'urgent', 'high', 'routine', 'monitor')),
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.800
                   CHECK (confidence_score BETWEEN 0 AND 1),

  -- Source signals (what generated this priority)
  source_signal_ids UUID[] NOT NULL DEFAULT '{}',
  primary_signal_id UUID REFERENCES player_development_signals(id),

  -- Connection to assessment scores
  relevant_dimension TEXT CHECK (relevant_dimension IN
    ('technical', 'tactical', 'movement', 'competition', 'behavioral', NULL)),
  target_score    NUMERIC(4,2),   -- what score we're trying to reach
  current_score   NUMERIC(4,2),   -- current score in this dimension

  -- Session and exercise integration
  suggested_exercise_tags TEXT[],   -- tags to filter relevant exercises
  suggested_block_types   block_type[],  -- which session block types address this
  min_sessions_per_week   INTEGER DEFAULT 1,

  -- Lifecycle
  is_active       BOOLEAN NOT NULL DEFAULT true,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'addressed', 'deferred', 'cancelled')),
  addressed_at    TIMESTAMPTZ,
  addressed_by    UUID REFERENCES profiles(id),
  address_notes   TEXT,

  -- Linked recommendation (back-reference; populated after recommendations are generated)
  linked_recommendation_id UUID,   -- FK added in 021

  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_priorities_player  ON player_priorities(player_id, is_active, priority_rank);
CREATE INDEX idx_priorities_academy ON player_priorities(academy_id, urgency, is_active);

CREATE TRIGGER tr_priorities_updated_at
  BEFORE UPDATE ON player_priorities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- GENERATE_PLAYER_PRIORITIES()
-- Derives ranked priorities from active signals + decision score.
-- Replaces the current priority list for a player (deactivates old ones).
-- Called after score_player() or by generate_player_recommendations().
-- ============================================================
CREATE OR REPLACE FUNCTION generate_player_priorities(
  p_player_id  UUID,
  p_academy_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_score      decision_scores%ROWTYPE;
  v_sig        player_development_signals%ROWTYPE;
  v_pp         player_progression%ROWTYPE;
  v_phase      player_phase;
  v_rank       INTEGER := 1;
  v_count      INTEGER := 0;
  v_priority_id UUID;
BEGIN
  SELECT * INTO v_score FROM decision_scores WHERE player_id = p_player_id;
  SELECT * INTO v_pp    FROM player_progression WHERE player_id = p_player_id;
  v_phase := get_player_phase(p_player_id);

  -- Deactivate existing priorities (keep history)
  UPDATE player_priorities SET
    is_active  = false,
    status     = CASE WHEN status = 'open' THEN 'deferred' ELSE status END,
    updated_at = NOW()
  WHERE player_id = p_player_id AND is_active = true;

  -- Generate priorities from contributing signals, highest-scoring first
  FOR v_sig IN
    SELECT s.*
    FROM player_development_signals s
    WHERE s.player_id = p_player_id
    AND s.is_active = true
    AND s.id = ANY(COALESCE(v_score.contributing_signal_ids, '{}'))
    ORDER BY
      CASE s.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      s.confidence DESC,
      s.emitted_at DESC
    LIMIT 5  -- top 5 priorities max
  LOOP
    INSERT INTO player_priorities (
      academy_id, player_id, category, title, description,
      priority_rank, priority_level, urgency, confidence_score,
      source_signal_ids, primary_signal_id,
      relevant_dimension, current_score,
      suggested_exercise_tags, suggested_block_types,
      is_active, status
    ) VALUES (
      p_academy_id, p_player_id,

      -- Map signal type to priority category
      CASE v_sig.signal_type
        WHEN 'score_regression'        THEN 'technical_skill'::priority_category
        WHEN 'score_stagnation'        THEN 'technical_skill'::priority_category
        WHEN 'dimension_gap'           THEN 'technical_skill'::priority_category
        WHEN 'utr_regression'          THEN 'competition_exposure'::priority_category
        WHEN 'utr_stagnation'          THEN 'competition_exposure'::priority_category
        WHEN 'utr_underperformance'    THEN 'competition_exposure'::priority_category
        WHEN 'low_match_volume'        THEN 'competition_exposure'::priority_category
        WHEN 'load_overload_detected'  THEN 'load_management'::priority_category
        WHEN 'overtraining_risk'       THEN 'load_management'::priority_category
        WHEN 'constraint_active'       THEN 'load_management'::priority_category
        WHEN 'promotion_ready'         THEN 'promotion_readiness'::priority_category
        WHEN 'reassessment_overdue'    THEN 'reassessment'::priority_category
        WHEN 'reassessment_approaching' THEN 'reassessment'::priority_category
        ELSE 'behavioral'::priority_category
      END,

      v_sig.title,       -- title from signal
      v_sig.description,

      v_rank,

      -- Priority level from severity
      CASE v_sig.severity
        WHEN 'critical' THEN 'critical'
        WHEN 'high'     THEN 'high'
        WHEN 'medium'   THEN 'medium'
        ELSE                 'low'
      END,

      v_score.urgency,
      v_sig.confidence,

      ARRAY[v_sig.id],
      v_sig.id,

      -- Dimension mapping
      CASE v_sig.signal_type
        WHEN 'score_regression'     THEN 'technical'
        WHEN 'dimension_gap'        THEN 'technical'
        WHEN 'utr_regression'       THEN 'competition'
        WHEN 'low_match_volume'     THEN 'competition'
        ELSE NULL
      END,

      -- Current score in relevant dimension
      CASE v_sig.signal_type
        WHEN 'score_regression'  THEN v_pp.overall_score
        WHEN 'score_stagnation'  THEN v_pp.overall_score
        ELSE NULL
      END,

      -- Exercise tags
      CASE v_sig.signal_type
        WHEN 'score_regression'    THEN ARRAY['consistency', 'technique']
        WHEN 'utr_underperformance' THEN ARRAY['match-play', 'competition', 'pressure']
        WHEN 'low_match_volume'     THEN ARRAY['match-play', 'competition']
        WHEN 'load_overload_detected' THEN ARRAY['recovery', 'light']
        ELSE NULL
      END,

      -- Block types
      CASE v_sig.signal_type
        WHEN 'score_regression'     THEN ARRAY['technical']::block_type[]
        WHEN 'utr_underperformance' THEN ARRAY['competition', 'tactical']::block_type[]
        WHEN 'load_overload_detected' THEN ARRAY['cool_down', 'mental']::block_type[]
        ELSE NULL
      END,

      true, 'open'
    ) RETURNING id INTO v_priority_id;

    v_rank := v_rank + 1;
    v_count := v_count + 1;
  END LOOP;

  -- If no signals but player is active, add a reassessment check if overdue
  IF v_count = 0 AND v_pp.overall_score IS NULL THEN
    INSERT INTO player_priorities (
      academy_id, player_id, category, title,
      priority_rank, priority_level, urgency, confidence_score,
      source_signal_ids, is_active, status
    ) VALUES (
      p_academy_id, p_player_id, 'reassessment', 'No assessment data — needs intake evaluation',
      1, 'high', 'urgent', 0.900, '{}', true, 'open'
    );
    v_count := 1;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE player_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see player priorities"
  ON player_priorities FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff manage priorities"
  ON player_priorities FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Players see own priorities"
  ON player_priorities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_priorities.player_id AND p.profile_id = auth.uid()
    )
  );
