# DONNA Today Operating System Audit — Sprint 1535
**Date:** 2026-06-09
**Sprint:** Mega Sprint 1535–1564 — DONNA Today Operating System V1
**Purpose:** Audit the current `/director` Today page before redesign. Establish baseline; define target state; identify what to keep, what to delete, what to build.

---

## 1. Current state — `src/app/director/page.tsx`

### 1.1 Section inventory (render order)

| # | Section | Component | What it shows |
|---|---|---|---|
| 1 | DONNA Morning Brief | `DonnaMorningBrief` | Time greeting, name, health %, two brief lines, decisions/prepared counts, CTAs |
| 2 | DONNA COO Daily Brief | `DonnaCOODailyBriefPanel` | Academy health 6-subcategory rows + opening statement + 5 brief sections + top 3 actions |
| 3 | Immediate Attention | `ImmediateAttentionFeed` | Up to 5 attention items from `buildAttentionQueue()` |
| 4 | Today Operations | `TodayOperationsPanel` | Today sessions, expected attendance, coach gaps, over-capacity groups, assessments due, parent updates |
| 5 | Development Watch List | `DevelopmentWatchList` | 3 buckets: Moving Fast / Needs Support / Watch Closely (3 players each) |
| 6 | Director Decisions Queue | `DirectorDecisionsQueue` | Pending wrap-ups, assessments, placements, lesson requests, total count |
| 7 | Program Health | `ProgramHealthNarrative` | Health %, active players, sessions this week, improving count, group capacity rows, advancement count |
| 8 | Academy Intelligence | `AcademyIntelligenceSection` | Advancement count, curriculum bottleneck, template gap count, over-capacity groups, recap completion |
| 9 | DONNA Recommended Actions | `DonnaRecommendedActions` | Pending suggestion cards (AI curriculum suggestions) |
| 10 | Academy Setup (conditional) | `DirectorContinueSetupPanel` | Shown at BOTTOM if `!isAcademyLive` |

**Total sections: 10**

### 1.2 Data loaded on page

The page loads **17 separate DB queries** (many parallelizable but currently sequential in spots):
- `profiles` — director name + academy_id
- `academies` — name + settings
- `getPlayerSummaries` — all players
- `getAcademyPriorityQueue` — priority queue (limit 5)
- `getReassessmentPipeline` — reassessment due
- `sessions` — this week + today
- `private_lesson_requests` — new requests
- `academy_suggestions` — pending suggestions
- `player_curriculum_states` — enrollment + advancement
- `proposed_actions` — wrap-ups + assessments + parent updates + placements
- `sessions` (again) — completed in last 30 days
- `voice_notes` — recap completion
- `templates` — class + fitness count
- `sessions` (again) — any session exists
- `v_group_summary` — group capacity
- `v_pending_proposed_actions` — pending actions view
- `loadCurriculumBottleneck` — curriculum stall data

### 1.3 Problems against target UX spec

| Problem | Severity |
|---|---|
| **Setup shown at BOTTOM** — director must scroll past all 9 sections to see setup incomplete prompt | CRITICAL |
| **Fake intelligence before setup** — COO brief, academy health, attention feed, development watch, program health, intelligence section all render even when academy has 0 players and 0 templates | CRITICAL |
| **10 sections total** — massive cognitive overload; violates "director sees only what needs attention" | HIGH |
| **No Top 3 Priorities section** — closest is ImmediateAttentionFeed (5 items, mixed urgency, no "why?") | HIGH |
| **No Top 3 Risks section** — risks exist in attention context but no dedicated "what threatens the academy?" card | HIGH |
| **Decisions Needed is buried in position 6** — DirectorDecisionsQueue shows totals not decisions | HIGH |
| **No suggested DONNA prompts** — "Ask DONNA" button exists but no clickable prompt surface | MEDIUM |
| **No "Why?" / "Show evidence" on cards** — DonnaSignalMeta shows inline but no expandable evidence | MEDIUM |
| **COO brief is dense** — opening statement + 5 sections + top 3 actions all visible simultaneously | MEDIUM |
| **DonnaMorningBrief duplicates with DonnaCOODailyBriefPanel** — both show health status, both show brief lines; overlap confuses the UX hierarchy | MEDIUM |
| **ProgramHealthNarrative in position 7** — this is more of a Dashboard metric, not a Today operating item | LOW |
| **AcademyIntelligenceSection in position 8** — dense data grid, no synthesis-first structure | LOW |

