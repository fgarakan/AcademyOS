# DONNA Entity Audit V1

**Mega Sprint 2291–2320 — DONNA Academy Entity Intelligence**  
**Status:** Complete (2026-06-06)

This document audits every entity type a director might reference naturally,
mapping each to its source table, searchable fields, known aliases, nickname
opportunities, routing destination, and current resolution gaps.

---

## Audit Method

For each entity type, the audit answers:

1. What table does it live in?
2. What does a director call it?
3. What fields can be searched?
4. What nicknames or abbreviations exist?
5. What is the correct navigation destination?
6. What is missing from the current resolution system?

---

## Entity 1 — Player

**Source table:** `players`  
**Join context:** `player_curriculum_states` (level), `session_attendance` (activity)

**Display name fields:**
- `first_name` + `last_name` → full name
- Directors typically use first name only ("Jake", "Alessia")
- Occasionally full name ("Jake Khera")
- Occasionally initials or nickname ("JJ", "A-Rod")

**Searchable fields:**
- `first_name` — most common reference
- `last_name` — occasional
- `full_name` — computed
- `nickname` — not currently in schema, handled via nickname map
- `player_status` — "the active players", "pending players"

**Alias / nickname patterns:**
- Diminutives: "Danny" → "Daniel", "Alex" → "Alexander/Alexandra", "Mike" → "Michael"
- Initials: "JJ" → first player with those initials; "AK" → player with those initials
- Common sports nicknames: "Coach's son" (heuristic only)
- Possessive references: "Jake's" → Jake, "her" → last resolved female player

**Academy ownership:** `players.academy_id` — RLS-scoped, always filtered

**Routing destination:**
- Profile: `/director/players/{playerId}`
- Assessment: `/director/players/{playerId}` (profile tab)
- Focus: `player-profile-header`

**Current gaps:**
- Search capped at 30 players from `playerCurriculumStateSummaries`
- No nickname map applied
- No fuzzy matching (typos like "Jerrid" → "Jerrod" fail)
- No initial-based lookup ("JJ")
- No pronoun resolution ("how is he doing?" after "Show Jake")

---

## Entity 2 — Coach

**Source table:** `profiles` (where role = 'coach') + `academy_memberships`  
**Join context:** `sessions.coach_id`, `player_groups.coach_id`

**Display name fields:**
- `display_name` — primary
- `first_name` + `last_name` — fallback
- Directors use first name ("Danny"), full name ("Danny Barrios"), or role ("my head coach")

**Searchable fields:**
- `display_name`
- `first_name` / `last_name`
- Role: "head coach", "assistant coach"

**Alias / nickname patterns:**
- "Coach Danny" → Danny (coach role)
- "my head coach" → first head_coach in membership
- "Danny's players" → groups/players coached by Danny

**Academy ownership:** `academy_memberships.academy_id`

**Routing destination:**
- No dedicated coach profile route yet
- Honest fallback: "I can route you to Danny's players — try the Players list filtered by coach"
- Future: `/director/coaches/{coachId}`

**Current gaps:**
- Coach names NOT loaded in `DirectorDonnaContext` (V1 honest fallback)
- No disambiguation between "Danny the coach" vs "Danny the player"
- No coach → player relationship routing

---

## Entity 3 — Parent / Guardian

**Source table:** `guardians`  
**Join context:** `player_guardians` (player linkage)

**Display name fields:**
- `display_name` or `first_name` + `last_name`
- Directors use: "Jake's parent", "Katrina", "George", "the Smiths"

**Searchable fields:**
- `first_name` / `last_name` (direct name search)
- Relationship: "Jake's parent" → resolve Jake first, then guardian linkage

**Alias / nickname patterns:**
- "Jake's mom", "Jake's dad" → guardian linked to Jake
- "Katrina" → guardian named Katrina
- Possessive: "Alex's parents" → all guardians linked to Alex

