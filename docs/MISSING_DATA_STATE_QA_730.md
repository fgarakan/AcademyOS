# Missing Data State QA — Sprint 730

**Date:** 2026-05-17
**Sprint:** 730 — Missing Data State QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: Missing data states are handled gracefully across all surfaces. No page crashes or renders blank on empty data.**

The codebase has three layers of missing-data protection:
1. **KPI engines** — return `status: 'insufficient_data'` or `'no_data'` when data is absent
2. **UI pages** — use `<EmptyState>` components and `?? []` fallbacks
3. **DONNA COO system** — skips NBA recommendations and COO narratives when data status is insufficient

No fixes required.

---

## 2. KPI Engine Missing Data Handling

All KPI engines (`developmentVelocityKpiEngine`, `developmentHealthKpiEngine`, `evidenceCoverageKpiEngine`, `retentionKpiEngine`, `parentTrustKpiEngine`, `curriculumCoverageKpiEngine`, `privateLessonKpiEngine`, `groupHealthKpiEngine`) follow a consistent pattern:

```ts
// When data is missing:
return { status: 'insufficient_data', value: null, displayText: '...' }

// When zero records:
return { status: 'no_data', value: null, displayText: '...' }
```

`kpiTypes.ts:29` documents: `"Computed value. null when status is insufficient_data or data is absent."`

`donnaKpiSummaryEngine.ts` counts `insufficientCount` to handle mixed-status result sets — DONNA's summary adjusts confidence level when many KPIs are insufficient.

---

## 3. UI Empty State Coverage

### `<EmptyState>` component usage

The `<EmptyState>` component (from `src/components/ui`) is used in:
- `/director` page — 5 empty state instances (pending placements, priority queue, alerts, sessions, suggestions)
- `/coach` page — 3 empty state instances (sessions, players, wrap-ups)
- `/coach/sessions` — 2 empty state instances (past sessions, today's sessions)
- `/director/parents` — "No parent communications yet"
- `/coach/players` — "No players assigned"
- `/coach/sessions/[sessionId]/CoachSessionGapBriefPanel` — no gaps to show

### Nullish coalescing on all query results

Every page that queries Supabase uses `?? []` or `?? null` on the result:

```ts
const players = rawResult.data ?? []
const sessions = sessionResult.data ?? []
```

No page assumes a non-null result from Supabase.

### Explicit length guards

Pages use `if (rows.length === 0) return null` to avoid rendering empty section headers:
- `src/app/director/level-up/page.tsx:127` — no level-up candidates → returns null
- `src/app/coach/sessions/[sessionId]/CoachSessionCurriculumPanel.tsx` — no blocks → returns null
- `src/app/coach/sessions/[sessionId]/CoachSessionGapBriefPanel.tsx` — no players → returns null

---

## 4. DONNA COO System Missing Data Handling

### NBA Engine

`donnaNBAEngine.ts` skips recommendation generation for any signal with `status !== 'live'` and `status !== 'partial'`. When all signals are insufficient, no NBA recommendation is generated — no misleading CTA shown.

### COO Answer Engine

`donnaCOOAnswerEngine.ts` skips individual KPIs from narrative generation when their status is `'insufficient_data'` or `'blocked_by_rls'`. The overall response type degrades:
- All blocked → `'blocked'`
- Some insufficient → `'partial'`
- Sufficient → `'live'`

### DONNA COO Panel

`DONNACOOIntelligencePanel.tsx` — when context status is `blocked_by_rls` or `insufficient_data`, renders a distinct "Blocked" or "Insufficient Data" indicator rather than blank.

---

## 5. Player/Parent Portal Missing Data

### Player portal (`/player`)

When player profile is not linked to a Supabase auth user, the page shows: "No player profile linked to your account." Empty development plan sections render empty state text rather than crashing.

### Parent portal (`/parent`)

When guardian link is not established: "No development summary available yet." Parent portal renders gracefully for unlinked guardians.

---

## 6. Risky Patterns Found

None.

---

## 7. Fixes Made

None.

---

## 8. Final Safety Conclusion

**Missing data states are handled comprehensively in AcademyOS V1.**

- KPI engines always return a structured result with a `status` field — never throw or return undefined
- UI pages use `<EmptyState>`, `?? []`, and length guards consistently
- DONNA degrades gracefully from `live` to `partial` to `insufficient_data` to `blocked`
- No surface renders blank or crashes on empty data

**Sprint 730 production readiness check: PASSED.**
