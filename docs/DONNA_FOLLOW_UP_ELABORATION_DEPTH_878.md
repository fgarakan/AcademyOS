# Sprint 878 — DONNA Follow-Up Elaboration Depth V1

**Date:** 2026-05-27
**Sprint:** 878
**Type:** Implementation — section_nav elaboration map + explicit elaboration handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 877 known limitation — `isElaboration` branch produced generic "sign-off" copy for `section_nav` context

---

## Sprint Goal

After Sprint 877, anaphoric follow-ups ("show me", "take me there") after section navigation were
context-aware. But elaboration follow-ups ("what is that?", "explain that", "tell me more") still
hit the generic existing handler:

> *"The main thing right now is checking Session Blocks for anything that needs your sign-off. Want me to open it?"*

Sprint 878 adds:
1. Two missing `ELABORATION_PATTERNS` entries (`what is that`, `what does that mean`)
2. A small hardcoded `SECTION_NAV_ELABORATION_MAP` (6 entries) — label → section description
3. A `buildSectionNavElaborationResponse` helper that uses the map
4. An explicit `'section_nav'` check at the top of the `isElaboration` branch, before the generic handler

Expected output after "session blocks" + "what is that?":
> *"That was Session Blocks. It's where you review the planned activities or blocks inside that session. I can take you back there or help you use that section."*

Expected output after "wrap-up actions" + "explain that":
> *"That was Wrap-Up Actions. It's where you finish or submit the coach wrap-up. I can take you back there or help you use that section."*

---

## Audit Findings

### `isElaboration` branch — before Sprint 878

