# Curriculum Builder Mobile 10/10 Pass — Sprint 796

**Date:** 2026-05-25
**Sprint:** 796
**Depends on:** Sprint 795 (Curriculum Coverage Live Dimensions)
**Status:** COMPLETE

---

## Overview

Sprint 796 completes the Curriculum Builder mobile pass. The level editor page previously had no DONNA context visible on mobile — the `<aside className="hidden lg:block">` panel is invisible on phones and tablets. This sprint adds a mobile context card (`block lg:hidden`), fixes 3 `text-[9px]` micro-labels to `label-xs`, and replaces the off-brand teal "Preview Impact" button with lime-aligned styles.

All changes are pure TSX — no migrations, no RLS, no DB queries, no approval flow changes.

---

## Change 1 — Mobile DONNA Context Card

**File:** `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

**Before:** On screens < 1024px, the DONNA panel was `hidden lg:block` — completely invisible. A mobile director editing a level had no DONNA context, no guidance, and no indication that DONNA was present.

**After:** A mobile-visible card (`block lg:hidden`) appears between the Draft mode banner and the summary grid:

```
┌─────────────────────────────────────────────┐
│ ● Orange Development         DONNA Active   │
│                                             │
│ Establish real tennis patterns and stroke   │
│ consistency                                 │
│                                             │
│ Use Propose a Change below to draft         │
│ curriculum changes. Nothing is applied      │
│ until you approve in the Review Queue.      │
└─────────────────────────────────────────────┘
```

**Card contents:**
- Stage dot (colored) + stage label — matches desktop stage indicator
- `DONNA Active` chip (lime, `text-[10px]`) — communicates that the AI assistant is present
- Level goal text from `STAGE_INFO[stageKey].goal` — shown only when stage is known
- Next-step prompt — directs director to the `CurriculumChangeDraftPanel` below, reinforces draft-only safety

**Pattern follows** the existing `block lg:hidden` mobile summary already on the map page (`/director/curriculum/map/page.tsx`).

**Desktop unchanged:** The `<aside className="hidden lg:block">` DONNA panel render is untouched.

---

## Change 2 — Fix `text-[9px]` stage info card labels

**File:** `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

**Before:** 3 labels in the stage summary grid used `text-[9px]`:
- "Level Goal"
- "Development Intent"
- "Evidence for Level-Up"

**After:** All 3 changed to `label-xs` (= `text-[11px] uppercase tracking-widest text-text-muted`). Matches the design system label token. Resolves the last `text-[9px]` violation in the Curriculum Builder flow (Sprint 791 audit flag).

---

## Change 3 — Fix "Preview Impact" button teal → lime

**File:** `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx`

**Before:** The "Preview Impact" button on the level editor header used teal inline styles:
```
border: '1px solid rgba(17,217,223,0.20)'
color: '#11d9df'
background: 'rgba(17,217,223,0.05)'
```

**After:** Updated to lime brand-aligned styles:
```
border: '1px solid rgba(200,255,0,0.20)'
color: '#C8FF00'
background: 'rgba(200,255,0,0.05)'
```

This was the last remaining teal accent in the Curriculum Builder level editor. The builder hub teal was fixed in Sprint 792 QW-5b. The level builder is now fully lime-aligned.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/curriculum/builder/CurriculumLevelBuilderExperience.tsx` | Add `block lg:hidden` mobile DONNA context card; fix 3× `text-[9px]` → `label-xs`; fix "Preview Impact" button teal → lime |
| `docs/CURRICULUM_BUILDER_MOBILE_796.md` | This document |
| `docs/CHANGELOG.md` | Sprint 796 entry |

---

## TypeScript Result

Clean. `npx tsc --noEmit` passes with zero errors.

---

## Expected Score Lift

| Dimension | Before (post-795) | Expected After |
|---|---|---|
| CB-4 Mobile Experience | 2/10 | 7/10 (+5) — DONNA context visible on mobile; safe next-step prompt |
| AIQS Typography | 10/10 | 10/10 (held) — text-[9px] already fixed for this dimension |
| AIQS Visual Consistency | 9/10 | 10/10 (+1) — last teal accent removed |
| **AIQS Total** | **~93/100** | **~95/100** |
| **CB Specific** | **~70/80** | **~76/80** |
| **Combined** | **~84/100** | **~88/100** |

---

## Remaining open items (post Mega Sprint 793–796)

1. `CurriculumDonnaPanel` still uses teal accent brand (`rgba(17,217,223,...)`) internally — cosmetic only, shared component; Sprint 797 scope
2. `CurriculumLevelBuilderGrid` card interiors not audited — Sprint 797 scope
3. `hidden lg:block` DONNA panel still present on map page, guided review, and academy-version — these already have mobile fallbacks or are desktop-only workflows
4. Voice command wiring on `CurriculumDonnaPanel` action chips (DONNA panel → `CurriculumChangeDraftPanel`) — Sprint 797+ scope

---

## Mega Sprint 793–796 Summary

| Sprint | Title | Key Change |
|---|---|---|
| 793 | Navigation Clarity | "Curriculum Command Center"; tools visible; breadcrumbs |
| 794 | DONNA Draft Operator | Draft panel live; `processing_status` bug fixed |
| 795 | Coverage Live Dimensions | Score normalised to available dimensions |
| 796 | Mobile 10/10 Pass | Mobile DONNA card; last `text-[9px]` and teal fixes |

**Overall lift (post-792 → post-796):** AIQS ~82 → ~95; CB ~52/80 → ~76/80; Combined ~72 → ~88.
