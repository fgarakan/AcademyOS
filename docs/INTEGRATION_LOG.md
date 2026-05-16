# Integration Log — AcademyOS

Running log of sprint completions, module integrations, and significant architectural decisions.

**Last updated:** 2026-05-16

Each entry records: what changed, what it integrates with, and any decisions made that future agents must know.

---

## 2026-05-16 — Sprint 460: DONNA Advancement Status Enhancement V1

**What changed:** `donnaDirectorIntelligenceActions.ts` — `daysInLevel` computed in pure TypeScript from `enrolled_at` (already fetched in Step 2 — no extra DB query). `advancementStatus` expanded from 3-branch to 4-branch logic: `curriculumState` absent → "unknown"; `advancement_eligible === true` → "Eligible… (N days at this level)"; `advancement_eligible === false` → "Not yet eligible. Blocked by: X, Y, Z. N days at this level." handling both `Array` and `string` types for `advancement_blocked_by`, sliced to 3 items max; else → "eligibility not evaluated." `levelLabel` and `advancementStatus` strings joined into the DONNA brief in Step 3.

**Why this matters:** Directors see a concrete, actionable advancement summary per player: blockers are named, time-in-level is shown. DONNA brief no longer says "advancement eligible: false" — it says "Blocked by: incomplete_assessments, missing_video. 47 days at this level." Second Curriculum Ripple sprint.

**Architectural note:** `advancement_blocked_by` column may be JSON array or plain string depending on how coaches enter blockers. Both cases handled defensively. `Array.isArray()` check is the authoritative branch.

---

## 2026-05-16 — Sprint 459: DONNA Player Curriculum Level Label V1

**What changed:** `donnaDirectorIntelligenceActions.ts` — Step 2b added between Step 2 and Step 3. Queries `curriculum_levels` for `display_name` + `stage` when `current_level_id` is non-null. `levelLabel` at line ~1102 now uses the resolved name: "Level: Orange 2 (yellow_ball)" instead of "Level ID: <uuid>". Fallback: "Level assigned (name unavailable)" if level row not found.

**Why this matters:** DONNA player briefs are now readable to a director without needing to look up the level UUID. This is the first Curriculum Ripple sprint — curriculum data flows meaningfully through the DONNA output layer.

---

## 2026-05-16 — Sprint 458: Coach-Side DONNA Block Audit and Docs V1

**What changed:** `docs/MODULE_MATURITY_MAP.md` — Coach Module section added between Signals and Platform. Documents all 8 Sprint 450-458 components, maturity levels, and block summary. Coach entry added to Summary Table at level 9. Last updated timestamp updated to Sprint 458.

**Block closure:** Coach-Side DONNA (9 sprints, 450-458) is complete. Remaining Coach module gaps: observation trend chart, coach performance comparison, filter on coach list by session count/activity. These are enhancement sprints, not blockers.

**Next block:** Curriculum Ripple Sprints (459-467) — focuses on curriculum data flowing through DONNA intelligence and the director surface.

---

## 2026-05-16 — Sprint 457: Coach Profile Links in Player Profile V1

**What changed:** `CoachObservationsFeed.tsx` — `coach_id: string | null` added to `CoachObservationRow` type; `Link` from next/link imported; coach name now renders as `<Link href="/director/coaches/${obs.coach_id}">` with `hover:text-lime` when `coach_id` is non-null (fallback: plain span). `page.tsx` — `'coach_id'` added to the coach_observations select at line 755.

**Navigation integration:** Director clicking a coach name on a player observation now navigates directly to that coach's profile page (Sprint 453). Closes the navigation loop: Player Profile → Coach Profile → Coach Sessions → back to player context.

---

## 2026-05-16 — Sprint 456: DONNA Coach Brief Workflow V1

**What changed:** `donnaTaskContracts.ts` — `'draft_coach_brief'` added to `DonnaTaskId`; contract added with 1 required field (`coach`), reads list, `saveApplyMethodStatus: 'wired'`. `donnaObjectResolutionTypes.ts` — `draft_coach_brief: { coach: 'coach' }` added to `FIELD_RESOLUTION_MAP`. `DonnaAssistantButton.tsx` — import, WIRED_TASK_IDS entry, READONLY_TASK_IDS entry, handler that passes `resolvedObjects['coach']?.id` to `fetchCoachIntelligenceAction`.

**Integration complete:** Director can now ask DONNA "brief me on [coach name]", DONNA resolves the coach (Sprint 269 coach resolution), director confirms, DONNA calls `fetchCoachIntelligenceAction(coachId)` and displays the 30d intelligence summary. No DB write. Read-only.

---

## 2026-05-16 — Sprint 455: Coaches Sidebar Nav Link V1

**What changed:** `src/components/nav/SidebarNav.tsx` — `UserCog` imported from lucide-react; `Coaches` entry added to `ACADEMY_ITEMS` between Players and Sessions, pointing to `/director/coaches`. The `isActive` function uses `startsWith('/director/coaches')` — correctly highlights when on both list and profile pages.

**Integration closure:** Coach-Side DONNA surface (Sprints 450-455) is now fully navigable: Sidebar → Coach List → Coach Profile → DONNA panel (auto-context via deriveContextRequest). Director can also invoke `fetchCoachIntelligenceAction` from a DONNA workflow.

---

## 2026-05-16 — Sprint 454: Director Coaches List Page V1

**What changed:** `src/app/director/coaches/page.tsx` — new server component. Queries `academy_memberships` filtered to `role in ('coach', 'head_coach')` + `is_active = true`, joins `profiles` for names, fetches 30d session counts per coach from `sessions`. Separates head coaches from regular coaches. Each row links to `/director/coaches/[profileId]`.

**Navigation integration:** `/director/coaches` is now a discoverable entry point into the coach roster. `/director/coaches/[uuid]` remains accessible directly. Sidebar nav not yet updated to include Coaches link — that is a follow-on sprint.

---

## 2026-05-16 — Sprint 453: Director Coach Profile Page V1

**What changed:** `src/app/director/coaches/[coachId]/page.tsx` created — new server component route. Fetches: profiles (coach name), academy_memberships (role + active guard), sessions (30d coached, completion rate), coach_observations (30d count + distinct players), proposed_actions (pending count + preview list). `notFound()` on missing user, academy, or inactive membership. DONNA panel auto-shows `coach_profile` context from Sprint 452 `deriveContextRequest` wiring.

**Navigation note:** Back link → `/director` dashboard (no coach list page exists yet). `/director/coaches/[uuid]` deeplinks work — coaches can be linked to from anywhere. A `/director/coaches` list page would be a natural follow-on sprint.

**Security:** All queries scoped to `academy_id` from caller's session. Coach must be an active member of the same academy. Callers not authenticated go to `notFound()`.

---

## 2026-05-16 — Sprint 452: DONNA Coach Context Type V1

**What changed:** `donnaContextTypes.ts` — `coach_profile` added to `DonnaContextType` union; `coachId?` added to `DonnaContextRequest.params`; `/director/coaches/[uuid]` UUID route pattern added to `deriveContextRequest`. `donnaContextActions.ts` — `fetchDonnaContext` params extended with `coachId?`; `coach_profile` case added to switch; `fetchCoachContext()` handler added at file end (7 queries: profiles, academy_memberships, sessions, coach_observations ×2, proposed_actions).

