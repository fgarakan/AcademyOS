# Sprint 876 — DONNA Section Navigation Intent Family V1

**Date:** 2026-05-27
**Sprint:** 876
**Type:** Implementation — semantic type fix; adds `'section_nav'` intent family to `DonnaSessionIntentContext`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 873 known limitation — section-navigation results stored as `lastIntentFamily: 'coo_answer'`

---

## Sprint Goal

Sprint 873 added `setSessionIntentContext` after section-navigation results in `handleUIDispatch` so
anaphoric follow-ups ("show me", "take me there", "go there") could re-navigate to the same place
DONNA just went. The working fix used `lastIntentFamily: 'coo_answer'` as a placeholder because the
`DonnaSessionIntentContext` type had no dedicated family for section-navigation.

Sprint 876 resolves the known limitation:
- Adds `'section_nav'` to the `DonnaSessionIntentContext.lastIntentFamily` union type
- Changes the Sprint 873 navigate block from `'coo_answer'` → `'section_nav'`
- Confirms that `resolveFollowUp` requires no logic changes (falls through to `lastSuggestedNavigationHref`)
- Leaves real COO answers unchanged at `'coo_answer'`

---

## Audit Findings

### `DonnaSessionIntentContext.lastIntentFamily` — before Sprint 876

```typescript
// src/lib/donna/donnaFollowUpResolver.ts (lines 38–45)
lastIntentFamily:
  | 'daily_brief'
  | 'review_queue'
  | 'page_actions'
  | 'attention'
  | 'coo_answer'
  | 'roster_attention'
  | null
```

`'section_nav'` was not in the union — Sprint 873 used `'coo_answer'` as the only available
generic family that carried `lastSuggestedNavigationHref`.

### All `lastIntentFamily` write sites (DonnaAssistantButton.tsx)

| Line | Value | Source | Sprint 876 action |
|---|---|---|---|
| 2209 | `'attention'` | Attention report load | Unchanged |
| 2249 | `'daily_brief'` | Daily brief load | Unchanged |
| 2332 | `'review_queue'` | Review queue open | Unchanged |
| **2853** | **`'coo_answer'`** | **handleUIDispatch navigate block (Sprint 873)** | **→ changed to `'section_nav'`** |
| 3047 | `'coo_answer'` | Real COO answer (`handleDonnaCooPrompt`) | Unchanged |

### All `lastIntentFamily` read sites (donnaFollowUpResolver.ts)

| Line | Comparison | Trigger |
|---|---|---|
| 324 | `=== 'daily_brief'` | Anaphoric → `buildBriefAnaphoricResponse` |
| 327 | `=== 'review_queue' \|\| 'attention'` | Anaphoric → navigate to `/director/review` |
| 376 | `=== 'daily_brief'` | Recommendation → `buildBriefRecommendationResponse` |
| 379 | `=== 'review_queue' \|\| 'attention'` | Recommendation → navigate to `/director/review` |

**Critical finding:** Neither `'coo_answer'` nor `'section_nav'` is explicitly compared anywhere
in `resolveFollowUp`. Both fall through to the `lastSuggestedNavigationHref` catch-all:

```typescript
// donnaFollowUpResolver.ts line 335 — fires for any lastIntentFamily not matched above
if (contextIsFresh && context!.lastSuggestedNavigationHref) {
  return {
    actionType: 'navigate',
    responseText: `I'll take you to the ${context!.lastSuggestedNavigationLabel ?? 'relevant page'}.`,
    navigationHref: context!.lastSuggestedNavigationHref,
    confidence: 'medium',
  }
}
```

This means: **no logic changes to `resolveFollowUp` are needed.** Follow-up behaviour is identical
whether the intent family is `'coo_answer'` or `'section_nav'`.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

**Type change — add `'section_nav'` to union:**

Before:
```typescript
lastIntentFamily:
  | 'daily_brief'
  | 'review_queue'
  | 'page_actions'
  | 'attention'
  | 'coo_answer'
  | 'roster_attention'
  | null
```

After:
```typescript
lastIntentFamily:
  | 'daily_brief'
  | 'review_queue'
  | 'page_actions'
  | 'attention'
  | 'coo_answer'
  | 'section_nav'     // Sprint 876 — dedicated family for handleUIDispatch section-navigation results
  | 'roster_attention'
  | null
