# Coach Wrap-Up Review Submit
Sprint 999 — 2026-05-18

## Overview

Created `/coach/sessions/[sessionId]/wrap-up/review/page.tsx` — a consolidated draft review screen that shows the submitted wrap-up draft and its director review status. Updated `WrapUpPageClient.tsx` success state to offer "Review Submitted Draft" link.

## Files Created

| File | Purpose |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Server Component review screen: fetches most recent wrap-up proposed_action, renders structured content + status |

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | Success state now offers "Review Submitted Draft" + "Back to Session" links (was single back link) |

## Review Page Features

- Fetches the most recent `proposed_actions` row where `target_module = 'session_wrap_up_v1'` and `target_object_id = sessionId`
- Status banner: pending_review (orange), approved (green), applied/rejected (muted/red)
- DONNA Summary Draft section: renders all 6 question answers from `proposed_payload` fields
- Block completion list (self-reported status dots: green/muted/orange)
- Next focus box (lime/Target icon)
- Attendance note box (Users icon)
- Safety notice: "No session records, player profiles, or parent communications have been modified."
- Submitted timestamp footer
- "No wrap-up submitted yet" empty state with link to start wrap-up
- "Back to Session" link at bottom

## Payload Field Mapping

| Question key | proposed_payload field |
|---|---|
| overall | group_note |
| attendance | raw_attendance_answer |
| standouts | raw_standouts_answer |
| attention | raw_attention_answer |
| adjust | changes_note |
| followup | next_focus |

## Safety Guardrails

- Read-only — no server actions, no writes
- Safety notice on every view
- Status makes clear pending_review means director has not yet acted
- rawDb cast used only for read (same pattern as other coach pages)
