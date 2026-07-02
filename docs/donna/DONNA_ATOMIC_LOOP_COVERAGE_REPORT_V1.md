# DONNA Atomic Loop Coverage Report V1

**Date:** 2026-06-18 · **Taxonomy reconciled: Sprint 4359 (2026-07-02)**
**Sprint:** Mega Sprint 3121–3150 — DONNA Atomic Loop Coverage & Live State Expansion V1
**Certification:** 380/380 assertions passing across 6 certification files. Loop names reconciled to the canonical 10 in Sprint 4359 (see `atomicLoopUsabilityCertification.ts`, re-run **60/60 · 10/10** on 2026-07-02).

---

## Canonical 10 Atomic Loop Coverage Table

> Reconciled Sprint 4359. The former cert loops "Player Assessment" and "Placement / Readiness" now merge into canonical **8 Player Development & Evidence**; "Coach Session Execution" is added as canonical **6**. Coverage scores below are the pre-reconciliation V1 measurements carried forward per loop; live-state gaps are unchanged by the rename.

| # | Canonical Loop | Primary Route(s) | Page Intel | Live State | Task | Completion Path | Coach Coverage | Score |
|---|---|---|---|---|---|---|---|---|
| 1 | Academy Setup | `/director/onboarding` | ✅ | PARTIAL | ✅ | ✅ | N/A | 7/10 |
| 2 | Curriculum Setup | `/director/curriculum` | ✅ | PARTIAL (signals exist; not yet wired from UI) | ✅ | ✅ | N/A | 7/10 |
| 3 | Class Template Setup | `/director/class-templates/`, `/director/fitness/templates/` | ✅ | ❌ | PARTIAL (generic fallback) | ✅ | N/A | 7/10 |
| 4 | Session Creation | `/director/sessions`, `/director/sessions/new` | PARTIAL | ❌ | PARTIAL | ✅ | N/A | 6/10 |
| 5 | Coach Assignment & Session Readiness | `/director/coaches`, `/director/groups/[id]` | PARTIAL | ❌ | PARTIAL | PARTIAL | N/A | 6/10 |
| 6 | Coach Session Execution | `/coach/sessions/[id]` | ✅ | ❌ (no per-session `wrapUpSubmitted`/`attendanceMarked` live state) | ✅ | ✅ | ✅ | 7/10 |
| 7 | Coach Wrap-Up | `/coach/sessions/[id]/wrap-up` | ✅ | ❌ | ✅ | ✅ | ✅ | **8/10** |
| 8 | Player Development & Evidence | `/director/players/[id]`, `/director/placement`, `/coach/players/[id]` | PARTIAL | PARTIAL | ✅ | ✅ | PARTIAL | 7/10 |
| 9 | Director Review & Approval | `/director/review` | ✅ | ✅ (pendingReviewCount) + pendingParentApprovals, pendingCoachApprovals | ✅ | ✅ | N/A | **9/10** |
| 10 | Parent & Player-Safe Clarity | `/parent`, `/player/ask-donna`, `/director/players/[id]` | PARTIAL (`/parent` portal route has no PageIntelligence entry) | PARTIAL (new fields; not wired) | ✅ | ✅ | N/A | 7/10 |

## Supporting surfaces (NOT atomic loops)

These are pages DONNA is page-aware of, but they are not end-to-end operating loops. Kept for coverage reference only.

| Surface | Route | Page Intel | Score |
|---|---|---|---|
| Level-Up / Promotion | `/director/level-up` | ✅ | 7/10 |
| Player Profile | `/director/players/[id]` | ✅ | 8/10 |
| Players List | `/director/players` | ✅ | 8/10 |
| Groups | `/director/groups/[id]` | ✅ | 4/10 |
| Sessions list | `/director/sessions` | ✅ | 6/10 |
| Academy Health / COO Brief | `/director`, `/director/kpi` | ✅ | 9/10 |
| Coach Home | `/coach/` | ✅ | 8/10 |

