# FABLE Director Blueprint
## AcademyOS Director Experience — Source of Truth for Fable Redesign
### Mega Sprint 1900–1930 | Date: 2026-06-12

> Deep System. Simple Screen. DONNA Is The Interface.

This document is the complete design specification for the Director experience in the Fable redesign. It defines pages, hierarchy, interactions, journeys, and constraints. It does not contain mockups or final visual design. It contains everything needed to produce them.

---

## PART 1: DESIGN PHILOSOPHY

### The Primary Question

If a Director logs in for the first time — what should they see?
If a Director returns after 30 days — what should they see?
If a Director has 60 seconds — what should they see?
If a Director has 60 minutes — what should they see?

**The answer is nearly identical: DONNA tells them what matters.**

The Director does not navigate to find information. DONNA brings the information to the surface. The Director responds.

### The Three Laws

1. **DONNA answers first.** Every surface opens with DONNA's assessment, not a table of data.
2. **One action per screen moment.** At any given time, DONNA is pointing to one thing the Director should do. The rest is context.
3. **Approval is sacred.** Nothing changes without the Director's explicit approval. DONNA drafts. Director decides. System executes.

### The Interface Model

```
Director logs in
       ↓
DONNA reads the academy state
       ↓
DONNA produces: brief + priorities + alerts + wins
       ↓
Director sees: What matters right now
       ↓
Director acts: approves, dismisses, navigates deep
       ↓
System records: all decisions in audit log
       ↓
Loop repeats next session
```

---

## PART 2: NAVIGATION ARCHITECTURE

### Primary Navigation — 6 items

```
TODAY         /director
PLAYERS       /director/players
CURRICULUM    /director/curriculum
COACHES       /director/coaches
APPROVALS     /director/review
SETTINGS      /director/settings
```

**Nothing else appears in primary navigation.**

DONNA is a persistent floating button — not a nav item. It is always accessible.

### Navigation Design Rules

1. 6 items maximum. If a new feature can't fit into one of these 6, it belongs inside one, not alongside it.
2. Approvals badge shows count. This is the only badge in navigation.
3. TODAY is always item 1. It is the default landing page.
4. SETTINGS is always last. It signals low-frequency, low-urgency.
5. Nav labels are nouns, not verbs. "Players", not "Manage Players".
6. No icons without labels. Both label and icon always visible on desktop.

### Sub-navigation (within pages)

Each primary page has at most 3 tabs or sections. If more are needed, some content is hidden behind DONNA.

| Page | Max Tabs/Sections |
|---|---|
| TODAY | None — single scrolling surface |
| PLAYERS | Needs Attention · All Players |
| CURRICULUM | Create · Improve · Review |
| COACHES | Active Coaches |
| APPROVALS | Pending · Completed |
| SETTINGS | Academy · Philosophy · Access · Preferences |

---

## PART 3: PAGE SPECIFICATIONS

---

### TODAY — `/director`

**Goal:** Give the Director a complete operating picture in under 60 seconds.

**When used:** Every time the Director opens AcademyOS. This is the default landing page.

**What always appears:**
1. Academy Situation banner (1 line: weather metaphor for academy health — Clear / Watch / Storm)
2. DONNA Daily Brief (3-sentence summary of what matters today)
3. Top 3 Priorities (numbered, each with a direct action link)
4. Top 3 Alerts (time-sensitive issues requiring attention)
5. Top 3 Wins (positive signals — used for morale and direction)
6. What Changed (since last login — items that shifted)
7. What Can Wait (explicitly deferred — removes anxiety)
8. Ask DONNA chip (pre-populated question for the top priority)

**What never appears:**
- Raw data tables
- Charts or graphs
- Player lists
- Session lists
- KPI dashboards

**Component hierarchy:**
```
<AcademySituationBanner />             ← weather / health signal
<DonnaDailyBriefHero />               ← 3-sentence brief + capacity
<TopThreePrioritiesPanel />           ← #1 #2 #3 with direct links
<TopThreeAlertsPanel />               ← urgent signals
<TopThreeWinsPanel />                 ← positive signals
<WhatChangedPanel />                  ← delta since last visit
<WhatCanWaitPanel />                  ← explicitly deferred items
<DonnaCOOPanel />                     ← 5 COO questions pre-answered
```

