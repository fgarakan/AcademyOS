# Curriculum-Aware Templates — Completion Audit
Sprint 970 — 2026-05-18

## Overview

This audit covers the full Curriculum-Aware Template System sprint block (Sprints 935–970). It documents what was built, what is complete, what is deferred, and what backend wiring is needed before any of this ships to production.

---

## Sprint Block Summary

| Sprint | Title | Status |
|--------|-------|--------|
| 935 | Class Template Curriculum Level Selector V1 | COMPLETE |
| 936 | Class Template Curriculum Pull Preview V1 | COMPLETE |
| 937 | Class Template Auto-Populated Blocks V1 | COMPLETE |
| 938 | Class Template Recommended Drills From Curriculum V1 | COMPLETE |
| 939 | Class Template Coach Watch-Fors From Curriculum V1 | COMPLETE |
| 940 | Class Template Assessment Gate Connection V1 | COMPLETE |
| 941 | Class Template Player Mission Connection V1 | COMPLETE |
| 942 | Class Template Review Step Curriculum Summary V1 | COMPLETE |
| 943 | Class Template Coach Preview Connection V1 | COMPLETE |
| 944 | Fitness Template Curriculum Level Selector V1 | COMPLETE |
| 945 | Fitness Template Curriculum Pull Preview V1 | COMPLETE |
| 946 | Fitness Template Block Type Builder V1 | COMPLETE |
| 947 | Fitness Exercise Auto-Population Engine V1 | COMPLETE |
| 948 | Fitness Duplicate Exercise Prevention V1 | COMPLETE |
| 949 | Fitness Exercise Progression Regression Suggestions V1 | COMPLETE |
| 950 | Fitness Template Tennis Transfer Labels V1 | COMPLETE |
| 951 | Fitness Template Review Step Curriculum Summary V1 | COMPLETE |
| 952 | Fitness Template Coach Preview Connection V1 | COMPLETE |
| 953 | Template Curriculum Source Labels V1 | COMPLETE |
| 954 | Template Draft Safety Language Pass V1 | COMPLETE |
| 955 | Template Edit Controls Polish V1 | COMPLETE |
| 956 | Template Save Draft Placeholder Flow V1 | COMPLETE |
| 957 | Template Review Queue Handoff Preview V1 | COMPLETE |
| 958 | Template Impact Preview Integration V1 | COMPLETE |
| 959 | Template DONNA Context Awareness V1 | COMPLETE |
| 960 | Template DONNA Class Template Suggestions V1 | COMPLETE |
| 961 | Template DONNA Fitness Template Suggestions V1 | COMPLETE |
| 962 | Template DONNA Modify Difficulty Actions V1 | COMPLETE |
| 963 | Template DONNA Duration Adjustment Actions V1 | COMPLETE |
| 964 | Template DONNA Missing Template Gap Detection V1 | COMPLETE |
| 965 | Template DONNA Review Before Apply Guardrails V1 | COMPLETE |
| 966 | Class Template End-to-End Browser QA V1 | COMPLETE |
| 967 | Fitness Template End-to-End Browser QA V1 | COMPLETE |
| 968 | Template Coach Preview Browser QA V1 | COMPLETE |
| 969 | Curriculum-Aware Template System Regression V1 | COMPLETE |
| 970 | Curriculum-Aware Templates Completion Audit V1 | COMPLETE (this document) |

---

## What Is Complete (Demo-Mode)

### Core Create Flows
- **Class template create**: 5-step wizard. Curriculum level selector → goal selection → block/drill builder (auto-populated from curriculum) → full curriculum summary on review step. Draft saved locally.
- **Fitness template create**: 5-step wizard. Curriculum stage → fitness goal → load/duration → block type builder with exercise bank (auto-populated, duplicate prevention, progression/regression hints) → full curriculum summary on review step. Draft saved locally.

### Detail Pages
- **Class template detail** (`/director/templates/class/[templateId]`): Overview card, curriculum connection card, session blocks, coach briefing notes, review queue handoff (3-step), draft safety panel.
- **Fitness template detail** (`/director/templates/fitness/[templateId]`): Overview card, curriculum stage connection, exercise list, tennis transfer tags, review queue handoff, draft safety panel.

### Coach Preview
- `/director/templates/coach-preview`: URL params (`level`, `goal`, `type`) drive curriculum context card. Fitness type shows 5-field `FitnessCurriculumPreview`. Class type shows curriculum level preview.

