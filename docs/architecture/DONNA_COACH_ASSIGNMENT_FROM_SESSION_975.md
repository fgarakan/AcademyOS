# DONNA Coach Assignment From Session — Sprint 975

**Date:** 2026-05-30
**Sprint:** 975
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 975 adds DONNA highlight coverage for coach assignment on session detail pages and creates a dedicated chip set for session detail routes. Coach assignment itself was already built as part of the session generation workflow (Sprint 974/GenerateSessionFromTemplateButton).

---

## V1 Coach Assignment Architecture

**Assignment at creation time (existing):**
- Director generates a session from a template via `GenerateSessionFromTemplateButton`
- Coach dropdown shown at creation — director selects the assigned coach
- Assignment stored as `sessions.coach_id` in DB
- Coach immediately sees the session in their assigned sessions list

**Session detail display:**
- `sessions/[sessionId]/page.tsx` fetches `coach_id` and resolves the coach's display name
- Coach name shown in the session header metadata row
- Sprint 975: `data-donna-focus-id="session-coach-assignment"` added to the coach name span

---

## Files Changed

| File | Change |
|---|---|
| `src/app/director/sessions/[sessionId]/page.tsx` | Added `data-donna-focus-id="session-coach-assignment"` to coach name span |
| `src/lib/donna/donnaPageChipRegistry.ts` | Added session detail chip set (`/director/sessions/` prefix) with 4 chips |

---

## Session Detail Chip Set (New)

Route: `/director/sessions/` (prefix — covers all detail pages)

| ID | Label | Action | Target |
|---|---|---|---|
| `ses-detail-coach` | Highlight coach assignment | highlight | `session-coach-assignment` |
| `ses-detail-blocks` | Highlight session blocks | highlight | `session-blocks` (pre-existing) |
| `ses-detail-group` | Highlight group assignment | highlight | `session-group-assignment` (pre-existing) |
| `ses-detail-next` | What should I do next? | prompt | — |

---

## V2 — In-Session Coach Reassignment

V1 limitation: Once a session is created, there is no UI to reassign the coach from the session detail page. The coach assignment can only be changed by:
1. Deleting the session and recreating it with a different coach (not recommended)
2. Direct database update (requires Supabase access)

V2 should add:
- A "Reassign Coach" action on the session detail page that updates `sessions.coach_id`
- This action should go through `proposed_actions` pipeline if the session is already in progress
- DONNA should be able to surface this action when the director says "change coach for this session"

---

## No-Mutation / No-Migration Guarantee

- Adding `data-donna-focus-id` attribute has no runtime behavior
- No session records changed
- No coach records changed
- No DB schema changes
- No RLS changes
