# Coach Attendance Quick Capture
Sprint 991 — 2026-05-18

## Overview

Created `src/components/coach/CoachAttendanceQuickCapture.tsx` — a reusable client component for fast attendance marking. Includes the unrostered attendee flow with safety guardrail copy. Component is self-contained and wires via an `onCapture` callback for use in the session wrap-up flow.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachAttendanceQuickCapture.tsx` | Attendance quick capture component |

## Component Features

- "Everyone Here" one-tap button marks all players present
- Per-player status buttons: Here, Absent, Late, Left Early — large tap targets
- Status is shown as colored chip on each player row when not "Here"
- Unrostered attendee section: name + reason input; adds to unrostered list
- Safety guardrail box on unrostered section: "Director review required — does not add to roster, trigger billing, or message parent"
- Success state after capture: shows count of unrostered flagged items

## Interface

```typescript
interface Props {
  players: QuickCapturePlayer[]   // { playerId, fullName }
  onCapture?: (attendance: AttendanceCapture[], unrostered: UnrosteredCapture[]) => void
}
```

`onCapture` receives:
- `attendance: AttendanceCapture[]` — `{ playerId, fullName, status }` for each rostered player
- `unrostered: UnrosteredCapture[]` — `{ name, note }` for each unrostered entry

## Integration

This component is standalone. In Sprint 991 it is not yet wired into the session page (which uses the full `CoachSessionExecutionClient` for attendance). It is available for use in:
- A future `/coach/sessions/[sessionId]/attendance` page
- The DONNA wrap-up drawer attendance step (Sprint 993+)
- The dedicated wrap-up route (Sprint 993)

## Safety

- Local state only — `onCapture` callback handles persistence
- Unrostered entries are clearly separated from rostered attendance
- Safety guardrail copy visible before adding unrostered player
- No writes in component itself — parent/page decides whether to write

## No DB Writes

Component is presentation-only. Backend write (to proposed_actions) is handled by `saveWrapUpAttendanceExceptionAction` which already exists.
