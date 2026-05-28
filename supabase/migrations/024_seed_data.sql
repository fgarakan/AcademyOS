-- ============================================================
-- ACADEMY OS — MIGRATION 024: SEED DATA
-- Demo data for development + testing.
-- Covers the full loop: academy → players → assessments →
-- signals → priorities → recommendations → sessions → outcomes.
--
-- NOTE: Profiles require real auth.users IDs from Supabase Auth.
-- Coaches and players with app access must be created via Supabase
-- dashboard first, then their UUIDs referenced here.
-- This file seeds everything that does NOT depend on auth.users.
-- ============================================================

-- ============================================================
-- DEMO ACADEMY
-- ============================================================
INSERT INTO academies (id, name, slug, country, timezone, settings) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Angles Tennis Academy',
   'angles',
   'US',
   'America/New_York',
   jsonb_build_object(
     'level_count', 6,
     'scoring_step', 0.5,
     'default_reassessment_weeks', 10,
     'currency', 'USD'
   )
  );

-- ============================================================
-- DEMO LEVELS
-- ============================================================
INSERT INTO academy_levels (id, academy_id, level_number, label, description, track, sort_order) VALUES
  ('00000000-0000-0001-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Red Ball Beginners',    'New players, red ball stage',           'skill',       10),
  ('00000000-0000-0001-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, 'Orange Development',   'Orange ball, building foundations',     'skill',       20),
  ('00000000-0000-0001-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, 'Green Performance',    'Green ball, developing consistency',    'skill',       30),
  ('00000000-0000-0001-0000-000000000004', '00000000-0000-0000-0000-000000000001', 4, 'Elite Development',    'Full court, pre-competitive',           'skill',       40),
  ('00000000-0000-0001-0000-000000000005', '00000000-0000-0000-0000-000000000001', 5, 'Performance',          'Competitive players',                   'competition', 50),
  ('00000000-0000-0001-0000-000000000006', '00000000-0000-0000-0000-000000000001', 6, 'Elite',                'High-performance program',              'competition', 60);

-- ============================================================
-- DEMO GROUPS
-- ============================================================
INSERT INTO groups (id, academy_id, name, description, track, max_players) VALUES
  ('00000000-0000-0002-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Elite-A',          'Top competitive group',                 'competition', 8),
  ('00000000-0000-0002-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Performance-B',    'Developing competitive players',        'skill',       10),
  ('00000000-0000-0002-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Green Development','Green ball stage',                      'skill',       12),
  ('00000000-0000-0002-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Orange Beginners', 'Orange ball foundations',               'skill',       12);

-- ============================================================
-- SIGNAL PRIORITY WEIGHTS (all signal types, default weights)
-- ============================================================
INSERT INTO signal_priority_weights (
  academy_id, signal_type, weight,
  low_multiplier, medium_multiplier, high_multiplier, critical_multiplier,
  min_confidence
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  unnest(ARRAY[
    'assessment_completed', 'score_improvement', 'score_regression', 'score_stagnation',
    'dimension_gap', 'dimension_breakout', 'promotion_ready', 'promotion_flagged',
    'utr_improvement', 'utr_regression', 'utr_stagnation', 'utr_underperformance',
    'utr_overperformance', 'low_match_volume', 'high_match_volume',
    'session_outcome_positive', 'session_outcome_negative',
    'attendance_pattern_concern', 'load_overload_detected',
    'coach_priority_flagged', 'coach_concern_flagged', 'injury_concern',
    'competition_season_start', 'competition_season_end', 'peak_competition_period',
    'preparation_phase_start', 'overtraining_risk',
    'constraint_active', 'constraint_resolved',
    'reassessment_overdue', 'reassessment_approaching'
  ]::signal_type[]),
  -- Weights: regressions and overtraining weighted higher by default
  unnest(ARRAY[
    0.50, 0.80, 1.50, 1.20,   -- assessment signals
    1.30, 0.60, 1.80, 1.40,   -- promotion signals
    0.70, 1.60, 1.20, 1.10,   -- UTR signals
    0.70, 1.00, 0.80,         -- UTR volume signals
    0.60, 1.10,               -- session outcome signals
    1.30, 1.80,               -- attendance + overload
    1.40, 1.60, 2.00,         -- coach signals
    0.50, 0.40, 0.60,         -- calendar signals
    0.50, 1.80,               -- phase + overtraining
    1.50, 0.30,               -- constraint signals
    1.40, 0.60                -- reassessment signals
  ]::NUMERIC[]),
  0.50, 1.00, 1.75, 3.00,
  0.600;

-- ============================================================
-- PHASE LOAD DEFAULTS (already seeded in 017, skip if exists)
-- Using ON CONFLICT DO NOTHING since the table was populated in 017.
-- ============================================================
-- (phase_load_defaults seeded in 017_time_intelligence.sql)

-- ============================================================
-- DATABASE CHANGELOG ENTRIES FOR MOAT MIGRATIONS
-- ============================================================
INSERT INTO database_changelog (migration, description) VALUES
  ('012_functions_triggers',  'Progression update trigger, flag_overdue_reassessments, session-from-template'),
  ('013_reporting_views',     'Core reporting views (player summary, group summary, reassessment pipeline)'),
  ('014_signal_layer',        'player_development_signals — the moat core, emit_signal(), resolve_signal()'),
  ('015_utr_integration',     'player_utr_profiles, player_utr_history, player_utr_matches, player_utr_insights'),
  ('016_player_outcomes',     'player_outcomes, player_progress_snapshots, take_progress_snapshot()'),
  ('017_time_intelligence',   'player_time_series, player_phase_states, academy_calendar, competition_schedule'),
  ('018_player_load_aggregation', 'player_load_aggregation: 7d/28d windows, fatigue_risk_score, compute_player_load()'),
  ('019_decision_scoring',    'signal_priority_weights, decision_scores, score_player(), score_academy_players()'),
  ('020_player_priorities',   'player_priorities: ranked from signals, generate_player_priorities()'),
  ('021_recommendations',     'player_recommendations, session_recommendations, run_full_engine()'),
  ('022_learning_system',     'recommendation_overrides, decision_learning_logs, evaluate_overrides()'),
  ('023_moat_views',          'Integrated views: priority queue, recommendation queue, development loop'),
  ('024_seed_data',           'Demo academy, levels, groups, signal weights, exercises')
ON CONFLICT (migration) DO NOTHING;

-- ============================================================
-- ASSESSMENT VERSION (standard rubric)
-- ============================================================
INSERT INTO assessment_versions (
  id, academy_id, name, description, categories, scoring_scale, is_default
) VALUES (
  '00000000-0000-0003-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Standard V1',
  'Five-dimension assessment: Technical (30%), Tactical (20%), Movement (20%), Competition (15%), Behavioral (15%)',
  '{
    "technical":   { "label": "Technical",   "weight": 0.30, "subcategories": ["forehand","backhand","serve","return","volley","overhead"] },
    "tactical":    { "label": "Tactical",     "weight": 0.20, "subcategories": ["patterns","positioning","decision_making","game_style"] },
    "movement":    { "label": "Movement",     "weight": 0.20, "subcategories": ["speed","agility","recovery","court_coverage"] },
    "competition": { "label": "Competition",  "weight": 0.15, "subcategories": ["pressure_handling","consistency","match_tactics","mental_resilience"] },
    "behavioral":  { "label": "Behavioral",   "weight": 0.15, "subcategories": ["attitude","effort","coachability","communication"] }
  }'::JSONB,
  '{"min": 0, "max": 10, "step": 0.5}'::JSONB,
  true
);

-- ============================================================
-- EXERCISES
-- ============================================================
INSERT INTO exercises (academy_id, name, category, subcategory, description, duration_min, tags, level_range) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cross-Court Forehand Rally',      'technical',   'forehand',        'Sustained cross-court rally focusing on topspin consistency', 15, ARRAY['forehand','consistency','rally'],          '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Serve + 1 Pattern',               'tactical',    'serve',           'Serve followed by predetermined first-ball pattern',          20, ARRAY['serve','pattern','tactical'],             '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Spider Drill',                    'movement',    'court_coverage',  'Multi-cone sprint pattern covering full court',               10, ARRAY['movement','speed','agility'],             '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Approach and Volley',             'technical',   'net_play',        'Short ball recognition, approach shot, first volley',         15, ARRAY['volley','net_approach','tactical'],        '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Backhand Cross-Court',            'technical',   'backhand',        'Deep cross-court backhand consistency drill',                 15, ARRAY['backhand','consistency','cross-court'],    '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Point Play Under Pressure',       'competition', 'pressure',        'Tiebreak situations and close-score scenarios',               20, ARRAY['competition','pressure','match-play'],     '{"min": 4, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Dynamic Warm-Up',                 'warm_up',     NULL,              'Full body dynamic stretching and movement prep',              10, ARRAY['warm-up','injury-prevention'],            '{"min": 1, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Serve Mechanics Breakdown',       'technical',   'serve',           'Segmented serve technique: toss, trophy, contact',            20, ARRAY['serve','technique','mechanics'],          '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Footwork Ladder',                 'fitness',     'agility',         'Agility ladder patterns for court-specific footwork',         8,  ARRAY['fitness','footwork','agility'],           '{"min": 1, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Open vs. Closed Stance Decision', 'tactical',    'decision_making', 'Recognizing open/closed stance on forehand',                  15, ARRAY['tactical','forehand','decision-making'],   '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Recovery Yoga / Stretch',         'cool_down',   'flexibility',     'Static stretching and breathwork for recovery sessions',       15, ARRAY['recovery','light','cool-down','flexibility'],'{"min": 1, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Match Play (practice set)',        'competition', 'match_play',      'Full sets with coaching timeouts',                            45, ARRAY['match-play','competition','pressure'],    '{"min": 4, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Tactical Pattern Drill',          'tactical',    'patterns',        'Predetermined 3-shot patterns from serve',                    20, ARRAY['tactical','pattern','serve'],             '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Baseline Consistency Challenge',  'technical',   'consistency',     'Rally to targets: 20-ball consistency goal',                  15, ARRAY['consistency','baseline','technique'],     '{"min": 2, "max": 5}');

-- ============================================================
-- DEMO TEMPLATES
-- Two templates for Performance-B group.
-- ============================================================
INSERT INTO templates (id, academy_id, name, description, group_id, track, total_duration_min, tags, is_default) VALUES
  ('00000000-0000-0004-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Performance-B Standard Session',
   'Default 90-minute session for Performance-B group',
   '00000000-0000-0002-0000-000000000002',
   'skill', 90,
   ARRAY['skill','technical','tactical'],
   true),

  ('00000000-0000-0004-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Competition Prep Session',
   'Pre-tournament session: match play focus',
   '00000000-0000-0002-0000-000000000001',
   'competition', 90,
   ARRAY['competition','match-play','pressure'],
   false);

-- Template blocks for Performance-B Standard Session
INSERT INTO template_blocks (template_id, type, name, duration_min, intensity, order_index) VALUES
  ('00000000-0000-0004-0000-000000000001', 'warm_up',   'Dynamic Warm-Up',         10, 1, 1),
  ('00000000-0000-0004-0000-000000000001', 'technical', 'Forehand + Backhand Drills', 25, 3, 2),
  ('00000000-0000-0004-0000-000000000001', 'tactical',  'Pattern Work',             20, 3, 3),
  ('00000000-0000-0004-0000-000000000001', 'competition','Point Play',              25, 4, 4),
  ('00000000-0000-0004-0000-000000000001', 'cool_down', 'Stretch + Debrief',        10, 1, 5);

-- Template blocks for Competition Prep Session
INSERT INTO template_blocks (template_id, type, name, duration_min, intensity, order_index) VALUES
  ('00000000-0000-0004-0000-000000000002', 'warm_up',     'Dynamic Warm-Up',         10, 1, 1),
  ('00000000-0000-0004-0000-000000000002', 'tactical',    'Serve + Pattern Sharpening',25, 3, 2),
  ('00000000-0000-0004-0000-000000000002', 'competition', 'Match Play (full sets)',   45, 4, 3),
  ('00000000-0000-0004-0000-000000000002', 'mental',      'Pressure Scenarios',      10, 3, 4);

-- ============================================================
-- DEMO PLAYERS (no auth.users dependency — profile_id left NULL)
-- These can be tested via service role key.
-- ============================================================
INSERT INTO players (
  id, academy_id, first_name, last_name, date_of_birth, gender, handedness,
  status, current_group_id, current_level_id, current_track, join_date
) VALUES
  ('00000000-0000-0005-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Alex', 'Rivera', '2011-03-15', 'male', 'right',
   'active', '00000000-0000-0002-0000-000000000002', '00000000-0000-0001-0000-000000000004',
   'skill', '2024-09-01'),

  ('00000000-0000-0005-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Sofia', 'Martinez', '2010-07-22', 'female', 'right',
   'active', '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000006',
   'competition', '2023-01-15'),

  ('00000000-0000-0005-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'Jordan', 'Chen', '2013-11-08', 'other', 'right',
   'pending_placement', NULL, NULL, NULL, '2026-04-20'),

  ('00000000-0000-0005-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   'Marcus', 'Thompson', '2009-05-30', 'male', 'right',
   'reassessment_due', '00000000-0000-0002-0000-000000000001', '00000000-0000-0001-0000-000000000006',
   'competition', '2022-06-01');

-- Seed group memberships for active players
INSERT INTO group_memberships (academy_id, player_id, group_id, is_current) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000001', '00000000-0000-0002-0000-000000000002', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002', '00000000-0000-0002-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004', '00000000-0000-0002-0000-000000000001', true);

-- Seed player progression for active players
INSERT INTO player_progression (
  academy_id, player_id,
  technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score,
  baseline_technical, baseline_tactical, baseline_movement, baseline_competition, baseline_behavioral, baseline_overall,
  baseline_set_at
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000001',
   6.5, 6.0, 7.0, 5.5, 8.0, 6.55,
   5.5, 5.0, 6.0, 4.5, 7.5, 5.65, '2024-09-15'),

  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002',
   8.5, 8.0, 8.5, 8.5, 8.0, 8.35,
   7.5, 7.0, 7.5, 7.5, 7.5, 7.40, '2023-02-01'),

  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004',
   7.0, 7.5, 7.0, 7.5, 6.5, 7.10,
   7.0, 7.5, 7.0, 7.5, 6.5, 7.10, '2022-07-01');

-- Seed player phase states
INSERT INTO player_phase_states (academy_id, player_id, phase, start_date, reason, is_current) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000001', 'training',     '2026-04-01', 'Season baseline', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002', 'competition',  '2026-04-01', 'Tournament season', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004', 'pre_competition','2026-04-01','Overdue for reassessment during pre-comp', true);

-- Seed UTR profiles
INSERT INTO player_utr_profiles (academy_id, player_id, utr_singles, utr_status, last_synced_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002', 9.2, 'rated', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004', 7.8, 'rated', NOW() - INTERVAL '35 days');

-- Seed UTR history
INSERT INTO player_utr_history (academy_id, player_id, utr_value, utr_type, utr_status, captured_at, source) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002', 9.0, 'singles', 'rated', NOW() - INTERVAL '90 days', 'manual'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000002', 9.2, 'singles', 'rated', NOW() - INTERVAL '5 days', 'manual'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004', 8.0, 'singles', 'rated', NOW() - INTERVAL '120 days', 'manual'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0005-0000-000000000004', 7.8, 'singles', 'rated', NOW() - INTERVAL '35 days', 'manual');

-- Seed reassessment due signal for Marcus Thompson
INSERT INTO player_development_signals (
  academy_id, player_id, signal_type, source, severity, confidence,
  title, description, data, recommended_action,
  source_object_type, source_object_id,
  expires_at, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0005-0000-000000000004',
  'reassessment_overdue', 'system_cron',
  'high', 1.000,
  'Reassessment overdue: Marcus Thompson',
  'Last assessment was over 12 weeks ago. Player is in reassessment_due status.',
  '{"weeks_overdue": 2}'::JSONB,
  'schedule_reassessment',
  'player', '00000000-0000-0005-0000-000000000004',
  NOW() + INTERVAL '14 days',
  true
);

-- Seed UTR stagnation signal for Marcus Thompson (UTR dropped)
INSERT INTO player_development_signals (
  academy_id, player_id, signal_type, source, severity, confidence,
  title, description, data, recommended_action,
  source_object_type, expires_at, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0005-0000-000000000004',
  'utr_regression', 'utr',
  'medium', 0.950,
  'UTR regression: -0.2 (7.8)',
  'UTR dropped from 8.0 to 7.8 over 85 days.',
  '{"delta": -0.2, "from_utr": 8.0, "to_utr": 7.8, "days_elapsed": 85}'::JSONB,
  'schedule_reassessment',
  'player_utr_history',
  NOW() + INTERVAL '30 days',
  true
);

-- ============================================================
-- Note on players with profiles (coaches, directors):
-- After creating accounts via Supabase Auth Dashboard:
--   INSERT INTO profiles (id, academy_id, display_name, email)
--   VALUES ('<auth_user_uuid>', '00000000-0000-0000-0000-000000000001', 'Director Name', 'director@angles.com');
--
--   INSERT INTO academy_memberships (academy_id, profile_id, role)
--   VALUES ('00000000-0000-0000-0000-000000000001', '<profile_id>', 'academy_director');
--
-- See README_BACKEND.md § Authentication Setup for full walkthrough.
-- ============================================================
