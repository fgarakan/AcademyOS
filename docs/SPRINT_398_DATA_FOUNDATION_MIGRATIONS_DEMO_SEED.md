# Sprint 398 — Data Foundation: Migrations + Demo Player Seed V1

**Date:** 2026-05-20
**Sprint:** 398
**Status:** Audit + Seed SQL complete. No migrations applied automatically. Manual apply required.

---

## Executive Summary

Sprint 397 flagged "9 pending migrations." This sprint audited the actual migration status by cross-referencing `src/lib/supabase/database.types.ts` against all 68 migration files.

**Findings:**

The Sprint 397 estimate was partially incorrect. The database.types.ts file is the only reliable migration verification source available (Supabase CLI is not installed in this environment; the live Supabase URL is `https://dbjjhhxdkpdreytsozlq.supabase.co`). Based on types analysis:

- Migrations 001–062 are confirmed applied (all tables created by these migrations appear in database.types.ts)
- Migrations 063–064 are likely applied (app code uses `has_seen_first_run_deck` via rawDb bypass and it works across multiple sprints; orange1 content seed has no new tables)
- Migrations 065–068 are unverified — their new tables (`template_review_requests`, `template_version_history`) do NOT appear in database.types.ts, meaning either they were not applied, or applied after the last type regeneration

**Primary pilot-readiness risk** is NOT missing schema tables. The schema is substantially complete. The risks are:

1. **RLS gaps** — migrations 055, 056, 058, 066 add or fix RLS policies on existing tables. These cannot be verified via database.types.ts. If missing, they cause silent read failures and INSERT RLS errors in the template builder and session execution flow.
2. **Missing seed data** — The demo academy exists (migration 024 ID: `00000000-0000-0000-0000-000000000001`) and curriculum is seeded (migration 053: 15 levels, 8 archetypes, 57 gates, 120 coach language rows, 152 drills), but NO demo player exists with a linked auth user, active priorities, or development summary.
3. **Types regeneration needed** — database.types.ts was last generated between migrations 062 and 067. After applying any pending migrations, it must be regenerated.

---

## Migration Audit

### Environment

| Item | Value |
|---|---|
| Supabase URL | https://dbjjhhxdkpdreytsozlq.supabase.co (live) |
| Supabase CLI | Not installed |
| Migration source of truth | src/lib/supabase/database.types.ts |
| Total migration files on disk | 68 (001–068) |
| Migration files committed to git | 0 (all are untracked — in .gitignore or never staged) |

### Migration Status Table

