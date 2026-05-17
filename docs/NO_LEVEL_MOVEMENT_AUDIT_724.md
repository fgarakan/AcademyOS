# No Level Movement Audit — Sprint 724

**Date:** 2026-05-17
**Sprint:** 724 — No Level Movement Audit V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: No automated level movement exists in AcademyOS V1.**

No code path promotes or demotes a player's curriculum level without an explicit, deliberate director or head coach action. DONNA, voice intake, and coach wrap-ups can surface readiness signals and flag proposals — but none of them can execute a level change. All automated signals route to the `proposed_actions` pipeline as `pending_review`.

One director-explicit level assignment path exists (`setCurriculumLevelAction`), which is by design and authorized. It is gated by role check, academy membership check, and player ownership check.

---

## 2. Files / Routes Audited

### Player level assignment paths
- `src/app/director/players/[playerId]/setCurriculumLevelAction.ts` — director-explicit level set
- `src/app/director/players/[playerId]/CurriculumLevelPickerCard.tsx` — UI for the above
- `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts` — development summary update (no level change)
- `src/app/director/placement/PlacementEngineClient.tsx` — initial placement UI (calls `finalize_player_placement`)

### DONNA level readiness surfaces
- `src/lib/donna/levelReadinessGuardrails.ts` — guardrail engine, `NEVER_AUTOMATIC` constants
- `src/lib/donna/donnaNBAEngine.ts` — level readiness NBA surface
- `src/lib/donna/reviewQueueCOOSignal.ts` — COO signal for readiness flagging
- `src/app/director/_actions/donnaDirectorIntelligenceActions.ts` — level readiness review actions

### Voice and suggestion surfaces
- `src/lib/voice/structureVoiceIntake.ts` — detects `level_change_requested`, adds to `NEVER_AUTOMATIC`
- `src/lib/voice/voiceIntakeTypes.ts` — `level_change_requested` flag type
- `src/lib/voice/voiceDestinationRouter.ts` — "No player level is changed"
- `src/lib/suggestions/generateAcademySuggestions.ts` — advancement candidate suggestions (director-initiated only)

### Review queue
- `src/app/director/review/page.tsx` — "Player level has NOT been changed — this is a review-only draft"
- `src/app/director/review/VoiceIntakeDraftCard.tsx` — `level_change_requested` flag display only

### KPI and evidence surfaces
- `src/lib/kpi/evidenceCoverageKpiEngine.ts` — readiness detection only, no level change
- `src/lib/kpi/developmentVelocityKpiEngine.ts` — velocity metrics only, no level change
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx` — display only, "no level change happens automatically"
- `src/app/director/players/[playerId]/QuickAssessmentPanel.tsx` — "No level change triggered"

---

## 3. Confirmed No-Automated-Movement Surfaces

### 3.1 NEVER_AUTOMATIC constant

`src/lib/voice/structureVoiceIntake.ts:290`

```ts
const NEVER_AUTOMATIC: string[] = [
  ...
  'No player curriculum level changed — requires director/head coach approval',
  ...
]
```

This constant is injected into every voice intake response under `what_would_not_change`, making it explicit to both the UI and any audit trail that level changes never happen automatically from voice.

### 3.2 levelReadinessGuardrails.ts — protection constants

`src/lib/donna/levelReadinessGuardrails.ts:112`

```ts
export const LEVEL_CHANGE_PROTECTION_COPY = {
  neverAutomatic: 'Level movement is NEVER automatic. A director or head coach must explicitly trigger the placement action.',
  noLevelMovementFromDONNA: 'DONNA can surface readiness signals but cannot trigger level movement.',
  noLevelMovementFromWrapUp: 'Coach wrap-ups can flag level readiness but cannot trigger level movement.',
  ...
}
```

**Verdict: Confirmed. No automated path.**

### 3.3 DONNA level readiness signals

`donnaNBAEngine.ts`, `reviewQueueCOOSignal.ts` — DONNA flags players as potentially ready, surfaces to the review queue as `pending_review`. The `donnaDirectorIntelligenceActions.ts` notes: `'Readiness review only — player level has NOT been changed.'`

**Verdict: Confirmed. Signal only, no execution.**

### 3.4 Voice intake level change flag

`structureVoiceIntake.ts:486` — detects `level_change_requested` flag from voice input. Adds warning: no automatic level change will occur. Routes to proposed_actions as `pending_review`.

**Verdict: Confirmed. Detected and blocked. Draft only.**

### 3.5 Review queue level readiness items

`src/app/director/review/page.tsx:1590` — review queue header for level readiness items: `"Player level has NOT been changed — this is a review-only draft for your decision."`

**Verdict: Confirmed. Review-only, no execution on display.**

### 3.6 QuickAssessmentPanel

`src/app/director/players/[playerId]/QuickAssessmentPanel.tsx` — "Recorded as an ad-hoc assessment. No level change triggered."

**Verdict: Confirmed. Assessment recording only.**

---

## 4. Authorized Director-Explicit Level Assignment

### 4.1 `setCurriculumLevelAction`

`src/app/director/players/[playerId]/setCurriculumLevelAction.ts`

This action is the one legitimate path where a player's `curriculum_level_id` can be changed outside of initial placement. It is:

- Gated by `getSupabaseServer()` (session required)
- Gated by `academy_memberships` role check: only `academy_director` or `head_coach`
- Gated by player academy ownership check
- Triggered only by an explicit director action in the `CurriculumLevelPickerCard` UI

The card copy reads: *"This sets the working curriculum level for coaching context. It does not auto-promote the player, change their group, or send any notifications."*

This calls `assign_player_curriculum_state` RPC — a deliberate level assignment, not triggered by any automated signal.

**Verdict: Authorized by product spec. Director-explicit only. Gated correctly.**

### 4.2 `finalize_player_placement()` RPC

Used in `PlacementEngineClient.tsx` — initial player activation during onboarding placement. This is the only path to activate a new player, per the architecture red lines.

**Verdict: Authorized. Initial placement only.**

---

## 5. Risky Labels Found

None. All level-movement-related UI copy is accurate:
- Review queue: "level has NOT been changed"
- QuickAssessment: "no level change triggered"
- LevelReadinessSummary: "no level change happens automatically"
- DONNA: "DONNA can surface readiness signals but cannot trigger level movement"

---

## 6. Fixes Made

None. No copy fixes or code changes required.

---

## 7. Remaining Blocked / Future Notes

- `assign_player_curriculum_state` RPC exists but is only called by director-explicit UI. If a future sprint adds a DONNA execution path, the RPC must remain gated behind the `proposed_actions` → `execute_approved_action()` chain.
- `execute_approved_action()` is the only authorized path for executing approved level changes proposed through DONNA or voice. This function must validate that the approving user is `academy_director` or `head_coach`.

---

## 8. Final Safety Conclusion

**No automated level movement exists in AcademyOS V1.**

- Voice intake detects and blocks level-change phrases.
- DONNA surfaces readiness signals but cannot execute level changes.
- Coach wrap-ups flag readiness but cannot trigger movement.
- The only level mutation path is an explicit director or head coach action through the Skill Path tab, with three layers of gate checks.

**Sprint 724 production readiness check: PASSED.**
