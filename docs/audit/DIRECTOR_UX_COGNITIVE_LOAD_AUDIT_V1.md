# Director UX Cognitive Load Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Scope:** All director-facing pages
**Purpose:** For each director page, answer the 8 UX questions that determine whether the page serves the operating model.

---

## Operating Model Reminder

> AI proposes → Director approves → System records → System executes

The director is NOT a data analyst. They are a decision-maker and a coach leader.
Every page should reduce the time between "landing" and "acting."

---

## Evaluation Framework

For each page:
1. What matters?
2. Why does it matter?
3. What should happen next?
4. What can be ignored right now?
5. What should DONNA summarize?
6. What should be above the fold?
7. What requires too many clicks?
8. What creates confusion?

---

## `/director` — Dashboard / Today

**1. What matters?**
Whether the academy is running smoothly today: pending approvals, players needing attention, session coverage, wrap-up completion.

**2. Why does it matter?**
This is the first screen a director sees each day. It sets the mental state for all subsequent decisions.

**3. What should happen next?**
If there are pending approvals → go to review queue.
If there are players needing attention → go to player profile.
If academy is running clean → go to Today's Academy for a live view.

**4. What can be ignored right now?**
Academy Health chart (a sparkline derived from an approximation).
"Quick Actions" section (duplicates sidebar).
Analytics section (not actionable in a morning check-in).
Academy Setup section (one-time task — irrelevant once live).

**5. What should DONNA summarize?**
- "You have 3 items that need your approval today. The most urgent is [X]."
- "2 players are showing risk signals."
- "Academy is running cleanly / has 4 operational gaps."

**6. What should be above the fold?**
- Date / greeting (1 line)
- DONNA's 1-sentence brief (what matters today)
- Primary action button (review queue OR specific item)
- 3 vital stats: Pending Approvals | Players Needing Attention | Sessions Today

**7. What requires too many clicks?**
To reach the review queue: 1 click (fine). But finding which item to act on first requires reading 3 DONNA surfaces + the KPI strip + the primary action hero = 5+ zones scanned before acting.

**8. What creates confusion?**
- THREE DONNA surfaces before the first data point: DonnaFirstGreeting → DonnaScreenBriefStatic → DonnaAcademyCOOBriefCard
- The KPI strip shows 7 numbers with no visual hierarchy — all look equally important
- "Sessions This Week" section is below the fold but more operationally relevant than the Analytics section above it
- Academy Setup section at the bottom triggers anxiety if it's visible — directors think they missed something

**Cognitive Load Score:** 8/10 (very high)
**Primary Problem:** Too many surfaces competing for attention before the director knows what to do.

---

## `/director/today` — Today's Academy

**1. What matters?**
Which sessions are happening today, their current status, and whether anything needs immediate action.

**2. Why does it matter?**
This is the operational heartbeat view — if a session is in progress or something went wrong, the director needs to know immediately.

**3. What should happen next?**
If pending reviews → go to review queue.
If session is in progress → open session detail.
If all clear → no action needed.

