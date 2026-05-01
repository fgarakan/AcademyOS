# Academy Curriculum Resolution Engine V1

**Sprint:** 71
**Last updated:** 2026-05-01

---

## Purpose

The resolution engine is a deterministic utility that answers: "Which curriculum version and overrides apply for a given academy, template, group, player, or session?"

It is read-only and non-destructive. It never applies overrides, never mutates curriculum rows, and never triggers player level changes.

---

## Location

`src/lib/curriculum/academyCurriculumResolution.ts`

---

## Functions

### `getActiveAcademyCurriculumVersion(supabase, academyId)`

Returns the active `academy_curriculum_versions` row for the given academy, or null if none exists.

**Resolution logic:**
1. Query `academy_curriculum_versions` where `academy_id = academyId` and `status = 'active'`
2. Return the highest version_number row, or null

**Fallback:** null → callers use global curriculum defaults

---

### `resolveAcademyCurriculumContext({ supabase, academyId, templateId?, groupId?, playerId?, sessionId? })`

Returns an `AcademyCurriculumContext` struct:

```typescript
{
  academyId: string
  curriculumVersionId: string | null
  curriculumVersionName: string | null
  usingAcademyVersion: boolean
  fallbackReason: string | null
  levelId: string | null
  levelName: string | null
  applicableOverrides: AcademyOverrideRow[]
  warnings: string[]
}
```

**Resolution rules (V1):**
1. If academy has an active `academy_curriculum_versions` row → `usingAcademyVersion = true`
2. If no active academy version → `usingAcademyVersion = false`, `fallbackReason` set
3. If `templateId` provided and template has `curriculum_level_id` → use that as primary level
4. If no template level and `playerId` provided → try `player_curriculum_states.current_level_id`
5. If no level resolved → `levelId = null`, warning added
6. Applicable overrides loaded via `getAcademyOverridesForContext`

---

### `getAcademyOverridesForContext({ supabase, academyId, curriculumVersionId, levelId?, pathway?, scope? })`

Returns all applied `academy_curriculum_overrides` for the active version.

**V1 limitation:** Level/pathway/scope filters are accepted but not yet applied server-side. Returns all `status = 'applied'` overrides for the version. Callers can filter the result array if needed.

---

## Helper Functions

### `extractOverrideFocusTags(overrides)`

Extracts `parsed_focus` string arrays from override payloads. Used by template block population to bias content selection toward override-specified skills.

### `buildOverrideSummaryLines(overrides)`

Returns up to 3 human-readable summary lines from override payloads. Used in block notes and session notes headers.

---

## Resolution Priority

```
Template curriculum_level_id
  → Player curriculum state (fallback)
    → null (no level — warning surfaced)
```

```
Active academy_curriculum_versions
  → null (fallback to global defaults — reason surfaced)
```

---

## Usage Examples

### In template block population (Sprint 74)

```typescript
import { resolveAcademyCurriculumContext, buildOverrideSummaryLines } from '@/lib/curriculum/academyCurriculumResolution'

const ctx = await resolveAcademyCurriculumContext({ supabase: rawDb, academyId, templateId })
// ctx.curriculumVersionName → "Dabul Academy Curriculum V1"
// ctx.applicableOverrides → [...]
// buildOverrideSummaryLines(ctx.applicableOverrides) → ["• More return-of-serve work at Orange 2"]
```

### In session generation (Sprint 75)

```typescript
const ctx = await resolveAcademyCurriculumContext({ supabase, academyId, templateId: input.templateId })
const prefix = buildSessionCurriculumPrefix(ctx) // → "[Curriculum: Orange 2]\n[Academy Version: Dabul Academy V1]\n"
```

### In player profile (Sprints 72, 77)

```typescript
const ctx = await resolveAcademyCurriculumContext({ supabase, academyId, playerId: params.playerId })
// ctx.usingAcademyVersion → true/false
// ctx.curriculumVersionName → "Dabul Academy Curriculum V1"
```

---

## Security Notes

- `getActiveAcademyCurriculumVersion` accepts `academyId` resolved from the calling server action's authenticated profile — never from client input.
- The resolution utility itself does not authenticate. Callers are responsible for verifying authentication and scoping `academyId` to the authenticated user's profile.
- All queries use the anon/authenticated client with RLS enforced at the DB level.

---

## Known Limitations (V1)

1. **Level/pathway/scope filter not enforced.** `getAcademyOverridesForContext` ignores levelId/pathway/scope filters server-side and returns all applied overrides. V2 should add WHERE clauses for target_id matching.

2. **Group context not used.** Groups have `level_id → academy_levels` (not `curriculum_levels`). Group-based curriculum resolution requires a schema change. See `docs/GROUP_CURRICULUM_ASSIGNMENT_PLAN.md`.

3. **Session context not used.** `sessionId` is accepted but not yet used to look up session-level curriculum metadata.

4. **`player_curriculum_states` fallback.** If the table doesn't exist or has no rows for the player, `levelId` will be null — this is a safe fallback.
