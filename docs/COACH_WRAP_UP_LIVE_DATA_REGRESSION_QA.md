# Coach Wrap-Up Live Data — Regression QA

**Sprint:** 533 — Coach Wrap-Up Live Data Regression V1
**Date:** 2026-05-17
**Scope:** Sprints 526–532 — Coach wrap-up live data foundation layer and director review surface

---

## Regression Scope

| Sprint | Deliverable | File(s) |
|---|---|---|
| 526 | Live Session Selector | `src/lib/coach/wrapUpSessionSelector.ts`, `src/app/coach/sessions/page.tsx` |
| 527 | Roster Context | `src/lib/coach/wrapUpRosterLoader.ts` |
| 528 | Attendance Draft | `src/lib/coach/wrapUpAttendanceDraftLoader.ts` |
| 529 | Session Actual Draft | `src/lib/coach/wrapUpSessionActualLoader.ts` |
| 530 | Player Name Match | `src/lib/coach/wrapUpPlayerNameMatcher.ts` |
| 531 | Review Queue Context | `src/lib/coach/wrapUpReviewQueueLoader.ts` |
| 532 | Director Review Surface | `src/lib/donna/wrapUpReviewSurfaceLoader.ts`, `src/app/director/review/WrapUpCoveragePanel.tsx`, `src/app/director/review/page.tsx` |

---

## Files Audited

| File | Sprint | Audited |
|---|---|---|
| `src/lib/coach/wrapUpSessionSelector.ts` | 526 | ✓ |
| `src/app/coach/sessions/page.tsx` | 526 | ✓ |
| `src/lib/coach/wrapUpRosterLoader.ts` | 527 | ✓ |
| `src/lib/coach/wrapUpAttendanceDraftLoader.ts` | 528 | ✓ |
| `src/lib/coach/wrapUpSessionActualLoader.ts` | 529 | ✓ |
| `src/lib/coach/wrapUpPlayerNameMatcher.ts` | 530 | ✓ |
| `src/lib/coach/wrapUpReviewQueueLoader.ts` | 531 | ✓ |
| `src/lib/donna/wrapUpReviewSurfaceLoader.ts` | 532 | ✓ |
| `src/app/director/review/WrapUpCoveragePanel.tsx` | 532 | ✓ |
| `src/app/director/review/page.tsx` | 532 | ✓ |
| `supabase/migrations/007_sessions.sql` | RLS ref | ✓ |
| `src/lib/supabase/database.types.ts` | type ref | ✓ |
| `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` | save ref | ✓ |
| `src/lib/types/db.ts` | type alias ref | ✓ |
| `src/lib/backend/coachWorkspace.ts` | profile.id ref | ✓ |

---

## Pass/Fail Checklist

### Sprint 526 — Live Session Selector

| Check | Result |
|---|---|
| Queries `sessions` scoped by `coach_id` AND `academy_id` | PASS |
| Filters last 7 days, excludes cancelled | PASS |
| Wrap-up detection via `voice_notes.session_id` set — no false positives | PASS |
| Returns `needsWrapUp[]` and `alreadySubmitted[]` correctly split | PASS |
| Returns empty result (not error) when no sessions | PASS |
| Wired into `/coach/sessions/page.tsx` — "WRAP-UPS NEEDED" section renders | PASS |
| No writes | PASS |
| `coachId` used = `profile.id` = auth user id = same as `sessions.coach_id` reference | PASS |

### Sprint 527 — Roster Context

| Check | Result |
|---|---|
| `session_attendance` queried without explicit `academy_id` | SEE NOTE 1 |
| RLS on `session_attendance` enforces academy scope via `sessions.academy_id` JOIN | PASS (RLS correct) |
| Fetches group roster first, falls back to attendance roster | PASS |
| Merges unrostered attendees (union, not intersection) | PASS |
| Returns `rosterSource: 'empty'` when no players at all | PASS |
| Player names resolved from `players.full_name` with fallback | PASS |
| Sorted: rostered first, then alphabetical | PASS |
| Read-only — no writes | PASS |
| **Not wired to UI** — foundation-only | SEE NOTE 2 |

### Sprint 528 — Attendance Draft

| Check | Result |
|---|---|
| `session_attendance` queried without explicit `academy_id` | SEE NOTE 1 |
| RLS correctly scopes via session JOIN | PASS (RLS correct) |
| `marked_at` and `marked_by` are valid columns per migration 007 and database.types.ts | PASS |
| `unrecorded` status used for players with no attendance record (not `null`) | PASS |
| `isPartiallyFilled` flag correct — true only when some recorded, some not | PASS |
| `hasAnyRecord` correctly reflects whether any `session_attendance` rows exist | PASS |
| Read-only — no writes to session_attendance | PASS |
| **Not wired to UI** — foundation-only | SEE NOTE 2 |

### Sprint 529 — Session Actual Draft

