# DONNA Operating Intelligence Context Audit
**Date:** 2026-05-28
**Sprint:** 913.1
**Auditor:** Claude Code — static analysis of `directorDonnaContext.ts`

---

## Existing Fields (Pre-913.1)

| Field | Source table | Live/Demo | Used by answer engine |
|---|---|---|---|
| `pendingReviews` | `proposed_actions` WHERE `status='pending_review'` | Live | Dashboard priority, director brief, review queue |
| `missingWrapUps` | sessions today without wrap-up proposed action | Live | Dashboard priority, director brief |
| `templateDrafts` | `proposed_actions` WHERE `target_module INCLUDES 'template'` | Live | Dashboard priority, director brief |
| `attendanceExceptions` | `proposed_actions` WHERE `target_module = 'attendance'` | Live | Review queue |
| `evidenceDrafts` | `proposed_actions` WHERE `target_module INCLUDES 'evidence'` | Live | Dashboard priority, review queue |
| `todaySessions` | `sessions` WHERE `scheduled_date = today` | Live | Dashboard priority, director brief |
| `playerCount` | `players` | Live | Onboarding guide |
| `coachCount` | `academy_memberships` WHERE `role IN (coach, head_coach)` | Live | Onboarding guide |
| `isFirstTimeSetup` | derived: `playerCount === 0` | Derived | — (approximate) |
| `attentionItems` | `coach_observations` (concerns) + `session_attendance` (absences) | Live | Dashboard priority |
| `curriculumGaps` | `loadCurriculumStructuralGaps` | Live | Dashboard priority, brief |
| `academyRisks` | Computed from above | Computed | Director donna page |
| `recommendedActions` | Computed from above | Computed | Director donna page |
| `playerCurriculumStateCount` | `player_curriculum_states` | Live | — |
| `advancementEligibleCount` | `v_player_curriculum_summary` | Live | Director brief |
| `groupCount` | `groups` | Live | — |
| `templateCount` | `templates` | Live | Onboarding guide |
| `assessmentCount` / `recentAssessmentCount` | `assessments` | Live | — |
| `playerCurriculumStateSummaries` | `player_curriculum_states` | Live | Stall detection |
| `curriculumTemplateCoverageGaps` | pure logic (cross-ref) | Computed | Academy risks |
| `assessmentCoverageGaps` | pure logic (cross-ref) | Computed | Academy risks |
| `eligibleWithoutAssessmentEvidence` | pure logic | Computed | Academy risks |
| `recentDecisions` | `proposed_actions` (approved/rejected) | Live | Recent decisions answerer |
| `playerProgressStalls` | pure logic | Computed | Player stall answerer |
| `playerProgressStallCount` | derived | Computed | Director brief (deferred) |

## Biggest Gaps Identified (Pre-913.1)

| Gap | Impact | Resolution in 913.1 |
|---|---|---|
| `curriculumDraftCount` | HIGH — curriculum overrides not in briefs or review queue answers | ✅ Added |
| `oldestPendingReviewAgeDays` | HIGH — no staleness signal in review queue answers | ✅ Added |
| `highRiskPlayerCount` | MEDIUM — answer engines recomputed it from `attentionItems` each time | ✅ Added as derived field |
| `mediumRiskPlayerCount` | MEDIUM — same as above | ✅ Added as derived field |
| `onboardingReadinessLevel` | MEDIUM — onboarding guide used raw counts to infer | ✅ Added as computed field |
| `hasPlayers` / `hasCoaches` / `hasTemplates` / `hasCurriculumGaps` | LOW-MEDIUM — boolean sugar for cleaner code | ✅ Added as derived booleans |
| Per-item review details | LOW — requires per-item query | ❌ Deferred — too complex for V1 |
| Formal onboarding step flags | MEDIUM — `academy.settings` not queried | ❌ Deferred — requires touching settings read path |
| `missingWrapUpsByCoach` | LOW | ❌ Deferred — requires coach join |
| `templatesMissingBlocks` | LOW | ❌ Deferred — complex analysis |

## Fields Added in Sprint 913.1

| Field | Source | Type |
|---|---|---|
| `curriculumDraftCount` | `academy_curriculum_overrides` WHERE `status IN ('pending_review', 'draft')` | New DB query |
| `oldestPendingReviewAgeDays` | `proposed_actions` oldest `created_at` WHERE `status='pending_review'` | New DB query |
| `highRiskPlayerCount` | `attentionItems.filter(a => a.risk === 'high').length` | Derived |
| `mediumRiskPlayerCount` | `attentionItems.filter(a => a.risk === 'medium').length` | Derived |
| `hasPlayers` | `playerCount > 0` | Derived |
| `hasCoaches` | `coachCount > 0` | Derived |
| `hasTemplates` | `templateCount > 0` | Derived |
| `hasCurriculumGaps` | `curriculumGaps.length > 0` | Derived |
| `onboardingReadinessLevel` | Logic on hasX booleans | Computed |
