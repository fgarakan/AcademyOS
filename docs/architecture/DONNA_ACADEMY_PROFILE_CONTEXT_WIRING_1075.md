# Sprint 1075 — DONNA Academy Profile Context Wiring V1

**Date:** 2026-05-31
**Sprint:** 1075

---

## What was done

Sprint 1074 created the `AcademyProfileContext` engine as pure data. Sprint 1075 wires the academy profile summary into DONNA's LLM orchestrator so the system prompt includes academy identity context on every God Mode query.

---

## Wiring Location

The wiring happens entirely server-side — never from client input.

```
runDonnaOrchestratorAction (server action)
    ↓
getAuthorizedContext()
    ├── existing: profiles.academy_id (auth check)
    ├── existing: academy_memberships.role (auth check)
    └── NEW Sprint 1075: academies.name, slug, timezone, country, settings
            ↓
    buildAcademyProfileFromLiveData({ academyId, academyName, ... })
    OR buildEmptyAcademyProfile(academyId)  ← if query fails
            ↓
    getAcademyProfileSummaryText(profile)  → academyProfileSummary string
            ↓
orchestrate({ ..., academyProfileSummary })
            ↓
buildContextPacket({ ..., academyProfileSummary })
            ↓
buildSystemPrompt(..., academyProfileSummary)
            ↓
LLM system prompt — "## Academy Context" section
```

---

## Files Changed

### `donnaOrchestratorAction.ts`

1. Imports `buildAcademyProfileFromLiveData`, `buildEmptyAcademyProfile`, `getAcademyProfileSummaryText`.
2. Extended `getAuthorizedContext()`: after the membership check, queries `academies` for `name, slug, timezone, country, settings` — scoped to the authenticated `academyId`. Fails safely (uses `buildEmptyAcademyProfile` fallback, never throws).
3. Returns `academyProfileSummary` alongside `academyId`, `role`, `supabase`.
4. Passes `academyProfileSummary` into the `orchestrate()` call.

**Safety invariants maintained:**
- `academyId` always from server-side auth — never from client
- Academy data fetched with the same authenticated Supabase client that already enforces RLS
- `settings` JSON is never returned to the client — only the summary string
- `academyProfileSummary` is stripped of null fields via `getAcademyProfileSummaryText`

### `contextPacket.ts` (`src/lib/donna/llmOrchestration/contextPacket.ts`)

1. Added `academyProfileSummary?: string` to `ContextPacketInput`.
2. Extended `buildSystemPrompt` signature to accept `academyProfileSummary?`.
3. Added "## Academy Context" section between Identity and Current State sections — only when the summary is present and not the empty-profile fallback phrase.
4. Passes `input.academyProfileSummary` from `buildContextPacket` to `buildSystemPrompt`.

---

## What DONNA Now Receives in the LLM System Prompt

When academy data is available (full profile):
```
## Academy Context
Academy: Dabul Tennis Academy (US). Director: Brian Dabul. 15 active players, 3 coaches. Curriculum: Orange Ball V2 (active). Parent communication tone: balanced.
```

When academy data is partial (name only, no curriculum):
```
## Academy Context
Academy: Dabul Tennis Academy. Some academy context unavailable: activeCurriculumVersionName, ballLevelsUsed, preferences.
```

When academy query fails (empty fallback):
```
[Section omitted — "Academy profile context is not available" filter suppresses the section]
```

---

## What Is NOT in the Summary

The `getAcademyProfileSummaryText` function (Sprint 1074) omits null fields silently. DONNA never receives:
- Fitness philosophy (not in DB)
- Active programs as structured list
- Ball levels (not queried in this sprint — no curriculum_levels query added)
- Player/coach names
- Raw `academies.settings` JSON
- Parent or player private data

---

## Data Flow Integrity

| Data | Source | Trusted? |
|---|---|---|
| `academyId` | Server-side auth (profiles table) | ✅ Always server |
| `academyName` | Server-side query (academies table, scoped to academyId) | ✅ Always server |
| `academyProfileSummary` | Built server-side, passed to orchestrate() | ✅ Always server |
| Client `academyId` prop | `DonnaAssistantButton` — NOT used in orchestrator | ❌ Not trusted |

---

## Fallback Behavior

- `academies` query fails → `buildEmptyAcademyProfile(academyId)` → fallback text → "Academy Context" section suppressed in system prompt
- `academyProfileSummary` is empty string → section omitted
- Summary starts with "Academy profile context is not available" → section suppressed
- God Mode still functions without the academy section — it degrades gracefully

---

## What Remains Unwired

- `playerCount` / `coachCount` in the profile — available via the `get_academy_state` tool when LLM requests it
- `ballLevelsUsed` — requires a curriculum_levels query not added in this sprint
- Academy profile context in the COO router (`handleDonnaCooPrompt`) — future sprint
- Academy profile context in context-pack lookup — future sprint
- Director layout passing `academyName` to `DonnaAssistantButton` — not needed; server action has it
