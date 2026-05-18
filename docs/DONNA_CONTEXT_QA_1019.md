# DONNA Context QA
Sprint 1019 — 2026-05-18

## Scope

QA audit for Sprint 1011-1018 context infrastructure files.

---

## File Inventory

| File | Sprint | Type | DB Queries | DB Writes | Demo Fallback | academy_id Scoped |
|---|---|---|---|---|---|---|
| `docs/DONNA_CONTEXT_MAP_1011.md` | 1011 | Doc | N/A | N/A | N/A | N/A |
| `src/lib/donna/directorDonnaContext.ts` | 1012 | Loader | Yes (10 queries) | None | Yes | Yes (7 refs) |
| `src/lib/donna/coachDonnaContext.ts` | 1013 | Loader | Yes (8 queries) | None | Yes | Yes (4 refs) |
| `src/lib/donna/contextPackages.ts` | 1014 | Pure types | None | None | N/A | N/A |
| `src/lib/donna/reviewQueueContextPackage.ts` | 1015 | Transformer | None | None | Yes (null check) | N/A |
| `src/lib/donna/academyHealthContextPackage.ts` | 1016 | Loader | Yes (7 queries) | None | Yes | Yes (8 refs) |
| `src/lib/donna/donnaSourceLabels.ts` | 1017 | Pure helpers | None | None | N/A | N/A |
| `src/lib/donna/donnaConfidence.ts` | 1018 | Pure helpers | None | None | N/A | N/A |

---

## Safety Checks

### No DB writes
Pass — grep for `.insert`, `.update`, `.delete`, `.upsert` in all files returned no results.

### academy_id scoping
Pass — all loader files (1012, 1013, 1016) scope every query by `academy_id`.

### Demo fallbacks
Pass — all three loaders (1012, 1013, 1016) return a fully populated demo context when no live data is detected (`!isLive`).

### TypeScript
Pass — `npx tsc --noEmit` clean across all eight files.

### No service role
Pass — all loaders accept a `DB` client passed from the caller. No `getSupabaseServiceRole()` calls.

### No migrations introduced
Pass — no migration files created or modified in Sprints 1011-1018.

---

## Context Source Coverage vs Context Map (Sprint 1011)

| Signal Area | Source Map Status | Covered in Context Files |
|---|---|---|
| Sessions today | Live | Yes — directorDonnaContext, coachDonnaContext, academyHealthContextPackage |
| Wrap-up coverage | Live | Yes — directorDonnaContext (missingWrapUps), coachDonnaContext (wrappedSessionIds) |
| Review queue pending | Live | Yes — directorDonnaContext (pendingReviews), reviewQueueContextPackage |
| Coach wrap-up by session | Live | Yes — wrapUpReviewSurfaceLoader (existing) |
| Player attention risk | Live (rule-based) | Yes — directorDonnaContext (attentionItems via observations + absences) |
| Attendance exceptions | Live | Yes — directorDonnaContext (attendanceExceptions via target_module=attendance) |
| Evidence drafts | Live (display only) | Yes — directorDonnaContext (evidenceDrafts via target_module contains 'evidence') |
| Parent-safe drafts | Live (director only) | Accessible via reviewQueueContextPackage (parent_updates category) |
| Curriculum gates | Schema gap | Correctly blocked — returns empty [] with blocked_by_schema label |
| Template curriculum level | Schema gap (migration 045) | Correctly absent — templates queried without curriculum_level_id |
| Block completion from execute view | Schema gap | Not attempted — localStorage-only, blocked_by_schema noted in context map |

---

## Known Limitations Carried Forward

| Limitation | Files Affected | Risk |
|---|---|---|
| Block completion stored in localStorage only | coachDonnaContext, contextPackages | Medium — blockCount from session_blocks not reflecting actual completion |
| Curriculum gate evidence | directorDonnaContext, contextPackages | High — evidenceDrafts counts proposed_actions with target_module containing 'evidence' but real gate link not built |
| Template curriculum level | contextPackages (TemplateContextPackage.curriculumLevelId) | Medium — field exists in package type but loader cannot populate it without migration 045 |
| Coach observation visibility | directorDonnaContext | Medium — parent-safe check not applied at query layer; assumes parent-safe filter handled upstream |

---

## Integration Points for Phase 3 (Sprints 1020-1029)

The following Sprint 1012-1018 outputs are ready to be consumed by Phase 3 action classification:

| Output | Consumer |
|---|---|
| `DirectorDonnaContext.recommendedActions` | Sprint 1020 action classification input |
| `CoachDonnaContext.recommendedActions` | Sprint 1020 action classification input |
| `ReviewQueueContextPackage.categories` | Sprint 1025 director approval action flow |
| `DonnaSourceLabel` + `ConfidenceResult` | Sprint 1027 action preview card |
| `mergeConfidence()` | Sprint 1029 action QA |

---

## Status

Phase 2 (Sprints 1011-1019) complete. All files TypeScript-clean. No DB writes. No schema changes. All loaders fail safely with demo data.
