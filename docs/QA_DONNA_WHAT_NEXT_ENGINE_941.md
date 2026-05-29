# QA — DONNA What Should I Do Next Engine V1
**Date:** 2026-05-29
**Sprint:** 941

---

## 1. TypeScript Validation
- [x] `npx tsc --noEmit` passes — clean
- [x] `donnaWhatNextEngine.ts` compiles
- [x] `DonnaVoiceReadyShell.tsx` compiles with new imports and PAGE_NEXT_STEP changes
- [x] No circular imports: engine imports from donnaPersonality, donnaContextResolver, donnaPageElementRegistry, donnaPageContextEngine

---

## 2. Engine Priority Ranking

- [x] Priority 1: pendingReviews > 0 → live_pending_reviews (highest)
- [x] Priority 2: attendanceExceptions > 0 → live_attendance
- [x] Priority 3: advancementEligibleCount > 0 → live_advancement
- [x] Priority 4: playerProgressStallCount > 0 → live_stall
- [x] Priority 5: urgent non-data-dependent page element → page_element_urgent
- [x] Priority 6: high non-data-dependent page element → page_element_high
- [x] Priority 7 (fallback): whatIsTheBestNextStep() → page_fallback
- [x] No crashes when liveCtx is undefined (pure page-based answer)
- [x] No crashes when role has no registered page elements

---

## 3. Shell A PAGE_NEXT_STEP Pattern Extension

Before Sprint 941 — NOT matched:
- "What should I do next?"
- "What's next?"
- "What's my next step?"
- "What to do next"

After Sprint 941 — matched:
- All of the above + original patterns (here, on this page, best next step)

---

## 4. Shell A Highlight Trigger

- [x] When engine returns `targetId`, `setDonnaFocusTarget` is called
- [x] `donna:highlight` custom event dispatched (same-page highlight)
- [x] Focus target includes: route (currentPath), targetId, label, sourceCommand
- [x] When engine returns `href` (different page), `setPendingNavOffer` is set for yes/no confirmation
- [x] No automatic navigation — director says "yes" to navigate

---

## 5. Live Context Wiring

- [x] directorCtx.pendingReviews wired to WhatNextLiveContext
- [x] directorCtx.attendanceExceptions wired
- [x] directorCtx.advancementEligibleCount wired
- [x] directorCtx.playerProgressStallCount wired
- [x] directorCtx.highRiskPlayerCount wired
- [x] directorCtx.curriculumDraftCount wired
- [x] When directorCtx is null, engine still works with page-element fallback

---

## 6. Safety Invariants

- [x] Engine never writes data
- [x] Engine never auto-navigates (sets nav offer for director confirmation only)
- [x] `approval_required` elements include `getSafetyMessage('approvalRequired')` in response
- [x] `draft_to_review` elements include `getSafetyMessage('draftOnly')` in response
- [x] No parent/player communication triggered
- [x] No level/placement/roster/billing changes
- [x] No bypass of review queue

---

## 7. Protected Systems

- [x] Sprint 904 approve/reject paths untouched
- [x] proposed_actions untouched
- [x] DonnaAssistantButton (Shell B) untouched
- [x] Coach wrap-up loop untouched
- [x] All existing PAGE_WHERE_AM_I, PAGE_WHAT_CAN_I_DO, PAGE_APPROVAL, PAGE_SAFETY paths unchanged
- [x] KPI intercept, dashboard priority intercept, review queue intercept — unchanged (PAGE_NEXT_STEP fires before these)
- [x] No migrations

---

## 8. Manual Test Checklist

### Director on /director/review with pending reviews
1. Ask: "What should I do next?"
2. Expected: DONNA mentions pending review count + highlights `pending-review-list`
3. Expected: Teal highlight banner appears on review list

### Director on /director (dashboard) with pending reviews
1. Ask: "What's next?"
2. Expected: DONNA mentions pending reviews + offers navigation to /director/review
3. Say "yes" → Expected: navigates to review page with highlight

### Director on /director/players with no live ctx
1. Ask: "What should I do next?"
2. Expected: Page element answer (player-directory-summary or players-missing-level)

### Director on /director/curriculum/builder
1. Ask: "What to do next?"
2. Expected: curriculum-builder-hero highlighted
