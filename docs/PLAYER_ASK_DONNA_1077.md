# Sprint 1077 — Player Ask DONNA V1

## What was built

Full `/player/ask-donna` page. Guardrailed DONNA chat interface with 5 suggested question chips. Responses are static template text personalized with the player's actual mission title, category, and curriculum level — no external AI API calls. Custom question input field is present but disabled (labeled "coming soon"). Helpful page links for self-serve answers.

## Files modified

- `src/app/player/ask-donna/page.tsx` — replaced stub with full page

## Files created

- `src/components/player/DonnaChat.tsx` — client component, chip interaction, disabled input
- `docs/PLAYER_ASK_DONNA_1077.md` — sprint doc

## Safety

- No external AI API calls
- No raw coach notes in any response
- No rankings, no pressure language
- Guardrails shield notice prominently displayed
- Footer note: "DONNA is a guided assistant — not a replacement for your coach."
- Chip responses use only director-set data (mission title, category, level names)
- Custom input disabled with explanatory note

## TypeScript

Clean.
