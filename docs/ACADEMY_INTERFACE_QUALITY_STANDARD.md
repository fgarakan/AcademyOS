# AIQS — AcademyOS Interface Quality Standard

**Version:** 1.0
**Date:** 2026-05-24
**Status:** Active
**Owner:** AcademyOS Product

---

## Purpose

AIQS is the global UI/UX standard for every page in AcademyOS. It ensures every screen is:

- Clear — users know where they are and what to do
- Premium — feels like a calm operating system, not an admin panel
- Accessible — meets minimum contrast, size, and focus standards
- Role-aware — each role gets a purpose-built experience
- Cognitively light — structured to reduce mental effort
- Safe — official actions always require review or confirmation

---

## Product Philosophy

AcademyOS should feel like:
- A calm operating system
- A premium command center
- A role-aware assistant
- A coaching and development intelligence platform

AcademyOS must **not** feel like:
- A cluttered admin portal
- A long undifferentiated report page
- A generic SaaS dashboard

### Core Page Rule

Every page must answer — **in order**:

1. Where am I?
2. What matters here?
3. What should I do next?
4. What can DONNA help with?
5. What is safe vs. requires approval?

---

## Sources of Truth

### 1. Nielsen Norman Usability Heuristics

| Heuristic | AcademyOS application |
|---|---|
| Visibility of system status | Pages show live data provenance (live / partial / no data) |
| Match between system and real world | Language matches the coaching domain (not "entities", "records") |
| User control and freedom | Directors can undo, review, and reject; no irreversible one-click actions |
| Consistency and standards | Design tokens, card patterns, and spacing are consistent across roles |
| Error prevention | High-risk actions have confirmation gates; DONNA routes to review queue |
| Recognition over recall | Every navigation destination is visible in the sidebar or labeled clearly |
| Flexibility and efficiency | Directors get keyboard shortcuts and quick actions; coaches get quick capture |
| Aesthetic and minimalist design | Fewer sections, fewer cards, fewer competing surfaces |
| Help users recognize and recover from errors | Error states are human-readable and action-oriented |
| Help and documentation | DONNA provides in-context guidance; tooltips supplement where needed |

### 2. WCAG Accessibility Principles

- **Perceivable:** Sufficient contrast; color is never the only signal; text is legible
- **Operable:** Keyboard navigation for core actions; tap targets meet minimum size
- **Understandable:** Language is clear; labels are human-readable; state transitions are explained
- **Robust:** Components work across viewports; no critical content hidden by overflow

### 3. Apple Human Interface Guidelines

- **Legibility:** All text is readable at its intended size
- **Clarity:** Interface elements have one clear purpose
- **Hierarchy:** Visual weight directs attention; content comes first
- **Consistency:** Same patterns repeat across screens
- **Adaptive layout:** Screens work at all breakpoints — desktop, tablet, mobile
- **Content first:** Controls do not compete with the content they modify

### 4. Material Design Usability Principles

- **Structure:** Related items grouped; unrelated items separated
- **Containment:** Cards have clear boundaries
- **Accessible color:** Color choices consider contrast and colorblindness
- **Clear flow:** Primary → secondary → tertiary actions are visually graded
- **Responsive behavior:** Components behave predictably at all screen widths
- **Predictable interaction:** Tapping/clicking a card navigates; tapping a button acts

### 5. AcademyOS Product Philosophy

| Principle | Application |
|---|---|
| Simple by default | Show the most important signal; hide supporting detail |
| Detailed by exception | Expand/drill down when the user asks |
| Deep only for decisions | Analysis sections are below the fold, not above |
| DONNA reduces cognitive load | DONNA never duplicates a page; she narrates, guides, and routes |
| Role-aware UX | Director ≠ Coach ≠ Parent ≠ Player at every screen |
| Official actions require approval | All curriculum, placement, and communication changes go through review |
| No silent mutations | Every important state change writes to `proposed_actions` or `audit_logs` |

