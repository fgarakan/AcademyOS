# Templates Architecture — Decision Record (ADR) V1

**Status:** Proposed — pre-implementation. This is the permanent Templates Architecture Decision Record. No code has been written.
**Date:** 2026-06-23
**Scope:** Read-only architecture pass across Class and Fitness template stacks (pages, draft pipeline, completion contract, DONNA sidebar, page-state-patch mechanism, route trees).
**Supersedes:** the original Mega Sprint 3631–3660 "Templates Workspace V1" single-type plan (retire `TemplateDraftPanel`). That plan is correct but is now reframed as **Phase A** of this ADR.
**Decision owner:** Director (farshadgarakani@proton.me).

---

## 1. Executive Summary

The Class and Fitness template stacks are **~85% the same system**, and the parts that matter most for safety — the **draft pipeline, the completion contract, the page-state-patch mechanism, and the DONNA preparation engine — are already unified**. The remaining duplication is concentrated in three places:

1. **Two ~1,000-line create-wizard pages** (`templates/class/create`, `templates/fitness/create`) that are identical except for their form body.
2. **Two near-identical wizard save-actions** (`saveClassTemplateDraftFromWizardAction`, `saveFitnessTemplateDraftFromWizardAction`) that differ only in how they shape the draft JSONB.
3. **A non-compliant, class-only sidebar editor** (`TemplateDraftPanel`) plus a parallel fitness guided-task save path — both letting creation/completion happen *in the DONNA sidebar* instead of on the page.

A **fourth, larger** duplication exists at the routing layer: **two route trees per type**, split by lifecycle — Tree B (`/director/templates/{type}/*`) owns *create + list + read-only detail*, while Tree A (`/director/class-templates/*`, `/director/fitness/templates/*`) owns the *rich editors* (block pickers, lesson-plan generation, session generation) on the live tables.

**Decision:** Adopt one **shared executive Template Workspace framework** (`TemplateWorkspaceShell` + per-type `TemplateKind` config + type-specific form bodies), unify the save path and completion on the page, retire the sidebar editors, and converge on the canonical `/director/templates/{type}/*` route tree with legacy routes as redirects. Implement in three independently-shippable phases (A → B → C), additive-first and reversible.

**Why now:** This is the highest-leverage V1 product work for the Brian Dabul pilot — it makes the Templates experience premium, low-cognitive-load, and Director-first, *and* eliminates duplicate architecture before more is built on top of it. (The P0 curriculum RLS fix remains the highest-priority **production-security** task and is deferred per the active build target; it is not a pilot blocker.)

---

## 2. Canonical Templates Architecture

> **One law:** Templates are **created, edited, saved, and completed on the page.** DONNA **prepares** drafts and **navigates** to the page. The sidebar **never** owns creation or completion. (Direct application of `docs/EXECUTIVE_WORKSPACE_STANDARD.md` §0/§2/§7.)

```
                       ┌─────────────────────────────────────────────┐
                       │            TemplateWorkspaceShell             │  (shared, page-owned)
                       │  step state · progress bar · breadcrumb ·     │
                       │  header · DONNA banner+handoff · save state   │
                       │  machine · review/draft-safety · DONNA rail   │
                       └───────────────┬───────────────┬───────────────┘
                                       │               │
                          TemplateKind(class)   TemplateKind(fitness)   (config, declarative)
                                       │               │
                            renderStep / form     renderStep / form     (type-specific bodies)
                                       │               │
                       ┌───────────────┴───────────────┴───────────────┐
                       │     ONE Draft Pipeline (templateDraftAction)    │  (already shared)
                       │     saveTemplateDraftFromWizardAction(type, …)  │
                       └───────────────────────┬─────────────────────────┘
                                               │
                       ┌───────────────────────┴─────────────────────────┐
                       │   ONE Completion Contract: template_review_requests│ (already shared)
                       │   request_type=create/update · status=pending ·    │
                       │   director/head_coach review → approve → apply      │
                       └───────────────────────────────────────────────────┘

   DONNA preparation (shared): donnaWorkflowExecutionEngine → page-state patches
   (donnaPageSyncEvents + donnaPageStateSync) → TemplateWorkspaceShell consumes patches
   → page completes. TemplateDonnaPanel is the single right-rail for all template modes.
```

