# UI Wiring Foundation Notes

**Sprint:** 553 — UI Wiring Foundation V1
**Date:** 2026-05-21
**Author:** Sprint 553 session

---

## Purpose

This document records the audit performed before wiring the Mega Sprint 503–552 library layer
to UI route pages. It captures what was found, what was wired, what was blocked, and what to build next.

---

## Pre-flight result

- **TypeScript:** CLEAN before any changes
- **Git:** Unrelated untracked files present (CSVs, docs, old migrations) — not staged

---

## Route audit (actual state as of 2026-05-21)

> Note: `docs/KNOWN_LIMITATIONS.md` contains stale entries. The routes below were audited directly.

| Route | Actual State | Notes |
|---|---|---|
| `/director` | Fully built | DONNA Executive Card, KPI grid, priority queue, pending placement, alerts, AI suggestions, curriculum coverage mini-section, sessions, quick actions, health chart, live activity |
| `/director/curriculum` | Built | CurriculumExplorer, version card, voice override, connections diagram, builder welcome, demo flow. **No coverage/health summary — this sprint adds it.** |
| `/director/curriculum/builder` | Built | CurriculumSetupBuilder with CurriculumBuilderChangeQueue. Focused on setup workflow. |
| `/coach` | Fully built | Real sessions, players, observations, DONNA link, wrap-up alerts, quick actions |
| `/player` | Fully built | Real IDP, mission preview, attendance sparkline, level progress ring, Q&A |
| `/parent` | Fully built | Parent-safe IDP view, support guide, attendance, lesson request status |

---

## Mega Sprint 503–552 module assessment

All modules are **pure TypeScript domain builders** — they accept structured input data and return
view models. None have direct database access. Wiring them to UI requires building input data
from existing or new backend query functions.

### Modules wired in Sprint 553

| Module | Route | What was wired |
|---|---|---|
| `src/lib/curriculum/coverageModel.ts` — `buildCurriculumCoverageReport` | `/director/curriculum` | Per-level coverage score (gates + drills + coach language). Overall grade A–F. Top critical gaps. Summary counts. |

### Modules not yet wired — and why

| Module | Blocker | Recommended path |
|---|---|---|
| `commandCenter.ts` | Needs `playerCount` per curriculum level — no backend query returns this | Add `getPlayerCountByCurriculumLevel(db, academyId)` to a backend file |
| `curriculumHealthDashboard.ts` | Needs full coverage + gap + levelHealth + templateConnection reports. Gap and level health require playerCount and domain-coverage-per-level data | Wire after commandCenter blocker is resolved |
| `gapAnalysis.ts` | Needs `playerCountByLevel`, `domainCoverageByLevel` — no query for these | Build curriculum gap query in backend |
| `attentionQueue/index.ts` | `/director` already covers this with direct queries. No net new value without a more complex refactor | Revisit when `/director` needs restructuring |
| `kpiDashboard.ts` | `/director` already covers KPI display with direct queries | Same as above |
| `coachPortalAssembly.ts` | Needs `CoachOsContext` which requires active session with attendance/block/voice data. `/coach` already serves equivalent data. | Wire when coach home needs a richer view model |
| `playerPortalExperience.ts` | `/player` already serves equivalent data via `buildIndividualDevelopmentPlan`. Rewiring adds complexity without visible new value. | Wire when player portal expands to multi-tab or gamification |
| `parentPortalSummary.ts` | Same as player — `/parent` already serves equivalent data | Wire when parent portal expands |
| `badgeEligibilityEngine.ts` | No page queries badge eligibility yet. Needs a new backend query returning badge-relevant player signals per player. | Sprint 555+ — add badge column to player profile Skill Path tab |
| `missionEngine.ts` | `/player` already has `PlayerMissionPreview`. Mission engine extends this but adds no visible new value without refactor | Sprint 555+ — extend player portal gamification |
| All knowledge modules (`src/lib/knowledge/`) | Knowledge library is a pure-TS concept layer. Knowledge items are not yet stored in the database. No DB query can return them. | Sprint 556+ — design and migrate a `knowledge_items` table, seed with pilot content, then wire the library UI |
| `curriculumKnowledgeView.ts` | Blocked by both the knowledge module blocker and the coverage health blocker above | Wire after both are resolved |

