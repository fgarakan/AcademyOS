# Desktop Command Center Patterns

> Sprint 455 — AcademyOS Desktop Layout System V1
> See also: `src/lib/ux/desktopPatterns.ts`, `docs/RESPONSIVE_SHELL_PATTERNS.md`

---

## Shell

Director desktop uses:
- Fixed left sidebar: `w-60` (240px)
- Main area: `flex-1 ml-60`
- Floating DONNA button: fixed bottom-right

The sidebar must never collapse by default. It is the command spine of the director experience.

---

## Three-Column Command Center

Used for: Director Dashboard, Today view, KPI Dashboard.

```
┌──────────────────┬──────────────┬──────────────┐
│ Primary (flex-1) │ Secondary    │ Tertiary     │
│                  │ (320px)      │ (280px)      │
│ KPI tiles        │ Pending      │ DONNA panel  │
│ Session list     │ approvals    │ Activity     │
│ Player flags     │ Alerts       │ feed         │
└──────────────────┴──────────────┴──────────────┘
```

Tailwind: `grid grid-cols-[1fr_320px_280px] gap-4`

---

## Split-Pane Review

Used for: Approval Center, Curriculum Inbox.

```
┌──────────────┬─────────────────────────────────┐
│ Queue        │ Detail                          │
│ (w-80)       │ (flex-1)                        │
│ Item list    │ Full review content             │
│ Scrollable   │ Approve / Edit / Reject         │
└──────────────┴─────────────────────────────────┘
```

Active item in queue: left lime border, lime/5 background.

---

## Side Detail Drawer

Used for: Player detail from a list, Template preview, Signal detail.

Width: 480px
Opens from right over main content (does not push layout).
Always has: header with close button, scrollable body, sticky footer with actions.

---

## KPI Grid

Four KPI tiles per row on desktop:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
```

Each tile: MetricCard (from `src/components/ui/MetricCard.tsx`)
- Large number: `font-mono text-lime text-3xl`
- Label: `label-xs`
- Delta indicator: arrow up/down with status-green / status-red

---

## Activity Feed

Right column sidebar for live activity.

Each item:
- Color dot (lime = new, muted = historic, red = urgent, orange = warning)
- Short action text
- Relative timestamp

Maximum 20 items. Scrollable.

---

## Sticky DONNA Panel

Persistent floating panel at bottom-right.

Size: 380px wide, up to 600px tall
Header: DONNA logo + status dot + minimize button
Messages: scrollable, newest at bottom
Input: text + voice toggle

Panel state:
- Minimized = just the floating button
- Open = full panel
- Thinking = spinner in header

---

## Approval Workspace

Used for bulk review sessions.

Queue (left, w-80):
- Sorted: high-risk first, then oldest
- Each item: risk badge, action type, player name, age
- Selected item: lime left border

Detail (right, flex-1):
- Full action detail
- DONNA reasoning
- Who is affected
- Approve / Edit / Reject / Send back
- Audit trail below

---

## Page Containers

Standard page: `p-6 max-w-7xl mx-auto space-y-6`
Wide page (KPI, command center): `p-6 space-y-6`

Section titles: `text-sm font-semibold text-text-secondary uppercase tracking-wide`
Page titles: `text-xl font-semibold text-text-primary`
