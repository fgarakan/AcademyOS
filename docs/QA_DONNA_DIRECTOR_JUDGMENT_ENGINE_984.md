# QA — DONNA Director Judgment Engine V1 — Sprint 984

**Date:** 2026-05-30
**Sprint:** 984

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `directorJudgmentEngine.ts` compiles cleanly

## Judgment Engine Checklist
- [ ] `judgeDirectorPriorities({ pathname: '/director', pendingReviews: 5, academyState: {} })` → topAction.action.id = 'pending_review_queue', urgencyLevel = 'high'
- [ ] `judgeDirectorPriorities({ pathname: '/director', pendingReviews: 0, academyState: {} })` → urgencyLevel = 'low'
- [ ] `judgeDirectorPriorities({ pathname: '/director', pendingReviews: 0, academyState: { hasMissingRecaps: true } })` → topAction includes missing recap recommendation
- [ ] `judgment.rankedActions.length <= 3` always
- [ ] `judgment.reasoning` is non-empty

## Safety Checklist
- [ ] No DB calls
- [ ] No proposed_actions created
- [ ] No private data in judgment output
