# Sprint 381 — Director DNA Settings Write Back V1

**Date:** 2026-05-19
**Branch:** main

---

## Does academies.settings Exist?

Yes. Confirmed in `src/lib/supabase/database.types.ts`:

```ts
academies: {
  Row: {
    settings: Json    // JSONB — non-nullable
    ...
  }
  Update: {
    settings?: Json   // writable
    ...
  }
}
```

Write-back is safe and implemented.

---

## Exact Settings Key Written

`settings.academy_dna` — a scoped object under the existing JSONB field.

`settings.academy_dna_completed_at` — ISO timestamp companion key.

No other existing settings keys are touched.

---

## Server Action Created

**`src/app/director/actions.ts`** — `saveAcademyDnaSettings(input: AcademyDnaInput)`

Pattern mirrors `src/app/director/settings/updateAcademySettingsAction.ts` exactly:

1. `assertNotPreviewMode()` — blocks writes in preview sessions
2. `getSupabaseServer()` + `supabase.auth.getUser()` — auth
3. `profiles.academy_id` — academy resolved from authenticated profile (never from client)
4. `academy_memberships.role === 'academy_director'` — role gate
5. Input sanitized with local helpers (str/arr/num/bool) before touching DB
6. Existing `academies.settings` read first
7. Spread-merge: `{ ...existing, academy_dna: payload }`
8. Update `settings` column only
9. `revalidatePath('/director')`

---

## How Settings Merge Preserves Existing Keys

```ts
const existing = (current?.settings as Record<string, unknown>) ?? {}

const merged = {
  ...existing,                            // all previous keys preserved
  academy_dna: dnaPayload,               // new DNA object added/replaced
  academy_dna_completed_at: timestamp,   // companion timestamp
}
```

Keys like `academy_identity_completed`, `curriculum_setup_v2`, `director_interview_completed` etc. are untouched.

---

## Fields Persisted (academy_dna payload)

| Section | Fields |
|---|---|
| `academy_basics` | academy_name, academy_model, locations_count, age_groups |
| `coaching_philosophy` | coaching_styles (max 3) |
| `coach_communication` | primary_communication, secondary_communication |
| `session_design` | session_blocks (max 10) |
| `player_development` | development_priorities (max 5) |
| `parent_communication` | parent_styles (max 10), parent_visibility_rules (5 bool keys) |
| `donna_behavior_rules` | draft_first, parent_safe_only, no_auto_sends, no_auto_level_movement (all hardcoded true) |
| metadata | source, version, completed_at |

---

## Fields Intentionally Excluded

| Field | Reason |
|---|---|
| `classTemplateDraft` | No templates created during DNA setup |
| `fitnessTemplateDraft` | No templates created during DNA setup |
| `playerUploadDraft` | No players imported during DNA setup |
| `coachesDraft` | No coaches added during DNA setup |
| `curriculumStartingPoint` / `curriculumFocusLevels` | Curriculum managed separately via curriculum setup flow |
| `setupMode` | Internal onboarding UI state only |
| `portalPreviewViewed` | Internal flag, not meaningful for settings |
| `playerMissionStyle` | No longer in the 10-step DNA flow |
| `programType` / `primaryGoals` | Unused fields from the pre-Sprint-379 flow |

---

## Input Sanitization

The server action sanitizes all input before writing:
- `str(v, max)` — trims and slices strings, returns `''` for non-strings
- `arr(v, max)` — filters to string[] only, trims each element, slices to max count
- `num(v, min, max)` — clamps integers, returns default `1` for non-numbers
- `bool(v)` — strictly `v === true` only

The `parentVisibilityRules` object is NOT passed as a generic Record — individual boolean fields are typed explicitly in `AcademyDnaInput` to prevent arbitrary key injection.

---

## localStorage Fallback Behavior

The `DirectorContinueSetupPanel` component:
- Reads draft from `academyos_onboarding_draft_v2` on mount
- Checks `academyos_dna_writeback_complete` to avoid showing the save button when already saved
- On successful save, sets `academyos_dna_writeback_complete = 'true'`
- If save fails, shows: "Draft still safe in this browser" + Retry button
- Draft is NOT deleted after save — the local draft remains available

---

## Save UX (DirectorContinueSetupPanel)

| State | UI shown |
|---|---|
| `idle` | "Save Academy DNA" button + brief copy |
| `saving` | Animated pulse dot + "Saving DNA..." |
| `saved` | Green check + "Academy DNA saved to academy settings" |
| `error` | Orange alert + "Draft still safe in this browser" + Retry button |

Save is triggered only by explicit button click — never auto-triggered on render.

---

## Limitations

- DNA is saved to `academies.settings` — not a dedicated table. Querying it requires JSONB path operators.
- The `isAcademyLive` flag in `director/page.tsx` currently checks for players/templates/sessions — it does NOT read `academy_dna`. That logic is untouched.
- If the director refreshes before saving, the draft is still in localStorage and the Save button reappears.
- `revalidatePath('/director')` is called on success so the page re-renders with fresh server data.

---

## Next Sprint Recommendation

**Sprint 382 — Director DNA Status Badge V1**

Read `settings.academy_dna` on the server side in `director/page.tsx` and show a small "Academy DNA on file" status indicator in the existing Academy Setup section, so the dashboard reflects DNA completion without relying on localStorage. This bridges the gap between the localStorage-based panel and the server-rendered dashboard state.

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
