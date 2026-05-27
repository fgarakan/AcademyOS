# Sprint 871 — DONNA Same-Page Highlight via Custom Event

**Date:** 2026-05-27
**Sprint:** 871
**Type:** Implementation — fix same-page section highlight via `donna:highlight` custom event
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Problem (pre-871)

When DONNA resolves a section navigation to the **same page** the user is already on, the
existing flow called `router.push(result.route)` — but Next.js App Router does not trigger a
`pathname` change for an identical route. `DonnaHighlightBanner`'s `useEffect([pathname])`
never re-fired, so the DOM highlight and badge silently no-oped.

**Affected case:** Any Category 1A action where `result.route === current pathname` —
e.g., director on `/director/sessions/abc-123` says "show session blocks" → section nav
resolves to the same route → no navigation event → no highlight.

---

## Solution

Add a second trigger path to `DonnaHighlightBanner`:

1. **`DonnaAssistantButton.handleUIDispatch`** — after writing `setDonnaFocusTarget`, check
   `result.route === pathname`. If same page, dispatch `window.dispatchEvent(new CustomEvent('donna:highlight'))`.
   If different page, keep existing `router.push(result.route)`.

2. **`DonnaHighlightBanner`** — add a `useEffect` that listens for `donna:highlight` on `window`
   and calls the shared `triggerHighlight()` callback. The event carries no payload; the target
   is read from sessionStorage (already written by `setDonnaFocusTarget`).

3. **Shared logic** — extract highlight logic into `triggerHighlight` useCallback (deps: `[pathname]`).
   Both the pathname-change effect and the event listener call the same function.

4. **`cleanupRef`** — `useRef<(() => void) | null>` holds the current timer + class-removal teardown.
   Called before each new highlight and in `dismiss()` to guarantee only one highlight active at a time.

---

## Implementation

### `DonnaHighlightBanner.tsx`

**New imports:** Added `useRef` to the React import.

**`cleanupRef`:**
```typescript
const cleanupRef = useRef<(() => void) | null>(null)
```

**`triggerHighlight` (new useCallback, deps: `[pathname]`):**
- Calls `cleanupRef.current?.()` to cancel any active highlight
- Reads `getDonnaFocusTarget()` from sessionStorage
- Bails when `!target || pathname !== target.route` (route guard unchanged)
- Queries `[data-donna-focus-id]`, applies glow class, scrolls, `setActive`
- Sets `setTimeout` for auto-dismiss; stores teardown in `cleanupRef.current`

**Pathname-change effect (replaces old `useEffect([pathname])`):**
```typescript
useEffect(() => {
  triggerHighlight()
  return () => { cleanupRef.current?.(); cleanupRef.current = null }
}, [triggerHighlight])
```
`triggerHighlight` is stable when `pathname` is stable — behaviour is equivalent to the old `[pathname]` dep.

**`donna:highlight` event listener effect (new, Sprint 871):**
```typescript
useEffect(() => {
  const onHighlight = () => triggerHighlight()
  window.addEventListener('donna:highlight', onHighlight)
  return () => window.removeEventListener('donna:highlight', onHighlight)
}, [triggerHighlight])
```

**`dismiss` (updated):**
```typescript
const dismiss = useCallback(() => {
  if (!active) return
  cleanupRef.current?.()   // Sprint 871 — cancel timer and remove glow class
  cleanupRef.current = null
  clearDonnaFocusTarget()
  setActive(null)
}, [active])
```
Pre-871 `dismiss` queried the element by `active.targetId` to remove glow; post-871 `cleanupRef.current()` does it instead (same effect, cleaner — no duplicate DOM query).

---

### `DonnaAssistantButton.tsx` — `handleUIDispatch` navigate block

**Before (Sprint 817):**
```typescript
if (result.kind === 'navigate' && result.route && result.confidence === 'high') {
  if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
  router.push(result.route)
  return true
}
```

**After (Sprint 871):**
```typescript
if (result.kind === 'navigate' && result.route && result.confidence === 'high') {
  if (result.focusTarget) setDonnaFocusTarget(result.focusTarget)
  // Sprint 871 — same-page: dispatch custom event so DonnaHighlightBanner re-runs
  // without a pathname change. Cross-page: keep existing router.push behaviour.
  if (result.route === pathname) {
    window.dispatchEvent(new CustomEvent('donna:highlight'))
  } else {
    router.push(result.route)
  }
  return true
}
```

`window.dispatchEvent` is synchronous — the listener in `DonnaHighlightBanner` fires before
`dispatchEvent` returns. `setDonnaFocusTarget` (sessionStorage write) completes before the
dispatch, so `triggerHighlight()` reads the correct target.

---

## End-to-End Flow (post-871)

