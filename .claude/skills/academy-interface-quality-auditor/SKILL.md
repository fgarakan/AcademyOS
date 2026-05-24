---
name: academy-interface-quality-auditor
description: Audits any AcademyOS page against the AcademyOS Interface Quality Standard (AIQS). Inspects usability, cognitive load, visual hierarchy, typography, spacing, accessibility, mobile behavior, role fit, DONNA integration, and trust/safety. Produces a scored rubric (0–100), ranked problem list, fix plan, and sprint recommendation. Audit-first — never modifies code without explicit user instruction.
---

# AcademyOS Interface Quality Auditor

## Purpose

This skill runs a structured UI/UX audit of any AcademyOS page against the **AcademyOS Interface Quality Standard (AIQS)**.

It scores the page 0–100 across 11 rubric categories and produces:
- A ranked list of the top problems
- A fix plan organized into quick wins, medium fixes, and larger redesigns
- A sprint recommendation

> **Audit-first rule:** This skill never modifies code. It produces an audit report only. The user decides whether to proceed with fixes.

---

## AcademyOS Product Philosophy

AcademyOS should feel like:
- A calm operating system
- A premium command center
- A role-aware assistant
- A coaching and development intelligence platform

AcademyOS must **not** feel like:
- A cluttered admin portal
- A long report page
- A generic SaaS dashboard

**Every page must answer five questions — in order:**

1. Where am I?
2. What matters here?
3. What should I do next?
4. What can DONNA help with?
5. What is safe vs. requires approval?

---

## When to Use This Skill

Use before any sprint that:

- Creates a new page or dashboard section
- Restructures layout or section order
- Adds a new component above the fold
- Adds or changes a DONNA integration surface
- Changes role-specific views (director, coach, parent, player)
- Changes typography, spacing, or visual hierarchy
- Is a QA or demo-prep sprint

Also use proactively to audit existing pages before they go to directors or stakeholders.

---

## Audit Phases

### Phase 1 — Identify the page

Read the target page component:
- `src/app/[role]/page.tsx` for role home pages
- `src/app/[role]/[feature]/page.tsx` for feature pages
- Read any `_components/` files it renders that are above the fold

Identify:
- The page's role (director / coach / parent / player / admin)
- The page's stated job (what question it answers)
- The primary action the user is expected to take

### Phase 2 — Audit against the AIQS rubric

Score each of the 11 categories. Be specific — cite line numbers and component names.

### Phase 3 — Produce the audit report

Use the exact output format defined below. Do not skip sections.

### Phase 4 — Stop

Do not make code changes. Present the report. Wait for the user to say "fix it" or "proceed with Sprint NN."

---

## Full Audit Rubric (100 points)

### 1. Purpose Clarity — 10 points

Does the user know why this page exists within 5 seconds?

- Page title is obvious
- Page has one clearly stated job
- Page does not mix unrelated responsibilities
- User understands their context on this page immediately

**Failure examples:**
- Generic page title ("Dashboard", "Overview")
- Single page combines settings, reports, actions, and notifications
- Must scroll before understanding what matters

---

### 2. Primary Action Clarity — 10 points

Is there one clear next action?

- One primary CTA is visually dominant
- Secondary actions are quieter
- Destructive or official actions are not over-promoted
- Empty state tells the user what to do next
- CTA labels are specific (not "Manage", "Submit", "Go")

**Failure examples:**
- Multiple buttons with equal visual weight
- No clear next step visible
- Empty state is just a blank space or generic "No data"

---

### 3. Cognitive Load — 15 points

Is the page easy to process without mental effort?

- No duplicate sections
- No competing command surfaces (e.g. two "here's what to do today" cards)
- No long undifferentiated report layout
- Sections are grouped by task, not by database object
- Page answers the user's top questions in order
- Maximum 1–2 high-emphasis surfaces above the fold
- Information hierarchy narrows: most important → supporting → detail

**Failure examples:**
- Dashboard + DONNA brief + Today's Academy shown as three competing major surfaces
- Two KPI card sections back-to-back with no differentiation
- User sees more than 5 equal-weight sections before seeing a clear action

---

### 4. Visual Hierarchy — 10 points

Is the visual path obvious?

- Most important card/section is visually strongest
- Supporting information is visually quieter
- Section headings are legible and differentiated
- Cards have consistent density
- Color and weight are used to direct attention, not to decorate
- Alerts and warnings stand out from normal content