---

## Role Standards

### Director

**Page philosophy:** Command center

**Job:** Run the academy at a glance. See risks. Make decisions. Approve DONNA's recommendations.

**Key screens:**
- Director Home — what needs attention, health snapshot, sessions, quick actions
- Review Queue — pending approvals and proposed actions
- Player Profile — development status and recommended next action
- Signals — academy-wide alert and suggestion feed

**UX rules:**
- One top command surface (never two competing "what to do today" sections)
- DONNA narrates priority signals — she does not create a separate competing dashboard
- Detailed KPI analysis belongs below the fold
- Academy setup belongs at the bottom
- Cognitive load: 11 sections maximum on home; operational content first

---

### Coach

**Page philosophy:** Mission screen

**Job:** Run today's session. Capture notes. Follow up on players. Get DONNA's brief.

**Key screens:**
- Coach Home — next session, watchlist, quick capture, missing recaps
- Session Detail — live on-court view
- Player Note — quick voice/text capture

**UX rules:**
- No director-style analytics on coach home
- DONNA Coach Brief is the top section
- Next Session is the primary content
- Quick Capture is always one tap away
- Missing Recaps are visible but framed as helpful, not shame-based
- Mobile-first — must work one-handed on a phone

---

### Parent

**Page philosophy:** Progress clarity and reassurance

**Job:** Understand how my child is doing. Know what to expect. Feel supported.

**Key screens:**
- Parent Dashboard — development progress, next session, recent wins
- Player Progress — level, current focus, recent sessions
- Messages — parent/director communication

**UX rules:**
- No raw coach notes
- No internal uncertainty or assessment debates
- Parent-safe vocabulary (not "at risk", "flagged", "on hold")
- Frame everything as progress and next steps
- No competitive ranking or comparison tone

---

### Player

**Page philosophy:** Mission and progress experience

**Job:** Know my mission. See my progress. Stay motivated.

**Key screens:**
- Player Home — current mission, today's practice, recent badge
- Progress — level history, improvement indicators
- Goals — next milestone

**UX rules:**
- Game-like framing (missions, badges, progress) — not school-like (grades, assessments)
- Encouraging but honest — no false progress signals
- Maximum 2–3 choices at a time
- Progress visible and meaningful
- Clear what to do today

---

## Full Audit Rubric

Score every page from **0–100**. Each category contributes to the total as shown.

---

### Category 1 — Purpose Clarity (10 points)

Does the user know why this page exists within 5 seconds?

| Check | Pass | Fail |
|---|---|---|
| Page title is obvious | Title names the job, not the object | "Dashboard", "Overview" |
| Page has one clearly stated job | Single purpose | Multiple mixed jobs |
| User understands their context | No scroll needed to orient | Must scroll before understanding |
| Page does not mix unrelated jobs | Tasks are grouped coherently | Settings + reports + actions on same page |

---

### Category 2 — Primary Action Clarity (10 points)

Is there one clear next action?

| Check | Pass | Fail |
|---|---|---|
| One primary CTA is visually dominant | `btn-lime` or equivalent emphasis | Multiple equal buttons |
| Secondary actions are visually quieter | `btn-ghost` or plain text links | Secondary CTAs same weight as primary |
| Destructive actions not over-promoted | Red/danger CTAs only when needed | Delete shown same weight as Save |
| Empty state gives direction | Empty state names what to do next | Blank space or "No data" |
| CTA labels are specific | "Create Class Template", "Review Recap" | "Manage", "Submit", "Go" |

---

### Category 3 — Cognitive Load (15 points)

Is the page easy to process without mental effort?

