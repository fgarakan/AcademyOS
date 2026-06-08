# DONNA Template Creation Completion
**Sprint:** Mega Sprint 1145–1174
**Date:** 2026-06-08

---

## What was already working

`template_builder_completion` had Q&A loop (PASS) and page state sync (Sprint 934C, PASS):
- Class create page had `onPageStatePatch` listener for `template_name`, `level`, `objective`
- DONNA questions fired, fields pre-filled

**Gap:** `donna:goal-session-completed` fired but zero pages consumed it. Draft submission never triggered.

---

## Class template flow (template_builder_completion)

```
"Donna, build a class template"
    ↓
DONNA navigates to /director/templates/class/create
DONNA asks 6 questions (template_purpose, session_duration, session_focus,
                         block_structure, key_drills, target_level)
    ↓ onPageStatePatch (existing) → template_name, level, objective pre-fill
Both sessions answer all 6 → donna:goal-session-completed dispatched
    ↓ onGoalSessionCompleted (new in Sprint 1145)
    → buildWorkflowExecutionPlan → WorkflowExecutionPlan (6 required fields)
    → donnaPlan state set → DONNA review banner shown above template name input
Director reviews → clicks "Confirm & Save Template Draft"
    ↓ buildWorkflowDraftPayload (null if readyToSubmit=false)
    → parseBlockStructure(block_structure) → Block[] with realistic durations
    → parseDrillsList(key_drills) → string[] attached to first technical block
    → saveClassTemplateDraftFromWizardAction called
    ← { success: true, reviewRequestId: 'rr_xyz' }
    ↓ buildWorkflowVerificationResult (verified: reviewRequestId !== null)
    ↓ buildWorkflowCompletionSummary
    → donnaMessage: "Template saved. '...' is in the template library."
    → donnaCompletion state set → success banner shown
```

---

## Fitness template flow (fitness_template_builder_completion) — new workflow

```
"Donna, build a fitness template"
    ↓
DONNA navigates to /director/templates/fitness/create
DONNA asks 4 questions (fitness_level, fitness_goal, fitness_load, fitness_duration)
    ↓ onPageStatePatch → level, goal (normaliseFitnessGoal), load, durationMin pre-fill
All 4 answered → donna:goal-session-completed dispatched
    ↓ onGoalSessionCompleted
    → buildWorkflowExecutionPlan → WorkflowExecutionPlan (4 required fields)
    → donnaPlan set → review banner shown
Director clicks "Confirm & Save Fitness Draft"
    ↓ buildFitnessBlocksFromGoal(goalId, durationMin) → 3-block structure
    → saveFitnessTemplateDraftFromWizardAction called
    ← { success: true, reviewRequestId: 'rr_abc' }
    ↓ buildWorkflowVerificationResult → verified: true
    ↓ buildWorkflowCompletionSummary
    → donnaMessage: "Fitness template saved."
    → success banner shown
```

---

## Files modified

| File | Role |
|---|---|
| `src/app/director/templates/class/create/page.tsx` | Added `onGoalSessionCompleted` listener, DONNA state, parsing helpers, `handleDonnaConfirm`, `renderDonnaBanner` |
| `src/app/director/templates/fitness/create/page.tsx` | Full DONNA wiring: `onPageStatePatch` + `onGoalSessionCompleted` + DONNA state + confirm/dismiss/banner |
| `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` | Added `fitness_template_builder_completion` (4 required steps) |
| `src/lib/donna/guidedCompletion/guidedCompletionStepRunner.ts` | Added exhaustive case for `fitness_template_builder_completion` |
| `src/lib/donna/pageSync/donnaPageStateSync.ts` | Added fitness field map (4 fields) |
| `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` | Added fitness to WORKFLOW_META + WORKFLOW_DRAFT_TYPE + completion message |
| `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts` | Added fitness to WORKFLOW_DRAFT_TYPE |

---

## Answer parsing — class template

| Answer field | Parser | Example input → output |
|---|---|---|
| `block_structure` | `parseBlockStructure()` | "warm-up, skill, games, cool-down" → 4 Block objects |
| `key_drills` | `parseDrillsList()` | "Cone target, Rally line, Down-the-line" → 3 strings |
| Duration (block) | block.durationMin | warm-up/cool-down: 10min; others: 20min |

`parseBlockStructure` maps free text (comma-separated) to `BLOCK_TYPES` IDs via a normalisation lookup. Key_drills are attached to the first `technical` or `tactical` block found.

## Answer parsing — fitness template

| Answer field | Parser | Example input → output |
|---|---|---|
| `fitness_goal` | `normaliseFitnessGoal()` | "speed & agility" → `speed_agility` |
| `fitness_load` | case-insensitive trim | "light" → "Light" |
| `fitness_duration` | parseInt strip | "30 min" → 30 |

`buildFitnessBlocksFromGoal(goalId, totalMin)` creates a 3-block structure: movement warm-up (20%), main goal block (65%), recovery cool-down (15%).

---

## Guarantees

| Guarantee | Evidence |
|---|---|
| No mutation without director confirmation | `buildWorkflowDraftPayload` null guard; confirm button disabled until `readyToSubmit=true` |
| Standard form path unchanged | `handleSaveDraft` and standard submit untouched on both pages |
| Both paths call the same server action | DONNA path uses same `saveClassTemplateDraftFromWizardAction` / `saveFitnessTemplateDraftFromWizardAction` |
| Template goes to review queue | Server actions insert into `template_review_requests` — director must approve before coaches see it |
| "Set by DONNA" indicators | Both pages show badges when DONNA pre-fills fields |
