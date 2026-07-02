# DONNA Unified Operating Layer Audit — Sprint 4358

**Date:** 2026-07-02
**Sprint:** 4358 — Unified DONNA Operating Layer Audit
**Type:** Audit-only (documentation). No product code changed. No migration.
**Authority:** Subordinate to `docs/ARCHITECTURE.md` (the Architecture Constitution). Where this
audit and the Constitution appear to differ, see §3 — the Constitution's *intent* stands; this
audit sharpens one factual claim about the code reality.

---

## 0. Purpose and method

This is the opening audit of the "Unify DONNA" arc (Sprints 4358–4365). Its job is to establish
the **file-level truth** of every DONNA-related surface before any convergence work begins, and to
turn the Constitution's tracked deviation — *"DONNA pipeline consolidation (4 brains → 1)"*
(`ARCHITECTURE.md` §12.2) — into an operational map with a deletion checklist.

**Method:** Read the six required docs (`AI_BACKEND_RULES`, `CURRENT_BUILD_TARGET`, `LOCKED_MODULES`,
`KNOWN_LIMITATIONS`, `MODULE_BUILD_PROCESS`, `CHANGELOG`) plus `ARCHITECTURE.md` §5/§6/§9/§10, then
four parallel read-only code sweeps across `src/lib/donna/` (607 files), `src/components/`,
`src/app/`, and `src/app/api/`. Every claim below is anchored to a file path.

**Headline:** `src/lib/donna/` holds **607 files**; the Constitution's target is **~15–25**. DONNA is
not one system today — it is **three parallel conversation stacks** plus a fleet of canned surfaces.
The safety-critical core (one brain, a structural mutation firewall) is already converged and sound.
The fragmentation is concentrated in **routing, surfaces, context, memory, and the model boundary** —
all of which converge by **deletion**, not rebuild.

---

## 1. All DONNA surfaces found

### 1.1 Live conversational surfaces (real backend)

| Surface | File | Portal(s) | Backend |
|---|---|---|---|
| Floating `DonnaAssistantButton` | `src/components/assistant/DonnaAssistantButton.tsx` | Director + Coach (both layouts) | **Real LLM** → `donnaLiveConversationAction` |
| Full-page shell `DonnaVoiceReadyShell` | `src/components/donna/DonnaVoiceReadyShell.tsx` | `/director/donna`, `/coach/donna` | **Separate** client-side `processDonnaMessage` + `donnaConversationActions` persistence |
| `DonnaDirectorShellClient` / `CoachDonnaShellClient` | `src/app/director/donna/…`, `src/app/coach/donna/…` | Director / Coach | Thin wrappers over `DonnaVoiceReadyShell` |
| `CoachWrapUpDrawer` / `DonnaVoiceWrapUpShell` / `CoachSessionVoiceShell` | `src/app/coach/sessions/[sessionId]/…`, `src/components/donna/…` | Coach | Wrap-up save actions (voice-driven) |

### 1.2 Canned / non-LLM surfaces

| Surface | File | Portal | Notes |
|---|---|---|---|
| `DirectorAssistantPanel` | `src/app/director/command-center/DirectorAssistantPanel.tsx` | Director | Static `AssistantActionCard` links + voice button. **No conversation backend.** |
| `DonnaChat` | `src/components/player/DonnaChat.tsx` | Player (`/player/ask-donna`) | Tap-a-chip canned Q&A → `dispatchUIIntent`. **No LLM. Bypasses the brain.** |
| `ParentDonnaChat` | `src/components/player/ParentDonnaChat.tsx` | Parent (`/parent/ask-donna`) | Near-identical twin of `DonnaChat`. **No LLM. Bypasses the brain.** |

### 1.3 Support / embedded / passive surfaces

- `DonnaCommandBar` — **two files exist**: `src/app/director/_components/DonnaCommandBar.tsx` (mounted
  in the director layout) and `src/components/donna/DonnaCommandBar.tsx` (calls `donnaGlobalCommandAction`).
  Likely divergent copies.
