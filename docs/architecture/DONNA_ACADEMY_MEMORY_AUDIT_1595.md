# DONNA Academy Memory Audit — Sprint 1595
**Sprint:** Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
**Date:** 2026-06-09
**Purpose:** Audit existing memory, evidence, and audit infrastructure before building a persistent Academy Memory Engine.

---

## 1. Audit scope

| Area | What was audited |
|---|---|
| `proposed_actions` | Schema, query patterns, existing loaders |
| Player assessments | How assessments are stored and retrieved |
| Curriculum state | How curriculum decisions are tracked |
| Coach notes / wrap-ups | How coach session data is captured |
| Parent updates | How parent communication decisions flow |
| DONNA conversation persistence | What's DB-backed vs. sessionStorage-only |
| Evidence reasoning engine | Current evidence chain structure |
| Promotion engine | How promotion decisions are represented |
| Decision execution engine | What execution plans currently contain |

---

## 2. `proposed_actions` — primary memory source

### Schema (from `database.types.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `academy_id` | uuid | RLS scope |
| `action_label` | string | Human-readable label: "Promote Jake Chen to Green Ball" |
| `action_type` | enum | `action_type` enum from DB |
| `target_module` | string | e.g. `player_onboarding`, `parent_update`, `wrap_up`, `curriculum` |
| `target_object_id` | uuid or null | Player ID, coach ID, etc. — enables entity-specific filtering |
| `target_object_type` | string or null | `player`, `coach`, `session`, `curriculum_level`, etc. |
| `proposed_payload` | JSON | Full proposed data |
| `modified_payload` | JSON or null | Director's modified version (set when director changed DONNA's proposal) |
| `status` | enum | `pending_review`, `approved`, `rejected`, `executed`, `modified`, `expired`, `failed` |
| `reviewer_notes` | string or null | Director's notes at approval/rejection time |
| `rejection_reason` | string or null | Why it was rejected |
| `risk_level` | string | `low`, `medium`, `high` |
| `risk_notes` | string[] or null | Risk detail bullets |
| `created_at` | ISO date | When proposed |
| `approved_at` | ISO date or null | When approved |
| `rejected_at` | ISO date or null | When rejected |

### What `proposed_actions` CAN answer
- "What decisions were made?" → all non-pending rows
- "Why was [player] promoted?" → filter by `target_object_id` = player ID + `target_module` containing 'promotion'
- "What did the director override?" → `modified_payload IS NOT NULL` (director changed proposal)
- "What was rejected?" → `status = 'rejected'` + `rejection_reason`
- "What happened with parent updates?" → `target_module = 'parent_update'`
- "What curriculum changes were made?" → `target_module` containing 'curriculum'
- "What notes did the director leave?" → `reviewer_notes IS NOT NULL`

### What `proposed_actions` CANNOT answer (gaps)
- "What did DONNA recommend at the time?" — `proposed_payload` contains the original DONNA recommendation but is a raw JSON blob, not structured for display
- "What happened with unstructured events?" — coach wrap-up observations not in `proposed_actions` directly
- "What was the evidence?" — evidence is not stored in `proposed_actions` rows
- "What happened before the approval system was set up?" — no historical data before the system was live

### Existing loader: `recentDecisionsLoader.ts`
Queries `proposed_actions` with status in `['approved','executed','rejected','modified','expired','failed']` ordered by `updated_at DESC`, limit 15.

**Loads:** `id`, `action_label`, `target_module`, `status`, `risk_level`, `created_at`, `approved_at`, `rejected_at`, `reviewer_notes`

**Does NOT load:** `target_object_id`, `target_object_type`, `rejection_reason`, `modified_payload`, `proposed_payload`, `action_type`

**Gap for memory engine:** Need `target_object_id` and `target_object_type` for entity-specific filtering, and `rejection_reason` for override memory.

---

## 3. Player assessments

### Storage
`assessments` table queried by `assessmentCoverageGapDetector.ts` and `extendedContextLoaders.ts`.

### What's available in `AssessmentSummary` (from `extendedContextLoaders.ts`)
- `playerId`, `assessedDate`, `promotionReady`, `overallScore`, `domain` (or similar)
- Used by promotion engine to compute `PromotionDecision`

