# DONNA Daily COO Intelligence — Architecture Audit
**Sprint:** Mega Sprint 1325–1354
**Date:** 2026-06-08
**Author:** Claude Code (Sprint Phase 1)

---

## Purpose

Audit the existing DONNA COO intelligence infrastructure before building the new
`donnaDailyCooIntelligenceEngine.ts`. Identifies what exists, what is wired, what
is computed but unused, and what is genuinely missing. Prevents redundant work and
establishes the minimal-delta plan.

---

## 1 — Existing COO intelligence files

| File | Sprint | Status | Called from |
|---|---|---|---|
| `donnaDailyCOOAggregator.ts` | 935 | Live, wired | `director/page.tsx` → `DonnaCOODailyBriefPanel` |
| `donnaCOOIntelligenceEngine.ts` | 784 | Live, not wired to homepage | Brain's `fetch_coo_intelligence` action only |
| `academyHealthBrief.ts` (`buildAcademyHealthReport`) | 1747/2016 | Computed but partially used | `page.tsx` computes it; only `.topIssue` is used in morning brief |
| `academyAttentionEngine.ts` | 1691 | Live, wired | `page.tsx` → `buildMorningBriefNarrative` |
| `focusTodayAnswerEngine.ts` | 1691 | Live, wired to brain | Brain step 4 / `route_coo_prompt` |
| `donnaTodayGuidanceLoop.ts` | 1861 | Live, wired to brain | `handleDonnaCooPrompt` intercept |

---

## 2 — Director homepage sections

`src/app/director/page.tsx` renders 9 sections:

