# Sprint 771 — AIQS Major Route Loading Skeletons V1

**Date:** 2026-05-24
**Sprint:** 771
**Goal:** Add loading skeleton UI (`loading.tsx`) to the 7 major audited page routes that were missing it.
**AIQS issue:** S-3 — No `loading.tsx` skeleton on any major page directory; users see blank white flash during Next.js Server Component data fetching.

---

## AIQS Issue Addressed

**Systemic Issue S-3** from `docs/ACADEMYOS_SITE_WIDE_UI_UX_CERTIFICATION.md`:

> No `loading.tsx` skeleton on any major page directory. Users see a blank or broken state during Server Component data fetching before the page resolves. AIQS requires: "Loading state exists (skeleton or spinner) — never blank."

**AIQS State Quality standard (Category 9):**
- Loading: Skeleton or spinner — never blank
- Score impact: State quality is 5/5 when loading states exist on all major routes

---

## Files Created

| File | Approximates |
|---|---|
| `src/app/director/loading.tsx` | Director Home — header, command center hero, KPI grid, sessions |
| `src/app/coach/loading.tsx` | Coach Home — header, next session card, stat row, today, watchlist |
| `src/app/player/loading.tsx` | Player Home — header, quick links, mission card, level, badges |
| `src/app/parent/loading.tsx` | Parent Home — header, quick links, mission context, level, progress, attendance |
| `src/app/director/donna/loading.tsx` | DONNA Command — header, 2-column (left cards + right chat shell) |
| `src/app/director/curriculum/loading.tsx` | Curriculum Map — header, filter bar, 2-column (level cards + DONNA sidebar) |
| `src/app/director/settings/loading.tsx` | Settings — header, form card, secondary card |

---

## Already Had Loading Skeletons (Not Changed)

These routes already had `loading.tsx` before this sprint:
- `director/today/loading.tsx`
- `director/parents/loading.tsx`
- `director/signals/loading.tsx`
- `director/level-up/loading.tsx`
- `director/kpi/loading.tsx`
- `director/sessions/loading.tsx`
- `director/sessions/overview/loading.tsx`
- `director/review/loading.tsx`
- `director/players/loading.tsx`
- `director/players/[playerId]/loading.tsx`

---

## Implementation Notes

- All skeletons use `SkeletonCard` from `@/components/ui` and raw `bg-surface-raised rounded` divs
- `animate-skeleton` class (from `tailwind.config.ts`) provides the pulsing opacity animation
- Skeletons approximate the actual page structure (header, above-fold sections, column layout)
- Role-specific layouts respected: director pages use sidebar+main pattern; coach/player/parent use `max-w-2xl mx-auto p-4` mobile-first layout
- No business logic, no DB queries, no role data — pure UI only
- Next.js automatically uses `loading.tsx` as the Suspense boundary fallback for the route segment

---

## TypeScript Result

No complex TypeScript — JSX with no props or hooks.

`npx tsc --noEmit` — **EXIT 0** (verified clean)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new features added
- [x] Pure skeleton UI only — no logic, no data
