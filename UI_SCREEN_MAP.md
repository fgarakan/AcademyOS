# UI Screen Map

## Design System
- Background: `#0A0A0A` | Surface: `#111111` / `#1A1A1A` | Border: `#222`
- Accent: `#C8FF00` (electric lime) | White headlines | `#555` muted
- Cards: `rounded-2xl border border-[#222]` | Hover: lime border glow
- Nav: left sidebar (Director, desktop) | bottom bar (Coach/Player/Parent, mobile)

---

# DIRECTOR

## Navigation

```
Sidebar (desktop only — fixed left, 64px collapsed / 220px expanded)

  ●  Dashboard          ← default landing (command center)
  ●  Players
  ●  Curriculum
  ●  Sessions
  ●  Competition
  ──────────────────
  ●  Intelligence       ← director-only section
  ●  Reports
  ●  Configuration
```

Secondary items (Intelligence, Reports, Configuration) are separated by a divider. They are not primary daily items — the divider communicates this without hiding them.

---

## D1: Director Dashboard — Command Center

The dashboard has three sections, loaded in priority order. Each section has a single job. The director reads top to bottom and is done.

```
┌─────────────────────────────────────────────────────────────┐
│  Section 1 — ACTION REQUIRED        "What must I do now?"   │
├─────────────────────────────────────────────────────────────┤
│  Section 2 — OPPORTUNITIES          "What's worth acting on?"│
├─────────────────────────────────────────────────────────────┤
│  Section 3 — COMMUNICATION          "What needs to go out?" │
└─────────────────────────────────────────────────────────────┘
```

Everything below these three sections is behind a "Show academy overview" collapse. The dashboard is an action queue, not a data portal.

---

### Section 1: Action Required

**Occupies the top of the viewport. Never scrolls off screen before the director has seen it.**

If nothing requires action, this section collapses to a single green line:
```
  ✓  All clear — nothing requires immediate action today.
```

When there are items:

```
ACTION REQUIRED
─────────────────────────────────────────────────────────────

  🔴  Marcus T.   Green 3
      Load warning + competition results dropped.
      Coach cannot increase intensity until resolved.
                                              [Open player →]

  🔴  Sofia L.    Orange 2
      Assessment 19 days overdue.
      Cannot advance level until complete.
                                          [Schedule now →]

  🟠  7 recommendations waiting for your approval.
      Coaches cannot act on these until reviewed.
                                             [Review all →]
```

**Rules:**
- Only players with `Action needed` status appear here. "Needs attention" and "Check in" are Section 2.
- Each item states the consequence of inaction — not just the problem.
- Each item has exactly one CTA. No secondary links.
- Maximum 5 items visible. "Show 3 more" expands inline.
- Players are listed before system tasks (recommendations, approvals). People before process.

---

### Section 2: Opportunities

**Items that would improve the academy but are not blocking anything.**

```
OPPORTUNITIES
─────────────────────────────────────────────────────────────

  ●  3 players are ready to move up a level.       [Review →]
     Marcus T., Aisha K., Ben L.

  ●  James W. needs a check-in.                    [Open →]
     Competition results slightly below expectations.

  ●  2 players have flagged areas improving well.  [View →]
     Possible candidates for a harder group.
```

**Rules:**
- "Ready to advance" players are opportunities, not actions — advancing a level is a positive decision, not a response to a problem.
- "Check in" status players appear here — they're not urgent, they just benefit from attention.
- Positive observations (players doing well, outperforming peers) surface here too. The director should see good news, not just problems.
- Maximum 4 items. No expansion — if more exist, they live in the Players list.

---

### Section 3: Communication

**What needs to leave the academy today — messages to parents, updates to send.**

```
COMMUNICATION
─────────────────────────────────────────────────────────────

  📤  5 parent updates waiting to be sent.         [Review →]
      Coaches have written them — they need your send.

  📩  2 coaches left session notes unflagged.      [Review →]
      Check if any should become parent updates.
```

**Rules:**
- Only communication that requires the director's action. Not a log of all sent messages.
- "Your send" language — makes the director's role clear without being bureaucratic.
- If nothing needs sending: "No communication actions today." (single line, collapses section).

---

