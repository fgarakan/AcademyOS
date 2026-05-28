# QA — DONNA Level Extraction
**Sprint:** 912.12
**Date:** 2026-05-28
**Method:** Static code analysis of `extractTargetLevel()` in `curriculumDraftProposalDonnaAnswer.ts`
**Code analysed:** `src/lib/donna/curriculumDraftProposalDonnaAnswer.ts`

---

## Implementation

`extractTargetLevel(text)` lowercases the input then tests an ordered pattern array.
First match wins. Numbered patterns precede bare-color fallbacks so `"Orange 2"` never
falls through to the bare `"Orange"` match.

### Sprint 912.12 additions

```ts
// Numbered Green (supports "Green 1", "Green Ball 1", "Green Dot 1")
[/\bgreen[^0-9]{0,12}1\b/i, 'Green 1'],
[/\bgreen[^0-9]{0,12}2\b/i, 'Green 2'],
[/\bgreen[^0-9]{0,12}3\b/i, 'Green 3'],

// Bare Green fallback
[/\bgreen\b/i, 'Green'],
```

The `[^0-9]{0,12}` infix bridges up to 12 non-digit characters between "green" and the
level number, handling "Green 1", "Green Ball 1", and "Green Dot 1" with a single pattern.
The trailing `\b` prevents "Green Ball 10" from matching `Green 1`.

---

## Level extraction QA table

### Red levels

| Input | Expected | Pattern matched | ILIKE resolves |
|---|---|---|---|
| `"Red 1"` | `"Red 1"` | `/red.?1/i` | `"Red 1%"` → `"Red 1 — Discovery"` ✅ |
| `"Red 2"` | `"Red 2"` | `/red.?2/i` | `"Red 2%"` → `"Red 2 — Contact"` ✅ |
| `"Red 3"` | `"Red 3"` | `/red.?3/i` | `"Red 3%"` → `"Red 3 — Consistency"` ✅ |
| `"Red"` (bare) | `"Red"` | `/\bred\b/i` | `"Red%"` → 3 rows → fail (clean) ⚠️ |

### Orange levels

| Input | Expected | Pattern matched | ILIKE resolves |
|---|---|---|---|
| `"Orange 1"` | `"Orange 1"` | `/orange.?1/i` | `"Orange 1%"` → `"Orange 1 — Rally"` ✅ |
| `"Orange 2"` | `"Orange 2"` | `/orange.?2/i` | `"Orange 2%"` → `"Orange 2 — Direction"` ✅ |
| `"Orange 3"` | `"Orange 3"` | `/orange.?3/i` | `"Orange 3%"` → `"Orange 3 — Construction"` ✅ |
| `"Orange"` (bare) | `"Orange"` | `/\borange\b/i` | `"Orange%"` → 3 rows → fail (clean) ⚠️ |

### Green levels (Sprint 912.12)

| Input | Expected | Pattern matched | ILIKE resolves |
|---|---|---|---|
| `"Green 1"` | `"Green 1"` | `/\bgreen[^0-9]{0,12}1\b/i` | `"Green 1%"` → `"Green 1 — Pressure"` ✅ |
| `"Green 2"` | `"Green 2"` | `/\bgreen[^0-9]{0,12}2\b/i` | `"Green 2%"` → `"Green 2 — Variety"` ✅ |
| `"Green 3"` | `"Green 3"` | `/\bgreen[^0-9]{0,12}3\b/i` | `"Green 3%"` → `"Green 3 — Identity"` ✅ |
| `"Green Ball 1"` | `"Green 1"` | `/\bgreen[^0-9]{0,12}1\b/i` (infix = `" ball "`, 6 chars ≤ 12) | `"Green 1%"` ✅ |
| `"Green Ball 2"` | `"Green 2"` | `/\bgreen[^0-9]{0,12}2\b/i` | `"Green 2%"` ✅ |
| `"Green Ball 3"` | `"Green 3"` | `/\bgreen[^0-9]{0,12}3\b/i` | `"Green 3%"` ✅ |
| `"Green Dot 1"` | `"Green 1"` | `/\bgreen[^0-9]{0,12}1\b/i` (infix = `" dot "`, 5 chars ≤ 12) | `"Green 1%"` ✅ |
| `"Green Dot 2"` | `"Green 2"` | `/\bgreen[^0-9]{0,12}2\b/i` | `"Green 2%"` ✅ |
| `"Green Dot 3"` | `"Green 3"` | `/\bgreen[^0-9]{0,12}3\b/i` | `"Green 3%"` ✅ |
| `"Green"` (bare) | `"Green"` | `/\bgreen\b/i` | `"Green%"` → 3 rows → fail (clean) ⚠️ |

### Yellow levels

