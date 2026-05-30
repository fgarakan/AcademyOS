# QA — DONNA Tool Calling Contract V2 — Sprint 980

**Date:** 2026-05-30
**Sprint:** 980

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `toolCallingContract.ts` compiles cleanly
- [ ] All 8 tool executor functions typed correctly
- [ ] `ToolCallResult` fields all present in every return

---

## Tool Executor Checklist

- [ ] `executeToolCall('get_pending_review_count', { currentCount: 3 })` returns `ok: true, data.pendingCount: 3`
- [ ] `executeToolCall('get_next_action_recommendation', { pathname: '/director', pendingReviews: 2 })` returns `ok: true` with action data
- [ ] `executeToolCall('get_action_explanation', { actionId: 'pending_review_queue', safetyLevel: 'approval_gated', requiresApproval: true, title: 'Review Queue', why: '...' })` returns `ok: true` with explanation
- [ ] `executeToolCall('get_review_queue_guidance', { intent: 'first_priority' })` returns `ok: true` with guidance text
- [ ] `executeToolCall('get_review_queue_guidance', { intent: 'invalid_intent' })` returns `ok: false` with error
- [ ] `executeToolCall('get_page_context', { pathname: '/director/review' })` returns `ok: true` with highlight targets
- [ ] `executeToolCall('set_highlight_target', { targetId: 'review-queue-primary', label: 'Review Queue', route: '/director/review' })` returns `ok: true` with instruction
- [ ] `executeToolCall('set_highlight_target', {})` returns `ok: false` (missing targetId)
- [ ] `executeToolCall('draft_proposed_action', { actionType: 'test', actorId: 'abc', academyId: 'def', payload: {}, rationale: 'test' })` returns `ok: true, requiresConfirmation: true`
- [ ] `executeToolCall('draft_proposed_action', { actionType: 'test' })` returns `ok: false` (missing actorId/academyId)
- [ ] `executeToolCall('route_to_page', { route: '/director/review', reason: 'pending items' })` returns `ok: true`
- [ ] `executeToolCall('route_to_page', { route: 'https://evil.com', reason: 'hack' })` returns `ok: false` (external URL blocked)
- [ ] `executeToolCall('nonexistent_tool' as any, {})` returns `ok: false` with error

---

## Safety Checklist

- [ ] `executeToolCall` never throws — all error paths return `ToolCallResult` with `ok: false`
- [ ] `draft_proposed_action` always returns `requiresConfirmation: true`
- [ ] External URLs blocked in `route_to_page`
- [ ] All results include `auditEntry` string
- [ ] No DB calls in any executor function
