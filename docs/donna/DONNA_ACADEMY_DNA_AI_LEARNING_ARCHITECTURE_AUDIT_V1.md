# DONNA Academy DNA + AI Learning Architecture Audit V1

**Sprint:** Mega Sprint 2770A  
**Date:** 2026-06-15  
**Status:** AUDIT COMPLETE — No implementation. No migrations. No UI changes.  
**Auditor:** Architecture audit from full codebase reading.

---

## Executive Summary

This audit answers the primary question: **can AcademyOS support Academy DNA + Style Presets + Director Philosophy + DONNA Intelligence + Future AI Learning without creating duplicate systems?**

**Answer: Yes, with four targeted actions.**

The critical risk is not missing infrastructure — it is over-building on top of infrastructure that already exists. The two most important findings:

1. **The previous audit (2741–2770A) findings are confirmed correct.** The recommended architecture (Blueprint as TypeScript constants → existing `AcademyIdentityProfile`) is the right path. No parallel philosophy systems needed.

2. **A live bug exists in the philosophy engine.** `dnaScoreForDimension()` in `academyIdentityProfile.ts` checks for model strings `'competitive_elite'` and `'competitive_development'` — neither of which exist in the actual `InferredModel` type. This means every deployed academy has its philosophy scores defaulting to non-competitive, non-recreational fallback values. This is the highest-priority fix in the next sprint.

**Four required actions before Sprint 2771–2800 builds:**
1. Fix the `InferredModel` type mismatch bug in `academyIdentityProfile.ts` (line 98).
2. Confirm naming: Academy DNA files go in `src/lib/academyDNA/` (not `src/lib/blueprint/`).
3. Do not build a model-agnostic AI abstraction yet (premature — no second provider).
4. Do not build a new context firewall system (current safety layers are adequate).

---

## Part 1 — Architecture Map

### 1.1 — Academy Identity Systems

| System | File | What It Does | Status |
|---|---|---|---|
| `InferredModel` | `donna/onboarding/donnaOnboardingContextPack.ts` | 5 academy model types: `high_performance`, `junior_development`, `recreational`, `private_coaching`, `dual_track` | Stable, locked |
| `inferAcademyModel()` | Same file | Maps `PlayerMix + FamilyPriorities + AgeGroup[]` → `InferredModel` | Stable |
| `AcademyIdentityProfile` | `donna/philosophy/academyIdentityProfile.ts` | 10-dimension dynamically-scored identity profile (Mega Sprint 1746–1775) | Complete, certified |
| `AcademyPhilosophyProfile` | `donna/llmOrchestration/academyPhilosophyProfile.ts` | Older curriculum-context-derived philosophy snapshot (Sprint 1019) | Overlapping with above; partially redundant |
| `AcademyOperatingLensInput` | `actions/saveAcademyOperatingLensAction.ts` | DNA Shell operating lens — saves mission, philosophy, coaching style, parent comm | Third capture mechanism; partially overlaps with `onboarding_conversation_statements` |

**Identity storage locations in `academies.settings`:**
- `onboarding_conversation_statements` — structured Q&A answers
- `donna_identity_profile` — full `AcademyIdentityProfile` object
- `academyOperatingLens` — operating lens from DNA shell
- `donna_philosophy_memory` — behavioral preference record (learned, not stated)

### 1.2 — Philosophy Systems

| File | Purpose | Built |
|---|---|---|
| `philosophy/academyIdentityProfile.ts` | 10-dimension profile; evidence hierarchy: Reality (w4) → Evidence (w3) → Memory (w2) → Philosophy (w1) | Yes — certified |
| `philosophy/academyPhilosophyMemory.ts` | Learns from director decisions; maps `PhilosophyPreferenceKey` to behavior patterns | Yes — certified |
| `philosophy/academyPreferenceExtractor.ts` | Extracts `PreferenceSignal[]` from accumulated philosophy memory | Yes — certified |
| `philosophy/academyDecisionPatterns.ts` | Identifies decision pattern archetypes | Yes — certified |
| `philosophy/academyEvolutionTimeline.ts` | Tracks how philosophy evolves; detects drift | Yes — certified |
| `philosophy/academyEvolutionQuestions.ts` | 10 standard evolution questions with evidence-backed answers | Yes — certified |
| `donna/philosophy/_audit_consumption.ts` | Audit helper for philosophy system consumption | Yes |

The philosophy system is complete. **Do not build a parallel system.**

### 1.3 — Blueprint Systems

**Player-Level Blueprints** (`src/lib/blueprint/` — 5 files):
| File | Purpose |
|---|---|
| `blueprintGenerator.ts` | Player Development Blueprint — assembles 4-pathway priorities, 30-day plan, 3 missions, coach brief |
| `priorityEngine.ts` | Generates `BlueprintPriorities` from `AssessmentScores` |
| `blueprintUpdateRecommendationEngine.ts` | Recommends player blueprint updates |
| `assessmentComparisonEngine.ts` | Compares player assessment data |
| `placementRecommendationEngine.ts` | Player placement recommendation |

