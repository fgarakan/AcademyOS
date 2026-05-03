# Role-Aware Chat Guardrails

**Sprint:** 221
**Date:** 2026-05-03
**Status:** V1 — guardrails defined. Lightly integrated into Command Center and Player Q&A.

---

## Purpose

Every role in Academy OS has different responsibilities, knowledge, and data access rights.
The guardrail layer ensures that:
- Players cannot see other players' data or coach-internal notes.
- Parents receive only approved, parent-safe content.
- Coaches can use session and curriculum tools but not manage players directly.
- Directors have full read access but all mutations still require approval.
- Nothing executes automatically — AI proposes, director approves.

---

## Role permission matrix

| Role | Can create drafts? | Can query players? | Can see coach notes? | Can see assessment scores? |
|---|---|---|---|---|
| platform_owner | Yes (all) | Yes | Yes | Yes |
| academy_director | Yes | Yes | Yes | Yes |
| head_coach | Yes (session/note) | Yes | Yes | Yes |
| coach | No | No | Own sessions only | No |
| player | No | Own data only | No | No |
| parent | No | Own child only | No | No |

---

## Intent permission map

### Director + Head Coach
- `show_players_missing_curriculum_level`
- `show_curriculum_gap_suggestions`
- `show_advancement_eligible`
- `create_session_draft` (approval required)
- `create_group_draft` (director only, approval required)
- `record_director_note` (approval required)
- `ask_curriculum_level_requirements`
- `summarize_reassessment_pipeline`

### Coach
- `ask_curriculum_level_requirements`
- `unknown` (fallback)

### Player
- `current_level`
- `next_level`
- `level_requirements`
- `what_to_practice`
- `level_meaning`
- `unknown` (fallback)

### Parent
- `ask_child_current_focus`
- `ask_how_to_support`
- `ask_session_attendance`
- `unknown` (fallback)

---

## Approval-required intents

The following intents always create a pending draft — nothing executes until the director approves it:

- `create_session_draft`
- `create_group_draft`
- `record_director_note`

Query intents never create drafts. They return read-only results.

---

## Field/category exposure matrix

| Data category | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| player_profile | ✓ | ✓ | ✗ | Own only | ✗ |
| curriculum_level | ✓ | ✓ | ✓ | Own only | Own child only |
| curriculum_gates | ✓ | ✓ | ✓ | Own level | ✗ |
| curriculum_drills | ✓ | ✓ | ✓ | Own level | ✗ |
| coach_language | ✓ | ✓ | ✓ | Own level | ✗ |
| coach_observations | ✓ | ✓ | Own only | ✗ | ✗ |
| session_data | ✓ | ✓ | Own sessions | ✗ | ✗ |
| priorities | ✓ | ✓ | ✗ | ✗ | ✗ |
| assessment_scores | ✓ | ✓ | ✗ | ✗ | ✗ |
| attendance | ✓ | ✓ | ✓ | ✗ | Own child only |
| parent_safe_drafts | ✓ | ✗ | ✗ | ✗ | Own child only |
| voice_commands | ✓ | ✗ | ✗ | ✗ | ✗ |
| proposed_actions | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Safe response boundaries

Each role has a single-sentence summary of what the system will and will not do for them.
Source: `getSafeResponseBoundary(role)` in `src/lib/commands/roleGuardrails.ts`.

| Role | Boundary |
|---|---|
| academy_director | Can query all academy data, create drafts, and approve actions through the review queue. |
| head_coach | Can query player and session data, create session drafts. Approval required for level changes. |
| coach | Can view curriculum guidance, session data, and attendance. Cannot create drafts or access player records. |
| player | Can ask questions about own level, requirements, and what to practice. No access to other players or internal notes. |
| parent | Can ask about session attendance, skill focus, and how to support. No access to coach notes or other players. |

---

## Parent and player privacy rules

### Always enforced — cannot be overridden:
- Coach observations are never shown to players or parents.
- Assessment scores are never shown to players or parents.
- Raw voice note transcripts are never parent/player-facing.
- `proposed_actions` payloads are never shown to players or parents.
- No player's data may be exposed to another player or their parent.

### Player-safe data only:
- `curriculum_level.display_name`
- `curriculum_level.stage`
- `curriculum_gates.criterion` (for own level)
- `curriculum_drills.name` + `objective` (for own level)
- `curriculum_coach_language.current_focus` (for own level)

### Parent-safe data only:
- `player.full_name`, `player.first_name`
- `player.curriculum_level_display_name`
- `session_attendance.status`
- `parent_safe_draft` content (explicitly authored for parents)

---

## Child-safety principles

1. Never compare a player to teammates or a ranking percentile.
2. Never present a player's deficits or gaps to their parent without a positive framing.
3. Never expose a player's medical or physical assessment data to parents without explicit approval.
4. Junior players (under 18) must never receive content that causes anxiety about performance ranking.

---

## Audit log requirements (future)

When a role-guardrailed action is attempted but blocked:
- Log the attempt to `audit_logs` (future requirement — not yet implemented).
- Include: role, intent_type, blocked_reason, timestamp.

When a cross-role data request is attempted:
- Block at the query layer via RLS (already enforced by Supabase policies).
- Never rely on application-layer guardrails alone for security — RLS is the enforcement mechanism.

---

## Helper location

```
src/lib/commands/roleGuardrails.ts
```

Exports:
- `type SupportedRole`
- `canRoleUseIntent(role, intentType)` — boolean
- `intentRequiresApproval(intentType)` — boolean
- `canExposeFieldToRole(role, fieldOrCategory)` — boolean
- `getBlockedReason(role, intentType)` — string | null
- `getSafeResponseBoundary(role)` — string
- `getRoleDisplayName(role)` — string
