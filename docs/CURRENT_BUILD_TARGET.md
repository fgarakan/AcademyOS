# Current Build Target

**Last updated:** 2026-05-21
**Current phase:** Mega Sprint 554–603 COMPLETE — Curriculum-Centered V1 Productization

---

## Active target

**Mega Sprint 554–603 — Curriculum-Centered V1 Productization — COMPLETE (2026-05-21)**

All 50 sprints across 5 phases complete and pushed.

| Phase | Sprints | Content |
|---|---|---|
| Phase 1 (554–563) | Curriculum Node Drawer + Content Types | CurriculumNodeDrawer, 10 content type models, DONNA context, coach cue video pairing |
| Phase 2 (564–573) | Curriculum Coverage + Health Dashboard | Coverage model, gap analysis, level health, template connections, health dashboard |
| Phase 3 (574–583) | Player Assessment + Placement System | 4-domain rubrics (skill/competition/fitness/mental), voice structuring, placement recommendation, director assessment UI, cadence model |
| Phase 4 (584–593) | Coach Mobile + Curriculum/Assessment Capture | On-court action hub, session focus card, attendance exception draft, quick capture V2, voice-to-curriculum, voice-to-assessment, recap polish, observation draft review, curriculum feedback loop |
| Phase 5 (594–603) | Player/Parent Portal + Licensing | Badge system wired (player wins, wins page, celebration), progress indicators, parent badge visibility, pilot readiness dashboard, skill-path progress, mission engine recommendation |

**Next up:** Apply pending Supabase migrations (see `docs/KNOWN_LIMITATIONS.md`), then begin Director Dashboard KPI wiring and attention queue wiring.

---

## Mega Sprint 503–552 — COMPLETE

| Phase | Commits | Sprints | Content |
|---|---|---|---|
| Phase 1 (503–517) | `534b070` | 15 | Curriculum Experience Core — command center, visual map, expandable tree, node drawer, content types, DONNA context, drill/skill/mission/badge/parent guidance/coach cue/assessment/evidence models |
| Phase 2 (518–527) | `217605f` | 10 | Curriculum Coverage Intelligence — coverage model, gap analysis, domain balance, stage progression, level health, requirement progress aggregator, template connections, player intersection, health dashboard, recommendations |
| Phase 3 (528–537) | `0698af0` | 10 | Global Knowledge Library — types, library view, review queue, promotion path, tagging, search, privacy guards, DONNA interface, similarity detector, audit log |
| Phase 4 (538–545) | `0b52d74` | 8 | Knowledge Ingestion Classification — ingestion types, classifier, voice ingestion, structured import, source validator, ingestion dashboard, curriculum bridge, ingestion report |
| Phase 5 (546–552) | `5da73cb` | 7 | Knowledge Retrieval Intelligence — retrieval model, curriculum intelligence, answerability model, knowledge QA, knowledge index, curriculum knowledge panel view, mega-sprint QA harness |

All phases: pure TypeScript — no migrations, no RLS changes, no new dependencies.

---

## Mega Sprint 452–502 — COMPLETE

| Phase | Commits | Sprints | Content |
|---|---|---|---|
| Phase 1 (452–461) | `0ceca70` | 10 | Responsive UX — shell configs, nav, mobile/desktop patterns, empty states, state patterns, quick actions |
| Phase 2 (462–471) | `9c4b79b` | 10 | DONNA COO — conversation core, academy knowledge, director briefing, KPI model + explainer, task flows, search, action preview, preferences, voice+text unification |
| Phase 3 (472–481) | `40a855a` | 10 | Director Command Center — attention queue, KPI dashboard, approval flow helpers, curriculum operating view, template library helpers, group intelligence, curriculum inbox |
| Phase 4 (482–491) | `c6f804c` | 10 | Coach/Parent/Player Portals — coach KPI summary, portal assembly, voice-to-curriculum bridge, parent portal summary, comms prefs, player portal experience, progress indicators, visibility controls |
| Phase 5 (492–502) | `b0b0f73` | 11 | Badges + Mental + Curriculum + V1 Launch — badge model, eligibility engine, mental performance path, mission model + engine, voice curriculum classifier, curriculum draft helpers, V1 demo QA, pilot launch package |

All phases: pure TypeScript — no migrations, no RLS changes, no new dependencies.

---

## What is now available (new modules — library layer only)

### Responsive UX Layer (`src/lib/ux/`)
- `responsiveShell.ts` — BREAKPOINTS, ShellConfig, SHELL_CONFIGS, getShellVariantForRole
- `navConfigs.ts` — typed nav items for all 4 roles
- `mobilePatterns.ts` — TAP_TARGET, BottomSheetConfig, FAB_CONFIGS, STICKY_ACTION_BAR
- `desktopPatterns.ts` — DESKTOP_LAYOUT, SIDE_DRAWER, DONNA_PANEL, ACTIVITY_FEED
- `emptyStateConfigs.ts` — 17 empty state configs across 4 roles
- `statePatterns.ts` — 28 typed loading/error/success states
- `quickActions.ts` — 12 typed quick actions with role gates

