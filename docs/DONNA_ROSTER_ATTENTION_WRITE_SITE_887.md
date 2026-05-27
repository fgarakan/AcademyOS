# Sprint 887 — DONNA roster_attention Write Site V1

**Date:** 2026-05-27
**Sprint:** 887
**Type:** Write-site activation + minimal resolver preservation
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 886 recommendation — activate `roster_attention` as a real `lastIntentFamily` write site

---

## Sprint Goal

Activate `roster_attention` as a real `DonnaSessionIntentContext.lastIntentFamily` value when
DONNA's COO routing intent is `roster_attention`, while preserving current response behavior.

---

## Pre-Sprint Audit

### 1. `roster_attention` in `DonnaSessionIntentContext.lastIntentFamily` type union

Confirmed in `src/lib/donna/donnaFollowUpResolver.ts` (pre-887 committed state):

```typescript
| 'roster_attention' // Future-reserved — roster_attention IS an active DonnaDirectorIntent
                    // routing value, but the COO path writes 'coo_answer'; no lastIntentFamily
                    // write site exists (Sprint 883 audit)
```

Status pre-887: **Future-reserved** — in union type, never written. ✅ Confirmed present.

### 2. `roster_attention` as `DonnaDirectorIntent` — active

| Component | File | Evidence |
|---|---|---|
| `DonnaDirectorIntent` type | `donnaIntentClassifier.ts` line 177 | `\| 'roster_attention'` in union |
| Classifier signals | `donnaIntentClassifier.ts` lines 279–288 | 7 regex patterns (who needs attention, which players need, who is at risk, etc.) |
| Router mode | `donnaConversationalRouter.ts` line 59 | `case 'roster_attention': return 'use_roster_intel'` |
| Intel builder | `directorPlayersDonnaIntelligence.ts` lines 33–99 | `buildRosterHubAnswer` + `tryAnswerRosterAttentionQuestion` |
| Hub answer `actionId` | `directorPlayersDonnaIntelligence.ts` lines 40, 80 | `actionId: 'roster_attention'` |

`roster_attention` is fully active in the classifier/router/intelligence layer. ✅

### 3. `handleDonnaCooPrompt` — roster_attention path

In `DonnaAssistantButton.tsx`, the `use_roster_intel` response mode is handled at line 3016–3018:

```typescript
} else if (routing.responseMode === 'use_roster_intel') {
  composed = composeRosterIntelAnswer(attentionReport, reviewQueueData, firstName)
}
```

`composeRosterIntelAnswer` returns a `DonnaSafeReadAnswer` with:
- `text` — roster intelligence text
- `href` — always set: `/director/players/${playerId}` (high-risk player) or `/director/players` (fallback)
- `nextStepLabel` — player name or 'Want to see the full attention list?'

### 4. Existing `setSessionIntentContext` write for COO answers (pre-887)

At `DonnaAssistantButton.tsx` line 3052 (pre-887 committed state):

```typescript
if (!composed.isBlocked) {
  setSessionIntentContext({
    lastIntentFamily: 'coo_answer',
    ...
  })
}
```

**All** non-blocked COO answers, including roster_attention, wrote `lastIntentFamily: 'coo_answer'`. ✅ Confirmed.

### 5. Confirmed: roster_attention path wrote `'coo_answer'`

Before Sprint 887:
- User asks "who needs attention?" → `routing.intent === 'roster_attention'`
- `composed = composeRosterIntelAnswer(...)` → `href = '/director/players[/playerId]'`
- `setSessionIntentContext({ lastIntentFamily: 'coo_answer', lastSuggestedNavigationHref: '/director/players', ... })`

Follow-up "what do you recommend?" would hit the Sprint 881 `coo_answer` + href handler:
> "DONNA suggested Player Directory. The best next step is to open it and review what needs your attention there."

### 6. `routing.intent` availability at write site

`routing` is the `DonnaRoutingResult` returned by `routeDonnaPrompt(text, pathname)`.
`routing.intent` is typed as `DonnaDirectorIntent` — available at the write site. ✅

### 7. No new fields needed

