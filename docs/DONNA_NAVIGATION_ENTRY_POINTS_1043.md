# DONNA Navigation Entry Points — Sprint 1043

**Date:** 2026-05-18
**Sprint:** 1043 — DONNA Director Coach Navigation Entry Points V1

---

## What changed

Added safe navigation entry points to make DONNA easy to find from both the Director and Coach portals.

### Files modified
- `src/components/nav/SidebarNav.tsx` — added DONNA to director sidebar
- `src/app/coach/page.tsx` — added DONNA CTA card and quick action tile

---

## Director entry points

### Sidebar (SidebarNav)
DONNA added to `ACADEMY_ITEMS` immediately after Dashboard:

```
Dashboard      → /director
DONNA          → /director/donna  (NEW — Sparkles icon)
Today's Academy → /director/today
Players        → /director/players
...
```

Position rationale: DONNA is the director's COO assistant — second in the sidebar after Dashboard means it's always visible without scrolling. Not at the top (Dashboard is "home") but immediately accessible.

---

## Coach entry points

### Coach Home page CTA card
Replaced the simple DONNA text block with a tappable card:
- Shows DONNA + Coach role badge
- Contextual description based on session count
- Shows pending wrap-up count if >0
- Full-width card with ChevronRight → `/coach/donna`
- Border: `border-status-blue/20` (blue accent for coach role)

### Coach Home quick action tile
Added "Ask DONNA" as a full-width tile spanning the 2-column grid at the bottom of Quick Actions:
- Icon: Sparkles (blue)
- Subtitle: "Sessions, players, wrap-up, player watch-fors"
- Links to `/coach/donna`

---

## Navigation integrity

| Route | Status | Notes |
|---|---|---|
| `/director/donna` | Exists (Sprint 1038) | Director DONNA command center |
| `/coach/donna` | Exists (Sprint 1039) | Coach DONNA assistant page |
| Director sidebar `DONNA` | New (Sprint 1043) | Sparkles icon, active state via SidebarNav |
| Coach home DONNA card | New (Sprint 1043) | Full-width tappable block |
| Coach home DONNA quick action | New (Sprint 1043) | Spans 2-col grid, always visible |

---

## No broken links

All added navigation links point to pages created in Sprints 1038-1039. No placeholder or orphaned links.

## TypeScript

Clean (`npx tsc --noEmit` — no errors).