- `DonnaReviewQueuePanel` (`src/components/assistant/`), `DonnaPanelShell` (container).
- `DonnaHighlightBanner` (`src/components/donna/`) — passive banner in director + coach layouts.
- `DonnaWakeWordLayer` (`src/components/donna/`) — wake-word listener, **director layout only**.
- Embedded scoped panels: `CurriculumDonnaPanel`, `TemplateDonnaPanel`, `OnboardingDonnaPanel`,
  `AskDonnaInlinePrompt`.
- **~90 additional render components** across `src/components/donna/` + `src/components/assistant/`
  (answer cards, previews, confirmations, dashboards) — not conversation *entry* surfaces, but part
  of the surface-area sprawl.

---

## 2. Current true brain / router / provider architecture

### 2.1 The brain (canonical, singular)

`src/lib/donna/brain/processDonnaMessage.ts` — **~1,942 lines / ~101 KB**, a 14-step orchestrator.
Input: `DonnaMessageInput { role, route, livePageState, … }`. Output: a `DonnaMessageAction`
(e.g. `live_ai_assist`, `strategic_ai_assist`, `respond`). **This is genuinely the single brain** —
it is imported by both live shells and both AI-assist server actions. There is no second brain of
equal standing wired to live UI.

### 2.2 The routing layer (four live paths — the real fragmentation)

| Router | Function | Live importers | Verdict |
|---|---|---|---|
| `brain/donnaCanonicalRouter.ts` | `routeDonnaConversation` | `DonnaAssistantButton` only (+ `executiveShadowMode`) | **CANONICAL — but wired into only ONE shell** |
| `donnaConversationalRouter.ts` | `routeDonnaPrompt` | `DonnaAssistantButton`, `DonnaVoiceReadyShell`, `donnaResponseComposer` | **LEGACY-but-LIVE** (parallel fallback in both shells) |
| `donnaIntentRouterV1.ts` | `routeDonnaIntentV1` | `DonnaVoiceReadyShell`, `CurriculumDonnaPanel`, `curriculumArchitect` | **LEGACY-but-LIVE** |
| `donnaCommandRouter.ts` | (command path) | `CoachSessionVoiceShell`, command cards | **SEPARATE subsystem** (coach/command, not director-conversation) |

Shared utilities (keep, not competing routers): `donnaIntentClassifier.ts` (15 importers, consumed by
the brain), `entity/donnaEntityIntentRouter.ts`. Narrow/separate: `donnaGlobalIntentRouter.ts`
(global command). **Dead:** `donnaSafeActionRouter.ts`, `llmOrchestration/safeActionRouter.ts`
(eval-harness only).

**Key finding:** `DonnaVoiceReadyShell.tsx` — the `/director/donna` + `/coach/donna` shell that
`donnaCanonicalRouter`'s own header comment says it was written to consolidate — **does not import
`routeDonnaConversation`.** It calls `processDonnaMessage` + `routeDonnaPrompt` + `routeDonnaIntentV1`
directly. The "one router" convergence was completed **only for the floating button.**

### 2.3 The provider / gateway layer (two live providers)

| Path | Adapter | Provider / model | Status |
|---|---|---|---|
| Chat brain | `conversation/donnaConversationTeacher.ts` (direct `fetch`) | **OpenAI `gpt-4o-mini`** | Live |
| Chat gateway wrapper | `brain/donnaOpenAIGateway.ts` (`callDonnaOpenAIGateway`) | re-exports `askConversationTeacher` | **Nominal** — only consumed by the executive path, not the live shells |
| Tool orchestration | `llmOrchestration/llmApiClient.ts` (`callDonnaLlm`) | **Anthropic `claude-sonnet-4-6`** | Live → `donnaOrchestratorAction` |
| Model-agnostic abstraction | `src/lib/ai/aiReasoningProvider.ts` | Anthropic `claude-haiku-4-5-20251001` | **Zero call sites — dead** (future swap-point) |

