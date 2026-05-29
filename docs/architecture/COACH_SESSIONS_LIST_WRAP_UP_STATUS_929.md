# Coach Sessions List Wrap-Up Status — Architecture

**Sprint:** 929 | **Date:** 2026-05-29

---

## Summary

Sprint 929 aligns the `/coach/sessions` sessions list page with the Sprint 928 wrap-up status standard. It replaces the page's inline `proposed_actions` status query with the `loadWrapUpStatusMap` helper, aligns badge labels to Sprint 928 language, and adds a "Wrap-up needed" badge for completed session rows with no draft.

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/sessions/page.tsx` | Replaced inline query with `loadWrapUpStatusMap`; aligned labels; added "Wrap-up needed" badge for completed rows |

---

## What existed before Sprint 929

The sessions page already had a partial implementation:
- `wrapUpStatusMap: Map<string, string>` populated via an inline `proposed_actions` query
- `WrapUpBadge` component showing badges for submitted drafts
- `SessionCard` and `SessionRow` already accepted `wrapUpStatus` prop

Gaps:
1. Labels did not match Sprint 928 ("Wrap-up pending" vs "Pending review", "Not approved" vs "Needs revision", "Clarification needed" vs "Director has questions")
2. No "Wrap-up needed" badge on individual completed rows (only the section banner)
3. Inline query duplicated logic already in `loadWrapUpStatusMap`

---

## Changes in Sprint 929

### 1. Replace inline query with `loadWrapUpStatusMap`

Before:
```ts
const wrapUpStatusMap = new Map<string, string>()
// inline rawDb query → wrapUpStatusMap.set(...)
```

After:
```ts
let wrapUpStatusRecord: Record<string, WrapUpDisplayStatus> = {}
// try { wrapUpStatusRecord = await loadWrapUpStatusMap(...) } catch { }
```

Access changes from `wrapUpStatusMap.get(s.id)` to `wrapUpStatusRecord[s.id]`.

### 2. `WrapUpBadge` — aligned labels and "Wrap-up needed"

| Status | Before | After |
|---|---|---|
| `pending_review` | "Wrap-up pending" | "Pending review" |
| `approved` | "Wrap-up approved" | "Approved" |
| `executed` | "Wrap-up applied" | "Applied" |
| `clarification_needed` | "Clarification needed" | "Director has questions" |
| `rejected` | "Not approved" | "Needs revision" |
| `not_started` + completed | (not shown) | "Wrap-up needed" (orange) |
| `not_started` + non-completed | (not shown) | (not shown — correct) |

### 3. `sessionCompleted` prop

`WrapUpBadge` now accepts `sessionCompleted?: boolean`. Both `SessionCard` and `SessionRow` compute `session.status === 'completed'` and pass it through. Upcoming/planned sessions pass `false` (or omit), suppressing the "Wrap-up needed" badge.

---

## Protected behavior (unchanged)

- "WRAP-UPS NEEDED" section banner — still uses `loadWrapUpSessionSelector` (voice_notes signal). Not touched.
- `loadWrapUpSessionSelector` import and all its logic — unchanged.
- `DonnaOpenChip` in the banner section — unchanged.
- All session navigation (row/card Links) — unchanged.
- Sprint 904 approve/reject paths — not touched.
- `CoachWrapUpDrawer` — not touched.

---

## Data flow

```
proposed_actions (target_module = 'session_wrap_up_v1')
    ↓ loadWrapUpStatusMap (batch, academy_id-scoped, best-effort)
    ↓ wrapUpStatusRecord: Record<sessionId, WrapUpDisplayStatus>
    ↓
SessionCard  → WrapUpBadge(wrapUpStatus, sessionCompleted=session.status==='completed')
SessionRow   → WrapUpBadge(wrapUpStatus, sessionCompleted=isCompleted)
```

---

## Notes on `proposed_by_id` filter

The previous inline query filtered by `proposed_by_id: user.id` (coach's own wrap-ups). `loadWrapUpStatusMap` is academy-scoped only. This is functionally equivalent because:
- Sessions are already filtered to `coach_id = coachId` (the logged-in coach's sessions)
- A coach's sessions have that coach's wrap-up drafts
- RLS provides `academy_id` as the foundational safety boundary

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — read-only |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| proposed_actions pipeline unchanged | ✅ — read only |
| academy_id scoping | ✅ — in loadWrapUpStatusMap |
| Raw IDs not shown in UI | ✅ |
| Raw DB status names not in UI | ✅ |
| Best-effort loading | ✅ — try/catch, page renders without badges if query fails |