**Already-unified spine (do not rebuild):** draft pipeline · completion contract · page-state-patch mechanism · DONNA workflow engine · `TemplateDonnaPanel`.
**To unify:** the wizard shell, the two save-action wrappers, the sidebar contract, and the route trees.

---

## 3. Permanent Template Object Model

Two storage tiers, intentionally separate:

### Tier 1 — Draft / review (creation + change proposals)
- **Table:** `template_review_requests` (migration 067).
- **Columns:** `academy_id`, `template_id` (null for new), `template_draft` (JSONB snapshot), `request_type` (`create_template` | `update_template`), `status` (`pending` → director decision), `requested_by`.
- **`template_draft` JSONB (canonical shape, both types):**
  `template_type` (`class_template` | `fitness_template`), `name`, `description`, `total_duration_min`, `curriculum_stage_key`, `curriculum_level_key`, `curriculum_source_label`, `template_goal`, `pathway_focus`, `tags[]`, `blocks[]`, `submitted_at`, `submitted_by_role`, plus type-specific keys (e.g. `fitness_load`).
  `blocks[]` element: `{ type, name, durationMin, exercises?: [{ label, setsRepsDuration?, coachingCue? }] }`.

### Tier 2 — Live template (post-approval, executable)
- **Tables:** `templates` (incl. `curriculum_level_id`, confirmed live), `template_blocks`, `template_block_exercises` (RLS live). **Red line:** `template_blocks` and `session_blocks` are **always separate tables — never merged** (`docs/LOCKED_MODULES.md`).
- Edited today via Tree A (`ClassTemplateBuilderStepper`, `FitnessBuilderStepper`) and consumed by session generation (`/director/sessions/*`).

### Invariants (permanent)
- Creation/edit always produces a **draft → review_request → director/head_coach approval → live template**. No auto-approval.
- Curriculum `*_key`/`*_label` fields are **snapshot labels only** — templates never mutate the master curriculum.
- No parent/player visibility of template drafts. No external sends.
- All major mutations write `audit_logs` (red line).

---

## 4. Shared Framework

### 4.1 TemplateWorkspaceShell *(new — Phase B)*
A client component that owns everything common to both types:
- Wizard **step state machine** (`Step`, `STEPS`, Back/Continue gating, step-progress bar).
- **Breadcrumb · header · review-notice · draft-safety callout.**
- **DONNA review banner** (`renderDonnaBanner`) + confirm/dismiss handoff.
- **Page-state-patch wiring** (`onPageStatePatch`, `onGoalSessionCompleted`) routed to the active kind's `applyPatch`.
- **Save state machine** (`idle | saving | success | error | schema_missing`) and result rendering.
- **DONNA rail slot** (`<TemplateDonnaPanel mode={kind.donnaPanelMode} />`).
- **Footer actions:** Save as Draft · Preview for Coach · Cancel.

### 4.2 TemplateKind *(new — Phase B)*
One declarative config object per type supplies all differences:
```
TemplateKind = {
  type: 'class_template' | 'fitness_template',
  accentToken: 'lime' | 'status-purple',
  listRoute: '/director/templates/{type}',
  workflowId: 'template_builder_completion' | 'fitness_template_builder_completion',
  donnaPanelMode: 'class_create' | 'fitness_create',
  steps: StepDef[],                          // labels + icons
  applyPatch(fieldId, value, set),           // page-state-patch → form state
  validateStep(step, state): boolean,        // Continue gating
  buildDraftInput(state): WizardInput,       // → unified save action
  renderStep(step, state, set): ReactNode,   // the type-specific form body
}
```

