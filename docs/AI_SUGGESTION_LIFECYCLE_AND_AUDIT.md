# AI Suggestion Lifecycle and Audit Guide

_Sprint 184 — Academy OS_

---

## Lifecycle States

```
pending → accepted → applied
       → denied
       → deferred → pending (re-surfaced manually)
       → failed   (apply step failed — future)
```

### State definitions

| Status | Meaning |
|---|---|
| `pending` | Suggestion generated; awaiting director review |
| `accepted` | Director approved; V1 routes director to correct page — no auto-mutation |
| `denied` | Director dismissed; stored with optional review note |
| `deferred` | Director chose to revisit later; remains in filtered view |
| `applied` | Downstream action confirmed completed — future use |
| `failed` | An attempt to apply failed — future use |

---

## Duplicate Prevention

Duplicates are prevented per generation run using a composite key:

```
suggestion_type : entity_type : entity_id
```

**Implementation** (in `generateAcademySuggestionsAction`):

1. Before inserting, fetch all existing `pending` suggestions for the academy.
2. Build an in-memory `Set<string>` of composite keys.
3. For each new draft, skip insertion if the key already exists in the Set.
4. After inserting a new suggestion, add its key to the Set to prevent within-run duplicates.

This means re-running "Generate Suggestions" will not create duplicates for items already pending review. Once a suggestion is accepted/denied/deferred, the slot is freed and a new suggestion for the same entity can be created on the next run.

---

## Accepted vs Applied

| Status | Meaning |
|---|---|
| `accepted` | Director reviewed and agreed — V1 does NOT auto-apply |
| `applied` | A distinct downstream action was taken and confirmed |

In V1, `accepted` is the terminal reviewed state for most suggestion types. The `applied` status exists for future use when suggestions will trigger specific safe mutations (e.g., marking a player profile field updated).

The distinction matters for analytics: tracking `accepted` → `applied` conversion rates will reveal which suggestions directors follow through on.

---

## V1 Safety Rules per Suggestion Type

| Suggestion Type | On Accept (V1) | Auto-mutates? |
|---|---|---|
| `player_focus_update` | Routes director to player profile | No |
| `level_readiness_review` | Routes director to Skill Path tab | No |
| `coach_note_followup` | Routes director to player profile | No |
| `private_lesson_opportunity` | Routes director to Private Lessons | No |
| `parent_safe_update_draft` | Routes director to player profile Notes tab | No |
| `session_adjustment` | Marks accepted, links to session/adaptive review | No |
| `curriculum_gap` | Marks accepted only | No |
| `fitness_adjustment` | Marks accepted, links to fitness template | No |
| `attendance_exception_followup` | Marks accepted only | No |

**No suggestion type in V1 applies any change automatically.**

---

## Audit Trail

### V1 (current)

The `academy_suggestions` table captures:

| Field | What it records |
|---|---|
| `created_by` | Profile that triggered generation |
| `reviewed_by` | Profile that accepted/denied/deferred |
| `reviewed_at` | Timestamp of review action |
| `review_note` | Optional director note on deny/defer |
| `updated_at` | Last state change |

This provides a basic audit log embedded in the suggestions table.

### Future integration

When `audit_logs` table is ready, every accepted suggestion should write:

```json
{
  "table_name": "academy_suggestions",
  "record_id": "<suggestion_id>",
  "action": "accepted",
  "changed_by": "<profile_id>",
  "academy_id": "<academy_id>",
  "before": { "status": "pending" },
  "after": { "status": "accepted", "reviewed_by": "...", "reviewed_at": "..." }
}
```

---

## What Can Be Safely Auto-Applied in Future

These types have bounded, safe mutations that could be auto-applied after explicit director confirm:

- `player_focus_update` — set `development_focus` text field on player profile
- `private_lesson_opportunity` — change request status from `new` to `under_review`

These types must **never** be auto-applied:

- `level_readiness_review` — player level movement requires full review
- `session_adjustment` — master template changes affect all groups
- `parent_safe_update_draft` — parent-facing content requires explicit review
- Any type that sends communications

---

## RLS Enforcement

All read/write access to `academy_suggestions` is governed by Supabase RLS policies defined in `supabase/migrations/051_academy_suggestions.sql`:

- Only profiles with `academy_director` or `head_coach` role in `academy_memberships` can SELECT or mutate suggestions.
- `academy_id` is enforced on every policy.
- Parent and player roles have no access.
- Service role is not used in suggestion queries.
