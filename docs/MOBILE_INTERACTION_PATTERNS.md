# Mobile Interaction Patterns

> Sprint 454 — AcademyOS Mobile UX System V1
> See also: `src/lib/ux/mobilePatterns.ts`, `docs/RESPONSIVE_SHELL_PATTERNS.md`

---

## Principles

**Coach mobile is a tool, not a dashboard.** It must work with one hand, in a gym, under pressure.

**Parent mobile is simple by design.** Reduce cognitive load. Never overwhelm. Always encouraging.

**Player mobile is motivating.** It should feel like a progress game, not a report card.

---

## Tap Target Standards

All interactive elements must meet minimum tap targets:

| Standard | Size |
|---|---|
| Absolute minimum | 24×24px |
| WCAG preferred | 44×44px |
| Bottom tab items | py-3 (≥48px touch zone) |
| Card row items | min-h-[48px] |
| Primary buttons | Full width, min-h-[48px] |

See `TAP_TARGET` constants in `src/lib/ux/mobilePatterns.ts`.

---

## Bottom Sheet Pattern

Used for: attendance marking, DONNA quick ask, quick capture, approval review.

Anatomy:
1. Drag handle — centered, 32px wide, 4px tall, rounded
2. Title row — left-aligned, medium weight
3. Content — scrollable if tall
4. Sticky footer — primary action + optional secondary

Config:
- Default max height: 85vh
- Always dismissible by backdrop tap or drag down
- Never taller than 90vh (leaves room for system chrome)

---

## Floating Action Button

Coach home: voice capture (lime background)
Coach session: mark attendance (status-green background)
Director mobile: ask DONNA (lime background)

Rules:
- Fixed position: bottom 24 right 4 (above bottom tab bar)
- Size: 56×56px (w-14 h-14)
- Shadow: shadow-lg
- Always accessible via keyboard

---

## Mobile Form Pattern

Full-screen forms:
- Fixed header with back arrow + title
- Scrollable body with field groups
- Sticky footer with save + cancel

Large inputs:
- `min-h-[48px]` for text fields
- `min-h-[100px]` for textarea
- Border turns lime on focus

---

## Mobile Quick Actions

Available via: FAB → bottom sheet, or DONNA quick ask.

Priority actions per role:

**Coach:** Start session → Mark attendance → Quick capture → Start recap → Ask DONNA
**Player:** See missions → See progress → Ask coach question
**Parent:** See child summary → See updates

---

## Voice Button

- Large, round, lime
- States: idle → recording (pulsing ring) → transcribing (spinner) → done (checkmark)
- Always shows time elapsed while recording
- Shows transcript preview before confirming
- Always offers "type instead" fallback

---

## Mobile Approval Cards (Director)

Card stack pattern for mobile:
- Full width, swipeable
- Approve = right swipe or large green button
- Reject = left swipe or large red button
- Details = tap to expand
- Always shows: action type, affected player, risk level, approve/reject

---

## Sticky Save Bars

Used on: session forms, recap forms, curriculum idea forms.

Pattern:
- `sticky bottom-0` with `bg-surface border-t border-border`
- Primary button (full width): btn-lime
- Secondary (cancel/save draft): btn-ghost

Draft status indicator:
- "Unsaved changes" → saving → "Saved" → error
