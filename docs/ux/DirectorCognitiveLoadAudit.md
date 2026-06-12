# Director Cognitive Load Audit
## Mega Sprint 1900–1930 — AcademyOS Director Experience Reimagination V1
### Date: 2026-06-12

This audit covers every Director-facing route, its purpose, frequency, decision it supports, and current friction. Designed to feed into the FABLE_DIRECTOR_BLUEPRINT.

---

## CURRENT NAVIGATION (SidebarNav.tsx)

```
Today       /director
Dashboard   /director/kpi
Players     /director/players
Sessions    /director/sessions
Approvals   /director/review
Templates   /director/templates
Curriculum  /director/curriculum
Coaches     /director/coaches
Settings    /director/settings
```

System (non-primary):
```
Assessment Template  /director/assessment-template
Onboarding           /director/onboarding
```

---

## PAGE AUDITS

---

### 1. TODAY — `/director`

**Purpose:** Daily operating command center. DONNA delivers brief, priorities, alerts, wins, what changed, COO conversations.

**Frequency of use:** Every session. Highest.

**Decision supported:**
- What should I do right now?
- What is the overall academy health?
- What has changed since I last logged in?
- What can I safely ignore?

**Current friction:**
- Page name is "Today" but route is `/director` (root). Disconnect between label and URL.
- `WhatShouldIIgnorePanel` uses confusing label — Directors find "ignore" jarring.
- `DonnaCOOPanel` is excellent but buried at bottom — low discovery.
- `DirectorCapacityMeter` shows budget concept that many directors don't understand on first use.
- Brief hero card is excellent but takes ~3 seconds to read on first visit.
- Setup mode (`TodaySetupCard`) shows onboarding steps but doesn't explain WHY each step matters.
- Separate `/director/today` route exists as a legacy path — causes confusion.

**Redundancies:**
- `/director/today/page.tsx` and `/director/page.tsx` both exist. Two "today" pages.
- `DonnaTodayBriefPanel` in `/today/` overlaps with `DonnaDailyBriefHero` in `/director`.

**Confusing labels:**
- "What Can Wait" — good but vague. Could be "Defer These".
- "What Should I Ignore" — negative framing. Could be "Not Urgent".
- "Capacity Meter" — directors don't know what capacity means here.

**Unused information:**
- Raw data counts (sessions this week, pending count) in page.tsx but not prominently displayed.
- `DonnaCOOPanel` answers 5 questions but many directors never scroll to it.

**Missing information:**
- No "next recommended action" button with direct link.
- No "session happening right now" indicator.
- No "last updated at" timestamp on brief.

**Recommendations:**
- Keep as primary landing page.
- Rename "What Should I Ignore" → "Not Urgent".
- Add prominent CTA button linking to #1 priority action.
- Surface `DonnaCOOPanel` questions higher.
- Remove `/director/today` legacy route.

---

### 2. DASHBOARD — `/director/kpi`

**Purpose:** Visual KPI dashboard — trends, historical charts, academy health proof.

**Frequency of use:** Weekly or monthly. Low for daily operators.

**Decision supported:**
- Is my academy improving over time?
- What do the numbers show at a glance?
- What should I show to stakeholders?

**Current friction:**
- "Dashboard" label is generic — doesn't tell the director what they're getting.
- Most KPIs require 30+ seconds of reading.
- No DONNA interpretation layer — raw numbers only.
- Charts have no recommended actions attached.

**Redundancies:**
- Overlaps with summary cards visible on Today page.
- `AcademyKpiCardsSection` and `DirectorKpiHealthSection` cover similar ground.
- `/director/signals` and `/director/alerts` also exist as separate KPI/signal surfaces.

**Confusing labels:**
- "Dashboard" — could be anything. Should say what it measures.

**Unused information:**
- Most of the data shown (attendance trend, level distribution) doesn't drive director action.

**Missing information:**
- No DONNA narrative on what the numbers mean.
- No benchmarks or targets.
- No trend direction indicators.

**Recommendations:**
- Merge into TODAY as an expandable "Academy Metrics" section, or as a drawer.
- Alternatively: move to SETTINGS as "Academy Insights".
- Remove as primary nav item.

---

