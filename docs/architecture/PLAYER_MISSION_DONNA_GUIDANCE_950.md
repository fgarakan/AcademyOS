# Player Mission DONNA Guidance V1
**Date:** 2026-05-29
**Sprint:** 950
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaPlayerGuidance.ts` — mission-focused DONNA guidance for players.

8 guidance categories: current_mission, practice_today, how_to_level_up, how_am_i_doing, feel_stuck, before_match, after_loss, stay_focused.

Safety: no director assessments, no coach concerns, no rankings, mission-based framing only.
Uses `DONNA_PERSONALITY.playerSafeLanguage` for safety copy.

Existing player chip interface (`/player/ask-donna`) unchanged.
