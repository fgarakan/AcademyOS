# Entity Summary Auto-Population — Architecture
**Sprint:** 925 | **Date:** 2026-05-29

---

## 1. What Changed

Added `donnaEntitySummaryPopulator.ts` with deterministic summary generators and trigger functions.

Wired triggers to two existing server actions:
- `saveWrapUpObservationsAction.ts` → player summary after observation draft created
- `saveWrapUpDraftAction.ts` → group summary after wrap-up submitted

All triggers are fire-and-forget (`void ... .catch(() => {})`). Main workflow is never blocked.

---

## 2. Population Flow

```
Coach submits wrap-up observations
  → saveWrapUpObservationsAction (creates observation drafts)
  → triggerEntitySummaryAfterObservation [Sprint 925, fire-and-forget]
      → upsertPlayerEntitySummary
          → upsertEntitySummary (donna_entity_summaries)

Coach submits wrap-up draft
  → saveWrapUpDraftAction (creates session actual draft)
  → triggerEntitySummaryAfterWrapUp [Sprint 925, fire-and-forget]
      → upsertGroupEntitySummary
          → upsertEntitySummary (donna_entity_summaries)
```

---

## 3. Summary Text Safety

No raw notes, no raw IDs, no sensitive content in summaryText:
- Player: `{name}. Level: {level}. {N} observations. {M} priorities.`
- Group: `Group: {name}. {N} players. {M} sessions. {P}% wrap-up coverage.`
- Level: `Level: {name}. {N} players. {M} templates. {gaps or no gaps}.`

---

## 4. V2 Gaps

1. Priority update trigger — not yet wired to the priority apply action
2. Curriculum draft approved/rejected trigger — not yet wired
3. Curriculum level summaries — no auto-trigger yet; must be called manually
4. Observation count per player — current trigger passes only the date, not historical count (would require extra DB query on hot path)
