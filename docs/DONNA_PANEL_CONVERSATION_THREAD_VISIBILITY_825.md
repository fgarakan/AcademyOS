# Sprint 825 — DONNA Panel Conversation Thread Visibility V1

**Date:** 2026-05-26
**Sprint:** 825
**Type:** Scroll UX — first-reply thread reveal
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — no errors)

---

## Why this sprint

Sprint 824 scoped all thread scroll updates to the inner `max-h-[280px]` container, preventing the outer panel from jumping on every new conversation turn. This was correct for turns 2 through N.

However, on the **first reply** (when `cooThread` transitions from `[]` to one entry), the conversation thread wrapper appears below `DonnaVoiceLayer` in the outer scroll container. The outer panel starts at `scrollTop = 0` (director was looking at the input). With Sprint 824 in place, the outer panel never moves — meaning the director would not see DONNA's first response without manually scrolling down.

Sprint 825 adds a single controlled outer-panel reveal triggered exactly once per panel session: the moment the first reply arrives.

---

## Thread Wrapper Structure (audited before coding)

```
OUTER SCROLL CONTAINER (flex-1 overflow-y-auto) ← line 3529 — no ref needed
  ├── Idle card (conditional)
  ├── Page-aware actions card (conditional)
  ├── Greeting / onboarding card (conditional)
  ├── DonnaVoiceLayer — INPUT (always rendered, near top)
  ├── THREAD WRAPPER (div.pb-3) ← cooThreadWrapperRef added here (Sprint 825)
  │   └── INNER SCROLL CONTAINER (max-h-[280px] overflow-y-auto) ← cooThreadScrollRef (Sprint 824)
  │       ├── Thread bubbles (last 5 turns)
  │       └── <div ref={cooThreadBottomRef} /> ← Sprint 748 anchor, unchanged
  ├── DonnaWorkflowCards
  ├── Disclosure bar + sections (Sprint 823)
  └── Dev tools (dev-only)
```

---

## Scroll effects after Sprint 825

| Effect | Dependency | Fires when | What it does |
|---|---|---|---|
| Sprint 824 inner scroll | `cooThread` | Every turn (length > 0) | `cooThreadScrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' })` — scrolls inner container only |
| **Sprint 825 first-reveal** | `cooThread` | **First reply only** (0→1) | `cooThreadWrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` — brings thread wrapper into view in outer panel |

---

## What was changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. Two new refs (added near `cooThreadScrollRef`):**

```tsx
// Sprint 825 — wrapper ref: used to reveal the thread wrapper in the outer panel on first reply.
const cooThreadWrapperRef = useRef<HTMLDivElement>(null)
// Sprint 825 — previous thread length: detects the 0→1 first-reply transition only.
const previousCooThreadLengthRef = useRef(0)
```

**2. First-reply `useEffect` (added after Sprint 824 scroll effect):**

```tsx
// Sprint 825 — first-reply outer panel reveal.
// When cooThread transitions from empty (length 0) to the first reply (length > 0),
// scroll the outer panel to bring the thread wrapper into view exactly once.
// Guard: only fires on the 0→1 transition. All later turns (1→2, 2→3…) hit the
// !wasEmpty early return and leave the outer panel untouched (Sprint 824 behavior).
// cooThread resets to [] on panel close (Sprint 711), so this fires fresh each session.
useEffect(() => {
  const wasEmpty = previousCooThreadLengthRef.current === 0
  previousCooThreadLengthRef.current = cooThread.length
  if (!wasEmpty || cooThread.length === 0) return
  cooThreadWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}, [cooThread])
```

**3. `ref={cooThreadWrapperRef}` on thread wrapper div (line 3804):**

```tsx
// Before
<div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

// After
<div ref={cooThreadWrapperRef} className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
```

---

## How repeated outer scroll jumps are avoided

The guard `if (!wasEmpty || cooThread.length === 0) return` ensures:

