# DONNA Brain Inventory Audit — Mega Sprint 904–933A

**Produced:** 2026-06-07
**Purpose:** Before building the Initial Brain, audit every existing DONNA brain/intelligence/intent/vocabulary system to avoid duplication and establish a canonical map.
**Scope:** 10 system categories. Read-only audit. No refactoring.

---

## Executive Summary

The DONNA brain currently has **~170 files** across `src/lib/donna/`, `src/components/assistant/`, `src/lib/curriculum/`, and `src/lib/knowledge/`. The systems are deep and functional, but **fragmented across multiple generations** of sprint work. Three critical fragmentation zones were identified:

1. **Intent detection**: 5 separate systems with overlapping taxonomies
2. **Routing logic**: 6 separate routers at different layers
3. **Entity resolution**: 2 active versions (V1 heuristic + V2 DB-backed) called in different places

The Brain Governance contract (Sprint 874–903) introduced the right architecture but no runtime data. The Initial Brain must be carefully seeded from existing scattered constants — not rebuilt from scratch.

**Recommendation: Build the Initial Brain as a data population exercise, not a new system. The architecture already exists. The gap is populated entries.**

---

## 1. Brain Governance

**File:** `src/lib/donna/brain/donnaBrainGovernance.ts`
**Sprint:** 874–903
**Status:** ACTIVE — pure type definitions only; no runtime data populated

### What exists:

| Type | Description |
|---|---|
| `GlobalBrainEntry` | Platform vocabulary/intent/decision_rule/philosophy |
| `AcademyKnowledgeEntry` | Academy-scoped rule/preference/curriculum_mapping |
| `AcademyAlias` | Director-controlled display remapping |
| `KnowledgeInboxItem` | DONNA suggestion queue |
| `PromotionQueueItem` | Owner-only promotion gate |
| `BRAIN_GOVERNANCE_PERMISSIONS` | 12 permission rules across 5 layers |
| `BRAIN_CONFLICT_RULES` | 4 conflict types with resolution paths |
| `KNOWLEDGE_LIFECYCLE_TRANSITIONS` | 12 valid state transitions |

### What does NOT exist:

- No runtime `GlobalBrainEntry[]` seed data
- No DB tables for any of the 5 layers
- No API or server actions for reading/writing brain entries
- No UI for the platform owner to review/promote items
- `donnaKnowledgeContextAdapter.ts` is a **placeholder stub** — returns empty arrays

### Canonical source: `donnaBrainGovernance.ts` for governance contract only

---

## 2. Existing Academy Knowledge Modules

**Primary file:** `src/lib/donna/academyKnowledge/index.ts` (Sprint 463)

### 14 knowledge areas defined:

```
academy_settings | staff | groups | players | curriculum | templates |
sessions | attendance | player_priorities | coach_notes |
parent_summaries | badges | missions | mental_performance
```

Each area has: roles (visibility gate), isSensitive, requiresParentSafe, requiresPlayerSafe, isNoCache.

### Related modules:

| File | Sprint | Role |
|---|---|---|
| `preferences/academyPreferences.ts` | 470 | `customTerminology` record — director-controlled term remapping |
| `conversation/index.ts` | 462 | `DONNA_CONVERSATION_RULES` (7 canned behavioral rules) |
| `donnaAcademyProfileContext.ts` | 1019 | Academy philosophy profile builder |
| `donnaAcademySignals.ts` | — | Academy-level signal aggregation |
| `donnaMemoryPolicy.ts` | 944 | 5 memory categories with retention policy |
| `donnaProductMemory.ts` | 1078 | Product rules, approval-safe behavioral standards |
| `src/lib/knowledge/` | 535–552 | 20-file knowledge library (review queue, tagging, ingestion, retrieval, curriculum bridge) |

### Key finding — vocabulary gap:

`customTerminology` in `AcademyDonnaPreferences` is the **only runtime vocabulary override** that exists. It is a `Record<string, string>` (e.g. `{ 'group': 'squad', 'session': 'training' }`). It is NOT connected to the new Brain Governance `AcademyAlias` layer. These are parallel systems doing the same job.

---

## 3. Existing Intent Detection Systems

**This is the most fragmented area. Five separate systems exist.**

### System A — `intent/donnaIntentEngine.ts` (Sprint 1831–1860)

**Status: ACTIVE — called by `processDonnaMessage.ts` Step 9**

- Type: `DirectorIntent` (11 values)
- Mechanism: Weighted signal matching with context boost by page route
- Returns: `IntentResult` with confidence, possibleIntents, extractedEntity, clarificationQuestion
- Callable via: `classifyIntent(text, pathname)`

