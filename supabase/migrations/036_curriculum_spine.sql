-- ============================================================
-- GLOBAL HELPER: update_updated_at_column
-- Must exist BEFORE any trigger uses it
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migration 036: Curriculum Spine — Core Tables
-- Stages, levels, skill domains, progressions, progression rules, parent descriptions
-- Integrates with: player_development_signals, player_recommendations, player_outcomes, exercises

-- ──────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────

CREATE TYPE curriculum_stage AS ENUM (
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance'
);

CREATE TYPE skill_domain_type AS ENUM (
  'preparation',
  'downswing',
  'contact',
  'finish',
  'transition',
  'movement',
  'decision_making',
  'competition_behavior'
);

CREATE TYPE progression_status AS ENUM (
  'not_started',
  'in_progress',
  'complete',
  'regressed'
);

ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'curriculum_skill_gap';
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'curriculum_ready_to_advance';
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'curriculum_regression';

-- ──────────────────────────────────────────────
-- CURRICULUM STAGES
-- ──────────────────────────────────────────────

CREATE TABLE curriculum_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage curriculum_stage UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INT NOT NULL,
  color_hex TEXT NOT NULL,
  age_range_min INT,
  age_range_max INT,
  utr_range_min NUMERIC(4,2),
  utr_range_max NUMERIC(4,2),
  stage_goal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- CURRICULUM LEVELS
-- ──────────────────────────────────────────────

CREATE TABLE curriculum_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage curriculum_stage NOT NULL,
  level_number INT NOT NULL CHECK (level_number BETWEEN 1 AND 3),
  display_name TEXT NOT NULL,
  sort_order INT NOT NULL,
  min_assessment_score NUMERIC(4,2),
  min_utr NUMERIC(4,2),
  advance_min_outcomes INT NOT NULL DEFAULT 8,
  advance_min_domains_complete INT NOT NULL DEFAULT 5,
  advance_min_assessment_score NUMERIC(4,2),
  is_assessment_required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (stage, level_number),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- SKILL DOMAINS
-- ──────────────────────────────────────────────

CREATE TABLE skill_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain skill_domain_type UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  short_desc TEXT NOT NULL,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- SKILL PROGRESSIONS
-- Seed rows should be added in a later clean migration.
-- ──────────────────────────────────────────────

CREATE TABLE skill_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  domain skill_domain_type NOT NULL,
  description TEXT NOT NULL,
  success_criteria TEXT[] NOT NULL DEFAULT '{}',
  failure_patterns TEXT[] NOT NULL DEFAULT '{}',
  signal_indicators TEXT[] NOT NULL DEFAULT '{}',
  outcome_confirmations TEXT[] NOT NULL DEFAULT '{}',
  domain_weight NUMERIC(4,3) NOT NULL DEFAULT 0.125,
  mastery_outcome_threshold INT NOT NULL DEFAULT 3,
  UNIQUE (level_id, domain),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- PARENT-FACING LEVEL DESCRIPTIONS
-- ──────────────────────────────────────────────

CREATE TABLE parent_level_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL UNIQUE REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  what_we_focus_on TEXT NOT NULL,
  what_success_looks_like TEXT NOT NULL,
  how_you_can_help TEXT NOT NULL,
  typical_session_structure TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- PROGRESSION RULES
-- ──────────────────────────────────────────────

CREATE TABLE progression_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL UNIQUE REFERENCES curriculum_levels(id) ON DELETE CASCADE,
  min_total_outcomes INT NOT NULL DEFAULT 8,
  min_domains_mastered INT NOT NULL DEFAULT 5,
  min_assessment_score NUMERIC(4,2),
  blocking_signal_types TEXT[] NOT NULL DEFAULT '{}',
  min_weeks_at_level INT NOT NULL DEFAULT 8,
  requires_final_assessment BOOLEAN NOT NULL DEFAULT true,
  requires_director_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- PLAYER CURRICULUM STATE
-- ──────────────────────────────────────────────

CREATE TABLE player_curriculum_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  current_level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_evaluated_at TIMESTAMPTZ,
  advancement_eligible BOOLEAN NOT NULL DEFAULT false,
  advancement_blocked_by TEXT[],
  notes TEXT,
  UNIQUE (player_id, academy_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- PLAYER DOMAIN PROGRESS
-- ──────────────────────────────────────────────

CREATE TABLE player_domain_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  domain skill_domain_type NOT NULL,
  status progression_status NOT NULL DEFAULT 'not_started',
  outcome_count INT NOT NULL DEFAULT 0,
  positive_outcome_count INT NOT NULL DEFAULT 0,
  last_outcome_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  regression_detected_at TIMESTAMPTZ,
  UNIQUE (player_id, level_id, domain),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────
-- CURRICULUM LEVEL HISTORY
-- ──────────────────────────────────────────────

CREATE TABLE player_curriculum_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  from_level_id UUID REFERENCES curriculum_levels(id),
  to_level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  advanced_by UUID NOT NULL REFERENCES profiles(id),
  advanced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcomes_at_time INT,
  domains_mastered_at_time INT,
  assessment_score_at_time NUMERIC(4,2),
  notes TEXT
);

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────

