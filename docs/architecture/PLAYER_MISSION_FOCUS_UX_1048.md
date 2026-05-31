# Player Mission Current Focus UX — Sprint 1048

**Sprint:** 1048 — Player Mission Current Focus UX V1
**Date:** 2026-05-31
**File changed:** `src/app/player/page.tsx`

---

## Problem

The player home page had three "Ask DONNA" entry points:
1. **Bottom tab bar** "Ask DONNA" → `/player/ask-donna`
2. **Mid-page chip block** — "Ask DONNA" header + Shield trust note + 4 specific question chips (all → `/player/ask-donna`)
3. **Bottom "Ask DONNA CTA" card** — full bordered card linking to `/player/ask-donna` ("Training guide, match prep, mission help")

The bottom CTA card was a pure duplicate of the mid-page chip block's navigation destination. The mid-page chips are more useful (they suggest specific questions to ask). The bottom tab provides always-available navigation.

## Change

Removed the "Ask DONNA CTA" card from the bottom of the player home page.

The mid-page DONNA block with 4 specific question chips remains. The bottom tab bar "Ask DONNA" link remains.

## What was preserved

- Header (eyebrow "Your Journey", H1, subtitle)
- `PlayerHomeHeroCard` (mission, level, next level)
- Path entry 2×2 grid (Skill Path, Competition, Fitness, Missions)
- `PlayerMissionPreview` (strength, mission, next win, why it matters)
- Mid-page "Ask DONNA" block with 4 chips and Shield trust note
- No-mapping state card
- Development Focus section with merged card
- All remaining sections (badges, sessions, etc.)
- Bottom tab bar "Ask DONNA" tab
