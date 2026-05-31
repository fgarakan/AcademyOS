# QA Checklist — DONNA Academy Intelligence Answering (Sprint 1013)

**Date:** 2026-05-31
**Sprint:** 1013

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `academyIntelligenceAnswering.ts` imports compile: `AcademyStateSummary` from `./types`, `PlayerDevelopmentSummary` from `./playerDevelopmentRetrieval`
- [ ] `toolResultInterpreter.ts` new imports resolve: `buildAcademyStateAnswer`, `buildPlayerDevelopmentAnswer`
- [ ] `AcademyStateSummary` type cast (`result.data as AcademyStateSummary`) compiles cleanly
- [ ] `PlayerDevelopmentSummary` type cast (`result.data as PlayerDevelopmentSummary`) compiles cleanly
- [ ] No new `as any` introduced
- [ ] `AcademyIntelligenceAnswer` return type matches `ToolInterpretation` field types

---

## `buildAcademyStateAnswer` unit checklist

- [ ] `academyHealthSignal: 'on_track'` → headline "Your academy is on track."
- [ ] `academyHealthSignal: 'attention_needed'` → headline "A few things need your attention."
- [ ] `academyHealthSignal: 'critical'` → headline includes "critical"
- [ ] `academyHealthSignal: 'unknown'` → headline includes "not fully available"
- [ ] `pendingReviewCount: 0` → no review queue mention in donnaText
- [ ] `pendingReviewCount: 1` → singular "1 item is waiting"
- [ ] `pendingReviewCount: 3` → plural "3 items are waiting"
- [ ] `pendingReviewCount > 0` → `suggestedRoute === '/director/review'`
- [ ] `pendingReviewCount > 0` → `highlightTargetId === 'review-queue-primary'`
- [ ] `pendingReviewCount > 0` → `primaryActionLabel` contains review queue text
- [ ] `hasMissingRecaps: true` → "missing coach wrap-ups" in signals
- [ ] `hasPlayersNeedingPlacement: true` → "waiting for a curriculum placement decision"
- [ ] `hasAdvancementEligiblePlayers: true` → "advancement-eligible" in signals
- [ ] `todaySessionCount: 2` → "2 sessions are scheduled for today" in signals
- [ ] All signals = none → "No immediate action required" appears
- [ ] `activePlayers: 24` → "Active players: 24" in text
- [ ] `donnaText` ends with live-data provenance note ("retrieved live from your academy database")
- [ ] Never throws for any combination of field values

---

## `buildPlayerDevelopmentAnswer` unit checklist

- [ ] `playersNeedingPlacement: 0` → no placement mention
- [ ] `playersNeedingPlacement: 1` → singular "1 player is waiting"
- [ ] `playersNeedingPlacement: 3` → plural "3 players are waiting"
- [ ] `advancementEligibleCount: 2` → "2 players have been flagged as advancement-eligible"
- [ ] `attentionFlags.assessmentOverdue: 1` → "1 player has an overdue assessment"
- [ ] `playersWithoutCurriculumLevel: 5` → "5 players have no curriculum level assigned"
- [ ] `playersNeedingPlacement > 0` → `suggestedRoute === '/director/players'`
- [ ] `advancementEligibleCount > 0` → `suggestedRoute === '/director/players'`
- [ ] All signals = 0 → "signals look healthy" in donnaText
- [ ] `totalActivePlayers: 20, playersWithCurriculumLevel: 15` → "20 active players... 15 of them have a curriculum level assigned"
- [ ] `donnaText` ends with "Nothing changes until you take an explicit action"
- [ ] Never throws for any combination of field values

---

## Interpreter update checklist

- [ ] `interpretAcademyState` calls `buildAcademyStateAnswer(result.data as AcademyStateSummary)` on success
- [ ] `interpretAcademyState` error path: uses clear message, no raw summary string
- [ ] `interpretPlayerDevelopmentSummary` calls `buildPlayerDevelopmentAnswer(result.data as PlayerDevelopmentSummary)` on success
- [ ] `interpretPlayerDevelopmentSummary` error path: uses clear message, no raw summary string
- [ ] `interpretPlayerProfileSummary` (Sprint 1003) is NOT changed
- [ ] `interpretSessionContext` (Sprint 1004) is NOT changed
- [ ] All other interpreters unchanged

---

## Safety checklist

- [ ] No player names in `buildAcademyStateAnswer` output
- [ ] No player names in `buildPlayerDevelopmentAnswer` output
- [ ] No coach notes referenced
- [ ] No raw IDs in output text
- [ ] Pending review highlight routes to `/director/review` only
- [ ] No auto-approval triggered
- [ ] `requiresConfirmation: false` on all academy state / player development results
- [ ] "Nothing changes until you take an explicit action" appears in player development answers

---

## Sprint 1002 regression checklist

- [ ] `toolResultInterpreter.ts` still exports `interpretToolResult`
- [ ] `INTERPRETERS` map still has all 12 tools
- [ ] `interpretPendingReviewCount` unchanged
- [ ] `interpretNextActionRecommendation` unchanged
- [ ] `interpretReviewQueueGuidance` unchanged
- [ ] `interpretPlayerProfileSummary` (Sprint 1003) unchanged
- [ ] `interpretSessionContext` (Sprint 1004) unchanged
- [ ] `liveContextToolExecutor.ts` NOT changed
- [ ] `academyStateRetrieval.ts` NOT changed
- [ ] `playerDevelopmentRetrieval.ts` NOT changed