### 3. PLAYERS — `/director/players`

**Purpose:** Directory of all players. View, filter, sort, access individual profiles.

**Frequency of use:** Daily when managing active academy. High.

**Decision supported:**
- Who needs my attention?
- Who is stuck, advancing, at risk?
- Who is unassigned or pending placement?

**Current friction:**
- Landing page is a static table — no DONNA intelligence layer at the top.
- Director must scan a table to find who needs attention rather than being told.
- Multiple sub-routes are not clearly differentiated:
  - `/players/active` — why separate from `/players`?
  - `/players/onboarding-review` — should this be in Approvals?
  - `/players/development-intake` — hidden entry point.

**Redundancies:**
- `/director/attention/page.tsx` — separate "attention queue" that overlaps with who needs attention in players.
- `/director/level-up/page.tsx` — level movement that is also accessible from player profiles.

**Confusing labels:**
- "Development Intake" — sounds like a medical term.
- "Onboarding Review" — is this for the director reviewing player onboarding, or for players reviewing their onboarding?

**Unused information:**
- Import page (`/players/import`) is present but not prominently accessible.

**Missing information:**
- No DONNA summary at top: "3 players need your attention, 7 are ready to advance."
- No quick filter for: stuck / advancing / at-risk / unassigned.

**Recommendations:**
- Add DONNA intelligence banner at top of `/players` before the table.
- Replace static table as default with segmented view: Needs Attention | Advancing | All.
- Fold `/players/active` into `/players` with a filter.
- Move `/players/onboarding-review` into APPROVALS.

---

### 4. SESSIONS — `/director/sessions`

**Purpose:** Session scheduling, tracking, recap management.

**Frequency of use:** Daily for active academies. High.

**Decision supported:**
- What sessions are happening today/this week?
- Which sessions are missing coach recaps?
- Are sessions going as planned?

**Current friction:**
- Session list view is dense and hard to scan.
- Missing sessions with no recap are not prominently highlighted.
- Director navigates to session → then to wrap-up — multi-click flow.
- Templates are in a separate nav item but sessions use templates — disconnect.

**Redundancies:**
- `/director/sessions/overview` and `/director/sessions` overlap.
- `/director/class-templates` (unlisted route) overlaps with `/director/templates`.

**Confusing labels:**
- "Sessions" covers both scheduled and completed — should distinguish.
- "Archive" is hidden and rarely used.

**Unused information:**
- Session list shows coach names but not recap completion status.

**Missing information:**
- No "coach recap completion rate" indicator on sessions list.
- No "sessions happening today" shortcut from Today.

**Recommendations:**
- Move SESSION under TODAY context — "Today's Sessions" section.
- For historical access: Sessions list remains accessible from Players or a sub-section.
- Surface recap completion rate prominently.

---

### 5. APPROVALS — `/director/review`

**Purpose:** One review queue for all pending proposed_actions: DONNA drafts, assessments, placements, curriculum changes, attendance exceptions.

**Frequency of use:** Daily. Core workflow.

**Decision supported:**
- What has DONNA proposed that needs my approval?
- What is pending and aging?
- What can I batch-approve?

**Current friction:**
- Queue can become overwhelming — no prioritization.
- "Approvals" label in nav is fine but the page title says "Review Queue" inconsistently.
- Tab system in review page has many tabs — cognitive overload.
- Draft cards have too much text — directors skim, miss key details.
- No "aging" indicator on items — directors don't know what's been waiting longest.

**Redundancies:**
- `/director/ai-suggestions` is a second, separate review surface for AI suggestions.
- `/director/donna-analytics` also shows suggestions in a different format.

**Confusing labels:**
- Multiple tab names: "Placement", "Curriculum", "Voice", "General" — not obvious what each contains.

**Unused information:**
- Audit trail panels exist but are rarely accessed.

**Missing information:**
- No "DONNA recommendation summary" at the top — director doesn't know what's in the queue before entering.
- No bulk-approve capability for obvious low-risk drafts.

**Recommendations:**
- Keep as primary nav item — this is the most important daily workflow.
- Add DONNA brief at top: "8 items await — here's what I recommend you approve today."
- Merge `/director/ai-suggestions` and `/director/donna-analytics` into Approvals.
- Add aging indicators.

