# Sprint 1087 — Parent Home Mission Context Card

## What was built

Added active mission context card to parent home page. Shows child's active mission title and category as a lime-accented card linking to `/parent/development`. Only rendered when an active mission exists. Gives parents immediate visibility into what their child is currently working on without scrolling the full home page.

## Files modified

- `src/app/parent/page.tsx` — added `parentActiveMissionTitle` and `parentActiveMissionCategory` state, mission context card in JSX

## Files created

- `docs/PARENT_MISSION_CARD_1087.md` — sprint doc

## Safety

- Mission title and category from `player_priorities` (director-set, parent-safe fields)
- Renders only when `parentActiveMissionTitle` is non-null (i.e., active priority exists)
- No raw coach notes

## TypeScript

Clean.
