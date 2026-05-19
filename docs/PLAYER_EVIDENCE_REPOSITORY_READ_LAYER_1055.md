# Player Evidence Repository Read Layer — Sprint 1055

**Date:** 2026-05-19
**Sprint:** 1055 — Player Evidence Repository Read Layer V1
**Phase:** Phase 7A — Player Profile Evidence Hub (Sprints 1054-1065)

---

## What Was Built

Created `src/lib/players/playerEvidenceRepository.ts` — a read-only evidence aggregation layer for the Player Evidence Hub.

No database mutations. No migrations. No schema changes. No package installs.

---

## Functions Created

### 1. `getPlayerEvidenceSummary(db, playerId, academyId)`

Returns top-level counts for the evidence hub header:
- `totalObservations` — all coach_observations for this player
- `recentObservationCount` — observations in last 30 days
- `requirementEvidenceCount` — total requirement_evidence_links
- `parentSafeEvidenceCount` — evidence links where `is_parent_safe = true`
- `gatesWithEvidence` — curriculum gates with at least one evidence record
- `totalGates` — total gates for the player's current level
- `activePriorityCount` — active player_priorities
- `latestEvidenceDate` — most recent observation or evidence link date
- `latestAssessmentDate` — most recent assessment date

Runs 5 queries in parallel. Each query fails independently — if `requirement_evidence_links` is missing, counts default to 0 rather than throwing.

---

### 2. `getPlayerCoachObservations(db, playerId, academyId, limit?)`

Fetches `coach_observations` with coach name and session context joins (same pattern as `page.tsx` line 766).

Returns `CoachObservationItem[]`:
- `isParentSafe: false` — hard-coded on every item. Raw coach observation content is never parent-safe.
- `sourceLabel: 'coach_observation'`
- `coachName`, `sessionName`, `sessionDate` from joined tables
- `tags` array preserved

---

### 3. `getPlayerCurriculumEvidence(db, playerId, academyId)`

Fetches `requirement_evidence_links` and enriches with:
- Requirement titles and domain from `v_player_requirement_progress_detail`
- `is_parent_visible`, `is_player_visible` from the same progress view
- Observation content snippet for `evidence_type = 'coach_observation'` items
- Creator display names from `profiles`

Returns `RequirementEvidenceItem[]`:
- `isParentSafe` — preserved from the evidence link row
- `isParentVisible`, `isPlayerVisible` — from the requirement progress view
- `observationContent` — populated only for `coach_observation` evidence type

---

### 4. `getPlayerPathwayEvidence(db, playerId, academyId)`

Partitions observations into three pathway buckets:
- `skillEvidence` — types: technical, tactical, movement, general, behavioral, injury_concern, positive_highlight
- `competitionEvidence` — type: competition
- `fitnessEvidence` — types: fitness, load, recovery

Calls `getPlayerCoachObservations` internally (no redundant DB call needed if caller has both). All items inherit `isParentSafe: false`.

---

### 5. `getPlayerParentSafeSummaries(db, playerId, academyId)`

Aggregates the three fields that are eligible for parent-facing exposure:

1. `developmentSummary` — from `player_development_summary`, includes `showToParent` and `showToStudent` flags. Only the caller decides whether to display based on these flags. The loader returns both states.

2. `parentSafeEvidenceLinks` — `RequirementEvidenceItem[]` filtered to `isParentSafe = true`. Never includes raw observation content as parent-safe data.

3. `parentSafeRequirements` — from `v_player_requirement_progress_detail` where `is_parent_visible = true`. Returns title, domain, status, evidence count.

This function is the safe source of truth for what the parent portal may eventually display. Callers must still apply `sanitizeParentFacingText()` to any coach-written text before rendering in a parent-facing route.

---

### 6. `getPlayerEvidenceTimeline(db, playerId, academyId, limit?)`

Returns a chronologically sorted, multi-source `EvidenceTimelineItem[]`:

| Type | Source | isInternalOnly | isParentSafe |
|---|---|---|---|
| `coach_observation` | `coach_observations` | true | false |
| `requirement_evidence` | `requirement_evidence_links` | depends on `is_parent_safe` | from row |
| `gate_update` | `audit_logs` | true | false |
| `assessment` | `assessments` | true | false |

Items sorted descending by date. Limit defaults to 30.

---

## Evidence Sources Used

