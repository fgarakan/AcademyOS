# DONNA Workflow Execution Engine
**Sprint:** Mega Sprint 1055–1084
**Date:** 2026-06-08
**File:** `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts`

---

## Purpose

One canonical execution layer between DONNA goal session completion and server action mutation. Every DONNA-guided creation workflow (player, template, assessment, parent update, curriculum, academy setup) uses the same lifecycle — not a per-workflow custom implementation.

---

## Lifecycle

```
1. Goal Session Q&A loop
   - DONNA asks one question at a time (guidedCompletionRegistry)
   - Answers stored in guidedCompletionSessionMemory (sessionStorage, 4h TTL)
   - Each answer dispatches a PageStatePatch event → page updates visible form fields

2. goal_session_complete event dispatched by DonnaVoiceReadyShell
   - Event: donna:goal-session-completed
   - Payload: { workflowId, draftType, answers }
   - No page was listening to this event before Sprint 1055

3. buildWorkflowExecutionPlan(detail) → WorkflowExecutionPlan
   - Page receives the completed event
   - Calls buildWorkflowExecutionPlan() with the event detail
   - Returns a plan with: all fields, readyToSubmit flag, validation errors
   - Plan is immutable — page shows it, director reads it

4. Director reviews plan (DonnaWorkflowReviewBanner)
   - Page renders plan.fields as a summary table
   - "Confirm & Save" button enabled only when plan.readyToSubmit === true
   - Director can edit any field before confirming (page form state takes precedence)

5. Director clicks "Confirm & Save"
   - Page calls buildWorkflowDraftPayload(plan) → WorkflowDraftPayload
   - Page passes payload to its own server action (engine does not call actions)
   - Server action creates the entity, writes audit log, returns { ok, entityId, redirectTo }

6. Page wraps server action result → WorkflowSubmitResult
   - Page constructs WorkflowSubmitResult from its action's response
   - Calls buildWorkflowVerificationResult(submitResult)

7. buildWorkflowVerificationResult(submitResult) → WorkflowVerificationResult
   - Verified = ok === true AND entityId !== null
   - Does not require a DB read — the server action is the source of truth

8. buildWorkflowCompletionSummary(workflowId, verification, answers) → WorkflowCompletionSummary
   - Builds the DONNA message content
   - Page pushes donnaMessage into the DONNA conversation stream
   - DONNA tells Brian: "Jamie has been added. Next: onboarding."
```

---

## Type hierarchy

```
GoalSessionCompletedDetail         ← from donnaPageSyncEvents.ts
  ↓ buildWorkflowExecutionPlan()
WorkflowExecutionPlan              ← THIS ENGINE
  ↓ buildWorkflowDraftPayload()
WorkflowDraftPayload               ← THIS ENGINE — passed to server action
  ↓ server action (page-owned)
WorkflowSubmitResult               ← THIS ENGINE — page wraps action result
  ↓ buildWorkflowVerificationResult()
WorkflowVerificationResult         ← THIS ENGINE
  ↓ buildWorkflowCompletionSummary()
WorkflowCompletionSummary          ← THIS ENGINE — rendered as DONNA message
```

---

## Types

### WorkflowFieldSummary
One answer from the goal session, formatted for the review UI.

| Field | Type | Description |
|---|---|---|
| fieldId | string | Registry step fieldId |
| displayLabel | string | Truncated step question (≤60 chars) |
| value | string | Director's raw answer |
| required | boolean | Whether this field must be filled |
| filled | boolean | Whether value is non-empty |

### WorkflowExecutionPlan
The full plan shown in the review banner.

| Field | Type | Description |
|---|---|---|
| planId | string | Unique ID (format: wep_{timestamp}_{counter}) |
| workflowId | GuidedWorkflowId | The workflow that produced this plan |
| draftType | string | Draft type label |
| answers | Record<string, string> | All collected answers |
| fields | WorkflowFieldSummary[] | Ordered field summaries |
| readyToSubmit | boolean | True when all required fields are filled |
| validationErrors | string[] | User-facing messages when not ready |
| builtAt | number | Unix timestamp |

### WorkflowDraftPayload
Passed to the server action on director confirmation.

| Field | Type | Description |
|---|---|---|
| workflowId | GuidedWorkflowId | Workflow identifier |
| draftType | string | Draft type |
| answers | Record<string, string> | All answers |
| planId | string | Traceability link to the plan |
| directorConfirmedAt | number | When the director clicked confirm |

### WorkflowValidationResult
| Field | Type | Description |
|---|---|---|
| valid | boolean | True when all required fields are filled |
| errors | string[] | User-facing error messages |
| missingFields | string[] | FieldIds with no answer |

### WorkflowSubmitResult
Built by the page from its server action response.

| Field | Type | Description |
|---|---|---|
| ok | boolean | Whether the action succeeded |
| entityId | string \| null | Created entity ID |
| entityType | string | "player", "template", "assessment", etc. |
| redirectTo | string \| null | Post-creation navigation target |
| error | string \| null | Error message when ok=false |

