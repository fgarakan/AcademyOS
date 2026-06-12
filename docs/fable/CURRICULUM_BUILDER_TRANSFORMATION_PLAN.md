# Curriculum Builder Transformation Plan
Date: June 2026
Sprint: Mega Sprint 2201–2230 — Fable Platform-Wide Screen Transformation V1
Status: PLAN — Awaiting approval before implementation (Phase D)

---

## Scope

This document audits `src/app/director/curriculum/builder/` and the primary
component `CurriculumSetupBuilder.tsx` before any code changes.

Files in scope:
- `src/app/director/curriculum/builder/page.tsx` (115 lines — server component)
- `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx` (632 lines — client component)

---

## Part 1 — Current State

### What the Builder Does

The Curriculum Builder is a DONNA-integrated workflow that allows the director to:
1. Review the academy's master curriculum (15 levels, 5 pathways)
2. Customize each level (add drills, exercises, assessment criteria)
3. Approve or reject DONNA-suggested changes before they go live

The builder operates in two modes:
- **Guided:** DONNA walks the director through levels one at a time
- **Jump:** Director selects a level directly from a list

The builder is accessed from `/director/curriculum/builder` (server component `page.tsx`)
which fetches auth, academy settings, curriculum state, and DONNA intelligence context,
then renders `CurriculumSetupBuilder` (client component) with those props.

### Architecture

```
page.tsx (server)
├── Auth + academy_id check
├── Fetches: academy settings, curriculum levels, DONNA intelligence context
├── Renders: <CurriculumSetupBuilder> with all data as props
└── Above builder: <CurriculumBuilderChangeQueue> (Suspense-streamed pending modifications)

CurriculumSetupBuilder.tsx (client)
├── DONNA completion banner (when workflow finished)
├── DONNA review banner (when workflow has collected answers)
├── Breadcrumb: "← Curriculum Command Center"
├── Header: "Curriculum Builder" + "Powered by DONNA"
├── DONNA Intelligence tabs: Architect | Evolution
│   ├── Architect: CurriculumRecommendationCard + DonnaCurriculumPanel
│   └── Evolution: CurriculumEvolutionPanel
├── DONNA Hero Card (main CTA surface)
│   ├── DONNA avatar + identity
│   ├── Headline: "Your academy starts with the master curriculum"
│   ├── Actions: Start Guided Review / Review Incomplete Levels / Jump to a Level
│   └── Actions: Ask DONNA to Suggest Priorities / Advanced Settings
├── "How It Works" (collapsed by default)
├── Curriculum Map overview (collapsed by default)
└── Safety Footer: "Nothing changes until you review and approve"
```

---

## Part 2 — Problems

### 2.1 Design Token Violations — Critical

The `CurriculumSetupBuilder.tsx` uses inline `style={}` attributes and hardcoded
hex/rgba values throughout. This is the highest design token violation density
in the platform.

**All violations:**

