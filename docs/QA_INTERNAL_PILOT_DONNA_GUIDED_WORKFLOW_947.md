# QA — Internal Pilot DONNA Guided Workflow QA V1
**Date:** 2026-05-29
**Sprint:** 947

---

## 1. Director Workflow QA

### Morning Brief
- [x] "Give me a brief" triggers brief intercept
- [x] "What's going on?" triggers brief intercept
- [x] Brief reads pendingReviews from directorCtx
- [x] Top priority highlighted with teal glow
- [x] Navigation offer set for top priority href
- [x] Works with no live context (informational fallback)

### What Should I Do Next?
- [x] "What should I do next?" on /director/review → live pending count + 'pending-review-list' highlight
- [x] Navigation offer set if top priority is on a different page
- [x] Director says "yes" → navigates with highlight on destination

### Review Queue
- [x] Sprint 904 approve/reject untouched
- [x] Approve: proposed_action.status = 'approved'
- [x] Reject: proposed_action.status = 'rejected'
- [x] Clarification Needed: proposed_action.status = 'clarification_needed'

### Apply Wrap-Up
- [x] applyWrapUpDraftAction untouched (Sprints 83–84)
- [x] Sessions.session_notes written
- [x] audit_logs written
- [x] proposed_action.status = 'executed'

---

## 2. Coach Workflow QA

### Session Execution
- [x] Coach hub: coach-today-sessions element registered + highlightable
- [x] Session page: coach-run-session, coach-wrap-up-link, coach-lesson-plan elements registered
- [x] Wrap-up page: wrapup-question-card, wrapup-nav-actions elements registered

### Wrap-Up Submission
- [x] Shell C (DonnaVoiceWrapUpShell) untouched
- [x] Submit → proposed_actions row created
- [x] Director review badge increments

### Coach Feedback Visibility
- [x] Wrap-up review page shows director decision
- [x] Clarification needed note visible

---

## 3. Data Requirements Verified
- [x] Demo academy has 83 exercises (Sprint 263)
- [x] Template system operational
- [x] proposed_actions pipeline functional

---

## 4. Pilot Readiness
- [x] Director workflow: GO
- [x] Coach wrap-up loop: GO (Sprint 936 certified at 8/10)
- [ ] Voice transcription: BLOCKED (OPENAI_API_KEY needed)
- [ ] Parent live data: BLOCKED (guardian linkage needed)
- [ ] Player live data: BLOCKED (profile_id linkage needed)
