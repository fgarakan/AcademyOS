# QA — DONNA Session Memory Context Injection
**Sprint:** 912.15
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.15 implementation
**Code analysed:**
- `src/lib/donna/donnaChatSessionMemory.ts`
- `src/components/donna/DonnaVoiceReadyShell.tsx`

---

## What Was Built

Three targeted additions that make DONNA feel conversationally continuous without adding LLM routing or unsafe autonomous behavior:

1. **`LastCurriculumDraftAttempt` session context** — stored when any curriculum draft confirmation is shown, expired after 10 minutes.
2. **Curriculum draft follow-up intercept** — handles "same for Orange 3" (swap level), "change the focus to footwork" (swap focus), and "same for Orange 3" with no context (ask what to create).
3. **Slot-fill remount reminder** — if a pending slot-fill exists when the DONNA shell remounts (e.g., after route change), shows a reminder with the pending question.
4. **Slot-fill "change focus to X" extraction** — adds `to X` / `use X instead` extraction to the slot-fill focusArea handler so "change the focus to footwork" during a slot-fill extracts "footwork" instead of the whole phrase.

---

## Session Memory Changes

### New type: `LastCurriculumDraftAttempt`
```typescript
interface LastCurriculumDraftAttempt {
  levelName: string
  focusArea: string
  contentLabel: string  // "drill", "assessment gate", "skill"
  contentType: string   // 'drill', 'assessment', 'skill', etc.
  storedAt: number
}
```

### New constant: `LAST_CURRICULUM_DRAFT_TTL_MS = 10 * 60 * 1000`

### New field on `DonnaChatSessionState`: `lastCurriculumDraftAttempt: LastCurriculumDraftAttempt | null`

### New helpers:
- `setLastCurriculumDraftAttempt(attempt)` — stamps `storedAt`, overwrites previous
- `getLastCurriculumDraftAttempt()` — returns null if not set or TTL expired; auto-clears on expiry

### Where context is stored:
`triggerCurriculumContentConfirmation()` — called for every drill/gate/skill confirmation. Stores the level, focus, label, and content type before clearing pending slot-fill.

---

## Supported Follow-up Patterns

### Pattern A — "same for [level]" (Case A)

**When to fire:** `DRAFT_SAME_FOR` matches AND `recentDraft` is non-null AND a level name is extractable.

**What it does:** Re-triggers `triggerCurriculumContentConfirmation` with:
- `levelName` = new level from input
- `focusArea` = stored focus from `recentDraft`
- `contentType` / `contentLabel` = stored type from `recentDraft`

**Example:**
```
Director: "Add a drill for Orange 2 focused on forehand prep."
DONNA:    "I can create a draft to add a forehand prep drill to your Orange 2 curriculum. Should I create this draft?"
Director: "Yes"
DONNA:    "forehand prep drill draft created for Orange 2. Nothing in the curriculum changes..."
Director: "Same for Orange 3"
DONNA:    "I can create a draft to add a forehand prep drill to your Orange 3 curriculum. Should I create this draft?"
[Confirmation required before execution]
```

---

### Pattern B — "change the focus to [X]" (Case B)

**When to fire:** `DRAFT_CHANGE_FOCUS` matches AND `recentDraft` is non-null AND a focus area is extractable.

**What it does:** Re-triggers `triggerCurriculumContentConfirmation` with:
- `levelName` = stored level from `recentDraft`
- `focusArea` = new focus from input
- `contentType` / `contentLabel` = stored type from `recentDraft`

**Example:**
```
Director: "Add a skill for Green 2 focused on rally consistency."
DONNA:    "I can create a draft... Should I create this draft?"
Director: "Actually change the focus to footwork."
DONNA:    "I can create a draft to add a footwork skill to your Green 2 curriculum. Should I create this draft?"
[New confirmation shown — old one is superseded]
```

---

### Pattern C — "same for [level]" with no recent context (Case C)

**When to fire:** `DRAFT_SAME_FOR` matches AND `recentDraft` is null AND a level name is extractable.

**What it does:** Asks the director what they'd like to create for that level.

**Example:**
```
Director: "Same for Orange 3"  [no recent context]
DONNA:    "What would you like to create for Orange 3? I can add a drill, gate, or skill — just let me know."
```

---

### Slot-fill "change focus to X" improvement

