# Sprint 824 — DONNA Panel Scroll Stability V1

**Date:** 2026-05-26
**Sprint:** 824
**Type:** Scroll and layout stability — no state, voice, or backend changes
**Files changed:** 1 source file + 2 docs
**TypeScript:** Clean (`npx tsc --noEmit` — no errors)

---

## Why this sprint

Sprint 823 simplified the DONNA panel default view and introduced auto-expanding disclosure sections for Context and Suggestions. Sprint 824 addresses the remaining scroll instability risks:

1. The `cooThread` useEffect called `scrollIntoView` on a ref inside the inner thread container. `scrollIntoView` traverses **all** scrollable ancestors — meaning it could scroll both the inner thread container (correct) AND the outer panel container (jarring), causing the whole panel to jump when a new conversation turn arrived.

2. The "Ask Anything" tab chip called `scrollIntoView({ behavior: 'smooth', block: 'center' })` on the text input. Since the input is near the top of the scroll container and already in view, this caused the outer panel to scroll UP unnecessarily if the user had been looking at content further down.

---

## Scroll Architecture (audited before coding)

```
<aside> flex-col (fixed panel, full-height)
  ├── Header (shrink-0) — never scrolls
  ├── Tab chips (shrink-0) — never scrolls; own overflow-x-auto
  ├── OUTER SCROLL CONTAINER (flex-1 overflow-y-auto) ← DonnaAssistantButton.tsx:3521
  │   ├── Idle presence card (conditional)
  │   ├── Page-aware actions card (conditional)
  │   ├── Greeting / onboarding card (conditional)
  │   ├── DonnaVoiceLayer — INPUT (always rendered, near top)
  │   ├── INNER SCROLL CONTAINER (max-h-[280px] overflow-y-auto) ← :3801
  │   │   ├── Thread bubbles (last 5 turns)
  │   │   └── <div ref={cooThreadBottomRef} /> ← unchanged DOM anchor
  │   ├── DonnaWorkflowCards (drafts, daily brief, attention)
  │   ├── Action preview card (conditional)
  │   ├── Sprint 823 Disclosure bar (3 teal pills)
  │   ├── Context section (collapses/expands)
  │   ├── Suggestions section (collapses/expands)
  │   └── Actions section (collapses/expands)
  └── Footer "DONNA drafts. You approve." (shrink-0) — never scrolls
```

---

## Scroll-producing code — pre-824 inventory

| Site | Code | Problem |
|---|---|---|
| `cooThread` useEffect | `cooThreadBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` | `scrollIntoView` propagates to ALL scrollable ancestors. Inner thread container scrolls correctly, but outer panel also jumps when thread was below the fold. |
| "Ask Anything" tab chip | `el?.scrollIntoView({ behavior: 'smooth', block: 'center' })` on `[data-donna-input]` | Input is near the top and already in view. `block: 'center'` scrolls outer panel UP — jarring if user was looking at content lower in the panel. |
| Sprint 823 auto-expand effects | `setShowContextSection(true)` / `setShowSuggestionsSection(true)` | Sections expand at the bottom. Browser preserves scroll position. No jump. **No fix needed.** |

---

## What was changed

### `src/components/assistant/DonnaAssistantButton.tsx`

**1. Added `cooThreadScrollRef` (1 line, near `cooThreadBottomRef`):**

```tsx
// Sprint 824 — scroll container ref: scopes thread scroll to the inner container only;
// prevents scrollIntoView from propagating to the outer panel and causing layout jumps.
const cooThreadScrollRef = useRef<HTMLDivElement>(null)
```

**2. Updated `cooThread` useEffect — `scrollIntoView` → `scrollTo` on container:**

Before:
```tsx
// Sprint 748 — auto-scroll thread to latest message whenever cooThread changes
useEffect(() => {
  if (cooThread.length === 0) return
  cooThreadBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}, [cooThread])
```

After:
```tsx
// Sprint 748 — auto-scroll thread to latest message whenever cooThread changes.
// Sprint 824 — scoped to the inner thread container only (cooThreadScrollRef).
// scrollTo on the container scrollHeight replaces scrollIntoView, which was
// traversing the outer panel and causing the full panel to jump on new turns.
useEffect(() => {
  if (cooThread.length === 0) return
  const el = cooThreadScrollRef.current
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}, [cooThread])
```

