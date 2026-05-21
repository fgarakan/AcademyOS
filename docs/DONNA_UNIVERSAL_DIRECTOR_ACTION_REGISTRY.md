# DONNA Universal Director Action Registry

**Sprint:** 606
**Date:** 2026-05-21
**Source:** `src/lib/donna/directorActionRegistry.ts`, `src/lib/donna/directorActionTypes.ts`, `src/lib/donna/directorActionPolicy.ts`

---

## Purpose

This document is the human-readable reference for every DONNA action available to directors in AcademyOS. It maps each action to its safety class, implementation status, approval requirement, and director route.

Use this document to:
- Understand what DONNA can and cannot do in each part of the product
- Plan which actions to wire next
- Verify that the correct approval model is applied to each action
- Track implementation gaps across domains

For safety class definitions, see `docs/DONNA_ACTION_SAFETY_CLASSES.md`.  
For conversational quality rules, see `docs/DONNA_CONVERSATIONAL_QUALITY_STANDARD.md`.  
For route-level DONNA connectivity scores, see `src/lib/donna/directorCoverageRegistry.ts`.

---

## Core doctrine

```
DONNA can understand every request.
DONNA can draft every allowed action.
DONNA can route sensitive actions for review.
DONNA can execute only actions that are safe and approved.
DONNA must never bypass permissions, visibility rules, or approval gates.
```

Operating model:
```
DONNA proposes → Director approves → System records → System executes
```

---

## Action class summary

| Class | What DONNA does | Director approval required |
|---|---|---|
| `answer_only` | Explains or summarizes — no state change | No |
| `draft_only` | Creates a proposed_actions draft for director review | Yes (to apply) |
| `review_required` | Proposes a significant change — must pass review queue | Yes (to apply) |
| `director_approval_required` | Director must explicitly approve — DONNA facilitates | Yes (always) |
| `platform_owner_required` | Beyond director scope — platform owner must authorize | Platform owner |
| `blocked` | Refuses — explains why and offers safe alternative | N/A |
| `unsafe` | Architecture red line — refuses unconditionally | N/A |
| `ambiguous` | Too vague — asks one clarifying question before acting | N/A |

---

## Implementation status summary

| Status | Meaning |
|---|---|
| `implemented_and_wired` | Backend action file + UI entry point both exist and are connected |
| `implemented_not_wired` | Backend action file exists; no UI entry point yet surfaced |
| `partially_implemented` | Some backend logic exists; incomplete or missing a flow |
| `registry_only` | Defined here; no backend implementation yet |
| `missing_backend` | UI pattern exists; backend server action not yet built |
| `blocked_by_permissions` | Requires role or platform capability not yet in scope |
| `unsafe_to_automate` | Must never be automated — blocked by architecture invariant |

---

## Full action registry

### `answer_only` — 15 actions

| ID | Display name | Domain | Status | Wired | Routes |
|---|---|---|---|---|---|
| `explain_director_dashboard` | Explain the director dashboard | director_dashboard | partially_implemented | partial | `/director`, `/director/donna` |
| `explain_kpi` | Explain what a KPI means | kpi_reporting | implemented_not_wired | not_wired | `/director/kpi`, `/director` |
| `summarize_kpi` | Summarize KPI trends | kpi_reporting | implemented_not_wired | not_wired | `/director/kpi`, `/director/donna` |
| `identify_curriculum_gaps` | Identify curriculum coverage gaps | curriculum | implemented_not_wired | partial | `/director/curriculum`, `/director/donna` |
| `explain_level_movement` | Explain why a player is ready or overdue | level_movement | partially_implemented | partial | `/director/level-up`, `/director/players/[playerId]` |
| `summarize_player_profile` | Summarize a player's development profile | player_profiles | implemented_not_wired | not_wired | `/director/players/[playerId]` |
| `summarize_roster_gaps` | Summarize roster attention priorities | groups_rosters | implemented_not_wired | not_wired | `/director/players`, `/director/signals`, `/director/donna` |
| `explain_licensing_health` | Explain licensing health status | licensing_health | registry_only | not_wired | `/director/curriculum`, `/director/kpi`, `/director/donna` |
| `explain_review_queue_item` | Explain a review queue item | review_queue | partially_implemented | partial | `/director/review`, `/director/review/[actionId]` |
| `summarize_coach_notes` | Summarize coach observations for a player | coach_notes | implemented_not_wired | not_wired | `/director/players/[playerId]`, `/director/coaches/[coachId]` |
| `request_clarification` | Ask one clarifying question | director_dashboard | partially_implemented | partial | `*` |
| `explain_curriculum_builder_step` | Explain a curriculum builder step | curriculum_builder | registry_only | not_wired | `/director/curriculum/builder` |
| `explain_academy_setup` | Explain academy setup and onboarding | academy_setup | partially_implemented | partial | `/director/onboarding/interview`, `/director/donna` |
| `explain_academy_settings` | Explain an academy settings option | academy_settings | registry_only | not_wired | `/director/settings` |
| `summarize_template_library` | Summarize available session templates | templates | partially_implemented | partial | `/director/templates`, `/director/donna` |