### DONNA COO Layer (`src/lib/donna/`, `src/lib/kpis/`)
- `conversation/index.ts` — ConversationState, DONNA_ROLE_BLOCKS, trust stack, boundary builders
- `academyKnowledge/index.ts` — 14 knowledge areas with sensitivity/visibility gates
- `briefings/directorBriefing.ts` — 7-section daily briefing builder
- `kpiExplanations/kpiExplainer.ts` — healthy/warning/critical templates for all 12 KPIs
- `taskFlows/index.ts` — 10 multi-turn task flows
- `search/academySearch.ts` — role-scoped multi-area search
- `actionPreview/actionPreviewCards.ts` — preview cards with risk level
- `preferences/academyPreferences.ts` — academy-level preferences + applyCustomTerminology
- `kpis/academyKpiModel.ts` — 12 KPI definitions with metadata and thresholds

### Director Command Center Layer (`src/lib/director/`)
- `attentionQueue/index.ts` — prioritised director attention queue
- `kpiDashboard.ts` — KPI dashboard view model builder
- `approvalFlowHelpers.ts` — urgency scoring and grouping for review queue
- `curriculumOperatingView.ts` — weekly curriculum delivery view
- `templateLibraryHelpers.ts` — template filtering, compliance rollup
- `groupIntelligence.ts` — group risk signals and recommendations

### Curriculum Intelligence (`src/lib/curriculum/`)
- `inbox/index.ts` — voice-to-curriculum idea queue with similarity detection
- `mentalPerformance.ts` — mental competency definitions for all 5 curriculum stages
- `curriculumDraftHelpers.ts` — curriculum change proposal builder

### Coach Portal Layer (`src/lib/coach/`)
- `coachKpiSummary.ts` — coach-level KPI rollup
- `coachPortalAssembly.ts` — coach mobile portal view model
- `voiceCurriculumBridge.ts` — coach voice/text → curriculum inbox → director approval

### Parent Portal Layer (`src/lib/parent/`)
- `parentPortalSummary.ts` — parent-safe portal view model builder
- `parentCommunicationPreferences.ts` — communication preference types + validation

### Player Portal Layer (`src/lib/player/`)
- `playerPortalExperience.ts` — player-facing experience view model
- `progressIndicators.ts` — completion %, level bands, milestones, motivation line
- `visibilityControls.ts` — centralised content visibility gates for parent/player
- `missionModel.ts` — 10 player mission definitions
- `missionEngine.ts` — mission eligibility + recommendation engine

### Badge System (`src/lib/badges/`)
- `badgeModel.ts` — 10 badge definitions with rarity, criteria, visibility
- `badgeEligibilityEngine.ts` — badge status computed from player progress

### Voice (`src/lib/voice/`)
- `voiceCurriculumClassifier.ts` — deterministic curriculum intent classifier

### Demo / Pilot (`src/lib/demo/`)
- `v1DemoQa.ts` — 22-check V1 demo quality harness
- `pilotLaunchPackage.ts` — 30-item pilot launch checklist

---

## What still needs UI wiring

These library modules exist but are not yet connected to route pages:

| Module | Wires to |
|---|---|
| `attentionQueue/` | `/director` hero section |
| `kpiDashboard.ts` | `/director` KPI grid |
| `groupIntelligence.ts` | `/director/groups` |
| `curriculumOperatingView.ts` | `/director/curriculum` |
| `coachPortalAssembly.ts` | `/coach` home page |
| `parentPortalSummary.ts` | `/parent` page |
| `playerPortalExperience.ts` | `/player` page |
| `badgeEligibilityEngine.ts` | `/player` + `/director/players/[id]` |
| `missionEngine.ts` | `/player` home card |
| `curriculum/inbox/` | `/director/review` curriculum tab |

---

## Build order — historical state (all complete)

### Player Profile — COMPLETE (Sprints 100–250)
All 5 tabs complete: Overview · Skill Path · Competition · Fitness/Load · Notes

### Director Dashboard — COMPLETE
Academy Vital Signs, Priority Queue, Alerts, Sessions, Review Queue, DONNA panel

### Coach Workspace — COMPLETE (Sprints 237–249+)
Coach home, sessions, session detail, wrap-up, recap review

### Player Portal — COMPLETE (library layer)
`/player` renders with IDP and Q&A. Experience view model now available via `playerPortalExperience.ts`.

### Parent Portal — COMPLETE (library layer)
`/parent` renders with parent-safe IDP. Summary view model now available via `parentPortalSummary.ts`.

### Voice Intake OS — COMPLETE (Sprints 240–249)
Input → structuring → routing → review queue → safety guardrails

### DONNA COO Foundation — COMPLETE (Sprints 359–378)
Approval contract, role permissions, execution adapter, parent-safe rules, recommendation engine

### Coach Session Recap Intelligence — COMPLETE (Sprints 437–446)
Attendance queries, block execution, voice notes, observation tracker, wrap-up flow

### Player Evidence + Demo Readiness — COMPLETE (Sprints 447–451)
Evidence queries, development profile queries, player/parent portal queries, demo checker

---

## How to confirm the current target before starting

Read this file. The active work is UI wiring — connecting the `src/lib/` modules built in Mega Sprint 452–502 to the existing route pages. No new library modules are required to begin wiring.
