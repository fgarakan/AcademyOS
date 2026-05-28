# DONNA Backend Architecture Audit
**Date:** 2026-05-28
**Sprint:** 914.1
**Auditor:** Claude Code — static analysis only (no live DB access)

---

## A. Executive Summary

**Overall DONNA Backend Rating: 5.5/10**

The AcademyOS backend is significantly more sophisticated than the Sprints 912–913 work reveals. There are ~130+ DONNA library files, a full `proposed_actions` state machine, a `voice_commands` pipeline schema, a `directorActionRegistry` with 50+ typed actions, a `donnaGateway` with kill switches and rate limiting, and a `donnaIntentClassifier` — none of which are wired to the current `DonnaVoiceReadyShell.tsx` (God Mode shell).

**Critical finding:** Two parallel DONNA architectures exist in the codebase simultaneously:
1. **Legacy path** (`DonnaAssistantButton.tsx`) — uses richer infrastructure including `donnaIntentClassifier`, `donnaResponseComposer`, `donnaSafeSessionMemory` (localStorage)
2. **God Mode path** (`DonnaVoiceReadyShell.tsx`) — uses a new, simpler 34-interceptor pipeline with in-process module-level memory (`donnaChatSessionMemory.ts`)

Neither path uses DB-persisted conversation sessions, vector memory, or a unified context packet builder.

**Biggest strength:** `proposed_actions` table + state machine + `execute_approved_action()` function provides a robust backend approval gate for all director-approved mutations.

**Biggest weakness:** No DB-persisted conversation sessions. DONNA has zero cross-session memory. Every page reload loses all conversational context.

**Highest-risk missing layer:** Persistent conversation spine (conversation_sessions + messages table). Without it, DONNA cannot reason about "last time you asked me X" or build operational continuity across director sessions.

**Best next sprint:** Sprint 914.2 — DONNA Backend Spine V1: add `donna_conversation_sessions`, `donna_conversation_messages`, and `donna_working_memory` tables. These three tables close the largest backend gap without requiring vector infrastructure.

---

## B. Category Ratings

### 1. DONNA Conversation Memory — 4/10

**Current implementation:**

| File | Description | Used by |
|---|---|---|
| `donnaChatSessionMemory.ts` | Sprint 912.x in-process module-level singleton (30-turn cap, resets on reload) | `DonnaVoiceReadyShell.tsx` (active) |
| `donnaSessionMemory.ts` | Module-level array of `SessionMemoryEntry[]` — older pattern | Legacy components only |
| `donnaSafeSessionMemory.ts` | localStorage-based memory with route tracking, topic recording, entity labels | `DonnaAssistantButton.tsx` (legacy) |

**Missing:**
- No `donna_conversation_sessions` DB table
- No `donna_conversation_messages` DB table
- No `donna_working_memory` DB table
- No cross-session persistence of any kind
- Three separate session memory implementations with no coordination

**Risks:**
- A director who built context ("DONNA, Jordan needs a curriculum review") loses all of it on page reload
- The three parallel implementations can produce inconsistent state if both shells are active
- Module-level singletons cannot be garbage-collected, could cause memory leaks in long sessions

**Recommended fix:** Migrate to a single `donnaChatSessionMemory.ts` (Sprint 912.x) as canonical in-session, and add a DB-backed `donna_conversation_sessions` + `donna_conversation_messages` table for cross-session persistence.

---

### 2. Operational Data Retrieval — 7/10

**Current implementation:**

| File | Description | Tables accessed |
|---|---|---|
| `directorDonnaContext.ts` | 15+ queries aggregated at page render | `sessions`, `proposed_actions`, `players`, `coaches`, `coach_observations`, `session_attendance`, `curriculum_levels`, `templates`, `assessments`, etc. |
| `extendedContextLoaders.ts` | Player curriculum states, assessment summaries, group summaries, template summaries | `player_curriculum_states`, `assessments`, `groups`, `templates` |
| `coachDonnaContext.ts` | Coach-specific context | `sessions`, `players`, `proposed_actions` |
| `curriculumBuilderDonnaContext.ts` | Curriculum builder context | curriculum tables |
| `directorKpiDonnaContext.ts` | KPI-specific context | various |