**Failure examples:**
- All cards have equal border, padding, and color treatment
- Bright accent color used on both primary and tertiary elements
- Important warnings styled identically to informational cards

---

### 5. Typography — 10 points

Is all text readable, clear, and hierarchical?

**Minimum standards:**
- Body/operational text: 14–16px minimum
- Important operational text: 15–16px minimum
- Metadata: 12–13px only if non-critical
- Line height: 1.35–1.6 for body copy
- No low-contrast muted text (`text-text-muted`) for important instructions

Check for:
- Critical instructions in tiny muted text
- Dense paragraphs inside cards
- Labels too small to scan on mobile (`text-[10px]` for anything important)
- Heading hierarchy that doesn't create clear scan path
- Line-height too tight for multi-line labels

**Failure examples:**
- Action label in `text-[10px] text-text-muted`
- Dense inline paragraph in a card with no visual breathing room
- Empty state description too small to comfortably read on mobile

---

### 6. Spacing and Layout — 10 points

Is the layout breathable, consistent, and intentional?

**Minimum standards:**
- Card padding: 16–24px minimum
- Touch/click gap between interactive targets: visually distinct
- Avoid nested cards inside cards unless necessary
- Avoid tables on mobile unless transformed to card rows

Check for:
- Sections that feel cramped or run together
- Cards with insufficient internal padding
- Desktop columns that don't reduce cognitive load (columns for their own sake)
- Mobile layouts that stack awkwardly or overflow
- Scroll depth that buries the primary action
- Related items not visually grouped

---

### 7. Role Fit — 10 points

Does the page feel like it was designed for this specific role?

**Role standards:**

| Role | Job | Tone |
|---|---|---|
| Director | Decisions, risks, approvals, system health | Command center |
| Coach | Next session, watchlist, quick capture, missing recap | Mission screen |
| Parent | Progress clarity, support guidance, reassurance | Warm, clear |
| Player | Missions, progress, encouragement, next action | Energizing, game-like |

Check for:
- Director page that feels like a database admin panel
- Coach home that shows director-style analytics
- Parent page with internal coaching/admin language
- Player page with school-like assessment/reporting tone
- Role seeing controls they should not access

---

### 8. Accessibility — 10 points

**Minimum standards:**
- Text contrast: WCAG AA or better
- Touch/click targets: ~44px minimum where practical
- Do not rely solely on color (red/green) — pair with label or icon
- All icon-only interactive elements need accessible text labels
- Focus states must be visible
- Keyboard navigation possible for core actions

Check for:
- `text-text-muted` on interactive elements or important labels
- Icon-only buttons (no `aria-label` or visible text)
- Tap targets under 32px on mobile interactive rows
- Color-coded signals with no secondary label

---

### 9. State Quality — 5 points

Does the page handle all states clearly?

- Loading state exists (skeleton or spinner)
- Empty state explains what will appear and how to get there
- Error state is human-readable (not "Error" or raw DB message)
- Success state confirms what changed
- Draft/review state visually distinct from official/published
- Disabled states explain why disabled (not just grayed)

---

### 10. DONNA Integration — 5 points

Does DONNA reduce cognitive load or add to it?