**Architecture note:** `fetchCoachContext` provides a lightweight DONNA panel intro — not the full 9-step intelligence action. Full intelligence is in `donnaCoachIntelligenceAction.ts` (Sprint 450-451) and would be called from a DONNA workflow draft. Both exist independently and serve different use cases: context intro vs. structured intelligence report.

---

## 2026-05-16 — Sprint 451: DONNA Coach Intelligence Steps 6-9 V1

**What changed:** `src/app/director/_actions/donnaCoachIntelligenceAction.ts` — Steps 6-9 added: (6) `coach_observations` queried by `coach_id` for 30d observation count + distinct player count; (7) `proposed_actions` queried by `proposed_by_id` + `status = 'pending_review'` for pending review count; (8) `groups` queried for group names in coached sessions; (9) data gap analysis flags zero sessions, zero observations with sessions, or completion rate <50%.

**Bug fixed:** TS2802 — `[...new Set(...)]` spread on `Set<string>` fails at lower TypeScript targets. Replaced with `for...of` loop + `Array.from`. Pattern to remember for all future `Set<string>` usage in this project.

**Output structure:** `summaryLines` now has 6 labelled sections: header (Coach/Role/Groups), SESSIONS, COACHING QUALITY (recap), OBSERVATIONS, PENDING REVIEW, DATA GAPS. Ready for DONNA panel display.

---

## 2026-05-16 — Sprint 450: DONNA Coach Intelligence Action Foundation V1

**What changed:** `src/app/director/_actions/donnaCoachIntelligenceAction.ts` — new server action with Steps 1-5. `fetchCoachIntelligenceAction(coachProfileId)` is the entry point. Auth guard allows director and head_coach only. Steps: (1) coach profile from `profiles`, (2) role from `academy_memberships`, (3) sessions coached in last 30d from `sessions where coach_id = coachProfileId`, (4) session completion rate, (5) recap coverage via `computeRecapCompletionRate` + `voice_notes` query.

**Architecture pattern:** Mirrors `fetchPlayerProgressSummaryAction` exactly — same auth helper shape, same `rawDb as any` pattern for untyped tables, same return shape (`DonnaApprovalExecutionResult`), same `summaryLines.join('\n')` output. Adding coach steps 6+ in subsequent sprints follows the same additive pattern.

**Next integration points:** (a) `donnaContextTypes.ts` — add `coach_profile` to `DonnaContextType`; (b) `deriveContextRequest` — wire `/director/coaches/[uuid]` route; (c) DONNA workflow card for coach intelligence summary.

---

## 2026-05-16 — Sprint 449: DONNA Coach Recap Completion Rate Signal V1

**What changed:** `src/app/director/_actions/donnaDirectorIntelligenceActions.ts` — added Step 14 to the per-player DONNA intelligence action. Imports `computeRecapCompletionRate` and `RecapCheckRow` from `@/lib/kpi/coachExecutionKpiEngine`. Step 14 reuses `groupSessions` from Step 6, queries `voice_notes` for those session IDs via `rawDb as any` pattern, builds `RecapCheckRow[]`, calls `computeRecapCompletionRate`, and emits `recapCompletionLines` into `summaryLines` between `coachExecutionLines` and `parentTrustLines`.

**Architecture decision:** KPI 4 (Coach Recap Completion Rate) uses `voice_notes` as a recap proxy because the data model has gap G8: no `recap_type` column on `voice_notes`. Any voice note attached to a session counts as a recap. Status reported as `partial` to signal the gap. This avoids a migration and remains read-only.

**Integration point:** `coachExecutionKpiEngine` (`src/lib/kpi/coachExecutionKpiEngine.ts`) — KPI 4 engine is already built; this sprint wires it into per-player DONNA intelligence for the first time.

---

## 2026-05-16 — Sprint 448: Review Queue Maturity Audit and Docs V1

**What changed:** `docs/MODULE_MATURITY_MAP.md` — review queue module entry upgraded from level 9 to level 10. Added 8-sprint hardening summary block. Complete documentation of what each sprint achieved.

**Architecture closure:** After 8 review queue hardening sprints (440-447), the review queue is now feature-complete for the current phase. All 9 target_module types have full 4-status coverage. The Completed tab is comprehensive (17 sources in `completedCount`). Stale awareness (per-card age, stale alert banner) is complete. Section summary cards show pending + ready counts + stale age. Copy is accurate.

---

## 2026-05-16 — Sprint 447: Review Queue Completed Tab Accuracy V1

**What changed:** `src/app/director/review/page.tsx` — 3 copy fixes: (1) Completed tab empty state: title changed from "Approved and resolved items will appear here." to "Nothing sent back or rejected yet." and description updated to clarify that approved items stay in Needs Approval/Player Updates until applied; (2) Completed summary card: description changed from "Resolved items" to "Sent back or not approved"; (3) Footer note: updated to direct directors to Needs Approval/Player Updates for approved ready-to-apply items.

**Why this matters:** The previous copy was written before Sprints 441-445 built out the Completed tab comprehensively. Directors reading "Approved and resolved items will appear here" while seeing clarification/rejected items would be confused. The correct model: approved items → stay in active tabs until applied; clarification_needed + rejected → appear in Completed tab.

---

## 2026-05-16 — Sprint 446: Review Queue Stale Alert Banner V1

**What changed:** `src/app/director/review/page.tsx` — added `AlertTriangle` to lucide-react imports. Added stale alert banner between section summary cards and all-clear state. Banner only shows when: (a) at least one section has pending items AND (b) at least one of those sections has items ≥7 days old. Banner text lists all stale sections with their oldest age.

**UX design:** Banner is dismissal-free (no close button) — directors must process items to make it disappear. Shows specific section names and ages so directors know where to go without scanning all tabs.

---

## 2026-05-16 — Sprint 445: Review Queue Session Recap and Voice Intake Full Status Coverage V1

**What changed:** `src/app/director/review/page.tsx` — final 2 type gaps closed: `session_recap_structuring` and `voice_intake` now include `clarification_needed` and `rejected` in their status filters. Added `clarificationNeededDrafts`, `rejectedDrafts`, `clarificationNeededVoiceIntakeDrafts`, `rejectedVoiceIntakeDrafts`. Completed tab: 2 named clarification sections + rejected items added to consolidated "Not Approved" section.

**Architecture milestone:** All 9 `proposed_actions` target_module types fetched by the review queue now have complete 4-status coverage (pending_review, approved, clarification_needed, rejected). The Completed tab is now comprehensive — no item that received a director decision can go invisible.

**`completedCount` now includes 17 sources:**
- WrapUp: clarification + rejected
- Observation: clarification + rejected
- Priority: clarification + rejected
- Evidence: clarification + rejected
- Attendance: clarification + rejected
- Curriculum: clarification + rejected
- Summary: rejected
- SessionRecap: clarification + rejected
- VoiceIntake: clarification + rejected

---

## 2026-05-16 — Sprint 444: Review Queue Rejected Items Visibility V1

**What changed:** `src/app/director/review/page.tsx` — added `rejected` to 6 more status filters: `coach_observation_draft_v1`, `priority_recommendation`, `requirement_evidence_link`, `attendance_exception`, `curriculum_override`, `development_summary_draft_v1`. 6 new `rejectedXXX` collections computed. All collapsed into a single "Not Approved" section in Completed tab (total count badge). `completedCount` now sums 13 sources.

**Design decision:** Collapsed all rejected types into one "Not Approved" section (rather than 6 separate sections) for visual cleanliness. A director sees "Not Approved — 3" with cards grouped by type.

