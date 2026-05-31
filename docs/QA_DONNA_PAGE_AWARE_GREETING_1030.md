# QA Checklist — DONNA Page-Aware Greeting + Chips (Sprint 1030)

**Date:** 2026-05-31
**Sprint:** 1030

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `ctx.screenName` reference compiles (already used in greeting area)

---

## Page context line (requires browser)

- [ ] Director on /director → context line NOT shown (screenName is "Director Dashboard")
- [ ] Director on /director/review → shows "You're on: Review Queue"
- [ ] Director on /director/players → shows "You're on: Player Directory" (or whatever ctx.screenName returns)
- [ ] Director on /director/curriculum → shows "You're on: Curriculum Builder"
- [ ] Director on /director/players/[id] → shows "You're on: Player Profile"
- [ ] Page name shown in lime color
- [ ] Line appears below greeting text, above review queue count

---

## Suppression checklist

- [ ] During onboarding (isOnboardingActive) → context line NOT shown
- [ ] ctx.screenName is null → context line NOT shown
- [ ] ctx.screenName === 'Director Dashboard' → context line NOT shown

---

## Chips regression checklist

- [ ] Chips still update when pathname changes
- [ ] getDonnaPromptSuggestions(pathname) still called with current pathname
- [ ] No chip changes from Sprint 1030

---

## Sprint 649 regression checklist

- [ ] Review queue count line still appears when pendingReviewCount > 0
- [ ] Context line appears ABOVE the review queue count line
- [ ] Daily brief CTA still appears for director on first open today