**First-time Director experience:**
- Setup mode shown instead of operating mode
- 3–5 setup steps with clear descriptions of WHY each matters
- Progress indicator (2 of 5 complete)
- CTA: "Continue Setup" links to next incomplete step

**Returning Director (30 days away):**
- Brief acknowledges the gap: "You haven't logged in for 30 days. Here's what changed."
- WhatChangedPanel dominates
- DONNA brief focuses on re-orientation, not day-to-day

**60-second experience:**
- Brief + Top 3 Priorities visible without scrolling
- One prominent CTA button for the #1 priority
- Everything below the fold is "when you have more time"

**Mobile:**
- Situation Banner (full width)
- Brief (collapsed to 1-2 lines, expandable)
- Priorities as swipeable cards
- Bottom navigation: Today · Players · Approvals (3 items, not 6)

---

### PLAYERS — `/director/players`

**Goal:** Tell the Director who needs their attention before showing them a list.

**When used:** When managing player development, onboarding, or responding to player signals.

**What always appears:**
1. DONNA Player Summary (1–2 sentences: "3 players need attention. 7 are ready to advance.")
2. Segmented view: "Needs Attention" (default) | "All Players"
3. Player list with smart sorting (needs attention first)
4. Search + filter bar (above fold)

**Needs Attention criteria (DONNA-determined):**
- On hold / reassessment due
- Stalled 180+ days
- No curriculum level assigned
- No coach assigned
- Pending placement decision

**Player card fields (compact view):**
- Name + initials avatar
- Current level
- Status badge (Active / On Hold / Pending)
- One DONNA signal (stuck 6mo / ready to advance / parent update needed)
- Last activity date

**Action shortcuts from player list:**
- Tap player → full profile
- Long-press / action button → "Ask DONNA about [Name]"

**Sub-pages:**
```
/director/players                         ← directory (segmented)
/director/players/[playerId]              ← full profile
/director/players/[playerId]/onboard      ← onboarding flow
/director/players/new                     ← add new player
/director/players/import                  ← bulk import
```

**All other player sub-routes (active, development-intake, onboarding-review) resolve to one of the above via redirect.**

**Player Profile (`/director/players/[playerId]`):**
```
<PlayerProfileConstitutionHero />         ← name, level, status, photo
<PlayerActivePriorities />                ← what DONNA says to focus on
<PlayerCurriculumAssignmentCard />        ← level + gate progress
<AssessmentHistoryCard />                 ← evidence timeline
<CoachObservationsFeed />                 ← coach notes + wrap-ups
<ParentGuidancePreviewPanel />            ← parent communication history
<LevelReadinessSummary />                 ← advancement eligibility
```

**DONNA integration:**
- "Ask DONNA about [Player Name]" available on every player page
- DONNA can draft: development summary, parent update, priority recommendation, advancement request

---

### CURRICULUM — `/director/curriculum`

**Goal:** Let the Director create content, improve it based on reality, and review recommendations — all in one place.

**When used:** When building curriculum, responding to DONNA's evolution recommendations, or reviewing coach curriculum suggestions.

**3-section structure (tabs at top of builder):**

#### Create
What it is: Add new content to the curriculum.
DONNA role: Interprets natural language ("add a forehand drill to Orange Ball 2") and drafts the item for director review.
Primary component: `DonnaCurriculumPanel` (existing)
Supporting: `CurriculumRecommendationCard` (existing recommendations from architect)

#### Improve
What it is: Evidence-based recommendations for evolving the curriculum.
DONNA role: Runs all sub-engines (bottleneck detector, gate evaluator, effectiveness engine, reality override) and produces ranked recommendations with evidence.
Primary component: `CurriculumEvolutionPanel` (exists, needs wiring)
Key features:
- Evidence strength indicator on each recommendation
- Recommendation type badge (Create / Improve / Reorder / Investigate / Monitor)
- Ask Why → ExplainWhyModal
- Approve / Dismiss / Later actions
- False positive prevention (suppresses noise when player outcomes are excellent)