### Collapsed: Academy Overview

Below Section 3, a single toggle:

```
  Show academy overview ▾
```

When expanded:
```
ACADEMY OVERVIEW

  Curriculum:
    Red Foundation       ████████░░░░  8 players
    Orange Development   ████████████  12 players
    Green Performance    ████████░░░░  8 players
    Yellow Competitive   ████░░░░░░░░  4 players
    High Performance     ██░░░░░░░░░░  2 players

  Coach sessions this week:   23 logged / 24 planned
  Competition (14 days):      4 players competing
  Academy health:             Good
```

No model metrics, no flywheel scores, no composite numbers. Collapsed by default — not part of the daily flow.

---

### What is NOT on the Dashboard

The following live in the sidebar (Intelligence, Reports, Configuration) and never appear on the dashboard:
- Cohort analysis
- Model performance grades
- Signal effectiveness data
- Benchmark comparison charts
- Weight and threshold configuration

The dashboard is an action center. The sidebar is the analysis center.

---

## D2: Players — All Players List

**Header:**
```
PLAYERS (34)                     [Search...]      [Filter ▾]      [+ New Player]
```

**Filter options:** Stage | Group | Coach | Status (needs attention / on track)

**Default sort:** Needs Attention first, then alphabetical within status groups.

**Row layout:**
```
[Avatar]  Marcus T.       Green 3 — Identity    Needs attention    Alex Chen   [Open →]
[Avatar]  Sofia L.        Orange 2 — Direction  Needs attention    Jordan M.   [Open →]
[Avatar]  Aisha K.        Red 2 — Contact       On track           Sam R.      [Open →]
```

Columns: avatar, name, level (plain name), status pill, coach, open arrow.

No score numbers. No signal counts. No urgency percentages.

**Advancement filter:** Tab above table — "Ready to advance (3)" shows only eligible players with one-click advance button.

---

## D3: Player Profile (Director view)

All 9 tabs. See `PLAYER_PROFILE_SPEC.md` for full detail.

Tab order: Today's Focus → Curriculum → Development → Competition → Watch List → What to Do Next → Outcomes → Load + Fitness → Notes + Comms

Default tab: Today's Focus.

---

## D4: Approval Queue

Reached from dashboard "Approvals" card or sidebar Players → Approval Queue.

```
PENDING APPROVALS (7)

  Marcus T.    Downswing focus     Confidence: High    3 days ago   [Review →]
  Sofia L.     Reassessment        Confidence: High    1 day ago    [Review →]
  ...
```

Clicking a row expands the full recommendation card (same as Player Profile Tab 6) inline. Approve or override without leaving this page.

---

## D5: Curriculum — Stage Map

Visual pathway showing player distribution across stages and levels. Click any level group to see those players. Accessible from sidebar, not dashboard.

---

## D6: Intelligence (Director only)

Sidebar section. Sub-pages:

- **Flywheel Insights** — plain-English insight cards. Action required cards shown first. Each card: what was found, what's suggested, approve or dismiss.
- **Cohort Overview** — how groups of similar players compare. No jargon.
- **Model Performance** — grade card (A/B/C) for current configuration. "Recommendations being approved 78% of the time." Plain summary.
- **Configuration** — weights + thresholds. Advanced. Shown as labeled sliders, not raw SQL values.

---

# COACH

## Navigation

```
Bottom Tab Bar (mobile — 5 tabs)

  🏠  Today          ← default
  👥  Players
  📅  Sessions
  🎙  Voice
  📖  Library
```

---

## C1: Coach Home — Today

**This screen answers one question: "What do I do today?"**

Accessible in under 3 seconds from login. The coach should be able to read the top of this screen and know their first action without scrolling.

---

### TOP: Today's Priority (above everything else)

A single directive card. Full width. Takes up roughly the top third of the screen.

If nothing is urgent, it shows the next session:

```
┌────────────────────────────────────────────────────────────┐
│  NEXT UP                                                   │
│                                                            │
│  Elite-A · 09:00  →  12 players                           │
│                                                            │
│  Lead with downswing today.                                │
│  Marcus and Ben need topspin work.                         │
│  Ease Marcus's intensity — load is high.                   │
│                                                            │
│                              [Open session →]              │
└────────────────────────────────────────────────────────────┘
```

