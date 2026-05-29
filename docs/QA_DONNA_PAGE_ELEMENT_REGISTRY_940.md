# QA — DONNA Page Element Registry V1
**Date:** 2026-05-29
**Sprint:** 940

---

## 1. TypeScript Validation
- [x] `npx tsc --noEmit` passes — clean
- [x] `donnaPageElementRegistry.ts` compiles
- [x] `donnaContextResolver.ts` compiles with new `topPageElement` field
- [x] No circular imports: registry imports only from `donnaPersonality.ts`

---

## 2. Registry Content Checklist
- [x] 38 total elements registered
- [x] All 5 role groups: director (28), coach (10)
- [x] Parent/player/platform not in registry (no highlight surfaces for those roles)
- [x] Priority levels used: urgent (8), high (15), medium (12), low (3)
- [x] Safety levels: always_safe (21), draft_to_review (10), approval_required (7)
- [x] All `id` values match existing `data-donna-focus-id` attributes in the DOM
- [x] No new DOM attributes needed or added
- [x] Routes with parameterised segments use `[param]` notation matching regex pattern
- [x] `dataDependent: true` on elements that should only surface when live data confirms (review items, attention flags, etc.)

---

## 3. Context Resolver Integration
- [x] `DonnaResolvedContext.topPageElement` field added
- [x] `getTopPageElement(pathname, role)` returns highest-priority element or null
- [x] `/director/review` + `director` → `pending-review-list` (urgent)
- [x] `/director` + `director` → `review-queue-card` (urgent)
- [x] `/coach` + `coach` → `coach-today-sessions` (urgent)
- [x] `/coach/sessions/[id]/wrap-up` + `coach` → `wrapup-question-card` (urgent)
- [x] Unknown route → null (no crash)
- [x] Role mismatch (e.g. director asking for coach elements) → empty list

---

## 4. Route Matching
- [x] Exact match: `/director/review` matches exactly
- [x] Parameterised: `/director/sessions/abc123` matches `/director/sessions/[sessionId]`
- [x] Parameterised: `/coach/sessions/xyz/wrap-up` matches `/coach/sessions/[sessionId]/wrap-up`
- [x] No match: `/unknown-page` returns empty list (no crash)

---

## 5. Protected Systems
- [x] No DOM attributes added or changed
- [x] No app route files modified
- [x] No Shell A/B routing logic modified
- [x] Approval gate paths untouched
- [x] proposed_actions untouched
- [x] Coach wrap-up loop untouched
- [x] No migrations

---

## 6. Safety Invariants
- [x] Registry is read-only — no mutations anywhere
- [x] `dataDependent: true` elements are correctly flagged (system does not auto-surface them without context verification)
- [x] `approval_required` elements always include explanation mentioning review queue
- [x] Parent/player elements excluded — no sensitive data exposed via registry
