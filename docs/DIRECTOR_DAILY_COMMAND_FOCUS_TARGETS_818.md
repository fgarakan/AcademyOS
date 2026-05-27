# Sprint 818 — Director Daily Command Focus Targets V1

**Date:** 2026-05-25
**Sprint:** 818
**Type:** Feature implementation
**Files changed:** 1 source file + 2 docs

---

## What this sprint delivers

Adds `data-donna-focus-id` attributes to the Director Daily Command page (`/director`) so that DONNA's teal highlight runtime (Sprint 817) can scroll to and glow the exact section DONNA is talking about when she navigates the director to `/director`.

---

## Focus Targets Added

| data-donna-focus-id | Element | DONNA command trigger |
|---|---|---|
| `today-command-center` | Wrapper around `<DirectorTodayCommandCenter>` | "What do I need to do today?", "What should I do first?" |
| `todays-pulse` | Grid div containing the 3 pulse tiles | "Show me what needs attention" |
| `review-queue-card` | Inner div of the review queue pulse tile | "Show review queue", "What should I do first?" |
| `player-attention-card` | Inner div of the player attention pulse tile | "What players need attention?" |
| `sessions-this-week-card` | Inner div of the sessions this week tile | "Show sessions" |
| `academy-metrics-section` | Wrapper div around Academy Metrics CollapsibleSection | (future DONNA command) |
| `alerts-placement-section` | Wrapper div around Alerts & Placement CollapsibleSection | (future DONNA command) |

---

## How it works

1. Director says "What do I need to do today?" to DONNA
2. `dispatchUIIntent` returns `kind: 'navigate'`, `route: '/director'`, `focusTarget.targetId: 'today-command-center'`
3. `handleUIDispatch` in `DonnaAssistantButton.tsx` calls `setDonnaFocusTarget(result.focusTarget)` then `router.push('/director')`
4. `DonnaHighlightBanner` fires on pathname change to `/director`
5. `querySelector('[data-donna-focus-id="today-command-center"]')` finds the element
6. Element scrolls into view, `donna-focus-ring` class applied (teal glow)
7. Badge appears: "DONNA is pointing here — Daily Command"
8. Auto-dismisses after 8 seconds

---

## No changes to

- Data fetching (no new queries)
- Component logic (only `data-` attributes added)
- Styling of the page sections (attributes are invisible until glow is applied)
- Any backend files, migrations, or RLS

---

## TypeScript

Clean — `npx tsc --noEmit` passes with no errors.