| Check | Pass | Fail |
|---|---|---|
| No duplicate sections | One surface per question | Two "what to do" sections |
| No competing command surfaces | Single top-level command area | DONNA + Attention Queue + Today competing |
| No long report feel | Clear sections, not lists of everything | 15+ sections of equal weight |
| Sections grouped by task | Task-first ordering | Database object ordering |
| Answers user's top questions in order | Most important first | Supporting analysis above primary action |
| Max 1–2 high-emphasis surfaces above fold | One dominant section | 5 equal-emphasis cards above fold |
| Information hierarchy narrows | Important → supporting → detail | All info at same level |

**Maximum score (15):** All of the above pass.

---

### Category 4 — Visual Hierarchy (10 points)

Is the visual path obvious?

| Check | Pass | Fail |
|---|---|---|
| Most important section is visually strongest | Lime border, larger font, more padding | All cards identical |
| Supporting info is visually quieter | Lower contrast, smaller type, less padding | Same emphasis as primary |
| Section headings differentiated | `label-xs` + semantic hierarchy | All same size |
| Cards have consistent density | Same padding and spacing within a type | Some dense, some airy, randomly |
| Color/weight direct attention | Accent color used sparingly | Lime everywhere |
| Alerts stand out from normal content | Red/orange for alerts, default for info | Alerts look like normal cards |

---

### Category 5 — Typography (10 points)

Is all text readable, clear, and hierarchical?

**Minimum size standards:**

| Text type | Minimum size | Allowed to be smaller? |
|---|---|---|
| Body / operational text | 14px (`text-sm`) | No |
| Important instructions | 15–16px (`text-base`) | No |
| Section subheadings | 14px (`text-sm`) | No |
| Metadata / timestamps | 12–13px (`text-xs`) | Only if non-critical |
| Label chips / status text | 11px (`text-[11px]`) | Only if paired with color/icon |
| Micro-labels (e.g. "do this first") | 9–10px | Only for decorative non-critical use |

**Line height standards:**
- Body text: `leading-snug` (1.375) minimum, `leading-normal` (1.5) preferred
- Multi-line descriptions: `leading-relaxed` (1.625) preferred
- Headings: `leading-tight` (1.25) acceptable

---

### Category 6 — Spacing and Layout (10 points)

Is the layout breathable and consistent?

**Minimum padding standards:**

| Element | Minimum padding |
|---|---|
| Card internal padding | 16px (`p-4`) for compact, 20–24px (`p-5`/`p-6`) for standard |
| Section gap | 24px (`gap-6`) |
| Touch/click row | 8–12px vertical padding (`py-2`/`py-3`) |
| Input field | 10–12px vertical, 12–16px horizontal |

**Layout rules:**
- Desktop columns only when they reduce cognitive load (not just to fill space)
- Mobile single-column as default; 2-column only if both columns are equally important
- Avoid nested `<Card>` inside `<Card>` unless the inner card is a list item
- Avoid tables on mobile — convert to labeled card rows instead
- Scroll depth: primary action should be visible above fold on most viewports

---

### Category 7 — Role Fit (10 points)

Does the page feel designed for this specific role?

| Role | Tone | Anti-pattern |
|---|---|---|
| Director | Command center — calm authority, data-first | Admin panel feel, too many settings |
| Coach | Mission screen — action-first, on-court clarity | Analytics dashboard, player database feel |
| Parent | Reassurance — progress-first, warm, human | Internal coaching language, uncertainty visible |
| Player | Energy — game-like, progress-first, encouraging | School-like grading, admin tone |

---

### Category 8 — Accessibility (10 points)

| Standard | Requirement |
|---|---|
| Text contrast | WCAG AA: 4.5:1 for normal text, 3:1 for large text |
| Interactive contrast | 3:1 against adjacent colors |
| Tap/click targets | ~44px minimum height for primary interactive elements |
| Color as only signal | Must pair with label, icon, or pattern |
| Icon-only interactive elements | Must have `aria-label` or visible text |
| Focus states | Visible focus ring on all interactive elements |
| Keyboard navigation | Tab order follows visual order; core actions reachable by keyboard |

---

### Category 9 — State Quality (5 points)

