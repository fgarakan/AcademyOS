# DONNA Full Voice Persistence + COO Assistant Audit
**Sprint 682 — 2026-05-23**
**Scope:** All DONNA voice files, session lifecycle, listening/speaking behavior, panel state, route persistence
**Method:** Source-code inspection of all DONNA, voice, speech, and layout files

---

## 1. Executive Summary

DONNA stops because of **five compounding problems**, not one:

1. **Voice input is single-shot by default** — `VoiceInputButton` defaults to `persistent=false`, so recognition ends after every utterance and the director must click Mic again for each phrase. The `useVoiceDictation` hook used on the `/director/donna` page also uses `continuous=false`.

2. **Route changes wipe all conversational state** — `DonnaAssistantButton` has a `useEffect` on `pathname` that resets 30+ state variables including voice state, messages are NOT reset (messages live in `DonnaVoiceReadyShell` which is rendered inside the panel), but the wake phrase recognition, all drafts, speaking state, and voice error state are cleared on every navigation.

3. **`closePanel()` fully disconnects DONNA** — closing the panel calls `realtimeDisconnect()`, `speechSynthesis.cancel()`, `stopServerTts()`, `stopWakeListening()`, and resets all state. There is no "minimize" path.

4. **OpenAI Realtime is unconfigured by default** — the primary voice output path (`useDonnaRealtimeVoice`) requires `OPENAI_API_KEY` on the server. Without it, every `connect()` returns 503 → `status='unavailable'`. The fallback is browser `speechSynthesis`, which is prototype-only.

5. **Two DONNA implementations exist in parallel** and are not connected — the floating `DonnaAssistantButton` (old interaction model) and the `/director/donna` page (new `DonnaVoiceReadyShell` chat model). Directors experience whichever one they happen to use, with inconsistent behavior between them.

**Go/No-Go for demo voice:** Voice is risky for the Brian demo. Text chat at `/director/donna` is reliable. Browser SpeechRecognition works in Chrome but requires manual mic clicks for each phrase. Recommend demonstrating text chat + showing voice capability briefly, not relying on continuous voice.

---

## 2. Current Architecture Map

### 2.1 Entry Points

| Entry | File | Mount location | Rendering model |
|---|---|---|---|
| Floating button | `src/components/assistant/DonnaAssistantButton.tsx` | `src/app/director/layout.tsx` | Always-mounted in layout; panel open/closed via local state |
| DONNA page | `src/app/director/donna/page.tsx` | Route `/director/donna` | Server Component; mounts `DonnaDirectorShellClient` |

### 2.2 Component Ownership

| Concern | Owner | File |
|---|---|---|
| Panel open/closed state | `DonnaAssistantButton` | `DonnaAssistantButton.tsx:353` — `panelOpen` useState |
| Voice listening state | `DonnaAssistantButton` | `isVoiceListening` useState |
| Speaking/audio output state | `DonnaAssistantButton` | `isSpeaking` useState |
| WebRTC Realtime connection | `useDonnaRealtimeVoice` | `useDonnaRealtimeVoice.ts` |
| Browser SpeechRecognition (panel) | `VoiceInputButton` | `VoiceInputButton.tsx` |
| Browser SpeechRecognition (page) | `useVoiceDictation` | `useVoiceDictation.ts` |
| TTS output (panel) | `speakAssistantText()` + `speakDonna()` | inside `DonnaAssistantButton.tsx` |
| Session context (route tracking) | `DonnaSessionContextProvider` | `DonnaSessionContextProvider.tsx` |
| Conversation messages (page) | `DonnaVoiceReadyShell` | `DonnaVoiceReadyShell.tsx:63` — `messages` useState |
| Chat session memory | `donnaChatSessionMemory` | `src/lib/donna/donnaChatSessionMemory.ts` |

### 2.3 Is DONNA global or per-page?

**Floating button (`DonnaAssistantButton`):** Global. It is rendered in `src/app/director/layout.tsx` and persists across all director routes. The component is **never unmounted** during navigation within `/director/*`. However, its internal state resets on route change.

**DONNA page (`/director/donna`):** Page-local. The `DonnaVoiceReadyShell` and its `messages` state exist only while the director is on `/director/donna`. Navigating away unmounts the component and destroys all conversation history.

