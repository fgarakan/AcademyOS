# Sprint 885 — DONNA Daily Brief Elaboration Follow-Up V1

**Date:** 2026-05-27
**Sprint:** 885
**Type:** Implementation — explicit `daily_brief` elaboration handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 884 known limitation — `'daily_brief'` elaboration used generic "sign-off" copy

---

## Sprint Goal

After Sprints 878 and 882, `'section_nav'` and `'coo_answer'` elaboration follow-ups return
intent-specific copy. But when a user says "what is that?" or "tell me more" after the
daily brief loads, the generic `lastTopicLabel` handler fired with semantically wrong copy:

> *"The main thing right now is checking Review Queue for anything that needs your
> sign-off. Want me to open it?"*

(Technically `lastSuggestedNavigationLabel = 'Review Queue'` and `href` is truthy, so
the generic handler interpolates "Review Queue" — not the brief itself.)

Sprint 885 adds an explicit `'daily_brief'` elaboration handler that uses the available
count fields to return brief-specific, count-aware copy:

> *"Today's brief summarizes 4 areas, with 2 higher-priority items to look at first.
> It helps you quickly see what needs attention before you start making decisions.
> I can open the Review Queue if you want the item-by-item list."*

---

## Audit — Pre-Sprint State

### Elaboration branch before Sprint 885

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| 1 | `lastIntentFamily === 'section_nav'` + fresh | `buildSectionNavElaborationResponse` | 878 |
| 2 | `lastIntentFamily === 'coo_answer'` + fresh + href | "That was {label}…" | 882 |
| 3 | `lastTopicLabel` set + fresh | "The main thing right now is checking Review Queue for sign-off." ← **wrong for daily_brief** | 785 |
| 4 | No fresh context / no label | "What would you like me to explain?" | 785 |

For `'daily_brief'`, priority 3 fired with `navLabel = 'Review Queue'` (from
`lastSuggestedNavigationLabel`) and `href = '/director/review'` (truthy), producing
the semantically incorrect "checking Review Queue for sign-off" copy.

### `'daily_brief'` context fields — confirmed from DonnaAssistantButton line 2248

| Field | Value set at write | Example |
|---|---|---|
| `lastIntentFamily` | `'daily_brief'` | — |
| `lastResultSectionCount` | `json.brief.sections.length` | `4` |
| `lastResultHighPriorityCount` | `sections.filter(s => s.priority === 'high').length` | `2` |
| `lastResultItemCount` | `sections.reduce((n, s) => n + s.items.length, 0)` | `9` |
| `lastSuggestedNavigationHref` | `'/director/review'` | — |
| `lastSuggestedNavigationLabel` | `'Review Queue'` | — |
| `lastTopicLabel` | `"today's brief"` | — |

All count fields are always set (derived from the brief response object). No
`DonnaAssistantButton` changes needed.

### ELABORATION_PATTERNS coverage — confirmed, no new patterns needed

| Trigger phrase | Pattern | Sprint |
|---|---|---|
| "what is that?" | `/^what is (that\|this\|it)$/` | 878 |
| "explain that" | `/^explain (that\|this\|it)$/` | 785 |
| "what does that mean?" | `/^what does (that\|this\|it) mean$/` | 878 |
| "tell me more" | `/^tell me more$/` | 785 |
| "why is that important?" | `/^why is that( important\| urgent\| critical)?$/` | 785 |

All Sprint 885 trigger phrases already covered. No new patterns added.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

Single handler inserted at the **top** of the `isElaboration` branch — before `'section_nav'`,
`'coo_answer'`, and the generic `lastTopicLabel` handler.