### 4.3 Draft Pipeline *(already shared — unify wrappers in Phase A)*
- Base `saveTemplateDraftAction(input)` in `src/lib/actions/templateDraftAction.ts` already accepts `templateType` and writes `template_review_requests`.
- **Phase A:** collapse `saveClassTemplateDraftFromWizardAction` + `saveFitnessTemplateDraftFromWizardAction` into **one** `saveTemplateDraftFromWizardAction(templateType, normalizedInput)` (shared auth resolution, insert, schema-missing detection; type-specific block normalization passed in).

### 4.4 Completion Contract *(already shared — keep)*
One `template_review_requests` insert; `status='pending'`; director/head_coach only; no auto-approval; no curriculum mutation; no parent/player visibility; identical schema-missing fallback. Applies to both types and to create + update.

### 4.5 Page State Patch *(already shared — keep two field maps)*
- Mechanism: `donnaPageSyncEvents` (event bus, `PageStatePatch` contract) + `donnaPageStateSync` (`WORKFLOW_FIELD_MAPS`, `buildPageStatePatch`).
- Two registered maps stay distinct (domain fields): `template_builder_completion`, `fitness_template_builder_completion`. One mechanism, two maps — correct as-is.

### 4.6 DONNA Contract *(see §8)*
DONNA **prepares** (workflow engine → page-state patches) and **navigates**; the **page completes**. Single `TemplateDonnaPanel` for all modes.

### 4.7 Navigation Contract
- Canonical create: `/director/templates/{type}/create`.
- Canonical list: `/director/templates/{type}`.
- Canonical detail: `/director/templates/{type}/[templateId]`.
- Breadcrumb: `AcademyOS › Templates › {Type} Templates › {Create|Detail}`.
- On draft submit: stay on page with success banner (no silent redirect); links to list + Preview-for-Coach.

---

## 5. Type-specific ownership

### Class Template
- **Unique fields:** session blocks `{ type ∈ warm_up|technical|tactical|physical|match_play|cool_down, title, durationMin }`; per-block **drills**; enrichment surfaces: assessment **gates**, **player missions**, coach **watch-fors** (all read-only, draft-only, not assigned).
- **Unique workflow:** Level → Goal → **Build Blocks** → **Add Drills** → Review (duration folded into blocks).
- **Unique validation:** curriculum level required; session goal required; drills optional; duration = sum of block durations.

### Fitness Template
- **Unique fields:** fitness blocks `{ type ∈ movement|speed|agility|strength|plyometrics|mobility|coordination|recovery_cool_down, durationMin, exercises[] }`; **load** (Light/Moderate/High); explicit **session duration**; enrichment surfaces: **tennis-transfer**, **progression/regression**, curriculum **load guidance**, **age-fit note**.
- **Unique workflow:** Level → Goal → **Load + Duration** → **Build Blocks** (with per-block exercise picker) → Review.
- **Unique validation:** curriculum level required; fitness goal required; load ∈ {Light,Moderate,High}; duration 10–90 min in 5-min increments; exercises optional per block.

---

## 6. Route Architecture

**Should canonical routes become `/director/templates/class/*` and `/director/templates/fitness/*`?** — **Yes.** Tree B is already the namespaced, draft/review-aligned tree and is where creation lives.

**Should all legacy routes become redirects?** — **Yes, eventually — but only after capability parity.** This is the single largest and riskiest part of the ADR, because the trees are **split by lifecycle, not duplicated**:

| Capability | Tree B (canonical) `/director/templates/{type}/*` | Tree A (legacy) `/director/class-templates/*`, `/director/fitness/templates/*` |
|---|---|---|
| Create wizard | ✅ `…/{type}/create` | ⚠️ legacy `new/` simple forms |
| Library list | ✅ `…/{type}` | ✅ legacy list |
| Detail view | ✅ read-only detail | — |
| **Rich editor** | ❌ not present | ✅ `ClassTemplateBuilderStepper`, `FitnessBuilderStepper`, block pickers, lesson-plan + session generation, archive |