### Memory relevance
Assessments are consumed by the promotion engine but are NOT currently stored as retrievable memory. A "Why was Jake assessed?" question has no persistent answer path — only the assessment result in `AssessmentSummary` is available for the current session.

**Gap:** Assessment events are not stored in `proposed_actions` (unless the assessment generates a proposed promotion action). The assessment completion itself is not auditable through the memory layer.

---

## 4. Curriculum state

### Storage
`curriculum_content_items`, `academy_curriculum_overrides` tables.

### What's available
DONNA's curriculum decisions (overrides proposed via `curriculum_builder_completion`) go through `proposed_actions` with `target_module = 'curriculum'` or `'academy_curriculum_overrides'`.

### Memory relevance
Approved curriculum changes ARE retrievable through `proposed_actions`. The `action_label` describes the change (e.g., "Add Drill: Cross-Court Rally to Orange 1"). Curriculum decisions are a first-class memory source.

---

## 5. Coach notes / wrap-ups

### Storage
`voice_notes` table stores raw wrap-up text. `proposed_actions` rows with `target_module = 'wrap_up'` or `'coach_recap'` track the approval lifecycle.

### What's available
- Coach wrap-up submissions appear in `proposed_actions` as `pending_review` → `approved` / `rejected`
- The `action_label` describes the wrap-up ("Coach Sarah wrap-up for session 2026-06-09")
- `reviewer_notes` captures director's approval notes

### Memory relevance
Coach wrap-up approvals are queryable through `proposed_actions`. However, the raw wrap-up content lives in `voice_notes` (not surfaced by current memory layer).

**Gap:** Cannot answer "What did Coach Danny say in their last wrap-up?" — only whether the wrap-up was approved/rejected.

---

## 6. Parent updates

### Storage
Parent updates go through `proposed_actions` with `target_module = 'parent_update'`.

### What's available
- Status of parent update approvals
- `action_label` describing which parent and what update
- `reviewer_notes` if director added notes at approval
- `rejection_reason` if rejected

### Memory relevance
All parent update decisions are fully retrievable through `proposed_actions`. This is a high-value memory source for "What parent updates have been sent?" questions.

---

## 7. DONNA conversation persistence

### Files
- `donnaConversationPersistence.ts` — DB-backed session/message persistence (`donna_conversation_spine` tables)
- `donnaChatSessionMemory.ts` — in-process singleton (session only)
- `donnaGoalMemory.ts` — sessionStorage (2h TTL, goal state)
- `donnaAcademyMemory.ts` — sessionStorage (2h TTL, recurring patterns, no PII)

### What's DB-backed
`donnaConversationPersistence.ts` writes conversation sessions and messages to `donna_conversation_spine` tables. However, these tables are not in the current `database.types.ts` (generated) — they appear to use `(db as any)`.

### What's sessionStorage-only (clears on tab close)
- Goal memory (active goal, last entity, completed goals)
- Academy pattern memory (recurring signals, no PII)
- Chat session memory (in-process conversation thread)

### Memory relevance
**Critical gap:** There is no persistent record of what DONNA recommended in previous sessions. DONNA's recommendations live only in execution plans (in-memory, Sprint 1565) or in the `proposed_payload` of `proposed_actions`. There is no dedicated "DONNA recommendation history" table or index.

---

## 8. Evidence reasoning engine

### Files
- `reasoning/donnaEvidenceReasoningEngine.ts` — `EvidencedRecommendation` with `evidence[]`, `missingInfo[]`, `followUpAnswers`
- `entities/donnaEntityEvidenceEngine.ts` — `buildEntityEvidence()` → `EvidenceChain`
- `promotion/donnaPlayerPromotionEngine.ts` — `PromotionDecision` with `evidence[]`, `contradictions[]`

### What's available
Evidence chains are computed in-memory from live `AcademyEntityContext`. They are NOT persisted.

### Memory relevance
When a director asks "What evidence did we use to promote Jake?", there is no persisted evidence chain to retrieve. The evidence at the time of promotion is only inferrable from the current `proposed_payload` in `proposed_actions` (if populated by the creating server action).

---

## 9. Promotion engine

