# Director Review Queue Observation Draft Panel QA
**Sprint:** 931 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. WrapUpObservationDraftDecisionControls — Request Clarification

| Check | Result |
|---|---|
| "Request clarification" button added | ✅ |
| Calls updateObservationDraftDecisionAction with 'clarification_needed' | ✅ |
| Uses same isPending guard as Approve/Reject | ✅ |
| Uses same result/error state as Approve/Reject | ✅ |
| Existing Approve behavior unchanged | ✅ |
| Existing Reject behavior unchanged | ✅ |
| Optional reviewer note textarea applies to all three decisions | ✅ |
| No change to Sprint 904 wrap-up draft controls | ✅ |

---

## 2. WrapUpObservationDraftCard — clarification_needed state

| Check | Result |
|---|---|
| Decision controls shown for pending_review | ✅ |
| Decision controls shown for clarification_needed | ✅ (Sprint 931 addition) |
| Decision controls hidden for approved (Apply controls shown instead) | ✅ |
| Decision controls hidden for rejected | ✅ |
| Card header status label shows human-friendly text for clarification_needed | ✅ ("needs clarification") |
| ApplyWrapUpObservationDraftControls unchanged | ✅ |

---

## 3. page.tsx — Player Notes section

| Check | Result |
|---|---|
| Section visible when clarification_needed items exist (even with no pending/approved) | ✅ |
| "Needs clarification" count badge shown in section header | ✅ |
| "Needs Clarification" sub-section renders clarificationNeededObservationDrafts | ✅ |
| "Needs Clarification" sub-section shows clarifying helper text | ✅ |
| "Pending Review" sub-heading shows when either approved or clarification items exist (not just approved) | ✅ |
| Approved sub-section unchanged | ✅ |
| Pending sub-section unchanged | ✅ |
| Rejected items NOT added to list | ✅ |
| clarificationNeededObservationDrafts variable was already computed (pre-existing query) | ✅ |

---

## 4. Sprint 904 protection

| Check | Result |
|---|---|
| updateWrapUpDraftDecisionAction not touched | ✅ |
| WrapUpDraftDecisionControls not touched | ✅ |
| WrapUpDraftCard not touched | ✅ |
| approveAndApplyWrapUpAction not touched | ✅ |
| applyWrapUpDraftAction not touched | ✅ |

---

## 5. Safety / protected systems

| Check | Result |
|---|---|
| No parent/player communication sent | ✅ — status update only |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| CoachWrapUpDrawer unchanged | ✅ |
| proposed_actions schema unchanged | ✅ — no migration |
| Raw IDs not shown in UI | ✅ |
| Raw DB status names not in UI | ✅ |
| No auto-approval | ✅ — explicit director action required |
| No auto-apply | ✅ — separate Apply button required |

---

## 6. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 7. Sprint compatibility

| Check | Result |
|---|---|
| Sprint 930 Coach Signals still compiles | ✅ (not touched) |
| Sprint 929 /coach/sessions status still compiles | ✅ (not touched) |
| Sprint 928 coach home status still compiles | ✅ (not touched) |
| Sprint 927 /wrap-up page still compiles | ✅ (not touched) |
