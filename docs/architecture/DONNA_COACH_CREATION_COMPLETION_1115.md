# DONNA Coach Creation Completion
**Sprint:** Mega Sprint 1115–1144
**Date:** 2026-06-08

---

## Coach model

Unlike player creation, coach "creation" in AcademyOS is an **email-based invite**. The coach must already have an AcademyOS account. The `inviteCoachAction` links an existing profile to the academy by email + role. No full profile creation needed.

DONNA workflow: 2 required steps (email + role), review, confirm, link.

---

## Flow

```
"Donna, add a coach"
    ↓
DONNA navigates to /director/coaches
DONNA asks: "What is the coach's email address?"
    ↓ onPageStatePatch (coach_email → fieldId: 'email')
    → email field pre-fills + "Set by DONNA" badge
DONNA asks: "What role should they have? (coach / head_coach)"
    ↓ onPageStatePatch (coach_role → fieldId: 'role')
    → role button highlights (normaliseRole: "head_coach" → head_coach, else coach)
Both steps answered → goal_session_complete dispatched
    ↓ onGoalSessionCompleted
    → buildWorkflowExecutionPlan → WorkflowExecutionPlan (2 required fields, readyToSubmit=true)
    → donnaPlan state set → DONNA review banner appears above form
Director reviews banner → clicks "Confirm & Link Coach"
    ↓ buildWorkflowDraftPayload
    → inviteCoachAction called with { email, role }
    ← { ok: true, outcome: 'linked', coachProfileId: '...' }
    ↓ buildWorkflowVerificationResult
    → verified: true
    ↓ buildWorkflowCompletionSummary
    → donnaMessage: "coach@example.com has been linked as Coach."
    → donnaCompletion state set → success banner shown
```

---

## Files

| File | Role |
|---|---|
| `src/app/director/coaches/_components/InviteCoachForm.tsx` | Extended with DONNA state, listeners, review banner |
| `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` | Added `coach_creation_completion` workflow (2 required steps) |
| `src/lib/donna/guidedCompletion/guidedCompletionStepRunner.ts` | Added `coach_creation_completion` case to `buildActions` switch |
| `src/lib/donna/pageSync/donnaPageStateSync.ts` | Added field map for `coach_creation_completion` |
| `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` | Added `coach_creation_completion` to WORKFLOW_META + WORKFLOW_DRAFT_TYPE + completion message |
| `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts` | Added `coach_creation_completion` to WORKFLOW_DRAFT_TYPE |

---

## Role normalisation

DONNA collects `coach_role` as free text. Normalised to `'coach' | 'head_coach'`:

```typescript
function normaliseRole(raw: string): CoachRole {
  const lower = raw.toLowerCase().trim()
  if (lower.includes('head')) return 'head_coach'
  return 'coach'
}
```

Examples: "head_coach", "Head Coach", "head", "head coach" → `head_coach`. Everything else → `coach`.

---

## WorkflowSubmitResult construction

`inviteCoachAction` returns `InviteCoachResult { ok, error, outcome, coachProfileId }`.

```typescript
{
  ok:         actionResult.ok,
  entityId:   actionResult.coachProfileId ?? null,
  entityType: 'coach',
  redirectTo: coachProfileId ? '/director/coaches/{id}' : '/director/coaches',
  error:      actionResult.error,
}
```

For `outcome: 'no_account'` — `ok: false`, `error` has a helpful message. Banner shows error.
For `outcome: 'already_member'` — `ok: true`, `coachProfileId` returned. Banner shows success.
For `outcome: 'role_updated'` — `ok: true`, `coachProfileId` returned. Banner shows success.

---

## Guarantees

| Guarantee | Evidence |
|---|---|
| No mutation without director confirmation | `buildWorkflowDraftPayload` null guard; confirm button disabled until `readyToSubmit=true` |
| Standard form path unchanged | No changes to submit handler or inviteCoachAction call |
| Both DONNA and standard paths call the same server action | No new server action created — `inviteCoachAction` used directly |
| "Set by DONNA" indicators | Lime sparkle on email + role labels when DONNA has pre-filled |
| Director can override DONNA's answers | Email and role are controlled and editable before confirming |
