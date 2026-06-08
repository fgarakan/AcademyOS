# DONNA Workflow Completion Audit
**Sprint:** Mega Sprint 1025–1054
**Date:** 2026-06-08
**Author:** Claude Code (Mega Sprint execution)
**Purpose:** Baseline every DONNA-supported workflow across all execution layers before building the completion block.

---

## Audit scope

Eight workflows. Eight execution layers. Every cell is PASS / PARTIAL / FAIL with a one-line evidence citation.

**Workflows audited:**
1. Academy Setup
2. Curriculum Setup
3. Template Creation
4. Player Creation
5. Coach Creation
6. Assessment Creation
7. Parent Update
8. Review Queue Action

**Execution layers:**
1. **Conversation** — DONNA asks the right questions in the right order
2. **Missing info collection** — DONNA detects when a required field is absent and asks for it
3. **Page navigation** — DONNA navigates the director to the target page
4. **Page state sync** — visible form fields update as DONNA collects answers
5. **Draft creation** — a draft object (in memory or DB) is built from collected answers
6. **Submit/save** — a server action is triggered that persists the draft
7. **Confirmation** — the director explicitly confirms before any mutation occurs
8. **Verification** — the system confirms the created entity exists after save

---

## 1. Workflow score table

| Workflow | Conv | Miss | Nav | Sync | Draft | Submit | Confirm | Verify | Score |
|---|---|---|---|---|---|---|---|---|---|
| Academy Setup | PASS | PASS | PARTIAL | FAIL | FAIL | FAIL | FAIL | FAIL | **2/8** |
| Curriculum Setup | PASS | PASS | PARTIAL | FAIL | FAIL | FAIL | FAIL | FAIL | **2/8** |
| Template Creation | PASS | PASS | PASS | PASS | PARTIAL | PARTIAL | PARTIAL | FAIL | **5.5/8** |
| Player Creation | PASS | PASS | PARTIAL | FAIL | FAIL | FAIL | FAIL | FAIL | **2/8** |
| Coach Creation | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | **0/8** |
| Assessment Creation | PASS | PASS | PARTIAL | FAIL | FAIL | FAIL | FAIL | FAIL | **2/8** |
| Parent Update | PASS | PASS | PARTIAL | FAIL | FAIL | FAIL | FAIL | FAIL | **2/8** |
| Review Queue Action | PARTIAL | PARTIAL | PASS | FAIL | N/A | FAIL | FAIL | FAIL | **1.5/8** |

**Average across workflows:** 17/64 = **27%**

---

## 2. Per-workflow detail

### 2.1 Academy Setup (`academy_setup_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry defined in `guidedCompletionRegistry.ts`; opening message, all 6 required steps, cancel/resume detection |
| Missing info | PASS | All 6 fields have explicit questions and hints; step runner asks them in order |
| Page navigation | PARTIAL | Registry routes to `/director/onboarding` and `/director/onboarding/interview`; onboarding interview page exists but is a wizard with its own step state — not a simple fillable form |
| Page state sync | FAIL | No `onPageStatePatch` listener in `DirectorInterviewAssistant.tsx` or any onboarding page |
| Draft creation | FAIL | `donna:goal-session-completed` dispatched by shell on completion but no onboarding page listens for it |
| Submit/save | FAIL | No server action is triggered from goal session completion; onboarding uses its own wizard submit path |
| Confirmation | FAIL | No "DONNA collected your setup — confirm to save" UI on any page |
| Verification | FAIL | DONNA never confirms "your academy setup is saved" with a post-save check |

**Key gap:** The onboarding page is a full interview wizard (`DirectorInterviewAssistant.tsx`) with its own multi-step state machine. DONNA's goal session and the onboarding wizard collect overlapping information through two completely separate mechanisms. **Duplicate collection path — structural conflict.**

---

