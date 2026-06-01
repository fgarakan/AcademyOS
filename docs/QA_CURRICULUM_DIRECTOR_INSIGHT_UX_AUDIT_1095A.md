# QA — Curriculum Director Insight UX Audit

**Sprint:** 1095A
**Date:** 2026-06-01
**Type:** Audit-only — no code changes, no TypeScript run required.

---

## Audit verification checklist

### Route and component coverage

| Item | Audited | Finding |
|---|---|---|
| `/director/curriculum` main page | ✅ | Hardcoded stage descriptions; CurriculumLevelTree shows counts only |
| `/director/curriculum/level/[levelId]` | ✅ | Goes directly to builder, no read-only insight panel |
| `/director/curriculum/builder` | ✅ | Admin-style change queue, not a director insight surface |
| `/director/curriculum/academy-version` | ✅ | Override diff panel for academy customizations |
| `/director/curriculum/map` | ✅ | Visual map (not audited in depth — not the insight gap) |
| `/director/curriculum/learning` | ✅ | Director preview of player-facing learning modules |
| `CurriculumLevelTree` component | ✅ | Shows `Xg · Xd · Xcl` counts, no level goal text |
| `CurriculumHealthPanel` | ✅ | Coverage scores, not insight-oriented |
| `CurriculumBuilderWelcome` | ✅ | DONNA welcome banner |

### Data availability checks

| Data | Confirmed available | Confirmed missing/placeholder |
|---|---|---|
| `curriculum_stages` (5 rows with `stage_goal`) | ✅ | — |
| `curriculum_levels` (15 rows) | ✅ | No `level_description` or `exit_player_profile` column |
| `curriculum_gates` (57 rows, 4/level) | ✅ | — |
| `curriculum_coach_language` | ✅ (partial) | Not fully seeded |
| `skill_progressions` | — | ❌ Only 1 row in live DB |
| `parent_level_descriptions` | Schema exists | ❌ Placeholder data only |
| `progression_rules` | ⚠️ 5 rows | Not all 15 levels covered |
| `academy_curriculum_versions` | — | ❌ No rows — no academy has activated |

### Sub-level structure

| Stage | Sub-levels confirmed in DB |
|---|---|
| red_foundation | Red 1 — Foundation, Red 2 — Intermediate, Red 3 — Matchplay |
| orange_development | Orange 1 — Foundation, Orange 2 — Intermediate, Orange 3 — Matchplay |
| green_performance | Green 1 — Foundation, Green 2 — Intermediate, Green 3 — Matchplay |
| yellow_competitive | Yellow 1 — Foundation, Yellow 2 — Intermediate, Yellow 3 — Matchplay |
| high_performance | HP 1 — Foundation, HP 2 — Intermediate, HP 3 — Matchplay |

### DONNA curriculum knowledge gaps

| Capability | Current state |
|---|---|
| Explain any specific level by name | ✅ Static text in `curriculumLevelDonnaAnswer.ts` |
| Explain stage structure and goals | ✅ Static text (not using DB `stage_goal`) |
| List gates at a level | ❌ Not answered live from DB |
| Describe exit player profile | ❌ Only informal mentions in static text |
| Answer "what must the player have before exiting Red 1?" | ❌ No structured answer builder |

### Permission model checks

| Check | Finding |
|---|---|
| Director cannot edit global spine | ✅ `CurriculumEditPermissionGuard` exists |
| Academy overrides go through review queue | ✅ `academy_curriculum_overrides` + approval flow |
| Parent-facing data excluded from director view | ⚠️ `parent_level_descriptions` accessible but contains placeholder |
| No active academy version = read-only global view | ✅ Correctly shows "No curriculum version active" |

---

## UX gaps ranked by director impact

| Rank | Gap | Data available? | Fixable without schema change? |
|---|---|---|---|
| 1 | No level goal text visible in level tree | Static map + DB `stage_goal` | ✅ Yes |
| 2 | Hardcoded stage descriptions (not from DB) | DB `curriculum_stages.stage_goal` | ✅ Yes (1 query) |
| 3 | No exit player profile per level | Not in DB; DONNA static text | ✅ Yes (static map) |
| 4 | No high-level → sub-level → detail flow | Structural/UI only | ✅ Yes |
| 5 | Level detail page is builder, not insight | Structural/UI only | ✅ Yes |
| 6 | Gate criteria not shown in readable form | DB `curriculum_gates` | ✅ Yes |
| 7 | DONNA level knowledge not surfaced in UI | DONNA static + DB gates | ✅ Yes |
| 8 | No readiness threshold readable summary | DB `curriculum_levels.advance_min_*` | ✅ Yes |
| 9 | `skill_progressions` not seeded | Data gap | ❌ Schema/data work |
| 10 | `parent_level_descriptions` placeholder | Data gap | ❌ Content work |

---

## Sprint 1095B readiness assessment

### Can 1095B start immediately? ✅ Yes

All data needed for a high-quality director insight view is either:
- Already in the DB (`curriculum_stages.stage_goal`, `curriculum_gates`, `curriculum_levels`)
- Already in the codebase (`LEVEL_DESCRIPTIONS` in `curriculumLevelDonnaAnswer.ts`)

### 1095B scope (confirmed as safe)

| Action | Safe? |
|---|---|
| Query `curriculum_stages` for `stage_goal` and display in stage cards | ✅ Read-only, no lock violations |
| Create `src/lib/curriculum/levelInsightMap.ts` | ✅ New file, pure TypeScript |
| Modify `CurriculumLevelTree` to show level goals | ✅ Listed in LOCKED_MODULES as "safe to extend" |
| Add read-only insight panel to level detail | ✅ New component, no locked file changes |
| Use `getCurriculumExplorerData()` which already fetches gates/levels | ✅ Backend is locked but caller is not |

### 1095B scope (confirmed as NOT safe for this sprint)

| Action | Why not |
|---|---|
| Schema migration to add `curriculum_levels.level_description` | Not needed for 1095B |
| Modify `src/lib/backend/curriculumExplorer.ts` | Locked — only add query for `curriculum_stages` in page.tsx |
| Edit `parent_level_descriptions` content | Content work, not a sprint task |
| Connect templates to curriculum (migration 045) | Pending live DB migration, separate sprint |

---

## Key data available for 1095B (no migrations needed)

### From DB in existing query (`getCurriculumExplorerData`):
- `curriculum_levels`: display_name, stage, level_number, advance_min_domains_complete, advance_min_outcomes
- `curriculum_gates`: from_level_id, domain, criterion, threshold (all 57 gates)
- `curriculum_coach_language`: per-level coaching phrases

### New query needed (1 addition to page.tsx):
- `curriculum_stages`: display_name, stage, stage_goal, age_range_min/max, utr_range_min/max

### From existing static TypeScript (no DB):
- `LEVEL_DESCRIPTIONS` in `curriculumLevelDonnaAnswer.ts` — 12-level detailed descriptions
- `STAGE_GATES` in `stageProgressionModel.ts` — inter-stage gate descriptions
- New: `CURRICULUM_LEVEL_INSIGHT_MAP` to be created in `levelInsightMap.ts`

---

## No TypeScript run needed

Sprint 1095A made no code changes. TypeScript state is unchanged from Sprint 1094E.
