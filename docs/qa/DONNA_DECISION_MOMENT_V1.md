# DONNA Decision Moment V1

**Sprint:** Mega Sprint 1721–1730
**Date:** 2026-06-03
**Scope:** Every guided workflow ends with an executive decision summary

---

## Decision Moment Definition

The "decision moment" is the final step in every guided workflow where:
1. The issue is clearly stated
2. Evidence is cited
3. Recommendation is made
4. Impact is explained
5. Director chooses: Approve / Reject / Review More Evidence

---

## Decision Step per Workflow

### Promotion Review (Step 5 of 5)

**Title:** Your Decision

**Description:** Approve or reject the promotion. This is your decision — DONNA will not act until you approve. Once approved, the record is updated.

**Route:** `/director/review`

**Focus ID:** `review-queue-primary`

**DONNA will NOT do:** "DONNA will not promote the player without your explicit approval in the Review Center."

**Approval required:** YES

---

### Placement Review (Step 4 of 4)

**Title:** Approve or Override

**Description:** Accept the recommendation or choose a different level. This decision activates the player's curriculum and starts their development path.

**DONNA will NOT do:** "DONNA will not place the player in a curriculum level without your explicit approval."

**Approval required:** YES

---

### Parent Update Review (Step 3 of 3)

**Title:** Approve or Reject

**Description:** Approve to send the update, or reject with a note explaining why. Only approved drafts are delivered.

**DONNA will NOT do:** "DONNA will not send parent communications without your explicit approval."

**Approval required:** YES

---

### Curriculum Review (Step 6 of 6)

**Title:** Approve Draft

**Description:** If you're satisfied, draft the change and approve it in the Review Center. Only approved curriculum changes are applied.

**DONNA will NOT do:** "DONNA will not publish curriculum changes without your explicit approval in the Review Center."

**Approval required:** YES

---

### Assessment Review (Step 3 of 3)

**Title:** Review Results

**Description:** Review the completed assessment scores and DONNA's readiness analysis. Confirm the scores are accurate and the evidence record is complete.

**DONNA will NOT do:** "DONNA will not submit assessment results without your review."

**Approval required:** YES

---

## DonnaDecisionGuidePanel — Decision Moment UI

When `showAllSteps: true` and `currentStep = workflow.totalSteps` (final step):

- Step progress dots show all previous steps as complete (lime checkmark)
- Current step shows approval badge (orange shield)
- `donnaWillNotDo` text shown in italic below description
- Action button: "Go to Review Center" → `/director/review`
- Progress dot for final step is lime
- Footer safety note: workflow.safetyNote

---

## Safety Invariants at Decision Moment

| Rule | Status |
|---|---|
| DONNA never auto-approves any workflow | PASS — `requiresApproval: true` on final step |
| Approval only happens in Review Center | PASS — all decision steps route to `/director/review` |
| Player level changes require director action | PASS |
| Curriculum changes require director action | PASS |
| Parent communications require director action | PASS |
| `decisionStatus: 'pending'` set on workflow start | PASS |
| Director can call `markWorkflowDecided()` after approving | PASS — available in `workflowMemory.ts` |

---

## Workflow Persistence V2 (Phase 5)

`WorkflowEntry` now stores:

| Field | Purpose | Sprint |
|---|---|---|
| `subjectId?` | Resolved entity ID (player UUID, level key) | 1721 |
| `decisionStatus?` | `'pending'` \| `'decided'` | 1721 |
| `lastUpdated?` | `Date.now()` on every write | 1721 |
| `currentStep?` | 1-based step position | 1711 |
| `totalSteps?` | Total steps in workflow | 1711 |

`updateWorkflowStep(step)` — updates step without replacing entry.

`markWorkflowDecided()` — marks decision status after director approves.

Resume message example with full data:
> "Your promotion review for Jamie Chen is in progress — you were on step 2 of 5. I'll take you back to continue."
