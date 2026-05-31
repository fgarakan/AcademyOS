# Director Golden Path UX Simplification — Sprint 1026

**Date:** 2026-05-31
**Sprint:** 1026
**Status:** Specification complete — page refactor deferred to future sprint

---

## Current state

The director page has multiple competing attention surfaces:
- `DirectorTodayCommandCenter` (Sprint 767) — attention queue + today signals
- `DonnaDashboardOpenCard` (Sprint 804) — DONNA entry with alert count
- Today's Pulse grid (Sprint 813) — review queue + player attention + sessions tiles

These were built incrementally and all show "what needs attention." The audit (Sprint 1023) identified this as the critical `primary_action_focus` finding.

---

## Golden path score: 60/100

| Step | Unblocked? |
|---|---|
| Open dashboard — understand primary action in 3s | ❌ competing surfaces |
| Act on review queue | ✅ |
| Ask DONNA — get grounded answer | ❌ panel still has legacy paths visible |
| Review players | ✅ |
| Check curriculum | ✅ |

---

## Target state (Phase 2)

Replace DirectorTodayCommandCenter + DonnaDashboardOpenCard with `DirectorPrimaryActionHero` (Sprint 1024) as the single primary action surface:

```
/director page (simplified):
  ├── DirectorPrimaryActionHero  ← Sprint 1024 (one CTA, one message)
  ├── Today's Pulse grid         ← Sprint 813 (keep — good 3-number summary)
  ├── AcademyKpiCardsSection     ← keep
  └── [DONNA panel always accessible via floating button]
```

Remove: `DirectorTodayCommandCenter`, `DonnaDashboardOpenCard`

---

## Why not wire now?

Replacing `DirectorTodayCommandCenter` and `DonnaDashboardOpenCard` without visual testing on the full page would risk:
- Breaking the existing attention surface before the new one is validated
- Losing the attention queue detail that coaches rely on during the transition

The Phase 2 sprint should:
1. Start a dev server and visually confirm the redesigned layout
2. Do a side-by-side comparison before removing existing components
3. Get director feedback on the "one primary action" simplification

---

## Component readiness

| Component | Sprint | Ready to wire? |
|---|---|---|
| DirectorPrimaryActionHero | 1024 | Needs page refactor (remove competing components) |
| DonnaPanelResponseRenderer | 1025 | Needs visual test (no functional blockers) |