**Why `scrollTo` instead of `scrollIntoView`:** `scrollTo` operates on the element it is called on and only that element. It does not propagate to parent scroll containers. `scrollIntoView` traverses the entire ancestor chain, scrolling each one the minimum amount to bring the target into view.

**3. Added `ref={cooThreadScrollRef}` to the inner thread container:**

```tsx
// Before
<div className="space-y-2.5 px-3 max-h-[280px] overflow-y-auto">

// After
<div ref={cooThreadScrollRef} className="space-y-2.5 px-3 max-h-[280px] overflow-y-auto">
```

**4. Removed `scrollIntoView` from "Ask Anything" chip handler:**

Before:
```tsx
setTimeout(() => {
  const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.focus()
}, 50)
```

After:
```tsx
// Sprint 824 — input is near the top of the panel and already in view;
// scrollIntoView removed to prevent the outer panel from jumping up.
setTimeout(() => {
  const el = document.querySelector<HTMLTextAreaElement>('[data-donna-input]')
  el?.focus()
}, 50)
```

---

## Before / after behavior

| Event | Before Sprint 824 | After Sprint 824 |
|---|---|---|
| DONNA responds (cooThread updates) | Inner thread scrolls to bottom ✓ — outer panel may also jump if thread was below fold | Inner thread scrolls to bottom ✓ — outer panel stays still |
| User clicks "Ask Anything" | Panel resets mode, then **scrolls the outer panel up** to center the input | Panel resets mode, focuses input — **outer panel stays still** |
| Context section auto-expands (Sprint 823) | Sections render at bottom; browser preserves scroll position — **already stable** | Unchanged — still stable |
| Suggestions section auto-expands (Sprint 823) | Same — already stable | Unchanged |
| User manually scrolls the thread | Inner thread scroll container handles it — already correct | Unchanged |

---

## What was NOT changed

- `DonnaVoiceLayer.tsx` — untouched
- `DonnaWorkflowCards.tsx` — untouched
- `DonnaDeveloperTools.tsx` — untouched
- `DonnaVoiceDiagnostics.tsx` — untouched
- `cooThreadBottomRef` `<div>` anchor — still in the DOM (preserved for forward compatibility)
- Sprint 823 disclosure bar and auto-expand useEffects — unchanged
- Panel layout, dimensions, and responsive classes — unchanged
- Mobile `w-full sm:bottom-[60px]` behavior — unchanged (no layout class changes)
- Voice behavior, routing, persistence, backend — untouched
- No SQL, migrations, RLS, seed files, or env files touched

---

## Mobile behavior (Sprint 814)

The panel on mobile uses `w-full` + `bottom-[60px]` (bottom nav bar clearance). The two-layer scroll architecture (outer `flex-1 overflow-y-auto` + inner `max-h-[280px] overflow-y-auto`) is the same on mobile and desktop. The `scrollTo` fix operates on the inner container ref — which exists on both form factors. No layout classes were changed.

---

## Safety guardrails preserved

| Rule | Status |
|---|---|
| Voice never directly mutates core data | Unchanged — `isProtectedVoicePhrase()` still enforced |
| All mutations through `proposed_actions` | Unchanged |
| `execute_approved_action()` only execution path | Unchanged |
| DONNA does not expose parent/player private data | Unchanged |
| No audio stored | Unchanged |
| Developer tools hidden in production | Unchanged (Sprint 822) |

---

## TypeScript result

```
npx tsc --noEmit
# exit 0 — no errors
```

---

## Recommended Sprint 825

**Sprint 825 — DONNA Panel Conversation Thread Visibility V1**

Target: After sending a command, the conversation thread (positioned below `DonnaVoiceLayer` in the scroll container) may not be visible if the user has not scrolled down. The thread receives DONNA's response, and the inner container scrolls correctly — but the director may not know to look below the input.

Recommended change: When `cooThread` gains its first entry (length goes from 0 to 1), scroll the outer panel to bring the thread container into view — using a ref on the thread wrapper div, not `scrollIntoView`. Subsequent turns use the inner-container-only scroll from Sprint 824.

Sprint 815 audit section: Part 2E — Response visibility for first turn.
Risk: Low — one additional useEffect checking `cooThread.length === 1` only.
Scope: `DonnaAssistantButton.tsx` only.
