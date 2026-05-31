# Director Dashboard Surface Audit — Sprint 1033

**Date:** 2026-05-31
**Sprint:** 1033

---

## Summary

The director dashboard (`/director/page.tsx`) has 11 surfaces. 4 create competing attention. 2 should be removed in Sprint 1034.

---

## Surface inventory

| Surface | Location | Conflict | Action |
|---|---|---|---|
| Hero Header | top | none | keep_simplify |
| AcademyHealthBadgeWithDrawer | top | equal_weight | keep_simplify |
| **DonnaDashboardOpenCard** | top | **duplicates_primary** | **REMOVE** |
| **DirectorTodayCommandCenter** | top | **equal_weight** | **REPLACE** |
| Today's Pulse grid | top | equal_weight | keep |
| AcademyKpiCardsSection | mid | none | keep |
| DirectorKpiHealthSection | mid | none | keep |
| LiveActivityCard | mid | duplicates_primary | collapse (defer) |
| NextBestActionCard | bottom | none | remove_when_live |
| DirectorDnaStatusBadge | bottom | none | collapse (defer) |
| DirectorContinueSetupPanel | bottom | none | remove_when_live |

---

## 3 competing pairs

1. `DonnaDashboardOpenCard` vs `DirectorTodayCommandCenter` — both show urgency + CTA at top
2. `Today's Pulse grid` vs `DirectorTodayCommandCenter` — both show review queue count
3. `LiveActivityCard` vs `Today's Pulse grid` — both show sessions + pending items

---

## Sprint 1034 plan

**Remove:** `DonnaDashboardOpenCard`, `DirectorTodayCommandCenter`  
**Add:** `DirectorPrimaryActionHero` (Sprint 1024, already built)  
**Keep:** Today's Pulse grid, KPI sections, conditional setup cards  
**Defer:** LiveActivityCard simplification, hero font size reduction

**Expected result:** 3 competing top-of-page CTAs → 1 clear primary action + 3 compact ambient count tiles

---

## Why it's safe to remove TodayCommandCenter

`DirectorTodayCommandCenter` serves: "what needs the director's attention today?" This is exactly what `DirectorPrimaryActionHero` answers — but `PrimaryActionHero` does it as a single actionable line rather than a full section with multiple items.

The detail of all attention queue items is still accessible via:
- The primary action CTA (links to /director/review for review queue items)
- The Today's Pulse grid (ambient count tiles with direct links)
- DONNA (ask "what needs my attention?" for the full picture)

---

## Why it's safe to remove DonnaDashboardOpenCard

`DonnaDashboardOpenCard` exists to encourage directors to open DONNA. Since Sprint 1028-1029:
- DONNA has a persistent session toggle button (always visible, bottom-right)
- DONNA minimizes instead of closing (session preserved)
- The lime dot indicator shows when DONNA has context
- The primary action hero already surfaces the most important item

The card's secondary purpose (showing alert count) is covered by the Pulse grid.