### 2.2 Curriculum Setup (`curriculum_builder_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry; level_name, level_goal, required_skills, supporting_drills, assessment_method, parent_player_description |
| Missing info | PASS | All 6 fields have questions and hints |
| Page navigation | PARTIAL | Registry points to `/director/curriculum` and `/director/curriculum/builder`; `/director/curriculum` exists; `/director/curriculum/builder` does not exist as a distinct page |
| Page state sync | FAIL | No `onPageStatePatch` listener on `/director/curriculum` page or any sub-component |
| Draft creation | FAIL | No listener on `donna:goal-session-completed`; no curriculum draft created on completion |
| Submit/save | FAIL | Curriculum server actions exist (`curriculumDraft.ts`, `curriculumSpineAction.ts`) but none are triggered by DONNA session completion |
| Confirmation | FAIL | No "DONNA collected your curriculum level — confirm to save" pattern |
| Verification | FAIL | No post-save DONNA confirmation |

**Key gap:** Field map defined in `donnaPageStateSync.ts` for all 6 curriculum fields, but no page applies those patches.

---

### 2.3 Template Creation (`template_builder_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry; template_purpose, session_duration, session_focus, block_structure, key_drills, target_level |
| Missing info | PASS | All 6 fields with questions and hints |
| Page navigation | PASS | Navigates to `/director/templates`; template create page at `/director/templates/class/create/page.tsx` |
| Page state sync | PASS | `onPageStatePatch` listener wired in create page; handles `template_name`, `level`, `objective`; "Set by DONNA" indicator appears |
| Draft creation | PARTIAL | `saveClassTemplateDraftFromWizardAction` exists; page has submit button; but only 3 of 6 DONNA answers are patched into the form — the other 3 (duration, block_structure, key_drills) are not mapped to the 5-step wizard's native inputs |
| Submit/save | PARTIAL | Wizard submit button calls server action; but it's triggered by the director clicking through the 5-step wizard, not by DONNA completion event; DONNA-collected fields not all pre-loaded into the wizard |
| Confirmation | PARTIAL | Wizard Step 5 is a review step; director can see and confirm; but DONNA answers are only partially visible in the review |
| Verification | FAIL | No DONNA message confirms "your template was saved" post-submit |

**Key gap:** DONNA collects 6 fields, but the wizard-based template page has its own 5-step flow. The two systems are only weakly coupled — 3 DONNA fields patch into the form, but the director still navigates through the wizard independently. True end-to-end completion requires DONNA to drive the form fully or the wizard to collapse on DONNA completion.

---

### 2.4 Player Creation (`player_onboarding_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry; player_name, player_age, recommended_level, assigned_coach, assigned_group, parent_contact |
| Missing info | PASS | All 6 fields with questions and hints |
| Page navigation | PARTIAL | Registry routes to `/director/players`; a new player form exists at `/director/players/new/`; but DONNA navigates to the list page, not the create form |
| Page state sync | FAIL | `NewPlayerForm.tsx` has no `onPageStatePatch` listener; field map defined in `donnaPageStateSync.ts` but nothing applies it |
| Draft creation | FAIL | No draft created from goal session answers |
| Submit/save | FAIL | `createPlayerAction.ts` exists and is production-ready; not triggered by DONNA |
| Confirmation | FAIL | No DONNA confirmation step before player creation |
| Verification | FAIL | No DONNA "player created" confirmation |

**Structural gap:** `createPlayerAction` requires `first_name` + `last_name` separately; DONNA collects `player_name` (full name). Name must be split on the page before calling the action. Also: `createPlayerAction` does not accept level, coach, or group — those are set in a subsequent onboarding flow at `/director/players/[id]/onboard/`. DONNA workflow scope covers only the player creation step; placement and group assignment are separate server-side actions.

---

### 2.5 Coach Creation

| Layer | Status | Evidence |
|---|---|---|
| Conversation | FAIL | No `coach_creation_completion` workflow in `guidedCompletionRegistry.ts` |
| Missing info | FAIL | Not defined |
| Page navigation | FAIL | Not defined |
| Page state sync | FAIL | Not defined |
| Draft creation | FAIL | Not defined |
| Submit/save | FAIL | `inviteCoachAction.ts` exists (email + role only); not reachable via DONNA |
| Confirmation | FAIL | Not defined |
| Verification | FAIL | Not defined |

