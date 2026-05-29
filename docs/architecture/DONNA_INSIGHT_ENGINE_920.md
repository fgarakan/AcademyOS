# DONNA Insight Engine — Architecture
**Sprint:** 920 | **Date:** 2026-05-29

---

## 1. Design

The insight engine is a pure TypeScript function that takes `DirectorDonnaContext` (already loaded by `loadDirectorDonnaContext`) and returns `DonnaInsight[]` with no additional DB calls.

```
loadDirectorDonnaContext(db, academyId)
  → DirectorDonnaContext (rich operating context)
  → generateDonnaInsights(ctx, limit=4)
  → DonnaInsight[] (deterministic, no LLM, no side effects)
  → DonnaInsightSection (renders on /director/donna left column)
```

## 2. Insight Shape

```ts
interface DonnaInsight {
  id: string                // stable deduplication key
  type: InsightType         // 7 types in V1
  title: string             // one-line description
  evidence: string          // what data supports this
  recommendation: string    // what director should consider
  confidence: 'high' | 'medium' | 'low'
  requiresApproval: boolean // whether acting on this needs review flow
  safeNextStep: string      // navigation-safe suggested action
  href?: string             // optional deep-link
}
```

## 3. Sources Used

All signals come from `DirectorDonnaContext` fields:
- `attentionItems` → player issue count per player
- `pendingReviews` → review queue buildup
- `advancementEligibleCount` → advancement waiting
- `curriculumTemplateCoverageGapCount` → curriculum gaps
- `assessmentCoverageGapCount` → assessment gaps
- `missingWrapUps` + `todaySessions` → wrap-up ratio
- `playerProgressStalls` → stall detection

## 4. V2 Gaps

1. **Recommendation rejection pattern** — requires querying `donna_recommendation_feedback` table. Deferred to Sprint 921 (recommendation learning dashboard).
2. **Group-level repeated issues** — requires group-scoped observation aggregation. Not in ctx yet.
3. **Trend detection** — comparing current signals to historical baseline. Requires time-series data.
4. **Player-level insight deep-link** — currently links to `/director/players`; V2 should link to specific player profile.
