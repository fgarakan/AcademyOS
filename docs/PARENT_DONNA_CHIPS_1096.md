# Sprint 1096 — Parent DONNA Chip Expansion V1

## What was built

Added 3 new chips to the parent Ask DONNA page (`/parent/ask-donna`). Parent DONNA now has 8 chips (was 5).

## New chips

| ID | Label | Response theme |
|---|---|---|
| `about-practices` | What happens in their practices? | Practice structure (warm-up, technical, tactical, match play); directs to Updates tab for summaries |
| `when-talk-to-coach` | When should I talk to the coach? | 3 appropriate scenarios (logistics, home factors, child struggling); avoid immediate post-session feedback requests |
| `celebrate-wins` | How do I celebrate their wins? | Proportionate and specific praise; let the player lead big celebrations; don't move goalposts immediately after success |

## Files modified

- `src/app/parent/ask-donna/page.tsx` — appended 3 chips to `buildChips()` return array; child name personalized in `about-practices` and `when-talk-to-coach` responses

## Files created

- `docs/PARENT_DONNA_CHIPS_1096.md` — sprint doc

## Safety

All responses are static templates — no external API calls, no raw coach notes, no rankings, no player comparisons. All responses use `name` variable (personalized from child first name or "your child").

## TypeScript

Clean.