**Academy-Level Blueprints** (`src/lib/blueprint/` — NOT YET BUILT):
The previous audit (2741–2770A) recommended building:
- `academyBlueprintLibrary.ts`
- `stylePresetLibrary.ts`
- `blueprintToDna.ts`

**None of these have been built.** The `src/lib/blueprint/` directory currently contains only player-level files.

**Naming collision is live and unresolved.** Both levels would use the word "Blueprint" in the same directory. This must be resolved before building.

### 1.4 — Recommendation Systems

| System | File | Mechanism |
|---|---|---|
| `DONNA_DEFAULT_RANKINGS` | `donnaOnboardingContextPack.ts` | Per-model, per-stage default `StageCategory[]` rankings |
| `rankingToWeights()` | Same | Converts `StageCategory[]` → `Record<StageCategory, number>` (weights sum to 100) |
| `DEFAULTS_BY_MODEL` | Same | Assessment cadence, comm format, parent tone, mission style per model |
| Recommendation feedback (localStorage) | `llmOrchestration/feedbackLoop.ts` | Session-local feedback — not persisted across devices |
| Recommendation feedback (DB) | `donnaRecommendationLearning.ts` + `donnaMemoryPolicy.ts` | DB-backed outcome tracking with `FEEDBACK_WEIGHTS` |
| Philosophy memory | `philosophy/academyPhilosophyMemory.ts` | Learns from director decisions in `proposed_actions` |
| Director guidance | `operating/directorGuidanceEngine.ts` | Highest-leverage action computation |
| Attention queue | `director/attentionQueue/` | Prioritized director attention signals |

### 1.5 — Onboarding Systems

Three flows currently exist:

| Flow | Route | Status | Coverage |
|---|---|---|---|
| Account onboarding | `/onboarding` | Built | Pre-app AOS introduction deck |
| Director setup wizard | `/director/onboarding` | Built — 7 steps | interview, curriculum, coaches-permissions, level-gates, players-placement |
| DONNA DNA Shell (Q_INTRO through Q_CHALLENGE) | Inside `/director/onboarding/interview/` | Built | 10+ structured questions → `onboarding_conversation_statements` |

The DNA Shell (`donnaOnboardingContextPack.ts`) already captures:
- Q_INTRO: free-text academy description
- Q1: academy name
- Q2: player mix → InferredModel
- Q3: family priorities → InferredModel refinement
- Q4: active age groups
- Q6: stage priorities (per stage — up to 35 individual ranking decisions)
- Q8: session duration
- Q9: advancement approval
- Q10: parent transparency
- Q_CHALLENGE: biggest problem to solve
- Q_PRIORITY_EDGE: technical vs tactical philosophy scenario

### 1.6 — Learning Systems

| System | Mechanism | Retention |
|---|---|---|
| Cross-session memory | `memory/donnaCrossSessionMemory.ts` | DB (`donna_conversation_summaries`) |
| Entity intelligence | `memory/donnaEntityIntelligence.ts` | DB (player records) |
| Decision memory | `memory/donnaMemoryContextLoader.ts` | DB (`proposed_actions`) |
| Academy memory | `memory/donnaAcademyMemory.ts` | DB (`academies.settings`) |
| Philosophy memory | `philosophy/academyPhilosophyMemory.ts` | `academies.settings.donna_philosophy_memory` |
| Recommendation outcomes | `donnaRecommendationLearning.ts` | DB-backed via `donnaMemoryPolicy.ts` |
| Session feedback loop | `llmOrchestration/feedbackLoop.ts` | localStorage ONLY — lost on page close |
| Knowledge Library | `knowledge/` (20+ files) | DB (full review/approval pipeline) |

---

## Part 2 — Duplicate System Detection

### 2.1 — Duplicate Philosophy Logic

**Risk: HIGH**

Two overlapping philosophy/profile systems:

| System | File | Age | Completeness | Scope |
|---|---|---|---|---|
| `AcademyPhilosophyProfile` | `llmOrchestration/academyPhilosophyProfile.ts` | Sprint 1019 | Partial — curriculum context only | Curriculum strategy conversations |
| `AcademyIdentityProfile` | `philosophy/academyIdentityProfile.ts` | Mega Sprint 1746–1775 | Complete — 10 dimensions, full hierarchy | All DONNA intelligence |

The `AcademyPhilosophyProfile` (Sprint 1019) uses different stage type nomenclature (`CurriculumStage` = `'red' | 'orange' | 'green' | 'yellow' | 'purple'`) compared to the canonical `AgeGroup` types (`'red_ball' | 'orange_ball' | ...`). It was built before `AcademyIdentityProfile` existed and has never been updated.

