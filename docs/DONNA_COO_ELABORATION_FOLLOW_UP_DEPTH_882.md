# Sprint 882 — DONNA COO Elaboration Follow-Up Depth V1

**Date:** 2026-05-27
**Sprint:** 882
**Type:** Implementation — explicit `coo_answer` elaboration handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 881 known limitation — `'coo_answer'` elaboration used generic "sign-off" framing

---

## Sprint Goal

After Sprint 881, `'coo_answer'` recommendation follow-ups return the page DONNA suggested.
But when a user says "what is that?", "explain that", or "tell me more" after a COO page
suggestion, the generic `lastTopicLabel` handler fires:

> *"The main thing right now is checking Players for anything that needs your sign-off.
> Want me to open it?"*

This framing is wrong for many COO-suggested pages — sessions, curriculum, and
template pages are not about sign-off. Sprint 882 inserts an explicit `'coo_answer'`
elaboration handler that names the suggested page naturally:

> *"That was Players — the page DONNA suggested based on your question. I can take you
> there or help you decide whether it matters right now."*

---

## Audit — Pre-Sprint State

### Elaboration branch before Sprint 882

```typescript
if (isElaboration) {
  // Sprint 878 — section_nav: fires first
  if (contextIsFresh && context!.lastIntentFamily === 'section_nav') {
    return buildSectionNavElaborationResponse(context!)     // priority 1
  }
  // Generic lastTopicLabel — fired for coo_answer when lastTopicLabel was set
  if (contextIsFresh && context!.lastTopicLabel) {
    return {
      actionType: 'elaborate',
      responseText: `The main thing right now is checking ${href ? navLabel : 'today\'s items'} for anything that needs your sign-off. Want me to open it?`,
      // ↑ "sign-off" framing — too narrow for non-review COO suggestions
      ...
    }
  }
  // Generic fallback — no context
  return { responseText: `What would you like me to explain? ...` }
}
```

### Fields available for `'coo_answer'` (DonnaAssistantButton line 3050)

| Field | Source | Example |
|---|---|---|
| `lastIntentFamily` | hardcoded | `'coo_answer'` |
| `lastSuggestedNavigationHref` | `composed.nextStepHref ?? null` | `'/director/players'` |
| `lastSuggestedNavigationLabel` | `composed.nextStepLabel ?? null` | `'Players'` |
| `lastTopicLabel` | `composed.nextStepLabel ?? null` | `'Players'` |

All three fields set from the same source (`composed.nextStepLabel`). If label is null,
`lastTopicLabel` is also null — both are either set or both are null.

### ELABORATION_PATTERNS coverage (no new patterns needed)

| Trigger phrase | Pattern | Sprint |
|---|---|---|
| "what is that?" | `/^what is (that\|this\|it)$/` | 878 |
| "explain that" | `/^explain (that\|this\|it)$/` | 785 |
| "what does that mean?" | `/^what does (that\|this\|it) mean$/` | 878 |
| "tell me more" | `/^tell me more$/` | 785 |
| "why" | `/^why$/` | 785 |
| "why is that?" | `/^why is that( important\| urgent\| critical)?$/` | 785 |

All Sprint 882 trigger phrases already covered. **No new patterns needed.**

### Priority order in elaboration branch before Sprint 882

| Priority | Condition | Response |
|---|---|---|
| 1 | `lastIntentFamily === 'section_nav'` + fresh | `buildSectionNavElaborationResponse` (Sprint 878) |
| 2 | `lastTopicLabel` set + fresh | Generic "sign-off" copy — wrong for `'coo_answer'` ❌ |
| 3 | No fresh context | Generic "What would you like me to explain?" |

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

Single handler inserted in the `isElaboration` branch, after the Sprint 878 `'section_nav'`
check and before the generic `lastTopicLabel` handler:

```typescript
// Sprint 882 — explicit coo_answer elaboration handler.
// When DONNA's COO answer suggested a specific page (lastSuggestedNavigationHref set),
// the generic lastTopicLabel handler's "checking {label} for sign-off" framing is too
// narrow — not every COO-suggested page is about sign-off. This handler returns copy
// that names the suggested page naturally and offers to navigate there.
if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
  const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
  return {
    actionType: 'elaborate',
    responseText: label
      ? `That was ${label} — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now.`
      : `That was the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now.`,
    navigationHref: context!.lastSuggestedNavigationHref,
    confidence: 'medium',
  }
}
```

**Condition:** fresh context + `lastIntentFamily === 'coo_answer'` + `lastSuggestedNavigationHref` non-null.

When `'coo_answer'` has NO `lastSuggestedNavigationHref` (DONNA answered conversationally
with no page suggestion), the handler does NOT fire. The generic `lastTopicLabel` handler
runs next — which also won't fire because `lastTopicLabel` is null (set from the same
source as `lastSuggestedNavigationLabel`). Falls to the generic "What would you like me
to explain?" fallback — correct.

---

## Response Copy — Before / After