```

No logic changes to `resolveFollowUp` or any other function in this file.

---

### `src/components/assistant/DonnaAssistantButton.tsx`

**Sprint 873 navigate block — change `'coo_answer'` → `'section_nav'`:**

Before (Sprint 873):
```typescript
setSessionIntentContext({
  lastIntentFamily: 'coo_answer',       // semantic mismatch — section nav ≠ COO answer
  lastResultSectionCount: null,
  lastResultHighPriorityCount: null,
  lastResultItemCount: null,
  lastSuggestedNavigationHref: result.route,
  lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section',
  lastTopicLabel: result.focusTarget?.label ?? null,
  setAt: Date.now(),
})
```

After (Sprint 876):
```typescript
setSessionIntentContext({
  lastIntentFamily: 'section_nav',      // Sprint 876 — semantically correct; follow-up behaviour unchanged
  lastResultSectionCount: null,
  lastResultHighPriorityCount: null,
  lastResultItemCount: null,
  lastSuggestedNavigationHref: result.route,
  lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section',
  lastTopicLabel: result.focusTarget?.label ?? null,
  setAt: Date.now(),
})
```

**Real COO answer block (line 3047) — unchanged:**
```typescript
// handleDonnaCooPrompt — stays 'coo_answer'
setSessionIntentContext({
  lastIntentFamily: 'coo_answer',       // correct — this IS a COO conversational answer
  // ...
})
```

---

## Follow-Up Behavior Proof

### "show me" after a section navigation command

**Before Sprint 876:**
1. Director says "session blocks" → `handleUIDispatch` navigate → `setSessionIntentContext({ lastIntentFamily: 'coo_answer', lastSuggestedNavigationHref: '/director/sessions/abc-123', ... })`
2. Director says "show me" → `resolveFollowUp` → `isAnaphoric = true` → not `daily_brief`, not `review_queue/attention` → falls through to `lastSuggestedNavigationHref` catch-all
3. Returns `{ navigationHref: '/director/sessions/abc-123' }` ✅

**After Sprint 876:**
1. Director says "session blocks" → `handleUIDispatch` navigate → `setSessionIntentContext({ lastIntentFamily: 'section_nav', lastSuggestedNavigationHref: '/director/sessions/abc-123', ... })`
2. Director says "show me" → `resolveFollowUp` → `isAnaphoric = true` → not `daily_brief`, not `review_queue/attention` → falls through to `lastSuggestedNavigationHref` catch-all
3. Returns `{ navigationHref: '/director/sessions/abc-123' }` ✅

**Identical result. Zero behavior change.**

### "show me" after a real COO answer (unchanged path)

1. Director asks a COO question → `handleDonnaCooPrompt` → `setSessionIntentContext({ lastIntentFamily: 'coo_answer', lastSuggestedNavigationHref: ..., ... })`
2. Director says "show me" → same catch-all path ✅ — `'coo_answer'` still works exactly as before

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added `\| 'section_nav'` to `DonnaSessionIntentContext.lastIntentFamily` union; no logic changes |
| `src/components/assistant/DonnaAssistantButton.tsx` | Changed `lastIntentFamily: 'coo_answer'` → `'section_nav'` at the Sprint 873 navigate block only (line 2853); Sprint 802 real COO answer (line 3047) unchanged |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/donna/donnaConversationalRouter.ts` | No change — COO path unaffected |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change — dispatcher patterns unaffected |
| `src/lib/donna/donnaUIActionRegistry.ts` | No change — registry unaffected |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change — highlight logic unaffected |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure React state change |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — client-side only |
| No mutations | ✅ — type addition + semantic rename only |
| No new packages | ✅ — none |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — routing logic unchanged |
| No role boundary changes | ✅ — allowedRoles unchanged |
| Sprint 873 anaphoric follow-ups preserved | ✅ — `lastSuggestedNavigationHref` path unchanged |
| Sprint 802 COO follow-ups preserved | ✅ — line 3047 `'coo_answer'` unchanged |
| Sprint 875 regex patterns preserved | ✅ — SECTION_NAV_ENTRIES unchanged |
| Backward compatible | ✅ — adding a union member is additive; existing assignments unchanged |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-876)

| Limitation | Impact | Resolution |
|---|---|---|
| `'page_actions'` and `'roster_attention'` intent families are set but never explicitly checked in `resolveFollowUp` | Both fall through to `lastSuggestedNavigationHref` catch-all — same pattern as `section_nav` | Low impact; these families work correctly via the catch-all. Explicit handling is a future polish sprint |
| Follow-up context has no navigation history | Only the most recent section-nav is in context; "the one before that" is unsupported | By design (Sprint 874 recommendation for Sprint 876+, deferred further) |

---

## Sprint 877 Recommendation

**Sprint 877 — DONNA Follow-Up Intent Family Explicit Handlers V1**

Currently `resolveFollowUp` only has explicit intent-family handlers for `'daily_brief'`,
`'review_queue'`, and `'attention'`. The `'section_nav'` family now exists but produces
generic "taking you to the relevant page" responses for anaphoric follow-ups.

A `'section_nav'`-specific handler could provide more contextual responses:
*"I'll take you back to Session Blocks — that's where we were."*

No DB changes or migrations required. Pure copy improvement in `donnaFollowUpResolver.ts`.
