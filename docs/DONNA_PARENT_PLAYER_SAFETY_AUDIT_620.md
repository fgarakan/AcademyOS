# Sprint 620 — DONNA Parent/Player Safety Audit

**Date:** 2026-05-22
**Sprint:** 620
**Parent/Player Safety Score: 8 / 10**

---

## Audit Summary

DONNA's parent/player safety architecture is the strongest part of the system. Multiple independent enforcement layers exist at the library level. The primary gap is the absence of a formal end-to-end test suite that validates these boundaries at runtime — the enforcement is structural but not tested in an automated scenario.

---

## Safety Enforcement Layers

| Layer | File | Status |
|---|---|---|
| Parent-safe text sanitization | `sanitizeParentFacingText()` (referenced in registry) | Enforced — called in parent summary draft paths |
| Observation visibility guardrails | `observationVisibilityGuardrails.ts` | Exists |
| Trust boundary validator | `donnaTrustBoundaryValidator.ts` | Exists |
| Boundary refusal responses | `donnaBoundaryResponses.ts` | Exists — consistent refusal language |
| Parent draft approval state | `parentDraftApprovalState.ts` | Exists |
| Parent trust loader | `parentTrustLoader.ts` | Exists |
| Role boundaries | `donnaRoleBoundaries.ts` | Enforced — director/coach separation |
| Role blocks | `donnaRoleBlocks.ts` | Exists |
| Registry-level blocks | `block_unsafe_parent_visibility_request` action | Implemented and wired |
| Architecture-level blocks | `auto_level_move_without_approval` action | Marked unsafe_to_automate |
| RLS | All tables have RLS with academy_id scoping | Enforced at DB level |
| `finalize_player_placement()` | Only function that activates a player | Enforced — no bypass path |
| `execute_approved_action()` | Only function that executes approved voice actions | Enforced |
| `audit_logs` | All major mutations write audit log entries | Enforced on approval-required paths |

---

## Question-by-Question Safety Audit

### Can DONNA accidentally expose raw coach notes to parents?

**Verdict: No — blocked at multiple levels.**

1. `draft_parent_summary` explicitly requires `parentPlayerVisibilityRisk: true` in the registry, triggering extra review requirements.
2. `draftSummaryUpdateAction.ts` calls `sanitizeParentFacingText()` before writing the draft.
3. Parent portal (`/parent`) has no DONNA integration — parents cannot ask DONNA questions.
4. `block_unsafe_parent_visibility_request` is `implemented_and_wired` — any request to "show parents the coach notes" is refused with a redirect to the safe path.
5. `observationVisibilityGuardrails.ts` enforces observation boundaries.

**Remaining gap:** No automated test validates that a parent-summary draft never contains coach observation text. This is a test-suite gap, not an architectural gap.

---

### Can DONNA expose sibling data to a parent with multiple children?

**Verdict: No — fixed in Sprint 619.**

Sprint 619 added server-side validation via `validateChildBelongsToGuardian()` before any child-specific data is loaded in the parent portal. The `?childId` URL parameter is validated against the guardian's verified linked list on every navigation. Lesson request exposure for multi-child parents is suppressed.

**Remaining gap:** Per-child `portal_permissions` do not exist in the schema — all linked children receive the same access level. This is documented as a future migration gap.

---

### Can DONNA expose unapproved assessment details to players or parents?

**Verdict: No.**

Assessment data is director-only in the current portal architecture. The player portal (`/player`) shows curriculum level and active priorities but not raw assessment records. The parent portal shows sanitized development summaries, not assessment records.

DONNA does not surface assessment records to parent or player portals — there is no DONNA integration in those portals.

---

### Can DONNA expose internal director notes to parents or players?

**Verdict: No.**

Director notes (coach observations, internal briefs) are stored in `coach_observations` which is director/coach-scoped via RLS. The parent portal has no access to this table. DONNA's draft_parent_summary path explicitly sanitizes content before creating the proposed_action.

---

### Can DONNA publish parent/player-visible communication without approval?

**Verdict: No.**

The send path for parent communications is not built — `draft_parent_summary` creates a `proposed_actions` row only. There is no mechanism to deliver communication to parents without:
1. Director approval in `/director/review`
2. An explicit send action (not yet built)

DONNA cannot complete a parent communication delivery even if it tried.

---

### Can DONNA confuse child context in the parent portal?

**Verdict: No — architecture enforced.**

The parent portal reads `?childId` from URL, validates server-side via `validateChildBelongsToGuardian()`, and loads data only for the validated `activeChildId`. There is no client-side child state that DONNA could corrupt.

**Remaining gap:** DONNA is not integrated into the parent portal at all — this risk is therefore moot today. Future DONNA integration in the parent portal will need to inherit the child-scoping pattern from Sprint 619.

---

### Can DONNA confuse academy tenant context?

**Verdict: No — enforced at DB layer.**

All queries in DONNA server actions include `.eq('academy_id', academyId)` where `academyId` is loaded from the authenticated user's `profiles.academy_id`. RLS provides a second enforcement layer. `checkDonnaGateway()` requires `academyId` as a required context field.

Cross-academy queries are structurally impossible — no query path accepts an arbitrary `academy_id` from user input.

---

### Can DONNA answer parent questions beyond approved boundaries?

**Verdict: No risk today — parent portal has no DONNA integration.**

The parent portal (`/parent/*`) has no DONNA shell, no intent classifier, and no AI integration. Parents cannot ask DONNA questions.

**Future risk:** When DONNA is extended to the parent portal (a future sprint), it must:
1. Restrict to parent-safe KPIs only (no raw observations, no internal notes)
2. Scope to the validated active child only
3. Never answer questions about other children, coaches, or the academy beyond approved summaries
4. Pass all draft outputs through the director approval gate before sending

This should be audited again when parent DONNA is scoped.

---

## Parent/Player Visibility Risk Register

| Action | parentPlayerVisibilityRisk | Additional safety controls |
|---|---|---|
| draft_parent_summary | Yes | sanitizeParentFacingText, director approval required, no send path |
| propose_video_visibility_change | Yes | Registry_only — no backend |
| override_global_knowledge_visibility | Yes | blocked_by_permissions |
| block_unsafe_parent_visibility_request | Yes (blocks this risk) | implemented_and_wired refusal |
| draft_player_summary | No | Director-only draft; not player-visible until explicitly shared |
| All other 33 actions | No | Standard director-only scope |

---

## Open Safety Risks

| Risk | Severity | Mitigation |
|---|---|---|
| No formal end-to-end test suite for parent note exposure | Medium | Manual review of sanitizeParentFacingText call sites; add automated tests |
| Parent portal has no child-context validation for future DONNA integration | Medium | Sprint 619 pattern must be extended when parent DONNA is scoped |
| Fitness template session generation bypasses review queue | Medium | P1 fix needed (see review/approval audit) |
| Per-child portal_permissions not in schema | Low | Future migration gap — documented in Sprint 619 |
| execute_approved_action() covers 11/15 types — 4 unenforced | Low | Gap types have no backend at all; cannot be executed even accidentally |

---

## Recommended Safety Actions Before Pilot

| Action | Priority |
|---|---|
| Add automated test: draft_parent_summary output never contains raw coach observation text | P0 |
| Add automated test: validateChildBelongsToGuardian() rejects unlinked childId | P0 |
| Fix fitness template approval bypass before pilot users can use it | P1 |
| Document the DONNA integration safety rules for the parent portal in LOCKED_MODULES | P1 |
| Add proposed_actions.donna_rationale column (migration) to make review rationale auditable | P2 |
