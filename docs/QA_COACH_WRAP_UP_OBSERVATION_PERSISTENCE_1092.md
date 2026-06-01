# QA — Sprint 1092: Coach Wrap-Up Observation Persistence to Player Profile V1

**Date:** 2026-06-01
**Sprint:** 1092

---

## Test 1 — Compile

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `npx tsc --noEmit` | Zero new errors | |
| 1.2 | `CoachObservationDraftPayload` import resolves | No type error | |
| 1.3 | `ApplyWrapUpDraftResult.observationsCreated` is `number \| undefined` | Present | |

---

## Test 2 — Observation persistence (happy path)

Setup: Session S1 has been wrapped up. Coach submitted 2 player observations (P1 positive, P2 needs_attention). Both are `pending_review` proposed_actions with `target_module = 'coach_observation_draft_v1'` and `proposed_payload.session_id = S1`.

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2.1 | Director approves session wrap-up S1 | `session_wrap_up_v1` status → `approved` | |
| 2.2 | Director clicks Apply on session wrap-up S1 | `applyWrapUpDraftAction(proposedActionId)` called | |
| 2.3 | `sessions.session_notes` updated | Text summary written (unchanged behavior) | |
| 2.4 | `sessions.status` advanced to `completed` | `completed` | |
| 2.5 | Coach observation draft for P1 found and applied | `coach_observations` row created for P1 | |
| 2.6 | Coach observation draft for P2 found and applied | `coach_observations` row created for P2 | |
| 2.7 | Observation draft for P1 status → `executed` | `proposed_actions.status = 'executed'` | |
| 2.8 | Observation draft for P2 status → `executed` | `proposed_actions.status = 'executed'` | |
| 2.9 | `result.observationsCreated === 2` | Matches count of observations written | |
| 2.10 | `result.ok === true` | Success | |

---

## Test 3 — Player profile shows observations

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3.1 | Director navigates to P1's player profile | `/director/players/{P1_id}` loads | |
| 3.2 | Notes tab shows new observation from S1 | Observation text visible with `observation_type: positive` | |
| 3.3 | Notes tab shows coach name from S1 | Coach display_name visible | |
| 3.4 | Notes tab shows session linkage | Session name visible | |
| 3.5 | `is_private: true` on the observation | Observation NOT visible on parent portal | |
| 3.6 | `is_private: true` on the observation | Observation NOT visible on player portal | |

---

## Test 4 — Idempotency

| # | Scenario | Expected | Pass? |
|---|---|---|---|
| 4.1 | Director tries to apply same wrap-up twice | Second call fails: "Only approved drafts can be applied." (status = executed) | |
| 4.2 | No duplicate `coach_observations` rows created | Only original rows present | |
| 4.3 | Observation draft already `executed` before wrap-up apply | Loop skips it (`status` filter excludes `executed`) | |

---

## Test 5 — Only session-linked observations are processed

| # | Scenario | Expected | Pass? |
|---|---|---|---|
| 5.1 | Session S2 has pending observation drafts | Applying S1 wrap-up does NOT touch S2 observation drafts | |
| 5.2 | Observation draft with `session_id = S2` in payload | Filtered out in-code (payload.session_id !== S1) | |
| 5.3 | Observation draft with no `player_id` | Skipped (guard: `if (!p?.player_id || !p?.note) continue`) | |

---

## Test 6 — Individual observation approval path still works

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | `WrapUpObservationDraftCard` still visible in review queue for `pending_review` drafts | Yes — unaffected | |
| 6.2 | Director can approve individual observation draft | Status → `approved` | |
| 6.3 | Director can apply individual observation draft | `applyApprovedObservationDraftAction` runs, writes to `coach_observations` | |
| 6.4 | No conflict with Sprint 1092 if both paths used | Second path detects `executed` status and skips | |

---

## Test 7 — Best-effort behavior

| # | Scenario | Expected | Pass? |
|---|---|---|---|
| 7.1 | `coach_observations` insert fails for P1 | P1 skipped; P2 still processed; `result.ok === true` | |
| 7.2 | No observation drafts found for session | `observationsCreated === 0`; `result.ok === true` | |
| 7.3 | Outer try/catch catches unexpected error | `observationsCreated === 0`; `result.ok === true` (session_notes already written) | |

---

## Test 8 — Safety invariants

| # | Check | Expected | Pass? |
|---|---|---|---|
| 8.1 | No parent messages sent | Zero parent communications created | |
| 8.2 | No player levels changed | `players` table untouched | |
| 8.3 | No curriculum mutations | `curriculum_*` tables untouched | |
| 8.4 | `is_private: true` on all new `coach_observations` rows | Always enforced | |
| 8.5 | `academyId` always from server-side auth | Never trusted from client | |
| 8.6 | Only `pending_review` and `approved` drafts processed | `status in ['pending_review', 'approved']` filter active | |

---

## Test 9 — Regression checks

| # | Check | Expected | Pass? |
|---|---|---|---|
| 9.1 | Session wrap-up apply still writes `session_notes` | Unchanged | |
| 9.2 | Session status advances to `completed` | Unchanged | |
| 9.3 | Audit log entry still written | Unchanged | |
| 9.4 | `revalidatePath('/director/review')` still called | Unchanged | |
| 9.5 | `revalidatePath('/director/sessions/${sessionId}')` still called | Unchanged | |
| 9.6 | Preview mode guard still active | `assertNotPreviewMode()` still called | |
| 9.7 | Director/head_coach role check still active | Role guard unchanged | |
| 9.8 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] Applying a session wrap-up writes `session_notes` (unchanged)
- [ ] Linked player observation drafts for that session are applied to `coach_observations`
- [ ] Player profile Notes tab shows new observations without extra director action
- [ ] `observationsCreated` count returned in result
- [ ] Already-applied observation drafts are not duplicated
- [ ] Observation drafts from other sessions are untouched
- [ ] Individual observation approval path still works
- [ ] No parent messages, no level changes, no curriculum mutations
- [ ] TypeScript passes