If a player needs action before the session:

```
┌────────────────────────────────────────────────────────────┐
│  BEFORE YOU START                                          │
│                                                            │
│  Sofia's assessment is overdue.                            │
│  She can't progress until it's done.                       │
│                                                            │
│                         [Schedule assessment →]            │
└────────────────────────────────────────────────────────────┘
```

**Rules:**
- One card. One message. One CTA.
- If there's a blocking action (assessment overdue, load warning): show that first.
- If no blocking action: show the next session with a one-line coaching note derived from the top player priority.
- Coaching note is plain English — never a signal name or score.
- The CTA must be the single most useful next action. Not two options.

---

### MIDDLE: Today's Sessions

```
TODAY — TUESDAY                                       [+ New Session]

  09:00   Elite-A     12 players    [Open →]
  11:00   Marcus T.   1:1           [Open →]
  14:00   Orange B     8 players    [Open →]
```

Time, group, player count, open. Nothing else.

---

### BELOW: My Players

```
MY PLAYERS

  ⚠️  Marcus T.    Green 3    Ease intensity — load is high.        [Open →]
  ⚠️  Sofia L.     Orange 2   Assessment this week.                 [Open →]
      Aisha K.     Red 2      On track.                             [Open →]
      James W.     Yellow 1   On track.                             [Open →]
```

Players needing attention shown first with ⚠️ and one plain-English sentence. On-track players below, no annotation. No scores, no signal names.

---

### BOTTOM: Voice Shortcut

```
[🎙  Say something...]
```

Full-width. Always visible. Sticky to bottom of screen.

---

## C2: Coach — Player View

When a coach opens a player, they see a focused profile — not a tabbed data portal.

**Tabs visible to Coach (5):**
1. Today's Focus ← default tab
2. Curriculum
3. Development
4. Load + Fitness
5. Notes

Tab rules:
- "What to Do Next" (recommendations) is not shown — coaches execute, not approve.
- "Watch List" (signals) is not shown — flagging is for director review.
- Competition tab is hidden for basic Coach role; visible for Head Coach.

**Today's Focus tab for Coach — key constraint:**
- Max 3 focus items shown. Always.
- Each item: one domain + one sentence + one drill link.
- One load warning line if relevant.
- Nothing else.

If the engine has generated 7 priorities, the UI shows the top 3 only. The coach does not need to see all 7. They need to act on the top 3.

---

## C3: Live Session

Mobile-optimized. One action visible at a time.

**Top bar:**
```
Elite-A · 09:00                       00:34:12        [End]
Attendance: 10/12
```

**Block list (vertical, swipe down):**
```
Warm-up movement      15 min   ✓ Done
────────────────────────────────────────
Downswing drill       20 min   ▶ Now
  ───────────────────────────────────
  Record Marcus:   [✓ Good]  [✗ Needs work]  [📝 Note]
  Record Sofia:    [✓ Good]  [✗ Needs work]  [📝 Note]
  ───────────────────────────────────
  [Mark block done →]
────────────────────────────────────────
Rally consistency     20 min   ○ Up next
Match play            15 min   ○
```

**Design rules:**
- Only the active block is expanded. Others are collapsed.
- Outcome buttons are large — thumb-friendly on phone.
- "Good" and "Needs work" — not "Positive" and "Negative".
- No outcome type dropdowns. Simple binary + optional note.
- Voice note button (🎙) sticky at bottom for quick observations.

---

## C4: Post-Session

```
SESSION DONE — Elite-A — 28 Apr

Outcomes logged for 8/12 players.

4 players have no outcomes logged:
  Dan K.        [Add outcome]
  Chris M.      [Add outcome]
  ...

                              [Submit session →]
```

Clean, action-first. Missing outcomes flagged with quick-add buttons. Submit ends the session and triggers domain progress updates.

---

## C5: Voice AI

**Accessed from:** 🎙 tab in navigation OR the always-visible voice shortcut button.

