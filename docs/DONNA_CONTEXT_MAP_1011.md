# DONNA Context Map
Sprint 1011 — 2026-05-18

## Purpose

Maps what DONNA can know from the current system: source files, availability, role visibility, answer confidence, and risk.

---

## Context Source Inventory

### Sessions

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Today's sessions count | `sessions` table | Live | Director, Coach | High | Low |
| Session blocks | `session_blocks` | Live | Director, Coach | High | Low |
| Session status | `sessions.status` | Live | Director, Coach | High | Low |
| Block completion status | `localStorage` | Local only | Coach only | Low | Medium — not persisted |
| Coach assigned to session | `sessions.coach_id` + `profiles` | Live | Director | High | Low |

Source files: `src/lib/backend/sessions.ts`, `src/lib/donna/commandBriefLiveLoader.ts`

### Templates

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Template list | `templates` table | Live | Director | High | Low |
| Template blocks | `template_blocks` | Live | Director, Coach | High | Low |
| Curriculum level on template | `templates.curriculum_level_id` | Schema gap (migration 045) | Director | None until migration | Medium |

Source files: `src/lib/templates/templateRepository.ts`, `src/lib/templates/templateCurriculumPreview.ts`

### Review Queue / Proposed Actions

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Pending review count | `proposed_actions WHERE status='pending_review'` | Live | Director | High | Low |
| Wrap-up drafts | `proposed_actions WHERE action_type='session_wrap_up_v1'` | Live | Director | High | Low |
| Attendance exceptions | `proposed_actions WHERE action_type='attendance_exception'` | Live | Director | High | Low |
| Parent-safe draft | `proposed_actions WHERE subtype='parent_safe_summary'` | Live (display only) | Director | Medium | Medium — send not built |
| Curriculum evidence | `proposed_actions WHERE subtype='curriculum_evidence'` | Live (display only) | Director | Medium | Medium — gate link not built |

Source files: `src/app/director/_actions/donnaReviewQueueActions.ts`, `src/lib/donna/reviewQueueCOOSignal.ts`

### Coach Wrap-Ups

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Wrap-up submitted | `proposed_actions` with wrap-up payload | Live | Director, Coach | High | Low |
| Wrap-up coverage for today | `commandBriefLiveLoader` | Live | Director | High | Low |
| Individual wrap-up answers | `proposed_actions.payload` | Live | Director | High | Low |

Source files: `src/lib/donna/commandBriefLiveLoader.ts`, `src/lib/donna/wrapUpReviewSurfaceLoader.ts`

### Player Profiles

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Player list + curriculum level | `players` + `player_curriculum_states` | Live | Director, Coach (own players) | High | Low |
| Development summary | `player_development_summaries` | Live | Director, Coach (own players) | High | Low |
| Observations | `player_observations` | Live | Director, Coach (own players) | High | Parent-safe check required |
| Gate evidence | `player_gate_status` | Schema gap (migrations 041-060) | Director | None until migration | High |
| Attention risk score | `playerAttentionRiskLoader` | Live (rule-based) | Director | Medium | Low |

Source files: `src/lib/backend/players.ts`, `src/lib/donna/playerAttentionRiskLoader.ts`, `src/lib/donna/playerCOOContext.ts`

### Curriculum

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Curriculum levels | `curriculum_levels` | Live | Director | High | Low |
| Curriculum drills | `curriculum_drills` | Live | Director | High | Low |
| Curriculum gates | `curriculum_gates` | Live | Director | High | Low |
| Curriculum bottlenecks | `curriculumBottleneckLoader` | Partial (demo seed) | Director | Low | Medium — demo data |
| Level requirements | `curriculum_track_requirements` | Schema gap (migration 041) | Director | None | High |

Source files: `src/lib/backend/curriculum.ts`, `src/lib/donna/curriculumBottleneckLoader.ts`

### Evidence Drafts

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Observation drafts | `proposed_actions` | Live | Director, Coach | High | Low |
| Curriculum evidence links | `proposed_actions` | Display only | Director | Medium | Medium — gate link not built |

### Attendance Drafts

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Exception count | `proposed_actions` | Live | Director | High | Low |
| Unrostered flags | `proposed_actions.payload` | Live | Director | High | No roster mutation |

### Parent-Safe Drafts

| Signal | Source | Availability | Role Visibility | Confidence | Risk |
|---|---|---|---|---|---|
| Draft content | `proposed_actions.payload` | Live | Director only | High | High — director approval required before any send |
| Send status | Not built | N/A | N/A | N/A | Parent send flow deferred |

---

## Future Backend Needs

| Signal | Blocker | Priority |
|---|---|---|
| Template curriculum level | Migration 045 not applied | Medium |
| Block completion from execute view | `session_blocks.status` column missing | High |
| Gate evidence counts | Migrations 041-060 not applied | High |
| Level requirement progress | Migration 041 not applied | High |
| Parent send status | Director send flow not built | High |
| Real curriculum bottlenecks | Demo data only | Medium |

---

## Existing Context Infrastructure (Not Duplicated by Sprint 1011-1019)

- `academyHealthSourceMap.ts` (Sprint 497) — KPI source map
- `playerCOOContext.ts` (Sprint 559) — player-level context builder
- `commandBriefLiveLoader.ts` (Sprint 512) — director brief live loader
- `reviewQueueCOOSignal.ts` — review queue signal
- `groupHealthLoader.ts` — group health data
- `coachSupportLoader.ts` — coach support signals
- `donnaCOOAnswerEngine.ts` (Sprint 554) — COO answer generation
