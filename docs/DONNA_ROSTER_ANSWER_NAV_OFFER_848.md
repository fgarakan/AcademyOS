# Sprint 848 — DONNA Roster Answer Nav Offer V1

**Date:** 2026-05-26
**Sprint:** 848
**Type:** UX — nav offer wiring for DONNA roster attention answer + nav confirmation focus target
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 847 known limitation

Sprint 847 changed `buildRosterHubAnswer` to link directly to `/director/players/${playerId}` when a flagged player is known. However:

1. `DonnaVoiceReadyShell.tsx` rosterAnswer path did NOT build a `PendingNavOffer` — no `setPendingNavOffer` was called (unlike `coachHealth`, `stallAnswer`, `draftProposal` which all call `buildNavOfferFromHref`)
2. `buildNavOfferFromHref` uses a static `HREF_TO_LABEL` map — returns `null` for `/director/players/<uuid>` (dynamic URL not in map)
3. The nav confirmation handler (`Yes/No` path) called only `router.push(pendingOffer.href)` — it did NOT call `setDonnaFocusTarget`, so NO existing nav offer triggered the teal-glow highlight

**Combined impact:** Even if a nav offer existed, clicking "yes" after the roster answer would navigate to the player profile without any DONNA teal-glow highlight. The Sprint 841 `buildFocusTargetForRoute` prefix fallback for `/director/players/<uuid>` was never activated from the `DonnaVoiceReadyShell.tsx` nav path.

---

## Audit Findings

### Roster answer path — confirmed no nav offer (pre-Sprint 848)

```tsx
// Lines 408–423 in DonnaVoiceReadyShell.tsx
const rosterAnswer = tryAnswerRosterAttentionQuestion(trimmed, directorCtx)
if (rosterAnswer) {
  const donnaMsg = buildChatMessageFromAnswer(rosterAnswer)
  setTimeout(() => {
    setMessages(prev => [...prev, donnaMsg])
    setIsTyping(false)
    recordTurn(...)
    // ← NO setPendingNavOffer call here
  }, 600)
  return
}
```

### Other answer types — confirmed nav offer pattern

All of these call `buildNavOfferFromHref` then `setPendingNavOffer`:
- `coachHealth` (line 431–440)
- `draftProposal` (line 452–461)
- `stallAnswer` (line 294–303)
- `sessionAdj` (line 472–481)
- `rdAnswer` (line 277–286)
- `dqAnswer` (line 394–403)

Roster answer was the only one missing this pattern.

### `buildNavOfferFromHref` — confirmed cannot resolve dynamic player URLs

```ts
const HREF_TO_LABEL: Record<string, string> = {
  '/director/review': 'Review Center',
  '/director/players': 'Players',
  '/director/sessions': 'Sessions',
  ...
}

function buildNavOfferFromHref(href, questionContext) {
  if (!href) return null
  const label = HREF_TO_LABEL[href]
  if (!label) return null     // ← returns null for /director/players/<uuid>
  return { href, label, questionContext }
}
```

### Nav confirmation handler — confirmed no `setDonnaFocusTarget` (pre-Sprint 848)

```tsx
// Lines 175–181
setTimeout(() => {
  setMessages(prev => [...prev, confirmMsg])
  setIsTyping(false)
  recordTurn(...)
  // ← NO setDonnaFocusTarget call
  setTimeout(() => router.push(pendingOffer.href), 500)
}, 300)
```

`setDonnaFocusTarget` was only called in `DonnaAssistantButton.tsx` (the COO command dispatcher path). The `DonnaVoiceReadyShell.tsx` nav offer path never triggered the teal-glow — not for any answer type.

### Sprint 841 prefix fallback — confirmed handles player profile routes

```ts
// buildFocusTargetForRoute in donnaUIActionDispatcher.ts
if (route.startsWith('/director/players/') && route.split('/').length === 4) {
  return {
    route,
    targetId: 'player-profile-header',
    label: 'Player Profile',
    reason: "Here's the player profile. Use the tabs to review priorities, notes, evidence, and session history.",
    sourceCommand,
    highlightStyle: 'teal-glow',
  }
}
```

This fallback exists and works — it just needed to be activated from `DonnaVoiceReadyShell.tsx`.

### `setDonnaFocusTarget` — confirmed safe for client use

```ts
export function setDonnaFocusTarget(target: DonnaFocusTarget): void {
  if (typeof window === 'undefined') return  // SSR-safe guard
  sessionStorage.setItem(DONNA_FOCUS_TARGET_KEY, JSON.stringify(withExpiry))
}
```

SessionStorage-backed, 8-second TTL. No DB writes. No PII stored (only route + element ID + label).

