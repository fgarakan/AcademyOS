# DONNA Gap Analysis V1

**Sprint 2020A — June 2026**

> Do NOT build these yet.
> This document identifies. It does not prescribe a build order.
> Rank = impact × feasibility, not build priority.

---

## Ranking Criteria

**Impact (1–5):** How much would this change DONNA's accuracy or director experience?
**Difficulty (1–5):** How hard is this to implement correctly? (1 = days, 5 = weeks/months)
**Priority (Impact ÷ Difficulty):** Higher ratio = better ROI.

---

## Gap 1: Curriculum Content Data Not Reaching Operating Partner

**What the gap is:**
`weakLevelCount`, `emptyLevelCount`, `missingAssessmentCount`, `missingGateCount`, `playerBackedBottleneckCount` are all hardcoded to `0` in `director/page.tsx`. The Operating Partner has complete logic for these signals but receives no data.

**Where the data exists:**
`curriculumExplorer`, `coverageReport`, `curriculumRanking` — these are already computed on the curriculum page and even on the director page via `getCurriculumExplorerData`. They are just not wired into `operationalInputs`.

**What would change:**
- Curriculum gap situation type would fire correctly
- Player progression bottleneck priorities would fire with real data
- 4–6 attention signals that currently never fire would become live
- Director decisions for curriculum would be based on actual gaps, not proxies

**Impact: 5** — This is the single highest-impact data gap.
**Difficulty: 2** — The data is computed; it just needs to be connected.
**Priority: 2.5** — Highest priority gap.

---

## Gap 2: Coach Execution Quality Data

**What the gap is:**
`inconsistentExecutionCount`, `stagnantPlayerByCoachCount`, `missingWrapUpCoachCount`, `totalCoachCount`, `hasExecutionData` are all zero/false. The coaching intelligence system cannot identify which coaches need attention — only that recaps are missing in aggregate.

**Where the data would come from:**
- Per-coach session recap counts (group sessions by coach_id, count missing recaps)
- Per-coach player stall (group stalled players by primary_coach_id, count those with 2+)
- Both are achievable with existing `sessions`, `voice_notes`, and `players` tables

**What would change:**
- Coach-specific priorities would fire ("Review delivery consistency with 2 coaches")
- The situation classifier would detect `coach_execution_gap` with real evidence, not inference
- Directors would get named-coach guidance, not just aggregate counts

**Impact: 4** — Coach accountability is a high-value director function.
**Difficulty: 3** — Requires new queries and per-coach aggregation logic.
**Priority: 1.3**

---

## Gap 3: Parent Retention and Engagement Data

**What the gap is:**
`retentionRiskCount`, `engagementRiskCount`, `hasRetentionData`, `hasEngagementData` are all zero/false. The parent intelligence system is currently using `parentUpdatesPendingApproval` as a proxy for communication health — it measures the wrong thing.

**What the gap costs:**
- `parent_retention_risk` situation type never fires
- The most economically significant DONNA signal (churn prediction) is silent
- Parent communication guidance is limited to "you have X updates pending approval"

**Where the data would come from:**
- Retention risk: players with `player_status = 'on_hold'` whose parents haven't received a communication in X days
- Engagement risk: parents who haven't opened/responded to communications in X days
- Both require parent communication tracking (opens, responses) that may not be implemented

**Impact: 5** — Churn prevention is the highest economic value DONNA can deliver.
**Difficulty: 4** — Parent engagement tracking requires infrastructure that may not exist.
**Priority: 1.25**

---

## Gap 4: True "What Changed" Delta

**What the gap is:**
`buildWhatChangedResult` shows current state framed as change, not an actual delta between visits. A director returning after 3 weeks sees today's priorities labeled as "what changed" — which may include items that have been present for months.

**What is needed:**
- Store a `donna_state_snapshot` in `academies.settings` on each director visit
- On next visit, diff current state against snapshot
- Surface items that appeared, resolved, or changed severity since last snapshot

