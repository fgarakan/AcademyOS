# QA Checklist — DONNA Tool Execution Eval Expansion (Sprint 1012)

**Date:** 2026-05-31
**Sprint:** 1012

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes with zero errors before commit
- [ ] New imports resolve: `isLiveTool` from `./liveContextToolExecutor`
- [ ] New imports resolve: `isSafeToExecuteDirectly` from `./toolExecutionLoop`
- [ ] New imports resolve: `getRegisteredTools` from `./toolCallingContract`
- [ ] `OrchestratorToolId` type import resolves from `./types`
- [ ] `EvalCategory` union includes `'live_tools'`
- [ ] No new `as any` introduced
- [ ] All new `assert` functions return `string | null` (not void, not boolean)

---

## Regression fix checklist

- [ ] `context_002` asserts `toolManifest.length === 12` (not 8)
- [ ] `context_002` passes: `buildContextPacket` returns 12-entry tool manifest
- [ ] All 25 original eval cases still pass (no regressions)

---

## New eval case checklist

### tool_calling additions
- [ ] `tool_005`: `getRegisteredTools()` returns exactly 12 entries
- [ ] `tool_006`: `route_to_page` with `/director/review` returns `ok:true`

### context_packet additions
- [ ] `context_004`: `hasPlayerContext` is true when `playerId` provided
- [ ] `context_005`: `hasPlayerContext` is false when no `playerId`
- [ ] `context_006`: `hasSessionContext` is true when `sessionId` provided
- [ ] `context_007`: `academyId` is in `safeSignals.academyId`
- [ ] `context_008`: All 4 live tools present in `toolManifest`

### live_tools category
- [ ] `live_001`: `isLiveTool('get_academy_state')` → true
- [ ] `live_002`: `isLiveTool('get_player_development_summary')` → true
- [ ] `live_003`: `isLiveTool('get_player_profile_summary')` → true
- [ ] `live_004`: `isLiveTool('get_session_context')` → true
- [ ] `live_005`: `isLiveTool('get_pending_review_count')` → false
- [ ] `live_006`: `isSafeToExecuteDirectly('get_academy_state')` → false
- [ ] `live_007`: `isSafeToExecuteDirectly('get_player_profile_summary')` → false
- [ ] `live_008`: `isSafeToExecuteDirectly('get_session_context')` → false
- [ ] `live_009`: `executeToolCall('get_academy_state', ...)` returns `ok:false` with `error.includes('live context')`
- [ ] `live_010`: `executeToolCall('get_player_profile_summary', ...)` returns `ok:false` with `error.includes('live context')`
- [ ] `live_011`: `executeToolCall('get_session_context', ...)` returns `ok:false` with `error.includes('live context')`

---

## Coverage completeness checklist

- [ ] Total eval cases: 46 (was 28 + context_002 fix + 18 new)
- [ ] `live_tools` appears as a distinct category in `EvalCategory`
- [ ] `failedCategories` can include `'live_tools'` in a report
- [ ] `runEvaluationHarness()` still never throws for any eval case
- [ ] `formatEvalReport()` still works for any combination of passes/failures

---

## Known gaps (out of scope for Sprint 1012)

- Async live tool execution — requires DB, cannot be a pure TypeScript eval
- God Mode React component behavior — requires component test runner
- LLM response parsing — requires live API or mocked API fixture
- Multi-turn tool loop — covered by integration test in Sprint 1001 QA doc
- Session token limits in context packet — deferred to Sprint 1013

---

## Sprint 1011 regression checklist

- [ ] `evaluationHarness.ts` does not import anything from `DonnaAssistantButton`
- [ ] Sprint 1011 edits to `DonnaAssistantButton.tsx` are NOT changed
- [ ] God Mode state (`godModeOutput`, `isGodModeLoading`, `godModeHistory`) is NOT touched
- [ ] `handleGodModeQuery` fallback wiring is NOT touched
- [ ] Sprint 1010 server action is NOT changed

---

## Sprint 1000–1004 regression checklist

- [ ] `toolExecutionLoop.ts` is NOT changed
- [ ] `liveContextToolExecutor.ts` is NOT changed
- [ ] `toolCallingContract.ts` is NOT changed
- [ ] `contextPacket.ts` is NOT changed
- [ ] `types.ts` is NOT changed
- [ ] `safetyContract.ts` is NOT changed
