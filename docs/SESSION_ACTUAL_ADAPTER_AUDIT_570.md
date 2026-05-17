# Session Actual Application Adapter Audit — Sprint 570

**Date:** 2026-05-17
**Sprint:** 570 — Session Actual Application Adapter Audit V1
**No writes in this sprint. Audit only.**

---

## What Exists

### Existing Infrastructure

| File | Purpose | Status |
|---|---|---|
| `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` | Saves session actual wrap-up draft to `proposed_actions` | ✅ Built |
| `src/app/director/review/applyWrapUpDraftAction.ts` | Applies approved wrap-up draft to session records | ✅ Built (162 lines) |
| `src/app/director/review/ApplyWrapUpDraftControls.tsx` | UI trigger for apply | ✅ Built |
| `src/app/director/review/WrapUpDraftCard.tsx` | Review card for wrap-up drafts | ✅ Built |
| `src/app/director/review/WrapUpDraftDecisionControls.tsx` | Approve/reject controls | ✅ Built |

---

## Apply Path Analysis

### Current path:
```
Coach completes wrap-up
  → saveWrapUpDraftAction → proposed_actions (status: pending_review)
  → Director review queue (WrapUpDraftCard)
  → Director approves (WrapUpDraftDecisionControls) → status: approved
  → Director clicks Apply (ApplyWrapUpDraftControls)
  → applyWrapUpDraftAction → session.session_notes updated
  → proposed_action status → applied
```

### What the apply does:
1. Validates user is `academy_director` or `head_coach`
2. Validates `proposed_action.status === 'approved'`
3. Validates `target_module === 'session_wrap_up_v1'`
4. Verifies session belongs to the academy
5. Updates `sessions.session_notes` with wrap-up content
6. Marks `proposed_action.status → 'applied'` with timestamp

### Safety evaluation:
| Step | Safe? | Notes |
|---|---|---|
| Role check (director or head_coach) | ✅ | Enforced server-side |
| Approval state check | ✅ | Hard block if not 'approved' |
| Module check | ✅ | Only applies session_wrap_up_v1 |
| Academy isolation | ✅ | Session verified against academy |
| No parent sends | ✅ | Only writes session_notes |
| No level movement | ✅ | Not in payload |
| No attendance write | ✅ | Separate action handles attendance |
| No template overwrite | ✅ | Only writes session-level notes |

---

## Gaps Found

| Gap | Severity | Resolution |
|---|---|---|
| No preview UI showing what would be written | LOW | Sprint 571 |
| No confirmation dialog before apply | LOW | Sprint 572 |
| No guardrail for applying to already-noted sessions | LOW | Sprint 573 |
| `apply_status` field in proposed_actions may not be updated | MEDIUM | Verify in Sprint 573 |

---

## Conclusion

The session actual → session record path is **substantially built and safe**. The `applyWrapUpDraftAction` is a well-guarded server action with role checks, approval checks, and academy isolation. The missing pieces are UX polish (preview, confirmation, guardrails), not safety blockers.

**No migration needed. No code changes in this sprint.**
