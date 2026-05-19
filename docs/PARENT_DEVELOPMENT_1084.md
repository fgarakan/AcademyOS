# Sprint 1084 — Parent Development Context V1

## What was built

New `/parent/development` page. Shows active mission title/description/category (director-set), why it matters (IDP parent view), condensed support guide (praise/at-home/avoid-overcoaching), after-practice conversation starter, links to progress and Ask DONNA.

## Files created

- `src/app/parent/development/page.tsx` — new page
- `docs/PARENT_DEVELOPMENT_1084.md` — sprint doc

## Safety

- Mission title and description from `player_priorities` (director-set, parent-safe fields only)
- All coach language sanitized via `sanitizeParentFacingText()` before IDP build
- `buildParentSupportGuide()` generates static template content keyed to domain/stage (no raw notes)
- IDP parent view built with `buildRoleSpecificIdpView(plan, 'parent')` — role-scoped
- Guardian → player_guardians → player chain (never URL params)
- Safety note: "Content shown here has been approved for parents by your academy director"

## TypeScript

Clean.
