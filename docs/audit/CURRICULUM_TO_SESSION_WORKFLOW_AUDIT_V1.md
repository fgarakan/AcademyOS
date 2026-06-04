# Curriculum → Session Workflow Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Audit the handoff from curriculum through templates to sessions, coach delivery, and back to evidence.

---

## The Chain

```
Curriculum Level (curriculum_levels)
↓ [manual: director assigns template to level]
Class Template (templates + template_blocks)
↓ [migration 045: templates.curriculum_level_id — PENDING]
↓ [migration 062: curriculum_class_template_blocks — PENDING]
Session Plan (sessions + session_blocks)
↓ [generateSessionFromTemplateAction]
Coach Delivery (CoachSessionExecutionClient)
↓ [block status: completed / modified / skipped]
Attendance (session_attendance)
↓ [AttendanceMarkingForm]
Coach Recap (voice_notes)
↓ [CoachWrapUpDrawer — 6-question guided flow]
Coach Observations (proposed_actions: wrap_up_observations)
↓ [WrapUpObservationDraftCard → director approval]
Evidence (player_evidence_records + player_requirement_progress)
↓ [levelReadinessEngine + developmentPrioritiesEngine]
Director Decision (level advancement / reassessment)
↓ [finalize_player_placement() or explicit level change]
```

---

## 1. Curriculum → Template Connection

### How curriculum should inform templates

**Designed connection:**
- `templates.curriculum_level_id` links a class template to a specific curriculum level
- `curriculum_class_template_blocks` junction table links each template block to curriculum content items and drills
- This means: when a coach runs a session generated from Template X, they see curriculum-aligned content per block

**Current reality:**
- `templates.curriculum_level_id` column requires **migration 045** (pending live DB)
- `curriculum_class_template_blocks` junction requires **migration 062** (pending live DB)
- Until both are applied: templates exist as standalone objects with no curriculum connection
- A director assigning a curriculum level to a template sees: "Curriculum source persistence is not enabled yet — migration 045 pending"
- A coach running a session sees: no curriculum content in their blocks

**What is connected today (without pending migrations):**
- Template → session_blocks (works, no migration needed)
- Session blocks → `template_block_exercises` (works after migration 056 is applied)

**Verdict: Curriculum → Template connection is broken in the live DB.**

---

### Class Templates vs Fitness Templates

| Type | Curriculum connection | Purpose |
|---|---|---|
| Class template | Designed to connect to curriculum level via `curriculum_level_id` | Tennis skill sessions |
| Fitness template | Standalone — connects to `exercises` table | Physical conditioning |

The two template types serve different purposes and are correctly separated. However, the `/director/templates` hub and the `/director/class-templates` route both exist for class templates — two routes for the same purpose.

---

## 2. Template → Session Plan

### How sessions are created

**Current flow:**
1. Director navigates to `/director/sessions/new`
2. Fills `SessionFromTemplateForm`: selects template, date, coach, group, scheduled time
3. Submits → `generateSessionFromTemplateAction`
4. Action creates: `sessions` row + `session_blocks` rows (copied from `template_blocks`)
5. Returns `sessionId`

**What generates correctly:**
- Session metadata (name, date, coach, group, status = 'planned')
- Session blocks (name, order, type, duration from template)

**What doesn't generate (pending migrations):**
- `session_block_exercises` — INSERT fails with RLS violation until migration 056 applied
- Curriculum content per block — requires migrations 045 + 062

**Verdict: Session creation works structurally; curriculum context and exercises are absent from live sessions.**

---

## 3. Session Plan → Coach Delivery

### What the coach sees

**Coach session view:** `/coach/sessions/[sessionId]`
- Session header (name, date, status, coach)
- Block execution list: each block with name, type, duration
- `CoachSessionCurriculumPanel` — shows curriculum content from `curriculum_class_template_blocks` if available
- `CoachSessionFocusCard` — shows the session's development focus (if `session_focus_tag` is set)
- `CoachSessionGapBriefPanel` — curriculum gap signals for the session's group

