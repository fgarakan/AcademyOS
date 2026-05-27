# Sprint 888 — DONNA roster_attention Follow-Up Copy V1

**Date:** 2026-05-27
**Sprint:** 888
**Type:** Follow-up copy improvement — roster_attention dedicated handlers
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 887 remaining limitation — elaboration and recommendation copy generic ("That was Player Directory / DONNA suggested Player Directory") instead of roster-specific

---

## Sprint Goal

Improve `roster_attention` follow-up copy now that Sprint 887 activated `roster_attention`
as a real `lastIntentFamily`. Keep behavior and navigation unchanged — only replace the
shared `coo_answer` copy with roster-specific elaboration and recommendation text.

---

## Pre-Sprint Audit

### 1. roster_attention written as lastIntentFamily (Sprint 887)

Confirmed active at `DonnaAssistantButton.tsx` line 3051:
```typescript
lastIntentFamily: routing.intent === 'roster_attention' ? 'roster_attention' : 'coo_answer',
```
✅ Active write site confirmed.

### 2. Anaphoric behavior correct — no change needed

Generic href catch-all at line 452 fires for `roster_attention`:
> "I'll take you to the Player Directory." (or specific player profile)

Navigation is correct. No roster-specific anaphoric copy is needed. ✅

### 3. Elaboration — current copy (Sprint 887 shared handler, pre-888)

Current handler at line 512 (Sprint 882 + Sprint 887 extension):
```typescript
if (contextIsFresh && (context!.lastIntentFamily === 'coo_answer' || context!.lastIntentFamily === 'roster_attention') && context!.lastSuggestedNavigationHref) {
  const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
  return {
    responseText: label
      ? `That was ${label} — the page DONNA suggested based on your question. I can take you there…`
      : `That was the page DONNA suggested based on your question. I can take you there…`
  }
}
```

When roster_attention fires, `lastSuggestedNavigationLabel` is one of:
- `'View {playerName}\'s profile'` (player-specific)
- `'Want to see the full attention list?'` (generic follow-up text)

Neither is suitable as direct copy injection. Result pre-888:
> "That was Want to see the full attention list? — the page DONNA suggested based on your question."

or

> "That was View Carlos's profile — the page DONNA suggested based on your question."

Both are awkward or confusing. ✅ Confirmed: roster-specific copy needed.

### 4. Recommendation — current copy (Sprint 887 shared handler, pre-888)

Current handler at line 569 (Sprint 881 + Sprint 887 extension):
```typescript
if (contextIsFresh && (context!.lastIntentFamily === 'coo_answer' || context!.lastIntentFamily === 'roster_attention') && context!.lastSuggestedNavigationHref) {
  const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
  return {
    responseText: label
      ? `DONNA suggested ${label}. The best next step is to open it and review what needs your attention there.`
      : `DONNA suggested a page for this. The best next step is to open it and review what needs your attention there.`
  }
}
```

Result pre-888:
> "DONNA suggested Want to see the full attention list? The best next step is to open it and review what needs your attention there."

or

> "DONNA suggested View Carlos's profile. The best next step is to open it and review what needs your attention there."

Both are grammatically awkward ("suggested Want to see...") or imprecise for the roster context. ✅ Confirmed: roster-specific copy needed.

### 5. No new fields required

- `lastSuggestedNavigationHref` — always set for roster_attention (`buildRosterHubAnswer` guarantees `/director/players` or `/director/players/${id}`)
- `lastSuggestedNavigationLabel` — set as a follow-up prompt or player name — used as presence condition only (not injected into copy)

No new context fields needed. ✅

---

## Implementation

### Design decision — label-as-condition, not label-as-text

For `coo_answer` handlers, the label (e.g., "Curriculum", "Review Queue") is a page name
suitable for direct injection: "That was Curriculum — the page DONNA suggested…"

For `roster_attention` handlers, the label is a follow-up prompt or player name — not a
page name, not suitable for direct injection:
- ❌ "That was Want to see the full attention list? — DONNA's summary…" (awkward)
- ❌ "DONNA flagged View Carlos's profile." (imprecise)

Sprint 888 uses **label-as-condition** instead: label presence determines which copy variant
to use, but the label text is not injected into the response.

---

### Change 1 — Elaboration: Dedicated roster_attention handler

Added before the Sprint 882 `coo_answer` handler:

```typescript
// Sprint 888 — explicit roster_attention elaboration handler.
// Fires before the coo_answer handler (Sprint 882) so roster-specific copy replaces
// the generic "That was Player Directory — the page DONNA suggested" framing.
// Label-as-condition: lastSuggestedNavigationLabel is a follow-up prompt or player name —
// not suitable for direct injection into copy; presence determines which variant to use.
// Navigation: lastSuggestedNavigationHref always set for roster_attention
// (buildRosterHubAnswer guarantees href = '/director/players' or '/director/players/${id}').
if (contextIsFresh && context!.lastIntentFamily === 'roster_attention' && context!.lastSuggestedNavigationHref) {
  return {
    actionType: 'elaborate',
    responseText: context!.lastSuggestedNavigationLabel
      ? `That was the roster attention view — DONNA's summary of players or roster items that may need your attention. I can take you there or help you decide whether it matters right now.`
      : `That was DONNA's roster attention summary. I can take you there or help you decide whether it matters right now.`,
    navigationHref: context!.lastSuggestedNavigationHref,
    confidence: 'medium',
  }
}
```

**Sprint 882 `coo_answer` handler updated:** `|| context!.lastIntentFamily === 'roster_attention'`
removed (Sprint 887 extension superseded; `roster_attention` now caught by Sprint 888 handler first).
Comment updated to note the supersession.

---

### Change 2 — Recommendation: Dedicated roster_attention handler

Added before the Sprint 881 `coo_answer` handler:

```typescript
// Sprint 888 — explicit roster_attention recommendation handler.
// Fires before the coo_answer handler (Sprint 881) so roster-specific copy replaces
// the generic "DONNA suggested Player Directory" framing.
// Label-as-condition: same rationale as elaboration handler above.
if (contextIsFresh && context!.lastIntentFamily === 'roster_attention' && context!.lastSuggestedNavigationHref) {
  return {
    actionType: 'recommend',
    responseText: context!.lastSuggestedNavigationLabel
      ? `DONNA flagged roster attention. The best next step is to open the roster view and review which players or roster items need attention. I can take you there.`
      : `DONNA flagged something in the roster. The best next step is to open the roster view and review what needs attention. I can take you there.`,
    navigationHref: context!.lastSuggestedNavigationHref,
    confidence: 'medium',
  }
}
```

**Sprint 881 `coo_answer` handler updated:** `|| context!.lastIntentFamily === 'roster_attention'`
removed (Sprint 887 extension superseded). Comment updated.

---

### Change 3 — Generic fallback comment updated

```
// Generic recommendation fallback — fires when: (a) no fresh context, or (b) coo_answer
// with no suggested href (DONNA answered conversationally without a page suggestion), or
// (c) roster_attention with no href (impossible in practice — buildRosterHubAnswer always
// sets href), or (d) any other intent family not handled above (stale or unhandled context).
```

---

## Before / After Copy Comparison

### Elaboration ("what is that?", "tell me more")

| Scenario | Pre-888 | Post-888 |
|---|---|---|
| roster_attention, label = "Want to see the full attention list?" | "That was Want to see the full attention list? — the page DONNA suggested based on your question." ❌ | "That was the roster attention view — DONNA's summary of players or roster items that may need your attention. I can take you there or help you decide whether it matters right now." ✅ |
| roster_attention, label = "View Carlos's profile" | "That was View Carlos's profile — the page DONNA suggested based on your question." ❌ | "That was the roster attention view — DONNA's summary of players or roster items that may need your attention. I can take you there or help you decide whether it matters right now." ✅ |
| roster_attention, no label | "That was the page DONNA suggested based on your question." ❌ | "That was DONNA's roster attention summary. I can take you there or help you decide whether it matters right now." ✅ |
| coo_answer, label = "Curriculum" | "That was Curriculum — the page DONNA suggested…" ✅ | "That was Curriculum — the page DONNA suggested…" ✅ (unchanged) |

### Recommendation ("what do you recommend?", "what now?")

| Scenario | Pre-888 | Post-888 |
|---|---|---|
| roster_attention, label = "Want to see the full attention list?" | "DONNA suggested Want to see the full attention list? The best next step is to open it…" ❌ | "DONNA flagged roster attention. The best next step is to open the roster view and review which players or roster items need attention. I can take you there." ✅ |
| roster_attention, label = "View Carlos's profile" | "DONNA suggested View Carlos's profile. The best next step is to open it…" ❌ | "DONNA flagged roster attention. The best next step is to open the roster view and review which players or roster items need attention. I can take you there." ✅ |
| roster_attention, no label | "DONNA suggested a page for this. The best next step is to open it…" ❌ | "DONNA flagged something in the roster. The best next step is to open the roster view and review what needs attention. I can take you there." ✅ |
| coo_answer, label = "Curriculum" | "DONNA suggested Curriculum. The best next step is to open it…" ✅ | "DONNA suggested Curriculum. The best next step is to open it…" ✅ (unchanged) |

---

## Handler Priority Table (post-888)

### Elaboration branch

| Priority | Family | Handler | Sprint |
|---|---|---|---|
| 1 | `'daily_brief'` | `buildBriefAnaphoricResponse` | 885 |
| 2 | `'section_nav'` | `buildSectionNavElaborationResponse` | 878 |
| **3** | **`'roster_attention'` + href** | **Roster-specific copy** | **888** |
| 4 | `'coo_answer'` + href | "That was {label} — the page DONNA suggested…" | 882 |
| 5 | Any + `lastTopicLabel` | Generic "checking {label} for sign-off" | original |
| 6 | No context | Generic fallback | original |

### Recommendation branch

| Priority | Family | Handler | Sprint |
|---|---|---|---|
| 1 | `'daily_brief'` | `buildBriefRecommendationResponse` | 785 |
| 2 | `'review_queue'` + `'attention'` | Navigate to Review Queue | 785 |
| 3 | `'section_nav'` | `buildSectionNavRecommendationResponse` | 879 |
| **4** | **`'roster_attention'` + href** | **Roster-specific copy** | **888** |
| 5 | `'coo_answer'` + href | "DONNA suggested {label}…" | 881 |
| 6 | Any / no context | Generic Review Queue fallback | original |

---

## Full Coverage Matrix (post-888)

| Family | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| `'daily_brief'` | ✅ Explicit (785) | ✅ Explicit (885) | ✅ Explicit (785) |
| `'review_queue'` | ✅ Explicit (785) | ✅ Generic correct | ✅ Explicit (785) |
| `'attention'` | ✅ Explicit (785) | ✅ Generic acceptable | ✅ Explicit (785) |
| `'coo_answer'` | ✅ Generic correct | ✅ Explicit (882) | ✅ Explicit (881) |
| `'section_nav'` | ✅ Explicit (877) | ✅ Explicit (878) | ✅ Explicit (879) |
| `'roster_attention'` | ✅ Generic correct | ✅ **Explicit (888)** | ✅ **Explicit (888)** |

All 6 active families × 3 pattern groups = 18 cells. ✅ All correct.
`roster_attention` now has dedicated handlers for all 3 meaningful follow-up types.

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
| No write-site changes (DonnaAssistantButton.tsx not touched) | ✅ |
| No classifier/router/intelligence changes | ✅ |
| No regex/pattern changes | ✅ |
| No new packages | ✅ |
| coo_answer elaboration copy unchanged | ✅ |
| coo_answer recommendation copy unchanged | ✅ |
| daily_brief behavior unchanged | ✅ |
| section_nav behavior unchanged | ✅ |
| review_queue / attention behavior unchanged | ✅ |
| Anaphoric navigation for roster_attention unchanged | ✅ |
| TypeScript clean | ✅ |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added Sprint 888 roster_attention elaboration handler (priority 3 in elaboration branch); reverted Sprint 887 `\|\| roster_attention` from Sprint 882 coo_answer check; added Sprint 888 roster_attention recommendation handler (priority 4 in recommendation branch); reverted Sprint 887 `\|\| roster_attention` from Sprint 881 coo_answer check; updated comments on both coo_answer handlers; updated generic fallback comment |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_ROSTER_ATTENTION_FOLLOW_UP_COPY_888.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_ROSTER_ATTENTION_WRITE_SITE_887.md` | Sprint 887 state, label analysis |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` | Coverage matrix reference |
| `src/components/assistant/DonnaAssistantButton.tsx` | Write-site audit (confirmed no changes needed) |

---

## Known Limitations (post-888)

None. All 6 active intent families have dedicated or appropriate generic handlers across all
3 follow-up pattern groups. `roster_attention` is now fully covered with roster-specific copy.

**Minor design note:** The label-as-condition approach (label present → version A, no label →
version B) does not inject the actual label text. This is intentional: roster_attention labels
are follow-up prompts or player names, not page names suitable for copy injection. If roster
copy ever needs to reference the player name directly (e.g., "That was Carlos's profile —
DONNA flagged him for your attention"), that requires a dedicated player-name field in the
context, not the existing `lastSuggestedNavigationLabel`.

---

## Sprint 889 Recommendation

**Sprint 889 — DONNA Follow-Up Pattern Expansion V1**

Audit `ANAPHORIC_PATTERNS` and `SEQUENTIAL_PATTERNS` for missing common phrases and add
safe additions. Current confirmed gaps:
- "open it for me" — not covered by any ANAPHORIC_PATTERN
- "let me see it" — not covered
- "bring it up" — not covered
- "navigate there" — not covered

Adding these would improve recognition rate for anaphoric follow-ups without changing
response behavior (all would route to the same `lastSuggestedNavigationHref` catch-all).

No DB changes, no migrations, no server actions required.

**Alternative Sprint 889:**
DONNA follow-up resolver — `review_queue` and `attention` elaboration dedicated handlers
(replace generic "checking Review Queue for sign-off" with family-specific copy, similar to
Sprint 885 which fixed `daily_brief` elaboration). Currently classified as "Generic +
acceptable" in Sprint 886 audit — low urgency.
