# Atomic Loop Usability Test Plan

**Mega Sprint 3331–3360**
**Date:** 2026-06-20
**Purpose:** Hands-on test plan for all 10 AcademyOS atomic loops. Structural readiness is certified by `src/lib/donna/certification/atomicLoopUsabilityCertification.ts` (**60/60 — 10/10 loops ready**). This document is the manual usability pass.

**How to score each loop**
- **Pass/Fail:** check `[x]` when the loop completes start→finish and data is saved.
- **Bug severity:** Blocker / High / Medium / Low / None.
- **DONNA response quality:** 1 (generic) – 5 (elite COO: direct, grounded, action-oriented).
- **Cognitive load:** 1 (overwhelming) – 5 (one clear next action).

---

## Loop 1 — Academy Setup
**Route:** `/director/onboarding`
**Steps:** 1) Open Onboarding. 2) Pick a setup mode → Begin. 3) Complete each step (interview, programs/groups, curriculum starter, level gates, coaches, players-placement). 4) Confirm progress persists on reload.
**Expected:** Each step saves to the academy profile; DONNA frames the journey; deferred modes are clearly labelled.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 2 — Curriculum Builder
**Route:** `/director/curriculum/builder`
**Steps:** 1) Open builder (director-only). 2) Add/customize a level or content. 3) Submit change → appears in the change queue as a draft. 4) Approve via review.
**Expected:** Edits become **drafts**; nothing changes official curriculum until approved.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 3 — Template Builder
**Route:** `/director/templates/class/create`
**Steps:** 1) Start a new class template. 2) Complete the wizard. 3) Save → `saveClassTemplateDraftFromWizardAction` creates a draft. 4) Confirm it appears.
**Expected:** Template saved as a draft; no overwrite of existing templates.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 4 — Session Creation
**Route:** `/director/sessions/new`
**Steps:** 1) Open New Session. 2) Pick template + coach + date. 3) Create → session + blocks created, audit logged. 4) Open the created session.
**Expected:** Session persists (real write + audit); redirect to the session.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 5 — Coach Assignment
**Route:** `/director/onboarding/coaches-permissions` (and the coach dropdown in Session Creation)
**Steps:** 1) Open coaches-permissions. 2) Add/assign a coach. 3) Save. 4) Confirm the coach appears as assignable in Session Creation.
**Expected:** Coach assignment saved. **Known limitation:** no dedicated reassignment screen — assignment is done here and at session creation.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 6 — Coach Wrap-Up
**Route:** `/coach/sessions/[id]/wrap-up`
**Steps:** 1) Open a session as a coach. 2) Start Wrap-Up. 3) Answer the 6 guided questions (voice or text). 4) Submit for Review → `proposed_actions` (pending_review).
**Expected:** Draft submitted; "nothing is sent until the director reviews it"; nothing applied.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 7 — Player Assessment
**Route:** `/director/players/[id]` (Assessment tab)
**Steps:** 1) Open a player. 2) Quick assessment or assessment studio. 3) Save → evidence/assessment recorded (approval/audit where required).
**Expected:** Assessment persists; no auto level movement.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 8 — Placement / Readiness
**Route:** `/director/placement`
**Steps:** 1) Open Placement. 2) Create draft for a pending player. 3) Approve. 4) Activate → `finalize_player_placement()`.
**Expected:** Staged draft → approve → activate; irreversibility disclosed; only `finalize_player_placement` activates.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 9 — Parent Portal / Parent Update
**Routes:** `/parent` (portal) · `/director/players/[id]` → Initiate Parent Update
**Steps:** 1) As director, Initiate Parent Update for a player → draft to review. 2) As parent, open `/parent`, view IDP, Ask DONNA, request a lesson.
**Expected:** Parent update is a **draft → review** (never auto-sent); parent sees only parent-safe data.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 10 — Director Approvals
**Route:** `/director/review`
**Steps:** 1) Open Approvals. 2) Pick a pending item. 3) Approve / Reject. 4) For applicable types, Apply → writes + audit.
**Expected:** Two-step approve→apply; `assertNotPreviewMode`; status + audit recorded.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

---

## DONNA "say it naturally" pass (every loop)
On each route, open DONNA and try: *"What should I do here?" · "Walk me through this." · "Take me to completion." · "Done." · "What's next?"* — DONNA should answer in-pipeline (Sprint 3271–3330), recommend a next action, and never execute a mutation without approval.

## Roll-up
- Loops passed: `__ / 10`
- Blockers found: `__________`
- Overall readiness: `Test now / Fix first`