Additional ungoverned OpenAI `fetch` sites: `learning/donnaLearningAnalyzer.ts`,
`knowledgePromotion/donnaKnowledgeDraftGenerator.ts`, + 3 voice/audio API routes (TTS, Whisper,
Realtime). The executive reasoning stack (`executive/*`) is **wired but DORMANT** —
`DONNA_EXECUTIVE_REASONING` defaults to `'off'` (`executiveShadowMode.ts`).

---

## 3. Correction to the Constitution claim

`ARCHITECTURE.md` §5.1 states: *"~4 parallel brains — Anthropic `orchestrate()`, the OpenAI
`processDonnaMessage`, a strategic path, and a separate `components/assistant` stack."*

**Code reality is more precise, and the distinction changes the size and risk of the job:**

| Constitution phrasing | Code reality |
|---|---|
| "4 parallel brains" | **One true brain** — `processDonnaMessage`, genuinely singular and wired to every live entry point. |
| (implied: rebuild) | The plurality is in **routing (4 live paths)** and **providers (2 live: OpenAI + Anthropic)**, not in reasoning cores. |
| (implied scope) | Convergence is **router + surface + model-boundary work**, *not* a brain rebuild. |

**Restated correction (load-bearing):**
1. There are **not** four parallel brains in code reality.
2. There is **one true brain: `processDonnaMessage`.**
3. There are **four routing paths** reaching live UI (`routeDonnaConversation`, `routeDonnaPrompt`,
   `routeDonnaIntentV1`, plus the separate command router).
4. There are **two live providers** (OpenAI `gpt-4o-mini` for chat; Anthropic `claude-sonnet-4-6`
   for tool orchestration), hardcoded per path.
5. Therefore convergence is **router/surface/model-boundary consolidation — not a full brain
   rebuild.** This is a smaller, safer job than "4 brains → 1" implies.

> This does not contradict the Constitution's *intent* (one pipeline, one brain, one LLM client) —
> it sharpens the *diagnosis* so the convergence sprints target the right layer. The Constitution
> should be amended at §5.1 to reflect "one brain, four routing paths, two providers" when the
> Amendment Rule is next exercised.

---

## 4. Fragmented assistant surfaces

1. **Director carries 3 overlapping surfaces:** floating widget (real LLM, `donnaLiveConversationAction`)
   + full-page `/director/donna` (`DonnaVoiceReadyShell`, separate client brain + persistence) +
   command-center `DirectorAssistantPanel` (canned). Same user, same portal, different backends.
2. **Coach mirrors it:** floating widget + `/coach/donna` full-page shell + wrap-up drawer/voice shells.
3. **`DonnaVoiceReadyShell` is a shared mega-shell** (both `/director/donna` and `/coach/donna`) that
   reimplements routing (`routeDonnaPrompt` + `routeDonnaIntentV1`) and bypasses the canonical router.
4. **Player & Parent chats are near-identical canned twins** (`DonnaChat` / `ParentDonnaChat`) — no
   LLM, no brain, no role policy.
5. **Duplicated support components:** two `DonnaCommandBar` files; two voice-input buttons
   (`VoiceInputButton` vs `DONNAVoiceInputButton`); two voice runtimes.

---

## 5. Current entry points

- Floating `DonnaAssistantButton` — mounted in **director + coach layouts** (all routes in those portals).
- Full-page shells — `/director/donna`, `/coach/donna`.
- **Wake word** (`DonnaWakeWordLayer` / `useDonnaWakeWord`) — **director layout only**; not mounted for
  coach/player/parent.
- `DonnaCommandBar` (top command bar) → `donnaGlobalCommandAction`.
- Voice/dictation buttons — command-center + coach wrap-up; realtime voice in the director onboarding
  interview (`/api/director/interview/realtime-session`).
