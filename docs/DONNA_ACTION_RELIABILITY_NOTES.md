# DONNA Action Reliability and Approval System Notes

> Mega Sprint 417–426 — DONNA Action Reliability + Approval System V1
> See also: `docs/donna-trust-modes.md`, `docs/ai-action-safety.md`, `docs/audit-log-strategy.md`

---

## What Was Created in Phase 3

Ten new files across `src/lib/donna/` and `src/lib/director/`:

### `src/lib/donna/proposedActionStateMachine.ts` (Sprint 417)

Defines the proposed_action lifecycle as a state machine:
- `PROPOSED_ACTION_STATUSES` — all 8 valid statuses
- `isValidTransition(from, to)` — returns whether a transition is legal
- `getValidNextStates(from)` — valid next states from current state
- `isTerminalState(status)` — returns true for rejected/executed/failed/expired
- `canDirectorApprove(status)`, `canDirectorReject(status)`, `canExecuteAction(status)`
- `isExpiredAction(expiresAt)`, `getExpiryStatus(currentStatus, expiresAt)`

### `src/lib/donna/approvalCenterQueries.ts` (Sprint 418)

Typed query helpers for the approval center:
- `fetchPendingActions(db, academyId, filters?)` — pending_review queue
- `fetchActionById(db, academyId, actionId)` — single action fetch
- `fetchRecentlyResolvedActions(db, academyId, limitDays?)` — audit history
- `fetchPendingActionCount(db, academyId)` — director badge count
- `filterExpiredActions(actions)` — find stale entries for cleanup

### `src/lib/donna/donnaInputValidator.ts` (Sprint 419)

Validates all inputs before they enter the pipeline:
- `validateCreateProposedActionInput(input)` — proposed_action creation
- `validateApproveActionInput(input)` — approval with state check
- `validateRejectActionInput(input)` — rejection with reason required
- `validateRequestClarificationInput(input)` — clarification request
- `validateVoiceCommandInput(input)` — voice transcript validation

### `src/lib/donna/actionExecutionGuards.ts` (Sprint 420)

5-layer execution guard chain:
1. Kill switch check
2. Status must be 'approved'
3. Action must not be expired
4. Academy scope match
5. Role must be director (or head_coach for low-risk)
- `runExecutionGuards(action, ctx)` — returns pass/fail with reason
- `isRegisteredActionType(actionType)` — defense-in-depth action type check
- `getRegisteredActionTypes()` — list of all registered types

### `src/lib/donna/donnaAuditHelpers.ts` (Sprint 421)

Typed audit log wrappers for the proposed_action lifecycle:
- `logProposedActionCreated()` — fires on action creation
- `logActionApproved()` — fires on director approval
- `logActionRejected()` — fires on director rejection
- `logActionExecuted()` — fires on execute_approved_action() success
- `logActionExecutionFailed()` — fires on execute_approved_action() failure
- `logClarificationRequested()` — fires on clarification request

### `src/lib/director/directorDashboardQueries.ts` (Sprint 422)

Director dashboard data helpers (no select('*')):
- `fetchDirectorActionCount(db, academyId)` — pending + clarification counts
- `fetchTodaySessionCoverage(db, academyId)` — wrap-up coverage summary
- `fetchPlayerRosterSummary(db, academyId)` — active/inactive counts
- `fetchHighRiskPendingActions(db, academyId, limit?)` — high-risk queue for badge

### `src/lib/donna/donnaTrustBoundaryValidator.ts` (Sprint 423)

7-layer trust boundary check before any DONNA action:
1. Feature enabled
2. Kill switch
3. Role mapping to DONNA role
4. Action classification
5. Future capability gate
- `validateDonnaTrustBoundary(ctx)` — full check
- `canDonnaPerformSafeRead(ctx)` — lightweight read-only check

### `src/lib/donna/approvalContextBuilder.ts` (Sprint 424)

Builds director review packages from raw proposed_action rows:
- `buildDirectorReviewPackage(action)` — structured review UI data
- `buildDirectorReviewQueue(actions)` — sorted by risk, then age
- `buildActionSummaryLine(action)` — one-line notification string
- Action-type-specific review hints for 5 common action types

### `src/lib/donna/donnaGateway.ts` (Sprint 425)

Single entry-point for all DONNA server actions:
- `checkDonnaGateway(action, ctx)` — applies feature flag → kill switch → rate limit
- Returns `{ allowed, blockedReason, blockedLayer }` — callers must check before proceeding
- Logs usage events (including blocked events) for metering
- Supports 7 DONNA action types

### `src/lib/donna/donnaHealthStatus.ts` (Sprint 426)

DONNA pipeline health reporter:
- `getDonnaHealthStatus()` — snapshot of all 6 subsystems
- Returns: overall status, per-subsystem status + detail, registered action types, rate limit policies
- Used by `/dev/diagnostics` and future health API

---

## Wiring Required

The Phase 3 helpers are defined but not yet called from server actions. Priority wiring targets:

| Server Action | Helper to Wire |
|---|---|
| Any DONNA AI call | `checkDonnaGateway()` at top of function |
| `saveWrapUpDraftAction.ts` | `checkDonnaGateway('wrap_up_draft', ...)` |
| `structureCoachRecapAction.ts` | `checkDonnaGateway('voice_structuring', ...)` |
| transcribe route | `checkDonnaGateway('voice_transcription', ...)` |
| Approval server action | `runExecutionGuards()` + `validateApproveActionInput()` + `logActionApproved()` |
| Rejection server action | `validateRejectActionInput()` + `logActionRejected()` |
| execute_approved_action caller | `runExecutionGuards()` + `logActionExecuted()` / `logActionExecutionFailed()` |

Wiring is deferred to Phase 4 (Director OS sprint) where each action is touched for the director dashboard integration.

---

## Trust Stack Alignment

All Phase 3 helpers are Trust Stack Layer 1–4 implementations:
- Layer 1 (AI Proposes): `donnaInputValidator.ts` validates proposal inputs
- Layer 2 (Human Approves): `approvalCenterQueries.ts`, `approvalContextBuilder.ts`
- Layer 3 (System Applies): `actionExecutionGuards.ts`, `donnaGateway.ts`
- Layer 4 (Audit Records): `donnaAuditHelpers.ts`
