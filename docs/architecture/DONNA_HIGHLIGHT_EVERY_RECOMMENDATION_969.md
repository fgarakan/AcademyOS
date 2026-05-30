# DONNA Highlight Every Recommendation — Sprint 969

**Date:** 2026-05-30
**Sprint:** 969
**Status:** Implemented — TypeScript clean

---

## Rule Established

**DONNA never recommends without pointing when a safe UI target exists.**

Every recommendation from `buildDirectorNextAction` must return a stable `targetFocusId` that exists unconditionally on the current page. Conditional elements are not valid primary highlight targets.

---

## Sprint 968 Target Coverage Audit

| Route/Case | Engine Target | Pre-969 Status |
|---|---|---|
| `/director` + pending reviews | `review-queue-card` | ✅ Exists unconditionally |
| `/director` + fallback | `academy-metrics-section` | ✅ Exists unconditionally |
| `/director/review` + pending | `attendance-exceptions-section` | ⚠️ Conditional — only rendered when attendance exceptions exist |
| `/director/curriculum` | `curriculum-status` | ✅ Exists unconditionally |
| `/director/class-templates/[id]` | `class-template-primary-action` | ✅ Exists unconditionally |
| `/director/class-templates` | `template-list` | ✅ Exists unconditionally |
| `/director/sessions` | `session-list` | ✅ Exists unconditionally |
| `/director/players` | `player-list` | ✅ Exists unconditionally |

**Gap:** `attendance-exceptions-section` was the review page target. It is only rendered when `(pendingAttendanceDrafts.length + approvedAttendanceDrafts.length) > 0`. When the director has pending wrap-ups or observations but no attendance exceptions, DONNA's highlight would silently fail.

---

## Changes Made

### 1. `src/app/director/review/page.tsx`

Added `data-donna-focus-id="review-queue-primary"` as a wrapper div around the entire `<Tabs>` component (the main review queue content area). This element:
- Is always present when the review page renders
- Wraps the tab bar and all tab content
- Is independent of which tab is active or which sections have items
- Does not affect tab behavior, approval/rejection logic, or data fetching

`attendance-exceptions-section` is preserved exactly as-is for its own Sprint 836 use case (attendance exception chip targeting).

### 2. `src/lib/donna/directorNextActionEngine.ts`

Changed the focus target for `/director/review` from `attendance-exceptions-section` to `review-queue-primary`.

Before:
```typescript
: isOnReview
? 'attendance-exceptions-section'
```

After:
```typescript
: isOnReview
? 'review-queue-primary'
```

---

## Post-969 Target Coverage Audit

| Route/Case | Engine Target | Status |
|---|---|---|
| `/director` + pending reviews | `review-queue-card` | ✅ Always present |
| `/director` + fallback | `academy-metrics-section` | ✅ Always present |
| `/director/review` + pending | `review-queue-primary` | ✅ Always present (Sprint 969) |
| `/director/curriculum` | `curriculum-status` | ✅ Always present |
| `/director/class-templates/[id]` | `class-template-primary-action` | ✅ Always present |
| `/director/class-templates` | `template-list` | ✅ Always present |
| `/director/sessions` | `session-list` | ✅ Always present |
| `/director/players` | `player-list` | ✅ Always present |

**All 8 recommendation cases now have unconditionally-present highlight targets.**

---

## No-Mutation / No-Migration Guarantee

- No database schema changes.
- No RLS changes.
- No approval/rejection logic changes.
- No tab behavior changes.
- No data fetching changes.
- No new API routes.
- No new DONNA surfaces.
- No new voice paths.
- Adding `data-donna-focus-id` is a pure HTML attribute with no runtime behavior of its own.

---

## V2 Improvements (Sprint 970+)

- Add `review-queue-primary` to the chip registry so directors can explicitly tap "Highlight Review Queue" on the review page.
- Expand highlight coverage to session detail, player profile tabs (priorities, evidence hub), and coach pages.
- Wire `missingRecapCount`, `placementCount`, `advancementCount` as live signals for cross-page recommendations.
