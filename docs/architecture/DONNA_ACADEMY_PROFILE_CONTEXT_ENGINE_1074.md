# Sprint 1074 — DONNA Academy Profile Context Engine V1

**Date:** 2026-05-31
**Sprint:** 1074

---

## Problem

Sprints 1072–1073 gave DONNA page-aware context (context packs) and wired them into the runtime answer path. But DONNA still lacked academy-aware context. When answering a question like "How big is my academy?" or "What curriculum are we using?", DONNA had no structured way to know the academy name, director, curriculum version, preferences, or setup gaps — even when that data is available in the database.

---

## Existing Academy Data Sources

Before this sprint, academy context was scattered:

| Source | What it has | What's missing |
|---|---|---|
| `academies` table | `name`, `slug`, `timezone`, `country`, `settings` (JSON) | No structured parsing in DONNA layer |
| `academy_curriculum_versions` table | `name`, `status`, `version_number` | Not surfaced to DONNA |
| `AcademyDonnaPreferences` (Sprint 470) | Preference shape defined | Stored in `academies.settings` JSON but not extracted into DONNA context |
| `DirectorDonnaContext` (Sprint 1012) | `playerCount`, `coachCount`, `onboardingReadinessLevel` | No identity fields (name, slug, timezone) |
| `AcademyStateSummary` (Sprint 979) | `activePlayers`, `pendingReviewCount` | No identity |
| `DonnaContextPacket` (Sprint 914) | `academyId`, `role` | No name, no settings, no curriculum |
| Director layout | Fetches `academy.name`, `academy.settings` | Not passed to DONNA |

**Gap:** DONNA had the DB keys but no structured model that assembled them into a coherent academy profile.

---

## New: AcademyProfileContext

### File

`src/lib/donna/donnaAcademyProfileContext.ts`

Pure TypeScript — no DB, no API, no React. Safe to import from any server context.

### Interfaces

```typescript
export type AcademySetupGapField =
  | 'academy_identity' | 'director_interview' | 'curriculum_setup'
  | 'level_gates' | 'programs_groups' | 'coaches_permissions' | 'players_placement'

export interface AcademySetupGap {
  field: AcademySetupGapField
  label: string
  isComplete: boolean
  actionHref: string
}

export interface AcademyProfileContext {
  // Identity
  academyId: string
  academyName: string | null
  academySlug: string | null
  timezone: string | null
  country: string | null
  directorName: string | null
  // Roster (counts only)
  activePlayerCount: number | null
  coachCount: number | null
  // Curriculum
  activeCurriculumVersionName: string | null
  activeCurriculumVersionStatus: string | null
  ballLevelsUsed: string[]
  // Preferences
  preferences: AcademyDonnaPreferences | null
  parentCommunicationTone: 'encouraging' | 'factual' | 'balanced'
  // Setup
  setupGaps: AcademySetupGap[]
  onboardingComplete: boolean
  // Data quality
  missingFields: string[]
  dataSource: 'live' | 'partial' | 'fallback'
  missingDataFallback: string
}
```

### Key design rules

- `null` = not loaded, not unknown. DONNA must never claim to know a null field.
- `missingFields` is always populated explicitly for every unresolved field.
- `dataSource = 'live'` only when name + slug + timezone are all present.
- `buildEmptyAcademyProfile()` always returns honest nulls — never invented defaults.
- Preferences are extracted from `academies.settings` JSON using Sprint 470's `AcademyDonnaPreferences` shape, merged with `DEFAULT_DONNA_PREFERENCES` so missing keys are always safely populated.

---

## Utilities

### `buildAcademyProfileFromLiveData(input: BuildAcademyProfileInput)`

Assembles a full `AcademyProfileContext` from caller-provided optional data. Does not query the database. Accepts whatever the caller has already fetched.

Typical callers (future):
- `donnaContextActions.ts` — when building context for the DONNA panel
- Director layout server component — already fetches `academy.name` and `academy.settings`
- `runDonnaOrchestratorAction` — could pass academy profile into the orchestrator

### `buildEmptyAcademyProfile(academyId)`

Returns all-null context with `dataSource = 'fallback'`. Use as a safe default when no live data is available.

### `getAcademyProfileSummaryText(profile)`

Produces a concise 2–4 sentence natural-language summary for prepending to DONNA prompts or orchestrator context payloads. Only includes fields that are known. Never invents values.

Example output (full profile):
```
Academy: Dabul Tennis Academy (US). Director: Brian Dabul.
15 active players, 3 coaches. Curriculum: Orange Ball V2 (active).
Parent communication tone: balanced. Default session duration: 60 min.
```

Example output (fallback):
```
Academy profile not loaded — answers limited to page context.
```

---

## Setup Gap Definitions

The 7 onboarding flags from `academies.settings` map to structured `AcademySetupGap` entries:

| Field | Settings key | Action route |
|---|---|---|
| `academy_identity` | `academy_identity_completed` | `/director/onboarding/interview` |
| `director_interview` | `director_interview_completed` | `/director/onboarding/interview` |
| `curriculum_setup` | `curriculum_setup_completed` | `/director/onboarding/curriculum` |
| `level_gates` | `level_gates_completed` | `/director/onboarding` |
| `programs_groups` | `programs_groups_completed` | `/director/onboarding` |
| `coaches_permissions` | `coaches_permissions_completed` | `/director/onboarding` |
| `players_placement` | `players_placement_completed` | `/director/placement` |

---

## What Is Intentionally NOT Wired in This Sprint

- Not passed into `handleDonnaCooPrompt` — that's a future sprint
- Not injected into the LLM orchestrator context packet — future sprint
- Not passed into `donnaContextPacketBuilder.ts` — future sprint
- No new DB query added — builder accepts pre-fetched data only
- No new server action — callers that already fetch academy data pass it in

---

## Future Wiring (Sprint 1075+)

### Into orchestrator context:

In `donnaOrchestratorAction.ts`, build the profile from the already-fetched academy data and include `getAcademyProfileSummaryText(profile)` in the orchestrator's system prompt:

```typescript
const profile = buildAcademyProfileFromLiveData({
  academyId,
  academyName: academy.name,
  rawAcademySettings: academy.settings,
  directorName: input.firstName,
  activePlayerCount: playerCount,
  coachCount,
})
// Pass getAcademyProfileSummaryText(profile) into orchestrator system prompt
```

### Into context pack lookup:

When context pack answers reference "your academy", the orchestrator can inject the academy name from the profile rather than using generic language.

### Into `donnaContextPacketBuilder.ts`:

Add `academyProfile: AcademyProfileContext | null` to `DonnaContextPacket` alongside `directorContext`.

---

## Safety Invariants

- No schema changes, no migrations
- No record mutations
- No DB queries in this file — pure assembly function
- Role boundaries untouched
- Sprint 1073 context-pack runtime wiring unchanged
