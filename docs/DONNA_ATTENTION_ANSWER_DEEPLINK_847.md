# Sprint 847 — DONNA Attention Answer Deep-link V1

**Date:** 2026-05-26
**Sprint:** 847
**Type:** UX — DONNA attention answer href updated to link directly to flagged player profile
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 Dimension 9 (8/10) — remaining gap confirmed in Sprint 845 audit

`buildRosterHubAnswer` in `directorPlayersDonnaIntelligence.ts` always returned `href: '/director/players'` (the general player list) in attention risk answers — even when a specific flagged player's `playerId` was available in `attentionItems`.

**Impact:** When a director asks DONNA "who needs attention?", the follow-up CTA takes them to the full player directory rather than directly to the flagged player's profile. The director has to manually search for the player in the list.

---

## Audit Findings

### `DirectorAttentionItem.playerId` — confirmed always available in live context

```ts
export interface DirectorAttentionItem {
  playerId: string | null   // ← populated from flaggedIds loop in directorDonnaContext.ts
  playerName: string | null
  reason: string
  risk: AttentionRisk
  source: 'observation' | 'attendance' | 'wrap_up' | 'manual'
}
```

In `directorDonnaContext.ts` (section 6), `attentionItems` are built from `flaggedIds` — each item gets `playerId: pid` (the actual player UUID). The type allows `null` for safety, but in the live construction path `pid` is always a string.

### Current link (before Sprint 847)

```ts
return {
  ...
  followUp: 'Want to see the full attention list?',
  href: '/director/players',    ← always general list
  ...
}
```

### Sprint 841 prefix fallback — confirmed compatible

`buildFocusTargetForRoute` in `donnaUIActionDispatcher.ts` (lines 383–395) already handles
`/director/players/<uuid>` routes:

```ts
// Sprint 841: dynamic player profile route — /director/players/<uuid>
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

By setting `href` to `/director/players/${playerId}`, the link is compatible with DONNA's
navigate+highlight system if the URL is navigated through the dispatcher.

### `buildRosterHubAnswer` — `topItem` already derived

```ts
const topItem = highRisk[0] ?? medRisk[0]
```

`topItem` is the most urgent attention item. `topItem.playerId` is already available — it just
wasn't used in the `href`.

### Pattern reference

`buildAttentionQueue()` already links to `/director/players/${alert.playerId}` for high-priority
alert items. This sprint brings the same direct-link treatment to DONNA's conversational answer.

---

## Solution

One file modified: `src/lib/donna/directorPlayersDonnaIntelligence.ts`.

### Before

```ts
const topItem = highRisk[0] ?? medRisk[0]
const reasonNote = topItem?.reason ? ` Most urgent: ${topItem.reason}.` : ''

return {
  actionId: 'roster_attention',
  text: `...`,
  confidence: ctx.confidence,
  sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
  followUp: 'Want to see the full attention list?',
  href: '/director/players',
  isAnswerable: true,
}
```

### After

```ts
const topItem = highRisk[0] ?? medRisk[0]
const reasonNote = topItem?.reason ? ` Most urgent: ${topItem.reason}.` : ''

// Sprint 847: link directly to the top at-risk player's profile when a playerId is available,
// instead of the general player list. buildFocusTargetForRoute already handles
// /director/players/<uuid> routes with targetId: 'player-profile-header' (Sprint 841 prefix
// fallback), so this link is compatible with DONNA's navigate+highlight system if used through
// the dispatcher. The followUp CTA reflects the specific player when known.
const playerHref = topItem?.playerId
  ? `/director/players/${topItem.playerId}`
  : '/director/players'
const followUpText = topItem?.playerId && topItem?.playerName
  ? `View ${topItem.playerName}'s profile`
  : 'Want to see the full attention list?'

return {
  actionId: 'roster_attention',
  text: `...`,
  confidence: ctx.confidence,
  sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
  followUp: followUpText,
  href: playerHref,
  isAnswerable: true,
}
```

**Changes:**
1. Added `playerHref` — `/director/players/${topItem.playerId}` when playerId exists, fallback to `/director/players`
2. Added `followUpText` — `View [name]'s profile` when name is known, fallback to existing `'Want to see the full attention list?'`
3. Updated `followUp` and `href` return fields to use new variables
4. Added comment documenting Sprint 847 rationale and Sprint 841 compatibility

---

## Behavior Before/After

| Condition | Before | After |
|---|---|---|
| Attention items exist, playerId known, name known | `href: /director/players` | `href: /director/players/${playerId}` |
| Attention items exist, playerId known, no name | `href: /director/players` | `href: /director/players/${playerId}` |
| Attention items exist, playerId null | `href: /director/players` | `href: /director/players` (fallback) |
| No attention items | `href: /director/players` | `href: /director/players` (unchanged) |
| followUp CTA label — player known | `'Want to see the full attention list?'` | `'View [name]'s profile'` |
| followUp CTA label — player unknown | `'Want to see the full attention list?'` | `'Want to see the full attention list?'` |
| DONNA answer text | Unchanged | Unchanged |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ pure display change |
| No proposed_actions created | ✅ |
| No player data exposed to unauthorized roles | ✅ director-only context |
| No parent/player visibility | ✅ |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| Demo fallback unaffected | ✅ demo attentionItems have `playerId: null` → fallback to list |
| Empty-state answer unchanged | ✅ |
| Graceful fallback when playerId is null | ✅ falls back to `/director/players` |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `DonnaSafeReadAnswer` interface | No `focusTarget` field needed — Sprint 841 handles `/director/players/<uuid>` at dispatcher level |
| `DonnaVoiceReadyShell.tsx` | Not in sprint scope; roster answer already renders `followUpHref` as plain `<a>` link |
| `HREF_TO_LABEL` map | Dynamic player URLs can't be in a static map; that path was not pursued |
| Empty-state `href` | Stays `/director/players` — no specific player when list is empty |
| DONNA answer body text | Unchanged — "Visit the player directory" guidance remains for other navigation context |
| Demo context attentionItems | `playerId: null` in demo → fallback works correctly |

---

## Files Created

### `docs/DONNA_ATTENTION_ANSWER_DEEPLINK_847.md`

This file.

---

## Files Modified

### `src/lib/donna/directorPlayersDonnaIntelligence.ts`

1. Added `playerHref` variable — direct player profile URL when `topItem.playerId` is available
2. Added `followUpText` variable — player-specific CTA label when name is available
3. Updated `followUp` and `href` in return object to use new variables
4. Added Sprint 847 comment

---

## Score Impact (estimated)

Dimension 9 — Coach-to-Director Evidence Handoff: no direct impact (different dimension)

**DONNA Attention Navigation UX (from Sprint 845 audit)**:
- `href` now points to specific player profile when available
- Director no longer has to manually locate the flagged player from the list
- Consistent with `buildAttentionQueue()` pattern already in use

Remaining Player Priority Gaps (post-847):

| Gap | Source | Priority |
|---|---|---|
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) not added | Sprint 841 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| No "View in review queue →" link from active priority to originating proposed_action | Sprint 845 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |
