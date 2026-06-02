# Post-Migration Verification

**Sprint:** Post-Migration Verification + Pilot Smoke Test
**Date:** 2026-06-02
**URL:** `/director/migration-verify`

---

## Purpose

Verify migrations 076–080 are applied to the live Supabase database and confirm pilot-critical systems work end-to-end.

Run this page AFTER applying the migrations and BEFORE starting the Brian pilot session.

---

## Live Verification Dashboard

Navigate to `/director/migration-verify` (director/head_coach only).

The page runs 4 steps:

### Step 1 — Table Existence Check
Queries each table via `rawDb` and checks for relation errors.

| Table | Migration | Pilot Impact |
|---|---|---|
| `player_mission_assignments` | 076 | Missions tab, blueprint missions, player portal |
| `friction_reports` | 077 | Pilot feedback capture |
| `player_development_blueprints` | 078 | Blueprint tab, development priorities |
| `assessment_events` | 079 | Structured assessment workflow |
| `donna_placement_recommendations` | 080 | DONNA placement intelligence |

### Step 2 — Write Smoke Test
Attempts a non-destructive insert + immediate delete on each table.
Confirms: RLS allows director writes, schema columns are correct.

**Pass condition:** Insert succeeds, row deleted, no RLS violation.
**Fail condition:** Table missing, schema mismatch, or RLS blocks insert.

### Step 3 — DONNA Question Test
Runs 5 core director questions through `donnaGlobalCommandAction` and shows:
- Intent classified
- Confidence score
- Answer text
- Whether evidence is real vs generic fallback

**Expected:** Confidence ≥ 60% on structured questions.
**Acceptable:** "I don't have enough data" is an honest answer, not a failure.

### Step 4 — Role Safety Checklist
Manual verification checklist for pilot day:
- Parent portal: no coach notes or raw scores
- Player portal: no director/coach internal content
- Coach portal: no parent communication drafts
- Quick Capture: writes to correct academy
- Level movement: requires director approval
- Parent update: requires director approval before visible

---

## What "Verified" Means

| Check | What it confirms |
|---|---|
| Table exists | Migration SQL was applied to Supabase |
| Insert smoke test passes | RLS policies are configured correctly |
| DONNA answers with real data | Live DB data is accessible and usable |
| Role safety checks pass | No data leaks across role boundaries |

---

## If Migrations Are Missing

1. Open Supabase dashboard
2. Navigate to SQL Editor
3. Open each migration file from `supabase/migrations/`
4. Paste and Run in order: 076 → 077 → 078 → 079 → 080
5. Re-run the verification page

See `docs/qa/MIGRATION_LIVE_DB_AUDIT.md` for full instructions.

---

## Expected Verification State After All Migrations Applied

| Step | Expected Result |
|---|---|
| Table Check | All 5 tables: Applied ✓ |
| Smoke Test | All 5 tables: PASS |
| DONNA Questions | 5/5 answered with intent + confidence ≥ 60% |
| Role Safety | All checkboxes confirmed manually |
| Overall | "Pilot Ready" banner shown |
