# Curriculum Architecture Audit — V1

**Date:** 2026-06-23
**Scope:** Read-only audit. No code or schema was changed.
**Method:** Four parallel evidence-gathering passes — (1) DB schema, versioning & permissions; (2) content model, content-type registries & seed data; (3) curriculum builder & onboarding flows; (4) DONNA curriculum/placement tools. Findings cross-corroborated across passes.

**Target model audited against:** Protected Master Development Spine + Developmental Address System + Academy Customization Layer + DONNA Placement Engine.

---

## Final Verdict

**Directionally correct, but incomplete.**

The hard architectural bets are right: a real protected global spine, a clean delta-based academy override layer with no row duplication, a single safe writer, full review-gating, and onboarding that is review/confirm/personalize rather than build-from-scratch. That foundation is sound and worth keeping.

What's missing is the **outcome-centric core and the depth of the developmental address** (Skill Family, Development Outcome, and especially Teaching Intent), plus two real defects: a **multi-tenant RLS permission hole** on the global spine and **significant model duplication**. The system is **more efficient in design than a from-scratch rebuild would be** — it should be *completed and hardened*, not replaced. Treat the permission fix as P0 and the outcome layer as the defining P1.

---

## Current Architecture Summary

AcademyOS already ships a **real, protected, global curriculum spine** plus a **separate academy override layer** — the two-tier shape the target model calls for *exists in skeleton*. But the spine is built around the **15-level ladder and its drills/gates**, not around development outcomes, and three of the six "developmental address" layers are missing or collapsed.

**The spine (global, platform reference, `academy_id IS NULL`):**
- `curriculum_stages` (5 ball-color bands) → `curriculum_levels` (15 levels) is the backbone; nearly every other table FKs to `level_id`. (`036_curriculum_spine.sql`)
- Richly seeded leaves: **152 drills**, **57 gates**, **120 coach-language phrases**, plus competition/fitness/volume guidance per level. (`052`, `053` — 10,470-line seed)
- Source-of-truth doc: `docs/curriculum/angles-master-spine.md`.

**The academy layer (separate, delta-based — no row duplication):**
- `academy_curriculum_versions` (per-academy pointer with `base_curriculum_version_id`, `cloned_from_global_at`) + `academy_curriculum_overrides` (typed deltas: add/update/remove/replace/emphasis_shift, with `original_snapshot` + `proposed_change`). (`048`)
- The **only** spine-safe writer is `execute_curriculum_override()` (`069`), which hard-refuses to mutate `academy_id IS NULL` rows and writes `audit_logs`.

**DONNA's role:** a working "Curriculum Architect" (`src/lib/donna/curriculum/curriculumArchitect.ts`) that interprets free-text director input, infers intent + level + content-type, asks clarification one question at a time, and saves drafts to `academy_curriculum_overrides` at `status='pending_review'`. Nothing auto-applies; everything routes to director approval. DONNA is architecturally walled off from the global master (`curriculumChangeScope.ts` excludes `global_master` from director scopes).

**Onboarding** is genuinely **review/confirm/personalize** (curriculum is step 3 of 7; zero-edit "accept the spine" is a first-class path), *not* build-from-scratch — though vestigial blank-slate artifacts still linger in the code.

---

## Target Architecture Summary

A **protected global Master Development Spine** that academies never edit directly; every item carries a full **Developmental Address** (Domain → Skill Family → Development Outcome → Level/Stage → Teaching Intent → Drill/Activity); the spine is **outcome-based** (outcomes own drills, not the reverse); a **separate Academy Customization Layer** holds language/drill-name/order/local-drill/coach-default overrides; **DONNA Placement Engine** maps new academy drills into the correct address with ≤3 clarification questions and routes uncertain placements to director approval; **global updates preserve local customization**.

---

## Gap Analysis (target item → status)

