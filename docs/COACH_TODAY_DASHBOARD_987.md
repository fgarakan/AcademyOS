# Coach Today Dashboard Enhancement
Sprint 987 — 2026-05-18

## Overview

Enhanced `src/app/coach/page.tsx` (the coach home at `/coach`) with two new UI sections: a "Next Session" focus card and a DONNA coach assistant card. No new routes created — the existing `/coach` page serves as the coach today dashboard.

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/page.tsx` | Added Next Session card, DONNA assistant card; added `Sparkles`, `Clock`, `PlayCircle` to lucide imports |

## Next Session Card

Inserted between the wrap-up alert and the quick stats strip.

- Shows the first non-completed, non-cancelled session of the day
- Falls back to `todaySessions[0]` if all sessions are completed or cancelled
- Displays: session name, scheduled time (HH:MM), duration, status badge
- Full-card link to `/coach/sessions/[id]`
- Lime accent on hover

## DONNA Coach Assistant Card

Inserted before the Quick Actions grid.

- Shows session count for today when sessions exist
- Shows "no sessions" guidance when nothing is scheduled
- Repeats pending wrap-up count if non-zero
- Framing: coach feels helped — DONNA describes what she can do, not what she requires
- No AI API call — static contextual copy from available page data

## Safety

- Read-only. No writes, no server actions.
- No parent sends.
- No curriculum mutation.

## Known Limitations

- Next Session card does not yet show curriculum stage or template source — those require reading from templates table, deferred to Sprint 988 (Session Plan Curriculum Context).
- DONNA prompt is context-aware but not personalized beyond session count and wrap-up count.
