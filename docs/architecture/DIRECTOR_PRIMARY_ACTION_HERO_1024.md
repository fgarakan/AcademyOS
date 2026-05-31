# Director Dashboard One-Primary-Action Redesign — Sprint 1024

**Date:** 2026-05-31
**Sprint:** 1024
**Status:** Component built — not yet wired to page (Sprint 1026)

---

## Problem addressed

Sprint 1023 audit identified `primary_action_focus` as critical:
> "Multiple sections compete equally — review queue, KPI summary, sessions, players all similar weight"

Directors open the dashboard not knowing what to do first.

---

## Solution: `DirectorPrimaryActionHero`

A single "what to do right now" block at the top of the director dashboard. One CTA. No competing actions. Priority computed from live signals.

---

## Priority resolution order

| Priority | Condition | Action |
|---|---|---|
| 1 | Critical attention item | "Handle now" → item's href |
| 2 | pendingReviewCount > 0 | "Review N items" → /director/review |
| 3 | pendingPlacementCount > 0 | "Place players" → /director/players |
| 4 | High attention item | "Review" → item's href |
| 5 | (default) | "Academy is on track" → /director/curriculum |

---

## Urgency visual states

| Urgency | Border | Background | CTA |
|---|---|---|---|
| critical | status-red/40 | status-red/5 | Red button |
| high | status-orange/30 | status-orange/5 | Lime button |
| normal | border | surface | Lime button |

---

## Design principles enforced

- One lime button per state (never two)
- Secondary content (subtext) is de-emphasized
- Icon matches urgency (AlertCircle for critical/high, CheckCircle2 for normal)
- Greeting contextualizes ("Good morning, [name]." or "Director Dashboard.")

---

## V1 limitation

Not yet wired to `/director/page.tsx`. Sprint 1026 (Golden Path UX Simplification) adds it to the top of the page content area and verifies visually.
