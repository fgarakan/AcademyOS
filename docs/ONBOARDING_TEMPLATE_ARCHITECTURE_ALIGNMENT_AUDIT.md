# Onboarding Template Architecture Alignment Audit

**Date:** 2026-05-19
**Sprint:** OT-1

---

## Purpose

Audit the current DONNA onboarding template-related flow and define the smallest UI-preserving refinement that aligns template setup with the real AcademyOS class and fitness template architecture.

---

## What the current onboarding UI must preserve

All of the following must remain unchanged in visual design and behavior:

| Element | File | Status |
|---|---|---|
| `OnboardingShell` layout | `OnboardingShell.tsx` | Preserve exactly |
| `OnboardingProgressRail` | `OnboardingProgressRail.tsx` | Preserve exactly |
| `OnboardingDonnaPanel` | `OnboardingDonnaPanel.tsx` | Preserve exactly |
| `OnboardingStepHeader` | `OnboardingStepHeader.tsx` | Preserve exactly |
| `OnboardingSaveStatus` | `OnboardingSaveStatus.tsx` | Preserve exactly |
| `AcademyDnaSummaryCard` | `AcademyDnaSummaryCard.tsx` | Preserve exactly |
| `DonnaAdjustmentDraftPanel` | `DonnaAdjustmentDraftPanel.tsx` | Preserve exactly |
| `AcademyDnaReviewStep` visual direction | `steps/AcademyDnaReviewStep.tsx` | Additive only |
| `ActivationChecklistStep` visual direction | `steps/ActivationChecklistStep.tsx` | Additive only |
| Session blocks UI pattern | `steps/SessionCurriculumDefaultsStep.tsx` | Extend below existing content |
| Dark premium AcademyOS design tokens | `tailwind.config.ts` + `globals.css` | Unchanged |
| Step count (7 steps) | `OnboardingShell.tsx` | Unchanged |

---

## Where template setup is currently too generic

**`SessionCurriculumDefaultsStep.tsx`** (Step 4) uses 7 generic session building blocks:
- Technique Blocks, Live Ball Heavy, Constraint Games, Point Play Progression, Stations + Rotations, Assessment Moments, Fitness Integrated

These are workflow categories, not the actual AcademyOS class template block model. A director completing onboarding has no experience drafting a class template using the real block vocabulary.

**`ActivationChecklistStep.tsx`** (Step 7) has no awareness of whether a first class or fitness template draft has been started.

**`AcademyDnaReviewStep.tsx`** (Step 6) does not show template draft status.

---

## How to add first class template drafting without changing the overall UI

Add `FirstClassTemplateDraftPanel` below the existing session blocks and development priorities in `SessionCurriculumDefaultsStep.tsx`. This is additive — the existing session block UI above it is unchanged. The panel uses the exact same card/button/lime selection visual style as the existing blocks in that step.

The panel is collapsible via skip/resume. If skipped, a single compact status row appears. If active, the full panel is shown.

---

## How to add first fitness template drafting without changing the overall UI

Add `FirstFitnessTemplateDraftPanel` below `FirstClassTemplateDraftPanel` in `SessionCurriculumDefaultsStep.tsx`. Same visual pattern. Fitness blocks are listed as selectable cards. When selected, each block auto-populates exercises from local demo data. An expandable row shows the exercise details.

---

## Real class block model

| Block | Duration | Notes |
|---|---|---|
| Warm-Up | 10 min | Fixed, always first |
| Drills | 15 min | Selectable |
| Skills | 20 min | Selectable |
| Tactics | 15 min | Selectable |
| Games | 15 min | Selectable |
| Point Play | 10 min | Selectable |
| Match Play | 15 min | Selectable |
| Assessment Moment | 5 min | Selectable |
| Reflection / Wrap-Up | 5 min | Fixed, always last |

---

## Real fitness block model

| Block | Duration |
|---|---|
| Movement Prep | 8 min |
| Speed | 10 min |
| Agility | 10 min |
| Coordination | 8 min |
| Strength Basics | 12 min |
| Mobility | 8 min |
| Recovery | 8 min |
| Tennis Transfer | 10 min |
| Conditioning | 12 min |
| Balance | 8 min |
| Footwork | 10 min |

---

## How class blocks should appear

