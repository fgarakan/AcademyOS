# Director Operating Model
## Mega Sprint 1900–1930 — AcademyOS Director Experience Reimagination V1
### Date: 2026-06-12

---

## THE MODEL

A Director performs exactly 5 activities.

Everything in AcademyOS maps to one of them.

If a feature cannot be mapped, it should not exist for directors.

---

## THE 5 ACTIVITIES

### 1. RUN
> Keep the academy operating today.

The Director is ensuring today's sessions happen, coaches are briefed, players are attended to, and nothing is falling through the cracks.

**Questions RUN answers:**
- What is happening today?
- Are my coaches ready?
- Are my sessions complete?
- What is urgent right now?
- What should I not ignore?

**Pages that belong to RUN:**
- Today (`/director`) — primary RUN surface
- Sessions (`/director/sessions`) — session management
- Approvals for session wrap-ups — within review queue

**Signals that trigger RUN:**
- Coach recap missing
- Session scheduled but no template assigned
- Player absent without notification
- Attendance exception pending

---

### 2. IMPROVE
> Make the academy better over time.

The Director is evolving curriculum, helping players advance, coaching coaches, and acting on DONNA's recommendations.

**Questions IMPROVE answers:**
- What curriculum should I change?
- Which players are stuck and why?
- Which coaches need support?
- What is DONNA recommending I improve?

**Pages that belong to IMPROVE:**
- Curriculum Builder → Architect + Evolution (`/director/curriculum/builder`)
- Player Profile → Development view (`/director/players/[playerId]`)
- Coach Profile → Effectiveness view (`/director/coaches/[coachId]`)

**Signals that trigger IMPROVE:**
- DONNA curriculum evolution recommendation
- Player stalled for 180+ days
- Coach wrap-up quality declining
- Gate bottleneck detected

---

### 3. REVIEW
> Approve what DONNA has drafted.

The Director is the final approver. DONNA proposes; the Director decides. No AI action executes without director approval.

**Questions REVIEW answers:**
- What has DONNA proposed?
- Is this recommendation correct?
- Should I approve, modify, or reject?
- What is aging in the queue?

**Pages that belong to REVIEW:**
- Approvals (`/director/review`) — primary REVIEW surface
- Individual proposed_action detail (`/director/review/[actionId]`)

**Signals that trigger REVIEW:**
- New items in proposed_actions queue
- Queue aging (items waiting 3+ days)
- High-priority draft (placement, level movement)

---

### 4. GROW
> Bring in new players and retain existing ones.

The Director is managing enrollment, onboarding new players, communicating with parents, and ensuring the academy's capacity and health are growing.

**Questions GROW answers:**
- Who are the new players and where do they belong?
- What parent communications need to go out?
- Are we at capacity? Under capacity?
- Who is at risk of leaving?

**Pages that belong to GROW:**
- Player onboarding (`/director/players/[playerId]/onboard`)
- Player placement (`/director/placement`)
- Private lesson requests (`/director/private-lessons`)
- Parent updates (within Approvals)

**Signals that trigger GROW:**
- New player intake pending
- Private lesson request received
- Parent update pending approval
- Group at capacity

---

### 5. CONFIGURE
> Set up and maintain how the academy is structured.

The Director is managing the underlying structure: curriculum levels, gates, templates, coach assignments, academy settings, and philosophy DNA.

**Questions CONFIGURE answers:**
- What is my academy's curriculum structure?
- What templates are coaches using?
- What are my level gates?
- What is my academy's philosophy and DNA?
- Who has access to what?

**Pages that belong to CONFIGURE:**
- Settings (`/director/settings`)
- Onboarding / Setup wizard (`/director/onboarding`)
- Assessment Templates (`/director/assessment-template`)
- Templates (`/director/templates`)
- Level gates (within Curriculum)

**Signals that trigger CONFIGURE:**
- Onboarding incomplete
- Academy DNA not set
- Templates missing for new curriculum level
- Level gate criteria outdated

---

## ACTIVITY → PAGE MAPPING

| Activity | Primary Page | Secondary Pages |
|---|---|---|
| RUN | `/director` (Today) | Sessions, Approvals (session wrap-ups) |
| IMPROVE | `/director/curriculum/builder` | Player profiles, Coach profiles |
| REVIEW | `/director/review` | `/director/review/[actionId]` |
| GROW | `/director/players` (new/onboarding) | Private lessons, Parents |
| CONFIGURE | `/director/settings` | Templates, Assessment templates, Onboarding |

---

## NAVIGATION → ACTIVITY MAPPING

Every primary nav item maps to one dominant activity, though some serve multiple.

| Nav Item | Dominant Activity | Secondary |
|---|---|---|
| **TODAY** | RUN | REVIEW (decision surface) |
| **PLAYERS** | GROW | IMPROVE (player development) |
| **CURRICULUM** | IMPROVE | CONFIGURE (structure) |
| **COACHES** | IMPROVE | RUN (recap completion) |
| **APPROVALS** | REVIEW | RUN (urgent approvals) |
| **SETTINGS** | CONFIGURE | — |

---

## DESIGN CONSEQUENCES

**RUN is always one tap away.**
Today is the default landing page. DONNA tells you what to do. You act. Done.

**IMPROVE has a feedback loop.**
Curriculum Evolution shows what to change → Director approves → DONNA records → Next session reflects the change.

**REVIEW is never buried.**
Approvals badge count is always visible in nav. DONNA gives you a brief on what's in the queue before you enter.

**GROW is player-centric.**
Everything about a player — intake, placement, profile, parent comms — is under Players. Not scattered.

**CONFIGURE is rare.**
Settings is at the bottom of the nav for a reason. Rarely accessed, never urgent.

---

## DONNA'S ROLE IN THE OPERATING MODEL

DONNA does not replace any of the 5 activities.

DONNA accelerates each one:

| Activity | How DONNA Helps |
|---|---|
| RUN | Delivers daily brief, surfaces urgent signals, answers COO questions |
| IMPROVE | Detects bottlenecks, generates curriculum evolution recommendations, drafts improvement actions |
| REVIEW | Pre-briefs the queue, explains each recommendation, scores confidence, flags risks |
| GROW | Drafts placement recommendations, parent updates, intake assessments |
| CONFIGURE | Suggests curriculum structure gaps, identifies missing templates |

**DONNA never executes.** DONNA proposes, explains, and drafts. The Director decides.

---

## ANTI-PATTERNS (WHAT SHOULD NOT EXIST)

These patterns violate the operating model and should be eliminated in the Fable redesign:

1. **Pages without a primary activity** — If a page can't be mapped to RUN/IMPROVE/REVIEW/GROW/CONFIGURE, it is noise.
2. **Duplicate review surfaces** — `ai-suggestions`, `donna-analytics`, `attention`, `alerts`, `signals` are all partial review surfaces that fragment the REVIEW activity.
3. **Tables before intelligence** — Showing a raw list before DONNA's summary forces the director to do DONNA's job.
4. **Navigation items that are sub-features** — "Templates" is a tool used inside Sessions and Curriculum, not a top-level activity.
5. **Platform/debug pages visible to directors** — demo, diagnostics, migration-verify belong to the platform team, not director navigation.
6. **Onboarding as a permanent nav item** — Once setup is complete, onboarding should be in Settings, not nav.
