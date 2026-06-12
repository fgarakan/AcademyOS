# Fable Platform-Wide Screen Transformation Plan
Date: June 2026
Sprint: Mega Sprint 2201–2230 — Fable Platform-Wide Screen Transformation V1
Status: PLAN — Awaiting approval before implementation

---

## Fable UX Principles (Reference)

> **Deep System. Simple Screen. DONNA Is The Interface.**

The 5-Second Test — a director landing on any screen must answer within 5 seconds,
without training:

1. Where am I?
2. What am I looking at?
3. What needs attention?
4. What can I do next?

A screen fails the 5-Second Test if any of these four questions cannot be answered
without scrolling, clicking, or guessing.

---

## Part 1 — Platform-Wide Ratings

Rating scale: 1 (critical problems) → 5 (exemplary)

| Screen | Route | UX | Readability | Cog. Load | Consistency | Decision Speed | Overall |
|---|---|---|---|---|---|---|---|
| Today | /director | 4 | 3 | 2 | 4 | 4 | **3.4** |
| Dashboard | /director/dashboard | 4 | 3 | 3 | 3 | 3 | **3.2** |
| Players | /director/players | 3 | 3 | 3 | 4 | 3 | **3.2** |
| Player Profile | /director/players/[id] | 2 | 2 | 1 | 3 | 2 | **2.0** |
| Curriculum | /director/curriculum | 3 | 2 | 3 | 2 | 4 | **2.8** |
| Curriculum Builder | /director/curriculum/builder | 2 | 2 | 2 | 1 | 3 | **2.0** |
| Templates Hub | /director/templates | 5 | 5 | 5 | 5 | 5 | **5.0** |
| Class Templates | /director/class-templates | 4 | 3 | 4 | 4 | 4 | **3.8** |
| Fitness Templates | /director/fitness/templates | 4 | 3 | 4 | 4 | 4 | **3.8** |
| Sessions | /director/sessions | 4 | 4 | 4 | 4 | 3 | **3.8** |
| Coaches | /director/coaches | 2 | 3 | 4 | 1 | 3 | **2.6** |
| Coach Profile | /director/coaches/[id] | 3 | 3 | 3 | 4 | 2 | **3.0** |
| Approvals | /director/review | 3 | 2 | 2 | 3 | 3 | **2.6** |
| Settings | /director/settings | 5 | 4 | 5 | 5 | 4 | **4.6** |
| Onboarding | /director/onboarding | 3 | 3 | 2 | 3 | 3 | **2.8** |

**Templates Hub is the design standard.** All other screens should move toward it.

---

## Part 2 — Cross-Platform Inconsistency Audit

### Typography

**Problem:** Arbitrary pixel text sizes are used throughout the platform instead of
design system tokens.

| Class used | Should be | Frequency | Files affected |
|---|---|---|---|
| `text-[9px]` | `label-xs` | ~25 instances | review, class-templates |
| `text-[10px]` | `label-xs` | ~30 instances | curriculum, class-templates, fitness-templates, player-profile, coaches |
| `text-[11px]` | `label-xs` | ~40 instances | curriculum, dashboard, player-profile, today |
| `text-[12px]` | `text-xs` | ~20 instances | review, curriculum, curriculum-builder |
| `text-[13px]` | `text-sm` | ~5 instances | curriculum (nav tabs) |
| `font-semibold text-white` | `page-title` | 2 instances | coaches, coach-profile (implicit) |

`label-xs` is defined in globals.css:
`text-[11px] uppercase tracking-widest text-text-muted font-medium`
This is the correct token for ALL label/stat header text at 9–11px.

### Header Pattern

**Standard (from Templates Hub and Settings):**
```jsx
<p className="page-eyebrow">Section Name</p>
<h1 className="page-title">Screen Name</h1>
<p className="page-subtitle">One sentence describing what this screen shows.</p>
```

| Screen | page-eyebrow | page-title | page-subtitle | Status |
|---|---|---|---|---|
| Today | — | — | — | Intentional (DONNA is the header) |
| Dashboard | ✓ "Evidence Layer" | ✓ "Dashboard" | ✓ | Compliant |
| Players | ✓ "Academy" | ✓ "Player Directory" | ✓ | Compliant |
| Player Profile | ✗ | ✗ | ✗ | MISSING — uses component-based header |
| Curriculum | ✗ | ✓ "Curriculum Command Center" | ✗ | Partial — eyebrow and subtitle missing; title is jargon |
| Curriculum Builder | ✗ | Inline heading (not page-title) | ✗ | Non-standard — DONNA chip + heading pattern |
| Templates Hub | ✓ "Academy Operations" | ✓ "Templates" | ✓ | Exemplar |
| Class Templates | ✓ "Curriculum" | ✓ "Class Templates" | ✓ | Compliant |
| Fitness Templates | ✓ "Physical Pathway" | ✓ "Fitness Templates" | ✓ | Compliant |
| Sessions | ✓ "Sessions" | ✓ "Sessions" | ✓ | Compliant |
| Coaches | ✗ | ✗ (uses `text-2xl font-semibold text-white`) | ✗ | MISSING |
| Coach Profile | ✗ | ✗ (avatar + name pattern) | ✗ | Non-standard — detail page pattern |
| Approvals | ✓ "Operations" | ✓ "Approvals" | ✓ | Compliant |
| Settings | ✓ "Settings" | ✓ "Academy Identity" | ✓ | Compliant |
| Onboarding | Hero variant | Hero variant | Hero variant | Intentional (landing page) |

