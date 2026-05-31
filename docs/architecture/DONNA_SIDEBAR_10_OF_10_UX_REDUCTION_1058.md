# DONNA Sidebar 10/10 UX Reduction — Sprint 1058

**Date:** 2026-05-31
**Status:** Implemented

---

## Problem

Post-Sprint 1057, the DONNA sidebar still rendered too many simultaneous surfaces on first open. Live screenshots showed: greeting card, two chip rows, voice card with a third chip row, automatic context section expansion, automatic recommendations expansion, a duplicate review-queue notification card, coach quick-action buttons, and (in development) fully open developer tools. The cumulative effect was a stack of modules rather than a single assistant surface.

---

## Before — Visible on First Open

| Section | Trigger | Noise level |
|---|---|---|
| Header (name, status badge, page label) | Always | ✓ Keep |
| Tab chip row (3 chips) | Always, if no page chips | ✓ Keep |
| Greeting card — text only | `showGreeting` | ✓ Keep |
| Greeting card — coach quick-action buttons (3) | `role=coach`, not on session page | ✗ Removed |
| DonnaPanelPageChips | Route has chips | ✓ Keep |
| DonnaVoiceLayer (input + mic + chips) | Always | ✓ Keep |
| commandResponse card: "You have X items waiting…" | Review queue auto-fetch on panel open | ✗ Removed |
| Context section (auto-expanded) | `useEffect([contextSummary])` | ✗ Removed auto-expand |
| Suggestions/Recommendations section (auto-expanded) | `useEffect([suggestions, recommendationSet])` | ✗ Removed auto-expand |
| Disclosure bar (Context \| Suggestions \| Actions pills) | Always | ✓ Keep |
| DonnaDeveloperTools (fully open) | `NODE_ENV !== 'production'` | ✗ Now collapsed |

---

## After — Visible on First Open

| Section | Trigger | Status |
|---|---|---|
| Header | Always | ✓ |
| Tab chip row or page chips (3–5 chips max) | Route-aware | ✓ |
| Greeting card — short greeting text only | `showGreeting` | ✓ |
| DonnaPanelPageChips | Route has chips | ✓ |
| DonnaVoiceLayer (input + mic) | Always | ✓ |
| Disclosure bar (Context \| Suggestions \| Actions) | Always, all collapsed | ✓ |
| `Dev tools ↓` toggle | Non-production only | ✓ (collapsed) |

---

## Changes Made

### 1. Removed Context auto-expand (`useEffect([contextSummary])`)

Previously, when `handleContextSummary()` fired on panel open (Sprint 856 auto-fetch), setting `contextSummary` triggered `setShowContextSection(true)`. This caused the teal Context section to appear without user intent. The context is still fetched and the Context pill still shows a dot indicator when data is available. Users click the pill to see it.

### 2. Removed Suggestions auto-expand (`useEffect([suggestions, recommendationSet])`)

Previously, when recommendations populated from the review queue signal, `setShowSuggestionsSection(true)` fired automatically. This caused the recommendations block to appear without user intent. Suggestions are still computed and the Suggestions pill shows a dot indicator. Users click the pill to see them.

### 3. Removed review queue commandResponse card on first open

On every panel open, the review queue auto-fetch set a `commandResponse` card: "You have X items waiting for your review." The header's `DonnaReviewQueueBadge` already shows this count prominently. The card was duplicate noise. The badge count is still set; the card is no longer set. When the director explicitly asks DONNA about the review queue (voice or text), the normal response path still surfaces the card.

### 4. Removed coach quick-action buttons from greeting card

The greeting card contained a block of 3 action buttons for coaches not on a session page: "Capture a player note", "What needs attention today?", "Go to my sessions". These duplicated the tab chips ("Player Notes", "What can DONNA do here?") and the text input. Removed. Coach tab chips remain unchanged.

### 5. Collapsed DonnaDeveloperTools by default

Previously the full developer tools section was always rendered in non-production. Added `showDevTools` state (default `false`) and a small `Dev tools ↓` toggle button. Tools only render when toggled open.

---

## Preserved

- One-click voice activation (Sprint 1057): `getUserMedia` pre-auth in click handler, `autoStart` prop chain — all unchanged
- Text input and God Mode submit — unchanged
- Response cards (COO thread, God Mode) — unchanged, gated on conversation state
- Context / Suggestions / Actions disclosure pills — unchanged, all still present and clickable
- Review queue badge in header — still shows count
- Workflow cards (drafts, attendance, daily brief, attention) — all still render when explicitly triggered
- All safety rules, `proposed_actions` pipeline, RLS — untouched
- No schema or migration changes
