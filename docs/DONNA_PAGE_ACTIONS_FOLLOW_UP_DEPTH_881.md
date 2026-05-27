# Sprint 881 — DONNA Page Actions Follow-Up Depth V1

**Date:** 2026-05-27
**Sprint:** 881
**Type:** Implementation — explicit `coo_answer` recommendation handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 880 known limitation — `'page_actions'` and `'roster_attention'` recommendation still generic

---

## Sprint Goal

After Sprint 879–880, `'section_nav'` recommendation follow-ups return section-specific
action-oriented copy. But when DONNA's COO answer suggests a specific page ("I can open
Players for you") and the user says "what should I do next?", the generic Review Queue
fallback fires:

> *"The Review Queue is usually a good starting point — those are the items waiting on
> your approval. Want me to open it?"*

This is semantically wrong when DONNA's suggestion pointed to a non-Review-Queue page.

Sprint 881 adds a single explicit `'coo_answer'` recommendation handler that fires when
`lastSuggestedNavigationHref` is set, returning the suggested page as the recommended
next step instead of redirecting to the Review Queue.

---

## Audit Finding — `'page_actions'` Is Never Written

Sprint 880 recommendation identified this sprint as "DONNA Page Actions Follow-Up Depth."
The audit performed at the start of Sprint 881 found:

### All `setSessionIntentContext` write sites

| File | Line | Value written | Trigger |
|---|---|---|---|
| `DonnaAssistantButton.tsx` | 2208 | `'attention'` | Attention report loads |
| `DonnaAssistantButton.tsx` | 2248 | `'daily_brief'` | Daily brief loads |
| `DonnaAssistantButton.tsx` | 2332 | `'review_queue'` | Review Queue opens |
| `DonnaAssistantButton.tsx` | 2856 | `'section_nav'` | Section-nav result (Sprint 876) |
| `DonnaAssistantButton.tsx` | 3050 | `'coo_answer'` | Any non-blocked COO answer |

**`'page_actions'` is declared in `DonnaSessionIntentContext.lastIntentFamily` but is
never written by any code path. Any `lastIntentFamily === 'page_actions'` check added
to the resolver would be permanently dead code.**

### Correct active family for "page-action suggestions"

When DONNA's COO responds with a page suggestion (e.g. "I can open Players for you"),
`setSessionIntentContext` at line 3050 writes `'coo_answer'` with:
- `lastSuggestedNavigationHref: composed.nextStepHref ?? null`
- `lastSuggestedNavigationLabel: composed.nextStepLabel ?? null`
- `lastTopicLabel: composed.nextStepLabel ?? null`

This is the correct family to target. No `DonnaAssistantButton.tsx` changes are needed.

---

## Current Behavior Before Sprint 881

### `'coo_answer'` + `isAnaphoric` — already correct

Falls to the generic `lastSuggestedNavigationHref` catch-all (resolver line 449):
```
"I'll take you to the {label}."
```
This navigates to the suggested page. **No change needed.**

### `'coo_answer'` + `isElaboration` — acceptable, not misleading

Falls to the generic `lastTopicLabel` handler (resolver line 476):
```
"The main thing right now is checking {navLabel} for anything that needs your sign-off. Want me to open it?"
```
Names the right page, offers to navigate. Not ideal but not misleading. **No change needed
per sprint scope (spec: "only if current copy is misleading").**

### `'coo_answer'` + `isRecommendation` — semantically wrong ❌

Falls to generic fallback (resolver line 515):
```
"The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?"
```
**Wrong** when DONNA's COO suggestion pointed to `/director/players`, `/director/sessions`,
or any other non-Review-Queue page. The user asked for a recommendation and DONNA redirects
them to an unrelated queue. Sprint 881 fixes this.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

Single handler inserted in the `isRecommendation` branch, after the Sprint 879
`'section_nav'` check and before the generic fallback:

```typescript
// Sprint 881 — explicit coo_answer recommendation handler.
// Audit finding: 'page_actions' is declared in the union type but never written — any handler
// for it would be dead code. The active family for COO page-suggestion responses is 'coo_answer'
// (set at DonnaAssistantButton.tsx line 3050 for all non-blocked COO answers).
// When lastSuggestedNavigationHref is set, the generic Review Queue fallback is semantically
// wrong — the user should go to the page DONNA just suggested, not the Review Queue.
if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
  const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
  return {
    actionType: 'recommend',
    responseText: label
      ? `DONNA suggested ${label}. The best next step is to open it and review what needs your attention there. I can take you there.`
      : `DONNA suggested a page for this. The best next step is to open it and review what needs your attention there. I can take you there.`,
    navigationHref: context!.lastSuggestedNavigationHref,
    confidence: 'medium',
  }
}
```

**Condition:** fresh context + `lastIntentFamily === 'coo_answer'` + `lastSuggestedNavigationHref` is non-null.

When `coo_answer` has NO `lastSuggestedNavigationHref` (DONNA answered conversationally
with no page suggestion), the handler does NOT fire and the generic Review Queue fallback
remains — which is correct (no specific page was suggested).

---

## Response Copy — Before / After

