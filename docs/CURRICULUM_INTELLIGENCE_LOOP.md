# AcademyOS Curriculum Intelligence Loop

**Version:** 1.0 — Sprint 898
**Authority:** Product goal — curriculum intelligence is the primary 10/10 priority
**Status:** Strategic definition — architecture questions flagged where implementation is unresolved
**Related:** `CURRICULUM_INFORMATION_ARCHITECTURE.md`, `CURRICULUM_RIPPLE_ARCHITECTURE.md`,
             `DONNA_CURRICULUM_IMPACT_MAP.md`, `ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md`,
             `CURRICULUM_BUILDER_ARCHITECTURE_759.md`, `CURRICULUM_BUILDER_V2_WIRING_PLAN_831.md`

---

## Core Doctrine

> Curriculum is the source tree for all downstream features.
> Knowledge Engine ≠ Curriculum — external knowledge cannot auto-become curriculum.
> Platform owner controls promotion of knowledge → curriculum.
> DONNA can organize, draft, surface, and route. DONNA cannot silently publish.
> Every curriculum change is proposed first. A human approves before it applies.

_(Source: `CURRICULUM_INFORMATION_ARCHITECTURE.md`, Sprint 503)_

---

## Section 1 — The Core Curriculum Intelligence Loop

The full loop from curriculum spine to execution to improvement and back:

```
Curriculum Spine (global master + academy version)
        │
        ▼
Interface Edit / DONNA Natural-Speech Edit
        │ Director edits or speaks a curriculum change
        │ DONNA structures it into a draft proposal
        ▼
Structured Curriculum Change Draft
        │ Stored as proposed_actions row (type: curriculum_*)
        │ DONNA surfaces ripple preview ("If this change were applied…")
        ▼
Director Review + Approval
        │ Director sees impact preview, approves or rejects
        │ Rejection → draft archived; Approval → execute_approved_action()
        ▼
Curriculum Spine Update (academy version override applied)
        │ academy_curriculum_overrides delta written
        │ audit_log entry created
        ▼
Session Templates / Class Templates Reflect Change
        │ Templates linked to updated level surface updated drills/gates
        │ Coach briefs updated via DONNA context on next session load
        ▼
Academy Execution (coaches run sessions with updated curriculum)
        │
        ▼
Coach Feedback Signal (session wrap-up → DONNA records flag)
        │ "This drill isn't working for Orange 1 players"
        │ DONNA routes flag to director review queue
        ▼
Platform-Owner Knowledge Builder Input
        │ Research, external content, coach patterns ingested
        │ Platform owner reviews, classifies, decides on promotion
        ▼
Approved Knowledge Promotion
        │ Promoted knowledge becomes curriculum change proposal
        │ OR becomes new curriculum content item
        │ Academy director reviews before spine is updated
        ▼
Curriculum Improvement Suggestions
        │ DONNA surfaces suggestions based on execution patterns + knowledge
        │ "3 coaches have flagged this drill. Want me to draft a replacement?"
        ▼
Better Academy Curriculum Execution
        └── Loop repeats
```

---

## Section 2 — The Seven Atomic Loops

Each atomic loop must be rated 10/10 independently. A failing loop in the chain breaks the full
curriculum intelligence cycle.

### Loop 1 — Curriculum Spine Creation/Edit Loop

**Entry:** Director opens curriculum builder, starts editing a level.
**Exit:** Curriculum change is either saved as an approved update or discarded.

**10/10 requirements:**
- Director can navigate to any level in ≤ 2 taps
- Level detail shows current drills, gates, assessment criteria, coach cues in one view
- Editing a field produces a clear draft confirmation, not a silent save
- Academy-version override vs. global change is distinguishable at a glance
- No curriculum row is mutated without a review step
- Change is auditable: actor, timestamp, before/after visible in audit trail

**Current state:** Curriculum builder UI shells exist (Sprints 759–830). V2 wiring (`proposed_actions` integration) is planned in Sprint 831 but not yet applied.

**Gap:** DONNA drill draft → `proposed_actions` write is not yet wired (V2 server action defined in `CURRICULUM_BUILDER_V2_WIRING_PLAN_831.md`).

---

### Loop 2 — DONNA Natural-Language Curriculum Edit Loop

**Entry:** Director says or types "add a forehand volley drill to Orange 2."
**Exit:** Structured drill draft appears in the review queue; director approves or rejects.