- Player/parent "Ask DONNA" chip pages (`/player/ask-donna`, `/parent/ask-donna`).

---

## 6. Current conversation capability

- **One genuinely live LLM conversation path:** `donnaLiveConversationAction`
  (`src/app/director/_actions/`) → `processDonnaMessage` → executive refinement → OpenAI. A secondary
  `donnaStrategicConversationAction` handles `strategic_ai_assist`. **Both are gated to
  `academy_director` + `head_coach` only** (`ALLOWED_ROLES`).
- The full-page shell runs `processDonnaMessage` **client-side** with a **separate** persistence path
  (`donnaConversationActions`) — overlapping, not shared with the widget.
- **Coaches proper, players, and parents get no live LLM.** Player/parent surfaces return precomputed
  canned chips.
- **Verdict:** conversation is real, but reachable by **~2 roles through 1 of ~4 routing paths.**

---

## 7. Current page-awareness capability — REAL, but not where the names suggest

- **The working mechanism:** `src/lib/donna/operating/pageContextResolver.ts`
  (`route → PageIntelligence`: purpose, visible data, key metrics, completion goals, recommended next
  action, warnings) + `operating/buildLivePageState.ts` + `operating/pageCompletionEngine.ts` — all
  wired into `processDonnaMessage` at Step 0. Page context genuinely reaches the conversation.
- **The named legacy cluster duplicates it and is largely dead:**

| Module | Status |
|---|---|
| `pageContextRegistry.ts` | **DEAD** — zero importers |
| `donnaContextResolver.ts`, `donnaPageElementRegistry.ts` | Near-orphan (self-referential with `donnaWhatNextEngine`) |
| `donnaPageContextEngine.ts` | Reaches the brain only indirectly via context packs; otherwise UI-only |
| `donnaPageChipRegistry.ts`, `pageOwnedWorkflows.ts` | UI-only |
| `pageSync/donnaPageSyncEvents.ts` | Real, but UI-side only (drives greetings/refresh, not brain reasoning) |

- **Systematic gap:** *live* state ("what's missing right now") is not passed from the
  `DonnaAssistantButton` call sites for ~7/10 atomic loops. DONNA knows what a page is *for*, but
  often not its *current* state.

---

## 8. Current role-awareness capability

- **Real for director/coach:** `src/lib/donna/brain/donnaRoleResponsePolicy.ts` — hardcoded
  `ROLE_SCOPE` (director=`academy_wide`, coach=`assigned_sessions`, parent=`own_child_progress`,
  player=`own_development`) + per-role denylists (coach blocked from player data outside assigned
  groups; parent blocked from raw coach notes). `applyRolePolicy()` runs inside `processDonnaMessage`.
  Door gate: `donnaLiveConversationAction` restricts to `academy_director` + `head_coach`
  (`head_coach` mapped to `coach` for policy).
- **🔴 Critical gap:** **parent & player chat surfaces bypass the brain and `applyRolePolicy` entirely**
  (`dispatchUIIntent` / `donnaUIActionDispatcher`). The "non-negotiable, never weakened" parent/player
  denylists **are never applied to the actual parent/player surfaces.** Their safety depends entirely
  on whatever `dispatchUIIntent` permits.
- **Orphaned:** `donnaRoleBlocks.ts` (the richest "blocked action + why + alternative" registry) is
  imported only by an unimported barrel — effectively dead.

---

## 9. Current action / tool capability — the strongest area