### 2.4 Does route navigation unmount DONNA?

| Component | On route change |
|---|---|
| `DonnaAssistantButton` | Not unmounted (lives in layout). State resets via `useEffect` on `pathname`. |
| `DonnaVoiceReadyShell` (on `/director/donna` page) | Unmounted when director leaves the page. All messages lost. |

### 2.5 Where is DONNA state stored?

| State | Storage | Persistence |
|---|---|---|
| Panel open/closed | React local state in `DonnaAssistantButton` | Current page load only |
| Voice listening | React local state | Current page load; resets on route change |
| Conversation messages (page) | React local state in `DonnaVoiceReadyShell` | Page-local; lost on navigation |
| Active draft | React local state + `sessionStorage` via `donnaDraftPersistence.ts` | Survives route change (restored on panel open) |
| Chat session memory | In-memory via `donnaChatSessionMemory.ts` | Session only; not persisted to localStorage or DB |
| Route/module context | `DonnaSessionContextProvider` (React context + useState) | Current session; in-memory only |
| Microphone permission | Browser / OS | OS-level; persists across sessions |
| Daily greeting | `localStorage` via `donnaDailyGreeting.ts` | Persists 1 day |

---

## 3. Lifecycle Diagram

```
Director opens browser
        │
        ▼
DirectorLayout mounts (server component)
        │
        ├── DonnaSessionContextProvider (wraps all children)
        ├── DonnaAssistantButton (always-mounted, panelOpen=false)
        └── <children> (route pages)

Director clicks DONNA button
        │
        ▼
panelOpen=true
        │
        ├── tryRestoreDraft() — loads draft from sessionStorage
        ├── getDonnaReviewQueueAction() — prefetches pending count
        ├── evaluateRecommendations() — loads suggestions
        └── (if !introCompleted) setOnboardingStep(0) — starts intro

Director navigates (pathname changes)
        │
        ▼
useEffect([pathname]) fires in DonnaAssistantButton
        │
        ├── saveDraftToSession() — saves active draft before state clear
        ├── Resets: activeMode, voiceTranscript, typedText, templateDraft
        ├── Resets: genericDraft, contextSummary, isVoiceListening, isSpeaking
        ├── Resets: onboardingStep, voiceGreetingStatus, wakeDetectedCommand
        ├── stopWakeListening() — stops wake phrase recognition
        ├── Resets: convState, communicationDraft, attendanceExceptionDraft
        └── NOTE: panelOpen is NOT reset — panel stays open
            NOTE: messages in DonnaVoiceReadyShell are NOT reset (different component)

Director clicks X / Escape
        │
        ▼
closePanel() fires
        │
        ├── setPanelOpen(false) — closes panel
        ├── realtimeDisconnect() — kills WebRTC connection
        ├── window.speechSynthesis.cancel() — stops TTS
        ├── stopServerTts() — stops server TTS
        ├── stopWakeListening() — stops wake phrase
        └── Resets all 30+ state values
```

---

## 4. All Stop/Close Triggers Found

### Voice Input Stops (Listening)

| Trigger | Location | What happens |
|---|---|---|
| User stops speaking (silence timeout) | Browser SpeechRecognition behavior | `recognition.onend` fires; in single-shot mode → `status='idle'`; no restart |
| `maxRetries=3` consecutive silence | `VoiceInputButton.tsx:177-183` | After 3 consecutive onend without transcript → `sessionActive=false`, shows "Voice stopped — tap to restart" |
| User clicks Stop button | `VoiceInputButton.tsx:118-128` (stopSession) | `sessionActiveRef.current=false`, recognition.stop(), `status='idle'` |
| Component unmounts | `VoiceInputButton.tsx:131-138` (useEffect cleanup) | `recognition.abort()` |
| Error (not 'no-speech') | `VoiceInputButton.tsx:164-168` | `recognitionRef.current=null`; error propagated via `onError` callback |
| Panel closes | `DonnaAssistantButton.tsx closePanel()` | Panel unmounts VoiceLayer; recognition aborts on unmount |
| Route change | `DonnaAssistantButton.tsx useEffect([pathname])` | `setIsVoiceListening(false)` |
| Wake phrase detected | `DonnaAssistantButton.tsx startWakeListening()` | Calls `stopWakeListening()` when phrase detected — recognition ends |
| Wake recognition error | `DonnaAssistantButton.tsx:624` | `setWakeListeningActive(false)` |
| Wake recognition natural end | `DonnaAssistantButton.tsx:629` | `setWakeListeningActive(false)` — NO RESTART |

