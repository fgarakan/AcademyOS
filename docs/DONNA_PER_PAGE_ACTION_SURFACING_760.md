# DONNA Per-Page Action Surfacing V1
**Sprint 760 — 2026-05-24**

---

## Goal

Make DONNA visibly page-aware by surfacing role-safe available actions based on the current route/page.

---

## What Was Built

### 1. Director/Coach — DonnaAssistantButton.tsx

**New state:** `showPageActions: boolean`

**New helpers:**
- `getSafetyLabel(safetyClass)` — maps UIActionSafetyClass to human-readable label: "✓ Safe", "Draft → Review", "Director Approval Required"
- `handleShowPageActions()` — toggles `showPageActions`, clears `commandResponse`

**New chip in tab bar:** "What can DONNA do here?" — appears for both director and coach roles, toggles the page-actions panel

**Page-aware action panel (rendered in scrollable body, first item when active):**
- Calls `getAvailableActionsForContext(uiActionRole, pathname)` — max 6 actions
- Displays: action display name + color-coded safety label
  - Green: always_safe / safe_with_context → "✓ Safe"
  - Orange: draft_to_review → "Draft → Review"
  - Red: director_approval → "Director Approval Required"
- If no actions registered for this page: honest fallback message
- Pure UI layer — no DB calls, no AI calls

**Import updates:**
- Added `getAvailableActionsForContext` from `donnaUIActionDispatcher`
- Added `getOperatorStep` from `donnaUIGuidedOperators` (for Sprint 761)
- Added `UIActionSafetyClass` type from `donnaUIActionRegistry`

### 2. Player Portal — src/app/player/ask-donna/page.tsx

**New chip (first in array):**
- id: `what-can-donna-do`
- label: "What can DONNA do here?"
- Response: explains navigation guidance (missions, skill path, level-up, competition path, fitness path, practice, wins) + explicitly states official level changes, coach communications, program changes go through coach/director approval

### 3. Parent Portal — src/app/parent/ask-donna/page.tsx

**New chip (first in array):**
- id: `what-can-donna-do`
- label: "What can DONNA do here?"
- Response: explains navigation guidance (child progress, wins & milestones, coach updates) + explicitly states level changes, program changes, coach communications go through director approval + notes DONNA never shares private coaching notes

---

## Safety Invariants

- Never exposes actions the current role cannot perform (gated by `getAvailableActionsForContext`)
- Maximum 6 actions shown to keep it compact
- All displayed actions are read-only capability descriptions — no execution
- Player and parent responses explicitly state what requires approval

---

## Files Modified

- `src/components/assistant/DonnaAssistantButton.tsx`
- `src/app/player/ask-donna/page.tsx`
- `src/app/parent/ask-donna/page.tsx`

## Files Created

- `docs/DONNA_PER_PAGE_ACTION_SURFACING_760.md` (this file)
