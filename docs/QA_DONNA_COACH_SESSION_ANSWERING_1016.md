# QA Checklist — DONNA Coach / Session Question Answering (Sprint 1016)

**Date:** 2026-05-31
**Sprint:** 1016

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `coachSessionAnswering.ts` imports compile: `SessionContextSummary` from `./sessionContextRetrieval`
- [ ] Inline type import in interpreter: `import('./sessionContextRetrieval').SessionContextSummary` resolves
- [ ] No new `as any` introduced

---

## `buildSessionContextAnswer` unit checklist

- [ ] `sessionName: 'Orange Group Tuesday'` → opens with "Orange Group Tuesday is..."
- [ ] `sessionName: null` → opens with "This session is..."
- [ ] `sessionStatus: 'completed'` → includes "completed"
- [ ] `needsDirectorReview: true` → includes "wrap-up is waiting for your review in the Review Queue"
- [ ] `needsDirectorReview: true` → `suggestedRoute === '/director/review'`
- [ ] `needsDirectorReview: true` → `highlightTargetId === 'review-queue-primary'`
- [ ] `needsDirectorReview: true` → `primaryActionLabel === 'Review coach wrap-up'`
- [ ] `attendance.recorded: true` → includes "X of Y present, Z absent"
- [ ] `attendance.recorded: false` AND `sessionStatus: 'completed'` → "Attendance has not been recorded"
- [ ] `wrapUpStatus: 'draft_submitted'` AND `needsDirectorReview: false` → "Wrap-up: submitted — pending review"
- [ ] `wrapUpStatus: 'approved'` → "Wrap-up: approved"
- [ ] `coachName: 'Coach B'` → "Coach: Coach B"
- [ ] `groupName: 'Orange Group'` → "Group: Orange Group"
- [ ] `templateName: 'Rally Drill 45'` → "Template: Rally Drill 45"
- [ ] `blockCount: 3` → "3 blocks planned"
- [ ] `scheduledDate: '2026-05-31'` → includes date
- [ ] `donnaText` always ends with "nothing changes until you take an explicit action"
- [ ] Never throws

---

## Safety checklist

- [ ] No coach notes or observation text in answer
- [ ] No individual player names (only counts)
- [ ] No wrap-up draft content exposed
- [ ] `requiresConfirmation: false`
- [ ] Wrap-up pending → routes to Review Queue only, not auto-approved

---

## Sprint 1004 regression checklist

- [ ] Old `interpretSessionContext` (Sprint 1004 raw summary version) REMOVED
- [ ] No duplicate `interpretSessionContext` function definition
- [ ] `sessionContextRetrieval.ts` NOT changed
- [ ] `liveContextToolExecutor.ts` `get_session_context` executor NOT changed
- [ ] `INTERPRETERS` map still has `get_session_context` entry (pointing to new function)

---

## Sprint 1013–1015 regression checklist

- [ ] `academyIntelligenceAnswering.ts` NOT changed
- [ ] `playerDevelopmentAnswering.ts` NOT changed
- [ ] `curriculumAnswering.ts` NOT changed
- [ ] All other interpreters unchanged
