# DONNA Panel Simplification + Premium Response UI — Sprint 1025

**Date:** 2026-05-31
**Sprint:** 1025
**Status:** Component built — wiring in Sprint 1026

---

## Problem

After Sprint 1011, the DONNA panel renders three separate response areas:
1. `cooThread` — COO conversational thread (premium bubbles)
2. `commandResponse` — inline fallback/error card (in DonnaWorkflowCards)
3. `godModeOutput` — DonnaResponseCard (after DonnaWorkflowCards)
4. Plus: loading indicator (isGodModeLoading)

These are scattered through 5000+ lines of DonnaAssistantButton and rendered in separate JSX sections. The user sees a fragmented experience.

---

## Solution: `DonnaPanelResponseRenderer`

A single component that renders all DONNA responses in one unified area.

### Render order

1. **COO thread bubbles** — existing premium bubble design; last 5 turns; auto-scrolls
2. **Inline command response** — simple answers, errors; same bubble design as COO
3. **God Mode loading** — Loader2 spinner + "Thinking…" (inline, not floating)
4. **God Mode response card** — DonnaResponseCard with full feature set

### Key improvements

- Single scroll area for all DONNA responses
- Loading indicator is inline in the thread (not a separate section above the input)
- commandResponse uses same bubble style as cooThread (not a different card design)
- DonnaResponseCard is the "premium" terminal state for every substantive query

---

## V1 limitations

- Not yet wired to DonnaAssistantButton — Sprint 1026 wires it
- cooThread and OrchestratorTurn types are not yet unified (different field shapes)
- commandResponse still uses legacy `{ message, type, label }` format
- Sprint 1026 will swap DonnaAssistantButton's three response areas with this component

---

## Sprint 1026 wiring plan

Replace in DonnaAssistantButton.tsx:
- Lines ~4194-4241 (cooThread section)
- Lines ~4248-4301 (DonnaWorkflowCards commandResponse portion)  
- Lines ~4302-4332 (God Mode loading + DonnaResponseCard)

With:
```jsx
<DonnaPanelResponseRenderer
  cooThread={cooThread}
  godModeOutput={godModeOutput}
  isGodModeLoading={isGodModeLoading}
  commandResponse={commandResponse}
  suppressCommandResponseCard={suppressCommandResponseCard}
  onGodModeNavigate={...}
  onGodModeHighlight={...}
/>
```