**What the coach does NOT see (currently):**
- Actual curriculum drills and content items per block (requires migrations 045 + 062)
- The curriculum level this session is targeting (template-level connection is broken)
- Which gates the session content helps players progress toward

**Execution tracking:**
- Coach taps each block to mark it: completed / modified / skipped
- Status stored in **localStorage** only — NOT persisted to `session_blocks` (known limitation, Sprint 48)
- After session: wrap-up drawer reads block status from localStorage

**Verdict: Coach can see the session structure but not the curriculum context behind it. Block execution is tracked but not persisted to the DB.**

---

## 4. Coach Delivery → Attendance

### Attendance marking

**Flow:**
- `AttendanceMarkingForm` in the session page
- Coach marks each roster player: present / absent / late / excused
- Saves to `session_attendance` table immediately (does not wait for wrap-up)
- Director can add attendance exceptions via `AttendanceExceptionDraftPanel`

**What works:**
- Attendance data is correctly stored in `session_attendance`
- Attendance exceptions flow through `proposed_actions` → director review
- Exposure tracking (`exposureTracking.ts`) can derive which players were likely exposed to which blocks from attendance + block status

**What doesn't work:**
- Block execution status is in localStorage — exposure tracking uses available data but cannot confirm block-level execution if localStorage was cleared
- "Late" attendance doesn't record how late — coach observation is needed to add context

**Verdict: Attendance tracking is functional. Attendance → exposure inference is probabilistic (not confirmed).**

---

## 5. Coach Delivery → Recap

### The wrap-up flow

**`CoachWrapUpDrawer` (guided 6-question flow):**
1. Q1: Was anyone missing or added? (attendance exception note)
2. Q2: Which blocks were completed / modified / skipped?
3. Q3: What stood out? (general observation)
4. Q4: Any individual player notes? (triggers player observation creation)
5. Q5: What was the group's energy/focus?
6. Q6: Will you change anything next time?

**Three things saved from wrap-up:**
1. Raw voice_note recap → `voice_notes` table
2. Structured draft → `proposed_actions` (target_module: session_wrap_up_v1)
3. Player observations → `proposed_actions` (target_module: wrap_up_observation_v1)

**What is correctly connected:**
- Structured wrap-up → director review queue → StructuredDraftCard → approve → `sessions.session_notes` updated
- Player observations → director review → WrapUpObservationDraftCard → approve → recorded