### Voice Output Stops (Speaking/TTS)

| Trigger | Location | What happens |
|---|---|---|
| Utterance completes naturally | `SpeechSynthesisUtterance.onend` | `setIsSpeaking(false)`, `utteranceRef.current=null` |
| Utterance error | `SpeechSynthesisUtterance.onerror` | `setIsSpeaking(false)` |
| Panel closes | `closePanel()` | `window.speechSynthesis.cancel()` + `stopServerTts()` |
| Route change | `useEffect([pathname])` | Does NOT cancel speechSynthesis on route change — potential orphaned utterance |
| New speech starts | `speakAssistantText()` | Cancels any active utterance before queueing new one |
| Browser blocks autoplay | `useDonnaRealtimeVoice ontrack` → `el.play().catch()` | Realtime audio plays into nothing; speech unconfirmed |

### WebRTC Realtime Session Stops

| Trigger | Location | What happens |
|---|---|---|
| `disconnect()` called | `useDonnaRealtimeVoice.ts:51-64` | Closes PC + DC; audio element removed; status='closed' |
| `useEffect` cleanup (unmount) | `useDonnaRealtimeVoice.ts:374` | `disconnect()` called |
| Data channel closes | `dc.onclose` | `clearPending()` only — does NOT set status='closed' |
| Data channel error | `dc.onerror` | `clearPending()`, `status='error'` |
| Panel closes | `closePanel()` → `realtimeDisconnect()` | Full disconnect |
| `OPENAI_API_KEY` absent | `route.ts:46-53` | Returns 503 → `status='unavailable'` forever for the session |

### Panel State Stops

| Trigger | Location | What happens |
|---|---|---|
| User clicks X button | `closePanel()` | Everything resets |
| Escape key | `useEffect([panelOpen, closePanel])` in `DonnaAssistantButton` | `closePanel()` |
| `donna:open` custom event | `window.addEventListener('donna:open')` | Opens panel (but does not guarantee previous state) |
| Route change | `useEffect([pathname])` | Does NOT close panel; resets conversation state only |

---

## 5. Root Cause Analysis

### Why does DONNA not listen persistently after user clicks DONNA?

**Primary cause: `persistent=false` by default**

In `DonnaVoiceLayer.tsx:136-144`, `VoiceInputButton` is rendered without the `persistent` prop:
```tsx
<VoiceInputButton
  onTranscript={onVoiceTranscriptRaw}
  label={`Ask ${DONNA_PUBLIC_NAME}`}
  appendMode={false}
  onListeningChange={onListeningChange}
  onInterimTranscript={onInterimTranscript}
  onError={onVoiceError}
  onSupportedChange={onSupportedChange}
  // ← NO persistent={true} here
/>
```

`VoiceInputButton` defaults `persistent=false`, so `recognition.continuous=false`. After the first utterance, recognition ends. The director must manually click Mic again.

**The `persistent` prop IS implemented** (Sprint 641/642) with auto-restart + maxRetries guard. It just isn't being passed.

**Secondary cause: `useVoiceDictation` also uses `continuous=false`**

In `DonnaVoiceReadyShell`, `useVoiceDictation` is used:
```ts
recognition.continuous = false  // useVoiceDictation.ts:128
```
Same result — stops after each utterance. No persistent mode available in this hook.

### Why does DONNA feel like it disappears after a pause?

After a voice utterance in `DonnaVoiceReadyShell`:
1. `voice.status` goes from `'listening'` → `'done'`
2. `useEffect` in `DonnaVoiceReadyShell` detects `status === 'idle'` and triggers `handleSend()`
3. DONNA shows "Thinking..." while processing
4. Response appears in chat thread
5. Listening status bar disappears — no indication DONNA is still "here"
6. Director must manually click Mic again for next phrase