### Hardcoded Colors

**Problem:** Multiple files use hardcoded color values instead of design tokens.

| File | Violation | Impact |
|---|---|---|
| `coaches/page.tsx:116` | `text-white` (should be `text-text-primary`) | Theme-break risk |
| `coaches/page.tsx:191` | `text-white` (should be `text-text-primary`) | Theme-break risk |
| `curriculum/page.tsx:56` | `bg-yellow-400` (Tailwind, not AcademyOS token) | Brand inconsistency |
| `curriculum/page.tsx:57` | `text-yellow-400` (Tailwind, not AcademyOS token) | Brand inconsistency |
| `curriculum/builder/CurriculumSetupBuilder.tsx` | `style={{ background: '#050b09' }}` | Inline style, token-blind |
| `curriculum/builder/CurriculumSetupBuilder.tsx` | `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.09)' }}` | Inline style, token-blind |
| `curriculum/builder/CurriculumSetupBuilder.tsx` | Multiple `#C8FF00`, `#0A0A0A`, `rgba(...)` strings | Inline styles throughout |
| `curriculum/builder/CurriculumSetupBuilder.tsx` | `STAGE_COLOR` and `PATHWAYS` JS objects with hex strings | Token-blind JS constants |
| `players/[playerId]/page.tsx:1754` | `style={{ color: 'rgba(10,132,255,0.75)' }}` | Should be `text-status-blue` |

### Cards

**Standard:** `<Card>` component from `src/components/ui`.

**Inconsistencies found:**
- Curriculum Builder uses raw `div` with inline style backgrounds instead of `<Card>`
- Today page uses raw `div` with `rounded-xl` in some sections
- Some coach sections use `div` + border classes instead of `<Card>`

### DONNA Visibility

Screens lacking DONNA integration where it would add value:

| Screen | Current DONNA | Gap |
|---|---|---|
| Fitness Templates | None | Could surface: "3 curriculum phases have no fitness template" |
| Settings | None | Low priority — not a decision screen |
| Coach Profile | None | Could surface: coach load signals, suggested session assignments |
| Curriculum Builder | 3 overlapping DONNA entry points | Too many — confusing flow state |

Screens with strong DONNA integration:
Today, Players, Curriculum, Approvals, Onboarding

### Forms

Consistent across all form screens (Settings, Onboarding interview). No anomalies.

### Search and Tables

| Screen | Search | Table | Issues |
|---|---|---|---|
| Players | Via PlayersDirectoryClient (client) | Client-rendered | Missing curriculum badge hidden on mobile |
| Dashboard | No search | Sortable KPI table | `text-[11px]` headers — below readable minimum |
| Approvals | No search | Tab-filtered list | Nested hierarchy within tabs adds cognitive cost |
| Class Templates | No search | List view (TemplateRow) | Some columns hidden on mobile |

### Spacing

**Consistent:** Most screens use `p-6`, `space-y-6`, `gap-4` from design tokens.

**Inconsistency found:**
- Approvals uses `max-w-5xl` which is narrower than other director pages
- Coach Profile uses `max-w-4xl mx-auto` — layout constraint inconsistent with other pages

---

## Part 3 — Per-Screen Analysis

---

### Screen 1: Today (`/director`)
**Lines:** 665 | **Tier:** 3 (no structural problems; polish only)

**Current Problems:**
- No page-eyebrow/title/subtitle — director landing here from email link or bookmark
  has no screen label. The 5-Second Test question "Where am I?" has no explicit answer
  (DONNA brief answers it implicitly, but requires reading).
- 7 major sections visible simultaneously: brief, quick actions, decision center, alerts,
  what changed, what can wait, strategic questions. Cognitive overload on first load.
- No loading state — if any of the 40+ queries are slow, director sees blank page.
- `animate-fade-in` used inconsistently — not present on all sections.

**Recommended Changes:**
- Add a minimal screen identity element — a subdued `label-xs` label ("Today" or
  "Command Center") positioned above DonnaCommandBrief. Not a full page-title — just
  enough to anchor orientation.
