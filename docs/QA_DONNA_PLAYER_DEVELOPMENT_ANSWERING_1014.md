# QA Checklist — DONNA Player Development Question Answering (Sprint 1014)

**Date:** 2026-05-31
**Sprint:** 1014

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `playerDevelopmentAnswering.ts` imports compile: `PlayerProfileSummary` from `./playerProfileRetrieval`
- [ ] `toolResultInterpreter.ts` new import resolves: `buildPlayerProfileAnswer`
- [ ] Inline type import `import('./playerProfileRetrieval').PlayerProfileSummary` resolves cleanly
- [ ] No new `as any` introduced

---

## `buildPlayerProfileAnswer` unit checklist

- [ ] `currentLevelLabel: 'Orange 2'` → opens with "This player is at level Orange 2."
- [ ] `currentLevelLabel: null` → opens with "does not have a curriculum level assigned"
- [ ] `currentLevelLabel: null` → `highlightTargetId === 'player-skill-path'`
- [ ] `assessmentOverdue: true` → includes "assessment is overdue" in signals
- [ ] `assessmentOverdue: true` → `primaryActionLabel === 'Schedule assessment'`
- [ ] `assessmentOverdue: true` → `highlightTargetId === 'player-assessment-tab'`
- [ ] `advancementEligible: true` → includes "advancement-eligible" in signals
- [ ] `advancementEligible: true` AND `assessmentOverdue: false` → `primaryActionLabel === 'Review advancement eligibility'`
- [ ] `playerStatus: 'pending_placement'` → "pending curriculum placement" in signals
- [ ] `playerStatus: 'active'` → status NOT mentioned (no noise for normal case)
- [ ] `activePriorityCount: 0` → "No active development priorities are set"
- [ ] `activePriorityCount: 2` → "2 active development priorities are set"
- [ ] `recentSessionCount: 0` → "No sessions recorded in the last 30 days"
- [ ] `recentSessionCount: 4` → "4 sessions recorded in the last 30 days"
- [ ] `evidenceCount: 3` → "3 development evidence records on file"
- [ ] `evidenceCount: 0` → no evidence mention
- [ ] `donnaText` always ends with "read-only summary. Nothing about this player changes until you take an explicit action."
- [ ] Never throws for any combination of field values
- [ ] No player names in output

---

## Interpreter update checklist

- [ ] `interpretPlayerProfileSummary` calls `buildPlayerProfileAnswer` on `result.data` when `result.ok`
- [ ] `interpretPlayerProfileSummary` error path has clearer message (no raw summary dump)
- [ ] `interpretAcademyState` (Sprint 1013) NOT changed
- [ ] `interpretPlayerDevelopmentSummary` (Sprint 1013) NOT changed
- [ ] `interpretSessionContext` (Sprint 1004) NOT changed
- [ ] All other 8 interpreters unchanged

---

## Safety checklist

- [ ] No player names in answer text
- [ ] No coach notes or observation text in answer
- [ ] No assessment scores in answer
- [ ] No behavioral flags in answer
- [ ] `requiresConfirmation: false` on all player profile results
- [ ] Safety note always present in `donnaText`
- [ ] `suggestedRoute: undefined` (player profile is already open — no navigation needed)

---

## Sprint 1003 regression checklist

- [ ] `playerProfileRetrieval.ts` NOT changed
- [ ] `liveContextToolExecutor.ts` NOT changed
- [ ] `playerDevelopmentRetrieval.ts` NOT changed
- [ ] `academyStateRetrieval.ts` NOT changed
- [ ] `academyIntelligenceAnswering.ts` (Sprint 1013) NOT changed
