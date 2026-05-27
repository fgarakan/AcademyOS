# Sprint 892 — DONNA Normalizer Please Strip V1

**Date:** 2026-05-27
**Sprint:** 892
**Type:** Normalizer enhancement — polite trailing/leading "please" strip
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 891 remaining minor limitation — "please" not stripped by normalizer; polite variants of covered phrases ("open it please", "please show me") fail to match despite core phrase being covered

---

## Sprint Goal

Add trailing and leading "please" stripping to the `normalize` function so polite phrase variants
like `"open it please"`, `"please show me"`, and `"bring it up please"` match existing
ANAPHORIC_PATTERNS, ELABORATION_PATTERNS, and RECOMMENDATION_PATTERNS without adding new
pattern entries.

---

## Pre-Sprint Audit

### 1. Normalizer (pre-892)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/\s{2,}/g, ' ')
}
```

**Operations:** lowercase → trim → strip trailing `?!.` → collapse multi-spaces.

**No filler-word stripping.** "please" passes through unchanged.

### 2. Current behavior for audit phrases

| Phrase | Normalized (pre-892) | Pattern match | Covered? |
|---|---|---|---|
| "open it please" | `"open it please"` | `/^open (it\|that\|this)( for me)?$/` — fails (trailing "please") | ❌ |
| "show me please" | `"show me please"` | `/^show me$/` — fails | ❌ |
| "bring it up please" | `"bring it up please"` | `/^bring (it\|that\|this) up$/` — fails | ❌ |
| "navigate there please" | `"navigate there please"` | `/^navigate (there\|to it\|...)$/` — fails | ❌ |
| "please show me" | `"please show me"` | no match | ❌ |
| "please open it" | `"please open it"` | no match | ❌ |

All 6 confirmed uncovered pre-892. ✅

### 3. Does the normalizer already strip any filler words?

No. The pre-892 normalizer has no filler-word or politeness-token stripping. Only
punctuation and whitespace normalization. ✅ Confirmed.

### 4. Normalizer strip vs. new patterns — safety comparison

| Approach | Patterns changed | Pattern count impact | Phrases covered | False positive risk |
|---|---|---|---|---|
| **Normalizer strip (chosen)** | None | 0 | All "please"-prefixed/suffixed variants of all existing patterns across all 6 groups | None — strip only fires on exact leading/trailing token |
| New ANAPHORIC_PATTERNS | +N | Grows per variant | Only the specific phrases listed | Low — anchored patterns |

**Normalizer strip is safer and broader.** One normalizer change covers "please" variants
of ALL 6 pattern groups simultaneously (anaphoric, sequential, elaboration, recommendation,
time shift, topic shift) without touching any pattern array. ✅

### 5. Pattern changes needed

**None.** All 17 ANAPHORIC_PATTERNS, 7 SEQUENTIAL_PATTERNS, 13 ELABORATION_PATTERNS,
10 RECOMMENDATION_PATTERNS, 3 TIME_SHIFT_PATTERNS, and 6 TOPIC_SHIFT_PATTERNS are
unchanged. ✅

---

## Implementation

**Single change — `normalize` function only.**

### Before (pre-892)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/\s{2,}/g, ' ')
}
```