- Wrap the bottom half (WhatChangedPanel, WhatCanWaitPanel) in a collapsible section
  defaulting to collapsed on mobile. Already done for Strategic Questions — extend
  the pattern.
- Add `<Suspense>` fallback with a skeleton frame around DonnaCommandBrief so director
  sees screen structure immediately during data load.

**Expected Outcome:**
Director orients instantly on arrival. Bottom section clutter eliminated on mobile.
Data load feels responsive rather than blank. 5-Second Test: passes all 4 questions.

---

### Screen 2: Dashboard (`/director/dashboard`)
**Lines:** 437 | **Tier:** 2

**Current Problems:**
- `text-[11px]` table headers — below 12px minimum for readability. Directors on
  non-Retina displays cannot easily read column headers.
- Status color semantic mixing: `text-status-red/orange/green` used for player states,
  but `text-lime` also used for numbers. Lime is an accent color, not a status indicator.
  Risk of confusion about what lime means in this context.
- Data provenance banner ("Time in Level: live, Absences: demo") is a footer-level
  footnote. Directors reading KPI numbers may not notice that absence data is
  approximated. Misinformed decisions are the risk.
- No loading skeleton — blank cards until all queries resolve.

**Recommended Changes:**
- Replace `text-[11px]` with `label-xs` token on all table column headers.
- Audit lime usage: use `metric-number` (font-mono text-lime) only for the primary
  metric value; use `text-text-primary` for secondary numbers.
- Move data provenance to per-card badges, not a footer. Each KPI card should show
  a small "live" or "estimated" chip directly below its metric value.
- Add `<Suspense>` with skeleton KPI cards (3 placeholder blocks matching the card grid).

**Expected Outcome:**
Table headers readable at all screen sizes. Director trusts each KPI because its
data source is labeled inline. Loading feels instant.

---

### Screen 3: Players Directory (`/director/players`)
**Lines:** 247 | **Tier:** 2

**Current Problems:**
- Header ordering violated: `DonnaScreenBriefStatic` appears BEFORE `page-eyebrow/title`.
  Director reads DONNA intelligence before knowing which screen they're on. This is
  the opposite of every other screen. Inconsistent orientation pattern.
- Three action buttons (Add, Import, Onboarding) in one horizontal row. On mobile,
  this wraps into 2+1, orphaning the Onboarding button. The Onboarding button's
  presence here is also questionable — Onboarding is nav-conditional elsewhere.
- Missing curriculum badge (line 169) hidden on mobile via `hidden sm:inline-flex`.
  A director on mobile cannot see that N players lack curriculum assignment —
  a high-priority operational signal.
- `border-lime/20` for advancement-ready panel is too subtle. A director scanning
  quickly may miss the lime border entirely.

**Recommended Changes:**
- Reorder header: `page-eyebrow` → `page-title` → `page-subtitle` → `DonnaScreenBriefStatic`.
  DONNA brief amplifies what the header announced; it should follow, not precede.
- Change action buttons to a responsive flex row: `flex flex-wrap gap-2`. Remove the
  Onboarding shortcut button — it duplicates the conditional nav item.
- Remove `hidden sm:inline-flex` from missing curriculum badge. Show on all sizes.
- Increase advancement-ready panel border to `border-lime` (opaque) with `bg-lime/5`.

**Expected Outcome:**
Consistent orientation pattern across all director screens. Mobile directors see the
same high-priority signals as desktop. Header hierarchy matches platform standard.

---

### Screen 4: Player Profile (`/director/players/[playerId]`)
**Lines:** 1833 | **Tier:** 1

**Current Problems:**
- NO standard page header. `PlayerProfileHeader` component renders player name and
  avatar, but this is not `page-eyebrow/title/subtitle`. Directors cannot orient to
  this as a "Player Profile" screen — they see the player's name before they know
  the screen type.
- 9 tabs (Overview, Skill Path, Competition, Fitness, Notes, Session History,
  Development, Missions, Assessments) obscures the director's primary workflow.
  Directors new to the system do not know which tab to start with.
- Overview tab has 7 major sections above fold: Constitution Hero (8 data points
  alone), Command Center, Action Summary, Priority Missions, Readiness Panel, plus
  a two-column right sidebar. Cognitive load is the highest of any director screen.
- Actions are tab-buried. The director's most frequent tasks (assign curriculum,
  add evidence, evaluate advancement) require knowing which tab to click.
- `style={{ color: 'rgba(10,132,255,0.75)' }}` on line 1754 is an inline rgba style
  violating design token rules. Should be `text-status-blue`.
- 20+ instances of `text-[11px]`, `text-[10px]` arbitrary sizes throughout.

