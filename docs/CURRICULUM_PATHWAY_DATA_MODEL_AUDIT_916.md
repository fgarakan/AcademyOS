# Curriculum Pathway Data Model Audit
Sprint 916 — 2026-05-18

---

## Purpose

Audit what exists in the database schema that connects curriculum data to player profiles and pathways. Determine what can be connected in the UI without migrations, and what requires schema additions later.

---

## Curriculum Tables (Already Exist)

All queries are through `getCurriculumExplorerData()` — these are live tables.

| Table | Key fields | Purpose |
|---|---|---|
| `curriculum_levels` | `id`, `display_name`, `stage`, `sort_order`, `advance_min_outcomes` | Master level list |
| `curriculum_gates` | `gate_id`, `from_level_id`, `domain`, `criterion`, `threshold` | Level advancement criteria |
| `curriculum_drills` | `drill_id`, `level_min_id`, `domain`, `objective`, `success_criteria` | Drills per level |
| `curriculum_coach_language` | `level_id`, `domain`, `doing_well`, `working_on`, `current_focus` | Coach talking points |
| `curriculum_competition_track` | `level_id`, `match_format`, `scoring_system`, `tournament_cadence` | Competition pathway |
| `curriculum_fitness_guidance` | `level_id`, `fitness_phase`, `primary_energy_system`, `strength_band` | Fitness per level |
| `curriculum_volume_guidance` | `level_id`, `weekly_hours_min/max`, `sessions_per_week_min/max`, `typical_stage_months_min/max` | Load guidelines |
| `curriculum_track_requirements` | `curriculum_level_id`, `requirement_domain_id` | Domain requirements per level |

---

## Player-Curriculum Connection Tables (Already Exist in Schema)

These tables exist in `database.types.ts` and connect player profiles to curriculum.

| Table | Key fields | Purpose | Queryable without migration? |
|---|---|---|---|
| `player_curriculum_states` | `player_id`, `current_level_id`, `competition_track_level_id` | Player's current curriculum level | ✓ YES |
| `player_requirement_progress` | `player_id`, `curriculum_level_id`, `requirement_id`, `status` | Per-domain progress at a level | ✓ YES |
| `players` | `current_level`, `placement_level` (string-based) | Player level string (legacy) | ✓ YES (but imprecise) |

---

## What Can Connect Without Migrations

### 1. Player Current Level → Curriculum Level Data
**How:** `player_curriculum_states.current_level_id` → `curriculum_levels.id`
**Unlocks:** Show level name, stage, goals, gates, drills for a player's current level in the Player Profile
**Sprint:** 917

### 2. Player Level → Skill Path (Drills)
**How:** Filter `curriculum_drills` where `level_min_id = player_current_level_id`
**Unlocks:** Show what drills are expected at this level in player profile
**Sprint:** 917

### 3. Player Level → Assessment Gates
**How:** Filter `curriculum_gates` where `from_level_id = player_current_level_id`
**Unlocks:** Show what gates a player needs to pass to advance
**Sprint:** 917

### 4. Player Level → Competition Track
**How:** Filter `curriculum_competition_track` where `level_id = player_current_level_id`
**Unlocks:** Show match formats, scoring, tournament cadence for player's level
**Sprint:** 918

### 5. Player Level → Fitness Guidance
**How:** Filter `curriculum_fitness_guidance` where `level_id = player_current_level_id`
**Unlocks:** Show fitness phase, energy system, load guidelines for player
**Future sprint**

### 6. Player Level → Volume Guidance
**How:** Filter `curriculum_volume_guidance` where `level_id = player_current_level_id`
**Unlocks:** Show recommended weekly hours, sessions per week, typical stage duration
**Future sprint**

### 7. Player Level → Coach Language
**How:** Filter `curriculum_coach_language` where `level_id = player_current_level_id`
**Unlocks:** Show "what we're working on" and "next step" copy per domain
**Future sprint**

---

## What Requires Schema Changes Later

| Feature | Missing schema element | Notes |
|---|---|---|
| Player Missions | No `curriculum_missions` table | Missions concept exists in UI but no table |
| Gate pass/fail history | Would need `gate_assessments` or `player_gate_records` table | Current schema has `player_requirement_progress` which is close |
| Drill completion tracking | Would need `player_drill_history` table | No drill session logging table found |
| DONNA draft persistence | Would need approved write path into `proposed_actions` | Mechanism exists but UI write is not wired |
| Guided Review persistence | No `review_sessions` table | Currently local-only |

---

## How `player_curriculum_states` Works

```sql
player_curriculum_states (
  id, player_id, academy_id,
  current_level_id  -- FK to curriculum_levels.id
  competition_track_level_id  -- FK to curriculum_competition_track.id
  ...
)
```

To get a player's current curriculum level data:
```typescript
const { data: playerState } = await supabase
  .from('player_curriculum_states')
  .select('current_level_id')
  .eq('player_id', playerId)
  .single()

// Then:
const levelDrills = allDrills.filter(d => d.level_min_id === playerState.current_level_id)
const levelGates  = allGates.filter(g => g.from_level_id === playerState.current_level_id)
const levelComp   = allCompTrack.find(ct => ct.level_id === playerState.current_level_id)
const levelFit    = allFitness.find(fg => fg.level_id === playerState.current_level_id)
```

This is entirely read-only and safe. **No migration needed.**

---

## Skill Path Connection (Sprint 917 Target)

Given a `playerId`, we can:
1. Query `player_curriculum_states` → `current_level_id`
2. Filter `curriculum_drills` by `level_min_id`
3. Show skill path: domain grouping, objectives, success criteria
4. Label as "curriculum-derived preview" since no drill completion data exists yet

---

## Competition Path Connection (Sprint 918 Target)

Given a `playerId`, we can:
1. Query `player_curriculum_states` → `current_level_id`
2. Find `curriculum_competition_track` where `level_id = current_level_id`
3. Show match format, scoring system, tournament cadence, transition signals
4. Label honestly where data is missing

---

## Recommended Sprint Order (916–920)

| Sprint | Goal |
|---|---|
| 916 | This audit ✓ |
| 917 | Skill Path Curriculum Connection (read-only) |
| 918 | Competition Path Curriculum Connection (read-only) |
| 919 | Fitness + Volume Curriculum Connection (read-only) |
| 920 | Coach Language Curriculum Connection (read-only) |
