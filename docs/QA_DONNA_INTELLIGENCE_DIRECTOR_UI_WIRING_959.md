# QA — DONNA Intelligence Director UI Wiring V1
**Date:** 2026-05-29
**Sprint:** 959

---

## TypeScript

- [x] `npx tsc --noEmit` passes with no errors
- [x] `DonnaIntelligenceSignalsCard.tsx` compiles cleanly
- [x] Import of `buildProactiveAlerts` and `AlertUrgency` from `@/lib/donna/donnaProactiveAlerts` resolves
- [x] `URGENCY_CHIP` and `URGENCY_LABEL` records cover all 4 `AlertUrgency` values — exhaustive
- [x] Props interface `DonnaIntelligenceSignalsCardProps` is correctly typed
- [x] Modified `src/app/director/donna/page.tsx` compiles cleanly
- [x] Import of `DonnaIntelligenceSignalsCard` from `@/components/donna/DonnaIntelligenceSignalsCard` resolves
- [x] Props passed to `DonnaIntelligenceSignalsCard` (`pendingReviews`, `sessionsWithoutWrapUp`, `isLive`) match the interface

---

## UI visibility

- [x] `DonnaIntelligenceSignalsCard` is rendered in the left column of `/director/donna`
- [x] Card appears after `DONNAAcademyPulseCard` and before the conditional Attention Items section
- [x] Alert list is rendered when `buildProactiveAlerts` returns at least one alert
- [x] Safe empty state is rendered when no alerts are produced
- [x] Each alert shows urgency chip, headline, body, and optional safety note
- [x] Each alert is a link to `alert.actionRoute` (pre-defined director-only route)
- [x] Demo badge is shown in card header when `isLive === false`
- [x] Card is compact — no large layout changes, no broad dashboard redesign

---

## No-mutation checklist

- [x] `DonnaIntelligenceSignalsCard` is a pure Server Component — no useState, no useEffect
- [x] No `supabase.from(...)` calls inside the component
- [x] `buildProactiveAlerts` is a pure function — no DB calls, no side effects
- [x] No `proposed_actions` records created
- [x] No `audit_log` writes
- [x] No player record mutations
- [x] No curriculum record mutations
- [x] No attendance record mutations
- [x] No billing mutations

---

## No-send checklist

- [x] No push notification dispatch
- [x] No email or SMS dispatch
- [x] No background job enqueued
- [x] Alert `actionRoute` values are plain navigation href strings — not server action triggers
- [x] `safetyNote` text is display-only copy from `getSafetyMessage()` — not a dispatch trigger

---

## Parent/player safety checklist

- [x] No parent-facing content created or dispatched
- [x] No player-facing content created or dispatched
- [x] `parent_summary_ready` alert does NOT fire (parentSummariesReady omitted → defaults to 0)
- [x] No parent portal or player portal routes linked from alert cards
- [x] All `actionRoute` values are director-only: `/director/review`, `/director/sessions`
- [x] No player names, parent names, or guardian details surfaced in alert text
- [x] No raw IDs, raw JSON, or sensitive fields in any rendered output

---

## Highlight target checklist

- [x] `data-donna-focus-id="donna-intelligence-signals"` is on the card wrapper div
- [x] DONNA what-next engine can reference this target ID for highlight
- [x] Target ID matches the pattern established by existing `data-donna-focus-id` attributes in the codebase

---

## Data accuracy checklist

- [x] `pendingReviews` passed from `ctx.pendingReviews` — live DB value when isLive, demo value otherwise
- [x] `sessionsWithoutWrapUp` passed from `ctx.missingWrapUps` — live DB value when isLive, demo value otherwise
- [x] `reviewOldestDaysAgo` is NOT passed — `review_aging` alert correctly does NOT fire
- [x] `parentSummariesReady` is NOT passed — `parent_summary_ready` alert correctly does NOT fire
- [x] No fake data introduced for any field
- [x] Empty state shown truthfully when no alerts fire

---

## Protected systems checklist

- [x] Sprint 904 approve/reject paths: untouched — no proposed_actions interaction
- [x] `proposed_actions` state machine: untouched — no reads or writes
- [x] DONNA God Mode context/highlight/action systems: untouched — card adds a highlight target, does not modify existing targets
- [x] DONNA what-next engine: untouched
- [x] DONNA director brief: untouched
- [x] DONNA safe action router: untouched
- [x] Recommendation Feedback Learning (Sprint 956): untouched
- [x] DONNA Evaluation Harness (Sprint 957): untouched
- [x] Coach wrap-up loop (Sprints 926–936): untouched
- [x] Director dashboard (`/director/page.tsx`): untouched — not in sprint scope
- [x] Player level movement safety: untouched
- [x] Roster/placement/billing/attendance/curriculum mutation: none
- [x] RLS/multi-tenant boundaries: not applicable — component makes no DB calls; all data comes from caller-supplied props

---

## V2 intelligence modules (not wired in Sprint 959)

- [x] `donnaBottleneckDetection.ts` (Sprint 952) — not staged, not committed in this sprint
- [x] `donnaCoachIntelligence.ts` (Sprint 953) — not staged, not committed in this sprint
- [x] `donnaCurriculumIntelligence.ts` (Sprint 954) — not staged, not committed in this sprint
- [x] `donnaParentCommunicationIntelligence.ts` (Sprint 955) — not staged, not committed in this sprint
- [x] `donnaRecommendationLearning.ts` (Sprint 956) — not staged, not committed in this sprint
- [x] Architecture doc explains why each module is V2 and what data feed is needed to wire it
