# Sprint 879 — DONNA Recommendation Follow-Up Depth V1

**Date:** 2026-05-27
**Sprint:** 879
**Type:** Implementation — section_nav recommendation map + explicit recommendation handler in `resolveFollowUp`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 878 known limitation — `isRecommendation` branch had no `'section_nav'` explicit handler

---

## Sprint Goal

After Sprint 878, elaboration follow-ups after section navigation were context-aware. But
recommendation follow-ups ("what should I do next?", "what do you recommend?", "what now?")
still hit the generic Review Queue fallback:

> *"The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?"*

This is semantically wrong after a section-navigation action — the director is already focused
on a specific section and doesn't need to be redirected to the Review Queue.

Sprint 879 adds:
1. One missing `RECOMMENDATION_PATTERNS` entry (`what now`)
2. A small hardcoded `SECTION_NAV_RECOMMENDATION_MAP` (6 entries) — label → action-oriented next-step copy
3. A `buildSectionNavRecommendationResponse` helper
4. An explicit `'section_nav'` check in the `isRecommendation` branch, between the
   `review_queue/attention` handler and the generic fallback

Expected output after "session blocks" + "what should I do next?":
> *"In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group's needs. I can take you back there."*

Expected output after "wrap-up actions" + "what do you recommend?":
> *"In Wrap-Up Actions, finish the coach wrap-up and submit anything that needs review. I can take you back there."*

---

## Audit Findings

### `RECOMMENDATION_PATTERNS` coverage check

| Sprint example phrase | Normalized | Matched by | Status |
|---|---|---|---|
| "what do you recommend?" | `what do you recommend` | `/^what (do you recommend\|would you (recommend\|suggest))$/` | ✅ already covered |
| "what should I do next?" | `what should i do next` | `/^what should i (do\|start with) (first\|next)?$/` | ✅ already covered |
| "what now?" | `what now` | No existing pattern | ❌ missing — Sprint 879 adds `/^what now$/` |

`"what now"` is a 2-word phrase not matched by any other pattern group:
- `ANAPHORIC_PATTERNS` — no match (not a reference)
- `SEQUENTIAL_PATTERNS` — no match (not `next`, `go back`, etc.)
- `ELABORATION_PATTERNS` — no match
- `TIME_SHIFT_PATTERNS` — no match
- `TOPIC_SHIFT_PATTERNS` — no match

Adding `/^what now$/` to `RECOMMENDATION_PATTERNS` is unambiguous and safe.

### `isRecommendation` branch — before Sprint 879

```typescript
if (isRecommendation) {
  if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
    return buildBriefRecommendationResponse(context!)
  }
  if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
    return { ... /* navigate to /director/review */ }
  }
  // Generic fallback — fires for section_nav, coo_answer, page_actions, roster_attention
  return {
    actionType: 'recommend',
    responseText: `The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?`,
    navigationHref: '/director/review',
    confidence: 'medium',
  }
}
```

For `section_nav`, the generic Review Queue fallback fired — semantically wrong.
Sprint 879 inserts the `section_nav` check BEFORE the generic fallback.

### `'section_nav'` context fields — confirmed sufficient

| Field | Set by | Value example |
|---|---|---|
| `lastIntentFamily` | Sprint 876 `setSessionIntentContext` | `'section_nav'` |
| `lastSuggestedNavigationLabel` | Sprint 873 navigate block | `"Session Blocks"` |
| `lastSuggestedNavigationHref` | Sprint 873 navigate block | `"/director/sessions/abc/blocks"` |
| `lastTopicLabel` | Sprint 873 navigate block | `"Session Blocks"` |

`buildSectionNavRecommendationResponse` uses `lastSuggestedNavigationLabel ?? lastTopicLabel`
and `lastSuggestedNavigationHref` — both safely available.

---

## Implementation

### `src/lib/donna/donnaFollowUpResolver.ts`

#### 1. One new `RECOMMENDATION_PATTERNS` entry (Sprint 879)

```typescript
/^what now$/, // Sprint 879 — covers "what now?" after section nav (2-word phrase; no other group matches it)
```

