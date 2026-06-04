# AcademyOS Site Map UX Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Scope:** All current routes discovered in `src/app/`
**Purpose:** Document every route, its role, purpose, cognitive load, and UX recommendation

---

## Methodology

Routes discovered by traversing `src/app/**/*.tsx` and reading page-level source files.
No UI was rendered — audit is based on code analysis, data queries, and component structure.

---

## Director Routes

### `/director` — Dashboard / Today

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Daily operational command center |
| DONNA present | Yes — DonnaFirstGreeting, DonnaScreenBriefStatic, DonnaAcademyCOOBriefCard, DonnaCommandSection |
| Navigation entry | "Today" in sidebar |

**Current main actions:**
- DONNA greeting + daily brief
- DONNA COO brief card (expanded by default)
- Primary action hero (pending review count + attention queue)
- 7-KPI strip
- Collapsible sections: Sessions This Week, Quick Actions, Academy Metrics, Alerts & Placement, Analytics, Academy Setup

**Cognitive load:** HIGH
- Page has 8+ distinct visual zones before any collapsing
- DONNA greeting + DONNA screen brief + DONNA COO brief card = 3 DONNA surfaces before the director reaches any data
- KPI strip shows 7 tiles: Players Needing Attention, Pending Onboarding, Assessments Needing Review, Players Ready for Reassessment, Parent Updates Pending, Coach Recaps Missing, Active Placement Reviews
- All collapsible sections start closed — but the above-fold area alone is extremely dense
- Academy Setup section at bottom repeats information already in the Director Onboarding page

**Overlap with other pages:**
- "Sessions This Week" overlaps with `/director/today` (sessions on court)
- "Quick Actions" duplicates sidebar navigation
- "Alerts & Placement" overlaps with `/director/signals`
- "Academy Metrics" overlaps with `/director/kpi`
- DONNA COO brief overlaps with `/director/donna`

**Recommendation:** REDESIGN — The dashboard tries to be everything at once. The three DONNA surfaces alone create redundancy. The KPI strip is valuable but the section architecture needs to collapse into a single command signal. The director's opening view should be: 1 DONNA brief sentence, 1 primary action, 1 status number — not 8 zones.

---

### `/director/today` — Today's Academy

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Today's session feed + live status |
| DONNA present | Yes — DonnaTodayBriefPanel, DONNA suggestion chips |
| Navigation entry | Not in primary sidebar (linked from `/director` dashboard) |

**Current main actions:**
- 4-stat strip: Sessions Today, Completed, Pending Review, Risk Flags
- Today's sessions list (2/3 width)
- DONNA Priority Brief + player attention risk (1/3 width)
- DONNA suggestion chips
- Risk flags card
- Quick actions links

**Cognitive load:** MEDIUM
- Layout is clean 2/3 + 1/3 grid
- 4-stat strip is clear and scannable
- DONNA right column is well-separated
- Risk flags duplicate the stat strip

**Overlap with other pages:**
- `/director` already shows "Sessions This Week" — Today is a daily subset
- Quick actions duplicate sidebar nav
- Pending Review count duplicates the sidebar badge

**Recommendation:** KEEP but merge with `/director` dashboard. Today's Academy is what the Dashboard *should* be — a focused operational view for the running day. The dashboard should redirect here or become this.

---

### `/director/review` — Approvals / Review Queue

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Review and approve proposed actions from all sources |
| DONNA present | Yes — DonnaReviewBriefPanel, DonnaCommandSection, DonnaReviewTabGuide |
| Navigation entry | "Approvals" in sidebar |

**Current main actions:**
- 4 tabs: Needs Approval, Player Updates, Curriculum & Session, Completed
- Each tab contains multiple card types (15+ card component types)
- Approve / Reject / Apply controls on each card
- DONNA brief at top + per-tab DONNA guide chips

**Cognitive load:** HIGH
- 15+ card types create an inconsistent review experience
- Director must understand what each card type means before taking action
- Tabs group by data type, not by urgency or decision difficulty
- "Needs Approval" tab mixes wrap-ups, attendance exceptions, placements, voice intake, curriculum — very heterogeneous
- DONNA review brief + command section + tab guide = 3 DONNA surfaces before any cards

