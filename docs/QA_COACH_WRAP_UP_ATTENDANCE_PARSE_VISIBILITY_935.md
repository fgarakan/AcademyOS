# Coach Wrap-Up Attendance Parse Visibility QA
**Sprint:** 935 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Attendance exception query

| Check | Result |
|---|---|
| Queries proposed_actions (read-only) | ✅ |
| Scoped to academy_id | ✅ |
| Scoped to target_module = 'attendance_exception' | ✅ |
| Scoped to target_object_id = sessionId (direct column, no JSON filter) | ✅ |
| Scoped to proposed_by_id = user.id (coach's own submissions) | ✅ |
| Queries all relevant statuses | ✅ |
| Limit 5 | ✅ |
| Wrapped in try/catch | ✅ |
| attExcDrafts defaults to [] on failure | ✅ |
| Page renders with empty state if query fails | ✅ |

---

## 2. "Attendance exceptions" section — display

| Check | Result |
|---|---|
| Empty state shown when attExcDrafts is empty | ✅ |
| Empty state: "No attendance exceptions detected." | ✅ |
| Section always rendered (with empty or populated content) | ✅ |
| Each exception row shows summary text | ✅ |
| Summary builds from absentCount + unrosteredCount | ✅ |
| "Exception detected" fallback when both counts are 0 | ✅ |
| Status badge shows human-friendly label | ✅ (reuses obsStatusLabel) |
| Status badge color correct | ✅ (reuses obsStatusColor) |
| "Sent for director review" copy shown for non-resolved | ✅ |
| "Director reviewed this" copy shown for approved/executed | ✅ |
| Director note shown only for clarification_needed and rejected | ✅ |
| Director note NOT shown for pending/approved/executed | ✅ |

---

## 3. Payload extraction — defensive typing

| Check | Result |
|---|---|
| rostered_attendance count uses Array.isArray guard | ✅ |
| unrostered_attendees count uses Array.isArray guard | ✅ |
| Both default to 0 when field missing/wrong type | ✅ |
| No raw payload JSON shown in UI | ✅ |
| No raw proposed_action IDs shown in UI | ✅ |

---

## 4. Existing page behavior preserved

| Check | Result |
|---|---|
| Sprint 933 loop summary card unchanged | ✅ |
| Sprint 932 "Your player notes" section unchanged | ✅ |
| Existing wrap-up status banner unchanged | ✅ |
| DONNA summary sections unchanged | ✅ |
| "No submission yet" state unchanged | ✅ |
| "Back to session" link unchanged | ✅ |

---

## 5. Safety / no mutations

| Check | Result |
|---|---|
| No attendance mutation | ✅ |
| No roster change | ✅ |
| No billing trigger | ✅ |
| No parent/player communication sent | ✅ |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| Director review queue unchanged | ✅ |
| No migrations created | ✅ |
| No mutations of any kind | ✅ |

---

## 6. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 7. Sprint compatibility

| Check | Result |
|---|---|
| Sprint 934 director wrap-up chips still compile | ✅ (not touched) |
| Sprint 933 coach loop summary still compiles | ✅ (not touched) |
| Sprint 932 coach review status still compiles | ✅ (inherits helpers) |
| Sprint 931 director observation draft review still compiles | ✅ (not touched) |
| Sprint 930 Coach Signals still compiles | ✅ (not touched) |
| Sprint 929 /coach/sessions status still compiles | ✅ (not touched) |
| Sprint 927 /wrap-up page still compiles | ✅ (not touched) |
