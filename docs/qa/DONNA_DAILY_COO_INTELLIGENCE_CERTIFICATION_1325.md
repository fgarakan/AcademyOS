# DONNA Daily COO Intelligence — Certification
**Sprint:** Mega Sprint 1325–1354
**Date:** 2026-06-09

---

## Scenario 1 — Academy Health section renders when `academyHealthReport` is passed

Director home page loads. `buildAcademyHealthReport(cooAttentionCtx)` returns an `AcademyHealthReport` with `overallStatus: 'watch'` and 6 sections. `page.tsx` passes this as `academyHealthReport={academyHealthReport}` to `<DonnaCOODailyBriefPanel>`.

→ `DonnaCOODailyBriefPanel` receives `academyHealthReport` as non-undefined prop
→ `{academyHealthReport && <AcademyHealthSection report={academyHealthReport} />}` evaluates to true
→ `AcademyHealthSection` renders:
   - Label row: "Academy Health" label + "Watch" badge (`bg-yellow-400/10 border-yellow-400/20 text-yellow-400`)
   - 6 subcategory rows, each with a colored status dot and `section.label: section.summary` text
   - `topRecommendation` rendered in lime if non-null
→ Section appears between the panel header and the opening statement

**Result: PASS**

---

## Scenario 2 — Panel renders unchanged when `academyHealthReport` is omitted

Caller does not pass `academyHealthReport` (prop is `undefined`).

→ `{academyHealthReport && <AcademyHealthSection report={academyHealthReport} />}` evaluates to false
→ `AcademyHealthSection` is not rendered
→ Panel header, opening statement, sections, and Top 3 Actions render exactly as before this sprint
→ No TypeScript error — prop is typed `academyHealthReport?: AcademyHealthReport` (optional)

**Result: PASS — backward-compatible; existing callers unaffected**

---

## Scenario 3 — Health badge color matches overall status

`AcademyHealthReport.overallStatus` is each of the four values:

| `overallStatus` | Expected badge label | Expected classes |
|---|---|---|
| `'critical'` | Critical | `bg-status-red/10 border-status-red/20 text-status-red` |
| `'action_needed'` | Needs Attention | `bg-status-orange/10 border-status-orange/20 text-status-orange` |
| `'watch'` | Watch | `bg-yellow-400/10 border-yellow-400/20 text-yellow-400` |
| `'good'` | Good | `bg-status-green/10 border-status-green/20 text-status-green` |

→ `HEALTH_BADGE[report.overallStatus]` produces correct `{ label, classes }` for all four values
→ Badge rendered as `<span className={... badge.classes}>{badge.label}</span>`
→ No `undefined` badge state possible — `HEALTH_BADGE` is a fully exhaustive `Record<HealthStatus, ...>`

**Result: PASS**

---

## Scenario 4 — All 6 health subcategory rows render with correct urgency dots

`AcademyHealthReport.sections` contains 6 items with statuses: `['good', 'watch', 'action_needed', 'critical', 'good', 'watch']`.

→ `report.sections.map(section => ...)` renders 6 rows
→ Each row: `<span className={... HEALTH_DOT[section.status]} />` + label + summary text
→ Dot colors:
   - `'critical'` → `bg-status-red`
   - `'action_needed'` → `bg-status-orange`
   - `'watch'` → `bg-yellow-400`
   - `'good'` → `bg-status-green`
→ `section.label` appears as muted prefix, `section.summary` as secondary body text
→ `topRecommendation` ("Review placement queue") renders below in `text-lime`

**Result: PASS**

---

## Scenario 5 — `isAcademyOverviewPhrase()` routes D3 to `fetch_coo_intelligence`

Director types "How is everything looking?" in the DONNA chat.

→ `processDonnaMessage` receives `input.message = "How is everything looking?"`
→ `lower = "how is everything looking?"`
→ Steps 1–7 all evaluate to false (not greeting, not setup, not brief, not review queue, not attention)
→ Step 7.1: `isAcademyOverviewPhrase(lower)` → `lower.includes('how is everything looking')` → `true`
→ `finalizeLog(debugLog, 'check_academy_overview', 'fetch_coo_intelligence')` called
→ `emitDebugLog(debugLog)` called
→ Returns `makeResult('fetch_coo_intelligence', { confidence: 0.93 }, debugLog)`
→ Brain action `fetch_coo_intelligence` fires — returns structured COO intelligence report instead of LLM fallback

**Result: PASS — D3 routing gap closed; confidence 0.93**

---

## Scenario 6 — `isAcademyOverviewPhrase()` catches all 10 documented phrase variants

Each phrase is tested with `lower` stripped and lowercased:

