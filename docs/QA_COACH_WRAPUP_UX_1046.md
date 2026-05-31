# QA — Coach Wrap-Up UX — Sprint 1046

**Sprint:** 1046 | **Date:** 2026-05-31

---

## Removed — confirm absent in saved state

- [ ] **ShieldCheck box NOT visible** ("The director will review and approve before any information reaches parents...")
- [ ] **"Ask DONNA" link NOT visible** in saved state

## Preserved — confirm present

### 6-question flow

- [ ] All 6 questions render correctly (overall, attendance, standouts, attention, adjust, followup)
- [ ] Voice input buttons functional
- [ ] Player name chips on standouts/attention questions
- [ ] Prev/Next/Skip navigation works
- [ ] "Save Wrap-Up" button submits and transitions to saved state

### Saved state

- [ ] Green checkmark and "Wrap-up submitted for review" heading
- [ ] "Your wrap-up draft is in the director review queue. Nothing has been sent to parents or applied to player profiles." visible
- [ ] **No duplicate safety notice below it**
- [ ] "Review Submitted Draft" lime button navigates to review page
- [ ] "Back to Session" button navigates back
- [ ] **No "Ask DONNA" link**
- [ ] Optional player observations section still shows when roster present

## Regression

- [ ] Wrap-up save action unchanged
- [ ] TypeScript: `npx tsc --noEmit` passes clean
