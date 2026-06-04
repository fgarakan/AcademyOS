# DONNA vs UI Responsibility Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** For every major screen, define the boundary between what the UI should show and what DONNA should do.

---

## Design Principle

**The smarter DONNA gets, the simpler the UI gets.**

Current state: the UI shows data and DONNA echoes it.
Target state: DONNA explains what matters and the UI confirms it.

The goal is not to hide data — it is to hide data that the director doesn't need until they ask. DONNA decides what surfaces. The UI confirms and executes.

---

## Responsibility Categories

| Category | Owner | Description |
|---|---|---|
| **UI shows** | UI | Data that must always be visible for trust and confirmation |
| **DONNA explains** | DONNA | Context, reasons, and interpretation of data |
| **DONNA decides** | DONNA | Which items need attention and in what order |
| **DONNA guides** | DONNA | Walkthrough of complex multi-step actions |
| **Director approves** | Director | Final decision — never automated |

---

## Screen-by-Screen Responsibility Split

### `/director` — Dashboard

**UI should show:**
- Date and greeting (1 line)
- Academy name
- Count of pending approvals (single number, with urgency color)
- Count of players needing attention (single number)
- Count of sessions today (single number)
- Primary action button (goes to review queue or most urgent item)

**DONNA should explain:**
- Why there are pending approvals ("Coach Maria submitted 2 wrap-ups. 1 has an attendance exception that needs your review.")
- Why players need attention ("2 players are on hold. 1 has been in the same curriculum level for 6 months.")
- Whether the academy is healthy overall ("No urgent signals today. Academy is running normally.")

**DONNA should decide:**
- Which item in the review queue is most urgent
- Whether the director needs to act immediately or can wait
- Whether attendance signals are concerning or normal variation

**DONNA should guide:**
- First-time directors through the onboarding flow
- Directors back to a critical review item they haven't addressed in 3+ days

**Director approves:**
- All approvals in the review queue (never auto-approved)
- Curriculum changes
- Level movements
- Parent communications

---

### `/director/review` — Review Queue

**UI should show:**
- Total count of pending items (with urgency breakdown)
- Each item: who submitted, when, what type
- Decision controls: Approve / Reject / Ask for Clarification
- Status after decision: Approved / Rejected / Pending

**DONNA should explain:**
- Per-item pre-reading: "This wrap-up from Coach Sarah describes a 45-minute session with Orange 2. She flagged Lucas for missing serves. Recommend: approve."
- Why a particular item is high priority: "This attendance exception should be resolved today — the affected player's parent asked yesterday."
- What the risk of rejection is: "Rejecting this curriculum draft will leave Level 3 without fitness content for another sprint."

**DONNA should decide:**
- Item sort order (urgency-first, not type-first)
- Which items can be batch-approved safely ("These 3 wrap-ups are routine — DONNA recommends approving all. Review individually if you want.")
- Whether a rejection needs context before sending back to the coach

**DONNA should guide:**
- Directors through the review of complex items (multi-step placement decisions)
- Directors on their first review queue item

**Director approves:**
- Every single item in the queue — no exceptions
- "Batch approve DONNA suggestions" must still be one explicit director action

---

### `/director/players/[playerId]` — Player Profile

**UI should show:**
- Player name, level, status badge
- Last session date
- Current curriculum level (with link to change)
- DONNA's 2-sentence brief about this player
- Tab navigation (Overview / Skill Path / Competition / Fitness / Notes)
- Tab content on demand

**DONNA should explain:**
- "This player has been at Orange Ball Level 2 for 6 months. That's longer than typical. The stall is in backhand consistency — their gate hasn't cleared."
- "Last coach note mentions a good week on cross-court patterns. No attendance issues."
- "Recommended next action: schedule a reassessment."

**DONNA should decide:**
- Whether this player needs director attention right now (surfaced via risk signal on the players list)
- Which tab is most relevant to open first based on why the director is here (e.g., "You came from a reassessment alert — I'd suggest checking Skill Path.")

**DONNA should guide:**
- Directors through the reassessment workflow
- Directors through the level-change conversation with the parent

**Director approves:**
- Curriculum level changes
- Reassessment decisions
- Hold/release from hold

---

### `/director/sessions/[sessionId]` — Session Detail

**UI should show:**
- Session name, date, coach, status
- Block list (with execution status from wrap-up)
- Attendance summary (present/absent counts)
- DONNA brief about this session

**DONNA should explain:**
- "This session was completed. Coach ran 4 of 6 planned blocks. Block 3 was skipped due to time. 1 player was absent — this is their 3rd consecutive absence."
- "Curriculum alignment: 87%. The skipped blocks were the fitness component."
- "Recommended action: approve the wrap-up in the review queue."

**DONNA should decide:**
- Whether this session needs director action (and surface it in the review queue, not just the session detail)
- Whether the curriculum drift is significant

**DONNA should guide:**
- Directors through adding an attendance exception if a player was repeatedly absent

**Director approves:**
- Wrap-up (in review queue, not directly on this page)
- Attendance exceptions

---

### `/director/curriculum` — Curriculum

**UI should show:**
- Stage list (5 stages) with health dots (green/yellow/red)
- Level detail on tap (drills, content types, gates)
- Gap indicators on levels with issues
- Node drawer for drill/content detail

**DONNA should explain:**
- "Orange Ball has 3 levels. Level 2 is missing fitness content and parent guidance. Level 1 is complete."
- "The curriculum gap affects 8 active players who are in Level 2."
- "Adding 2 content items to Level 2 would close the gap."

**DONNA should decide:**
- Which level to surface first (sorted by impact on current players)
- Whether a gap is urgent (affecting many active players) or low priority (affecting future levels)