Tree A is referenced by **~60 files** including `SidebarNav`, `/director/sessions/*` (session-from-template), onboarding checklists, and many DONNA registries (`donnaUIActionRegistry`, `donnaActionRegistry`, `pageContextResolver`, certifications, etc.). Therefore: **port Tree A's editing capability into the canonical detail route first, then redirect legacy** — never redirect before the editor exists on the canonical tree.

**Decision:** Canonical = `/director/templates/{type}/*`. Legacy → 308 redirects **after** Phase C ports the editors and re-points all referencing files.

---

## 7. Builder Architecture

**In the shared shell (`TemplateWorkspaceShell`):** step state machine, progress bar, breadcrumb, header, review-notice, draft-safety, DONNA banner + handoff, page-state-patch wiring, save state machine + result rendering, DONNA rail, footer actions.

**In `TemplateKind` (config):** type, accent token, step definitions, `workflowId`, `donnaPanelMode`, list route, `applyPatch`, `validateStep`, `buildDraftInput`.

**In each form (type-specific `renderStep`):** the domain step bodies only — Class: block builder + drill picker + gates/missions/watch-fors; Fitness: load+duration control + fitness-block builder + exercise picker + tennis-transfer/progression. The form owns nothing about navigation, save, or DONNA wiring.

---

## 8. Sidebar Contract

**Remains in DONNA (sidebar):**
- Detect template-creation intent; **prepare** a draft via the shared workflow engine (parse → page-state patches).
- Read-only **preview** (`DonnaClassTemplateDraftPreview` and a fitness analogue if needed).
- **Navigate** to the owning page (`/director/templates/{type}/create`).
- Explain, recommend, status, voice — per Executive Workspace Standard §2.