**10/10 requirements:**
- DONNA recognizes curriculum edit intent without requiring formal syntax
- DONNA constructs a structured draft with level, content type, description pre-filled
- Draft is presented for review before any write occurs
- DONNA uses language: "I've drafted this for your review" — never "I've updated it"
- Rejection is a one-tap action with no trace in the curriculum
- Approval triggers a `proposed_actions` row, then `execute_approved_action()`
- DONNA confirms: "Done — added to Orange 2. You can view it in the curriculum builder."

**Current state:** `DonnaAddDrillDraft.tsx` component exists; local state only; no DB write. `DonnaAddFitnessExerciseDraft.tsx` and `DonnaAddAssessmentGateDraft.tsx` also exist as shells.

**Gap:** `createCurriculumDrillDraft()` server action is defined in Sprint 831 wiring plan but not yet implemented.

---

### Loop 3 — Interface Curriculum Edit Loop

**Entry:** Director opens curriculum level detail, clicks "+ Add Drill" or edits gate text.
**Exit:** Proposed change is queued for review and visible in the pending changes panel.

**10/10 requirements:**
- Every editable field has a visible edit affordance (pencil icon, chip, or "+ add" CTA)
- Edit UI shows what the global master says alongside the current academy version
- Saving creates a `proposed_actions` entry, not a direct curriculum row mutation
- `CurriculumChangeQueue.tsx` (component exists) shows pending changes before they apply
- Director can see all pending curriculum changes in one surface before approving in batch
- Undo of a pending change is trivially possible (reject the proposed action)

**Current state:** Component shells exist (`CurriculumLevelBuilderShell.tsx`, `CurriculumLevelSectionCard.tsx`, `CurriculumChangeQueue.tsx`). Write wiring is the V2 milestone.

**Gap:** `proposed_actions` write path not yet connected to UI. This is the single highest-value V2 upgrade per Sprint 831.

---

### Loop 4 — Knowledge Builder Ingestion/Review Loop

**Entry:** Platform owner (or director) identifies new knowledge — a research paper, a coaching
methodology, a drill from an external source.
**Exit:** Knowledge is classified, tagged, and ready for promotion review.

**10/10 requirements:**
- Ingestion accepts: free text, structured import, voice description, external reference
- Each ingested item is classified: source type, content type, applicable stage/level
- Ingested knowledge is NOT curriculum yet — it is held in a knowledge inbox
- Platform owner can accept, reject, tag, or defer each item
- No ingested item auto-applies to curriculum without a promotion decision
- Ingested items are searchable by level, content type, and tag

**Current state:** `src/lib/curriculum/inbox/` module exists (Sprint 503 Mega Sprint). `voiceCurriculumClassifier.ts` provides intent classification. Knowledge ingestion pipeline architecture exists as library layer.

**Architecture question:** Where is the Knowledge Builder UI? The library layer is built but the
director/platform-owner-facing UI route for browsing and managing the knowledge inbox is not confirmed as shipped. Needs verification before Sprint 899.

---

### Loop 5 — Knowledge-to-Curriculum Promotion Loop

**Entry:** Platform owner reviews an approved knowledge item and decides it should become
official curriculum content.
**Exit:** A curriculum change proposal is created; director reviews; spine is updated.

**10/10 requirements:**
- Platform owner initiates promotion with a single action
- Promotion generates a `proposed_actions` row with `source: 'knowledge_promotion'`
- Academy director reviews the promotion proposal before it applies
- Promoted content is distinguished from existing content by source_type (`imported` or `academy_custom`)
- Audit log records the promotion chain: ingestion → review → promotion → approval → application
- Reverting a promotion is possible by rejecting the proposed action before it executes

**Current state:** The `proposed_actions` pipeline supports `source` field. `curriculum_content_items.source_type` schema supports `imported` and `academy_custom`. Full promotion UI is an open architecture question.

**Architecture question:** Is the platform-owner promotion flow a director-portal route or a separate platform-owner console? This determines where to build the UI. Needs a decision before implementation.

---

### Loop 6 — Curriculum-to-Session/Template Loop

**Entry:** Session template is being built or a coach is running a session.
**Exit:** Template blocks reflect the correct curriculum level's drills, gates, and coach cues.

**10/10 requirements:**
- Every session template has a curriculum level assignment (already exists: `curriculum_level_id`)
- Drills shown in template builder are filtered to the assigned level's approved content
- Coach session view shows the level's coach cues alongside the drill list
- If curriculum changes (approved), templates linked to that level surface updated content on next load
- Template execution does not require re-selecting drills after a curriculum update
- DONNA can answer "what drills should I use for Orange 2 today?" based on level assignment

**Current state:** `curriculum_level_id` FK exists on templates. `DONNA_CURRICULUM_IMPACT_MAP.md` defines Tier A queries DONNA can run. Template-to-curriculum display wiring is partially complete.

