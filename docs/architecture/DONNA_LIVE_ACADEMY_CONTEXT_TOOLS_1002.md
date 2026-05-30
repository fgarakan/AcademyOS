# DONNA Live Academy Context Tools V1 — Sprint 1002

**Date:** 2026-05-30
**Sprint:** 1002
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1002

All 8 DONNA tools were deterministic (pure TypeScript, no DB). The LLM could only reason with:
- Signals already in the context packet (pending count, page label, health signal)
- Pre-computed next-action recommendations
- Static chip registry data

There was no path for DONNA to query live academy data during an LLM turn.

---

## New Live Context Tools

Sprint 1002 adds two safe, read-only, DB-backed live context tools:

| Tool ID | What It Returns | RLS |
|---|---|---|
| `get_academy_state` | `AcademyStateSummary` — pending reviews, sessions, player counts, health signal | ✅ enforced |
| `get_player_development_summary` | `PlayerDevelopmentSummary` — active players, placement/advancement flags, attention flags | ✅ enforced |

**Both tools return counts and flags only — no player names, no coach notes, no raw IDs.**

---

## Architecture

```
LLM requests get_academy_state or get_player_development_summary
  ↓
runLiveToolExecutionLoop(output, ctx, safetyAudit)
  ├── isLiveTool(tool) → true
  ├── academyId from ctx.safeSignals.academyId (set by caller, never from LLM)
  ├── executeLiveTool(tool, { ...params, academyId }) — dynamic import
  │   ├── getSupabaseServer() — server-side Supabase client, full RLS
  │   ├── retrieveAcademyState(supabase, academyId) OR
  │   │   retrievePlayerDevelopmentContext(supabase, academyId)
  │   └── Returns ToolCallResult (counts + flags only)
  ├── interpretToolResult(result) → ToolInterpretation
  └── interpretationToOutput() → OrchestratorOutput
```

---

## Files Changed

| File | Change |
|---|---|
| `types.ts` | Added `get_academy_state` and `get_player_development_summary` to `OrchestratorToolId` |
| `safetyContract.ts` | Registered new tools in `SAFE_TOOL_REGISTRY` (safe level, academyId required) |
| `contextPacket.ts` | Added `academyId` to `ContextPacketInput`, `SafeSignals`, and tool manifest |
| `toolCallingContract.ts` | Added stubs for new tools (return error directing to live executor) |
| `toolResultInterpreter.ts` | Added interpreters for `get_academy_state` and `get_player_development_summary` |
| `liveContextToolExecutor.ts` | Created — async DB executors using dynamic imports |
| `toolExecutionLoop.ts` | Added `runLiveToolExecutionLoop` async function; imports `isLiveTool` |
| `orchestrator.ts` | Swapped `runToolExecutionLoop` → `runLiveToolExecutionLoop` in LLM path |

---

## `academyId` Flow

```
Server action: orchestrate({ ..., academyId: '...' })
  ↓ buildContextPacket(input)
  ↓ safeSignals.academyId = input.academyId ?? null
  ↓ (academyId NEVER included in LLM system prompt)
  ↓ runLiveToolExecutionLoop(output, ctx, safetyAudit)
  ↓ ctx.safeSignals.academyId → executeLiveTool params
```

The LLM never sees the academyId. It is injected by the system after the LLM output is validated.

---

## Aggregated Summary Rules

Live tools return only:
- Integer counts (totalActivePlayers, pendingReviewCount, etc.)
- Boolean flags (hasMissingRecaps, hasPlayersNeedingPlacement, etc.)
- Enum health signals ('on_track', 'attention_needed', 'critical')

**Never returned:**
- Player names
- Coach notes or observations
- Player assessment details
- Raw database IDs
- Any private or sensitive data

---

## Server-Side Constraint

`liveContextToolExecutor.ts` uses dynamic imports for:
- `@/lib/supabase/server` — Next.js server-side Supabase client
- `./academyStateRetrieval` and `./playerDevelopmentRetrieval` — Sprint 990/991 modules

This keeps Supabase server logic out of the client bundle. If called client-side without a valid server context, the dynamic import will fail and `executeLiveTool` returns `ok: false` gracefully.

---

## Fallback Behavior

At every step in the live tool path:
- `academyId` missing → `ok: false`, original LLM output preserved
- Dynamic import fails → `ok: false`, original LLM output preserved
- Supabase query fails → `ok: true` with partial data (non-fatal errors)
- Interpretation fails → original LLM output preserved
- `runLiveToolExecutionLoop` never throws

---

## No-Migration Guarantee

- No schema changes
- No new tables
- No RLS changes
- Retrieval modules use existing tables with existing RLS policies
- `academyId` passed via ContextPacketInput — no new session state

---

## V2 Roadmap (Sprint 1003+)

1. **Player-specific retrieval:** Add `get_player_profile_summary(playerId)` — requires explicit director intent with validated player ID. Not in V1 to avoid bulk name exposure.
2. **Session context tool:** Add `get_session_list` using `retrieveCoachSessionContext()`
3. **Usage tracking:** Call `logUsageEvent()` after each live tool execution
4. **Caching:** Cache live tool results within a session to reduce DB queries