- DONNA is page-aware (relevant to what's on screen)
- DONNA does not create a competing dashboard
- DONNA suggests 1–3 focused actions, not a full brief
- DONNA explains approval boundaries clearly
- DONNA does not repeat content already visible on the page
- DONNA surface is visually subordinate to the primary page content

**Failure examples:**
- DONNA card appears above the primary KPI/action surface
- DONNA repeats the attention queue that already appears on the page
- User cannot tell what DONNA can do vs. what requires their own action

---

### 11. Trust and Safety — 5 points

Are boundaries between safe and official actions clear?

- Official changes (player level, curriculum, parent message) require review/confirmation
- Parent/player-facing content is clearly separate from internal notes
- High-risk actions (delete, publish, send, move) are not one-click
- Draft state is visually distinct from live/official state
- No internal uncertainty or raw coach notes visible in parent/player views

---

## Audit Output Format

Output the following exactly:

```
# UI/UX Audit — [Page Name]

## Final Score
Score: __ / 100

Decision:
[ ] 90–100: READY — meets AcademyOS Interface Quality Standard
[ ] 75–89:  STRONG BUT NEEDS POLISH — demo-ready with noted gaps
[ ] 55–74:  USABLE BUT CLUTTERED — fix before next review
[ ] 35–54:  HIGH COGNITIVE LOAD — needs redesign before use
[ ]   0–34: NOT READY — significant rework required

## What This Page Is Supposed To Do
One paragraph. State the page's job. What question does it answer?

## Current User Experience
One paragraph. What does the user likely feel when they land on this page?
Is it calm? Overwhelming? Clear? Confusing? Premium? Admin-like?

## Top 5 Problems
Ranked by severity (1 = most critical).

### Problem 1: [Title]
- **What it is:** [Description]
- **Why it hurts:** [Usability impact]
- **Evidence:** [Component name / file:line / specific text]
- **Fix:** [Recommendation]
- **Expected impact:** [Score gain / UX benefit]

[Repeat for problems 2–5]

## Rubric Score Breakdown

| Category              | Score | Notes |
|-----------------------|------:|-------|
| Purpose clarity       |   /10 |       |
| Primary action clarity|   /10 |       |
| Cognitive load        |   /15 |       |
| Visual hierarchy      |   /10 |       |
| Typography            |   /10 |       |
| Spacing/layout        |   /10 |       |
| Role fit              |   /10 |       |
| Accessibility         |   /10 |       |
| State quality         |    /5 |       |
| DONNA integration     |    /5 |       |
| Trust/safety          |    /5 |       |
| **Total**             |  **/100** |   |

## Typography Audit
- [ ] Text too small: [list instances]
- [ ] Text too muted: [list instances]
- [ ] Heading hierarchy issues: [describe]
- [ ] Line-height issues: [describe]
- [ ] Label clarity issues: [describe]

## Layout Audit
- [ ] Section order: [assessment]
- [ ] Duplicate surfaces: [list]
- [ ] Spacing problems: [list]
- [ ] Card density: [assessment]
- [ ] Scroll depth concerns: [describe]
- [ ] Desktop concerns: [describe]
- [ ] Mobile concerns: [describe]

## Accessibility Audit
- [ ] Contrast risks: [list]
- [ ] Focus state risks: [list]
- [ ] Tap target risks: [list]
- [ ] Icon label risks: [list]
- [ ] Keyboard navigation risks: [list]

## DONNA Audit
- [ ] DONNA reduces / increases cognitive load: [assessment]
- [ ] DONNA duplicates page content: [yes/no + evidence]
- [ ] DONNA has clear safe actions: [yes/no]
- [ ] Approval boundaries clear: [yes/no]

## Recommended Fix Plan

### Quick wins (minimal code, high impact)
1. [Fix] — [File + estimated lines]

### Medium fixes (component changes, ~1 sprint)
1. [Fix] — [File + approach]

### Larger redesign (multi-sprint)
1. [Fix] — [Scope + dependencies]

### Not now
1. [Item] — [Why deferred]

## Sprint Recommendation
Sprint title: [Sprint NNN — Short description]
Scope: [1–3 sentences on what the sprint changes]
Files likely affected: [list]

## Implementation Guardrails
- Files to touch: [list]
- Files not to touch: [list]
- DB changes needed: yes / no
- Role safety preserved: [confirm]
- Official mutation gates preserved: [confirm]
```

---

## Audit Behavior Rules

This skill must:

- **Audit first, code second.** Never make changes unless the user explicitly asks.
- **Be blunt about clutter.** Fewer sections is almost always better.
- **Prefer one command surface** over multiple dashboards.
- **Prefer one clear next action** over many equal CTAs.
- **Prefer hidden detail** over visible overload.
- **Protect role-specific simplicity.** Director ≠ Coach ≠ Parent ≠ Player.
- **Protect mobile usability.** Assume many users are on mobile.
- **Protect accessibility.** Contrast, focus states, tap targets.
- **Protect official approval flows.** No mutation without review.
- **Avoid fake precision.** No made-up data as real data.
- **Prefer collapse/restore** over deletion for dashboard cards.
- **Prefer "draft/review" language** for official changes.
- **Never recommend dashboard customization** for coach, parent, or player roles — only directors can customize dashboards.

---

## Pass / Fail Rules

A page **fails** the AcademyOS Interface Quality Standard if any of these are true:

| Failure condition | Why it matters |
|---|---|
| User cannot identify page purpose within 5 seconds | Fundamental clarity failure |
| Multiple competing top command surfaces | Cognitive load failure |
| More than one primary CTA above the fold | Visual hierarchy failure |
| Important text is too small or low contrast | Accessibility failure |
| Mobile creates long cluttered scroll before main action | Mobile usability failure |
| DONNA duplicates the page instead of simplifying it | DONNA integration failure |
| Parent/player safe boundaries are unclear | Trust/safety failure |
| Official actions triggerable without review/confirmation | Safety guardrail failure |
| Page feels like a database admin panel | Role fit / product philosophy failure |

---

## Page-Specific Standards

### Director Home

**Purpose:** Command center for running the academy.

**Must answer (in order):**
1. What needs my attention today?
2. What does DONNA recommend?
3. What is the academy health snapshot?
4. What should I do next?

**Rules:**
- One top command surface (not two competing "what to do" sections)
- DONNA narrates the priority queue — DONNA and Today's Academy are not separate
- KPI overview is a supporting snapshot
- Detailed KPI health belongs below the fold
- Academy setup belongs at the bottom
- Never feels like a report page

---

### Coach Home

**Purpose:** Mission screen for running today's sessions.

**Must answer:**
1. What is my next session?
2. Who should I watch today?
3. What does DONNA need from me?
4. What recap or follow-up is missing?
5. How do I quickly capture a note?

**Rules:**
- No director-style analytics
- No full player database on home
- DONNA Coach Brief at top
- Next Session is the primary section
- Quick Capture always one tap away
- Missing Recaps visible but not shame-based
- Mobile-first layout

---

### Curriculum Map

**Purpose:** Premium expandable/editable curriculum operating map.

**Must answer:**
1. Which levels are ready?
2. Which levels need review?
3. What is missing?
4. What can be expanded?
5. What can be edited as draft/review?

**Rules:**
- Cards grouped by ball level/pathway
- Expandable card pattern
- Draft editing mode — official changes require review
- DONNA gives context and recommendations
- Avoid database/table feel

---

### Player Profile

**Purpose:** Development command profile.

**Must answer:**
1. Where is this player now?
2. What are they working on?
3. What evidence supports that?
4. What is the recommended next action?
5. What is parent/player safe?

**Rules:**
- Current level and next-level pathway visible
- Active priorities visible
- Evidence grouped by pathway
- Raw coach notes protected from parent/player view

---

### Parent Portal

**Purpose:** Progress clarity and support guidance.

**Must answer:**
1. How is my child doing?
2. What are they working on?
3. What can I do to help?
4. What is coming next?
5. What has changed since the last update?

**Rules:**
- No raw coach notes
- No internal uncertainty or assessment language
- Parent-safe vocabulary throughout
- Clear wins and next steps
- No pressure/ranking tone

---

### Player Portal

**Purpose:** Mission and progress experience.

**Must answer:**
1. What is my mission?
2. What should I practice?
3. How am I improving?
4. What badge/level/goal is next?
5. What should I do today?

**Rules:**
- Game-like, not school-like
- Encouraging but honest
- Clear mission card as primary surface
- Progress visible and meaningful
- Maximum 2–3 choices at a time

---

## Source Standards

This skill applies:

1. **Nielsen Norman usability heuristics** — visibility of system status, match between system and real world, user control and freedom, consistency, error prevention, recognition over recall, flexibility and efficiency, aesthetic and minimalist design, error recovery, help and documentation

2. **WCAG accessibility principles** — perceivable, operable, understandable, robust; contrast, focus states, labels, keyboard/touch accessibility

3. **Apple Human Interface Guidelines** — legibility, clarity, hierarchy, consistent layout, adaptive layout, content-first, controls do not compete with content

4. **Material Design usability principles** — structure, containment, accessible color, clear flow, expressive but usable components, responsive behavior, predictable interaction

5. **AcademyOS product philosophy** — simple by default, detailed by exception, deep only for decisions, DONNA reduces cognitive load, role-aware UX, official actions require approval

---

## Reference Files

- `docs/ACADEMY_INTERFACE_QUALITY_STANDARD.md` — Full written standard
- `docs/UI_AUDIT_SCORECARD_TEMPLATE.md` — Blank scorecard for manual use
- `src/app/director/page.tsx` — Primary reference for director home standard
- `src/app/director/_components/DirectorTodayCommandCenter.tsx` — Reference for unified command surface
- `src/components/ui/index.ts` — Available UI components
- `tailwind.config.ts` — Design token reference