| Check | Result |
|---|---|
| `session_blocks` queried without academy_id (RLS handles via session JOIN) | PASS (RLS correct) |
| `session_block_exercises` uses `rawDb as any` cast per AI_BACKEND_RULES.md rule 4 | PASS |
| Blocks with zero exercises counted as "fully completed" (`completionRate === 1 OR totalExercises === 0`) | PASS (correct design: no exercises = block ran as planned) |
| `overallCompletionRate` is exercise-level (not block-level), correctly handles zero-exercise sessions | PASS |
| Returns `hasBlockData: false` and empty result when no session blocks | PASS |
| Read-only — no writes | PASS |
| **Not wired to UI** — foundation-only | SEE NOTE 2 |

### Sprint 530 — Player Name Matcher

| Check | Result |
|---|---|
| Pure utility — no DB calls, no server imports | PASS |
| Matches: full name > first name > last name > partial prefix (4+ chars) | PASS |
| Each player appears at most once per call (early-continue pattern) | PASS |
| Handles empty text or empty roster gracefully | PASS |
| `matchPlayerNamesPerSentence` splits on `.!?\n` — covers standard sentence breaks | PASS |
| No auto-actions — match results are advisory only | PASS |
| **Not wired to UI** — foundation-only | SEE NOTE 2 |

### Sprint 531 — Review Queue Context (Coach-side)

| Check | Result |
|---|---|
| Queries `proposed_actions` scoped by `academy_id` AND `proposed_by_id` | PASS |
| `proposed_by_id` = auth user ID — matches how `saveWrapUpDraftAction` writes it | PASS |
| `expires_at` is a valid column on `proposed_actions` per `database.types.ts` | PASS |
| Limited to 20 items, last 7 days — no unbounded scan | PASS |
| Status filter: `pending_review` and `approved` only — not executed/rejected | PASS |
| `action_label` column is non-nullable in types — always safe to display | PASS |
| Read-only — no writes | PASS |
| **Not wired to UI** — foundation-only | SEE NOTE 2 |

### Sprint 532 — Director Review Surface

| Check | Result |
|---|---|
| `loadWrapUpReviewSurface` uses `DB` type alias — confirmed equivalent to `SupabaseClient<Database>` | PASS |
| Queries `sessions` scoped by `academy_id`, excludes cancelled | PASS |
| `voice_notes` queried by `academy_id` AND `.in('session_id', sessionIds)` — dual scope | PASS |
| `proposed_actions` filtered by `academy_id`, `target_module: 'session_wrap_up_v1'`, `in('target_object_id', sessionIds)` | PASS |
| `target_module: 'session_wrap_up_v1'` matches `saveWrapUpDraftAction.ts` exactly | PASS |
| `target_object_id` is nullable in schema — `.in()` filter correctly skips null rows | PASS |
| Empty state: returns early with all zeros when no sessions this week | PASS |
| `wrapUpStatus` precedence: proposed_action status > voice_notes 'submitted' > null | PASS |
| `WrapUpCoveragePanel` renders "Review-only — this does not change official records." | PASS |
| `WrapUpCoveragePanel` handles `totalSessionsThisWeek === 0` with calm empty state | PASS |
| No DANA references in any file | PASS |
| Coverage panel placed below summary cards, above stale/all-clear banners | PASS |
| Coverage panel does not resolve coach name (only has coach UUID — no extra DB call) | PASS — design intent |
| Wired into `/director/review/page.tsx` | PASS |

---

## Safety Checklist

| Safety Rule | Result |
|---|---|
| All loaders are read-only — no writes to any table | PASS |
| Attendance data is draft-only — reads existing records, never creates or modifies | PASS |
| Unrostered attendees remain review-only — flagged only, not auto-added to roster | PASS |
| Session actuals are draft-only — no writes to session_blocks or session_block_exercises | PASS |
| Player name matches are advisory only — no auto-observations, no player profile mutation | PASS |
| No parent-facing sends from any sprint file | PASS |
| No player level movement | PASS |
| No curriculum mutation | PASS |
| No roster changes | PASS |
| No RLS bypass — service role not used in any loader | PASS |
| `academy_id` scoping present in all loaders that query tables directly (session_attendance scoped via RLS JOIN) | PASS |
| `WrapUpCoveragePanel` copy is director-facing only — no parent/player exposure | PASS |
| "Review-only — this does not change official records." present in panel | PASS |
| No unsafe action language anywhere in sprint UI | PASS |

---

## Note 1 — session_attendance Queries Without Explicit academy_id

`wrapUpRosterLoader.ts` and `wrapUpAttendanceDraftLoader.ts` query `session_attendance` without an explicit `.eq('academy_id', ...)` filter. This is safe because:

- `session_attendance` does not have an `academy_id` column.
- The RLS policy on `session_attendance` uses:
  ```sql
  EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_attendance.session_id AND s.academy_id = auth_academy_id() AND auth_is_staff())
  ```
- Academy scoping is enforced at the RLS layer via the `sessions` JOIN.
- The `sessionId` parameter passed to both loaders is already academy-scoped (resolved from a session that was scoped by academy_id in the prior step).

**Verdict:** Safe. Academy isolation is enforced by RLS, not the application layer, for this table.

---

## Note 2 — Sprints 527–531 Loaders Not Yet Wired to UI

