# DONNA Highlight Escalation — Sprint 1031

**Date:** 2026-05-31
**Sprint:** 1031

---

## UX problem

The `DonnaHighlightBanner` showed "DONNA is pointing here" but was `pointer-events-none` on the wrapper — the director couldn't click the banner. If they scrolled past the highlighted element, the banner gave no way to get back to it. The text was also passive ("pointing here") rather than actionable.

---

## What changed

1. **Banner is now clickable** — `pointer-events-auto cursor-pointer` on wrapper
2. **Click → scrolls to target** — `scrollToTarget` callback queries `data-donna-focus-id` and calls `scrollIntoView`
3. **Text improved** — "DONNA: [label]" instead of "DONNA is pointing here — [label]"
4. **Reason field shown** — when `target.reason` is set, shown as secondary text on sm+ screens
5. **Dismiss fixed** — `e.stopPropagation()` on dismiss button so clicking X doesn't also trigger scroll
6. **Hover state** — subtle border brightens on hover to signal interactivity

---

## What stays the same

- Auto-dismiss timer unchanged (uses `expiresAt`, default 8s from Sprint 817)
- Teal pulse dot unchanged
- `donna:highlight` event listener unchanged
- `setDonnaFocusTarget` unchanged
- Glow CSS class unchanged

---

## What gets simpler

- Director sees "DONNA: Review Queue" and clicks it → jumps to the element
- No need to know which element was highlighted — the banner IS the navigation shortcut
- Scrolled past the highlight? Just click the banner

---

## What still needs visual QA

- Confirm banner is clickable and cursor shows correctly
- Confirm scrollToTarget fires correctly on click
- Confirm dismiss (X) does not trigger scroll (stopPropagation working)
- Confirm reason field appears only on sm+ screens (hidden on mobile)
