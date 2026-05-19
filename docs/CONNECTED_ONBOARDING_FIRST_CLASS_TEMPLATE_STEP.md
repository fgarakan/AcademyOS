# Connected Onboarding First Class Template Step

**Date:** 2026-05-19
**Sprint:** OF-4

---

## Summary

Replaced `FirstClassTemplatePlaceholder` in `OnboardingShell.tsx` with a fully-built `FirstClassTemplateStep` component (step 5 of 11). DONNA suggests a starting template from Academy DNA and Curriculum Builder selections. Directors can keep, adjust, or build a custom set of class template blocks. All data stays local as an onboarding draft — nothing is published or sent to coaches.

---

## Files created

### `src/components/onboarding/templates/ClassTemplateBlockSelector.tsx`

- Exports `CLASS_BLOCKS` — the 9-block class template model:
  Warm-Up, Drills, Skills, Tactics, Games, Point Play, Match Play, Assessment Moment, Reflection / Wrap-Up
- Each block has: `id`, `label`, `desc`, `defaultDuration`, `coachCue`, `playerWatchFor`, `evidenceOpp`, `curriculumConnection`
- Renders a 2-column grid of selectable block cards
- Unselected state: block name + description + Add button
- Selected state: lime highlight bar, duration control (+/- in 5-min increments, 5–60 min range), Coach Cue, Player Watch-For, Evidence Opportunity, Curriculum Connection badge, "Add video later" button

### `src/components/onboarding/templates/ClassTemplateDraftPreview.tsx`

- Imports `CLASS_BLOCKS` from `ClassTemplateBlockSelector`
- Renders a "Coach preview" card with proportional timeline bar + numbered block list + total duration
- Footer: "This stays as an onboarding draft. Nothing is published or sent to coaches yet."
- Returns `null` when no blocks are selected

### `src/components/onboarding/steps/FirstClassTemplateStep.tsx`

- `stepNumber={5}` / `totalSteps={11}` via `OnboardingStepHeader`
- `computeDonnaSuggestion(draft)` — derives suggested block order from:
  - Session blocks from Curriculum Builder step (technique-blocks → drills, live-ball-heavy → skills, constraint-games → games, point-play → point-play, assessment → assessment-moment)
  - Coaching DNA styles (high-performance/competition-ready, game-based/joy-retention, tactical-first, fundamentals-first/movement-first, balanced default)
  - Curriculum starting point (performance-focused adds match-play)
- "Apply DONNA's suggestion" button populates `classTemplateDraft.selectedBlocks` and `blockDurations` with defaults
- After applying: shows "Suggestion applied — adjust below as needed"
- Block selector embedded below — directors can add/remove/adjust durations
- Draft preview appears once any blocks are selected
- Skip / Continue navigation: Skip sets `classTemplateDraft.skipped = true` and advances

---

## Changes to `OnboardingShell.tsx`

- Added `blockDurations: Record<string, number>` to `ClassTemplateDraftData` interface
- Updated `defaultDraft.classTemplateDraft` to include `blockDurations: {}`
- Added import: `FirstClassTemplateStep`
- Replaced `FirstClassTemplatePlaceholder` render at `currentStep === 4` with `<FirstClassTemplateStep />`
- Removed `FirstClassTemplatePlaceholder` function

---

## Draft fields written

| Field | Type | Description |
|---|---|---|
| `classTemplateDraft.selectedBlocks` | `string[]` | Block IDs in template order |
| `classTemplateDraft.blockDurations` | `Record<string, number>` | Per-block duration overrides |
| `classTemplateDraft.skipped` | `boolean` | True if director skipped this step |

---

## Copy rules followed

Used: "Draft first class template", "Coach preview", "Add video later", "This stays as an onboarding draft", "Nothing is published or sent to coaches yet."
Not used: "Template created", "Published", "Sent to coaches", "Applied to academy."

---

## Safety rules

- No DB writes
- No migrations
- No schema changes
- No package changes
- No real template creation
- No real media uploads
- All data local-only (localStorage v2 key)
- Step fully skippable
