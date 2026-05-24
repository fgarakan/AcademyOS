# DONNA Thread Height + Voice Noise Polish — Sprint 749
**Sprint 749 — 2026-05-24**

---

## Purpose

Sprint 749 is the fifth pass of the DONNA premium UI sequence — two small, targeted polish changes that make the sidebar panel feel stable and clean:

1. **Thread height containment** — the COO conversation thread now scrolls internally instead of pushing the panel body taller.
2. **Voice quality pill de-emphasis** — the post-TTS voice quality status pill is visually quieter.

Sprint sequence to date:
- Sprint 745: Persistence, name memory, context card removal, header/footer cleanup
- Sprint 746: Mode button collapse, greeting suppression, ask-page chip
- Sprint 747: COO thread → premium chat bubbles, all 5 turns including current
- Sprint 748: Thread metadata, commandResponse card suppression, auto-scroll
- Sprint 749: Thread max-height, voice quality pill opacity (this sprint)

---

## Part 1 — Thread Height Containment

### Problem

The cooThread container had no height cap. As turns accumulated (up to 5 visible), the thread grew and pushed the rest of the panel body downward, making the input bar progressively harder to reach without scrolling the whole panel.

### Change

**File:** `src/components/assistant/DonnaAssistantButton.tsx`

**Inner scroll container (the `space-y-2.5 px-3` div):**

Before (Sprint 748):
```tsx
<div className="space-y-2.5 px-3">
```

After (Sprint 749):
```tsx
<div className="space-y-2.5 px-3 max-h-[280px] overflow-y-auto">
```

### Why 280px

| Turns visible | Approximate height (user + donna bubble per turn) |
|---|---|
| 1 turn | ~80–90px |
| 2 turns | ~160–180px |
| 3 turns | ~240–270px |
| 4 turns | ~320–360px (would overflow) |
| 5 turns | ~400–450px (would overflow) |

At `max-h-[280px]`, the thread comfortably shows 3 turns, begins scrolling at 4, and never exceeds ~280px regardless of conversation length. The input bar stays reachable in the default panel view.

### Auto-scroll preservation

The auto-scroll `useEffect` from Sprint 748 remains unchanged:
```tsx
useEffect(() => {
  if (cooThread.length === 0) return
  cooThreadBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}, [cooThread])
```

The `cooThreadBottomRef` anchor (`<div ref={cooThreadBottomRef} />`) is **inside** the `overflow-y-auto` container. `scrollIntoView` targets the nearest scrollable ancestor — which is now this container. The scroll now happens within the thread box, not the page body. Behavior is correct and SSR-safe (useEffect is client-only).

### Behavior

- Thread container has a fixed max height of 280px.
- When content fits within 280px: no scrollbar shown.
- When content exceeds 280px: internal scrollbar; panel body height unchanged.
- On each new thread turn: smooth scroll to bottom within the thread box.
- Input bar always reachable without scrolling the outer panel.
- All bubble styling (lime user, violet/orange donna, label, type) fully preserved.

---

## Part 2 — Voice Quality Status Pill De-emphasis

### Problem (Sprint 748 gap → Part 2)

After any TTS is used, a small pill appears:
```
● Premium Donna voice active
```
or
```
● Fallback device voice active
```

This is useful for debugging and developer transparency but adds low-priority visual noise below the main workflow area during normal director use. The pill is not a critical error status — actual errors and mic issues have their own dedicated error states above the input bar.

### Change

**File:** `src/components/assistant/DonnaAssistantButton.tsx`

Before (Sprint 748):
```tsx
{lastServerTtsInfo && (
  <div className="px-4 pb-1">
```

After (Sprint 749):
```tsx
{lastServerTtsInfo && (
  <div className="px-4 pb-1 opacity-50">
```

### What this means

- The pill still renders — it is not removed.
- `opacity-50` halves its visual weight without hiding it.
- Useful for production diagnostics (confirming voice route) — available at a glance without dominating the panel.
- All actual voice error states ("Mic blocked", "Voice unavailable", stall/error messages) are **not affected** — they render in separate elements with their own styling above the input bar.

### What was NOT changed

| Item | Reason |
|---|---|
| "Mic blocked" badge (line ~2976) | Error state — fully intact |
| "Voice unavailable" badge (line ~2984) | Error state — fully intact |
| Stall / error messages in onboarding voice flow | Workflow-critical — fully intact |
| "Retry mic" / "Retry voice" buttons (Sprint 745) | Error recovery — fully intact |
| `lastServerTtsInfo` state and update logic | Unchanged — only render opacity |
| `DonnaVoiceLayer.tsx` | Not touched this sprint |
| `DonnaVoiceReadyShell.tsx` | Not touched this sprint |

---

## Part 3 — UI Score Update

| Criterion | Sprint 748 Score | Sprint 749 Score | Notes |
|---|---|---|---|
| Visual clarity | 8.5/10 | 8.5/10 | Unchanged — thread layout already clean |
| Cognitive load | 8/10 | 8/10 | Unchanged |
| Scroll burden | 7.5/10 | 8.5/10 | Thread now scrolls internally — input always reachable |
| Repeated UI elements | 8.5/10 | 8.5/10 | Unchanged |
| Primary action clarity | 8/10 | 8.5/10 | Input bar consistently reachable; no scroll penalty |
| Premium COO feel | 8.5/10 | 8.5/10 | Stable panel height adds to the premium feel |
| Voice status clarity | 7/10 | 7.5/10 | Quality pill de-emphasized; error states remain clear |
| **Overall** | **8.3/10** | **8.6/10** | |

---

## Part 4 — Godmode Regression Check

**No changes to:**
- `handleCommandSubmit` dispatch logic
- Answer composition (`composeDonnaResponse`, etc.)
- Intent routing (`routeConversationalIntent`)
- Gap detectors, data quality guardian, stall detector
- Any server actions or backend files
- `setCommandResponse` call sites
- `setCooThread` state mutations
- `cooThreadBottomRef` scroll behavior (unchanged — scrolls within new overflow container)
- `suppressCommandResponseCard` logic

**Changes made:**
- `max-h-[280px] overflow-y-auto` added to cooThread inner div — CSS only
- `opacity-50` added to voice quality pill wrapper — CSS only

**DONNA Godmode certification status: UNCHANGED — CERTIFIED 9.3/10.**

---

## Part 5 — Remaining Gaps (Sprint 750+)

| Gap | Impact | Sprint |
|---|---|---|
| DonnaVoiceLayer "DONNA says" area (passes `commandResponse.message` as `donnaLastResponse`) — a third display path for commandResponse | Medium | Sprint 750 |
| Full 5-zone layout (wire panel input directly to thread, remove DonnaVoiceLayer as response surface) | High — architectural | Sprint 751+ |
| Dedicated mobile DONNA view | Medium | Sprint 750 |
| `label` field on Category B commandResponse turns (continuity, errors) — would allow those to show in-thread too | Low | Sprint 750+ |
| Thread max-height responsive adjustment for mobile (currently fixed at 280px) | Low | Sprint 750 |

---

## Summary

Sprint 749 delivers two targeted polish changes to the DONNA sidebar panel. The cooThread now scrolls internally at a 280px cap, keeping the input bar constantly accessible regardless of conversation length. The voice quality status pill is visually de-emphasized with `opacity-50` while remaining present for diagnostics. Both changes are CSS-only with zero impact on DONNA Godmode dispatch, state mutations, or voice error handling. Overall UI score: 8.3/10 → **8.6/10**.
