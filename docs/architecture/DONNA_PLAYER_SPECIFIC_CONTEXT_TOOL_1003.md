# DONNA Player-Specific Context Tool V1 — Sprint 1003

**Date:** 2026-05-30
**Sprint:** 1003
**Status:** Implemented — TypeScript clean

---

## Before Sprint 1003

Sprint 1002 gave DONNA live academy-wide context (pending counts, session counts, health signals). DONNA could answer "How is the academy doing?" with real data, but could not answer "How is this specific player doing?" because:
- No `playerId` was in the context packet
- No player-specific retrieval module existed for DONNA
- The LLM cannot safely guess or invent a player ID

Sprint 1003 adds the first safe player-specific context tool.

---

## New Tool: `get_player_profile_summary`

| Property | Value |
|---|---|
| Tool ID | `get_player_profile_summary` |
| Safety level | `safe` |
| Requires approval | No |
| Required params | `playerId` (from route context, never from LLM) |
| DB access | RLS enforced, academyId scoped |
| Returns | Director-safe summary: level, status, flags, counts |

---

## `playerId` Source Rule — Critical

```
ALLOWED: Server action passes playerId from URL params
  → orchestrate({ ..., playerId: params.playerId })
  → safeSignals.playerId = input.playerId
  → runLiveToolExecutionLoop injects playerId into tool params

BLOCKED: LLM tries to provide playerId in toolRequest.params
  → LLM cannot know the UUID — it is not in the system prompt
  → The system prompt says "playerId injected from route context — you cannot supply it directly"
  → If LLM provides a wrong playerId, the DB query returns no data (RLS + academyId scope)
```

---

## Files Changed

| File | Change |
|---|---|
| `playerProfileRetrieval.ts` | Created — safe director-facing player profile query |
| `types.ts` | Added `get_player_profile_summary` to `OrchestratorToolId` |
| `safetyContract.ts` | Registered new tool (safe, requiredParams: ['playerId']) |
| `contextPacket.ts` | Added `playerId` to input, `SafeSignals` (`playerId`, `hasPlayerContext`), tool manifest, system prompt |
| `toolCallingContract.ts` | Added stub (routes to live executor) |
| `toolResultInterpreter.ts` | Added `interpretPlayerProfileSummary` |
| `liveContextToolExecutor.ts` | Added `get_player_profile_summary` to `LIVE_TOOL_IDS`; added `execGetPlayerProfileSummary`; updated `executeLiveTool` to handle playerId param |
| `toolExecutionLoop.ts` | Updated `runLiveToolExecutionLoop` to read `playerId` from `ctx.safeSignals` and inject it |

---

## Safe Returned Fields

| Field | Type | Description |
|---|---|---|
| `currentLevelLabel` | `string \| null` | Human label (e.g. "Orange 2") — not raw ID |
| `playerStatus` | `string \| null` | active, pending_placement, on_hold |
| `advancementEligible` | `boolean` | Whether player meets advancement criteria |
| `activePriorityCount` | `number` | Count of active (non-completed) priorities |
| `recentSessionCount` | `number` | Sessions attended in last 30 days |
| `evidenceCount` | `number` | Total gate evidence submissions |
| `assessmentOverdue` | `boolean` | Whether next_assessment_due is in the past |

---

## Blocked Fields (Never Returned)

- Raw coach notes or observations
- Behavioral flags or risk signals
- Assessment scores
- Sensitive notes
- Player name (LLM doesn't need it — director is already viewing the player)
- Raw database UUIDs in user-facing text
- Parent communication drafts
- Medical or health-sensitive content
- Anything parent or player facing

---

## System Prompt Behavior

When `safeSignals.hasPlayerContext === true`:
```
Player profile context is available for this page.
You may use the get_player_profile_summary tool to retrieve director-safe player signals.
You cannot supply playerId — it is injected from the route context automatically.
```

The raw `playerId` UUID is never in the system prompt or conversation history.

---

## Fallback Behavior

- `playerId` missing from safeSignals → `ok: false`, original output preserved
- `academyId` missing → `ok: false`, original output preserved
- DB query fails → `ok: false`, fallback interpretation shown with `player-profile-header` highlight
- Partial query failures → non-fatal, partial data returned with error note
- `executeLiveTool` never throws

---

## No-Migration Guarantee

- No new tables
- No schema changes
- No RLS changes
- Uses existing: `v_player_summary`, `v_player_curriculum_summary`, `player_priorities`, `session_attendance`, `player_gate_status`, `players`, `curriculum_levels`
- Some queries may return empty (e.g. `player_gate_status` not fully applied) — handled gracefully

---

## V2 Roadmap (Sprint 1004+)

1. Include player's first name in director-facing interpreter text (safe — director already knows)
2. Add recent coach observation count (aggregated — no raw note content)
3. Add curriculum gate completion percentage
4. Add `get_session_context` tool for coach-side session detail questions