```typescript
if (isElaboration) {
  if (contextIsFresh && context!.lastTopicLabel) {
    const href = context!.lastSuggestedNavigationHref
    const navLabel = context!.lastSuggestedNavigationLabel ?? 'the relevant page'
    return {
      actionType: 'elaborate',
      responseText: `The main thing right now is checking ${href ? navLabel : 'today\'s items'} for anything that needs your sign-off. Want me to open it?`,
      navigationHref: href,
      confidence: 'medium',
    }
  }
  return {
    actionType: 'elaborate',
    responseText: `What would you like me to explain? You can ask about today's brief, a specific area, or how something works here.`,
    navigationHref: null,
    confidence: 'low',
  }
}
```

For `section_nav` context, `lastTopicLabel` is always set (Sprint 873 sets it to
`result.focusTarget?.label ?? null`). So the generic sign-off check fired — but "sign-off" copy
is semantically wrong for a section-nav elaboration. Sprint 878 inserts the section_nav check
BEFORE that, so the sign-off handler is only reached for non-section_nav families.

### Missing `ELABORATION_PATTERNS` entries

The sprint examples include "what is that?" and "what does that mean?" Neither matched any existing
elaboration pattern. Sprint 878 adds:
- `/^what is (that|this|it)$/` — covers "what is that", "what is this", "what is it"
- `/^what does (that|this|it) mean$/` — covers "what does that mean", "what does this mean"

These are resolver-level patterns (not dispatcher `SECTION_NAV_ENTRIES` — unchanged).

### `lastSuggestedNavigationLabel` vs `lastTopicLabel` in section_nav context

Set by Sprint 873 navigate block in `handleUIDispatch`:
```typescript
setSessionIntentContext({
  lastIntentFamily: 'section_nav',         // Sprint 876
  lastSuggestedNavigationHref: result.route,
  lastSuggestedNavigationLabel: result.focusTarget?.label ?? 'that section',
  lastTopicLabel: result.focusTarget?.label ?? null,
  ...
})
```

`lastSuggestedNavigationLabel` is always set (falls back to `'that section'`).
`lastTopicLabel` is set only when `result.focusTarget?.label` is non-null.
`buildSectionNavElaborationResponse` uses `lastSuggestedNavigationLabel ?? lastTopicLabel`
to cover both cases.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

#### 1. Two new `ELABORATION_PATTERNS` entries (Sprint 878)

```typescript
/^what is (that|this|it)$/,        // Sprint 878 — covers "what is that?" after section nav
/^what does (that|this|it) mean$/, // Sprint 878 — covers "what does that mean?" after section nav
```

No existing patterns changed. No `SECTION_NAV_ENTRIES` touched.

#### 2. `SECTION_NAV_ELABORATION_MAP` const (Sprint 878)

Placed before the Helpers section. Hardcoded, small, no imports required.

```typescript
const SECTION_NAV_ELABORATION_MAP: Record<string, string> = {
  'Session Blocks':    "It's where you review the planned activities or blocks inside that session.",
  'Session Attendance':"It's where you check who is present, absent, or needs attendance review.",
  'Wrap-Up Actions':   "It's where you finish or submit the coach wrap-up.",
  'Wrap-Up Question':  "It's the current coach wrap-up prompt DONNA is asking you to answer.",
  'Template Blocks':   "It's where the template's drills, activities, and block structure live.",
  'Coach Run Session': "It's the coach-facing area for executing the session, including blocks and attendance.",
}
```

Keys match the `focusTarget.label` values set by `SECTION_NAV_ENTRIES` resolvers in `donnaUIActionDispatcher.ts`.

#### 3. `buildSectionNavElaborationResponse` helper (Sprint 878)

```typescript
function buildSectionNavElaborationResponse(context: DonnaSessionIntentContext): DonnaFollowUpResult {
  const label = context.lastSuggestedNavigationLabel ?? context.lastTopicLabel
  const href  = context.lastSuggestedNavigationHref

  if (label) {
    const description = SECTION_NAV_ELABORATION_MAP[label]
    if (description) {
      return {
        actionType: 'elaborate',
        responseText: `That was ${label}. ${description} I can take you back there or help you use that section.`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    // Label is set but not in the map — baseline copy
    return {
      actionType: 'elaborate',
      responseText: `That was ${label} — the section DONNA just helped you navigate to. I can take you back there if you'd like.`,
      navigationHref: href,
      confidence: 'medium',
    }
  }
  // No label available — minimal fallback
  return {
    actionType: 'elaborate',
    responseText: href
      ? `That was the section DONNA just navigated to. I can take you back there if you'd like.`
      : `That was the section DONNA just helped you find. Ask me anything else or let me know where to go next.`,
    navigationHref: href,
    confidence: 'low',
  }
}
```

#### 4. Explicit `'section_nav'` check in `isElaboration` branch

Inserted BEFORE the existing `lastTopicLabel` generic check:

```typescript
if (isElaboration) {
  // Sprint 878 — explicit section_nav elaboration handler.
  // Fires before the generic lastTopicLabel check so DONNA gives a useful
  // section-specific description (via SECTION_NAV_ELABORATION_MAP) instead of
  // the generic "checking {navLabel} for sign-off" copy.
  if (contextIsFresh && context!.lastIntentFamily === 'section_nav') {
    return buildSectionNavElaborationResponse(context!)
  }
  if (contextIsFresh && context!.lastTopicLabel) {  // unchanged — fires for other families
    ...
  }
  ...
}
```

---

## Response Copy — Before / After

| Trigger phrase | Before Sprint 878 | After Sprint 878 |
|---|---|---|
| "what is that?" after "session blocks" | ❌ No match (pattern missing) — fell through to COO | ✅ "That was Session Blocks. It's where you review the planned activities or blocks inside that session. I can take you back there or help you use that section." |
| "explain that" after "session blocks" | ❌ "The main thing right now is checking Session Blocks for anything that needs your sign-off." | ✅ "That was Session Blocks. It's where you review the planned activities or blocks inside that session. I can take you back there or help you use that section." |
| "what does that mean?" after "wrap-up actions" | ❌ No match — fell through to COO | ✅ "That was Wrap-Up Actions. It's where you finish or submit the coach wrap-up. I can take you back there or help you use that section." |
| "tell me more" after "wrap-up question" | ❌ Sign-off copy | ✅ "That was Wrap-Up Question. It's the current coach wrap-up prompt DONNA is asking you to answer. I can take you back there or help you use that section." |
| "explain that" after a COO answer | ✅ Unchanged — hits existing `lastTopicLabel` check | ✅ Unchanged |
| "tell me more" with stale context | ✅ Unchanged — hits generic fallback | ✅ Unchanged |

---

## Handler Priority — `isElaboration` branch (post-878)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| **1** | **`lastIntentFamily === 'section_nav'` + fresh context** | **`buildSectionNavElaborationResponse` — map lookup or baseline** | **878** |
| 2 | Fresh context + `lastTopicLabel` set (any other family) | Generic sign-off copy: "The main thing right now is checking {navLabel}…" | 785 |
| 3 | Stale context or no `lastTopicLabel` | Clarify fallback: "What would you like me to explain?" | 785 |

---

## Full Elaboration Handler Priority (post-878, across all branches)

| Pattern group | section_nav priority | Other family priority |
|---|---|---|
| Anaphoric/Sequential | `'section_nav'` explicit (Sprint 877, priority 3) → returns "I'll take you back to {label}" | Generic `lastSuggestedNavigationHref` catch-all |
| **Elaboration** | **`'section_nav'` explicit (Sprint 878, priority 1) → `buildSectionNavElaborationResponse`** | **Generic `lastTopicLabel` check → sign-off copy** |
| Recommendation | No `'section_nav'` special handling — falls through to generic | `'daily_brief'` → brief recommendation; `'review_queue'/'attention'` → review queue |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | (1) Added 2 `ELABORATION_PATTERNS` entries; (2) Added `SECTION_NAV_ELABORATION_MAP` const (6 entries); (3) Added `buildSectionNavElaborationResponse` helper; (4) Inserted `'section_nav'` explicit check at top of `isElaboration` branch |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | No change needed — context set correctly by Sprint 873/876 |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change — SECTION_NAV_ENTRIES unchanged |
| `src/lib/donna/donnaUIActionRegistry.ts` | No change — registry unaffected |
| `src/lib/donna/donnaConversationalRouter.ts` | No change — COO path unaffected |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change |
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
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — no route changes |
| No role boundary changes | ✅ — `allowedRoles` unchanged |
| Sprint 877 anaphoric section_nav handler preserved | ✅ — different branch (anaphoric); untouched |
| Sprint 876 `'section_nav'` type preserved | ✅ — union type unchanged |
| Sprint 875 SECTION_NAV_ENTRIES preserved | ✅ — dispatcher file untouched |
| `daily_brief` and `review_queue/attention` elaboration unchanged | ✅ — only `section_nav` has explicit handler; others still hit `lastTopicLabel` check |
| COO elaboration path unchanged | ✅ — `'coo_answer'` hits `lastTopicLabel` check as before |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-878)

| Limitation | Impact | Resolution |
|---|---|---|
| `SECTION_NAV_ELABORATION_MAP` has 6 entries; future sections will miss the map | Falls back to baseline copy: "That was {label} — the section DONNA just helped you navigate to." Still useful; just generic | Add entries to map as new SECTION_NAV_ENTRIES with distinct focus labels are added |
| `isRecommendation` branch has no `'section_nav'` explicit handler | Falls through to generic "Review Queue is a good starting point" — not contextually wrong, just not section-specific | Low priority; recommendation after section nav is an uncommon follow-up pattern |
| `'page_actions'` and `'roster_attention'` elaboration still generic | Both hit `lastTopicLabel` check → sign-off copy | Low impact; these families rarely receive elaboration follow-ups |

---

## Sprint 879 Recommendation

**Sprint 879 — DONNA Recommendation Follow-Up Depth V1**

Currently `isRecommendation` has explicit handlers only for `'daily_brief'` and `'review_queue'/'attention'`.
`'section_nav'` falls through to the generic "Review Queue is a good starting point" copy.

A `'section_nav'`-specific recommendation response could provide actionable guidance:
*"In Session Blocks, you can review each activity, mark progress, and flag anything that needs a coach note. Want me to take you there?"*

No DB changes or migrations required. Pure copy improvement in `donnaFollowUpResolver.ts`.
