# No Roster Mutation Audit — Sprint 725

**Date:** 2026-05-17
**Sprint:** 725 — No Roster Mutation Audit V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: No automated roster mutations exist in AcademyOS V1.**

No code path creates, deletes, deactivates, or archives a player without an explicit, deliberate director or head coach action. Voice intake, DONNA, and coach wrap-ups cannot create or remove players. All automated signals route through `proposed_actions` as `pending_review`.

Three authorized mutation paths exist:
1. `createPlayerAction` — director-explicit new player form
2. `createPlayerFromApprovedRecommendationAction` — placement workflow (approved proposed_action only)
3. Demo sandbox cleanup — deletes only `[DEMO]%`-prefixed seed records

All three are gated by role checks, `assertNotPreviewMode()`, and academy ownership verification.

---

## 2. Files / Routes Audited

### Player creation paths
- `src/app/director/players/new/createPlayerAction.ts` — new player server action
- `src/app/director/players/new/NewPlayerForm.tsx` — UI for the above
- `src/app/director/review/actions.ts:3674` — `createPlayerFromApprovedRecommendationAction`
- `src/app/director/review/PlacementRecommendationDraftCard.tsx` — UI for placement finalization

### Player deletion / deactivation paths
- `src/app/director/demo/demoSandboxActions.ts` — demo cleanup (scoped to `[DEMO]%` prefix)
- `src/app/director/demo/DemoSandboxControls.tsx` — UI with confirmation modal

### NEVER_AUTOMATIC roster protection
- `src/lib/voice/structureVoiceIntake.ts:290` — `NEVER_AUTOMATIC` constant
- `src/lib/voice/voiceIntakeTypes.ts` — `voice-command-types.ts` `'create_player'` intent type

### Read-only player table access (no mutations)
- `src/lib/backend/players.ts`, `coachWorkspace.ts`, `director.ts` — select only
- `src/app/coach/players/`, `src/app/player/page.tsx`, `src/app/parent/page.tsx` — select only
- All `src/app/api/donna/` routes — select only

---

## 3. Confirmed No-Automated-Roster-Mutation Surfaces

### 3.1 NEVER_AUTOMATIC constant — player creation/removal

`src/lib/voice/structureVoiceIntake.ts:294`

```
'No player created or removed — roster changes require director action'
```

Injected into every voice intake response's `what_would_not_change` field.

**Verdict: Confirmed. Voice cannot create or remove players.**

### 3.2 Voice command types — `create_player` intent

`src/lib/voice/voice-command-types.ts:113` defines `'create_player'` as a voice intent type. However, this type is spec-only — it exists in the intent enum but is not mapped to any execution path in `structureVoiceIntake.ts` or `voiceDestinationRouter.ts`. No route can execute player creation from voice.

**Verdict: Safe. Type defined in spec, no execution path wired.**

### 3.3 DONNA — no player creation

DONNA's draft adapter and command router contain no path to create or delete players. All DONNA player-related actions (observations, level readiness) create `proposed_actions` records.

**Verdict: Confirmed. DONNA cannot mutate the roster.**

### 3.4 Coach wrap-up

Coach wrap-up flows create observations and attendance draft records only. No player create or delete action exists in the wrap-up server actions.

**Verdict: Confirmed. Wrap-up cannot mutate the roster.**

---

## 4. Authorized Roster Mutation Paths

### 4.1 `createPlayerAction` — New Player Form

`src/app/director/players/new/createPlayerAction.ts`

Gates:
- `assertNotPreviewMode()` — blocked in preview/demo mode
- `getSupabaseServer()` — authenticated session required
- Academy membership check: `academy_director` or `head_coach` only
- Input validation: first name, last name, date of birth required

Result: Player inserted with `status: 'pending_placement'` and `is_active: true`. Player is inactive until `finalize_player_placement()` is called through the placement workflow.

**Verdict: Authorized. Director/head_coach only, not automated.**

### 4.2 `createPlayerFromApprovedRecommendationAction` — Placement Finalization

`src/app/director/review/actions.ts:3674`

Gates:
- `assertNotPreviewMode()`
- Authenticated session
- Academy membership check: `academy_director` or `head_coach` only
- `proposed_actions` status check: must be `'approved'` (not pending, not executed)
- Idempotency guard: if `created_player_id` already set in payload, returns existing ID

Triggered only from `PlacementRecommendationDraftCard` after a placement recommendation has been explicitly approved by the director in the review queue.

**Verdict: Authorized. Placement workflow only. Director-approved proposed_action required.**

### 4.3 Demo Sandbox Cleanup — `[DEMO]%` Scoped Delete

`src/app/director/demo/demoSandboxActions.ts:562`

```ts
.from('players')
.delete()
.eq('academy_id', academyId)
.ilike('first_name', '[DEMO]%')
```

Scoped strictly to players whose first name starts with `[DEMO]`. No real player record can be deleted by this path. UI requires explicit confirmation: "I understand this only deletes records labeled as demo/sample data. Real player records will not be affected."

**Verdict: Authorized and scoped. Demo cleanup only. Cannot affect real roster.**

---

## 5. No Player Delete Path for Real Records

No server action or API route deletes a real player record. No `is_active = false` toggle exists in any UI. Players cannot be archived or soft-deleted from any screen. The retention KPI engine notes that `deactivated_at` does not exist in the schema — this is an acknowledged data model gap, not a hidden mutation path.

---

## 6. No Bulk Roster Import in App

`data/player-import/academy_os_player_import_roster.csv` and `docs/PLAYER_IMPORT_PARSER.md` exist as planning documents. No server action, API route, or UI component implements CSV-based bulk player import.

---

## 7. Risky Labels Found

None. All roster-related copy is accurate.

---

## 8. Fixes Made

None.

---

## 9. Final Safety Conclusion

**No automated roster mutations exist in AcademyOS V1.**

- Voice intake, DONNA, and coach wrap-ups cannot create or remove players.
- The three authorized mutation paths are all director/head_coach-explicit, role-gated, and blocked in preview mode.
- No bulk import exists.
- Demo cleanup is scoped to `[DEMO]%`-prefixed records and cannot touch real roster data.

**Sprint 725 production readiness check: PASSED.**