**Structural issue:** The coach "creation" model in the app is an **invite by email**, not a full profile creation. The `inviteCoachAction` links an existing user account to an academy. It requires only `email` and `role` — no name collection, no profile fields. A DONNA-guided flow would collect: email, role, name (display-only), group assignment. The minimal version is just email + role; DONNA could guide that in 2 steps. A more complete coach onboarding would require a separate profile creation path that does not currently exist.

**Decision required:** Build a 2-step DONNA coach invite (email + role), or defer until full coach profile creation is built.

---

### 2.6 Assessment Creation (`assessment_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 6-step registry; player_name, assessment_domain, observation, performance_rating, recommendation, parent_visibility |
| Missing info | PASS | All 6 fields with questions and hints |
| Page navigation | PARTIAL | Routes to `/director/players` or `/director/players/[playerId]`; player profile page exists; assessment form (`AssessmentStudioForm.tsx`) exists as a tab component |
| Page state sync | FAIL | `AssessmentStudioForm.tsx` has no `onPageStatePatch` listener |
| Draft creation | FAIL | No draft created from goal session answers |
| Submit/save | FAIL | `assessmentStudioAction.ts` and `quickAssessmentAction.ts` exist; neither triggered by DONNA |
| Confirmation | FAIL | No DONNA confirm step before assessment save |
| Verification | FAIL | No DONNA post-save confirmation |

**Structural gap:** DONNA collects `player_name` (text), but the assessment form operates on a player ID. Entity ID resolution (player name → player_id from `players` table) is required. Not built.

---

### 2.7 Parent Update (`parent_update_completion`)

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PASS | 5-step registry; player_name, main_message, positive_progress, home_support, internal_flag |
| Missing info | PASS | All 5 fields with questions and hints |
| Page navigation | PARTIAL | Routes to `/director/players` or `/director/review`; no dedicated parent update create form |
| Page state sync | FAIL | No `onPageStatePatch` listener on any relevant page |
| Draft creation | FAIL | No draft created from session answers |
| Submit/save | FAIL | `initiateParentUpdateAction.ts` exists; not triggered by DONNA |
| Confirmation | FAIL | No DONNA confirm step |
| Verification | FAIL | No post-save DONNA confirmation |

**Structural gap:** Parent update flow requires a player ID to target. DONNA collects `player_name` (text). Same entity resolution gap as assessment. Additionally, the `initiateParentUpdateAction` is on the player profile page — no standalone "create parent update" page exists.

---

### 2.8 Review Queue Action

| Layer | Status | Evidence |
|---|---|---|
| Conversation | PARTIAL | Guided review intent detection (`detectGuidedReviewIntent`) exists in `DonnaVoiceReadyShell.tsx` — a separate system from the goal session registry |
| Missing info | PARTIAL | Guided review asks for player name and review type; but this is inline shell logic, not a registry workflow |
| Page navigation | PASS | Routes to `/director/review` which exists and is fully built |
| Page state sync | FAIL | No `onPageStatePatch` listener on the review page |
| Draft creation | N/A | Review queue items are existing proposed_actions rows — not created by DONNA |
| Submit/save | FAIL | Approval/rejection actions on review items exist (`proposed-action-validator.ts`); not triggerable via DONNA conversation |
| Confirmation | FAIL | No DONNA-driven approval confirmation path |
| Verification | FAIL | No DONNA post-approval confirmation |

**Architecture note:** The review queue is a fundamentally different model from the creation workflows. It operates on existing `proposed_actions` rows rather than creating new entities. A DONNA-guided review flow would: (a) surface the next pending item, (b) explain what it is, (c) ask "approve or reject?", (d) execute the decision. This requires `execute_approved_action()` to be callable from the DONNA surface — which is explicitly an architecture red line requiring explicit sprint authorization.

---

## 3. Shared blockers

