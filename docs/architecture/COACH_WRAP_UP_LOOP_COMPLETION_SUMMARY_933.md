# Coach Wrap-Up Loop Completion Summary — Architecture

**Sprint:** 933 | **Date:** 2026-05-29

---

## Summary

Sprint 933 adds a loop completion summary card to the coach wrap-up review page. It derives a human-friendly loop state from data already loaded on the page (no new queries), giving coaches a clear "where are we?" answer before they read the detailed sections below.

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Added `deriveLoopState` helper, loop state/count computation, loop summary card JSX |

---

## State derivation — pure function, no queries

`deriveLoopState(wrapUpStatus, obs[])` uses only:
- `action.status` (already loaded)
- `obsDrafts[].status` (already loaded by Sprint 932)

```
Inputs:
  wrapUpStatus: string
  obs: Array<{ status }>

Logic:
  wrapUpStatus === 'pending_review' → 'pending'
  wrapUpStatus === 'rejected'       → 'wrapup_rejected'  ← existing banner handles; no card shown
  obs.any(clarification_needed)     → 'needs_attention'
  obs.any(pending_review)           → 'pending'
  obs.any(rejected)                 → 'needs_revision'
  obs.any(approved)                 → 'partial'   ← approved but not applied
  otherwise                         → 'complete'
```

**Why this order matters:**
- `clarification_needed` is checked before `pending_review` — director's open question is more urgent than a general "still waiting" state.
- `rejected` is checked after pending/clarification — if some items are pending AND some are rejected, the coach needs to deal with the pending ones first.

---

## Loop states and displayed copy

| LoopState | Headline | Explanation | Color |
|---|---|---|---|
| `pending` | "Waiting for director review" | "Your recap has been submitted. You'll see updates here after your director reviews it." | Neutral |
| `needs_attention` | "Director has questions" | "Your director has questions about some player notes. Check the details below and follow up." | Orange |
| `needs_revision` | "Some notes need revision" | "Your director could not approve some player notes. See the details below." | Red |
| `partial` | "Reviewed — waiting to be applied" | "Your recap was reviewed. Some player notes are approved and waiting to be added to official records." | Lime |
| `complete` (with notes) | "Loop complete" | "Your recap and N player note(s) are now in the official record." | Green |
| `complete` (no notes) | "Loop complete" | "Your session recap is now in the official record." | Green |
| `wrapup_rejected` | *(not shown)* | Existing status banner handles this | — |
| `null` (no action) | *(not shown)* | Existing "no submission yet" card handles this | — |

---

## Count chips

Shown only when `totalNotes > 0`. Labels:
- Applied (green)
- Approved (lime)
- Pending review (blue)
- Director has questions (orange)
- Needs revision (red)

---

## Page layout after Sprint 933

1. Top nav
2. Page header (session name + date)
3. **Sprint 933 — Loop summary card** ← new (hidden when no submission, hidden for wrapup_rejected)
4. "No submission yet" card (if !action)
5. Submission review (status banner + DONNA answers + blocks + ...) (if action)
6. "Your player notes" (Sprint 932)
7. Back to session

The existing status banner (item 5) remains — it shows the session wrap-up status specifically. The loop summary card (item 3) shows the combined loop status. Both coexist: the card is the high-level view, the banner is the per-item detail.

---

## Safety invariants

| Invariant | Status |
|---|---|
| No new queries added | ✅ — derived from existing data |
| No parent/player communication | ✅ |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject unchanged | ✅ |
| Sprint 932 "Your player notes" unchanged | ✅ |
| Sprint 931 director review queue unchanged | ✅ |
| No raw IDs in UI | ✅ |
| No raw DB status names in UI | ✅ |
| No mutations of any kind | ✅ |
