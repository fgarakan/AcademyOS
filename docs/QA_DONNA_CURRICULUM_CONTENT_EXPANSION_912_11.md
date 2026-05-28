# QA — DONNA Curriculum Content Expansion
**Sprint:** 912.11
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.11 implementation
**Code analysed:**
- `src/components/donna/DonnaVoiceReadyShell.tsx`
- `src/lib/donna/donnaChatSessionMemory.ts`
- `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts`
- `src/lib/actions/curriculumDraftActions.ts`

---

## Part 2 — Level name DB verification

**Finding: ILIKE mismatch was confirmed and fixed.**

The seed migration `036_curriculum_spine.sql` inserts level names with descriptive suffixes:
```
Red 1 — Discovery, Red 2 — Contact, Red 3 — Consistency
Orange 1 — Rally, Orange 2 — Direction, Orange 3 — Construction
Green 1 — Pressure, Green 2 — Variety, Green 3 — Identity
Yellow 1 — Compete, Yellow 2 — Construct, Yellow 3 — Win
HP 1 — Specialise, HP 2 — Compete Elite, HP 3 — Professional
```

`extractTargetLevel()` returns the short form: `"Orange 2"`, `"Yellow 1"`, `"Red 3"`, etc.

The pre-sprint ILIKE query was:
```ts
.ilike('display_name', input.levelName.trim())   // exact match — ALWAYS FAILS
```

The fix applied in Sprint 912.11:
```ts
.ilike('display_name', `${input.levelName.trim()}%`)   // prefix match — "Orange 2%" matches "Orange 2 — Direction"
```

**Verification of all extract patterns against DB values:**

| `extractTargetLevel()` output | ILIKE pattern | DB display_name | Result |
|---|---|---|---|
| `"Red 1"` | `"Red 1%"` | `"Red 1 — Discovery"` | ✅ Match |
| `"Red 2"` | `"Red 2%"` | `"Red 2 — Contact"` | ✅ Match |
| `"Red 3"` | `"Red 3%"` | `"Red 3 — Consistency"` | ✅ Match |
| `"Orange 1"` | `"Orange 1%"` | `"Orange 1 — Rally"` | ✅ Match |
| `"Orange 2"` | `"Orange 2%"` | `"Orange 2 — Direction"` | ✅ Match |
| `"Orange 3"` | `"Orange 3%"` | `"Orange 3 — Construction"` | ✅ Match |
| `"Yellow 1"` | `"Yellow 1%"` | `"Yellow 1 — Compete"` | ✅ Match |
| `"Yellow 2"` | `"Yellow 2%"` | `"Yellow 2 — Construct"` | ✅ Match |
| `"Yellow 3"` | `"Yellow 3%"` | `"Yellow 3 — Win"` | ✅ Match |
| `"HP 1"` | `"HP 1%"` | `"HP 1 — Specialise"` | ✅ Match |
| `"HP 2"` | `"HP 2%"` | `"HP 2 — Compete Elite"` | ✅ Match |
| `"HP 3"` | `"HP 3%"` | `"HP 3 — Professional"` | ✅ Match |

**Green levels are missing from `extractTargetLevel()`.** `"Green 1"`, `"Green 2"`, `"Green 3"` are seeded in the DB but have no extraction pattern. A director saying "add a drill for Green 2" would get `extractTargetLevel()` → `null` → DONNA asks for level. Sprint 912.12 recommendation: add Green patterns.

**Non-numbered fallbacks** (`"Red"`, `"Orange"`, `"Yellow"`) produce `"Orange%"` which matches multiple rows. `maybeSingle()` returns an error → `!levelRow` → clean fail message shown to director. No silent failure.

**Verification is static only.** Live DB access is not available in this environment. The analysis is based on migration 036 seed data. If the live DB has different `display_name` values (e.g., from a custom migration), the SQL Editor check remains the authoritative verification:
```sql
SELECT id, display_name FROM curriculum_levels ORDER BY sort_order;
```

---

## Scenario 1 — Drill existing (complete one-turn, focus has trailing period) ✅ PASS

**Input:** `"Add a drill for Orange 2 focused on forehand preparation."`

