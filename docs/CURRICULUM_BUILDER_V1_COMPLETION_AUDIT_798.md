# Sprint 798 — Curriculum Builder V1 Completion Audit V1

**Date:** 2026-05-18
**Sprint:** 798

---

## Curriculum Builder — V1 completion status

### Core loop readiness

| Capability | Status | Notes |
|-----------|--------|-------|
| View full curriculum map | ✅ Complete | `/director/curriculum/map` — all levels, sufficiency dots, stage grouping |
| View level detail (drills, gates, coaching language, fitness) | ✅ Complete | `CurriculumLevelDetailPanel` in all views |
| Guided step-through review | ✅ Complete | `/director/curriculum/guided` — mark reviewed, skip, jump |
| DONNA context per level | ✅ Complete | `DonnaCurriculumContextPanel` — drill/gate observation |
| Draft a drill via DONNA | ✅ UI shell | Text input → success state; DB wiring is V2 |
| Draft a gate via DONNA | ✅ UI shell | Text input → success state; DB wiring is V2 |
| Draft fitness content via DONNA | ✅ UI shell | Text input → success state; DB wiring is V2 |
| View change queue | ✅ Component ready | `CurriculumChangeQueue`; no live data query yet |
| Impact preview | ✅ Component ready | `CurriculumImpactPreviewPanel`; no live calculation yet |
| Safety / trust disclosure at every step | ✅ Complete | `DonnaSafetyDisclosure`, sufficiency labels, data disclosures |
| Empty states / setup states | ✅ Complete | `CurriculumSetupState`, `CurriculumLevelEmptyState`, per-panel fallbacks |
| Review Queue connection | ✅ Linked | "Open Review Queue →" links; draft copy all references Review Queue |

### Completeness score: **8/10**

Deductions:
- **−1**: DONNA drafts are UI shells — they collect input but do not write to `proposed_actions`. Directors see the success state but no item appears in the Review Queue.
- **−1**: `CurriculumChangeQueue` has no live DB feed. The component is ready but no page queries `proposed_actions` for curriculum items.

### What makes this 10/10 for V2

1. Wire `DonnaAddDrillDraft` / `DonnaAddAssessmentGateDraft` / `DonnaAddFitnessExerciseDraft` to a server action that inserts into `proposed_actions` with `assertNotPreviewMode()` guard.
2. Add a server-side query on the curriculum main page (or change queue page) for `proposed_actions WHERE action_type LIKE 'curriculum_%' ORDER BY created_at DESC LIMIT 20`.
3. Add a `?type=curriculum` filter to the existing review queue.

### Safety architecture — confirmed intact

- No DONNA action mutates curriculum data in V1
- `NEVER_AUTOMATIC` constant not touched
- No migrations in this block
- No schema changes
- `assertNotPreviewMode()` in place for all existing mutations
- Curriculum builder does not bypass RLS

### Pilot readiness verdict

**The Curriculum Builder is pilot-ready as a read + propose UI.** Directors can explore the full curriculum, understand what each level contains, ask DONNA to articulate a draft need, and understand the review workflow. The only V1 limitation is that drafts don't persist to the DB — which is the right call for a safe first pilot.
