# AcademyOS Phase 1 Roadmap — The Decision Spine V1

**Date:** 2026-06-29
**Status:** EXECUTION PLAN — derived directly from `ACADEMYOS_EXECUTIVE_INTERACTION_CONSTITUTION_V1.md` §6 (Phase 1) and its Top-25 (#3, #4, #12, #16).
**Predecessor:** Phase 0 — Remove Director Trust Leaks & Fake Surfaces V1 (shipped, `6865b2b5`).
**Scope discipline:** Improve the Director experience while **preserving the existing architecture**. Reuse components that already exist; do not introduce new backends; do not touch schema unless absolutely required (and Phase 1 requires none). Prioritized by **impact, not effort**.

---

## 0. Why Phase 1 is "the Decision Spine"

Phase 0 made the Director surface *honest*. Phase 1 makes the place a Director actually **decides** *answer-first and singular*. This is the highest-leverage work after trust because:

- **Approvals is the constitutional heart** — every mutation in AcademyOS flows through `proposed_actions`, and this is where the Director approves it. The audit found it **Evidence-First, not Answer-First**: ~20 bespoke verbose card types, no per-item DONNA recommendation, a two-step Approve/Apply model, 8 duplicate clarification blocks. The better card (`DirectorApprovalActionFlow`) **already exists and is unused**.
- **The decision loop is fragmented across four surfaces** — `review`, `alerts`, `ai-suggestions`, `attention` — with three vocabularies. `ai-suggestions` is a *constitutionally divergent parallel approval queue* (`academy_suggestions` + Accept/Defer/Deny). Review-queue overload is realized, not hypothetical.

**Phase 1 outcome:** **4 decision surfaces → 2.** `attention` to *notice* (one DONNA-owned ranked stream), `approvals` to *decide* (one answer-first `proposed_actions` queue), **one card shape, one vocabulary** (Approve / Hold / Dismiss). No new architecture — this is convergence onto components that already exist.

**Constitution laws this phase advances:** Law 2 (verbs/nouns), Law 3 (Answer First), Law 4 (signals narrated not browsed), Law 5 (one owning surface), Law 7 (one queue, one vocabulary).

---

## 1. The Constitution gate (runs before every sprint below)

Every sprint opens by answering the §7 five questions; a "no" blocks it:
1. Does it add a surface? (Default no — Phase 1 only *removes/merges* surfaces.)
2. Does it own a verb in DONNA, a noun on a page?
3. Does it lead with the answer?
4. Is anything fake? (Phase 0 cleared these — keep them cleared.)
5. Does every mutation flow through `proposed_actions` with one vocabulary?

Every sprint must also **move the §3 scores up, never down**, and end green on `tsc` + `certify`.

---

## 2. Sprints, ordered by impact (and a clean dependency chain)

Impact order and build order align: the universal card (1.1) is both the biggest lever and the dependency the later sprints reuse.

### Sprint 1.1 — Universal Answer-First Approval Card  ★ highest impact
**Objective:** Replace the ~20 bespoke verbose review cards with one answer-first card shape across all of `/director/review`.
**Card contract:** DONNA recommended decision (headline) → one-line reasoning → **What changes / What stays** (collapsed) → one primary **Approve & Apply** → overflow (Reject / Request clarification). Evidence is opt-in, never default.
**Reuse (no new architecture):** promote the existing, unused `src/components/donna/DirectorApprovalActionFlow.tsx`; keep every existing apply/approve server action and the `proposed_actions` pipeline exactly as-is — only the *presentation* changes.
**Ownership shift:** DONNA owns the *recommendation + risk framing*; the page owns *evidence rendering, note authoring, and the mutation button*.
**Scope in:** a shared card wrapper; migrate module types onto it (start with the highest-volume: coach wrap-ups, attendance, placement). **Out of scope:** changing what any action does; the suggestions queue (1.3); attention (1.4/1.5).
**Risk & mitigation:** ~20 module types → migrate behind the shared wrapper module-by-module, keeping old renderers until parity per type (no big-bang). Medium effort, but this is the single biggest executive-experience lever in the product.
**Success:** every review item leads with a DONNA recommended decision and exposes exactly one primary action; evidence collapsed by default; `tsc`/`certify` green; §7 gate passes.
**Constitution:** Laws 3, 2, 8. Top-25 #3.

### Sprint 1.2 — One Decision Vocabulary + DONNA pre-sort
**Objective:** Standardize **Approve / Hold / Dismiss** across the queue and let DONNA pre-sort by recommendation so "approve all routine" becomes a single batch gesture.
**Scope in:** unify the verb set on the 1.1 card; collapse the 8 near-identical "sent back for clarification" blocks in the Done tab into one list; surface DONNA's "start here" recommendation (the existing `DonnaReviewBriefPanel`) as the queue's lead.
**Reuse:** `DonnaReviewBriefPanel` (already in `review/page.tsx`); existing status model — only the labels/affordances converge. **Out of scope:** the `academy_suggestions` verbs (handled in 1.3).
**Risk:** vocabulary changes are user-visible — keep the underlying action semantics identical; only relabel/regroup.
**Success:** one verb set everywhere in `/director/review`; Done tab is one list; a director can clear routine items in a batch.
**Constitution:** Laws 7, 3. Top-25 #3.

### Sprint 1.3 — Merge `ai-suggestions` into Approvals (kill the parallel queue)
**Objective:** End the constitutionally divergent second approval queue. Surface `academy_suggestions` as a **"DONNA Suggestions"** section inside `/director/review` using the 1.1 card; redirect `/director/ai-suggestions` → `/director/review`.
**Architecture preservation (important):** this is a **UI + action-mapping** unification only. `academy_suggestions` remains the store; its Accept/Defer/Deny actions are mapped at the action layer to **Approve / Hold / Dismiss**. **No schema migration** — full convergence of `academy_suggestions` into `proposed_actions` is explicitly **deferred** to an optional later *backend* sprint, out of Phase 1's UX scope.
**Reuse:** existing `suggestionActions.ts` + `donnaDecisionExecutionEngine.ts`; the impact-preview panel pattern already in the suggestions UI; the 1.1 card. **Out of scope:** suggestion *generation* (unchanged; keep it ambient/proactive).
**Risk:** two stores feeding one page — clearly section-label provenance; keep generation untouched; map verbs, don't rewrite execution.
**Success:** `/director/ai-suggestions` redirects; suggestions decided in `/director/review` with one vocabulary; no Accept/Defer/Deny remain in the UI.
**Constitution:** Laws 7, 5. Top-25 #4.

### Sprint 1.4 — Collapse `alerts` into the Attention stream
**Objective:** Remove the zero-DONNA, link-only `alerts` index. Fold its computed health signals (missing focus, sessions without recap, reassessment due, declining players, new lesson requests) into `buildAttentionItems` as categories; redirect `/director/alerts` → `/director/attention`.
**Reuse:** `buildAttentionItems` (already in `attention/page.tsx`); the alert signal computations move in as new item builders. **Out of scope:** inline decisions (1.5).
**Risk:** avoid double-counting signals already in attention — dedupe by entity+type as they merge.
**Success:** `/director/alerts` redirects; every former alert appears in the ranked attention stream with a DONNA rationale; no orphan alert index remains.
**Constitution:** Laws 5, 4, 3. Top-25 #12.

### Sprint 1.5 — Attention as the single "notice" front door + inline quick-decide
**Objective:** Make `/director/attention` the canonical notice surface and close the loop: for items backed by a `proposed_actions` row, allow **inline Approve / Hold** using the 1.1 card; deep-link to `/director/review` for anything complex.
**Reuse:** `AttentionQueueClient`, the existing per-item `donnaExplanation` rationale, the DONNA brief; the 1.1 card for inline decisions. Trim the 7 filters to the few that earn their place. **Out of scope:** Today/Dashboard (Phase 3), the DONNA backend convergence (Phase 2).
**Risk:** keep inline decisions limited to low-risk `proposed_actions` items; everything else routes to the full queue — never reintroduce "complete work in a side panel" (Law 2).
**Success:** attention *notices* (ranked, narrated, one recommended first action) and lets the director *decide in place* for simple items; the two-surface model (notice → decide) is whole.
**Constitution:** Laws 2, 3, 5. Top-25 #16.

---

## 3. What Phase 1 explicitly does NOT touch (guardrail against scope creep)

Deferred to later phases — do not start them here:
- **DONNA backend convergence** (3 conversation backends → 1, the 6,252-line widget, 33 containment breaches) → **Phase 2**.
- **Today / Dashboard collapse, Player Profile slim, Templates trees, onboarding, sessions** → **Phase 3**.
- **Parents dissolve, private-lessons relocate, assessment reposition** → **Phase 4**.
- **Full `academy_suggestions` → `proposed_actions` table convergence** → optional backend sprint after Phase 1 (UX is already unified by 1.3).
- The Phase 0 deferrals (`guided`, `kpi`/`setup` stubs, dashboard-wall components, pilot diagnostic tools) remain parked with their phases.

---

## 4. Architecture-preservation guarantees (every sprint)

- **No new backend, no new router, no new conversation engine.** Phase 1 is presentation + consolidation over existing services.
- **`proposed_actions` pipeline is untouched** — Law 7 is strengthened, never bypassed. Every approve still writes through it and to `audit_logs`.
- **No schema migration.** If any sprint appears to need one, stop and re-scope — it belongs to a backend sprint, not this UX phase.
- **Reuse-first:** `DirectorApprovalActionFlow`, `DonnaReviewBriefPanel`, `buildAttentionItems`, `AttentionQueueClient`, `donnaExplanation`, existing apply/suggestion actions. Net component count should *drop*, not grow.
- **Ratchet, not big-bang:** migrate module-by-module; keep old renderers until per-type parity.

---

## 5. Phase 1 exit criteria & re-score target

**Exit when all are true:**
1. `/director/review` uses one answer-first card across all module types, one vocabulary (Approve / Hold / Dismiss).
2. `/director/ai-suggestions` and `/director/alerts` redirect; their content lives in `review` (decide) and `attention` (notice) respectively.
3. `/director/attention` is the single ranked notice stream with inline quick-decide for simple `proposed_actions` items.
4. Four decision surfaces have become two; `tsc` clean, `certify` green, §7 gate passes each sprint.

**Re-score target (Constitution §3):** Conversation Ownership 38 → ≥ 55, Executive Experience 43 → ≥ 55, Cognitive Load 30 → ≥ 45 (the decision loop is where load concentrates). Composite 38 → **≥ 50** on the way to the Phase 3 target of ≥ 75.

---

## 6. Sequencing summary (impact-ordered)

| Order | Sprint | Lever | Top-25 |
|---|---|---|---|
| 1 | 1.1 Universal answer-first card | Where the Director decides — biggest single lever | #3 |
| 2 | 1.2 One vocabulary + pre-sort | Removes "did I Approve or Accept?" + enables batch | #3 |
| 3 | 1.3 Merge ai-suggestions | Kills the parallel constitutional queue | #4 |
| 4 | 1.4 Collapse alerts | Removes a whole redundant link-wall surface | #12 |
| 5 | 1.5 Attention front door + inline decide | Completes notice → decide; closes the loop | #16 |

Each row is independently shippable, reuses prior rows, and is gated by the Constitution. This roadmap is the execution plan for the next series of UX-focused sprints.