---

## 2. What to KEEP

| Item | Why |
|---|---|
| `DonnaAskButton` (`donna:open` event dispatch) | Correct pattern — prompt injection via custom event works |
| `DonnaCOODailyBriefPanel` | Keep as-is for Dashboard page (not Today) |
| `DevelopmentWatchList` | Good structure — repurpose as part of priority/attention card data source |
| `ImmediateAttentionFeed` | Keep structure — repurpose as attention items backing |
| `buildAcademyAttentionReport` | Good signal aggregator — used by new engines |
| `buildAcademyHealthReport` | Keep — used by `academyHealthSummaryEngine.ts` as input |
| `buildCOODailyBrief` | Keep — move to Dashboard page |
| All existing DB queries in page.tsx | Keep — new engines accept same signals, no new queries needed |

## 3. What to REMOVE from Today page

| Item | Disposition |
|---|---|
| `DonnaMorningBrief` | Replace with new `TodayHeaderCard` (leaner: greeting + health badge + one synthesis line) |
| `DonnaCOODailyBriefPanel` | Move to Dashboard page (`/director/kpi`) — too dense for Today |
| `TodayOperationsPanel` | Remove — operations detail belongs in Sessions tab |
| `DevelopmentWatchList` | Remove as standalone section — data feeds into priorities |
| `DirectorDecisionsQueue` | Replace with `TodayDecisionsCard` (top 3, synthesis-first) |
| `ProgramHealthNarrative` | Remove — belongs on Dashboard |
| `AcademyIntelligenceSection` | Remove — belongs on Dashboard |
| `DonnaRecommendedActions` | Remove — AI suggestion cards are not operating surface |

## 4. What to BUILD

### 4.1 Engine layer (pure TypeScript, no DB, no React)

| File | Purpose |
|---|---|
| `src/lib/donna/today/todayBriefEngine.ts` | Master orchestrator — accepts pre-loaded signals, returns structured `TodayBrief` |
| `src/lib/donna/today/academyHealthSummaryEngine.ts` | Health score, status, synthesis, strengths, concerns, recommended action |
| `src/lib/donna/today/directorAttentionEngine.ts` | Attention items across players/coaches/promotions/evidence/curriculum/approvals |
| `src/lib/donna/today/directorPriorityEngine.ts` | Top 3 priorities, sorted by urgency + impact |
| `src/lib/donna/today/directorRiskEngine.ts` | Top 3 risks with disclosure when data missing |
| `src/lib/donna/today/directorDecisionEngine.ts` | Decisions needed from pending reviews |

### 4.2 UI components

| File | Purpose |
|---|---|
| `src/app/director/_components/TodaySetupCard.tsx` | Setup mode card — shown first when incomplete |
| `src/app/director/_components/TodayHeaderCard.tsx` | Greeting + health badge + one synthesis line |
| `src/app/director/_components/TodayHealthCard.tsx` | Academy Health card (score, status, synthesis, strengths, concerns) |
| `src/app/director/_components/TodayPrioritiesCard.tsx` | Top 3 Priorities with headline + synthesis + action |
| `src/app/director/_components/TodayRisksCard.tsx` | Top 3 Risks with disclosure for missing data |
| `src/app/director/_components/TodayDecisionsCard.tsx` | Decisions Needed — top 3 pending director decisions |
| `src/app/director/_components/TodayDonnaPromptsCard.tsx` | Suggested DONNA prompts (6 clickable prompts) |