**`completedCount` now comprehensive:** wrapup clarification + wrapup rejected + observation clarification + observation rejected + priority clarification + priority rejected + evidence clarification + evidence rejected + attendance clarification + attendance rejected + curriculum clarification + curriculum rejected + summary rejected = 13 sources.

---

## 2026-05-16 — Sprint 443: Review Queue Multi-Type Clarification Visibility V1

**What changed:** `src/app/director/review/page.tsx` — 4 query status filters broadened from `['pending_review', 'approved']` to `['pending_review', 'approved', 'clarification_needed']` for: `priority_recommendation`, `attendance_exception`, `requirement_evidence_link`, `curriculum_override`. Added 4 computed clarification collections + 4 Completed tab sections using existing card components.

**Gap confirmed:** All 4 decision controls (`PriorityDraftDecisionControls`, `AttendanceExceptionDraftDecisionControls`, `EvidenceRequirementDraftDecisionControls`, `CurriculumOverrideDraftDecisionControls`) have "Send back for clarification" buttons that call `handleDecision('clarification_needed')`. Items sent back were permanently invisible.

**Pattern consistent with:** Sprint 441 observation fix + `clarificationNeededWrapUpDrafts` (original pattern from wrap-up drafts).

**`completedCount` now includes:** 7 sources — wrapup clarification, wrapup rejected, observation clarification, priority clarification, evidence clarification, attendance clarification, curriculum clarification.

---

## 2026-05-16 — Sprint 442: Review Queue Ready-to-Apply Summary Counts V1

**What changed:** `src/app/director/review/page.tsx` — added lime "X ready to apply" lines to section summary cards for Needs Approval, Player Updates, Curriculum/Sessions. Uses existing `needsApprovalReady`, `playerUpdatesReady`, `curriculumSessionReady` variables — no new computations needed.

**Pattern:** Secondary metric in summary card — shown only when > 0, in `text-lime` to distinguish from pending (orange/blue/lime primary) and age indicators (text-muted/text-status-orange).

---

## 2026-05-16 — Sprint 441: Review Queue Observation Clarification Display V1

**What changed:** `src/app/director/review/page.tsx` — computed `clarificationNeededObservationDrafts` from existing `enrichedObservationDrafts`; added to `completedCount`; rendered in Completed tab under "Player Observations — Sent Back for Clarification" section using `WrapUpObservationDraftCard`.

**Gap fixed:** `coach_observation_draft_v1` queries fetched `clarification_needed` items (line 642) but nothing computed or rendered them. Directors who sent an observation back for clarification would see it vanish from the queue with no trace. Now appears in Completed tab.

**Pattern consistent with:** `clarificationNeededWrapUpDrafts` (existing pattern for wrapup drafts).

---

## 2026-05-16 — Sprint 440: Review Queue Stale Age Indicators V1

**What changed:** `src/app/director/review/page.tsx` — added `oldestDaysAgo` helper that computes days since oldest `createdAt` in a collection. Per-section oldest age computed for Needs Approval, Player Updates, and Curriculum/Sessions sections. Section summary cards now show "oldest: Xd" when items are pending; turns orange when ≥7 days old.

**Integration pattern:**
- Pure computation from `createdAt` data already fetched in each section's query
- No new DB queries added
- Helper function defined as a local function inside the async page component
- Orange stale threshold: 7 days (matches typical director review cadence)

**Design decisions:**
- Age hidden when pending count is 0 (no items, no age to show)
- Age shown in `text-text-muted` for <7 days (informational), `text-status-orange` for ≥7 days (stale warning)
- `tabular-nums` class for consistent number width

---

## 2026-05-16 — Sprint 439: Review Queue Action Model Audit V1

**What changed:** Docs only. Audit of review queue `target_module` types. 15 confirmed, all with display cards and decision controls. Apply/execute flows verified for 13 of 15. 2 gaps noted.

**Architecture verified:**
- All decisions go through `proposed_actions.status` update (approved/rejected/clarification_needed)
- Execution is always separate from decision ("Apply" button triggers execute, not automatic on approve)
- No automatic execution without director approval — invariant held

**Gaps noted:**
- `parent_communication` approved → no send (Block 3+ send infrastructure required)
- `level_review` → limited execution path; creates proposal only, no direct level assignment

---

## 2026-05-16 — Sprint 438: KPI Block Audit and Next Roadmap V1

**What changed:** Docs only. `DONNA_KPI_INTELLIGENCE_MAP.md` updated: Block 2 sprint table marked COMPLETE with per-sprint wiring status. 5 open schema gaps documented (G1, G2, G3, G4, G8). Next roadmap defined for Sprints 439+.

**Block 2 architecture summary:**
- 12 KPI engines across 9 engine files in `src/lib/kpi/`
- `donnaDirectorIntelligenceActions.ts` wires 8 engines into player progress summary (Steps 6–13)
- `groupKpiSummaryAction.ts` wires group health engine into a callable server action
- 3 director-facing screens: `/director/kpi`, `/director` KPI cards section, player profile KPI drilldown
- All engines pure TypeScript (no DB imports, no async) — DB queries live in server actions and server components

**Open gaps for Block 3+ migration approval:**
- G1: `players.deactivated_at` — KPI 8 (formal dropout rate) blocked
- G2: `private_lesson_requests.triggered_by_session_id` — KPI 11 blocked
- G3: `curriculum_levels.expected_duration_days` — KPI 24 blocked
- G4: `session_blocks.actual_status` persisted — KPIs 18, 20 blocked
- G8: `voice_notes.recap_type` — KPI 4 partial proxy only

---

## 2026-05-16 — Sprint 437: KPI Regression and Demo Data Pass V1

**What changed:** Regression audit only. No code changes. TypeScript compilation verified clean for the full project. Import graph for all 12 KPI engine files and 3 wired screens checked for circular dependencies and resolution errors.

**Key findings:**
- All 12 KPI engine files only import from `./kpiTypes` — no cross-engine imports, no circular dependencies.
- All 3 wired KPI screens resolve imports correctly.
- `donnaDirectorIntelligenceActions.ts` imports all 8 KPI engines cleanly.
- `groupKpiSummaryAction.ts` imports `groupHealthKpiEngine` cleanly.
- `privateLessonKpiEngine` and `donnaKpiSummaryEngine` are unused — expected (engine-only stubs not yet wired).

---

## 2026-05-16 — Sprint 436: KPI Safety and Data Sufficiency Pass V1

**What changed:** Audit-only sprint. No code changes. All KPI engines (Sprints 421–435) and all wired KPI code verified for safety, null-handling, academy_id scoping, and DONNA output honesty.

**Audit scope:** 10 KPI engine files, `donnaDirectorIntelligenceActions.ts`, `groupKpiSummaryAction.ts`, `kpi/page.tsx`, `PlayerKpiDrilldownCard.tsx`, `AcademyKpiCardsSection.tsx`.

**Key findings:**
- All clear: no DB imports in engines, no DANA, no service role, all queries scoped correctly.
- `donnaKpiSummaryEngine` (Sprint 431) is built but not wired — flagged for future sprint.
- `recapCompletionRatePct` and `sessionFrequencyRatio` remain null in group action — documented as expected schema gaps, not safety issues.
- `computeDropoutRisk` threshold alignment verified: dev health riskScore ≥50 → high risk, ≥25 → watch zone. Thresholds match intended semantics.

---

## 2026-05-16 — Sprint 435: Group KPI Drilldown V1

