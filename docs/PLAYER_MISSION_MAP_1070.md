# Sprint 1070 — Player Mission Map V1

## What was built

Full `/player/missions` page with real priority data. Replaces Sprint 1068 stub. Server component. No raw coach notes.

## Data flow

1. Auth user → profile → academy_id
2. `players` where `profile_id = user.id` → player_id
3. `player_priorities` where `is_active = true`, ordered by `priority_rank` → mission list
4. `player_curriculum_states` + `curriculum_levels` → current level name

## Mission status derivation

| priority_rank | Status |
|---|---|
| 1 (or null) | ACTIVE |
| 2 | NEXT UP |
| 3+ | FUTURE |

## Safety properties

- Priority title and description shown — director-set content, safe for player
- No raw coach observation text in any section
- No assessment scores, benchmark comparisons, rankings
- No automatic level movement — CTA links to mission detail page only
- Footer note: "Missions are set by your coach and director"

## Files modified

- `src/app/player/missions/page.tsx` — replaced stub with full mission map

## Files created

- `docs/PLAYER_MISSION_MAP_1070.md` — sprint doc

## TypeScript

Clean.