### Files
- `promotion/donnaPlayerPromotionEngine.ts` — `evaluatePlayerPromotion()` → `PromotionDecision`
- `promotion/donnaGroupPromotionEngine.ts` — `evaluateGroupPromotion()`
- `promotion/donnaPromotionFramework.ts` — `PromotionDecision`, `PromotionEvidenceItem[]`

### What's available
Promotion decisions are computed deterministically from current entity context. They are not stored.

### Memory relevance
If a player was promoted (approved via `proposed_actions`), the `action_label` captures the event. The evidence DONNA used at the time is NOT captured — only the outcome.

---

## 10. Decision execution engine (Sprint 1565)

### Files
- `execution/donnaDecisionExecutionTypes.ts` — `DecisionExecutionPlan`, `ExecutionAction`
- `execution/donnaDecisionExecutionEngine.ts` — `buildExecutionPlanForAttentionItem`, `buildExecutionPlanForDecision`

### What's available
Execution plans are built in-memory for the Today surface. They are not persisted.

### Memory relevance
What DONNA recommended on the Today screen is ephemeral. "What did DONNA recommend last time I opened the dashboard?" has no answer — execution plans are rebuilt on every page load.

---

## 11. Summary: what can be retrieved vs. what cannot

| Question | Answerable now? | Source |
|---|---|---|
| What decisions were made? | YES | `proposed_actions` (approved/executed/rejected) |
| Why was X approved/rejected? | PARTIAL | `reviewer_notes`, `rejection_reason` in `proposed_actions` |
| What did DONNA recommend? | PARTIAL | `action_label` in `proposed_actions` (text description only) |
| What parent updates were sent? | YES | `proposed_actions` target_module = parent_update |
| What curriculum changes were approved? | YES | `proposed_actions` target_module = curriculum |
| What coach wrap-ups were reviewed? | YES | `proposed_actions` target_module = wrap_up |
| What happened with a specific player? | PARTIAL | `proposed_actions` filtered by `target_object_id` (if populated) |
| What evidence did we use? | NO | Not persisted — computed in-memory only |
| What DONNA execution plans were shown? | NO | Not persisted — rebuilt on every load |
| What did DONNA recommend in prior sessions? | NO | Only in sessionStorage (clears on close) |

---

## 12. Architecture for Memory Engine V1

### Memory source: `proposed_actions`

The primary memory source for V1 is `proposed_actions`. All decisions (approved, rejected, modified, executed) are stored there with enough metadata to answer the most common director memory questions.

### What V1 builds

`AcademyMemory` objects are built from `proposed_actions` rows. Each memory:
- `sourceType` inferred from `target_module` + `action_type`
- `headline` from `action_label`
- `summary` constructed from status + notes
- `evidence` from `reviewer_notes` / `risk_notes`
- `entityLinks` from `target_object_type` + `target_object_id` + name extraction from `action_label`
- `importance` from `MemoryImportanceScorer` (source type + risk level + override flag)
- `confidence` HIGH when data is from `proposed_actions` (real DB record)
- `overrideReason` from `modified_payload IS NOT NULL` + `reviewer_notes`

### What V1 cannot answer (documented V1 limitations)

1. Evidence chains used at decision time — not stored in `proposed_actions`
2. DONNA execution plan history — not persisted
3. Assessment completion events that didn't generate a proposed_action
4. Raw coach wrap-up content (only approval status available)
5. Player events before the approval system was deployed

### Brain integration pattern

Memory questions detect a `MemoryIntentType` (`'player_history'`, `'coach_history'`, `'decision_history'`, `'override_history'`, `'recommendation_history'`, `'entity_timeline'`). The brain returns `{ action: 'fetch_memory' }`. The calling component (`DonnaAssistantButton`) triggers `handleFetchAcademyMemory(question)` which calls a server action `runDonnaMemoryAction(question)` that loads and formats the memory.

### No migration required

All memory data comes from existing tables. No new tables needed for V1.

---

## 13. Out of scope for V1

- Persisting execution plans to DB
- Evidence chain history storage
- Cross-session DONNA recommendation tracking
- Assessment history as standalone memory events
- Raw coach wrap-up content retrieval
