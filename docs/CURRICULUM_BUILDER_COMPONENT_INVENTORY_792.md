# Sprint 792 — Curriculum Builder Component Inventory V1

**Date:** 2026-05-18
**Sprint:** 792

---

## Builder component inventory

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| `CurriculumBuilderWelcome` | `builder/CurriculumBuilderWelcome.tsx` | ✅ Live | DONNA welcome panel; hasActiveVersion switch |
| `CurriculumLevelMap` | `builder/CurriculumLevelMap.tsx` | ✅ Live | Grid view by stage; sufficiency dots; inline detail panel |
| `CurriculumRelationshipMap` | `builder/CurriculumRelationshipMap.tsx` | ✅ Live | Stage pathway view; prerequisite direction arrows |
| `CurriculumGuidedReviewShell` | `builder/CurriculumGuidedReviewShell.tsx` | ✅ Live | Step-through review; mark reviewed; all-reviewed state |
| `CurriculumProgressRail` | `builder/CurriculumProgressRail.tsx` | ✅ Live | Progress bar; reviewed dots; jump trigger |
| `CurriculumJumpToLevelModal` | `builder/CurriculumJumpToLevelModal.tsx` | ✅ Live | Full-screen level selector |
| `CurriculumLevelBuilderShell` | `builder/CurriculumLevelBuilderShell.tsx` | ✅ Live | 5-tab builder per level |
| `CurriculumSectionCard` | `builder/CurriculumSectionCard.tsx` | ✅ Live | Collapsible section wrapper |
| `DonnaAddDrillDraft` | `builder/DonnaAddDrillDraft.tsx` | ✅ Live | UI shell; min 20 chars; draft-only |
| `DonnaAddAssessmentGateDraft` | `builder/DonnaAddAssessmentGateDraft.tsx` | ✅ Live | UI shell; min 20 chars; draft-only |
| `DonnaAddFitnessExerciseDraft` | `builder/DonnaAddFitnessExerciseDraft.tsx` | ✅ Live | UI shell; min 20 chars; draft-only |
| `DonnaCurriculumContextPanel` | `builder/DonnaCurriculumContextPanel.tsx` | ✅ Live | Drill/gate observation panel |
| `DonnaSafetyDisclosure` | `builder/DonnaSafetyDisclosure.tsx` | ✅ Live | 3-context safety copy |
| `CurriculumChangeQueue` | `builder/CurriculumChangeQueue.tsx` | ✅ Live | Change item list; status icons |
| `CurriculumImpactPreviewPanel` | `builder/CurriculumImpactPreviewPanel.tsx` | ✅ Live | 3-metric impact display |
| `CurriculumImpactScopeControls` | `builder/CurriculumImpactScopeControls.tsx` | ✅ Live | Level / stage / all-levels scope toggle |
| `CurriculumSufficiencyLabel` | `builder/CurriculumSufficiencyLabel.tsx` | ✅ Live | sufficient / low / missing badge |
| `CurriculumReadOnlyBadge` | `builder/CurriculumReadOnlyBadge.tsx` | ✅ Live | Lock icon + reason copy |
| `CurriculumLevelEmptyState` | `builder/CurriculumLevelEmptyState.tsx` | ✅ Live | Per-tab empty state with DONNA CTA |
| `CurriculumSetupState` | `builder/CurriculumSetupState.tsx` | ✅ Live | First-run setup state |
| `CoachSuggestionBoundary` | `builder/CoachSuggestionBoundary.tsx` | ✅ Live | Explains coach suggestion flow |

## Routes

| Route | Page | Status |
|-------|------|--------|
| `/director/curriculum` | `curriculum/page.tsx` | ✅ Live |
| `/director/curriculum/map` | `curriculum/map/page.tsx` | ✅ Live |
| `/director/curriculum/guided` | `curriculum/guided/page.tsx` | ✅ Live |
| `/director/curriculum/level/[levelId]` | `curriculum/level/[levelId]/page.tsx` | ✅ Live |

## What is NOT wired yet

- `DonnaAddDrillDraft` / `DonnaAddAssessmentGateDraft` / `DonnaAddFitnessExerciseDraft` are UI shells. They do not write to `proposed_actions`. This is intentional for V1 pilot.
- `CurriculumImpactPreviewPanel` shows a null state by default — caller must supply an `ImpactEstimate`. No live calculation exists yet.
- `CurriculumChangeQueue` receives static `items` prop — no live DB query wired in any page yet.