| Location | Violation | Should Be |
|---|---|---|
| Line 230: `<div ... style={{ background: '#050b09' }}>` | Hex color | `bg-base` |
| Line 369: `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.15)' }}` | Hex + rgba | `bg-surface border border-lime/15` |
| Lines 376–381: `style={{ background: 'radial-gradient(...)' }}` | Inline gradient | CSS class or Tailwind arbitrary value |
| Line 390: `style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.20)' }}` | Inline | `bg-lime/8 border border-lime/20` |
| Line 407–413: `style={{ background: 'rgba(200,255,0,0.10)', border: '...', color: '#C8FF00' }}` | Hex + rgba | `bg-lime/10 border border-lime/20 text-lime` |
| Lines 439–442: `style={{ background: '#C8FF00', color: '#0A0A0A' }}` | Hex | `bg-lime text-base` (`btn-lime` handles this) |
| Lines 447–450: `style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.12)', color: '#a3aab4' }}` | Inline | `bg-lime/5 border border-lime/10 text-text-secondary` |
| Lines 460–463: same pattern as above | Inline | same |
| Lines 478–481: `style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.10)', color: '#a3aab4' }}` | Inline | `bg-lime/[0.04] border border-lime/10 text-text-secondary` |
| Lines 490–492: `style={{ background: 'rgba(200,255,0,0.02)', border: '1px solid rgba(200,255,0,0.06)', color: '#555' }}` | Inline | `bg-lime/[0.02] border border-lime/[0.06] text-text-muted` |
| Line 507: `style={{ background: 'rgba(0,0,0,0.20)' }}` ("How it works" summary) | Inline | `bg-black/20` |
| Lines 519–522: `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.09)' }}` | Hex + rgba | `bg-surface border border-lime/[0.09]` |
| Lines 524–527: `style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.18)' }}` | Inline | `bg-lime/8 border border-lime/[0.18]` |
| Line 548: `style={{ background: 'rgba(0,0,0,0.20)' }}` (Curriculum map summary) | Inline | `bg-black/20` |
| Lines 563–565: `style={{ background: p.glow, border: '1px solid ...' }}` | JS object hex | See PATHWAYS below |
| Line 570: `style={{ background: p.dot }}` | JS hex | See PATHWAYS below |
| Lines 579–581: `style={{ color: 'rgba(200,255,0,0.55)' }}` (safety footer x2) | Inline | `text-lime/55` |
| Lines 597–598: `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.15)' }}` (Jump modal) | Hex + rgba | `bg-surface border border-lime/15` |
| Line 598: `borderColor: 'rgba(200,255,0,0.10)'` (modal header) | Inline | `border-lime/10` |
| Line 615: `style={{ borderColor: 'rgba(200,255,0,0.07)' }}` (level list items) | Inline | `border-lime/[0.07]` |
| Line 619: `style={{ background: STAGE_COLOR[...] }}` | JS hex object | See STAGE_COLOR below |

**STAGE_COLOR object (lines 39–46):**
```ts
const STAGE_COLOR: Record<string, string> = {
  red_foundation:     '#ef4444',
  orange_development: '#f97316',
  green_performance:  '#22c55e',
  yellow_competitive: '#eab308',
  high_performance:   '#11d9df',
}
```
These hex values are used only for the stage dot indicator in the "Jump to Level" modal.
They correspond exactly to AcademyOS status colors:
- `#ef4444` = `text-status-red` (Tailwind red-500)
- `#f97316` = `text-status-orange` (Tailwind orange-500)
- `#22c55e` = `text-status-green` (Tailwind green-500)
- `#eab308` = Tailwind yellow-500 (no direct AcademyOS token — closest is `status-orange`)
- `#11d9df` = cyan-ish (no direct AcademyOS token)

**PATHWAYS object (lines 47–83):**
Five pathway entries, each with `dot`, `border`, and `glow` as hex/rgba strings.
Used for the collapsed "Curriculum map" section. These correspond to STAGE_COLOR
values but expressed as border and background opacity variants.

### 2.2 No Standard Page Header — Medium

The builder does not use `page-eyebrow/title/subtitle`. Instead it has:
- A breadcrumb: `← Curriculum Command Center` (which will need updating after Phase A renamed the parent to "Curriculum")
- An inline `<h1>` without `page-title` class
- A subtitle without `page-subtitle` class

Director orientation: a director arriving at the builder via direct link has no
`page-eyebrow` label. The "Curriculum Builder" `<h1>` is inside the client
component's DONNA hero card area, positioned after the completion/review banners.
If DONNA banners are active, the header is pushed well below fold.

### 2.3 DONNA Entry Points — Three Overlapping Surfaces

The builder presents three distinct DONNA interaction surfaces:

1. **Ask DONNA chip** (top-right of page) — links to `/director/donna`
   → Navigates away from the builder entirely
   
2. **DONNA Intelligence tabs** (Architect | Evolution) — embedded DONNA panel
   → Stays on this page, shows recommendations and evolution memory
   