---

### 6. TEMPLATES — `/director/templates`

**Purpose:** Browse and manage class templates and fitness templates.

**Frequency of use:** Weekly. Medium.

**Decision supported:**
- What session structures do I have?
- What should coaches use this week?
- How do I create or customize a template?

**Current friction:**
- "Templates" is a technical concept — directors think in terms of "sessions" not "templates".
- Two template systems: `/director/templates` (main) and `/director/class-templates` (unlisted). Confusing.
- Fitness templates buried under `/director/fitness`.
- DONNA suggestions for templates (`/director/templates/donna-suggestions`) are not discoverable.
- Template editor is complex and requires multiple steps.

**Redundancies:**
- `/director/class-templates` and `/director/templates/class` cover the same concept.
- `/director/fitness/templates` and `/director/templates/fitness` are duplicate.

**Confusing labels:**
- "Templates" sounds like a developer concept.
- "Fitness Templates" vs "Class Templates" distinction is unclear to non-technical directors.

**Recommendations:**
- Merge all template systems into a single location.
- Fold into CURRICULUM as "Session Plans" or into Sessions as "Structures".
- Remove `/director/class-templates` and `/director/fitness/templates` as separate routes (redirect to unified location).

---

### 7. CURRICULUM — `/director/curriculum`

**Purpose:** View, manage, and evolve the academy's development curriculum.

**Frequency of use:** Weekly. Medium for mature academies, high during setup.

**Decision supported:**
- Is my curriculum complete and balanced?
- Where are the gaps?
- What should I add or change?
- What is DONNA recommending?

**Current friction:**
- Curriculum Command Center page (`/curriculum`) has too many components:
  - `DonnaCurriculumBrief`, `CurriculumIntelligenceCard`, `CurriculumHealthPanel`, `CurriculumHealthStrip`, `CurriculumDonnaContextPanel`, level trees, stage insight cards.
  - A director can spend 5 minutes just reading the page before taking action.
- `/curriculum/builder` is excellent but not prominently linked.
- Evolution panel exists but is not surfaced anywhere.
- Multiple sub-routes (`/map`, `/guided`, `/learning`, `/academy-version`) are not clearly differentiated.

**Redundancies:**
- `/curriculum/_components/CurriculumHealthPanel` and `CurriculumHealthStrip` are two versions of the same concept.
- `DonnaCurriculumBrief` and `DonnaCurriculumContextPanel` overlap.
- `/curriculum/map` and `/curriculum/level/[levelId]` both show level details.

**Confusing labels:**
- "Academy Version" — what does this mean to a director?
- "Guided" curriculum — guided by whom? Towards what?
- "Learning" — what is the director learning?

**Unused information:**
- `/curriculum/map` exists but is not linked from primary navigation.
- Stage insight cards show information directors rarely act on.

**Missing information:**
- Evolution Panel is built but not visible.
- No direct "create content" CTA on curriculum landing.

**Recommendations:**
- Simplify to 3 clear sections: **Create → Improve → Review**.
- Make Evolution Panel the default view after health summary.
- Remove `CurriculumHealthStrip` (redundant with `CurriculumHealthPanel`).
- Redirect `/curriculum/map`, `/curriculum/guided`, `/curriculum/learning`, `/curriculum/academy-version` to Builder.

---

### 8. COACHES — `/director/coaches`

**Purpose:** View and manage coaches assigned to the academy.

**Frequency of use:** Weekly. Medium.

**Decision supported:**
- Which coaches are active?
- Are coaches completing their wrap-ups?
- Who is assigned to which groups?

**Current friction:**
- Coach list is static — no DONNA layer on top.
- No "coach effectiveness" summary.
- Invite coach flow is hidden — directors can't easily add new coaches.
- Coach profile pages show group assignments but not session execution quality.

**Redundancies:**
- Coach-related signals appear in Today (recap completion rate) and in Coaches — disconnect.

**Missing information:**
- Coach wrap-up completion rate not visible on coaches list.
- No "who is my best performing coach" insight.
- No "which coach needs support" flag.

