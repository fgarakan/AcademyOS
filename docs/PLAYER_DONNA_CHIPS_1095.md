# Sprint 1095 — Player DONNA Chip Expansion V1

## What was built

Added 3 new chips to the player Ask DONNA page (`/player/ask-donna`). Player DONNA now has 8 chips (was 5).

## New chips

| ID | Label | Response theme |
|---|---|---|
| `before-match` | How should I prepare before a match? | Pre-match routine: rest, dynamic warm-up, single intention, play what's trained |
| `after-loss` | I had a tough loss — what now? | Reframe loss as information; 24-hour rule; identify one thing controlled + one adjustment |
| `stay-focused` | How do I stay focused during practice? | Focus as a skill; single drill intention; between-point reset |

## Files modified

- `src/app/player/ask-donna/page.tsx` — appended 3 chips to `buildChips()` return array

## Files created

- `docs/PLAYER_DONNA_CHIPS_1095.md` — sprint doc

## Safety

All responses are static templates — no external API calls, no coach notes, no rankings, no comparisons.

## TypeScript

Clean.
