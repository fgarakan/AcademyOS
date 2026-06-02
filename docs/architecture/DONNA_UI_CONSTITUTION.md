# AcademyOS DONNA-First UI Constitution

**Version:** 1.0
**Date:** 2026-06-02
**Status:** Active — all new screens must comply. Existing screens migrate on next sprint touch.

---

## The Core Rule

> **Do not expose the database as the UI. Do not turn intelligence into dashboards.**

The UI shows what the director, coach, parent, or player needs to *decide* or *act on* right now.
DONNA explains everything else on request.

---

## The Three Failures

A screen has **failed the constitution** if:

1. **It has more than 5 visible data cards by default.** If it takes 20 cards to say what matters, the screen is a database dump, not a product.

2. **The user has to interpret data manually.** If the screen shows numbers and the user has to figure out what they mean, DONNA is absent. DONNA should say: *"2 players need attention. One is stalled at Red 2, one has missed 4 sessions."*

3. **DONNA does not explain what matters.** Every page must answer: *"What should I do here?"* If that answer requires reading the whole page, the screen failed.

---

## The Four Laws

### Law 1: One Primary Job Per Screen

Every screen has exactly one job. Everything else is secondary.

| Screen | Primary Job |
|---|---|
| Director Dashboard | Decide what to act on today |
| Players List | Find a player and take action |
| Player Profile | Understand development state and next step |
| Review Queue | Approve or reject pending items |
| Curriculum | Review and adjust the development structure |
| Coach Home | See today's sessions and pending wrap-ups |
| Parent Portal | Understand your child's current focus |
| Player Portal | Know what you're working on right now |

### Law 2: One Primary Action Per Screen

The most important action is always visible, always clear. Other actions are available but not competing.

Examples:
- Director Dashboard: **"Review 3 pending approvals"**
- Players List: **"Add player"** (or the most urgent player card action)
- Player Profile: **"Approve missions"** (if pending) or **"Start assessment"** (if overdue)
- Review Queue: **"Approve"** / **"Reject"** on the top item

### Law 3: Three to Five Visible Data Points Max

Default visible data: 3–5 items. Everything else is behind:
- A DONNA answer ("Tell me more about X")
- An expand button
- A tab/section navigation

If the user has to scroll past 5 cards to find the action, the screen failed.

### Law 4: DONNA Must Explain What Matters

Every page has a **DONNA brief** — one or two sentences that answer:
- *"What is most important here right now?"*
- *"What should I do first?"*
- *"Why does this matter?"*

The DONNA brief is always visible without interaction. It is not hidden in a drawer.

---

## The Default Screen Pattern

```
[Page title]   [Primary action button]

DONNA says: [1–2 sentence brief. What matters right now. What to do.]

[Signal 1]  [Signal 2]  [Signal 3]     ← 3–5 max, high signal only
[Signal 4]  [Signal 5]

[Primary content list — ordered by urgency/relevance, not by type]

---
[Ask DONNA anything about this page...]     ← always at the bottom
```

Signals show the headline number. Nothing else. No charts by default.

---

## Per-Screen Constitution

### Director Dashboard
- **Job:** Decide what to act on today
- **Primary action:** Open review queue (if pending items exist) or DONNA
- **5 max visible signals:** Pending approvals · Players needing attention · Coaches missing wrap-ups · Sessions today · Blueprint missions pending
- **DONNA brief:** *"You have [N] approvals waiting, [N] players need attention, and [N] missions are pending review."*
- **Hidden behind DONNA/expand:** KPI details, player list, curriculum health, session schedule

### Players List
- **Job:** Find a player and see what needs doing
- **Primary action:** Add player
- **Visible per card:** Name · Level · Status badge · One action hint
- **DONNA brief:** *"[N] players are active. [N] have no level assigned. [N] have upcoming reassessments."*
- **Hidden:** Assessment history, score history, detailed curriculum, gate progress

