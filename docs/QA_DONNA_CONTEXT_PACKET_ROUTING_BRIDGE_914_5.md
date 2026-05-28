# QA — DONNA Context Packet Routing Bridge V1
**Sprint:** 914.5
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Server Action Added

**`getDonnaWorkingMemoryForSession(input)`** in `donnaConversationActions.ts`:
- Input: `{ sessionId: string, memoryKey: string }`
- Resolves auth from `getSupabaseServer()`
- Queries `donna_working_memory` via `(db as any)` (not in generated types)
- RLS scopes response to authenticated user's accessible sessions
- Respects `expires_at` TTL in the result row
- Returns `{ ok: true, data: Record<string, unknown> | null }`
- Returns `{ ok: true, data: null }` when key does not exist or is expired
- Never throws — all errors return `{ ok: false, error: string }`
- Read-only

---

## Backend Memory Restoration

**Trigger:** Session init `useEffect([donnaRole])` — after `getOrCreateDonnaSession()` succeeds.

**Key restored:** `last_curriculum_draft`

**Validation rules (all must pass before restoring):**

| Check | Rule |
|---|---|
| `levelName` | `typeof === 'string'` AND non-empty |
| `focusArea` | `typeof === 'string'` AND non-empty |
| `contentLabel` | `typeof === 'string'` AND non-empty |
| `contentType` | `typeof === 'string'` AND non-empty |
| `storedAt` | `typeof === 'number'` |
| TTL check | `Date.now() - storedAt <= LAST_CURRICULUM_DRAFT_TTL_MS` (10 minutes) |
| In-process guard | `getLastCurriculumDraftAttempt() === null` before AND after the async gap |

Any validation failure → silent skip (no error, no message to director).

**Guard against overwriting fresh in-process state:**
- Checked BEFORE the async `getDonnaWorkingMemoryForSession()` call
- Checked AGAIN after the async gap (component may have updated)
- If either check finds existing in-process state → skip restoration

**What is called on success:** `setLastCurriculumDraftAttempt({ levelName, focusArea, contentLabel, contentType })`

---

## Routing Behavior Changed

| Scenario | Before Sprint 914.5 | After Sprint 914.5 |
|---|---|---|
| "Same for Orange 3" after page reload | Fallback: "What would you like to create for Orange 3?" (no recent context) | If `last_curriculum_draft` backend memory is valid and fresh: triggers confirmation with stored focus and type |
| "Change the focus to footwork" after reload | Same fallback | Same: if backend memory valid, triggers confirmation with stored level |

**Key: the change is additive.** If in-process memory has the context (no reload), existing behavior is unchanged. Backend restore is a fallback only.

---

## Routing Behavior Intentionally Unchanged

- 34-interceptor routing pipeline: unchanged
- KPI / dashboard priority answers: unchanged
- Director brief / ranking engine: unchanged
- Curriculum draft execution itself: unchanged
- Sprint 912.15 follow-up logic (`DRAFT_SAME_FOR`, `DRAFT_CHANGE_FOCUS`): unchanged — these now have a restored in-process value to work with after reload

---

## Context Debug Update

When `last_curriculum_draft` is in `pkt.workingMemoryKeys`:
```
The context packet is assembled for every message. I am actively using persisted curriculum 
draft context for follow-up commands like "same for Orange 3". The main routing pipeline does 
not yet use this packet — that comes in the next sprint.
```

When `last_curriculum_draft` is NOT in keys:
```
The context packet is assembled for every message. The main routing pipeline does not yet use 
this packet — that comes in the next sprint.
```

---

## Failure Behavior

| Failure point | Effect |
|---|---|
| `getOrCreateDonnaSession()` fails | `sessionIdRef.current = null`; restoration skipped; in-process only |
| `getDonnaWorkingMemoryForSession()` returns `{ ok: false }` | Silent skip; in-process only |
| Memory value is null | Silent skip |
| Memory value fails validation | Silent skip |
| Memory is expired (TTL) | Silent skip |
| In-process memory already set | Skip restoration (guard) |
| Any exception | `.catch(() => {})` — non-fatal |

