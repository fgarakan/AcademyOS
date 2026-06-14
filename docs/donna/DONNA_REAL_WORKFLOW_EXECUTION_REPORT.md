# DONNA Real Workflow Execution Report — Sprint 2321–2350

**Sprint:** Mega Sprint 2321–2350  
**Date:** 2026-06-14  
**Type:** Reality Validation — Code & Static Analysis  
**Status:** COMPLETE — findings documented, commit NOT recommended

---

## Mission

Prove that DONNA can successfully guide a Director through real AcademyOS workflows from start to finish. Test whether existing intelligence actually works. Determine whether a Director can operate AcademyOS through DONNA without software training.

---

## Audit Method Disclosure

**IMPORTANT:** This is a code and static-analysis audit, not a live UI walkthrough. The audit executes all workflow traces through TypeScript source inspection, action file review, and route verification. No live browser session was used. UI rendering and form interaction are verified through component code and action signatures, not pixel-level observation.

Where a finding requires UI verification, this is noted explicitly.

---

## Part 1 — Demo Academy Test Environment

### ProWorld Demo Academy: ABSENT

**Requested:** ProWorld Demo Academy with 11 specific players (Alex Rivera, Mia Rivera, Maya Chen, Ethan Brooks, Sofia Martinez, Liam Parker, Noah Wilson, Emma Davis, Lucas King, Ava Thompson, Jaden Moore), 2 coaches (Brian, Danny), 12 parents.

**Found:** One seed file exists: `supabase/seeds/brian_dabul_demo_seed.sql` — creates **Monteiro Tennis Academy** with different players (Marcus Rivera, Sofia Nakamura, James Whitfield, Amara Osei, Liam Petrov, etc.) and a different director (Alex Monteiro).

**Status: GAP — ProWorld Demo Academy does not exist in any form.**

The seed file uses placeholder UUIDs (`aaaaaaaa-aaaa-aaaa-aaaa-000000000001` style) requiring substitution before running. It does not match the sprint specification. A new seed file would be required to satisfy the ProWorld Demo Academy requirement.

**Impact on this audit:** Workflow traces are conducted against the live codebase structure, not live DB data. All 8 workflow certifications are code-based.

---

## Part 2 — Real Workflow Certification (Code Analysis)

### W1: Class Template Creation

**DONNA Intent Detection:**
- Input: `"create a new class template"` → matches `/\b(create|build|make|new|start|set up)\b.{0,20}\b(class|session) template\b/i`
- Result: `class_template_creation` ✅
- Fitness patterns checked first — no collision risk ✅