**Trace:**
- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea(...)` → `"focused on"` pattern captures `"forehand preparation"` (`.` excluded by `[^,.\n]`)
- Sprint 912.11 trim: no trailing punctuation in captured group → `"forehand preparation"` unchanged ✓
- `triggerDrillConfirmation(...)` → `triggerCurriculumContentConfirmation({ contentType: 'drill', contentLabel: 'drill', ... })`
- Summary: _"I can create a draft to add a **forehand preparation** drill to your Orange 2 curriculum…"_

**Director says:** `"Yes"` → draft created as `pending_review`. ✅

---

## Scenario 2 — Drill focus punctuation (exclamation/question mark) ✅ PASS

**Input (slot-fill path):** Director answers focus question with `"Serve mechanics!"`

**Trace:**
- Slot-fill handler fires: `missingSlot === 'focusArea'`
- `extractFocusArea("Serve mechanics!")` → no keyword patterns → null
- Fallback: `trimmed.trim().replace(/[.!?,;:]+$/, '')` → `"Serve mechanics"`
- `focus = "Serve mechanics"` (clean, no trailing `!`) ✓
- `triggerCurriculumContentConfirmation(...)` → confirmation prompt

**Expected:** ✅ Trailing punctuation stripped cleanly. Title becomes `"Serve mechanics drill"` not `"Serve mechanics! drill"`.

**Bonus: `extractFocusArea` internal trim** — `"covering serve mechanics!"` would match the covering pattern and `trimPunctuation` strips the `!`. Both paths are now clean.

---

## Scenario 3 — Drill missing focus (slot-fill) ✅ PASS

**Turn 1:** `"Add a drill for Orange 2"` → slot-fill, DONNA asks for focus
**Turn 2:** `"Forehand preparation."` → extracted by `extractFocusArea` (returns null, no keyword match) → fallback → `.replace(/[.!?,;:]+$/, '')` → `"Forehand preparation"` → `triggerDrillConfirmation` ✅

---

## Scenario 4 — Gate complete (one-turn) ✅ PASS

**Input:** `"Add an assessment gate for Orange 2 focused on forehand preparation"`

**Trace:**
- `GATE_CREATION_PATTERN` = `/\b(add|create)\b.{0,40}\b(assessment\s+gate|gate)\b/i`
- Matches: `add` + ` an ` (3 chars) + `assessment gate` ✓
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea(...)` → `"forehand preparation"`
- Both present → `triggerCurriculumContentConfirmation({ contentType: 'assessment', contentLabel: 'assessment gate', levelName: 'Orange 2', focusArea: 'forehand preparation', ... })`
- Summary: _"I can create a draft to add a **forehand preparation** assessment gate to your Orange 2 curriculum…"_
- Director confirms → `createCurriculumContentItemDraft({ contentType: 'assessment', title: 'forehand preparation assessment gate', levelName: 'Orange 2', status: 'pending_review' })` ✅

---

## Scenario 5 — Skill complete (one-turn) ✅ PASS

**Input:** `"Add a skill for Orange 2 focused on forehand preparation"`

