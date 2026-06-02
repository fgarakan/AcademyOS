# Academy DNA Persistence Bridge — Sprint 1095E

**Date:** 2026-06-02
**Sprint:** 1095E — Academy DNA Persistence Bridge V1

---

## Problem (from Sprint 1095D audit)

The 10-step DNA Shell (`OnboardingShell`) captures rich director input across 9 substantive steps:
coaching styles, development priorities, session design, parent communication preferences,
curriculum starting point, primary goals, program type, and player mission style.

Every answer was saved to `localStorage` key `academyos_onboarding_draft_v2` in real time.
**None of it was saved to the database.** DONNA had no access to any of it.

The older sub-route interview (7 freetext fields → `academies.settings`) was separate and sparse.
The `DirectorContinueSetupPanel` on the director dashboard offered a manual "Save Academy DNA" button,
but it relied on the director discovering and clicking it — and only mapped a subset of fields.

DONNA's context summary emitted: academy name, director name, roster counts, curriculum version,
ball levels, DONNA preferences, and setup gaps. It contained no coaching philosophy, no development
priorities, no parent communication style, no curriculum preference, no mission.

---

## Solution

### 1. New server action — `saveAcademyOperatingLensAction`

**File:** `src/lib/actions/saveAcademyOperatingLensAction.ts`

- `'use server'` — auth → director role check (server-side) → read existing settings → non-destructive merge
- Writes to `academies.settings.academyOperatingLens` only — no other keys touched
- Fields persisted:
  - `mission` — from `OnboardingDraft.primaryGoals`
  - `playerDevelopmentPhilosophy` — from `OnboardingDraft.programType`
  - `coachingStyle` — from `OnboardingDraft.coachingStyles`
  - `developmentPriorities` — from `OnboardingDraft.developmentPriorities`
  - `curriculumPreference` — from `OnboardingDraft.curriculumStartingPoint`
  - `parentCommunicationStyle` — from `OnboardingDraft.parentStyles`
  - `coachRecapExpectations` — optional; empty string when not yet captured
  - `donnaCommunicationStyle` — optional; empty string when not yet captured
  - `playerMissionStyle` — from `OnboardingDraft.playerMissionStyle`
  - `setupMode` — from `OnboardingDraft.setupMode`
  - `savedAt`, `source`, `version` — provenance metadata
- All string/array inputs sanitized (trim, length clamp) before write
- `academyId` always resolved server-side from authenticated profile — never trusted from client

### 2. OnboardingShell auto-persist

**File:** `src/components/onboarding/OnboardingShell.tsx`

A `useEffect` fires once (ref-guarded by `hasPersistedLens`) when `currentStep === TOTAL_STEPS - 1`
(the activation/final step). It calls `saveAcademyOperatingLensAction` with the current draft.

- **Fire-and-forget** — no user-facing feedback on success or failure
- `localStorage` behavior is unchanged — it remains the primary draft store
- `DirectorContinueSetupPanel` manual save path still works as a fallback
- The ref guard prevents duplicate writes if the director navigates back and forward

### 3. DONNA context — `donnaAcademyProfileContext.ts`

**File:** `src/lib/donna/donnaAcademyProfileContext.ts`

New additions:
- `AcademyOperatingLens` interface (exported) — typed shape of `academyOperatingLens` from settings
- `operatingLens: AcademyOperatingLens | null` field on `AcademyProfileContext`
- `extractOperatingLens()` internal helper — reads `settings.academyOperatingLens`, returns null if absent or empty
- `buildAcademyProfileFromLiveData()` — now populates `operatingLens`; adds `'operatingLens'` to `missingFields` when absent
- `buildEmptyAcademyProfile()` — sets `operatingLens: null`, includes `'operatingLens'` in `missingFields`
- `getAcademyProfileSummaryText()` — emits compact "Operating lens: coaching: ...; priorities: ...; parent style: ...; curriculum preference: ...; mission: ...; player mission style: ..." when lens is present

The lens summary is intentionally token-efficient: it caps each list at 2–3 items and joins with `;` rather than emitting multi-sentence blocks.

---

## Data flow

```
OnboardingShell (client)
  → localStorage (every draft change, unchanged)
  → saveAcademyOperatingLensAction (once, on activation step, fire-and-forget)
      → academies.settings.academyOperatingLens (DB write, non-destructive merge)

donnaOrchestratorAction (per DONNA turn, server-side)
  → cachedFetch(academyId, ACADEMY_PROFILE, 5min)
      → academies.settings (DB read)
  → buildAcademyProfileFromLiveData({ rawAcademySettings })
      → extractOperatingLens(settings)    ← new
  → getAcademyProfileSummaryText(profile) ← now includes operating lens
  → injected as "## Academy Context" in DONNA system prompt
```

---

## Storage shape

`academies.settings.academyOperatingLens`:

```json
{
  "source": "director_onboarding_shell",
  "version": 1,
  "savedAt": "2026-06-02T...",
  "mission": ["competitive-pathway", "player-development"],
  "playerDevelopmentPhilosophy": "competition-pathway",
  "coachingStyle": ["player-led", "structured-progression"],
  "developmentPriorities": ["footwork", "rally-consistency", "match-play"],
  "curriculumPreference": "itf-pathway",
  "parentCommunicationStyle": ["outcome-focused", "milestone-updates"],
  "coachRecapExpectations": "",
  "donnaCommunicationStyle": "",
  "playerMissionStyle": "challenge-based",
  "setupMode": "guided-setup"
}
```

Existing `academies.settings` keys preserved:
- `academy_dna` — written by `saveAcademyDnaSettings` (unchanged)
- `academy_dna_completed_at` — (unchanged)
- `academy_identity_completed` and other completion flags — (unchanged)
- `logo_url`, `website`, `description` — (unchanged)
- `summaryStyle`, `parentSummaryTone` and other DONNA preferences — (unchanged)

---

## DONNA context TTL limitation

`donnaOrchestratorAction.ts` caches `academies.settings` for 5 minutes
(`CACHE_TTL_MS.ACADEMY_PROFILE`). After the DNA Shell persists the operating lens,
DONNA will not include it in context until the cache expires (up to 5 minutes) or the
server restarts. This is an **acceptable known limitation** for V1.

---

## What is intentionally not changed

- No migrations, no schema changes, no new DB tables
- No permissions or RLS changes
- No parent/player data exposure changes
- `OnboardingSaveStatus` / `DraftResumeBanner` — unchanged (localStorage display)
- `DirectorContinueSetupPanel` manual save — still works as a fallback bridge
- `saveAcademyDnaSettings` — unchanged (still writes `academy_dna` key)
- DONNA behavior and system prompts — unchanged (only the context summary now includes lens)
- No onboarding UX changes — directors see identical UI

---

## Future schema work

- A dedicated `academy_operating_lens` table (versioned, with change history) would enable
  directors to update their lens and see DONNA pick it up instantly without a settings JSON merge.
- `coachRecapExpectations` and `donnaCommunicationStyle` are currently empty; a future
  `DonnaAdjustmentStep` extension can write them if those fields are added to `OnboardingDraft`.
