# DONNA Director UX Integration — Architecture
**Sprint:** 916 | **Date:** 2026-05-29

---

## 1. What Changed

Sprint 916 wires the 914.x–915.x DONNA backend spine into visible director-facing value.
Three systems are integrated:

### 1.1 Entity Summary Cards (`/director/donna`)

**Before:** Entity summaries existed in the `donna_entity_summaries` table (populated by future pipeline) but were not surfaced anywhere in the director UI.

**After:** `DonnaEntitySummarySection` (Server Component) queries `getRelevantEntitySummaries` and renders director-safe cards in the DONNA command center right column. Shows:
- summaryText (truncated to DB-stored value)
- confidence badge (high/medium/low/partial)
- entity type label (Player / Group / Curriculum Level)

**What is NOT shown:**
- `entity_id` (raw UUIDs never rendered)
- `summary_json` (structured data not exposed)
- System-visibility summaries (`visibility_scope = 'system'`)

**Fallback:** Component returns `null` if no summaries exist. DONNA command center renders identically to before for academies with no entity summaries.

### 1.2 Recommendation Feedback Wiring (`/director/review`)

**Before:** `DonnaReviewBriefPanel` showed a "Start here" recommended action as a plain `<Link>`. No feedback was captured when directors acted on or dismissed it.

**After:**
- `DonnaReviewFeedbackChip` (Client Component) renders "Act on this" + "Dismiss" buttons below the recommended action.
- On click: fires `createAndRecordReviewFeedbackAction` (Server Action) → creates a `donna_recommendations` row + records `accepted` or `rejected` feedback.
- Navigation is NOT blocked by feedback logging — `useTransition` + fire-and-forget.

**Data flow:**
```
Director clicks "Act on this"
→ DonnaReviewFeedbackChip.logAndNavigate('accepted')
→ createAndRecordReviewFeedbackAction (fire-and-forget)
  → createDonnaRecommendation (donna_recommendations INSERT)
  → recordDonnaRecommendationFeedback (donna_recommendation_feedback INSERT)
→ router.push(href) [immediate, not waiting for feedback]
```

### 1.3 Approval Gate Coverage Audit + Pattern

**Before:** `donnaApprovalGate.ts` helpers were defined but never called from any code path.

**After:** `donnaReviewFeedbackAction.ts` calls `assertDonnaApprovalAllowed('recommend', 'none')` as the first production use of the gate pattern. This:
- Confirms `recommend` category requires no approval gate
- Demonstrates the pattern for future wiring
- Is a non-breaking addition

**High-risk DONNA write paths** (curriculum edits, level movement, parent comms, assessments) are protected by the `proposed_actions` state machine, which requires `status='approved'` before any execution. The approval gate helpers are supplementary; full wiring is deferred to Sprint 917.

---

## 2. Approval Gate Coverage Map

| Action Category | Required Level | Current Path | Gate Helper Used |
|---|---|---|---|
| `recommend` | `none` | donnaReviewFeedbackAction | `assertDonnaApprovalAllowed` ✅ |
| `curriculum_edit` | `review_queue` | proposed_actions state machine | Not yet wired directly |
| `level_movement` | `director_approval` | proposed_actions state machine | Not yet wired directly |
| `parent_communication` | `director_approval` | proposed_actions state machine | Not yet wired directly |
| `assessment_official_update` | `director_approval` | proposed_actions state machine | Not yet wired directly |
| `placement_change` | `director_approval` | proposed_actions state machine | Not yet wired directly |
| `template_publish` | `review_queue` | proposed_actions state machine | Not yet wired directly |

**No unsupervised mutations exist in V1 pilot scope.**

---

## 3. Component Map

```
/director/donna
  page.tsx (Server)
    ├── DonnaEntitySummarySection (Server) [NEW Sprint 916]
    │     └── getRelevantEntitySummaries → donna_entity_summaries
    ├── DonnaContextSummaryCard
    └── DonnaDirectorShellClient → DonnaVoiceReadyShell

/director/review
  page.tsx (Server)
    └── DonnaReviewBriefPanel (Server) [MODIFIED: academyId prop]
          └── DonnaReviewFeedbackChip (Client) [NEW Sprint 916]
                └── createAndRecordReviewFeedbackAction [NEW Sprint 916]
                      ├── assertDonnaApprovalAllowed (gate check)
                      ├── createDonnaRecommendation → donna_recommendations
                      └── recordDonnaRecommendationFeedback → donna_recommendation_feedback
```

---

## 4. V2 Gaps

1. **Entity summary auto-population** — no trigger/job yet writes summaries from DB signals. Sprint 916 UI renders them when available; Sprint 917+ to build population pipeline.
2. **Gate helper wiring to high-risk paths** — deferred to Sprint 917 to avoid Sprint 904 risk.
3. **Feedback from DonnaExecutiveCard items** — recommended actions in the left column of `/director/donna` are plain links; feedback wiring deferred.
4. **Feedback from `/director/ai-suggestions` accept/deny/defer** — those buttons hit `academy_suggestions` table, not `donna_recommendations`; bridging deferred.

---

## 5. Recommended Sprint 917

**Sprint 917 — DONNA Approval Gate Full Wiring V1**

Priority:
1. Wire `assertDonnaApprovalAllowed` to `donnaCurriculumAdjustmentApplyActions.ts` and `donnaLevelMovementActions.ts` as belt-and-suspenders pre-flight checks
2. Build entity summary auto-population: triggered on coach observation insert, session completion, and weekly cron
3. Surface recommendation feedback totals in a director intelligence panel