---

### `draft_only` — 13 actions

All `draft_only` actions create a `proposed_actions` row with `status: 'pending_review'`. No state change occurs until director approves in the review queue.

| ID | Display name | Domain | proposed_action_type | Status | Wired | Routes |
|---|---|---|---|---|---|---|
| `draft_attendance_exception` | Draft an attendance exception | attendance | attendance_exception | implemented_and_wired | wired | `/director/sessions/[sessionId]` |
| `draft_parent_summary` | Draft a parent-safe development summary | parent_summaries | parent_communication | implemented_and_wired | wired | `/director/players/[playerId]` |
| `draft_player_summary` | Draft a player development brief | player_summaries | player_brief | implemented_and_wired | wired | `/director/players/[playerId]` |
| `draft_curriculum_item` | Draft a new curriculum content item | curriculum | curriculum_adjustment | implemented_not_wired | not_wired | `/director/curriculum`, `/director/curriculum/builder` |
| `draft_curriculum_mission` | Draft a new player mission | missions | curriculum_adjustment | registry_only | not_wired | `/director/curriculum`, `/director/players/[playerId]` |
| `draft_curriculum_badge` | Draft a new curriculum badge | badges | curriculum_adjustment | registry_only | not_wired | `/director/curriculum` |
| `draft_drill` | Draft a new training drill | curriculum | curriculum_adjustment | registry_only | not_wired | `/director/curriculum`, `/director/curriculum/builder` |
| `draft_video_metadata` | Draft video or media metadata | media_video | curriculum_adjustment | registry_only | not_wired | `/director/curriculum`, `/director/templates` |
| `draft_assessment_recommendation` | Draft an assessment recommendation | assessments | player_brief | partially_implemented | partial | `/director/players/[playerId]` |
| `route_coach_note_to_review` | Route a coach observation to the review queue | coach_notes | player_observation | implemented_not_wired | not_wired | `/director/players/[playerId]`, `/director/coaches/[coachId]` |
| `draft_session_plan` | Draft a session plan | sessions | session_wrap_up_v1 | partially_implemented | partial | `/director/sessions`, `/director/templates` |
| `draft_coach_brief` | Draft a coach communication brief | coach_portal | coach_communication | implemented_and_wired | wired | `/director/players/[playerId]`, `/director/coaches/[coachId]` |

---

### `review_required` — 6 actions

These actions create a `proposed_actions` row and route it to the review queue. Director approval is required before any execution.

| ID | Display name | Domain | proposed_action_type | Status | Wired | Parent/player risk | Routes |
|---|---|---|---|---|---|---|---|
| `propose_level_movement` | Propose a level advancement | level_movement | level_review | implemented_and_wired | wired | No | `/director/level-up`, `/director/players/[playerId]` |
| `propose_player_placement` | Propose a player placement | player_profiles | placement | implemented_not_wired | not_wired | No | `/director/placement` |
| `recommend_group_adjustment` | Recommend a group adjustment | groups_rosters | move_player_group | registry_only | not_wired | No | `/director/players`, `/director/signals` |
| `propose_badge_award` | Propose awarding a badge | badges | badge_award | registry_only | not_wired | No | `/director/players/[playerId]` |
| `propose_video_visibility_change` | Propose a video visibility change | media_video | curriculum_adjustment | registry_only | not_wired | **Yes** | `/director/curriculum`, `/director/players/[playerId]` |
| `propose_curriculum_licensing_review` | Propose a curriculum licensing review | licensing_health | curriculum_adjustment | registry_only | not_wired | No | `/director/curriculum`, `/director/kpi` |

---

### `director_approval_required` — 2 actions

Director must explicitly act. DONNA facilitates but does not decide.

| ID | Display name | Domain | Status | Wired | Routes |
|---|---|---|---|---|---|
| `approve_review_item` | Approve a review queue item | review_queue | implemented_and_wired | wired | `/director/review`, `/director/review/[actionId]` |
| `reject_review_item` | Reject a review queue item | review_queue | implemented_and_wired | wired | `/director/review`, `/director/review/[actionId]` |

