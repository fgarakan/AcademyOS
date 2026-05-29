# DONNA Recommendation Learning Dashboard QA
**Sprint:** 921 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Data Displayed

| Metric | Source | Safe? |
|---|---|---|
| Accepted count | `donna_recommendation_feedback.feedback_status='accepted'` | ✅ Aggregate only |
| Rejected count | `feedback_status='rejected'` | ✅ Aggregate only |
| Deferred count | `feedback_status='deferred'` | ✅ Aggregate only |
| Total count | All feedback rows | ✅ Aggregate only |
| Acceptance rate | accepted/total | ✅ Derived percentage |
| Top acted-on type | `donna_recommendations.status='acted_on'` | ✅ Type label, not content |
| Top dismissed type | `donna_recommendations.status='dismissed'` | ✅ Type label, not content |
| Recent 30-day count | Date-filtered feedback count | ✅ Count only |

---

## 2. Safety Checks

| Check | Result |
|---|---|
| Raw recommendation text shown? | No — only aggregate counts and type labels |
| Individual recommendation IDs shown? | No |
| Director feedback reasons shown? | No |
| Automated model tuning triggered? | No — display only |
| RLS-scoped to academy? | Yes — all queries filter by `academy_id` |

---

## 3. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```
