# DONNA Director Brief 10/10 QA
**Sprint:** 922 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Brief Panel Data Sources

| Signal | Source | Safe? |
|---|---|---|
| High-risk players | `PlayerAttentionRiskResult.players` | ✅ Name only, no raw notes |
| High-urgency flags | `CommandBriefData.attentionFlags` | ✅ Urgency type, no raw content |
| Pending review count | `CommandBriefData.itemsPendingDirectorReview` | ✅ Count only |
| Outstanding wrap-ups | `CommandBriefData.wrapUpsOutstanding` | ✅ Count only |
| Approved awaiting apply | `CommandBriefData.itemsApprovedAwaitingExecution` | ✅ Count only |

---

## 2. Priority Ordering

Items sorted: high → medium → low urgency. Top item labeled "Do this first."

---

## 3. Safety Checks

| Check | Result |
|---|---|
| Raw player IDs shown? | No — labels and names only |
| Mutations triggered by brief? | No — all items are links to review/players pages |
| Auto-approve triggered? | No — all approved items require director click to apply |
| "Why this matters" copy added? | Yes — every item has a contextual explanation |

---

## 4. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```
