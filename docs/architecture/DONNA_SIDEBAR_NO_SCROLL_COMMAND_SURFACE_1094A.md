# DONNA Sidebar No-Scroll Command Surface — Sprint 1094A

**Date:** 2026-06-01
**Sprint:** 1094A
**Scope:** Layout-only restructure — no backend changes, no logic changes, no migrations.

---

## Problem

The DONNA sidebar required internal scrolling in normal use. The director had to scroll to see
the text input because it sat at the bottom of a long stacked list:
page chips → voice card → response thread → workflow cards → disclosure pills.

A sidebar that forces scrolling to access the input defeats its purpose as a low-friction COO tool.

---

## Previous layout (pre-1094A)

```
FIXED HEADER
FIXED CHIP ROW (3-8 chips, overflow-x-auto)
┌── flex-1 overflow-y-auto ──────────────┐
│  Greeting card                         │
│  DonnaPanelPageChips                   │
│  DonnaVoiceLayer (~220-272px)          │  ← text input inside scrollable area
│    voice button + interim transcript   │
│    heard text display                  │
│    textarea + Send + safety note       │
│    suggestion chips (~80px)            │
│  DonnaPanelResponseRenderer            │
│    cooThread (all turns, max-h-[260])  │
│    God Mode response card              │
│  DonnaWorkflowCards                    │
│  Inline mode responses                 │
│  Context | Suggestions | Actions pills │
│  Dev tools toggle                      │
└────────────────────────────────────────┘
FIXED FOOTER "DONNA drafts. You approve."
```

**Scroll trigger:** DonnaVoiceLayer (~220-272px) + responses + workflow cards easily
exceeded viewport height (panel body ≈ viewport − 168px). With a single DONNA response
card the content stack could reach 600-1000px.

---

## New layout (Sprint 1094A)

```
FIXED HEADER
FIXED CHIP ROW (max 3 visible + "More ↓" toggle)
┌── flex-1 overflow-y-auto ──────────────┐
│  Greeting card (conditional)           │
│  DonnaPanelPageChips                   │
│  DonnaPanelResponseRenderer            │
│    → collapsed: last turn only         │
│    → "History (N earlier) ↑" toggle    │
│    → expanded: max-h-[260] bounded     │
│  DonnaWorkflowCards                    │
│  Inline mode responses                 │
│  Context | Suggestions | Actions pills │
│  Dev tools toggle                      │
└────────────────────────────────────────┘
DOCKED INPUT (shrink-0)                   ← NEW: always visible
  DonnaVoiceLayer (hideChips=true)
    voice button + interim transcript
    textarea + Send + "Nothing executes"
FIXED FOOTER "DONNA drafts. You approve."
```

**Fixed sections total:** header (76px) + chip row (44px) + docked input (~175px) + footer (36px) = **331px**.
At 768px viewport: **437px** for the active surface. One greeting + one response + chips + pills ≈ 210px — fits without scroll.

---

## Changes made

### `src/components/assistant/DonnaAssistantButton.tsx`
- Added `showHistory: boolean` state (default `false`)
- Added `showMoreChips: boolean` state (default `false`)
- Chip row: wrapped chip array in IIFE; slices to 3 visible; "More ↓ / Less ↑" toggle when chip count > 3
- Removed `<DonnaVoiceLayer>` from inside the `flex-1 overflow-y-auto` scrollable div
- Added new `shrink-0` docked section between the scrollable body and the footer; renders `<DonnaVoiceLayer hideChips={true} />`
- Passed `historyVisible={showHistory}` and `onToggleHistory={() => setShowHistory(p => !p)}` to `DonnaPanelResponseRenderer`

### `src/components/assistant/DonnaVoiceLayer.tsx`
- Added `hideChips?: boolean` prop (default `false`)
- When `hideChips=true`, the suggestion chips section is suppressed — chips already exist in the top chip row

### `src/components/donna/DonnaPanelResponseRenderer.tsx`
- Added `historyVisible?: boolean` prop (default `false`)
- Added `onToggleHistory?: () => void` prop
- When `historyVisible=false` and `cooThread.length > 1`: shows only the latest turn plus "History (N earlier) ↑" toggle
- When `historyVisible=true` or `cooThread.length <= 1`: shows full bounded history (existing `max-h-[260px]` behaviour)
- "Hide history ↓" button collapses when history is expanded

---

## What was preserved

| Feature | Status |
|---|---|
| All DONNA backend logic | Unchanged |
| God Mode LLM orchestrator | Unchanged |
| Brian Alpha Sandbox gate | Unchanged |
| Deep Mode gate | Unchanged |
| Voice behaviour (VoiceInputButton, persistent session, auto-start) | Unchanged — only repositioned |
| Token / retrieval logging | Unchanged |
| Retrieval budget caps | Unchanged |
| Deterministic handlers (routeDonnaPrompt, detectAndHandleCommand) | Unchanged |
| Review-first safety language | Preserved |
| Escape key close | Unchanged |
| Minimize / expand | Unchanged |
| Daily brief + attention + recommendation cards | Unchanged (in DonnaWorkflowCards) |
| Context | Suggestions | Actions disclosure pills | Unchanged |
| Dev tools (non-production) | Unchanged, collapsed by default |
| Mobile command bar (DONNADirectorMobileCommandBar) | Unchanged |
| Coach DONNA panel | Unchanged |

---

## Acceptance criteria met

- [x] Default DONNA sidebar fits in viewport without internal scroll on standard desktop height
- [x] Input dock (text + voice + send) always visible — never requires scrolling
- [x] Active surface shows one current response/brief/workflow, not a long stacked feed
- [x] Quick chips capped at max 3 visible + More toggle
- [x] Conversation history collapsed by default; accessible via "History (N)" toggle
- [x] Suggestion chips not duplicated (suppressed in docked VoiceLayer)
- [x] Dev tools remain collapsed by default
- [x] TypeScript: clean (0 errors)
