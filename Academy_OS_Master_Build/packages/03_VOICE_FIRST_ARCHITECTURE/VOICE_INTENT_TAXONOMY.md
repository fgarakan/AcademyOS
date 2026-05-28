# VOICE INTENT TAXONOMY

## Intent Categories

All voice commands map to one of these intent types. Claude must classify incoming commands into this taxonomy.

---

## SESSION MANAGEMENT

### `create_session`
**Triggers:** "build a session", "create a session", "schedule a session", "set up training"
**Required entities:** group, date
**Optional entities:** template, coach, duration, intensity, focus
**Example:** "Build next week's Orange Development technical session"

### `modify_session`
**Triggers:** "change the session", "update", "adjust", "make lighter/heavier"
**Required entities:** session identifier (group + date), what to change
**Example:** "Reduce Thursday's fitness intensity because we have matchplay Saturday"

### `cancel_session`
**Triggers:** "cancel", "remove", "delete"
**Required entities:** session identifier
**Risk level:** MEDIUM

### `duplicate_session`
**Triggers:** "repeat", "use same plan", "duplicate last week"
**Required entities:** source session, target date

---

## TEMPLATE MANAGEMENT

### `create_template`
**Triggers:** "create a template", "build a new plan", "make a block"
**Required entities:** name, group or level
**Example:** "Create a 4-week serve confidence progression for Elite-A"

### `modify_template`
**Triggers:** "update the template", "change the plan for", "adjust the default"
**Required entities:** template identifier, what to change
**Risk level:** MEDIUM (affects all future sessions using this template)

---

## PLAYER MANAGEMENT

### `create_placement_assessment`
**Triggers:** "create placement", "new student assessment", "assess", "place"
**Required entities:** player name (or ID), assessment type
**Example:** "Create a placement assessment for Mateo, age 9"

### `move_player_group`
**Triggers:** "move to", "transfer", "reassign group", "promote"
**Required entities:** player, target group
**Risk level:** MEDIUM (affects player history)

### `schedule_reassessment`
**Triggers:** "schedule reassessment", "reassess", "book assessment"
**Required entities:** player, date
**Example:** "Move Sofia's reassessment to next Friday"

### `flag_player`
**Triggers:** "flag", "mark", "note", "track"
**Required entities:** player, flag type
**Example:** "Flag Lucas as ready for competition-track review"

### `update_player_priorities`
**Triggers:** "update priority", "change focus", "work on"
**Required entities:** player, priorities
**Example:** "Update Ava's priority to serve confidence and recovery movement"

---

## LOAD MANAGEMENT

### `adjust_intensity`
**Triggers:** "lighter", "easier", "reduce intensity", "lower load", "heavier", "increase intensity"
**Required entities:** session or template identifier, which track(s), target intensity
**Clarification needed:** one-time or template change?
**Example:** "Make Thursday's session lighter on fitness"

### `flag_overload`
**Triggers:** "flag overload", "check load", "too much this week"
**Required entities:** group, week
**Example:** "Flag overload where skill, competition, and fitness are all high this week"

---

## PROGRAM BUILDING

### `create_program`
**Triggers:** "build a program", "create a block", "design a progression"
**Required entities:** name, duration, group or level, focus
**Example:** "Create a 4-week progression focused on serve and confidence routines"

### `rebalance_schedule`
**Triggers:** "rebalance", "adjust the week", "reorganize"
**Required entities:** group, week, rebalance criteria
**Risk level:** HIGH (affects multiple sessions)

---

## INFORMATION QUERIES

### `query_player`
**Triggers:** "show me", "tell me about", "what's happening with", "why is X in Y group"
**Required entities:** player
**No action required** — returns information only

### `query_group`
**Triggers:** "how is the group doing", "show me group status"
**Required entities:** group
**No action required**

### `query_schedule`
**Triggers:** "what's on this week", "show me next week"
**Optional entities:** group, date range
**No action required**

---

## REQUIRED ENTITY RESOLUTION RULES

When an entity is ambiguous, Claude must:

1. Check if a unique match exists in academy data (e.g., "Orange Dev" → "Orange Development" group)
2. If multiple matches: list options and ask
3. If no match: ask for clarification or offer to create new
4. Never assume. Never guess with confidence < 0.8.

**Date resolution:**
- "next Monday" → resolve to absolute ISO date using current date
- "this week" → Monday–Sunday of current week
- "tomorrow" → current date + 1

**Player resolution:**
- "Mateo" → search players by first name. If unique match: use. If multiple: list and ask.
- "the new kid" → unclear. Ask: "Which player are you referring to?"

---

## AMBIGUITY THRESHOLDS

| Confidence | Action |
|---|---|
| ≥ 0.90 | Proceed to proposed action |
| 0.70–0.89 | Proceed but flag for extra human review |
| 0.50–0.69 | Request clarification on ambiguous fields |
| < 0.50 | Reject with explanation, ask user to rephrase |
