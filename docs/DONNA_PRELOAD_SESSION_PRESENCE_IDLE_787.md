# DONNA Preload + Session Presence + Idle V1 — Sprint 787

**Date:** 2026-05-25
**Sprint:** 787
**Status:** COMPLETE

---

## Goal

Make DONNA feel instantly available and persistently present during an active AcademyOS session. Two behaviors:

1. **Within-session panel persistence** — if the director had the panel open and navigated to a new route (or refreshed the page), the panel re-opens automatically.
2. **Idle presence** — after 3 minutes of no interaction, DONNA stops listening (if active) and shows "I'm here when you need me." — the panel stays open.

---

## What Was Built

### 1. Session-scoped panel persistence (sessionStorage)

**Key:** `academyos:donna:panelOpen:v1`
**Storage:** `window.sessionStorage` (tab-scoped, clears on tab close — NOT localStorage)

Two useEffects:
- **Mount restore:** on mount, check sessionStorage. If `'true'` → call `openDonnaPanel()` to re-open the panel.
- **Sync:** whenever `panelOpen` changes → write or remove the sessionStorage key.

This means:
- Director opens panel → navigates within the same tab → panel re-opens automatically.
- Director closes tab or opens a new tab → panel starts closed. ✅
- Director explicitly closes panel → sessionStorage key removed → panel does not re-open on next navigation. ✅

### 2. 3-minute idle timer

**New state:** `isDonnaIdle: boolean` (React state, never persisted)
**New ref:** `idleTimerRef: ReturnType<typeof setTimeout> | null`
**New function:** `resetIdleTimer()` — clears existing timer, sets `isDonnaIdle(false)`, starts new 3-minute countdown

When the 3-minute timer fires:
- Calls `stopWakeListening()` (no-op if not active)
- Sets `isDonnaIdle(true)`
- Shows "I'm here when you need me." card in the panel body

### 3. Idle timer reset points

The idle timer is reset on every meaningful director interaction:

| Event | How reset is triggered |
|---|---|
| Typing in panel input | useEffect watching `typedText` |
| Submitting a prompt (typed or chip) | `handleCommandSubmit()` — first call |
| Voice transcript received | `handleVoiceTranscript()` — first call |
| Mic button clicked (listening starts) | `handleVoiceListeningChange(true)` |
| "Back to page" chip clicked | chip `action()` before navigation |
| Panel opens | `panelOpen` lifecycle useEffect |

COO router responses, operator steps, DONNA-triggered navigation — all route through `handleCommandSubmit` or `handleVoiceTranscript`, so they're covered.

### 4. Idle presence card (UI)

Shown at the top of the scrollable panel body when `isDonnaIdle === true`:

```
I'm here when you need me.
```

Styled with the lime/green 3% background and 10% border — quiet, not alarming. Does not replace or hide other panel content.

Any subsequent interaction (typing, chip click, voice) calls `resetIdleTimer()` which sets `isDonnaIdle(false)` and the card disappears.

---

## Files Changed

### `src/components/assistant/DonnaAssistantButton.tsx`

7 surgical changes:

1. **New ref** `idleTimerRef` (after `panelOpenCountRef`)
2. **New state** `isDonnaIdle` (after `sessionIntentContext`)
3. **New function** `resetIdleTimer()` (after `closePanel`, before Escape useEffect)
4. **`closePanel` extended** — clears `idleTimerRef`, sets `isDonnaIdle(false)` before `realtimeDisconnect()`
5. **5 new useEffects** added after `loadLastSession` useEffect:
   - Mount restore (reads sessionStorage once)
   - panelOpen sync (writes/removes sessionStorage key)
   - Panel lifecycle idle timer (starts on open, clears on close)
   - typedText idle reset (resets on any typing)
6. **`handleVoiceTranscript`** — `resetIdleTimer()` after `setVoiceTranscript(text)`
7. **`handleVoiceListeningChange`** — `resetIdleTimer()` when `listening === true`
8. **`handleCommandSubmit`** — `resetIdleTimer()` after `if (!text) return`
9. **"Back to page" chip** — `resetIdleTimer()` in action handler
10. **Scrollable body JSX** — idle presence card at top (`isDonnaIdle && ...`)

---

## What Was Not Changed

- No routing logic
- No DB/API behavior
- No safety or approval language
- No new server actions
- No migrations
- No new components
- `panelOpen` state ownership unchanged — still in `DonnaSessionContextProvider` (Sprint 686)

---

## Storage Boundary Decision

| Storage | Key | Scope | Why |
|---|---|---|---|
| `sessionStorage` | `academyos:donna:panelOpen:v1` | Tab + browser session | Must clear on tab close; should NOT survive new tabs |
| `localStorage` | `academyos:donna:last-session:<id>:v1` | Cross-session | Sprint 784 — page context across logins |
| `sessionStorage` | `academyos:donna:sessionMemory:v1` | Tab | Sprint 691 — route/prompt recall |
| `sessionStorage` | `academyos:donna:introCompleted:v1` | Tab | Sprint 350 — onboarding completion |

Panel-open state is intentionally sessionStorage (not localStorage) to match the expected behavior: a new browser session starts fresh.

---

## TypeScript

Clean — `npx tsc --noEmit` passes with zero errors.