| # | Blocker | Workflows affected | Impact |
|---|---|---|---|
| B1 | **No `donna:goal-session-completed` listener on any page** | All 7 creation workflows | `dispatchGoalSessionCompleted` fires in DonnaVoiceReadyShell but zero pages consume it. No server action is ever triggered from DONNA session completion. |
| B2 | **Entity ID resolution not built** | Player, Assessment, Parent Update | DONNA collects entity names as text; form pages need IDs. No name→ID resolver exists for player, coach, or group lookup. |
| B3 | **Player name field split required** | Player Creation | `createPlayerAction` requires `first_name` + `last_name` separately; DONNA collects `player_name` (full name). A splitting step is needed at the page layer. |
| B4 | **Coach creation has no registry entry** | Coach Creation | No `coach_creation_completion` workflow defined. The coach invite model (email + role only) is structurally different from the profile-collection model other workflows use. |
| B5 | **Template wizard not fully DONNA-driven** | Template Creation | Only 3/6 DONNA answers patch into the template create wizard. The other 3 fields require manual director input through the wizard. |
| B6 | **No post-save DONNA verification** | All workflows | DONNA never confirms "your [entity] was created." The completion event is dispatched but has no feedback path back to the DONNA message stream. |
| B7 | **Academy setup has a duplicate collection system** | Academy Setup | `DirectorInterviewAssistant.tsx` is a full wizard collecting similar fields. Running DONNA goal session alongside it creates two conflicting collection paths. |
| B8 | **Assessment form operates on player ID, not name** | Assessment | `AssessmentStudioForm` requires the player profile page to be open (player ID in URL). DONNA's flow navigates to the players list, not to a specific player. |

---

## 4. Duplicate systems

| Pair | Files | Risk |
|---|---|---|
| `guidedCompletionSessionMemory.ts` (4h TTL) + `donnaGoalCompletionModel.ts` (6h TTL) | Both in `src/lib/donna/` | Two session stores for DONNA workflow state; TTLs differ; both can hold answers for the same workflow simultaneously |
| Goal session system + guided review system | `guidedCompletionRegistry.ts` + inline `detectGuidedReviewIntent` in `DonnaVoiceReadyShell.tsx` | Two separate multi-turn conversation systems; different trigger detection, different answer storage, different completion models |
| Template DONNA collection + `TemplateDonnaPanel` | `guidedCompletionRegistry.ts` `template_builder_completion` + `TemplateDonnaPanel.tsx` | Two DONNA-driven template creation paths on the same page; risk of conflicting state |
| 5 intent classification systems | `donnaIntentEngine`, `donnaIntentClassifier`, `donnaGlobalIntentRouter`, `donnaIntentRouterV1`, inline matchers in `DonnaVoiceReadyShell.tsx` | Different inputs produce different routing; ordering matters; not consolidated |

---

## 5. Highest ROI workflow order

Ranked by: (a) director usage frequency, (b) infrastructure already in place, (c) structural gaps to close.

| Rank | Workflow | Rationale |
|---|---|---|
| 1 | **Player Creation** | Highest-frequency post-setup action. Registry complete. Field maps complete. Server action (`createPlayerAction`) production-ready. One gap: name split + `onPageStatePatch` listener on `/director/players/new/`. Execution engine + listener = full pipeline. |
| 2 | **Template Creation (complete)** | 5.5/8 already working. Only gaps: (a) wire all 6 fields into the form, (b) trigger save on DONNA completion event, (c) add verification. Incremental work on existing wiring. |
| 3 | **Assessment Creation** | Registry complete. Field maps complete. `assessmentStudioAction.ts` exists. Blocker: entity ID resolution (player name → ID). Solvable with a lookup on the player profile page. |
| 4 | **Parent Update** | Registry complete. Field maps complete. `initiateParentUpdateAction.ts` exists. Same entity resolution blocker. Needs a dedicated create page or integration with the player profile page. |
| 5 | **Curriculum Setup** | Registry complete. Field maps complete. Curriculum actions exist. No target page with a fillable form — curriculum is read-only in the UI. Needs a dedicated curriculum level creation form. |
| 6 | **Academy Setup** | One-time flow. Overlaps with existing interview wizard. Deconfliction design required before wiring. |
| 7 | **Coach Creation** | No registry entry. Needs architecture decision (invite-only vs. full profile creation). Build after player creation pattern is established. |
| 8 | **Review Queue Action** | Fundamentally different model. Requires `execute_approved_action()` callable from DONNA surface — an architecture red line. Scope separately from creation workflows. |