**Trace:**
- `SKILL_CREATION_PATTERN` = `/\b(add|create)\b.{0,30}\bskill\b/i` → matches ✓
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea(...)` → `"forehand preparation"`
- Both present → `triggerCurriculumContentConfirmation({ contentType: 'skill', contentLabel: 'skill', ... })`
- Summary: _"I can create a draft to add a **forehand preparation** skill to your Orange 2 curriculum…"_
- Director confirms → `createCurriculumContentItemDraft({ contentType: 'skill', title: 'forehand preparation skill', ... })` ✅

---

## Scenario 6 — Gate missing level ✅ PASS

**Input:** `"Add an assessment gate focused on forehand preparation"`

**Trace:**
- `GATE_CREATION_PATTERN` matches ✓
- `extractTargetLevel(...)` → null (no level name in text)
- `extractFocusArea(...)` → `"forehand preparation"`
- `setPendingDrillSlotFill({ kind: 'curriculum_gate_draft', levelName: null, focusArea: 'forehand preparation', missingSlot: 'levelName', rawInput: ... })`
- DONNA: _"Which curriculum level should this assessment gate go in? (e.g., Orange 2, Yellow 1, Red 3)"_

**Turn 2:** `"Orange 2"`
- `hasPendingDrillSlotFill()` = true → slot-fill handler fires
- `slotFill.kind === 'curriculum_gate_draft'`
- `extractTargetLevel("Orange 2")` → `"Orange 2"`
- `slotFill.focusArea` = `"forehand preparation"` (stored from turn 1) ✓
- `clearPendingDrillSlotFill()`
- `triggerCurriculumContentConfirmation({ contentType: 'assessment', contentLabel: 'assessment gate', levelName: 'Orange 2', focusArea: 'forehand preparation', ... })` ✅

---

## Scenario 7 — Skill missing focus ✅ PASS

**Input:** `"Add a skill for Orange 2"`

**Trace:**
- `SKILL_CREATION_PATTERN` matches ✓
- `extractTargetLevel(...)` → `"Orange 2"`
- `extractFocusArea(...)` → null (no focus phrase)
- `setPendingDrillSlotFill({ kind: 'curriculum_skill_draft', levelName: 'Orange 2', focusArea: null, missingSlot: 'focusArea', ... })`
- DONNA: _"Got it — a new skill for Orange 2. What should the skill focus on? (e.g., forehand preparation, serve mechanics, footwork)"_

**Turn 2:** `"Forehand preparation."`
- Slot-fill handler: `missingSlot === 'focusArea'`
- `extractFocusArea(...)` → null
- Fallback: `.replace(/[.!?,;:]+$/, '')` → `"Forehand preparation"` ✓
- `triggerCurriculumContentConfirmation({ contentType: 'skill', contentLabel: 'skill', levelName: 'Orange 2', focusArea: 'Forehand preparation', ... })` ✅

---

## Scenario 8 — Cancel gate/skill confirmation ✅ PASS

**Setup:** `triggerCurriculumContentConfirmation` called for a gate; DONNA shows summary.

**Director says:** `"No"`
- `activePending` resolved from conv state
- `CANCEL_CONFIRM_PATTERN.test("No")` → matches ✓
- `conv.clearPendingConfirmation()` + `clearPendingAction()`
- DONNA: _"Cancelled. Nothing was created. What would you like to do instead?"_
- No `execute()` called, no draft created ✅

**Cancel during slot-fill** (e.g., while DONNA is asking for a missing level):
- Director says `"cancel"` → `CANCEL_CONFIRM_PATTERN` matches in the slot-fill handler
- `clearPendingDrillSlotFill()`
- DONNA: `"No problem — the assessment gate draft has been cancelled."` (uses `getContentLabel(slotFill.kind)`) ✅

---

## Scenario 9 — Confirm gate/skill creation ✅ PASS

**Setup:** `triggerCurriculumContentConfirmation({ contentType: 'assessment', ... })` for Orange 2 gate.

**Director says:** `"Yes"`
- `CONFIRM_PATTERN` matches
- `setIsExecuting(true)`, DONNA: _"Creating the draft now…"_
- `execute()` → `createCurriculumContentItemDraft({ levelName: 'Orange 2', contentType: 'assessment', title: 'forehand preparation assessment gate', status: 'pending_review' })`
- Server action: auth → academy_id → role check → `ILIKE 'Orange 2%'` → `"Orange 2 — Direction"` UUID → `INSERT academy_curriculum_overrides (status: 'pending_review')`
- `revalidatePath('/director/curriculum/builder')` called
- Audit log written
- DONNA: `"A 'forehand preparation' assessment gate draft for Orange 2 has been created. The draft is in your Review Center."` ✅
- Draft visible in `CurriculumBuilderChangeQueue` as `pending_review` ✅

---

## Scenario 10 — All created items are pending_review only ✅ PASS

**Static verification:**
- `createCurriculumContentItemDraft` inserts `status: 'pending_review'` for every content type ✅
- Gate contentType `'assessment'` is in `VALID_CONTENT_TYPES` — no server-action rejection ✅
- Skill contentType `'skill'` is in `VALID_CONTENT_TYPES` — no server-action rejection ✅
- No call to `execute_curriculum_override()` in any DONNA draft path ✅
- No call to `approveCurriculumOverrideDraft()` from DONNA shell ✅
- Sprint 904 approval action files unchanged ✅

---

## Handler execution order (updated for Sprint 912.11)

Inside `handleSend()`:
1. Pending confirmation intercept
2. Orphaned strong-confirm guard
3. **Content slot-fill answer handler** (now handles drill/gate/skill kinds)
4. Nav offer check
5. Boundary / missing-context / KPI / other interceptors
6. **Drill creation handler** (DRILL_CREATION_PATTERN)
7. **Gate creation handler** (GATE_CREATION_PATTERN) ← NEW
8. **Skill creation handler** (SKILL_CREATION_PATTERN) ← NEW
9. Broad curriculum draft proposal (Sprint 739 — fallback for unrecognised intents)
10. All other handlers / fallback

---

## Focus trim verification

| Input | Pre-912.11 result | Post-912.11 result |
|---|---|---|
| `"forehand preparation."` (fallback) | `"forehand preparation."` | `"forehand preparation"` ✅ |
| `"serve mechanics!"` (fallback) | `"serve mechanics!"` | `"serve mechanics"` ✅ |
| `"footwork?"` (fallback) | `"footwork?"` | `"footwork"` ✅ |
| `"focused on forehand preparation"` | `"forehand preparation"` | `"forehand preparation"` ✅ (unchanged) |
| `"covering serve mechanics!"` | `"serve mechanics!"` | `"serve mechanics"` ✅ |
| `"about rally consistency."` | `"rally consistency"` | `"rally consistency"` ✅ (`.` already excluded by `[^,.\n]`) |

---

## Risks and known limitations

### Risk 1 — Green levels missing from extractTargetLevel (medium)
`extractTargetLevel()` has no patterns for Green 1, Green 2, or Green 3. A director asking "add a skill for Green 2" will trigger the skill handler but `extractTargetLevel` returns null → DONNA asks for level. Level slot-fill then fires, but even if the director answers "Green 2", `extractTargetLevel("Green 2")` still returns null → DONNA asks again. This creates an unhelpful loop.

**Fix:** Add Green patterns in Sprint 912.12:
```ts
[/green.?1/i, 'Green 1'], [/green.?2/i, 'Green 2'], [/green.?3/i, 'Green 3'],
[/\bgreen\b/i, 'Green'],
```
The DB has `"Green 1 — Pressure"`, `"Green 2 — Variety"`, `"Green 3 — Identity"` — the prefix ILIKE fix in 912.11 will handle these correctly once the patterns exist.

### Risk 2 — GATE_CREATION_PATTERN may match informational gate questions (low)
A question like "Can you add a gate feature here?" would match `GATE_CREATION_PATTERN`. In the AcademyOS director context this is an unlikely phrasing and the result (asking for level/focus) is recoverable.

### Risk 3 — SKILL_CREATION_PATTERN may match "add a skill drill" (low)
Since DRILL_CREATION_PATTERN fires first (requires `\bdrill\b`), "add a skill drill" would match the drill handler, not the skill handler. This is the more accurate interpretation.

### Risk 4 — Gate title format "forehand preparation assessment gate" is wordy (low)
Draft titles like `"forehand preparation assessment gate"` are functional but slightly verbose. Directors can rename at the review stage. Acceptable for V1.

### Risk 5 — Hard reload loses session state (expected)
Same as Sprint 912.9: browser refresh clears module memory. Any pending slot-fill or confirmation is lost. Expected and documented.

---

## Files changed

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`** — GATE_CREATION_PATTERN, SKILL_CREATION_PATTERN, `triggerCurriculumContentConfirmation`, refactored `triggerDrillConfirmation`, updated slot-fill handler, gate/skill one-turn + slot-fill handlers, focus trim fix
- **Modified `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts`** — trailing punctuation trim in `extractFocusArea`, `buildContentConfirmationSummaryText` added, `buildDrillConfirmationSummaryText` refactored as wrapper
- **Modified `src/lib/donna/donnaChatSessionMemory.ts`** — `PendingDrillSlotFill.kind` union extended with `'curriculum_gate_draft' | 'curriculum_skill_draft'`
- **Modified `src/lib/actions/curriculumDraftActions.ts`** — ILIKE prefix fix (`display_name ILIKE 'Orange 2%'`)

---

## Sprint 912.12 recommendations

1. **Add Green level patterns to `extractTargetLevel()`** — Green 1/2/3 exist in the DB; patterns are missing from the extractor. Low-risk additive change.
2. **`router.refresh()` after successful draft creation** — Updates the CurriculumBuilderChangeQueue in-place without navigation. See GAP-1 in `docs/QA_CURRICULUM_DRAFT_PIPELINE_908.md`.
3. **Context injection** — `getRecentTurns(3)` is available but never injected into routing. "Following up on that — " prefix would make DONNA feel more continuous.
4. **Content type expansion** — Missions and badges could follow the same pattern once `'mission'` and `'badge'` are in `VALID_CONTENT_TYPES` (pending migration 061 being applied).
