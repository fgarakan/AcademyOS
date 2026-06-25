# DONNA Unified Executive Context Engine V1

**Mega Sprint 3961–4020 · 2026-06-25**

> Every OpenAI reasoning request is grounded in the same complete operating picture an
> experienced COO would have standing beside the Director — the current screen, the
> conversation, the academy, permissions, available actions, and relevant memory —
> assembled **once, centrally**. DONNA never asks the Director to explain what is
> already visible or already known.

---

## 1. Why this exists

Two structural gaps meant the executive packet was reasoning half-blind:

1. **Page context never reached the packet.** `liveResolverAdapter` populated the
   `current_page` source from `legacy.pageIntelligence.label` — a field that does
   **not** exist on `PageIntelligence`. It always fell through to the raw route
   string. DONNA "knew" the URL, not the screen.
2. **Page context was goal-gated.** `current_page` only appeared in the `analyze` and
   `diagnose` reasoning goals. "Which should I select?" (`decide`/`recommend`) and
   "Why?" (`explain`) reasoned with **no page context at all** — so DONNA could ask
   the Director which screen they were on.

The engine closes both and converges context assembly into one place.

---

## 2. Architecture

```
 live inputs (DonnaMessageInput + role + academy + legacy + directorCtx)
        │
        ▼
 buildResolverStateFromLive()         ← the ONE live→state boundary
        │   (rich current-page block, academy truth, decisions, permissions, actions)
        ▼
 assembleExecutiveContext(state)      ← the ONE Unified Executive Context Engine
        │   1. resolveContinuity      (bind "it"/"that"/follow-ups)
        │   2. deriveReasoningGoal    (reasoning decides which context is required)
        │   3. resolveExecutiveContext(Context Resolver → Executive Context Packet)
        │   4. buildContextEngineTrace(developer trace)
        ▼
 { continuity, plan, packet, trace }
        │
        ▼
 runExecutiveOperatingTurn() → OpenAI gateway → validator → action planner
```

**Convergence, not creation.** `runExecutiveOperatingTurn` no longer derives the plan
or resolves context inline — it calls `assembleExecutiveContext`. There is exactly one
context builder. No reasoning module requests page / academy / workflow / history
context on its own.

### Key modules

| Module | Responsibility |
|---|---|
| `executive/executiveContextEngine.ts` | **The engine.** `assembleExecutiveContext()` — the single context-assembly entry point. Owns continuity → goal → resolve → trace. |
| `executive/pageContextPacketSource.ts` | Turns the current screen (route + `LivePageState` + `PageIntelligence`) into a structured `PageContextPacket` and a token-lean serialized block for the `current_page` source. Also builds the developer page trace. |
| `executive/liveResolverAdapter.ts` | The live→`ResolverState` boundary. Injects the rich page block into `state.page`. |
| `executive/contextResolver.ts` | The one Context Resolver. Now exempts the `ALWAYS_INCLUDE` priority set from the budget drop. |
| `executive/reasoningGoals.ts` | `current_page` + `conversation_history` are near-universal conditionals. |
| `operating/pageContextResolver.ts` | Route → `PageIntelligence`. Extended with Templates, Today, Settings. |

---

## 3. Context sources included

Always grounded (the COO-priority set — exempt from the token-budget drop):

- **`current_page`** — where the Director is + what is on screen (see §4)
- **`academy`** — academy identity + live operating snapshot (counts)
- **`active_workflow`** — the workflow in progress
- **`conversation_history`** — the thread so far (continuity)

Plus the per-goal required set (`role`, `permissions`, and goal-specific sources such
as `outstanding_decisions`, `available_actions`, `curriculum`) and relevance-gated
conditionals (`active_draft`, `player_context`, `coach_context`, `relevant_memory`,
`development_spine`, `navigation_target`, `donna_assumptions`).

### The `current_page` block (Page Awareness — Objective 2)

The serialized block carries, in truncation-safe order:

```
PAGE: <title> [<route>]
PURPOSE: <one-sentence purpose>
CURRENT_STEP: <e.g. "Step 4 of 7 (3/7 complete)">      (when stepped)
PROGRESS: <0–100>% complete                             (when a live signal exists)
RECOMMENDED_NEXT: <single highest-impact next action>
VISIBLE_SECTIONS: …      KEY_FIELDS: …      AVAILABLE_ACTIONS: …
APPROVAL_GATED: …        SELECTED_VALUES: …
COMPLETED: …             REMAINING: …       BLOCKERS: …
```

