# Conversational OS Master Plan

**Version:** 1.0
**Last updated:** 2026-05-03
**Status:** Active — locked principles

---

## North Star

Academy OS is the conversational operating system for tennis academies.

> Voice creates → UI confirms → Database structures → System executes

Every interaction in Academy OS follows this sequence. Nothing skips a step. Nothing executes without confirmation. Nothing reaches a player or parent without director or head coach approval.

---

## Core Operating Principle

**AI proposes. Director/Head Coach approves. System records. System executes.**

This sequence is non-negotiable and applies to every mutation, every draft, and every communication. The system never acts autonomously on player data.

---

## Role-Specific Experiences

### academy_director
- Full conversational command interface (Director Command Center)
- Can draft session plans, group changes, director notes, curriculum reassessments via natural language
- All action commands create a pending draft — director reviews and approves before execution
- Query commands return read-only answers immediately (no draft created)
- Player Q&A preview: can simulate how a player would experience the Q&A system
- Parent guidance preview: can see what a safe parent-facing summary would look like before sending
- Learning module preview: can see all curriculum learning modules by level and domain

### head_coach
- Same approval authority as director for session-level decisions
- Can submit voice recaps via Coach Recap command
- Observations and attendance exceptions go through the review queue
- Cannot access director-only analytics or billing

### coach
- Can submit session recaps and observations
- Cannot create or approve drafts — all submissions go to review queue
- Cannot access player curriculum advancement decisions

### player
- Receives mission-based, curriculum-grounded answers to progress questions
- Questions answered using: current level, gates, drills, coach language, learning module hint
- No internal notes exposed, no coach scores, no raw assessment data
- Sees: current level, next target, what to practice, mission, try this, reflection question
- No AI calls — all answers are deterministic from curriculum data

### parent
- Receives parent-safe progress summaries only
- No internal coach notes, no deficit language, no comparisons to other players
- Content runs through `sanitizeParentFacingText()` before display
- Never sees: coach assessment scores, raw observations, pending decisions
- Preview-only until director explicitly approves and sends

---

## Command Lifecycle

```
1. Director types a natural language command
   ↓
2. parseAcademyCommand() → ParsedCommandResult
   - intent_type classified
   - entity_references extracted
   - guardrail check: canRoleUseIntent(role, intent_type)
   ↓
3a. Query intent → buildDirectorQueryAnswer() → read-only answer shown
    No draft created. No writes.
   ↓
3b. Action intent → submitDirectorCommandAction()
    → creates proposed_action with target_module = 'director_command'
    → status = 'pending_review'
    → director sees draft in Command Center + Review Queue
   ↓
4. Director reviews proposed_action in /director/review
   ↓
5. Director approves → execute_approved_action() called
   OR Director rejects → status = 'rejected', no execution
```

### Intent Types (current)
| Intent | Type | Creates Draft |
|---|---|---|
| session_draft | action | Yes |
| group_change_draft | action | Yes |
| director_note | action | Yes |
| curriculum_gap_summary | query | No |
| reassessment_pipeline | query | No |
| coach_recap | action | Yes |
| unknown | blocked | No |

---

## Approval Model

| Action | Requires Approval |
|---|---|
| Player curriculum level change | Yes — director or head_coach |
| Attendance exception | Yes — director or head_coach |
| Parent-safe message sent | Yes — director |
| Player observation saved | Yes — director or head_coach |
| Session plan published | Yes — director |
| Player advancement activated | Yes — director (finalize_player_placement only) |
| Evidence requirement linked | Yes — director or head_coach |

### What never executes automatically
- Player level promotion
- Parent communication
- Attendance record changes
- Player priority changes
- Any mutation triggered by a voice input without a human approval step

---

## Data Safety Model

### Role isolation rules
- `parent` role: cannot see coach notes, assessment scores, or other players
- `player` role: cannot see coach internal language, gate evaluations, or progress scores
- `coach` role: cannot see director analytics, billing, or cross-academy data
- RLS enforced at database level — not trusted from client
- All queries resolve `academy_id` from authenticated profile — never from client input

### Audit requirements
- All proposed_actions written to `proposed_actions` table with `academy_id`, `proposed_by_id`, and `created_at`
- All executed actions written to `audit_logs`
- No mutation bypasses the audit chain

---

## Player Q&A Model

The player Q&A system answers player questions about their development.

**Data sources used (safe):**
- `curriculum_levels` — level name, stage
- `curriculum_gates` — what to show for advancement
- `curriculum_drills` — what to practice
- `curriculum_coach_language` — focus areas and next steps
- `CurriculumLearningModule` (in-memory, generated) — mini challenge, reflection question, try this

