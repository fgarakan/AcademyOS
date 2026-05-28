-- ============================================================
-- ACADEMY OS — MIGRATION 0009: SEED DATA
-- Demo data for development and testing
-- ============================================================

-- Create demo academy
INSERT INTO academies (id, name, slug, country, timezone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Angles Tennis Academy', 'angles', 'US', 'America/New_York');

-- Create demo levels
INSERT INTO academy_levels (academy_id, level_number, label, description, track, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 'Red Ball Beginners', 'New players, red ball stage', 'skill', 10),
  ('00000000-0000-0000-0000-000000000001', 2, 'Orange Development', 'Orange ball, building foundations', 'skill', 20),
  ('00000000-0000-0000-0000-000000000001', 3, 'Green Performance', 'Green ball, developing consistency', 'skill', 30),
  ('00000000-0000-0000-0000-000000000001', 4, 'Elite Development', 'Full court, pre-competitive', 'skill', 40),
  ('00000000-0000-0000-0000-000000000001', 5, 'Performance', 'Competitive players', 'competition', 50),
  ('00000000-0000-0000-0000-000000000001', 6, 'Elite', 'High-performance program', 'competition', 60);

-- Create demo groups
INSERT INTO groups (id, academy_id, name, description, track, max_players) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Elite-A', 'Top competitive group', 'competition', 8),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Performance-B', 'Developing competitive players', 'skill', 10),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Green Development', 'Green ball stage', 'skill', 12),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Orange Beginners', 'Orange ball foundations', 'skill', 12);

-- Note: Demo user profiles would be created after auth.users entries exist via Supabase Auth.
-- Use the Supabase dashboard to create test accounts, then insert profiles referencing the auth.users IDs.

-- Seed exercises
INSERT INTO exercises (academy_id, name, category, subcategory, description, duration_min, tags, level_range) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cross-Court Forehand Rally', 'technical', 'forehand', 'Sustained cross-court rally focusing on topspin consistency', 15, ARRAY['forehand', 'consistency', 'rally'], '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Serve + 1 Pattern', 'tactical', 'serve', 'Serve followed by predetermined first-ball pattern', 20, ARRAY['serve', 'pattern', 'tactical'], '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Spider Drill', 'movement', 'court_coverage', 'Multi-cone sprint pattern covering full court', 10, ARRAY['movement', 'speed', 'agility'], '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Approach and Volley', 'technical', 'net_play', 'Short ball recognition, approach shot, and first volley', 15, ARRAY['volley', 'net_approach', 'tactical'], '{"min": 3, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Backhand Cross-Court', 'technical', 'backhand', 'Deep cross-court backhand consistency drill', 15, ARRAY['backhand', 'consistency', 'cross-court'], '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Point Play Under Pressure', 'competition', 'pressure', 'Tiebreak situations and close score scenarios', 20, ARRAY['competition', 'pressure', 'match-play'], '{"min": 4, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Dynamic Warm-Up', 'warm_up', NULL, 'Full body dynamic stretching and movement preparation', 10, ARRAY['warm-up', 'injury-prevention'], '{"min": 1, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Serve Mechanics Breakdown', 'technical', 'serve', 'Segmented serve technique work: toss, trophy, contact', 20, ARRAY['serve', 'technique', 'mechanics'], '{"min": 2, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Footwork Ladder', 'fitness', 'agility', 'Agility ladder patterns for court-specific footwork', 8, ARRAY['fitness', 'footwork', 'agility'], '{"min": 1, "max": 6}'),
  ('00000000-0000-0000-0000-000000000001', 'Open vs. Closed Stance Decision', 'tactical', 'decision_making', 'Recognizing when to use open or closed stance on forehand', 15, ARRAY['tactical', 'forehand', 'decision-making'], '{"min": 3, "max": 6}');

-- ============================================================
-- NOTE ON PLAYER SEED DATA
-- Players must be linked to real auth.users IDs.
-- After creating test accounts via Supabase Auth, run:
--
-- INSERT INTO players (academy_id, first_name, last_name, date_of_birth, status)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Alex', 'Rivera', '2011-03-15', 'active');
--
-- Then insert their profiles, progression records, and observations.
-- See package 10 testing guide for full test data setup instructions.
-- ============================================================