1. **DonnaMorningBrief** — headline, brief line, urgency, CTA
2. **DonnaCOODailyBriefPanel** — 5 sections (Today's Priority, Watch List, Decisions Waiting, Parent/Coach, Setup/Curriculum) with urgency dots and action links
3. ImmediateAttentionFeed
4. TodayOperationsPanel
5. DevelopmentWatchList
6. DirectorDecisionsQueue
7. ProgramHealthNarrative
8. AcademyIntelligenceSection
9. DonnaRecommendedActions

`DonnaCOODailyBriefPanel` already covers: Today's priorities, decisions waiting,
watch list, parent/coach follow-ups, setup/curriculum gaps. **Missing from the panel:**
academy health (Green/Yellow/Red with 6 subcategories) and evidence-backed WHY explanations.

---

## 3 — `buildAcademyHealthReport()` — computed but not rendered

`buildAcademyHealthReport(cooAttentionCtx)` is called in `page.tsx` and returns:

```typescript
AcademyHealthReport {
  overallStatus: 'good' | 'watch' | 'action_needed' | 'critical'
  topIssue: string | null
  topRecommendation: string | null
  recommendedRoute: string | null
  sections: AcademyHealthSection[]   // 6 categories
  evidence: string[]
  limitations: string[]
  confidence: 'high' | 'partial' | 'low'
}
```

**The 6 health categories** (from `buildAcademyHealthReport`):
- Player Progress Health
- Curriculum Health
- Review & Approval Health
- Coach Execution Health
- Parent Communication Health
- Onboarding Health

The `overallStatus` and `sections[]` are computed in every page request but **never
rendered in any UI component** — only `topIssue` is forwarded to the morning brief
narrative. This is the primary health display gap.

---

## 4 — Brain routing gaps for the 8 canonical COO questions

| Q# | Question | Current handler | Quality |
|---|---|---|---|
| D1 | "What do I need to do today?" | `detectTodayGuidanceQuestion` → `route_coo_prompt` | 7/10 — routed but Evidence Reasoning Engine not integrated |
| D2 | "How is everything looking?" | **None** — falls through to intent classification (LLM fallback) | 6/10 — generic response, no structure |
| D3 | "Who needs attention?" | `isAttentionPhrase` → `fetch_attention` | 7/10 — data exists, no evidence WHY |
| D4 | "What is urgent?" | `isAttentionPhrase` catches some variants | 7/10 |
| D5 | "What can wait?" | Not specifically detected | 5/10 |
| D6 | "What is blocked?" | Not specifically detected | 5/10 |
| D7 | "What needs approval?" | `isReviewQueuePhrase` catches "what needs approval" | 8/10 — review queue wired |
| D8 | "What would you do if you were me?" | `isCOOIntelligencePhrase` → `fetch_coo_intelligence` (partial) | 7/10 |

**Critical gap:** D2 "How is everything looking?" has no phrase detector. Director asking
this in DONNA chat gets an intent-classified LLM path, not structured health data.

---

## 5 — Supabase queries already available in `page.tsx`

All signals needed for the new intelligence engine are **already queried** in `page.tsx`.
No additional DB queries are required.

| Signal | Source | Available as |
|---|---|---|
| Active players | `getPlayerSummaries` | `activePlayers` |
| Pending reviews | `proposed_actions` | `pendingWrapUpsCount`, `assessmentsNeedingReview`, `activePlacementReviews` |
| Parent updates pending | `proposed_actions` | `parentUpdatesPendingApproval` |
| Advancement ready | `player_curriculum_states` | `advancementReadyCount` |
| Stalled players | `player_curriculum_states` | `stalledPlayerCount`, `playerProgressStalls[]` |
| Players without level | `player_curriculum_states` | `playersWithoutLevel` |
| Coach recap gaps | `voice_notes` / `sessions` | `coachRecapsMissing` |
| Coach coverage gaps | `sessions` | `coachCoverageGaps` |
| Group capacity | `v_group_summary` | `groupSummaryRows[]` |
| Over-capacity groups | derived | `overCapacityGroups[]` |
| Curriculum template gaps | derived | `curriculumTemplateCoverageGapCount` |
| Class templates | `templates` | `classTemplateCount` |
| Curriculum gaps | `academy_suggestions` | `curricGapCount` |
| Oldest pending review | `proposed_actions` | `oldestPendingReviewAgeDays` |
| Today/week sessions | `sessions` | `todaySessions`, `sessionsThisWeek` |
| Private lesson requests | `private_lesson_requests` | `newRequests` |
| Onboarding readiness | derived | `onboardingReadinessLevel` |
| Health report | `buildAcademyHealthReport` | `academyHealthReport` (computed, not rendered) |
| Attention report | `buildAcademyAttentionReport` | `cooAttentionReport` |

---

## 6 — `donnaCOOIntelligenceEngine.ts` — not called from homepage

The existing `buildCOOIntelligenceReport()` (Sprint 784) generates a rich 5-category report:
- `programHealth` — group capacity, progression signals
- `playerIntelligence` — advancement, stalls, attendance risk
- `coachIntelligence` — wrap-up gaps, support needs
- `parentConfidence` — outreach risk, pending approvals
- `directorDecision` — today's focus, biggest risk, opportunity, COO synthesis

Each insight has `evidence[]`, `confidence` (high/medium/low), `recommendedAction`, and
optional `missingData[]`. This is exactly the Evidence Reasoning Engine structure the
sprint needs, **but it requires a different input type (`COOIntelligenceInput`) that is
not assembled in `page.tsx`** — it depends on `coachSupportLoader`, `playerAttentionRiskLoader`,
etc. that are only loaded in the brain's async action handlers.

**Decision:** Build `donnaDailyCooIntelligenceEngine.ts` as a lightweight wrapper that
uses only the data already available in `page.tsx` (no additional loaders). The existing
`donnaCOOIntelligenceEngine.ts` remains the deep Q&A path for the brain.

---

## 7 — What must be built (minimal delta)

### 7.1 New engine: `donnaDailyCooIntelligenceEngine.ts`

Pure TypeScript, no DB. Input: a `DailyCOOIntelligenceInput` composed entirely from
data already available in `page.tsx`. Output: `DailyCOOIntelligence` with:
- 8 structured categories (each: title, summary, why, evidence[], confidence, urgency, recommendedAction, route)
- Prioritization tier: `'urgent' | 'important' | 'can_wait'` per item
- Academy health: overall + 6 subcategories (reuses `AcademyHealthReport` from `academyHealthBrief.ts`)
- 8 canonical question answer functions (`answerTodayPriorities`, `answerAcademyHealth`, etc.)

### 7.2 UI: enhance `DonnaCOODailyBriefPanel.tsx`

Add `academyHealthReport?: AcademyHealthReport` prop. Render a compact health section
at the top of the panel: overall status badge (Good/Watch/Action Needed/Critical) + 6
subcategory rows with status dots. Keeps cognitive load low — only adds to the existing
panel, does not replace it.

### 7.3 Brain: add `isAcademyOverviewPhrase()` to `processDonnaMessage.ts`

Insert between step 7 and step 7.5. Catches:
- "how is everything looking"
- "how is the academy"
- "give me a status"
- "overall health"
- "how are things going"
- "academy overview"
- "how are we doing"

Routes to `fetch_coo_intelligence` (same action as step 7.5). This is a 15-line addition.

### 7.4 `director/page.tsx`

Pass `academyHealthReport` to `DonnaCOODailyBriefPanel`. No new queries. (Already computed.)

---

## 8 — What is NOT being built in this sprint

Per sprint constraints:
- Memory system — not built
- Knowledge Builder — not built
- Contradiction Detection — not built
- Second dashboard or UI redesign — not built
- New DB migrations — not added
- Additional Supabase queries in `page.tsx` — not added (all data already available)
- Replacement of `donnaCOOIntelligenceEngine.ts` — not replaced (it remains the brain's deep Q&A engine)

---

## 9 — Risk assessment

| Risk | Mitigation |
|---|---|
| `processDonnaMessage.ts` is complex — brain edit could regress routing | Add new detector as step 7.1 (before 7.5), test that existing steps 7 and 7.5 still fire first |
| `DonnaCOODailyBriefPanel` prop change could break existing usage | `academyHealthReport` is optional prop — panel renders same if not passed |
| `buildAcademyHealthReport` takes `DashboardAttentionContext` not `DailyCOOIntelligenceInput` | Pass `academyHealthReport` directly from `page.tsx` — it's already computed |
| Score projection (COO 82→86) may be overstated | D2+D3 fix each worth +2; new engine and health rendering justify +4 total |

---

## 10 — Conclusion

The infrastructure is substantially built. The gap is:
1. **Rendering gap** — `buildAcademyHealthReport()` output is computed but not shown
2. **Routing gap** — D3 "How is everything looking?" has no brain handler
3. **Engine gap** — no `donnaDailyCooIntelligenceEngine.ts` to answer all 8 questions with evidence, confidence, and prioritization in one call

These three gaps are addressed by 4 targeted changes with no new DB queries and no UI redesign.
