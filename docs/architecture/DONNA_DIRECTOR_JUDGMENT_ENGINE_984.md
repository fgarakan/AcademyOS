# DONNA Director Judgment Engine V1 — Sprint 984

**Date:** 2026-05-30
**Sprint:** 984
**Status:** Implemented — TypeScript clean

---

## Purpose

Sprint 984 creates the judgment layer above `directorNextActionEngine`. While the next-action engine applies simple priority rules, the judgment engine produces a confidence-scored ranked list of director priorities by combining:

1. Live signals (pending reviews, missing recaps, placement)
2. Page context
3. Feedback preferences (from Sprint 983 feedback loop)
4. Time signals (staleness)

---

## Key API

```typescript
const judgment = judgeDirectorPriorities(signals)
judgment.topAction     // { action, confidence, rationale, isUrgent }
judgment.rankedActions // top 3 ranked actions
judgment.reasoning     // summary explanation
judgment.urgencyLevel  // 'low' | 'medium' | 'high' | 'critical'
```

---

## Urgency Scoring

| Signal | Score Weight |
|---|---|
| 10+ pending reviews | +40 |
| 5-9 pending reviews | +30 |
| 1-4 pending reviews | +20 |
| Missing recaps | +15 |
| Players needing placement | +10 |
| Advancement-eligible players | +8 |
| 60+ min since last action | +5 |

Score → urgencyLevel: 70+ = critical, 40+ = high, 15+ = medium, else = low

---

## Feedback Integration

Feedback scores from Sprint 983 apply a ±boost to recommendation confidence:
- Accepted recommendations get higher confidence scores
- Dismissed recommendations get lower confidence scores (score × 3 multiplier)

---

## No-Mutation / No-Migration Guarantee

- No DB calls
- No schema changes
- No proposed_actions created
