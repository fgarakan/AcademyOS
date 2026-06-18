# DONNA Atomic Loop Coverage Report V1

**Date:** 2026-06-18
**Sprint:** Mega Sprint 3121–3150 — DONNA Atomic Loop Coverage & Live State Expansion V1
**Certification:** 380/380 assertions passing across 6 certification files

---

## Atomic Loop Coverage Table

| # | Loop | Primary Route(s) | Page Intel | Live State | Task | Completion Path | Coach Coverage | Pre-Sprint Score | Post-Sprint Score |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Academy Onboarding | `/director/onboarding` | ✅ | PARTIAL | ✅ | ✅ | N/A | 7/10 | 7/10 |
| 2 | Curriculum Builder | `/director/curriculum` | ✅ | PARTIAL (signals exist; not yet wired from UI) | ✅ | ✅ | N/A | 7/10 | 7/10 |
| 3 | Template Builder | `/director/class-templates/`, `/director/fitness/templates/` | ✅ | ❌ | PARTIAL (uses generic fallback) | ✅ | N/A | 7/10 | 7/10 |
| 4 | Session Creation | `/director/sessions`, `/director/sessions/new` | PARTIAL | ❌ | PARTIAL | ✅ (new) | N/A | 5/10 | 6/10 |
| 5 | Coach Assignment | `/director/coaches`, `/director/groups/[id]` | PARTIAL | ❌ | PARTIAL | PARTIAL | N/A | 6/10 | 6/10 |
| 6 | Coach Wrap-Up | `/coach/sessions/[id]/wrap-up` | ✅ (new) | ❌ | ✅ (new) | ✅ (new) | ✅ | 3/10 | **8/10** |
| 7 | Player Assessment | `/director/players/[id]`, `/coach/players/[id]` | PARTIAL | ❌ | ✅ | ✅ | PARTIAL | 7/10 | 7/10 |
| 8 | Placement / Readiness | `/director/placement` | ✅ | PARTIAL | ✅ | ✅ | N/A | 7/10 | 7/10 |
| 9 | Parent Portal | `/director/parents` | ✅ | PARTIAL (new fields; not wired) | ✅ | ✅ | N/A | 7/10 | 7/10 |
| 10 | Director Approvals | `/director/review` | ✅ | ✅ (pendingReviewCount) + NEW (pendingParentApprovals, pendingCoachApprovals) | ✅ | ✅ | N/A | 9/10 | **9/10** |
| 11 | Level-Up / Promotion | `/director/level-up` | ✅ | PARTIAL | ✅ | ✅ | N/A | 7/10 | 7/10 |
| 12 | Player Profile | `/director/players/[id]` | ✅ | ❌ (per-player signals not in scope) | ✅ | ✅ | N/A | 8/10 | 8/10 |
| 13 | Players List | `/director/players` | ✅ | NEW (playersNeedingAttention, playersWithoutAssessment) | ✅ | ✅ | N/A | 8/10 | 8/10 |
| 14 | Groups | `/director/groups/[id]` | ✅ | ❌ | ✅ | ✅ | N/A | 4/10 | 4/10 |
| 15 | Sessions | `/director/sessions` | ✅ | ❌ | ✅ | ✅ | N/A | 6/10 | 6/10 |
| 16 | Academy Health / COO Brief | `/director`, `/director/kpi` | ✅ | PARTIAL | ✅ | ✅ | N/A | 9/10 | 9/10 |

**Coach Home** | `/coach/` | ✅ (new) | ❌ | ✅ (new) | ✅ (new) | ✅ | N/A → **8/10** |

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
| 1 | `curriculumSpineActive` / `playersMissingCurriculumLevel` not passed from DonnaAssistantButton call sites | Curriculum Builder | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 2 | `placementQueueCount` / `levelUpQueueCount` not passed from call sites | Placement, Level-Up | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 3 | No PageIntelligence for `/director/sessions/new` | Session Creation | `pageContextResolver.ts` STATIC_PAGE_DEFAULTS + COMPLETION_INTELLIGENCE | Medium |
| 4 | No PageIntelligence for `/director/coaches` | Coach Assignment | `pageContextResolver.ts` STATIC_PAGE_DEFAULTS + COMPLETION_INTELLIGENCE | Medium |
| 5 | `/director/groups/[id]` route does not exist as an app page | Groups | New page route: `src/app/director/groups/[id]/page.tsx` | Large |
| 6 | `playersNeedingAttention` / `playersWithoutAssessment` not passed from call sites | Players List | `DonnaAssistantButton.tsx` — 3 call sites | Small |
| 7 | No PageIntelligence for `/coach/players/[id]` | Player Assessment (coach) | `pageContextResolver.ts` DYNAMIC_PAGE_REGISTRY | Medium |
| 8 | `onboardingProgress` step count (0–7) never derivable from UI without reading individual step flags | Onboarding | Director layout: read step completion data and pass to button | Medium |
| 9 | `pendingParentApprovals` / `pendingCoachApprovals` not passed from call sites | Director Approvals | `DonnaAssistantButton.tsx` — would require breakdown query in layout | Large |
| 10 | No per-session live state (`wrapUpSubmitted`, `attendanceMarked`) reachable in coach session view | Coach Wrap-Up | New fields in LivePageState + coach session page wiring | Medium |