**Missing:**
- No centralized DAL (Data Access Layer) — queries are scattered across context loaders
- `directorCtx` is stale after page render (rebuilt only on navigation)
- No caching of stable data (academy profile, curriculum structure, permission matrix)
- No real-time refresh mechanism

**Risks:**
- Director asks "what is my KPI?" → DONNA uses page-render-time data, not current state
- Performance: 15+ queries fired on every `/director/donna` page load

**Recommended fix:** Add edge caching for stable context (academy profile, curriculum structure). Provide a lightweight "context refresh" endpoint DONNA can call mid-conversation.

---

### 3. Event Ledger — 6/10

**Current implementation:**

| Table/File | Sprint | Description |
|---|---|---|
| `audit_logs` (DB) | Migration 009 | Writes on `execute_approved_action()`, curriculum draft creation, approval/rejection |
| `voice_commands` (DB) | Migration 008 | Raw input + normalized_intent JSONB + processing_status |
| `action_execution_logs` (DB) | Migration 009 | Execution result per proposed_action |
| `object_snapshots` (DB) | Migration 011 | Full JSONB snapshot before/after any change |
| `donnaAuditTrail.ts` | Sprint unknown | Audit trail helper |
| `donnaAuditHelpers.ts` | Sprint unknown | Helper functions |

**Missing:**
- No DONNA-specific event type enum beyond `action_type` (which is DB-side)
- DONNA conversation events not logged: `user_intent_detected`, `context_packet_generated`, `recommendation_generated`, `recommendation_accepted`, `recommendation_rejected`
- `voice_commands.processing_status` pipeline never fully used in God Mode path (Sprint 912.x bypasses it)
- No academy-level event ledger separate from `audit_logs`

**Key gap:** `audit_logs` and `voice_commands` record what was approved/executed but not the full DONNA reasoning chain. A future `donna_conversation_messages` table would close this gap.

**Risks:**
- No audit trail for DONNA's reasoning — cannot replay "why did DONNA recommend X"
- The voice_commands pipeline (migration 008) is architecturally correct but not used by the God Mode path

**Recommended fix:** Add `donna_events` table (or extend `audit_logs`) with DONNA-specific event types. Route key DONNA decisions through it.

---

### 4. Snapshot System — 6/10

**Current implementation:**

| Component | Description |
|---|---|
| `object_snapshots` (DB, migration 011) | Full JSONB snapshot of any object before/after change. Has `object_type`, `object_id`, `snapshot`, `taken_reason` |
| `academy_curriculum_overrides` | Stores proposed curriculum changes as JSONB with before/after state |
| `directorCtx` snapshots | Page-render aggregation of current academy state (in-process only) |

**Missing:**
- No periodic academy health snapshots
- No player development snapshots
- No `entity_summaries` table
- Snapshots are taken on demand (pre_edit, pre_delete, approval) but not systematically refreshed
- No scheduled snapshot job

**Recommended fix:** Add a lightweight `academy_snapshots` materialized view or scheduled snapshot function to capture weekly academy health state.

---

### 5. Vector / Semantic Memory — 1/10

**Current implementation:** None found.

**Searched:**
- All 69 migration files — no `pgvector`, no `CREATE EXTENSION vector`, no `embeddings` table
- All DONNA lib files — no embedding generation or semantic search logic
- `search/academySearch.ts` — not found in repo (file listed but not accessible in audit)

**Missing:** Everything. No vector extension, no embeddings table, no semantic search, no coach note embeddings, no curriculum node embeddings.

