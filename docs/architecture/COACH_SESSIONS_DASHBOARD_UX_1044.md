# Coach Assigned Sessions Dashboard UX Polish — Sprint 1044

**Sprint:** 1044 — Coach Assigned Sessions Dashboard UX Polish V1
**Date:** 2026-05-31
**File changed:** `src/app/coach/page.tsx`

---

## Problems identified

### Problem 1 — Three DONNA entry points for coaches

Before this sprint, the coach home page had:
1. Bottom tab bar "DONNA" → `/coach/donna`
2. Floating `DonnaAssistantButton` (sidebar) — always visible
3. **DONNA Coach Assistant card** in the page body → `/coach/donna`

The DONNA standard: "One DONNA button. One sidebar." The body card was redundant. Coaches can reach DONNA via the bottom tab or the floating button.

Additionally, the DONNA card repeated the pending wrap-up count that was already shown in the orange alert at the top of the page — a second instance of the same signal.

### Problem 2 — Quick Actions duplicated the bottom tab bar

The "Quick Actions" section at the bottom of the page showed two cards:
- "My Sessions" → `/coach/sessions`
- "My Players" → `/coach/players`

These are identical to the Sessions and Players bottom tab bar entries. Every coach sees these links in the persistent nav bar on every page. The Quick Actions grid added no new paths.

---

## Changes made

**Removed:**
1. `DONNA Coach Assistant` body card (full blue bordered card linking to `/coach/donna`)
2. `Quick Actions` section ("My Sessions" + "My Players" icon-grid)
3. Unused `Sparkles` import (was only used by the DONNA card)

**Preserved:**
- Wrap-up alert (top of page, orange, links to sessions)
- Quick stats row (Today, Players, Notes)
- Daily Brief card (next session focus)
- Today's sessions section (`data-donna-focus-id="coach-today-sessions"`)
- Players & Notes two-column grid (`data-donna-focus-id="coach-players-section"`)
- On-Court Capture section (`CoachOnCourtActionsBar`)
- Bottom tab bar entries unchanged
- Floating DONNA button unchanged
- `/coach/donna` route unchanged

---

## DONNA targets preserved

| ID | Element |
|---|---|
| `coach-wrapup-alert` | Orange wrap-up pending alert |
| `coach-today-sessions` | Today's sessions section |
| `coach-players-section` | Players & Notes section |