**Recommendations:**
- Add DONNA intelligence header: "2 coaches have incomplete recaps this week."
- Add completion rate column to coach list.
- Keep as primary nav item.

---

### 9. SETTINGS — `/director/settings`

**Purpose:** Academy name, configuration, preferences.

**Frequency of use:** Rare. Monthly or less.

**Decision supported:**
- What are my academy's configured preferences?
- How do I update academy information?

**Current friction:**
- Very thin page — settings doesn't contain onboarding, DNA, or philosophy settings.
- Most important configuration (academy DNA, curriculum philosophy) lives in Onboarding, not Settings.
- Directors who want to change their academy DNA have no obvious path.

**Missing information:**
- Academy DNA / philosophy settings should be accessible from Settings.
- Integration settings (future).

**Recommendations:**
- Expand Settings to include: Academy Identity, Philosophy DNA, Notification Preferences.
- Move Onboarding into Settings once completed — "Re-run setup wizard".

---

## UNLISTED/HIDDEN ROUTES (COGNITIVE LOAD INVENTORY)

These routes exist in the codebase but are not in primary nav. Many create confusion or are legacy.

| Route | Status | Recommendation |
|---|---|---|
| `/director/today` | Legacy duplicate of `/director` | REMOVE (redirect to `/director`) |
| `/director/command-center` | Legacy command center | REMOVE |
| `/director/signals` | Signals dashboard | MERGE into Today or Approvals |
| `/director/alerts` | Alerts list | MERGE into Today |
| `/director/attention` | Attention queue | MERGE into Players (filter) |
| `/director/improvement` | Improvement page | MERGE into Curriculum (Evolution tab) |
| `/director/level-up` | Level movement | MERGE into Players / Player profile |
| `/director/placement` | Placement engine | MERGE into Players (onboarding flow) |
| `/director/donna` | DONNA hub | KEEP — make more prominent |
| `/director/donna-analytics` | DONNA analytics | MERGE into Approvals |
| `/director/donna-coo-demo` | COO demo | REMOVE (demo artifact) |
| `/director/ai-suggestions` | AI suggestions | MERGE into Approvals |
| `/director/private-lessons` | Private lesson requests | MERGE into Players or Approvals |
| `/director/parents` | Parent management | MERGE into Players |
| `/director/fitness` | Fitness templates | MERGE into Curriculum or Templates |
| `/director/class-templates` | Class templates | MERGE into Templates |
| `/director/setup` | Setup page | MERGE into Settings |
| `/director/demo` | Demo sandbox | REMOVE (platform-only) |
| `/director/pilot-readiness` | Pilot readiness | REMOVE (internal tool) |
| `/director/support-diagnostics` | Diagnostics | REMOVE (platform-only) |
| `/director/migration-verify` | Migration verify | REMOVE (platform-only) |
| `/director/friction` | Friction reporting | KEEP but hidden (developer tool) |
| `/director/onboarding` | Onboarding wizard | MERGE into Settings (re-run) |
| `/director/assessment-template` | Assessment templates | MERGE into Templates |

---

## SUMMARY: COGNITIVE LOAD SCORE

| Category | Current State | Target State |
|---|---|---|
| Primary nav items | 9 | 6 |
| Hidden routes | 24 | ~8 (redirects + platform-only) |
| Total navigable surfaces | 33+ | ~15 |
| DONNA as primary interface | Partial — Today only | All surfaces |
| Table-first vs insight-first | Table-first (Players, Sessions, Coaches) | Insight-first, table second |
| Duplicate/overlapping pages | ~12 pairs | 0 |

---

## COGNITIVE LOAD PRINCIPLES FOR FABLE

1. **DONNA answers before data is shown.** Every list page opens with a DONNA summary.
2. **Actions, not information.** Each section surfaces 1–3 actions, not pages of data.
3. **One queue.** All approvals, reviews, drafts in one place.
4. **Navigation labels match mental models.** "Today", "Players", "Curriculum", "Coaches", "Approvals", "Settings".
5. **No orphan pages.** Every route belongs to exactly one primary nav item.
6. **Platform routes are hidden.** Demo, diagnostics, migration tools never visible to directors.
7. **DONNA is the shortcut.** Ask DONNA instead of navigating to a page.
