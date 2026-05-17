# Coach Observation Application Adapter Audit — Sprint 574

**Date:** 2026-05-17
**Sprint:** 574 — Coach Observation Application Adapter Audit V1
**No writes in this sprint. Audit only.**

---

## What Exists

### Existing Infrastructure

| File | Purpose | Status |
|---|---|---|
| `src/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction.ts` | Saves observation draft to `proposed_actions` | ✅ Built |
| `src/app/director/review/ApplyWrapUpObservationDraftControls.tsx` | UI trigger for apply | ✅ Built |
| `src/app/director/review/actions.ts::applyApprovedObservationDraftAction` | Applies observation to player profile | ✅ Built |
| `src/app/director/review/WrapUpObservationDraftCard.tsx` | Review card | ✅ Built |
| `src/app/director/review/WrapUpObservationDraftDecisionControls.tsx` | Approve/reject controls | ✅ Built |
| `src/components/review/CoachObservationApplicationPreview.tsx` | Preview component | ✅ Built |
| `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` | Player profile observation feed | ✅ Built |
| `src/components/capture/WrapUpPlayerObservationInput.tsx` | Coach input UI | ✅ Built |

---

## Apply Path Analysis

### Current path:
```
Coach submits observation in wrap-up
  → saveWrapUpObservationsAction → proposed_actions (status: pending_review)
  → Director review queue (WrapUpObservationDraftCard)
  → Director approves (WrapUpObservationDraftDecisionControls) → status: approved
  → Director clicks Apply (ApplyWrapUpObservationDraftControls)
  → applyApprovedObservationDraftAction → coach_observations table
  → Player profile CoachObservationsFeed updated
```

### Safety evaluation:
| Step | Safe? | Notes |
|---|---|---|
| Draft saved to proposed_actions | ✅ | No immediate write to official records |
| Director approval required | ✅ | No auto-approve |
| Director must click Apply | ✅ | Two steps: approve → apply |
| Writes to coach_observations | ✅ | Internal table, not directly player/parent visible |
| Parent-visible flag | ✅ | Separate flag; observations are internal by default |
| No level movement | ✅ | Observation ≠ level change |
| No parent send | ✅ | Observation write does not trigger comms |

---

## Key Safety Finding

Coach observations write to `coach_observations` which is **internal only**. Parent visibility requires a separate parent update draft creation — it is not automatic. This is the correct architecture.

---

## Gaps Found

| Gap | Severity | Resolution |
|---|---|---|
| Preview component exists but may not be wired to review card | LOW | Wire in future sprint |
| No explicit guardrail for raw/internal notes becoming parent-visible | MEDIUM | Sprint 577 |
| `apply_status` field update after apply needs verification | LOW | Sprint 573-era pattern |

---

## Conclusion

The observation draft → player profile note path is **already built and safe**. The pipeline is complete. Key protection: observations are internal until explicitly published. No external sends triggered by apply.

**No migration needed. No code changes in this sprint.**