| Source | Table / View | Academy-scoped | Already in database.types.ts |
|---|---|---|---|
| Coach observations | `coach_observations` | Yes (`academy_id`) | Yes |
| Requirement evidence | `requirement_evidence_links` | Yes | No — rawDb cast used |
| Requirement progress | `v_player_requirement_progress_detail` | Yes | No — rawDb cast used |
| Gate audit trail | `audit_logs` | Yes | Yes (rawDb still used due to payload type) |
| Assessments | `assessments` | Yes | Yes |
| Development summary | `player_development_summary` | Yes | No — rawDb cast used |
| Player priorities | `player_priorities` | Yes | No — rawDb cast used |
| Profiles | `profiles` | Yes | Yes |

---

## Safety and Visibility Handling

### Coach observation content
Raw content from `coach_observations` is **always** `isParentSafe: false`. This is hard-coded in the `CoachObservationItem` type — not a runtime check. It cannot be accidentally set to true.

### Requirement evidence
`isParentSafe` is preserved from the `requirement_evidence_links.is_parent_safe` column (set by the director during the review/apply flow). The repository does not override this value.

### Development summary
`showToParent` and `showToStudent` are returned as-is. The repository does not filter by these flags — the calling page.tsx or Server Component is responsible for deciding whether to render based on these values.

### Visibility flags preserved

| Flag | Source | Meaning |
|---|---|---|
| `isParentSafe` | `requirement_evidence_links` | This specific evidence link is safe for parent portal |
| `isParentVisible` | `v_player_requirement_progress_detail` | This requirement row may be shown to parents |
| `isPlayerVisible` | `v_player_requirement_progress_detail` | This requirement row may be shown to players |
| `showToParent` | `player_development_summary` | Development summary is parent-approved |
| `showToStudent` | `player_development_summary` | Development summary is student-approved |

### text sanitization
This repository does NOT call `sanitizeParentFacingText()`. That is the responsibility of parent portal route handlers (Phase 7B). The repository is used in director-facing views where raw text is appropriate.

---

## Fallback Behavior

Every function returns `EvidenceResult<T>`:
```
{
  data: T | null
  error: string | null
  isSchemaMissing: boolean
}
```

If a table or view does not exist (e.g. `v_player_requirement_progress_detail` not yet migrated), `isSchemaMissing: true` is returned and the component can render an empty state instead of crashing.

If a partial query fails (e.g. one of the 5 parallel queries in `getPlayerEvidenceSummary`), the affected count defaults to 0 and the rest of the data is returned normally.

---

## TypeScript

`npx tsc --noEmit` — **CLEAN** (zero errors).

`rawDb = db as any` pattern used consistently with the established pattern in `page.tsx`. The `SupabaseClient<Database>` type is accepted at the parameter boundary; internal casts are used only for tables not yet in `database.types.ts`.

---

## Known Limitations

1. `getPlayerEvidenceTimeline` gate entries filter by `target_type = 'player'` and `target_id = playerId` on `audit_logs`. This assumes gate audit entries were written with the player as the target. If they were written with the gate as the target (as in the Phase 6 gate audit query which filters by `gate_id`), this filter will return 0 rows. The Sprint 1056 timeline component should be designed to degrade gracefully here.

2. `getPlayerPathwayEvidence` uses a fixed set of observation types per pathway. If new types are added (e.g. `mental` or `nutrition`), the `SKILL_OBS_TYPES` / `FITNESS_OBS_TYPES` sets in the repository must be updated.

3. `getPlayerParentSafeSummaries` returns requirement evidence marked `is_parent_safe = true` but does NOT confirm that the underlying `player_development_summary.show_to_parent` is also true. The calling route must check both independently.

4. UTR competition data is not included in this repository. It is isolated in the Competition tab and will be addressed in a later Phase 7 sprint.

---

## Migration Status

**No migrations required.** All tables and views queried here existed before Phase 7A:
- `coach_observations` — exists
- `requirement_evidence_links` — exists
- `v_player_requirement_progress_detail` — exists
- `audit_logs` — exists
- `assessments` — exists
- `player_development_summary` — exists
- `player_priorities` — exists
- `curriculum_gates`, `player_gate_status` — exist

---

## What Sprint 1056 Should Do

**Sprint 1056: Player Evidence Timeline Component**

Build `src/components/player/PlayerEvidenceTimeline.tsx` using the `getPlayerEvidenceTimeline()` result.

The component should:
- Accept `EvidenceTimelineItem[]` as props (pre-fetched server-side)
- Render a compact chronological list with type icons and visibility pills
- Use `isInternalOnly` to show an internal badge
- Use `isParentSafe` to show a parent-safe badge on eligible items
- Show the `detail` field (session context, evidence summary) as a secondary line
- Group by week or month when more than 10 items exist
- Degrade gracefully when `items` is empty (EmptyState component)
- Be director-only (no parent/player portal usage in this sprint)
- Match the AcademyOS dark/lime design system (no new tokens, no new components beyond what `src/components/ui` provides)
