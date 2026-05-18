# Coach Player Watch List
Sprint 990 — 2026-05-18

## Overview

Created `src/components/coach/CoachPlayerWatchList.tsx` — a reusable component for displaying session players with priority, pathway, watch-for, and attention flag context. Wired into the coach session detail page above the "Today's Plan" section.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachPlayerWatchList.tsx` | Watch list component: player cards with priority, pathway tag, watch-for, last note, attention flag |

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/page.tsx` | Imports CoachPlayerWatchList; builds watchListPlayers from roster; renders "Players in This Session" section |

## WatchListPlayer Interface

```typescript
interface WatchListPlayer {
  playerId: string
  fullName: string
  currentPriority: string | null
  pathwayTag: 'Skill' | 'Competition' | 'Fitness' | 'Mindset' | null
  coachWatchFor: string | null
  lastSafeNote: string | null
  attentionFlag: 'watch' | 'concern' | null
  curriculumLevel: string | null
}
```

## Component Features

- Player initials avatar (2-char uppercase)
- Curriculum level label below name
- Attention flags: concern (red border + alert icon), watch (orange border + alert icon)
- Pathway tag chip: Skill (lime), Competition (yellow), Fitness (violet), Mindset (blue)
- Current priority text
- Watch-for box (lime label, distinct background)
- Last safe note (muted, line-clamp-2)
- Sort order: concerns first, then watches, then others

## Current Data State

In Sprint 990, the watch list is populated from `roster` data only (curriculum level from `player_curriculum_states`). Fields `currentPriority`, `pathwayTag`, `coachWatchFor`, `lastSafeNote`, and `attentionFlag` are all `null` in this sprint — they render empty gracefully. Populating these from the player profile / priorities table is deferred to a future sprint when those fields are fully connected.

## No Writes

Read-only component. No server actions. No mutations.

## Known Limitations

- Priority, pathway tag, watch-for, last note, and attention flag are all null in Sprint 990 — component renders player list without those details. Wiring real priority/observation data requires a future sprint.
- Parent-safe: `lastSafeNote` is intended for coach-internal notes only; field should only receive notes where `is_private: false` or specifically approved for coach visibility. Current sprint sets it to `null` — safe.
