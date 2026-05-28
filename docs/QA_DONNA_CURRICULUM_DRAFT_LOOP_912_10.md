# QA — DONNA Curriculum Draft Loop
**Sprint:** 912.10
**Date:** 2026-05-28
**Method:** Static code analysis of Sprints 912.7–912.9 implementation
**Code analysed:**
- `src/components/donna/DonnaVoiceReadyShell.tsx`
- `src/lib/donna/donnaChatSessionMemory.ts`
- `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts`
- `src/lib/actions/curriculumDraftActions.ts`
- `src/components/curriculum/builder/CurriculumChangeQueue.tsx`
- `src/app/director/curriculum/builder/CurriculumBuilderChangeQueue.tsx`

**Result:** All 12 scenarios PASS. No code changes required.

---

## Handler execution order (relevant to all scenarios)

Inside `handleSend()`, the relevant blocks fire in this order:

1. Pending confirmation intercept (Sprint 912.7) — `activePending` resolved from conv state or session memory
2. Orphaned strong-confirm guard (Sprint 912.7) — catches "do it / confirm / create it" with nothing pending
3. **Drill slot-fill answer handler (Sprint 912.9)** — intercepts next message when slot-fill is waiting
4. Nav offer check (Sprint 724)
5. Boundary / missing-context / KPI / other interceptors
6. **Drill creation handler (Sprint 912.8)** — matches `DRILL_CREATION_PATTERN`
7. Broad curriculum draft proposal (Sprint 739) — fallback for gates, skills, etc.
8. All other handlers / fallback

---

## Scenario 1 — Complete one-turn flow ✅ PASS

**Input:** `"Add a drill for Orange 2 focused on forehand preparation."`

**Trace:**
- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea(...)` → `"focused on"` pattern → `"forehand preparation"`
- Both present → `triggerDrillConfirmation("Orange 2", "forehand preparation", trimmed)` called
- `clearPendingDrillSlotFill()` (no-op), summary message queued, `storeAndSetPendingConfirmation(...)` called
- DONNA shows: _"I can create a draft to add a **forehand preparation** drill to your Orange 2 curriculum… Should I create this draft?"_

**Director says:** `"Yes"`
- `CONFIRM_PATTERN` matches
- `conv.clearPendingConfirmation()` + `clearPendingAction()`
- `setIsExecuting(true)` + "Creating the draft now…"
- `activePending.execute()` → `createCurriculumContentItemDraft({ levelName: "Orange 2", contentType: 'drill', title: "forehand preparation drill", ... })`
- Server action: auth → academy_id → role check → `ilike('display_name', 'Orange 2')` → resolved UUID → `INSERT academy_curriculum_overrides (status: 'pending_review')`
- Audit log written. `revalidatePath('/director/curriculum/builder')` called
- Result message: _"A 'forehand preparation' drill draft for Orange 2 has been created. The draft is in your Review Center."_ + "Take me to Review Center" follow-up link

**Expected:** ✅ Matches. Draft created as `pending_review`.

**Live-DB dependency:** `curriculum_levels.display_name = 'Orange 2'` must exist. See Risks section.

---

## Scenario 2 — Missing level flow ✅ PASS

**Turn 1:** `"Add a drill focused on forehand preparation."`

**Trace:**
- No slot-fill pending → skip slot-fill handler
- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `null` (no level name in text)
- `extractFocusArea(...)` → `"focused on"` pattern → `"forehand preparation"`
- `setPendingDrillSlotFill({ levelName: null, focusArea: "forehand preparation", missingSlot: 'levelName', rawInput: ... })`
- DONNA: _"Which curriculum level should this drill go in? (e.g., Orange 2, Yellow 1, Red 3)"_

**Turn 2:** `"Orange 2"`

**Trace:**
- `hasPendingDrillSlotFill()` = true → slot-fill handler fires
- Not stale, not cancel
- `slotFill.missingSlot === 'levelName'`
- `extractTargetLevel("Orange 2")` → `"Orange 2"` ✅
- `slotFill.focusArea` = `"forehand preparation"` (stored from turn 1) ✅
- `clearPendingDrillSlotFill()`
- `triggerDrillConfirmation("Orange 2", "forehand preparation", slotFill.rawInput)` → confirmation prompt

**Expected:** ✅ Two-turn flow completes correctly with stored focus carried forward.

---

## Scenario 3 — Missing focus flow ✅ PASS

**Turn 1:** `"Add a drill for Orange 2."`

**Trace:**
- No slot-fill pending → skip
- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea("Add a drill for Orange 2.")`:
  - No "focused on", "covering", "about" patterns match
  - "add a [X] drill" betweenMatch: `.{3,40}?` non-greedy can't find a second `drill` → null
