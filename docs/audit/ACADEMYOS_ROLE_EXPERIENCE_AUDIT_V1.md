# AcademyOS Role Experience Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Purpose:** Evaluate each role's experience against the core criterion: can they understand what matters and complete their task with minimal friction?

---

## Evaluation Criteria per Role

**Director:** Can they understand what matters in 10 seconds?
**Coach:** Can they teach, mark attendance, recap, and finish with minimal admin?
**Parent:** Can they understand their child's progress without internal complexity?
**Player:** Can they understand their mission and next step?

---

## Role 1: Academy Director

### Can they understand what matters in 10 seconds?

**Current answer: No.**

**Walkthrough of what a director sees when they open the app:**

1. Land on `/director`
2. See the date + greeting (1 second)
3. See DONNA First Greeting card (takes 3-4 seconds to read)
4. See DONNA Screen Brief (takes 3-4 seconds to read)
5. See DONNA COO Brief Card (expanded — takes 5-8 seconds to read)
6. Scroll down to see DonnaCommandSection
7. Scroll further to see the Primary Action Hero
8. Scroll further to see the 7-tile KPI strip

By the time the director reaches the KPI strip and understands the state of the academy, they have spent 20-40 seconds reading DONNA content that overlaps significantly.

**The 10-second test fails because:**
- There are 3 DONNA surfaces before any actionable data
- The primary action (review queue link + pending count) is below the fold
- The director must read 3 different DONNA messages to understand the same information

**What 10-second understanding requires:**
- One number: "4 items need your action"
- One button: "Review Now"
- One sentence: the most urgent item

**Assessment: FAILING**

### Director Experience Breakdown

**What works:**
- The sidebar navigation is clean and logical (9 items in correct priority order after Sprint 1060)
- The Approvals (review queue) is always one click away
- The Academy Health badge is a quick visual indicator
- The DONNA COO brief gives genuine intelligence when data is present
- Collapsible sections prevent forced scroll on the dashboard

**What doesn't work:**
- DONNA surface redundancy: the greeting, the screen brief, and the COO brief all say roughly the same thing in different ways — the director reads all three and gets less clarity per word
- The review queue tabs are organized by data type, not urgency — director must check 4 tabs to ensure they haven't missed an urgent item
- DONNA page buries the chat interface under 6 panels — the most powerful feature is the hardest to access
- Two similar pages exist (`/director` and `/director/today`) creating navigation confusion
- Multiple satellite pages (`/director/alerts`, `/director/attention`, `/director/signals`, `/director/ai-suggestions`) exist outside the sidebar and serve overlapping purposes
- The player profile has no DONNA brief at the top — director must manually synthesize across 5 tabs
- The session detail page has 11 panels for what is usually a routine completed session

**Director experience score: 55/100**
- The core functionality (review queue, player profiles, sessions, curriculum) exists and is functional
- The experience is cluttered with duplicated DONNA surfaces and satellite pages that should have been folded into the main flow

---

## Role 2: Coach

### Can they teach, mark attendance, recap, and finish with minimal admin?

**Current answer: Mostly yes — with one friction point.**

**Walkthrough of a coach's session day:**

1. Open `/coach` on mobile
2. See today's sessions — good, they're listed clearly
3. Tap session → `/coach/sessions/[id]`
4. Run blocks from the execution view — good, block-by-block structure works
5. Mark attendance during session — accessible from the session detail
6. Use Quick Capture for in-session observations — accessible
7. End of session: tap "Start Wrap-Up" — the trigger is at the bottom of the block list

**The friction points:**

**Friction 1: Wrap-up trigger buried at bottom of session**
After running 6-8 blocks, the coach must scroll to the bottom of the block list to find the "Start Wrap-Up" action. On mobile, this is a significant scroll. The solution is a sticky action bar.

**Friction 2: Two recap UIs on the same session page**
The "Quick Note" (CoachRecapCommandPanel) and the "Coach Wrap-Up" (guided drawer) both exist on the session page. A coach who hasn't been trained may fill in the Quick Note thinking they've completed their wrap-up, then not notice the guided Wrap-Up option. This creates duplicate or missing data in the director's review queue.

**Friction 3: Voice transcription not active (requires OPENAI_API_KEY)**
The voice recorder UI exists and is visible to coaches, but will show "Production transcription is not configured" if the API key isn't set. This is documented but creates a confusing experience in production.

**What works:**
- The block execution view is well-designed for on-court use
- The wrap-up drawer asks good questions (6 guided prompts)
- Quick capture panel allows fast note-taking
- The on-court actions bar gives 3-tap access to quick capture, attendance, and observations
- DONNA screen brief on coach home gives the right amount of context for mobile

**What doesn't work:**
- Wrap-up CTA is not sticky — the most important end-of-session action requires scrolling
- Two recap UIs create confusion
- No DONNA coaching intelligence on the session page: "Based on your group, here's what you should focus on today" — the coach sees curriculum content but no synthesized guidance
- CoachObservationDraftReviewPanel exists as a component but coaches don't have an obvious path to seeing which observations were approved vs rejected

**Coach experience score: 68/100**
- Core workflow (session → execute → wrap-up) is functional and mostly well-designed
- The sticky CTA gap and dual recap UI are real friction points that reduce wrap-up completion rates

---

## Role 3: Parent

### Can they understand their child's progress without internal complexity?

**Current answer: Partially — with guardianship setup required.**