**4. What can be ignored right now?**
DONNA suggestion chips (when there's no urgent context).
Risk flags section if all clear.
Quick actions (duplicates sidebar).

**5. What should DONNA summarize?**
"3 sessions scheduled today. 1 is in progress. 2 items are in the review queue."

**6. What should be above the fold?**
4-stat strip + today's sessions list. This page is nearly correct already.

**7. What requires too many clicks?**
Getting back to the dashboard requires clicking "Dashboard" back-link. This page should be the dashboard landing view.

**8. What creates confusion?**
The existence of both `/director` and `/director/today` as separate pages with overlapping purposes. Directors following the flow: Dashboard → Today's Academy → Back to Dashboard = 3 page loads for essentially the same view.

**Cognitive Load Score:** 4/10 (low-medium — this page is well-designed)
**Primary Problem:** Existence as a separate page from the dashboard. It should either be the landing view or be merged.

---

## `/director/review` — Approvals

**1. What matters?**
Which items require the director's decision, in urgency order, so they can be approved or rejected efficiently.

**2. Why does it matter?**
Every pending review represents a coach who is waiting for confirmation, a player whose data hasn't been applied, or an action the system cannot execute until approved. Delays here create operational lag.

**3. What should happen next?**
Approve the most urgent item first. Then the next. Work through the queue.

**4. What can be ignored right now?**
Completed items (already done). Curriculum changes (unless urgent). DONNA guide chips on each tab (director already knows their job).

**5. What should DONNA summarize?**
- "You have 7 items in queue. The top 3 need same-day action: [list]. The rest can wait."
- "This wrap-up from Coach Maria covers [session X]. Key observation: [most important note]."

**6. What should be above the fold?**
Total count of pending items + sorted list by urgency. The DONNA brief. Nothing else.

**7. What requires too many clicks?**
To approve a wrap-up: read card → understand context → approve → confirm. That's fine. But getting to the most urgent item requires clicking through 4 tabs to find it.

**8. What creates confusion?**
- Tabs are organized by data type (wrap-ups, observations, curriculum), not by urgency. A director who opens "Curriculum & Session" first misses the urgent attendance exception in "Needs Approval."
- 15+ different card designs create cognitive switching cost. Each card has different fields, actions, and risks.
- DONNA tab guide chips below the tab bar add noise before any cards are visible.
- "Completed" tab exists next to action tabs — creates false sense of progress when queue is actually full.

**Cognitive Load Score:** 9/10 (extremely high for an action-critical page)
**Primary Problem:** Data-type tabs instead of urgency-sorted flat list. Director must hunt for what matters.

---

## `/director/players` — Players

**1. What matters?**
Which players need attention (on hold, reassessment due, no curriculum level) and the ability to quickly find any specific player.

**2. Why does it matter?**
The player directory is both a search tool (find anyone) and a triage surface (who needs action).

**3. What should happen next?**
Click into a player with an urgent flag. Or search for a specific player.

**4. What can be ignored right now?**
Players with `active` status and no flags — they're fine.

**5. What should DONNA summarize?**
"3 players need your attention: [list with reason]. 5 are awaiting curriculum placement. 2 are due for reassessment."

**6. What should be above the fold?**
DONNA brief (1-2 sentences) + search bar + filter badges (All / Needs Attention / Pending) + player list. This is close to current.

**7. What requires too many clicks?**
Finding all players with a specific urgency level: requires manual filter selection. Pre-filtered views (e.g., "4 players need attention") should be clickable from the DONNA brief.

**8. What creates confusion?**
Three DONNA surfaces (DonnaPlayersPresenceCTA, DonnaScreenBriefStatic, DonnaCommandSection) before the list. The CTA and screen brief say the same thing. The command section is a generic DONNA box that doesn't know which player the director cares about.

**Cognitive Load Score:** 5/10 (medium — functionally good but over-DONNA'd)
**Primary Problem:** Three DONNA surfaces reduce trust in each individual DONNA message.

---

## `/director/players/[playerId]` — Player Profile

**1. What matters?**
The player's current development status, any risk signals, their curriculum level, and the most relevant coaching action.

**2. Why does it matter?**
A director reviews a player profile when there's an action to take (placement, level change, concern) or when a coach or parent has a question. Speed-to-understanding is critical.

**3. What should happen next?**
Depends on why they're here. If from a notification: take the specific action. If from a search: understand the player's full picture.

**4. What can be ignored right now?**
For a routine check: Competition tab, Fitness tab. For most directors most of the time: the detailed drill lists in the Skill Path tab.

**5. What should DONNA summarize?**
"[Player] is on Orange Ball Level 2. They've been stuck here for 4 months — reassessment is due. Their key development gap is backhand consistency. Last coach note: [excerpt]."

**6. What should be above the fold?**
Player name + level + status badge + DONNA brief (2 sentences about this specific player) + the most urgent action button.

**7. What requires too many clicks?**
Understanding the full picture: Overview tab → Skill Path tab → Competition tab → Notes tab = 4 separate page states before the director can form a complete view.

**8. What creates confusion?**
- No DONNA summary at the top of the profile — director lands on Overview tab but must manually read all fields to understand the player's situation
- 5 tabs with varying density — some tabs are sparse, creating an uneven experience
- Mobile layout is broken (grid-cols-[260px_1fr_260px]) — director using phone sees a broken layout

**Cognitive Load Score:** 6/10 (medium-high — tabs help but lack of DONNA context forces manual reading)
**Primary Problem:** No "what matters about this player right now" signal at the top.

---

## `/director/sessions` — Sessions

**1. What matters?**
Sessions that need attention: missing blocks, missing wrap-ups, or upcoming sessions to prepare.

**2. Why does it matter?**
Session quality determines player development. Sessions that run without blocks can't guide coaches. Sessions without wrap-ups leave player observations unrecorded.

**3. What should happen next?**
For sessions with issues: open session detail and resolve. For upcoming sessions: verify blocks are ready.

**4. What can be ignored right now?**
Completed sessions with wrap-ups submitted — they're done.

**5. What should DONNA summarize?**
"4 sessions this week. 2 have missing blocks. 1 wrap-up from last week still needs your review."

**6. What should be above the fold?**
DONNA brief + sessions needing action (flagged) + all sessions list below.

**7. What requires too many clicks?**
Creating a session: Sessions → New Session form → fill in template, date, coach, group → submit. This is the correct depth for a creation flow.

**8. What creates confusion?**
- No visual distinction between sessions that need action and sessions that are fine — all look the same in the list
- Archive and Overview sub-routes exist but their purpose vs the main list is unclear
- "New Session" is a form that requires knowing which template and group to use

**Cognitive Load Score:** 4/10 (low — functionally clean, DONNA brief would help)
**Primary Problem:** No urgency signals on the list. All sessions look equally important.

---

## `/director/curriculum` — Curriculum

**1. What matters?**
Whether the curriculum is complete, well-distributed across domains, and connected to sessions. Critical gaps that affect players' ability to progress.

**2. Why does it matter?**
A director is responsible for the quality of what coaches teach. Curriculum gaps mean players aren't receiving complete development.

**3. What should happen next?**
Review health summary → identify gaps → open the relevant level/stage → decide whether to add/modify content or create a draft for review.

**4. What can be ignored right now?**
Levels that are healthy. Content types that are complete. The deep drill procedure fields.

**5. What should DONNA summarize?**
"Orange Ball Level 2 has no fitness content and no parent guidance. This affects 8 active players. Would you like to draft additions?"

**6. What should be above the fold?**
DONNA brief + health summary (3 numbers: Total Levels, Gaps Found, Players Affected) + level tree. Node drawer appears on demand.

**7. What requires too many clicks?**
Viewing drill details: Level tree → Level card → Node drawer open. That's 2 clicks — acceptable. But getting from a curriculum gap to creating a draft is 4+ steps.

**8. What creates confusion?**
- Health panel, level tree, node drawer, DONNA context panel, and voice override panel are all visible simultaneously on large screens — overwhelming
- "Voice Override Input" is a legacy command surface that predates the current DONNA model — its purpose is unclear on this page
- The difference between `/director/curriculum`, `/director/curriculum/builder`, and `/director/curriculum/academy-version` is not intuitive — all appear to be "the curriculum"

**Cognitive Load Score:** 8/10 (high — complex domain made more complex by multiple panes)
**Primary Problem:** No entry-point summary before showing the tree. Director dumps into the full curriculum immediately without orientation.

---

## `/director/templates` — Templates

**1. What matters?**
Whether there are templates ready to generate sessions from. Whether existing templates are curriculum-aligned.

**2. Why does it matter?**
Templates are the bridge between curriculum and sessions. A missing template means a coach can't run a curriculum-aligned session.

**3. What should happen next?**
Check if class templates exist. If gaps: create one. If template needs curriculum level: assign it.

**4. What can be ignored right now?**
Fitness templates (unless building a fitness program). DONNA suggestions panel (if templates are already aligned).

**5. What should DONNA summarize?**
"You have 8 class templates. 3 have no curriculum level assigned. 2 fitness templates are ready."

**6. What should be above the fold?**
Template count summary + DONNA brief + Create/Browse actions.

**7. What requires too many clicks?**
Viewing all class templates: Templates hub → class templates list → template detail = 2 clicks. Fine.

**8. What creates confusion?**
- Two template routes exist: `/director/class-templates/*` and `/director/templates/class/*` — identical purpose, different URLs
- "Coach Preview" and "Impact Preview" sub-routes exist but their value proposition isn't obvious

**Cognitive Load Score:** 4/10 (low — hub pattern works well)
**Primary Problem:** Duplicate template routes create inconsistency. Templates/class and class-templates should be one.

---

## `/director/coaches` — Coaches

**1. What matters?**
Coach performance signals: wrap-up completion rates, session coverage, player observation counts.

**2. Why does it matter?**
Directors manage coaches. Understanding which coaches are completing wrap-ups and maintaining session quality is a management task.

**3. What should happen next?**
For a coach with low wrap-up rate: follow up. For a new coach: verify sessions are being created correctly.

**4. What can be ignored right now?**
Coaches who are active and performing well.

**5. What should DONNA summarize?**
"3 coaches active. Coach Sarah has completed 85% of wrap-ups. Coach James has 2 sessions with no wrap-up from last week."

**6. What should be above the fold?**
Coach list with performance badges + DONNA brief.

**7. What requires too many clicks?**
Finding coach performance requires going to coach detail — if performance is not surfaced on the list, this is 1 extra click.

**8. What creates confusion?**
No performance signals on the coach list. All coaches look the same. No DONNA context.

**Cognitive Load Score:** 3/10 (low — simple directory)
**Primary Problem:** No performance data surfaced. Coach list is a contact directory, not an operational tool.

---

## `/director/kpi` — Academy Health

**1. What matters?**
Whether the academy is improving, stable, or declining across the metrics that matter most.

**2. Why does it matter?**
Directors need evidence of impact to justify decisions, retain students, and communicate with parents.

**3. What should happen next?**
If a KPI is critical → investigate the underlying data. If academy is healthy → no action needed.

**4. What can be ignored right now?**
KPIs that are healthy. Most KPIs most of the time.

**5. What should DONNA summarize?**
"Academy health is 72%. The two KPIs dragging it down are Coach Wrap-Up Rate (45%) and Players Without Curriculum Level (8). Both are actionable this week."

**6. What should be above the fold?**
DONNA brief + 3 headline KPIs (health score, most critical metric, trend direction). Detailed KPI table below.

**7. What requires too many clicks?**
Getting from a red KPI to the data source: KPI → explanation → find the relevant page = 2-3 navigation steps.

**8. What creates confusion?**
12 KPI tiles with equal visual weight. No hierarchy. Director doesn't know which KPI to look at first. DONNA explainer for each KPI adds more text, not less.

**Cognitive Load Score:** 7/10 (high — too many metrics shown equally)
**Primary Problem:** 12 equal-weight KPIs with no top-level health headline. DONNA should give the headline, KPIs should be the evidence.

---

## `/director/donna` — DONNA Full Page

**1. What matters?**
Getting a direct, intelligent answer to a question or command about the academy.

**2. Why does it matter?**
DONNA is the operating brain of the system. The more the director can ask DONNA instead of navigating, the faster the director operates.

**3. What should happen next?**
Ask DONNA a question. Get a grounded answer. Take the recommended action.

**4. What can be ignored right now?**
The entity summaries section (shows player/session data the director could find directly). The intelligence signals card (duplicates the dashboard signals).

**5. What should DONNA summarize?**
Everything — this is DONNA's page. She should lead with: "Here's what I'm watching today. Ask me anything."

**6. What should be above the fold?**
The chat interface. DONNA context summary as a collapsed drawer. Nothing else.

**7. What requires too many clicks?**
To actually talk to DONNA: scroll past attention items → scroll past risks → scroll past recommendations → scroll past entity summaries → find the chat shell. The thing directors want most (the chat) is buried.

**8. What creates confusion?**
- DONNA page looks like another dashboard. It has sections, cards, and lists — not a conversational interface.
- Attention items and risks shown on this page already exist on the dashboard — director confusion: which one is "real"?
- The actual DONNA voice/text shell (DonnaDirectorShellClient) is at the bottom, after 6 data panels.

**Cognitive Load Score:** 8/10 (high — wrong mental model for a chat interface)
**Primary Problem:** The DONNA page is a data dashboard when it should be a conversation interface.

---

## Summary: Most Critical UX Failures

| Rank | Page | Problem | Impact |
|---|---|---|---|
| 1 | `/director/review` | Tabs by type not urgency | Director reviews wrong items first |
| 2 | `/director` | 3 DONNA surfaces before any action | Director can't find the thing to do |
| 3 | `/director/donna` | Chat buried under 6 data panels | DONNA is inaccessible as a brain |
| 4 | `/director/kpi` | 12 equal-weight KPIs | No clear signal of what matters |
| 5 | `/director/curriculum` | No orientation before tree | Director lost in the curriculum |
| 6 | `/director/players/[id]` | No DONNA brief at top of profile | Must read 5 tabs to understand player |
| 7 | `/director/sessions/[id]` | 8 panels, most empty | Overwhelming for a single session |
| 8 | `/director/today` + `/director` | Two overlapping pages | Director unsure which to check |