**What would change:**
- Returning Director Banner would show real changes: "2 players advanced since your last visit" instead of today's current state
- Directors would trust the change detection because it would actually reflect changes
- The snapshot would also enable trend detection ("This has been an issue for 3 visits in a row")

**Impact: 4** — Trust erosion from false "what changed" is significant.
**Difficulty: 3** — Snapshot storage is straightforward; diffing state structures requires careful design.
**Priority: 1.3**

---

## Gap 5: Philosophy Inputs Are Always Provisional

**What the gap is:**
`buildDefaultPhilosophyInputs()` returns a fully-zeroed philosophy profile with all scores at 50/100 (neutral), `driftDetected: false`, `overrides: []`. The entire philosophy intelligence layer (drift detection, reality overrides, preference extraction) is wired correctly but receives no real data.

**What is needed:**
- Load `academy_dna` from `academies.settings` and map it to `OperatingPartnerPhilosophyInputs`
- Extract actual philosophy scores from the academy's configured DNA dimensions
- Compute drift by comparing DNA scores against recent curriculum/session behavior

**What would change:**
- Philosophy drift signal would fire for academies with genuine drift
- Opportunity candidates would reflect actual academy preferences, not generic defaults
- `philosophy_drift` situation type would become a real classifier

**Impact: 3** — Philosophy intelligence is a strategic differentiator, but most early academies won't have drift.
**Difficulty: 3** — DNA mapping and drift computation require careful calibration.
**Priority: 1.0**

---

## Gap 6: Attendance and Stall Detection Quality

**What the gap is:**
- `hasAttendanceData: false` — attendance risk signal never fires
- `stallCount` is derived from a query on `players` where `player_status = 'on_hold'` combined with some other filter — this is a status flag, not a true development stall detection

**What is needed:**
- True stall detection: players who have not had a session recap showing progression in X sessions
- Attendance tracking: players whose attendance rate has dropped below threshold
- Both require session + player progress data joined per player

**What would change:**
- `players-high-stall` signal would accurately identify players truly stuck in development, not just players with an on_hold status
- `players-attendance-risk` signal would fire for players showing declining attendance

**Impact: 3** — Stall detection accuracy affects the credibility of the most common director priority.
**Difficulty: 4** — True stall requires longitudinal player-session data and progression tracking.
**Priority: 0.75**

---

## Gap 7: Approval Queue Age Tracking

**What the gap is:**
`oldestPendingReviewAgeDays` is computed as part of the dashboard, but the quality of this number depends on whether `created_at` timestamps are reliable across all `proposed_actions` types.

**Minor gap — this mostly works.** The main missing piece is that the age is for all pending items combined (wrap-ups + assessments + placements + parent updates). An old assessment awaiting review looks the same as an old parent message — the stale signal fires for both.

**What is needed:**
- Age broken out by category (stale wrap-up queue vs stale approval queue vs stale parent communication queue)
- Category-specific stale thresholds (a 3-day-old wrap-up is more urgent than a 3-day-old parent update)

**Impact: 2** — The current aggregate signal is functional. Categorization adds precision.
**Difficulty: 2** — Existing query can be grouped by type.
**Priority: 1.0**

---

## Gap 8: Domain-Specific Decision Prompts

**What the gap is:**
`toDecisionPrompt()` in `directorDecisionEngine.ts` returns the same prompt for all priorities of the same urgency/domain. "Act now or escalate?" is the prompt for every `immediate` priority regardless of content.

**What is needed:**
- Decision prompts derived from the specific priority title and firstStep
- Binary choices that reflect the actual tradeoff the director faces
- Example: "Clear 12 session recaps (call coaches) or schedule a group reminder?" instead of "Act now or escalate?"

**Impact: 2** — Prompt quality affects decision-making quality, but directors can still act without good prompts.
**Difficulty: 2** — Template-based generation from priority content.
**Priority: 1.0**

---

## Gap 9: Action Draft Persistence and State Sync

**What the gap is:**
Action drafts are rebuilt on every page load from current decision data. When a director dismisses a draft on the players page, the work queue count on the Today page doesn't update (it's rebuilt from fresh decisions on the next load). When a director resolves the underlying issue, the draft may still appear on the next load if the data hasn't propagated.