### Impact Preview
- `/director/templates/impact-preview`: URL params (`name`, `level`, `type`) drive "Previewing Template" card. Dynamic template name + level displayed.

### DONNA Panel
- Context-aware prompts (class_detail, fitness_detail, coach_preview, impact modes)
- Class curriculum gaps section (class_library, class_create modes)
- Fitness curriculum gaps section (fitness_library, fitness_create modes)
- Difficulty actions (Easier/Harder flag, local only)
- Duration adjustment (±15min steps, capped ±30min, local only)
- Review Before Apply guardrail (class_detail, fitness_detail)
- Contextual quick action hrefs with URL params from context prop

### Gap Detection
- `/director/templates/donna-suggestions`: Coverage Map card showing class/fitness coverage per level (Beginner/Intermediate/Advanced/Elite) derived from mock data.

---

## What Is Demo-Mode Only (Deferred to Backend Wiring)

| Feature | Demo Behavior | Production Requirement |
|---------|--------------|----------------------|
| Template save | Local `useState` only — no DB write | `proposed_actions` insert + director approval flow |
| DONNA difficulty flag | Local `useState` — no side effect | Proposed action: `{ type: 'template_difficulty_change', ... }` → `proposed_actions` |
| DONNA duration flag | Local `useState` — no side effect | Proposed action: `{ type: 'template_duration_change', ... }` → `proposed_actions` |
| Draft creation from DONNA suggestions | Local `drafted` Set — no DB write | New template draft record in `template_drafts` table (TBD) |
| Coverage map | Derived from `DEMO_*` mock arrays | Live query: count templates per level/type from DB |
| Template library lists | `DEMO_CLASS_TEMPLATES`, `DEMO_FITNESS_TEMPLATES` | DB query with RLS: `academy_templates` table (TBD) |
| Review queue handoff | Display-only 3-step card | Real `proposed_actions.status` flow with director review UI |
| Edit Draft | Links to create page (no pre-fill) | Load existing draft from DB, pre-fill wizard state |
| Curriculum connection edit | Button shown but no-op | Mutate `template.curriculum_connection_id` via proposed action |
| Impact preview metrics | Static demo percentages | Real query: sessions created from template, players affected, outcomes |

---

## Architecture Notes

### Core Rule (maintained throughout)
> Curriculum is the source of truth. Templates translate curriculum into repeatable execution. DONNA guides. Director approves. Nothing mutates curriculum silently.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/templates/templateCurriculumPreview.ts` | All curriculum-to-template mapping constants and getters |
| `src/lib/templates/fitnessBlockTypes.ts` | `FitnessBlockType` union, display helpers, intent text, accent colors |
| `src/lib/templates/fitnessExerciseAutoPopulate.ts` | Exercise bank (8 types × 5 stages), progression/regression map |
| `src/lib/templates/templateMockData.ts` | Demo template arrays, DONNA suggestions, template blocks |
| `src/components/templates/TemplateDonnaPanel.tsx` | DONNA sidebar — context awareness, gaps, difficulty, duration, guardrail |
| `src/components/templates/CurriculumDrillReferencePanel.tsx` | Curriculum drill reference (used in coach preview) |

### Curriculum Data Constants (read-only everywhere)
- `CURRICULUM_LEVEL_PREVIEWS` — 5 levels (Red→High Performance)
- `FITNESS_CURRICULUM_PREVIEW_BY_STAGE` — 5 stages × 7 fields
- `CURRICULUM_DRILLS_BY_STAGE` — drills per block type per stage
- `CURRICULUM_WATCH_FORS_BY_STAGE` — coaching cues per block type per stage
- `SUPPORTED_GATES_BY_STAGE` — assessment gates per stage
- `PLAYER_MISSIONS_BY_STAGE` — player mission statements per stage
- `GOALS_BY_STAGE` — goal options for template create per stage
- `FITNESS_EXERCISE_BANK` — 40 exercise lists (8 types × 5 stages)
- `EXERCISE_PROGRESSION_MAP` — 24 exercise progression/regression pairs

---

## Production Readiness

**TypeScript:** Clean throughout sprint block.
**Demo mode:** All mutations are client-local state only.
**Security:** No DB writes, no external sends, no RLS bypass, no service role usage.
**Next step:** Backend wiring sprint — design `academy_templates` table schema, `template_drafts`, RLS policies, and the `proposed_actions` flow for template mutations.

---

## Audit Sign-Off

Sprint block 935–970 is complete as scoped: curriculum-aware template UX, DONNA panel intelligence, and QA documentation. Ready for handoff to backend wiring phase.
