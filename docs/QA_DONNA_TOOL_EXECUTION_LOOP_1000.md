# QA — DONNA Tool Execution Loop V1 — Sprint 1000

**Date:** 2026-05-30
**Sprint:** 1000

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `toolExecutionLoop.ts` compiles cleanly — `ReadonlySet<OrchestratorToolId>` correctly typed
- [ ] `orchestrator.ts` compiles cleanly with new `runToolExecutionLoop` import and calls
- [ ] `ToolLoopResult` type is fully typed

---

## Tool Validation Checklist

- [ ] `runToolExecutionLoop({ toolRequest: undefined, ... }, ctx, [])` returns `executed: false, output = original`
- [ ] `runToolExecutionLoop({ toolRequest: { tool: 'nonexistent_tool', params: {}, ... }, ... }, ctx, [])` returns `executed: false` (validation fails)
- [ ] `runToolExecutionLoop({ toolRequest: { tool: 'get_pending_review_count', params: {} }, ... }, ctx, [])` returns `executed: true` (valid tool, no required params)
- [ ] `runToolExecutionLoop` never throws — all paths return `ToolLoopResult`

---

## Read-Only Tool Execution Checklist

- [ ] `isSafeToExecuteDirectly('get_pending_review_count')` → `true`
- [ ] `isSafeToExecuteDirectly('get_next_action_recommendation')` → `true`
- [ ] `isSafeToExecuteDirectly('set_highlight_target')` → `true`
- [ ] `isSafeToExecuteDirectly('route_to_page')` → `true`
- [ ] `isSafeToExecuteDirectly('draft_proposed_action')` → `false` (approval_gated)
- [ ] Executing `get_pending_review_count` with `currentCount: 3` → tool runs, interpretation includes pending count in text
- [ ] Executing `get_page_context` with `pathname: '/director/review'` → highlight targets returned
- [ ] Tool result integrated into `output.text` via `interpretationToOutput`

---

## Blocked Tool Checklist

- [ ] `draft_proposed_action` tool request → `executed: false`, output is approval-gated response
- [ ] Approval-gated response has `suggestedRoute: '/director/review'`
- [ ] Approval-gated response has `highlightTarget.targetId: 'review-queue-primary'`
- [ ] Approval-gated response has `requiresConfirmation: true`
- [ ] No DB write occurs for `draft_proposed_action` in tool loop
- [ ] No `proposed_action` record created by tool loop

---

## Fallback Checklist

- [ ] `executeToolCall` throwing → `executed: false, output = original LLM output`
- [ ] `interpretToolResult` throwing → `executed: false, output = original LLM output`
- [ ] `toolResult.ok === false` → `executed: false, output = original LLM output`
- [ ] All failure paths logged to `safetyAudit[]` with descriptive entry
- [ ] Original LLM text preserved when tool loop fails

---

## Safety Contract Regression Checklist

- [ ] `validateToolRequest` still called before any execution
- [ ] `getToolSafetyLevel` still checked
- [ ] Sprint 978 `safetyContract.ts` unchanged
- [ ] `isActionBlocked` still enforced in `detectBlockedAction` (pre-LLM gate)
- [ ] Sprint 981 `safeActionRouter.ts` unchanged

---

## Red-Team Regression Checklist

- [ ] `runRedTeamSafetyQA()` still returns `failed: 0` after Sprint 1000 changes
- [ ] Blocked actions in natural language still detected by `detectBlockedAction`
- [ ] `evaluateKnowledgeGuardrails([], 'change_player_level').passed === false`
- [ ] `applyParentSafeFilter({ coach_notes: '...' }).safe === false`

---

## Eval Harness Regression Checklist

- [ ] `runEvaluationHarness()` still returns `failed: 0` (all 28 cases pass)
- [ ] `routing_001` through `routing_004` still pass (router unchanged)
- [ ] `tool_001` through `tool_004` still pass (executeToolCall unchanged)

---

## No-Mutation / No-Send Checklist

- [ ] No DB write from tool loop
- [ ] No `proposed_action` created without director confirmation
- [ ] No parent/player message sent
- [ ] No player level changed
- [ ] No roster changed
- [ ] No billing changed
- [ ] `set_highlight_target` only returns an instruction — actual sessionStorage write happens in DonnaAssistantButton
- [ ] No session, template, curriculum, or player record mutated

---

## Protected Systems Checklist

- [ ] Sprint 999 `llmApiClient.ts` unchanged
- [ ] Sprint 998 `godModeV2Certification.ts` still compiles
- [ ] Sprint 997 `redTeamSafetyQA.ts` still compiles
- [ ] Sprint 982 `evaluationHarness.ts` still compiles
- [ ] Sprint 980 `toolCallingContract.ts` unchanged (executeToolCall unchanged)
- [ ] Sprint 986 `toolResultInterpreter.ts` unchanged (interpretToolResult unchanged)
- [ ] Sprint 904 approve/reject paths untouched
- [ ] `proposed_actions` state machine unchanged
- [ ] One DONNA button remains
- [ ] No new DONNA surface
- [ ] No new voice path
- [ ] No schema changes
- [ ] No RLS changes
