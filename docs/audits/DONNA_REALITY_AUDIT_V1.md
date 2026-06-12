# DONNA Reality Audit V1

**Sprint 2020A — June 2026**
**Classification: Internal — Director OS team only**

> A wrong recommendation is worse than no recommendation.
> Reality is the source of truth. Not DONNA.

---

## Methodology

Every active DONNA system was read at the source-code level. This audit examines what each system actually receives as input, what it produces as output, what assumptions it relies on, and what could make it wrong. This is not an aspirational audit of what the system was designed to do. It is an audit of what it does today.

---

## Part 1 — System-by-System Audit

### 1.1 DirectorDecisionEngine

**File:** `src/lib/donna/operations/directorDecisionEngine.ts`

**Inputs consumed:**
- `TodayPriorityResult` — up to 3 priorities from whatShouldIDoTodayEngine
- `DirectorOperatingBrief` — daily brief from directorDailyBriefEngine
- `WhatChangedResult` — from academyChangeEngine (derived from wins + alerts + priorities)
- `DonnaActionTarget[]` — route targets built from priorities
- `daysSinceLastVisit` — number of days since `user.last_sign_in_at`

**Outputs generated:**
- `DirectorDecision[]` — max 3 decisions with urgency, confidence, decisionPrompt, firstStep, actionHref
- `ReturningDirectorSummary` — if `daysSinceLastVisit >= 14`
- `DirectorDecisionContext` — wrapping all the above

**Assumptions:**
1. `TodayPriority` inputs are correct. The decision engine is pure aggregation — it trusts what the engine below it produces.
2. `daysSinceLastVisit >= 14` is a reliable returning director signal. It is based on `user.last_sign_in_at`, which updates on every login, not every page visit.
3. The `decisionPrompt` is generic (e.g., "Act now or escalate?" for all `immediate` urgency), not domain-specific.
4. The `actionHref` resolution is index-based: `targets[priority.rank - 1]`. If priorities are reordered, routes may misalign.
5. `whatChanged` for the Returning Director Summary is built from wins, alerts, and priorities — none of which are time-windowed to the actual absence period.

**What could make it wrong:**
- If today's priorities are wrong, decisions inherit those errors (garbage in, garbage out).
- `decisionPrompt` "Act now or escalate?" is the same for every `immediate` priority — adding no specificity. A director seeing 3 decisions all saying "Act now or escalate?" is not helped.
- The Returning Director Summary shows `whatChanged` that may include items unchanged during the absence — it shows "current problems" not "what changed while you were gone."
- `daysSinceLastVisit = 0` on same-session refresh (no false negative) but `last_sign_in_at` resets on login, so a director who logs in daily but visits only weekly would never see the Returning Director mode.

**Missing data that would improve it:**
- Per-decision, domain-specific `decisionPrompt` (not a generic urgency-based one)
- Actual timestamp of "last meaningful state change" per domain — not a login timestamp
- Personalized confidence reason (why is this `provisional` vs `reliable`)

---

### 1.2 Operating Partner (whatShouldIDoTodayEngine)

**File:** `src/lib/donna/operations/whatShouldIDoTodayEngine.ts`

**Inputs consumed:**
- `OperatingPartnerInputs` — a fused contract of philosophy + operational inputs
- `AcademySituationAssessment` — deterministic situation type
- `OperatingAttentionReport` — all attention signals

**Outputs generated:**
- `TodayPriorityResult` — up to 3 `TodayPriority` objects, scored by urgency × impact × confidence
- `whatToIgnore` — explicit list of items DONNA is not surfacing today

**Assumptions:**
1. Each situation type maps to exactly the right candidate set. There is no cross-situation blending.
2. The capacity budget (`buildCapacityBudget`) can correctly estimate how much cognitive load each priority requires.
3. `stallCount` is a reliable proxy for player development problems (it may actually count players on hold or with overdue reassessments, not true development stall).
4. `hasAttendanceData: false` at the data-loading layer means attendance signals never fire.

**Critical finding — Hardcoded zeros in actual data:**

Reading `src/app/director/page.tsx` lines 366–457, the following fields are hardcoded or permanently set to zero/false:

| Field | Hardcoded value | Impact |
|---|---|---|
| `readinessBlockerCount` | `0` | Evidence blocker priorities never fire |
| `inconsistentExecutionCount` | `0` | Coach inconsistency signal never fires |
| `stagnantPlayerByCoachCount` | `0` | Per-coach stall analysis never fires |
| `hasAttendanceData` | `false` | Attendance risk signals never fire |
| `weakLevelCount` | `0` | Weak level signal never fires |
| `emptyLevelCount` | `0` | Empty level signal never fires |
| `missingAssessmentCount` | `0` | Missing success criteria never fires |
| `missingGateCount` | `0` | Missing gate signal never fires |
| `playerBackedBottleneckCount` | `0` | Highest-confidence curriculum signal never fires |
| `hasExecutionData` | `false` | Coach execution quality has no data |
| `hasPlayerEvidenceData` | `false` | Player evidence for bottleneck detection unavailable |
| `totalParentCount` | `0` | Parent system has no denominator |
| `engagementRiskCount` | `0` | Parent engagement signal never fires |
| `retentionRiskCount` | `0` | Combined parent+player retention signal never fires |
| `hasEngagementData` | `false` | Parent engagement system has no data |
| `hasRetentionData` | `false` | Retention risk system has no data |
| `totalCoachCount` | `0` | Coach system has no denominator |
| `missingWrapUpCoachCount` | `0` | Per-coach diagnosis degraded |

**Net effect:** The vast majority of the Operating Partner's intelligence capability is disconnected from real data. The system produces outputs, but those outputs are based on a partial view of reality. The only signals that actually fire reliably are:
- Player status (on_hold, reassessment_due) → `attentionCount`
- Curriculum state exists (`playersWithLevel`, `classTemplateCount`)
- Session recaps (completed sessions vs sessions with voice notes)
- Approval queue (total pending, oldest age)
- Over-capacity groups

**What could make it wrong:**
- The situation classifier picks `assessment_debt` or `player_progression_bottleneck` based on the few signals it has, but misses the real root cause because coach execution, parent engagement, and curriculum bottleneck data are absent.
- `stalledPlayerCount` is derived from a query in the page that needs investigation — it may be a proxy rather than a true stall detection.

---

### 1.3 What Changed Engine

**File:** `src/lib/donna/operations/academyChangeEngine.ts`

**Inputs consumed:**
- `TodayPriority[]` — today's priorities (not historical delta)
- `OperatingAlert[]` — alerts from the daily brief
- `OperatingWin[]` — wins from the daily brief
- `periodDays` — window for "what changed" (hard-coded as 7 in director/page.tsx)

**Outputs generated:**
- `WhatChangedResult` — up to 5 `AcademyChange` entries ranked by impactScore