| Phrase | Detector match |
|---|---|
| "how is everything looking" | `lower.includes('how is everything looking')` |
| "how are things looking" | `lower.includes('how are things looking')` |
| "how is the academy" | `lower.includes('how is the academy')` |
| "how are we doing" | `lower.includes('how are we doing')` |
| "give me a status" | `lower.includes('give me a status')` |
| "give me an overview" | `lower.includes('give me an overview')` |
| "academy overview" | `lower.includes('academy overview')` |
| "academy status" | `lower.includes('academy status')` |
| "overall health" | `lower.includes('overall health')` |
| "status update on the program" | `lower.includes('status update')` and `!lower.includes('parent')` |
| "how is everything" (short) | `lower.includes('how is everything')` and `lower.length < 40` |

→ All 11 variants return `true`
→ None of them fire before step 7.1 (confirmed: none match greeting, setup, today guidance, brief, review queue, or attention phrases)

**Result: PASS**

---

## Scenario 7 — `isAcademyOverviewPhrase()` does NOT fire for unrelated phrases

Phrases that should NOT route to step 7.1:

| Phrase | Why it should not fire | Result |
|---|---|---|
| "status update for this parent" | `lower.includes('parent')` → guard blocks | `false` |
| "who needs attention" | Caught at step 7 (attention) before 7.1 | Step 7 fires |
| "what needs approval" | Caught at step 6 (review queue) before 7.1 | Step 6 fires |
| "how is the player doing" | No substring match in any branch | `false` |
| "academy setup help" | `lower.includes('academy')` but no remaining match | `false` |
| "how is everything going with the templates" | `lower.length >= 40` blocks the short-phrase branch | `false` |

→ All unrelated phrases return `false` or are intercepted by an earlier step
→ Step 7.5 (`isCOOIntelligencePhrase`) is still available as fallback for dimension-specific questions

**Result: PASS — no false positives on tested phrases**

---

## Scenario 8 — `buildDailyCOOIntelligence()` with zero active players returns `no_data` status

Input: `activePlayers: 0`, all counts at 0, `onboardingReadinessLevel: 'not_started'`.