#### Review
What it is: All curriculum change proposals pending director approval.
DONNA role: Filters and ranks pending curriculum proposed_actions.
Primary component: Curriculum-filtered view of `/director/review`

**Curriculum landing (before tabs):**
```
<CurriculumHealthStrip />               ← 3 key health signals (no score)
<DonnaCurriculumBrief />               ← 1-sentence DONNA take on curriculum state
```

**Sub-navigation (Builder):**
```
/director/curriculum/builder            ← main editing surface (Create + Improve + Review tabs)
/director/curriculum/level/[levelId]    ← level detail + content management
```

**All other curriculum routes (map, guided, learning, academy-version, add-drill, add-fitness, impact-preview) fold into Builder as inline interactions.**

**First-time Curriculum experience:**
- Builder shows empty state with guided prompts
- DONNA suggests starting with the most-populated player level

---

### COACHES — `/director/coaches`

**Goal:** Show the Director who is performing and who needs support, before showing a list.

**When used:** When managing coach assignments, reviewing recap completion, or following up on execution quality.

**What always appears:**
1. DONNA Coach Summary ("2 of 5 coaches have incomplete recaps this week. 1 coach has no group assignments.")
2. Coach list with completion indicators
3. Invite Coach button

**Coach card fields:**
- Name + role
- Assigned groups
- Wrap-up completion rate (last 30 days)
- DONNA signal (missing recap / excellent execution / etc.)

**Coach Profile (`/director/coaches/[coachId]`):**
```
<CoachGroupAssignmentPanel />           ← which groups/sessions
<WrapUpCompletionSummary />             ← completion rate + recent recaps
<PlayerOutcomesForCoach />              ← how are this coach's players doing
```

**DONNA integration:**
- "Ask DONNA about [Coach Name]" available on coach profile
- DONNA can draft: coach communication, assignment change, recognition note

---

### APPROVALS — `/director/review`

**Goal:** Give the Director a clear, prioritized queue of everything awaiting their decision.

**When used:** Multiple times daily for active academies.

**What always appears:**
1. DONNA Queue Brief ("8 items await. Here's what I recommend you review first: 2 placements, 1 curriculum change, 5 session wrap-ups.")
2. Prioritized list of pending proposed_actions
3. Batch actions for low-risk items

**Queue priority order (DONNA-determined):**
1. Placement decisions (player advancement — time-sensitive)
2. Parent communications (time-sensitive)
3. Attendance exceptions (operational)
4. Session wrap-ups (routine — can batch approve)
5. Curriculum changes (deliberate — requires reading)
6. Evidence requirements (low urgency)

**Action card design:**
- What it is (type badge)
- Who it affects (player/coach name)
- What DONNA recommends
- Evidence or reason
- Confidence indicator
- Approve | Reject | Modify | Ask DONNA

**Aging indicator:**
- Items > 3 days get an orange timestamp
- Items > 7 days get a red timestamp

**Sub-pages:**
```
/director/review                        ← queue (default: pending)
/director/review/[actionId]             ← individual item detail
```

**All current duplicate approval surfaces (ai-suggestions, donna-analytics, private-lessons as approvals) merge here via redirect.**

---

### SETTINGS — `/director/settings`

**Goal:** Single place for all configuration that doesn't change frequently.

**When used:** During initial setup; monthly for updates; never during daily operations.

**4-section structure:**

#### Academy
- Academy name
- Location
- Contact information
- Branding (future)

#### Philosophy
- Academy DNA sliders (currently in onboarding)
- Mission statement
- Director challenge (stated coaching priority)
- Re-run Academy Setup wizard ("Revisit your academy identity")

#### Access
- Coach management (invite, remove, permissions)
- Parent portal settings
- Role-based access (future)

#### Preferences
- Notification preferences
- Assessment templates
- Level gates configuration
- Data export (future)

**"Re-run Setup" CTA:**
A button in Philosophy that re-runs the onboarding interview. This replaces the permanent Onboarding nav item.

