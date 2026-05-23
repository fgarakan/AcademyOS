-- ============================================================
-- ACADEMY OS — BRIAN DABUL DEMO SEED
-- Monteiro Tennis Academy — Fictional Data Only
-- ============================================================
-- SAFETY:
--   DO NOT RUN without explicit instruction.
--   DO NOT run against the live remote (dbjjhhxdkpdreytsozlq) without confirmation.
--   This file creates demo data only. No real child PII. No schema changes.
--
-- BEFORE RUNNING SECTIONS 3-9:
--   Substitute placeholder UUIDs with real auth.users UUIDs.
--   Use sed command from packet doc, or find-and-replace manually.
--
-- PLACEHOLDER UUID MAP:
--   aaaaaaaa-aaaa-aaaa-aaaa-000000000001  → Director (Alex Monteiro)
--   bbbbbbbb-bbbb-bbbb-bbbb-000000000001  → Head Coach (Priya Sharma)
--   cccccccc-cccc-cccc-cccc-000000000001  → Coach (David Chen)
--   dddddddd-dddd-dddd-dddd-000000000001  → Coach (Lena Vogel)
--   eeeeeeee-eeee-eeee-eeee-000000000001  → Parent (Marie Fontaine / Isabelle's guardian)
--   ffffffff-ffff-ffff-ffff-000000000001  → Player (Emma Torres)
--
-- UUID NAMESPACE:
--   Position-4 = 0001 (Angles Academy uses 0000 — no collision)
--
-- FULL EXECUTION GUIDE: docs/BRIAN_DABUL_DEMO_SEED_EXECUTION_PACKET.md
-- ============================================================

-- ============================================================
-- SECTION 1 — ACADEMY, LEVELS, GROUPS, PLAYERS
-- No auth.users dependency. Safe to run first.
-- ============================================================

-- ACADEMY
INSERT INTO academies (id, name, slug, country, timezone, settings) VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Monteiro Tennis Academy',
  'monteiro-tennis',
  'US',
  'America/Chicago',
  jsonb_build_object('level_count', 5, 'currency', 'USD', 'demo', true)
) ON CONFLICT (id) DO NOTHING;

-- ACADEMY LEVELS
INSERT INTO academy_levels (id, academy_id, level_number, label, description, track, sort_order) VALUES
  ('00000000-0000-0001-0001-000000000001', '00000000-0000-0000-0001-000000000001', 1, 'Foundation',  'Level 1 — beginners', 'skill', 10),
  ('00000000-0000-0001-0001-000000000002', '00000000-0000-0000-0001-000000000001', 2, 'Building',    'Level 2 — developing foundations', 'skill', 20),
  ('00000000-0000-0001-0001-000000000003', '00000000-0000-0000-0001-000000000001', 3, 'Developing',  'Level 3 — intermediate', 'skill', 30),
  ('00000000-0000-0001-0001-000000000004', '00000000-0000-0000-0001-000000000001', 4, 'Competitive', 'Level 4 — competitive juniors', 'competition', 40),
  ('00000000-0000-0001-0001-000000000005', '00000000-0000-0000-0001-000000000001', 5, 'Elite',       'Level 5 — top competitive players', 'competition', 50)
ON CONFLICT (id) DO NOTHING;

