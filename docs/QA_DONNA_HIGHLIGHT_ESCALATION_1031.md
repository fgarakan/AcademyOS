# QA Checklist — DONNA Highlight Escalation (Sprint 1031)

**Date:** 2026-05-31
**Sprint:** 1031

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `scrollToTarget` uses `useCallback` with `[active]` dependency

---

## Banner interactivity (requires browser)

- [ ] Banner cursor shows pointer (cursor-pointer)
- [ ] Clicking banner body calls scrollToTarget (element scrolls into view)
- [ ] Clicking dismiss button (X) does NOT trigger scrollToTarget (stopPropagation working)
- [ ] Banner hover state: border brightens on hover
- [ ] Banner still auto-dismisses after expiresAt

---

## Text display

- [ ] When `target.label` set: shows "DONNA: [label]" (not "DONNA is pointing here")
- [ ] When no label: shows "DONNA is pointing here" (fallback)
- [ ] When `target.reason` set: shows reason on sm+ screens, hidden on mobile

---

## Sprint 817 regression checklist

- [ ] `triggerHighlight()` behavior unchanged (pathname-change + donna:highlight event)
- [ ] Glow CSS class (`donna-focus-ring`) still applied to target element
- [ ] Auto-dismiss via timeout still works
- [ ] Manual dismiss via X still clears target and sets active to null
- [ ] `pointer-events-none` REMOVED from wrapper (was there before, now removed)