CREATE INDEX idx_player_curriculum_states_player ON player_curriculum_states(player_id);
CREATE INDEX idx_player_curriculum_states_academy ON player_curriculum_states(academy_id);
CREATE INDEX idx_player_domain_progress_player ON player_domain_progress(player_id, academy_id);
CREATE INDEX idx_player_domain_progress_level ON player_domain_progress(level_id);
CREATE INDEX idx_skill_progressions_level ON skill_progressions(level_id);
CREATE INDEX idx_curriculum_history_player ON player_curriculum_history(player_id, academy_id);

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────

ALTER TABLE curriculum_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_level_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_curriculum_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_domain_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_curriculum_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read curriculum_stages"
  ON curriculum_stages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read curriculum_levels"
  ON curriculum_levels FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read skill_domains"
  ON skill_domains FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read skill_progressions"
  ON skill_progressions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read parent_descriptions"
  ON parent_level_descriptions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read progression_rules"
  ON progression_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors manage curriculum_stages"
  ON curriculum_stages FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Directors manage curriculum_levels"
  ON curriculum_levels FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Directors manage skill_domains"
  ON skill_domains FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Directors manage skill_progressions"
  ON skill_progressions FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Directors manage parent_descriptions"
  ON parent_level_descriptions FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Directors manage progression_rules"
  ON progression_rules FOR ALL
  USING (auth_is_director_or_head());

CREATE POLICY "Staff see player curriculum states"
  ON player_curriculum_states FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "System manages player curriculum states"
  ON player_curriculum_states FOR ALL
  USING (academy_id = auth_academy_id());

CREATE POLICY "Players see own curriculum state"
  ON player_curriculum_states FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()));

CREATE POLICY "Staff see player domain progress"
  ON player_domain_progress FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "System manages player domain progress"
  ON player_domain_progress FOR ALL
  USING (academy_id = auth_academy_id());

CREATE POLICY "Players see own domain progress"
  ON player_domain_progress FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()));

CREATE POLICY "Staff see curriculum history"
  ON player_curriculum_history FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Directors manage curriculum history"
  ON player_curriculum_history FOR ALL
  USING (academy_id = auth_academy_id() AND auth_is_director_or_head());

-- ──────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ──────────────────────────────────────────────

CREATE TRIGGER trg_player_curriculum_states_updated_at
  BEFORE UPDATE ON player_curriculum_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_player_domain_progress_updated_at
  BEFORE UPDATE ON player_domain_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────
-- SEED: STAGES
-- ──────────────────────────────────────────────

INSERT INTO curriculum_stages (
  stage,
  display_name,
  sort_order,
  color_hex,
  age_range_min,
  age_range_max,
  utr_range_min,
  utr_range_max,
  stage_goal
) VALUES
  ('red_foundation', 'Red Foundation', 1, '#E53E3E', 5, 10, 0.0, 2.0, 'Build the athletic and technical foundation for all future tennis development. Players learn how to move, cooperate, and make first contact with the ball as a repeatable skill.'),
  ('orange_development', 'Orange Development', 2, '#DD6B20', 9, 12, 1.5, 3.5, 'Develop consistent stroke mechanics, basic tactical awareness, and the emotional regulation to compete in low-stakes environments.'),
  ('green_performance', 'Green Performance', 3, '#38A169', 11, 14, 3.0, 5.0, 'Refine all strokes under pressure, introduce point construction, and develop the physical capacity to train and compete at higher volume.'),
  ('yellow_competitive', 'Yellow Competitive', 4, '#D69E2E', 13, 17, 4.5, 7.0, 'Compete at regional and national level. Develop tactical identity, serve as a weapon, and build the mental game to perform under pressure.'),
  ('high_performance', 'High Performance', 5, '#553C9A', 15, 21, 6.0, 16.1, 'Elite training environment. Specialised physical preparation, tactical complexity, professional match preparation, and academy-to-pro transition.');

-- ──────────────────────────────────────────────
-- SEED: LEVELS
-- ──────────────────────────────────────────────