-- GROUPS
INSERT INTO groups (id, academy_id, name, description, track, max_players) VALUES
  ('00000000-0000-0002-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Advanced',     'Level 4–5 competitive players', 'competition', 8),
  ('00000000-0000-0002-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'Intermediate', 'Level 3 developing players', 'skill', 10),
  ('00000000-0000-0002-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'Beginner',     'Level 1–2 foundation players', 'skill', 12)
ON CONFLICT (id) DO NOTHING;

-- PLAYERS (15 fictional — profile_id NULL for most)
INSERT INTO players (id, academy_id, first_name, last_name, date_of_birth, status, current_group_id, current_level_id, join_date) VALUES
  ('00000000-0000-0005-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Marcus',   'Rivera',   '2010-03-12', 'active',            '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'Sofia',    'Nakamura', '2009-07-18', 'active',            '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000005', '2023-01-10'),
  ('00000000-0000-0005-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'James',    'Whitfield','2010-11-02', 'active',            '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-02-15'),
  ('00000000-0000-0005-0001-000000000004', '00000000-0000-0000-0001-000000000001', 'Amara',    'Osei',     '2011-05-25', 'active',            '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-06-01'),
  ('00000000-0000-0005-0001-000000000005', '00000000-0000-0000-0001-000000000001', 'Liam',     'Petrov',   '2012-01-30', 'active',            '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000006', '00000000-0000-0000-0001-000000000001', 'Chloe',    'Martinez', '2011-09-14', 'active',            '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-03-01'),
  ('00000000-0000-0005-0001-000000000007', '00000000-0000-0000-0001-000000000001', 'Noah',     'Andersen', '2012-04-08', 'active',            '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2026-04-15'),
  ('00000000-0000-0005-0001-000000000008', '00000000-0000-0000-0001-000000000001', 'Isabelle', 'Fontaine', '2012-06-22', 'active',            '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000009', '00000000-0000-0000-0001-000000000001', 'Raj',      'Krishnan', '2011-12-05', 'active',            '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-07-01'),
  ('00000000-0000-0005-0001-000000000010', '00000000-0000-0000-0001-000000000001', 'Emma',     'Torres',   '2013-02-17', 'active',            '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-09-01'),
  ('00000000-0000-0005-0001-000000000011', '00000000-0000-0000-0001-000000000001', 'Finn',     'O''Brien', '2014-08-10', 'active',            '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000001', '2026-04-01'),
  ('00000000-0000-0005-0001-000000000012', '00000000-0000-0000-0001-000000000001', 'Zara',     'Ahmed',    '2013-10-28', 'active',            '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-01-15'),
  ('00000000-0000-0005-0001-000000000013', '00000000-0000-0000-0001-000000000001', 'Miles',    'Cooper',   '2014-03-19', 'pending_placement', NULL,                                  NULL,                                  '2026-05-01'),
  ('00000000-0000-0005-0001-000000000014', '00000000-0000-0000-0001-000000000001', 'Leila',    'Hassan',   '2013-07-04', 'active',            '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-06-01'),
  ('00000000-0000-0005-0001-000000000015', '00000000-0000-0000-0001-000000000001', 'Sam',      'Park',     '2014-01-11', 'pending_placement', NULL,                                  NULL,                                  '2026-05-10')
ON CONFLICT (id) DO NOTHING;

-- GROUP MEMBERSHIPS
INSERT INTO group_memberships (academy_id, player_id, group_id, is_current) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000001', '00000000-0000-0002-0001-000000000001', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000002', '00000000-0000-0002-0001-000000000001', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000003', '00000000-0000-0002-0001-000000000001', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000004', '00000000-0000-0002-0001-000000000001', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000005', '00000000-0000-0002-0001-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000006', '00000000-0000-0002-0001-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000007', '00000000-0000-0002-0001-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000008', '00000000-0000-0002-0001-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000009', '00000000-0000-0002-0001-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000010', '00000000-0000-0002-0001-000000000003', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000011', '00000000-0000-0002-0001-000000000003', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000012', '00000000-0000-0002-0001-000000000003', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000014', '00000000-0000-0002-0001-000000000003', true)
ON CONFLICT DO NOTHING;

-- GUARDIANS
INSERT INTO guardians (id, academy_id, first_name, last_name, email, relationship, is_primary) VALUES
  ('00000000-0000-0006-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Marie',  'Fontaine', 'parent.fontaine@monteiro.demo', 'parent', true),
  ('00000000-0000-0006-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'Carlos', 'Ahmed',    'parent.ahmed@monteiro.demo',    'parent', true),
  ('00000000-0000-0006-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'Linda',  'Torres',   'parent.torres@monteiro.demo',   'parent', true)
ON CONFLICT (id) DO NOTHING;

-- PLAYER-GUARDIAN LINKS
INSERT INTO player_guardians (player_id, guardian_id) VALUES
  ('00000000-0000-0005-0001-000000000008', '00000000-0000-0006-0001-000000000001'),
  ('00000000-0000-0005-0001-000000000012', '00000000-0000-0006-0001-000000000002'),
  ('00000000-0000-0005-0001-000000000010', '00000000-0000-0006-0001-000000000003')
ON CONFLICT DO NOTHING;

-- PLAYER CURRICULUM STATES
-- Maps players to global curriculum_levels via stage+level_number subquery.
-- Requires migration 053 (curriculum_seed) to be applied.
INSERT INTO player_curriculum_states (player_id, academy_id, current_level_id, advancement_eligible, notes)
SELECT p.player_id, '00000000-0000-0000-0001-000000000001', cl.id, p.adv, p.notes
FROM (VALUES
  ('00000000-0000-0005-0001-000000000001', 'yellow_competitive',  1, true,  'Serve mechanics strong — advancement proposal pending'),
  ('00000000-0000-0005-0001-000000000002', 'high_performance',    1, false, 'Top player in academy'),
  ('00000000-0000-0005-0001-000000000003', 'yellow_competitive',  1, false, 'Attendance concern — 3 absences'),
  ('00000000-0000-0005-0001-000000000004', 'yellow_competitive',  1, false, 'Reassessment pending'),
  ('00000000-0000-0005-0001-000000000005', 'green_performance',   1, false, 'Forehand consistency stalled'),
  ('00000000-0000-0005-0001-000000000006', 'green_performance',   1, false, 'Near Level 4 threshold'),
  ('00000000-0000-0005-0001-000000000007', 'green_performance',   1, false, 'New — 4 weeks'),
  ('00000000-0000-0005-0001-000000000008', 'green_performance',   1, false, 'Active parent engagement'),
  ('00000000-0000-0005-0001-000000000009', 'green_performance',   1, false, 'Missed last assessment'),
  ('00000000-0000-0005-0001-000000000010', 'orange_development',  1, false, 'Ready to move to Intermediate — 2 gates open'),
  ('00000000-0000-0005-0001-000000000012', 'orange_development',  1, false, 'Parental concern flagged'),
  ('00000000-0000-0005-0001-000000000014', 'orange_development',  1, false, 'Strong attitude — coachability noted')
) AS p(player_id, stage, level_number, adv, notes)
JOIN curriculum_levels cl ON cl.stage = p.stage::curriculum_stage AND cl.level_number = p.level_number
ON CONFLICT (player_id, academy_id) DO NOTHING;

-- ============================================================
-- SECTION 3 — PROFILES + MEMBERSHIPS + COACH ASSIGNMENTS
-- REQUIRES: real auth.users UUIDs substituted for placeholders.
-- ============================================================

INSERT INTO profiles (id, academy_id, display_name, email, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '00000000-0000-0000-0001-000000000001', 'Alex Monteiro',     'alex@monteirotennis.demo',      true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach Priya Sharma','priya@monteirotennis.demo',     true),
  ('cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach David Chen',  'david@monteirotennis.demo',     true),
  ('dddddddd-dddd-dddd-dddd-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach Lena Vogel',  'lena@monteirotennis.demo',      true),
  ('eeeeeeee-eeee-eeee-eeee-000000000001', '00000000-0000-0000-0001-000000000001', 'Marie Fontaine',    'parent.fontaine@monteiro.demo', true),
  ('ffffffff-ffff-ffff-ffff-000000000001', '00000000-0000-0000-0001-000000000001', 'Emma Torres',       'emma@monteiro.demo',            true)
ON CONFLICT (id) DO NOTHING;

UPDATE players SET profile_id = 'ffffffff-ffff-ffff-ffff-000000000001' WHERE id = '00000000-0000-0005-0001-000000000010';
UPDATE guardians SET profile_id = 'eeeeeeee-eeee-eeee-eeee-000000000001' WHERE id = '00000000-0000-0006-0001-000000000001';

INSERT INTO academy_memberships (academy_id, profile_id, role, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'academy_director', true),
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach',       true),
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'coach',            true),
  ('00000000-0000-0000-0001-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', 'coach',            true),
  ('00000000-0000-0000-0001-000000000001', 'eeeeeeee-eeee-eeee-eeee-000000000001', 'parent',           true),
  ('00000000-0000-0000-0001-000000000001', 'ffffffff-ffff-ffff-ffff-000000000001', 'player',           true)
ON CONFLICT (academy_id, profile_id) DO NOTHING;

INSERT INTO coach_group_assignments (academy_id, coach_id, group_id, role, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0002-0001-000000000001', 'lead',      true),
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0002-0001-000000000002', 'lead',      true),
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0002-0001-000000000002', 'assistant', true),
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0002-0001-000000000003', 'lead',      true),
  ('00000000-0000-0000-0001-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', '00000000-0000-0002-0001-000000000003', 'assistant', true)
ON CONFLICT (coach_id, group_id) DO NOTHING;

-- ============================================================
-- SECTION 4 — SESSIONS + ATTENDANCE
-- REQUIRES: coach profile UUIDs substituted.
-- ============================================================

INSERT INTO sessions (id, academy_id, group_id, coach_id, name, scheduled_date, status) VALUES
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0002-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'Advanced Wednesday',    '2026-05-21', 'completed'),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0002-0001-000000000002', 'cccccccc-cccc-cccc-cccc-000000000001', 'Intermediate Thursday', '2026-05-22', 'completed'),
  ('00000000-0000-0007-0001-000000000003', '00000000-0000-0000-0001-000000000001', '00000000-0000-0002-0001-000000000003', 'dddddddd-dddd-dddd-dddd-000000000001', 'Beginner Friday',       '2026-05-23', 'planned')
ON CONFLICT (id) DO NOTHING;

INSERT INTO session_attendance (session_id, player_id, status, notes) VALUES
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000001', 'present', NULL),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000002', 'present', NULL),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000003', 'absent',  '3rd absence this month'),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000004', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000005', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000006', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000007', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000008', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000009', 'late',    'Arrived 10 min late')
ON CONFLICT (session_id, player_id) DO NOTHING;

-- ============================================================
-- SECTION 5 — COACH OBSERVATIONS
-- REQUIRES: coach profile UUIDs substituted.
-- ============================================================

INSERT INTO coach_observations (academy_id, player_id, coach_id, session_id, observation_type, content, is_private) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0007-0001-000000000001',
   'positive', 'Marcus serve mechanics are excellent this week — toss placement is consistent. Flag for advancement consideration.', false),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000006', 'cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0007-0001-000000000002',
   'positive', 'Chloe backhand cross-court showed significant improvement today. Consistent depth and direction.', false),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0007-0001-000000000001',
   'concern', 'INTERNAL: James has now missed 3 sessions this month. Recommend director review. Parent has not responded to last outreach.', true);

-- ============================================================
-- SECTION 6 — VOICE COMMANDS (FK PREREQ FOR PROPOSED ACTIONS)
-- CRITICAL: Must run before Section 7.
-- REQUIRES: coach profile UUIDs substituted.
-- ============================================================

INSERT INTO voice_commands (id, academy_id, issuer_id, issuer_role, input_method, raw_input, processing_status) VALUES
  ('00000000-0000-0008-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach', 'typed', 'Submit Wednesday Advanced session wrap-up.', 'normalized'),
  ('00000000-0000-0008-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach', 'typed', 'Flag James Whitfield attendance concern — 3 absences this month.', 'normalized'),
  ('00000000-0000-0008-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach', 'typed', 'Propose Marcus Rivera advancement from Level 4 to Level 5.', 'normalized'),
  ('00000000-0000-0008-0001-000000000004', '00000000-0000-0000-0001-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', 'coach',      'typed', 'Draft parent-safe update for Zara Ahmed development focus.', 'normalized'),
  ('00000000-0000-0008-0001-000000000005', '00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'coach',      'typed', 'Observation for Chloe Martinez — strong backhand improvement.', 'normalized')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 7 — PROPOSED ACTIONS (REVIEW QUEUE)
-- REQUIRES: Sections 3 and 6 complete.
-- ============================================================

INSERT INTO proposed_actions (
  id, academy_id, voice_command_id, proposed_by_id,
  action_type, action_label, target_module, target_object_id,
  proposed_payload, risk_level, status, expires_at
) VALUES
  ('00000000-0000-0009-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'other', 'Session Recap — Wednesday Advanced Group',
   'sessions', '00000000-0000-0007-0001-000000000001',
   '{"session_name":"Advanced Wednesday","date":"2026-05-21","attendance":{"present":3,"absent":1},"highlights":"Marcus serve mechanics strong. James absent (3rd this month)."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days'),

  ('00000000-0000-0009-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'flag_player', 'Attendance Concern — James Whitfield (3 absences this month)',
   'players', '00000000-0000-0005-0001-000000000003',
   '{"player_name":"James Whitfield","absences_this_month":3,"concern_level":"high","recommended_action":"Director outreach to parent"}'::JSONB,
   'medium', 'pending_review', NOW() + INTERVAL '7 days'),

  ('00000000-0000-0009-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'move_player_group', 'Advancement Proposal — Marcus Rivera Level 4 to Level 5',
   'players', '00000000-0000-0005-0001-000000000001',
   '{"player_name":"Marcus Rivera","current_level":"Level 4 — Competitive","proposed_level":"Level 5 — Elite","rationale":"Serve mechanics consistently excellent. Meets advancement gate criteria."}'::JSONB,
   'high', 'pending_review', NOW() + INTERVAL '7 days'),

  ('00000000-0000-0009-0001-000000000004', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000004', 'dddddddd-dddd-dddd-dddd-000000000001',
   'generate_parent_update', 'Parent-Safe Communication Draft — Zara Ahmed',
   'players', '00000000-0000-0005-0001-000000000012',
   '{"player_name":"Zara Ahmed","draft_content":"Zara has been working hard on her fundamentals. Her footwork has shown improvement over the past few weeks.","coach_internal_note":"INTERNAL: Parent concern re: attitude — draft above is parent-safe version."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days'),

  ('00000000-0000-0009-0001-000000000005', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000005', 'cccccccc-cccc-cccc-cccc-000000000001',
   'other', 'Coach Observation — Chloe Martinez Backhand Improvement',
   'players', '00000000-0000-0005-0001-000000000006',
   '{"player_name":"Chloe Martinez","observation_type":"positive","content":"Chloe backhand cross-court showed significant improvement today."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SECTION 8 — PLAYER DEVELOPMENT SUMMARIES + PRIORITIES
-- REQUIRES: director profile UUID substituted.
-- ============================================================

INSERT INTO player_development_summary (academy_id, player_id, created_by, coach_summary, student_friendly_summary, parent_summary, show_to_student, show_to_parent, source)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000008',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
   'INTERNAL: Isabelle working well technically. Serve mechanics improved. Parent engagement strong.',
   'Keep working on your serve mechanics — you are making great progress!',
   'Isabelle has been working on serve mechanics and footwork. Her consistency has improved significantly over the past 4 weeks.',
   true, true, 'coach_generated'),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000010',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
   'INTERNAL: Emma is ready to move to Intermediate. Two gates remain open.',
   'Keep working on your backhand cross-court. You are 70% of the way to Level 3!',
   NULL,
   true, false, 'coach_generated')
ON CONFLICT (player_id) DO NOTHING;

INSERT INTO player_priorities (academy_id, player_id, category, title, description, priority_rank, priority_level, urgency, confidence_score, source_signal_ids)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000001',
   'promotion_readiness', 'Advancement to Level 5 — pending director approval',
   'Coach Priya has proposed advancement. Serve mechanics meet Level 5 gate criteria.',
   1, 'high', 'high', 0.92, ARRAY[]::UUID[]),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000008',
   'technical_skill', 'Serve consistency',
   'Working on consistent toss placement and follow-through.',
   1, 'medium', 'normal', 0.85, ARRAY[]::UUID[]),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0005-0001-000000000010',
   'technical_skill', 'Backhand cross-court threshold',
   'Consistent backhand cross-court depth needed for Level 3 gate.',
   1, 'medium', 'normal', 0.88, ARRAY[]::UUID[]);

-- ============================================================
-- ROLLBACK — Remove all Monteiro demo data (reverse FK order)
-- ============================================================
-- DELETE FROM player_priorities         WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM player_development_summary WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM player_curriculum_states   WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM proposed_actions           WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM voice_commands             WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM coach_observations         WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM session_attendance         WHERE session_id IN (SELECT id FROM sessions WHERE academy_id = '00000000-0000-0000-0001-000000000001');
-- DELETE FROM sessions                   WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM coach_group_assignments    WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM academy_memberships        WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM player_guardians           WHERE player_id  IN (SELECT id FROM players WHERE academy_id = '00000000-0000-0000-0001-000000000001');
-- DELETE FROM group_memberships          WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM guardians                  WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM players                    WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM profiles                   WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM groups                     WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM academy_levels             WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- DELETE FROM academies                  WHERE id         = '00000000-0000-0000-0001-000000000001';
-- Then delete auth users manually in Supabase dashboard.
