# Coach Session Wrap-Up Status Wiring — Architecture

**Sprint:** 928 | **Date:** 2026-05-29

---

## Summary

Sprint 928 surfaces wrap-up review status on the coach home page so coaches can see whether a session wrap-up is needed, pending director review, approved, or requires revision — without navigating into each session detail page.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/coach/wrapUpStatusMap.ts` | New read-only batch loader for wrap-up draft status from `proposed_actions` |
| `src/app/coach/_components/CoachDailyBriefCard.tsx` | Added `wrapUpStatus` + `sessionStatus` props; wrap-up status strip in footer |
| `src/app/coach/page.tsx` | Calls `loadWrapUpStatusMap`; passes status to DailyBriefCard; adds badge to session list |

---

## Data flow

```
proposed_actions (target_module = 'session_wrap_up_v1')
    ↓ loadWrapUpStatusMap (batch, by session ID, academy_id scoped)
    ↓ wrapUpStatusMap: Record<sessionId, WrapUpDisplayStatus>
    ↓
CoachDailyBriefCard ← wrapUpStatus + sessionStatus (props, read-only)
Today's session list ← deriveWrapUpBadge() (local pure function, no DB)
```

---

## `loadWrapUpStatusMap`

- Queries `proposed_actions` where `target_module = 'session_wrap_up_v1'` and `target_object_id IN sessionIds` and `academy_id = academyId`
- Orders by `created_at DESC` — takes only the most recent proposed_action per session
- Maps raw DB `status` to `WrapUpDisplayStatus` (safe string union)
- Uses `rawDb = db as any` — consistent with established pattern (`director.ts`, session detail page)
- Returns `{}` when called with empty session list — safe fallback
- Called with best-effort try/catch in coach home — failure does not prevent page render

## `WrapUpDisplayStatus`

```ts
type WrapUpDisplayStatus =
  | 'not_started'       // no proposed_action found
  | 'pending_review'    // status = 'pending_review'
  | 'approved'          // status = 'approved'
  | 'executed'          // status = 'executed'
  | 'rejected'          // status = 'rejected'
  | 'clarification_needed'  // status = 'clarification_needed'
```

`'not_started'` is a computed value — it is never written to `proposed_actions`. It represents the absence of a record.

---

## Display rules

### CoachDailyBriefCard wrap-up strip

Shown when: `sessionStatus === 'completed'` OR `wrapUpStatus` is not `undefined`/`not_started`.

Hidden when: Session is not completed AND no draft exists yet (upcoming/in-progress session with no submission).

| Status | UI | CTA |
|---|---|---|
| `not_started` + completed | Orange dot "Wrap-up needed" | Links to `/wrap-up` |
| `pending_review` | Pulsing blue dot "Pending review" | Links to session detail |
| `approved` | Green dot "Approved" | No CTA |
| `executed` | Green dot "Applied" | No CTA |
| `rejected` | Red dot "Needs revision" | Links to `/wrap-up` |
| `clarification_needed` | Orange dot "Director has questions" | Links to session detail |

### Session list badge

Small badge appended after session status. Shown only for relevant combinations:
- `not_started` + `completed` → "Wrap-up needed" (orange)
- `pending_review` → "Pending review" (blue)
- `approved` → "Approved" (green)
- `executed` → "Applied" (green)
- `rejected` → "Needs revision" (red)
- `clarification_needed` → "Director has questions" (orange)
- `not_started` + non-completed → no badge (correct: wrap-up not needed yet)

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — read-only query only |
| No player level movement | ✅ — not touched |
| No curriculum mutation | ✅ — not touched |
| No roster/placement change | ✅ — not touched |
| Sprint 904 approve/reject paths unchanged | ✅ — `proposed_actions` not written |
| CoachWrapUpDrawer unchanged | ✅ — not touched |
| `proposed_actions` approval pipeline unchanged | ✅ — read only |
| RLS / academy_id scoping | ✅ — query scoped to academyId |
| Raw IDs not shown in UI | ✅ — only human-friendly labels |
| Raw DB status names not in UI | ✅ — mapped to display labels |
| Failure degrades gracefully | ✅ — try/catch, home renders without status |

---

## Known limitations

- `wrapUpStatusMap` is queried for today's sessions only. Sessions from prior days (shown in session list via sessions tab) do not get wrap-up status on home page — only in session detail.
- `CoachWrapUpStatusCard` in session detail page is untouched. Sprint 928 adds home-level overview only; session detail retains its richer status card.
- The daily brief card shows status for the "next" session (first non-completed, or first of day). If the next session is upcoming (status = 'planned'), wrap-up strip is hidden, which is correct behavior.