**Moves to the page (removed from sidebar):**
- Class: the entire `TemplateDraftPanel` editor (`<input>`/`<select>`/name-edit/**Save** → `saveAssistantTemplateDraftAction`). **Retire/delete.**
- Fitness: the guided-task save path `create_fitness_template` → `saveFitnessTemplateDraftAction(draft.collectedFields)` (DonnaAssistantButton ~line 2428) routed through `GenericDraftPanel`. **Redirect to page; remove the in-sidebar completion.**
- All template completion/mutation in `DonnaAssistantButton.tsx` (incl. the stale `saveAssistantTemplateDraftAction` comment token).

**Net effect:** neither template type is created or completed in the sidebar; both flow page→draft→review.

---

## 9. Migration Phases

### Phase A — Unify save path + retire sidebar editors *(the safe V1 win)*
- **Value:** Eliminates the divergent save wrappers and the non-compliant sidebar creation for **both** types; both complete on-page via the already-shared DONNA handoff. Premium, low-cognitive-load, Director-first creation.
- **Risk:** Low–Medium. The base pipeline and completion contract are unchanged.
- **Regression risk:** Medium — edits touch `DonnaAssistantButton.tsx` (6,252 lines; voice + conversation state machine). Mitigated by confining changes to the `create_template` block, the `create_fitness_template` guided-task branch, imports, and one comment; no state-machine rewrite.
- **Files affected:** `src/lib/actions/templateDraftAction.ts` (collapse wrappers → `saveTemplateDraftFromWizardAction`); `src/app/director/templates/class/create/page.tsx` + `…/fitness/create/page.tsx` (call unified action); `src/components/assistant/DonnaAssistantButton.tsx` (remove sidebar editor render + fitness guided-task save → navigate; fix comment); **delete** `src/components/assistant/TemplateDraftPanel.tsx`; update `src/components/assistant/DonnaClassTemplateDraftPreview.tsx` footer copy; `src/lib/guardians/executiveWorkspace/executiveWorkspace.baseline.json`; `docs/CHANGELOG.md`.
- **Expected Guardian improvement:** baseline **33 → ~27** (clears `TemplateDraftPanel` save/input/select/saveAssistantTemplateDraftAction + `DonnaAssistantButton` saveAssistantTemplateDraftAction comment + saveFitnessTemplateDraftAction). Exact count verified by re-running `runGuardians`.

### Phase B — Extract `TemplateWorkspaceShell` + `TemplateKind`
- **Value:** High (maintainer cognitive load 3/10 → strong). One shell, two declarative configs; ~1,000 lines of mirrored page code removed.
- **Risk:** Medium.
- **Regression risk:** Medium–High — refactors two 1,000-line user-facing create flows. Mitigated by extracting behind unchanged behavior + screenshot/manual parity check per step.
- **Files affected:** new `src/components/templates/TemplateWorkspaceShell.tsx`, `src/lib/templates/templateKind.ts` (+ `class`/`fitness` kind configs and step renderers); refactor both `create/page.tsx` to thin kind-mounting pages; `docs/CHANGELOG.md`.
- **Expected Guardian improvement:** Neutral (page-side; shell is not in the assistant surface). Sets up a future `PageOwnershipGuardian` to assert one owning page per workflow.

### Phase C — Converge route trees (legacy → redirects)
- **Value:** High — eliminates the two-tree duplication; one mental model for "where templates live."
- **Risk:** High.
- **Regression risk:** High — Tree A holds the live editors and is referenced by ~60 files incl. `SidebarNav`, `/director/sessions/*`, onboarding, and DONNA registries/certifications.
- **Files affected:** port `ClassTemplateBuilderStepper`/`FitnessBuilderStepper` + block/lesson-plan/session-gen/archive actions into `/director/templates/{type}/[templateId]`; convert `/director/class-templates/*` and `/director/fitness/templates/*` to redirects; re-point all referencing files (nav, sessions, onboarding, DONNA registries, certifications); update revalidation paths.
- **Expected Guardian improvement:** Neutral-to-positive (no new sidebar surface); reduces route-context registries DONNA must track.

> Each phase is independently shippable, additive-first, and reversible. Do not start a phase before the prior phase is confirmed.

---

## 10. Recommendation

**Yes — AcademyOS should permanently adopt this architecture.** It is more efficient than the status quo (collapses duplicated pages, save actions, and sidebar editors), it is honest and safe (single review-gated completion contract, no sidebar mutation), and it is Director-first and low-cognitive-load. The shared spine it depends on (draft pipeline, completion contract, page-state patch, DONNA engine) **already exists** — this ADR mostly *finishes and consolidates* what is already there rather than building anew.

**Sequencing:** Ship **Phase A first** (safe, high-value, clears Guardian violations), then **Phase B** (the shared shell — the cognitive-load win), then **Phase C** (route convergence — the largest/riskiest, gated on editor parity). Reassess after each phase.

**Guardrails honored throughout:** no new AI; no visual redesign; no new template types; no migrations or new dependencies in Phases A–B (Phase C is app-layer routing only); all completion stays review-gated through `template_review_requests`; the `template_blocks`/`session_blocks` red line is preserved.

---

## Appendix — Files inspected

**Pages:** `src/app/director/templates/class/create/page.tsx`, `…/fitness/create/page.tsx`, `…/templates/class/page.tsx`, `…/templates/fitness/page.tsx`, `…/templates/class/[templateId]/page.tsx`, `…/templates/fitness/[templateId]/page.tsx`, `…/class-templates/page.tsx`, `…/class-templates/[templateId]/page.tsx`, `…/fitness/templates/page.tsx`, `…/fitness/templates/[templateId]/page.tsx`.
**Pipeline/infra:** `src/lib/actions/templateDraftAction.ts`, `src/lib/donna/pageSync/donnaPageStateSync.ts`, `…/donnaPageSyncEvents.ts`, `src/components/templates/TemplateDonnaPanel.tsx`.
**Sidebar:** `src/components/assistant/DonnaAssistantButton.tsx`, `…/TemplateDraftPanel.tsx`, `…/DonnaClassTemplateDraftPreview.tsx`.
**Guardian:** `src/lib/guardians/executiveWorkspace/executiveWorkspaceGuardian.ts`, `…/executiveWorkspace.baseline.json`.
**Standard:** `docs/EXECUTIVE_WORKSPACE_STANDARD.md`.
