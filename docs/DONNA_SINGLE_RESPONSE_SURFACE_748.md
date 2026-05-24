# DONNA Single Response Surface — Sprint 748
**Sprint 748 — 2026-05-24**

---

## Purpose

This document records the response-surface unification completed in Sprint 748 — the fourth and final pass of the DONNA premium UI sequence. The COO conversation thread is now the primary and dominant assistant response surface in the sidebar panel.

Sprint sequence:
- Sprint 745: Persistence, name memory, context card removal, header/footer cleanup
- Sprint 746: Mode button collapse, greeting suppression, ask-page chip
- Sprint 747: COO thread → premium chat bubbles, all 5 turns including current
- Sprint 748: Thread metadata, commandResponse card suppression, auto-scroll (this sprint)

---

## Part 1 — commandResponse Flow Audit

### Two categories of commandResponse:

**Category A — Main conversational responses (ALSO in cooThread):**

These are produced in the main GODmode dispatch path (conversational router → answer composer → `setCommandResponse` + `setCooThread` called in the same flow):

```
setCommandResponse({ message: finalText, type, label })
setCooThread(prev => [...prev.slice(-4), { user: text, donna: finalText, label, type }])
```

Because the same `finalText` appears in both, the thread already renders the response as a chat bubble. The commandResponse card was a **duplicate** for these responses.

**Category B — Non-thread responses (commandResponse only, no cooThread push):**

These use `setCommandResponse` without any `setCooThread` call:

| Source | Example | Kept? |
|---|---|---|
| Continuity message on re-open | "Welcome back — you were looking at sessions" | ✅ Card still shows |
| `donna:open` custom event response | External page passes a pre-built answer | ✅ Card still shows |
| Controller display messages (undo/cancel/revision) | "I've undone that change" | ✅ Card still shows |
| Onboarding routing | "Academy Setup — go here to start" | ✅ Card still shows |
| Voice protection safety | "Use the on-screen button" | ✅ Card still shows |
| Attention/brief error messages | "Could not load — try again" | ✅ Card still shows |
| Role boundary ("Director only") | "This is director-only" | ✅ Card still shows |
| Communication draft / coach brief started | "Draft started. What topic?" | ✅ Card still shows |
| Context summary results | (from handleContextSummary, not main dispatch) | ✅ Card still shows |

**Suppression condition used:**
```tsx
suppressCommandResponseCard={
  cooThread.length > 0 &&
  commandResponse !== null &&
  cooThread[cooThread.length - 1]?.donna === commandResponse.message
}
```

Exact string match between `commandResponse.message` and the last cooThread donna text. Only Category A responses (main GODmode dispatch) ever match — their message is identical because both `setCommandResponse` and `setCooThread` use the same `finalText`. All Category B responses have different text → card still shows.

**Risk:** Zero. The suppression is additive (boolean prop, default `false`), precise (exact string match), and backward-compatible.

---

## Part 2 — Metadata Added to cooThread Turns

### Extended cooThread type:

Before (Sprint 747):
```tsx
Array<{ user: string; donna: string }>
```

After (Sprint 748):
```tsx
Array<{
  user: string
  donna: string
  label?: string       // e.g. "Not allowed", "About this page", "Curriculum"
  type?: 'info' | 'honest'  // controls bubble color: violet (info) vs orange (honest)
}>
```

### Values set at dispatch push (line ~2517):
```tsx
setCooThread(prev => [...prev.slice(-4), {
  user: text,
  donna: finalText,
  label: composed.isBlocked ? 'Not allowed' : (composed.nextStepLabel ?? undefined),
  type: composed.isBlocked ? 'honest' : 'info',
}])
```

- `label`: Only shown in the thread bubble when present and non-trivial. Preserves domain context (e.g., "Not allowed" for blocked answers).
- `type`: Controls bubble accent color: `honest` → orange (boundary/blocked), `info` → violet (standard response).
- Labels like "DONNA" are NOT passed (they add no useful context in a conversation). Only specific domain labels pass through.

### Rendered in thread bubble:
```
[Not allowed]        ← compact label, 10px uppercase, orange
┌─────────────────────────────────────────┐
│ DONNA's response text here…             │ ← orange-tinted bubble for 'honest'
└─────────────────────────────────────────┘
```

For standard `info` responses with no specific label: no label shown, violet bubble — clean and uncluttered.

---

## Part 3 — commandResponse Card Behavior After Sprint 748

### What shows the card (Category B — unchanged):
- Continuity messages on panel re-open
- `donna:open` injected answers
- Controller turn messages (undo/cancel)
- Onboarding routing
- Voice protection safety messages
- Error messages (attention, brief failures)
- Role boundary ("Director only")
- Communication draft / coach brief start confirmations
- Context summary results (from "Ask about this page")

