# DONNA Coach Creation — Certification
**Sprint:** Mega Sprint 1115–1144
**Date:** 2026-06-08

---

## Scenario 1 — Full flow: "Donna, add a coach"

Director: "Donna, add a coach"
→ `coach_creation_completion` triggered → navigate to `/director/coaches`

Step 1: "What is the coach's email address?"
Director: "sarah@tennis.com"
→ `onPageStatePatch` fires with `{ fieldId: 'email', value: 'sarah@tennis.com' }`
→ Email field pre-fills + "Set by DONNA" badge

Step 2: "What role should they have?"
Director: "head coach"
→ `onPageStatePatch` fires with `{ fieldId: 'role', value: 'head coach' }`
→ `normaliseRole("head coach")` → `'head_coach'`
→ Head Coach button highlights + "Set by DONNA" badge

`goal_session_complete` fired:
→ `onGoalSessionCompleted` → `buildWorkflowExecutionPlan` → plan built
→ 2 required fields filled → `readyToSubmit: true`
→ DONNA review banner shown with email + role

Director clicks "Confirm & Link Coach":
→ `inviteCoachAction({ email: 'sarah@tennis.com', role: 'head_coach' })`
← `{ ok: true, outcome: 'linked', coachProfileId: 'profile_xyz' }`
→ `buildWorkflowVerificationResult` → `verified: true`
→ `buildWorkflowCompletionSummary` → donnaMessage: "sarah@tennis.com has been linked as Head Coach."
→ Success banner shown

**Result: PASS — 8/8 layers**

---

## Scenario 2 — Coach has no account

`inviteCoachAction` returns `{ ok: false, outcome: 'no_account', error: 'No account found for ...' }`
→ `buildWorkflowVerificationResult` → `verified: false`, `failureReason: 'No account found...'`
→ `donnaError` state set → error shown in banner
→ Director can dismiss and use standard form, or try a different email

**Result: PASS — failure surfaced clearly**

---

## Scenario 3 — Already a member

`inviteCoachAction` returns `{ ok: true, outcome: 'already_member', coachProfileId: '...' }`
→ `verified: true` (entityId present)
→ Success banner: "sarah@tennis.com has been linked as Coach."
Note: already_member is treated as success — the coach is in the academy.

**Result: PASS**

---

## Scenario 4 — Role update

Director: "head coach" but coach was previously linked as "coach"
`inviteCoachAction` returns `{ ok: true, outcome: 'role_updated', coachProfileId: '...' }`
→ `verified: true`
→ Success banner shown

**Result: PASS**

---

## Scenario 5 — Standard form (no DONNA)

Director types email manually, selects role, clicks "Invite Coach".
Standard `inviteCoachAction` call via useTransition.
DONNA state never set — no banner shown.
Behavior identical to pre-Sprint 1115.

**Result: PASS — no regression**

---

## Scenario 6 — Role normalisation

| DONNA answer | normaliseRole result |
|---|---|
| "head_coach" | head_coach |
| "Head Coach" | head_coach |
| "head" | head_coach |
| "head coach" | head_coach |
| "coach" | coach |
| "Coach" | coach |
| "regular coach" | coach |
| "assistant" | coach (fallback) |

**Result: PASS**

---

## Layer completion matrix

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 2-step registry defined; trigger phrases include "add a coach", "invite a coach" |
| Missing info | PASS | Both required fields have explicit questions and hints |
| Page navigation | PASS | Registry routes to `/director/coaches`; page exists |
| Page state sync | PASS | `onPageStatePatch` → email + role pre-fill + "Set by DONNA" badges |
| Draft creation | PASS | `buildWorkflowExecutionPlan` builds plan; banner shows both answers |
| Submit/save | PASS | `inviteCoachAction` called on confirm; `coachProfileId` returned |
| Confirmation | PASS | "Confirm & Link Coach" button; disabled when `readyToSubmit=false` |
| Verification | PASS | `buildWorkflowVerificationResult` checks ok && coachProfileId |

**Coach creation: 8/8 layers — PASS**

---

## Build classification

| Property | Value |
|---|---|
| New files | 0 (docs only new; code changes are modifications) |
| Modified files | 5 (registry, step runner, page sync, engine, runtime, InviteCoachForm) |
| DB migrations | None |
| New npm packages | None |
| TypeScript errors | 0 |
