# Sprint 1075 — Player Level-Up / Next Unlock V1

## What was built

Full `/player/level-up` page. Shows current level → next level comparison with locked icon. Lists all gate requirements for advancement with passed/not-done state. Count-based progress bar. Encouragement copy varies by progress. Director confirmation note.

## Files modified

- `src/app/player/level-up/page.tsx` — replaced stub with full page

## Files created

- `docs/PLAYER_LEVEL_UP_1075.md` — sprint doc

## Safety

- Gate criterion text only (director-set) — no raw coach notes
- Gate pass status (passed/not-passed) — no percentage scores
- No automatic level movement
- Director note displayed: advancement requires coach and director confirmation
- Player identity via profile_id linkage only

## TypeScript

Clean.
