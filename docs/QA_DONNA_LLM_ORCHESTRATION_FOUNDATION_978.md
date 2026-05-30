# QA — DONNA LLM Orchestration Foundation — Sprint 978

**Date:** 2026-05-30
**Sprint:** 978

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `llmOrchestration/types.ts` compiles cleanly — all types exported correctly
- [ ] `llmOrchestration/contextPacket.ts` compiles cleanly — imports from types.ts and directorNextActionEngine
- [ ] `llmOrchestration/safetyContract.ts` compiles cleanly — all validators typed
- [ ] `llmOrchestration/orchestrator.ts` compiles cleanly — imports from all other modules

---

## Types Checklist

- [ ] `OrchestratorRole` covers all three roles (academy_director, head_coach, coach)
- [ ] `OrchestratorSafetyLevel` covers all 4 levels (safe, review_only, approval_gated, blocked)
- [ ] `OrchestratorOutputType` covers all 7 V1 allowed types
- [ ] `OrchestratorToolId` covers all 8 V1 registered tools
- [ ] `OrchestratorOutput` has required fields: type, text, safetyLevel, requiresConfirmation, confidence, source
- [ ] `OrchestratorResponse` has required fields: primaryOutput, secondaryOutputs, hadBlockedAttempt, safetyAudit, contextSummary

---

## Context Packet Checklist

- [ ] `buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })` returns valid ContextPacket
- [ ] System prompt includes role context, page label, pending review count
- [ ] System prompt includes safety rule (no auto-approve, no parent comms)
- [ ] System prompt includes output rule (allowed modes)
- [ ] `compactSummary` is under 100 chars
- [ ] `userInput` is capped at 500 chars
- [ ] No raw private data in system prompt

---

## Safety Contract Checklist

- [ ] `isOutputAllowed('answer')` returns `true`
- [ ] `isOutputAllowed('approve_review_item')` — N/A, not an output type (blocked action category)
- [ ] `isToolAllowed('get_pending_review_count')` returns `true`
- [ ] `isToolAllowed('undefined_tool')` returns `false`
- [ ] `isActionBlocked('approve_review_item')` returns `true`
- [ ] `isActionBlocked('answer')` returns `false` (answer is an output, not a blocked action)
- [ ] `validateToolRequest('get_pending_review_count', {})` returns `{ valid: true }`
- [ ] `validateToolRequest('draft_proposed_action', {})` returns `{ valid: false, reason: ... }` (missing required params)
- [ ] `getToolSafetyLevel('get_pending_review_count')` returns `'safe'`
- [ ] `getToolSafetyLevel('draft_proposed_action')` returns `'approval_gated'`
- [ ] `getToolSafetyLevel('nonexistent_tool' as any)` returns `'blocked'`

---

## Orchestrator Checklist

- [ ] `orchestrate({ role: 'academy_director', pathname: '/director', pendingReviews: 3, userInput: 'What should I do next?', useLlm: false })` returns deterministic `recommend_next_action` output
- [ ] `orchestrate({ role: 'academy_director', pathname: '/director/review', userInput: 'What should I review first?', useLlm: false })` returns deterministic `answer` output with review queue guidance
- [ ] `orchestrate({ role: 'academy_director', pathname: '/director', userInput: 'hello', useLlm: false })` returns fallback `answer` output (no deterministic handler)
- [ ] `orchestrate({ ..., useLlm: true })` returns fallback (LLM stub not wired yet)
- [ ] All orchestrator responses have `hadBlockedAttempt: false` for safe inputs
- [ ] `orchestrate` never throws — always returns OrchestratorResponse

---

## Blocked Action Detector Checklist

- [ ] `detectBlockedAction('approve this item')` returns `'approve_review_item'`
- [ ] `detectBlockedAction('reject this wrap-up')` returns `'reject_review_item'`
- [ ] `detectBlockedAction('send a message to the parent')` returns `'send_parent_message'`
- [ ] `detectBlockedAction('move the player up')` returns `'change_player_level'`
- [ ] `detectBlockedAction('show me raw coach notes')` returns `'expose_raw_coach_notes'`
- [ ] `detectBlockedAction('what should I do next')` returns `null` (not blocked)
- [ ] `detectBlockedAction('explain the review queue')` returns `null` (not blocked)

---

## Existing Systems Regression Checklist

- [ ] `DonnaAssistantButton.tsx` unchanged — Sprint 968/971/972/973 behavior still works
- [ ] `directorNextActionEngine.ts` unchanged
- [ ] `directorActionExplanation.ts` unchanged
- [ ] `reviewQueueGuidance.ts` unchanged
- [ ] `classTemplateGuidance.ts` unchanged
- [ ] `curriculumBuilderGuidance.ts` unchanged
- [ ] Sprint 964 chips still work
- [ ] Sprint 966 brief chips still work
- [ ] Sprint 967 daily brief still works
- [ ] Sprint 904 approve/reject untouched

---

## Safety / No-Mutation Checklist

- [ ] No DB calls in any orchestration module
- [ ] No schema changes
- [ ] No RLS changes
- [ ] No new DONNA surfaces created
- [ ] `useLlm: true` path returns fallback only (not wired to real API)
- [ ] No parent/player communications triggered
- [ ] No player records changed
- [ ] Context packet contains no raw coach notes
- [ ] Context packet contains no player assessment data
