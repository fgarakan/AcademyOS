# Curriculum Builder Architecture Mapping — Sprint 759

**Sprint:** 759
**Date:** 2026-05-17

---

## Architecture Decision

The 10/10 curriculum builder is built as new sub-routes and components layered onto the existing `/director/curriculum` surface. No existing routes are replaced.

### Route Architecture

```
/director/curriculum               ← Entry (improved with DONNA welcome + map link)
/director/curriculum/map           ← NEW: Visual level map view
/director/curriculum/guided        ← NEW: Guided review flow (step through levels)
/director/curriculum/level/[id]    ← NEW: Level detail builder mode
```

The existing routes remain unchanged:
```
/director/curriculum/builder       ← Existing: Curriculum setup wizard
/director/curriculum/academy-version ← Existing: Academy version card
/director/curriculum/learning      ← Existing: Learning modules preview
```

### Component Architecture

New components live in `src/components/curriculum/builder/`:

```
builder/
  CurriculumBuilderWelcome.tsx     ← DONNA welcome panel + chips
  CurriculumLevelMap.tsx           ← Visual level map (all 15 levels)
  CurriculumLevelCard.tsx          ← Single level card for the map
  CurriculumGuidedReviewShell.tsx  ← Guided review container
  CurriculumProgressRail.tsx       ← Progress rail for guided review
  CurriculumJumpToLevelModal.tsx   ← Jump-to-level overlay
  CurriculumLevelBuilderShell.tsx  ← Level detail in builder mode
  CurriculumLevelSectionCard.tsx   ← Section (drills/gates/fitness) card
  DonnaCurriculumPanel.tsx         ← DONNA sidebar for curriculum
  DonnaAddDrillDraft.tsx           ← DONNA add drill chip + draft form
  DonnaAddFitnessExerciseDraft.tsx ← DONNA add fitness exercise chip
  DonnaAddAssessmentGateDraft.tsx  ← DONNA add assessment gate chip
  CurriculumImpactPreviewPanel.tsx ← Impact preview (extended from existing)
  CurriculumImpactScopeControls.tsx ← Scope filter controls
  CurriculumChangeQueue.tsx        ← Pending curriculum changes list
  CurriculumRelationshipMap.tsx    ← Level → drill → gate → player → session map
  CurriculumFirstTimeSetupState.tsx ← First-time setup guide (no curriculum yet)
  CurriculumEmptyState.tsx         ← Empty/missing content states
  CurriculumDataSufficiencyLabel.tsx ← Data quality label component
  CurriculumDonnaSafetyCopy.tsx    ← DONNA boundary copy
  CurriculumCoachSuggestionBoundary.tsx ← What coaches can/cannot suggest
```

### Data Architecture

All new builder views use the existing `getCurriculumExplorerData()` backend call:
- `CurriculumExplorerData` type includes: levels, drills per level, gates per level, coach language
- No new DB queries needed for read-only builder views
- DONNA drafts write to `proposed_actions` (existing pipeline)

### State Architecture

- Guided review: URL-based level index (`?level=0`, `?level=1`)
- Jump-to-level modal: client-side state (`useState`)
- DONNA panel: client-side state; panel open/close in URL param (`?donna=1`)
- Change queue: read from `proposed_actions` table via existing server action

### Design System

All new curriculum builder components use:
- `bg-surface` / `bg-surface-raised` for cards
- `border-border` with lime accents for selected/active states
- Stage colors from `CurriculumExplorer.tsx` STAGE_CONFIG
- `label-xs` / `page-eyebrow` typography utilities
- `btn-lime` / `btn-ghost` button classes
- No new Tailwind classes — only existing design tokens

### Safety Architecture

All new builder interactions follow the same pipeline:
1. Director speaks or types a curriculum instruction
2. DONNA creates a `proposed_action` with `status: 'pending_review'`
3. Change appears in curriculum change queue (proposed_actions)
4. Director approves in review queue
5. `execute_approved_action()` applies the change

**No curriculum change can be applied directly from the builder view.**

---

## Sprint Sequencing Rationale

| Phase | Sprints | Goal |
|---|---|---|
| Foundation | 760–766 | Entry, map, level card — visual baseline |
| Guided review | 767–770 | Step-through UX, skip/jump, level modal |
| Level detail | 771–776 | Level builder with DONNA drill/gate drafts |
| Pipeline | 777–780 | Impact preview, change queue, relationship map |
| States | 781–786 | First-time, empty, read-only, sufficiency, safety |
| Polish | 787–799 | Mobile, desktop, navigation, loading, errors |
| Pilot | 800–809 | Demo script, dataset, guide, audit |
| Sublayers | 810–840 | Assessment gates, skill paths, competition, fitness, missions |

---

## Verdict

Architecture is clean and additive. No existing routes or components are modified in the build phase. All new code is layered on top of the existing curriculum surface.
