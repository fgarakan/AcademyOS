# Coach Session Detail Execution View — Sprint 977

**Date:** 2026-05-30
**Sprint:** 977
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 977 confirms that the coach session detail execution view is already complete and adds DONNA highlight coverage for all key sections coaches interact with during session execution.

---

## Existing Coach Session Detail Architecture

**`src/app/coach/sessions/[sessionId]/page.tsx`**

The coach session detail page already shows:

| Section | Content | Focus ID |
|---|---|---|
| Session header | Name, date, time, duration, template name, curriculum level, goal, block rail, "Open focused execute view" link | `coach-session-header` (new Sprint 977) |
| Player watch list | Players in session with curriculum level | `coach-player-watch-list` (pre-existing) |
| Today's lesson plan | Curriculum drills, coach cues, block structure | `coach-lesson-plan` (pre-existing) |
| Run session | Execution controls, block progress | `coach-run-session` (pre-existing) |
| Wrap-up link | Start Wrap-Up CTA with session status awareness | `coach-wrap-up-link` (pre-existing) |
| DONNA entry | Session-aware DONNA prompts for wrap-up assistance | — |

**Execute view:** `/coach/sessions/[id]/execute` — focused block execution mode

---

## What Sprint 977 Added

### `src/app/coach/sessions/[sessionId]/page.tsx`

Added `data-donna-focus-id="coach-session-header"` to the session header `<div>`. Contains: session name, date/time, duration, template/level badges, goal text, block progress rail, and "Open focused execute view" link.

### `src/lib/donna/donnaPageChipRegistry.ts`

Added chip set for `/coach/sessions/` (prefix, covers all coach session detail pages) with 5 chips:
- "Highlight session info" → `coach-session-header`
- "Highlight today's plan" → `coach-lesson-plan`
- "Highlight run session" → `coach-run-session`
- "Highlight wrap-up" → `coach-wrap-up-link`
- "What should I do next?" → prompt

---

## Focus ID Coverage (Post-977)

| Section | Focus ID | Source |
|---|---|---|
| Session header | `coach-session-header` | Sprint 977 (new) |
| Player watch list | `coach-player-watch-list` | Pre-existing |
| Lesson plan | `coach-lesson-plan` | Pre-existing |
| Run session | `coach-run-session` | Pre-existing |
| Wrap-up CTA | `coach-wrap-up-link` | Pre-existing |

---

## No-Mutation / No-Migration Guarantee

- `data-donna-focus-id` attribute has no runtime behavior
- No session records changed
- No coach records changed
- No wrap-up logic changed
- No schema changes
