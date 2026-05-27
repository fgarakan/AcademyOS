# Sprint 889 — DONNA Follow-Up Pattern Expansion V1

**Date:** 2026-05-27
**Sprint:** 889
**Type:** ANAPHORIC_PATTERNS expansion — 5 new patterns, 11 new phrases
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 888 remaining limitation — common anaphoric phrases not covered

---

## Sprint Goal

Audit `ANAPHORIC_PATTERNS` for confirmed missing phrases and add the smallest safe regex
additions so users can say natural commands like "open it for me," "bring it up," and
"navigate there" after DONNA suggests a page or section.

---

## Pre-Sprint Audit

### Pattern groups read (not modified)

| Pattern group | Guard | Patterns pre-889 |
|---|---|---|
| `ANAPHORIC_PATTERNS` | `wc ≤ 6` | 12 patterns |
| `SEQUENTIAL_PATTERNS` | `wc ≤ 3` | 7 patterns |
| `ELABORATION_PATTERNS` | `wc ≤ 8` | 12 patterns |
| `RECOMMENDATION_PATTERNS` | `wc ≤ 10` | 10 patterns |
| `TIME_SHIFT_PATTERNS` | `wc ≤ 8` | 3 patterns |
| `TOPIC_SHIFT_PATTERNS` | `wc ≤ 8` | 6 patterns |

Only `ANAPHORIC_PATTERNS` is modified. All other groups unchanged.

---

### Phrase-by-phrase audit

All phrases tested against pre-889 `ANAPHORIC_PATTERNS` and `SEQUENTIAL_PATTERNS`
after normalization (lowercase + trim + trailing punctuation stripped).

| Phrase | Normalized | Matching pre-889 pattern | Covered pre-889? | Action |
|---|---|---|---|---|
| "open it for me" | `open it for me` | `/^open (that\|it\|the first one\|them)$/` matches `open it` only — `for me` suffix not in pattern | ❌ | **Add** |
| "open that for me" | `open that for me` | same — suffix not matched | ❌ | **Add** |
| "let me see it" | `let me see it` | no match | ❌ | **Add** |
| "let me see that" | `let me see that` | no match | ❌ | **Add** |
| "bring it up" | `bring it up` | no match | ❌ | **Add** |
| "bring that up" | `bring that up` | no match | ❌ | **Add** |
| "navigate there" | `navigate there` | no match | ❌ | **Add** |
| "navigate to it" | `navigate to it` | no match | ❌ | **Add** |
| **"take me to it"** | `take me to it` | `/^take me (there\|to it)$/` — **exact match** | ✅ | **Skip** |
| "pull it up" | `pull it up` | no match | ❌ | **Add** |
| "pull that up" | `pull that up` | no match | ❌ | **Add** |

**Result:** 10 phrases missing, 1 already covered. 5 new patterns needed.

---

### Word-count guard verification

`isAnaphoric` requires `wc ≤ 6`. All new phrases confirmed within guard:

| New phrase | Word count | Within guard? |
|---|---|---|
| "open it for me" | 4 | ✅ |
| "open that for me" | 4 | ✅ |
| "open this" | 2 | ✅ |
| "let me see it" | 4 | ✅ |
| "let me see that" | 4 | ✅ |
| "bring it up" | 3 | ✅ |
| "bring that up" | 3 | ✅ |
| "pull it up" | 3 | ✅ |
| "pull that up" | 3 | ✅ |
| "navigate there" | 2 | ✅ |
| "navigate to it" | 3 | ✅ |

All pass. Max is 4 words (well within the 6-word guard).

---

### Safety check — false positive risk

All new patterns are start-anchored (`^`) and end-anchored (`$`). They will only match
exact normalized phrases, not substrings of longer commands.

