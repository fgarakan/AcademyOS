# Premium V1 Product Walkthrough — Sprint 678

**Date:** 2026-05-23
**Audience:** Non-technical — prospective academy directors, coaches, and parents
**Tone:** Clear, warm, practical — what you see, what you do, what happens

---

## What Is AcademyOS?

AcademyOS is the operating system for a tennis academy. It connects your director, coaches, players, and parents into a single, voice-capable platform — so everyone knows what matters, decisions get made faster, and nothing falls through the cracks.

The central idea is simple:
> **Voice creates → Director confirms → System records → Everyone benefits**

No more group chats for session decisions. No more "I'll send that parent update later." No more guessing whether a player is ready to advance. AcademyOS makes your academy run like one team.

---

## The Director Experience

### Logging In

When Alex (the academy director) opens AcademyOS, she lands on the **Director Dashboard**. This is her command center.

In the top section, DONNA — the academy's AI operating system — is waiting. She's already looked at today's sessions, the review queue, and the attention signals. She knows what's pending.

### The Director Dashboard

The dashboard shows Alex:
- **Pending reviews** — how many coach actions are waiting for her approval
- **Players needing attention** — flagged by recent absences or concern observations
- **Sessions today** — what's scheduled and whether wrap-ups are in
- **Advancement-ready players** — who has met the criteria to move up a level
- **Missing curriculum levels** — players who haven't been placed yet

All of this is live data. Not estimates. Not a weekly email.

### Asking DONNA

Alex taps the DONNA card and types (or speaks):

> "What needs my attention today?"

DONNA responds in a few seconds:

> "You have 5 items in your review queue. Marcus Rivera's advancement proposal is the most time-sensitive — Coach Priya flagged him last Thursday. James Whitfield has missed 3 sessions in the last 30 days, which is above your usual threshold. Two coaches haven't submitted wrap-ups from yesterday's sessions."

DONNA then offers: **"Do you want to open the review queue?"**

Alex says yes.

### The Review Queue

The review queue is where Alex makes decisions on everything her coaches propose. She sees a list of pending items:

- Coach Priya's wrap-up from Wednesday's Advanced session
- An attendance exception for James Whitfield
- Marcus Rivera's advancement proposal (Level 4 → Level 5)
- A parent-safe update draft for Zara Ahmed
- Coach David's observation about Chloe Martinez

For each item, Alex can:
- **Approve** — the action becomes official; the system records it
- **Reject** — the action is declined with a reason
- **Request clarification** — she asks the coach to add more context

When Alex approves Marcus Rivera's advancement, the system records the decision in the audit trail. Nothing happens automatically to Marcus's record — the level change is queued for the finalization step.

### Player Profiles

Alex clicks into Marcus Rivera's profile. She sees:

