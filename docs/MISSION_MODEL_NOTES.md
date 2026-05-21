# Mission Model

> Sprints 495–496 — Mission Model + Engine V1
> See also: `src/lib/player/missionModel.ts`, `src/lib/player/missionEngine.ts`

---

## Purpose

Missions are short-term, motivating player goals computed from current progress state. `player_mission_label` already exists as a column on the `players` table. This module adds the full mission definition library and eligibility engine.

---

## Mission catalogue (10 missions)

| Mission | Category | Difficulty | Weeks |
|---|---|---|---|
| Your First Win | progress | easy | 1 |
| Show Up 5 Times | attendance | easy | 2 |
| Get Noticed | skills | easy | 1 |
| Forehand Focus | skills | medium | 3 |
| Halfway Hero | progress | medium | 6 |
| Ready to Be Tested | assessment | hard | 8 |
| Mental Game Week | mental | medium | 2 |
| Perfect Week | attendance | easy | 1 |
| Assessment Booked | assessment | medium | 4 |
| Level Complete! | progress | hard | 12 |

---

## Engine

`buildMissionEngineReport(input)` returns:
- `allMissions` — progress for every mission
- `activeMissions` — not yet completed
- `completedMissions` — done missions (for celebration)
- `recommendedMissions` — top 3 to show player
- `primaryMission` — single focus mission for player home card

---

## Recommendation logic

1. In-progress missions shown first (highest % done → most encouragement)
2. `complete_first_requirement` recommended if player has never completed one
3. `complete_level_50pct` recommended when player is 40–80% complete

---

## Privacy

- `mental_focus_week` is not parent-visible (coach/player only)
- All other missions are player + parent visible
- Missions are never stored — always recomputed from player progress data

---

## Wiring targets

- Player portal home card — primary mission with progress bar
- Parent portal highlights — top active mission label
- DONNA task flow: `create_mission` — director assigns custom missions
- Badge system: mission completion can trigger badge unlock
