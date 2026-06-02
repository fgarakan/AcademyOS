-- Migration 082: Seed Global Core Assessment Template
-- Creates the platform-owned global template with 7 sections and 55 skills.
-- level_applicability is set per skill based on age/stage relevance.
-- This template is read-only (is_global=true). Directors customize their academy clone.
--
-- IDEMPOTENCY: This entire block is guarded by an existence check on is_global = true.
-- Re-running will SKIP all inserts if the global template already exists.
-- A partial unique index also prevents more than one global template from ever existing.

-- Prevent duplicate global templates at the DB level (safe to apply if index already exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_at_single_global
  ON assessment_templates(is_global)
  WHERE is_global = true;

DO $$
DECLARE
  v_template_id uuid;
  v_section_id  uuid;

  -- Section IDs
  s_universal   uuid;
  s_forehand    uuid;
  s_backhand    uuid;
  s_serve       uuid;
  s_return      uuid;
  s_fitness     uuid;
  s_mental      uuid;

  -- Level shorthand arrays
  all_levels    text[] := ARRAY['general','red_ball','orange_ball','green_dot','yellow_ball','high_performance'];
  orange_up     text[] := ARRAY['orange_ball','green_dot','yellow_ball','high_performance'];
  green_up      text[] := ARRAY['green_dot','yellow_ball','high_performance'];
  yellow_up     text[] := ARRAY['yellow_ball','high_performance'];
  hp_only       text[] := ARRAY['high_performance'];
  general_red   text[] := ARRAY['general','red_ball','orange_ball','green_dot','yellow_ball','high_performance'];

BEGIN

  -- ── Idempotency guard ─────────────────────────────────────────────────────
  -- If the global template already exists, skip all inserts entirely.
  -- This makes the migration safe to re-run on environments where it was
  -- already applied (fully or partially).
  IF EXISTS (SELECT 1 FROM assessment_templates WHERE is_global = true LIMIT 1) THEN
    RAISE NOTICE 'migration 082: global assessment template already exists — skipping seed (idempotent no-op)';
    RETURN;
  END IF;

  -- ── Global template ────────────────────────────────────────────────────────
  INSERT INTO assessment_templates (name, is_global, platform_version, description)
  VALUES (
    'Core Assessment Template',
    true,
    '1.0',
    'Platform default. Covers all 7 domains across all playing levels. Directors clone and customize for their academy.'
  )
  RETURNING id INTO v_template_id;

  -- ── Section 1: Universal Foundations ──────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'universal_foundations', 'Universal Foundations', 1, 'skill', all_levels)
  RETURNING id INTO s_universal;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_universal, 'tracking',             'Tracking',              1,  true,  true,  all_levels),
    (v_template_id, s_universal, 'movement',             'Movement',              2,  true,  true,  all_levels),
    (v_template_id, s_universal, 'organization',         'Organization',          3,  false, true,  all_levels),
    (v_template_id, s_universal, 'rhythm_timing',        'Rhythm & Timing',       4,  true,  true,  all_levels),
    (v_template_id, s_universal, 'ball_control',         'Ball Control',          5,  true,  true,  all_levels),
    (v_template_id, s_universal, 'adaptability',         'Adaptability',          6,  false, true,  orange_up),
    (v_template_id, s_universal, 'competition_readiness','Competition Readiness', 7,  false, true,  orange_up);

  -- ── Section 2: Forehand ────────────────────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'forehand', 'Forehand', 2, 'skill', all_levels)
  RETURNING id INTO s_forehand;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_forehand, 'preparation',      'Preparation',       1,  true,  true,  all_levels),
    (v_template_id, s_forehand, 'spacing',          'Spacing',           2,  false, true,  all_levels),
    (v_template_id, s_forehand, 'contact',          'Contact',           3,  true,  true,  all_levels),
    (v_template_id, s_forehand, 'rhythm',           'Rhythm',            4,  false, true,  all_levels),
    (v_template_id, s_forehand, 'timing',           'Timing',            5,  false, true,  all_levels),
    (v_template_id, s_forehand, 'direction_control','Direction Control',  6,  false, true,  orange_up),
    (v_template_id, s_forehand, 'depth_control',    'Depth Control',     7,  false, true,  orange_up),
    (v_template_id, s_forehand, 'spin_control',     'Spin Control',      8,  false, true,  orange_up),
    (v_template_id, s_forehand, 'high_ball',        'High Ball',         9,  false, true,  orange_up),
    (v_template_id, s_forehand, 'low_ball',         'Low Ball',          10, false, true,  orange_up),
    (v_template_id, s_forehand, 'neutral_stance',   'Neutral Stance',    11, false, false, all_levels),
    (v_template_id, s_forehand, 'semi_open_stance', 'Semi-Open Stance',  12, false, false, green_up),
    (v_template_id, s_forehand, 'open_stance',      'Open Stance',       13, false, false, green_up);

  -- ── Section 3: Backhand ────────────────────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'backhand', 'Backhand', 3, 'skill', all_levels)
  RETURNING id INTO s_backhand;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_backhand, 'preparation',      'Preparation',      1,  true,  true,  all_levels),
    (v_template_id, s_backhand, 'spacing',          'Spacing',          2,  false, true,  all_levels),
    (v_template_id, s_backhand, 'contact',          'Contact',          3,  true,  true,  all_levels),
    (v_template_id, s_backhand, 'rhythm',           'Rhythm',           4,  false, true,  all_levels),
    (v_template_id, s_backhand, 'timing',           'Timing',           5,  false, true,  all_levels),
    (v_template_id, s_backhand, 'direction_control','Direction Control', 6,  false, true,  orange_up),
    (v_template_id, s_backhand, 'depth_control',    'Depth Control',    7,  false, true,  orange_up),
    (v_template_id, s_backhand, 'high_ball',        'High Ball',        8,  false, true,  orange_up),
    (v_template_id, s_backhand, 'low_ball',         'Low Ball',         9,  false, true,  orange_up),
    (v_template_id, s_backhand, 'stance_fluency',   'Stance Fluency',   10, false, false, green_up);

  -- ── Section 4: Serve ───────────────────────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'serve', 'Serve', 4, 'skill', all_levels)
  RETURNING id INTO s_serve;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_serve, 'grip_setup',               'Grip / Setup',               1, true,  true,  all_levels),
    (v_template_id, s_serve, 'rhythm',                   'Rhythm',                     2, false, true,  all_levels),
    (v_template_id, s_serve, 'toss',                     'Toss',                       3, true,  true,  all_levels),
    (v_template_id, s_serve, 'contact',                  'Contact',                    4, true,  true,  all_levels),
    (v_template_id, s_serve, 'balance',                  'Balance',                    5, false, true,  all_levels),
    (v_template_id, s_serve, 'direction',                'Direction',                  6, false, true,  orange_up),
    (v_template_id, s_serve, 'second_serve_confidence',  'Second Serve Confidence',    7, false, true,  orange_up);

  -- ── Section 5: Return / Rally / Competition ────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'return_rally_competition', 'Return / Rally / Competition', 5, 'competition', orange_up)
  RETURNING id INTO s_return;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_return, 'rally_tolerance',         'Rally Tolerance',          1, true,  true,  orange_up),
    (v_template_id, s_return, 'scoring_knowledge',       'Scoring Knowledge',        2, false, true,  orange_up),
    (v_template_id, s_return, 'decision_making',         'Decision Making',          3, false, true,  orange_up),
    (v_template_id, s_return, 'recovery_after_mistakes', 'Recovery After Mistakes',  4, false, true,  green_up),
    (v_template_id, s_return, 'point_construction',      'Point Construction',       5, false, true,  green_up),
    (v_template_id, s_return, 'competitive_independence','Competitive Independence', 6, false, true,  yellow_up);

  -- ── Section 6: Fitness / Movement ─────────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'fitness_movement', 'Fitness / Movement', 6, 'fitness', all_levels)
  RETURNING id INTO s_fitness;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_fitness, 'balance',       'Balance',               1, true,  true,  all_levels),
    (v_template_id, s_fitness, 'coordination',  'Coordination',          2, true,  true,  all_levels),
    (v_template_id, s_fitness, 'agility',       'Agility',               3, false, true,  all_levels),
    (v_template_id, s_fitness, 'mobility',      'Mobility',              4, false, true,  orange_up),
    (v_template_id, s_fitness, 'speed_readiness','Speed Readiness',      5, false, true,  orange_up),
    (v_template_id, s_fitness, 'endurance',     'Endurance / Readiness', 6, false, true,  green_up);

  -- ── Section 7: Mental Performance ─────────────────────────────────────────
  INSERT INTO assessment_template_sections
    (template_id, section_key, display_name, sort_order, pathway_category, level_applicability)
  VALUES
    (v_template_id, 'mental_performance', 'Mental Performance', 7, 'mental_performance', all_levels)
  RETURNING id INTO s_mental;

  INSERT INTO assessment_template_skills
    (template_id, section_id, skill_key, display_name, sort_order, appears_in_quick, appears_in_standard, level_applicability)
  VALUES
    (v_template_id, s_mental, 'focus',            'Focus',            1, true,  true,  all_levels),
    (v_template_id, s_mental, 'confidence',       'Confidence',       2, true,  true,  all_levels),
    (v_template_id, s_mental, 'resilience',       'Resilience',       3, false, true,  all_levels),
    (v_template_id, s_mental, 'emotional_reset',  'Emotional Reset',  4, false, true,  orange_up),
    (v_template_id, s_mental, 'coachability',     'Coachability',     5, false, true,  all_levels),
    (v_template_id, s_mental, 'pressure_response','Pressure Response',6, false, true,  yellow_up);

END $$;
