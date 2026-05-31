# DONNA Persistent Session Toggle — Sprint 1029

**Date:** 2026-05-31
**Sprint:** 1029

---

## UX problem

The DONNA floating button opened the panel but clicking it again when the panel was already open did nothing. To close DONNA, the director had to find and click the X in the panel header. This made the button feel "sticky" — once open, no obvious way to dismiss without targeting a small header control.

---

## What changed

**One-line toggle addition:**

When the panel is open and director clicks the DONNA button → `minimizePanel()` instead of no-op.

Toggle states:
- Closed → click → Open (full session starts)
- Open → click → Minimized (session preserved, lime dot on button)
- Minimized → click → Open (session resumes)

**Aria-label and title updates** (three states):
- Open: "Minimize — session preserved"
- Minimized: "Resume DONNA session"
- Closed: "Ask DONNA"

---

## Why minimize, not close?

Minimize preserves the conversation thread (cooThread, godModeHistory, draft state). Close would clear everything. The goal says "stays active across routes" — minimizing allows the director to navigate freely and return to their conversation. The X button in the panel header still closes (ends session).

---

## What was already there (Sprint 918)

- `minimizePanel()` and `expandPanel()` already existed
- Lime dot on button when minimized already existed  
- SessionStorage sync for `pannelMinimized` state already existed
- The minimized state already survived route navigation

Sprint 1029 only adds the button → minimize trigger and improves the accessibility labels.

---

## What gets simpler

- One button, one behavior: click to toggle visibility
- No need to search for the X button to dismiss DONNA
- Minimize state is more discoverable (button click → minimize, not just the − button in header)
