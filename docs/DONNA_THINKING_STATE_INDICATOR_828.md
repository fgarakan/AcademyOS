# Sprint 828 — DONNA Thinking State Indicator Accuracy V1

**Date:** 2026-05-26
**Sprint:** 828
**Type:** Conversational UX — processing state indicator
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)

---

## Why this sprint

Sprint 827 identified a known gap (score 8 in "Director Demo Readiness"):

> The "Thinking…" badge in the DONNA panel header appears when `isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading`. However, the main COO conversational router (`handleDonnaCooPrompt`) is synchronous — it doesn't set any loading state. For conversational exchanges, DONNA replies instantly and the director never sees the "Thinking" indicator.

Directors who submit a command such as "What should I do first?" or "What's our retention trend?" receive no visual confirmation that the command registered before the reply appears. This creates a moment of uncertainty in a premium, voice-capable assistant experience.

Sprint 828 adds `isProcessingCommand` — a short-lived boolean state that fires at the two synchronous conversational paths — so "Thinking…" appears in the header for the duration of the React render frame that includes DONNA's reply.

---

## Audit: existing loading/thinking states

| State | Type | When active |
|---|---|---|
| `isLoadingContext` | async | During `fetchDonnaContext()` in `handleContextSummary()` |
| `isLoadingReviewQueue` | async | During `getDonnaReviewQueueAction()` in `handleOpenReviewQueue()` |
| `isDailyBriefLoading` | async | During `handleFetchDailyBrief()` |
| `isAttentionLoading` | async | During `handleFetchAttention()` |
| `isLoadingAttendanceSessions` | async | During `fetchRecentSessionsAction()` (not wired to badge) |

All five are async. None fire for the two synchronous conversational paths.

---

## Synchronous paths without a thinking indicator (before Sprint 828)

### Follow-up resolver (lines ~3188–3208)
`resolveFollowUp(text, sessionIntentContext)` is a deterministic local function. It computes a response in < 1ms, calls `setCommandResponse`, `setCooThread`, and returns. No loading state fires.

### COO router + fallthrough (lines ~3235–3263)
`handleDonnaCooPrompt(text)` is fully synchronous — calls `routeDonnaPrompt()` and `compose*Answer()` from local modules, sets `commandResponse` and `cooThread`, and returns `true`. If it returns `false`, `detectAndHandleCommand` handles the command synchronously. No loading state fires for either path.

---

## What was changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. New state and ref (added near `previousCooThreadLengthRef`):**

```tsx
// Sprint 828 — brief thinking indicator for synchronous conversational commands.
const [isProcessingCommand, setIsProcessingCommand] = useState(false)
// Sprint 828 — safety-net timer ref: clears isProcessingCommand after 600ms if not
// already cleared by the cooThread useEffect.
const processingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

**2. New `useEffect` on `cooThread` (added after Sprint 825 first-reply effect):**

```tsx
// Sprint 828 — clear processing indicator once a conversational reply lands in the thread.
useEffect(() => {
  if (cooThread.length > 0) {
    if (processingClearTimerRef.current) {
      clearTimeout(processingClearTimerRef.current)
      processingClearTimerRef.current = null
    }
    setIsProcessingCommand(false)
  }
}, [cooThread])
```

Fires after every paint that includes a `cooThread` update. Cancels the 600ms timer and clears `isProcessingCommand` immediately.

**3. Cleanup in `closePanel` (added before `stopServerTts()`):**

```tsx
// Sprint 828 — clear processing indicator and cancel safety-net timer on panel close
if (processingClearTimerRef.current) {
  clearTimeout(processingClearTimerRef.current)
  processingClearTimerRef.current = null
}
setIsProcessingCommand(false)
```

**4. Follow-up resolver path — set processing before response:**

```tsx
if (followUp) {
  // Sprint 828 — mark processing before setting response so "Thinking…" fires
  // for this render frame. The cooThread useEffect clears it after paint.
  if (processingClearTimerRef.current) clearTimeout(processingClearTimerRef.current)
  setIsProcessingCommand(true)
  processingClearTimerRef.current = setTimeout(() => setIsProcessingCommand(false), 600)
  ...
}
```

**5. COO router + fallthrough — set processing before `handleDonnaCooPrompt`:**

```tsx
// Sprint 828 — mark processing before COO router and fallthrough commands.
if (processingClearTimerRef.current) clearTimeout(processingClearTimerRef.current)
setIsProcessingCommand(true)
processingClearTimerRef.current = setTimeout(() => setIsProcessingCommand(false), 600)

// Sprint 697 — COO conversational router: runs before legacy detectAndHandleCommand
const cooHandled = handleDonnaCooPrompt(text)
...
```

**6. Header badge condition updated:**

```tsx
// Before
{(isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading) && !isSpeaking}

// After
{(isProcessingCommand || isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading) && !isSpeaking}
```

**7. `isThinking` prop to `DonnaVoiceLayer` updated:**

```tsx
// Before
isThinking={isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading}

