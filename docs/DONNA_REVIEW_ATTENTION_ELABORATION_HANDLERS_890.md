# Sprint 890 — DONNA review_queue and attention Elaboration Handlers V1

**Date:** 2026-05-27
**Sprint:** 890
**Type:** Elaboration copy polish — review_queue and attention dedicated handlers
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 886 classification "Generic + acceptable" — elaboration for review_queue and attention falls to generic "checking Review Queue for sign-off" copy

---

## Sprint Goal

Replace the generic elaboration copy for `review_queue` and `attention` with dedicated
family-specific handlers so "what is that?", "explain that", "what does that mean?", and
"tell me more" sound intentional instead of relying on the generic `lastTopicLabel` fallback.

---

## Pre-Sprint Audit

### 1. review_queue written as lastIntentFamily

`handleOpenReviewQueue` in `DonnaAssistantButton.tsx` line 2332 writes:
```typescript
setSessionIntentContext({
  lastIntentFamily: 'review_queue',
  lastSuggestedNavigationHref: '/director/review',
  lastSuggestedNavigationLabel: 'Review Queue',
  lastTopicLabel: 'pending reviews',
  ...
})
```
✅ Confirmed active.

### 2. attention written as lastIntentFamily

`handleFetchAttentionReport` in `DonnaAssistantButton.tsx` line 2208 writes:
```typescript
setSessionIntentContext({
  lastIntentFamily: 'attention',
  lastSuggestedNavigationHref: '/director/review',
  lastSuggestedNavigationLabel: 'Review Queue',
  lastTopicLabel: 'urgent items',
  ...
})
```
✅ Confirmed active.

### 3. Both fall to the generic lastTopicLabel elaboration handler (pre-890)

Elaboration branch priority order pre-890:

| Priority | Check | review_queue | attention |
|---|---|---|---|
| 1 | `lastIntentFamily === 'daily_brief'` | ❌ skip | ❌ skip |
| 2 | `lastIntentFamily === 'section_nav'` | ❌ skip | ❌ skip |
| 3 | `lastIntentFamily === 'roster_attention' && href` | ❌ skip | ❌ skip |
| 4 | `lastIntentFamily === 'coo_answer' && href` | ❌ skip | ❌ skip |
| **5** | **`lastTopicLabel` generic handler** | **✅ fires** | **✅ fires** |

Both families have `lastTopicLabel` set (`'pending reviews'` / `'urgent items'`), so the generic
handler fires in both cases. Both also have `lastSuggestedNavigationHref = '/director/review'`
and `lastSuggestedNavigationLabel = 'Review Queue'`, producing:

> "The main thing right now is checking Review Queue for anything that needs your sign-off. Want me to open it?"

This is the same copy for both `review_queue` and `attention`. ✅ Confirmed.

### 4. Both have lastSuggestedNavigationHref = '/director/review'

Confirmed from write-site audit (Sprint 883). Both point to `/director/review`. ✅

### 5. No new fields required

- `lastSuggestedNavigationHref ?? '/director/review'` provides the navigation target.
- `context!.lastIntentFamily` distinguishes `review_queue` from `attention`.
- No additional fields needed. ✅

### 6. ELABORATION_PATTERNS already cover all relevant trigger phrases

| Trigger phrase | Pattern | Covered? |
|---|---|---|
| "what is that?" | `/^what is (that\|this\|it)$/` | ✅ |
| "explain that" | `/^explain (that\|this\|it)$/` | ✅ |
| "what does that mean?" | `/^what does (that\|this\|it) mean$/` | ✅ |
| "tell me more" | `/^tell me more$/` | ✅ |
| "why?" | `/^why$/` | ✅ |
| "why is that important?" | `/^why is that( important\| urgent\| critical)?$/` | ✅ |

No new patterns needed. ✅

### 7. No new patterns added

Confirmed — only a new handler is added; `ELABORATION_PATTERNS` is not modified. ✅

---

## Before / After Copy

### review_queue elaboration ("what is that?")

| | Copy | Navigation |
|---|---|---|
| **Pre-890** | "The main thing right now is checking Review Queue for anything that needs your sign-off. Want me to open it?" | `/director/review` |
| **Post-890** | "That was the Review Queue — the place where DONNA collects items waiting for your approval or review. I can open it so you can go through each item." | `/director/review` |

### attention elaboration ("tell me more")

| | Copy | Navigation |
|---|---|---|
| **Pre-890** | "The main thing right now is checking Review Queue for anything that needs your sign-off. Want me to open it?" | `/director/review` |
| **Post-890** | "That was the attention view — DONNA's summary of urgent items that may need your review first. I can open the Review Queue so you can handle them." | `/director/review` |

**Navigation unchanged in both cases.** Only the response text changes.

---

## Implementation

**Combined handler pattern** — mirrors the existing `review_queue || attention` pattern used in
the anaphoric and recommendation branches. Placed as Priority 5 in the elaboration branch,
immediately before the generic `lastTopicLabel` fallback.