**Critical finding — "What Changed" is not a delta:**
`buildWhatChangedResult` does not compute what actually changed since last visit. It computes the current state (today's priorities + alerts + wins) and frames them as changes. The `periodDays` parameter exists but is not used to filter by time — all data comes from today's engine outputs.

**What this means:** A director returning after 3 weeks who asks "what changed?" sees today's priorities labeled as changes, not an actual delta comparison between their last visit and now. The `periodDays` variable is a design intention that is not implemented.

**What could make it wrong:**
- A problem that existed before the director's absence appears as "changed" — it did not change, it was already there.
- A win that happened yesterday shows as "improved" whether the director was away for 1 day or 30 days.

---

### 1.4 Returning Director Mode

**File:** `src/lib/donna/operations/directorDecisionEngine.ts` (+ `ReturningDirectorBanner` component)

**Threshold:** `daysSinceLastVisit >= 14` based on `user.last_sign_in_at`

**Inputs consumed:** `whatChanged` (from academyChangeEngine), `brief.wins`, `decisions[0]`

**Critical findings:**
1. A director who logged in yesterday to check something, then was physically away for 20 days, would not see Returning Director mode (because `last_sign_in_at` reset yesterday).
2. A director who works daily but logs in at 9am and refreshes at 9:01am sees `daysSinceLastVisit = 0` correctly — no false positive here.
3. `whatChanged` in the banner is today's state, not an actual delta. A director returning after 30 days sees the same content as someone returning after 14 days.
4. `whatImproved` is populated from `brief.wins` which are current wins, not wins that emerged during absence.
5. `whatMattersNow` is `decisions[0].title` — it is the #1 priority, not necessarily what is most urgent specifically because of the absence.
6. `recommendedFirstAction` is also `decisions[0]` — correct in intent but circular (it's the same content as `whatMattersNow`).

**Assessment:** Returning Director Mode is structurally sound but operating on incomplete signals. It would give a director the right general direction but would not tell them what specifically happened while they were away.

---

### 1.5 Attention Engine

**File:** `src/lib/donna/operations/academyAttentionEngine.ts`

**Architecture is correct:** Signals are observations, not priorities. Domain separation is clean. `dataAvailable` flags prevent false signals from empty data. Severity scaling is defensible (e.g., >40% stall → critical, >20% → high).

**Signal-by-signal assessment:**

| Signal | Can Fire? | Assessment |
|---|---|---|
| `players-high-stall` | Yes | Based on `stalledPlayerCount` — query validity uncertain |
| `players-advancement-backlog` | Yes | Fires at ≥5 eligible — reasonable |
| `players-attendance-risk` | NO | `hasAttendanceData: false` always |
| `players-readiness-blockers` | NO | `readinessBlockerCount: 0` always |
| `players-without-level` | Yes | Reliable |
| `players-without-coach` | Yes | Reliable |
| `players-assessments-overdue` | Yes | Reliable |
| `coaches-missing-wrapups` | Yes | Reliable |
| `coaches-execution-inconsistency` | NO | `inconsistentExecutionCount: 0` always |
| `coaches-low-wrapup-rate` | Yes (partial) | `hasWrapUpData` check is gated correctly |
| `coaches-stagnant-players` | NO | `stagnantPlayerByCoachCount: 0` always |
| `curriculum-empty-levels` | NO | `emptyLevelCount: 0` always |
| `curriculum-weak-levels` | NO | `weakLevelCount: 0` always |
| `curriculum-missing-gates` | NO | `missingGateCount: 0` always |
| `curriculum-player-backed-bottleneck` | NO | `playerBackedBottleneckCount: 0` always |
| `curriculum-pending-approvals` | Yes | Uses `assessmentsNeedingReview` as proxy |
| `curriculum-missing-success-criteria` | NO | `missingAssessmentCount: 0` always |
| `parents-retention-risk` | NO | `retentionRiskCount: 0` always |
| `parents-communication-gap` | Yes | Uses `parentUpdatesPendingApproval` as proxy |
| `parents-engagement-risk` | NO | `hasEngagementData: false` always |
| `parents-overdue-updates` | Yes | Same as communication gap — double-counting |
| `business-enrollment-decline` | NO | Always returns 'stable' |
| `business-capacity-issue` | Yes | Based on group summary query |
| `business-churn-risk-high` | NO | Capped at 'medium' in current logic |
| `system-stale-approvals` | Yes | Reliable |
| `system-onboarding-incomplete` | Yes | Reliable |
| `system-approval-queue-building` | Yes | Reliable |
| `philosophy-high-drift` | NO | Philosophy inputs always use `buildDefaultPhilosophyInputs` |
| `philosophy-reality-override-*` | NO | Philosophy overrides always empty |

**Summary:** Of ~27 distinct signals, approximately 11 can fire reliably. The remaining 16 are silenced by hardcoded zero values or false data availability flags. The engine is architecturally complete; the data pipeline to it is not.

---

### 1.6 Curriculum Evolution Engine

**File:** `src/lib/donna/curriculum/curriculumEvolutionEngine.ts`

**Inputs consumed:** `CurriculumIntelligenceContext` — loaded by `curriculumBottleneckLoader.ts`

**Architecture:** Sound. Sub-engines (bottleneck detection, gate health, effectiveness, progression, health, reality overrides) each produce domain-specific reports that the evolution engine aggregates into ranked recommendations.

**Evidence strength model:**
- `high` → bottleneck confirmed by player data
- `medium` → structural gap with indirect signals
- `low` → sparse signals, no player confirmation
- `insufficient` → not enough data to recommend

**Assessment:** This is the most mature DONNA system. Evidence strength gating means weak signals produce low-confidence recommendations, which is correct behavior. The suppression filter prevents re-surfacing dismissed recommendations.

**Where it can be wrong:**
- When `CurriculumIntelligenceContext` contains stale or incomplete player state data, bottleneck detection fires on structural gaps (levels with few items) rather than actual player outcomes.
- Reality override detection (`curriculumRealityOverride.ts`) requires player outcome data that may not be available.

---

### 1.7 Evolution Memory

**File:** `src/lib/donna/curriculum/curriculumEvolutionMemory.ts`

**Storage:** `academies.settings.donna_curriculum_evolution_memory[]`

**Architecture:** Correct. Suppression filter prevents dismissed recommendations from re-appearing within the suppression window. `getActiveRecommendations()` correctly excludes suppressed and acted-upon items.

**Where it can be wrong:**
- Suppression is based on `recommendation.id`. If IDs change (e.g., due to engine changes), previously dismissed items may re-surface.
- Cap of 500 entries is never enforced at read time — only at write time. Old entries accumulate.

---

### 1.8 Action Draft Builder

**File:** `src/lib/donna/actions/donnaDraftBuilder.ts`

**Assessment:** Correct V1 behavior. Drafts are generated from existing engine outputs — no new intelligence. Every draft carries a `DonnaActionTarget`. The player and curriculum domain draft builders produce context-appropriate drafts.

**Where it can be wrong:**
- `buildDraftFromDecision` maps domain → actionId using a generic mapping (e.g., all `players` domain priorities with `approvalRequired: true` → `schedule_reassessment`). This can produce a reassessment draft even when the underlying priority is about advancement eligibility, not assessment debt.
- `buildPlayerDomainDrafts` shows all signals simultaneously (assessment, advancement, on-hold). If an academy has all three, 3 drafts appear, which may feel like clutter.

---

### 1.9 DonnaWorkQueue

**File:** `src/app/director/_components/DonnaWorkQueue.tsx`

**Assessment:** Correct aggregation pattern. Shows domain counts and links to domain pages — not a detail list. Works as designed.

**Where it can be wrong:**
- Drafts are rebuilt on every page load from `decisionContext.decisions`. If decisions change between visits, the "work queue" changes — no persistence.
- A director who dismisses a draft on the players page will not see it removed from the work queue count (work queue is built from fresh decision data, not from action memory).

---

## Part 2 — Top Decisions Audit

### Decision Quality Matrix

The `DirectorDecisionEngine` maps `TodayPriority` → `DirectorDecision`. All decisions come from the situation classifier. Assessment of each decision type:

| Decision | Deserves to be shown? | Would a director care? | Would this change behavior? | Assessment |
|---|---|---|---|---|
| Clear stale approval queue (>7 days) | YES | YES | YES | High value — specific, actionable, has route |
| Send overdue parent updates | YES | YES | YES | High value — clear signal, clear action |
| Clear outstanding session recaps | YES | YES | YES | High value — coaches are blocking intelligence |
| Advance X eligible players | YES | YES | YES | Medium value — depends on eligibility quality |
| Fix curriculum bottleneck confirmed by player evidence | YES | YES | YES | High value — but never fires (data missing) |
| Review philosophy drift | MAYBE | MAYBE | MAYBE | Low current value — philosophy inputs always provisional |
| Address communication gap (generic) | MAYBE | MAYBE | MAYBE | Low value — fires when no specific signal exists |
| Investigate enrollment decline | NO (never fires) | — | — | Never fires |
| Gather missing data before DONNA can advise | YES (when appropriate) | YES | YES | High value — honest about its own limitations |

**The `decisionPrompt` problem:**
All `immediate` urgency priorities get `decisionPrompt = "Act now or escalate?"`. All `players` domain priorities get `decisionPrompt = "Review now or defer to next session?"`. These are structurally correct but content-free. A director seeing three decisions all asking "Act now or escalate?" gains nothing from the prompt.

**The `firstStep` quality:**
First steps are specific and actionable in most cases. They reference concrete actions ("Open the approval queue", "Contact the X coaches with missing recaps"). This is the strongest part of the decision output.

---

## Part 3 — Returning Director Audit

### Can a director recover context after absence?

| Absence duration | DONNA behavior | Director recovers context? |
|---|---|---|
| 3 days | No returning director mode (< 14 days) | Partially — sees today's priorities but no explicit "you were away" framing |
| 7 days | No returning director mode | Partially — same as above |
| 14 days | Returning Director Mode activates | Partially — sees current state framed as what changed, not actual delta |
| 30 days | Returning Director Mode activates | Partially — same content as 14-day return; no deeper context |

**What works:**
- 4-section layout (changed, improved, matters now, first action) is the right structure
- Surfacing the #1 priority as "first action" is correct

**What doesn't work:**
- `whatChanged` shows current state, not actual changes during the absence window
- A director returning after 30 days sees no more context than one returning after 14 days
- If the director logged in recently for any reason (checking email, etc.), the mode won't activate at all

**Verdict:** The concept is right. The implementation is a placeholder for what it should become. A director currently gets a "here's what matters today" view reframed as a returning summary — not a true absence-recovery experience.

---

## Part 4 — Attention Engine Audit

See Section 1.5 for the full signal-by-signal audit.

**Signals that pass all three tests (Important, Urgent, Actionable):**
1. Stale approval queue (>7 days old)
2. Players without curriculum level
3. Missing session recaps (if ≥5)
4. Advancement-eligible players (≥5)
5. Over-capacity groups
6. Players without primary coach

**Signals that are important but not currently actionable (no route to fix):**
- `coaches-missing-wrapups` → surface is `/director/review?tab=wrap-ups` which may not exist or be incomplete
- `parents-communication-gap` → uses `parentUpdatesPendingApproval` as proxy, but "communication gap" and "overdue approvals" are different things

**Signal redundancy (noise risk):**
- `parents-communication-gap` and `parents-overdue-updates` both fire from `parentUpdatesPendingApproval` — they produce two separate signals from one data point.

---

## Part 5 — Curriculum Evolution Audit

See Section 1.6. The curriculum evolution system is the most data-complete and architecturally sound DONNA system. Its recommendations are gated by evidence strength.

### Recommendation type classification:

| Recommendation Type | Director Approval Needed? | Would a curriculum expert approve? | Current Value |
|---|---|---|---|
| Fill bottleneck (player-evidence backed) | YES | YES | High Value |
| Add missing gates | YES | YES | High Value |
| Strengthen weak levels | YES | USUALLY | Medium Value |
| Add assessment criteria | YES | USUALLY | Medium Value |
| Philosophy alignment suggestion | YES | SOMETIMES | Low Current Value (philosophy data missing) |
| Remove low-effectiveness drill | YES | SOMETIMES | Low Current Value (drill effectiveness needs real data) |

---

## Part 6 — Action Execution Audit

### All 10 actions scored:

| Action | Usefulness (1-10) | Accuracy (1-10) | Time Savings (1-10) | Notes |
|---|---|---|---|---|
| `open_player` | 7 | 9 | 6 | Generic — opens player directory, not a specific player |
| `open_curriculum` | 6 | 9 | 5 | Generic — opens curriculum home |
| `open_approval` | 9 | 9 | 8 | High value — direct navigation to review queue |
| `create_coach_note` | 5 | 6 | 4 | Requires entity (specific player ID) to be useful |
| `create_player_note` | 5 | 6 | 4 | Same — requires entity |
| `schedule_reassessment` | 8 | 7 | 7 | Good intent; mapped from any `players` domain priority with `approvalRequired` |
| `draft_parent_message` | 7 | 7 | 6 | Requires parent message system to be built |
| `create_session_draft` | 4 | 5 | 3 | Sessions page may not be linked in current nav |
| `review_advancement` | 9 | 8 | 8 | High value — direct path to most common director task |
| `review_curriculum_recommendation` | 8 | 8 | 7 | High value — curriculum evolution surface is built |

**Highest-value actions:** `open_approval`, `review_advancement`, `review_curriculum_recommendation`
**Lowest-value actions:** `create_session_draft`, `create_coach_note`, `create_player_note` (entity-bound actions without entity context)

---

## Summary

The Operating Partner architecture is sound. The situation classification, attention engine, and priority generation logic are well-designed and defensible. The curriculum evolution system is the strongest DONNA system in the codebase.

The primary problem is data pipeline completeness. More than half of the attention signals cannot fire because the data that would trigger them is not being loaded or computed. DONNA is working with a partial view of reality.

**Current accuracy by domain:**
- System signals (approvals, queue): High accuracy
- Player signals (level, coach, status): Medium accuracy
- Curriculum structure signals: Not firing
- Coach quality signals: Not firing (except recaps)
- Parent signals: Partial (pending approvals proxy only)
- Business signals: Not firing (enrollment always stable)
- Philosophy signals: Not firing
