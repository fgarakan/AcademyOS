# Connected Onboarding OF-FIX-3: Coaching Communication Split

**Sprint:** OF-FIX-3
**Date:** 2026-05-19
**Status:** Complete

---

## Objective

Split the combined Coaching DNA step into two focused steps to match the prototype flow and reduce cognitive load on a single screen.

---

## Step model change

| Before | After |
|---|---|
| TOTAL_STEPS = 11 | TOTAL_STEPS = 12 |
| Step 2: Coaching DNA (styles + voice combined) | Step 2: Coaching Philosophy (styles only) |
| — | Step 3: Coach Communication (voice only) — new |
| Step 3: Curriculum Builder | Step 4: Curriculum Builder |
| Step 4: First Class Template | Step 5: First Class Template |
| Steps 5–8: Placeholders | Steps 6–9: Placeholders |
| Step 9: Academy DNA Review | Step 10: Academy DNA Review |
| Step 10: Activation Checklist | Step 11: Activation Checklist |

---

## Files modified

### `steps/CoachingDnaStep.tsx`
- Removed communication voice section entirely.
- Now focused on coaching philosophy/styles only.
- Updated subtitle: "Select up to 3 coaching styles that define your academy's philosophy."
- `totalSteps` updated to 12.

### `steps/CoachCommunicationStep.tsx` (new)
- Communication voice selection (primary + secondary) moved here.
- Added "How this shapes your system" impact strip: wrap-up language, session guidance, parent summaries, player mission tone.
- DONNA confirmation bubble on primary selection.
- Skip-for-now option when no primary selected.
- Step 4 of 12.

### `OnboardingShell.tsx`
- `TOTAL_STEPS` 11 → 12.
- Added 'Coaching Philosophy' and 'Coach Communication' to STEP_NAMES and STEP_SUBTITLES.
- Imported and wired `CoachCommunicationStep` at index 3.
- Shifted all subsequent step indices by +1.
- Placeholder `stepNum` props updated accordingly.

### `OnboardingProgressRail.tsx`
- Added 'Comm Voice' node at index 3.
- 12 total nodes. Label for Coaching DNA shortened to 'Philosophy'.

### `OnboardingDonnaPanel.tsx`
- MILESTONES: 'Coaching DNA' milestone now covers steps 2–3. All other ranges shifted.
- DONNA_MESSAGES: added step 3 message for Coach Communication; steps 3–10 shifted to 4–11.
- Pulse guard updated: `currentStep < 10` → `currentStep < 11`.

### Step header updates (totalSteps 11 → 12)
- `AcademyBasicsStep.tsx` — totalSteps 12
- `CurriculumBuilderStep.tsx` — stepNumber 4→5, totalSteps 12
- `FirstClassTemplateStep.tsx` — stepNumber 5→6, totalSteps 12
- `AcademyDnaReviewStep.tsx` — stepNumber 10→11, totalSteps 12
- `ActivationChecklistStep.tsx` — celebration header "Step 12 of 12"

---

## TypeScript

Clean — no errors.