**What is disconnected:**
- Wrap-up block completion data ≠ block execution status (localStorage vs DB — two sources that don't reconcile)
- Coach observations have a `tags` array but tagging is not guided during wrap-up — coaches don't systematically tag observations
- Wrap-up approval updates `sessions.session_notes` (text field) — no structured `session_actuals` table yet

**Known issue: Two recap UIs**
- "Quick Note" (CoachRecapCommandPanel) and "Coach Wrap-Up" (guided drawer) both save to `voice_notes`
- A coach using both creates two voice_note records — review queue shows both, creating redundancy

**Verdict: Wrap-up flow is well-designed but creates unstructured data. Block completion, observation tagging, and evidence linking are all manual or missing.**

---

## 6. Coach Recap → Evidence

### How wrap-up becomes evidence

**Current evidence pipeline:**

| Source | Evidence type | Status |
|---|---|---|
| Coach observation (from wrap-up) | `coach_observation` | Proposed action → director approval → recorded |
| Session attendance | `session_attendance` | Written directly to table |
| Placement decision | `placement_decision` | Written via `finalize_player_placement()` |
| Assessment score | `assessment_score` | Via assessment studio draft → approval |

**What's missing:**
- `player_evidence_records` table requires migration 083 to be confirmed applied
- Coach observations from wrap-up don't automatically populate `player_evidence_records` — there's a `playerEvidenceWriter.ts` but unclear if it's wired to the wrap-up approval path
- The `exposureTracking.ts` module derives exposure candidates but never writes them as evidence
- Session block completion (which drills were run) is not linked to curriculum content items — no "player was exposed to backhand drill X on date Y" evidence record is created

**Evidence → Level Readiness:**
- `levelReadinessEngine.ts` requires evidence records from multiple categories (skill, competition, movement, mental_performance, behavior)
- A director trying to use DONNA's readiness assessment for a player needs 5+ evidence records across 5 categories
- With current data collection (primarily attendance + coach observations), readiness assessments are likely `insufficient_evidence` for most players

**Verdict: Evidence collection pipeline exists in the library layer but the connective tissue between recap → evidence records is incomplete or requires pending migrations.**

---

## 7. Evidence → Player Progress → Director Decision

### Level advancement flow

**What should happen:**
1. Evidence accumulates → `levelReadinessEngine` computes `ReadinessStatus`
2. DONNA surfaces "Player X is ready for review"
3. Director reviews evidence + DONNA explanation
4. Director decides: advance level or schedule reassessment
5. `finalize_player_placement()` (the only path to activate a player) or explicit curriculum level change via `CurriculumLevelPickerCard`

**Current state:**
- `CurriculumLevelPickerCard` on player profile → Skill Path tab allows director to change level directly
- `player_curriculum_states` is updated when a director changes the level
- No automated advancement — all level changes are explicit director decisions

**What's missing:**
- `levelReadinessEngine` output is not surfaced on the player profile as a "This player is ready for review" signal
- The advancement recommendation from evidence is disconnected from the Skill Path tab where the director would act on it
- No DONNA brief on the player profile: "Evidence suggests [player] is close to level advancement. 3 gate requirements met, 2 remaining."

**Verdict: Level advancement is correctly director-gated. But the evidence → readiness signal → director decision path has no UI surface.**

---

## Summary: What Is Connected vs Disconnected

| Connection | Status | Blocking issue |
|---|---|---|
| Curriculum level → template | BROKEN | Migrations 045, 062 pending |
| Template → session blocks | Working | — |
| Session blocks → exercises | BROKEN | Migration 056 pending |
| Session blocks → curriculum content | BROKEN | Migrations 045, 062 pending |
| Coach execution → block status | PARTIAL | localStorage only, not persisted to DB |
| Attendance → session_attendance | Working | — |
| Wrap-up → voice_notes | Working | — |
| Wrap-up → structured draft → review | Working | — |
| Wrap-up → player observations → review | Working | — |
| Observations → player_evidence_records | UNCLEAR | playerEvidenceWriter.ts exists, wiring unclear |
| Evidence → level readiness signal | PARTIAL | Requires evidence records + migrations 041-044 |
| Readiness signal → director action | MISSING | No UI surface on player profile |
| Director action → level change | Working | CurriculumLevelPickerCard |
| Level change → IDP update | Working | IDP reads current level |
| IDP → parent/player portal | Working | buildRoleSpecificIdpView() |

**The chain breaks at 4 critical points:**
1. Curriculum → Template (migrations 045, 062)
2. Block execution → DB (localStorage gap)
3. Wrap-up observations → Evidence records (wiring unclear)
4. Evidence → Readiness signal → Director UI (no UI surface)

---

## What Should Be Automated vs What Requires Director Approval

| Action | Automation level |
|---|---|
| Session creation from template | Manual (director initiates) |
| Block execution tracking | Auto-tracked locally; SHOULD auto-persist to DB |
| Attendance marking | Manual (coach) |
| Evidence accumulation | Auto (from various sources) |
| Readiness signal computation | Auto (deterministic engine) |
| Surfacing readiness signal to director | MISSING — should be automatic |
| Level advancement decision | ALWAYS MANUAL — director only |
| Parent update generation | Auto-draft → director approval |
| Academy health calculation | Auto (derived from stored data) |
