# Wrap-Up Coverage Panel Polish — Sprint 1050

**Date:** 2026-05-19
**Sprint:** 1050 — Wrap-Up Coverage Panel Polish V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

### Files modified
- `src/lib/donna/wrapUpReviewSurfaceLoader.ts` — added `coachName: string | null` to `WrapUpSessionStatus` interface; batch-fetches coach display names from `profiles` table after session rows are loaded
- `src/app/director/review/WrapUpCoveragePanel.tsx` — added session links, coach name display, and a "missing wrap-ups" callout section

---

## Loader changes (`wrapUpReviewSurfaceLoader.ts`)

Added `coachName: string | null` to `WrapUpSessionStatus`:
```typescript
coachName: string | null
```

After loading session rows, batch-fetches all unique coach IDs from `profiles.display_name`:
```typescript
const coachIds = Array.from(new Set(sessions.map(s => s.coach_id).filter((id): id is string => !!id)))
// → profiles query → coachNameMap
```

Falls back to `null` gracefully if coach has no profile or profile has no display_name.

---

## Panel changes (`WrapUpCoveragePanel.tsx`)

### New: Missing wrap-ups callout
- Shown only when `missingSessions.length > 0` (sessions with `wrapUpSubmitted = false`)
- Orange-accented section with Clock icon, session name, date, coach name (if available), and "View" link → `/director/sessions/[id]`
- Allows director to quickly navigate to the session and follow up with the coach

### Updated: All sessions list
- Session name is now a `<Link>` → `/director/sessions/[id]` (lime on hover)
- Coach name shown below the session name (with user icon) when available
- Layout unchanged otherwise (status badge, date, submitted/missing indicator)

---

## Safety

- No DB writes
- `profiles` query is read-only and academy-scoped through existing `academyId` in the loader call
- All new session links → read-only pages
- No automatic actions triggered

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).
