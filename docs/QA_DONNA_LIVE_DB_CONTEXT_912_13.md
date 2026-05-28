# QA — DONNA Live DB Context + Post-Draft Review UX
**Sprint:** 912.13
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.13 implementation
**Code analysed:**
- `src/lib/actions/curriculumDraftActions.ts`
- `src/components/donna/DonnaVoiceReadyShell.tsx`

---

## Part 1 — Existing Live Context Inspection

### Finding: No existing path returned pending draft count

Before Sprint 912.13, `createCurriculumContentItemDraft` returned:
```typescript
{ ok: true; draftId: string }
```

No count of pending drafts was available to DONNA at draft creation time. The count was only available via:
- `CurriculumBuilderChangeQueue` (server component — query at page load time)
- `directorCtx.pendingReviews` (counts `proposed_actions`, not `curriculum_overrides`)
- `/api/donna/brief` (separate API, not connected to DONNA chat)

None of these were accessible at the moment DONNA confirms a draft creation.

### Decision: Add count query inside `createCurriculumContentItemDraft`

**Why inside the action:** The action already has auth, academy_id, and an open Supabase connection. A single extra COUNT query adds minimal latency (~5–10ms). No new server action needed. No new API route needed.

**Query:**
```typescript
.from('academy_curriculum_overrides')
.select('id', { count: 'exact', head: true })
.eq('academy_id', academyId)
.in('status', ['pending_review', 'draft'])
```

This query runs after the INSERT, so the newly created row is included in the count.

**Non-fatal design:** If the count query fails (network, RLS, unexpected error), `pendingDraftCount` defaults to 1. DONNA still surfaces a success message. No silent failure.

---

## Part 2 — Post-Draft Review UX Changes

### Before Sprint 912.13

DONNA success message after drill/gate/skill draft creation:
```
A "forehand preparation" drill draft for Orange 2 has been created. The draft is in your Review Center.
```