**What changed:** Added `groupKpiSummaryAction.ts`. Server action that wires the group health KPI engine (Sprint 428) with real DB queries. Computes KPI 7 (retention from group_memberships) and KPI 16 (health composite from attendance + observation coverage + signal pct). Not yet wired into any UI route.

**Integrates with:**
- `groups` table — group name fetch (academy_id scoped)
- `group_memberships` — KPI 7 retention computation (joined_at, left_at, is_current)
- `sessions` — group session IDs for 30-day window (group_id, academy_id scoped)
- `session_attendance` — attendance rate computation from group sessions
- `coach_observations` — 14-day observation coverage per current group player
- `player_development_signals` — at-risk player count (high severity, is_active)
- `groupHealthKpiEngine` — KPI 16 and KPI 7 pure functions

**Decisions recorded:**
- **3 of 5 inputs computed**: attendance rate, observation coverage, and no-high-severity pct are computable. recapCompletionRatePct null (gap G8) and sessionFrequencyRatio null (no scheduled session count). KPI 16 requires ≥2 inputs — this action satisfies that.
- **totalExpected = groupSessionIds.length × currentPlayerIds.length**: proxy for "expected" attendance. Only valid when all current players are in all group sessions. Acceptable for demo tier.
- **Action-only sprint**: no groups screen exists (per LOCKED_MODULES.md). Ready for UI wiring in a future sprint.

---

## 2026-05-16 — Sprint 434: Player KPI Drilldown V1

**What changed:** Added `PlayerKpiDrilldownCard` server component to player profile Overview tab. Fetches curriculum state and 30-day attendance internally. Computes KPI 13 (time in level) and KPI 3 (recent absences). Links to `/director/kpi` all-player dashboard.

**Integrates with:**
- `player_curriculum_states` — `enrolled_at`, `advancement_eligible` fetched per player
- `session_attendance` + `sessions!inner` — 30-day window, academy_id and player_id scoped
- `attendanceKpiEngine.computeRecentAbsences` — KPI 3
- `developmentVelocityKpiEngine.computeTimeInLevel` — KPI 13
- Player profile Overview slot — card inserted after `PlayerCommandCenterCard`

**Decisions recorded:**
- **Self-contained**: `enrolled_at` is not fetched by the existing player profile page. Rather than adding it to the already-complex page query chain, the card fetches its own data. Two small targeted queries.
- **`rawDb as any` pattern**: consistent with existing player profile page approach for tables that may not be in generated types.
- **No circular dependency**: component imports only from `src/lib/kpi/` and `@/lib/supabase/server` — no imports from the player profile page or its sibling files.

---

## 2026-05-16 — Sprint 433: Today's Academy KPI Cards V1

**What changed:** Added `AcademyKpiCardsSection` component. Director dashboard now shows a KPI signals section with 3 metric cards (active players, advancement-ready count, attention signals) above the "Today's Priorities" section. Advancement-ready count computed from a new `player_curriculum_states` query.

**Integrates with:**
- `src/app/director/page.tsx` — KPI cards section inserted, new advancement-ready query added
- `player_curriculum_states` — new read-only query: count players where `advancement_eligible = true`
- `/director/kpi` — section header links to full KPI dashboard (Sprint 432)

**Decisions recorded:**
- **Advancement-ready query separate from existing curricStateRows**: the existing query only selects `player_id` (to count players with levels). A new query with `.eq('advancement_eligible', true)` is cleaner than changing the existing query.
- **attentionCount reused**: the existing `attentionCount` (players on hold or reassessment due) is the right proxy for "attention signals" at the dashboard level. Consistent with the existing metric.
- **Positioned above "Today's Priorities"**: directors see strategic KPI signals before operational detail.

---

## 2026-05-16 — Sprint 432: Director KPI Dashboard V1

**What changed:** Added `/director/kpi` page (server component). Fetches active players, curriculum states, and 30-day attendance (all academy_id scoped). Computes KPI 3 (absences) and KPI 13 (time in level) per player. Added KPI nav item to sidebar.

**Integrates with:**
- `players` — active player list (is_active, full_name, academy_id)
- `player_curriculum_states` — advancement_eligible, enrolled_at per player
- `session_attendance` + `sessions!inner` — 30-day attendance scoped via join (consistent with DONNA server action pattern)
- `SidebarNav` — KPI nav item added to ACADEMY_ITEMS section
- `attendanceKpiEngine.computeRecentAbsences` — KPI 3 per player
- `developmentVelocityKpiEngine.computeTimeInLevel` — KPI 13 per player

**Decisions recorded:**
- **Two-query approach**: `players` + `player_curriculum_states` fetched separately, joined client-side by player_id. Avoids complex Supabase nested select for fields on different tables.
- **No streak on dashboard**: `computeMissedSessionStreak` requires the player's group session roster for accurate computation. Dashboard uses absences (KPI 3) instead — computable from attendance rows alone.
- **`__none__` sentinel**: `player_curriculum_states` query uses `.in('player_id', playerIds.length > 0 ? playerIds : ['__none__'])` to avoid empty array errors when no players.
- **Data quality inline labels**: "live" and "demo" shown next to column headers so directors see KPI tier at a glance.

---

## 2026-05-16 — Sprint 431: DONNA KPI Summary Engine V1

**What changed:** Added `donnaKpiSummaryEngine.ts`. `PlayerKpiSummary` interface aggregates all per-player KPI result arrays plus `liveCount`, `partialCount`, `demoCount`, `insufficientCount`. `buildPlayerKpiSummary()` accepts pre-computed KPI result objects and returns the structured summary. `formatKpiSummaryForDonna()` produces a quality header line for DONNA output.

**Integrates with:**
- All KPI engines in `src/lib/kpi/` — consumes `KpiResult[]` objects already computed
- Future Sprint 432 Director KPI Dashboard — `PlayerKpiSummary` will be the payload
- Future server action wiring — `buildPlayerKpiSummary()` assembles from existing result variables

**Decisions recorded:**
- **Orchestration-only**: no DB calls. All inputs are already-computed `KpiResult` objects from prior steps in the server action.
- **Quality header line**: `formatKpiSummaryForDonna()` outputs a terse "KPI coverage: N signals — X live, Y partial, Z demo, W data gaps" line. Director sees data quality upfront before any detail.
- **Not yet wired**: sprint 432 will wire `buildPlayerKpiSummary()` into `fetchPlayerProgressSummaryAction` and the dashboard.

---

## 2026-05-16 — Sprint 430: Makeup and Private Lesson Conversion KPI V1

**What changed:** Added `privateLessonKpiEngine.ts`. KPI 11 (Private Lesson Conversion) and makeup session signal both implemented as `insufficient_data` stubs. Not wired into any server action — nothing computable to surface.

**Integrates with:**
- `private_lesson_requests` (future) — KPI 11 needs `triggered_by_session_id` FK to session_attendance (gap G2)
- `session_attendance` (future) — makeup signal needs `session_type` or `makeup_flag` column

**Decisions recorded:**
- **KPI 11 gap G2**: `private_lesson_requests.triggered_by_session_id` does not exist. Stop and confirm with Farshad before adding this migration.
- **Makeup session schema gap**: `session_attendance` has no way to distinguish a makeup from a regular session in another group. A `session_type` or `makeup_flag` column is needed.
- **No wiring into player summary**: Both stubs return `insufficient_data`. `formatPrivateLessonForDonna()` always returns `[]` — wiring would be silent no-op. Reserved for future sprint when gaps are resolved.

