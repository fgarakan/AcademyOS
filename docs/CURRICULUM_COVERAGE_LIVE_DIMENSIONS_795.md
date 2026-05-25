# Curriculum Coverage Live Dimensions — Sprint 795

**Date:** 2026-05-25
**Sprint:** 795
**Depends on:** Sprint 794 (DONNA Curriculum Draft Operator)
**Status:** COMPLETE

---

## Overview

Sprint 795 fixes the Curriculum Health coverage score. Before this sprint, 6 of 9 scoring dimensions were hardcoded as zero, capping every level at a maximum score of 60/100 regardless of how well the tracked content was populated. The fix normalises the score to the 3 dimensions that actually have data — gates, drills, and coach cues — so a fully populated level can reach 100.

No DB queries added. No migrations. No fake data. Pure scoring model fix.

---

## Root Cause

`COVERAGE_WEIGHTS` defines 9 dimensions totalling 100 points:

| Dimension | Weight | Had data? |
|---|---|---|
| Gates | 25 | ✅ |
| Drills | 20 | ✅ |
| Coach Cues | 15 | ✅ |
| Skills | 15 | ❌ always 0 |
| Assessment | 10 | ❌ always 0 |
| Missions | 5 | ❌ always 0 |
| Parent Guidance | 5 | ❌ always 0 |
| Badges | 5 | ❌ always 0 |
| **Total** | **100** | — |

Max achievable score before fix: **60/100** — even a perfectly populated level showed as "partial" (F or D grade).

Also: gap warnings for "Assessment criteria" and "Parent guidance" appeared for every single level, creating noise that couldn't be acted on.

---

## Fix 1 — `coverageModel.ts`: `excludeFromScoring` + normalisation

**File:** `src/lib/curriculum/coverageModel.ts`

Added optional `excludeFromScoring?: ExcludableScoreDimension[]` to `LevelCoverageInput`:
```typescript
export type ExcludableScoreDimension = 'skills' | 'assessment' | 'missions' | 'parentGuidance' | 'badges'
```

When dimensions are excluded:
- Their weight is removed from `availableWeightSum`
- They are skipped in rawScore computation
- They do not generate gap warnings
- The final score is normalised: `score = Math.round((rawScore / availableWeightSum) * 100)`

**Backward-compatible:** omitting `excludeFromScoring` preserves the exact existing behaviour.

---

## Fix 2 — `page.tsx`: Pass `excludeFromScoring`

**File:** `src/app/director/curriculum/page.tsx`

Added `excludeFromScoring: ['skills', 'assessment', 'missions', 'parentGuidance', 'badges']` to each `levelCoverageInput`. Score now computes against 60 available points (gates + drills + coachCues), normalised to 100:

| Level state | Before | After |
|---|---|---|
| All 3 tracked dimensions populated | 60/100 (F) | 100/100 (A) |
| Gates + drills, no cues | ~45/100 (F) | ~75/100 (B) |
| Gates only | ~13/100 (F) | ~21/100 (D) |
| Nothing | 0/100 (F) | 0/100 (F) |

No fake data introduced. `skillCount`, `assessmentCriteriaCount`, `missionCount`, `badgeCount`, `parentGuidanceCount` remain 0 — they are simply excluded from contributing to the score.

---

## Fix 3 — `CurriculumHealthPanel.tsx`: Copy and typography

**File:** `src/app/director/curriculum/_components/CurriculumHealthPanel.tsx`

1. **Subtitle updated** from `"Partial snapshot — gates, drills, and coach language only. Not a full health score."` to:
   `"Score based on 3 available dimensions — gates, drills, coach cues. Skills, assessment, missions, badges, and parent guidance are not yet tracked."`

2. **Disclaimer block updated** to explain normalisation: `"Score normalised to available dimensions. Gates, drills, and coach cues are tracked and scored. … A 100 score means all 3 tracked dimensions are fully populated."`

3. **`text-[9px]` micro-label fixed** → `text-[10px]` on the `"gates · drills · cues"` sub-label below the grade number (Sprint 791 audit flag resolved).

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/curriculum/coverageModel.ts` | Add `ExcludableScoreDimension` type and `excludeFromScoring` to `LevelCoverageInput`; normalise score to available weight sum; skip excluded dimensions in scoring and gap generation |
| `src/app/director/curriculum/page.tsx` | Add `excludeFromScoring: ['skills', 'assessment', 'missions', 'parentGuidance', 'badges']` to levelCoverageInputs |
| `src/app/director/curriculum/_components/CurriculumHealthPanel.tsx` | Update subtitle, disclaimer, and fix `text-[9px]` → `text-[10px]` |
| `docs/CURRICULUM_COVERAGE_LIVE_DIMENSIONS_795.md` | This document |
| `docs/CHANGELOG.md` | Sprint 795 entry |

---

## TypeScript Result

Clean. `npx tsc --noEmit` passes with zero errors.

---

## Expected Score Lift

| Dimension | Before (post-794) | Expected After |
|---|---|---|
| AIQS State Quality — checklist accuracy | 4/5 | 5/5 (+1) — coverage score now honest |
| AIQS Typography | 9/10 | 10/10 (+1) — text-[9px] removed |
| CB-3 Coverage Honesty | 4/10 | 8/10 (+4) — score normalised, gap noise removed |
| **AIQS Total** | **~90/100** | **~93/100** |
| **CB Specific** | **~64/80** | **~70/80** |
| **Combined** | **~80/100** | **~84/100** |

---

## Remaining Blockers from Sprint 791 (after Sprint 795)

1. **Mobile DONNA panel hidden** (Blocker 6) — `hidden lg:block` on level builder page — target Sprint 796

---

## Recommended Sprint 796

**Sprint 796 — Curriculum Builder Mobile 10/10 Pass V1**

Add a visible mobile curriculum context card to `CurriculumLevelBuilderExperience.tsx` below the level header — shown only on small screens (`block lg:hidden`). The card shows the level name, stage, DONNA status, and a "Open in Builder" prompt. Fix touch targets on level rows and the `CurriculumChangeDraftPanel` textarea for mobile usability.
