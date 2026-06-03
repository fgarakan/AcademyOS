# DONNA Curriculum Review Guide V1

**Sprint:** Mega Sprint 1711–1720
**Date:** 2026-06-03

---

## Workflow: Curriculum Review

**Trigger:** "Help me review Orange Ball 2", "Walk me through curriculum review"

**Workflow type:** `curriculum_review`

**Total steps:** 6

---

## Steps

| Step | Title | Route | Focus ID | Approval Required |
|---|---|---|---|---|
| 1 | Current State | `/director/curriculum?improve={levelKey}` | `donna-curriculum-context` | No |
| 2 | Evidence Signals | `/director/curriculum?improve={levelKey}` | `donna-curriculum-context` | No |
| 3 | Identified Gap | `/director/curriculum?improve={levelKey}` | `donna-curriculum-context` | No |
| 4 | Suggested Change | `/director/curriculum?improve={levelKey}` | `donna-curriculum-context` | No |
| 5 | Impact Analysis | `/director/curriculum?improve={levelKey}` | `donna-curriculum-context` | No |
| 6 | Approve Draft | `/director/review` | `review-queue-primary` | **Yes** |

---

## Distinction from "Help me improve"

| Command | Workflow | Description |
|---|---|---|
| "Help me improve Orange Ball 2" | Curriculum improve operator (Sprint 1641) | Navigates to curriculum page with DONNA analysis panel |
| "Help me review Orange Ball 2" | 6-step curriculum review (Sprint 1711) | Guided step-by-step review workflow with memory |

Both are valid. The review workflow adds step-by-step guidance and workflow memory.

---

## Step 6 Safety

> "DONNA will not publish curriculum changes without your explicit approval in the Review Center."

Only approved curriculum drafts are applied. Nothing changes at the curriculum level without director action.

---

## Acceptance Criteria

- [x] "Help me review Orange Ball 2" triggers 6-step curriculum review workflow
- [x] Steps 1–5 all point to curriculum page with improve param
- [x] Step 6 routes to Review Center
- [x] Focus target `donna-curriculum-context` fires on steps 1–5
- [x] Workflow memory stored with step tracking
- [x] No curriculum content modified by DONNA
