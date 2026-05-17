# Coach Wrap-Up to Approved Action Flow — Sprint 603

**Date:** 2026-05-17
**Sprint:** 603 — Coach Wrap-Up to Approved Action Flow V1
**No code mutation in this sprint. Flow documentation only.**

---

## Purpose

Maps the full path from a coach completing a DONNA-guided wrap-up conversation to an approved proposed action.

---

## Full Flow

```
Coach completes session
  → DonnaConversationalPanel (state: complete)
  → DonnaConversationSummary (shows answered/skipped/no-response)
  → Coach confirms wrap-up
  → buildDraftFromConversation(messages, sessionId) [wrapUpDraftAdapter.ts]
  → WrapUpAnswerSet draft built

  → Coach submits
  → saveWrapUpDraftAction(sessionId, draft)
    → Auth check (coach role verified)
    → Academy ID resolved from profile (never trusts client)
    → voice_commands record created (input_method: 'typed', processing_status: 'processed')
    → proposed_actions record created
        { action_type: 'other', target_module: 'session_wrap_up_v1', target_object_id: sessionId }
        { status: 'pending_review' }
    → session_actuals record created (draft-only fields)

  → Director review queue (proposed_actions WHERE status = 'pending_review')
  → Director opens review card
  → Director approves → status = 'approved'
  → Director clicks Apply
  → applyApprovedSessionActualAction (or equivalent)
    → execute_approved_action() — ONLY function that executes
    → status = 'applied'
    → audit_logs entry written
```

---

## Key Files

| File | Role |
|---|---|
| `src/components/donna/DonnaConversationalPanel.tsx` | Conversation state machine shell |
| `src/components/donna/DonnaConversationSummary.tsx` | Review before submit |
| `src/lib/donna/wrapUpDraftAdapter.ts` | `buildDraftFromConversation()` |
| `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` | Server action — writes voice_commands + proposed_actions |
| `src/app/director/review/page.tsx` | Director review queue |
| `src/app/director/review/actions.ts` | Approve/reject/apply logic |

---

## Safety Invariants Confirmed

| Rule | Status |
|---|---|
| Wrap-up does NOT auto-apply | ✅ `status: 'pending_review'` — director approval required |
| Voice conversation does NOT write directly | ✅ Draft adapter builds WrapUpAnswerSet first |
| No parent message sent | ✅ Not part of wrap-up flow |
| No level movement | ✅ Wrap-up can flag readiness but cannot call `finalize_player_placement()` |
| Auth checked at server action layer | ✅ Confirmed in saveWrapUpDraftAction |
| Academy ID never trusted from client | ✅ Resolved from authenticated profile |

---

## DONNA Conversation → Proposed Action Flow (Simplified)

```
DONNA asks → Coach answers → Adapter builds draft → Server action creates proposed_action
→ Director approves → execute_approved_action() → applied
```

---

## Conclusion

The coach wrap-up flow is correctly implemented. DONNA guides conversation → adapter converts to structured draft → server action creates proposed_action → director approves → system applies. No shortcuts. No auto-execution.
