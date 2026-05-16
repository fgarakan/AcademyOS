# COO Live Data Wiring Map — Sprint 511

**Scope:** All 14 COO Intelligence surfaces (Sprints 461–510)
**Date:** 2026-05-16
**Purpose:** Classify each surface by live-data readiness and map exactly what tables, views, and actions can power it today.

Cross-reference:
- `DONNA_LIVE_DATA_GAPS.md` — prioritized gap list derived from this audit
- `docs/ACADEMY_COO_KPI_DICTIONARY.md` — KPI definitions
- `src/lib/donna/academyHealthSourceMap.ts` — per-KPI availability flags (runtime constants)

---

## Classification Key

| Class | Meaning |
|---|---|
| **live** | Queries real DB data; RLS-scoped; no demo dependency |
| **partial** | Core data available; some fields or signals not yet wired |
| **demo-only** | Renders from `donnaDemoSeed.ts`; no live query layer exists |
| **blocked-rls** | Tables exist but RLS policy is missing or incorrect |
| **blocked-schema** | Requires a column or table that does not exist in the live DB |
| **blocked-adapter** | Schema exists; server action / aggregation layer not yet built |

---

## Surface 1 — `/api/donna/brief` (Daily Brief API)

**Component:** `src/app/api/donna/brief/route.ts`
**Classification: PARTIAL**

| Field | Source | Status |
|---|---|---|
| `pendingCount` | `proposed_actions WHERE status='pending_review' AND academy_id` | ✅ live |
| `sessionCount` (today) | `sessions WHERE scheduled_date = today AND academy_id` | ✅ live |
| `placementCount` | `players WHERE status='pending_placement' AND academy_id` | ✅ live |
| Coach wrap-up coverage | `proposed_actions WHERE source_type='coach_wrap_up_v2'` grouped by session_id | ❌ not queried |
| Attention flags | `coach_notes` concerns + `proposed_actions` player_support | ❌ not queried |
| Session-level wrap-up status | `sessions` JOIN `proposed_actions` by session_id | ❌ not queried |

**What makes it partial:** The route returns the 3 core counts correctly. The `DonnaCommandBriefData` shape (`totalPlayersAttending`, `wrapUpsSubmitted`, `wrapUpsOutstanding`, `attentionFlags[]`, `sessions[]`) is fully supported by existing tables but not yet queried.

**Read-only live wiring possible now:** Yes — extend this route with 3 additional queries against `sessions`, `session_attendance`, and `proposed_actions`. No migration needed.

**Safest next sprint:** Sprint 512 — Command Brief Live Data Wiring (extend `/api/donna/brief` to return full `DonnaCommandBriefData`)

---

## Surface 2 — `/api/donna/attention` (What Needs Attention API)

**Component:** `src/app/api/donna/attention/route.ts`
**Classification: PARTIAL**

| Signal | Source | Status |
|---|---|---|
| `pending_review` count → review queue item | `proposed_actions` | ✅ live |
| `pending_placement` count → placement item | `players` | ✅ live |
| Coach observation concerns | `coach_notes WHERE observation_type='concern'` | ❌ not queried |
| Attendance gaps (players with >2 absences) | `session_attendance WHERE attended=false` | ❌ not queried |
| Players with no wrap-up mention | `sessions` vs `voice_notes` | ❌ not queried |

**What makes it partial:** The 2 live signals are the most operationally relevant ones. Adding coach concern observations and attendance gaps would make this surface significantly more useful.

**Read-only live wiring possible now:** Yes — `coach_notes` and `session_attendance` both have correct RLS and `academy_id` columns.

**Safest next sprint:** Sprint 513 — Attention API Signals Expansion

---

## Surface 3 — DONNA Daily Command Brief (Component)

**Component:** `src/components/assistant/DonnaCommandBriefIntegration.tsx`
**Classification: PARTIAL** (component is props-only; readiness depends on data loader)

