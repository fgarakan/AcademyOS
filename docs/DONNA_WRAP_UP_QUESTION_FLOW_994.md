# DONNA Wrap-Up Question Flow Enhancement
Sprint 994 — 2026-05-18

## Overview

Enhanced `WrapUpPageClient.tsx` with a running structured summary panel that builds progressively as the coach answers questions. Shows DONNA's running summary draft below the question card, with section labels and a draft disclaimer.

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | Added running structured summary panel; fixed answer counter to always render (removed conditional) |

## Running Summary Panel

Appears below the question card after the first answer is saved. Shows:
- DONNA chip + "DONNA Summary Draft" label
- Each answered question section (Session Overview, Attendance, Positive Standouts, Needs Extra Attention, Next Session Adjustments, Follow-Up Items)
- Answer text truncated to 2 lines (`line-clamp-2`)
- Draft disclaimer: "Draft only — submitted for director review. Nothing sent to parents or applied to player profiles."

## UX Impact

- Coach can see their answers accumulating in a structured format as they answer
- Builds confidence that DONNA is capturing their input
- Reminds coach of previous answers when they jump back to review
- Disclaimer visible before submitting — clear expectation setting

## No New Server Actions

Enhancement uses existing local state only. Submit still calls `saveWrapUpDraftAction`.