```
DirectorIntent values:
curriculum_help | player_progress_review | parent_communication |
assessment | onboarding_setup | template_building | level_readiness |
session_review | review_queue | attendance | general_help | unknown
```

### System B — `donnaIntentClassifier.ts` (Sprint 592)

**Status: PARTIALLY ACTIVE — `matchesDailyBriefIntent()` called by `processDonnaMessage.ts` Step 5**

- Type: `DonnaCommandCategory` (10 values) + `DonnaDirectorIntent` (different, broader list)
- Mechanism: Keyword signal maps
- Returns: `IntentClassificationResult` with confidence high/medium/low
- Also exports: `classifyDirectorIntent()` — used by `donnaConversationalRouter.ts`

```
DonnaCommandCategory values:
attendance | session_actual | coach_observation | parent_draft |
level_readiness | curriculum_override | review_queue | academy_health |
wrap_up | academy_learning | unknown
```

### System C — `donnaGlobalIntentRouter.ts`

**Status: UNCLEAR — not imported by `processDonnaMessage.ts`. May be called by God Mode chain.**

- Type: `DonnaIntent` (35+ values across 8 categories)
- Mechanism: Keyword arrays with pattern matching
- Returns: structured intent + `DataRequirement[]` + confidence
- Largest taxonomy — most comprehensive domain coverage

```
IntentCategory values:
player_status | assessment | placement | level_readiness |
coach_workflow | parent_communication | academy_health |
navigation_action | freeform
```

### System D — `donnaIntentRouterV1.ts` (Sprint 914.7)

**Status: BRIDGE LAYER — self-describes as "additive analysis layer"**

- Type: `DonnaUnifiedIntentType` (22 values)
- Purpose: Bridges legacy `DonnaCommandCategory` and the God Mode 34-interceptor pipeline
- Explicit note in file: "does NOT replace the existing routing pipeline"
- Returns: approval gate category + gate requirement

### System E — `src/components/assistant/donnaIntentRouter.ts` (Sprint 315)

**Status: LEGACY — predates the brain layer**

- Type: `IntentType` (9 values) + `WorkflowId` (9 values)
- Wraps: `detectTaskIntent()`, `isTemplateCreationIntent()`, `detectMultiStepIntent()`, `isProtectedVoicePhrase()`
- Note in file: "DonnaAssistantButton.tsx continues to use its existing inline detectors until Phase 7"

### Inline phrase detectors in `processDonnaMessage.ts`:

Five additional detectors are inlined directly (not extracted to a module):
- `isAttentionPhrase()` — 9 patterns
- `isReviewQueuePhrase()` — 12 patterns
- `isCOOIntelligencePhrase()` — 30+ patterns (spread across COO dimensions)
- `matchesDailyBriefIntent()` — imported from System B
- `detectTodayGuidanceQuestion()` — imported from `guidance/donnaTodayGuidanceLoop.ts`
- `detectDirectorControl()` — imported from `guidance/donnaAutonomousGuidanceEngine.ts`

### Intent system fragmentation summary:

| System | Intent type | Values | Status |
|---|---|---|---|
| A: `intent/donnaIntentEngine.ts` | `DirectorIntent` | 11 | Active (Step 9) |
| B: `donnaIntentClassifier.ts` | `DonnaCommandCategory` | 10 | Partial (Step 5 only) |
| C: `donnaGlobalIntentRouter.ts` | `DonnaIntent` | 35+ | Unknown — God Mode path |
| D: `donnaIntentRouterV1.ts` | `DonnaUnifiedIntentType` | 22 | Bridge layer |
| E: `donnaIntentRouter.ts` (component) | `IntentType` | 9 | Legacy |
| Inline | N/A | 6 detectors | Active (Steps 3–7.5) |

---

## 4. Existing Guided Completion Workflows

**File:** `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` (Sprint 1811–1820)
**Status: ACTIVE — called by `processDonnaMessage.ts` Steps 1 and 13**

### 6 workflows:

| ID | Label | Steps | Approval-gated actions |
|---|---|---|---|
| `curriculum_builder_completion` | Curriculum Level Builder | 6 req + 1 opt | save level, publish, make visible |
| `academy_setup_completion` | Academy Setup | 6 req + 1 opt | save config, activate coaches, enable portals |
| `player_onboarding_completion` | Player Onboarding | 6 req + 1 opt | create player, activate, link parent |
| `assessment_completion` | Player Assessment | 6 req + 1 opt | save assessment, share, trigger movement |
| `parent_update_completion` | Parent Update Draft | 5 req + 1 opt | send message, save to record |
| `template_builder_completion` | Class Template Builder | 6 req + 1 opt | save template, publish to coaches |

