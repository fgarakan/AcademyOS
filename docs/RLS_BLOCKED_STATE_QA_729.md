# RLS Blocked State QA — Sprint 729

**Date:** 2026-05-17
**Sprint:** 729 — RLS Blocked State QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: RLS blocked states are handled gracefully across all surfaces. No data leaks, no crashes on RLS failure.**

`blocked_by_rls` is a first-class data status in the DONNA COO intelligence system. All DONNA engines skip recommendations when data is RLS-blocked. DONNA UI surfaces display a "Blocked" indicator rather than showing empty or crashing. The service role client (`getSupabaseAdmin`) is confined to three backend functions not called from any UI.

No fixes required.

---

## 2. RLS Blocked State Handling — DONNA COO System

### 2.1 `cooDataStatus.ts` — `blocked_by_rls` status type

```ts
type COODataStatus = 'live' | 'partial' | 'insufficient_data' | 'blocked_by_rls' | 'blocked_by_schema' | 'no_data'
```

The status has a human-readable label (`'Blocked'`) and a red background color. `cooDataStatus.ts` also has an aggregation rule: if any status is `blocked_by_rls`, the combined status returns `'insufficient_data'` to avoid false certainty.

### 2.2 `donnaNBAEngine.ts` — NBA skipped when blocked

All six NBA signals check for `blocked_by_rls` before generating recommendations:

```ts
ctx.pendingReviewItems.status !== 'blocked_by_rls'
ctx.coachWrapUpCoverage.status !== 'blocked_by_rls'
ctx.attendanceRisk.status !== 'blocked_by_rls'
ctx.parentUpdateBacklog.status !== 'blocked_by_rls'
ctx.levelReadinessFlags.status !== 'blocked_by_rls'
ctx.healthScoreStatus !== 'blocked_by_rls'
```

When blocked, the NBA engine returns no recommendation. No false CTAs are generated.

### 2.3 `donnaCOOAnswerEngine.ts` — `blocked` response type

When any signal is `blocked_by_rls` or `blocked_by_schema`:
```ts
if (statuses.some(s => s === 'blocked_by_rls' || s === 'blocked_by_schema')) return 'blocked'
```

Individual signals are excluded from narrative generation when blocked. The source note reads: `'Blocked by RLS or schema gap'`.

### 2.4 `DONNAConfidenceDisclosure.tsx` — `blocked_rls` disclosure type

UI component renders a distinct visual state for `blocked_rls` — separate from `live`, `partial`, or `no_data`.

### 2.5 `PlayerCOOContextPanel.tsx` — RLS state propagation

```ts
if (c === 'blocked') return 'blocked_rls'
```

The panel converts DONNA's `'blocked'` response to `'blocked_rls'` for the confidence disclosure component.

---

## 3. Service Role Client (`getSupabaseAdmin`) Usage

`getSupabaseAdmin()` creates a service role client that bypasses RLS. Its usage is confined to:

| Function | Location | Called from UI? |
|---|---|---|
| `calibrateBehaviorProfile` | `intelligence.ts:84` | No |
| `generatePredictions` | `intelligence.ts:127` | No |
| `generateCoachingMessage` | `intelligence.ts:224` | No |

None of these functions are called from any server action, API route, or UI component in the current app. They exist as backend infrastructure for future batch/scheduled operations.

**No service role bypass is reachable from any UI flow.**

---

## 4. Standard Client Usage

All UI-facing queries use `getSupabaseServer()`, which creates an authenticated client with user session cookies. RLS policies apply to all queries. This is the only client used in:

- All server page components
- All server actions (`'use server'` files)
- All API routes (`/api/donna/`, `/api/coach/`, `/api/director/`)

---

## 5. RLS Error Surface in UI

### 5.1 Fitness Template Builder

`FitnessTemplateBuilderClient.tsx:195`

```tsx
{/* Block exercises query error — typically indicates missing RLS policy on template_block_exercises */}
Block exercise data unavailable: {blockExercisesQueryError}. Contact your admin — a database policy may be missing.
```

Explicit message when RLS policy is missing on `template_block_exercises`. No crash.

### 5.2 DONNA failure mode

`donnaFailureModes.ts:397`

```ts
developerMessage: 'Server action returned a 401/403 or RLS policy blocked the mutation.'
```

DONNA surfaces a failure mode message when a mutation is blocked by RLS. The user sees a failure message, not a crash.

---

## 6. No Service Role Exposure

`SUPABASE_SERVICE_ROLE_KEY` is:
- Accessed only in `src/lib/supabase/server.ts` via `process.env`
- Never passed to any client component
- Never exposed in any API response
- Not referenced in any `src/app/` page component

---

## 7. Risky Patterns Found

None.

---

## 8. Fixes Made

None.

---

## 9. Final Safety Conclusion

**RLS blocked states are handled gracefully in AcademyOS V1.**

- `blocked_by_rls` is a first-class status with visual indicators and NBA suppression.
- Service role client is isolated to three unused backend functions.
- No RLS bypass is reachable from any UI flow.
- All UI queries use the user-session-bound Supabase client.

**Sprint 729 production readiness check: PASSED.**
