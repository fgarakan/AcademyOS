# DONNA Promotion Review Guide V1

**Sprint:** Mega Sprint 1711–1720
**Date:** 2026-06-03

---

## Workflow: Promotion Review

**Trigger:** "Review Jamie", "Review promotion", "Promotion review"

**Workflow type:** `promotion`

**Total steps:** 5

---

## Steps

| Step | Title | Route | Focus ID | Approval Required |
|---|---|---|---|---|
| 1 | Assessment Summary | `/director/players/{id}` | `player-assessments-section` | No |
| 2 | Evidence Summary | `/director/players/{id}` | `player-evidence-hub` | No |
| 3 | Level Readiness Check | `/director/players/{id}` | `player-readiness-card` | No |
| 4 | DONNA Recommendation | `/director/players/{id}` | `player-priorities-card` | No |
| 5 | Your Decision | `/director/review` | `review-queue-primary` | **Yes** |

---

## Step 5 Safety

At step 5 (the only approval step):

> "DONNA will not promote the player without your explicit approval in the Review Center."

The player is NOT moved to a new level by DONNA. The director must:
1. Navigate to the Review Center
2. Review the proposed action
3. Click Approve (or Reject)

---

## Workflow Memory

On initiation, stored as:
```ts
{
  type: 'promotion',
  label: 'Jamie',          // player name or 'this player'
  route: '/director/players/{id}',
  focusId: 'player-assessments-section',
  currentStep: 1,
  totalSteps: 5,
}
```

On resume: "Your promotion review for Jamie is in progress — you were on step 1 of 5. I'll take you back to continue."

---

## Acceptance Criteria

- [x] "Review Jamie" triggers 5-step workflow
- [x] Step 1 message references assessment section with highlight
- [x] Each step describes what to review and what DONNA will not do
- [x] Step 5 explicitly requires director approval in Review Center
- [x] Workflow memory stores step number
- [x] "Continue where we left off" resumes with step reference
- [x] No automatic player level change