| Trigger phrase | Context after COO answer | Before Sprint 882 | After Sprint 882 |
|---|---|---|---|
| "what is that?" | `'coo_answer'`, href = `/director/players`, label = "Players" | ❌ "The main thing right now is checking Players for anything that needs your sign-off." | ✅ "That was Players — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now." |
| "explain that" | `'coo_answer'`, href = `/director/sessions`, label = "Sessions" | ❌ "The main thing right now is checking Sessions for anything that needs your sign-off." | ✅ "That was Sessions — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now." |
| "what does that mean?" | `'coo_answer'`, href = `/director/review`, label = "Review Queue" | ❌ "The main thing right now is checking Review Queue for sign-off." | ✅ "That was Review Queue — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now." |
| "tell me more" | `'coo_answer'`, no href (conversational answer only) | ✅ Generic "What would you like me to explain?" — correct | ✅ Unchanged — no href → handler skipped → generic fallback |
| "what is that?" | `'section_nav'`, label = "Session Blocks" | ✅ `buildSectionNavElaborationResponse` — Sprint 878 | ✅ Unchanged — `'section_nav'` check fires at priority 1 |
| "tell me more" | `'daily_brief'` | Falls to generic lastTopicLabel handler — label = "today's brief" | Falls to generic lastTopicLabel handler — unchanged (daily_brief has no explicit elaboration handler; functional) |

---

## Handler Priority — `isElaboration` Branch (post-882)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| 1 | `lastIntentFamily === 'section_nav'` + fresh | `buildSectionNavElaborationResponse` — map lookup or baseline | 878 |
| **2** | **`lastIntentFamily === 'coo_answer'` + fresh + `lastSuggestedNavigationHref` set** | **"That was {label} — the page DONNA suggested…"** | **882** |
| 3 | `lastTopicLabel` set + fresh (any family without explicit handler) | "The main thing right now is checking {label} for sign-off." | 785 |
| 4 | No fresh context / no label | "What would you like me to explain?" | 785 |

---

## Full Follow-Up Handler Summary (Sprints 877–882)

| Pattern group | `section_nav` handler | `coo_answer` handler | Sprint |
|---|---|---|---|
| Anaphoric / Sequential | "I'll take you back to {label} — that's where we were." | Generic href catch-all: "I'll take you to the {label}." (already correct) | 877 / 785 |
| **Elaboration** | `buildSectionNavElaborationResponse` — description via map | **"That was {label} — the page DONNA suggested…"** | **878 / 882** |
| Recommendation | `buildSectionNavRecommendationResponse` — action-step via map | "DONNA suggested {label}. The best next step is to open it…" | 879 / 881 |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added explicit `'coo_answer'` elaboration handler in `isElaboration` branch — priority 2, after `'section_nav'` (priority 1), before generic `lastTopicLabel` handler (priority 3); condition: fresh context + `'coo_answer'` + `lastSuggestedNavigationHref` non-null; label-present and no-label copy variants |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | `'coo_answer'` write site already exists; no changes needed |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change |
| `src/lib/donna/donnaUIActionRegistry.ts` | No change |
| `src/lib/donna/donnaConversationalRouter.ts` | No change |
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
| Sprint 881 `coo_answer` recommendation unchanged | ✅ — different branch; untouched |
| Sprint 879 `section_nav` recommendation unchanged | ✅ — different branch; untouched |
| Sprint 878 `section_nav` elaboration unchanged | ✅ — still priority 1 in isElaboration |
| Sprint 877 anaphoric section_nav unchanged | ✅ — different branch; untouched |
| `daily_brief` elaboration unchanged | ✅ — no explicit daily_brief check; falls to generic lastTopicLabel (priority 3) as before |
| `coo_answer` with no href falls to generic handlers | ✅ — handler condition requires non-null href |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-882)

| Limitation | Impact | Resolution |
|---|---|---|
| `'page_actions'` and `'roster_attention'` never written — dead enum values | No impact on users | Remove from union or add write sites when those response types are built |
| `'daily_brief'` elaboration uses generic "sign-off" copy | "The main thing right now is checking today's items for sign-off" — functional but slightly off; daily_brief context has `lastTopicLabel = "today's brief"` | Low-priority polish sprint: add explicit `'daily_brief'` elaboration handler |
| `SECTION_NAV_ELABORATION_MAP` covers 6/14 SECTION_NAV_ENTRIES | 8/14 use baseline fallback copy | Add entries as new sections are built |

---

## Sprint 883 Recommendation

**Sprint 883 — DONNA Type Union Audit V1**

Audit the full `DonnaSessionIntentContext.lastIntentFamily` union type:
1. Confirm all values that are actually written (active)
2. Confirm all values that are never written (dormant: `'page_actions'`, `'roster_attention'`)
3. For each dormant value: either remove it from the union type (clean up), or document
   exactly what write site will activate it and when
4. Optionally add explicit `'daily_brief'` elaboration handler to replace the generic
   "sign-off" copy for brief-context elaboration follow-ups

No DB changes, no migrations, no server actions required.