**Gap:** Real-time curriculum ripple to open templates needs verification — confirm whether template block list re-queries the curriculum level on load or is cached at creation time.

---

### Loop 7 — Coach Feedback-to-Curriculum-Improvement Loop

**Entry:** Coach logs a session wrap-up and notes a drill that isn't working.
**Exit:** The feedback signal is visible to the director and optionally queued for curriculum review.

**10/10 requirements:**
- Coach can flag a curriculum-level concern during session wrap-up in ≤ 30 seconds
- DONNA captures the flag as a structured observation, not free text only
- Flags are aggregated: "3 coaches have flagged the baseline crosscourt drill for Orange 1"
- Director can view flagged curriculum signals in one place (dashboard or review queue section)
- Director can initiate a curriculum draft directly from a flag: "Draft a replacement for this drill"
- Flagging never triggers a curriculum change — it only creates a signal for the director
- Signal is attached to the curriculum object (level + drill) for traceability

**Current state:** `COACH_CURRICULUM_FEEDBACK_FLOW_807.md` defines the boundary and onboarding script. `voiceCurriculumClassifier.ts` classifies curriculum intent. The aggregation surface (multi-coach pattern detection) is an open architecture question.

**Architecture question:** Where does the director see aggregated curriculum signals? Is this a section of the review queue, a curriculum builder overlay, or a separate signal surface? Needs a product decision.

---

## Section 3 — What "10/10 Atomic Loop" Means

A loop is rated 10/10 when it satisfies all of the following:

| Criterion | Definition |
|---|---|
| **Low cognitive load** | User completes the loop without needing to understand the underlying data model |
| **Clear user intent** | The entry point is unambiguous — the user knows what they are about to do |
| **Structured output** | The loop produces a typed, reviewable artifact — not a free-text note that disappears |
| **Human approval where needed** | Any curriculum change, knowledge promotion, or player-affecting action passes through a human review step before applying |
| **Safe data boundaries** | Parent/player-facing data remains role-safe; coach-only data does not leak to parent context; curriculum integrity is maintained |
| **Visible result** | The outcome of the loop is shown to the user — "Draft queued," "Approved and applied," "Rejected" |
| **Reversible or auditable action** | Either the action can be undone (reject the draft), or it is recorded in `audit_logs` with full traceability |
| **No hidden mutation** | No data changes silently. All important state changes go through `proposed_actions` or `audit_logs` |
| **Connected to curriculum spine** | The output is traceable back to a curriculum level, gate, or content item — not an isolated note |
| **Useful in real academy workflow** | A real director or coach would use this loop in their actual workday, not just in a demo |

---

## Section 4 — Guardrails

These guardrails apply to every loop in the curriculum intelligence chain. They are non-negotiable.

### DONNA's Permitted Role

| DONNA can | DONNA cannot |
|---|---|
| Draft curriculum change proposals | Apply a curriculum change directly |
| Surface ripple previews ("If this change were applied…") | Mutate `curriculum_levels`, `curriculum_drills`, `curriculum_requirements` |
| Route approved changes through `proposed_actions` | Bypass the director review step |
| Suggest that a coach's flag warrants curriculum review | Create a curriculum change from a single coach flag |
| Explain what a level contains and how it connects to sessions | Reorder levels or change progression gates without approval |
| Answer "what drills should I use for Orange 2?" based on existing data | Invent drills that are not in the approved curriculum |

DONNA always uses conditional language for curriculum changes:
> "I've drafted this for your review."
> "If this change were applied, here's what would be affected."
> "Would you like me to queue this for your approval?"

DONNA never uses declarative language:
> ~~"I've updated the curriculum."~~
> ~~"Done — Orange 2 now includes this drill."~~

---

### Knowledge Promotion Guardrails

- External knowledge (research, external drills, coach feedback) must not auto-update academy curriculum.
- Knowledge stays in the knowledge inbox until a platform owner or director explicitly promotes it.
- Promoted knowledge goes through the standard `proposed_actions` → director approval → `execute_approved_action()` pipeline before reaching the curriculum spine.
- `curriculum_content_items.source_type` must be set correctly: `global_default` (platform) / `academy_custom` (director-approved custom) / `imported` (promoted from knowledge) / `copied` (copied from another level).

---

### Academy Customization Guardrails

- Academy customization lives in `academy_curriculum_overrides` — never in the global master tables.
- An academy director cannot overwrite global spine entries. They can only create deltas.
- The global master (`academy_id IS NULL`) is written only by platform/migration scripts.
- The resolution engine (`academyCurriculumResolution.ts`) always resolves global + academy delta at read time — it never merges them permanently.

