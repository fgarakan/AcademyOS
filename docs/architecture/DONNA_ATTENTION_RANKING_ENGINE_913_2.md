# DONNA Attention Ranking Engine
**Sprint:** 913.2
**Date:** 2026-05-28
**File:** `src/lib/donna/donnaAttentionRankingEngine.ts`

---

## Purpose

Turns `DirectorDonnaContext` into a ranked list of operating priorities. Every answer engine that says "what should I do first?" or "what matters right now?" should delegate to this engine rather than re-implementing its own priority logic.

## Design Principles

- **Deterministic**: same ctx input → same output always
- **No LLM**: pure TypeScript, no external calls
- **Read-only**: no mutations, no DB calls
- **Honest**: if a signal is absent in ctx, no priority is emitted
- **Ranked**: sorted by score descending, highest urgency first
- **Self-documenting**: each priority carries its own why/evidence/next-action

---

## Priority Categories

| Category | Signals covered |
|---|---|
| `coach_execution` | Missing wrap-ups, session delivery |
| `player_development` | High-risk, medium-risk, advancement eligible |
| `parent_records` | Attendance exceptions (affects parent-visible data) |
| `review_queue` | Pending reviews, stale queue |
| `curriculum` | Curriculum drafts, curriculum gaps |
| `onboarding` | Incomplete setup |
| `sessions` | (Reserved for future session signals) |
| `safety` | (Reserved for future safety flags) |
| `system` | All-clear state |

---

## Scoring Rules

| Priority ID | Base score | Per-unit multiplier | Max |
|---|---|---|---|
| `missing_wrap_ups` | 80 | +3 per missing | 95 |
| `high_risk_players` | 75 | +3 per player | 90 |
| `attendance_exceptions` | 70 | +2 per exception | 85 |
| `stale_review_queue` (≥14d) | 75 | — | 75 |
| `stale_review_queue` (7–13d) | 65 | — | 65 |
| `pending_reviews` (fresh) | 60 | +1 per item | 75 |
| `medium_risk_players` | 55 | +2 per player | 65 |
| `advancement_eligible` | 50 | +1 per player | 60 |
| `curriculum_drafts` | 40 | +2 per draft | 55 |
| `curriculum_gaps` | 35 | +2 per gap | 50 |
| `onboarding_not_started` | 45 | — | 45 |
| `onboarding_partial` | 30 | — | 30 |

**Deduplication note:** `stale_review_queue` and `pending_reviews` are mutually exclusive. If `oldestPendingReviewAgeDays >= 7`, only `stale_review_queue` is emitted. If fresh, only `pending_reviews` is emitted.

**Exclusion note:** `medium_risk_players` is only emitted when `highRiskPlayerCount === 0` — avoids duplicate player risk signals.

---

## Fields Used

| ctx field | Used by |
|---|---|
| `missingWrapUps` | missing_wrap_ups |
| `todaySessions` | evidence context in missing_wrap_ups |
| `highRiskPlayerCount` | high_risk_players |
| `attentionItems` | player names in high_risk_players |
| `attendanceExceptions` | attendance_exceptions |
| `oldestPendingReviewAgeDays` | stale_review_queue |
| `pendingReviews` | pending_reviews, stale_review_queue |
| `mediumRiskPlayerCount` | medium_risk_players |
| `advancementEligibleCount` | advancement_eligible |
| `curriculumDraftCount` | curriculum_drafts |
| `curriculumGaps` | curriculum_gaps |
| `onboardingReadinessLevel` | onboarding_incomplete |
| `hasPlayers` / `hasCoaches` / `hasTemplates` / `hasCurriculumGaps` | onboarding evidence string |

## Fields Ignored (not currently used by engine)

- `recentDecisions` — used by recentDecisionsAnswerEngine instead
- `playerProgressStalls` — used by playerProgressStallDetector instead
- `assessmentCoverageGaps` — not yet wired; reserved for 913.3+
- `curriculumTemplateCoverageGaps` — not yet wired; reserved for 913.3+

---

## Example Rankings

### Example 1: Busy academy day

**ctx:** `missingWrapUps=3, highRiskPlayerCount=1, pendingReviews=5, oldestPendingReviewAgeDays=2, curriculumDraftCount=2`

| Rank | Signal | Score |
|---|---|---|
| 1 | 3 missing coach wrap-ups from today | 89 |
| 2 | 1 player flagged high-risk | 78 |
| 3 | 5 items in the Review Queue | 65 |
| 4 | 2 curriculum drafts waiting | 44 |

### Example 2: Stale queue + curriculum gaps

**ctx:** `pendingReviews=3, oldestPendingReviewAgeDays=14, curriculumGaps=3`

| Rank | Signal | Score |
|---|---|---|
| 1 | Review queue oldest item is 14 days old | 75 |
| 2 | 3 curriculum gaps flagged | 41 |

### Example 3: All clear

**ctx:** all counts at 0, `onboardingReadinessLevel='ready_signal'`

| Rank | Signal | Score |
|---|---|---|
| (empty) | — | — |

→ Answer engines return "Academy looks clear."