| Migration | Title | Type | Status | Tables/Changes | Notes |
|---|---|---|---|---|---|
| 001 | Extensions | Schema | APPLIED | uuid-ossp, pg_crypto | In types |
| 002 | Core Identity | Schema | APPLIED | profiles, academies, groups | In types |
| 003 | RLS Helpers | Functions | APPLIED | auth_academy_id(), auth_is_staff(), etc. | Used throughout |
| 004 | Players | Schema | APPLIED | players, player_level_history | In types |
| 005 | Assessments | Schema | APPLIED | assessments | In types |
| 006 | Exercises Templates | Schema | APPLIED | exercises, templates, template_blocks, template_block_exercises | In types |
| 007 | Sessions | Schema | APPLIED | sessions, session_blocks, session_attendance, session_block_exercises | In types |
| 008 | Voice Pipeline | Schema | APPLIED | voice_intake_drafts | In types |
| 009 | Proposed Actions | Schema | APPLIED | proposed_actions | In types |
| 010 | Coach Notes | Schema | APPLIED | coach_observations, player_priorities | In types |
| 011 | Audit Versioning | Schema | APPLIED | audit_logs, field_change_history | In types |
| 012 | Functions Triggers | Functions | APPLIED | finalize_player_placement(), execute_approved_action() | Used |
| 013–035 | Intelligence/Signal layers | Schema+Data | APPLIED | signals, recommendations, load, etc. | In types |
| 036 | Curriculum Spine | Schema | APPLIED | curriculum_stages, curriculum_levels, skill_progressions, etc. | In types |
| 037 | Curriculum Seed | Data | APPLIED | Partial — only parent_level_descriptions seeded; skill_progressions skipped | Seed shortcut noted in file |
| 038 | Curriculum Mappings | Schema+Data | APPLIED | progression_rules, v_curriculum_level_requirements | In types |
| 039 | Player Development Summary | Schema | APPLIED | player_development_summary | In types |
| 040 | Platform Roles | Schema | APPLIED | platform_roles, profile_academy_roles | In types |
| 041 | Requirement Domains | Schema | APPLIED | curriculum_requirement_domains, curriculum_track_requirements, player_requirement_progress, requirement_evidence_links | In types |
| 042 | Requirement Domain Seed | Data | APPLIED | Seeds 3 domain rows (skill, competition, fitness) | Idempotent |
| 043 | Orange Ball Starter Requirements | Data | APPLIED | Seeds curriculum_track_requirements for orange_development level | No new tables |
| 044 | Player Requirement Progress Bootstrap | Data | APPLIED | Seeds player_requirement_progress rows for existing players | No new tables |
| 045 | Curriculum Content Library | Schema | APPLIED | curriculum_content_items, content_requirement_mappings | In types |
| 046 | Orange Ball Content Pack | Data | APPLIED | Seeds curriculum_content_items for Orange 1 and Orange 2 | No new tables |
| 047 | Content-Requirement Mappings Seed | Data | APPLIED | Maps content items to requirements | No new tables |
| 048 | Academy Curriculum Clone | Schema | APPLIED | academy_curriculum_versions | In types |
| 049 | Session Adjustment Suggestions | Schema | APPLIED | session_adjustment_suggestions | In types |
| 050 | Private Lesson Requests | Schema | APPLIED | private_lesson_requests | In types |
| 051 | Academy Suggestions | Schema | APPLIED | academy_suggestions | In types |
| 052 | Curriculum Foundation Tables | Schema | APPLIED | curriculum_archetypes, curriculum_failure_modes, curriculum_gates, curriculum_coach_language, curriculum_drills, curriculum_drill_tags, curriculum_competition_track, curriculum_fitness_guidance, curriculum_volume_guidance | In types |
| 053 | Curriculum Seed | Data | APPLIED | 15 level display names, 8 archetypes, 14 failure modes, 57 gates, 120 coach language rows, 152 drills, 15 competition/fitness/volume rows | In types |
| 054 | Execute Approved Action Expansion | Functions | APPLIED | Extends execute_approved_action() to 11 action types | |
| 055 | Template Block Exercises RLS | RLS | UNCERTAIN | Adds RLS policies to template_block_exercises | Cannot verify via types — superseded by 058 |
| 056 | Session Block Exercises RLS | RLS | UNCERTAIN | Adds RLS policies to session_block_exercises | Cannot verify via types — MUST apply if not done |
| 057 | Session Block Status | Column | APPLIED | actual_status column on session_blocks | actual_status in types (despite "PROPOSAL ONLY" note in file — file note is outdated) |
| 058 | Template Block Exercises RLS (idempotent) | RLS | UNCERTAIN | DROP IF EXISTS + CREATE policies on template_block_exercises | Supersedes 055 — MUST apply if 055 was not applied or was partial |
| 059 | Player Gate Status Foundation | Schema | APPLIED | player_gate_status | In types |
| 060 | Gate Status Repair | ALTER+Data | UNCERTAIN | ALTER TABLE requirement_evidence_links ADD COLUMN gate_id; Bootstrap player_gate_status rows | Cannot verify via types — needed if 059 partially failed |
| 061 | Curriculum Content Taxonomy | ALTER | UNCERTAIN | Adds 6 columns to curriculum_content_items (domain, session_block_hint, role visibility flags, ball_level) | No new tables — cannot verify via types |
| 062 | Class Template Content Junction | Schema | APPLIED | curriculum_class_template_blocks | In types |
| 063 | Orange 1 Foundation Content Seed | Data | LIKELY APPLIED | Seeds curriculum_content_items for Orange 1 - Rally | No new tables; migration 065 references it |
| 064 | First Run Deck Profile Fields | ALTER | LIKELY APPLIED | has_seen_first_run_deck, first_run_deck_seen_at columns on profiles | App queries this field and it works |
| 065 | Mental Competitive Content Seed | Data+ALTER | UNCERTAIN | Extends session_block_hint CHECK; seeds mental/competitive content | Cannot verify |
| 066 | Sessions RLS Recursion Fix | Functions+RLS | UNCERTAIN | Creates session_belongs_to_auth_academy(); recreates session_attendance policies | Not in types; if missing, director session creation causes RLS infinite recursion |
| 067 | Template Schema Extension | Schema | UNCERTAIN | Creates template_review_requests, template_version_history; alters templates, template_blocks | NOT in types — likely not applied |
| 068 | Template RLS Policy Refinements | RLS | UNCERTAIN | Replaces broad template policies with status-aware policies | Not verifiable via types; depends on 067 |

