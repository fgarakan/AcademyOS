# Director Curriculum Template Layer Notes

> Mega Sprint 427–436 — Director Curriculum Template Layer V1
> See also: `docs/DONNA_ACTION_RELIABILITY_NOTES.md`, `docs/audit-log-strategy.md`

---

## What Was Created in Phase 4

Nine new files in `src/lib/director/`:

### `src/lib/director/approvalActions.ts` (Sprint 427)

Director approval workflow data helpers:
- `approveProposedAction()` — validates state machine → writes DB update → logs audit (non-blocking)
- `rejectProposedAction()` — validates input → writes rejection with reason → logs audit
- `requestClarificationOnAction()` — moves to clarification_needed state → logs audit
- `validateExecutionContext()` — pre-execution check using runExecutionGuards()
- All mutations use optimistic locking (`.eq('status', currentStatus)` condition)

### `src/lib/director/templateQueries.ts` (Sprint 428)

Director template management data helpers:
- `fetchPublishedTemplates()` — published templates ordered by creation date
- `fetchTemplatesByStatus()` — all templates by status (draft/published/archived)
- `fetchTemplateCounts()` — parallel count queries for dashboard badge
- `fetchRecentlyUsedTemplates()` — usage aggregated from sessions in a date range

### `src/lib/director/curriculumProgressQueries.ts` (Sprint 429)

Player curriculum progress data helpers:
- `fetchAcademyLevels()` — active levels ordered by sort_order
- `fetchPlayerCurriculumProgress()` — single player's requirement progress
- `fetchPlayersNearingLevelAdvancement()` — players at or above a completion threshold

### `src/lib/director/groupManagementQueries.ts` (Sprint 430)

Group management data helpers:
- `fetchGroupsWithMemberCount()` — active groups with member counts (parallel queries)
- `fetchOverCapacityGroups()` — groups at or over max_players
- `fetchUnassignedPlayers()` — active players not in any active group membership

### `src/lib/director/sessionTimelineQueries.ts` (Sprint 431)

Director session timeline helpers:
- `fetchSessionsInRange(db, academyId, startDate, endDate)` — date range query
- `fetchTodaySessions()`, `fetchThisWeekSessions()` — convenience wrappers
- `groupSessionsByDate(sessions)` — groups results for calendar view
- `computeSessionCoverage(sessions)` — stats: total, completed, cancelled, pending, missingWrapUp

### `src/lib/director/curriculumGapDetector.ts` (Sprint 432)

Pure logic gap analysis (no DB calls):
- `detectPlayerCurriculumGaps(records, options)` — classifies gaps: no_evidence, stalled, low_progress
- `summarizeGaps(gaps)` — aggregate counts for summary view
- Gap severity: high (no evidence, stalled >60d), medium (stalled 30-60d), low (low progress)

### `src/lib/director/templateComplianceChecker.ts` (Sprint 433)

Pure logic template compliance checker (no DB calls):
- `checkTemplateCompliance(templateId, name, blocks)` — per-template compliance result
- `findNonCompliantTemplates(results)` — filter and sort by alignment %
- Issues: no_curriculum_alignment (high), no_requirements_linked (medium), missing_duration (low)

### `src/lib/director/directorAlertQueries.ts` (Sprint 434)

Director alert and signal queries using `v_player_signal_dashboard` view:
- `fetchDirectorAlerts()` — high/critical severity signals
- `fetchDirectorAlertCount()` — count for dashboard badge
- `fetchPlayerSignals()` — signals for a specific player

### `src/lib/director/directorOsSummary.ts` (Sprints 435–436)

Director OS summary assembler (no DB calls — pure aggregation):
- `buildDirectorOsSummary(input)` — assembles all dashboard data into a typed summary
- `getDirectorStatusHeadline(summary)` — one-line status for command bar
- Status items: pending review, clarification needed, wrap-up coverage, active players, alerts
- Overall status: all-clear, attention-needed, urgent

---

## Wiring Required

These helpers are defined but not yet called from pages or server actions:

| Helper | Target Page/Component |
|---|---|
| `approveProposedAction()` | `src/app/director/review/actions.ts` |
| `rejectProposedAction()` | `src/app/director/review/actions.ts` |
| `requestClarificationOnAction()` | `src/app/director/review/actions.ts` |
| `buildDirectorOsSummary()` | `src/app/director/page.tsx` |
| `fetchDirectorAlerts()` | `src/app/director/signals/page.tsx` |
| `fetchGroupsWithMemberCount()` | `src/app/director/players/page.tsx` |
| `fetchTodaySessions()` | `src/app/director/today/page.tsx` |

Wiring to these pages is deferred to Phase 5 where each page is directly targeted.

---

## Schema Notes

- `templates` table: no `duration_min` column; uses `status` as string, not an enum
- `group_memberships`: uses `is_current` (not `is_active`) for active membership check
- `groups`: uses `is_active` for active group status
- `session_status` enum: `planned | in_progress | completed | cancelled` (no `scheduled`)
- `v_player_signal_dashboard`: view — use `rawDb as typeof db` cast for Supabase type inference