| Prop | Wired from | Status |
|---|---|---|
| `itemsPendingDirectorReview` | `/api/donna/brief` → `proposed_actions` | ✅ partial (count is live) |
| `totalSessionsToday` | `/api/donna/brief` → `sessions` | ✅ partial (count is live) |
| `totalPlayersAttending` | Not yet in API | ❌ blocked-adapter |
| `wrapUpsSubmitted` / `wrapUpsOutstanding` | Not yet in API | ❌ blocked-adapter |
| `attentionFlags[]` | Not yet in API | ❌ blocked-adapter |
| `sessions[]` with `wrapUpSubmitted` | Not yet in API | ❌ blocked-adapter |

**Current consumption:** The component is used in:
1. `src/app/director/donna-coo-demo/page.tsx` → fed `DEMO_COMMAND_BRIEF_DATA` (demo-only)
2. Not yet surfaced on any live director route with real data

**Required tables (all live, all RLS-correct):** `sessions`, `session_attendance`, `proposed_actions`, `coach_notes`

**Safest next sprint:** Sprint 512 — wire full `DonnaCommandBriefData` loader in `/api/donna/brief` and surface on `/director/today`

---

## Surface 4 — DONNA Weekly COO Report

**Component:** `src/components/assistant/DonnaCOOWeeklyReport.tsx`
**Classification: DEMO-ONLY**

| Section | Required data | Tables | Status |
|---|---|---|---|
| Sessions this week | Count + completion rate | `sessions` | ❌ no loader built |
| Wrap-up coverage rate | Sessions with vs. without wrap-up | `sessions` + `proposed_actions` | ❌ no loader |
| Observations submitted | Count by week | `coach_notes` | ❌ no loader |
| Pending review queue | Count by week | `proposed_actions` | ❌ no loader |
| Review queue throughput | `created_at` → `approved_at` delta | `proposed_actions` | ❌ `approved_at` may not exist in live schema |
| Players needing attention | Week-over-week flag count | `coach_notes` + `proposed_actions` | ❌ no loader |

**Schema gap check:** `proposed_actions` table has `created_at`. The `approved_at` and `applied_at` columns are referenced in `academyHealthSourceMap.ts` but may not exist in live schema — must be verified before building this loader.

**Demo dependency:** `DEMO_COO_REPORT_DATA` from `donnaDemoSeed.ts`

**Read-only live wiring possible now:** Partially — the session/observation counts can be built without schema changes. Week-over-week throughput metrics require confirming `approved_at`/`applied_at` columns exist.

**Safest next sprint:** Sprint 514 — COO Weekly Report Data Loader (requires confirming schema; no migration if columns already exist)

---

## Surface 5 — Player Attention Risk Dashboard

**Component:** `src/components/assistant/PlayerAttentionRiskDashboard.tsx`
**Classification: PARTIAL** (blocked-adapter — tables live, no server action built)

| Data field | Source table | Column | Status |
|---|---|---|---|
| `playerId` / `playerName` | `players` | `id`, `first_name`, `last_name` | ✅ live |
| `groupName` | `groups` or `sessions` → players | depends | ✅ via `coach_group_assignments` |
| `riskLevel` | derived from flag count | computed | ❌ no computation layer |
| `primaryFlag` / `flagSummary` | `coach_notes` | `observation_type`, `content` | ✅ table live |
| `sessionsWithFlag` | `coach_notes` + `sessions` | join count | ❌ no aggregation |
| `lastFlaggedDate` | `coach_notes` | `created_at` | ✅ table live |
| `pendingProposedActions` | `proposed_actions` | `status`, `subject_player_id` | ✅ table live |

**RLS check:** `coach_notes` has `academy_id` + RLS — safe for director read. `proposed_actions` same. No RLS risk.

**Missing:** A server action `getPlayerAttentionRiskAction(academyId)` that:
1. Queries `coach_notes WHERE observation_type='concern'` grouped by player
2. Queries `proposed_actions WHERE status='pending_review' AND target_module='player_support'`
3. Joins with `players` for names
4. Returns `PlayerAttentionRiskData[]` sorted by flag frequency

**Read-only live wiring possible now:** Yes — no migration needed. Pure read queries.

**Safest next sprint:** Sprint 513 — Player Attention Risk Live Data Loader

---

## Surface 6 — Group Health Review Dashboard

**Component:** `src/components/assistant/GroupHealthReviewDashboard.tsx`
**Classification: DEMO-ONLY** (blocked-adapter — requires aggregation across multiple tables)

