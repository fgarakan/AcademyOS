# QA: Player Profile Coach Observations Surface — Sprint 1093

**Sprint:** 1093  
**Date:** 2026-06-01

---

## File existence

| # | Check | Expected |
|---|---|---|
| 1 | `CoachWrapUpObservationsPanel.tsx` exists | Yes |
| 2 | `docs/architecture/PLAYER_PROFILE_COACH_OBSERVATIONS_SURFACE_1093.md` exists | Yes |
| 3 | `docs/QA_PLAYER_PROFILE_COACH_OBSERVATIONS_SURFACE_1093.md` exists | Yes |
| 4 | `docs/CHANGELOG.md` updated with Sprint 1093 entry | Yes |

---

## Component structure

| # | Check | Expected |
|---|---|---|
| 5 | `CoachWrapUpObservationsPanel` accepts `observations: CoachObservationRow[]` prop | Yes |
| 6 | Component filters to `ai_entities.source === 'coach_wrap_up'` entries only | Yes |
| 7 | Filter cast matches existing pattern: `(obs.ai_entities as Record<string, unknown> | null)?.source` | Yes |
| 8 | Component is a Server Component (no `'use client'`) | Yes |
| 9 | No new DB queries inside the component | Yes |
| 10 | `CoachObservationRow` type imported from `./CoachObservationsFeed` | Yes |

---

## Observation card content

| # | Check | Expected |
|---|---|---|
| 11 | Observation content (`obs.content`) is rendered | Yes |
| 12 | Observation type label (`OBS_TYPE_LABELS[obs.observation_type]`) is rendered when present | Yes |
| 13 | "Coach Wrap-Up" badge is shown on every card | Yes |
| 14 | "Private" badge shown when `obs.is_private === true` | Yes |
| 15 | Coach name from `obs.profiles?.display_name` is rendered when present | Yes |
| 16 | Session name from `obs.sessions?.name` is rendered when present | Yes |
| 17 | Session date from `obs.sessions?.scheduled_date` is rendered when present | Yes |
| 18 | Created date (`obs.created_at`) is rendered via `formatDate` | Yes |
| 19 | Tags (`obs.tags`) are rendered as chips when present | Yes |
| 20 | Missing coach/session fields degrade gracefully (not rendered) | Yes |

---

## Header / label

| # | Check | Expected |
|---|---|---|
| 21 | Card header shows "Recent Coach Observations" label | Yes |
| 22 | Count badge shown in header when `wrapUpObs.length > 0` | Yes |
| 23 | "Internal" label shown in header with shield icon | Yes |
| 24 | Internal disclaimer text is present in card body | Yes |

---

## Empty state

| # | Check | Expected |
|---|---|---|
| 25 | Empty state renders when no wrap-up observations exist | Yes |
| 26 | Empty state text: "No coach wrap-up observations yet." | Yes |
| 27 | Empty state sub-text: "Approved coach wrap-ups will appear here." | Yes |
| 28 | Empty state renders when `observations` is an empty array | Yes |
| 29 | Empty state renders when observations exist but none have `source === 'coach_wrap_up'` | Yes |

---

## Page integration

| # | Check | Expected |
|---|---|---|
| 30 | `CoachWrapUpObservationsPanel` is imported in `page.tsx` | Yes |
| 31 | Panel is placed in `notesSlot` after `CoachPlayerSnapshot` | Yes |
| 32 | Panel is placed before the Development Summary card | Yes |
| 33 | Panel receives `observations={enrichedObservations}` — reuses existing data | Yes |
| 34 | No new DB query added to `page.tsx` for this sprint | Yes |

---

## Visibility guardrails

| # | Check | Expected |
|---|---|---|
| 35 | `/player` route does not import or render `CoachWrapUpObservationsPanel` | Yes |
| 36 | `/parent` route does not import or render `CoachWrapUpObservationsPanel` | Yes |
| 37 | `CoachWrapUpObservationsPanel` is not exported from any shared component index | Yes |
| 38 | Panel resides in `/director/players/[playerId]/` — director-only route | Yes |
| 39 | No parent update CTA is added to the panel | Yes |
| 40 | No observation approval/reject controls are added to the panel | Yes |

---

## Regression checks

| # | Check | Expected |
|---|---|---|
| 41 | `CoachObservationsFeed` in `NotesAIDraftSection` still renders unchanged | Yes |
| 42 | `CoachObservationEvidenceSummary` still renders unchanged | Yes |
| 43 | `CoachPlayerSnapshot` still renders unchanged | Yes |
| 44 | `PlayerCoachNotesBlock` on Overview tab still renders unchanged | Yes |
| 45 | `enrichedObservations` query in `page.tsx` unchanged (no extra fields, same limits) | Yes |
| 46 | Notes tab all other sections render in their existing positions | Yes |
| 47 | `npx tsc --noEmit` passes with no errors | Yes |
| 48 | `git status --short` shows only Sprint 1093 files | Yes |
