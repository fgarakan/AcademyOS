# QA — DONNA Sidebar Simplification — Sprint 1040

**Sprint:** 1040
**Date:** 2026-05-31
**File changed:** `src/components/assistant/DonnaAssistantButton.tsx`

---

## Removed surfaces — confirm absent

- [ ] **"DONNA says" card** does NOT appear above the input area after asking DONNA a question
- [ ] The same DONNA response does NOT appear in two places simultaneously
- [ ] The verbatim URL **("On /director/...")** does NOT appear in the "What DONNA can do here" card

---

## Chip deduplication — confirm single chip row per route

### Routes with DonnaPanelPageChips (should show page chips ONLY)

- [ ] `/director` — shows DonnaPanelPageChips (Brief me today, highlight chips); no generic "What do I need to do today?" row above
- [ ] `/director/curriculum` — shows DonnaPanelPageChips; no generic row
- [ ] `/director/class-templates` — shows DonnaPanelPageChips; no generic row
- [ ] `/director/class-templates/[id]` — shows DonnaPanelPageChips; no generic row
- [ ] `/director/review` — shows DonnaPanelPageChips; no generic row
- [ ] `/director/players` — shows DonnaPanelPageChips; no generic row
- [ ] `/director/sessions` — shows DonnaPanelPageChips; no generic row
- [ ] `/coach` — shows DonnaPanelPageChips; no generic coach chips row
- [ ] `/coach/sessions/[id]` — shows DonnaPanelPageChips; no generic coach chips row

### Player profile exception — should show BOTH rows (data-driven chips preserved)

- [ ] `/director/players/[uuid]` — fixed tab chips row (data-driven: "View: [priority]", "Show priorities (N)", "Open player updates") IS visible alongside DonnaPanelPageChips

### Routes without page chips (generic chips preserved as fallback)

- [ ] `/director/today` — generic director chips show ("What do I need to do today?", etc.)
- [ ] `/director/kpi` — generic director chips show
- [ ] `/director/fitness/templates` — generic director chips show
- [ ] `/director/class-templates/new` — generic director chips show

---

## Preserved functionality — confirm working

### Voice
- [ ] Mic button visible in DonnaVoiceLayer input area
- [ ] Voice listening activates on click
- [ ] Interim transcript displays while listening
- [ ] Transcript confirmed and submitted via "Use this" button
- [ ] Voice permission error shows "Voice is unavailable. You can type, or retry microphone."
- [ ] Pending voice answer editable before confirming

### Input and submit
- [ ] Textarea accepts typed input
- [ ] Submit sends prompt into DONNA conversation
- [ ] Prompt suggestion chips visible and clickable
- [ ] Guided task question spotlight shows when guided_task mode active

### Response rendering
- [ ] `DonnaPanelResponseRenderer` shows user + DONNA bubbles in thread
- [ ] God Mode loading indicator ("Thinking…") shows during orchestrator call
- [ ] God Mode response card renders with navigate + highlight actions
- [ ] `DonnaWorkflowCards` renders commandResponse card when no cooThread turn matches

### DonnaPanelPageChips
- [ ] Highlight chips trigger teal glow on `data-donna-focus-id` targets
- [ ] Escalated highlight (second click) triggers warning pulse
- [ ] Prompt chips route through handleCommandSubmit
- [ ] Brief chip triggers handleFetchDailyBrief

### Guided highlights
- [ ] `DonnaHighlightBanner` teal glow still fires when DONNA navigates + targets an element
- [ ] God Mode `onGodModeHighlight` callback still wired correctly

### Fallback behavior
- [ ] Routes without registered chips still show generic director chips
- [ ] Panel opens correctly after `panelMinimized` state
- [ ] Panel closes on Escape key
- [ ] Panel state persists across route changes (sessionStorage)
- [ ] Idle presence card appears after 3 min of no interaction

### TypeScript
- [ ] `npx tsc --noEmit` passes with no new errors