| # | Target requirement | Status | Evidence |
|---|---|---|---|
| 1 | Protected global spine | ⚠️ **Partial** — protected *by construction & by `069`*, but **not by RLS** | Global tables use `auth_is_director_or_head()` with **no academy/platform predicate** (`036:261-283`, `052` policies); `auth_is_platform_owner()` doesn't exist |
| 2 | Outcome-based, not drill-first | ❌ **Not met** — level/drill/gate-first | Root is `curriculum_levels`; richest leaves are 152 drills + 57 gates; no outcome node owns drills |
| 3 | 6-part developmental address | ❌ **~2.5 of 6** | Level ✅, Drill ✅, Domain ✅-but-fragmented; Skill Family ⚠️ TS-only; Dev Outcome ⚠️ merged into gates/requirements; **Teaching Intent ❌ absent (0 hits repo-wide)** |
| 4 | Academies don't edit spine directly | ✅ **Met** (via override layer + `069` refusal) | `academy_curriculum_overrides`; `069:246-256` refuses `academy_id IS NULL` |
| 5 | Academy customization layer | ⚠️ **Partial** | Language overrides = preview-only; **no reorder** (`override_type` lacks it, no `sort_order`); **no per-coach defaults** (coach language is academy-wide); local drills ✅ |
| 6 | DONNA places new drills into spine | ⚠️ **Partial** — places to `levelId+contentType+pathway` only | `curriculumArchitect.ts:64-120`; no domain/skill/intent assignment; `inferredTargetItemId` stubbed null (`:175`) |
| 7 | ≤1–3 clarification questions | ⚠️ **Emergent, not enforced** | One-at-a-time loop, ≤2 for `add`; **no `MAX_QUESTIONS` cap** (`getUnansweredFields`, `:227-276`) |
| 8 | Uncertain mappings → director approval | ⚠️ **All go to approval, but uncertainty isn't escalated** | `routeResult.confidence` computed (`:171`) but unused for routing; low-confidence treated identically |
| 9 | Global updates preserve local customization | ✅ **Design met**, ⚠️ **execution partial** | Delta model preserves by construction; but only `content_item` overrides execute — `level`/`requirement`/`mapping` raise "not yet handled" (`069:371-394`); **no conflict/merge logic** |
| 10 | Onboarding = review/confirm/personalize | ✅ **Met** | Step 3 of 7; zero-edit path is first-class; vestigial build-from-scratch artifacts should be pruned |

---

## Ratings (10 = ideal)

**Efficiency: 6/10.** The *design* is efficient and non-redundant at the storage tier (delta overrides, no per-academy row duplication, single safe writer, global updates propagate free). What drags it down: only 1 of 5 override types actually executes, and **heavy model duplication** (drills ×2, domain vocabulary ×3, content-type taxonomy ×2, outcome/requirement ×3, stage-naming ×3) forces redundant reconciliation everywhere.

**Cognitive Load: director-facing 7/10 (good); maintainer-facing 3/10 (poor).** A director's path is light — review the spine, optionally personalize, done. But a *developer's* cognitive load is high: three unreconciled "domain" enums, three "outcome/advancement" models, two drill tables, and two divergent DONNA draft pipelines (`academy_curriculum_overrides` vs `proposed_actions`) mean no single mental model of "where curriculum lives."

**Scalability: 6/10.** The override/versioning model scales cleanly across tenants. Held back by: (a) the **RLS permission hole** is a genuine multi-tenant integrity risk at scale; (b) **requirements seeded for Orange only** — Red/Green/Yellow/HP have no global outcome layer; (c) deferred override types cap how much academies can actually customize.

---

## Data Model Concerns

1. **No outcome spine.** The chain from a drill *up* to the competency it develops is unpopulated: `drill_gate_mappings` is **defined but ships empty** (`052:485`). The spine cannot currently answer "what outcome does this drill serve?"
2. **Teaching Intent layer entirely missing** — zero references anywhere. There is no node between outcome and drill.
3. **Skill Family exists only in TypeScript** (`skillHierarchyModel.ts`), with no DB table.
4. **Triple/double-modeled concepts** (domain ×3, outcome ×3, drill ×2, content-type ×2, stage-naming ×3) with non-identical member sets — divergence risk grows with every sprint.
5. **No explicit `is_global`/`locked` flag** — globalness is inferred from `academy_id IS NULL`, so protection is procedural, not declarative.

