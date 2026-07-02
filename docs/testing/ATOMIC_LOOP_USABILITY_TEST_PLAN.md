# Atomic Loop Usability Test Plan

**Mega Sprint 3331–3360** · **Taxonomy reconciled: Sprint 4359 (2026-07-02)**
**Date:** 2026-06-20 (plan) · 2026-07-02 (canonical 10-loop taxonomy)
**Purpose:** Hands-on test plan for all 10 AcademyOS atomic loops. Structural readiness is certified by `src/lib/donna/certification/atomicLoopUsabilityCertification.ts` (**60/60 — 10/10 loops ready**, re-run 2026-07-02). This document is the manual usability pass.

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

## Loop 2 — Curriculum Setup
**Route:** `/director/curriculum/builder`
**Steps:** 1) Open builder (director-only). 2) Add/customize a level or content. 3) Submit change → appears in the change queue as a draft. 4) Approve via review.
**Expected:** Edits become **drafts**; nothing changes official curriculum until approved.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 3 — Class Template Setup
**Route:** `/director/templates/class/create`
**Steps:** 1) Start a new class template. 2) Complete the wizard. 3) Save → `saveClassTemplateDraftFromWizardAction` creates a draft. 4) Confirm it appears.
**Expected:** Template saved as a draft; no overwrite of existing templates.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 4 — Session Creation
**Route:** `/director/sessions/new`
**Steps:** 1) Open New Session. 2) Pick template + coach + date. 3) Create → session + blocks created, audit logged. 4) Open the created session.
**Expected:** Session persists (real write + audit); redirect to the session.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 5 — Coach Assignment & Session Readiness
**Route:** `/director/onboarding/coaches-permissions` (and the coach dropdown in Session Creation)
**Steps:** 1) Open coaches-permissions. 2) Add/assign a coach. 3) Save. 4) Confirm the coach appears as assignable in Session Creation.
**Expected:** Coach assignment saved. **Known limitation:** no dedicated reassignment screen — assignment is done here and at session creation. "Session readiness" is a derived state, not its own route.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 6 — Coach Session Execution
**Route:** `/coach/sessions/[id]`
**Steps:** 1) Open an assigned session as a coach. 2) Work through the blocks (warm-up → main → cool-down), marking each block status (planned / in-progress / completed / skipped). 3) Reload the page. 4) Confirm each block's status persisted.
**Expected:** Block `actual_status` persists to `session_blocks` with an audit log; DONNA gives live/on-court guidance ("what's next in this session"). Coach-direct write — no approval required for execution status.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 7 — Coach Wrap-Up
**Route:** `/coach/sessions/[id]/wrap-up`
**Steps:** 1) Open a session as a coach. 2) Start Wrap-Up. 3) Answer the 6 guided questions (voice or text). 4) Submit for Review → `proposed_actions` (pending_review).
**Expected:** Draft submitted; "nothing is sent until the director reviews it"; nothing applied.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 8 — Player Development & Evidence
**Routes:** `/director/players/[id]` (Assessment + Evidence) · `/director/placement`
**Steps:** 1) Open a player. 2) Quick assessment or assessment studio → save. 3) Record gate evidence where required. 4) For a new/intake player: go to Placement, create draft → approve → activate via `finalize_player_placement()`.
**Expected:** Assessment and evidence persist (approval/audit where required); placement is staged draft → approve → activate with irreversibility disclosed; **no auto level movement** — `finalize_player_placement` is the only activation path.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 9 — Director Review & Approval
**Route:** `/director/review`
**Steps:** 1) Open Approvals. 2) Pick a pending item. 3) Approve / Reject. 4) For applicable types, Apply → writes + audit.
**Expected:** Two-step approve→apply; `assertNotPreviewMode`; status + audit recorded.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

## Loop 10 — Parent & Player-Safe Clarity
**Routes:** `/parent` (portal) · `/player/ask-donna` (player portal) · `/director/players/[id]` → Initiate Parent Update
**Steps:** 1) As director, Initiate Parent Update for a player → draft to review. 2) As parent, open `/parent`, view IDP, Ask DONNA, request a lesson. 3) As player, open `/player/ask-donna` and confirm only player-safe content appears.
**Expected:** Parent update is a **draft → review** (never auto-sent); parent/player portals render only parent/player-safe, approved content — no coach notes, internal scores, or observations.
- Pass/Fail: `[ ]` · Severity: `____` · DONNA: `_/5` · Cognitive load: `_/5` · Notes: `__________`

---

## DONNA "say it naturally" pass (every loop)
On each route, open DONNA and try: *"What should I do here?" · "Walk me through this." · "Take me to completion." · "Done." · "What's next?"* — DONNA should answer in-pipeline (Sprint 3271–3330), recommend a next action, and never execute a mutation without approval.

## Roll-up
- Loops passed: `__ / 10`
- Blockers found: `__________`
- Overall readiness: `Test now / Fix first`
