# Sprint 1091 — Coach DONNA Tab Entry V1

## What was built

Added DONNA as the 4th tab in the coach `BottomTabBar`. Coaches can now navigate directly to `/coach/donna` from any page in the coach portal without needing to find and tap the floating `DonnaAssistantButton`.

## Files modified

- `src/app/coach/layout.tsx` — added `{ label: 'DONNA', href: '/coach/donna', iconKey: 'donna' }` as the 4th entry in `COACH_TABS`

## Files created

- `docs/COACH_DONNA_TAB_1091.md` — sprint doc

## Navigation

Coach `BottomTabBar` now has 4 tabs: Home · Players · Sessions · DONNA

The `donna` iconKey maps to `MessageCircle` in `ICON_MAP` (already registered).

## TypeScript

Clean.