**Data sources never exposed:**
- Coach notes
- Internal assessment scores
- Observations or evidence records
- Priority ranks or signals
- Other players' data

**Answer intents:**
| Intent | What it returns |
|---|---|
| current_level | Level name, stage, next target |
| next_level | Focus areas from coach language |
| level_requirements | Gate criteria |
| what_to_practice | Drills, focus, mini challenge, try this, reflection |
| level_meaning | Building/working-on from coach language |
| unknown | Prompt to use one of the known questions |

---

## Parent Guidance Model

Parent guidance is always reviewed by the director before being sent.

**Safe fields:**
- Player first name
- Current curriculum level name
- Coach language `current_focus` (sanitized)
- Next target level name
- Predefined parent-safe support suggestions
- Pressure-reducing notes

**Never exposed to parents:**
- Coach assessment notes
- Evidence records
- Player signals or priorities
- Comparison to other players
- Internal curriculum gate scores

**All text runs through:** `sanitizeParentFacingText()` in `parentSafeResponseRules.ts`

---

## Curriculum Learning Module Model

Curriculum learning modules are in-memory previews generated from seeded curriculum data. They are never stored in the database and never generate AI content.

**Each module contains:**
- `module_id` — levelId + domain
- `player_goal` — from coach language `current_focus`
- `why_it_matters` — from `doing_well` + narrative
- `key_idea` — from `working_on`
- `watch_for` — from first gate criterion
- `try_this` — from first drill name + objective
- `mini_challenge` — from coach language `next_step`
- `reflection_question` — domain-keyed reflection prompt
- `parent_support_tip` — domain-keyed parent support note
- `related_gate_ids` — gates for this level/domain
- `related_drill_ids` — drills for this level/domain
- `safety_note` — role-keyed privacy note

**Computed by:** `buildModuleForLevelDomain()` / `buildLearningModulePreviews()` in `src/lib/curriculum/learningModules.ts`

---

## Coach Recap Model

Coach recaps are structured from voice notes without AI calls.

**Flow:**
1. Coach submits voice note recap for a session
2. `structureRecapAction()` parses the recap text using rule-based pattern matching
3. Creates a `proposed_action` with `target_module = 'session_recap_structuring'`
4. Director reviews in `/director/review`
5. Director approves → attendance and observations applied
6. Director rejects → no changes made

**What recap structuring produces:**
- Detected players (name-matching)
- Attendance mentions (absent/late, confidence level)
- Player observation drafts
- Parent-safe draft candidates (staged, not sent)
- Director summary draft
- Session actual focus (changed-from-plan detection)
- Warnings

---

## What Must Never Happen Automatically

This list is a hard requirement for all current and future development:

1. Player curriculum level must not change without director/head_coach approval
2. Parent communications must not be sent without explicit director approval
3. Attendance records must not change without director/head_coach confirmation
4. Player priorities must not be created or changed without approval
5. Voice commands must not execute mutations directly — always create a draft
6. AI-generated content must not reach players or parents without human review
7. Player advancement (`finalize_player_placement()`) must only run when explicitly called by an authorized role
8. No query or command may bypass RLS or use service role in a client-reachable code path
9. Observations must not be published to players without director confirmation
10. A player must not see another player's data under any circumstances

---

## Next Build Order (after Sprint 228)

The following sprints are recommended after the conversational OS foundation is stable:

| Priority | Sprint | Goal |
|---|---|---|
| 1 | Sprint 229 | Player Portal Q&A — expose deterministic Q&A directly in /player with live curriculum data |
| 2 | Sprint 230 | Parent Portal Progress — expose parent-safe progress in /parent with real approved data |
| 3 | Sprint 231 | Director Recap Approval UX — streamline session recap review with one-click approve flow |
| 4 | Sprint 232 | Coach Session Roster — show curriculum level context on active group session page |
| 5 | Sprint 233 | Player Mission History — track and display player-answered missions over time |
| 6 | Sprint 234 | Director Bulk Level Assignment — allow director to assign curriculum levels to multiple players |
| 7 | Sprint 235 | Coach Recap Observation Auto-Fill — pre-fill observation form from structured recap |
| 8 | Sprint 236 | Curriculum Module Player Preview — show player-facing module preview in director panel |
| 9 | Sprint 237 | Parent Communication Draft Queue — allow director to review and send approved parent-safe messages |
| 10 | Sprint 238 | Curriculum Version History — track when a player moved between curriculum levels |
