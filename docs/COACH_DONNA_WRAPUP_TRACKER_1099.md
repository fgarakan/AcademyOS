# Sprint 1099 — Coach DONNA Wrap-Up Coverage Tracker V1

## What was built

Wired the existing `DONNAWrapUpCoverageTracker` component into the coach DONNA page left column. The tracker renders between the "Today's Sessions" list and the "Session Prep" guidance card, but only when `sessionSummaries.length > 0`.

## Files modified

- `src/app/coach/donna/page.tsx` — imported `DONNAWrapUpCoverageTracker` and `SessionWrapUpItem`; added tracker block

## Files created

- `docs/COACH_DONNA_WRAPUP_TRACKER_1099.md` — sprint doc

## Data mapping

| SessionWrapUpItem prop | Source |
|---|---|
| `sessionId` | `s.sessionId` |
| `sessionLabel` | `s.sessionName` |
| `coachName` | `null` (coaches know they're the coach) |
| `scheduledAt` | `"Today"` |
| `status` | `s.wrapUpSubmitted ? 'complete' : 'pending'` |
| `sessionHref` | `/coach/sessions/${s.sessionId}` |

## TypeScript

Clean.
