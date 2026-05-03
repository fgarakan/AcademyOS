# Individual Development Plan Model

**Sprint:** 229
**Last updated:** 2026-05-03
**Status:** V1 — pure model, no DB writes, no auto-actions

---

## What is an Individual Development Plan?

An Individual Development Plan (IDP) is the living object that makes every person in the academy
feel individually known.

It is not a static document. It is a structured view derived from:
- The player's current curriculum level and stage
- Open gates (what they still need to show)
- Approved evidence (what they have demonstrated)
- Training exposure (what domains they have practiced)
- Coach observations and approved recaps
- Learning module hints
- Detected training gaps
- Detected knowledge gaps
- Role-specific guidance for director, coach, player, and parent

---

## Operating model

> Voice/chat creates → UI confirms → Database structures → System executes

The IDP is always:
- **Read-only for player and parent** — no IDP auto-updates from player/parent interaction
- **Director-approved** — changes to curriculum level, priorities, or evidence require director action
- **Coach-informed** — coach recaps and observations feed into the IDP via approved proposed_actions
- **Role-filtered** — each role sees only what is appropriate for that role

---

## IDP object structure

### Top-level fields

| Field | Type | Description |
|---|---|---|
| `player_id` | string | Academy-scoped player identifier |
| `player_name` | string | Display name (first name for player/parent views) |
| `current_level` | string \| null | Curriculum level display name |
| `current_stage` | string \| null | Curriculum stage (e.g., orange_development) |
| `next_target_level` | string \| null | Next curriculum level display name |
| `active_priorities` | IdpPriority[] | Active development priorities (coach/director visible) |
| `open_gates` | IdpOpenGate[] | Requirements not yet met for advancement |
| `training_gaps` | IdpTrainingGap[] | Detected training exposure gaps |
| `knowledge_gaps` | IdpKnowledgeGap[] | Detected knowledge or understanding gaps |
| `approved_evidence_summary` | string \| null | Summary of approved gate evidence |
| `attendance_exposure_summary` | string \| null | Summary of attendance/training exposure |
| `recommended_next_mission` | string \| null | Mission phrasing for player-facing display |
| `coach_watch_fors` | string[] | Coach cues derived from gates/gaps |
| `parent_support_guidance` | string \| null | Parent-safe support tip |
| `reassessment_timing` | string \| null | When reassessment is recommended |
| `role_views` | IdpRoleViews | Filtered view objects per role |

### IdpPriority

| Field | Type |
|---|---|
| `title` | string |
| `description` | string \| null |
| `category` | string \| null |

### IdpOpenGate

| Field | Type |
|---|---|
| `id` | string |
| `domain` | string |
| `criterion` | string |
| `threshold` | string |

### IdpTrainingGap

| Field | Type |
|---|---|
| `gap_type` | string |
| `domain` | string \| null |
| `description` | string |
| `severity` | 'low' \| 'medium' \| 'high' \| 'insufficient_data' |
| `role_note` | string |

### IdpKnowledgeGap

| Field | Type |
|---|---|
| `gap_type` | string |
| `domain` | string \| null |
| `description` | string |
| `severity` | 'low' \| 'medium' \| 'high' \| 'insufficient_data' |
| `suggested_module_domain` | string \| null |

### IdpRoleViews

Each role view contains only the fields appropriate for that role.

#### Director view
Full picture: level, next target, priorities, gates, training gaps, knowledge gaps, evidence summary,
coach watch-fors, parent support note, reassessment timing.

#### Coach view
Coaching-relevant context: level, open gates, training gaps, coach watch-fors, recommended cues,
next mission context.
Does NOT include: parent support notes, internal director notes.

#### Player view
Mission-based language: current level, recommended mission, what to practice, what to understand,
requirements to move up, learning module hint, reflection question.
Does NOT include: raw coach notes, assessment scores, internal observations, other player data.

#### Parent view
Empathetic and action-oriented: what child is working on, why it matters, how to support this week,
what to say after practice, what not to over-focus on, next development step.
Does NOT include: coach observations, assessment scores, advancement timelines, internal notes,
other-child data.

---

## Role-specific language guidelines

### Player language
- Mission-based, never deficit-based
- "Your current mission is..." not "You are failing at..."
- "What to work on" not "Your weaknesses"
- "Coach is watching for..." not "You are being evaluated on..."
- "Next evidence to show" not "Requirements"

### Parent language
- Empathetic, not clinical
- First name always, never "your child" or "the player"
- One growth area max, never a list of issues
- End with encouragement or forward-looking statement
- No scores, no rankings, no comparisons to other players

### Coach language
- Direct, cue-based
- "Watch for..." "Prioritize..." "This session, focus on..."
- Domain-specific

### Director language
- Complete picture, operational
- "Ready for review", "open gate", "training gap in domain X"
- No auto-suggestions — all items require human judgment

---

## Safety rules

1. Player view: NO raw coach notes, NO assessment scores, NO other player data.
2. Parent view: NO coach observations, NO internal notes, NO scores, NO rankings.
3. Coach view: NO parent-only fields, NO director-only fields.
4. Director view: All fields, but labeled "Preview only — no changes made" when in preview context.
5. All role views: NO product/tool names (no Swinget, SwingCheck, The Angle, Swing Check).
6. All role views: NO pressure/shaming language (no "failed", "behind", "weak", "deficiency").

---

## Computation source

The IDP is built from:
- `players` record (name, status, join date)
- `player_curriculum_states` (current level, fitness phase)
- `curriculum_levels` (level display name, stage, sort order)
- `curriculum_gates` (open gates for current level)
- `player_priorities` (active priorities)
- `curriculum_coach_language` (coach cues, working_on, current_focus, next_step)
- `curriculum_drills` (top drills for level)
- `requirement_evidence_links` + `player_requirement_progress` (evidence summary)
- `session_attendance` (attendance exposure summary)
- Training gap detection (src/lib/gaps/trainingGapDetection.ts)
- Knowledge gap detection (src/lib/gaps/knowledgeGapDetection.ts)
- Learning module hints (src/lib/curriculum/learningModules.ts)

No AI inference. No auto-updates. All sources are approved or read-only.