3. **DONNA review banner** (conditional) — appears when DONNA collected answers
   → Action: "Confirm & Save Curriculum Draft" or "Dismiss"

These three surfaces conflict:
- Surface 1 takes director off the page
- Surface 2 shows DONNA on the page
- Surface 3 shows DONNA output for confirmation

A director who has never used the builder before would not understand the relationship
between these three. The flow is: DONNA panel (surface 2 or 3) → collects answers via
conversation → surfaces a review banner (surface 3) → director confirms. Surface 1
(Ask DONNA chip) is a generic escape hatch that disrupts this flow.

### 2.4 Curriculum Builder Information Hierarchy — Medium

The current layout order when the director opens the builder:

1. Ask DONNA chip (top-right — always visible)
2. Pending Modifications queue (Suspense-streamed, may show or not)
3. DONNA completion banner (conditional — shows if DONNA workflow just finished)
4. DONNA review banner (conditional — shows if DONNA has answers awaiting confirmation)
5. Breadcrumb (small, muted)
6. Page header ("Curriculum Builder" + "Powered by DONNA")
7. DONNA Intelligence tabs (if intelligenceContext available)
8. DONNA Hero Card (main CTA)
9. "How it works" (collapsed)
10. Curriculum map (collapsed)
11. Safety footer

The problem: items 3 and 4 (conditional DONNA banners) appear ABOVE the breadcrumb
and header (items 5–6). When banners are active, the director sees DONNA content
before knowing where they are. The page identity should always be above DONNA content.

### 2.5 Breadcrumb Text — Small but Broken

The breadcrumb at line 300 reads:
```
← Curriculum Command Center
```
After Phase A renamed the parent page to "Curriculum", this breadcrumb is stale.
It should read:
```
← Curriculum
```

### 2.6 Builder Workflow Readability — Medium

The DONNA Hero Card (lines 366–503) is the largest single UI block on the page.
It contains:
- DONNA avatar + identity badge
- 2-line headline
- 1 paragraph of body text
- 4 action buttons in two rows

The 4 action buttons create visual noise:
- "Start Guided Review" (primary — lime bg)
- "Review Incomplete Levels" (secondary ghost)
- "Jump to a Level" (secondary ghost)
- "Ask DONNA to Suggest Priorities" (tertiary ghost)
- "Advanced Settings" (near-invisible)

5 buttons with 3 levels of visual hierarchy is too many choices. Directors who
know what they want (jump to a level, start guided) have to parse all 5 before
acting. Directors who don't know what they want are equally uncertain after
reading all 5.

### 2.7 Safety Footer — Functionally Correct, Visually Inconsistent

Lines 578–591: The safety footer ("Nothing changes until you review and approve.")
uses two inline `style={{ color: 'rgba(200,255,0,0.55)' }}` attributes.
This should be `text-lime/55`. The message itself is well-conceived and should stay.

### 2.8 Jump to Level Modal — Functional but Styled with Hex

The modal (lines 594–629) uses hex and rgba throughout:
- `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.15)' }}`
- `style={{ borderColor: 'rgba(200,255,0,0.10)' }}`
- `style={{ borderColor: 'rgba(200,255,0,0.07)' }}`
- `style={{ background: STAGE_COLOR[level.stage ?? ''] ?? '#555' }}`

These need to become Tailwind classes.

---

## Part 3 — Recommended State

### 3.1 Token Cleanup (Phase D — deferred)

Convert all inline `style={}` attributes to Tailwind classes:

**STAGE_COLOR replacement:**
```ts
const STAGE_CLASSES: Record<string, string> = {
  red_foundation:     'bg-status-red',
  orange_development: 'bg-status-orange',
  green_performance:  'bg-status-green',
  yellow_competitive: 'bg-status-orange', // no direct yellow token; orange is semantically closest
  high_performance:   'bg-lime',
}
```

