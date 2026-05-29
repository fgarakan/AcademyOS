# DONNA Approval Gate Full Wiring — Architecture
**Sprint:** 917 | **Date:** 2026-05-29

---

## 1. What Changed

### 1.1 Gate Pre-Flights on High-Risk Apply Paths

Two apply actions now call `assertDonnaApprovalAllowed` as their first pre-flight check:

**`donnaCurriculumAdjustmentApplyActions.ts`:**
```ts
assertDonnaApprovalAllowed('curriculum_edit', 'director_approval')
// Returns allowed: true (director_approval satisfies review_queue requirement)
// Belt-and-suspenders: if gate misconfigured, returns safe error before any DB write
```

**`donnaLevelMovementActions.ts`:**
```ts
assertDonnaApprovalAllowed('level_movement', 'director_approval')
// Returns allowed: true (director_approval satisfies director_approval requirement)
// Belt-and-suspenders: blocks any path that didn't pass through full approval
```

### 1.2 Intent Router Approval Gate Fields

`DonnaIntentRouteResult` now includes:
- `approvalGateCategory: string | null` — the approval gate action category for this intent
- `gateRequirement: { requiredLevel, isHighRisk, canBeProposed, approvalRoute } | null`

Callers (God Mode shell, event ledger) can now read the gate requirement from the route result without needing to import `donnaApprovalGate` separately.

### 1.3 Write Path Registry

`donnaWritePathRegistry.ts` is the canonical documentation of all DONNA write paths:
- 10 paths registered
- 2 explicitly gate-wired (Sprint 917)
- 5 state-machine compliant
- 4 logging-only (no gate required)
- `getWritePathCompliance()` returns summary counts

---

## 2. Compliance Architecture

```
Director intent (DONNA chat)
  → routeDonnaIntentV1() → DonnaIntentRouteResult + gateRequirement
  → 34-interceptor God Mode pipeline (existing)
  → High-risk intent → creates proposed_actions (pending_review)

Director clicks "Apply" (Review Queue)
  → applyApprovedCurriculumAdjustmentAction()
      ├── isPreviewMode() check
      ├── assertDonnaApprovalAllowed('curriculum_edit', 'director_approval') ← Sprint 917
      ├── getDirectorContext() (auth + membership)
      ├── Fetch proposed_action.status === 'approved' check
      └── Write to academy_curriculum_overrides + audit_logs

  → applyApprovedLevelMovementAction()
      ├── isPreviewMode() check
      ├── assertDonnaApprovalAllowed('level_movement', 'director_approval') ← Sprint 917
      ├── getDirectorContext() (director-only)
      ├── Fetch proposed_action.status === 'approved' check
      └── Write to player_curriculum_states + players + audit_logs
```

---

## 3. Remaining V2 Gaps

1. **Creation paths not explicitly gate-wired** — `donnaAttendanceActions.ts`, `donnaDirectorIntelligenceActions.ts` draft creation paths rely on the proposed_actions state machine. `requireDonnaApproval` wiring on creation paths deferred to Sprint 918+.
2. **parent_communication draft apply path** — no explicit apply action exists yet (parent comms drafts are manually actioned). When built, Sprint 918+ should wire gate.
3. **Template publish apply path** — template publishing goes through director-controlled UI, not a DONNA apply action. Gate wiring deferred.
4. **Academy-wide settings** — no DONNA-initiated path exists. No gate needed yet.

---

## 4. Recommended Sprint 918 Focus

Sprint 918 picks up persistent conversation mode (DONNA stays open across messages/routes).
Sprint 925+ can circle back to wire `requireDonnaApproval` to the remaining creation paths.
