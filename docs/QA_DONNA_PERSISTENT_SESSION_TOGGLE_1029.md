# QA Checklist — DONNA Persistent Session Toggle (Sprint 1029)

**Date:** 2026-05-31
**Sprint:** 1029

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `minimizePanel` is called (not undefined) in the new onClick branch

---

## Toggle behavior (requires browser)

- [ ] Panel closed → click button → panel opens
- [ ] Panel open → click button → panel minimizes (lime dot appears on button)
- [ ] Panel minimized (lime dot) → click button → panel expands (resumes session)
- [ ] Conversation thread preserved through open → minimize → expand cycle
- [ ] godModeHistory preserved through minimize/expand
- [ ] cooThread preserved through minimize/expand

---

## X button still works

- [ ] X button in panel header still calls `closePanel()` (ends session, clears thread)
- [ ] Minus (−) button in panel header still calls `minimizePanel()`
- [ ] X and − are not affected by Sprint 1029

---

## Accessibility

- [ ] Button title shows "Minimize — session preserved" when panel is open
- [ ] Button title shows "Resume DONNA session" when panel is minimized
- [ ] Button title shows "Ask DONNA" when panel is closed
- [ ] aria-label matches title in all three states

---

## Session persistence (cross-route)

- [ ] Minimize, then navigate to /director/review → lime dot still visible
- [ ] Click lime dot after navigation → panel reopens with previous thread
- [ ] Panel open, navigate to /director/players → panel stays open (SessionStorage sync intact)

---

## Sprint 918 regression

- [ ] `minimizePanel` and `expandPanel` from DonnaSessionContext unchanged
- [ ] Lime dot still appears when `panelMinimized === true`
- [ ] SessionStorage keys `donnaPanelOpen` and `donnaPanelMinimized` still sync correctly