**Walkthrough of a parent's first visit:**

1. Log in → routed to `/parent`
2. If guardian relationship is not set up: see empty state ("Contact your director to connect your account")
3. If set up: see the development plan, progress, attendance, and support guide

**The fundamental problem:**
Parents cannot see anything useful until a director or coach manually links their account to a player via `guardian.profile_id` and `player_guardians`. This is not a UX problem per se (it's an onboarding process), but it means the first parent experience is likely an error state.

**What parents see when correctly set up:**
- Child switcher (for multi-child parents)
- Development plan (IDP parent view) — shows curriculum level, what child is working on, why it matters
- Progress indicators
- Attendance stats (total sessions, present/absent/late)
- Parent support guide ("How to help your child at home")
- Private lesson request form
- Updates section

**What parents need vs. what they get:**

| Parent needs | Current state |
|---|---|
| "Is my child progressing?" | Requires reading the IDP + progress section — not a direct yes/no |
| "What should my child work on this week?" | Present in IDP view but buried under other content |
| "Any updates from the academy?" | In `/parent/updates` — separate page, not surfaced on home |
| "When is the next session?" | Not shown on parent home |
| "Did my child attend this week?" | In attendance stats section — moderate scroll |
| "Can I request a private lesson?" | Present — lesson request card is accessible |

**What doesn't work:**
- The home page shows the full IDP before any session-level news. Parents typically care more about "what happened this week" than "what level is my child on."
- No "latest update from the academy" card on the home screen — parents must navigate to `/parent/updates`
- Attendance stats show counts but not which sessions were missed or why
- The "How to support your child" guidance is valuable but appears after too much scrolling
- No DONNA brief for parents ("Your child had a great week" / "One thing to focus on at home")

**Parent experience score: 58/100**
- Content is appropriate and parent-safe (sanitization rules work)
- Information architecture prioritizes the wrong content (IDP before updates)
- First-time experience depends on director/coach setup (not self-service)
- DONNA is absent from the parent home despite having parent-safe language rules already built

---

## Role 4: Player

### Can they understand their mission and next step?

**Current answer: Mostly yes — but requires too much reading for the target age group.**

**Walkthrough of a player's typical visit:**

1. Log in → routed to `/player`
2. See: PlayerHomeHeroCard (level + progress ring + name) — good
3. PlayerAssignedMissionsSection — what to work on — good
4. PlayerMissionPreview — specific mission details — good
5. LevelProgressRing — visual progress indicator — good
6. AttendanceSparkline — session attendance history
7. Recent session history — list of sessions attended
8. BadgeReport / next badge to earn

**The good:**
- The hero card is well-designed and gives immediate context
- The mission section clearly tells the player what to work on
- Badges are motivating for younger players
- The level progress ring gives visual confidence

**The problem:**
- Too many sections. A 10-year-old opening the app should see: "Your mission: [mission]" and "Go!" — not scroll through a progress ring, sparkline, session history, and badge eligibility report.
- The page is designed for a sophisticated user reviewing their own performance data — not for a player motivated to improve.
- The progress ring and sparkline overlap with what the player needs: simple motivation and direction.

**What each age group needs:**

| Age group | What they need |
|---|---|
| 8-10 | "Here is today's challenge." Fun reward animation. |
| 11-13 | "Your mission" + "You're this close to your next badge" |
| 14-17 | Mission + progress data + competition readiness |
| 18+ | Full development profile |

**The current design serves 14-17+ well. It overloads 8-13.**

**Sub-pages that work well:**
- `/player/missions` — clean mission list
- `/player/wins` — badge collection, motivating
- `/player/skill-path` — for players who want to understand their path
- `/player/ask-donna` — DONNA for players (needs to be more prominent)

**What doesn't work:**
- DONNA is only accessible via the `/player/ask-donna` sub-page — not present on the home screen at all
- The home screen has no "Ask your coach a question" shortcut
- No "What to practice before your next session" card
- The "Ask DONNA" link is buried — young players won't find it without guidance

**Player experience score: 62/100**
- Mission and badge systems are well-designed
- Page is too data-heavy for the target age group
- DONNA is inaccessible from the home screen
- Good bones — needs a youth-first information architecture

---

## Cross-Role Experience Summary

| Role | 10-Second Test | Primary Workflow | DONNA Integration | Score |
|---|---|---|---|---|
| Director | FAILING | Functional but cluttered | Overloaded (3 surfaces) | 55/100 |
| Coach | PASSING | Mostly clean, 2 friction points | Present, appropriate | 68/100 |
| Parent | PARTIAL | Requires setup; content order wrong | Absent | 58/100 |
| Player | PARTIAL | Missions work; too much data on home | Absent from home | 62/100 |

---

## Top Role Experience Improvements (in order of impact)

1. **Director:** Consolidate 3 DONNA surfaces to 1. Primary action above fold.
2. **Coach:** Sticky wrap-up CTA. Remove duplicate recap UI.
3. **Director:** Review queue sorted by urgency, not data type.
4. **Player:** Home screen shows mission + next badge only. Everything else on drill-down.
5. **Parent:** Home shows "latest update" + "how is child doing" before anything else.
6. **Director:** DONNA page is chat-first, with context panels collapsed.
7. **Parent:** DONNA gives a parent-safe weekly summary on the home screen.
8. **Player:** DONNA visible on the player home screen ("Ask DONNA anything about your training").
