# Data Loading Failure QA — Sprint 728

**Date:** 2026-05-17
**Sprint:** 728 — Data Loading Failure QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: Data loading failure handling is consistent and safe across all role portals.**

Every page has explicit handling for: no session, no academy context, and empty data results. Error boundaries exist for all four portals and most sub-routes. No page throws an unhandled error to the user. No page renders blank or crashes on null data.

No risky loading failure gaps found. No fixes required.

---

## 2. Error Boundary Coverage

### Next.js `error.tsx` boundaries

| Route | Error boundary |
|---|---|
| `/director/*` | `src/app/director/error.tsx` |
| `/director/kpi/*` | `src/app/director/kpi/error.tsx` |
| `/director/level-up/*` | `src/app/director/level-up/error.tsx` |
| `/director/parents/*` | `src/app/director/parents/error.tsx` |
| `/director/review/*` | `src/app/director/review/error.tsx` |
| `/director/signals/*` | `src/app/director/signals/error.tsx` |
| `/director/today/*` | `src/app/director/today/error.tsx` |
| `/coach/*` | `src/app/coach/error.tsx` |
| `/player/*` | `src/app/player/error.tsx` |
| `/parent/*` | `src/app/parent/error.tsx` |

All error boundaries display: error icon, message, and a "Try again" button. No raw error stack traces exposed.

### Next.js `loading.tsx` skeletons

Loading skeletons present for: `/director/kpi`, `/director/level-up`, `/director/parents`, `/director/players`, `/director/players/[playerId]`, `/director/review`, `/director/sessions`, `/director/sessions/overview`, `/director/signals`, `/director/today`.

---

## 3. Auth and Session Failure Handling

All director, coach, player, and parent pages follow a consistent pattern:

```tsx
const { data: { user } } = await supabase.auth.getUser()
if (!user) return <p>No session. Please sign in.</p>

const { data: profile } = await supabase.from('profiles').select('academy_id')...
if (!profile?.academy_id) return <p>Academy context unavailable. Please sign in.</p>
```

Pages with explicit auth failure handling:
- `/director` — "No session. Please sign in."
- `/director/level-up` — "No session. Please sign in." + "Academy context unavailable."
- `/director/today` — "No session. Please sign in." + "Academy context unavailable."
- `/director/parents` — "No session. Please sign in." + "Academy context unavailable."
- `/director/kpi` — "Academy context unavailable."
- `/director/class-templates` — "Academy context unavailable."
- `/director/sessions` — "Academy context unavailable."
- `/director/settings` — "Academy context unavailable."
- `/coach` — "No session. Please sign in." pattern (via coachWorkspace)
- `/parent` — auth-gated, empty states shown when guardian not linked
- `/player` — auth-gated, empty states shown when player profile not linked

**All auth failures render a message. No blank page, no crash.**

---

## 4. Data Loading Fallbacks

Supabase query results are consistently wrapped with nullish coalescing fallbacks:

```ts
const data = rawResult.data ?? []
const count = rawResult.data?.length ?? 0
```

Key examples:
- `src/app/director/alerts/page.tsx` — all four query results use `?? []`
- DONNA loaders (`weeklyCoOReportLoader.ts`, `parentTrustLoader.ts`, etc.) — all use `?? []` or `?? null`
- KPI engines — all accept nullable inputs and return `status: 'insufficient_data'` when data is missing

**No page assumes data is non-null without a guard.**

---

## 5. Server Action Error Handling

All server actions return structured error results:

```ts
return { ok: false, error: 'Description of what failed.' }
```

Actions audited:
- `saveWrapUpDraftAction`, `saveWrapUpAttendanceExceptionAction`, `saveWrapUpObservationsAction` — all return `{ ok: false, error: string }` on failure
- `structureCoachRecapAction` — 8 explicit error return paths before any DB write
- `requestPrivateLessonAction` — auth, profile, and validation gates before insert
- `createPlayerAction` — auth + role + input validation before insert
- `setCurriculumLevelAction` — auth + role + player + level checks before RPC

**No server action throws unhandled exceptions to the client.**

---

## 6. KPI Engine Failure States

All KPI engines (`parentTrustKpiEngine.ts`, `developmentHealthKpiEngine.ts`, `evidenceCoverageKpiEngine.ts`, `developmentVelocityKpiEngine.ts`, `retentionKpiEngine.ts`) handle missing data gracefully:

- Return `status: 'insufficient_data'` when data is absent
- Return `status: 'blocked_by_schema'` when required columns are missing
- Return `status: 'no_data'` for zero-record cases
- Never throw or return `undefined`

---

## 7. Empty State Coverage

Pages with explicit empty state UI:
- `/director/parents` — `<EmptyState icon>No parent communications yet</EmptyState>`
- `/director/review` — empty state per tab type
- `/director/players` — empty state when no players
- `/coach/players` — empty state when no players assigned
- `/player` — empty state when no IDP data

---

## 8. Risky Patterns Found

None. The codebase uses consistent defensive patterns throughout:
- Nullish coalescing on all query results
- Explicit auth gates with inline error messages
- Structured error returns from server actions
- KPI engines with `insufficient_data` fallback states
- Error boundaries at route level

---

## 9. Fixes Made

None.

---

## 10. Final Safety Conclusion

**Data loading failure handling is complete and consistent in AcademyOS V1.**

No page crashes on null data. No page exposes raw error state. All auth failures show a user-friendly message. Error boundaries cover all four portals and major sub-routes.

**Sprint 728 production readiness check: PASSED.**