**Recommended Changes:**
- Add a minimal page identity strip above PlayerProfileHeader: `label-xs` text
  "Player Profile" in `text-text-muted`. Does not compete with player's name — just
  anchors the screen type.
- Reduce tab count for initial release: consolidate to 5 tabs (Overview, Development,
  Assessment, Notes, History). Competition, Missions, Fitness can remain but should
  not be primary tabs in the pilot launch.
- Reduce Constitution Hero from 8 signals to 3: current level, advancement eligible
  (yes/no), and top priority. Move mission counts, assessment score, and next level
  into the Command Center card.
- Add "Quick Actions" strip immediately below Constitution Hero (above all other
  content): 3 primary actions — Assign Curriculum, Add Evidence, Evaluate Advancement.
  These should never be buried.
- Replace inline `style={{ color: 'rgba(10,132,255,0.75)' }}` with `text-status-blue`.
- Replace all `text-[11px]`, `text-[10px]` with `label-xs`.

**Expected Outcome:**
Director can answer "What can I do?" within 3 seconds of landing. Tabs reduced to
what's needed for pilot. Constitution Hero communicates the three things that matter
most without overwhelming. Typography consistent with platform standard.

**Note:** This is a V2 target — the file is 1833 lines and tab refactoring requires
careful coordination with child components. The inline style fix and typography fixes
can ship in this sprint. The tab and hero refactors are a separate sprint.

---

### Screen 5: Curriculum Command Center (`/director/curriculum`)
**Lines:** 592 | **Tier:** 1

