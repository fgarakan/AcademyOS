# Sprint 1092 — Coach Wrap-Up Observation Persistence to Player Profile V1

**Date:** 2026-06-01
**Sprint:** 1092

---

## Problem (Sprint 1091 Blocker)

The main AcademyOS value loop required two separate director actions:
1. Apply session wrap-up → writes `session_notes` (text)
2. Separately find, approve, and apply each player observation draft → writes `coach_observations`

Directors were not completing step 2, so player profiles never received structured coach feedback and the coach→player→parent loop was broken.

---

## Architecture (before and after)

### Pre-1092 flow

```
Coach submits wrap-up
    ├── saveWrapUpDraftAction → proposed_action (session_wrap_up_v1)
    └── saveWrapUpObservationsAction → proposed_action[] (coach_observation_draft_v1, one per player)

Director applies session wrap-up
    └── applyWrapUpDraftAction → session_notes text only

Director must separately:
    └── Find each coach_observation_draft_v1 in review queue
    └── Approve each one
    └── Apply each one → applyApprovedObservationDraftAction → coach_observations row
    (directors often miss this step → player profile never updates)
```

### Post-1092 flow

```
Coach submits wrap-up (unchanged)
    ├── saveWrapUpDraftAction → proposed_action (session_wrap_up_v1)
    └── saveWrapUpObservationsAction → proposed_action[] (coach_observation_draft_v1)

Director applies session wrap-up
    └── applyWrapUpDraftAction
         ├── writes session_notes (unchanged)
         ├── marks session_wrap_up_v1 as executed (unchanged)
         └── NEW Sprint 1092:
              ├── queries coach_observation_draft_v1 for same session + academy
              ├── for each pending/approved observation draft with valid player_id:
              │    ├── inserts coach_observations row
              │    ├── marks observation draft as executed
              │    └── revalidatePath(/director/players/{player_id})
              └── returns observationsCreated count

Player profile query (/director/players/[playerId])
    └── reads coach_observations → shows observations immediately after apply
```

---

## File Changed

**`src/app/director/review/applyWrapUpDraftAction.ts`**

Changes:
1. Added import of `CoachObservationDraftPayload` type
2. Extended `ApplyWrapUpDraftResult` with `observationsCreated?: number`
3. Added Sprint 1092 observation persistence block after existing audit log write

---

## Observation Persistence Logic

```typescript
// Query pending/approved observation drafts for this academy
.from('proposed_actions')
.select('id, proposed_by_id, proposed_payload, voice_command_id, status')
.eq('academy_id', academyId)
.eq('target_module', 'coach_observation_draft_v1')
.in('status', ['pending_review', 'approved'])

// Filter in-code: only drafts linked to this sessionId
payload.session_id === sessionId && payload.player_id

// For each matched draft, insert:
.from('coach_observations')
.insert({
  academy_id, coach_id, player_id, session_id,
  content: payload.note,
  observation_type: payload.observation_type ?? 'general',
  is_private: true,
  ai_entities: {
    source: 'coach_wrap_up',
    proposed_action_id: draft.id,
    applied_via: 'session_wrap_up_apply',
  }
})
```

---

## Field Mapping: `CoachObservationDraftPayload` → `coach_observations`

| `coach_observations` field | Source | Notes |
|---|---|---|
| `academy_id` | Auth context | Always from server-side auth |
| `coach_id` | `draft.proposed_by_id` | The coach who submitted the draft |
| `player_id` | `payload.player_id` | Validated against academy's active players at submission time |
| `session_id` | `sessionId` | The session being applied (same as `payload.session_id`) |
| `content` | `payload.note` | The coach's observation text |
| `observation_type` | `payload.observation_type` | `'general' \| 'positive' \| 'needs_attention'` |
| `is_private` | Always `true` | Never parent/player visible |
| `voice_command_id` | `draft.voice_command_id` | Preserved for audit trail |
| `ai_entities` | Provenance object | Tracks source, proposed_action_id, applied_via |

---

## Idempotency

The wrap-up apply action already guards against re-execution at the top level:
```typescript
if (proposedAction.status !== 'approved') {
  return { ok: false, error: 'Only approved drafts can be applied.' }
}
```
After first successful apply, the `session_wrap_up_v1` status becomes `'executed'`. A second call fails here, so the observation loop is never re-entered.

Additionally, the observation loop only processes drafts with `status in ['pending_review', 'approved']` — already-executed observation drafts are never re-processed.

The `ai_entities.proposed_action_id` field in each `coach_observations` row provides a provenance trail for future deduplication if needed.

---

## What Remains Unchanged

- `sessions.session_notes` text write (unchanged)
- `applyApprovedObservationDraftAction` (individual observation apply still works independently)
- Review queue `WrapUpObservationDraftCard` (still shows observation drafts for separate approval if desired)
- Parent messages: never sent
- Player levels: never changed
- Curriculum: never mutated
- `is_private: true` on all observations: always enforced
- Best-effort: observation errors do not fail the session wrap-up apply

---

## What Still Needs Future Work

- **Block-level completion status** — `session_blocks.status` not updated (requires migration)
- **`session_block_exercises` RLS** — migration 056 still pending live application
- **Session actuals table** — `session_actuals` normalized table not yet built (future sprint)
- **Parent communication trigger** — director still manually initiates parent update from player profile
