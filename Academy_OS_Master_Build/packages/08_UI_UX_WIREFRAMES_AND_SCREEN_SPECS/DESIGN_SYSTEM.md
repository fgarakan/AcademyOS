# DESIGN SYSTEM
**Package:** 08 — UI/UX Wireframes and Screen Specs
**Version:** 1.0 | **Status:** Draft

---

## Reference

Primary UI reference: `https://angles-os-mbgpiq3v.manus.space/`

Match Manus direction by default. Diverge only when needed for:
- Voice-first creation flows
- Proposed action approval surfaces
- Mobile usability
- Placement workflow clarity
- Accessibility

---

## Design Philosophy

**Premium dark athletic minimal.** Academy OS should feel like an operating system,
not a SaaS tool. Directors should feel in control. Coaches should move fast.

**Operating-system feeling.** Dense but readable. Cards and panels, not pages of forms.
Status is always visible. CTAs are always clear.

**No unnecessary chrome.** Every element earns its place. No decorative borders,
gratuitous gradients, or dashboard widgets that don't drive action.

---

## Color Palette

```css
/* Base */
--bg-base:       #0d0f14;   /* page background */
--bg-surface:    #141720;   /* card / panel background */
--bg-elevated:   #1e2230;   /* hover state, selected state */
--bg-overlay:    #252a3a;   /* modals, dropdowns */

/* Text */
--text-primary:   #f0f2f8;  /* main headings and body */
--text-secondary: #8891a8;  /* labels, meta, secondary info */
--text-muted:     #4a5168;  /* disabled, placeholder */

/* Accent */
--accent-blue:    #4f8ef7;  /* primary CTA, links, active states */
--accent-blue-dim:#2a4a8a;  /* secondary blue surface */

/* Semantic */
--color-success:  #3ecf8e;  /* confirmed, activated, complete */
--color-warning:  #f5a623;  /* due soon, medium risk, caution */
--color-error:    #e05252;  /* overdue, high risk, error state */
--color-neutral:  #8891a8;  /* inactive, optional, pending */

/* Risk levels */
--risk-low:       #3ecf8e;
--risk-medium:    #f5a623;
--risk-high:      #e05252;
```

---

## Typography

```css
/* Font stack */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   0.75rem;   /* 12px — meta, badges */
--text-sm:   0.875rem;  /* 14px — secondary labels, table body */
--text-base: 1rem;      /* 16px — body copy, form labels */
--text-lg:   1.125rem;  /* 18px — card titles */
--text-xl:   1.25rem;   /* 20px — section headers */
--text-2xl:  1.5rem;    /* 24px — page titles */
--text-3xl:  1.875rem;  /* 30px — dashboard stat callouts */

/* Weight */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

---

## Spacing

8px base grid. Use multiples: 4, 8, 12, 16, 24, 32, 48, 64.

```css
--space-1:  4px;
--space-2:  8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
```

---

## Radius

```css
--radius-sm: 4px;   /* small chips, tags */
--radius-md: 8px;   /* cards, panels, inputs */
--radius-lg: 12px;  /* modals, large panels */
--radius-full: 9999px; /* pills, avatars */
```

---

## Components

### Card

```
background: var(--bg-surface)
border: 1px solid rgba(255,255,255,0.06)
border-radius: var(--radius-md)
padding: var(--space-6)
```

Hover state: `background: var(--bg-elevated)`

### Button — Primary

```
background: var(--accent-blue)
color: white
padding: 10px 20px
border-radius: var(--radius-md)
font-weight: var(--font-semibold)
font-size: var(--text-sm)
```

### Button — Secondary

```
background: transparent
color: var(--text-primary)
border: 1px solid rgba(255,255,255,0.12)
```

### Button — Destructive

```
background: var(--color-error)
color: white
```

### Status Badge

```
padding: 2px 8px
border-radius: var(--radius-full)
font-size: var(--text-xs)
font-weight: var(--font-semibold)
text-transform: uppercase
letter-spacing: 0.05em
```

Colors: success / warning / error / neutral (match semantic palette)

### Input

```
background: var(--bg-elevated)
border: 1px solid rgba(255,255,255,0.08)
border-radius: var(--radius-md)
color: var(--text-primary)
padding: 10px 14px
font-size: var(--text-base)
```

Focus: `border-color: var(--accent-blue)`

### Data Table

```
Header row: background var(--bg-overlay), text-secondary, text-xs uppercase
Body rows: background var(--bg-surface), border-bottom 1px solid rgba(255,255,255,0.04)
Hover row: background var(--bg-elevated)
```

Sticky header for long tables.

### Intensity Bar (1–5)

Five segments. Filled segments colored by value:
- 1–2: `--color-success` (low/moderate)
- 3: `--color-warning` (medium-high)
- 4–5: `--color-error` (high/maximum)

### Score Delta Chip

```
Green chip (positive delta): background #1a3d2e, color #3ecf8e
Red chip (negative delta): background #3d1a1a, color #e05252
Neutral (zero): background #1e2230, color #8891a8
```

---

## Layout Patterns

### Desktop — Split Pane

```
┌──────────────────────────────────────────────────────┐
│  NAV (left sidebar, 220px)  │  MAIN CONTENT          │
│                             │                        │
│  Logo                       │  ┌────────────────┐   │
│  ─────                      │  │ Page title      │   │
│  Dashboard                  │  │ Actions         │   │
│  Players ◉                  │  └────────────────┘   │
│  Groups                     │                        │
│  Sessions                   │  Content area          │
│  Templates                  │                        │
│  Voice                      │                        │
│  ─────                      │                        │
│  Settings                   │                        │
└──────────────────────────────────────────────────────┘
```

Used for: director dashboard, player list + profile detail.

### Desktop — Full Width

Used for: session builder, template editor, voice command flow, placement flow.

### Mobile — Stacked

Nav collapses to bottom tab bar or hamburger.
Single column layout.
Separate screens instead of split panes.
Larger tap targets (min 44px).

---

## Navigation Structure

```
Top Nav (all roles):
  Left: Academy name / Logo
  Center: Global search
  Right: "Tell the OS" button | Notifications | Profile

Left Sidebar (staff roles):
  Dashboard
  Players
  Groups
  Sessions
  Templates
  Voice Commands
  ─────────
  Settings (Director only)
```

---

## Empty States

Each list/table has a specific empty state with:
- Icon (not decorative, contextually relevant)
- Heading: clear description of what's missing
- Subtext: what to do next
- CTA button

Example — Players list empty:
> **No players yet**
> Add your first player or run the placement flow to onboard a new student.
> [Add Player]

---

## Loading States

- Skeleton screens (not spinners) for list views
- Spinner only for short inline actions (< 2 seconds expected)
- Optimistic updates where safe (attendance toggle, note save)

---

## Error States

- Toast notification for transient errors (saved / failed to save)
- Inline field validation for form errors
- Full-page error for auth or fatal load failure

Toast:
```
position: bottom-right
duration: 4 seconds
colors: success / error / warning / neutral
```
