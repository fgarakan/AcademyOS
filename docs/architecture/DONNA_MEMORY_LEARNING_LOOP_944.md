# DONNA Memory + Learning Loop V1
**Date:** 2026-05-29
**Sprint:** 944
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaMemoryPolicy.ts` — memory categories, retention policies, learning loop feedback events, and safe memory helpers.

---

## Memory Policy Hierarchy

```
database   = source of truth (never overridden by memory)
memory     = pattern recognition and preference tracking
AI         = reasoning from context + memory
director   = final authority on all consequential decisions
```

## Memory Categories (5)

| Category | Retention | Influences Recs | Shown to User | Approval Required |
|---|---|---|---|---|
| `user_preference` | 90 days | yes | yes | no |
| `academy_operation` | 180 days | yes | yes | no |
| `coach_behavior` | 90 days | yes | no | no |
| `player_development` | 30 days | yes | no | **yes** |
| `recommendation_outcome` | 180 days | yes | yes | no |

## Core Rules (8)
1. Database is truth. Memory never overrides live data.
2. Memory improves suggestions — it does not make decisions.
3. All consequential actions still require explicit director approval.
4. Past acceptance does not mean auto-approval of future similar actions.
5. Sensitive player/parent data never retained.
6. Coach patterns are aggregate summaries, not performance reviews.
7. Director can request memory reset at any time.
8. Memory confidence degrades over time.

## Learning Loop Feedback Events

```
shown → accepted/completed (weight 0.8/1.0)
       edited (weight 0.5)
       dismissed (weight -0.3)
       ignored (weight -0.1)
```

## Existing Infrastructure (unchanged)

- `donnaRecommendationFeedback.ts` (Sprint 914.11) — logs recommendations and director feedback to DB.
- `donnaSemanticMemory.ts` (Sprint 915.2) — embedding-based memory (separate concern).

Sprint 944 adds the policy layer. The feedback collection is already wired via `donnaRecommendationFeedback.ts`. Future sprint can wire `getFeedbackWeight` into ranking to improve recommendation order over time.

---

## Next Sprint: 945 — Director Intelligence Brief

Use `pendingReviews`, `attendanceExceptions`, `playerProgressStallCount`, and `curriculumDraftCount` from `DirectorDonnaContext` to generate a COO-style top-3 priorities brief with highlight targets.
