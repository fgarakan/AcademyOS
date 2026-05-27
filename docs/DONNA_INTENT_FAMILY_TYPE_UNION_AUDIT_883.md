# Sprint 883 — DONNA Intent Family Type Union Audit V1

**Date:** 2026-05-27
**Sprint:** 883
**Type:** Audit — `DonnaSessionIntentContext.lastIntentFamily` union classification
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 881/882 known limitation — `'page_actions'` and `'roster_attention'` status unresolved

---

## Sprint Goal

Classify every value in `DonnaSessionIntentContext.lastIntentFamily` as active, dormant,
or future-reserved. Add inline type comments to document status. Do not remove values —
document removal as a future sprint decision.

---

## The Type Union (pre-883)

Defined in `src/lib/donna/donnaFollowUpResolver.ts`:

```typescript
lastIntentFamily:
  | 'daily_brief'
  | 'review_queue'
  | 'page_actions'
  | 'attention'
  | 'coo_answer'
  | 'section_nav'     // Sprint 876
  | 'roster_attention'
  | null
```

7 string values + null. Only `'section_nav'` had a sprint annotation. All others had no status
indication. Sprint 883 adds inline status comments to all values.

---

## Write Site Audit — Complete

All `setSessionIntentContext` call sites in `DonnaAssistantButton.tsx`:

| Line | `lastIntentFamily` written | Trigger function | Sprint |
|---|---|---|---|
| 973 | `null` | `handlePanelClose` | 785 |
| 1277 | `null` | Route change effect | 785 |
| 2208 | `'attention'` | `handleFetchAttentionReport` | 785 |
| 2248 | `'daily_brief'` | `handleFetchDailyBrief` | 785 |
| 2332 | `'review_queue'` | `handleOpenReviewQueue` | 785 |
| 2856–2857 | `'section_nav'` | `handleUIDispatch` navigate block | 876 |
| 3050–3051 | `'coo_answer'` | `handleDonnaCooPrompt` (all non-blocked COO answers) | 802 |

**Total non-null write sites: 5.**
**Values written: `'attention'`, `'daily_brief'`, `'review_queue'`, `'section_nav'`, `'coo_answer'`.**

No other file calls `setSessionIntentContext`. `DonnaSessionIntentContext` is:
- Defined in `src/lib/donna/donnaFollowUpResolver.ts`
- Imported only by `src/components/assistant/DonnaAssistantButton.tsx`
- Stored in `useState<DonnaSessionIntentContext | null>(null)` at line 841
- Consumed only in `resolveFollowUp(text, sessionIntentContext)` calls inside `DonnaAssistantButton`

---

## Read Site Audit — Complete

All `context!.lastIntentFamily === '...'` checks in `src/lib/donna/donnaFollowUpResolver.ts`:

| Line | Check | Branch |
|---|---|---|
| 424 | `=== 'daily_brief'` | Anaphoric / Sequential |
| 427 | `=== 'review_queue'` or `=== 'attention'` | Anaphoric / Sequential |
| 439 | `=== 'section_nav'` | Anaphoric / Sequential |
| 473 | `=== 'section_nav'` | Elaboration |
| 481 | `=== 'coo_answer'` | Elaboration (Sprint 882) |
| 513 | `=== 'daily_brief'` | Recommendation |
| 516 | `=== 'review_queue'` or `=== 'attention'` | Recommendation |
| 528 | `=== 'section_nav'` | Recommendation |
| 537 | `=== 'coo_answer'` | Recommendation (Sprint 881) |

Values **never read** (no explicit check): `'page_actions'`, `'roster_attention'`
(mentioned only in comments at lines 532 and 550 — not in conditionals).

---

## Classification — All Values

### 1. `'daily_brief'` — ✅ Active

| Field | Detail |
|---|---|
| **Written** | ✅ DonnaAssistantButton line 2248 |
| **Read** | ✅ Lines 424 (anaphoric), 513 (recommendation) |
| **Handlers** | Anaphoric: `buildBriefAnaphoricResponse`; Recommendation: `buildBriefRecommendationResponse` |
| **Elaboration** | Falls to generic `lastTopicLabel` handler — functional (label = "today's brief") |
| **Status** | Active and well-covered |