**What is needed:**
- Dismissed drafts should be excluded when rebuilding the work queue
- Work queue should reflect `donna_action_memory` to suppress dismissed items
- Draft generation should check memory before surfacing a draft for an actionId + signal combination recently dismissed

**Impact: 3** — Seeing dismissed drafts re-appear destroys trust quickly.
**Difficulty: 2** — Memory check in draft builder before generating.
**Priority: 1.5**

---

## Gap 10: Returning Director — Real Absence Delta

**What the gap is:**
Covered in Gap 4. The Returning Director Banner shows current state rather than the delta since last visit. This is a specific manifestation of the snapshot gap.

**What is additionally needed beyond Gap 4:**
- A per-domain "last meaningful change" timestamp stored in the snapshot
- "What improved" populated from players who advanced, approvals cleared, or curriculum improved during the absence
- "What deteriorated" populated from new on-hold players, new stale approvals, or new stall signals that appeared during the absence

**Impact: 4** — The Returning Director experience is a critical trust moment. Getting it right is high-leverage.
**Difficulty: 3** — Requires snapshot + per-domain delta computation.
**Priority: 1.3**

---

## Gap Summary Table

| # | Gap | Impact | Difficulty | Priority | Notes |
|---|---|---|---|---|---|
| 1 | Curriculum data not reaching Operating Partner | 5 | 2 | 2.5 | Highest ROI — data exists, just not wired |
| 2 | Coach execution quality data | 4 | 3 | 1.3 | Requires per-coach aggregation queries |
| 3 | Parent retention and engagement data | 5 | 4 | 1.25 | Highest impact, hardest to implement |
| 4 | True "What Changed" delta | 4 | 3 | 1.3 | Snapshot system needed |
| 5 | Philosophy inputs always provisional | 3 | 3 | 1.0 | Strategic differentiator, not urgent |
| 6 | Attendance and stall detection quality | 3 | 4 | 0.75 | Longitudinal data required |
| 7 | Approval queue age by category | 2 | 2 | 1.0 | Quick improvement to existing signal |
| 8 | Domain-specific decision prompts | 2 | 2 | 1.0 | Content quality improvement |
| 9 | Action draft persistence and state sync | 3 | 2 | 1.5 | Trust-critical, relatively easy |
| 10 | Returning Director real delta | 4 | 3 | 1.3 | Depends on Gap 4 (snapshot) |

---

## Build Order Recommendation (When Ready)

When the team decides to address these gaps, the suggested sequence:

**Phase A (Quick wins, high ROI):**
- Gap 1: Wire curriculum data into Operating Partner inputs (days of work, huge signal improvement)
- Gap 9: Suppress dismissed drafts when rebuilding work queue (hours of work)
- Gap 7: Categorize approval queue age by type (hours of work)

**Phase B (Data pipeline):**
- Gap 2: Per-coach aggregation for execution quality
- Gap 4 + 10: Snapshot system for real What Changed / Returning Director delta
- Gap 8: Domain-specific decision prompts

**Phase C (New data sources):**
- Gap 3: Parent engagement and retention tracking (requires new data model)
- Gap 5: Philosophy inputs from real academy DNA
- Gap 6: True stall detection (longitudinal analysis)

---

## What DONNA Looks Like When These 10 Gaps Are Closed

| Output Type | Current Score | Projected Score |
|---|---|---|
| Director Decisions | 64/100 | 83/100 |
| Curriculum Recommendations | 83/100 | 90/100 |
| Action Drafts | 61/100 | 78/100 |
| Attention Signals | 62/100 | 85/100 |
| Returning Director Context | 55/100 | 82/100 |
| **Overall** | **65/100** | **84/100** |

At 84/100, DONNA would be a production-grade Operating Partner.
At 65/100, DONNA is a directionally correct V1 with meaningful blind spots.

The path from 65 to 84 is 90% data pipeline work, not intelligence work.
The intelligence is already built. It needs to eat real data.