**Overlap with other pages:**
- Placement reviews overlap with `/director/players`
- Curriculum overrides overlap with `/director/curriculum`
- Session wrap-ups overlap with `/director/sessions/[id]`

**Recommendation:** SIMPLIFY — The review queue is the most critical director action. It needs to lead with urgency, not data type. A flat list sorted by urgency (not tabs by category) would reduce friction. DONNA should pre-explain the top 3 items so the director can act immediately.

---

### `/director/players` — Players Directory

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Full roster directory with search and status filter |
| DONNA present | Yes — DonnaPlayersPresenceCTA, DonnaScreenBriefStatic, DonnaCommandSection |
| Navigation entry | "Players" in sidebar |

**Current main actions:**
- Search by name
- Filter by status
- Player list with curriculum badge, status badge
- Import, Add new, Development intake actions

**Cognitive load:** MEDIUM
- Clean list view
- 3 DONNA surfaces before the list (DonnaPlayersPresenceCTA, DonnaScreenBrief, DonnaCommandSection) is too many
- Action buttons (import, add, development intake) at top right are good
- Missing: group filter, bulk actions

**Overlap with other pages:**
- Player status tiles on `/director` repeat what the list shows

**Recommendation:** KEEP — good functional design. Remove 2 of 3 DONNA surfaces; keep only the DonnaScreenBrief. Group filter is needed for a tennis academy.

---

### `/director/players/[playerId]` — Player Profile

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Complete per-player view: status, curriculum, skill, assessment |
| DONNA present | Partial — in tabs but no top-level DONNA brief |
| Navigation entry | Linked from players list |

**Current main actions:**
- 5 tabs: Overview, Skill Path, Competition, Fitness/Load, Notes
- Player header: name, level, status, curriculum
- Each tab shows different data

**Cognitive load:** MEDIUM-HIGH
- Tab navigation is appropriate for dense player data
- 5 tabs is a manageable number
- But tabs load independently — no unified DONNA "here is what matters about this player" at the top
- `grid-cols-[260px_1fr_260px]` layout breaks on mobile (known bug)
- Missing: no top-level "what DONNA sees about this player in 2 sentences"

**Overlap with other pages:**
- Curriculum level picker appears here AND in the curriculum explorer
- Skill path preview appears here AND in player portal

**Recommendation:** SIMPLIFY — Add 1 DONNA brief at top of profile summarizing current status, risk signals, and recommended action. This replaces the need for the director to read all 5 tabs before understanding what's happening.

---

### `/director/sessions` — Sessions List

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | List all sessions, navigate to detail |
| DONNA present | No |
| Navigation entry | "Sessions" in sidebar |

**Current main actions:**
- Session list with date, status, coach
- Links to session detail
- "New Session" action
- Sub-routes: archive, overview

**Cognitive load:** LOW-MEDIUM
- Clean list with status indicators
- Missing: DONNA context on which sessions need attention
- "Archive" and "Overview" sub-routes add navigation depth without clear benefit

**Overlap with other pages:**
- Today's sessions visible on `/director` and `/director/today`
- Session overview (`/director/sessions/overview`) likely duplicates list

**Recommendation:** KEEP — simplify sub-routes. Add DONNA brief: "X sessions this week, Y need wrap-up." The archive view should be a tab, not a separate route.

---

### `/director/sessions/[sessionId]` — Session Detail

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Full session view: blocks, attendance, recap, curriculum context |
| DONNA present | Partial — in panels |
| Navigation entry | Linked from sessions list |

**Current main actions:**
- Session header (date, coach, status)
- Block list with curriculum content
- Attendance exception panel
- Session recap summary
- Class roster intelligence
- Group assignment panel
- Session adjustment suggestions
- Planned vs actual diff

**Cognitive load:** HIGH
- 8+ panels on the session detail page create overwhelming vertical scroll
- Most panels will be empty for most sessions
- Director needs to scroll through many empty panels to find the one that matters

