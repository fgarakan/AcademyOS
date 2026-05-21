# DONNA Page Context Requirements

**Sprint:** 604A
**Date:** 2026-05-21
**Purpose:** Specifies the minimum context that each director route must provide to DONNA for full functionality. Used to plan context wiring in future fix sprints.

---

## Context object taxonomy

DONNA works with four context object types:

| Type | What it holds | Example |
|---|---|---|
| **AcademyContext** | Academy-wide signals — pending reviews, attention items, risks, session counts, wrap-up gaps | `loadDirectorDonnaContext()` output |
| **PlayerContext** | Single player — level, gates, priorities, observations summary | `donnaContextActions` `player_profile` type |
| **SessionContext** | Single session — coach, group, plan, attendance, wrap-up | `donnaContextActions` `session_detail` type |
| **CurriculumContext** | Level structure, coverage stats, requirements | `donnaContextActions` `curriculum_level` type |

---

## Route-by-route context requirements

### `/director/donna` — DONNA Hub

**DONNA functionality needed:** Full academy pulse, attention queue, recommended actions, chat shell.

**Context already loaded:** `loadDirectorDonnaContext()` — AcademyContext ✅

**Context gaps:**
- No player drill-down from this page (by design)
- No session drill-down from this page (by design)

**What to pass DONNA when a director asks about a specific player or session from the hub:**
- Resolve via `donnaObjectResolutionActions` → link to `/director/players/[id]` or `/director/sessions/[id]`
- Do not load full PlayerContext or SessionContext on the hub itself

**Required for full functionality:** AcademyContext already provided. ✅

---

### `/director` — Main Dashboard

**DONNA functionality needed:** KPI explanation, "what should I do first?", triage routing.

**Context already loaded:** Aggregate KPI cards (no DONNA context object)

**Context gaps:**
- DONNA has no awareness of which KPI card is in focus
- No per-player or per-session object available
- No recommended next action from DONNA

**What must be added:**
- Pass `AcademyContext` snapshot (already loadable via `loadDirectorDonnaContext`) to a new DONNA chip
- Add `DonnaWhatShouldIDoFirst` chip that summarizes top 3 priority actions
- Connect "urgent" signals to DONNA language

**Required for full functionality:**
```ts
// New component props (future sprint):
{
  academyContext: AcademyContext  // from loadDirectorDonnaContext()
}
```

---

### `/director/command-center` — Command Center

**DONNA functionality needed:** Command intake, object resolution, draft creation, weekly CoO report.

**Context already loaded:** `loadWeeklyCoOReport()` — partial AcademyContext ✅

**Context gaps:**
- Free-form NLU not available in V1 (deterministic pattern matching only)
- Player name resolution requires disambiguation when multiple matches exist

**What must be added for V2:**
- Named entity disambiguation step (director chooses player from candidates before DONNA drafts)
- Multi-turn command context (current command assumes stateless calls)

**Required for full V1 functionality:** Already has sufficient context for current scope. ⚠️ V2 needs disambiguation.

---

### `/director/review` — Review Queue

**DONNA functionality needed:** Queue summary, per-item rationale, approval/reject controls.

**Context already loaded:** `proposed_actions` queue data per type ✅

**Context gaps:**
- DONNA cannot answer follow-up questions about why it drafted a specific item
- No inline DONNA Q&A on draft cards

**What must be added:**
- Per-item DONNA rationale field stored in `proposed_actions.donna_rationale` (future DB enhancement)
- Inline Q&A chip on each draft card that calls `donnaContextActions` with item payload

**Required for full functionality:** Queue data is sufficient for current review flow. ✅

---

### `/director/players/[playerId]` — Player Profile

**DONNA functionality needed:** Player intelligence drafts, priority recommendation, gate evidence draft, parent guidance draft.

**Context already loaded:**
- `playerId` from URL params ✅
- Player object, curriculum state, gates, priorities, observations (all in page query) ✅
- DONNA draft buttons receive player data inline ✅

**Context gaps:**
- No DONNA chat shell — director cannot ask "DONNA, what should I do for this player today?"
- No DONNA inline explanation of why a gate is blocked

**What must be added:**
- `DonnaPlayerChatShell` component receiving `PlayerContext` object
- PlayerContext shape:
```ts
{
  playerId: string
  currentLevelId: string | null
  currentLevelName: string | null
  priorityCategory: string | null
  gateCount: number
  passedGateCount: number
  recentObservationTypes: string[]
}
```

---

### `/director/sessions/[sessionId]` — Session Detail

**DONNA functionality needed:** Session recap structuring, attendance exception, adjustment suggestions.

**Context already loaded:**
- `sessionId` from URL params ✅
- Session object, coach, group, attendance, wrap-up ✅

**Context gaps:**
- DONNA cannot explain the session's curriculum context (what level/domain this session covers)
- No DONNA narrative of planned vs. actual comparison

**What must be added:**
- Link from session to `curriculum_levels` context
- SessionContext shape:
```ts
{
  sessionId: string
  coachName: string
  groupName: string
  plannedPlayerCount: number
  actualAttendanceCount: number
  wrapUpComplete: boolean
  curriculumLevelId: string | null
}
```

---

### `/director/curriculum` — Curriculum Explorer

**DONNA functionality needed:** Level health explanation, coverage gap surfacing, override drafting.

**Context already loaded:**
- Curriculum structure tree ✅
- Health panel stats ✅

