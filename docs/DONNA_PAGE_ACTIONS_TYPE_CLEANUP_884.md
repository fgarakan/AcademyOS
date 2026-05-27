# Sprint 884 — DONNA page_actions Type Cleanup V1

**Date:** 2026-05-27
**Sprint:** 884
**Type:** Type cleanup — remove dormant `'page_actions'` from `DonnaSessionIntentContext.lastIntentFamily`
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 883 recommendation — remove `'page_actions'` (confirmed dormant in type union audit)

---

## Sprint Goal

Sprint 883 audited the full `DonnaSessionIntentContext.lastIntentFamily` union and confirmed
`'page_actions'` is dormant:
- Never written by any `setSessionIntentContext` call
- Never read in any conditional check
- No counterpart in `DonnaDirectorIntent` (classifier, router)
- No documented plan for future use

Sprint 884 removes `'page_actions'` from the union. This is a pure type cleanup —
no runtime behavior changes because the value was never written or read.

`'roster_attention'` is explicitly NOT removed — it has active `DonnaDirectorIntent`
infrastructure (classifier, router, roster intel builder) and is future-reserved.

---

## Pre-Removal Audit — Confirming Sprint 883 Findings

### Search: all `page_actions` references in source

Before removal, `page_actions` appeared in exactly 3 places in `donnaFollowUpResolver.ts`:

| Line | Content | Type |
|---|---|---|
| 47 | `\| 'page_actions'     // Dormant…` | Union member — **removed** |
| 535 | `// Audit finding: 'page_actions' is declared in the union type but never written…` | Comment in Sprint 881 handler — **updated** |
| 553 | `// …(roster_attention, page_actions if ever written).` | Generic fallback comment — **updated** |

No writes (`lastIntentFamily: 'page_actions'`): ✅ confirmed absent.
No reads (`lastIntentFamily === 'page_actions'`): ✅ confirmed absent.
No `DonnaDirectorIntent` value named `page_actions`: ✅ confirmed absent.
No classifier/router infrastructure for `page_actions`: ✅ confirmed absent.

TypeScript compilation after removal: ✅ exit 0 — no hidden usages surfaced.

### Search: all `roster_attention` references in source (preserved)

| File | Line | Usage | Status |
|---|---|---|---|
| `donnaFollowUpResolver.ts` | 48 | `\| 'roster_attention' // Future-reserved…` | Kept — future-reserved |
| `donnaFollowUpResolver.ts` | 553 | Generic fallback comment | Updated to describe roster_attention role |
| `donnaIntentClassifier.ts` | 177 | `DonnaDirectorIntent \| 'roster_attention'` | Untouched — active routing intent |
| `donnaIntentClassifier.ts` | 278 | `intent: 'roster_attention'` signal entry | Untouched |
| `donnaIntentClassifier.ts` | 443 | Domain map entry | Untouched |
| `donnaConversationalRouter.ts` | 58 | `case 'roster_attention': return 'use_roster_intel'` | Untouched |
| `donnaConversationalRouter.ts` | 84 | Clarification map entry | Untouched |
| `donnaConversationalRouter.ts` | 139 | Next step map entry | Untouched |
| `directorPlayersDonnaIntelligence.ts` | 40, 80 | `actionId: 'roster_attention'` in hub answers | Untouched — different concept |
| `DonnaAssistantButton.tsx` | 2958 | `if (routing.intent === 'roster_attention')` | Untouched |
| `DonnaAssistantButton.tsx` | 3027 | `roster_attention: 'players'` in domain map | Untouched |

All `roster_attention` infrastructure preserved. ✅

---

## Changes Made

### `src/lib/donna/donnaFollowUpResolver.ts`

#### 1. Union member removed

```typescript
// BEFORE (Sprint 883):
    | 'page_actions'     // Dormant — declared but never written; no write site; no counterpart in DonnaDirectorIntent (Sprint 883 audit — candidate for removal in Sprint 884)

// AFTER (Sprint 884):
    // (line removed entirely)
```

#### 2. Header comment updated

```typescript
// BEFORE (Sprint 883):
  // Sprint 883 audit — each value annotated with active / dormant status.
  // Active values have a confirmed write site in DonnaAssistantButton.tsx.
  // Dormant values are declared but never written — see DONNA_INTENT_FAMILY_TYPE_UNION_AUDIT_883.md.

// AFTER (Sprint 884):
  // Sprint 883 audit — each value annotated with active / future-reserved status.
  // Active values have a confirmed write site in DonnaAssistantButton.tsx.
  // Sprint 884 — removed 'page_actions' (confirmed dormant in Sprint 883 audit: never written,
  // no write site, no DonnaDirectorIntent counterpart). See DONNA_INTENT_FAMILY_TYPE_UNION_AUDIT_883.md.
```

#### 3. Sprint 881 `coo_answer` handler comment — `page_actions` mention removed

```typescript
// BEFORE (Sprint 881):
    // Sprint 881 — explicit coo_answer recommendation handler.
    // Audit finding: 'page_actions' is declared in the union type but never written — any handler
    // for it would be dead code. The active family for COO page-suggestion responses is 'coo_answer'
    // (set at DonnaAssistantButton.tsx line 3050 for all non-blocked COO answers).
    // When lastSuggestedNavigationHref is set, the generic Review Queue fallback is semantically
    // wrong — the user should go to the page DONNA just suggested, not the Review Queue.

// AFTER (Sprint 884):
    // Sprint 881 — explicit coo_answer recommendation handler.
    // The active family for COO page-suggestion responses is 'coo_answer' (written by
    // handleDonnaCooPrompt at DonnaAssistantButton.tsx line 3050 for all non-blocked COO answers).
    // When lastSuggestedNavigationHref is set, the generic Review Queue fallback is semantically
    // wrong — the user should go to the page DONNA just suggested, not the Review Queue.
```