**Problems:**
- No safety assurance ("nothing changes until you approve")
- No queue count (director doesn't know how many drafts are now waiting)
- Generic — "The draft is in your Review Center" is the same for every draft regardless of queue state

### After Sprint 912.13

**When pendingDraftCount === 1 (only this draft):**
```
"forehand preparation" drill draft created for Orange 2. Nothing in the curriculum changes until you approve it.
```

**When pendingDraftCount > 1 (multiple drafts):**
```
"forehand preparation" drill draft created for Orange 2. You now have 3 curriculum drafts waiting in the Review Center.
```

**Why this is better:**
- Lead with what was created (concise)
- Always includes safety note OR count note — never silent about what comes next
- Count note implies the review queue state to the director
- "Take me to Review Center" followUp link still shown (unchanged)
- TTS-friendly: no markdown, ≤ 120 chars for the spoken portion

### Change to the CONFIRM block in handleSend()

Before:
```typescript
text: result.ok
  ? `${result.message} The draft is in your Review Center.`
  : `Something went wrong: ${result.message}. Please try again.`,
```

After:
```typescript
text: result.ok
  ? result.message
  : `Something went wrong: ${result.message}. Please try again.`,
```

The `execute()` message is now fully self-contained. The old suffix "The draft is in your Review Center." was removed to avoid double-stating the location ("waiting in the Review Center" is already in the execute() message when count > 1).

---

## Part 2 Scenarios — Post-Draft UX

### Scenario 1 — Single draft creation (count = 1) ✅ PASS

**Setup:** Academy has no pending curriculum drafts.

**Director says:** "Add a drill for Orange 2 focused on forehand preparation" → confirms → `createCurriculumContentItemDraft` inserts → COUNT query returns 1.

**DONNA response:**
> `"forehand preparation" drill draft created for Orange 2. Nothing in the curriculum changes until you approve it.`
> [followUp: "Take me to Review Center"]

**Expected:** ✅ Correct. Single draft, safety note shown.

---

### Scenario 2 — Nth draft creation (count > 1) ✅ PASS

**Setup:** Academy already has 2 pending curriculum drafts.

**Director says:** "Add a gate for Yellow 1 focused on serve mechanics" → confirms → INSERT → COUNT returns 3.

**DONNA response:**
> `"serve mechanics" assessment gate draft created for Yellow 1. You now have 3 curriculum drafts waiting in the Review Center.`
> [followUp: "Take me to Review Center"]

**Expected:** ✅ Correct. Count shown with plural drafts.

---

### Scenario 3 — Count query fails (network error) ✅ PASS

**Setup:** COUNT query throws an exception after INSERT succeeds.

**Trace:**
- `pendingDraftCount` initializes to `1` before the try block
- `catch {}` swallows the error non-fatally
- `execute()` returns `{ ok: true, message: '"forehand preparation" drill draft created for Orange 2. Nothing in the curriculum changes until you approve it.' }`
- DONNA shows the single-draft copy

**Expected:** ✅ Graceful degradation. Draft was created. No fake success. No crash.

---

### Scenario 4 — Draft creation fails (level not found) ✅ PASS (unchanged)

**Setup:** Director says "Add a drill for Purple 9" → `extractTargetLevel` returns `null` → slot-fill → director confirms → `createCurriculumContentItemDraft` called with levelName: "Purple 9" → ILIKE finds no match → returns `{ ok: false, error: '...', blocked: true }`.

**DONNA response:**
> `Something went wrong: Could not find a curriculum level named "Purple 9". Check the level name (e.g., "Orange 2", "Yellow 1") and try again.`

**Expected:** ✅ Existing error path unchanged. No fake success. No count query on failure path.

---

### Scenario 5 — Existing UI panel callers unaffected ✅ PASS

`DonnaAddDrillDraft.tsx`, `DonnaAddAssessmentGateDraft.tsx`, `DonnaAddFitnessExerciseDraft.tsx` check only `if (!result.ok)`. Adding `pendingDraftCount` to the success type is additive — these callers compile fine, they just don't use the new field.

Static verification:
- `DonnaAddDrillDraft.tsx:55` — `if (!result.ok) { setError(...) }` — no change in behavior
- `DonnaAddAssessmentGateDraft.tsx:55` — same pattern — no change
- `DonnaAddFitnessExerciseDraft.tsx:55` — same pattern — no change

**Expected:** ✅ All three existing UI panels work exactly as before.

---

## Part 2B — Null directorCtx Guard

### Before Sprint 912.13

When `directorCtx` was null and director asked "What are my KPIs?", the question fell through all `directorCtx`-gated interceptors silently and landed on the generic fallback:
> "I'm not sure how to answer that yet. Try asking about onboarding, sessions, pending reviews, player attention, or say 'help' for suggestions."

This is technically honest but unhelpful — it doesn't explain WHY DONNA can't answer.

### After Sprint 912.13

A targeted guard fires before the KPI/dashboard interceptors when `directorCtx` is null and the input matches data-dependent patterns:

```typescript
const NEEDS_LIVE_CTX = /\b(kpi|metric|what.{0,10}first|what.{0,10}attention|who.{0,10}attention|advance.{0,20}player|how.{0,10}coaches?)\b/i
```

**DONNA response for matched patterns:**
> "Academy data is still loading. Give it a moment, then ask again — or ask me how any part of AcademyOS works while it loads."

### Pattern coverage

| Input | Matches? | Correct? |
|---|---|---|
| "What are my KPIs?" | ✅ `kpi` | ✅ |
| "What should I do first?" | ✅ `what...first` | ✅ |
| "What needs my attention?" | ✅ `what...attention` | ✅ |
| "Who needs attention?" | ✅ `who...attention` | ✅ |
| "Advance a player" | ✅ `advance...player` | ✅ |
| "How are my coaches?" | ✅ `how...coaches` | ✅ |
| "Explain the curriculum" | ❌ | ✅ (doesn't need directorCtx) |
| "Add a drill" | ❌ | ✅ (doesn't need directorCtx) |
| "What is this page?" | ❌ | ✅ (doesn't need directorCtx) |
| "Help" | ❌ | ✅ (doesn't need directorCtx) |

**Guard does NOT fire for:**
- Curriculum creation flows (safe — no directorCtx needed)
- Page guide questions (safe — uses pathname only)
- System explanations (safe — uses DONNA_SYSTEM_MAP only)
- Short phrases, boundary checks, navigation offers (all safe without ctx)

**Guard fires ONLY for unambiguously live-data-dependent patterns.**

---

## Part 3 — Live DB Verification

### Status: Manual verification required (no direct DB access in this environment)

DB access is not available in the current devcontainer environment. The following static verification confirms correctness from migration analysis. Live verification should be done before the first live deployment.

### Static analysis from migration 036_curriculum_spine.sql (seed data)

Level names confirmed in seed:
```
Red 1 — Discovery, Red 2 — Contact, Red 3 — Consistency
Orange 1 — Rally, Orange 2 — Direction, Orange 3 — Construction
Green 1 — Pressure, Green 2 — Variety, Green 3 — Identity
Yellow 1 — Compete, Yellow 2 — Construct, Yellow 3 — Win
HP 1 — Specialise, HP 2 — Compete Elite, HP 3 — Professional
```

### ILIKE prefix match verification (Sprint 912.11 fix)

All 15 numbered levels use the prefix pattern `display_name ILIKE '${levelName}%'`:

| `extractTargetLevel()` output | ILIKE pattern | DB display_name | Match |
|---|---|---|---|
| `"Red 1"` | `"Red 1%"` | `"Red 1 — Discovery"` | ✅ |
| `"Orange 2"` | `"Orange 2%"` | `"Orange 2 — Direction"` | ✅ |
| `"Green 1"` | `"Green 1%"` | `"Green 1 — Pressure"` | ✅ |
| `"Green 2"` | `"Green 2%"` | `"Green 2 — Variety"` | ✅ |
| `"Green 3"` | `"Green 3%"` | `"Green 3 — Identity"` | ✅ |
| `"Yellow 1"` | `"Yellow 1%"` | `"Yellow 1 — Compete"` | ✅ |
| `"HP 1"` | `"HP 1%"` | `"HP 1 — Specialise"` | ✅ |

### Manual SQL for live verification

Run in Supabase SQL Editor before first live deployment:

```sql
-- 1. Confirm all 15 levels exist
SELECT id, display_name, sort_order 
FROM curriculum_levels 
ORDER BY sort_order;
-- Expected: 15 rows (Red 1–3, Orange 1–3, Green 1–3, Yellow 1–3, HP 1–3)

-- 2. Confirm prefix ILIKE works for each color
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Red 1%';     -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Orange 2%';  -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Green 1%';   -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Green 2%';   -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Green 3%';   -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'Yellow 1%';  -- expect 1 row
SELECT display_name FROM curriculum_levels WHERE display_name ILIKE 'HP 1%';      -- expect 1 row

-- 3. Confirm pending draft count query works
SELECT count(*) 
FROM academy_curriculum_overrides 
WHERE academy_id = '<your-academy-id>'
AND status IN ('pending_review', 'draft');
-- Expected: 0 (fresh DB) or N (existing drafts)

-- 4. Confirm curriculum version exists (required FK for new drafts)
SELECT id, status 
FROM academy_curriculum_versions 
WHERE academy_id = '<your-academy-id>';
-- Expected: at least 1 row with status = 'active' or 'draft'
```

### Bare color fallbacks (expected fail behavior)

| Input | ILIKE | Result |
|---|---|---|
| `"Red"` | `"Red%"` | Multiple rows → `maybeSingle()` error → clean fail message |
| `"Orange"` | `"Orange%"` | Multiple rows → clean fail |
| `"Green"` | `"Green%"` | Multiple rows → clean fail |

This is correct. The director sees "Could not find a curriculum level named 'Green'. Check the level name..." — no silent failure.

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations changed | ✅ |
| No `execute_curriculum_override()` call | ✅ |
| No `proposed_actions` usage | ✅ |
| No auto-approval | ✅ — all drafts remain `pending_review` |
| No fake success states | ✅ — count defaults to 1, never fabricated |
| Sprint 904 approve/reject actions unchanged | ✅ — not touched |
| Sprint 912.3–912.12 behavior preserved | ✅ — all existing routing unchanged |
| New server action added | ✅ None — count query added to existing action |
| `createCurriculumContentItemDraft` still writes only to `academy_curriculum_overrides` | ✅ |
| Count query is read-only | ✅ — `.select('id', { count: 'exact', head: true })` |

---

## Files Changed

- **Modified `src/lib/actions/curriculumDraftActions.ts`:**
  - `CreateContentItemDraftResult` success type extended with `pendingDraftCount: number`
  - After INSERT + audit log, queries `academy_curriculum_overrides` count for `status IN ('pending_review', 'draft')`
  - Non-fatal: count defaults to 1 on query failure
  - Returns `{ ok: true, draftId, pendingDraftCount }` instead of `{ ok: true, draftId }`

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - `triggerCurriculumContentConfirmation`: `execute()` now uses `result.pendingDraftCount` to build the success message — includes count note when N > 1, safety note when N === 1
  - CONFIRM block: `${result.message} The draft is in your Review Center.` → `result.message` (message is now self-contained)
  - Added `NEEDS_LIVE_CTX` guard before KPI interceptor — fires when `directorCtx` is null and question matches data-dependent pattern

---

## Risks

### Risk 1 — Count query timing (very low)
The COUNT query runs after the INSERT. In theory, if another concurrent request creates or deletes a draft between the INSERT and the COUNT, the count could be slightly off. In practice, this is irrelevant — the director is the only one creating drafts in their academy, and the count is advisory (not used for any logic, only for DONNA's message copy).

### Risk 2 — `pendingDraftCount` in non-DONNA callers (none)
UI panel callers (`DonnaAddDrillDraft`, etc.) do not use `pendingDraftCount`. They check only `!result.ok`. TypeScript verified: no compiler errors introduced.

### Risk 3 — NEEDS_LIVE_CTX pattern false positives (very low)
The pattern is conservative. Could `"how are my coaches"` trigger when directorCtx IS available? No — the guard checks `!directorCtx` first. If context is available, the guard never fires; the question routes to `tryAnswerCoachHealthQuestion()` as normal. The guard only fires when context is genuinely absent.

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.13 changes.

---

## Sprint 912.14 Recommendations

1. **Page guide mode intent routing** — `whereAmI()`, `whatCanYouHelpWith()`, `whatActionsRequireApproval()` exist but are not wired to explicit "explain this page" / "what can I do here?" patterns in `handleSend()`. This is the highest-leverage remaining gap for DONNA's Page Guide Mode category.
2. **Page Intelligence Map extension** — add `primaryGoal`, `recommendedNextStep`, `availableDonnaCommands` fields to `DonnaPageCapabilityMap`. Additive, non-breaking.
3. **Onboarding page awareness** — on `/director/onboarding`, DONNA greets with setup progress and available next step (from `directorCtx.isFirstTimeSetup`).
