# Coach Assigned Sessions Dashboard — Sprint 976

**Date:** 2026-05-30
**Sprint:** 976
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 976 confirms that the coach assigned sessions dashboard is already complete and adds DONNA highlight coverage for the key sections coaches need to see.

---

## Existing Coach Dashboard Architecture

**`src/app/coach/page.tsx`**

The coach home page shows:

| Section | What It Shows | Focus ID |
|---|---|---|
| Wrap-up alert | Orange banner when sessions need wrap-ups | `coach-wrapup-alert` (new Sprint 976) |
| Quick stats | Today's sessions, player count, recent notes | — |
| Daily Brief card | Next session focus, time, status, wrap-up state | — |
| Today's Sessions | Session name, time, status pill, wrap-up badge | `coach-today-sessions` (Sprint 818) |
| Players section | Assigned players with level/group | `coach-players-section` (Sprint 818) |
| DONNA panel | Session-aware prompts | — |

**Session status badges:** planned, in_progress, completed, cancelled

**Wrap-up badges:** Needs Wrap-Up, Draft Submitted, Wrap-Up Done

---

## What Sprint 976 Added

### `src/app/coach/page.tsx`

Added `data-donna-focus-id="coach-wrapup-alert"` to the wrap-up alert `<Link>` element. This element is conditional — it only renders when `pendingWrapUpCount > 0`. DONNA highlights it gracefully when present; fails gracefully when absent.

### `src/lib/donna/donnaPageChipRegistry.ts`

Added chip set for `/coach` (exact match) with 4 chips:
- "Highlight today's sessions" → `coach-today-sessions`
- "Highlight wrap-ups needed" → `coach-wrapup-alert`
- "Highlight player list" → `coach-players-section`
- "What should I do next?" → prompt

---

## V2 Improvements

- Show upcoming sessions (next 7 days) on the coach home page with a separate section
- Show group name in the today's sessions list (currently not shown inline)
- Show template name/focus in the session list
- Add "Start Session" CTA that puts the session in_progress directly from the home page

---

## No-Mutation / No-Migration Guarantee

- `data-donna-focus-id` attribute has no runtime behavior
- No session records changed
- No coach records changed
- No parent/player communications sent
- No schema changes
