# Coach Template Execution View
Sprint 989 — 2026-05-18

## Overview

Created a dedicated focused execution route at `/coach/sessions/[sessionId]/execute`. Mobile-first, one block at a time, large tap targets. The session detail page (`/coach/sessions/[sessionId]`) retains the full execution tracker; the new execute route is a distraction-free on-court view.

## Files Created

| File | Purpose |
|---|---|
| `src/app/coach/sessions/[sessionId]/execute/page.tsx` | Server Component — fetches session + blocks, renders ExecuteClient |
| `src/app/coach/sessions/[sessionId]/execute/ExecuteClient.tsx` | Client Component — one-block-at-a-time interactive execution view |

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/page.tsx` | Added "Open focused execute view →" link below the block progress rail |

## Execute View Features

- Block progress rail at top (tap to jump to any block)
- One block displayed at a time: type chip, duration, block name (2xl bold), watch-for notes
- Make Easier / Make Harder toggle buttons — local state only, not persisted
- Quick note textarea per block — local state only, not persisted to DB
- Previous / Next block navigation with lime "Next" CTA
- Final block shows "Wrap Up" CTA linking back to `/coach/sessions/[sessionId]` (where CoachWrapUpDrawer is)
- Session name shown in top nav with back link

## Design Principles Applied

- Block name rendered at `text-2xl` — readable on court in sunlight
- Block type chip shows color-coded type label
- Notes/watch-fors in a muted box clearly labelled "Watch For"
- No dense table layout — vertical stack only
- Minimal cognitive load — one decision at a time

## No Writes

Read-only. No server actions. Local state only (note drafts, difficulty adjustments). If coach wants to persist notes, they use the full wrap-up drawer on the session detail page.

## Known Limitations

- Quick notes and difficulty adjustments are local state only — not persisted to DB or fed into wrap-up drawer in this sprint. A future sprint can add localStorage sync with the wrap-up drawer's block status.
- Execute view does not show exercises (only block-level). The full execution tracker on the session page handles exercise-level tracking.
- No curriculum watch-fors from `CoachSessionCurriculumPanel` in this view — uses `session_blocks.notes` field only. Curriculum detail is on the session plan page.