---

## DONNA Workflow Concerns

1. **Coarse placement address** — DONNA assigns `levelId + contentType + pathway`, not the 6-dimension address; it can't place by domain/skill/outcome/intent because those layers don't exist to place into.
2. **Question cap not enforced** — ≤3 is emergent from the field model, not a guard; a future field addition could silently exceed it.
3. **Uncertainty doesn't change routing** — confidence is measured but never escalates a low-confidence mapping to a distinct review lane or blocks auto-prefill.
4. **Two divergent draft pipelines** — Architect drafts land in `academy_curriculum_overrides` (bypassing `proposed_actions` due to a `voice_command_id NOT NULL` schema limit) and **won't appear** in the generic review queue, while the older `curriculum_adjustment` card reads `proposed_actions`. Split audit/reviewer surfaces.
5. **Target-item resolution stubbed** — `inferredTargetItemId` is always null; modify/move/replace lean on the human to identify the item.

---

## Permission Concerns

**The most serious finding.** Global spine write policies are **role-gated, not platform-owner-gated**: `FOR ALL USING (auth_is_director_or_head())` with no `academy_id` or `platform_roles` predicate (`036:261-283`; `052` policies). There is no `auth_is_platform_owner()` helper, and `platform_roles` (`040`) is used only for an `academies` SELECT policy. Because the spine has no `academy_id` to scope against, **any director or head coach at any tenant can raw-RLS UPDATE/DELETE shared global curriculum rows**. The intended "global is immutable" guarantee lives *only* inside `execute_curriculum_override()` — which direct table writes bypass. This violates target requirements #1 and #4 at the database level.

---

## Update / Versioning Concerns

- **Sound design, partial execution:** delta model preserves local edits by construction, but only `content_item` add/update/remove executes; `level`, `requirement`, `mapping`, `template_rule`, and the `replace`/`emphasis_shift` override types raise "not yet handled" (`069:357-394`). Directors can *draft* changes that will never apply — a broken-promise UX risk.
- **No conflict detection** — `original_snapshot` is stored but no routine compares it against a later-changed global row, so a global update that invalidates an override's premise goes undetected.
- **Requirements coverage gap** — global outcome-analog requirements exist for **Orange only** (32 rows); four of five bands are empty.

---

## Duplicate-Building Risks

- **High at the data-model layer:** drills (`curriculum_drills` vs `curriculum_content_items[content_type=drill]`), domain (3 vocabularies), outcome (`skill_progressions` vs `curriculum_gates` vs `curriculum_track_requirements`), content-type (DB 22 values vs TS 10). Each new sprint risks extending the wrong one or inventing a fourth.
- **Vestigial "build from scratch" artifacts** — orphaned `CurriculumStarterForm.tsx` + `updateCurriculumStarterAction.ts` and `build_from_scratch`/`blank_structure` options in `curriculumSetupTypes.ts:77` contradict the spine-first model.
- **Low at the academy layer:** the override design is genuinely non-duplicative — that part is right.

---

## Recommended Changes (priority order — not yet implemented)

