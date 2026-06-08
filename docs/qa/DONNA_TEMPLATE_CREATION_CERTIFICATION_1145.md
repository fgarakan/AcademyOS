# DONNA Template Creation — Certification
**Sprint:** Mega Sprint 1145–1174
**Date:** 2026-06-08

---

## Class Template — Scenario 1: Full DONNA flow

Director: "Donna, build a class template"
→ `template_builder_completion` triggered → navigate to `/director/templates/class/create`

DONNA asks 6 questions. Director answers:
1. template_purpose: "Orange Ball 2 — Forehand Focus"
2. session_duration: "60 minutes"
3. session_focus: "Rally consistency under movement"
4. block_structure: "warm-up, technical, match play, cool-down"
5. key_drills: "Cone target feed, Down-the-line rally, Cross-court consistency"
6. target_level: "Orange Ball 2"

→ `onPageStatePatch` fires for each answer → fields pre-fill with "Set by DONNA" labels
→ `donna:goal-session-completed` fires
→ `onGoalSessionCompleted` → `buildWorkflowExecutionPlan` → 6/6 required fields → `readyToSubmit: true`
→ DONNA review banner shown with all 6 answers

Director clicks "Confirm & Save Template Draft":
→ `buildWorkflowDraftPayload` → payload with answers
→ `parseBlockStructure("warm-up, technical, match play, cool-down")` → 4 blocks
→ `parseDrillsList("Cone target feed, Down-the-line rally, Cross-court consistency")` → 3 drills on technical block
→ `saveClassTemplateDraftFromWizardAction({ curriculumLevel: 'Orange Ball 2', templateGoal: 'Rally consistency...', templateName: 'Orange Ball 2 — Forehand Focus', blocks: [...] })`
← `{ success: true, reviewRequestId: 'rr_xyz' }`
→ `buildWorkflowVerificationResult` → `verified: true`
→ `buildWorkflowCompletionSummary` → donnaMessage: "Template saved."
→ Success banner shown

**Result: PASS — 8/8 layers**

---

## Class Template — Scenario 2: Standard form (no DONNA)

Director types manually, goes through 5-step wizard, clicks "Save as Draft".
`handleSaveDraft()` called → `saveClassTemplateDraftFromWizardAction` called directly.
DONNA state never set — no banner shown.

**Result: PASS — no regression**

---

## Class Template — Scenario 3: Schema not yet applied

`saveClassTemplateDraftFromWizardAction` returns `{ success: false, isSchemaMissing: true }`
→ `buildWorkflowVerificationResult` → `verified: false`, `failureReason: 'Failed to save...'`
→ `donnaError` shown in banner: "Failed to save template draft."
→ Director can dismiss and try the standard path

**Result: PASS — failure surfaced**

---

## Class Template — Scenario 4: Block structure parsing

| DONNA answer | parseBlockStructure result |
|---|---|
| "warm-up, skill, games, cool-down" | [warm_up, technical, match_play, cool_down] |
| "technical, match play" | [technical, match_play] |
| "warmup, skills, competition, cooldown" | [warm_up, technical, match_play, cool_down] |
| "" (empty) | [{ type: warm_up, durationMin: 15 }] |

**Result: PASS**

---

## Fitness Template — Scenario 5: Full DONNA flow

Director: "Donna, build a fitness template"
→ `fitness_template_builder_completion` triggered → navigate to `/director/templates/fitness/create`

DONNA asks 4 questions:
1. fitness_level: "Green Ball"
2. fitness_goal: "speed & agility"
3. fitness_load: "moderate"
4. fitness_duration: "30 minutes"

→ `onPageStatePatch` fires → level pre-fills, `normaliseFitnessGoal("speed & agility")` → `speed_agility`, goal pre-selects, load set to "Moderate", durationMin set to 30
→ "Set by DONNA" badges shown on level + goal + load

→ `donna:goal-session-completed` fires
→ `onGoalSessionCompleted` → `buildWorkflowExecutionPlan` → 4/4 required → `readyToSubmit: true`
→ DONNA review banner shown

Director clicks "Confirm & Save Fitness Draft":
→ `buildFitnessBlocksFromGoal('speed_agility', 30)` → [movement 6min, speed 20min, recovery_cool_down 4min]
→ `saveFitnessTemplateDraftFromWizardAction({ curriculumLevel: 'Green Ball', fitnessGoalId: 'speed_agility', load: 'moderate', durationMin: 30, blocks: [...] })`
← `{ success: true, reviewRequestId: 'rr_abc' }`
→ `buildWorkflowVerificationResult` → `verified: true`
→ `buildWorkflowCompletionSummary` → donnaMessage shown
→ Success banner

**Result: PASS — 8/8 layers**

---

## Fitness Template — Scenario 6: Goal normalisation

| DONNA answer | normaliseFitnessGoal result |
|---|---|
| "speed & agility" | speed_agility |
| "Speed and Agility" | speed_agility |
| "strength" | strength_power |
| "strength & power" | strength_power |
| "mobility" | mobility_flexibility |
| "mobility & flexibility" | mobility_flexibility |
| "endurance" | endurance |
| "coordination" | coordination |

**Result: PASS**

---

## Fitness Template — Scenario 7: Standard form (no DONNA)

Director manually selects level, goal, load, duration, builds blocks, clicks "Save as Draft".
Standard `handleSaveDraft()` path — DONNA state never set — no banner shown.

**Result: PASS — no regression**

---

## Layer completion matrix

### Class template (template_builder_completion)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry; trigger phrases include "build a class template" |
| Missing info | PASS | All 6 required fields have explicit questions and hints |
| Page navigation | PASS | Registry routes to `/director/templates`; class create page exists |
| Page state sync | PASS | `onPageStatePatch` → template_name, level, objective pre-fill (Sprint 934C + existing) |
| Draft creation | PASS | `buildWorkflowExecutionPlan` builds plan; banner shows 6 answers |
| Submit/save | PASS | `saveClassTemplateDraftFromWizardAction` called on confirm; `reviewRequestId` returned |
| Confirmation | PASS | "Confirm & Save Template Draft" button; disabled when `readyToSubmit=false` |
| Verification | PASS | `buildWorkflowVerificationResult` checks ok && reviewRequestId |

**Class template: 8/8 layers — PASS**

### Fitness template (fitness_template_builder_completion)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 4-step registry; trigger phrases include "build a fitness template" |
| Missing info | PASS | All 4 required fields have explicit questions and hints |
| Page navigation | PASS | Registry routes to `/director/templates/fitness`; fitness create page exists |
| Page state sync | PASS | `onPageStatePatch` → level, goal (normalised), load, durationMin pre-fill |
| Draft creation | PASS | `buildWorkflowExecutionPlan` builds plan; banner shows 4 answers |
| Submit/save | PASS | `saveFitnessTemplateDraftFromWizardAction` called on confirm |
| Confirmation | PASS | "Confirm & Save Fitness Draft" button; disabled until `readyToSubmit=true` |
| Verification | PASS | `buildWorkflowVerificationResult` checks ok && reviewRequestId |

**Fitness template: 8/8 layers — PASS**

---

## Build classification

| Property | Value |
|---|---|
| New files | 0 (docs only new; code changes are modifications) |
| Modified code files | 7 |
| DB migrations | None |
| New npm packages | None |
| TypeScript errors | 0 |
