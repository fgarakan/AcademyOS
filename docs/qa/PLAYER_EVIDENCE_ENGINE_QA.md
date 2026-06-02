# Player Evidence Engine — QA Checklist

**Sprint:** Mega Sprint 1211-1230
**Date:** 2026-06-02

---

## Pre-conditions

- [ ] Migration 083 applied (`player_evidence_records` table exists)
- [ ] At least 1 active player exists with a completed assessment
- [ ] At least 1 active mission assignment exists
- [ ] Director and coach accounts available for testing

---

## Migration verification

- [ ] `player_evidence_records` table exists
- [ ] `owner_scope` column present: `player_owned | academy_owned | shared`
- [ ] `portability_status` column present: `portable | internal_only | anonymized_on_exit`
- [ ] `consent_status` column present
- [ ] Unique index on `(player_id, source_type, source_id)` exists
- [ ] RLS enabled on the table
- [ ] `tr_player_evidence_records_updated_at` trigger present

---

## Evidence creation hooks

### Assessment submission (director)

- [ ] Director submits assessment → `player_evidence_records` INSERT with `source_type = 'assessment_score'`
- [ ] `source_id` = assessments.id
- [ ] `owner_scope = 'shared'`, `portability_status = 'portable'`
- [ ] `evidence_summary` does NOT contain raw score numbers exposed externally
- [ ] `visible_to_parent = false`, `visible_to_player = false`
- [ ] audit_logs entry also created (unchanged)

### Reassessment submission

- [ ] Director marks `is_reassessment = true` → `source_type = 'reassessment_change'`
- [ ] Evidence summary includes direction word (improved/declined/stable)

### Coach draft approval

- [ ] Director approves coach assessment draft → evidence record written
- [ ] Same ownership rules as direct assessment

### Mission assignment approval

- [ ] Director approves mission → `source_type = 'mission_assigned'`
- [ ] `owner_scope = 'player_owned'`, `portability_status = 'portable'`
- [ ] `visible_to_player = true`

### Mission completion

- [ ] `completeMissionAction()` completes mission → `source_type = 'mission_completed'`
- [ ] `evidence_strength = 'strong'`
- [ ] `visible_to_player = true`

### Deduplication

- [ ] Submitting the same assessment twice does NOT create duplicate evidence records
- [ ] Unique constraint violation treated as non-error (`isDuplicate = true`)

---

## Aggregator

- [ ] `getPlayerEvidenceRecords()` returns records from `player_evidence_records`
- [ ] When table is empty, falls back to existing tables (assessments, missions)
- [ ] Fallback result has `source = 'fallback_tables'`
- [ ] `anonymized_at IS NOT NULL` records excluded from results
- [ ] Parent/player role filter applied when `visibleToRole` is set

---

## Progress rollup

- [ ] Player with no evidence → `progressStatus = 'missing_data'`
- [ ] Player with stale assessment (> 90 days) → `readinessBlockers` includes `missing_assessment`
- [ ] Player with fresh assessment + missions + attendance → `progressStatus = 'ready_for_review'`
- [ ] Player with no activity in 60+ days → `progressStatus = 'stalled'`
- [ ] `donnaSummary` contains no undefined or null values
- [ ] `recommendedNextAction` is specific and actionable

---

## DONNA evidence answers

- [ ] "Why is Jamie at this level?" → uses evidence records when available; falls back gracefully
- [ ] "What evidence supports moving up?" → cites strong records; lists missing evidence
- [ ] "Is this player stalled?" → accurate stall check from rollup
- [ ] All answers include `missingEvidenceNote` when evidence is absent
- [ ] No answer invents facts not in evidence records

---

## Player Evidence Summary Panel

- [ ] Panel renders in player profile Overview (collapsed by default)
- [ ] Shows correct `ProgressStatus` badge
- [ ] Shows `donnaSummary` text
- [ ] Shows recommended action
- [ ] Shows high-severity blockers
- [ ] Shows top 5 evidence signals
- [ ] Shows "+N more signals" count when > 5
- [ ] Shows missing evidence chips
- [ ] Shows "fallback tables" note when migration not applied
- [ ] Panel is NOT visible to parent/player (director/coach only)

---

## Pilot test harness

- [ ] `runPlayerAHarness()` passes all 8 assertions
- [ ] `runPlayerBHarness()` passes all 5 assertions
- [ ] Override evidence has `visible_to_coach = false`
- [ ] Override evidence has `portability_status = 'internal_only'`
- [ ] Parent-visible records are all `portability_status = 'portable'`

---

## TypeScript

- [ ] `npx tsc --noEmit` clean across all sprint files