The UX communicates "DONNA answered, session over" when it should communicate "DONNA answered, still ready."

### Why does route change break the experience?

When director navigates (e.g., `/director` → `/director/players`):
```ts
// DonnaAssistantButton.tsx, useEffect([pathname])
setIsVoiceListening(false)   // voice stops
setIsSpeaking(false)         // speaking stops
stopWakeListening()           // wake phrase stops
setOnboardingStep(null)       // intro resets
setVoiceGreetingStatus('idle')
// ... 20+ more resets
```

The panel stays open but the director loses: active mode, voice state, template draft (saved to session), generic draft, pending voice answer, all interim state.

### What distinguishes the two DONNA implementations?

| Feature | DonnaAssistantButton (floating) | DonnaVoiceReadyShell (/director/donna) |
|---|---|---|
| Architecture | Floating panel with modal-style open/close | Embedded full-page chat thread |
| Voice input | `VoiceInputButton` (persistent=false, single-shot) | `useVoiceDictation` (continuous=false, single-shot) |
| Voice output | `speakAssistantText` + Realtime + Server TTS | None (text only) |
| Message persistence | Messages lost on panel close | Messages lost on page navigation |
| Context | `DonnaContextSummary` fetched on demand | `DirectorDonnaContext` loaded by server |
| State on route change | Resets but panel stays open | N/A (page-based) |
| Wake phrase | Supported | Not supported |
| Persistent listening | `maxRetries=3` when persistent=true | No persistent mode |

---

## 6. Browser/API Constraints

### SpeechRecognition

| Browser | Support | Notes |
|---|---|---|
| Chrome (desktop) | Full | Both SpeechRecognition and webkitSpeechRecognition |
| Edge (Chromium) | Full | Same as Chrome |
| Safari (macOS) | Partial | webkitSpeechRecognition available; may stop after silence |
| Firefox | None | Neither SpeechRecognition nor webkitSpeechRecognition |
| iOS Safari | Unreliable | webkitSpeechRecognition exists but recognition.onend fires frequently due to OS constraints; persistent mode breaks silently on iOS |

**Key browser constraint:** Even with `continuous=false` and `recognition.onend` firing, the browser may fire `onend` without a `no-speech` error — it just silently ends. The only robust way to detect this vs. user silence is the `maxRetries` guard in `VoiceInputButton`.

### OpenAI Realtime WebRTC

- **Requires `OPENAI_API_KEY` on server** — checked in `route.ts:46-53`. Returns 503 if absent.
- **Ephemeral token** — created per session via `POST /api/director/interview/realtime-session`. Token is short-lived.
- **`recvonly` transceiver** — DONNA output-only; does NOT send mic audio to OpenAI.
- **Autoplay policy** — browser blocks `el.play()` if no prior user gesture. `DonnaAssistantButton` gates Realtime connect behind user click, so this is handled. But if the page auto-loads the panel (e.g., via `donna:open` event from a script), audio may be blocked.
- **SDP exchange** — `POST https://api.openai.com/v1/realtime/calls` directly from browser. Requires CORS from OpenAI.

### speechSynthesis

- **Chrome/Safari:** Works but Chrome has a bug where synthesis silently stops after ~15 seconds if `speechSynthesis.speaking` stays true. The `utteranceRef` guard in `DonnaAssistantButton` partially addresses this.
- **Firefox:** Not available.
- **Autoplay:** Requires prior user gesture — correctly gated behind button click.
- **Mobile Safari:** Works but unreliable for long utterances.

---

## 7. Proposed State Machine

