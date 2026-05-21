# Curriculum Experience Audit
**Sprint 503 — Mega Sprint 503-552 Phase 1**
**Date: 2026-05-21**

---

## Existing routes

| Route | Purpose | Status |
|---|---|---|
| `/director/curriculum` | Main curriculum hub — status, spine overview, setup checklist | Exists — working |
| `/director/curriculum/builder` | Curriculum builder shell | Exists |
| `/director/curriculum/level/[levelId]` | Level detail view | Exists |
| `/director/curriculum/map` | Visual curriculum map | Exists |
| `/director/curriculum/learning` | Learning modules browser | Exists |
| `/director/curriculum/academy-version` | Academy curriculum version card | Exists |
| `/director/curriculum/guided` | Guided curriculum experience | Exists |

---

## Existing lib modules

| Module | Purpose |
|---|---|
| `curriculumSetupTypes.ts` | Setup state, spine constants, source options, domain list |
| `curriculumChangeScope.ts` | Change scope classification for curriculum mutations |
| `curriculumDraftHelpers.ts` | Curriculum change proposal builder (director approval required) |
| `academyCurriculumResolution.ts` | Academy curriculum version resolution |
| `approvalCopy.ts` | Copy for approval flow |
| `exposureTracking.ts` | Curriculum exposure tracking |
| `impactEstimateHelper.ts` | Impact estimation for curriculum changes |
| `inbox/index.ts` | Voice-to-curriculum idea queue (similarity detection) |
| `learningModules.ts` | Learning module previews (player/parent-facing) |
| `mentalPerformance.ts` | Mental competency definitions across 5 stages |

---

## Gaps identified

### Visual experience gaps
- No typed model for visual map nodes — the map route lacks a shared view model type
- No expandable tree model — builder has no typed node expansion state
- No typed drawer model for node detail panels
- No content-type registry for "Add content to level" actions

### Attachment model gaps
- No typed drill attachment model (drills exist in DB but no lib layer model)
- No typed skill/sub-skill hierarchy model
- No mission attachment model linking missions → curriculum levels
- No badge attachment model linking badges → curriculum levels
- No parent guidance attachment model
- No coach cue library model

### Assessment and evidence gaps
- No assessment criteria model for level advancement gates
- No evidence requirements model (what counts as evidence per gate)

### DONNA integration gaps
- DONNA has no curriculum-specific context awareness beyond the voice classifier
- No typed model for DONNA draft attachment to node context

### Command center gap
- No typed command center view model (aggregates all curriculum layer data for the director view)

---

## Source options — current state

`CURRICULUM_SOURCE_OPTIONS` in `curriculumSetupTypes.ts` defines 5 options:
1. `academy_os_starter` — Use Academy OS starter curriculum as-is
2. `customize_starter` — Use starter and customize (recommended)
3. `import_existing` — Import existing curriculum
4. `build_from_scratch` — Build from scratch
5. `decide_later` — Skip

**Product principle:** External knowledge → Knowledge Library first → Platform owner reviews → never auto-becomes curriculum.

---

## Spine constants — current state

`RECOMMENDED_CURRICULUM_SPINE` has 15 levels across 5 stages (Red/Orange/Green/Yellow/High Performance × 3 levels each). These are the anchor IDs for all downstream attachments.

---

## What Phase 1 builds

Pure TypeScript library modules only — no route pages, no migrations, no RLS changes.

| Sprint | Module | Purpose |
|---|---|---|
| 504 | `commandCenter.ts` | Curriculum command center view model |
| 505 | `visualMapModel.ts` | Visual map node types and layout helpers |
| 506 | `expandableTree.ts` | Expandable tree node types and state model |
| 507 | `nodeDetailDrawer.ts` | Node detail drawer types and field builders |
| 508 | `contentTypeModel.ts` | "+ Add" content type registry |
| 509 | `donnaCurriculumContext.ts` | DONNA curriculum context awareness |
| 510 | `drillAttachmentModel.ts` | Drill attachment types |
| 511 | `skillHierarchyModel.ts` | Skill/sub-skill hierarchy model |
| 512 | `missionAttachmentModel.ts` | Mission → curriculum level attachment model |
| 513 | `badgeAttachmentModel.ts` | Badge → curriculum level attachment model |
| 514 | `parentGuidanceAttachment.ts` | Parent guidance attachment model |
| 515 | `coachCueLibrary.ts` | Coach cue library |
| 516 | `assessmentCriteriaModel.ts` | Assessment criteria model |
| 517 | `evidenceRequirementsModel.ts` | Evidence requirements model |