---

## Manual QA Scenarios

### Scenario 1 — Curriculum draft persists after session ✅ PASS (static)

"Add a drill for Orange 2 focused on forehand preparation" → `triggerCurriculumContentConfirmation` → `setLastCurriculumDraftAttempt(...)` + `upsertDonnaMemory({ memoryKey: 'last_curriculum_draft', memoryValue: { levelName: 'Orange 2', focusArea: 'forehand preparation', contentLabel: 'drill', contentType: 'drill', storedAt: ... } })` ✅

### Scenario 2 — last_curriculum_draft stored ✅ PASS (static)

Via `triggerCurriculumContentConfirmation` → `upsertDonnaMemory` (Sprint 914.3). Value is safe POJO: no functions, no closures. ✅

### Scenario 3 — Route change and restore ✅ PASS (static)

After page reload or route change:
- `donnaRole` changes → `useEffect([donnaRole])` fires
- `getLastCurriculumDraftAttempt()` returns null (in-process cleared by reload)
- `getDonnaWorkingMemoryForSession()` returns stored value
- Validation passes → `setLastCurriculumDraftAttempt({ levelName: 'Orange 2', ... })` called
- Next "Same for Green 2" → finds `recentDraft` → triggers confirmation ✅

### Scenario 4 — "Same for Green 2" with restored context ✅ PASS (static)

After restoration: `getLastCurriculumDraftAttempt()` returns `{ levelName: 'Orange 2', focusArea: 'forehand preparation', ... }`. `DRAFT_SAME_FOR.test("Same for Green 2")` → true. `extractTargetLevel("Same for Green 2")` → "Green 2". `triggerCurriculumContentConfirmation({ contentType: 'drill', contentLabel: 'drill', levelName: 'Green 2', focusArea: 'forehand preparation', rawInput: 'Same for Green 2' })` ✅

### Scenario 5 — Context debug shows draft usage ✅ PASS (static)

After `last_curriculum_draft` is in `pkt.workingMemoryKeys`: debug shows "I am actively using persisted curriculum draft context for follow-up commands". ✅

### Scenario 6 — Missing memory graceful fallback ✅ PASS (static)

`getDonnaWorkingMemoryForSession()` returns `{ ok: true, data: null }` → guard fires at validation → `setLastCurriculumDraftAttempt` NOT called → existing "What would you like to create for X?" fallback fires. ✅

### Scenario 7 — Malformed memory ignored ✅ PASS (static)

If `raw.levelName` is a number or missing: validation check `typeof raw.levelName === 'string' && raw.levelName` returns false → `return` → no restoration. ✅

### Scenario 8 — Fresh in-process state not overwritten ✅ PASS (static)

If `getLastCurriculumDraftAttempt()` returns a non-null value before the async call: `if (getLastCurriculumDraftAttempt() !== null) return` → skip. Second check after async gap provides additional protection. ✅

### Scenario 9 — No official curriculum mutation ✅ PASS

`getDonnaWorkingMemoryForSession` is read-only. Restoration only sets the in-process `lastCurriculumDraftAttempt` ref. No DB write. No curriculum mutation. ✅

### Scenario 10 — No executable function serialized or restored ✅ PASS

`last_curriculum_draft` contains only: `{ levelName, focusArea, contentLabel, contentType, storedAt }`. `execute()` closure is never stored or restored. ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations added | ✅ |
| No curriculum execution changes | ✅ |
| No unsafe mutations | ✅ — `getDonnaWorkingMemoryForSession` is read-only |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ |
| Sprint 904 untouched | ✅ |
| `donnaChatSessionMemory.ts` untouched | ✅ |
| Validation before restoration | ✅ — 7 validation checks |
| In-process guard (double-checked) | ✅ |
| No executable function restored | ✅ |
| Failure is silent and non-fatal | ✅ |
| TypeScript: 0 errors | ✅ |