---

### 2. `'review_queue'` — ✅ Active

| Field | Detail |
|---|---|
| **Written** | ✅ DonnaAssistantButton line 2332 |
| **Read** | ✅ Lines 427 (anaphoric), 516 (recommendation) — combined with `'attention'` |
| **Handlers** | Anaphoric: navigate `/director/review`; Recommendation: navigate `/director/review` |
| **Status** | Active and fully covered |

---

### 3. `'attention'` — ✅ Active

| Field | Detail |
|---|---|
| **Written** | ✅ DonnaAssistantButton line 2208 |
| **Read** | ✅ Lines 427 (anaphoric), 516 (recommendation) — combined with `'review_queue'` |
| **Handlers** | Same handler as `'review_queue'` — combined check |
| **Context fields at write** | `lastSuggestedNavigationHref: '/director/review'`, `lastTopicLabel: 'urgent items'` |
| **Status** | Active and fully covered |

---

### 4. `'coo_answer'` — ✅ Active

| Field | Detail |
|---|---|
| **Written** | ✅ DonnaAssistantButton line 3050 — all non-blocked COO answers |
| **Read** | ✅ Lines 481 (elaboration, Sprint 882), 537 (recommendation, Sprint 881) |
| **Handlers** | Elaboration: "That was {label}…" (Sprint 882); Recommendation: "DONNA suggested {label}…" (Sprint 881) |
| **Anaphoric** | Falls to generic `lastSuggestedNavigationHref` catch-all — already correct |
| **Context fields at write** | `lastSuggestedNavigationHref: composed.nextStepHref ?? null`, `lastSuggestedNavigationLabel: composed.nextStepLabel ?? null`, `lastTopicLabel: composed.nextStepLabel ?? null` |
| **Status** | Active and fully covered (Sprints 881 + 882) |

---

### 5. `'section_nav'` — ✅ Active

| Field | Detail |
|---|---|
| **Written** | ✅ DonnaAssistantButton line 2857 — `handleUIDispatch` navigate result |
| **Read** | ✅ Lines 439 (anaphoric), 473 (elaboration), 528 (recommendation) |
| **Handlers** | Anaphoric: "I'll take you back to {label}…" (Sprint 877); Elaboration: `buildSectionNavElaborationResponse` (Sprint 878); Recommendation: `buildSectionNavRecommendationResponse` (Sprint 879) |
| **Audit** | Sprint 880 certified all 14 SECTION_NAV_ENTRIES × 3 follow-up types |
| **Status** | Active — best-covered family in the resolver |

---

### 6. `'page_actions'` — ❌ Dormant

| Field | Detail |
|---|---|
| **Written** | ❌ Never — no write site in any file |
| **Read** | ❌ Never — no conditional check; mentioned only in comments |
| **In `DonnaDirectorIntent`** | ❌ Not present — no counterpart routing intent |
| **In classifier / router** | ❌ Not present |
| **Sprint discovered** | Sprint 881 (audit of recommendation fallback) |
| **Status** | **Dormant — candidate for removal in Sprint 884** |
| **Risk of removal** | None — TypeScript would catch any attempt to write or check this value after removal |

**Verdict:** `'page_actions'` is a dead enum value. It has no write site, no read site,
no counterpart routing intent, and no documented plan for future use. It is safe to remove
from the union type. Sprint 884 can do this as a pure type cleanup.

---

### 7. `'roster_attention'` — ⚠️ Future-Reserved

