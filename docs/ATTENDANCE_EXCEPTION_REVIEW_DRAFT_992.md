# Attendance Exception Review Draft
Sprint 992 — 2026-05-18

## Overview

Created `src/components/coach/CoachAttendanceExceptionSummary.tsx` — a coach-facing summary component that shows attendance exception drafts submitted by the coach, along with their review status. Complements the existing `AttendanceExceptionDraftCard` in the director review queue.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachAttendanceExceptionSummary.tsx` | Coach-side attendance exception status view |

## Exception Draft Types

| Type | Display Label |
|---|---|
| `absent_exception` | Absent |
| `late_arrival` | Late Arrival |
| `left_early` | Left Early |
| `unrostered_attendee` | Unrostered Attendee |
| `new_player_showed_up` | New Player |

## Status Model

| Status | Color | Meaning |
|---|---|---|
| `pending_review` | Orange | Submitted, awaiting director decision |
| `approved` | Green | Director approved |
| `rejected` | Red | Director rejected; coach sees director notes |
| `applied` | Muted | Applied to session attendance |

## Safety Guardrails in UI

- Unrostered attendees in `pending_review` state show the safety notice: "Director review required before this player is added to the roster, billing, or parent communication."
- Pending count shown at top of list: "N exceptions pending director review. Nothing is applied until approved."
- Director notes (if rejected) visible to coach.

## Integration

The component is available for use in:
- A dedicated `/coach/sessions/[sessionId]/attendance` page (future sprint)
- The wrap-up review page (Sprint 999)

## No Writes

Presentation-only. No server actions in this component. Writes go through existing `saveWrapUpAttendanceExceptionAction`.
