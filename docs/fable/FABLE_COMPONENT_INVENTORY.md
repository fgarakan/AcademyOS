# Fable Director UX — Component Inventory V1

**June 2026**
**Scope: `src/app/director/_components/`**

Classifies every component by current status and Fable fate.

---

## Status Legend

| Status | Meaning |
|---|---|
| **ACTIVE** | Imported and rendered in a live page |
| **ACTIVE-SHARED** | Imported across multiple live pages |
| **LEGACY** | File exists, not imported in any primary page. Superseded or abandoned. |
| **LAYOUT** | Mounted at layout level (not a page component) |

## Fable Fate Legend

| Fate | Meaning |
|---|---|
| **KEEP** | Stays. May be visually refined but structure unchanged. |
| **REDESIGN** | Core function is right; visual treatment needs Fable pass. |
| **COMPRESS** | Too large or prominent; collapse to smaller footprint. |
| **MOVE** | Content belongs on a different page, not Today. |
| **REMOVE-TODAY** | Remove from Today page; may survive on other pages. |
| **DELETE** | Not used anywhere meaningful. Candidate for removal. |
| **AUDIT** | Unclear status. Needs code search before deciding. |

---

## Components — Active On Today Page

| Component | Status | Fable Fate | Notes |
|---|---|---|---|
| `AcademySituationBanner` | ACTIVE | **REDESIGN** | The "academy weather" concept is right. Currently a strip below the hero. In Fable: merged into the hero area — situation is the first thing DONNA communicates, not a separate band. |
| `DonnaDailyBriefHero` | ACTIVE | **REDESIGN** | The primary DONNA surface. Best component on the page. In Fable: taller, more editorial, situation label moves into greeting line, secondary action becomes a link not a full CTA. |
| `DirectorDecisionCenter` | ACTIVE | **KEEP** | The 3-decision layout is the right model. Cards are clean. Minor: compress padding, reduce urgency badge size. |
| `ReturningDirectorBanner` | ACTIVE | **KEEP** | Conditional on 14+ day absence. Good structure. Low change needed. |
| `TopThreeAlertsPanel` | ACTIVE | **COMPRESS** | Currently a full Card panel with header. In Fable: a compact row of 3 inline items inside a single card row shared with Wins. No separate panel header. |
| `TopThreeWinsPanel` | ACTIVE | **COMPRESS** | Same as Alerts. Currently two equal-weight panels side by side. In Fable: same card, two columns, no redundant chrome. |
| `WhatChangedPanel` | ACTIVE | **COMPRESS** | Currently expanded by default. In Fable: collapsed by default. Director opens it when they want it. |
| `WhatCanWaitPanel` | ACTIVE | **COMPRESS** | Already collapsed. Keep. Minor: smaller header. |
| `DonnaCOOPanel` | ACTIVE | **MOVE** | 10 COO Q&A items is too much information for the Today landing. This belongs on `/director/donna` page. Remove from Today after that page is built. V1: keep but compress. |
| `DonnaWorkQueue` | ACTIVE | **COMPRESS** | Currently a card with domain breakdown. In Fable: inline count badge in the hero or decisions area. Directors don't need a full panel — just the count. |
| `DonnaActionTimeline` | ACTIVE | **REMOVE-TODAY** | History does not belong on Today. Move to `/director/review` or a new `/director/activity` route. Remove from Today after that is built. |
| `TodaySetupCard` | ACTIVE | **KEEP** | Setup mode gate. Simple, functional. No change. |
| `ExplainWhyModal` | ACTIVE | **KEEP** | Used inside DonnaDailyBriefHero. Correct pattern. |

---

## Components — Active On Other Pages

| Component | Used In | Fable Fate | Notes |
|---|---|---|---|
| `DonnaDraftCard` / `DonnaDraftList` | Players page, Curriculum page | **KEEP** | In-context DONNA action surfacing. Good pattern. |
| `DonnaCommandBar` | Layout | **KEEP** | Global voice command bar. Leave as-is. |
| `DirectorCapacityMeter` | New — unconfirmed | **AUDIT** | New untracked file. Check if imported anywhere. |

---

## Legacy Components — Not Imported In Any Live Primary Page

