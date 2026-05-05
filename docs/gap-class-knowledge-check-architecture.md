# Gap Class / Knowledge Check Architecture

**Sprint 25 — Architecture V1**
**Date:** 2026-05-05
**Status:** Architecture-only — no schema created yet.

---

## Product Goal

Gap Class is a targeted learning system that:
1. Identifies specific knowledge or skill gaps in a player's curriculum progress.
2. Assigns focused learning modules to address those gaps.
3. Uses knowledge checks to confirm whether a gap has been closed.
4. Feeds confirmed progress back into the curriculum requirement system.
5. Stays calm and positive in all player/parent-facing language.

The director and head coach see gaps clinically. The player sees a mission.
The parent sees progress language, not deficit language.

---

## Student-Facing Concept

Players do not see "Gap Class." Instead they see:
- **"Your Next Mission"** — a focused practice goal, framed as a challenge to master.
- **"Level Up Challenge"** — a short quiz or drill challenge before the next advancement review.
- **"Weekly Focus"** — a themed skill the coach has chosen for this player this week.

No deficit framing. No "you are behind." No comparison to other players.
Language examples from `POSITIVE_DEVELOPMENT_LANGUAGE_GUIDE.md` apply here.

---

## Parent-Safe Framing

Parents see:
- "{First name} is working on a focused skill this week: {skill_name}."
- "This focus area was identified by the coach as the next step in {first_name}'s development."
- "{First name} completed the Level Up Challenge for {skill_domain}." (only after confirmed completion)

Parents never see:
- "Gap" or "gap class"
- Comparison to other players
- Raw assessment scores
- Gap confidence labels (possible, needs_review, confirmed)

Parent visibility of Gap Class content defaults to `false`. Director must explicitly publish.

---

## Director Approval Model

```
Gap detected (from PlayerGapSummaryPanel or assessment)
  → Director reviews gap in Review Queue
    → Director approves "Assign Gap Class module to player"
      → Module assigned to player (internal, pending player-facing publish)
        → Director optionally publishes mission text to player/parent view
          → Player completes module (coach confirms or knowledge check)
            → Evidence added to requirement_evidence_links
              → Requirement progress updates
```

Key invariant: **AI may suggest. Director approves. System records. Nothing automatic.**

---

## Curriculum Requirement Linkage

Each Gap Class module is linked to one or more curriculum requirements:

```
gap_class_modules
  ├── player_id
  ├── academy_id
  ├── curriculum_requirement_id (FK → curriculum requirements)
  ├── gap_type: 'exposure' | 'knowledge' | 'skill' | 'fitness'
  ├── trigger_gap_id (optional — FK → detected gap record)
  ├── status: 'pending_director_review' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  ├── assigned_by (director/head_coach)
  ├── target_date
  ├── mission_text (player-facing positive framing)
  ├── parent_message (parent-safe progress note)
  ├── is_player_visible: boolean (default false)
  ├── is_parent_visible: boolean (default false)
  └── completed_at / confirmed_by
```

---

## Question Bank Model

For knowledge checks, Gap Class uses a simple question bank:

```
gap_class_questions
  ├── id
  ├── curriculum_requirement_id (FK)
  ├── curriculum_domain_key (e.g., 'forehand', 'tactical_awareness')
  ├── question_text
  ├── question_type: 'multiple_choice' | 'coach_observation' | 'drill_completion'
  ├── answer_options: JSON (for multiple_choice)
  ├── correct_answer: string | null
  ├── difficulty: 'introductory' | 'standard' | 'advanced'
  ├── authored_by: 'brian_master' | 'academy_custom' | 'ai_draft'
  ├── is_approved: boolean
  └── academy_id (null = global, non-null = academy-specific)
```

V1 questions are authored by director/Brian — no AI generation of questions without approval.

---

## Learning Module Model

A learning module bundles a gap with practice content:

```
gap_class_modules
  ├── description (coach-facing context)
  ├── drill_suggestions: string[] (from curriculum drill bank)
  ├── coach_cue_suggestions: string[] (from curriculum coach cues)
  ├── knowledge_check_ids: uuid[] (links to gap_class_questions)
  ├── estimated_minutes: int (session time estimate)
  ├── recommended_block_type: 'technique' | 'tactical' | 'fitness' | 'mental'
  └── source_requirement_text (curriculum requirement verbatim)
```

---

## Knowledge Check Model

A knowledge check is one or more questions presented to a player as a review activity:

