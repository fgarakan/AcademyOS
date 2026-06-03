# DONNA Parent Update Review Guide V1

**Sprint:** Mega Sprint 1711–1720
**Date:** 2026-06-03

---

## Workflow: Parent Update Review

**Trigger:** "Review parent updates", "Review parent communication"

**Workflow type:** `parent_update`

**Total steps:** 3

---

## Steps

| Step | Title | Route | Focus ID | Approval Required |
|---|---|---|---|---|
| 1 | Review the Draft | `/director/review` | `review-queue-primary` | No |
| 2 | Check Supporting Evidence | `/director/review` | `review-queue-primary` | No |
| 3 | Approve or Reject | `/director/review` | `review-queue-primary` | **Yes** |

---

## Step 2 Safety Note

> "DONNA will not expose internal coach notes to parents."

The check at step 2 explicitly flags: no raw observations, no internal signals, no unreviewed notes should appear in the parent-facing draft.

---

## Step 3 Safety

> "DONNA will not send parent communications without your explicit approval."

Only approved communications are delivered. Rejected drafts are archived with rejection note.

---

## Acceptance Criteria

- [x] "Review parent updates" triggers 3-step workflow
- [x] Step 2 explicitly checks for internal note exposure
- [x] Step 3 requires director approval
- [x] No automatic parent communication sent
- [x] Workflow memory stored