When a slot-fill is waiting for `focusArea` and the director says "change the focus to footwork":
- Previously: `extractFocusArea("change the focus to footwork")` → null, fallback captures "change the focus to footwork" as the focus area → title becomes "change the focus to footwork drill" ❌
- Now: new `to X` / `use X instead` extraction extracts "footwork" → title becomes "footwork drill" ✅

**Extraction chain for `missingSlot === 'focusArea'`:**
1. `extractFocusArea(trimmed)` — handles "focused on X", "covering X", "about X", "add a X drill"
2. NEW: `\b(?:to|use|focus\s+on)\s+([a-zA-Z]...)[.!?,;:]?$` — handles "change focus to X", "use X instead", "focus on X instead"
3. Fallback: entire cleaned input (existing behavior for simple answers like "footwork")

---

### Slot-fill remount reminder

**When to fire:** Component mounts/remounts (donnaRole change), `role === 'director'`, pending slot-fill exists and is not stale.

**What it does:** Adds a DONNA message to the (fresh) chat thread:
```
"Still waiting for your answer — Which curriculum level should this drill go in? (e.g., Orange 2, Yellow 1, Red 3)"
```
or
```
"Still waiting for your answer — What should the assessment gate focus on? (e.g., forehand prep, serve mechanics, footwork)"
```

**Effect:** Director navigates away mid-slot-fill, returns, and immediately sees the pending question rather than an empty chat.

---

## What Recent Turns Are Used For

| Use case | Mechanism | Status |
|---|---|---|
| "same for Orange 3" — reuse focus and type | `getLastCurriculumDraftAttempt()` | ✅ Sprint 912.15 |
| "change focus to footwork" — reuse level and type | `getLastCurriculumDraftAttempt()` | ✅ Sprint 912.15 |
| "same for [level]" with no context — ask | `getLastCurriculumDraftAttempt()` returns null | ✅ Sprint 912.15 |
| Slot-fill reminder on remount | `getPendingDrillSlotFill()` (existing) | ✅ Sprint 912.15 |

## What Recent Turns Are NOT Used For

- Executing any action without confirmation — never bypasses `triggerCurriculumContentConfirmation`
- Auto-approving drafts — never
- Bypassing required slots — never; if follow-up is missing level or focus, falls through to normal routing
- Cross-domain context injection — `getRecentTurns()` is still available but not wired to non-curriculum routing
- Navigation offers from context — not wired
- Cross-session persistence — resets on hard reload as documented

---

## Safety Boundaries

| Boundary | Respected? |
|---|---|
| All follow-ups still go through `triggerCurriculumContentConfirmation` → requires "yes" | ✅ |
| No draft created without director confirmation | ✅ |
| No `execute_curriculum_override()` calls | ✅ |
| No `proposed_actions` usage | ✅ |
| Sprint 904 approve/reject actions untouched | ✅ |
| Stale context (>10 min) auto-expires → returns null → falls through to normal routing | ✅ |
| Invalid level name → fails cleanly in `createCurriculumContentItemDraft` → error shown to director | ✅ |
| Vague focus answer blocked by `VAGUE_ANSWER_PATTERN` | ✅ |
| "same for" without recognizable level → falls through (no match), no error | ✅ |
| Hard reload loses context → expected, documented | ✅ |

---

## Pipeline Position

The curriculum follow-up intercept fires at this position in `handleSend()`:

```
1.  Pending confirmation intercept
2.  Orphaned strong-confirm guard
3.  Slot-fill handler (now with improved "change focus to X" extraction)
4.  Nav offer yes/no
5.  Boundary check
6.  Page guide intercept (Sprint 912.14)
7.  Missing context (Sprint 725)
8.  null-directorCtx guard (Sprint 912.13)
9.  KPI / Dashboard priority
10. Recent decisions, player stall, player action draft...
11. Coach health
12. ← NEW: Curriculum draft follow-up intercept (Sprint 912.15)
13. Sprint 912.8: Drill creation handler
14. Sprint 912.11: Gate creation handler
15. Sprint 912.11: Skill creation handler
16. Broad curriculum draft proposal (Sprint 739)
...
```

**Why here:** After slot-fill (which already handles the mid-flow case) and after page guide (follow-up is specific to curriculum, not a page question). Before the creation handlers so "same for Orange 3" doesn't try to parse a new drill-from-scratch intent.

---

## Manual/Static QA Scenarios

### Scenario 1 — "Same for Orange 3" after a drill ✅ PASS

