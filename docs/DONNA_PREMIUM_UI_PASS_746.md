# DONNA Premium UI — Pass 746
**Sprint 746 — 2026-05-24**

---

## Purpose

This document records what was changed in Sprint 746 as the second pass of the DONNA sidebar panel premium UI improvement sequence (begun in Sprint 745). It updates the scoring from `docs/DONNA_PREMIUM_UI_PERSISTENCE_AUDIT_745.md`.

---

## Sprint 746 Goals (All Delivered)

| Goal | Status |
|---|---|
| Collapse mode buttons behind "More options" toggle | ✅ Done |
| Suppress greeting card when conversation/DONNA says is active | ✅ Done |
| Convert "Ask about this page" from large button to compact chip | ✅ Done |
| Keep input reachable without scrolling (default state) | ✅ Improved |
| DONNA Godmode intelligence untouched | ✅ Verified |

---

## Part 1 — What Was Changed

### 1. Mode buttons collapsed (`DonnaAssistantButton.tsx`)

**Before:** The "What would you like?" section displayed 5+ full-height mode buttons in the default panel view, consuming ~300px of scroll before the input bar.

**After:**
- **Default state:** The 5 MODES buttons are hidden behind a single compact `More options ▾` chip.
- **Review Queue button** remains always visible for directors (it carries a live count badge and is a primary director action — not secondary).
- **Clicking "More options":** Expands inline to reveal all 5 mode buttons with the same label, description, category, and safe-status copy as before. A `▾` chevron rotates to `▴` when open.
- **Clicking a mode button:** Activates the mode AND collapses the "More options" section back (`setShowMoreOptions(false)`).
- **When a mode is already active:** "More options" toggle is hidden; the expanded mode list shows so the director can see which mode is active and switch.
- **Godmode dispatch:** Untouched. All modes (`guide`, `explain`, `find`, `capture`, `create_template`, `guided_task`, `review_queue`) and their underlying logic are fully intact.

**Scroll reduction estimate (default state):** ~240–280px removed. Five full-height mode buttons (~55px each) replaced by one single-line "More options" chip (~44px).

---

### 2. Greeting card suppressed when conversation active (`DonnaAssistantButton.tsx`)

**Before:** The greeting card could appear simultaneously with "DONNA says" (in `DonnaWorkflowCards`) or the COO conversation thread, creating two competing response surfaces in the visible panel.

**After:** Added condition:
```tsx
{showGreeting && cooThread.length === 0 && !commandResponse && (
  ...
)}
```

- If `cooThread.length > 0` (a conversation has started) → greeting card is hidden; the conversation thread represents DONNA's presence.
- If `commandResponse` is set (DONNA answered something) → greeting card is hidden; the "DONNA says" card in `DonnaWorkflowCards` is the response surface.
- If neither is true (fresh panel open, no conversation yet) → greeting card shows normally, including the daily greeting, onboarding flow, and follow-up copy.

**Effect:** Eliminates the "greeting + DONNA says" double-surface scenario. One response at a time.

**Godmode intelligence:** No changes. `commandResponse`, `cooThread`, and all dispatch chains are untouched.

---

### 3. "Ask about this page" converted to compact chip (`DonnaAssistantButton.tsx`)

**Before:** A full-width tall button (~80px) with a large icon, bold label, and description line: "Summarize what's happening right now, based on live data."

**After:** A compact inline chip (~28px tall):
```
✦ Ask about this page
```
- Same `handleContextSummary()` handler — reads live context and computes predictive suggestions.
- Same disabled state when `isLoadingContext` (shows "Reading…").
- Same mode guards (hidden in `create_template`, `guided_task`, `review_queue` modes).
- Lime accent color consistent with the design system.

**Scroll reduction estimate:** ~50–55px removed (tall button → single-line chip).

---

## Part 2 — Scroll Reduction Summary

| Section | Before | After | Saved |
|---|---|---|---|
| Mode buttons (default) | ~300px (5 full-height buttons) | ~44px (1 "More options" chip) | **~256px** |
| Greeting + DONNA says overlap | Could both be visible | Mutually exclusive | **~80px** (when conversation active) |
| "Ask about this page" | ~80px (full button) | ~28px (chip) | **~52px** |
| **Total default view reduction** | | | **~308px** |

On a standard laptop (600px panel body), the input bar is now reachable without scrolling in the default state (no active workflow, no mode selected).

---

## Part 3 — What Was NOT Changed

| Item | Reason |
|---|---|
| Godmode dispatch chains (`handleSend`, all intercept engines) | Architecture — preserve all intelligence |
| `DonnaWorkflowCards` | Out of scope — workflow cards serve specific tasks |
| COO conversation thread (`cooThread`) | Retained as-is; still shows historical turns |
| Mode content sections (`guide`, `explain`, `find`, etc.) | Unchanged — all modes still work |
| Mode logic (`handleModeClick`, `isModeAllowedForRole`) | Unchanged |
| `handleContextSummary` and predictive suggestions | Unchanged |
| Review Queue button | Kept always visible — count badge is primary director signal |
| Voice paths (TTS, realtime voice, VoiceInputButton) | Unchanged |
| Any migrations, RLS, or DB changes | Not applicable to UI sprint |
| `DonnaSessionContextProvider`, `DonnaVoiceLayer`, `DonnaVoiceReadyShell` | Sprint 745 changes preserved; no re-touch |

---

## Part 4 — UI Score Update

| Criterion | Sprint 745 Score | Sprint 746 Score |
|---|---|---|
| Visual clarity | 5.5/10 | 6.5/10 (greeting no longer visible simultaneously with DONNA says) |
| Cognitive load | 4/10 | 6/10 (mode buttons hidden by default; one response surface rule) |
| Scroll burden | 4/10 | 7/10 (~308px removed from default view) |
| Repeated UI elements | 4/10 | 6/10 (greeting/DONNA says merged; ask-page button compacted) |
| Primary action clarity | 5/10 | 7/10 (input bar now reachable without scrolling in default state) |
| Voice state clarity | 7/10 | 7/10 (unchanged) |
| Persistence | 8/10 | 8/10 (unchanged) |
| Name memory | 7.5/10 | 7.5/10 (unchanged) |
| Mobile usability | 5/10 | 6.5/10 (same layout changes improve mobile) |
| Premium COO feel | 5/10 | 6.5/10 (panel feels less like a debug drawer) |
| **Overall** | **6/10** | **7/10** |

---

## Part 5 — Remaining UI Gaps (Sprint 747+)

| Gap | Impact | Target |
|---|---|---|
| COO thread shows old-style turn-block format, not chat bubbles | Medium — premium feel | Sprint 747 |
| Full 5-zone layout: `DonnaVoiceReadyShell` wired into sidebar panel as primary surface | High | Sprint 747+ |
| "DONNA says" card in DonnaWorkflowCards is still a separate box, not a chat bubble | Medium | Sprint 747 |
| Mobile: no dedicated mobile-first DONNA view | Medium | Sprint 747 |
| Voice quality status pill still appears after TTS use | Low | Sprint 747 |

---

## Certification Update

**Sprint 746 changes do not affect DONNA Godmode intelligence score.**
All Godmode dispatch chains, data quality guardian, player stall detector, curriculum gap detection, and action drafting are fully intact. TypeScript: clean.

**UI score: 6/10 → 7/10**

The panel now feels significantly less like a developer debug drawer in its default state. Input bar is reachable without scrolling. Greeting and response surfaces no longer compete. The full 5-zone premium layout (Sprint 747+) remains the north star.