**Risks:**
- DONNA cannot do semantic search ("find drills similar to forehand preparation")
- DONNA cannot do memory retrieval by concept ("last time we discussed Orange 2 curriculum")
- Long-term: limits DONNA's ability to surface contextually relevant historical information

**Recommended fix (not urgent):** Add `CREATE EXTENSION IF NOT EXISTS vector` to a future migration. Create an `entity_embeddings` table. Implement embedding generation for key entities (player summaries, curriculum descriptions, coach notes). This is a V2 feature.

---

### 6. Intent Routing — 6/10

**Current implementation:**

| File | Description | Wired to |
|---|---|---|
| `donnaIntentClassifier.ts` (Sprint 592) | Keyword-based `DonnaCommandCategory` classification with confidence scoring | `DonnaAssistantButton.tsx`, `CoachSessionVoiceShell.tsx` |
| `donnaCommandRouter.ts` | Routes classified intents to handlers | Legacy path |
| `donnaConversationalRouter.ts` | Sprint 726 — route/page-aware fallback routing | `DonnaVoiceReadyShell.tsx` (fallback step) |
| `DonnaVoiceReadyShell.tsx` handleSend pipeline | 34-interceptor regex-based routing | God Mode shell (active) |

**Critical gap:** The God Mode shell (`DonnaVoiceReadyShell.tsx`) does NOT use `donnaIntentClassifier.ts`. Instead it uses a flat 34-interceptor regex pipeline. This means:
- Two parallel intent routing systems exist
- The sophisticated `DonnaCommandCategory` taxonomy (30+ categories) is not used by the active shell
- Intent routing logic is scattered across 34 code blocks in a single function

**Recommended fix:** In a future sprint, replace the flat 34-interceptor pipeline with a call to `donnaIntentClassifier.ts` at the start of `handleSend()`, then route from the classified category to specific handlers. This would make the routing centralized, testable, and extensible.

---

### 7. Context Packet Builder — 4/10

**Current implementation:**

| File | Description |
|---|---|
| `contextPackages.ts` | Defines typed `PlayerContextPackage`, `SessionContextPackage`, `TemplateContextPackage` — pure type definitions |
| `reviewQueueContextPackage.ts` | Specialized review queue context |
| `approvalContextBuilder.ts` | Approval-specific context |
| `directorDonnaContext.ts` | Closest thing to a context builder — loads 15+ fields at page render |
| `academyHealthContextPackage.ts` | Academy health context |

**Missing:**
- No `buildDonnaContextPacket()` / `assembleAssistantContext()` unified function
- No function that builds the full target packet before AI inference:
  ```
  { user_message, academy_context, user_role, permission_scope, active_page,
    active_workflow, current_entity, recent_conversation, recent_actions,
    relevant_curriculum, relevant_templates, director_preferences,
    player_context, group_context, allowed_actions, pending_approvals }
  ```
- `directorCtx` (the closest equivalent) is page-render-scoped, not request-scoped
- No `active_workflow` or `current_entity` tracking
- No `director_preferences` system

**Risks:**
- Every DONNA answer builds its own context from scratch
- No unified picture of "what the director is currently doing"
- Adding new context fields requires touching `directorDonnaContext.ts` only

**Recommended fix:** Sprint 914.2 should add a `buildDonnaContextPacket()` function that assembles page context, conversation history, pending approvals, and active entity into a single typed packet. This is the highest-leverage backend addition.

---

### 8. DONNA Response Schema — 6/10

**Current implementation:**

| File | Description |
|---|---|
| `DonnaSafeReadAnswer` (in `donnaSafeReadActions.ts`) | Partial schema: `{ text, actionId, confidence, sourceNote, followUp, href, isAnswerable }` |
| `donnaResponseComposer.ts` | Used by legacy `DonnaAssistantButton.tsx` — composes structured responses |
| `proposed_actions` table | Full structured action payload with `proposed_payload`, `risk_level`, `risk_notes`, `affected_count` |
| `DonnaAttentionPriority` (Sprint 913.2) | Structured priority with `id, label, category, severity, score, whyItMatters, evidence, bestNextAction, donnaWillNotDo` |