1. **Close the permission hole** *(P0, security)* — add `auth_is_platform_owner()` and change global-spine write policies to require it (or revoke direct writes entirely and force all spine changes through SECURITY DEFINER functions). This is the single highest-value fix.
2. **Introduce the Development Outcome node** *(P1)* — promote outcomes to a first-class table that owns drills (populate/repurpose `drill_gate_mappings`), turning the model outcome-based. This unblocks the true developmental address.
3. **Reconcile the duplicate vocabularies** *(P1)* — pick one canonical domain enum, one outcome model, one drill table, one content-type registry; add the others as views/adapters during migration.
4. **Add Teaching Intent + Skill Family layers** *(P2)* — once outcomes exist, these slot between outcome↔drill and domain↔outcome.
5. **Unify DONNA draft pipelines** *(P2)* — resolve the `proposed_actions` vs `academy_curriculum_overrides` split so all curriculum drafts share one review surface.
6. **Harden DONNA placement** *(P2)* — explicit `MAX_QUESTIONS=3` cap; a confidence threshold that routes uncertain mappings to a flagged review lane; finish target-item resolution.
7. **Finish or hide deferred override types** *(P2)* — make level/requirement/mapping/replace/emphasis_shift either execute or not be draftable.
8. **Seed requirements for all five bands; prune vestigial build-from-scratch artifacts** *(P3)*.

---

## Lowest-Risk Implementation Plan

- **Phase 0 (additive, zero behavior change):** add `auth_is_platform_owner()` helper + tighten global-spine RLS in a new migration. Pure protection, no data change. *(P0)*
- **Phase 1 (additive schema):** create the `development_outcomes` table and populate `drill_gate_mappings` from existing gate/drill data — new tables/rows only, nothing dropped. Existing reads keep working. *(P1)*
- **Phase 2 (adapter layer):** introduce canonical enums/views over the duplicated vocabularies; migrate readers incrementally behind the views; no destructive drops until all readers move. *(P1)*
- **Phase 3 (DONNA):** add the question cap + confidence routing + pipeline unification — app-layer only, gated by review queue as today. *(P2)*
- **Phase 4 (cleanup):** finish deferred override types, seed remaining bands, delete vestigial artifacts. *(P3)*

Each phase is independently shippable, additive-first, and reversible — no destructive change until its replacement is proven.

---

## Files Inspected

**Migrations:** `036_curriculum_spine.sql`, `040_platform_roles.sql`, `041_requirement_domains.sql`, `042` (requirement domains seed), `043_orange_ball_starter_requirements.sql`, `045_curriculum_content_library.sql`, `047_content_requirement_mappings_seed.sql`, `048_academy_curriculum_clone.sql`, `052_curriculum_foundation_tables.sql`, `053_curriculum_seed.sql`, `061_curriculum_content_taxonomy.sql`, `063`, `065`, `069_execute_curriculum_override.sql`, `082`, `003_rls_helpers.sql`.

**Lib:** `src/lib/donna/curriculum/curriculumArchitect.ts`, `curriculumDraftObject.ts`, `donnaCurriculumIntelligence.ts`, `src/lib/actions/saveCurriculumDraftAction.ts`, `curriculumDraftActions.ts`, `src/lib/curriculum/curriculumChangeScope.ts`, `curriculumSetupTypes.ts`, `contentTypeModel.ts`, `skillHierarchyModel.ts`, `visualMapModel.ts`, `academyCurriculumResolution.ts`, `src/lib/donna/donnaWritePathRegistry.ts`, `src/lib/supabase/database.types.ts`.

**UI:** `src/app/director/curriculum/builder/DonnaCurriculumPanel.tsx`, `CurriculumStarterForm.tsx`, `src/app/director/review/CurriculumAdjustmentReviewCard.tsx`, `DonnaCurriculumAdjustmentApplyControls.tsx`.

**Docs:** `docs/curriculum/angles-master-spine.md`.

---

## Tests Needed (when changes are made)

- **RLS negative tests:** a director at academy A **cannot** UPDATE/DELETE global spine rows; only platform owner can.
- **Override isolation:** academy A's override never mutates a global row or another academy's data; `069` rejects `academy_id IS NULL`.
- **Update-preservation:** a global spine change followed by override resolution preserves local deltas; conflict case surfaces a flag.
- **DONNA placement:** ≤3 questions enforced; low-confidence mapping routes to flagged review; uncertain placement requires director approval before apply.
- **Pipeline unification:** a DONNA curriculum draft appears in exactly one review surface with a complete audit trail.
- **Vocabulary reconciliation:** every reader resolves through the canonical enum; no orphaned domain/content-type values.
