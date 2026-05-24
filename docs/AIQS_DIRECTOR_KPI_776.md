# Sprint 776 — Director KPI AIQS Table → Cards + Action Surface V1

**Date:** 2026-05-24
**Sprint:** 776
**Target page:** `/director/kpi`
**Pre-sprint score:** 65 / 100 (lowest in the app)
**Estimated post-sprint score:** ~76 / 100

---

## Context

Director KPI was the lowest-scoring page in the entire AcademyOS site-wide AIQS certification
(65/100). The Review Center was originally the next candidate but a code review revealed its major
audit issues — tab labels, count badges, DONNA brief, summary cards — were already resolved. The
KPI page had all 5 audit issues still fully present.

---

## AIQS Issues Fixed

### Issue 1 — No action surface from the data (+3 primary action clarity)

**Before:** After reading the KPI table, no next step was presented.

**After:** Contextual action banner immediately above the table:
- `atRiskCount > 0` → orange-accented `Link` to `/director/players`:
  `"{N} players need attention — open player directory to act"`
- `atRiskCount === 0` (and players exist) → lime all-clear:
  `"All players look healthy — no attention signals right now."`

Uses only the already-computed `atRiskCount` — zero new queries.

---

### Issue 2 — DONNA KPI Explainer buried at bottom (+2 DONNA integration)

**Before:** `DonnaKpiExplainerPanel` was the last element on the page (line 313), after the data
quality note and the full table.

**After:** Moved to immediately after the summary cards grid, before the table. Directors see
DONNA context before they engage with the raw data. Props unchanged: `activePlayers`,
`advancementReady`, `atRiskCount`.

---

### Issue 3 — Data quality note buried at bottom (+1 trust/safety)

**Before:** `"KPI status: Time in Level is live..."` appeared at the bottom (lines 305–308) after
the table the director just read.

**After:** Promoted to a styled provenance banner immediately below the page header — before the
summary cards. Wrapped in `bg-surface-raised` card with `Info` icon. Directors see the provenance
of all data before acting on it.

---

### Issue 4 — `text-[10px]` sub-labels in summary cards (+1 typography)

**Before:** Three summary card sub-labels used `text-[10px] text-text-muted`:
- "current roster" (Active Players card)
- "curriculum flag set" (Advancement Ready card)
- "absences or long level tenure" (Attention Signals card)

**After:** All three raised to `text-xs text-text-muted` (12px — AIQS metadata minimum).

These were missed by Sprint 770's micro-text sweep (which scoped to the main route page files).

---

### Issue 5 — Mobile table usability failure (+2 spacing/layout, +2 role fit)

**Before:** The full KPI table used `overflow-x-auto` — on mobile it became a horizontally
scrolling admin grid with 4 columns.

**After:** Dual-layout pattern (no new data, no new queries):
- Existing table wrapped in `hidden sm:block` — desktop only (≥640px)
- `sm:hidden` section with stacked `Card` rows — mobile only (<640px)

Each mobile card row shows:
- Player name (link → player profile)
- Advancement status badge (top right)
- Time in Level (colored: red if >180d, orange if >120d, default otherwise)
- Absences 30d (colored: orange if flag, secondary if >0, muted if 0)
- Alert icon on flagged cards (`border-status-orange/30` border)

---

## Files Modified

| File | Change |
|---|---|
| `src/app/director/kpi/page.tsx` | All 5 AIQS fixes (Sprint 776) |
| `docs/AIQS_DIRECTOR_KPI_776.md` | This sprint doc |
| `docs/CHANGELOG.md` | Dated entry |

## Files Not Touched

| File | Status |
|---|---|
| `src/lib/kpi/attendanceKpiEngine.ts` | Untouched |
| `src/lib/kpi/developmentVelocityKpiEngine.ts` | Untouched |
| `src/components/donna/DonnaKpiExplainerPanel.tsx` | Repositioned only; source unchanged |
| `src/app/director/kpi/loading.tsx` | Already created in Sprint 771 |
| `supabase/migrations/*` | No schema changes |
| `.env.local` | Protected |

---

## Expected Score Improvement

| Category | Before | After | Δ |
|---|---:|---:|---|
| Primary action clarity | 4/10 | 7/10 | +3 |
| DONNA integration | 3/5 | 5/5 | +2 |
| Spacing/layout | 7/10 | 9/10 | +2 |
| Role fit | 6/10 | 8/10 | +2 |
| Typography | 7/10 | 8/10 | +1 |
| Trust/safety | 4/5 | 5/5 | +1 |
| *(all others unchanged)* | — | — | 0 |
| **Total** | **65** | **~76** | **+11** |

Result: **"Usable But Cluttered" → "Strong But Needs Polish"**

---

## TypeScript Result

`npx tsc --noEmit` — **EXIT 0** (clean)

---

## Implementation Guardrails — Confirmed

- [x] No SQL/RLS/migrations touched
- [x] No env files touched
- [x] No DONNA dispatcher modified
- [x] No official record mutations
- [x] No role boundaries changed
- [x] No approval flows changed
- [x] No new npm packages
- [x] No new Supabase queries — all data for new UI already computed
- [x] Mobile card rows use existing `playerKpis` array — no new data fetches
- [x] Action banner links to `/director/players` (navigation only — no mutation)