---

## What was built in Sprint 553

### `src/app/director/curriculum/_components/CurriculumHealthPanel.tsx`

- Pure display component (Server Component-compatible — receives `CurriculumCoverageReport` as props)
- Renders: overall grade (A–F), partial-score disclaimer, per-level progress bar with grade + gaps,
  top critical gaps summary with fix hints, link to curriculum builder, summary counts grid
- **Partial score disclaimer is prominent** — clearly states that only gates, drills, and coach
  language are counted; assessment criteria, missions, parent guidance, and badges are not yet included
- Safe: read-only display only, no writes, no DONNA mutations, no parent/player data exposure

### `src/app/director/curriculum/page.tsx` (modified)

- Imports `buildCurriculumCoverageReport`, `LevelCoverageInput` from `coverageModel.ts`
- Imports `CurriculumStage` from `visualMapModel.ts`
- Builds `LevelCoverageInput[]` from existing `getCurriculumExplorerData()` output
- Maps DB `curriculum_stage` enum (snake_case) to `CurriculumStage` union (title-case)
- Calls `buildCurriculumCoverageReport(levelCoverageInputs)` — pure TS, no new DB calls
- Renders `<CurriculumHealthPanel report={coverageReport} />` after the setup checklist

---

## Parent/player visibility safety review

- `CurriculumHealthPanel` contains no parent or player-facing data
- No content from the panel is exposed to `/parent` or `/player` routes
- No coach notes, internal signals, or sensitive player data are referenced
- Panel is director-only (under `/director/curriculum`)

---

## DONNA / direct mutation safety review

- `CurriculumHealthPanel` is 100% read-only
- No DONNA write paths, no `proposed_actions` writes, no curriculum mutations
- The "Open Curriculum Builder" link navigates to the builder — no action is taken automatically

---

## Responsive behaviour notes

- Panel uses `Card` + `CardHeader` + `CardContent` — consistent with design system
- Per-level rows use `flex items-center justify-between` — wraps cleanly on mobile
- Summary counts grid uses `grid-cols-4` — compact enough for mobile widths
- Disclaimer block uses max-w-md on the header subtitle — constrains text width on desktop

---

## Known limitations of the Sprint 553 coverage score

1. `skillCount`, `assessmentCriteriaCount`, `evidenceRequirementCount`, `missionCount`,
   `badgeCount`, `parentGuidanceCount`, `learningModuleCount` are all hardcoded to `0`
   because no backend query returns this data yet.
2. The coverage score reflects the **global curriculum** (from `getCurriculumExplorerData`),
   not academy-specific overrides.
3. `gateCount` counts gates where `from_level_id = level.id`. Gates with `to_level_id` only
   (no `from_level_id` match) are not counted.
4. `drillCount` uses `level_min_id` match only. Drills with a wider range (e.g., spanning
   multiple levels) are counted only for the minimum level.

---

## Recommended next sprints

### Sprint 554 — Curriculum Coverage Full Wiring V1

Goal: Extend the coverage score to include assessment criteria, missions, and parent guidance.
Requires: A new backend query or extending `getCurriculumExplorerData` to return
`curriculum_content_items` counts per level filtered by `content_type`.

Key files to touch:
- `src/lib/backend/curriculumExplorer.ts` — add content item counts per level
- `src/app/director/curriculum/page.tsx` — pass real counts into `LevelCoverageInput`
- `src/app/director/curriculum/_components/CurriculumHealthPanel.tsx` — no change needed

### Sprint 555 — Curriculum Command Center + Gap Analysis V1

Goal: Wire `commandCenter.ts` and `gapAnalysis.ts` using a new player-count-per-level query.
Requires: A new backend query `getPlayerCountByCurriculumLevel(db, academyId)`.

### Sprint 556 — Knowledge Library DB Foundation

Goal: Design and migrate a `knowledge_items` table. Seed with pilot content.
Wire `knowledgeLibrary.ts` and `knowledgeReviewQueue.ts` to real data.
Requires: A new migration (migration allowed sprint).

### Sprint 557 — Curriculum Health Dashboard V1

Goal: Wire the full `curriculumHealthDashboard.ts` once gap analysis and level health are available.
Requires: Sprints 554 + 555 complete.
