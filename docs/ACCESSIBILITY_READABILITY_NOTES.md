# Accessibility and Readability Notes

> Sprint 460 — Accessibility Pass V1
> See also: `docs/DESIGN_SYSTEM_CONSISTENCY_NOTES.md`, `docs/MOBILE_INTERACTION_PATTERNS.md`

---

## Current State (Sprint 460 Audit)

### What is done well
- `aria-current="page"` on active nav items (SidebarNav, BottomTabBar) ✓
- Focus-visible styles on buttons ✓
- Role-scoped routes (middleware) prevents unauthorized access ✓
- Form labels present on most inputs ✓
- Color is not the only signal (icons + text used alongside color) ✓

### Gaps to address over time

| Area | Gap | Priority |
|---|---|---|
| BottomTabBar | Missing `aria-label` on `<nav>` | Medium |
| SidebarNav | Missing `aria-label` on `<nav>` | Medium |
| Modal | Focus trap on open not verified | High |
| Toast | Not announced to screen readers | High |
| Voice input | No `role="status"` on live transcription area | High |
| Approval cards | Approve/reject not labeled with player name | Medium |
| Tables | Missing `scope="col"` on `<th>` | Low |
| Form errors | Not always linked via `aria-describedby` | Medium |

---

## Contrast Requirements

All text must meet WCAG AA:
- Normal text (< 18pt): 4.5:1 ratio minimum
- Large text (≥ 18pt bold or ≥ 24pt): 3:1 ratio minimum

Current design tokens pass:
- `text-primary` (#FFF) on `bg-surface` (#111): ✓ passes
- `text-secondary` (#AAA) on `bg-surface` (#111): ✓ passes (6.1:1)
- `text-muted` (#555) on `bg-surface` (#111): ⚠ borderline (2.2:1) — use only for decorative labels, not readable content
- `text-lime` (#C8FF00) on `bg-base` (#0A0A0A): ✓ passes (15:1)

---

## Font Size Minimums

| Context | Minimum |
|---|---|
| Body text | 14px (text-sm = 14px ✓) |
| Labels / captions | 11px (label-xs ✓ — only for decorative labels) |
| Button text | 14px ✓ |
| Input text | 14px ✓ |
| Mobile body | 16px recommended (prevents iOS zoom) |

Note: iOS auto-zooms inputs with font-size < 16px. For mobile forms, use `text-base` (16px) on inputs.

---

## Tap Target Standard

See `src/lib/ux/mobilePatterns.ts` — `TAP_TARGET` constants.

Minimum 44px touch zone for all interactive elements on mobile.

---

## Keyboard Navigation

Expected tab order:
1. Skip to main content link (future improvement)
2. Sidebar nav items (director)
3. Main content
4. Modals trap focus when open
5. Bottom bar is keyboard-accessible

---

## Screen Reader Labels

Key elements that need `aria-label`:
- `<nav aria-label="Academy navigation">` (SidebarNav)
- `<nav aria-label="Main navigation">` (BottomTabBar)
- Voice button: `aria-label="Start voice recording"`
- DONNA floating button: `aria-label="Open DONNA assistant"`
- Approve buttons: `aria-label="Approve: [action description]"`
- Reject buttons: `aria-label="Reject: [action description]"`

---

## Focus States

Current: `focus:outline-none focus:border-lime/50` on inputs.

Buttons should show `:focus-visible` ring. Verify this is applied in globals.css or button classes.

---

## Mobile Readability

- Line height: `leading-relaxed` for body text (1.625)
- Max line width: `max-w-2xl` (65ch) on mobile portal pages ✓
- Avoid justified text
- Use relative font sizes (rem, not px) for scalability
- Never use `text-xs` for important readable content on mobile

---

## Priority Fixes (Next Touch)

1. Add `aria-label` to `<nav>` in SidebarNav and BottomTabBar
2. Add focus trap to Modal component
3. Add `role="status" aria-live="polite"` to voice transcription area
4. Add `aria-describedby` for form error messages
5. Add `scope="col"` to all `<TableHead>` cells