---

## PART 4: USER JOURNEYS

### Journey 1: First-Time Director (Day 1)

```
Login → TODAY (Setup Mode)
  ↓
Step 1: Academy Identity (DONNA interview)
  ↓
Step 2: Curriculum Setup (level + gate structure)
  ↓
Step 3: Add first player → Placement → Level assignment
  ↓
Step 4: First session template
  ↓
Step 5: Complete — Academy goes live
  ↓
TODAY switches to Operating Mode
```

**Time target:** < 30 minutes to a live academy.

---

### Journey 2: Daily Operations (2–5 minutes)

```
Login → TODAY
  ↓
Read DONNA brief (30 seconds)
  ↓
See Top 3 Priorities → Click #1 (links directly to the thing)
  ↓
Complete action → return to TODAY
  ↓
Check Approvals badge → review 2–3 pending items
  ↓
Done
```

**Time target:** < 5 minutes for daily check-in.

---

### Journey 3: Returning After 30 Days

```
Login → TODAY
  ↓
DONNA brief acknowledges gap: "You've been away 30 days. Here's what changed."
  ↓
WhatChangedPanel expands (dominant section)
  ↓
Priority 1 = most urgent item accumulated during absence
  ↓
Director works through accumulated queue
  ↓
Back to normal operations
```

---

### Journey 4: Player Needs Attention

```
TODAY → Priority card: "Jordan Chen is stuck at Orange Ball 2 for 8 months"
  ↓
Click → PLAYERS → Jordan Chen profile
  ↓
DONNA summary at top: "Jordan shows weak serve domain. 3 assessments support this."
  ↓
Director reviews evidence
  ↓
Director: "Ask DONNA for a development plan" → DONNA drafts plan
  ↓
Director approves plan → enters APPROVALS queue
  ↓
Approved → recorded in audit log → visible to coach
```

---

### Journey 5: Curriculum Evolution (Weekly)

```
CURRICULUM → Improve tab
  ↓
DONNA: "3 recommendations based on player reality signals"
  ↓
Director reads #1: "Orange Ball 2 gate has 0% advancement rate. Evidence: 15 players, 0 advancing."
  ↓
Director: "Ask Why" → ExplainWhyModal opens
  ↓
Director satisfied → "Approve"
  ↓
Enters proposed_actions → DONNA drafts curriculum change
  ↓
Returns to Approvals → approves the draft
  ↓
Curriculum updated → recorded in evolution memory
```

---

### Journey 6: Coach Recap Missing (2 minutes)

```
TODAY → Alert: "Coach Sarah has 3 sessions without recaps"
  ↓
Click → COACHES → Sarah's profile
  ↓
Sessions without recap listed
  ↓
Director: "Send Sarah a reminder" → DONNA drafts message
  ↓
Director approves → enters APPROVALS → approved → sent (future)
```

---

## PART 5: INFORMATION HIERARCHY

### What Always Appears (Above the Fold)

On every page, the DONNA summary is the first thing visible. No exceptions.

```
[DONNA Summary — 1–2 sentences]
[Page Content]
```

### What Is Available But Not Shown By Default

- Historical data (older than 30 days)
- Low-confidence signals
- Items the director has dismissed or deferred
- Platform diagnostics

### What Never Appears On Director Screens

- Raw database identifiers (UUIDs visible in URLs are acceptable)
- Internal score components (e.g., never show "84/100 curriculum score")
- Platform/debug tools
- Demo or seed data labeled as real
- Confidence numbers without context
- Error stack traces

---

## PART 6: DONNA INTERACTION PATTERNS

### Pattern 1: Brief (Every Page)

Every page opens with a 1–2 sentence DONNA assessment. This brief is contextual to the page.

- TODAY: Academy health + top priority
- PLAYERS: Who needs attention
- CURRICULUM: Evolution status
- COACHES: Recap completion status
- APPROVALS: Queue summary + recommendation order

### Pattern 2: Ask DONNA (Everywhere)

A consistent "Ask DONNA" chip appears at the top of every page with a pre-populated, contextual question. Director can tap to launch or modify the question.