```
                [  🎙  ]
           large lime pulse button

  Listening...

  "Create a session for Elite-A on Thursday
   using the baseline topspin template"

  ─────────────────────────────────────────
  HERE'S WHAT I'LL CREATE

  Session for Elite-A
  Thursday 1 May, 09:00
  Template: Baseline Topspin

  [✓ Looks right — create it]      [✗ Cancel]

  Not quite right? [Edit details]
  ─────────────────────────────────────────
```

Language on the proposed action card:
- "Here's what I'll create" — not "Proposed action"
- "Looks right — create it" — not "Approve"
- Edit details opens a minimal form with only the fields that need changing.

Recent commands (tap to expand):
```
Yesterday   Session created for Elite-A Thursday    ✓
Yesterday   Note added for Marcus                   ✓
```

---

# PLAYER

## Navigation

```
Bottom Tab Bar

  🏠  Home
  📈  Progress
  🏆  Wins
  💬  Messages
```

No tabs inside any screen. Single scrolling view. Simple.

---

## P1: Player Home

**One question: "What am I working on?"**

```
                  Hey Marcus 👋

    ┌────────────────────────────────────┐
    │                                    │
    │   🟢  GREEN PERFORMANCE            │  ← lime badge, stage color
    │       Level 3                      │
    │                                    │
    │   ████████████░░░░  5/8 skills     │  ← no "domain mastery" label
    │                                    │
    └────────────────────────────────────┘

    TODAY'S FOCUS
    ─────────────────────────────────────
    Work on your topspin when the ball
    comes fast. Keep that low-to-high
    swing path — your coach noticed
    it's getting better.

    NEXT MILESTONE
    ─────────────────────────────────────
    Complete one more skill area
    to stay on track.
```

Language rules:
- "Today's Focus" comes from the coaching message (player audience) or the top focus area plain description.
- "Next milestone" — not "progression requirement."
- No scores, no domain names as labels, no signal language.
- If no coaching message exists for today: show "Keep working on your current areas — great progress this week."

---

## P2: Player Progress

The screen is grouped into two sections — what's been achieved, and what's being built. Achievements come first. The player feels momentum before they see what's left.

```
MY PROGRESS

  🟢  Green Performance · Level 3
      ████████████░░░░  Almost there

  ─────────────────────────────────────────
  YOU'VE NAILED  ✓
  ─────────────────────────────────────────

      Preparation
      Contact
      Transition
      Movement

  ─────────────────────────────────────────
  YOU'RE BUILDING  →
  ─────────────────────────────────────────

      Downswing
      Finish
      Decision Making
      Competition

```

**Rules:**
- "You've nailed" section comes first — always. Even if only one domain is complete.
- "You're building" covers both in-progress and not-yet-started domains. No distinction between them — the player doesn't need to know how far into each one they are.
- If a domain has regressed (rare): it appears in "You're building" with no negative framing. Regression is not surfaced to the player.
- No percentages, no outcome counts, no domain descriptions. Name only.
- The progress bar at the top shows completed domains vs total (e.g., 4/8). No label on the bar — the player reads the two groups below and understands immediately.
- If all 8 domains are complete: replace both sections with a single celebration state — "You've nailed everything at this level. Time to move up." (shown only when advancement_eligible = true).

**Status language (player-only):**
- Group 1: `You've nailed` — domain status = complete
- Group 2: `You're building` — domain status = in_progress, not_started, or regressed
- Never shown: raw status labels, outcome counts, mastery thresholds

---

## P3: Player Wins

```
MY WINS  🏆

  ⭐  This week
     You nailed Movement!
     Keep building on that momentum.

  ⭐  2 weeks ago
     Contact — completed.

  ⭐  Last month
     You moved up to Green Performance
     Level 3. Big step.

  ⭐  3 months ago
     Completed Green Performance Level 2.
```

Plain sentences. Celebratory. No dates unless "this week" / "last week" / "last month" / a month name.

---

## P4: Player Messages

```
FROM YOUR COACH

  28 Apr
  "Great session today, Marcus. Your swing
  path on fast balls is really improving —
  keep focusing on that this week."

  21 Apr
  "Solid effort in match play. Keep your
  routine between points — it's making
  a difference."
```

Simple feed. No tone labels, no audience labels, no metadata. Just the message, date, and coach name.

---

