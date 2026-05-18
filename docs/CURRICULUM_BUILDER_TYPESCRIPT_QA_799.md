# Sprint 799 — Curriculum Builder TypeScript QA V1

**Date:** 2026-05-18
**Sprint:** 799

---

## TypeScript clean status

All curriculum builder components and routes have been validated against `npx tsc --noEmit`.

### Final TS check results

```
$ npx tsc --noEmit
(no output — clean)
```

**Status: ✅ Zero TypeScript errors**

---

## Type safety highlights

| Issue | Resolution |
|-------|-----------|
| `Set<number>` spread operator incompatibility | Replaced `new Set([...prev, idx])` with `new Set(Array.from(prev).concat(idx))` |
| `level.name` not on `CurriculumLevel` | Changed all instances to `level.display_name` |
| `level.purpose` not on `CurriculumLevel` | Removed conditional; used static fallback string |
| `CurriculumLevelDetailPanel` props shape | Props are individual arrays, not a single `data` object — corrected in all callers |
| `isStage()` guard for `CurriculumLevelMap` | Uses `s in STAGE_CONFIG` to narrow string to Stage type |

## Component type contracts

| Component | Key types | Notes |
|-----------|----------|-------|
| `CurriculumLevelMap` | `Props: { data: CurriculumExplorerData }` | Fully typed |
| `CurriculumRelationshipMap` | `Props: { levels: CurriculumLevel[], activeLevelId?: string }` | Optional active level |
| `CurriculumGuidedReviewShell` | `Props: { data: CurriculumExplorerData }` | Fully typed |
| `CurriculumLevelBuilderShell` | `Props: { level: CurriculumLevel, data: CurriculumExplorerData }` | Both required |
| `CurriculumChangeQueue` | `Props: { items: CurriculumChangeItem[] }` | Items can be empty array |
| `CurriculumImpactPreviewPanel` | `Props: { estimate: ImpactEstimate \| null, levelName: string }` | Nullable estimate |
| `CurriculumImpactScopeControls` | `Props: { scope: ImpactScope, onChange: (scope: ImpactScope) => void }` | Controlled |
| `CurriculumSufficiencyLabel` | `Props: { status: SufficiencyStatus, label: string, detail?: string }` | Exports `deriveSufficiency()` helper |
| `DonnaSafetyDisclosure` | `Props: { context: 'curriculum_builder' \| 'review_queue' \| 'level_edit' }` | Union type |
| `CurriculumLevelEmptyState` | `Props: { tab: 'drills' \| 'gates' \| 'fitness' \| 'language', levelName: string, onAskDonna: () => void }` | Tab union |

## Exported types

- `CurriculumChangeItem` — exported from `CurriculumChangeQueue.tsx` for caller use
- `ImpactEstimate` — exported from `CurriculumImpactPreviewPanel.tsx`
- `ImpactScope` — exported from `CurriculumImpactScopeControls.tsx`
- `SufficiencyStatus` — exported from `CurriculumSufficiencyLabel.tsx`
- `deriveSufficiency` — exported helper from `CurriculumSufficiencyLabel.tsx`
