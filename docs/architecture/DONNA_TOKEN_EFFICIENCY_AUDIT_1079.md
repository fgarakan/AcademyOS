# Sprint 1079–1084 — DONNA Token Efficiency Audit + Cost Control Block V1

**Date:** 2026-06-01
**Sprints:** 1079 (audit), 1080–1084 (fixes)

---

## Audit Findings (Sprint 1079)

### DONNA Request Flow

```
handleCommandSubmit / handleVoiceTranscript
│
├── Steps 1–13: All deterministic handlers       ZERO LLM
│    (onboarding, controller, templates, drafts, COO commands,
│     review queue, daily brief, attention, follow-up resolver,
│     predictive suggestions, context query)
│
├── handleUIDispatch → dispatchUIIntent           ZERO LLM
│    navigation / blocked / operator intercept
│
└── handleDonnaCooPrompt
     ├── [1073] context-pack lookup              ZERO LLM
     ├── [1077] action-registry intercept        ZERO LLM
     ├── routeDonnaPrompt → intent classifier    ZERO LLM, template compose
     └── detectAndHandleCommand (legacy)         ZERO LLM
          └── handleGodModeQuery                 ANTHROPIC API
                └── runDonnaOrchestratorAction
                      ├── buildContextPacket
                      ├── tryDeterministicHandler (next-action, review guidance)
                      └── callDonnaLlm (if useLlm: true)
```

### Token Waste Identified

| Risk | Severity | Fix Sprint |
|---|---|---|
| All 14 tool descriptions injected every call | High | 1081 |
| Token usage NOT logged to DB (null inputTokens/outputTokens) | High | 1080 |
| Academy profile DB query repeated every orchestrator call | Medium | 1082 |
| Conversation history injected for nav/command queries | Low | 1083 |

### Baseline System Prompt Size (pre-fixes)
~1,700–2,850 chars baseline. With full history + curriculum section: up to ~4,750 chars (~1,400 tokens per God Mode call).

---

## Sprint 1080 — Token Usage Logging

**Files changed:** `types.ts`, `orchestrator.ts`, `donnaOrchestratorAction.ts`

Added `inputTokens?`, `outputTokens?`, `latencyMs?`, `model?`, `toolCallCount?` to `OrchestratorResponse`. Populated from `llmResult` in `orchestrator.ts` LLM return paths. Passed to `writeUsageEventToDb` in the action. Token data now flows: `llmResult → OrchestratorResponse → usage_events table`.

**Result:** Token usage is now observable in the `usage_events` DB table for every God Mode call that reaches the LLM.

---

## Sprint 1081 — Page-Relevant Tool Manifest Filtering

**File changed:** `contextPacket.ts`

Defined 6 route-scoped tool ID sets. `buildToolManifest(role, pathname)` now filters to the relevant subset per route before injecting into the system prompt.

| Route | Tools before | Tools after | Chars saved |
|---|---|---|---|
| `/director/kpi` | 14 | 5 | ~350 chars |
| `/director/review` | 14 | 4 | ~400 chars |
| `/director/players` | 14 | 5 | ~350 chars |
| `/director/sessions/<id>` | 14 | 5 | ~350 chars |
| `/director/curriculum*` | 14 | 4 | ~380 chars |
| Unknown route | 14 | 14 | 0 (fallback) |

---

## Sprint 1082 — Academy Context TTL Cache

**File changed:** `donnaOrchestratorAction.ts`

Wrapped the `academies` table query in `cachedFetch(academyId, CACHE_KEYS.ACADEMY_PROFILE, CACHE_TTL_MS.ACADEMY_PROFILE, ...)`. The cache already existed in `donnaContextCache.ts` at a 5-minute TTL. Cache is per-academyId, module-level (resets on restart). Non-sensitive: name, slug, timezone, country, settings.

**Result:** After first God Mode call per 5-min window, academy profile fetch = 0ms (cache hit), 0 DB queries.

---

## Sprint 1083 — Conversation History Relevance Filter

**File changed:** `contextPacket.ts`

Added `isConversationHistoryRelevant(userInput, history)` predicate before history sanitization. History is skipped when:
- Input is < 20 chars (command-like)
- Input starts with navigation pattern (open/go to/show me/etc.)
- History length is 0

History is kept when:
- Input contains anaphoric references ("that", "those", "you mentioned", "from before")
- Input length > 60 chars (complex question)
- Input length ≥ 30 (medium — could be follow-up)

**Result:** Navigation commands, short queries, and first-turn questions save 0–900 chars (~0–280 tokens).

---

## Sprint 1084 — Efficiency Tier Classification + Trace

**File created:** `donnaEfficiencyTiers.ts`

Defines the 7-tier efficiency model with metadata, input token estimates, latency expectations, and a `classifyDonnaEfficiencyPath(input)` pre-classifier.

| Tier | Label | LLM? | DB? | Est. input tokens | Est. latency |
|---|---|---|---|---|---|
| 0 | Deterministic UI/Action | No | No | 0 | ~1ms |
| 1 | Context-Pack Answer | No | No | 0 | ~5ms |
| 2 | Action-Registry Response | No | No | 0 | ~5ms |
| 3 | Template-Composed Answer | No | No | 0 | ~10ms |
| 4 | God Mode Light (no tools) | Yes | No | ~700 | ~1500ms |
| 5 | God Mode + One Tool | Yes | Yes | ~900 | ~2500ms |
| 6 | Deep Mode Multi-Tool | Yes | Yes | ~1400 | ~4000ms |

Not wired into runtime. Future: call `classifyDonnaEfficiencyPath` in `handleDonnaCooPrompt` to populate audit trace.

---

## Remaining Cost Risks

| Risk | Status | Next sprint |
|---|---|---|
| Product memory not wired — future injection must be selective | Not wired (correct) | Wire only 2–3 approved rules max |
| Multi-turn tool loop (2× LLM calls) not traced separately | Logged in safetyAudit | Add to efficiency trace when wired |
| Curriculum strategy section (~1,000 chars) always on curriculum pages | Acceptable (page-gated) | Consider query-type gating |
| No model tier switching (Haiku for Tier 4) | Not implemented | Requires explicit sprint auth |