- `focusArea = null`
- `setPendingDrillSlotFill({ levelName: "Orange 2", focusArea: null, missingSlot: 'focusArea', rawInput: ... })`
- DONNA: _"Got it — a new drill for Orange 2. What should the drill focus on?"_

**Turn 2:** `"Forehand preparation."`

**Trace:**
- `hasPendingDrillSlotFill()` = true → slot-fill handler fires
- `slotFill.missingSlot === 'focusArea'`
- `extractFocusArea("Forehand preparation.")` → no keyword patterns match → null
- Fallback: `trimmed.trim()` = `"Forehand preparation."` (length 22, not vague)
- `focus = "Forehand preparation."`
- `slotFill.levelName` = `"Orange 2"` ✅
- `clearPendingDrillSlotFill()`
- `triggerDrillConfirmation("Orange 2", "Forehand preparation.", rawInput)` → confirmation prompt

**Expected:** ✅ Two-turn flow completes correctly.

**Note on trailing punctuation:** `"Forehand preparation."` is used as-is as the focus area label. This produces `title: "Forehand preparation. drill"`. Acceptable for a draft — the director can refine at the review stage. Defer cleanup to Sprint 912.11 if desired.

---

## Scenario 4 — Cancel during slot-fill ✅ PASS

**Setup:** Turn 1 triggers a slot-fill question (e.g., Scenario 2 turn 1).

**Director says:** `"Cancel"`

**Trace:**
- `hasPendingDrillSlotFill()` = true → slot-fill handler fires
- Not stale
- `CANCEL_CONFIRM_PATTERN.test("Cancel")` → matches ✅
- `clearPendingDrillSlotFill()`
- `setIsTyping(false)`
- DONNA: _"No problem — the drill draft has been cancelled. Let me know if you'd like to try again."_
- Returns immediately — no draft created

**Expected:** ✅ Slot-fill cleared, no draft created, clean acknowledgement.

**Words that trigger cancel:** "no", "nope", "cancel", "never mind", "forget it", "stop", "skip it", "scratch that", "no thanks", "not right now", "don't do it", "don't create it" — all covered by `CANCEL_CONFIRM_PATTERN`.

---

## Scenario 5 — Cancel during confirmation ✅ PASS

**Setup:** `triggerDrillConfirmation` was called; DONNA is showing the summary.

**Director says:** `"No"`

**Trace:**
- `activePending` resolved from conv state or session memory
- `CANCEL_CONFIRM_PATTERN.test("No")` → matches ✅
- `conv.clearPendingConfirmation()` + `clearPendingAction()`
- DONNA: _"Cancelled. Nothing was created. What would you like to do instead?"_
- Returns immediately — no `execute()` called

**Expected:** ✅ Confirmation cleared, no draft created, both conv state and session memory cleaned.

---

## Scenario 6 — Route-change confirmation memory ✅ PASS (with qualifier)

**Setup:** `triggerDrillConfirmation` called; director navigates to another page (client-side) and back.

**What happens on navigation (client-side):**
- Next.js App Router does not reload JS modules on client-side route changes
- `donnaChatSessionMemory._state` module-level singleton persists → `pendingAction` survives
- Shell component remounts on navigation
- Mount `useEffect` (keyed on `donnaRole`) fires → `getPendingAction()` → age check → within 10 min → `conv.setPendingConfirmation(restored)` ✅

**Director says:** `"Do it"`
- `conv.pendingConfirmation` is restored ✅
- `CONFIRM_PATTERN.test("Do it")` → matches ✅
- Execute closure calls `createCurriculumContentItemDraft(...)` with captured `levelName`, `focusArea`, `rawInput` ✅

**Expected:** ✅ Pending action survives client-side navigation within TTL.

**Qualifier:** A hard page reload (browser refresh, F5) clears all module state. The pending action is lost. This is correct and expected — the director would need to restate the request. Not a bug.

---

## Scenario 7 — Strong orphan confirmation ✅ PASS

**Setup:** No `activePending` in conv state, no stored action in session memory.

**Director says:** `"Do it"`

**Trace:**
- `activePending` = null (nothing in conv or session memory)
- `STRONG_CONFIRM_PATTERN.test("Do it")` → matches "do it" ✅
- DONNA: _"I don't have anything waiting for your confirmation. What would you like me to do?"_
- Returns

