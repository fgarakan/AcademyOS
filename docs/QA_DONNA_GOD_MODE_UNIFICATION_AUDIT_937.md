# QA — DONNA God Mode Unification Audit V1
**Date:** 2026-05-29
**Sprint:** 937
**Type:** Architecture audit QA — no app code changed

---

## 1. Duplicate Assistant Risk Checklist

| Risk | Status | Evidence |
|---|---|---|
| Two independent conversation shells active simultaneously | CONFIRMED RISK | Shell A (`DonnaVoiceReadyShell`) at `/director/donna` and Shell B (`DonnaAssistantButton`) floating panel coexist in director layout — different routing, different memory |
| Two page context registries serving different shells | CONFIRMED RISK | `donnaPageContextRegistry.ts` (Shell B) vs `donnaPageContextEngine.ts` (Shell A) have diverged |
| Two action routing layers | CONFIRMED RISK | Legacy `donnaProtectedActionRegistry/Router` (Shell B) vs modern `donnaUIActionRegistry/Dispatcher` (Shell A) |
| Personality fragmentation across embedded panels | CONFIRMED RISK | DonnaTodayBriefPanel, DonnaReviewBriefPanel, etc. contain their own tone/copy |
| Player/parent DONNA disconnected from main engine | CONFIRMED RISK | `DonnaChat` + `ParentDonnaChat` are chip-based static components with no connection to Shell A routing |
| Platform owner DONNA not built | CONFIRMED — NOT YET BUILT | No shell, no context, no routing for `platform_owner` role |

---

## 2. Role-Aware QA Checklist

### Director
- [x] `DirectorDonnaContext` loads live data (pending counts, KPIs, roster signals)
- [x] Shell A routes to director-specific answer engines
- [x] Role boundary responses fire for blocked requests (parent data, RLS crossing, etc.)
- [x] Approval gate prevents DONNA from auto-executing queue items
- [x] `proposed_actions` pathway requires director click — DONNA never bypasses
- [x] Page capability map covers 20+ director routes

### Coach
- [x] `CoachDonnaContext` loads coach-scoped data (sessions today, pending wrap-ups)
- [x] Shell A responds to coach page questions
- [x] Boundary responses block access to other coaches' sessions
- [x] Wrap-up shell (Shell C) is separate, correct, and safe
- [ ] Highlight not functional for coach layout (no `DonnaHighlightBanner`) — documented gap

### Parent
- [x] `ParentDonnaChat` uses `sanitizeParentFacingText` on all responses
- [x] No raw coach notes exposed
- [x] No rankings, no peer comparisons
- [x] All displayed content is coach-approved summaries
- [ ] No routing engine — chip-based only — documented gap

### Player
- [x] `DonnaChat` shows mission, level, next level — no sensitive data
- [x] No coach concern data exposed
- [x] No director assessment data exposed
- [ ] No routing engine — chip-based only — documented gap

### Platform Owner
- [ ] No DONNA surface built — documented as not-yet-built

---

## 3. Page-Aware QA Checklist

### Director Routes
- [x] `/director/donna` — Shell A, full page context, god mode state machine
- [x] `/director` (dashboard) — Shell B floating, basic page context
- [x] `/director/review` — Shell B + review answer engine (`donnaReviewQueueAnswer.ts`)
- [x] `/director/players` — Shell B + roster attention engine
- [x] `/director/players/[id]` — Shell B + player profile context
- [x] `/director/curriculum` — Shell B + curriculum answer engines
- [x] `/director/curriculum/builder` — Shell B + curriculum draft proposal engine
- [x] `/director/sessions/[id]` — Shell B + session context
- [x] `/director/today` — DonnaTodayBriefPanel + Shell B
- [x] `/director/level-up` — Shell B + level movement guidance
- [x] `/director/onboarding` — Shell B + onboarding guide answer

### Coach Routes
- [x] `/coach/donna` — Shell A, coach context
- [x] `/coach` — Shell B floating
- [x] `/coach/sessions/[id]` — Shell B floating + wrap-up shell
- [x] `/coach/sessions/[id]/wrap-up` — Shell C (DonnaVoiceWrapUpShell) + Shell B

### Parent/Player Routes
- [x] `/parent/ask-donna` — ParentDonnaChat, chip-based
- [x] `/player/ask-donna` — DonnaChat, chip-based

---

## 4. Highlight Readiness Checklist

- [x] `DonnaFocusTarget` store exists (`donnaFocusTarget.ts`)
- [x] `DonnaHighlightBanner` component exists and works
- [x] ~60 `data-donna-focus-id` attributes present across director + coach pages
- [x] `donna-focus-ring` CSS class defined in `globals.css`
- [x] Auto-dismiss (8-second TTL) working
- [x] Manual dismiss (× button) working
- [x] Same-page highlight via `donna:highlight` custom event (Sprint 871)
- [x] Cross-page highlight via sessionStorage (set before `router.push`)
- [ ] `DonnaHighlightBanner` NOT mounted in coach layout — gap
- [ ] Shell A does NOT dispatch `setDonnaFocusTarget` + `donna:highlight` — gap
- [ ] "What next?" answer does NOT trigger highlight — gap
- [ ] Player/parent pages have NO highlight system — intentional (mobile, chip-based)

