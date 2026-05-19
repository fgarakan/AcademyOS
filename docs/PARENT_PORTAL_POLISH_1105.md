# Sprint 1105 — Parent Portal Demo Polish V1

## What was built

Enhanced the parent home empty state (shown when guardian isn't connected to a player yet). Added a "While you wait — Ask DONNA" CTA link card immediately below the "account not yet linked" card.

This gives new parents a useful action they can take right away — the Ask DONNA page works without guardian linkage and provides general parenting guidance.

## Files modified

- `src/app/parent/page.tsx` — added `Sparkles` to imports; wrapped empty state in a `<>` fragment and appended compact Ask DONNA CTA link card

## Files created

- `docs/PARENT_PORTAL_POLISH_1105.md` — sprint doc

## Design

Same compact CTA pattern used in Sprint 1104 (player portal Ask DONNA card) and Sprint 1089 (parent home Updates card). Status-blue accent, Sparkles icon, ChevronRight.

## TypeScript

Clean.
