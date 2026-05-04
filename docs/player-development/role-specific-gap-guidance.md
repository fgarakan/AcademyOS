# Role-Specific Gap Guidance

**Sprint:** 234
**Last updated:** 2026-05-04
**Status:** V1 — deterministic translation of detected gaps into role-appropriate guidance

---

## Purpose

Training and knowledge gaps detected by Sprints 232–233 are factual observations.
They say *what* is missing but not *what to do about it*.

Role-specific gap guidance translates each detected gap into:
- A concrete **action** written for the recipient role
- A **rationale** explaining why it matters
- A **priority** (`act_now`, `monitor`, or `informational`)

Director and coach speak different operational languages.
The same gap produces different guidance for each role.

---

## Helper location

```
src/lib/gaps/roleSpecificGapGuidance.ts
```

Exports:
- `buildRoleSpecificGapGuidance(input: RoleGapGuidanceInput): RoleSpecificGapGuidance`
- `buildDirectorGapGuidance(player_id, training_gaps, knowledge_gaps): RoleSpecificGapGuidance`
- `buildCoachGapGuidance(player_id, training_gaps, knowledge_gaps): RoleSpecificGapGuidance`

Pure helper — no DB calls, no AI, no writes, no side effects.

---

## Input

```typescript
interface RoleGapGuidanceInput {
  player_id: string
  role: GapGuidanceRole         // 'director' | 'coach'
  training_gaps: IdpTrainingGap[]   // from detectTrainingGaps()
  knowledge_gaps: IdpKnowledgeGap[] // from detectKnowledgeGaps()
}
```

Caller is responsible for fetching and detecting gaps first.
This helper performs no detection — it only translates.

---

## Output

```typescript
interface RoleSpecificGapGuidance {
  role: GapGuidanceRole
  player_id: string
  top_action: string | null       // First act_now action, or first monitor if no act_now
  items: GapGuidanceItem[]        // All guidance items, sorted act_now → monitor → informational
  act_now: GapGuidanceItem[]
  monitor: GapGuidanceItem[]
  informational: GapGuidanceItem[]
}

interface GapGuidanceItem {
  gap_type: string
  source: GapGuidanceSource       // 'training' | 'knowledge'
  action: string                  // What to do — written for the specific role
  rationale: string               // Why this matters
  priority: GapGuidancePriority   // 'act_now' | 'monitor' | 'informational'
  domain: string | null
}
```

---

## Priority tiers

| Priority | When | Example |
|---|---|---|
| `act_now` | Immediate attention required — development or safety risk | Overload flag active; zero sessions this week; no curriculum level assigned |
| `monitor` | No immediate action, but watch closely | Single session this week; two absences; no drills available |
| `informational` | Useful context — act when convenient | Load declining; domain imbalance (low severity); no module domain match |

`top_action` is the first `act_now` item, or the first `monitor` item if no `act_now` exists.

---

## Role mapping: training gaps

| gap_type | Director guidance | Coach guidance |
|---|---|---|
| `overload_risk` (high) | Reduce intensity; schedule recovery | Reduce session intensity today |
| `overload_risk` (medium) | Monitor load in next 2–3 sessions | Choose recovery-friendly drills |
| `low_session_frequency` (high) | Review attendance records; contact family | Note gap; confirm next session |
| `low_session_frequency` (medium) | Review schedule; target 2–3 sessions/week | Reinforce value of consistent attendance |
| `high_absence_rate` (high) | Contact family; review for pattern | Flag to director; follow up on return |
| `high_absence_rate` (medium) | Monitor attendance; flag if continued | Note in recap; watch for pattern |
| `domain_imbalance` (Fitness, medium) | Add fitness session to schedule | Include conditioning block today |
| `domain_imbalance` (Fitness, low) | Add fitness exposure (informational) | Introduce fitness element (informational) |
| `domain_imbalance` (Competition) | Schedule match-play scenario | Add competitive element today |
| `undertraining` | Review scheduling; player below minimum load | Prioritize highest-impact gate criteria |
| `gate_evidence_exposure` | Increase frequency for gate opportunities | Target open gates in today's drills |
| `load_declining` | Confirm if planned or unintended | Check player energy at session start |
| `insufficient_data` | *(no guidance — no data to act on)* | *(no guidance)* |

