# Academy Suggestions — Data Model

Sprint 177 | 2026-05-02
Migration: `051_academy_suggestions.sql`

---

## Table: `academy_suggestions`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, gen_random_uuid() |
| academy_id | uuid | FK → academies, NOT NULL |
| suggestion_type | text | See types below |
| title | text | Human-readable action title |
| summary | text | Why this was suggested |
| priority | text | low / medium / high |
| confidence | text | low / medium / high |
| status | text | pending / accepted / denied / deferred / applied / failed |
| source | text | 'system' (V1) |
| entity_type | text | 'player', 'session', 'request', etc. |
| entity_id | uuid | ID of the related entity |
| evidence | jsonb | Array of evidence items |
| impact_preview | jsonb | { if_accepted: string[], next_step?: string } |
| proposed_changes | jsonb | What would change if applied |
| will_not_change | jsonb | Array of strings: what explicitly stays the same |
| created_by | uuid | FK → profiles |
| reviewed_by | uuid | FK → profiles, set on review |
| reviewed_at | timestamptz | Set on review |
| review_note | text | Optional note from reviewer |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

---

## Status Lifecycle

```
pending → accepted  (director approved)
pending → denied    (director rejected)
pending → deferred  (director wants to revisit)
accepted → applied  (downstream action confirmed — future)
accepted → failed   (error during application — future)
```

---

## Suggestion Types

| Type | Trigger |
|---|---|
| player_focus_update | Active player with no current focus areas |
| private_lesson_opportunity | New private lesson request waiting |
| level_readiness_review | Player meets advancement criteria |
| parent_safe_update_draft | Dev summary exists, no student_friendly_summary |
| coach_note_followup | Player with no recent coach observation |
| session_adjustment | Session needs attention |
| curriculum_gap | Level with gaps in content mapping |
| fitness_adjustment | Fitness observation review needed |
| attendance_exception_followup | Unresolved attendance exception |

---

## Evidence Item Shape

```json
{
  "type": "player_data",
  "description": "Player has been active for 6 weeks with no development focus set",
  "date": "2026-05-02"
}
```

---

## Impact Preview Shape

```json
{
  "if_accepted": [
    "Director is routed to player profile to set development focus",
    "Coach snapshot for this player becomes actionable"
  ],
  "next_step": "Open player profile and set Current Focus in the Notes tab"
}
```

---

## Will Not Change (string array)

```json
[
  "Player level is not changed automatically",
  "No parent notification is sent",
  "No profile data is updated without director action"
]
```

---

## RLS

- Directors and head coaches: SELECT, INSERT, UPDATE for their academy
- No parent/player access
- No anonymous access
- Scoped via `academy_memberships` with `is_active = true`

---

## Duplicate Prevention

Before inserting, the `generateAcademySuggestionsAction` checks for existing `pending` suggestions with the same:
- `academy_id`
- `suggestion_type`
- `entity_type`
- `entity_id`

If a match exists, the draft is skipped. This prevents redundant pending suggestions.

---

## Not In `database.types.ts`

This table was created after the last type generation. All queries must use:

```typescript
const rawDb = supabase as any
```

Per `docs/AI_BACKEND_RULES.md` rule 4 (TS2589 workaround pattern).

Type regeneration should be run after this migration is applied to the live database:

```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```
