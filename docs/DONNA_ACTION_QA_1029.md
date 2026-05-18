# DONNA Action QA
Sprint 1029 — 2026-05-18

## Scope

QA audit for Sprint 1020-1028 action system infrastructure.

---

## File Inventory

| File | Sprint | Type | DB Writes | Role Gated | Auto-Execute | requiresApproval |
|---|---|---|---|---|---|---|
| `src/lib/donna/donnaActionTypes.ts` | 1020 | Pure types + registry | None | Yes (classifyAction) | N/A | N/A |
| `src/lib/donna/donnaSafeReadActions.ts` | 1021 | Pure answer builders | None | Yes (dispatchSafeReadAction) | N/A | N/A |
| `src/lib/donna/donnaDraftOnlyActions.ts` | 1022 | Payload builders | None | Yes (isDraftActionAllowedForRole) | false | true |
| `src/lib/donna/donnaApprovalActions.ts` | 1023 | Payload builders | None | Yes (allowed for director only) | false | true |
| `src/lib/donna/donnaRoleBlocks.ts` | 1024 | Block registry | None | Yes (isActionBlockedForRole) | N/A | N/A |
| `src/components/donna/DirectorApprovalActionFlow.tsx` | 1025 | UI component | None (callbacks only) | Director-facing | false | true |
| `src/components/donna/CoachSubmitForReviewFlow.tsx` | 1026 | UI component | None (callbacks only) | Coach-facing | false | true |
| `src/components/donna/DonnaActionPreviewCard.tsx` | 1027 | Display only | None | N/A | N/A | N/A |
| `src/lib/donna/donnaAuditTrail.ts` | 1028 | Payload builders | None | N/A | N/A | N/A |

---

## Safety Checks

### No DB writes
Pass — grep for `.insert`, `.update`, `.delete`, `.upsert` across all 9 files returned no results.

### Auto-execute guard
Pass — all approval payloads have `autoExecute: false` (literal type). All draft payloads have `requiresDirectorReview: true` (literal type). TypeScript enforces these as non-optional.

### Role boundaries
Pass:
- `donnaActionTypes.ts`: `classifyAction()` returns `blocked_for_role` with reason if role not in allowedRoles
- `donnaSafeReadActions.ts`: `dispatchSafeReadAction()` checks role before dispatching
- `donnaDraftOnlyActions.ts`: `isDraftActionAllowedForRole()` gates per role
- `donnaRoleBlocks.ts`: `isActionBlockedForRole()` returns true for known blocked role pairs
- `DirectorApprovalActionFlow`: director-only component (no role check at component level — caller must gate)
- `CoachSubmitForReviewFlow`: coach-only component (same caveat)

### TypeScript
Pass — `npx tsc --noEmit` clean across all 9 files.

### No migrations
Pass — no migration files created or modified in Sprints 1020-1028.

---

## Operating Model Compliance

| Principle | Verified |
|---|---|
| AI proposes → Director approves → System records → System executes | Yes — all approval payloads set `requiresDirectorApproval: true, autoExecute: false` |
| All mutations via proposed_actions or audit_logs | Yes — draft/approval builders target proposed_actions. donnaAuditTrail provides audit_logs entries |
| No parent send | Yes — parent message payload includes `send_not_built: true` note |
| No automatic level movement | Yes — level movement builder has safetyNote + requiresDirectorApproval |
| No roster mutation without approval | Yes — roster change builder requires approval and blocks coaches |
| Coach role restrictions enforced | Yes — donnaRoleBlocks and classifyAction both handle coach-restricted actions |

---

## Integration Readiness for Phase 4 (Sprints 1030-1037)

| Output | Phase 4 Consumer |
|---|---|
| `DONNA_ACTIONS` registry + `classifyAction` | Sprint 1030 chat thread UI — determines what actions are available to show |
| `donnaSafeReadActions.dispatchSafeReadAction` | Sprint 1030 chat response generation |
| `donnaDraftOnlyActions.buildObservationDraftPayload` | Sprint 1031 suggested follow-ups |
| `donnaRoleBlocks.buildBlockedActionResponse` | Sprint 1033 ask-anything boundary responses |
| `DonnaActionPreviewCard` | Sprint 1035 voice-ready interaction shell |
| `donnaAuditTrail` builders | Sprint 1036 cross-portal QA |
| `DirectorApprovalActionFlow` + `CoachSubmitForReviewFlow` | Sprint 1036 director/coach cross-portal QA |

---

## Known Limitations Carried Forward

| Limitation | File | Risk |
|---|---|---|
| DirectorApprovalActionFlow has no server-side role check | DirectorApprovalActionFlow.tsx | Medium — caller must gate; component accepts any onApprove/onReject callback |
| Parent send flow not built | donnaApprovalActions.ts | Noted in payload (send_not_built: true) — safe to land |
| Audit entry writer not built | donnaAuditTrail.ts | All audit builders produce valid payloads but no server action to write them yet |
| Curriculum gate evidence link | donnaActionTypes.ts (link_curriculum_evidence action) | Marked as requires_approval + temporary block |

---

## Status

Phase 3 (Sprints 1020-1029) complete. All files TypeScript-clean. No DB writes. No auto-execute. All review-first principles maintained.
