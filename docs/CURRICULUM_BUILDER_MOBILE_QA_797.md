# Sprint 797 — Curriculum Builder Mobile QA V1

**Date:** 2026-05-18
**Sprint:** 797

---

## Mobile layout audit

The curriculum builder is a director-facing feature. The director portal uses a fixed sidebar + `flex-1` main area layout. Mobile is secondary but should not break.

---

## Component-by-component review

| Component | Layout approach | Mobile behaviour |
|-----------|----------------|-----------------|
| `CurriculumLevelMap` | `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` | ✅ 2 cols on mobile — readable |
| `CurriculumRelationshipMap` | `flex flex-wrap gap-2` for level chips | ✅ Wraps cleanly on narrow screens |
| `CurriculumGuidedReviewShell` | Vertical stack | ✅ No horizontal split — mobile fine |
| `CurriculumProgressRail` | `flex flex-wrap gap-1` for dots | ✅ Dots wrap, progress bar full-width |
| `CurriculumJumpToLevelModal` | Fixed overlay `max-h-[80vh] overflow-y-auto` | ✅ Scrollable on mobile |
| `CurriculumLevelBuilderShell` tabs | `flex items-center gap-1 flex-wrap` | ✅ Tabs wrap on small screens |
| DONNA draft textareas | `w-full h-24` | ✅ Full-width; no overflow |
| `DonnaSafetyDisclosure` | Block text | ✅ Reads fine at narrow widths |
| `CurriculumImpactPreviewPanel` | `grid grid-cols-3` for metrics | ⚠️ Three columns may be tight at 320px — acceptable |

## Known mobile limitation

`CurriculumImpactPreviewPanel` uses a 3-column grid for the impact metrics (Players / Levels / Rollout). At 320px, each column is ~100px which may feel cramped. This is acceptable for a director feature that is primarily used on desktop. No fix needed in V1.

## Verdict

The curriculum builder does not break on mobile. It is not optimised for mobile-first use, which is appropriate for a director-only feature.