**Missing from target schema:**
- `suggested_ui_operations` — what UI elements should respond to this answer
- `event_log_payload` — what should be logged when this response is sent
- `requires_approval` flag on the response itself (currently only on `DonnaAttentionPriority.requiresApproval`)
- Zod validation of response shapes

**Recommended fix:** Extend `DonnaSafeReadAnswer` with `requiresApproval: boolean | null` and `eventType: string | null` for richer traceability.

---

### 9. Action Registry — 8/10

**Current implementation:**

| File | Sprint | Description |
|---|---|---|
| `directorActionRegistry.ts` | Sprint 606 | Comprehensive: 50+ `DirectorDonnaAction` entries, each with `id`, `domain`, `actionClass` (`answer_only`, `draft_only`, `propose_with_approval`, etc.), `allowedRoles`, `requiredApprovalLevel`, `implementationStatus`, `uiWiringStatus` |
| `donnaUIActionRegistry.ts` | Sprint unknown | UI-level action registry |
| `donnaActionTypes.ts` | Sprint 1020 | Action type definitions |
| `directorActionTypes.ts` | Sprint 606 | Director-specific action types |
| `directorActionPolicy.ts` | Sprint unknown | Policy enforcement for director actions |

**Strengths:**
- `implementationStatus` field (`'implemented'`, `'partially_implemented'`, `'not_started'`) on every action — excellent for tracking progress
- `uiWiringStatus` field (`'full'`, `'partial'`, `'none'`) — surfaces unwired actions
- `requiredApprovalLevel` is typed and enforced per action

**Not wired to God Mode shell:**
- `directorActionRegistry.ts` is imported by legacy components
- God Mode shell uses its own 34-interceptor pipeline instead of the registry
- This means the registry's `implementationStatus` tracking is stale

**Recommended fix:** Wire `directorActionRegistry.ts` as the single source of truth for available DONNA actions. Use it in both shells.

---

### 10. Approval Gates — 7/10

**Current implementation:**

| Component | Description |
|---|---|
| `proposed_actions` (DB) | Full state machine with 8 statuses: `pending_review → approved → executed / rejected / failed / expired` |
| `proposedActionStateMachine.ts` | Valid transition enforcement |
| `execute_approved_action()` (DB function) | Only path to execute a voice command — status must be `approved` |
| `donnaGateway.ts` | Feature flag, kill switch, rate limit checks before any AI call |
| `curriculumOverrideApprovalActions.ts` | `approveCurriculumOverrideDraft()` / `rejectCurriculumOverrideDraft()` for curriculum changes |
| Frontend: `triggerCurriculumContentConfirmation()` | Sprint 912.x confirmation before draft creation |

**Strengths:**
- Database-level enforcement: `execute_approved_action()` DB function is the ONLY path to mutate core data
- State machine prevents invalid transitions
- Gateway provides cross-cutting kill switch capability

**Weakness:**
- The Sprint 912.x curriculum draft path bypasses `voice_commands` and `proposed_actions` — it writes directly to `academy_curriculum_overrides` via `createCurriculumContentItemDraft()`. This is by design (different approval queue) but creates two parallel approval patterns.
- Frontend confirmation (`triggerCurriculumContentConfirmation`) is client-side only — no backend enforcement of "confirmation required" for the curriculum override path

**Recommended fix:** Add a backend guard in `createCurriculumContentItemDraft()` that verifies the caller is authenticated and authorized before inserting. (It already does this — but document it clearly as the curriculum-override-specific approval gate.)

---

### 11. Recommendation Feedback Loop — 3/10

**Current implementation:**

| File | Description |
|---|---|
| `pilotFeedbackModel.ts` | `PilotFeedbackEntry` type with `severity`, `tag`, `body` — for collecting pilot feedback |
| `PilotFeedbackReviewPanel.tsx` | UI panel for reviewing pilot feedback |
| `academy_curriculum_overrides` | Tracks `approved_at`, `rejected_at`, `rejection_reason` — partial feedback signal |