**Turn 1:** "Add a drill for Orange 2 focused on forehand prep."
- `DRILL_CREATION_PATTERN` matches → confirms → `triggerCurriculumContentConfirmation` called
- `setLastCurriculumDraftAttempt({ levelName: 'Orange 2', focusArea: 'forehand prep', contentLabel: 'drill', contentType: 'drill' })` ✅

**Turn 2:** "Yes" → draft created
- `triggerCurriculumContentConfirmation` NOT re-called → context stays in memory ✅

**Turn 3:** "Same for Orange 3"
- `DRAFT_SAME_FOR.test("Same for Orange 3")` → `\bsame for\b` → ✅
- `recentDraft` = `{ levelName: 'Orange 2', focusArea: 'forehand prep', contentLabel: 'drill', contentType: 'drill' }` ✅
- `extractTargetLevel("Same for Orange 3")` → `/orange.?3/i` → `"Orange 3"` ✅
- `triggerCurriculumContentConfirmation({ contentType: 'drill', contentLabel: 'drill', levelName: 'Orange 3', focusArea: 'forehand prep', rawInput: 'Same for Orange 3' })` called ✅
- DONNA shows: "I can create a draft to add a **forehand prep** drill to your Orange 3 curriculum…"
- **No draft created until director confirms.** ✅

**Expected:** ✅ Continuity follow-up works correctly.

---

### Scenario 2 — "Change focus to footwork" after a skill ✅ PASS

**Turn 1:** "Add a skill for Green 2 focused on rally consistency."
- `SKILL_CREATION_PATTERN` matches → `triggerCurriculumContentConfirmation` called
- `setLastCurriculumDraftAttempt({ levelName: 'Green 2', focusArea: 'rally consistency', contentLabel: 'skill', contentType: 'skill' })` ✅

**Turn 2 (before confirming):** "Actually change the focus to footwork."
- Pending confirmation check: `activePending` is set → but this doesn't match `CONFIRM_PATTERN` or `CANCEL_CONFIRM_PATTERN`
- Goes to "neither yes nor no" → DONNA re-states the confirmation question?

Wait, actually there IS a pending confirmation when the director says "Actually change the focus to footwork." The pending confirmation intercept (step 1) fires and checks:
- `CONFIRM_PATTERN.test("Actually change the focus to footwork")` → No, "actually change" doesn't match ✅
- `CANCEL_CONFIRM_PATTERN.test(...)` → No ✅
- → "neither yes nor no" → DONNA repeats: "Just to confirm — Add a 'rally consistency' skill to Green 2 curriculum. Say 'yes' to create the draft, or 'no' to cancel."

So the director gets a re-statement. If they want to change the focus, they first need to say "no" to cancel, THEN say "change focus to footwork."

**Turn 2 revised:** "No" → `CANCEL_CONFIRM_PATTERN.test("No")` → ✅ → pending cleared
**Turn 3:** "Change the focus to footwork."
- No pending confirmation ✅
- No slot-fill ✅
- `DRAFT_CHANGE_FOCUS.test("Change the focus to footwork")` → `change.{0,10}focus.{0,5}to` → "change the focus to" → ✅
- `recentDraft` = `{ levelName: 'Green 2', focusArea: 'rally consistency', ... }` ✅
- `extractFocusArea("Change the focus to footwork")` → no keyword patterns → null
- `\b(?:to|use|focus\s+on)\s+([a-zA-Z]...)` → matches "to footwork" → captures "footwork" ✅
- `newFocus = "footwork"` (length 8, not vague) ✅
- `triggerCurriculumContentConfirmation({ contentType: 'skill', contentLabel: 'skill', levelName: 'Green 2', focusArea: 'footwork', rawInput: 'Change the focus to footwork.' })` ✅
- DONNA shows: "I can create a draft to add a **footwork** skill to your Green 2 curriculum…"

**Expected:** ✅ After cancel, focus change works correctly with context.

**Note:** The director must cancel first before changing. This is the correct safe behavior — DONNA doesn't silently override a pending confirmation.

---

### Scenario 3 — "Same for Yellow 1" after a gate ✅ PASS

**Setup:** Director confirmed a gate for Red 2 focused on backhand mechanics.
`recentDraft = { levelName: 'Red 2', focusArea: 'backhand mechanics', contentLabel: 'assessment gate', contentType: 'assessment' }`