All required context fields are already populated by the existing write:
- `lastSuggestedNavigationHref: composed.nextStepHref ?? null` — always set for roster_attention
- `lastSuggestedNavigationLabel: composed.nextStepLabel ?? null` — player name or follow-up text
- `lastTopicLabel: composed.nextStepLabel ?? null` — same as label
- `lastResultSectionCount: null` — roster answers don't use section counts
- `lastResultHighPriorityCount: null` — roster answers don't use high-priority counts
- `lastResultItemCount: null` — roster answers don't use item counts

No new fields required. ✅

---

## Implementation

### Change 1 — `DonnaAssistantButton.tsx`: Write-site conditional

**File:** `src/components/assistant/DonnaAssistantButton.tsx`
**Location:** `handleDonnaCooPrompt`, inside the `if (!composed.isBlocked)` block

**Before:**
```typescript
setSessionIntentContext({
  lastIntentFamily: 'coo_answer',
  ...
})
```

**After:**
```typescript
setSessionIntentContext({
  lastIntentFamily: routing.intent === 'roster_attention' ? 'roster_attention' : 'coo_answer',
  ...
})
```

**All other fields unchanged.**

When `routing.intent === 'roster_attention'`, `lastIntentFamily` is now `'roster_attention'`.
All other COO intents continue to write `'coo_answer'` unchanged.

---

### Change 2 — `donnaFollowUpResolver.ts`: Minimal resolver preservation

**Why this change was needed:**
Before Sprint 887, when roster_attention fired, `lastIntentFamily: 'coo_answer'` was written.
This made the Sprint 881 `coo_answer + href` recommendation handler fire, giving:
> "DONNA suggested Player Directory. The best next step is to open it and review what needs your attention there."

After activating the write site alone (without resolver changes), roster_attention's recommendation
would fall to the generic Review Queue fallback:
> "The Review Queue is usually a good starting point — those are the items waiting on your approval."

That is semantically wrong (roster_attention suggests Players page, not Review Queue). This is
the "behavior worse than before" condition the sprint guarded against.

**Fix:** Extend the existing `coo_answer` handlers in elaboration and recommendation to also
match `roster_attention`. These are NOT new handlers — they are 2-word extensions to existing
conditionals. The copy is identical to the `coo_answer` path.

#### Elaboration branch (Sprint 882 handler extended)

**Before:**
```typescript
if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
```

**After:**
```typescript
if (contextIsFresh && (context!.lastIntentFamily === 'coo_answer' || context!.lastIntentFamily === 'roster_attention') && context!.lastSuggestedNavigationHref) {
```

**Copy produced (same as coo_answer):**
> "That was Player Directory — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now."

#### Recommendation branch (Sprint 881 handler extended)

**Before:**
```typescript
if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
```

**After:**
```typescript
if (contextIsFresh && (context!.lastIntentFamily === 'coo_answer' || context!.lastIntentFamily === 'roster_attention') && context!.lastSuggestedNavigationHref) {
```

**Copy produced (same as coo_answer):**
> "DONNA suggested Player Directory. The best next step is to open it and review what needs your attention there. I can take you there."

#### Type comment updated

`'roster_attention'` annotation changed from **Future-reserved** to **Active**:

```typescript
| 'roster_attention' // Active — written by handleDonnaCooPrompt when routing.intent === 'roster_attention'
                    // (DonnaAssistantButton line 3051, Sprint 887); same fields as coo_answer;
                    // href='/director/players' or specific player href
```

`'coo_answer'` annotation updated to note the Sprint 887 conditional:

```typescript
| 'coo_answer'       // Active — written by handleDonnaCooPrompt for all non-blocked COO answers
                    // where routing.intent !== 'roster_attention' (DonnaAssistantButton line 3051,
                    // Sprint 802; conditional added Sprint 887)
```

---

## Write-Site Verification (post-887)

All `setSessionIntentContext` non-null write sites in `DonnaAssistantButton.tsx`:

| Line | `lastIntentFamily` written | Trigger | Change in Sprint 887 |
|---|---|---|---|
| 2208 | `'attention'` | `handleFetchAttentionReport` | None |
| 2248 | `'daily_brief'` | `handleFetchDailyBrief` | None |
| 2332 | `'review_queue'` | `handleOpenReviewQueue` | None |
| 2857 | `'section_nav'` | `handleUIDispatch` navigate | None |
| 3051 | `'roster_attention'` or `'coo_answer'` | `handleDonnaCooPrompt` | **Sprint 887** — conditional added |

`'roster_attention'` is now written when `routing.intent === 'roster_attention'`.
`'coo_answer'` is now written for all other non-blocked COO intents.

---

## Resolver Behavior Matrix (post-887)

`roster_attention` response always sets `lastSuggestedNavigationHref` (at minimum `/director/players`).

| Follow-up type | Triggers | Handler fired | Copy | Assessment |
|---|---|---|---|---|
| **Anaphoric** | "show me", "take me there", "go there", "open that" | Generic `lastSuggestedNavigationHref` catch-all (line 452) | "I'll take you to the Player Directory." | ✅ Correct |
| **Elaboration** | "what is that?", "tell me more", "explain that", "what does that mean?" | Sprint 882+887 handler (line 512) — `coo_answer || roster_attention` + href | "That was Player Directory — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now." | ✅ Correct |
| **Recommendation** | "what do you recommend?", "what now?", "what should I do next?" | Sprint 881+887 handler (line 569) — `coo_answer || roster_attention` + href | "DONNA suggested Player Directory. The best next step is to open it and review what needs your attention there. I can take you there." | ✅ Correct |
| **Time shift** | "what about last week?" | Context-independent handler | Generic time-shift copy | ✅ Correct (context-independent by design) |
| **Topic shift** | "what about players?" | Context-independent `buildTopicShiftResponse` | Generic topic-shift copy → `/director/players` | ✅ Correct |
| **No href edge case** | roster_attention answer with no page (impossible in practice) | Generic fallback | Review Queue copy | N/A (never occurs — `buildRosterHubAnswer` always sets href) |

**Behavior preserved or improved vs. pre-887 in all cells.** ✅

---

## Before / After Comparison

| Scenario | Pre-887 | Post-887 |
|---|---|---|
| "Who needs attention?" fires `roster_attention` intent | `lastIntentFamily: 'coo_answer'` written | `lastIntentFamily: 'roster_attention'` written |
| "Go there" follow-up | Generic href catch-all → Player Directory ✅ | Generic href catch-all → Player Directory ✅ (identical) |
| "What is that?" elaboration follow-up | Sprint 882 `coo_answer` handler → "That was Player Directory..." ✅ | Sprint 887 `roster_attention` extension → "That was Player Directory..." ✅ (identical copy) |
| "What do you recommend?" follow-up | Sprint 881 `coo_answer` handler → "DONNA suggested Player Directory..." ✅ | Sprint 887 `roster_attention` extension → "DONNA suggested Player Directory..." ✅ (identical copy) |
| Non-roster COO answer + follow-up | `'coo_answer'` path ✅ | `'coo_answer'` path ✅ (unchanged) |

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
| No navigation history changes | ✅ |
| No multi-step memory | ✅ |
| No dispatcher changes | ✅ |
| No regex/pattern changes | ✅ |
| No new packages | ✅ |
| All proposed_actions / audit_log rules preserved | ✅ |
| Parent/player data not exposed | ✅ |
| coo_answer behavior for non-roster intents unchanged | ✅ |
| Runtime response output unchanged | ✅ |
| TypeScript clean | ✅ |

---

## Union Type State (post-887)

`DonnaSessionIntentContext.lastIntentFamily` after Sprint 887:

| Value | Status | Written by |
|---|---|---|
| `'daily_brief'` | ✅ Active | `handleFetchDailyBrief` (line 2248) |
| `'review_queue'` | ✅ Active | `handleOpenReviewQueue` (line 2332) |
| `'attention'` | ✅ Active | `handleFetchAttentionReport` (line 2208) |
| `'coo_answer'` | ✅ Active | `handleDonnaCooPrompt` for non-roster COO (line 3051) |
| `'section_nav'` | ✅ Active | `handleUIDispatch` navigate (line 2857) |
| `'roster_attention'` | ✅ **Now active** | `handleDonnaCooPrompt` when `routing.intent === 'roster_attention'` (line 3051) |
| `null` | ✅ Active | Panel close (line 973), route change (line 1277) |