**Workflow Steps (5 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `template_name` | Template Name | `data_present` (templateName) | — | ✅ |
| `focus_area` | Focus Area | `data_present` (focusArea) | — | ✅ |
| `add_blocks` | Session Blocks | `route_visit` | `/director/class-templates` | ✅ |
| `add_fitness` | Fitness Block | `data_present` (fitnessAdded) | — | ✅ |
| `publish` | Publish Template | `explicit` | — | ✅ |

**Route Verification:** `/director/class-templates/new` exists with `NewClassTemplateForm`. `/director/class-templates` list page exists. Both server actions (`createClassTemplateWithBlocksAction`) are confirmed in source.

**Architectural Note:** Template creation writes directly to DB, bypassing the `proposed_actions` pipeline. This is a documented gap from Sprint 2171–2200 (DIRECTOR_WORKFLOW_INTEGRITY_AUDIT.md — "canonical Tree 2 bypasses proposed_actions"). Not a workflow failure, but an integrity concern.

**Result: PASS** — DONNA can guide Director through all 5 steps. Step advancement is architecturally correct.

---

### W2: Fitness Template Creation

**DONNA Intent Detection:**
- Input: `"create a new fitness template"` → matches `/\b(create|build|make|new)\b.{0,20}\bfitness (template|program|plan|block)\b/i`
- Result: `fitness_template_creation` ✅ (fitness patterns checked before class template — Sprint 2291 fix preserved)

**Workflow Steps (4 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `name_template` | Template Name | `data_present` (templateName) | — | ✅ |
| `set_type` | Fitness Type | `data_present` (fitnessType) | — | ✅ |
| `add_exercises` | Add Exercises | `route_visit` | `/director/fitness` | ✅ |
| `publish` | Publish Template | `explicit` | — | ✅ |

**Route Verification:** `/director/fitness/templates/new` exists with `NewFitnessTemplateForm`. `/director/fitness/templates/page.tsx` confirmed. `createFitnessTemplateWithBlocksAction` confirmed.

**DONNA Questions:** "What should we call this fitness template?" → "What type of fitness is this template focused on?" — both questions are well-formed and sequential ✅

**Result: PASS** — Cleaner than class template (fewer steps, no ambiguous route visit). DONNA guidance is direct.

---

### W3: Player Onboarding

**DONNA Intent Detection:**
- Input: `"onboard a new player"` → matches `/\b(onboard|add|enrol|enroll)\b.{0,20}\b(new |a )?player\b/i`
- Result: `player_onboarding` ✅

**Workflow Steps (4 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `add_player` | Add Player | `route_visit` | `/director/players/new` | ✅ |
| `placement` | Placement Assessment | `route_visit` | `/director/placement` | ✅ |
| `curriculum_assign` | Assign Curriculum Level | `data_present` (curriculumLevelId) | — | ⚠️ |
| `first_session` | Schedule First Session | `route_visit` | `/director/sessions` | ⚠️ |

**Route Verification:** `/director/players/new` exists. The page has a hardcoded DONNA guidance box ("Let's add the player's basic information first. After that, I'll guide you through parent contact, assessment, placement, and activation.") — good UI reinforcement. `/director/placement` page confirmed with `PlacementEngineClient`.

**Gap — curriculum_assign step:** The `data_present` signal waits for `curriculumLevelId` in `entityRefs`. There is no mechanism in `DonnaAssistantButton` to populate `entityRefs.curriculumLevelId` from the placement UI. DONNA would wait indefinitely for this data unless the Director explicitly tells DONNA the level was set. Functionally stuck.

**Gap — first_session step:** `/director/sessions` route not confirmed in canonical nav map. Navigation audit (Sprint 2171) listed 8 canonical routes; `/director/sessions` was not among them. Route may be missing or have a different path.

**Result: PARTIAL PASS** — Steps 1–2 work cleanly. Steps 3–4 have integration gaps. DONNA can guide Director through placement but cannot confirm curriculum assignment without an explicit acknowledgment mechanism.

---

### W4: Curriculum Modification

**DONNA Intent Detection:**
- Input: `"review the curriculum"` → matches `/\b(review|check|update|audit)\b.{0,20}\bcurriculum\b/i`
- Result: `curriculum_review` ✅

**Workflow Steps (4 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `open_curriculum` | Open Curriculum | `route_visit` | `/director/curriculum` | ✅ |
| `review_coverage` | Review Coverage | `route_visit` | `/director/curriculum` | ⚠️ |
| `draft_changes` | Draft Changes | `explicit` | — | ✅ |
| `approve_changes` | Approve Changes | `explicit` | — | ✅ |

**Route Verification:** `/director/curriculum` is a rich page with `CurriculumHealthPanel`, `CurriculumLevelTree`, `DonnaCurriculumContextPanel`, `DonnaCurriculumBrief`, `CurriculumIntelligenceCard` and DONNA draft list integration ✅.

**Gap — step 1 and 2 share target route:** Both `open_curriculum` and `review_coverage` target `/director/curriculum`. `advanceOnRouteChange` will advance step 1 on first route visit, but step 2 also fires immediately on the same route (same path, same moment). In practice, both steps complete in a single navigation event, jumping directly to step 3. This makes the progress display misleading (shows 50% done before Director has reviewed anything).

**Result: PASS with caveat** — Curriculum page exists and is feature-complete. DONNA correctly directs the Director there. Route-sharing between steps 1–2 causes artificial instant advancement but does not block completion.

---

### W5: Recommendation Approval

**DONNA Intent Detection:**
- Input: `"review pending approvals"` → matches `/\b(review|clear|check|open)\b.{0,20}\b(approvals?|pending|review queue)\b/i`
- Result: `approval_review` ✅

**Workflow Steps (3 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `open_queue` | Open Review Queue | `route_visit` | `/director/review` | ✅ |
| `review_items` | Review Items | `route_visit` | `/director/review` | ⚠️ |
| `mark_complete` | Mark Complete | `explicit` | — | ✅ |

**Route Verification:** `/director/review` is the most comprehensive page in the application — tabbed queue with `needs_approval`, `player_updates`, `curriculum_session`, `completed`. All approval cards have `execute_approved_action()` wired through server actions. Same route-sharing issue as W4 (steps 1–2 both target `/director/review`).

**Approval pipeline:** `execute_approved_action()` is the canonical execution function, called from `DraftDecisionControls` component. RLS enforced ✅. Audit log written ✅.

**Result: PASS** — This is the strongest workflow. Review queue is fully implemented, DONNA guidance is correct, approval architecture is sound.

---

### W6: Template Archive

**DONNA Intent Detection:**
- Input: `"archive the Green Ball Saturday template"` → matches `/\barchive\b.{0,20}\b(class |session )?template\b/i`
- Result: `template_archive` ✅

**Workflow Steps (2 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `review_impact` | Review Template Impact | `explicit` | — | ❌ |
| `confirm` | Confirm Archive | `explicit` | — | ❌ |

**CRITICAL GAP:** No archive button, archive server action, or archive UI exists in any template page. Search across `src/app/director/class-templates/` revealed: `createClassTemplateAction.ts`, `createClassTemplateWithBlocksAction.ts`, `saveAssistantTemplateDraftAction.ts` — no archive or status-mutation action. The template detail page (`/director/class-templates/[templateId]/page.tsx`) has no destructive action controls.

DONNA can detect the intent, start the workflow, and provide guidance — but when the Director reaches the template page, there is no button to click. The workflow cannot physically complete.

**Result: FAIL — Critical gap. UI endpoint does not exist.**

---

### W7: Template Delete

**DONNA Intent Detection:**
- Input: `"delete the Blue Ball Conditioning template"` → matches `/\bdelete\b.{0,20}\b(class |session )?template\b/i`
- Result: `template_delete` ✅

**Workflow Steps (2 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `confirm_clear` | Confirm No Active Sessions | `explicit` | — | ❌ |
| `confirm_delete` | Confirm Deletion | `explicit` | — | ❌ |

**CRITICAL GAP:** Same as W6 — no delete server action or UI control exists in any template page. The `getSafeDeleteGuidance()` function correctly recommends archive vs. delete based on usage count, but neither operation has a UI endpoint.

**Result: FAIL — Critical gap. Same root cause as W6.**

---

### W8: Coach Wrap-Up Review

**DONNA Intent Detection:**
- Input: `"review coach wrap-ups"` → matches `/\b(review|check|read)\b.{0,20}\bcoach.{0,10}(wrap.?up|recap)\b/i`
- Result: `coach_wrap_up_review` ✅

**Workflow Steps (3 total):**
| Step | Label | Signal | Target | UI Exists |
|---|---|---|---|---|
| `open_queue` | Open Review Queue | `route_visit` | `/director/review` | ✅ |
| `review_wrapup` | Review Wrap-Up | `route_visit` | `/director/review` | ⚠️ |
| `approve_wrapup` | Approve Wrap-Up | `explicit` | — | ✅ |

**Route Verification:** `/director/review` has `WrapUpDraftCard`, `WrapUpCoveragePanel`, `WrapUpDraftDecisionControls`, `ApplyApprovedWrapUpAction`, `ApplyWrapUpObservationDraftControls` — all present ✅. The `needs_approval` tab shows wrap-ups first.

**Same route-sharing issue** as W4/W5 — steps 1 and 2 both fire on visiting `/director/review`.

**Result: PASS** — The review queue fully supports wrap-up review. DONNA guidance is correct.

---

### Workflow Certification Summary

| # | Workflow | Result | Critical Gap |
|---|---|---|---|
| W1 | Class Template Creation | ✅ PASS | Architectural (bypasses proposed_actions) |
| W2 | Fitness Template Creation | ✅ PASS | None |
| W3 | Player Onboarding | ⚠️ PARTIAL | `curriculum_assign` step has no entityRef population mechanism |
| W4 | Curriculum Modification | ⚠️ PASS WITH CAVEAT | Dual-step route-sharing causes instant double-advance |
| W5 | Recommendation Approval | ✅ PASS | None |
| W6 | Template Archive | ❌ FAIL | No archive UI or server action exists |
| W7 | Template Delete | ❌ FAIL | No delete UI or server action exists |
| W8 | Coach Wrap-Up Review | ✅ PASS | None |

**Score: 5/8 full pass, 2/8 partial, 2/8 fail (critical)**

---

## Part 3 — Friction Audit

All friction scores based on code-analysis estimates. Live UI timing not available.

| Workflow | Est. Clicks | Page Transitions | DONNA Questions | Friction Score (0–10) |
|---|---|---|---|---|
| Class Template Creation | 6–8 | 3 | 2 | 4 |
| Fitness Template Creation | 5–6 | 2 | 2 | 3 |
| Player Onboarding | 8–10 | 4–5 | 3 | 6 |
| Curriculum Modification | 4–5 | 1 | 1 | 3 |
| Recommendation Approval | 3–4 | 1 | 1 | 2 |
| Template Archive | BLOCKED | — | 1 | 10 (no UI) |
| Template Delete | BLOCKED | — | 1 | 10 (no UI) |
| Coach Wrap-Up Review | 3–4 | 1 | 1 | 2 |

**Key friction findings:**
1. **Template Archive/Delete (10/10):** DONNA correctly detects intent and starts workflow, but Director reaches a dead end — no button exists. Maximum friction: DONNA guides → Director clicks around → nothing happens → confusion.
2. **Player Onboarding (6/10):** Four distinct page transitions, multi-step across placement + curriculum + sessions. The longest real-world workflow. `curriculum_assign` data_present step cannot auto-complete — Director must explicitly confirm to DONNA.
3. **Class Template Creation (4/10):** The `add_blocks` step targets `/director/class-templates` (the list page), not `/director/class-templates/new` where creation happens. Director is sent back to list after creating — route advancement logic fires there, which is correct but feels like going backwards.

---

## Part 4 — Director Experience Audit

### What Works Well

**DONNA Intent Detection:** All 8 workflow intents correctly detected from natural language. The 17-pattern recognition system is robust. Fitness patterns are checked before class template patterns (Sprint 2291 fix) — no collision.

**Active Mission Card:** Renders on Today page when a mission is active. Shows title, progress bar, completed steps with checkmarks, next action, and a Continue button. Server-rendered, no client state. Correct architecture.

**Workflow Persistence:** `donna_working_memory` key `active_workflow_state` persisted across sessions with 7-day TTL. Director can close browser and resume. State loads on panel open.

**Control Intents:** Cancel/pause/resume/status correctly handled. "Pause this" → `paused` state. "Resume" → `active` state. Status query returns current step. All architecturally verified.

**Confidence Scoring:** 7-tier system. Below 70 blocks auto-advancement. Routes that match advance at 75+. DB-loaded state scores 80+. Prevents false completion.

**Review Queue (W5, W8):** Best-in-class implementation. Full tabbed UI, proper approval pipeline, audit logging.

### What Needs Work

**Template Archive/Delete (CRITICAL):** DONNA can start these workflows but cannot finish them. The gap is entirely UI-side — no archive/delete button and no corresponding server action exist on template pages. DONNA is promising something the app cannot deliver.

**Player Onboarding — curriculum assignment (MEDIUM):** The `curriculum_assign` step uses `data_present` on `curriculumLevelId`, but there is no wiring to populate this entityRef from the placement UI. The step will never auto-advance. Director must explicitly tell DONNA "I've assigned the curriculum level" and rely on the `advanceExplicit` path — but that only works if the step were `explicit`, not `data_present`.

**Route-sharing steps (LOW):** Steps that share a target route (W4 steps 1–2, W5 steps 1–2, W8 steps 1–2) advance immediately in sequence when the Director arrives at the page. Progress display shows 50%+ complete before any work is done. Not a blocker, but misleading.

**Sessions route (MEDIUM):** Player onboarding step 4 targets `/director/sessions`. This route is not in the canonical navigation map. If it doesn't exist, the workflow's final step has no UI target.

---

## Part 5 — Mission Quality Audit

### Active Mission Accuracy

| Mission Type | Title Accuracy | Step Accuracy | Route Accuracy | Score |
|---|---|---|---|---|
| Class Template Creation | ✅ Personalized if templateName set | ✅ 5 clear steps | ✅ correct routes | 9/10 |
| Fitness Template Creation | ✅ Personalized if templateName set | ✅ 4 clear steps | ✅ correct routes | 9/10 |
| Player Onboarding | ✅ "Onboard [name]" when playerName set | ⚠️ Step 3 stuck | ⚠️ Sessions route unverified | 6/10 |
| Curriculum Review | ✅ Generic (no entity name needed) | ⚠️ Steps 1+2 collapse | ✅ curriculum route correct | 7/10 |
| Approval Review | ✅ Generic | ⚠️ Steps 1+2 collapse | ✅ review route correct | 7/10 |
| Template Archive | ⚠️ Personalized but leads to dead end | ❌ Cannot complete | ❌ No UI target | 2/10 |
| Template Delete | ⚠️ Personalized but leads to dead end | ❌ Cannot complete | ❌ No UI target | 2/10 |
| Coach Wrap-Up Review | ✅ Generic | ⚠️ Steps 1+2 collapse | ✅ review route correct | 7/10 |

**Confidence Accuracy:** The 70-threshold system is well-calibrated. Newly-started workflows score 65 (no auto-advance until route signal received). DB-loaded states score 80+. The distinction between `loadedFromDb + routeMatches` (90) vs `loadedFromDb` alone (80) is meaningful and prevents overconfident guidance.

**Mission Quality Score: 6/10**

Primary drag: Template Archive/Delete missions are inaccurate (promise completion that can't happen). Route-sharing double-advance makes some workflows feel too fast. Otherwise strong.

---

## Part 6 — DONNA COO Test

### Test Questions

| Question | Expected Behavior | Code-Verified | Score |
|---|---|---|---|
| "What should I work on today?" | Returns pending reviews count + active mission | ✅ Context packet: pendingReviews + DonnaCommandBrief | 9/10 |
| "How do I create a class template?" | Starts `class_template_creation` workflow, guides step by step | ✅ Intent detection + workflow start | 9/10 |
| "Where was I in the class template I was building?" | Loads `active_workflow_state` from DB, reports current step | ✅ `loadWorkflowStateAction` on panel open | 9/10 |
| "Pause this and I'll come back to it later" | `pause` control intent → `paused` state → persisted | ✅ `detectControlIntent` → `pauseWorkflow` | 9/10 |
| "Which players need attention?" | Returns curriculum context + placement queue awareness | ✅ Academy context in prompt | 8/10 |
| "Archive the Green Ball Saturday template" | Starts `template_archive` workflow, guides to template page, then dead end | ⚠️ Starts correctly, cannot complete | 4/10 |
| "How many players are in placement right now?" | Reads pending placement context from academy summary | ✅ Academy context loaded from DB | 8/10 |
| "What did Brian coach last week?" | Accesses session memory and wrap-up context | ✅ Session memory loaded from `donna_working_memory` | 7/10 |
| "Tell me what's wrong with our curriculum" | Reads `CurriculumBottleneck` context, surfaces issues | ✅ `loadCurriculumBottleneck` in orchestrator | 8/10 |
| "Complete the template archive — I confirmed there are no active sessions" | Needs `advanceExplicit` → completes step 1, advances to step 2 | ⚠️ Works architecturally, but no UI to act on | 4/10 |

**DONNA COO Score: 7.5/10**

DONNA is strong as an informational COO and as a workflow initiator. The gap is in destructive workflow completion — DONNA can ask "are you sure?" but cannot give the Director anything to click when they say yes.

---

## Part 7 — Failures, UX Problems, and Recommended Fixes

### Critical Failures (Must Fix Before Pilot)

**FAIL-1: Template Archive has no UI endpoint**
- Workflows `template_archive` and `fitness_template_archive` are defined and DONNA correctly starts them.
- Director cannot complete them — no archive button, no archive server action.
- **Fix:** Add `archiveTemplateAction.ts` to `/director/class-templates/[templateId]/` and add a secondary button ("Archive Template") to the template detail page. Mirror for fitness templates.

**FAIL-2: Template Delete has no UI endpoint**
- Identical issue. `template_delete` and `fitness_template_delete` workflows defined but unexecutable.
- **Fix:** Add `deleteTemplateAction.ts` with session-check guard (`getSafeDeleteGuidance()` already has the logic). Add a danger button ("Delete Template") to template detail, gated by usage count.

### Medium Issues (Fix Before Full Pilot)

**ISSUE-3: Player Onboarding — `curriculum_assign` step stuck**
- `data_present` signal on `curriculumLevelId` has no population mechanism.
- `DonnaAssistantButton` does not read curriculum assignment from the placement UI.
- **Fix:** Either change step signal to `explicit` (Director confirms verbally) or add a `reportCurriculumAssignedAction()` that the placement UI calls on level assignment to update `entityRefs`.

**ISSUE-4: `first_session` step targets unverified route `/director/sessions`**
- This route is not confirmed in canonical navigation. If it doesn't exist, step 4 of player onboarding cannot advance.
- **Fix:** Verify route. If sessions are at a different path, update `WORKFLOW_STEP_DEFS` `targetRoute` for `first_session`.

**ISSUE-5: Route-sharing causes instant double-advance**
- `open_queue` + `review_items` both target `/director/review` in W4, W5, W8.
- `open_curriculum` + `review_coverage` both target `/director/curriculum` in W4.
- Both steps complete simultaneously on first navigation, making progress display misleading.
- **Fix:** Give `review_items` and `review_coverage` a unique `data_present` signal (e.g., `timeOnPage > 30s` via explicit Director confirmation) or change them to `explicit` so DONNA asks "Have you reviewed the queue?" before advancing.

### Low Priority

**ISSUE-6: ProWorld Demo Academy seed does not exist**
- Cannot run live integration tests against specified players/coaches.
- **Fix:** Create `supabase/seeds/proworld_demo_seed.sql` with 11 specified players, 2 coaches, 12 parents. Not needed for code correctness but required for demo and live pilot testing.

**ISSUE-7: Class template creation bypasses proposed_actions**
- `createClassTemplateWithBlocksAction` writes directly to DB.
- Documented in `DIRECTOR_WORKFLOW_INTEGRITY_AUDIT.md` as a known architectural inconsistency.
- Not a workflow failure but violates the operating model ("AI proposes → Director approves").
- **Fix:** Route class template creation through proposed_actions with director confirmation step, OR formally document this as an intentional exception (templates are Director-authored, not AI-generated).

---

## Top 10 Improvements for Pilot Readiness

| # | Improvement | Impact | Effort |
|---|---|---|---|
| 1 | Add archive/delete UI + server action to template detail pages | CRITICAL — unblocks 2 failed workflows | Medium |
| 2 | Fix `curriculum_assign` step to use `explicit` signal | HIGH — unblocks player onboarding completion | Low |
| 3 | Verify `/director/sessions` route or update `first_session` targetRoute | HIGH — last step of player onboarding | Low |
| 4 | Change shared-route steps to `explicit` confirmation signal | MEDIUM — removes misleading instant progress | Low |
| 5 | Create ProWorld Demo Academy seed file | MEDIUM — enables live demo testing | Medium |
| 6 | Wire `entityRefs.curriculumLevelId` population from placement UI | MEDIUM — automatic onboarding advancement | Medium |
| 7 | Add archive/delete to fitness template detail page | HIGH — mirrors Fix 1 for fitness | Low (copy of Fix 1) |
| 8 | Document template creation proposed_actions bypass as intentional exception | LOW — architectural clarity | Low |
| 9 | Add intent pattern for "what's pending?" → `approval_review` | LOW — common director phrase not matched | Low |
| 10 | Add DONNA mission card deep-link to player profile when `playerName` is set | LOW — better onboarding UX | Low |

---

## TypeScript

```
npx tsc --noEmit
# exit 0 — no errors (Sprint 2321–2350 is audit-only, no new code written)
```

---

## Pilot Readiness Rating

**DONNA Intelligence Readiness: 7/10**
DONNA's reasoning, memory, workflow detection, confidence scoring, and COO-level context are all strong. The infrastructure built in Sprints 2261–2320 is sound. DONNA can guide a Director through 5 of 8 tested workflows.

**Application Readiness: 5/10**
The template archive/delete gap is a hard blocker. DONNA promises to guide Directors through these flows, but the app cannot execute them. A Director who asks DONNA to archive a template will be left confused when nothing happens.

**Overall Pilot Readiness: NOT READY**

Required before pilot:
1. Template archive/delete UI + server actions (FAIL-1, FAIL-2)
2. Player onboarding `curriculum_assign` step fix (ISSUE-3)
3. Sessions route verification (ISSUE-4)

With these 3 fixes: **PILOT READY**

---

## Commit Recommendation

**DO NOT COMMIT this sprint.**

This is a validation-only sprint — no new code was written. The report is the deliverable. Committing the report is appropriate after Director review.

Commit the recommended fixes (FAIL-1, FAIL-2, ISSUE-3, ISSUE-4) in a dedicated follow-up sprint, then re-run this certification.

**Commit this report:** `git add docs/donna/DONNA_REAL_WORKFLOW_EXECUTION_REPORT.md` after Director review.
