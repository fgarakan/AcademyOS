# QA — DONNA Multi-Step Planning V1 — Sprint 985

**Date:** 2026-05-30
**Sprint:** 985

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `multiStepPlanner.ts` compiles cleanly

## Planner Checklist
- [ ] `getWorkflowPlan('onboard_new_player')` returns plan with 4 steps
- [ ] `getWorkflowPlan('run_session_cycle')` has `requiresDirectorApprovalAt: [3, 4]`
- [ ] `detectWorkflowIntent('I want to onboard a new player')` returns `'onboard_new_player'`
- [ ] `detectWorkflowIntent('hello donna')` returns `null`
- [ ] `formatWorkflowPlan(plan)` returns non-empty string with step numbers
- [ ] `getAllWorkflowPlans()` returns 6 plans

## Safety Checklist
- [ ] No step in any plan has `requiresApproval: false` when safety is `approval_gated`
- [ ] All plans have non-empty `safetyNote`
- [ ] No DB calls in any planner function