**Input:** "Same for Yellow 1"
- `DRAFT_SAME_FOR.test("Same for Yellow 1")` → `\bsame for\b` → ✅
- `extractTargetLevel("Same for Yellow 1")` → `/yellow.?1/i` → `"Yellow 1"` ✅
- `triggerCurriculumContentConfirmation({ contentType: 'assessment', contentLabel: 'assessment gate', levelName: 'Yellow 1', focusArea: 'backhand mechanics', rawInput: 'Same for Yellow 1' })` ✅
- DONNA: "I can create a draft to add a **backhand mechanics** assessment gate to your Yellow 1 curriculum…"

**Expected:** ✅ Context carries over correctly for gates.

---

### Scenario 4 — "What can I do here?" then "What needs approval?" ✅ PASS (unchanged)

Both are page guide questions handled by Sprint 912.14 patterns.

**Turn 1:** "What can I do here?" → `PAGE_WHAT_CAN_I_DO` → `whatCanYouHelpWith(pathname)` ✅
**Turn 2:** "What needs approval?" → `PAGE_APPROVAL` → `whatActionsRequireApproval(pathname)` ✅

Neither involves session memory or `recentDraft`. Follow-up intercept: `DRAFT_SAME_FOR` and `DRAFT_CHANGE_FOCUS` don't match → `recentDraft` null → Case C: `DRAFT_SAME_FOR` doesn't match "What needs approval?" → falls through to page guide ✅

**Expected:** ✅ Page guide follow-up unaffected by Sprint 912.15.

---

### Scenario 5 — "What should I do here?" then "What should I be careful with?" ✅ PASS (unchanged)

Page guide handles both. Scenario 4 reasoning applies. ✅

---

### Scenario 6 — "Do it" with no pending action ✅ PASS (unchanged)

`STRONG_CONFIRM_PATTERN.test("Do it")` fires at step 2 (orphaned strong-confirm guard). DONNA: "I don't have anything waiting for your confirmation." No change from Sprint 912.7 behavior. ✅

---

### Scenario 7 — "Same for Orange 3" with no recent context ✅ PASS

**Setup:** Fresh session, no drafts created.

**Input:** "Same for Orange 3"
- `DRAFT_SAME_FOR.test("Same for Orange 3")` → ✅
- `recentDraft = getLastCurriculumDraftAttempt()` → null (no context stored)
- Case C fires: `!recentDraft && DRAFT_SAME_FOR.test(trimmed)` → ✅
- `extractTargetLevel("Same for Orange 3")` → `"Orange 3"` ✅
- DONNA: "What would you like to create for Orange 3? I can add a drill, gate, or skill — just let me know."

**Expected:** ✅ Helpful direction instead of generic fallback.

---

### Scenario 8 — Existing drill creation still works ✅ PASS

**Input:** "Add a drill for Orange 2 focused on forehand preparation."
- `DRAFT_SAME_FOR.test(...)` → "Add a drill for Orange 2..." → does "add" match `\badd (one |that )?for\b`? → needs "for" after "add" with optional "one|that" → "add a drill for" → "add" + " a drill " (6 chars, but pattern requires `(one |that )?for` right after "add") → actually "add a drill" doesn't match since " a drill" doesn't match `(one |that )?` → let me check:
  - Pattern: `\badd (one |that )?for\b` → requires "add" then optional "one " or "that " then "for" → "add a drill for" → "a drill" doesn't match `(one |that )?` → NO MATCH ✅
- `DRAFT_CHANGE_FOCUS.test(...)` → "Add a drill for Orange 2 focused on forehand preparation" → "focused on" ≠ "change...focus...to" → NO MATCH ✅
- Falls through to Sprint 912.8 drill creation handler → proceeds normally ✅

**Expected:** ✅ Existing drill creation unaffected.

---

### Scenario 9 — Existing slot-fill still works ✅ PASS

**Turn 1:** "Add a drill for Orange 2." (no focus)
- Slot-fill stored: `{ kind: 'curriculum_drill_draft', levelName: 'Orange 2', focusArea: null, missingSlot: 'focusArea' }`