**Recommendation:** REDESIGN — session detail should show a DONNA summary first: "This session is [status]. [What happened]. [What needs your review]." Then hide all empty panels by default.

---

### `/director/curriculum` and `/director/curriculum/builder` — Curriculum

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | View and manage the academy curriculum: levels, drills, content |
| DONNA present | Yes — DonnaCurriculumContextPanel, DonnaCurriculumImproveDraftButton, CurriculumDonnaRegistrar |
| Navigation entry | "Curriculum" links to `/director/curriculum/builder` |

**Current main actions:**
- Level tree (5 stages × multiple levels)
- Level detail with drills, content, gates
- Health panel (coverage report)
- DONNA context panel
- Voice override input
- Node drawer (drill/skill/mission/badge content)

**Cognitive load:** HIGH
- The curriculum builder is a complex multi-pane interface
- Level tree + node drawer + health panel + DONNA panel = 4 simultaneous zones
- Each drill node has 10+ sub-fields visible in the drawer
- Directors who are not technical will feel lost

**Sub-routes:**
- `/director/curriculum/academy-version` — curriculum override diffs
- `/director/curriculum/builder` — primary builder view
- `/director/curriculum/learning` — director learning module preview

**Overlap with other pages:**
- Learning modules preview is separate from builder but related
- Academy version is separate but should be a tab

**Recommendation:** REDESIGN — The curriculum explorer needs a DONNA-first approach. Before showing the tree, DONNA should say: "Your curriculum has X levels. Y need attention. The biggest gap is Z." Then the tree is available for drill-down.

---

### `/director/templates` — Templates Hub

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Create and manage class and fitness session templates |
| DONNA present | Yes — TemplatesDonnaPanel |
| Navigation entry | "Templates" in sidebar |

**Current main actions:**
- Create Class Template / Create Fitness Template / Review Existing / Coach Preview / Impact Preview
- Sub-routes: class templates, fitness templates, donna suggestions, impact preview, coach preview

**Cognitive load:** MEDIUM
- Hub/gateway design is appropriate
- Sub-routes create depth (class-templates list → template detail is 2 clicks)
- Duplicate routes: `/director/class-templates/*` AND `/director/templates/class/*` both exist

**Overlap with other pages:**
- Class templates and Fitness templates are separate sub-sections but linked from one hub
- Templates are a pre-requisite to sessions — should be more connected to sessions workflow

