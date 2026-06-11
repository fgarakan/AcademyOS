# DONNA Intelligence Routing Standard V1

**Status:** Active — applies to every DONNA feature sprint from Mega Sprint 1716 onward.
**Established:** 2026-06-11

---

## Core Rule

DONNA must never answer or act from a single narrow module when broader academy intelligence is available.

Every DONNA workflow must check which intelligence layers are relevant before producing an answer, draft, recommendation, or action.

If data for a relevant layer is unavailable, DONNA must acknowledge the gap — not silently omit it.

---

## The 7 Intelligence Layers

### Layer 1 — Academy DNA

What the academy fundamentally is: its model, philosophy, and operating rules.

**Source:** `academies.settings.academy_dna`
**Loaded by:** `donnaAcademyProfileContext.ts`, `donnaOnboardingContextPack.ts`
**Key fields:** `inferred_model`, `player_mix`, `family_priorities`, `age_groups`, `stage_priorities`, `priority_edge`, `advancement_approval`, `parent_transparency`, `defaults`
**Used for:** Content emphasis, tone calibration, pathway weighting, stage priority signals, advancement rule enforcement

### Layer 2 — Curriculum Intelligence

The structure, content, health, and gaps in the academy's curriculum.

**Sources:** `curriculum_content_items`, `curriculum_levels`, `curriculum_gates`, `academy_curriculum_overrides`
**Loaded by:** `curriculumStructuralGapLoader.ts`, `curriculumBottleneckLoader.ts`, `curriculumTemplateCoverageGapDetector.ts`, `curriculumImprovementEngine.ts`
**Key intelligence:** Item counts per level, content-type coverage, gate dependencies, pending modifications, stale content, bottleneck levels
**Used for:** Gap detection, item suggestions, modification safety checks, placement reasoning

### Layer 3 — Player Intelligence

The current state of development across the player population.

**Sources:** `academy_player_profiles`, `player_assessments`, `player_curriculum_progress`, `level_readiness` engine
**Loaded by:** `directorPlayersDonnaIntelligence.ts`, `playerProgressStallDetector.ts`, `playerAttentionRiskLoader.ts`
**Key intelligence:** Current levels, readiness signals, stall patterns, assessment evidence, who is affected by curriculum changes
**Used for:** Impact assessment on changes, prioritizing additions, validating moves

### Layer 4 — Coach Intelligence

How coaches are executing the curriculum and where they are struggling.

**Sources:** `session_blocks`, `session_wraps`, `coach_session_wraps`, `session_template_blocks`
**Loaded by:** `donnaCoachIntelligence.ts`, `coachSupportLoader.ts`
**Key intelligence:** Which content items are actively being used, execution frequency, wrap-up gaps, coach consistency patterns
**Used for:** Validating removals (is it in active use?), identifying gaps in delivery, surfacing underused items

### Layer 5 — Memory Intelligence

Decisions, preferences, and patterns the director has established over time.

**Sources:** `academies.settings.academy_dna.onboarding_conversation`, `academies.settings.donna_curriculum_memory`
**Loaded by:** `donnaMemoryPolicy.ts`, `donnaSemanticMemory.ts`, `donnaChatSessionMemory.ts`
**Key intelligence:** Previous curriculum decisions, approved preferences, recurring concerns, dismissed suggestions, past rejection patterns
**Used for:** Pre-filling decisions DONNA already knows, avoiding re-asking settled questions, surfacing pattern contradictions
**Categories in use:** `academy_operation`, `recommendation_outcome`, `user_preference`

**Extended in Mega Sprint 1746–1775 — Philosophy Memory Layer:**
**Sources:** `academies.settings.donna_philosophy_memory[]`, `academies.settings.donna_decision_patterns[]`, `academies.settings.donna_identity_profile`
**Loaded by:** `academyPhilosophyMemory.ts`, `academyPreferenceExtractor.ts`, `academyDecisionPatterns.ts`, `academyIdentityProfile.ts`
**Key intelligence:** Behavioral preference model (what the academy actually prefers vs. states), identity profile (10 dimensions, hierarchy-weighted), drift detection, reality overrides, evolution timeline
**Used for:** Personalizing recommendations to match observed academy preferences, detecting philosophy drift, surfacing blind spots, answering evolution questions
**Intelligence hierarchy enforced:** Reality (player evidence) > Evidence (behavioral patterns) > Memory (decision history) > Philosophy (DNA) > Inference

### Layer 6 — Insight Intelligence

Cross-layer patterns that reveal blind spots, contradictions, and opportunities.