| Transition | `wasEmpty` | `cooThread.length` | Outcome |
|---|---|---|---|
| `[]` → (first reply) | `true` | `> 0` | **Reveal fires** — outer panel scrolls once |
| Turn 1 → Turn 2 | `false` | `> 0` | Early return — outer panel untouched (Sprint 824 inner scroll handles it) |
| Turn 2 → Turn 3 | `false` | `> 0` | Early return — outer panel untouched |
| Anything → `[]` (panel close) | `false` | `0` | Early return — `previousCooThreadLengthRef` updated to `0` |
| Re-open + first reply (new session) | `true` | `> 0` | **Reveal fires again** — correct for new session |

`cooThread` is cleared to `[]` on every panel close (Sprint 711, line 915). This means `previousCooThreadLengthRef` is always correctly reset to `0` when the panel closes, so the first-reply reveal fires correctly on the next session open.

---

## Why `scrollIntoView` is acceptable here (unlike Sprint 824)

Sprint 824 replaced `scrollIntoView` on `cooThreadBottomRef` (inside the inner container) with `scrollTo` on the inner container directly — because the old call traversed both the inner container AND the outer panel on every turn, causing repeated jumps.

Sprint 825 calls `scrollIntoView` on `cooThreadWrapperRef` — the thread's outer `div.pb-3` wrapper. This is:
- **A direct child of the outer scroll container** — only that container needs to scroll to reveal it
- **Called only on the first reply** — one intentional, expected scroll
- **Using `block: 'nearest'`** — scrolls the minimum amount; if the wrapper is already partially visible, the outer panel won't overshoot

No conflict with Sprint 824: the two effects run on the same `cooThread` dependency. On first reply, both fire — Sprint 824 scrolls the inner container to its bottom (correct), Sprint 825 scrolls the outer panel to reveal the wrapper (correct). They operate on different scroll containers.

---

## Before / after behavior

| Event | Before Sprint 825 | After Sprint 825 |
|---|---|---|
| Director sends first command | Thread appears below input; outer panel stays at top; director must scroll manually to see reply | Outer panel smoothly scrolls to reveal thread once |
| Director sends second command | Inner thread scrolls to latest bubble; outer panel stays still (Sprint 824) | Same — unchanged |
| Director sends third command | Same | Same — unchanged |
| Panel closes | `cooThread` cleared; `previousCooThreadLengthRef` updated to 0 | Same — same |
| Panel re-opens; director sends command | First-reveal fires correctly again | Same — same |

---

## What was NOT changed

- `DonnaVoiceLayer.tsx` — untouched
- `DonnaWorkflowCards.tsx` — untouched
- `DonnaDeveloperTools.tsx` — untouched
- `DonnaVoiceDiagnostics.tsx` — untouched
- Sprint 823 disclosure bar and auto-expand useEffects — unchanged
- Sprint 824 inner-container `scrollTo` effect — unchanged
- `cooThreadBottomRef` anchor div — unchanged (kept for forward compat)
- Panel layout, dimensions, responsive classes — unchanged
- Mobile `w-full sm:bottom-[60px]` panel behavior — unchanged
- Voice behavior, routing, persistence, backend — untouched
- No SQL, migrations, RLS, seed files, or env files touched

---

## Mobile behavior

The outer scroll container (`flex-1 overflow-y-auto`) and thread wrapper structure are identical on mobile and desktop. `scrollIntoView({ block: 'nearest' })` computes the minimum scroll needed regardless of viewport size. The first-reply reveal fires the same on both form factors.

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

## Recommended Sprint 826

**Sprint 826 — DONNA Panel Input Focus After Command V1**

Target: After the director submits a command (typed or voice), the text input field is not automatically re-focused. The director has to manually click back into the input to type a follow-up command. In a fast-moving workflow this creates friction.

Recommended change: After `handleCommandSubmit` completes and clears `typedText`, re-focus `[data-donna-input]` automatically. Gate it: only when `activeMode === null` and no draft workflow is active — avoid refocus during guided task, create template, or review queue workflows where the director needs to read before typing.

Sprint 815 audit section: Part 2F — Post-command input state.
Risk: Low — one `useEffect` watching `cooThread.length` or a direct call at the end of `handleCommandSubmit`.
Scope: `DonnaAssistantButton.tsx` only.