### Supporting files:

| File | Role |
|---|---|
| `guidedCompletionSessionMemory.ts` | Session-scoped step state |
| `guidedCompletionStepRunner.ts` | Step execution engine |
| `pageQuestionExtractor.ts` | Page-aware question extraction |

### Second workflow system — goal workflows:

**File:** `src/lib/donna/workflows/donnaWorkflowRegistry.ts` (Mega Sprint 2216–2240)
**Status: ACTIVE — called by `processDonnaMessage.ts` Step 0b**

8 goal-level workflows (higher-order than guided completion):
`player_placement | onboarding_completion | review_queue | coach_recap_review | parent_update_review | curriculum_improvement | academy_health_action | daily_priorities`

These are distinct from the 6 guided completion workflows. Both are active simultaneously.

---

## 5. Existing Task Contracts

**File:** `src/components/assistant/donnaTaskContracts.ts`
**Status: ACTIVE — used by `donnaTaskRuntime.ts` and `DonnaAssistantButton.tsx`**

### 19 task IDs with full contracts:

```
create_class_template | create_fitness_template | create_session |
populate_session_from_template | capture_coach_note | draft_parent_update |
draft_player_note | review_level_readiness | handle_attendance_exception |
adjust_curriculum | draft_coach_communication | create_group |
assign_player_to_group | summarize_player_progress | recommend_template_for_group |
draft_session_brief | draft_coach_brief | invite_coach |
reassign_player_group | assign_coach_to_group
```

Each contract defines: requiredFields, optionalFields, questionSequence, reads, createsDraftType, approvalRequired, unsafeWithoutApproval, saveApplyMethodStatus.

### Related action layers:

| File | Role |
|---|---|
| `donnaActionRegistry.ts` | Director action read-only registry |
| `donnaActionTypes.ts` | Action type definitions |
| `directorActionRegistry.ts` | Director-facing action registry |
| `donnaActionRegistryWiring.ts` | Wiring between registry and execution |
| `donnaActionProposalEngine.ts` | Action proposal builder |
| `donnaWritePathRegistry.ts` | Write path declarations |
| `donnaDraftOnlyActions.ts` | Draft-only validation |
| `donnaProtectedActionRegistry.ts` | Protected action definitions |

**Note:** Task contracts live in `src/components/assistant/` — not in `src/lib/donna/`. This is a structural inconsistency. Brain-layer contracts should not live in the component layer.

---

## 6. Existing Entity/Object Resolution

**Two versions are both active.**

### V1 — `src/lib/donna/entities/donnaEntityResolver.ts` (Sprint 1831–1860)

**Status: ACTIVE — called by `processDonnaMessage.ts` Step 10**

- Heuristic only. No DB queries.
- Entity types: `player | coach | parent | curriculum_level | assessment | session | template | group | unknown`
- Returns: `EntityResolutionResult` with `ResolvedEntity` (confidence, needsResolution, resolutionHint)
- Pattern matching: ball level colors, short level labels, capitalized name heuristic

### V2 — `src/lib/donna/entity/donnaEntityResolver.ts` (Mega Sprint 2291–2320)

**Status: ACTIVE — called by `processDonnaMessage.ts` Steps 10.4 and 10.5**

- Comprehensive. Resolves against live AcademyEntityContext (players, groups, templates, assessments, coaches, parents).
- Supports: exact / partial / nickname / alias / initials / fuzzy (Levenshtein) matching
- Entity kinds: `player | coach | parent | group | curriculum_level | assessment | template | session | workflow`
- Returns: `EntityResolveResult` with `ResolvedEntityV2` (id, route, confidence, reasoning)
- Also handles disambiguation (`DisambiguationQuestion`)

### V2 supporting files:

| File | Role |
|---|---|
| `entity/donnaEntityContextResolver.ts` | Resolves entity with full page context |
| `entity/donnaEntityContextLoader.ts` | Loads AcademyEntityContext from DB |
| `entity/donnaDisambiguationEngine.ts` | Builds and resolves disambiguation questions |
| `entity/donnaEntityIntentRouter.ts` | Detects entity navigation intent |
| `entity/donnaEntityNavigation.ts` | Builds navigation responses |
| `entity/donnaRelationshipGraph.ts` | Multi-hop relationship queries |

### Fragmentation note:

Both V1 and V2 are called from `processDonnaMessage.ts`. V1 at Step 10 (always), V2 at Steps 10.4–10.5 (only when `entityContext` is loaded). The V1 result is carried through goal resolution even when V2 produces a better answer. This is intentional (V2 requires context loading to be wired) but results in two separate resolution paths that must eventually converge.