No existing patterns changed. No `SECTION_NAV_ENTRIES` touched.

#### 2. `SECTION_NAV_RECOMMENDATION_MAP` const (Sprint 879)

Placed before `SECTION_NAV_ELABORATION_MAP` (Sprint 878). Same 6 keys, action-oriented values.

```typescript
const SECTION_NAV_RECOMMENDATION_MAP: Record<string, string> = {
  'Session Blocks':    'In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group\'s needs.',
  'Session Attendance':'In Session Attendance, confirm who was present, absent, or needs follow-up before moving on.',
  'Wrap-Up Actions':   'In Wrap-Up Actions, finish the coach wrap-up and submit anything that needs review.',
  'Wrap-Up Question':  'Answer the current wrap-up question clearly and specifically, then move to the next wrap-up action.',
  'Template Blocks':   'In Template Blocks, review the block structure, make sure the activities match the template goal, and adjust anything that feels off.',
  'Coach Run Session': 'In Run Session, use the blocks as the live coaching guide, then update attendance or notes as needed.',
}
```

Keys are identical to `SECTION_NAV_ELABORATION_MAP` — same focusTarget labels.

#### 3. `buildSectionNavRecommendationResponse` helper (Sprint 879)

```typescript
function buildSectionNavRecommendationResponse(context: DonnaSessionIntentContext): DonnaFollowUpResult {
  const label = context.lastSuggestedNavigationLabel ?? context.lastTopicLabel
  const href  = context.lastSuggestedNavigationHref

  if (label) {
    const nextStep = SECTION_NAV_RECOMMENDATION_MAP[label]
    if (nextStep) {
      return {
        actionType: 'recommend',
        responseText: `${nextStep} I can take you back there.`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    // Label set but not in map — baseline copy
    return {
      actionType: 'recommend',
      responseText: `You're at ${label}. The best next step is to review that section, make any needed updates, and continue with the related session or wrap-up flow. I can take you back there.`,
      navigationHref: href,
      confidence: 'medium',
    }
  }
  // No label — minimal fallback
  return {
    actionType: 'recommend',
    responseText: href
      ? `The best next step is to review the section DONNA just navigated to and work through whatever's there. I can take you back.`
      : `The best next step is to open the Review Queue — that's where pending items usually need attention first. Want me to open it?`,
    navigationHref: href ?? '/director/review',
    confidence: 'low',
  }
}
```

#### 4. Explicit `'section_nav'` check in `isRecommendation` branch

Inserted between the `review_queue/attention` handler and the generic fallback:

```typescript
if (isRecommendation) {
  if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
    return buildBriefRecommendationResponse(context!)
  }
  if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
    return { ... /* unchanged */ }
  }
  // Sprint 879 — explicit section_nav recommendation handler.
  if (contextIsFresh && context!.lastIntentFamily === 'section_nav') {
    return buildSectionNavRecommendationResponse(context!)
  }
  // Generic recommendation (no fresh context) — unchanged; fires for coo_answer, page_actions, roster_attention
  return { ... /* unchanged */ }
}
```

---

## Response Copy — Before / After

| Trigger phrase | Before Sprint 879 | After Sprint 879 |
|---|---|---|
| "what now?" after "session blocks" | ❌ No match — fell through to COO | ✅ "In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group's needs. I can take you back there." |
| "what should I do next?" after "session blocks" | ❌ "The Review Queue is usually a good starting point…" | ✅ "In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group's needs. I can take you back there." |
| "what do you recommend?" after "wrap-up actions" | ❌ "The Review Queue is usually a good starting point…" | ✅ "In Wrap-Up Actions, finish the coach wrap-up and submit anything that needs review. I can take you back there." |
| "what should I do first?" after "session attendance" | ❌ Review Queue fallback | ✅ "In Session Attendance, confirm who was present, absent, or needs follow-up before moving on. I can take you back there." |
| "what do you recommend?" after a daily brief | ✅ Unchanged — `buildBriefRecommendationResponse` | ✅ Unchanged |
| "what should I do next?" with no fresh context | ✅ Unchanged — generic Review Queue fallback | ✅ Unchanged |
| "what now?" with no context | ❌ No match (pattern missing) | ✅ Generic Review Queue fallback (correct: no section_nav context) |

---

## Handler Priority — `isRecommendation` branch (post-879)

| Priority | Condition | Response | Sprint |
|---|---|---|---|
| 1 | `lastIntentFamily === 'daily_brief'` + fresh context | `buildBriefRecommendationResponse` — count-aware | 785 |
| 2 | `lastIntentFamily === 'review_queue'\|'attention'` + fresh context | Navigate to `/director/review` | 785 |
| **3** | **`lastIntentFamily === 'section_nav'` + fresh context** | **`buildSectionNavRecommendationResponse` — map lookup or baseline** | **879** |
| 4 | Any other family or stale context | Generic "Review Queue is a good starting point" | 785 |

---

## Full Follow-Up Handler Summary (Sprints 877–879)

| Pattern group | `section_nav` handler | Sprint |
|---|---|---|
| Anaphoric / Sequential | "I'll take you back to {label} — that's where we were." | 877 |
| Elaboration | `buildSectionNavElaborationResponse` — description via `SECTION_NAV_ELABORATION_MAP` | 878 |
| **Recommendation** | **`buildSectionNavRecommendationResponse` — action-step via `SECTION_NAV_RECOMMENDATION_MAP`** | **879** |
| Time shift | No explicit handler (generic time-shift copy; context-independent) | — |
| Topic shift | No explicit handler (topic shift overrides context; generic topic copy) | — |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | (1) Added `/^what now$/` to `RECOMMENDATION_PATTERNS`; (2) Added `SECTION_NAV_RECOMMENDATION_MAP` const (6 entries); (3) Added `buildSectionNavRecommendationResponse` helper; (4) Inserted `'section_nav'` explicit check between `review_queue/attention` handler and generic fallback in `isRecommendation` branch |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | No change needed |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change — SECTION_NAV_ENTRIES unchanged |
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
| Sprint 878 `SECTION_NAV_ELABORATION_MAP` preserved | ✅ — untouched; new map is separate const |
| Sprint 877 anaphoric section_nav handler preserved | ✅ — different branch; untouched |
| `daily_brief` recommendation unchanged | ✅ — priority 1 check unchanged |
| `review_queue/attention` recommendation unchanged | ✅ — priority 2 check unchanged |
| `coo_answer` / `page_actions` / `roster_attention` recommendation unchanged | ✅ — fall through to generic fallback as before |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-879)

| Limitation | Impact | Resolution |
|---|---|---|
| `SECTION_NAV_RECOMMENDATION_MAP` has 6 entries; future sections with new focus labels fall back to baseline copy | Baseline copy ("You're at {label}. The best next step is to review…") is functional; just generic | Add entries as new SECTION_NAV_ENTRIES with distinct focus labels are built |
| Time-shift and topic-shift branches have no `'section_nav'` explicit handling | Low-impact — these intents override context rather than referencing it | Future polish sprint if needed |
| `'page_actions'` and `'roster_attention'` recommendation still generic | Both hit generic Review Queue fallback — functional but not section-specific | Low priority |

---

## Sprint 880 Recommendation

**Sprint 880 — DONNA Follow-Up Resolver Section Nav Coverage Audit V1**

Sprints 877–879 have now added explicit `'section_nav'` handling for anaphoric, elaboration, and
recommendation follow-ups. Sprint 880 could:

1. Audit the full follow-up flow end-to-end with a scenario table (all 14 SECTION_NAV_ENTRIES × 
   3 follow-up types × with/without label) to confirm complete coverage
2. Identify any remaining copy that is semantically wrong for section-nav context
3. Optionally extend `SECTION_NAV_ELABORATION_MAP` and `SECTION_NAV_RECOMMENDATION_MAP` with 
   labels from SECTION_NAV_ENTRIES that are not yet in the maps

No DB changes, no migrations, no server actions required.
Alternatively, pivot to a different area of DONNA intelligence.