---

### `platform_owner_required` — 1 action

Beyond director scope. DONNA declines and explains.

| ID | Display name | Domain | Status |
|---|---|---|---|
| `override_global_knowledge_visibility` | Override global knowledge visibility | global_knowledge | blocked_by_permissions |

---

### `blocked` — 1 action

DONNA refuses and offers the safe alternative.

| ID | Display name | Domain | Status |
|---|---|---|---|
| `block_unsafe_parent_visibility_request` | Block unsafe parent visibility request | parent_player_visibility | implemented_and_wired |

---

### `unsafe` — 1 action

Architecture red line. DONNA refuses unconditionally.

| ID | Display name | Domain | Status |
|---|---|---|---|
| `auto_level_move_without_approval` | Auto level move without approval | level_movement | unsafe_to_automate |

---

### `ambiguous` — 1 action

Too vague. DONNA asks one clarifying question.

| ID | Display name | Domain | Status |
|---|---|---|---|
| `vague_academy_question` | Handle a vague director question | director_dashboard | partially_implemented |

---

## Coverage summary

**Total registered actions:** 39  
**Action classes covered:** 8 / 8  
**Domains covered:** 24 / 24

| Status | Count |
|---|---|
| implemented_and_wired | 8 |
| implemented_not_wired | 8 |
| partially_implemented | 10 |
| registry_only | 10 |
| blocked_by_permissions | 1 |
| unsafe_to_automate | 1 |
| missing_backend | 1 |

**UI wiring coverage:** ~21% fully wired (8/39)

---

## Domain coverage map

| Domain | Actions | Wired | Highest status |
|---|---|---|---|
| academy_setup | 1 | partial | partially_implemented |
| academy_settings | 1 | no | registry_only |
| director_dashboard | 3 | partial | partially_implemented |
| curriculum | 4 | partial | implemented_not_wired |
| curriculum_builder | 1 | no | registry_only |
| global_knowledge | 1 | no | blocked_by_permissions |
| media_video | 2 | no | registry_only |
| templates | 1 | partial | partially_implemented |
| sessions | 1 | partial | partially_implemented |
| attendance | 1 | yes | implemented_and_wired |
| coach_notes | 2 | no | implemented_not_wired |
| assessments | 1 | partial | partially_implemented |
| level_movement | 3 | yes | implemented_and_wired |
| player_profiles | 3 | yes | implemented_and_wired |
| groups_rosters | 2 | no | implemented_not_wired |
| missions | 1 | no | registry_only |
| badges | 2 | no | registry_only |
| parent_summaries | 1 | yes | implemented_and_wired |
| player_summaries | 1 | yes | implemented_and_wired |
| review_queue | 3 | yes | implemented_and_wired |
| licensing_health | 2 | no | registry_only |
| kpi_reporting | 2 | no | implemented_not_wired |
| coach_portal | 1 | yes | implemented_and_wired |
| parent_player_visibility | 1 | yes | implemented_and_wired |

---

## Top gaps for next sprints

Based on implementation status and P0/P1 priority from `DONNA_DIRECTOR_GAP_FIX_PLAN.md`:

| Action | Domain | Priority | Blocker |
|---|---|---|---|
| `explain_kpi` + `summarize_kpi` | kpi_reporting | P0 | DonnaKpiExplainerChip not built |
| `summarize_roster_gaps` | groups_rosters | P0 | DonnaRosterIntelligencePanel not built |
| `propose_player_placement` | player_profiles | P0 | DONNA placement button not wired |
| `summarize_player_profile` | player_profiles | P1 | DonnaPlayerChatShell not built |
| `summarize_coach_notes` | coach_notes | P1 | DonnaCoachIntelligencePanel not wired |
| `propose_badge_award` | badges | P1 | badge_award proposed_action type not defined |
| `draft_drill` | curriculum | P1 | Drill draft server action not built |
| `recommend_group_adjustment` | groups_rosters | P1 | move_player_group proposed_action type not defined |

---

## Safety invariants — always true

These invariants apply to every action in the registry and must not be overridden by any sprint:

1. DONNA never writes to `player_curriculum_states` directly.
2. DONNA never activates a player — only `finalize_player_placement()` does.
3. DONNA never sends a parent communication — only creates a draft.
4. DONNA never exposes raw coach notes to parents or players.
5. DONNA never bypasses the review queue for high-stakes changes.
6. DONNA never creates a level movement without a director-visible proposed_action row.
7. DONNA never creates a mutation without an audit_log entry.