```typescript
// Sprint 890 — explicit review_queue and attention elaboration handlers.
// Both families previously fell to the generic lastTopicLabel handler: "checking Review Queue
// for sign-off" (Sprint 886 audit: "Generic + acceptable" — functionally correct but imprecise).
// review_queue copy should describe the queue's purpose; attention copy should name the feature
// rather than using "sign-off" framing. Combined check mirrors the existing pattern used in the
// anaphoric and recommendation branches for these two families.
if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
  const isReviewQueue = context!.lastIntentFamily === 'review_queue'
  const href = context!.lastSuggestedNavigationHref ?? '/director/review'
  return {
    actionType: 'elaborate',
    responseText: isReviewQueue
      ? `That was the Review Queue — the place where DONNA collects items waiting for your approval or review. I can open it so you can go through each item.`
      : `That was the attention view — DONNA's summary of urgent items that may need your review first. I can open the Review Queue so you can handle them.`,
    navigationHref: href,
    confidence: 'medium',
  }
}
```

---

## Handler Priority Table — Elaboration Branch (post-890)

| Priority | Family | Handler | Sprint | Copy |
|---|---|---|---|---|
| 1 | `'daily_brief'` | Count-aware brief explanation | 885 | "Today's brief summarizes N areas…" |
| 2 | `'section_nav'` | `buildSectionNavElaborationResponse` | 878 | Map lookup or "That was {label} — the section DONNA just helped you navigate to." |
| 3 | `'roster_attention'` + href | Roster-specific copy | 888 | "That was the roster attention view — DONNA's summary…" |
| 4 | `'coo_answer'` + href | "That was {label} — the page DONNA suggested…" | 882 | COO page name |
| **5** | **`'review_queue'` + `'attention'`** | **Dedicated family-specific copy** | **890** | **Queue purpose / attention feature description** |
| 6 | Any + `lastTopicLabel` | Generic "checking {label} for sign-off" | original | Generic |
| 7 | No context | Generic fallback | original | "What would you like me to explain?" |

---

## Full Coverage Matrix (post-890)

| Family | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| `'daily_brief'` | ✅ Explicit (785) | ✅ Explicit (885) | ✅ Explicit (785) |
| `'review_queue'` | ✅ Explicit (785) | ✅ **Explicit (890)** | ✅ Explicit (785) |
| `'attention'` | ✅ Explicit (785) | ✅ **Explicit (890)** | ✅ Explicit (785) |
| `'coo_answer'` | ✅ Generic correct | ✅ Explicit (882) | ✅ Explicit (881) |
| `'section_nav'` | ✅ Explicit (877) | ✅ Explicit (878) | ✅ Explicit (879) |
| `'roster_attention'` | ✅ Generic correct | ✅ Explicit (888) | ✅ Explicit (888) |

All 6 active families × 3 follow-up types = 18 cells. ✅ All explicit or generic-correct.

**Sprint 890 closes the last "Generic + acceptable" cell** from the Sprint 886 coverage matrix.
All 18 cells are now explicit-correct or generic-correct. No "acceptable" cells remain.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB changes | ✅ |
| No migrations | ✅ |
| No server action changes | ✅ |
| No context fetch changes | ✅ |
| No route logic changes | ✅ |
| No new UI actions | ✅ |
| No dispatcher changes | ✅ |
| No classifier/router changes | ✅ |
| No pattern changes | ✅ |
| DonnaAssistantButton.tsx not touched | ✅ |
| No new packages | ✅ |
| review_queue anaphoric unchanged | ✅ |
| review_queue recommendation unchanged | ✅ |
| attention anaphoric unchanged | ✅ |
| attention recommendation unchanged | ✅ |
| daily_brief behavior unchanged | ✅ |
| coo_answer behavior unchanged | ✅ |
| section_nav behavior unchanged | ✅ |
| roster_attention behavior unchanged | ✅ |
| All ANAPHORIC_PATTERNS unchanged | ✅ |
| All ELABORATION_PATTERNS unchanged | ✅ |
| All RECOMMENDATION_PATTERNS unchanged | ✅ |
| Navigation for both families unchanged (/director/review) | ✅ |
| TypeScript clean | ✅ |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Combined `review_queue \|\| attention` elaboration handler added as Priority 5 in elaboration branch (before generic `lastTopicLabel` fallback); `isReviewQueue` local const selects between two copy variants; Sprint 890 comment block added |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_REVIEW_ATTENTION_ELABORATION_HANDLERS_890.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_FOLLOW_UP_PATTERN_EXPANSION_889.md` | Sprint 889 state |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` | "Generic + acceptable" classification source |

---

## Known Limitations (post-890)

**None remaining in the elaboration branch.** Sprint 890 closes the last "Generic + acceptable"
cell identified in the Sprint 886 audit. The resolver now has:
- 10 explicit elaboration handlers (up from 8 post-885)
- 0 "Generic + acceptable" cells
- 2 "Generic + correct" cells (coo_answer anaphoric, roster_attention anaphoric)

**Resolver is now fully covered across all active families and all three follow-up types.**

---

## Sprint 891 Recommendation

**Sprint 891 — DONNA Follow-Up Resolver Full Coverage Audit V2**

Full re-audit of `resolveFollowUp` post-Sprints 887–890 to certify the resolver's updated
state. Sprint 886 was the last full certification; four sprints of changes have accumulated:

| Sprint | Change |
|---|---|
| 887 | `roster_attention` write-site activated; elaboration + recommendation handlers extended |
| 888 | `roster_attention` dedicated elaboration + recommendation copy; `coo_answer` handlers reverted to coo_answer-only |
| 889 | 5 new `ANAPHORIC_PATTERNS` (12 → 17) |
| 890 | `review_queue` + `attention` dedicated elaboration handlers |

A V2 audit would:
- Re-verify all write sites (5 non-null values + null)
- Re-certify the 18-cell coverage matrix with current handler inventory
- Update the explicit handler inventory (now 12 explicit handlers vs. 10 in Sprint 886)
- Confirm ANAPHORIC_PATTERNS count (17) and coverage
- Issue a new certification statement

No code changes expected — audit-only sprint.

**Alternative Sprint 891:**
DONNA normalizer expansion — add "please" (and optionally "can you") to the normalizer
filler-word strip list so "open it please", "show me please", "can you show me" match
existing `ANAPHORIC_PATTERNS` without requiring new pattern entries.
