# DONNA Placement Review Guide V1

**Sprint:** Mega Sprint 1711–1720
**Date:** 2026-06-03

---

## Workflow: Placement Review

**Trigger:** "Review placement", "Guide me through placement"

**Workflow type:** `placement`

**Total steps:** 4

---

## Steps

| Step | Title | Route | Focus ID | Approval Required |
|---|---|---|---|---|
| 1 | Assessment Results | `/director/players/{id}` | `player-assessments-section` | No |
| 2 | Recommended Level | `/director/players/{id}` | `player-readiness-card` | No |
| 3 | Supporting Evidence | `/director/players/{id}` | `player-evidence-hub` | No |
| 4 | Approve or Override | `/director/review` | `review-queue-primary` | **Yes** |

---

## Step 4 Safety

> "DONNA will not place the player in a curriculum level without your explicit approval."

Placement activates the player's curriculum. This is a one-way action — requires director confirmation in the Review Center.

---

## Acceptance Criteria

- [x] "Review placement" triggers 4-step workflow
- [x] Step 2 shows DONNA's recommended level (non-binding)
- [x] Step 4 requires director approval
- [x] No automatic curriculum enrollment
- [x] Workflow memory stored with step tracking