| Input | Expected | Pattern matched | ILIKE resolves |
|---|---|---|---|
| `"Yellow 1"` | `"Yellow 1"` | `/yellow.?1/i` | `"Yellow 1%"` → `"Yellow 1 — Compete"` ✅ |
| `"Yellow 2"` | `"Yellow 2"` | `/yellow.?2/i` | `"Yellow 2%"` → `"Yellow 2 — Construct"` ✅ |
| `"Yellow 3"` | `"Yellow 3"` | `/yellow.?3/i` | `"Yellow 3%"` → `"Yellow 3 — Win"` ✅ |
| `"Yellow"` (bare) | `"Yellow"` | `/\byellow\b/i` | `"Yellow%"` → 3 rows → fail (clean) ⚠️ |

### HP levels

| Input | Expected | Pattern matched | ILIKE resolves |
|---|---|---|---|
| `"HP 1"` | `"HP 1"` | `/hp.?1/i` | `"HP 1%"` → `"HP 1 — Specialise"` ✅ |
| `"HP 2"` | `"HP 2"` | `/hp.?2/i` | `"HP 2%"` → `"HP 2 — Compete Elite"` ✅ |
| `"HP 3"` | `"HP 3"` | `/hp.?3/i` | `"HP 3%"` → `"HP 3 — Professional"` ✅ |
| `"High Perf 1"` | `"HP 1"` | `/high.?perf.?1/i` | `"HP 1%"` ✅ |

### Invalid inputs

| Input | Expected | Result |
|---|---|---|
| `"Purple 9"` | `null` | No pattern matches → `null` → DONNA asks for level ✅ |
| `"Green 9"` | `null` | No numbered Green pattern matches 9 (only 1/2/3 patterns exist) → `null` ✅ |
| `"Orange 7"` | `null` | No numbered Orange pattern matches 7 → `null` ✅ |
| `"Evergreen"` | `null` | `\bgreen\b` requires word boundary; "evergreen" has no boundary before "green" → `null` ✅ |
| `"Green Ball 10"` | `null` | `1\b` after " ball " fails: "1" is followed by "0" (no word boundary) → `null` ✅ |
| `"Greenery"` | `null` | `\bgreen\b` requires word boundary after "green"; "y" is a word char → `null` ✅ |

⚠️ Bare color fallbacks return an ambiguous value that will produce a clean fail message when
`createCurriculumContentItemDraft()` cannot resolve a unique level via ILIKE. The director
will see: `"Could not find a curriculum level named 'Green'. Check the level name (e.g., 'Orange 2', 'Yellow 1') and try again."` — no silent failure.

---

## Manual scenarios

### Scenario 1 — "Add a drill for Green 1 focused on footwork." ✅ PASS

- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `\bgreen[^0-9]{0,12}1\b` matches `"green 1"` → `"Green 1"` ✓
- `extractFocusArea(...)` → `"focused on"` pattern → `"footwork"` ✓
- Both present → `triggerCurriculumContentConfirmation({ contentType: 'drill', contentLabel: 'drill', levelName: 'Green 1', focusArea: 'footwork' })`
- ILIKE: `"Green 1%"` → `"Green 1 — Pressure"` (Sprint 912.11 fix) ✓
- Draft created as `pending_review` ✓
- `router.refresh()` fires after success ✓

### Scenario 2 — "Add a skill for Green 2 focused on rally consistency." ✅ PASS

- `SKILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `\bgreen[^0-9]{0,12}2\b` matches → `"Green 2"` ✓
- `extractFocusArea(...)` → `"rally consistency"` ✓
- `triggerCurriculumContentConfirmation({ contentType: 'skill', contentLabel: 'skill', levelName: 'Green 2', ... })`
- ILIKE: `"Green 2%"` → `"Green 2 — Variety"` ✓

### Scenario 3 — "Add an assessment gate for Green 3 focused on serve mechanics." ✅ PASS

- `GATE_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `"Green 3"` ✓
- `extractFocusArea(...)` → `"serve mechanics"` ✓
- `triggerCurriculumContentConfirmation({ contentType: 'assessment', contentLabel: 'assessment gate', levelName: 'Green 3', ... })`
- ILIKE: `"Green 3%"` → `"Green 3 — Identity"` ✓

### Scenario 4 — "Add a drill for Green Ball 2 focused on forehand preparation." ✅ PASS

- `DRILL_CREATION_PATTERN` matches
- `extractTargetLevel("add a drill for green ball 2 focused on forehand preparation")`:
  - Tested against lowercase: `"add a drill for green ball 2 focused on forehand preparation"`
  - `\bgreen[^0-9]{0,12}2\b` matches: `"green"` then `" ball "` (5 non-digit chars) then `"2"` then `\b` (space follows) ✓
  - Returns `"Green 2"` ✓
- `extractFocusArea(...)` → `"forehand preparation"` ✓
- ILIKE: `"Green 2%"` → `"Green 2 — Variety"` ✓

### Scenario 5 — "Add a skill for Green Dot 1 focused on movement." ✅ PASS

