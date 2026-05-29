# Parent Communication Intelligence V1
**Date:** 2026-05-29
**Sprint:** 955

---

## Purpose

`donnaParentCommunicationIntelligence.ts` identifies moments when a director should consider initiating parent-safe communication for a specific player. It surfaces the opportunity and tells the director what they could do next — it does not send anything, draft anything automatically, or publish any content.

This module is a signal detector. It produces a recommendation for director attention, not an action.

---

## Input model

`ParentCommInput`

| Field | Type | Description |
|---|---|---|
| `playerId` | `string` | Player identifier — passed in by caller, not fetched internally |
| `playerName` | `string` | Display name — used in human-readable output copy only |
| `parentId` | `string \| null` | Parent/guardian identifier — passed in by caller, included in output for caller reference |
| `hasNewAppliedObservation` | `boolean` | Whether a recently approved and applied observation exists |
| `repeatedPriorityCount` | `number` | How many sessions have flagged the same priority |
| `parentSafeSummaryReady` | `boolean` | Whether a coach-approved parent-safe summary is available for review |
| `daysSinceLastCommunication` | `number \| null` | Days elapsed since last parent communication; null if none recorded |

All fields are caller-supplied. The module makes no database calls.

---

## Output model

`ParentCommOpportunity | null`

Returns `null` if no opportunity is detected.

| Field | Type | Description |
|---|---|---|
| `type` | `ParentCommOpportunityType` | One of 4 opportunity types |
| `playerId` | `string` | Passed through from input |
| `playerName` | `string` | Passed through from input |
| `parentId` | `string \| null` | Passed through from input |
| `urgency` | `'high' \| 'medium' \| 'low'` | Signal severity |
| `description` | `string` | Human-readable explanation of why this opportunity exists |
| `draftAction` | `string` | Plain-text guidance for the director — what they could do next. Not an executable instruction. |
| `safetyNote` | `string` | `getSafetyMessage('noAutoSend')` — always present, always states approval is required |
| `href` | `string` | Director-facing link to the player page — `/director/players/${playerId}` |

---

## Opportunity types

| Type | Trigger | Urgency |
|---|---|---|
| `new_applied_observation` | `hasNewAppliedObservation === true` | medium |
| `repeated_priority_signal` | `repeatedPriorityCount >= 3` | medium |
| `summary_ready` | `parentSafeSummaryReady === true` | low |
| `communication_gap_aging` | `daysSinceLastCommunication > 30` | low |

Only the first matching opportunity is returned per call (priority order matches list above).

---

## Parent-safe boundaries

- Output copy never includes internal coach notes.
- Output copy never includes raw assessment scores, rankings, or peer comparisons.
- Output copy never includes director-only comments or sensitive internal flags.
- `draftAction` is plain text guidance, not an API call, not a message payload, and not a trigger for any downstream system.
- No parent portal content is created or modified.
- No parent-visible records are written.

---

## Draft-only behavior

`draftAction` describes what the director should do manually — for example:

> "Draft a parent-safe summary for your review and approval before sending."

This is instruction copy rendered to the director. It does not call any function, fire any server action, write any database record, or enqueue any message. The director must take all follow-on steps explicitly.

---

## No-send guarantee

This module:
- Makes zero network calls.
- Makes zero database calls.
- Writes zero records.
- Sends zero messages.
- Publishes zero content to parent or player portals.

All output is a plain TypeScript return value. Nothing reaches any recipient without an explicit, separate director action through the approved communication pipeline.

---

## No-mutation guarantee

Pure function. Given the same input, returns the same output. No side effects of any kind.

---

## Safety risks

| Risk | Mitigation |
|---|---|
| `draftAction` copy could be misread as an automatic action | `safetyNote` is always present and states approval is required. `draftAction` is named "draft" to signal it is a next-step instruction, not a completion. |
| `parentId` in output could suggest a direct contact path | `href` only links to the director player page. No parent contact details are surfaced. Caller is responsible for what they do with `parentId`. |
| Opportunity detection could surface for a player with no linked parent | `parentId` may be `null`. The caller must handle this before initiating any real communication workflow. |

---

## V2 path

Future sprints may:
- Add a `filterByRole` parameter so that coach-visible signals are separated from director-only signals.
- Accept a `communicationPreferences` object to suppress opportunities where parent has opted out.
- Add a `batchDetect(inputs[])` wrapper for academy-wide scanning.
- Add a `confidence` field (low/medium/high) once signal history is richer.

No V2 features are in this module. V2 requires explicit sprint scoping.
