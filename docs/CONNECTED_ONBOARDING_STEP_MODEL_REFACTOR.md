# Connected Onboarding Step Model Refactor

**Date:** 2026-05-19
**Sprint:** OF-2

---

## Summary

Refactored the AcademyOS onboarding from 7 steps to 11 steps to support the connected flow defined in OF-1. Placeholder steps bridge the gap until each step is built in OF-3 through OF-9. Existing steps (Welcome, Academy Basics, Coaching DNA, DNA Review, Activation Checklist) remain fully functional.

---

## Changes made

### `OnboardingShell.tsx`

- Added new types to `OnboardingDraft`: `ClassTemplateDraftData`, `FitnessTemplateDraftData`, `PlayerUploadDraftData`, `CoachesDraftData`, `LocalCoachDraft`
- Added new draft fields: `curriculumStartingPoint`, `curriculumFocusLevels`, `classTemplateDraft`, `fitnessTemplateDraft`, `playerUploadDraft`, `coachesDraft`, `portalPreviewViewed`
- Updated `TOTAL_STEPS` from 7 to 11
- Updated `STEP_NAMES` and `STEP_SUBTITLES` arrays (11 entries)
- Removed `SessionCurriculumDefaultsStep` and `ParentPlayerExperienceStep` from shell rendering (these are not removed — they remain as component files, just not rendered in the main shell flow until their new step versions are built)
- Added placeholder step renders for steps 3-8 (Curriculum Builder, Class Template, Fitness Template, Player Upload, Add Coaches, Portal Preview)
- DNA Review moved from step 5 to step 9 (index)
- Activation Checklist moved from step 6 to step 10 (index)

### `OnboardingProgressRail.tsx`

- Updated from 7 to 11 steps
- New step labels: Welcome, Academy, Coaching DNA, Curriculum, Class Template, Fitness Template, Players, Coaches, Portals, Review DNA, Activate
- Connector width reduced (`w-5`) to fit 11 nodes in the rail
- Label font size reduced (`text-[8px]`) to fit 11 labels
- Labels show only on `lg` breakpoint (was `md`) to avoid overflow on smaller screens

### `OnboardingDonnaPanel.tsx`

- Updated step list from 7 to 11 entries
- Added DONNA messages for new steps 3-8 (Curriculum Builder, Class Template, Fitness Template, Player Upload, Add Coaches, Portal Preview)
- Updated live DNA preview to show `curriculumStartingPoint`, class/fitness template draft block counts
- All other visual elements preserved exactly

### `OnboardingSaveStatus.tsx`

- Storage key bumped from `academyos_onboarding_draft_v1` to `academyos_onboarding_draft_v2` to prevent runtime errors from restored old drafts that lack the new required fields

### `AcademyDnaReviewStep.tsx`

- Updated `stepNumber` from 6 to 10, `totalSteps` from 7 to 11

### `ActivationChecklistStep.tsx`

- Updated `stepNumber` from 7 to 11, `totalSteps` from 7 to 11

### `AcademyBasicsStep.tsx` + `CoachingDnaStep.tsx`

- Updated `totalSteps` from 7 to 11

---

## Placeholder step behavior

Steps 4-9 (Curriculum Builder through Portal Preview) are shown as native placeholder panels using the existing AcademyOS card + DONNA visual style. Each placeholder shows:
- Step number and title
- A DONNA explanation card with the sprint that will replace it
- Back and Skip/Continue buttons in existing button style

Placeholders do NOT use generic "coming soon" UI — they use the lime/dark design tokens consistently.

---

## Safety rules

- No DB writes
- No migrations
- No schema changes
- No package changes
- No fake "created/published" language
- All draft data local-only (localStorage v2 key)