- **Propose → Approve → Execute:**
  1. **Propose** — `donnaSafeActionRouter.ts` (`routeDonnaAction`) classifies each tool via
     `donnaToolContract.ts` into `execute_immediately` (read / ui_guidance only), `submit_to_draft`
     (writes a `proposed_actions` row), `route_to_queue`, `role_blocked`, or `always_blocked`. The LLM
     can only emit a fixed output-type allow-list; mutation-adjacent types are `draft_proposed_action`
     / `route_to_review`, safety-validated post-parse.
  2. **Approve** — director reviews at `/director/review`. Tiers in `donnaApprovalGate.ts`:
     `none → confirmation → review_queue → director_approval → platform_owner`; **unknown categories
     default to `director_approval`** (safe default). Pre-execution: `actionExecutionGuards.ts`
     (`runExecutionGuards`) re-checks kill switch, `status === 'approved'`, expiry, academy match,
     role sufficiency.
  3. **Execute** — the **only** mutation path is the Postgres RPC `execute_approved_action`, called
     from `src/lib/backend/voice.ts`. DONNA never calls it directly; DONNA's own writes target only
     DONNA-owned tables (memory, summaries, events).
- **DONNA cannot mutate academy data directly** — the LLM output schema physically cannot express a
  write. **Structurally enforced.**
- **🔴 Deviation:** multiple action registries (`donnaActionRegistry`, `directorActionRegistry`,
  `donnaUIActionRegistry`, `actions/donnaActionRegistry`) — Constitution §3.9.

---

## 10. Current memory / learning capability

- **Durable executive learning is LIVE** — migration **084** (`donna_executive_learning`, RLS per
  academy) via `executive/donnaExecutiveLearningStore.ts` ↔ `donnaLiveConversationAction`
  (`loadDurableLearning` / `saveDurableLearning`). **But it is fail-open and untyped** — cast `as any`
  because `donna_executive_learning` was never added to generated `database.types.ts`; read error → `[]`,
  write error → `0`. Live-but-fragile: works, silently no-ops on error, not type-checked.
- **🔴 Severe duplication:** ~7 overlapping memory modules (`donnaSessionMemory`,
  `donnaSafeSessionMemory`, `donnaChatSessionMemory`, `donnaSemanticMemory`, `donnaProductMemory`,
  `donnaCrossSessionMemory`, `donnaGoalMemory`) + a **30-file `learning/`** dir + a **13-file
  `memory/`** dir.
- **Actually load-bearing set (small):** `donnaExecutiveLearningStore` (durable),
  `donnaLearningLedger` + `donnaLearningMemoryBridge` (session learning), `donnaGoalMemory` +
  `guidance/donnaCOOOrchestrationMemory` (continuity), `donnaChatSessionMemory` (transcript). The rest
  (`donnaSemanticMemory`, `donnaProductMemory`, `donnaMemoryPolicy`, most of `learning/`) is scaffolding
  kept alive mainly by certification tests. Migration 084's own header insists *"No second memory
  system"* — precisely because several had appeared.

---

## 11. Current OpenAI / model / provider status

- **Two live providers, real (not stubbed), hardcoded per path:** OpenAI `gpt-4o-mini` (chat brain via
  `donnaConversationTeacher.ts`), Anthropic `claude-sonnet-4-6` (tool orchestration via
  `llmApiClient.ts`).
- **`donnaOpenAIGateway` is a nominal wrapper, not an enforced chokepoint** — the live shells reach
  OpenAI via `askConversationTeacher` directly; the gateway is only consumed by the executive path.
- **Ungoverned call sites:** ≥5 across two providers (`donnaLearningAnalyzer`,
  `donnaKnowledgeDraftGenerator` + 3 voice/audio routes on top of the two adapters). Model IDs
  hardcoded in ≥7 files. Only one path logs usage.
- **Model-agnostic abstraction exists but is dead:** `src/lib/ai/aiReasoningProvider.ts` (zero call
  sites) — a future swap-point per Constitution §5.8 / §11.3.
