# VOICE TO STRUCTURED ACTION SPEC
**Package:** 03 — Voice-First Architecture
**Version:** 1.0 | **Status:** Draft

---

## Purpose

This document specifies the exact transformation from a raw voice/text input to a
validated structured payload ready for proposed action creation.

The pipeline covered here: **Stages 3–5** of the Voice Command Lifecycle.

```
raw_input / transcript
  → normalize_intent (Claude API)
  → resolve_entities (DB lookups)
  → validate_payload (schema check)
  → structured_payload (stored in proposed_actions.proposed_payload)
```

---

## Stage 3: Intent Normalization

### Claude API Call

**Model:** `claude-sonnet-4-6` (or latest Sonnet)
**Prompt pattern:** See `packages/09_AI_WORKFLOW_AND_CLAUDE_PROMPTS/` for full prompts.

**System context passed to Claude:**
```json
{
  "current_date": "2026-05-04",
  "current_week_start": "2026-05-04",
  "academy": {
    "name": "Riverside Tennis Academy",
    "timezone": "America/New_York"
  },
  "groups": [
    { "id": "uuid", "name": "Orange Development", "track": "skill", "player_count": 8 },
    { "id": "uuid", "name": "Elite-A", "track": "combined", "player_count": 6 }
  ],
  "levels": [
    { "id": "uuid", "label": "Orange Development", "level_number": 3 }
  ],
  "recent_sessions": [
    { "id": "uuid", "group_id": "uuid", "date": "2026-04-28", "status": "completed" }
  ]
}
```

**User message passed to Claude:**
```
Command: "Build next week's orange-ball technical block."
```

**Expected Claude output (normalized_intent):**
```json
{
  "intent_type": "create_session",
  "confidence": 0.88,
  "target_module": "sessions",
  "entities": {
    "group_name": "Orange Development",
    "week": "next",
    "focus_type": "technical",
    "block_type": "technical"
  },
  "missing_required": ["exact_date", "template_id"],
  "ambiguous_fields": [],
  "is_query_only": false
}
```

### Confidence Thresholds

| Score | Outcome |
|---|---|
| ≥ 0.85 | Proceed directly to entity resolution |
| 0.70–0.84 | Proceed but flag for review; show confidence in UI |
| < 0.70 | Require clarification before proceeding |

### Intent Types and Required Entities

| `intent_type` | Required entities |
|---|---|
| `create_session` | `group_id`, `date`, at minimum one of (`template_id` or `focus_type`) |
| `modify_session` | `session_id`, at least one field to change |
| `create_template` | `group_id`, `track`, `name` |
| `create_placement_assessment` | `player_id` or `player_name` |
| `move_player_group` | `player_id`, `target_group_id` |
| `schedule_reassessment` | `player_id`, `date` |
| `adjust_intensity` | `session_id` or `group_id` + date, `intensity_target`, `block_type` |
| `flag_player` | `player_id`, `reason` |
| `generate_parent_update` | `player_id` |

---

## Stage 4: Entity Resolution

After intent normalization, string names must be resolved to database UUIDs.

### Resolution Rules

**Group name → group_id:**
```sql
SELECT id FROM groups
WHERE academy_id = :academy_id
AND LOWER(name) ILIKE LOWER(:group_name)
AND is_active = true
LIMIT 1;
```
If multiple matches → add to `ambiguous_fields`, ask user to clarify.
If no match → add to `missing_required`, reject with explanation.

**Date expression → ISO date:**
- "next Monday" → resolve from `current_date`
- "Thursday" → nearest upcoming Thursday
- "next week" → `current_week_start + 7 days`
- Absolute dates passed through as-is

**Player name → player_id:**
```sql
SELECT id, full_name FROM players
WHERE academy_id = :academy_id
AND full_name ILIKE :name
AND is_active = true;
```
If multiple matches → clarification required with names listed.

**Template reference → template_id:**
If user didn't specify a template, use the group's default template:
```sql
SELECT id FROM templates
WHERE group_id = :group_id AND is_default = true AND is_active = true
LIMIT 1;
```

---

## Stage 5: Payload Validation and Construction

Each `intent_type` maps to a payload schema. All required fields must be resolved
before a proposed action can be created.

### Payload schemas by action type

**`create_session`**
```json
{
  "group_id": "uuid — required",
  "coach_id": "uuid — required (defaults to group lead coach)",
  "template_id": "uuid — required or derived from group default",
  "date": "ISO date — required",
  "duration_min": "integer — optional, defaults to template total_duration_min",
  "intensity_overrides": "object — optional: {block_type: intensity_level}",
  "notes": "string — optional"
}
```

**`modify_session`**
```json
{
  "session_id": "uuid — required",
  "changes": {
    "intensity_overrides": "optional",
    "date": "optional",
    "duration_min": "optional",
    "notes": "optional"
  }
}
```

**`move_player_group`**
```json
{
  "player_id": "uuid — required",
  "target_group_id": "uuid — required",
  "reason": "string — required (risk: medium)"
}
```

**`create_placement_assessment`**
```json
{
  "player_id": "uuid — required",
  "assessment_type": "intake — default for new players",
  "assessed_by": "uuid — defaults to current user"
}
```

**`schedule_reassessment`**
```json
{
  "player_id": "uuid — required",
  "date": "ISO date — required",
  "notes": "string — optional"
}
```

**`adjust_intensity`**
```json
{
  "session_id": "uuid — required (or derived from group + date)",
  "block_type": "string — 'fitness' | 'technical' | 'all'",
  "new_intensity": "integer 1–5 — required",
  "reason": "string — optional"
}
```

**`generate_parent_update`**
```json
{
  "player_id": "uuid — required",
  "period_start": "ISO date — optional",
  "period_end": "ISO date — optional",
  "tone": "string — 'encouraging' | 'neutral' | 'concerned' (default: encouraging)"
}
```

---

## Validation Rules

Before creating a proposed action, validate:

1. **All required fields are present** — no nulls in required positions
2. **UUIDs exist in DB** — group_id, player_id, session_id, template_id must resolve
3. **Date is in the future** (or today) for `create_session`, `schedule_reassessment`
4. **Intensity is 1–5** for `adjust_intensity`
5. **Group capacity** not exceeded for `move_player_group` (warn if near max)
6. **Player status** is compatible with action (`create_placement_assessment` requires status ≠ `active`)

If validation fails → reject with specific error message. Do not create proposed action.

---

## Payload Stored

The final validated payload is stored in:
```
proposed_actions.proposed_payload = { ...validated fields }
```

`action_label` is a human-readable sentence generated from the resolved payload:
> "Create 90-min technical session for Orange Development on Monday May 4 (Template: Green Technical Block, Coach: Marco Santos)"

This is what the director reads in the approval UI.

---

## V1 vs V2 Differences

| Capability | V1 | V2 |
|---|---|---|
| Input method | Text only (`input_method = 'typed'`) | Audio recording (MediaRecorder → Whisper) |
| Transcript | Same as raw_input | Whisper API output |
| Resolution UX | Web form with dropdowns for ambiguous fields | Conversational clarification |
| AI model | `claude-sonnet-4-6` | Same + streaming |