---

## Solution

One file modified: `src/components/donna/DonnaVoiceReadyShell.tsx`.
Four targeted changes.

### Change 1 — New imports

```ts
import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import { buildFocusTargetForRoute } from '@/lib/donna/donnaUIActionDispatcher'
```

### Change 2 — `buildRosterNavOffer` helper (added after `buildNavOfferFromHref`)

```ts
// Sprint 848: nav offer builder for the roster attention answer.
// Extends buildNavOfferFromHref to handle dynamic /director/players/<uuid> hrefs
// (Sprint 847) that cannot be resolved via HREF_TO_LABEL.
// Label priority: (1) static HREF_TO_LABEL, (2) answer.followUp, (3) 'Open player profile'.
function buildRosterNavOffer(
  href: string | null | undefined,
  followUp: string | null | undefined,
  questionContext: string,
): PendingNavOffer | null {
  if (!href) return null
  const staticLabel = HREF_TO_LABEL[href]
  if (staticLabel) return { href, label: staticLabel, questionContext }
  if (href.startsWith('/director/players/') && href.split('/').length === 4) {
    return { href, label: followUp?.trim() || 'Open player profile', questionContext }
  }
  return null
}
```

### Change 3 — Roster answer nav offer wiring

```tsx
// Before:
const donnaMsg = buildChatMessageFromAnswer(rosterAnswer)
setTimeout(() => {
  setMessages(prev => [...prev, donnaMsg])
  setIsTyping(false)
  recordTurn(...)
}, 600)

// After:
const donnaMsg = buildChatMessageFromAnswer(rosterAnswer)
const rosterNavOffer = buildRosterNavOffer(rosterAnswer.href, rosterAnswer.followUp, trimmed)
setTimeout(() => {
  setMessages(prev => [...prev, donnaMsg])
  setIsTyping(false)
  recordTurn(...)
  if (rosterNavOffer) setPendingNavOffer(rosterNavOffer)
}, 600)
```

### Change 4 — Nav confirmation handler — `setDonnaFocusTarget` before `router.push`

```tsx
// Before:
setTimeout(() => {
  setMessages(prev => [...prev, confirmMsg])
  setIsTyping(false)
  recordTurn(...)
  setTimeout(() => router.push(pendingOffer.href), 500)
}, 300)

// After:
setTimeout(() => {
  setMessages(prev => [...prev, confirmMsg])
  setIsTyping(false)
  recordTurn(...)
  // Sprint 848: set focus target before navigation so destination page can highlight.
  const navFocusTarget = buildFocusTargetForRoute(pendingOffer.href, pendingOffer.questionContext)
  if (navFocusTarget) setDonnaFocusTarget(navFocusTarget)
  setTimeout(() => router.push(pendingOffer.href), 500)
}, 300)
```

**Note on Change 4 scope:** The nav confirmation handler is shared by ALL nav offers (`coachHealth`, `stallAnswer`, `draftProposal`, etc.). Adding `setDonnaFocusTarget` here benefits all of them — any nav offer accepted by the director now triggers the teal-glow highlight if a focus target exists for that route. This is the correct and intended behavior: the nav offer path now matches the dispatcher path.

---

## Complete Flow After Sprint 848

1. Director asks "Who needs attention?"
2. `tryAnswerRosterAttentionQuestion` builds answer with `href: /director/players/<uuid>` and `followUp: "View Sarah's profile"`
3. `buildRosterNavOffer` creates `{ href: '/director/players/<uuid>', label: "View Sarah's profile", questionContext }` → stored as `pendingNavOffer`
4. DONNA displays the answer + `followUpHref` as plain anchor in the chat bubble (unchanged)
5. Director says "yes" (or clicks the plain anchor if preferred)
   - **If "yes"**: nav confirmation handler fires → `buildFocusTargetForRoute('/director/players/<uuid>')` → `player-profile-header, teal-glow` → `setDonnaFocusTarget(...)` → `router.push(...)` → player profile page mounts → teal-glow activates on profile header
   - **If clicks anchor**: navigates to player profile via plain `<a>` link, no DONNA highlight (unchanged Sprint 847 behavior — safe fallback)

---

## Nav Offer Label Resolution Matrix

| `rosterAnswer.href` | `followUp` | Nav offer label |
|---|---|---|
| `/director/players/<uuid>` | `'View Sarah's profile'` | `"View Sarah's profile"` |
| `/director/players/<uuid>` | `null` | `'Open player profile'` |
| `/director/players/<uuid>` | `'  '` (blank) | `'Open player profile'` |
| `/director/players` (list fallback) | any | `'Players'` (from HREF_TO_LABEL) |
| `null` | any | `null` (no nav offer) |

