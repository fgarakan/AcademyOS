# DONNA Shell Highlight Unification V1
**Date:** 2026-05-29
**Sprint:** 938
**Status:** Complete

---

## What Was Done

Sprint 938 unified DONNA's highlight capability across Shell A and Shell B, and extended the highlight banner to coach pages.

Two targeted changes were made — no new components, no new highlight system, no new shell.

---

## Before Sprint 938

| Surface | Shell | Highlight possible? | Why not? |
|---|---|---|---|
| `/director/donna` (Director hub) | Shell A | Cross-page only | Same-page `donna:highlight` event not dispatched |
| Director pages (floating panel) | Shell B | Yes — full | `setDonnaFocusTarget` + `donna:highlight` wired |
| `/coach/donna` (Coach hub) | Shell A | Cross-page only | Same issue + no banner in coach layout |
| Coach pages (floating panel) | Shell B | No | `DonnaHighlightBanner` not mounted in coach layout |

---

## After Sprint 938

| Surface | Shell | Highlight possible? | Notes |
|---|---|---|---|
| `/director/donna` (Director hub) | Shell A | Yes — full | Same-page + cross-page |
| Director pages (floating panel) | Shell B | Yes — full | Unchanged |
| `/coach/donna` (Coach hub) | Shell A | Yes — full | Same-page + cross-page |
| Coach pages (floating panel) | Shell B | Yes — full | Banner now mounted in coach layout |

---

## Change 1 — Shell A Same-Page Highlight Dispatch

**File:** `src/components/donna/DonnaVoiceReadyShell.tsx`

**What changed:** In the navigation confirmation handler (user says "yes" to a DONNA nav offer), added a same-page check before `router.push`.

**Before:**
```typescript
const navFocusTarget = buildFocusTargetForRoute(pendingOffer.href, pendingOffer.questionContext)
if (navFocusTarget) setDonnaFocusTarget(navFocusTarget)
// Brief delay so the user sees DONNA's message before page changes
setTimeout(() => router.push(pendingOffer.href), 500)
```

**After:**
```typescript
const navFocusTarget = buildFocusTargetForRoute(pendingOffer.href, pendingOffer.questionContext)
if (navFocusTarget) setDonnaFocusTarget(navFocusTarget)
// Sprint 938: same-page highlight via donna:highlight event; cross-page via router.push.
// Mirrors Shell B (DonnaAssistantButton lines 2880-2884) so highlight fires regardless
// of which shell the user is in.
if (pendingOffer.href === pathname) {
  window.dispatchEvent(new CustomEvent('donna:highlight'))
} else {
  setTimeout(() => router.push(pendingOffer.href), 500)
}
```

**Why this works:** `DonnaHighlightBanner` listens for the `donna:highlight` custom event via `window.addEventListener('donna:highlight', onHighlight)`. When Shell A dispatches it, the banner's `triggerHighlight()` callback fires, reads sessionStorage (already populated by `setDonnaFocusTarget`), and applies the `donna-focus-ring` CSS + teal badge.

**Cross-page (existing, Sprint 848):** `setDonnaFocusTarget` writes to sessionStorage before `router.push`. The banner on the destination page reads sessionStorage on mount via the `useEffect(() => { triggerHighlight() }, [triggerHighlight])` pathname-change effect.

---

## Change 2 — Coach Layout DonnaHighlightBanner Mount

**File:** `src/app/coach/layout.tsx`

**What changed:** Imported `DonnaHighlightBanner` and mounted it at layout level.

```tsx
import { DonnaHighlightBanner } from '@/components/donna/DonnaHighlightBanner'

// In return:
<DonnaHighlightBanner />
```

**Why no DonnaSessionContextProvider needed:** `DonnaHighlightBanner` uses only `usePathname()` (from Next.js) and sessionStorage reads via `getDonnaFocusTarget()`. It does not call `useDonnaSessionContext()`. The provider is not required.

**Coach pages already have focus targets:** 9 `data-donna-focus-id` attributes exist across coach pages:
- `coach-today-sessions` — `/coach` page today's sessions section
- `coach-players-section` — `/coach` page players section
- `wrapup-question-card` — wrap-up page active question
- `wrapup-nav-actions` — wrap-up page submit buttons
- `coach-player-watch-list` — session page player watch list
- `coach-lesson-plan` — session page lesson plan section
- `coach-run-session` — session page execution section
- `coach-wrap-up-link` — session page after-session CTA
- `coach-player-list` — coach players list

No new DOM attributes were needed — they already existed from Sprint 868+.

---

## What Was NOT Changed

- `DonnaAssistantButton` (Shell B) — behavior preserved exactly
- `DonnaHighlightBanner` component — unchanged
- `donnaFocusTarget.ts` store — unchanged
- `donnaUIActionDispatcher.ts` and `buildFocusTargetForRoute` — unchanged
- `FOCUS_TARGET_MAP` — unchanged
- Director layout — unchanged
- Any wrap-up, approval, or proposed_actions paths — unchanged
- No migrations

---

## Highlight System Reference (Unchanged)

The highlight system has three layers:

**1. Storage (`donnaFocusTarget.ts`)**
- `setDonnaFocusTarget(target)` — writes to sessionStorage with 8s TTL
- `getDonnaFocusTarget()` — reads sessionStorage; returns null if expired
- `clearDonnaFocusTarget()` — removes from sessionStorage

**2. Target Registry (`donnaUIActionDispatcher.ts`)**
- `FOCUS_TARGET_MAP` — maps routes to default highlight targets
- `buildFocusTargetForRoute(route, sourceCommand)` — builds a `DonnaFocusTarget` for a given nav destination
- `SECTION_NAV_ENTRIES` — per-section focus targets for Category 1A actions

**3. Banner (`DonnaHighlightBanner.tsx`)**
- Mounted in director layout (Sprint 817) and now coach layout (Sprint 938)
- Listens for `donna:highlight` custom event (same-page) and pathname changes (cross-page)
- Finds `[data-donna-focus-id="<targetId>"]` → `scrollIntoView` + `donna-focus-ring` class + teal badge
- Auto-dismisses after TTL expires; manual dismiss via × button

---

## Known Limits After Sprint 938

1. **"What should I do next?" does not trigger highlight.** Shell A's `whatIsTheBestNextStep()` returns text only. Wiring highlight to "what next?" answers requires Sprint 940–941 (page element registry + live-data engine).

2. **Shell A highlight requires a pending nav offer.** Shell A triggers highlight only through the `pendingNavOffer` → yes/no confirmation path. Direct highlight without navigation is not yet wired in Shell A.

3. **Player/parent layouts have no highlight banner.** Intentional — chip-based mobile surfaces don't use highlight.

4. **Shell B context params not passed for same-page section nav.** Shell B uses `lastKnownContextParamsRef` to resolve sessionId/templateId for section navigation. Shell A does not have this. Section nav highlight in Shell A only works if the answer engine populates `questionContext` with enough info for `buildFocusTargetForRoute`.

---

## Next Sprint Recommendation — Sprint 939

**Goal:** Single context resolver + single personality source.

- Create `src/lib/donna/donnaPersonality.ts` — DONNA's tone, role descriptions, boundary language per role
- Create `src/lib/donna/donnaContextResolver.ts` — resolves full DONNA context packet from all available sources
- Migrate `DonnaTodayBriefPanel` and `DonnaReviewBriefPanel` to use personality module
- No shell changes, no routing changes, no migrations