INSERT INTO curriculum_levels (
  stage,
  level_number,
  display_name,
  sort_order,
  min_assessment_score,
  min_utr,
  advance_min_outcomes,
  advance_min_domains_complete,
  advance_min_assessment_score
) VALUES
  ('red_foundation', 1, 'Red 1 — Discovery', 1, NULL, NULL, 6, 4, 4.0),
  ('red_foundation', 2, 'Red 2 — Contact', 2, 4.0, NULL, 8, 5, 4.5),
  ('red_foundation', 3, 'Red 3 — Consistency', 3, 4.5, NULL, 10, 5, 5.0),

  ('orange_development', 1, 'Orange 1 — Rally', 4, 5.0, 1.5, 8, 5, 5.0),
  ('orange_development', 2, 'Orange 2 — Direction', 5, 5.0, 2.0, 10, 5, 5.5),
  ('orange_development', 3, 'Orange 3 — Construction', 6, 5.5, 2.5, 12, 6, 5.5),

  ('green_performance', 1, 'Green 1 — Pressure', 7, 5.5, 3.0, 10, 5, 6.0),
  ('green_performance', 2, 'Green 2 — Variety', 8, 6.0, 3.5, 12, 6, 6.0),
  ('green_performance', 3, 'Green 3 — Identity', 9, 6.0, 4.0, 12, 6, 6.5),

  ('yellow_competitive', 1, 'Yellow 1 — Compete', 10, 6.0, 4.5, 12, 6, 6.5),
  ('yellow_competitive', 2, 'Yellow 2 — Construct', 11, 6.5, 5.0, 14, 7, 7.0),
  ('yellow_competitive', 3, 'Yellow 3 — Win', 12, 7.0, 6.0, 16, 7, 7.0),

  ('high_performance', 1, 'HP 1 — Specialise', 13, 7.0, 6.0, 14, 7, 7.5),
  ('high_performance', 2, 'HP 2 — Compete Elite', 14, 7.5, 8.0, 16, 7, 8.0),
  ('high_performance', 3, 'HP 3 — Professional', 15, 8.0, 10.0, 20, 8, 8.5);

-- ──────────────────────────────────────────────
-- SEED: SKILL DOMAINS
-- ──────────────────────────────────────────────

INSERT INTO skill_domains (
  domain,
  display_name,
  short_desc,
  sort_order
) VALUES
  ('preparation', 'Preparation', 'Racket position, split step, ready stance before ball contact', 1),
  ('downswing', 'Downswing', 'Racket path, low-to-high swing mechanics, coil and load', 2),
  ('contact', 'Contact', 'Contact point, racket face angle, timing relative to body', 3),
  ('finish', 'Finish', 'Follow-through completion, balance at finish, arm path', 4),
  ('transition', 'Transition', 'Recovery after shot, court positioning, split step timing', 5),
  ('movement', 'Movement', 'Footwork patterns, court coverage, explosiveness and change of direction', 6),
  ('decision_making', 'Decision Making', 'Shot selection, risk management, tactical awareness during play', 7),
  ('competition_behavior', 'Competition Behavior', 'Focus under pressure, emotional regulation, routines, sportsmanship', 8);

-- ──────────────────────────────────────────────
-- SEED: PROGRESSION RULES
-- ──────────────────────────────────────────────

DO $$
DECLARE
  v_level RECORD;
BEGIN
  FOR v_level IN
    SELECT id, stage, level_number FROM curriculum_levels ORDER BY sort_order
  LOOP
    INSERT INTO progression_rules (
      level_id,
      min_total_outcomes,
      min_domains_mastered,
      min_assessment_score,
      blocking_signal_types,
      min_weeks_at_level,
      requires_final_assessment,
      requires_director_approval
    ) VALUES (
      v_level.id,
      CASE
        WHEN v_level.stage IN ('red_foundation') THEN 6 + (v_level.level_number - 1) * 2
        WHEN v_level.stage IN ('orange_development') THEN 8 + (v_level.level_number - 1) * 2
        WHEN v_level.stage IN ('green_performance') THEN 10 + (v_level.level_number - 1) * 2
        WHEN v_level.stage IN ('yellow_competitive') THEN 12 + (v_level.level_number - 1) * 2
        ELSE 14 + (v_level.level_number - 1) * 3
      END,
      CASE
        WHEN v_level.stage IN ('red_foundation') THEN 4
        WHEN v_level.stage IN ('orange_development', 'green_performance') THEN 5
        WHEN v_level.stage IN ('yellow_competitive', 'high_performance') THEN 6
        ELSE 5
      END,
      CASE
        WHEN v_level.stage = 'red_foundation' THEN 4.0 + (v_level.level_number - 1) * 0.5
        WHEN v_level.stage = 'orange_development' THEN 5.0 + (v_level.level_number - 1) * 0.25
        WHEN v_level.stage = 'green_performance' THEN 6.0 + (v_level.level_number - 1) * 0.25
        WHEN v_level.stage = 'yellow_competitive' THEN 6.5 + (v_level.level_number - 1) * 0.25
        ELSE 7.5 + (v_level.level_number - 1) * 0.5
      END,
      ARRAY['overtraining_risk', 'injury_risk'],
      CASE
        WHEN v_level.stage IN ('red_foundation') THEN 6
        WHEN v_level.stage IN ('orange_development') THEN 8
        WHEN v_level.stage IN ('green_performance') THEN 10
        WHEN v_level.stage IN ('yellow_competitive') THEN 12
        ELSE 12
      END,
      true,
      CASE
        WHEN v_level.stage IN ('yellow_competitive', 'high_performance') THEN true
        ELSE false
      END
    );
  END LOOP;
END $$;