# DONNA Sidebar Simplification — Sprint 1040

**Sprint:** 1040 — DONNA Sidebar 10/10 Simplification Pass V1
**Date:** 2026-05-31
**File changed:** `src/components/assistant/DonnaAssistantButton.tsx`

---

## Audit: full sidebar render tree (before Sprint 1040)

### Fixed (above scroll)
1. Header — DONNA name, "Review-first" badge, priority status badge, subtitle, page context label, review queue badge, minimize/close
2. Fixed tab chips row — 3–4 role-specific chips, always visible regardless of route

### Scrollable body
3. Idle presence card (3-min inactivity)
4. Page-actions card (`showPageActions`) — with verbatim `pathname` text displayed
5. Greeting card — DONNA label + greeting text + follow-up + page context + priority hint
6. `DonnaPanelPageChips` — route-aware highlight+prompt chips (registered per route in `donnaPageChipRegistry`)
7. `DonnaVoiceLayer` — voice input + textarea + **"DONNA says" card** (truncated repeat of `commandResponse.message`)
8. `DonnaPanelResponseRenderer` — unified conversation thread (cooThread + God Mode + commandResponse bubbles)
9. `DonnaWorkflowCards` — draft cards, daily brief, attention, recommendations, communication/attendance drafts, context summary
10. Action preview card, Guide me card, Explain card, Find card, Template mode, Multi-step plan, Guided task mode (all conditional)
11. Developer tools (non-production only)

---

## Problems identified

### Problem 1 — "DONNA says" card duplicates DonnaPanelResponseRenderer

`DonnaVoiceLayer` received a `donnaLastResponse` prop (added Sprint 694: "COO conversation context above input"). It rendered a truncated "DONNA says" card above the input.

After Sprint 1028 added `DonnaPanelResponseRenderer` as the unified response surface, the same `commandResponse.message` appeared in **three places**:
1. "DONNA says" card above the input (DonnaVoiceLayer)
2. DonnaBubble in DonnaPanelResponseRenderer (below input)
3. Workflow card in DonnaWorkflowCards

The suppression logic in DonnaAssistantButton (Sprint 750) only prevented case 3 when the cooThread already had the same message — it never suppressed case 1. Directors saw the same response twice: once above the input, once in the thread.

### Problem 2 — Two chip rows on most director routes

The fixed tab chips row (always rendered: 3–4 generic chips) and `DonnaPanelPageChips` (route-specific, from registry) were both visible simultaneously on routes with registered chips. On the director dashboard, up to 8 chips appeared above the fold: 3 generic + 5 route-specific.

Registered routes: `/director`, `/director/curriculum`, `/director/class-templates`, `/director/class-templates/[id]`, `/director/review`, `/director/players`, `/director/players/[id]`, `/director/sessions`, `/director/sessions/[id]`, `/director/onboarding`, `/director/donna`, `/coach`, `/coach/sessions/[id]`.

### Problem 3 — Verbatim pathname in showPageActions card

The "What DONNA can do here" card displayed: "On `/director/curriculum/builder`" — a raw URL visible to the director. This is developer-facing information, not user-facing.

---

## Changes made

### 1. `donnaLastResponse={null}` passed to DonnaVoiceLayer

**Before:**
```tsx
donnaLastResponse={
  cooThread.length > 0 && commandResponse !== null &&
  cooThread[cooThread.length - 1]?.donna === commandResponse.message
    ? null
    : (commandResponse?.message ?? null)
}
```

**After:**
```tsx
donnaLastResponse={null}
```

`DonnaPanelResponseRenderer` (Sprint 1028) is the canonical response surface. The "DONNA says" card above the input is now permanently suppressed. Voice, input, chips, and workflow cards are unaffected.

### 2. Fixed tab chips hidden when DonnaPanelPageChips covers the route

**Before:** Fixed tab chips rendered unconditionally.

**After:** Fixed tab chips hidden when `getChipsForRoute(pathname).length > 0` (route has registered page chips), except on player profile pages (`/director/players/[uuid]`) where the data-driven chips must always show.

**Fallback preserved:** Routes without page chips (e.g. `/director/today`, `/director/kpi`, `/director/fitness`) continue to show the generic director chips as before.

### 3. Verbatim pathname removed from showPageActions card

The `<p>On {pathname}</p>` line was removed from the "What DONNA can do here" card. The card still shows available actions and the "Ask DONNA" prompt. The URL is no longer displayed to directors.

---

## What was preserved

- Voice input (VoiceInputButton, interim transcript, pending voice answer, confirm/retry)
- All chip types: highlight, prompt, brief — untouched
- God Mode submit flow (`runDonnaOrchestratorAction`) — untouched
- DonnaPanelResponseRenderer (cooThread + godModeOutput + commandResponse bubbles)
- DonnaWorkflowCards (all draft cards, daily brief, attention, recommendations, etc.)
- Guided highlight escalation (DonnaPanelPageChips)
- Fallback generic chips for routes without page chips
- Player-profile data-driven chips (preserved via `isPlayerProfilePage` guard)
- Coach chips on session pages — preserved via DonnaPanelPageChips for `/coach/sessions/`

---

## Target sidebar after Sprint 1040

**First open:**
- Header (DONNA name + status)
- Greeting card (first open only, suppressed when thread active)
- 3–5 page-aware chips (DonnaPanelPageChips on registered routes; fallback generic chips on others)
- Input area (DonnaVoiceLayer — voice + type — no "DONNA says" duplication)

**After a question:**
- Header
- Input area
- Response thread (DonnaPanelResponseRenderer)
- Workflow cards (DonnaWorkflowCards)

---

## Follow-up items (not in Sprint 1040)

- **`showPageActions` card**: The "DONNA says" label inside the card header is `text-xs uppercase ... text-lime` — could be softened to "Page context" in a future polish pass.
- **`showContextSection` / `showSuggestionsSection`**: The auto-expand behavior (Sprints 823–823) still auto-expands context and suggestions sections — a future sprint could review whether these should default collapsed.
- **Player-profile fixed chips**: Currently data-driven from `donnaSession.playerProfileContext`. Future sprint: migrate to `donnaPageChipRegistry` with live context injection so all chips live in one system.