Examples:
- TODAY: "Donna, what should I focus on today?"
- PLAYERS: "Donna, which players need my attention?"
- CURRICULUM: "Donna, what curriculum should I improve?"
- COACHES: "Donna, how are my coaches performing?"
- APPROVALS: "Donna, what should I approve first?"

### Pattern 3: Entity Summaries (Player / Coach Profiles)

On any profile page, DONNA provides a 2–3 sentence assessment of that specific entity.

- Player: "Jordan has been at Orange Ball 2 for 8 months. Their serve is the key blocker. 3 coach observations support this."
- Coach: "Sarah has a 92% wrap-up completion rate. Her players are advancing 30% faster than average."

### Pattern 4: Explanation (Ask Why)

On every DONNA recommendation:
- "Ask Why" opens a modal explaining: the evidence, the reasoning, the alternatives, the risks.
- The Director does not need to trust DONNA — they can interrogate every recommendation.

### Pattern 5: Drafts → Approvals

DONNA never acts directly. Every DONNA output enters proposed_actions. The Director approves from APPROVALS.

```
Director: "Create a development plan for Jordan"
  ↓
DONNA: draft created
  ↓
[In Approvals: "Development plan draft for Jordan — tap to review"]
  ↓
Director: approve / modify / reject
  ↓
[If approved: audit_log entry created + action executed]
```

---

## PART 7: APPROVAL PATTERNS

### Core Rule

> AI proposes → Director approves → System records → System executes

This is inviolable. No exception in any sprint.

### Approval Item Structure

Every item in the Approvals queue has:
1. **Type badge** — what kind of change is proposed
2. **Entity** — which player / coach / curriculum level it affects
3. **DONNA confidence** — how certain DONNA is (shown as signal strength, not %)
4. **Evidence summary** — why DONNA recommends this (1–3 lines)
5. **Recommended action** — what DONNA suggests doing
6. **Risk note** — what could go wrong if approved
7. **Decision controls** — Approve / Reject / Modify / Ask DONNA / Defer

### Batch Approval

For low-risk, high-confidence items (session wrap-up confirmations, routine attendance notes), a "Batch Approve All" button appears for items where DONNA confidence is ≥ 90%.

### Never Batchable

These require individual review:
- Player level movement
- Curriculum REMOVE actions
- Parent communications
- Coach assignment changes
- Placement decisions

---

## PART 8: COLOR AND VISUAL HIERARCHY GUIDANCE

### Priority Colors

| Context | Color | Token |
|---|---|---|
| Primary action | Lime | `#C8FF00` |
| Alert / urgent | Red | `#FF3B30` |
| Warning | Orange | `#FF9500` |
| Success / positive | Green | `#30D158` |
| Info / system | Blue | `#0A84FF` |
| Muted / secondary | Gray | `#AAAAAA` |

### Information Hierarchy Rules

1. **Headline = white.** `text-text-primary (#FFFFFF)` for all H1/H2.
2. **Body = secondary.** `text-text-secondary (#AAAAAA)` for explanatory text.
3. **Labels = muted.** `text-text-muted (#555555)` for metadata and field labels.
4. **Numbers = lime mono.** Key numbers (`font-mono text-lime`) for metrics that matter.
5. **Alerts = red.** Status-red for anything requiring immediate attention.
6. **Positive signals = green.** Status-green for wins and good news.

### Card Hierarchy

- **Primary action surface:** `bg-surface` (`#111111`) with `border-border`
- **Elevated / DONNA card:** `bg-surface-raised` (`#1A1A1A`) with lime border glow
- **Background:** `bg-base` (`#0A0A0A`)

### What Should Never Appear

- Gradients on interactive elements
- Scores or grades (no "84/100", no letter grades)
- Progress bars for subjective concepts (player "development progress")
- Color-coded "improvement %" without context
- Decorative icons that carry no information
- More than 3 colors on a single card

### What Should Always Appear

