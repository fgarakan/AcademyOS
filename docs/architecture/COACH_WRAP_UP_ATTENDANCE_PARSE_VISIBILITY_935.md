# Coach Wrap-Up Attendance Parse Visibility — Architecture

**Sprint:** 935 | **Date:** 2026-05-29

---

## Summary

Sprint 935 surfaces attendance exception review status to the coach on the wrap-up review page. When `saveWrapUpDraftAction` (or the drawer's `saveWrapUpAttendanceExceptionAction`) detected and routed an attendance exception for director review, the coach now sees a human-friendly status in the "Attendance exceptions" section instead of a black box.

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Added attendance exception query + "Attendance exceptions" section between "Your player notes" and "Back to session" |

---

## Data query

```ts
proposed_actions
  WHERE academy_id = academyId           // RLS boundary
    AND target_module = 'attendance_exception'
    AND target_object_id = sessionId     // direct column — no JSON filter needed
    AND proposed_by_id = user.id         // coach sees only their own submissions
    AND status IN [all review statuses]
  ORDER BY created_at DESC
  LIMIT 5
```

**Key difference from observation drafts (Sprint 932):** `target_object_id = sessionId` is a direct column query on attendance exceptions (not a JSON payload filter), because the attendance exception `proposed_actions` row sets `target_object_id = sessionId` at creation time. This is simpler and more reliable.

**Covers both creation paths:**
- `saveWrapUpDraftAction` → parses Q1/Q2 attendance free text → auto-creates `attendance_exception` if exceptions detected (`source: 'wrap_up_q2_parse'`)
- `saveWrapUpAttendanceExceptionAction` → drawer "Unexpected attendees" UI → also creates `attendance_exception` for the same session

Both use `target_object_id = sessionId` and `proposed_by_id = user.id`, so both are shown.

---

## Displayed fields

| Field | Source | Notes |
|---|---|---|
| Absent player count | `proposed_payload.rostered_attendance.length` | Defensive: `Array.isArray` check + `?? 0` |
| Unexpected attendee count | `proposed_payload.unrostered_attendees.length` | Defensive: `Array.isArray` check + `?? 0` |
| Status badge | `proposed_actions.status` | Mapped to human label (reuses Sprint 932 helpers) |
| Director note | `proposed_actions.reviewer_notes` | Only shown for clarification_needed/rejected |

---

## Status label mapping

Reuses `obsStatusLabel()` and `obsStatusColor()` from Sprint 932 (already in the page):

| DB status | Displayed label | Color |
|---|---|---|
| `pending_review` | "Pending review" | Blue |
| `approved` | "Approved" | Green |
| `executed` | "Applied" | Green |
| `rejected` | "Needs revision" | Red |
| `clarification_needed` | "Director has questions" | Orange |

---

## Summary text examples

| absentCount | unrosteredCount | Summary shown |
|---|---|---|
| 1 | 0 | "1 absent player" |
| 2 | 0 | "2 absent players" |
| 0 | 1 | "1 unexpected attendee" |
| 1 | 1 | "1 absent player · 1 unexpected attendee" |
| 0 | 0 | "Exception detected" (fallback) |

---

## Page layout after Sprint 935

1. Top nav
2. Page header
3. Sprint 933 — Loop summary card
4. "No submission yet" card (if !action)
5. Submission review (if action)
6. Sprint 932 — "Your player notes"
7. **Sprint 935 — Attendance exceptions** ← new
8. Back to session link

---

## Safety invariants

| Invariant | Status |
|---|---|
| No attendance mutation | ✅ — read-only |
| No roster change | ✅ |
| No billing trigger | ✅ |
| No parent/player communication | ✅ |
| No player level movement | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| Director review queue unchanged | ✅ |
| Sprints 931–934 unchanged | ✅ |
| academy_id scoping | ✅ |
| proposed_by_id scoping (coach sees own drafts only) | ✅ |
| Raw IDs not shown in UI | ✅ |
| Raw payload not shown in UI | ✅ |
| Best-effort query (try/catch) | ✅ — page renders with empty state if query fails |
