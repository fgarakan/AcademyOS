# DONNA Live Data Gaps — Sprint 511

**Date:** 2026-05-16
**Source:** COO Live Data Wiring Audit (Sprint 511)
**Cross-reference:** `COO_LIVE_DATA_WIRING_MAP.md`

This document is the actionable gap register derived from the Sprint 511 audit.
Each gap is ranked by priority and classified by what kind of work it requires.

---

## Gap Classification

| Type | Meaning |
|---|---|
| **adapter** | Tables exist with correct RLS; missing server action or API extension |
| **schema** | Missing column or table; migration required before any code can be written |
| **data** | Tables exist but contain no real data yet (demo academy only) |
| **rls** | RLS policy missing or incorrect for the required query pattern |

---

## Priority 1 — No migration needed, high user impact

These gaps can be closed in a single sprint each. All tables have correct RLS and `academy_id` scoping.

### Gap 1.1 — Command Brief: wrap-up coverage per session

**Missing:** `/api/donna/brief` does not query `proposed_actions` by `source_type='coach_wrap_up_v2'` grouped by `session_id`.
**Impact:** `wrapUpsSubmitted` and `wrapUpsOutstanding` fields in `DonnaCommandBriefData` always come from demo seed.
**Fix:** Extend `GET /api/donna/brief` — add query:
```sql
SELECT session_id, COUNT(*) as count
FROM proposed_actions
WHERE academy_id = $1
  AND source_type = 'coach_wrap_up_v2'
  AND created_at >= today
GROUP BY session_id
```
Compare against `sessions` count for today → derive submitted/outstanding.
**Type:** adapter
**Sprint:** 512
**Migration needed:** No

---

### Gap 1.2 — Command Brief: players attending today

**Missing:** `totalPlayersAttending` is not queried in any live route.
**Impact:** Always 0 or demo value on any non-demo surface.
**Fix:** Extend `GET /api/donna/brief` — add query:
```sql
SELECT COUNT(*) FROM session_attendance sa
JOIN sessions s ON s.id = sa.session_id
WHERE s.academy_id = $1
  AND s.scheduled_date = today
  AND sa.attended = true
```
**Type:** adapter
**Sprint:** 512
**Migration needed:** No

---

### Gap 1.3 — Command Brief: attention flags from coach_notes

**Missing:** `attentionFlags[]` in `DonnaCommandBriefData` is not populated from `coach_notes`.
**Impact:** Attention flag section always empty or demo on live routes.
**Fix:** Extend `GET /api/donna/brief` — add query:
```sql
SELECT cn.id, cn.player_id, cn.content, cn.observation_type, p.first_name, p.last_name
FROM coach_notes cn
JOIN players p ON p.id = cn.player_id
WHERE cn.academy_id = $1
  AND cn.observation_type = 'concern'
  AND cn.created_at >= now() - interval '7 days'
ORDER BY cn.created_at DESC
LIMIT 5
```
**Type:** adapter
**Sprint:** 512
**Migration needed:** No

---

### Gap 1.4 — Attention API: coach concern observations

**Missing:** `/api/donna/attention` does not query `coach_notes` for concern-type observations.
**Impact:** Only 2 of N attention signals fire; coach-observed player concerns not surfaced.
**Fix:** Extend `GET /api/donna/attention` — add concern observation signal.
**Type:** adapter
**Sprint:** 513
**Migration needed:** No

---

### Gap 1.5 — Attention API: repeated absence signal

**Missing:** `/api/donna/attention` does not query `session_attendance` for absence patterns.
**Impact:** Players with repeated absences not flagged.
**Fix:** Add query to count unexcused absences per player in last 14 days. Flag players with ≥ 2 absences.
**Type:** adapter
**Sprint:** 513
**Migration needed:** No

---

### Gap 1.6 — Player Attention Risk: no server action

