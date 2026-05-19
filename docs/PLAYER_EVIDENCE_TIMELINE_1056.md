# Player Evidence Timeline — Sprint 1056

**Date:** 2026-05-19
**Sprint:** 1056 — Player Evidence Timeline V1
**Phase:** Phase 7A — Player Profile Evidence Hub (Sprints 1054–1065)

---

## What Was Built

Created `src/components/player/PlayerEvidenceTimeline.tsx` — a multi-source, typed evidence timeline component for the director-facing player profile Notes tab.

Wired the Phase 7A `getPlayerEvidenceTimeline()` repository function into `src/app/director/players/[playerId]/page.tsx`, replacing the previous `ProgressEvidenceTimeline` call that used an `as any` cast against raw observation data.

No database mutations. No migrations. No schema changes. No package installs.

---

## Component: `PlayerEvidenceTimeline`

**File:** `src/components/player/PlayerEvidenceTimeline.tsx`

### Props

```ts
interface Props {
  items: EvidenceTimelineItem[]   // from playerEvidenceRepository
  isSchemaMissing?: boolean        // graceful degradation flag
}
```

`EvidenceTimelineItem` is the canonical typed shape from `@/lib/players/playerEvidenceRepository`. No raw DB shapes, no `as any`.

### Type icons

| Event type | Icon | Color token |
|---|---|---|
| `coach_observation` | `MessageSquare` | `text-text-muted` |
| `requirement_evidence` | `Link2` | `text-status-blue` |
| `gate_update` | `Shield` | `text-lime` |
| `assessment` | `BarChart2` | `text-status-orange` |
| `priority_added` | `Flag` | `text-status-green` |
| `dev_summary_updated` | `FileText` | `text-text-muted` |

### Visibility pills

- `isInternalOnly: true` → Lock icon + "Internal" pill (border-border, text-text-muted)
- `isParentSafe: true` AND `isInternalOnly: false` → Eye icon + "Parent-safe" pill (border-status-blue/20, text-status-blue)

### Layout behavior

- **< 10 items**: flat chronological list
- **≥ 10 items**: grouped by week (ISO Monday label: "Week of May 19, 2026")
- **Empty state**: `EmptyState` component with Shield icon and descriptive text
- **Schema missing**: orange warning note; items still rendered if partial data returned

### Row anatomy

```
[TypeIcon]  Label text              [source label]
            Internal pill / Parent-safe pill
            detail line (session context, evidence summary)
            date (formatDate)
```

---

## page.tsx Changes

**File:** `src/app/director/players/[playerId]/page.tsx`

### Import additions

```ts
import { PlayerEvidenceTimeline } from '@/components/player/PlayerEvidenceTimeline'
import { getPlayerEvidenceTimeline } from '@/lib/players/playerEvidenceRepository'
```

### Data fetch — Tab 5 Notes section

Added immediately after the `evidenceLinkDrafts` fetch:

```ts
const timelineResult = await getPlayerEvidenceTimeline(supabase, params.playerId, academyId)
const timelineItems = timelineResult.data ?? []
const timelineIsSchemaMissing = timelineResult.isSchemaMissing
```

### Render — notesSlot

Replaced:
```tsx
<ProgressEvidenceTimeline items={enrichedObservations as any} />
```

With:
```tsx
<PlayerEvidenceTimeline items={timelineItems} isSchemaMissing={timelineIsSchemaMissing} />
```

The `ProgressEvidenceTimeline` import was removed (no remaining usages).

---

## Why the Replacement Is Safe

`getPlayerEvidenceTimeline()` wraps all queries in try/catch with `EvidenceResult<T>` shape:
- On schema error: `isSchemaMissing: true`, `data: null` → component renders orange note + empty state
- On partial failure: `data: []` → component renders empty state
- On success: fully typed `EvidenceTimelineItem[]`

No `as any` casts in the component. Types flow from repository → page.tsx → component props.

---

## Role Safety

- `PlayerEvidenceTimeline` is used only in the Notes tab of `/director/players/[playerId]`
- No import from any parent portal, player portal, or coach portal route
- `isInternalOnly: true` is hard-coded on `coach_observation` items in the repository
- Raw observation content is not rendered in this component (only `label`, `detail`, `sourceLabel`, `date`)

---

## TypeScript

`npx tsc --noEmit` — **CLEAN** (zero errors, zero warnings).

---

## What Sprint 1057 Should Do

**Sprint 1057: Player Evidence Hub Header Card**

Build `src/components/player/PlayerEvidenceHubHeader.tsx` using the `getPlayerEvidenceSummary()` result.

The component should:
- Accept `summary: PlayerEvidenceSummary | null` and `isSchemaMissing: boolean`
- Render a compact metrics row: total observations / recent (30d) / requirement evidence / parent-safe count / gates with evidence / active priorities
- Show `latestEvidenceDate` and `latestAssessmentDate` as secondary lines
- Use `MetricCard` from `@/components/ui` if it fits, otherwise a horizontal flex row of stat chips
- Wire above `PlayerEvidenceTimeline` in the Notes tab of `page.tsx`
- Director-only. No parent/player portal exposure.
- No migrations, no schema changes.