| Field | Detail |
|---|---|
| **Written as `lastIntentFamily`** | ❌ Never — no `setSessionIntentContext({ lastIntentFamily: 'roster_attention' })` call |
| **Read as `lastIntentFamily`** | ❌ Never — no conditional check in resolver |
| **As `DonnaDirectorIntent` routing value** | ✅ Active — `donnaIntentClassifier.ts` line 177; router maps to `'use_roster_intel'` mode (line 58) |
| **As `actionId` in hub answers** | ✅ Active — `directorPlayersDonnaIntelligence.ts` lines 40, 80 |
| **Sprint discovered** | Sprint 881 + 882 |
| **What happens when roster_attention fires** | `handleDonnaCooPrompt` handles it via `use_roster_intel` mode → `composeRosterIntelAnswer` → final COO answer written → `setSessionIntentContext({ lastIntentFamily: 'coo_answer', ... })` at line 3050 |
| **Status** | **Future-reserved — keep in union; do not remove** |
| **Rationale** | `roster_attention` has active infrastructure (classifier, router, intel builder). A future sprint could add a dedicated `setSessionIntentContext({ lastIntentFamily: 'roster_attention', ... })` write site when roster intel gets its own follow-up handler. Removing it now would be premature. |

**Verdict:** `'roster_attention'` should stay in the type union. It's dormant as a
`lastIntentFamily` value but has a clear semantic role and active infrastructure that
makes it a plausible future write site.

---

### 8. `null` — ✅ Active (cleared state)

| Field | Detail |
|---|---|
| **Written** | ✅ Lines 973 (panel close) and 1277 (route change) — `setSessionIntentContext(null)` |
| **Status** | Active — correct behavior; context is cleared when DONNA panel closes or user navigates |

---

## Summary Classification Table

| Value | Written | Read | Classification | Action |
|---|---|---|---|---|
| `'daily_brief'` | ✅ Line 2248 | ✅ Lines 424, 513 | **Active** | None needed |
| `'review_queue'` | ✅ Line 2332 | ✅ Lines 427, 516 | **Active** | None needed |
| `'attention'` | ✅ Line 2208 | ✅ Lines 427, 516 | **Active** | None needed |
| `'coo_answer'` | ✅ Line 3050 | ✅ Lines 481, 537 | **Active** | None needed |
| `'section_nav'` | ✅ Line 2857 | ✅ Lines 439, 473, 528 | **Active** | None needed |
| `'page_actions'` | ❌ Never | ❌ Never | **Dormant** | Remove in Sprint 884 |
| `'roster_attention'` | ❌ Never (as lastIntentFamily) | ❌ Never (in resolver) | **Future-reserved** | Keep; add write site when roster follow-up handler is built |
| `null` | ✅ Lines 973, 1277 | N/A | **Active** | None needed |

---

## Implementation — Sprint 883

### `src/lib/donna/donnaFollowUpResolver.ts` — Type comments added

Added a 3-line comment block before `lastIntentFamily` explaining the annotation scheme,
then annotated each union member with its status, write site, and sprint:

```typescript
// Sprint 883 audit — each value annotated with active / dormant status.
// Active values have a confirmed write site in DonnaAssistantButton.tsx.
// Dormant values are declared but never written — see DONNA_INTENT_FAMILY_TYPE_UNION_AUDIT_883.md.
lastIntentFamily:
  | 'daily_brief'      // Active — written by handleFetchDailyBrief (DonnaAssistantButton line 2248, Sprint 785)
  | 'review_queue'     // Active — written by handleOpenReviewQueue (DonnaAssistantButton line 2332, Sprint 785)
  | 'attention'        // Active — written by handleFetchAttentionReport (DonnaAssistantButton line 2208, Sprint 785)
  | 'coo_answer'       // Active — written by handleDonnaCooPrompt for all non-blocked COO answers (DonnaAssistantButton line 3050, Sprint 802)
  | 'section_nav'      // Active — written by handleUIDispatch navigate block (DonnaAssistantButton line 2857, Sprint 876)
  | 'page_actions'     // Dormant — declared but never written; no write site; no counterpart in DonnaDirectorIntent (Sprint 883 audit — candidate for removal in Sprint 884)
  | 'roster_attention' // Future-reserved — roster_attention IS an active DonnaDirectorIntent routing value, but the COO path writes 'coo_answer'; no lastIntentFamily write site exists (Sprint 883 audit)
  | null               // Cleared state — set on panel close (line 973) and route change (line 1277)
```

No behavior changes. No logic changes. Pure type documentation.

---

## Key Distinction — `roster_attention` as Routing Intent vs. lastIntentFamily

