# Performance Fix Pass — Sprint 670

**Date:** 2026-05-23
**Scope:** P1 fixes from Sprint 669 audit — director dashboard query deduplication only
**Source:** `docs/PERFORMANCE_RUNTIME_AUDIT_669.md` (issues 1A, 1B, 1C)

---

## Fixes Applied

All three fixes are in a single file: `src/app/director/page.tsx`
No migrations. No RLS changes. No dependencies. No behavior changes.

### Fix 1A — Academies table: two queries → one

**Before:** Two separate Supabase calls to `academies` for the same row:
- `select('name')` → line 93
- `select('settings')` → line 137

**After:** Single `select('name, settings')` at line 93. Settings derived inline — no second call.

**Behavior change:** None. `academyName` and `onboardingSettings` are identical to before.

---

### Fix 1B — `academy_suggestions`: two queries → one

**Before:** Two separate queries:
- `select('priority')` with `status = 'pending'` → pendingSuggestionsCount + highPrioritySuggestionsCount
- `select('id')` with `status = 'pending'` and `suggestion_type = 'curriculum_gap'` → curricGapCount

**After:** Single `select('priority, suggestion_type')` with `status = 'pending'`.
All three derived values computed in-memory from the same result set.

**Behavior change:** None. `curricGapCount` now counts rows where `suggestion_type === 'curriculum_gap'`
within the same pending set — identical semantics to the prior two-query approach.

---

### Fix 1C — `player_curriculum_states`: two queries → one

**Before:** Two separate queries:
- `select('player_id')` (no filter) → playersWithLevel count
- `select('player_id')` with `advancement_eligible = true` → advancementReadyCount

**After:** Single `select('player_id, advancement_eligible')` (no advancement_eligible filter).
`advancementReadyCount` derived by filtering in-memory where `advancement_eligible === true`.
`playersWithLevel` remains the total row count.

**Behavior change:** None. Values are identical.

---

## Query Count Impact

| Metric | Before | After | Delta |
|---|---|---|---|
| Supabase queries per director dashboard load | 19 | 16 | −3 |
| Queries to `academies` | 2 | 1 | −1 |
| Queries to `academy_suggestions` | 2 | 1 | −1 |
| Queries to `player_curriculum_states` | 2 | 1 | −1 |

---

## Manual Verification Checklist

- [x] Director dashboard `academyName` renders correctly (from merged academy query)
- [x] Director dashboard `onboardingSettings` / `hasAcademyDna` logic unchanged
- [x] `pendingSuggestionsCount` and `highPrioritySuggestionsCount` unchanged
- [x] `curricGapCount` unchanged (same `suggestion_type = 'curriculum_gap'` filter, now applied in-memory)
- [x] `playersWithLevel` unchanged (total curriculum state rows)
- [x] `playersWithoutLevel` unchanged (derived from playersWithLevel)
- [x] `advancementReadyCount` unchanged (filtered from same row set)
- [x] DONNA still opens/answers — no DONNA code touched
- [x] Review center still renders — not touched
- [x] Parent/player pages still render — not touched
- [x] Support diagnostics still role-restricted — not touched
- [x] No new data exposure — only query consolidation

---

## Deferred Items (P2/P3 — unchanged from Sprint 669)

| ID | Priority | Description |
|---|---|---|
| D1 | P2 | Review center: consolidate 11 proposer profile lookups into 1 |
| D2 | P2 | Coach home: merge getCoachWorkspaceSummary + loadWrapUpSessionSelector |
| D3 | P2 | Player home: consolidate 12-query chain into backend function |
| D4 | P2 | Parent home: consolidate 14-query chain |
| D5 | P2 | Add `unstable_cache` for quasi-static data |
| D6 | P3 | DONNA bundle: audit per-route import impact as DONNA pages expand |
| D7 | P3 | Recharts: confirm not imported on heavy entry pages |

---

## TypeScript
Clean. No errors in touched files or transitively affected files.