```typescript
// Sprint 885 — explicit daily_brief elaboration handler.
// Fires first so "what is that?", "tell me more", "explain that" after the daily brief loads
// returns brief-specific explanation copy instead of the generic lastTopicLabel handler's
// "checking Review Queue for sign-off" framing (which fires because lastSuggestedNavigationLabel
// is 'Review Queue' and lastTopicLabel is "today's brief" — both semantically off for elaboration).
if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
  const sectionCount = context!.lastResultSectionCount
  const highCount    = context!.lastResultHighPriorityCount
  const href         = context!.lastSuggestedNavigationHref ?? '/director/review'

  let responseText: string
  if (sectionCount !== null && highCount !== null && highCount > 0) {
    responseText = `Today's brief summarizes ${sectionCount} area${sectionCount !== 1 ? 's' : ''}, with ${highCount} higher-priority item${highCount !== 1 ? 's' : ''} to look at first. It helps you quickly see what needs attention before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
  } else if (sectionCount !== null) {
    responseText = `Today's brief summarizes ${sectionCount} area${sectionCount !== 1 ? 's' : ''} that may need your attention. It helps you quickly understand what matters today before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
  } else {
    responseText = `Today's brief is DONNA's quick summary of what needs your attention today. It helps you understand the important items before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
  }

  return {
    actionType: 'elaborate',
    responseText,
    navigationHref: href,
    confidence: 'medium',
  }
}
```

**Copy logic:**
- `highCount > 0`: uses both counts — *"Today's brief summarizes 4 areas, with 2 higher-priority items to look at first."*
- `highCount === 0 || highCount === null`: uses sectionCount only — *"Today's brief summarizes 4 areas that may need your attention."*
- `sectionCount === null`: no counts — generic — *"Today's brief is DONNA's quick summary of what needs your attention today."*

Note: `highCount > 0` guard avoids the awkward "with 0 higher-priority items" phrasing
that would appear if `highCount` is 0. Matches the `buildBriefRecommendationResponse`
pattern (which also gates on `highCount > 0` before using the count).

---

## Response Copy — Before / After

| Trigger phrase | Context after brief loads | Before Sprint 885 | After Sprint 885 |
|---|---|---|---|
| "what is that?" | `'daily_brief'`, sections=4, high=2 | ❌ "The main thing right now is checking Review Queue for sign-off." | ✅ "Today's brief summarizes 4 areas, with 2 higher-priority items to look at first. It helps you quickly see what needs attention before you start making decisions. I can open the Review Queue if you want the item-by-item list." |
| "tell me more" | `'daily_brief'`, sections=3, high=0 | ❌ "checking Review Queue for sign-off" | ✅ "Today's brief summarizes 3 areas that may need your attention. It helps you quickly understand what matters today before you start making decisions. I can open the Review Queue if you want the item-by-item list." |
| "explain that" | `'daily_brief'`, no counts | ❌ "checking Review Queue for sign-off" | ✅ "Today's brief is DONNA's quick summary of what needs your attention today. It helps you understand the important items before you start making decisions. I can open the Review Queue if you want the item-by-item list." |
| "what is that?" | `'section_nav'`, label = "Session Blocks" | ✅ `buildSectionNavElaborationResponse` | ✅ Unchanged — `'section_nav'` now fires at priority 2 (daily_brief is priority 1) |
| "tell me more" | `'coo_answer'`, href = `/director/players` | ✅ "That was Players…" (Sprint 882) | ✅ Unchanged — `'coo_answer'` fires at priority 3 |
| "show me" | `'daily_brief'` | ✅ `buildBriefAnaphoricResponse` (anaphoric branch — separate) | ✅ Unchanged |
| "what should I do?" | `'daily_brief'` | ✅ `buildBriefRecommendationResponse` (recommendation branch — separate) | ✅ Unchanged |

---

## Handler Priority — `isElaboration` Branch (post-885)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| **1** | **`lastIntentFamily === 'daily_brief'` + fresh** | **Count-aware brief explanation** | **885** |
| 2 | `lastIntentFamily === 'section_nav'` + fresh | `buildSectionNavElaborationResponse` — map lookup or baseline | 878 |
| 3 | `lastIntentFamily === 'coo_answer'` + fresh + href | "That was {label}…" | 882 |
| 4 | `lastTopicLabel` set + fresh (review_queue, attention, coo_answer-no-href, roster_attention) | "The main thing right now is checking {label} for sign-off." | 785 |
| 5 | No fresh context / no label | "What would you like me to explain?" | 785 |

---

## Full Follow-Up Handler Summary (post-885, all elaboration-relevant families)

| Family | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| `'daily_brief'` | `buildBriefAnaphoricResponse` | **"Today's brief summarizes…" (Sprint 885)** | `buildBriefRecommendationResponse` |
| `'review_queue'` | Navigate `/director/review` | Generic lastTopicLabel ("checking pending reviews…") | Navigate `/director/review` |
| `'attention'` | Navigate `/director/review` | Generic lastTopicLabel ("checking urgent items…") | Navigate `/director/review` |
| `'coo_answer'` | Generic href catch-all | "That was {label}…" (Sprint 882) | "DONNA suggested {label}…" (Sprint 881) |
| `'section_nav'` | "I'll take you back to {label}…" (877) | `buildSectionNavElaborationResponse` (878) | `buildSectionNavRecommendationResponse` (879) |
| `'roster_attention'` | Generic href catch-all | Generic lastTopicLabel | Generic Review Queue fallback |

`'daily_brief'` is now the most fully covered family — all 3 follow-up types handled.

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added explicit `'daily_brief'` elaboration handler at the top of the `isElaboration` branch (priority 1); condition: fresh context + `'daily_brief'`; count-aware 3-variant copy using `lastResultSectionCount` and `lastResultHighPriorityCount`; `highCount > 0` guard avoids "with 0 higher-priority items" phrasing |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | All daily_brief context fields already set correctly at line 2248; no changes needed |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure resolver logic |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — client-side only |
| No mutations | ✅ — elaboration resolver never mutates state |
| No new packages | ✅ — none |
| No new patterns | ✅ — all trigger phrases already covered by existing ELABORATION_PATTERNS |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — no route changes |
| No role boundary changes | ✅ — `allowedRoles` unchanged |
| Sprint 882 `coo_answer` elaboration unchanged | ✅ — now priority 3; still fires for all coo_answer + href cases |
| Sprint 878 `section_nav` elaboration unchanged | ✅ — now priority 2; still fires for all section_nav cases |
| Sprint 877 anaphoric section_nav unchanged | ✅ — different branch; untouched |
| Sprint 879/881 recommendation handlers unchanged | ✅ — different branch; untouched |
| `daily_brief` anaphoric handler unchanged | ✅ — different branch; untouched |
| `daily_brief` recommendation handler unchanged | ✅ — different branch; untouched |
| `review_queue` / `attention` elaboration unchanged | ✅ — no explicit handler; still falls to generic lastTopicLabel (priority 4) |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-885)

| Limitation | Impact | Resolution |
|---|---|---|
| `'review_queue'` and `'attention'` elaboration still use generic "sign-off" copy | "checking Review Queue for sign-off" — this is actually semantically correct for review_queue and attention contexts | Low priority; generic copy is appropriate here |
| `'roster_attention'` still future-reserved as a `lastIntentFamily` value | Falls to coo_answer path today; functional | Add dedicated write site when roster follow-up handler is built |
| `SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP` cover 6/14 SECTION_NAV_ENTRIES | 8/14 use baseline fallback | Add entries as new sections are built |

---

## Sprint 886 Recommendation

**Sprint 886 — DONNA Follow-Up Resolver Block Audit V1**

Review the complete follow-up resolver end-to-end across all active intent families
and all pattern groups. Identify any remaining copy that is semantically wrong, missing,
or could be improved. Produce a prioritized list of next follow-up improvements.

Alternatively: **Sprint 886 — DONNA roster_attention Write Site V1** — add a dedicated
`setSessionIntentContext({ lastIntentFamily: 'roster_attention', ... })` write site when
the roster attention intent fires, enabling future `'roster_attention'`-specific follow-up
handlers. This would make `'roster_attention'` fully active.

No DB changes, no migrations, no server actions required for either option.
