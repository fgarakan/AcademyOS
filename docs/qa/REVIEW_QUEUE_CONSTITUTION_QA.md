# Review Queue / Approvals — DONNA UI Constitution QA

**Sprint:** Mega Sprint 1124-1130
**Standard:** `docs/architecture/DONNA_UI_CONSTITUTION.md`

---

## Constitution Requirements Check

| Requirement | Status | Notes |
|---|---|---|
| 1 primary job (approve or reject pending items) | ✅ | Page title: "Approvals", subtitle: "Nothing applied until you approve" |
| 1 primary action | ✅ | `DonnaReviewBriefPanel` recommends top action |
| DONNA brief at top | ✅ | `DonnaReviewBriefPanel` (Sprint 1046) — existing implementation |
| ≤5 visible sections | ✅ | 3 tabs (Needs Approval, Player Updates, Curriculum/Session) |
| Decision-grouped items | ✅ | Tabs group by concern, not by database type |

---

## Navigation label check

| Old label | New label | Status |
|---|---|---|
| "Review Queue" (old internal name) | "Approvals" | ✅ Sprint 1060 — already updated |

---

## DonnaReviewBriefPanel assessment

The existing `DonnaReviewBriefPanel` already provides:
- Total pending count
- Count per category (needs approval, player updates, curriculum/session)
- Ready-to-apply count
- Stale items flag (oldest pending item age)
- Recommended first action (linked)

**Assessment:** ✅ Functionally constitution-compliant. Does not need replacement.

---

## Remaining gaps

| Gap | Notes |
|---|---|
| Items within tabs not urgency-sorted | Items appear in creation order, not urgency order |
| No "DONNA recommendation" on individual items | `DecisionCard` component exists but not yet wired to review items |
| "Completed" tab shows by default when no pending | Minor UX issue |
| High-risk items not visually distinguished from medium | `DecisionCard` has risk styling but current item cards don't use it |

---

## Safe to approve status

Review queue safety invariants (verified unchanged):
- ✅ No item executes without explicit director approval
- ✅ All items show actor name and creation date
- ✅ Rejected items tracked separately from pending
- ✅ Parent/player-safe content filtering in place
