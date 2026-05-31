# Sprint 1071 — DONNA Page-Aware Answer + Navigation Intent Fix

**Date:** 2026-05-31
**Sprint:** 1071

---

## Problem Statement

Three bugs blocked DONNA from acting as an operating assistant:

1. On the Academy Health / KPI page, broad health questions ("Tell me about the health of my academy") fell through to the LLM orchestrator, which received the wrong page label ("Today") and often asked for clarification instead of answering from visible page context.

2. "Open approvals" — and all natural-language approval navigation phrases — were not matched by any deterministic navigation pattern. The command silently no-opped on voice and fell to God Mode on typed input.

3. The DONNA panel could simultaneously show "Listening" (header badge) and "Voice is unavailable right now" (body error text), because `VoiceInputButton.onerror` did not reset `voiceState` immediately, and `handleVoiceListeningChange(true)` never cleared a stale error from a prior session.

---

## Root Causes

### Bug 1 — Health questions trigger clarification

- `/director/kpi` was not registered in `donnaPageContextRegistry.ts`, so it resolved to the generic `/director` context (`screenName: 'Today'`).
- "Tell me about the health of my academy" matched no entry in `DIRECTOR_SIGNAL_MAP` (`donnaIntentClassifier.ts`). The `dashboard_priority` signals required exact phrase "academy health" or "how healthy is/are"; the reversed phrasing "health of my academy" didn't match.
- `classifyDirectorIntent` returned `intent: 'unknown'` → `routeDonnaPrompt` returned `responseMode: 'answer_directly'` → `handleDonnaCooPrompt` returned `false` immediately.
- Fell through to God Mode with `pageLabel: 'Today'` — the LLM had no KPI page context and asked for clarification.

### Bug 2 — "Open approvals" doesn't route

- `NAV_PATTERNS` in `donnaUIActionDispatcher.ts` matched "review center/queue" and "pending approvals" but NOT "open approvals" standalone.
- Step-7 approval fallback in `dispatchUIIntent` used `/approve/i` — "approv**als**" does not contain the substring "approv**e**", so `/approve/i.test("open approvals")` → false.
- `detectAndHandleCommand` (legacy handler) had "open review" but not "open approvals".
- Voice path: no God Mode fallback → complete silent no-op.
- Typed path: fell to God Mode which may or may not navigate.

### Bug 3 — Listening + Voice unavailable co-display

- `VoiceInputButton.startRecognition()` set `voiceState = 'listening'` immediately on `recognition.start()`.
- When `onerror` fired, it called `onError` (setting `voicePermissionError`) but did **not** reset `voiceState`. `voiceState` stayed `'listening'` until `onend` fired.
- Between `onerror` and `onend`: header badge showed "Listening", body showed error text.
- Separately: `handleVoiceListeningChange(true)` never cleared a stale `voicePermissionError` from a prior failed session, so starting a new voice session after a prior error left both states active.

---

## Fixes

### Fix 1 — Page context registry + page-aware answer

**`donnaPageContextRegistry.ts`**: Added `/director/kpi` entry with `screenName: 'Academy Health'`. Registered immediately before `/director` so the prefix resolver doesn't fall back to the generic dashboard context.

**`DonnaAssistantButton.tsx`**: Added `isAcademyHealthQuestion()` helper and a narrow intercept at the top of `handleDonnaCooPrompt`. When `pathname === '/director/kpi'` and the query matches broad health/KPI phrases, DONNA returns a deterministic three-paragraph answer explaining the three headline signals (Active Players, Advancement Ready, Attention Signals) and what to do with each. This runs before `routeDonnaPrompt` so it never reaches the "ask for clarification" path.

The answer references known page structure (the three summary cards and the player table), without fabricating numeric values — DONNA doesn't have access to server-rendered counts and doesn't pretend to.

### Fix 2 — Approvals navigation + expected route mapping

**`donnaUIActionDispatcher.ts`**: Added two new entries at the top of `NAV_PATTERNS`:

```typescript
// Sprint 1071
{ pattern: /open approvals?|go to approvals?|take me to approvals?|approvals? (section|center|page|queue)/i, route: '/director/review', label: 'Approvals' },
{ pattern: /academy health|open kpi|kpi (page|dashboard)|health (page|dashboard|section)/i, route: '/director/kpi', label: 'Academy Health' },
{ pattern: /parent (updates?|communications?|section|page|center)/i, route: '/director/parents', label: 'Parent Updates' },
```

These run before `handleDonnaCooPrompt` in both `handleCommandSubmit` (typed) and `handleVoiceTranscript` (voice), so both input paths resolve navigation deterministically.

### Fix 3 — Voice status contradiction

**`VoiceInputButton.tsx`**: In `recognition.onerror`, for all non-`no-speech` errors, immediately call `setVoiceState('idle')`, `onVoiceStateChange?.('idle')`, and `onListeningChange?.(false)`. `onend` still fires afterwards and calls the same setters — React coalesces identical state updates, so there is no double-render issue.

**`DonnaAssistantButton.tsx`**: In `handleVoiceListeningChange(true)`, added `setVoicePermissionError(null)` to clear any stale error from a previous session before the new listening session begins.

---

## Priority Order (per Sprint 620 roadmap)

These fixes address Route Connectivity (P0 gap `players_directory_no_donna`, `kpi_page_no_donna`) and Voice Reliability (P2 gap `voice_state_contradiction`) from the DONNA 10/10 COO Readiness Roadmap.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | +3 NAV_PATTERNS entries: approvals, academy health, parent updates |
| `src/components/assistant/donnaPageContextRegistry.ts` | +1 context entry for `/director/kpi` |
| `src/components/assistant/DonnaAssistantButton.tsx` | `isAcademyHealthQuestion` helper + KPI intercept in `handleDonnaCooPrompt` + `handleVoiceListeningChange` fix |
| `src/components/assistant/VoiceInputButton.tsx` | `onerror` immediately resets `voiceState` for non-`no-speech` errors |

---

## Safety Invariants Preserved

- No schema changes, no migrations.
- No record mutations — all changes are read/display/navigation only.
- `proposed_actions` pipeline untouched.
- Role boundaries untouched.
- All existing voice activation behavior (Sprint 1057) preserved.
- Panel simplification (Sprints 1058–1059) preserved.
- Builder sprints (1061–1070) untouched.