---

## 2026-05-16 — Sprint 429: Retention and Dropout KPI Engine V1

**What changed:** Added `retentionKpiEngine.ts`. KPI 8 stub (insufficient_data — no `deactivated_at`). Per-player dropout risk signal (partial) computed from development health score and missed-session streak. Step 1 select updated to include `is_active`. Step 13 added: dropout risk computed and appended to DONNA player progress summary.

**Integrates with:**
- `players.is_active` — Step 1 select extended to include `is_active` for dropout risk gate
- `developmentHealthKpiEngine` — dropout risk consumes `riskScore` from development health result
- `attendanceKpiEngine` — dropout risk consumes `missedStreak` (KPI 2 value) from attendance KPI results
- DONNA player progress summary — retention lines appended after parent trust lines

**Decisions recorded:**
- **KPI 8 blocked by gap G1**: `players.deactivated_at` does not exist. Stub will remain `insufficient_data` until migration explicitly approved by Farshad.
- **Composite proxy approach**: Dropout risk is NOT a formal KPI. It is a derived risk signal using existing signals rather than dropout history. DONNA surface text reflects this.
- **No extra DB query**: `daysSinceLastObservation` derived from `lastObservationAt` already available in the action. No additional round-trip.
- **Empty output when no data**: `formatRetentionForDonna` returns `[]` for null value or `insufficient_data` status — summaryLines spread remains clean.

---

## 2026-05-16 — Sprint 428: Group Health and Fit KPI Engine V1

**What changed:** Added `groupHealthKpiEngine.ts`. Group-level KPIs 16 and 7 implemented as pure functions. Not wired into any server action — awaiting group summary action (Sprint 435+).

**Integrates with:**
- `group_memberships` (future) — retention uses `joined_at` and `left_at`
- `sessions`, `session_attendance`, `coach_observations`, `player_development_signals` (future inputs to group health composite)

**Decisions recorded:**
- **KPI 16 insufficient_data threshold < 2**: Group health composite requires at least 2 signal types. Shows clearly what is missing rather than a meaningless score.
- **KPI 7 retention proxy**: `left_at = null` as "still active" may overcount if players transferred groups and their `left_at` wasn't set. Documented in caveat.

---

## 2026-05-16 — Sprint 427: Parent Trust KPI Engine V1

**What changed:** Added `parentTrustKpiEngine.ts`. Step 7's parent update query expanded from single-row to 60-day window with `status` and `sent_at` fields. Step 12 added: KPI 21 (Parent Trust Coverage) computed from fetched drafts and appended to DONNA summary.

**Integrates with:**
- `parent_updates` — Step 7 extended to 60-day window with `status` field; `sent_at` fetched to enable future KPI 5 proxy
- DONNA player progress summary — parent trust line appended after coach execution lines

**Decisions recorded:**
- **DONNA says "draft created — not sent"**: `formatParentTrustForDonna` output always includes the delivery disclaimer. No implied delivery.
- **KPI 21 window = 60 days**: Longer than attendance window because parent updates are less frequent. 60 days captures reasonable update cycles.

---

## 2026-05-16 — Sprint 426: Coach Execution KPI Engine V1

**What changed:** Added `coachExecutionKpiEngine.ts`. Step 4 select updated to include `tags, ai_parsed`. Step 11 added to `fetchPlayerProgressSummaryAction`: maps Step 4 observations to KPI engine input, calls `computeObservationQuality()` (KPI 19), appends coach execution lines to DONNA summary.

**Integrates with:**
- `coach_observations` — Step 4 extended to include `tags` and `ai_parsed` fields
- DONNA player progress summary — coaching quality lines appended after session yield

**Decisions recorded:**
- **No extra DB query for KPI 19**: observations already fetched in Step 4. The new fields (`tags`, `ai_parsed`) were added to the existing select.
- **KPI 4 not wired into player summary**: `computeRecapCompletionRate()` is a session-level KPI requiring coach/session data, not player-specific. Ready for future group summary action.

---

## 2026-05-16 — Sprint 425: Curriculum Coverage KPI Engine V1

**What changed:** Added `curriculumCoverageKpiEngine.ts`. KPIs 17, 18, 20 implemented as `insufficient_data` stubs (honest engine stubs ready for future wiring). KPI 25 (Session Development Yield) implemented as `demo` and wired into `fetchPlayerProgressSummaryAction` as Step 10.

**Integrates with:**
- `coach_observations` — Step 10 fetches observation session_ids for this player in last 30 days
- Step 6 attendance data (`playerAttendance`) — attended session_ids derived for yield denominator
- DONNA player progress summary — session yield line appended after evidence lines

**Decisions recorded:**
- **KPI 17/18/20 not wired into player summary**: These are group/session-level KPIs. Stubs exist in the engine for future group summary action.
- **KPI 25 window = 30 days**: Consistent with attendance KPI window for comparability.

---

## 2026-05-16 — Sprint 424: Evidence Coverage and Readiness Confidence KPI V1

**What changed:** Added `evidenceCoverageKpiEngine.ts`. Step 9 added to `fetchPlayerProgressSummaryAction`: fetches `curriculum_gates` for the player's current level and `player_gate_status` for the player; computes KPI 14 (Evidence Coverage) and KPI 22 (Readiness Confidence).

**Integrates with:**
- `curriculum_gates` — read-only, queried by `from_level_id = current_level_id`
- `player_gate_status` — read-only, academy_id scoped
- DONNA player progress summary — evidence lines appended after velocity lines

**Decisions recorded:**
- **Empty gates → `insufficient_data`**: If no active gates are defined for the player's level, the engine returns `insufficient_data` with a migration explanation rather than showing a false 0% score.
- **Waived gates count as evidenced**: `waived_at` gates indicate the director explicitly waived the requirement — counted as covered.
- **KPI 22 `partial`**: `last_evaluated_at` is a proxy for when eligibility was assessed, not when it was set. No `eligible_since_at` column exists in the schema.

---

## 2026-05-16 — Sprint 423: Development Velocity and Time in Level KPI V1

**What changed:** Added `developmentVelocityKpiEngine.ts`. Step 8 added to `fetchPlayerProgressSummaryAction`: fetches `player_curriculum_history` and computes KPI 13 (Time in Level, live) and KPI 12 (Development Velocity, demo). A stalled-player flag (KPI 23 proxy) is emitted when `days > 120 AND advancement_eligible = false`.

**Integrates with:**
- `player_curriculum_history` — read-only, academy_id scoped, ordered by `advanced_at`
- `player_curriculum_states` — `last_evaluated_at` added to Step 2 select
- `src/lib/kpi/kpiTypes.ts` — KpiResult/KpiStatus
- DONNA player progress summary — velocity lines appended after health lines

**Decisions recorded:**
- **KPI 13 (`live`)**: `enrolled_at` has a NOT NULL default — this is genuinely live, no caveat needed. Computed as `Date.now() - enrolled_at`.
- **KPI 12 (`demo`)**: requires ≥2 advancements. Zero or one history records return an honest English explanation — never show null silently.
- **Stalled flag**: 120-day threshold chosen as a reasonable "long" stay without eligibility. Does not trigger any action — director sees the flag and decides.

---

## 2026-05-16 — Sprint 422: Player Development Health KPI V1

**What changed:** Added `developmentHealthKpiEngine.ts` — pure TypeScript composite KPI 15 engine. Step 7 added to `fetchPlayerProgressSummaryAction`: fetches active high-severity development signals and most recent parent update draft, then computes Development Health label (Healthy / Watch / At Risk / Insufficient Data) and appends to DONNA player progress summary.

