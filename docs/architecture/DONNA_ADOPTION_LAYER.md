# DONNA Adoption Layer Architecture

**Sprint:** Mega Sprint 1156-1165
**Date:** 2026-06-02

## Goal

Make DONNA the default way directors use AcademyOS.

```
Before: User clicks through screens → finds data → interprets manually
After:  User asks DONNA → DONNA answers → DONNA proposes next action → User confirms
```

## Components Created

### DonnaSuggestedQuestions
`src/components/donna/DonnaSuggestedQuestions.tsx`

Page-specific question chips. Configuration-driven: each route has 3-5 pre-set questions.
Clicking a chip fires the question into the adjacent command bar.

Routes configured:
- `/director` — "What needs my attention today?", reassessment, parent updates, stalled
- `/director/players` — stalled, ready to move up, overdue assessment, missing level
- `/director/players/[id]` — why this level, blocking, coach focus, parent summary
- `/director/review` — what to review first, high risk items, parent updates
- `/director/sessions` — missing wrap-ups, watch-fors
- `/director/curriculum` — curriculum gaps, blocked players
- `/director/kpi` — academy attention, overloaded groups

### DonnaCommandSection
`src/components/donna/DonnaCommandSection.tsx`

Wrapper that combines `DonnaSuggestedQuestions` + `DonnaCommandBar` with shared state.
Clicking a chip auto-submits the question to the command bar.

Usage: `<DonnaCommandSection pagePath="/director/players" playerId={id} />`

### DonnaFirstGreeting
`src/components/donna/DonnaFirstGreeting.tsx`

Today page greeting that lists real urgent items:
- Pending wrap-ups
- Players needing placement
- Players needing attention
- Players ready to advance
- Pending parent updates

Falls back to "Academy looks calm today" when nothing urgent.

### DonnaCommandBar (updated)
Added `triggerQuestion` + `onTriggered` props.
When `triggerQuestion` changes, auto-submits and calls `onTriggered()` to clear it.
Enables external triggering from suggested question chips.

## Pages Wired

| Page | Sprint | How wired |
|---|---|---|
| Director Dashboard (`/director`) | 1156 | DonnaFirstGreeting + DonnaScreenBriefStatic + DonnaCommandSection |
| Players List (`/director/players`) | 1156 | DonnaScreenBriefStatic + DonnaCommandSection |
| Player Profile (`/director/players/[id]`) | 1156 | DonnaCommandSection with player-scoped questions |
| Review Queue (`/director/review`) | 1156 | DonnaCommandSection after DonnaReviewBriefPanel |

## DONNA Analytics (`/director/donna-analytics`)

Internal director page. Reads from `donna_events` table:
- Most used intent types (bar chart)
- Pages where DONNA is used most
- Unrecognised questions (product gap discovery)

Graceful fallback when donna_events table not present.

## Habit formation patterns (Phase 7)

Constitution brief + greeting + suggested questions = the nudge pattern:
1. Brief tells you what matters (DonnaScreenBriefStatic)
2. Greeting names the specific items (DonnaFirstGreeting)
3. Chips show you how to ask (DonnaSuggestedQuestions)
4. Command bar receives and answers (DonnaCommandBar)

No additional nudge spam needed — the structure itself trains the habit.