**Missing:** No `getPlayerAttentionRiskAction(academyId)` server action exists.
**Impact:** `PlayerAttentionRiskDashboard` can only render demo data.
**Tables available:** `coach_notes` ✅, `proposed_actions` ✅, `players` ✅
**Fix:**
1. Create `src/app/director/_actions/donnaPlayerAttentionAction.ts`
2. Query `coach_notes WHERE observation_type='concern'` grouped by player_id
3. Query `proposed_actions WHERE target_module='player_support' AND status='pending_review'` grouped by subject_player_id
4. Join with `players` for names, derive `riskLevel`, return `PlayerAttentionRiskData[]`
**Type:** adapter
**Sprint:** 513
**Migration needed:** No

---

### Gap 1.7 — Coach Support Needed: no server action

**Missing:** No `getCoachSupportNeededAction(academyId)` server action exists.
**Tables available:** `sessions` ✅, `voice_notes` ✅, `coach_notes` ✅, `proposed_actions` ✅, `profiles` ✅
**Fix:**
1. Create `src/app/director/_actions/donnaCoachSupportAction.ts`
2. Query coaches in academy → per coach: last `voice_notes` date, observation count last 30d, unresolved proposed_actions count
3. Derive `supportFlag` and `primaryReason`, return `CoachSupportData[]`
**Type:** adapter
**Sprint:** 515
**Migration needed:** No

---

### Gap 1.8 — Group Health: no aggregation server action

**Missing:** No group health aggregation server action.
**Tables available:** `sessions` ✅, `session_attendance` ✅, `coach_notes` ✅, `proposed_actions` ✅
**Fix:**
1. Create `src/app/director/_actions/donnaGroupHealthAction.ts`
2. Per group: compute 4-week attendance rate, session completion rate, wrap-up submission rate
3. Derive `healthScore` (0–100), return `GroupHealthData[]`
**Type:** adapter
**Sprint:** 515
**Migration needed:** No

---

### Gap 1.9 — Context Ranking: incomplete input struct

**Missing:** `DonnaContextRankingInput` is partially populated. `wrapUpsOutstanding`, `playerAttentionRiskCount`, `coachSupportNeededCount`, `groupsAtRiskCount` all default to 0.
**Impact:** Ranking uses incomplete signal set; suggestions may be mis-prioritized.
**Fix:** As Gaps 1.1–1.8 are filled, each live loader should pass its count to the ranking input. No isolated sprint — progressive improvement.
**Type:** adapter
**Sprint:** Progressive (512–516)
**Migration needed:** No

---

### Gap 1.10 — Wrap-Up submission status not queryable by voice

**Missing:** DONNA cannot answer "which sessions have wrap-ups today" from live data.
**Fix:** Add `/api/donna/wrapup-status` route or extend brief route — returns per-session wrap-up submission status for today.
**Type:** adapter
**Sprint:** 513
**Migration needed:** No

---

## Priority 2 — Partial wiring; requires schema verification first

### Gap 2.1 — Weekly COO Report: `approved_at` / `applied_at` columns

**Missing:** The COO Report wants week-over-week review queue throughput: `avg(approved_at - created_at)`.
**Unknown:** Whether `proposed_actions.approved_at` and `proposed_actions.applied_at` exist in the live DB.
**Action before coding:** Run in Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'proposed_actions'
  AND column_name IN ('approved_at', 'applied_at');
```
**If columns exist:** Can build the weekly report loader in Sprint 514 — no migration needed.
**If columns missing:** Migration required before Sprint 514.
**Type:** schema (verify)
**Sprint:** 514 (post-verification)
**Migration needed:** Depends on verification

---

### Gap 2.2 — Parent Trust Coverage: `applied_at` tracking

**Missing:** No reliable way to determine when a parent message was last "applied" (sent/delivered). `proposed_actions.status='applied'` can be queried, but `applied_at` timestamp may not exist (see Gap 2.1).
**Partial workaround:** Can show `hasPendingDraft` (pending parent_update proposed actions) and `guardianLinked` status without `applied_at`. Last contact date requires confirmed timestamp column.
**Type:** schema (verify first), then adapter
**Sprint:** 516 (partial wiring without applied_at)
**Migration needed:** Possibly (for applied_at column)

---

## Priority 3 — Blocked by unapplied migrations

### Gap 3.1 — Curriculum Bottleneck: `coach_notes.skill_tag` column

**Missing:** `coach_notes.skill_tag` column referenced in `academyHealthSourceMap.ts` may not exist in the live DB.
**Action:** Verify in SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'coach_notes'
  AND column_name = 'skill_tag';
```
**Type:** schema
**Migration needed:** YES if column is absent
**Sprint:** Deferred until verified and migration confirmed

