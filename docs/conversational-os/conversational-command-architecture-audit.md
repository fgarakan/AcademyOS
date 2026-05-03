# Conversational Command Architecture Audit

**Sprint:** 212
**Date:** 2026-05-03
**Status:** Audit complete — no code changes.

---

## 1. Existing command-like systems

### 1a. Voice Notes + Session Recap Structuring

**Files:**
- `src/app/director/sessions/[sessionId]/VoiceCoachRecapInput.tsx` — typed/voice text input
- `src/app/director/sessions/[sessionId]/saveSessionVoiceNoteAction.ts` — saves raw text to `voice_notes`
- `src/app/director/sessions/[sessionId]/structureRecapAction.ts` — rule-based structuring → `proposed_actions`
- `src/app/coach/sessions/[sessionId]/actions.ts` — coach-side recap actions

**Flow:**
```
Coach types recap
→ voice_notes (raw_input, processing_status='pending')
→ "Structure Recap" button
→ structureSessionRecapAction()
→ voice_commands (issuer_role, input_method='typed')
→ proposed_actions (target_module='session_recap_structuring', action_type='other')
→ Director Review Queue /director/review
→ Director approves
```

**Structuring method:** Rule-based only (no external AI). Keyword detection for skills, absence phrases, late phrases. Player matching by first name against session roster.

**Outputs per recap:**
- `detected_players[]` — players mentioned by name
- `attendance_mentions[]` — absent/late signals (confidence: 'medium', requires_review: true)
- `session_actual_draft` — changed-from-plan flag, actual focus keywords
- `player_observation_drafts[]` — per-player observation candidates
- `parent_safe_draft_candidates[]` — draft parent-facing summary per player
- `warnings[]` — always includes "no AI was used" and "requires human review"

### 1b. AI Suggestions (deterministic)

**Files:**
- `src/lib/suggestions/generateAcademySuggestions.ts` — pure function generators
- `src/app/director/ai-suggestions/suggestionActions.ts` — DB fetch + insert + lifecycle

**Generators:**
| Generator | Trigger condition | suggestion_type |
|---|---|---|
| `buildLevelReadinessReviewSuggestions` | `advancement_eligible = true` | `level_readiness_review` |
| `buildReassessmentFollowupSuggestions` | urgency = overdue/due_soon | `coach_note_followup` |
| `buildCurriculumProgressStaleSuggestions` | days_since_update ≥ 60 | `curriculum_gap` |
| `buildNoCurriculumAssignmentSuggestions` | no curriculum level | `curriculum_gap` |
| `buildPrivateLessonPendingSuggestions` | new private lesson request | `private_lesson_opportunity` |
| `buildPlayerFocusMissingSuggestions` | no focus_areas | `player_focus_update` |
| `buildParentSafeSummaryOpportunitySuggestions` | has coaching notes, no student_friendly_summary | `parent_safe_update_draft` |

**Suggestion lifecycle:** `pending` → `accepted`/`denied`/`deferred` → `applied`

### 1c. proposed_actions — current usage map

| target_module | action_type | Created by | Who reviews |
|---|---|---|---|
| `session_recap_structuring` | `other` | coach/director after typing recap | director |
| `priority_recommendation` | `other` | `priorityRecommendationAction` | director |
| `requirement_evidence_link` | `other` | `evidenceRequirementDraftAction` | director |
| `attendance_exception` | `other` | `attendanceExceptionDraftAction` | director |
| `curriculum_override` | `other` | `curriculumOverrideDraft` | director |
| `curriculum_gate_observation` | `other` | `recordGateEvidenceAction` | director |
| `fitness_homework` | `other` | `fitnessHomeworkRecommendationAction` | director |
| `parent_player_fitness_homework` | `other` | `parentPlayerFitnessHomeworkDraftAction` | director |

All current proposed_actions use `action_type = 'other'`. The typed action_types (create_session, modify_session, etc.) from the enum are not yet wired to execution paths.

### 1d. Director Review Queue

**Route:** `/director/review`

Currently handles 5 draft categories:
- Session recap structured drafts
- Priority recommendation drafts
- Evidence requirement link drafts
- Attendance exception drafts
- Curriculum override drafts

Each category shows pending vs approved-ready-to-apply.

---

## 2. proposed_actions schema (from database.types.ts)

**Key fields:**
- `academy_id` — required, RLS enforced
- `proposed_by_id` — authenticated user ID
- `voice_command_id` — FK to voice_commands (required — must create voice_commands row first)
- `action_type` — DB enum: create_session, modify_session, cancel_session, create_template, modify_template, assign_group, create_placement_assessment, move_player_group, schedule_reassessment, adjust_session_intensity, generate_parent_update, flag_player, create_player, create_exercise, other
- `target_module` — string (not enum) — current usage: session_recap_structuring, priority_recommendation, requirement_evidence_link, attendance_exception, curriculum_override, curriculum_gate_observation
- `proposed_payload` — JSON — free-form structured data
- `status` — enum: pending_review, clarification_needed, approved, modified, rejected, executed, failed, expired

**Important:** `voice_command_id` is a required FK. Every proposed_action must have a corresponding `voice_commands` row. The pattern in `structureRecapAction.ts` creates the voice_commands row first with `input_method='typed'`.

---

## 3. Voice command types (spec types only — `voice-command-types.ts`)

**IntentType enum (spec):** create_session, modify_session, cancel_session, duplicate_session, create_template, modify_template, create_placement_assessment, move_player_group, schedule_reassessment, flag_player, update_player_priorities, adjust_intensity, flag_overload, create_program, rebalance_schedule, query_player, query_group, query_schedule, generate_parent_update, other

