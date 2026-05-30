# QA — DONNA Review Queue Guidance — Sprint 971

**Date:** 2026-05-30
**Sprint:** 971

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `reviewQueueGuidance.ts` compiles cleanly
- [ ] `donnaPageChipRegistry.ts` compiles cleanly with 3 new chips
- [ ] `DonnaAssistantButton.tsx` compiles cleanly with new import + handler

---

## Guidance Intent Checklist

- [ ] `matchesReviewQueueGuidanceIntent('what should I review first')` returns `'first_priority'`
- [ ] `matchesReviewQueueGuidanceIntent('what is safe to approve')` returns `'safe_to_approve'`
- [ ] `matchesReviewQueueGuidanceIntent('what requires caution')` returns `'what_caution'`
- [ ] `matchesReviewQueueGuidanceIntent('hello donna')` returns `null`
- [ ] `matchesReviewQueueGuidanceIntent('what needs my attention')` returns `null` (daily brief handles this)
- [ ] `buildReviewQueueGuidance('first_priority')` returns non-empty string with priority ordering
- [ ] `buildReviewQueueGuidance('safe_to_approve')` returns non-empty string with approval contract
- [ ] `buildReviewQueueGuidance('what_caution')` returns non-empty string mentioning parent updates

---

## Chip Behavior Checklist

- [ ] On `/director/review` page, 6 chips appear: What needs approval?, Explain this queue, Show daily brief, What should I review first?, Highlight review queue, What is safe to approve?
- [ ] "What should I review first?" chip → sends prompt → `matchesReviewQueueGuidanceIntent` matches → DONNA returns priority guidance
- [ ] "Highlight review queue" chip → `actionType: 'highlight'` → teal glow on `review-queue-primary`
- [ ] "What is safe to approve?" chip → sends prompt → DONNA returns approval contract explanation
- [ ] Existing chips (What needs approval?, Explain this queue, Show daily brief) unchanged

---

## Sprint 904 Regression Checklist

- [ ] Approve/reject button behavior unchanged
- [ ] `proposed_actions` state machine unchanged
- [ ] No auto-approve added anywhere
- [ ] `WrapUpDraftCard` decision controls unchanged
- [ ] `AttendanceExceptionDraftCard` decision controls unchanged

---

## Sprint 968/969 Regression Checklist

- [ ] `matchesWhatNextIntent` still correctly detected (does not conflict with review queue phrases)
- [ ] `buildDirectorNextAction` still called for "what should I do next?" on review page
- [ ] `review-queue-primary` highlight still works from the next-action engine

---

## No-Mutation / No-Send Checklist

- [ ] `buildReviewQueueGuidance` has no side effects — pure text return
- [ ] No proposed_actions created
- [ ] No parent/player communications sent
- [ ] No player records changed
- [ ] One DONNA button remains
- [ ] No new DONNA surface added
- [ ] No new voice path added
