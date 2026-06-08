# DONNA Player Creation Completion
**Sprint:** Mega Sprint 1085–1114
**Date:** 2026-06-08

---

## Flow

```
"Donna, add a player"
    ↓
DONNA navigates to /director/players/new
DONNA asks: "What is the player's full name?"
    ↓ onPageStatePatch (player_name)
    → splitFullName → first_name + last_name fields pre-fill + "Set by DONNA" badge
DONNA asks: "How old is the player?"
    ↓ onPageStatePatch (player_age)
    → toIsoDate → date_of_birth field pre-fills + "Set by DONNA" badge
DONNA asks: recommended_level, assigned_coach, assigned_group, parent_contact
    ↓ onPageStatePatch for each (displayed in DONNA panel, not directly patched to form)
All 6 steps answered → goal_session_complete dispatched
    ↓ onGoalSessionCompleted
    → buildWorkflowExecutionPlan → WorkflowExecutionPlan
    → donnaPlan state set → DONNA review banner appears above form
Director reviews banner (all answers listed)
Director clicks "Confirm & Create Player"
    ↓ buildWorkflowDraftPayload
    → createPlayerDonnaAction called
    ← { ok: true, playerId, redirectTo: /director/players/{id}/onboard }
    ↓ buildWorkflowVerificationResult
    → verified: true
    ↓ buildWorkflowCompletionSummary
    → donnaMessage: "Jamie Torres has been added. Next: onboarding."
    → donnaCompletion state set → success banner shown
After 2s → router.push(/director/players/{id}/onboard)
```

---

## Files

| File | Role |
|---|---|
| `src/app/director/players/new/NewPlayerForm.tsx` | Extended with DONNA state, listeners, review banner |
| `src/app/director/players/new/createPlayerDonnaAction.ts` | Server action for DONNA path — returns playerId, no redirect |
| `src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts` | Engine — plan, payload, verify, summary (Sprint 1055) |
| `src/lib/donna/pageSync/donnaPageSyncEvents.ts` | onPageStatePatch + onGoalSessionCompleted listeners |

---

## Name splitting

DONNA collects `player_name` as a full name string (e.g. "Jamie Torres").
The form requires `first_name` + `last_name` separately.

```typescript
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  const lastName  = parts[parts.length - 1]
  const firstName = parts.slice(0, parts.length - 1).join(' ')
  return { firstName, lastName }
}
```

Multi-word first names: "Mary Jane Watson" → firstName="Mary Jane", lastName="Watson". Correct.

---

## Age → DOB conversion

DONNA collects `player_age` as age (e.g. "10") or ISO date (e.g. "2015-03-15").
The form requires a date of birth.

```typescript
function toIsoDate(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const age = parseInt(trimmed, 10)
  if (!isNaN(age) && age >= 1 && age <= 25) return `${new Date().getFullYear() - age}-01-01`
  return ''
}
```

Age-based DOB uses January 1 of the birth year. Director can correct the exact date in the form before confirming.

---

## createPlayerDonnaAction

Identical logic to `createPlayerAction` with two differences:
1. Accepts structured params instead of FormData
2. Returns `{ ok, playerId, redirectTo, error }` instead of calling `redirect()`

This allows the client to build a DONNA completion summary before navigating.

Audit log includes `source: 'donna_workflow'` and `plan_id` for traceability.

---

## Field wiring scope

| DONNA field | Page field | Wiring |
|---|---|---|
| player_name | first_name + last_name | PASS — split on onPageStatePatch |
| player_age | date_of_birth | PASS — converted on onPageStatePatch |
| intake_notes | notes | PASS — direct patch |
| recommended_level | — | NOT WIRED — no level field on create form; set in onboarding step |
| assigned_coach | — | NOT WIRED — set in onboarding step |
| assigned_group | — | NOT WIRED — set in onboarding step |
| parent_contact | — | NOT WIRED — set in onboarding step |

Level, coach, group, and parent are collected by DONNA and shown in the review banner summary. They are not patched into the create form because the create form only creates the player record — these fields are set in the subsequent onboarding flow at `/director/players/{id}/onboard/`.

---

## Guarantees

| Guarantee | Evidence |
|---|---|
| No mutation without director confirmation | `buildWorkflowDraftPayload` returns null if `readyToSubmit=false`; "Confirm" button disabled |
| Audit log written on creation | `writeAuditLog` in `createPlayerDonnaAction` — action + plan_id logged |
| Standard form path unchanged | Only DONNA state added; form submit path unmodified |
| "Set by DONNA" indicators | Lime sparkle badge on first_name, date_of_birth when DONNA has pre-filled |
| Director can override DONNA's answers | All inputs are controlled and editable; DONNA pre-fills but doesn't lock |
| Player status is pending_placement | `status: 'pending_placement'` — same as standard path |