**PATHWAYS replacement:**
```ts
const PATHWAYS = [
  { name: 'Red Ball',        levels: 3, dotClass: 'bg-status-red',    borderClass: 'border-status-red/20',    bgClass: 'bg-status-red/5' },
  { name: 'Orange Ball',     levels: 3, dotClass: 'bg-status-orange', borderClass: 'border-status-orange/20', bgClass: 'bg-status-orange/5' },
  { name: 'Green Ball',      levels: 3, dotClass: 'bg-status-green',  borderClass: 'border-status-green/20',  bgClass: 'bg-status-green/5' },
  { name: 'Yellow Ball',     levels: 3, dotClass: 'bg-status-orange', borderClass: 'border-status-orange/20', bgClass: 'bg-status-orange/5' },
  { name: 'High Performance',levels: 3, dotClass: 'bg-lime',          borderClass: 'border-lime/20',          bgClass: 'bg-lime/5' },
]
```

Note: Yellow Ball uses `bg-status-orange` because there is no yellow design token.
The stage color in `curriculum/page.tsx` was updated to `bg-status-orange` in
Phase A for the same reason.

**Hero Card replacement:**
- `style={{ background: '#060f0d', border: '1px solid rgba(200,255,0,0.15)' }}`
  → `className="bg-surface border border-lime/15"`
- Radial gradient decorative glow: keep as Tailwind `bg-gradient-to-r from-lime/5` or accept as inline (decorative only)
- DONNA avatar circle: `bg-lime/8 border border-lime/20` (Tailwind arbitrary value)
- "AI-Powered" badge: `bg-lime/10 border border-lime/20 text-lime`
- Primary action button: replace inline style with `btn-lime`
- Secondary action buttons: `bg-lime/5 border border-lime/10 text-text-secondary`
- Tertiary action buttons: `bg-lime/[0.04] border border-lime/10 text-text-secondary`
- Advanced Settings button: `bg-lime/[0.02] border border-lime/[0.06] text-text-muted`
- "How it works" / "Curriculum map" summaries: `bg-black/20`
- "How it works" cards: `bg-surface border border-lime/[0.09]`
- Step number circles: `bg-lime/8 border border-lime/[0.18]`
- Safety footer: `text-lime/55`
- Jump modal container: `bg-surface border border-lime/15`
- Jump modal header border: `border-lime/10`
- Jump modal list items: `border-lime/[0.07]`
- Stage dots in modal: Use `STAGE_CLASSES` map + `className={STAGE_CLASSES[level.stage ?? ''] ?? 'bg-text-muted'}`

### 3.2 Page Header Hierarchy

Recommended layout order (after token cleanup):

1. Breadcrumb (← Curriculum)
2. `page-eyebrow`: "Curriculum"
3. `page-title`: "Builder"
4. `page-subtitle`: "Customize your academy's development spine one level at a time."
5. DONNA completion banner (conditional)
6. DONNA review banner (conditional)
7. DONNA Intelligence tabs (if context available)
8. DONNA Hero Card
9. "How it works" (collapsed)
10. Curriculum map (collapsed)
11. Safety footer

The Pending Modifications queue (streamed from server) moves below the breadcrumb
but above the header — it is a persistent queue notification, not DONNA-specific.

### 3.3 DONNA Entry Point Consolidation

**Remove the "Ask DONNA" chip** from the top-right corner of `page.tsx`.
Rationale: The chip navigates away from the builder (`/director/donna`). The builder
itself has DONNA embedded (Intelligence tabs + workflow panel). Having an external
DONNA link creates the impression that the embedded DONNA is different from the
"real" DONNA. Directors should interact with DONNA through the embedded surface.

If directors want to ask DONNA a free-form question, they can use the sidebar
DONNA access (or the embedded DonnaCurriculumPanel which accepts open questions).

### 3.4 Button Hierarchy in Hero Card

Reduce from 5 buttons to 3 with clear hierarchy:

```
Primary (btn-lime):    Start Guided Review
Secondary (ghost):     Jump to a Level
Tertiary (text-only):  View Curriculum Map →
```

