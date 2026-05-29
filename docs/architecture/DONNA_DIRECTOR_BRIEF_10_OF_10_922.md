# DONNA Director Brief 10/10 — Architecture
**Sprint:** 922 | **Date:** 2026-05-29

---

## 1. What Changed

Added `DonnaTodayBriefPanel` to `/director/today` right column, above the existing DONNA Command Brief.

The panel uses data already loaded by the Today page:
- `commandBriefResult` (from `loadCommandBriefLive`)
- `attentionRisk` (from `loadPlayerAttentionRisk`)

No additional DB calls. No new data dependencies.

---

## 2. Brief Item Priority Logic

1. High-risk players → high urgency → "Do this first"
2. High-urgency attention flags → high urgency
3. Pending review items → high (≥5) or medium (<5)
4. Missing wrap-ups → medium (>50% sessions) or low
5. Approved awaiting execution → medium
6. Medium-risk players (capped at position 4)

---

## 3. Component Tree

```
/director/today (Server Component)
  → DonnaTodayBriefPanel (Server Component)
      ← CommandBriefLiveResult (already loaded)
      ← PlayerAttentionRiskResult (already loaded)
      → buildBriefItems() → BriefItem[] (deterministic)
      → 0–4 priority rows with "why it matters" copy
```

---

## 4. V2 Gaps

1. Insights from `donnaInsightEngine` not yet wired to Today page (requires `DirectorDonnaContext`)
2. Historical context (how many days have these flags been present) not yet available
3. "Resolved today" tracking not yet built
