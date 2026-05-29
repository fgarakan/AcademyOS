# Recommendation Feedback Learning V1
**Date:** 2026-05-29
**Sprint:** 956

---

## Purpose

`donnaRecommendationLearning.ts` defines the learning contract for tracking DONNA recommendation outcomes. It computes weighted scores and adjusted priority weights from a history of feedback events so that future surfacing decisions can favour recommendations that directors act on and de-prioritise ones they consistently dismiss.

This module is a scoring and aggregation layer. It does not read from or write to the database. It does not send communications. It does not execute any automated action. All DB persistence happens through the existing `donnaRecommendationFeedback.ts` infrastructure.

---

## Input model

### `buildRecommendationOutcome`

| Parameter | Type | Description |
|---|---|---|
| `recommendationId` | `string` | Caller-supplied identifier for the specific recommendation instance |
| `recommendationType` | `string` | Category of recommendation (e.g. `'bottleneck_alert'`, `'wrap_up_reminder'`) |
| `sourceSignal` | `string` | The signal that triggered the recommendation |
| `event` | `RecommendationFeedbackEvent` | The outcome event — one of 6 values (see below) |
| `sessionId` | `string \| null` | Optional session context; `null` if no session is relevant |

### `computeLearningStats`

| Parameter | Type | Description |
|---|---|---|
| `outcomes` | `RecommendationOutcome[]` | Array of outcome records to aggregate |

### `getAdjustedPriorityWeight`

| Parameter | Type | Description |
|---|---|---|
| `recommendationType` | `string` | The recommendation category to score |
| `historicalOutcomes` | `RecommendationOutcome[]` | Full history to filter and score from |

All inputs are caller-supplied. No database calls are made inside this module.

---

## Output model

### `RecommendationOutcome`

Plain object. Weight is resolved from `FEEDBACK_WEIGHTS` at construction time.

| Field | Type | Description |
|---|---|---|
| `recommendationId` | `string` | Passed through from input |
| `recommendationType` | `string` | Passed through from input |
| `sourceSignal` | `string` | Passed through from input |
| `event` | `RecommendationFeedbackEvent` | The recorded outcome event |
| `weight` | `number` | Numeric weight from `FEEDBACK_WEIGHTS[event]` |
| `sessionId` | `string \| null` | Passed through from input |

### `RecommendationLearningStats`

| Field | Type | Description |
|---|---|---|
| `totalShown` | `number` | Count of all outcomes in the input array |
| `accepted` | `number` | Count of `'accepted'` events |
| `dismissed` | `number` | Count of `'dismissed'` events |
| `edited` | `number` | Count of `'edited'` events |
| `completed` | `number` | Count of `'completed'` events |
| `ignored` | `number` | Count of `'ignored'` events |
| `acceptanceRate` | `number` | `(accepted + completed) / totalShown`; 0 if no outcomes |
| `dismissalRate` | `number` | `dismissed / totalShown`; 0 if no outcomes |
| `netScore` | `number` | Sum of all outcome weights |

### `getAdjustedPriorityWeight` → `number`

Returns a float in the range `[0.3, 1.5]`. Base is `1.0`. Higher values mean surface this recommendation type more prominently. Lower values mean surface it less. Returns `1.0` (neutral) when no historical outcomes exist for the type.

---

## Feedback event types

Sourced from `donnaMemoryPolicy.RecommendationFeedbackEvent`.

| Event | Weight | Meaning |
|---|---|---|
| `completed` | `1.0` | Underlying action was completed |
| `accepted` | `0.8` | Director acted on the recommendation |
| `edited` | `0.5` | Director modified before acting |
| `dismissed` | `-0.3` | Director explicitly dismissed |
| `ignored` | `-0.1` | Director did not interact |
| `shown` | `0.0` | Recommendation was surfaced (baseline) |

---

## Learning / scoring behavior

`getAdjustedPriorityWeight` applies a linear adjustment:

```
adjusted = 1.0 + (acceptanceRate - dismissalRate) * 0.5
clamped  = max(0.3, min(1.5, adjusted))
```

A recommendation type that is always accepted and never dismissed converges toward `1.5`.
A recommendation type that is always dismissed and never accepted converges toward `0.3`.
A type with no history returns exactly `1.0`.

The adjustment is conservative — it cannot fully silence a recommendation type (floor `0.3`) or dominate the surface (ceiling `1.5`).

---

## Memory policy connection

`FEEDBACK_WEIGHTS` and `RecommendationFeedbackEvent` are imported from `donnaMemoryPolicy.ts`. This module does not redefine weights — it consumes the policy contract established there. Any change to feedback weights must go through `donnaMemoryPolicy.ts`.

DB persistence of feedback events (recording that a director accepted or dismissed a recommendation) is handled by `donnaRecommendationFeedback.ts`. This module only defines the scoring and aggregation math on top of already-persisted outcomes.

---

## No official-record mutation guarantee

This module:
- Makes zero database calls.
- Creates zero `proposed_actions` records.
- Writes zero `audit_log` entries.
- Does not touch player records, curriculum records, attendance records, or billing records.
- Does not modify any existing DONNA state.

Learning outcomes that should be persisted must be routed through `donnaRecommendationFeedback.ts` by the caller. This module never initiates that write.

---

## No auto-action guarantee

`getAdjustedPriorityWeight` returns a `number`. It is a hint to the calling ranking layer. It does not:
- Automatically hide or suppress recommendations.
- Automatically elevate any recommendation above director review.
- Trigger any downstream action.
- Bypass the `proposed_actions` approval pipeline.

All surfacing decisions that use this weight remain under director control.

---

## Safety boundaries

| Boundary | Status |
|---|---|
| No DB reads or writes | Enforced — pure functions only |
| No communication dispatch | Enforced — no network calls |
| No player/parent data surfaced | Enforced — only string IDs and numeric weights in output |
| No approval gate bypass | Enforced — no interaction with `proposed_actions` state machine |
| No official record mutation | Enforced — see above |
| Weight clamped to [0.3, 1.5] | Enforced — `Math.max(0.3, Math.min(1.5, ...))` |
| Weight formula is linear and reversible | Enforced — no irreversible learning state |

---

## V2 path

Future sprints may:
- Add a `decayFactor` parameter so older outcomes have less influence than recent ones.
- Add per-academy isolation so weight adjustments do not bleed across tenants.
- Add a `confidenceThreshold` so weights are only applied once a minimum sample size is reached.
- Connect `getAdjustedPriorityWeight` to the DONNA attention ranking engine.

No V2 features are in this module. V2 requires explicit sprint scoping.
