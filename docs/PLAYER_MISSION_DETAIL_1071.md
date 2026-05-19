# Sprint 1071 — Player Mission Detail V1

## What was built

Full `/player/missions/[priorityId]` page. Server component. Player authenticated via profile_id — never URL param trust. Priority ownership verified (player_id + academy_id check before displaying).

## Data flow

1. Auth user → profile → academy_id
2. `players` where `profile_id = user.id` → player_id
3. `player_priorities` where `id = priorityId AND player_id = player_id AND is_active = true` → priority

## Content sections

- Mission Hero (title, description, category badge, "See practice" CTA)
- Mission Goal (priority description repeated for context)
- Why It Matters (director-approved category-generic copy)
- What To Do (category-keyed action steps — 3 items)
- Coach Watch-For (generic coach observation note)
- How To Know You Improved (category-keyed success criteria — 3 items)
- Evidence Needed (3 rows: coach observation, consistent effort, coach confirmation)
- Practice + Ask DONNA CTAs

## Safety properties

- Priority ownership verified before any display
- No raw coach observation text shown
- "Evidence Needed" section explains that coach records evidence — not the player
- No automatic level movement
- What To Do steps are category-keyed, director-safe template copy — not AI-generated

## Files modified

- `src/app/player/missions/[priorityId]/page.tsx` — replaced stub with full detail page

## Files created

- `docs/PLAYER_MISSION_DETAIL_1071.md` — sprint doc

## TypeScript

Clean.