**Sources:** All layers, combined
**Loaded by:** `donnaInsightEngine.ts`, `intelligence/academyIntelligenceEngine.ts`
**Key intelligence:** `curriculum_coverage_gap`, `assessment_coverage_gap`, `advancement_eligible_waiting`, `stall_detected`, `recommendation_rejection_pattern`
**Used for:** Surfacing what the director may not have noticed, flagging contradictions between intent and current state, identifying high-leverage opportunities

### Layer 7 — Safety / Permission Intelligence

What is allowed, what requires approval, and what must never change.

**Sources:** `curriculum_content_items.academy_id` (global spine), `curriculum_gates`, `donnaApprovalGate.ts`, `donnaRoleBoundaries.ts`
**Loaded by:** `donnaTrustBoundaryValidator.ts`, `levelReadinessGuardrails.ts`
**Key rules:**
- Global curriculum items (`academy_id IS NULL`) can never be directly mutated — override records only
- All curriculum changes → `review_queue` approval level
- Level movement → `director_approval` level
- Parent/player-visible content requires explicit transparency check
- `execute_curriculum_override()` is the only execution path (V1: `target_type = 'content_item'` only)

---

## The Routing Checklist

Every DONNA feature must answer all 6 questions before any code is written.

| # | Question | What it produces |
|---|---|---|
| 1 | What is the user asking? | Intent classification |
| 2 | Which intelligence layers are relevant? | Layer activation set |
| 3 | What data should be loaded? | Concrete query plan |
| 4 | What should DONNA not assume? | Data gap acknowledgements |
| 5 | What requires approval? | Approval gate level |
| 6 | What memory should be created after approval? | Memory entry schema |

---

## Existing Infrastructure — Do Not Rebuild

The following modules implement the standard. New features must use these, not replace them.

| Capability | Module |
|---|---|
| Intent classification | `donnaIntentClassifier.ts`, `donnaIntentRouterV1.ts` |
| Global intent routing | `donnaGlobalIntentRouter.ts` (34 interceptors) |
| Approval gating | `donnaApprovalGate.ts` — `requireDonnaApproval()` |
| Memory policy | `donnaMemoryPolicy.ts` — `DONNA_MEMORY_RETENTION_POLICIES` |
| Insight generation | `donnaInsightEngine.ts` — `generateDonnaInsights()` |
| Cross-layer intelligence | `intelligence/academyIntelligenceEngine.ts` — `buildAcademyIntelligenceReport()` |
| Curriculum health | `curriculumImprovementEngine.ts` — `analyzeCurriculumImprovements()` |
| Philosophy memory | `academyPhilosophyMemory.ts` — `buildPhilosophyMemoryFromBehavior()` |
| Preference model | `academyPreferenceExtractor.ts` — `extractAcademyPreferences()`, `personalizeRecommendation()` |
| Decision patterns | `academyDecisionPatterns.ts` — `buildCurriculumDecisionPatterns()`, `summarizeDecisionPatterns()` |
| Identity profile | `academyIdentityProfile.ts` — `buildAcademyIdentityProfile()`, `buildRealityOverrideAnalysis()` |
| Evolution timeline | `academyEvolutionTimeline.ts` — `buildAcademyEvolutionTimeline()`, `detectPhilosophyDrift()` |
| Evolution questions | `academyEvolutionQuestions.ts` — `buildFullEvolutionAnswerSet()`, `answerEvolutionQuestion()` |
| Curriculum bottlenecks | `intelligence/curriculumBottleneckIntelligence.ts` |
| Player readiness | `intelligence/progressionIntelligence.ts` |
| Coach impact | `intelligence/coachImpactIntelligence.ts` |
| Role boundaries | `donnaRoleBoundaries.ts` |
| Safety validation | `donnaTrustBoundaryValidator.ts` |
| Response composition | `donnaResponseComposer.ts` |
| Context resolver | `donnaContextResolver.ts` |

---

## Behavior Rules

These rules apply to every DONNA answer, draft, or recommendation produced under this standard.

**Context-first:** DONNA loads all relevant intelligence layers before composing a response. Responses must reflect what DONNA already knows from context — not begin from scratch.

**Inference before asking:** If a field can be inferred from academy DNA, curriculum state, or memory, DONNA fills it and states the inference. DONNA only asks for what it genuinely cannot determine.

**Evidence-backed:** Every recommendation must include: what DONNA observed, how many players/sessions support the signal, confidence level (high/medium/low), and what will happen if approved.

**Insight surfacing:** If a relevant insight exists from Layer 6 (cross-layer), it must be surfaced — even if the director did not ask for it.