**Missing:**
- No `recommendation_feedback` DB table
- No tracking of which recommendations were accepted vs. rejected vs. modified
- `pilotFeedbackModel.ts` appears to be for collecting free-form pilot feedback, not recommendation outcome tracking
- No "DONNA recommended X, director did Y" loop

**Recommended fix:** When a `proposed_action` is approved/rejected/modified, record which DONNA recommendation (if any) it originated from. Create a lightweight `donna_recommendation_outcomes` table.

---

### 12. Caching / Low-Latency Retrieval — 2/10

**Current implementation:**

| Pattern | Description |
|---|---|
| `directorCtx` | Rebuilt on every page render via `loadDirectorDonnaContext()` — 15+ DB queries each time |
| `donnaSafeSessionMemory.ts` | localStorage for UI state (not DB data) |
| Next.js `revalidatePath()` | Server cache invalidation after writes — not a data cache |

**Missing:**
- No Redis or distributed cache
- No stable data cache (academy profile, curriculum structure, permission matrix)
- No request-level cache within a single DONNA conversation session
- Academy health data is re-queried for every message in the conversation

**Risks:**
- Director asks 10 questions in one session → 10 × `loadDirectorDonnaContext()` calls? Actually no — `directorCtx` is loaded once at page render and passed as a prop. But it becomes stale after the first page load.
- Repeated DB queries for stable data (curriculum levels, academy settings) on every context load

**Recommended fix (not urgent):** Cache stable data (academy profile, curriculum spine, permission matrix) with a short TTL (5 minutes). This is a V2 performance optimization.

---

## C. File-Level Findings

### Files Inspected

| File | Sprint | Status |
|---|---|---|
| `donnaChatSessionMemory.ts` | 912.x | Active — in-process singleton, used by God Mode shell |
| `donnaSafeSessionMemory.ts` | Unknown | Active — localStorage, used by legacy button |
| `donnaSessionMemory.ts` | Unknown | Active — module-level array, used by legacy components |
| `donnaIntentClassifier.ts` | 592 | Built, wired to legacy path only |
| `directorActionRegistry.ts` | 606 | Built, wired to legacy path only |
| `directorActionTypes.ts` | 606 | Built, wired to legacy path only |
| `donnaGateway.ts` | 425 | Built, designed for server actions — not used by God Mode shell |
| `proposedActionStateMachine.ts` | 417 | Built, used by server actions |
| `contextPackages.ts` | 1014 | Type definitions only — no builder function |
| `donnaResponseComposer.ts` | Unknown | Active — used by legacy `DonnaAssistantButton.tsx` |
| `directorDonnaContext.ts` | 1012 | Active — used by God Mode shell and legacy path |
| `donnaAttentionRankingEngine.ts` | 913.2 | Active — used by God Mode shell |
| `donnaSignalCorrelationEngine.ts` | 913.6 | Active — used by God Mode shell |
| `pilotFeedbackModel.ts` | Unknown | Built, wired to `PilotFeedbackReviewPanel.tsx` |
| `conversation/index.ts` | 462 | Re-exports only — no DB |
| `donnaAuditTrail.ts` | Unknown | Built — usage unclear |

### Files NOT in repo (searched but not found)

- No `embeddings.ts` or `vector.ts`
- No `donna_conversation_sessions` DB table
- No `donna_conversation_messages` DB table
- No `donna_working_memory` DB table
- No `academy_events` table (separate from `audit_logs`)
- No `entity_summaries` table

---

## D. Database-Level Findings

### Existing Relevant Tables