**Integrates with:**
- `src/lib/kpi/attendanceKpiEngine.ts` — attendance KPI results (values) are passed as inputs to the health engine
- `src/lib/kpi/kpiTypes.ts` — `KpiResult` and `KpiStatus` types used
- `src/app/director/_actions/donnaDirectorIntelligenceActions.ts` — Step 7 added after Step 6 (attendance KPIs)
- `player_development_signals` table — read-only, academy_id scoped, severity = 'high' + is_active = true filter
- `parent_updates` table — read-only, academy_id scoped, most recent draft created_at
- `player_curriculum_states` — enrolled_at now included in Step 2 select for time-in-level calculation

**Decisions recorded:**
- **Composite status `partial`**: inherits proxy from attendance streak (group roster inference) and parent update (draft creation proxy). Cannot be `live` or pure `demo` — explicit caveat shown in DONNA output.
- **Insufficient Data threshold**: fewer than 2 non-null inputs returns `insufficient_data` status, not a manufactured score.
- **Risk score thresholds**: 0–24 Healthy, 25–49 Watch, 50+ At Risk. Chosen to be conservative — a single missed streak of 2 alone puts player in Watch.
- **No new server action**: wired into existing `fetchPlayerProgressSummaryAction` as Step 7, consistent with attendance KPI pattern from Sprint 421.

---

## 2026-05-16 — Sprint 399: Persistent DONNA Panel State V1

**What changed:** Converted DONNA from a modal-like panel (clicking outside closes it) to a persistent executive side panel (only intentional close actions close it). Seven targeted edits to `DonnaAssistantButton.tsx`.

**Integrates with:**
- `DonnaAssistantButton.tsx` — core change: backdrop is now `pointer-events-none` (visual only, not a close target); all `closePanel()` calls on navigation/chip/link events removed
- `DirectorLayout` — no change; DONNA persistence on SPA navigation already works because `DonnaAssistantButton` lives in the layout and never unmounts on intra-director navigation
- All director routes (`/director/**`) — DONNA now stays open across page transitions

**Decisions recorded:**
- **Backdrop**: changed from `bg-black/40 backdrop-blur-sm onClick={closePanel}` to `bg-black/20 pointer-events-none`. This removes the modal behavior — page content is fully interactive while DONNA is open.
- **Navigation chips**: removed `closePanel()` from `Player Progress` and `Parent Updates` quick-nav chip handlers.
- **NAV_COMMANDS text navigation**: removed `closePanel()` from loop body and go-back handler — voice/text navigation no longer closes DONNA.
- **Recommendation card navigate**: removed `closePanel()` from `case 'navigate'`.
- **Quick links**: removed `onClick={closePanel}` from `<Link>` elements.
- **Suggestion card**: `onNavigate` prop no longer calls `closePanel()`.
- **Active glow**: floating button uses brighter gradient (`#7c3aed/#4f46e5`) + `boxShadow` when `panelOpen` is true. Restores to default when closed.
- **Close actions**: only the X button (`aria-label="Close assistant"`) and pre-existing Escape key handler close DONNA. These are intentional close actions.
- **SPA persistence**: `panelOpen` is `useState` in `DonnaAssistantButton`. Because the component lives in `DirectorLayout` (a shared layout), it does NOT remount on intra-director client-side navigation. State naturally persists.

---

## 2026-05-16 — Sprint 398: Demo Data Seed and DONNA Stub Visibility V1

**What changed:** Added a safe local static demo data layer (`src/lib/demo/demoData.ts`) for the three director screens that were showing empty states during demos. Added DONNA stub honesty: unwired task shortcuts now show a "Coming soon" badge and respond with an honest "coming soon" message instead of silently failing.

**Integrates with:**
- `/director/today` — uses `DEMO_SESSIONS` + `DEMO_PENDING_COUNT` when `?demo=1`
- `/director/level-up` — uses `DEMO_PIPELINE_ROWS` when `?demo=1`
- `/director/parents` — uses `DEMO_PARENT_UPDATES` when `?demo=1`
- `DonnaAssistantButton.tsx` — `WIRED_TASK_IDS` set gates badge rendering; `handleStartGenericTask` returns honest "coming soon" message for unwired task IDs
- No Supabase reads or writes in demo mode — all data is static TypeScript constants

**Decisions recorded:**
- Demo mode is gated exclusively on `searchParams.demo === '1'`. Normal mode DB queries are unchanged and run in the `else` branch only.
- Demo data is pure TypeScript constants computed at module load time. No server actions, no DB reads, no faker libraries.
- `DemoSession` interface in `demoData.ts` is structurally identical to `SessionWithMeta` in `today/page.tsx` — TypeScript structural typing allows direct use without a separate cast on most fields.
- "Coming soon" badge (9px, pill, text-muted) renders only for task shortcuts where `!WIRED_TASK_IDS.has(taskId)`. Four task IDs are unwired: `create_group`, `assign_player_to_group`, `summarize_player_progress`, `recommend_template_for_group`.
- The DONNA panel "Send" button found during QA was the voice draft submit button inside the DONNA overlay (disabled) — NOT a parent-comms auto-send. This is a pre-existing, already-safe element.

---

## 2026-05-15 — Sprint 396: Final Prototype Visual Match + Regression V1

**What changed:** Docs only. Full regression QA pass — no source code modified.

**Verified clean:**
- 7 routes (386–395): all load, no redirects, no crashes
- DONNA panel (Sprint 392): w-96, 4 tab chips, approval copy, Review Queue intact
- Context registry (Sprint 393): all 6 entries present, `/director` is last (prefix-match safe)
- Design tokens (Sprint 394): label-xs applied, no hardcoded hex
- Protected actions: no direct DB writes in any new screen
- Demo mode (Sprint 395): functional, no regression
- Mobile viewport (390px): coach recap loads clean, no overflow
- Naming: 0 DANA occurrences across all sprint files

**Sprint 387–396 relay complete.**

---

## 2026-05-15 — Sprint 395: Guided Director Demo Flow V1

**What changed:** New `DemoModeBanner` client component injected into the director layout via `<Suspense>`. When `?demo=1` is present in the URL, a sticky banner appears below `PreviewBanner` showing the current demo step, label, hint, and Next → navigation.

**Integrates with:**
- `src/app/director/layout.tsx` — banner injected globally for all `/director/**` routes
- `next/navigation` — `useSearchParams()`, `useRouter()`, `usePathname()` hooks
- No Supabase calls, no server actions, no proposed_actions — fully client-side

**Decisions recorded:**
- `<Suspense>` wrapper is required in Next.js 14 App Router for any client component using `useSearchParams()`. Missing it causes a build error.
- Step detection uses `pathname.startsWith(s.path + '/')` to match session detail routes (`/director/sessions/[id]?demo=1` → Step 2). The `/director` fallback uses exact match only to avoid capturing all director routes.
- Template literal `` `Demo · Step ${n} of ${total}` `` used instead of JSX expressions to ensure single text node in innerHTML (avoids React adjacent-expression splitting that broke QA string matching in initial run).

---

## 2026-05-15 — Sprint 394: Premium UI Consistency Pass V1

**What changed:** 2-line fix across `/director/level-up` and `/director/parents` — `StatCard` label now uses `label-xs` utility instead of the expanded inline form.