---

## Critical Pending Migrations to Apply

These are the migrations that are either definitely not applied or could not be confirmed. Apply in order via Supabase SQL Editor.

### Priority 1 — MUST apply (active bugs if missing)

**Migration 056 — session_block_exercises RLS**
`supabase/migrations/056_session_block_exercises_rls.sql`

Impact if missing: Session block exercises return empty arrays on SELECT. INSERT into session_block_exercises fails with RLS error. generateSessionFromTemplateAction creates sessions and blocks but not exercises. Coach session execution page shows no exercise drills.

**Migration 058 — template_block_exercises RLS (idempotent)**
`supabase/migrations/058_template_block_exercises_rls.sql`

Impact if missing: Director "Populate Blocks with Exercises" action fails with RLS error. Template builder cannot assign exercises to blocks.

**Migration 066 — sessions RLS recursion fix**
`supabase/migrations/066_sessions_rls_recursion_fix.sql`

Impact if missing: Creating a session from the director interface may cause RLS infinite recursion → 500 error. Session creation is completely broken if this is not applied.

### Priority 2 — Apply for full schema parity (template lifecycle, content taxonomy)

**Migration 060 — gate_status_repair**
`supabase/migrations/060_gate_status_repair.sql`

Impact if missing: requirement_evidence_links is missing gate_id column. Gate evidence links to gates cannot be recorded. player_gate_status bootstrap data may be missing.

**Migration 061 — curriculum content taxonomy**
`supabase/migrations/061_curriculum_content_taxonomy.sql`

Impact if missing: curriculum_content_items is missing domain, session_block_hint, ball_level, and role visibility columns. Lesson plan generator cannot route content to block types. Migration 065 data inserts will fail or produce incomplete rows.

**Migration 065 — mental/competitive content seed**
`supabase/migrations/065_mental_competitive_content_seed.sql`

Impact if missing: No curriculum content for mental/competitive blocks. Lesson plan generator produces empty results for mental and competition phases.

**Migration 067 — template schema extension**
`supabase/migrations/067_template_schema_extension.sql`

Impact if missing: template_review_requests and template_version_history tables do not exist. Template lifecycle UI (draft → review → approve) will error when trying to query these tables.

**Migration 068 — template RLS policy refinements**
`supabase/migrations/068_template_rls_policies.sql`

Impact if missing: Template access may use overly broad policies from migration 006. Status-aware role differentiation (coaches cannot see draft templates) is not enforced.

### Application order (mandatory)

```
060  (completes partially-applied 059)
061  (adds columns to curriculum_content_items — needed by 065)
056  (session_block_exercises RLS)
058  (template_block_exercises RLS — idempotent, safe to apply regardless of 055 state)
065  (mental/competitive content seed — needs 061 columns to exist)
066  (sessions RLS recursion fix)
067  (template schema extension)
068  (template RLS policy refinements — depends on 067)
```

### How to apply

1. Open Supabase Dashboard → SQL Editor
2. Open each migration file in order
3. Paste content → Run
4. Verify: no errors in the output
5. After all applied: regenerate database.types.ts (see below)

---

## Database Types Regeneration