| Table | Migration | DONNA-relevant? |
|---|---|---|
| `proposed_actions` | 009 | ✅ Core approval gate |
| `voice_commands` | 008 | ✅ Intent pipeline (bypassed by God Mode path) |
| `action_execution_logs` | 009 | ✅ Execution audit |
| `audit_logs` | 009 | ✅ Final-state audit |
| `object_snapshots` | 011 | ✅ Before/after snapshots |
| `academy_curriculum_overrides` | 048 | ✅ DONNA curriculum draft queue |
| `players` | 004 | ✅ |
| `sessions` | 007 | ✅ |
| `coach_observations` | 010 | ✅ |
| `session_attendance` | 007 | ✅ |
| `curriculum_levels` | 036 | ✅ |
| `player_curriculum_states` | unknown | ✅ |
| `assessments` | 005 | ✅ |
| `groups` | unknown | ✅ |
| `templates` | unknown | ✅ |

### Missing Recommended Tables

| Table | Priority | Purpose |
|---|---|---|
| `donna_conversation_sessions` | **Critical** | Cross-session conversation persistence |
| `donna_conversation_messages` | **Critical** | Message history per session |
| `donna_working_memory` | **High** | Active entity, workflow, page, pending action state |
| `donna_events` | High | DONNA-specific event log (intent detected, recommendation generated) |
| `entity_embeddings` | Medium | Semantic search (V2) |
| `donna_recommendation_outcomes` | Medium | Feedback loop: accepted/rejected/modified |
| `academy_snapshots` | Low | Periodic academy health snapshots |

---

## E. Architecture Gap Map

### Already Solid

- `proposed_actions` state machine + `execute_approved_action()` DB function
- `voice_commands` schema (complete, though bypassed by God Mode path)
- `audit_logs` and `object_snapshots` for mutation tracking
- `academy_curriculum_overrides` as curriculum-specific approval queue
- `directorActionRegistry.ts` — comprehensive, typed action definitions
- `donnaGateway.ts` — kill switch, feature flags, rate limiting
- `directorDonnaContext.ts` — loads rich live context (15+ fields)
- `donnaAttentionRankingEngine.ts` + `donnaSignalCorrelationEngine.ts` — Sprint 913.x intelligence
- `proposedActionStateMachine.ts` — valid transition enforcement

### Partially Built

- In-session memory (`donnaChatSessionMemory.ts`) — good but 3 parallel implementations
- Intent routing (`donnaIntentClassifier.ts`) — built, not wired to God Mode shell
- Context packages (`contextPackages.ts`) — typed but no builder function
- Response schema (`DonnaSafeReadAnswer`) — partial
- Caching — only `revalidatePath()`, no data cache
- Event ledger — `audit_logs` exists but no DONNA-specific event types

### Missing

- DB-persisted conversation sessions and messages
- `donna_working_memory` for active workflow/entity state
- Unified context packet builder
- Semantic/vector memory
- Recommendation feedback tracking
- Academy health snapshots

### Dangerous/Fragile

- Three parallel session memory implementations — risk of divergence
- God Mode shell bypasses the `voice_commands` pipeline entirely — two uncoordinated entry paths
- `directorCtx` is stale after page render — no refresh mechanism mid-conversation
- Intent routing in God Mode shell is a 34-interceptor flat function — fragile to add new intents

### Not Needed Yet

- LLM-based intent classification (keyword-based is sufficient for V1)
- Full vector semantic search (text search sufficient for V1)
- Distributed caching / Redis (page-render context sufficient for demo)
- Real-time event streaming (WebSocket/SSE for context refresh)
- Multi-turn AI inference (current deterministic approach works for V1)

---

## F. V1 Recommendation

**Minimum backend build for a reliable DONNA V1 operating spine:**

The three highest-value additions that close the critical gaps without overbuilding:

### Priority 1: Conversation Spine (conversation_sessions + messages)

