# Curriculum Director Insight View — Sprint 1095B

**Date:** 2026-06-01
**Sprint:** 1095B
**Scope:** Read-only director insight layer. No schema changes. No migrations. No permission model changes.

---

## Problem Solved

The Curriculum page was builder/edit-first. A director opening `/director/curriculum` could not answer:
- What is Red Ball trying to produce?
- What should a player look like before leaving Red 2?
- What readiness gates matter before moving to Orange Ball?

The hardcoded `SPINE_STAGES` constant ignored rich `stage_goal` data already in `curriculum_stages`.
The `CurriculumLevelTree` showed only gate/drill/cue counts — no goals, no exit profiles.

---

## What Was Built

### 1. `src/lib/curriculum/levelInsightMap.ts` (new)

Typed static insight content for all 15 curriculum levels. Pure TypeScript — no DB, no AI.

```typescript
export type LevelKey = 'red1' | 'red2' | 'red3' | 'orange1' | ... | 'hp3'

export interface LevelInsight {
  levelKey: LevelKey
  stage: string           // matches curriculum_stage enum
  levelNumber: number
  directorGoal: string
  exitPlayerProfile: string
  focusAreas: string[]
  readinessSignals: string[]
  commonBlockers: string[]
  parentSafeSummary: string
  donnaPrompt: string
}
```

- 15 fully populated entries covering Red 1-3, Orange 1-3, Green 1-3, Yellow 1-3, HP 1-3
- `getLevelInsight(stage, levelNumber)` helper for lookup by DB enum + number
- Content derived from `curriculumLevelDonnaAnswer.ts` static descriptions + audit knowledge from 1095A

### 2. `src/app/director/curriculum/_components/CurriculumStageInsightCard.tsx` (new)

Client component. Handles expand/collapse state locally.

**Stage header** (always visible):
- Colored dot + stage name + age range from DB
- Full `stage_goal` from live `curriculum_stages` query

**Level rows** (collapsed by default, expanded on click):
- Collapsed: level name + 1-line director goal + gate count badge
- Expanded:
  - Director Goal
  - Exit Player Profile
  - Focus Areas (bullet list)
  - Readiness Gates from live `curriculum_gates` data (domain, criterion, threshold) — falls back to static `readinessSignals` when DB gates unavailable
  - Common Blockers
  - Parent-Safe Summary (labeled as parent-facing, not director analysis)
  - "Open in Builder →" link to `/director/curriculum/level/[levelId]`

### 3. `src/app/director/curriculum/page.tsx` (modified)

**New query** (added after existing `getCurriculumExplorerData`):
```typescript
const { data: stagesRaw } = await stagesDb
  .from('curriculum_stages')
  .select('id,stage,display_name,stage_goal,age_range_min,age_range_max,sort_order')
  .order('sort_order', { ascending: true })
```

**Stage insight data builder**: merges live stage goals + levels from `explorerData` + insights from `CURRICULUM_LEVEL_INSIGHT_MAP` + gates per level.

**Section replacement**: "Current Spine" section (previously 5 hardcoded stage cards) is replaced with `CurriculumStageInsightCard` components when levels exist. Falls back to hardcoded cards when `explorerData.levels` is empty.

**Import changes**: Added `CurriculumStageInsightCard`, `StageInsightData`, `getLevelInsight`. Removed unused `Map, BookOpen, Wrench, Sparkles` from initial import (were already used further down — restored to avoid TS errors).

---

## Live Browser Verification (1366×768)

Confirmed via Playwright + screenshots:

| Check | Result |
|---|---|
| "CURRICULUM SPINE" section appears | ✅ |
| Red Ball stage header with live `stage_goal` | ✅ "Build the athletic and technical foundation for all future tennis development..." |
| Age range from DB: "Ages 5–10" | ✅ |
| "3 levels" count | ✅ |
| Red 1 — Foundation row visible | ✅ |
| 1-line goal preview in collapsed row | ✅ "Build the athletic foundation and first consistent ball contact..." |
| Gate count badge "4g" | ✅ |
| Click expands to show Director Goal section | ✅ |
| Builder access preserved | ✅ |

---

## What Remains Unchanged

| Feature | Status |
|---|---|
| `CurriculumLevelTree` (counts + builder links) | Unchanged ✅ |
| `/director/curriculum/level/[levelId]` builder | Unchanged ✅ |
| `CurriculumHealthPanel` coverage panel | Unchanged ✅ |
| Setup checklist | Unchanged ✅ |
| Academy version / override panel | Unchanged ✅ |
| Curriculum Tools section | Unchanged ✅ |
| Permission model (global vs academy) | Unchanged ✅ |
| Parent/player exposure | Unchanged ✅ |
| DONNA backend logic | Unchanged ✅ |

---

## What Remains Future Schema Work

| Item | Required for |
|---|---|
| `curriculum_levels.level_description` TEXT column | Level goals from DB instead of static map |
| `curriculum_levels.exit_player_profile` TEXT column | Exit profiles from DB |
| Fully seeded `skill_progressions` | Skill-by-skill readiness views |
| Real `parent_level_descriptions` content | Director "parent view" tab |
| Template connections (migration 045) | "Templates at this level" in insight panel |

---

## Acceptance Criteria Met

- [x] Director can see Red Ball's purpose from live `stage_goal` DB data
- [x] Director can see Red 1, Red 2, Red 3 insight cards
- [x] Director can expand a level to see exit profile, goals, gates, blockers
- [x] Stage goals come from `curriculum_stages.stage_goal` (not hardcoded)
- [x] All 15 levels have insight content
- [x] Readiness gates from live DB when available
- [x] Builder/detail flow remains accessible via "Open in Builder" link
- [x] No permission changes, no schema changes
- [x] TypeScript: clean (0 errors)