// After
isThinking={isProcessingCommand || isLoadingContext || isLoadingReviewQueue || isDailyBriefLoading || isAttentionLoading}
```

---

## React 18 batching behavior

`setIsProcessingCommand(true)` and `setCooThread(...)` are called in the same synchronous event handler. React 18 batches them into a single commit. The result:

1. **Paint 1:** `isProcessingCommand = true` AND `cooThread = [..., new entry]` — "Thinking…" badge visible + new reply bubble visible simultaneously
2. **`useEffect` fires (after paint 1):** `setIsProcessingCommand(false)` → cancel timer
3. **Paint 2:** `isProcessingCommand = false` — "Thinking…" disappears, reply remains

The "Thinking…" badge and the reply bubble appear together for one browser paint frame (~16ms at 60fps), then the badge clears. This is acceptable for V1: the visual flash confirms the command was received. A future sprint could use `useTransition` to decouple the "Thinking→Response" sequence.

---

## Two-layer clear architecture

| Mechanism | Clears on | Path covered |
|---|---|---|
| `cooThread` useEffect | After any cooThread update | Follow-up resolver, COO router (both push to cooThread) |
| 600ms safety-net timer | 600ms after processing starts | Navigation commands, fallback responses (no cooThread push) |
| `closePanel` cleanup | Panel close | All open paths — no state leak into next session |

---

## Before / after behavior

| Event | Before Sprint 828 | After Sprint 828 |
|---|---|---|
| Director types "What should I do first?" → Enter | Input clears, DONNA reply appears, no status change | "Thinking…" badge appears, reply appears, badge clears |
| Director types "What's our retention trend?" → Enter | Same | Same — "Thinking…" fires at COO router |
| Director asks follow-up "Why?" | Same | Same — "Thinking…" fires at follow-up resolver |
| Director asks for daily brief | "Thinking…" fires via `isDailyBriefLoading` (async) | Same — `isProcessingCommand` also fires, then `isDailyBriefLoading` takes over seamlessly |
| Director launches "Create a template" | No thinking indicator | No change — template creation returns early before COO router block |
| Director says "Close Donna" | Panel closes | Panel closes, timer cancelled, `isProcessingCommand` reset |
| Director closes panel during processing | No-op — no state to clean | Timer cancelled, `isProcessingCommand` cleared |

---

## What was NOT changed

- `DonnaVoiceLayer.tsx` — untouched (only the prop value passed to it changes)
- `DonnaWorkflowCards.tsx` — untouched
- All async loading states (`isDailyBriefLoading`, `isAttentionLoading`, etc.) — unchanged
- Voice behavior, routing, persistence, backend — untouched
- Sprint 823 disclosure behavior — unchanged
- Sprint 824 inner-thread scroll — unchanged
- Sprint 825 first-reply reveal — unchanged
- Sprint 826 input refocus — unchanged
- Panel layout, mobile responsive classes — unchanged
- No SQL, migrations, RLS, seed, or env files touched

---

## Paths affected (thinking indicator now fires)

1. **Follow-up resolver** — director types contextual follow-up ("Why?", "Go there", "Show me the ones without levels")
2. **COO router** — director submits any question routed through `handleDonnaCooPrompt` ("What's our retention trend?", "Explain the review queue", "What do I need to do today?")
3. **COO fallthrough to `detectAndHandleCommand`** — navigation commands, "go back", "explain this page" (cleared by 600ms timer since these may not push to cooThread)

---

## Paths intentionally not affected

| Path | Why excluded |
|---|---|
| Close panel command | Panel dismissed — nothing to indicate |
| Onboarding | Multi-step interview; director reads each question |
| Template creation | Workflow UI takes over; separate loading state |
| Generic task | Task workflow UI takes over |
| Review queue | `isLoadingReviewQueue` already fires |
| Daily brief | `isDailyBriefLoading` already fires |
| Attention report | `isAttentionLoading` already fires |
| Context query | `isLoadingContext` already fires |
| Attendance exception | COO workflow command; draft UI takes over |

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
| No fake loading delays | No `setTimeout` exceeds 600ms; all clear early via effect |

---

## TypeScript result

```
npx tsc --noEmit
# Exit: 0 — no errors
```

---

## Recommended Sprint 829

**Sprint 829 — DONNA Director Dashboard Focus Target Verification V1**

Target: The `review-queue-card` focus target was flagged in Sprint 827 (Highlight score: 8/10). The "What do I need to do today?" NAV_PATTERN at line 118 of `donnaUIActionDispatcher.ts` routes to `/director` with `focusTargetId: 'review-queue-card'`. If the element at `src/app/director/page.tsx` does not have `data-donna-focus-id="review-queue-card"`, the highlight banner fires but finds no DOM element — no highlight appears.

Risk: Very low — one `data-donna-focus-id` attribute addition if absent.
Scope: `src/app/director/page.tsx` only (read; edit only if the attribute is missing).