```
gap_class_knowledge_checks
  ├── id
  ├── player_id
  ├── module_id (FK → gap_class_modules)
  ├── questions: uuid[] (question IDs)
  ├── status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed'
  ├── player_answers: JSON (submitted answers)
  ├── coach_review_notes: string | null
  ├── confirmed_by: uuid (director/coach who reviewed)
  ├── confirmed_at: timestamp
  ├── result: 'passed' | 'needs_retry' | 'not_applicable' | null
  └── evidence_link_id (FK → requirement_evidence_links, created after confirmation)
```

Coach reviews submitted knowledge check → confirms pass/retry → creates evidence link.

---

## How Gaps Create Recommended Modules

```
PlayerGapSummaryPanel (Sprint 23)
  shows: possible | needs_review | confirmed gaps
    → Director reviews gap
      → "Assign Gap Class" action creates proposed_action
        → Director approves in Review Queue
          → gap_class_modules row created (status = 'assigned')
```

In V1, the gap-to-module assignment is manual. Future automation:
- system suggests a module based on gap_type + curriculum_requirement_id
- director approves with one click

---

## How Angles App / At-Home Practice Reinforces

The `PlayerMissionPreview` on the player portal (Sprint 229) is the hook for this:
- Gap Class module mission_text feeds into the "Next Mission" display
- At-home drill suggestions from the module appear in the player portal fitness section
- Parent is shown a positive progress note when module is published

The Angles App mission model (distinct from Academy OS) would need a bridge API/webhook
— this is out of scope for V1.

---

## How Brian-Modified Curriculum Affects Module Recommendations

- Gap Class modules are sourced from `academy_curriculum_overrides` (the academy's customised curriculum).
- If the academy has overridden a requirement, the module for that requirement uses the override's coach cues and drill suggestions, not the global master.
- Brian's master curriculum (`curriculum_versions` where source = 'brian_master') is protected — Gap Class never modifies it.
- Academy custom modules (`authored_by = 'academy_custom'`) can add questions not in the master.

---

## Role Permissions

| Action | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| View gap summary | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve gap class assignment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Review knowledge check result | ✅ | ✅ | ✅ | ❌ | ❌ |
| View assigned module mission | ✅ | ✅ | ✅ | ✅ (if published) | ❌ |
| View parent message | ✅ | ✅ | ✅ | ❌ | ✅ (if published) |
| Create questions | Director/Brian only | ❌ | ❌ | ❌ | ❌ |
| Auto-assign gap class | ❌ (requires approval) | ❌ | ❌ | ❌ | ❌ |

---

## Data Safety

- Gap records, gap class modules, knowledge check results: `academy_id` scoped + RLS.
- Player/parent visibility: default false. Director must explicitly publish.
- Knowledge check answers: internal only unless director explicitly approves parent message.
- Cross-academy data: impossible — all tables have `academy_id` + RLS.
- Brian's master: read-only for all academies. No Gap Class module overwrites it.

---

## Future Schema Proposal

### Requires explicit sprint approval before creating:

1. `gap_class_modules` — player + requirement + module content + status
2. `gap_class_questions` — question bank per requirement/domain
3. `gap_class_knowledge_checks` — per-player check with answers and confirmation

### Associated migrations:
- RLS on all three tables (academy_id scoped)
- Add FK from `gap_class_modules` → `curriculum_requirements`
- Add `evidence_link_id` FK from `gap_class_knowledge_checks` → `requirement_evidence_links`

---

## V1 Sprint Sequence

| Sprint | Deliverable |
|---|---|
| Sprint 25 (this) | Architecture doc |
| Sprint 26+ | Director gap → module assignment action (proposed_actions pipeline) |
| Sprint 27+ | Gap Class module creation UI |
| Sprint 28+ | Knowledge check question bank (Brian-authored) |
| Sprint 29+ | Knowledge check delivery to player (read-only view) |
| Sprint 30+ | Coach confirmation of knowledge check result |
| Sprint 31+ | Evidence link creation after confirmed check |
| Sprint 32+ | Parent-safe progress message for completed Gap Class |

Each sprint after this requires: explicit migration approval if schema is new.

---

## Known V1 Limitations

- No Gap Class modules table exists yet — Sprint 25 is architecture only.
- Knowledge check questions require Brian/director authorship — no AI generation without review.
- Player-facing Gap Class UI does not exist yet.
- At-home practice reinforcement (Angles App bridge) is out of scope for Academy OS V1.
- Knowledge check delivery requires additional player auth + session management.