---

## 6. Common execution architecture recommendation

All 7 creation workflows share an identical post-session gap:

```
goal_session_complete (dispatched by shell)
    → NO PAGE LISTENS
    → NO DRAFT BUILT
    → NO SAVE TRIGGERED
    → NO CONFIRMATION SHOWN
    → NO VERIFICATION RETURNED
```

The fix is a single shared execution layer:

### Proposed canonical lifecycle

```
1. Goal Session Q&A loop          ← already works (6/6 workflows)
2. Page state sync (per answer)   ← already works (1/6 workflows)
3. goal_session_complete event    ← already dispatched; not consumed
4. WorkflowExecutionPlan built    ← to build
5. Director confirmation UI       ← to build (per page)
6. Server action called           ← server actions exist for most workflows
7. WorkflowVerificationResult     ← to build
8. DONNA completion summary       ← to build
```

### Key design rules for the execution engine

- **DONNA never mutates directly.** The engine builds a plan and displays it. The director clicks confirm.
- **Server actions perform all mutations.** The engine holds no DB logic.
- **Every plan is verifiable.** After save, the engine checks that the entity exists.
- **Pages own their form state.** The engine passes answers as a payload; the page reconciles them with its native form.
- **Completion summary feeds back to DONNA.** The shell receives a `WorkflowCompletionSummary` and renders it as a DONNA message.

### Files to create

```
src/lib/donna/workflows/donnaWorkflowExecutionEngine.ts
  — WorkflowExecutionPlan, WorkflowDraftPayload, WorkflowValidationResult,
    WorkflowSubmitResult, WorkflowVerificationResult, WorkflowCompletionSummary
```

### Files to wire per workflow (pages)

```
/director/players/new/page.tsx         → onPageStatePatch + goal-session-completed listener
/director/templates/class/create/      → extend existing listener to all 6 fields + completion
/director/players/[id]/_components/AssessmentStudioForm.tsx → listener + entity resolution
/director/review or /director/players/[id] → parent update listener + entity resolution
/director/curriculum                   → new curriculum level create form
/director/onboarding                   → deconflict with existing wizard
```

---

## 7. Next sprint recommendation

### Sprint 1055–1084 — DONNA Workflow Execution Engine V1

**Goal:** Create one canonical execution layer (`donnaWorkflowExecutionEngine.ts`) that defines the types and lifecycle for all workflows. No page wiring in this sprint — types only.

**Why first:** Every page-level sprint after this will depend on `WorkflowExecutionPlan`, `WorkflowDraftPayload`, and `WorkflowCompletionSummary`. Building the engine first prevents each page sprint from inventing its own types.

**Expected impact:** No score change (engine is pure TypeScript — no UI). Unblocks all subsequent page wiring sprints.

**Then:** Sprint 1085–1114 — Player Creation page wiring (first workflow to reach full 8/8).

---

## 8. Audit methodology

- **Conversation layer:** Confirmed by reading `guidedCompletionRegistry.ts` — step definitions, trigger phrases, required fields.
- **Missing info layer:** Confirmed by step `question` and `hint` fields — all required steps have explicit questions.
- **Page navigation layer:** Confirmed by checking `pageRoutes` against actual `src/app/director/` directory structure.
- **Page state sync layer:** Confirmed by `grep -rn "onPageStatePatch"` across `src/app` — only 1 result.
- **Draft creation layer:** Confirmed by `grep -rn "donna:goal-session-completed"` — event dispatched but not consumed anywhere.
- **Submit/save layer:** Confirmed by reading shell code around `goal_session_complete`; no server action call follows.
- **Confirmation layer:** Confirmed by absence of any "DONNA draft ready — confirm to save" UI pattern in any page.
- **Verification layer:** Confirmed by absence of any `WorkflowVerificationResult` type or post-save DONNA message.

All findings are based on static code analysis. No runtime testing performed.
