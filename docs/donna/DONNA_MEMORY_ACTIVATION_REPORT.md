# DONNA Memory Activation — Sprint 2261–2290 Certification Report

**Sprint:** 2261–2290  
**Title:** DONNA Memory Activation V1  
**Date:** 2026-06-13  
**Status:** COMPLETE — TypeScript clean

---

## What was built

DONNA now opens every session with a persistent memory of what happened before. The director no longer starts from a blank slate.

**Target experience delivered:**
> "Since your last visit: 2 player approvals were completed, Alex's readiness improved, one curriculum review remains unfinished. Would you like to continue where you left off?"

---

## Architecture: four-tier memory system

### Tier 1 — Session Memory
**Source:** `donna_conversation_sessions.metadata` JSONB (migration 070)  
**Loaded:** Every panel open  
**Content:** Summary of last 2 closed sessions — topics, pages, actions completed, open items  
**Engine:** `donnaCrossSessionMemory.ts` — deterministic, no LLM  

Session summary is generated from:
- Message intents → domain topic labels (curriculum, players, approvals, etc.)
- Page paths → human-readable labels (Player Profile, Review Queue, etc.)
- Entity types referenced (player, coach, group — never raw IDs or names)
- Proposed actions that occurred during the session (completed vs. pending)

Sessions are finalized when `finalizeStaleSession()` detects >4 hours of inactivity.

### Tier 2 — Decision Memory
**Source:** `proposed_actions` table  
**Loaded:** First session of day + when `includeDecisionMemory` flag is set  
**Content:** Last 5 director decisions (action label, outcome, area, relative date), approval rate, dominant area  

### Tier 3 — Entity Memory
**Source:** `players`, `donna_entity_summaries`, `player_development_blueprints`, `player_development_signals`, `player_recommendations`, `proposed_actions`, `donna_conversation_messages`  
**Loaded:** When a player page is active (playerId from pathname)  
**Content:** Operating summary, top 2 priorities, recent signals, active recommendations, recent decisions, last discussed date  

### Tier 4 — Academy Memory
**Source:** `academies.settings` JSONB + `proposed_actions` (last 90 days)  
**Loaded:** First session of day only  
**Content:** Identity narrative, dominant decision pattern, evolution summary, approval rate  
**Token budget:** ≤150 tokens (3 sentences max)

---

## Files created

| File | Purpose |
|---|---|
| `src/lib/donna/memory/donnaMemoryContextTypes.ts` | All type definitions for all four tiers |
| `src/lib/donna/memory/donnaCrossSessionMemory.ts` | Tier 1 engine: summary generation, staleness detection, DB persistence |
| `src/lib/donna/memory/donnaMemoryContextLoader.ts` | Tier 2/3/4 loaders + `loadAllMemoryTiers()` assembly function |
| `src/lib/actions/donnaMemoryActions.ts` | Server actions: `loadDonnaMemoryContextAction`, `finalizeStaleSessionAction` |

## Files modified

| File | Change |
|---|---|
| `src/lib/donna/llmOrchestration/contextPacket.ts` | + 5 new fields on `ContextPacketInput`; + 4 memory tier injection blocks in `buildSystemPrompt`; + `isAcademyLevelQuery()`, `isMemoryQuery()` helpers |
| `src/app/director/_actions/donnaOrchestratorAction.ts` | + 5 new fields on `DonnaOrchestratorInput`; passes memory tiers to `orchestrate()` |
| `src/components/assistant/DonnaAssistantButton.tsx` | + memory imports; + `memoryContextRef`, `memoryLoadedRef`; + panel-open effect loading all 4 tiers; + memory context spread into `runDonnaOrchestratorAction` call |

---

## Design guardrails respected

- No new database migrations — all tiers read from existing tables
- All memory queries are read-only — no writes except `donna_conversation_sessions.metadata` (session summary persistence)
- No player names in memory context — entity type labels only
- No raw coach notes, observation text, or behavioral flags in any tier
- No LLM in summary generation — deterministic extraction only
- Individual tier failures return `null` — never crash the panel
- `isFirstSessionOfDay` detected via localStorage — no extra DB round-trip
- Tier 4 token budget: 3 short sentences = ~75 tokens, well within 150-token budget
- Memory loaded once per panel session and cached in `memoryContextRef` — no re-fetching per message turn

---

## Non-goals (deferred)

- Learning loop (memory updating based on DONNA outcomes) — not implemented
- Prediction from memory — not implemented
- Memory UI (showing director what DONNA remembers) — not implemented
- Non-player entity memory (groups, curriculum levels) — Tier 3 is player-only in V1

---

## TypeScript

`npx tsc --noEmit` — **clean**. Zero errors.
