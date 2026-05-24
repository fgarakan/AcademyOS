# DONNA Curriculum-to-Template Coverage Gap Detector — Sprint 742C

**Date:** 2026-05-24  
**Sprint:** 742C — DONNA Curriculum Template Coverage Gap Detector V1  
**Status:** Live — pure logic over Sprint 742B context; no new DB queries

---

## What Was Built

### New file: `src/lib/donna/curriculumTemplateCoverageGapDetector.ts`

Pure TypeScript — no DB, no AI, no side effects. Operates entirely on already-loaded context.

**Exported types:**

| Type | Description |
|---|---|
| `CurriculumTemplateCoverageGap` | One gap: levelId, levelDisplayName, playerCountAtLevel, matchingTemplateCount, severity, reason, recommendedAction, href |
| `CurriculumTemplateCoverageResult` | Full result: gaps[], levelsWithPlayers, levelsWithTemplates, unassignedTemplateCount, coverageAvailable |
| `CoverageGapSeverity` | `'high' \| 'medium' \| 'low'` |

**Exported functions:**

| Function | Description |
|---|---|
| `detectCurriculumTemplateCoverageGaps(ctx)` | Main detector; returns `CurriculumTemplateCoverageResult` |
| `summarizeCoverageGaps(result)` | Produces a human-readable DONNA summary string |

### Detection logic

```
1. Group playerCurriculumStateSummaries by currentLevelId (UUID)
   → Map<levelId, { count, displayName }>

2. Build covered-level Set from templateSummaries.curriculumLevelId (UUID)
   → Set<levelId>
   Also: count templates with no curriculumLevelId → unassignedTemplateCount

3. For each level UUID with players:
   IF levelId NOT in covered-level Set → gap

4. Severity:
   high   = 3+ players at that level
   medium = 1–2 players
   low    = edge case

5. Sort: high → medium → low, then by playerCountAtLevel descending within tier
```

**Fail-safe behavior:**
- Returns empty result if `playerProgressContextAvailable = false` (player states not loaded)
- Returns empty result if `templateContextAvailable = false` (templates not loaded)
- `coverageAvailable = false` in both cases — DONNA answers honestly

### UUID matching

`player_curriculum_states.current_level_id` (UUID) is matched against `templates.curriculum_level_id` (UUID). Both reference `curriculum_levels.id`.

This is more reliable than string-key matching because:
- Template `curriculum_level_key` values are human-set strings (variable format: "orange_2", "Orange2", etc.)
- UUIDs are enforced by the FK constraint and always consistent

### Modifications to `extendedContextLoaders.ts`

Two additions to enable UUID matching and human-readable gap messages:

| Change | Why |
|---|---|
| `PlayerCurriculumStateSummary.currentLevelDisplayName: string \| null` | Level display name from `curriculum_levels(display_name)` join — enables "Orange 2 has no template" instead of "[UUID] has no template" |
| `TemplateSummary.curriculumLevelId: string \| null` | UUID from `templates.curriculum_level_id` — enables direct matching against player level UUID |

The `curriculum_levels` join in `loadPlayerCurriculumStates` uses the existing `rawDb` pattern (already in place) and the authenticated-read RLS on `curriculum_levels` (documented in `curriculumStructuralGapLoader.ts`).

### New fields in `DirectorDonnaContext`

| Field | Type | Meaning |
|---|---|---|
| `curriculumTemplateCoverageGaps` | `CurriculumTemplateCoverageGap[]` | Sorted gap objects per level |
| `curriculumTemplateCoverageGapCount` | `number` | Count of gap levels |
| `templateCoverageContextAvailable` | `boolean` | True when both player and template context are live |

### New academy risk signal

Fires when `curriculumTemplateCoverageGapCount > 0`:
- Signal: "Curriculum-template coverage gap"
- Detail: "N curriculum level(s) have active players but no class template assigned"
- Urgency: `high` (≥3 gaps) or `medium` (<3 gaps)
- Action href: `/director/templates`

### DONNA answer behavior (via `curriculumLevelDonnaAnswer.ts`)

New `TEMPLATE_COVERAGE_PATTERNS` regex catches:
- "Do any levels have no templates?"
- "Which levels have players but no templates?"
- "Where are template coverage gaps?"
- "What templates should I build next?"
- "What should I fix first in templates?"
- "What templates are missing?"
- "Template coverage gaps"

**When gaps exist:**
```
3 curriculum levels have active players but no class template:
🔴 Orange 2 — 5 players, no template assigned
🟡 Yellow 1 — 2 players, no template assigned
🟡 Red 3 — 1 player, no template assigned

Next recommended action:
Start with Orange 2 — that's the highest-priority level (5 players, no template).
Create a class template for Orange 2 so coaches have a structured plan for these players.
```

**When no gaps exist:**
```
All 4 active levels with players have at least one class template assigned.
Template coverage looks good.
```

**When context unavailable:**
```
Template coverage analysis requires player curriculum states and template data to be available.
I'm not seeing that data yet. Go to Templates to review what's built.
```

---

## What Remains Blocked

### Templates with no curriculum_level_id assigned

Templates where `curriculum_level_id = null` are "unassigned" — they are not counted as coverage for any level. The `unassignedTemplateCount` is surfaced in the result but not yet used as a separate DONNA signal. A future sprint can surface "You have N templates not assigned to any curriculum level — do you want to assign them?"

### Template-type differentiation

The detector does not yet distinguish between class templates and fitness templates. A future sprint can split: "Orange 2 has players, a fitness template, but no class template."

### Assessment-to-curriculum-state linking

Still blocked — no direct FK between `assessments` and `player_curriculum_states`. Still requires logic-layer join by `player_id`, not yet built.

### Player gate evidence gaps

Still blocked by migrations 041–044. Gate-evidence-based stall detection not possible until those are applied.

---

## Updated Godmode Readiness

| Dimension | Before 742C | After 742C | Change |
|---|---|---|---|
| Live data coverage | 7/10 | 7/10 | No change |
| Action draft completeness | 4/10 | 4/10 | No change |
| Approval routing safety | 7/10 | 7/10 | No change |
| Evidence graph | 2/10 | 2/10 | Still blocked by migrations |
| Impact preview | 5/10 | 6/10 | +1: DONNA can now preview coverage impact before template creation |
| Audit / rollback | 5/10 | 5/10 | No change |
| Role permissions | 7/10 | 7/10 | No change |
| Data quality guardian | 4/10 | 6/10 | +2: template coverage gaps now detected and surfaced |
| UI workflow integration | 5/10 | 5/10 | No change |
| Cross-domain reasoning | 5/10 | 6/10 | +1: DONNA now reasons across players + templates |
| **Overall** | **5.1/10** | **5.5/10** | **+0.4** |

---

## Recommended Next Sprint

**Sprint 742D — DONNA Assessment Coverage Gap Detector V1**

Using `assessmentSummaries` (player_id + assessed_date) and `playerCurriculumStateSummaries` (player_id + current_level_id), compute:
- Players with a curriculum state but no assessment in the last 90 days (assessment overdue)
- Players at advancement-eligible = true with no recent assessment (assessment required for level movement)

No new DB queries. Pure logic over already-loaded Sprint 742B context.

Pre-requisites: Sprint 742B + 742C. No migrations.
