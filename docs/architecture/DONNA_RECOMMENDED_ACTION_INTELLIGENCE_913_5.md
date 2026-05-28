# DONNA Recommended Action Intelligence
**Sprint:** 913.5
**Date:** 2026-05-28
**Updates:** `directorDashboardDonnaAnswer.ts`

---

## Source Arrays

### `DirectorRecommendedAction` (from `directorCtx.recommendedActions`)

| Field | Safe | Used by DONNA |
|---|---|---|
| `id` | ❌ (internal ID) | No |
| `label` | ✅ | Yes — action description |
| `reason` | ✅ | Yes — for single-action case |
| `href` | ✅ | Navigation (not shown in text) |
| `category` | ✅ | Not shown (routing hint only) |

### `DirectorAcademyRisk` (from `directorCtx.academyRisks`)

| Field | Safe | Used by DONNA |
|---|---|---|
| `signal` | ✅ | Not surfaced (overlaps with ranked priorities) |
| `detail` | ✅ | Not surfaced (overlaps with ranked priorities) |
| `urgency` | ✅ | Not surfaced |
| `actionHref` | ✅ | Not surfaced |

**Decision:** `academyRisks` deliberately omitted from DONNA answers. The ranked priorities from `donnaAttentionRankingEngine` already cover the same signals with richer context (why it matters, evidence, best action). Surfacing both would create redundancy without adding value.

## Helper Function

**`formatRecommendedActions(actions, limit = 3)`** in `directorDashboardDonnaAnswer.ts`:

| Case | Output format |
|---|---|
| 0 actions | `''` (empty — filtered by `.filter(Boolean)`) |
| 1 action | `"Recommended: [label] — [reason]."` |
| 2–3 actions | `"Recommended: [label1], [label2], [label3]."` |

The single-action case includes the reason for added context. Multi-action uses labels only to stay concise.

## Example `recommendedActions` Populating from directorCtx

```
pendingReviews=3 →
  { id:'review_pending', label:'Review 3 pending items', reason:'Coaches and players are waiting', href:'/director/review', category:'review' }

missingWrapUps=2 →
  { id:'chase_wrapups', label:'Follow up on 2 missing wrap-ups', reason:'Sessions without wrap-ups cannot feed player records', href:'/director/sessions', category:'investigate' }

highRiskPlayers=1 →
  { id:'check_at_risk', label:'Check 1 at-risk player', reason:'High-risk flags require director awareness', href:'/director/players', category:'investigate' }
```

## Updated Director Brief Format

```
Here's your academy status (ranked by urgency):

1. 2 missing coach wrap-ups from today
2. 1 player flagged high-risk
3. 3 items in the Review Queue

Evidence: 2 of today's 5 sessions have no coach wrap-up submitted.
Best next step: Open Sessions and follow up with coaches.
Recommended: Follow up on 2 missing wrap-ups, Check 1 at-risk player, Review 3 pending items.

Nothing is applied until you approve it.
```

The "Recommended:" line is:
- Placed after "Best next step" (for logical flow: understand what matters → what to do → specific action list)
- Omitted if `recommendedActions` is empty (`.filter(Boolean)`)
- Shows at most 3 actions (limit parameter)