---

## 7. Existing COO Intelligence

**Primary engine:** `src/lib/donna/coo/donnaCOOIntelligenceEngine.ts` (Sprint 784–813)

### 5 COO dimensions:

| Dimension | Coverage |
|---|---|
| `program_health` | Group capacity, over/under enrollment, session cadence |
| `player_intelligence` | Stalls, readiness, acceleration, attendance risk |
| `coach_intelligence` | Follow-through, ownership gaps, progression driving |
| `parent_confidence` | Update gaps, at-risk families, communication cadence |
| `director_decision` | Biggest risk, biggest opportunity, COO recommendation |

### Supporting files:

| File | Role |
|---|---|
| `donnaCOOAnswerEngine.ts` | COO answer builder with confidence |
| `donnaCOOReadinessScorecard.ts` | Readiness scoring (0–100) |
| `cooDataStatus.ts` | Data field status (live/limited/unavailable) |
| `weeklyCoOReportLoader.ts` | Weekly report data loader |
| `intelligence/academyIntelligenceEngine.ts` | Academy-level intelligence beyond COO 5 dimensions |
| `intelligence/coachImpactIntelligence.ts` | Coach impact signals |
| `intelligence/curriculumBottleneckIntelligence.ts` | Curriculum bottleneck detection |
| `intelligence/progressionIntelligence.ts` | Player progression signals |
| `intelligence/retentionIntelligence.ts` | Player retention signals |
| `intelligence/whatChangedIntelligence.ts` | Delta detection (what changed since last session) |

### Phrase routing:

COO intelligence questions are caught by `isCOOIntelligencePhrase()` in `processDonnaMessage.ts` Step 7.5. This function contains 30+ pattern detectors for all 5 COO dimensions. It is a large inline function that could become a module.

---

## 8. Existing Vocabulary-Like Constants

No single canonical vocabulary store exists. Vocabulary is scattered across:

| Location | Vocabulary type | Count |
|---|---|---|
| `donnaBrainGovernance.ts` | `GlobalBrainEntryType` (vocabulary/intent/decision_rule/philosophy) | 4 types defined, 0 entries |
| `preferences/academyPreferences.ts` | `customTerminology: Record<string,string>` | Runtime override, 0 default values |
| `academyKnowledge/index.ts` | `AcademyKnowledgeArea` | 14 areas |
| `donnaCommandRouter.ts` | `DonnaCommandCategory` | 10 categories |
| `intent/donnaIntentEngine.ts` | `DirectorIntent` | 11 values |
| `donnaGlobalIntentRouter.ts` | `DonnaIntent` | 35+ values |
| `donnaIntentRouterV1.ts` | `DonnaUnifiedIntentType` | 22 values |
| `donnaSourceLabels.ts` | `DonnaSourceDomain` | 13 source domains |
| `donnaRoleBlocks.ts` | Action IDs (blocked actions registry) | ~10 action IDs |
| `conversation/index.ts` | `DONNA_CONVERSATION_RULES` | 7 behavioral rules |
| `donnaMemoryPolicy.ts` | `DonnaMemoryCategory` | 5 categories |
| `donnaProductMemory.ts` | `ProductMemoryCategory` | 8 categories |
| `donnaBoundaryResponses.ts` | Canned refusal vocabulary | ~5 types |

**Key finding:** The intent type fragmentation means there is no single vocabulary for what DONNA understands. The Brain Governance `GlobalBrainEntry` of type `vocabulary` and `intent` is the correct long-term container for this — but no entries exist yet.

### Vocabulary that belongs in the Initial Brain:

Candidates for `GlobalBrainEntry` seed population from existing code:

| Key | Type | Source |
|---|---|---|
| `vocabulary.group` | vocabulary | DONNA_CONVERSATION_RULES, ROLE_BLOCKS |
| `vocabulary.session` | vocabulary | donnaCommandRouter, guidedCompletionRegistry |
| `vocabulary.wrap_up` | vocabulary | donnaIntentEngine signals |
| `vocabulary.level` | vocabulary | BALL_LEVEL_RE patterns in entity resolver |
| `vocabulary.template` | vocabulary | donnaTaskContracts |
| `intent.review_queue` | intent | isReviewQueuePhrase inline detector |
| `intent.daily_brief` | intent | matchesDailyBriefIntent |
| `intent.attention` | intent | isAttentionPhrase inline detector |
| `decision_rule.player_stall_90_days` | decision_rule | playerProgressStallDetector |
| `decision_rule.ai_proposes_director_approves` | philosophy | CLAUDE.md, AI_BACKEND_RULES |

