# Design System Consistency Notes

> Sprint 459 — Design System Audit V1
> See also: `tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/index.ts`

---

## Source of Truth

The authoritative design system is:
- `tailwind.config.ts` — color tokens and spacing
- `src/app/globals.css` — CSS custom properties
- `src/components/ui/index.ts` — available UI components

**Never use:** `Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/DESIGN_SYSTEM.md`
That document describes a different version of the product and does not match the implemented system.

---

## Color Tokens

| Token | Value | Use |
|---|---|---|
| `bg-base` | #0A0A0A | Page background |
| `bg-surface` | #111111 | Card background |
| `bg-surface-raised` | #1A1A1A | Elevated card |
| `border` | #222222 | Default border |
| `text-lime` | #C8FF00 | Primary accent, active states, key numbers |
| `text-primary` | #FFFFFF | Headlines |
| `text-secondary` | #AAAAAA | Body text |
| `text-muted` | #555555 | Labels, meta |
| `status-red` | #FF3B30 | Error, urgent |
| `status-orange` | #FF9500 | Warning |
| `status-green` | #30D158 | Success |
| `status-blue` | #0A84FF | Info |

---

## Typography Rules

| Use | Class |
|---|---|
| Page title | `text-xl font-semibold text-text-primary` |
| Section title | `text-sm font-semibold text-text-secondary uppercase tracking-wide` |
| Label / tag | `label-xs` (= `text-[11px] uppercase tracking-widest text-text-muted`) |
| Key number | `font-mono text-lime` |
| Body | `text-sm text-text-secondary` |
| Caption | `text-xs text-text-muted` |

---

## Component Checklist

### Cards

Always use `<Card>` from `src/components/ui`. Never raw `<div>` for card surfaces.

```tsx
<Card>           // bg-surface border border-border rounded-xl p-4
<Card hover>     // adds lime border glow on hover
<CardHeader>     // title + optional action slot
<CardContent>    // body
<CardFooter>     // actions row
```

### Buttons

| Variant | Class | Use |
|---|---|---|
| Primary | `btn-lime` | Main action |
| Secondary | `btn-ghost` | Cancel, secondary |
| Danger | `btn-danger` | Destructive |

Never use raw `<button>` for primary actions without one of these classes.

### Status Pills / Badges

Use `<StatusBadge>` from `src/components/ui`.

Standard status values: `pending`, `approved`, `rejected`, `active`, `completed`, `warning`, `error`

### Tables

Use `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>` from `src/components/ui`.

Never use raw `<table>` tags.

### Forms

Form field standard:
```tsx
<label className="label-xs">Field Name</label>
<input className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50" />
```

Error state: `border-status-red` + error message in `text-xs text-status-red mt-1`

### Modals

Use `<Modal>` from `src/components/ui`. Never build custom dialog overlays.

### Empty States

Use `<EmptyState>` from `src/components/ui`.
Config values from `src/lib/ux/emptyStateConfigs.ts`.

### Skeleton Loaders

Use `<LoadingSkeleton>` or `<SkeletonCard>` from `src/components/ui`.

---

## Spacing System

Content padding: `p-4` (mobile), `p-6` (desktop)
Card internal: `p-4` (default card padding)
Section gap: `space-y-4` (default), `space-y-6` (between major sections)
Grid gap: `gap-4`

---

## Icon Library

Icons: `lucide-react` only. No other icon sets.

Standard sizes: `w-4 h-4` (inline), `w-5 h-5` (list/nav), `w-6 h-6` (card header)

---

## Inconsistencies Found (Sprint 459 Audit)

| Location | Issue | Fix |
|---|---|---|
| Some coach pages | Raw divs used as cards | Replace with `<Card>` on next touch |
| Some status labels | Hardcoded color classes instead of status tokens | Use `<StatusBadge>` |
| Some form inputs | Missing focus:border-lime/50 | Apply on next touch |
| BottomTabBar | Missing `aria-label` on nav element | Add in Sprint 460 |
| Some empty sections | No `<EmptyState>` — just blank space | Apply empty state configs |

These are tracked for future improvement. No changes made in this sprint to avoid scope creep.

---

## Approval Card Standard

Every approval card must show:
1. Action type badge (StatusBadge)
2. Who is affected (player/coach name)
3. DONNA's reasoning (short)
4. Risk level indicator
5. Approve button (btn-lime)
6. Reject button (btn-danger)
7. "Review details" expansion

Cards must never truncate the affected player name silently.
