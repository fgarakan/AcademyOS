# Migration Live DB Audit

**Sprint:** Mega Sprint 1166-1185
**Date:** 2026-06-02
**Status:** Audit only — do NOT apply without explicit instruction

---

## Summary

Migrations 076–080 exist locally but are **NOT applied** to the live Supabase database.
This is confirmed by their absence from `src/lib/supabase/database.types.ts` (the generated types file reflects the live DB state).

Migrations 001–075 are applied to the live DB.

---

## Pending Migrations — Apply Order

Apply in this exact order. Each depends on the previous.

### Migration 076 — player_mission_assignments
**File:** `supabase/migrations/076_player_mission_assignments.sql`
**Depends on:** missions table, players, profiles (all applied)
**Blocks:** Missions tab on player profile, blueprint mission generation, player mission portal view
**Risk:** Low — new table, additive, no changes to existing tables
**RLS:** 4 policies (staff see active, coaches insert drafts, directors manage all, players see own active)

### Migration 077 — friction_reports
**File:** `supabase/migrations/077_friction_reports.sql`
**Depends on:** profiles, academy_memberships (all applied)
**Blocks:** Friction capture feature
**Risk:** Low — new table, additive
**RLS:** 4 policies

### Migration 078 — player_development_blueprints
**File:** `supabase/migrations/078_player_development_blueprints.sql`
**Depends on:** assessments, curriculum_levels, profiles (all applied)
**Blocks:** Development blueprint generation, Blueprint tab, DevelopmentCenterTab
**Risk:** Low — new table, additive
**RLS:** 4 policies (directors see all, coaches see active, players see own active, directors create/update)

### Migration 079 — assessment_events
**File:** `supabase/migrations/079_assessment_events.sql`
**Depends on:** assessments, profiles (all applied)
**Blocks:** Assessment event scheduling workflow
**Risk:** Low — new table, additive
**RLS:** 5 policies

### Migration 080 — donna_placement_recommendations
**File:** `supabase/migrations/080_donna_placement_recommendations.sql`
**Depends on:** assessments, curriculum_levels, profiles (all applied)
**Blocks:** DONNA placement recommendation system after assessment
**Risk:** Low — new table, additive
**RLS:** 3 policies

---

## Apply Instructions

```sql
-- Apply one at a time, in order.
-- Open Supabase → SQL Editor → paste → Run → verify → next.

-- 1. Apply 076
-- [paste contents of supabase/migrations/076_player_mission_assignments.sql]

-- 2. Apply 077
-- [paste contents of supabase/migrations/077_friction_reports.sql]

-- 3. Apply 078
-- [paste contents of supabase/migrations/078_player_development_blueprints.sql]

-- 4. Apply 079
-- [paste contents of supabase/migrations/079_assessment_events.sql]

-- 5. Apply 080
-- [paste contents of supabase/migrations/080_donna_placement_recommendations.sql]
```

## Post-Apply Verification SQL

```sql
-- Confirm all 5 tables exist
SELECT tablename FROM pg_tables
WHERE tablename IN (
  'player_mission_assignments',
  'friction_reports',
  'player_development_blueprints',
  'assessment_events',
  'donna_placement_recommendations'
)
ORDER BY tablename;
-- Expect: 5 rows

-- Confirm RLS is enabled on each
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN (
  'player_mission_assignments',
  'friction_reports',
  'player_development_blueprints',
  'assessment_events',
  'donna_placement_recommendations'
);
-- All should have rowsecurity = true

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN (
  'player_mission_assignments',
  'friction_reports',
  'player_development_blueprints',
  'assessment_events',
  'donna_placement_recommendations'
)
ORDER BY tablename, policyname;
```

## Conflict Risks

None identified. All 5 migrations create new tables only — no column changes, no drops, no modifications to existing tables or policies.

## After Applying

Regenerate `database.types.ts`:
```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Note: app will work without regenerating types — all access to these tables uses `rawDb = supabase as any`. Types regeneration improves TypeScript safety but is not required for runtime.