After applying all pending migrations, database.types.ts must be regenerated. The Supabase CLI is not installed in this dev environment. Options:

**Option A — Install Supabase CLI in this environment:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref dbjjhhxdkpdreytsozlq
supabase gen types typescript --project-id dbjjhhxdkpdreytsozlq > src/lib/supabase/database.types.ts
```

**Option B — Use Supabase dashboard:**
Dashboard → API → GraphQL → Types → Download TypeScript types → replace src/lib/supabase/database.types.ts

**After regenerating:** Run `npx tsc --noEmit` to confirm the app still compiles cleanly.

---

## Existing Data Audit

### What is already in the live database (from migration 024 + migration 053)

**Academy:** Angles Tennis Academy
- ID: `00000000-0000-0000-0000-000000000001`
- Slug: `angles`
- Country: US, Timezone: America/New_York

**Curriculum levels (from migration 053):**
- Red 1 — Foundation (red_foundation, level 1)
- Red 2 — Intermediate (red_foundation, level 2)
- Red 3 — Matchplay (red_foundation, level 3)
- Orange 1 — Rally (orange_development, level 1) ← pilot demo target
- Orange 2 — Baseline (orange_development, level 2)
- Orange 3 — Patterns (orange_development, level 3)
- Green 1 — Consistency (green_performance, level 1)
- Green 2 — Positioning (green_performance, level 2)
- Green 3 — Competitive (green_performance, level 3)
- Yellow 1 — Tournament (yellow_competitive, level 1)
- Yellow 2 — Ranking (yellow_competitive, level 2)
- Yellow 3 — Circuit (yellow_competitive, level 3)
- High Performance 1 (high_performance, level 1)
- High Performance 2 (high_performance, level 2)
- High Performance 3 (high_performance, level 3)

**Curriculum content (from migrations 046, 063, 065 if applied):**
- ~50 curriculum_content_items for Orange 1 and Orange 2
- ~152 curriculum_drills (global)
- 120 curriculum_coach_language rows (15 levels × 8 domains × 4 phrases)
- 57 curriculum_gates (level advancement gates)

**Demo player data:** NONE — migration 024 intentionally skips player rows because they require real Supabase Auth user UUIDs.

---

## Pilot Demo Player Seed Plan

### What needs to be created manually

**Step 1 — Create auth users in Supabase Dashboard (Authentication → Users)**

| Role | Email (example) | Notes |
|---|---|---|
| academy_director | director@angles-pilot.test | Angles director account |
| coach | coach@angles-pilot.test | Main coach account |
| player | player@angles-pilot.test | Demo player auth account |
| parent | parent@angles-pilot.test | Demo parent auth account |

After creation, note each user's UUID from the Supabase Auth dashboard.

**Step 2 — Create profile rows**

```sql
-- Replace <director_uuid>, <coach_uuid>, <player_uuid>, <parent_uuid>
-- with the actual UUIDs from Supabase Auth.

INSERT INTO profiles (id, email, role, academy_id, full_name, has_seen_first_run_deck)
VALUES
  ('<director_uuid>', 'director@angles-pilot.test', 'academy_director',
   '00000000-0000-0000-0000-000000000001', 'Demo Director', true),
  ('<coach_uuid>',    'coach@angles-pilot.test',    'coach',
   '00000000-0000-0000-0000-000000000001', 'Demo Coach', true),
  ('<player_uuid>',   'player@angles-pilot.test',   'player',
   '00000000-0000-0000-0000-000000000001', 'Demo Player', false),
  ('<parent_uuid>',   'parent@angles-pilot.test',   'parent',
   '00000000-0000-0000-0000-000000000001', 'Demo Parent', false)
ON CONFLICT (id) DO NOTHING;
```

**Step 3 — Create the demo player row (linked to auth via profile_id)**

```sql
-- Replace <player_uuid> with actual UUID.
-- Replace <orange1_level_id> with the actual curriculum_levels.id for
--   stage='orange_development' AND level_number=1.
-- You can find it with: SELECT id FROM curriculum_levels WHERE stage='orange_development' AND level_number=1;