**Current Problems:**
- Header incomplete: `page-title` only, no `page-eyebrow`, no `page-subtitle`.
  "Curriculum Command Center" is the title — this is jargon. No other screen uses
  "Command Center" in its title (Today's screen has no title at all). Should be
  plain "Curriculum".
- `bg-yellow-400` / `text-yellow-400` hardcoded for Yellow Ball stage indicator
  (lines 56–57). This is a Tailwind color, not an AcademyOS design token.
  Will not update if the theme changes. Yellow is also very close to lime (#C8FF00)
  and creates a confusing chromatic relationship.
- 30+ instances of `text-[Npx]` arbitrary sizing throughout (ranging from
  `text-[10px]` to `text-[13px]`). Inconsistent type scale.
- Nav tabs for curriculum views (Health | Builder | Map) use `text-[13px]` —
  inconsistent with design system nav patterns elsewhere.
- No `page-subtitle` — director landing here for the first time has no contextual
  explanation of what this screen covers or how to use it.

**Recommended Changes:**
- Change title: `"Curriculum Command Center"` → `"Curriculum"`.
- Add `page-eyebrow`: `"Academy Knowledge"` (consistent with Templates Hub: "Academy Operations").
- Add `page-subtitle`: `"What your academy teaches, structured by level and stage."`
- Replace `bg-yellow-400` / `text-yellow-400` with `bg-status-orange/80` /
  `text-status-orange` — Yellow Ball is a warning/developmental stage, orange is the
  appropriate semantic color.
- Replace all `text-[Npx]` with `label-xs` (for 9–11px use cases) or `text-xs` /
  `text-sm` for nav tab labels.

**Expected Outcome:**
Header matches platform standard. Title is plain language, not jargon.
Yellow Ball stage uses a design-system color. Typography consistent.
5-Second Test: director immediately knows "I am on the Curriculum screen."

---

### Screen 6: Curriculum Builder (`/director/curriculum/builder`)
**Lines:** ~750 (page.tsx + CurriculumSetupBuilder.tsx) | **Tier:** 1

**Current Problems:**
- Massive hardcoded color violations in `CurriculumSetupBuilder.tsx`:
  - `style={{ background: '#050b09' }}` — inline, not a token
  - `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.09)' }}`
  - Inline `#C8FF00`, `#0A0A0A`, `#a3aab4`, `#555` strings
  - `STAGE_COLOR` and `PATHWAYS` JavaScript objects with raw hex strings
  This is the highest design token violation density in the platform.
- Three DONNA entry points (Ask DONNA chip, completion banner, review banner) create
  confusing workflow state. Director does not know whether to click the chip, read
  the completion banner, or act on the review banner.
- "How it works" guide section uses inline styles for its background and border —
  `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.09)' }}`
- No standard page header — director cannot orient to "I am in the Curriculum Builder."
  The breadcrumb "Curriculum Command Center" partially compensates but is small.
- `<Suspense fallback={null}>` for PendingModificationsQueue — director sees nothing
  while modifications queue loads.

**Recommended Changes:**
- Replace all inline `style=` color attributes with Tailwind utility classes or
  design tokens. Specific mappings:
  - `#050b09` → `bg-base` (page background)
  - `#060f0d` → `bg-surface`
  - `rgba(200,255,0,0.09)` → `border-lime/10`
  - `#C8FF00` → `text-lime`
  - `#0A0A0A` → `bg-base`
- Move `STAGE_COLOR` hex values to Tailwind class names. Create a `STAGE_CLASSES`
  mapping using design tokens (`bg-status-orange`, `bg-status-green`, etc.).
- Consolidate DONNA entry points: Remove the "Ask DONNA" chip if the review banner
  already provides the primary DONNA interaction. Or: chip = ask a question;
  banner = act on a recommendation. Make the two states visually distinct.
- Add `page-eyebrow` + `page-title` above the DONNA chip: "Curriculum / Builder".
- Change `<Suspense fallback={null}>` to a minimal skeleton line.

**Expected Outcome:**
Design token compliance restored. The builder looks like part of AcademyOS, not a
standalone prototype. DONNA workflow is a clear single path, not three competing
entry points.

**Note:** CurriculumSetupBuilder.tsx is a large component. The inline style cleanup
is mechanical (find-and-replace) but touches many lines. Recommend a focused cleanup
sprint targeting only color/style tokens before any structural changes.

---

### Screen 7: Templates Hub (`/director/templates`)
**Lines:** 161 | **Tier:** — (exemplar, no changes)

**Current state:** This is the platform standard. Full header hierarchy, all design
tokens, clear 4-card action grid, graceful error handling for count queries, no
cognitive overload, no DONNA clutter on a navigation hub.

**Recommended Changes:** None. Use as the reference for all other screens.

---

### Screen 8: Class Templates (`/director/class-templates`)
**Lines:** 305 | **Tier:** 3

**Current Problems:**
- `text-[9px]` and `text-[10px]` used for stat labels (lines 158, 165, 172, 266,
  270, 274) — below readable minimum; should be `label-xs`.
- `hidden sm:block` hides some columns on mobile. Lower priority but creates
  information asymmetry for tablet users.
- DONNA integration is focus-only (`data-donna-focus-id`) — no DONNA brief visible.
  A brief summarizing template coverage by curriculum phase would be high value.

**Recommended Changes:**
- Replace `text-[9px]`, `text-[10px]` with `label-xs` on stat labels and column headers.
- Add a `DonnaScreenBriefStatic` or inline DONNA insight above the template list:
  "4 of 12 curriculum phases have no template assigned."
- Consider removing `hidden sm:block` from key stat columns, or collapsing them
  into a "detail" toggle on mobile.

**Expected Outcome:**
Typography consistent. Directors on mobile see key stats. DONNA adds actionable
intelligence about coverage gaps.

---

### Screen 9: Fitness Templates (`/director/fitness/templates`)
**Lines:** 267 | **Tier:** 3

**Current Problems:**
- `text-[10px] uppercase tracking-widest` used 4 times (lines 134, 182, 234, 238).
  This is functionally `label-xs` but written as arbitrary classes.
- No DONNA integration whatsoever. Unlike Class Templates (which has focus IDs),
  this screen has no DONNA signal of any kind.
- `hidden sm:block` hides "Exercises" column on mobile — same issue as Class Templates.
- Mobile header layout may collapse awkwardly when stat cards and action button
  compete for row space.

**Recommended Changes:**
- Replace 4 instances of `text-[10px] uppercase tracking-widest` with `label-xs`.
- Add `data-donna-focus-id="fitness-template-list"` and `data-donna-focus-id="create-fitness-template-button"` to enable DONNA navigation.
- Remove `hidden sm:block` from Exercises column, or move it below the primary stat.

**Expected Outcome:**
Typography consistent. DONNA can navigate to this screen and highlight the create
action. Mobile information parity with desktop.

---

### Screen 10: Sessions (`/director/sessions`)
**Lines:** 249 | **Tier:** 3

**Current Problems:**
- Cross-module nav bar (Dashboard link + "Today's Academy" link) appears above the
  page header as a separate visual block. This creates a double navigation layer —
  the sidebar is the primary nav; this secondary nav block is disorienting.
- "Today's Academy" label is ambiguous — is this a link back to Today? To a session
  dashboard? It links to `/director` but the label doesn't make that clear.
- `data-donna-focus-id` on the session list but not the empty state card. When the
  list is empty, DONNA cannot focus on the meaningful element.

**Recommended Changes:**
- Remove or demote the secondary nav bar. The back-navigation pattern should use
  a simple `ChevronLeft` breadcrumb link, as seen in Settings and Review.
- Replace "Today's Academy" with a plain breadcrumb: "← Today".
- Add `data-donna-focus-id="session-empty-state"` to the EmptyState card.

**Expected Outcome:**
Sessions screen has a single clear header with no competing navigation layer.
DONNA can address directors in the empty state.

---

### Screen 11: Coaches Directory (`/director/coaches`)
**Lines:** 215 | **Tier:** 1

**Current Problems:**
- Header entirely non-standard. Lines 114–122 use:
  ```
  <h1 className="text-2xl font-semibold text-white">Coaches</h1>
  <p className="text-text-secondary text-sm mt-1">{coaches.length} active coaches</p>
  ```
  This is NOT `page-eyebrow` / `page-title` / `page-subtitle`. It was written before
  the design system was standardized. The result: every other director screen uses
  the canonical header; Coaches is a visual outlier.
- `text-white` on lines 116 and 191 — hardcoded color token violation.
  In light mode or high-contrast mode this would produce unreadable text.
  Should be `text-text-primary`.
- `max-w-4xl mx-auto` — Coaches uses a narrower max-width than other director screens.
  Most director screens have no max-width constraint or use `max-w-5xl`. This is
  an inconsistent layout constraint.

**Recommended Changes (minimal, high-impact):**
- Replace the custom header block with the canonical pattern:
  ```jsx
  <p className="page-eyebrow">Staff</p>
  <h1 className="page-title">Coaches</h1>
  <p className="page-subtitle">{coaches.length} active coach{coaches.length !== 1 ? 'es' : ''} — manage your instruction team.</p>
  ```
- Replace both `text-white` instances with `text-text-primary`.
- Remove `max-w-4xl mx-auto` — let the page fill the director layout container.

**Expected Outcome:**
Coaches screen looks like a first-class director screen, not a legacy outlier.
Design token violations eliminated. 5-Second Test: director immediately knows
"I am on the Coaches screen."

---

### Screen 12: Coach Profile (`/director/coaches/[coachId]`)
**Lines:** 346 | **Tier:** 3

**Current Problems:**
- Non-standard header: Back link + avatar circle + name + role badge. This is a
  profile detail page, so a hero pattern is acceptable, but there is no
  screen-type label. Director cannot distinguish "I am looking at a Coach Profile"
  vs "I am looking at a Player Profile" from the header alone.
- No primary actionable CTA. The page shows coach activity data but the only
  actions are implicit (click into a session, click "Review Queue"). The empty
  state says "Assign sessions to {coachName}" but there is no button to do so.
- No DONNA integration at all. Coach load signals, workload distribution, and
  session frequency are exactly the kind of intelligence DONNA should surface.
- 30-day and 8-session caps are not labeled. Director does not know the data window.

**Recommended Changes:**
- Add a `label-xs` screen-type label above the hero avatar: `"Coach Profile"` in
  `text-text-muted`. Minimal but anchoring.
- Add a primary CTA in the header row: "Assign Session →" linking to
  `/director/sessions/new?coachId={id}` or similar.
- Add `data-donna-focus-id="coach-activity-summary"` to enable DONNA reference.
- Label the data windows: "Sessions · last 30 days" and "showing last 8 sessions".

**Expected Outcome:**
Director can act immediately from the Coach Profile. DONNA can reference this page.
Data windows are transparent.

---

### Screen 13: Approvals / Review Queue (`/director/review`)
**Lines:** 2206 | **Tier:** 2

**Current Problems:**
- 2206 lines in a single file is an architectural concern. This is 4× the next
  largest screen. Maintenance, testing, and incremental improvement are all
  significantly harder at this size. This is a V2 refactor — not for this sprint.
- 20+ instances of arbitrary text sizing (`text-[9px]` through `text-[12px]`).
  Approval cards have the densest concentration of non-token typography in the
  platform. This affects readability of the most critical decision-making screen.
- `max-w-5xl` creates a narrower layout than other director screens. For a screen
  with multiple columns and card layouts, this constraint may be appropriate —
  but it should be a conscious decision, not an oversight.
- Tab structure (needs_approval, player_updates, curriculum_session, completed)
  with nested sections within each tab creates a two-level hierarchy. Directors
  must navigate tabs AND sections within tabs.
- Pervasive DONNA integration is good. But focus IDs were retrofitted, not designed.
  This creates some semantic awkwardness (wrapping entire tab containers in a
  single `data-donna-focus-id`).

**Recommended Changes (this sprint — typography only):**
- Replace all `text-[9px]` through `text-[12px]` in card and section labels with
  `label-xs` or `text-xs` as appropriate.
- This is a mechanical find-and-replace — safe, high-value, no structural risk.

**Deferred (V2 sprint):**
- Refactor 2206-line file into focused components: `ReviewTabNeeds`, `ReviewTabUpdates`,
  `ReviewTabCurriculum`, `ReviewTabCompleted`.
- Consolidate DONNA focus IDs to be more targeted.

**Expected Outcome (this sprint):**
Approval card typography matches platform standard. Directors can read approval
items at the same visual weight as other director screens.

**Expected Outcome (V2):**
File is maintainable. New approval card types can be added without touching 2000+
line files.

---

### Screen 14: Settings (`/director/settings`)
**Lines:** 121 | **Tier:** 3 (minor improvements only)

**Current Problems:**
- No DONNA integration. For a "Academy Identity" form, DONNA could offer guidance
  on what makes an effective academy name or description. Low priority — Settings
  is not a decision screen.
- Info banner text at `text-xs` is easy to miss. Directors may not read it.

**Recommended Changes:**
- No changes required for this sprint. Settings is clean and compliant.
- Optional future: add `data-donna-focus-id="academy-identity-form"` for DONNA
  guidance on academy identity fields.

**Expected Outcome:** No change. Settings remains the second-best screen on the platform
(after Templates Hub).

---

### Screen 15: Onboarding (`/director/onboarding`)
**Lines:** 365 (AcademyDnaLanding) | **Tier:** 3

**Current Problems:**
- Right DONNA panel hidden via `hidden lg:flex` — tablet-sized directors (iPad
  landscape, 1024px viewport) lose the DONNA guidance panel entirely. For an
  onboarding flow, this is a critical gap. DONNA is the guide; hiding her defeats
  the purpose.
- Setup mode grid: 6 options shown, 3 disabled. First-time directors see 3 locked
  options immediately — this signals that the system is incomplete before they
  even begin.
- 15 affordances visible before clicking Begin (6 "DONNA will create" pills + 6
  setup mode cards + 3 quick adjustment chips). Cognitive load is high for a
  first-time experience.
- Inline `style` with radial gradients is acceptable for the hero effect but is
  non-standard and cannot be themed.

**Recommended Changes:**
- Change `hidden lg:flex` to `hidden md:flex` on the DONNA panel. Tablet directors
  should see DONNA during onboarding.
- Consider hiding the 3 deferred setup modes entirely on initial landing, revealing
  them via a "More options" disclosure. First impression should be "You have 3 options"
  not "You have 6 options, 3 of which are locked."
- No other changes this sprint — onboarding is a specialized flow with intentional
  hero styling.

**Expected Outcome:**
DONNA guidance available to tablet directors. First impression of onboarding is
simpler: 3 active options, not 6.

---

## Part 4 — Tier Rankings

### Tier 1 — Fix First (Highest Impact on Pilot Readiness)

These screens have design system violations, jargon, or missing structural elements
that will be visible during a pilot demo. A pilot participant or pilot director will
notice these immediately.

| Rank | Screen | Primary Issue | 5-Second Test Failure |
|---|---|---|---|
| 1 | **Coaches** | Missing header, `text-white` violations | "Where am I?" has no answer |
| 2 | **Curriculum** | Jargon title, missing eyebrow/subtitle, hardcoded yellow | "Where am I?" gives wrong answer ("Command Center") |
| 3 | **Curriculum Builder** | Massive hardcoded hex throughout CurriculumSetupBuilder | Visual inconsistency is jarring |
| 4 | **Player Profile** | No header, 9 tabs, extreme cognitive load | "What can I do next?" has no immediate answer |

### Tier 2 — Fix Second (Readability and Consistency)

These screens have typography and consistency issues that reduce readability but
do not break the orientation test.

| Rank | Screen | Primary Issue |
|---|---|---|
| 5 | **Approvals** | 20+ non-token text sizes in the highest-stakes screen |
| 6 | **Players Directory** | Header ordering mismatch (DONNA before eyebrow) |
| 7 | **Dashboard** | Table header `text-[11px]`, status/lime color ambiguity |
| 8 | **Sessions** | Secondary nav bar creates double navigation layer |

### Tier 3 — Polish (When Time Permits)

These screens are functionally correct but have minor inconsistencies.

| Rank | Screen | Primary Issue |
|---|---|---|
| 9 | **Class Templates** | Minor `text-[9px]` typography; missing DONNA coverage insight |
| 10 | **Fitness Templates** | `label-xs` not used; zero DONNA presence |
| 11 | **Coach Profile** | No primary CTA; no DONNA; unlabeled data windows |
| 12 | **Today** | No screen label; bottom section needs collapsible on mobile |
| 13 | **Onboarding** | DONNA panel hidden on tablet; 6 modes shown when 3 are locked |
| 14 | **Settings** | Clean — no changes needed this sprint |
| 15 | **Templates Hub** | Exemplar — no changes |

---

## Part 5 — Transformation Sequence

### Phase A — Violations (do first, no risk)
Files: `coaches/page.tsx`, `curriculum/page.tsx`

These are self-contained changes to existing pages. No new components, no data
model changes, no risk to other screens.

1. **Coaches page:** Replace custom header with `page-eyebrow/title/subtitle`.
   Replace `text-white` × 2 with `text-text-primary`. Remove `max-w-4xl`.
   Estimated: 10 line changes.

2. **Curriculum page:** Change title from "Curriculum Command Center" to "Curriculum".
   Add `page-eyebrow` and `page-subtitle`. Replace `bg-yellow-400/text-yellow-400`
   with `bg-status-orange/text-status-orange`. Replace `text-[Npx]` instances with
   `label-xs` or `text-xs`. Estimated: 40 line changes.

### Phase B — Typography Sweep (mechanical, safe)
Files: `dashboard/page.tsx`, `sessions/page.tsx`, `class-templates/page.tsx`,
       `fitness/templates/page.tsx`, `review/page.tsx` (typography only)

Mechanical find-and-replace of all `text-[9px]`, `text-[10px]`, `text-[11px]`,
`text-[12px]` with `label-xs` or `text-xs`. No structural changes.

Estimated: 2–3 changes per file, 15 total across all files.

### Phase C — Header and Ordering Fixes
Files: `players/page.tsx`

Move `DonnaScreenBriefStatic` below the header. Remove Onboarding button from
action row. Fix mobile badge visibility. Estimated: 15 line changes.

### Phase D — Curriculum Builder Token Cleanup
Files: `curriculum/builder/CurriculumSetupBuilder.tsx`

Replace all inline `style=` color attributes with Tailwind classes. Convert
`STAGE_COLOR` and `PATHWAYS` hex constants to Tailwind class name mappings.
This is the most mechanical change in the plan — pure token substitution.
Estimated: 60–80 line changes. No logic changes.

### Phase E — Deferred (V2 sprints)
These require architectural decisions or coordination with child components:

- **Player Profile V2:** Tab consolidation, Constitution Hero reduction, Quick
  Actions strip. Separate sprint — coordinate with all PlayerProfile* components.
- **Approvals V2:** Refactor 2206-line file into focused sub-components. Separate
  sprint — coordinate with DonnaDraftCard, CoachCurriculumSuggestionCard, etc.

---

## Part 6 — Estimated Impact

### On Usability
- **Phase A (Coaches + Curriculum):** High. Two screens that fail the 5-Second Test
  will pass it. A pilot director seeing Coaches for the first time will understand
  immediately what screen they're on.
- **Phase B (Typography sweep):** Medium. No layout changes, but text becomes
  consistently readable across all screens.
- **Phase C (Players header):** Low-Medium. Fixes a subtle ordering inconsistency
  that most directors won't consciously notice but will feel.
- **Phase D (Builder tokens):** Medium. Builder stops feeling like a different product.

### On Cognitive Load
- **Approvals typography (Phase B):** High reduction in cognitive friction. Approval
  cards are the hardest to read due to dense arbitrary type sizes.
- **Player Profile (deferred V2):** Very high reduction — but deferred.
- **Coaches header (Phase A):** Low — directors don't stare at headers, but
  first-impression orientation is meaningfully improved.

### On Pilot Readiness
Current state: 3 of 15 screens have design system violations that would be
immediately visible to a pilot observer (Coaches, Curriculum, Curriculum Builder).

After Phases A–D:
- Coaches: Passes design review
- Curriculum: Passes design review
- Curriculum Builder: Passes design review
- Typography: Platform-wide consistency achieved

After Phases A–D, only Player Profile and Approvals remain as known V2 targets.
Both are functional — they have UX debt, not blocking defects.

**Pilot readiness assessment:**
- Before this sprint: 11/15 screens are pilot-ready
- After Phases A–D: 13/15 screens are pilot-ready
- After V2 (deferred): 15/15 screens are pilot-ready

---

## Part 7 — Non-Negotiables

These constraints apply to every change in this transformation:

1. No database schema changes
2. No migration files
3. No new npm packages
4. No changes to `database.types.ts`
5. No RLS modifications
6. No proposed_actions pattern changes
7. No changes to Today page architecture (DONNA is the header — intentional)
8. No changes to Player Profile tab structure in this sprint (deferred to V2)
9. No changes to Approvals file structure in this sprint (typography only)
10. TypeScript must be clean after every phase

---

## Document Reference

This plan informs Sprint 2201–2230.

Screens marked "Exemplar": Templates Hub, Settings.
Screens changed in Phase A: Coaches, Curriculum.
Screens changed in Phase B: Dashboard, Sessions, Class Templates, Fitness Templates, Approvals.
Screens changed in Phase C: Players.
Screens changed in Phase D: Curriculum Builder.
Screens deferred to V2: Player Profile (tabs + hero), Approvals (refactor).
Screens with no changes: Today, Templates Hub, Settings, Coach Profile, Onboarding.