- His current level: **Level 4 — Competitive**
- His advancement eligibility: ✅
- His recent coach observations (all of them, including Coach Priya's private notes)
- His session attendance over the last 30 days
- His active development signals

She has the full picture. She can make an informed decision.

---

## The Coach Experience

### Logging In

Coach Priya opens AcademyOS on her phone and sees the **Coach Portal**. Her view is focused on what she needs for today:

- Today's sessions (group, time, player count)
- Players in her assigned groups with any flags
- Sessions that need wrap-ups
- Any notifications from the director

### During a Session — Observation Drafts

While coaching the Advanced group, Priya wants to note something about Marcus. She taps the voice button next to his name and speaks:

> "Marcus's serve mechanics are excellent today — his toss placement is consistent. Flag for advancement consideration."

DONNA transcribes this and creates a structured observation draft. It shows Priya the draft and asks: "Does this look right?"

Priya reviews it and taps **Submit for Review**. The draft goes to the director's review queue. Priya doesn't approve it herself — that's the director's job.

### Session Wrap-Up

After the session, Coach Priya opens the **Wrap-Up Flow**. She records:

- Attendance: Marcus present, Sofia present, James absent (3rd absence)
- Session recap: "Focused on serve mechanics and net approach. Drill: 15-minute serve warm-up + 20-minute net rally."
- Concerns: James Whitfield — attendance flag

She taps **Submit Wrap-Up**. This creates several proposed actions in the director's review queue. The director will see everything from this session the next time she opens the review queue.

### DONNA for Coaches

Priya can ask DONNA questions scoped to her role:

> "What curriculum level requirements does a player need for Level 4?"

DONNA answers from the curriculum spine. It does not give Priya access to the director's review queue, other coaches' sessions, or players outside her groups.

---

## The Parent Experience

### Logging In

Isabelle Fontaine's parent logs in and sees the **Parent Portal**. It's simple and focused:

- Their child's name and current curriculum level
- A parent-safe development summary (approved by the director)
- Attendance for the last few weeks
- Any private lesson requests they've submitted

### What Parents See — and Don't See

Parents see:
- **Approved development summaries** — written by the coach, reviewed by the director, and cleared for parent visibility
- **Attendance records** — which sessions their child attended, was late for, or missed
- **Top priorities** — what the academy is working on with their child

Parents do not see:
- Raw coach notes
- Internal assessments or score rankings
- Other players' data
- Director decisions or review queue contents

The parent view is deliberately simple. Parents need to feel informed and trusted — not overwhelmed with internal operating data.

### The Child Switcher

If a parent has two children at the academy, they see a **child switcher** at the top of the portal. Tapping switches to the other child. The system validates child ownership server-side — a parent cannot accidentally or deliberately view another family's data.

---

## The Player Experience

### Logging In

Emma Torres (Level 2 player) logs in and sees the **Player Portal**. Her screen shows:

- **Current level:** Level 2 — Building
- **Next level:** Level 3 — Developing
- **What she's working toward:** The 2 open gates she needs to reach Level 3
- **Attendance:** A sparkline of her last 10 sessions
- **Badge:** "Consistent Attendee" — earned for 90%+ attendance

### What Players See

Emma sees her own journey. She sees:
- What level she's at
- What she needs to do to advance
- Her attendance record
- Any badges she's earned
- A student-friendly development message (if the director has approved one)

Emma does not see:
- Coach notes about her
- Assessment scores or percentile rankings
- Other players' levels or data
- Director decisions

### DONNA for Players

If Emma has access to the player DONNA, she can ask:

> "What do I need to do to get to Level 3?"

DONNA answers with the open gate criteria:
> "You need to demonstrate consistent backhand cross-court and footwork in at least 2 consecutive sessions. Your coach will record this when they see it."

---

## Key Design Principles

**Voice creates, director confirms.** No AI action takes effect without a human decision in the review queue.

**Every role sees what they need — and only that.** Directors see everything. Coaches see their own players and sessions. Players see their own journey. Parents see their child's progress, cleaned up for their eyes.

**DONNA never guesses.** When she doesn't have live data, she says so. When she reaches the edge of a role's permissions, she explains why and offers an alternative.

**Nothing is auto-sent to parents.** Parent updates go through a full draft → review → approval cycle. No coach can send a parent communication on their own.

---

## What V1 Includes

| Feature | Available in V1 |
|---|---|
| Director dashboard with live signals | ✅ |
| DONNA for directors | ✅ |
| Review queue (approve/reject/clarify) | ✅ |
| Player profiles (full director view) | ✅ |
| Coach portal (session, wrap-up, observations) | ✅ |
| Voice wrap-up flow | ✅ (requires OpenAI API key) |
| Parent portal (child progress, attendance) | ✅ |
| Child switcher (multi-child parents) | ✅ |
| Player portal (level, gates, badges) | ✅ |
| Platform owner preview mode | ✅ |
| Parent communication send (from system) | ❌ (V2) |
| Automated level advancement (no manual step) | ❌ (by design — director approval required) |
| UTR integration | ❌ (planned) |
| Multi-academy platform analytics | ❌ (V2) |

---

## What Happens After V1

The V1 controlled testing phase is focused on one academy (Monteiro Tennis Academy) with a small group of real users. The goal of V1 is to validate the core operating model:

1. Coaches submit — directors decide — system records
2. Parents receive only what the director approves
3. Players see their own journey clearly
4. DONNA saves time on routine questions and surfaces what matters

After V1 feedback is collected, the next development phase will focus on:
- Parent communication send (email/push)
- UTR data integration
- Automated curriculum gate tracking
- Multi-academy platform dashboard