---

## 5. Setup mode gate

**Rule:** If `!isAcademyLive` (no active players OR no class templates OR no sessions):
- Show `TodaySetupCard` FIRST
- Suppress: `TodayHealthCard`, `TodayPrioritiesCard`, `TodayRisksCard`
- Still show: `TodayDecisionsCard` (real pending reviews), `TodayDonnaPromptsCard`
- Rationale: decisions may exist (e.g. a player placement was already created), DONNA prompts always useful

**`isAcademyLive` signal:** (preserved from current page)
```
isAcademyLive = players.length > 0 && playersWithLevel > 0 && classTemplateCount > 0 && sessionsExist
```

---

## 6. Target page layout

### When setup incomplete

```
TodayHeaderCard           — greeting + health badge
TodaySetupCard            — "Complete Academy Setup" + progress + Continue with DONNA
TodayDecisionsCard        — any real pending decisions (even during setup)
TodayDonnaPromptsCard     — Ask DONNA surface
```

### When setup complete

```
TodayHeaderCard           — greeting + health badge + one-line synthesis
TodayHealthCard           — Academy Health (score, status, synthesis, strengths, concerns, action)
TodayPrioritiesCard       — Top 3 Priorities (headline + synthesis + action + optional Why?)
TodayRisksCard            — Top 3 Risks (headline + synthesis + action + disclosure)
TodayDecisionsCard        — Decisions Needed (top 3 pending director decisions)
TodayDonnaPromptsCard     — Suggested DONNA prompts
```

---

## 7. Card structure standard

Every card must follow:

```
headline       — what matters (one bold sentence)
synthesis      — why it matters (one sentence, plain language)
actionLabel    — what to do next (button or link)
actionHref     — where to go
[optional] whyText — expand on demand, DONNA evidence
```

---

## 8. Suggested DONNA prompts

Fixed prompts — always shown, not dynamic. Clicking dispatches `donna:open` with the prompt:

```
"What should I focus on today?"
"Who needs attention?"
"Which coaches need support?"
"Who is ready for promotion?"
"What evidence is missing?"
"What changed?"
```

---

## 9. Data availability for new engines

All engines receive signals already computed by `page.tsx`. No new DB queries required.

| Signal | Source |
|---|---|
| `activePlayers` | `getPlayerSummaries` |
| `advancementReadyCount` | `player_curriculum_states` |
| `stalledPlayerCount` | `player_curriculum_states` |
| `totalPendingReviews` | `proposed_actions` counts |
| `attentionCount` | player status filter |
| `reassessmentDue` | `getReassessmentPipeline` |
| `coachRecapsMissing` | `voice_notes` |
| `curriculumGapCount` | `academy_suggestions` |
| `overCapacityGroups` | `v_group_summary` |
| `oldestPendingReviewAgeDays` | `proposed_actions` |
| `cooAttentionReport` | `buildAcademyAttentionReport` |
| `academyHealthReport` | `buildAcademyHealthReport` |
| `isAcademyLive` | derived |
| `playersWithLevel` | `player_curriculum_states` |
| `classTemplateCount` | `templates` |
| `parentUpdatesPendingApproval` | `proposed_actions` |
| `pendingWrapUpsCount` | `proposed_actions` |
| `assessmentsNeedingReview` | `proposed_actions` |
| `activePlacementReviews` | `proposed_actions` |
| `newRequests` | `private_lesson_requests` |

---

## 10. Architecture invariants

1. No new DB queries in engines — engines accept pre-loaded signals
2. No AI calls — all synthesis is deterministic from signals
3. All cards fail gracefully — if a signal is null/0, card shows "No data yet" not an error
4. Setup gate is a hard boundary — health/priorities/risks never render during setup mode
5. Engines are pure TypeScript — no React, no DB, no side effects