### Same-page case (the fix)

**Example: Director on `/director/sessions/abc-123`, says "session blocks"**

1. `dispatchUIIntent("session blocks", 'academy_director', '/director/sessions/abc-123')`
2. `resolveSectionNavigation` → matches, resolves to route `/director/sessions/abc-123`
3. `handleUIDispatch` → `result.route === pathname` (both are `/director/sessions/abc-123`)
4. `setDonnaFocusTarget({ route: '/director/sessions/abc-123', targetId: 'session-blocks', ... })`
5. `window.dispatchEvent(new CustomEvent('donna:highlight'))` — synchronous
6. `DonnaHighlightBanner` listener fires → `triggerHighlight()`
7. `getDonnaFocusTarget()` → returns the target just written
8. `pathname === target.route` ✓ — route guard passes
9. Queries `[data-donna-focus-id="session-blocks"]` → found
10. Applies `donna-focus-ring`, scrolls, shows badge, sets auto-dismiss timer

### Cross-page case (unchanged Sprint 817 / 870 behaviour)

**Example: Director on `/director`, says "session blocks"**

1. `resolveSectionNavigation` → matches, but no sessionId in URL → `clarification_needed`
2. DONNA responds: "I can take you to Session Blocks, but I need more context..."
3. No navigation or highlight triggered (unchanged)

**Example: Director on `/director`, says "sessions list"**

1. `resolveSectionNavigation` → matches `navigate_to_sessions_list` → static route `/director/sessions`
2. `handleUIDispatch` → `result.route !== pathname` (`/director/sessions` ≠ `/director`)
3. `setDonnaFocusTarget(...)` → `router.push('/director/sessions')` (unchanged)
4. On `/director/sessions` mount → `useEffect([triggerHighlight])` fires → highlights `session-list`

---

## `implementationStatus` Update

Post-871: all 3 `'wired'` static-route Category 1A actions now support **same-page** highlighting.

| Action | Pre-871 | Post-871 |
|---|---|---|
| `navigate_to_sessions_list` | `wired` (cross-page only) | `wired` (same-page + cross-page) |
| `navigate_to_coach_home_today` | `wired` (cross-page only) | `wired` (same-page + cross-page) |
| `navigate_to_coach_players` | `wired` (cross-page only) | `wired` (same-page + cross-page) |
| All 11 `partially_wired` dynamic actions | same-page silently no-oped | same-page now highlights when already on the correct page |

No registry updates required — `implementationStatus` values are unchanged; the distinction
between `'wired'` and `'partially_wired'` remains about ID-resolution, not event delivery.

---

## Files Modified

| File | Change |
|---|---|
| `src/components/donna/DonnaHighlightBanner.tsx` | Added `useRef`; extracted `triggerHighlight` useCallback; added `cleanupRef`; added `donna:highlight` event listener effect; updated `dismiss` to use `cleanupRef` |
| `src/components/assistant/DonnaAssistantButton.tsx` | Updated `handleUIDispatch` navigate block: `result.route === pathname` → dispatch event; else → `router.push` |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | No changes needed — dispatch logic unchanged |
| `src/lib/donna/donnaUIActionRegistry.ts` | No registry status changes |
| `src/lib/donna/donnaFocusTarget.ts` | No changes — sessionStorage utilities unchanged |
| `src/app/director/_actions/donnaContextActions.ts` | Explicitly out of scope |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure client-side event + sessionStorage |
| No DB reads | ✅ — no queries |
| No mutations | ✅ — navigation + visual guidance only |
| No new imports | ✅ — `useRef` already in React (no new packages) |
| No package installs | ✅ — none |
| No parent/player data | ✅ — no data involved |
| Role boundaries preserved | ✅ — role check happens in dispatcher, unchanged |
| Existing cross-page behaviour unchanged | ✅ — `else { router.push(result.route) }` path identical to Sprint 817 |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-871)

| Limitation | Impact | Resolution |
|---|---|---|
| Dynamic params must be in current URL | `partially_wired` actions still require user to be on the correct session/template page | Future: resolve IDs from DONNA context summary |
| Step-conditional template sections | `template-blocks-section`/`template-generate-session` only in DOM on their stepper step | Acceptable; future sprint: navigate to step first |
| 4 Sprint 868 IDs not in dispatcher | `session-group-assignment`, `template-level-picker`, `coach-players-section`, `coach-player-watch-list` unregistered | Low priority |

---

## Sprint 872 Recommendation

**Sprint 872 — DONNA Context ID Resolution**

Resolve sessionId/templateId from DONNA's context summary (not URL) so cross-page "take me to
blocks of the session I was just on" works. Upgrade `partially_wired` actions to `'wired'` status.
No DB changes or migrations required.
