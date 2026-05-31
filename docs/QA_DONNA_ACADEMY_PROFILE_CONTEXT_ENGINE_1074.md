# QA — Sprint 1074: DONNA Academy Profile Context Engine V1

**Date:** 2026-05-31
**Sprint:** 1074

---

## Test 1 — File exists and compiles

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `src/lib/donna/donnaAcademyProfileContext.ts` exists | File present | |
| 1.2 | `npx tsc --noEmit` passes | Zero TypeScript errors | |
| 1.3 | Exports `AcademyProfileContext` interface | Present | |
| 1.4 | Exports `AcademySetupGap` interface | Present | |
| 1.5 | Exports `AcademySetupGapField` type | Present | |
| 1.6 | Exports `BuildAcademyProfileInput` interface | Present | |
| 1.7 | Exports `buildAcademyProfileFromLiveData` function | Present | |
| 1.8 | Exports `buildEmptyAcademyProfile` function | Present | |
| 1.9 | Exports `getAcademyProfileSummaryText` function | Present | |

---

## Test 2 — AcademyProfileContext interface completeness

| Field | Type | Required? |
|---|---|---|
| `academyId` | `string` | yes |
| `academyName` | `string \| null` | yes |
| `academySlug` | `string \| null` | yes |
| `timezone` | `string \| null` | yes |
| `country` | `string \| null` | yes |
| `directorName` | `string \| null` | yes |
| `activePlayerCount` | `number \| null` | yes |
| `coachCount` | `number \| null` | yes |
| `activeCurriculumVersionName` | `string \| null` | yes |
| `activeCurriculumVersionStatus` | `string \| null` | yes |
| `ballLevelsUsed` | `string[]` | yes |
| `preferences` | `AcademyDonnaPreferences \| null` | yes |
| `parentCommunicationTone` | `'encouraging' \| 'factual' \| 'balanced'` | yes |
| `setupGaps` | `AcademySetupGap[]` | yes |
| `onboardingComplete` | `boolean` | yes |
| `missingFields` | `string[]` | yes |
| `dataSource` | `'live' \| 'partial' \| 'fallback'` | yes |
| `missingDataFallback` | `string` | yes |

---

## Test 3 — buildAcademyProfileFromLiveData behavior

| # | Input | Expected | Pass? |
|---|---|---|---|
| 3.1 | All identity fields provided (name, slug, timezone) | `dataSource === 'live'`, `missingFields` does not include identity fields | |
| 3.2 | Only `academyName` provided, no slug/timezone | `dataSource === 'partial'` | |
| 3.3 | Only `academyId` provided, all else omitted | `dataSource === 'fallback'` | |
| 3.4 | `rawAcademySettings` with all 7 flags = true | `onboardingComplete === true`, `setupGaps` all `isComplete === true` | |
| 3.5 | `rawAcademySettings` with 3 flags = true | `onboardingComplete === false`, 4 gaps with `isComplete === false` | |
| 3.6 | No `rawAcademySettings` | `setupGaps` all `isComplete === false`, `onboardingComplete === false` | |
| 3.7 | `activePlayerCount = 15`, `coachCount = 3` | Fields present in output, not in `missingFields` | |
| 3.8 | `activePlayerCount = null` | `'activePlayerCount'` in `missingFields` | |
| 3.9 | `rawAcademySettings` with `summaryStyle: 'detailed'` | `preferences.summaryStyle === 'detailed'` | |
| 3.10 | No `rawAcademySettings`, no `preferences` | `preferences === null`, `'preferences'` in `missingFields` | |
| 3.11 | `preferences` passed directly | Used as-is, `rawAcademySettings` extraction skipped | |
| 3.12 | `parentCommunicationTone` when preferences are null | Defaults to `'balanced'` | |
| 3.13 | `parentCommunicationTone` when preferences have `parentSummaryTone: 'encouraging'` | `parentCommunicationTone === 'encouraging'` | |