### WorkflowVerificationResult
| Field | Type | Description |
|---|---|---|
| verified | boolean | ok=true AND entityId present |
| entityExists | boolean | Entity ID was returned |
| entityLabel | string \| null | Display label |
| checkPath | string \| null | URL to the created entity |
| failureReason | string \| null | Error when verified=false |
| verifiedAt | number | Unix timestamp |

### WorkflowCompletionSummary
The final DONNA message data.

| Field | Type | Description |
|---|---|---|
| workflowId | GuidedWorkflowId | Workflow identifier |
| draftType | string | Draft type |
| entityLabel | string \| null | What was created |
| entityPath | string \| null | URL to the entity |
| donnaMessage | string | Formatted DONNA message (markdown) |
| nextSuggestedAction | string \| null | Label for next action |
| nextSuggestedRoute | string \| null | Route for next action |
| completedAt | number | Unix timestamp |

---

## Functions

| Function | Input | Output | Purpose |
|---|---|---|---|
| `buildWorkflowExecutionPlan` | `GoalSessionCompletedDetail` | `WorkflowExecutionPlan \| null` | Build plan from completed session |
| `validateWorkflowDraft` | `WorkflowExecutionPlan` | `WorkflowValidationResult` | Validate plan before confirm |
| `buildWorkflowDraftPayload` | `WorkflowExecutionPlan` | `WorkflowDraftPayload \| null` | Build payload for server action |
| `buildWorkflowVerificationResult` | `WorkflowSubmitResult, entityLabel?` | `WorkflowVerificationResult` | Interpret action result |
| `buildWorkflowCompletionSummary` | `workflowId, verification, answers` | `WorkflowCompletionSummary` | Build DONNA completion message |
| `formatWorkflowReviewBanner` | `WorkflowExecutionPlan` | `string` | Text fallback for review UI |
| `getAllWorkflowMeta` | — | `Array<{workflowId, label, entityType, ...}>` | Audit/dashboard use |

---

## Workflow metadata

| Workflow | entityType | nextAction | nextRoute |
|---|---|---|---|
| player_onboarding_completion | player | Complete player onboarding | /director/players |
| template_builder_completion | template | View templates | /director/class-templates |
| assessment_completion | assessment | View player profile | /director/players |
| parent_update_completion | parent_update | Review queue | /director/review |
| curriculum_builder_completion | curriculum_level | View curriculum | /director/curriculum |
| academy_setup_completion | academy_setup | Director home | /director |

---

## Integration pattern (per page)

Pages that wire to the engine follow this exact pattern:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'
import { myServerAction } from './myServerAction'

export function MyPage() {
  const [donnaPlan, setDonnaPlan] = useState<WorkflowExecutionPlan | null>(null)

  // Step 1: Listen for DONNA completion
  useEffect(() => onGoalSessionCompleted(detail => {
    if (detail.workflowId !== 'my_workflow_completion') return
    const plan = buildWorkflowExecutionPlan(detail)
    if (plan) setDonnaPlan(plan)
  }), [])

  // Step 2: Director confirms
  async function handleConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    const actionResult = await myServerAction(payload.answers)
    const submitResult = {
      ok:         !actionResult.error,
      entityId:   actionResult.id ?? null,
      entityType: 'player',
      redirectTo: actionResult.id ? `/director/players/${actionResult.id}/onboard` : null,
      error:      actionResult.error ?? null,
    }

    // Step 3: Verify and summarize
    const verification = buildWorkflowVerificationResult(submitResult)
    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary(donnaPlan.workflowId, verification, donnaPlan.answers)
      // Push summary.donnaMessage to DONNA conversation stream
      setDonnaPlan(null)
    }
  }

  return (
    <div>
      {donnaPlan && (
        <DonnaWorkflowReviewBanner plan={donnaPlan} onConfirm={handleConfirm} />
      )}
      {/* rest of page */}
    </div>
  )
}
```

---

## Guarantees

| Guarantee | How enforced |
|---|---|
| No hidden mutation | Engine is pure TypeScript — no DB, no API calls |
| Director must confirm | `buildWorkflowDraftPayload` returns null when plan.readyToSubmit is false |
| Page owns form state | Engine provides plan; page reconciles with its form |
| No save without entityId verification | `buildWorkflowVerificationResult` sets verified=false when entityId is null |
| All mutations are audited | Server actions are responsible for audit log writes |
| DONNA completion message is honest | Message text is workflow-specific and tied to actual answers |

---

## Files created this sprint

| File | Purpose |
|---|---|
| `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` | The engine — types, factory functions, lifecycle |
| `docs/architecture/DONNA_WORKFLOW_EXECUTION_ENGINE_1055.md` | This document |
| `docs/qa/DONNA_WORKFLOW_EXECUTION_ENGINE_CERTIFICATION_1055.md` | Certification scenarios |