| Field | Required query | Tables | Status |
|---|---|---|---|
| `attendanceRate` | Avg attended/total per group | `session_attendance` + `sessions` | ❌ no aggregation |
| `sessionCompletionRate` | Sessions `status=completed` / total | `sessions` | ❌ no view |
| `wrapUpSubmissionRate` | Sessions with wrap-up / total | `sessions` + `proposed_actions` | ❌ no join |
| `coachName` | `sessions.coach_id` → `profiles` | `sessions`, `profiles` | ✅ joinable |
| `groupId` / `groupName` | `groups` or embedded in `sessions` | `sessions` | ✅ via sessions |
| `healthScore` | computed | derived | ❌ no scoring logic |

**Demo dependency:** `DEMO_GROUP_HEALTH` from `donnaDemoSeed.ts`

**Blocker:** No group health aggregation view. The `v_group_summary` view referenced in `coachWorkspace.ts` may provide partial data — check if it includes session counts.

**Migration required:** No — can compute inline in a server action. No new tables needed.

**Safest next sprint:** Sprint 515 — Group Health Aggregation Server Action

---

## Surface 7 — Coach Support Needed Dashboard

**Component:** `src/components/assistant/CoachSupportNeededDashboard.tsx`
**Classification: DEMO-ONLY** (blocked-adapter)

| Signal | Required query | Tables | Status |
|---|---|---|---|
| `wrapUpGapDays` | Days since last `voice_notes` by coach | `voice_notes` | ✅ table live |
| `unresolvedFollowUps` | `proposed_actions` pending older than N days | `proposed_actions` | ✅ table live |
| `sessionCoverageRate` | Sessions where coach submitted vs. total | `sessions` + `voice_notes` | ✅ joinable |
| `lastObservationDate` | Most recent `coach_notes` by coach_id | `coach_notes` | ✅ table live |
| `coachName` | `profiles.first_name` | `profiles` + `academy_memberships` | ✅ live |

**RLS check:** All tables have `academy_id` or coach-scoped RLS. Director read is safe.

**Demo dependency:** `DEMO_COACH_SUPPORT` from `donnaDemoSeed.ts`

**Read-only live wiring possible now:** Yes — all required tables exist. No migration needed.

**Safest next sprint:** Sprint 515 or 516 — Coach Support Live Data Loader

---

## Surface 8 — Parent Trust Coverage Dashboard

**Component:** `src/components/assistant/ParentTrustCoverageDashboard.tsx`
**Classification: PARTIAL** (blocked by missing `applied_at` tracking on parent_update actions)

| Field | Required query | Tables | Status |
|---|---|---|---|
| `playerName` | `players` | `first_name`, `last_name` | ✅ live |
| `lastParentContactDate` | `proposed_actions WHERE target_module='parent_update' AND status='applied'` | `proposed_actions` | ❌ `applied_at` column TBD |
| `contactStatus` | derived from days since contact | computed | ❌ depends on above |
| `hasPendingDraft` | `proposed_actions WHERE status='pending_review'` | `proposed_actions` | ✅ table live |
| `guardianLinked` | `player_guardians` → `guardians` | `player_guardians`, `guardians` | ✅ tables live (may be sparsely populated) |

**`academyHealthSourceMap.ts` classification:** `not_yet_built`

**Key gap:** The `proposed_actions` table needs confirmed `applied_at` column. The `parent_update` adapter (separate from draft creation) that marks actions as `applied` with a timestamp is not yet built.

**Read-only live wiring possible now:** Partial — can show pending drafts and guardian-linked status. Cannot show last contact date until `applied_at` is confirmed and parent_update adapter exists.

**Safest next sprint:** Sprint 516 — Parent Trust Coverage Partial Live Wiring (pending drafts + guardian link status only)

---

## Surface 9 — Curriculum Bottleneck Dashboard

**Component:** `src/components/assistant/CurriculumBottleneckDashboard.tsx`
**Classification: BLOCKED BY SCHEMA GAP**

| Field | Required table/column | Status |
|---|---|---|
| `skillTag` | `coach_notes.skill_tag` column | ❌ column may not exist in live DB |
| `affectedPlayerCount` | aggregation over `coach_notes` by skill_tag | ❌ depends on skill_tag |
| `curriculumRequirement` | `curriculum_requirements` table | ❌ migration 041 not applied to live DB |
| `bottleneckSeverity` | computed from flag frequency | computed |
| `gateBlock` | `curriculum_requirements.gate_skill` | ❌ depends on migration 041 |