**Context gaps:**
- DONNA does not know which level the director is currently viewing in the tree
- Requirement detail is not in DONNA context

**What must be added:**
- Pass selected `levelId` to `CurriculumCustomizationAssistant` when director expands a level
- CurriculumContext shape:
```ts
{
  levelId: string
  levelName: string
  requirementCount: number
  averageCompletionPct: number
  coverageGaps: string[]
}
```

---

### `/director/level-up` — Level Advancement Pipeline

**DONNA functionality needed:** Explain why a player is ready or overdue; trigger level movement draft.

**Context already loaded:**
- Level-up pipeline data (player list, readiness scores) ✅

**Context gaps:**
- DONNA cannot explain why a specific player is overdue
- `donnaLevelMovementActions.ts` is not surfaced — director cannot trigger a level movement draft from this page
- No PlayerContext passed to DONNA when a row is selected

**What must be added:**
- Per-player DONNA expand row that calls `donnaContextActions` with `player_profile` type
- "Draft level advancement" button wired to `donnaLevelMovementActions.ts`
- PlayerContext: `{ playerId, currentLevelId, currentLevelName, gatePassedCount, gateTotal, readinessDaysOverdue }`

---

### `/director/placement` — Placement Engine

**DONNA functionality needed:** Suggest level/group based on assessment data; explain placement rationale.

**Context already loaded:**
- Pending player list ✅

**Context gaps:**
- DONNA cannot suggest a level or group from assessment answers
- No DONNA explanatory context for the director before confirming placement
- `placementDraftAction.ts` exists but no DONNA entry point visible in the UI

**What must be added:**
- DONNA placement suggestion chip after interview step
- PlacementContext shape:
```ts
{
  playerId: string
  assessmentAnswers: Record<string, string>
  candidateLevelIds: string[]
  candidateGroupIds: string[]
}
```

---

### `/director/kpi` — KPI Dashboard

**DONNA functionality needed:** Explain what each KPI means, why it's red, what action to take.

**Context already loaded:** None (KPI engine only)

**Context gaps:** All — DONNA has zero visibility into this page

**What must be added:**
- Wire `kpiExplainer.ts` (already in DONNA library) to a chip on each KPI card
- `groupKpiSummaryAction.ts` (already exists) to feed DONNA with computed group KPIs
- KpiContext shape:
```ts
{
  kpiName: string
  currentValue: number
  targetValue: number
  trend: 'up' | 'down' | 'flat'
  affectedGroupIds: string[]
}
```

---

### `/director/signals` — Development Signals

**DONNA functionality needed:** Narrate what each signal means, recommend which signals need director action.

**Context already loaded:** None (data display only)

**Context gaps:** All

**What must be added:**
- DONNA signal narrator chip: calls `donnaContextActions` with aggregated signal data
- SignalContext shape:
```ts
{
  signalType: 'attendance_drop' | 'wrap_up_gap' | 'lesson_signal'
  affectedPlayerCount: number
  affectedGroupIds: string[]
  severity: 'low' | 'medium' | 'high'
}
```

---

### `/director/coaches/[coachId]` — Coach Profile

**DONNA functionality needed:** Coach intelligence summary, wrap-up compliance context, session coverage summary.

**Context already loaded:** None

**Context gaps:** All — `donnaCoachIntelligenceAction.ts` exists but is not wired

**What must be added:**
- Wire `donnaCoachIntelligenceAction.ts` to a DONNA summary panel on the coach profile page
- CoachContext shape:
```ts
{
  coachId: string
  coachName: string
  sessionCount: number
  wrapUpCompliancePct: number
  avgPlayerCountPerSession: number
}
```

---

### `/director/fitness/templates/[templateId]` — Fitness Template Builder

**DONNA functionality needed:** Template block suggestions, session generation with approval gate.

**Context already loaded:**
- Template ID ✅
- Template object ✅

**Context gaps:**
- Session generation bypasses review queue (direct apply)

**What must be added:**
- Review gate on `GenerateSessionPanel` — route generated sessions through `proposed_actions` before creating `sessions` rows
- No new context object required; this is a process fix, not a context gap

---

## Context readiness summary

| Route | Context provided | Context gap | Fix complexity |
|---|---|---|---|
| `/director/donna` | AcademyContext ✅ | Minor — no drill-down | Low |
| `/director/review` | Queue data ✅ | Follow-up Q&A | Medium |
| `/director/review/[actionId]` | Item data ✅ | DONNA rationale field | Medium |
| `/director/command-center` | WeeklyReport ✅ | Disambiguation | Medium |
| `/director/players/[playerId]` | PlayerContext partial ✅ | Chat shell | Medium |
| `/director/sessions/[sessionId]` | SessionContext partial ✅ | Curriculum link | Low |
| `/director/curriculum` | CurriculumTree ✅ | Selected level context | Low |
| `/director/today` | AcademyContext ✅ | Drill-down routing | Low |
| `/director/level-up` | Pipeline data ✅ | PlayerContext per row | Medium |
| `/director/placement` | Player list ✅ | PlacementContext + action wiring | High |
| `/director/kpi` | None ❌ | Full KpiContext + action wiring | High |
| `/director/signals` | None ❌ | Full SignalContext + action wiring | High |
| `/director/coaches/[coachId]` | None ❌ | CoachContext + action wiring | Medium |
| `/director/fitness/templates/[id]` | Template ✅ | Process fix (review gate) | Low |
| `/director/curriculum/builder` | None ❌ | Full BuilderContext | High |