Remove "Review Incomplete Levels" (duplicate of Start Guided Review — DONNA
surfaces incomplete levels during the guided review anyway).
Remove "Ask DONNA to Suggest Priorities" (duplicate of Architect tab above).
Remove "Advanced Settings" (unexplained, leads to /director/curriculum which
directors can already navigate to from the sidebar).

### 3.5 Breadcrumb Update

Change breadcrumb text from:
```
← Curriculum Command Center
```
To:
```
← Curriculum
```

This reflects Phase A's rename of the parent page.

---

## Part 4 — Expected Outcome

After Phase D implementation:

**Design token compliance:** Builder will match the rest of the platform. All
hex and rgba inline styles replaced with Tailwind classes. STAGE_COLOR and
PATHWAYS using class names, not hex strings.

**Visual consistency:** The builder will look like an AcademyOS screen, not
a standalone prototype. Stage colors match the curriculum page (which was
updated in Phase A).

**DONNA clarity:** One DONNA entry point visible above the fold (the embedded
Intelligence tabs). One action surface below that (the Hero Card). One confirmation
surface when DONNA produces output (the review banner). Clear flow.

**Information hierarchy:** Director always sees "Curriculum / Builder" header
before any DONNA content. Breadcrumb matches parent page name.

**Button count:** 5 buttons → 3 buttons. Director chooses faster.

---

## Part 5 — Implementation Notes

### Risk Assessment

**Low risk (mechanical):**
- Inline `style={}` → Tailwind classes: pure CSS, no logic changes
- STAGE_COLOR → STAGE_CLASSES: one `background:` property → one `className`
- PATHWAYS hex → Tailwind classes: three `style` properties → three `className` props
- Breadcrumb text update: one string change
- Safety footer color fix: two inline styles → one class

**Medium risk (behavior change):**
- Removing "Ask DONNA" chip: removes a navigation option. Directors who bookmarked
  `/director/donna` from this chip can still reach it via sidebar. Not blocking.
- Removing 2 buttons from Hero Card: removes "Review Incomplete Levels" and
  "Ask DONNA to Suggest Priorities". Both are redundant with embedded surfaces.
  Verify neither is referenced in any DONNA workflow script.

**Not in scope for Phase D:**
- DonnaCurriculumPanel, CurriculumRecommendationCard, CurriculumEvolutionPanel
  — these are deeply integrated DONNA components and should not be modified
  without a separate audit
- Any DONNA workflow logic (buildCurriculumRecommendations, buildWorkflowExecutionPlan)
- Structural refactoring of CurriculumSetupBuilder.tsx into sub-components

### Files to Touch in Phase D

1. `src/app/director/curriculum/builder/page.tsx`
   - Remove "Ask DONNA" chip (lines 86–95)
   - Update breadcrumb text in CurriculumSetupBuilder (via prop or pass-through)

2. `src/app/director/curriculum/builder/CurriculumSetupBuilder.tsx`
   - Convert STAGE_COLOR object to STAGE_CLASSES
   - Convert PATHWAYS object to use Tailwind class names
   - Replace all inline `style={}` with Tailwind classes
   - Update breadcrumb text (line 300): "Curriculum Command Center" → "Curriculum"
   - Add `page-eyebrow/title/subtitle` before DONNA banners
   - Reorder layout: header → banners → intelligence → hero
   - Reduce Hero Card buttons from 5 to 3

### Estimated Scope

- ~60–80 line changes
- Pure style changes — no data model, no query, no auth changes
- TypeScript check should remain clean (no type changes)
- No migration needed

---

## Approval Gate

Do not implement Phase D until this plan is approved.

Changes in Phase D are surgical but wide — they touch many lines in a single
client component. The plan above provides an exact mapping for every inline
style to its replacement. Approval confirms: (a) the token mapping is correct,
(b) the DONNA entry point consolidation is accepted, (c) the button reduction
is accepted.