**Hard blocker:** `curriculum_requirements` table does not exist in the live DB (migration 041 pending — see `KNOWN_LIMITATIONS.md`). The `skill_tag` column on `coach_notes` is also unconfirmed.

**Migration required:** YES — migrations 041–044 must be applied before this surface can be wired.

**Safest next sprint:** Deferred until migrations 041–044 are applied and confirmed.

---

## Surface 10 — DONNA Ask Academy Health Questions

**Component:** `src/lib/donna/donnaAcademyHealthQuestions.ts` + intent routing in `DonnaAssistantButton`
**Classification: PARTIAL**

| Question category | Data source | Status |
|---|---|---|
| `player_attention` | `/api/donna/attention` | ✅ partial (2 signals live) |
| `group_health` | No live loader | ❌ demo-only |
| `coach_support` | No live loader | ❌ demo-only |
| `parent_coverage` | `proposed_actions` partial | ❌ not wired |
| `curriculum` | No live loader (schema gap) | ❌ blocked-schema |

**Current behavior:** DONNA responds using `responseTemplateNoData` for all categories except `player_attention` which routes through `/api/donna/attention`.

**Safest next sprint:** Progressive — as live loaders are built per surface (Sprints 512–516), responses shift from `responseTemplateNoData` → `responseTemplateDataAvailable`.

---

## Surface 11 — DONNA Ask Coach Wrap-Up Questions

**Component:** `src/lib/donna/donnaWrapUpQuestions.ts` + intent routing in `DonnaAssistantButton`
**Classification: PARTIAL**

| Question category | Data source | Status |
|---|---|---|
| `review_queue` status | `proposed_actions` via `getDonnaReviewQueueAction` | ✅ live |
| `submission_status` (wrap-ups today) | Not yet in any route | ❌ blocked-adapter |
| `session_summary` (what happened) | `sessions` + `voice_notes` | ❌ not wired to question flow |
| `observations` from session | `coach_notes` | ❌ not wired to question flow |
| `follow_ups` list | `proposed_actions` | ✅ partial (via review queue count) |

**Safest next sprint:** Sprint 513 — extend `/api/donna/brief` or add a new `/api/donna/wrapup-status` route that answers submission_status questions.

---

## Surface 12 — DONNA Cross-Module Context Ranking

**Component:** `src/lib/donna/donnaContextRanking.ts`
**Classification: PARTIAL**

The ranking algorithm is complete TypeScript logic. The gap is populating the `DonnaContextRankingInput` struct from live data.

| Input field | Live data source | Status |
|---|---|---|
| `pendingReviewCount` | `/api/donna/attention` or `getDonnaReviewQueueAction` | ✅ live |
| `approvedNotAppliedCount` | `proposed_actions WHERE status='approved'` | ✅ queryable |
| `highUrgencyFlagCount` | `/api/donna/attention` items with urgency=critical | ✅ partial |
| `wrapUpsOutstanding` | `sessions` vs `proposed_actions` join | ❌ not yet in any route |
| `playerAttentionRiskCount` | `coach_notes` concerns count | ❌ not yet in any route |
| `coachSupportNeededCount` | `coach_notes` + `voice_notes` gap | ❌ not yet in any route |
| `parentUpdateOverdueCount` | `proposed_actions` parent_update applied_at | ❌ blocked-adapter |
| `curriculumBottleneckCount` | `coach_notes.skill_tag` | ❌ blocked-schema |
| `groupsAtRiskCount` | attendance aggregation | ❌ not yet built |

**What's already wired:** The context ranker IS called inside `DonnaAssistantButton.tsx` with live `pendingReviewCount` and `approvedNotAppliedCount`. Other fields default to 0.

**Safest next sprint:** Progressive improvement as live loaders land. No isolated sprint needed — ranking improves automatically as input signals are wired.

---

## Surface 13 — Coach Daily Wrap-Up Flow

**Components:** `src/components/capture/WrapUpOrchestrator.tsx`, `DonnaWrapUpPrompt.tsx`, all `WrapUp*` components
**Classification: PARTIAL**