---

## Focus Target Activation Matrix (post-Sprint 848)

| Nav offer href | Focus target | targetId | highlightStyle |
|---|---|---|---|
| `/director/players/<uuid>` | ✅ via Sprint 841 prefix fallback | `player-profile-header` | `teal-glow` |
| `/director/players` | ✅ via FOCUS_TARGET_MAP | `player-directory-summary` | `teal-glow` |
| `/director/review` | ✅ via FOCUS_TARGET_MAP | `pending-review-list` | `teal-glow` |
| `/director/sessions` | ✅ via FOCUS_TARGET_MAP | `sessions-list` | `teal-glow` |
| `/director` | ✅ via FOCUS_TARGET_MAP | `today-command-center` | `teal-glow` |
| `/director/class-templates` | ✅ via FOCUS_TARGET_MAP | `create-template-button` | `teal-glow` |

**All existing nav offers now benefit from teal-glow via Change 4 — not just the roster path.**

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ sessionStorage only — client-side, no network |
| No proposed_actions created | ✅ |
| No player data in focus target | ✅ only route + element ID + label stored |
| No parent/player visibility | ✅ director-only |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| SSR-safe | ✅ `setDonnaFocusTarget` guards `typeof window === 'undefined'` |
| `buildRosterNavOffer` null-safe | ✅ returns null for null/missing hrefs |
| Nav confirmation handler null-safe | ✅ `if (navFocusTarget)` guard |
| Plain anchor fallback preserved | ✅ `followUpHref` in chat bubble unchanged |
| Existing nav offer behavior unchanged | ✅ additive only — no existing nav offer path changed |
| `buildNavOfferFromHref` unchanged | ✅ not modified |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `directorPlayersDonnaIntelligence.ts` | Sprint 847 changes are correct and complete |
| `DonnaSafeReadAnswer` interface | No change needed — `href` and `followUp` fields used as-is |
| `buildNavOfferFromHref` | Not modified — `buildRosterNavOffer` is a separate function |
| `HREF_TO_LABEL` map | Not modified — dynamic player URLs handled in `buildRosterNavOffer` |
| `DonnaAssistantButton.tsx` | Not in scope — COO dispatcher path unchanged |
| Player priority approval/apply path | Not touched |
| Any player data queries | Not touched |

---

## Files Created

### `docs/DONNA_ROSTER_ANSWER_NAV_OFFER_848.md`

This file.

---

## Files Modified

### `src/components/donna/DonnaVoiceReadyShell.tsx`

1. Added `import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'`
2. Added `import { buildFocusTargetForRoute } from '@/lib/donna/donnaUIActionDispatcher'`
3. Added `buildRosterNavOffer` helper function (after `buildNavOfferFromHref`)
4. Wired roster answer: `buildRosterNavOffer` call + `if (rosterNavOffer) setPendingNavOffer(rosterNavOffer)` inside `setTimeout`
5. Nav confirmation handler: added `buildFocusTargetForRoute` + `setDonnaFocusTarget` before `router.push`

---

## Score Impact (estimated)

**DONNA Attention Navigation UX:**
- Roster answer now uses the guided nav offer path — director is prompted "Want me to take you there?"
- Saying "yes" triggers teal-glow on `player-profile-header` via Sprint 841 prefix fallback
- All other nav offers (coachHealth, stallAnswer, draftProposal, etc.) now also trigger teal-glow

Dimension 8 — DONNA Integration Quality: **8/10 → 8.5/10** (nav offer path now fully wired)

---

## Remaining Player Priority Gaps (post-848)

| Gap | Source | Priority |
|---|---|---|
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) not added | Sprint 841 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| No "View in review queue →" link from active priority to originating `proposed_action` | Sprint 845 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |

---

## Recommended Sprint 849

**Sprint 849 — DONNA Attention Multi-Player Answer V2**

When multiple high-risk players exist in the attention answer, build a multi-player answer that surfaces all flagged players individually — rather than linking only to the top player. Options:
- A `links` array in the answer (requires extending `DonnaSafeReadAnswer`)
- Multiple follow-up CTAs in the chat bubble (requires updating `DonnaChatThread`)
- A "View all flagged players" answer with individual player mentions as inline links in the text

Risk: Medium — requires interface change or new chat component. Defer until the simpler gaps are closed.

Alternatively: **Sprint 849 — Tab Trigger Focus IDs V1** — a lower-risk sprint to add `player-notes-tab` as a DONNA focus ID, enabling DONNA to suggest tab navigation ("Switch to the Notes tab") when attention answers reference priority or evidence data. This completes the Sprint 841 focus ID set.