| Trigger phrase | Context after COO answer | Before Sprint 881 | After Sprint 881 |
|---|---|---|---|
| "what should I do next?" | `'coo_answer'`, href = `/director/players`, label = "Players" | ❌ "The Review Queue is usually a good starting point…" | ✅ "DONNA suggested Players. The best next step is to open it and review what needs your attention there. I can take you there." |
| "what do you recommend?" | `'coo_answer'`, href = `/director/sessions`, label = "Sessions" | ❌ "The Review Queue is usually a good starting point…" | ✅ "DONNA suggested Sessions. The best next step is to open it and review what needs your attention there. I can take you there." |
| "what now?" | `'coo_answer'`, href = `/director/review`, label = "Review Queue" | ✅ "The Review Queue is usually a good starting point…" (same destination, different copy) | ✅ "DONNA suggested Review Queue. The best next step is to open it and review what needs your attention there. I can take you there." |
| "what should I do?" | `'coo_answer'`, no href (conversational answer only) | ✅ Generic Review Queue fallback — correct | ✅ Unchanged — generic fallback still fires (no href → handler skipped) |
| "what should I do next?" | `'section_nav'`, label = "Session Blocks" | ✅ `buildSectionNavRecommendationResponse` — Sprint 879 | ✅ Unchanged — `'section_nav'` check fires before `'coo_answer'` check |
| "what do you recommend?" | `'daily_brief'` | ✅ `buildBriefRecommendationResponse` — Sprint 785 | ✅ Unchanged — `'daily_brief'` check at priority 1 |
| "what should I do first?" | `'review_queue'` | ✅ Navigate to `/director/review` — Sprint 785 | ✅ Unchanged — `'review_queue'` check at priority 2 |
| "what now?" | no fresh context | ✅ Generic Review Queue fallback | ✅ Unchanged |

---

## Handler Priority — `isRecommendation` Branch (post-881)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| 1 | `lastIntentFamily === 'daily_brief'` + fresh | `buildBriefRecommendationResponse` | 785 |
| 2 | `lastIntentFamily === 'review_queue' \| 'attention'` + fresh | Navigate to `/director/review` | 785 |
| 3 | `lastIntentFamily === 'section_nav'` + fresh | `buildSectionNavRecommendationResponse` | 879 |
| **4** | **`lastIntentFamily === 'coo_answer'` + fresh + `lastSuggestedNavigationHref` set** | **Suggest the COO-recommended page** | **881** |
| 5 | Any other family or stale context, or `coo_answer` with no href | Generic "Review Queue is a good starting point" | 785 |

---

## Fields Used

| Field | Source | Value example |
|---|---|---|
| `lastIntentFamily` | DonnaAssistantButton line 3050 | `'coo_answer'` |
| `lastSuggestedNavigationHref` | `composed.nextStepHref` from COO answer | `'/director/players'` |
| `lastSuggestedNavigationLabel` | `composed.nextStepLabel` from COO answer | `'Players'` |
| `lastTopicLabel` | `composed.nextStepLabel` (same field) | `'Players'` |

`lastSuggestedNavigationLabel ?? lastTopicLabel` — both are set from `composed.nextStepLabel`
in the same write; in practice they will always be the same value. The null-coalescing is
a safety guard only.

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added explicit `'coo_answer'` recommendation handler in `isRecommendation` branch — priority 4, after `'section_nav'`, before generic fallback; updated generic fallback comment to describe all remaining cases |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | `'coo_answer'` write site already exists at line 3050; no new write site needed |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change — dispatcher not involved |
| `src/lib/donna/donnaUIActionRegistry.ts` | No change |
| `src/lib/donna/donnaConversationalRouter.ts` | No change |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure resolver logic |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — client-side only |
| No mutations | ✅ — recommendation resolver never mutates state |
| No new packages | ✅ — none |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — no route changes |
| No role boundary changes | ✅ — `allowedRoles` unchanged |
| Sprint 879 `section_nav` recommendation unchanged | ✅ — checked at priority 3, before new handler |
| Sprint 878 `section_nav` elaboration unchanged | ✅ — different branch; untouched |
| Sprint 877 anaphoric section_nav handler unchanged | ✅ — different branch; untouched |
| `daily_brief` recommendation unchanged | ✅ — priority 1 check unchanged |
| `review_queue/attention` recommendation unchanged | ✅ — priority 2 check unchanged |
| `coo_answer` with no href falls to generic fallback | ✅ — handler condition requires non-null href |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-881)

| Limitation | Impact | Resolution |
|---|---|---|
| `'page_actions'` is never written — any future handler for it would be dead code | No impact until a write site is added | Add `setSessionIntentContext({ lastIntentFamily: 'page_actions', ... })` in DonnaAssistantButton when a dedicated "page actions" response type is built |
| `'roster_attention'` is also never written (like `'page_actions'`) | No impact | Same resolution path |
| `'coo_answer'` elaboration still uses generic `lastTopicLabel` handler | Copy is acceptable ("The main thing right now is checking {navLabel} for sign-off") — not misleading | Low priority polish sprint if needed |
| `SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP` cover 6/14 SECTION_NAV_ENTRIES | 8/14 use baseline fallback — functional | Add entries as new sections with distinct labels are built |

---

## Sprint 882 Recommendation

**Sprint 882 — DONNA Roster Attention Follow-Up Depth V1** or
**Sprint 882 — DONNA COO Elaboration Follow-Up Depth V1**

Option A: Audit `'roster_attention'` — confirm it is also never written, then either
add a write site or remove it from the union type.

Option B: Improve the `'coo_answer'` elaboration handler — replace the generic
"checking {navLabel} for sign-off" with copy that acknowledges the COO suggestion more
naturally: "That was {label} — the page DONNA suggested based on your question. I can
take you there or help you decide whether it matters right now."

No DB changes, no migrations, no server actions required for either option.