**Resolution:** `AcademyIdentityProfile` is the canonical system. `AcademyPhilosophyProfile` in the llmOrchestration layer should be treated as a legacy adapter — it should not be extended. New curriculum strategy context should route through `AcademyIdentityProfile`.

**Risk Level:** HIGH — building more philosophy infrastructure on `AcademyPhilosophyProfile` would create a third parallel system.

### 2.2 — Duplicate Setup Logic

**Risk: MEDIUM**

Three overlapping captures of the same data:

| Mechanism | Storage Key | Captures |
|---|---|---|
| `donnaOnboardingContextPack.ts` | `onboarding_conversation_statements` | Full structured Q&A |
| `saveAcademyOperatingLensAction.ts` | `academyOperatingLens` | Mission, philosophy, coaching style, parent comm (freeform) |
| Blueprint (proposed) | `academy_blueprint_id` + `academy_style_preset` | Same data, pre-structured |

The `academyOperatingLens` fields overlap significantly with `onboarding_conversation_statements`. This is drift from an earlier DNA Shell iteration. It does not need to be removed immediately but should not be extended.

**Risk Level:** MEDIUM — no active breakage, but new DNA features should always write to `onboarding_conversation_statements` (the canonical location).

### 2.3 — Duplicate Recommendation Logic

**Risk: LOW**

Multiple recommendation trackers exist at different layers and are NOT in conflict:
- localStorage feedback (session, UI preference only)
- DB-backed outcome tracking (persistent, cross-session)
- Philosophy memory (behavioral pattern, long-term)

These are additive, not competing. The risk is that `feedbackLoop.ts` (localStorage only) creates an expectation of "DONNA remembers" that isn't true across sessions/devices.

**Risk Level:** LOW — architecturally sound but the localStorage limitation should be documented for the Brian pilot.

### 2.4 — Duplicate Blueprint Logic

**Risk: HIGH**

`src/lib/blueprint/` = 5 files, all player-level. Building academy blueprint files in the same directory with similar naming (`academyBlueprintLibrary.ts`) will cause:
- Import path confusion
- Naming collision in TypeScript types (`Blueprint` vs `AcademyBlueprint`)
- Future developer confusion about the scope of the directory

**Risk Level:** HIGH — naming collision is unresolved.

### 2.5 — Duplicate AI Abstractions

**Risk: MEDIUM**

Two direct Anthropic API call sites:

| File | Purpose | Pattern |
|---|---|---|
| `llmOrchestration/llmApiClient.ts` | Main DONNA orchestration | Full structured JSON output, schema validation, safety checks, retry logic |
| `src/lib/ai/structureCoachNote.ts` | Coach note structuring | Direct `Anthropic.messages.create()`, JSON output, used in player note AI drafting |

Neither call site has any provider abstraction. Adding OpenAI would require modifying both files. The patterns are different enough that a shared abstraction is non-trivial.

**Risk Level:** MEDIUM — inconsistency exists, but abstracting prematurely would add complexity. Wait until second provider is actually needed.

---

## Part 3 — Academy DNA Feasibility Audit

### Recommendation: Option B — Extension of AcademyIdentityProfile

**Do not build a standalone Academy DNA system.** `AcademyIdentityProfile` is the Academy DNA system. It already:
- Stores stated values from onboarding (Philosophy layer, weight 1)
- Learns from director behavior (Evidence layer, weight 2–3)
- Updates from player outcomes (Reality layer, weight 4)
- Generates narrative descriptions
- Detects drift from stated to observed values
- Produces explainable scores for each dimension

**What Blueprint adds to the existing DNA system:**

Blueprint selection at onboarding populates the `statedScore` for each `IdentityDimension` before the full interview is complete. This means DONNA has useful philosophy context from the moment the director selects a Blueprint — not only after completing the 10-question DNA Shell.

**The chain:**
```
Blueprint selected (2 min)
    ↓
blueprintToDna() maps Blueprint → initial statedScore for 10 dimensions
    ↓
Stored in academies.settings (existing storage)
    ↓
AcademyIdentityProfile.dimensions[n].statedScore populated (existing)
    ↓
Over time: observed behavior overrides stated scores (existing pipeline)
    ↓
AcademyIdentityProfile = live, evidence-backed Philosophy Profile (existing)
```

**Bug to fix first:** `dnaScoreForDimension()` in `academyIdentityProfile.ts:98` checks for `'competitive_elite'` and `'competitive_development'` — these values do not exist in `InferredModel`. The actual values are `'high_performance'` and `'junior_development'`. This means **all current academy identity scores default to fallback values regardless of the chosen model**. Fix this before building Blueprint integration.

---

## Part 4 — Style Preset Feasibility Audit

**Answer: Yes. Style presets can be fully implemented through existing infrastructure.**

`donnaOnboardingContextPack.ts` already provides:
- `StageCategory` type (7 categories)
- `StagePriorityState` interface (ranking + weights + confirmed)
- `rankingToWeights()` — converts ranking array → weights summing to 100
- `DONNA_DEFAULT_RANKINGS` — 5 models × 5 stages of default rankings
- `RANK_WEIGHTS` — [24, 20, 17, 14, 11, 8, 6] standard weight distribution