- **Executive reasoning stack is wired but DORMANT** (`DONNA_EXECUTIVE_REASONING` = `'off'`).
- **Fail-open everywhere:** missing key / timeout / low-confidence / PII-block → deterministic grounded
  fallback (worst case = today's non-AI experience). Consistent with `KNOWN_LIMITATIONS`.
- Matches Constitution §5.8 deviation exactly.

---

## 12. Safety and approval boundaries

- **Mutation firewall: STRUCTURAL.** Three independent barriers: (a) the LLM output schema cannot
  express a write (`llmApiClient.ts` allow-list); (b) mutations occur only via the
  `execute_approved_action` RPC gated on `status = 'approved'`; (c) `runExecutionGuards` re-checks
  status/expiry/academy/role before that call. This satisfies core principle #4 ("DONNA never mutates
  sensitive records without human confirmation") as **architecture, not convention.**
- **Approval tiers real**; kill switches real and fail-closed; `execute_approved_action` is the single
  mutation path (Constitution §12.1 locked law).
- **Cross-role leakage: MIXED** — structural for director/coach (`redactionBlock` role+tenant,
  `donnaTrustBoundaryValidator` role map, server-auth-derived `academyId`, RLS); convention/soft at two
  spots (see §13).

**Context firewall (before the prompt is built):**

| Control | File | Effect |
|---|---|---|
| PII privacy guard | `conversation/donnaConversationTeacher.ts` (`privacyGuard`) | Regex-blocks assessment score / coach note / DOB / player id / guardian email / phone; length caps |
| Role/tenant redaction | `executive/contextResolver.ts` (`redactionBlock`) | `open`/`sensitive`/`tenant` tags; sensitive → director/head_coach; tenant → academy match |
| Auditable packet | `executive/executiveContextPacket.ts` | Records assembled vs omitted vs unavailable; sends only redacted content |
| Parent-safe filter | `llmOrchestration/parentSafeContextFilter.ts` | Strips coach notes / internal scores / risk flags / peer comparisons |
| Retrieval budget | `donnaRetrievalBudget.ts` | Per-source item caps |
| Trust boundary | `donnaTrustBoundaryValidator.ts` | 7-layer gate (flag, kill switch, role map, action class) |

---

## 13. Privacy risks (ranked, highest first)

1. **🔴 Parent/player chat bypasses the brain's hardcoded safety denylists.** `DonnaChat` /
   `ParentDonnaChat` route through `dispatchUIIntent`, never `applyRolePolicy`. The most important gap
   to close before the Brian pilot exposes these surfaces.
2. **🔴 Player first names + grounded facts reach OpenAI `gpt-4o-mini`** during executive refinement.
   `privacyGuard` is **regex-only** (blocks DOB/email/phone/"coach note" *literals*; player names are
   not in the blocklist). Fact-preserving, but the data leaves the boundary.
3. **Regex-only content guard** — a raw observation pasted into `userText` without trigger keywords
   passes through.
4. **`parentSafeContextFilter` is opt-in per caller**, not a structurally enforced choke point on
   every parent path.
5. **Redaction depends on correct source tagging** — a source mis-tagged `open` silently bypasses
   role/tenant redaction.
6. **Whisper uploads raw coach audio** to OpenAI before any redaction (inherent to transcription;
   document + gate, don't "fix").

---

## 14. Recommended unified DONNA architecture

The Constitution §5.1 pipeline, made real **end-to-end and for every role**:

```
ONE role-aware conversation shell
      │
      ▼
routeDonnaConversation   (brain/donnaCanonicalRouter.ts — the one entry)
      │
      ▼
processDonnaMessage      (already singular; replace 121 hardcoded includes() with LLM intent — §3.10)
      │
      ▼
resolveContext           (operating/pageContextResolver.ts — the one context builder)
      │
      ▼
one model-agnostic LLM client   (enforce callDonnaOpenAIGateway as the chokepoint; promote aiReasoningProvider.ts)
      │
      ▼
applyRolePolicy          (brain/donnaRoleResponsePolicy.ts — applied to ALL surfaces incl. parent/player)
      │
      ▼
proposeAction → approvalGate → execute_approved_action()
```

- **One memory store:** `donnaExecutiveLearningStore` (durable, migration 084 — typed, no longer
  `as any`) + a minimal session set.
- **One action registry:** the `donnaToolContract` / `donnaSafeActionRouter` path; others re-export or
  are deleted.
- **One surface:** a single conversation shell taking a `role` prop, used by every portal — retiring
  the widget-vs-full-page-vs-canned split.

Every deviation in this audit is a **deletion toward this shape** (Converge-by-Deletion, §8.1), never a
new layer on top.

---

## 15. What should remain (the load-bearing core)

| Layer | Keep |
|---|---|
| Brain | `brain/processDonnaMessage.ts` |
| Router | `brain/donnaCanonicalRouter.ts` (`routeDonnaConversation`) |
| Intent detectors | `donnaIntentClassifier.ts`, `entity/donnaEntityIntentRouter.ts` |
| Context | `operating/pageContextResolver.ts`, `buildLivePageState.ts`, `pageCompletionEngine.ts` |
| Role policy | `brain/donnaRoleResponsePolicy.ts` |
| Model boundary | `brain/donnaOpenAIGateway.ts` (made enforced) + promoted `src/lib/ai/aiReasoningProvider.ts` |
| Completion | `completion/donnaCompletionConvergence.ts`, `guidedCompletion/guidedCompletionRegistry.ts` |
| Presence/refinement | `conversation/donnaExecutivePresenceContract.ts`, `brain/donnaExecutiveCommunicationLayer.ts` |
| Memory | `executive/donnaExecutiveLearningStore.ts`, `donnaLearningLedger.ts`, `donnaLearningMemoryBridge.ts`, `memory/donnaGoalMemory.ts`, `donnaChatSessionMemory.ts` |
| Action pipeline | `donnaSafeActionRouter.ts` (router) is **dead** — but `donnaToolContract.ts`, `donnaApprovalGate.ts`, `actionExecutionGuards.ts`, `backend/voice.ts` remain |

> Note the naming collision: `donnaSafeActionRouter.ts` (the *routing* module) is dead, while
> `routeDonnaAction` logic that classifies tools lives via `donnaToolContract`. Keep the contract;
> retire the dead router.

---

## 16. What should be deprecated later (deletion checklist)

Deferred to the convergence sprints (4360–4363) — **not** this sprint.

- **Routers:** `donnaConversationalRouter.ts` (`routeDonnaPrompt`), `donnaIntentRouterV1.ts`,
  `donnaSafeActionRouter.ts` (dead), `guided/donnaGuidedExecutionEngine.ts` (near-dead).
- **Context cluster:** `pageContextRegistry.ts` (dead), `donnaContextResolver.ts`,
  `donnaPageElementRegistry.ts`, `donnaWhatNextEngine.ts`, `donnaPageContextEngine.ts` (legacy/UI).
- **Surfaces:** `DirectorAssistantPanel` (fake assistant), one of the two `DonnaCommandBar` copies,
  duplicate voice buttons/runtimes (`DONNAVoiceInputButton`, second voice runtime), player/parent
  canned chats (`DonnaChat`, `ParentDonnaChat`) → replaced by the one role-aware shell.
- **Memory/learning:** collapse ~7 memory modules + most of `learning/` (30 files) + `memory/` (13
  files) to the load-bearing set in §15.
- **Action registries:** fold `directorActionRegistry`, `donnaUIActionRegistry`,
  `actions/donnaActionRegistry` into one.
- **Decision required (do not defer indefinitely):** the dormant `executive/*` reasoning stack —
  **promote** (turn `DONNA_EXECUTIVE_REASONING` on and make it the executive path) **or delete.** Do not
  leave a fourth idling stack.

Estimated collapse: **607 files → ~15–25** load-bearing modules (Constitution §5.1 target).

---

## 17. Sprint 4359 plan — DONNA Knowledge Map for the 10 Atomic Loops

> **Superseded (Sprint 4359, 2026-07-02):** the loop taxonomy below reflects the pre-reconciliation
> cert names. The canonical 10 loops are now: 1 Academy Setup · 2 Curriculum Setup · 3 Class Template
> Setup · 4 Session Creation · 5 Coach Assignment & Session Readiness · 6 Coach Session Execution ·
> 7 Coach Wrap-Up · 8 Player Development & Evidence · 9 Director Review & Approval · 10 Parent &
> Player-Safe Clarity. See `atomicLoopUsabilityCertification.ts` (re-run 60/60 · 10/10).

**Canonical source of the 10 loops:** `src/lib/donna/certification/atomicLoopUsabilityCertification.ts`
(the `LOOPS: LoopSpec[]` array is the enforced truth). A 16-row superset exists in
`docs/donna/DONNA_ATOMIC_LOOP_COVERAGE_REPORT_V1.md`; the certification code's **10** is canonical.

| # | Loop | Primary route | DONNA role | Coverage today |
|---|---|---|---|---|
| 1 | Academy Setup | `/director/onboarding` | director | Partial (onboarding step-count not derivable) |
| 2 | Curriculum Builder | `/director/curriculum/builder` | director | Partial (signals not passed from call sites) |
| 3 | Template Builder | `/director/templates/class/create` | director | Partial (no live state) |
| 4 | Session Creation | `/director/sessions/new` | director | **Weak** (no PageIntelligence for route) |
| 5 | Coach Assignment | `/director/onboarding/coaches-permissions` | director | **Weak** (no dedicated reassign screen) |
| 6 | Coach Wrap-Up | `/coach/sessions/[sessionId]/wrap-up` | **coach** | Present (only coach-role loop) |
| 7 | Player Assessment | `/director/players/[playerId]` | director | Partial |
| 8 | Placement / Readiness | `/director/placement` | director | Present/partial |
| 9 | Parent Update | `/parent`, `/director/players/[playerId]` | parent | Present, but parent chat bypasses the brain (§8) |
| 10 | Director Approvals | `/director/review` | director | **Strongest** |

**The five required knowledge dimensions** map onto existing `PageIntelligence` fields:
*what it is* → `pagePurpose`; *why it matters* → `keyMetrics` / `warnings`; *what's missing* →
`missingData` + live `completionGoals`; *what happens next* → `recommendedNextAction`;
*how to complete* → `pageCompletionEngine.buildCompletionPath`.

**Sprint 4359 deliverables:**
1. A per-loop knowledge object for all 10 loops covering the five dimensions, sourced from
   `pageContextResolver.ts` + `pageCompletionEngine.ts`.
2. **Close the systematic live-state gap** by passing existing signals from the three
   `DonnaAssistantButton` call sites (the missing "what's missing right now" for ~7/10 loops). The
   signals mostly already exist — the fix is wiring, not new engines.
3. Prioritize the two weakest loops: **#4 Session Creation** (add route PageIntelligence) and
   **#5 Coach Assignment** (no dedicated screen).
4. Documentation artifact: `docs/donna/DONNA_KNOWLEDGE_MAP_V1.md`.

**Scope guardrails for 4359:** likely **no migration** (the durable-learning `as any` typing is a
separate follow-up); **no new routers, engines, or surfaces** (that is 4360+); knowledge-map + signal
wiring only.

---

## Appendix — evidence base

- Four read-only code sweeps over `src/lib/donna/` (607 files), `src/components/donna/` +
  `src/components/assistant/` (~90 render components), `src/app/{director,coach,player,parent}/`, and
  `src/app/api/`.
- Cross-checked against `docs/ARCHITECTURE.md` §3.6–3.11, §4.1–4.10, §5, §6, §9, §10, §12; the six
  required session docs; and `docs/CHANGELOG.md` Sprints 4351–4357.
- Every claim is anchored to a named file. No product code was read for modification and none was
  changed.
