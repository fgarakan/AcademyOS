# Sprint 808 — Director KPI Reduction + Progressive Disclosure V1

**Date:** 2026-05-25
**Sprint:** 808
**Type:** UX — KPI card section restructure with progressive disclosure
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 805 certification blocker:

> **"`AcademyKpiCardsSection` still 8 equal-weight cards"** — All 8 cards render at equal visual priority above the fold, creating cognitive load with no hierarchy. A director scanning the dashboard can't tell which metric matters most.

Sprint 808 introduces a primary/secondary split with progressive disclosure.

---

## What changed

### `AcademyKpiCardsSection.tsx` — 8 → 4+4 with toggle

**Added `'use client'`** — required for `useState` to manage the toggle.

**4 primary cards** (always visible — require director decision or action):
1. **Attendance Exceptions** — pending review items
2. **Coach Recaps** — awaiting director review
3. **Level-Up Candidates** — advancement decisions pending
4. **Academy Health %** — single health score as a bellwether

**4 secondary cards** (revealed by "View all metrics" toggle):
1. Today's Sessions — also visible in Sessions This Week section above
2. Parent Updates — less time-critical
3. Curriculum Execution % — contextual metric
4. Player Progress — good-to-know, no immediate action needed

**Toggle:** A minimal text button below the primary row. Default: collapsed.
- Collapsed: "▾ View all metrics (4 more)"
- Expanded: "▴ Show fewer metrics"

**Sublabel update:** "Live counts across your academy" → "Priority metrics." (more accurate for the primary-only default view)

---

## Card ordering rationale

| Priority | Card | Why primary? |
|---|---|---|
| 1 | Attendance Exceptions | Director must review — time-sensitive |
| 2 | Coach Recaps | Director must review before data decays |
| 3 | Level-Up Candidates | Director decision unlocks player advancement |
| 4 | Academy Health % | Single health signal — highest-level summary |

| Secondary | Card | Why secondary? |
|---|---|---|
| 5 | Today's Sessions | Already visible in Sessions This Week section |
| 6 | Parent Updates | Lower urgency than recap/attendance review |
| 7 | Curriculum Execution % | Contextual, not action-triggering |
| 8 | Player Progress | Informational, no immediate action needed |

---

## Before / after

**Before Sprint 808:**
```
[Sessions] [Attendance] [Recaps] [Level-Up]
[Parents]  [Health]     [Curric]  [Progress]
8 equal-weight cards — no priority signal
```

**After Sprint 808:**
```
[Attendance] [Recaps] [Level-Up] [Health]  ← 4 primary, always visible
[▾ View all metrics (4 more)]              ← toggle
  → expands to show Sessions / Parents / Curriculum / Progress
```

---

## Props interface: unchanged

All 9 props retained — no changes to how the parent `page.tsx` calls this component. The component is a pure presentational upgrade.

---

## Estimated score lift

| Dimension | Sprint 805 | Sprint 808 estimate |
|---|---|---|
| Dashboard Cognitive Load | 62/100 | ~77/100 |
| KPI section cognitive load | 6/10 (moved down, still 8 equal) | 9/10 (4 primary, 4 on demand) |

**Key gain:** Above-fold KPI section now has clear hierarchy. Scanning the dashboard gives the director 4 decisions, not 8 equal signals.

---

## Files changed in Sprint 808

- **Modified** `src/app/director/_components/AcademyKpiCardsSection.tsx` — added `'use client'`; split 8 cards into 4 primary (always visible) + 4 secondary (toggle-revealed); added "View all metrics" / "Show fewer" toggle; updated section sublabel
- **Created** `docs/DIRECTOR_KPI_REDUCTION_808.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 808 entry
