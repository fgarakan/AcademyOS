# Replace DirectorTodayCommandCenter With Primary Action Hero — Sprint 1034

**Date:** 2026-05-31
**Sprint:** 1034

---

## What was removed

1. **`DonnaDashboardOpenCard`** (Sprint 804) — entry card that opened DONNA with an alert count. Removed because: DONNA is now persistently accessible via the floating button (Sprint 1028-1029), and the alert count duplicated the Pulse grid.

2. **`DirectorTodayCommandCenter`** (Sprint 767) — full attention queue section. Removed because: it competed visually with the Pulse grid (both showed review queue signals) and represented the same concept as `DirectorPrimaryActionHero` but at a higher cognitive cost.

---

## What was added

**`DirectorPrimaryActionHero`** (Sprint 1024) — one primary action line:
- Critical attention item → "Handle now" CTA
- Pending review items → "Review N items" → /director/review
- Pending placement → "Place players" → /director/players
- Default → "Academy is on track" → /director/curriculum

Props used:
- `pendingReviewCount={pendingWrapUpsCount + newRequests}` — same count as Pulse grid review tile
- `attentionQueue={attentionQueue}` — pre-built attention queue
- `pendingPlacementCount={pendingCount}` — players pending placement
- `firstName={directorDisplayName.split(' ')[0]}`

---

## What was kept

- Hero header (greeting + date)
- AcademyHealthBadgeWithDrawer
- Today's Pulse grid (3 count tiles) ← provides the detail that TodayCommandCenter showed
- AcademyKpiCardsSection
- DirectorKpiHealthSection
- LiveActivityCard
- NextBestActionCard (conditional, setup only)
- DirectorDnaStatusBadge
- DirectorContinueSetupPanel (conditional, setup only)

---

## Director dashboard layout after Sprint 1034

```
Hero Header (greeting, date, quick links, health badge)
↓
DirectorPrimaryActionHero  ← ONE clear action
↓
Today's Pulse grid         ← 3 ambient count tiles (review / attention / sessions)
↓
KPI sections               ← secondary information
↓
[conditional setup cards]
```

---

## Safety

- No mutations
- No data access changes
- All props come from existing computed values on the page
- `attentionQueue` is still built (unchanged) — now consumed by the hero instead of TodayCommandCenter
- The hero links to `/director/review` — existing Review Queue page handles all approvals

---

## Visual QA required

- Confirm DirectorPrimaryActionHero renders correctly at the top of the page
- Confirm lime CTA is visible and correct based on current review queue state
- Confirm Pulse grid is still visible below the hero
- Confirm no empty/white gap where DonnaDashboardOpenCard was
- Confirm `data-donna-focus-id="primary-action-hero"` can be highlighted by DONNA