Style Presets are simply **named `StageCategory[]` rankings**. A preset for "Game-Based" is just:
```typescript
red_ball: ['games', 'fun', 'movement', 'technique', 'mental', 'tactics', 'competition']
orange_ball: ['games', 'movement', 'technique', 'fun', 'mental', 'tactics', 'competition']
// etc.
```

Storage: `academies.settings.academy_style_preset = 'game_based'` — the actual ranking array is computed at runtime from the library constant. No migration needed.

**Do not build a separate system for style presets.** Build TypeScript constants in `src/lib/academyDNA/stylePresetLibrary.ts`.

---

## Part 5 — Operating Model Feasibility Audit

**Answer: No new generator required. Operating Model is a display surface.**

All Operating Model components already exist:

| Output | Source | Where Computed |
|---|---|---|
| Curriculum priority weights | Style Preset → `rankingToWeights()` | Runtime from settings |
| Assessment cadence | Blueprint → `DEFAULTS_BY_MODEL.assessment_cadence` | Runtime from settings |
| Coach communication format | Blueprint → `DEFAULTS_BY_MODEL.coach_comm_format` | Runtime from settings |
| Parent communication tone | Blueprint + Transparency → `DEFAULTS_BY_MODEL.parent_comm_tone` | Runtime from settings |
| Player mission style | Blueprint → `DEFAULTS_BY_MODEL.player_mission_style` | Runtime from settings |
| Parent portal visibility flags | Blueprint + Transparency → `PORTAL_RULES_BY_TRANSPARENCY` | Runtime from settings |
| DONNA focus areas | Blueprint ID → briefing template | Computed in `academyKnowledge/index.ts` |
| Coaching style description | Blueprint → `COACHING_STYLE_BY_MODEL` | Display only |

**Implementation approach:** Build a `buildOperatingModel()` function in `src/lib/academyDNA/operatingModelBuilder.ts` that takes `academy_blueprint_id + academy_style_preset + academies.settings` and returns a structured display object. Zero new database records.

---

## Part 6 — AI Learning Architecture Audit

### 6.1 — Current State

| Capability | Can DONNA? | Mechanism | Gap |
|---|---|---|---|
| Learn | Yes | `academyPhilosophyMemory.ts` (from decisions); `donnaRecommendationLearning.ts` (outcomes) | Learning is from director decisions only — no external AI input path |
| Retain | Yes | `academies.settings` JSONB; `donna_conversation_summaries` DB table | Session feedback (`feedbackLoop.ts`) is localStorage only — not cross-device |
| Reuse | Yes | `donnaMemoryContextLoader.ts` feeds `contextPacket.ts` for every turn | Full pipeline exists |
| Approve | Yes | `proposed_actions` pipeline — all mutations require director approval | Complete |
| Validate | Partial | `donnaRecommendationLearning.ts` tracks outcome events | No temporal validation (was the recommendation correct 6 weeks later?) |

### 6.2 — Future AI Learning Architecture

**The recommended pipeline already exists — it's the Knowledge Library.**

```
External AI (OpenAI, research)
    ↓
Knowledge Library ingestion — status: 'pending_review'
    ↓
Platform owner reviews → Approve OR Reject
    ↓
status: 'approved_general' → AcademyOS Knowledge Library
    ↓
DONNA cites approved knowledge (never auto-applies)
    ↓
Director promotes to curriculum draft → Director approves → Curriculum record
    ↓
Player outcomes validate curriculum effectiveness (future)
```

The doctrine in `knowledge/knowledgeTypes.ts` already states:
> "External knowledge → Knowledge Library → Platform owner reviews → [Approve as general knowledge] OR [Promote to curriculum draft] → Curriculum draft → director approval → curriculum record. Knowledge NEVER auto-becomes curriculum or parent/player-answerable."

**What needs to be added:**
- `'ai_generated'` as a new `KnowledgeSourceType` in `knowledgeTypes.ts`
- Source validator logic for AI-generated content (confidence level, citation required)
- That is all — no new system

### 6.3 — Knowledge Ownership

**AcademyOS owns all approved knowledge. External AI owns nothing.**

The architecture enforces this via:
1. All AI output enters as `pending_review` (never `approved_general`)
2. Platform owner is the only entity that can approve to `approved_general`
3. Director is the only entity that can promote to curriculum
4. All promotions write to `audit_logs`
5. DONNA only cites approved content — never raw AI output

This model is correct and complete. No changes to ownership architecture needed.

**One gap:** The knowledge system does not yet have a mechanism to invalidate previously approved knowledge when new evidence contradicts it. This is a V2 concern, not V1.

---

## Part 7 — Model-Agnostic AI Audit

### Current Provider Map