**Integrates with:** `globals.css` `label-xs` utility (`text-[11px] uppercase tracking-widest text-text-muted font-medium`)

**Decisions recorded:**
- Full audit found no other inconsistencies across the 4 new screens (today, level-up, parents, recap). The screens are already design-token compliant, using `page-title`, `Card`, `bg-surface`, and `text-text-*` correctly.
- `text-[9px]` micro-labels are intentionally smaller than `label-xs` and were not replaced — they appear in space-constrained components (score labels, workflow step labels).

---

## 2026-05-15 — Sprint 393: Cross-Screen DONNA Context Wiring Pass V1

**What changed:** `donnaPageContextRegistry.ts` tightened across 3 screen entries. `/director/today` now correctly lists `daily_brief` and `attention_report` as readable context items. `/coach/recap` and `/director` dashboard have updated suggested prompts and safe draft actions.

**Integrates with:**
- `DonnaAssistantButton.tsx` — reads registry to populate context card, suggested prompts, and safe action shortcuts
- All `/director/**` routes — registry changes take effect immediately on next panel open

**Decisions recorded:**
- Sprint 393 was a light pass — the registry was already in good shape from per-screen additions in Sprints 386–390. Only 4 improvements were made; no entries were restructured.
- The `FALLBACK_CONTEXT` (`routePattern: '*'`) is defined after the array close and does NOT affect the `/director` prefix-match ordering. QA script confirmed `/director` is the last entry in `PAGE_CONTEXT_REGISTRY` at line 612.

---

## 2026-05-15 — Sprint 392: DONNA Executive Panel Upgrade V1

**What changed:** `DonnaAssistantButton.tsx` panel upgraded with 4 visual/structural changes: desktop overlay (backdrop-blur), expanded panel width (w-96), tab chip navigation strip, and approval boundary footer copy. No behavior or routing changes.

**Integrates with:**
- All `/director/**` routes — the panel is global
- Tab chip "Review Today" → `handleOpenReviewQueue()` (existing handler)
- Tab chip "Prepare Coaches" → `dispatchCooCommand('coach_brief')` (existing COO command)
- Tab chips "Player Progress" / "Parent Updates" → `router.push` to existing screens

**Decisions recorded:**
- Overlay changed from `md:hidden` (mobile-only) to all-screen — this gives the executive "command center" feel when the panel slides open on desktop. No z-index conflicts — overlay is z-40, panel is z-50.
- Footer list replaced with approval boundary copy. The verbose capability list was removed; future users can discover capabilities through the panel itself.
- Tab chip `whiteSpace: nowrap` prevents wrapping on narrow panels; `overflow-x-auto` on the chip container allows horizontal scroll if needed.

---

## 2026-05-15 — Sprint 391: Coach Recap Structuring and Review Draft V1

**What changed:** `/coach/recap` review screen enhanced with structured draft sections. Answers now display as 5 pipeline-preview cards, each showing what the content would become in the director review queue. Raw answers available via disclosure toggle.

**Integrates with:**
- `/coach/recap` — replaces flat Q&A review with structured section cards
- Pipeline preview labels match existing action types: Attendance Exception Draft, Session Actual Draft, Player Observation Draft, Director Review Item, Parent-Safe Draft Placeholder

**Decisions recorded:**
- No backend write added in Sprint 391. `saveWrapUpDraftAction` requires a `sessionId` FK that the standalone `/coach/recap` page doesn't have. Full pipeline write will be Sprint session workspace integration in a later sprint.
- `buildDraftSections()` is a pure client-side function — no server calls, no side effects. Safe to use anywhere.

---

## 2026-05-15 — Sprint 390: Coach Recap Flow Shell V1

**What changed:** New route `/coach/recap` — a client-side 6-question session recap shell for coaches. Progress indicator, one-question-at-a-time flow, review screen, submitted confirmation. No backend writes.

**Integrates with:**
- Coach layout (`src/app/coach/layout.tsx`) — uses BottomTabBar + max-w-2xl container automatically
- `donnaPageContextRegistry` — `/coach/recap` entry added for future coach DONNA panel
- Sprint 391 will connect the submit action to the draft pipeline

**Decisions recorded:**
- Sprint 390 is shell-only: submit button does not write to the DB. This is by design — Sprint 391 will add the `saveWrapUpDraftAction` connection.
- `/coach/recap` is accessible to director test account (no role gate added in Sprint 390). A future sprint may add coach-only middleware guard.
- Voice input placeholder is honest: shown as "Available via DONNA on director view" — no fake voice input wired on coach route yet.

---

## 2026-05-15 — Sprint 389: Parent Communication Center V1

**What changed:** New route `/director/parents` — the parent communication operating surface. Queries `parent_updates` table, groups by status, shows 4-step workflow, parent-safe content preview on every card, DONNA chips for drafting. No send capability — delivery pipeline not built.

**Integrates with:**
- `parent_updates` table — filtered by academy_id, joined to `players(full_name)`, excludes cancelled
- `donnaPageContextRegistry` — `/director/parents` entry with `auto_send_parent_message` in unsafeActions
- `/director/review` — "Review in queue" CTA links to existing review queue for pending drafts

**Decisions recorded:**
- `parent_updates` join uses `players(full_name)` via Supabase foreign key join syntax. This relies on the FK relationship being defined in the schema. If it fails in production, fall back to a separate `players` query (same pattern as Sprint 386).
- Pre-existing `button[text="Send"]` found in DONNA panel on all director pages — this is the voice input submit. It is NOT an auto-send for parent messages. QA check explicitly scoped to page content only.
- "External delivery is not yet active" note shown to set honest expectations for the demo.

---

## 2026-05-15 — Sprint 388: Level Up Readiness Review V1

**What changed:** New route `/director/level-up` — the director's evidence-based player level readiness review screen. Queries `v_reassessment_pipeline` view, groups players by urgency (overdue/due_soon/upcoming), shows score and assessment data, and surfaces DONNA prompt chips. DONNA context registered.

**Integrates with:**
- `v_reassessment_pipeline` view — filtered by academy_id, ordered by days_overdue desc
- `profiles` table — academy_id lookup for the authenticated director
- `donnaPageContextRegistry` — `/director/level-up` entry with level movement approval gates
- Director layout — DONNA panel renders automatically via existing layout

**Decisions recorded:**
- Level movement CTA is intentionally absent from this page. The page shows a visible "Level movement is director-approved only" badge and links to player profiles for evidence review. Level changes go through DONNA → proposed_actions → director approval → `finalize_player_placement()` — this page does not accelerate that path.
- `v_reassessment_pipeline` does not include `level_label` (it has `current_track`). Track label is displayed instead. This is sufficient for V1 — a future sprint can join with curriculum level data.

---

## 2026-05-15 — Sprint 387: Sessions Detail DONNA Context V1

**What changed:** Added `donnaPageContextRegistry` entry for `/director/sessions/[sessionId]` and four "Ask DONNA" prompt chips on the session detail page. The session detail is now DONNA-capable — the panel will match this route and surface the correct intro and suggested prompts.

**Integrates with:**
- `donnaPageContextRegistry` — new entry inserted between Sessions list entry and Player Profile entry; correctly ordered before `/director` prefix-match fallback
- `src/app/director/sessions/[sessionId]/page.tsx` — chips section added after session header, before Curriculum Focus section; display-only spans, no server actions involved

