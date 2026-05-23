# Brian Dabul Demo Seed — Execution Packet
## Sprint 681 — Manual SQL Execution (Supabase SQL Editor Only)

**Date:** 2026-05-23
**Scope:** Fictional demo data for Monteiro Tennis Academy — Brian Dabul demo session.
**Safety class:** DEMO ONLY — fictional names, no real child data, no real PII.
**Execution gate:** DO NOT RUN until explicitly instructed. See Phase 2 stop gate at the bottom.

---

## ⛔ SAFETY WARNINGS — READ BEFORE ANYTHING ELSE

- **Do not run against the live production remote (`dbjjhhxdkpdreytsozlq`) unless you have confirmed this is the target.**
- **Do not delete or truncate existing data.** All inserts use `ON CONFLICT DO NOTHING`.
- **Do not run all sections at once.** Paste one section at a time into the SQL Editor.
- **Do not skip the pre-flight verification (Section 0).**
- **Sections 3–9 require real auth.users UUIDs.** Do not run them until you have completed the UUID Substitution Checklist.
- This packet creates **no schema changes, no migrations, no RLS modifications.**
- All data is fictional. No real parent or child PII is included.

---

## Preliminary Audit Answers

These answer the 8 preliminary questions raised before this packet was written.

| # | Question | Answer |
|---|---|---|
| 1 | Does an executable Monteiro seed exist? | No. `024_seed_data.sql` seeds Angles Academy. Sprint 676 is documentation only. |
| 2 | Seed file convention? | Sprint 398 pattern: SQL in `.md` packet, run section-by-section in SQL Editor. |
| 3 | Tables needed? | 17 tables — split across auth-independent (Sections 1–2) and auth-dependent (Sections 3–9). |
| 4 | Current migration version? | 068. Sprint 676 referenced "001–038" — this is outdated. |
| 5 | Linked environment? | Live remote `dbjjhhxdkpdreytsozlq`. Must be explicitly confirmed before running. |
| 6 | Safest delivery? | Sprint 398 pattern. Manual sections, verification queries between each. |
| 7 | FK blockers? | (a) `proposed_actions.voice_command_id NOT NULL` — voice_commands must be seeded first. (b) `profiles.id` must be a real `auth.users` UUID. (c) `sessions.coach_id NOT NULL` requires profiles. |
| 8 | UUID pattern? | 4-zero stable UUIDs with `0001` in position 4 to namespace Monteiro away from Angles. |

---

## What This Packet Creates

| Data | Count | Notes |
|---|---|---|
| Academy | 1 | Monteiro Tennis Academy |
| Curriculum levels (academy) | 5 | Foundation → Elite |
| Groups | 3 | Advanced, Intermediate, Beginner |
| Players | 15 | All fictional — no real children |
| Group memberships | 15 | One per player |
| Guardians | 3 | Fictional parent records |
| Player-guardian links | 3 | One per guardian |
| Auth user accounts | 6 | Created manually (not SQL) — director, 3 coaches, 1 parent, 1 player |
| Profiles | 6 | Requires auth UUIDs |
| Academy memberships | 6 | One per profile |
| Coach-group assignments | 5 | Priya → 2 groups, David → 2 groups, Lena → 1 group |
| Sessions | 3 | Past, past, today |
| Session attendance | 15 | Sample records per session |
| Voice commands | 5 | FK prereq for review queue |
| Review queue items | 5 | Proposed actions in `pending_review` |
| Coach observations | 3 | Sample observations |
| Player curriculum states | 15 | Links players to curriculum levels |
| Player development summaries | 2 | Isabelle (parent-visible), Emma (player-visible) |
| Player priorities | 3 | Marcus, Isabelle, Emma |

---

## Prerequisites

Before running any SQL:

1. **Schema migrations 001–068 must be applied** to the target database. (Sprint 676 referenced 001–038 — this is outdated by 30 migrations. Migrations through 068 are required.)
2. **No existing Monteiro Tennis Academy record.** Run the pre-flight check in Section 0.
3. **Auth user accounts created** before running Sections 3–9. See Section 2.

---

## UUID Substitution Checklist

Fill this out after completing Section 2 (auth user creation). Replace placeholder UUIDs in Sections 3–9 with the real auth.users UUIDs from your Supabase dashboard.