Block selector cards using the existing lime-selection style from `SessionCurriculumDefaultsStep`. Warm-Up and Reflection/Wrap-Up shown as fixed (greyed, always present). Selectable blocks (Drills through Assessment Moment) shown as toggle cards. When selected, a coach preview row expands below with: goal, coach cue, player watch-for, evidence opportunity, optional video placeholder.

---

## How fitness blocks and exercises should appear

Block selector cards (same visual style). When a block is selected, it appears in a collapsible coach preview panel below the selectors. Tapping the block row expands exercises. Each exercise shows: name, sets/reps/time, coaching cue, progression, regression, tennis transfer, optional video placeholder.

---

## Duplicate block handling

If the same fitness block type appears twice in the selected list, the second occurrence uses a different set of exercises. Two exercise sets are pre-defined per block type. The `occurrencesBefore` count (0-indexed) determines which set is used.

---

## How video should be represented

Video is an optional placeholder only. No upload, no storage, no DB write. A small inline component shows:
- "Video — attach after activation."
- A "Add video later" button (toggle state)
- Once toggled, shows "Add later" badge

---

## What must remain skippable

Both template draft panels must have a Skip button. If skipped, the panel collapses to a single compact row. The director can resume at any point. If either template is skipped at activation, the Activation Checklist shows "Finish first class template" or "Finish first fitness template" as optional items.

---

## What belongs in Activation Checklist

Add two new optional checklist items:

| Item | readyCheck |
|---|---|
| First class template drafted | `!draft.classTemplateDraft.skipped && draft.classTemplateDraft.selectedBlocks.length > 0` |
| First fitness template drafted | `!draft.fitnessTemplateDraft.skipped && draft.fitnessTemplateDraft.selectedBlocks.length > 0` |

Both are optional (not required for activation).

---

## Separate issue logged

**`/director/sessions` — Infinite recursion in RLS policy**

Error: `Failed to load sessions: infinite recursion detected in policy for relation sessions`

This is a backend/RLS issue in the `sessions` table policy. It does not affect the onboarding UI. It does not block TypeScript build. It should be addressed in a separate backend sprint reviewing the `sessions` RLS policy for circular references (likely a policy that references `sessions` within a `sessions` subquery).

**Recommendation:** Audit `supabase/migrations/007_sessions.sql` and any subsequent migrations modifying sessions RLS. Look for policies that join or select from `sessions` within their `USING` or `WITH CHECK` clauses.

---

## Sprint OT-1 through OT-7 file map

| Sprint | Files created | Files modified |
|---|---|---|
| OT-1 | `docs/ONBOARDING_TEMPLATE_ARCHITECTURE_ALIGNMENT_AUDIT.md` | `docs/CHANGELOG.md` |
| OT-2 | `src/components/onboarding/templates/templateDraftData.ts`, `TemplateVideoPlaceholderCard.tsx`, `FirstClassTemplateDraftPanel.tsx`, `docs/ONBOARDING_FIRST_CLASS_TEMPLATE_DRAFT_PANEL.md` | `OnboardingShell.tsx`, `OnboardingSaveStatus.tsx`, `SessionCurriculumDefaultsStep.tsx` |
| OT-3 | `src/components/onboarding/templates/FirstFitnessTemplateDraftPanel.tsx`, `docs/ONBOARDING_FIRST_FITNESS_TEMPLATE_DRAFT_PANEL.md` | `SessionCurriculumDefaultsStep.tsx` |
| OT-4 | `docs/ONBOARDING_TEMPLATE_VIDEO_PLACEHOLDER_UI.md` | — |
| OT-5 | `docs/ONBOARDING_TEMPLATE_READINESS_ACTIVATION_CHECKLIST.md` | `ActivationChecklistStep.tsx` |
| OT-6 | `src/components/onboarding/templates/OnboardingTemplateCoachPreview.tsx`, `docs/ONBOARDING_TEMPLATE_COACH_PREVIEW.md` | `AcademyDnaReviewStep.tsx` |
| OT-7 | `docs/ONBOARDING_UI_PRESERVATION_TEMPLATE_ALIGNMENT_QA.md` | `docs/CHANGELOG.md` |

---

## Safety rules for all sprints

- No DB writes
- No migrations
- No schema changes
- No package additions
- No fake "Created" / "Applied" / "Published" language
- All draft data local-only (localStorage + React state)
- No media upload
- No Supabase policy edits
- No real template creation