```sql
CREATE TABLE donna_conversation_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    UUID NOT NULL REFERENCES academies(id),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE donna_conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES donna_conversation_sessions(id),
  role            TEXT NOT NULL CHECK (role IN ('user', 'donna', 'system')),
  content         TEXT NOT NULL,
  intent_category TEXT,
  action_id       TEXT,
  confidence      TEXT,
  source_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Value:** Director can ask "What did we discuss last time?" and DONNA can answer.

### Priority 2: Working Memory (donna_working_memory)

```sql
CREATE TABLE donna_working_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES donna_conversation_sessions(id),
  memory_key    TEXT NOT NULL,
  memory_value  JSONB NOT NULL,
  expires_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Value:** Stores active workflow state (which player is being discussed, which curriculum level is in focus, pending confirmation) in a way that survives component remounts.

### Priority 3: Unified Context Packet Builder

```typescript
// src/lib/donna/buildDonnaContextPacket.ts
export async function buildDonnaContextPacket(
  userId: string,
  academyId: string,
  message: string,
  sessionId: string | null,
): Promise<DonnaContextPacket>
```

**Value:** Single entry point for all DONNA AI calls. Pulls `directorCtx`, recent messages, active workflow state, pending approvals, and permission scope into one typed packet.

### Deferred for V2

- `entity_embeddings` / semantic search
- `donna_recommendation_outcomes`
- `academy_snapshots`
- Real-time context refresh
- LLM-based intent classification

---

## G. Proposed Sprint 914.2

### Sprint 914.2 — DONNA Backend Spine V1

**Objective:** Add the minimum DB tables and TypeScript layer to give DONNA persistent conversation memory and a unified context packet builder.

**Protected systems:**
- All Sprint 904 approve/reject actions
- All Sprint 912.3–913.7 behavior
- `proposed_actions` state machine
- `execute_approved_action()` DB function
- `audit_logs` structure

**Files likely touched:**

| File | Change type |
|---|---|
| `supabase/migrations/070_donna_conversation_spine.sql` | NEW — `donna_conversation_sessions`, `donna_conversation_messages`, `donna_working_memory` |
| `src/lib/donna/buildDonnaContextPacket.ts` | NEW — unified context packet builder |
| `src/lib/donna/donnaChatSessionMemory.ts` | MODIFY — add DB persistence option alongside in-process singleton |
| `src/app/api/donna/session/route.ts` | NEW — session create/read/append API |
| `src/app/director/donna/DonnaDirectorShellClient.tsx` | MODIFY — pass session_id to DonnaVoiceReadyShell |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | MODIFY — persist turns to DB when session_id available |

**Database migrations needed:**
- `070_donna_conversation_spine.sql` — 3 tables with RLS
- Tables must have `academy_id` for RLS scoping
- All reads/writes gated on authenticated user + academy membership

**Acceptance criteria:**
1. Director opens `/director/donna` — session is created in `donna_conversation_sessions`
2. Each message pair is persisted to `donna_conversation_messages`
3. "What did we discuss last time?" → DONNA retrieves last session's messages
4. Page reload → DONNA shows "Continuing from last session: [topic]"
5. All existing DONNA behavior preserved
6. `npx tsc --noEmit` clean
7. All existing QA scenarios still pass

**Validation commands:**
```bash
npx tsc --noEmit
# After migration applied:
SELECT count(*) FROM donna_conversation_sessions WHERE academy_id = '<id>';
SELECT count(*) FROM donna_conversation_messages WHERE session_id = '<id>';
```

**Manual QA scenarios:**
1. Ask "Add a drill for Orange 2 focused on forehand prep" → "yes" → reload page → "What did we discuss?" → DONNA recalls the drill draft
2. Ask "Give me my director brief" → reload → director brief response includes "[continuing session]"
3. Verify RLS: Coach cannot read director's conversation sessions

**Rollback notes:**
- If migration causes issues, drop the 3 new tables — no existing tables are modified
- The in-process `donnaChatSessionMemory.ts` singleton continues to work as fallback
- Feature-flag the DB persistence: if `DONNA_PERSIST_SESSIONS=false`, fall back to in-process only