**Decisions recorded:**
- Chips are display-only `<span>` elements (`cursor-default select-none`). Wiring them to open the DONNA panel with pre-filled text requires the DONNA panel's internal state — deferred to a future polish sprint (same decision pattern as Sprint 386 Today's Academy chips).
- The existing "Coach Briefing" section (deterministic synthesis, no AI) was NOT replaced or modified — it remains as the server-rendered static brief. The DONNA chips are a separate, additive section for AI-assisted drafting via the panel.
- `draft_coach_communication` is already wired in the DONNA layer (Sprint context). The registry entry makes it discoverable from this route.

---

## 2026-05-15 — Sprint 386: Today's Academy V1

**What changed:** New route `/director/today` — the director's morning anchor screen. Shows today's sessions, stat strip, risk flags, DONNA Intelligence section, and quick actions. DONNA context entry added for this route.

**Integrates with:**
- `sessions` table — filtered by `scheduled_date = today` (server-side date string)
- `session_blocks` table — block count per session for "No blocks" risk flag
- `proposed_actions` table — pending review count badge
- `profiles` + `templates` tables — coach and template names (batch fetch)
- `donnaPageContextRegistry` — new entry for `/director/today` with all 10 required fields
- Director layout (`src/app/director/layout.tsx`) — unchanged; DONNA panel renders automatically

**Decisions recorded:**
- Daily brief and attention items are NOT fetched server-side in `page.tsx`. Reason: calling `/api/donna/attention` and `/api/donna/brief` from a server component requires absolute URLs and adds latency to page render. These are AI-powered and belong in the DONNA panel flow. The "DONNA Intelligence" card on the page prompts the director to open the DONNA panel.
- DONNA suggestion chips are display-only (not interactive triggers). Reason: wiring them to open the DONNA panel with pre-filled text requires a client component and the DONNA panel's internal state — deferred to a future polish sprint.
- `getTodayString()` uses `new Date().toISOString().split('T')[0]` (UTC). This is server-side, so the date is deterministic regardless of the director's timezone. Edge case: directors in UTC+ timezones may see "today" as one day behind late at night. Acceptable for V1.

---

## 2026-05-15 — Sprint 385.5: Five-Agent Workflow Setup V1

**What changed:** Created 6 agent workflow docs. No source code touched.

**Integrates with:** All future sprints — these docs govern the five-agent sequential handoff workflow.

**Decisions recorded:**
- Option A (single Codespace, sequential handoff) chosen over Option B (parallel agents, branch merges). Reason: simpler coordination, no merge conflicts.
- Five roles defined: PM/CTO → Builder → QA → UI/UX → Docs/Integration.
- Sprint 386 (Today's Academy) confirmed as next build sprint.

**Files created:**
- `docs/AGENT_GUARDRAILS.md`
- `docs/AGENT_ASSIGNMENTS.md`
- `docs/SPRINT_BOARD.md`
- `docs/MERGE_QUEUE.md`
- `docs/INTEGRATION_LOG.md`
- `docs/QA_GATE.md`

---

## 2026-05-15 — Sprint 385: Prototype Screen Adoption Audit V1

**What changed:** 5 new docs mapping 8 Manus prototype screens into AcademyOS. No source code touched.

**Integrates with:** Sprint 386+ build sprints — these docs are the source of truth for screen specs, route assignments, DONNA capability per screen, role access, and backend readiness.

**Decisions recorded:**
- Sprint 386 (Today's Academy `/director/today`) is the highest-readiness new screen: all backend available, no migration.
- Screen 8 (Multi-Academy Portal) blocked on `platform_roles` migration — do not build before Sprint 392.
- Templates module is the only module at Level 10 (pilot-ready). Sessions, Players, DONNA at Level 9.
- Communications module at Level 6 — parent comms center route missing; external email delivery not built.

**Files created:**
- `docs/PROTOTYPE_SCREEN_ADOPTION_MAP.md`
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
- `docs/ROLE_ROUTE_MAP.md`
- `docs/MODULE_MATURITY_MAP.md`
- `docs/SCREEN_BACKEND_READINESS_MAP.md`

---

## 2026-05-15 — Sprint 384: DONNA Modularization for Parallel Agent Development V1

**What changed:** `DonnaAssistantButton.tsx` refactored from 4,168-line monolith to 3,346-line prop-driven orchestrator. 4 real JSX extractions, 5 documentation stubs.

**Integrates with:**
- All DONNA components — module boundaries now documented in `docs/DONNA_MODULARIZATION_MAP.md`
- Sprint 383 attendance routing — preserved exactly
- Sprint 383.5 template save fix — preserved exactly

**Decisions recorded:**
- State stays in `DonnaAssistantButton.tsx`. Extracted components are presentational (props only). Reason: `dispatchCooCommand`, `detectAndHandleCommand`, `closePanel` close over 25–30+ state setters — extraction requires useReducer + context migration (documented as future path).
- Future path: DonnaPanelContext → DonnaCommandContext → DonnaDraftContext migrations unlock further extraction.

**Extracted components:**
- `DonnaVoiceLayer.tsx` — voice card + text input + suggestion chips
- `DonnaWorkflowCards.tsx` — all workflow output cards
- `DonnaDeveloperTools.tsx` — dev-only diagnostic panel
- `DonnaAttendanceLayer.tsx` — attendance exception null-guard wrapper

**QA result:** 41 PASS / 0 FAIL / 2 WARN

---

## 2026-05-15 — Sprint 383.5: Fix class template level to development_track mapping

**What changed:** `saveAssistantTemplateDraftAction.ts` — `track: null` guard. Level label preserved in template name and `tags: ["level:<label>"]`.

**Root cause:** `draft.level` ("Orange 2") was being written directly to `templates.track` (`development_track` enum). Invalid enum value caused Postgres error on every Save Template attempt.

**Integrates with:** `templates` table, `development_track` enum, all template draft flows.

**Decisions recorded:**
- Level labels ("Orange 2") cannot map to `development_track` enum values (`"skill"|"competition"|"fitness"|"combined"`). They are different axes.
- Level label preserved in `tags` array as `"level:Orange 2"` — searchable and recoverable.
- `safeDevTrack` guard function added to validate future `track` values before insert.

---

## 2026-05-15 — Sprint 383: DONNA Attendance Exception Session Resolution V1

**What changed:** Attendance exception drafts now resolve to a real session before queuing. Natural language attendance phrase parsing added. "Queue for review" CTA wired to `saveAttendanceExceptionDraftAction`.

**Integrates with:**
- `proposed_actions` pipeline — attendance exceptions now create real proposed_action rows
- `/director/review` — attendance exceptions visible in review queue
- DONNA COO command routing — `attendance_exception_draft` command now fully wired

**Decisions recorded:**
- `fetchRecentSessionsAction` returns last 7 days of sessions for the director's academy. Read-only — no mutations.
- "Everyone was here" → clears exception flags. Natural phrase overrides slot-filled data.
- `MANUAL_PLACEHOLDER` used when no session match found — preserves draft without blocking the flow.

---

## How to Add an Entry

When a sprint completes, the Docs/Integration Agent adds a new entry at the TOP of the log (newest first) with:

```markdown
## YYYY-MM-DD — Sprint NNN: [Title]

**What changed:** [1-2 sentences]

**Integrates with:** [modules, routes, tables, or components affected]

**Decisions recorded:** [non-obvious choices, trade-offs, or constraints that future agents must know]
```

Do not record:
- Code that is self-explanatory from reading the diff
- Implementation details that belong in commit messages
- Ephemeral state or in-progress notes

---

*Last updated: Sprint 398*