| Concept | Type | Active? | Location |
|---|---|---|---|
| `'roster_attention'` as `DonnaDirectorIntent` | Routing intent from classifier | ✅ Active | `donnaIntentClassifier.ts`, `donnaConversationalRouter.ts` |
| `'roster_attention'` as `actionId` in hub answers | Answer shape field | ✅ Active | `directorPlayersDonnaIntelligence.ts` |
| `'roster_attention'` as `lastIntentFamily` | Follow-up resolver context | ❌ Never written | Would be in `setSessionIntentContext` call |
| `'page_actions'` as `DonnaDirectorIntent` | Routing intent | ❌ Does not exist | No counterpart in classifier |
| `'page_actions'` as `lastIntentFamily` | Follow-up resolver context | ❌ Never written | No write site |

This distinction is important: `roster_attention` is a meaningful concept in the system —
just not as a `lastIntentFamily` value (yet). `page_actions` has no meaningful counterpart
anywhere in the current codebase.

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | Added 3-line comment block before `lastIntentFamily`; annotated all 7 union values + null with status, write site, and sprint reference |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | No changes needed — write sites confirmed, no new write site required |
| `src/lib/donna/donnaIntentClassifier.ts` | Audit only — `roster_attention` DonnaDirectorIntent is active; no change needed |
| `src/lib/donna/donnaConversationalRouter.ts` | Audit only — no change needed |
| `src/lib/donna/directorPlayersDonnaIntelligence.ts` | Audit only — `actionId: 'roster_attention'` in answers is a different concept; no change needed |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No behavior changes | ✅ — type comments only; resolver logic untouched |
| No DB writes | ✅ |
| No DB reads | ✅ |
| No server actions | ✅ |
| No new packages | ✅ |
| No dormant values removed | ✅ — documented for Sprint 884; not removed now |
| All existing handler priorities preserved | ✅ — no logic touched |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Follow-Up Handler Coverage Summary (post-883, all families)

| Family | Anaphoric | Elaboration | Recommendation | Status |
|---|---|---|---|---|
| `'daily_brief'` | `buildBriefAnaphoricResponse` | Generic lastTopicLabel ("sign-off" copy) | `buildBriefRecommendationResponse` | Active; elaboration is minor gap |
| `'review_queue'` | Navigate `/director/review` | Generic lastTopicLabel | Navigate `/director/review` | Active; fully correct |
| `'attention'` | Navigate `/director/review` | Generic lastTopicLabel | Navigate `/director/review` | Active; fully correct |
| `'coo_answer'` | Generic href catch-all | "That was {label}…" (Sprint 882) | "DONNA suggested {label}…" (Sprint 881) | Active; fully covered |
| `'section_nav'` | "I'll take you back to {label}…" (877) | `buildSectionNavElaborationResponse` (878) | `buildSectionNavRecommendationResponse` (879) | Active; 42/42 scenarios certified (880) |
| `'page_actions'` | Falls to generic | Falls to generic | Falls to generic | Dormant; handlers would be dead code |
| `'roster_attention'` | Falls to generic | Falls to generic | Falls to generic | Future-reserved; falls to `'coo_answer'` path in practice |

---

## Sprint 884 Recommendation

**Sprint 884 — DONNA `page_actions` Type Cleanup V1**

Remove `'page_actions'` from the `DonnaSessionIntentContext.lastIntentFamily` union type:
1. Confirm no new write site was added since Sprint 883
2. Remove `| 'page_actions'` from the union in `donnaFollowUpResolver.ts`
3. TypeScript will enforce the removal — any future attempt to write `'page_actions'`
   will cause a compile error, which is the correct guardrail
4. No runtime behavior change (value was never written or read)

Keep `'roster_attention'` — it has active semantic infrastructure and a plausible future
write site.

Alternatively: **Sprint 884 — DONNA Daily Brief Elaboration Follow-Up V1** — add an
explicit `'daily_brief'` elaboration handler to replace the generic "checking today's items
for sign-off" copy with brief-appropriate elaboration ("Today's brief covers {sectionCount}
areas. The highest-priority ones need your attention first — want me to walk through them?").

No DB changes, no migrations, no server actions required for either option.