---

## 5. Safety Checklist

- [x] DONNA never calls `execute_approved_action()` directly
- [x] DONNA never calls `finalize_player_placement()` directly
- [x] All player level movement requires director approval in review queue
- [x] All parent communications require director approval before sending
- [x] `parentSafeResponseRules.ts` enforces parent-safe content — no raw notes
- [x] `donnaRoleBoundaries.ts` enforces role-specific data access
- [x] `donnaBoundaryResponses.ts` returns safe refusals for blocked requests
- [x] `donnaVisibilityGuardrail.ts` guards content visibility
- [x] `donnaApprovalGate.ts` enforces approval pipeline
- [x] `donnaSafetyRegressionPrompts.ts` covers: cross-tenant, PII, direct mutation, parent exposure, level auto-move
- [x] Sprint 904 approve/reject paths untouched in this sprint
- [x] Coach wrap-up loop Sprints 926–936 untouched in this sprint
- [x] No app code changed in Sprint 937 (docs only)

---

## 6. "What Should I Do Next?" QA Checklist

- [x] `whatIsTheBestNextStep(pathname)` function exists in `donnaPageContextEngine.ts`
- [x] Shell A routes `PAGE_NEXT_STEP` pattern to this function
- [x] Covers all 20+ director routes
- [x] Covers coach routes (`/coach`, `/coach/sessions/[id]`, `/coach/sessions/[id]/wrap-up`)
- [ ] Does NOT use live data (`directorCtx`) — always static page intent — gap
- [ ] Does NOT trigger highlight on answer — gap
- [ ] Does NOT identify specific pending items to act on — gap
- [ ] NOT wired for player/parent — gap

---

## 7. Mobile QA Checklist

- [x] Coach layout uses `BottomTabBar` + `max-w-2xl mx-auto p-4` — mobile-safe
- [x] Player/parent chip-based DONNA is mobile-appropriate (no floating panel, no voice)
- [x] Shell B (floating panel) is mounted in coach layout — panel behavior on mobile needs testing in Sprint 938
- [ ] `DonnaHighlightBanner` behavior on mobile not tested — depends on Sprint 938 wiring
- [ ] Shell A (`DonnaVoiceReadyShell`) on mobile not fully tested for coach — narrow viewport

---

## 8. Next-Sprint Readiness Checklist

### Sprint 938 Prerequisites
- [x] Coach layout identified (`src/app/coach/layout.tsx`)
- [x] `DonnaSessionContextProvider` and `DonnaHighlightBanner` both exist and are battle-tested in director layout
- [x] `setDonnaFocusTarget` + `donna:highlight` pattern is stable (Sprint 817/871)
- [x] Shell A navigation confirmation path (Yes/No offer → router.push) is the correct place to add highlight dispatch
- [x] No migrations required for Sprint 938

### Sprint 939 Prerequisites
- [x] `DonnaPageCapabilityMap` type in `donnaPageContextEngine.ts` is the right foundation for context resolver
- [x] `DirectorDonnaContext` and `CoachDonnaContext` types are stable
- [x] `DonnaSafeSessionMemory` type is available
- [ ] `donnaPersonality.ts` not yet created (Sprint 939 creates it)
- [ ] `donnaContextResolver.ts` not yet created (Sprint 939 creates it)

---

## 9. Audit Validation Results

| Check | Result |
|---|---|
| git status --short before audit | Clean (no uncommitted changes) |
| Latest commit | Sprint 936 Coach Wrap-Up Loop Certification V1 |
| npx tsc --noEmit | PASS — clean |
| App code changed in Sprint 937 | NO — docs only |
| Unsafe mutations introduced | NO |
| Parent/player communication | NO |
| Level/placement/roster/billing/curriculum mutation | NO |
| Sprint 904 approve/reject touched | NO |
| Coach wrap-up loop Sprints 926–936 touched | NO |
| Migration created | NO |

---

## 10. Architecture Audit Confidence Rating

| Area | Confidence | Notes |
|---|---|---|
| Shell inventory | High | Three shells identified, lineage confirmed |
| Duplicate risk identification | High | Two shells, two registries, two action routers all confirmed |
| Highlight system status | High | Director works; coach gap confirmed |
| "What next?" engine status | High | Text works; highlight + live-data gaps confirmed |
| Role-awareness map | High | All 5 roles assessed |
| Sprint sequence | Medium | Sprints 938–946 are directional; detailed plans per sprint needed |
| Retirement timeline for Shell B | Medium | Depends on Sprint 944 migration being non-breaking |

**Overall audit quality: High.** All critical gaps are identified. The sprint sequence is actionable. No protected systems were touched.