| Role | Email | Placeholder UUID | Real UUID (fill in) |
|---|---|---|---|
| Director | alex@monteirotennis.demo | `aaaaaaaa-aaaa-aaaa-aaaa-000000000001` | _______________ |
| Head Coach (Priya) | priya@monteirotennis.demo | `bbbbbbbb-bbbb-bbbb-bbbb-000000000001` | _______________ |
| Coach (David) | david@monteirotennis.demo | `cccccccc-cccc-cccc-cccc-000000000001` | _______________ |
| Coach (Lena) | lena@monteirotennis.demo | `dddddddd-dddd-dddd-dddd-000000000001` | _______________ |
| Parent (Isabelle's guardian) | parent.fontaine@monteiro.demo | `eeeeeeee-eeee-eeee-eeee-000000000001` | _______________ |
| Player (Emma Torres) | emma@monteiro.demo | `ffffffff-ffff-ffff-ffff-000000000001` | _______________ |

> All SQL in Sections 3–9 uses the placeholder UUIDs above. Before running those sections, do a find-and-replace in each block (or use the companion SQL file `supabase/seeds/brian_dabul_demo_seed.sql` and substitute with `sed`).

---

## Section 0 — Pre-Flight Verification

Run this block first. Review results before proceeding.

```sql
-- PRE-FLIGHT: Confirm target and check for existing Monteiro data.
-- Expected: academy count = 0 (no Monteiro record yet).
-- If count = 1, this seed was already applied — do not re-run Sections 1–2.

SELECT
  'existing_monteiro_record' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) = 0 THEN 'OK — safe to seed' ELSE 'STOP — already seeded' END AS result
FROM academies
WHERE slug = 'monteiro-tennis';

-- Check migration depth — must be 068 or higher.
SELECT
  'migration_depth' AS check_name,
  MAX(migration) AS latest_migration
FROM database_changelog;

-- Check that curriculum_levels are seeded (required for player_curriculum_states).
SELECT
  'curriculum_levels' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'STOP — curriculum_levels not seeded (need migration 053)' END AS result
FROM curriculum_levels;
```

---

## Section 1 — Academy, Levels, Groups, Players

No auth.users dependency. Safe to run on a fresh database as long as migrations 001–068 are applied.

All inserts use `ON CONFLICT DO NOTHING` — safe to re-run.

```sql
-- ============================================================
-- MONTEIRO TENNIS ACADEMY — DEMO SEED
-- FICTIONAL DATA ONLY. No real children. No real PII.
-- UUID namespace: position-4 = 0001 (Angles uses 0000).
-- ============================================================

-- ACADEMY
INSERT INTO academies (id, name, slug, country, timezone, settings) VALUES (
  '00000000-0000-0000-0001-000000000001',
  'Monteiro Tennis Academy',
  'monteiro-tennis',
  'US',
  'America/Chicago',
  jsonb_build_object(
    'level_count', 5,
    'currency', 'USD',
    'demo', true
  )
) ON CONFLICT (id) DO NOTHING;

-- ACADEMY LEVELS (5 levels per Sprint 676 spec)
INSERT INTO academy_levels (id, academy_id, level_number, label, description, track, sort_order) VALUES
  ('00000000-0000-0001-0001-000000000001', '00000000-0000-0000-0001-000000000001', 1, 'Foundation',   'Level 1 — beginners, first-year players', 'skill', 10),
  ('00000000-0000-0001-0001-000000000002', '00000000-0000-0000-0001-000000000001', 2, 'Building',     'Level 2 — developing foundations', 'skill', 20),
  ('00000000-0000-0001-0001-000000000003', '00000000-0000-0000-0001-000000000001', 3, 'Developing',   'Level 3 — intermediate players', 'skill', 30),
  ('00000000-0000-0001-0001-000000000004', '00000000-0000-0000-0001-000000000001', 4, 'Competitive',  'Level 4 — competitive juniors', 'competition', 40),
  ('00000000-0000-0001-0001-000000000005', '00000000-0000-0000-0001-000000000001', 5, 'Elite',        'Level 5 — top competitive players', 'competition', 50)
ON CONFLICT (id) DO NOTHING;

-- GROUPS (3 groups per Sprint 676 spec)
INSERT INTO groups (id, academy_id, name, description, track, max_players) VALUES
  ('00000000-0000-0002-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Advanced',     'Level 4–5 competitive players', 'competition', 8),
  ('00000000-0000-0002-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'Intermediate', 'Level 3 developing players', 'skill', 10),
  ('00000000-0000-0002-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'Beginner',     'Level 1–2 foundation players', 'skill', 12)
ON CONFLICT (id) DO NOTHING;

-- PLAYERS — 15 fictional players
-- profile_id NULL for most (no auth needed for read-only demo)
-- profile_id set for Emma Torres (ffffffff-...) — player portal demo requires login
INSERT INTO players (
  id, academy_id, first_name, last_name, date_of_birth,
  status, current_group_id, current_level_id, join_date
) VALUES
  -- Advanced Group (Level 4–5)
  ('00000000-0000-0005-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   'Marcus',   'Rivera',   '2010-03-12', 'active',
   '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   'Sofia',    'Nakamura', '2009-07-18', 'active',
   '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000005', '2023-01-10'),
  ('00000000-0000-0005-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   'James',    'Whitfield','2010-11-02', 'active',
   '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-02-15'),
  ('00000000-0000-0005-0001-000000000004', '00000000-0000-0000-0001-000000000001',
   'Amara',    'Osei',     '2011-05-25', 'active',
   '00000000-0000-0002-0001-000000000001', '00000000-0000-0001-0001-000000000004', '2024-06-01'),
  -- Intermediate Group (Level 3)
  ('00000000-0000-0005-0001-000000000005', '00000000-0000-0000-0001-000000000001',
   'Liam',     'Petrov',   '2012-01-30', 'active',
   '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000006', '00000000-0000-0000-0001-000000000001',
   'Chloe',    'Martinez', '2011-09-14', 'active',
   '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-03-01'),
  ('00000000-0000-0005-0001-000000000007', '00000000-0000-0000-0001-000000000001',
   'Noah',     'Andersen', '2012-04-08', 'active',
   '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2026-04-15'),
  ('00000000-0000-0005-0001-000000000008', '00000000-0000-0000-0001-000000000001',
   'Isabelle', 'Fontaine', '2012-06-22', 'active',
   '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-09-01'),
  ('00000000-0000-0005-0001-000000000009', '00000000-0000-0000-0001-000000000001',
   'Raj',      'Krishnan', '2011-12-05', 'active',
   '00000000-0000-0002-0001-000000000002', '00000000-0000-0001-0001-000000000003', '2024-07-01'),
  -- Beginner Group (Level 1–2)
  ('00000000-0000-0005-0001-000000000010', '00000000-0000-0000-0001-000000000001',
   'Emma',     'Torres',   '2013-02-17', 'active',
   '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-09-01'),
  ('00000000-0000-0005-0001-000000000011', '00000000-0000-0000-0001-000000000001',
   'Finn',     'O''Brien', '2014-08-10', 'active',
   '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000001', '2026-04-01'),
  ('00000000-0000-0005-0001-000000000012', '00000000-0000-0000-0001-000000000001',
   'Zara',     'Ahmed',    '2013-10-28', 'active',
   '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-01-15'),
  ('00000000-0000-0005-0001-000000000013', '00000000-0000-0000-0001-000000000001',
   'Miles',    'Cooper',   '2014-03-19', 'pending_placement',
   NULL, NULL, '2026-05-01'),
  ('00000000-0000-0005-0001-000000000014', '00000000-0000-0000-0001-000000000001',
   'Leila',    'Hassan',   '2013-07-04', 'active',
   '00000000-0000-0002-0001-000000000003', '00000000-0000-0001-0001-000000000002', '2025-06-01'),
  ('00000000-0000-0005-0001-000000000015', '00000000-0000-0000-0001-000000000001',
   'Sam',      'Park',     '2014-01-11', 'pending_placement',
   NULL, NULL, '2026-05-10')
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

-- GUARDIANS (3 fictional parent records — no real PII)
INSERT INTO guardians (id, academy_id, first_name, last_name, email, relationship, is_primary) VALUES
  ('00000000-0000-0006-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   'Marie', 'Fontaine', 'parent.fontaine@monteiro.demo', 'parent', true),
  ('00000000-0000-0006-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   'Carlos', 'Ahmed', 'parent.ahmed@monteiro.demo', 'parent', true),
  ('00000000-0000-0006-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   'Linda', 'Torres', 'parent.torres@monteiro.demo', 'parent', true)
ON CONFLICT (id) DO NOTHING;

-- PLAYER-GUARDIAN LINKS
INSERT INTO player_guardians (player_id, guardian_id) VALUES
  ('00000000-0000-0005-0001-000000000008', '00000000-0000-0006-0001-000000000001'), -- Isabelle → Marie Fontaine
  ('00000000-0000-0005-0001-000000000012', '00000000-0000-0006-0001-000000000002'), -- Zara → Carlos Ahmed
  ('00000000-0000-0005-0001-000000000010', '00000000-0000-0006-0001-000000000003')  -- Emma → Linda Torres
ON CONFLICT DO NOTHING;

-- PLAYER CURRICULUM STATES
-- Maps each player to their curriculum_level (global table, seeded in migration 053)
-- Level mapping: Foundation=red_foundation/1, Building=orange_development/1,
--   Developing=green_performance/1, Competitive=yellow_competitive/1, Elite=high_performance/1
INSERT INTO player_curriculum_states (player_id, academy_id, current_level_id, advancement_eligible, notes)
SELECT
  p.player_id,
  '00000000-0000-0000-0001-000000000001',
  cl.id,
  p.advancement_eligible,
  p.notes
FROM (VALUES
  ('00000000-0000-0005-0001-000000000001', 'yellow_competitive',  1, true,  'Serve mechanics strong — advancement proposal pending'),
  ('00000000-0000-0005-0001-000000000002', 'high_performance',    1, false, 'Top player in academy'),
  ('00000000-0000-0005-0001-000000000003', 'yellow_competitive',  1, false, 'Attendance concern — 3 absences'),
  ('00000000-0000-0005-0001-000000000004', 'yellow_competitive',  1, false, 'Reassessment pending'),
  ('00000000-0000-0005-0001-000000000005', 'green_performance',   1, false, 'Forehand consistency stalled'),
  ('00000000-0000-0005-0001-000000000006', 'green_performance',   1, false, 'Near Level 4 threshold'),
  ('00000000-0000-0005-0001-000000000007', 'green_performance',   1, false, 'New to academy — 4 weeks'),
  ('00000000-0000-0005-0001-000000000008', 'green_performance',   1, false, 'Active parent engagement'),
  ('00000000-0000-0005-0001-000000000009', 'green_performance',   1, false, 'Missed last assessment'),
  ('00000000-0000-0005-0001-000000000010', 'orange_development',  1, false, 'Ready to move to Intermediate — 2 gates open'),
  ('00000000-0000-0005-0001-000000000012', 'orange_development',  1, false, 'Parental concern flagged'),
  ('00000000-0000-0005-0001-000000000014', 'orange_development',  1, false, 'Strong attitude — coachability noted')
) AS p(player_id, stage, level_number, advancement_eligible, notes)
JOIN curriculum_levels cl
  ON cl.stage = p.stage::curriculum_stage
  AND cl.level_number = p.level_number
ON CONFLICT (player_id, academy_id) DO NOTHING;
```

**Verification — Section 1:**

```sql
SELECT 'academy' AS table_name, COUNT(*) FROM academies WHERE slug = 'monteiro-tennis'
UNION ALL
SELECT 'academy_levels', COUNT(*) FROM academy_levels WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'groups', COUNT(*) FROM groups WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'players', COUNT(*) FROM players WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'group_memberships', COUNT(*) FROM group_memberships WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'guardians', COUNT(*) FROM guardians WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'player_curriculum_states', COUNT(*) FROM player_curriculum_states WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- Expected: 1, 5, 3, 15, 13, 3, 12
```

---

## Section 2 — Auth User Creation (Manual Step)

**This section is a manual step in the Supabase dashboard — no SQL to run here.**

1. Open **Supabase Dashboard** → your target project → **Authentication** → **Users**
2. Create 6 users with email+password. Use demo passwords (e.g., `Demo2026!`):

| Email | Role in app | Placeholder UUID to replace |
|---|---|---|
| `alex@monteirotennis.demo` | academy_director | `aaaaaaaa-aaaa-aaaa-aaaa-000000000001` |
| `priya@monteirotennis.demo` | head_coach | `bbbbbbbb-bbbb-bbbb-bbbb-000000000001` |
| `david@monteirotennis.demo` | coach | `cccccccc-cccc-cccc-cccc-000000000001` |
| `lena@monteirotennis.demo` | coach | `dddddddd-dddd-dddd-dddd-000000000001` |
| `parent.fontaine@monteiro.demo` | parent | `eeeeeeee-eeee-eeee-eeee-000000000001` |
| `emma@monteiro.demo` | player | `ffffffff-ffff-ffff-ffff-000000000001` |

3. After creation, copy each user's UUID from the dashboard.
4. Fill in the **UUID Substitution Checklist** at the top of this document.
5. In each SQL block below, replace the placeholder UUIDs before pasting.

> **Shortcut for sed substitution** (if using the companion SQL file):
> ```bash
> sed -i \
>   -e 's/aaaaaaaa-aaaa-aaaa-aaaa-000000000001/REAL_DIRECTOR_UUID/g' \
>   -e 's/bbbbbbbb-bbbb-bbbb-bbbb-000000000001/REAL_PRIYA_UUID/g' \
>   -e 's/cccccccc-cccc-cccc-cccc-000000000001/REAL_DAVID_UUID/g' \
>   -e 's/dddddddd-dddd-dddd-dddd-000000000001/REAL_LENA_UUID/g' \
>   -e 's/eeeeeeee-eeee-eeee-eeee-000000000001/REAL_PARENT_UUID/g' \
>   -e 's/ffffffff-ffff-ffff-ffff-000000000001/REAL_EMMA_UUID/g' \
>   supabase/seeds/brian_dabul_demo_seed.sql
> ```

---

## Section 3 — Profiles + Academy Memberships + Coach-Group Assignments

**Requires real auth.users UUIDs from Section 2. Substitute before pasting.**

Placeholder UUIDs to replace:
- `aaaaaaaa-aaaa-aaaa-aaaa-000000000001` → Director Alex
- `bbbbbbbb-bbbb-bbbb-bbbb-000000000001` → Coach Priya
- `cccccccc-cccc-cccc-cccc-000000000001` → Coach David
- `dddddddd-dddd-dddd-dddd-000000000001` → Coach Lena
- `eeeeeeee-eeee-eeee-eeee-000000000001` → Parent Isabelle
- `ffffffff-ffff-ffff-ffff-000000000001` → Player Emma

```sql
-- PROFILES (6 accounts — substitute real auth.users UUIDs before running)
INSERT INTO profiles (id, academy_id, display_name, email, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '00000000-0000-0000-0001-000000000001', 'Alex Monteiro',    'alex@monteirotennis.demo',            true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach Priya Sharma','priya@monteirotennis.demo',           true),
  ('cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach David Chen',  'david@monteirotennis.demo',           true),
  ('dddddddd-dddd-dddd-dddd-000000000001', '00000000-0000-0000-0001-000000000001', 'Coach Lena Vogel',  'lena@monteirotennis.demo',            true),
  ('eeeeeeee-eeee-eeee-eeee-000000000001', '00000000-0000-0000-0001-000000000001', 'Marie Fontaine',    'parent.fontaine@monteiro.demo',       true),
  ('ffffffff-ffff-ffff-ffff-000000000001', '00000000-0000-0000-0001-000000000001', 'Emma Torres',       'emma@monteiro.demo',                  true)
ON CONFLICT (id) DO NOTHING;

-- Link Emma Torres player record to her profile
UPDATE players
SET profile_id = 'ffffffff-ffff-ffff-ffff-000000000001'
WHERE id = '00000000-0000-0005-0001-000000000010';

-- Link Isabelle Fontaine guardian record to parent profile
UPDATE guardians
SET profile_id = 'eeeeeeee-eeee-eeee-eeee-000000000001'
WHERE id = '00000000-0000-0006-0001-000000000001';

-- ACADEMY MEMBERSHIPS
INSERT INTO academy_memberships (academy_id, profile_id, role, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'academy_director', true),
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach',       true),
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'coach',            true),
  ('00000000-0000-0000-0001-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', 'coach',            true),
  ('00000000-0000-0000-0001-000000000001', 'eeeeeeee-eeee-eeee-eeee-000000000001', 'parent',           true),
  ('00000000-0000-0000-0001-000000000001', 'ffffffff-ffff-ffff-ffff-000000000001', 'player',           true)
ON CONFLICT (academy_id, profile_id) DO NOTHING;

-- COACH-GROUP ASSIGNMENTS
INSERT INTO coach_group_assignments (academy_id, coach_id, group_id, role, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0002-0001-000000000001', 'lead', true),      -- Priya → Advanced
  ('00000000-0000-0000-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '00000000-0000-0002-0001-000000000002', 'lead', true),      -- Priya → Intermediate
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0002-0001-000000000002', 'assistant', true), -- David → Intermediate
  ('00000000-0000-0000-0001-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', '00000000-0000-0002-0001-000000000003', 'lead', true),      -- David → Beginner
  ('00000000-0000-0000-0001-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', '00000000-0000-0002-0001-000000000003', 'assistant', true)  -- Lena → Beginner
ON CONFLICT (coach_id, group_id) DO NOTHING;
```

**Verification — Section 3:**

```sql
SELECT 'profiles' AS table_name, COUNT(*) FROM profiles WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'academy_memberships', COUNT(*) FROM academy_memberships WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'coach_group_assignments', COUNT(*) FROM coach_group_assignments WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- Expected: 6, 6, 5
```

---

## Section 4 — Sessions + Session Attendance

**Requires coach profile UUIDs. Substitute before pasting.**

```sql
-- SESSIONS (3 sessions per Sprint 676 spec)
-- sessions.coach_id NOT NULL — requires coach profile UUIDs
INSERT INTO sessions (id, academy_id, group_id, coach_id, name, scheduled_date, status) VALUES
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0002-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'Advanced Wednesday', '2026-05-21', 'completed'),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0002-0001-000000000002', 'cccccccc-cccc-cccc-cccc-000000000001',
   'Intermediate Thursday', '2026-05-22', 'completed'),
  ('00000000-0000-0007-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0002-0001-000000000003', 'dddddddd-dddd-dddd-dddd-000000000001',
   'Beginner Friday', '2026-05-23', 'planned')
ON CONFLICT (id) DO NOTHING;

-- SESSION ATTENDANCE — Advanced Wednesday (4 players, James absent)
INSERT INTO session_attendance (session_id, player_id, status, notes) VALUES
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000001', 'present', NULL),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000002', 'present', NULL),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000003', 'absent',  '3rd absence this month'),
  ('00000000-0000-0007-0001-000000000001', '00000000-0000-0005-0001-000000000004', 'present', NULL)
ON CONFLICT (session_id, player_id) DO NOTHING;

-- SESSION ATTENDANCE — Intermediate Thursday (5 players)
INSERT INTO session_attendance (session_id, player_id, status, notes) VALUES
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000005', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000006', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000007', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000008', 'present', NULL),
  ('00000000-0000-0007-0001-000000000002', '00000000-0000-0005-0001-000000000009', 'late',    'Arrived 10 min late')
ON CONFLICT (session_id, player_id) DO NOTHING;
```

**Verification — Section 4:**

```sql
SELECT 'sessions' AS table_name, COUNT(*) FROM sessions WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'session_attendance', COUNT(*) FROM session_attendance
  WHERE session_id IN (
    SELECT id FROM sessions WHERE academy_id = '00000000-0000-0000-0001-000000000001'
  );
-- Expected: 3, 9
```

---

## Section 5 — Coach Observations

**Requires coach profile UUIDs. Substitute before pasting.**

```sql
-- COACH OBSERVATIONS (3 sample observations)
INSERT INTO coach_observations (
  academy_id, player_id, coach_id, session_id,
  observation_type, content, is_private
) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0005-0001-000000000001',  -- Marcus Rivera
   'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',  -- Coach Priya
   '00000000-0000-0007-0001-000000000001',  -- Advanced Wednesday
   'positive',
   'Marcus serve mechanics are excellent this week — toss placement is consistent. Flag for advancement consideration.',
   false),
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0005-0001-000000000006',  -- Chloe Martinez
   'cccccccc-cccc-cccc-cccc-000000000001',  -- Coach David
   '00000000-0000-0007-0001-000000000002',  -- Intermediate Thursday
   'positive',
   'Chloe backhand cross-court showed significant improvement today. Consistent depth and direction.',
   false),
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0005-0001-000000000003',  -- James Whitfield
   'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',  -- Coach Priya
   '00000000-0000-0007-0001-000000000001',  -- Advanced Wednesday
   'concern',
   'INTERNAL: James has now missed 3 sessions this month. Recommend director review. Parent has not responded to last outreach.',
   true);
```

---

## Section 6 — Voice Commands (FK Prerequisite for Review Queue)

**CRITICAL: Run this section before Section 7.**

`proposed_actions.voice_command_id NOT NULL` — the review queue items cannot be inserted without a valid `voice_commands` row. This was not listed in Sprint 676's execution order but is required by the schema.

**Requires coach profile UUIDs. Substitute before pasting.**

```sql
-- VOICE COMMANDS — 5 rows, one per review queue item
-- These represent the raw voice/text inputs that generated each proposed action.
INSERT INTO voice_commands (
  id, academy_id, issuer_id, issuer_role,
  input_method, raw_input, processing_status
) VALUES
  ('00000000-0000-0008-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach',
   'typed', 'Submit Wednesday Advanced session wrap-up.', 'normalized'),
  ('00000000-0000-0008-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach',
   'typed', 'Flag James Whitfield attendance concern — 3 absences this month.', 'normalized'),
  ('00000000-0000-0008-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'head_coach',
   'typed', 'Propose Marcus Rivera advancement from Level 4 to Level 5.', 'normalized'),
  ('00000000-0000-0008-0001-000000000004', '00000000-0000-0000-0001-000000000001',
   'dddddddd-dddd-dddd-dddd-000000000001', 'coach',
   'typed', 'Draft parent-safe update for Zara Ahmed development focus.', 'normalized'),
  ('00000000-0000-0008-0001-000000000005', '00000000-0000-0000-0001-000000000001',
   'cccccccc-cccc-cccc-cccc-000000000001', 'coach',
   'typed', 'Observation for Chloe Martinez — strong backhand improvement.', 'normalized')
ON CONFLICT (id) DO NOTHING;
```

---

## Section 7 — Review Queue (Proposed Actions)

**Requires Sections 3 and 6 to be completed first.**

```sql
-- PROPOSED ACTIONS — 5 review queue items (all pending_review)
-- Note: expires_at set to 7 days from now — extend if running before demo.
INSERT INTO proposed_actions (
  id, academy_id, voice_command_id, proposed_by_id,
  action_type, action_label, target_module, target_object_id,
  proposed_payload, risk_level, status, expires_at
) VALUES
  -- 1. Session recap — Wednesday Advanced
  ('00000000-0000-0009-0001-000000000001', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'other', 'Session Recap — Wednesday Advanced Group',
   'sessions', '00000000-0000-0007-0001-000000000001',
   '{"session_name": "Advanced Wednesday", "date": "2026-05-21", "attendance": {"present": 3, "absent": 1}, "highlights": "Marcus serve mechanics strong. James absent (3rd this month)."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days'),

  -- 2. Attendance exception — James Whitfield
  ('00000000-0000-0009-0001-000000000002', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'flag_player', 'Attendance Concern — James Whitfield (3 absences this month)',
   'players', '00000000-0000-0005-0001-000000000003',
   '{"player_name": "James Whitfield", "absences_this_month": 3, "concern_level": "high", "recommended_action": "Director outreach to parent"}'::JSONB,
   'medium', 'pending_review', NOW() + INTERVAL '7 days'),

  -- 3. Advancement proposal — Marcus Rivera (Level 4 → Level 5)
  ('00000000-0000-0009-0001-000000000003', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
   'move_player_group', 'Advancement Proposal — Marcus Rivera Level 4 to Level 5',
   'players', '00000000-0000-0005-0001-000000000001',
   '{"player_name": "Marcus Rivera", "current_level": "Level 4 — Competitive", "proposed_level": "Level 5 — Elite", "rationale": "Serve mechanics consistently excellent. Meets advancement gate criteria."}'::JSONB,
   'high', 'pending_review', NOW() + INTERVAL '7 days'),

  -- 4. Parent-safe update draft — Zara Ahmed
  ('00000000-0000-0009-0001-000000000004', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000004', 'dddddddd-dddd-dddd-dddd-000000000001',
   'generate_parent_update', 'Parent-Safe Communication Draft — Zara Ahmed',
   'players', '00000000-0000-0005-0001-000000000012',
   '{"player_name": "Zara Ahmed", "draft_content": "Zara has been working hard on her fundamentals. Her footwork has shown improvement over the past few weeks.", "coach_internal_note": "INTERNAL: Parent has expressed concern about Zara attitude in sessions — draft above is parent-safe version."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days'),

  -- 5. Observation draft — Chloe Martinez
  ('00000000-0000-0009-0001-000000000005', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0008-0001-000000000005', 'cccccccc-cccc-cccc-cccc-000000000001',
   'other', 'Coach Observation — Chloe Martinez Backhand Improvement',
   'players', '00000000-0000-0005-0001-000000000006',
   '{"player_name": "Chloe Martinez", "observation_type": "positive", "content": "Chloe backhand cross-court showed significant improvement today. Consistent depth and direction."}'::JSONB,
   'low', 'pending_review', NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;
```

**Verification — Sections 6 & 7:**

```sql
SELECT 'voice_commands' AS table_name, COUNT(*) FROM voice_commands WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'proposed_actions', COUNT(*) FROM proposed_actions WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'pending_review_items', COUNT(*) FROM proposed_actions WHERE academy_id = '00000000-0000-0000-0001-000000000001' AND status = 'pending_review';
-- Expected: 5, 5, 5
```

---

## Section 8 — Player Development Summaries + Priorities

**Requires director profile UUID. Substitute `aaaaaaaa-aaaa-aaaa-aaaa-000000000001` before pasting.**

```sql
-- PLAYER DEVELOPMENT SUMMARIES

-- Isabelle Fontaine — parent-visible + student-visible
INSERT INTO player_development_summary (
  academy_id, player_id, created_by,
  coach_summary, student_friendly_summary, parent_summary,
  show_to_student, show_to_parent, source
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0005-0001-000000000008',
  'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  'INTERNAL: Isabelle working well technically. Serve mechanics have improved. Parent engagement is strong — keep them updated positively.',
  'Keep working on your serve mechanics — you are making great progress!',
  'Isabelle has been working on serve mechanics and footwork. Her consistency has improved significantly over the past 4 weeks.',
  true, true, 'coach_generated'
) ON CONFLICT (player_id) DO NOTHING;

-- Emma Torres — student-visible only (player portal demo)
INSERT INTO player_development_summary (
  academy_id, player_id, created_by,
  coach_summary, student_friendly_summary, parent_summary,
  show_to_student, show_to_parent, source
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0005-0001-000000000010',
  'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
  'INTERNAL: Emma is ready to move to Intermediate. Two gates remain open — backhand cross-court and footwork consistency.',
  'Keep working on your backhand cross-court. You are 70% of the way to Level 3!',
  NULL,
  true, false, 'coach_generated'
) ON CONFLICT (player_id) DO NOTHING;

-- PLAYER PRIORITIES

-- Marcus Rivera — promotion readiness (advancement signal for DONNA)
INSERT INTO player_priorities (
  academy_id, player_id, category, title, description,
  priority_rank, priority_level, urgency, confidence_score, source_signal_ids
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0005-0001-000000000001',
  'promotion_readiness',
  'Advancement to Level 5 — pending director approval',
  'Coach Priya has proposed advancement. Serve mechanics meet Level 5 gate criteria.',
  1, 'high', 'high', 0.92, ARRAY[]::UUID[]
);

-- Isabelle Fontaine — serve consistency
INSERT INTO player_priorities (
  academy_id, player_id, category, title, description,
  priority_rank, priority_level, urgency, confidence_score, source_signal_ids
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0005-0001-000000000008',
  'technical_skill',
  'Serve consistency',
  'Working on consistent toss placement and follow-through.',
  1, 'medium', 'normal', 0.85, ARRAY[]::UUID[]
);

-- Emma Torres — backhand cross-court (player portal demo gate)
INSERT INTO player_priorities (
  academy_id, player_id, category, title, description,
  priority_rank, priority_level, urgency, confidence_score, source_signal_ids
) VALUES (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0005-0001-000000000010',
  'technical_skill',
  'Backhand cross-court threshold',
  'Consistent backhand cross-court depth needed for Level 3 gate.',
  1, 'medium', 'normal', 0.88, ARRAY[]::UUID[]
);
```

**Verification — Section 8:**

```sql
SELECT 'development_summaries' AS table_name, COUNT(*) FROM player_development_summary WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL
SELECT 'player_priorities', COUNT(*) FROM player_priorities WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- Expected: 2, 3
```

---

## Final Verification — Full Seed Check

Run after all sections are complete:

```sql
-- FULL SEED VERIFICATION — Monteiro Tennis Academy
SELECT
  'academy'                AS table_name, COUNT(*) AS count FROM academies          WHERE slug = 'monteiro-tennis'
UNION ALL SELECT 'academy_levels',       COUNT(*) FROM academy_levels          WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'groups',               COUNT(*) FROM groups                  WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'players',              COUNT(*) FROM players                 WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'profiles',             COUNT(*) FROM profiles                WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'academy_memberships',  COUNT(*) FROM academy_memberships     WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'coach_assignments',    COUNT(*) FROM coach_group_assignments  WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'sessions',             COUNT(*) FROM sessions                WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'voice_commands',       COUNT(*) FROM voice_commands          WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'proposed_actions',     COUNT(*) FROM proposed_actions        WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'curriculum_states',    COUNT(*) FROM player_curriculum_states WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'dev_summaries',        COUNT(*) FROM player_development_summary WHERE academy_id = '00000000-0000-0000-0001-000000000001'
UNION ALL SELECT 'priorities',           COUNT(*) FROM player_priorities       WHERE academy_id = '00000000-0000-0000-0001-000000000001';
-- Expected: 1, 5, 3, 15, 6, 6, 5, 3, 5, 5, 12, 2, 3
```

---

## Rollback — Full Demo Data Reset

If you need to remove all Monteiro demo data, run these DELETE statements **in order** (FK constraint order — children first, parents last):

```sql
-- ROLLBACK — removes all Monteiro Tennis Academy demo data
-- Run in this order. One block at a time.

-- 1. Remove dependent records
DELETE FROM player_priorities        WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM player_development_summary WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM player_curriculum_states  WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM proposed_actions          WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM voice_commands            WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM coach_observations        WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM session_attendance        WHERE session_id IN (SELECT id FROM sessions WHERE academy_id = '00000000-0000-0000-0001-000000000001');
DELETE FROM sessions                  WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM coach_group_assignments   WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM academy_memberships       WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM player_guardians          WHERE player_id  IN (SELECT id FROM players WHERE academy_id = '00000000-0000-0000-0001-000000000001');
DELETE FROM group_memberships         WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM guardians                 WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM players                   WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM profiles                  WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM groups                    WHERE academy_id = '00000000-0000-0000-0001-000000000001';
DELETE FROM academy_levels            WHERE academy_id = '00000000-0000-0000-0001-000000000001';

-- 2. Remove the academy last
DELETE FROM academies WHERE id = '00000000-0000-0000-0001-000000000001';

-- 3. Remove auth users manually in Supabase Auth dashboard (cannot be done via SQL here)
-- Delete: alex@monteirotennis.demo, priya@monteirotennis.demo, david@monteirotennis.demo,
--         lena@monteirotennis.demo, parent.fontaine@monteiro.demo, emma@monteiro.demo
```

---

## Known Limitations at Time of Seeding

| Limitation | Impact on demo | Workaround |
|---|---|---|
| `player_priorities` has no `is_parent_visible` gate | Priority titles must use parent-safe language | Already done for Isabelle — "Serve consistency" is parent-safe |
| `execute_approved_action()` may not update `player_curriculum_states` for advancement | Marcus Rivera approval recorded but level may not auto-change | Manual SQL to update level post-demo |
| Voice input requires OpenAI Realtime API key | Voice wrap-up falls back to text | Configure API key or use text-only |
| `player_curriculum_states` seeded via subquery on global `curriculum_levels` | Requires migration 053 applied | Pre-flight check in Section 0 confirms |

---

## ⛔ Phase 2 Stop Gate

**SQL was NOT executed by this sprint. This packet is documentation only.**

Do not run any section until you explicitly say one of:
- `"run the demo seed locally"` — targets local Supabase instance only
- `"apply the demo seed to [environment name]"` — targets the named environment

Current linked environment: **`dbjjhhxdkpdreytsozlq` (AcademyOS — live remote)**. Confirm this is the correct target before running.