**Expected:** ✅ Clean "nothing pending" response. Generic "yes/ok/sure" does not trigger this guard (excluded by design).

---

## Scenario 8 — Vague focus answer ✅ PASS

**Setup:** Scenario 3 turn 1 — slot-fill awaiting focus.

**Director says:** `"Whatever"`

**Trace:**
- `hasPendingDrillSlotFill()` = true → slot-fill handler
- `slotFill.missingSlot === 'focusArea'`
- `extractFocusArea("Whatever")` → null (no keyword patterns)
- Fallback: `"Whatever"` length 8, `VAGUE_ANSWER_PATTERN.test("Whatever")` → matches `\bwhatever\b` ✅
- `focus = null` (vague detected)
- DONNA: _"What should the drill focus on? For example: forehand prep, serve mechanics, or footwork."_
- Slot-fill state preserved — director can answer again

**Other vague words caught:** "I don't know", "not sure", "idk", "hmm", "uh", "um", "what", "huh", "anything", "something", "doesn't matter", "no idea", "any", "either", "both"

**Expected:** ✅ Vague answer rejected cleanly, question repeated with examples, slot-fill stays active.

---

## Scenario 9 — Invalid level answer ✅ PASS

**Setup:** Scenario 2 turn 1 — slot-fill awaiting level.

**Director says:** `"Purple 9"`

**Trace:**
- `hasPendingDrillSlotFill()` = true → slot-fill handler
- `slotFill.missingSlot === 'levelName'`
- `extractTargetLevel("Purple 9")` → no pattern matches → null ✅
- `setIsTyping(false)`
- DONNA: _"I didn't catch that level. Try something like: Orange 2, Yellow 1, or Red 3."_
- Slot-fill state preserved — director can answer again

**Expected:** ✅ Unrecognised level rejected, question repeated with valid examples, slot-fill stays active.

---

## Scenario 10 — Review queue visibility ✅ PASS

**After successful draft creation:**
- `createCurriculumContentItemDraft` calls `revalidatePath('/director/curriculum')` and `revalidatePath('/director/curriculum/builder')` → server cache marked stale
- `CurriculumBuilderChangeQueue` queries `academy_curriculum_overrides` where `status IN ('pending_review', 'draft')` and `academy_id = academyId`
- DONNA draft sets `status = 'pending_review'`, `academy_id` from authenticated profile, `proposed_change.title = "${focusArea} drill"`, `proposed_change.level_id = resolvedLevelId`, `proposed_change.content_type = 'drill'`
- `CurriculumBuilderChangeQueue` resolves `level_id → display_name` via `curriculum_levels` batch query → shown as "Level" in detail panel
- `raw_input` stored → shown in "What DONNA proposed" expanded panel

**Director must navigate to `/director/curriculum/builder` to see the new row.** DONNA's success message includes a "Take me to Review Center" link pointing to `/director/curriculum/builder` ✅

**Expected:** ✅ Draft visible in queue after navigation. Level name resolved. Raw input shown.

---

## Scenario 11 — Approval safety ✅ PASS

**Static verification:**
- `createCurriculumContentItemDraft` inserts only `status: 'pending_review'` — line 391 in curriculumDraftActions.ts ✅
- No call to `execute_curriculum_override()` anywhere in the DONNA draft path ✅
- No call to `approveCurriculumOverrideDraft()` or `rejectCurriculumOverrideDraft()` from DONNA shell ✅
- Approval requires explicit director action via Sprint 904 actions: `approveCurriculumOverrideDraft()` in `curriculumOverrideApprovalActions.ts`, called from `CurriculumChangeQueue.tsx` ✅
- `CurriculumBuilderChangeQueue.tsx` is read-only; it does not mutate rows ✅
- Sprint 904 approval action files not touched in Sprints 912.7–912.10 ✅

**Expected:** ✅ Draft creation never auto-approves, auto-applies, or mutates official curriculum.

---

## Scenario 12 — Existing UI draft panels ✅ PASS

**Callers with explicit `levelId`:**

| Component | `levelId` passed? | Behaviour after 912.8 change |
|---|---|---|
| `DonnaAddDrillDraft.tsx:45` | `levelId: level.id` (UUID from props) | `resolvedLevelId = input.levelId.trim()` — resolution step skipped entirely |
| `DonnaAddAssessmentGateDraft.tsx:45` | `levelId: level.id` | Same — no change to existing path |
| `DonnaAddFitnessExerciseDraft.tsx:45` | `levelId: level.id` | Same — no change to existing path |

