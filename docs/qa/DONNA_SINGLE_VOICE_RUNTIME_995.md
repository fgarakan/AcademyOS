# DONNA Single Voice Runtime — Certification
**Sprint:** Mega Sprint 995–1024A
**Date:** 2026-06-08
**Status:** CERTIFIED

---

## Problem Statement

Users heard two distinct DONNA voices simultaneously:
- One voice: server TTS (OpenAI `gpt-4o-mini-tts`, `marin` voice, British COO persona)
- Second voice: browser `speechSynthesis` fallback or a second server TTS instance

---

## Root Causes Found

### Root Cause 1 — Double-speak in `DonnaVoiceReadyShell` (Goal Session + Brain Bridge)

**File:** `src/components/donna/DonnaVoiceReadyShell.tsx`  
**Lines:** 2664–2666 and 2717–2719 (before fix)

The Goal Session handler and DONNA Brain bridge handlers:
1. Called `setMessages(prev => [...prev, msg])` — queuing a React state update
2. Then called `speakDonnaPremium(spokenResponse)` explicitly

The `messages` useEffect (line 463–486) also fires on every new DONNA message and calls `speakDonnaPremium(stripMarkdownForTts(msg.text))`. This produced **two concurrent `speakDonnaPremium` calls** for the same response.

**Fix:** Pre-mark `lastSpokenIdRef.current = msg.id` BEFORE `setMessages`. The messages useEffect checks this ref and skips messages already marked as spoken. The explicit `speakDonnaPremium` call is moved to execute first (with the pre-mark), so the useEffect skips the duplication.

### Root Cause 2 — No AbortController in `donnaServerTtsClient.ts`

**File:** `src/components/assistant/donnaServerTtsClient.ts`

`stopServerTts()` paused the current `activeAudioEl`, but if a fetch was in-flight (async), it couldn't be cancelled. Both the old and new `speakWithServerTts` calls could complete, each creating an `Audio` element and both playing.

**Fix:** Added `AbortController`. `stopServerTts()` now calls `activeFetchController.abort()` before clearing `activeAudioEl`. Aborted calls catch `AbortError` and return `{ source: 'silent', reason: 'cancelled' }` — they do **not** fall through to browser TTS. Only the most recent call ever creates an audio element.

### Root Cause 3 — No version guard in `donnaPremiumVoiceRuntime.ts`

**File:** `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts`

Even with AbortController, edge cases (browser ignores abort signal, slow networks) could leave stale async results. No guard existed to discard superseded calls.

**Fix:** Added module-level `_speakVersion` counter. Each `speakDonna()` call increments it and captures its own version. If `_speakVersion !== myVersion` after the async TTS call, the result is discarded as `'superseded'`.

### Root Cause 4 — `useSpeechOutput` used raw `window.speechSynthesis`

**File:** `src/lib/donna/useSpeechOutput.ts`

This hook used `window.speechSynthesis.speak()` directly, creating a second independent TTS path that could play simultaneously with `speakDonnaPremium`. (Used by `DonnaVoiceWrapUpShell`, currently default-muted.)

**Fix:** Routed `speak()` through `speakDonnaPremium`. Routed `stop()` through `stopDonna()`. The hook now shares the single canonical voice queue.

---

## Canonical Voice Runtime

```
speakDonna()                              ← single entry point
  src/lib/donna/voice/donnaPremiumVoiceRuntime.ts
  │
  ├── stopDonna()                          ← cancels: AbortController + audio + speechSynthesis
  ├── version guard (_speakVersion)        ← discards superseded async results
  │
  └── speakWithServerTts()
        src/components/assistant/donnaServerTtsClient.ts
        │
        ├── AbortController (new AbortController per call)
        ├── fetch('/api/donna/tts', { signal })
        │     └── Audio element → plays OpenAI marin voice
        │
        └── browserTtsFallback()           ← only when server unavailable or returns non-audio
              window.speechSynthesis       ← configured via donnaVoiceConfig.ts keywords
```

