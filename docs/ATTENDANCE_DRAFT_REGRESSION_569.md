# Attendance Draft Apply Regression — Sprint 569

**Date:** 2026-05-17
**Sprint:** 569 — Attendance Draft Apply Regression V1
**Scope:** Sprints 565–568 (attendance adapter audit, preview, confirmation, guardrails)

---

## TypeScript Check

```
npx tsc --noEmit → CLEAN
```

---

## Safety Scan

| File | DB Writes | External Sends | Execution | Result |
|---|---|---|---|---|
| `src/lib/donna/attendanceApplyGuardrails.ts` | None | None | None | ✅ Safe |
| `src/components/donna/AttendanceApplyPreview.tsx` | None | None | None | ✅ Safe |
| `src/components/donna/AttendanceApplyConfirmation.tsx` | None | None | None | ✅ Safe |

Matches found were display copy strings only — not code execution.

---

## Logic Regression

| Check | Result |
|---|---|
| Guardrail blocks unapproved drafts | ✅ `NOT_APPROVED` blocker if `draftStatus !== 'approved'` |
| Guardrail blocks empty drafts | ✅ `EMPTY_DRAFT` blocker if zero players |
| High absence rate triggers warning | ✅ `HIGH_ABSENCE_RATE` if >50% absent |
| Unknown status generates warning | ✅ `UNKNOWN_STATUS` blocker per unknown player |
| Unrostered generates follow-up note | ✅ `UNROSTERED_ATTENDEES` warning |
| Extra confirmation required for high-severity | ✅ `requiresExtraConfirmation` set |
| Preview shows "no changes yet" disclaimer | ✅ Present in footer of `AttendanceApplyPreview` |
| Confirmation shows "cannot be automatically undone" | ✅ Present in `AttendanceApplyConfirmation` |
| Apply button does NOT write directly | ✅ Confirmation delegates to existing apply controls |
| Existing apply path unchanged | ✅ `ApplyApprovedAttendanceExceptionControls` not modified |

---

## Operating Model Verification

| Rule | Status |
|---|---|
| Director approval required before apply | ✅ Guardrail hard-blocks non-approved drafts |
| No auto-apply on approval | ✅ Two separate steps: approve → then confirm → then apply |
| Preview does not write | ✅ Read-only display |
| Confirmation does not write — delegates | ✅ `onConfirm` callback to caller |
| No parent sends triggered | ✅ Confirmed |
| No level movement triggered | ✅ Confirmed |
| No roster changes | ✅ Unrostered creates follow-up, does not auto-roster |

---

## Result

**Regression PASSED.** All attendance draft apply surfaces (audit, preview, confirmation, guardrails) are safe. No official writes from any Sprint 565–568 file. TypeScript clean.