---

## Test 4 — buildEmptyAcademyProfile behavior

| # | Check | Expected | Pass? |
|---|---|---|---|
| 4.1 | All identity fields | All `null` | |
| 4.2 | `ballLevelsUsed` | Empty array `[]` | |
| 4.3 | `preferences` | `null` | |
| 4.4 | `dataSource` | `'fallback'` | |
| 4.5 | `onboardingComplete` | `false` | |
| 4.6 | All 7 `setupGaps` | Present, all `isComplete === false` | |
| 4.7 | `missingFields` | Contains all 11 expected fields | |
| 4.8 | `missingDataFallback` | Non-empty string, honest language | |
| 4.9 | `parentCommunicationTone` | `'balanced'` (default) | |

---

## Test 5 — getAcademyProfileSummaryText output

| # | Profile input | Expected output contains | Pass? |
|---|---|---|---|
| 5.1 | Full profile: name="Dabul Tennis Academy", country="US" | "Academy: Dabul Tennis Academy (US)." | |
| 5.2 | directorName="Brian Dabul" | "Director: Brian Dabul." | |
| 5.3 | activePlayerCount=15, coachCount=3 | "15 active players, 3 coaches." | |
| 5.4 | activeCurriculumVersionName="Orange Ball V2", status="active" | "Curriculum: Orange Ball V2 (active)." | |
| 5.5 | ballLevelsUsed=["Red", "Orange", "Yellow"] | "Ball levels: Red, Orange, Yellow." | |
| 5.6 | parentCommunicationTone="balanced" with preferences set | "Parent communication tone: balanced." | |
| 5.7 | `dataSource === 'fallback'` | "Academy profile not loaded" | |
| 5.8 | academyName=null (no name) | Does NOT include "Academy: null" | |
| 5.9 | onboardingComplete=false, 2 incomplete gaps | "Setup incomplete:" text in output | |
| 5.10 | All fields null (empty profile) | "Academy profile context is not available." | |

---

## Test 6 — Setup gap definitions

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | All 7 `AcademySetupGapField` values covered | `deriveSetupGaps` returns 7 entries | |
| 6.2 | `academy_identity` gap action route | `/director/onboarding/interview` | |
| 6.3 | `players_placement` gap action route | `/director/placement` | |
| 6.4 | Settings key `academy_identity_completed = true` | `isComplete === true` for academy_identity gap | |
| 6.5 | Settings key missing | `isComplete === false` for that gap | |

---

## Test 7 — No behavior regressions

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | Sprint 1073 context-pack lookup unchanged | Works as before | |
| 7.2 | Sprint 1072 context packs unchanged | No modifications | |
| 7.3 | Sprint 1071 navigation fixes unchanged | No modifications | |
| 7.4 | DonnaAssistantButton.tsx unchanged | Not modified | |
| 7.5 | `donnaPageContextRegistry.ts` unchanged | Not modified | |
| 7.6 | `donnaPageContextEngine.ts` unchanged | Not modified | |
| 7.7 | `preferences/academyPreferences.ts` unchanged | Not modified (import only) | |
| 7.8 | `npx tsc --noEmit` passes | Zero new TypeScript errors | |

---

## Acceptance Criteria Summary

- [ ] `AcademyProfileContext` interface exists with all 18 required fields
- [ ] `AcademySetupGap` and `AcademySetupGapField` types exist
- [ ] `buildAcademyProfileFromLiveData` assembles context from optional input correctly
- [ ] `buildEmptyAcademyProfile` returns honest all-null fallback
- [ ] Missing fields are always tracked in `missingFields` — never silently dropped
- [ ] `getAcademyProfileSummaryText` produces concise natural-language summary
- [ ] Summary never includes null field values
- [ ] `dataSource` correctly reflects how much identity data was provided
- [ ] No existing DONNA behavior changed
- [ ] TypeScript passes