**DONNA should guide:**
- Directors through adding a new drill node
- Directors through the voice override flow
- Directors through requesting a curriculum draft

**Director approves:**
- All curriculum additions and modifications
- Level structure changes

---

### `/director/templates` — Templates

**UI should show:**
- Template count (class / fitness)
- Template list with curriculum level, session count, last used date
- Create / Edit actions

**DONNA should explain:**
- "3 templates have no curriculum level assigned. Sessions created from them won't show curriculum context to coaches."
- "Template 'Orange 2 Baseline' hasn't been used in 4 weeks — it may need updating."

**DONNA should decide:**
- Which templates need attention
- Whether a template's content is aligned with the current curriculum

**Director approves:**
- Template creation
- Template modifications
- Curriculum level assignments

---

### `/director/coaches` — Coaches

**UI should show:**
- Coach list with name, role, session count
- Wrap-up completion rate badge per coach
- Invite action

**DONNA should explain:**
- "Coach James has a 40% wrap-up completion rate over the last 30 days. That's below the team average of 78%."
- "Coach Sarah ran 12 sessions this month — the most active coach on your team."

**DONNA should decide:**
- Which coaches need attention (low wrap-up rates, gap sessions)
- Whether coach performance signals are trending up or down

**DONNA should guide:**
- Directors through the invite flow for a new coach

**Director approves:**
- Coach invitations
- Role changes

---

### `/director/kpi` — Academy Health

**UI should show:**
- 3 headline vital signs: Health Score, Critical KPI, Trend
- Expandable detail: full 12-KPI table

**DONNA should explain:**
- "Academy health is 72%. Down from 80% last month. The biggest driver is missing coach wrap-ups."
- "Attendance rate is 88% — healthy range. Development velocity is normal for this time of year."

**DONNA should decide:**
- Which KPIs are worth the director's attention today
- Whether a metric is genuinely concerning or natural variation

**DONNA should guide:**
- Directors to the underlying data when a KPI is critical (link to relevant page)

**Director approves:**
- No approvals on this page — it is read-only

---

### `/director/donna` — DONNA Page

**UI should show:**
- The chat interface (primary element — above the fold)
- A data context panel (collapsed by default, shows what DONNA knows)
- DONNA's most recent messages/history

**DONNA should explain:**
- Everything the director asks
- Context inline: "I'm basing this on [3 players, 2 sessions, 1 curriculum gap] that I'm currently watching."

**DONNA should decide:**
- What to surface proactively when the director opens the page
- Which data to pull into context for a given question

**DONNA should guide:**
- Directors through multi-step workflows entirely within the chat
- Directors to the right page for a given task if needed

**Director approves:**
- Any proposed action DONNA recommends (never auto-executed)

---

### `/coach` — Coach Home

**UI should show:**
- Today's sessions (list with status badges)
- Wrap-up status per session
- On-court quick actions bar

**DONNA should explain:**
- "You have 2 sessions today. Orange 2 starts at 10:00. Red Ball starts at 14:00."
- "Your wrap-up from Tuesday is still pending director review."

**DONNA should decide:**
- Which sessions need attention before coach heads to court

**DONNA should guide:**
- New coaches through the wrap-up flow

**Director approves:**
- Wrap-ups (in director review queue)
- Coach-submitted curriculum suggestions

---

### `/player` — Player Home

**UI should show:**
- Player name + level badge
- Current mission (1 mission, clearly stated)
- Recent attendance (sparkline)
- Next session date

**DONNA should explain:**
- "Your current mission is to improve your cross-court backhand. Your coach wants to see 7 out of 10 successful rallies."
- "You've been to 8 sessions this month — great consistency!"

**DONNA should decide:**
- Which mission is most relevant right now
- How to celebrate progress without exaggerating it

**DONNA should guide:**
- Players through understanding their development path

**Player approves:**
- Nothing (players are in read/receive mode)

---

### `/parent` — Parent Home

**UI should show:**
- Child name + current level
- Is-child-progressing summary (1-2 sentences)
- Most recent coach update (if any)
- Next session date

**DONNA should explain:**
- "[Child] is in Orange Ball Level 2. They've been working on cross-court consistency this month."
- "No concerns from the coaching team this week."

**DONNA should decide:**
- Whether to surface an update or hold it pending director approval
- What language is parent-safe (apply parentSafeResponseRules)

**Director approves:**
- All parent communications before they appear in the parent portal

---

## Key Insight: Where DONNA is Underused Today

| Screen | Current DONNA | Should Be |
|---|---|---|
| `/director` | 3 DONNA surfaces repeating the same info | 1 brief + 1 COO insight |
| `/director/review` | DONNA brief + tab guide | DONNA pre-reading each item |
| `/director/players/[id]` | No DONNA brief | 2-sentence player brief at top |
| `/director/sessions/[id]` | Partial in panels | 1 session brief replacing 9 panels |
| `/director/kpi` | Per-KPI explainer (12 explainers) | 1 headline brief + drill-down explainers |
| `/director/donna` | Data panels with chat buried | Chat-first with context drawer |
| `/player` | Ask DONNA link only | Inline DONNA on mission card |
| `/parent` | Ask DONNA link only | DONNA explains child's progress in parent-safe language |

## Key Insight: Where UI Shows Data DONNA Should Absorb

| Data Currently in UI | DONNA Should Say Instead |
|---|---|
| 7-tile KPI strip | "3 items need attention" |
| 15+ review card types | "Here are the top 3 items to review, in order" |
| Session detail with 11 panels | "Session completed, 1 exception to review" |
| Academy health chart (sparkline) | "Academy health is [X]% this week" |
| 12 KPI tiles | "Academy score: 78%. Two metrics need attention." |
| Player profile 5 tabs | "This player needs [specific action]" |
| Curriculum level tree | "These 2 levels need content" |