**Approval transparency:** DONNA must state the approval path before the user confirms. "This will go to your review queue — nothing changes until you approve it."

**Layer gap acknowledgement:** If a relevant layer cannot be loaded (no data, no access), DONNA must acknowledge the gap: "I can see your curriculum structure but don't have recent coach session data — my suggestions are based on curriculum coverage only."

**No wizard pattern:** DONNA never presents a fixed sequence of questions when it already has context that answers some of them. Sequential questions are only used for genuinely unknown fields.

---

## What This Standard Is Not

- It is not a replacement for the existing 34-interceptor pipeline.
- It is not a new intent classifier — extend `DonnaUnifiedIntentType` instead of building a new one.
- It is not a new approval system — use `requireDonnaApproval()` from `donnaApprovalGate.ts`.
- It is not a new memory system — use `DonnaMemoryCategory` from `donnaMemoryPolicy.ts`.

---

---

## DONNA Architect Versioning

### V1 — Deterministic Architect (current)

All DONNA responses are produced by pure TypeScript: keyword scoring, pattern matching, confidence thresholds, and context inference from loaded data. Same context always produces the same output.

**Properties:**
- No LLM calls
- No latency beyond the DB queries that load context
- Deterministic — auditable, testable, predictable
- Handles all mutation intents (Add, Modify, Move, Expand, Replace, Remove)
- Limited on open-ended analysis ("explain why this is structured this way")

**When to use:** Any DONNA feature where the answer can be derived from structured data and pattern matching. All curriculum mutations. All recommendation surfaces. All approval-gated drafting flows.

### V2 — LLM-Assisted Architect (deferred)

DONNA routes specific intents through an LLM call, using `CurriculumIntelligenceContext` (or equivalent) as the grounding payload. The LLM reasons over open-ended questions that deterministic logic cannot reliably handle.

**Properties:**
- Requires LLM orchestration layer to be production-ready
- Higher latency — reserved for intents where quality of reasoning matters more than speed
- Grounded by structured context — the LLM cannot invent academy data not in the payload
- All approval gates remain — LLM cannot bypass `requireDonnaApproval()`
- Handles: curriculum_review, curriculum_compare, curriculum_explain, curriculum_recommend, curriculum_audit

**Implementation gate:** Do not implement V2 intents until the LLM orchestration layer is production-stable and the grounding payload contract is defined. Route V2 intents to a "Coming soon" response in the meantime.

---

## Curriculum Intent Map

All 11 curriculum intents registered in `donnaIntentRouterV1.ts`. Intents marked V2-deferred are registered but not yet implemented.

### Mutation Intents — V1 Implemented

| Intent | `DonnaUnifiedIntentType` | Approval | `override_type` | Description |
|---|---|---|---|---|
| Add | `curriculum_draft_create` | `review_queue` | `add` | Create a new content item at a level |
| Modify | `curriculum_modify` | `review_queue` | `update` + `target_id` | Change fields on an existing item |
| Move | `curriculum_move` | `review_queue` | `update` + new `level_id` | Relocate an item to a different level |
| Expand | `curriculum_expand` | `review_queue` | `add` | Create a harder or easier variation |
| Replace | `curriculum_replace` | `review_queue` × 2 | `remove` + `add` | Swap out an item for a new one |
| Remove | `curriculum_remove` | `review_queue` | `remove` + `target_id` | Delete an existing item |

All mutations go through `academy_curriculum_overrides` (status: `pending_review`) and are executed via `execute_curriculum_override()`.

### Read / Analysis Intents — V2 Deferred

| Intent | `DonnaUnifiedIntentType` | Approval | Description |
|---|---|---|---|
| Review | `curriculum_review` | none | Show current state of a level or pathway |
| Compare | `curriculum_compare` | none | Compare two levels, pathways, or periods |
| Explain | `curriculum_explain` | none | Explain why something is structured as it is |
| Recommend | `curriculum_recommend` | none | Suggest curriculum additions or changes |
| Audit | `curriculum_audit` | none | Full curriculum health audit with gap analysis |

These intents are registered in `donnaIntentRouterV1.ts` and will route to a "Coming soon" response until the LLM orchestration layer is ready. They require no approval because they produce no mutations.

---

## Enforcement

Before any new DONNA feature sprint begins:

1. Run the Routing Checklist for every intent the feature handles.
2. Verify that no existing module is being rebuilt.
3. Verify that the approval gate is correct (`donnaApprovalGate.ts`).
4. Verify that memory entries use existing `DonnaMemoryCategory` values or explicitly justify a new one.

This document must be read at the start of every DONNA-related sprint.