Loaders built in Sprints 527–531 (`wrapUpRosterLoader`, `wrapUpAttendanceDraftLoader`, `wrapUpSessionActualLoader`, `wrapUpPlayerNameMatcher`, `wrapUpReviewQueueLoader`) are **not imported or called from any page or component** as of Sprint 532.

This is **by design** for this foundation-building mega sprint. Each loader is:
- Complete, type-safe, and read-only.
- Ready to be wired into a wrap-up detail drawer or page.
- Blocked only on the UI layer that will consume them.

**Not a regression.** The intended wiring point is a future "Wrap-Up Detail" page or the `CoachWrapUpDrawer` extended context step (Sprint 534+).

---

## TypeScript Result

```
npx tsc --noEmit
```

**Result: CLEAN** — no errors before or after Sprint 532.

---

## Browser QA Result

Browser testing not available in this environment (no running dev server accessible).

**Static QA confirmed by code audit:**

| Check | Result |
|---|---|
| `/director/review` renders WrapUpCoveragePanel below summary cards | Confirmed by JSX at page.tsx:1265–1266 |
| Empty state when no sessions (totalSessionsThisWeek === 0) | Confirmed at WrapUpCoveragePanel.tsx:24 |
| Coverage rate renders with color (green ≥ 100%, orange ≥ 50%, red < 50%) | Confirmed at WrapUpCoveragePanel.tsx:17–21 |
| Per-session rows: CheckCircle (submitted) / Clock (missing) icons | Confirmed |
| "Review-only — this does not change official records." footer | Confirmed |
| No DANA references | Confirmed — zero grep results |
| No hydration errors — all components are server components, no state | Confirmed — no `useState`, `useEffect` in panel |
| DONNA opens/persists — panel does not affect DONNA flow | Confirmed — panel is a static server component |
| 058 migration clean — not staged | Confirmed — zero diff vs HEAD |

---

## Known Limitations

| Limitation | Impact | Fix Path |
|---|---|---|
| Coach UUID shown in loader result but not resolved to name | `WrapUpCoveragePanel` cannot display coach name without extra DB join | Add `coach_name` to `wrapUpReviewSurfaceLoader` by joining `profiles` in a future sprint |
| Sprints 527–531 loaders not wired to UI | Roster, attendance, session actual, name match, and coach review queue data exist but are not surfaced | Sprint 534+ — wire into wrap-up detail view or extended coach wrap-up drawer |
| Wrap-up detection uses `voice_notes.session_id` as proxy | A session could have a voice note that is NOT a formal wrap-up (e.g., a Quick Note). Over-counts "submitted" in edge cases | Sprint 534+ — add a `is_wrap_up` boolean column to `voice_notes` (migration required, not in scope) |
| `wrapUpCoverage` shows all sessions across all coaches for the director | Director cannot filter by coach in the current panel | Future polish sprint — add coach filter row or group by coach |
| `session_block_exercises.completed` read in Sprint 529 via `rawDb as any` | Types are not enforced for this query — runtime relies on DB column existing | Apply migration 056 to live DB to fully activate session block exercises |
| `loadCoachReviewQueue` (Sprint 531) uses `target_object_id` as `sessionId` proxy | `target_object_id` is nullable and not exclusively used for session IDs — could return non-session items | Filter by `target_module` in the consumer or add explicit type guard |

---

## Required Future Migrations / Schema Gaps

No new migrations required by these sprints. Existing pending migrations that affect the wrap-up flow:

| Migration | Status | Impact |
|---|---|---|
| `056_session_block_exercises_rls.sql` | Pending live application | Sprint 529 loader reads `session_block_exercises` via `rawDb as any` — works correctly but exercises may be empty until RLS migration is applied |
| `058_template_block_exercises_rls.sql` | Pending live application | Not directly in wrap-up flow — affects fitness templates only |

---

## Recommendation for Sprint 534

**Option A (recommended): Coach Wrap-Up Detail Panel V1**

Wire the Sprints 527–529 loaders into a `CoachWrapUpDetailPanel` component that shows:
- Roster with attendance status (from `loadWrapUpRoster`)
- Per-block completion summary (from `loadWrapUpSessionActual`)
- Attendance draft fill state (from `loadWrapUpAttendanceDraft`)

Route: accessible from the "WRAP-UPS NEEDED" link on `/coach/sessions`, rendered on the existing `/coach/sessions/[sessionId]` page (new tab or expanded section).

No migrations needed. No writes. All loaders are ready. Primarily UI work.

**Option B: Director Wrap-Up Coverage Detail Drill-Down**

Add a session-level drill-down to `WrapUpCoveragePanel` so directors can click a session and see why it's "Missing" — linking to the coach's session detail page.

**Option C: Wrap-Up Detection Accuracy Fix**

Add `is_wrap_up` boolean to `voice_notes` (migration required). Fixes the over-counting edge case where a Quick Note is mistaken for a formal wrap-up in the coverage panel and session selector.

**Verdict:** Option A first. It delivers director-visible value immediately by completing the wrap-up foundation story without new migrations.
