# QA — DONNA Live Academy Context Tools V1 — Sprint 1002

**Date:** 2026-05-30
**Sprint:** 1002

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `types.ts` compiles with 2 new `OrchestratorToolId` values
- [ ] `safetyContract.ts` compiles with new tool registry entries
- [ ] `contextPacket.ts` compiles — `SafeSignals.academyId: string | null`
- [ ] `toolCallingContract.ts` compiles — EXECUTORS map covers all 10 tool IDs
- [ ] `toolResultInterpreter.ts` compiles — INTERPRETERS map covers all 10 tool IDs
- [ ] `liveContextToolExecutor.ts` compiles cleanly — dynamic imports typed correctly
- [ ] `toolExecutionLoop.ts` compiles — `runLiveToolExecutionLoop` exports correctly
- [ ] `orchestrator.ts` compiles — `await runLiveToolExecutionLoop(...)` correctly awaited

---

## Tool Registry Checklist

- [ ] `isToolAllowed('get_academy_state')` → `true`
- [ ] `isToolAllowed('get_player_development_summary')` → `true`
- [ ] `getToolSafetyLevel('get_academy_state')` → `'safe'`
- [ ] `getToolSafetyLevel('get_player_development_summary')` → `'safe'`
- [ ] `validateToolRequest('get_academy_state', { academyId: '...' })` → `{ valid: true }`
- [ ] `validateToolRequest('get_academy_state', {})` → `{ valid: false }` (missing academyId)
- [ ] Tool manifest in context packet now has 10 entries

---

## Live Executor Checklist

- [ ] `isLiveTool('get_academy_state')` → `true`
- [ ] `isLiveTool('get_player_development_summary')` → `true`
- [ ] `isLiveTool('get_pending_review_count')` → `false`
- [ ] `executeLiveTool('get_academy_state', {})` → `ok: false` (missing academyId)
- [ ] `executeLiveTool('get_academy_state', { academyId: 'abc' })` → `ok: false` (short academyId)
- [ ] With valid academyId + server context: returns `ok: true` with AcademyStateSummary

---

## Supabase / RLS Checklist

- [ ] `retrieveAcademyState` uses provided Supabase client (RLS enforced)
- [ ] All queries in `retrieveAcademyState` include `.eq('academy_id', academyId)` scope
- [ ] All queries in `retrievePlayerDevelopmentContext` include `.eq('academy_id', academyId)` scope
- [ ] `getSupabaseServer()` called server-side only (dynamic import)
- [ ] No service role used in live tool executors

---

## Aggregated Data Checklist

- [ ] `get_academy_state` result contains NO player names
- [ ] `get_academy_state` result contains NO coach notes
- [ ] `get_academy_state` result contains NO raw database IDs
- [ ] `get_player_development_summary` result contains NO player names
- [ ] Tool result interpreter produces text with counts and flags only
- [ ] Tool result summary in `liveContextToolExecutor.ts` uses only structured summary fields

---

## Tool Result Interpreter Checklist

- [ ] `interpretToolResult({ tool: 'get_academy_state', ok: true, summary: '...', ... })` → non-empty `donnaText`
- [ ] `interpretToolResult({ tool: 'get_academy_state', ok: false, ... })` → safe fallback text
- [ ] `interpretToolResult({ tool: 'get_player_development_summary', ok: true, ... })` → `shouldHighlight: true, targetFocusId: 'player-list'`
- [ ] `interpretToolResult({ tool: 'get_player_development_summary', ok: false, ... })` → safe fallback with player-list highlight

---

## Multi-Turn Loop Regression Checklist

- [ ] `runMultiTurnToolLoop` still works after `runLiveToolExecutionLoop` result
- [ ] Second LLM turn receives tool summary from live tool result
- [ ] Sprint 1001 behavior preserved for non-live tools

---

## No-Mutation / No-Send Checklist

- [ ] `retrieveAcademyState` performs SELECT only (no INSERT/UPDATE/DELETE)
- [ ] `retrievePlayerDevelopmentContext` performs SELECT only
- [ ] No parent/player message sent
- [ ] No level, roster, billing, curriculum, session, template, or player record changed
- [ ] `academyId` never appears in LLM system prompt or conversation history

---

## Red-Team / Eval Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0`
- [ ] `runRedTeamSafetyQA()` still returns `failed: 0`
- [ ] `runGodModeV2Certification()` still returns `goNoGo: 'GO'`

---

## Protected Systems Checklist

- [ ] Sync `runToolExecutionLoop` still exported and unchanged
- [ ] Deterministic fast paths in orchestrator unchanged
- [ ] Sprint 904 approve/reject paths untouched
- [ ] `proposed_actions` state machine unchanged
- [ ] One DONNA button remains
- [ ] No new DONNA surface
- [ ] No schema changes
