# QA — DONNA Player-Specific Context Tool V1 — Sprint 1003

**Date:** 2026-05-30
**Sprint:** 1003

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `playerProfileRetrieval.ts` compiles cleanly
- [ ] `types.ts` compiles with 11 total `OrchestratorToolId` values
- [ ] `safetyContract.ts` EXECUTORS map covers all 11 tool IDs
- [ ] `contextPacket.ts` `SafeSignals` includes `playerId` and `hasPlayerContext`
- [ ] `toolResultInterpreter.ts` INTERPRETERS map covers all 11 tool IDs
- [ ] `liveContextToolExecutor.ts` compiles — `execGetPlayerProfileSummary` and updated `executeLiveTool`
- [ ] `toolExecutionLoop.ts` compiles — `playerId` extracted from safeSignals correctly

---

## PlayerId Source Checklist

- [ ] `playerId` added to `ContextPacketInput` (optional)
- [ ] `safeSignals.playerId` populated from `input.playerId ?? null`
- [ ] `safeSignals.hasPlayerContext` is `true` only when `input.playerId` is non-null
- [ ] System prompt includes player context note ONLY when `hasPlayerContext === true`
- [ ] Raw `playerId` UUID NOT included in system prompt text
- [ ] `runLiveToolExecutionLoop` reads `playerId` from `ctx.safeSignals`, NOT from LLM output
- [ ] LLM cannot provide playerId in `toolRequest.params` to override system value

---

## Tool Registry Checklist

- [ ] `isToolAllowed('get_player_profile_summary')` → `true`
- [ ] `getToolSafetyLevel('get_player_profile_summary')` → `'safe'`
- [ ] `validateToolRequest('get_player_profile_summary', { playerId: '...' })` → `{ valid: true }`
- [ ] `validateToolRequest('get_player_profile_summary', {})` → `{ valid: false }` (missing playerId)
- [ ] `isLiveTool('get_player_profile_summary')` → `true`
- [ ] Tool manifest in context packet now has 11 entries

---

## Retrieval Checklist

- [ ] `retrievePlayerProfileSummary(supabase, validPlayerId, academyId)` returns `PlayerProfileRetrievalResult`
- [ ] Result has `currentLevelLabel`, `playerStatus`, `advancementEligible`, `activePriorityCount`
- [ ] Result has `recentSessionCount`, `evidenceCount`, `assessmentOverdue`
- [ ] Partial failures (query errors) are non-fatal — result still returned with `errors` noted
- [ ] Wrong `playerId` (not in academy) returns empty/null data (RLS + academyId scope protects)

---

## No Raw Notes / No Raw IDs Checklist

- [ ] `PlayerProfileSummary` does not include `coach_notes` field
- [ ] `PlayerProfileSummary` does not include `voice_notes` field
- [ ] `PlayerProfileSummary` does not include `observations` field
- [ ] `PlayerProfileSummary` does not include raw assessment scores
- [ ] `PlayerProfileSummary` does not include behavioral flags
- [ ] `PlayerProfileSummary` does not include raw database UUIDs in user-facing summary
- [ ] `execGetPlayerProfileSummary` summary text uses only labels and counts (no UUIDs)
- [ ] `interpretPlayerProfileSummary` donnaText contains no raw UUIDs

---

## No Player Comparison / No Bulk Names Checklist

- [ ] Tool does not compare this player to other players
- [ ] Tool does not return other players' names
- [ ] Tool does not return ranking or relative position data
- [ ] `PlayerProfileSummary.stageDistribution` is empty (V1 — no comparison data)

---

## No Parent/Player Communication Checklist

- [ ] `get_player_profile_summary` result contains no parent-facing content
- [ ] Tool does not trigger any parent message
- [ ] Tool does not trigger any player-visible update
- [ ] `requiresConfirmation` is `false` for this tool

---

## Multi-Turn Loop Regression Checklist

- [ ] After `get_player_profile_summary` executes, `runMultiTurnToolLoop` receives the interpreted result
- [ ] Second LLM turn receives player summary as context
- [ ] Sprint 1001 behavior preserved for non-player tools

---

## Live Context Regression Checklist

- [ ] `get_academy_state` still works (academyId path unchanged)
- [ ] `get_player_development_summary` still works
- [ ] `LIVE_TOOL_IDS` now has 3 entries
- [ ] `executeLiveTool` correctly handles all 3 live tools

---

## Red-Team / Eval Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0` (28 cases)
- [ ] `runRedTeamSafetyQA()` still returns `failed: 0` (21 cases)
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`

---

## Protected Systems Checklist

- [ ] Sprint 904 approve/reject paths untouched
- [ ] `proposed_actions` state machine unchanged
- [ ] One DONNA button remains
- [ ] No new DONNA surface
- [ ] No schema changes
- [ ] No RLS changes
- [ ] No parent/player communication
