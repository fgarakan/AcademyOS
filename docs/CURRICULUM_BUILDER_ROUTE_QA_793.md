# Sprint 793 — Curriculum Builder Route QA V1

**Date:** 2026-05-18
**Sprint:** 793

---

## Route health check

### `/director/curriculum`
- Auth guard: ✅ `getUser()` checked — returns null if unauthenticated
- Data load: ✅ `getCurriculumExplorerData()` called server-side
- Welcome panel: ✅ `CurriculumBuilderWelcome` renders with `hasActiveVersion={!!versionData}`
- Empty state: ✅ `CurriculumSetupState` available as import (used when no version data)
- TypeScript: ✅ Clean

### `/director/curriculum/map`
- Auth guard: ✅ `getUser()` checked
- Data load: ✅ `getCurriculumExplorerData()` called server-side
- Relationship map: ✅ `CurriculumRelationshipMap` rendered above level map
- Level map: ✅ `CurriculumLevelMap` with sufficiency dots
- "Open builder →" link: ✅ Routes to `/director/curriculum/level/[levelId]`
- TypeScript: ✅ Clean

### `/director/curriculum/guided`
- Auth guard: ✅ `getUser()` checked
- Data load: ✅ `getCurriculumExplorerData()` called server-side
- Guided shell: ✅ `CurriculumGuidedReviewShell` rendered
- Safety disclosure: ✅ `DonnaSafetyDisclosure` wired in shell
- TypeScript: ✅ Clean

### `/director/curriculum/level/[levelId]`
- Auth guard: ✅ `getUser()` checked
- Not-found guard: ✅ `notFound()` called if level ID does not match
- Data load: ✅ `getCurriculumExplorerData()` — level found by `params.levelId`
- Draft mode banner: ✅ Lime bordered notice shown
- Builder shell: ✅ `CurriculumLevelBuilderShell` with all 5 tabs
- DONNA context: ✅ `DonnaCurriculumContextPanel` on overview tab
- Safety disclosure: ✅ `DonnaSafetyDisclosure` on overview tab
- TypeScript: ✅ Clean

## Known gaps (not blocking pilot)

1. No sidebar nav link to curriculum builder — director must navigate via `/director/curriculum` manually
2. No breadcrumb from level detail back to map — only `ArrowLeft` to `/director/curriculum/map`
3. `CurriculumChangeQueue` is not loaded from DB anywhere — it is a UI component without a live data feed
4. DONNA draft components do not write to `proposed_actions` — UI shell only for V1
