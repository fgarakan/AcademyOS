# DONNA Panel Page Chips 3+More Cap — Sprint 1094D

**Date:** 2026-06-01
**Sprint:** 1094D
**Scope:** Layout-only change — no backend, no logic, no migrations.

---

## Context

Sprints 1094A–C established the DONNA no-scroll command surface:
- 1094A: Docked input, top chip row capped to 3+More, history collapsed by default
- 1094B: Compact dock, min-h-0 active surface, tight dock padding
- 1094C: Live browser QA — all 4 desktop viewports passed. Found: `DonnaPanelPageChips`
  on `/director` rendered 6 chips wrapping to 2 rows (~110px), contributing to active-surface
  overflow after any response at 768px height.

Sprint 1094D applies the same 3+More pattern to `DonnaPanelPageChips`.

---

## Pre-1094D behavior

`DonnaPanelPageChips` on `/director` rendered 6 chips (`flex flex-wrap gap-1.5`):
- "Highlight today's pulse" (highlight)
- "Highlight review queue" (highlight)
- "Highlight academy metrics" (highlight)
- "Walk me through academy priorities" (brief)
- "What needs my attention?" (brief)
- "What should I do next?" (prompt)

At sm:w-96 (~384px panel width): chips wrapped to 2 rows, container height ~110px.

At 1366×768, the active surface (396px) after a single DONNA response:
- 6 chips (~110px) + response (~100px) + pills (~36px) + gaps (~44px) = ~290px → fits
- But after any additional content (welcome card still visible) → overflow

---

## Change made

**File**: `src/components/donna/DonnaPanelPageChips.tsx`

Added `showMore: boolean` state (default `false`), self-contained — no parent changes.

```tsx
const [showMore, setShowMore] = useState(false)
const visibleChips = showMore ? chips : chips.slice(0, 3)
```

- Default: shows first 3 chips + "More ↓" button when `chips.length > 3`
- Expanded: shows all chips + "Less ↑" button
- Escalation state (`escalatedIds`, `highlightCountsRef`) tracks all chips regardless of visibility — escalation indicator appears correctly when hidden chips become visible

---

## Post-1094D behavior (live-measured at 1366×768)

| State | Chips shown | Container height | Active overflow | Send visible |
|---|---|---|---|---|
| Default (3 chips) | 3 | 59px | **false** | ✅ |
| Expanded (6 chips) | 6 | 157px | true (expected) | ✅ |

Active surface default at 1366×768: **no overflow** — previously overflowed after Q1.

---

## What is NOT changed

| Feature | Status |
|---|---|
| Chip actions (highlight, brief, prompt) | Unchanged |
| Highlight escalation (teal-glow → warning pulse) | Unchanged — all chips tracked |
| `getChipsForRoute` chip registry | Unchanged |
| Top chip row (from Sprint 1094A) | Unchanged — separate component |
| DONNA backend, God Mode, voice | Unchanged |
| All other chip registrations | Unchanged |

---

## Acceptance criteria met

- [x] `/director` shows 3 chips by default
- [x] "More ↓" accessible → reveals all chips
- [x] "Less ↑" collapses back to 3
- [x] Active surface overflow: `false` at 1366×768 default state
- [x] Send/input visible at 1366×768: confirmed
- [x] All chip actions preserved
- [x] TypeScript: clean (0 errors)