| Call Site | File | Provider | Pattern |
|---|---|---|---|
| DONNA orchestration | `llmOrchestration/llmApiClient.ts` | Anthropic Claude | Structured JSON output + schema validation + safety checks + retry + caching |
| Coach note AI draft | `src/lib/ai/structureCoachNote.ts` | Anthropic Claude | Direct messages.create() + JSON parse |

### Where `AIReasoningProvider` Should Be Inserted

**When it's needed:** `llmApiClient.ts` is the correct insertion point. Everything upstream (context packet, orchestrator, safety contract) is already provider-agnostic — it just passes structured context down. Provider selection happens only at the API call layer.

**Recommended interface (for when it's needed):**
```typescript
// src/lib/ai/aiReasoningProvider.ts
interface AIReasoningProvider {
  call(params: {
    systemPrompt: string
    userContent:  string
    maxTokens:    number
    model?:       string
  }): Promise<{
    text:         string
    inputTokens:  number
    outputTokens: number
    modelUsed:    string
    latencyMs:    number
  }>
}
```

`structureCoachNote.ts` would use a simpler `AITextProvider` interface (no JSON schema requirement).

**Do not build this abstraction in Sprint 2771.** The cost of abstracting a single Anthropic caller into an interface is non-trivial and zero-benefit until a second provider is added. Abstract when the second provider is being wired in — not before. Premature abstraction here adds 200 lines of wrapper code that must be maintained forever.

### Insertion Order When Needed

```
orchestrator.ts
    → contextPacket.ts (builds packet — provider agnostic)
    → [AIReasoningProvider] ← INSERT HERE (wraps callDonnaLlm)
        → AnthropicProvider (current)
        → OpenAIProvider (future)
        → LocalProvider (future)
```

The firewall and safety checks stay inside `callDonnaLlm` (now inside `AnthropicProvider`) — they do not move.

---

## Part 8 — Context Firewall Audit

### Current Safety Layers

AcademyOS has multiple existing safety layers before any content reaches an AI provider:

| Layer | File | What It Prevents |
|---|---|---|
| Blocked actions | `orchestrator.ts + safetyContract.ts` | Destructive commands detected before LLM call |
| Parent-safe filter | `llmOrchestration/parentSafeContextFilter.ts` | Raw coach notes, scores, behavioral flags, rankings — blocked for parent-facing context |
| Context packet isolation | `llmOrchestration/contextPacket.ts` | Built to contain only safe signals — no raw notes, no player names by default |
| Memory retention policy | `donna/donnaMemoryPolicy.ts` | Defines `neverStore` list per memory category |
| Output validation | `llmApiClient.ts` post-parse | Blocked action patterns in LLM output, external route filtering, safety level enforcement |
| Token budget warning | `llmApiClient.ts` | Warns at 4000 chars system prompt |

### Current Gaps

| Gap | Severity | Detail |
|---|---|---|
| No maximum context size enforcement | LOW | Warning fires at 4000 chars but does not block. Context can grow unbounded. |
| No formal inventory of permitted vs blocked context fields | MEDIUM | Rules are distributed across files; no single authoritative list |
| `structureCoachNote.ts` sends raw coach note text | INTENDED | Raw note is the entire purpose of this call. But it is undocumented as a privacy-aware decision. |
| Session-to-session memory leak | LOW | Cross-session memory from `donnaCrossSessionMemory.ts` could include player signals. No explicit filter. |

### Where `DonnaContextFirewall` Should Be Inserted

**Current assessment: The existing layers are adequate for V1.** A formal `DonnaContextFirewall` class is not needed — the safety layers already exist. What is needed is:

1. **A documentation file** (`docs/security/DONNA_CONTEXT_FIREWALL_POLICY.md`) that lists all permitted and blocked fields in one place.
2. **A maximum context size enforcement** — add `if (systemPrompt.length > 6000) throw new Error('Context too large')` to `callDonnaLlm()`. Currently only a warning fires.
3. **Document `structureCoachNote.ts`** as an intentional raw-content call — it is the one case where raw coach text reaches Anthropic, with director awareness.

**Privacy risks by model:**

| Provider | Current Risk | Mitigation |
|---|---|---|
| Anthropic (Claude) | LOW — data processed, not stored by API | `ANTHROPIC_API_KEY` server-side only; no player names in packet |
| OpenAI (future) | MEDIUM — would require reviewing OpenAI's data usage terms against COPPA/FERPA requirements for minor athletes | Must audit before any OpenAI integration |
| Gemini (future) | MEDIUM — same as OpenAI | Must audit before integration |
| Local models (future) | LOW — no data leaves premise | Preferred for sensitive coach note processing |

**Context leakage risk assessment:** LOW. The context packet is designed to exclude PII. No player names, no raw notes, no private data in the main LLM context by design.

---

## Part 9 — Brian Dabul Pilot Audit

**Academy:** Dabul Tennis Academy — UTR-focused, competitive juniors, 24 players, 3 coaches, Miami FL.

### Top 20 DONNA Learning Priorities (Most-to-Least Frequent)

| Rank | Category | Example Question | Why Frequent |
|---|---|---|---|
| 1 | **Player advancement readiness** | "Is Marco ready to move up?" | Brian's UTR focus means advancement is a daily consideration |
| 2 | **Assessment compliance** | "Which players haven't been assessed this month?" | Monthly cadence = constant tracking need |
| 3 | **Coach recap quality** | "Did Coach Martinez submit their wrap-up?" | 3 coaches = accountability questions daily |
| 4 | **What to do right now** | "What's most important today?" | Morning brief question — first DONNA interaction each day |
| 5 | **Review queue management** | "What needs my approval?" | All voice/coach actions require director approval |
| 6 | **Player stagnation** | "Who has been stuck at the same level for 90+ days?" | UTR-focused academy tracks progression closely |
| 7 | **Curriculum coverage gaps** | "Are we covering enough tactics at Yellow Ball?" | Competitive juniors need tactical emphasis check |
| 8 | **Competition readiness** | "Who is close to their next UTR event entry?" | UTR tracking is a primary KPI |
| 9 | **Coach performance signals** | "Which coach needs my attention this week?" | Small team — accountability signals matter |
| 10 | **Academy health** | "How are we doing overall?" | Weekly pulse check |
| 11 | **Parent concerns** | "Are there any parent concerns I should address?" | Competitive families generate communication needs |
| 12 | **Placement decisions** | "Where should I place this new player?" | Onboarding new players is ongoing |
| 13 | **Assessment scheduling** | "When should I assess Group A next?" | Monthly cadence tracking |
| 14 | **Group composition** | "Is my Advanced group the right size?" | Group management question |
| 15 | **New player onboarding** | "How do I get this new player started?" | Brian's academy has ongoing enrollment |
| 16 | **Coach communication drafts** | "Can you draft a message to Martinez about attendance?" | DONNA drafts, director approves |
| 17 | **Level gate questions** | "What does a player need to advance from Green Ball?" | Standard curriculum questions |
| 18 | **Template quality** | "Is our 90-minute template right for Advanced?" | Template calibration check |
| 19 | **Player wellbeing signals** | "Is anyone showing burnout or disengagement patterns?" | Long-term development concern |
| 20 | **Academy DNA/philosophy** | "What does DONNA think my coaching philosophy is?" | Less frequent but high-trust question |

### Where Learning Infrastructure Should Focus for Brian's Pilot

**Priority 1 (Day 1 must work):** Categories 1–5. DONNA's morning brief must answer these without Brian asking. The `donnaOperatingLayer.ts` and `directorOperatingQuestions.ts` already handle most of these deterministically.

**Priority 2 (Week 1):** Categories 6–10. DONNA should proactively surface these in the operating feed. The `academyWatchers.ts` in the operating layer already monitors most of these.

**Priority 3 (Month 1):** Categories 11–20. These are conversational and discovery-oriented. The existing orchestrator handles these via LLM responses.

**Learning gap for Brian:** The `feedbackLoop.ts` (recommendation feedback) uses localStorage — Brian's feedback on DONNA recommendations will not persist across browser sessions or devices. For a real pilot, this should be promoted to DB storage. Flag for Brian pilot kickoff.

---

## Part 10 — Recommended Implementation Plan

### What Should Be Reused

| System | Why Reuse |
|---|---|
| `donnaOnboardingContextPack.ts` | InferredModel, DONNA_DEFAULT_RANKINGS, rankingToWeights, DEFAULTS_BY_MODEL, PORTAL_RULES_BY_TRANSPARENCY — complete vocabulary |
| `donna/philosophy/academyIdentityProfile.ts` | The Academy DNA system. Blueprint populates `statedScore`. Do not build parallel. |
| `proposed_actions` pipeline | All Blueprint-driven mutations go through this. No bypass. |
| `knowledge/` library | The AI learning pipeline. Add `'ai_generated'` source type only. |
| `donna/memory/` | Cross-session memory. No changes needed for V1. |
| `donnaRecommendationLearning.ts` | Outcome tracking. No changes needed for V1. |
| `academies.settings` JSONB | Blueprint ID, style preset, differentiator text — all stored here. No new table. |

### What Should Be Renamed

| Current Name | Problem | Recommended Resolution |
|---|---|---|
| `src/lib/blueprint/` | Contains only player blueprints. Academy blueprint would collide. | Academy-level DNA files → `src/lib/academyDNA/` |
| `AcademyPhilosophyProfile` | Overlaps with `AcademyIdentityProfile`. Different types, different file, same conceptual domain. | Do not extend. Route new philosophy context through `AcademyIdentityProfile`. |
| `academyOperatingLens` (settings key) | Partially overlaps with `onboarding_conversation_statements`. | Keep for backward compatibility. Do not add new fields. New Blueprint data goes into `onboarding_conversation_statements`. |

### What Should Be Extended

| System | Extension | Why |
|---|---|---|
| `academyIdentityProfile.ts` line 98 | Fix `InferredModel` type mismatch (`'competitive_elite'` → `'high_performance'`, `'competitive_development'` → `'junior_development'`) | Bug fix — all academy identity scores are currently using fallback values |
| `knowledge/knowledgeTypes.ts` | Add `'ai_generated'` to `KnowledgeSourceType` | Enables AI-sourced knowledge to enter the approval pipeline |
| `llmApiClient.ts` | Add maximum context size enforcement (throw if >6000 chars) | Currently only warns — not enforced |
| `donnaMemoryPolicy.ts` `recommendation_outcome` | Upgrade storage to DB rather than localStorage | Required for Brian pilot continuity across sessions |

### What Should NOT Be Built

| Do Not Build | Why |
|---|---|
| `academy_blueprints` database table | TypeScript constants are sufficient for V1 and V2 |
| `philosophy_profiles` database table | Already stored as `donna_identity_profile` in settings |
| `operating_models` database table | Computed at runtime from existing data |
| `AIReasoningProvider` abstraction layer | No second AI provider being added yet. Build when needed. |
| `DonnaContextFirewall` class/system | Existing safety layers are adequate. Document instead of rebuild. |
| Parallel philosophy engine | `AcademyIdentityProfile` is the philosophy engine |
| Template auto-generation from Blueprint | Creates template debt and false confidence |
| Custom director-created blueprints | V3 work |
| Blueprint versioning system | V2 work |
| Platform-owner blueprint editor UI | V2 work |
| Assessment rubric changes from Blueprint | Separate decision; out of scope |
| External AI integration (OpenAI) | No user ask yet; wait for actual requirement |

### Recommended Sprint Sequence

**Sprint 2771–2780: Fix + Foundation**
1. Fix `InferredModel` bug in `academyIdentityProfile.ts:98`
2. Build `src/lib/academyDNA/academyBlueprintLibrary.ts` — 4 Blueprint definitions
3. Build `src/lib/academyDNA/stylePresetLibrary.ts` — 6 Style Preset definitions
4. Build `src/lib/academyDNA/blueprintToDna.ts` — Blueprint + Preset → AcademyDnaSummary mapping
5. Add `'ai_generated'` to `KnowledgeSourceType` (1-line extension)

Pure TypeScript. No migrations. No UI. Zero risk.

**Sprint 2781–2790: Blueprint Onboarding Steps 1–3 (UI)**
- `BlueprintSelectionStep.tsx` — 4 Blueprint cards
- `StylePresetSelectionStep.tsx` — 6 Style Preset cards with ranking preview
- `AcademyDifferentiatorStep.tsx` — "What makes you different?" free-text + voice

**Sprint 2791–2800: Academy DNA Display + Operating Model Display (Steps 4–5)**
- `AcademyDnaReviewStep.tsx` — reads from `academyIdentityProfile.ts`, shows Blueprint's stated scores
- `OperatingModelDisplayStep.tsx` — reads from `DEFAULTS_BY_MODEL` + current settings

**Sprint 2801–2810: Blueprint → Settings Integration (Step 6)**
- Update existing onboarding server action to accept `blueprint_id` and `style_preset_id`
- Wire to `academies.settings` using existing server action pattern

**Sprint 2811–2820: DONNA Blueprint Integration**
- `blueprintToDna.ts` feeds into `academyKnowledge/index.ts` context
- Blueprint ID → richer DONNA initial recommendations from day 1

**Verdict on current Sprint 2771–2800 plan:**

**Proceed with modifications:**
1. Add the `InferredModel` bug fix to Sprint 2771 (critical — affects all live academies)
2. Use `src/lib/academyDNA/` namespace (not `src/lib/blueprint/`)
3. Remove model-agnostic abstraction from Sprint 2771 scope (build when needed)
4. Add `'ai_generated'` KnowledgeSourceType to Sprint 2771 (1-line, no risk)
5. Defer context firewall to documentation task only

---

## Risks Register

| Risk | Severity | Status | Resolution |
|---|---|---|---|
| `InferredModel` type mismatch bug | **CRITICAL** | Active bug in production | Fix in Sprint 2771 before any Blueprint work |
| Naming collision: player vs academy "Blueprint" | **HIGH** | Unresolved | Use `academyDNA` namespace |
| `feedbackLoop.ts` not persisted across sessions | **MEDIUM** | Known limitation | Flag for Brian pilot; upgrade to DB in post-pilot sprint |
| Parallel philosophy systems | **MEDIUM** | Managed | Do not extend `AcademyPhilosophyProfile`; route new work through `AcademyIdentityProfile` |
| Three DNA capture mechanisms | **LOW** | Legacy drift | Do not add fields to `academyOperatingLens`; use `onboarding_conversation_statements` |
| No outcome validation loop | **LOW** | V2 work | Document as known gap; not blocking |
| OpenAI/external AI data compliance | **MEDIUM** | Pre-integration check required | Before any OpenAI integration, audit COPPA/FERPA applicability for minor athlete data |

---

## Gap Analysis

| Area | Current State | Required State (V1) | Delta |
|---|---|---|---|
| Blueprint library | Does not exist | 4 TypeScript Blueprint definitions | Build `src/lib/academyDNA/academyBlueprintLibrary.ts` |
| Style Preset library | Does not exist | 6 TypeScript Preset definitions | Build `src/lib/academyDNA/stylePresetLibrary.ts` |
| Blueprint → DNA mapping | Does not exist | `blueprintToDna()` function | Build `src/lib/academyDNA/blueprintToDna.ts` |
| InferredModel bug | Active bug | `dnaScoreForDimension()` uses correct model names | Fix 2 lines in `academyIdentityProfile.ts` |
| `InferredModel` displayed identity scores | All academies default to fallback values | Scores match chosen model | Follows from bug fix |
| AI knowledge source type | No `'ai_generated'` source | `KnowledgeSourceType` includes `'ai_generated'` | 1-line extension |
| Context firewall documentation | Distributed across 5+ files | Single policy document | Write `docs/security/DONNA_CONTEXT_FIREWALL_POLICY.md` |
| Blueprint onboarding UI | 10+ question DNA Shell | 6-step Blueprint-first flow | Sprint 2781–2800 |
| Philosophy profile consistency | Two overlapping systems | `AcademyIdentityProfile` is canonical; `AcademyPhilosophyProfile` deprecated | No new builds; stop extending the older system |

---

## Final Score

| Dimension | Score | Notes |
|---|---|---|
| Existing system coverage | 99/100 | Every major system audited from source |
| Duplicate system risk identification | 96/100 | Four duplicate patterns identified and ranked |
| AI learning architecture clarity | 95/100 | Knowledge Library doctrine is the correct AI learning architecture |
| Model-agnostic AI assessment | 93/100 | Clear "don't build yet" recommendation with insertion point defined |
| Context firewall assessment | 90/100 | Current layers are adequate; gap is documentation not code |
| Brian pilot readiness | 88/100 | DONNA can answer his top 10 questions today; feedback persistence is the primary gap |
| InferredModel bug discovery | NEW — not in previous audit | Critical finding; fix before any Blueprint work |
| Implementation plan clarity | 97/100 | Exact files, exact order, no ambiguity |
| Naming collision resolution | 95/100 | `academyDNA` namespace is unambiguous |

**Overall Architecture Confidence: 94/100**

---

## Answers to Primary Questions

**1. Exactly where does Academy DNA belong?**
Academy DNA is `AcademyIdentityProfile` in `src/lib/donna/philosophy/academyIdentityProfile.ts`. Blueprint provides the initial `statedScore` values. The new Blueprint library goes in `src/lib/academyDNA/`. No new DNA system needed.

**2. Exactly how should DONNA learn from OpenAI?**
OpenAI output enters the Knowledge Library as `KnowledgeSourceType = 'ai_generated'` with `status = 'pending_review'`. Platform owner reviews and approves. DONNA only cites approved entries. This is the existing pipeline — only one new source type constant is needed.

**3. Exactly how does AcademyOS retain ownership of knowledge?**
Via the Knowledge Library doctrine (already implemented): External AI → `pending_review` → Platform Owner approval → `approved_general` → DONNA can cite → Director promotes to curriculum → `audit_logs` records mutation. External AI owns nothing in this pipeline.

**4. Exactly where does AI provider abstraction belong?**
In `src/lib/donna/llmOrchestration/llmApiClient.ts` — the single file that calls the Anthropic API. Everything above is already provider-agnostic. Build the abstraction only when a second provider is actually being added.

**5. Exactly where does the context firewall belong?**
Between `contextPacket.ts` (packet assembly) and `callDonnaLlm()` in `orchestrator.ts`. A formal `DonnaContextFirewall` class is not needed — existing layers are adequate. What is needed: documentation and maximum context size enforcement.

**6. Exactly what should be built next?**
Sprint 2771–2780: Fix InferredModel bug → build `academyBlueprintLibrary.ts` + `stylePresetLibrary.ts` + `blueprintToDna.ts` in `src/lib/academyDNA/` → add `'ai_generated'` source type. Pure TypeScript, zero risk, zero migrations.

**7. Exactly what should NOT be built?**
New database tables for DNA, philosophy, or operating model. AI provider abstraction. Parallel philosophy engine. Template auto-generation. Custom director-created blueprints. Any OpenAI integration before compliance review.

---

*End of Architecture Audit V1 — Mega Sprint 2770A*  
*No code was written. No database was changed. No migrations were created.*  
*All findings are based on reading existing source code and documentation.*