These components exist in `_components/` but are not imported in `director/page.tsx`, `players/page.tsx`, `curriculum/page.tsx`, or `curriculum/builder/page.tsx`. They are candidates for deletion or were superseded by newer components.

| Component | Likely Replaced By | Fable Fate |
|---|---|---|
| `AcademyHealthBreakdown` | Director decisions / attention engine | **DELETE** |
| `AcademyIntelligenceSection` | DonnaCOOPanel | **DELETE** |
| `AcademyKpiCardsSection` | Director decisions | **DELETE** |
| `DevelopmentWatchList` | Player domain drafts | **DELETE** |
| `DirectorAcademyHealthSnapshot` | AcademySituationBanner | **DELETE** |
| `DirectorAttentionQueueHero` | TopThreeAlertsPanel | **DELETE** |
| `DirectorDecisionsQueue` | DirectorDecisionCenter | **DELETE** |
| `DirectorDnaStatusBadge` | AcademySituationBanner confidence | **DELETE** |
| `DirectorKpiHealthSection` | kpi/page.tsx | **AUDIT** |
| `DirectorPrimaryActionHero` | DonnaDailyBriefHero | **DELETE** |
| `DirectorReviewDecideZone` | DirectorDecisionCenter | **DELETE** |
| `DirectorTodayCommandCenter` | current page.tsx composition | **DELETE** |
| `DirectorTodayDonnaBrief` | DonnaDailyBriefHero | **DELETE** |
| `DirectorTodayKpiSection` | TopThreeAlertsPanel + Wins | **DELETE** |
| `DirectorTopPriorities` | DirectorDecisionCenter | **DELETE** |
| `DonnaAskButton` | DonnaAssistantButton (global) | **DELETE** |
| `DonnaCOODailyBriefPanel` | DonnaCOOPanel | **DELETE** |
| `DonnaDashboardOpenCard` | DonnaWorkQueue | **DELETE** |
| `DonnaExecutiveCard` | DonnaExecutiveWorkspace (stale) | **DELETE** |
| `DonnaExecutiveWorkspace` | Superseded by Operating Partner | **DELETE** |
| `DonnaMorningBrief` | DonnaDailyBriefHero | **DELETE** |
| `DonnaRecommendedActions` | DonnaDraftCard | **DELETE** |
| `DonnaSignalMeta` | Confidence badges in decision cards | **AUDIT** |
| `ImmediateAttentionFeed` | TopThreeAlertsPanel | **DELETE** |
| `ProgramHealthNarrative` | DirectorDecisionCenter | **DELETE** |
| `TodayActionExpansionPanel` | DonnaDraftCard | **DELETE** |
| `TodayDecisionsCard` | DirectorDecisionCenter | **DELETE** |
| `TodayDonnaPromptsCard` | DonnaCOOPanel | **DELETE** |
| `TodayHealthCard` | TopThreeWinsPanel | **DELETE** |
| `TodayOperationsPanel` | DirectorDecisionCenter | **DELETE** |
| `TodayPrioritiesCard` | DirectorDecisionCenter | **DELETE** |
| `TodayRisksCard` | TopThreeAlertsPanel | **DELETE** |
| `TopThreePrioritiesPanel` | DirectorDecisionCenter | **DELETE** |
| `WhatShouldIIgnorePanel` | WhatCanWaitPanel | **DELETE** |
| `buildMorningBriefNarrative.ts` (ts not tsx) | DonnaDailyBriefHero | **AUDIT** |

**Total legacy:** ~32 components. Deletion sprint = one sprint after Today Fable V1 is stable.

---

## Cleanup Sprint (Schedule After Fable Today V1)

One sprint, no UI changes:
- Delete all DELETE-marked components
- Run `npx tsc --noEmit` to confirm no imports broken
- Run `git status` to confirm no pages affected
- Stage only deleted files

This frees ~2,000 lines of dead code and eliminates confusion about what is active.

---

## Active Component Count Summary

| Status | Count |
|---|---|
| Active on Today | 13 |
| Active on other pages | 3 |
| Legacy / DELETE candidates | 32 |
| **Total in _components/** | **~48** |

After cleanup: 16 active components. A maintainable surface.
