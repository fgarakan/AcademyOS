# Curriculum Health Score V2 — Notes

**Sprint:** 555 — Curriculum Health Score V2
**Date:** 2026-05-21

---

## What changed from V1

### V1 (Sprint 553)
- Score computed from gates, drills, and coach language only
- A–F grade per level + overall
- Disclaimer: "partial snapshot" shown prominently

### V2 (Sprint 555)
- Score computation unchanged (gates + drills + coach language)
- Added "gates · drills · language" sub-label under the overall grade
- Added `DimensionSummary` prop to `CurriculumHealthPanel`
- Added `CurriculumDimensionBreakdown` section showing:
  - **Tracked (green tiles):** Exit Gates, Drills, Coach Language, Competition Track, Fitness Guidance, Volume Guidance
  - **Not tracked yet (gray tiles):** Skills, Assessment Criteria, Missions, Badges, Parent Guidance, Learning Modules
- Dimension counts come from `CurriculumExplorerData` — no new DB queries

---

## Score composition (unchanged)

The score per level is computed in `src/lib/curriculum/coverageModel.ts` as:

| Dimension | Weight | Source |
|---|---|---|
| Exit Gates | ~33% | `gateCount > 0` → partial, `gateCount >= 3` → full |
| Drills | ~33% | `drillCount > 0` → partial, `drillCount >= 5` → full |
| Coach Language | ~33% | `coachCueCount > 0` → partial, `coachCueCount >= 3` → full |
| Skills, Missions, Badges, etc. | 0% | Hardcoded to 0 — not in DB yet |

A level with gates, drills, and coach language but no skills/missions/badges still gets a high score.
This is expected and clearly communicated in the partial-score disclaimer.

---

## Tracked in V2 but not counted in score

The following are now shown as "tracked" in `CurriculumDimensionBreakdown` because they
exist in the database and can be counted per level. However, they are NOT included in the
A–F score because `coverageModel.ts` does not yet weight them:

- **Competition Track** — `curriculum_competition_track` table, one row per level
- **Fitness Guidance** — `curriculum_fitness_guidance` table, one row per level
- **Volume Guidance** — `curriculum_volume_guidance` table, one row per level

These dimensions should be added to `coverageModel.ts` in a future sprint to reflect
a more complete curriculum health picture.

---

## Planned V3 additions

Sprint 554+ plan:
1. Add `assessmentCriteriaCount` from a query on `curriculum_content_items` filtered by `content_type = 'assessment'`
2. Add `missionCount` from `curriculum_content_items` filtered by `content_type = 'mission'`
3. Add `badgeCount` from `curriculum_content_items` filtered by `content_type = 'badge'`
4. Add `parentGuidanceCount` from `curriculum_content_items` filtered by `content_type = 'parent_guidance'`
5. Once counts are real, update `coverageModel.ts` weights to distribute evenly across all dimensions

---

## Files touched

| File | Change |
|---|---|
| `src/app/director/curriculum/_components/CurriculumHealthPanel.tsx` | Added `DimensionSummary` prop, `CurriculumDimensionBreakdown` section, V2 score sub-label |
| `src/app/director/curriculum/_components/CurriculumDimensionBreakdown.tsx` | New — dimension tiles grid |
| `src/app/director/curriculum/page.tsx` | Computes `dimensionSummary` from `explorerData`, passes to panel |