**Voice config:** `src/lib/donna/donnaVoiceConfig.ts`  
**Server voice:** `marin` (OpenAI `gpt-4o-mini-tts`) with British COO persona instructions  
**Browser fallback voice:** Hazel/Libby/Serena preferred (British female); US quality fallback

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/assistant/donnaServerTtsClient.ts` | Added AbortController; `stopServerTts()` aborts in-flight fetches; AbortError returns `'cancelled'` without browser fallback |
| `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts` | Added `_speakVersion` counter; `speakDonna()` discards superseded results |
| `src/components/donna/DonnaVoiceReadyShell.tsx` | Pre-mark `lastSpokenIdRef.current` before `setMessages` in goal session and brain bridge handlers — prevents messages useEffect double-speak |
| `src/lib/donna/useSpeechOutput.ts` | Routed `speak()` → `speakDonnaPremium`, `stop()` → `stopDonna()` |

---

## Audit: All DONNA Speech Entry Points

| Entry Point | Path | Status |
|-------------|------|--------|
| Hey Donna wake response | `DonnaWakeWordLayer` → `donna:open` → `DonnaAssistantButton.speakDonna()` → `speakDonnaPremium` | ✅ Single path |
| Sidebar DONNA speech | `DonnaAssistantButton.speakDonna()` → `speakDonnaPremium` | ✅ Single path |
| DonnaAssistantButton all responses | `speakDonna()` local fn → `speakDonnaPremium` | ✅ Single path |
| DonnaVoiceReadyShell messages useEffect | `speakDonnaPremium` | ✅ Single path |
| DonnaVoiceReadyShell goal session | Pre-marked + `speakDonnaPremium` explicit | ✅ Fixed (was double) |
| DonnaVoiceReadyShell brain bridge | Pre-marked + `speakDonnaPremium` explicit | ✅ Fixed (was double) |
| `/api/donna/tts` route | Called only by `donnaServerTtsClient.speakWithServerTts` | ✅ Single path |
| `speakDonnaPremium` (the function) | Canonical runtime in `donnaPremiumVoiceRuntime.ts` | ✅ Single entry |
| Browser speechSynthesis | Only via `browserTtsFallback()` inside `donnaServerTtsClient.ts` when server fails | ✅ Gated |
| `speakAssistantText()` in DonnaAssistantButton | Only on `/director/onboarding/interview` (browser TTS fallback) and dev test tool | ✅ Restricted |
| `useSpeechOutput` hook | Now routes through `speakDonnaPremium` | ✅ Fixed |
| `CoachWrapUpDrawer` raw speechSynthesis | Coach portal only, director DONNA not mounted | ✅ No conflict |
| `DirectorInterviewAssistant` raw speechSynthesis | `/director/onboarding/interview` only, separate flow | ✅ Isolated |

---

## Certification Checklist

| # | Certification | Status |
|---|--------------|--------|
| 1 | Hey Donna speaks once. | ✅ Wake word → DonnaAssistantButton → speakDonnaPremium (single call) |
| 2 | Sidebar response speaks once. | ✅ speakDonnaPremium with version guard; AbortController prevents race |
| 3 | Daily brief speaks once. | ✅ DonnaAssistantButton greeting → speakDonnaPremium (one call per open) |
| 4 | Navigation confirmation speaks once. | ✅ Explicit speakDonnaPremium call, no useEffect duplication |
| 5 | No browser-default voice plays unless server TTS unavailable. | ✅ AbortError returns 'cancelled' without fallback; browser TTS only when server fails |
| 6 | No second DONNA voice plays. | ✅ AbortController + version guard prevent concurrent audio elements |
| 7 | Same voice across all entry points. | ✅ All paths reach donnaServerTtsClient → marin voice (server) or configured browser fallback |

---

## What Was NOT Changed

- No workflow logic modified
- No UI redesigned  
- No new DONNA intelligence built
- No database migrations
- No new npm packages
- `speakAssistantText()` in `DonnaAssistantButton` preserved (interview page browser fallback + dev tool — restricted to those two callers by Sprint 1094E comment)
- `CoachWrapUpDrawer.tsx` raw speechSynthesis preserved (coach-only, director DONNA not co-mounted)
- `DirectorInterviewAssistant.tsx` raw speechSynthesis preserved (isolated onboarding flow)