# PARENT

## Navigation

```
Bottom Tab Bar

  🏠  Home
  📈  Progress
  🏆  Wins
  💬  Updates
```

---

## PA1: Parent Home

**One question: "Is my child doing well?"**

```
  [Child photo placeholder]

  Marcus Taylor
  ──────────────────────────────────────
  🟢  Green Performance · Level 3

  WHAT HE'S WORKING ON
  ──────────────────────────────────────
  Marcus is developing a clear style
  of play — a game he can call his own.
  This is a big step toward competing
  at regional level. He's doing well.

  RECENT WIN  🏆
  ──────────────────────────────────────
  Marcus completed the Movement
  skill area this week. Strong progress.

  NEXT FOCUS
  ──────────────────────────────────────
  Building consistency when the ball
  comes fast — the key skill at this
  level. It's coming together.
```

No "domains", no "urgency", no "signals", no stage numbers. Just a clear, reassuring narrative.

---

## PA2: Parent Progress

```
MARCUS'S PROGRESS

  🟢  Green Performance · Level 3 of 3

  SKILL AREAS

  Preparation      ✓ Strong
  Downswing          Coming along
  Contact          ✓ Strong
  Finish             Coming along
  Transition       ✓ Strong
  Movement         ✓ Strong
  Decision Making    Coming along
  Competition        Coming along

  ──────────────────────────────────────
  WHAT YOU CAN DO AT HOME

  Ask Marcus to describe his style of
  play in two sentences. If he can
  explain it, he's understood it.
  Celebrate that conversation.
```

Status labels for parents:
- `Strong` — was: Complete
- `Coming along` — was: Building / In progress
- `Just starting` — was: Not started
- No negative label — "coming along" covers any active domain

"What you can do at home" — from `parent_level_descriptions.how_you_can_help`. Plain, specific, actionable.

---

## PA3: Parent Wins

```
MARCUS'S WINS  🏆

  This week     Movement — completed
  2 weeks ago   Contact — completed
  Last month    Moved to Level 3
```

Simple. Three lines max visible. "Show more" below.

---

## PA4: Parent Updates

```
FROM THE ACADEMY

  28 April — Coach Alex Chen

  "Marcus had a strong session today.
  His footwork is really coming together
  and he's moving with more confidence.
  Great week overall."

  ──────────────────────────────────────

  14 April — Coach Alex Chen

  "Solid progress this week. Marcus is
  starting to read the game better —
  choosing the right shot more often.
  Keep encouraging him to explain his
  thinking after you watch him play."
```

Only messages explicitly sent to parent. No internal metadata. No tone labels. No audience labels. Coach name and date only.

---

# Screen Count

| Role | Screens |
|---|---|
| Director | ~8 (Dashboard, Players List, Player Profile, Approval Queue, Curriculum Map, Intelligence, Reports, Configuration) |
| Coach | ~5 (Today, Players, Live Session, Post-Session, Voice AI) |
| Player | 4 (Home, Progress, Wins, Messages) |
| Parent | 4 (Home, Progress, Wins, Updates) |
| Auth | 1 |
| **Total** | **~22** |

---

# Language Reference Card

For use during build — any time a label or message is written, check against this.

| Never write | Write instead |
|---|---|
| Signal | Area to watch / Flag (Director) |
| Priority | Focus / What to do |
| Urgent / Immediate | Action needed |
| High urgency | Needs attention |
| Recommendation | What to do next |
| Override | Change with note |
| Overtraining risk | Load warning |
| Reassessment overdue | Assessment due |
| UTR regression | Competition results dropped |
| Score regression | Progress slipped |
| Behavioral profile | (never shown) |
| Fatigue risk score | Load level |
| Composite score | (never shown) |
| Verdict: positive | Good / ✓ |
| Verdict: negative | Needs work / ✗ |
| Domain mastery | Skill area complete |
| Not started | Just starting (player) / Working on (coach) |
| In progress | Getting there (player) / Building (coach) |
| Complete | Nailed it (player) / Complete ✓ (coach) |
| Regressed | Back to work (player) / Needs review (coach) |
| Curriculum level advancement | Move up a level |
| Blocking signal | Thing to resolve first |