---

## 9. Existing DONNA Routing Logic

### Primary router: `processDonnaMessage.ts` (Sprint 1911–1960)

**Status: THE canonical brain entry point. All new routing should extend this.**

16-step sequence with debug logging at every step:

| Step | Check | Action |
|---|---|---|
| 0a | Active goal session | `route_goal_session` |
| 0b | Goal workflow intent | `start_goal_session` |
| 0.5 | Pending disambiguation | `navigate` / `respond` |
| 1 | Active guided workflow | `route_guided_answer` |
| 2 | COO control command | `route_coo_control` |
| 3 | Continuity phrase | `respond` (goal memory) |
| 4 | Today guidance | `route_coo_prompt` |
| 5 | Daily brief intent | `fetch_brief` |
| 6 | Review queue phrase | `open_review` |
| 7 | Attention phrase | `fetch_attention` |
| 7.5 | COO intelligence phrase | `fetch_coo_intelligence` |
| 8 | Ambiguity resolution | (modifies `messageToProcess`) |
| 9 | Intent classification (V1 engine) | sets `intentResult` |
| 10 | Entity resolution (V1 heuristic) | sets `entityResult` |
| 10.4 | Relationship intelligence (V2) | `respond` if matched |
| 10.5 | Entity intelligence V2 | `navigate` / `respond` if matched |
| 11 | Goal resolution | sets `goalResult` |
| 12 | Context pack lookup | `respond` if pack answer found |
| 13 | High-confidence goal → workflow | `start_workflow` |
| 14 | Medium-confidence goal | `respond` with route suggestion |
| 15 | Clarification needed | `respond` |
| 16 | Final fallback | `route_coo_prompt` → God Mode |

### Secondary/legacy routers (still alive):

| File | Sprint | Status | Used by |
|---|---|---|---|
| `donnaCommandRouter.ts` | 591 | Active — legacy | `donnaConversationalRouter.ts`, possibly God Mode |
| `donnaConversationalRouter.ts` | 689 | Active — legacy | Unknown; wraps `donnaIntentClassifier` + `donnaCommandRouter` |
| `donnaGlobalIntentRouter.ts` | — | Unclear | Possibly called from God Mode or LLM orchestration |
| `donnaIntentRouterV1.ts` | 914.7 | Bridge | Unknown runtime caller |
| `donnaIntentRouter.ts` (component) | 315 | Legacy component | `DonnaAssistantButton.tsx` pre-brain layer |

**The `route_coo_prompt` fallback (Step 16) routes to `handleDonnaCooPrompt` in `DonnaAssistantButton.tsx`, which contains the entire God Mode chain — another ~500 lines of routing logic not captured in `processDonnaMessage.ts`.**

---

## 10. Existing Curriculum Knowledge Modules

**Two layers: DONNA-specific curriculum intelligence and general curriculum library.**

### DONNA curriculum intelligence (in `src/lib/donna/`):

| File | Role |
|---|---|
| `curriculumBuilderDonnaContext.ts` | Builder context assembly |
| `curriculumBuilderGuidance.ts` | Builder Q&A guidance |
| `curriculumBuilderOperator.ts` | Builder operator commands |
| `curriculumImprovementEngine.ts` | Improvement signal detection |
| `donnaCurriculumIntelligence.ts` | Curriculum intelligence builder |
| `curriculumLevelDonnaAnswer.ts` | Level-specific DONNA answers |
| `curriculumImpactDonnaAnswer.ts` | Curriculum change impact answers |
| `curriculumDraftProposalDonnaAnswer.ts` | Draft proposal answers |
| `curriculumTemplateCoverageGapDetector.ts` | Template coverage gap detection |
| `curriculumStructuralGapLoader.ts` | Structural gap loading |
| `curriculumBottleneckLoader.ts` | Bottleneck loading |
| `assessmentDonnaContext.ts` | Assessment context for DONNA |
| `assessmentCoverageGapDetector.ts` | Assessment gap detection |

### LLM orchestration curriculum layer (in `src/lib/donna/llmOrchestration/`):

| File | Role |
|---|---|
| `curriculumAnswering.ts` | LLM-based curriculum Q&A |
| `curriculumContextRetrieval.ts` | Context retrieval for LLM |
| `curriculumStrategyConversation.ts` | Strategy conversation driver |
| `curriculumImpactPreview.ts` | Impact preview before changes |
| `curriculumChangeApprovalFlow.ts` | Director approval flow |
| `philosophyCurriculumDraftEngine.ts` | Philosophy-to-curriculum drafting |

