# Coach Session Recap Intelligence Notes

> Mega Sprint 437–446 — Coach Session Recap Intelligence V1
> See also: `docs/DONNA_ACTION_RELIABILITY_NOTES.md`, `docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md`

---

## What Was Created in Phase 5

Eight new files in `src/lib/coach/`:

### `src/lib/coach/sessionQueries.ts` (Sprint 437)

Coach session data helpers:
- `fetchCoachUpcomingSessions()` — planned + in_progress sessions for coach
- `fetchCoachRecentSessions()` — completed sessions for recap review
- `fetchSessionById()` — single session with full detail
- `verifyCoachSessionAccess()` — confirms coach owns a session (academy-scoped + coach_id check)

### `src/lib/coach/attendanceQueries.ts` (Sprint 438)

Session attendance helpers:
- `fetchSessionAttendance()` — attendance records for a session
- `computeAttendanceSummary()` — pure: total/present/absent/late/excused/attendanceRate
- `fetchPlayerAttendanceHistory()` — player's attendance across recent sessions (joins sessions table)
- `hasAttendanceBeenMarked()` — count check for idempotency guard

### `src/lib/coach/recapIntelligence.ts` (Sprint 439)

Pure logic recap quality assessment:
- `assessRecapQuality()` — 4-dimension quality report: transcript_length, block_completion, attendance, observation_count
- `extractObservationFocusAreas()` — block names for observation prompt context
- `getSuggestedRecapPrompts()` — 5 coaching questions + attendance context
- Minimum transcript length of 20 chars required for structuring

### `src/lib/coach/voiceNoteQueries.ts` (Sprint 440)

Voice note data helpers:
- `fetchVoiceNoteById()`, `fetchSessionVoiceNotes()`, `fetchPendingStructuringNotes()`
- `isVoiceNoteStructured()`, `hasUsableTranscript()` — status and quality guards
- Typed VoiceNoteRecord with camelCase field names

### `src/lib/coach/sessionBlockQueries.ts` (Sprint 441)

Session block data helpers:
- `fetchSessionBlocks()` — ordered by order_index
- `computePlannedDuration()`, `findIncompleteBlocks()`
- `computeBlockExecutionSummary()` — completed/skipped/incomplete counts + completion rate

### `src/lib/coach/wrapUpValidator.ts` (Sprint 442)

Wrap-up submission validator:
- `validateWrapUpInput()` — required fields check + quality scoring (0-100 points)
- Scoring: transcript/voice 40pts, attendance 20pts, observations 30pts, rating 10pts
- `wrapUpQualityMessage()` — user-facing quality message based on score

### `src/lib/coach/observationTracker.ts` (Sprint 443)

Player observation tracking utilities:
- `validateObservation()`, `filterValidObservations()` — input validation
- `hasObservationForPlayer()`, `findUnobservedPlayers()` — coverage checks
- `inferSentimentHint()` — keyword-based sentiment: positive/neutral/concern (no AI call)

### `src/lib/coach/coachContext.ts` (Sprints 444–445)

Coach OS context assembler:
- `buildCoachOsContext()` — full coach OS state
- `buildCoachSessionContext()` — session-specific context for wrap-up flow
- `isSessionReadyForWrapUp()`, `getCoachSessionStatusMessage()` — status helpers

### `src/lib/coach/sessionSummary.ts` (Sprint 446)

Session summary payload builder:
- `buildSessionSummaryPayload()` — assembles typed payload for proposed_action.proposed_payload
- `buildWrapUpActionLabel()` — generates action_label string
- `getWrapUpStatus()` — maps proposed_action status to WrapUpStatus enum
- Transcript truncated to 500 chars for the summary payload (full transcript in voice_notes)

---

## Wiring Required

These helpers are defined but not yet wired into server actions:

| Helper | Target |
|---|---|
| `fetchCoachUpcomingSessions()` | `src/app/coach/sessions/page.tsx` |
| `verifyCoachSessionAccess()` | `src/app/coach/sessions/[sessionId]/actions.ts` |
| `assessRecapQuality()` | `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` |
| `validateWrapUpInput()` | `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` |
| `buildSessionSummaryPayload()` | `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` |
| `buildWrapUpActionLabel()` | `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` |
| `fetchSessionVoiceNotes()` | `src/app/coach/sessions/[sessionId]/page.tsx` |
| `fetchSessionBlocks()` | `src/app/coach/sessions/[sessionId]/page.tsx` |

Wiring deferred to Phase 6 where each session page is targeted.

---

## Trust Stack Alignment

- `validateWrapUpInput()` is Layer 1 (AI Proposes) input gate
- `verifyCoachSessionAccess()` is Layer 5 (Permissions Constrain) defense-in-depth
- `assessRecapQuality()` ensures AI structuring only runs on meaningful data
- `inferSentimentHint()` is server-side only — never sends raw text to external AI
