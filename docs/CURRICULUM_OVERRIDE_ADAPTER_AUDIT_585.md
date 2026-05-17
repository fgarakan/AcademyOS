# Curriculum Override Application Adapter Audit — Sprint 585

**Date:** 2026-05-17
**Sprint:** 585 — Curriculum Override Application Adapter Audit V1
**No curriculum mutation in this sprint. Audit only.**

---

## What Exists

### Curriculum Override Infrastructure

| File | Purpose | Status |
|---|---|---|
| `src/app/director/review/CurriculumOverrideDraftCard.tsx` | Review card | ✅ Built |
| `src/app/director/review/CurriculumOverrideDraftDecisionControls.tsx` | Approve/reject | ✅ Built |
| `src/app/director/review/ApplyCurriculumOverrideDraftControls.tsx` | Apply trigger | ✅ Built |
| `src/app/director/review/actions.ts::applyApprovedCurriculumOverrideDraftAction` | Apply action | ✅ Built |
| `src/app/director/curriculum/academy-version/CurriculumOverrideDiffCard.tsx` | Diff display | ✅ Built |
| `src/components/curriculum/CurriculumOverrideDraftShell.tsx` | Override creation shell | ✅ Built |
| `src/lib/actions/rollbackCurriculumOverride.ts` | Rollback action | ✅ Built |

---

## Key Architecture Finding

### What curriculum override writes vs what it does NOT write:

**Override WRITES (session-level):**
- Creates a `curriculum_overrides` record for a specific session or player-session
- Does NOT modify `template_blocks` — template is immutable
- Does NOT modify `curriculum_spine` — spine is immutable
- Override is a layer on top, not a mutation of the source

**Override does NOT write:**
- `program_templates` — immutable
- `template_blocks` — immutable
- `blocks` — immutable
- `curriculum_spine` — immutable

---

## Template Immutability Verification

The critical invariant: `template_blocks` and `session_blocks` are separate tables. Override only writes to the session-level layer. Templates remain unchanged.

---

## Apply Path

```
Director/coach identifies curriculum change needed
  → CurriculumOverrideDraftShell → proposed_actions (status: pending_review)
  → Director review queue (CurriculumOverrideDraftCard + Diff)
  → Director approves (CurriculumOverrideDraftDecisionControls)
  → Director clicks Apply (ApplyCurriculumOverrideDraftControls)
  → applyApprovedCurriculumOverrideDraftAction → curriculum_overrides table
  → Rollback available via rollbackCurriculumOverride
```

---

## Safety Status

| Rule | Status |
|---|---|
| Template blocks are NOT modified | ✅ Confirmed — override creates separate record |
| Director approval required | ✅ Confirmed |
| Rollback built | ✅ `rollbackCurriculumOverride.ts` exists |
| No parent sends | ✅ Override is internal |
| No level movement | ✅ Override ≠ level change |
| No player roster change | ✅ Override affects session, not roster |

---

## Gaps

| Gap | Severity | Resolution |
|---|---|---|
| Preview of override effects | LOW | Sprint 586 |
| Rollback preview before apply | MEDIUM | Sprint 587 |
| No guardrail for overriding past sessions | LOW | Future sprint |

---

## Conclusion

The curriculum override path is **safe**. Template immutability is correctly enforced. Rollback exists. Director approval required. **No migration needed.**
