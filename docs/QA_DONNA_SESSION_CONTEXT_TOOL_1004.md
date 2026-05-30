# QA — DONNA Session Context Tool V1 — Sprint 1004

**Date:** 2026-05-30
**Sprint:** 1004

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `sessionContextRetrieval.ts` compiles cleanly
- [ ] `types.ts` compiles with 12 total `OrchestratorToolId` values
- [ ] `safetyContract.ts` SAFE_TOOL_REGISTRY covers all 12 tool IDs
- [ ] `contextPacket.ts` `SafeSignals` includes `sessionId` and `hasSessionContext`
- [ ] `toolCallingContract.ts` EXECUTORS covers all 12 tool IDs
- [ ] `toolResultInterpreter.ts` INTERPRETERS covers all 12 tool IDs
- [ ] `liveContextToolExecutor.ts` compiles — `execGetSessionContext` and updated `executeLiveTool`
- [ ] `toolExecutionLoop.ts` compiles — `sessionId` extracted from safeSignals correctly

---

## SessionId Source Checklist

- [ ] `sessionId` added to `ContextPacketInput` (optional)
- [ ] `safeSignals.sessionId` populated from `input.sessionId ?? null`
- [ ] `safeSignals.hasSessionContext` is `true` only when `input.sessionId` is non-null
- [ ] System prompt includes session context note ONLY when `hasSessionContext === true`
- [ ] Raw `sessionId` UUID NOT included in system prompt text
- [ ] `runLiveToolExecutionLoop` reads `sessionId` from `ctx.safeSignals`, NOT from LLM output
- [ ] `isLiveTool('get_session_context')` → `true`

---

## Tool Registry Checklist

- [ ] `isToolAllowed('get_session_context')` → `true`
- [ ] `getToolSafetyLevel('get_session_context')` → `'safe'`
- [ ] `validateToolRequest('get_session_context', { sessionId: '00000000-...' })` → `{ valid: true }`
- [ ] `validateToolRequest('get_session_context', {})` → `{ valid: false }` (missing sessionId)
- [ ] Tool manifest in context packet now has 12 entries

---

## Retrieval Checklist

- [ ] `retrieveSessionContext(supabase, validSessionId, academyId)` returns `SessionContextRetrievalResult`
- [ ] Result has `sessionName`, `sessionStatus`, `scheduledDate`, `templateName`
- [ ] Result has `coachName`, `groupName`, `blockCount`, `attendance`, `wrapUpStatus`
- [ ] Partial failures (query errors) are non-fatal
- [ ] Wrong `sessionId` (not in academy) returns null/empty data (RLS + academyId protect)
- [ ] `wrapUpStatus` correctly maps proposed_actions status to enum values

---

## No Raw Notes / No Raw IDs Checklist

- [ ] `SessionContextSummary` does not include `session_notes` field
- [ ] `SessionContextSummary` does not include raw wrap-up draft content
- [ ] `SessionContextSummary` does not include individual player names in attendance
- [ ] `SessionContextSummary` does not include raw database UUIDs
- [ ] `execGetSessionContext` summary text uses only labels and counts
- [ ] `interpretSessionContext` donnaText contains no raw UUIDs

---

## No Player Comparison / No Individual Names Checklist

- [ ] Attendance data is totals only (present count, absent count)
- [ ] No individual player attendance status by name
- [ ] No coach observation text
- [ ] No voice notes

---

## No Attendance Mutation / No Wrap-Up Mutation Checklist

- [ ] `get_session_context` performs SELECT only
- [ ] No attendance records created or modified
- [ ] No wrap-up submitted or modified
- [ ] No `proposed_action` created
- [ ] `requiresConfirmation: false`

---

## No Parent/Player Communication Checklist

- [ ] Tool result contains no parent-facing content
- [ ] No parent message triggered
- [ ] No player-visible update triggered

---

## Multi-Turn Loop Regression Checklist

- [ ] After `get_session_context` executes, `runMultiTurnToolLoop` receives interpreted result
- [ ] Second LLM turn receives session summary as context
- [ ] Sprint 1001 behavior preserved

---

## Live Context Regression Checklist

- [ ] `get_academy_state` still works
- [ ] `get_player_development_summary` still works
- [ ] `get_player_profile_summary` still works (Sprint 1003)
- [ ] `LIVE_TOOL_IDS` now has 4 entries
- [ ] `executeLiveTool` correctly handles all 4 live tools

---

## Red-Team / Eval Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0` (28 cases)
- [ ] `runRedTeamSafetyQA()` still returns `failed: 0` (21 cases)
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`

---

## Protected Systems Checklist

- [ ] Sprint 904 approve/reject paths untouched
- [ ] `proposed_actions` state machine unchanged (read only, no writes)
- [ ] One DONNA button remains
- [ ] No new DONNA surface
- [ ] No schema changes
- [ ] No RLS changes
