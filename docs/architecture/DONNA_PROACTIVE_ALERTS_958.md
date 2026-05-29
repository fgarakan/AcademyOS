# DONNA Proactive Alerts V1
**Date:** 2026-05-29
**Sprint:** 958

---

## Purpose

`donnaProactiveAlerts.ts` generates safe, low-noise, in-app operational alert objects for academy directors. Rather than waiting for a director to ask DONNA what to do, this module surfaces signals that warrant attention — aging review items, sessions missing coach wrap-ups, and parent-safe summaries ready for director review.

All alerts are recommendation-only. They describe a situation and point the director to a route. They do not mutate any record, send any communication, or execute any action. Dismiss and snooze tracking are handled by the existing `donnaRecommendationFeedback.ts` infrastructure when a UI layer is wired.

---

## Alert categories

### V1 — built and exported

| Type | Trigger | Urgency | Route |
|---|---|---|---|
| `review_aging` | Pending review items, oldest > 3 days | critical / high / medium | `/director/review` |
| `missing_wrap_ups` | 2+ sessions without a coach wrap-up | high / medium | `/director/sessions` |
| `parent_summary_ready` | 1+ coach-approved parent-safe summaries awaiting director review | low | `/director/review` |

### V2 — type declared, builder deferred

| Type | Reason deferred |
|---|---|
| `repeated_player_concern` | Requires player attention signal aggregation not yet available in the brief input shape |
| `unresolved_clarification` | Requires coach clarification tracking infrastructure not yet wired to director alerts |

Both V2 types are present in the `ProactiveAlertType` union for forward compatibility. No builder exists for them in V1.

---

## Input model

### Individual builders

| Function | Parameters | Description |
|---|---|---|
| `buildReviewAgingAlert` | `pendingCount: number, oldestDaysAgo: number` | Caller provides pending count and age of oldest item |
| `buildMissingWrapUpsAlert` | `sessionsWithoutWrapUp: number` | Caller provides session count missing wrap-ups |
| `buildParentSummaryReadyAlert` | `playerCount: number` | Caller provides count of players with summaries ready |

### Suite builder

```typescript
buildProactiveAlerts(input: DirectorBriefInput & {
  reviewOldestDaysAgo?: number
  sessionsWithoutWrapUp?: number
  parentSummariesReady?: number
}): DonnaProactiveAlert[]
```

Extends `DirectorBriefInput` (which contains `pendingReviews`) with three alert-specific fields. All fields are optional — missing fields default to 0 via nullish coalescing. No alert is generated if its threshold is not met.

All inputs are caller-supplied. No database calls are made inside this module.

---

## Output model

### `DonnaProactiveAlert`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique alert instance ID (`${type}_${Date.now()}`) — non-deterministic, refreshes each call |
| `type` | `ProactiveAlertType` | Alert category |
| `urgency` | `AlertUrgency` | `'critical' \| 'high' \| 'medium' \| 'low'` |
| `headline` | `string` | Short summary shown in the alert header |
| `body` | `string` | Explanatory copy describing the situation |
| `actionLabel` | `string` | Label for the primary action button |
| `actionRoute` | `string` | Route the director should navigate to |
| `safetyNote` | `string \| null` | Safety copy from `getSafetyMessage()` when approval or no-auto-send language is relevant; `null` for operational alerts with no approval implication |
| `dismissible` | `boolean` | Always `true` in V1 — all alerts are user-dismissable |

---

## Alert ranking / severity behavior

`buildProactiveAlerts` sorts the returned array by urgency before returning:

```
critical (0) → high (1) → medium (2) → low (3)
```

Urgency is determined per alert type:

- **`review_aging`**: `critical` if oldest > 7 days, `high` if oldest > 3 days, `medium` otherwise.
- **`missing_wrap_ups`**: `high` if 3+ sessions missing, `medium` if 2.
- **`parent_summary_ready`**: always `low` — summaries are not urgent, just ready for attention.

Thresholds for inclusion:
- `review_aging` only fires when `pendingReviews > 0` AND `oldestDaysAgo > 3`.
- `missing_wrap_ups` only fires when `sessionsWithoutWrapUp >= 2`.
- `parent_summary_ready` fires when `parentSummariesReady > 0`.

---

## Safety copy

Two safety messages are used from `donnaPersonality.getSafetyMessage()`:

| Key | Message | Used on |
|---|---|---|
| `'approvalRequired'` | "This action needs your explicit approval before it takes effect." | `review_aging` alert |
| `'noAutoSend'` | "I never send communications automatically. You approve and dispatch." | `parent_summary_ready` alert |
| `null` | — | `missing_wrap_ups` alert — no approval implication |

---

## No-mutation guarantee

This module:
- Makes zero database calls.
- Creates zero `proposed_actions` records.
- Writes zero `audit_log` entries.
- Does not touch player, curriculum, attendance, or billing records.
- Does not modify any DONNA state, session memory, or recommendation feedback.

Alert objects are plain TypeScript return values. Nothing is persisted unless a separate UI layer and the `donnaRecommendationFeedback.ts` infrastructure record a dismiss/snooze interaction explicitly.

---

## No-push / no-email guarantee

This module produces in-app alert data objects only. It does not:
- Send push notifications.
- Send email.
- Send SMS.
- Make any network call.
- Enqueue any background job.
- Trigger any scheduled task.

The `actionRoute` field is a plain string — it is a navigation hint for a UI component, not a redirect trigger.

---

## No parent/player communication guarantee

- No parent-facing content is created or dispatched.
- No player-facing content is created or dispatched.
- `parent_summary_ready` alert is a director-only signal. It tells the director that summaries exist for their review — it does not create those summaries, send them, or make them visible to parents.
- All `actionRoute` values point to director-only routes (`/director/review`, `/director/sessions`).

---

## What is intentionally V2

| Feature | Reason deferred |
|---|---|
| `repeated_player_concern` alert builder | Requires aggregation of player attention signals not in `DirectorBriefInput` |
| `unresolved_clarification` alert builder | Requires coach clarification tracking data feed |
| `safetyLevel` assertion in `expected` (eval harness) | Documented in Sprint 957 as a V2 eval improvement |
| Per-academy alert thresholds | Thresholds are hardcoded in V1; configurable thresholds require `academyPreferences` wiring |
| Dismiss/snooze persistence | V1 produces alert objects; dismiss/snooze tracking via `donnaRecommendationFeedback.ts` is wired by the UI layer, not this module |

---

## V2 path

Future sprints may:
- Add `buildRepeatedPlayerConcernAlert` and `buildUnresolvedClarificationAlert` builders.
- Accept an `academyPreferences` object to make urgency thresholds configurable per academy.
- Add a `suppressedAlertTypes` filter parameter to respect director opt-outs.
- Connect alert urgency to the DONNA attention ranking engine for ordering within the director brief.
- Add CI eval coverage for proactive alert threshold logic.
