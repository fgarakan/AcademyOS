# Sprint 803 — Director Dashboard Rebuild V1

**Date:** 2026-05-25
**Sprint:** 803
**Type:** UX rebuild — dashboard section reorder + duplicate surface removal
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 799 audit scored the Director Dashboard cognitive load at **40/100** with these root causes:

| Blocker | Impact |
|---|---|
| `AcademyKpiCardsSection` (8 cards) appears above the fold, between the command center and action surfaces | 8 equal-weight cards compete for attention before the director can take any action |
| 3 separate "needs attention" surfaces | `DirectorTodayCommandCenter` + `AcademyAlertsPanel` + `Priority Queue` card all answer "what needs my attention" differently |
| `DonnaDashboardPresenceCTA` at page bottom | Duplicates the attention summary already shown at the top of the page; creates cognitive echo |

Sprint 803 closes two of these with zero backend risk.

---

## Changes

### 1. `AcademyKpiCardsSection` moved below Sessions + Quick Actions

**Before (order):**
```
1. Hero Header
2. DirectorTodayCommandCenter   ← "what needs attention today?"
3. AcademyKpiCardsSection       ← 8-card KPI snapshot (blocks action items)
4. Sessions This Week           ← "what should I do next?"
5. Quick Actions
...
```

**After (order):**
```
1. Hero Header
2. DirectorTodayCommandCenter   ← PRIMARY: "what needs attention today?"
3. Sessions This Week           ← SECONDARY: "what should I do next?"
4. Quick Actions                ← TERTIARY: navigation shortcuts
5. AcademyKpiCardsSection       ← SUPPORTING: KPI data for directors who need it
...
```

**Rationale:** KPIs are supporting data. The director's primary job when opening the dashboard is:
1. Is there anything I need to do right now? (command center)
2. What's happening in my academy this week? (sessions)
3. Where do I need to go? (quick actions)

KPI metrics are for analysis, not action. Moving them below the action surfaces reduces above-the-fold cognitive load without removing any data.

**Implementation:** Moved the `<AcademyKpiCardsSection>` JSX block from between `DirectorTodayCommandCenter` and "Sessions This Week" to between "Quick Actions" and "Roster Signals".

---

### 2. `DonnaDashboardPresenceCTA` removed

**Before:** At the bottom of the Academy Setup section, `DonnaDashboardPresenceCTA` rendered a "DONNA sees X items needing attention" card that repeated the same attention counts already shown at the top of the page.

**After:** Removed. The comment is retained in code for clarity.

**Rationale:** Three "needs attention" surfaces → two. `DirectorTodayCommandCenter` (top of page) + `AcademyAlertsPanel` (Roster Signals section) now cover the attention surface. The duplicated CTA at the bottom was causing directors to feel the dashboard was overwhelming — same data, shown 3× in different frames.

**Import:** `DonnaDashboardPresenceCTA` import is commented out (not deleted) in case it's needed later.

---

## Before/after: dashboard section order

| Position | Before Sprint 803 | After Sprint 803 |
|---|---|---|
| 1 | Hero Header | Hero Header |
| 2 | DirectorTodayCommandCenter | DirectorTodayCommandCenter |
| 3 | **AcademyKpiCardsSection** | Sessions This Week |
| 4 | Sessions This Week | Quick Actions |
| 5 | Quick Actions | **AcademyKpiCardsSection** |
| 6 | Roster Signals | Roster Signals |
| 7 | Academy Health Signals | Academy Health Signals |
| 8 | Health Chart + Live Activity | Health Chart + Live Activity |
| 9 | Curriculum Coverage | Curriculum Coverage |
| 10 | First template prompt | First template prompt |
| 11 | DirectorKpiHealthSection | DirectorKpiHealthSection |
| 12 | Academy Setup (with CTA) | Academy Setup (CTA removed) |

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ JSX reorder only |
| No RLS change | ✅ Not touched |
| No data removed | ✅ All data still displayed, just reordered |
| `AcademyKpiCardsSection` all props unchanged | ✅ Same props, new position |
| `DonnaDashboardPresenceCTA` import commented (not deleted) | ✅ Recoverable |
| No new packages | ✅ None |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Estimated score lift after Sprint 803

| Dimension | Sprint 799 audit | Sprint 803 estimate |
|---|---|---|
| Dashboard Cognitive Load | 40/100 | ~58/100 |

**Key gains:**
- Above-fold action signal: Command center is now unobstructed by KPI cards (+10 pts)
- "Needs attention" surfaces: 3 → 2 (CTA removed) (+8 pts)
- Section hierarchy: Action → Navigation → Data is now the correct order (+5 pts)

---

## Recommended Sprint 804

**Suggested:** DONNA–Dashboard Integration V1

Sprint 803 reduced dashboard cognitive load. Sprint 804 should wire DONNA into the dashboard surface — show DONNA's last response as an inline card at the top of the dashboard when the panel is open or was recently used. This closes the "no inline DONNA context on dashboard" gap identified in the Sprint 799 audit.