```
States:
  closed          — Panel not open, no voice resources held
  opening         — Panel animating in (brief)
  ready           — Panel open, idle, waiting for input
  listening       — Browser SpeechRecognition active
  processing      — User input received, DONNA computing response
  speaking        — TTS output playing (Realtime or browser)
  paused_active   — Between utterances (persistent mode); session still active
  reconnecting    — Realtime/voice dropped unexpectedly; attempting restart
  permission_error — Mic blocked by OS or browser
  fatal_error     — DONNA cannot function (API down, no fallback)

Transitions:
  closed     → opening       : User clicks DONNA button
  opening    → ready         : Panel animation complete
  ready      → listening     : User clicks Mic OR auto-start (if persistent)
  listening  → processing    : Final transcript received
  listening  → paused_active : Silence detected (persistent mode)
  listening  → permission_error : mic denied
  paused_active → listening  : Auto-restart fires (persistent)
  paused_active → ready      : User clicks Stop / maxRetries exceeded
  processing → speaking      : DONNA response ready + TTS output
  processing → ready         : DONNA response text-only (no TTS)
  speaking   → paused_active : TTS ends + persistent mode active
  speaking   → ready         : TTS ends + persistent mode off
  reconnecting → listening   : Reconnect succeeds
  reconnecting → permission_error : Reconnect fails after N attempts
  ANY        → closed        : User clicks X / Escape

Rules:
  - paused_active is NOT closed — DONNA session is still live
  - Silence → paused_active, NOT closed
  - Route change → no state transition (route is tracked internally, not a close)
  - permission_error and fatal_error always show text fallback
  - TTS failure → speaking → ready (silently, text already displayed)
```

---

## 8. Persistence Proposal

### What SHOULD persist across route changes (within one browser session)

| Item | Storage | Why |
|---|---|---|
| Panel open/closed | React state (currently) — unchanged | Correct: panel should stay open during director workflows |
| Conversation messages | Move to `DonnaSessionContextProvider` or a context ref | Currently lost when `DonnaVoiceReadyShell` unmounts on page navigation |
| Active voice session state (listening/paused_active) | Move to context | Currently reset on route change — should be preserved |
| Active draft (genericDraft, convState) | Already saved to sessionStorage via `donnaDraftPersistence.ts` | Correct — survives route change |
| Page context (which page, which object) | `DonnaSessionContextProvider` already tracks this | Correct |
| Microphone permission status | Browser OS | Read-only by app; no action needed |
| Voice availability (supported/not) | React state — reset on route change | Should be cached in ref not state; detecting support is instantaneous |

### What should NOT persist

| Item | Reason |
|---|---|
| Raw audio | Privacy and security |
| Sensitive coach notes in localStorage | Parent/player safety |
| Interim voice transcripts | Stale; should be discarded after use |
| Private child data | Visibility guardrails |
| Service role keys | Security |
| Parent/player unsafe data | Confirmed guardrails in `donnaParentSafeRules.ts` |
| Realtime WebRTC connection across page reloads | Not possible; ephemeral tokens expire |

---

## 9. Exact Files That Need Changes (by Sprint)

### Sprint 683 — Persistent Session State Fix
**Goal:** Prevent route change from destroying DONNA's conversational state.

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Remove `setIsVoiceListening(false)`, `setIsSpeaking(false)`, `stopWakeListening()` from route-change `useEffect`. Only update page context, save draft — do not reset voice/speaking state. |
| `src/components/donna/DonnaSessionContextProvider.tsx` | Add `messages: ChatMessage[]`, `setMessages`, `voiceState` to context so chat history can survive route changes. |

### Sprint 684 — Speech Recognition Auto-Restart Fix
**Goal:** Make voice listening persistent (COO-style) — stays active until explicit stop.

| File | Change |
|---|---|
| `src/components/assistant/DonnaVoiceLayer.tsx` | Pass `persistent={true}` and `maxRetries={5}` to `VoiceInputButton`. |
| `src/lib/donna/useVoiceDictation.ts` | Add `continuous` option (defaults to false for backward compat); expose `restart()` method. |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | On `voice.status === 'done'`, call `voice.reset()` then `voice.start()` to auto-restart in persistent mode. |

### Sprint 685 — Speaking/TTS/Reconnection Fix
**Goal:** Voice output uses best available path; gracefully recovers from TTS failure.

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Add `speaking → paused_active` transition after TTS ends if persistent session is active. |
| `src/components/assistant/useDonnaRealtimeVoice.ts` | Add auto-reconnect on `dc.onclose` when `status` was `'ready'` or `'speaking'` (not explicit user disconnect). |
| `src/app/api/donna/tts/route.ts` | Verify TTS fallback is working; confirm cascade browser→server→silent is wired. |

