# Connected Onboarding Curriculum Builder Step

**Date:** 2026-05-19
**Sprint:** OF-3

---

## Summary

Replaced the `CurriculumBuilderPlaceholder` in `OnboardingShell.tsx` with a fully-built `CurriculumBuilderStep` component (step 4 of 11). Collects curriculum starting point, focus levels, session building blocks with a live timeline preview, and ranked development priorities.

---

## Changes made

### `src/components/onboarding/steps/CurriculumBuilderStep.tsx` (new)

- `stepNumber={4}` / `totalSteps={11}` via `OnboardingStepHeader`
- **Curriculum Starting Point** — 5 options: AcademyOS Starter (Recommended), Performance-Focused, Development Pathway, Start from Blank, Customize Later (Quickest)
- **Focus Levels** — 6 levels (Red Ball through Adult Programs) shown only after a starting point is selected (hidden for Customize Later)
- **Default Session Structure** — 7 block selectors (Technique Blocks, Live Ball Heavy, Constraint Games, Point Play Progression, Stations + Rotations, Assessment Moments, Fitness Integrated), each with duration label
- **Session Preview** — proportional timeline bar showing Warm-Up (10 min fixed) + selected blocks + Reflection (5 min fixed), total duration display
- **Development Priorities** — 10 options, max 5 selectable, rank-ordered display with remove button in priority list
- DONNA confirmation messages appear after key selections (curriculum point, session blocks 1+, priorities 3+)
- Skip option available via "Skip for now" link when no starting point selected

### `src/components/onboarding/OnboardingShell.tsx` (modified)

- Added import: `CurriculumBuilderStep`
- Replaced `CurriculumBuilderPlaceholder` render at `currentStep === 3` with `<CurriculumBuilderStep draft={draft} updateDraft={updateDraft} onNext={goNext} onPrev={goPrev} />`
- Removed `CurriculumBuilderPlaceholder` function

---

## Draft fields written

| Field | Type | Description |
|---|---|---|
| `curriculumStartingPoint` | `string` | Selected starter template ID |
| `curriculumFocusLevels` | `string[]` | Selected level IDs |
| `sessionBlocks` | `string[]` | Selected block IDs (feeds into class template step) |
| `developmentPriorities` | `string[]` | Priority IDs in rank order (max 5) |

---

## Safety rules

- No DB writes
- No migrations
- No schema changes
- No package changes
- All data local-only (localStorage v2 key)
- Step is fully skippable
