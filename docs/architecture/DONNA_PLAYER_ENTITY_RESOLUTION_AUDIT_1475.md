# DONNA Player Relationship Resolution — Audit
**Sprint:** Mega Sprint 1475–1504 — DONNA Player Relationship Resolution V1
**Date:** 2026-06-09
**Status:** COMPLETE — implementation follows this document

---

## Problem statement

When DONNA guides a director through the `player_onboarding_completion` workflow, she
collects:

- Player name and age/DOB — saved correctly on creation
- Assigned coach (free text, e.g. "Coach Sarah") — **never resolved to a UUID, never saved**
- Assigned group (free text, e.g. "Orange Ball 2") — **never resolved to a UUID, never saved**
- Recommended level (free text, e.g. "Orange 2") — **never resolved to a UUID, never saved**

The workflow step fields `assigned_coach`, `assigned_group`, and `recommended_level` appear in
the review banner but `createPlayerDonnaAction` only receives and saves `firstName`, `lastName`,
`dateOfBirth`, `notes`, and `planId`. All relationship data is silently discarded.

This is logged as **BLOCKER 6** (D7 = 6/10).

---

## Schema support analysis

### Primary coach

```
players.primary_coach_id: string | null
FK: players_primary_coach_id_fkey → profiles(id)
```

**Schema exists. Can be wired without migration.**

### Secondary coach

No `players.secondary_coach_id` column exists.
No `player_coaches` junction table exists.

**Schema does NOT support secondary coach. No migration will be created in this sprint.**
Secondary coach text will be preserved in the audit log payload as metadata; the limitation
is documented in warnings returned to the client.

### Group assignment

```
players.current_group_id: string | null
FK: players_current_group_id_fkey → groups(id)
```

**Schema exists. Can be wired without migration.**

### Curriculum level assignment

```
players.current_level_id: string | null
FK: players_current_level_id_fkey → curriculum_levels(id)
```

**Schema exists. Can be wired without migration.**

---

## Entity context gaps (BLOCKER 6 root cause)

### Gap 1 — Coaches always empty in entity context

`buildEntityContext()` in `donnaEntityContextLoader.ts` explicitly sets `coaches: []`:

```typescript
export function buildEntityContext(slice: EntityContextSlice): AcademyEntityContext {
  return {
    coaches:     [],   // ← ALWAYS EMPTY
    ...
  }
}
```

The `resolveCoaches()` function in `donnaEntityResolver.ts` has full matching logic
(exact display name, "Coach [Name]" prefix, first/last name token matching) but it
receives an empty array every time.

**Fix:** Add `loadCoachesSummary()` to `extendedContextLoaders.ts` and wire it into
`donnaEntityContextAction.ts` + `buildEntityContext()`.

### Gap 2 — Curriculum levels not in entity context

`curriculum_levels` is a global table (no `academy_id`). Currently referenced only via
UUIDs stored on players/groups — never loaded as a list into entity context. The static
alias patterns in `donnaEntityResolver.ts` return display names but not UUIDs.

**Fix:** Add `loadCurriculumLevelsSummary()` to `extendedContextLoaders.ts`. Load it in
`createPlayerDonnaAction.ts` for resolution at save time.

### Gap 3 — Groups loaded but not used for resolution at save time

`GroupSummary[]` is loaded into entity context (brain Q&A works). However,
`createPlayerDonnaAction.ts` never reads the entity context — it runs independently.

**Fix:** Load groups fresh inside the action for resolution.

---

## Current player creation flow (pre-sprint)

```
DONNA collects answers in plan
  ↓
handleDonnaConfirm() reads:
  payload.answers['player_name']     → firstName, lastName
  payload.answers['player_age']      → dateOfBirth
  payload.answers['intake_notes']    → notes
  — IGNORED: assigned_coach, assigned_group, recommended_level —
  ↓
createPlayerDonnaAction({ firstName, lastName, dateOfBirth, notes, planId })
  ↓
INSERT players (first_name, last_name, date_of_birth, notes, status='pending_placement')
  primary_coach_id = null  ← always null
  current_group_id = null  ← always null
  current_level_id = null  ← always null
```

---

## Target flow (post-sprint)

```
DONNA collects answers in plan
  ↓
handleDonnaConfirm() reads:
  payload.answers['player_name']           → firstName, lastName
  payload.answers['player_age']            → dateOfBirth
  payload.answers['intake_notes']          → notes
  payload.answers['assigned_coach']        → assignedCoachText  ← NEW
  payload.answers['assigned_group']        → assignedGroupText  ← NEW
  payload.answers['recommended_level']     → recommendedLevelText  ← NEW
  ↓
createPlayerDonnaAction({ ..., assignedCoachText, assignedGroupText, recommendedLevelText })
  ↓ (server)
  Load coaches from academy_memberships + profiles
  Load groups from groups
  Load curriculum levels from curriculum_levels
  resolvePlayerAssignments(textInputs, ctx)
  ↓
  If any field is ambiguous:
    return { ok: false, disambiguationRequired: [{ field, inputText, options }] }
  ↓
  If clean:
  INSERT players (
    primary_coach_id = resolvedCoachId | null,
    current_group_id = resolvedGroupId | null,
    current_level_id = resolvedLevelId | null,
    ...
  )
  audit_log payload includes: original text labels + resolution method + confidence
```

