# Sprint 1085 — Parent Home Quick Navigation Enhancement

## What was built

Added a 2x2 quick navigation grid to the parent home page. Appears below the approved data banner when the parent is linked to a player. Links to: Development Focus, Progress, Ask DONNA, Wins. Makes the new Phase 7C pages discoverable from the home tab.

## Files modified

- `src/app/parent/page.tsx` — added Link import, ChevronRight icon, quick nav grid section

## Files created

- `docs/PARENT_HOME_NAV_1085.md` — sprint doc

## Safety

- Grid only shown when `parentView` is available (parent is linked to a player)
- All link targets are safe parent portal pages
- No new data fetching; purely navigation

## TypeScript

Clean.