### General curriculum library (in `src/lib/curriculum/`):

~25 files covering: content types, assessment criteria, visual map model, coverage recommendations, gap analysis, domain balance, stage progression, level health reports, template connections, and node drawers.

### DONNA–Knowledge bridge:

`src/lib/knowledge/knowledgeCurriculumIntelligence.ts` — links the knowledge library to the curriculum system for DONNA. `knowledgeDonnaInterface.ts` defines what DONNA can do with knowledge items (surface, suggest tags, identify candidates — never approve or promote).

---

## Duplicate and Overlapping Systems

| Category | Overlap |
|---|---|
| **Intent detection** | `DirectorIntent` (11) vs `DonnaCommandCategory` (10) vs `DonnaIntent` (35+) vs `DonnaUnifiedIntentType` (22) vs `IntentType` (9) — 5 separate taxonomies, partially overlapping |
| **Routing** | `processDonnaMessage.ts` + `donnaCommandRouter.ts` + `donnaConversationalRouter.ts` + `donnaGlobalIntentRouter.ts` + `donnaIntentRouterV1.ts` + `donnaIntentRouter.ts` (component) |
| **Entity resolution** | V1 (`entities/donnaEntityResolver.ts`) + V2 (`entity/donnaEntityResolver.ts`) — both active |
| **Workflow registries** | Guided completion (6 workflows) + Goal workflow registry (8 workflows) — distinct but both active under the same brain |
| **Memory systems** | `donnaSafeSessionMemory.ts` + `donnaChatSessionMemory.ts` + `donnaSemanticMemory.ts` + `donnaMemoryPolicy.ts` + `donnaProductMemory.ts` + `donnaLastSessionStore.ts` — 6 memory-adjacent files |
| **Vocabulary** | `customTerminology` (preferences) vs `AcademyAlias` (Brain Governance) — parallel systems doing the same job |
| **Briefings** | `briefings/directorBriefing.ts` + `briefing/dailyBriefingEngine.ts` — two briefing systems |
| **Action registries** | `donnaActionRegistry.ts` + `directorActionRegistry.ts` + `donnaProtectedActionRegistry.ts` + `donnaWritePathRegistry.ts` |

---

## Deprecated Systems

| File | Reason |
|---|---|
| `src/components/assistant/donnaIntentRouter.ts` | Sprint 315 — predates brain layer. Self-notes "Phase 7" migration pending. Likely still wired to `DonnaAssistantButton.tsx`. |
| `src/lib/donna/entities/donnaEntityResolver.ts` (V1) | Superseded by `entity/donnaEntityResolver.ts` (V2). Still called at Step 10. Should be removed after V2 is fully wired for all entity types. |
| `donnaConversationalRouter.ts` | Sprint 689 — predates `processDonnaMessage.ts` (Sprint 1911). Wraps `donnaIntentClassifier` + `donnaCommandRouter`. Role now unclear. |
| `donnaIntentRouterV1.ts` | Sprint 914.7 — self-describes as bridge/additive layer. Not removed after unification. |

**Do not remove these in this sprint.** The refactoring required to safely eliminate them spans DonnaAssistantButton.tsx. Document only.

---

## Missing Systems

| Missing system | Why it's needed | Where it belongs |
|---|---|---|
| `GlobalBrainEntry[]` seed data | Brain Governance defines the schema; no entries exist | `donnaBrainGovernance.ts` extension or `src/lib/donna/brain/initialBrainSeed.ts` |
| Academy Alias runtime | `customTerminology` serves this now but is not connected to governance | New file or extension to preferences |
| Knowledge Inbox runtime | DONNA has no way to propose new entries yet | New server action + DB table |
| Promotion Queue runtime | No pathway from Inbox to Global Brain | New platform-owner UI |
| `donnaKnowledgeContextAdapter.ts` — live retrieval | Currently a stub returning empty arrays | Retrieval implementation against Knowledge Library |
| Canonical intent vocabulary map | 5 intent taxonomies exist; no master map | `src/lib/donna/brain/initialBrainSeed.ts` (Initial Brain) |
| Unified router migration | Legacy routers (Sprint 315, 591, 689) have no sunset plan | Future sprint |

---

## Integration Map

