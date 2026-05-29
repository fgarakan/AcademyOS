# DONNA Recommendation Learning Dashboard — Architecture
**Sprint:** 921 | **Date:** 2026-05-29

---

## 1. New Route

`/director/donna/learning` — director-only recommendation feedback summary page.

Accessible from `/director/donna` via "What DONNA is learning →" link.

---

## 2. Data Flow

```
/director/donna/learning
  → loadRecommendationFeedbackSummary(db, academyId)
      ├── donna_recommendation_feedback (aggregate counts by status)
      ├── donna_recommendations (top acted_on type)
      └── donna_recommendations (top dismissed type, last 30 days count)
  → formatLearningSignalsForDonna(summary) → DONNA-voice summary text
  → Page renders: stat cards, acceptance rate bar, signal patterns
```

---

## 3. V2 Gaps

1. **Trend over time** — only shows all-time totals; V2 should show weekly trend
2. **Per-type breakdown** — only top type shown; V2 shows full table
3. **Rejection pattern alert** — if same type rejected >5x, should surface as DONNA insight
4. **No automated learning** — this is a display-only panel; V2 would connect to recommendation weighting