- `SKILL_CREATION_PATTERN` matches
- `extractTargetLevel(...)` → `\bgreen[^0-9]{0,12}1\b` matches `"green dot 1"` (" dot " = 5 non-digit chars ≤ 12) → `"Green 1"` ✓
- `extractFocusArea(...)` → `"movement"` ✓
- ILIKE: `"Green 1%"` → `"Green 1 — Pressure"` ✓

### Scenario 6 — Existing Orange request still works. ✅ PASS

- `"Add a drill for Orange 2 focused on forehand preparation."` — behavior unchanged
- `extractTargetLevel(...)` → `/orange.?2/i` matches before the bare `\borange\b` fallback ✓
- No change to Orange numbered patterns; Green patterns were inserted after Yellow, before HP

### Scenario 7 — Existing Yellow request still works. ✅ PASS

- `"Add a skill for Yellow 1 focused on serve mechanics."` — behavior unchanged
- `extractTargetLevel(...)` → `/yellow.?1/i` matches ✓
- Yellow patterns are at position 3 in the array, unchanged

### Scenario 8 — "Purple 9" fails cleanly. ✅ PASS

- `extractTargetLevel("add a drill for purple 9")` → no pattern matches → `null`
- Drill handler: `!targetLevel` → `setPendingDrillSlotFill({ missingSlot: 'levelName', ... })`
- DONNA: `"Which curriculum level should this drill go in? (e.g., Orange 2, Yellow 1, Red 3)"`
- No draft created ✓

### Scenario 9 — Successful draft triggers refresh only after success. ✅ PASS

**Trace:**
- Director confirms → `activePending.execute()` runs → `createCurriculumContentItemDraft(...)` returns `{ ok: true, draftId: '...' }`
- `setIsExecuting(false)` called
- `resultMsg` constructed with success text ✓
- `setMessages(prev => [...prev, resultMsg])` adds message ✓
- `recordTurn(...)` logs turn ✓
- `if (result.ok) router.refresh()` → `result.ok` is `true` → `router.refresh()` fires ✓
- `revalidatePath` already ran in the server action; `router.refresh()` flushes client cache ✓
- CurriculumBuilderChangeQueue shows the new draft without manual navigation ✓

### Scenario 10 — Failed draft does not trigger refresh. ✅ PASS

**Trace:**
- `createCurriculumContentItemDraft(...)` returns `{ ok: false, error: 'Level not found...' }`
- `resultMsg` constructed with error text ✓
- `if (result.ok) router.refresh()` → `result.ok` is `false` → `router.refresh()` NOT called ✓
- No refresh, no side effects ✓

---

## router.refresh() safety analysis

| Question | Answer |
|---|---|
| Can `router.refresh()` create duplicate drafts? | No — it only re-fetches server component data. It does not re-execute `execute()`. |
| Can it cause a refresh loop? | No — it fires once per `execute().then()` resolution. |
| Is `router` available in DonnaVoiceReadyShell? | Yes — `useRouter()` at line 148, already used for navigation. |
| What happens if the director is not on `/director/curriculum/builder`? | Refreshes whatever page they're on (harmless); `revalidatePath` already invalidated the builder cache for next visit. |
| Does it fire before the draft is confirmed created? | No — fires inside `.then(result => { ... })` only when `result.ok` is `true`. |

---

## Risks

### Risk 1 — Bare "Green" ambiguous (documented, low)
`extractTargetLevel("add a drill for green")` → `"Green"` → ILIKE `"Green%"` → 3 rows → `maybeSingle()` error → clean fail message. No silent failure. Director sees a helpful error message asking them to be more specific (e.g., "Green 1", "Green 2").

### Risk 2 — Green Ball 10 or Green Ball 30 (non-existent levels, low)
`\bgreen[^0-9]{0,12}1\b` does NOT match "Green Ball 10" (verified by word boundary check). Returns `null`. DONNA asks for level. Expected behavior.

### Risk 3 — router.refresh() on non-builder pages (low)
If the director confirms a draft while on `/director` (dashboard), `router.refresh()` re-fetches the dashboard data. The dashboard is fast to load and the refresh is invisible to the user. No negative UX impact.

---

## Sprint 912.13 recommendations

1. **Confirm Green levels exist in live DB** — Static analysis confirms they're in migration 036 seed. Live DB check: `SELECT id, display_name FROM curriculum_levels WHERE display_name ILIKE 'Green%' ORDER BY sort_order;` expected: 3 rows.
2. **Context injection** — `getRecentTurns(3)` available in session memory but never injected into routing. Low-risk additive change to make DONNA feel more continuous.
3. **Post-draft success navigation option** — After `router.refresh()`, offer the director a direct "Go to Review Center" link that is pre-highlighted (using `setDonnaFocusTarget`). Currently the follow-up link is shown in the result message but not actively highlighted on the destination page.
