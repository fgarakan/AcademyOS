# Premium UI System Audit

**Date:** 2026-05-01
**Sprint:** 126 — UI Audit + Design System Plan V1

---

## Current Styling Architecture

### Technology
- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Global CSS:** `src/app/globals.css` — CSS variables + Tailwind base/components/utilities
- **Font:** Inter (Google Fonts import) + JetBrains Mono for monospace

### Current Design Tokens (tailwind.config.ts)
| Token | Current Value | Target Value |
|---|---|---|
| `base` | `#0A0A0A` | `#030506` |
| `surface.DEFAULT` | `#111111` | `#07090c` |
| `surface.raised` | `#1A1A1A` | `#0d1117` |
| `surface.overlay` | `#222222` | `#121820` |
| `border.DEFAULT` | `#222222` | `#1a2030` |
| `border.subtle` | `#1A1A1A` | `#111820` |
| `border.strong` | `#333333` | `#243040` |
| `lime.DEFAULT` | `#C8FF00` | `#11d9df` (cyan accent) |
| `lime.dim` | `#C8FF0033` | `rgba(17,217,223,0.2)` |
| `lime.muted` | `#C8FF0011` | `rgba(17,217,223,0.08)` |
| `text.primary` | `#FFFFFF` | `#f4f7f8` |
| `text.secondary` | `#AAAAAA` | `#a3aab4` |
| `text.muted` | `#555555` | `#626b76` |
| `status.red` | `#FF3B30` | `#ff4d55` |
| `status.orange` | `#FF9500` | `#ffb020` |
| `status.green` | `#30D158` | `#52e36f` |
| `status.blue` | `#0A84FF` | `#0A84FF` (keep) |

Missing tokens to add:
- `status.purple`: `#b56cff` (AI/intelligence accent)
- `status.amber`: `#ffb020`
- `shadow.cyan`: cyan glow for active cards

---

## Shared Components Available

| Component | File | Status |
|---|---|---|
| Card, CardHeader, CardContent, CardFooter | `src/components/ui/Card.tsx` | Update background tokens |
| MetricCard | `src/components/ui/MetricCard.tsx` | Update accent colors |
| ActionCard | `src/components/ui/ActionCard.tsx` | Update |
| StatusBadge | `src/components/ui/StatusBadge.tsx` | Update color palette |
| LevelBadge | `src/components/ui/LevelBadge.tsx` | Keep (uses inline stage colors) |
| ProgressBar | `src/components/ui/ProgressBar.tsx` | Update accent |
| Avatar | `src/components/ui/Avatar.tsx` | Update bg |
| EmptyState | `src/components/ui/EmptyState.tsx` | Update surface tokens |
| LoadingSkeleton | `src/components/ui/LoadingSkeleton.tsx` | Update |
| SectionHeader | `src/components/ui/SectionHeader.tsx` | Update accent link color |
| Modal | `src/components/ui/Modal.tsx` | Update bg tokens |
| Tabs, TabsList, TabsTrigger, TabsContent | `src/components/ui/Tabs.tsx` | Update active state |
| Table, TableHeader, TableBody, TableRow, TableHead, TableCell | `src/components/ui/Table.tsx` | Update border/hover |
| SearchFilterBar | `src/components/ui/SearchFilterBar.tsx` | Update input styling |
| DomainRing | `src/components/ui/DomainRing.tsx` | Keep |

---

## Duplicated Page Layouts

Multiple pages define their own `PageHeader` inline component. All should use a consistent pattern.
- `src/app/director/sessions/page.tsx` — inline `PageHeader()`
- `src/app/director/curriculum/page.tsx` — inline header
- Most director pages — inline heading divs

**Recommended:** Adopt consistent page header pattern using a div block (not a new component to avoid package overhead):
```tsx
<div>
  <p className="label-xs text-lime mb-1">SECTION LABEL</p>
  <h1 className="text-2xl font-bold text-text-primary">Page Title</h1>
  <p className="text-text-muted text-sm mt-1">Subtitle</p>
</div>
```

