# Attendance Draft Application Adapter Audit — Sprint 565

**Date:** 2026-05-17
**Sprint:** 565 — Attendance Draft Application Adapter Audit V1
**No writes in this sprint. Audit only.**

---

## What Exists

### Existing Infrastructure

| File | Purpose | Status |
|---|---|---|
| `src/app/coach/sessions/[sessionId]/saveWrapUpAttendanceExceptionAction.ts` | Saves attendance exception draft to `proposed_actions` | ✅ Built |
| `src/app/director/review/ApplyApprovedAttendanceExceptionControls.tsx` | UI for director to trigger apply | ✅ Built |
| `src/app/director/review/actions.ts::applyApprovedAttendanceExceptionAction` | Applies attendance exception to official records | ✅ Built (calls `execute_approved_action`) |
| `src/app/director/review/AttendanceExceptionDraftCard.tsx` | Review card for attendance exceptions | ✅ Built |
| `src/app/director/review/AttendanceExceptionDraftDecisionControls.tsx` | Approve/reject controls | ✅ Built |
| `src/lib/wrap-up/attendanceExceptionParser.ts` | Parses attendance exception text | ✅ Built |
| `src/lib/coach/wrapUpAttendanceDraftLoader.ts` | Loads attendance draft for wrap-up | ✅ Built |
| `src/components/assistant/donnaAttendanceTypes.ts` | Type definitions | ✅ Built |
| `src/components/assistant/donnaAttendanceWorkflow.ts` | Workflow logic | ✅ Built |

---

## Apply Path Analysis

### Current path:
```
Coach voice/text
  → saveWrapUpAttendanceExceptionAction (saves to proposed_actions)
  → Director review queue (AttendanceExceptionDraftCard)
  → Director approves (AttendanceExceptionDraftDecisionControls)
  → Director clicks Apply (ApplyApprovedAttendanceExceptionControls)
  → applyApprovedAttendanceExceptionAction → execute_approved_action()
  → official session_attendance rows upserted
```

### Safety evaluation:
| Step | Safe? | Notes |
|---|---|---|
| Save to proposed_actions | ✅ | Coach action, no immediate write to official records |
| Director approval required | ✅ | No auto-approve |
| Director must click Apply separately | ✅ | Approved ≠ Applied — two distinct steps |
| execute_approved_action() called | ✅ | Protected function — only path to official writes |
| Attendance rows upserted | ✅ | Only after director clicks Apply |

---

## Gaps Found

| Gap | Severity | Resolution |
|---|---|---|
| Apply status not displayed on draft card | MEDIUM | Sprint 564 `ApplyStatusBadge` can be wired in |
| No preview of which rows will be affected | LOW | Sprint 566 (attendance draft apply preview) |
| No confirmation dialog before apply | LOW | Sprint 567 (attendance draft apply confirmation UI) |
| apply status not persisted after apply | LOW | Should set `apply_status = 'applied'` on success |

---

## Required for Safe Apply (Already in Place)

- ✅ Draft saved before review
- ✅ Director approval required
- ✅ Separate apply step (not automatic on approve)
- ✅ `execute_approved_action()` is the only write path
- ✅ No parent notification triggered by attendance exception apply
- ✅ No level movement triggered

---

## Conclusion

The attendance draft → official record path is largely **already built and safe**. The missing pieces (preview, confirmation UI, apply status badge) are enhancement polish, not safety blockers. The apply action exists and is protected by the `execute_approved_action` pattern.

**No new migration needed. No code changes in this sprint.**