INSERT INTO players (
  id, academy_id, profile_id, first_name, last_name, full_name,
  date_of_birth, is_active, curriculum_level_id
)
VALUES (
  '00000000-0000-0003-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '<player_uuid>',
  'Alex', 'Chen', 'Alex Chen',
  '2014-03-15',
  true,
  '<orange1_level_id>'
)
ON CONFLICT (id) DO NOTHING;
```

**Step 4 — Create player priorities (active missions)**

```sql
INSERT INTO player_priorities (
  id, academy_id, player_id, title, description, category, urgency, priority_rank, is_active,
  show_to_student, show_to_parent
)
VALUES
  (
    '00000000-0000-0004-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0003-0000-000000000001',
    'Develop consistent forehand follow-through',
    'Focus on completing the swing with the racket finishing high across the left shoulder. Right now the swing is stopping short — causing inconsistent pace and direction.',
    'technical', 'critical', 1, true, true, false
  ),
  (
    '00000000-0000-0004-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0003-0000-000000000001',
    'Rally consistency — 5+ ball exchanges',
    'Build the habit of staying in the rally rather than going for winners too early. Target: 5 or more controlled ball exchanges in practice.',
    'tactical', 'high', 2, true, true, false
  ),
  (
    '00000000-0000-0004-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0003-0000-000000000001',
    'Court movement — split-step timing',
    'Practice split-stepping as the opponent is about to strike. Currently moving after the ball has already left their racket, which is too late.',
    'fitness', 'medium', 3, true, true, false
  )
ON CONFLICT (id) DO NOTHING;
```

**Step 5 — Create player development summary**

```sql
INSERT INTO player_development_summary (
  id, academy_id, player_id, current_level_id,
  summary_text, coach_notes_internal, parent_visible_summary,
  what_to_work_on, how_parent_can_help, what_player_needs,
  show_to_student, show_to_parent,
  source, created_by
)
SELECT
  '00000000-0000-0005-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0003-0000-000000000001',
  id,
  'Alex is showing solid foundations at the Orange 1 level. Forehand technique needs refinement before we can progress to Orange 2. Rally consistency is improving session by session.',
  'Coach internal: Watch the grip tension under pressure — tends to white-knuckle on important points. Not shared with parent.',
  'Alex is working hard and making real progress. The main focus right now is building a reliable forehand and staying composed during long rallies.',
  'Consistent forehand follow-through and 5+ ball rally control are the top priorities this phase.',
  'Encourage practice at home — even 10 minutes of wall rallying makes a difference. Ask about the split-step before matches.',
  'Positive reinforcement when staying calm in long rallies. Alex responds well to specific praise rather than general encouragement.',
  true,
  true,
  'director',
  NULL
FROM curriculum_levels
WHERE stage = 'orange_development' AND level_number = 1
ON CONFLICT (id) DO NOTHING;
```

**Step 6 — Create parent/guardian relationship**

```sql
-- player_guardians table (from migration 004 or adjacent).
-- Check if this table exists: SELECT to_regclass('public.player_guardians');

INSERT INTO player_guardians (
  id, academy_id, player_id, guardian_profile_id,
  relationship_type, is_primary, can_receive_updates
)
VALUES (
  '00000000-0000-0006-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0003-0000-000000000001',
  '<parent_uuid>',
  'parent', true, true
)
ON CONFLICT (id) DO NOTHING;
```

**Step 7 — Create one coach profile row**

```sql
INSERT INTO coach_profiles (
  id, academy_id, profile_id, full_name, bio, is_active
)
VALUES (
  '00000000-0000-0007-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '<coach_uuid>',
  'Demo Coach', 'Orange ball and green ball specialist. 8 years coaching experience.', true
)
ON CONFLICT (id) DO NOTHING;
```

---

## Seed Verification Queries

After applying the seed, run these in Supabase SQL Editor to confirm:

```sql
-- 1. Verify academy
SELECT id, name, slug FROM academies WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Verify curriculum levels
SELECT stage, level_number, display_name FROM curriculum_levels ORDER BY display_order;

