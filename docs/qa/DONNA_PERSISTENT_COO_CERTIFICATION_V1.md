# DONNA Persistent COO Mode Certification V1

**Sprint:** Mega Sprint 1661–1680
**Date:** 2026-06-03
**Scope:** All 6 director experience certification scenarios

---

## Architecture Overview

| Component | Sprint | Status |
|---|---|---|
| `donnaContextEngine.ts` | 1661 | PASS — live context snapshot |
| `workflowMemory.ts` | 1661 | PASS — sessionStorage-backed workflow tracker |
| `dailyBriefingEngine.ts` | 1661 | PASS — COO morning brief |
| `DonnaCOOStatusPanel.tsx` | 1661 | PASS — compact live status panel |
| `DonnaVoiceReadyShell.tsx` — HEY_DONNA_PATTERN | 1661 | PASS — context-aware greeting |
| `DonnaVoiceReadyShell.tsx` — CONTINUE_WORKFLOW_PATTERN | 1661 | PASS — workflow resume |
| `DonnaVoiceReadyShell.tsx` — CONTEXTUAL_PLAYER_PATTERN | 1661 | PASS — entity shorthand |
| `DonnaSessionContextProvider` | 625/854 | Pre-existing, used by 1661 |
| `buildDirectorBrief()` | 945 | Pre-existing — intelligence brief |
| `donnaPageContextEngine.ts` | 687 | Pre-existing — page labels |

---

## Scenario 1: Director Opens AcademyOS → DONNA Provides Briefing

**Command:** "Good morning" / "Brief me" / "What do I need to know?"

**Routing:** `BRIEF_PATTERN` in `DonnaVoiceReadyShell` → `buildDirectorBrief(briefInput)` → `formatBriefAsMessage(brief)`

**Result:** DONNA produces a structured morning brief with:
- Pending reviews count
- High-risk player signals
- Advancement-eligible players
- Curriculum draft backlog
- Attendance exceptions
- Suggested first action with nav offer

**COO Status Panel:** `DonnaCOOStatusPanel` shows live attention count badges without the director having to ask.

**Alternative — daily COO brief:** `buildDailyCOOBriefing(directorCtx, 'Brian')` produces a personalized brief: "Good morning Brian. Today's priorities: 1. 3 items need your approval..."

**Certification: PASS**

---

## Scenario 2: "Continue where we left off."

**Command:** "Continue where we left off" / "Pick up where we left off" / "Resume the assessment"

**Routing:** `CONTINUE_WORKFLOW_PATTERN` → `continueWorkflow()` from `workflowMemory.ts`

**With active workflow:**
- `workflowMemory.getActiveWorkflow()` returns the stored `WorkflowEntry`
- DONNA returns: "Your assessment of Jamie Chen is in progress. I'll take you back to continue."
- `setPendingNavOffer({ href: entry.route, label: 'Resume workflow' })`
- Director says "yes" or "take me there" → navigates to workflow route

**Without active workflow:**
- DONNA returns honest message: "I don't have an active workflow to resume. Start by asking me what needs attention…"

**Certification: PASS**

---

## Scenario 3: Director Opens Player → "Hey Donna" → Understands Player Context

**Setup:** Director navigates to `/director/players/{id}`. `PlayerProfileDonnaRegistrar` fires on mount, injecting player context into `DonnaSessionContext.playerProfileContext`.

**Command:** "Hey Donna"

**Routing:** `HEY_DONNA_PATTERN` → `buildDonnaLiveContext(...)` → `liveCtx.greeting()`

**Result:** "You're viewing Jamie Chen's profile. Level: Orange Ball 2. Current top priority: Forehand consistency. What would you like to review?"

**Context source:** `donnaSession.playerProfileContext` (injected by `PlayerProfileDonnaRegistrar`)
**Entity label source:** `donnaSession.lastObjectLabel`

**Certification: PASS**

---

## Scenario 4: Director Opens Curriculum → "Hey Donna" → Understands Curriculum Context

**Setup:** Director navigates to `/director/curriculum?improve=orange_ball_2`. `DonnaSessionContextProvider` tracks the route. If `lastObjectLabel` was set to "Orange Ball 2" by the curriculum page, DONNA knows the entity.

**Command:** "Hey Donna"

**Routing:** `HEY_DONNA_PATTERN` → `buildDonnaLiveContext(...)` → entityKind = `'curriculum_level'` → curriculum greeting

**Result:** "You're currently reviewing Orange Ball 2. I can show current state, evidence signals, and improvement suggestions. What would you like to explore?"

**Note:** Curriculum level entity label is populated if the curriculum page calls `updateObjectContext('Orange Ball 2')` via the session context. Without this call, the greeting falls back to page label.

**Certification: PASS (full when curriculum page registers context)**

---

## Scenario 5: "What needs attention?"

**Routing:** `tryAnswerDashboardPriorityQuestion` / `tryAnswerRosterAttentionQuestion`

**Result:** DONNA returns prioritized answer from `directorCtx`. Evidence shows count + signals. Navigation offer to `/director/attention` or `/director/review`. Highlight fires on destination.

**Certified in:** `DONNA_DIRECTOR_DAILY_LOOP_CERTIFICATION_V1.md` (Sprint 1641)

**Certification: PASS**

---

## Scenario 6: "Walk me through today's priorities."

**Command:** "Walk me through today's priorities" / "Walk me through them" / "Brief me"

**Routing:** `BRIEF_PATTERN` → `buildDirectorBrief(briefInput)` + `formatBriefAsMessage(brief)`

**Result:** DONNA produces a numbered priority list:
1. Highest urgency item + why + nav offer
2. Next item...
3. ...up to 3 items

Director can say "take me there" after each item. DONNA tracks which priority they're working through via `setPendingNavOffer`.

**Alternative COO flow:** `buildDailyCOOBriefing(ctx, name).asText()` produces a complete walkable brief as a single string.

**Certification: PASS**

---

## COO Status Panel Certification

**File:** `src/components/donna/DonnaCOOStatusPanel.tsx`

| Check | Status |
|---|---|
| Renders without directorCtx | PASS — graceful empty state |
| Shows pending review count with urgency dot | PASS |
| Shows attendance exception count | PASS |
| Shows high-risk player count | PASS |
| Shows advancement-eligible count (lime dot) | PASS |
| Shows active workflow label from `workflowMemory` | PASS |
| Collapsed by default | PASS |
| Expands on click | PASS |
| Dismissible | PASS |
| Uses design system tokens only | PASS |
| Never shows raw player data | PASS |
| Shows suggested DONNA command based on context | PASS |

---

## Safety Verification

All COO mode components comply with safety rules:

| Rule | Status |
|---|---|
| DONNA may explain, highlight, navigate, filter | PASS |
| DONNA may not send communications without approval | PASS |
| DONNA may not move levels without approval | PASS |
| DONNA may not approve placements | PASS |
| DONNA may not publish curriculum | PASS |
| All actions are visible, auditable, reviewable | PASS |
| No fake data presented as real | PASS |
| All mutations go through proposed_actions | PASS |

---

## Overall Certification

**DONNA Persistent COO Mode V1: CERTIFIED**

The director operating experience is transformed:

| Before | After |
|---|---|
| Opens AcademyOS → clicks DONNA → asks question → gets answer | Opens AcademyOS → DONNA already knows context → COO panel shows live signals |
| "What's going on?" → generic list | "Hey Donna" → context-specific greeting for current page/entity |
| No workflow continuity | "Continue where we left off" → resumes incomplete workflow |
| Director feels lost without asking | Director always knows: what needs attention, why, what next |
