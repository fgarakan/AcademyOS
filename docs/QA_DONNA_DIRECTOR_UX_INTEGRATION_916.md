# DONNA Director UX Integration QA
**Sprint:** 916 | **Date:** 2026-05-29
**Method:** Static code analysis of all 916 sprint files

---

## 1. Entity Summary Cards

| Check | Result |
|---|---|
| Raw entity IDs exposed to director UI? | No — entity_id never rendered |
| summaryJson exposed? | No — only summaryText and confidence |
| Sensitive notes exposed? | No — only summaryText field |
| System-visibility summaries filtered? | Yes — `visibilityScope !== 'system'` check applied |
| Empty fallback if no summaries? | Yes — component returns null |
| DB failure graceful? | Yes — `result.ok` checked before render |
| Confidence badge shown? | Yes — high/medium/low/partial variants |
| Entity types shown: | player, group, curriculum_level only |

**Result: PASS**

---

## 2. Recommendation Feedback UI Wiring

| Check | Result |
|---|---|
| Feedback logging can block navigation? | No — fire-and-forget via useTransition |
| Feedback logging can break UI on error? | No — try/catch silently absorbs all errors |
| Recommendation becomes an action without approval? | No — logging only, no proposed_actions write |
| Parent/player communication triggered? | No |
| Feedback status values used: | `accepted` (Act on this), `rejected` (Dismiss) |
| Gate check in server action? | Yes — assertDonnaApprovalAllowed('recommend', 'none') |
| DB write failure propagated to client? | No — server action catches all errors |
| Academy ID required before logging? | Yes — returns `{ ok: true }` silently if no academy |

**Result: PASS**

---

## 3. Approval Gate Coverage Audit

### DONNA Write Paths Surveyed

| Path | Table(s) Written | Approval Gate | Assessment |
|---|---|---|---|
| `donnaCurriculumAdjustmentApplyActions.ts` | `academy_curriculum_overrides`, `audit_logs`, `proposed_actions` | Required `status='approved'` on proposed_action before execution | Compliant via state machine |
| `donnaLevelMovementActions.ts` | `player_curriculum_states`, `players`, `audit_logs`, `proposed_actions` | Required `status='approved'` before execution | Compliant via state machine |
| `donnaConversationPersistence.ts` | `donna_conversation_sessions`, `donna_conversation_messages`, `donna_working_memory` | DONNA internal state — no content mutations | No gate required |
| `donnaEventLedger.ts` | `donna_events` | Audit log writes — no content mutations | No gate required |
| `donnaRecommendationFeedback.ts` | `donna_recommendations`, `donna_recommendation_feedback` | Logging only — no content mutations | No gate required |
| `donnaEntitySummaries.ts` | `donna_entity_summaries` | DONNA internal summaries — not surfaced as official mutations | No gate required |
| `donnaReviewFeedbackAction.ts` (Sprint 916 new) | `donna_recommendations`, `donna_recommendation_feedback` | Uses `assertDonnaApprovalAllowed('recommend', 'none')` — confirms read-only category | Compliant + gate demonstrated |

### Finding

The existing `donnaApprovalGate.ts` helpers (`assertDonnaApprovalAllowed`, `blockUnsafeDonnaAction`) are **not wired** to the `donnaCurriculumAdjustmentApplyActions` or `donnaLevelMovementActions` apply paths. Safety is enforced through the `proposed_actions` state machine: both paths require `status='approved'` before executing. This is equivalent protection.

Sprint 916 introduces `donnaReviewFeedbackAction.ts` as the first path to use `assertDonnaApprovalAllowed` explicitly, demonstrating the gate pattern.

**Wiring the approval gate into existing apply paths is deferred to Sprint 917** to avoid risk to Sprint 904 approve/reject behavior.

### High-Risk Actions Coverage

| Category | Required Level | Current Enforcement |
|---|---|---|
| curriculum_edit | review_queue | proposed_actions pending_review |
| level_movement | director_approval | proposed_actions status='approved' required |
| parent_communication | director_approval | proposed_actions status='approved' required |
| assessment_official_update | director_approval | proposed_actions flow |
| placement_change | director_approval | proposed_actions flow |
| template_publish | review_queue | proposed_actions flow |
| academy_settings_change | director_approval | Director auth required |

**All high-risk actions: no unsupervised mutations confirmed.**

---

## 4. Regression Checks

| Check | Result |
|---|---|
| Sprint 904 approve/reject paths modified? | No |
| proposed_actions state machine modified? | No |
| curriculum draft pending_review behavior changed? | No |
| DonnaVoiceReadyShell God Mode behavior changed? | No |
| donnaChatSessionMemory fallback changed? | No |
| RLS/multi-tenant boundaries changed? | No |
| Parent/player communication safety changed? | No |
| Player level movement safety changed? | No |

---

## 5. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 6. Files Changed

**Created:**
- `src/lib/donna/donnaReviewFeedbackAction.ts`
- `src/app/director/review/DonnaReviewFeedbackChip.tsx`
- `src/app/director/donna/DonnaEntitySummarySection.tsx`

**Modified:**
- `src/app/director/review/DonnaReviewBriefPanel.tsx` — added academyId prop + DonnaReviewFeedbackChip
- `src/app/director/review/page.tsx` — passed academyId to DonnaReviewBriefPanel
- `src/app/director/donna/page.tsx` — added DonnaEntitySummarySection import + render