### Sprint 686 — Global Provider + Route Persistence Fix
**Goal:** DONNA conversation context and message history survive route changes.

| File | Change |
|---|---|
| `src/components/donna/DonnaSessionContextProvider.tsx` | Add `messages`, `voiceState` to context. Provide message persistence across route changes. |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Read/write messages from context instead of local state. |
| `src/app/director/layout.tsx` | No change needed — `DonnaSessionContextProvider` already wraps layout. |

### Sprint 687 — Voice UX State Display + Transcript Polish
**Goal:** Director always knows what DONNA state she is in.

| File | Change |
|---|---|
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Add state indicator: Ready / Listening / Thinking / Speaking / Paused but active / Error / Mic blocked. Add "Tap mic to resume" in paused_active state. |
| `src/components/donna/DonnaChatThread.tsx` | Add persistent "DONNA is here" footer badge. |
| `src/components/assistant/DonnaVoiceLayer.tsx` | Show persistent session indicator when persistent=true. |

### Sprint 688 — End-to-End Voice QA Against Golden Paths
**Goal:** Verify the fixed system against the 3 primary demo voice scenarios.

| File | Change |
|---|---|
| `docs/DONNA_VOICE_GOLDEN_PATH_QA_688.md` | New — QA checklist: open DONNA, speak, pause, navigate, come back, speak again. Voice should still work. |

---

## 10. Risk Assessment

| Risk | Severity | Notes |
|---|---|---|
| `persistent=true` may loop on mobile iOS | High | iOS Safari fires `onend` aggressively; `maxRetries=3` would be hit quickly. Add platform detection. |
| Route-change state preservation may cause stale context | Medium | If director navigates from player A to player B, DONNA may answer about player A. Fix: update page context on route change without resetting voice. |
| Removing speech cancel from `closePanel` could leave orphaned audio | Low | speechSynthesis.cancel() in closePanel is correct; do not remove it. |
| Message context in provider adds memory overhead | Low | 50-100 messages max; well within browser memory budget. |
| Realtime auto-reconnect may create duplicate sessions | Medium | Gate behind `isConnectingRef` already exists. Check before reconnect. |
| `persistent=true` by default could start mic unexpectedly | None | `VoiceInputButton` requires user click to start even in persistent mode. No autostart. |

---

## 11. Recommended Sprint Sequence

```
Sprint 683 — Persistent Session State (route change no longer kills voice state)
Sprint 684 — Speech Recognition Auto-Restart (persistent=true in VoiceLayer)
Sprint 685 — TTS/Reconnection Fix (voice output survives disconnect)
Sprint 686 — Global Provider + Message Persistence (chat history survives routes)
Sprint 687 — Voice UX State Display (director knows what DONNA is doing)
Sprint 688 — End-to-End Voice QA (verify golden paths)
```

Do not combine 683 + 684 into one sprint — they touch overlapping state and should be tested independently.

---

## 12. Manual QA Checklist

### Basic voice flow (must pass before any sprint ships)

| Test | Expected | Pass/Fail |
|---|---|---|
| Open DONNA panel | Panel opens smoothly | |
| Click Mic | Listening indicator appears | |
| Speak: "What needs attention?" | DONNA responds with text | |
| Speak second phrase without re-clicking | DONNA responds (requires Sprint 684) | |
| Pause 5 seconds | DONNA shows "paused but active" (requires Sprint 684) | |
| Navigate to `/director/players` | DONNA panel stays open | |
| Speak after navigation | DONNA responds with updated page context (requires Sprint 683) | |
| Click X to close | Panel closes cleanly | |
| Reopen DONNA | Previous messages visible (requires Sprint 686) | |
| Mic blocked | Shows "Mic access blocked" message, text input still works | |
| No OPENAI_API_KEY | Falls back to browser TTS, no error shown to user | |

### COO behavior (must pass for demo)