---

## Routes Requiring Polish (Priority Order)

1. **Sidebar/Shell** — affects all pages (Sprint 128)
2. **Director Dashboard** `/director` — most visited (Sprint 130)
3. **Players List** `/director/players` — daily use (Sprint 131)
4. **Player Profile** `/director/players/[playerId]` — deep work (Sprint 131)
5. **Sessions** `/director/sessions` + `[sessionId]` (Sprint 133)
6. **Curriculum** `/director/curriculum` (Sprint 132)
7. **Fitness Templates** `/director/fitness/templates` (Sprint 132)
8. **Review Queue** `/director/review` (Sprint 134)
9. **Demo Tour** `/director/demo` (Sprint 130)
10. **Coach pages** `/coach/*` (Sprint 133)
11. **Import/Intake/Onboarding** (Sprint 131)

---

## Safest Central Files to Update

| File | Impact | Risk |
|---|---|---|
| `tailwind.config.ts` | All pages — changes `lime` to cyan | Low — token rename propagates safely |
| `src/app/globals.css` | All pages — base variables, focus states | Low — CSS variables only |
| `src/components/nav/SidebarNav.tsx` | All director pages | Medium — preserve all nav links |
| `src/components/ui/Card.tsx` | All card surfaces | Low — visual only |
| `src/components/ui/MetricCard.tsx` | Dashboard + stats | Low |
| `src/components/ui/StatusBadge.tsx` | Players, sessions, review | Low |
| `src/components/ui/Table.tsx` | Tables everywhere | Low |
| `src/components/ui/Tabs.tsx` | Player profile, curriculum | Low |

---

## Risk Areas

| Risk | Mitigation |
|---|---|
| Tailwind `lime` rename breaks hardcoded hex usage | Check all files for direct `#C8FF00` usage — none found in component code |
| Sidebar route removal | Do not remove any nav links — only update styling |
| Backend query changes | Not required — UI-only sprint |
| Player profile complex 3-col layout | Style conservatively, don't restructure layout |
| Voice component client/server boundary | Only update class strings, not component logic |
| Director layout uses `single<Pick<...>>()` pattern | This is in locked `director/layout.tsx` — do not touch |

---

## Recommended Implementation Order

1. **Sprint 127** — Tailwind tokens + globals.css (propagates instantly)
2. **Sprint 128** — Sidebar + shell (all pages benefit immediately)
3. **Sprint 129** — Shared UI primitives (Card, MetricCard, Table, etc.)
4. **Sprint 130** — Director Dashboard + Demo Tour
5. **Sprint 131** — Players + Player Profile
6. **Sprint 132** — Curriculum + Fitness Templates
7. **Sprint 133** — Sessions + Coach
8. **Sprint 134** — Review Queue + other pages
9. **Sprint 135** — QA pass

---

## Design Tokens to Apply

```css
/* In globals.css / CSS variables */
--bg-app: #030506;
--bg-sidebar: #050708;
--bg-surface: #07090c;
--bg-card: #090c10;
--bg-card-soft: #0d1117;
--border-subtle: rgba(255,255,255,0.06);
--border-strong: rgba(255,255,255,0.12);
--text-primary: #f4f7f8;
--text-secondary: #a3aab4;
--text-muted: #626b76;
--accent-cyan: #11d9df;
--accent-cyan-soft: rgba(17,217,223,0.12);
--accent-green: #52e36f;
--accent-amber: #ffb020;
--accent-red: #ff4d55;
--accent-purple: #b56cff;
```

## How to Avoid Breaking Backend Behavior

1. Never touch files in `src/lib/backend/`, `src/lib/actions/`, `src/lib/supabase/`
2. Never change Server Action function signatures
3. Never convert Server Components to Client Components
4. Only change `className` strings and inline style values
5. Never alter data-fetching logic
6. Run `npx tsc --noEmit` after each sprint
7. Never change form `action` props or button `type` attributes
