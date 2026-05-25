# Sprint 807 — Director Dashboard Attention Consolidation V1

**Date:** 2026-05-25
**Sprint:** 807
**Type:** UX consolidation — reduce "needs attention" surface duplication on Director Dashboard
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 805 certification blocker:

> **"2–3 competing 'needs attention' surfaces on dashboard"** — `DirectorTodayCommandCenter` (primary), `Priority Queue card` (Roster Signals), and `AcademyAlertsPanel` (Academy Health Signals) all present "what needs my attention" content. Directors experience cognitive echo: three surfaces all demanding the same decision-making attention.

Sprint 807 consolidates to one primary surface and demotes the others.

---

## What changed

### Priority Queue card — removed

The Priority Queue card in "Roster Signals" was showing the same `priorityQueue` data already surfaced inside `DirectorTodayCommandCenter`. It was a direct visual duplicate.

**Removed:** The entire Priority Queue card JSX (the 2-column grid left card in "Roster Signals").

**Data not lost:** `priorityQueue` (fetched at line 106 via `getAcademyPriorityQueue`) is still used by `buildAttentionQueue` → `DirectorTodayCommandCenter`. The data remains; only the redundant card is gone.

### Roster Signals section — renamed to "Pending Placement"

After removing the Priority Queue card, only the "Pending Placement" card remains in this section. The section was renamed from "Roster Signals" to "Pending Placement" for accuracy.

- **Label:** "Roster Signals" → "Pending Placement"
- **Subtitle:** Updated to "Players awaiting onboarding completion. Priority action items are surfaced in the Command Center above."

This creates a clear referral relationship: "If you want priority attention items, use the Command Center above."

### Academy Health Signals — demoted to "Alert Breakdown"

The `AcademyAlertsPanel` section was renamed and visually demoted:

| Before | After |
|---|---|
| Section label: `"Academy Health Signals"` in `label-xs` (uppercase lime weight) | Section label: `"Alert Breakdown"` in `text-text-muted` (subdued, clearly secondary) |
| Subtitle: neutral description | Subtitle: "Detailed breakdown by type — priority items are already shown in the Command Center above." |

The `AcademyAlertsPanel` component is unchanged — the data remains fully accessible. Only the visual framing signals to the director: "this is detail, not command."

---

## Before / after: dashboard "needs attention" surfaces

**Before Sprint 807:**
```
1. DirectorTodayCommandCenter — "Today's priority actions"     ← primary ✅
2. Priority Queue card         — "Players requiring attention"  ← DUPLICATE ❌
3. AcademyAlertsPanel         — "Academy Health Signals"       ← competing ⚠️
```

**After Sprint 807:**
```
1. DirectorTodayCommandCenter — "Today's priority actions"  ← primary ✅
2. (Priority Queue removed)
3. AcademyAlertsPanel         — "Alert Breakdown"           ← subordinate detail
```

Cognitive load: 3 attention surfaces → 1 primary + 1 clearly subordinate.

---

## What was NOT changed

- `AcademyAlertsPanel` component itself — unchanged, data path intact
- `getAcademyPriorityQueue` fetch — still called, still feeds command center
- `Pending Placement` card — unchanged, still visible
- All navigation links — preserved
- `AcademyKpiCardsSection` — untouched (Sprint 808 target)

---

## Estimated score lift

| Dimension | Sprint 805 | Sprint 807 estimate |
|---|---|---|
| Dashboard Cognitive Load | 62/100 | ~70/100 |
| "Needs attention" surface count | 3 competing | 1 primary + 1 subordinate |

**Key gain:** Directors now have one unambiguous "what needs attention" surface. The alert breakdown is still accessible but is visually framed as detail, not command.

---

## Files changed in Sprint 807

- **Modified** `src/app/director/page.tsx` — removed Priority Queue card from Roster Signals; renamed section to "Pending Placement"; renamed "Academy Health Signals" section to "Alert Breakdown" with subdued label and referral subtitle
- **Created** `docs/DIRECTOR_DASHBOARD_ATTENTION_CONSOLIDATION_807.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 807 entry