**Academy ownership:** Via player → `player_guardians` → `guardians` (scoped by player's academy)

**Routing destination:**
- No dedicated parent profile route
- Review queue: `/director/review` (parent communications tab)
- Player profile: `/director/players/{playerId}` (shows parent guidance preview)

**Current gaps:**
- Parents not searchable (no guardian data in DirectorDonnaContext)
- "Jake's parent" works only if Jake is resolved first
- No direct parent → profile navigation

---

## Entity 4 — Group

**Source table:** `player_groups`  
**Join context:** `group_memberships` (players), `sessions.group_id`

**Display name fields:**
- `name` — primary ("Orange Ball 2 Group", "Red Ball 1 Monday")
- Level-based: "the Orange 2 group", "my Red Ball players"

**Searchable fields:**
- `name` (partial match)
- Associated curriculum level: "the Orange 2 group" → group with orange_ball_2 level
- Day/time context: "Monday group", "morning group" (heuristic only)

**Alias / nickname patterns:**
- Level name = group: "Orange Ball 2" often refers to the group at that level
- "my Monday group" → group with sessions on Monday

**Academy ownership:** `player_groups.academy_id`

**Routing destination:**
- Groups list: `/director/groups` (if built)
- Sessions for group: `/director/sessions?group={groupId}`
- Currently falls back to: `/director/sessions`

**Current gaps:**
- Group search not implemented in entity resolution
- "Who is in Orange Ball 2?" needs group → member lookup
- No session-by-group routing

---

## Entity 5 — Curriculum Level

**Source table:** `curriculum_levels`  
**Join context:** `player_curriculum_states.current_level_id`

**Display name fields:**
- `display_name` — "Orange Ball 2", "High Performance 1"
- `stage` — "orange", "green", "high_performance"
- `level_number` — 1, 2, 3

**Searchable fields:**
- Color + number: "Orange Ball 2", "OB2", "Orange 2"
- Stage name: "Orange", "Red", "Green Dot"
- Short code: "HP1" → High Performance 1, "RB1" → Red Ball 1

**Alias / nickname patterns:**

| Input | Resolved as |
|---|---|
| "OB1" / "O1" | Orange Ball 1 |
| "OB2" / "O2" | Orange Ball 2 |
| "RB1" / "R1" | Red Ball 1 |
| "G1" / "GD1" | Green Dot 1 |
| "HP1" / "HP2" | High Performance 1/2 |
| "Orange" (no number) | Orange Ball (stage) |
| "Serve curriculum" | curriculum item containing "serve" |
| "Backhand" | curriculum item containing "backhand" |
| "Yellow" | Yellow Ball |

**Academy ownership:** Curriculum levels are academy-linked via `academy_curriculum_assignments`

**Routing destination:**
- Level improvement: `/director/curriculum?improve={levelKey}`
- Curriculum explorer: `/director/curriculum`
- Focus: `donna-curriculum-context`

**Current gaps:**
- Short code aliases ("HP1", "OB2") partially supported via LEVEL_KEY_MAP
- "Green Dot" vs "Green Ball" inconsistency
- No "Serve curriculum" / skill-area routing

---

## Entity 6 — Assessment

**Source table:** `player_assessments`  
**Join context:** `players.id`, `proposed_actions` (for draft assessments)

**Display name fields:**
- `type` — "intake", "quarterly", "placement", "reassessment", "competition", "mental"
- Specific to player: "Jake's assessment", "Alessia's latest assessment"

**Searchable fields:**
- Type: "placement assessment", "competition assessment", "mental assessment"
- Owner: "Jake's assessment" → resolve Jake → find his assessments
- Recency: "latest", "most recent", "the new assessment"

**Alias / nickname patterns:**
- "placement" → placement_assessment / placement_recommendation_draft
- "intake" → intake assessment
- "quarterly" → quarterly assessment
- "competition" → competition_assessment
- "mental" → mental assessment
- "the test" → assessment (generic)

**Academy ownership:** Via player `academy_id`

**Routing destination:**
- Player profile: `/director/players/{playerId}` (assessment tab if player-specific)
- Review queue: `/director/review` (for draft assessments)

**Current gaps:**
- Type-based routing without a player name is not implemented ("show all placement assessments")
- "Competition Assessment" as a standalone entity (not player-specific) not handled

---

## Entity 7 — Template

**Source table:** `templates`  
**Join context:** `template_blocks`, `curriculum_levels`

**Display name fields:**
- `name` — primary
- `templateType` — "class", "fitness"
- Level context: "Orange Ball 2 template", "Red Ball fitness"

**Searchable fields:**
- `name` (partial match via `resolveTemplateByName`)
- `templateType` — "class template", "fitness template"
- Level name: "the Orange 2 class template"

**Alias / nickname patterns:**
- "Red Ball template" → templates with curriculum_level = red_ball_*
- "fitness template" → templateType = 'fitness'
- "session plan" → template (generic)
- "the plan" → template (contextual)

**Academy ownership:** `templates.academy_id`

**Routing destination:**
- Class template: `/director/class-templates/{templateId}`
- Fitness template: `/director/fitness/templates/{templateId}`
- Templates list: `/director/templates`

**Current gaps:**
- Works when template names are in loaded `templateSummaries` (cap ~20)
- No level-based template lookup ("show me the Orange 2 template")
- "Fitness template" generic → needs picker

---

## Entity 8 — Session

**Source table:** `sessions`  
**Join context:** `session_blocks`, `groups`

**Display name fields:**
- `name` — primary
- Temporal: "today's session", "last session", "this morning's session"
- Group-based: "the Orange 2 session", "Danny's session"

**Searchable fields:**
- `name` (partial)
- `scheduled_date` — "today", "yesterday", "this week"
- `coach_id` — "Danny's session"
- `group_id` — "Orange Ball 2 session"

**Routing destination:**
- Sessions list: `/director/sessions`
- Specific session: `/director/sessions/{sessionId}`

**Current gaps:**
- Only "today's sessions" → `/director/sessions` routing implemented
- No specific session by date or name
- No group-session routing

---

## Entity 9 — Workflow / Goal

**Source:** `donnaWorkflowRegistry.ts` + `donnaGoalCompletionModel.ts` (sessionStorage)

**Display name:** Workflow label ("Review & Decide", "Player Placement", "Curriculum Improvement")

**Searchable triggers:** Workflow `triggerIntents` strings

**Routing destination:** Workflow `fallbackRoute`

**Current gaps:**
- Workflows are triggered by DONNA brain intent matching, not entity resolution
- "Resume my workflow" → `resumeMostRecentPaused()` (already handled in WorkflowRegistry)

---

## Current Resolution System — Gap Summary

| Entity | Exact Match | Partial | Nickname | Fuzzy | Page-Aware | Relationship | Notes |
|---|---|---|---|---|---|---|---|
| Player | ✓ | ✓ (first name) | ✗ | ✗ | ✗ | ✗ | Cap 30 |
| Coach | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Honest fallback only |
| Parent | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Not implemented |
| Group | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Not implemented |
| Curriculum Level | ✓ | ✓ | Partial | ✗ | ✗ | ✗ | HP1/OB2 gaps |
| Assessment | Partial | ✗ | ✗ | ✗ | ✗ | ✓ (per player) | Type-only gaps |
| Template | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | Cap 20 |
| Session | Partial | ✗ | ✗ | ✗ | ✗ | ✗ | Today only |

---

## Resolution Priority Order (V1 Entity Intelligence)

When multiple entity types could match the same input text:

1. **Curriculum level** — highest specificity (ball color patterns are unambiguous)
2. **Player by exact first name** — very common reference
3. **Player by nickname/alias** — "JJ", "Alex"
4. **Coach by explicit prefix** — "Coach Danny", "my head coach"
5. **Group** — "the Orange 2 group"
6. **Parent by relationship** — "Jake's parent", "Katrina" (parent context)
7. **Template** — "the Orange 2 template"
8. **Assessment** — "Jake's assessment", "placement assessment"
9. **Session** — "today's session"

When page context is available, preferred types for the current route are boosted.