---

## Role mapping: knowledge gaps

| gap_type | Director guidance | Coach guidance |
|---|---|---|
| `no_curriculum_level` | Assign a curriculum level immediately (act_now) | Ask director to assign a level (act_now) |
| `insufficient_data` | Complete curriculum configuration (act_now) | Check with director on setup (monitor) |
| `no_coach_language` | Add coaching cues in curriculum settings (monitor) | Use general principles for now (informational) |
| `no_drills_available` | Add drills in curriculum builder (monitor) | Source or adapt drills (informational) |
| `domain_gap_cluster` | Review gate distribution for balance (informational) | Introduce varied domain work (monitor) |
| `many_open_gates` | Prioritize top 2–3 gates with coach (monitor) | Focus on 2–3 gates per session (act_now) |
| `no_module_domain_match` | Add aligned learning module (informational) | Suggest aligned content to director (informational) |

---

## Examples

### Director: player with overload flag and no curriculum level

Input:
- `training_gaps`: `[{ gap_type: 'overload_risk', severity: 'high', domain: 'Fitness' }]`
- `knowledge_gaps`: `[{ gap_type: 'no_curriculum_level', severity: 'high' }]`

Output:
```
top_action: "Reduce session intensity this week and schedule a recovery block."

act_now:
  - Reduce session intensity this week and schedule a recovery block. [training, Fitness]
  - Assign a curriculum level to this player in the player profile. [knowledge]

monitor: (none)
informational: (none)
```

### Coach: player with many open gates and low session frequency

Input:
- `training_gaps`: `[{ gap_type: 'low_session_frequency', severity: 'medium' }]`
- `knowledge_gaps`: `[{ gap_type: 'many_open_gates', severity: 'low' }]`

Output:
```
top_action: "Focus on 2–3 gates per session — avoid spreading attention too thin."

act_now:
  - Focus on 2–3 gates per session — avoid spreading attention too thin. [knowledge]

monitor:
  - Reinforce the value of consistent attendance with the player. [training]

informational: (none)
```

---

## UI component

`src/components/player/GapGuidanceSummaryCard.tsx`

Props: `{ guidance: RoleSpecificGapGuidance }`

Displays:
- Role label ("Director internal" / "Coach internal")
- Top action in a lime-bordered highlight box
- All items grouped by priority with icon, source badge, domain badge
- Empty state when no gaps detected

Director/coach-facing only. Card is never rendered in player or parent views.

---

## Role visibility

| Role | What they see |
|---|---|
| Director | All guidance items — planning, scheduling, curriculum, evidence |
| Coach | All guidance items — session focus, watch-fors, recap prompts |
| Player | No gap guidance — gaps inform `what_to_understand` indirectly via IDP |
| Parent | No gap guidance — parent view is gap-free |

---

## Safety rules

1. Never expose gap guidance to player or parent views.
2. Never reference raw coach notes, session transcripts, or internal staff names.
3. Never use shame or deficit language to describe a player's performance.
4. `top_action` is informational only — no action is triggered automatically.
5. No product or tool names in any guidance text.
6. `insufficient_data` training gaps produce no guidance item — null is a valid result.
7. Unknown `gap_type` values return `null` — helper does not throw on unrecognized types.

---

## What must not happen automatically

- Gap guidance must not trigger notifications, emails, or messages.
- Gap guidance must not modify any player record, attendance log, or curriculum assignment.
- Gap guidance must not be surfaced to parent or player views under any condition.
- Director or coach must act on guidance manually. The system only informs, never acts.

---

## Future integration points

- **Sprint 237**: Wire gap guidance into coach session workspace
- **Sprint 238**: Show `GapGuidanceSummaryCard` in player profile IDP panel (director/coach tab only)
- **Sprint 240+**: Session pre-brief: surface `coach` guidance before a session starts
- **Sprint 242+**: Weekly director digest: aggregate guidance across all players with act_now items
