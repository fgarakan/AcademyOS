# DONNA Player Development Question Answering — Sprint 1014

**Date:** 2026-05-31
**Sprint:** 1014
**Status:** Complete

---

## Context

Sprint 1013 replaced the raw summary dump for academy-wide tools (`get_academy_state`, `get_player_development_summary`). Sprint 1014 applies the same pattern to the player-specific tool (`get_player_profile_summary`, Sprint 1003).

The old `interpretPlayerProfileSummary` returned:
> "Here is the director-safe player summary I can see: Current level: Orange 2. Status: active. Advancement: eligible for review. Active priorities: 2. Recent sessions (30 days): 4. Development evidence recorded: 3. This is read-only guidance. Nothing about this player changes until you take an explicit action."

Sprint 1014 replaces this with `buildPlayerProfileAnswer()` which produces a prioritized COO-quality answer.

---

## New module: `playerDevelopmentAnswering.ts`

Location: `src/lib/donna/llmOrchestration/playerDevelopmentAnswering.ts`

Pure TypeScript — no DB, no API, no mutations.

### `buildPlayerProfileAnswer(profile: PlayerProfileSummary): PlayerProfileAnswer`

Priority order for signal presentation:
1. Assessment overdue → most urgent — "An assessment is overdue"
2. Advancement eligible → action signal — "flagged as advancement-eligible"
3. Player status (if not 'active') → structural signal
4. Active priority count → development focus context
5. Recent session activity (last 30 days) → engagement context
6. Evidence count → development evidence context
7. Current level → baseline (always shown first as opening context)

Returns:
- `donnaText` — complete response with level context opening + signals + safety note
- `primaryActionLabel` — "Schedule assessment", "Review advancement eligibility", or "Assign curriculum level"
- `highlightTargetId` — `player-assessment-tab` / `player-skill-path` / `player-active-priorities`
- `suggestedRoute` — none (player profile is already open when this tool fires)

---

## Safety invariants

- Never returns player names (director already knows who they're looking at)
- Never returns coach notes or observation text
- Never returns assessment scores or behavioral flags
- `PlayerProfileSummary` contains only director-safe counts/flags — nothing private
- Safety note always: "This is a read-only summary. Nothing about this player changes until you take an explicit action."

---

## Updated: `toolResultInterpreter.ts`

`interpretPlayerProfileSummary` updated:
- Error path: clearer message
- Success path: calls `buildPlayerProfileAnswer(result.data as PlayerProfileSummary)`
- Highlight driven by answer builder's `highlightTargetId`
- `interpretAcademyState`, `interpretPlayerDevelopmentSummary` (Sprint 1013) unchanged
- `interpretSessionContext` (Sprint 1004) unchanged — addressed in Sprint 1016
