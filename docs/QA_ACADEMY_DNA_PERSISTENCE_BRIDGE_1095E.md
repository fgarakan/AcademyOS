# QA — Academy DNA Persistence Bridge — Sprint 1095E

**Date:** 2026-06-02
**Sprint:** 1095E — Academy DNA Persistence Bridge V1

---

## File existence checks

| Check | Expected | Status |
|---|---|---|
| `src/lib/actions/saveAcademyOperatingLensAction.ts` exists | Yes | ✅ |
| `src/components/onboarding/OnboardingShell.tsx` modified | Yes | ✅ |
| `src/lib/donna/donnaAcademyProfileContext.ts` modified | Yes | ✅ |
| `docs/architecture/ACADEMY_DNA_PERSISTENCE_BRIDGE_1095E.md` exists | Yes | ✅ |
| No migration files created | Confirmed — no new migrations | ✅ |
| No schema changes | Confirmed | ✅ |

---

## Server action — `saveAcademyOperatingLensAction`

| Check | Expected | Status |
|---|---|---|
| File has `'use server'` directive | Yes | ✅ |
| Auth: `supabase.auth.getUser()` called | Yes | ✅ |
| `academy_id` resolved from `profiles` table (server-side) | Yes — never trusted from client | ✅ |
| Director role verified via `academy_memberships` | Yes | ✅ |
| `assertNotPreviewMode()` called | Yes | ✅ |
| Non-destructive merge: reads existing settings before writing | Yes — `...existing, academyOperatingLens: lensPayload` | ✅ |
| Only `academyOperatingLens` key written | Yes — spread preserves all other keys | ✅ |
| `academy_dna` key preserved | Yes — spread does not touch it | ✅ |
| All string inputs sanitized (trim, length-clamp) | Yes — `str()` helper, max 200 chars | ✅ |
| All array inputs sanitized | Yes — `arr()` helper, max 20 items, 100 chars each | ✅ |
| Returns `{ ok: true }` on success | Yes | ✅ |
| Returns `{ ok: false, error: string }` on auth failure | Yes | ✅ |
| Returns `{ ok: false, error: string }` on role check failure | Yes | ✅ |
| Returns `{ ok: false, error: string }` on DB error | Yes | ✅ |
| `rawDb = supabase as any` used for settings update (TS2589 guard) | Yes | ✅ |

---

## OnboardingShell wiring

| Check | Expected | Status |
|---|---|---|
| `useEffect` imported from react | Yes | ✅ |
| `useRef` imported from react | Yes | ✅ |
| `saveAcademyOperatingLensAction` imported | Yes | ✅ |
| `hasPersistedLens = useRef(false)` declared | Yes | ✅ |
| `useEffect` fires only when `currentStep === TOTAL_STEPS - 1` | Yes | ✅ |
| Ref guard prevents duplicate writes | Yes — `hasPersistedLens.current = true` before async call | ✅ |
| Call is fire-and-forget (`void`) | Yes | ✅ |
| No user-facing error display for save failure | Correct — localStorage is fallback | ✅ |
| `localStorage` auto-save behavior unchanged | Yes — `useOnboardingDraftPersistence` untouched | ✅ |
| All draft fields mapped correctly | Yes — primaryGoals→mission, programType→philosophy, etc. | ✅ |

---

## DONNA context — `donnaAcademyProfileContext.ts`

| Check | Expected | Status |
|---|---|---|
| `AcademyOperatingLens` interface exported | Yes | ✅ |
| `operatingLens` field added to `AcademyProfileContext` | Yes, typed `AcademyOperatingLens | null` | ✅ |
| `extractOperatingLens()` helper reads `settings.academyOperatingLens` | Yes | ✅ |
| `extractOperatingLens` returns `null` when key absent | Yes | ✅ |
| `extractOperatingLens` returns `null` when lens has no meaningful data | Yes — checks coachingStyle/developmentPriorities length | ✅ |
| `buildAcademyProfileFromLiveData` populates `operatingLens` | Yes | ✅ |
| `'operatingLens'` added to `missingFields` when absent | Yes | ✅ |
| `buildEmptyAcademyProfile` sets `operatingLens: null` | Yes | ✅ |
| `buildEmptyAcademyProfile` includes `'operatingLens'` in `missingFields` | Yes | ✅ |
| `getAcademyProfileSummaryText` emits operating lens when present | Yes | ✅ |
| Lens summary is compact (caps items, joins with `;`) | Yes — max 2–3 items per field | ✅ |
| Lens summary only included when `profile.operatingLens` is not null | Yes | ✅ |
| Existing summary fields unaffected (name, counts, curriculum, etc.) | Yes — additive only | ✅ |

---

## Safety checks

| Check | Expected | Status |
|---|---|---|
| No parent/player data in operating lens | Confirmed — only academy-level identity fields | ✅ |
| No coach private notes in operating lens | Confirmed — only directorial DNA inputs | ✅ |
| No auto player level movement | Confirmed — not touched | ✅ |
| No external AI calls added | Confirmed | ✅ |
| No new DB tables | Confirmed | ✅ |
| No RLS changes | Confirmed | ✅ |
| `assertNotPreviewMode()` — writes blocked in preview | Yes | ✅ |
| DONNA cannot claim to know lens fields if lens is null | Yes — `extractOperatingLens` returns null; not included in summary | ✅ |
| `academyId` never trusted from client input | Yes — always resolved from `profiles.academy_id` server-side | ✅ |

---

## Known acceptable limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| DONNA context cache TTL is 5 min | Newly persisted lens data takes up to 5 min to appear in DONNA context | Acceptable for V1; cache expires naturally |
| `coachRecapExpectations` and `donnaCommunicationStyle` are empty strings | These fields are not yet captured in `OnboardingDraft` | Future DNA Shell step extension will populate them |
| No user-facing confirmation of DB save from OnboardingShell | Director doesn't see "saved to account" message at activation step | `DirectorContinueSetupPanel` shows "Academy DNA saved to account settings" as the visible confirmation path |

---

## TypeScript

```
npx tsc --noEmit → clean (no output)
```

---

## Regression checks

| Area | Check |
|---|---|
| `useOnboardingDraftPersistence` | Unchanged — localStorage auto-save behavior intact |
| `OnboardingSaveStatus` / `DraftResumeBanner` | Unchanged |
| `DirectorContinueSetupPanel` manual save | Unchanged — still calls `saveAcademyDnaSettings` |
| `saveAcademyDnaSettings` (`academy_dna` key) | Unchanged |
| `donnaOrchestratorAction.ts` | Unchanged — already passes `rawAcademySettings` to profile builder |
| `donnaContextCache` TTL | Unchanged |
| All existing `AcademyProfileContext` fields | Unchanged — `operatingLens` is additive |
| `getAcademyProfileSummaryText` for profile with no lens | Returns unchanged summary (no lens section added) |