- A DONNA brief at the top of every page
- A direct action path from every signal (don't show a problem without a "what to do" link)
- An "Ask DONNA" entry point on every major surface
- Confidence / evidence indicators on DONNA recommendations
- Timestamps on all DONNA-generated content

---

## PART 9: MOBILE CONSIDERATIONS

### Mobile Navigation (3 items)

```
TODAY    PLAYERS    APPROVALS
```

CURRICULUM and COACHES accessible from TODAY context or via DONNA.
SETTINGS accessible from TODAY → profile/settings.

### Mobile TODAY

- Swipeable cards for Priorities, Alerts, Wins
- DONNA brief collapsed to 1 line (expandable)
- One prominent CTA button per visit
- Bottom nav (3 items)

### Mobile PLAYERS

- Card-based list (not table)
- One DONNA signal per card
- Tap → full profile (bottom sheet, not new page)

### Mobile APPROVALS

- Card stack (swipe to approve / dismiss — future enhancement)
- Batch approve button for low-risk items
- Clear aging indicators

### Mobile Constraints

- No split-pane views
- No horizontal scrolling tables
- Maximum 2 columns in any grid
- Bottom sheet for detail views (not full-page navigation)

---

## PART 10: WHAT SHOULD NEVER APPEAR ON DIRECTOR SCREENS

1. Raw SQL / database field names in UI copy
2. Internal scoring components ("84/100 health score")
3. Letter grades for curriculum, player, or coach quality
4. Demo / seed data labeled as real data
5. Error stack traces or raw error messages
6. Platform diagnostic tools (migration-verify, support-diagnostics, demo)
7. "Dashboard" as a page label (too generic)
8. "Templates" as a primary nav item (developer concept)
9. More than 6 primary navigation items
10. Any table without a DONNA summary above it
11. Orphan pages (routes with no parent nav item)
12. Confirmation dialogs for low-risk read-only operations
13. Page titles that don't match the nav label
14. Redundant "Back" buttons when breadcrumbs exist
15. Confusing labels: "What Should I Ignore", "Development Intake", "Academy Version"

---

## PART 11: WHAT SHOULD ALWAYS APPEAR ON DIRECTOR SCREENS

1. DONNA brief at the top of every primary page
2. "Ask DONNA" chip with contextual pre-filled question
3. Evidence / confidence signal on every DONNA recommendation
4. Direct action link from every DONNA signal (never show a problem without a path to resolution)
5. Approval count badge in nav when queue is non-empty
6. Director name in sidebar header (personalization signal)
7. Academy name in sidebar header (orientation)
8. Timestamp on all generated content
9. Explicit "What Can Wait" or equivalent deferred section on TODAY
10. Breadcrumb for any page more than 1 level deep

---

## PART 12: CERTIFICATION CHECKLIST

Before the Fable redesign is complete, every item on this list must pass:

**Navigation**
- [ ] Exactly 6 primary nav items
- [ ] DONNA is floating, not nav
- [ ] Approvals badge count works
- [ ] TODAY is default landing

**TODAY**
- [ ] DONNA brief visible without scrolling
- [ ] Top 3 Priorities visible without scrolling
- [ ] Each priority has a direct action link
- [ ] No tables on TODAY
- [ ] Setup mode for new academies
- [ ] Re-orientation mode for returning directors

**Players**
- [ ] DONNA summary visible before list
- [ ] Needs Attention segment as default
- [ ] Player cards show 1 DONNA signal each
- [ ] All sub-routes accessible

**Curriculum**
- [ ] Create / Improve / Review tabs present
- [ ] Evolution panel wired and visible under Improve
- [ ] No score or grade anywhere
- [ ] DONNA brief above builder

**Coaches**
- [ ] DONNA summary visible before list
- [ ] Wrap-up completion rate on coach cards
- [ ] Coach profile shows DONNA assessment

**Approvals**
- [ ] DONNA queue brief at top
- [ ] Prioritized by urgency (not creation date)
- [ ] Aging indicators on all items
- [ ] Individual review accessible from each item
- [ ] Batch approve for low-risk items only

**Settings**
- [ ] All configuration consolidated here
- [ ] Academy DNA accessible from Settings
- [ ] "Re-run setup" CTA present
- [ ] No operational features in Settings

**Information architecture**
- [ ] Zero duplicate surfaces
- [ ] Zero orphan pages
- [ ] All legacy routes have redirects
- [ ] Platform routes moved to /platform

**DONNA integration**
- [ ] DONNA proposes, Director approves, always
- [ ] Ask DONNA entry point on every primary page
- [ ] Explain Why modal on every recommendation
- [ ] Evidence shown with every recommendation
- [ ] Confidence level shown (as strength signal, not raw %)

**Mobile**
- [ ] Bottom navigation with 3 items
- [ ] No horizontal scroll tables
- [ ] Swipeable priority cards
- [ ] Bottom sheets for detail views

---

## APPENDIX A: INTELLIGENCE SYSTEMS AND THEIR SURFACES

This maps each DONNA intelligence engine to the UI surface it should appear on.

| Engine | Surface | Section |
|---|---|---|
| `academySituationAssessment` | TODAY | Situation Banner |
| `directorDailyBriefEngine` | TODAY | DONNA Brief Hero |
| `whatShouldIDoTodayEngine` | TODAY | Top 3 Priorities |
| `academyOpportunityEngine` | TODAY | Top 3 Wins |
| `academyAttentionEngine` | TODAY | Top 3 Alerts |
| `academyChangeEngine` | TODAY | What Changed + What Can Wait |
| `cooConversationEngine` | TODAY | COO Panel (bottom) |
| `curriculumEvolutionEngine` | CURRICULUM → Improve | Evolution Panel |
| `curriculumBottleneckDetector` | CURRICULUM → Improve | within Evolution |
| `gateEffectivenessEngine` | CURRICULUM → Improve | within Evolution |
| `curriculumHealthEngine` | CURRICULUM | Health summary |
| `curriculumArchitect` | CURRICULUM → Create | Architect Panel |
| `curriculumGapAnalysis` | CURRICULUM → Create | Gap Recommendations |
| `curriculumDuplicateDetector` | CURRICULUM → Create | Duplicate Warning |
| `curriculumImpactPreview` | CURRICULUM → Create | Impact Preview |
| `curriculumRealityOverride` | CURRICULUM → Improve | Reality Override section |
| `donnaIntentRouterV1` | Global | DONNA assistant (floating) |
| `philosophyMemory` | TODAY (via brief) + SETTINGS | DNA display |
| `academyEvolutionMemory` | CURRICULUM → Improve | evolution memory context |

---

## APPENDIX B: PROPOSED_ACTIONS TAXONOMY

All DONNA actions flow through `proposed_actions`. This table maps each action type to its primary Approvals tab.

| target_module | Display name | Default tab | Batchable? |
|---|---|---|---|
| `session_wrap_up_v1` | Session Wrap-Up | Operations | Yes (low risk) |
| `placement_review` | Player Placement | Placements | No |
| `placement_recommendation_draft` | Placement Recommendation | Placements | No |
| `placement_assessment_draft` | Placement Assessment | Placements | No |
| `level_review` | Level Movement | Placements | No |
| `curriculum_override` | Curriculum Change | Curriculum | No |
| `curriculum_builder_draft` | Curriculum Draft | Curriculum | No |
| `assessment_studio_draft` | Assessment | Placements | No |
| `parent_communication` | Parent Update | Communications | No |
| `attendance_exception` | Attendance Exception | Operations | Yes |
| `evidence_requirement` | Evidence Requirement | Development | Yes |
| `priority_recommendation` | Development Priority | Development | No |
| `development_summary_draft` | Development Summary | Development | No |
| `coach_observation_draft` | Coach Observation | Operations | Yes |

---

## DOCUMENT STATUS

This blueprint is a living document. It should be updated whenever:
- A new intelligence engine is created (add to Appendix A)
- A new proposed_action type is created (add to Appendix B)
- A navigation decision is changed
- A new user journey is identified

**Next update trigger:** Sprint 1865A (Production Readiness) — wiring Evolution Panel.
**Fable design start:** After Sprint 1865A certification passes.