**Note:** These IntentTypes are spec-only and exist in voice-command-types.ts. They are not in the DB enum. Only `action_type` is enforced at the DB level.

---

## 4. Role/membership patterns

**auth pattern (from AI_BACKEND_RULES.md + existing actions):**
1. `supabase.auth.getUser()` — never trust client-supplied user
2. `profiles.academy_id` — resolve academy from DB
3. `academy_memberships(role, is_active=true)` — verify role
4. Act only for: academy_director, head_coach (most write operations), coach (own session recaps)

**Roles in use:**
| Role | DB value | Access level |
|---|---|---|
| Platform owner | `platform_owner` | Not handled in current app code |
| Director | `academy_director` | All director routes, all proposed_actions, all suggestions |
| Head coach | `head_coach` | Same as director for most operations |
| Coach | `coach` | Own session recaps, attendance exceptions |
| Player | `player` | Stub portal only (`/player`) |
| Parent | `parent` | Stub portal only (`/parent`) |

---

## 5. Parent/player portals — current state

### Parent portal (`/parent/page.tsx`)
- Layout: BottomTabBar + mobile-friendly
- Content: ParentSafeProgressPreview (static empty), coach update (empty state), session consistency (empty state), support at home (static copy), private lesson request (disabled UI), messages (empty state)
- Data: No DB queries. All hardcoded/empty.
- Status: Stub. No auth-scoped data.

### Player portal (`/player/page.tsx`)
- Content: PlayerMissionPreview (static empty), My Skills (empty state), Wins & Streaks (empty state), Messages (empty state), Coming Soon badges
- Data: No DB queries. All hardcoded/empty.
- Status: Stub. No auth-scoped data.

---

## 6. Voice note/coach workspace — current state

**Director session page** (`/director/sessions/[sessionId]/`):
- VoiceCoachRecapInput — typed text → saveSessionVoiceNoteAction → voice_notes
- "Structure Recap" button — structureSessionRecapAction → proposed_actions

**Coach session page** (`/coach/sessions/[sessionId]/`):
- CoachSessionExecutionClient — attendance toggle, live session runner
- Coach can mark attendance, write session observations
- Actions in `actions.ts` — attendance, observations

**VoiceTextInput component** exists at `src/components/voice/VoiceTextInput.tsx` — textarea with submit. No audio capture.

---

## 7. Safe V1 command intents for the command center

These can be implemented without schema changes or external AI:

| intent_type | Safe? | Implementation path |
|---|---|---|
| `show_players_missing_curriculum_level` | ✅ Read-only | Query player_curriculum_states, return list |
| `show_curriculum_gap_suggestions` | ✅ Read-only | Route to /director/ai-suggestions filter |
| `create_session_draft` | ✅ Draft only | proposed_actions with action_type='create_session', status='pending_review' |
| `record_director_note` | ✅ Write | voice_notes or coach_observations (director-scoped) |
| `ask_curriculum_level_requirements` | ✅ Read-only | Query curriculum_levels + curriculum_gates for named level |
| `create_attendance_exception_draft` | ✅ Draft only | attendanceExceptionDraftAction pattern |
| `summarize_curriculum_gaps` | ✅ Read-only | buildNoCurriculumAssignmentSuggestions pattern |
| `unknown` | ✅ Safe fallback | Show parsed intent, no action taken |

---

## 8. Blocked command intents (not safe now)

| intent_type | Blocked reason |
|---|---|
| Execute session automatically | execute_approved_action() only covers 3 of 14 action types |
| Auto-communicate with parents | No parent communication sending built |
| Auto-advance player levels | Violates explicit director approval requirement |
| Create/modify players without approval | Requires director explicit action |
| Generate parent updates automatically | Must go through director review |
| Any intent for coach/player/parent roles that mutates data | RLS + role checks not yet built for those roles |

---

## 9. Data model additions needed for V1 command center

No migration needed for V1. The existing schema supports:
- `voice_commands` (input_method='typed') for recording command input
- `proposed_actions` (action_type='other', target_module='director_command') for structured drafts
- `academy_suggestions` for query-type results

Optional schema for future sprints (not needed now):
- A `command_history` view (can be derived from `voice_commands` + `proposed_actions`)
- A `command_intents` table for persisting parsed intent results

---

## 10. No-code next sprint plan

| Sprint | What to build | Type |
|---|---|---|
| 213 | `/director/command-center` UI — input box, examples, history | UI + read-only |
| 214 | `parseAcademyCommand.ts` — deterministic intent parser | Logic + QA script |
| 215 | Command → proposed_actions server action | Write (draft only) |
| 216 | Coach recap command improvements | UI + draft |
| 217 | Parent-safe response rules doc + helpers | Docs + logic |
| 218 | Player progress Q&A helper | Logic + read-only UI |
| 219 | Curriculum learning module model doc | Docs only |
| 220 | Curriculum learning module UI | UI + read-only |
| 221 | Role-aware chat guardrails | Logic + docs |

---

## 11. Architecture principle confirmation

The existing app correctly implements: **Voice/text creates → proposed_actions/drafts → director approves → system records → (future) system executes.**

No existing code bypasses this. The command center must follow the same pattern:

```
Director types command
→ parseAcademyCommand() → structured intent
→ For query intents: return read-only result
→ For action intents: create proposed_actions row (pending_review)
→ Director sees "what would happen" preview
→ Director clicks "Create Review Draft" → proposed_actions created
→ Shows in /director/review queue
→ Director approves from review queue
→ (future) execute_approved_action() executes
```