```
DonnaAssistantButton.tsx (React)
│
├── Pre-brain matchers (active draft, onboarding, attendance, multi-step, template)
│
└── processDonnaMessage() ─────────────── PRIMARY BRAIN ENTRY
    │
    ├── Step 0a: donnaWorkflowRegistry.ts (goal sessions)
    ├── Step 0b: donnaWorkflowRegistry.ts (goal workflow intent)
    ├── Step 0.5: entity/donnaDisambiguationEngine.ts
    ├── Step 1: guidedCompletionRegistry.ts
    ├── Step 2: guidance/donnaAutonomousGuidanceEngine.ts
    ├── Step 3: memory/donnaGoalMemory.ts
    ├── Step 4: guidance/donnaTodayGuidanceLoop.ts
    ├── Step 5: donnaIntentClassifier.matchesDailyBriefIntent()
    ├── Steps 6,7,7.5: inline phrase detectors
    ├── Step 8: reasoning/donnaAmbiguityResolutionEngine.ts
    ├── Step 9: intent/donnaIntentEngine.classifyIntent() [SYSTEM A]
    ├── Step 10: entities/donnaEntityResolver.resolveEntities() [V1]
    ├── Step 10.4: relationship/donnaRelationshipIntelligence.ts
    ├── Step 10.5: entity/donnaEntityResolver.resolveEntityWithContext() [V2]
    ├── Step 11: goals/donnaGoalEngine.resolveIntentToGoal()
    ├── Step 12: donnaContextPackRegistry.getDonnaContextPackForRoute()
    ├── Steps 13,14: guidedCompletionRegistry + reasoning layer
    └── Step 16: → handleDonnaCooPrompt() [God Mode chain in DonnaAssistantButton]
                     │
                     └── donnaGlobalIntentRouter / donnaIntentRouterV1 (unclear path)
```

**Brain Governance layer** (`donnaBrainGovernance.ts`) is currently NOT integrated into this flow. It is a contract only.

**Knowledge Context Adapter** (`donnaKnowledgeContextAdapter.ts`) is a placeholder only.

---

## Risk of Building Initial Brain Now

| Risk | Severity | Detail |
|---|---|---|
| Intent taxonomy conflict | HIGH | Adding vocabulary-driven intent entries to the Global Brain while 5 intent systems exist creates ambiguity about which system "owns" the canonical intent list |
| Vocabulary duplication | HIGH | `customTerminology` and `AcademyAlias` are parallel systems; wiring Initial Brain to DONNA responses without resolving this creates two active alias paths |
| Missing DB layer | HIGH | Brain Governance types have no DB tables. Initial Brain entries cannot persist without a migration. Building runtime without persistence creates a seed data gap. |
| God Mode chain opacity | MEDIUM | `handleDonnaCooPrompt` in `DonnaAssistantButton.tsx` contains ~500 lines of legacy routing not reflected in `processDonnaMessage.ts`. Initial Brain entries may collide with God Mode interceptors. |
| V1/V2 entity resolution coexistence | MEDIUM | Initial Brain vocabulary entries may reference entity types that are handled differently by V1 vs V2. No unified entity type across both. |
| No platform owner UI | LOW (for now) | Initial Brain cannot be maintained without a promotion/review UI. For a seeded initial brain (hardcoded TypeScript), this is acceptable for V1. |

**Bottom line:** Building Initial Brain as a **hardcoded TypeScript seed** (`initialBrainSeed.ts`) in the existing `brain/` directory is LOW risk. It does not require resolving the intent fragmentation and does not require DB. It is the right V1 approach.

Building Initial Brain as a **DB-backed runtime system** is HIGH risk until: (a) intent fragmentation is resolved, (b) `customTerminology` is either replaced by or connected to `AcademyAlias`, and (c) `donnaKnowledgeContextAdapter.ts` has a real retrieval implementation.

---

## Canonical Source of Truth Map

| Domain | Canonical file | Notes |
|---|---|---|
| Brain governance contract | `brain/donnaBrainGovernance.ts` | Types only; no entries |
| Primary routing | `brain/processDonnaMessage.ts` | Step 9 uses System A intent |
| Intent classification (active) | `intent/donnaIntentEngine.ts` | System A — weighted signals |
| Daily brief intent | `donnaIntentClassifier.ts` | Only `matchesDailyBriefIntent` still used |
| Entity resolution (preferred) | `entity/donnaEntityResolver.ts` | V2 — DB-backed, fuzzy |
| Entity resolution (legacy) | `entities/donnaEntityResolver.ts` | V1 — heuristic; deprecate when V2 covers all types |
| Guided completion workflows | `guidedCompletion/guidedCompletionRegistry.ts` | 6 form-filling workflows |
| Goal-level workflows | `workflows/donnaWorkflowRegistry.ts` | 8 goal orchestration workflows |
| Task contracts | `components/assistant/donnaTaskContracts.ts` | 19 task contracts (wrong location) |
| Academy knowledge areas | `academyKnowledge/index.ts` | 14 areas with role/sensitivity gates |
| COO intelligence | `coo/donnaCOOIntelligenceEngine.ts` | 5 COO dimensions |
| Role response policy | `brain/donnaRoleResponsePolicy.ts` | Role data scope + blocked categories |
| Memory policy | `donnaMemoryPolicy.ts` | 5 memory categories |
| Vocabulary (runtime) | `preferences/academyPreferences.ts` | `customTerminology` record |
| Vocabulary (governance) | `brain/donnaBrainGovernance.ts` | `AcademyAlias` — not yet wired |
| Knowledge library | `src/lib/knowledge/knowledgeTypes.ts` | 20-file library layer |
| Curriculum DONNA context | `curriculum/donnaCurriculumContext.ts` | DONNA curriculum context |

