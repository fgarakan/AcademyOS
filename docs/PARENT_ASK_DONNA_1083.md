# Sprint 1083 — Parent Ask DONNA V1 + Tab Update

## What was built

Full `/parent/ask-donna` page with guardrailed DONNA interface for parents. 5 suggested question chips personalized with child's focus category, current level, and sanitized coach language. Static template responses — no external AI API calls. `ParentDonnaChat` client component for interactive chips. DONNA added as 5th tab to parent BottomTabBar.

## Files modified

- `src/app/parent/ask-donna/page.tsx` — replaced stub with full page
- `src/app/parent/layout.tsx` — added DONNA as 5th tab

## Files created

- `src/components/player/ParentDonnaChat.tsx` — client component, chip interaction
- `docs/PARENT_ASK_DONNA_1083.md` — sprint doc

## Safety

- No external AI API calls
- No raw coach notes in any response
- Coach language field (`doing_well`) sanitized via `sanitizeParentFacingText()` before use
- No rankings, no comparisons, no pressure language
- Shield notice displayed prominently
- Footer: "DONNA provides parent guidance only. For coaching questions, speak directly with your child's coach."
- Guardian → player_guardians → player chain (never URL params)

## TypeScript

Clean.
