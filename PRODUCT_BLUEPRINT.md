# Academy OS — Product Blueprint

## Hierarchy

```
DIRECTOR  →  Command Center     "What needs my attention right now?"
COACH     →  Execution Layer    "What do I do today?"
PLAYER    →  Motivation Layer   "What am I working on?"
PARENT    →  Trust Layer        "Is my child progressing?"
```

The **Director Dashboard** is the central operating surface.  
The **Player Profile** is the central data object.  
The **Coach Session View** is the primary execution tool.  
Player and Parent views are simplified communication layers — full engine power, human-readable output.

---

## Design System

**Palette**
- Background: `#0A0A0A`
- Surface: `#111111` / `#1A1A1A`
- Border: `#222222`
- Accent: `#C8FF00` (electric lime)
- White: `#FFFFFF` (headlines, key states)
- Muted: `#555555`
- Alert red: `#FF3B30`
- Warning orange: `#FF9500`
- Positive green: `#30D158`

**Typography**
- Headlines: Inter 700 — tight tracking, white
- Body: Inter 400 — 14px, `#AAAAAA`
- Key numbers: `font-mono` — electric lime, large
- Labels: 11px uppercase, `#555`, letter-spacing wide

**Cards**
- `rounded-2xl border border-[#222] bg-[#111]`
- Hover: `border-[#C8FF0033]` with subtle lift
- Active: `shadow-[0_0_24px_#C8FF0022]`

**Motion**
- Page transitions: 150ms fade
- Card hover: 100ms ease-out
- Number changes: count-up animation (lime)
- Skeleton loading: dark pulse

---

## Language Rules

The system uses precise technical language internally. The UI translates it for humans. These mappings apply everywhere — cards, labels, messages, empty states.

| Internal term | Director UI | Coach UI | Player UI | Parent UI |
|---|---|---|---|---|
| signal | area to watch | flag | (hidden) | (hidden) |
| priority | focus area | focus | (hidden) | (hidden) |
| urgency: immediate | Action needed | Action needed | (hidden) | (hidden) |
| urgency: urgent | Needs attention | Needs attention | (hidden) | (hidden) |
| urgency: high | Check in | Check in | (hidden) | (hidden) |
| urgency: monitor | On track | On track | (hidden) | (hidden) |
| recommendation | What to do next | What to do next | (hidden) | (hidden) |
| overtraining_risk | Load warning | Load warning | (hidden) | (hidden) |
| reassessment_overdue | Assessment due | Assessment due | (hidden) | (hidden) |
| utr_regression | Competition results dropped | Results dipped | (hidden) | (hidden) |
| score_regression | Technical progress slipped | Progress slipped | (hidden) | (hidden) |
| curriculum_ready_to_advance | Ready to advance | Ready to advance | (hidden) | (hidden) |
| curriculum_skill_gap | Skill gap | Needs more work | (hidden) | (hidden) |
| decision_score | (never shown) | (never shown) | (never shown) | (never shown) |
| behavioral profile | (never shown directly) | Load sensitivity | (hidden) | (hidden) |
| prediction | Development outlook | (hidden) | (hidden) | (hidden) |
| cohort | Peer group | (hidden) | (hidden) | (hidden) |

---

## Operating Model

```
Voice creates  →  UI confirms  →  Database structures  →  System executes
```

The engine runs continuously. It produces outputs that humans confirm before execution. The UI never exposes the engine's internal mechanics — only its human-readable conclusions.

---

## Core Modules (user-facing names)

| Internal name | User-facing name | Who sees it |
|---|---|---|
| Director Command Center | Dashboard | Director |
| Coach Workspace | My Players / Today | Coach |
| Player Profile | (data object — not a named screen) | Staff only |
| Curriculum System | Pathway / Level | All roles (filtered) |
| Placement Engine | New Player Setup | Director |
| Exercise Library | Drill Library | Coach, Director |
| Session Templates + Live Sessions | Sessions | Coach, Director |
| Assessment Engine | Assessments | Director, Coach |
| Voice AI | Voice | Coach, Director |
| Competition Track | Competition | Director, Coach |
| Intelligence Layer | Intelligence | Director only |
| Parent + Player Comms | Updates / Messages | Player, Parent |

---

## The One Question Every Screen Must Answer

| Role | The question | How the UI answers it |
|---|---|---|
| Director | What needs my attention right now? | Three-section dashboard: Urgent / Decisions / Overview |
| Coach | What do I do today? | Today's session + max 3 focus items per player |
| Player | What am I working on? | Level badge + domain progress + today's focus sentence |
| Parent | Is my child doing well? | Level status + plain-language update + recent win |

---

## Complexity Rules

**Show by default:** Only what the user must act on today.  
**Hide by default:** Analytics, trends, history, secondary metrics.  
**Never show:** Internal model language, raw scores, signal names, behavioral profile fields, prediction confidence intervals.

The system is powerful. The interface is calm.
