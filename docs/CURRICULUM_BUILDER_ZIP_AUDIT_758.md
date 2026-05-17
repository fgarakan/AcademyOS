# Curriculum Builder Zip Audit — Sprint 758

**Sprint:** 758
**Date:** 2026-05-17

---

## What Exists (Pre-Block Inventory)

### Routes

| Route | Status | What it shows |
|---|---|---|
| `/director/curriculum` | ✅ Built | Entry page: status hero, spine overview, setup checklist, next actions, advanced tools (collapsed) |
| `/director/curriculum/builder` | ✅ Built | CurriculumSetupBuilder — guided setup flow for activating starter spine |
| `/director/curriculum/academy-version` | ✅ Built | Academy version card + override diff + rollback |
| `/director/curriculum/learning` | ✅ Built | Director preview of learning modules by level/domain |

### Components (`src/components/curriculum/`)

| Component | Status | Purpose |
|---|---|---|
| `CurriculumExplorer.tsx` | ✅ Built | Full level browser: stage tabs, level list, detail panel |
| `CurriculumLevelDetailPanel.tsx` | ✅ Built | Level detail: gates, drills, coach language |
| `CurriculumImpactPreview.tsx` | ✅ Built | Shows impact of a curriculum change |
| `CurriculumOverrideDraftShell.tsx` | ✅ Built | Shell for creating an override draft |
| `CurriculumCustomizationAssistant.tsx` | ✅ Built | 5-step guide, three-layer distinction, glossary |
| `CurriculumDemoFlowPanel.tsx` | ✅ Built | Dev/staging demo flow panel |
| `CurriculumLanguagePreview.tsx` | ✅ Built | Coach language preview for a level |
| `ReadinessRecalculationPreview.tsx` | ✅ Built | Preview of player readiness recalculation |
| `SessionCurriculumContextPanel.tsx` | ✅ Built | Session-level curriculum context brief |
| `TemplateCoachBriefImpactPreview.tsx` | ✅ Built | Template coach brief impact preview |

### Lib files (`src/lib/curriculum/`)

| File | Status | Purpose |
|---|---|---|
| `curriculumSetupTypes.ts` | ✅ Built | Types for the setup wizard state |
| `academyCurriculumResolution.ts` | ✅ Built | Resolves effective curriculum for an academy |
| `curriculumChangeScope.ts` | ✅ Built | Determines scope of a curriculum change |
| `exposureTracking.ts` | ✅ Built | Tracks player exposure to curriculum content |
| `learningModules.ts` | ✅ Built | Generates in-memory learning modules |

### Backend (`src/lib/backend/`)

| File | Status | Purpose |
|---|---|---|
| `curriculumExplorer.ts` | ✅ Built | Main data fetcher for curriculum explorer |

---

## What Is Missing (Target for Sprints 758–840)

### Entry experience

- [ ] DONNA-led welcome panel on curriculum entry (no blank workspace)
- [ ] DONNA greeting chip: "What would you like to work on today?"
- [ ] Guided chips: start new / edit level / review draft / view map

### Visual level map

- [ ] Full curriculum map showing all 15 levels as a visual grid or timeline
- [ ] Level cards showing: name, player count, gate count, drill count
- [ ] Level status: complete / partially set up / empty
- [ ] Jump-to-level from map

### Level detail (builder mode)

- [ ] Level detail page with editable sections (as drafts)
- [ ] Drill section: list + DONNA add drill chip
- [ ] Fitness section: list + DONNA add fitness exercise chip
- [ ] Assessment gate section: list + DONNA add gate chip
- [ ] Coach language section: preview + DONNA edit chip

### Guided review flow

- [ ] Guided review shell: step through each level one at a time
- [ ] Progress rail: shows which levels reviewed, which pending
- [ ] Skip and jump controls: skip this level / jump to level N
- [ ] Jump-to-level modal: tap any level badge to jump

### Change pipeline

- [ ] Change queue: list of pending curriculum changes (proposed_actions)
- [ ] Impact preview: what sessions/players/templates are affected
- [ ] Impact scope controls: filter by level, group, date range
- [ ] Director approval gate: explicit approve action

### DONNA curriculum integration

- [ ] DONNA context panel: sidebar showing "what needs attention in curriculum"
- [ ] DONNA add drill: chip → structured draft → review queue
- [ ] DONNA add fitness exercise: chip → draft → review queue
- [ ] DONNA add assessment gate: chip → draft → review queue
- [ ] DONNA curriculum conversation: multi-step guided Q&A

### Relationship map

- [ ] Curriculum relationship map: levels → drills → gates → players → sessions

### Polish and QA

- [ ] Mobile-first responsive layout for all new curriculum views
- [ ] Desktop split-pane for level detail + context panel
- [ ] Data sufficiency labels on all sections
- [ ] DONNA safety copy: what DONNA can and cannot do with curriculum
- [ ] Route QA for all new routes
- [ ] TypeScript regression after all new code

---

## Implementation Constraints

- No migrations allowed without explicit approval
- No DB writes — all changes go through proposed_actions pipeline
- All new routes use existing backend queries (no new DB queries without approval)
- `CurriculumExplorer` and `CurriculumLevelDetailPanel` can be extended but not broken
- All new UI is pure read-only display + DONNA draft creation (via proposed_actions)

---

## Verdict

**Curriculum builder zip audit: COMPLETE.**

Solid foundation exists. 10+ components built. Main gaps: visual map, guided review, DONNA curriculum integration, change queue, impact preview as builder-mode experience (not just as admin tools).
