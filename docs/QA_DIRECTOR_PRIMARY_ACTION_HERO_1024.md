# QA Checklist — Director Primary Action Hero (Sprint 1024)

**Date:** 2026-05-31
**Sprint:** 1024

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `DirectorPrimaryActionHeroProps` type exports correctly
- [ ] `AttentionQueue` import resolves from `@/lib/director/attentionQueue`
- [ ] `Link` import resolves from `next/link`

---

## Priority resolution unit checklist

- [ ] `pendingReviewCount: 3, attentionQueue: empty` → "3 items need your decision"
- [ ] `pendingReviewCount: 1` → "1 item needs your decision" (singular)
- [ ] `pendingReviewCount: 0, pendingPlacementCount: 2` → "2 players are waiting for placement"
- [ ] Critical attention item present → "Handle now" CTA regardless of review count
- [ ] `pendingReviewCount: 0, pendingPlacementCount: 0, attentionQueue: empty` → "Academy is on track"
- [ ] `firstName: 'Brian'` → greeting includes "Good morning, Brian."
- [ ] `firstName: null` → greeting is "Director Dashboard."
- [ ] `pendingReviewCount: 5` → urgency 'high' (≥5)
- [ ] `pendingReviewCount: 3` → urgency 'normal' (<5)

---

## Visual regression checklist (requires browser)

- [ ] Hero block visible at top of director dashboard
- [ ] One lime button visible
- [ ] No competing buttons of equal weight
- [ ] Critical state shows red border (needs `attentionQueue` with critical item)
- [ ] "Academy is on track" state shows checkmark icon
- [ ] Responsive on mobile (component stacks cleanly)

---

## Sprint 1023 regression checklist

- [ ] `academyOsUxAudit.ts` NOT changed
- [ ] `DIRECTOR_DASHBOARD_PRE_1024_AUDIT` unchanged

---

## V1 limitation checklist

- [ ] `DirectorPrimaryActionHero` is NOT yet rendered in `/director/page.tsx`
- [ ] Sprint 1026 wiring plan documented in architecture doc