---

## What Changed This Sprint

### New Page Intelligence Coverage
- `/coach/sessions/[id]` — full page intelligence, task, completion path
- `/coach/sessions/[id]/wrap-up` — targeted wrap-up intelligence with completion goals
- `/coach/` — coach home intelligence

### New Live State Fields (14 new signals)
- `curriculumProgress`, `pendingCurriculumReviews`
- `pendingPlacementReviews`
- `promotionQueueCount`, `pendingPromotionApprovals`
- `upcomingSessions`, `unassignedSessions`, `coachCoverageIssues`
- `pendingParentApprovals`, `pendingCoachApprovals`
- `playersNeedingAttention`, `playersWithoutAssessment`, `playersWithoutPlacement`
- `underfilledGroups`, `overfilledGroups`

### New Live State Overrides in resolvePageIntelligence
- `/director/players` — overrides with attention count and assessment warning
- `/director` home — surfaces attention flags in warnings
- `/director/review` — surfaces parent/coach approval breakdown

### New Task Resolver Entries
- `/coach` static task (pending wrap-ups)
- `/director/sessions/new` static task
- `/coach/sessions/` dynamic prefix task
- `/coach/` dynamic prefix fallback task
- `/director/players` updated to use `playersNeedingAttention`
- `/director/review` updated to use `pendingParentApprovals`

### New Completion Paths
- `/coach` static path
- `/director/sessions/new` static path
- `/director/coaches` static path
- `/coach/sessions/` dynamic prefix path
- `/coach/` dynamic prefix fallback path

### Universal Operating Phrase Library
New file: `donnaOperatingPhraseLibrary.ts`
- 9 canonical operating intents
- 47+ phrase variants
- `detectOperatingIntent()` — used by processDonnaMessage Step 7.6
- `getOperatingIntentPrompt()` — adds intent-specific framing to page responses

### Brain Improvements
- `isPageConfusionPhrase` expanded with 12 new phrases including all 5 mission-standard phrases
- Step 7.6 now detects operating intent and adds targeted framing prefix to page responses

---

## Top 10 Remaining Gaps

| # | Gap | Affected Loop | Fix Location | Fix Size |
|---|---|---|---|---|
| 1 | `curriculumSpineActive` / `playersMissingCurriculumLevel` not passed from DonnaAssistantButton call sites | Curriculum Setup | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 2 | `placementQueueCount` / `levelUpQueueCount` not passed from call sites | Placement, Level-Up | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 3 | No PageIntelligence for `/director/sessions/new` | Session Creation | `pageContextResolver.ts` STATIC_PAGE_DEFAULTS + COMPLETION_INTELLIGENCE | Medium |
| 4 | No PageIntelligence for `/director/coaches` | Coach Assignment | `pageContextResolver.ts` STATIC_PAGE_DEFAULTS + COMPLETION_INTELLIGENCE | Medium |
| 5 | `/director/groups/[id]` route does not exist as an app page | Groups | New page route: `src/app/director/groups/[id]/page.tsx` | Large |
| 6 | `playersNeedingAttention` / `playersWithoutAssessment` not passed from call sites | Players List | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 7 | No PageIntelligence for `/coach/players/[id]` | Player Development & Evidence (coach) | `pageContextResolver.ts` DYNAMIC_PAGE_REGISTRY | Medium |
| 8 | `onboardingProgress` step count (0–7) never derivable from UI without reading individual step flags | Onboarding | Director layout: read step completion data and pass to button | Medium |
| 9 | `pendingParentApprovals` / `pendingCoachApprovals` not passed from call sites | Director Review & Approval | `DonnaAssistantButton.tsx` — would require breakdown query in layout | Large |
| 10 | No per-session live state (`wrapUpSubmitted`, `attendanceMarked`) reachable in coach session view | Coach Wrap-Up | New fields in LivePageState + coach session page wiring | Medium |