| Step | Action | Status |
|---|---|---|
| Capture (UI) | `WrapUpOrchestrator` — 5-step flow | ✅ complete |
| Voice parsing | `wrapUpVoiceParser.ts` | ✅ complete |
| Validation | `wrapUpValidation.ts` | ✅ complete |
| Build payload | `wrapUpSessionBuilder.ts` | ✅ complete |
| Build proposed_actions | `wrapUpProposedActions.ts` | ✅ complete |
| Save raw recap | `saveWrapUpDraftAction` → `voice_notes` | ✅ live |
| Save observations | `saveWrapUpObservationsAction` → `proposed_actions` | ✅ live |
| Save attendance exception | `saveWrapUpAttendanceExceptionAction` → `proposed_actions` | ✅ live |
| Apply approved wrap-up | `applyWrapUpDraftAction` → `sessions.session_notes` | ✅ live (limited — writes text only, no normalized session_actuals) |
| Normalized session actuals write | `session_actuals` table | ❌ table does not exist yet |

**Known limitation (from KNOWN_LIMITATIONS.md):** Wrap-up applies to `sessions.session_notes` (free text). A dedicated `session_actuals` table with normalized fields is not yet built.

**Safest next sprint:** The wrap-up pipeline is functional end-to-end. Blocking improvement is `session_actuals` table (migration required — separate sprint).

---

## Surface 14 — `/director/donna-coo-demo`

**Component:** `src/app/director/donna-coo-demo/page.tsx`
**Classification: DEMO-ONLY** (by design — this is the showcase route)

All 7 dashboard components are rendered from `donnaDemoSeed.ts`. No DB queries. Demo banner is displayed. This route is intentionally demo-only and should remain so until individual component live loaders are built and a live route is chosen to surface them.

**Transition plan:** When Surfaces 1–13 are wired live, the demo route can be supplemented with a live director dashboard or `/director/today` integration. The demo route itself should be preserved for walkthrough purposes.

---

## Summary Table

| Surface | Classification | Can wire live now? | Migration needed? | Priority sprint |
|---|---|---|---|---|
| `/api/donna/brief` | partial | ✅ yes | No | Sprint 512 |
| `/api/donna/attention` | partial | ✅ yes | No | Sprint 513 |
| Command Brief component | partial | ✅ yes (needs loader) | No | Sprint 512 |
| Weekly COO Report | demo-only | ⚠️ partial | Confirm schema | Sprint 514 |
| Player Attention Risk | partial | ✅ yes | No | Sprint 513 |
| Group Health Review | demo-only | ✅ yes (inline agg) | No | Sprint 515 |
| Coach Support Needed | demo-only | ✅ yes | No | Sprint 515 |
| Parent Trust Coverage | partial | ⚠️ partial only | TBD (applied_at) | Sprint 516 |
| Curriculum Bottleneck | blocked-schema | ❌ no | YES (migrations 041-044) | Deferred |
| Ask Academy Health Qs | partial | ✅ progressive | No | Progressive (512–516) |
| Ask Coach Wrap-Up Qs | partial | ✅ yes | No | Sprint 513 |
| Cross-Module Ranking | partial | ✅ progressive | No | Progressive |
| Coach Wrap-Up Flow | partial | ✅ (session_actuals gap) | YES for session_actuals | Future |
| `/director/donna-coo-demo` | demo-only (design intent) | N/A | No | Preserve as demo |

---

## Recommended Sprint 512 Scope

**Focus:** Command Brief Live Data Wiring — highest ROI single sprint

**Files to modify:**
- `src/app/api/donna/brief/route.ts` — extend with 3 additional queries:
  1. `session_attendance` join → `totalPlayersAttending` (count attending today)
  2. `proposed_actions WHERE source_type='coach_wrap_up_v2'` grouped by session_id → `wrapUpsSubmitted` / `wrapUpsOutstanding`
  3. `coach_notes WHERE observation_type='concern' AND created_at >= 7 days ago` → top `attentionFlags[]`
- Optionally: surface `DonnaCommandBriefIntegration` on `/director/today` with live API data

**No migration needed. Read-only queries only. RLS safe.**