### Player Profile
- **Job:** Understand this player's development state and take action
- **Visible by default:** Current level · Next target · Top 3 priorities · Active missions · DONNA brief
- **Primary action:** Approve pending missions (if any) or Start assessment (if overdue)
- **DONNA brief:** *"[Player] is working on [top priority]. [N] missions active. Next assessment in [X] weeks."*
- **Hidden:** Full assessment history, curriculum gate detail, all evidence, session logs, notes

### Review Queue
- **Job:** Make approval decisions
- **Primary action:** Approve top item
- **Visible:** Count of each type · Top 3 pending items by urgency
- **DONNA brief:** *"[N] items waiting. Top priority: [item]. [Coach name] submitted [N] wrap-ups today."*
- **Hidden:** Resolved items, item history, full payload detail (expandable)

### Curriculum
- **Job:** Understand and adjust the development structure
- **Primary action:** Start assessment or Review a level
- **Visible:** Active stage · Number of levels with content · Pending overrides
- **DONNA brief:** *"Curriculum is [healthy/needs attention]. [N] levels have gaps. [N] override requests pending."*
- **Hidden:** All level detail, gate lists, content items (expand on click)

### Coach Home
- **Job:** Know what to do today
- **Primary action:** Open today's session
- **Visible:** Today's sessions (count + first name) · Pending wrap-ups · Overdue recaps
- **DONNA brief:** *"You have [N] sessions today. [N] wrap-ups are pending. [Player] needs attention."*
- **Hidden:** Full session detail, player histories, curriculum context (available but not primary)

### Parent Portal
- **Job:** Understand your child's current development focus
- **Primary action:** Ask DONNA
- **Visible:** Child's current level · Current mission · What to do at home · Latest update
- **DONNA brief:** *"[Child] is working on [mission]. Last update was [N] days ago."*
- **Hidden:** Assessment scores, internal priorities, coach notes, gate details

### Player Portal
- **Job:** Know what to work on
- **Primary action:** See today's mission
- **Visible:** Current level · Active missions (max 3) · Level progress bar · Encouragement line
- **DONNA brief:** *"Keep going. You're working on [mission]. [N] sessions in. Next level: [requirement]."*
- **Hidden:** Technical scores, gate details, coach notes, assessment history

---

## DONNA Screen Brief — Implementation Spec

Every page that complies with the constitution uses the `DonnaScreenBrief` component:

```tsx
<DonnaScreenBrief
  brief="You have 3 approvals waiting, 2 players need attention."
  primaryActionLabel="Open Review Queue"
  primaryActionHref="/director/review"
/>
```

### Brief copy rules

1. **One or two sentences maximum.** Never a paragraph.
2. **Name the number.** "3 approvals" not "several approvals."
3. **Name the urgency.** "Waiting" implies something needs to happen.
4. **Never use jargon.** Say "players need attention" not "attention_needed player_status records exist."
5. **Tell the user what to do next.** The brief ends with an implied or explicit action.

### When to use generic fallback

When real data is unavailable (loading, no data yet, error):
- Use a context-appropriate default: *"This is where [screen job goes]. Start by [primary action]."*
- Never show an error message as the brief. An empty brief is better than a broken one.

---

## Migration Path

Screens migrate to the constitution on their next planned sprint touch.

**Priority order:**
1. Director Dashboard — highest daily-use surface
2. Player Profile — most complex, most visited
3. Review Queue — decision surface (already partially compliant)
4. Coach Home — adoption-critical
5. Players List — navigation surface
6. Parent/Player Portals — trust-critical

**Not required to comply yet:**
- Settings pages
- Diagnostic pages
- Dev/preview routes

---

## Anti-Patterns to Remove

| Anti-pattern | Replace with |
|---|---|
| KPI grid with 12 numbers | 3 signal badges + DONNA brief |
| Full player table with 8 columns | Name · Level · Status · Action hint |
| Assessment history chart on load | "Last assessed [date]" + expand to chart |
| Curriculum gate list showing all gates | "N/M gates met" + expand to gate list |
| Coach observations feed on load | "N observations" + expand or DONNA |
| Session attendance breakdown on load | "N attended" + expand |
| All active missions shown | Top 1–3 + "see all" |
| 6+ tab navigation | 3 tabs max, rest behind DONNA |
