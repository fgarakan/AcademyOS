# Sprint 877 — DONNA Follow-Up Intent Family Explicit Handlers V1

**Date:** 2026-05-27
**Sprint:** 877
**Type:** Implementation — explicit `'section_nav'` anaphoric follow-up handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 876 known limitation — `'section_nav'` intent family fell through to generic `lastSuggestedNavigationHref` catch-all, producing generic copy

---

## Sprint Goal

Sprint 876 added `'section_nav'` as a dedicated intent family for section-navigation results, but
`resolveFollowUp` had no explicit handler for it. When the user said "show me", "take me there",
or "go there" after a section-navigation action, DONNA responded with the generic catch-all:

> *"I'll take you to the relevant page."*

Sprint 877 inserts an explicit `'section_nav'` handler before the generic catch-all. When the
user's last action was section navigation and a label is stored in context, DONNA now responds:

> *"I'll take you back to Session Blocks — that's where we were."*

If no label is stored, it falls back to:

> *"I'll take you back to that section."*

---

## Audit Findings

### `resolveFollowUp` anaphoric/sequential branch — before Sprint 877

```typescript
// lines 324–350 (donnaFollowUpResolver.ts)
if (isAnaphoric || isSequential) {
  if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
    return buildBriefAnaphoricResponse(context!, lower)
  }
  if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
    return {
      actionType: 'navigate',
      responseText: `I'll open the Review Queue so you can go through each item.`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  // Generic catch-all — fires for 'section_nav', 'coo_answer', 'page_actions', 'roster_attention'
  if (contextIsFresh && context!.lastSuggestedNavigationHref) {
    return {
      actionType: 'navigate',
      responseText: `I'll take you to the ${context!.lastSuggestedNavigationLabel ?? 'relevant page'}.`,
      navigationHref: context!.lastSuggestedNavigationHref,
      confidence: 'medium',
    }
  }
  // ...
}
```

`'section_nav'` fell through to the generic catch-all. No context-specific copy.

### After Sprint 877

The `'section_nav'` explicit handler is inserted between the `review_queue/attention` block and
the generic catch-all. The generic catch-all remains unchanged and continues to handle
`'coo_answer'`, `'page_actions'`, `'roster_attention'`.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

**Insert explicit `'section_nav'` handler before the generic catch-all:**

Before (Sprint 876):
```typescript
    if (contextIsFresh && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'navigate',
        responseText: `I'll take you to the ${context!.lastSuggestedNavigationLabel ?? 'relevant page'}.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
```

After (Sprint 877):
```typescript
    // Sprint 877 — explicit section_nav handler: context-aware copy via lastSuggestedNavigationLabel.
    // Fires before the generic catch-all so section-navigation follow-ups return
    // "I'll take you back to Session Blocks — that's where we were." instead of
    // the generic "I'll take you to the relevant page."
    if (contextIsFresh && context!.lastIntentFamily === 'section_nav' && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'navigate',
        responseText: context!.lastSuggestedNavigationLabel
          ? `I'll take you back to ${context!.lastSuggestedNavigationLabel} — that's where we were.`
          : `I'll take you back to that section.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    if (contextIsFresh && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'navigate',
        responseText: `I'll take you to the ${context!.lastSuggestedNavigationLabel ?? 'relevant page'}.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
```

No other changes to `resolveFollowUp` or any helper functions in this file.

---

## Response Copy Comparison

### "show me" after "take me to session blocks" — before vs after Sprint 877

**Before Sprint 877:**
> *"I'll take you to the Session Blocks."*
> (generic catch-all — `lastSuggestedNavigationLabel` substituted into generic template)

**After Sprint 877:**
> *"I'll take you back to Session Blocks — that's where we were."*
> (explicit handler — context-aware, references prior navigation explicitly)

### "show me" after COO answer — unchanged path

Still uses the generic catch-all → `"I'll take you to the {label}."` — correct, since COO answers
are not section navigation; "back to" would be semantically wrong.

### "show me" after `'section_nav'` with no label stored — fallback

> *"I'll take you back to that section."*

This is the `context!.lastSuggestedNavigationLabel` null-branch. In practice `lastSuggestedNavigationLabel`
is always set by the Sprint 873 navigate block (`result.focusTarget?.label ?? 'that section'`), so the
ternary fallback is a safety net only.

---

## Handler Priority (post-877 anaphoric/sequential branch)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| 1 | `lastIntentFamily === 'daily_brief'` | `buildBriefAnaphoricResponse` | 785 |
| 2 | `lastIntentFamily === 'review_queue' \|\| 'attention'` | Navigate to `/director/review` | 785 |
| **3** | **`lastIntentFamily === 'section_nav' && lastSuggestedNavigationHref`** | **"I'll take you back to {label} — that's where we were."** | **877** |
| 4 | Any other family with `lastSuggestedNavigationHref` | "I'll take you to the {label}." | 785 |
| 5 | No fresh context | Clarify prompt | 785 |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Inserted explicit `'section_nav'` handler before generic `lastSuggestedNavigationHref` catch-all in anaphoric/sequential branch of `resolveFollowUp`; no other changes |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | No change — `lastIntentFamily: 'section_nav'` assignment (Sprint 876) and `lastSuggestedNavigationLabel` already set correctly |
| `src/lib/donna/donnaConversationalRouter.ts` | No change — COO path unaffected |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change — dispatcher patterns (Sprint 875) unaffected |
| `src/lib/donna/donnaUIActionRegistry.ts` | No change — registry unaffected |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change — highlight logic unaffected |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure resolver logic |
| No DB reads | ✅ — no queries added |
| No server actions | ✅ — client-side only |
| No mutations | ✅ — follow-up resolver never mutates state |
| No new packages | ✅ — none |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — routing logic unchanged |
| No role boundary changes | ✅ — `allowedRoles` unchanged |
| Sprint 876 `'section_nav'` type preserved | ✅ — union type unchanged |
| Sprint 875 regex patterns preserved | ✅ — SECTION_NAV_ENTRIES unchanged |
| Sprint 873 anaphoric follow-ups preserved | ✅ — handler fires only for `'section_nav'`; other families hit same catch-all as before |
| Sprint 802 COO follow-ups preserved | ✅ — `'coo_answer'` still hits generic catch-all |
| `daily_brief` and `review_queue/attention` handlers preserved | ✅ — those blocks are before the new insertion point; unchanged |
| Backward compatible | ✅ — insert-only change; all other intent families unaffected |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-877)

| Limitation | Impact | Resolution |
|---|---|---|
| `'page_actions'` and `'roster_attention'` intent families are set but never explicitly checked in `resolveFollowUp` | Both fall through to `lastSuggestedNavigationHref` catch-all — same pattern as before Sprint 877 | Low impact; catch-all works correctly. Explicit handling is a future polish sprint |
| Follow-up context has no navigation history | Only the most recent section-nav is in context; "the one before that" is unsupported | By design; deferred further |
| `confidence` stays `'medium'` for `'section_nav'` handler | No change from the generic catch-all confidence level | Acceptable; section-nav follow-ups are contextually confident but the system has no ground truth to upgrade to `'high'` |

---

## Sprint 878 Recommendation

**Sprint 878 — DONNA Follow-Up Elaboration Depth V1**

Currently the elaboration handler (`isElaboration`) in `resolveFollowUp` is context-aware for
`lastTopicLabel` but produces a generic fallback when context is stale or missing. A
`'section_nav'`-specific elaboration response could provide more context:

*"The Session Blocks section is where you can review all scheduled activities for this session.
Want me to take you there?"*

No DB changes or migrations required. Pure copy improvement in `donnaFollowUpResolver.ts`.
