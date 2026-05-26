# Sprint 822 — DONNA Developer Tools Production Guard V1

**Date:** 2026-05-26
**Sprint:** 822
**Type:** Production polish — conditional render guard
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — no errors)

---

## Why this sprint

Sprint 815 audit finding:

> **Root Cause 5 — Developer Tools visible to real users**
> `DonnaDeveloperTools` renders unconditionally (no `process.env.NODE_ENV !== 'production'` guard). It contains voice diagnostic information, test buttons, audit trail access, and session storage keys — none of which belong in a production director panel.

Additionally, a voice quality status pill showing TTS source labels ("Premium Donna voice active", "Device voice active") was rendering unconditionally in production — exposing which TTS subsystem fired after each DONNA speech event.

Sprint 822 corrects the one remaining gap identified during the full audit.

---

## Audit Findings

All surfaces audited before any code was written:

| Surface | File | Production-visible? | Action |
|---|---|---|---|
| `DonnaDeveloperTools` component | `DonnaDeveloperTools.tsx:81` | ❌ Already hidden — `if (NODE_ENV === 'production') return null` | No change needed |
| `DonnaDeveloperTools` render site | `DonnaAssistantButton.tsx:4469` | ❌ Already hidden — `{NODE_ENV !== 'production' && ...}` | No change needed (double-guarded) |
| `DonnaVoiceDiagnostics` component | `DonnaVoiceDiagnostics.tsx:39` | ❌ Already hidden — `if (NODE_ENV !== 'development') return null` | No change needed |
| Header status badges (Thinking / Speaking / Listening / Paused / Mic blocked / Ready) | `DonnaAssistantButton.tsx:3375–3417` | ✅ Visible — user-facing | **Preserved — safe labels** |
| `lastServerTtsInfo` voice quality pill | `DonnaAssistantButton.tsx:4449–4466` | ⚠️ **Visible in production** | **Fixed — gated in this sprint** |

---

## What was changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**Lines 4449–4466 — `lastServerTtsInfo` voice quality status pill**

Before:
```tsx
{lastServerTtsInfo && (
  <div className="px-4 pb-1 opacity-50">
    <p className="text-[10px] text-text-muted flex items-center gap-1.5 leading-none">
      <span className={`… ${lastServerTtsInfo.source === 'contract_tts' ? 'bg-lime' : …}`} />
      {lastServerTtsInfo.source === 'contract_tts'
        ? 'Premium Donna voice active'
        : lastServerTtsInfo.source === 'browser_tts'
        ? 'Device voice active'
        : 'Text-only mode'}
    </p>
  </div>
)}
```

After:
```tsx
{process.env.NODE_ENV !== 'production' && lastServerTtsInfo && (
  <div className="px-4 pb-1 opacity-50">
    …
  </div>
)}
```

**What changed:** One condition added — `process.env.NODE_ENV !== 'production' &&`.

**What did not change:** The `lastServerTtsInfo` state variable, its setter, or any logic that populates it. The pill still appears in local development for diagnostic purposes.

---

## What is hidden in production (post-822)

| Surface | What it showed | Status |
|---|---|---|
| `DonnaDeveloperTools` | Voice diagnostic state, test buttons (Reset intro, Test browser voice, Start/Stop wake listening), last TTS source, session storage keys, audit trail, preferences localStorage, COO commands state, draft session storage state, golden path checklist | Hidden (was already guarded before this sprint) |
| `DonnaVoiceDiagnostics` | Voice mode label, realtime status, greeting status, mic listening state, wake phrase state, SpeechRecognition support, test buttons (Test Realtime, Test Browser Voice, Reset Voice), QA checklist | Hidden (was already guarded before this sprint) |
| `lastServerTtsInfo` voice quality pill | "Premium Donna voice active" / "Device voice active" / "Text-only mode" with color-coded dot indicating which TTS subsystem fired | **Hidden in this sprint** |

---

## What remains available in development

All diagnostic surfaces remain fully functional in `NODE_ENV !== 'production'` (local dev, staging if NODE_ENV is not 'production'):

- `DonnaDeveloperTools` — full developer panel including voice state, test buttons, audit trail, draft state
- `DonnaVoiceDiagnostics` — voice QA harness with realtime/browser TTS testing
- `lastServerTtsInfo` voice quality pill — TTS source indicator with "Premium Donna voice active" / "Device voice active" labels

---

## User-facing status labels preserved

These labels in the panel header are **not** diagnostic — they reflect what DONNA is actively doing. They remain visible in production:

| Label | When shown | Color |
|---|---|---|
| `Thinking…` | Context or queue loading, not speaking | Blue (`#0A84FF`) |
| `Speaking` | `isSpeaking === true` | Purple (`#8b5cf6`) |
| `Listening` | Mic is capturing input | Red (`#FF3B30`) |
| `Paused` | Mic paused (e.g., TTS speaking) | Orange (`#FF9500`) |
| `Mic blocked` | `voicePermissionError` set | Orange (`#FF9500`) |
| `Ready` | Voice supported, mic idle | Lime (muted, `rgba(200,255,0,0.45)`) |

These are implemented at `DonnaAssistantButton.tsx:3375–3417` and are unchanged by this sprint.

---

## Safety guardrails preserved

| Rule | Status |
|---|---|
| Voice never directly mutates core data | Unchanged — `isProtectedVoicePhrase()` still enforced |
| All mutations go through `proposed_actions` | Unchanged — architecture red line not touched |
| `execute_approved_action()` only execution path | Unchanged |
| DONNA does not expose parent/player private data | Unchanged — `parentSafeResponseRules.ts` untouched |
| No audio stored | Unchanged — no audio blob hits storage |
| Developer tools hidden in production | ✅ Confirmed for all 3 surfaces |

---

## What was NOT changed

- `useDonnaRealtimeVoice.ts` — untouched
- `donnaServerTtsClient.ts` — untouched
- `DonnaVoiceLayer.tsx` — untouched
- `DonnaDeveloperTools.tsx` — untouched (already guarded)
- `DonnaVoiceDiagnostics.tsx` — untouched (already guarded)
- All DONNA routing, voice paths, persistence, and backend — untouched
- No SQL, migrations, RLS, seed files, or env files touched

---

## TypeScript result

```
npx tsc --noEmit
# exit 0 — no errors
```

---

## Recommended Sprint 823

**Sprint 823 — DONNA Panel Default View Simplification V1**

Target: The panel currently renders 7+ information sections simultaneously (greeting, conversation thread, command response, context summary, predictive recommendations, daily brief, attention report, mode buttons). The director sees everything at once with no visual hierarchy.

Recommended change: Collapse `Suggestions`, `Mode Buttons`, `Daily Brief`, `Attention Report`, and `Context Summary` behind 4 disclosure buttons. Default panel = conversation thread + input only.

Sprint 815 audit section: Part 2C — Target side panel default view.
Risk: Medium — changes what directors see by default. Test carefully.
Scope: UI rendering only — no state changes, no voice changes, no backend.