| State | Requirement |
|---|---|
| Loading | Skeleton or spinner — never blank |
| Empty | Explains what will appear here and how to create it |
| Error | Human-readable message — never raw DB/API error |
| Success | Confirms what changed, not just "Success" |
| Draft/review | Visually distinct from live/official — "Draft" label or faded treatment |
| Disabled | Explains why disabled — not just grayed |

---

### Category 10 — DONNA Integration (5 points)

| Check | Pass | Fail |
|---|---|---|
| DONNA is page-aware | Shows signals relevant to this page | Generic DONNA presence |
| DONNA does not duplicate page content | Adds context; does not repeat | DONNA card restates attention queue |
| DONNA surfaces 1–3 focused actions | Specific next steps | Full brief with 10+ suggestions |
| DONNA explains approval boundaries | "DONNA flags — director approves" | User unclear what DONNA can do |
| DONNA is visually subordinate | Below or supporting primary surface | DONNA competes with command center |

---

### Category 11 — Trust and Safety (5 points)

| Check | Pass | Fail |
|---|---|---|
| Official changes require review | Goes through `proposed_actions` → review queue | One-click publish/send |
| Parent/player content is clearly separated | Parent view has no raw notes | Raw coach notes visible in parent view |
| High-risk actions not one-click | Confirmation dialog or review step | Delete/publish/send as bare buttons |
| Draft visually distinct from live | "Draft" badge, faded, or locked indicator | Draft looks identical to official |
| Role boundaries enforced | Coach cannot trigger director actions | Role controls bleed across views |

---

## Pass / Fail Conditions

A page **fails AIQS** if **any** of these are true:

| Condition | Why |
|---|---|
| User cannot identify page purpose in 5 seconds | Fundamental clarity failure |
| Multiple competing top command surfaces | Cognitive load failure |
| More than one primary CTA above the fold | Visual hierarchy failure |
| Important text under 14px or too low contrast | Accessibility failure |
| Mobile shows 10+ sections before the main action | Mobile usability failure |
| DONNA duplicates page content instead of simplifying | DONNA integration failure |
| Parent/player safe boundaries unclear | Trust/safety failure |
| Official actions triggerable without review | Safety guardrail failure |
| Page feels like a database admin panel | Role fit/philosophy failure |

A page that fails any of these conditions receives a **maximum score of 54/100** regardless of other scores.

---

## Audit Output Format

See `.claude/skills/academy-interface-quality-auditor/SKILL.md` for the exact output format template.

---

## Sprint Usage

**To audit a page:**

1. Load the skill by typing `/academy-interface-quality-auditor audit [page name]`
   or by asking Claude to "audit [page] against the AIQS"

2. Claude reads the page component and its above-fold `_components/`

3. Claude produces the full audit report

4. Review the report with the user

5. If fixes are approved, create a sprint: `Sprint NNN — [Page] AIQS Improvements V1`

**Sprint naming convention:**
```
Sprint NNN — [Page Name] AIQS [Category] Improvements V1
```
Examples:
- `Sprint 769 — Coach Home AIQS Typography + Mobile Pass V1`
- `Sprint 770 — Curriculum Map AIQS Cognitive Load V1`
- `Sprint 771 — Player Profile AIQS Role Fit + Accessibility V1`

---

## Related Files

| File | Purpose |
|---|---|
| `.claude/skills/academy-interface-quality-auditor/SKILL.md` | Executable skill definition |
| `docs/UI_AUDIT_SCORECARD_TEMPLATE.md` | Blank scorecard for manual audits |
| `tailwind.config.ts` | Design token reference |
| `src/components/ui/index.ts` | Available UI components |
| `src/app/director/page.tsx` | Reference for Director Home standard |
| `src/app/director/_components/DirectorTodayCommandCenter.tsx` | Reference for unified command surface |
| `docs/CHANGELOG.md` | Sprint history |