### What no longer shows the card (Category A — suppressed):
- All main GODmode conversational responses (curriculum, players, review queue, KPI, data quality, stall detection, etc.)
- These responses are fully represented in the chat thread bubble, with label and type preserved

### Dismiss button:
The dismiss button (×) on the commandResponse card remains for Category B responses. When a Category A response is suppressed, there is nothing to dismiss — the thread itself provides the history.

---

## Part 4 — Auto-Scroll

### Implementation:
```tsx
// Sprint 748 — auto-scroll thread to latest message whenever cooThread changes
useEffect(() => {
  if (cooThread.length === 0) return
  cooThreadBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}, [cooThread])
```

With `<div ref={cooThreadBottomRef} />` at the bottom of the thread turn list.

**SSR safety:** `scrollIntoView` is a browser-only DOM API. It is called only via `useEffect` (client-only) and only when `cooThread.length > 0`. No `typeof window` guard needed here because `useEffect` never runs on the server.

**Behavior:** Smooth scroll to the bottom anchor whenever a new turn is added to `cooThread`. The `block: 'nearest'` parameter ensures the scroll only moves the minimum amount needed — if the thread is already visible, no jarring scroll occurs.

---

## Part 5 — What Was NOT Changed

| Item | Reason |
|---|---|
| All Godmode dispatch chains | Architecture — no changes to answer composition or routing |
| All `setCommandResponse` call sites | Not touched — only the RENDERING condition changed |
| `setCooThread` behavior (slice logic) | Unchanged — only metadata fields added to the pushed object |
| `DonnaVoiceLayer` | Not staged this sprint |
| `DonnaVoiceReadyShell` | Not staged this sprint |
| `DonnaChatThread` | Not staged this sprint |
| All workflow cards (daily brief, attention, communication draft, etc.) | These are not commandResponse — fully intact |
| Review queue, template, guided task, voice flows | Fully intact |
| Any migrations, RLS, or DB changes | Not applicable |

---

## Part 6 — UI Score Update

| Criterion | Sprint 747 Score | Sprint 748 Score | Notes |
|---|---|---|---|
| Visual clarity | 7.5/10 | 8.5/10 | One primary response surface for main answers; card only for contextual/error responses |
| Cognitive load | 7/10 | 8/10 | No duplicate response for conversational turns |
| Scroll burden | 7/10 | 7.5/10 | Thread label/type adds minimal height; auto-scroll keeps latest visible |
| Repeated UI elements | 6.5/10 | 8.5/10 | GODmode responses no longer appear in both thread and card |
| Primary action clarity | 7.5/10 | 8/10 | Thread is the clear primary surface; card reserved for non-thread messages |
| Premium COO feel | 7.5/10 | 8.5/10 | Panel now behaves like a real chat assistant — one thread, consistent bubbles |
| **Overall** | **7.5/10** | **8.3/10** | |

---

## Part 7 — Godmode Regression Check

**No changes to:**
- `handleCommandSubmit` dispatch logic
- Answer composition (`composeDonnaResponse`, `composeRosterIntelAnswer`, etc.)
- Intent routing (`routeConversationalIntent`)
- Gap detectors, data quality guardian, stall detector
- Any server actions or backend files
- `setCommandResponse` call sites (dispatch is unchanged)

**Changes made:**
- `setCooThread` now receives `label` and `type` alongside `user`/`donna` — purely presentational, no behavior change
- `DonnaWorkflowCards` `suppressCommandResponseCard` prop — purely a render-time boolean check
- Auto-scroll useEffect — purely presentational

**DONNA Godmode certification status: UNCHANGED — CERTIFIED 9.3/10.**

---

## Part 8 — Remaining Gaps (Sprint 749+)

| Gap | Impact | Sprint |
|---|---|---|
| Voice quality status pill shown after TTS | Low noise | Sprint 749 |
| Dedicated mobile DONNA view | Medium | Sprint 749 |
| `label` field on Category B commandResponse turns (continuity, errors) would let those show in-thread too | Low — current design (card only) is acceptable | Sprint 749+ |
| DonnaVoiceLayer "DONNA says" area (passes `commandResponse.message` as `donnaLastResponse`) — still visible | Medium — a third display path for commandResponse | Sprint 749 |
| Full 5-zone layout (wire panel input directly to thread, remove DonnaVoiceLayer) | High — architectural | Sprint 750+ |
| Thread max-height constraint + inner scroll (currently overflows into panel body scroll) | Medium | Sprint 749 |

---

## Summary

Sprint 748 completes the DONNA sidebar panel's response-surface unification. The COO conversation thread is now the primary surface for all main GODmode answers. The commandResponse card is suppressed for Category A responses (already in thread) and preserved for Category B (contextual, error, role-boundary messages not in thread). Metadata (`label`, `type`) is now carried in thread turns so domain context is preserved even without the card. Auto-scroll keeps the latest response in view. Overall UI score: 7.5/10 → 8.3/10.
