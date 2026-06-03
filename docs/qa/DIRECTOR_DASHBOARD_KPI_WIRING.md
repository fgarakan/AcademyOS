# Director Dashboard KPI Wiring — QA Document

**Sprint:** Director Dashboard KPI Wiring V1  
**Date:** 2026-06-03  
**Status:** Complete

---

## Design principle

> Deep system. Simple screen. DONNA explains complexity.

The 7-KPI section replaces the previous 3-tile "Today's Pulse" strip. Each tile shows one live count, a human label, and links directly to the relevant workflow. Numbers come from real Supabase queries. No mocked or static values.

---

## KPI inventory

| # | KPI | Data source | Route | Empty-state label |
|---|-----|-------------|-------|-------------------|
| 1 | Players needing attention | `players.player_status IN ('on_hold', 'reassessment_due')` via `getPlayerSummaries()` | `/director/players` | "Players on track" |
| 2 | Pending onboarding | `players.player_status IN ('pending_placement', 'placement_in_progress', 'pending_approval')` via `getPlayerSummaries()` | `/director/players/onboarding-review` | "No pending onboarding" |
| 3 | Assessments to review | `proposed_actions` WHERE `target_module IN ('assessment_studio_draft', 'placement_assessment_draft')` AND `status = 'pending_review'` | `/director/review?tab=needs-approval` | "Assessments reviewed" |
| 4 | Players ready for reassessment | `v_reassessment_pipeline` WHERE `urgency IN ('overdue', 'due_soon')` via `getReassessmentPipeline()` | `/director/signals` | "No reassessments due" |
| 5 | Parent updates pending | `proposed_actions` WHERE `target_module = 'parent_communication'` AND `status = 'pending_review'` | `/director/review?tab=player-updates` | "Parent updates current" |
| 6 | Coach recaps missing | Completed sessions (last 30 days) WITHOUT a `voice_notes` record (derived from existing recap query) | `/director/review?tab=needs-approval` | "All recaps submitted" |
| 7 | Placement reviews active | `proposed_actions` WHERE `target_module IN ('placement_review', 'placement_recommendation_draft', 'level_review')` AND `status = 'pending_review'` | `/director/review?tab=needs-approval` | "No active placements" |

---

## Query scoping — safety verification

All 7 KPIs are scoped by `academy_id`:

| KPI | Scoping method |
|-----|---------------|
| 1, 2 | `getPlayerSummaries(supabase, academyId)` — backend function, academy-scoped |
| 3, 5, 7 | `rawDb.from('proposed_actions').eq('academy_id', academyId)` |
| 4 | `getReassessmentPipeline(supabase, academyId)` — backend function, academy-scoped |
| 6 | Derived from `sessions` + `voice_notes` both queried with `.eq('academy_id', academyId)` |

No parent or player personal data is exposed in counts. Counts are integers only.

---

## Role safety

- All queries run in a Server Component as the authenticated director session.
- RLS is active on all queried tables — a director only sees their own academy's data.
- No player name, parent name, or personal detail is included in the KPI counts.
- No data from the player or parent portal is surfaced here.

---

## Empty-state behaviour

When all 7 KPIs are zero:
- Each tile shows `0` in `text-text-secondary` (calm, not alarming)
- Each tile shows its `zeroLabel` (positive language: "All recaps submitted")
- The section header shows "All clear" in `text-status-green`

When any KPI is non-zero:
- That tile shows the count in `text-status-orange`
- The section header shows the total alert count

---

## DONNA summary integration

The `DonnaScreenBriefStatic` sentence is now built from all 7 KPIs (previously only 3). Priority order: attention → onboarding → assessments → reassessment → parent updates → recaps → placements. Shows at most 3 items in the brief sentence, appending "and N more items" for overflow.

`DonnaFirstGreeting.parentUpdatesPending` is now wired to the real `parentUpdatesPendingApproval` count (was hardcoded `0`).

---

## Acceptance checklist

- [ ] Dashboard loads with real KPI counts (no build errors)
- [ ] Empty academy shows all zeros with positive zero-labels
- [ ] Active academy shows non-zero counts matching DB records
- [ ] Each tile navigates to the correct route
- [ ] No broken links (all 7 routes exist in the app)
- [ ] DONNA brief reflects actual data (check with a populated academy)
- [ ] TypeScript: clean (`npx tsc --noEmit`)
- [ ] No fake/placeholder data presented as real

---

## Known limitations

- KPI 3 (Assessments to review) only counts `assessment_studio_draft` and `placement_assessment_draft` proposed_actions. General assessment records in the `assessments` table that have not been surfaced via proposed_actions are not counted.
- KPI 6 (Coach recaps missing) is bounded to completed sessions in the last 30 days. Sessions older than 30 days are not counted.
- KPI 5 (Parent updates pending) and KPI 7 (Placement reviews) may legitimately return 0 if those workflows have not been used in the academy — correct behaviour.
- Routes for KPIs 3, 6, 7 all route to `/director/review?tab=needs-approval`. Future sprint can add tab-specific filtering to land on the correct sub-tab.
