# DONNA Approval Gate Full Wiring QA
**Sprint:** 917 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Gate Pre-Flight Checks on Apply Paths

| Path | Category | Current Level Passed | Gate Result | Safe? |
|---|---|---|---|---|
| `applyApprovedCurriculumAdjustmentAction` | `curriculum_edit` | `director_approval` | `allowed: true` (review_queue ≤ director_approval) | ✅ |
| `applyApprovedLevelMovementAction` | `level_movement` | `director_approval` | `allowed: true` (director_approval ≤ director_approval) | ✅ |

Both gates pass because:
- `curriculum_edit` requires `review_queue` (index 2); `director_approval` is index 3 → satisfied.
- `level_movement` requires `director_approval` (index 3); `director_approval` is index 3 → satisfied.

If a misconfiguration ever causes the gate to return `allowed: false`, the actions return a safe error response immediately.

---

## 2. Intent Router Gate Fields

| Intent | Gate Category | Required Level | High Risk | Can Propose |
|---|---|---|---|---|
| `curriculum_draft_create` | `curriculum_draft_create` | `review_queue` | No | Yes |
| `curriculum_draft_follow_up` | `curriculum_draft_create` | `review_queue` | No | Yes |
| `parent_draft` | `parent_communication` | `director_approval` | Yes | No |
| `level_readiness` | `level_movement` | `director_approval` | Yes | No |
| `attendance` | `attendance_exception` | `review_queue` | No | Yes |
| All read-only intents | null | — | — | — |

---

## 3. Write Path Registry Coverage

| Metric | Value |
|---|---|
| Total paths registered | 10 |
| Gate explicitly wired (`gateWired: true`) | 2 |
| State machine compliant | 5 |
| Logging only (no gate needed) | 4 |
| Uncovered high-risk paths | 0 |

All high-risk apply paths (curriculum, level movement) now have explicit gate wiring.
All draft-creation paths route to `proposed_actions` with `status=pending_review`.

---

## 4. Safety Regression Checks

| Check | Result |
|---|---|
| Sprint 904 approve/reject paths modified? | No |
| proposed_actions state machine behavior changed? | No |
| curriculum draft pending_review behavior changed? | No |
| DonnaVoiceReadyShell God Mode changed? | No |
| donnaChatSessionMemory fallback changed? | No |
| Any new mutations added? | No |
| Parent/player communication safety changed? | No |

---

## 5. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 6. Files Changed

**Created:**
- `src/lib/donna/donnaWritePathRegistry.ts`

**Modified:**
- `src/lib/donna/donnaIntentRouterV1.ts` — added `approvalGateCategory` + `gateRequirement` fields
- `src/app/director/_actions/donnaCurriculumAdjustmentApplyActions.ts` — gate pre-flight added
- `src/app/director/_actions/donnaLevelMovementActions.ts` — gate pre-flight added
