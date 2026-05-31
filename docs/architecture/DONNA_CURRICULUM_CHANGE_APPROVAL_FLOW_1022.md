# Director Curriculum Change Approval Flow — Sprint 1022

**Date:** 2026-05-31
**Sprint:** 1022
**Status:** Complete

---

## What was built

Sprint 1022 closes the curriculum suggestion loop (1019-1021) by building the approval routing response. DONNA suggests → previews impact → routes to Review Queue.

**This module does NOT create `proposed_action` DB records.**
The actual DB write happens after director confirmation in the Review Queue (Sprint 904 pipeline).

---

## Safety architecture

```
DONNA suggests (1019-1020)
  → Impact preview shown (1021)
  → Director sees "route to Review Queue" button (1022)
    → Director clicks → routed to /director/review
      → Director explicitly approves in Review Queue (Sprint 904)
        → System executes (execute_approved_action)
```

Nothing executes without director action at the Review Queue step.

---

## `buildCurriculumApprovalOutput(proposal, preview, context)`

Returns `OrchestratorOutput`:
- `type: 'draft_proposed_action'`
- `safetyLevel: 'approval_gated'`
- `requiresConfirmation: true`
- `suggestedRoute: '/director/review'`
- `highlightTarget: { targetId: 'review-queue-primary', route: '/director/review' }`
- `text` includes formatted impact preview + "nothing changes until you approve" note

---

## `CurriculumChangeRoutingResult`

Literal-typed result struct:
- `routedToReviewQueue: true` — always (literal, not boolean)
- `autoApplied: false` — always (literal, not boolean)

These literal types enforce the safety invariant at compile time.

---

## `auditCurriculumChangeRouting(result)`

5-check safety audit:
1. `autoApplied === false`
2. `safetyLevel === 'approval_gated'`
3. `requiresConfirmation === true`
4. `suggestedRoute === '/director/review'`
5. `proposal.safetyLevel === 'review_only'`

Any violation returns an error string. All checks pass → returns null.

---

## Integration with DonnaResponseCard (Sprint 1008)

The `OrchestratorOutput` returned by this module renders through `DonnaResponseCard`:
- Approval gate warning block shown (`isApprovalGated === true`)
- "Go to Review Queue" button shown (`suggestedRoute` present)
- `onNavigate` callback routes director to `/director/review`
