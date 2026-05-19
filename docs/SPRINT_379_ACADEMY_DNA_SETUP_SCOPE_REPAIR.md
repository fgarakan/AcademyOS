# Sprint 379 — Academy DNA Setup Scope Repair V1

**Date:** 2026-05-19
**Branch:** main

---

## Objective

Narrow first-run onboarding to Academy DNA only. Remove all operational setup steps (curriculum builder, class templates, fitness templates, player upload, coach setup, portal preview) from the first-run flow. Post-DNA setup tasks become action cards on the Final Activation screen.

---

## New 10-Step DNA Flow

| Step | Name | Component |
|---|---|---|
| 0 | Welcome | WelcomeStep (inline) |
| 1 | Academy Basics | AcademyBasicsStep |
| 2 | Coaching Philosophy | CoachingDnaStep |
| 3 | Coach Communication | CoachCommunicationStep |
| 4 | Session Design | SessionDesignStep (new) |
| 5 | Player Development | PlayerDevelopmentStep (new) |
| 6 | Parent Communication | ParentCommunicationStep (new) |
| 7 | DNA Summary | AcademyDnaReviewStep |
| 8 | DONNA Adjustment | DonnaAdjustmentStep (new) |
| 9 | Final Activation | ActivationChecklistStep |

---

## Files Created

- `src/components/onboarding/steps/SessionDesignStep.tsx` — 7 session block options (technique-blocks, live-ball-heavy, constraint-games, point-play, stations, assessment, fitness-integrated); multi-select; live timeline preview bar; step 5 of 10
- `src/components/onboarding/steps/PlayerDevelopmentStep.tsx` — 10 dev priorities; max 5 with rank ordering (ChevronUp/Down/X); ranked stack + selection grid; step 6 of 10
- `src/components/onboarding/steps/ParentCommunicationStep.tsx` — always-on privacy rules section; 7 parent communication styles; step 7 of 10
- `src/components/onboarding/steps/DonnaAdjustmentStep.tsx` — wraps DonnaAdjustmentDraftPanel; DONNA intro bubble; step 9 of 10
- `docs/SPRINT_379_ACADEMY_DNA_SETUP_SCOPE_REPAIR.md` — this file

---

## Files Modified

- `OnboardingShell.tsx` — TOTAL_STEPS 12→10; STEP_NAMES and STEP_SUBTITLES updated to 10 DNA entries; step rendering updated (steps 4-9 rewired); WelcomeStep FLOW_STEPS updated; imports updated (CurriculumBuilderStep/FirstClassTemplateStep removed; 4 new steps added); inline placeholder functions removed
- `OnboardingProgressRail.tsx` — STEPS array updated from 12 to 10 DNA-focused items
- `OnboardingDonnaPanel.tsx` — MILESTONES updated 7→5 DNA milestones; DONNA_MESSAGES updated for steps 0-9 (curriculum/templates/people/portal messages removed); dnaLines updated (classTemplateDraft/fitnessTemplateDraft removed; developmentPriorities added); building pulse guard updated < 11 → < 9
- `AcademyDnaReviewStep.tsx` — stepNumber 11→8; totalSteps 12→10; edit step indices fixed (CommVoice 2→3, SessionBlocks 3→4, DevPriorities 3→5, ParentComm 4→6, PrivacyRules 4→6); DonnaAdjustmentDraftPanel removed; Player Mission Style row removed; CTA changed to "Continue to DONNA Review"
- `ActivationChecklistStep.tsx` — step header updated to "Step 10 of 10 — DNA Ready"; title changed to "Your Academy DNA is ready."; DONNA message updated; checklist simplified to 5 DNA items (player-mission/first-player/first-session removed); Post-DNA Setup Task Grid added (6 action cards); "Activate Starting System" replaced with "Go to Director Dashboard" href="/director"
- `AcademyBasicsStep.tsx` — totalSteps 12→10
- `CoachingDnaStep.tsx` — totalSteps 12→10
- `CoachCommunicationStep.tsx` — totalSteps 12→10

---

## Architecture Notes

- No schema changes. No migrations. No DB writes added.
- All new steps use existing OnboardingDraft fields (sessionBlocks, developmentPriorities, parentStyles, parentVisibilityRules).
- Prototype code was not copied. UX patterns adapted to AcademyOS design system (lime tokens, dark surface palette).
- Post-DNA tasks are plain anchor links — they navigate to existing director routes.

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