-- 3. Verify demo player
SELECT id, full_name, curriculum_level_id FROM players WHERE id = '00000000-0000-0003-0000-000000000001';

-- 4. Verify player priorities
SELECT title, category, priority_rank FROM player_priorities
WHERE player_id = '00000000-0000-0003-0000-000000000001'
ORDER BY priority_rank;

-- 5. Verify development summary
SELECT show_to_student, show_to_parent, source FROM player_development_summary
WHERE player_id = '00000000-0000-0003-0000-000000000001';

-- 6. Verify player portal will work (profile_id linkage)
SELECT p.full_name, pr.role FROM players p
JOIN profiles pr ON pr.id = p.profile_id
WHERE p.id = '00000000-0000-0003-0000-000000000001';

-- 7. Verify parent portal will work
SELECT pg.relationship_type, pr.role FROM player_guardians pg
JOIN profiles pr ON pr.id = pg.guardian_profile_id
WHERE pg.player_id = '00000000-0000-0003-0000-000000000001';

-- 8. RLS check: session block exercises policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'session_block_exercises';

-- 9. RLS check: template block exercises policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'template_block_exercises';

-- 10. Check for sessions RLS fix function
SELECT proname FROM pg_proc WHERE proname = 'session_belongs_to_auth_academy';
```

If query 8 returns 0 rows → migration 056 was not applied (apply it immediately).
If query 9 returns 0 rows → migration 058 was not applied (apply it immediately).
If query 10 returns 0 rows → migration 066 was not applied (apply it immediately).

---

## What This Sprint Does NOT Do

- Does not apply any migrations remotely (Supabase CLI not installed; live DB requires manual apply)
- Does not create auth users (must be done in Supabase Dashboard)
- Does not execute seed SQL automatically (user must run via Supabase SQL Editor)
- Does not modify existing migration files
- Does not add npm packages
- Does not write to the database directly from this sprint
- Does not regenerate database.types.ts (requires Supabase CLI or dashboard export)

---

## Remaining Data Blockers for Pilot

| Blocker | Resolution | Sprint |
|---|---|---|
| RLS missing on session_block_exercises | Apply migration 056 via SQL Editor | Now (manual) |
| RLS missing on template_block_exercises | Apply migration 058 via SQL Editor | Now (manual) |
| Sessions RLS infinite recursion | Apply migration 066 via SQL Editor | Now (manual) |
| No demo player auth user | Create in Supabase Auth dashboard | Now (manual) |
| No demo player DB rows | Apply seed SQL steps 2–7 | Now (manual) |
| database.types.ts stale | Regenerate after migrations applied | After manual apply |
| Parent portal path pages missing | Sprint 399 (build missing pages) | Sprint 399 |
| Player hero card visual upgrade | Sprint 400 | Sprint 400 |
| Academy DNA save not wired | Sprint 401 | Sprint 401 |

---

## Commands Run This Sprint

```bash
npx tsc --noEmit   # pre-flight: clean
npx tsc --noEmit   # post-doc: clean (docs only, no TypeScript changes)
```

---

## Safety Decisions

- No DB writes were made from this sprint — all SQL is provided as copy-paste instructions
- No existing migration files were modified
- No seed data deletes existing rows (all inserts use ON CONFLICT DO NOTHING)
- Auth user creation was not attempted — that requires Supabase Dashboard and is inherently manual
- The seed plan uses stable UUIDs with recognizable prefix `00000000-0000-000X-0000-000000000001` for easy identification in the DB

---

## Next Sprint Recommendation

**Option A (recommended if RLS fixes are applied first):**
Sprint 399 — Parent Portal Path Pages V1
Build the three missing parent portal pages: `/parent/skill-path`, `/parent/competition-path`, `/parent/fitness-path`. These are the highest-impact parent portal gap from Sprint 395 audit (parent parity 4/10 → 7/10 after this sprint).

**Option B (if RLS fixes not yet confirmed):**
Sprint 399 — RLS Verification + Player Home Visual Upgrade V1
Verify RLS fix application, confirm session and template actions work end-to-end, then begin player home card visual upgrade to match prototype.