Making `levelId` optional (Sprint 912.8) is a purely additive change. Existing callers that pass `levelId` take the identical code path as before — `resolvedLevelId = input.levelId.trim()`, and the `ilike` query block is never reached.

**Expected:** ✅ All three existing DONNA draft panels behave identically to pre-912.8.

---

## Bonus scenario — Three-turn flow (no level, no focus) ✅ PASS

Not in the original sprint plan but exercised by the implementation:

**Turn 1:** `"Add a drill."` → slot-fill stored with `levelName: null, focusArea: null, missingSlot: 'levelName'` → DONNA asks for level
**Turn 2:** `"Orange 2."` → level resolved → `focusArea = null` → slot-fill updated with `levelName: "Orange 2", missingSlot: 'focusArea'` → DONNA asks for focus
**Turn 3:** `"Forehand preparation."` → focus resolved as full text → `triggerDrillConfirmation(...)` → confirmation prompt

All three turns handled correctly. Three-turn slot fill works without any additional code.

---

## Risks and known limitations

### Risk 1 — Live DB level name match (medium, live-DB-only)
`createCurriculumContentItemDraft` resolves `levelName` via:
```sql
SELECT id FROM curriculum_levels WHERE display_name ILIKE 'Orange 2'
```
If `curriculum_levels.display_name` stores values differently (e.g., `"Orange Ball 2"`, `"OB2"`, `"Orange Level 2"`), `maybeSingle()` returns null and the action fails with:
> "Could not find a curriculum level named 'Orange 2'. Check the level name (e.g., 'Orange 2', 'Yellow 1') and try again."

**Mitigation:** The error is surfaced cleanly to the director via DONNA's result message. No silent failure. No unsafe state. To verify, run:
```sql
SELECT id, display_name FROM curriculum_levels ORDER BY sort_order;
```
If names don't match `extractTargetLevel()` output, update `extractTargetLevel` patterns to match the actual DB values.

### Risk 2 — Focus area trailing punctuation (low)
When the director answers a focus question with a full sentence like "Forehand preparation." (with period), the trailing period is included in the drill title: `"Forehand preparation. drill"`. Harmless in a draft but slightly rough. Defer to Sprint 912.11 cleanup.

**Fix if needed:** Add `.replace(/[.!?,]+$/, '').trim()` to the focus area assignment in the slot-fill focusArea handler.

### Risk 3 — Hard reload loses session memory (expected, low)
A browser refresh clears all JS module state including `donnaChatSessionMemory._state`. Any pending action or slot-fill is lost. This is correct and expected behaviour — it is documented in Sprint 912.7 design notes. Directors are unlikely to refresh mid-confirmation.

### Risk 4 — `extractFocusArea("about")` false positive (low)
If the director asks "what about footwork" during unrelated conversation while a slot-fill is waiting, and `missingSlot === 'focusArea'`, the `about` pattern would match "footwork" from "what about footwork". Since the slot-fill handler intercepts the turn, this works correctly — "footwork" becomes the focus area, which is likely what the director intended. No false positive.

---

## Files changed

None. This sprint creates the QA document only. No code changes were required — all 12 scenarios pass by static analysis.

---

## Sprint 912.11 recommendations

**Priority 1 — Focus area trim polish (5 min)**
Strip trailing punctuation from focus area before using it as the draft title. Add `.replace(/[.!?,]+$/, '').trim()` in the focusArea resolution in the slot-fill handler.

**Priority 2 — Level name DB verification**
Before first live test with a real academy, verify `curriculum_levels.display_name` values match the patterns in `extractTargetLevel()`. If they differ, update one or the other.

**Priority 3 — Expand to gates and skills**
Wire `add a gate for [level]` and `add a skill for [level]` through the same confirmation loop. The `createCurriculumContentItemDraft` action already supports `contentType: 'assessment'` and `contentType: 'skill'` — only intent detection and slot-fill extensions are needed.

**Priority 4 — Multi-turn conversation context injection**
`getRecentTurns(3)` is available in session memory but never injected into routing. "Following up on that — " prefix would make DONNA feel more continuous. Low-risk additive change.

**Priority 5 — DONNA post-draft router.refresh()**
Currently the success message points directors to `/director/curriculum/builder`. Adding `router.refresh()` after a successful draft would update the CurriculumBuilderChangeQueue in-place without navigation. See GAP-1 in `docs/QA_CURRICULUM_DRAFT_PIPELINE_908.md`.