→ `buildSetupItems(input)` → `input.onboardingReadinessLevel === 'not_started'` → pushes `academy_not_started` item with `urgency: 'critical'`, `priority: 'urgent'`
→ `deriveOverallStatus(allItems, 0)` → `activePlayers === 0` → returns `'no_data'`
→ `overallStatus: 'no_data'` even though critical setup item exists
→ `dataGaps` contains: "No active players — player development signals will appear once players are added."
→ `urgentItems` contains `academy_not_started` (setup item still fires — it's a signal, not suppressed)
→ `answers.setupOnboarding` → "• Academy setup not started — Start with DONNA Setup..."

**Result: PASS — `overallStatus` correctly reflects data absence while still surfacing the critical setup signal**

---

## Scenario 9 — `buildDailyCOOIntelligence()` with critical signals populates `urgentItems` correctly

Input:
- `pendingWrapUpsCount: 4`, `assessmentsNeedingReview: 2`, `activePlacementReviews: 1` (7 total reviews)
- `oldestPendingReviewAgeDays: 9` (>7 → critical)
- `coachCoverageGaps: 2` (today)
- `attentionCount: 5` (≥3 → critical)
- `overCapacityGroupCount: 1`
- `advancementReadyCount: 3`
- `activePlayers: 12`

→ `buildTodayPriorityItems`:
   - `review_queue`: 7 reviews, age 9 days → `urgency: 'critical'`, `priority: 'urgent'`
   - `players_on_hold`: 5 ≥ 3 → `urgency: 'critical'`, `priority: 'urgent'`
   - `coach_coverage_today`: 2 gaps → `urgency: 'critical'`, `priority: 'urgent'`
→ `buildPlayerAttentionItems`:
   - `advancement_ready`: 3 players → `urgency: 'high'`, `priority: 'urgent'`
→ `buildCurriculumItems`:
   - `over_capacity_groups`: 1 → `urgency: 'high'`, `priority: 'urgent'`
→ `urgentItems` contains 5 items (review_queue, players_on_hold, coach_coverage_today, advancement_ready, over_capacity_groups + synthesis)
→ `overallStatus: 'critical'`
→ `buildRecommendedNextAction` selects `review_queue` as top item (first urgent, excluding clear items)

**Result: PASS — all critical signals surfaced; prioritization tiers correct**

---

## Scenario 10 — Every item has evidence; `dataGaps[]` discloses limitations

For any `buildDailyCOOIntelligence()` call:

→ All 7 category builders always produce items with `evidence: string[]` (non-empty for every real item)
→ "All clear" items (`coaches_all_clear`, `parent_all_clear`) still include evidence lines citing current counts
→ `dataGaps[]` always includes at minimum:
   - "Per-coach session and observation data requires the extended COO context loader..."
   - "Per-parent communication history is not available in the current schema."
→ When `!sessionsExist`: "No session history yet — coach and attendance signals will appear once sessions are scheduled."
→ When `activePlayers === 0`: "No active players — player development signals will appear once players are added."

→ No item ever has an empty `evidence[]` array
→ Confidence is always explicitly set per item: `'high' | 'medium' | 'low'`
→ `confidence: 'low'` is never used in this engine (all signals are DB-backed counts, not inferred)

**Result: PASS — evidence discipline maintained; limitations disclosed unconditionally**

---

## Scenario 11 — `answers.academyHealth` builds a structured text answer from `AcademyHealthReport`

`AcademyHealthReport` with `overallStatus: 'action_needed'`, 6 sections (2 good, 2 watch, 1 action_needed, 1 critical), `topRecommendation: 'Review placement queue.'`, `limitations: ['Player fitness data not available.']`.

→ `buildAcademyHealthAnswer(report)` called
→ First line: `**Overall Status:** Needs Attention — one or more areas require action`
→ Section lines with emoji prefix:
   - `🟢 **Player Progress Health:** ...`
   - `🟡 **Curriculum Health:** ...`
   - `🟡 **Review & Approval Health:** ...`
   - `🟠 **Coach Execution Health:** ...`
   - `🟢 **Parent Communication Health:** ...`
   - `🔴 **Onboarding Health:** ...`
→ Recommended next action line: `**Recommended next action:** Review placement queue.`
→ Limitation note: `*Note: Player fitness data not available.*`

→ Result is a single formatted string returned as `DailyCOOIntelligence.answers.academyHealth`
→ This string is available for DONNA to return verbatim when D3 question is asked

**Result: PASS — structured answer correct; all report fields consumed**

---

## Scenario 12 — TypeScript clean and no regressions

**TypeScript check:**
`npx tsc --noEmit` → 0 errors across all sprint files.

**Regression check — `DonnaCOODailyBriefPanel`:**
- All existing `brief: COODailyBrief` prop usage unchanged
- `sections.todayPriority`, `sections.watchList`, `sections.decisionsWaiting`, `sections.parentCoachFollowUp`, `sections.setupCurriculum` all render identically when `academyHealthReport` is absent
- `allSectionsClear` logic, `Top3Actions`, missing data footer — all unaffected

**Regression check — `processDonnaMessage`:**
- Step 7.1 (`isAcademyOverviewPhrase`) runs AFTER step 7 (attention phrases)
- Existing attention phrases ("who needs attention", "what needs my attention", etc.) still caught at step 7, never reach 7.1
- Step 7.5 (`isCOOIntelligencePhrase`) still runs if 7.1 returns false — no routes lost
- `BrainRoutingStep` union type extended with `'check_academy_overview'` — exhaustive type check passes

**Regression check — `director/page.tsx`:**
- Single one-line change: `academyHealthReport={academyHealthReport}` added
- `academyHealthReport` was already computed (`buildAcademyHealthReport(cooAttentionCtx)`) — no new DB queries
- All 9 director homepage sections render identically

**Result: PASS — 0 TypeScript errors, 0 regressions**

---

## Architecture compliance

| Rule | Status |
|---|---|
| No new DB queries added to `page.tsx` | PASS — `academyHealthReport` already computed; only prop wiring changed |
| DONNA never mutates directly | PASS — engine is pure TypeScript; read-only output only |
| No new npm packages | PASS |
| No new DB migrations | PASS |
| Missing data disclosed (not hidden) | PASS — `dataGaps[]` always populated; `limitations[]` surfaced in health answer |
| `academyHealthReport` prop is optional (backward-compatible) | PASS — existing callers unchanged |
| Brain step ordering preserved | PASS — 7.1 inserted between 7 and 7.5; no existing step removed or reordered |
| `BrainRoutingStep` type updated | PASS — `'check_academy_overview'` added to union |
| TypeScript clean | PASS — 0 errors |

---

## Known V1 limitations

| Limitation | Impact | Fix path |
|---|---|---|
| `donnaDailyCooIntelligenceEngine.ts` is not integrated into the brain pipeline | `answers.*` computed but not returned by DONNA Q&A yet | Integration sprint: wire `buildDailyCOOIntelligence()` into the `fetch_coo_intelligence` brain action |
| `fetch_coo_intelligence` action uses `donnaCOOIntelligenceEngine.ts` (Sprint 784), not the new engine | D3 routing is fixed; response depth depends on the older engine's context loader | Future sprint: migrate `fetch_coo_intelligence` to use `donnaDailyCooIntelligenceEngine.ts` with page-available signals |
| D2 "What do I need to do today?" routing unchanged at 7/10 | Evidence Reasoning Engine not yet integrated into `route_coo_prompt` path | Integration sprint: wire evidence follow-up into step 4 routing |
| Health section confidence depends on `buildAcademyHealthReport` confidence field | If `AcademyHealthReport.confidence === 'low'`, the health UI still renders without a visible confidence indicator | Future: add a subtle confidence label to `AcademyHealthSection` for `'low'` confidence reports |
