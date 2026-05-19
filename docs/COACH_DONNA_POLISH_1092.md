# Sprint 1092 — Coach DONNA Session Brief Polish V1

## What was built

Two targeted improvements to the coach DONNA page:

1. **ChevronRight fix** — replaced `ChevronLeft + rotate-180` (CSS hack) with `ChevronRight` on the wrap-up alert card for cleaner, semantic markup.

2. **Session Prep guidance card** — shown when `sessionSummaries.length === 0` (no sessions today or demo mode). Renders three compact prep reminders (Review players / Submit wrap-ups / Capture observations) plus a "View all sessions" lime link.

## Files modified

- `src/app/coach/donna/page.tsx` — added `ChevronRight`, `BookOpen` to imports; fixed wrap-up chevron; added session prep card block

## Files created

- `docs/COACH_DONNA_POLISH_1092.md` — sprint doc

## TypeScript

Clean.
