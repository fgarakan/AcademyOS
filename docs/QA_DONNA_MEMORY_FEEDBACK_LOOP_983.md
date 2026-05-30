# QA — DONNA Memory + Recommendation Feedback Loop V1 — Sprint 983

**Date:** 2026-05-30
**Sprint:** 983

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `feedbackLoop.ts` compiles cleanly

## Feedback Signal Checklist
- [ ] `recordFeedback('accepted', 'pending_review_queue', '/director')` writes to localStorage (browser env)
- [ ] `loadFeedbackPreferences()` returns `FeedbackPreferences` with actionScores
- [ ] `getRecommendationScore('pending_review_queue')` returns 0 with no signals
- [ ] `sortByFeedbackScore([])` returns empty array without error
- [ ] `clearFeedbackSignals()` removes localStorage key (browser env)

## Safety Checklist
- [ ] No player names in signals
- [ ] No coach notes in signals
- [ ] No proposed_actions created
- [ ] No DB calls in any function
- [ ] Signals capped at 100 entries
