# QA Checklist — DONNA Mobile Panel Polish (Sprint 1032)

**Date:** 2026-05-31
**Sprint:** 1032

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes

---

## iOS zoom fix (requires iPhone/iPad device or simulator)

- [ ] Tap DONNA textarea → page does NOT zoom (font ≥ 16px prevents zoom)
- [ ] On sm+ screens (≥640px): textarea shows compact 12px font (text-xs applied)
- [ ] On mobile (<640px): textarea shows 16px font (text-base applied)

---

## Overscroll fix (requires mobile device)

- [ ] Scroll to top of DONNA panel → pull-to-refresh does NOT trigger
- [ ] Scroll to bottom of DONNA panel → overscroll bounce stays within panel
- [ ] Normal page scroll (outside panel) still works correctly

---

## Regression checklist

- [ ] Textarea still accepts input correctly
- [ ] Enter key still submits command (onKeyDown handler unchanged)
- [ ] Voice layer components unchanged except textarea class
- [ ] Panel layout unchanged (no height/width changes)
- [ ] `text-xs` still used for placeholder (placeholder styling unchanged)