Executive-critical fields (page, purpose, step, progress, recommended next) are
front-loaded so they survive truncation — the "what should I do here?" answer is never
the part that gets cut. No live value is ever fabricated: unknown signals are omitted.

---

## 4. Context sources removed / merged

- **No new pathway.** Context assembly that was inlined in `runExecutiveOperatingTurn`
  (continuity + `deriveReasoningGoal` + `resolveExecutiveContext`) is now the engine's
  job — moved, not duplicated. The layer imports neither `resolveContinuity`,
  `deriveReasoningGoal`, nor `resolveExecutiveContext` directly anymore.
- **`current_page` is now sourced once** from the Page Context Packet Source rather
  than the broken `.label` lookup.
- **`ALWAYS_INCLUDE`** has a single definition in `contextResolver.ts`; the engine
  re-exports it as `ALWAYS_INCLUDE_PRIORITY`.

---

## 5. Token strategy (Objective 4)

- **Priority:** the COO-priority set (`current_page`, `academy`, `active_workflow`,
  `conversation_history`) is admitted even under a tight budget — never dropped for
  cheaper context. `current_page` is cost-weight 1, so this is nearly free.
- **Reasoning decides required context;** conditionals are relevance-gated and sorted
  cheap→costly, then budgeted. Required + priority slices are always admitted.
- **Minimality is auditable:** every skipped source is recorded with a reason
  (`excluded_by_goal` / `not_relevant` / `budget` / `redacted`).
- **Dedup:** a source can appear at most once in the assembled packet.

---

## 6. Developer trace (Objective 5)

`ContextEngineTrace` (from `buildContextEngineTrace`) exposes, per request:

- sources **included**, **skipped** (with reason), **unavailable** (honest)
- context **token count**, **budget**, serialized **packet size (chars)**
- **page grounded** + **conversation grounded** flags, **requiredMet**

Surfaced through `ExecutiveLiveDiagnostics` (`contextSourcesSkipped`, `packetSizeChars`,
`pageGrounded`, `conversationGrounded`) and emitted by both director reasoning actions
via `logReasoningTrace` (page detected, UI elements collected, packet size, latency,
final response source). Developer-only — gated by `DONNA_ROUTING_DEBUG` / non-production;
never user-facing.

---

## 7. Certification

`donnaUnifiedExecutiveContextCertification.ts` — **31/31**, offline + deterministic
(no OpenAI key required), built through the real live boundary:

| Section | Proves |
|---|---|
| A | One engine assembles a complete, grounded packet (identity + page + conversation, deduped, budgeted) |
| B | 7 pages × 5 questions ("what should I do here / walk me through / which should I select / why / what happens if") all ground the current screen — DONNA never asks "what page?" |
| C | Conversation continuity — the thread is carried every turn |
| D | Token strategy — priority survives a tight budget, no duplicates, skips recorded |
| E | Developer trace completeness |
| F | Convergence — the operating turn uses the same engine (sources, goal, grounding match) |
| G | Honest on unknown routes — no fabricated page context |

Full registered suite green (15/15, zero failures). `tsc --noEmit` clean.

---

## 8. Remaining gaps

- **Executive layer is flag-dormant live** (`DONNA_EXECUTIVE_REASONING` unset). This
  sprint grounds the packet for when it is enabled (shadow/primary); the live
  deterministic path is unchanged. Certs prove packet content, not live OpenAI calls.
- **`LivePageState` is client-supplied.** When the UI does not pass it, the page block
  falls back to static page intelligence (still rich, but no live counts / progress).
- **`active_draft` is null on the live path** (V1) — continuity uses the last entity
  label. Structured live drafts are a future wiring.
- **`relevant_memory` is empty on the live path** — durable memory wiring is future work.
- The multi-tenant RLS hole on the global curriculum spine remains deferred (see the
  Curriculum Architecture Audit) — `tenant`-class sources are tenant-scoped before
  inclusion, but the underlying spine RLS is still the highest-priority security task.

---

## 9. God Mode score

**Page & context grounding: 9.5 / 10.** Every reasoning goal now grounds the current
screen and the conversation; context is assembled once through one engine with an
auditable developer trace and a priority-protected token budget. Held back from 10 by
the dormant live flag and the not-yet-wired live draft / durable memory sources.