---

## Resolution logic — per field

### Primary coach

| Input pattern | Strategy | Threshold | Outcome |
|---|---|---|---|
| "head coach" | Match first `role=head_coach` in roster | 0.85 | Resolved if unique |
| "Coach Sarah" | "Coach [Name]" prefix → first name match | 0.90 | Resolved |
| "Coach Sarah Smith" | Full display name substring match | 0.95 | Resolved |
| "Sarah" | First name token match (>2 chars) | 0.68 | Resolved if unique |
| "Smith" | Last name token match (>2 chars) | 0.62 | Resolved if unique |
| Multiple high matches | — | Any | Ambiguous → director must choose |
| No match | — | 0 | Unresolved → null, logged in warnings |

### Secondary coach

Schema limitation: `players.secondary_coach_id` does not exist; no `player_coaches` junction.
Text label preserved in audit log payload. Director informed via warning in result.
**No UUID resolution attempted for secondary coach in V1.**

### Group

| Input pattern | Strategy | Threshold | Outcome |
|---|---|---|---|
| "Orange Ball 2" | Exact normalised match | 0.92 | Resolved |
| "orange 2" | All name tokens present in input | 0.75 | Resolved if unique |
| "orange" | Partial single token match | 0.55 | Resolved if unique |
| Multiple matches | — | Any | Ambiguous → director must choose |
| No match | — | 0 | Unresolved → null, logged in warnings |

### Curriculum level

| Input pattern | Strategy | Threshold | Outcome |
|---|---|---|---|
| "Orange Ball 2" | Full display name match vs curriculum_levels table | 0.95 | Resolved |
| "orange ball 2" / "orange 2" | All display name tokens present in input | 0.80 | Resolved if unique |
| Multiple matches | — | Any | Ambiguous → director must choose |
| No match | — | 0 | Unresolved → null, logged in warnings |

**Important:** Resolution matches against `curriculum_levels.display_name` from the DB —
not against hardcoded alias strings. This ensures UUID fidelity regardless of key naming.

---

## Disambiguation protocol

When `resolvePlayerAssignments()` returns any `ambiguousFields`:
1. `createPlayerDonnaAction` returns `{ ok: false, disambiguationRequired: [...] }` — not an error
2. `NewPlayerForm.tsx` renders a disambiguation panel inside the review banner
3. Director selects one option per ambiguous field
4. Client re-calls `createPlayerDonnaAction` with explicit ID overrides + original text labels
5. Action skips resolution for fields with override IDs → inserts directly

Director is never bypassed. Never silently picks.

---

## Files changed in this sprint

| File | Change |
|---|---|
| `src/lib/donna/extendedContextLoaders.ts` | Add `CoachContextSummary`, `CurriculumLevelContextSummary`, `loadCoachesSummary()`, `loadCurriculumLevelsSummary()` |
| `src/lib/donna/entity/donnaEntityContextLoader.ts` | Add `coaches` to `EntityContextSlice`; wire through `buildEntityContext()` |
| `src/app/director/_actions/donnaEntityContextAction.ts` | Load coaches in parallel; pass to `buildEntityContext()` |
| `src/lib/donna/playerCreation/donnaPlayerAssignmentResolver.ts` | New file — `resolvePlayerAssignments()` + types |
| `src/app/director/players/new/createPlayerDonnaAction.ts` | Extend params; load context; run resolver; save IDs; return disambiguation |
| `src/app/director/players/new/NewPlayerForm.tsx` | Extract text labels from plan; pass to action; handle disambiguation UI |

---

## Known V1 limitations

1. **Secondary coach not saveable** — `players` table has only `primary_coach_id`. Secondary coach text
   is preserved in audit log but no UUID is stored. Schema migration deferred.

2. **Curriculum levels must exist in DB** — Resolution requires `curriculum_levels.display_name` to
   match DONNA's collected text. If the academy has no curriculum levels seeded, `currentLevelId`
   will always be null (warns, does not fail).

3. **Coaches must be active members** — Only `academy_memberships.is_active = true` + `role in
   ['head_coach', 'coach']` are loaded. Deactivated coaches are invisible to resolution.

4. **First name collision** — If two coaches share a first name (e.g., "Sarah Chen" and "Sarah Kim"),
   `"Coach Sarah"` returns an ambiguous result. Director must disambiguate.

5. **Group assignment at creation vs onboarding** — Saving `current_group_id` at creation bypasses
   the `onboardingPlacementAction` draft/approval flow. The V1 implementation sets the field directly.
   Full placement draft flow remains available via the onboarding stepper for post-creation placement.