### After (post-892)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')        // strip trailing punctuation
    .replace(/^please\s+/, '')     // Sprint 892 — strip leading "please " politeness token
    .replace(/\s+please$/, '')     // Sprint 892 — strip trailing " please" politeness token
    .trim()                        // re-trim after politeness strip
    .replace(/\s{2,}/g, ' ')
}
```

### Design decisions

**Operation order:**
1. Lowercase + trim first (standard normalization)
2. Strip trailing punctuation (`?!.`) — must come before "please" strip so `"open it please?"` → `"open it please"` → `"open it"`
3. Strip leading `"please "` — `/^please\s+/` — requires at least one space after "please" to avoid stripping "pleasantries" or any future phrase starting with the word
4. Strip trailing `" please"` — `/\s+please$/` — requires at least one space before "please" to avoid stripping from within words
5. `.trim()` again — safety net after politeness strip (shouldn't be needed but prevents any edge case)
6. Collapse multi-spaces

**Single-side stripping:** `/^please\s+/` only fires when "please" is the first token.
`/\s+please$/` only fires when "please" is the last token. Internal "please" in an unusual
phrase is preserved.

**Double-strip:** `"please open it please"` → strip leading → `"open it please"` → strip trailing → `"open it"`. The two replacements run in sequence in the same chain, so double wrapping is handled correctly.

**"please" alone:** `"please"` → no trailing space (no match for `/^please\s+/`) → no preceding space (no match for `/\s+please$/`) → `"please"` (wc=1) → no pattern matches → `null`. Correct — "please" alone is not a follow-up command.

---

## Phrase Coverage Verification (post-892)

All phrases normalized and tested against actual pattern arrays:

### Audit-specified phrases

| Phrase | Normalized (post-892) | Matched by | Pattern group |
|---|---|---|---|
| "open it please" | `"open it"` | `/^open (it\|that\|this)( for me)?$/` | ANAPHORIC ✅ |
| "show me please" | `"show me"` | `/^show me$/` | ANAPHORIC ✅ |
| "bring it up please" | `"bring it up"` | `/^bring (it\|that\|this) up$/` | ANAPHORIC ✅ |
| "navigate there please" | `"navigate there"` | `/^navigate (there\|to it\|...)$/` | ANAPHORIC ✅ |
| "please show me" | `"show me"` | `/^show me$/` | ANAPHORIC ✅ |
| "please open it" | `"open it"` | `/^open (it\|that\|this)( for me)?$/` | ANAPHORIC ✅ |

### Additional coverage (all ✅)

| Phrase | Normalized | Pattern group |
|---|---|---|
| "please bring it up" | `"bring it up"` | ANAPHORIC |
| "please navigate there" | `"navigate there"` | ANAPHORIC |
| "what is that please" | `"what is that"` | ELABORATION |
| "please tell me more" | `"tell me more"` | ELABORATION |
| "what should I do next please" | `"what should i do next"` | RECOMMENDATION |
| "please what now" | `"what now"` | RECOMMENDATION |
| "please open it please" | `"open it"` | ANAPHORIC (double strip) |
| "take me there please" | `"take me there"` | ANAPHORIC |
| "pull it up please" | `"pull it up"` | ANAPHORIC |
| "let me see it please" | `"let me see it"` | ANAPHORIC |
| "open that for me please" | `"open that for me"` | ANAPHORIC |

### Edge cases (all ✅)

| Phrase | Normalized | Result | Correct? |
|---|---|---|---|
| "please" | `"please"` | NONE (no match, returns null) | ✅ |
| "pleasantries" | `"pleasantries"` | NONE (strip requires trailing space) | ✅ |
| "please please" | `"please"` (leading "please " stripped; trailing "please" has no preceding space) | NONE | ✅ |

---

## Word Count Guard — Post-892 Behavior

The `normalize` function runs before `wordCount`. Stripping "please" reduces word count:

| Input phrase | Pre-strip wc | Post-strip wc | Guard (isAnaphoric ≤6) | Matched? |
|---|---|---|---|---|
| "open it please" | 3 | 2 | ✅ within | ✅ |
| "show me please" | 3 | 2 | ✅ within | ✅ |
| "what should I do next please" | 6 | 5 | ✅ within recommendation guard (≤10) | ✅ |
| "please open it" | 3 | 2 | ✅ within | ✅ |

All stripped phrases remain within the word-count guard for their respective pattern groups.
No phrase was previously excluded only by the word-count guard — all were excluded by pattern mismatch.

---

## Behavior Unchanged (post-892)

All behavior for existing phrases (without "please") is identical — the "please" strip regexes
only fire when the leading/trailing token is exactly "please " or " please":

| Phrase | Pre-892 behavior | Post-892 behavior | Changed? |
|---|---|---|---|
| "show me" | ANAPHORIC → navigate | identical | ❌ no |
| "open it" | ANAPHORIC → navigate | identical | ❌ no |
| "tell me more" | ELABORATION → elaborate | identical | ❌ no |
| "what now" | RECOMMENDATION → recommend | identical | ❌ no |
| "take me there" | ANAPHORIC → navigate | identical | ❌ no |
| "go there" | ANAPHORIC → navigate | identical | ❌ no |
| "why is that important" | ELABORATION → elaborate | identical | ❌ no |
| "navigate there" | ANAPHORIC → navigate | identical | ❌ no |

**All existing behavior preserved.** ✅

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
| No new pattern groups | ✅ |
| No ANAPHORIC_PATTERNS changes | ✅ |
| No SEQUENTIAL_PATTERNS changes | ✅ |
| No ELABORATION_PATTERNS changes | ✅ |
| No RECOMMENDATION_PATTERNS changes | ✅ |
| No TIME_SHIFT_PATTERNS changes | ✅ |
| No TOPIC_SHIFT_PATTERNS changes | ✅ |
| No branch logic changes | ✅ |
| No handler priority changes | ✅ |
| No response copy changes | ✅ |
| No navigation changes | ✅ |
| No return payload shape changes | ✅ |
| DonnaAssistantButton.tsx not touched | ✅ |
| All certified families (Sprint 891) unchanged | ✅ |
| TypeScript clean | ✅ |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | `normalize` function updated: 2 new `.replace()` calls added after trailing-punctuation strip — `/^please\s+/` strips leading "please " token; `/\s+please$/` strips trailing " please" token; `.trim()` added after strips as safety net; Sprint 892 inline comments added; all pattern arrays, branch logic, handlers, copy, and navigation unchanged |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_NORMALIZER_PLEASE_STRIP_892.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` | Sprint 891 state, freeze recommendation |
| `docs/DONNA_FOLLOW_UP_PATTERN_EXPANSION_889.md` | Pattern expansion reference |
| `src/lib/donna/donnaFollowUpResolver.ts` | Normalizer audit + implementation |
| `docs/CHANGELOG.md` | Changelog current state |

---

## Known Limitations (post-892)

**No "please" gaps remain** for any phrase that is already covered by an existing pattern.
All polite variants of all 6 pattern groups are now handled.

**Minor items not yet addressed (Sprint 891 list, unchanged):**
1. `"Can you take me there?"` — `wc = 5`, could be added to ANAPHORIC_PATTERNS if observed in real usage; "please" strip does not affect this (it's a "can you" prefix, not "please")
2. `"Go ahead and open it"` — `wc = 6`, borderline phrase; not yet observed

These remain acceptable future additions if observed. Neither is blocked by the normalizer.

---

## Sprint 893 Recommendation

**Option A — DONNA Normalizer "Can You" Prefix Strip V1**

Extend the normalizer to strip a leading `"can you "` prefix so `"can you show me"`, `"can you open it"`, `"can you navigate there"` match existing patterns. Similar approach to Sprint 892. Pre-audit: `"can you show me"` does not match `/^show me$/` (the existing `/^(can you )?show (it|that|those|them) to me$/` pattern covers a specific form, but not the bare `"can you show me"`). Would cover all "can you" prefixed variants of all existing patterns without new pattern entries.

**Option B — Resolver Freeze + Next Feature Sprint**

Close the normalizer enhancement track and begin the next DONNA capability area.