---

### Gap 3.2 — Curriculum Bottleneck: `curriculum_requirements` table

**Missing:** The `curriculum_requirements` table is referenced by `academyHealthSourceMap.ts` but migration 041 (`041_requirement_domains.sql`) has not been applied to the live DB (confirmed in KNOWN_LIMITATIONS.md).
**Cascade:** Without migration 041, migrations 042–044 are also unapplied. `requirement_evidence_links`, `curriculum_track_requirements`, `player_requirement_progress`, `curriculum_requirement_domains` are all absent from live DB.
**Type:** schema
**Migration needed:** YES — migrations 041–044 required
**Sprint:** Deferred — stop and ask Farshad before proceeding. This is a multi-migration chain.

---

### Gap 3.3 — Session Actuals: normalized wrap-up write-back

**Missing:** `session_actuals` table does not exist. Approved wrap-ups write to `sessions.session_notes` (free text) only.
**Impact:** Group health dashboard cannot compute per-session outcome quality. Coach support dashboard cannot compute session completion rates accurately.
**Type:** schema
**Migration needed:** YES — new `session_actuals` table required
**Sprint:** Deferred — separate schema design sprint before migration

---

## Priority 4 — Data gaps (schema and adapter exist; no real data yet)

### Gap 4.1 — `session_attendance` rows sparse in demo academy

Even with correct RLS and live queries, `session_attendance` rows may be sparse in the demo academy. Counts for `totalPlayersAttending` and absence tracking may return 0.
**Action:** After wiring, check Supabase for attendance row count. If empty, seed or use the existing demo reset flow.
**Type:** data
**Migration needed:** No
**Sprint:** Monitor during Sprint 512 QA

---

### Gap 4.2 — `coach_notes` concern observations sparse in demo academy

`coach_notes WHERE observation_type='concern'` may return 0 rows for the demo academy even after the adapter is built.
**Action:** After Sprint 513, verify count in Supabase SQL Editor. Seed concern observations via the demo sandbox action if needed.
**Type:** data
**Migration needed:** No
**Sprint:** Monitor during Sprint 513 QA

---

## Gap Register Summary

| Gap | Type | Priority | Migration | Sprint |
|---|---|---|---|---|
| 1.1 Command Brief: wrap-up coverage | adapter | P1 | No | 512 |
| 1.2 Command Brief: players attending | adapter | P1 | No | 512 |
| 1.3 Command Brief: attention flags | adapter | P1 | No | 512 |
| 1.4 Attention API: coach concerns | adapter | P1 | No | 513 |
| 1.5 Attention API: absence signal | adapter | P1 | No | 513 |
| 1.6 Player Attention Risk: server action | adapter | P1 | No | 513 |
| 1.7 Coach Support: server action | adapter | P1 | No | 515 |
| 1.8 Group Health: aggregation action | adapter | P1 | No | 515 |
| 1.9 Context ranking: incomplete input | adapter | P1 | No | Progressive |
| 1.10 Wrap-up submission voice query | adapter | P1 | No | 513 |
| 2.1 COO Report: approved_at/applied_at | schema (verify) | P2 | Maybe | 514 |
| 2.2 Parent Trust: applied_at tracking | schema (verify) | P2 | Maybe | 516 |
| 3.1 Curriculum: skill_tag column | schema | P3 | Maybe | Deferred |
| 3.2 Curriculum: requirements table | schema | P3 | YES (chain) | Deferred |
| 3.3 Session Actuals: new table | schema | P3 | YES | Deferred |
| 4.1 session_attendance sparse | data | P4 | No | Monitor |
| 4.2 coach_notes concerns sparse | data | P4 | No | Monitor |