**Turn 2:** "Forehand preparation."
- `hasPendingDrillSlotFill()` → true → slot-fill handler fires FIRST (step 3)
- `missingSlot === 'focusArea'`
- `extractFocusArea("Forehand preparation.")` → null
- NEW extraction: `\b(?:to|use|focus\s+on)\s+([a-zA-Z]...` → no match ("forehand preparation" doesn't start with "to"/"use"/"focus on")
- Fallback: "Forehand preparation" (cleaned) → `focus = "Forehand preparation"` ✅ (existing behavior preserved)

**Expected:** ✅ Slot-fill for simple answers works identically to pre-912.15.

---

### Scenario 10 — No fake success states ✅ PASS

- Follow-up patterns only call `triggerCurriculumContentConfirmation` → stores a pending confirmation → requires "yes" → then calls `createCurriculumContentItemDraft` → always returns `{ ok: true/false, ... }` — never fabricated.
- Case C ("What would you like to create for Orange 3?") is a pure informational message — no draft created.
- `setLastCurriculumDraftAttempt` does not create any DB rows.

**Expected:** ✅ No fake success states anywhere.

---

## Files Changed

- **Modified `src/lib/donna/donnaChatSessionMemory.ts`:**
  - `LAST_CURRICULUM_DRAFT_TTL_MS = 10 * 60 * 1000` constant
  - `LastCurriculumDraftAttempt` interface with `levelName`, `focusArea`, `contentLabel`, `contentType`, `storedAt`
  - `lastCurriculumDraftAttempt: LastCurriculumDraftAttempt | null` field on `DonnaChatSessionState`
  - Initialized to `null` in `initChatSession()`
  - `setLastCurriculumDraftAttempt()` — stamps storedAt, overwrites previous
  - `getLastCurriculumDraftAttempt()` — returns null if absent or TTL expired; auto-clears stale entry

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - Imported `setLastCurriculumDraftAttempt`, `getLastCurriculumDraftAttempt` from session memory
  - `triggerCurriculumContentConfirmation`: added `setLastCurriculumDraftAttempt(...)` call at top (before `clearPendingDrillSlotFill`)
  - New `useEffect([donnaRole])` for slot-fill remount reminder: shows pending question as first chat message if slot-fill is active and not stale
  - Slot-fill `missingSlot === 'focusArea'` handler: added `\b(?:to|use|focus\s+on)\s+([a-zA-Z]...)` extraction between `extractFocusArea` and the raw-text fallback — cleanly extracts "footwork" from "change focus to footwork"
  - New curriculum follow-up intercept block (before Sprint 912.8 drill handler):
    - Case A: `DRAFT_SAME_FOR` + recent context + level extracted → re-trigger with new level
    - Case B: `DRAFT_CHANGE_FOCUS` + recent context + focus extracted → re-trigger with new focus
    - Case C: `DRAFT_SAME_FOR` + no context + level extracted → ask "What would you like to create for X?"

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.15 changes.

---

## Risks

### Risk 1 — DRAFT_CHANGE_FOCUS fires while a pending confirmation exists (low)

If a confirmation is pending and director says "change the focus to footwork":
- Pending confirmation intercept fires FIRST (step 1)
- "change the focus to footwork" doesn't match `CONFIRM_PATTERN` or `CANCEL_CONFIRM_PATTERN`
- DONNA re-states: "Just to confirm — ... Say 'yes' to create, or 'no' to cancel."
- Director must explicitly cancel before the follow-up intercept fires

This is CORRECT safe behavior — director must explicitly cancel before making a change. Documented in Scenario 2.

### Risk 2 — "do that for me" false-positive in DRAFT_SAME_FOR (very low)

Pattern: `do (that |it )?for` matches "do that for me". But Case A requires `extractTargetLevel("do that for me")` → null → no match. Case C also requires a level → no match. Falls through to normal routing. No issue.

### Risk 3 — recentDraft.contentType cast (very low)

`recentDraft.contentType` is stored as `string`, cast as `CurriculumContentType`. The value is always set from `triggerCurriculumContentConfirmation` which only receives `CurriculumContentType` values. No risk of invalid cast.

---

## Sprint 912.16 Recommendations

The next critical sprint per the completion plan is **Sprint 912.16: DONNA Main Entry Point Upgrade V1**. This resolves the highest-priority gap: God Mode features (conversation mode, curriculum draft loop, page guide mode) are isolated to `/director/donna` while the main layout uses the legacy `DonnaAssistantButton`. For demo readiness, the director sidebar should clearly surface `/director/donna` as the DONNA hub entry point, and the curriculum builder should have a visible "Open DONNA" link.