---

## Recommendation for 904–933 Initial Brain Implementation

### What to build in Mega Sprint 904–933:

**A hardcoded TypeScript seed file: `src/lib/donna/brain/initialBrainSeed.ts`**

This file populates the first `GlobalBrainEntry[]` from existing constants — pulling together what is already scattered across the codebase into one authoritative place.

**Seed scope (Phase A — vocabulary and intent):**

1. **Vocabulary entries** (~8 entries): canonical terms that DONNA uses across all roles
   - `group`, `session`, `wrap-up`, `level`, `template`, `coach`, `player`, `parent`
   - Sourced from: `academyKnowledge/index.ts`, `donnaCommandRouter.ts`, `guidedCompletionRegistry.ts`

2. **Intent entries** (~6 entries): deterministic intent patterns currently inline in `processDonnaMessage.ts`
   - `intent.review_queue`, `intent.daily_brief`, `intent.attention`, `intent.today_guidance`, `intent.coo_intelligence`, `intent.continuity`
   - Sourced from: inline phrase detectors in `processDonnaMessage.ts`

3. **Decision rule entries** (~4 entries): rules currently embedded as constants or comments
   - `decision_rule.player_stall_threshold` (90 days)
   - `decision_rule.ai_proposes_director_approves`
   - `decision_rule.approval_required_before_mutation`
   - `decision_rule.parent_safe_requires_director_review`

4. **Philosophy entries** (~3 entries): product principles from `AI_BACKEND_RULES.md` and `CLAUDE.md`
   - `philosophy.voice_creates_ui_confirms`
   - `philosophy.data_never_invented`
   - `philosophy.approval_gate_is_non_negotiable`

### What NOT to build in 904–933:

- No DB tables for GlobalBrainEntry (defer to a future migration sprint)
- No Knowledge Inbox runtime (scope too large; no DB table)
- No Promotion Queue runtime (no platform owner UI)
- No learning/ingestion/memory (explicitly excluded)
- No contradiction detection
- No refactoring of the 5 intent systems (risk too high; document only)
- No `customTerminology` → `AcademyAlias` migration

### Why this scope is right:

- The Initial Brain seed file is pure TypeScript — no DB, no migration risk
- It consolidates what already exists into the governance schema without changing any existing system
- It gives DONNA a single canonical source to answer "what do I know?" without touching the routing layer
- It can be wired into `donnaKnowledgeContextAdapter.ts` as the first live retrieval path

### Phase B (future sprints, not 904–933):

- Wire `initialBrainSeed.ts` into `donnaKnowledgeContextAdapter.ts` retrieval
- Add `AcademyKnowledgeEntry[]` for academy-specific rules (Dabul Tennis Academy pilot)
- Build platform owner UI for Inbox review
- Add migration when DB persistence is needed

---

## Definition of Done — Mega Sprint 904–933A

- [x] Full DONNA brain system inventory completed (this document)
- [x] Canonical source-of-truth map created (see table above)
- [x] Duplicate/overlapping systems identified (intent taxonomy × 5, routing × 6, entity × 2)
- [x] Deprecated systems identified (Sprint 315 router, V1 entity resolver, Sprint 689 conversational router)
- [x] Missing systems identified (seed data, Knowledge Inbox runtime, alias/vocabulary bridge)
- [x] Integration map created
- [x] Risk assessment for building Initial Brain now: DB-backed = HIGH; hardcoded seed = LOW
- [x] Implementation recommendation: hardcoded seed in `brain/initialBrainSeed.ts`
- [ ] Initial Brain implementation plan: **Pending approval before building**

---

*Audit produced by: Mega Sprint 904–933A*
*Next step: Confirm initial brain scope, then build `src/lib/donna/brain/initialBrainSeed.ts`*