**Recommendation:** SIMPLIFY — Merge the two class template route trees (class-templates/* and templates/class/*). A single Templates page with Class and Fitness tabs is cleaner.

---

### `/director/coaches` — Coaches

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | View and manage coaches, invite new coaches |
| DONNA present | No |
| Navigation entry | "Coaches" in sidebar |

**Current main actions:**
- Coach list
- Coach detail `/director/coaches/[coachId]`
- Invite coach form

**Cognitive load:** LOW
- Simple directory + invite
- Missing: DONNA context on coach performance, wrap-up rates
- Coach detail page exists but unclear what it shows

**Recommendation:** KEEP — add DONNA brief with coach performance signals (wrap-up completion rate, sessions run).

---

### `/director/parents` — Parent Updates

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Review and approve parent-facing communications |
| DONNA present | Unknown (not read in detail) |
| Navigation entry | "Parent Updates" in sidebar |

**Current main actions:**
- Presumably shows pending parent communications for approval
- Links to review queue for parent_communication items

**Cognitive load:** UNKNOWN — needs deeper audit
**Overlap with other pages:** Overlaps with Review Queue (parent_communication tab)
**Recommendation:** MERGE into Review Queue as a "Parent" filter. A separate page is unnecessary.

---

### `/director/kpi` — Academy Health

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | KPI dashboard: attendance, development velocity, recap rates |
| DONNA present | Yes — DonnaKpiExplainerPanel |
| Navigation entry | "Academy Health" in sidebar |

**Current main actions:**
- 12 KPI tiles with health/warning/critical thresholds
- DONNA KPI explainer for each
- Attendance trends, development velocity, advancement readiness

**Cognitive load:** HIGH
- 12 KPI tiles is too many to process simultaneously
- Each KPI has its own DONNA explanation — creates an overwhelming amount of text
- Director looking for "is the academy healthy?" doesn't need 12 KPIs

**Overlap with other pages:**
- `/director` page has an Academy Metrics section with similar KPIs
- Academy Health badge on the dashboard header leads to a drawer version of this

**Recommendation:** SIMPLIFY — Surface 3 "vital signs" (Health %, Attention Count, Wrap-up Rate) prominently. Other 9 KPIs go into expandable detail. DONNA should give one headline: "Academy is [healthy/at risk/critical] because [single reason]."

---

### `/director/donna` — DONNA Full Page

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | DONNA command interface: attention items, risks, recommendations, chat |
| DONNA present | Yes — central purpose of this page |
| Navigation entry | Persistent floating DONNA button (not in sidebar) |

**Current main actions:**
- Director context load (players, sessions, review queue)
- Attention items list
- Risk items
- Recommended actions
- DONNA voice/text shell
- Entity summaries
- Intelligence signals card

**Cognitive load:** HIGH
- Page has too many sections (attention, risks, recommendations, context, entity summaries, intelligence signals, action suggestions)
- Most sections overlap with the dashboard
- The chat interface is buried under multiple panels

**Overlap with other pages:**
- Almost everything on this page exists elsewhere in the app
- This is the only place with the actual DONNA chat interface — this is the problem

**Recommendation:** REDESIGN — The DONNA page should be the chat interface, with data context shown inline as DONNA references it. Everything else (attention items, risks) should stay on the dashboard. DONNA is a brain, not a secondary dashboard.

---

### `/director/signals` — Signals

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Academy-wide signal feed: attendance concerns, missing levels, pending wrap-ups |
| DONNA present | No |
| Navigation entry | Removed from primary sidebar in Sprint 1060 |

**Overlap with other pages:** Heavily overlaps with dashboard Alerts section, review queue, and KPI page
**Recommendation:** MERGE into the dashboard Alerts section and remove as a separate route. Or give it a clear differentiated purpose: the signals page should be the "deep history" view — the dashboard shows current, signals shows trends over time.

---

### `/director/settings` — Settings

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Academy settings: name, preferences, voice configuration |
| DONNA present | No |
| Navigation entry | "Settings" in system items (below fold) |

**Cognitive load:** LOW — correct placement
**Recommendation:** KEEP as-is.

---

### `/director/command-center` — Command Center

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | Voice/text command intake for creating drafts |
| DONNA present | Yes — DirectorAssistantPanel |
| Navigation entry | Not in primary sidebar (Sprint 1060 removed it) |

**Current main actions:**
- Voice/text input → intent matching → draft creation
- Suggestion chips for common commands
- Draft visibility card

**Cognitive load:** LOW (appropriately focused)
**Note:** This is essentially the same as the DONNA page but pre-wired to command intake. The duplication is a design smell.

**Recommendation:** MERGE into DONNA page. The command center's voice intake is exactly what DONNA should do.

---

### `/director/placement` — Placement Engine

| Field | Value |
|---|---|
| Role | `academy_director` |
| Primary purpose | New player placement and onboarding |
| DONNA present | Unknown |
| Navigation entry | Not in primary sidebar |
| Build status | Scaffolded, not complete |

**Recommendation:** KEEP when built — critical path for player onboarding.

---

### `/director/ai-suggestions`, `/director/alerts`, `/director/attention` — Satellite Pages

These pages exist but are not in the primary sidebar. They surface specific data slices also available elsewhere.

- `/director/ai-suggestions` — AI suggestions (overlaps with dashboard Alerts section)
- `/director/alerts` — Alert list (overlaps with dashboard + signals page)
- `/director/attention` — Attention queue client (overlaps with dashboard primary action hero)

**Recommendation:** REMOVE or CONSOLIDATE into the dashboard. These pages exist because the dashboard was too dense to surface their data — the right fix is a better dashboard, not more pages.

---

### Dev / Diagnostic Routes (Director)

These exist for development purposes and should not be accessible in production:

- `/director/demo` — Demo page
- `/director/donna-analytics` — DONNA analytics
- `/director/donna-coo-demo` — DONNA COO demo
- `/director/migration-verify` — Migration verification
- `/director/pilot-readiness` — Pilot readiness dashboard
- `/director/support-diagnostics` — Support diagnostics
- `/director/friction` — Friction audit tool
- `/director/improvement` — Improvement page
- `/director/level-up` — Level up page

**Recommendation:** GATE behind a `?dev=true` param or remove from production builds.

---

## Coach Routes

### `/coach` — Coach Home

| Field | Value |
|---|---|
| Role | `head_coach`, `coach` |
| Primary purpose | Today's sessions, wrap-up status, quick capture |
| DONNA present | Yes — DonnaScreenBriefStatic |
| Navigation entry | Home tab in BottomTabBar |

**Current main actions:**
- DONNA brief
- On-court actions bar
- Daily brief card
- Today's sessions list with wrap-up status badges
- Recent observations

**Cognitive load:** MEDIUM — appropriate for mobile
**Recommendation:** KEEP — well-designed for on-court use. Remove DONNA brief if no real data to show (avoid empty DONNA surfaces).

---

### `/coach/sessions/[sessionId]` — Coach Session Detail

| Field | Value |
|---|---|
| Role | `head_coach`, `coach` |
| Primary purpose | Run a session: view blocks, mark attendance, record observations, wrap up |
| DONNA present | Yes — CoachSessionCurriculumPanel, CoachSessionFocusCard |
| Navigation entry | Linked from coach home |

**Current main actions:**
- Block execution view (play/skip/modify each block)
- Attendance marking
- Quick capture / voice note
- Wrap-up drawer (6-question guided flow)

**Cognitive load:** HIGH during execution
- Block execution is well-designed
- Wrap-up drawer is a separate modal — appropriate
- Two recap UIs exist on the same page (Quick Note + guided Wrap-Up) — known confusion

**Recommendation:** SIMPLIFY — Remove the Quick Note / CoachRecapCommandPanel from the session detail page. The guided wrap-up is the correct flow. Quick notes should be in the on-court actions bar, not competing with the wrap-up.

---

### `/coach/players` and `/coach/players/[playerId]` — Coach Player View

| Field | Value |
|---|---|
| Role | `head_coach`, `coach` |
| Primary purpose | Coach's view of player progress, notes, observations |
| DONNA present | No |
| Navigation entry | Players tab in BottomTabBar |

**Cognitive load:** LOW — simple list + detail
**Recommendation:** KEEP — add DONNA brief on player profile: "Here's what to focus on with [player] today."

---

### `/coach/donna` — Coach DONNA

| Field | Value |
|---|---|
| Role | `head_coach`, `coach` |
| Primary purpose | Coach-facing DONNA interface |
| DONNA present | Yes — central |
| Navigation entry | Linked from coach home |

**Cognitive load:** LOW (single-purpose)
**Recommendation:** KEEP — but verify chat is functional, not just UI.

---

### `/coach/recap` — Recap Page

| Field | Value |
|---|---|
| Role | `head_coach`, `coach` |
| Primary purpose | Recap review for coach |
| DONNA present | Unknown |
| Navigation entry | Unknown |

**Recommendation:** Review purpose — may overlap with session wrap-up flow.

---

## Player Routes

### `/player` — Player Home

| Field | Value |
|---|---|
| Role | `player` |
| Primary purpose | Player's mission, development focus, badges, recent sessions |
| DONNA present | Implied through ask-donna link |
| Navigation entry | Home tab in BottomTabBar |

**Current main actions:**
- Hero card (level + progress ring)
- Assigned missions section
- Mission preview
- Development level stage
- Attendance sparkline
- Recent session history
- Badge report / next badge to earn

**Cognitive load:** MEDIUM-HIGH for a young player
- Multiple sections visible on scroll: hero + missions + development + history + badges
- Young players (8-14) should see 1 thing: "Here is your mission today"
- Progress ring, sparkline, badge report add cognitive overhead

**Recommendation:** REDESIGN — Player home should be maximum 2 things: (1) Today's mission, (2) Progress since last visit. Everything else on drill-down pages.

---

### `/player/skill-path`, `/player/missions`, `/player/wins`, `/player/ask-donna` — Player Sub-pages

All exist and serve clear purposes. Cognitive load is appropriate.
**Recommendation:** KEEP — well-scoped sub-pages. Consider adding DONNA explanation for each.

---

## Parent Routes

### `/parent` — Parent Home

| Field | Value |
|---|---|
| Role | `parent` |
| Primary purpose | Child's development plan, progress, attendance summary |
| DONNA present | Yes — ask-donna link |
| Navigation entry | Home tab in BottomTabBar |

**Current main actions:**
- Child switcher (multi-child parents)
- Development plan (IDP parent view)
- Progress preview
- Attendance stats
- Private lesson request
- Parent support guide
- Parent updates

**Cognitive load:** MEDIUM
- Parent-safe data is well-filtered
- Too many sections visible on one scroll
- "How to support your child" guidance should be the primary content, not buried

**Recommendation:** SIMPLIFY — Parent home should answer 3 questions: (1) Is my child progressing? (2) What should they work on this week? (3) Any updates from the academy? Everything else is a drill-down.

---

### `/parent/updates`, `/parent/progress`, `/parent/wins`, `/parent/development`, `/parent/ask-donna` — Parent Sub-pages

All serve clear purposes. Cognitive load is appropriate.
**Recommendation:** KEEP — well-scoped.

---

## Summary Table

| Route | Role | Load | DONNA | Recommendation |
|---|---|---|---|---|
| `/director` | Director | HIGH | 3 surfaces | REDESIGN |
| `/director/today` | Director | MEDIUM | Present | MERGE with dashboard |
| `/director/review` | Director | HIGH | 3 surfaces | SIMPLIFY |
| `/director/players` | Director | MEDIUM | 3 surfaces | KEEP, reduce DONNA surfaces |
| `/director/players/[id]` | Director | MED-HIGH | Partial | SIMPLIFY, add DONNA brief |
| `/director/sessions` | Director | LOW-MED | No | KEEP, add DONNA brief |
| `/director/sessions/[id]` | Director | HIGH | Partial | REDESIGN |
| `/director/curriculum` | Director | HIGH | Present | REDESIGN |
| `/director/templates` | Director | MEDIUM | Present | SIMPLIFY |
| `/director/coaches` | Director | LOW | No | KEEP, add DONNA |
| `/director/parents` | Director | UNKNOWN | Unknown | MERGE into review queue |
| `/director/kpi` | Director | HIGH | Present | SIMPLIFY |
| `/director/donna` | Director | HIGH | Central | REDESIGN as chat-first |
| `/director/signals` | Director | MEDIUM | No | MERGE into dashboard |
| `/director/command-center` | Director | LOW | Present | MERGE into DONNA |
| `/director/settings` | Director | LOW | No | KEEP |
| `/director/alerts` | Director | LOW | No | REMOVE (duplicate) |
| `/director/attention` | Director | LOW | No | REMOVE (duplicate) |
| `/director/ai-suggestions` | Director | LOW | No | REMOVE (duplicate) |
| `/coach` | Coach | MEDIUM | Present | KEEP |
| `/coach/sessions/[id]` | Coach | HIGH | Present | SIMPLIFY |
| `/coach/players` | Coach | LOW | No | KEEP |
| `/coach/donna` | Coach | LOW | Central | KEEP |
| `/player` | Player | MED-HIGH | Via link | REDESIGN |
| `/player/*` | Player | LOW | Via link | KEEP |
| `/parent` | Parent | MEDIUM | Via link | SIMPLIFY |
| `/parent/*` | Parent | LOW | Via link | KEEP |
