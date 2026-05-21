# Player Evidence Demo Readiness Notes

> Mega Sprint 447–451 — Player Evidence Demo Readiness V1
> See also: `docs/COACH_SESSION_RECAP_INTELLIGENCE_NOTES.md`, `docs/DIRECTOR_CURRICULUM_TEMPLATE_NOTES.md`

---

## What Was Created in Phase 6

Five new files across `src/lib/player/`, `src/lib/parent/`, and `src/lib/demo/`.

### `src/lib/player/evidenceQueries.ts` (Sprint 447)

Player evidence and requirement progress data helpers:
- `fetchPlayerRequirementProgress()` — all progress records, no visibility filter (coach/director)
- `fetchPlayerVisibleProgress()` — `is_player_visible=true` only (player portal)
- `fetchParentVisibleProgress()` — `is_parent_visible=true` only (parent portal)
- `fetchRequirementEvidenceLinks()` — evidence links, optionally scoped to a requirement
- `fetchParentSafeEvidenceLinks()` — `is_parent_safe=true` only
- `countEvidenceByRequirement()` — pure: counts evidence per requirement from pre-fetched links
- `summarizeProgressByStatus()` — pure: buckets progress records by status

**Schema notes:**
- `player_requirement_progress`: `is_player_visible`, `is_parent_visible` are the visibility gates
- `requirement_evidence_links`: `is_parent_safe` is the parent evidence gate
- Both tables include `academy_id` — all queries are academy-scoped

### `src/lib/player/developmentProfileQueries.ts` (Sprint 448)

Player development profile and priority helpers:
- `fetchPlayerDevelopmentSummary()` — full summary, coach/director facing, no visibility filter
- `fetchPlayerSummaryForStudent()` — `show_to_student=true` gate (never bypassed)
- `fetchPlayerSummaryForParent()` — `show_to_parent=true` gate (never bypassed)
- `fetchPlayerPriorities()` — all active priorities, ordered by `priority_rank` ascending
- `fetchTopPlayerPriorities()` — top N by `priority_rank` (default 3)
- `isProfileShownToStudent()`, `isProfileShownToParent()` — pure visibility guards
- `getStudentFacingContent()` — extracts student-safe text; returns null if not visible
- `getParentFacingContent()` — extracts parent-safe text; returns null if not visible

**Schema notes:**
- `player_development_summary`: `show_to_parent` and `show_to_student` are the content gates
- These records are in the **no-cache zone** — must always be fetched real-time
- `player_priorities`: ordered by `priority_rank` (integer, 1 = highest priority)
- `priority_rank` column must be used (not `rank` — reserved PostgreSQL keyword)

### `src/lib/player/playerPortalQueries.ts` (Sprint 449)

Player portal data layer — the player's own view:
- `fetchPlayerPortalSummary()` — reads `v_player_summary` view via `rawDb` cast pattern
- `fetchPlayerPortalProfile()` — full parallel assembly: summary + development + priorities + progress
- `fetchPlayerPortalProgress()` — player-visible requirement progress only
- `fetchPlayerPortalPriorities()` — top 3 active priorities by rank
- `isPlayerPortalReady()` — pure: checks whether the portal has enough data to render

**View access pattern:**
```typescript
const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db
const { data } = await (rawDb as typeof db).from('v_player_summary').select(...)
```
This pattern matches `directorAlertQueries.ts` for `v_player_signal_dashboard`.

### `src/lib/parent/parentPortalQueries.ts` (Sprint 450)

Parent portal data layer — parent's view of their child:
- `fetchParentPortalPlayerCard()` — parent-safe player fields; resolves group and level names
- `fetchParentPortalProfile()` — full parallel assembly of all parent-gated data
- `fetchParentPortalProgress()` — parent-visible requirement progress only
- `fetchParentPortalDevelopmentSummary()` — `show_to_parent=true` gate
- `isParentPortalReady()` — pure readiness guard
- `parentCanSeeDevelopmentContent()` — pure content visibility guard

**Visibility invariants enforced:**
- Parents never see coach-internal summaries (`coach_summary` field)
- Parents never see unflagged evidence (`is_parent_safe=false`)
- Parents never see hidden progress (`is_parent_visible=false`)
- `show_to_parent=false` → development summary is not returned, not just hidden

### `src/lib/demo/demoReadinessChecker.ts` (Sprint 451)

Demo readiness validation utilities:
- `checkPlayerHasRequiredData()` — player exists, is active, has level assigned
- `checkAcademyHasSessionData()` — at least one session exists
- `checkAcademyHasTemplates()` — at least one active template exists
- `checkParentSafeSummariesExist()` — at least one summary with `show_to_parent=true`
- `checkProgressDataExists()` — at least one `player_requirement_progress` record
- `checkPendingActionsExist()` — at least one `proposed_action` with `status=pending_review`
- `buildDemoReadinessReport()` — parallel check assembly; returns pass/fail counts
- `formatReadinessReport()` — human-readable string for `/dev/diagnostics`

---

## Wiring Required

These helpers are defined but not yet wired into pages:

| Helper | Target |
|---|---|
| `fetchPlayerPortalProfile()` | `src/app/player/page.tsx` |
| `fetchPlayerPortalProgress()` | `src/app/player/progress/page.tsx` |
| `fetchParentPortalProfile()` | `src/app/parent/page.tsx` |
| `fetchParentPortalProgress()` | `src/app/parent/progress/page.tsx` |
| `buildDemoReadinessReport()` | `src/app/dev/diagnostics/page.tsx` |

Wiring deferred to Phase 7 where each portal page is targeted.

---

## Trust Stack Alignment

- `fetchPlayerSummaryForStudent()` is Layer 5 (Permissions Constrain) — `show_to_student` gate
- `fetchPlayerSummaryForParent()` is Layer 5 (Permissions Constrain) — `show_to_parent` gate
- `fetchParentSafeEvidenceLinks()` is Layer 5 — `is_parent_safe` gate
- `buildDemoReadinessReport()` is Layer 7 (Logs Explain) — dev-only observability
- No DONNA calls in this phase — pure data layer with no AI mutation path
