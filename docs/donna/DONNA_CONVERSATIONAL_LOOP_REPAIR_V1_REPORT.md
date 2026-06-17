# DONNA Conversational Loop Repair V1 Report

**Sprint:** Mega Sprint 2951–2960  
**Date:** 2026-06-17  
**Status:** CERTIFIED — 56/56 assertions (100%)

---

## Root Cause

Mega Sprint 2921–2950 wired the certified NLU stack (Step 15.5) into the DONNA brain and declared `conversationNavigatorStateRef` in `DonnaAssistantButton.tsx`. However, the `respond` switch case never wrote `brainResult.updatedNavigatorState` back to that ref. Every turn received `null` as the inbound navigator state, so the arc could never advance past the first turn.

Secondary causes discovered during repair:
- `donnaAcknowledgmentHandler.ts` referenced `parent_concern_signal` as a key in `Partial<Record<AcademyOSConcept, string>>` — not a valid `AcademyOSConcept` value.
- `donnaCompletionDetector.ts` had a `case 'parent_concern_signal':` in a switch typed on `AcademyOSConcept | null` — not a valid value.
- The meaning path in `processDonnaMessage.ts` never set `donnaQuestionAsked: true`, so `clarificationCount` never incremented and the 'question' → 'understanding' stage gate never fired on second turns.

---

## Audit Findings Addressed

| Finding | Status |
|---|---|
| Navigator state not persisted across turns | Fixed |
| `parent_concern_signal` TypeScript error in acknowledgment handler | Fixed |
| `parent_concern_signal` TypeScript error in completion detector | Fixed |
| Second-turn input stuck at 'question' stage (clarificationCount always 0) | Fixed |
| Acknowledgment intercept not wired into `processDonnaMessage.ts` | Fixed |
| Completion intercept not wired into `processDonnaMessage.ts` | Fixed |
| `donnaAcknowledgmentHandler.ts` and `donnaCompletionDetector.ts` untracked/uncommitted | Added to sprint |

---