---

### Parent/Player Safety Guardrails

- Content marked `coach_only` (e.g., coach cues, internal assessment notes) never reaches parent or player context packs.
- Parent/player-facing content (learning modules, parent guidance, missions, badges) must pass the role-safe filter before DONNA surfaces it.
- No raw player assessment scores, coach observations, or internal curriculum debates are visible to parents or players.
- These rules are defined in `DONNA_ACADEMY_KNOWLEDGE_CONTEXT.md` and enforced by `parentSafeResponseRules.ts`.

---

## Section 5 — Product Priority

The curriculum intelligence loop is the **highest-priority product goal** for the next build phase.

| Priority order | Rationale |
|---|---|
| 1. Curriculum intelligence loops 1–7 | Core product value — what makes AcademyOS a curriculum-intelligent platform, not just a scheduling tool |
| 2. Director dashboard KPI + attention wiring | Already partially shipped; migration unblocks the live data layer |
| 3. DONNA resolver / normalizer maturity | Already certified 10/10 (Sprints 891, 894) — defect-fix-only |
| 4. Documentation cleanup | Sprint 897 IA audit complete; structural reorganization deferred |
| 5. Speculative features outside the loop | Not scheduled |

---

## Section 6 — Open Architecture Questions

These questions must be answered before implementing the corresponding loops.

| Loop | Question | Blocks |
|---|---|---|
| Loop 4 (Knowledge Ingestion) | Where is the Knowledge Builder UI route? (`/director/curriculum/knowledge`?) | Cannot build until route is confirmed |
| Loop 5 (Knowledge Promotion) | Is the promotion flow in the director portal or a separate platform-owner console? | Determines who sees the promotion UI and what RLS applies |
| Loop 6 (Curriculum-to-Template) | Does the template block list re-query curriculum on load, or is it cached at creation? | Determines whether ripple is automatic or requires a template refresh action |
| Loop 7 (Coach Feedback) | Where does the director see aggregated curriculum signals? | Determines whether to add a section to the existing review queue or create a new surface |

These are flagged as future architecture questions. Do not implement these loops until the
architecture question is answered in a sprint plan that gets explicit approval.

---

## Section 7 — Implementation Checklist (V2 Wiring Priority)

The following items are confirmed as next-implementation targets based on existing sprint docs:

| Item | Source | Status |
|---|---|---|
| `createCurriculumDrillDraft()` server action | Sprint 831 wiring plan | Not yet implemented |
| `createCurriculumFitnessExerciseDraft()` server action | Sprint 831 wiring plan | Not yet implemented |
| `createCurriculumAssessmentGateDraft()` server action | Sprint 831 wiring plan | Not yet implemented |
| Wire `DonnaAddDrillDraft.tsx` → server action → `proposed_actions` | Sprint 831 wiring plan | Not yet wired |
| Wire `DonnaAddFitnessExerciseDraft.tsx` → server action → `proposed_actions` | Sprint 831 wiring plan | Not yet wired |
| Wire `DonnaAddAssessmentGateDraft.tsx` → server action → `proposed_actions` | Sprint 831 wiring plan | Not yet wired |
| `CurriculumChangeQueue.tsx` → live `proposed_actions` query | Sprint 831 wiring plan | Not yet wired |
| Apply pending Supabase migrations (001–038) | `CURRENT_BUILD_TARGET.md` | Migrations untracked, need `/supabase-sprint` |

---

## Reference Docs

| Doc | Purpose |
|---|---|
| `CURRICULUM_INFORMATION_ARCHITECTURE.md` | Curriculum hierarchy, node types, visibility rules |
| `CURRICULUM_RIPPLE_ARCHITECTURE.md` | How curriculum changes propagate; core invariant |
| `DONNA_CURRICULUM_IMPACT_MAP.md` | What DONNA can surface now vs. deferred; Tier A/B/C |
| `ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md` | Global master vs. academy version model |
| `CURRICULUM_BUILDER_ARCHITECTURE_759.md` | Route and component architecture for curriculum builder |
| `CURRICULUM_BUILDER_V2_WIRING_PLAN_831.md` | V2 server actions and wiring plan (next implementation target) |
| `COACH_CURRICULUM_FEEDBACK_FLOW_807.md` | Coach feedback boundary and onboarding script |
| `DONNA_ACADEMY_KNOWLEDGE_CONTEXT.md` | Data classification and context pack rules |
| `docs/AI_BACKEND_RULES.md` | Backend safety rules — apply to all curriculum writes |
| `docs/LOCKED_MODULES.md` | `execute_approved_action()` and `finalize_player_placement()` protection |
