# Sprint 1104 — Player Portal Demo Polish V1

## What was built

Replaced the always-empty "Messages" Card at the bottom of the player home page with a compact "Ask DONNA" CTA link card. This removes dead weight (messages feature not built) and gives players a clear secondary entry point to DONNA from the home page.

## Files modified

- `src/app/player/page.tsx` — removed `Card` with "Messages" empty state; added compact `Link` to `/player/ask-donna` with status-blue accent, Sparkles icon, and ChevronRight

## Files created

- `docs/PLAYER_PORTAL_POLISH_1104.md` — sprint doc

## Design

Matches the compact CTA link pattern used for the parent home "Coach Updates" card (Sprint 1089). Status-blue color distinguishes DONNA from the lime-accented mission/level content.

## TypeScript

Clean.