## Files Modified

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Persist `brainResult.updatedNavigatorState` to `conversationNavigatorStateRef.current` in `respond` case |
| `src/lib/donna/brain/processDonnaMessage.ts` | Import acknowledgment + completion handlers; add acknowledgment intercept; add completion intercept; fix `inboundNavState` to treat completed arcs as null; set `donnaQuestionAsked: true` in ack intercept and second-turn meaning path; import `AcademyOSConcept` and `ConversationStage` types |
| `src/lib/donna/conversation/donnaAcknowledgmentHandler.ts` | Remove `parent_concern_signal` from `CONCEPT_LABELS` (not a valid `AcademyOSConcept`) |
| `src/lib/donna/conversation/donnaCompletionDetector.ts` | Remove `case 'parent_concern_signal':` from `getNextPriority` switch |
| `src/lib/donna/conversation/donnaMeaningExtractor.ts` | Added "seems weird" / "feels weird" phrase patterns to `enrollment_issue`; added "seems weird" to `grouping_issue` |
| `docs/CHANGELOG.md` | Added entry for Mega Sprint 2951–2960 |

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/donna/conversation/donnaAcknowledgmentHandler.ts` | Detects short ack phrases; builds stage-aware continuation response; does not restart arc |
| `src/lib/donna/conversation/donnaCompletionDetector.ts` | Detects explicit completion signals; builds two-part response (confirmation + next priority); captures learning |
| `src/lib/donna/conversation/conversationalLoopRepairCertification.ts` | 56-assertion certification harness for all repair behaviors |
| `docs/donna/DONNA_CONVERSATIONAL_LOOP_REPAIR_V1_REPORT.md` | This report |

---

## Before Behavior

- Every DONNA turn received `conversationNavigatorState: null` because the ref was never written.
- "Okay." → restarted concept extraction from scratch, potentially asking a new clarification question.
- "Done." → no completion handling; fell through to COO prompt chain.
- "Orange Ball seems weird" → matched patterns but arc could never advance past turn 1.
- `npx tsc --noEmit` would fail if the files with `parent_concern_signal` were compiled.

---

## After Behavior

- The `respond` case in `DonnaAssistantButton.tsx` writes `brainResult.updatedNavigatorState` to `conversationNavigatorStateRef.current` on every turn where Step 15.5 fires.
- The next turn receives the active state and can advance (understanding → action → completion).
- Completed arcs are treated as null on the next input — the next statement starts a fresh arc.

---

## State Persistence Repair

**Location:** `DonnaAssistantButton.tsx` — `respond` case, after entity goal memory save.

```typescript
// Mega Sprint 2951–2960 — persist navigator state across turns for conversational continuity.
if (brainResult.updatedNavigatorState !== null) {
  conversationNavigatorStateRef.current = brainResult.updatedNavigatorState
}
```

This was the primary bug fix. All other behaviors depended on this.

---

## Acknowledgment Handling

**Handler:** `donnaAcknowledgmentHandler.ts`  
**Intercept location:** `processDonnaMessage.ts` Step 15.5, before clarification path.

When `isAcknowledgmentPhrase(lower)` is true and an active arc exists:
1. `buildAcknowledgmentContinuationResponse(state)` selects a stage-aware response.
2. `advanceConversation` is called with `donnaQuestionAsked: true` so the clarificationCount increments and the 'question' → 'understanding' gate fires.
3. The arc concept and entity are retained — interpretation is not restarted.

Phrase list: okay, ok, got it, understood, noted, alright, sounds good, sure, makes sense, right, yes, yep, yup, cool, thanks, thank you, great, perfect, good, fine.

---

## Completion Handling

**Handler:** `donnaCompletionDetector.ts`  
**Intercept location:** `processDonnaMessage.ts` Step 15.5, after acknowledgment intercept.

When `isCompletionPhrase(lower)` is true and an active arc exists:
1. `buildCompletionResponse(state)` generates a confirmation + next-priority suggestion.
2. `advanceConversation` is called with `hasDraftOutput: true` to force the 'completion' stage.
3. Learning is captured via `captureConversationLearning` → `bridgeConversationRecord` → `donnaLearningLedger.addEntry`.
4. The `navigateTo` field is set if the next-priority suggestion has a route.

Phrase list: done, finished, handled, completed, resolved, sorted, that's done, it's done, all done, we're done, done with that, took care of it, took care of that, all set, it's handled, that's handled, taken care of.

---

## Concept Extraction Repair

**File:** `donnaMeaningExtractor.ts`

Added to `grouping_issue`:
- `"seems weird"` (weight 0.55)

Added to `enrollment_issue`:
- `"seems weird"` (weight 0.60)
- `"feels weird"` (weight 0.55)

Result: "Orange Ball seems weird" → `topConcept: enrollment_issue`, `topConfidence: 0.60`.

---

## Director Follow-Up Repair

"Practice felt flat" → `engagement_issue` (weight 0.75 via "flat"). Since confidence >= 0.75, the clarification question threshold is not reached. The navigator immediately transitions from 'question' to 'understanding' and returns: "Engagement gap identified. Let me frame the options." — appropriate for a director observing a session pattern.

---

## Learning Verification

Completion intercept explicitly calls `captureConversationLearning` with:
- `originalStatement` from first turn in nav history
- `completedSuccessfully: true`
- `stagesVisited` built from nav history + 'completion'

Record lands in `pendingLearningStore` with `status: 'pending_review'`. Verified by section 7 of certification (LC-7a, LC-7b, LC-7c).

---

## Certification Results

**File:** `src/lib/donna/conversation/conversationalLoopRepairCertification.ts`  
**Run:** `npx tsx src/lib/donna/conversation/conversationalLoopRepairCertification.ts`

```
56/56 assertions passed
Result: 100% — ✓ CERTIFIED
```

Sections:
1. Navigator state is written after turn — 3/3 ✓
2. State persists across turns — 3/3 ✓
3. Clarification advances stage — 2/2 ✓
4. Acknowledgment handling — 5/5 ✓
5. Completion handling — 4/4 ✓
6. Repeated clarification does not re-ask — 1/1 ✓
7. Learning capture fires on completion — 3/3 ✓
8. "Orange Ball seems weird" extraction — 4/4 ✓
9. "Practice felt flat" follow-up — 4/4 ✓
10. "Okay" does not restart the loop — 6/6 ✓
11. "Done" completes the loop — 7/7 ✓
12. End-to-end 4-turn sequence — 14/14 ✓

---

## Remaining Gaps

| Gap | Notes |
|---|---|
| Navigator state not cleared on non-conversational actions | If the director navigates or opens the review queue mid-arc, the arc state lingers in the ref until a `respond` turn clears it. Low risk but cosmetically impure. |
| `donnaQuestionAsked: true` in meaning path is a heuristic | Treating "the director responded to any prior DONNA output at 'question' stage" as "clarification asked" is correct in practice but is not an explicit signal from DONNA. |
| Entity extraction for group names | "Orange Ball" is not currently extracted as an entity by `donnaIntentInterpreter` in the NLU path. The enrollment concern is captured; the specific group is not named in the navigator state. |
| Completion intercept does not confirm entity by name | The completion response uses the concept label, not the entity name. If "parents in Orange Ball seem frustrated", the completion says "parent concern handled" not "Orange Ball parent concern handled". |

---

## Recommended Next Sprint

**Mega Sprint 2961–2970 — DONNA Conversational Arc Entity Extraction V1**

Wire entity extraction into the navigator state so named entities (group names, player names, coach names) are captured and reflected in acknowledgment + completion responses. Connect "Orange Ball" → `extractedEntity: 'Orange Ball'` so the navigator state carries the specific target. Clear the navigator ref on non-conversational actions (`fetch_attention`, `navigate`, etc.) to prevent arc carryover.