| Test | Expected | Pass/Fail |
|---|---|---|
| Ask "What needs attention?" | Returns real attention items or honest fallback | |
| Ask "How many pending reviews?" | Returns count from live data | |
| Ask "What page am I on?" | DONNA reflects current route label | |
| Ask "Show me the review queue" | DONNA navigates or provides link | |
| Ask "Draft a parent update" | Guided draft flow starts | |
| Say "approve it" | DONNA blocks: "Use the on-screen button" | |
| Ask about a specific player | DONNA answers from context or asks for more info | |

### Safety QA

| Test | Expected | Pass/Fail |
|---|---|---|
| DONNA recording before user click | Must NEVER happen | |
| Protected phrase ("save it") | Blocked, redirect to button | |
| Coach note visible to parent | Never | |
| Player A data visible from Player B profile | Never | |

---

## 13. Go/No-Go Decision for Demo Voice Usage

### Current state (as of Sprint 682 audit)

**Text chat at `/director/donna` page:** ✅ GO — reliable, accurate, live data, no voice required.

**Voice input (DonnaVoiceReadyShell):** ⚠️ CONDITIONAL — works in Chrome desktop with manual Mic click per phrase. Not persistent. Acceptable for demo if presenter expects to click Mic each time.

**Voice output (TTS):** ⚠️ CONDITIONAL — requires `OPENAI_API_KEY` for Realtime, else browser TTS. Browser TTS is acceptable for demo quality.

**Continuous COO voice (always-listening):** ❌ NO-GO — not yet implemented. Requires Sprint 684.

### Recommendation for Brian demo

1. **Do:** Demonstrate text chat at `/director/donna` as the primary DONNA interaction.
2. **Do:** Show one voice phrase ("What needs attention?") to demonstrate the capability exists.
3. **Don't:** Rely on continuous voice for the demo. Single-shot is fine to show.
4. **Don't:** Leave voice recognition running for an extended demo — the single-shot model will confuse the audience.
5. **Do:** Make clear DONNA reads live data from the academy.

**Top reason DONNA stops:** Voice input uses `persistent=false` by default. The fix (Sprint 684: pass `persistent={true}` to `VoiceInputButton` in `DonnaVoiceLayer`) is a single prop change and is safe to implement without migration or schema changes.

---

## 14. Files Audited (Read Only)

| File | Audit notes |
|---|---|
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Voice-to-chat shell; `useVoiceDictation`; auto-send on status='idle'; no persistent mode |
| `src/components/assistant/DonnaAssistantButton.tsx` | 3600-line orchestrator; all voice/panel state; route-change reset; closePanel |
| `src/components/donna/DonnaChatThread.tsx` | Pure UI; messages, quick actions, mic toggle |
| `src/components/donna/DonnaSessionContextProvider.tsx` | Route tracking only; no message persistence |
| `src/components/assistant/useDonnaRealtimeVoice.ts` | WebRTC output-only; connect/speak/disconnect |
| `src/lib/donna/useVoiceDictation.ts` | continuous=false; single-shot; no auto-restart |
| `src/lib/donna/useSpeechOutput.ts` | Browser speechSynthesis wrapper; mute/unmute |
| `src/app/director/donna/DonnaDirectorShellClient.tsx` | Thin wrapper rendering DonnaVoiceReadyShell |
| `src/app/api/director/interview/realtime-session/route.ts` | Ephemeral token; 503 if no OPENAI_API_KEY; director-only |
| `src/components/donna/DonnaAssistantShell.tsx` | Presentational shell only; no state |
| `src/components/assistant/VoiceInputButton.tsx` | persistent prop (Sprint 641); maxRetries guard (Sprint 642); NOT passed persistent=true from caller |
| `src/components/assistant/DonnaVoiceLayer.tsx` | Renders VoiceInputButton without persistent=true |
| `src/components/assistant/DonnaPanelShell.tsx` | Documentation stub explaining why panel wasn't extracted |
| `src/app/director/layout.tsx` | Mounts DonnaAssistantButton globally; DonnaSessionContextProvider wraps layout |
| `src/app/director/donna/page.tsx` | Full-page DONNA command center with DonnaVoiceReadyShell |
| `docs/DONNA_VOICE_CHAT_AUDIT_650.md` | Prior audit; confirms persistent mode and auto-restart were implemented in 641/642 |
| `docs/CHANGELOG.md` | Sprint history |