#### 4. Generic fallback comment — `page_actions if ever written` removed

```typescript
// BEFORE (Sprint 881):
    // Generic recommendation fallback — fires when: (a) no fresh context, or (b) coo_answer with
    // no suggested href (DONNA answered conversationally without a page suggestion), or (c) any
    // other intent family not handled above (roster_attention, page_actions if ever written).

// AFTER (Sprint 884):
    // Generic recommendation fallback — fires when: (a) no fresh context, or (b) coo_answer with
    // no suggested href (DONNA answered conversationally without a page suggestion), or (c) any
    // other intent family not handled above (roster_attention — future-reserved; COO path writes
    // 'coo_answer' for roster intent today, so this catches stale or unhandled context only).
```

---

## Final Union Type (post-884)

```typescript
lastIntentFamily:
  | 'daily_brief'      // Active — written by handleFetchDailyBrief (DonnaAssistantButton line 2248, Sprint 785)
  | 'review_queue'     // Active — written by handleOpenReviewQueue (DonnaAssistantButton line 2332, Sprint 785)
  | 'attention'        // Active — written by handleFetchAttentionReport (DonnaAssistantButton line 2208, Sprint 785)
  | 'coo_answer'       // Active — written by handleDonnaCooPrompt for all non-blocked COO answers (DonnaAssistantButton line 3050, Sprint 802)
  | 'section_nav'      // Active — written by handleUIDispatch navigate block (DonnaAssistantButton line 2857, Sprint 876)
  | 'roster_attention' // Future-reserved — roster_attention IS an active DonnaDirectorIntent routing value, but the COO path writes 'coo_answer'; no lastIntentFamily write site exists (Sprint 883 audit)
  | null               // Cleared state — set on panel close (line 973) and route change (line 1277)
```

6 members remaining (5 active + 1 future-reserved + null). All active values written
and read. `'roster_attention'` retained as future-reserved.

---

## TypeScript Enforcement

After removal:
- Any future `setSessionIntentContext({ lastIntentFamily: 'page_actions' })` → **compile error**
- Any future `context.lastIntentFamily === 'page_actions'` → **compile error** (exhaustive check)

TypeScript now enforces that `'page_actions'` cannot re-enter the codebase silently.

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | (1) Removed `\| 'page_actions'` union member + its comment; (2) Updated 3-line header comment to reflect removal and drop "Dormant" language; (3) Simplified Sprint 881 coo_answer handler comment (removed historical page_actions audit note); (4) Updated generic fallback comment (removed `page_actions if ever written`, added roster_attention explanation) |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | TypeScript clean — no hidden page_actions write site existed |
| `src/lib/donna/donnaIntentClassifier.ts` | roster_attention DonnaDirectorIntent preserved; untouched |
| `src/lib/donna/donnaConversationalRouter.ts` | roster_attention routing preserved; untouched |
| `src/lib/donna/directorPlayersDonnaIntelligence.ts` | roster_attention actionId in hub answers preserved; untouched |
| `src/lib/donna/donnaUIActionDispatcher.ts` | No change |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No runtime behavior changes | ✅ — `'page_actions'` was never written or read; removal has zero runtime impact |
| TypeScript enforces removal going forward | ✅ — any future use of `'page_actions'` causes compile error |
| No handler logic touched | ✅ — only comments and the union member changed |
| All active intent family handlers preserved | ✅ — daily_brief, review_queue, attention, coo_answer, section_nav all untouched |
| roster_attention infrastructure preserved | ✅ — classifier, router, intel builder, DonnaAssistantButton handling all untouched |
| roster_attention future-reserved status preserved | ✅ — kept in union with accurate comment |
| No DB writes | ✅ |
| No DB reads | ✅ |
| No server actions | ✅ |
| No new packages | ✅ |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-884)

| Limitation | Impact | Resolution |
|---|---|---|
| `'roster_attention'` still future-reserved (no lastIntentFamily write site) | Roster-intent follow-ups fall to generic COO coo_answer handlers — functional | Add dedicated `setSessionIntentContext({ lastIntentFamily: 'roster_attention' })` write site when roster follow-up handler is built |
| `'daily_brief'` elaboration still uses generic "sign-off" copy | Acceptable but imprecise — "checking today's items for sign-off" fires for brief context | Future polish sprint: add explicit 'daily_brief' elaboration handler |

---

## Sprint 885 Recommendation

**Sprint 885 — DONNA Daily Brief Elaboration Follow-Up V1**

Add an explicit `'daily_brief'` elaboration handler in `resolveFollowUp` to replace the
generic "checking today's items for sign-off" copy when the user says "what is that?",
"tell me more", or "explain that" after the daily brief loads:

Suggested copy: *"Today's brief covers your key areas — attendance, wrap-ups, and
anything that needs your attention. The high-priority items are the ones to look at
first. Want me to open the Review Queue so you can work through them?"*

Or, if `lastResultHighPriorityCount` and `lastResultSectionCount` are both available:
*"Today's brief has {sectionCount} areas, {highCount} of which need attention first.
The Review Queue has the full item-by-item list — want me to open it?"*

No DB changes, no migrations, no server actions required.