All 6 string values in the union are now active write sites.

---

## Coverage Matrix (post-887)

| Family | Anaphoric | Elaboration | Recommendation |
|---|---|---|---|
| `'daily_brief'` | ✅ Explicit | ✅ Explicit (Sprint 885) | ✅ Explicit |
| `'review_queue'` | ✅ Explicit | ✅ Generic correct | ✅ Explicit |
| `'attention'` | ✅ Explicit | ✅ Generic acceptable | ✅ Explicit |
| `'coo_answer'` | ✅ Generic correct | ✅ Explicit (Sprint 882) | ✅ Explicit (Sprint 881) |
| `'section_nav'` | ✅ Explicit (Sprint 877) | ✅ Explicit (Sprint 878) | ✅ Explicit (Sprint 879) |
| `'roster_attention'` | ✅ Generic correct | ✅ **Explicit** (Sprint 882+887) | ✅ **Explicit** (Sprint 881+887) |

All 6 active families × 3 follow-up types = 18 cells. ✅ All correct.

---

## Files Modified

| File | Change |
|---|---|
| `src/components/assistant/DonnaAssistantButton.tsx` | Write-site conditional: `lastIntentFamily` now writes `'roster_attention'` when `routing.intent === 'roster_attention'`; all other COO intents unchanged |
| `src/lib/donna/donnaFollowUpResolver.ts` | Elaboration handler (Sprint 882) extended: `=== 'coo_answer'` → `=== 'coo_answer' \|\| === 'roster_attention'`; Recommendation handler (Sprint 881) extended: same; type comments updated for `'coo_answer'` and `'roster_attention'`; generic fallback comment updated |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_ROSTER_ATTENTION_WRITE_SITE_887.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` | Pre-sprint certification state |
| `docs/DONNA_INTENT_FAMILY_TYPE_UNION_AUDIT_883.md` | Type union classification reference |
| `src/lib/donna/donnaIntentClassifier.ts` | Confirmed `roster_attention` DonnaDirectorIntent active |
| `src/lib/donna/donnaConversationalRouter.ts` | Confirmed `use_roster_intel` mode for roster_attention |
| `src/lib/donna/directorPlayersDonnaIntelligence.ts` | Confirmed href always set in roster answers |

---

## Known Limitations (post-887)

None. All 6 active intent families now have explicit write sites. Follow-up behavior is
preserved or improved across all pattern groups.

**Edge case (documented, not a limitation in practice):**
If a roster_attention answer somehow had no `nextStepHref` (impossible given `buildRosterHubAnswer`
always sets `href = '/director/players'` as the minimum), the recommendation and elaboration
branches would fall to generic handlers. This cannot occur in the current implementation.

---

## Sprint 888 Recommendation

**Sprint 888 — DONNA roster_attention Follow-Up Copy V1**

Optionally add dedicated roster_attention elaboration and recommendation copy instead of
reusing the generic `coo_answer` copy:

- **Elaboration:** "That was the roster attention report — DONNA's summary of players who need
  your attention based on observations and attendance. I can take you to the Player Directory
  for the full picture."
- **Recommendation:** "In the roster report, start with the high-risk players — those are the
  ones flagged for attendance or development concerns. I can take you to the Player Directory."

This would replace the current "That was Player Directory / DONNA suggested Player Directory"
copy with roster-specific framing. The current copy is functionally correct — this is a polish
sprint only.

Priority: **Low** — current behavior is correct and navigates to the right destination.
Sprint 888 is optional before moving to the next feature sprint.

**Alternative Sprint 888:**
DONNA follow-up pattern expansion — add common anaphoric phrases not currently covered
("open it for me", "let me see it", "bring it up").

No DB changes, no migrations, no server actions required for either option.
