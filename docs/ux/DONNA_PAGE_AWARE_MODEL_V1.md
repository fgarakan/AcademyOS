# DONNA Page-Aware Model V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Define DONNA's exact behavior on every major director route.

---

## How Page Awareness Works

When a director navigates to a new route:

1. `DonnaSessionContextProvider` receives the new pathname via `usePathname()`
2. Page-level DONNA components (briefs, registrars) update the shared session context
3. The floating `DonnaAssistantButton` reads the updated context
4. The next DONNA interaction is page-aware without any director action

The director does not need to tell DONNA which page they are on. DONNA knows.

---

## Route-by-Route DONNA Behavior

---

### `/director` — Daily COO Brief

**Brief component:** `DirectorTodayDonnaBrief`
**Shell context:** Academy-wide overview

**DONNA knows on this page:**
- Pending review count
- Active session count
- Player attention risk count
- Curriculum bottleneck level
- Top priority action from the attention report

**DONNA brief content:**
- Line 1: Academy status (review queue, player risk, or curriculum blocker — whichever is most critical)
- Line 2: The single best next action
- CTA: Deep link to the most critical action

**DONNA shell behavior when opened:**
- Greets director by name
- Surfaces the top 2–3 items from the attention report
- Offers to walk through the review queue or the highest-priority player
- Suggested questions: "What needs my attention today?" / "Walk me through the review queue."

**DONNA does NOT do:**
- List all pending items
- Show raw KPI values
- Repeat what the KPI tiles already show

---

### `/director/today` — Priority Brief

**Brief component:** `DonnaTodayBriefPanel`
**Shell context:** Daily focus — sessions, attendance, attention risks

**DONNA knows on this page:**
- Today's session schedule
- Active sessions
- Attendance risks from today
- Player attention signals from the risk loader

**DONNA brief content:**
- The single most important player or operational signal today
- Why it matters (timing or consequence)
- CTA: Link to the player, session, or action

**DONNA shell behavior when opened:**
- Focuses on today's schedule
- Can walk through each active session's status
- Surfaces attendance exceptions ready for review
- Suggested questions: "What's happening in today's sessions?" / "Any attendance issues today?"