| Pattern | Risk | Assessment |
|---|---|---|
| `/^open (it\|that\|this)( for me)?$/` | Could match "open this" in an ambiguous context | Low — director would only say "open this" as anaphoric follow-up; no overlap with COO commands which start with action nouns or player names |
| `/^let me see (it\|that\|this)$/` | Very specific phrase | ✅ No meaningful false-positive risk |
| `/^bring (it\|that\|this) up$/` | "Bring it up" could mean "raise a topic" | Low — in DONNA context, always navigational; topic raise would be phrased differently ("I want to talk about…") |
| `/^pull (it\|that\|this) up$/` | Standard tech UI phrase | ✅ Low risk |
| `/^navigate (there\|to it\|to that\|to this)$/` | Explicit navigation verb | ✅ No risk |

**Verdict:** All 5 patterns are safe to add.

---

## Pre-889 ANAPHORIC_PATTERNS (12 patterns)

```typescript
/^which (ones?|items?|things?)$/,
/^show me$/,
/^show me (the )?(first|that|those|them|it|all)$/,
/^open (that|it|the first one|them)$/,
/^(the )?(first|that|last) one$/,
/^those$/,
/^(show|open|see) (all of )?them$/,
/^take me (there|to it)$/,
/^let'?s go$/,
/^go there$/,
/^show me all$/,
/^(can you )?show (it|that|those|them) to me$/,
```

---

## Implementation — 5 patterns added to ANAPHORIC_PATTERNS

Appended to the end of `ANAPHORIC_PATTERNS` with a Sprint 889 comment block:

```typescript
// Sprint 889 — pattern expansion: natural phrases confirmed missing from pre-889 patterns.
// All patterns are start+end anchored; word count ≤ 4 (well within the 6-word guard).
// "take me to it" was already covered by /^take me (there|to it)$/ — not re-added.
/^open (it|that|this)( for me)?$/,          // "open it for me", "open that for me", "open this"
/^let me see (it|that|this)$/,              // "let me see it", "let me see that", "let me see this"
/^bring (it|that|this) up$/,               // "bring it up", "bring that up", "bring this up"
/^pull (it|that|this) up$/,                // "pull it up", "pull that up", "pull this up"
/^navigate (there|to it|to that|to this)$/, // "navigate there", "navigate to it", "navigate to that"
```

**Post-889 ANAPHORIC_PATTERNS count:** 17 patterns (12 existing + 5 new)

---

## Full Phrase Coverage (post-889)

### Newly covered phrases

| Phrase | Matched by |
|---|---|
| "open it for me" | `/^open (it\|that\|this)( for me)?$/` |
| "open that for me" | `/^open (it\|that\|this)( for me)?$/` |
| "open this for me" | `/^open (it\|that\|this)( for me)?$/` |
| "open this" | `/^open (it\|that\|this)( for me)?$/` |
| "let me see it" | `/^let me see (it\|that\|this)$/` |
| "let me see that" | `/^let me see (it\|that\|this)$/` |
| "let me see this" | `/^let me see (it\|that\|this)$/` |
| "bring it up" | `/^bring (it\|that\|this) up$/` |
| "bring that up" | `/^bring (it\|that\|this) up$/` |
| "bring this up" | `/^bring (it\|that\|this) up$/` |
| "pull it up" | `/^pull (it\|that\|this) up$/` |
| "pull that up" | `/^pull (it\|that\|this) up$/` |
| "pull this up" | `/^pull (it\|that\|this) up$/` |
| "navigate there" | `/^navigate (there\|to it\|to that\|to this)$/` |
| "navigate to it" | `/^navigate (there\|to it\|to that\|to this)$/` |
| "navigate to that" | `/^navigate (there\|to it\|to that\|to this)$/` |
| "navigate to this" | `/^navigate (there\|to it\|to that\|to this)$/` |

**17 new phrases now covered** (some patterns cover 3–4 variants each).

### Already covered (unchanged)

| Phrase | Pattern |
|---|---|
| "show me" | `/^show me$/` |
| "open that" | `/^open (that\|it\|...)$/` |
| "open it" | `/^open (that\|it\|...)$/` |
| "take me there" | `/^take me (there\|to it)$/` |
| "take me to it" | `/^take me (there\|to it)$/` |
| "go there" | `/^go there$/` |
| "show me all" | `/^show me all$/` |
| "show me the first" | `/^show me (the )?(first\|...)$/` |
| "show me that" | `/^show me (the )?(first\|that\|...)$/` |
| "let's go" | `/^let'?s go$/` |
| "which ones?" | `/^which (ones?\|items?\|things?)$/` |
| "next" | `/^next$/` (SEQUENTIAL) |
| "go back" | `/^go back$/` (SEQUENTIAL) |

