# DONNA Coach / Session Question Answering — Sprint 1016

**Date:** 2026-05-31
**Sprint:** 1016
**Status:** Complete

---

## Context

Sprint 1016 completes the interpreter upgrade series (1013–1016) by replacing the last raw-summary interpreter: `interpretSessionContext` (Sprint 1004). The old version returned raw `result.summary` plus a hardcoded review note. The new version uses `buildSessionContextAnswer()` from `coachSessionAnswering.ts`.

---

## New module: `coachSessionAnswering.ts`

`buildSessionContextAnswer(session: SessionContextSummary): SessionContextAnswer`

Priority order:
1. `needsDirectorReview` → "A coach wrap-up is waiting for your review" + route to Review Queue
2. Attendance (if recorded) → "X of Y present, Z absent"
3. Wrap-up status (if not director review pending)
4. Coach name, group name (context)
5. Template name, block count (structural)
6. Scheduled date/time/duration (scheduling context)

Safety:
- No coach notes or observation text
- No individual player names (attendance counts only)
- Wrap-up pending → routes to Review Queue only (approval-gated path)
- "Nothing changes until you take an explicit action" always present

---

## Interpreter change

Old `interpretSessionContext` (Sprint 1004):
```
"Here is the session context I can safely see: ${result.summary}${reviewNote} ..."
```

New `interpretSessionContext` (Sprint 1016):
- Calls `buildSessionContextAnswer(result.data as SessionContextSummary)`
- Highlight and navigation driven by answer builder return
- Error path updated with clearer message

---

## Safety invariants

- No raw coach notes
- No individual player names (only counts)
- No wrap-up draft content
- `requiresConfirmation: false` (read-only)
- Wrap-up pending director review → route to Review Queue, not auto-approved