**DONNA does NOT do:**
- Summarize the week (that's the homepage)
- Show curriculum health (that's the curriculum page)

---

### `/director/curriculum` — Curriculum Brief

**Brief component:** `DonnaCurriculumBrief`
**Shell context:** Curriculum health + the most blocked level

**DONNA knows on this page:**
- Curriculum ranking (levels sorted by stall severity)
- Version status (active / draft / not started per level)
- Bottleneck level and its gate blocker

**DONNA brief content:**
- The most blocked level by name + the stall count + average days stalled
- The specific gate causing the blockage
- CTA: Opens `?improve=[levelKey]` for that level

**DONNA shell behavior when opened:**
- Leads with the curriculum bottleneck
- Can walk through all levels by stall severity
- Can draft a curriculum improvement proposal for any level
- Can explain why a specific gate threshold may need adjustment
- Suggested questions: "Walk me through curriculum health." / "Which level needs the most attention?"

**DONNA does NOT do:**
- Show level content (that's the curriculum explorer UI)
- Edit levels directly (human approves all changes)
- Rate overall curriculum as "good" or "bad" without specific evidence

---

### `/director/review` — Review Queue Brief

**Brief component:** `DonnaReviewBriefPanel`
**Shell context:** Review queue — counts, expiry, risk levels

**DONNA knows on this page:**
- Total pending count
- Item with earliest expiry
- Items with highest risk flag
- Tab-specific context via `DonnaReviewTabGuide`

**DONNA brief content:**
- Total queue count + the single item that needs review first
- Why that item is first (expiry date, risk level, or impact)
- CTA: Jumps to that specific item in the queue

**DONNA shell behavior when opened:**
- Pre-ranks the queue: "I'd start with [item] because [reason]."
- Can explain any item's risk level or context
- After each approval: "X more in queue. Next is [item]."
- Suggested questions: "Help me clear the review queue." / "Which item should I review first?"

**DONNA does NOT do:**
- Approve items automatically
- Summarize item content (that's the review card UI)
- Show all 8 tab counts simultaneously

---

### `/director/players` — Player Population Brief

**Brief component:** `DonnaScreenBriefStatic`
**Shell context:** Player population — risk signals, missing levels, assessment gaps

**DONNA knows on this page:**
- Players without curriculum level assigned
- Players with attention risk signals
- Players overdue for assessment
- Placement queue size

**DONNA brief content:**
- The most actionable population signal (missing levels or attention risk)
- Count + consequence of leaving it unresolved
- CTA: Placement Engine or player filter

**DONNA shell behavior when opened:**
- Can list specific players with attention signals
- Can explain why each player is flagged
- Can initiate placement for unplaced players
- Suggested questions: "Which players need attention?" / "Show me players without a level."

**DONNA does NOT do:**
- Show individual player notes to other players or coaches
- List all 40 players
- Make level assignment decisions (director approves)

---

### `/director/players/[playerId]` — Player Profile Context

**Brief component:** None (brief is implicit in profile content)
**Shell context:** Specific player — progress, signals, priorities, gate evidence

**DONNA knows on this page:**
- Player's current curriculum level
- Gate completion status
- Recent attendance
- Assessment history
- Development priorities
- Any DONNA-drafted proposals for this player

**DONNA shell behavior when opened:**
- Context-loaded for this specific player
- Can explain the player's stall status, if any
- Can draft a parent update, level readiness assessment, or coach communication
- Can walk through the player's gate evidence
- Suggested questions: "What's going on with [player name]?" / "Draft a parent update for [player name]."

**PlayerProfileDonnaRegistrar:** Registers player ID, name, and level into `DonnaSessionContextProvider` so the floating shell is pre-loaded for this player.

**DONNA does NOT do:**
- Show the player their own profile (this is the director view)
- Expose coach notes to parents
- Make level advancement decisions autonomously

---

### `/director/sessions` — Session Brief

**Brief component:** Inline session context (no dedicated brief component yet)
**Shell context:** Session list — today's sessions, wrap-up status

**DONNA knows on this page:**
- Sessions scheduled today
- Sessions with missing wrap-ups
- Sessions approaching deadline

**DONNA shell behavior when opened:**
- Surfaces sessions with expiring wrap-up windows
- Can walk through a specific session's recap
- Suggested questions: "Which sessions need wrap-ups?" / "Show me today's session summary."

---

### `/director/templates` — Template Brief

**Brief component:** `TemplatesDonnaPanel`
**Shell context:** Template health — curriculum linkage, usage frequency

**DONNA knows on this page:**
- Templates without curriculum level assigned
- Templates with low usage
- Templates recently modified

**DONNA brief content:**
- Most actionable template gap (curriculum level missing)
- Count + consequence
- CTA: Template assignment flow

---

### `/director/donna` — Full DONNA Shell Page

**This route IS the full DONNA experience.**

- No page brief (the whole page is DONNA)
- `DonnaVoiceReadyShell` renders the complete DONNA interface
- Full conversation thread, voice input, all intelligence modules available
- Director can ask anything; DONNA has full academy context

---

## Context Inheritance Rules

When DONNA is active in the floating shell and the director navigates:

| From → To | DONNA behavior |
|---|---|
| Any page → Player profile | DONNA loads player context; can continue any in-progress conversation about that player |
| Player profile → Curriculum | DONNA retains player context; can surface curriculum relevance for that player |
| Curriculum → Review | DONNA retains curriculum bottleneck context; can surface curriculum-related review items first |
| Any page → `/director/donna` | DONNA opens full shell with full academy context; conversation history preserved |
| Full reload | DONNA context resets; page brief re-establishes context |

---

## Page Context Priority Order

When DONNA receives a query and must decide which context to use:

1. **Active entity context** — If a player, session, or template is registered, use it
2. **Page context** — Use the current route's known intelligence layer
3. **Academy context** — Fall back to academy-wide signals
4. **Empty state** — "I don't have enough data yet — more sessions will help."

DONNA never invents context. If it does not know, it says so.