---

## Behavior Verification

All new phrases route through the **identical anaphoric branch** as pre-889 phrases:

```
isAnaphoric = true
→ contextIsFresh && context!.lastIntentFamily === 'daily_brief'  → buildBriefAnaphoricResponse()
→ contextIsFresh && family === 'review_queue' || 'attention'     → navigate /director/review
→ contextIsFresh && family === 'section_nav' + href              → "I'll take you back to {label}…"
→ contextIsFresh && lastSuggestedNavigationHref                  → "I'll take you to the {label}."
→ (no context)                                                   → clarification
```

**Effect of pattern expansion:** The same branch logic executes for the 17 new phrases as for "show me" or "take me there." No new code paths opened. No copy changes. No navigation changes.

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
| No dispatcher changes | ✅ |
| No classifier/router changes | ✅ |
| No response-generation changes | ✅ |
| No ELABORATION_PATTERNS changes | ✅ |
| No RECOMMENDATION_PATTERNS changes | ✅ |
| No TIME_SHIFT_PATTERNS changes | ✅ |
| No TOPIC_SHIFT_PATTERNS changes | ✅ |
| No SEQUENTIAL_PATTERNS changes | ✅ |
| DonnaAssistantButton.tsx not touched | ✅ |
| No new packages | ✅ |
| Existing anaphoric behavior preserved | ✅ |
| daily_brief behavior unchanged | ✅ |
| review_queue / attention behavior unchanged | ✅ |
| coo_answer behavior unchanged | ✅ |
| section_nav behavior unchanged | ✅ |
| roster_attention behavior unchanged | ✅ |
| TypeScript clean | ✅ |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | 5 new patterns appended to `ANAPHORIC_PATTERNS` with Sprint 889 comment block: `/^open (it\|that\|this)( for me)?$/`, `/^let me see (it\|that\|this)$/`, `/^bring (it\|that\|this) up$/`, `/^pull (it\|that\|this) up$/`, `/^navigate (there\|to it\|to that\|to this)$/`; total pattern count: 12 → 17 |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_FOLLOW_UP_PATTERN_EXPANSION_889.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_ROSTER_ATTENTION_FOLLOW_UP_COPY_888.md` | Sprint 888 state, confirmed limitation |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` | Coverage matrix reference |

---

## Known Limitations (post-889)

**No functional limitations remaining in ANAPHORIC_PATTERNS.** All common natural-language
navigational follow-up phrases are now covered.

**Future edge cases (not actionable yet):**
- "Can you take me there?" — `wc = 5`, could be added if usage warrants. Not in sprint scope.
- "Go ahead and open it" — `wc = 6`, borderline. Would match the word-count guard but phrase is less common.
- "Show it to me please" — `wc = 5`, "please" is not stripped by normalizer. Could add "please" to normalizer strip list.

None of these are blockers. They can be addressed if observed in real director usage.

---

## Sprint 890 Recommendation

**Sprint 890 — DONNA review_queue / attention Elaboration Handlers V1**

Add dedicated elaboration handlers for `'review_queue'` and `'attention'`, replacing the
current "checking Review Queue for sign-off" generic copy (Sprint 886 audit: "Generic +
acceptable"). Current copy is functionally correct but uses "sign-off" framing which is
slightly imprecise:

- `review_queue` elaboration: *"That was the Review Queue — that's where pending items live until you approve, reject, or flag them for follow-up. Want me to open it?"*
- `attention` elaboration: *"That was the attention report — DONNA's summary of items flagged as urgent or needing your focus now. Want me to open the Review Queue so you can act on them?"*

Priority: **Low** — current copy is acceptable; this is polish only.

**Alternative Sprint 890:**
DONNA normalizer expansion — add "please" to the filler-word strip list in the normalizer
so "open it please", "show me please" match existing ANAPHORIC_PATTERNS without needing
new pattern entries.
