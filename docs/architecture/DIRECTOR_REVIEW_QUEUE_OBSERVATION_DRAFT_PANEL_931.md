# Director Review Queue Observation Draft Panel — Architecture

**Sprint:** 931 | **Date:** 2026-05-29

---

## Summary

Sprint 931 completes the director review queue flow for `coach_observation_draft_v1` proposed_actions by adding "Request Clarification" as a third decision option alongside Approve/Reject, and surfacing clarification_needed items in the Player Notes section of the review queue list.

---

## Pre-existing implementation (before Sprint 931)

The core card and routing were already fully built:

| Component | Status before Sprint 931 |
|---|---|
| `WrapUpObservationDraftCard.tsx` | ✅ Purpose-built card with player name, type badge, note, safety language |
| `WrapUpObservationDraftDecisionControls.tsx` | ⚠️ Approve + Reject only — no Request Clarification |
| `ApplyWrapUpObservationDraftControls.tsx` | ✅ Apply button with full change summary |
| `[actionId]/page.tsx` detail view | ✅ Fully routes and renders `coach_observation_draft_v1` |
| `ReviewItemRouter.tsx` | ✅ Routes `type: 'observation'` → `WrapUpObservationDraftCard` |
| `page.tsx` — fetch + enrich | ✅ Queries all statuses; populates player + proposer names |
| `page.tsx` — render clarification_needed | ⚠️ Items were fetched + counted but not rendered in list |

---

## Files changed in Sprint 931

| File | Change |
|---|---|
| `WrapUpObservationDraftDecisionControls.tsx` | Added "Request clarification" button; calls `updateObservationDraftDecisionAction` with `'clarification_needed'` |
| `WrapUpObservationDraftCard.tsx` | Decision controls now shown for `pending_review` OR `clarification_needed` status |
| `page.tsx` | "Player Notes" section condition expanded to include `clarificationNeededObservationDrafts`; "Needs Clarification" sub-section added |

---

## Decision flow

```
Coach submits observation draft
    ↓ status: pending_review
Director sees in Player Notes section
    ↓ Options:
    ├── Approve → status: approved → ApplyWrapUpObservationDraftControls shown
    │     ↓ Apply → writes to coach_observations table → status: executed
    ├── Reject → status: rejected → hidden from main list (no further action)
    └── Request Clarification → status: clarification_needed
          ↓ Shown in "Needs Clarification" sub-section
          ↓ Decision controls re-shown (approve or reject after offline discussion)
```

---

## Server action used

`updateObservationDraftDecisionAction` (existing, from `actions.ts`):
- Already supports all three decisions: `'approved'`, `'rejected'`, `'clarification_needed'`
- Writes `status`, `approved_by_id` / `rejected_by_id`, `reviewer_notes` to `proposed_actions`
- Sprint 931 just exposes `'clarification_needed'` in the UI — no changes to the action itself

---

## Sprint 904 protection

`updateWrapUpDraftDecisionAction` (session wrap-up approve/reject) is completely untouched. Sprint 931 only modifies:
- `WrapUpObservationDraftDecisionControls` (observation drafts, not session wrap-up drafts)
- The observation draft rendering in the "Player Updates" tab of the review queue

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — decision marks status only |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ — not touched |
| `updateWrapUpDraftDecisionAction` unchanged | ✅ — not touched |
| Rejected items remain hidden from main list | ✅ — consistent with other sections |
| Raw IDs not shown in UI | ✅ |
| Raw DB status names not in UI | ✅ (card header uses human labels) |
| Apply action unchanged | ✅ — `ApplyWrapUpObservationDraftControls` not touched |

---

## Known limitations (V2)

- When a director requests clarification, the coach currently has no dedicated "respond to clarification" flow on their end — they see "Director has questions" on the Coach Signals section (Sprint 930). Resolution is expected to happen via offline conversation, after which the director re-reviews and approves/rejects.
- Rejected items are hidden from the main list (consistent with all other review queue sections). Directors can still find rejected items via the "Completed" tab.
