# Sprint 826 — DONNA Panel Input Focus After Command V1

**Date:** 2026-05-26
**Sprint:** 826
**Type:** Conversational UX — post-submit input focus
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)

---

## Why this sprint

After the director submits a DONNA command, the text input loses focus (standard browser behavior when a button is clicked or Enter is pressed). If the director wants to ask a follow-up question — "Why?", "Show me that player", "What about the other two?" — they have to click back into the input first. This creates a small but repeated friction point in every DONNA conversation.

Sprint 826 adds automatic input refocus on the two conversational reply paths. Workflow-launching paths (draft creation, mode switching, loading cards) are explicitly excluded — those require the director to read before typing.

---

## Submit Path Audit

`handleCommandSubmit` is a synchronous function at line 2968 with approximately 15 early-return branches. Every branch ends with `setTypedText('')`. The two branches suited for refocus are:

### ✅ Refocus: Follow-up resolver (lines 3150–3164)
Appends to `cooThread`, sets `commandResponse`, speaks DONNA's reply. A text-based conversational exchange where the director would naturally want to type a follow-up.

### ✅ Refocus: COO router / fallthrough (lines 3188–3219)
`handleDonnaCooPrompt` (or `detectAndHandleCommand`) handles the command and produces a `setCommandResponse`. This is the main conversational path for most DONNA questions. Reaches `setTypedText('')` at end of function (no `return`).

### ❌ No refocus: all early-return paths

| Path | Why excluded |
|---|---|
| Close panel | Panel dismissed — nothing to focus |
| Onboarding | Multi-step interview; director reads next question aloud |
| New controller draft | Draft workflow takes over the panel |
| Active draft / slot-fill | Director is answering draft questions |
| Multi-step plan | Plan summary displayed; director reads |
| Template creation | UI switches to template questionnaire (does not clear `typedText`) |
| Generic task | Task workflow UI takes over |
| COO command (attendance / recommendation) | Draft being created |
| Review queue | Panel switches to queue mode |
| Daily brief / attention | Async card loads; director reads results |
| Predictive / context query | Context loading; card appears |
| UI dispatch | Could navigate; director may move away |

---

## What was changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. Added `focusDonnaInput()` helper (added just before `handleCommandSubmit`):**

```tsx
// Sprint 826 — Refocus the typed input after a conversational command so follow-up
// questions feel natural without requiring a click. Only runs on non-touch devices
// (desktop/laptop): guards against re-opening the mobile virtual keyboard after submit.
function focusDonnaInput() {
  if (typeof window === 'undefined') return
  if (navigator.maxTouchPoints > 0) return
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
    el?.focus()
  })
}
```

**`requestAnimationFrame` reason:** Runs after React re-renders the DOM. Without it, `focus()` may fire before the input has been re-rendered with its cleared value, causing inconsistent behavior in some browsers.

**`navigator.maxTouchPoints > 0` guard:** Touch-capable devices (phones, tablets) use a virtual keyboard that dismisses when the director submits. Calling `focus()` immediately after would re-open it before they can read DONNA's reply. This guard skips the refocus on all touch-capable devices.

**2. Follow-up resolver path (line 3163) — `focusDonnaInput()` after `setTypedText('')`:**

```tsx
setTypedText('')
focusDonnaInput() // Sprint 826 — conversational reply; ready for follow-up
return
```

**3. Final fallthrough (line 3219) — `focusDonnaInput()` after `setTypedText('')`:**

```tsx
setTypedText('')
focusDonnaInput() // Sprint 826 — conversational reply; ready for follow-up
```

---

## Guard conditions

| Condition | Why |
|---|---|
| `typeof window === 'undefined'` | SSR safety — `document.querySelector` is a browser-only API |
| `navigator.maxTouchPoints > 0` | Touch device guard — prevents virtual keyboard pop-up after submit |
| Only called on conversational paths | Workflow paths use early `return` — they never reach the two call sites |

---

## Before / after behavior

| Event | Before Sprint 826 | After Sprint 826 |
|---|---|---|
| Director types "What's our retention trend?" → Enter | Input clears, focus lost | Input clears, focus returned (desktop) |
| Director wants to ask "Why?" as follow-up | Must click into input first | Can type immediately |
| Director launches "Create a template" | Template questionnaire opens | Unchanged — no refocus on workflow paths |
| Director asks for daily brief | Brief card loads | Unchanged — no refocus on async-card paths |
| Director submits on mobile/tablet | Input blurs, keyboard dismisses | Unchanged — touch guard prevents keyboard re-open |
| Director uses voice input | Mic handles focus flow | Unchanged — `focusDonnaInput` not in voice path |

---

## What was NOT changed

- `DonnaVoiceLayer.tsx` — untouched
- `DonnaWorkflowCards.tsx` — untouched
- All voice behavior — untouched
- Mic auto-start — unchanged; `focusDonnaInput` focuses the text input only, not the mic
- Sprint 823 disclosure behavior — unchanged
- Sprint 824 inner-thread scroll — unchanged
- Sprint 825 first-reply reveal — unchanged
- Panel layout, mobile responsive classes — unchanged
- Backend, routing, persistence — untouched
- No SQL, migrations, RLS, seed, or env files touched

---

## Mobile behavior

- **Touch-capable devices:** `navigator.maxTouchPoints > 0` evaluates true → `focusDonnaInput` returns immediately → no focus call → keyboard behavior unchanged
- **Desktop/laptop:** `navigator.maxTouchPoints` is `0` on most devices → refocus runs via `requestAnimationFrame`
- **Hybrid devices (Surface, iPad with keyboard):** `maxTouchPoints > 0` even with a hardware keyboard → no auto-refocus. This is the safe default; hybrid users are a small minority and the behavior degrades gracefully (they still click to type, as before this sprint)

---

## Safety guardrails preserved

| Rule | Status |
|---|---|
| Voice never directly mutates core data | Unchanged |
| All mutations through `proposed_actions` | Unchanged |
| `execute_approved_action()` only execution path | Unchanged |
| DONNA does not expose parent/player private data | Unchanged |
| No audio stored | Unchanged |
| Developer tools hidden in production | Unchanged (Sprint 822) |

---

## TypeScript result

```
npx tsc --noEmit
# Exit: 0 — no errors
```

---

## Recommended Sprint 827

**Sprint 827 — DONNA Panel Thinking State Indicator Accuracy V1**

Target: The "Thinking…" badge in the DONNA panel header appears when `isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading`. However, the main COO conversational router (`handleDonnaCooPrompt`) is synchronous — it doesn't set any loading state. For conversational exchanges, DONNA replies instantly and the director never sees the "Thinking" indicator. For async paths (daily brief, attention, context), the indicator fires correctly.

The gap: directors who know from other AI tools to expect a "thinking" moment may submit a command and wonder if it registered when no indicator appears.

Recommended change: Add a brief `isProcessing` state that fires for one frame on any command submit and clears after DONNA produces a response. This gives visual confirmation that the command was received.

Sprint 815 audit section: Part 2G — Command submission feedback.
Risk: Low — one boolean state + one useEffect in `DonnaAssistantButton.tsx`.
Scope: `DonnaAssistantButton.tsx` only.
